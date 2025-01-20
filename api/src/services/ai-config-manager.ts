import { Redis } from 'ioredis';
import { Collection } from 'mongodb';
import { logger } from '../utils/logger';
import { AIConfig, ModelConfig } from '../types/ai-config';
import EventEmitter from 'events';

export class AIConfigManager {
  private static _instance: AIConfigManager;
  private localCache: AIConfig;
  private redis: Redis;
  private mongoCollection: Collection;
  private eventEmitter: EventEmitter;
  private readonly CACHE_KEY = 'ai_config:current';
  private readonly PUBSUB_CHANNEL = 'ai_config:updates';

  private constructor(redis: Redis, mongoCollection: Collection) {
    this.redis = redis;
    this.mongoCollection = mongoCollection;
    this.eventEmitter = new EventEmitter();
    // 初始化本地缓存
    this.localCache = {
      models: {},
      version: 0,
      updated_at: new Date()
    };
  }

  public static async getInstance(): Promise<AIConfigManager> {
    if (!AIConfigManager._instance) {
      throw new Error('AIConfigManager not initialized. Call initialize() first.');
    }
    return AIConfigManager._instance;
  }

  public static async initialize(redis: Redis, mongoCollection: Collection): Promise<AIConfigManager> {
    if (!AIConfigManager._instance) {
      AIConfigManager._instance = new AIConfigManager(redis, mongoCollection);
      await AIConfigManager._instance.setupSubscriber();
      await AIConfigManager._instance.loadInitialConfig();
    }
    return AIConfigManager._instance;
  }

  private async setupSubscriber() {
    const subscriber = this.redis.duplicate();
    
    subscriber.subscribe(this.PUBSUB_CHANNEL, (err) => {
      if (err) {
        logger.error('Failed to subscribe to config updates:', err);
      }
    });

    subscriber.on('message', async (channel, message) => {
      if (channel === this.PUBSUB_CHANNEL) {
        const newVersion = parseInt(message);
        await this.refreshCache(newVersion);
      }
    });
  }

  private async loadInitialConfig() {
    try {
      // 尝试从Redis加载
      let config = await this.loadFromRedis();
      
      if (!config) {
        // Redis没有则从MongoDB加载
        config = await this.loadFromMongo();
        
        if (!config) {
          // 如果MongoDB也没有，使用默认配置
          config = this.localCache;
          
          // 保存初始配置到MongoDB和Redis
          await this.saveConfig(config);
        } else {
          // 写入Redis
          await this.saveToRedis(config);
        }
      }

      this.localCache = config;
    } catch (error) {
      logger.error('Failed to load initial config:', error);
      throw error;
    }
  }

  private async saveConfig(config: AIConfig) {
    await Promise.all([
      this.saveToMongo(config),
      this.saveToRedis(config)
    ]);
  }

  private async saveToMongo(config: AIConfig) {
    try {
      await this.mongoCollection.insertOne(config);
    } catch (error) {
      logger.error('Failed to save config to MongoDB:', error);
      throw error;
    }
  }

  private async saveToRedis(config: AIConfig) {
    try {
      await this.redis.set(this.CACHE_KEY, JSON.stringify(config));
    } catch (error) {
      logger.error('Failed to save config to Redis:', error);
      throw error;
    }
  }

  private async loadFromRedis(): Promise<AIConfig | null> {
    try {
      const data = await this.redis.get(this.CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to load from Redis:', error);
      return null;
    }
  }

  private async loadFromMongo(): Promise<AIConfig | null> {
    try {
      return await this.mongoCollection.findOne(
        {},
        { sort: { version: -1 } }
      ) as AIConfig | null;
    } catch (error) {
      logger.error('Failed to load from MongoDB:', error);
      return null;
    }
  }

  async getConfig(): Promise<AIConfig> {
    return this.localCache;
  }

  async updateConfig(newConfig: AIConfig): Promise<void> {
    try {
      if (!newConfig.models) {
        newConfig.models = {};
      }
      if (!newConfig.version) {
        newConfig.version = this.localCache.version + 1;
      }
      newConfig.updated_at = new Date();

      // 保存配置
      await this.saveConfig(newConfig);

      // 通知其他实例
      await this.redis.publish(this.PUBSUB_CHANNEL, newConfig.version.toString());

      // 更新本地缓存
      this.localCache = newConfig;

      logger.info(`Config updated to version ${newConfig.version}`);
    } catch (error) {
      logger.error('Failed to update config:', error);
      throw error;
    }
  }

  private async refreshCache(version: number) {
    try {
      if (this.localCache.version >= version) {
        return;
      }

      const newConfig = await this.loadFromRedis();
      if (newConfig && newConfig.version > this.localCache.version) {
        this.localCache = newConfig;
        logger.info(`Local cache updated to version ${newConfig.version}`);
      }
    } catch (error) {
      logger.error('Failed to refresh cache:', error);
    }
  }

  async getModelConfig(modelName: string): Promise<ModelConfig | null> {
    return this.localCache.models[modelName] || null;
  }

  // 获取上游数量
  async getUpstreamCount(): Promise<number> {
    const configs = await this.mongoCollection.find({}).toArray();
    return configs.length;
  }

  // 获取指定时间点之前的上游数量
  async getUpstreamCountBefore(date: Date): Promise<number> {
    const configs = await this.mongoCollection.find({
      createdAt: { $lt: date }
    }).toArray();
    return configs.length;
  }
} 