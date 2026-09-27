import assert from 'node:assert/strict';
import {DEFAULT_AUTOCOMBAT_CONFIG} from '@mmo-idle/shared';
import {World} from '../src/world/World';
import {selectAutoCombatAction} from '../src/systems/combat/ai/targetPriority';
import {packTestPlayerSlices} from './fixtures/packTestPlayer';

// T4 Mountain stall (Striker s101051, node-t4-mountain-02, 42-45 min): the
// player stood in the ledge annulus between a rhino inside the inner ring (path
// east to a gap) and a mammoth outside the outer ring (path west round the
// ledge). Walking either path made the OTHER mob straight-line ~20% closer, so
// strict-nearest commitment flipped every ~2.5 s and the player shuttled along
// y=3536 forever. A steal must be shorter to walk, not just as the crow flies.
const nodeId='node-t4-mountain-02';
const world=new World();
const player=world.attachPlayerEntity(packTestPlayerSlices('ledge',nodeId,2069,3536),'ledge');
// Find Enemies (auto-path-enemy) widened the real bot's search past the node.
Object.assign(player.usesAutocombat,DEFAULT_AUTOCOMBAT_CONFIG,{auto:true,priorityMode:'nearest',focusLeaderTarget:false,acquireRadius:2000});
const rhino=world.createMonster(nodeId,'cragback-rhino',{x:1589,y:3150})!;
world.createMonster(nodeId,'granite-mammoth',{x:2350,y:4250})!;
const pick=(now:number)=>{const a=selectAutoCombatAction(world,player,player.usesAutocombat,now);return a.kind==='attack'?a.target:null;};

assert.equal(pick(1000),rhino,'rhino is nearest from the west end of the ledge');
// East along the ledge toward the inner-ring gap: the mammoth is now >20%
// closer in a straight line, but its path goes the long way round.
player.hasPosition.current={x:2423,y:3536};
assert.equal(pick(1100),rhino,'a straight-line-closer mob behind a ledge must not steal the approach');
console.log('mountainLedgeTargetFlipFlop: ok');
