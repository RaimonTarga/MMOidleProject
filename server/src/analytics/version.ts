import { readFileSync } from 'fs';
import path from 'path';

let cachedGameVersion: string | null = null;

export function gameVersion(): string {
  cachedGameVersion ??= resolveGameVersion();
  return cachedGameVersion;
}

function resolveGameVersion(): string {
  const configured = process.env.GAME_VERSION?.trim();
  if (configured) return configured;

  for (const candidate of packageJsonCandidates()) {
    try {
      const parsed = JSON.parse(readFileSync(candidate, 'utf8')) as { version?: unknown };
      if (typeof parsed.version === 'string' && parsed.version.trim()) {
        return parsed.version.trim();
      }
    } catch {
      // Try the next candidate; dev/prod __dirname layouts differ.
    }
  }

  return 'unknown';
}

function packageJsonCandidates(): string[] {
  return [
    path.resolve(__dirname, '..', '..', '..', 'package.json'),
    path.resolve(__dirname, '..', '..', 'package.json'),
    path.resolve(process.cwd(), '..', 'package.json'),
    path.resolve(process.cwd(), 'package.json'),
  ];
}
