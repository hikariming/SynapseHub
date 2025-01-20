import { ExtendedLogger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      logger: ExtendedLogger;
      startTime: number;
    }
  }
} 