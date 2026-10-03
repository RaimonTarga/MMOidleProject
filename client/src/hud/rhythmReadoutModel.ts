// The rhythm readout's ring model (design §24.6; course-correction W2-B).
//
// Pure data-in/data-out, like `areaInformationModel.ts`: what the rings SAY is
// decided here and tested from a plain tsx script; `RhythmReadout.tsx` only
// draws it. Nothing here simulates a counter. Every number comes off the
// server — the `ShowsRhythm` moments for the cards, the buff projection for the
// frame's window or bank — and the only clock is the server clock the caller
// passes in, read against a server timestamp the slice already carries.

import {
  PACKET_DEFINITIONS,
  RHYTHM_MAX_RINGS,
  lineageWindowBuffId,
  rhythmIdentity,
  type BuffId,
  type PacketId,
  type PlayerBuff,
  type RhythmFiring,
  type RhythmMoment,
  type RhythmShape,
} from '@mmo-idle/shared';

/** The frame ring's colour: the gold of the mockup, not a lane's. */
export const FRAME_RING_COLOR = '#d9b25c';
/** The frame ring's label. "Frame", not the frame's name — Flurry is a frame AND a verb. */
export const FRAME_RING_LABEL = 'Frame';

/** Centre marks the mockup names: "✦" for a latch that is ready. */
export const READY_MARK = '✦';
/** A latch spent on this target, a carry waiting for its kill. */
export const SPENT_MARK = '—';
/** A resting pulse ring: the server keeps no count toward its moment. */
export const PULSE_MARK = '•';

// ── Payload glyphs (W1-E, designer-approved 2026-10-03) ─────────────────────
//
// One glyph per PAYLOAD, keyed by the payload's packet, as loose concept-icon
// files (neutral ivory, so the ring carries the moment's lane colour). The ring
// label draws the glyph beside the card's name; a payload with no entry reads as
// text only.
const PAYLOAD_GLYPH_ROOT = '/assets/concept-icons/payloads';
export const RHYTHM_PAYLOAD_GLYPHS: Partial<Record<PacketId, string>> = {
  'tempo': `${PAYLOAD_GLYPH_ROOT}/lands-twice.png`,
  'affliction': `${PAYLOAD_GLYPH_ROOT}/heavy-poison.png`,
  'engagement': `${PAYLOAD_GLYPH_ROOT}/lunge.png`,
  'empowered': `${PAYLOAD_GLYPH_ROOT}/mechanic-proxy.png`,
  'control': `${PAYLOAD_GLYPH_ROOT}/root.png`,
  'kill-chain': `${PAYLOAD_GLYPH_ROOT}/heal-and-load.png`,
  'technique': `${PAYLOAD_GLYPH_ROOT}/technique-refund.png`,
};

// ── The frame's containers ───────────────────────────────────────────────────
//
// Every root's frame loop projects its window and its bank as ordinary buffs
// (design §10). The frame ring reads THOSE — it adds no transport of its own —
// and the buff bar stops drawing them as tiles while the ring is shown.

/** The window each root's light/balanced frame opens. */
export const FRAME_WINDOW_BUFF_IDS: readonly BuffId[] = [
  'frame-window', 'energy-frame-surge', 'summoner-frame-frenzy',
];
/** The bank each root's heavy/balanced frame fills (the Artillerist's ramp counts). */
export const FRAME_BANK_BUFF_IDS: readonly BuffId[] = [
  'frame-charge', 'energy-frame-overcharge', 'summoner-frame-link', 'reload-frame-ramp',
];
/**
 * The passives that give a frame a window or a bank — the same keys the server's
 * projections gate on — so the ring holds its place while the container is
 * empty instead of popping in and out with every cycle.
 */
const FRAME_CONTAINER_PASSIVES = {
  window: [
    'cadence.frame-window-ms', 'cooldown.frame-window-ms',
    'energy.frame-gain-window-ms', 'summoner.frame-frenzy-window-ms',
  ],
  bank: [
    'cadence.frame-charge-per-stack', 'cooldown.frame-charge-per-stack',
    'energy.frame-overcharge-max', 'summoner.frame-link-max-charge',
    'reload.frame-ramp-pct-per-shot',
  ],
} as const;

export interface RhythmRing {
  /** Card or capstone id, or `frame`. */
  key: string;
  kind: RhythmShape | 'frame';
  /** The card's name, or "Frame". */
  label: string;
  /** The card's lane colour (`packetDefinition(lane).color`), or the frame's gold. */
  color: string;
  /** 0..1 — how much of the ring is drawn. */
  fill: number;
  /** The centre text. */
  text: string;
  /** Full, glowing, label lit — flashes once when it becomes true. */
  ready: boolean;
  /** A payoff window is running and the ring is draining with it. */
  windowing: boolean;
  /**
   * Milliseconds until this ring changes with nothing new from the server (a cap
   * clearing, a latch re-arming) — the component's cue to keep re-rendering.
   */
  clockMs?: number;
  /** The buff tiles this ring stands in for (the frame's containers, a card's window). */
  owns: readonly BuffId[];
  /** The live buff a tooltip reads, when the ring is showing one. */
  buffId?: BuffId;
  /** The card behind the ring (absent on the frame ring). */
  firing?: RhythmFiring;
  /** W1-E hook: the payload glyph's atlas frame, or null. */
  glyph: string | null;
}

export interface RhythmInput {
  /** `rhythmFirings(resolveActiveLineages(...))`, in readout order. */
  firings: readonly RhythmFiring[];
  /** `PlayerView.rhythm` — the `ShowsRhythm` moments, absent with the slice. */
  moments: Record<string, RhythmMoment> | undefined;
  /** The player's current attack target, for the per-body opener. */
  attackTargetId: string | null;
  /** Server time now (`ServerClock.now()`), undefined before the first snapshot. */
  serverNow: number | undefined;
  /** `PlayerView.activeBuffs` — the frame's containers and the lineage windows. */
  buffs: readonly PlayerBuff[];
  /** `PlayerView.passives`. */
  passives: Readonly<Record<string, number>>;
  /** Cards whose payoff fired a moment ago — a pulse ring lights for that beat. */
  firedRecently?: ReadonlySet<string>;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * One decimal under ten seconds, whole seconds above: "0.8", "12". Rounded UP, so
 * a clock that is still running never reads "0.0".
 */
function seconds(ms: number): string {
  const s = Math.ceil(Math.max(0, ms) / 100) / 10;
  return s < 10 ? s.toFixed(1) : String(Math.ceil(s));
}

export function laneColor(lane: PacketId): string {
  return PACKET_DEFINITIONS.get(lane)?.color ?? '#9fb4c7';
}

/** A payoff window that is running: drawn draining in the ring's colour. */
function liveWindow(buff: PlayerBuff | undefined): buff is PlayerBuff {
  return buff !== undefined && buff.durationPct > 0;
}

function cardRing(firing: RhythmFiring, input: RhythmInput): RhythmRing {
  const moment = input.moments?.[firing.key] ?? {};
  const windowId = lineageWindowBuffId(firing.payoff);
  const base = {
    key: firing.key,
    kind: firing.shape,
    label: firing.name,
    color: laneColor(firing.lane),
    owns: windowId ? [windowId] : [],
    firing,
    glyph: RHYTHM_PAYLOAD_GLYPHS[firing.payloadLane] ?? null,
    windowing: false,
  } satisfies Partial<RhythmRing>;

  // A timed payoff that is running owns the ring until it closes: the payoff is
  // the thing happening, and its tile is not on the buff bar any more.
  const window = windowId ? input.buffs.find((b) => b.id === windowId) : undefined;
  if (liveWindow(window)) {
    return {
      ...base,
      fill: clamp01(window.durationPct / 100),
      text: window.remainingMs !== undefined ? seconds(window.remainingMs) : READY_MARK,
      ready: true,
      windowing: true,
      buffId: window.id,
    };
  }

  const now = input.serverNow;
  switch (firing.shape) {
    case 'count': {
      const n = Math.max(2, Math.round(firing.trigger.n ?? 2));
      const count = Math.max(0, Math.min(n - 1, moment.count ?? 0));
      // The hit before the payoff is the ready one: "the next hit pays".
      const ready = count >= n - 1;
      return { ...base, fill: ready ? 1 : count / n, text: `${count}/${n}`, ready };
    }
    case 'cap': {
      const capMs = Math.max(1, firing.trigger.capMs ?? 1);
      const left = moment.capUntil !== undefined && now !== undefined ? moment.capUntil - now : 0;
      if (left > 0) {
        return {
          ...base,
          fill: clamp01(1 - left / capMs),
          text: seconds(left),
          ready: false,
          clockMs: left,
        };
      }
      return { ...base, fill: 1, text: READY_MARK, ready: true };
    }
    case 'latch-body': {
      const spent = input.attackTargetId !== null
        && (moment.spentOn ?? []).includes(input.attackTargetId);
      return spent
        ? { ...base, fill: 0, text: SPENT_MARK, ready: false }
        : { ...base, fill: 1, text: READY_MARK, ready: true };
    }
    case 'latch-engagement': {
      const left = moment.spentUntil !== undefined && now !== undefined ? moment.spentUntil - now : 0;
      return left > 0
        ? { ...base, fill: 0, text: SPENT_MARK, ready: false, clockMs: left }
        : { ...base, fill: 1, text: READY_MARK, ready: true };
    }
    case 'carry':
      return moment.armed
        ? { ...base, fill: 1, text: READY_MARK, ready: true }
        : { ...base, fill: 0, text: SPENT_MARK, ready: false };
    case 'pulse':
    default: {
      const fired = input.firedRecently?.has(firing.key) === true;
      return { ...base, fill: fired ? 1 : 0, text: PULSE_MARK, ready: fired };
    }
  }
}

function frameRing(input: RhythmInput): RhythmRing | undefined {
  const window = input.buffs.find((b) => FRAME_WINDOW_BUFF_IDS.includes(b.id));
  const bank = input.buffs.find((b) => FRAME_BANK_BUFF_IDS.includes(b.id));
  const authored = (keys: readonly string[]) => keys.some((key) => (input.passives[key] ?? 0) > 0);
  const hasWindow = window !== undefined || authored(FRAME_CONTAINER_PASSIVES.window);
  const hasBank = bank !== undefined || authored(FRAME_CONTAINER_PASSIVES.bank);
  if (!hasWindow && !hasBank) return undefined;

  const base = {
    key: 'frame',
    kind: 'frame' as const,
    label: FRAME_RING_LABEL,
    color: FRAME_RING_COLOR,
    owns: [...FRAME_WINDOW_BUFF_IDS, ...FRAME_BANK_BUFF_IDS],
    glyph: null,
    windowing: false,
  } satisfies Partial<RhythmRing>;

  // The window is the frame's payoff running; it outranks the bank it was paid from.
  if (liveWindow(window)) {
    return {
      ...base,
      fill: clamp01(window.durationPct / 100),
      text: window.remainingMs !== undefined ? seconds(window.remainingMs) : READY_MARK,
      ready: true,
      windowing: true,
      buffId: window.id,
    };
  }
  if (bank) {
    const fill = bank.durationPct >= 0 ? clamp01(bank.durationPct / 100) : 0;
    return { ...base, fill, text: String(bank.stacks), ready: fill >= 1, buffId: bank.id };
  }
  return { ...base, fill: 0, text: hasBank ? '0' : SPENT_MARK, ready: false };
}

/**
 * The rings to draw, left to right: the active triggered cards first, then the
 * frame's window/bank ring, never more than {@link RHYTHM_MAX_RINGS}.
 */
export function deriveRhythmRings(input: RhythmInput): RhythmRing[] {
  const rings = input.firings.slice(0, RHYTHM_MAX_RINGS).map((firing) => cardRing(firing, input));
  if (rings.length < RHYTHM_MAX_RINGS) {
    const frame = frameRing(input);
    if (frame) rings.push(frame);
  }
  return rings;
}

/** The buff tiles the readout is drawing instead — the buff bar leaves them out. */
export function readoutBuffIds(rings: readonly RhythmRing[]): ReadonlySet<string> {
  return new Set(rings.flatMap((ring) => ring.owns));
}

/** Keys that just became ready, for the one-shot flash. */
export function newlyReady(
  previous: ReadonlyMap<string, boolean>,
  rings: readonly RhythmRing[],
): string[] {
  return rings.filter((ring) => ring.ready && previous.get(ring.key) === false).map((ring) => ring.key);
}

/** The ring's state in words, for its tooltip and its accessible label. */
export function ringStateText(ring: RhythmRing): string {
  if (ring.windowing) return `Running, ${ring.text} s left`;
  switch (ring.kind) {
    case 'count':
      return ring.ready ? 'The next hit pays' : `${ring.text} hits`;
    case 'cap':
      return ring.ready ? 'Ready' : `Ready again in ${ring.text} s`;
    case 'latch-body':
      return ring.ready ? 'Ready for this target' : 'Spent on this target';
    case 'latch-engagement':
      return ring.ready ? 'Ready' : 'Spent this fight';
    case 'carry':
      return ring.ready ? 'Armed by a kill' : 'Waiting for a kill';
    case 'frame':
      if (ring.ready) return 'Bank full';
      return ring.text === SPENT_MARK ? 'Window closed' : `Bank ${ring.text}`;
    case 'pulse':
    default:
      return ring.ready ? 'Fired' : 'Fires on its moment';
  }
}

/**
 * The floating word a firing draws over the player: the card's name with "!",
 * in its lane colour (design §24.6) — never a bigger number. Undefined for a
 * firing that is not a card's.
 */
export function cardWordFor(cardId: string | undefined): { text: string; color: string } | undefined {
  if (!cardId) return undefined;
  const identity = rhythmIdentity(cardId);
  return identity ? { text: `${identity.name}!`, color: laneColor(identity.lane) } : undefined;
}
