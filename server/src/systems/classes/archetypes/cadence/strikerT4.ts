/**
 * The Striker's Tier 4 (class-first build plan T4-STRIKER; bible §12.7, §12.16): the nine leaves
 * that answer "what kills you?" (the spike, the swarm, the slow bleed, one per discipline) and
 * the Wasteland and Trench gear lines (Deathward, Requiem, Clear Mind, Brine Mend). The T4
 * techniques, trophies and weapons (Reaper's Scythe, Exploit) live with the Order and the gear.
 *
 * The leaves are Passive Tree picks, read here from the character (`strikerLeaf`); the rules
 * answer hits taken, so they sit in the combat pipeline (registered with the class mechanics:
 * they land before evasion, the damage cap and shields) and in the per-tick upkeep.
 *
 * Every number is a PLACEHOLDER for the designer (`strikerLeaves.ts`).
 */
import {
  MONSTER_DATABASE,
  getCounter,
  getCooldown,
  isHarmfulPlayerStatusEffect,
  removeStatusEffect,
  setCooldown,
  setCounter,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import type { World } from '../../../../world/World';
import { registerCombatListener, type CombatContext } from '../../../combat/engine/combatPipeline';
import { fightSnapshotFor } from '../../../combat/moments/fightSnapshot';
import { STUN_EFFECT, STUN_IMMUNE_EFFECT } from '../../../combat/status/stun';
import { activateRecoveryBoost } from '../../../defense/regen/recovery';
import {
  CENTERED,
  CENTERED_CUT,
  CENTERED_ENEMIES,
  GHOSTSTEP,
  GHOSTSTEP_COOLDOWN,
  GHOSTSTEP_COOLDOWN_MS,
  GHOSTSTEP_HIT_PCT,
  IMMOVABLE,
  POISE,
  POISE_BELOW,
  POISE_RECOVERY_X,
  READ_THE_BLOW,
  READ_THE_BLOW_CUT,
  SHAKE_IT_OFF,
  SHAKE_IT_OFF_RATE,
  SLIP_MAX,
  SLIP_PER_ENEMY,
  SLIP_THROUGH,
  UNBREAKABLE,
  UNBREAKABLE_SPENT,
  UNBREAKABLE_WINDOW,
  UNBREAKABLE_WINDOW_MS,
  strikerInvulnerableWindow,
  strikerLeaf,
} from './strikerLeaves';
import { enemiesOnPlayer } from './strikerT3';

/** One tick's boost for the Recovery lines (re-armed every tick). */
const BOOST_MS = 500;
/** Deathward: the hit's HP share below which the line applies. */
const DEATHWARD_BELOW = 0.25;
/** Slip Through's deterministic miss accumulator (no RNG, like evasion). */
const SLIP_ACC = 'striker.slip.acc';

/** Whether this monster hit was a telegraphed one (the same reading as the Squire's guards). */
function isTelegraphed(ctx: CombatContext): boolean {
  return ctx.metadata['empoweredAttack'] === true || typeof ctx.metadata['abilityName'] === 'string';
}

/**
 * Record the hit as a full miss, the way evasion does: the evade outcome the damage side and the
 * debuff appliers already read ("DODGE" floater, no ailments unless the monster pierces evade).
 */
function missHit(ctx: CombatContext): void {
  if (ctx.attackerType !== 'monster') return;
  ctx.metadata['evaded'] = true;
  ctx.metadata['evadeMitigation'] = 1;
  const def = MONSTER_DATABASE.get(ctx.attacker.isMonster.monsterTypeId);
  if (!def?.appliesThroughEvade) ctx.metadata['evadeBlocksDebuffs'] = true;
}

/** An ordinary mob (not a boss) is the source of this effect on the player. */
function ordinarySource(world: World, sourceId: string | undefined): boolean {
  const monster = sourceId ? world.getMonsterEntity(sourceId) : undefined;
  return monster !== undefined && !monster.isMonster.isBoss;
}

/**
 * Immovable: ordinary mobs can't stun or slow you. A stun or slow whose source is an ordinary
 * monster is taken off again (with the stun ward it grants), so a boss's control still lands.
 * (Knockback is not covered: see the T4-STRIKER report.)
 */
function shrugOffOrdinaryControl(world: World, player: PlayerEntity): void {
  const cs = player.tracksCombat;
  for (const effect of [...cs.statusEffects]) {
    if (effect.id !== STUN_EFFECT && effect.id !== 'slow') continue;
    if (!ordinarySource(world, effect.sourceId)) continue;
    removeStatusEffect(cs, effect.id);
    if (effect.id === STUN_EFFECT) removeStatusEffect(cs, STUN_IMMUNE_EFFECT);
  }
}

/** The leaves' and gear lines' listeners on hits taken (monster to player). */
export function initStrikerT4(): void {
  // Nothing hurts you in Unbreakable's window: the swing is cancelled like an invulnerable target's.
  registerCombatListener('beforeAttack', (ctx) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    if (strikerInvulnerableWindow(ctx.defender)) ctx.cancelled = true;
  });

  // Slip Through: the more enemies on you, the more of their hits miss. Decided here, before
  // the hit's ailments, like evasion's own roll.
  registerCombatListener('onAttack', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    if (!strikerLeaf(player, SLIP_THROUGH) || ctx.metadata['unevadable'] === true || ctx.metadata['evaded'] === true) return;
    const chance = Math.min(SLIP_MAX, SLIP_PER_ENEMY * enemiesOnPlayer(world, player));
    if (chance <= 0) return;
    const acc = getCounter(player.tracksCombat, SLIP_ACC) + chance;
    if (acc >= 1) {
      setCounter(player.tracksCombat, SLIP_ACC, acc - 1);
      ctx.metadata['strikerMiss'] = true;
      missHit(ctx);
    } else {
      setCounter(player.tracksCombat, SLIP_ACC, acc);
    }
  });

  // The damage side: misses (re-asserted over a graze), the composure leaves and Deathward.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    const cs = player.tracksCombat;
    // Slip Through's miss is a full one even if evasion grazed the same hit.
    if (ctx.metadata['strikerMiss'] === true) missHit(ctx);
    if (ctx.damage <= 0) return;

    // Ghoststep: once every few seconds, a hit bigger than a quarter of your HP misses.
    if (
      strikerLeaf(player, GHOSTSTEP) && ctx.metadata['evaded'] !== true && ctx.metadata['unevadable'] !== true
      && getCooldown(cs, GHOSTSTEP_COOLDOWN) <= 0 && ctx.damage > player.hasHealth.maxHp * GHOSTSTEP_HIT_PCT
    ) {
      setCooldown(cs, GHOSTSTEP_COOLDOWN, GHOSTSTEP_COOLDOWN_MS);
      missHit(ctx);
      return;
    }
    // Read the Blow: telegraphed attacks aimed at you deal half damage (mitigation, not a counter).
    if (strikerLeaf(player, READ_THE_BLOW) && isTelegraphed(ctx)) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - READ_THE_BLOW_CUT)));
    }
    // Centered: while three or more enemies attack you, you take a fifth less damage.
    if (strikerLeaf(player, CENTERED) && enemiesOnPlayer(world, player) >= CENTERED_ENEMIES) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - CENTERED_CUT)));
    }
    // Deathward (the Wasteland's armor line): below a quarter of your HP, you take less damage.
    const ward = player.usesSkills.passives['striker.deathward-pct'] ?? 0;
    if (ward > 0 && player.hasHealth.hp < player.hasHealth.maxHp * DEATHWARD_BELOW) {
      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - ward)));
    }
  });

  // After the hit and its riders: Immovable takes an ordinary mob's stun or slow off; Unbreakable
  // saves a killing blow once per fight (the hit's damage has been paid by now).
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    if (strikerLeaf(player, IMMOVABLE)) shrugOffOrdinaryControl(world, player);
    const cs = player.tracksCombat;
    if (player.hasHealth.hp <= 0 && strikerLeaf(player, UNBREAKABLE) && getCounter(cs, UNBREAKABLE_SPENT) <= 0) {
      player.hasHealth.hp = 1;
      setCounter(cs, UNBREAKABLE_SPENT, 1);
      setCooldown(cs, UNBREAKABLE_WINDOW, UNBREAKABLE_WINDOW_MS);
      markSliceDirty(world, player, 'hasHealth');
    }
  });
}

/** Each tick, for every Striker: the leaves' upkeep and the Wasteland and Trench Recovery lines. */
export function updateStrikerT4(world: World, dt: number, now: number): void {
  for (const player of world.livePlayers) {
    if (!player.usesCadence) continue;
    const cs = player.tracksCombat;
    const passives = player.usesSkills.passives;
    const { hp, maxHp } = player.hasHealth;

    // Poise: below half HP, your Recovery doubles.
    if (strikerLeaf(player, POISE) && hp < maxHp * POISE_BELOW) activateRecoveryBoost(cs, POISE_RECOVERY_X, BOOST_MS);

    // Shake It Off: debuffs on you wear off twice as fast (a timed one loses its clock again).
    if (strikerLeaf(player, SHAKE_IT_OFF)) {
      for (const effect of cs.statusEffects) {
        if (effect.remainingMs <= 0 || effect.stacks <= 0 || !isHarmfulPlayerStatusEffect(effect.id, effect.data)) continue;
        // The room re-applies an environmental effect, so shortening it would do nothing.
        if ((effect.data['isNodeFeature'] ?? 0) !== 0 || (effect.data['isGroundZone'] ?? 0) !== 0) continue;
        effect.remainingMs = Math.max(1, effect.remainingMs - dt * (SHAKE_IT_OFF_RATE - 1));
      }
    }

    // Immovable: a stun or slow from an ordinary mob that landed outside a hit (an ability).
    if (strikerLeaf(player, IMMOVABLE)) shrugOffOrdinaryControl(world, player);

    // Unbreakable returns once the fight is over.
    if (getCounter(cs, UNBREAKABLE_SPENT) > 0 && !fightSnapshotFor(world, player, now).inCombat) {
      setCounter(cs, UNBREAKABLE_SPENT, 0);
    }

    // Requiem: Recovery rises with the number of enemies on you.
    const crowd = passives['striker.crowd-recovery-pct'] ?? 0;
    if (crowd > 0) {
      const enemies = enemiesOnPlayer(world, player);
      if (enemies > 0) activateRecoveryBoost(cs, 1 + crowd * enemies, BOOST_MS);
    }

    // Brine Mend: each different debuff on you raises your Recovery a little.
    const brine = passives['striker.debuff-recovery-pct'] ?? 0;
    if (brine > 0) {
      const debuffs = new Set<string>();
      for (const effect of cs.statusEffects) {
        if (effect.remainingMs !== 0 && effect.stacks > 0 && isHarmfulPlayerStatusEffect(effect.id, effect.data)) debuffs.add(effect.id);
      }
      if (debuffs.size > 0) activateRecoveryBoost(cs, 1 + brine * debuffs.size, BOOST_MS);
    }
  }
}
