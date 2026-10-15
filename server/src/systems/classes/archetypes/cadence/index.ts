import { defineMechanic } from '../../mechanicModule';
import { updateHemorrhages } from '../../../combat/damage/bleedTicks';
import { initCadenceArchetype } from './cadencePrototype';
import { STRIKER_ORDER_BUFFS, updateStrikerLeaps } from './order';
import { updateStrikerT2 } from './strikerT2';
import { updateStrikerT3 } from './strikerT3';
import { updateStrikerT4 } from './strikerT4';
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
    updateStrikerT2(world, dt, now);
    updateStrikerT3(world, dt, now);
    updateStrikerT4(world, dt, now);
    updateStrikerLeaps(world, now);
  },
  buffs: [...STRIKER_ORDER_BUFFS],
});

export default cadenceModule;
