import assert from 'node:assert/strict';
import {MONSTER_DATABASE,NODE_BIOMES} from '@mmo-idle/shared';
import {SURVEY_CLASSES} from './ttkSurveySpec';
import type {Night5Cell} from './night5Spec';

/** One block, one package, three declared paired seeds. */
export const DURABILITY35_SEEDS=[75011,77003,79001] as const;

/**
 * T1 Mountain local enemy-pressure package: base attack -20% on BOTH species of
 * the two-species encounter.
 *
 * Durability34 Block M showed the guard substitution does not rescue this entry:
 * 12/18 deaths with Second Wind and 14/18 with Brace, with Striker, Squire and
 * Apprentice dying in all three seeds in BOTH arms. The guard-window audit
 * explains why rather than blaming the guard - Brace fires as authored (matched
 * hits inside its window take 0.648x, i.e. its 35% DR) but covers only 5.07% of
 * alive time and 14 of 147 hits, so it cannot offset losing Second Wind's
 * sustain. The pressure, not the guard choice, is what fails.
 *
 * This is deliberately a TWO-SPECIES PACKAGE effect. It does not attempt to
 * isolate each species' contribution, and a 20% authored attack cut is NOT a
 * promise of 20% less final HP damage after plating, damage caps, guards and
 * rounding - Strong Kick and Power Shot derive from attack, so they move too,
 * and that is intended and must be verified rather than assumed.
 */
export const DURABILITY35_ATTACK: Record<string,[number,number]>={
 'ridge-archer':[50,40],
 'cliff-hopper':[50,40],
};

/**
 * The problematic entry node, plus one existing node with a different
 * representative modifier so a nerf that makes another context trivially easy is
 * visible rather than hidden.
 */
export const DURABILITY35_NODES=['node-t1-mountain-01','node-t1-mountain-02'] as const;

const mountainPressure: Night5Cell[] = DURABILITY35_NODES.flatMap(nodeId =>
 SURVEY_CLASSES.flatMap(c =>
  (['control','candidate'] as const).map(treatment => {
   const id=`dur35-mtn-${nodeId.slice(-2)}-${c.name}-${treatment}`;
   return {
    id, nodeId, tier: 1, role: 'mountain', className: c.name,
    alternate: false, treatment, targetTypes: ['ridge-archer','cliff-hopper'],
    technique: 'sweep' as const, upgradeLevel: 3,
    // Second Wind stays the reference guard: Durability34 rejected the Brace
    // substitution as a general solution, so it is not carried into this grid.
    guards: ['second-wind'],
    build: {
     id, classRoot: `${c.prefix}-root`, contentTier: 1, playerTier: 1, gearTier: 1,
     skillPath: [`${c.prefix}-root`],
     gearItemIds: {
      weapon: c.weapons[0], armor: 'swamp-vest-t1',
      recovery: 'swamp-charm-t1', mobility: 'plains-boots-t1',
     },
    },
   } satisfies Night5Cell;
  }),
 ),
);

export const DURABILITY35_BLOCKS: Record<string,{cells:Night5Cell[];durationMs:number;pilotIds:string[]}> = {
 'mountain-pressure': {
  cells: mountainPressure,
  durationMs: 300000,
  // One matched pair per node, so both arms and both contexts are exercised.
  pilotIds: mountainPressure.filter(c=>c.className==='striker').map(c=>c.id),
 },
};

/** Attack only, on exactly the two named species, restored on every path. */
export function installDurability35Treatment(cell:Night5Cell){
 const saved=Object.entries(DURABILITY35_ATTACK).map(([type,[before,after]])=>{
  const d=MONSTER_DATABASE.get(type);
  assert(d,`missing ${type}`);
  assert.equal(d.stats.attack,before,`${type} attack baseline drift`);
  return {type,before,after,hp:d.stats.hp};
 });
 if(cell.treatment!=='candidate') return {changes:[] as {type:string;before:number;after:number;beforeAttack:number;afterAttack:number}[],restore(){}};
 for(const s of saved) MONSTER_DATABASE.get(s.type)!.stats.attack=s.after;
 return {
  // HP columns stay equal by design: this package is attack-only. The attack
  // columns carry the treatment.
  changes:saved.map(s=>({type:s.type,before:s.hp,after:s.hp,beforeAttack:s.before,afterAttack:s.after})),
  restore(){for(const s of saved) MONSTER_DATABASE.get(s.type)!.stats.attack=s.before;},
 };
}

export function assertDurability35Definitions(): void {
 for(const [type,[before]] of Object.entries(DURABILITY35_ATTACK)){
  const d=MONSTER_DATABASE.get(type);
  assert(d,`missing ${type}`);
  assert.equal(d.stats.attack,before,`${type} attack drift`);
 }
 // Everything the package must NOT move.
 const archer=MONSTER_DATABASE.get('ridge-archer')!;
 assert.equal(archer.stats.hp,240,'ridge-archer HP must not move');
 assert.equal(archer.stats.attackCooldown,3100,'ridge-archer cadence must not move');
 assert.equal(archer.stats.attackRange,210,'ridge-archer range must not move');
 assert.equal(archer.chargedAttack?.multiplier,2.2,'Power Shot stays 2.2 in BOTH arms; 1.8 is not installed here');
 assert.equal(archer.chargedAttack?.castMs,2000,'Power Shot wind-up must not move');
 assert.equal(archer.chargedAttack?.cooldownMs,8000,'Power Shot cooldown must not move');
 const hopper=MONSTER_DATABASE.get('cliff-hopper')!;
 assert.equal(hopper.stats.hp,190,'cliff-hopper HP must not move');
 assert.equal(hopper.stats.attackCooldown,3000,'cliff-hopper cadence must not move');
 assert.equal(hopper.chargedAttack?.multiplier,1.9,'Strong Kick multiplier must not move');
 assert.equal(hopper.chargedAttack?.castMs,1100,'Strong Kick wind-up must not move');
 for(const nodeId of DURABILITY35_NODES){
  const b=NODE_BIOMES[nodeId];
  assert(b,`missing node ${nodeId}`);
  assert.equal(b.biomeTier,1,`${nodeId} must be T1`);
  assert.equal(b.biomeGroup,'mountain',`${nodeId} must be Mountain`);
 }
 // The two contexts must genuinely differ, or this is one context run twice.
 const modifiers=DURABILITY35_NODES.map(n=>(NODE_BIOMES[n] as {modifier?:string}).modifier);
 assert.equal(modifiers[0],'heavy','entry node modifier drift');
 assert.equal(modifiers[1],'swarming','second context modifier drift');
}
