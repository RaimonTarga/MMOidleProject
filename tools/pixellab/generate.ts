// art:generate — produce review candidates for every manifest entry with
// status 'pending' or 'regen' and a non-empty prompt.
//
// Usage:
//   pnpm art:generate --dry-run              # cost estimate, no API calls
//   pnpm art:generate --category=monsters    # limit to one category
//   pnpm art:generate --id=boar              # limit to one entry
//   pnpm art:generate --budget=5             # hard-stop after ~$5 of real spend
//   pnpm art:generate --limit=10             # at most N entries this run
//   pnpm art:generate --force                # regenerate even if cached
//   pnpm art:generate --balance              # just print account balance
//
// Candidates land in art/candidates/<category>/<id>/ (gitignored) with a
// meta.json recording the request hash; unchanged requests are skipped so
// re-running never double-spends. Real cost per call is appended to
// art/pixellab.lock.json.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  animateWithText,
  createImageBitforge,
  createImagePixflux,
  generateUi,
  getBalance,
  toBase64Image,
  usageUsd,
  type Base64Image,
  type Usage,
} from './lib/api';
import { appendCall, totalSpendUsd } from './lib/lock';
import {
  loadManifests,
  resolveEntries,
  saveManifest,
  type EndpointId,
  type ResolvedEntry,
} from './lib/manifest';
import { estimateCall } from './lib/pricing';
import { ART_DIR, CANDIDATES_DIR, srcPathFor } from './lib/paths';

interface Args {
  dryRun: boolean;
  force: boolean;
  balance: boolean;
  category?: string;
  id?: string;
  budget?: number;
  limit?: number;
}

function parseArgs(): Args {
  const args: Args = { dryRun: false, force: false, balance: false };
  for (const raw of process.argv.slice(2)) {
    if (raw === '--dry-run') args.dryRun = true;
    else if (raw === '--force') args.force = true;
    else if (raw === '--balance') args.balance = true;
    else if (raw.startsWith('--category=')) args.category = raw.split('=')[1];
    else if (raw.startsWith('--id=')) args.id = raw.split('=')[1];
    else if (raw.startsWith('--budget=')) args.budget = Number(raw.split('=')[1]);
    else if (raw.startsWith('--limit=')) args.limit = Number(raw.split('=')[1]);
    else throw new Error(`Unknown flag: ${raw}`);
  }
  return args;
}

const ENDPOINT_MAX: Record<EndpointId, { w: number; h: number } | null> = {
  bitforge: { w: 200, h: 200 },
  pixflux: { w: 400, h: 400 },
  'generate-ui': { w: 792, h: 688 },
  'animate-with-text': null, // size follows first_frame
};

/** Even-numbered proportional clamp of the ship size into the endpoint's max. */
function genSizeFor(r: ResolvedEntry): { width: number; height: number } {
  const max = ENDPOINT_MAX[r.endpoint];
  const { w, h } = r.entry.size;
  if (!max) return { width: w, height: h };
  const scale = Math.min(1, max.w / w, max.h / h);
  const even = (n: number) => Math.max(16, 2 * Math.round((n * scale) / 2));
  return { width: even(w), height: even(h) };
}

/** Manifest params passed through to the API body (camelCase → snake_case). */
const PARAM_MAP: Record<string, string> = {
  outline: 'outline',
  shading: 'shading',
  detail: 'detail',
  view: 'view',
  direction: 'direction',
  textGuidanceScale: 'text_guidance_scale',
  styleStrength: 'style_strength',
  colorPalette: 'color_palette',
  frameCount: 'frame_count',
  seed: 'seed',
};

function passthroughParams(params: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    const mapped = PARAM_MAP[key];
    if (mapped) out[mapped] = value;
  }
  return out;
}

function styleImageFor(r: ResolvedEntry): Base64Image | null {
  if (!r.styleRef) return null;
  const abs = path.join(ART_DIR, ...r.styleRef.split('/'));
  if (!fs.existsSync(abs)) {
    throw new Error(
      `style anchor missing: art/${r.styleRef} — create style anchors before batch generation`,
    );
  }
  return toBase64Image(fs.readFileSync(abs));
}

function styleSha(r: ResolvedEntry): string | null {
  if (!r.styleRef) return null;
  const abs = path.join(ART_DIR, ...r.styleRef.split('/'));
  if (!fs.existsSync(abs)) return 'MISSING';
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
}

/** Stable hash of everything that affects the output (minus random seeds). */
function requestHashFor(r: ResolvedEntry): string {
  const descriptor = {
    endpoint: r.endpoint,
    prompt: r.entry.prompt,
    negative: r.entry.negative ?? '',
    genSize: genSizeFor(r),
    noBackground: r.noBackground,
    styleSha: styleSha(r),
    params: passthroughParams(r.entry.params),
    candidates: r.candidates,
  };
  return crypto.createHash('sha256').update(JSON.stringify(descriptor)).digest('hex').slice(0, 24);
}

function candidateDirFor(r: ResolvedEntry): string {
  return path.join(CANDIDATES_DIR, r.category, r.entry.id);
}

interface CandidateMeta {
  assetId: string;
  category: string;
  requestHash: string;
  endpoint: EndpointId;
  at: string;
  prompt: string;
  files: Array<{ file: string; seed: number }>;
}

function readMeta(dir: string): CandidateMeta | null {
  const metaPath = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf8')) as CandidateMeta;
}

function writeMeta(dir: string, meta: CandidateMeta): void {
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
}

/** One API call → one or more image buffers (animate strips are pre-assembled). */
async function callEndpoint(r: ResolvedEntry, seed: number): Promise<{ images: Buffer[]; usage: Usage | null }> {
  const params = passthroughParams(r.entry.params);
  const genSize = genSizeFor(r);
  const common = {
    description: r.entry.prompt,
    negative_description: r.entry.negative ?? '',
    image_size: genSize,
    no_background: r.noBackground,
    seed,
    ...params,
  };
  switch (r.endpoint) {
    case 'bitforge': {
      const style = styleImageFor(r);
      const res = await createImageBitforge({
        ...common,
        ...(style
          ? { style_image: style, style_strength: (params.style_strength as number) ?? 65 }
          : {}),
      });
      return { images: [Buffer.from(res.image.base64, 'base64')], usage: res.usage ?? null };
    }
    case 'pixflux': {
      const res = await createImagePixflux(common);
      return { images: [Buffer.from(res.image.base64, 'base64')], usage: res.usage ?? null };
    }
    case 'generate-ui': {
      const res = await generateUi({
        description: r.entry.prompt,
        image_size: genSize,
        no_background: r.noBackground,
        seed,
        ...(params.color_palette ? { color_palette: params.color_palette as string } : {}),
      });
      return { images: res.images, usage: res.usage };
    }
    case 'animate-with-text': {
      const firstFrameOut = r.entry.params?.firstFrame as string | undefined;
      const action = (r.entry.params?.action as string | undefined) ?? r.entry.prompt;
      if (!firstFrameOut) {
        throw new Error(`entry '${r.entry.id}': animate-with-text needs params.firstFrame`);
      }
      const framePath = srcPathFor(firstFrameOut);
      if (!fs.existsSync(framePath)) {
        throw new Error(`entry '${r.entry.id}': firstFrame not found at art/src/${firstFrameOut}`);
      }
      const res = await animateWithText({
        first_frame: toBase64Image(fs.readFileSync(framePath)),
        action,
        frame_count: (params.frame_count as number) ?? 8,
        no_background: r.noBackground,
        seed,
      });
      // Assemble the returned frames into one horizontal strip (the shipped format).
      const strip = await assembleStrip(res.images);
      return { images: [strip], usage: res.usage };
    }
  }
}

async function assembleStrip(frames: Buffer[]): Promise<Buffer> {
  if (frames.length === 1) return frames[0];
  const metas = await Promise.all(frames.map((f) => sharp(f).metadata()));
  const fw = metas[0].width ?? 0;
  const fh = metas[0].height ?? 0;
  return sharp({
    create: { width: fw * frames.length, height: fh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(frames.map((input, i) => ({ input, left: i * fw, top: 0 })))
    .png()
    .toBuffer();
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.balance) {
    const b = await getBalance();
    console.log(`credits: $${b.credits.usd.toFixed(2)}`);
    console.log(
      `subscription: ${b.subscription.status}${b.subscription.plan ? ` (${b.subscription.plan})` : ''}, ` +
        `generations ${b.subscription.generations}/${b.subscription.total}`,
    );
    return;
  }

  const manifests = loadManifests();
  let queue = resolveEntries(manifests).filter(
    (r) => (r.entry.status === 'pending' || r.entry.status === 'regen') && r.entry.prompt.trim(),
  );
  if (args.category) queue = queue.filter((r) => r.category === args.category);
  if (args.id) queue = queue.filter((r) => r.entry.id === args.id);

  // Skip entries whose candidates are already generated for this exact request.
  const skipped: string[] = [];
  if (!args.force) {
    queue = queue.filter((r) => {
      const dir = candidateDirFor(r);
      const meta = readMeta(dir);
      const fresh =
        meta &&
        meta.requestHash === requestHashFor(r) &&
        meta.files.length > 0 &&
        meta.files.every((f) => fs.existsSync(path.join(dir, f.file)));
      if (fresh) skipped.push(`${r.category}/${r.entry.id}`);
      return !fresh;
    });
  }
  if (args.limit && queue.length > args.limit) queue = queue.slice(0, args.limit);

  if (skipped.length) {
    console.log(`cached (awaiting review, skipped): ${skipped.join(', ')}`);
  }
  if (queue.length === 0) {
    console.log('Nothing to generate. Entries need status pending/regen and a prompt.');
    return;
  }

  let estimate = 0;
  for (const r of queue) estimate += estimateCall(r.endpoint) * r.candidates;
  console.log(
    `${queue.length} entries → ~${queue.reduce((n, r) => n + r.candidates, 0)} API calls, ` +
      `estimated ~$${estimate.toFixed(2)} (rough — real cost is recorded per call)`,
  );

  if (args.dryRun) {
    for (const r of queue) {
      const g = genSizeFor(r);
      console.log(
        `  ${r.category}/${r.entry.id} [${r.endpoint} ${g.width}x${g.height} x${r.candidates}]` +
          ` "${r.entry.prompt.slice(0, 70)}"`,
      );
    }
    console.log('\nDry run only — no API calls were made.');
    return;
  }

  const balanceBefore = await getBalance();
  console.log(`balance before: $${balanceBefore.credits.usd.toFixed(2)}\n`);

  let spentThisRun = 0;
  const failures: string[] = [];
  let generated = 0;

  for (const r of queue) {
    if (args.budget !== undefined && spentThisRun >= args.budget) {
      console.log(`budget of $${args.budget.toFixed(2)} reached — stopping.`);
      break;
    }
    const dir = candidateDirFor(r);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const requestHash = requestHashFor(r);
    const meta: CandidateMeta = {
      assetId: r.entry.id,
      category: r.category,
      requestHash,
      endpoint: r.endpoint,
      at: new Date().toISOString(),
      prompt: r.entry.prompt,
      files: [],
    };
    process.stdout.write(`${r.category}/${r.entry.id} [${r.endpoint}] `);
    try {
      for (let n = 1; n <= r.candidates; n++) {
        const seed = crypto.randomInt(1, 2 ** 31);
        const { images, usage } = await callEndpoint(r, seed);
        const usd = usageUsd(usage);
        spentThisRun += usd ?? estimateCall(r.endpoint);
        const files: string[] = [];
        images.forEach((buf, k) => {
          const file = images.length > 1 ? `candidate-${n}-${k + 1}.png` : `candidate-${n}.png`;
          fs.writeFileSync(path.join(dir, file), buf);
          meta.files.push({ file, seed });
          files.push(file);
        });
        writeMeta(dir, meta);
        appendCall({
          at: new Date().toISOString(),
          endpoint: r.endpoint,
          category: r.category,
          assetId: r.entry.id,
          requestHash,
          usd,
          candidateFiles: files,
        });
        process.stdout.write(usd !== null ? `$${usd.toFixed(3)} ` : '· ');
      }
      // A regenerated 'regen' entry is awaiting review again.
      if (r.entry.status === 'regen') {
        r.entry.status = 'pending';
        saveManifest(r.loaded);
      }
      generated++;
      process.stdout.write('ok\n');
    } catch (err) {
      process.stdout.write('FAILED\n');
      console.error(`  ${err instanceof Error ? err.message : err}`);
      failures.push(`${r.category}/${r.entry.id}`);
    }
  }

  const balanceAfter = await getBalance().catch(() => null);
  console.log(
    `\n${generated} entries generated, ${failures.length} failed. ` +
      `Run spend ~$${spentThisRun.toFixed(2)}; lifetime lockfile spend $${totalSpendUsd().toFixed(2)}.`,
  );
  if (balanceAfter) console.log(`balance after: $${balanceAfter.credits.usd.toFixed(2)}`);
  if (failures.length) {
    console.log(`failed: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('\nNext: pnpm art:review to pick winners.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
