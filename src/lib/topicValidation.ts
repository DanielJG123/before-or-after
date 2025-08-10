// Client-side topic validation utilities

interface PeriodParseResult {
  label: string;
  start_year: number;
  end_year: number;
}

interface ValidationError {
  field: string;
  message: string;
}

// Named historical periods mapping
const HISTORICAL_PERIODS: Record<string, { start: number; end: number }> = {
  // Prehistoric
  'stone age': { start: -3000000, end: -3300 },
  'bronze age': { start: -3300, end: -1200 },
  'iron age': { start: -1200, end: -50 },
  
  // Classical
  'ancient greece': { start: -800, end: -146 },
  'roman empire': { start: -27, end: 476 },
  'byzantine empire': { start: 330, end: 1453 },
  
  // Medieval
  'middle ages': { start: 476, end: 1453 },
  'medieval period': { start: 476, end: 1453 },
  'dark ages': { start: 476, end: 1000 },
  'high middle ages': { start: 1000, end: 1300 },
  'late middle ages': { start: 1300, end: 1453 },
  
  // Renaissance & Early Modern
  'renaissance': { start: 1400, end: 1600 },
  'early modern period': { start: 1450, end: 1800 },
  'age of exploration': { start: 1400, end: 1700 },
  'colonial period': { start: 1500, end: 1800 },
  
  // Modern Eras
  'industrial revolution': { start: 1760, end: 1840 },
  'victorian era': { start: 1837, end: 1901 },
  'gilded age': { start: 1870, end: 1900 },
  'belle époque': { start: 1871, end: 1914 },
  'progressive era': { start: 1890, end: 1920 },
  
  // 20th Century
  'world war i': { start: 1914, end: 1918 },
  'interwar period': { start: 1918, end: 1939 },
  'great depression': { start: 1929, end: 1939 },
  'world war ii': { start: 1939, end: 1945 },
  'cold war': { start: 1947, end: 1991 },
  'atomic age': { start: 1945, end: 1991 },
  'space age': { start: 1957, end: 1975 },
  'civil rights era': { start: 1950, end: 1968 },
  
  // Recent
  'modern era': { start: 1945, end: 2024 },
  'information age': { start: 1970, end: 2024 },
  'digital age': { start: 1990, end: 2024 },
};

/**
 * Parse and normalize a period string into structured data
 */
export function normalizePeriod(input: string): PeriodParseResult | ValidationError {
  const trimmed = input.trim().toLowerCase();
  
  if (!trimmed) {
    return { field: 'period', message: 'Period is required' };
  }

  // Check named periods first
  if (HISTORICAL_PERIODS[trimmed]) {
    const period = HISTORICAL_PERIODS[trimmed];
    return {
      label: input.trim(),
      start_year: period.start,
      end_year: period.end
    };
  }

  // Try to parse explicit year ranges
  const rangePatterns = [
    // "1837-1901", "1837–1901" (em dash), "1837 - 1901"  
    /^(-?\d{1,4})\s*[-–]\s*(-?\d{1,4})$/,
    // "1837 to 1901"
    /^(-?\d{1,4})\s+to\s+(-?\d{1,4})$/,
    // "1837-1901 CE", "500-400 BCE"
    /^(-?\d{1,4})\s*[-–]\s*(-?\d{1,4})\s*(ce|ad|bce|bc)$/,
  ];

  for (const pattern of rangePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let start = parseInt(match[1]);
      let end = parseInt(match[2]);
      
      // Handle BCE/BC (make negative)
      if (match[3] && (match[3] === 'bce' || match[3] === 'bc')) {
        start = -Math.abs(start);
        end = -Math.abs(end);
      }
      
      return {
        label: input.trim(),
        start_year: Math.min(start, end),
        end_year: Math.max(start, end)
      };
    }
  }

  // Try single year with modifier
  const singleYearPatterns = [
    // "around 1500", "circa 1500", "c. 1500"
    /^(?:around|circa|c\.)\s+(-?\d{1,4})(?:\s*(ce|ad|bce|bc))?$/,
    // Just a year: "1500"
    /^(-?\d{1,4})(?:\s*(ce|ad|bce|bc))?$/
  ];

  for (const pattern of singleYearPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let year = parseInt(match[1]);
      
      // Handle BCE/BC
      if (match[2] && (match[2] === 'bce' || match[2] === 'bc')) {
        year = -Math.abs(year);
      }
      
      // For single years, create a small range
      const span = Math.max(10, Math.abs(year) * 0.05); // 5% of year or min 10
      
      return {
        label: input.trim(),
        start_year: Math.floor(year - span),
        end_year: Math.floor(year + span)
      };
    }
  }

  return { 
    field: 'period', 
    message: 'Could not parse period. Use formats like "1837-1901", "Victorian Era", or "around 1500"' 
  };
}

/**
 * Normalize location string
 */
export function normalizeLocation(input: string): string | ValidationError {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { field: 'location', message: 'Location is required' };
  }

  if (trimmed.length < 2) {
    return { field: 'location', message: 'Location must be at least 2 characters' };
  }

  // Basic normalization - proper case and remove extra spaces
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize theme string
 */
export function normalizeTheme(input: string): string {
  if (!input) return '';
  
  const trimmed = input.trim().toLowerCase();
  
  // Map common variations to standard themes
  const themeMapping: Record<string, string> = {
    'politics': 'Politics',
    'political': 'Politics',
    'government': 'Politics',
    'war': 'Military',
    'military': 'Military',
    'warfare': 'Military',
    'battles': 'Military',
    'art': 'Culture',
    'arts': 'Culture',
    'culture': 'Culture',
    'cultural': 'Culture',
    'literature': 'Culture',
    'music': 'Culture',
    'science': 'Science',
    'scientific': 'Science',
    'technology': 'Science',
    'tech': 'Science',
    'invention': 'Science',
    'medicine': 'Science',
    'religion': 'Religion',
    'religious': 'Religion',
    'economics': 'Economics',
    'economic': 'Economics',
    'business': 'Economics',
    'trade': 'Economics',
    'social': 'Social',
    'society': 'Social',
    'exploration': 'Exploration',
    'discovery': 'Exploration',
  };

  return themeMapping[trimmed] || input.trim();
}

/**
 * Validate complete topic input with sanity checks
 */
export function validateTopicInput(
  period: string,
  location: string,
  theme?: string
): {
  valid: boolean;
  normalized?: {
    period: PeriodParseResult;
    location: string;
    theme?: string;
  };
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  // Validate period
  const periodResult = normalizePeriod(period);
  if ('field' in periodResult) {
    errors.push(periodResult);
  }

  // Validate location
  const locationResult = normalizeLocation(location);
  if (typeof locationResult !== 'string') {
    errors.push(locationResult);
  }

  // Sanity checks if period is valid
  if ('start_year' in periodResult) {
    const { start_year, end_year } = periodResult;
    
    if (end_year < start_year) {
      errors.push({ 
        field: 'period', 
        message: 'End year must be after start year' 
      });
    }
    
    if (end_year - start_year > 10000) {
      errors.push({ 
        field: 'period', 
        message: 'Period span cannot exceed 10,000 years' 
      });
    }
    
    const currentYear = new Date().getFullYear();
    if (start_year > currentYear + 1) {
      errors.push({ 
        field: 'period', 
        message: 'Start year cannot be in the future' 
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    normalized: {
      period: periodResult as PeriodParseResult,
      location: locationResult as string,
      theme: theme ? normalizeTheme(theme) : undefined
    },
    errors: []
  };
}

/**
 * Get available historical periods for autocomplete
 */
export function getHistoricalPeriods(): string[] {
  return Object.keys(HISTORICAL_PERIODS)
    .map(period => period.charAt(0).toUpperCase() + period.slice(1));
}

/**
 * Get period details for display
 */
export function getPeriodDetails(periodName: string): { start: number; end: number } | null {
  const period = HISTORICAL_PERIODS[periodName.toLowerCase()];
  return period ? { start: period.start, end: period.end } : null;
}