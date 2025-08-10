// API types for AWS backend integration

// Request types
export interface ValidateTopicRequest {
  period: string;
  location: string;
  theme?: string;
}

export interface CreateTopicRequest {
  period: {
    label: string;
    start_year: number;
    end_year: number;
  };
  location: string;
  theme?: string;
  desiredCount: number;
}

export interface GenerateTopicRequest {
  force?: boolean; // backend decides N if not provided
}

export interface ImageSelectRequest {
  eventId: string;
  queries: string[];
  eventTitle: string;
  year: number;
  location: string;
}

// Response types
export interface ValidateTopicResponse {
  ok: boolean;
  normalized?: {
    period: {
      label: string;
      start_year: number;
      end_year: number;
    };
    location: string;
    theme?: string;
  };
  duplicateOf?: string; // topicId
}

export interface CreateTopicResponse {
  id: string;
  key: string;
  created: boolean;
}

export interface GenerateTopicResponse {
  topic: StrictTopicJson;
}

export interface ImageSelectResponse {
  image?: {
    image_url: string;
    source_url: string;
    license: string;
    creator?: string;
    title?: string;
    credit_line?: string;
    missing?: boolean;
  };
}

export interface ListTopicsResponse {
  topics: TopicSummary[];
}

export interface GetTopicResponse {
  topic: StrictTopicJson;
}

// Shared data types
export interface TopicSummary {
  id: string;
  key: string;
  period: {
    label: string;
    start_year: number;
    end_year: number;
  };
  location: string;
  theme?: string;
  eventCount: number;
  createdAt: string;
}

export interface StrictTopicJson {
  topic_id: string;
  period: {
    label: string;
    start_year: number;
    end_year: number;
  };
  location: string;
  theme?: string;
  events: StrictEventJson[];
  version: string;
}

export interface StrictEventJson {
  id: string;
  title: string;
  year: number;
  precision: 'year' | 'month' | 'day' | 'approx';
  summary: string;
  sources: string[];
  image_candidates: Array<{
    query: string;
    reason: string;
  }>;
  tags: string[];
  image?: {
    image_url: string;
    source_url: string;
    license: string;
    creator?: string;
    title?: string;
    credit_line?: string;
    missing?: boolean;
  };
}

// Error types
export interface ApiError {
  error: string;
  message: string;
  code?: number;
}

// API driver types
export interface ApiClient {
  validateTopic(request: ValidateTopicRequest): Promise<ValidateTopicResponse>;
  createTopic(request: CreateTopicRequest): Promise<CreateTopicResponse>;
  generateTopic(topicId: string, request: GenerateTopicRequest): Promise<GenerateTopicResponse>;
  selectImage(request: ImageSelectRequest): Promise<ImageSelectResponse>;
  listTopics(): Promise<ListTopicsResponse>;
  getTopic(topicId: string): Promise<GetTopicResponse>;
}