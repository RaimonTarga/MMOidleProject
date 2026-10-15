import { defineMechanic } from '../../mechanicModule';
import {
  initCooldownArchetype,
  updateCooldownArchetype,
} from './cooldownPrototype';
import { COOLDOWN_FRAME_BUFFS } from './frameLoop';
import { SQUIRE_BUFFS } from './squireBuffs';
import { updateSquire } from './squire';
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
    updateSquire(world, dt, now);
  },
  buffs: [...SQUIRE_BUFFS, ...COOLDOWN_FRAME_BUFFS, ...COOLDOWN_T3_BUFFS],
});

export default cooldownModule;
