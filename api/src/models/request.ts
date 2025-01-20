import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  userId: String,
  modelName: String,
  timestamp: Date,
  status: String,
  tokensUsed: Number
});

export const Request = mongoose.model('Request', requestSchema); 