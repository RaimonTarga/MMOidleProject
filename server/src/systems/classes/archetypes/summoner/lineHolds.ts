/**
 * Consort's frame loop — "the line holds."
 *
 * Progression rework Phase 3; decided with the designer 2026-10-01 (bible
 * amendment 13, closing `docs/briefs/frame-loops-2026-10-01.md` §1's one open row).
 * Design authority `design_docs/progression-rework-design.md` §10.
 *
 * THE CONTAINER IS A STANDING CONDITION, not a window and not a bank. §10 says the
 * container encodes the frame's skew, and the Balanced Conduit's skew is the
 * reference ensemble itself: five medium bodies, no extreme on any axis. So the
 * loop pays for the one thing that shape is built to do — keep all five alive.
 * While every formation slot stands, the whole formation carries bonus plating and
 * damage reduction; a single death breaks it; a completed reconstruction restores
 * it. The player's lever is reconstruction uptime, not a cadence, which is exactly
 * the half of the Conduit's root mechanic the other two frames do not scale.
 *
 * The rejected candidate (a heal pulse on reconstruction) is recorded in the brief:
 * it paid the player for losing a body, which is the opposite loop.
 *
 * WHY THIS IS NOT A WINDOW. §10's "a window must be shorter than one cycle or it
 * collapses into a flat stat" is about windows a mechanic OPENS: uptime there is
 * duration over cycle, and 100% uptime means the loop is a stat with extra steps.
 * This condition's uptime is not a duration at all — it is the share of the fight
 * the formation is whole, which the monsters decide. At full health it is a stat, as
 * intended (the reward for an unbroken line); under pressure it is off until the
 * queue catches up. Nothing here opens, refreshes or clamps a duration.
 *
 * WHERE IT IS CONSUMED. `computeMinionMitigation` in `spawn.ts`, which is the single
 * place a summon's plating and DR are decided — both at spawn and in the per-tick
 * resync (`syncLiveMinionFrameStats`). The bonus is therefore applied and lapses
 * with one writer and nothing to un-apply, the same shape Splinter's frenzy uses for
 * the swarm's cadence.
 *
 * "IMMEDIATELY" means on the summoner pass that observes the death. Minion deaths
 * are deliberately not combat-pipeline events (`runMonsterAttackOnMinion` bypasses
 * it: "death is observed by the summoner tick on its next pass"), and
 * `updateSummonerArchetype` runs `collectDeaths` BEFORE the mitigation resync — so
 * the body that died this pass is already gone from the formation when the survivors
 * are re-synced, and the line breaks without a tick of stale bonus in between.
 * Same for the restore: `tickSummonReconstruction` spawns the replacement earlier in
 * the very same pass.
 *
 * Kept in its own module rather than in `frameLoop.ts` because this loop has no
 * `onHit` listener at all — it is a standing read, not a combat beat — and because
 * that file is Splinter's and Effigy's.
 */
import {
  applyStatusEffect,
  getStatusEffect,
  removeStatusEffect,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { defineBuff, type BuffDescriptor } from '../../../combat/buffs/descriptor';

/**
 * The owner-side HUD record, per the Phase 3 contract: `frame.<root>.line`, with
 * `data.intact` 1 or 0. It carries no clock (`remainingMs` -1, permanent) because
 * the loop has no duration; the flag is what the buff sync projects.
 *
 * It is PRESENT whenever the frame owns the loop, broken or not. Design §10 makes
 * the HUD part of the feature, and a tile that vanished when the line broke would
 * hide the only state the player can act on. Behaviour is gated by the derived
 * predicate below, never by this flag — the flag is presentation.
 */
export const SUMMONER_FRAME_LINE_EFFECT = 'frame.summoner.line';

export interface SummonerLineBonus {
  /** Flat plating added to every body while the line holds. */
  plating: number;
  /** Damage-reduction fraction added to every body while the line holds. */
  damageReduction: number;
}

/** The formation carries no line bonus: not a Consort, or the line is broken. */
export const NO_SUMMONER_LINE_BONUS: SummonerLineBonus = { plating: 0, damageReduction: 0 };

/** The DR ceiling every other DR writer in the game honours. */
const DR_CAP = 0.9;

interface AuthoredLine {
  platingPct: number;
  dr: number;
}

/**
 * The authored container, or `undefined` when this frame owns no line loop.
 *
 * Gated on the authored keys, the way every other frame container is: a frame that
 * authors neither number is not a Consort and must not carry the HUD record.
 */
function authoredLine(owner: PlayerEntity): AuthoredLine | undefined {
  const passives = owner.usesSkills.passives;
  const platingPct = Math.max(0, passives['summoner.frame-line-plating-pct'] ?? 0);
  const dr = Math.max(0, passives['summoner.frame-line-dr'] ?? 0);
  if (platingPct <= 0 && dr <= 0) return undefined;
  return { platingPct, dr };
}

/** Bodies standing right now, out of the formation's slots. */
export function summonerBodiesStanding(world: World, owner: PlayerEntity): number {
  const summons = owner.summonsMinions;
  if (!summons) return 0;
  let standing = 0;
  for (let index = 0; index < summons.targetCount; index++) {
    const id = summons.minionIds[index];
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (minion && minion.hasHealth.hp > 0) standing++;
  }
  return standing;
}

/**
 * Whether every formation slot is alive.
 *
 * Derived, never stored: a cached flag would need an owner for every way a slot can
 * empty (death, despawn, a relic resizing the formation, a node transition), and
 * one missed writer is a permanent bonus or a permanently broken line. An empty slot
 * and a corpse that has not been collected yet both read as not standing.
 */
export function summonerLineIntact(world: World, owner: PlayerEntity): boolean {
  const summons = owner.summonsMinions;
  if (!summons || summons.targetCount <= 0) return false;
  return summonerBodiesStanding(world, owner) === summons.targetCount;
}

/**
 * What the formation carries right now. Zero unless the frame owns the loop AND the
 * line is whole.
 *
 * The plating half is a FRACTION of the owner's own plating, so it rides the gear
 * curve instead of needing a per-tier number — summons already wear the Conduit's
 * armor in full (`computeMinionMitigation`), and this is that armor again in part.
 */
export function summonerLineBonus(world: World, owner: PlayerEntity): SummonerLineBonus {
  const line = authoredLine(owner);
  if (!line) return NO_SUMMONER_LINE_BONUS;
  if (!summonerLineIntact(world, owner)) return NO_SUMMONER_LINE_BONUS;
  return {
    plating:         Math.round(owner.mitigatesDamage.plating * line.platingPct),
    damageReduction: line.dr,
  };
}

/** Owner plating/DR plus the line's share, clamped the way every DR writer is. */
export function applySummonerLineBonus(
  base: SummonerLineBonus,
  bonus: SummonerLineBonus,
): SummonerLineBonus {
  return {
    plating:         base.plating + bonus.plating,
    damageReduction: Math.min(DR_CAP, base.damageReduction + bonus.damageReduction),
  };
}

/**
 * Keep the owner's HUD record in step with the line, and beat the frame-charge
 * event when it flips.
 *
 * The beat is binary because the loop is: a whole line pushes `stacks = slots` (the
 * glow at full) and a break pushes `stacks = 0`, which is the client's release
 * burst — "the spend is the payoff, not a fade" in `fx/frameChargeGlow.ts`. Losing
 * the line is exactly that kind of loss, and nothing is pushed on a tick where
 * nothing changed, so an unbroken formation costs no bandwidth at all.
 */
export function syncSummonerLine(world: World, owner: PlayerEntity): void {
  const line = authoredLine(owner);
  if (!line || !owner.summonsMinions) {
    removeStatusEffect(owner.tracksCombat, SUMMONER_FRAME_LINE_EFFECT);
    return;
  }

  const intact = summonerLineIntact(world, owner) ? 1 : 0;
  const existing = getStatusEffect(owner.tracksCombat, SUMMONER_FRAME_LINE_EFFECT);
  const record = existing ?? applyStatusEffect(owner.tracksCombat, {
    id:          SUMMONER_FRAME_LINE_EFFECT,
    maxStacks:   1,
    remainingMs: -1,
    sourceId:    owner.isPlayer.id,
    // A fresh record starts BROKEN so a formation that finishes spawning this tick
    // flips 0 -> 1 and gets its own restore beat, like any later reconstruction.
    data:        { intact: 0 },
  });
  if ((record.data['intact'] ?? 0) === intact) return;

  record.data['intact'] = intact;
  const slots = owner.summonsMinions.targetCount;
  world.pushEvent(owner.hasPosition.nodeId, {
    kind:     'frame-charge',
    playerId: owner.isPlayer.id,
    stacks:   intact ? slots : 0,
    max:      slots,
  });
}

export const SUMMONER_LINE_BUFFS = [
  defineBuff('summoner-frame-line', ({ player, world }) => {
    if (!player.summonsMinions) return null;
    const record = getStatusEffect(player.tracksCombat, SUMMONER_FRAME_LINE_EFFECT);
    if (!record) return null;
    const intact = (record.data['intact'] ?? 0) > 0;
    const slots = player.summonsMinions.targetCount;
    const standing = summonerBodiesStanding(world, player);
    const bonus = summonerLineBonus(world, player);
    const authoredDr = player.usesSkills.passives['summoner.frame-line-dr'] ?? 0;
    const authoredPlatingPct = player.usesSkills.passives['summoner.frame-line-plating-pct'] ?? 0;
    return {
      id:          'summoner-frame-line',
      label:       'Line',
      stacks:      Math.max(1, standing),
      // The count IS the state here, so it has to show even at one body.
      showSingleStack: true,
      durationPct: -1,
      color:       intact ? '#8fd3ff' : '#6a7b86',
      logDetail:   intact
        ? `the line holds: ${standing}/${slots} summons carry +${bonus.plating} plating and +${Math.round(bonus.damageReduction * 100)}% damage reduction`
        : `the line is broken: ${standing}/${slots} summons standing`,
      values:      [
        { label: 'Line', value: intact ? 'holding' : 'broken', good: intact },
        { label: 'Summons standing', value: `${standing} / ${slots}`, good: intact },
        {
          label: 'Formation plating',
          value: intact ? `+${bonus.plating}` : `+0 (${Math.round(authoredPlatingPct * 100)}% when whole)`,
          good:  intact,
        },
        {
          label: 'Formation damage reduction',
          value: intact
            ? `+${Math.round(bonus.damageReduction * 100)}%`
            : `+0% (${Math.round(authoredDr * 100)}% when whole)`,
          good:  intact,
        },
      ],
    };
  }, { category: 'summoner', shape: 'small-square', color: '#8fd3ff', label: 'Line' }),
] as const satisfies readonly BuffDescriptor[];
