import strict from 'node:assert/strict';
import { MONSTER_DATABASE, getCounter } from '@mmo-idle/shared';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { updateCombat, runPlayerAttack } from '../src/systems/combat/engine/combat';
import { refreshEnemyShieldState, applyEnemyShield } from '../src/systems/combat/engine/monsterMechanics';
import { despawnMinion, despawnMinionsForOwner } from '../src/systems/classes/archetypes/summoner/spawn';
import { observeMonsterSession } from '../src/systems/combat/engine/sessionObservation';
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  composePlayerView,
  emptyEquipment,
  projectSummonSlots,
  resolveSummonerProfile,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { consumeWeightedProc } from '../src/systems/classes/archetypes/summoner/formationAttack';
import type { CombatContext } from '../src/systems/combat/engine/combatPipeline';
import {
  applySummonerCommand,
  clearSummonerCommand,
} from '../src/systems/classes/archetypes/summoner/command';
import { syncSummonerFormationTarget } from '../src/systems/classes/archetypes/summoner/formationTarget';
import { mirrorTargetStatus } from '../src/systems/combat/targetStatus';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function slices(
  id: string,
  unlockedSkills: string[] = ['summoner-root'],
  frame: 'light' | 'balanced' | 'heavy' | null = null,
  range: string | null = null,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 4,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills,
      passives: {},
      selectedClass: 'summoner-root',
      selectedSubVariant: frame,
      selectedRange: range,
      combatArchetype: 'summoner',
    },
  };
}

function attachSummoner(world: World, persisted: PersistedPlayerSlices) {
  const player = world.attachPlayerEntity(persisted, persisted.isPlayer.id);
  syncArchetypeSlices(world, player);
  return player;
}


const control=process.argv.includes('--control');
const realNow=Date.now;
let now=10000;Date.now=()=>now;
function fixture() {
  const world=new World();
  const owner=attachSummoner(world,slices('owner'));
  updateSummonerArchetype(world,0,now);
  const bear=world.createMonster('node-clearing','glacier-bear',{x:450,y:400})!;
  bear.hasAwareness.pullRange=300;bear.controlsMonster.leashRange=1000;
  bear.performsAttack.lastAttackAt=now;
  const bodies=owner.summonsMinions!.minionIds.map(id=>world.getMinionEntity(id)!);
  bodies.forEach((m,i)=>{m.hasPosition.current={x:451+i,y:400};setAttackTarget(world,m,bear.isMonster.id);m.performsAttack.lastAttackAt=now;});
  setAggroTarget(world,bear,{id:bodies[0].isMinion.id,kind:'minion'},now);
  bear.hasAwareness.state='attacking';
  const def=MONSTER_DATABASE.get('glacier-bear')!;
  const initial=refreshEnemyShieldState(bear,def,now)!.amount;
  applyEnemyShield(bear,def,14,now);
  strict.equal(getCounter(bear.tracksCombat,'t4EnemyShieldAmount'),initial-14);
  const events:unknown[]=[];
  observeMonsterSession(bear,(kind,time)=>events.push({kind,time,session:bear.hasAggroTarget?.sinceMs??null,barrier:getCounter(bear.tracksCombat,'t4EnemyShieldAmount')}));
  return {world,owner,bear,bodies,def,initial,events};
}
try {
  // Actual production target-loss paths, after an absorbed formation hit.
  for(const path of ['ai','combat','despawn','world-tick']) {
    now=10000;const f=fixture();now=10100;f.bodies[0].hasHealth.hp=0;
    if(path==='ai') updateMonsters(f.world,100,now);
    if(path==='combat') updateCombat(f.world,100,now);
    if(path==='despawn') despawnMinion(f.world,f.bodies[0]);
    if(path==='world-tick') f.world.tick(100,now);
    if(control) {
      strict.notEqual(f.bear.hasAggroTarget?.sinceMs,10000,`${path}: control must expose reset`);
      setAggroTarget(f.world,f.bear,{id:f.bodies[1].isMinion.id,kind:'minion'},now);
      const barrier=refreshEnemyShieldState(f.bear,f.def,now)!.amount;
      if(path==='world-tick') strict.ok(barrier>f.initial-14,'same-tick refill then real attack');
      else strict.equal(barrier,f.initial);
    } else {
      strict.equal(f.bear.hasAggroTarget?.sinceMs,10000,`${path}: continuing formation retains session`);
      strict.notEqual(f.bear.hasAggroTarget?.targetId,f.bodies[0].isMinion.id);
      strict.ok(refreshEnemyShieldState(f.bear,f.def,now)!.amount<=f.initial-14,`${path}: no fresh shield`);
      strict.equal(applyEnemyShield(f.bear,f.def,14,now).absorbed,14,'absorbed followup remains engagement');
    }
    console.log(JSON.stringify({path,control,events:f.events}));
  }
  if(!control) {
    now=10000;const f=fixture();
    setAggroTarget(f.world,f.bear,{id:f.bodies[1].isMinion.id,kind:'minion'},10100);
    strict.equal(f.bear.hasAggroTarget?.sinceMs,10000,'ordinary target handover');
    setAggroTarget(f.world,f.bear,null,10200);
    setAggroTarget(f.world,f.bear,{id:f.owner.isPlayer.id,kind:'player'},10300);
    strict.equal(refreshEnemyShieldState(f.bear,f.def,10300)!.amount,f.initial,'legitimate re-entry refreshes');
    applyEnemyShield(f.bear,f.def,14,10300);
    strict.equal(refreshEnemyShieldState(f.bear,f.def,10400)!.amount,f.initial-14,'ordinary player session remains stable');
    for(const reason of ['no-attacks','owner-left','leash','all-dead','bulk-dismiss','live-dismiss']) {
      now=10000;const f=fixture();now=10100;
      if(reason!=='live-dismiss') f.bodies[0].hasHealth.hp=0;
      if(reason==='no-attacks') f.bodies.forEach(m=>setAttackTarget(f.world,m,null));
      if(reason==='owner-left') f.owner.hasPosition.nodeId='node-t3-tundra-03';
      if(reason==='leash') {f.bear.controlsMonster.spawn={x:0,y:0};f.bear.controlsMonster.leashRange=1;}
      if(reason==='all-dead') f.bodies.forEach(m=>m.hasHealth.hp=0);
      if(reason==='bulk-dismiss') despawnMinionsForOwner(f.world,f.owner);
      else despawnMinion(f.world,f.bodies[0]);
      strict.equal(f.bear.hasAggroTarget,undefined,reason+' ends session');
    }
    // Owner continues attacking while the last selected physical body dies.
    now=10000;const f2=fixture();now=10100;
    f2.bodies.forEach(m=>m.hasHealth.hp=0);f2.owner.hasPosition.current={x:450,y:400};
    setAttackTarget(f2.world,f2.owner,f2.bear.isMonster.id);
    despawnMinion(f2.world,f2.bodies[0]);
    strict.equal(f2.bear.hasAggroTarget?.targetKind,'player');
    strict.equal(f2.bear.hasAggroTarget?.sinceMs,10000);
  }
} finally {Date.now=realNow;}
console.log('day2SessionLifecycle: '+(control?'control reset reproduced':'candidate continuity and disengagement passed'));
