import { useCallback, useEffect, useRef, useState } from 'react';
import { LANDING_POSTER_SRC, landingPlayOrder } from './landingClips';

/**
 * The prerecorded world flyover behind the landing screen.
 *
 * This is a plain encoded video and a poster still — the landing page renders
 * NONE of the game to produce it. The whole point is that a first-time visitor
 * sees the world without waiting on the sprite atlas, eleven biome grounds, the
 * tree sheets and a socket handshake. Regenerate the assets with
 * `pnpm landing:capture --clip=<id>`; the roster is `landingClips.ts`.
 *
 * Layers, each replacing the last only once the next is genuinely ready:
 *
 *   static poster (index.html, pre-JS)
 *     -> this component's poster (same cached image, so no flash)
 *        -> the primary clip, once it is BUFFERED, not merely playable
 *           -> a variant, crossfaded in at the end of a loop
 *
 * ROTATION IS STRICTLY SEQUENTIAL, and that is the whole design. The primary
 * clip is alone on the critical path; a variant is only requested once the
 * primary is on screen and has played through, and only one variant is ever in
 * flight. A visitor who logs straight in downloads one clip. This ordering was
 * measured, not assumed: when the landing page fetched the video alongside the
 * game's own asset set they competed for the same connection pool and the clip
 * took 71-83 s to buffer instead of 200 ms.
 *
 * Layering: this mounts as a SIBLING BEFORE `.auth-gate` inside `#auth-gate`,
 * never inside `#game-wrapper` — the spectator CSS rule hides every div child of
 * the wrapper. The gate's own gradient then paints over this as a later sibling,
 * which is exactly the vignette that keeps the login panel readable.
 */

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Skip the video download entirely on a metered or slow connection, or when the
 * viewer has asked for less motion. The poster is already a complete experience
 * and 4 MB of decoration is not worth spending someone's data plan on.
 */
function shouldSkipVideo(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) return true;
  const effective = connection?.effectiveType;
  return effective === 'slow-2g' || effective === '2g';
}

/**
 * Enough buffered to play the whole loop without stalling.
 *
 * `canplaythrough` is not enough on its own: it is the browser's *estimate* that
 * playback can finish, made from a few seconds of data and a guess about
 * bandwidth, and it fires early enough that a landing page routinely shows a
 * second of motion and then freezes. A clip is ~15 seconds and loops, so a stall
 * would be seen every time round. Require the whole thing, in one contiguous
 * range from the start.
 */
function bufferedThrough(video: HTMLVideoElement): boolean {
  // Deliberately measured in BYTES BUFFERED, not `readyState === HAVE_ENOUGH_DATA`.
  // That flag is Chromium's *estimate* that playback can finish, and on a slow
  // link it stays stuck at HAVE_FUTURE_DATA even once the entire file has
  // arrived — which would leave the poster up over a clip that is completely
  // ready. A contiguous range covering the whole duration is the actual
  // guarantee we want, and it is directly checkable.
  if (video.readyState < video.HAVE_CURRENT_DATA) return false;
  const { duration, buffered } = video;
  if (!Number.isFinite(duration) || duration <= 0) return false;
  for (let i = 0; i < buffered.length; i += 1) {
    if (buffered.start(i) <= 0.05 && buffered.end(i) >= duration - 0.25) return true;
  }
  return false;
}

/**
 * Run `onReady` once a clip is fully buffered. Returns a teardown.
 *
 * `progress` covers ordinary buffering; the others catch browsers that reach a
 * fully-buffered state without emitting a final progress event, and Safari can
 * settle without firing any of them — hence the poll as a backstop.
 */
function whenBuffered(video: HTMLVideoElement, onReady: () => void): () => void {
  const events = ['progress', 'canplaythrough', 'loadeddata', 'suspend'] as const;
  const cleanup = (): void => {
    for (const event of events) video.removeEventListener(event, check);
    window.clearInterval(poll);
  };
  function check(): void {
    if (!bufferedThrough(video)) return;
    cleanup();
    onReady();
  }
  for (const event of events) video.addEventListener(event, check);
  const poll = window.setInterval(check, 250);
  check();
  return cleanup;
}

/** Crossfade length between two clips, ms. Also how early the incoming starts. */
const CROSSFADE_MS = 900;
/**
 * How long after a hand-off the outgoing clip is released.
 *
 * Comfortably longer than the crossfade, and deliberately so: the timer starts
 * inside `play()`'s callback, BEFORE React has re-rendered with the class that
 * begins the fade, so the fade always ends a little after `CROSSFADE_MS` from
 * here. Releasing on the nose would clear `src` out from under an element still
 * fractionally visible, which shows as a flash of nothing.
 */
const RELEASE_MS = CROSSFADE_MS * 2;
/** Wait this long after a clip is on screen before fetching the next one. */
const VARIANT_DELAY_MS = 4_000;

export function LandingCinematic() {
  // Two elements, swapped between: one plays while the other buffers the next
  // clip off-screen, so a switch is a crossfade rather than a reload.
  const slotRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];
  const [order] = useState(landingPlayOrder);
  /** Which slot is on screen. */
  const [activeSlot, setActiveSlot] = useState(0);
  /** Source loaded into each slot, by slot index. */
  const [sources, setSources] = useState<(string | null)[]>([null, null]);
  /** Index into `order` currently on screen. */
  const [playingIndex, setPlayingIndex] = useState(0);
  /** The primary is buffered, playing, and has actually put a frame on screen. */
  const [videoShowing, setVideoShowing] = useState(false);

  // Keep the clip off the critical path — but with a TIMER, not
  // requestAnimationFrame. rAF only runs while the page is actually producing
  // frames, so a backgrounded or occluded tab (and headless Chromium under load)
  // can leave the callback pending forever, which turned into a landing page
  // that silently never loaded its video at all. By this point React has
  // mounted and the poster is painted, so a zero timeout is late enough.
  useEffect(() => {
    if (shouldSkipVideo() || order.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      setSources((current) => [order[0].src, current[1]]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [order]);

  // Setting `src` from React updates the attribute, but a media element only
  // re-runs its resource selection algorithm on an explicit load() — without
  // this a late src can sit at HAVE_NOTHING indefinitely.
  //
  // Only on an ACTUAL change, tracked per slot: this effect also runs when the
  // other slot's source changes, and a stray load() on the slot currently on
  // screen restarts the clip the viewer is watching.
  const loadedRef = useRef<(string | null)[]>([null, null]);
  useEffect(() => {
    for (const [slot, src] of sources.entries()) {
      if (loadedRef.current[slot] === src) continue;
      loadedRef.current[slot] = src;
      const video = slotRefs[slot].current;
      if (!video) continue;
      if (src) {
        video.load();
      } else {
        // Drop the decoded buffer of a clip that has left the screen.
        video.removeAttribute('src');
        video.load();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources]);

  /** Start playback, then reveal only after a real frame has been presented. */
  const revealWhenPainted = useCallback((video: HTMLVideoElement) => {
    void video.play().then(
      () => {
        type FrameCallbackVideo = HTMLVideoElement & {
          requestVideoFrameCallback?: (cb: () => void) => number;
        };
        const withFrameCallback = video as FrameCallbackVideo;
        if (typeof withFrameCallback.requestVideoFrameCallback === 'function') {
          // Fires when a frame has been composited — exactly the moment the
          // video is safe to uncover.
          withFrameCallback.requestVideoFrameCallback(() => setVideoShowing(true));
        } else {
          window.setTimeout(() => setVideoShowing(true), 120);
        }
      },
      () => {
        // Autoplay refused (iOS Low Power Mode refuses even muted playback).
        // Not an error state: the poster stays and the landing page is still
        // showing the world.
      },
    );
  }, []);

  // The primary: hold the poster until the clip is genuinely complete.
  useEffect(() => {
    const video = slotRefs[0].current;
    if (!sources[0] || !video || videoShowing) return undefined;
    return whenBuffered(video, () => revealWhenPainted(video));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources[0], revealWhenPainted, videoShowing]);

  // A variant: fetch into the idle slot, then hand over at the end of a loop.
  useEffect(() => {
    if (!videoShowing || order.length < 2) return undefined;
    const nextIndex = (playingIndex + 1) % order.length;
    const idleSlot = activeSlot === 0 ? 1 : 0;
    const idle = slotRefs[idleSlot].current;
    const current = slotRefs[activeSlot].current;
    if (!idle || !current) return undefined;

    let stopBuffering: (() => void) | null = null;
    let handOff: (() => void) | null = null;

    // Deliberately late and unhurried: nothing about a variant is urgent, and
    // starting it while the primary is still settling is the one thing that
    // would make the page worse than shipping a single clip.
    const timer = window.setTimeout(() => {
      setSources((currentSources) => {
        const next = [...currentSources];
        next[idleSlot] = order[nextIndex].src;
        return next;
      });
      stopBuffering = whenBuffered(idle, () => {
        // Hand over at the END of the current loop, so every clip is seen whole.
        // `loop` is left on so a hand-off that never comes (a variant that fails
        // to buffer) simply leaves the current clip cycling.
        const fadeSeconds = CROSSFADE_MS / 1000;
        handOff = (): void => {
          const remaining = current.duration - current.currentTime;
          if (!Number.isFinite(remaining) || remaining > fadeSeconds) return;
          current.removeEventListener('timeupdate', handOff!);
          handOff = null;
          idle.currentTime = 0;
          void idle.play().then(
            () => {
              setActiveSlot(idleSlot);
              setPlayingIndex(nextIndex);
              // Free the outgoing clip's buffer once it is WELL off screen, so a
              // long visit does not accumulate every clip in memory at once.
              window.setTimeout(() => {
                current.pause();
                setSources((currentSources) => {
                  const next = [...currentSources];
                  next[activeSlot] = null;
                  return next;
                });
              }, RELEASE_MS);
            },
            () => {
              // Refused: keep the current clip looping rather than going blank.
            },
          );
        };
        current.addEventListener('timeupdate', handOff);
      });
    }, VARIANT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      stopBuffering?.();
      if (handOff) current.removeEventListener('timeupdate', handOff);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoShowing, playingIndex, activeSlot, order]);

  return (
    <div className="landing-cinematic" aria-hidden="true">
      {[0, 1].map((slot) => (
        <video
          key={slot}
          ref={slotRefs[slot]}
          className={
            `landing-cinematic__video${slot === activeSlot ? ' landing-cinematic__video--live' : ''}`
          }
          src={sources[slot] ?? undefined}
          // A clip has to be fully buffered before it is uncovered, so let the
          // browser fetch it eagerly once we have decided to load it at all.
          preload="auto"
          muted
          loop
          playsInline
          disablePictureInPicture
          tabIndex={-1}
        />
      ))}
      <div
        className={`landing-cinematic__poster${videoShowing ? ' landing-cinematic__poster--faded' : ''}`}
        style={{ backgroundImage: `url(${LANDING_POSTER_SRC})` }}
      />
    </div>
  );
}
