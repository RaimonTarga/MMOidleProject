import { defineMechanic } from '../../mechanicModule';
import {
  initReloadArchetype,
  updateReloadArchetype,
} from './reloadPrototype';
import {
  updateReloadT3,
  RELOAD_T3_BUFFS,
} from './t3';
import { RELOAD_FRAME_BUFFS } from './frameLoop';
import { registerSlinger, updateSlinger } from './slinger';

const reloadModule = defineMechanic({
  id: 'reload',
  init: () => {
    initReloadArchetype();
    // After the reload gate and ammo listeners, so a shot's clip position is already set.
    registerSlinger();
  },
  tick: (world, dt, now) => {
    updateReloadT3(world, dt, now);
    updateReloadArchetype(world, dt);
    for (const entity of world.reloadPlayers) updateSlinger(world, entity, dt, now);
  },
  buffs: [...RELOAD_FRAME_BUFFS, ...RELOAD_T3_BUFFS],
});

export default reloadModule;
