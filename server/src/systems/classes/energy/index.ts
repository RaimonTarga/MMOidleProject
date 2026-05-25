import { defineMechanic } from '../../registry/mechanics';
import {
  initEnergyArchetype,
  updateEnergyArchetype,
} from './energyPrototype';
import {
  updateEnergyT3,
  ENERGY_T3_BUFFS,
} from './energyT3';

const energyModule = defineMechanic({
  id: 'energy',
  init: () => {
    initEnergyArchetype();
  },
  tick: (world, dt) => {
    updateEnergyT3(world, dt);
    updateEnergyArchetype(world);
  },
  buffs: ENERGY_T3_BUFFS,
});

export default energyModule;
