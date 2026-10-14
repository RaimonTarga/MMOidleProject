// Tooltip CONTENT for the combat HUD: player buffs, target-frame statuses and
// boss effects, all reduced to the one `TooltipCardContent` shape `TooltipCard`
// renders.
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
  MONSTER_DATABASE,
  type PlayerBuff,
  type StatusValue,
  type TargetStatusView,
} from '@mmo-idle/shared';
import type { TooltipCardContent, TooltipRow } from './primitives/TooltipCard';
import {
  bossDebuffHelp,
  bossEffectHelp,
  buffHelp,
  monsterDotHelp,
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

/**
 * The two shared tiles (`debuff-boss`, `debuff-dot`) carry many named effects;
 * their copy comes from the specific effect (`instanceKey`) when it is authored.
 */
function specificBuffHelp(buff: PlayerBuff): StatusHelp | undefined {
  if (!buff.instanceKey) return undefined;
  if (buff.id === 'debuff-boss') return bossDebuffHelp(buff.instanceKey);
  if (buff.id === 'debuff-dot') return monsterDotHelp(buff.instanceKey);
  return undefined;
}

/**
 * The ability a buff tile belongs to, as it is called now (design §22.7): its full
 * display name. The buff bar passes it for the tiles an ability owns (a Guard's
 * window, a Recovery window, …).
 */
export interface BuffAbilityName {
  name: string;
}

export function buffTooltipContent(buff: PlayerBuff, owner?: BuffAbilityName): TooltipCardContent {
  const specific = specificBuffHelp(buff);
  const help: StatusHelp | undefined = specific ?? buffHelp(buff.id);
  // A shared tile with no specific entry keeps the effect's own name as its title.
  const sharedTile = !specific && (buff.id === 'debuff-boss' || buff.id === 'debuff-dot');
  const current = toRows(buff.values, `buff:${buff.id}`);

  // Stacks are worth a row only when the projection did not already publish one
  // and the count actually carries meaning.
  if (buff.stacks > 1 && !hasRow(current, 'Stacks')) {
    current.push({ key: 'stacks', label: 'Stacks', value: String(buff.stacks) });
  }
  if (buff.remainingMs !== undefined && buff.remainingMs > 0) {
    current.push({ key: 'remaining', label: 'Remaining', value: SECONDS(buff.remainingMs) });
  }

  const statusTitle = sharedTile && buff.label ? buff.label : help?.title ?? prettifyStatusId(buff.label || buff.id);
  const kind = help ? statusKindLabel(help.kind) : 'Status';
  if (owner) {
    // A tile an ability owns is named after the ability as it is called now;
    // the status's own name moves to the kicker.
    return {
      title: owner.name,
      kicker: statusTitle !== owner.name ? `${kind} · ${statusTitle}` : kind,
      body: help?.help ?? FALLBACK_HELP,
      current,
    };
  }
  return {
    // The runtime label wins for buffs that name themselves from a source — a
    // Guard tile is called after the ability occupying the slot, not "Guard".
    title: statusTitle,
    kicker: kind,
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

/** Authored text of a boss's announced phase (`BossPhase.description`). */
function bossPhaseDescription(monsterTypeId: string | undefined, phaseName: string): string | undefined {
  if (!monsterTypeId) return undefined;
  const phases = MONSTER_DATABASE.get(monsterTypeId)?.bossScript?.phases ?? [];
  return phases.find((phase) => phase.name === phaseName)?.description;
}

/** The card for the target frame's phase tile: the phase name and what it does. */
export function bossPhaseTooltipContent(
  monsterTypeId: string | undefined,
  phaseName: string,
): TooltipCardContent {
  return {
    title: phaseName,
    kicker: 'Boss phase',
    body: bossPhaseDescription(monsterTypeId, phaseName)
      ?? 'The boss has entered a new phase of the fight.',
    current: [],
  };
}
