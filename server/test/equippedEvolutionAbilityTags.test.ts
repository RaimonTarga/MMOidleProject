import { baseRecoveryForTier } from "@mmo-idle/shared";
import assert from "node:assert/strict";
import { ABILITY_DATABASE, GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment, getStatusEffect,
  ITEM_DATABASE, abilityTags, abilityRankAt,
  abilityCooldownMs, modifiedAbilityCooldownMs, resolveAbilityEffectWithPassives,
  getCooldown } from "@mmo-idle/shared";
import { applyStatusEffect, guardEffectIdForAbility, recoveryEffectIdForAbility, itemMechanicEffectsAt, equipmentAbilityTags } from '@mmo-idle/shared';
import { applyStun, STUN_EFFECT } from '../src/systems/combat/status/stun';
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { equipItem } from "../src/systems/player/economy/inventory";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { fireAbilities } from './fixtures/fireAbilities';
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { BRAMBLE_EFFECT_ID } from "../src/systems/player/abilities/abilityBramble";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
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
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 2,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runesEquipped: [],
      knownAbilities: ["bramble-guard"],
      attunedAbilities: { techniques: [], guards: ["bramble-guard"] },
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
  p.holdsInventory.inventory.push(item.id);
  assert(equipItem(world, p, item.id));
  assert((p.usesSkills.passives[key] ?? 0) > 0, `${key} reaches player from equipment`);
  return item;
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
fireAbilities(world, Date.now());
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
fireAbilities(world, Date.now());
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
const brace = ABILITY_DATABASE.get('brace')!;
const capped = resolveAbilityEffectWithPassives(brace, 4, { 'guard.potency-pct': 100 });
assert(capped.kind === 'damage-reduction');
assert.equal(capped.drPct, 0.9);
// Exact gear-to-ability pairs: equip upgraded items, fire real Guards and compare
// live payloads with authored values and the shared tooltip resolver.
for (const id of ['brace', 'endure', 'second-wind', 'recuperate']) {
  const p = player();
  const defensive = id === 'brace' || id === 'endure';
  const itemId = defensive ? 'mountain-vest-t1' : 'forest-charm-t1';
  // The item's own authored potency: a stale `+3` adds nothing now that the
  // ladder is retired on every slot (design §24.5).
  const fx = ITEM_DATABASE.get(itemId)!.mechanicEffects ?? {};
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
  fireAbilities(world, Date.now());
  const live = getStatusEffect(p.tracksCombat, (defensive ? guardEffectIdForAbility(id) : recoveryEffectIdForAbility(id))!);
  assert(live, `${itemId} -> ${id} must fire`);
  if (resolved.kind === 'damage-reduction' && base.kind === 'damage-reduction') {
    assert.equal(resolved.drPct, base.drPct * (1 + fx['guard.potency-pct']!));
    assert.equal(live.data.drPct, resolved.drPct);
    assert.equal(live.data.knockbackResistPct, resolved.knockbackResistPct);
    assert.equal(live.remainingMs, base.durationMs);
  } else {
    assert(resolved.kind === 'heal' && base.kind === 'heal');
    assert(Math.abs(resolved.recoveryPct - base.recoveryPct * (1 + fx['defense.recovery-skill-potency']!)) < 1e-9);
    assert.equal(live.data.recoveryPct, resolved.recoveryPct);
    assert.equal(live.remainingMs, base.durationMs);
  }
  assert.equal(getCooldown(p.tracksCombat, abilityCooldownKey(id)), abilityCooldownMs(ability, 4));
}

for (const tier of [2, 3, 4]) {
  const item = ITEM_DATABASE.get(`desert-charm-t${tier}`)!;
  const effects = itemMechanicEffectsAt(item, 0);
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
    fireAbilities(world, Date.now());
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
