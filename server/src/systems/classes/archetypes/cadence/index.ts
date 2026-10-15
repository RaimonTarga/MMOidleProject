import { defineMechanic } from '../../mechanicModule';
import { updateHemorrhages } from '../../../combat/damage/bleedTicks';
import { initCadenceArchetype } from './cadencePrototype';
import { STRIKER_ORDER_BUFFS } from './order';
import { updateStrikerGear } from './strikerGear';

const cadenceModule = defineMechanic({
  id: 'cadence',
  init: () => {
    initCadenceArchetype();
  },
  tick: (world, dt, now) => {
    // The bleed driver: Rend's bleed and Festering Cut's rot.
    updateHemorrhages(world, dt);
    updateStrikerGear(world, dt, now);
  },
  buffs: [...STRIKER_ORDER_BUFFS],
});

export default cadenceModule;
