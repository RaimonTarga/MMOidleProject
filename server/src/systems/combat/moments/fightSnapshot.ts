/**
 * One player's fight as the moments read it (class-first build plan §3.7, F6): every fact the
 * moments registry's states and edge events need, computed once per player per tick. The
 * auto-combat derivation (`updateRuneDerivedConfig`) refreshes it at the top of each tick,
 * after heat management, and builds its rule context from it, so the free standing orders
 * and the class systems read the same facts. These are the rune engine's measurements,
 * moved here unchanged.
 */
import {
  isHarmfulPlayerStatusEffect,
  isMonsterDotStatusEffectId,
  MONSTER_DATABASE,
  posHitboxFromEntity,
  reachGap,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { playerDotAtMaxStacks } from '../damage/dotInventory';
import { bossPatternEscaping } from '../ai/bossPatterns';
import { isPlayerActivelyInCombat, isPlayerInCombat } from '../ai/engagement';
import { guardableThreatsFor, isMonsterThreatening } from '../ai/guardableThreats';
import { castedBuffCastEndsAt, chargedCastEndsAt, monsterAbilityCastEndsAt } from '../engine/monsterMechanics';
import { heatEngagementTargets, heatManagementState } from '../ai/heatManagement';
import { telegraphsContainingPlayer } from '../ai/telegraphEvasion';
import { isPlayerControlled } from '../status/playerHardControl';
import { isConcealedEntity, isInvulnerableMonster } from '../invulnerability';
import { FROZEN_EFFECT } from '../status/frost';

export interface FightSnapshot {
  hpPct: number;
  /** The player's attack target, if any. */
  targetId?: string;
  targetHpPct?: number;
  /** In a fight, or inside the post-fight grace window. */
  inCombat: boolean;
  /** Something is on the player right now (narrower than `inCombat`). */
  activelyEngaged: boolean;
  /** A Conduit with at most half its summons standing. */
  formationBroken: boolean;
  inParty: boolean;
  /** Enemies whose aggro is on the player. */
  aggroCount: number;
  debuffed: boolean;
  /** Distinct harmful statuses on the player. */
  debuffCount: number;
  /** Monster DoT stacks on the player. */
  dotStacks: number;
  controlled: boolean;
  /** A melee enemy on the player is within its own reach of them. */
  enemyInContact: boolean;
  /** An enemy fighting the player (or its summons) is winding up an answerable attack. */
  enemyCharging: boolean;
  /** An enemy on the player is casting anything (an attack, a buff, an ability). */
  enemyCasting: boolean;
  /** An answerable wind-up is aimed at the player itself. */
  windupAtMe: boolean;
  /** An enemy on the player charges or runs at it and hasn't reached it yet. */
  fastClosing: boolean;
  /** The hostile ground telegraphs the player stands in. */
  telegraphs: ReturnType<typeof telegraphsContainingPlayer>;
  empoweredImminent: boolean;
  targetIsElite: boolean;
  targetAtMaxDotStacks: boolean;
  targetShielded: boolean;
  targetPlated: boolean;
  /** A boss fighting the player is getting away (flee, dash, burrow). */
  targetEscaping: boolean;
  moving: boolean;
  traveling: boolean;
  // ── Tier 2 moments (class-first build plan §6) ──
  /** An enemy on the player is in the middle of a charge at it. */
  chargingAtMe: boolean;
  /** An enemy on the player is burrowed or otherwise hidden and moving toward it. */
  burrowAtMe: boolean;
  /** An enemy on the player hits from range (its reach is beyond melee contact) and is not touching. */
  rangedAttacker: boolean;
  /** The player's target is frozen or brittle. */
  targetFrozen: boolean;
  /** The player's target has burrowed, dived or vanished out of reach. */
  targetOutOfReach: boolean;
  /** A party ally in this node stands under a telegraph or is low on HP. */
  allyThreatened: boolean;
}

/**
 * Count enemies aggroed onto this player and whether any is winding up a cast the player
 * is meant to ANSWER. Deliberately the shared guardable-threat query rather than the
 * charged-attack state alone: a boss mid `MonsterAbility` area-hit is every bit the threat
 * a Power Shot is, and utility casts stay excluded.
 */
/** A closing enemy this much faster than the player counts as fast. PLACEHOLDER. */
const FAST_CLOSING_SPEED_RATIO = 1.25;

function aggroStats(
  world: World,
  player: PlayerEntity,
  now: number,
): { count: number; charging: boolean; contact: boolean; casting: boolean; windupAtMe: boolean; fastClosing: boolean; chargingAtMe: boolean; burrowAtMe: boolean; rangedAttacker: boolean } {
  let count = 0;
  let charging = false;
  let contact = false;
  let casting = false;
  let windupAtMe = false;
  let fastClosing = false;
  let chargingAtMe = false;
  let burrowAtMe = false;
  let rangedAttacker = false;
  const playerBox = posHitboxFromEntity(player);
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === 'player' &&
      monster.hasAggroTarget.targetId === player.isPlayer.id
    ) {
      count++;
      if (!charging && isMonsterThreatening(world, monster, now)) charging = true;
      if (!windupAtMe && guardableThreatsFor(world, monster, now).some((t) => t.targetId === player.isPlayer.id)) windupAtMe = true;
      if (!casting) {
        casting = chargedCastEndsAt(monster) > now || castedBuffCastEndsAt(monster) > now || monsterAbilityCastEndsAt(monster) > now;
      }
      const touching = inMeleeContact(player, playerBox, monster);
      if (!contact) contact = touching;
      if (!chargingAtMe && (monster.controlsMonster.chargeRemainingMs ?? 0) > 0) chargingAtMe = true;
      if (!burrowAtMe && monster.isConcealed !== undefined && monster.isMoving !== undefined) burrowAtMe = true;
      if (!rangedAttacker && !touching && (monster.performsAttack?.attackRange ?? 0) > MELEE_CONTACT_MAX_REACH) rangedAttacker = true;
      if (!fastClosing && !touching && monster.isMoving !== undefined) {
        fastClosing = (monster.controlsMonster.chargeRemainingMs ?? 0) > 0
          || monster.hasPosition.speed >= player.hasPosition.speed * FAST_CLOSING_SPEED_RATIO;
      }
    } else if (
      // A Conduit's formation is "you": a slam wound up on one of its summons is the
      // cast a rule is meant to answer.
      !charging &&
      monster.hasAggroTarget.targetKind === 'minion' &&
      world.getMinionEntity(monster.hasAggroTarget.targetId)?.isMinion.ownerPlayerId === player.isPlayer.id &&
      isMonsterThreatening(world, monster, now)
    ) {
      charging = true;
    }
  }
  return { count, charging, contact, casting, windupAtMe, fastClosing, chargingAtMe, burrowAtMe, rangedAttacker };
}

/**
 * Melee monsters reach at most 72px and ranged ones at least 180px, so anything reaching
 * further than this is a shooter, not something "in contact".
 */
const MELEE_CONTACT_MAX_REACH = 100;
/** Slack over the monster's own reach, so contact reads a step before the swing. */
const MELEE_CONTACT_SLACK_PX = 10;

function inMeleeContact(
  player: PlayerEntity,
  playerBox: ReturnType<typeof posHitboxFromEntity>,
  monster: MonsterEntity,
): boolean {
  const reach = monster.performsAttack?.attackRange;
  if (reach === undefined || reach > MELEE_CONTACT_MAX_REACH) return false;
  if (monster.hasHealth.hp <= 0 || monster.hasPosition.nodeId !== player.hasPosition.nodeId) return false;
  return reachGap(playerBox, posHitboxFromEntity(monster)) <= reach + MELEE_CONTACT_SLACK_PX;
}

/** Summoner with at most half of its target summon count alive in its node. */
function formationBroken(world: World, player: PlayerEntity): boolean {
  const summons = player.summonsMinions;
  if (!summons || summons.targetCount <= 0) return false;
  const nodeId = player.hasPosition.nodeId;
  let living = 0;
  for (const id of summons.minionIds) {
    const minion = world.getMinionEntity(id);
    if (minion && minion.isMinion.ownerPlayerId === player.isPlayer.id
      && minion.hasHealth.hp > 0 && minion.hasPosition.nodeId === nodeId) living++;
  }
  return living * 2 <= summons.targetCount;
}

/** A boss fighting this player is getting away (flee, dash) or coming for them underground. */
function bossEscapingFrom(world: World, player: PlayerEntity): boolean {
  for (const monster of world.patternMonsters) {
    if (monster.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
    if (monster.runsBossPattern?.targetId !== player.isPlayer.id) continue;
    if (bossPatternEscaping(monster)) return true;
  }
  return false;
}

/** The target is frozen, or carries a brittle stack (the freeze's shatter window). */
function hasFrozenOrBrittle(monster: MonsterEntity): boolean {
  return monster.tracksCombat.statusEffects.some((e) => e.remainingMs !== 0 && (e.id === FROZEN_EFFECT || e.id === 'brittle'));
}

/** Another player of this party, in this node, stands under a telegraph or is low on HP. */
function allyThreatened(world: World, player: PlayerEntity, now: number): boolean {
  const party = player.inParty;
  if (!party) return false;
  const ids = new Set(party.members.map((member) => member.id));
  for (const ally of world.livePlayers) {
    if (ally === player || !ids.has(ally.isPlayer.id) || ally.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
    if (ally.hasHealth.hp / Math.max(1, ally.hasHealth.maxHp) < ALLY_LOW_HP) return true;
    if (telegraphsContainingPlayer(world, ally, now).length > 0) return true;
  }
  return false;
}

/** An ally this low on HP counts as threatened. PLACEHOLDER. */
const ALLY_LOW_HP = 0.3;

function isElite(monster: MonsterEntity | undefined): boolean {
  if (!monster) return false;
  if (monster.isMonster.isBoss) return true;
  return MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.elite === true;
}

function computeFightSnapshot(world: World, player: PlayerEntity, now: number): FightSnapshot {
  const { count, charging, contact, casting, windupAtMe, fastClosing, chargingAtMe, burrowAtMe, rangedAttacker } = aggroStats(world, player, now);
  const targetId = player.hasAttackTarget?.targetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  const heatHolding = heatManagementState(player) === 'requested' && heatEngagementTargets(world, player).size > 0;
  const harmful = player.tracksCombat.statusEffects.filter(
    (e) => e.stacks > 0 && isHarmfulPlayerStatusEffect(e.id, e.data),
  );
  let dotStacks = 0;
  for (const effect of player.tracksCombat.statusEffects) {
    if (isMonsterDotStatusEffectId(effect.id)) dotStacks += effect.stacks;
  }
  return {
    hpPct: player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
    targetId,
    targetHpPct: target ? target.hasHealth.hp / Math.max(1, target.hasHealth.maxHp) : undefined,
    inCombat: count > 0 || isPlayerInCombat(player, now) || heatHolding,
    activelyEngaged: isPlayerActivelyInCombat(world, player) || heatHolding,
    formationBroken: formationBroken(world, player),
    inParty: player.inParty !== undefined,
    aggroCount: count,
    debuffed: harmful.length > 0,
    debuffCount: new Set(harmful.map((e) => e.id)).size,
    dotStacks,
    controlled: isPlayerControlled(player),
    enemyInContact: contact,
    enemyCharging: charging,
    enemyCasting: casting,
    windupAtMe,
    fastClosing,
    telegraphs: telegraphsContainingPlayer(world, player, now),
    // The shared empowered-attack flag is armed: the next attack is empowered.
    empoweredImminent: player.hasEmpoweredAttack !== undefined,
    targetIsElite: isElite(target),
    // Through the DoT inventory rather than any one effect id, so a new DoT family
    // drives it the moment it registers.
    targetAtMaxDotStacks: target ? playerDotAtMaxStacks(world, player, target) : false,
    targetShielded: (target?.hasStatus.enemyBarrier?.amount ?? 0) > 0,
    targetPlated: (target?.mitigatesDamage.plating ?? 0) > 0,
    targetEscaping: bossEscapingFrom(world, player),
    chargingAtMe,
    burrowAtMe,
    rangedAttacker,
    targetFrozen: target ? hasFrozenOrBrittle(target) : false,
    targetOutOfReach: target ? isConcealedEntity(target) || isInvulnerableMonster(target) : false,
    allyThreatened: allyThreatened(world, player, now),
    moving: player.isMoving !== undefined,
    traveling:
      player.hasAutoTraversePath !== undefined &&
      player.hasAutoTraversePath.targetNodeId !== player.hasPosition.nodeId &&
      player.hasAutoTraversePath.remainingPath.length > 0,
  };
}

const snapshots = new WeakMap<PlayerEntity, { tick: number; snapshot: FightSnapshot }>();

/** This tick's snapshot, computed on first ask (a test, or a reader before the refresh). */
export function fightSnapshotFor(world: World, player: PlayerEntity, now: number): FightSnapshot {
  const cached = snapshots.get(player);
  if (cached && cached.tick === world.tickCounter) return cached.snapshot;
  const snapshot = computeFightSnapshot(world, player, now);
  snapshots.set(player, { tick: world.tickCounter, snapshot });
  return snapshot;
}

/**
 * Recompute this tick's snapshot and hand back the previous one, so the registry can fire
 * the edge events (a wind-up starting, a control landing, an enemy joining...).
 */
export function refreshFightSnapshot(
  world: World,
  player: PlayerEntity,
  now: number,
): { snapshot: FightSnapshot; previous: FightSnapshot | undefined } {
  const previous = snapshots.get(player)?.snapshot;
  const snapshot = computeFightSnapshot(world, player, now);
  snapshots.set(player, { tick: world.tickCounter, snapshot });
  return { snapshot, previous };
}

/** Whether a monster is gone or down (the player's last target died). */
export function monsterGone(world: World, id: string): boolean {
  const monster = world.getMonsterEntity(id);
  return !monster || monster.hasHealth.hp <= 0;
}
