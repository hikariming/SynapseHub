import express from 'express';
import { requestLoggerMiddleware } from './logger';

export function setupMiddleware(app: express.Express) {
  // 基础中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // 日志中间件
  app.use(requestLoggerMiddleware);
  
  // 其他中间件...
} 