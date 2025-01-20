import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRequestLogger } from '../utils/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  const userId = req.headers['x-user-id']?.toString();
  const ip = req.ip;
  
  // 设置请求开始时间
  (req as any).startTime = Date.now();
  
  // 为每个请求创建一个日志记录器
  const requestLogger = createRequestLogger(requestId, userId, ip);
  
  // 将日志记录器添加到请求对象中
  (req as any).logger = requestLogger;

  // 记录请求开始
  requestLogger.info('Request started', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  // 记录响应
  const chunks: Buffer[] = [];

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  // 重写 write 方法
  res.write = function(chunk: any, encodingOrCallback?: string | ((error: Error | null | undefined) => void), callback?: (error: Error | null | undefined) => void): boolean {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }
    return originalWrite(chunk, encodingOrCallback as BufferEncoding, callback);
  };

  // 重写 end 方法
  res.end = function(chunk?: any, encodingOrCallback?: string | (() => void), callback?: () => void): Response {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }

    // 记录请求完成
    requestLogger.info('Request completed', {
      statusCode: res.statusCode,
      responseTime: Date.now() - (req as any).startTime,
      responseSize: chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    });

    return originalEnd(chunk, encodingOrCallback as BufferEncoding, callback);
  };

  next();
} 