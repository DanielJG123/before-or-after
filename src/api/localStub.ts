// Local development stub API client

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
  StrictTopicJson
} from '@/types/api';
import { canonicalTopicKey, isNearDuplicate } from '@/lib/duplicate';
import { estimateEventCount } from '@/lib/eventEstimator';

// In-memory storage for development
const topics: Map<string, StrictTopicJson> = new Map();
const topicSummaries: Array<{
  id: string;
  key: string;
  period: { label: string; start_year: number; end_year: number };
  location: string;
  theme?: string;
  eventCount: number;
  createdAt: string;
}> = [];

class LocalStubApiClient implements ApiClient {
  private delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateTopic(request: ValidateTopicRequest): Promise<ValidateTopicResponse> {
    console.log('🧪 Local API: Validating topic', request);
    await this.delay(300);

    // Simple period parsing for demo
    let period: { label: string; start_year: number; end_year: number };
    
    if (request.period.toLowerCase().includes('victorian')) {
      period = { label: 'Victorian Era', start_year: 1837, end_year: 1901 };
    } else if (request.period.toLowerCase().includes('world war')) {
      period = { label: 'World War Era', start_year: 1914, end_year: 1945 };
    } else {
      // Try to parse year range
      const match = request.period.match(/(\d{4})-(\d{4})/);
      if (match) {
        period = {
          label: request.period,
          start_year: parseInt(match[1]),
          end_year: parseInt(match[2])
        };
      } else {
        period = { label: request.period, start_year: 1800, end_year: 1900 };
      }
    }

    const normalized = {
      period,
      location: request.location.trim(),
      theme: request.theme?.trim()
    };

    // Check for duplicates
    const topicKey = { period: normalized.period, location: normalized.location, theme: normalized.theme };
    
    for (const existing of topicSummaries) {
      if (isNearDuplicate(topicKey, existing, 0.8)) {
        return {
          ok: false,
          duplicateOf: existing.id
        };
      }
    }

    return {
      ok: true,
      normalized
    };
  }

  async createTopic(request: CreateTopicRequest): Promise<CreateTopicResponse> {
    console.log('🧪 Local API: Creating topic', request);
    await this.delay(400);

    const topicId = `topic_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const key = canonicalTopicKey(request);

    // Add to summaries
    topicSummaries.push({
      id: topicId,
      key,
      period: request.period,
      location: request.location,
      theme: request.theme,
      eventCount: request.desiredCount,
      createdAt: new Date().toISOString()
    });

    return {
      id: topicId,
      key,
      created: true
    };
  }

  async generateTopic(topicId: string, request: GenerateTopicRequest): Promise<GenerateTopicResponse> {
    console.log('🧪 Local API: Generating events for topic', topicId);
    await this.delay(2000); // Simulate LLM call

    const summary = topicSummaries.find(t => t.id === topicId);
    if (!summary) {
      throw new Error('Topic not found');
    }

    // Generate mock topic data
    const mockTopic: StrictTopicJson = {
      topic_id: topicId,
      period: summary.period,
      location: summary.location,
      theme: summary.theme,
      events: this.generateMockEvents(summary),
      version: '1.0'
    };

    // Store in topics map
    topics.set(topicId, mockTopic);

    return { topic: mockTopic };
  }

  async selectImage(request: ImageSelectRequest): Promise<ImageSelectResponse> {
    console.log('🧪 Local API: Selecting image for event', request.eventId);
    await this.delay(800);

    // Mock image selection
    return {
      image: {
        image_url: '/placeholder.svg',
        source_url: 'https://example.com/source',
        license: 'CC0 1.0 Universal',
        creator: 'Mock Creator',
        title: `Image for ${request.eventTitle}`,
        credit_line: 'Development placeholder image'
      }
    };
  }

  async listTopics(): Promise<ListTopicsResponse> {
    console.log('🧪 Local API: Listing topics');
    await this.delay(200);

    return {
      topics: [...topicSummaries]
    };
  }

  async getTopic(topicId: string): Promise<GetTopicResponse> {
    console.log('🧪 Local API: Getting topic', topicId);
    await this.delay(300);

    const topic = topics.get(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    return { topic };
  }

  private generateMockEvents(summary: any) {
    const count = estimateEventCount(summary.period.start_year, summary.period.end_year, summary.theme);
    const events = [];

    const baseEvents = [
      'Great Fire', 'Industrial Revolution Begins', 'Railway Construction',
      'Political Reform Act', 'Economic Crisis', 'Scientific Discovery',
      'Literary Publication', 'Artistic Movement', 'Social Reform',
      'Military Campaign', 'Diplomatic Treaty', 'Technological Innovation'
    ];

    for (let i = 0; i < count; i++) {
      const yearRange = summary.period.end_year - summary.period.start_year;
      const randomYear = summary.period.start_year + Math.floor(Math.random() * yearRange);
      
      const eventTitle = `${baseEvents[i % baseEvents.length]} of ${summary.location}`;
      
      events.push({
        id: `evt_${summary.id}_${i}`,
        title: eventTitle,
        year: randomYear,
        precision: 'year' as const,
        summary: `A significant historical event that occurred in ${summary.location} during ${randomYear}.`,
        sources: ['https://example.com/source1', 'https://example.com/source2'],
        image_candidates: [
          { query: eventTitle.toLowerCase(), reason: 'Primary event description' },
          { query: `${summary.location} ${randomYear}`, reason: 'Location and time context' }
        ],
        tags: [summary.theme || 'general', summary.location.toLowerCase(), 'historical']
      });
    }

    return events.sort((a, b) => a.year - b.year);
  }
}

export const localStubApiClient = new LocalStubApiClient();