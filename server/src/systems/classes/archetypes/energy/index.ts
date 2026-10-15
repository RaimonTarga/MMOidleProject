import { defineMechanic } from '../../mechanicModule';
import { registerSpirit, updateSpirit } from './spirit';

const energyModule = defineMechanic({
  id: 'energy',
  init: registerSpirit,
  buffs: [],
  tick: (world, dt, now) => {
    for (const entity of world.energyPlayers) updateSpirit(world, entity, dt, now);
  },
});

export default energyModule;
