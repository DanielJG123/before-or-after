// AWS API client for backend integration
// TODO(AWS): Implement actual AWS API Gateway integration

import { 
  ApiClient,
  ValidateTopicRequest,
  ValidateTopicResponse,
  CreateTopicRequest,
  CreateTopicResponse,
  GenerateTopicRequest,
  GenerateTopicResponse,
  ImageSelectRequest,
  ImageSelectResponse,
  ListTopicsResponse,
  GetTopicResponse,
  ApiError
} from '@/types/api';
import { signRequest, handleAuthError } from '@/auth/signer';
import { getApiBase } from '@/config';

class AwsApiClient implements ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBase();
  }

  private async makeRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const signedRequest = await signRequest({
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>)
        }
      });

      console.log(`🌐 AWS API: ${options.method || 'GET'} ${path}`);

      const response = await fetch(`${this.baseUrl}${path}`, signedRequest);

      if (!response.ok) {
        const errorBody = await response.text();
        let apiError: ApiError;
        
        try {
          apiError = JSON.parse(errorBody);
        } catch {
          apiError = {
            error: `HTTP ${response.status}`,
            message: errorBody || response.statusText,
            code: response.status
          };
        }

        handleAuthError({ status: response.status });
        throw new Error(`API Error: ${apiError.message} (${response.status})`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as T;
      }
    } catch (error) {
      console.error(`❌ AWS API Error (${path}):`, error);
      throw error;
    }
  }

  async validateTopic(request: ValidateTopicRequest): Promise<ValidateTopicResponse> {
    // TODO(AWS): Implement validation endpoint
    return this.makeRequest<ValidateTopicResponse>('/topics/validate', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async createTopic(request: CreateTopicRequest): Promise<CreateTopicResponse> {
    // TODO(AWS): Implement topic creation endpoint
    return this.makeRequest<CreateTopicResponse>('/topics', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async generateTopic(topicId: string, request: GenerateTopicRequest): Promise<GenerateTopicResponse> {
    // TODO(AWS): Implement LLM generation endpoint
    return this.makeRequest<GenerateTopicResponse>(`/topics/${topicId}/generate`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async selectImage(request: ImageSelectRequest): Promise<ImageSelectResponse> {
    // TODO(AWS): Implement image selection endpoint
    return this.makeRequest<ImageSelectResponse>('/images/select', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  async listTopics(): Promise<ListTopicsResponse> {
    // TODO(AWS): Implement topics listing endpoint
    return this.makeRequest<ListTopicsResponse>('/topics');
  }

  async getTopic(topicId: string): Promise<GetTopicResponse> {
    // TODO(AWS): Implement topic retrieval endpoint
    return this.makeRequest<GetTopicResponse>(`/topics/${topicId}`);
  }
}

export const awsApiClient = new AwsApiClient();