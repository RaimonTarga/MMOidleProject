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
 * numbers come from `PACKET_HALF_NUMBERS` (`magnitudes.ts`), sized by the verb's
 * tier (design §24.9: a T2+ verb reads its T1 sentence with its tier's numbers).
 * This file only turns numbers into words, so the same functions render an
 * amplified pair from its amplified numbers (`compositionSentence`).
 */
import { LEAN_CONDITION_NUMBERS, isFractionalStat } from './magnitudes';
import type { PacketMomentNumbers, PacketPayloadNumbers } from './magnitudes';
import { packetHalves } from './packets';
import { composeVerb, packetMoment, packetPayload, packetPurePair } from './resolve';
import type { LineageStatEffects, LineageStatKey, PacketId } from './types';

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

/**
 * Every slot a template may name, from one half's numbers. A resolved
 * `LineageTrigger` / `LineagePayoff` is accepted as it stands (their number
 * fields are these), so a composed or amplified pair renders from its own numbers.
 */
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

/**
 * The one payload whose phrase quotes no number: "counts as your class mechanic
 * firing" is categorical, and its size is the class's own multiplier. Above T1 (or
 * amplified) it lands at a multiple of that bonus (`bonusScale`), which the
 * sentence says rather than hides.
 */
function proxySuffix(payload: { kind?: string; bonusScale?: number } | undefined): string {
  const scale = payload?.kind === 'mechanic-proxy' ? payload.bonusScale ?? 1 : 1;
  return scale > 1 + 1e-6 ? ` with a ${pct(scale - 1)} bigger bonus` : '';
}

// ─── The halves, rendered ────────────────────────────────────────────────────

/** The numbers a pair renders from: its moment and its payload, as resolved. */
export interface SentenceNumbers {
  trigger: PacketMomentNumbers;
  payoff: PacketPayloadNumbers & { kind?: string; bonusScale?: number };
}

/**
 * A packet's moment phrase with its numbers filled in, e.g. "Every 6th hit" — the
 * packet's own moment, or an explicit one (an amplified pair's quicker moment).
 */
export function momentText(id: PacketId, moment: PacketMomentNumbers | undefined = packetMoment(id)): string | undefined {
  const halves = packetHalves(id);
  if (!halves || !moment) return undefined;
  return fill(halves.momentPhrase.text, slotsFor(moment, undefined));
}

/**
 * A packet's payload phrase with its numbers filled in, e.g. "lands twice" — at a
 * verb's `tier` (default 1), or from explicit `numbers` (an amplified pair).
 */
export function payloadText(
  id: PacketId,
  tier = 1,
  numbers: SentenceNumbers['payoff'] | undefined = packetPayload(id, tier),
): string | undefined {
  const halves = packetHalves(id);
  if (!halves || !numbers) return undefined;
  return fill(halves.payloadPhrase, slotsFor(packetMoment(id), numbers)) + proxySuffix(numbers);
}

/** Where a pure sentence's moment ends (`PacketHalves.pureSentence`). Never rendered. */
const PURE_SPLIT = ' | ';

/**
 * A packet's pure sentence in its two halves, numbers filled in: `moment` is the
 * opener ("Every 6th hit"), `payload` the rest ("strikes twice."). Joined with a
 * space they are {@link pureSentenceText}.
 */
export function pureSentenceParts(
  id: PacketId,
  tier = 1,
  numbers: SentenceNumbers | undefined = packetPurePair(id, tier),
): { moment: string; payload: string } | undefined {
  const halves = packetHalves(id);
  if (!halves || !numbers) return undefined;
  const filled = fill(halves.pureSentence, slotsFor(numbers.trigger, numbers.payoff));
  const at = filled.indexOf(PURE_SPLIT);
  if (at < 0) return { moment: '', payload: filled };
  return { moment: filled.slice(0, at), payload: filled.slice(at + PURE_SPLIT.length) };
}

/**
 * A packet's pure sentence with its numbers filled in, at a verb's `tier`
 * (default 1), or from explicit `numbers` (an amplified pair).
 */
export function pureSentenceText(
  id: PacketId,
  tier = 1,
  numbers: SentenceNumbers | undefined = packetPurePair(id, tier),
): string | undefined {
  const parts = pureSentenceParts(id, tier, numbers);
  return parts ? joinParts(parts) : undefined;
}

/**
 * A composed sentence's two halves, for the page's two-colour sentence (design
 * §26.4) — so the client never parses text to find them.
 *
 *  - `moment`      the opener: the VERB's moment ("Every 6th hit", or "When a
 *                  Technique lands," for a clause moment, comma included);
 *  - `payload`     the rest, full stop included ("lands twice.", "the hit lands
 *                  twice.");
 *  - `momentLane`  the colour of the opener: the verb's lane;
 *  - `payloadLane` the colour of the rest: the lean's lane, or the verb's own on a
 *                  pure pair (same lane, or no lane-naming lean);
 *  - `pure`        the hand-authored pure sentence was used.
 *
 * `moment + ' ' + payload` is the sentence, always (`compositionSentence`).
 */
export interface ComposedSentenceParts {
  moment: string;
  payload: string;
  momentLane: PacketId;
  payloadLane: PacketId;
  pure: boolean;
}

function joinParts(parts: { moment: string; payload: string }): string {
  return parts.moment ? `${parts.moment} ${parts.payload}` : parts.payload;
}

/** {@link compositionSentence}, in its two halves. */
export function compositionParts(composed: SentenceNumbers & {
  verbLane: PacketId;
  leanLane?: PacketId;
  pure: boolean;
}): ComposedSentenceParts | undefined {
  if (composed.pure || !composed.leanLane) {
    const parts = pureSentenceParts(composed.verbLane, 1, composed);
    return parts && {
      ...parts, momentLane: composed.verbLane, payloadLane: composed.verbLane, pure: true,
    };
  }
  const halves = packetHalves(composed.verbLane);
  const moment = momentText(composed.verbLane, composed.trigger);
  const payload = payloadText(composed.leanLane, 1, composed.payoff);
  if (!halves || moment === undefined || payload === undefined) return undefined;
  const clause = halves.momentPhrase.kind === 'clause';
  return {
    moment: clause ? `${moment},` : moment,
    payload: clause ? `the hit ${payload}.` : `${payload}.`,
    momentLane: composed.verbLane,
    payloadLane: composed.leanLane,
    pure: false,
  };
}

/**
 * A composed pair as its sentence, from the pair's OWN numbers — design §24.2's
 * grammar. `verbSentence` is this over `composeVerb`; the page calls it directly
 * with an amplified pair's numbers, so an amplifier's tile reads the very sentence
 * the verb will read with it active.
 */
export function compositionSentence(composed: SentenceNumbers & {
  verbLane: PacketId;
  leanLane?: PacketId;
  pure: boolean;
}): string | undefined {
  const parts = compositionParts(composed);
  return parts ? joinParts(parts) : undefined;
}

/**
 * The sentence a verb of `verbLane` reads with a lean of `leanLane` (or none) at
 * the verb's `tier` (default 1) — design §24.2's grammar with the tier's numbers
 * (§24.9). Undefined only for a lane with no halves.
 */
export function verbSentence(verbLane: PacketId, leanLane?: PacketId, tier = 1): string | undefined {
  const composed = composeVerb(verbLane, leanLane, tier);
  return composed ? compositionSentence(composed) : undefined;
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
  payloadScale: 'payload size',
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

// ─── The T1 Effect lean: the weapon's own mechanic (design §26.1) ────────────

/**
 * What a payload is called when an Effect lean makes it bigger — the noun of the
 * thing the player watches grow, never the lane's name.
 */
const PAYLOAD_NOUN: Partial<Record<PacketId, string>> = {
  tempo: 'second strike',
  technique: 'refund',
  affliction: 'dose',
  engagement: 'lunge',
  empowered: 'mechanic hit',
  control: 'hold',
  'kill-chain': 'heal and load',
};

/**
 * The line of a T1 EFFECT lean (design §26.1: "Effect is the weapon's own mechanic
 * made stronger"), which names that mechanic rather than a stat:
 *
 *   dotPotencyPct  "+10% poison potency."  — the reservoir weapon's poison (the
 *                  Dagger). Its seed is the weapon's own reservoir (design §26.2),
 *                  so the line does not promise a bleed on every hit.
 *   slowOnHit      the slow's own line ("Every hit slows its target by 10% …").
 *   payloadScale   "+10% to Flurry's second strike." — the fixed verb's payload,
 *                  by its noun (`verbName` is the verb card's name).
 *
 * Anything else reads as its stat line.
 */
export function effectLeanLine(
  effects: LineageStatEffects | undefined,
  context: { lane: PacketId; verbName?: string },
  length: 'sentence' | 'short' = 'sentence',
): string | undefined {
  const entry = Object.entries(effects ?? {})[0] as [LineageStatKey, number] | undefined;
  if (!entry) return undefined;
  const [key, value] = entry;
  if (key === 'dotPotencyPct') return `+${pct(value)} poison potency.`;
  if (key === 'payloadScale') {
    const owner = context.verbName ? `${context.verbName}'s` : 'your verb\'s';
    return `+${pct(value)} to ${owner} ${PAYLOAD_NOUN[context.lane] ?? 'payoff'}.`;
  }
  return statLine(effects, length);
}
