import { AxiosResponse, ResponseType } from 'axios';
import { ModelConfig, ModelEndpoint } from './ai-config';

export { ModelConfig, ModelEndpoint };

export interface Config {
  models: Record<string, ModelConfig>;
  default_model: string;
  database: {
    mongo_uri: string;
    redis_uri: string;
  };
  jwt?: {
    secret: string;
    expiresIn?: string;
  };
  cors?: {
    origins: string[];
    credentials?: boolean;
    methods?: string[];
  };
} 