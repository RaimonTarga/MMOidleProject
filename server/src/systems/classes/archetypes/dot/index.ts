import { defineMechanic } from '../../mechanicModule';
import {
  initDotArchetype,
  updateDotArchetype,
} from './dotPrototype';
import { registerApprentice, updateApprentice } from './sigils';

const dotModule = defineMechanic({
  id: 'dot',
  buffs: [],
  init: () => {
    initDotArchetype();
    registerApprentice();
  },
  tick: (world, dt, now) => {
    updateDotArchetype(world, dt, now);
    for (const entity of world.dotPlayers) updateApprentice(world, entity, dt, now);
  },
});

export default dotModule;
