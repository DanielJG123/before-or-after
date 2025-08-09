// Historical events data for the "Before or After?" game
import printingPress from '@/assets/printing-press.webp';
import moonLanding from '@/assets/moon-landing.webp';
import berlinWall from '@/assets/berlin-wall.webp';
import wrightBrothers from '@/assets/wright-brothers.webp';

export interface HistoricalEvent {
  id: string;
  title: string;
  year: number;
  description: string;
  image: string;
  context?: string;
}

// S3 bucket URL for historical events data
const S3_BUCKET_URL = 'https://before-or-after-events-json.s3.eu-west-2.amazonaws.com/events.json';

// Local cache for fetched events
let eventsCache: HistoricalEvent[] | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Initialize the events data once at startup
const initializeEvents = async (): Promise<void> => {
  if (isInitialized) return;
  
  try {
    console.log('Fetching historical events from S3...');
    const response = await fetch(S3_BUCKET_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }
    
    const eventsData = await response.json();
    
    // Map image references to actual imported assets
    eventsCache = eventsData.map((event: any) => {
      let imagePath = event.image;
      
      switch (event.id) {
        case 'printing-press':
          imagePath = printingPress;
          break;
        case 'moon-landing':
          imagePath = moonLanding;
          break;
        case 'berlin-wall':
          imagePath = berlinWall;
          break;
        case 'wright-brothers':
          imagePath = wrightBrothers;
          break;
        default:
          // For events without specific images, use placeholder
          imagePath = event.image || '/placeholder.svg';
      }
      
      return {
        ...event,
        image: imagePath
      };
    });
    
    console.log(`Successfully loaded ${eventsCache.length} historical events`);
    isInitialized = true;
  } catch (error) {
    console.error('Error fetching historical events:', error);
    // Fallback to empty array if fetch fails
    eventsCache = [];
    isInitialized = true;
    throw error;
  }
};

// Get the initialization promise (ensures only one fetch happens)
const getInitializationPromise = (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = initializeEvents();
  }
  return initializationPromise;
};

// Get all historical events (waits for initialization if needed)
export const getHistoricalEvents = async (): Promise<HistoricalEvent[]> => {
  if (!isInitialized) {
    await getInitializationPromise();
  }
  return eventsCache || [];
};

// Get a random pair of events (synchronous after initialization)
export const getRandomEventPair = (excludeIds: string[] = []): [HistoricalEvent, HistoricalEvent] => {
  if (!isInitialized || !eventsCache) {
    throw new Error('Historical events not yet initialized. Call getHistoricalEvents() first.');
  }
  
  console.log('getRandomEventPair called with excludeIds:', excludeIds);
  
  const availableEvents = eventsCache.filter(event => !excludeIds.includes(event.id));
  
  if (availableEvents.length < 2) {
    console.warn('Not enough events available, resetting exclude list');
    return getRandomEventPair([]);
  }
  
  // Shuffle and pick first two
  const shuffled = [...availableEvents].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
};

// Check if an answer is correct
export const checkAnswer = (
  leftEvent: HistoricalEvent,
  rightEvent: HistoricalEvent,
  userAnswer: 'before' | 'after'
): boolean => {
  const isCorrect = userAnswer === 'before' 
    ? rightEvent.year < leftEvent.year
    : rightEvent.year > leftEvent.year;
  
  return isCorrect;
};

// Force refresh the events cache (useful for development/testing)
export const refreshEvents = async (): Promise<void> => {
  isInitialized = false;
  eventsCache = null;
  initializationPromise = null;
  await getInitializationPromise();
};

// Check if events are initialized
export const isEventsInitialized = (): boolean => {
  return isInitialized;
};