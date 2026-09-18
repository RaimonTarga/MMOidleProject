import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY30_BLOCKS} from './durability30Spec';
import {NIGHT5_BLOCKS,type Night5Cell} from './night5Spec';
import {SURVEY_CLASSES} from './ttkSurveySpec';

/** Block A replays the diagnosed reproductions, so it keeps their historical seeds. */
export const DURABILITY32_REPAIR_SEEDS=[44017,46021,48017] as const;
/** Blocks B and C are new questions and draw fresh seeds. */
export const DURABILITY32_SEEDS=[51001,53017,55009] as const;

/** Ridge Ambusher's authored Power Shot multiplier at the frozen revision. */
export const RIDGE_ARCHER_POWER_SHOT_CONTROL=2.2;
/** The one local candidate under test. Not a presumed correct value. */
export const RIDGE_ARCHER_POWER_SHOT_CANDIDATE=1.8;

const copy=(c:Night5Cell,id:string):Night5Cell=>
 ({...c,id,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}});

// ── Block A — the four Durability30/31 Jungle setups, unchanged, on repaired source.
// Same cells, same seeds, same 120 s window: the only difference from Durability31
// is that the status-only bush no longer traps hazard-aware target selection.
const jungleRepair=(DURABILITY30_BLOCKS.jungle.cells as Night5Cell[]).map((c:Night5Cell)=>copy(c,c.id.replace('dur30','dur32')));

// ── Block C — Jungle breadth once navigation is usable: six roots, two nodes.
// Reuses the shipped T4A specialization cells rather than inventing a new kit.
const jungleBreadth=NIGHT5_BLOCKS.t4a.cells
 .filter(c=>c.role==='jungle')
 .map(c=>copy(c,c.id.replace('night5','dur32-breadth')));

// ── Block B — T1 Mountain Power Shot.
// Two preparation contexts x two multiplier arms x six roots. The causal treatment
// is the multiplier WITHIN a context; the contexts differ in several preparation
// inputs at once and their contrast is not a single-item effect.
interface MountainContext {
  id: string;
  nodeId: string;
  upgradeLevel: number;
  gear: (group: string) => { armor: string; recovery: string; mobility: string };
}
const MOUNTAIN_CONTEXTS: MountainContext[] = [
 {
  // What a character actually carries walking into Mountain for the first time:
  // the previous biome's kit, unupgraded.
  id: 'first-arrival', nodeId: 'node-t1-mountain-01', upgradeLevel: 0,
  gear: () => ({armor:'plains-vest-t1', recovery:'plains-charm-t1', mobility:'plains-boots-t1'}),
 },
 {
  // An ordinary prepared T1 Mountain farmer: the local kit at the bench's +5.
  id: 'prepared-farming', nodeId: 'node-t1-mountain-04', upgradeLevel: 5,
  gear: () => ({armor:'mountain-vest-t1', recovery:'mountain-charm-t1', mobility:'mountain-boots-t1'}),
 },
];

const mountainPowerShot: Night5Cell[] = MOUNTAIN_CONTEXTS.flatMap(context =>
 SURVEY_CLASSES.flatMap(c =>
  (['control','candidate'] as const).map(treatment => {
   const id=`dur32-mtn-t1-${c.name}-${context.id}-${treatment}`;
   return {
    id, nodeId: context.nodeId, tier: 1, role: 'mountain', className: c.name,
    alternate: false, treatment, targetTypes: ['ridge-archer'],
    technique: 'sweep' as const, upgradeLevel: context.upgradeLevel,
    // Ranged roots orbit by default in prepareSurveyBot; leave that untouched so
    // this block does not quietly become a movement-policy experiment too.
    build: {
     id, classRoot: `${c.prefix}-root`, contentTier: 1, playerTier: 1, gearTier: 1,
     skillPath: [`${c.prefix}-root`],
     gearItemIds: {weapon: c.weapons[0], ...context.gear(c.name)},
    },
   } satisfies Night5Cell;
  }),
 ),
);

export const DURABILITY32_BLOCKS: Record<string,{cells:Night5Cell[];durationMs:number;pilotIds:string[]}> =
 Object.fromEntries(([
  ['jungle-repair', jungleRepair, 120000],
  ['mountain-powershot', mountainPowerShot, 300000],
  ['jungle-breadth', jungleBreadth, 300000],
 ] as const).map(([name,raw,ms])=>{
  const cells=raw as Night5Cell[];
  const pilotIds=name==='mountain-powershot'
   // One matched control/candidate pair per context, so both arms and both
   // preparation contexts are exercised before the cohort.
   ? cells.filter(c=>c.className==='striker').map(c=>c.id)
   : cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id);
  return [name,{cells,durationMs:ms,pilotIds}];
 }));

/**
 * Block B changes exactly one authored number: Ridge Ambusher's charged-attack
 * multiplier. Everything else about that species, Cliff Hopper, populations and
 * geometry stays at the frozen values. Blocks A and C apply no overlay at all.
 */
export function installDurability32Treatment(cell:Night5Cell){
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
  // HP is untouched here; the survey's change record is HP-shaped, so the attack
  // columns carry the multiplier and the HP columns stay equal by design.
  changes:[{type:'ridge-archer',before:archer.stats.hp,after:archer.stats.hp,beforeAttack:before,afterAttack:after}],
  restore(){archer.chargedAttack!.multiplier=before;},
 };
}

/** Fail loudly if the authored starting point moved under the packet. */
export function assertDurability32Definitions(): void {
 const archer=MONSTER_DATABASE.get('ridge-archer');
 assert(archer,'ridge-archer must exist');
 assert.equal(archer.name,'Ridge Ambusher','Ridge Ambusher identity drift');
 assert.equal(archer.stats.hp,240,'ridge-archer HP drift');
 // Rebased 2026-09-18: the adopted T1 Mountain package authors 40.
 assert.equal(archer.stats.attack,40,'ridge-archer attack drift');
 assert.equal(archer.stats.attackCooldown,3100,'ridge-archer cadence drift');
 assert.equal(archer.stats.attackRange,210,'ridge-archer range drift');
 assert.equal(archer.chargedAttack?.name,'Power Shot','Power Shot identity drift');
 assert.equal(archer.chargedAttack?.castMs,2000,'Power Shot cast drift');
 assert.equal(archer.chargedAttack?.cooldownMs,8000,'Power Shot cooldown drift');
 assert.equal(archer.chargedAttack?.initialCooldownMs,3500,'Power Shot initial cooldown drift');
 assert.equal(archer.chargedAttack?.multiplier,RIDGE_ARCHER_POWER_SHOT_CONTROL,'Power Shot multiplier drift');
 // The counterplay audit in the operator packet depends on this staying unplanted:
 // no aoe means no slam-telegraph zone, so Step Back never sees the wind-up.
 assert.equal(archer.chargedAttack?.aoe,undefined,'Power Shot must remain an unplanted, tracking cast');
}
