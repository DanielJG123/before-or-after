// API client factory - chooses AWS or local based on configuration

import config, { isAwsMode } from '@/config';
import { awsApiClient } from './aws';
import { localStubApiClient } from './localStub';
import { ApiClient } from '@/types/api';

// Export the chosen API client
export const apiClient: ApiClient = isAwsMode() ? awsApiClient : localStubApiClient;

console.log(`📡 API Client initialized: ${isAwsMode() ? 'AWS' : 'Local Stub'} mode`);

// Re-export types for convenience
export * from '@/types/api';
export { awsApiClient, localStubApiClient };