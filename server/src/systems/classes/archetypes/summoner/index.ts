import { defineMechanic } from '../../mechanicModule';
import { initSummonerArchetype, updateSummonerArchetype } from './summonerPrototype';
import { registerSummonerSpecializationHooks } from './specs';
import { SUMMONER_T3_BUFFS } from './t3';
import { SUMMONER_T4_BUFFS } from './specs/buffs';

const summonerModule = defineMechanic({
  id: 'summoner',
  init: () => {
    registerSummonerSpecializationHooks();
    initSummonerArchetype();
  },
  tick: (world, dt, now) => {
    updateSummonerArchetype(world, dt, now);
  },
  buffs: [...SUMMONER_T3_BUFFS, ...SUMMONER_T4_BUFFS],
});

export { registerSummonerDamageSponge } from './damageSponge';
export { despawnMinionsForOwner, relocateMinionsForOwner } from './spawn';
export default summonerModule;
