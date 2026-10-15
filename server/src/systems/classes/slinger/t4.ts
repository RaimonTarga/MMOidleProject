/**
 * The Slinger's tier 4 pieces that live apart from the Loadout runtime (bible §10.7, §10.16): the leaves'
 * state (Light Hands, Stakes, Steady Nerve, Quick Swap), the shells Frost II and Thermite read, Exploit's
 * debuff count, Quake Round's aftershocks, Hallowed's weakening, and the Wasteland / Trench gear. Every
 * number is a PLACEHOLDER (`tuning.ts`, the kit params).
 */
import {
  ABILITY_UNYIELDING_EFFECT_ID,
  MONSTER_DATABASE,
  applyStatusEffect,
  getCounter,
  getResource,
  getStatusEffect,
  isHarmfulPlayerStatusEffect,
  removeStatusEffect,
  setCounter,
  setResource,
  type StatusEffect,
} from '@mmo-idle/shared';
import { mutateSlice } from '../../../ecs/dirtyHelpers';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../combat/damage/aoeDamage';
import { DEBUFF_IMMUNE_EFFECT } from '../../combat/status/debuffGuard';
import { monsterIgnoresControl } from '../../combat/status/controlImmunity';
import { applyStun } from '../../combat/status/stun';
import { stopEntity } from '../../world/movement';
import {
  DOT_IMMUNE_AT,
  OBSIDIAN_MONSTERS,
  OBSIDIAN_WARD_IDS,
  STAKES_EVERY_MS,
  STAKES_HOLD_MS,
  STAKES_PX,
  STEADY_NERVE_MS,
} from './tuning';

/** A leaf the character has picked (the Passive Tree puts its id in `unlockedSkills`). */
export function leafPicked(player: PlayerEntity, id: string): boolean {
  return player.usesSkills.unlockedSkills.includes(id);
}

/** Enemies fighting this player in its node (Vigil, Toll Round). */
export function fightSize(world: World, player: PlayerEntity): number {
  let count = 0;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasHealth.hp <= 0 || monster.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
    if (monster.hasAggroTarget.targetKind === 'player' && monster.hasAggroTarget.targetId === player.isPlayer.id) count++;
  }
  return count;
}

/** A charge cut short: the enemy stops where it is. */
export function stopCharge(world: World, monster: MonsterEntity): void {
  if ((monster.controlsMonster.chargeRemainingMs ?? 0) <= 0) return;
  monster.controlsMonster.chargeRemainingMs = 0;
  stopEntity(world, monster);
}

// ── Shells (Frost II, Thermite) ──────────────────────────────────────────────

/** The periodic enemy shield's remaining amount (a counter private to `monsterMechanics.ts`; same key). */
const PERIODIC_SHIELD_AMOUNT = 't4EnemyShieldAmount';

type ShellKind = 'ice' | 'obsidian';

const liveWards = (monster: MonsterEntity): StatusEffect[] =>
  monster.tracksCombat.statusEffects.filter((effect) => effect.remainingMs !== 0 && effect.data['monsterWard'] === 1 && (effect.data['wardAmount'] ?? 0) > 0);

function wardKind(ward: StatusEffect): ShellKind | null {
  if (ward.data['monsterWardShatter'] === 1 || ward.id === 'barrier:ice-armor') return 'ice';
  return OBSIDIAN_WARD_IDS.includes(ward.id) ? 'obsidian' : null;
}

function periodicKind(monster: MonsterEntity): ShellKind | null {
  if (getCounter(monster.tracksCombat, PERIODIC_SHIELD_AMOUNT) <= 0) return null;
  if (MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.enemyShield?.shatter || monster.scriptsBoss?.shieldOverride?.shatter) return 'ice';
  return OBSIDIAN_MONSTERS.includes(monster.isMonster.monsterTypeId) ? 'obsidian' : null;
}

/** Ice Armor is up on the target (Frost II builds extra chill on it). */
export function hasIceArmor(monster: MonsterEntity): boolean {
  return liveWards(monster).some((ward) => wardKind(ward) === 'ice') || periodicKind(monster) === 'ice';
}

/**
 * Thermite: the burn eats shells. `amount` wears down every ward and the periodic shield; an ice or obsidian
 * shell loses `kindMult` times as much.
 */
export function eatShells(monster: MonsterEntity, amount: number, kindMult: number): void {
  if (amount <= 0) return;
  for (const ward of liveWards(monster)) {
    const take = Math.min(ward.data['wardAmount'] ?? 0, amount * (wardKind(ward) ? kindMult : 1));
    ward.data['wardAmount'] = (ward.data['wardAmount'] ?? 0) - take;
    if (ward.data['wardAmount']! <= 0) removeStatusEffect(monster.tracksCombat, ward.id);
  }
  const periodic = getCounter(monster.tracksCombat, PERIODIC_SHIELD_AMOUNT);
  if (periodic > 0) {
    setCounter(monster.tracksCombat, PERIODIC_SHIELD_AMOUNT, Math.max(0, periodic - amount * (periodicKind(monster) ? kindMult : 1)));
  }
}

// ── Exploit, Improvise, Hallowed ─────────────────────────────────────────────

/** Different harmful effects on a monster (Exploit). Barriers and wards are not debuffs. */
export function distinctMonsterDebuffs(monster: MonsterEntity): number {
  const ids = new Set<string>();
  for (const effect of monster.tracksCombat.statusEffects) {
    if (effect.remainingMs === 0 || effect.stacks <= 0 || effect.data['monsterWard'] === 1) continue;
    ids.add(effect.id);
  }
  return ids.size;
}

/** Different harmful effects on the player (Ballast). The room's ambient ramp is the room, not a debuff. */
export function distinctPlayerDebuffs(player: PlayerEntity): number {
  const ids = new Set<string>();
  for (const effect of player.tracksCombat.statusEffects) {
    if (effect.remainingMs === 0 || effect.stacks <= 0 || (effect.data['isAmbientRamp'] ?? 0) !== 0) continue;
    if (isHarmfulPlayerStatusEffect(effect.id, effect.data)) ids.add(effect.id);
  }
  return ids.size;
}

const CONTROL_CLIPS: readonly string[] = ['slinger-snare', 'slinger-stopping', 'slinger-frost', 'slinger-tether'];
const POISON_CLIPS: readonly string[] = ['slinger-venom', 'slinger-incendiary', 'slinger-thermite'];

/** Improvise: the loaded clip does nothing to this target (control on a boss that accepts none, damage over time on the immune). */
export function clipDoesNothing(target: MonsterEntity, clip: string): boolean {
  if (CONTROL_CLIPS.includes(clip)) return monsterIgnoresControl(target);
  if (POISON_CLIPS.includes(clip)) return (MONSTER_DATABASE.get(target.isMonster.monsterTypeId)?.dotResistance ?? 0) >= DOT_IMMUNE_AT;
  return false;
}

const WEAKENED = 'slinger.hallowed.weak';

/** Hallowed: a risen enemy struck by these rounds is weakened (once). STAND-IN for "they rise weaker". */
export function weakenRisen(world: World, risen: MonsterEntity, pct: number): void {
  if (pct <= 0 || getResource(risen.tracksCombat, WEAKENED) > 0) return;
  setResource(risen.tracksCombat, WEAKENED, 1);
  mutateSlice(world, risen, 'dealsDamage', (slice) => {
    slice.attack = Math.max(1, Math.round(slice.attack * (1 - pct)));
  });
}

// ── Quake Round IV: aftershocks ──────────────────────────────────────────────

const AFTER = { x: 'slinger.after.x', y: 'slinger.after.y', r: 'slinger.after.r', left: 'slinger.after.left', at: 'slinger.after.at', dmg: 'slinger.after.dmg', every: 'slinger.after.every' } as const;

/** The blast leaves aftershocks at its centre. One set at a time; a new blast replaces the old. */
export function queueAftershocks(player: PlayerEntity, at: { x: number; y: number }, radius: number, count: number, damage: number, everyMs: number, now: number): void {
  const cs = player.tracksCombat;
  setResource(cs, AFTER.x, at.x);
  setResource(cs, AFTER.y, at.y);
  setResource(cs, AFTER.r, radius);
  setResource(cs, AFTER.left, count);
  setResource(cs, AFTER.dmg, damage);
  setResource(cs, AFTER.every, everyMs);
  setResource(cs, AFTER.at, now + everyMs);
}

export function aftershockTick(world: World, player: PlayerEntity, now: number): void {
  const cs = player.tracksCombat;
  const left = getResource(cs, AFTER.left);
  if (left <= 0 || now < getResource(cs, AFTER.at)) return;
  const center = { x: getResource(cs, AFTER.x), y: getResource(cs, AFTER.y) };
  const victims = playerAoeTargets(world, player, center, getResource(cs, AFTER.r));
  if (victims.length > 0) applyPlayerAoeTo(world, player, victims, getResource(cs, AFTER.dmg), 'player', {}, {});
  setResource(cs, AFTER.left, left - 1);
  setResource(cs, AFTER.at, now + getResource(cs, AFTER.every));
}

// ── Leaves ───────────────────────────────────────────────────────────────────

const LIGHT_HANDS_AT = 'slinger.lighthands.at';

/** Light Hands: true for the first hit in each window (and it starts the window). */
export function lightHandsHit(player: PlayerEntity, everyMs: number, now: number): boolean {
  const cs = player.tracksCombat;
  if (now - getResource(cs, LIGHT_HANDS_AT) < everyMs) return false;
  setResource(cs, LIGHT_HANDS_AT, now);
  return true;
}

/** Slip Away's speed layer, written by the Slinger's tick and read by `regroupSpeedMult`. */
export const SLIP_AWAY_X = 'slinger.slipAwayX';

/** Stakes: a charger that reaches your feet is stopped dead, and held for a moment unless it ignores control. */
export function stakesTick(world: World, player: PlayerEntity, now: number): void {
  const at = player.hasPosition.current;
  const key = `slinger.stakes.${player.isPlayer.id}`;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetId !== player.isPlayer.id || monster.hasPosition.nodeId !== player.hasPosition.nodeId) continue;
    if (monster.hasHealth.hp <= 0 || (monster.controlsMonster.chargeRemainingMs ?? 0) <= 0) continue;
    if (Math.hypot(monster.hasPosition.current.x - at.x, monster.hasPosition.current.y - at.y) > STAKES_PX) continue;
    if (now - getResource(monster.tracksCombat, key) < STAKES_EVERY_MS) continue;
    setResource(monster.tracksCombat, key, now);
    stopCharge(world, monster);
    if (!monsterIgnoresControl(monster)) applyStun(monster.tracksCombat, STAKES_HOLD_MS, player.isPlayer.id);
  }
}

/**
 * Steady Nerve: while an enemy is in melee with you, stuns (and every other hard control) are refused, through the
 * same status Endure's Unyielding keystone uses. A longer one already on you is left alone. STAND-IN for knockback:
 * the forced-movement resist lives in `knockback.ts` (outside the Slinger's paths).
 */
export function steadyNerveTick(player: PlayerEntity): void {
  const cs = player.tracksCombat;
  const held = getStatusEffect(cs, ABILITY_UNYIELDING_EFFECT_ID);
  if (held && (held.remainingMs < 0 || held.remainingMs > STEADY_NERVE_MS * 1.5)) return;
  applyStatusEffect(cs, {
    id: ABILITY_UNYIELDING_EFFECT_ID, maxStacks: 1, remainingMs: STEADY_NERVE_MS, refreshable: true, sourceId: player.isPlayer.id,
    data: { totalMs: STEADY_NERVE_MS },
  });
}

/** Pressure Suit: while you reload, no debuff can land (the generic immunity the debuff guard already asks about). */
export function pressureSuitTick(player: PlayerEntity): void {
  applyStatusEffect(player.tracksCombat, {
    id: DEBUFF_IMMUNE_EFFECT, maxStacks: 1, remainingMs: STEADY_NERVE_MS, refreshable: true, sourceId: player.isPlayer.id,
    data: { totalMs: STEADY_NERVE_MS },
  });
}

/** Quick Swap: the rounds a switch reload threw away, handed back with the next clip. */
export const SWAP_CARRY = 'slinger.swap.carry';
