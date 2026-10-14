import { baseRecoveryForTier, runeIdsForArchetype } from '@mmo-idle/shared';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { refillBarrier } from '../src/systems/defense/barrier/barrier';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tierEntryProfileFromT1Snapshot, CLEARING_NODE_ID, GAME_CONFIG, SKILL_TREE, emptyEquipment, emptyAttunedAbilities, emptyEquippedRites, emptyEquippedStances, type T1CharacterSnapshot } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { applyTierEntryProfile } from '../src/admin/gameActions';
import { captureProgressionCheckpoint, restoreProgressionCheckpoint, checkpointGameplayState, checkpointStateHash } from '../src/admin/progressionCheckpoint';
import { T1SnapshotStore, readT1CharacterSnapshot } from '../../bot/src/telemetry/t1Snapshots';
const emptyEssences={red:0,blue:0,green:0,yellow:0,purple:0};
function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "tier-entry-player", name: "Tier Entry" },
    hasPosition: {
      current: { x: 1, y: 1 },
      nodeId: CLEARING_NODE_ID,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { ...emptyEssences },
      
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      visitedNodes: [],
      runesOwned: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: emptyAttunedAbilities(),
      knownStances: [],
      equippedStances: emptyEquippedStances(),
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

const snapshot=JSON.parse(readFileSync(join(__dirname, 'fixtures/v1m-earned-t3-snapshot.json'),'utf8')) as T1CharacterSnapshot;
const world=new World(); const original=world.attachPlayerEntity(makePlayerSlices(),'source');
// The earned T3 Spirit took the Heavy frame and the Far range node; the class-first tree has
// neither, so the character is rebuilt on its class root alone. A T2+ tier entry still demands
// a tier-1 pick and the Spirit's kit has no discipline yet, so an empty stand-in node carries
// the entry and is gone again before the skill state is reset to the root.
const STAND_IN='t0-spirit-tier1-stand-in';
SKILL_TREE.set(STAND_IN,{id:STAND_IN,name:'Stand-in',description:'',tier:1,classId:'energy-root',parent:'energy-root',
  subVariantId:null,children:[],cost:1,statEffects:{},mechanicEffects:{}});
const entry=structuredClone(snapshot);
entry.frameId=STAND_IN;Object.assign(entry.state,{frameId:STAND_IN,selectedSubVariant:null,selectedRange:null,
  unlockedSkills:['energy-root',STAND_IN],skillPoints:1});
const applied=applyTierEntryProfile(world,original,tierEntryProfileFromT1Snapshot(entry,'node-t3-sanctuary',3));
SKILL_TREE.delete(STAND_IN);
assert(applied.success,applied.reason);
Object.assign(original.usesSkills,{unlockedSkills:['energy-root'],selectedSubVariant:null,selectedRange:null,passives:{}});
original.tracksProgression.currentSkillTier=1;original.tracksProgression.skillPoints=2;
syncArchetypeSlices(world,original);recalculatePlayerEntityStats(world,original);original.hasHealth.hp=original.hasHealth.maxHp;refillBarrier(world,original);
// An explicit safe authored spot; production capture must arrive through ordinary movement.
original.hasPosition.current={x:1000,y:1000};
original.tracksProgression.visitedNodes=[...new Set([...(original.tracksProgression.visitedNodes??[]),'node-t3-sanctuary'])];
original.tracksProgression.knownRites=['blood-offering'];original.tracksProgression.equippedRites=['blood-offering'];
initCombatSystems();
for(let i=0;i<30;i++)world.tick(100,Date.now()+i*100);
const captured=captureProgressionCheckpoint(world,original,'pre-volcano-rested');
const newWorld=new World(); const blank=newWorld.attachPlayerEntity(makePlayerSlices(),'restore-a');
const restored=restoreProgressionCheckpoint(newWorld,blank,{capture:captured,boundaryId:captured.boundaryId,revisionPolicy:'same-revision'});
assert.deepEqual(checkpointGameplayState(restored.persistent),checkpointGameplayState(captured.persistent));
assert.equal(restored.view.hp,restored.view.maxHp); assert.equal(restored.view.energyCount,0);
assert.deepEqual(restored.view.runesEquipped,captured.view.runesEquipped);assert.deepEqual(restored.view.equippedRites,['blood-offering']);
assert.equal(restored.view.auto,false); assert.deepEqual(restored.view.pos,captured.view.pos);
const otherWorld=new World(); const other=otherWorld.attachPlayerEntity(makePlayerSlices(),'restore-b');
const second=restoreProgressionCheckpoint(otherWorld,other,{capture:captured,boundaryId:captured.boundaryId,revisionPolicy:'same-revision'});
assert.deepEqual(restored.persistent,second.persistent);
newWorld.getPlayerEntity('restore-a')!.tracksProgression.essences.red++;
assert.equal(otherWorld.getPlayerEntity('restore-b')!.tracksProgression.essences.red,captured.persistent.tracksProgression.essences.red);
const rejection=new World();const fresh=rejection.attachPlayerEntity(makePlayerSlices(),'fresh');
assert.throws(()=>restoreProgressionCheckpoint(rejection,fresh,{capture:captured,boundaryId:'wrong',revisionPolicy:'same-revision'}),/wrong-boundary/);
const bad=structuredClone(captured);bad.persistent.tracksProgression.skillPoints++; bad.stateHash=checkpointStateHash(bad.persistent);
assert.throws(()=>restoreProgressionCheckpoint(rejection,fresh,{capture:bad,boundaryId:bad.boundaryId,revisionPolicy:'same-revision'}),/points/);
assert.equal(rejection.getPlayerEntity('fresh'),fresh); assert.equal(fresh.tracksProgression.playerTier,0);
const later=structuredClone(captured);later.sourceRevision='0'.repeat(40);
assert.throws(()=>restoreProgressionCheckpoint(rejection,fresh,{capture:later,boundaryId:later.boundaryId,revisionPolicy:'same-revision'}),/revision/);
restoreProgressionCheckpoint(rejection,fresh,{capture:later,boundaryId:later.boundaryId,revisionPolicy:'explicit-current-revision'});
const dir=mkdtempSync(join(tmpdir(),'named-checkpoints-'));const store=new T1SnapshotStore(dir);
const artifact={...snapshot,snapshotKind:'experiment-checkpoint' as const,progressionCheckpoint:captured};
store.capture(artifact);const before=readFileSync(join(dir,'checkpoint-pre-volcano-rested.json'),'utf8');
assert.throws(()=>store.capture(artifact),/already captured/);assert.throws(()=>new T1SnapshotStore(dir),/already has an index/);
store.capture({...artifact,progressionCheckpoint:{...captured,boundaryId:'second-boundary'}});
assert.equal(Object.keys(store.manifest().namedCheckpoints!).length,2);
assert.equal(readFileSync(join(dir,'checkpoint-pre-volcano-rested.json'),'utf8'),before);
assert.throws(()=>readT1CharacterSnapshot(join(dir,'missing.json')),/could not read/);

// Synthetic corruption/atomicity matrix. These are fixtures, not earned campaign states.
for (const mutate of [
  (c: typeof captured)=>{c.boundaryId='../bad';},
  (c: typeof captured)=>{c.persistent.hasPosition.current={x:0,y:0};},
  (c: typeof captured)=>{c.persistent.tracksProgression.runesEquipped.reverse();c.persistent.tracksProgression.runesEquipped[0].actionId='missing';},
  (c: typeof captured)=>{c.persistent.tracksProgression.biomeLevel.volcanic=999;},
  (c: typeof captured)=>{c.persistent.tracksProgression.essences.red=NaN;},
  (c: typeof captured)=>{c.persistent.holdsInventory.equipment.armor='desert-boots-t2';},
]) {
  const w=new World(), p=w.attachPlayerEntity(makePlayerSlices(),'bad');
  const c=structuredClone(captured);mutate(c);c.stateHash=checkpointStateHash(c.persistent);
  assert.throws(()=>restoreProgressionCheckpoint(w,p,{capture:c,boundaryId:c.boundaryId,revisionPolicy:'same-revision'}));
  assert.equal(w.getPlayerEntity('bad'),p);assert.equal(w.playerEntities.size,1);assert.equal(p.tracksProgression.playerTier,0);
}
const corrupt=structuredClone(captured);corrupt.persistent.tracksProgression.essences.red++;
assert.throws(()=>restoreProgressionCheckpoint(newWorld,newWorld.getPlayerEntity('restore-a')!,{capture:corrupt,boundaryId:corrupt.boundaryId,revisionPolicy:'same-revision'}),/hash/);
const environment=process.env.NODE_ENV;process.env.NODE_ENV='production';
assert.throws(()=>captureProgressionCheckpoint(world,original,'production'),/development-only/);
if(environment===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=environment;
// Unspent points across later tiers use the actual skill unlock chain (a root-only T4 holds three).
original.tracksProgression.playerTier=4;original.tracksProgression.skillPoints=3;
original.tracksProgression.bossesCleared.push('cave:3','desert:3','jungle:3','mountain:3');
const unspent=captureProgressionCheckpoint(world,original,'unspent-t4');
const uw=new World();const up=uw.attachPlayerEntity(makePlayerSlices(),'unspent');
assert.equal(restoreProgressionCheckpoint(uw,up,{capture:unspent,boundaryId:unspent.boundaryId,revisionPolicy:'same-revision'}).view.skillPoints,3);
// Summoner logical slots survive; entities, charges and reconstruction progress are reset.
original.usesSkills={unlockedSkills:['summoner-root'],selectedClass:'summoner-root',selectedSubVariant:null,selectedRange:null,combatArchetype:'summoner',passives:{}};
// Rune ownership follows the class (`runeIdsForArchetype`), as `unlockSkill` sets it.
original.tracksProgression.runesOwned=runeIdsForArchetype('summoner');
original.tracksProgression.playerTier=3;original.tracksProgression.currentSkillTier=1;original.tracksProgression.skillPoints=2;
original.tracksProgression.runesEquipped=[];original.tracksProgression.attunedAbilities={techniques:[],guards:[]};
syncArchetypeSlices(world,original);recalculatePlayerEntityStats(world,original);syncArchetypeSlices(world,original);original.hasHealth.hp=original.hasHealth.maxHp;refillBarrier(world,original);
original.summonsMinions!.bondCharge=42;
const summoned=captureProgressionCheckpoint(world,original,'summoner');
const mw=new World(),mp=mw.attachPlayerEntity(makePlayerSlices(),'summoner');
const mr=restoreProgressionCheckpoint(mw,mp,{capture:summoned,boundaryId:summoned.boundaryId,revisionPolicy:'same-revision'});
assert.deepEqual(mr.persistent.summonerState!.slotIds,summoned.persistent.summonerState!.slotIds);
assert.equal(mr.persistent.summonerState!.bondCharge,undefined);assert(mr.persistent.summonerState!.minionIds.every(id=>id===''));
console.log('progressionCheckpoint: ok');


