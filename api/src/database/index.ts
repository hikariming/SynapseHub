import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';
import { logger } from '../utils/logger';
import { loadConfig } from '../config';

let mongoClient: MongoClient | null = null;

export async function connectDatabase() {
  try {
    // 首先加载配置
    const config = await loadConfig();
    
    if (!config.database?.mongo_uri) {
      throw new Error('MongoDB URI is not configured');
    }

    const mongoUri = config.database.mongo_uri;
    
    const options = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 50,
    };

    // 连接 MongoDB (mongoose)
    await mongoose.connect(mongoUri, options);
    
    // 连接 MongoDB (native client)
    mongoClient = await MongoClient.connect(mongoUri);
    
    logger.info('MongoDB connected successfully');

    // 设置连接事件监听器
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

export function getMongoDb(): Db {
  if (!mongoClient) {
    throw new Error('MongoDB client not initialized');
  }
  return mongoClient.db();
}

export async function closeDatabase() {
  try {
    if (mongoClient) {
      await mongoClient.close();
    }
    await mongoose.disconnect();
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
} 