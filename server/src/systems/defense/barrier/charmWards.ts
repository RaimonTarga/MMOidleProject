import {
  FROZEN_STATUS_ID,
  GAME_CONFIG,
  getResource,
  getStatusEffect,
  isCooldownActive,
  setCooldown,
  setResource,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { applyWardPercent } from './wards';

/**
 * The Mountain and Tundra charm bases' timed ward (class-first build S7). It replaces their
 * barrier: a ward is use-it-or-lose-it and takes part of the next blow.
 *
 *   Mountain  a hit over a quarter of your max HP          -> `defense.ward-hit-pct`
 *   Tundra    the Chill freezes you (Frozen lands on you)   -> `defense.ward-freeze-pct`
 *
 * One gap between raises, so a stream of big hits or freezes cannot keep a ward up.
 */
const WARD_CD = 'charmWard';
const WAS_FROZEN = 'charmWard.wasFrozen';

function raise(world: World, player: PlayerEntity, pct: number): void {
  if (pct <= 0 || isCooldownActive(player.tracksCombat, WARD_CD)) return;
  applyWardPercent(world, player, pct, GAME_CONFIG.CHARM_WARD_MS);
  setCooldown(player.tracksCombat, WARD_CD, GAME_CONFIG.CHARM_WARD_COOLDOWN_MS);
}

/** Mountain: the ward rises after the hit lands, so it covers the NEXT blow. */
export function registerCharmWardOnBigHit(): void {
  registerCombatListener('afterHit', (ctx, world) => {
    if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player' || ctx.damage <= 0) return;
    const player = ctx.defender;
    const pct = player.usesSkills.passives['defense.ward-hit-pct'] ?? 0;
    if (pct <= 0 || player.hasHealth.hp <= 0) return;
    if (ctx.damage < player.hasHealth.maxHp * GAME_CONFIG.CHARM_WARD_BIG_HIT_PCT) return;
    raise(world, player, pct);
  });
}

/** Tundra: the rising edge of Frozen on the player, whoever applied it. Once per tick. */
export function updateCharmFreezeWard(world: World, player: PlayerEntity): void {
  const pct = player.usesSkills.passives['defense.ward-freeze-pct'] ?? 0;
  if (pct <= 0) return;
  const cs = player.tracksCombat;
  const frozen = (getStatusEffect(cs, FROZEN_STATUS_ID)?.remainingMs ?? 0) > 0;
  const was = getResource(cs, WAS_FROZEN) > 0;
  if (frozen === was) return;
  setResource(cs, WAS_FROZEN, frozen ? 1 : 0);
  if (frozen) raise(world, player, pct);
}
