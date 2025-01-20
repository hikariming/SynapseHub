import { Schema, model, Document, Model } from 'mongoose';
import { ObjectId } from 'mongodb';

// 消息类型枚举
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function'
}

// 消息内容接口
interface MessageContent {
  text?: string;
  image_url?: string[]; // 支持多图片
}

// 消息接口
export interface Message {
  role: MessageRole;
  content: MessageContent;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
  timestamp: Date;
}

// 基础聊天记录接口
export interface IChatLog {
  _id?: ObjectId;
  user_id: string;
  conversation_id: string;
  modelName: string; // 改名以避免与 Document.model 冲突
  messages: Message[];
  total_tokens?: number;
  completion_tokens?: number;
  prompt_tokens?: number;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

// 创建一个新的类型，将 IChatLog 和 Document 结合
export type ChatLogDocument = IChatLog & Document;

// 创建 Schema
const chatLogSchema = new Schema<ChatLogDocument>(
  {
    user_id: { type: String, required: true },
    conversation_id: { type: String, required: true },
    modelName: { type: String, required: true },
    messages: [{
      role: { 
        type: String, 
        required: true, 
        enum: Object.values(MessageRole)
      },
      content: {
        text: { type: String },
        image_url: [{ type: String }]
      },
      name: { type: String },
      function_call: {
        name: { type: String },
        arguments: { type: String }
      },
      timestamp: { type: Date, default: Date.now }
    }],
    total_tokens: { type: Number },
    completion_tokens: { type: Number },
    prompt_tokens: { type: Number },
    metadata: { type: Schema.Types.Mixed },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// 统一在这里创建所有索引
chatLogSchema.index({ user_id: 1, created_at: -1 }, { background: true });
chatLogSchema.index({ conversation_id: 1 }, { background: true });
chatLogSchema.index({ created_at: -1 }, { background: true });

// 添加验证中间件
chatLogSchema.pre('save', function(next) {
  if (!this.conversation_id) {
    next(new Error('conversation_id is required'));
    return;
  }
  next();
});

// 创建模型
export const ChatLog: Model<ChatLogDocument> = model<ChatLogDocument>('ChatLog', chatLogSchema);
