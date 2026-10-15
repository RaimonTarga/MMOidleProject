/**
 * The Striker's gear at runtime (class-first build plan CS.4; bible §12.4, §12.10): its
 * weapon jobs and the armor and charm lines that are its own. The lines' generic defenses
 * (shorter control, the DoT cleanse, faster out-of-combat healing) live with the defense
 * systems; Weighty is a stat (the recalc). Every number is a `striker.*` key on the gear.
 *
 * The four rules for a Striker defensive line (§12.10): nothing triggers on your hits or the
 * finisher, nothing scales with attack speed, nothing makes weak hitters irrelevant, no
 * resource doubles as a shield. "While you keep attacking" is a state, read here as having
 * swung within the last few seconds.
 */
import { getResource, setResource } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyPlayerAoe, applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { BLEED_EFFECT_IDS } from '../../../combat/damage/bleedIds';
import { attackNow, registerCombatListener, type CombatContext } from '../../../combat/engine/combatPipeline';
import { fightSnapshotFor } from '../../../combat/moments/fightSnapshot';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { strikerLeafDotDamage } from './strikerLeaves';

/** "While you keep attacking": a swing within this long. PLACEHOLDER. */
export const STRIKER_ATTACKING_MS = 2500;
/** Reaper's Scythe splashes to enemies this close to the target (px). PLACEHOLDER. */
const SPLASH_RADIUS = 100;
/** Broadblade's nick reaches enemies this close to the target (px). PLACEHOLDER. */
const NICK_RADIUS = 90;
/** Shoulder Through counts at most this many extra enemies. PLACEHOLDER. */
const SHOULDER_THROUGH_MAX_ENEMIES = 4;

/** Executioner's Blade bites below this share of the target's HP (bible 12.16: half). */
const EXECUTE_BELOW = 0.5;

const GRIT_POOL = 'striker.grit.pool';
const GRIT_RATE = 'striker.grit.ratePerMs';

export function strikerIsAttacking(player: PlayerEntity, now: number): boolean {
  return now - player.performsAttack.lastAttackAt <= STRIKER_ATTACKING_MS;
}

function bleedingOrRotting(target: MonsterEntity): boolean {
  return target.tracksCombat.statusEffects.some((e) => BLEED_EFFECT_IDS.includes(e.id) && e.stacks > 0);
}

/** The swing multipliers a weapon job adds: Bastard Sword, Maul, Hooked Sickle. */
export function strikerWeaponDamageMult(
  player: PlayerEntity,
  target: MonsterEntity,
  hit: { finisher: boolean; damageTechnique: boolean },
): number {
  const p = player.usesSkills.passives;
  let mult = 1;
  if (hit.finisher || hit.damageTechnique) mult *= 1 + (p['striker.technique-damage-pct'] ?? 0);
  if (hit.finisher) mult *= 1 + (p['striker.finisher-pct'] ?? 0);
  if (hit.finisher && bleedingOrRotting(target)) mult *= 1 + (p['striker.finisher-vs-dot-pct'] ?? 0);
  // Executioner's Blade: damage techniques and the finisher hit harder below half HP.
  if ((hit.finisher || hit.damageTechnique) && target.hasHealth.hp < target.hasHealth.maxHp * EXECUTE_BELOW) {
    mult *= 1 + (p['striker.execute-pct'] ?? 0);
  }
  return mult;
}

/** The strikes a weapon job adds to every swing: Broadblade's nick, Twin Fangs' extra strike. */
export function runStrikerWeaponStrikes(world: World, player: PlayerEntity, ctx: CombatContext): void {
  if (ctx.defenderType !== 'monster') return;
  const target = ctx.defender;
  const p = player.usesSkills.passives;
  const nick = p['striker.nick-pct'] ?? 0;
  if (nick > 0) {
    const at = target.hasPosition.current;
    const nearest = playerAoeTargets(world, player, at, NICK_RADIUS, target.isMonster.id)
      .sort((a, b) => dist2(a, at) - dist2(b, at))[0];
    if (nearest) applyPlayerAoeTo(world, player, [nearest], ctx.damage * nick, 'player', {}, { feedsWeaponReservoir: true });
  }
  const extra = p['striker.extra-strike-pct'] ?? 0;
  if (extra > 0) applyPlayerAoeTo(world, player, [target], ctx.damage * extra, 'player', {}, { feedsWeaponReservoir: true });
  // Reaper's Scythe: every beat splashes part of its damage to the enemies around the target.
  const splash = p['striker.splash-pct'] ?? 0;
  if (splash > 0) {
    applyPlayerAoe(world, player, target.hasPosition.current, SPLASH_RADIUS, ctx.damage * splash,
      target.isMonster.id, 'player', {}, { feedsWeaponReservoir: true });
  }
}

function dist2(m: MonsterEntity, at: { x: number; y: number }): number {
  const dx = m.hasPosition.current.x - at.x;
  const dy = m.hasPosition.current.y - at.y;
  return dx * dx + dy * dy;
}

/**
 * What a monster damage-over-time tick may take from a Striker (called by the DoT tick on a
 * player): the T4 leaves' share first (Unbreakable's window, Thick Blood), then Bloodless —
 * while you keep attacking, damage over time can't take you below a share of your HP.
 */
export function strikerDotFloor(player: PlayerEntity, hpDamage: number, now: number): number {
  hpDamage = strikerLeafDotDamage(player, hpDamage);
  const floorPct = player.usesSkills.passives['striker.dot-floor-pct'] ?? 0;
  if (floorPct <= 0 || !strikerIsAttacking(player, now)) return hpDamage;
  const floor = player.hasHealth.maxHp * floorPct;
  return Math.max(0, Math.min(hpDamage, Math.floor(player.hasHealth.hp - floor)));
}

/** The lines that answer hits taken: Shoulder Through and Grit. */
export function initStrikerGear(): void {
  // Shoulder Through: each extra enemy on you adds a little plating. Registered with the
  // class mechanics, so it lands before evasion, the damage cap and shields, like plating.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender;
    const perEnemy = player.usesSkills.passives['striker.plating-per-enemy'] ?? 0;
    if (perEnemy <= 0) return;
    const extra = Math.min(SHOULDER_THROUGH_MAX_ENEMIES, fightSnapshotFor(world, player, attackNow(ctx)).aggroCount - 1);
    if (extra <= 0) return;
    const plating = perEnemy * extra * (1 - player.mitigatesDamage.damageReduction);
    ctx.damage = Math.max(1, Math.round(ctx.damage - plating));
  });

  // Grit: part of every hit you take heals back over a few seconds while you keep
  // attacking; stop and it is lost (`updateStrikerGear`).
  registerCombatListener('afterHit', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender;
    const pct = player.usesSkills.passives['striker.grit-pct'] ?? 0;
    const ms = player.usesSkills.passives['striker.grit-ms'] ?? 0;
    if (pct <= 0 || ms <= 0) return;
    const cs = player.tracksCombat;
    const pool = getResource(cs, GRIT_POOL) + ctx.damage * pct;
    setResource(cs, GRIT_POOL, pool);
    setResource(cs, GRIT_RATE, pool / ms);
  });
}

/** Grit's heal-back, each tick. */
export function updateStrikerGear(world: World, dt: number, now: number): void {
  for (const player of world.livePlayers) {
    const cs = player.tracksCombat;
    const pool = getResource(cs, GRIT_POOL);
    if (pool <= 0) continue;
    if (!strikerIsAttacking(player, now)) {
      setResource(cs, GRIT_POOL, 0);
      continue;
    }
    const heal = Math.min(pool, getResource(cs, GRIT_RATE) * dt);
    setResource(cs, GRIT_POOL, pool - heal);
    if (heal > 0) applyHealToPlayer(player, cs, heal, world);
  }
}
