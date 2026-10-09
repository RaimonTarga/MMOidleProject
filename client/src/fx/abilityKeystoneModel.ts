/**
 * ABILITY FLAVOR FX — the pure half (design §22.7, ability pass W2-D).
 *
 * "Animation deepens rather than adds": the packet row draws the lane's existing
 * fx (`ABILITY_NODE_FX`); the AMPLIFIER scales or extends what the packet drew
 * (the `axis` on the same `card-fx`); each KEYSTONE owns one bespoke animation,
 * keyed by its verb id, in the premium grammar (docs/combat-animation-current-
 * state.md: a readable wind-up, a visible payoff, a lasting mark where the rule
 * leaves one). A verb whose animation has not been authored yet is a keyed STUB:
 * it draws its lane fx at keystone scale, exactly as before this pass.
 *
 * No Phaser here, so the tables are testable from a plain tsx script
 * (`server/test/abilityFlavorFx.test.ts`).
 */
import { ABILITY_KEYSTONE_DEFINITIONS, type AmplifiedAxis } from '@mmo-idle/shared';

/**
 * The verbs with a bespoke animation (`abilityKeystoneFx.ts`). Every other verb is
 * a stub that draws its lane fx; {@link KEYSTONE_STUBS} lists the first verbs that
 * are, so the report can name them.
 */
export const KEYSTONE_ANIMATED: ReadonlySet<string> = new Set<string>([
  'whirlwind', 'aftershock', 'breakthrough', 'outbreak', 'dragnet',
  'chain-reaction',
  'vanish',
  'pierce',
  'relay',
]);

/** The first verbs (design §22.4, §22.8, §22.11) still drawn by the stub. */
export const KEYSTONE_STUBS: readonly string[] = [...ABILITY_KEYSTONE_DEFINITIONS.values()]
  .filter((verb) => verb.verb === 1 && !KEYSTONE_ANIMATED.has(verb.id))
  .map((verb) => verb.id);

/** Whether a verb's `card-fx` is drawn by its own animation rather than the stub. */
export function keystoneHasAnimation(keystoneId: string | undefined): boolean {
  return !!keystoneId && KEYSTONE_ANIMATED.has(keystoneId);
}

// ── The amplifier: the same fx, scaled or extended ──────────────────────────

export interface AxisFx {
  /** Size multiplier on the lane's draw. */
  scale: number;
  /** How many times the draw repeats after the first — a second echo, a trail. */
  echoes: number;
  /** Ms between the draw and each repeat. */
  echoDelayMs: number;
  /** Size of each repeat relative to the one before it. */
  echoFalloff: number;
}

const PLAIN: AxisFx = { scale: 1, echoes: 0, echoDelayMs: 0, echoFalloff: 1 };

/**
 * What an amplifier axis does to the lane's fx — the name's "of X", drawn:
 *  - of Weight (`magnitude`): the draw is bigger;
 *  - of Many (`targets`):     a second echo a beat later (the second body's own
 *                             payoff arrives as its own event besides);
 *  - of the Lingering (`duration`): a fading trail of two smaller repeats;
 *  - of Haste (`cast`):       a quick double-tap, the wind-up it shortened.
 */
export function axisFx(axis: AmplifiedAxis | undefined): AxisFx {
  switch (axis) {
    case 'magnitude': return { scale: 1.35, echoes: 0, echoDelayMs: 0, echoFalloff: 1 };
    case 'targets': return { scale: 1, echoes: 1, echoDelayMs: 120, echoFalloff: 0.85 };
    case 'duration': return { scale: 1, echoes: 2, echoDelayMs: 170, echoFalloff: 0.72 };
    case 'cast': return { scale: 1.1, echoes: 1, echoDelayMs: 70, echoFalloff: 0.9 };
    default: return PLAIN;
  }
}

// ── Timings (presentation choices; every DURATION is the server's) ───────────

/** Aftershock's cracked ground stays this long after the eruption, then fades. */
export const AFTERSHOCK_MARK_MS = 3_200;
/** Whirlwind's coil before the spin (the spin itself is the server's `durationMs`). */
export const WHIRLWIND_COIL_MS = 110;
/** Outbreak's corpse swelling before it bursts. */
export const OUTBREAK_SWELL_MS = 170;
/** Outbreak's miasma left where the body died. */
export const OUTBREAK_MARK_MS = 2_400;
/** Dragnet's net in flight to each body (the shackle locks on landing). */
export const DRAGNET_FLIGHT_MS = 170;
/** Dragnet events for one cast arrive together: within this window they share one net. */
export const DRAGNET_BATCH_MS = 80;
