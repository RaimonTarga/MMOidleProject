import { defineMechanic } from '../../mechanicModule';
import {
  initDotArchetype,
  updateDotArchetype,
} from './dotPrototype';
import {
  updateDotT3,
  DOT_T3_BUFFS,
} from './t3';
import { registerApprentice, updateApprentice } from './sigils';

const dotModule = defineMechanic({
  id: 'dot',
  init: () => {
    initDotArchetype();
    registerApprentice();
  },
  tick: (world, dt, now) => {
    updateDotT3(world, dt);
    updateDotArchetype(world, dt, now);
    for (const entity of world.dotPlayers) updateApprentice(world, entity, dt, now);
  },
  buffs: DOT_T3_BUFFS,
});

export default dotModule;
