import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loadConfig } from '../config';
import { Config } from '../types';
import { getMongoDb } from '../database';
import { ObjectId } from 'mongodb';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function createAuthMiddleware() {
  const config = await loadConfig() as Config;
  
  if (!config.jwt?.secret) {
    throw new Error('JWT secret is not configured. Please check your configuration.');
  }

  const JWT_SECRET = config.jwt.secret;
  const JWT_EXPIRES_IN = config.jwt?.expiresIn || '7d';
  
  const db = await getMongoDb();
  const usersCollection = db.collection('users');

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });

      if (!user) {
        return res.status(401).json({ message: '用户不存在' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: '无效的认证令牌' });
    }
  };
}

export async function createAdminAuthMiddleware() {
  const authMiddleware = await createAuthMiddleware();

  return async (req: Request, res: Response, next: NextFunction) => {
    await authMiddleware(req, res, () => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: '需要管理员权限' });
      }
      next();
    });
  };
} 