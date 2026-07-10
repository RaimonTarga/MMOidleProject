import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './paths';

let loaded = false;

/** Parse root .env (KEY=value lines) into process.env without overriding existing vars. */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  const envPath = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function requireApiKey(): string {
  loadEnv();
  const key = process.env.PIXELLAB_API_KEY;
  if (!key || key === 'paste-your-key-here') {
    throw new Error(
      'PIXELLAB_API_KEY is not set. Put it in the repo-root .env file (see .env.example).',
    );
  }
  return key;
}
