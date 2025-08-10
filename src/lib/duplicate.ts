// Duplicate detection utilities for topics

import { createHash } from 'crypto';

interface TopicKey {
  period: {
    label: string;
    start_year: number;
    end_year: number;
  };
  location: string;
  theme?: string;
}

/**
 * Generate a canonical topic key for exact duplicate detection
 */
export function canonicalTopicKey(topic: TopicKey): string {
  const { period, location, theme } = topic;
  const normalizedString = `${period.label}|${period.start_year}-${period.end_year}|${location}|${theme || 'general'}`;
  
  // SHA-256 hash for consistent key generation
  return createHash('sha256')
    .update(normalizedString.toLowerCase())
    .digest('hex');
}

/**
 * Create a text fingerprint for similarity detection
 */
export function textFingerprint(text: string): string {
  // Common English stopwords to remove
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'among', 'throughout',
    'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may',
    'might', 'must', 'shall', 'age', 'era', 'period', 'time', 'century'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word))
    .sort() // Sort for consistent comparison
    .join(' ');
}

/**
 * Simple hash function for MinHash-style similarity
 */
function simpleHash(str: string, seed: number = 0): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

/**
 * Generate MinHash signature for approximate similarity
 */
export function generateMinHashSignature(text: string, numHashes: number = 64): number[] {
  const fingerprint = textFingerprint(text);
  const words = fingerprint.split(' ');
  const signature: number[] = [];

  for (let i = 0; i < numHashes; i++) {
    let minHash = Infinity;
    for (const word of words) {
      const hash = simpleHash(word, i);
      if (hash < minHash) {
        minHash = hash;
      }
    }
    signature.push(minHash === Infinity ? 0 : minHash);
  }

  return signature;
}

/**
 * Calculate Jaccard similarity between two MinHash signatures
 */
export function jaccardSimilarity(sig1: number[], sig2: number[]): number {
  if (sig1.length !== sig2.length) return 0;
  
  let matches = 0;
  for (let i = 0; i < sig1.length; i++) {
    if (sig1[i] === sig2[i]) {
      matches++;
    }
  }
  
  return matches / sig1.length;
}

/**
 * Check if two topics are near duplicates (client-side preflight)
 */
export function isNearDuplicate(
  topicA: TopicKey, 
  topicB: TopicKey,
  threshold: number = 0.7
): boolean {
  // First check if periods overlap significantly
  const periodOverlap = calculatePeriodOverlap(topicA.period, topicB.period);
  if (periodOverlap < 0.3) {
    return false; // Not enough temporal overlap
  }

  // Check location similarity
  const locationSim = textSimilarity(topicA.location, topicB.location);
  if (locationSim < 0.5) {
    return false; // Different locations
  }

  // Check theme similarity (if both have themes)
  let themeSim = 1.0; // Default to similar if one/both don't have themes
  if (topicA.theme && topicB.theme) {
    themeSim = textSimilarity(topicA.theme, topicB.theme);
  }

  // Combined similarity score
  const overallSimilarity = (periodOverlap * 0.4 + locationSim * 0.4 + themeSim * 0.2);
  
  return overallSimilarity >= threshold;
}

/**
 * Calculate temporal overlap between two periods (0 to 1)
 */
function calculatePeriodOverlap(
  periodA: { start_year: number; end_year: number },
  periodB: { start_year: number; end_year: number }
): number {
  const overlapStart = Math.max(periodA.start_year, periodB.start_year);
  const overlapEnd = Math.min(periodA.end_year, periodB.end_year);
  
  if (overlapStart >= overlapEnd) {
    return 0; // No overlap
  }
  
  const overlapDuration = overlapEnd - overlapStart;
  const unionStart = Math.min(periodA.start_year, periodB.start_year);
  const unionEnd = Math.max(periodA.end_year, periodB.end_year);
  const unionDuration = unionEnd - unionStart;
  
  return overlapDuration / unionDuration;
}

/**
 * Simple text similarity using MinHash
 */
function textSimilarity(textA: string, textB: string): number {
  const sigA = generateMinHashSignature(textA);
  const sigB = generateMinHashSignature(textB);
  return jaccardSimilarity(sigA, sigB);
}

/**
 * Create a short fingerprint for quick comparison
 */
export function createShortFingerprint(topic: TopicKey): string {
  const combined = `${topic.period.label} ${topic.location} ${topic.theme || ''}`;
  const fingerprint = textFingerprint(combined);
  const signature = generateMinHashSignature(fingerprint, 8);
  
  return signature
    .map(num => num.toString(36))
    .join('')
    .substring(0, 12);
}