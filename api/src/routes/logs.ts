import { Router } from 'express';
import { Express, Request, Response } from 'express';
import { ChatLog } from '../models/chatData';
import { SystemLog, LogLevel } from '../models/systemLog';
import { createAuthMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

export async function setupLogsRoutes(app: Express) {
  const router = Router();
  const authMiddleware = await createAuthMiddleware();

  // 获取聊天日志列表
  router.get('/api/logs/chat', authMiddleware, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 构建查询条件
      const query: any = {};
      
      if (req.query.startDate && req.query.startDate !== 'undefined') {
        query.created_at = { $gte: new Date(req.query.startDate as string) };
      }
      
      if (req.query.endDate && req.query.endDate !== 'undefined') {
        query.created_at = { 
          ...query.created_at,
          $lte: new Date(req.query.endDate as string)
        };
      }
      
      if (req.query.userId && req.query.userId !== 'undefined') {
        query.user_id = req.query.userId;
      }
      
      if (req.query.modelName && req.query.modelName !== 'undefined') {
        query.modelName = req.query.modelName;
      }
      
      if (req.query.conversationId && req.query.conversationId !== 'undefined') {
        query.conversation_id = req.query.conversationId;
      }

      // 执行查询
      const [logs, total] = await Promise.all([
        ChatLog.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ChatLog.countDocuments(query)
      ]);

      res.json({
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      logger.error('获取聊天日志失败:', error);
      res.status(500).json({ message: '获取聊天日志失败' });
    }
  });

  // 获取聊天日志详情
  router.get('/api/logs/chat/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const log = await ChatLog.findById(req.params.id).lean();
      if (!log) {
        return res.status(404).json({ message: '日志不存在' });
      }
      res.json(log);
    } catch (error) {
      logger.error('获取聊天日志详情失败:', error);
      res.status(500).json({ message: '获取聊天日志详情失败' });
    }
  });

  // 导出日志（可选功能）
  router.get('/api/logs/chat/export', authMiddleware, async (req: Request, res: Response) => {
    try {
      const query: any = {};
      
      if (req.query.startDate && req.query.startDate !== 'undefined') {
        query.created_at = { $gte: new Date(req.query.startDate as string) };
      }
      
      if (req.query.endDate && req.query.endDate !== 'undefined') {
        query.created_at = { 
          ...query.created_at,
          $lte: new Date(req.query.endDate as string)
        };
      }

      const logs = await ChatLog.find(query)
        .sort({ created_at: -1 })
        .lean();

      // 将日志转换为 CSV 格式
      const csv = logs.map(log => ({
        用户ID: log.user_id,
        会话ID: log.conversation_id,
        模型: log.modelName,
        消息数: log.messages?.length || 0,
        总Token: log.total_tokens || 0,
        创建时间: new Date(log.created_at).toLocaleString()
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=chat_logs.csv');
      res.json(csv);
    } catch (error) {
      logger.error('导出聊天日志失败:', error);
      res.status(500).json({ message: '导出聊天日志失败' });
    }
  });

  // 获取系统日志列表
  router.get('/api/logs/system', authMiddleware, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // 构建查询条件
      const query: any = {};
      
      if (req.query.startDate && req.query.startDate !== 'undefined') {
        query.timestamp = { $gte: new Date(req.query.startDate as string) };
      }
      
      if (req.query.endDate && req.query.endDate !== 'undefined') {
        query.timestamp = { 
          ...query.timestamp,
          $lte: new Date(req.query.endDate as string)
        };
      }
      
      if (req.query.level && req.query.level !== 'undefined') {
        query.level = req.query.level;
      }
      
      if (req.query.service && req.query.service !== 'undefined') {
        query.service = req.query.service;
      }

      if (req.query.userId && req.query.userId !== 'undefined') {
        query.user_id = req.query.userId;
      }

      // 执行查询
      const [logs, total] = await Promise.all([
        SystemLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SystemLog.countDocuments(query)
      ]);

      res.json({
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      logger.error('获取系统日志失败:', error);
      res.status(500).json({ message: '获取系统日志失败' });
    }
  });

  // 获取系统日志详情
  router.get('/api/logs/system/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const log = await SystemLog.findById(req.params.id).lean();
      if (!log) {
        return res.status(404).json({ message: '日志不存在' });
      }
      res.json(log);
    } catch (error) {
      logger.error('获取系统日志详情失败:', error);
      res.status(500).json({ message: '获取系统日志详情失败' });
    }
  });

  // 清理系统日志
  router.delete('/api/logs/system', authMiddleware, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string);
      if (!days || ![3, 7, 30].includes(days)) {
        return res.status(400).json({ message: '无效的天数参数' });
      }

      const date = new Date();
      date.setDate(date.getDate() - days);

      const result = await SystemLog.deleteMany({
        timestamp: { $lt: date }
      });

      res.json({
        message: `成功清理 ${result.deletedCount} 条日志`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      logger.error('清理系统日志失败:', error);
      res.status(500).json({ message: '清理系统日志失败' });
    }
  });

  // 导出系统日志
  router.get('/api/logs/system/export', authMiddleware, async (req: Request, res: Response) => {
    try {
      const query: any = {};
      
      if (req.query.startDate && req.query.startDate !== 'undefined') {
        query.timestamp = { $gte: new Date(req.query.startDate as string) };
      }
      
      if (req.query.endDate && req.query.endDate !== 'undefined') {
        query.timestamp = { 
          ...query.timestamp,
          $lte: new Date(req.query.endDate as string)
        };
      }

      if (req.query.level && req.query.level !== 'undefined') {
        query.level = req.query.level;
      }

      const logs = await SystemLog.find(query)
        .sort({ timestamp: -1 })
        .lean();

      // 将日志转换为 CSV 格式
      const csv = logs.map(log => ({
        级别: log.level,
        消息: log.message,
        服务: log.service || '-',
        用户ID: log.user_id || '-',
        IP: log.ip || '-',
        时间: new Date(log.timestamp).toLocaleString(),
        请求ID: log.request_id || '-'
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=system_logs.csv');
      res.json(csv);
    } catch (error) {
      logger.error('导出系统日志失败:', error);
      res.status(500).json({ message: '导出系统日志失败' });
    }
  });

  app.use(router);
} 