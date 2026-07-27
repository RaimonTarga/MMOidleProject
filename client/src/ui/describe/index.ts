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
import { statEffectLines } from './statEffectText';

export { describeAbility, abilitySummary, triggerSentence } from './abilityText';
export type { AbilityContext, AbilityDescription, AbilityLine } from './abilityText';
export { passiveLines, passiveSummary, passiveNamespaceLabel, formatPassiveValue } from './passiveText';
export type { PassiveLine } from './passiveText';
export { statEffectLines, statEffectGlyph, statEffectChipValue } from './statEffectText';
export type { StatEffectLine } from './statEffectText';

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

/** Everything a stance does while it is the active posture. */
export function stanceLines(stance: StanceDef | undefined): DetailLine[] {
  if (!stance) return [];
  return [
    ...fromStatEffects(stance.statEffects),
    ...fromMechanicEffects(stance.mechanicEffects),
  ];
}

/** Everything a rite does while equipped. Rites are OOC-only by construction. */
export function riteLines(rite: RiteDef | undefined): DetailLine[] {
  if (!rite) return [];
  return fromMechanicEffects(rite.mechanicEffects);
}

/** Everything an ability does for THIS character, tier and passives included. */
export function abilityLines(
  ability: AbilityDef | undefined,
  context: AbilityContext,
): DetailLine[] {
  if (!ability) return [];
  return describeAbility(ability, context).lines.map((line) => ({
    key: `ability:${line.key}`,
    label: line.label,
    value: line.value,
    help: line.breakdown,
  }));
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
