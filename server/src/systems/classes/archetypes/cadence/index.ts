import { defineMechanic } from '../../mechanicModule';
import {
  initCadenceArchetype,
  updateCadenceEffects,
  CADENCE_BUFFS,
} from './cadencePrototype';

const cadenceModule = defineMechanic({
  id: 'cadence',
  init: () => {
    initCadenceArchetype();
  },
  tick: (world, dt) => {
    updateCadenceEffects(world, dt);
  },
  buffs: CADENCE_BUFFS,
});

export default cadenceModule;
