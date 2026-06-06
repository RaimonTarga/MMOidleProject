import pino from 'pino';
import pretty from 'pino-pretty';
import type { AdminLogEntry, AdminLogLevel } from '@mmo-idle/shared';
import { insertLogs } from './logdb/repo';

const LOG_RING_MAX = 2_000;
const LOG_QUEUE_MAX = 20_000;
const LOG_FLUSH_MS = 1_000;
const LOG_BATCH_SIZE = 250;
const META_MAX_CHARS = 4_000;

const LEVEL_BY_VALUE: Record<number, AdminLogLevel> = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

const INTERNAL_KEYS = new Set([
  'level',
  'time',
  'pid',
  'hostname',
  'name',
  'msg',
  'v',
]);

const ring: AdminLogEntry[] = [];
const queue: AdminLogEntry[] = [];
const listeners = new Set<(entry: AdminLogEntry) => void>();
let nextLogId = 1;
let droppedLogs = 0;
let flushing = false;
let lastDropWarningAt = 0;

function appendEntry(entry: AdminLogEntry): void {
  ring.push(entry);
  if (ring.length > LOG_RING_MAX) ring.splice(0, ring.length - LOG_RING_MAX);

  if (queue.length >= LOG_QUEUE_MAX) {
    queue.shift();
    droppedLogs += 1;
    const now = Date.now();
    if (now - lastDropWarningAt > 30_000) {
      lastDropWarningAt = now;
      process.stderr.write(`[log] dropping logs because queue is full; dropped=${droppedLogs}\n`);
    }
  }
  queue.push(entry);

  for (const listener of listeners) listener(entry);
}

function compactMeta(meta: Record<string, unknown>): Record<string, unknown> | undefined {
  const json = JSON.stringify(meta);
  if (json === '{}') return undefined;
  if (json.length <= META_MAX_CHARS) return meta;
  return {
    truncated: true,
    preview: json.slice(0, META_MAX_CHARS),
  };
}

function entryFromPinoLine(line: string): AdminLogEntry | null {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }

  const levelValue = typeof parsed.level === 'number' ? parsed.level : 30;
  const level = LEVEL_BY_VALUE[levelValue] ?? 'info';
  const meta: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!INTERNAL_KEYS.has(key)) meta[key] = value;
  }

  return {
    id: nextLogId++,
    ts: typeof parsed.time === 'number' ? parsed.time : Date.now(),
    level,
    logger: typeof parsed.name === 'string' ? parsed.name : 'server',
    message: typeof parsed.msg === 'string' ? parsed.msg : '',
    playerId: typeof parsed.playerId === 'string' ? parsed.playerId : undefined,
    accountId: typeof parsed.accountId === 'string' ? parsed.accountId : undefined,
    nodeId: typeof parsed.nodeId === 'string' ? parsed.nodeId : undefined,
    action: typeof parsed.action === 'string' ? parsed.action : undefined,
    meta: compactMeta(meta),
  };
}

const captureStream = {
  write(line: string): void {
    const entry = entryFromPinoLine(line);
    if (entry) appendEntry(entry);
  },
};

const outputStream =
  process.env.NODE_ENV === 'production'
    ? process.stdout
    : pretty({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      });

export const log = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    base: undefined,
    timestamp: pino.stdTimeFunctions.epochTime,
  },
  pino.multistream([
    { stream: outputStream },
    { stream: captureStream },
  ]),
);

export function recentAdminLogs(limit = LOG_RING_MAX): AdminLogEntry[] {
  return ring.slice(Math.max(0, ring.length - limit));
}

export function subscribeAdminLogs(listener: (entry: AdminLogEntry) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function droppedAdminLogCount(): number {
  return droppedLogs;
}

export async function flushQueuedLogs(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  try {
    const batch = queue.splice(0, LOG_BATCH_SIZE);
    await insertLogs(batch);
  } catch (err) {
    process.stderr.write(`[logdb] failed to flush logs: ${String(err)}\n`);
  } finally {
    flushing = false;
  }
}

const flushTimer = setInterval(() => {
  void flushQueuedLogs();
}, LOG_FLUSH_MS);
flushTimer.unref?.();
