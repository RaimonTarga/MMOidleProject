import { defineMechanic } from '../../mechanicModule';
import { ABILITY_UNYIELDING_EFFECT_ID, hasStatusEffect } from '@mmo-idle/shared';
import { isOrdinarySource, registerForcedMovementResist } from '../../../combat/damage/knockback';
import { leafPicked } from '../../slinger/t4';
import { STEADY_NERVE } from '../../slinger/tuning';
import {
  initReloadArchetype,
  updateReloadArchetype,
} from './reloadPrototype';
import { registerSlinger, updateSlinger } from './slinger';
import { SLINGER_BUFFS } from './slingerBuffs';

const reloadModule = defineMechanic({
  id: 'reload',
  init: () => {
    initReloadArchetype();
    // Steady Nerve: while an enemy is on you, an ordinary monster cannot knock or drag you.
    registerForcedMovementResist((player, source) => isOrdinarySource(source) && leafPicked(player, STEADY_NERVE) && hasStatusEffect(player.tracksCombat, ABILITY_UNYIELDING_EFFECT_ID));
    // After the reload gate and ammo listeners, so a shot's clip position is already set.
    registerSlinger();
  },
  tick: (world, dt, now) => {
    updateReloadArchetype(world, dt);
    for (const entity of world.reloadPlayers) updateSlinger(world, entity, dt, now);
  },
  buffs: [...SLINGER_BUFFS],
});

export default reloadModule;
