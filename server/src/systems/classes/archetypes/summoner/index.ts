import { defineMechanic } from '../../mechanicModule';
import { initSummonerArchetype, updateSummonerArchetype } from './summonerPrototype';
import { initSummonerT3, registerMountainPathHooks, updateSummonerT3, SUMMONER_T3_BUFFS } from './t3';

const summonerModule = defineMechanic({
  id: 'summoner',
  init: () => {
    initSummonerT3();
    initSummonerArchetype();
  },
  tick: (world, dt, now) => {
    updateSummonerT3(world, dt, now);
    updateSummonerArchetype(world, dt, now);
  },
  buffs: SUMMONER_T3_BUFFS,
});

export { registerSummonerDamageSponge } from './damageSponge';
export { registerMountainPathHooks };
export { despawnMinionsForOwner } from './spawn';
export default summonerModule;
