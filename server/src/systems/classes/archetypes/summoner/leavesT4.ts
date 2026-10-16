/**
 * The Conduit's nine T4 leaves (T4-CONDUIT; bible §7.7). A leaf is a Passive Tree pick, so the
 * runtime reads `usesSkills.unlockedSkills` (`hasLeaf`). The question every leaf answers is how a
 * summon dies, comes back, or survives:
 *
 *   Swarm  Burst (explodes), Grand Entrance (rebuilt summons stun), Devour (lives long, steals HP)
 *   Pack   Avenge (the rest strike the killer), Fall Back (hurt summons retreat), Rally (Pack Strike mends)
 *   Elite  Final Command (a dying elite's extra, doubled), Last Stand (holds at 1 HP), Shared Burden
 *
 * Deaths are seen by the summoner tick (`collectDeaths`), so the death-keyed leaves run from
 * `onSummonFallen`; the struck-keyed ones (Last Stand, Shared Burden) from `minionHitsT2.ts`.
 * Every number is in `CONDUIT_LEAF_TUNING` (PLACEHOLDERS). Stand-ins are listed in the report.
 */
import {
  applyStatusEffect,
  CONDUIT_DISCIPLINE_TUNING,
  CONDUIT_LEAF_TUNING as LEAF,
  CONDUIT_SPECIALIZATION_TUNING as SPEC,
  getFlag,
  getResource,
  getStatusEffect,
  removeStatusEffect,
  setFlag,
  setResource,
  type Vec2,
} from '@mmo-idle/shared';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyPlayerAoe, applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { attackNow, registerCombatListener } from '../../../combat/engine/combatPipeline';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { minionCanSwing } from '../../../combat/status/minionAfflictions';
import { applyStun } from '../../../combat/status/stun';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { disciplineOf } from './disciplines';
import { runFormationAttack } from './formationAttack';
import { countConduitMechanic } from './mechanicLog';
import { swing } from './summonPieces';
import { livingMinions, pieceOfSlot } from './summonPiecesT2';
import { BORN_AT, fireSupportAbility } from './summonPiecesT3';
import { gravecallerRaises } from './summonPiecesT4';
import { fightStartedAt, HIBERNATE_EFFECT_ID, inFight, specializationOf } from './t3Shared';
import { FALL_BACK_EFFECT_ID, hasLeaf, LAST_STAND_EFFECT_ID, TICK_NOW } from './t4Shared';

const BURST_DONE = 'burst.done';
const LAST_STAND_FIGHT = 'laststand.fight';
const LAST_STAND_UNTIL = 'laststand.until';

function formationFocus(world: World, owner: PlayerEntity): MonsterEntity | undefined {
  const id = owner.summonsMinions?.formationTargetId;
  const target = id ? world.getMonsterEntity(id) : undefined;
  return target && target.hasHealth.hp > 0 ? target : undefined;
}

// ── A summon dies ───────────────────────────────────────────────────────────

/** The enemy that killed `dead`: the nearest one that was fighting it, else the formation's focus. */
function killerOf(world: World, owner: PlayerEntity, dead: MinionEntity): MonsterEntity | undefined {
  let best: MonsterEntity | undefined;
  let bestSq = Infinity;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasHealth.hp <= 0 || monster.hasPosition.nodeId !== dead.hasPosition.nodeId) continue;
    if (monster.hasAggroTarget.targetId !== dead.isMinion.id) continue;
    const dx = monster.hasPosition.current.x - dead.hasPosition.current.x;
    const dy = monster.hasPosition.current.y - dead.hasPosition.current.y;
    if (dx * dx + dy * dy < bestSq) { bestSq = dx * dx + dy * dy; best = monster; }
  }
  return best ?? formationFocus(world, owner);
}

/** Burst: the summon explodes where it stood. Once only: a burn-out explosion does not repeat on the death it causes. */
function explode(world: World, owner: PlayerEntity, minion: MinionEntity): void {
  if (getFlag(minion.tracksCombat, BURST_DONE)) return;
  setFlag(minion.tracksCombat, BURST_DONE, true);
  applyPlayerAoe(world, owner, minion.hasPosition.current, LEAF.burstRadius, minion.dealsDamage.attack * LEAF.burstMult, undefined, 'summon');
}

/**
 * Final Command (§7.7): a dying elite uses its extra one last time at double strength. The extra is
 * what Elite gave it: a support deepens its job, everyone else splashes (Colossus: shakes the ground).
 */
function finalCommand(world: World, owner: PlayerEntity, dead: MinionEntity): void {
  const piece = pieceOfSlot(dead.isMinion.slotId);
  const aim = formationFocus(world, owner);
  if (!piece || !aim) return;
  const strength = LEAF.finalCommandMult;
  if (piece.family === 'support') {
    fireSupportAbility(world, owner, dead, piece, aim, strength);
    return;
  }
  const colossus = specializationOf(owner) === 'conduit-colossus';
  const radius = (piece.params.splashRadius ?? 0) > 0 ? piece.params.splashRadius! : colossus ? SPEC.colossusShockRadius : CONDUIT_DISCIPLINE_TUNING.eliteSplashRadius;
  const share = (piece.params.splashShare ?? 0) > 0 ? piece.params.splashShare! : colossus ? SPEC.colossusShockShare : CONDUIT_DISCIPLINE_TUNING.eliteSplashShare;
  const victims = [aim, ...playerAoeTargets(world, owner, aim.hasPosition.current, radius, aim.isMonster.id)];
  applyPlayerAoeTo(world, owner, victims, dead.dealsDamage.attack * share * strength, 'summon', {}, {});
}

/**
 * Everything a fallen summon sets off, called by the summoner tick right before the body is
 * despawned (its position and stats are still readable): Burst, Avenge, Final Command, Requiem and
 * the Gravecaller's husk.
 */
export function onSummonFallen(world: World, owner: PlayerEntity, dead: MinionEntity, now: number): void {
  const piece = pieceOfSlot(dead.isMinion.slotId);
  if (!piece) return; // a Soul's body is a trophy; none of these lines read it.
  const passives = owner.usesSkills.passives;

  if (hasLeaf(owner, 'conduit-burst')) explode(world, owner, dead);

  // Avenge: the rest strike its killer together.
  if (hasLeaf(owner, 'conduit-avenge')) {
    const killer = killerOf(world, owner, dead);
    if (killer) {
      for (const ally of livingMinions(world, owner)) {
        if (killer.hasHealth.hp <= 0) break;
        if (minionCanSwing(ally)) runFormationAttack(world, owner, ally, killer, now, { avenge: LEAF.avengeMult });
      }
    }
  }

  if (hasLeaf(owner, 'conduit-final-command') && disciplineOf(owner) === 'conduit-elite') finalCommand(world, owner, dead);

  // Requiem (Graveyard charm): the others heal for part of its max HP.
  const requiem = passives['conduit.requiem-pct'] ?? 0;
  if (requiem > 0) {
    for (const ally of livingMinions(world, owner)) {
      applyHealToMinion(ally, owner.isPlayer.id, dead.hasHealth.maxHp * requiem, world);
    }
  }

  gravecallerRaises(owner, world, dead, now);
}

/** A summon is rebuilt: Grand Entrance stuns the enemies around it as it lands. */
export function onSummonRebuilt(world: World, owner: PlayerEntity, minion: MinionEntity): void {
  if (!hasLeaf(owner, 'conduit-grand-entrance')) return;
  for (const enemy of playerAoeTargets(world, owner, minion.hasPosition.current, LEAF.grandEntranceRadius)) {
    if (enemy.hasHealth.hp > 0 && !monsterIgnoresControl(enemy)) applyStun(enemy.tracksCombat, LEAF.grandEntranceStunMs, minion.isMinion.id);
  }
}

// ── A summon is struck (called from `onMinionStruckT2`) ─────────────────────

/** Last Stand: an elite that would die holds at 1 HP, once per fight. True when it was saved. */
export function lastStandSaves(world: World, owner: PlayerEntity, minion: MinionEntity): boolean {
  if (minion.hasHealth.hp > 0 || !hasLeaf(owner, 'conduit-last-stand') || disciplineOf(owner) !== 'conduit-elite') return false;
  if (!pieceOfSlot(minion.isMinion.slotId)) return false;
  const cs = minion.tracksCombat;
  const fight = fightStartedAt(owner) > 0 ? fightStartedAt(owner) : -1;
  if (getResource(cs, LAST_STAND_FIGHT) === fight) return false;
  setResource(cs, LAST_STAND_FIGHT, fight);
  const now = getResource(owner.tracksCombat, TICK_NOW);
  setResource(cs, LAST_STAND_UNTIL, now + LEAF.lastStandMs);
  applyStatusEffect(cs, {
    id: LAST_STAND_EFFECT_ID, maxStacks: 1, remainingMs: LEAF.lastStandMs, refreshable: false, sourceId: minion.isMinion.id,
    data: { totalMs: LEAF.lastStandMs },
  });
  minion.hasHealth.hp = 1;
  markSliceDirty(world, minion, 'hasHealth');
  countConduitMechanic(owner, 'last-stand', now);
  return true;
}

/** While Last Stand holds, a further hit cannot take the last point. True when this strike was held. */
export function holdLastStand(world: World, minion: MinionEntity): boolean {
  if (!getStatusEffect(minion.tracksCombat, LAST_STAND_EFFECT_ID)) return false;
  if (minion.hasHealth.hp < 1) {
    minion.hasHealth.hp = 1;
    markSliceDirty(world, minion, 'hasHealth');
  }
  return true;
}

// ── Fall Back: a hurt summon retreats behind the tanks ──────────────────────

/** Where a retreating summon goes: behind the nearest tank, away from the fight. Null when it is not retreating. */
export function fallBackSpot(world: World, owner: PlayerEntity, minion: MinionEntity): Vec2 | null {
  if (!getStatusEffect(minion.tracksCombat, FALL_BACK_EFFECT_ID)) return null;
  const threat = formationFocus(world, owner)?.hasPosition.current;
  const home = owner.hasPosition.current;
  if (!threat) return home;
  let anchor: Vec2 = home;
  let bestSq = Infinity;
  for (const ally of livingMinions(world, owner)) {
    if (ally === minion || pieceOfSlot(ally.isMinion.slotId)?.family !== 'tank') continue;
    const dx = ally.hasPosition.current.x - threat.x;
    const dy = ally.hasPosition.current.y - threat.y;
    if (dx * dx + dy * dy < bestSq) { bestSq = dx * dx + dy * dy; anchor = ally.hasPosition.current; }
  }
  const dx = anchor.x - threat.x;
  const dy = anchor.y - threat.y;
  const norm = Math.hypot(dx, dy) || 1;
  return { x: anchor.x + (dx / norm) * LEAF.fallBackBehind, y: anchor.y + (dy / norm) * LEAF.fallBackBehind };
}

// ── Listeners ───────────────────────────────────────────────────────────────

export function registerLeavesT4(): void {
  // Devour (Swarm leaf): a summon that has lived a while steals back health from what it hits.
  registerCombatListener('afterHit', (ctx, world) => {
    const hit = swing(ctx, world);
    if (!hit || ctx.damage <= 0 || !hasLeaf(hit.owner, 'conduit-devour')) return;
    const born = getResource(hit.minion.tracksCombat, BORN_AT);
    if (born <= 0 || attackNow(ctx) - born < LEAF.devourAfterMs) return;
    applyHealToMinion(hit.minion, hit.owner.isPlayer.id, ctx.damage * LEAF.devourShare, world);
    countConduitMechanic(hit.owner, 'devour', attackNow(ctx));
  });
}

// ── Per tick ────────────────────────────────────────────────────────────────

export function updateLeavesT4(world: World, owner: PlayerEntity, dt: number, now: number): void {
  const fighting = inFight(owner);
  const burst = hasLeaf(owner, 'conduit-burst');
  const fallBack = hasLeaf(owner, 'conduit-fall-back');
  const burnBright = specializationOf(owner) === 'conduit-burn-bright';
  const fightStart = fightStartedAt(owner);

  for (const minion of livingMinions(world, owner)) {
    const cs = minion.tracksCombat;
    if (!pieceOfSlot(minion.isMinion.slotId)) continue;

    // Last Stand ends on its clock, and until then the last point holds against damage over time too.
    if (getStatusEffect(cs, LAST_STAND_EFFECT_ID)) {
      if (now >= getResource(cs, LAST_STAND_UNTIL)) removeStatusEffect(cs, LAST_STAND_EFFECT_ID);
      else holdLastStand(world, minion);
    }

    // Burst with Burn Bright: a wave rebuilt in a fight burns out and blows up when its haste ends.
    if (burst && burnBright && fighting && !getFlag(cs, BURST_DONE)) {
      const born = getResource(cs, BORN_AT);
      if (born >= fightStart && now - born >= SPEC.burnBrightMs) {
        explode(world, owner, minion);
        minion.hasHealth.hp = 0;
        markSliceDirty(world, minion, 'hasHealth');
        continue;
      }
    }

    // Fall Back: under a threshold a summon retreats behind the tanks, mends, and rejoins.
    const retreating = getStatusEffect(cs, FALL_BACK_EFFECT_ID);
    if (!fallBack) {
      if (retreating) removeStatusEffect(cs, FALL_BACK_EFFECT_ID);
    } else if (retreating) {
      const fraction = minion.hasHealth.hp / minion.hasHealth.maxHp;
      if (!fighting || fraction >= LEAF.fallBackUntil) removeStatusEffect(cs, FALL_BACK_EFFECT_ID);
      else applyHealToMinion(minion, owner.isPlayer.id, minion.hasHealth.maxHp * LEAF.fallBackRegenPctPerSec * (dt / 1_000), world);
    } else if (fighting && minion.hasHealth.hp < minion.hasHealth.maxHp * LEAF.fallBackBelow
      && !getStatusEffect(cs, HIBERNATE_EFFECT_ID) && !getStatusEffect(cs, LAST_STAND_EFFECT_ID)) {
      applyStatusEffect(cs, { id: FALL_BACK_EFFECT_ID, maxStacks: 1, remainingMs: -1, refreshable: false, sourceId: minion.isMinion.id, data: {} });
    }
  }
}
