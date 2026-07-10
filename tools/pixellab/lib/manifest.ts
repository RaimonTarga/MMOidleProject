import fs from 'node:fs';
import path from 'node:path';
import { MANIFESTS_DIR } from './paths';

export type AssetStatus = 'draft' | 'pending' | 'accepted' | 'regen';
export type EndpointId = 'bitforge' | 'pixflux' | 'generate-ui' | 'animate-with-text';

export const ENDPOINT_IDS: EndpointId[] = [
  'bitforge',
  'pixflux',
  'generate-ui',
  'animate-with-text',
];
const STATUSES: AssetStatus[] = ['draft', 'pending', 'accepted', 'regen'];

export interface AssetSize {
  w: number;
  h: number;
}

export interface AssetEntry {
  /** Unique within its category; usually the output filename stem. */
  id: string;
  /** Ship destination: atlas frame name (e.g. `sprites/monsters/boar.png`) or `files/<relpath>`. */
  out: string;
  /** Final shipped pixel size. Candidates are NN-resized to this on accept. */
  size: AssetSize;
  /** Generation prompt. Empty prompt = not ready to generate. */
  prompt: string;
  negative?: string;
  /** Overrides the category default endpoint. */
  endpoint?: EndpointId;
  /** Style anchor path relative to art/ (e.g. `style/creatures.png`); null = none. */
  styleRef?: string | null;
  /** Candidate count per generation batch; falls back to category default. */
  candidates?: number;
  /**
   * draft    → not ready (no prompt yet); generate skips it
   * pending  → generate produces candidates; with candidates present it awaits review
   * accepted → winner lives at art/src/<out>
   * regen    → rejected in review; generate re-runs it (see notes for guidance)
   */
  status: AssetStatus;
  notes?: string;
  /** Game ids that use this asset (informational, filled by seed). */
  sources?: string[];
  /** Extra endpoint params passed through to the API body (seed, outline, view, ...). */
  params?: Record<string, unknown>;
}

export interface CategoryManifest {
  category: string;
  endpoint: EndpointId;
  styleRef: string | null;
  /** Request background removal (true for sprites/icons, false for backgrounds). */
  noBackground: boolean;
  candidates: number;
  entries: AssetEntry[];
}

export interface LoadedManifest {
  filePath: string;
  manifest: CategoryManifest;
}

export function manifestPath(category: string): string {
  return path.join(MANIFESTS_DIR, `${category}.json`);
}

export function loadManifests(): LoadedManifest[] {
  if (!fs.existsSync(MANIFESTS_DIR)) return [];
  return fs
    .readdirSync(MANIFESTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const filePath = path.join(MANIFESTS_DIR, f);
      const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8')) as CategoryManifest;
      validateManifest(manifest, f);
      return { filePath, manifest };
    });
}

export function saveManifest(loaded: LoadedManifest): void {
  fs.mkdirSync(path.dirname(loaded.filePath), { recursive: true });
  fs.writeFileSync(loaded.filePath, JSON.stringify(loaded.manifest, null, 2) + '\n');
}

export function validateManifest(m: CategoryManifest, source: string): void {
  const problems: string[] = [];
  if (!m.category) problems.push('missing category');
  if (!ENDPOINT_IDS.includes(m.endpoint)) problems.push(`bad endpoint '${m.endpoint}'`);
  const seenIds = new Set<string>();
  const seenOuts = new Set<string>();
  for (const e of m.entries ?? []) {
    if (!e.id) problems.push('entry with empty id');
    if (seenIds.has(e.id)) problems.push(`duplicate id '${e.id}'`);
    seenIds.add(e.id);
    if (!e.out || (!e.out.includes('/') && !e.out.startsWith('files/'))) {
      problems.push(`entry '${e.id}' has suspicious out '${e.out}'`);
    }
    if (seenOuts.has(e.out)) problems.push(`duplicate out '${e.out}'`);
    seenOuts.add(e.out);
    if (!STATUSES.includes(e.status)) problems.push(`entry '${e.id}' bad status '${e.status}'`);
    if (e.endpoint && !ENDPOINT_IDS.includes(e.endpoint)) {
      problems.push(`entry '${e.id}' bad endpoint '${e.endpoint}'`);
    }
    if (!e.size || !(e.size.w > 0) || !(e.size.h > 0)) {
      problems.push(`entry '${e.id}' bad size`);
    }
  }
  if (problems.length) {
    throw new Error(`Invalid manifest ${source}:\n  - ${problems.join('\n  - ')}`);
  }
}

export interface ResolvedEntry {
  entry: AssetEntry;
  category: string;
  endpoint: EndpointId;
  styleRef: string | null;
  noBackground: boolean;
  candidates: number;
  loaded: LoadedManifest;
}

/** Flatten all manifests, applying category defaults to each entry. */
export function resolveEntries(manifests: LoadedManifest[]): ResolvedEntry[] {
  const out: ResolvedEntry[] = [];
  for (const loaded of manifests) {
    const m = loaded.manifest;
    for (const entry of m.entries) {
      out.push({
        entry,
        category: m.category,
        endpoint: entry.endpoint ?? m.endpoint,
        styleRef: entry.styleRef !== undefined ? entry.styleRef : m.styleRef,
        noBackground:
          typeof entry.params?.noBackground === 'boolean'
            ? (entry.params.noBackground as boolean)
            : m.noBackground,
        candidates: entry.candidates ?? m.candidates,
        loaded,
      });
    }
  }
  return out;
}
