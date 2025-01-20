import Redis from 'ioredis';
import { Config } from '../types';
import { DifyMessage, DifyConversation } from '../types/dify';
import crypto from 'crypto';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class RedisService {
  private client: Redis;

  constructor(config: RedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db
    });
  }

  // 生成唯一ID
  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // 保存消息
  async saveMessage(message: DifyMessage): Promise<void> {
    const key = `message:${message.id}`;
    await this.client.set(key, JSON.stringify(message));
    
    // 将消息ID添加到会话消息列表
    const conversationKey = `conversation:${message.conversation_id}:messages`;
    await this.client.lpush(conversationKey, message.id);
  }

  // 获取消息
  async getMessage(messageId: string): Promise<DifyMessage | null> {
    const key = `message:${messageId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // 创建新会话
  async createConversation(userId: string): Promise<DifyConversation> {
    const conversation: DifyConversation = {
      id: this.generateId(),
      name: "New chat",
      inputs: {},
      status: "normal",
      introduction: "",
      created_at: Date.now(),
      updated_at: Date.now()
    };

    const key = `conversation:${conversation.id}`;
    await this.client.set(key, JSON.stringify(conversation));
    
    // 将会话ID添加到用户的会话列表
    const userKey = `user:${userId}:conversations`;
    await this.client.lpush(userKey, conversation.id);

    return conversation;
  }

  // 获取会话历史消息
  async getConversationMessages(
    conversationId: string,
    limit: number = 20,
    firstId?: string
  ): Promise<DifyMessage[]> {
    const key = `conversation:${conversationId}:messages`;
    let start = 0;
    
    if (firstId) {
      const index = await this.client.lpos(key, firstId);
      if (index !== null) {
        start = index + 1;
      }
    }
    
    const messageIds = await this.client.lrange(key, start, start + limit - 1);
    const messages = await Promise.all(
      messageIds.map(id => this.getMessage(id))
    );
    
    return messages.filter((m): m is DifyMessage => m !== null);
  }
} 