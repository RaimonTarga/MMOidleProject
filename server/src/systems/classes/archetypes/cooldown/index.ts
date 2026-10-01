import { defineMechanic } from '../../mechanicModule';
import {
  initCooldownArchetype,
  updateCooldownArchetype,
} from './cooldownPrototype';
import { COOLDOWN_FRAME_BUFFS } from './frameLoop';
import {
  updateCooldownT3,
  COOLDOWN_T3_BUFFS,
} from './t3';

const cooldownModule = defineMechanic({
  id: 'cooldown',
  init: () => {
    initCooldownArchetype();
  },
  tick: (world, dt, now) => {
    updateCooldownT3(world, dt, now);
    updateCooldownArchetype(world, dt);
  },
  buffs: [...COOLDOWN_FRAME_BUFFS, ...COOLDOWN_T3_BUFFS],
});

export default cooldownModule;
