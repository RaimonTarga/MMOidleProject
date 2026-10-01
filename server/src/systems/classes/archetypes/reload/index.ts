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

const reloadModule = defineMechanic({
  id: 'reload',
  init: () => {
    initReloadArchetype();
  },
  tick: (world, dt, now) => {
    updateReloadT3(world, dt, now);
    updateReloadArchetype(world, dt);
  },
  buffs: [...RELOAD_FRAME_BUFFS, ...RELOAD_T3_BUFFS],
});

export default reloadModule;
