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
 * - enemy plating and damage reduction (this is damage DEALT, pre-mitigation);
 * - the T4 spec behaviours (rampage stacks, crescendo ramps, storm DoTs, ...),
 *   which depend on combat state that does not exist outside a fight;
 * - abilities, relic delivery changes, and anything with an uptime that depends
 *   on how the player actually moves.
 *
 * Every one of those is listed in `caveats` for the surface that shows it, so
 * the estimate states its own limits instead of implying a precision it lacks.
 */

import { GAME_CONFIG } from '../config/gameConfig';
import type { SubVariant } from '../data/skillTree/types';
import type { PassiveMap } from '../passives';
import { resolveEmpoweredMultiplier } from './empoweredMult';
import { resolveEnergyMax } from './energyMax';
import { resolveDotClassProfile } from './dotClassProfile';
import { resolveSummonerProfile, type SummonerProfileInput } from './summonerProfile';
import { summonerSpecializationFor, type SummonerFrame } from '../data/summoner';

export interface DpsEstimateInput {
  /** Final attack stat, after gear, cores and the skill tree. */
  attack: number;
  /** Flat per-hit damage applied after the target's defences. */
  onHitDamage: number;
  attackCooldownMs: number;
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
}

export interface DpsEstimatePart {
  /** Player-facing name for this contribution. */
  label: string;
  dps: number;
}

export interface DpsEstimate {
  /** Estimated damage per second dealt, before the target's defences. */
  total: number;
  /** Named contributions. These sum to `total`. */
  parts: DpsEstimatePart[];
  /** What the estimate knowingly does not account for. */
  caveats: string[];
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Shared by every archetype: what a plain swing is worth, per second. */
function autoAttackDps(input: DpsEstimateInput): number {
  const cd = Math.max(1, input.attackCooldownMs);
  return ((input.attack + input.onHitDamage) * 1000) / cd;
}

const GENERIC_CAVEATS = [
  'Before the target’s plating and damage reduction.',
  'Excludes abilities, and spec behaviours that only exist mid-fight.',
];

/**
 * Estimate sustained damage per second for a build.
 *
 * Always returns a usable value: an unknown or absent archetype falls back to
 * the auto-attack number and says so in `caveats`, rather than reporting zero.
 */
export function estimatePlayerDps(input: DpsEstimateInput): DpsEstimate {
  const cdSec = Math.max(1, input.attackCooldownMs) / 1000;
  const auto = autoAttackDps(input);
  const parts: DpsEstimatePart[] = [];
  const caveats: string[] = [...GENERIC_CAVEATS];

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
      const threshold = Math.max(
        1,
        Math.round(input.passives['cadence.empowered-threshold'] ?? 5)
          + Math.round(input.passives['cadence.threshold-mod'] ?? 0),
      );
      const mult = empowered?.effective ?? 1;
      const regularHits = Math.max(0, threshold - 1);
      const cycleSec = threshold * cdSec;
      parts.push({
        label: 'Regular attacks',
        dps: (regularHits * (input.attack + input.onHitDamage)) / cycleSec,
      });
      parts.push({
        label: `Finisher (every ${threshold})`,
        dps: (input.attack * mult + input.onHitDamage) / cycleSec,
      });
      break;
    }

    // Regular attacks continue while the execution is on cooldown, so the two
    // are genuinely additive rather than a cycle average.
    case 'cooldown': {
      const executionCdMs = Math.max(100, input.passives['cooldown.empowered-cd-ms'] ?? 8_000);
      const mult = empowered?.effective ?? 1;
      parts.push({ label: 'Regular attacks', dps: auto });
      parts.push({
        label: `Execution (every ${round1(executionCdMs / 1000)}s)`,
        dps: (input.attack * mult) / (executionCdMs / 1000),
      });
      break;
    }

    // A magazine fires at full rate, then the reload is dead time. Damage is the
    // clip spread over the whole cycle including that downtime.
    case 'reload': {
      const magazine = Math.max(1, Math.round(input.passives['reload.max-ammo'] ?? 6));
      const reloadMs = Math.max(0, input.passives['reload.reload-time-ms'] ?? 2_000);
      const cycleSec = magazine * cdSec + reloadMs / 1000;
      const lastShotMult = empowered?.effective ?? 1;
      const normalShots = Math.max(0, magazine - (empowered ? 1 : 0));
      parts.push({
        label: `Clip of ${magazine}`,
        dps: (normalShots * (input.attack + input.onHitDamage)) / cycleSec,
      });
      if (empowered) {
        parts.push({
          label: 'Last bullet',
          dps: (input.attack * lastShotMult + input.onHitDamage) / cycleSec,
        });
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
        dps: (input.attack * (1 - conv) + input.onHitDamage) / cdSec,
      });
      parts.push({
        label: 'Damage over time',
        dps: input.attack * conv * profile.dotMechanicMultiplier,
      });
      caveats.push('Damage over time is counted at full stacks, which takes a few hits to reach.');
      break;
    }

    // Hits charge the reservoir; a discharge fires at the empowered multiplier
    // once it fills. Averaged over the charge cycle.
    case 'energy': {
      const perHit = Math.max(1, input.passives['energy.per-hit'] ?? 14);
      const maxEnergy = Math.max(perHit, resolveEnergyMax(input.passives, input.playerTier ?? 0));
      const hitsPerDischarge = Math.max(1, Math.ceil(maxEnergy / perHit));
      const mult = empowered?.effective ?? 1;
      const cycleSec = hitsPerDischarge * cdSec;
      parts.push({
        label: 'Regular attacks',
        dps: ((hitsPerDischarge - 1) * (input.attack + input.onHitDamage)) / cycleSec,
      });
      parts.push({
        label: `Discharge (every ${hitsPerDischarge})`,
        dps: (input.attack * mult + input.onHitDamage) / cycleSec,
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
        const weightSum = profile.slots
          .slice(0, active)
          .reduce((sum, slot) => sum + slot.offenseWeight, 0);
        const volley = input.attack * damagePct * profile.formationOffenseMult * weightSum;
        parts.push({
          label: `${active} summon${active === 1 ? '' : 's'}`,
          dps: (volley * 1000) / minionCdMs,
        });
      }
      // Conduits fight only through their summons; Battle Bond is the single
      // specialization that hands the weapon back. Same condition, same inputs,
      // as the `cannotAttack` marker in recalculatePlayerStats.
      const frame = (summoner?.profileInput.selectedSubVariant ?? 'root') as SummonerFrame;
      const battleBond = summoner
        ? summonerSpecializationFor(frame, summoner.profileInput.unlockedSkills) === 'battle-bond'
        : false;
      const cannotAttack = input.cannotAttack ?? !battleBond;
      if (!cannotAttack) parts.push({ label: 'Your attacks', dps: auto });
      caveats.push('Assumes every summon is alive and in range of the target.');
      break;
    }

    default:
      parts.push({ label: 'Attacks', dps: auto });
      if (!input.archetype) {
        caveats.push('No class mechanic yet — this is plain attack damage.');
      }
      break;
  }

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
