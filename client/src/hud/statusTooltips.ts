// Tooltip CONTENT for the combat HUD: player buffs, target-frame statuses, boss
// effects and equipped abilities, all reduced to the one `TooltipCardContent`
// shape `TooltipCard` renders.
//
// Pure data-in/data-out on purpose. Nothing here touches the DOM or hover, so a
// future mobile inspection surface (tap, long-press, a selected-status panel) can
// reuse every one of these builders without going near `useHoverTooltip` — and so
// the whole formatting layer is testable from a plain tsx script.
//
// The division of labour: STATIC copy comes from `statusHelp.ts`, shipped with
// the client; LIVE numbers come off the server projection (`PlayerBuff.values`,
// `TargetStatusView.values`) already resolved past resistances and caps. Nothing
// here parses `logDetail`, and nothing here re-implements a combat formula.

import {
  abilityCooldownMs,
  abilityRankNumber,
  abilityRankNumeral,
  type AbilityDef,
  type PlayerBuff,
  type StatusValue,
  type TargetStatusView,
} from '@mmo-idle/shared';
import type { TooltipCardContent, TooltipRow } from './primitives/TooltipCard';
import { abilityLines, describeAbility, type AbilityContext } from '../ui/describe';
import {
  bossEffectHelp,
  buffHelp,
  prettifyStatusId,
  statusKindLabel,
  targetStatusHelp,
  type StatusHelp,
} from './statusHelp';

/**
 * Last-resort copy for a status with no authored entry. A new mechanic shipping
 * before its wording does should read as "we know what this is, we have not
 * explained it yet" — never as a blank card and never as a crash.
 */
const FALLBACK_HELP =
  'No description authored for this effect yet. Its current values are shown below.';

/**
 * One unit for every clock on a card. Milliseconds are never shown: a player
 * comparing "3.6s" against "800ms" has to convert in their head, and the cards
 * sit side by side on the same bar.
 */
const SECONDS = (ms: number): string =>
  ms < 50 ? '<0.1s' : `${(ms / 1000).toFixed(1)}s`;

function toRows(values: readonly StatusValue[] | undefined, prefix: string): TooltipRow[] {
  return (values ?? []).map((value, index) => ({
    key: `${prefix}:${index}:${value.label}`,
    label: value.label,
    value: value.value,
    good: value.good,
  }));
}

/** True when the projection already published a row for this label. */
function hasRow(rows: readonly TooltipRow[], label: string): boolean {
  return rows.some((row) => row.label.toLowerCase() === label.toLowerCase());
}

// -- Player buffs ------------------------------------------------------------

export function buffTooltipContent(buff: PlayerBuff): TooltipCardContent {
  const help: StatusHelp | undefined = buffHelp(buff.id);
  const current = toRows(buff.values, `buff:${buff.id}`);

  // Stacks are worth a row only when the projection did not already publish one
  // and the count actually carries meaning.
  if (buff.stacks > 1 && !hasRow(current, 'Stacks')) {
    current.push({ key: 'stacks', label: 'Stacks', value: String(buff.stacks) });
  }
  if (buff.remainingMs !== undefined && buff.remainingMs > 0) {
    current.push({ key: 'remaining', label: 'Remaining', value: SECONDS(buff.remainingMs) });
  }

  return {
    // The runtime label wins for buffs that name themselves from a source — a
    // Guard tile is called after the ability occupying the slot, not "Guard".
    title: help?.title ?? prettifyStatusId(buff.label || buff.id),
    kicker: help ? statusKindLabel(help.kind) : 'Status',
    body: help?.help ?? FALLBACK_HELP,
    current,
  };
}

// -- Target-frame statuses ---------------------------------------------------

export function targetStatusTooltipContent(
  status: TargetStatusView,
  displayLabel: string,
): TooltipCardContent {
  const help = targetStatusHelp(status.id);
  const current = toRows(status.values, `target:${status.id}`);

  if (status.stacks > 1 && !hasRow(current, 'Stacks') && !hasRow(current, 'Stored damage')) {
    current.push({ key: 'stacks', label: 'Stacks', value: String(status.stacks) });
  }
  if (status.remainingMs < 0) {
    current.push({ key: 'remaining', label: 'Duration', value: 'Permanent' });
  } else if (status.remainingMs > 0) {
    current.push({ key: 'remaining', label: 'Remaining', value: SECONDS(status.remainingMs) });
  }

  return {
    title: help?.title ?? prettifyStatusId(displayLabel || status.id),
    kicker: help ? `${statusKindLabel(help.kind)} · on target` : 'On target',
    body: help?.help ?? FALLBACK_HELP,
    current,
  };
}

export function bossEffectTooltipContent(
  name: string,
  displayLabel: string,
  stacks: number,
): TooltipCardContent {
  const help = bossEffectHelp(name);
  const current: TooltipRow[] = [];
  if (stacks > 1) current.push({ key: 'stacks', label: 'Stacks', value: String(stacks) });
  return {
    title: help?.title ?? prettifyStatusId(displayLabel || name),
    kicker: 'Boss effect',
    body: help?.help ?? FALLBACK_HELP,
    current,
  };
}

// -- Abilities ---------------------------------------------------------------

/** What the client already knows about an equipped slot, right now. */
export interface AbilityRuntime {
  state: 'ready' | 'cooling' | 'active' | 'casting';
  /** Cooldown left, when cooling. */
  cooldownRemainingMs?: number;
  /** Wind-up left, when casting. */
  castRemainingMs?: number;
}

const ABILITY_STATE_LABEL: Record<AbilityRuntime['state'], string> = {
  ready: 'Ready',
  cooling: 'Cooling down',
  active: 'Active',
  casting: 'Casting',
};

const SLOT_LABEL: Record<AbilityDef['slot'], string> = {
  technique: 'Technique',
  guard: 'Guard',
};

/**
 * An ability's tooltip is `ui/describe` plus a state line — deliberately not a
 * second effect formatter. The loadout browser, the skill tree and this tile all
 * read the same authored rank through the same resolver, so a number can never
 * mean one thing in the build screen and another on the HUD.
 */
export function abilityTooltipContent(
  ability: AbilityDef,
  context: AbilityContext,
  runtime: AbilityRuntime,
): TooltipCardContent {
  const rank = abilityRankNumeral(abilityRankNumber(ability, context.playerTier));
  const described = describeAbility(ability, context);

  // `abilityLines` leads with a Rank row; the title already carries the numeral,
  // so it is dropped rather than said twice.
  const rows: TooltipRow[] = abilityLines(ability, context)
    .filter((line) => line.key !== 'ability:rank')
    .map((line) => ({
      key: line.key,
      label: line.label,
      value: line.value,
      detail: line.detail,
      good: line.good,
    }));

  const current: TooltipRow[] = [
    { key: 'state', label: 'Status', value: ABILITY_STATE_LABEL[runtime.state] },
  ];
  if (runtime.state === 'cooling' && runtime.cooldownRemainingMs !== undefined) {
    current.push({
      key: 'cooldown-remaining',
      label: 'Cooldown remaining',
      value: SECONDS(runtime.cooldownRemainingMs),
    });
  }
  if (runtime.state === 'casting' && runtime.castRemainingMs !== undefined) {
    current.push({
      key: 'cast-remaining',
      label: 'Wind-up remaining',
      value: SECONDS(runtime.castRemainingMs),
    });
  }

  return {
    title: `${ability.name} ${rank}`,
    kicker: `${SLOT_LABEL[ability.slot]} · ${described.rankLabel}`,
    body: ability.blurb,
    rows,
    rowsTitle: 'At this rank',
    current,
    // Trigger and shape are the two sentences a player needs to predict WHEN it
    // goes off — abilities are automatic, so that is the only control they have.
    footnote: `${described.trigger} ${described.shape}`,
  };
}

/** Plain-text accessible name for an ability slot — used for `aria-label`. */
export function abilityAccessibleLabel(
  ability: AbilityDef,
  context: AbilityContext,
  runtime: AbilityRuntime,
): string {
  const rank = abilityRankNumeral(abilityRankNumber(ability, context.playerTier));
  const state =
    runtime.state === 'cooling' && runtime.cooldownRemainingMs !== undefined
      ? `cooling, ${SECONDS(runtime.cooldownRemainingMs)} remaining`
      : ABILITY_STATE_LABEL[runtime.state].toLowerCase();
  return `${SLOT_LABEL[ability.slot]}: ${ability.name} ${rank} — ${state}`;
}

/** Cooldown left, from the fraction the HUD already tracks. */
export function cooldownRemainingMs(
  ability: AbilityDef,
  playerTier: number,
  remainingFrac: number,
): number {
  return Math.max(0, remainingFrac * abilityCooldownMs(ability, playerTier));
}
