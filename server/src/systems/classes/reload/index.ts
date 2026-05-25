import { defineMechanic } from '../../registry/mechanics';
import {
  initReloadArchetype,
  updateReloadArchetype,
} from './reloadPrototype';
import {
  updateReloadT3,
  RELOAD_T3_BUFFS,
} from './reloadT3';

const reloadModule = defineMechanic({
  id: 'reload',
  init: () => {
    initReloadArchetype();
  },
  tick: (world, dt, now) => {
    updateReloadT3(world, dt, now);
    updateReloadArchetype(world, dt);
  },
  buffs: RELOAD_T3_BUFFS,
});

export default reloadModule;
