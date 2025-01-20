import { ObjectId } from 'mongodb';

export interface ModelEndpoint {
  name: string;
  upstream_url: string;
  api_key: string;
  weight: number;
  format?: string;
  status: boolean;
  health_check: {
    last_check: Date;
    is_healthy: boolean;
  }
}

export interface ModelConfig {
  _id?: ObjectId;
  name: string;
  type: string;
  capabilities: string[];
  load_balance: string;
  endpoints: ModelEndpoint[];
  version: number;
  updated_at: Date;
  cost_per_token: number;
}

export interface AIConfig {
  models: {
    [key: string]: ModelConfig;
  };
  version: number;
  updated_at: Date;
}

export interface Config {
  models: Record<string, ModelConfig>;
  default_model: string;
  database: {
    mongo_uri: string;
    redis_uri: string;
  };
  cors?: {
    origins?: string[];
    methods?: string[];
    credentials?: boolean;
  };
} 