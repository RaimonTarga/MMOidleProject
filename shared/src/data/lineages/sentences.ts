/**
 * The one-sentence cards (design §24.2, §24.6; course-correction rule 5).
 *
 * A card is ONE sentence and no flavour text. The sentence is GENERATED from the
 * two halves — never hand-typed per pair — so nine combinations per weapon cost
 * seven moment phrases, seven payload phrases and seven pure sentences, and a
 * designer number change rewrites every sentence that quotes it:
 *
 *   subject moment   "<Moment> <payload>."          Every 6th hit lands twice.
 *   clause moment    "<Moment>, the hit <payload>."  When a Technique lands, the hit lands twice.
 *   same lane / none the packet's pure sentence      Every 6th hit strikes twice.
 *
 * The phrases are templates on `PacketDefinition.halves` (`packets.ts`); the
 * numbers come from `PACKET_HALF_NUMBERS` (`magnitudes.ts`). This file only turns
 * numbers into words.
 */
import { PACKET_HALF_NUMBERS, isFractionalStat } from './magnitudes';
import type { PacketMomentNumbers, PacketPayloadNumbers } from './magnitudes';
import { packetHalves } from './packets';
import { composeVerb } from './resolve';
import type { LineageStatEffects, LineageStatKey, PacketId } from './types';
import { LEAN_CONDITION_NUMBERS } from './magnitudes';

// ─── Numbers into words ──────────────────────────────────────────────────────

const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;

/** Up to two decimals, trailing zeros dropped: 5 → "5", 1.5 → "1.5". */
function trimmed(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function pct(fraction: number): string {
  return `${trimmed(fraction * 100)}%`;
}

function ordinal(n: number): string {
  const whole = Math.round(n);
  const mod100 = whole % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${whole}th`;
  switch (whole % 10) {
    case 1: return `${whole}st`;
    case 2: return `${whole}nd`;
    case 3: return `${whole}rd`;
    default: return `${whole}th`;
  }
}

function seconds(ms: number): string {
  return `${trimmed(ms / 1000)} s`;
}

/** An echo's share of the hit, as how many times the hit lands. */
function times(share: number): string {
  return near(share, 1) ? 'twice' : `again at ${pct(share)} strength`;
}

/** A DoT worth `share` of the hit, as swings. */
function swing(share: number): string {
  if (near(share, 1)) return 'a whole swing';
  if (near(share, 0.5)) return 'half a swing';
  if (near(share, 1.5)) return 'a swing and a half';
  if (near(share, 2)) return 'two whole swings';
  return `${pct(share)} of a swing`;
}

/** A hit multiplier as an adjective: "a lunge for double damage". */
function mult(multiplier: number): string {
  if (near(multiplier, 2)) return 'double';
  if (near(multiplier, 3)) return 'triple';
  if (near(multiplier, 4)) return 'quadruple';
  return `${trimmed(multiplier)}×`;
}

/** A hit multiplier, comparative: "hits half again as hard". */
function asHard(multiplier: number): string {
  if (near(multiplier, 1.5)) return 'half again';
  if (near(multiplier, 2)) return 'twice';
  if (near(multiplier, 3)) return 'three times';
  return `${trimmed(multiplier)}×`;
}

/** A fraction, partitive: "a third of", or "half" (English drops the "of"). */
function shareOf(fraction: number): string {
  if (near(fraction, 1)) return 'all of';
  if (near(fraction, 0.5)) return 'half';
  if (near(fraction, 1 / 3)) return 'a third of';
  if (near(fraction, 2 / 3)) return 'two thirds of';
  if (near(fraction, 0.25)) return 'a quarter of';
  if (near(fraction, 0.75)) return 'three quarters of';
  if (near(fraction, 0.2)) return 'a fifth of';
  if (near(fraction, 0.1)) return 'a tenth of';
  return `${pct(fraction)} of`;
}

/** A re-dose share, as a verb on "its affliction". */
function redose(share: number): string {
  if (near(share, 1)) return 'doubles';
  if (near(share, 2)) return 'triples';
  if (near(share, 0.5)) return 'adds half again to';
  return `adds ${pct(share)} to`;
}

/** Every slot a template may name, from one half's numbers. */
function slotsFor(
  moment: PacketMomentNumbers | undefined,
  payload: PacketPayloadNumbers | undefined,
): Record<string, string | undefined> {
  const m = payload?.magnitude;
  return {
    nth: moment?.n !== undefined ? ordinal(moment.n) : undefined,
    cap: moment?.capMs !== undefined ? seconds(moment.capMs) : undefined,
    duration: payload?.durationMs !== undefined ? seconds(payload.durationMs) : undefined,
    times: m !== undefined ? times(m) : undefined,
    swing: m !== undefined ? swing(m) : undefined,
    mult: m !== undefined ? mult(m) : undefined,
    asHard: m !== undefined ? asHard(m) : undefined,
    shareOf: m !== undefined ? shareOf(m) : undefined,
    redose: m !== undefined ? redose(m) : undefined,
    loadPct: payload?.loadMultiplier !== undefined ? `+${pct(payload.loadMultiplier - 1)}` : undefined,
  };
}

/**
 * Fill a template's `{slot}` markers. A slot with no number behind it throws:
 * it means a phrase quotes a number its half does not author, which is a data
 * bug to catch at authoring time, not text to ship.
 */
function fill(template: string, slots: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = slots[key];
    if (value === undefined) throw new Error(`lineage sentence slot '{${key}}' has no number in "${template}"`);
    return value;
  });
}

// ─── The halves, rendered ────────────────────────────────────────────────────

/** A packet's moment phrase with its numbers filled in, e.g. "Every 6th hit". */
export function momentText(id: PacketId): string | undefined {
  const halves = packetHalves(id);
  const numbers = PACKET_HALF_NUMBERS[id];
  if (!halves || !numbers) return undefined;
  return fill(halves.momentPhrase.text, slotsFor(numbers.moment, undefined));
}

/** A packet's payload phrase with its numbers filled in, e.g. "lands twice". */
export function payloadText(id: PacketId): string | undefined {
  const halves = packetHalves(id);
  const numbers = PACKET_HALF_NUMBERS[id];
  if (!halves || !numbers) return undefined;
  return fill(halves.payloadPhrase, slotsFor(numbers.moment, numbers.payload));
}

/** A packet's pure sentence with its numbers filled in. */
export function pureSentenceText(id: PacketId): string | undefined {
  const halves = packetHalves(id);
  const numbers = PACKET_HALF_NUMBERS[id];
  if (!halves || !numbers) return undefined;
  return fill(halves.pureSentence, slotsFor(numbers.moment, numbers.pure));
}

/**
 * The sentence a verb of `verbLane` reads with a lean of `leanLane` (or none) —
 * design §24.2's grammar. Undefined only for a lane with no halves.
 */
export function verbSentence(verbLane: PacketId, leanLane?: PacketId): string | undefined {
  const composed = composeVerb(verbLane, leanLane);
  if (!composed) return undefined;
  if (composed.pure || !composed.leanLane) return pureSentenceText(verbLane);
  const halves = packetHalves(verbLane);
  const moment = momentText(verbLane);
  const payload = payloadText(composed.leanLane);
  if (!halves || moment === undefined || payload === undefined) return undefined;
  return halves.momentPhrase.kind === 'clause'
    ? `${moment}, the hit ${payload}.`
    : `${moment} ${payload}.`;
}

// ─── The lean: a stat line ───────────────────────────────────────────────────

const STAT_LINE_LABEL: Record<LineageStatKey, string> = {
  attack: 'Attack',
  onHitDamage: 'on-hit damage',
  plating: 'Plating',
  damageReduction: 'damage reduction',
  evasion: 'evasion',
  maxHp: 'max HP',
  recovery: 'Recovery',
  speed: 'move speed',
  attackPct: 'Attack',
  attackSpeedPct: 'attack speed',
  techniquePowerPct: 'Technique power',
  dotPotencyPct: 'DoT potency',
  slowOnHit: 'slow on hit',
};

/**
 * The leans whose stat also SEEDS a condition (design §24.9) read as what they
 * do: "+10% DoT potency." told the five classes with no DoT nothing, and the bleed
 * is the half of the stat they get. Numbers from the stat and from
 * `LEAN_CONDITION_NUMBERS`, never typed here.
 */
const STAT_LINE_FORM: Partial<Record<LineageStatKey, (value: number) => string>> = {
  dotPotencyPct: (value) => `+${pct(value)} DoT potency, and every hit bleeds for ${shareOf(value)} its damage`
    + ` over ${seconds(LEAN_CONDITION_NUMBERS.affliction?.durationMs ?? 0)}.`,
  // How long is "until your next swing" (or the authored window, if longer):
  // the slow is there to be found by the hit after it, whatever the weapon.
  slowOnHit: (value) => `Every hit slows its target by ${pct(value)} until your next swing.`,
};

/**
 * A resolved stat row as one sentence: "+9% attack speed.", "+3 Attack.". `short`
 * keeps the bare "+N stat." form even for a lean that seeds a condition — for a
 * line that quotes the stat in passing (the tutorial's lean beat).
 */
export function statLine(
  effects: LineageStatEffects | undefined,
  length: 'sentence' | 'short' = 'sentence',
): string | undefined {
  const entry = Object.entries(effects ?? {})[0] as [LineageStatKey, number] | undefined;
  if (!entry) return undefined;
  const [key, value] = entry;
  const form = length === 'sentence' ? STAT_LINE_FORM[key] : undefined;
  if (form) return form(value);
  const amount = isFractionalStat(key) ? pct(value) : trimmed(value);
  return `+${amount} ${STAT_LINE_LABEL[key] ?? key}.`;
}
