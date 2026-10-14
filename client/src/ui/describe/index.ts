import {
  abilityDef,
  type AbilityDef,
} from '@mmo-idle/shared';
import type { IconSource } from '../GameIcon';
import { describeAbility, type AbilityContext } from './abilityText';
import { passiveLines } from './passiveText';
import { statEffectLines } from './statEffectText';

export { describeAbility, abilitySummary } from './abilityText';
export type { AbilityContext, AbilityClassSpecific, AbilityDescription, AbilityLine } from './abilityText';
export { passiveLines, passiveSummary, passiveNamespaceLabel, formatPassiveValue } from './passiveText';
export type { PassiveLine } from './passiveText';
export { statEffectLines, statEffectGlyph, statEffectChipValue } from './statEffectText';
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
  /** Authored icon source, when the line has art. */
  glyph?: IconSource | null;
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
    { key: "ability:tags", label: "Tags", value: described.tags.map(tag => tag.label).join(" · "), help: described.tags.map(tag => `${tag.label}: ${tag.help}`).join(" ") },
    ...described.lines.map((line) => ({
      key: `ability:${line.key}`,
      label: line.label,
      value: line.value,
      help: line.breakdown,
    })),
    ...described.classSpecific.map((line) => ({
      key: `ability:class-specific:${line.key}`,
      label: line.className,
      value: line.text,
    })),
  ];
}

/**
 * Lines for any loadout id, whichever system owns it. Lets one browser explain
 * a loadout entry without knowing which system it belongs to.
 */
export function loadoutLinesFor(id: string, context: AbilityContext): DetailLine[] {
  const ability = abilityDef(id);
  return ability ? abilityLines(ability, context) : [];
}
