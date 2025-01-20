import fs from 'fs/promises';
import yaml from 'js-yaml';
import { logger } from '../utils/logger';
import path from 'path';

export class ConfigManager {
  private configPath: string;
  private backupDir: string;

  constructor() {
    this.configPath = path.resolve(process.cwd(), '.env.yml');
    this.backupDir = path.resolve(process.cwd(), 'config-backups');
  }

  private async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  private async createBackup() {
    await this.ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `config-backup-${timestamp}.yml`);
    await fs.copyFile(this.configPath, backupPath);
    
    // 保留最近30个备份
    const files = await fs.readdir(this.backupDir);
    const backups = files.filter(f => f.startsWith('config-backup-')).sort();
    if (backups.length > 30) {
      const toDelete = backups.slice(0, backups.length - 30);
      for (const file of toDelete) {
        await fs.unlink(path.join(this.backupDir, file));
      }
    }
    
    return backupPath;
  }

  async listBackups() {
    await this.ensureBackupDir();
    const files = await fs.readdir(this.backupDir);
    return files.filter(f => f.startsWith('config-backup-')).sort().reverse();
  }

  async restoreBackup(backupFileName: string) {
    const backupPath = path.join(this.backupDir, backupFileName);
    await fs.copyFile(backupPath, this.configPath);
    return true;
  }

  async readConfig() {
    try {
      const fileContent = await fs.readFile(this.configPath, 'utf8');
      return yaml.load(fileContent);
    } catch (error) {
      logger.error('读取配置文件失败:', error);
      throw error;
    }
  }

  async updateConfig(config: any) {
    try {
      // 创建备份
      const backupPath = await this.createBackup();
      logger.info(`配置备份已创建: ${backupPath}`);

      const yamlStr = yaml.dump(config, {
        indent: 2,
        lineWidth: -1
      });
      await fs.writeFile(this.configPath, yamlStr, 'utf8');
      return true;
    } catch (error) {
      logger.error('更新配置失败:', error);
      throw error;
    }
  }

  async updatePartialConfig(path: string[], value: any) {
    const config = await this.readConfig();
    let current: any = config;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    return this.updateConfig(config);
  }
} 