import { Express, Request, Response } from 'express';
import { ModelConfig, ModelEndpoint } from '../types/ai-config';
import axios, { AxiosResponse, ResponseType } from 'axios';
import { logger } from '../utils/logger';
import { AIConfigManager } from '../services/ai-config-manager';
import { TokenManager } from '../services/token-manager';
import { ChatLog, ChatLogDocument, MessageRole } from '../models/chatData';
import mongoose from 'mongoose';

// 使用 Map 来存储负载均衡状态，性能更好
const endpointIndexMap = new Map<string, number>();

// 负载均衡器 - Round Robin 实现
function getNextEndpoint(modelConfig: ModelConfig): ModelEndpoint {
  const endpoints = modelConfig.endpoints;
  const modelName = modelConfig.type;
  
  let currentIndex = endpointIndexMap.get(modelName) || 0;
  const endpoint = endpoints[currentIndex];
  
  // 添加负载均衡日志
  logger.info({
    message: 'Load balancer selected endpoint',
    modelName,
    currentIndex,
    selectedEndpoint: endpoint.name,
    totalEndpoints: endpoints.length
  });
  
  // 更新索引
  endpointIndexMap.set(modelName, (currentIndex + 1) % endpoints.length);
  
  return endpoint;
}

// 处理流式响应
async function handleStreamResponse(
  response: AxiosResponse, 
  res: Response,
  endpoint: ModelEndpoint
) {
  // 设置正确的响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 直接将上游响应pipe到客户端
    response.data.pipe(res);

    // 处理错误
    response.data.on('error', (error: Error) => {
      logger.error('Stream error:', error);
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
    timeout: 60000, // 增加超时时间到60秒
    responseType: (isStream ? 'stream' : 'json') as ResponseType
  };
}

export function setupChatRoutes(app: Express) {
  app.post('/v1/chat/completions', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    try {
      // 获取并验证 token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.split(' ')[1];
      const tokenManager = await TokenManager.getInstance();
      const modelName = req.body.model;

      // 验证 token 对特定模型的访问权限
      const tokenValidation = await tokenManager.validateTokenForModel(token, modelName);
      
      if (!tokenValidation.isValid) {
        return res.status(401).json({ 
          error: tokenValidation.error || 'Invalid token'
        });
      }

      // 使用 getInstance() 方法获取实例
      const configManager = await AIConfigManager.getInstance();
      const modelConfig = await configManager.getModelConfig(modelName);

      // 添加请求详情日志
      logger.info({
        message: 'Received chat request',
        requestId,
        modelName,
        isStream: req.body.stream === true,
        messageCount: req.body.messages?.length
      });

      // 请求验证
      if (!modelConfig) {
        return res.status(400).json({ error: `Model ${modelName} not found` });
      }

      if (!req.body.messages || !Array.isArray(req.body.messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
      }

      // 获取模型
      const endpoint = getNextEndpoint(modelConfig);

      // 记录请求开始（增加更多细节）
      logger.info({
        message: 'Chat request started',
        requestId,
        model: modelName,
        endpoint: {
          name: endpoint.name,
          url: endpoint.upstream_url,
          format: endpoint.format || 'default'
        },
        requestSize: JSON.stringify(req.body).length
      });

      // 创建请求配置
      const requestConfig = createRequestConfig(endpoint, req.body, req.body.stream === true);

      // 准备日志数据
      const logData: Partial<ChatLogDocument> = {
        user_id: req.headers['x-user-id']?.toString() || 'anonymous',
        conversation_id: req.body.conversation_id || requestId,
        modelName: modelName,
        messages: req.body.messages.map((msg: any) => ({
          role: msg.role,
          content: {
            text: typeof msg.content === 'string' ? msg.content : msg.content.text,
            image_url: Array.isArray(msg.content.image_url) ? msg.content.image_url : undefined
          },
          name: msg.name,
          function_call: msg.function_call,
          timestamp: new Date()
        })),
        metadata: {
          ip: req.ip,
          user_agent: req.headers['user-agent'],
          request_id: requestId
        },
        created_at: new Date(),
        updated_at: new Date()
      };

      // 使用 try-catch 包装日志保存逻辑
      try {
        // 检查数据库连接状态
        if (mongoose.connection.readyState !== 1) {
          logger.error({
            message: 'Database not connected',
            requestId,
            connectionState: mongoose.connection.readyState
          });
          
          // 尝试重新连接
          await mongoose.connect(process.env.MONGODB_URI as string);
        }

        const savedLog = await ChatLog.create(logData);
        logger.info({
          message: 'Chat log saved successfully',
          requestId,
          logId: savedLog._id,
          conversationId: savedLog.conversation_id
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

      // 发送请求
      const response = await axios(requestConfig);

      // 处理响应和计费
      if (!req.body.stream) {
        // 计算token使用量并扣除余额
        const totalTokens = response.data.usage?.total_tokens || 0;
        const tokenCost = totalTokens * (modelConfig.cost_per_token || 0.0001); // 默认成本

        // 扣除token余额
        const balanceDeducted = await tokenManager.deductTokenBalance(
          tokenValidation.token!._id!,
          tokenCost
        );

        if (!balanceDeducted) {
          logger.error({
            message: 'Failed to deduct token balance',
            requestId,
            tokenId: tokenValidation.token!._id!.toString(),
            cost: tokenCost
          });
          // 继续处理，因为请求已经完成
        }

        // 更新日志中添加token使用信息
        try {
          const updateResult = await ChatLog.findOneAndUpdate(
            { conversation_id: logData.conversation_id },
            { 
              $set: {
                total_tokens: response.data.usage?.total_tokens,
                completion_tokens: response.data.usage?.completion_tokens,
                prompt_tokens: response.data.usage?.prompt_tokens,
                token_cost: tokenCost,
                token_id: tokenValidation.token!._id,
                updated_at: new Date()
              },
              $push: {
                messages: {
                  role: MessageRole.ASSISTANT,
                  content: {
                    text: response.data.choices[0].message.content
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
            conversationId: logData.conversation_id,
            updateResult: !!updateResult,
            tokenCost,
            totalTokens
          });
        } catch (error: any) {
          logger.error({
            message: 'Failed to update chat log',
            error: error.message,
            errorStack: error.stack,
            requestId,
            conversationId: logData.conversation_id
          });
        }

        res.json(response.data);
      } else {
        await handleStreamResponse(response, res, endpoint);
      }

      // 记录请求完成（增加更多指标）
      logger.info({
        message: 'Chat request completed',
        requestId,
        duration: Date.now() - startTime,
        model: modelName,
        endpoint: endpoint.name,
        responseSize: req.body.stream === true ? 'streaming' : JSON.stringify(response.data).length,
        statusCode: response.status
      });

    } catch (error: any) {
      // 错误日志增加更多细节
      logger.error({
        message: 'Chat request failed',
        requestId,
        error: error.message,
        errorStack: error.stack,
        duration: Date.now() - startTime,
        statusCode: error.response?.status,
        errorResponse: error.response?.data
      });

      // 错误处理
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error?.message || 'Internal server error';

      if (!res.headersSent) {
        res.status(statusCode).json({
          error: {
            message: errorMessage,
            type: error.response?.data?.error?.type,
            code: statusCode,
            request_id: requestId
          }
        });
      }
    }
  });
} 