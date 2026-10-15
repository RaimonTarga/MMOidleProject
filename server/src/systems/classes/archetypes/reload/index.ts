import { defineMechanic } from '../../mechanicModule';
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
