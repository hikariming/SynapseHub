import { ObjectId } from 'mongodb';
import { Collection } from 'mongodb';
import crypto from 'crypto';

export interface IToken {
  _id?: ObjectId;
  token: string;
  name: string;
  created_by: ObjectId;  // 关联到用户ID
  expires_at: Date;
  created_at: Date;
  last_used_at: Date;
  allowed_models: string[];  // 允许访问的模型列表
  balance: number;  // 可用余额
  is_active: boolean;
  description?: string;  // 备注字段
}

export class Token {
  private static collection: Collection;

  static initialize(collection: Collection) {
    Token.collection = collection;
  }

  static async generateToken(): Promise<string> {
    return crypto.randomBytes(32).toString('hex');
  }

  static async create(data: Omit<IToken, 'token' | 'created_at' | 'last_used_at'>): Promise<IToken> {
    const token = await Token.generateToken();
    const tokenDoc: IToken = {
      ...data,
      token,
      created_at: new Date(),
      last_used_at: new Date(),
      is_active: true
    };

    await Token.collection.insertOne(tokenDoc);
    return tokenDoc;
  }

  static async findByToken(token: string): Promise<IToken | null> {
    return Token.collection.findOne({ token, is_active: true }) as Promise<IToken | null>;
  }

  static async updateLastUsed(tokenId: ObjectId): Promise<void> {
    await Token.collection.updateOne(
      { _id: tokenId },
      { $set: { last_used_at: new Date() } }
    );
  }

  static async deductBalance(tokenId: ObjectId, amount: number): Promise<boolean> {
    const result = await Token.collection.updateOne(
      { 
        _id: tokenId,
        balance: { $gte: amount }
      },
      { 
        $inc: { balance: -amount }
      }
    );
    return result.modifiedCount > 0;
  }

  static async isValid(token: string): Promise<{
    isValid: boolean;
    token?: IToken;
    error?: string;
  }> {
    const tokenDoc = await Token.findByToken(token);
    
    if (!tokenDoc) {
      return { isValid: false, error: 'Token not found' };
    }

    if (!tokenDoc.is_active) {
      return { isValid: false, error: 'Token is inactive' };
    }

    if (tokenDoc.expires_at < new Date()) {
      return { isValid: false, error: 'Token has expired' };
    }

    if (tokenDoc.balance <= 0) {
      return { isValid: false, error: 'Insufficient balance' };
    }

    return { isValid: true, token: tokenDoc };
  }
} 