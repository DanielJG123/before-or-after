import Ajv from 'ajv';
import { StrictTopicJson, StrictEventJson } from '@/types/api';

// JSON Schema for strict topic validation (AJV)
const eventSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    year: { type: 'integer', minimum: -4000, maximum: 2100 },
    precision: { 
      type: 'string', 
      enum: ['year', 'month', 'day', 'approx'] 
    },
    summary: { type: 'string', minLength: 10 },
      sources: { 
        type: 'array', 
        items: { type: 'string' },
        minItems: 0
      },
    image_candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          query: { type: 'string', minLength: 1 },
          reason: { type: 'string', minLength: 1 }
        },
        required: ['query', 'reason'],
        additionalProperties: false
      },
      minItems: 1,
      maxItems: 5
    },
    tags: { 
      type: 'array', 
      items: { type: 'string', minLength: 1 } 
    },
      image: {
        type: 'object',
        properties: {
          image_url: { type: 'string' },
          source_url: { type: 'string' },
          license: { type: 'string', minLength: 1 },
          creator: { type: 'string' },
          title: { type: 'string' },
          credit_line: { type: 'string' },
          missing: { type: 'boolean' }
        },
        required: ['image_url', 'source_url', 'license'],
        additionalProperties: false
      }
  },
  required: [
    'id', 
    'title', 
    'year', 
    'precision', 
    'summary', 
    'sources', 
    'image_candidates', 
    'tags'
  ],
  additionalProperties: false
};

const topicSchema = {
  type: 'object',
  properties: {
    topic_id: { type: 'string', minLength: 1 },
    period: {
      type: 'object',
      properties: {
        label: { type: 'string', minLength: 1 },
        start_year: { type: 'integer', minimum: -4000, maximum: 2100 },
        end_year: { type: 'integer', minimum: -4000, maximum: 2100 }
      },
      required: ['label', 'start_year', 'end_year'],
      additionalProperties: false
    },
    location: { type: 'string', minLength: 1 },
    theme: { type: 'string' },
    events: { 
      type: 'array', 
      items: eventSchema,
      minItems: 12,
      maxItems: 40
    },
    version: { type: 'string', pattern: '^\\d+\\.\\d+$' }
  },
  required: [
    'topic_id', 
    'period', 
    'location', 
    'events', 
    'version'
  ],
  additionalProperties: false
};

// Create AJV validator instance
const ajv = new Ajv({ allErrors: true });
const validateTopicJson = ajv.compile(topicSchema);

// Validation function
export function validateStrictTopicJson(data: unknown): {
  valid: boolean;
  topic?: StrictTopicJson;
  errors?: string[];
} {
  const valid = validateTopicJson(data);
  
  if (valid) {
    return {
      valid: true,
      topic: data as StrictTopicJson
    };
  }

  const errors = validateTopicJson.errors?.map(err => 
    `${err.dataPath || err.schemaPath || 'root'}: ${err.message}`
  ) || ['Unknown validation error'];

  return {
    valid: false,
    errors
  };
}

// Helper to repair common LLM mistakes (one attempt only)
export function repairTopicJson(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  
  const obj = data as Record<string, any>;
  
  // Fix common field name issues
  if (obj.events && Array.isArray(obj.events)) {
    obj.events = obj.events.map((event: any) => ({
      ...event,
      // Ensure image_candidates exists
      image_candidates: event.image_candidates || event.imageCandidates || [
        { query: event.title || 'historical event', reason: 'Event title' }
      ],
      // Ensure sources is array
      sources: Array.isArray(event.sources) ? event.sources : [],
      // Ensure tags is array  
      tags: Array.isArray(event.tags) ? event.tags : []
    }));
  }

  // Ensure version format
  if (!obj.version || !/^\d+\.\d+$/.test(obj.version)) {
    obj.version = '1.0';
  }

  return obj;
}

export { topicSchema, eventSchema };