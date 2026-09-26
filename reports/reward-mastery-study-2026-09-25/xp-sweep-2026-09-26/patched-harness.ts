// Applies a runtime data patch (env VOLC_VARIANT) before loading the real harness.
import {MONSTER_DATABASE,NODE_FEATURES,RESOLVED_NODE_FEATURES} from '../../../shared/src/index';
const v=process.env.VOLC_VARIANT??'';
const m=(id:string)=>MONSTER_DATABASE.get(id) as any;
if(v.includes('A')) m('ember-scuttler').stats.attack=34;
if(v.includes('B')){
  const brute=m('magma-brute').pack;brute.followers=[{typeId:'ember-scuttler',count:2}];brute.followerVariants=[[{typeId:'ember-scuttler',count:1}],[{typeId:'ash-slinger',count:1}],[{typeId:'ember-scuttler',count:1}]];
  const hound=m('cinder-hound').pack;hound.followers=[{typeId:'ember-scuttler',count:1}];hound.followerVariants=[[{typeId:'ember-scuttler',count:1}],[{typeId:'ash-slinger',count:1}]];
}
if(v.includes('D')){m('ember-scuttler').stats.attack=30;m('ash-slinger').stats.attack=55;m('cinder-hound').stats.attack=65;}
if(v.includes('C')){let n=0;for(const list of [...Object.values(NODE_FEATURES as any),...Object.values(RESOLVED_NODE_FEATURES as any)] as any[])for(const f of list as any[])if(f.ambientRamp?.effectId==='volcanic-heat'){f.ambientRamp.payload.incomingDamagePct=0.02;n++;}if(!n)throw Error('no heat features patched');console.error('heat patched',n);}
void import('../run-bot-t4-cross.ts');
