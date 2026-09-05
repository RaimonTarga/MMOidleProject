// landing:capture — record one landing cinematic from the real game client.
//
//   pnpm landing:capture --clip=world-drift
//   pnpm landing:capture --clip=world-drift --crf=21 --keep-raw
//   pnpm landing:capture --scout=node-t1-forest-02 --at=2400,2000
//
// The client renders the take (dev-only `?cinematic=<id>` mode); this drives it
// headlessly and collects the frames, then hands them to ffmpeg for the loop
// crossfade, the H.264 encode and the WebP poster.
//
// Frames come from CDP's `Page.screencast`, NOT from Playwright's `recordVideo`.
// That recorder writes VP8 at about 1.29 Mbps, which is plenty for a static
// frame and nowhere near enough for a full-frame pan — so the master itself went
// soft whenever the camera moved, and no encoder setting downstream could
// recover it. Measured: re-encoding the same VP8 take at CRF 10 and 14 Mbps was
// indistinguishable from CRF 26 at 2.6 Mbps (moving-frame sharpness 29.71 vs
// 29.28), which is what "the master is the ceiling" looks like in numbers.
// Screencast hands over one image per composited paint instead, so the only
// lossy step left is the final H.264.
//
// Frame determinism is not available — world state arrives over a socket at
// 5 Hz in real time, so the render clock cannot be stepped independently. The
// take is therefore bounded by wall clock, using each frame's own screencast
// timestamp; it is forgiving here because the camera parks on waypoint 0 until
// the run starts and the path's easeInOutSine starts at zero velocity.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { anchorSessionToken } from './session';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORK_DIR = path.join(REPO_ROOT, '.landing');
const OUT_DIR = path.join(REPO_ROOT, 'client', 'public', 'landing');

interface Args {
  clip: string | null;
  scout: string | null;
  at: string | null;
  client: string;
  server: string;
  /** Capture viewport, in CSS px. Also the world area the frame covers. */
  width: number;
  height: number;
  /** Encoded frame size. Below the viewport, this widens the shot. */
  outWidth: number;
  outHeight: number;
  fps: number;
  crf: number;
  xfade: number;
  outDir: string;
  keepRaw: boolean;
  headed: boolean;
  readyTimeoutMs: number;
  /** Re-encode the stored take instead of driving the browser again. */
  reencode: boolean;
  /** x264 --tune; 'none' omits the flag. */
  tune: string;
  /** hqdn3d strength; 0 disables. */
  denoise: number;
  /** Suffix on the output basename, for side-by-side encode comparisons. */
  label: string;
  /** libwebp quality for the poster still. */
  posterQuality: number;
  /** Drop recorder-repeated frames and re-time the survivors onto a clean grid. */
  dedup: boolean;
  /** Ask headless Chromium for hardware GL. Measured SLOWER than SwiftShader here. */
  gpu: boolean;
  /** Screencast image format: 'jpeg' (fast, near-transparent) or 'png' (lossless). */
  frameFormat: 'jpeg' | 'png';
  /** JPEG quality for screencast frames. Ignored for png. */
  frameQuality: number;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const get = (name: string): string | undefined =>
    raw.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const num = (name: string, fallback: number): number => {
    const value = get(name);
    return value === undefined ? fallback : Number(value);
  };

  return {
    clip: get('clip') ?? null,
    scout: get('scout') ?? null,
    at: get('at') ?? null,
    client: get('client') ?? 'http://localhost:3000',
    server: get('server') ?? 'http://localhost:4000',
    width: num('width', 1280),
    height: num('height', 720),
    // Framing lever. The camera never zooms — anything below zoom 1 softens
    // pixel art in-engine — so a WIDER shot is taken by recording a bigger
    // viewport and downscaling once, with lanczos, at encode time. A 1920x1080
    // viewport delivered at 1280x720 covers 2.25x the world area, which is what
    // it takes to get more than one or two monsters into a frame.
    outWidth: num('out-width', num('width', 1280)),
    outHeight: num('out-height', num('height', 720)),
    // 25, because that is what Playwright's recorder actually produces. Asking
    // for 30 does not add temporal information — it duplicates frames, costs
    // bytes, and makes the resampling decisions timing-dependent, which is why
    // an SSIM measured against a separately-built 30 fps reference came out
    // meaninglessly low. Matching the source keeps frames 1:1 and measurable.
    fps: num('fps', 25),
    // 26. Higher than a live-action clip would need — a slow pan over dense
    // pixel detail is expensive — but CRF 30 visibly smears the forest ground
    // stipple into mush, and 26 lands within 0.6% SSIM of CRF 25 for 0.66 MB
    // less. The measured curve is in docs/landing-cinematic-current-state.md.
    crf: num('crf', 26),
    // Seconds of tail crossfaded back onto the head to hide the loop seam.
    xfade: num('xfade', 1.2),
    outDir: path.resolve(REPO_ROOT, get('out') ?? OUT_DIR),
    keepRaw: raw.includes('--keep-raw'),
    headed: raw.includes('--headed'),
    readyTimeoutMs: num('ready-timeout', 300_000),
    reencode: raw.includes('--reencode'),
    tune: get('tune') ?? 'none',
    denoise: num('denoise', 0),
    label: get('label') ?? '',
    posterQuality: num('poster-quality', 72),
    dedup: !raw.includes('--no-dedup'),
    gpu: raw.includes('--gpu'),
    // JPEG at 95, not PNG, by default. The gain over VP8 is enormous either way
    // — a frame here costs ~200 KB against the recorder's ~6 KB — while PNG
    // costs Chromium noticeably more per frame to encode, and the render is
    // already the bottleneck: any paint the screencast cannot keep up with is a
    // LOST CAMERA STEP, which is the stutter coming back. Cheap and near-
    // transparent beats lossless and slow.
    frameFormat: get('frame-format') === 'png' ? 'png' : 'jpeg',
    frameQuality: num('frame-quality', 95),
  };
}

/**
 * What the browser leg produced, persisted beside the raw recording.
 *
 * Encode settings are the part of this pipeline that genuinely wants iterating,
 * and re-running the browser to try a different CRF is pure waste — `--reencode`
 * replays this instead, turning an encode experiment into a few seconds.
 */
interface Take {
  /** Directory of numbered screencast frames, one per composited paint. */
  framesDir: string;
  /** Frame file extension, without the dot. */
  ext: string;
  /** Frames to encode, counted from the first. Trailing frames past the path's
   *  end are captured before the screencast can be stopped, and are excluded. */
  frameCount: number;
  /** Wall-clock length of the take, for reporting the achieved render rate. */
  takeSeconds: number;
  capturedAt: string;
}

interface Beacon {
  phase: string;
  ready: boolean;
  done: boolean;
  progress: number;
  note: string;
  anchor: { x: number; y: number } | null;
  monsters: number;
  monsterPoints: { x: number; y: number }[];
  frames: number;
}

async function readBeacon(page: Page): Promise<Beacon | null> {
  return page.evaluate(() => (window as unknown as { __cinematic?: Beacon }).__cinematic ?? null);
}

function run(cmd: string, args: string[]): void {
  const result = spawnSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  if (result.error) throw new Error(`${cmd} could not be run: ${result.error.message}`);
  if (result.status !== 0) {
    const tail = (result.stderr ?? '').trim().split('\n').slice(-16).join('\n');
    throw new Error(`${cmd} exited ${result.status}\n${tail}`);
  }
}

function probeDurationSeconds(file: string): number {
  const result = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { encoding: 'utf8' },
  );
  const value = Number((result.stdout ?? '').trim());
  return Number.isFinite(value) ? value : 0;
}

/**
 * Find repeated frames, so they can be dropped.
 *
 * Since frames come from `Page.screencast` — one image per composited paint,
 * acknowledged one at a time — there is normally nothing here to find, and a run
 * that reports zero repeats is the healthy case rather than a broken check. It
 * stays because a repeat is still possible (a paint with nothing changed in it)
 * and because it is the guard that catches a regression back to a fixed-rate
 * recorder, where the count would jump into the dozens.
 *
 * Because the cinematic camera advances one fixed step per RENDERED frame, a
 * repeated frame is pure padding: dropping it and re-timing the survivors onto
 * an even grid makes the camera's per-frame displacement uniform.
 *
 * Detection is by mean absolute frame difference on a 320x180 grey downscale.
 * The separation is not subtle — a moving frame scores 4-15, a repeat scores
 * under 1 — but magnitude alone is NOT enough, because the path's authored holds
 * park the camera on purpose and score just as low. The discriminator is RUN
 * LENGTH: a repeat is one or two isolated frames, a hold is twenty-odd
 * consecutive ones. Dropping by magnitude alone would silently delete the holds.
 *
 * `mpdecimate` cannot do this job on a lossy master: a repeated frame comes back
 * as slightly different pixels every time, and thresholds loose enough to catch
 * that are loose enough to eat the holds.
 */
const DEDUP_SAMPLE_WIDTH = 320;
const DEDUP_SAMPLE_HEIGHT = 180;
/** A frame differing less than this share of the median is a candidate repeat. */
const DEDUP_STILL_FRACTION = 0.2;
/** Consecutive still frames beyond this are an authored hold, and are kept. */
const DEDUP_MAX_RUN = 2;

function frameDifferences(input: readonly string[]): number[] {
  const result = spawnSync('ffmpeg', [
    '-v', 'error',
    ...input,
    '-vf', `scale=${DEDUP_SAMPLE_WIDTH}:${DEDUP_SAMPLE_HEIGHT}:flags=area,format=gray`,
    '-f', 'rawvideo', '-',
  ], { maxBuffer: 1 << 30 });
  if (result.status !== 0) throw new Error('ffmpeg could not sample the take for dedup');
  const buf = result.stdout;
  const size = DEDUP_SAMPLE_WIDTH * DEDUP_SAMPLE_HEIGHT;
  const frames = Math.floor(buf.length / size);
  const diffs: number[] = [0];
  for (let f = 1; f < frames; f += 1) {
    const prev = buf.subarray((f - 1) * size, f * size);
    const cur = buf.subarray(f * size, (f + 1) * size);
    let sum = 0;
    for (let i = 0; i < size; i += 1) sum += Math.abs(cur[i] - prev[i]);
    diffs.push(sum / size);
  }
  return diffs;
}

/** Zero-based indices of frames that are a repeat of their predecessor. */
function repeatedFrames(diffs: number[]): number[] {
  const sorted = [...diffs].slice(1).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const median = sorted[sorted.length >> 1];
  const threshold = median * DEDUP_STILL_FRACTION;
  const drop: number[] = [];
  let run: number[] = [];
  const flush = (): void => {
    if (run.length > 0 && run.length <= DEDUP_MAX_RUN) drop.push(...run);
    run = [];
  };
  for (let f = 1; f < diffs.length; f += 1) {
    if (diffs[f] < threshold) run.push(f);
    else flush();
  }
  flush();
  return drop;
}

/**
 * A coarse map of where the node's monsters actually are.
 *
 * Printed while scouting, because the framing mistake this pipeline keeps making
 * is authoring a path against the scenery and filming empty ground. Each cell is
 * one camera frame's worth of node, so a digit IS the monster count a shot
 * parked there would hold.
 */
function printMonsterCensus(points: { x: number; y: number }[], args: Args): void {
  const NODE = 4800;
  const cols = Math.max(1, Math.round(NODE / args.width));
  const rows = Math.max(1, Math.round(NODE / args.height));
  const grid = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (const p of points) {
    const c = Math.min(cols - 1, Math.max(0, Math.floor((p.x / NODE) * cols)));
    const r = Math.min(rows - 1, Math.max(0, Math.floor((p.y / NODE) * rows)));
    grid[r][c] += 1;
  }
  console.log(`   monsters per ${args.width}x${args.height} frame (node ${NODE} square):`);
  for (const [r, row] of grid.entries()) {
    const y = Math.round(((r + 0.5) / rows) * NODE);
    const cells = row.map((n) => (n === 0 ? ' .' : String(n).padStart(2))).join(' ');
    console.log(`     y=${String(y).padStart(4)} |${cells}`);
  }
  const xs = Array.from({ length: cols }, (_, c) => String(Math.round(((c + 0.5) / cols) * NODE)).padStart(2));
  console.log(`            x= ${xs.join(' ')}`);
  const best = points.length > 0 ? densestFrame(points, args) : null;
  if (best) {
    console.log(`   densest ${args.width}x${args.height} frame: ${best.n} monsters centred at ${best.x},${best.y}`);
  }
}

/** The single best camera centre, by brute force over a coarse grid of centres. */
function densestFrame(points: { x: number; y: number }[], args: Args): { x: number; y: number; n: number } {
  const NODE = 4800;
  const step = 200;
  let best = { x: NODE / 2, y: NODE / 2, n: -1 };
  for (let y = args.height / 2; y <= NODE - args.height / 2; y += step) {
    for (let x = args.width / 2; x <= NODE - args.width / 2; x += step) {
      let n = 0;
      for (const p of points) {
        if (Math.abs(p.x - x) <= args.width / 2 && Math.abs(p.y - y) <= args.height / 2) n += 1;
      }
      if (n > best.n) best = { x, y, n };
    }
  }
  return best;
}

function humanBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (!args.clip && !args.scout) {
    throw new Error('need --clip=<clipId> or --scout=<nodeId>');
  }

  const name = args.clip ?? `scout-${args.scout}`;
  const rawDir = path.join(WORK_DIR, 'raw', name);
  const takePath = path.join(rawDir, 'take.json');
  fs.mkdirSync(args.outDir, { recursive: true });

  if (args.reencode) {
    if (!fs.existsSync(takePath)) {
      throw new Error(`no stored take for '${name}' — capture once with --keep-raw first.`);
    }
    const stored = JSON.parse(fs.readFileSync(takePath, 'utf8')) as Take;
    console.log(`
── re-encoding ${name} (captured ${stored.capturedAt})`);
    finish(stored, name, args);
    return;
  }

  fs.rmSync(rawDir, { recursive: true, force: true });
  fs.mkdirSync(rawDir, { recursive: true });

  const token = await anchorSessionToken(args.server, path.join(WORK_DIR, 'session.json'));

  // The client must render at exactly the rate this recording samples at, and
  // step its camera path by exactly one frame per frame. Both come from `fps`.
  const query = args.clip
    ? `cinematic=${encodeURIComponent(args.clip)}&cinematicFps=${args.fps}`
    : `cinematicNode=${encodeURIComponent(args.scout!)}`
      + (args.at ? `&cinematicAt=${encodeURIComponent(args.at)}` : '');
  const target = `${args.client}/?${query}`;

  // A PERSISTENT profile, not a throwaway context. Capture mode uses the full
  // (non-spectator) asset preload — every biome, every tree, every effect sheet
  // — and `create()` does not run until that queue drains. Served through a
  // Docker bind mount on Windows the multi-megabyte biome PNGs take minutes on a
  // cold cache, which would make every iteration of a clip unusably slow. Keeping
  // the HTTP cache under .landing/ turns the second run and every one after it
  // into a few seconds.
  const context = await chromium.launchPersistentContext(path.join(WORK_DIR, 'profile'), {
    headless: !args.headed,
    // The default headless compositor throttles frame production; a capture
    // wants every frame the renderer can manage.
    args: [
      '--disable-frame-rate-limit',
      '--autoplay-policy=no-user-gesture-required',
      // Headless Chromium falls back to SwiftShader — software WebGL — which
      // renders this scene at roughly 10-20 fps. That is BELOW the recorder's
      // 25 fps grid, so the recording fills up with repeated frames, and at a
      // painted rate under half the grid those repeats arrive in runs long
      // enough that the dedup pass cannot tell them from an authored hold.
      // A real GPU takes the scene well past 25 and the problem disappears.
      ...(args.gpu ? ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist'] : []),
    ],
    viewport: { width: args.width, height: args.height },
    deviceScaleFactor: 1,
  });

  // The anchor credential has to exist before any client module reads it.
  await context.addInitScript(
    (seed: { key: string; value: string }) => {
      window.localStorage.setItem(seed.key, seed.value);
    },
    { key: 'mmo_session_token', value: token },
  );

  const page = context.pages()[0] ?? (await context.newPage());
  const problems: string[] = [];
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') problems.push(`console: ${text}`);
    if (text.startsWith('[cinematic]')) console.log(`   ${text}`);
  });

  const contextStartedAt = Date.now();
  console.log(`\n── capturing ${name} at ${args.width}x${args.height}`);
  await page.goto(target, { waitUntil: 'domcontentloaded' });

  try {
    await page.waitForFunction(
      () => (window as unknown as { __cinematic?: Beacon }).__cinematic?.ready === true,
      undefined,
      { timeout: args.readyTimeoutMs },
    );
  } catch {
    const beacon = await readBeacon(page);
    for (const problem of problems.slice(0, 8)) console.log(`   ! ${problem}`);
    throw new Error(
      `the client never became ready (phase=${beacon?.phase ?? 'none'}: ${beacon?.note ?? 'no beacon'}).\n`
      + '  Is the dev server up with AUTH_DEV_BYPASS, and the client serving this branch?',
    );
  }
  const readyAt = Date.now();
  const atReady = await readBeacon(page);
  console.log(`   ready after ${((readyAt - contextStartedAt) / 1000).toFixed(1)}s`);
  console.log(
    `   ${atReady?.monsters ?? 0} monsters in node`
    + `; anchor at ${atReady?.anchor ? `${atReady.anchor.x},${atReady.anchor.y}` : 'unknown'}`,
  );
  if (args.scout) printMonsterCensus(atReady?.monsterPoints ?? [], args);

  if (args.scout) {
    // Extra positions are shot by re-parking the camera in the SAME session:
    // the node is already staged and every asset is already in memory, so each
    // additional frame costs a repaint rather than another three-minute boot.
    // Default to the densest frame rather than the node centre: an arbitrary
    // still of a 4800-square node is almost always empty ground.
    const densest = densestFrame(atReady?.monsterPoints ?? [], args);
    const points = (args.at ?? `${densest.x},${densest.y}`).split(';').filter(Boolean);
    const dir = path.join(WORK_DIR, 'scout');
    fs.mkdirSync(dir, { recursive: true });
    for (const point of points) {
      const [x, y, zoom = 1] = point.split(',').map(Number);
      await page.evaluate((at: { x: number; y: number; zoom: number }) => {
        const hook = (window as unknown as {
          __cinematicPark?: (x: number, y: number, zoom: number) => void;
        }).__cinematicPark;
        hook?.(at.x, at.y, at.zoom);
      }, { x, y, zoom });
      await page.waitForTimeout(700);
      const shot = path.join(dir, `${args.scout}@${x}-${y}${zoom === 1 ? '' : `z${zoom}`}.png`);
      await page.screenshot({ path: shot });
      console.log(`   → ${path.relative(REPO_ROOT, shot)}`);
    }
    await context.close();
    return;
  }

  // Collect one image per composited paint, starting now — the camera is parked
  // on waypoint 0 and starts moving on this same signal, so nothing is missed
  // and there is no pre-roll to trim past.
  const framesDir = path.join(rawDir, 'frames');
  fs.mkdirSync(framesDir, { recursive: true });
  const ext = args.frameFormat === 'png' ? 'png' : 'jpg';
  const cdp = await context.newCDPSession(page);
  const frameStamps: number[] = [];
  const frameData: string[] = [];
  // `Page.screencast` is a SAMPLER, not a capture-every-frame mechanism: it
  // grabs whatever surface is current when it is ready to send the next one, so
  // every millisecond this handler spends is a paint that can go missing — and a
  // missing paint is a missing CAMERA STEP, which lands in the clip as a double
  // or triple jump. That is what made the forest and swamp clips stutter.
  //
  // So the handler does the least possible work: keep the payload as the base64
  // string it arrived as, acknowledge, and get out. No decode, no disk. The
  // frames are written after the take instead — 400 frames is about 130 MB of
  // strings, which is nothing next to losing them.
  cdp.on('Page.screencastFrame', (frame: {
    data: string;
    sessionId: number;
    metadata: { timestamp?: number };
  }) => {
    frameStamps.push((frame.metadata.timestamp ?? 0) * 1000);
    frameData.push(frame.data);
    void cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', {
    format: args.frameFormat,
    ...(args.frameFormat === 'jpeg' ? { quality: args.frameQuality } : {}),
    maxWidth: args.width,
    maxHeight: args.height,
    everyNthFrame: 1,
  });

  await page.waitForFunction(
    () => (window as unknown as { __cinematic?: Beacon }).__cinematic?.done === true,
    undefined,
    { timeout: 300_000 },
  );
  const doneAt = Date.now();
  const atDone = await readBeacon(page);
  const takeSeconds = (doneAt - readyAt) / 1000;
  console.log(`   path finished in ${takeSeconds.toFixed(2)}s`);

  await cdp.send('Page.stopScreencast').catch(() => {});
  await context.close();
  for (const problem of problems.slice(0, 8)) console.log(`   ! ${problem}`);

  // Frames keep arriving until the screencast actually stops, and those show a
  // camera parked at the end of the path. Cut them by their OWN timestamps
  // rather than by counting: screencast timestamps are wall clock, so this is
  // exact rather than a guess about how many were in flight.
  const frameCount = frameStamps.filter((stamp) => stamp <= doneAt).length || frameStamps.length;
  for (let index = 0; index < frameCount; index += 1) {
    fs.writeFileSync(
      path.join(framesDir, `${String(index).padStart(6, '0')}.${ext}`),
      Buffer.from(frameData[index], 'base64'),
    );
  }
  // The camera counts its own steps, so a paint the screencast failed to collect
  // is directly detectable rather than something to notice later in the picture.
  // One step, one frame — any shortfall is a jump in the finished clip.
  const stepped = atDone?.frames ?? 0;
  const lost = stepped > 0 ? stepped - frameCount : 0;
  if (lost > 0) {
    console.log(
      `   ! LOST ${lost} of ${stepped} painted frames — the clip will jump where they`
      + ' went missing. Re-run; if it persists, lower --fps until it reaches zero:'
      + ' the collector cannot keep up with the paint rate.',
    );
  }
  const rendered = frameCount / takeSeconds;
  console.log(
    `   ${frameCount} frames captured (${rendered.toFixed(1)} fps rendered`
    + `, ${(frameStamps.length - frameCount)} trailing dropped)`,
  );
  // The CAMERA is always correct — it steps once per frame by construction — but
  // the world was filmed in real time and is being laid on the output grid, so a
  // page painting under the capture rate plays its monsters back fast. Report it
  // whenever it is more than a few percent, because it is invisible otherwise.
  if (rendered < args.fps * 0.95) {
    console.log(
      `   ! painted ${rendered.toFixed(1)} fps against --fps=${args.fps}: the camera is`
      + ` exact, but the WORLD plays back ${(args.fps / rendered).toFixed(2)}x fast.`
      + ` Use --fps=${Math.round(rendered)} for real-time monsters at a lower frame rate.`,
    );
  }

  const take: Take = {
    framesDir,
    ext,
    frameCount,
    takeSeconds,
    capturedAt: new Date().toISOString(),
  };
  fs.writeFileSync(takePath, `${JSON.stringify(take, null, 2)}\n`, 'utf8');

  finish(take, name, args);
  if (!args.keepRaw) fs.rmSync(rawDir, { recursive: true, force: true });
}

function finish(take: Take, name: string, args: Args): void {
  const base = `${name}${args.label ? `-${args.label}` : ''}`;
  const mp4 = path.join(args.outDir, `${base}.mp4`);
  const poster = path.join(args.outDir, `${base}.webp`);
  encode({ take, mp4, args });
  encodePoster(mp4, poster, args.posterQuality);

  const finalSeconds = probeDurationSeconds(mp4);
  const bytes = fs.statSync(mp4).size;
  console.log('\n── done');
  console.log(
    `   ${path.relative(REPO_ROOT, mp4)}    ${humanBytes(bytes)}  ${finalSeconds.toFixed(2)}s`
    + ` @ ${args.outWidth}x${args.outHeight} ${args.fps}fps`
    + `  (${((bytes * 8) / finalSeconds / 1e6).toFixed(2)} Mbps, crf ${args.crf}`
    + `${args.tune === 'none' ? '' : `, tune ${args.tune}`}${args.denoise ? `, denoise ${args.denoise}` : ''})`,
  );
  console.log(`   ${path.relative(REPO_ROOT, poster)}   ${humanBytes(fs.statSync(poster).size)}`);
}

interface EncodeInput {
  take: Take;
  mp4: string;
  args: Args;
}

/**
 * ffmpeg input args for a take's frame sequence, laid on an even grid.
 *
 * The sequence on disk IS the take — trailing frames are deleted at capture
 * time rather than limited here, because `-frames:v` is an OUTPUT option: it
 * would truncate the encode while the filter graph had already read every extra
 * frame, and the loop seam is computed from the input's length.
 */
function takeInput(take: Take, fps: number): string[] {
  return ['-framerate', String(fps), '-i', path.join(take.framesDir, `%06d.${take.ext}`)];
}

/**
 * Trim the take out of the raw recording, resample to a constant frame rate,
 * and fold the head back over the tail so the loop has no visible seam.
 *
 * The seamless-loop construction, for a take of T seconds and an F-second fade:
 *
 *   body = take[F .. T]      (length T-F)  — starts at original time F
 *   pre  = take[0 .. F]      (length F)
 *   out  = xfade(body, pre, offset = T-2F, duration = F)   (length T-F)
 *
 * The output runs from original time F to T while dissolving into original
 * 0..F, so its last frame matches its first. Note this costs F seconds: a
 * 12 s take with a 1.2 s fade ships as 10.8 s.
 */
function encode({ take, mp4, args }: EncodeInput): void {
  const input = takeInput(take, args.fps);
  // With repeats dropped the take is SHORTER than the wall clock it was recorded
  // over, and the loop-seam arithmetic below is all in output time — so the
  // length has to be re-derived from the frames that actually survive.
  let effectiveSeconds = take.frameCount / args.fps;
  let drop: number[] = [];
  if (args.dedup) {
    drop = repeatedFrames(frameDifferences(input));
    const kept = take.frameCount - drop.length;
    effectiveSeconds = kept / args.fps;
    if (drop.length > 0) {
      console.log(
        `   dedup: ${kept} frames kept, ${drop.length} repeats dropped`
        + ` → ${effectiveSeconds.toFixed(2)}s of even motion`,
      );
    }
  }
  const fade = Math.min(args.xfade, effectiveSeconds / 3);
  const offset = effectiveSeconds - 2 * fade;
  // hqdn3d before the split: the forest ground is a dense dithered tile, which
  // is the single most expensive thing in the frame to encode and the least
  // worth the bits. A light spatial denoise removes that shimmer without
  // eating tree silhouettes.
  const clean = args.denoise > 0
    ? `,hqdn3d=${args.denoise}:${args.denoise}:${(args.denoise * 1.5).toFixed(1)}:${(args.denoise * 1.5).toFixed(1)}`
    : '';
  // Drop the repeats BEFORE anything else, then lay the survivors on an even
  // grid: one rendered frame, one output frame, one camera step.
  const even = drop.length > 0
    ? `select='not(${drop.map((n) => `eq(n\,${n})`).join('+')})',setpts=N/${args.fps}/TB,`
    : '';
  const filter = [
    `[0:v]${even}scale=${args.outWidth}:${args.outHeight}:flags=lanczos,setsar=1${clean},split[body][pre]`,
    `[body]trim=start=${fade.toFixed(3)},setpts=PTS-STARTPTS[jt]`,
    `[pre]trim=duration=${fade.toFixed(3)},setpts=PTS-STARTPTS[ph]`,
    `[jt][ph]xfade=transition=fade:duration=${fade.toFixed(3)}:offset=${offset.toFixed(3)}[v]`,
  ].join(';');

  run('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    ...input,
    '-filter_complex', filter,
    '-map', '[v]',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-crf', String(args.crf),
    '-preset', 'slow',
    ...(args.tune === 'none' ? [] : ['-tune', args.tune]),
    '-an',
    '-movflags', '+faststart',
    mp4,
  ]);
}

/**
 * The poster must be the video's EXACT first frame, or the poster→video handoff
 * visibly jumps on the landing page.
 */
function encodePoster(mp4: string, poster: string, quality: number): void {
  run('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', mp4,
    '-frames:v', '1',
    '-c:v', 'libwebp',
    '-quality', String(quality),
    poster,
  ]);
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
