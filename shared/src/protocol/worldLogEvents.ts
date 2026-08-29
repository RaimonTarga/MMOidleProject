import type { EssenceType } from '../items';
import { essenceLabel } from '../items';
import type { BuffCategory, BuffId } from '../components/combat/buffs';
import type { DeathCause } from './death';
import { formatDeathCauseLabel } from './death';
import type { Vec2 } from '../systems/spatial';

export type WorldLogActorType = 'player' | 'monster' | 'minion';

export interface WorldLogActor {
  id: string;
  name: string;
  actorType: WorldLogActorType;
  ownerPlayerId?: string;
}

export type WorldLogDamageType = 'direct' | 'dot' | 'weapon-dot' | 'aoe' | 'debt' | 'proc';

export interface DamageMitigationBreakdown {
  grossDamage: number;
  platingBlocked: number;
  drBlocked: number;
  mitigatedTotal: number;
  hpDamage: number;
  glancing: boolean;
}

export type WorldLogDisplayKind =
  | 'damage-out'
  | 'damage-in'
  | 'buff'
  | 'heal'
  | 'shield'
  | 'kill'
  | 'death'
  | 'dodge'
  | 'biome-level'
  | 'ascension'
  | 'info';

export type WorldLogEvent =
  | {
      kind: 'damage';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      source: WorldLogActor;
      target: WorldLogActor;
      hpDamage: number;
      absorbed: number;
      damageType: WorldLogDamageType;
      mitigation?: DamageMitigationBreakdown;
      glancing?: boolean;
      tags?: string[];
    }
  | {
      kind: 'heal' | 'ward-gain' | 'absorb';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      target: WorldLogActor;
      source?: WorldLogActor;
      amount: number;
    }
  | {
      kind: 'buff-gain' | 'buff-update' | 'buff-expire';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      target: WorldLogActor;
      buffId: BuffId;
      label: string;
      stacks: number;
      stackDelta: number;
      category: BuffCategory;
      sourceName: string;
      sourceSide: LogActorSide;
      effectText: string;
      changeText?: string;
      durationPct: number;
    }
  | {
      kind: 'kill';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      killer: WorldLogActor;
      victim: WorldLogActor;
      damage: number;
      essenceGained?: number;
      essenceType?: EssenceType;
      biomeXpGained?: number;
    }
  | {
      kind: 'dodge';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      attacker: WorldLogActor;
      target: WorldLogActor;
    }
  | {
      kind: 'player-death';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      cause: DeathCause;
    }
  | {
      kind: 'biome-level-up';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      biomeGroup: string;
      biomeName: string;
      prevLevel: number;
      newLevel: number;
      unlockedRecipeIds: string[];
    }
  | {
      kind: 'player-tier-up';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      prevTier: number;
      newTier: number;
      questId?: string;
      questName?: string;
    }
  | {
      kind: 'overlord-slain';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
    }
  | {
      kind: 'dungeon-message';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      message: string;
    }
  | {
      /** Authoritative Guard/Technique activation for combat-run diagnostics. */
      kind: 'ability-activation';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      abilityId: string;
      slot: 'guard' | 'technique';
      removedEffects?: Array<{ effectId: string; stacks: number }>;
    }
  | {
      /** One continuous stay inside one hostile persistent runtime hazard. */
      kind: 'hazard-contact';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      hazardId: string;
      hazardKind: string;
      sourceId: string;
      sourceName: string;
      phase: 'enter' | 'leave';
      durationMs?: number;
      damageReceived?: number;
      harmfulEffects?: string[];
      endReason?: 'exited' | 'expired' | 'death' | 'node-cleared';
    }
  | {
      /** Avoid Hazards movement response, distinct from telegraph dodging. */
      kind: 'hazard-escape';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      hazardIds: string[];
      hazardKinds: string[];
      phase: 'attempt' | 'result';
      outcome?: 'success' | 'failed' | 'expired' | 'interrupted';
      reason?: string;
    }
  | {
      /** Step Back lifecycle measured against authoritative telegraph resolution. */
      kind: 'telegraph-dodge';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      phase: 'activation' | 'attempt' | 'safe' | 'reenter' | 'resolution' | 'release' | 'result';
      telegraphId?: string;
      telegraphKind?: string;
      ownerId?: string;
      trackedTelegraphIds?: string[];
      acquiredAtMs?: number;
      startingPosition?: Vec2;
      telegraphGeometry?: Array<{ pos: Vec2; radius: number }>;
      escapePoint?: Vec2;
      firstSafeAtMs?: number;
      resolvedAtMs?: number;
      releasedAtMs?: number;
      releaseReason?:
        | 'resolved'
        | 'telegraph-discarded'
        | 'caster-gone'
        | 'node-changed'
        | 'manual-override'
        | 'flee-priority'
        | 'autocombat-disabled'
        | 'step-back-unequipped'
        | 'player-respawned';
      reenteredAfterSafe?: boolean;
      outcome?: 'success' | 'failure' | 'discarded';
      damageReceived?: number;
      reason?: string;
    }
  | {
      /** Explicit development-harness mutation; never canonical gameplay. */
      kind: 'fast-boss-retry';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      taint: 'NON_CANONICAL_FAST_BOSS_RETRY';
      includeGuardians: boolean;
      playerReset: 'respawn-baseline';
      message: string;
    }
  | {
      /**
       * Class-specific Technique/Sweep adapter contribution, for combat-run
       * diagnostics only. `event` disambiguates the adapter-specific occurrence;
       * damage fields are populated only where the amount is known directly at
       * the application site (never inferred from unrelated damage events).
       */
      kind: 'technique-adapter';
      id: number;
      tick: number;
      serverTime: number;
      nodeId: string;
      player: WorldLogActor;
      adapter: 'apprentice-sweep' | 'slinger-sweep' | 'conduit-formation';
      event:
        | 'apprentice-secondary-target'
        | 'slinger-clip-created'
        | 'slinger-clip-shot'
        | 'slinger-splash-hit'
        | 'conduit-arm'
        | 'conduit-delivery'
        | 'conduit-share-lost'
        | 'conduit-secondary-damage';
      target?: WorldLogActor;
      stacksApplied?: number;
      clipSize?: number;
      splashDamage?: number;
      eligibleSummons?: number;
      formationRoot?: string;
    };

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/** Rounds to 2 decimal places; omits trailing zeros (12 → "12", 12.5 → "12.5"). */
export function formatLogNumber(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/** Payload for recording a world log event (server assigns id, tick, serverTime). */
export type WorldLogEventInput = DistributiveOmit<
  WorldLogEvent,
  'id' | 'tick' | 'serverTime'
>;

export type LogActorSide = 'ally' | 'enemy' | 'neutral';

export interface HeadlinePart {
  text: string;
  side: LogActorSide;
}

export interface FormattedWorldLogEntry {
  kind: WorldLogDisplayKind;
  text: string;
  /** Line 1: what happened + who → whom. */
  headline: string;
  /** Colored segments for line 1 rendering. */
  headlineParts: HeadlinePart[];
  /** Line 2: the numbers associated with the action (omitted when none). */
  detail?: string;
  damageType?: WorldLogDamageType;
  targetName?: string;
  sourceName?: string;
  mitigation?: DamageMitigationBreakdown;
  glancing?: boolean;
}

function actorLabel(actor: WorldLogActor, viewerId: string): string {
  if (actor.id === viewerId) return 'You';
  if (actor.ownerPlayerId === viewerId) return `Your ${actor.name}`;
  return actor.name;
}

function actorOwnedBy(actor: WorldLogActor, viewerId: string): boolean {
  return actor.id === viewerId || actor.ownerPlayerId === viewerId;
}

function actorSide(actor: WorldLogActor, viewerId: string): LogActorSide {
  if (actor.actorType === 'monster') return 'enemy';
  if (actorOwnedBy(actor, viewerId)) return 'ally';
  if (actor.actorType === 'player' || actor.actorType === 'minion') return 'ally';
  return 'neutral';
}

function actorPart(actor: WorldLogActor, viewerId: string): HeadlinePart {
  return { text: actorLabel(actor, viewerId), side: actorSide(actor, viewerId) };
}

function neutral(text: string): HeadlinePart {
  return { text, side: 'neutral' };
}

function formatDeathHeadline(
  player: WorldLogActor,
  cause: DeathCause,
  viewerId: string,
): HeadlinePart[] {
  const who = actorPart(player, viewerId);
  const were = player.id === viewerId ? ' were' : ' was';
  if (cause.kind === 'stance') {
    return [who, neutral(`${were} consumed by ${cause.stanceName}`)];
  }
  if (cause.kind === 'debt' && !cause.killer) {
    return [who, neutral(`${were} defeated by accumulated damage`)];
  }
  const killer = cause.kind === 'debt' ? cause.killer! : cause.killer;
  const label = formatDeathCauseLabel(cause);
  return [
    who,
    neutral(`${were} slain by `),
    { text: killer.monsterName, side: 'enemy' },
    neutral(` (${label})`),
  ];
}

function damageDirection(
  source: WorldLogActor,
  target: WorldLogActor,
  viewerId: string,
): 'damage-out' | 'damage-in' {
  if (actorOwnedBy(target, viewerId)) return 'damage-in';
  return 'damage-out';
}

function formatDamageFallback(
  event: Extract<WorldLogEvent, { kind: 'damage' }>,
  viewerId: string,
  direction: 'damage-out' | 'damage-in',
): string {
  const glancing =
    event.mitigation?.glancing ?? event.glancing ?? false;
  const targetName =
    direction === 'damage-in' ? 'You' : event.target.name;
  const sourceName = event.source.name;

  if (event.mitigation) {
    const m = event.mitigation;
    if (direction === 'damage-in') {
      return `(${formatLogNumber(m.mitigatedTotal)} mitigated − ${formatLogNumber(m.grossDamage)} gross) = −${formatLogNumber(m.hpDamage)} from ${sourceName}${glancing ? ' glancing!' : ''}`;
    }
    return `${targetName} (${formatLogNumber(m.mitigatedTotal)} mitigated − ${formatLogNumber(m.grossDamage)} gross) = −${formatLogNumber(m.hpDamage)}${glancing ? ' glancing!' : ''}`;
  }

  if (direction === 'damage-in') {
    return `Took ${formatLogNumber(event.hpDamage)} damage from ${sourceName}${glancing ? ' glancing!' : ''}`;
  }
  return `${event.target.name} −${formatLogNumber(event.hpDamage)}${glancing ? ' glancing!' : ''}`;
}

function formatDeathText(
  player: WorldLogActor,
  cause: DeathCause,
  viewerId: string,
): string {
  const who = player.id === viewerId ? 'You were' : `${player.name} was`;
  if (cause.kind === 'stance') return `${who} consumed by ${cause.stanceName}`;
  if (cause.kind === 'debt' && !cause.killer) {
    return `${who} defeated by accumulated damage`;
  }
  const killer = cause.kind === 'debt' ? cause.killer! : cause.killer;
  const label = formatDeathCauseLabel(cause);
  return `${who} slain by ${killer.monsterName} (${label})`;
}

interface NumericEffectTerm {
  value: number;
  unit: string;
  label: string;
}

function parseNumericEffectTerms(text: string): NumericEffectTerm[] {
  return text
    .split(/,\s*/)
    .map((raw) => raw.trim())
    .map((raw) => {
      const match = /^([+-])(\d+(?:\.\d+)?)(%?)(.*)$/.exec(raw);
      if (!match) return null;
      const sign = match[1] === '-' ? -1 : 1;
      return {
        value: sign * Number(match[2]),
        unit: match[3],
        label: match[4],
      };
    })
    .filter((term): term is NumericEffectTerm => term !== null);
}

function signedLogNumber(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${formatLogNumber(Math.abs(value))}`;
}

function formatBuffEffectEquations(event: Extract<WorldLogEvent, { kind: 'buff-gain' | 'buff-update' | 'buff-expire' }>): string[] {
  const currentTerms = parseNumericEffectTerms(event.effectText);
  if (currentTerms.length > 0) {
    return currentTerms.map((term) => {
      const perStack = event.stacks > 0 ? term.value / event.stacks : 0;
      return `(${event.stacks} x ${formatLogNumber(Math.abs(perStack))}${term.unit}) = ${signedLogNumber(term.value)}${term.unit}${term.label}`;
    });
  }

  const deltaTerms = event.changeText ? parseNumericEffectTerms(event.changeText) : [];
  if (deltaTerms.length > 0) {
    return deltaTerms.map((term) => {
      const changedStacks = Math.max(1, Math.abs(event.stackDelta));
      const perStack = Math.abs(term.value) / changedStacks;
      const currentValue = perStack * event.stacks * (term.value >= 0 ? 1 : -1);
      return `(${event.stacks} x ${formatLogNumber(perStack)}${term.unit}) = ${signedLogNumber(currentValue)}${term.unit}${term.label}`;
    });
  }

  if (event.effectText !== 'no active modifier') return [event.effectText];
  return [`(${event.stacks} x 0) = 0 active modifier`];
}

export function formatWorldLogEntry(
  event: WorldLogEvent,
  viewerId: string,
): FormattedWorldLogEntry {
  switch (event.kind) {
    case 'damage': {
      const direction = damageDirection(event.source, event.target, viewerId);
      const glancing =
        event.mitigation?.glancing ?? event.glancing ?? false;
      const src = actorLabel(event.source, viewerId);
      const tgt = actorLabel(event.target, viewerId);
      const typeDetail =
        event.damageType !== 'direct' ? ` (${event.damageType})` : '';
      return {
        kind: direction,
        text: formatDamageFallback(event, viewerId, direction),
        headline: `${src} → ${tgt}`,
        headlineParts: [
          actorPart(event.source, viewerId),
          neutral(' → '),
          actorPart(event.target, viewerId),
        ],
        detail: event.mitigation
          ? undefined
          : `−${formatLogNumber(event.hpDamage)}${typeDetail}${glancing ? ' glancing!' : ''}`,
        damageType: event.damageType,
        targetName:
          direction === 'damage-in' ? undefined : event.target.name,
        sourceName: event.source.name,
        mitigation: event.mitigation,
        glancing,
      };
    }
    case 'heal': {
      const who = actorLabel(event.target, viewerId);
      const source = event.source ? actorLabel(event.source, viewerId) : undefined;
      const headlineParts = event.source
        ? [actorPart(event.source, viewerId), neutral(' → '), actorPart(event.target, viewerId)]
        : [actorPart(event.target, viewerId), neutral(' recovered')];
      return {
        kind: 'heal',
        text:
          event.target.id === viewerId
            ? `${source ? `${source} healed you for` : 'Recovered'} ${formatLogNumber(event.amount)} HP`
            : `${event.target.name} recovered ${formatLogNumber(event.amount)} HP`,
        headline: event.source ? `${source} → ${who}` : `${who} recovered`,
        headlineParts,
        detail: `+${formatLogNumber(event.amount)} HP`,
      };
    }
    case 'ward-gain': {
      const who = actorLabel(event.target, viewerId);
      return {
        kind: 'shield',
        text:
          event.target.id === viewerId
            ? `Ward +${formatLogNumber(event.amount)}`
            : `${event.target.name} gained a ${formatLogNumber(event.amount)} ward`,
        headline: `${who} warded`,
        headlineParts: [actorPart(event.target, viewerId), neutral(' warded')],
        detail: `+${formatLogNumber(event.amount)}`,
      };
    }
    case 'absorb': {
      const who = actorLabel(event.target, viewerId);
      const src = event.source ? actorLabel(event.source, viewerId) : 'Something';
      return {
        kind: 'shield',
        text:
          event.target.id === viewerId
            ? `Absorbed ${formatLogNumber(event.amount)} from ${src}`
            : `${event.target.name} absorbed ${formatLogNumber(event.amount)}`,
        headline: `${src} → ${who} (absorbed)`,
        headlineParts: event.source
          ? [
              actorPart(event.source, viewerId),
              neutral(' → '),
              actorPart(event.target, viewerId),
              neutral(' (absorbed)'),
            ]
          : [neutral('Something → '), actorPart(event.target, viewerId), neutral(' (absorbed)')],
        detail: `${formatLogNumber(event.amount)} absorbed`,
      };
    }
    case 'buff-gain':
    case 'buff-update':
    case 'buff-expire': {
      const who = actorLabel(event.target, viewerId);
      const action = event.stackDelta >= 0 ? ' gained ' : ' lost ';
      const details = [`${action.trim()} ${event.label}`, ...formatBuffEffectEquations(event)];
      if (event.durationPct >= 0) details.push(`${formatLogNumber(event.durationPct)}% remaining`);
      return {
        kind: 'buff',
        text: `${event.sourceName} → ${who}`,
        headline: `${event.sourceName} → ${who}`,
        headlineParts: [
          { text: event.sourceName, side: event.sourceSide },
          neutral(' → '),
          actorPart(event.target, viewerId),
        ],
        detail: details.join('   '),
      };
    }
    case 'kill': {
      const killer = actorLabel(event.killer, viewerId);
      const detailParts: string[] = [];
      if (event.essenceGained) {
        detailParts.push(
          // ESSENCE_LABELS is the single authority for the player-facing aspect
          // name; the colour key is internal (persistence/protocol/recipes only).
          `+${formatLogNumber(event.essenceGained)}${event.essenceType ? ` ${essenceLabel(event.essenceType)}` : ''} essence`,
        );
      }
      if (event.biomeXpGained) detailParts.push(`+${formatLogNumber(event.biomeXpGained)} XP`);
      return {
        kind: 'kill',
        text:
          actorOwnedBy(event.killer, viewerId)
            ? `${event.victim.name} defeated`
            : `${event.killer.name} defeated ${event.victim.name}`,
        headline: `${killer} defeated ${event.victim.name}`,
        headlineParts: [
          actorPart(event.killer, viewerId),
          neutral(' defeated '),
          actorPart(event.victim, viewerId),
        ],
        detail: detailParts.length > 0 ? detailParts.join('   ') : undefined,
      };
    }
    case 'dodge': {
      const tgt = actorLabel(event.target, viewerId);
      const atk = actorLabel(event.attacker, viewerId);
      return {
        kind: 'dodge',
        text: `${event.target.name} dodged ${event.attacker.name}'s attack`,
        headline: `${tgt} dodged ${atk}`,
        headlineParts: [
          actorPart(event.target, viewerId),
          neutral(' dodged '),
          actorPart(event.attacker, viewerId),
        ],
      };
    }
    case 'player-death': {
      const deathText = formatDeathText(event.player, event.cause, viewerId);
      return {
        kind: 'death',
        text: deathText,
        headline: deathText,
        headlineParts: formatDeathHeadline(event.player, event.cause, viewerId),
      };
    }
    case 'biome-level-up': {
      const who = actorLabel(event.player, viewerId);
      const recipes =
        event.unlockedRecipeIds.length > 0
          ? `   ${event.unlockedRecipeIds.length} recipe(s) unlocked`
          : '';
      return {
        kind: 'biome-level',
        text: `${who} reached ${event.biomeName} Lv ${event.newLevel}`,
        headline: `${who} · ${event.biomeName}`,
        headlineParts: [
          actorPart(event.player, viewerId),
          neutral(` · ${event.biomeName}`),
        ],
        detail: `Lv ${event.prevLevel} → ${event.newLevel}${recipes}`,
      };
    }
    case 'player-tier-up': {
      const who = actorLabel(event.player, viewerId);
      return {
        kind: 'ascension',
        text: `${who} ascended to Tier ${event.newTier}!`,
        headline: `${who} ascended`,
        headlineParts: [actorPart(event.player, viewerId), neutral(' ascended')],
        detail: `Tier ${event.prevTier} → ${event.newTier}`,
      };
    }
    case 'overlord-slain': {
      const text = 'An Overlord has been slain!';
      return {
        kind: 'info',
        text,
        headline: text,
        headlineParts: [neutral(text)],
      };
    }
    case 'dungeon-message': {
      return {
        kind: 'info',
        text: event.message,
        headline: event.message,
        headlineParts: [neutral(event.message)],
      };
    }
    case 'ability-activation': {
      const who = actorLabel(event.player, viewerId);
      const removed = event.removedEffects?.length
        ? `; removed ${event.removedEffects.map((effect) => `${effect.effectId} x${effect.stacks}`).join(', ')}`
        : '';
      const text = `${who} activated ${event.abilityId}${removed}`;
      return { kind: 'info', text, headline: text, headlineParts: [neutral(text)] };
    }
    case 'hazard-contact': {
      const who = actorLabel(event.player, viewerId);
      const text = event.phase === 'enter'
        ? `${who} entered ${event.sourceName}`
        : `${who} left ${event.sourceName} after ${formatLogNumber(event.durationMs ?? 0)}ms (${formatLogNumber(event.damageReceived ?? 0)} damage)`;
      return { kind: 'info', text, headline: text, headlineParts: [neutral(text)] };
    }
    case 'hazard-escape': {
      const who = actorLabel(event.player, viewerId);
      const text = event.phase === 'attempt'
        ? `${who} attempted to escape a persistent hazard`
        : `${who} hazard escape: ${event.outcome ?? 'unknown'}`;
      return { kind: 'info', text, headline: text, headlineParts: [neutral(text)] };
    }
    case 'telegraph-dodge': {
      const who = actorLabel(event.player, viewerId);
      const text = event.phase === 'activation'
        ? `${who} activated Step Back`
        : event.phase === 'attempt'
          ? `${who} attempted a telegraph dodge`
          : event.phase === 'safe'
            ? `${who} moved outside the telegraph and held Step Back ownership`
            : event.phase === 'reenter'
              ? `${who} re-entered the telegraph before it resolved`
              : event.phase === 'resolution'
                ? `${who}'s Step Back telegraph resolved`
                : event.phase === 'release'
                  ? `${who} released Step Back ownership (${event.releaseReason ?? 'unknown'})`
          : `${who} telegraph dodge: ${event.outcome ?? 'unknown'}${event.damageReceived ? ` (${formatLogNumber(event.damageReceived)} damage)` : ''}`;
      return { kind: 'info', text, headline: text, headlineParts: [neutral(text)] };
    }
    case 'fast-boss-retry': {
      const who = actorLabel(event.player, viewerId);
      const text = `${event.taint}: ${who} prepared a fast boss retry`;
      return { kind: 'info', text, headline: text, headlineParts: [neutral(text)] };
    }
    case 'technique-adapter': {
      const who = actorLabel(event.player, viewerId);
      const text = `${who} technique adapter: ${event.adapter} (${event.event})`;
      return { kind: 'info', text, headline: text, headlineParts: [neutral(text)] };
    }
    default:
      return {
        kind: 'info',
        text: 'Unknown event',
        headline: 'Unknown event',
        headlineParts: [neutral('Unknown event')],
      };
  }
}
