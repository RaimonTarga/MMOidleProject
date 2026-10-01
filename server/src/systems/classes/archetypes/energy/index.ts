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

const energyModule = defineMechanic({
  id: 'energy',
  init: () => {
    initEnergyArchetype();
  },
  tick: (world, dt) => {
    updateEnergyT3(world, dt);
    updateEnergyArchetype(world);
  },
  buffs: [...ENERGY_FRAME_BUFFS, ...ENERGY_T3_BUFFS],
});

export default energyModule;
