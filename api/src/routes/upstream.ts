import { Router } from 'express';
import { Express, Request, Response } from 'express';
import { createAuthMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AIConfig } from '../types/ai-config';
import { AIConfigManager } from '../services/ai-config-manager';

// 过滤敏感信息的函数
const filterSensitiveInfo = (config: any, isAdmin: boolean) => {
  if (isAdmin) return config;

  const filtered = JSON.parse(JSON.stringify(config));
  if (filtered.endpoints) {
    filtered.endpoints = filtered.endpoints.map((endpoint: any) => ({
      ...endpoint,
      api_key: '******',
      upstream_url: '******'
    }));
  }
  
  if (filtered.models) {
    Object.keys(filtered.models).forEach(key => {
      if (filtered.models[key].endpoints) {
        filtered.models[key].endpoints = filtered.models[key].endpoints.map((endpoint: any) => ({
          ...endpoint,
          api_key: '******',
          upstream_url: '******'
        }));
      }
    });
  }
  return filtered;
};

export async function setupUpstreamRoutes(app: Express) {
  const router = Router();
  const authMiddleware = await createAuthMiddleware();

  // 获取所有模型配置
  router.get('/api/upstream/models', authMiddleware, async (req: Request, res: Response) => {
    try {
      const aiConfigManager = req.app.get('aiConfigManager') as AIConfigManager;
      const config = await aiConfigManager.getConfig();
      const isAdmin = req.user.role === 'admin';
      
      res.json(filterSensitiveInfo(config.models, isAdmin));
    } catch (error) {
      logger.error('获取模型配置失败:', error);
      res.status(500).json({ error: '获取模型配置失败' });
    }
  });

  // 获取单个模型配置
  router.get('/api/upstream/models/:modelName', authMiddleware, async (req: Request, res: Response) => {
    try {
      const aiConfigManager = req.app.get('aiConfigManager') as AIConfigManager;
      const modelConfig = await aiConfigManager.getModelConfig(req.params.modelName);
      const isAdmin = req.user.role === 'admin';
      
      if (!modelConfig) {
        return res.status(404).json({ error: '模型配置不存在' });
      }
      
      res.json(filterSensitiveInfo(modelConfig, isAdmin));
    } catch (error) {
      logger.error('获取模型配置失败:', error);
      res.status(500).json({ error: '获取模型配置失败' });
    }
  });

  // 检查管理员权限的中间件
  const checkAdminRole = (req: Request, res: Response, next: Function) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  };

  // 创建或更新模型配置 (仅管理员)
  router.put('/api/upstream/models/:modelName', authMiddleware, checkAdminRole, async (req: Request, res: Response) => {
    try {
      const aiConfigManager = req.app.get('aiConfigManager') as AIConfigManager;
      let currentConfig = await aiConfigManager.getConfig();
      
      if (!currentConfig) {
        currentConfig = {
          models: {},
          version: 0,
          updated_at: new Date()
        };
      }
      
      const newModelConfig = {
        name: req.params.modelName,
        ...req.body,
        updated_at: new Date()
      };

      const newConfig: AIConfig = {
        ...currentConfig,
        models: {
          ...currentConfig.models,
          [req.params.modelName]: newModelConfig
        },
        version: (currentConfig.version || 0) + 1,
        updated_at: new Date()
      };

      await aiConfigManager.updateConfig(newConfig);
      res.json({ message: '模型配置更新成功', config: newModelConfig });
    } catch (error) {
      logger.error('更新模型配置失败:', error);
      res.status(500).json({ error: '更新模型配置失败' });
    }
  });

  // 删除模型配置 (仅管理员)
  router.delete('/api/upstream/models/:modelName', authMiddleware, checkAdminRole, async (req: Request, res: Response) => {
    try {
      const aiConfigManager = req.app.get('aiConfigManager') as AIConfigManager;
      const currentConfig = await aiConfigManager.getConfig();
      
      if (!currentConfig.models[req.params.modelName]) {
        return res.status(404).json({ error: '模型配置不存在' });
      }

      const { [req.params.modelName]: removedModel, ...remainingModels } = currentConfig.models;
      
      const newConfig: AIConfig = {
        ...currentConfig,
        models: remainingModels,
        version: currentConfig.version + 1,
        updated_at: new Date()
      };

      await aiConfigManager.updateConfig(newConfig);
      res.json({ message: '模型配置删除成功' });
    } catch (error) {
      logger.error('删除模型配置失败:', error);
      res.status(500).json({ error: '删除模型配置失败' });
    }
  });

  // 更新模型模型状态 (仅管理员)
  router.patch('/api/upstream/models/:modelName/endpoints/:endpointName/status', authMiddleware, checkAdminRole, async (req: Request, res: Response) => {
    try {
      const aiConfigManager = req.app.get('aiConfigManager') as AIConfigManager;
      const currentConfig = await aiConfigManager.getConfig();
      const { modelName, endpointName } = req.params;
      const { status } = req.body;

      if (!currentConfig.models[modelName]) {
        return res.status(404).json({ error: '模型配置不存在' });
      }

      const modelConfig = currentConfig.models[modelName];
      const endpointIndex = modelConfig.endpoints.findIndex((e: any) => e.name === endpointName);

      if (endpointIndex === -1) {
        return res.status(404).json({ error: '模型不存在' });
      }

      const updatedEndpoints = [...modelConfig.endpoints];
      updatedEndpoints[endpointIndex] = {
        ...updatedEndpoints[endpointIndex],
        status,
        health_check: {
          last_check: new Date(),
          is_healthy: status
        }
      };

      const newConfig: AIConfig = {
        ...currentConfig,
        models: {
          ...currentConfig.models,
          [modelName]: {
            ...modelConfig,
            endpoints: updatedEndpoints,
            updated_at: new Date()
          }
        },
        version: currentConfig.version + 1,
        updated_at: new Date()
      };

      await aiConfigManager.updateConfig(newConfig);
      res.json({ message: '模型状态更新成功' });
    } catch (error) {
      logger.error('更新模型状态失败:', error);
      res.status(500).json({ error: '更新模型状态失败' });
    }
  });

  // 获取配置版本历史 (仅管理员)
  router.get('/api/upstream/history', authMiddleware, checkAdminRole, async (req: Request, res: Response) => {
    try {
      const aiConfigManager = req.app.get('aiConfigManager') as AIConfigManager;
      const db = req.app.get('db');
      const history = await db.collection('ai_configs')
        .find({}, { 
          projection: { 
            version: 1, 
            updated_at: 1,
            'models.name': 1 
          } 
        })
        .sort({ version: -1 })
        .limit(10)
        .toArray();

      res.json(history);
    } catch (error) {
      logger.error('获取配置历史失败:', error);
      res.status(500).json({ error: '获取配置历史失败' });
    }
  });

  app.use(router);
} 