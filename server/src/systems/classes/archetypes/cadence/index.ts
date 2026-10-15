import { defineMechanic } from '../../mechanicModule';
import { updateHemorrhages } from '../../../combat/damage/bleedTicks';
import { initCadenceArchetype, updateCadenceArchetype } from './cadencePrototype';
import { CADENCE_FRAME_BUFFS } from './frameLoop';
import { STRIKER_ORDER_BUFFS } from './order';
import { updateStrikerGear } from './strikerGear';
import { updateCadenceT3, CADENCE_T3_BUFFS } from './t3';

const cadenceModule = defineMechanic({
  id: 'cadence',
  init: () => {
    initCadenceArchetype();
  },
  tick: (world, dt, now) => {
    updateCadenceT3(world, dt);
    // The bleed driver: Rend's bleed and Festering Cut's rot.
    updateHemorrhages(world, dt);
    updateCadenceArchetype(world, dt);
    updateStrikerGear(world, dt, now);
  },
  buffs: [...STRIKER_ORDER_BUFFS, ...CADENCE_FRAME_BUFFS, ...CADENCE_T3_BUFFS],
});

export default cadenceModule;
