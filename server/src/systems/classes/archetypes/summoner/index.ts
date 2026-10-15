import { defineMechanic } from '../../mechanicModule';
import { initSummonerArchetype, updateSummonerArchetype } from './summonerPrototype';
import { updateMinionAfflictions } from '../../../combat/status/minionAfflictions';

const summonerModule = defineMechanic({
  id: 'summoner',
  init: () => {
    initSummonerArchetype();
  },
  tick: (world, dt, now) => {
    updateMinionAfflictions(world, dt);
    updateSummonerArchetype(world, dt, now);
  },
  buffs: [],
});

export { registerSummonerDamageSponge } from './damageSponge';
export { despawnMinionsForOwner, relocateMinionsForOwner } from './spawn';
export default summonerModule;
