import {
  ACTION_DATABASE,
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  RESOLVED_NODE_FEATURES,
  STARTER_RUNE_IDS,
  ambientRampData,
  analyzeRuneLoadoutConflicts,
  applyStatusEffect,
  composeRuneEdit,
  deriveAutoConfigFromRunes,
  emptyEquipment,
  getFlag,
  getStatusEffect,
  tickStatusEffectDurations,
  type EquippedRule,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import type { PlayerEntity } from "../src/ecs/entity";
import { updateAutoTargets } from "../src/systems/combat/ai/autoTarget";
import {
  clearEngagement,
  markEngaged,
} from "../src/systems/combat/ai/engagement";
import {
  RUNE_WAIT_FOR_REGEN_FLAG,
  RUNE_WAIT_IT_OUT_FLAG,
  updateRuneDerivedConfig,
} from "../src/systems/combat/ai/runeConfig";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { setEntityMotion } from "../src/systems/world/movement";
import { updateNodeFeatures } from "../src/systems/world/nodeFeatures";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const CLEARING_NODE = "node-5-5";
const ALWAYS_WAIT: EquippedRule[] = [
  { conditionId: "always", actionId: "auto-path-enemy" },
  { conditionId: "always", actionId: "wait-it-out" },
];

function makePlayerSlices(
  id: string,
  nodeId = CLEARING_NODE,
  hp = GAME_CONFIG.PLAYER_MAX_HP,
): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
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

function makeAutoPlayer(
  id: string,
  rules: EquippedRule[] = ALWAYS_WAIT,
  nodeId = CLEARING_NODE,
  hp = GAME_CONFIG.PLAYER_MAX_HP,
): { world: World; player: PlayerEntity } {
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices(id, nodeId, hp), id);
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
    auto: true,
    focusLeaderTarget: false,
  });
  player.tracksProgression.runesEquipped = rules;
  return { world, player };
}


import strict from 'node:assert/strict';
import { heatObservation, heatTransition } from '../bench/balance/heatObservation';
import { heatManagementState, heatAllowsTarget } from '../src/systems/combat/ai/heatManagement';
import { selectAutoCombatAction } from '../src/systems/combat/ai/targetPriority';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { sanitizeRuneLoadout } from '@mmo-idle/shared';
import { registerPlayerHandlers, type PlayerHandlerDeps } from '../src/net/playerHandlers';
import { saveCharacter, loadCharacter } from '../src/db/playerRepo';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { driveMinion } from '../src/systems/classes/archetypes/summoner/ai';
import { updateReloadT3Ticks } from '../src/systems/classes/archetypes/reload/t3/ticks/laser';
import { updateChanneledBeam } from '../src/systems/classes/archetypes/cooldown/t3/ticks/heavy/channeledBeam';
async function main(){
const mode:EquippedRule={conditionId:'always',actionId:'wait-it-out',waitOutMode:'heat-managed'};
const node='node-t4-volcanic-01';
function scenario(nodeId=node){
 const s=makeAutoPlayer('heat-test',[...ALWAYS_WAIT.slice(0,1),mode],nodeId);
 const ramp=RESOLVED_NODE_FEATURES[node]?.find(f=>f.ambientRamp)!.ambientRamp!;
 const effect=applyStatusEffect(s.player.tracksCombat,{id:'volcanic-heat',sourceId:'node-feature:volcanic-heat',remainingMs:-1,maxStacks:0,data:ambientRampData(ramp.payload,ramp)});
 effect.stacks=24;return {...s,effect};
}
{
 const {world,player,effect}=scenario();
 const fresh=world.createMonster(node,'plains-slime',{x:440,y:400})!;
 updateRuneDerivedConfig(world,1000);strict.equal(heatManagementState(player),'normal');strict(heatAllowsTarget(world,player,fresh));
 effect.stacks=25;updateRuneDerivedConfig(world,1000);strict.equal(heatManagementState(player),'waiting');strict(!heatAllowsTarget(world,player,fresh));
 strict.equal(selectAutoCombatAction(world,player,player.usesAutocombat,1000).kind,'idle');
 markEngaged(world,player,1000);updateNodeFeatures(world,100,1100);strict.equal(effect.stacks,25,'grace must not cool');
 effect.stacks=24;updateRuneDerivedConfig(world,1100);strict.equal(heatManagementState(player),'waiting');
 setAggroTarget(world,fresh,{id:player.isPlayer.id,kind:'player'},1200);updateRuneDerivedConfig(world,1200);
 strict.equal(heatManagementState(player),'requested');strict(!getFlag(player.tracksCombat,RUNE_WAIT_IT_OUT_FLAG));
 strict.equal(selectAutoCombatAction(world,player,player.usesAutocombat,1200).kind,'attack');
 fresh.hasHealth.hp=0;setAttackTarget(world,player,null);updateRuneDerivedConfig(world,1300);strict.equal(heatManagementState(player),'waiting');
 clearEngagement(world,player);updateNodeFeatures(world,1000,2000);strict(effect.stacks<24,'native cooling');
 effect.stacks=10;updateRuneDerivedConfig(world,2100);strict.equal(heatManagementState(player),'resumed');strict(!getFlag(player.tracksCombat,RUNE_WAIT_IT_OUT_FLAG));
 for(const cancel of ['auto','death','exit','unequip','manual']){
  effect.stacks=25;updateRuneDerivedConfig(world,2200);strict.equal(heatManagementState(player),'waiting');
  if(cancel==='auto')player.usesAutocombat.auto=false;
  if(cancel==='death')player.hasHealth.hp=0;
  if(cancel==='exit')player.hasPosition.nodeId='node-t4-tundra-01';
  if(cancel==='unequip')player.tracksProgression.runesEquipped=[];
  if(cancel==='manual')world.ecs.addComponent(player,'hasManualMoveIntent',{destination:{x:800,y:400}} as any);
  updateRuneDerivedConfig(world,2300);strict.equal(heatManagementState(player),'normal');
  player.usesAutocombat.auto=true;player.hasHealth.hp=player.hasHealth.maxHp;player.hasPosition.nodeId=node;player.tracksProgression.runesEquipped=[mode];
  if(player.hasManualMoveIntent)world.ecs.removeComponent(player,'hasManualMoveIntent');
 }
 effect.stacks=25;updateRuneDerivedConfig(world,2400);player.tracksCombat.statusEffects=[];updateRuneDerivedConfig(world,2500);strict.equal(heatManagementState(player),'resumed');
}
{
 const {world,player,effect}=scenario();effect.stacks=10;
 applyStatusEffect(player.tracksCombat,{id:'poison-dagger-burn',sourceId:'test',remainingMs:1000,data:{isDot:1,damagePerStack:1,totalMs:1000}});
 updateRuneDerivedConfig(world,1000);strict(!getFlag(player.tracksCombat,RUNE_WAIT_IT_OUT_FLAG),'managed mode ignores other afflictions');
 player.tracksProgression.runesEquipped=[{...mode,waitOutMode:'all'}];updateRuneDerivedConfig(world,1000);strict(getFlag(player.tracksCombat,RUNE_WAIT_IT_OUT_FLAG),'explicit all retains generic behavior');
}
for(const nodeId of ['node-t4-tundra-01','node-t3-volcanic-dungeon']){
 const {world,player,effect}=scenario(nodeId);effect.stacks=100;updateRuneDerivedConfig(world,1000);strict.equal(heatManagementState(player),'normal');strict(!getFlag(player.tracksCombat,RUNE_WAIT_IT_OUT_FLAG));
}
{
 const {world,player,effect}=scenario();player.usesSkills.unlockedSkills=['summoner-root'];player.usesSkills.combatArchetype='summoner';player.usesSkills.selectedClass='summoner-root';syncArchetypeSlices(world,player);updateSummonerArchetype(world,0,1000);
 const minion=world.getMinionEntity(player.summonsMinions!.minionIds[0])!;
 const threat=world.createMonster(node,'plains-slime',{x:440,y:400})!;
 const fresh=world.createMonster(node,'plains-slime',{x:420,y:400})!;
 setAttackTarget(world,minion,threat.isMonster.id);setAggroTarget(world,threat,{id:minion.isMinion.id,kind:'minion'},1000);
 effect.stacks=25;player.hasHealth.hp=50;player.tracksProgression.runesEquipped.push({conditionId:'always',actionId:'wait-for-regen'});
 updateRuneDerivedConfig(world,1000);strict.equal(heatManagementState(player),'requested');strict(!getFlag(player.tracksCombat,RUNE_WAIT_FOR_REGEN_FLAG));strict(heatAllowsTarget(world,player,threat));strict(!heatAllowsTarget(world,player,fresh));
 updateAutoTargets(world,1000);
 const receipt=heatObservation(world,player,1000);
 strict.equal(receipt.decision?.waitHold,false);
 strict(receipt.decision?.engagementTargetIds.includes(threat.entityId));
 strict.equal(receipt.endOfTick.ownerThreats,0);
 strict.equal(receipt.endOfTick.summonThreats,1);
 strict.notEqual(receipt.actionSelection?.action,'wait-it-out');
 minion.performsAttack.lastAttackAt=100000;driveMinion(world,minion,player,1000);strict.equal(minion.controlsMinion.currentTargetId,threat.isMonster.id);
}
{
 const {world,player}=scenario();const handlers=new Map<string,Function>(),emits:any[]=[];
 const socket={id:player.isPlayer.id,on:(k:string,fn:Function)=>handlers.set(k,fn),emit:(...v:any[])=>emits.push(v)} as unknown as Parameters<typeof registerPlayerHandlers>[0];
 registerPlayerHandlers(socket,{world,db:{},session:{accountId:'test',characterId:'test'},sessionsBySocket:new Map(),adminControls:{emitPlayerSummaries:()=>{},emitTelemetry:()=>{}},socketByAccount:new Map(),inactiveSockets:new Set(),sessionStartedAtBySocket:new Map(),recordSessionEnd:()=>{},emitBossFelledState:()=>{}} as unknown as PlayerHandlerDeps);
 handlers.get('rune:setLoadout')!([mode]);strict.equal(emits.at(-1)[1].success,true);strict.deepEqual(player.tracksProgression.runesEquipped,[mode]);
 for(const bad of [{...mode,waitOutMode:'bogus'},{...mode,actionId:'auto-path-enemy'},{...mode,conditionId:'when-idle'}]){handlers.get('rune:setLoadout')!([bad]);strict.equal(emits.at(-1)[1].success,false);strict.deepEqual(player.tracksProgression.runesEquipped,[mode]);}
 let row:any={id:'test',accountId:'test'};
 const db:any={update:()=>({set:(values:any)=>({where:()=>{row={...row,...values};return {returning:async()=>[row]}}})})};
 await saveCharacter(db,'test',player);const loaded=await loadCharacter(db,'test','test');strict(loaded);strict.deepEqual(loaded.tracksProgression.runesEquipped,[mode]);
 const restored=new World().attachPlayerEntity(loaded,'restored');strict.deepEqual(restored.tracksProgression.runesEquipped,[mode]);
}
{
 const {world,player,effect}=scenario();effect.stacks=25;updateRuneDerivedConfig(world,1000);
 const fresh=world.createMonster(node,'plains-slime',{x:410,y:400})!;const hp=fresh.hasHealth.hp;
 player.usesSkills.combatArchetype='reload';syncArchetypeSlices(world,player);player.usesSkills.passives['reload.laser']=1;player.performsAttack.attackRange=500;
 updateReloadT3Ticks(world,100,1100);strict.equal(fresh.hasHealth.hp,hp);strict.equal(player.hasAttackTarget,undefined,'laser must not acquire fresh target');
 player.usesSkills.combatArchetype='cooldown';syncArchetypeSlices(world,player);
 world.ecs.addComponent(player,'isChanneling',{targetId:'removed-target',remainingMs:5000,nextTickMs:100,pct:0} as any);
 updateChanneledBeam(world,100,1200);strict.equal(player.isChanneling,undefined,'beam must not acquire fresh target');strict.equal(fresh.hasHealth.hp,hp);
}
// Phase receipts must preserve a hold decision when a threat arrives later.
{
 const {world,player,effect}=scenario();world.suppressRepopulation=true;effect.stacks=25;
 const threat=world.createMonster(node,'plains-slime',{x:440,y:400})!;
 updateRuneDerivedConfig(world,1000);updateAutoTargets(world,1000);
 const before=heatObservation(world,player,1000);
 strict.equal(before.decision?.phase,'rune-derivation');
 strict.equal(before.decision?.waitHold,true);
 strict.deepEqual(before.decision?.engagementTargetIds,[]);
 strict.equal(before.actionSelection?.action,'wait-it-out');
 setAggroTarget(world,threat,{id:player.isPlayer.id,kind:'player'},1000);
 const after=heatObservation(world,player,1000);
 strict.equal(after.endOfTick.ownerThreats,1);
 strict.equal(after.endOfTick.combatPhase,'ACTIVE');
 strict.deepEqual(after.decision,before.decision,'later threats must not rewrite the decision');
 strict.deepEqual(after.actionSelection,before.actionSelection);
 strict.equal(heatTransition(1000,100,after).atMs,1000,'event and transition clocks agree');
 strict.equal(heatTransition(1000,100,after).tickEndMs,1100);
 world.tick(100,1100);
 const response=heatObservation(world,player,1100);
 strict.equal(response.decision?.tick,world.tickCounter);
 strict.equal(response.decision?.serverTime,1100);
 strict.equal(response.decision?.state,'requested');
 strict.equal(response.decision?.waitHold,false);
 strict(response.decision?.engagementTargetIds.includes(threat.entityId));
 strict.equal(response.actionSelection?.action,'attack');
 strict.equal(response.actionSelection?.targetId,threat.entityId);
 strict.equal(after.decision?.waitHold,true,'old receipt remains immutable across ticks');
 effect.stacks=10;updateRuneDerivedConfig(world,1200);updateAutoTargets(world,1200);
 strict.equal(heatObservation(world,player,1200).decision?.state,'resumed');
 player.usesAutocombat.auto=false;updateRuneDerivedConfig(world,1300);
 strict.equal(heatObservation(world,player,1300).decision,null);
 strict.equal(heatObservation(world,player,1300).actionSelection,null);
}
// Natural two-tick wiring: monster AI runs after the owner's hold selection.
{
 const {world,player,effect}=scenario();world.suppressRepopulation=true;effect.stacks=25;
 const threat=world.createMonster(node,'plains-slime',{x:440,y:400})!;
 world.tick(100,1000);
 const arrival=heatObservation(world,player,1000);
 strict.equal(arrival.decision?.waitHold,true);
 strict.deepEqual(arrival.decision?.engagementTargetIds,[]);
 strict.equal(arrival.actionSelection?.action,'wait-it-out');
 strict.equal(arrival.endOfTick.ownerThreats,1);
 world.tick(100,1100);
 const response=heatObservation(world,player,1100);
 strict.equal(response.decision?.waitHold,false);
 strict.equal(response.actionSelection?.action,'attack');
 strict.equal(response.actionSelection?.targetId,threat.entityId);
}
console.log('heatManagement: ok (bounded synthetic checks; no experiment lives)');

}
main().catch(e=>{console.error(e);process.exitCode=1});
