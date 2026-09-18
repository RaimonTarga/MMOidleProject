import assert from 'node:assert/strict';
import {MONSTER_DATABASE,NODE_BIOMES} from '@mmo-idle/shared';
import {DURABILITY34_JUNGLE_HP} from './durability34Spec';
import {NIGHT5_BLOCKS,type Night5Cell} from './night5Spec';
import {SURVEY_CLASSES} from './ttkSurveySpec';

/** Block M deliberately REUSES Durability35's seeds to revisit its residual cases. */
export const DURABILITY36_ARMOR_SEEDS=[75011,77003,79001] as const;
/** Block J is a new question and draws fresh declared seeds. */
export const DURABILITY36_LADDER_SEEDS=[81013,83003,85009] as const;

// ── Block M — one local armor adaptation at the ADOPTED enemy baseline.
//
// Durability35's package (attack 50 -> 40) is now the authored value, so both
// arms here sit on it and no monster contrast exists in this block. The residual
// cases it left are the ones tested: Slinger on heavy, Apprentice on heavy and
// on swarming.
//
// The arms swap ONE item. Arcane Wrappings (swamp) carries maxHp 30 / plating 4
// and `defense.dot-resistance` 0.2; Fallen Knight Plate (mountain) carries
// maxHp 32 / plating 5 and `guard.potency-pct` 0.15. Mountain has no DoT, so the
// swamp mechanic is inert there while the plate amplifies Second Wind. This is
// the WHOLE armor substitution, not an isolated estimate of guard potency, and
// the plate is NOT a damage-cap item.
//
// ACQUISITION BOUNDARY: the plate recipe needs Mountain level 2 and +3 needs
// Mountain level 4, so this is a post-acquisition FARMING ADAPTATION, not
// protection already owned on the first step into Mountain. Success here must
// not be read as fixing first entry.
export const DURABILITY36_ARMOR_ARMS={reference:'swamp-vest-t1',localArmor:'mountain-vest-t1'} as const;

const ARMOR_CONTEXTS=[
 {className:'slinger',nodeId:'node-t1-mountain-01'},
 {className:'apprentice',nodeId:'node-t1-mountain-01'},
 {className:'apprentice',nodeId:'node-t1-mountain-02'},
] as const;

const mountainArmor: Night5Cell[] = ARMOR_CONTEXTS.flatMap(ctx => {
 const c=SURVEY_CLASSES.find(x=>x.name===ctx.className)!;
 return (['reference','local-armor'] as const).map(treatment => {
  const id=`dur36-armor-${ctx.nodeId.slice(-2)}-${ctx.className}-${treatment}`;
  return {
   id, nodeId: ctx.nodeId, tier: 1, role: 'mountain', className: ctx.className,
   alternate: false, treatment, targetTypes: ['ridge-archer','cliff-hopper'],
   technique: 'sweep' as const, upgradeLevel: 3, guards: ['second-wind'],
   build: {
    id, classRoot: `${c.prefix}-root`, contentTier: 1, playerTier: 1, gearTier: 1,
    skillPath: [`${c.prefix}-root`],
    gearItemIds: {
     weapon: c.weapons[0],
     armor: treatment==='reference' ? DURABILITY36_ARMOR_ARMS.reference : DURABILITY36_ARMOR_ARMS.localArmor,
     // Charm, boots, weapon, upgrades, abilities and runes are all unchanged.
     recovery: 'swamp-charm-t1', mobility: 'plains-boots-t1',
    },
   },
  } satisfies Night5Cell;
 });
});

// ── Block J — the ACTUAL Jungle role-duration ladder across T2/T3/T4.
//
// One configuration per tier, not two HP arms. The node03 family is used because
// all three tiers share the `dominion` modifier, which is verified below rather
// than assumed from the suffix.
export const DURABILITY36_LADDER_NODES={2:'node-t2-jungle-03',3:'node-t3-jungle-03',4:'node-t4-jungle-03'} as const;

/** Primary lineage under test; the constrictor is a separate T4 role. */
export const DURABILITY36_LINEAGE={2:'jungle-ape',3:'silverback',4:'apex-silverback'} as const;

const ladderT4: Night5Cell[] = NIGHT5_BLOCKS.t4a.cells
 .filter((c:Night5Cell)=>c.role==='jungle'&&c.nodeId===DURABILITY36_LADDER_NODES[4])
 .map((c:Night5Cell)=>{
  const id=c.id.replace('night5-t4a','dur36-ladder-t4').replace(/-baseline$/,'');
  return {
   ...c, id, treatment: 'tier-4', targetTypes: [DURABILITY36_LINEAGE[4]],
   build: {...c.build, id, skillPath: [...c.build.skillPath], gearItemIds: {...c.build.gearItemIds}},
  };
 });

const ladderLower: Night5Cell[] = ([2,3] as const).flatMap(tier =>
 SURVEY_CLASSES.map(c => {
  const id=`dur36-ladder-t${tier}-jungle-03-${c.name}`;
  return {
   id, nodeId: DURABILITY36_LADDER_NODES[tier], tier, role: 'jungle', className: c.name,
   alternate: false, treatment: `tier-${tier}`, targetTypes: [DURABILITY36_LINEAGE[tier]],
   technique: 'sweep' as const,
   build: {
    id, classRoot: `${c.prefix}-root`, contentTier: tier, playerTier: tier, gearTier: tier,
    // Tier-legal progression: balanced at T2, plus the range pick at T3.
    skillPath: [`${c.prefix}-root`, `${c.prefix}-balanced`,
      ...(tier>=3 ? [`${c.prefix}-range-${c.melee?'close':'mid'}`] : [])],
    gearItemIds: {
     weapon: c.weapons[tier-1], armor: `jungle-vest-t${tier}`,
     recovery: `jungle-charm-t${tier}`, mobility: `mountain-boots-t${tier}`,
     core: 'core-tempered',
    },
   },
  } satisfies Night5Cell;
 }),
);

export const DURABILITY36_BLOCKS: Record<string,{cells:Night5Cell[];durationMs:number;pilotIds:string[]}> = {
 'mountain-armor': {
  cells: mountainArmor, durationMs: 300000,
  pilotIds: mountainArmor.filter(c=>c.className==='slinger').map(c=>c.id),
 },
 'jungle-ladder': {
  cells: [...ladderLower, ...ladderT4], durationMs: 300000,
  // One root per tier, so all three tiers are exercised before the cohort.
  pilotIds: [...ladderLower, ...ladderT4].filter(c=>c.className==='striker').map(c=>c.id),
 },
};

/**
 * Block M overlays nothing: its treatment is the armor slot, and the enemy
 * baseline is already authored. Block J installs the RETAINED Durability34
 * Jungle HP package for its T4 tier only, and restores it afterwards - unless
 * that package has since been integrated, in which case it is already live and
 * must not be applied a second time.
 */
export function installDurability36Treatment(cell:Night5Cell){
 const none={changes:[] as {type:string;before:number;after:number;beforeAttack:number;afterAttack:number}[],restore(){}};
 if(cell.role!=='jungle'||cell.tier!==4) return none;
 const saved=Object.entries(DURABILITY34_JUNGLE_HP).map(([type,[before,after]])=>{
  const d=MONSTER_DATABASE.get(type);
  assert(d,`missing ${type}`);
  // Either the pre-adoption value (install the overlay) or the adopted value
  // (already live). Anything else means an unexpected third state.
  assert(d.stats.hp===before||d.stats.hp===after,
   `${type}: HP is ${d.stats.hp}, expected the pre-adoption ${before} or the adopted ${after}`);
  return {type,before,after,live:d.stats.hp===after,attack:d.stats.attack};
 });
 const alreadyIntegrated=saved.every(s=>s.live);
 assert(alreadyIntegrated||saved.every(s=>!s.live),
  'the Jungle package is half-integrated; refusing to guess which half to overlay');
 if(alreadyIntegrated) return {...none, changes: saved.map(s=>({type:s.type,before:s.after,after:s.after,beforeAttack:s.attack,afterAttack:s.attack}))};
 for(const s of saved) MONSTER_DATABASE.get(s.type)!.stats.hp=s.after;
 return {
  changes:saved.map(s=>({type:s.type,before:s.before,after:s.after,beforeAttack:s.attack,afterAttack:s.attack})),
  restore(){for(const s of saved) MONSTER_DATABASE.get(s.type)!.stats.hp=s.before;},
 };
}

export function assertDurability36Definitions(): void {
 // Block M sits on the ADOPTED enemy baseline; both arms must see the same one.
 for(const id of ['ridge-archer','cliff-hopper']){
  const d=MONSTER_DATABASE.get(id);
  assert(d,`missing ${id}`);
  assert.equal(d.stats.attack,40,`${id}: Block M requires the adopted attack of 40`);
 }
 assert.equal(MONSTER_DATABASE.get('ridge-archer')?.chargedAttack?.multiplier,2.2,'Power Shot stays 2.2');
 assert.equal(MONSTER_DATABASE.get('cliff-hopper')?.chargedAttack?.multiplier,1.9,'Strong Kick multiplier fixed');

 // Block J: matched modifier roles across the three tiers, verified not assumed.
 const modifiers=([2,3,4] as const).map(t=>{
  const b=NODE_BIOMES[DURABILITY36_LADDER_NODES[t]] as {biomeTier:number;biomeGroup:string;modifier?:string};
  assert(b,`missing node for tier ${t}`);
  assert.equal(b.biomeTier,t,`tier ${t} node drift`);
  assert.equal(b.biomeGroup,'jungle',`tier ${t} node must be Jungle`);
  return b.modifier;
 });
 assert(new Set(modifiers).size===1,
  `the ladder needs comparable modifier roles across tiers, found ${modifiers.join(', ')}`);

 // The lineage the ladder is actually about.
 for(const [tier,type] of Object.entries(DURABILITY36_LINEAGE)){
  const d=MONSTER_DATABASE.get(type);
  assert(d,`missing lineage member ${type} for tier ${tier}`);
 }
 // REBASED 2026-09-18: the adopted Jungle ladder moves the T3 anchor 2090 -> 3200.
 assert.equal(MONSTER_DATABASE.get('silverback')?.stats.hp,3200,'T3 lineage anchor drift');
}
