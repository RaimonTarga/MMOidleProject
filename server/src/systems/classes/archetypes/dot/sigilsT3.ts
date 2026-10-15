/**
 * The Apprentice at tier 3 (bible §9.6, §9.8, §9.16): the nine specializations, the T3 lessons
 * (Seize II, Seep II, Spore Burst, Snag II, Signal Fire, Melt, Cinderfall), the T3 trophy
 * ranks and the new Tundra and Volcanic trophies (Frostheart, Magma Core), and the new gear
 * jobs (Glacial Wand, Magma Censer, Ice Veil, Cold Comfort, Ashguard, Banked Coals).
 * Wiring only: every number is a kit `params` placeholder or a constant below.
 *
 * Runs on top of `sigilsT2.ts`: the Detonate-shaped specializations (Afterburn, Long Fuse,
 * Hair Trigger, Shardstorm, Ice Tomb) and Signal Fire live inside `detonate` and
 * `freezeOrBrittle` there; this file holds everything that ticks or is placed.
 */
import {
  APPRENTICE_KIT,
  applyStatusEffect,
  BRITTLE_EFFECT_ID,
  getResource,
  getStatusEffect,
  getString,
  removeStatusEffect,
  setResource,
  setString,
  type ApprenticePiece,
  type PayoffPlacement,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { abortMonsterCast } from '../../../combat/engine/combat';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { castedBuffCastEndsAt, chargedCastEndsAt, monsterAbilityCastEndsAt } from '../../../combat/engine/monsterMechanics';
import { conditionsHold, momentActive, momentTick } from '../../../combat/moments/moments';
import { isShelled } from '../../../combat/ai/shellUp';
import { applyMonsterRoot, applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyStun } from '../../../combat/status/stun';
import {
  DOT_EFFECT_ID,
  FROST_DISCIPLINE,
  SPEC_CARRIER,
  SPEC_CREEPING_FROST,
  SPEC_RIPENING,
  SPEC_WASTING,
  WITHER_EFFECT_ID,
} from './constants';
import { NUMBED_UNTIL, PIECES, laySigils, nearestTo, payoffsOf, sigilsOn, spend, type Payoffs } from './sigils';
import { detonate, freezeOrBrittle, trophyParam } from './sigilsT2';
import { firePayoffT4 } from './sigilsT4';

/** How near an enemy must be to be numbed by Ice Veil (px). PLACEHOLDER. */
const ICE_VEIL_RADIUS = 260;
/** Seize also holds with this cap on how long (ms), as in the T1 runtime. */
const HOLD_MAX_MS = 2_500;

const CHILL_EFFECT_ID = 'tundra-chill';
const HEAT_EFFECT_ID = 'volcanic-heat';

const CARRIER_AT = 'apprentice.carrierAt';
const CREEP_AT = 'apprentice.creepAt';
const BRITTLE_AT = 'apprentice.brittleAt';
const CATCH_UNTIL = 'apprentice.catchUntil';
const CATCH_AFTER = 'apprentice.catchAfter';
const CATCH_HOLD = 'apprentice.catchHold';
const CATCH_ID = 'apprentice.catchId';
const WAS_OUT = 'apprentice.wasOut';
const cdKey = (id: string): string => `apprentice.cd.${id}`;

const SPEC_PARAMS = new Map<string, Readonly<Record<string, number>>>(
  APPRENTICE_KIT.specializations.map((entry) => [entry.id, entry.params]),
);

/** The T3 pick's numbers (empty when the pick is something else). */
export function specParam(p: Payoffs, key: string, fallback: number): number {
  return (p.specialization ? SPEC_PARAMS.get(p.specialization)?.[key] : undefined) ?? fallback;
}

type Effect = NonNullable<ReturnType<typeof getStatusEffect>>;

// ── Ripening: sigils age ─────────────────────────────────────────────────────

/** Each sigil's age (ms), oldest first, per sigil status. Only kept under Ripening. */
const ages = new WeakMap<object, number[]>();

/** `added` sigils were just laid on `effect`, each starting at `age` (a passed-on ripe sigil keeps its own). */
export function noteSigilsLaid(effect: Effect, added: number, age = 0): void {
  if (added <= 0) return;
  let list = ages.get(effect);
  if (!list) ages.set(effect, (list = []));
  for (let i = 0; i < added; i++) list.push(age);
}

/** The age of the ripest sigil on `effect`, 0 without any record. */
export function ripestAge(effect: Effect | undefined): number {
  const list = effect ? ages.get(effect) : undefined;
  return list && list.length > 0 ? Math.max(...list) : 0;
}

function syncAges(effect: Effect): number[] {
  let list = ages.get(effect);
  if (!list) ages.set(effect, (list = []));
  while (list.length < effect.stacks) list.push(0);
  if (list.length > effect.stacks) list.splice(0, list.length - effect.stacks);
  return list;
}

// ── Reading the world ────────────────────────────────────────────────────────

const stacksOf = (player: PlayerEntity, id: string): number =>
  player.tracksCombat.statusEffects.find((effect) => effect.id === id && effect.remainingMs !== 0)?.stacks ?? 0;

/** The Heat on you: a step per stack of the Volcanic ramp. */
export const heatOf = (player: PlayerEntity): number => stacksOf(player, HEAT_EFFECT_ID);

function isCasting(monster: MonsterEntity, now: number): boolean {
  return chargedCastEndsAt(monster) > now || castedBuffCastEndsAt(monster) > now || monsterAbilityCastEndsAt(monster) > now;
}

/** Hold a target the way the Seize does: a real freeze under Frost, a stun otherwise. */
function holdTarget(world: World, player: PlayerEntity, p: Payoffs, target: MonsterEntity, holdMs: number): void {
  if (p.discipline === FROST_DISCIPLINE) freezeOrBrittle(world, player, p, target, holdMs);
  else applyStun(target.tracksCombat, holdMs, player.isPlayer.id);
}

// ── Seize: II and Frostheart ─────────────────────────────────────────────────

/** A Seize just landed on `target` for `holdMs`: arm Seize II's second catch and Frostheart's brittle. */
export function noteSeize(world: World, player: PlayerEntity, p: Payoffs, target: MonsterEntity, holdMs: number, now: number): void {
  const cs = player.tracksCombat;
  if ((p.ranks.get('apprentice-seize') ?? 1) >= 2) {
    const window = PIECES.get('apprentice-seize')?.params['catchWindowMs'] ?? 4000;
    setResource(cs, CATCH_UNTIL, now + holdMs + window);
    setResource(cs, CATCH_AFTER, momentTick(player, 'enemy-winds-up') ?? -1);
    setResource(cs, CATCH_HOLD, holdMs);
    setString(cs, CATCH_ID, target.isMonster.id);
  }
  // Frostheart: every Seize also leaves its target brittle for a few seconds after.
  if (p.trophy?.id === 'apprentice-relic-tundra') setResource(target.tracksCombat, BRITTLE_AT, now + holdMs);
}

function applyBrittle(player: PlayerEntity, p: Payoffs, target: MonsterEntity): void {
  const ms = trophyParam(p, 'brittleMs', 3000);
  applyStatusEffect(target.tracksCombat, {
    id: BRITTLE_EFFECT_ID, maxStacks: 1, remainingMs: ms, refreshable: true, sourceId: player.isPlayer.id,
    data: { totalMs: ms, apprenticeBrittle: 1, damageTakenPct: trophyParam(p, 'brittlePct', 0.3) },
  });
}

// ── The T3 payoffs ───────────────────────────────────────────────────────────

/** Fire a T3 payoff on `target`; false when it had nothing to do (no cooldown is spent). */
export function firePayoffT3(world: World, player: PlayerEntity, p: Payoffs, piece: ApprenticePiece, target: MonsterEntity, now: number): boolean {
  const params = piece.params;
  switch (piece.id) {
    case 'apprentice-spore-burst': {
      // Spent sigils burst onto every enemy around the target, half each.
      const n = spend(target);
      if (n <= 0) return false;
      const each = Math.max(1, Math.floor(n * (params['share'] ?? 0.5)));
      for (const other of playerAoeTargets(world, player, target.hasPosition.current, params['radius'] ?? 180, target.isMonster.id)) {
        if (other.hasHealth.hp > 0) laySigils(world, player, other, each, p.cap);
      }
      return true;
    }
    case 'apprentice-cinderfall': {
      if (sigilsOn(player, target) <= 0) return false;
      // Cinderfall II: each step of the Heat widens the blast.
      const widen = (p.ranks.get('apprentice-cinderfall') ?? 1) >= 2 ? 1 + heatOf(player) * (params['heatWiden'] ?? 0) : 1;
      detonate(world, player, p, target, params['payoffPct'] ?? 0.8, now, new Set<string>(), { splash: { radius: (params['radius'] ?? 180) * widen, share: params['share'] ?? 0.5 } });
      return true;
    }
    // Signal Fire rides every detonation of your target (inside `detonate`); Melt answers the Chill (below).
    default:
      return firePayoffT4(world, player, p, piece, target, now);
  }
}

/** Snag II: the root also holds every enemy near the snagged one. */
export function snagNeighbours(world: World, player: PlayerEntity, p: Payoffs, target: MonsterEntity, rootMs: number): void {
  if ((p.ranks.get('apprentice-snag') ?? 1) < 2) return;
  const radius = PIECES.get('apprentice-snag')?.params['holdRadius'] ?? 160;
  for (const other of playerAoeTargets(world, player, target.hasPosition.current, radius, target.isMonster.id)) {
    if (other.hasHealth.hp > 0) applyMonsterRoot(world, other, rootMs, player.isPlayer.id);
  }
}

/** Seep II: when the enemy surfaces, its sigils burst onto every enemy near the spot. */
export function seepBurst(world: World, player: PlayerEntity, p: Payoffs, monster: MonsterEntity): void {
  if ((p.ranks.get('apprentice-seep') ?? 1) < 2) return;
  const n = sigilsOn(player, monster);
  if (n <= 0) return;
  const radius = PIECES.get('apprentice-seep')?.params['burstRadius'] ?? 200;
  for (const other of playerAoeTargets(world, player, monster.hasPosition.current, radius, monster.isMonster.id)) {
    if (other.hasHealth.hp > 0) laySigils(world, player, other, n, p.cap);
  }
}

/** Whether Seep tracks this out-of-reach edge; returns true on the tick the monster surfaces. */
export function surfaced(monster: MonsterEntity, out: boolean): boolean {
  const was = getResource(monster.tracksCombat, WAS_OUT) === 1;
  if (was !== out) setResource(monster.tracksCombat, WAS_OUT, out ? 1 : 0);
  return was && !out;
}

// ── Melt and Ice Veil: the Chill reaching its threshold ──────────────────────

const chilled = new WeakMap<PlayerEntity, boolean>();

function meltPlacement(p: Payoffs): PayoffPlacement | undefined {
  return p.config.placements.find((placement) => placement.pieceId === 'apprentice-melt' && placement.moment === 'chill-threshold');
}

/** The shared `chill-threshold` moment turning on (it is a state, so the edge is read here). */
function watchChill(world: World, player: PlayerEntity, p: Payoffs, now: number): void {
  const cs = player.tracksCombat;
  const chill = cs.statusEffects.find((effect) => effect.id === CHILL_EFFECT_ID && effect.remainingMs !== 0);
  const over = momentActive(world, player, 'chill-threshold', undefined, now);
  const was = chilled.get(player) ?? false;
  chilled.set(player, over);
  if (!over || was) return;
  const carriers = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)].filter((m) => m.hasHealth.hp > 0 && sigilsOn(player, m) > 0);
  // Ice Veil: every enemy around you carrying your sigils is numbed (the sigils stay).
  if ((player.usesSkills.passives['apprentice.ice-veil'] ?? 0) > 0) {
    const numb = PIECES.get('apprentice-numb')?.params ?? {};
    for (const monster of carriers) {
      const d = Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y);
      if (d > ICE_VEIL_RADIUS) continue;
      const n = sigilsOn(player, monster);
      const slow = Math.min(0.8, (numb['slowBase'] ?? 0.2) + n * (numb['slowPerSigil'] ?? 0.05));
      const ms = (numb['msBase'] ?? 2000) + n * (numb['msPerSigil'] ?? 400);
      applyMonsterSlow(world, monster, slow, ms, player.isPlayer.id);
      setResource(monster.tracksCombat, NUMBED_UNTIL, now + ms);
    }
  }
  // Melt: spend the nearest enemy's sigils to melt the Chill off you.
  const placement = meltPlacement(p);
  if (!placement || !p.owned.has('apprentice-melt') || !chill) return;
  const piece = PIECES.get('apprentice-melt');
  if (!piece || now < getResource(cs, cdKey(piece.id))) return;
  if (!conditionsHold(world, player, placement.conditions, now)) return;
  const nearest = nearestTo(carriers, player.hasPosition.current)[0];
  if (!nearest) return;
  spend(nearest);
  chill.stacks = 0;
  removeStatusEffect(cs, CHILL_EFFECT_ID);
  chilled.set(player, false);
  setResource(cs, cdKey(piece.id), now + (piece.params['cooldownMs'] ?? 0));
}

// ── Per tick ─────────────────────────────────────────────────────────────────

/** The specializations' running rules, Seize II's catch, Frostheart, Magma Core and the Chill watch. */
export function updateApprenticeT3(world: World, player: PlayerEntity, p: Payoffs, dt: number, now: number): void {
  const cs = player.tracksCombat;
  const pid = player.isPlayer.id;
  const monsters = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)];

  watchChill(world, player, p, now);

  // Seize II: a second wind-up within a few seconds is caught too (no sigils spent).
  if (getResource(cs, CATCH_UNTIL) > now) {
    const target = world.getMonsterEntity(getString(cs, CATCH_ID) ?? '');
    if (!target || target.hasHealth.hp <= 0) setResource(cs, CATCH_UNTIL, 0);
    else if (momentActive(world, player, 'enemy-winds-up', undefined, now)
      && (momentTick(player, 'enemy-winds-up') ?? -1) > getResource(cs, CATCH_AFTER) && isCasting(target, now)) {
      setResource(cs, CATCH_UNTIL, 0);
      abortMonsterCast(world, target);
      holdTarget(world, player, p, target, Math.round(getResource(cs, CATCH_HOLD)));
    }
  }

  // Carrier: the plague also walks from you; every enemy near you catches a sigil each second.
  if (p.specialization === SPEC_CARRIER && now >= getResource(cs, CARRIER_AT)) {
    setResource(cs, CARRIER_AT, now + specParam(p, 'everyMs', 1000));
    for (const monster of playerAoeTargets(world, player, player.hasPosition.current, specParam(p, 'radius', 140))) {
      if (monster.hasHealth.hp > 0 && sigilsOn(player, monster) < p.cap) laySigils(world, player, monster, 1, p.cap);
    }
  }

  const magma = p.trophy?.id === 'apprentice-relic-volcanic';
  const sealed = p.owned.has('apprentice-wither');
  const witherParams = PIECES.get('apprentice-wither')?.params ?? {};
  const seize = PIECES.get('apprentice-seize')?.params ?? {};

  for (const monster of monsters) {
    if (monster.hasHealth.hp <= 0) continue;
    const mcs = monster.tracksCombat;

    // Frostheart: the brittle window opens when the Seize's hold ends.
    const brittleAt = getResource(mcs, BRITTLE_AT);
    if (brittleAt > 0 && now >= brittleAt) {
      setResource(mcs, BRITTLE_AT, 0);
      if (p.trophy?.id === 'apprentice-relic-tundra') applyBrittle(player, p, monster);
    }

    const effect = getStatusEffect(mcs, DOT_EFFECT_ID);
    if (!effect || effect.sourceId !== pid || effect.stacks <= 0) continue;
    const stacks = effect.stacks;

    // Magma Core: sigils on a shelled enemy keep ticking at full through the shell.
    if (magma) {
      const shelled = isShelled(monster, now) || (monster.hasStatus.enemyBarrier?.amount ?? 0) > 0;
      effect.data['magma'] = shelled ? trophyParam(p, 'shellTickMult', 1) : 0;
    }

    // Ripening: an old sigil ticks double (the status carries the average).
    if (p.specialization === SPEC_RIPENING) {
      const list = syncAges(effect);
      for (let i = 0; i < list.length; i++) list[i]! += dt;
      const ripe = list.filter((age) => age >= specParam(p, 'ripeMs', 5000)).length;
      const base = effect.data['baseDamage'] ?? effect.data['damagePerStack'] ?? 0;
      effect.data['damagePerStack'] = base * (stacks + ripe * (specParam(p, 'ripeMult', 2) - 1)) / stacks;
    }

    // Wasting: Wither's weakening stays on any enemy carrying a full bar.
    if (p.specialization === SPEC_WASTING && sealed && stacks >= p.cap) {
      const wither = getStatusEffect(mcs, WITHER_EFFECT_ID);
      if (!wither || wither.remainingMs < 600) {
        applyStatusEffect(mcs, {
          id: WITHER_EFFECT_ID, maxStacks: 1, remainingMs: 1000, refreshable: true, sourceId: pid,
          data: { totalMs: 1000, lessPct: witherParams['lessPct'] ?? 0.25 },
        });
      }
    }

    // Creeping Frost: a target reaching the cap freezes on its own, once per spell.
    if (p.specialization === SPEC_CREEPING_FROST && stacks >= p.cap && now >= getResource(mcs, CREEP_AT)) {
      setResource(mcs, CREEP_AT, now + specParam(p, 'everyMs', 8000));
      const hold = Math.min(HOLD_MAX_MS, (seize['holdBase'] ?? 500) + stacks * (seize['holdPerSigil'] ?? 150));
      abortMonsterCast(world, monster);
      freezeOrBrittle(world, player, p, monster, Math.round(hold));
    }
  }
}

// ── Listeners ────────────────────────────────────────────────────────────────

export function registerApprenticeT3(): void {
  // Ashguard: a burning hit on you (the shared `fire-attack` moment) lays a sigil on its shooter.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    if ((player.usesSkills.passives['apprentice.ashguard'] ?? 0) <= 0) return;
    const p = payoffsOf(world, player);
    const shooter = ctx.attacker as MonsterEntity;
    if (!p || shooter.hasHealth.hp <= 0 || !momentActive(world, player, 'fire-attack', undefined, Date.now())) return;
    laySigils(world, player, shooter, 1, p.cap);
  });
}
