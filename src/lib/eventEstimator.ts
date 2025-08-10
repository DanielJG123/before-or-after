// Event count estimation utility

/**
 * Estimate the appropriate number of events for a topic
 * Based on time span and thematic breadth
 */
export function estimateEventCount(
  startYear: number, 
  endYear: number, 
  theme?: string
): number {
  const span = Math.max(1, endYear - startYear + 1);
  
  // Determine breadth multiplier based on theme
  const breadth = getThemeBreadth(theme);
  
  // Base calculation: logarithmic scaling with breadth adjustment
  const baseCount = 7 * Math.log2(span + 2) * breadth;
  
  // Clamp to reasonable range
  return Math.max(12, Math.min(40, Math.round(baseCount)));
}

/**
 * Get breadth multiplier for different themes
 */
function getThemeBreadth(theme?: string): number {
  if (!theme) return 1.0;
  
  const themeNormalized = theme.toLowerCase();
  
  // Broad themes have more events available
  if (/politic|general|culture/i.test(themeNormalized)) {
    return 1.2;
  }
  
  // Niche themes have fewer events
  if (/numism|niche|specific|specialized/i.test(themeNormalized)) {
    return 0.8;
  }
  
  // Theme-specific adjustments
  const themeMultipliers: Record<string, number> = {
    'military': 1.1,    // Wars generate many events
    'science': 0.9,     // Scientific breakthroughs are rarer
    'religion': 0.9,    // Religious events are less frequent
    'economics': 1.0,   // Economic events are steady
    'social': 1.1,      // Social movements generate events
    'exploration': 0.85, // Exploration events are more rare
    'art': 0.9,         // Artistic movements less frequent
    'technology': 0.95  // Tech events less frequent historically
  };
  
  return themeMultipliers[themeNormalized] || 1.0;
}

/**
 * Get a detailed breakdown of the estimation
 */
export interface EstimationBreakdown {
  estimatedCount: number;
  span: number;
  breadthMultiplier: number;
  rawScore: number;
  reasoning: string;
}

export function getEstimationBreakdown(
  startYear: number,
  endYear: number, 
  theme?: string
): EstimationBreakdown {
  const span = Math.max(1, endYear - startYear + 1);
  const breadthMultiplier = getThemeBreadth(theme);
  const rawScore = 7 * Math.log2(span + 2) * breadthMultiplier;
  const estimatedCount = Math.max(12, Math.min(40, Math.round(rawScore)));
  
  let reasoning = `For a ${span}-year period`;
  if (theme) {
    reasoning += ` focusing on ${theme}`;
  }
  reasoning += `, we estimate ${estimatedCount} significant events.`;
  
  if (span < 50) {
    reasoning += ' Short periods may include broader regional events.';
  } else if (span > 1000) {
    reasoning += ' Long periods focus on the most significant events.';
  }
  
  return {
    estimatedCount,
    span,
    breadthMultiplier,
    rawScore,
    reasoning
  };
}

/**
 * Suggest adjustments based on historical density
 */
export function suggestAdjustments(
  startYear: number,
  endYear: number,
  location: string,
  theme?: string
): {
  adjustment: number;
  reasoning: string;
} {
  let adjustment = 1.0;
  let reasoning = '';
  
  const span = endYear - startYear + 1;
  
  // Very short periods might need expansion
  if (span < 3) {
    adjustment = 1.3;
    reasoning = 'Very short period - including broader regional context may help.';
    return { adjustment, reasoning };
  }
  
  // Historical "hot spots" - periods/locations with high event density
  const isWarPeriod = isHighConflictPeriod(startYear, endYear);
  const isMajorLocation = isMajorHistoricalLocation(location);
  
  if (isWarPeriod && isMajorLocation) {
    adjustment = 1.2;
    reasoning = 'Major location during a conflict-heavy period - expect more events.';
  } else if (isWarPeriod) {
    adjustment = 1.1;
    reasoning = 'Conflict-heavy period - more military and political events likely.';
  } else if (isMajorLocation) {
    adjustment = 1.05;
    reasoning = 'Major historical location - good event density expected.';
  }
  
  return { adjustment, reasoning };
}

/**
 * Check if period overlaps with major conflict eras
 */
function isHighConflictPeriod(startYear: number, endYear: number): boolean {
  const conflictPeriods = [
    { start: 1914, end: 1918 }, // WWI
    { start: 1939, end: 1945 }, // WWII
    { start: 1947, end: 1991 }, // Cold War
    { start: 1775, end: 1783 }, // American Revolution
    { start: 1789, end: 1815 }, // French Revolution & Napoleonic Wars
    { start: 1861, end: 1865 }, // American Civil War
  ];
  
  return conflictPeriods.some(period => 
    !(endYear < period.start || startYear > period.end)
  );
}

/**
 * Check if location is historically significant
 */
function isMajorHistoricalLocation(location: string): boolean {
  const locationNormalized = location.toLowerCase();
  
  const majorLocations = [
    'england', 'france', 'germany', 'italy', 'spain', 'russia',
    'united states', 'china', 'japan', 'india', 'egypt',
    'rome', 'athens', 'constantinople', 'istanbul', 'vienna',
    'paris', 'london', 'berlin', 'moscow', 'new york', 'washington'
  ];
  
  return majorLocations.some(major => 
    locationNormalized.includes(major) || major.includes(locationNormalized)
  );
}