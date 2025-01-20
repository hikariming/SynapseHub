import { Router } from 'express';
import { ConfigManager } from '../services/config-manager';
import { RestartManager } from '../services/restart-manager';
import { createAuthMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Express } from 'express';

export async function setupConfigRoutes(app: Express) {
  const router = Router();
  const configManager = new ConfigManager();
  const restartManager = RestartManager.getInstance();
  
  // 创建认证中间件实例
  const authMiddleware = await createAuthMiddleware();

  // 获取完整配置
  router.get('/api/upstream/config', authMiddleware, async (req, res) => {
    try {
      const config = await configManager.readConfig();
      res.json(config);
    } catch (error) {
      logger.error('获取配置失败:', error);
      res.status(500).json({ error: '获取配置失败' });
    }
  });

  // 更新完整配置
  router.put('/api/upstream/config', authMiddleware, async (req, res) => {
    try {
      await configManager.updateConfig(req.body);
      res.json({ message: '配置更新成功' });
    } catch (error) {
      logger.error('更新配置失败:', error);
      res.status(500).json({ error: '更新配置失败' });
    }
  });

  // 更新部分配置
  router.patch('/api/upstream/config/*', authMiddleware, async (req, res) => {
    try {
      const pathParam = req.path.replace('/api/upstream/config/', '');
      const path = pathParam.split('/').filter(Boolean);
      await configManager.updatePartialConfig(path, req.body);
      res.json({ message: '配置部分更新成功' });
    } catch (error) {
      logger.error('更新部分配置失败:', error);
      res.status(500).json({ error: '更新部分配置失败' });
    }
  });

  // 获取配置备份列表
  router.get('/api/upstream/config/backups', authMiddleware, async (req, res) => {
    try {
      const backups = await configManager.listBackups();
      res.json(backups);
    } catch (error) {
      logger.error('获取配置备份列表失败:', error);
      res.status(500).json({ error: '获取配置备份列表失败' });
    }
  });

  // 恢复指定的配置备份
  router.post('/api/upstream/config/backups/:filename/restore', authMiddleware, async (req, res) => {
    try {
      await configManager.restoreBackup(req.params.filename);
      res.json({ message: '配置已恢复' });
    } catch (error) {
      logger.error('恢复配置备份失败:', error);
      res.status(500).json({ error: '恢复配置备份失败' });
    }
  });

  // 重启服务
  router.post('/api/upstream/config/restart', authMiddleware, async (req, res) => {
    try {
      await restartManager.restartService();
      res.json({ message: '服务重启指令已发送' });
    } catch (error) {
      logger.error('重启服务失败:', error);
      res.status(500).json({ error: '重启服务失败' });
    }
  });

  // 获取服务状态
  router.get('/api/upstream/config/status', authMiddleware, async (req, res) => {
    try {
      const status = await restartManager.getServiceStatus();
      res.json(status);
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      res.status(500).json({ error: '获取服务状态失败' });
    }
  });

  app.use(router);
} 