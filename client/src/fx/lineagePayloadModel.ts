/**
 * LINEAGE PAYLOAD FX — the pure half (course-correction W2-C, design §24.1-§24.2).
 *
 * A T1 verb fires its moment and delivers the active lean's PAYLOAD, and every
 * payload owns one readable effect (rule 4: perceptible with the sound off, a
 * change in what bodies do, never only a number, no tints as FX). The server
 * pushes one `card-fx` per application with the payload's key; this module says,
 * per key, what kind of effect it is and when it plays. The drawing lives in
 * `lineagePayloadFx.ts` and the lasting looks in `lineagePayloadStates.ts` +
 * `auraDefs.ts`. No Phaser here, so it is testable without a DOM
 * (`server/test/lineagePayloadFx.test.ts`).
 *
 * TIMINGS are presentation choices (the brief leaves them to this task); the
 * DURATIONS of lasting states are the server's, read off the event or, for an
 * event that predates the field, off the same shared data the server reads.
 */
import {
  LINEAGE_PAYLOAD_HIT_PREFIX,
  PACKET_DEFINITIONS,
  packetPayload,
  packetPurePair,
  resolveActiveLineages,
  type HoldsInventory,
  type LineageFxKey,
  type PacketId,
} from '@mmo-idle/shared';
import type { AttackFlair } from './attackFlair';

/** The ten payload keys (design §24.2's seven packets, pure and composed). */
export type PayloadFxKey =
  | 'tempo.ghost-strike'
  | 'engagement.lunge'
  | 'empowered.mechanic-flash'
  | 'empowered.crash'
  | 'affliction.heavy-drip'
  | 'affliction.double-dose'
  | 'control.shackle'
  | 'control.knockdown'
  | 'kill-chain.heal-load'
  | 'technique.refund-flash';

/** A lasting look a payload leaves on a body (an aura row each, `auraDefs.ts`). */
export type PayloadLasting = 'shackle' | 'knockdown' | 'drip' | 'loaded';

/** Camera weight on the OWN player's screen (Settings-gated, `impactFeel.ts`). */
export type PayloadWeight = 'none' | 'light' | 'medium';

export interface PayloadFxSpec {
  /** Where the one-shot is drawn first: on the struck body, or on the player. */
  anchor: 'target' | 'player';
  /** The lasting look that follows the one-shot, held for the payload's duration. */
  lasting?: Exclude<PayloadLasting, 'loaded'>;
  /**
   * Presentation delay of the payload's OWN hit (the `lineage-hit:<fx>` tag), ms
   * after the moment. The echo is a second swing a beat after the first; the
   * lunge's hit lands at the end of its dash. 0 = with the moment.
   */
  hitDelayMs: number;
  /** The payload moves the body itself, so its hit skips the ordinary hit lunge. */
  ownsBodyLunge: boolean;
  weight: PayloadWeight;
  /**
   * `hit`: played on the combat playback clock with the hit it rode, so it lands
   * on the swing the player is watching. `immediate`: at receipt — the Technique
   * refund is HUD first, and the cooldown sample it explains is applied at once.
   */
  timing: 'hit' | 'immediate';
}

/** "Lands twice": the echo's second swing starts this long after the first. */
export const ECHO_DELAY_MS = 190;
/** The Engagement dash's travel: the lunge's hit lands at contact. */
export const LUNGE_CONTACT_MS = 110;
/** Held at full reach after contact, then the body slides back. */
export const LUNGE_HOLD_MS = 70;
export const LUNGE_RETURN_MS = 260;

export const PAYLOAD_FX: Readonly<Record<PayloadFxKey, PayloadFxSpec>> = {
  'tempo.ghost-strike': {
    anchor: 'target', hitDelayMs: ECHO_DELAY_MS, ownsBodyLunge: false, weight: 'light', timing: 'hit',
  },
  'engagement.lunge': {
    anchor: 'target', hitDelayMs: LUNGE_CONTACT_MS, ownsBodyLunge: true, weight: 'medium', timing: 'hit',
  },
  'empowered.mechanic-flash': {
    anchor: 'player', hitDelayMs: 0, ownsBodyLunge: false, weight: 'light', timing: 'hit',
  },
  'empowered.crash': {
    anchor: 'target', hitDelayMs: 0, ownsBodyLunge: false, weight: 'medium', timing: 'hit',
  },
  'affliction.heavy-drip': {
    anchor: 'target', lasting: 'drip', hitDelayMs: 0, ownsBodyLunge: false, weight: 'none', timing: 'hit',
  },
  'affliction.double-dose': {
    anchor: 'target', lasting: 'drip', hitDelayMs: 0, ownsBodyLunge: false, weight: 'light', timing: 'hit',
  },
  'control.shackle': {
    anchor: 'target', lasting: 'shackle', hitDelayMs: 0, ownsBodyLunge: false, weight: 'light', timing: 'hit',
  },
  'control.knockdown': {
    anchor: 'target', lasting: 'knockdown', hitDelayMs: 0, ownsBodyLunge: false, weight: 'medium', timing: 'hit',
  },
  'kill-chain.heal-load': {
    anchor: 'player', hitDelayMs: 0, ownsBodyLunge: false, weight: 'light', timing: 'hit',
  },
  'technique.refund-flash': {
    anchor: 'player', hitDelayMs: 0, ownsBodyLunge: false, weight: 'none', timing: 'immediate',
  },
};

/** Whether a `card-fx` key is one of the payloads this module draws. */
export function isPayloadFx(fx: string): fx is PayloadFxKey {
  return Object.prototype.hasOwnProperty.call(PAYLOAD_FX, fx);
}

/**
 * Every payload key the shared halves can push: each weapon packet's lean payload
 * and its pure payload. The coverage test holds this set equal to `PAYLOAD_FX`.
 */
export function payloadFxKeysFromHalves(): LineageFxKey[] {
  const keys = new Set<LineageFxKey>();
  for (const def of PACKET_DEFINITIONS.values()) {
    if (!def.halves) continue;
    keys.add(def.halves.payloadFx);
    keys.add(def.halves.pure.fx);
  }
  return [...keys];
}

// ── The payload's own hit ────────────────────────────────────────────────────

/** The payload a hit's `effects` names (`lineage-hit:<fx>`), if it draws one. */
export function payloadOfHit(effects: readonly string[] | undefined): PayloadFxKey | undefined {
  for (const effect of effects ?? []) {
    if (!effect.startsWith(LINEAGE_PAYLOAD_HIT_PREFIX)) continue;
    const fx = effect.slice(LINEAGE_PAYLOAD_HIT_PREFIX.length);
    if (isPayloadFx(fx)) return fx;
  }
  return undefined;
}

/** How long after its moment a hit is presented (0 for any ordinary hit). */
export function hitPresentationDelayMs(effects: readonly string[] | undefined): number {
  const fx = payloadOfHit(effects);
  return fx ? PAYLOAD_FX[fx].hitDelayMs : 0;
}

/** Whether a hit's body lunge belongs to its payload (the dash), not the hit. */
export function hitOwnsBodyLunge(effects: readonly string[] | undefined): boolean {
  const fx = payloadOfHit(effects);
  return fx ? PAYLOAD_FX[fx].ownsBodyLunge : false;
}

// ── Durations: the server's ─────────────────────────────────────────────────

/** The packet whose numbers a lasting payload's default duration comes from. */
const LASTING_SOURCE: Partial<Record<PayloadFxKey, { lane: PacketId; half: 'payload' | 'pure' }>> = {
  'control.shackle': { lane: 'control', half: 'payload' },
  'control.knockdown': { lane: 'control', half: 'pure' },
  'affliction.heavy-drip': { lane: 'affliction', half: 'payload' },
  'affliction.double-dose': { lane: 'affliction', half: 'pure' },
};

/**
 * How long a lasting payload holds, ms. The event's `durationMs` is the applied
 * value (after control resistance, a re-dose's carried ticks) and always wins;
 * without one, the same `PACKET_HALF_NUMBERS` row the server read.
 */
export function payloadDurationMs(fx: PayloadFxKey, eventDurationMs?: number): number {
  if (eventDurationMs !== undefined && Number.isFinite(eventDurationMs) && eventDurationMs > 0) {
    return eventDurationMs;
  }
  const source = LASTING_SOURCE[fx];
  if (!source) return 0;
  const payoff = source.half === 'payload'
    ? packetPayload(source.lane)
    : packetPurePair(source.lane)?.payoff;
  return payoff?.durationMs ?? 0;
}

// ── Flair: a T1 payload is mid-weight ────────────────────────────────────────

/** A T1 payload never grows past this, however advanced the character. */
export const PAYLOAD_SIZE_CAP = 1.3;
export const PAYLOAD_SPARK_CAP = 1.6;

/**
 * The size and spark multipliers a payload draws at (`attackFlair.ts` axes).
 *
 * MID-WEIGHT: unlike a stage-0 basic attack, a payload is NOT thinned on a fresh
 * character — it is the reward the player just bought, so it starts at full size.
 * It grows a little with class stage and ascension, and stops at a cap well short
 * of a T3 specialization's bespoke payoff, which must stay the bigger event.
 */
export function payloadFlair(flair?: Pick<AttackFlair, 'stage' | 'ascension'>): { k: number; sparks: number } {
  if (!flair) return { k: 1, sparks: 1 };
  const k = Math.min(PAYLOAD_SIZE_CAP, 1 + 0.04 * flair.stage + 0.03 * flair.ascension);
  const sparks = Math.min(PAYLOAD_SPARK_CAP, 1 + 0.08 * flair.stage + 0.1 * flair.ascension);
  return { k, sparks };
}

// ── The loaded carry ─────────────────────────────────────────────────────────

/**
 * Whether the player's worn lineages carry a Kill-chain moment that lands LOADED
 * (a carried `kill` firing whose payload is `heal-and-load`). Read off the same
 * shared resolver the server caches, so a verb or lean swapped away while a load
 * is armed drops the glow — the server's carry belongs to a card no longer in play.
 */
export function composesLoadedCarry(
  view: Pick<HoldsInventory, 'equipment' | 'lineages'> | undefined,
): boolean {
  if (!view) return false;
  return resolveActiveLineages(view).cards.some((card) =>
    card.trigger?.kind === 'kill'
    && card.trigger.carry === true
    && card.payoff?.kind === 'heal-and-load'
    && (card.payoff.loadMultiplier ?? 1) > 1);
}
