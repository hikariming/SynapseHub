import { Express, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { IUser, User } from '../models/user';
import { TokenManager } from '../services/token-manager';
import { logger } from '../utils/logger';
import { Router } from 'express';
import { createAuthMiddleware } from '../middleware/auth';
import { getMongoDb } from '../database';

// 中间件：检查管理员权限
const checkAdminRole = async (req: Request, res: Response, next: Function) => {
  logger.info('Checking admin role for user:', { user: req.user });
  
  if (!req.user) {
    logger.warn('No user found in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    logger.warn('User is not admin:', { userId: req.user._id, role: req.user.role });
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  logger.info('Admin access granted for user:', { userId: req.user._id });
  next();
};

// 中间件：验证用户权限（用户只能访问自己的数据）
const checkUserAccess = async (req: Request, res: Response, next: Function) => {
  const userId = req.user._id;  // 从 req.user 获取用户ID
  const targetUserId = req.params.userId;

  logger.info('Checking user access:', { 
    userId, 
    targetUserId,
    path: req.path,
    method: req.method 
  });

  // 如果是管理员，允许访问所有用户的数据
  if (req.user.role === 'admin') {
    logger.info('Admin access granted');
    return next();
  }

  // 如果是访问 /api/users 列表接口
  if (req.path === '/api/users' && req.method === 'GET') {
    // 普通用户只能看到自己的信息
    req.query.userId = userId.toString();
    logger.info('Limited user list to self only');
    return next();
  }

  // 非管理员只能访问自己的数据
  if (!userId || userId.toString() !== targetUserId) {
    logger.warn('Access denied:', { userId, targetUserId });
    return res.status(403).json({ error: 'Forbidden: Access denied' });
  }

  logger.info('User access granted for own data');
  next();
};

export async function setupUserRoutes(app: Express) {
  const router = Router();
  const authMiddleware = await createAuthMiddleware();
  
  try {
    logger.info('Setting up user routes');
    const db = getMongoDb();
    const usersCollection = db.collection('users');

    // 管理员接口：获取用户列表
    router.get('/api/users', authMiddleware, async (req: Request, res: Response) => {
      try {
        const currentUser = req.user;
        logger.info('Fetching users list', { 
          userId: currentUser._id,
          userRole: currentUser.role,
          query: req.query 
        });
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // 构建查询条件
        const query: any = {};
        
        // 如果不是管理员,只能查看自己的信息
        if (currentUser.role !== 'admin') {
          query._id = new ObjectId(currentUser._id);
          logger.info('Limited user list to self only', { userId: currentUser._id });
        } else if (req.query.userId) {
          // 管理员可以按 ID 筛选
          query._id = new ObjectId(req.query.userId as string);
          logger.info('Admin filtering by userId', { filterId: req.query.userId });
        }

        const users: IUser[] = await usersCollection
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray() as IUser[];

        const total = await usersCollection.countDocuments(query);

        logger.info('Users fetched successfully', { 
          count: users.length,
          total,
          page,
          limit,
          isAdmin: currentUser.role === 'admin'
        });

        res.json({
          data: users.map(user => ({
            ...user,
            password: undefined
          })),
          total,
          page,
          limit
        });
      } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 管理员接口：创建用户
    router.post('/api/users', authMiddleware, checkAdminRole, async (req: Request, res: Response) => {
      try {
        const { username, email, password, role } = req.body;

        // 验证必填字段
        if (!username || !email || !password) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // 检查用户名和邮箱是否已存在
        const existingUser = await usersCollection.findOne({
          $or: [{ username }, { email }]
        });

        if (existingUser) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }

        // 创建新用户
        const hashedPassword = await User.hashPassword(password);
        const newUser: IUser = {
          username,
          email,
          password: hashedPassword,
          role: role || 'user',
          createdAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);
        
        logger.info({
          message: 'User created successfully',
          userId: result.insertedId,
          username
        });

        res.status(201).json({
          ...newUser,
          _id: result.insertedId,
          password: undefined
        });
      } catch (error) {
        logger.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 管理员接口：更新用户
    router.put('/api/users/:userId', authMiddleware, checkAdminRole, async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const { username, email, role, password } = req.body;

        const updateData: Partial<IUser> = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (password) {
          updateData.password = await User.hashPassword(password);
        }

        const result = await usersCollection.findOneAndUpdate(
          { _id: new ObjectId(userId) },
          { $set: updateData },
          { returnDocument: 'after' }
        );

        if (!result) {
          return res.status(404).json({ error: 'User not found' });
        }

        logger.info({
          message: 'User updated successfully',
          userId
        });

        res.json({
          ...result,
          password: undefined
        });
      } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 管理员接口：删除用户
    router.delete('/api/users/:userId', authMiddleware, checkAdminRole, async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        logger.info({
          message: 'User deleted successfully',
          userId
        });

        res.status(204).send();
      } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 用户接口：获取个人信息
    router.get('/api/users/:userId/profile', authMiddleware, checkUserAccess, async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({
          ...user,
          password: undefined
        });
      } catch (error) {
        logger.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 用户接口：更新个人信息
    router.put('/api/users/:userId/profile', authMiddleware, checkUserAccess, async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const { username, email, currentPassword, newPassword } = req.body;

        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // 如果要更改密码，验证当前密码
        if (newPassword) {
          if (!currentPassword) {
            return res.status(400).json({ error: 'Current password is required' });
          }

          const isValidPassword = await User.comparePassword(currentPassword, user.password);
          if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid current password' });
          }
        }

        const updateData: Partial<IUser> = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (newPassword) {
          updateData.password = await User.hashPassword(newPassword);
        }

        const result = await usersCollection.findOneAndUpdate(
          { _id: new ObjectId(userId) },
          { $set: updateData },
          { returnDocument: 'after' }
        );

        logger.info({
          message: 'User profile updated successfully',
          userId
        });

        res.json({
          ...result,
          password: undefined
        });
      } catch (error) {
        logger.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Token 相关接口
    // 管理员：获取所有用户的token列表
    router.get('/api/users/tokens/all', authMiddleware, checkAdminRole, async (req: Request, res: Response) => {
      try {
        logger.info('Fetching all tokens');
        const tokenManager = await TokenManager.getInstance();
        const tokens = await tokenManager.listTokens(new ObjectId());
        
        res.json(tokens);
      } catch (error) {
        logger.error('Error fetching all tokens:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 用户：获取个人token列表
    router.get('/api/users/:userId/tokens', authMiddleware, checkUserAccess, async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        logger.info('Fetching user tokens:', { userId });
        const tokenManager = await TokenManager.getInstance();
        const tokens = await tokenManager.listTokens(new ObjectId(userId));
        
        res.json(tokens);
      } catch (error) {
        logger.error('Error fetching user tokens:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 用户：创建新token
    router.post('/api/users/:userId/tokens', authMiddleware, checkUserAccess, async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const { name, expiresAt, allowedModels = [], balance = 0, description = '', neverExpire = false } = req.body;

        logger.info('Creating new token:', { 
          userId,
          name,
          allowedModels,
          neverExpire
        });

        const tokenManager = await TokenManager.getInstance();
        const token = await tokenManager.createToken(
          name,
          new ObjectId(userId),
          neverExpire ? new Date('2099-12-31') : new Date(expiresAt),
          allowedModels,
          balance,
          description
        );

        logger.info('Token created successfully:', {
          userId,
          tokenId: token._id,
          name: token.name
        });

        res.status(201).json(token);
      } catch (error) {
        logger.error('Error creating token:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 用户：停用token
    router.delete('/api/users/:userId/tokens/:tokenId', authMiddleware, checkUserAccess, async (req: Request, res: Response) => {
      try {
        const { userId, tokenId } = req.params;
        logger.info('Deactivating token:', { userId, tokenId });
        
        const tokenManager = await TokenManager.getInstance();
        const result = await tokenManager.deactivateToken(
          new ObjectId(tokenId),
          new ObjectId(userId)
        );

        if (!result) {
          logger.warn('Token not found or already deactivated:', { userId, tokenId });
          return res.status(404).json({ error: 'Token not found or already deactivated' });
        }

        logger.info('Token deactivated successfully:', { userId, tokenId });
        res.status(204).send();
      } catch (error) {
        logger.error('Error deactivating token:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 获取当前用户信息接口
    router.get('/api/profile', authMiddleware, async (req: Request, res: Response) => {
      try {
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user._id) });
        if (!user) {
          return res.status(404).json({ message: '用户不存在' });
        }

        res.json({
          message: '获取成功',
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      } catch (error) {
        logger.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.use(router);
  } catch (error) {
    logger.error('Failed to setup user routes:', error);
    throw error;
  }
} 