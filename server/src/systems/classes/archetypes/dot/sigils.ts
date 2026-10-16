/**
 * The Apprentice at runtime (bible §9.2–§9.4): the hits lay **sigils** on the enemy, which tick as
 * damage over time under the usual rules; **payoffs** spend them at moments the Payoff rules
 * name. A sigil is one stack of the class DoT status (`DOT_EFFECT_ID`); its ticks are linear
 * and its damage comes from the weapon, never from the hit.
 * Wiring only: every number is a kit `params` placeholder or a constant below.
 */
import {
  ABILITY_SLOW_EFFECT_ID,
  APPRENTICE_KIT,
  getResource,
  getStatusEffect,
  holdKindOfStatusId,
  pieceTierScale,
  removeStatusEffect,
  setResource,
  applyStatusEffect,
  type ApprenticePiece,
  type ApprenticeTrophy,
  type PayoffsConfig,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { attachMarker } from '../../../../ecs/markerHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { abortMonsterCast } from '../../../combat/engine/combat';
import { emitMechanicFired } from '../../../combat/engine/mechanicFired';
import { WINDUP_SLOW_PCT_KEY } from '../../../combat/engine/monsterMechanics';
import { attackNow, registerCombatListener } from '../../../combat/engine/combatPipeline';
import { conditionsHold, momentActive } from '../../../combat/moments/moments';
import { applyMonsterSlow } from '../../../combat/status/monsterControl';
import { applyStun } from '../../../combat/status/stun';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { activateRecoveryBoost } from '../../../defense/regen/recovery';
import { classConfigContextOf } from '../../../player/progression/classConfig';
import { DOT_EFFECT_ID, FROST_DISCIPLINE, HELD_EFFECT_ID, POISON_DISCIPLINE, SPEC_RIPENING } from './constants';
import {
  detonate,
  disciplineParamsOf,
  firePayoffT2,
  momentHolds,
  registerApprenticeT2,
  trophyParam,
  updateApprenticeT2,
  freezeOrBrittle,
  isFrozenOrBrittle,
} from './sigilsT2';
import {
  heatOf,
  noteSeize,
  noteSigilsLaid,
  registerApprenticeT3,
  updateApprenticeT3,
} from './sigilsT3';
import { cancelDelayedAttacks, hidersInReach, leafOf, registerApprenticeT4, tidalDraw, updateApprenticeT4, washOffDebuffs } from './sigilsT4';
import { flushApprentice, noteApprentice } from './telemetry';

/** A sigil's tick damage, as a share of the weapon's attack (potency), per tick. PLACEHOLDER. */
const SIGIL_TICK_PCT = 0.25;
/** The base tick and lifetime of a sigil (ms). PLACEHOLDERS. */
const SIGIL_TICK_MS = 1_000;
const SIGIL_LIFE_MS = 6_000;
/** Seize also holds with this extra cap on how long (ms), so a big bar never locks a boss for long. */
const HOLD_MAX_MS = 2_500;

/** The Recovery-share factor the lines write each tick; `recovery.ts` reads it. */
export const APPRENTICE_RECOVERY_X = 'apprentice.recoveryX';
/** Give Ground's move factor, written each tick; `movement.ts` reads it. */
export const APPRENTICE_MOVE_X = 'apprentice.moveX';
const SPREAD_AT = 'apprentice.spreadAt';
const BROOD_AT = 'apprentice.broodAt';
export const NUMBED_UNTIL = 'apprentice.numbedUntil';
const SEIZED_UNTIL = 'apprentice.seizedUntil';
const cdKey = (id: string): string => `apprentice.cd.${id}`;
/** Distance (px) beyond which a target counts as far, for the Dune Staff. PLACEHOLDER. */
const FAR_PX = 220;
/** Slack over the player's attack range that counts as "within your reach" (Patient Hunter). PLACEHOLDER. */
const REACH_SLACK_PX = 48;

export const PIECES = new Map<string, ApprenticePiece>(APPRENTICE_KIT.pieces.map((piece) => [piece.id, piece]));
const TROPHIES = new Map<string, ApprenticeTrophy>(APPRENTICE_KIT.trophies.map((trophy) => [trophy.id, trophy]));

export interface Payoffs {
  config: PayoffsConfig;
  owned: ReadonlySet<string>;
  /** Owned piece ranks (Numb II, Siphon II, ...). */
  ranks: ReadonlyMap<string, number>;
  trophy: ApprenticeTrophy | undefined;
  /** The equipped trophy's rank (1 when it has not been ranked up). */
  trophyRank: number;
  /** The T2 pick, once made. */
  discipline: string | null;
  /** The T3 pick, once made and only while it belongs to the discipline. */
  specialization: string | null;
  /** The T4 leaf, once picked and only while it belongs to the discipline. */
  leaf: string | null;
  cap: number;
}

const SPECIALIZATIONS = new Map<string, string>(APPRENTICE_KIT.specializations.map((entry) => [entry.id, entry.disciplineId]));

/** The T3 pick, when it is one of the kit's and sits under the picked discipline. */
function specializationOf(player: PlayerEntity, disciplineId: string | null): string | null {
  const picked = player.usesSkills.specializationId ?? null;
  return picked && disciplineId !== null && SPECIALIZATIONS.get(picked) === disciplineId ? picked : null;
}

const cache = new WeakMap<PlayerEntity, { tick: number; value: Payoffs | null }>();

/** The Apprentice's Payoff rules, or null for a character without them. */
export function payoffsOf(world: World, player: PlayerEntity): Payoffs | null {
  const hit = cache.get(player);
  if (hit && hit.tick === world.tickCounter) return hit.value;
  const config = player.configuresClass?.config;
  let value: Payoffs | null = null;
  if (player.appliesDots && config?.system.kind === 'payoffs') {
    const ctx = classConfigContextOf(player);
    if (ctx) {
      const trophy = config.relic[0] ? TROPHIES.get(config.relic[0]) : undefined;
      const capShift = disciplineParamsOf(ctx.disciplineId)['capShift'] ?? 0;
      value = {
        config: config.system,
        owned: new Set(ctx.pieceRanks.keys()),
        ranks: ctx.pieceRanks,
        trophy,
        trophyRank: trophy ? ctx.trophyRanks.get(trophy.id) ?? 1 : 1,
        discipline: ctx.disciplineId,
        specialization: specializationOf(player, ctx.disciplineId),
        leaf: leafOf(player, ctx.disciplineId),
        cap: Math.max(1, ctx.budget + Math.round(player.usesSkills.passives['apprentice.cap-extra'] ?? 0) + capShift),
      };
    }
  }
  cache.set(player, { tick: world.tickCounter, value });
  return value;
}

export function hasPayoffs(player: PlayerEntity): boolean {
  return !!player.appliesDots && player.configuresClass?.config.system.kind === 'payoffs';
}

// ── Sigils ───────────────────────────────────────────────────────────────────

/** Damage one sigil deals per tick: the weapon's potency and the tier, never the hit. */
function sigilDamage(player: PlayerEntity, disciplineMult: number): number {
  const passives = player.usesSkills.passives;
  const mult = passives['apprentice.tick-mult'] ?? 1;
  // Magma Censer: sigils tick harder for each step of the fight's Heat.
  const heat = 1 + (passives['apprentice.heat-tick'] ?? 0) * heatOf(player);
  return Math.max(1, Math.round(player.dealsDamage.attack * SIGIL_TICK_PCT * mult * disciplineMult * heat * pieceTierScale(1)));
}

/** Lay `count` sigils on `target` (at most the cap, unless `past`). */
export function laySigils(world: World, player: PlayerEntity, target: MonsterEntity, count: number, cap: number, past = false, age = 0): void {
  if (count <= 0 || target.hasHealth.hp <= 0) return;
  const passives = player.usesSkills.passives;
  const dp = disciplineParamsOf(payoffsOf(world, player)?.discipline ?? null);
  const speed = Math.max(0.1, (passives['apprentice.tick-speed'] ?? 1) * (dp['tickSpeed'] ?? 1));
  const tickMs = Math.round(SIGIL_TICK_MS / speed);
  // Dune Staff: sigils last longer on far enemies.
  const far = Math.hypot(target.hasPosition.current.x - player.hasPosition.current.x, target.hasPosition.current.y - player.hasPosition.current.y) > FAR_PX;
  const farLinger = far ? 1 + (passives['apprentice.far-linger'] ?? 0) : 1;
  // Glacial Wand: sigils on a chilled or slowed enemy last longer.
  const slowed = (passives['apprentice.chill-linger'] ?? 0) > 1
    && target.tracksCombat.statusEffects.some((e) => e.remainingMs !== 0 && holdKindOfStatusId(e.id) === 'slowed');
  const chillLinger = slowed ? passives['apprentice.chill-linger']! : 1;
  const lifeMs = Math.round((SIGIL_LIFE_MS * (passives['apprentice.linger'] ?? 1) * farLinger * chillLinger) / speed);
  const damage = sigilDamage(player, dp['sigilDamageMult'] ?? 1);
  const before = getStatusEffect(target.tracksCombat, DOT_EFFECT_ID)?.stacks ?? 0;
  const effect = applyStatusEffect(target.tracksCombat, {
    id: DOT_EFFECT_ID,
    maxStacks: Math.max(cap, past ? 99 : cap),
    instanced: false,
    sourceId: player.isPlayer.id,
    remainingMs: lifeMs,
    refreshable: true,
    data: { damagePerStack: damage, nextTickIn: tickMs, tickIntervalMs: tickMs, baseTickMs: tickMs, tickOnExpire: 1 },
  });
  // Re-applying adds one stack at a time; add the rest, honouring the cap.
  for (let i = 1; i < count; i++) {
    if (!past && effect.stacks >= cap) break;
    effect.stacks += 1;
  }
  if (!past && effect.stacks > cap) effect.stacks = cap;
  effect.data['damagePerStack'] = damage;
  effect.data['baseDamage'] = damage;
  effect.data['tickIntervalMs'] = tickMs;
  effect.data['baseTickMs'] = tickMs;
  effect.remainingMs = lifeMs;
  attachMarker(world, target, 'hasDot');
  noteApprentice(player, 'sigils-laid', effect.stacks - before);
  if (payoffsOf(world, player)?.specialization === SPEC_RIPENING) noteSigilsLaid(effect, effect.stacks - before, age);
  // `mechanic-fired`: a full bar is the class's moment, once per target per fill.
  if (cap > 0 && effect.stacks >= cap) {
    if (effect.data['maxStackFired'] !== 1) {
      effect.data['maxStackFired'] = 1;
      emitMechanicFired(world, player);
    }
  } else if (effect.data['maxStackFired'] === 1) {
    effect.data['maxStackFired'] = 0;
  }
}

export function sigilsOn(player: PlayerEntity, monster: MonsterEntity): number {
  const effect = getStatusEffect(monster.tracksCombat, DOT_EFFECT_ID);
  return effect && effect.sourceId === player.isPlayer.id ? effect.stacks : 0;
}

export function spend(monster: MonsterEntity): number {
  const effect = getStatusEffect(monster.tracksCombat, DOT_EFFECT_ID);
  if (!effect) return 0;
  const stacks = effect.stacks;
  removeStatusEffect(monster.tracksCombat, DOT_EFFECT_ID);
  return stacks;
}

export const nearestTo = (monsters: MonsterEntity[], at: { x: number; y: number }): MonsterEntity[] =>
  [...monsters].sort((a, b) => Math.hypot(a.hasPosition.current.x - at.x, a.hasPosition.current.y - at.y) - Math.hypot(b.hasPosition.current.x - at.x, b.hasPosition.current.y - at.y));

// ── Payoffs ──────────────────────────────────────────────────────────────────

export function payoffMult(player: PlayerEntity): number {
  return 1 + (player.usesSkills.passives['apprentice.payoff-pct'] ?? 0);
}

/**
 * Seize `target`: spend its sigils to hold it and break its wind-up. Frostcrack (T4) is the same
 * hold on a shielded or shelled enemy; Seize III also cancels the delayed attacks it had laid.
 * False when it carries no sigils.
 */
export function seize(world: World, player: PlayerEntity, p: Payoffs, target: MonsterEntity, now: number): boolean {
  const params = PIECES.get('apprentice-seize')?.params ?? {};
  const passives = player.usesSkills.passives;
  const cs = player.tracksCombat;
  const n = spend(target);
  if (n <= 0) return false;
  let hold = Math.min(HOLD_MAX_MS, (params['holdBase'] ?? 500) + n * (params['holdPerSigil'] ?? 150));
  // Petrify: the Seize holds longer, and the held enemy takes more damage.
  if (p.trophy?.id === 'apprentice-relic-mountain') hold *= trophyParam(p, 'holdMult', 1.6);
  const wasCasting = momentActive(world, player, 'enemy-winds-up', undefined, now);
  if (p.discipline === FROST_DISCIPLINE) {
    // Frost: Seize is a real freeze; a boss that accepts no control turns brittle instead.
    freezeOrBrittle(world, player, p, target, Math.round(hold));
  } else {
    applyStun(target.tracksCombat, Math.round(hold), player.isPlayer.id);
  }
  // Petrify: the held enemy takes more damage (rank 2: from your ticks too).
  if (p.trophy?.id === 'apprentice-relic-mountain') {
    applyStatusEffect(target.tracksCombat, {
      id: HELD_EFFECT_ID, maxStacks: 1, remainingMs: Math.round(hold), refreshable: true, sourceId: player.isPlayer.id,
      data: { totalMs: Math.round(hold), damageTakenPct: trophyParam(p, 'damageTakenPct', 0.2), tickPct: trophyParam(p, 'tickDamageTakenPct', 0) },
    });
  }
  abortMonsterCast(world, target);
  // Seize III: its delayed attacks (fault lines) are cancelled too.
  if ((p.ranks.get('apprentice-seize') ?? 1) >= 3) cancelDelayedAttacks(world, target);
  setResource(target.tracksCombat, SEIZED_UNTIL, now + hold);
  noteSeize(world, player, p, target, Math.round(hold), now);
  if (wasCasting) noteApprentice(player, 'seize-broke-windup');
  // Still Mind: after a Seize breaks a wind-up, Recovery triples for a few seconds.
  if (wasCasting) activateRecoveryBoost(cs, passives['apprentice.still-mind'] ?? 0);
  return true;
}

/** Fire one payoff on `target`; false when it had nothing to do (no cooldown is spent). */
function firePayoff(world: World, player: PlayerEntity, p: Payoffs, piece: ApprenticePiece, target: MonsterEntity, now: number): boolean {
  const params = piece.params;
  const sigils = sigilsOn(player, target);
  const passives = player.usesSkills.passives;
  const cs = player.tracksCombat;
  switch (piece.id) {
    case 'apprentice-detonate': {
      if (sigils <= 0) return false;
      detonate(world, player, p, target, params['payoffPct'] ?? 0.8, now);
      return true;
    }
    case 'apprentice-spread':
      return false; // continuous: handled in `updateApprentice`
    case 'apprentice-numb': {
      const n = spend(target);
      if (n <= 0) return false;
      const slow = Math.min(0.8, (params['slowBase'] ?? 0.2) + n * (params['slowPerSigil'] ?? 0.05));
      const ms = (params['msBase'] ?? 2000) + n * (params['msPerSigil'] ?? 400);
      applyMonsterSlow(world, target, slow, ms, player.isPlayer.id);
      setResource(target.tracksCombat, NUMBED_UNTIL, now + ms);
      const numbed = getStatusEffect(target.tracksCombat, ABILITY_SLOW_EFFECT_ID);
      // Numb slows its attacks too, not only its movement (OV-APPRENTICE fix: it wrote no attack slow).
      if (numbed) numbed.data['attackSlowPct'] = Math.max(numbed.data['attackSlowPct'] ?? 0, slow);
      // Numb II: its wind-ups also take longer, slowed as much as the rest of it (the core reads the key).
      if (numbed && (p.ranks.get('apprentice-numb') ?? 1) >= 2) numbed.data[WINDUP_SLOW_PCT_KEY] = Math.max(numbed.data[WINDUP_SLOW_PCT_KEY] ?? 0, slow);
      return true;
    }
    case 'apprentice-siphon': {
      const n = spend(target);
      if (n <= 0) return false;
      const heal = (n * (params['healPerSigil'] ?? 0.02) * player.hasHealth.maxHp) * (1 + (passives['apprentice.siphon-pct'] ?? 0)) * payoffMult(player);
      applyHealToPlayer(player, cs, heal, world);
      noteApprentice(player, 'siphon-heal', Math.round(heal));
      // Siphon II: it also washes a poison, bleed or Corrosion off you.
      if ((p.ranks.get('apprentice-siphon') ?? 1) >= 2) tidalDraw(world, player, washOffDebuffs(player));
      // Glut: the Siphon also drains every enemy near the target.
      if (p.trophy?.id === 'apprentice-relic-swamp') {
        for (const other of playerAoeTargets(world, player, target.hasPosition.current, trophyParam(p, 'radius', 160), target.isMonster.id)) {
          const m = spend(other);
          if (m > 0) applyHealToPlayer(player, cs, m * (params['healPerSigil'] ?? 0.02) * player.hasHealth.maxHp * (1 + (passives['apprentice.siphon-pct'] ?? 0)), world);
        }
      }
      return true;
    }
    case 'apprentice-seize':
      return seize(world, player, p, target, now);
    case 'apprentice-converge': {
      const around = playerAoeTargets(world, player, target.hasPosition.current, params['radius'] ?? 180, target.isMonster.id);
      let pulled = 0;
      for (const other of around) pulled += spend(other);
      if (pulled <= 0) return false;
      laySigils(world, player, target, pulled, p.cap, true);
      return true;
    }
    default:
      return firePayoffT2(world, player, p, piece, target, now);
  }
}

function targetOf(world: World, player: PlayerEntity): MonsterEntity | undefined {
  const id = player.hasAttackTarget?.targetId;
  const monster = id ? world.getMonsterEntity(id) : undefined;
  return monster && monster.hasHealth.hp > 0 ? monster : undefined;
}

/** Per-tick Apprentice: the payoff rules, Spread, Brood Sigils and the lines' factors. */
export function updateApprentice(world: World, player: PlayerEntity, dt: number, now: number): void {
  const p = payoffsOf(world, player);
  if (!p) return;
  const cs = player.tracksCombat;
  const passives = player.usesSkills.passives;
  const target = targetOf(world, player);

  // T2: the disciplines' running rules, Fuse, Seep, Scent and the debuff watch.
  updateApprenticeT2(world, player, p, target, dt, now);
  // T3: the specializations' running rules, Seize II, Frostheart, Magma Core, the Chill watch.
  updateApprenticeT3(world, player, p, dt, now);
  // T4: the leaves, Pyre, Pressure Fuse, the Abyssal Censer's debuff count.
  updateApprenticeT4(world, player, p, now);

  // Payoff rules: at a moment, the first placement whose conditions hold fires.
  if (target) {
    const done = new Set<string>();
    for (const placement of p.config.placements) {
      if (done.has(placement.moment) || !p.owned.has(placement.pieceId)) continue;
      const piece = PIECES.get(placement.pieceId);
      if (!piece) continue;
      if (now < getResource(cs, cdKey(piece.id))) continue;
      if (!momentHolds(world, player, placement.moment, target, now)) continue;
      if (!conditionsHold(world, player, placement.conditions, now)) continue;
      // Spread acts continuously (below), but while its rule holds it is the one that answers the moment.
      // Under the Poison discipline the plague spreads on its own, so the moment is free.
      if (piece.id === 'apprentice-spread') { if (p.discipline !== POISON_DISCIPLINE) done.add(placement.moment); continue; }
      if (!firePayoff(world, player, p, piece, target, now)) continue;
      noteApprentice(player, piece.id.replace(/^apprentice-/, ''));
      done.add(placement.moment);
      let cd = piece.params['cooldownMs'] ?? 0;
      if (piece.id === 'apprentice-siphon') cd *= 1 - (passives['apprentice.siphon-cd-pct'] ?? 0);
      setResource(cs, cdKey(piece.id), now + cd);
    }
  }

  // Spread: a full target keeps passing a sigil to its nearest neighbour (Outbreak: two).
  const spread = p.config.placements.find((placement) => placement.pieceId === 'apprentice-spread');
  if (target && spread && p.owned.has('apprentice-spread') && p.discipline !== POISON_DISCIPLINE && now >= getResource(cs, SPREAD_AT)
    && momentActive(world, player, spread.moment, undefined, now) && conditionsHold(world, player, spread.conditions, now)) {
    const neighbours = (p.trophy?.id === 'apprentice-relic-plains' ? trophyParam(p, 'neighbours', 2) : PIECES.get('apprentice-spread')!.params['neighbours'] ?? 1)
      + (p.trophy?.id === 'apprentice-relic-desert' ? trophyParam(p, 'extraNeighbours', 0) : 0);
    const nearby = nearestTo(playerAoeTargets(world, player, target.hasPosition.current, 200, target.isMonster.id), target.hasPosition.current);
    // Dune Wind: a Spread can leap any distance to an enemy already carrying your sigils.
    if (p.trophy?.id === 'apprentice-relic-desert') {
      const far = nearestTo([...world.monsterEntitiesInNode(player.hasPosition.nodeId)].filter((m) => m !== target && m.hasHealth.hp > 0 && sigilsOn(player, m) > 0 && !nearby.includes(m)), target.hasPosition.current);
      nearby.push(...far);
    }
    // Spread II: it also reaches a hiding or fleeing enemy anywhere within your reach.
    if ((p.ranks.get('apprentice-spread') ?? 1) >= 2) nearby.splice(0, nearby.length, ...new Set([...hidersInReach(world, player, target.isMonster.id), ...nearby]));
    const others = nearby
      .filter((monster) => sigilsOn(player, monster) < p.cap)
      .slice(0, neighbours);
    if (others.length > 0) {
      for (const other of others) laySigils(world, player, other, 1, p.cap);
      noteApprentice(player, 'spread-pass', others.length);
      setResource(cs, SPREAD_AT, now + (PIECES.get('apprentice-spread')!.params['everyMs'] ?? 1000));
    }
  }

  // Brood Sigils: an enemy carrying three or more grows another every few seconds.
  if (p.trophy?.id === 'apprentice-relic-cave' && now >= getResource(cs, BROOD_AT)) {
    setResource(cs, BROOD_AT, now + trophyParam(p, 'everyMs', 2000));
    for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
      if (monster.hasHealth.hp > 0 && sigilsOn(player, monster) >= (p.trophy.params['minSigils'] ?? 3)) laySigils(world, player, monster, 1, p.cap);
    }
  }

  // The lines' factors: Feeding Swarm, Numbing Calm, Long Draw (Recovery), Give Ground (speed).
  let recovery = 1;
  let carrying = 0;
  let numbed = 0;
  let fullElite = false;
  let touching = false;
  let inReach = 0;
  let inReachCarrying = 0;
  let frozenCarrier = false;
  let carriers = 0;
  let risenCarriers = 0;
  const reach = player.performsAttack.attackRange + REACH_SLACK_PX;
  for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
    if (monster.hasHealth.hp <= 0) continue;
    const n = sigilsOn(player, monster);
    const near = Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y) <= 260;
    if (n > 0 && near) carrying++;
    if (n > 0) carriers++;
    if (n > 0 && monster.isRaised) risenCarriers++;
    if (n > 0 && isFrozenOrBrittle(monster)) frozenCarrier = true;
    if (n > 0 && Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y) <= 70) touching = true;
    if (near && getResource(monster.tracksCombat, NUMBED_UNTIL) > now) numbed++;
    if (n >= p.cap && (monster.isMonster.isBoss === true)) fullElite = true;
    if (Math.hypot(monster.hasPosition.current.x - player.hasPosition.current.x, monster.hasPosition.current.y - player.hasPosition.current.y) <= reach) {
      inReach++;
      if (n > 0) inReachCarrying++;
    }
  }
  const feeding = passives['apprentice.feeding'] ?? 0;
  if (feeding > 0) recovery *= 1 + Math.min(carrying, 5) * feeding;
  if ((passives['apprentice.numbing-calm'] ?? 0) > 1 && numbed >= 2) recovery *= passives['apprentice.numbing-calm']!;
  if ((passives['apprentice.long-draw'] ?? 0) > 1 && fullElite) recovery *= passives['apprentice.long-draw']!;
  // Patient Hunter: Recovery multiplied while every enemy within your reach carries your sigils.
  if ((passives['apprentice.patient-hunter'] ?? 0) > 1 && inReach > 0 && inReachCarrying === inReach) recovery *= passives['apprentice.patient-hunter']!;
  // Cold Comfort: Recovery multiplied while an enemy carrying your sigils is frozen or brittle.
  if ((passives['apprentice.cold-comfort'] ?? 0) > 1 && frozenCarrier) recovery *= passives['apprentice.cold-comfort']!;
  // Banked Coals: Recovery rises with the Heat while three or more enemies carry your sigils.
  if ((passives['apprentice.banked-coals'] ?? 0) > 0 && carriers >= 3) recovery *= 1 + heatOf(player) * passives['apprentice.banked-coals']!;
  // Last Rites: Recovery rises for each risen enemy carrying your sigils (capped).
  if ((passives['apprentice.last-rites'] ?? 0) > 0) recovery *= 1 + Math.min(risenCarriers, 5) * passives['apprentice.last-rites']!;
  if (getResource(cs, APPRENTICE_RECOVERY_X) !== recovery) setResource(cs, APPRENTICE_RECOVERY_X, recovery);
  const move = touching && (passives['apprentice.give-ground'] ?? 0) > 0 ? 1 + passives['apprentice.give-ground']! : 1;
  if (getResource(cs, APPRENTICE_MOVE_X) !== move) setResource(cs, APPRENTICE_MOVE_X, move);
  flushApprentice(player, now, p.cap);
  void dt;
}

// ── Listeners ────────────────────────────────────────────────────────────────

export function registerApprentice(): void {
  // Hits lay sigils; the hit itself keeps its full damage (no conversion).
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster' || ctx.formation) return;
    const player = ctx.attacker as PlayerEntity;
    const p = payoffsOf(world, player);
    if (!p || ctx.metadata['evaded'] === true) return;
    if (ctx.metadata['evadeFull'] === true) return;
    const target = ctx.defender as MonsterEntity;
    const passives = player.usesSkills.passives;
    let count = Math.max(1, Math.round(passives['apprentice.sigils-per-hit'] ?? 1));
    // Firstbrand: the first hit on an enemy carrying none of your sigils lays three at once.
    if (p.trophy?.id === 'apprentice-relic-forest' && sigilsOn(player, target) === 0) {
      const share = trophyParam(p, 'barShare', 0);
      count = Math.max(count, share > 0 ? Math.ceil(p.cap * share) : trophyParam(p, 'sigils', 3));
    }
    laySigils(world, player, target, count, p.cap);
    // Branching Wand: each hit also lays a sigil on the nearest other enemy.
    if ((passives['apprentice.branching'] ?? 0) > 0) {
      const other = nearestTo(playerAoeTargets(world, player, target.hasPosition.current, 220, target.isMonster.id), target.hasPosition.current)[0];
      if (other) laySigils(world, player, other, 1, p.cap);
    }
  });

  // Warding Sigils and Sigil Weight: the enemies carrying your sigils hurt you less.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender as PlayerEntity;
    if (!hasPayoffs(player)) return;
    const passives = player.usesSkills.passives;
    const warding = passives['apprentice.warding'] ?? 0;
    if (warding > 0) {
      let carrying = 0;
      for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) if (monster.hasHealth.hp > 0 && sigilsOn(player, monster) > 0) carrying++;
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - Math.min(0.3, carrying * warding))));
    }
    const weight = passives['apprentice.sigil-weight'] ?? 0;
    if (weight > 0 && (ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string')) {
      const n = sigilsOn(player, ctx.attacker as MonsterEntity);
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - Math.min(1 / 3, n * weight))));
    }
  });
  registerApprenticeT2();
  registerApprenticeT3();
  registerApprenticeT4();
  void attackNow;
}
