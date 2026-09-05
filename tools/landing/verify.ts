// landing:verify — screenshot the real landing page through its layers.
//
//   pnpm landing:verify
//   pnpm landing:verify --reduced-motion --out=.landing/verify-rm
//   pnpm landing:verify --block-live --warm --rotation=240
//
// Opens the client with NO session credential, which is exactly what a first
// visitor gets: the spectator handshake plus the prerecorded cinematic. Shoots
// the poster-only first paint, the playing video, and (if the live spectator
// gets there) the state after the crossfade — so the handoff can be checked with
// pictures instead of assertions about atoms.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext } from 'playwright';
import { anchorSessionToken } from './session';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

interface Snapshot {
  hasVideo: boolean;
  src: string;
  paused: boolean;
  currentTime: number;
  /** 1 while the still covers the video; 0 once the clip has taken over. */
  posterOpacity: string;
  readyState: number;
  videoWidth: number;
  bufferedEnd: number;
  duration: number;
  /** The pre-JS still from index.html, removed once React owns the backdrop. */
  staticPoster: boolean;
}

/**
 * The backdrop is TWO stacked players and only one is live — the other is either
 * empty or buffering the next clip off screen. Every probe here has to follow
 * the `--live` class rather than take the first element, or a check run after a
 * rotation reports on a paused, sourceless element and calls it a stall.
 */
const LIVE_VIDEO = `document.querySelector('video.landing-cinematic__video--live[src]')
  || document.querySelector('video.landing-cinematic__video[src]')`;

const PROBE = `(() => {
  const v = ${LIVE_VIDEO};
  const p = document.querySelector('.landing-cinematic__poster');
  const staticPoster = document.getElementById('landing-poster');
  if (!v) {
    return { hasVideo: false, src: '', paused: true, currentTime: 0, posterOpacity: '',
             readyState: 0, videoWidth: 0, bufferedEnd: 0, duration: 0, staticPoster: !!staticPoster };
  }
  let bufferedEnd = 0;
  for (let i = 0; i < v.buffered.length; i++) bufferedEnd = Math.max(bufferedEnd, v.buffered.end(i));
  return {
    hasVideo: true,
    src: v.getAttribute('src') || '',
    paused: v.paused,
    currentTime: v.currentTime,
    posterOpacity: p ? getComputedStyle(p).opacity : 'no-poster',
    readyState: v.readyState,
    videoWidth: v.videoWidth,
    bufferedEnd,
    duration: Number.isFinite(v.duration) ? v.duration : 0,
    staticPoster: !!staticPoster,
  };
})()`;

async function main(): Promise<void> {
  const raw = process.argv.slice(2);
  const get = (name: string): string | undefined =>
    raw.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const client = get('client') ?? 'http://localhost:3000';
  const outDir = path.resolve(REPO_ROOT, get('out') ?? '.landing/verify');
  const watchSeconds = Number(get('watch') ?? 90);
  const reducedMotion = raw.includes('--reduced-motion');
  fs.mkdirSync(outDir, { recursive: true });

  // No session token either way, so the client always takes the anonymous
  // spectator path — the real first-visit experience. `--warm` additionally
  // keeps the HTTP cache between runs, which is what a RETURNING visitor has and
  // the only practical way to watch the handoff on a dev server whose assets are
  // served through a Docker bind mount at a few hundred KB/s.
  const options = {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: (reducedMotion ? 'reduce' : 'no-preference') as 'reduce' | 'no-preference',
  };
  const warm = raw.includes('--warm');
  const context = warm
    ? await chromium.launchPersistentContext(path.resolve(REPO_ROOT, '.landing/verify-profile'), options)
    : await (await chromium.launch()).newContext(options);
  const page = context.pages()[0] ?? (await context.newPage());
  page.on('pageerror', (err) => console.log(`   ! pageerror: ${err.message}`));

  // The landing page is supposed to be the video and nothing else. Counting the
  // game's own art here is the check that it stays that way: every /assets/
  // request is the renderer booting when it should not be.
  let gameAssetRequests = 0;
  let gameAssetBytes = 0;
  page.on('response', (response) => {
    if (!response.url().includes('/assets/')) return;
    gameAssetRequests += 1;
    gameAssetBytes += Number(response.headers()['content-length'] ?? 0);
  });

  // On a fast server the live spectator can be ready in a handful of seconds and
  // tear the cinematic down before its own load sequence can be observed at all.
  // Blocking the socket keeps the page permanently on the prerecorded layer,
  // which is the only way to measure poster -> buffered video -> playback as a
  // delivery question rather than a race.
  if (raw.includes('--block-live')) {
    await page.route('**/socket.io/**', (route) => route.abort());
    console.log('   (live spectator blocked — measuring the prerecorded layer only)');
  }

  // The live pane cannot be tested without somebody to watch — and since the
  // Clearing fallback was removed, an empty world means no pane at all, by
  // design. Capture mode already knows how to put a real character into a node
  // and hold it there, so `--with-player` reuses it as a stand-in adventurer.
  let companion: BrowserContext | null = null;
  if (raw.includes('--with-player')) {
    companion = await openCompanionPlayer(client, get('server') ?? 'http://localhost:4000');
  }

  // Watch the media clock across a rotation. A visible hitch is the clock
  // failing to advance while wall time does; `getVideoPlaybackQuality` says
  // whether the decoder dropped frames or the element was starved. Installed
  // before navigation so it is already running when the switch happens.
  await page.addInitScript(() => {
    interface Sample { t: number; ct: number; dropped: number }
    const jank = { src: '', samples: [] as Sample[], startedAt: 0, switches: 0 };
    (window as unknown as { __jank: typeof jank }).__jank = jank;
    let lastSrc: string | null = null;
    window.setInterval(() => {
      const live = document.querySelector(
        'video.landing-cinematic__video--live[src]',
      ) as HTMLVideoElement | null;
      if (!live) return;
      const src = live.getAttribute('src');
      if (src !== lastSrc) {
        if (lastSrc !== null) jank.switches += 1;
        lastSrc = src;
        jank.src = src ?? '';
        jank.startedAt = performance.now();
        jank.samples = [];
      }
      if (performance.now() - jank.startedAt > 6_000) return;
      const quality = live.getVideoPlaybackQuality?.();
      jank.samples.push({
        t: Math.round(performance.now() - jank.startedAt),
        ct: Number(live.currentTime.toFixed(3)),
        dropped: quality ? quality.droppedVideoFrames : -1,
      });
    }, 40);
  });

  const started = Date.now();
  await page.goto(client, { waitUntil: 'domcontentloaded' });

  // The pre-JS still should be up before any application JavaScript has run.
  await page.waitForSelector('#landing-poster, .landing-cinematic__poster', { timeout: 15_000 });
  await page.screenshot({ path: path.join(outDir, '1-first-paint.png') });
  // The browser's own first-contentful-paint, not when `goto` resolved:
  // DOMContentLoaded waits for the module bundle, which is not what the visitor
  // waits for to see the poster.
  const fcp = await page.evaluate(
    () => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1,
  );
  console.log(
    `\n── poster painted (first-contentful-paint ${fcp >= 0 ? `${Math.round(fcp)}ms` : 'unavailable'})`,
  );

  await page.waitForSelector('.landing-cinematic__poster', { timeout: 20_000 });
  const atPaint = (await page.evaluate(PROBE)) as Snapshot;
  console.log(`   React backdrop mounted · video src ${atPaint.src || '(not yet requested)'}`);

  // The poster must hold until the clip is buffered THROUGH, then dissolve.
  try {
    await page.waitForFunction(
      () => {
        const p = document.querySelector('.landing-cinematic__poster');
        return !!p && Number(getComputedStyle(p).opacity) < 0.02;
      },
      undefined,
      { timeout: 90_000 },
    );
    const playing = (await page.evaluate(PROBE)) as Snapshot;
    await page.screenshot({ path: path.join(outDir, '2-video-playing.png') });
    console.log(`\n── poster dissolved, clip visible (${Date.now() - started}ms)`);
    console.log(
      `   ${playing.videoWidth}px · t=${playing.currentTime.toFixed(2)}s`
      + ` · buffered ${playing.bufferedEnd.toFixed(1)}/${playing.duration.toFixed(1)}s`
      + ` · readyState ${playing.readyState}`,
    );

    // Smoothness: sample the media clock and look for it failing to advance.
    // The spectator handoff can tear the element out mid-sample. That is a
    // success, not a stall — stop sampling rather than throwing.
    const samples = await page.evaluate(async () => {
      const out: number[] = [];
      for (let i = 0; i < 16; i += 1) {
        const v = (document.querySelector('video.landing-cinematic__video--live[src]')
          || document.querySelector('video.landing-cinematic__video[src]')) as HTMLVideoElement | null;
        if (!v) break;
        out.push(v.currentTime);
        await new Promise((resolve) => { setTimeout(resolve, 250); });
      }
      return out;
    });
    let stalls = 0;
    for (let i = 1; i < samples.length; i += 1) {
      const advanced = samples[i] - samples[i - 1];
      // A loop wrap goes negative; a stall means the clock did not move at all.
      if (advanced >= 0 && advanced < 0.1) stalls += 1;
    }
    console.log(
      samples.length < 2
        ? '   playback: handed off to the spectator before it could be sampled'
        : `   playback over ${((samples.length - 1) * 0.25).toFixed(1)}s: `
          + `${stalls === 0 ? 'no stalls' : `${stalls} stalled sample(s) of ${samples.length - 1}`}`,
    );
  } catch {
    const state = (await page.evaluate(PROBE)) as Snapshot;
    console.log(
      reducedMotion
        ? '\n── video deliberately never requested (reduced motion) — poster only'
        : `\n   ! poster never dissolved (buffered ${state.bufferedEnd.toFixed(1)}/`
          + `${state.duration.toFixed(1)}s, readyState ${state.readyState})`,
    );
    await page.screenshot({ path: path.join(outDir, '2-no-playback.png') });
  }

  // The rotation: a variant is only fetched once the primary is on screen, so
  // this is necessarily slow — and through the dev bind mount a second clip
  // takes as long to arrive as the first did. Opt-in for that reason.
  const rotationArg = raw.find((a) => a === '--rotation' || a.startsWith('--rotation='));
  if (rotationArg) {
    const seconds = Number(rotationArg.split('=')[1] ?? 180);
    const before = ((await page.evaluate(PROBE)) as Snapshot).src;
    console.log(`
── watching for a rotation away from ${before} (up to ${seconds}s)`);
    try {
      await page.waitForFunction(
        (first: string) => {
          const live = document.querySelector('video.landing-cinematic__video--live[src]');
          return !!live && live.getAttribute('src') !== first;
        },
        before,
        { timeout: seconds * 1_000 },
      );
      const after = (await page.evaluate(PROBE)) as Snapshot;
      await page.screenshot({ path: path.join(outDir, '5-rotated.png') });
      console.log(
        `   rotated to ${after.src} · t=${after.currentTime.toFixed(2)}s`
        + ` · ${after.paused ? 'PAUSED' : 'playing'}`,
      );

      // Let the sampler cover the whole window the hitch was reported in.
      await page.waitForTimeout(6_500);
      const jank = await page.evaluate(
        () => (window as unknown as {
          __jank?: { src: string; samples: { t: number; ct: number; dropped: number }[] };
        }).__jank ?? null,
      );
      if (jank && jank.samples.length > 2) {
        const first = jank.samples[0];
        const stalls: string[] = [];
        for (let i = 1; i < jank.samples.length; i += 1) {
          const a = jank.samples[i - 1];
          const b = jank.samples[i];
          const wall = (b.t - a.t) / 1000;
          const media = b.ct - a.ct;
          // A wrap goes negative; a stall is the clock standing still while the
          // wall clock moves on by more than a frame and a half.
          if (media >= 0 && wall > 0.06 && media < wall * 0.35) {
            stalls.push(`${(b.t / 1000).toFixed(2)}s (clock advanced ${media.toFixed(3)}s over ${wall.toFixed(3)}s)`);
          }
        }
        const droppedTotal = jank.samples[jank.samples.length - 1].dropped - first.dropped;
        console.log(`   media clock over the first 6s of ${jank.src}:`);
        console.log(
          `     ${stalls.length === 0 ? 'no stalls' : `${stalls.length} stall(s): ${stalls.join(', ')}`}`,
        );
        console.log(`     decoder dropped frames: ${droppedTotal < 0 ? 'unavailable' : droppedTotal}`);
      }
    } catch {
      const state = (await page.evaluate(PROBE)) as Snapshot;
      console.log(`   ! no rotation within ${seconds}s (still ${state.src})`);
    }
  }

  // The live pane, if the spectator gets there within the watch window. It opens
  // OVER the backdrop rather than replacing it, so the video should still be
  // playing underneath afterwards.
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.spectatorReady === 'true',
      undefined,
      { timeout: watchSeconds * 1_000 },
    );
    console.log(`\n── live pane opening (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, '3-pane-opening.png') });
    await page.waitForTimeout(1_200);
    await page.screenshot({ path: path.join(outDir, '4-pane-open.png') });
    const after = (await page.evaluate(PROBE)) as Snapshot;
    const pane = await page.evaluate(() => {
      const wrapper = document.getElementById('game-wrapper');
      if (!wrapper) return null;
      const box = wrapper.getBoundingClientRect();
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        opacity: getComputedStyle(wrapper).opacity,
      };
    });
    console.log(
      `   pane ${pane ? `${pane.width}x${pane.height} @ opacity ${pane.opacity}` : 'MISSING'}`
      + ` · backdrop still playing: ${after.hasVideo && !after.paused ? 'yes' : 'NO'}`,
    );
  } catch {
    console.log(`\n── no live pane within ${watchSeconds}s — the backdrop is the whole page`);
    console.log('   (with nobody online this is the intended outcome, not a failure)');
    const why = await page.evaluate(
      () => (window as unknown as { __spectatorReady?: Record<string, unknown> }).__spectatorReady ?? null,
    );
    if (why) {
      const failing = Object.entries(why)
        .filter(([key, value]) => value === false && key !== 'announced')
        .map(([key]) => key);
      console.log(`   blocked on: ${failing.length ? failing.join(', ') : 'nothing — check STABLE_FRAMES'}`);
      console.log(`   ${JSON.stringify(why)}`);
    } else {
      console.log('   no readiness diagnostics — is the client a dev build?');
    }
    await page.screenshot({ path: path.join(outDir, '3-still-cinematic.png') });
  }

  console.log(
    `
── game art fetched by the landing page: `
    + `${gameAssetRequests === 0 ? 'none' : `${gameAssetRequests} files, ${(gameAssetBytes / 1024 / 1024).toFixed(1)} MB`}`,
  );

  await context.close();
  await companion?.close();
  console.log(`\n   shots in ${path.relative(REPO_ROOT, outDir)}`);
}

/**
 * A second browser running capture mode, purely to occupy a node so the
 * spectator has somebody to watch. Uses the warm capture profile, because a cold
 * boot of the full (non-spectator) asset set takes minutes through the dev bind
 * mount.
 */
async function openCompanionPlayer(client: string, server: string): Promise<BrowserContext> {
  const token = await anchorSessionToken(server, path.resolve(REPO_ROOT, '.landing/session.json'));
  const context = await chromium.launchPersistentContext(
    path.resolve(REPO_ROOT, '.landing/profile'),
    { headless: true, viewport: { width: 1280, height: 720 } },
  );
  await context.addInitScript(
    (seed: { key: string; value: string }) => { window.localStorage.setItem(seed.key, seed.value); },
    { key: 'mmo_session_token', value: token },
  );
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(`${client}/?cinematic=world-drift`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (window as unknown as { __cinematic?: { ready: boolean } }).__cinematic?.ready === true,
    undefined,
    { timeout: 300_000 },
  );
  console.log('   companion player is in the world');
  return context;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
