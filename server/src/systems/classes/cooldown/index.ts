import { defineMechanic } from '../../registry/mechanics';
import {
  initCooldownArchetype,
  updateCooldownArchetype,
} from './cooldownPrototype';
import {
  updateCooldownT3,
  COOLDOWN_T3_BUFFS,
} from './cooldownT3';

const cooldownModule = defineMechanic({
  id: 'cooldown',
  init: () => {
    initCooldownArchetype();
  },
  tick: (world, dt) => {
    updateCooldownT3(world, dt);
    updateCooldownArchetype(world, dt);
  },
  buffs: COOLDOWN_T3_BUFFS,
});

export default cooldownModule;
