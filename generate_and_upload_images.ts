/**
 * Script: generate-and-upload-images.ts
 * Purpose: For each event in events.json, generate an AI image, upload to S3, and write an updated events file with image URLs.
 * Runtime: Node 18+ or Bun
 *
 * Usage:
 *  bun run generate-and-upload-images.ts               # Bun
 *  npx ts-node generate-and-upload-images.ts           # Node (ts-node)
 *
 * Env vars required:
 *  - OPENAI_API_KEY=...
 *  - S3_BUCKET=before-or-after-events
 *  - S3_REGION=eu-west-2
 * Optional:
 *  - S3_PREFIX=events-images/           # key prefix in bucket
 *  - IMAGE_MODEL=gpt-image-1            # OpenAI image model
 *  - IMAGE_SIZE=1024x1024               # 256x256 | 512x512 | 1024x1024
 *  - DRY_RUN=true                       # don't call APIs, just print prompts
 *  - FORCE_REGENERATE=true              # overwrite existing image URL
 *  - CONCURRENCY=2                      # how many images in parallel
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ---- Types ----
export interface HistoricalEvent {
  id: string;
  title: string;
  year: number;
  description: string;
  image: string; // will be updated with an S3 URL
  context?: string;
}

// ---- Config ----
const EVENTS_PATH = path.resolve(process.cwd(), 'backend/events.json'); // change if needed
const OUTPUT_PATH = path.resolve(process.cwd(), 'backend/events.with_images.json');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gpt-image-1';
const IMAGE_SIZE = (process.env.IMAGE_SIZE || '1024x1024') as '256x256' | '512x512' | '1024x1024';

const S3_BUCKET = process.env.S3_BUCKET || '';
const S3_REGION = process.env.S3_REGION || 'eu-west-2';
const S3_PREFIX = (process.env.S3_PREFIX || 'events-images/').replace(/^\//, '');

const DRY_RUN = process.env.DRY_RUN === 'true';
const FORCE_REGENERATE = process.env.FORCE_REGENERATE === 'true';
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 2));

if (!S3_BUCKET) throw new Error('S3_BUCKET is required');
if (!OPENAI_API_KEY && !DRY_RUN) throw new Error('OPENAI_API_KEY is required (or set DRY_RUN=true)');

const s3 = new S3Client({ region: S3_REGION });

// ---- Helpers ----
function kebab(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function imageKeyFor(event: HistoricalEvent) {
  const base = `${kebab(event.id || event.title)}-${event.year}`;
  return `${S3_PREFIX}${base}.png`;
}

function s3UrlFor(key: string) {
  // Virtual-hosted–style URL
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

function promptFor(event: HistoricalEvent) {
  // Style prompt aimed at historically respectful, cohesive results
  return (
    `Historical illustration or photo depiction of "${event.title}" in the year ${event.year}. ` +
    `Accurate clothing, architecture, and technology for the period. ` +
    `No modern anachronisms. No text or watermarks. Center the main subject. ` +
    `If photography is impossible for the era, render as a detailed period-appropriate illustration or woodcut. ` +
    `Scene hint: ${event.description}`
  );
}

async function backoff(attempt: number) {
  const ms = Math.min(30000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
  await sleep(ms);
}

async function generateImagePngBase64(prompt: string): Promise<string> {
  // Calls OpenAI Images API. Returns base64 PNG string (no data URL prefix).
  // Reference: https://platform.openai.com/docs/guides/image-generation
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt,
          size: IMAGE_SIZE,
          response_format: 'b64_json',
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${text}`);
      }
      const json: any = await res.json();
      const b64 = json?.data?.[0]?.b64_json as string | undefined;
      if (!b64) throw new Error('No image data returned');
      return b64;
    } catch (err) {
      attempt++;
      if (attempt >= 5) throw err;
      await backoff(attempt);
    }
  }
}

async function uploadPngToS3(key: string, pngBytes: Uint8Array) {
  // Upload with public-read ACL for dev. Swap to private + CloudFront OAC for prod.
  const put = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: Buffer.from(pngBytes),
    ContentType: 'image/png',
    ACL: 'public-read',
    CacheControl: 'public, max-age=31536000, immutable',
  });
  await s3.send(put);
  return s3UrlFor(key);
}

async function processEvent(event: HistoricalEvent): Promise<{ event: HistoricalEvent; updated: boolean; url?: string }> {
  const key = imageKeyFor(event);
  const url = s3UrlFor(key);

  // Skip if already has an S3 URL and not forcing regeneration
  if (!FORCE_REGENERATE && typeof event.image === 'string' && event.image.startsWith(`https://${S3_BUCKET}.s3.`)) {
    return { event, updated: false, url: event.image };
  }

  const prompt = promptFor(event);
  if (DRY_RUN) {
    console.log(`[DRY] ${event.id}:`, prompt);
    return { event, updated: false };
  }

  const b64 = await generateImagePngBase64(prompt);
  const bytes = Buffer.from(b64, 'base64');
  const uploadedUrl = await uploadPngToS3(key, bytes);

  // Update image URL
  event.image = uploadedUrl;
  return { event, updated: true, url: uploadedUrl };
}

async function withConcurrency<T>(items: T[], limit: number, worker: (it: T, i: number) => Promise<void>) {
  const queue = [...items.entries()];
  const running: Promise<void>[] = [];

  for (let i = 0; i < limit; i++) {
    const next = queue.shift();
    if (!next) break;
    const p = worker(next[1], next[0]);
    running.push(p);
  }

  while (queue.length) {
    await Promise.race(running);
    // remove settled promises
    for (let i = running.length - 1; i >= 0; i--) {
      if ((running[i] as any).settled) running.splice(i, 1);
    }
    const next = queue.shift();
    if (next) {
      const p = worker(next[1], next[0]);
      (p as any).settled = false;
      p.finally(() => ((p as any).settled = true));
      running.push(p);
    }
  }

  await Promise.allSettled(running);
}

async function main() {
  const raw = await fs.readFile(EVENTS_PATH, 'utf8');
  const events = JSON.parse(raw) as HistoricalEvent[];

  let updatedCount = 0;
  let skippedCount = 0;

  const results: HistoricalEvent[] = [...events];

  let index = 0;
  await withConcurrency(results, CONCURRENCY, async (ev, i) => {
    try {
      const { updated, url } = await processEvent(ev);
      if (updated) updatedCount++; else skippedCount++;
      console.log(`${++index}/${results.length} ${ev.id} ${updated ? 'uploaded' : 'skipped'} ${url ? '-> ' + url : ''}`);
    } catch (e: any) {
      console.error(`Error on ${ev.id}:`, e?.message || e);
    }
  });

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nDone. Updated: ${updatedCount}, Skipped: ${skippedCount}.`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
