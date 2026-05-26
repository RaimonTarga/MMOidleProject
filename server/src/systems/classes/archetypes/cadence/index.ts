import { defineMechanic } from '../../mechanicModule';
import { initCadenceArchetype, updateCadenceArchetype } from './cadencePrototype';
import { updateCadenceT3, CADENCE_T3_BUFFS } from './t3';

const cadenceModule = defineMechanic({
  id: 'cadence',
  init: () => {
    initCadenceArchetype();
  },
  tick: (world, dt) => {
    updateCadenceT3(world, dt);
    updateCadenceArchetype(world, dt);
  },
  buffs: CADENCE_T3_BUFFS,
});

export default cadenceModule;
