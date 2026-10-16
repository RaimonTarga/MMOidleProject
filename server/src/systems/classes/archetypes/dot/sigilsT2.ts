/**
 * The Apprentice at tier 2 (bible §9.5, §9.8, §9.16): the three disciplines (Poison's plague,
 * Fire's chain, Frost's freeze), the three pieces they unlock (Wither, Fuse, Cold Snap), the T2
 * lessons (Blast Back, Sear, Seep, Snag, Recoil), the T2 trophy ranks and the Jungle and Desert
 * gear jobs. Wiring only: every number is a kit `params` placeholder or a constant below.
 *
 * Runs on top of `sigils.ts` (the T1 runtime): that file calls in here at the payoff default,
 * the per-tick update and the listener registration.
 */
import {
  APPRENTICE_KIT,
  applyStatusEffect,
  BRITTLE_EFFECT_ID,
  getResource,
  getStatusEffect,
  isHarmfulPlayerStatusEffect,
  isMonsterDotStatusEffectId,
  MONSTER_DATABASE,
  monsterKites,
  setResource,
  trophyParamsAt,
  type MomentId,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { attachMarker } from '../../../../ecs/markerHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyKnockback } from '../../../combat/damage/knockback';
import { bossPatternEscaping } from '../../../combat/ai/bossPatterns';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { applyEnemyShield } from '../../../combat/engine/monsterMechanics';
import { isConcealedEntity, isInvulnerableMonster } from '../../../combat/invulnerability';
import { momentActive } from '../../../combat/moments/moments';
import { FROZEN_EFFECT } from '../../../combat/status/frost';
import { isShelled } from '../../../combat/ai/shellUp';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyMonsterRoot, applyMonsterSlow, monsterHasLiveRoot } from '../../../combat/status/monsterControl';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import {
  DOT_EFFECT_ID,
  FIRE_DISCIPLINE,
  FROST_DISCIPLINE,
  HELD_EFFECT_ID,
  POISON_DISCIPLINE,
  SPEC_AFTERBURN,
  SPEC_HAIR_TRIGGER,
  SPEC_ICE_TOMB,
  SPEC_LONG_FUSE,
  SPEC_RIPENING,
  SPEC_SHARDSTORM,
  WITHER_EFFECT_ID,
} from './constants';
import { laySigils, nearestTo, payoffMult, payoffsOf, PIECES, sigilsOn, spend, type Payoffs } from './sigils';
import { firePayoffT3, ripestAge, seepBurst, snagNeighbours, specParam, surfaced } from './sigilsT3';
import { dirgeBlast, firstAmbusherHit, hidersInReach, pressureHold, recoilBack, stampSmoke, type RecoilSource } from './sigilsT4';
import type { ApprenticePiece } from '@mmo-idle/shared';
import { noteApprentice } from './telemetry';

const FUSE_AT = 'apprentice.fuseAt';
const PLAGUE_AT = 'apprentice.plagueAt';
/** How far a sigil walks to a neighbour (the plague, a dying carrier's pass-on). PLACEHOLDER. */
const NEIGHBOUR_PX = 200;
/** A frozen enemy's slow: close to a stop, since the freeze is a severe slow on the shared ladder. PLACEHOLDER. */
const FREEZE_MOVE_SLOW = 0.95;
const FREEZE_ATTACK_SLOW = 9;
/** Sigils on a fleeing enemy with Scent never expire below this (ms). PLACEHOLDER. */
const SCENT_MIN_LIFE_MS = 3_000;
/** Seep keeps the sigils alive at least this long while the enemy is out of reach (ms). */
const SEEP_MIN_LIFE_MS = 2_000;
/** Frost's per-sigil slow is refreshed every tick for this long (ms). */
const FROST_SLOW_MS = 500;

const DISCIPLINE_PARAMS = new Map<string, Readonly<Record<string, number>>>(
  APPRENTICE_KIT.disciplines.map((entry) => [entry.id, entry.params]),
);
const NO_PARAMS: Readonly<Record<string, number>> = {};

/** The T2 pick's numbers (empty before the pick). */
export function disciplineParamsOf(id: string | null): Readonly<Record<string, number>> {
  return (id ? DISCIPLINE_PARAMS.get(id) : undefined) ?? NO_PARAMS;
}

/** A trophy parameter at the equipped rank: the base value, overridden by each rank up to it. */
export function trophyParam(p: Payoffs, key: string, fallback: number): number {
  return (p.trophy ? trophyParamsAt(p.trophy, p.trophyRank)[key] : undefined) ?? fallback;
}

// ── Reading the enemy ────────────────────────────────────────────────────────

export function isFrozenOrBrittle(monster: MonsterEntity): boolean {
  return monster.tracksCombat.statusEffects.some((effect) => effect.remainingMs !== 0
    && (effect.id === FROZEN_EFFECT || (effect.id === BRITTLE_EFFECT_ID && effect.data['apprenticeBrittle'] === 1)));
}

/**
 * Whether an enemy flees or kites: a boss getting away, or a kiter backing off. The shared
 * `target-flees` moment only knows the boss; ordinary kiters are read here (reported as a
 * stand-in until the moments registry reads them).
 */
export function fleesOrKites(monster: MonsterEntity): boolean {
  if (monster.hasHealth.hp <= 0) return false;
  if (bossPatternEscaping(monster)) return true;
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const kites = monster.scriptsBoss?.kiteOverride ?? (def ? monsterKites(def) : false);
  return kites && monster.hasAggroTarget !== undefined && monster.isMoving !== undefined;
}

/** A moment holds, with `target-flees` also reading an ordinary fleeing or kiting target. */
export function momentHolds(world: World, player: PlayerEntity, moment: MomentId, target: MonsterEntity | undefined, now: number): boolean {
  if (momentActive(world, player, moment, undefined, now)) return true;
  // The shared `target-shielded` moment only reads a barrier; a shell (Shell Up) counts here too.
  if (moment === 'target-shielded' && target !== undefined && isShelled(target, now)) return true;
  return moment === 'target-flees' && target !== undefined && fleesOrKites(target);
}

// ── Detonate, the chain and the shatter ──────────────────────────────────────

function sigilBlast(player: PlayerEntity, target: MonsterEntity, payoffPct: number): number {
  const effect = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID);
  if (!effect) return 0;
  const ticksLeft = Math.max(1, Math.ceil(effect.remainingMs / Math.max(1, effect.data['tickIntervalMs'] ?? 1_000)));
  return effect.stacks * (effect.data['damagePerStack'] ?? 0) * ticksLeft * payoffPct * payoffMult(player);
}

function neighboursOf(world: World, player: PlayerEntity, p: Payoffs, at: { x: number; y: number }, radius: number, exclude: string): MonsterEntity[] {
  const near = playerAoeTargets(world, player, at, radius, exclude).filter((monster) => monster.hasHealth.hp > 0);
  // Dune Wind: a Spread or a chain can leap any distance to an enemy carrying your sigils.
  if (p.trophy?.id === 'apprentice-relic-desert') {
    for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
      if (monster.isMonster.id !== exclude && monster.hasHealth.hp > 0 && !near.includes(monster) && sigilsOn(player, monster) > 0) near.push(monster);
    }
  }
  return near;
}

export interface DetonateOptions {
  /** Go off now even under Long Fuse (the fuse running out, or a chain's own links). */
  immediate?: boolean;
  /** Cinderfall: everything around the target also takes this share of the blast. */
  splash?: { radius: number; share: number };
  /** Pressure Fuse: the held-back blast going off as the enemy resurfaces. */
  damageMult?: number;
}

const distFromPlayer = (player: PlayerEntity, monster: MonsterEntity): number =>
  Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y);

/**
 * Set off every sigil on `target` at once. Frost: on a frozen or brittle target it Shatters
 * (heavier, and its cold chills the neighbours). Fire: the blast throws burn onto every enemy
 * around it and any it fills goes off too, each enemy once per chain.
 * T3: Long Fuse waits first, Afterburn leaves part of the sigils burning, Hair Trigger sets
 * off every carrier the chain reaches, Shardstorm's shards fly out of a shatter, Signal Fire
 * sets off the furthest carrier, and Cinderfall splashes.
 */
export function detonate(
  world: World,
  player: PlayerEntity,
  p: Payoffs,
  target: MonsterEntity,
  payoffPct: number,
  now: number,
  chain: Set<string> = new Set<string>(),
  opts: DetonateOptions = {},
): void {
  if (chain.has(target.isMonster.id)) return;
  let damage = sigilBlast(player, target, payoffPct);
  if (damage <= 0) return;
  // Pressure Fuse: a Detonate on an enemy out of reach waits, and goes off doubled when it resurfaces.
  if (pressureHold(p, target, opts.damageMult !== undefined)) return;
  damage *= opts.damageMult ?? 1;
  // Long Fuse: every detonation waits, and grows with everything laid meanwhile.
  if (p.specialization === SPEC_LONG_FUSE && !opts.immediate) {
    if (getResource(target.tracksCombat, FUSE_AT) <= now) setResource(target.tracksCombat, FUSE_AT, now + specParam(p, 'fuseMs', 2000));
    return;
  }
  const topLevel = chain.size === 0;
  const dp = disciplineParamsOf(p.discipline);
  const at = { ...target.hasPosition.current };
  const id = target.isMonster.id;
  const carriedBefore = sigilsOn(player, target);
  chain.add(id);
  let shattered = false;
  if (p.discipline === FROST_DISCIPLINE && isFrozenOrBrittle(target)) {
    shattered = true;
    damage *= dp['shatterMult'] ?? 2;
    target.tracksCombat.statusEffects = target.tracksCombat.statusEffects.filter((effect) => effect.id !== FROZEN_EFFECT && effect.id !== BRITTLE_EFFECT_ID);
    for (const other of playerAoeTargets(world, player, at, dp['shatterRadius'] ?? 160, id)) {
      applyMonsterSlow(world, other, dp['chillPct'] ?? 0.3, dp['chillMs'] ?? 2000, player.isPlayer.id);
    }
  }
  spend(target);
  applyPlayerAoeTo(world, player, [target], Math.max(1, damage), 'player', {}, {});
  noteApprentice(player, topLevel ? 'blast-dmg' : 'chain-link-dmg', Math.round(damage));
  if (!topLevel) noteApprentice(player, 'chain-link');
  if (shattered) noteApprentice(player, 'shatter');
  stampSmoke(world, p, [target]);
  if (opts.splash) {
    const around = playerAoeTargets(world, player, at, opts.splash.radius, id).filter((monster) => monster.hasHealth.hp > 0 && !chain.has(monster.isMonster.id));
    if (around.length > 0) applyPlayerAoeTo(world, player, around, Math.max(1, damage * opts.splash.share), 'player', {}, {});
    stampSmoke(world, p, around);
  }
  // Afterburn: a detonation leaves part of its sigils burning on the target.
  if (p.specialization === SPEC_AFTERBURN && target.hasHealth.hp > 0) {
    laySigils(world, player, target, Math.floor(carriedBefore * specParam(p, 'keepShare', 0.5)), p.cap);
  }
  // Shardstorm: a shatter's shards fly to the nearest enemies, laying frost sigils; a frozen one shatters too.
  if (shattered && p.specialization === SPEC_SHARDSTORM) {
    const shards = nearestTo(playerAoeTargets(world, player, at, specParam(p, 'radius', 400), id), at)
      .filter((monster) => monster.hasHealth.hp > 0 && !chain.has(monster.isMonster.id))
      .slice(0, specParam(p, 'shards', 3));
    for (const shard of shards) {
      laySigils(world, player, shard, specParam(p, 'shardSigils', 1), p.cap);
      if (isFrozenOrBrittle(shard)) detonate(world, player, p, shard, payoffPct, now, chain, { immediate: true });
    }
  }
  // Signal Fire: detonating your target also sets off your sigils on the enemy furthest from you.
  if (topLevel && p.owned.has('apprentice-signal-fire')) {
    const furthest = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)]
      .filter((monster) => monster.hasHealth.hp > 0 && !chain.has(monster.isMonster.id) && sigilsOn(player, monster) > 0)
      .sort((a, b) => distFromPlayer(player, b) - distFromPlayer(player, a))[0];
    if (furthest) detonate(world, player, p, furthest, PIECES.get('apprentice-signal-fire')?.params['payoffPct'] ?? payoffPct, now, chain, { immediate: true });
  }
  // Dirge: a Detonate also sets off your sigils on every risen enemy in the fight.
  if (topLevel) dirgeBlast(world, player, p, chain, (risen) => detonate(world, player, p, risen, payoffPct, now, chain, { immediate: true }));
  if (p.discipline !== FIRE_DISCIPLINE) return;
  const hairTrigger = p.specialization === SPEC_HAIR_TRIGGER;
  for (const other of neighboursOf(world, player, p, at, dp['chainRadius'] ?? 160, id)) {
    if (chain.has(other.isMonster.id) || other.hasHealth.hp <= 0) continue;
    const carried = sigilsOn(player, other) > 0;
    laySigils(world, player, other, dp['chainSigils'] ?? 2, p.cap);
    // Hair Trigger: the chain sets off any enemy carrying sigils, not only those it fills.
    if (sigilsOn(player, other) >= p.cap || (hairTrigger && carried)) detonate(world, player, p, other, payoffPct, now, chain, { immediate: true });
  }
}

/** Frost's Seize: a real freeze, or a brittle boss when the target accepts no control. */
export function freezeOrBrittle(world: World, player: PlayerEntity, p: Payoffs, target: MonsterEntity, holdMs: number): void {
  const dp = disciplineParamsOf(p.discipline);
  // Ice Tomb: a frozen target stays frozen, and a brittle boss brittle, until you shatter it (up to a limit).
  const tomb = p.specialization === SPEC_ICE_TOMB;
  if (tomb) holdMs = specParam(p, 'tombMs', 6000);
  if (monsterIgnoresControl(target)) {
    const ms = tomb ? holdMs : dp['brittleMs'] ?? 4000;
    applyStatusEffect(target.tracksCombat, {
      id: BRITTLE_EFFECT_ID, maxStacks: 1, remainingMs: ms, refreshable: true, sourceId: player.isPlayer.id,
      data: { totalMs: ms, apprenticeBrittle: 1, damageTakenPct: dp['brittlePct'] ?? 0.3 },
    });
    return;
  }
  applyStatusEffect(target.tracksCombat, {
    id: FROZEN_EFFECT, maxStacks: 1, remainingMs: holdMs, refreshable: true, sourceId: player.isPlayer.id,
    data: { totalMs: holdMs, moveSlowPct: FREEZE_MOVE_SLOW, attackSlowPct: FREEZE_ATTACK_SLOW },
  });
  attachMarker(world, target, 'hasFrozen');
}

// ── The T2 payoffs ───────────────────────────────────────────────────────────

/** Fire a T2 payoff on `target`; false when it had nothing to do (no cooldown is spent). */
export function firePayoffT2(world: World, player: PlayerEntity, p: Payoffs, piece: ApprenticePiece, target: MonsterEntity, now: number): boolean {
  const params = piece.params;
  const sigils = sigilsOn(player, target);
  const pid = player.isPlayer.id;
  switch (piece.id) {
    case 'apprentice-wither': {
      if (spend(target) <= 0) return false;
      const ms = params['ms'] ?? 4000;
      applyStatusEffect(target.tracksCombat, {
        id: WITHER_EFFECT_ID, maxStacks: 1, remainingMs: ms, refreshable: true, sourceId: pid,
        data: { totalMs: ms, lessPct: params['lessPct'] ?? 0.25 },
      });
      return true;
    }
    case 'apprentice-fuse': {
      if (sigils <= 0 || getResource(target.tracksCombat, FUSE_AT) > now) return false;
      setResource(target.tracksCombat, FUSE_AT, now + (params['fuseMs'] ?? 3000));
      return true;
    }
    case 'apprentice-cold-snap': {
      if (spend(target) <= 0) return false;
      for (const other of playerAoeTargets(world, player, target.hasPosition.current, params['radius'] ?? 180, target.isMonster.id)) {
        applyMonsterSlow(world, other, params['slowPct'] ?? 0.35, params['ms'] ?? 2500, pid);
      }
      return true;
    }
    case 'apprentice-blast-back': {
      // The detonation falls on the charging enemy, whoever you are fighting.
      const charger = [...world.aggroedMonsters].find((monster) => monster.hasAggroTarget?.targetId === pid
        && (monster.controlsMonster.chargeRemainingMs ?? 0) > 0 && monster.hasHealth.hp > 0 && sigilsOn(player, monster) > 0);
      if (!charger) return false;
      detonate(world, player, p, charger, params['payoffPct'] ?? 0.8, now);
      if (charger.hasHealth.hp > 0) {
        charger.controlsMonster.chargeRemainingMs = 0;
        applyKnockback(world, charger.isMonster.id, player.hasPosition.current, params['knockback'] ?? 120);
      }
      return true;
    }
    case 'apprentice-sear': {
      if (sigils <= 0 || (target.hasStatus.enemyBarrier?.amount ?? 0) <= 0) return false;
      const damage = sigilBlast(player, target, params['payoffPct'] ?? 0.8);
      spend(target);
      // The sigils burn the barrier at double; the Sear lands (pays out) only if the barrier breaks.
      const result = applyEnemyShield(target, MONSTER_DATABASE.get(target.isMonster.monsterTypeId), damage * (params['barrierMult'] ?? 2), now);
      if (result.broke || result.damage > 0) applyPlayerAoeTo(world, player, [target], Math.max(1, damage), 'player', {}, {});
      return true;
    }
    case 'apprentice-snag': {
      if (sigils < p.cap) return false;
      applyMonsterRoot(world, target, params['rootMs'] ?? 1500, pid);
      if (!monsterHasLiveRoot(target)) return false;
      snagNeighbours(world, player, p, target, params['rootMs'] ?? 1500);
      return true;
    }
    case 'apprentice-recoil': {
      const pending = recoilPending.get(player);
      if (!pending || world.tickCounter - pending.tick > 2) return false;
      recoilPending.delete(player);
      let any = false;
      for (const source of pending.casters) {
        const caster = world.getMonsterEntity(source.id);
        if (!caster || caster.hasHealth.hp <= 0) continue;
        laySigils(world, player, caster, p.cap, p.cap);
        // Recoil II: the caster also suffers its own mark or slow.
        if ((p.ranks.get('apprentice-recoil') ?? 1) >= 2) recoilBack(world, player, caster, source);
        any = true;
      }
      return any;
    }
    default:
      return firePayoffT3(world, player, p, piece, target, now);
  }
}

// ── Watching what lands on you (Recoil, Sun-Ward, Cool Draught) ──────────────

const seenDebuffs = new WeakMap<PlayerEntity, Set<string>>();
const recoilPending = new WeakMap<PlayerEntity, { tick: number; casters: RecoilSource[] }>();

/** The marks, slows and curses on you (not poison or bleed): `id|caster`. */
function currentDebuffs(player: PlayerEntity): Map<string, RecoilSource & { sourceId: string }> {
  const out = new Map<string, RecoilSource & { sourceId: string }>();
  for (const effect of player.tracksCombat.statusEffects) {
    if (effect.stacks <= 0 || effect.remainingMs === 0) continue;
    if (!isHarmfulPlayerStatusEffect(effect.id, effect.data) || isMonsterDotStatusEffectId(effect.id)) continue;
    out.set(`${effect.id}|${effect.sourceId}`, {
      sourceId: effect.sourceId, id: effect.sourceId, effectId: effect.id, remainingMs: effect.remainingMs, speedMult: effect.data['speedMult'],
    });
  }
  return out;
}

function watchDebuffs(world: World, player: PlayerEntity, carriers: number): void {
  const passives = player.usesSkills.passives;
  const current = currentDebuffs(player);
  const before = seenDebuffs.get(player) ?? new Set<string>();
  const casters: RecoilSource[] = [];
  const sunWard = Math.min(0.5, carriers * (passives['apprentice.sun-ward'] ?? 0));
  for (const [key, source] of current) {
    if (before.has(key)) continue;
    const { sourceId } = source;
    if (world.getMonsterEntity(sourceId)) casters.push(source);
    // Sun-Ward: a mark or slow landing on you is shorter for each enemy carrying your sigils.
    if (sunWard > 0) {
      for (const effect of player.tracksCombat.statusEffects) {
        if (`${effect.id}|${effect.sourceId}` !== key || effect.remainingMs <= 0) continue;
        effect.remainingMs = Math.max(1, Math.round(effect.remainingMs * (1 - sunWard)));
        if (effect.data['totalMs'] !== undefined) effect.data['totalMs'] = Math.max(1, Math.round(effect.data['totalMs'] * (1 - sunWard)));
      }
    }
  }
  if (casters.length > 0) recoilPending.set(player, { tick: world.tickCounter, casters });
  // Cool Draught: a mark or slow ending on you heals you a little.
  const coolDraught = passives['apprentice.cool-draught'] ?? 0;
  if (coolDraught > 0) {
    let ended = 0;
    for (const key of before) if (!current.has(key)) ended++;
    if (ended > 0) applyHealToPlayer(player, player.tracksCombat, ended * coolDraught * player.hasHealth.maxHp, world);
  }
  seenDebuffs.set(player, new Set(current.keys()));
}

// ── Per tick ─────────────────────────────────────────────────────────────────

/** The enemies that carried your sigils last tick, so a dying carrier's sigils can pass on. */
const carried = new WeakMap<PlayerEntity, Map<string, MonsterEntity>>();

export function passOn(world: World, player: PlayerEntity, p: Payoffs, from: { x: number; y: number }, count: number, exclude: string, age = 0): void {
  let left = count;
  for (const monster of nearestTo(neighboursOf(world, player, p, from, NEIGHBOUR_PX, exclude), from)) {
    if (left <= 0) break;
    const room = p.cap - sigilsOn(player, monster);
    if (room <= 0) continue;
    const give = Math.min(room, left);
    laySigils(world, player, monster, give, p.cap, false, age);
    left -= give;
  }
}

/** Ripening: the plague passes on its ripest sigil (its age comes along). */
function ripeAge(p: Payoffs, monster: MonsterEntity): number {
  return p.specialization === SPEC_RIPENING ? ripestAge(getStatusEffect(monster.tracksCombat, DOT_EFFECT_ID)) : 0;
}

/** The disciplines' running rules, Fuse, Seep, Scent and the debuff watch. */
export function updateApprenticeT2(world: World, player: PlayerEntity, p: Payoffs, _target: MonsterEntity | undefined, _dt: number, now: number): void {
  const passives = player.usesSkills.passives;
  const dp = disciplineParamsOf(p.discipline);
  const pid = player.isPlayer.id;
  const monsters = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)];
  let carriers = 0;
  for (const monster of monsters) if (monster.hasHealth.hp > 0 && sigilsOn(player, monster) > 0) carriers++;
  watchDebuffs(world, player, carriers);

  const plague = p.discipline === POISON_DISCIPLINE && p.owned.has('apprentice-spread');
  const seep = p.owned.has('apprentice-seep') && p.config.placements.some((placement) => placement.pieceId === 'apprentice-seep');
  const scent = p.trophy?.id === 'apprentice-relic-jungle';
  const fleeTick = passives['apprentice.flee-tick'] ?? 1;
  const detonatePct = PIECES.get('apprentice-detonate')?.params['payoffPct'] ?? 0.8;
  const before = carried.get(player);
  const next = new Map<string, MonsterEntity>();

  // The walking plague: a dying carrier passes on what it still carried (adding no damage).
  if (plague && before) {
    for (const [id, monster] of before) {
      if (monster.hasHealth.hp > 0 && world.getMonsterEntity(id)) continue;
      const left = getStatusEffect(monster.tracksCombat, DOT_EFFECT_ID)?.stacks ?? 0;
      if (left > 0) passOn(world, player, p, monster.hasPosition.current, left, id, ripeAge(p, monster));
    }
  }

  for (const monster of monsters) {
    if (monster.hasHealth.hp <= 0) continue;
    const effect = getStatusEffect(monster.tracksCombat, DOT_EFFECT_ID);
    if (!effect || effect.sourceId !== pid || effect.stacks <= 0) continue;
    const id = monster.isMonster.id;
    next.set(id, monster);
    const stacks = effect.stacks;

    // Frost: each sigil slows its carrier a little.
    if (p.discipline === FROST_DISCIPLINE) {
      applyMonsterSlow(world, monster, Math.min(0.6, stacks * (dp['slowPerSigil'] ?? 0.03)), FROST_SLOW_MS, pid);
    }
    // Poison: a full carrier keeps passing a sigil to its nearest neighbour, for free.
    if (plague && stacks >= p.cap && now >= getResource(monster.tracksCombat, PLAGUE_AT)) {
      // Spread II: the plague also reaches a hiding or fleeing enemy anywhere within your reach.
      const hiders = (p.ranks.get('apprentice-spread') ?? 1) >= 2 ? hidersInReach(world, player, id) : [];
      const other = [...hiders, ...nearestTo(neighboursOf(world, player, p, monster.hasPosition.current, NEIGHBOUR_PX, id), monster.hasPosition.current)]
        .find((candidate) => sigilsOn(player, candidate) < p.cap);
      if (other) {
        laySigils(world, player, other, 1, p.cap, false, ripeAge(p, monster));
        setResource(monster.tracksCombat, PLAGUE_AT, now + (dp['passEveryMs'] ?? 1000));
      }
    }
    // Seep: out of reach, the sigils keep ticking at double (the tick loop reads `seep`).
    const out = isConcealedEntity(monster) || isInvulnerableMonster(monster);
    if (seep && surfaced(monster, out)) seepBurst(world, player, p, monster);
    if (seep && out) {
      effect.data['seep'] = PIECES.get('apprentice-seep')?.params['tickMult'] ?? 2;
      effect.remainingMs = Math.max(effect.remainingMs, SEEP_MIN_LIFE_MS);
    } else if (effect.data['seep']) {
      effect.data['seep'] = 0;
    }
    // Stalker's Rod and Scent: sigils on a fleeing or kiting enemy tick faster; Scent keeps them on.
    const running = fleesOrKites(monster);
    const mult = running ? fleeTick * (scent ? trophyParam(p, 'tickMult', 1.5) : 1) : 1;
    if (running && scent) effect.remainingMs = Math.max(effect.remainingMs, SCENT_MIN_LIFE_MS);
    const base = effect.data['baseTickMs'] ?? effect.data['tickIntervalMs'] ?? 1_000;
    const want = Math.max(100, Math.round(base / mult));
    if (effect.data['tickIntervalMs'] !== want) {
      effect.data['tickIntervalMs'] = want;
      effect.data['nextTickIn'] = Math.min(effect.data['nextTickIn'] ?? want, want);
    }
  }

  // Fuse: the sigils blow when the fuse runs out, with everything laid meanwhile.
  for (const monster of monsters) {
    const fuseAt = getResource(monster.tracksCombat, FUSE_AT);
    if (fuseAt <= 0 || now < fuseAt) continue;
    setResource(monster.tracksCombat, FUSE_AT, 0);
    if (monster.hasHealth.hp > 0) detonate(world, player, p, monster, detonatePct, now, new Set<string>(), { immediate: true });
  }

  carried.set(player, next);
}

// ── Listeners ────────────────────────────────────────────────────────────────

const ambusherHits = new WeakMap<PlayerEntity, Set<string>>();

function isAmbusher(monster: MonsterEntity): boolean {
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  return def?.idleAnchor === 'jungle-bush' || def?.chargedAttack?.lunge !== undefined;
}

export function registerApprenticeT2(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    // Hits on an enemy: Brittle and Petrify take more; a full burn takes more from Fire.
    if (ctx.defenderType === 'monster' && ctx.attackerType === 'player') {
      const monster = ctx.defender as MonsterEntity;
      const brittle = getStatusEffect(monster.tracksCombat, BRITTLE_EFFECT_ID);
      if (brittle && brittle.remainingMs !== 0 && brittle.data['apprenticeBrittle'] === 1) {
        ctx.damage = Math.round(ctx.damage * (1 + (brittle.data['damageTakenPct'] ?? 0)));
      }
      const held = getStatusEffect(monster.tracksCombat, HELD_EFFECT_ID);
      if (held && held.remainingMs !== 0) ctx.damage = Math.round(ctx.damage * (1 + (held.data['damageTakenPct'] ?? 0)));
      const player = ctx.attacker as PlayerEntity;
      const p = payoffsOf(world, player);
      if (p?.discipline === FIRE_DISCIPLINE && sigilsOn(player, monster) >= p.cap) {
        ctx.damage = Math.round(ctx.damage * (1 + (disciplineParamsOf(p.discipline)['burnHitPct'] ?? 0)));
      }
      return;
    }
    // Hits on you: a withered enemy hits softer; Second Skin softens each ambusher's first blow.
    if (ctx.defenderType === 'player' && ctx.attackerType === 'monster' && ctx.damage > 0) {
      const monster = ctx.attacker as MonsterEntity;
      const player = ctx.defender as PlayerEntity;
      const wither = getStatusEffect(monster.tracksCombat, WITHER_EFFECT_ID);
      if (wither && wither.remainingMs !== 0) ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - (wither.data['lessPct'] ?? 0))));
      const skin = player.usesSkills.passives['apprentice.second-skin'] ?? 0;
      if (isAmbusher(monster)) {
        let hit = ambusherHits.get(player);
        if (!hit) ambusherHits.set(player, (hit = new Set<string>()));
        if (hit.size > 64) hit.clear();
        if (!hit.has(monster.isMonster.id)) {
          hit.add(monster.isMonster.id);
          if (skin > 0) ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - skin)));
          // Taint and Cold Shoulder: the same first blow, halved, with its own rider.
          const p = payoffsOf(world, player);
          if (p) ctx.damage = firstAmbusherHit(world, player, p, monster, ctx.damage);
        }
      }
    }
  });
}
