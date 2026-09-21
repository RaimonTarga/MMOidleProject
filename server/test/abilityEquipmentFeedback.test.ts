import assert from 'node:assert/strict';
import { ABILITY_DATABASE, abilityHasTag, abilityModifierApplies, equipmentAbilityTags, itemMechanicEffectsAt, type ItemDefinition } from '@mmo-idle/shared';
import { describeAbility } from '../../client/src/ui/describe/abilityText';
import { abilityTooltipContent } from '../../client/src/hud/statusTooltips';

const sweep = ABILITY_DATABASE.get('sweep')!;
const gear: ItemDefinition = { id: 'test-gear', name: 'Test gear', slot: 'armor', tier: 1, statModifiers: {},
  mechanicEffects: { 'guard.potency-pct': 0.25 }, upgrades: [
    { mechanicEffects: { 'guard.potency-pct': 0.125 }, cost: {}, requiredBiomeLevel: 1 },
  ] };
assert.equal(itemMechanicEffectsAt(gear, 0)['guard.potency-pct'], 0.25);
assert.equal(itemMechanicEffectsAt(gear, 1)['guard.potency-pct'], 0.375);
assert.equal(gear.mechanicEffects?.['guard.potency-pct'], 0.25, 'preview must not mutate authored effects');
assert(abilityHasTag(sweep, 'aoe'));
const spread = [...ABILITY_DATABASE.values()].find(a => a.ranks[0].effect.kind === 'spread-dots')!;
assert(abilityHasTag(spread, 'aoe'));
assert(!abilityModifierApplies('technique.power-pct', spread, 4), 'Spread has no power-scaled magnitude');
assert(!abilityModifierApplies('technique.cast-speed-pct', sweep, 4), 'Armed attacks have no wind-up');
const heal = ABILITY_DATABASE.get('second-wind')!;
assert(abilityModifierApplies('defense.recovery-skill-potency', heal, 4));
assert(!abilityModifierApplies('guard.potency-pct', heal, 4));
assert.deepEqual(equipmentAbilityTags({ 'guard.potency-pct': 0.2 }), ['guard', 'mitigation']);

const context = { playerTier: 4, passives: { 'technique.power-pct': 0.25 }, equipmentSources: [
  { id: 'test-source', name: 'Test equipment +3', effects: { 'technique.power-pct': 0.25, 'guard.potency-pct': 0.5 } },
] };
const description = describeAbility(sweep, context);
assert.equal(description.equipmentModifiers.length, 1);
assert.equal(description.equipmentModifiers[0].value, '25%');
assert.equal(description.equipmentModifiers[0].source, 'Test equipment +3');
const tooltip = abilityTooltipContent(sweep, context, { state: 'ready' });
assert(tooltip.tags?.includes('aoe'));
assert.equal(tooltip.equipment?.length, 1);

const charge = ABILITY_DATABASE.get('charge')!;
const inactive = describeAbility(charge, { playerTier: 4, passives: {}, equipmentSources: [
  { id: 'core-bruiser', name: 'Bruiser Core', effects: { 'core.mobility-refund-on-kill-pct': 0.5 }, inactiveReason: 'Melee builds only' },
] });
assert.equal(inactive.equipmentModifiers[0].value, 'Inactive · Melee builds only');
console.log('abilityEquipmentFeedback: ok');
