/**
 * The §18.1 max-wins rule for a debuff record several sources share.
 *
 * Lives here rather than inside one consumer because it now has two: the lineage
 * card runtime (`lineageCards.ts`, payoff kinds `vulnerability` and
 * `plating-shred`) and the range-node mechanics (`rangeMechanics.ts`, Sentinel's
 * vulnerability window). Any future source that writes a multiplier-type debuff a
 * class mechanic also owns belongs on this function too.
 */
import {
  applyStatusEffect,
  getStatusEffect,
  type StatusEffect,
  type StatusEffectConfig,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { playerDebuffConfig } from '../../classes/shared/applyPlayerDebuff';

/**
 * Share a class mechanic's debuff record without ever weakening it (design §18.1).
 *
 * A card and a class finisher write the SAME effect id on purpose — one
 * vulnerability on a target, not two multiplicative layers (bible §7). But
 * `applyStatusEffect` never updates `data` on an existing entry and DOES reset
 * `remainingMs` when the config is refreshable, so naively sharing the record
 * meant whichever source landed first owned the magnitude forever, and a timed
 * card shortened the cadence finisher's PERMANENT plating strip to four seconds.
 *
 * So: the stronger magnitude wins, the longer window stands, the higher stack
 * count stands, and a field only the class writes is preserved. `-1` is permanent
 * and beats every finite window.
 *
 * `playerDebuffConfig` gives us the caller's own numbers already core-scaled, which
 * is what makes the comparison honest — reading them back off the effect would
 * compare the prior source's value with itself.
 */
export function applySharedDebuffMaxWins(
  player: PlayerEntity,
  targetState: TracksCombat,
  config: StatusEffectConfig,
  dataKeys: readonly string[],
  /**
   * `{ origin: 'mechanic' }` when the applier is a CLASS mechanic rather than a
   * card, so the Relic's mechanic scaling lands on it too — a frame's Heavy rider
   * shares this record with the cadence finisher and must not be the one source
   * the player's Relic cannot improve. Cards and range nodes pass nothing: their
   * magnitude is already resolved from the table or the node.
   */
  options: { origin?: 'mechanic' } = {},
): StatusEffect {
  const scaled = playerDebuffConfig(player, config, options);
  const prior = getStatusEffect(targetState, config.id);
  const priorData = prior ? { ...prior.data } : null;
  const priorMs = prior?.remainingMs ?? 0;
  const priorStacks = prior?.stacks ?? 0;
  const priorMaxStacks = prior?.maxStacks;

  const effect = applyStatusEffect(targetState, scaled);

  for (const key of dataKeys) {
    const mine = (scaled.data?.[key] as number | undefined) ?? 0;
    const was = priorData?.[key] ?? 0;
    effect.data[key] = Math.max(mine, was);
  }
  if (priorData) {
    for (const [key, value] of Object.entries(priorData)) {
      if (!(key in effect.data) && typeof value === 'number') effect.data[key] = value;
    }
  }
  effect.remainingMs = priorMs < 0 ? -1 : Math.max(effect.remainingMs, priorMs);
  effect.stacks = Math.max(effect.stacks, priorStacks);
  if (priorMaxStacks !== undefined) {
    effect.maxStacks = (priorMaxStacks === 0 || effect.maxStacks === 0)
      ? 0
      : Math.max(priorMaxStacks, effect.maxStacks);
  }
  return effect;
}
