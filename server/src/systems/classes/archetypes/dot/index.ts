import { defineMechanic } from '../../mechanicModule';
import {
  initDotArchetype,
  updateDotArchetype,
} from './dotPrototype';
import {
  updateDotT3,
  DOT_T3_BUFFS,
} from './t3';

const dotModule = defineMechanic({
  id: 'dot',
  init: () => {
    initDotArchetype();
  },
  tick: (world, dt) => {
    updateDotT3(world, dt);
    updateDotArchetype(world, dt);
  },
  buffs: DOT_T3_BUFFS,
});

export default dotModule;
