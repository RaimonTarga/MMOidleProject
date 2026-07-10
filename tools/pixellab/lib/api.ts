import { requireApiKey } from './env';

const BASE_URL = 'https://api.pixellab.ai/v2';
const REQUEST_TIMEOUT_MS = 180_000;
const MAX_RETRIES = 3;

export interface Base64Image {
  type: 'base64';
  base64: string;
  format?: string;
}

export interface Usage {
  type?: 'usd' | 'generations';
  usd?: number | null;
  generations?: number | null;
}

export interface ImageResponse {
  usage?: Usage | null;
  image: Base64Image;
}

export interface JobStartResponse {
  usage?: Usage | null;
  background_job_id: string;
  status?: string;
}

export interface BalanceResponse {
  credits: { type: 'usd'; usd: number };
  subscription: {
    status: string;
    plan?: string | null;
    generations: number;
    total: number;
  };
}

export class PixelLabApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = 'PixelLabApiError';
  }
}

export function toBase64Image(buffer: Buffer): Base64Image {
  return { type: 'base64', base64: buffer.toString('base64'), format: 'png' };
}

export function fromBase64Image(image: Base64Image): Buffer {
  return Buffer.from(image.base64, 'base64');
}

/** usage.usd when priced in USD, else null (generation-quota subscriptions). */
export function usageUsd(usage: Usage | null | undefined): number | null {
  if (!usage) return null;
  return typeof usage.usd === 'number' ? usage.usd : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(pathname: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const key = requireApiKey();
  let lastError: Error = new Error('unreachable');
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(2000 * 2 ** (attempt - 1));
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${pathname}`, {
        method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue; // network error / timeout → retry
    }
    if (res.ok) return (await res.json()) as T;
    const body = await res.text();
    lastError = new PixelLabApiError(
      `PixelLab ${pathname} → HTTP ${res.status}: ${body.slice(0, 300)}`,
      res.status,
      body,
    );
    // Retry rate limits and server errors; anything else is a caller bug.
    if (res.status !== 429 && res.status < 500) throw lastError;
  }
  throw lastError;
}

// ── Sync image endpoints ──────────────────────────────────────────────────────

export interface PixfluxBody {
  description: string;
  negative_description?: string;
  image_size: { width: number; height: number }; // max 400×400
  no_background?: boolean;
  outline?: string;
  shading?: string;
  detail?: string;
  view?: string;
  direction?: string;
  seed?: number;
  init_image?: Base64Image;
  init_image_strength?: number;
  color_image?: Base64Image;
  text_guidance_scale?: number;
}

export interface BitforgeBody {
  description: string;
  negative_description?: string;
  image_size: { width: number; height: number }; // max 200×200
  no_background?: boolean;
  style_image?: Base64Image;
  style_strength?: number; // 0-100
  outline?: string;
  shading?: string;
  detail?: string;
  view?: string;
  direction?: string;
  seed?: number;
  init_image?: Base64Image;
  init_image_strength?: number;
  text_guidance_scale?: number;
}

export function createImagePixflux(body: PixfluxBody): Promise<ImageResponse> {
  return request<ImageResponse>('/create-image-pixflux', { body });
}

export function createImageBitforge(body: BitforgeBody): Promise<ImageResponse> {
  return request<ImageResponse>('/create-image-bitforge', { body });
}

// ── Async (background-job) endpoints ──────────────────────────────────────────

export interface GenerateUiBody {
  description: string;
  image_size?: { width: number; height: number }; // max 792×688
  no_background?: boolean;
  color_palette?: string;
  seed?: number;
}

export interface AnimateWithTextBody {
  first_frame: Base64Image;
  last_frame?: Base64Image;
  action: string;
  frame_count?: number; // max 16
  no_background?: boolean;
  seed?: number;
}

interface BackgroundJob {
  usage?: Usage | null;
  id: string;
  status: string;
  last_response?: unknown;
}

export interface JobResult {
  images: Buffer[];
  usage: Usage | null;
}

/** Recursively collect every base64 image object in a background-job response. */
export function extractImages(value: unknown, found: Buffer[] = []): Buffer[] {
  if (Array.isArray(value)) {
    for (const item of value) extractImages(item, found);
  } else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.base64 === 'string' && obj.base64.length > 0) {
      found.push(Buffer.from(obj.base64, 'base64'));
    } else {
      for (const v of Object.values(obj)) extractImages(v, found);
    }
  }
  return found;
}

async function pollJob(jobId: string, initialUsage: Usage | null | undefined): Promise<JobResult> {
  const startedAt = Date.now();
  const timeoutMs = 10 * 60_000;
  for (;;) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`PixelLab background job ${jobId} timed out after 10 minutes`);
    }
    const job = await request<BackgroundJob>(`/background-jobs/${jobId}`);
    const status = job.status.toLowerCase();
    if (status === 'completed' || status === 'complete' || status === 'succeeded') {
      const images = extractImages(job.last_response);
      if (images.length === 0) {
        throw new Error(`PixelLab job ${jobId} completed but no images found in response`);
      }
      return { images, usage: job.usage ?? initialUsage ?? null };
    }
    if (status === 'failed' || status === 'error' || status === 'cancelled') {
      throw new Error(
        `PixelLab job ${jobId} ${status}: ${JSON.stringify(job.last_response).slice(0, 300)}`,
      );
    }
    await sleep(4000);
  }
}

export async function generateUi(body: GenerateUiBody): Promise<JobResult> {
  const start = await request<JobStartResponse>('/generate-ui-v2', { body });
  return pollJob(start.background_job_id, start.usage);
}

export async function animateWithText(body: AnimateWithTextBody): Promise<JobResult> {
  const start = await request<JobStartResponse>('/animate-with-text-v3', { body });
  return pollJob(start.background_job_id, start.usage);
}

// ── Account ───────────────────────────────────────────────────────────────────

export function getBalance(): Promise<BalanceResponse> {
  return request<BalanceResponse>('/balance');
}
