import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY33_BLOCKS} from './durability33Spec';
import {SURVEY_CLASSES} from './ttkSurveySpec';
import type {Night5Cell} from './night5Spec';

/** Block J: one role-based Jungle durability candidate. Fresh predeclared seeds. */
export const DURABILITY34_JUNGLE_SEEDS=[63011,65003,67001] as const;
/** Block M: the guard substitution. Fresh predeclared seeds. */
export const DURABILITY34_MOUNTAIN_SEEDS=[69001,71003,73009] as const;

/**
 * HP-only Jungle candidate, justified by measurement and by an authored ladder
 * inversion rather than by an invented duration band.
 *
 * Durability33 measured clean body TTK over 2,134 engagements across all six
 * roots and both T4A nodes (equal-weight-by-root aggregation):
 *   emerald-constrictor 1700 HP -> 3.55 s
 *   apex-silverback     1450 HP -> 2.90 s
 *   thornback-lizard    1000 HP -> 1.77 s
 *   hunting-panther      950 HP -> 1.90 s
 *
 * And the authored ladder runs backwards: the T3 Jungle anchor `silverback` is
 * 2090 HP / 83 attack, while the T4 anchor `apex-silverback` is 1450 / 77. Every
 * T4 Jungle species is authored below the T3 anchor.
 *
 * The candidate restores monotonicity with one modest step and touches the two
 * durable roles only, so the fast bodies stay distinct. Expected TTK is roughly
 * 5.8 s and 7.1 s, since these are DPS races: none of the four species authors a
 * chargedAttack or monsterAbilities, so raising HP does not add a cast mechanic.
 * It does give the authored `rampOnCombat` (apex) and `cadenceFinisher`
 * (constrictor) time to develop, which a 3 s body cannot.
 */
export const DURABILITY34_JUNGLE_HP: Record<string,[number,number]>={
 'apex-silverback':[1450,2900],
 'emerald-constrictor':[1700,3400],
};
/** Deliberately untouched, so role separation is preserved. */
export const DURABILITY34_JUNGLE_UNCHANGED=['hunting-panther','thornback-lizard'] as const;

const copy=(c:Night5Cell,id:string):Night5Cell=>
 ({...c,id,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}});

// ── Block J — six roots x two nodes x control/candidate.
const jungleDurability: Night5Cell[] = DURABILITY33_BLOCKS['jungle-breadth'].cells
 .flatMap((base:Night5Cell) => (['control','candidate'] as const).map(treatment => {
  const id = base.id.replace('dur33-breadth','dur34-jungle').replace(/-baseline$/, `-${treatment}`);
  const cell = copy(base, id);
  cell.treatment = treatment;
  cell.targetTypes = Object.keys(DURABILITY34_JUNGLE_HP);
  return cell;
 }));

// ── Block M — T1 Mountain, one legal defensive SUBSTITUTION.
//
// Not "Brace added for free": Brace replaces Second Wind. Measured costs are
// Sweep 6, Second Wind 6, Brace 5, so the substitution is CHEAPER than the
// reference (melee 17 vs 18, ranged 20 vs 21 against a budget of 22). The freed
// point is deliberately left unspent so the contrast stays one factor.
//
// Neither guard reacts to a cast. Both are `hp-below` instants: Second Wind
// triggers under 60% and heals (recoveryPct 0.5 over 4 s, 12 s cooldown); Brace
// triggers under 50% and gives 35% damage reduction for 3 s on a 10 s cooldown.
// So this is a sustain-versus-mitigation opportunity cost, NOT reactive
// counterplay to Power Shot, which publishes no telegraph and tracks the player.
export const DURABILITY34_GUARD_ARMS={reference:['second-wind'],substitution:['brace']} as const;
const MOUNTAIN_NODE='node-t1-mountain-01';

const mountainGuard: Night5Cell[] = SURVEY_CLASSES.flatMap(c =>
 (['reference','substitution'] as const).map(treatment => {
  const id=`dur34-mtn-guard-${c.name}-${treatment}`;
  return {
   id, nodeId: MOUNTAIN_NODE, tier: 1, role: 'mountain', className: c.name,
   alternate: false, treatment, targetTypes: ['ridge-archer'],
   technique: 'sweep' as const, upgradeLevel: 3,
   guards: [...DURABILITY34_GUARD_ARMS[treatment]],
   build: {
    id, classRoot: `${c.prefix}-root`, contentTier: 1, playerTier: 1, gearTier: 1,
    skillPath: [`${c.prefix}-root`],
    // Durability33's source-inspired earned-entry kit, unchanged.
    gearItemIds: {
     weapon: c.weapons[0], armor: 'swamp-vest-t1',
     recovery: 'swamp-charm-t1', mobility: 'plains-boots-t1',
    },
   },
  } satisfies Night5Cell;
 }),
);

export const DURABILITY34_BLOCKS: Record<string,{cells:Night5Cell[];durationMs:number;pilotIds:string[]}> =
 Object.fromEntries(([
  ['jungle-durability', jungleDurability, 300000],
  ['mountain-guard', mountainGuard, 300000],
 ] as const).map(([name,raw,ms])=>{
  const cells=raw as Night5Cell[];
  const pilotIds=name==='mountain-guard'
   ? cells.filter(c=>c.className==='striker').map(c=>c.id)
   : cells.filter(c=>c.nodeId.endsWith('03')&&c.className==='striker').map(c=>c.id);
  return [name,{cells,durationMs:ms,pilotIds}];
 }));

/** Block J overlays HP only. Block M overlays nothing; its treatment is the loadout. */
export function installDurability34Treatment(cell:Night5Cell){
 const empty={changes:[] as {type:string;before:number;after:number;beforeAttack:number;afterAttack:number}[],restore(){}};
 if(cell.role!=='jungle') return empty;
 const saved=Object.entries(DURABILITY34_JUNGLE_HP).map(([type,[before,after]])=>{
  const d=MONSTER_DATABASE.get(type);
  assert(d,`missing ${type}`);
  assert.equal(d.stats.hp,before,`${type} baseline drift`);
  return {type,before,after,attack:d.stats.attack};
 });
 if(cell.treatment!=='candidate') return {changes:[],restore(){}};
 for(const s of saved) MONSTER_DATABASE.get(s.type)!.stats.hp=s.after;
 return {
  changes:saved.map(s=>({type:s.type,before:s.before,after:s.after,beforeAttack:s.attack,afterAttack:s.attack})),
  restore(){for(const s of saved) MONSTER_DATABASE.get(s.type)!.stats.hp=s.before;},
 };
}

export function assertDurability34Definitions(): void {
 // Jungle: the two treated roles, the two deliberately untouched ones, and the
 // T3 anchor whose value is the whole reason for the candidate's magnitude.
 for(const [type,[before]] of Object.entries(DURABILITY34_JUNGLE_HP)){
  const d=MONSTER_DATABASE.get(type);
  assert(d,`missing ${type}`);
  assert.equal(d.stats.hp,before,`${type} HP drift`);
  assert.equal(d.chargedAttack,undefined,`${type} gained a charged attack; the candidate's reasoning assumed none`);
 }
 assert.equal(MONSTER_DATABASE.get('hunting-panther')?.stats.hp,950,'hunting-panther must stay a fast body');
 assert.equal(MONSTER_DATABASE.get('thornback-lizard')?.stats.hp,1000,'thornback-lizard must stay a fast body');
 assert.equal(MONSTER_DATABASE.get('silverback')?.stats.hp,2090,'T3 Jungle anchor drift invalidates the ladder argument');
 // Mountain: Block M holds every monster fixed; only the guard loadout moves.
 const archer=MONSTER_DATABASE.get('ridge-archer');
 assert(archer,'ridge-archer must exist');
 assert.equal(archer.chargedAttack?.multiplier,2.2,'Power Shot must stay at 2.2 in BOTH arms of Block M');
 // Rebased 2026-09-18: the adopted T1 Mountain package authors 40.
 assert.equal(archer.stats.attack,40,'ridge-archer attack drift');
 assert.equal(MONSTER_DATABASE.get('cliff-hopper')?.stats.attack,40,'cliff-hopper attack drift');
 assert.equal(MONSTER_DATABASE.get('cliff-hopper')?.stats.hp,190,'cliff-hopper HP drift');
}
