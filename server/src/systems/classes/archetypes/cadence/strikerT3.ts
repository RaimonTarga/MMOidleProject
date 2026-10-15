/**
 * The Striker's Tier 3 (class-first build plan T3-STRIKER; bible §12.6, §12.16): the
 * specialization lookup, the Tundra and Volcanic gear (Rimeblade, Bloodfire Axe, Winter Coat,
 * Frostbite Mend, Cinderskin, Fuel) and the small helpers the T3 techniques and trophies share.
 *
 * A leaf of the cadence runtime: it reads the player and the monsters, and imports nothing
 * from `strikerT2.ts` / `order.ts`, so those two can build on it.
 *
 * Every number is a PLACEHOLDER for the designer.
 */
import {
  CHILL_STATUS_ID,
  DAMAGE_TAKEN_PCT_KEY,
  FROST_RAMP_EFFECT_ID,
  STRIKER_KIT,
  TUNDRA_CHILL_EFFECT_ID,
  VOLCANIC_HEAT_EFFECT_ID,
  getStatusEffect,
  holdKindOfStatusId,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { isShelled } from '../../../combat/ai/shellUp';
import { BLEED_EFFECT_IDS } from '../../../combat/damage/bleedIds';
import { DOT_EFFECT_ID } from '../dot/constants';
import { STUN_EFFECT } from '../../../combat/status/stun';
import { activateRecoveryBoost } from '../../../defense/regen/recovery';
import { strikerIsAttacking } from './strikerGear';

// ── Specializations (§12.6) ──────────────────────────────────────────────────

export const THOUSAND_CUTS = 'striker-thousand-cuts';
export const AFTERIMAGE = 'striker-afterimage';
export const AFTERGLOW = 'striker-afterglow';
export const IAIDO = 'striker-iaido';
export const TEMPERED = 'striker-tempered';
export const CASCADE = 'striker-cascade';
export const SUBJUGATOR = 'striker-subjugator';
export const FRENZY = 'striker-frenzy';
export const CRESCENDO = 'striker-crescendo';

/**
 * The Striker's specialization, once it is one of the picked discipline's own (the Passive
 * Tree already gates the pick; this keeps a stale or foreign id from reaching the rules).
 */
export function strikerSpecOf(player: PlayerEntity): string | null {
  const id = player.usesSkills.specializationId;
  const discipline = player.usesSkills.disciplineId;
  if (!id || !discipline) return null;
  const spec = STRIKER_KIT.specializations.find((s) => s.id === id);
  return spec && spec.disciplineId === discipline ? id : null;
}

/** Afterimage: this share of every beat's damage is held back for the finisher's replay. PLACEHOLDER. */
export const AFTERIMAGE_HOLD_PCT = 0.4;
/** Iaido: a cast sharpens the edge this many extra steps. */
export const IAIDO_CAST_EXTRA_STEPS = 2;
/** Iaido: a damage technique that is a cast cuts with this many times the edge. */
export const IAIDO_CAST_EDGE_MULT = 2;
/** Tempered: the edge falls to this share of its peak at the finisher. */
export const TEMPERED_KEEP = 0.5;
/** Cascade: each damage technique raises the edge this many extra steps. */
export const CASCADE_EXTRA_STEPS = 1;
/** Subjugator: a control technique counts as this many soft beats of Momentum before its setup multiplier. */
export const SUBJUGATOR_CONTROL_BEATS = 2;
/** Subjugator: the finisher against a controlled enemy hits this much harder. */
export const SUBJUGATOR_FINISHER_PCT = 0.75;
/** Frenzy: a second, lighter finisher joins the combo once this many finishers have landed in the fight. */
export const FRENZY_AFTER_FINISHERS = 2;
/** Frenzy: the second finisher's blow, as a share of a full one. */
export const FRENZY_SECOND_PCT = 0.6;

// ── Targets ──────────────────────────────────────────────────────────────────

/** Enemies whose aggro is on the player right now (Grave Toll, Requiem, Slip Through, Centered). */
export function enemiesOnPlayer(world: World, player: PlayerEntity): number {
  let count = 0;
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetKind === 'player' && monster.hasAggroTarget.targetId === player.isPlayer.id) count++;
  }
  return count;
}

/** A shield, a barrier or a shell is up on the target (Icebreaker, Eruption). */
export function isShelledTarget(monster: MonsterEntity, now: number): boolean {
  return (monster.hasStatus?.enemyBarrier?.amount ?? 0) > 0 || isShelled(monster, now);
}

/** Slowed, rooted, chilled or frozen: held, but not merely stunned (Rimeblade). */
function coldHeld(monster: MonsterEntity): boolean {
  return monster.tracksCombat.statusEffects.some((effect) => {
    if (effect.remainingMs === 0) return false;
    return holdKindOfStatusId(effect.id) !== undefined && effect.id !== STUN_EFFECT;
  });
}

/** Ailments on a monster that are not holds or bleeds (Exploit counts them). */
const OTHER_DEBUFF_IDS: ReadonlySet<string> = new Set([DOT_EFFECT_ID, 'vulnerability', 'plating-shred']);

/** How many different debuffs are on the monster: holds, bleeds, DoTs, exposure, cracked plating (Exploit). */
export function monsterDebuffCount(monster: MonsterEntity): number {
  const ids = new Set<string>();
  for (const effect of monster.tracksCombat.statusEffects) {
    if (effect.remainingMs === 0 || effect.stacks <= 0) continue;
    if (
      holdKindOfStatusId(effect.id) !== undefined || BLEED_EFFECT_IDS.includes(effect.id)
      || OTHER_DEBUFF_IDS.has(effect.id) || (effect.data['isDot'] ?? 0) !== 0
    ) ids.add(effect.id);
  }
  return ids.size;
}

/** Rimeblade, Bloodfire Axe and Exploit: what the weapon adds to every beat and the finisher. */
export function strikerGearBeatMult(player: PlayerEntity, target: MonsterEntity): number {
  const p = player.usesSkills.passives;
  let mult = 1;
  const cold = p['striker.cold-pct'] ?? 0;
  if (cold > 0 && coldHeld(target)) mult *= 1 + cold;
  const low = p['striker.low-hp-pct'] ?? 0;
  if (low > 0) {
    const { hp, maxHp } = player.hasHealth;
    mult *= 1 + low * Math.max(0, Math.min(1, 1 - hp / Math.max(1, maxHp)));
  }
  // Exploit: each different debuff on the target adds a share.
  const exploit = p['striker.debuff-pct'] ?? 0;
  if (exploit > 0) mult *= 1 + exploit * monsterDebuffCount(target);
  return mult;
}

// ── Winter Coat, Frostbite Mend, Cinderskin, Fuel ────────────────────────────

/** One tick's boost for the Recovery lines (re-armed every tick). */
const BOOST_MS = 500;
/** Cinderskin parks the Heat's damage-taken here while it is warded. */
const HEAT_WARDED_KEY = 'heatWardedTakenPct';

/** The player is slowed or chilled (Frostbite Mend). */
function chilledOrSlowed(player: PlayerEntity): boolean {
  const cs = player.tracksCombat;
  if ((getStatusEffect(cs, TUNDRA_CHILL_EFFECT_ID)?.stacks ?? 0) > 0) return true;
  return ['slow', FROST_RAMP_EFFECT_ID, CHILL_STATUS_ID].some(
    (id) => (getStatusEffect(cs, id)?.remainingMs ?? 0) !== 0,
  );
}

/**
 * Each tick, for every Striker: the Tundra and Volcanic gear lines. (They read the node's
 * ambient ramp: the Chill and the Heat, owned by `systems/world/nodeFeatures.ts`.)
 */
export function updateStrikerT3(world: World, dt: number, now: number): void {
  for (const player of world.livePlayers) {
    if (!player.usesCadence) continue;
    const p = player.usesSkills.passives;
    const cs = player.tracksCombat;
    const attacking = strikerIsAttacking(player, now);

    // Winter Coat: while you keep attacking, the Chill's build clock runs slower.
    const coat = p['striker.chill-build-cut-pct'] ?? 0;
    const chill = getStatusEffect(cs, TUNDRA_CHILL_EFFECT_ID);
    if (coat > 0 && attacking && chill) {
      chill.data['rampAccum'] = Math.max(0, (chill.data['rampAccum'] ?? 0) - dt * coat);
    }

    // Frostbite Mend: Recovery is multiplied while you are chilled or slowed.
    const mend = p['striker.chilled-recovery-x'] ?? 0;
    if (mend > 1 && chilledOrSlowed(player)) activateRecoveryBoost(cs, mend, BOOST_MS);

    // Cinderskin: the Heat's extra damage taken is parked while you keep attacking, and
    // handed back when you stop (or when the line comes off).
    const heat = getStatusEffect(cs, VOLCANIC_HEAT_EFFECT_ID);
    const ward = (p['striker.heat-ward'] ?? 0) > 0 && attacking;
    if (heat) {
      const parked = heat.data[HEAT_WARDED_KEY];
      if (ward && parked === undefined) {
        heat.data[HEAT_WARDED_KEY] = heat.data[DAMAGE_TAKEN_PCT_KEY] ?? 0;
        heat.data[DAMAGE_TAKEN_PCT_KEY] = 0;
      } else if (!ward && parked !== undefined) {
        heat.data[DAMAGE_TAKEN_PCT_KEY] = parked;
        delete heat.data[HEAT_WARDED_KEY];
      }
    }

    // Fuel: Recovery rises with the Heat.
    const fuel = p['striker.heat-recovery-pct'] ?? 0;
    if (fuel > 0 && heat && heat.stacks > 0) activateRecoveryBoost(cs, 1 + fuel * heat.stacks, BOOST_MS);
  }
}
