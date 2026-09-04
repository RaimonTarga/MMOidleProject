/**
 * PLATING SHRED — the Cave lineage's corrosion, as one reusable application.
 *
 * Lifted out of `runMonsterAttack` so a telegraphed ability can apply a LARGER DOSE
 * of the same corrosion rather than a second, parallel mechanic. That is the whole
 * §5.3 Cave T1 shape: ordinary hits erode you a little, and a visible Breach erodes
 * you a lot — one resource, two rates, so the player learns to read the cast rather
 * than learning a new keyword.
 *
 * Everything the inline version did is preserved: the `empower-shred` deepening is
 * written onto the LIVE stack before the increment (otherwise a raised ceiling only
 * takes effect on a fresh pull), and each threshold the corrosion crosses fires its
 * poison exactly once.
 */

import {
  applyStatusEffect,
  getStatusEffect,
  PLATING_SHRED_EFFECT_ID,
  type MonsterDefinition,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyMonsterDotToPlayer } from './monsterDot';

/**
 * Add `stacks` of corrosion, firing the threshold poison for every rung crossed.
 *
 * Crossing rungs is checked per added stack rather than only on the final total: a
 * Breach that jumps the player from 2 to 5 passes thresholds at 3 and 6, and
 * skipping the ones it leapt over would make a bigger dose apply LESS poison than
 * three ordinary hits — the opposite of what "a larger dose" means.
 */
export function applyPlatingShredStacks(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity,
  def: MonsterDefinition | undefined,
  stacks: number,
): void {
  const platingShred = def?.appliesPlatingShred;
  if (!platingShred) return;

  const deepen = monster.scriptsBoss?.shredOverride;
  const maxStacks = platingShred.maxStacks + (deepen?.maxStacksAdd ?? 0);
  const perStack = platingShred.platingPerStack + (deepen?.platingPerStackAdd ?? 0);

  // `applyStatusEffect` keeps an EXISTING effect's cap and data, so a deepening that
  // lands mid-corrosion has to be written onto the live stack before the increment.
  if (deepen) {
    const live = getStatusEffect(target.tracksCombat, PLATING_SHRED_EFFECT_ID);
    if (live) {
      live.maxStacks = maxStacks;
      live.data.platingPerStack = perStack;
    }
  }

  const poison = platingShred.thresholdPoison;
  for (let i = 0; i < Math.max(1, Math.round(stacks)); i++) {
    const corrosion = applyStatusEffect(target.tracksCombat, {
      id: PLATING_SHRED_EFFECT_ID,
      maxStacks,
      remainingMs: -1,
      refreshable: false,
      sourceId: monster.isMonster.id,
      data: { platingPerStack: perStack },
    });
    if (
      target.hasHealth.hp > 0 &&
      poison &&
      (poison.atStacks.includes(corrosion.stacks) ||
        deepen?.extraThresholds.includes(corrosion.stacks))
    ) {
      applyMonsterDotToPlayer(world, monster, target, poison);
    }
    // A threshold poison can kill; stop feeding a corpse more corrosion.
    if (target.hasHealth.hp <= 0) return;
  }
}
