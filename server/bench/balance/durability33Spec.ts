import assert from 'node:assert/strict';
import {ABILITY_DATABASE,MONSTER_DATABASE,biomeLevelCap,globalMastery,listBiomeGroupsAtTier,runeBudgetForGlobalMastery} from '@mmo-idle/shared';
import {DURABILITY32_BLOCKS,RIDGE_ARCHER_POWER_SHOT_CANDIDATE,RIDGE_ARCHER_POWER_SHOT_CONTROL} from './durability32Spec';
import {SURVEY_CLASSES} from './ttkSurveySpec';
import type {Night5Cell} from './night5Spec';

/** Block A revisits the known failures, so it keeps their historical seeds. */
export const DURABILITY33_REPAIR_SEEDS=[44017,46021,48017] as const;
/** Block C reuses Durability32's breadth seeds so the coverage question is continuous. */
export const DURABILITY33_BREADTH_SEEDS=[51001,53017,55009] as const;
/** Block B is a new preparation context and draws fresh declared seeds. */
export const DURABILITY33_ENTRY_SEEDS=[57001,59021,61003] as const;

const copy=(c:Night5Cell,id:string):Night5Cell=>
 ({...c,id,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}});

// ── Block A — the same four Jungle setups, now on repaired source.
const jungleRepair=DURABILITY32_BLOCKS['jungle-repair'].cells.map((c:Night5Cell)=>copy(c,c.id.replace('dur32','dur33')));

// ── Block C — Jungle breadth, gated on Block A's behavioral result.
const jungleBreadth=DURABILITY33_BREADTH_CELLS();
function DURABILITY33_BREADTH_CELLS(): Night5Cell[] {
 return DURABILITY32_BLOCKS['jungle-breadth'].cells.map((c:Night5Cell)=>copy(c,c.id.replace('dur32','dur33')));
}

// ── Block B — T1 Mountain at a DEFENSIBLE first-arrival preparation.
//
// Durability32's `first-arrival` preset was +0 previous-biome gear. The shipped
// T1 route reaches Mountain having maxed Forest and Swamp, carrying +3 gear and
// a Swamp vest/charm. That matters for the decision: at the old preset 29 of 36
// runs died in 13-26 s and 29 of 41 fatal blows overkilled the HP they hit, so a
// ~13 HP reduction could not change an outcome. This context sits where it can.
//
// ONE delta from Durability32's first-arrival: the earned kit. Guards stay at the
// tier default so this does not become a guard experiment in the same arm.
//
// Brace is deliberately NOT attuned, and that is a finding rather than an
// omission: at T1 the Runic Point budget is 22, and Sweep(6) + Second Wind(6) +
// Brace(5) plus the shared rune logic does not fit (23 for melee, more for the
// ranged roots that also pay for Orbit). The only mitigation counterplay to a
// telegraph-less, player-tracking Power Shot is therefore not affordable
// alongside the standard sustain guard. assertDurability33Definitions pins that.
const ENTRY_NODE='node-t1-mountain-01';
const ENTRY_GUARDS=['second-wind'];
const ENTRY_UPGRADE=3;

const mountainEntry: Night5Cell[] = SURVEY_CLASSES.flatMap(c =>
 (['control','candidate'] as const).map(treatment => {
  const id=`dur33-mtn-entry-${c.name}-${treatment}`;
  return {
   id, nodeId: ENTRY_NODE, tier: 1, role: 'mountain', className: c.name,
   alternate: false, treatment, targetTypes: ['ridge-archer'],
   technique: 'sweep' as const, upgradeLevel: ENTRY_UPGRADE, guards: [...ENTRY_GUARDS],
   build: {
    id, classRoot: `${c.prefix}-root`, contentTier: 1, playerTier: 1, gearTier: 1,
    skillPath: [`${c.prefix}-root`],
    // The kit the route actually holds on arrival: Swamp defence, Plains boots.
    gearItemIds: {
     weapon: c.weapons[0], armor: 'swamp-vest-t1',
     recovery: 'swamp-charm-t1', mobility: 'plains-boots-t1',
    },
   },
  } satisfies Night5Cell;
 }),
);

export const DURABILITY33_BLOCKS: Record<string,{cells:Night5Cell[];durationMs:number;pilotIds:string[]}> =
 Object.fromEntries(([
  ['jungle-repair', jungleRepair, 120000],
  ['mountain-entry', mountainEntry, 300000],
  ['jungle-breadth', jungleBreadth, 300000],
 ] as const).map(([name,raw,ms])=>{
  const cells=raw as Night5Cell[];
  const pilotIds=name==='mountain-entry'
   // One matched pair, so both arms are exercised before the cohort.
   ? cells.filter(c=>c.className==='striker').map(c=>c.id)
   : cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id);
  return [name,{cells,durationMs:ms,pilotIds}];
 }));

/** Only Block B overlays anything, and only one authored field. */
export function installDurability33Treatment(cell:Night5Cell){
 const archer=MONSTER_DATABASE.get('ridge-archer');
 assert(archer?.chargedAttack,'ridge-archer must still author a charged attack');
 const before=archer.chargedAttack.multiplier;
 if(cell.role!=='mountain'){
  return {changes:[] as {type:string;before:number;after:number;beforeAttack:number;afterAttack:number}[],restore(){}};
 }
 assert.equal(before,RIDGE_ARCHER_POWER_SHOT_CONTROL,'Power Shot multiplier drift; reconcile before freezing');
 const after=cell.treatment==='candidate'?RIDGE_ARCHER_POWER_SHOT_CANDIDATE:RIDGE_ARCHER_POWER_SHOT_CONTROL;
 archer.chargedAttack.multiplier=after;
 return {
  changes:[{type:'ridge-archer',before:archer.stats.hp,after:archer.stats.hp,beforeAttack:before,afterAttack:after}],
  restore(){archer.chargedAttack!.multiplier=before;},
 };
}

export function assertDurability33Definitions(): void {
 const archer=MONSTER_DATABASE.get('ridge-archer');
 assert(archer,'ridge-archer must exist');
 assert.equal(archer.name,'Ridge Ambusher','Ridge Ambusher identity drift');
 assert.equal(archer.stats.hp,240,'ridge-archer HP drift');
 // Rebased 2026-09-18: the adopted T1 Mountain package authors 40.
 assert.equal(archer.stats.attack,40,'ridge-archer attack drift');
 assert.equal(archer.chargedAttack?.multiplier,RIDGE_ARCHER_POWER_SHOT_CONTROL,'Power Shot multiplier drift');
 assert.equal(archer.chargedAttack?.aoe,undefined,'Power Shot must remain an unplanted, tracking cast');
 // Cliff Hopper landed 29 of Durability32's 41 killing blows and is deliberately
 // NOT touched here; a drift would silently change what Block B measures.
 const hopper=MONSTER_DATABASE.get('cliff-hopper');
 assert(hopper,'cliff-hopper must exist');
 assert.equal(hopper.stats.hp,190,'cliff-hopper HP drift');
 assert.equal(hopper.stats.attack,40,'cliff-hopper attack drift');
 // The affordability constraint the Mountain block reports on. If Brace ever
 // becomes attunable alongside Second Wind at T1, this block's framing changes.
 const levels:Record<string,number>={};
 for(const g of listBiomeGroupsAtTier(1)) levels[g]=biomeLevelCap(1,g);
 const budget=runeBudgetForGlobalMastery(globalMastery(levels));
 assert.equal(budget,22,'T1 Runic Point budget drift');
 const cost=(ids:string[])=>ids.reduce((n,id)=>n+(ABILITY_DATABASE.get(id)?.attunementCost??0),0);
 assert.equal(cost(['sweep','second-wind']),12,'T1 default ability cost drift');
 assert(cost(['sweep','second-wind','brace'])>budget-6,'Brace must still be unaffordable beside Second Wind at T1');
}
