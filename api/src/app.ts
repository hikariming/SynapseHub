import express from 'express';
import cors from 'cors';
import { loadConfig } from './config';
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { connectDatabase } from './database';
import { logger } from './utils/logger';
import { setupDifyRoutes } from './routes/dify_format';
import { AIConfigManager } from './services/ai-config-manager';
import { TokenManager } from './services/token-manager';
import { ChatLog } from './models/chatData';
import { Redis } from 'ioredis';
import { MongoClient } from 'mongodb';
import { dashboardRoutes } from './routes/dashboard';
import { setupLogsRoutes } from './routes/logs';
import { setupUserRoutes } from './routes/users';

const app = express();
const port = process.env.PORT || 3088;

async function bootstrap() {
  try {
    // 初始化数据库连接
    await connectDatabase();
    
    // 加载基础配置
    const config = await loadConfig();
    
    // 初始化Redis和MongoDB客户端
    const redis = new Redis(config.database.redis_uri);
    const mongoClient = await MongoClient.connect(config.database.mongo_uri);
    const db = mongoClient.db();
    
    // 初始化AI配置管理器
    const aiConfigCollection = db.collection('ai_configs');
    const aiConfigManager = await AIConfigManager.initialize(redis, aiConfigCollection);
    
    // 初始化Token管理器
    const tokenCollection = db.collection('tokens');
    const tokenManager = await TokenManager.initialize(tokenCollection);
    
    // 将管理器实例添加到app中
    app.set('aiConfigManager', aiConfigManager);
    app.set('tokenManager', tokenManager);
    
    // 配置 Redis
    const redisConfig = {
      host: redis.options.host,
      port: redis.options.port,
      password: redis.options.password,
      db: redis.options.db
    };
    app.set('redisConfig', redisConfig);
    
    // 配置 CORS
    app.use(cors({
      origin: '*',  // 允许所有来源
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],  // 允许所有常用方法
      allowedHeaders: '*',  // 允许所有请求头
      credentials: false,  // 由于使用 '*'，credentials 必须设置为 false
      maxAge: 86400
    }));
    
    // 设置中间件
    setupMiddleware(app);
    
    // 设置路由
    setupRoutes(app);
    
    // 设置 Dify 格式的路由
    setupDifyRoutes(app);

    // 设置 Dashboard 路由
    app.use('/api/dashboard', dashboardRoutes);

    // 设置日志路由
    await setupLogsRoutes(app);
    
    // 设置用户路由
    await setupUserRoutes(app);
    
    // 在应用启动时确保索引已创建
    await ensureIndexes();
    
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 在应用启动时确保索引已创建
async function ensureIndexes() {
  try {
    await ChatLog.ensureIndexes();
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create database indexes:', error);
  }
}

bootstrap(); 