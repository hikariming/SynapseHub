import { parse } from 'yaml';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../utils/logger';

export async function loadConfig() {
  try {
    const configPath = join(__dirname, '../../.env.yml');
    const configFile = await readFile(configPath, 'utf8');
    const config = parse(configFile);
    return config;
  } catch (error) {
    logger.error('Error loading config:', error);
    throw error;
  }
} 