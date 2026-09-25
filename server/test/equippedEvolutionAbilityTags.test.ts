import assert from "node:assert/strict";
import { ABILITY_DATABASE, GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, getStatusEffect,
  ITEM_DATABASE, RECIPE_DATABASE, requiredPlusFor, abilityTags, abilityHasTag, abilityRankAt,
  abilityCooldownMs, modifiedAbilityCooldownMs, resolveAbilityEffectWithPassives,
  getCooldown, setCooldown } from "@mmo-idle/shared";
import { applyStatusEffect, guardEffectIdForAbility, recoveryEffectIdForAbility, itemMechanicEffectsAt, equipmentAbilityTags } from '@mmo-idle/shared';
import { applyStun, STUN_EFFECT } from '../src/systems/combat/status/stun';
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { evolveItem } from "../src/systems/player/economy/itemEvolution";
import { equipItem } from "../src/systems/player/economy/inventory";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { makeCombatContext, emitCombatEvent } from "../src/systems/combat/engine/combatPipeline";
import { BRAMBLE_EFFECT_ID } from "../src/systems/player/abilities/abilityBramble";
import { abilityCooldownKey, techniqueCooldownMs } from "../src/systems/player/abilities/abilityCooldowns";
import { describeAbility } from "../../client/src/ui/describe/abilityText";
function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "bramble-player", name: "Bramble" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
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
      playerTier: 2,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: ["bramble-guard"],
      attunedAbilities: { techniques: [], guards: ["bramble-guard"] },
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


initCombatSystems();
const world = new World();
let serial = 0;
function player() {
  const slices = makePlayerSlices();
  slices.isPlayer.id = `extra-${serial++}`;
  slices.tracksProgression.playerTier = 4;
  return world.attachPlayerEntity(slices, slices.isPlayer.id);
}
function equipPassive(p: ReturnType<typeof player>, key: string) {
  const item = [...ITEM_DATABASE.values()].find(i => (i.mechanicEffects?.[key] ?? 0) > 0);
  assert(item, `catalog item for ${key}`);
  if (item.coreEligibility === "melee") p.usesSkills.selectedRange = "cadence-range-close";
  if (item.coreEligibility === "ranged") p.usesSkills.selectedRange = "cadence-range-mid";
  p.holdsInventory.inventory.push(item.id);
  assert(equipItem(world, p, item.id));
  assert((p.usesSkills.passives[key] ?? 0) > 0, `${key} reaches player from equipment`);
  return item;
}
// Every evolution lineage retains its slot; exercise real costs and server replacement.
for (const recipe of RECIPE_DATABASE.values()) {
  if (!recipe.evolvesFrom) continue;
  assert.equal(ITEM_DATABASE.get(recipe.evolvesFrom)?.slot, recipe.slot, recipe.id);
}
for (const slot of ['weapon', 'armor', 'recovery', 'mobility'] as const) {
  const recipe = [...RECIPE_DATABASE.values()].find(r => r.slot === slot && r.evolvesFrom);
  assert(recipe, `evolution for ${slot}`);
  const pred = recipe.evolvesFrom!;
  const p = player();
  p.tracksProgression.unlockedRecipes.push(recipe.id);
  p.holdsInventory.inventory.push(pred, pred);
  p.holdsInventory.itemUpgrades[pred] = requiredPlusFor(recipe);
  assert(equipItem(world, p, pred));
  // Failure cannot consume equipped item, spare copy, or wallet.
  const before = JSON.stringify(p.holdsInventory);
  assert.equal(evolveItem(world, p, recipe.id, 'evolve').success, false);
  assert.equal(JSON.stringify(p.holdsInventory), before);
  for (const [k,v] of Object.entries(recipe.cost)) p.tracksProgression.essences[k as keyof typeof p.tracksProgression.essences] = v!;
  p.tracksProgression.catalysts = { ...recipe.catalystCost } as Record<string, number>;
  assert(evolveItem(world, p, recipe.id, 'evolve').success, recipe.id);
  assert.equal(p.holdsInventory.equipment[slot], recipe.id);
  assert.deepEqual(p.holdsInventory.inventory, [pred], 'spare copy remains in bag');
  assert.equal(p.holdsInventory.itemUpgrades[recipe.id] ?? 0, 0, 'predecessor upgrades do not transfer');
  for (const k of Object.keys(recipe.cost)) assert.equal(p.tracksProgression.essences[k as keyof typeof p.tracksProgression.essences], 0);
  for (const k of Object.keys(recipe.catalystCost ?? {})) assert.equal(p.tracksProgression.catalysts[k], 0);
  const equivalent = player();
  equivalent.holdsInventory.inventory.push(recipe.id);
  assert(equipItem(world, equivalent, recipe.id));
  assert.deepEqual(p.usesSkills.passives, equivalent.usesSkills.passives, 'evolution immediately rebuilds item effects');
  assert.equal(p.hasHealth.maxHp, equivalent.hasHealth.maxHp);
}
// A sole equipped predecessor needs no temporary unequip. Reconstruction leaves it alone.
{
  const recipe = [...RECIPE_DATABASE.values()].find(r => r.slot === 'weapon' && r.evolvesFrom)!;
  const p = player();
  p.tracksProgression.unlockedRecipes.push(recipe.id);
  p.holdsInventory.inventory.push(recipe.evolvesFrom!);
  assert(equipItem(world, p, recipe.evolvesFrom!));
  for (const k of Object.keys(p.tracksProgression.essences)) p.tracksProgression.essences[k as keyof typeof p.tracksProgression.essences] = 1000000;
  for (const k of Object.keys({ ...recipe.catalystCost, ...recipe.reconstructCatalystCost })) p.tracksProgression.catalysts[k] = 1000000;
  assert.equal(evolveItem(world, p, recipe.id, 'evolve').success, false, 'equipped gear still needs +3');
  assert(evolveItem(world, p, recipe.id, 'reconstruct').success);
  assert.equal(p.holdsInventory.equipment.weapon, recipe.evolvesFrom);
  assert.deepEqual(p.holdsInventory.inventory, [recipe.id]);
  p.holdsInventory.itemUpgrades[recipe.evolvesFrom!] = requiredPlusFor(recipe);
  assert(evolveItem(world, p, recipe.id, 'evolve').success);
  assert.equal(p.holdsInventory.equipment.weapon, recipe.id);
  assert.deepEqual(p.holdsInventory.inventory, [recipe.id]);
}
// Tags classify all current abilities, with family and Armed derived from execution.
for (const a of ABILITY_DATABASE.values()) {
  const tags = abilityTags(a);
  assert(tags.includes(a.slot));
  assert.equal(tags.includes('armed'), a.shape === 'armed');
  assert.equal(new Set(tags).size, tags.length);
  assert.deepEqual(describeAbility(a, { playerTier: 4, passives: {} }).tags.map(t => t.id), tags);
}
const bramble = ABILITY_DATABASE.get('bramble-guard')!;
const p = player();
equipPassive(p, 'guard.potency-pct');
// Duration has no current item source; verify its supported passive independently.
p.usesSkills.passives['guard.duration-pct'] = 0.25;
p.usesAutocombat.auto = true;
for (let i = 0; i < 3; i++) {
  const m = world.createMonster(p.hasPosition.nodeId, 'plains-slime', { x: 430 + i * 10, y: 400 })!;
  setAggroTarget(world, m, { id: p.isPlayer.id, kind: 'player' }, Date.now());
}
updateAbilityFiring(world, Date.now());
const expected = resolveAbilityEffectWithPassives(bramble, 4, p.usesSkills.passives);
assert.equal(expected.kind, 'bramble');
if (expected.kind !== 'bramble') throw new Error('bramble');
const base = abilityRankAt(bramble, 4).effect;
assert(base.kind === 'bramble');
assert(expected.platingBonus > base.platingBonus);
assert(expected.durationMs > base.durationMs);
const effect = getStatusEffect(p.tracksCombat, BRAMBLE_EFFECT_ID)!;
assert(effect, 'equipped bonuses reach fired Bramble');
assert.equal(effect.data.platingBonus, expected.platingBonus);
assert.equal(effect.data.reflectFlat, expected.reflectFlat);
assert.equal(effect.remainingMs, expected.durationMs);
const desc = describeAbility(bramble, { playerTier: 4, passives: p.usesSkills.passives });
assert(desc.lines.find(l => l.key === 'platingBonus')!.breakdown?.includes('Guard potency'));
const secondWind = ABILITY_DATABASE.get('second-wind')!;
const recoveryPlayer = player();
equipPassive(recoveryPlayer, 'defense.recovery-skill-potency');
const recovered = resolveAbilityEffectWithPassives(secondWind, 4, recoveryPlayer.usesSkills.passives);
const recoveryBase = abilityRankAt(secondWind, 4).effect;
assert(recovered.kind === 'heal' && recoveryBase.kind === 'heal');
assert(recovered.recoveryPct > recoveryBase.recoveryPct);
recoveryPlayer.tracksProgression.knownAbilities = ['second-wind'];
recoveryPlayer.tracksProgression.attunedAbilities = { techniques: [], guards: ['second-wind'] };
recoveryPlayer.hasHealth.hp = 1;
recoveryPlayer.usesAutocombat.auto = true;
updateAbilityFiring(world, Date.now());
assert(recoveryPlayer.tracksCombat.statusEffects.some(e => e.data.recoveryPct === recovered.recoveryPct), 'equipped Recovery potency reaches live activation');
assert.deepEqual(resolveAbilityEffectWithPassives(secondWind, 4, { 'guard.potency-pct': 1, 'guard.duration-pct': 1 }), recoveryBase);
const cleanse = ABILITY_DATABASE.get('cleanse')!;
assert.deepEqual(resolveAbilityEffectWithPassives(cleanse, 4, { 'guard.potency-pct': 1, 'defense.recovery-skill-potency': 1 }), abilityRankAt(cleanse, 4).effect);
const powered = player();
equipPassive(powered, 'technique.power-pct');
const sweep = ABILITY_DATABASE.get('sweep')!;
const sweepBase = abilityRankAt(sweep, 4).effect;
const sweepPowered = resolveAbilityEffectWithPassives(sweep, 4, powered.usesSkills.passives);
assert(sweepBase.kind === 'cleave' && sweepPowered.kind === 'cleave');
assert(sweepPowered.splashPct > sweepBase.splashPct);
assert.deepEqual(resolveAbilityEffectWithPassives(bramble, 4, powered.usesSkills.passives), base, 'Technique Power cannot scale a Guard');
assert.equal(modifiedAbilityCooldownMs(sweep, 4, { 'core.mobility-cooldown-reduction-pct': 0.5 }), abilityCooldownMs(sweep, 4), 'non-mobility ability ignores Scout bonus');
const brace = ABILITY_DATABASE.get('brace')!;
const capped = resolveAbilityEffectWithPassives(brace, 4, { 'guard.potency-pct': 100 });
assert(capped.kind === 'damage-reduction');
assert.equal(capped.drPct, 0.9);
const scout = player();
equipPassive(scout, 'core.mobility-cooldown-reduction-pct');
const mobility = [...ABILITY_DATABASE.values()].filter(a => abilityHasTag(a, 'mobility'));
for (const a of mobility) {
  assert(modifiedAbilityCooldownMs(a, 4, scout.usesSkills.passives) < abilityCooldownMs(a, 4));
  assert.equal(techniqueCooldownMs(scout, a), modifiedAbilityCooldownMs(a, 4, scout.usesSkills.passives));
}
const bruiser = player();
equipPassive(bruiser, 'core.mobility-refund-on-kill-pct');
const ordinary = ABILITY_DATABASE.get('sweep')!;
bruiser.tracksProgression.attunedAbilities = { techniques: [...mobility.map(a => a.id), ordinary.id], guards: [] };
for (const id of bruiser.tracksProgression.attunedAbilities.techniques) setCooldown(bruiser.tracksCombat, abilityCooldownKey(id), 5000);
const victim = world.createMonster(bruiser.hasPosition.nodeId, 'plains-slime', { x: 460, y: 400 })!;
emitCombatEvent('onKill', makeCombatContext(bruiser, 'player', victim, 'monster'), world);
for (const a of mobility) assert.equal(getCooldown(bruiser.tracksCombat, abilityCooldownKey(a.id)), Math.max(0, 5000 - abilityCooldownMs(a, 4) * bruiser.usesSkills.passives['core.mobility-refund-on-kill-pct']));
assert.equal(getCooldown(bruiser.tracksCombat, abilityCooldownKey(ordinary.id)), 5000);
// Exact gear-to-ability pairs: equip upgraded items, fire real Guards and compare
// live payloads with authored values and the shared tooltip resolver.
for (const id of ['brace', 'endure', 'second-wind', 'recuperate']) {
  const p = player();
  const defensive = id === 'brace' || id === 'endure';
  const itemId = defensive ? 'mountain-vest-t1' : 'forest-charm-t1';
  p.holdsInventory.inventory.push(itemId);
  p.holdsInventory.itemUpgrades[itemId] = 3;
  assert(equipItem(world, p, itemId));
  p.tracksProgression.knownAbilities = [id];
  p.tracksProgression.attunedAbilities = { techniques: [], guards: [id] };
  p.hasHealth.hp = 1;
  p.usesAutocombat.auto = true;
  const ability = ABILITY_DATABASE.get(id)!;
  const base = abilityRankAt(ability, 4).effect;
  const resolved = resolveAbilityEffectWithPassives(ability, 4, p.usesSkills.passives);
  updateAbilityFiring(world, Date.now());
  const live = getStatusEffect(p.tracksCombat, (defensive ? guardEffectIdForAbility(id) : recoveryEffectIdForAbility(id))!);
  assert(live, `${itemId} -> ${id} must fire`);
  if (resolved.kind === 'damage-reduction' && base.kind === 'damage-reduction') {
    assert.equal(resolved.drPct, base.drPct * (1 + 0.15 + 0.02 * 3));
    assert.equal(live.data.drPct, resolved.drPct);
    assert.equal(live.data.knockbackResistPct, resolved.knockbackResistPct);
    assert.equal(live.remainingMs, base.durationMs);
  } else {
    assert(resolved.kind === 'heal' && base.kind === 'heal');
    assert(Math.abs(resolved.recoveryPct - base.recoveryPct * 1.13) < 1e-9);
    assert.equal(live.data.recoveryPct, resolved.recoveryPct);
    assert.equal(live.remainingMs, base.durationMs);
  }
  assert.equal(getCooldown(p.tracksCombat, abilityCooldownKey(id)), abilityCooldownMs(ability, 4));
}

for (const tier of [2, 3, 4]) {
  const item = ITEM_DATABASE.get(`desert-charm-t${tier}`)!;
  const effects = itemMechanicEffectsAt(item, 5);
  assert.deepEqual(equipmentAbilityTags(effects), ['cleanse']);
  assert(!Object.keys(effects).some(k => k.startsWith('defense.cleanse-')), 'charm no longer owns an automatic cleanse or heal');
  assert(!Object.keys(ITEM_DATABASE.get(`desert-vest-t${tier}`)!.mechanicEffects ?? {}).some(k => k.startsWith('defense.cleanse-')), 'Desert armor trades its automatic cleanse for opening protection');
  for (const id of ['cleanse', 'break-free']) {
    const p = player();
    p.holdsInventory.inventory.push(item.id);
    p.holdsInventory.itemUpgrades[item.id] = 5;
    assert(equipItem(world, p, item.id));
    p.tracksProgression.knownAbilities = [id];
    p.tracksProgression.attunedAbilities = { techniques: [], guards: [id] };
    p.usesAutocombat.auto = true;
    if (id === 'break-free') applyStun(p.tracksCombat, 4000, 'tester');
    else applyStatusEffect(p.tracksCombat, { id: 'antiheal', maxStacks: 1, remainingMs: 6000, refreshable: true, sourceId: 'tester', data: {} });
    updateAbilityFiring(world, Date.now());
    assert(!getStatusEffect(p.tracksCombat, id === 'break-free' ? STUN_EFFECT : 'antiheal'));
    const ability = ABILITY_DATABASE.get(id)!;
    const expected = abilityCooldownMs(ability, 4) * (1 - effects['cleanse.cooldown-reduction-pct']);
    assert(Math.abs(getCooldown(p.tracksCombat, abilityCooldownKey(id)) - expected) < 1e-8, `${item.id} must shorten ${id}'s live cooldown`);
    const desc = describeAbility(ability, { playerTier: 4, passives: p.usesSkills.passives,
      equipmentSources: [{ id: item.id, name: item.name, effects }] });
    assert.equal(desc.equipmentModifiers[0].label, 'Cleanse cooldown reduction');
    assert.equal(modifiedAbilityCooldownMs(brace, 4, p.usesSkills.passives), abilityCooldownMs(brace, 4));
    assert.equal(modifiedAbilityCooldownMs(ability, 4, { ...p.usesSkills.passives, 'guard.cooldown-reduction-pct': 1 }), abilityCooldownMs(ability, 4) * (1 - 0.9));
  }
}
console.log('equippedEvolutionAbilityTags.test.ts: ok');
