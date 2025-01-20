import winston from 'winston';
import Transport from 'winston-transport';
import { SystemLog, LogLevel } from '../models/systemLog';

// 创建自定义的 MongoDB 传输器
class MongoTransport extends Transport {
  constructor() {
    super();
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      const logData = {
        level: info.level as LogLevel,
        message: info.message,
        timestamp: new Date(),
        service: 'api',
        metadata: info,
        stack: info.stack,
        request_id: info.requestId,
        user_id: info.userId,
        ip: info.ip
      };

      await SystemLog.create(logData);
    } catch (error) {
      console.error('Failed to save log to MongoDB:', error);
    }

    callback();
  }
}

// 创建 Winston logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // MongoDB 存储
    new MongoTransport()
  ]
});

// 扩展 logger 接口以支持更多上下文信息
export interface ExtendedLogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// 创建请求上下文的日志记录器
export function createRequestLogger(requestId: string, userId?: string, ip?: string): ExtendedLogger {
  return {
    info(message: string, meta: any = {}) {
      logger.info(message, { ...meta, requestId, userId, ip });
    },
    warn(message: string, meta: any = {}) {
      logger.warn(message, { ...meta, requestId, userId, ip });
    },
    error(message: string, meta: any = {}) {
      logger.error(message, { ...meta, requestId, userId, ip });
    },
    debug(message: string, meta: any = {}) {
      logger.debug(message, { ...meta, requestId, userId, ip });
    }
  };
} 