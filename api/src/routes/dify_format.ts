import { Express, Request, Response } from 'express';
import { ModelConfig, ModelEndpoint } from '../types';
import { DifyMessageRequest, DifyMessage } from '../types/dify';
import { RedisService, RedisConfig } from '../services/redis';
import axios, { AxiosResponse, ResponseType } from 'axios';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { TokenManager } from '../services/token-manager';
import { ChatLog, ChatLogDocument, MessageRole } from '../models/chatData';
import mongoose from 'mongoose';
import { Token } from '../models/token';
import { AIConfigManager } from '../services/ai-config-manager';

// 使用 Map 来存储负载均衡状态，性能更好
const endpointIndexMap = new Map<string, number>();

// 负载均衡器 - Round Robin 实现
function getNextEndpoint(modelConfig: ModelConfig): ModelEndpoint {
  const endpoints = modelConfig.endpoints.filter(ep => ep.status && ep.health_check?.is_healthy);
  if (endpoints.length === 0) {
    throw new Error('No healthy endpoints available');
  }

  const modelName = modelConfig.type;
  let currentIndex = endpointIndexMap.get(modelName) || 0;
  
  // 根据权重选择端点
  if (modelConfig.load_balance === 'weighted_round_robin') {
    let totalWeight = endpoints.reduce((sum, ep) => sum + (ep.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < endpoints.length; i++) {
      random -= endpoints[i].weight || 1;
      if (random <= 0) {
        currentIndex = i;
        break;
      }
    }
  } else if (modelConfig.load_balance === 'random') {
    currentIndex = Math.floor(Math.random() * endpoints.length);
  }
  
  const endpoint = endpoints[currentIndex];
  
  // 添加负载均衡日志
  logger.info({
    message: 'Load balancer selected endpoint',
    modelName,
    currentIndex,
    selectedEndpoint: endpoint.name,
    totalEndpoints: endpoints.length,
    loadBalanceStrategy: modelConfig.load_balance
  });
  
  // 更新索引
  endpointIndexMap.set(modelName, (currentIndex + 1) % endpoints.length);
  
  return endpoint;
}

// 处理流式响应
async function handleStreamResponse(
  response: AxiosResponse, 
  res: Response,
  endpoint: ModelEndpoint,
  message: DifyMessage,
  redis: RedisService
) {
  // 设置响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let answer = '';
  let totalTokens = 0;

  try {
    // 处理上游响应数据
    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        
        const content = line.slice(6);
        
        // 处理特殊的 [DONE] 消息
        if (content.trim() === '[DONE]') {
          continue;
        }

        try {
          const data = JSON.parse(content);
          if (!data.choices?.[0]?.delta?.content) continue;

          const contentDelta = data.choices[0].delta.content;
          answer += contentDelta;
          
          // 估算token数量（简单实现，可以根据需要优化）
          totalTokens += contentDelta.split(/\s+/).length;

          // 构造 Dify 格式的响应
          const difyResponse = {
            event: 'message',
            conversation_id: message.conversation_id,
            message_id: message.id,
            created_at: message.created_at,
            task_id: crypto.randomBytes(16).toString('hex'),
            id: message.id,
            answer: contentDelta,
            from_variable_selector: null,
            metadata: {
              usage: {
                total_tokens: totalTokens
              }
            }
          };

          res.write(`data: ${JSON.stringify(difyResponse)}\n\n`);
        } catch (parseError) {
          logger.error('Error parsing chunk:', parseError, 'content:', content);
          continue;
        }
      }
    });

    // 处理结束
    response.data.on('end', async () => {
      // 发送最终的 message_end 事件
      const endResponse = {
        event: 'message_end',
        conversation_id: message.conversation_id,
        message_id: message.id,
        created_at: message.created_at,
        task_id: crypto.randomBytes(16).toString('hex'),
        id: message.id,
        metadata: {
          usage: {
            prompt_tokens: Math.floor(totalTokens * 0.3), // 估算，可以根据需要调整
            completion_tokens: Math.floor(totalTokens * 0.7),
            total_tokens: totalTokens
          }
        },
        files: null
      };
      
      res.write(`data: ${JSON.stringify(endResponse)}\n\n`);
      res.end();

      // 更新消息的答案和使用量
      message.answer = answer;
      message.usage = {
        prompt_tokens: Math.floor(totalTokens * 0.3),
        completion_tokens: Math.floor(totalTokens * 0.7),
        total_tokens: totalTokens
      };
      await redis.saveMessage(message);

      // 更新健康检查状态
      try {
        const aiConfigManager = await AIConfigManager.getInstance();
        const currentConfig = await aiConfigManager.getConfig();
        const endpointName = endpoint.name; // 保存一个本地引用
        if (message.model_name && currentConfig.models[message.model_name]) {
          const modelConfig = currentConfig.models[message.model_name];
          const endpointIndex = modelConfig.endpoints.findIndex((ep: ModelEndpoint) => ep.name === endpointName);
          if (endpointIndex !== -1) {
            modelConfig.endpoints[endpointIndex].health_check = {
              last_check: new Date(),
              is_healthy: true
            };
            await aiConfigManager.updateConfig(currentConfig);
          }
        }
      } catch (error) {
        logger.error('Failed to update endpoint health status:', error);
      }
    });

    // 处理错误
    response.data.on('error', async (error: Error) => {
      logger.error('Stream error:', error);
      
      // 更新健康检查状态
      try {
        const aiConfigManager = await AIConfigManager.getInstance();
        const currentConfig = await aiConfigManager.getConfig();
        const endpointName = endpoint.name; // 保存一个本地引用
        if (message.model_name && currentConfig.models[message.model_name]) {
          const modelConfig = currentConfig.models[message.model_name];
          const endpointIndex = modelConfig.endpoints.findIndex((ep: ModelEndpoint) => ep.name === endpointName);
          if (endpointIndex !== -1) {
            modelConfig.endpoints[endpointIndex].health_check = {
              last_check: new Date(),
              is_healthy: false
            };
            await aiConfigManager.updateConfig(currentConfig);
          }
        }
      } catch (updateError) {
        logger.error('Failed to update endpoint health status:', updateError);
      }

      res.write(`data: ${JSON.stringify({error: 'Stream error occurred'})}\n\n`);
      res.end();
    });

  } catch (error) {
    logger.error('Stream processing error:', error);
    res.write(`data: ${JSON.stringify({error: 'Stream processing error'})}\n\n`);
    res.end();
  }
}

// 创建请求配置
function createRequestConfig(endpoint: ModelEndpoint, body: any, isStream: boolean) {
  return {
    method: 'post',
    url: endpoint.upstream_url,
    headers: {
      'Authorization': `Bearer ${endpoint.api_key}`,
      'Content-Type': 'application/json',
      'Accept': isStream ? 'text/event-stream' : 'application/json'
    },
    data: {
      ...body,
      stream: isStream
    },
    timeout: 60000,
    responseType: isStream ? 'stream' : 'json'
  } as const;
}

export function setupDifyRoutes(app: Express) {
  // 检查并解析 Redis URI
  const redisConfig = app.get('redisConfig') as RedisConfig;
  if (!redisConfig) {
    throw new Error('Redis configuration is not available');
  }

  const redis = new RedisService(redisConfig);

  app.post('/dify/v1/chat-messages', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const messageId = crypto.randomBytes(16).toString('hex');
    const requestId = Math.random().toString(36).substring(7);
    
    let modelName: string | undefined;
    let endpoint: ModelEndpoint | undefined;
    
    try {
      // 获取并验证 token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.split(' ')[1];
      const tokenManager = await TokenManager.getInstance();

      // 直接从 Token 模型获取 token 信息
      const tokenDoc = await Token.findByToken(token);
      
      if (!tokenDoc) {
        return res.status(401).json({ error: 'Token not found' });
      }

      if (!tokenDoc.is_active) {
        return res.status(401).json({ error: 'Token is inactive' });
      }

      if (tokenDoc.expires_at < new Date()) {
        return res.status(401).json({ error: 'Token has expired' });
      }

      if (tokenDoc.balance <= 0) {
        return res.status(401).json({ error: 'Insufficient balance' });
      }

      // 检查 token 是否只允许访问一个模型
      if (!tokenDoc.allowed_models || tokenDoc.allowed_models.length !== 1) {
        return res.status(400).json({
          error: 'Token must be configured to access exactly one model for Dify format'
        });
      }

      modelName = tokenDoc.allowed_models[0];
      
      // 从 AIConfigManager 获取模型配置
      const aiConfigManager = await AIConfigManager.getInstance();
      const modelConfig = await aiConfigManager.getModelConfig(modelName);
      
      if (!modelConfig) {
        return res.status(400).json({
          error: `Model ${modelName} not found`
        });
      }

      const body = req.body as DifyMessageRequest;
      const isStream = body.response_mode === 'streaming';

      // 验证请求
      if (!body.query || !body.user) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // 获取或创建会话
      let conversationId = body.conversation_id;
      if (!conversationId) {
        const conversation = await redis.createConversation(body.user);
        conversationId = conversation.id;
      }

      // 获取历史消息作为上下文
      const history = await redis.getConversationMessages(conversationId, 10);
      
      // 构建消息
      const message: DifyMessage = {
        id: messageId,
        conversation_id: conversationId,
        inputs: body.inputs || {},
        query: body.query,
        answer: '',
        message_files: [],
        feedback: null,
        retriever_resources: [],
        created_at: Date.now(),
        agent_thoughts: [],
        model_name: modelName
      };

      // 准备日志数据
      const logData: Partial<ChatLogDocument> = {
        user_id: body.user,
        conversation_id: conversationId,
        modelName: modelName,
        messages: [
          ...history.map(m => ({
            role: m.query ? MessageRole.USER : MessageRole.ASSISTANT,
            content: {
              text: m.query || m.answer
            },
            timestamp: new Date(m.created_at)
          })),
          {
            role: MessageRole.USER,
            content: {
              text: body.query
            },
            timestamp: new Date()
          }
        ],
        metadata: {
          ip: req.ip,
          user_agent: req.headers['user-agent'],
          request_id: requestId
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      // 保存日志
      try {
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(process.env.MONGODB_URI as string);
        }
        const savedLog = await ChatLog.create(logData);
        logger.info({
          message: 'Chat log saved successfully',
          requestId,
          logId: savedLog._id,
          conversationId
        });
      } catch (error: any) {
        logger.error({
          message: 'Failed to save chat log',
          error: error.message,
          errorStack: error.stack,
          requestId,
          logData
        });
      }

      // 获取模型端点
      endpoint = getNextEndpoint(modelConfig);

      // 构建请求体
      const messages = [
        ...history.map(m => ({
          role: m.query ? 'user' : 'assistant' as const,
          content: m.query || m.answer
        })),
        {
          role: 'user' as const,
          content: body.query
        }
      ];

      const requestConfig = createRequestConfig(endpoint, {
        model: modelName,
        messages,
        stream: isStream
      }, isStream);

      if (isStream) {
        // 流式响应
        const response = await axios(requestConfig);
        await handleStreamResponse(response, res, endpoint, message, redis);
        
        // 保存消息
        message.answer = ''; // 流式响应中累积
        await redis.saveMessage(message);
        
      } else {
        // 阻塞响应
        const response = await axios(requestConfig);
        message.answer = response.data.choices[0].message.content;
        
        // 计算token使用量
        const usage = response.data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        };
        
        // 更新消息的使用量
        message.usage = usage;
        await redis.saveMessage(message);

        // 计算token成本并扣除余额
        const tokenCost = usage.total_tokens * (modelConfig.cost_per_token || 0.0001);
        const balanceDeducted = await tokenManager.deductTokenBalance(
          tokenDoc._id!,
          tokenCost
        );

        if (!balanceDeducted) {
          logger.error({
            message: 'Failed to deduct token balance',
            requestId,
            tokenId: tokenDoc._id!.toString(),
            cost: tokenCost
          });
        }

        // 更新健康检查状态
        try {
          const aiConfigManager = await AIConfigManager.getInstance();
          const currentConfig = await aiConfigManager.getConfig();
          const endpointName = endpoint.name; // 保存一个本地引用
          if (modelName && currentConfig.models[modelName]) {
            const modelConfig = currentConfig.models[modelName];
            const endpointIndex = modelConfig.endpoints.findIndex((ep: ModelEndpoint) => ep.name === endpointName);
            if (endpointIndex !== -1) {
              modelConfig.endpoints[endpointIndex].health_check = {
                last_check: new Date(),
                is_healthy: true
              };
              await aiConfigManager.updateConfig(currentConfig);
            }
          }
        } catch (error) {
          logger.error('Failed to update endpoint health status:', error);
        }

        // 更新日志
        try {
          const updateResult = await ChatLog.findOneAndUpdate(
            { conversation_id: conversationId },
            {
              $set: {
                total_tokens: usage.total_tokens,
                completion_tokens: usage.completion_tokens,
                prompt_tokens: usage.prompt_tokens,
                token_cost: tokenCost,
                token_id: tokenDoc._id,
                updated_at: new Date()
              },
              $push: {
                messages: {
                  role: MessageRole.ASSISTANT,
                  content: {
                    text: message.answer
                  },
                  timestamp: new Date()
                }
              }
            },
            { new: true }
          );

          logger.info({
            message: 'Chat log updated successfully',
            requestId,
            conversationId,
            updateResult: !!updateResult,
            tokenCost,
            totalTokens: usage.total_tokens
          });
        } catch (error: any) {
          logger.error({
            message: 'Failed to update chat log',
            error: error.message,
            errorStack: error.stack,
            requestId,
            conversationId
          });
        }

        // 返回 Dify 格式的响应
        res.json({
          message_id: message.id,
          conversation_id: message.conversation_id,
          mode: 'chat',
          answer: message.answer,
          metadata: {
            usage: usage,
            retriever_resources: []
          },
          created_at: message.created_at
        });
      }

      // 记录请求完成
      logger.info({
        message: 'Dify chat request completed',
        requestId,
        duration: Date.now() - startTime,
        model: modelName,
        endpoint: endpoint?.name,
        conversationId,
        isStream
      });

    } catch (error: any) {
      // 更新健康检查状态（如果是上游服务错误）
      if (error.response?.status >= 500 && modelName && endpoint) {
        try {
          const aiConfigManager = await AIConfigManager.getInstance();
          const currentConfig = await aiConfigManager.getConfig();
          const endpointName = endpoint.name; // 保存一个本地引用
          if (currentConfig.models[modelName]) {
            const modelConfig = currentConfig.models[modelName];
            const endpointIndex = modelConfig.endpoints.findIndex((ep: ModelEndpoint) => ep.name === endpointName);
            if (endpointIndex !== -1) {
              modelConfig.endpoints[endpointIndex].health_check = {
                last_check: new Date(),
                is_healthy: false
              };
              await aiConfigManager.updateConfig(currentConfig);
            }
          }
        } catch (updateError) {
          logger.error('Failed to update endpoint health status:', updateError);
        }
      }

      logger.error({
        message: 'Dify chat request failed',
        requestId,
        error: error.message,
        errorStack: error.stack,
        duration: Date.now() - startTime,
        statusCode: error.response?.status,
        errorResponse: error.response?.data
      });

      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error?.message || 'Internal server error';

      if (!res.headersSent) {
        res.status(statusCode).json({
          error: {
            message: errorMessage,
            type: error.response?.data?.error?.type || 'api_error',
            code: statusCode,
            request_id: requestId
          }
        });
      }
    }
  });

  // 获取会话历史消息
  app.get('/dify/v1/messages', async (req: Request, res: Response) => {
    try {
      const { conversation_id, user, first_id, limit = 20 } = req.query;
      
      if (!conversation_id || !user) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const messages = await redis.getConversationMessages(
        conversation_id as string,
        Number(limit),
        first_id as string
      );

      res.json({
        limit: Number(limit),
        has_more: messages.length === Number(limit),
        data: messages
      });

    } catch (error: any) {
      logger.error('Get messages failed:', error);
      res.status(500).json({ error: error.message });
    }
  });
} 