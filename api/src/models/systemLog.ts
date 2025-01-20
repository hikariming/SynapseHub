import { Schema, model, Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

export interface ISystemLog {
  _id?: ObjectId;
  level: LogLevel;
  message: string;
  timestamp: Date;
  service?: string;
  metadata?: Record<string, any>;
  stack?: string;
  request_id?: string;
  user_id?: string;
  ip?: string;
}

export type SystemLogDocument = ISystemLog & Document;

const systemLogSchema = new Schema<SystemLogDocument>(
  {
    level: {
      type: String,
      required: true,
      enum: Object.values(LogLevel)
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    service: String,
    metadata: Schema.Types.Mixed,
    stack: String,
    request_id: String,
    user_id: String,
    ip: String
  },
  {
    timestamps: true,
    collection: 'system_logs'
  }
);

// 创建索引
systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ service: 1, timestamp: -1 });
systemLogSchema.index({ request_id: 1 });
systemLogSchema.index({ user_id: 1, timestamp: -1 });

export const SystemLog = model<SystemLogDocument>('SystemLog', systemLogSchema); 