import assert from 'node:assert/strict';
import { PROGRESSION_CELLS, type ProgressionCell } from './overnightProgressionSpec';
import mature from './classBalanceMatureReferences.json';
export const CLASS_BALANCE_ID='class-balance-candidate-01';
export type CandidateCell=ProgressionCell & {referenceObservationId:string;referenceSource:string;durationMs:number};
export const CLASS_BALANCE_CELLS:CandidateCell[]=[];
function add(ref:any,block:string,cap:number,source:string){
 const comparisonId=`cbc-${block}-${ref.id}`;
 for(const arm of ref.seed===101033?['candidate','control']:['control','candidate']){
  const c=structuredClone(ref);c.id=`${comparisonId}-${arm}`;c.build.id=c.id;
  Object.assign(c,{block,arm,comparisonId,durationMs:cap,referenceObservationId:ref.id,referenceSource:source});
  CLASS_BALANCE_CELLS.push(c);
 }
}
for(const c of mature)add(c,c.frame==='heavy'?'N1':'S1',300000,'3a1488a7c78bb47f4a90e20ec06db1652594fe16');
for(const block of ['S2','S3','S4','C1','C2','N2'])for(const c of PROGRESSION_CELLS){
 const light=c.className==='spirit'&&['light','balanced'].includes(c.frame);
 const match=block==='S2'?light&&c.snapshotId==='t2-desert-arrival'&&c.role==='farm':
 block==='S3'?light&&c.snapshotId==='t3-developed'&&c.nodeId==='node-t3-swamp-03':
 block==='S4'?light&&c.tier===3&&c.role==='boss'&&c.nodeId==='node-t3-mountain-dungeon':
 block==='C1'?c.className==='conduit'&&c.tier===1&&c.role==='farm'&&['node-t1-plains-03','node-t1-cave-02'].includes(c.nodeId):
 block==='C2'?c.className==='conduit'&&c.tier===1&&c.role==='boss'&&c.seed===101009:
 c.className==='conduit'&&c.frame==='balanced'&&c.snapshotId==='t2-desert-established'&&c.nodeId==='node-t2-desert-01'&&c.seed===101009;
 if(match)add(c,block,block==='C1'?1200000:c.role==='boss'?300000:600000,'c14d62afa2267b57207e1ef8b65c3fd90144c0a6');
}
export const CLASS_BALANCE_BLOCKS:Record<string,{cells:CandidateCell[];durationMs:number;pilotIds:string[]}>=Object.fromEntries(CLASS_BALANCE_CELLS.map(c=>[c.id,{cells:[c],durationMs:c.durationMs,pilotIds:[]}]));
for(const c of CLASS_BALANCE_CELLS){const key=`qualification-${c.arm}-${c.seed}-${c.role}-${c.boss??c.durationMs}`;
 (CLASS_BALANCE_BLOCKS[key]??={cells:[],durationMs:c.durationMs,pilotIds:[]}).cells.push(c);}
export function assertClassBalanceDefinitions(){
 assert.equal(CLASS_BALANCE_CELLS.length,56);assert.equal(new Set(CLASS_BALANCE_CELLS.map(c=>c.id)).size,56);
 assert.deepEqual(Object.fromEntries(['S1','S2','S3','S4','C1','C2','N1','N2'].map(b=>[b,CLASS_BALANCE_CELLS.filter(c=>c.block===b).length])),{S1:8,S2:8,S3:8,S4:8,C1:16,C2:4,N1:2,N2:2});
 for(let i=0;i<56;i+=2){const a=CLASS_BALANCE_CELLS[i],b=CLASS_BALANCE_CELLS[i+1];assert.equal(a.comparisonId,b.comparisonId);assert.notEqual(a.arm,b.arm);}
}
assertClassBalanceDefinitions();
