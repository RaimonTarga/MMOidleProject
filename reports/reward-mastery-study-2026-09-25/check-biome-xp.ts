import assert from 'node:assert/strict';
import {GAME_CONFIG} from '../../shared/src/index';
import {World} from '../../server/src/world/World';
import {gameplayPlayerSlices} from '../../server/test/fixtures/gameplayPlayer';
import {grantMonsterRewards} from '../../server/src/systems/player/progression/rewards';
const factors=GAME_CONFIG.BIOME_XP_BIOME_TIER_MULT as Record<number,Record<string,number>>;
function reward(node:string,mob:string){const w=new World();const s=gameplayPlayerSlices('xp-scope');s.tracksProgression.playerTier=4;const p=w.attachPlayerEntity(s,'xp-scope');const m=w.createMonster(node,mob,{x:800,y:800})!;grantMonsterRewards(w,p.isPlayer.id,m);return {xp:JSON.stringify(p.tracksProgression.biomeXP),total:Object.values(p.tracksProgression.biomeXP).reduce((a,b)=>a+b,0),wallet:JSON.stringify(p.tracksProgression.essences),cat:JSON.stringify([p.tracksProgression.catalysts,p.tracksProgression.catalystProgress])};}
for(const [node,mob,group,factor] of [['node-t4-desert-03','sand-viper','desert',2.4],['node-t4-tundra-01','hoarfrost-yeti','tundra',1.8],['node-t3-desert-01','dune-stalker','desert',1],['node-t4-volcanic-01','ember-skink','volcanic',1]] as const){
 const saved=factors[4];try{factors[4]={};const base=reward(node,mob);factors[4]=saved;const changed=reward(node,mob);assert.ok(base.total>0,node);assert.ok(Math.abs(changed.total-base.total*factor)<=1,node);assert.equal(changed.wallet,base.wallet,'XP correction must not change essence');assert.equal(changed.cat,base.cat,'XP correction must not change catalysts');}finally{factors[4]=saved;}}
console.log('T4 biome XP correction scope: passed');

