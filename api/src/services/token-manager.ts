import { Collection, ObjectId } from 'mongodb';
import { IToken, Token } from '../models/token';
import { logger } from '../utils/logger';

export class TokenManager {
  private static _instance: TokenManager;
  private mongoCollection: Collection;

  private constructor(mongoCollection: Collection) {
    this.mongoCollection = mongoCollection;
    Token.initialize(this.mongoCollection);
  }

  public static async getInstance(): Promise<TokenManager> {
    if (!TokenManager._instance) {
      throw new Error('TokenManager not initialized. Call initialize() first.');
    }
    return TokenManager._instance;
  }

  public static async initialize(mongoCollection: Collection): Promise<TokenManager> {
    if (!TokenManager._instance) {
      TokenManager._instance = new TokenManager(mongoCollection);
    }
    return TokenManager._instance;
  }

  async createToken(
    name: string,
    createdBy: ObjectId,
    expiresAt: Date,
    allowedModels: string[],
    balance: number,
    description?: string
  ): Promise<IToken> {
    try {
      const tokenData: Omit<IToken, 'token' | 'created_at' | 'last_used_at'> = {
        name,
        created_by: createdBy,
        expires_at: expiresAt,
        allowed_models: allowedModels,
        balance,
        is_active: true,
        description
      };

      const token = await Token.create(tokenData);
      logger.info({
        message: 'Token created successfully',
        tokenId: token._id,
        createdBy: createdBy.toString()
      });

      return token;
    } catch (error) {
      logger.error('Failed to create token:', error);
      throw error;
    }
  }

  async validateTokenForModel(
    token: string,
    modelName: string
  ): Promise<{
    isValid: boolean;
    token?: IToken;
    error?: string;
  }> {
    try {
      const validation = await Token.isValid(token);
      
      if (!validation.isValid || !validation.token) {
        return validation;
      }

      // 检查模型访问权限
      if (
        validation.token.allowed_models.length > 0 && 
        !validation.token.allowed_models.includes(modelName)
      ) {
        return {
          isValid: false,
          error: 'Model access not allowed for this token'
        };
      }

      // 更新最后使用时间
      await Token.updateLastUsed(validation.token._id!);

      return validation;
    } catch (error) {
      logger.error('Token validation error:', error);
      return {
        isValid: false,
        error: 'Internal validation error'
      };
    }
  }

  async deductTokenBalance(tokenId: ObjectId, amount: number): Promise<boolean> {
    try {
      return await Token.deductBalance(tokenId, amount);
    } catch (error) {
      logger.error('Failed to deduct token balance:', error);
      return false;
    }
  }

  async listTokens(userId: ObjectId): Promise<IToken[]> {
    try {
      return await this.mongoCollection
        .find({ created_by: userId })
        .sort({ created_at: -1 })
        .toArray() as IToken[];
    } catch (error) {
      logger.error('Failed to list tokens:', error);
      throw error;
    }
  }

  async deactivateToken(tokenId: ObjectId, userId: ObjectId): Promise<boolean> {
    try {
      const result = await this.mongoCollection.updateOne(
        { _id: tokenId, created_by: userId },
        { $set: { is_active: false } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Failed to deactivate token:', error);
      throw error;
    }
  }

  // 获取Token总数
  async getTokenCount(): Promise<number> {
    const tokens = await this.mongoCollection.find({}).toArray();
    return tokens.length;
  }

  // 获取指定时间点之前的Token数量
  async getTokenCountBefore(date: Date): Promise<number> {
    const tokens = await this.mongoCollection.find({
      created_at: { $lt: date }
    }).toArray();
    return tokens.length;
  }
} 