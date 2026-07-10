import fs from 'node:fs';
import path from 'node:path';
import { LOCK_PATH } from './paths';

/** One paid API call. The lockfile doubles as the spend ledger. */
export interface LockCall {
  at: string; // ISO timestamp
  endpoint: string;
  category: string;
  assetId: string;
  requestHash: string;
  /** Real cost reported by the API (`usage.usd`), null if the key is generation-quota based. */
  usd: number | null;
  candidateFiles: string[];
}

export interface LockFile {
  calls: LockCall[];
}

export function readLock(): LockFile {
  if (!fs.existsSync(LOCK_PATH)) return { calls: [] };
  return JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8')) as LockFile;
}

export function appendCall(call: LockCall): void {
  const lock = readLock();
  lock.calls.push(call);
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  fs.writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n');
}

export function totalSpendUsd(lock: LockFile = readLock()): number {
  return lock.calls.reduce((sum, c) => sum + (c.usd ?? 0), 0);
}
