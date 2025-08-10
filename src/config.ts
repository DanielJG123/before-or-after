// Central configuration for AWS backend integration

interface Config {
  apiDriver: 'aws' | 'local';
  apiBase?: string;
  awsRegion?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
}

// Read environment variables with defaults
const config: Config = {
  apiDriver: (import.meta.env.VITE_API_DRIVER as 'aws' | 'local') || 'local',
  apiBase: import.meta.env.VITE_API_BASE,
  awsRegion: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

// Validation - fail fast with human-readable errors
function validateConfig(): void {
  if (config.apiDriver === 'aws') {
    if (!config.apiBase) {
      throw new Error(
        'AWS API driver selected but VITE_API_BASE is not set. ' +
        'Please set your API Gateway URL in environment variables.'
      );
    }

    if (!config.apiBase.startsWith('https://')) {
      throw new Error(
        'API_BASE must use HTTPS for AWS integration. ' +
        `Got: ${config.apiBase}`
      );
    }
  }

  console.log(`🔧 API Driver: ${config.apiDriver}`);
  if (config.apiDriver === 'aws' && config.apiBase) {
    console.log(`🌐 API Base: ${config.apiBase}`);
  } else {
    console.log('🧪 Using local development stubs');
  }
}

// Validate on module load
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  throw error;
}

export default config;

// Helper functions
export function isAwsMode(): boolean {
  return config.apiDriver === 'aws';
}

export function getApiBase(): string {
  if (!config.apiBase && config.apiDriver === 'aws') {
    throw new Error('API_BASE required for AWS mode');
  }
  return config.apiBase || 'http://localhost:3000'; // fallback for local
}

export function getCognitoConfig(): { 
  userPoolId: string; 
  clientId: string; 
} | null {
  if (config.cognitoUserPoolId && config.cognitoClientId) {
    return {
      userPoolId: config.cognitoUserPoolId,
      clientId: config.cognitoClientId
    };
  }
  return null;
}