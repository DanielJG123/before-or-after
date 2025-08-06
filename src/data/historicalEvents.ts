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

export const historicalEvents: HistoricalEvent[] = [
  {
    id: 'printing-press',
    title: 'Gutenberg Invents the Printing Press',
    year: 1440,
    description: 'Johannes Gutenberg revolutionized communication by inventing movable type printing, making books accessible to the masses.',
    image: printingPress,
    context: 'This invention sparked the Renaissance and Reformation by making knowledge widely available.'
  },
  {
    id: 'moon-landing',
    title: 'First Moon Landing',
    year: 1969,
    description: 'Neil Armstrong and Buzz Aldrin became the first humans to walk on the Moon during the Apollo 11 mission.',
    image: moonLanding,
    context: 'This achievement fulfilled President Kennedy\'s goal of landing on the Moon before the end of the 1960s.'
  },
  {
    id: 'berlin-wall',
    title: 'Construction of the Berlin Wall',
    year: 1961,
    description: 'East Germany built a wall separating East and West Berlin, becoming a symbol of the Cold War division.',
    image: berlinWall,
    context: 'The wall stood for 28 years until it was torn down in 1989, marking the end of the Cold War era.'
  },
  {
    id: 'wright-flight',
    title: 'Wright Brothers\' First Flight',
    year: 1903,
    description: 'Orville and Wilbur Wright achieved the first powered, sustained, and controlled airplane flight at Kitty Hawk.',
    image: wrightBrothers,
    context: 'This 12-second flight launched the age of aviation and changed transportation forever.'
  },
  {
    id: 'internet',
    title: 'Birth of the World Wide Web',
    year: 1991,
    description: 'Tim Berners-Lee created the first website and web browser, launching the public Internet.',
    image: '/api/placeholder/400/300', // Placeholder for now
    context: 'This invention transformed global communication and commerce in ways still unfolding today.'
  },
  {
    id: 'television',
    title: 'First Television Broadcast',
    year: 1936,
    description: 'The BBC began the world\'s first regular television service, broadcasting to London and surrounding areas.',
    image: '/api/placeholder/400/300', // Placeholder for now
    context: 'Television would go on to become the dominant form of entertainment and news distribution.'
  },
  {
    id: 'penicillin',
    title: 'Discovery of Penicillin',
    year: 1928,
    description: 'Alexander Fleming discovered penicillin, the first true antibiotic, revolutionizing medicine.',
    image: '/api/placeholder/400/300', // Placeholder for now
    context: 'This discovery has saved millions of lives and launched the age of antibiotics.'
  },
  {
    id: 'dna-structure',
    title: 'DNA Structure Discovered',
    year: 1953,
    description: 'Watson, Crick, Franklin, and Wilkins discovered the double helix structure of DNA.',
    image: '/api/placeholder/400/300', // Placeholder for now
    context: 'This breakthrough laid the foundation for modern genetics and biotechnology.'
  }
];

// Utility function to get random event pairs
export const getRandomEventPair = (excludeIds: string[] = []): [HistoricalEvent, HistoricalEvent] => {
  const availableEvents = historicalEvents.filter(event => !excludeIds.includes(event.id));
  
  if (availableEvents.length < 2) {
    // Reset if we've used all events
    return getRandomEventPair([]);
  }
  
  const shuffled = [...availableEvents].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
};

// Check which event came first
export const checkAnswer = (selectedEvent: HistoricalEvent, otherEvent: HistoricalEvent): boolean => {
  return selectedEvent.year <= otherEvent.year;
};