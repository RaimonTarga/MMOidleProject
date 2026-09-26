// Applies a runtime data patch before loading the real harness (or the damage probe with PROBE=1).
// VOLC_VARIANT letters: A scuttler 34, B smaller packs, C heat 2%, D scuttler 30/salamander 55/hound 65.
// VOLC_PATCH JSON: {"atk":{id:n},"hp":{id:n},"smallPacks":true,"heatT3":0.025,"pool":[ids]}
import {MONSTER_DATABASE,NODE_FEATURES,RESOLVED_NODE_FEATURES,BIOME_DATABASE} from '../../../shared/src/index';
const v=process.env.VOLC_VARIANT??'';
const p=JSON.parse(process.env.VOLC_PATCH??'{}');
const m=(id:string)=>MONSTER_DATABASE.get(id) as any;
const smallPacks=()=>{
  const brute=m('magma-brute').pack;brute.followers=[{typeId:'ember-scuttler',count:2}];brute.followerVariants=[[{typeId:'ember-scuttler',count:1}],[{typeId:'ash-slinger',count:1}],[{typeId:'ember-scuttler',count:1}]];
  const hound=m('cinder-hound').pack;hound.followers=[{typeId:'ember-scuttler',count:1}];hound.followerVariants=[[{typeId:'ember-scuttler',count:1}],[{typeId:'ash-slinger',count:1}]];
};
const heat=(pct:number,onlyT3:boolean)=>{let n=0;for(const table of [NODE_FEATURES,RESOLVED_NODE_FEATURES] as any[])for(const [nodeId,list] of Object.entries(table) as any[]){if(onlyT3&&!nodeId.includes('-t3-'))continue;for(const f of list)if(f.ambientRamp?.effectId==='volcanic-heat'){f.ambientRamp.payload.incomingDamagePct=pct;n++;}}if(!n)throw Error('no heat features patched');console.error('heat patched',n);};
if(v.includes('A')) m('ember-scuttler').stats.attack=34;
if(v.includes('B')) smallPacks();
if(v.includes('D')){m('ember-scuttler').stats.attack=30;m('ash-slinger').stats.attack=55;m('cinder-hound').stats.attack=65;}
if(v.includes('C')) heat(0.02,false);
for(const [id,n] of Object.entries(p.atk??{})) m(id).stats.attack=n;
for(const [id,n] of Object.entries(p.hp??{})) m(id).stats.hp=n;
if(p.smallPacks) smallPacks();
if(p.heatT3!=null) heat(p.heatT3,true);
if(p.heatCapT3!=null){let n=0;for(const table of [NODE_FEATURES,RESOLVED_NODE_FEATURES] as any[])for(const [nodeId,list] of Object.entries(table) as any[]){if(!nodeId.includes('-t3-'))continue;for(const f of list)if(f.ambientRamp?.effectId==='volcanic-heat'){f.ambientRamp.maxStacks=p.heatCapT3;n++;}}console.error('heat cap patched',n);}
if(p.pool) (BIOME_DATABASE.get('volcanic') as any).monsterPoolByTier[3]=p.pool;
void import(process.env.PROBE?'./probe-damage.ts':'../run-bot-t4-cross.ts');
