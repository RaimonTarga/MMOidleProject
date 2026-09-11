import { MONSTER_DATABASE } from '../data/monsters';
import { BESTIARY_TEXT } from '../data/monsters/bestiaryText';
import { describeMonsterAbilities, describeMonsterMechanics } from './bestiaryMechanics';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const playable = [...MONSTER_DATABASE.values()].filter((def) => def.biome !== 'testroom');
assert(Object.keys(BESTIARY_TEXT).length === playable.length, 'every playable monster should have authored bestiary text');

const missingAbilityCoverage: string[] = [];
let abilityLineCount = 0;

for (const def of playable) {
  assert(Boolean(BESTIARY_TEXT[def.id]), `${def.id} should have bestiary text`);

  const abilities = describeMonsterAbilities(def);
  const ids = new Set(abilities.map((ability) => ability.id));
  abilityLineCount += abilities.length;

  for (const ability of abilities) {
    assert(ability.name.length > 0, `${def.id} has an unnamed ability line`);
    assert(ability.detail.length > 0, `${def.id}/${ability.id} has no ability detail`);
    if (ability.kind === 'cast') {
      assert(ability.castMs !== undefined, `${def.id}/${ability.id} cast line needs a cast time`);
    }
    if (ability.steps) {
      assert(ability.steps.length > 0, `${def.id}/${ability.id} has an empty ordered sequence`);
    }
  }

  const expectedIds: string[] = [];
  if (def.engageSequence) expectedIds.push('engage-sequence');
  if (def.chargedAttack) expectedIds.push('charged-attack');
  if (def.castedAttackSpeedBuff) expectedIds.push('casted-haste');
  for (const ability of def.monsterAbilities ?? []) expectedIds.push(`ability-${ability.id}`);
  if (def.lowHealthWard) expectedIds.push('low-health-ward');
  if (def.shellUp) expectedIds.push('shell-up');
  if (def.enemyShield) expectedIds.push('enemy-shield');
  if (def.empowersAllies) expectedIds.push('ally-haste');
  if (def.appliesAntiheal) expectedIds.push('antiheal');
  if (def.raisesDead) expectedIds.push('raises-dead');
  if (def.onDeath?.spawnHazard) expectedIds.push('death-hazard');
  if (def.onDeath?.empowerAllies) expectedIds.push('death-empower');
  if (def.chargeOnAggro) expectedIds.push('charge');
  if (def.openingStrike) expectedIds.push('opening-strike');
  if (def.openingVolley) expectedIds.push('opening-volley');
  if (def.cadenceVolley) expectedIds.push('cadence-volley');
  if (def.cadenceFinisher) expectedIds.push('cadence-finisher');
  if (def.empoweredCooldown) expectedIds.push('empowered-cooldown');
  if (def.appliesMark) expectedIds.push('sun-mark');
  if (def.markedStrike) expectedIds.push('marked-strike');
  if (def.bossPattern) expectedIds.push(`boss-pattern-${def.bossPattern.id}`);
  for (const [index] of (def.bossScript?.phases ?? []).entries()) expectedIds.push(`boss-phase-${index}-${def.bossScript?.phases?.[index].hpPct}`);
  for (const [index] of (def.bossScript?.repeating ?? []).entries()) expectedIds.push(`boss-repeat-${index}`);
  if (def.ultimateEncounter) expectedIds.push('ultimate-encounter');

  for (const id of expectedIds) {
    if (!ids.has(id)) missingAbilityCoverage.push(`${def.id}/${id}`);
  }

  for (const mechanic of describeMonsterMechanics(def)) {
    assert(mechanic.detail.length > 0, `${def.id}/${mechanic.id} has no mechanic detail`);
  }
}

assert(missingAbilityCoverage.length === 0, `missing ability coverage: ${missingAbilityCoverage.join(', ')}`);

const modifierProbe = describeMonsterAbilities(playable[0], { openingStrikeMult: 1.9 });
const modifiedOpeningStrike = modifierProbe.find((ability) => ability.id === 'opening-strike');
assert(Boolean(modifiedOpeningStrike?.detail.includes('1.90×')), 'dungeon opening-strike modifiers should be rendered at their effective value');

console.log(`bestiary mechanics: ${playable.length} entries, ${abilityLineCount} ability lines: ok`);
