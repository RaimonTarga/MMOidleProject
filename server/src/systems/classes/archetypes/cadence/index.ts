import { defineMechanic } from '../../mechanicModule';
import { initCadenceArchetype, updateCadenceArchetype } from './cadencePrototype';
import { CADENCE_FRAME_BUFFS } from './frameLoop';
import { STRIKER_ORDER_BUFFS } from './order';
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
  buffs: [...STRIKER_ORDER_BUFFS, ...CADENCE_FRAME_BUFFS, ...CADENCE_T3_BUFFS],
});

export default cadenceModule;
