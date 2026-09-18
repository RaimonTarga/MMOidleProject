import {findPathOnGrid,findPathForMover} from './pathfind';
import {createPathDiagnostics,setPathDiagnostics} from './pathDiagnostics';
import type {NavGrid} from './navGrid';
// shared/ carries no @types/node, so this suite uses the same hand-rolled assert
// as its sibling collision tests instead of importing node:assert.
const fail=(message:string):never=>{throw new Error(message);};
const show=(value:unknown)=>JSON.stringify(value)??String(value);
const assert=Object.assign(
 (value:unknown,message='assertion failed')=>{if(!value)fail(message);},
 {
  equal:(actual:unknown,expected:unknown)=>{if(actual!==expected)fail(`expected ${show(expected)}, got ${show(actual)}`);},
  deepEqual:(actual:unknown,expected:unknown)=>{if(show(actual)!==show(expected))fail(`expected ${show(expected)}, got ${show(actual)}`);},
 },
);
const grid:NavGrid={cellSize:32,cols:3,rows:3,width:96,height:96,
  blocked:new Uint8Array(9),pad:{x:0,y:0},shapes:[{kind:'rect',x:62,y:48,halfW:2,halfH:4}]};
const from={x:48,y:48},goal={x:62,y:48};
const baseline=findPathOnGrid(grid,from,goal);
const before=JSON.stringify(grid);
let time=0;const d=createPathDiagnostics(()=>++time);
setPathDiagnostics(d);
try {
  assert.deepEqual(findPathOnGrid(grid,from,goal),baseline);
  assert.equal(JSON.stringify(grid),before);
  assert(d.paddedChecks>0&&d.overlapQueries>0);
  for(let i=0;i<2;i++)findPathForMover('node-t4-jungle-03','player',{x:8,y:8},{x:2400,y:2400},{x:2430,y:2400});
  assert.equal(d.paths,2);assert.equal(d.requests.size,1);
  assert.equal([...d.requests.values()][0].calls,2);assert.equal(d.pathMs,2);
} finally {setPathDiagnostics();}
const calls=d.paddedChecks;findPathOnGrid(grid,from,goal);assert.equal(d.paddedChecks,calls);
console.log('pathDiagnostics: outcome parity, repeated request counts and disable passed');
