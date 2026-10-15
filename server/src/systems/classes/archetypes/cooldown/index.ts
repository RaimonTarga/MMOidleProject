import { defineMechanic } from '../../mechanicModule';
import { initCooldownArchetype } from './cooldownPrototype';
import { SQUIRE_BUFFS } from './squireBuffs';
import { updateSquire } from './squire';

const cooldownModule = defineMechanic({
  id: 'cooldown',
  init: () => {
    initCooldownArchetype();
  },
  tick: (world, dt, now) => {
    updateSquire(world, dt, now);
  },
  buffs: [...SQUIRE_BUFFS],
});

export default cooldownModule;
