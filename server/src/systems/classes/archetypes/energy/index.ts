import { defineMechanic } from '../../mechanicModule';
import {
  initEnergyArchetype,
  updateEnergyArchetype,
} from './energyPrototype';
import {
  updateEnergyT3,
  ENERGY_T3_BUFFS,
} from './t3';
import { ENERGY_FRAME_BUFFS } from './frameLoop';
import { registerSpirit, updateSpirit } from './spirit';

const energyModule = defineMechanic({
  id: 'energy',
  init: () => {
    initEnergyArchetype();
    registerSpirit();
  },
  tick: (world, dt, now) => {
    updateEnergyT3(world, dt);
    updateEnergyArchetype(world);
    for (const entity of world.energyPlayers) updateSpirit(world, entity, dt, now);
  },
  buffs: [...ENERGY_FRAME_BUFFS, ...ENERGY_T3_BUFFS],
});

export default energyModule;
