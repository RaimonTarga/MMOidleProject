import { defineMechanic } from '../../mechanicModule';
import { updateHemorrhages } from '../../../combat/damage/bleedTicks';
import { initCadenceArchetype } from './cadencePrototype';
import { isOrdinarySource, registerForcedMovementResist } from '../../../combat/damage/knockback';
import { IMMOVABLE, strikerLeaf } from './strikerLeaves';
import { STRIKER_ORDER_BUFFS, updateStrikerLeaps } from './order';
import { updateStrikerT2 } from './strikerT2';
import { updateStrikerT3 } from './strikerT3';
import { updateStrikerT4 } from './strikerT4';
import { updateStrikerGear } from './strikerGear';
import { flushStrikerCounts } from './strikerTelemetry';

const cadenceModule = defineMechanic({
  id: 'cadence',
  init: () => {
    initCadenceArchetype();
    // Immovable: ordinary monsters cannot knock or drag you (bosses still can).
    registerForcedMovementResist((player, source) => isOrdinarySource(source) && strikerLeaf(player, IMMOVABLE));
  },
  tick: (world, dt, now) => {
    // The bleed driver: Rend's bleed and Festering Cut's rot.
    updateHemorrhages(world, dt);
    updateStrikerGear(world, dt, now);
    updateStrikerT2(world, dt, now);
    updateStrikerT3(world, dt, now);
    updateStrikerT4(world, dt, now);
    updateStrikerLeaps(world, now);
    flushStrikerCounts(now);
  },
  buffs: [...STRIKER_ORDER_BUFFS],
});

export default cadenceModule;
