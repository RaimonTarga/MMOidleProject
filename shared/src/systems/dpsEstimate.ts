import { resolveFinalDamageMultipliers } from './finalDamage';
/**
 * A planning DPS number for the character panel.
 *
 * WHAT THIS IS FOR
 * ----------------
 * The panel used to print `(attack + on-hit) x attacks-per-second`, which is the
 * damage of a character who only ever auto-attacks. Every class in the game has a
 * mechanic that changes that number, and for two of them the plain formula is not
 * merely imprecise, it is *wrong*:
 *
 * - a **DoT** class deliberately moves a fraction of every hit OUT of the direct
 *   damage and into stacks that tick later, so the auto-attack formula reports
 *   strictly less damage than the build actually does;
 * - a **Summoner** may not attack at all (`CannotAttack`), so the auto-attack
 *   formula reports a number near zero for a build whose minions are doing all
 *   of the damage.
 *
 * So the estimate is per-archetype, and it returns its own working: `parts` are
 * the named contributions that sum to `total`, and `caveats` are the things it
 * knowingly does not model. The panel shows both. A number a player cannot
 * interrogate is worse than no number.
 *
 * WHAT THIS IS NOT
 * ----------------
 * Not the combat pipeline. Nothing here is authoritative and nothing reads it
 * back into a damage calculation — the server computes real damage hit by hit
 * through `beforeAttack -> onAttack -> onHit`, with positioning, procs, status
 * effects, target defences and cooldown drift that no closed-form estimate can
 * see. Deliberately excluded rather than guessed at:
 *
 * - enemy plating and damage reduction for the character panel (report callers
 *   may supply a target when they need a matchup estimate);
 * - the T4 spec behaviours (rampage stacks, crescendo ramps, storm DoTs, ...),
 *   which depend on combat state that does not exist outside a fight;
 * - abilities and anything with an uptime that depends
 *   on how the player actually moves.
 *
 * Every one of those is listed in `caveats` for the surface that shows it, so
 * the estimate states its own limits instead of implying a precision it lacks.
 */

import { GAME_CONFIG } from '../config/gameConfig';
import type { SubVariant } from '../data/skillTree/types';
import type { PassiveMap } from '../passives';
import { resolveEmpoweredMultiplier } from './empoweredMult';
import { resolveRelicPreview } from './relicPreview';
import { relicRatingsFromPassives, resolveRelicMagnitudeMultiplier } from './relics';
import { resolveLaserProfile } from './laserProfile';
import { resolveOnHitDamage, mitigateOnHitDamage, laserOnHitDamage } from './onHitDamage';
import { resolveDotClassProfile } from './dotClassProfile';
import { resolveSummonerProfile, type SummonerProfileInput } from './summonerProfile';
import { summonerSpecializationFor, type SummonerFrame } from '../data/summoner';
import { estimatePlayerHitDamage } from './combatEstimates';
import { weaponDotProfileForWeapon } from './weaponFamilies';
import { weaponDotBasisFromResolvedDirectDamage } from './classSecondaryDamage';

export interface DpsEstimateTarget {
  plating: number;
  damageReduction: number;
}

export interface DpsEstimateInput {
  /** Final attack stat, after gear, cores and the skill tree. */
  attack: number;
  /** Flat per-hit damage applied after the target's defences. */
  onHitDamage: number;
  attackCooldownMs: number;
  /** Equipped weapon id, when the caller can identify weapon reservoir effects. */
  weaponId?: string | null;
  /** Root class mechanic, or null before a class is chosen. */
  archetype: string | null | undefined;
  passives: PassiveMap;
  /** DoT element selection; picks the class profile's base numbers. */
  selectedSubVariant?: SubVariant | null;
  playerTier?: number;
  /**
   * Summoner only. The estimator resolves the formation itself rather than
   * taking a pre-chewed per-minion number, because each slot carries its own
   * `offenseWeight` — averaging them would misreport every asymmetric formation,
   * which is most of them.
   */
  summoner?: {
    profileInput: SummonerProfileInput;
    /** Summons actually alive right now, not the slot cap. */
    activeCount: number;
  };
  /**
   * Override for whether the build can swing at all. Normally left unset: for a
   * summoner the estimator derives it exactly as `recalculatePlayerStats` does,
   * so the panel cannot disagree with the server about whether the player is
   * holding a weapon they are allowed to use.
   */
  cannotAttack?: boolean;
  activeStance?: string | null;
  hpFraction?: number;
  /** Authoritative live multiplier; overrides the static build calculation. */
  finalDamageDealtMult?: number;
  /**
   * Optional target for report/tooling callers. The character panel leaves this
   * unset and receives the familiar pre-mitigation planning number; balance
   * reports provide it so every archetype is compared against the same authored
   * monster defences.
   */
  target?: DpsEstimateTarget;
}

export interface DpsEstimatePart {
  /** Player-facing name for this contribution. */
  label: string;
  dps: number;
}

export interface DpsEstimate {
  /** Estimated DPS, pre-mitigation unless the input supplies a target. */
  total: number;
  /** Named contributions. These sum to `total`. */
  parts: DpsEstimatePart[];
  /** What the estimate knowingly does not account for. */
  caveats: string[];
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Attack-derived damage after optional target mitigation (flat on-hit is later). */
function attackDamage(
  input: DpsEstimateInput,
  attack: number,
  platingMult = 1,
): number {
  if (!input.target) return attack;
  return estimatePlayerHitDamage({
    attack,
    onHitDamage: 0,
    targetPlating: input.target.plating,
    targetDamageReduction: input.target.damageReduction,
    platingMult,
  });
}

function hitDamage(
  input: DpsEstimateInput,
  attack: number,
  onHitDamage: number,
  platingMult = 1,
  baseAttack = input.attack,
): number {
  return attackDamage(input, attack, platingMult) + onHitContribution(input, onHitDamage, baseAttack, platingMult);
}

function onHitContribution(input: DpsEstimateInput, onHit: number, baseAttack = input.attack, platingMult = 1): number {
  return input.target ? mitigateOnHitDamage(onHit, baseAttack, input.target.plating * platingMult, input.target.damageReduction) : Math.max(0, onHit);
}

/** Shared by every archetype: what a plain swing is worth, per second. */
function autoAttackDps(input: DpsEstimateInput, platingMult = 1): number {
  const cd = Math.max(1, input.attackCooldownMs);
  return (hitDamage(input, input.attack, input.onHitDamage, platingMult) * 1000) / cd;
}

function genericCaveats(input: DpsEstimateInput): string[] {
  return [
    input.target
      ? 'Includes the supplied target’s plating and damage reduction; DoT still bypasses them.'
      : 'Before the target’s plating and damage reduction.',
    'Excludes abilities, and spec behaviours that only exist mid-fight.',
  ];
}

/**
 * Estimate sustained damage per second for a build.
 *
 * Always returns a usable value: an unknown or absent archetype falls back to
 * the auto-attack number and says so in `caveats`, rather than reporting zero.
 */
export function estimatePlayerDps(input: DpsEstimateInput): DpsEstimate {
  const onHit = input.archetype === 'reload' && (input.passives['reload.laser'] ?? 0) > 0
    ? laserOnHitDamage(input.onHitDamage) : input.onHitDamage;
  input = { ...input, onHitDamage: resolveOnHitDamage(onHit, input.passives) };
  const relic = resolveRelicPreview(input.archetype, input.passives, relicRatingsFromPassives(input.passives), { subVariant: input.selectedSubVariant, playerTier: input.playerTier });
  const cdSec = Math.max(1, input.attackCooldownMs) / 1000;
  const auto = autoAttackDps(input);
  const parts: DpsEstimatePart[] = [];
  const caveats = genericCaveats(input);

  const empowered = resolveEmpoweredMultiplier(
    input.passives,
    input.archetype,
    input.playerTier ?? 0,
  );

  switch (input.archetype) {
    // Every Nth attack is a finisher at the empowered multiplier. Averaged over
    // the cycle rather than shown as a spike: the panel is reporting sustained
    // output, and a finisher is not a separate action you can choose to take.
    case 'cadence': {
      const threshold = relic?.archetype === 'cadence' ? relic.threshold.after : 5;
      const mult = empowered?.effective ?? 1;
      const regularHits = Math.max(0, threshold - 1);
      const cycleSec = threshold * cdSec;
      parts.push({
        label: 'Regular attacks',
        dps: (regularHits * hitDamage(input, input.attack, input.onHitDamage)) / cycleSec,
      });
      parts.push({
        label: `Finisher (every ${threshold})`,
        dps: hitDamage(input, input.attack * mult, input.onHitDamage) / cycleSec,
      });
      break;
    }

    // Regular attacks continue while the execution is on cooldown, so the two
    // are genuinely additive rather than a cycle average.
    case 'cooldown': {
      const executionCdMs = relic?.archetype === 'cooldown' ? relic.cooldownMs.after : 7000;
      const mult = empowered?.effective ?? 1;
      parts.push({ label: 'Regular attacks', dps: auto });
      parts.push({
        label: `Execution (every ${round1(executionCdMs / 1000)}s)`,
        dps: attackDamage(input, input.attack * Math.max(0, mult - 1)) / (Math.ceil(executionCdMs / input.attackCooldownMs) * cdSec),
      });
      break;
    }

    // A magazine fires at full rate, then the reload is dead time. Damage is the
    // clip spread over the whole cycle including that downtime.
    case 'reload': {
      if (relic?.archetype === 'laser') {
        const laser = resolveLaserProfile(input.passives);
        const firingTicks = Math.ceil(laser.heatMax / laser.heatPerTick);
        const coolingTicks = Math.ceil(laser.heatMax / laser.coolPerTick);
        const tickRate = firingTicks / ((firingTicks + coolingTicks) * 0.1);
        const deadInterval = Math.round(input.passives['weapon.dead-swing-interval'] ?? 0);
        const liveTickFraction = deadInterval > 0 ? 1 - 1 / deadInterval : 1;
        const direct = attackDamage(input, input.attack * laser.damagePerTickPct);
        const weaponDot = input.weaponId
          ? weaponDotProfileForWeapon(input.weaponId)
          : undefined;
        parts.push({
          label: 'Laser direct (including cooling)',
          dps: (weaponDot
            ? Math.max(1, Math.round(direct * (1 - weaponDot.convPct)))
            : direct) * tickRate * liveTickFraction,
        });
        if (input.onHitDamage > 0) {
          parts.push({ label: 'Flat on-hit', dps: onHitContribution(input, input.onHitDamage, input.attack * laser.damagePerTickPct) * tickRate * liveTickFraction });
        }
        if (weaponDot) {
          parts.push({
            label: 'Weapon damage over time',
            dps: weaponDotBasisFromResolvedDirectDamage(
              direct,
              input.archetype,
              input.passives,
            ) * weaponDot.convPct * weaponDot.dotMultiplier * tickRate,
          });
          caveats.push('Weapon damage over time uses the post-mitigation laser tick as its reservoir basis, then drains without further plating or damage reduction.');
        }
        break;
      }
      const magazine = relic?.archetype === 'reload' ? relic.ammoMax.after : 10;
      const reloadMs = relic?.archetype === 'reload' ? relic.reloadMs.after : 1600;
      const cycleSec = magazine * cdSec + reloadMs / 1000;
      const lastShotMult = empowered?.effective ?? 1;
      const normalShots = Math.max(0, magazine - (empowered ? 1 : 0));
      const baseDirect = attackDamage(input, input.attack, 0.5);
      const lastDirect = attackDamage(input, input.attack * lastShotMult, 0.5);
      const weaponDot = input.weaponId
        ? weaponDotProfileForWeapon(input.weaponId)
        : undefined;
      const directAfterConversion = (damage: number): number => weaponDot
        ? Math.max(1, Math.round(damage * (1 - weaponDot.convPct)))
        : damage;
      parts.push({
        label: 'Direct attacks',
        dps: (
          normalShots * directAfterConversion(baseDirect)
          + (empowered ? directAfterConversion(lastDirect) : 0)
        ) / cycleSec,
      });
      if (input.onHitDamage > 0) {
        parts.push({
          label: 'Flat on-hit',
          dps: onHitContribution(input, input.onHitDamage, input.attack, 0.5) * magazine / cycleSec,
        });
      }
      if (weaponDot) {
        const reservoirBasis = weaponDotBasisFromResolvedDirectDamage(
          normalShots * baseDirect + (empowered ? lastDirect : 0),
          input.archetype,
          input.passives,
        );
        parts.push({
          label: 'Weapon damage over time',
          dps: reservoirBasis
            * weaponDot.convPct
            * weaponDot.dotMultiplier
            / cycleSec,
        });
        caveats.push('Weapon damage over time uses the post-mitigation hit as its reservoir basis, then drains without further plating or damage reduction.');
      }
      caveats.push(`Averaged across the ${round1(reloadMs / 1000)}s reload, so burst output is higher.`);
      break;
    }

    // The one archetype where the auto-attack formula is not merely imprecise:
    // conversion moves damage OUT of the hit and into stacks, so counting only
    // the hit under-reports the build. At full stacks the tick throughput
    // reduces to attack x conversion x mechanic multiplier — the tick interval
    // and stack cap cancel out of `computeDotClassDamagePerStack`.
    case 'dot': {
      const profile = resolveDotClassProfile(input.passives, input.selectedSubVariant ?? null);
      const conv = Math.min(1, Math.max(0, profile.conversionPct));
      parts.push({
        label: 'Direct hits',
        dps: (attackDamage(input, input.attack) * (1 - conv) + onHitContribution(input, input.onHitDamage)) / cdSec,
      });
      parts.push({
        label: 'Damage over time',
        dps: input.attack * conv * profile.dotMechanicMultiplier
          * (relic?.archetype === 'dot' ? relic.maxStacks.after / relic.maxStacks.before * profile.tickIntervalMs / relic.tickIntervalMs.after : 1)
          * resolveRelicMagnitudeMultiplier(relicRatingsFromPassives(input.passives).debuffEffect),
      });
      caveats.push('Damage over time is counted at full stacks, which takes a few hits to reach.');
      break;
    }

    // Hits charge the reservoir; a discharge fires at the empowered multiplier
    // once it fills. Averaged over the charge cycle.
    case 'energy': {
      if (relic?.archetype === 'energy' && relic.dischargeSuppressed) {
        parts.push({ label: 'Regular attacks (current bonuses)', dps: hitDamage(input, input.attack, input.onHitDamage) / cdSec });
        break;
      }
      const perHit = relic?.archetype === 'energy' ? relic.gainPerHit.after : 14;
      const maxEnergy = relic?.archetype === 'energy' ? relic.maxEnergy.after : 100;
      // Charging hits arm the NEXT attack; the discharge itself grants no energy.
      const hitsPerDischarge = Math.ceil(maxEnergy / perHit) + 1;
      const mult = empowered?.effective ?? 1;
      const cycleSec = hitsPerDischarge * cdSec;
      parts.push({
        label: 'Regular attacks',
        dps: ((hitsPerDischarge - 1) * hitDamage(input, input.attack, input.onHitDamage)) / cycleSec,
      });
      parts.push({
        label: `Discharge (every ${hitsPerDischarge})`,
        dps: hitDamage(input, input.attack * mult, input.onHitDamage) / cycleSec,
      });
      break;
    }

    // The minions are the damage. A conduit build may not swing at all, so the
    // player's own attack is included only when it can actually land.
    case 'summoner': {
      const summoner = input.summoner;
      const active = Math.max(0, Math.round(summoner?.activeCount ?? 0));
      if (summoner && active > 0) {
        const profile = resolveSummonerProfile(summoner.profileInput);
        const damagePct = input.passives['summoner.minion-damage-pct'] ?? 1;
        const minionCdMs = Math.max(
          100,
          Math.round(input.attackCooldownMs * profile.summonAttackCooldownMult),
        );
        // Mirrors spawn.ts: a summon's attack is the owner's, scaled by the
        // damage passive, the formation multiplier, and ITS OWN slot weight.
        // Sum the live slots rather than multiplying one weight by the count.
        const weaponDot = input.weaponId
          ? weaponDotProfileForWeapon(input.weaponId)
          : undefined;
        let directVolley = 0;
        let onHitVolley = 0;
        let weaponDotVolley = 0;
        for (const slot of profile.slots.slice(0, active)) {
          const direct = attackDamage(
            input,
            input.attack * damagePct * profile.formationOffenseMult * slot.offenseWeight,
          );
          directVolley += weaponDot
            ? Math.max(1, Math.round(direct * (1 - weaponDot.convPct)))
            : direct;
          onHitVolley += onHitContribution(input, input.onHitDamage
            * slot.procWeight * profile.secondaryEffectMult * profile.relicPotencyMult,
            input.attack * damagePct * profile.formationOffenseMult * slot.offenseWeight);
          if (weaponDot) {
            weaponDotVolley += direct
              * weaponDot.convPct
              * weaponDot.dotMultiplier
              * profile.secondaryEffectMult;
          }
        }
        parts.push({
          label: `${active} summon${active === 1 ? '' : 's'} direct`,
          dps: (directVolley * 1000) / minionCdMs,
        });
        if (onHitVolley > 0) {
          parts.push({ label: 'Formation flat on-hit', dps: (onHitVolley * 1000) / minionCdMs });
        }
        if (weaponDotVolley > 0) {
          parts.push({ label: 'Formation weapon damage over time', dps: (weaponDotVolley * 1000) / minionCdMs });
        }
      }
      // Conduits fight only through their summons; Battle Bond is the single
      // specialization that hands the weapon back. Same condition, same inputs,
      // as the `cannotAttack` marker in recalculatePlayerStats.
      const frame = (summoner?.profileInput.selectedSubVariant ?? 'root') as SummonerFrame;
      const battleBond = summoner
        ? summonerSpecializationFor(frame, summoner.profileInput.unlockedSkills) === 'battle-bond'
        : false;
      const cannotAttack = input.cannotAttack ?? !battleBond;
      if (!cannotAttack) {
        const profile = summoner ? resolveSummonerProfile(summoner.profileInput) : null;
        const weight = profile ? profile.battleBondConduitOffenseWeight * profile.relicPotencyMult : 1;
        parts.push({ label: 'Your attacks', dps: hitDamage(input, input.attack * weight, input.onHitDamage * weight, 1, input.attack * weight) / cdSec });
      }
      caveats.push('Assumes every summon is alive and in range of the target.');
      caveats.push('Generic weapon proc frequency follows the shared formation budget; proc-specific damage is excluded.');
      break;
    }

    default:
      parts.push({ label: 'Attacks', dps: auto });
      if (!input.archetype) {
        caveats.push('No class mechanic yet — this is plain attack damage.');
      }
      break;
  }

  const finalMult = input.finalDamageDealtMult ?? resolveFinalDamageMultipliers(input.passives, input.activeStance, input.hpFraction).dealt;
  for (const part of parts) part.dps *= finalMult;
  const kept = parts.filter((part) => part.dps > 0).map((part) => ({ ...part, dps: round1(part.dps) }));
  return {
    total: round1(kept.reduce((sum, part) => sum + part.dps, 0)),
    parts: kept,
    caveats,
  };
}

/** Attacks per second, the figure the panel shows beside the estimate. */
export function attacksPerSecond(attackCooldownMs: number): number {
  return 1000 / Math.max(1, attackCooldownMs || GAME_CONFIG.PLAYER_ATTACK_COOLDOWN);
}
