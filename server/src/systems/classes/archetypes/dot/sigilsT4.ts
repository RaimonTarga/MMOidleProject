/**
 * The Apprentice at tier 4 (bible §9.7, §9.16): the nine leaves ("what reaches you?"), the T4
 * lessons (Seize III, Frostcrack, Spread II, Recoil II, Cinderfall II, Pyre, Transference), the
 * T4 trophy ranks and the Wasteland and Trench trophies (Dirge, Pressure Fuse), and the new gear
 * jobs (Charnel Rod, Gravewrap, Last Rites, Abyssal Censer, Deep Ward, Tidal Draw), plus
 * Siphon II, which T3 left open. Wiring only: every number is a kit `params` placeholder or a
 * constant below.
 *
 * Runs on top of `sigilsT3.ts`: that file calls in here at the payoff default; `sigils.ts` calls
 * `updateApprenticeT4` and `registerApprenticeT4`. The Detonate-shaped rules (Dirge, Pressure
 * Fuse, Smokescreen) are hooked into `detonate` in `sigilsT2.ts`.
 *
 * Stand-ins (the conductor owns `moments/`): "risen" reads `isRaised` on the monster here (the
 * `risen` moment is not implemented), and the charge / melee / ranged edges the leaves react to
 * are read per monster here, because the shared moments are per player.
 */
import {
  APPRENTICE_KIT,
  applyStatusEffect,
  distanceSq,
  getResource,
  getStatusEffect,
  isCleanseable,
  isHarmfulPlayerStatusEffect,
  isMonsterDotStatusEffectId,
  MONSTER_DATABASE,
  PLATING_SHRED_EFFECT_ID,
  removeStatusEffect,
  setCounter,
  setResource,
  SUN_MARK_EFFECT_ID,
  type ApprenticePiece,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyKnockback } from '../../../combat/damage/knockback';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { applyEnemyShield } from '../../../combat/engine/monsterMechanics';
import { isConcealedEntity, isInvulnerableMonster } from '../../../combat/invulnerability';
import { momentTick } from '../../../combat/moments/moments';
import { isShelled, SHELLED_EFFECT_ID } from '../../../combat/ai/shellUp';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import {
  DOT_EFFECT_ID,
  LEAF_COLD_SHOULDER,
  LEAF_FIRE_WARD,
  LEAF_FROST_MIRROR,
  LEAF_FROZEN_STEP,
  LEAF_SMOKESCREEN,
  LEAF_TAINT,
  LEAF_THICK_AIR,
  LEAF_TINDERBOX,
  LEAF_WINDBORNE,
  POISON_DISCIPLINE,
} from './constants';
import { laySigils, nearestTo, payoffsOf, PIECES, seize, sigilsOn, spend, type Payoffs } from './sigils';
import { detonate, fleesOrKites, freezeOrBrittle, passOn, trophyParam } from './sigilsT2';

/** Slack over the player's attack range that counts as "within your reach" (Spread II). PLACEHOLDER. */
const REACH_SLACK_PX = 48;
/** A melee enemy this close (past its own reach) counts as having reached you (Fire Ward). PLACEHOLDER. */
const CONTACT_SLACK_PX = 40;
/** A charge that ends this close to you reached you (Frozen Step). PLACEHOLDER. */
const CHARGE_REACHED_PX = 180;
/** An enemy reaching further than this hits you from range (the snapshot's own measure). */
const RANGED_REACH = 100;
/** Pyre looks for the fallen body within this many px of where it died. */
const CORPSE_MATCH_PX = 4;
/** Transference and Recoil II give the enemy a mark of this strength for up to this long. PLACEHOLDERS. */
const MARK_DAMAGE_MULT = 1.25;
const MARK_MAX_MS = 8_000;
/** Abyssal Censer stops adding past this many extra multiples. PLACEHOLDER. */
const ABYSS_MAX = 0.5;
/** Logic ticks per second (the 10 Hz logic tick). */
const TICKS_PER_SECOND = 10;

const PRESSURE_PENDING = 'apprentice.pressure';
const SMOKE_TICK = 'apprentice.smokeTick';
const RISEN_TICK = 'apprentice.risenTick';
const FIRE_WARD_AT = 'apprentice.fireWardAt';
const TINDER_AT = 'apprentice.tinderAt';
const TINDER_SEEN = 'apprentice.tinderSeen';
const WINDBORNE_TICK = 'apprentice.windborneTick';
const MIRROR_TICK = 'apprentice.mirrorTick';
/** Shell Up's own clock (private to `shellUp.ts`); Frostcrack ends it early through the same counter. */
const SHELL_ENDS_KEY = 'shellUpEndsAt';

const LEAF_DISCIPLINES = new Map<string, string>(APPRENTICE_KIT.leaves.map((leaf) => [leaf.id, leaf.disciplineId]));
const LEAF_PARAMS = new Map<string, Readonly<Record<string, number>>>(APPRENTICE_KIT.leaves.map((leaf) => [leaf.id, leaf.params]));

/** The T4 pick: a kit leaf the character has unlocked, under the picked discipline. */
export function leafOf(player: PlayerEntity, disciplineId: string | null): string | null {
  if (!disciplineId) return null;
  return player.usesSkills.unlockedSkills.find((id) => LEAF_DISCIPLINES.get(id) === disciplineId) ?? null;
}

/** The T4 pick's numbers (the fallback when the pick is something else). */
function leafParam(p: Payoffs, key: string, fallback: number): number {
  return (p.leaf ? LEAF_PARAMS.get(p.leaf)?.[key] : undefined) ?? fallback;
}

const ticksOf = (ms: number): number => Math.max(1, Math.ceil((ms * TICKS_PER_SECOND) / 1000));

// ── Reading the enemy ────────────────────────────────────────────────────────

const distFrom = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Whether an enemy hits from range (its reach is beyond melee contact). */
function isRanged(monster: MonsterEntity): boolean {
  return (monster.performsAttack?.attackRange ?? 0) > RANGED_REACH;
}

/** Every enemy that carries your sigils, whatever its state. */
function carriersOf(world: World, player: PlayerEntity): MonsterEntity[] {
  return [...world.monsterEntitiesInNode(player.hasPosition.nodeId)].filter((m) => m.hasHealth.hp > 0 && sigilsOn(player, m) > 0);
}

/**
 * Enemies hiding (burrowed, dived, vanished) or fleeing within your reach: where Spread II's
 * sigils may go, which the usual neighbour search never finds. Nearest first.
 */
export function hidersInReach(world: World, player: PlayerEntity, excludeId: string): MonsterEntity[] {
  const reach = player.performsAttack.attackRange + REACH_SLACK_PX;
  const here = player.hasPosition.current;
  const found = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)].filter((monster) =>
    monster.isMonster.id !== excludeId && monster.hasHealth.hp > 0
    && (isConcealedEntity(monster) || isInvulnerableMonster(monster) || fleesOrKites(monster))
    && distFrom(monster.hasPosition.current, here) <= reach);
  return nearestTo(found, here);
}

// ── Seize III, Frostcrack ────────────────────────────────────────────────────

/** Seize III: the delayed attacks the enemy had laid (fault lines) are cancelled with its wind-up. */
export function cancelDelayedAttacks(world: World, monster: MonsterEntity): void {
  const nodeId = monster.hasPosition.nodeId;
  const list = world.groundZones.get(nodeId);
  if (!list) return;
  const id = monster.isMonster.id;
  const kept = list.filter((zone) => !(zone.kind === 'fault-line-telegraph' && zone.ownerId === id));
  if (kept.length === list.length) return;
  if (kept.length === 0) world.groundZones.delete(nodeId);
  else world.groundZones.set(nodeId, kept);
}

/** Frostcrack: break the barrier at once, and end a Shell Up (the shell system then reopens it). */
function crackShell(target: MonsterEntity, now: number): void {
  applyEnemyShield(target, MONSTER_DATABASE.get(target.isMonster.monsterTypeId), Number.MAX_SAFE_INTEGER, now);
  if (isShelled(target, now)) {
    setCounter(target.tracksCombat, SHELL_ENDS_KEY, now);
    removeStatusEffect(target.tracksCombat, SHELLED_EFFECT_ID);
  }
}

// ── Debuffs: Siphon II, Transference, Recoil II, Tidal Draw ──────────────────

/** Tidal Draw: each debuff you move or wash off heals you a little. */
export function tidalDraw(world: World, player: PlayerEntity, debuffs: number): void {
  const heal = player.usesSkills.passives['apprentice.tidal-draw'] ?? 0;
  if (heal > 0 && debuffs > 0) applyHealToPlayer(player, player.tracksCombat, debuffs * heal * player.hasHealth.maxHp, world);
}

/** Siphon II: wash every poison, bleed and Corrosion off you; how many kinds went. */
export function washOffDebuffs(player: PlayerEntity): number {
  const cs = player.tracksCombat;
  const ids = new Set<string>();
  for (const effect of cs.statusEffects) {
    if (effect.stacks <= 0 || effect.remainingMs === 0) continue;
    if (isMonsterDotStatusEffectId(effect.id) || effect.id === PLATING_SHRED_EFFECT_ID) ids.add(effect.id);
  }
  for (const id of ids) removeStatusEffect(cs, id);
  return ids.size;
}

/** A debuff of yours as the Recoil watch saw it land. */
export interface RecoilSource {
  /** The caster's monster id. */
  id: string;
  effectId: string;
  remainingMs: number;
  speedMult?: number;
}

/** Put a copy of a player's debuff on an enemy: a slow stays a slow, anything else becomes a mark. PLACEHOLDER mapping. */
function inflict(world: World, player: PlayerEntity, monster: MonsterEntity, effectId: string, remainingMs: number, speedMult: number | undefined): void {
  const ms = remainingMs > 0 ? Math.min(remainingMs, MARK_MAX_MS) : MARK_MAX_MS;
  if (effectId === 'slow' || speedMult !== undefined) {
    applyMonsterSlow(world, monster, Math.min(0.95, Math.max(0.1, 1 - (speedMult ?? 0.5))), ms, player.isPlayer.id);
    return;
  }
  applyStatusEffect(monster.tracksCombat, {
    id: 'vulnerability', maxStacks: 1, remainingMs: ms, refreshable: true, sourceId: player.isPlayer.id,
    data: { totalMs: ms, damageMultiplier: MARK_DAMAGE_MULT },
  });
}

/** Recoil II: the caster also suffers its own mark or slow. */
export function recoilBack(world: World, player: PlayerEntity, caster: MonsterEntity, source: RecoilSource): void {
  inflict(world, player, caster, source.effectId, source.remainingMs, source.speedMult);
}

/** The debuff Transference would move: slows and marks first, then the deepest harmful one you carry. */
function transferable(player: PlayerEntity): { id: string; remainingMs: number; speedMult?: number } | undefined {
  const rank = (id: string): number => (id === 'slow' ? 0 : id === SUN_MARK_EFFECT_ID ? 1 : 2);
  return player.tracksCombat.statusEffects
    .filter((e) => e.stacks > 0 && e.remainingMs !== 0 && isHarmfulPlayerStatusEffect(e.id, e.data) && isCleanseable(e.id, e.data))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id))
    .map((e) => ({ id: e.id, remainingMs: e.remainingMs, speedMult: e.data['speedMult'] }))[0];
}

// ── Detonate hooks (called from `detonate`) ──────────────────────────────────

/**
 * Pressure Fuse: a Detonate on an enemy out of reach waits (its sigils stay) and goes off
 * doubled when the enemy resurfaces. True when this blast is held back.
 */
export function pressureHold(p: Payoffs, target: MonsterEntity, released: boolean): boolean {
  if (p.trophy?.id !== 'apprentice-relic-trench' || released) return false;
  if (!isConcealedEntity(target) && !isInvulnerableMonster(target)) return false;
  setResource(target.tracksCombat, PRESSURE_PENDING, 1);
  return true;
}

/** Dirge: a Detonate also sets off your sigils on every risen enemy in the fight. */
export function dirgeBlast(world: World, player: PlayerEntity, p: Payoffs, chain: ReadonlySet<string>, fire: (risen: MonsterEntity) => void): void {
  if (p.trophy?.id !== 'apprentice-relic-graveyard') return;
  for (const monster of carriersOf(world, player)) {
    if (monster.isRaised && !chain.has(monster.isMonster.id)) fire(monster);
  }
}

/** Smokescreen: the enemies a detonation hit deal less with ranged hits for a moment. */
export function stampSmoke(world: World, p: Payoffs, monsters: readonly MonsterEntity[]): void {
  if (p.leaf !== LEAF_SMOKESCREEN) return;
  const until = world.tickCounter + ticksOf(leafParam(p, 'ms', 2000));
  for (const monster of monsters) setResource(monster.tracksCombat, SMOKE_TICK, until);
}

// ── The T4 payoffs ───────────────────────────────────────────────────────────

/** Fire a T4 payoff on `target`; false when it had nothing to do (no cooldown is spent). */
export function firePayoffT4(world: World, player: PlayerEntity, p: Payoffs, piece: ApprenticePiece, target: MonsterEntity, now: number): boolean {
  switch (piece.id) {
    case 'apprentice-frostcrack': {
      // A Seize on a shielded or shelled enemy that also cracks the shell open at once.
      const shielded = (target.hasStatus.enemyBarrier?.amount ?? 0) > 0 || isShelled(target, now);
      if (!shielded || !seize(world, player, p, target, now)) return false;
      crackShell(target, now);
      return true;
    }
    case 'apprentice-transference': {
      // Spend the target's sigils to move one of the debuffs on you onto it.
      if (sigilsOn(player, target) <= 0) return false;
      const debuff = transferable(player);
      if (!debuff) return false;
      spend(target);
      removeStatusEffect(player.tracksCombat, debuff.id);
      inflict(world, player, target, debuff.id, debuff.remainingMs, debuff.speedMult);
      tidalDraw(world, player, 1);
      return true;
    }
    // Pyre acts when a carrier falls (below).
    default:
      return false;
  }
}

// ── Per tick ─────────────────────────────────────────────────────────────────

interface Edges {
  charging: Set<string>;
  touching: Set<string>;
  carried: Map<string, MonsterEntity>;
}
const edges = new WeakMap<PlayerEntity, Edges>();

/** Ticks since this risen enemy was first seen (Gravewrap's "first seconds"). */
function risenAge(world: World, monster: MonsterEntity): number {
  let stamp = getResource(monster.tracksCombat, RISEN_TICK);
  if (stamp <= 0) {
    stamp = world.tickCounter + 1;
    setResource(monster.tracksCombat, RISEN_TICK, stamp);
  }
  return world.tickCounter + 1 - stamp;
}

/** Pyre: a fallen enemy cannot rise (its body is burned off the node's corpses). */
function burnCorpse(world: World, monster: MonsterEntity): void {
  const nodeId = monster.hasPosition.nodeId;
  const list = world.corpses.get(nodeId);
  if (!list) return;
  const index = list.findIndex((corpse) => distanceSq(corpse.pos, monster.hasPosition.current) <= CORPSE_MATCH_PX * CORPSE_MATCH_PX);
  if (index < 0) return;
  list.splice(index, 1);
  if (list.length === 0) world.corpses.delete(nodeId);
}

/** Distinct debuffs on a carrier: effects others put on it (not its own buffs, not the sigils). */
function debuffsOn(monster: MonsterEntity): number {
  const ids = new Set<string>();
  for (const effect of monster.tracksCombat.statusEffects) {
    if (effect.id === DOT_EFFECT_ID || effect.remainingMs === 0 || effect.stacks <= 0) continue;
    if (effect.sourceId === monster.isMonster.id) continue;
    ids.add(effect.id);
  }
  return ids.size;
}

/** The leaves, Pyre, Pressure Fuse, the Abyssal Censer's debuff count and Gravewrap's clock. */
export function updateApprenticeT4(world: World, player: PlayerEntity, p: Payoffs, now: number): void {
  const pid = player.isPlayer.id;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;
  const here = player.hasPosition.current;
  const abyss = passives['apprentice.abyssal'] ?? 0;
  const monsters = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)];
  const before = edges.get(player);
  const next: Edges = { charging: new Set<string>(), touching: new Set<string>(), carried: new Map<string, MonsterEntity>() };
  edges.set(player, next);

  for (const monster of monsters) {
    if (monster.hasHealth.hp <= 0) continue;
    const id = monster.isMonster.id;
    const mcs = monster.tracksCombat;
    if (monster.isRaised) risenAge(world, monster);
    const onMe = monster.hasAggroTarget?.targetId === pid;
    if (onMe && (monster.controlsMonster.chargeRemainingMs ?? 0) > 0) next.charging.add(id);
    const reach = monster.performsAttack?.attackRange ?? 0;
    if (onMe && reach > 0 && reach <= RANGED_REACH && distFrom(monster.hasPosition.current, here) <= reach + CONTACT_SLACK_PX) next.touching.add(id);

    const effect = getStatusEffect(mcs, DOT_EFFECT_ID);
    const carries = !!effect && effect.sourceId === pid && effect.stacks > 0;
    if (carries) {
      next.carried.set(id, monster);
      // Abyssal Censer: the sigils tick harder for each different debuff on their carrier.
      effect.data['abyss'] = abyss > 0 ? 1 + Math.min(ABYSS_MAX, debuffsOn(monster) * abyss) : 1;
    }

    // Pressure Fuse: the held-back blast goes off, doubled, once the enemy is back within reach.
    if (getResource(mcs, PRESSURE_PENDING) === 1 && !isConcealedEntity(monster) && !isInvulnerableMonster(monster)) {
      setResource(mcs, PRESSURE_PENDING, 0);
      if (carries) {
        const detonatePct = PIECES.get('apprentice-detonate')?.params['payoffPct'] ?? 0.8;
        detonate(world, player, p, monster, detonatePct, now, new Set<string>(), { immediate: true, damageMult: trophyParam(p, 'pressureMult', 2) });
      }
    }
  }

  // Thick Air and Frozen Step read a charge: it starts (lands carrying sigils) or reaches you (freezes).
  if (p.leaf === LEAF_THICK_AIR || p.leaf === LEAF_FROZEN_STEP) {
    for (const id of next.charging) {
      if (before?.charging.has(id) || p.leaf !== LEAF_THICK_AIR) continue;
      const charger = world.getMonsterEntity(id);
      if (!charger) continue;
      laySigils(world, player, charger, p.cap, p.cap);
      applyMonsterSlow(world, charger, leafParam(p, 'slowPct', 0.4), leafParam(p, 'slowMs', 1500), pid);
    }
    for (const id of before?.charging ?? []) {
      if (next.charging.has(id) || p.leaf !== LEAF_FROZEN_STEP) continue;
      const charger = world.getMonsterEntity(id);
      if (!charger || charger.hasHealth.hp <= 0 || distFrom(charger.hasPosition.current, here) > CHARGE_REACHED_PX) continue;
      freezeOrBrittle(world, player, p, charger, leafParam(p, 'holdMs', 1500));
    }
  }

  // Fire Ward: an enemy reaching melee range sets off its own sigils and is knocked back a step.
  if (p.leaf === LEAF_FIRE_WARD && now >= getResource(cs, FIRE_WARD_AT)) {
    for (const id of next.touching) {
      if (before?.touching.has(id)) continue;
      const monster = world.getMonsterEntity(id);
      if (!monster || sigilsOn(player, monster) <= 0) continue;
      const detonatePct = PIECES.get('apprentice-detonate')?.params['payoffPct'] ?? 0.8;
      detonate(world, player, p, monster, detonatePct, now, new Set<string>(), { immediate: true });
      if (monster.hasHealth.hp > 0) applyKnockback(world, id, here, leafParam(p, 'knockback', 120));
      setResource(cs, FIRE_WARD_AT, now + leafParam(p, 'everyMs', 4000));
      break;
    }
  }

  // Tinderbox: an enemy appearing beside you (the `ambush` event) sets off your sigils on every enemy around you.
  if (p.leaf === LEAF_TINDERBOX) {
    const tick = momentTick(player, 'ambush');
    if (tick !== undefined && tick + 1 > getResource(cs, TINDER_SEEN)) {
      setResource(cs, TINDER_SEEN, tick + 1);
      if (now >= getResource(cs, TINDER_AT)) {
        setResource(cs, TINDER_AT, now + leafParam(p, 'everyMs', 8000));
        const detonatePct = PIECES.get('apprentice-detonate')?.params['payoffPct'] ?? 0.8;
        const chain = new Set<string>();
        for (const monster of carriersOf(world, player)) {
          if (distFrom(monster.hasPosition.current, here) <= leafParam(p, 'radius', 400)) detonate(world, player, p, monster, detonatePct, now, chain, { immediate: true });
        }
      }
    }
  }

  // Pyre: a fallen carrier burns and cannot rise; the sigils it still carried pass on (no damage added).
  const pyre = p.owned.has('apprentice-pyre') && p.config.placements.some((placement) => placement.pieceId === 'apprentice-pyre');
  if (pyre && before) {
    const plague = p.discipline === POISON_DISCIPLINE && p.owned.has('apprentice-spread');
    for (const [id, monster] of before.carried) {
      if (monster.hasHealth.hp > 0 && world.getMonsterEntity(id)) continue;
      burnCorpse(world, monster);
      const left = getStatusEffect(monster.tracksCombat, DOT_EFFECT_ID)?.stacks ?? 0;
      // Under the Poison plague the dying carrier already passes its sigils on.
      if (!plague && left > 0) passOn(world, player, p, monster.hasPosition.current, left, id);
    }
  }
}

// ── Listeners ────────────────────────────────────────────────────────────────

/** Taint and Cold Shoulder: the first hit an ambusher lands on you is halved, with its own rider. Returns the new damage. */
export function firstAmbusherHit(world: World, player: PlayerEntity, p: Payoffs, monster: MonsterEntity, damage: number): number {
  if (p.leaf === LEAF_TAINT) {
    laySigils(world, player, monster, p.cap, p.cap);
    return Math.max(1, Math.round(damage * (1 - leafParam(p, 'lessPct', 0.5))));
  }
  if (p.leaf === LEAF_COLD_SHOULDER) {
    freezeOrBrittle(world, player, p, monster, leafParam(p, 'holdMs', 1500));
    return Math.max(1, Math.round(damage * (1 - leafParam(p, 'lessPct', 0.5))));
  }
  return damage;
}

export function registerApprenticeT4(): void {
  // Charnel Rod: your hits also lay a sigil on the nearest risen enemy.
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster' || ctx.formation) return;
    const player = ctx.attacker;
    if ((player.usesSkills.passives['apprentice.charnel'] ?? 0) <= 0) return;
    if (ctx.metadata['evaded'] === true || ctx.metadata['evadeFull'] === true) return;
    const p = payoffsOf(world, player);
    if (!p) return;
    const target = ctx.defender;
    const risen = [...world.monsterEntitiesInNode(player.hasPosition.nodeId)].filter((m) => m.isRaised && m.hasHealth.hp > 0 && m !== target);
    const nearest = nearestTo(risen, target.hasPosition.current)[0];
    if (nearest) laySigils(world, player, nearest, 1, p.cap);
  });

  // What reaches you: Smokescreen, Windborne, Frost Mirror, Gravewrap and Deep Ward read the enemy's hit.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender;
    const monster = ctx.attacker;
    const p = payoffsOf(world, player);
    if (!p) return;
    const passives = player.usesSkills.passives;
    const ranged = isRanged(monster);

    // Gravewrap: a risen enemy carrying your sigils can't hit you for its first seconds.
    const wrap = passives['apprentice.gravewrap'] ?? 0;
    if (wrap > 0 && monster.isRaised && sigilsOn(player, monster) > 0 && risenAge(world, monster) < wrap * TICKS_PER_SECOND) {
      ctx.damage = 0;
      return;
    }
    // Smokescreen: for a moment after a detonation, the enemies it hit deal less with ranged hits.
    if (ranged && getResource(monster.tracksCombat, SMOKE_TICK) > world.tickCounter) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - leafParam(p, 'lessPct', 0.5))));
    }
    // Deep Ward: while you carry three or more debuffs, each enemy carrying a full bar deals less.
    const ward = passives['apprentice.deep-ward'] ?? 0;
    if (ward > 0 && sigilsOn(player, monster) >= p.cap) {
      const debuffs = new Set<string>();
      for (const effect of player.tracksCombat.statusEffects) {
        if (effect.stacks > 0 && effect.remainingMs !== 0 && isHarmfulPlayerStatusEffect(effect.id, effect.data)) debuffs.add(effect.id);
      }
      if (debuffs.size >= 3) ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - ward)));
    }
    // Windborne: your plague also walks to whoever hits you from range, however far.
    if (ranged && p.leaf === LEAF_WINDBORNE && world.tickCounter >= getResource(monster.tracksCombat, WINDBORNE_TICK)
      && carriersOf(world, player).some((carrier) => carrier !== monster)) {
      setResource(monster.tracksCombat, WINDBORNE_TICK, world.tickCounter + ticksOf(leafParam(p, 'everyMs', 1000)));
      if (sigilsOn(player, monster) < p.cap) laySigils(world, player, monster, 1, p.cap);
    }
    // Frost Mirror: each ranged hit on you lays a frost sigil on the shooter; a full shooter freezes.
    if (ranged && p.leaf === LEAF_FROST_MIRROR) {
      laySigils(world, player, monster, 1, p.cap);
      if (sigilsOn(player, monster) >= p.cap && world.tickCounter >= getResource(monster.tracksCombat, MIRROR_TICK)) {
        setResource(monster.tracksCombat, MIRROR_TICK, world.tickCounter + ticksOf(leafParam(p, 'everyMs', 8000)));
        freezeOrBrittle(world, player, p, monster, leafParam(p, 'holdMs', 1500));
      }
    }
  });
}
