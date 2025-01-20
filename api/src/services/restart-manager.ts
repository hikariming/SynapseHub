import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class RestartManager {
  private static instance: RestartManager;
  private isRestarting: boolean = false;

  private constructor() {}

  static getInstance(): RestartManager {
    if (!RestartManager.instance) {
      RestartManager.instance = new RestartManager();
    }
    return RestartManager.instance;
  }

  async restartService() {
    if (this.isRestarting) {
      throw new Error('服务正在重启中，请稍后再试');
    }

    try {
      this.isRestarting = true;
      logger.info('开始重启服务...');

      if (process.env.PM2_NAME) {
        await execAsync(`pm2 restart ${process.env.PM2_NAME}`);
        return true;
      }

      process.nextTick(() => {
        process.exit(0);
      });

      return true;
    } catch (error) {
      logger.error('重启服务失败:', error);
      throw error;
    } finally {
      this.isRestarting = false;
    }
  }

  async getServiceStatus() {
    try {
      if (process.env.PM2_NAME) {
        const { stdout } = await execAsync('pm2 list');
        
        // 匹配 ↺ 符号后面的数字
        const restartMatch = stdout.match(new RegExp(`${process.env.PM2_NAME}.*?↺\\s*(\\d+)\\s*│`));
        const restarts = restartMatch ? parseInt(restartMatch[1]) : 0;
        
        return {
          status: stdout.includes('online') ? 'online' : 'stopped',
          uptime: process.uptime(),
          memory: process.memoryUsage().heapUsed,
          cpu: process.cpuUsage().user / 1000000,
          restarts
        };
      }
      
      return {
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage().heapUsed,
        cpu: process.cpuUsage().user / 1000000,
        restarts: 0
      };
    } catch (error) {
      logger.error('获取服务状态失败:', error);
      throw error;
    }
  }
} 