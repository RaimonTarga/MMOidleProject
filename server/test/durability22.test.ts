import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY22_BLOCKS,DURABILITY22_HP,installDurability22Treatment} from '../bench/balance/durability22Spec';
const snapshot=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snapshot();
for(const block of Object.values(DURABILITY22_BLOCKS)){
 assert.equal(block.cells.length,24);
 for(const cell of block.cells){
  const overlay=installDurability22Treatment(cell);
  for(const [type,[oldHp,hp]] of Object.entries(DURABILITY22_HP))assert.equal(MONSTER_DATABASE.get(type)!.stats.hp,cell.treatment==='candidate'?hp:oldHp);
  if(cell.treatment==='candidate'){
   const bear=MONSTER_DATABASE.get('glacial-direbear')!;
   assert(Math.abs(bear.stats.hp*bear.enemyShield!.shieldPct-1221*.22)<1e-8);
   assert(Math.abs(bear.stats.hp*bear.enemyShield!.shatter!.selfDamagePct-1221*.14)<1e-8);
   const levi=MONSTER_DATABASE.get('elder-leviathan')!;
   const shield=levi.monsterAbilities![0].actions[0];assert(shield.type==='shield');
   assert(Math.abs(levi.stats.hp*shield.shieldPct-5880*.18)<1e-8);
  }
  overlay.restore();assert.equal(snapshot(),before,'Treatment leaked');
 }
}
console.log('durability22: matrix, fixed shields, shatter and restoration passed');
