import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
// Preserve the original mixed line endings; refuse to overwrite any other text change.
const replacements={
 'shared/src/world/nodeFeatures.ts':[['incomingDamagePct: 0.045','incomingDamagePct: 0.035']],
 'shared/src/data/monsters/volcano.monsters.ts':[
  ['hp: 1330, attack: 84','hp: 1330, attack: 70'],['hp: 720, attack: 75','hp: 720, attack: 60'],
  ["label: 'Ember Burn', damagePerStack: 13","label: 'Ember Burn', damagePerStack: 8"],
  ['hp: 1550, attack: 110','hp: 1550, attack: 95'],["label: 'Ash Burn', damagePerStack: 16","label: 'Ash Burn', damagePerStack: 12"],
 ],
 'server/test/ambientRamp.test.ts':[
  ["v.value === '+45%'","v.value === '+35%'"],
  ["playerIncomingDamageMult(player.tracksCombat) > 2, 'Heat exceeds the former incoming cap'","playerIncomingDamageMult(player.tracksCombat) > 1 + TAKEN_PER_STACK * BREAKPOINT, 'incoming Heat continues beyond the softcap'"],
 ],
 'docs/biome-ecology-current-state.md':[
  ['+3% damage dealt / +4.5% damage taken each: +30% / +45% at ten.','+3% damage dealt / +3.5% damage taken each: +30% / +35% at ten.'],
  ['multiply by 0.03 / 0.045 for the respective bonuses.','multiply by 0.03 / 0.035 for the respective bonuses.'],
 ],
};
for(const [path,pairs]of Object.entries(replacements)){
 let original=execFileSync('git',['show','HEAD:'+path],{encoding:'utf8',maxBuffer:2000000});
 for(const [from,to]of pairs){assert(original.includes(from),path+' missing original text');original=original.replace(from,to);}
 if(path.endsWith('volcano.monsters.ts'))original=original.replace(/    \/\/ 90 -> 75 attack\). T4 combat validation remains pending; authored Burn is unchanged\.(\r?\n)/,
  (_,eol)=>'    // 90 -> 75 attack). Volcano area study: attack 75 -> 60 and Burn 13 -> 8'+eol+'    // reduce coordinated filler pressure while preserving pack size and cadence.'+eol);
 assert.equal(original.replace(/\r\n/g,'\n'),readFileSync(path,'utf8').replace(/\r\n/g,'\n'),'Unexpected text change '+path);
 writeFileSync(path,original);
}
