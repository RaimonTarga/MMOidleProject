import {
  abilityDef,
  riteDef,
  stanceDef,
  type AbilityDef,
  type RiteDef,
  type StanceDef,
} from '@mmo-idle/shared';
import { describeAbility, type AbilityContext } from './abilityText';
import { passiveLines } from './passiveText';
import { stanceModifierLines, statEffectLines } from './statEffectText';

export { describeAbility, abilitySummary, triggerSentence } from './abilityText';
export type { AbilityContext, AbilityDescription, AbilityLine } from './abilityText';
export { passiveLines, passiveSummary, passiveNamespaceLabel, formatPassiveValue } from './passiveText';
export type { PassiveLine } from './passiveText';
export { statEffectLines, stanceModifierLines, statEffectGlyph, statEffectChipValue } from './statEffectText';
export type { StatEffectLine } from './statEffectText';
export { actionLines, conditionLines, ruleLines, hasRuneNumbers } from './runeText';

/**
 * The one row shape every "what does this actually do" list renders.
 *
 * Stat deltas, passive mechanics and ability effects come from three different
 * authoring shapes; the player should not be able to tell. A surface asks for
 * lines and renders them identically, tooltip and all.
 */
export interface DetailLine {
  key: string;
  label: string;
  value: string;
  /** Qualifiers that belong to the value, e.g. "every 8s · for 4s". */
  detail?: string;
  /** Hover copy: what it means, or how the number was arrived at. */
  help?: string;
  /** False when the line is a downside (drives the down styling). */
  good?: boolean;
  /** Packed glyph frame, when the line has authored art. */
  glyph?: string | null;
}

function fromStatEffects(effects: StatEffectsInput): DetailLine[] {
  return statEffectLines(effects).map((line) => ({
    key: `stat:${line.key}`,
    label: line.label,
    value: line.value,
    help: line.help,
    good: line.good,
    glyph: line.glyph,
  }));
}

type StatEffectsInput = Parameters<typeof statEffectLines>[0];

function fromMechanicEffects(effects: Record<string, number> | undefined): DetailLine[] {
  return passiveLines(effects, { signed: true }).map((line) => ({
    key: `passive:${line.key}`,
    label: line.label,
    value: line.value,
    detail: line.detail || undefined,
    help: line.help,
  }));
}

/**
 * A skill node's full effect, split into the two things it can grant. Kept
 * separate rather than concatenated so the tree can title them — a node's stat
 * deltas and its mechanic changes are different kinds of promise.
 */
export function skillNodeLines(node: {
  statEffects?: StatEffectsInput;
  mechanicEffects?: Record<string, number>;
}): { stats: DetailLine[]; mechanics: DetailLine[] } {
  return {
    stats: fromStatEffects(node.statEffects),
    mechanics: fromMechanicEffects(node.mechanicEffects),
  };
}

/**
 * Everything a stance does while it is the active posture — the static percentages,
 * every server-runtime behavior it owns, and what a Rune rule pays to reach it.
 *
 * Behaviors are authored on the stance rather than derived, because the effects that
 * decide whether a posture is survivable (Berserker's lethal self-damage, Predator's
 * opener, Brawler's cap) live in combat listeners and cannot describe themselves.
 * What is deliberately NOT here: the Rune CONDITION a stance is usually reached by.
 * "Activates below 25% HP" is a property of the rule, not of Enraged.
 */
export function stanceLines(
  stance: StanceDef | undefined,
  /**
   * The reader's current HP fraction, when a surface has one. A gated posture
   * (Perfection) then marks its conditional rows ACTIVE or INACTIVE instead of only
   * naming the threshold — the difference between "I could have this" and "I have
   * this right now" is the entire point of the gate.
   */
  hpFraction?: number,
): DetailLine[] {
  if (!stance) return [];
  const gate = stance.gatedModifiers;
  const gateMet = gate !== undefined && hpFraction !== undefined && hpFraction >= gate.minHpPct;
  const gateQualifier = gate
    ? `while at or above ${Math.round(gate.minHpPct * 100)}% HP`
    : '';
  return [
    ...stanceModifierLines(stance.modifiers).map((line) => ({
      key: `stat:${line.key}`,
      label: line.label,
      value: line.value,
      help: line.help,
      good: line.good,
      glyph: line.glyph,
    })),
    // The gated half, rendered as its own rows so a player never reads a conditional
    // bonus as an unconditional one. `detail` carries the threshold, and the live
    // active/inactive state when the surface knows the reader's HP.
    ...stanceModifierLines(gate?.modifiers).map((line) => ({
      key: `gated:${line.key}`,
      label: line.label,
      value: line.value,
      detail: hpFraction === undefined
        ? gateQualifier
        : `${gateQualifier} — ${gateMet ? 'ACTIVE' : 'INACTIVE'}`,
      help: `${line.help} Granted only ${gateQualifier}; the stance's drawback is paid either way.`,
      good: line.good,
      glyph: line.glyph,
    })),
    ...(stance.behaviors ?? []).map((behavior) => ({
      key: `behavior:${behavior.key}`,
      label: behavior.label,
      value: behavior.value,
      detail: behavior.detail,
      help: behavior.help,
      good: behavior.good ?? true,
    })),
    ...fromMechanicEffects(stance.mechanicEffects),
    {
      key: `stance:${stance.id}:rp`,
      label: "Rune destination cost",
      value: `${stance.runeCost} RP`,
      help: "Every Rune rule that switches to this stance pays this on top of its own cost. Your free default stance pays nothing.",
    },
  ];
}

/** Everything a rite does while equipped. Rites are OOC-only by construction. */
export function riteLines(rite: RiteDef | undefined): DetailLine[] {
  if (!rite) return [];
  return [{ key: `rite:${rite.id}:rp`, label: "Shared Runic cost", value: `${rite.runeCost} RP`, help: rite.blurb }];
}

/** Everything an ability does for THIS character, tier and passives included. */
export function abilityLines(
  ability: AbilityDef | undefined,
  context: AbilityContext,
): DetailLine[] {
  if (!ability) return [];
  const described = describeAbility(ability, context);
  return [
    // Rank leads, because every number below it comes from that rank and from
    // nowhere else — an ability deepens by being re-authored a tier up, not by
    // being multiplied, and the reader has to know which version they are seeing.
    {
      key: "ability:rank",
      label: "Rank",
      value: described.rank,
      help: described.rankLabel,
    },
    ...described.lines.map((line) => ({
      key: `ability:${line.key}`,
      label: line.label,
      value: line.value,
      help: line.breakdown,
    })),
  ];
}

/**
 * Lines for any loadout id, whichever system owns it. Lets one browser explain
 * abilities, stances and rites without knowing which it is looking at.
 */
export function loadoutLinesFor(id: string, context: AbilityContext): DetailLine[] {
  const ability = abilityDef(id);
  if (ability) return abilityLines(ability, context);
  const stance = stanceDef(id);
  if (stance) return stanceLines(stance);
  return riteLines(riteDef(id));
}
