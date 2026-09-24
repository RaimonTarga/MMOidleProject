import { hazardAvoidanceShapesForMover, moverOverlapsBlockShapes } from '../../../shared/src/index';
import { readFileSync,writeFileSync } from 'node:fs';
const path='../reports/player-fast-pass/volcano-heat-closeout-01/stall-evidence.json';
const cases=JSON.parse(readFileSync(path,'utf8'));
const shapes=hazardAvoidanceShapesForMover('node-t4-volcanic-01','player');
const rows=cases.map((c:any)=>({case:c.case,points:c.excerpts.filter((s:any)=>s.selectedMonster).map((s:any)=>({atMs:s.atMs,player:s.pos,target:s.selectedMonster,goal:s.movement?.goal??null,targetClearanceHazards:shapes.filter(shape=>moverOverlapsBlockShapes(s.selectedMonster.pos,[shape],{x:64,y:64})),playerHazards:shapes.filter(shape=>moverOverlapsBlockShapes(s.pos,[shape],{x:0,y:0}))}))}));
writeFileSync('../reports/player-fast-pass/volcano-heat-closeout-01/hazard-geometry.json',JSON.stringify({kind:'read-only geometry; zero ticks or combat lives',shapes,rows},null,2)+'\n');
console.log(JSON.stringify(rows.map((r:any)=>({case:r.case,last:r.points.at(-1)})),null,2));
