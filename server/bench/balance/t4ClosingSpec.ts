import assert from 'node:assert/strict';
import { SKILL_TREE, NODE_BIOMES, DUNGEON_DEFS, runicPointLoadoutCost, ITEM_DATABASE, coreIsActive } from '@mmo-idle/shared';
import { T4_CELLS as OLD, T4_SNAPSHOT } from './t4SpecializationSpec';
import type { EncounterCell } from './encounterCounterplaySpec';
export const T4_ID='t4-overnight-closing-pass-01';
export const T4_SNAPSHOTS={[T4_SNAPSHOT.id]:T4_SNAPSHOT};
export const CONTEXTS=[{id:'V',old:'F1',node:'node-t4-volcanic-01'}, {id:'T',old:'F2',node:'node-t4-tundra-01'}, {id:'D',old:'F2',node:'node-t4-desert-03'}, {id:'M',old:'B1',node:'node-t4-mountain-dungeon'}];
const roots=['striker','squire','apprentice','slinger','conduit','spirit'],frames=['light','balanced','heavy'];
const rapier='jungle-deathfang-rapier',axe='graveyard-plague-axe',lash='volcanic-eruption-lash',maul='mountain-warmaul',earth='mountain-earthsunder-maul';
const stationary=new Set(['cooldown-heavy-t3-c','reload-heavy-t3-a','energy-light-t3-c','dot-heavy-t3-c']);
// One declared weapon/core/relic row per stable production identity. No combat selection.
export const PATHS:Record<string,{weapon:string;core:string;relic:string;reason:string}>={};
const set=(prefix:string,frame:string,values:[string,string,string,string][])=>values.forEach(([weapon,core,relic,reason],i)=>PATHS[`${prefix}-${frame}-t3-${'abc'[i]}`]={weapon,core:'core-'+core,relic:'relic-'+relic,reason});
set('cadence','light',[[rapier,'catalyst','equilibrium-shard','Aftershock repeats actual on-hit damage.'],[lash,'duelist','equilibrium-shard','Fast regular cycles maintain vulnerability and plating shred.'],[lash,'duelist','equilibrium-shard','Fast regular attacks deliver successive doubled finishers.']]);
set('cadence','balanced',[[lash,'duelist','equilibrium-shard','Metronome adds flat damage during regular-hit cycles.'],[lash,'duelist','equilibrium-shard','Buildup and post-finisher echo require repeated regular attacks.'],[axe,'duelist','equilibrium-shard','High Attack funds finisher Verdict banking; dead swings trade delivery for vulnerability.']]);
set('cadence','heavy',[[maul,'duelist','equilibrium-shard','Empowered payload with 0.55 APS rather than 0.4; Frenzy supports Rampage construction.'],[maul,'duelist','colossus-heart','Empowered finisher becomes a non-stacking bleed; potency accepted with slower repeats.'],[maul,'duelist','equilibrium-shard','Crescendo amplifies finishers during maintained engagement.']]);
set('cooldown','light',[[maul,'arcanist','hastebound-dial','Empowered weapon and Power Strike; frequent execution windows, reduced relic potency.'],[lash,'duelist','equilibrium-shard','Explicit cadence exception: regular attacks build and spend Eternal Cycle flat stacks.'],[maul,'arcanist','equilibrium-shard','Execution bypasses plating; useful Power Strike gives Arcanist an actual cast.']]);
set('cooldown','balanced',[[maul,'arcanist','equilibrium-shard','Execution payload plus useful casts; Frenzy supplies more attacks for the next Reverb.'],[maul,'arcanist','equilibrium-shard','Battery accrues by cooldown time, supports real cast damage.'],[maul,'arcanist','equilibrium-shard','Keep the native execution window; no early-trigger Rune that erases patience.']]);
set('cooldown','heavy',[[maul,'arcanist','colossus-heart','Taken-damage execution with durable support; potency trades frequency.'],[maul,'arcanist','equilibrium-shard','Normal-hit damage is suppressed; empowered execution and useful Technique payloads matter.'],[rapier,'catalyst','equilibrium-shard','Devout Priest beam applies on-hit each tick; no cast Technique or incidental Orbit.']]);
set('dot','light',[[axe,'accelerant','hastebound-dial','Medium weapon plus Accelerant supports auto-consuming poison; no max-stack condition.'],[axe,'accelerant','equilibrium-shard','Medium weapon supports sustained uncapped doom; no maximum-stack gate.'],[axe,'accelerant','equilibrium-shard','Medium weapon plus cadence supports max-stack on-hit Frenzy without consuming stacks.']]);
set('dot','balanced',[[axe,'tempered','equilibrium-shard','Medium weapon, two-stack application and full-stack direct payoff; no Detonate.'],[axe,'tempered','equilibrium-shard','Medium Attack supports fresh-target brand and subsequent full direct hits.'],[axe,'tempered','equilibrium-shard','Auto-conflagration consumes max stacks; Sweep replaces unreachable max-stack Contagion.']]);
set('dot','heavy',[[maul,'tempered','equilibrium-shard','Genuinely heavy 0.55 APS supports reaching and maintaining full-stack direct damage.'],[maul,'tempered','equilibrium-shard','Heavy but not slowest: repeated hits maintain six-second Chill and reach nine stacks.'],[earth,'tempered','equilibrium-shard','High Attack sustains total frost conversion; stationary policy, no stack-consuming Detonate.']]);
set('reload','light',[[rapier,'catalyst','equilibrium-shard','On-hit clip delivery with native empowered last round.'],[rapier,'catalyst','hastebound-dial','On-hit delivery and faster reload cycles build Momentum.'],[earth,'tempered','equilibrium-shard','Fixed two-second shot ignores weapon APS; high Attack supports the Sniper exception.']]);
set('reload','balanced',[[rapier,'catalyst','equilibrium-shard','Repeated actual hits build death marks; on-hit weapon remains useful.'],[axe,'bruiser','equilibrium-shard','Close-range volley Attack payload; medium weapon trades dead swings for large Attack.'],[rapier,'catalyst','equilibrium-shard','Alternating on-hit shot and Attack shot; Catalyst supports real on-hit half.']]);
set('reload','heavy',[[rapier,'catalyst','equilibrium-shard','Continuous laser ticks apply on-hit; no magazine/frequency assumption, no Frenzy or casts.'],[rapier,'catalyst','equilibrium-shard','Long clip regular delivery builds hair-trigger speed.'],[axe,'tempered','equilibrium-shard','Medium Attack supplies native cannon blast without forcing the slowest weapon.']]);
set('summoner','light',[[rapier,'catalyst','equilibrium-shard','Full formation unique-slot marks with normalized on-hit support.'],[rapier,'catalyst','equilibrium-shard','Kilnmaster secondary budget is 1.30 for the formation, not eight full proc budgets.'],[axe,'survivalist','equilibrium-shard','Weapon-scaled natural and scheduled shatter; Recovery supports replacement costs.']]);
set('summoner','balanced',[[axe,'survivalist','equilibrium-shard','Formation Attack supports openings and coordinated strikes; Recovery supports payments.'],[axe,'survivalist','equilibrium-shard','Attack-scaled chorus voices need living slots and sustained focus.'],[axe,'survivalist','equilibrium-shard','Ritual charges need living slots and attack opportunities; Frenzy reaches summons.']]);
set('summoner','heavy',[[axe,'survivalist','equilibrium-shard','Concentrated twin Attack budgets with owner Recovery for reconstruction.'],[maul,'duelist','equilibrium-shard','Owner-attacking close Champion exception; real owner hit support and linked contributions.'],[axe,'survivalist','equilibrium-shard','Designer authorized medium Plague Axe plus Equilibrium direction in this preparation; keep durable supports and add summon-delivered Power Strike/Frenzy.']]);
set('energy','light',[[lash,'tempered','equilibrium-shard','Fast actual hits express Flash shifts; no discharge-payload assumption.'],[earth,'tempered','equilibrium-shard','High Attack supports Overdrive; Frenzy helps charging and usable hits, Equilibrium avoids negative frequency.'],[rapier,'catalyst','equilibrium-shard','Flow is on-hit damage; repeated hits fund upkeep, no incidental Orbit.']]);
set('energy','balanced',[[rapier,'catalyst','equilibrium-shard','Charge phase has real on-hit flat and multiplier, alternate phase has Attack.'],[maul,'tempered','equilibrium-shard','Four sequential empowered strikes need four real opportunities; Warmaul supplies empowered modifier and Frenzy cadence.'],[axe,'tempered','equilibrium-shard','Medium Attack expresses energy-dependent hit magnitude without extra timing automation.']]);
set('energy','heavy',[[maul,'tempered','equilibrium-shard','Heavy Attack and 0.55 APS fund stored-energy and early execution opportunities.'],[maul,'tempered','equilibrium-shard','Avoid slowest weapon and negative frequency; five-second inactivity reset requires delivery.'],[earth,'tempered','equilibrium-shard','Storm captures Attack and normal hits extend its duration; Frenzy helps charge and extension.']]);
export const T4_CELLS:EncounterCell[]=[];
for(const seed of [101009,101033])for(let round=0;round<36;round++)for(let ri=0;ri<6;ri++){
 const variant=(round%9+ri)%9,context=CONTEXTS[(Math.floor(round/9)+ri+variant)%4],frame=frames[variant%3],path='abc'[Math.floor(variant/3)];
 const old=OLD.find(c=>c.id===`t4-${roots[ri]}-${frame}-${path}-${context.old}-s${seed}`)!;assert(old);
 const c=structuredClone(old),spec=c.build.skillPath.at(-1)!,p=PATHS[spec],boss=context.id==='M',swarm=context.id==='V',channel=['cooldown-heavy-t3-c','reload-heavy-t3-a'].includes(spec),stand=stationary.has(spec);
 c.id=`closing-${roots[ri]}-${frame}-${path}-${context.id}-s${seed}`;c.build.id=c.id;c.comparisonId=c.id;c.referenceObservationId=old.id;c.referenceSource='t4-specialization-screen-01@3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e';
 c.block=context.id;c.nodeId=context.node;c.durationMs=boss?300000:1200000;
 Object.assign(c.build.gearItemIds,{weapon:p.weapon,core:p.core,relic:p.relic});
 const durable=c.className==='conduit'||c.className==='spirit'||channel;
 c.build.gearItemIds.armor=swarm&&!durable?'volcanic-vest-t4':'mountain-vest-t4';
 c.build.gearItemIds.recovery=swarm&&!durable?'volcanic-charm-t4':'mountain-charm-t4';
 c.build.gearItemIds.mobility=c.range==='close'||stand?'mountain-boots-t4':'desert-boots-t4';
 c.stance=swarm&&!durable&&['striker','slinger'].includes(c.className)?'offensive-stance':'defensive-stance';
 c.runeRules=c.runeRules!.filter(r=>r.actionId!=='use-ability'&&r.actionId!=='focus-lowest-hp');
 if(context.id==='D'&&spec!=='reload-heavy-t3-a')c.runeRules.unshift({conditionId:'in-combat',actionId:'focus-lowest-hp'});
 c.abilities={techniques:[],guards:['second-wind','brace','cleanse',...(boss?['endure']:context.id==='T'||context.id==='D'?['break-free']:[])]};
 if(swarm){
  const consumes=['dot-light-t3-a','dot-light-t3-b','dot-balanced-t3-c'].includes(spec);
  const aoe=c.className==='apprentice'&&!consumes?'contagion':c.className==='squire'&&!channel?'slam':'sweep';
  c.abilities.techniques=[aoe,...(channel?[]:['frenzy'])];
  if(aoe==='slam')c.runeRules.push({conditionId:'n-aggro-3',actionId:'use-ability',targetAbilityId:aoe});
  if(aoe==='contagion')c.runeRules.push({conditionId:'target-max-stacks',actionId:'use-ability',targetAbilityId:aoe});
 }else if(channel)c.abilities.techniques=['expose-weakness','quick-strike'];
 else if(c.className==='squire'&&spec!=='cooldown-light-t3-b'||c.className==='conduit')c.abilities.techniques=['power-strike','frenzy'];
 else c.abilities.techniques=['quick-strike','frenzy'];
 // Paid additional ranged control is useful in sparse elites/pairs; no attack-speed slow claim.
 if(!swarm&&!boss&&!channel&&c.range!=='close'&&!(context.id==='D'&&c.className==='conduit'))c.abilities.techniques.push('hamstring');
 const cost=()=>runicPointLoadoutCost({rules:c.runeRules!,abilities:c.abilities!,stances:[c.stance!],rites:[]});
 if(channel&&!boss&&cost()+6<=45)c.abilities.guards.push('endure');
 // Declared budget priority: defining offense + encounter support first, Expose only when it fits.
 if(!c.abilities.techniques.includes('expose-weakness')&&cost()+7<=45)c.abilities.techniques.push('expose-weakness');
 if(c.className==='squire'&&spec==='cooldown-light-t3-b'&&swarm)c.build.gearItemIds.core='core-bruiser';
 if(c.build.gearItemIds.core==='core-duelist'&&swarm)c.build.gearItemIds.core='core-bruiser';
 c.preparationNotes=[p.reason,`Role template ${swarm?'swarm':boss?'boss':'controlled elite/pair'}; ${cost()}/45 RP, ${45-cost()} free. Defining offense and encounter support precede optional Expose.`,
  durable?'Mountain burst-cap/Guard armor and barrier charm retained; Recovery and actual danger response remain.':swarm?'Volcanic plating/hardening and active/kill Recovery; kills are required for the extra recovery window.':'Mountain burst-cap/Guard armor and barrier charm retain elite burst support.',
  `Base stance ${c.stance}; one paid stance, no destinations or stance automation; no rites.`,
  stand?'No incidental Orbit; native channel/standing payoff, with real telegraph/hazard avoidance retained.':'Inherited Find Enemies, telegraph escape, Avoid Hazards and Recover First; mid range Orbit uses Desert kiting boots.',
  context.id==='D'?(spec==='reload-heavy-t3-a'?'Melter native laser selects nearest in-range enemy; Focus Lowest HP cannot force laser target. Stationary nearest-target exception, no scripted dealer order.':'Paid opening Focus Lowest HP plus Cleanse and Break Free; no dealer-ID knowledge or guaranteed kill order.'):'No generic low-HP Flee and no Wait It Out.',
  boss?'Native T4 Charge lane -> hit-conditional Earthshatter/fault lines. Step Back reads telegraph; Brace/Endure retain owner HP triggers, no hardcoded timing.':'One continuous life; 5/10/20 minute endpoints, first owner death stops.',
  channel?'Armed Techniques use production channel adapters; no wind-up cast interrupts the channel; Melter has no Frenzy speed assumption.':'Native default Technique priority unless the exact AoE Rune overrides it.',
  `Unused RP ${45-cost()} is below the next optional Expose cost or avoids redundant channel/mobility/cast tools; no budget filler or precharge.`];
 assert(cost()<=45,`${c.id}: ${cost()} RP`);T4_CELLS.push(c);
}
// Predeclared tail: one field per eligible identity, only T and M, no duplicate controls.
export const ALTERNATIVES=[
 {spec:'summoner-balanced-t3-c',slot:'relic',value:'relic-hastebound-dial',reason:'Ritualist reconstruction frequency versus potency; no direct DPS multiplier inference.'},
 {spec:'energy-balanced-t3-b',slot:'weapon',value:lash,reason:'Stormbringer cadence versus empowered payload across four sequential strikes.'},
 {spec:'energy-light-t3-b',slot:'weapon',value:axe,reason:'Surge medium cadence and dead swings versus slow high-Attack reference.'},
 {spec:'energy-heavy-t3-c',slot:'weapon',value:axe,reason:'Tempest charge/extension opportunities versus slow weapon; whole weapon tradeoff.'},
 {spec:'dot-heavy-t3-a',slot:'weapon',value:earth,reason:'Icebreaker slower heavier Attack versus maintaining direct-hit windows.'},
 {spec:'reload-heavy-t3-a',slot:'core',value:'core-tempered',reason:'Melter on-hit amplification versus general damage and owner HP.'},
 {spec:'cooldown-balanced-t3-a',slot:'weapon',value:lash,reason:'Reverb attacks bank next execution; faster delivery versus empowered weapon payload.'},
] as const;
for(const alt of ALTERNATIVES)for(const seed of [101009,101033])for(const block of ['T','M']){
 const original=T4_CELLS.find(c=>c.seed===seed&&c.block===block&&c.build.skillPath.at(-1)===alt.spec)!;
 const c=structuredClone(original);c.id+='-alt';c.build.id=c.id;c.referenceObservationId=original.id;c.referenceSource=T4_ID;c.build.gearItemIds[alt.slot]=alt.value;
 c.preparationNotes=[...c.preparationNotes,`OPTIONAL one-field alternative: ${alt.slot}=${alt.value}. ${alt.reason} All other package fields, seed, fixture, duration, rules and initial-state policy unchanged.`];T4_CELLS.push(c);
}
export const T4_BLOCKS:Record<string,{cells:EncounterCell[];durationMs:number;pilotIds:string[]}>=Object.fromEntries(T4_CELLS.map(c=>[c.id,{cells:[c],durationMs:c.durationMs,pilotIds:[]}]));
for(const seed of [101009,101033])for(const context of CONTEXTS){const cells=T4_CELLS.filter(c=>c.seed===seed&&c.block===context.id);T4_BLOCKS[`qualification-${seed}-${context.id}`]={cells,durationMs:cells[0].durationMs,pilotIds:[]};}
export function assertT4Definitions(){
 assert.equal(Object.keys(PATHS).length,54);assert.equal(T4_CELLS.length,460);assert.equal(new Set(T4_CELLS.map(c=>c.id)).size,460);
 assert.equal(new Set(T4_CELLS.slice(0,54).map(c=>c.identityId)).size,54);
 const roster=[...SKILL_TREE.keys()].filter(id=>/^(cadence|cooldown|dot|reload|summoner|energy)-(light|balanced|heavy)-t3-[abc]$/.test(id));assert.deepEqual(Object.keys(PATHS).sort(),roster.sort());
 for(const c of T4_CELLS){assert.equal(NODE_BIOMES[c.nodeId].biomeTier,4);assert(!/graveyard|trench/.test(c.nodeId));assert(c.runeRules!.every(r=>r.actionId!=='wait-it-out'&&r.actionId!=='flee'));assert(c.build.playerTier===4);assert.equal(c.durationMs,c.role==='boss'?300000:1200000);const core=ITEM_DATABASE.get(c.build.gearItemIds.core!)!;assert(coreIsActive(core.coreEligibility,c.build.skillPath.find(id=>id.includes('-range-'))??null));if(c.role==='boss')assert.equal(DUNGEON_DEFS.get(c.nodeId)?.boss.bossId,'iron-crest-titan');}
 for(const seed of [101009,101033])for(const context of CONTEXTS)assert.equal(T4_CELLS.slice(0,432).filter(c=>c.seed===seed&&c.block===context.id).length,54);
}
assertT4Definitions();
