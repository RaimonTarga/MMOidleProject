// art:seed — create/refresh draft manifest entries from the game's registries
// and the imported art/src tree. Idempotent: existing entries keep their
// prompt/status/notes untouched; only missing entries are added and orphans
// (entries whose art/src file vanished) are reported.
//
// Run AFTER art:import. Usage: pnpm art:seed

import fs from 'node:fs';
import sharp from 'sharp';
// Relative import into shared/src: the @mmo-idle/shared alias only resolves from
// inside workspace packages, and tools/ is not one (same reason the dps/monster
// report tools import it the way they do).
import { MONSTER_FRAMES, PLAYER_FRAMES } from '../../shared/src/sprites/frameMaps';
import { walkFiles } from './lib/atlas';
import {
  loadManifests,
  manifestPath,
  saveManifest,
  type AssetEntry,
  type CategoryManifest,
  type EndpointId,
} from './lib/manifest';
import { ART_SRC_DIR, srcPathFor } from './lib/paths';
import path from 'node:path';

interface SeedSpec {
  category: string;
  endpoint: EndpointId;
  styleRef: string | null;
  noBackground: boolean;
  candidates: number;
  note?: string;
  collect: () => Array<{ out: string; sources?: string[]; notes?: string }>;
}

/** Group a frame-map (gameId → frame path) by frame path. */
function groupByFrame(map: Record<string, string>): Map<string, string[]> {
  const byFrame = new Map<string, string[]>();
  for (const [gameId, frame] of Object.entries(map)) {
    const list = byFrame.get(frame) ?? [];
    list.push(gameId);
    byFrame.set(frame, list);
  }
  return byFrame;
}

function filesUnder(prefix: string): string[] {
  const root = path.join(ART_SRC_DIR, ...prefix.split('/'));
  return walkFiles(root)
    .filter((f) => f.endsWith('.png'))
    .map((f) => `${prefix}/${f}`);
}

const SEEDS: SeedSpec[] = [
  {
    category: 'monsters',
    endpoint: 'bitforge',
    styleRef: 'style/creatures.png',
    noBackground: true,
    candidates: 3,
    collect: () =>
      [...groupByFrame(MONSTER_FRAMES)].map(([frame, ids]) => ({ out: frame, sources: ids })),
  },
  {
    category: 'players',
    endpoint: 'pixflux',
    styleRef: null,
    noBackground: true,
    candidates: 3,
    note:
      'Evolution-chain scheme (docs/player-sprites-current-state.md): bodies are flat ' +
      'img2img chains vagrant → class root → frame. New entries chain from their ' +
      'predecessor via params.initImage; stay draft until the predecessor is accepted.',
    collect: () =>
      [...groupByFrame(PLAYER_FRAMES)].map(([frame, ids]) => ({ out: frame, sources: ids })),
  },
  {
    category: 'items',
    endpoint: 'bitforge',
    styleRef: 'style/icons.png',
    noBackground: true,
    candidates: 3,
    collect: () => filesUnder('items').map((out) => ({ out })),
  },
  {
    category: 'ui-icons',
    endpoint: 'bitforge',
    styleRef: 'style/icons.png',
    noBackground: true,
    candidates: 3,
    collect: () => filesUnder('UI_icons').map((out) => ({ out })),
  },
  {
    category: 'ui-elements',
    endpoint: 'generate-ui',
    styleRef: null,
    noBackground: true,
    candidates: 2,
    note:
      'New assets (9-slice panel borders, buttons, bars) get added here by hand — ' +
      'they have no current-art counterpart. out paths go under files/ui/.',
    collect: () => filesUnder('files/ui').map((out) => ({ out })),
  },
  {
    category: 'effects',
    endpoint: 'animate-with-text',
    styleRef: null,
    noBackground: true,
    candidates: 1,
    note:
      'These are multi-frame strips. animate-with-text needs params.firstFrame (an art/src ' +
      'path) and params.action; generated frames are assembled into a horizontal strip.',
    collect: () => filesUnder('files/animations').map((out) => ({ out })),
  },
  {
    category: 'environment',
    endpoint: 'pixflux',
    styleRef: 'style/terrain.png',
    noBackground: true,
    candidates: 3,
    collect: () =>
      [
        ...filesUnder('files/environment'),
        ...filesUnder('files/ultimate_bosses'),
        ...filesUnder('files/emotes'),
      ].map((out) => ({
        out,
        notes: /_mask|_hitbox/.test(out)
          ? 'Derived mask/hitbox asset — rebuild from its parent art, do not prompt-generate.'
          : undefined,
      })),
  },
  {
    category: 'backgrounds',
    endpoint: 'pixflux',
    styleRef: 'style/terrain.png',
    noBackground: false,
    candidates: 3,
    note:
      'Shipped at 1254×1254; pixflux caps at 400×400. Candidates are generated at 400 and ' +
      'NN-upscaled to the manifest size on accept (lossless for pixel art).',
    collect: () =>
      walkFiles(ART_SRC_DIR)
        .filter((f) => /^files\/biome_[a-z]+\.png$/.test(f))
        .map((out) => ({ out })),
  },
];

function idFromOut(out: string, taken: Set<string>): string {
  const parts = out.replace(/\.png$/, '').split('/');
  let id = parts[parts.length - 1];
  for (let i = parts.length - 2; taken.has(id) && i >= 0; i--) {
    id = `${parts[i]}-${id}`;
  }
  if (taken.has(id)) throw new Error(`Cannot derive unique id for ${out}`);
  taken.add(id);
  return id;
}

async function sizeOf(out: string): Promise<{ w: number; h: number }> {
  const abs = srcPathFor(out);
  if (fs.existsSync(abs)) {
    const meta = await sharp(abs).metadata();
    if (meta.width && meta.height) return { w: meta.width, h: meta.height };
  }
  return { w: 128, h: 128 }; // registry entry with no current art yet
}

async function main(): Promise<void> {
  if (!fs.existsSync(ART_SRC_DIR)) {
    throw new Error('art/src does not exist — run pnpm art:import first.');
  }
  const existing = new Map(loadManifests().map((l) => [l.manifest.category, l]));

  for (const seed of SEEDS) {
    const loaded = existing.get(seed.category) ?? {
      filePath: manifestPath(seed.category),
      manifest: {
        category: seed.category,
        endpoint: seed.endpoint,
        styleRef: seed.styleRef,
        noBackground: seed.noBackground,
        candidates: seed.candidates,
        entries: [] as AssetEntry[],
      } satisfies CategoryManifest,
    };
    const manifest = loaded.manifest;
    const byOut = new Map(manifest.entries.map((e) => [e.out, e]));
    const taken = new Set(manifest.entries.map((e) => e.id));
    const wanted = seed.collect();
    let added = 0;

    for (const w of wanted) {
      const entry = byOut.get(w.out);
      if (entry) {
        // Refresh informational fields only; never touch prompt/status/notes.
        if (w.sources) entry.sources = w.sources;
        continue;
      }
      manifest.entries.push({
        id: idFromOut(w.out, taken),
        out: w.out,
        size: await sizeOf(w.out),
        prompt: '',
        status: 'draft',
        ...(w.sources ? { sources: w.sources } : {}),
        ...(w.notes ?? seed.note ? { notes: w.notes ?? seed.note } : {}),
      });
      added++;
    }

    const wantedOuts = new Set(wanted.map((w) => w.out));
    const orphans = manifest.entries.filter(
      (e) => !wantedOuts.has(e.out) && !fs.existsSync(srcPathFor(e.out)),
    );
    manifest.entries.sort((a, b) => a.out.localeCompare(b.out));
    saveManifest(loaded);
    const orphanNote = orphans.length
      ? ` — ${orphans.length} orphaned (no art file, not in registry): ${orphans
          .map((o) => o.id)
          .join(', ')}`
      : '';
    console.log(
      `${seed.category}: ${manifest.entries.length} entries (${added} added)${orphanNote}`,
    );
  }
  console.log('\nManifests are in art/manifests/. Fill in prompts and flip status to');
  console.log("'pending' to queue an asset for generation (pnpm art:generate --dry-run).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
