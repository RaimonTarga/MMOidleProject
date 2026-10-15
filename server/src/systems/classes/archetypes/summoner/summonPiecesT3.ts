/**
 * The Conduit's tier 3 (T3-CONDUIT; bible §7.6, §7.9, §7.16): the seven T3 summon types' jobs, the
 * nine specializations' rules, and the T3 gear lines (Icebound, Berserk, Permafrost, Hibernate,
 * Fireproof, Emberglow). Same pattern as `summonPiecesT2.ts`: a summon attacks through the owner's
 * pipeline, so hit-keyed jobs are listeners keyed on the hitting slot's piece, and timed jobs run
 * from `updateConduitT3` on the summoner tick. Stat-shaped rules (Legion, Colossus) live in
 * `profile.ts`; the two new Souls in `souls.ts`.
 *
 * Every number is a kit `params` placeholder, `CONDUIT_SPECIALIZATION_TUNING`, or a constant here
 * marked PLACEHOLDER. Stand-ins are listed in the T3-CONDUIT report.
 */
import {
  ABILITY_SLOW_EFFECT_ID,
  applyStatusEffect,
  CONDUIT_SPECIALIZATION_TUNING as SPEC,
  FROST_RAMP_EFFECT_ID,
  FROZEN_STATUS_ID,
  getFlag,
  getResource,
  getStatusEffect,
  LAIR_DRAG_ROOT_EFFECT_ID,
  removeStatusEffect,
  setFlag,
  setResource,
  type ConduitPiece,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { CONDUIT_POISON_ID } from '../../../combat/damage/bleedIds';
import { attackNow, registerCombatListener } from '../../../combat/engine/combatPipeline';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyStun } from '../../../combat/status/stun';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { applyFramePlatingShred } from '../../shared/frameLoop';
import { applyTickDot } from '../../shared/tickDot';
import { fightHeatMult } from './souls';
import { PIECES, swing } from './summonPieces';
import {
  coatBark, jobMult, livingMinions, pieceOfSlot, RANGED_ENEMY_REACH, setSupportEchoHook, supportHeal,
} from './summonPiecesT2';
import {
  BURN_BRIGHT_EFFECT_ID, fightSeconds, HIBERNATE_EFFECT_ID, HORN_EFFECT_ID, HUNT_EFFECT_ID, inFight, INFESTED_FLAG,
  isHeldOrSlowed, SPORE_EFFECT_ID, specializationOf, updateFightClock,
} from './t3Shared';

/** Hibernate (§7.16): under this share of its HP a summon may encase itself; it regenerates meanwhile. PLACEHOLDERS. */
const HIBERNATE_BELOW = 0.25;
const HIBERNATE_REGEN_PCT_PER_SEC = 0.1;
/** Each summon must wait this long before it can hibernate again. */
const HIBERNATE_COOLDOWN_MS = 20_000;
/** Emberglow: how close to you a summon must be to share your Recovery. */
const EMBERGLOW_RADIUS = 220;

const BORN_AT = 'minion.bornAt';
const HORN_NEXT_AT = 'horn.nextAt';
const FROST_NEXT_AT = 'frost.nextAt';
const BURN_NEXT_AT = 'cinder.nextAt';
const BURROW_NEXT_AT = 'burrow.nextAt';
const AMBUSH_NEXT_AT = 'prowler.nextAt';
const POUNCE_LAST_ID = 'prowler.lastTarget';
const POUNCE_LAST_X = 'prowler.lastX';
const POUNCE_LAST_Y = 'prowler.lastY';
const HIBERNATE_HP = 'hibernate.hp';
const HIBERNATE_READY_AT = 'hibernate.readyAt';
const HIBERNATE_UNTIL = 'hibernate.until';

const PIECE_INDEX = new Map<string, number>([...PIECES.keys()].map((id, index) => [id, index]));

function formationTarget(world: World, owner: PlayerEntity): MonsterEntity | undefined {
  const id = owner.summonsMinions?.formationTargetId;
  const target = id ? world.getMonsterEntity(id) : undefined;
  return target && target.hasHealth.hp > 0 ? target : undefined;
}

// ── Supports: spores, frost, the horn (each with a strength, so Choir can echo it) ───────────

/** Sporecaller: the enemies around the target deal less damage for a while. */
function sporeAbility(world: World, owner: PlayerEntity, source: MinionEntity, piece: ConduitPiece, target: MonsterEntity, strength: number): void {
  const mult = jobMult(owner, piece);
  const radius = (piece.params.sporeRadius ?? 0) * mult;
  const cut = Math.min(0.75, (piece.params.sporeCut ?? 0) * mult * strength);
  const ms = piece.params.sporeMs ?? 0;
  if (cut <= 0 || ms <= 0) return;
  const victims = [target, ...playerAoeTargets(world, owner, target.hasPosition.current, radius, target.isMonster.id)];
  for (const victim of victims) {
    if (victim.hasHealth.hp <= 0) continue;
    const prior = getStatusEffect(victim.tracksCombat, SPORE_EFFECT_ID);
    applyStatusEffect(victim.tracksCombat, {
      id: SPORE_EFFECT_ID, maxStacks: 1, remainingMs: ms, refreshable: true, sourceId: source.isMinion.id,
      data: { cut: Math.max(cut, prior?.data['cut'] ?? 0), totalMs: ms },
    });
  }
}

/** Frostcaller: enemies around it attack and move slower. Bosses that accept no control shrug it off. */
function frostAbility(world: World, owner: PlayerEntity, source: MinionEntity, piece: ConduitPiece, strength: number): void {
  const mult = jobMult(owner, piece);
  const move = Math.min(0.9, (piece.params.frostSlow ?? 0) * mult * strength);
  const attack = (piece.params.frostAttackSlow ?? 0) * mult * strength;
  const ms = piece.params.frostMs ?? 0;
  if (move <= 0 || ms <= 0) return;
  for (const victim of playerAoeTargets(world, owner, source.hasPosition.current, (piece.params.frostRadius ?? 0) * mult)) {
    if (victim.hasHealth.hp <= 0 || monsterIgnoresControl(victim)) continue;
    applyMonsterSlow(world, victim, move, ms, source.isMinion.id);
    const slow = getStatusEffect(victim.tracksCombat, ABILITY_SLOW_EFFECT_ID);
    if (slow) slow.data['attackSlowPct'] = Math.max(slow.data['attackSlowPct'] ?? 0, attack);
  }
}

/** Warhorn: its call gives every summon in a wide circle faster attacks for a few seconds. */
function hornAbility(world: World, owner: PlayerEntity, source: MinionEntity, piece: ConduitPiece, strength: number): void {
  const mult = jobMult(owner, piece);
  const radius = (piece.params.hornRadius ?? 0) * mult;
  const ms = piece.params.hornMs ?? 0;
  const haste = (piece.params.hornHaste ?? 0) * mult * strength;
  if (haste <= 0 || ms <= 0) return;
  const reach = radius * radius;
  for (const ally of livingMinions(world, owner)) {
    const dx = ally.hasPosition.current.x - source.hasPosition.current.x;
    const dy = ally.hasPosition.current.y - source.hasPosition.current.y;
    if (dx * dx + dy * dy > reach) continue;
    const prior = getStatusEffect(ally.tracksCombat, HORN_EFFECT_ID);
    applyStatusEffect(ally.tracksCombat, {
      id: HORN_EFFECT_ID, maxStacks: 1, remainingMs: ms, refreshable: true, sourceId: source.isMinion.id,
      data: { attackHastePct: Math.max(haste, prior?.data['attackHastePct'] ?? 0), totalMs: ms },
    });
  }
}

/** Choir (§7.6): when a support's ability fires, every other support type's ability echoes at a share of its strength. */
function echoSupport(world: World, owner: PlayerEntity, source: MinionEntity, target: MonsterEntity | undefined): void {
  if (specializationOf(owner) !== 'conduit-choir') return;
  const aim = target && target.hasHealth.hp > 0 ? target : formationTarget(world, owner);
  const sourceId = source.isMinion.slotId.split('#')[0];
  const seen = new Set<string>([sourceId ?? '']);
  for (const ally of livingMinions(world, owner)) {
    const piece = pieceOfSlot(ally.isMinion.slotId);
    if (!piece || piece.family !== 'support' || seen.has(piece.id)) continue;
    seen.add(piece.id);
    const strength = SPEC.choirEcho;
    switch (piece.id) {
      case 'conduit-swamp-spitter': {
        const shred = piece.params.shredFraction ?? 0;
        if (aim && shred > 0) applyFramePlatingShred(owner, aim, shred * strength * (1 + (owner.usesSkills.passives['conduit.ability-pct'] ?? 0)), piece.params.shredMs ?? 4000);
        break;
      }
      case 'conduit-barkward': coatBark(world, owner, ally, piece, strength); break;
      case 'conduit-bloomtender': supportHeal(world, owner, piece, strength); break;
      case 'conduit-sporecaller': if (aim) sporeAbility(world, owner, ally, piece, aim, strength); break;
      case 'conduit-frostcaller': frostAbility(world, owner, ally, piece, strength); break;
      case 'conduit-warhorn': hornAbility(world, owner, ally, piece, strength); break;
      default: break;
    }
  }
}

// ── Listeners ───────────────────────────────────────────────────────────────

export function registerSummonPiecesT3(): void {
  setSupportEchoHook(echoSupport);

  // Damage shaping on every formation hit: the T3 weapons, the Souls' fight clocks, Ascendant, the Hunt.
  registerCombatListener('onHit', (ctx, world) => {
    if (!ctx.formation || ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const owner = ctx.attacker;
    const target = ctx.defender;
    const minion = world.getMinionEntity(ctx.formation.physicalEntityId);
    const piece = PIECES.get(ctx.formation.slotId.split('#')[0] ?? '');
    const now = attackNow(ctx);
    const passives = owner.usesSkills.passives;
    const spec = specializationOf(owner);
    let mult = 1;

    // Icebound (Tundra weapon): harder against slowed, rooted or chilled enemies.
    const icebound = passives['conduit.icebound-pct'] ?? 0;
    if (icebound > 0 && isHeldOrSlowed(target)) mult *= 1 + icebound;

    // Berserk (Volcanic weapon): a wounded summon hits harder.
    const berserk = passives['conduit.berserk-pct'] ?? 0;
    if (berserk > 0 && minion) {
      const wounded = 1 - minion.hasHealth.hp / Math.max(1, minion.hasHealth.maxHp);
      mult *= 1 + berserk * Math.max(0, wounded);
    }

    const seconds = fightSeconds(owner, now);
    // Ascendant: the longer the fight, the harder they hit (time, not kills).
    if (spec === 'conduit-ascendant') mult *= 1 + SPEC.ascendantPerSec * Math.min(seconds, SPEC.ascendantMaxSec);
    // Magma Salamander (Volcanic Soul): the formation heats up over the fight.
    mult *= fightHeatMult(owner, seconds);

    // The Hunt: each different damage summon that hit this enemy lately raises everyone's damage on it.
    if (spec === 'conduit-the-hunt') {
      const kind = piece?.family === 'damage' ? PIECE_INDEX.get(piece.id) : undefined;
      if (kind !== undefined) {
        const mark = getStatusEffect(target.tracksCombat, HUNT_EFFECT_ID) ?? applyStatusEffect(target.tracksCombat, {
          id: HUNT_EFFECT_ID, maxStacks: 1, remainingMs: SPEC.huntWindowMs, refreshable: true,
          sourceId: owner.isPlayer.id, data: { totalMs: SPEC.huntWindowMs },
        });
        mark.data[`t${kind}`] = now;
        mark.remainingMs = SPEC.huntWindowMs;
      }
      const recent = huntKinds(target.tracksCombat, now);
      if (recent > 1) mult *= 1 + SPEC.huntPerType * (recent - 1);
    }

    if (mult !== 1) ctx.damage = Math.round(ctx.damage * mult);
  });

  // Prowler: strikes from hiding every few seconds, and pounces on an enemy that has run from it.
  registerCombatListener('onHit', (ctx, world) => {
    const hit = swing(ctx, world);
    if (!hit || (hit.piece.params.ambushEveryMs ?? 0) <= 0) return;
    const { minion, piece, target } = hit;
    const cs = minion.tracksCombat;
    const now = attackNow(ctx);
    const pos = target.hasPosition.current;
    // "Fleeing": the same enemy has moved away since this summon last hit it.
    const lastId = cs.strings[POUNCE_LAST_ID];
    const moved = lastId === target.isMonster.id
      ? Math.hypot(pos.x - getResource(cs, POUNCE_LAST_X), pos.y - getResource(cs, POUNCE_LAST_Y))
      : 0;
    cs.strings[POUNCE_LAST_ID] = target.isMonster.id;
    setResource(cs, POUNCE_LAST_X, pos.x);
    setResource(cs, POUNCE_LAST_Y, pos.y);
    let mult = 1;
    if (moved >= (piece.params.pounceDist ?? Infinity)) mult = piece.params.pounceMult ?? 1;
    if (now >= getResource(cs, AMBUSH_NEXT_AT)) {
      setResource(cs, AMBUSH_NEXT_AT, now + (piece.params.ambushEveryMs ?? 0));
      mult = Math.max(mult, piece.params.ambushMult ?? 1);
    }
    // One multiplier per hit: it yields to an empowered hit already on the record.
    if (mult <= 1 || ctx.metadata['empoweredMultiplier'] !== undefined) return;
    ctx.damage = Math.round(ctx.damage * mult);
    ctx.metadata['empoweredMultiplier'] = mult;
  });

  registerCombatListener('afterHit', (ctx, world) => {
    const hit = swing(ctx, world);
    if (!hit) return;
    const { owner, minion, piece, target } = hit;
    const spec = specializationOf(owner);
    const alive = target.hasHealth.hp > 0;
    const now = attackNow(ctx);

    // Sporecaller: spores on the enemies around its target.
    if ((piece.params.sporeCut ?? 0) > 0 && alive) {
      sporeAbility(world, owner, minion, piece, target, 1);
      echoSupport(world, owner, minion, target);
    }
    // The Spitter's acid is a support ability too: it echoes through Choir.
    if (piece.id === 'conduit-swamp-spitter' && alive) echoSupport(world, owner, minion, target);

    // Burrower: it tunnels and erupts under the enemy that fights from furthest back.
    if ((piece.params.burrowEveryMs ?? 0) > 0 && now >= getResource(minion.tracksCombat, BURROW_NEXT_AT) && ctx.damage > 0) {
      const back = playerAoeTargets(world, owner, target.hasPosition.current, piece.params.burrowReach ?? 0, target.isMonster.id)
        .filter((candidate) => candidate.hasHealth.hp > 0 && (candidate.performsAttack?.attackRange ?? 0) > RANGED_ENEMY_REACH)
        .sort((a, b) => (b.performsAttack?.attackRange ?? 0) - (a.performsAttack?.attackRange ?? 0))[0];
      if (back) {
        setResource(minion.tracksCombat, BURROW_NEXT_AT, now + (piece.params.burrowEveryMs ?? 0));
        applyPlayerAoeTo(world, owner, [back], ctx.damage * (piece.params.burrowShare ?? 1), 'summon', {}, {});
      }
    }

    // Infestation: the hit infests the enemy; the infestation builds, and bursts when it dies.
    if (spec === 'conduit-infestation' && alive && !evadeBlocksDebuffs(ctx) && ctx.damage > 0) {
      applyTickDot(world, owner, target, CONDUIT_POISON_ID, ctx.damage * SPEC.infestTickShare, SPEC.infestTicksPerHit, SPEC.infestMaxTicks, SPEC.infestTickMs);
      setFlag(target.tracksCombat, INFESTED_FLAG, true);
    }

    // Colossus: every summon shares one twist, its hits shake the ground around the target.
    if (spec === 'conduit-colossus' && ctx.damage > 0) {
      const victims = playerAoeTargets(world, owner, target.hasPosition.current, SPEC.colossusShockRadius, target.isMonster.id);
      if (victims.length > 0) applyPlayerAoeTo(world, owner, victims, ctx.damage * SPEC.colossusShockShare, 'summon', {}, {});
    }
  });

  // Infestation: an infested enemy that dies bursts. (Short-lived summons do not exist yet: the burst is area damage.)
  registerCombatListener('onKill', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const owner = ctx.attacker;
    const dead = ctx.defender;
    if (!getFlag(dead.tracksCombat, INFESTED_FLAG) || specializationOf(owner) !== 'conduit-infestation') return;
    setFlag(dead.tracksCombat, INFESTED_FLAG, false);
    const victims = playerAoeTargets(world, owner, dead.hasPosition.current, SPEC.infestBurstRadius, dead.isMonster.id);
    if (victims.length > 0) applyPlayerAoeTo(world, owner, victims, owner.dealsDamage.attack * SPEC.infestBurstMult, 'summon', {}, {});
  });
}

/** How many different kinds of damage summon hit this enemy within the Hunt's window. */
function huntKinds(cs: TracksCombat, now: number): number {
  const mark = getStatusEffect(cs, HUNT_EFFECT_ID);
  if (!mark) return 0;
  let count = 0;
  for (const [key, at] of Object.entries(mark.data)) {
    if (key.startsWith('t') && key !== 'totalMs' && now - at <= SPEC.huntWindowMs) count++;
  }
  return count;
}

// ── What happens when a monster hits a summon (called from `onMinionStruckT2`) ──────────────

/** The share of a hit on `minion` that the T3 lines take back: Sporecaller's cut and the Carapace Guard's shield. */
export function t3RefundShare(world: World, owner: PlayerEntity, monster: MonsterEntity, minion: MinionEntity): number {
  let share = getStatusEffect(monster.tracksCombat, SPORE_EFFECT_ID)?.data['cut'] ?? 0;
  // Carapace Guard: a shield raised toward ranged attackers blocks the shots aimed at the summons behind it.
  if ((monster.performsAttack?.attackRange ?? 0) > RANGED_ENEMY_REACH) {
    const struck = pieceOfSlot(minion.isMinion.slotId);
    if (struck?.id !== 'conduit-carapace-guard') {
      for (const ally of livingMinions(world, owner)) {
        const guard = pieceOfSlot(ally.isMinion.slotId);
        if (ally !== minion && guard?.id === 'conduit-carapace-guard') {
          share += (guard.params.blockShare ?? 0) * jobMult(owner, guard);
          break;
        }
      }
    }
  }
  return share;
}

/**
 * Shield Wall (§7.6): damage to any tank is split across all of your tanks, and each different kind
 * of tank adds a layer that takes a little more off it. The hit has landed on `minion` already, so
 * the share it should not have carried comes back and the others pay theirs. `damage` is the hit's
 * estimate (see `minionHitsT2.ts`).
 */
export function shieldWall(world: World, owner: PlayerEntity, minion: MinionEntity, damage: number): void {
  if (specializationOf(owner) !== 'conduit-shield-wall' || pieceOfSlot(minion.isMinion.slotId)?.family !== 'tank') return;
  const tanks = livingMinions(world, owner).filter((ally) => pieceOfSlot(ally.isMinion.slotId)?.family === 'tank');
  if (!tanks.includes(minion)) tanks.push(minion);
  if (tanks.length < 2) return;
  const kinds = new Set(tanks.map((tank) => tank.isMinion.slotId.split('#')[0]));
  const relief = Math.min(0.5, SPEC.shieldWallLayerRelief * (kinds.size - 1));
  const share = (damage / tanks.length) * (1 - relief);
  minion.hasHealth.hp = Math.min(minion.hasHealth.maxHp, minion.hasHealth.hp + damage - share);
  markSliceDirty(world, minion, 'hasHealth');
  for (const tank of tanks) {
    if (tank === minion) continue;
    tank.hasHealth.hp = Math.max(0, tank.hasHealth.hp - share);
    markSliceDirty(world, tank, 'hasHealth');
  }
}

/** Hibernate: while a summon is in its ice, nothing a hit did sticks. True when this strike was swallowed. */
export function holdHibernated(world: World, minion: MinionEntity): boolean {
  if (!getStatusEffect(minion.tracksCombat, HIBERNATE_EFFECT_ID)) return false;
  const floor = getResource(minion.tracksCombat, HIBERNATE_HP);
  if (minion.hasHealth.hp < floor) {
    minion.hasHealth.hp = floor;
    markSliceDirty(world, minion, 'hasHealth');
  }
  return true;
}

// ── Per tick: horns, frost, cinders, Burn Bright, Permafrost, Hibernate, Fireproof, Emberglow ──

/** A DoT's damage cut by `share`, once per dose: a refresh brings the full number back and it is cut again. */
function cutDots(cs: TracksCombat, share: number): void {
  for (const effect of cs.statusEffects) {
    if ((effect.data['isDot'] ?? 0) !== 1) continue;
    const dose = effect.data['damagePerStack'];
    if (dose === undefined || effect.data['fireproofTo'] === dose) continue;
    const cut = Math.round(dose * (1 - share) * 100) / 100;
    effect.data['damagePerStack'] = cut;
    effect.data['fireproofTo'] = cut;
  }
}

/** Permafrost: a tank summon cannot be slowed, rooted or frozen. */
function stripControl(cs: TracksCombat): void {
  for (const id of ['slow', LAIR_DRAG_ROOT_EFFECT_ID, FROZEN_STATUS_ID, FROST_RAMP_EFFECT_ID]) {
    if (getStatusEffect(cs, id)) removeStatusEffect(cs, id);
  }
}

function runHibernate(world: World, minion: MinionEntity, now: number, dt: number, ms: number): void {
  const cs = minion.tracksCombat;
  const health = minion.hasHealth;
  if (getStatusEffect(cs, HIBERNATE_EFFECT_ID)) {
    if (now >= getResource(cs, HIBERNATE_UNTIL)) {
      removeStatusEffect(cs, HIBERNATE_EFFECT_ID);
      return;
    }
    // In the ice it regenerates and cannot fall below where it was.
    const floor = getResource(cs, HIBERNATE_HP);
    health.hp = Math.min(health.maxHp, Math.max(health.hp, floor) + health.maxHp * HIBERNATE_REGEN_PCT_PER_SEC * (dt / 1_000));
    setResource(cs, HIBERNATE_HP, health.hp);
    markSliceDirty(world, minion, 'hasHealth');
    return;
  }
  if (health.hp <= 0 || health.hp >= health.maxHp * HIBERNATE_BELOW || now < getResource(cs, HIBERNATE_READY_AT)) return;
  applyStatusEffect(cs, {
    id: HIBERNATE_EFFECT_ID, maxStacks: 1, remainingMs: ms, refreshable: false, sourceId: minion.isMinion.id,
    data: { totalMs: ms },
  });
  applyStun(cs, ms, minion.isMinion.id);
  setResource(cs, HIBERNATE_HP, health.hp);
  setResource(cs, HIBERNATE_UNTIL, now + ms);
  setResource(cs, HIBERNATE_READY_AT, now + HIBERNATE_COOLDOWN_MS);
}

export function updateConduitT3(world: World, owner: PlayerEntity, dt: number, now: number): void {
  if (!owner.summonsMinions) return;
  updateFightClock(world, owner, now);
  const fighting = inFight(owner);
  const passives = owner.usesSkills.passives;
  const spec = specializationOf(owner);
  const permafrost = (passives['conduit.permafrost'] ?? 0) > 0;
  const hibernate = passives['conduit.hibernate-ms'] ?? 0;
  const fireproof = passives['conduit.fireproof-pct'] ?? 0;
  const emberglow = (passives['conduit.emberglow-pct'] ?? 0) * (owner.hasHealth.recovery ?? 0) * (dt / 1_000);
  const minions = livingMinions(world, owner);

  for (const minion of minions) {
    const cs = minion.tracksCombat;
    const piece = pieceOfSlot(minion.isMinion.slotId);

    // Burn Bright: a fresh summon attacks faster for its first seconds, then burns out.
    if (getResource(cs, BORN_AT) <= 0) {
      setResource(cs, BORN_AT, Math.max(1, now));
      if (spec === 'conduit-burn-bright') {
        applyStatusEffect(cs, {
          id: BURN_BRIGHT_EFFECT_ID, maxStacks: 1, remainingMs: SPEC.burnBrightMs, refreshable: false, sourceId: minion.isMinion.id,
          data: { attackHastePct: SPEC.burnBrightHaste, totalMs: SPEC.burnBrightMs },
        });
      }
    }

    if (piece && fighting) {
      if ((piece.params.hornEveryMs ?? 0) > 0 && now >= getResource(cs, HORN_NEXT_AT)) {
        setResource(cs, HORN_NEXT_AT, now + piece.params.hornEveryMs!);
        hornAbility(world, owner, minion, piece, 1);
        echoSupport(world, owner, minion, undefined);
      }
      if ((piece.params.frostEveryMs ?? 0) > 0 && now >= getResource(cs, FROST_NEXT_AT)) {
        setResource(cs, FROST_NEXT_AT, now + piece.params.frostEveryMs!);
        frostAbility(world, owner, minion, piece, 1);
        echoSupport(world, owner, minion, undefined);
      }
      // Cinderling: it burns everything around it, hotter the longer the fight goes (in every biome).
      if ((piece.params.burnEveryMs ?? 0) > 0 && now >= getResource(cs, BURN_NEXT_AT)) {
        setResource(cs, BURN_NEXT_AT, now + piece.params.burnEveryMs!);
        const ramp = 1 + (piece.params.burnRampPerSec ?? 0) * Math.min(fightSeconds(owner, now), piece.params.burnRampMaxSec ?? 0);
        const victims = playerAoeTargets(world, owner, minion.hasPosition.current, piece.params.burnRadius ?? 0);
        if (victims.length > 0) applyPlayerAoeTo(world, owner, victims, minion.dealsDamage.attack * (piece.params.burnMult ?? 0) * ramp, 'summon', {}, {});
      }
    }

    if (permafrost && piece?.family === 'tank') stripControl(cs);
    if (hibernate > 0) runHibernate(world, minion, now, dt, hibernate);
    if (fireproof > 0) cutDots(cs, fireproof);

    // Emberglow: your Recovery also heals the summons near you.
    if (emberglow > 0) {
      const dx = minion.hasPosition.current.x - owner.hasPosition.current.x;
      const dy = minion.hasPosition.current.y - owner.hasPosition.current.y;
      if (dx * dx + dy * dy <= EMBERGLOW_RADIUS * EMBERGLOW_RADIUS) applyHealToMinion(minion, owner.isPlayer.id, emberglow, world);
    }
  }
  if (fireproof > 0) cutDots(owner.tracksCombat, fireproof);
}
