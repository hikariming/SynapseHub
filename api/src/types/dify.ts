export interface DifyMessage {
  id: string;
  conversation_id: string;
  inputs: Record<string, any>;
  query: string;
  answer: string;
  message_files: any[];
  feedback: null | {
    rating: 'like' | 'dislike';
  };
  retriever_resources: any[];
  created_at: number;
  agent_thoughts: any[];
  model_name?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DifyConversation {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

export interface DifyMessageRequest {
  inputs?: Record<string, any>;
  query: string;
  response_mode: 'streaming' | 'blocking';
  conversation_id?: string;
  user: string;
  files?: any[];
  auto_generate_name?: boolean;
}

export interface DifyMessageResponse {
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      total_price: string;
    };
    retriever_resources: any[];
  };
  created_at: number;
} 