import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  bossSealSourcesAtTier, biomeLevelCap, sealsHeldAtTier, sealsRequiredForTier, BIOME_DATABASE,
  upgradeCeilingFromGlobalMastery, requiredBiomeLevelForUpgrade, ESSENCE_TYPES,
  ABILITY_RECIPE_DATABASE, STANCE_RECIPE_DATABASE, RITE_RECIPE_DATABASE,
  isAbilityRecipeUnlocked, isStanceRecipeUnlocked, isRiteRecipeUnlocked, isRuneRecipeUnlocked,
  resolveSummonerProfile,
  NODE_BIOMES, GAME_CONFIG, SKILL_TREE, ITEM_DATABASE, RECIPE_DATABASE,
  ABILITY_DATABASE, RUNE_RECIPE_DATABASE, MONSTER_DATABASE, RESOLVED_NODE_FEATURES,
  canUnlockSkill, composePlayerView, globalMastery, runeBudgetForGlobalMastery,
  runicPointLoadoutCost, normalizeEquipment, normalizeAttunedAbilities, validRiteIds,
  validStanceIds, sanitizeRuneLoadout, runeIdsFromCraftedRecipes, initSummonsMinions,
  buildNavGrid, moverOverlapsBlockShapes, navigationBodyHalfExtents,
  type ProgressionCheckpointCapture, type ProgressionCheckpointState,
  type ProgressionCheckpointRestore, type PlayerView,
} from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerEntity } from '../ecs/entity';
import { syncArchetypeSlices } from '../ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../ecs/playerEntityFormulas';
import { playerCombatPhase } from '../systems/combat/ai/engagement';
import { refillBarrier } from '../systems/defense/barrier/barrier';

export function checkpointRevision(): string {
  if (process.env.EXPERIMENT_GIT_REVISION) return process.env.EXPERIMENT_GIT_REVISION;
  return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
export function checkpointDefinitionSections(): Record<string,string> {
  return Object.fromEntries(Object.entries({ config:GAME_CONFIG,world:NODE_BIOMES,features:RESOLVED_NODE_FEATURES,
    skills:[...SKILL_TREE],items:[...ITEM_DATABASE],recipes:[...RECIPE_DATABASE],abilities:[...ABILITY_DATABASE],
    runeRecipes:[...RUNE_RECIPE_DATABASE],monsters:[...MONSTER_DATABASE],stances:[...STANCE_RECIPE_DATABASE],rites:[...RITE_RECIPE_DATABASE]
  }).map(([key,value])=>[key,createHash('sha256').update(stable(value)).digest('hex')]));
}
export function checkpointDefinitionsHash(): string { return createHash('sha256').update(stable(checkpointDefinitionSections())).digest('hex'); }
export function checkpointStateHash(state: ProgressionCheckpointState): string { return createHash('sha256').update(stable(state)).digest('hex'); }

function requireThat(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
export function checkpointPersistent(player: PlayerEntity): ProgressionCheckpointState {
  return structuredClone({ tracksProgression: player.tracksProgression, holdsInventory: player.holdsInventory,
    usesSkills: player.usesSkills, hasPosition: player.hasPosition,
    ...(player.summonsMinions ? { summonerState: player.summonsMinions } : {}) });
}
/** Equality intentionally excludes derived fields and declared runtime resets only. */
export function checkpointGameplayState(state: ProgressionCheckpointState): unknown {
  const copy = structuredClone(state);
  copy.usesSkills.passives = {};
  copy.hasPosition.speed = 0;
  copy.tracksProgression.activeStance = copy.tracksProgression.equippedStances.default;
  if (copy.summonerState) copy.summonerState = initSummonsMinions({ slots: copy.summonerState.slotIds.map((slotId,i)=>({ slotId, role: copy.summonerState!.slotRoles[i] })) });
  return copy;
}
function safeLocation(world: World, p: PlayerEntity): void {
  const node = NODE_BIOMES[p.hasPosition.nodeId];
  requireThat(node && (node.kind === 'sanctuary' || p.hasPosition.nodeId === 'node-clearing'), 'Checkpoint requires Sanctuary or safe Clearing boundary');
  requireThat(node.biomeTier <= p.tracksProgression.playerTier, 'Checkpoint location is not earned');
  requireThat((p.tracksProgression.visitedNodes ?? []).includes(p.hasPosition.nodeId) || p.hasPosition.nodeId === 'node-clearing', 'Checkpoint node has not been visited');
  const pos = p.hasPosition.current;
  requireThat(Number.isFinite(pos.x) && Number.isFinite(pos.y) && pos.x > 40 && pos.y > 40 && pos.x < GAME_CONFIG.NODE_WIDTH - 40 && pos.y < GAME_CONFIG.NODE_HEIGHT - 40, 'Checkpoint position must be inside the node, away from gates');
  const pad = navigationBodyHalfExtents('player');
  requireThat(!moverOverlapsBlockShapes(pos, buildNavGrid(p.hasPosition.nodeId, 'player', pad).shapes, pad), 'Checkpoint position overlaps terrain');
  requireThat(![...world.monsterEntitiesInNode(p.hasPosition.nodeId)].some(m=>Math.hypot(m.hasPosition.current.x-pos.x,m.hasPosition.current.y-pos.y)<600), 'Checkpoint position is not clear of nearby monsters');
}
function validatePersistent(s: ProgressionCheckpointState): void {
  const p = s.tracksProgression, skills = s.usesSkills;
  requireThat(p && skills && s.holdsInventory && s.hasPosition, 'Missing persistent slices');
  const finiteTree = (value: unknown): void => { if (typeof value === 'number') requireThat(Number.isFinite(value) && value >= 0, 'Invalid persistent numeric value'); else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree); };
  finiteTree(p); finiteTree(s.holdsInventory);
  requireThat(Number.isInteger(p.playerTier) && p.playerTier >= 1 && p.playerTier <= 6, 'Unsupported tier');
  const unique = (values: readonly string[], label: string) => requireThat(Array.isArray(values) && new Set(values).size === values.length, `Duplicate ${label}`);
  for (const key of ['unlockedRecipes','bossesCleared','clearedNodes','visitedNodes','runesOwned','runeRecipesCrafted','knownAbilities','knownStances','knownRites','equippedRites','attunedStances'] as const) unique(p[key] ?? [],key);
  unique(s.holdsInventory.inventory,'inventory'); unique(skills.unlockedSkills,'skills');
  unique([...p.attunedAbilities.techniques,...p.attunedAbilities.guards],'attuned abilities');
  for (const key of p.bossesCleared) { if(key==='ultimate:void-overlord') { requireThat(p.playerTier>=5,'Future ultimate clear'); continue; } const [group,raw]=key.split(':');const tier=Number(raw);requireThat(Number.isInteger(tier) && tier<=p.playerTier && bossSealSourcesAtTier(tier).includes(group), `Invalid boss clear ${key}`); }
  for (const value of Object.values(p.catalystProgress)) requireThat(value<GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT,'Unminted catalyst progress exceeds current threshold');
  for (let tier=1;tier<p.playerTier;tier++) requireThat(sealsRequiredForTier(tier)>0 && sealsHeldAtTier(p.bossesCleared,tier)>=sealsRequiredForTier(tier), `Missing earned tier ${tier} seals`);
  for (const [group,level] of Object.entries(p.biomeLevel)) requireThat(BIOME_DATABASE.has(group) && Number.isInteger(level) && level<=biomeLevelCap(p.playerTier,group), `Invalid mastery ${group}`);
  for (const type of ESSENCE_TYPES) requireThat(Number.isFinite(p.essences[type]) && p.essences[type]>=0, `Missing essence ${type}`);
  for (const amount of Object.values(p.catalysts)) requireThat(Number.isInteger(amount), 'Fractional catalysts');
  const gates={biomeLevel:p.biomeLevel,bossesCleared:p.bossesCleared};
  for (const id of p.knownAbilities) { const r=[...ABILITY_RECIPE_DATABASE.values()].find(r=>r.abilityId===id); requireThat(r && isAbilityRecipeUnlocked(r,gates), `Unreachable ability ${id}`); }
  for (const id of p.knownStances) { const r=[...STANCE_RECIPE_DATABASE.values()].find(r=>r.stanceId===id); requireThat(r && isStanceRecipeUnlocked(r,gates), `Unreachable stance ${id}`); }
  for (const id of p.knownRites) { const r=[...RITE_RECIPE_DATABASE.values()].find(r=>r.riteId===id); requireThat(r && isRiteRecipeUnlocked(r,gates), `Unreachable Rite ${id}`); }
  for (const id of p.runeRecipesCrafted) { const r=RUNE_RECIPE_DATABASE.get(id); requireThat(r && isRuneRecipeUnlocked(r,gates), `Unreachable Rune ${id}`); }
  const selection = { unlockedSkills: [] as string[], selectedClass: null as string|null, selectedSubVariant: null as typeof skills.selectedSubVariant, selectedRange: null as string|null };
  let spent = 0;
  for (const id of skills.unlockedSkills) {
    const node = SKILL_TREE.get(id);
    requireThat(node && canUnlockSkill({ usesSkills: selection, tracksProgression: { skillPoints: node.cost, currentSkillTier: selection.unlockedSkills.length } }, id).ok, `Incompatible skill ${id}`);
    selection.unlockedSkills.push(id); spent += node.cost;
    if (node.tier === 0) selection.selectedClass = id;
    if (node.tier === 1) selection.selectedSubVariant = node.subVariantId ?? null;
    if (node.tier === 2) selection.selectedRange = id;
  }
  requireThat(stable(selection) === stable({ unlockedSkills: skills.unlockedSkills, selectedClass: skills.selectedClass, selectedSubVariant: skills.selectedSubVariant, selectedRange: skills.selectedRange }), 'Skill selection does not match unlocked path');
  requireThat(p.currentSkillTier === skills.unlockedSkills.length && p.skillPoints + spent === p.playerTier, 'Skill tier/points do not match earned tier');
  requireThat(skills.combatArchetype === skills.selectedClass?.replace('-root',''), 'Class archetype mismatch');
  const inv = s.holdsInventory;
  for (const id of [...inv.inventory, ...Object.values(inv.equipment)].filter((id): id is string=>typeof id === 'string')) requireThat(ITEM_DATABASE.has(id), `Unknown item ${id}`);
  requireThat(stable(normalizeEquipment(inv.equipment)) === stable(inv.equipment), 'Invalid equipment');
  for (const [slot,id] of Object.entries(inv.equipment)) if(id) requireThat(ITEM_DATABASE.get(id)?.slot===slot, `Wrong item slot ${slot}`);
  for (const id of [...inv.inventory,...Object.values(inv.equipment)].filter((id):id is string=>typeof id==='string')) {
    const item=ITEM_DATABASE.get(id)!; const r=RECIPE_DATABASE.get(id); const plus=inv.itemUpgrades[id]??0;
    requireThat(item.tier<=p.playerTier && plus<=upgradeCeilingFromGlobalMastery(globalMastery(p.biomeLevel),item.tier), `Unreachable item/upgrade ${id}`);
    if(r) requireThat((p.biomeLevel[r.recipeGroup]??0)>=r.requiredBiomeLevel && (!r.requiredBossClear || p.bossesCleared.includes(r.requiredBossClear)), `Unreachable item recipe ${id}`);
    if(plus>0) requireThat((p.biomeLevel[r?.recipeGroup??'']??0)>=requiredBiomeLevelForUpgrade(item,plus), `Unreachable biome upgrade ${id}`);
  }
  for (const [id,plus] of Object.entries(inv.itemUpgrades)) requireThat(ITEM_DATABASE.has(id) && Number.isInteger(plus) && plus <= (ITEM_DATABASE.get(id)?.upgrades?.length ?? 0), `Incompatible upgrade history ${id}`);
  for (const id of p.unlockedRecipes) requireThat(RECIPE_DATABASE.has(id), `Unknown recipe ${id}`);
  for (const id of p.knownAbilities) requireThat(ABILITY_DATABASE.has(id), `Unknown ability ${id}`);
  requireThat(stable(normalizeAttunedAbilities(p.attunedAbilities)) === stable(p.attunedAbilities), 'Invalid attuned ability order');
  requireThat([...p.attunedAbilities.techniques,...p.attunedAbilities.guards].every(id=>p.knownAbilities.includes(id)), 'Unlearned ability');
  requireThat(stable(validStanceIds(p.knownStances))===stable(p.knownStances) && stable(validRiteIds(p.knownRites))===stable(p.knownRites), 'Unknown stance or Rite');
  requireThat((p.attunedStances??[]).every(id=>p.knownStances.includes(id)) && (!p.equippedStances.default || (p.attunedStances??[]).includes(p.equippedStances.default)), 'Unlearned stance');
  requireThat(p.equippedRites.every(id=>p.knownRites.includes(id)), 'Unlearned Rite');
  requireThat(p.runeRecipesCrafted.every(id=>RUNE_RECIPE_DATABASE.has(id)), 'Unknown Rune recipe');
  requireThat(stable([...runeIdsFromCraftedRecipes(p.runeRecipesCrafted)].sort()) === stable([...p.runesOwned].sort()), 'Rune ownership incompatible with current definitions');
  const budget = runeBudgetForGlobalMastery(globalMastery(p.biomeLevel));
  requireThat(stable(sanitizeRuneLoadout(p.runesEquipped,new Set(p.runesOwned),budget,skills.combatArchetype,new Set(p.attunedStances??[]),new Set([...p.attunedAbilities.techniques,...p.attunedAbilities.guards]))) === stable(p.runesEquipped), 'Invalid ordered Rune loadout');
  requireThat(runicPointLoadoutCost({rules:p.runesEquipped,rites:p.equippedRites,abilities:p.attunedAbilities,stances:p.attunedStances??[]}) <= budget, 'Build exceeds RP');
}
export function captureProgressionCheckpoint(world: World, p: PlayerEntity, boundaryId: string): ProgressionCheckpointCapture {
  requireThat(process.env.NODE_ENV !== 'production', 'Checkpoints are development-only');
  requireThat(/^[a-z0-9][a-z0-9-]{0,79}$/.test(boundaryId), 'Invalid boundary identifier');
  safeLocation(world,p);
  const view = composePlayerView(p)!;
  requireThat(!p.isDead && !p.isMoving && !view.auto && !view.autoTraverse && !view.attackTargetId && view.hp >= view.maxHp && !view.incomingDot && view.activeBuffs.length === 0, 'Boundary must be stationary, auto-off, alive and rested');
  requireThat(playerCombatPhase(world,p,Date.now())==='OUT_OF_COMBAT' && p.tracksCombat.statusEffects.length===0 && !p.hasEnvironmentalDot && !p.isCastingAbility, 'Boundary still has combat, effects or environmental state');
  const persistent = checkpointPersistent(p); validatePersistent(persistent);
  return { version:1,boundaryId,restorePolicy:'safe-rested-v1',sourceRevision:checkpointRevision(),definitionsHash:checkpointDefinitionsHash(),definitionSections:checkpointDefinitionSections(),stateHash:checkpointStateHash(persistent),rewardMultiplier:world.rewardMultiplier,capturedAtMs:Date.now(),persistent,view:structuredClone(view),runtimeEvidence:structuredClone({tracksCombat:p.tracksCombat,engagement:p.tracksEngagement,usesEnergy:p.usesEnergy,usesReload:p.usesReload,usesCadence:p.usesCadence,usesCooldown:p.usesCooldown,summonsMinions:p.summonsMinions}) };
}
export function restoreProgressionCheckpoint(world: World, player: PlayerEntity, request: ProgressionCheckpointRestore): ProgressionCheckpointCapture {
  requireThat(process.env.NODE_ENV !== 'production', 'Checkpoints are development-only');
  const c = request?.capture;
  requireThat(c?.version === 1 && c.restorePolicy === 'safe-rested-v1' && request.boundaryId === c.boundaryId, 'Missing, unsupported or wrong-boundary checkpoint');
  requireThat(/^[a-z0-9][a-z0-9-]{0,79}$/.test(c.boundaryId) && /^[0-9a-f]{40,64}$/.test(c.sourceRevision) && /^[0-9a-f]{64}$/.test(c.definitionsHash) && Number.isFinite(c.capturedAtMs) && Number.isFinite(c.rewardMultiplier) && c.rewardMultiplier>0, 'Invalid checkpoint metadata');
  requireThat(request.revisionPolicy === 'same-revision' || request.revisionPolicy === 'explicit-current-revision', 'Explicit revision policy required');
  if(request.revisionPolicy === 'same-revision') requireThat(c.sourceRevision === checkpointRevision() && c.definitionsHash === checkpointDefinitionsHash(), 'Checkpoint revision/definitions mismatch; explicitly select current-revision reuse');
  requireThat(c.stateHash===checkpointStateHash(c.persistent), 'Checkpoint state hash mismatch');
  validatePersistent(c.persistent);
  requireThat(player.tracksProgression.playerTier === 0 && player.usesSkills.unlockedSkills.length === 0, 'Restore requires a fresh character');
  const state = structuredClone(c.persistent);
  state.usesSkills.passives = {};
  state.tracksProgression.activeStance = state.tracksProgression.equippedStances.default;
  if(state.summonerState) state.summonerState = initSummonsMinions({slots: state.summonerState.slotIds.map((slotId,i)=>({slotId,role:state.summonerState!.slotRoles[i]}))});
  const stageId = `${player.isPlayer.id}-checkpoint-validation`;
  requireThat(!world.getPlayerEntity(stageId), 'Concurrent restore rejected');
  const stage = world.attachPlayerEntity({ ...state,isPlayer:{...player.isPlayer,id:stageId},hasHealth:{hp:1,maxHp:1} },stageId);
  try {
    syncArchetypeSlices(world,stage); recalculatePlayerEntityStats(world,stage); syncArchetypeSlices(world,stage);
    if(stage.summonsMinions) {
      const slots=resolveSummonerProfile({selectedSubVariant:stage.usesSkills.selectedSubVariant,selectedRange:stage.usesSkills.selectedRange,unlockedSkills:stage.usesSkills.unlockedSkills,passives:stage.usesSkills.passives}).slots;
      requireThat(stable(stage.summonsMinions.slotIds)===stable(slots.map(s=>s.slotId)) && stable(stage.summonsMinions.slotRoles)===stable(slots.map(s=>s.role)), 'Summon slots do not match selected class');
    }
    stage.hasHealth.hp = stage.hasHealth.maxHp; refillBarrier(world,stage);
    safeLocation(world,stage);
    requireThat(stable(checkpointGameplayState(checkpointPersistent(stage)))===stable(checkpointGameplayState(c.persistent)), 'Authoritative rebuild changed persistent checkpoint state');
    // The same normal attachment/recalculation path is used for the real fresh identity.
    const stageCapture = captureProgressionCheckpoint(world,stage,c.boundaryId);
    const validated = checkpointPersistent(stage);
    world.detachPlayerEntity(player.isPlayer.id);
    const restored = world.attachPlayerEntity({...validated,isPlayer:player.isPlayer,hasHealth:{hp:1,maxHp:1}},player.isPlayer.id);
    syncArchetypeSlices(world,restored); recalculatePlayerEntityStats(world,restored); syncArchetypeSlices(world,restored);
    restored.hasHealth.hp=restored.hasHealth.maxHp; refillBarrier(world,restored);
    world.resetNodeDeltaState(restored.hasPosition.nodeId);
    const persistent = checkpointPersistent(restored);
    return { ...stageCapture,persistent,stateHash:checkpointStateHash(persistent),view:structuredClone(composePlayerView(restored)!) };
  } finally { world.detachPlayerEntity(stageId); }
}
