import { defineMechanic } from '../../mechanicModule';
import {
  initReloadArchetype,
  updateReloadArchetype,
} from './reloadPrototype';
import { registerSlinger, updateSlinger } from './slinger';

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
  buffs: [],
});

export default reloadModule;
