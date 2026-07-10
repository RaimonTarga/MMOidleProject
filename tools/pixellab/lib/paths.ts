import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // tools/pixellab/lib

export const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
export const ART_DIR = path.join(REPO_ROOT, 'art');
export const MANIFESTS_DIR = path.join(ART_DIR, 'manifests');
export const ART_SRC_DIR = path.join(ART_DIR, 'src');
export const CANDIDATES_DIR = path.join(ART_DIR, 'candidates');
export const STYLE_DIR = path.join(ART_DIR, 'style');
export const LOCK_PATH = path.join(ART_DIR, 'pixellab.lock.json');
export const CLIENT_ASSETS_DIR = path.join(REPO_ROOT, 'client', 'public', 'assets');

/** Normalize a frame/out path to forward slashes (atlas frame names are POSIX-style). */
export function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

/** Absolute path of an `out` entry inside art/src. */
export function srcPathFor(out: string): string {
  return path.join(ART_SRC_DIR, ...out.split('/'));
}
