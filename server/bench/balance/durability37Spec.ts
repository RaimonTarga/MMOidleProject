import assert from 'node:assert/strict';
import {BIOME_DATABASE,MONSTER_DATABASE,NODE_BIOMES} from '@mmo-idle/shared';
import {DURABILITY36_BLOCKS,DURABILITY36_LADDER_NODES,DURABILITY36_LADDER_SEEDS,DURABILITY36_LINEAGE} from './durability36Spec';
import {NIGHT5_BLOCKS,type Night5Cell} from './night5Spec';
import {SURVEY_CLASSES} from './ttkSurveySpec';

/**
 * Durability37 — mob integration regression.
 *
 * This packet installs NOTHING. Every package it exercises is authored source as
 * of the 2026-09-18 consolidated adoption, so there is no control arm, no HP grid
 * and no overlay to restore. It is a REGRESSION of one integrated candidate, not
 * another selection search.
 *
 * Block J re-measures the Jungle duration ladder the adoption was meant to fix.
 * Block I spot-checks every OTHER changed biome-tier family once, so a package
 * that was only ever measured under an overlay is at least observed in source.
 */

/**
 * Block J deliberately REUSES Durability36's ladder seeds. Same seeds, same nodes,
 * same builds, changed monsters: that is what makes it a regression rather than a
 * fresh sample. Label it as reuse in the report; it is not independent evidence.
 */
export const DURABILITY37_LADDER_SEEDS=DURABILITY36_LADDER_SEEDS;
/**
 * Block I draws ONE fresh predeclared seed, used once per cell: 20 cells, 20
 * observations. The families share the seed number, which does not make their
 * geometry or trajectories identical -- each is a different node and pool -- and
 * one seed is a spot check, never balance certification.
 */
export const DURABILITY37_INTEGRATION_SEEDS=[87011] as const;

// ── Block J — the Jungle ladder, on the adopted package.
//
// Cells are Durability36's, re-identified. Builds, nodes, roots, tiers and the
// shared `dominion` modifier are all preserved so the only thing that moved
// between the two runs is the authored Jungle HP.
const ladder: Night5Cell[] = DURABILITY36_BLOCKS['jungle-ladder']!.cells.map(c => {
 const id=c.id.replace('dur36-ladder','dur37-ladder');
 return {...c, id, build:{...c.build, id, skillPath:[...c.build.skillPath], gearItemIds:{...c.build.gearItemIds}}};
});

// ── Block I — one representative node per OTHER changed family.
//
// Ten families, two roots each, one seed each: 20 observations. Tiers are the ones
// the biome pools actually author, not the labels the adoption manifest carried
// (obsidian-tortoise and magma-salamander are T4 Volcano, not T3; sand-scorpion
// and stone-basilisk are T2 Desert, not T4).
//
// `sensitive` is the root with prior adverse evidence or the one most exposed to
// this family's specific change; `comparator` is a contrasting root. Between them
// all six roots appear across the collection — not every root in every family.
// T3/T4 Jungle is excluded because Block J covers it, and T1 Mountain is excluded
// because `t1MountainPressureAdoption.test.ts` already guards it in source.
export const DURABILITY37_FAMILIES=[
 {role:'forest',   tier:2, sensitive:'apprentice', comparator:'striker',
  why:'adults x3 HP (ancient-wolf 1575, ironwood-golem 945) against a DoT root'},
 {role:'volcanic', tier:3, sensitive:'squire',     comparator:'striker',
  why:'magma-brute 3000/116 and the Molten Guard rescale, against a slow-swing root'},
 {role:'volcanic', tier:4, sensitive:'conduit',    comparator:'striker',
  why:'magma-salamander 5808 with its Obsidian Shell held at the PRE-adoption budget'},
 {role:'graveyard',tier:4, sensitive:'slinger',    comparator:'spirit',
  why:'the leader-up / escort-down redistribution changes which body dominates a pull'},
 {role:'desert',   tier:2, sensitive:'spirit',     comparator:'striker',
  why:'sand-scorpion and stone-basilisk 780 -> 1365 at the tier they are actually pooled at'},
 {role:'desert',   tier:4, sensitive:'squire',     comparator:'slinger',
  why:'dune-basilisk 9006 — the retained Desert selection, not the 4503 of the other branch'},
 {role:'mountain', tier:2, sensitive:'striker',    comparator:'apprentice',
  why:'the named T2 Striker attrition exception, on the adopted attack relief'},
 {role:'mountain', tier:4, sensitive:'apprentice', comparator:'conduit',
  why:'granite-mammoth 13800 with its ward held at 287.5, and cragback-rhino soft cap 275 -> 1650'},
 {role:'trench',   tier:4, sensitive:'squire',     comparator:'spirit',
  why:'the longest bodies in the game (17640/16800/16800); needs the longer window'},
 {role:'tundra',   tier:4, sensitive:'slinger',    comparator:'conduit',
  why:'glacial-direbear 4884 with BOTH its barrier and its self-shatter rescaled'},
] as const;

/** Trench is slow and Graveyard is the known attrition check; both keep their longer windows. */
export const DURABILITY37_WINDOW_MS:Record<string,number>={trench:600000,graveyard:900000};
const windowFor=(role:string)=>DURABILITY37_WINDOW_MS[role]??300000;

const t4Cell=(role:string,className:string,nodeId:string,id:string):Night5Cell=>{
 const base=NIGHT5_BLOCKS.t4a!.cells.find(c=>c.role===role&&c.className===className);
 assert(base,`no qualified T4 build for ${className} in ${role}`);
 return {...base, id, nodeId, treatment:'integrated', targetTypes:[],
  build:{...base.build, id, skillPath:[...base.build.skillPath], gearItemIds:{...base.build.gearItemIds}}};
};

const lowerCell=(role:string,tier:number,className:string,nodeId:string,id:string):Night5Cell=>{
 const c=SURVEY_CLASSES.find(x=>x.name===className);
 assert(c,`unknown root ${className}`);
 return {
  id, nodeId, tier, role, className, alternate:false, treatment:'integrated', targetTypes:[],
  technique:'sweep',
  build:{
   id, classRoot:`${c.prefix}-root`, contentTier:tier, playerTier:tier, gearTier:tier,
   // The same tier-legal shape Durability36's lower ladder used and qualified.
   skillPath:[`${c.prefix}-root`,`${c.prefix}-balanced`,
     ...(tier>=3?[`${c.prefix}-range-${c.melee?'close':'mid'}`]:[])],
   gearItemIds:{
    weapon:c.weapons[tier-1]!, armor:`${role}-vest-t${tier}`,
    recovery:`${role}-charm-t${tier}`, mobility:`mountain-boots-t${tier}`,
    core:'core-tempered',
   },
  },
 };
};

const integration: Night5Cell[] = DURABILITY37_FAMILIES.flatMap(f => {
 const nodeId=`node-t${f.tier}-${f.role}-03`;
 return ([f.sensitive,f.comparator] as const).map(className => {
  const id=`dur37-integration-${f.role}-t${f.tier}-${className}`;
  return f.tier===4 ? t4Cell(f.role,className,nodeId,id) : lowerCell(f.role,f.tier,className,nodeId,id);
 });
});

export const DURABILITY37_BLOCKS: Record<string,{cells:Night5Cell[];durationMs:number;pilotIds:string[]}> = {
 'jungle-ladder': {
  cells: ladder, durationMs: 300000,
  pilotIds: ladder.filter(c=>c.className==='striker').map(c=>c.id),
 },
 // Windows differ per family here, so the block-level duration is the common case
 // and `DURABILITY37_WINDOW_MS` carries the two exceptions the runner must honour.
 'mob-integration': {
  cells: integration, durationMs: 300000,
  pilotIds: integration.filter(c=>c.role==='mountain'&&c.tier===2).map(c=>c.id),
 },
};

/** Per-cell window, so Trench and Graveyard are not silently cut to 300 s. */
export function durability37WindowMs(cell:Night5Cell):number{
 return windowFor(cell.role);
}

/**
 * Durability37 installs NOTHING. Both blocks fight authored source. This exists so
 * a caller that expects the usual overlay contract gets an explicit no-op rather
 * than a silently different one.
 */
export function installDurability37Treatment(_cell:Night5Cell){
 return {changes:[] as {type:string;before:number;after:number;beforeAttack:number;afterAttack:number}[],restore(){}};
}

/** The adopted values every observation in this packet depends on. Aborts on drift. */
export function assertDurability37Definitions(): void {
 // ── The adopted Jungle ladder, absolute.
 const jungle: Record<string,number> = {
  'jungle-ape':1200,'jungle-snake':480,'jungle-blowdarter':450,
  'silverback':3200,'jungle-stalker':1250,'canopy-harrier':1150,
  'apex-silverback':10000,'emerald-constrictor':12000,'hunting-panther':2400,'thornback-lizard':2500,
 };
 for(const [type,hp] of Object.entries(jungle)){
  const d=MONSTER_DATABASE.get(type);
  assert(d,`missing ${type}`);
  assert.equal(d.stats.hp,hp,`${type}: Block J requires the adopted HP of ${hp}`);
 }
 // The superseded Durability34 overlay must be nowhere near source.
 for(const [type,stale] of [['apex-silverback',2900],['emerald-constrictor',3400]] as const){
  assert.notEqual(MONSTER_DATABASE.get(type)!.stats.hp,stale,
   `${type}: found the SUPERSEDED Durability34 value; the adopted ladder was not applied`);
 }

 // ── The ladder's comparability conditions, re-checked rather than inherited.
 const modifiers=([2,3,4] as const).map(t=>{
  const b=NODE_BIOMES[DURABILITY36_LADDER_NODES[t]] as {biomeTier:number;biomeGroup:string;modifier?:string}|undefined;
  assert(b,`missing ladder node for tier ${t}`);
  assert.equal(b.biomeTier,t,`tier ${t} ladder node drift`);
  assert.equal(b.biomeGroup,'jungle',`tier ${t} ladder node must be Jungle`);
  return b.modifier;
 });
 assert(new Set(modifiers).size===1,
  `the ladder needs comparable modifier roles across tiers, found ${modifiers.join(', ')}`);
 for(const [tier,type] of Object.entries(DURABILITY36_LINEAGE)){
  assert(MONSTER_DATABASE.get(type),`missing lineage member ${type} for tier ${tier}`);
 }

 // ── Block I families must be real: the node exists, and the species this family
 // is here to check are actually in that biome-tier pool.
 const CHANGED: Record<string,string[]> = {
  'forest:2':['ancient-wolf','ironwood-golem'],
  'volcanic:3':['magma-brute','ash-slinger'],
  'volcanic:4':['obsidian-tortoise','magma-salamander'],
  'graveyard:4':['gravewright','bone-crawler','plague-hound','carrion-vulture','plague-rat'],
  'desert:2':['sand-scorpion','stone-basilisk'],
  'desert:4':['sand-viper','dune-basilisk','dune-tyrant'],
  'mountain:2':['granite-titan','stone-eagle','peak-archer'],
  'mountain:4':['granite-mammoth','cragback-rhino','cliffside-roc','avalanche-tyrant'],
  'trench:4':['elder-leviathan','abyssal-serpent','hadal-stalker'],
  'tundra:4':['permafrost-behemoth','glacial-direbear','rime-tusk-mastodon','hoarfrost-yeti'],
 };
 for(const f of DURABILITY37_FAMILIES){
  const nodeId=`node-t${f.tier}-${f.role}-03`;
  const node=NODE_BIOMES[nodeId] as {biomeTier:number;biomeGroup:string;isDungeon?:boolean}|undefined;
  assert(node,`missing representative node ${nodeId}`);
  assert.equal(node.biomeTier,f.tier,`${nodeId} tier drift`);
  assert.equal(node.biomeGroup,f.role,`${nodeId} biome drift`);
  assert(!node.isDungeon,`${nodeId} must be an ordinary node`);
  const pool=BIOME_DATABASE.get(f.role)?.monsterPoolByTier?.[f.tier];
  assert(pool,`no authored pool for ${f.role} T${f.tier}`);
  for(const type of CHANGED[`${f.role}:${f.tier}`]!){
   assert(pool.includes(type),
    `${type} is not in the ${f.role} T${f.tier} pool; this family cannot check it`);
  }
 }

 // ── Every changed family is covered exactly once, and all six roots appear.
 assert.equal(DURABILITY37_FAMILIES.length,Object.keys(CHANGED).length,
  'the family list and the changed-package list must be the same set');
 const roots=new Set(DURABILITY37_FAMILIES.flatMap(f=>[f.sensitive,f.comparator]));
 assert.equal(roots.size,SURVEY_CLASSES.length,
  `Block I must exercise all six roots across the collection, found ${[...roots].join(', ')}`);
}
