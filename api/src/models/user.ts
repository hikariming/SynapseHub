import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id?: ObjectId;
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export class User {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
} 