import { Express, Request, Response } from 'express';
import { IUser } from '../models/user';
import jwt from 'jsonwebtoken';
import { Config } from '../types';
import { loadConfig } from '../config';
import { createAdminAuthMiddleware } from '../middleware/auth';
import { getMongoDb } from '../database';
import { User } from '../models/user';
import { logger } from '../utils/logger';
import { ObjectId } from 'mongodb';
import { TokenManager } from '../services/token-manager';

export async function setupAdminRoutes(app: Express) {
  const config = await loadConfig() as Config;
  const JWT_SECRET = config.jwt?.secret || 'your-secret-key';
  const adminAuthMiddleware = await createAdminAuthMiddleware();
  
  // 使用 try-catch 来处理数据库连接
  try {
    const db = getMongoDb();
    const usersCollection = db.collection('users');

    // 检查是否存在管理员用户的接口
    app.get('/api/admin/check-admin-exists', async (req: Request, res: Response) => {
      try {
        const adminUser = await usersCollection.findOne({ role: 'admin' });
        res.json({ exists: !!adminUser });
      } catch (error) {
        res.status(500).json({ 
          message: '检查失败', 
          error: (error as Error).message 
        });
      }
    });

    // 注册接口
    app.post('/api/admin/register', async (req: Request, res: Response) => {
      try {
        const { username, password, email } = req.body;
        
        // 检查用户是否已存在
        const existingUser = await usersCollection.findOne({ 
          $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
          return res.status(400).json({ 
            message: '用户名或邮箱已存在' 
          });
        }

        // 创建新用户
        const hashedPassword = await User.hashPassword(password);
        const user: IUser = {
          username,
          password: hashedPassword,
          email,
          role: 'admin',
          createdAt: new Date()
        };

        const result = await usersCollection.insertOne(user);
        user._id = result.insertedId;

        // 生成JWT
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: '注册成功',
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      } catch (error) {
        res.status(500).json({ 
          message: '注册失败', 
          error: (error as Error).message 
        });
      }
    });

    // 登录接口
    app.post('/api/admin/login', async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;
        
        // 查找用户
        const user = await usersCollection.findOne({ username }) as IUser;
        if (!user) {
          return res.status(401).json({ 
            message: '用户名或密码错误' 
          });
        }

        // 验证密码
        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ 
            message: '用户名或密码错误' 
          });
        }

        // 生成JWT
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          message: '登录成功',
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      } catch (error) {
        res.status(500).json({ 
          message: '登录失败', 
          error: (error as Error).message 
        });
      }
    });

    // 创建新的 API Token
    app.post('/api/admin/tokens', adminAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const {
          name,
          expires_at,
          allowed_models,
          balance,
          description
        } = req.body;

        // 验证必要字段
        if (!name || !expires_at || !balance) {
          return res.status(400).json({
            error: 'Missing required fields: name, expires_at, balance'
          });
        }

        const tokenManager = await TokenManager.getInstance();
        // 使用 JWT 中的用户 ID
        const userId = new ObjectId(req.user._id);

        const token = await tokenManager.createToken(
          name,
          userId,
          new Date(expires_at),
          allowed_models || [],
          balance,
          description
        );

        // 返回时排除敏感信息
        const { _id, token: tokenString, name: tokenName, expires_at: expiryDate, description: tokenDescription } = token;
        res.json({
          id: _id,
          token: tokenString,
          name: tokenName,
          expires_at: expiryDate,
          description: tokenDescription
        });

      } catch (error: any) {
        logger.error('Failed to create token:', error);
        res.status(500).json({ error: 'Failed to create token' });
      }
    });

    // 获取 Token 列表
    app.get('/api/admin/tokens', adminAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const tokenManager = await TokenManager.getInstance();
        // 使用 JWT 中的用户 ID
        const userId = new ObjectId(req.user._id);
        const tokens = await tokenManager.listTokens(userId);

        // 返回时排除敏感信息
        const safeTokens = tokens.map(({ _id, name, created_at, expires_at, is_active, balance, allowed_models, description }) => ({
          id: _id,
          name,
          created_at,
          expires_at,
          is_active,
          balance,
          allowed_models,
          description
        }));

        res.json(safeTokens);

      } catch (error: any) {
        logger.error('Failed to list tokens:', error);
        res.status(500).json({ error: 'Failed to list tokens' });
      }
    });

    // 停用 Token
    app.post('/api/admin/tokens/:tokenId/deactivate', adminAuthMiddleware, async (req: Request, res: Response) => {
      try {
        const { tokenId } = req.params;
        // 使用 JWT 中的用户 ID
        const userId = new ObjectId(req.user._id);
        
        const tokenManager = await TokenManager.getInstance();
        const success = await tokenManager.deactivateToken(new ObjectId(tokenId), userId);

        if (!success) {
          return res.status(404).json({ error: 'Token not found or already deactivated' });
        }

        res.json({ message: 'Token deactivated successfully' });

      } catch (error: any) {
        logger.error('Failed to deactivate token:', error);
        res.status(500).json({ error: 'Failed to deactivate token' });
      }
    });

  } catch (error) {
    logger.error('Failed to setup admin routes:', error);
    throw error;
  }
} 