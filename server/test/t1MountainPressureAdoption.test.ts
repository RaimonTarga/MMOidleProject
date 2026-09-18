import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY35_ADOPTED_FROM, DURABILITY35_ATTACK } from '../bench/balance/durability35Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * The T1 Mountain pressure package accepted from Durability35 (frozen f123d46b):
 * `ridge-archer` and `cliff-hopper` base attack 50 -> 40, as absolute authored
 * values. Everything else about both species is deliberately unchanged.
 *
 * This guards the two failure modes that matter after an adoption:
 *  - the value silently drifting back, and
 *  - the 20% cut being applied a SECOND time on top of the adopted baseline.
 */

const ADOPTED_ATTACK = 40;

// ── The adopted values are live, as absolute numbers.
{
  for (const id of ['ridge-archer', 'cliff-hopper']) {
    const d = MONSTER_DATABASE.get(id);
    assert(!!d, `${id} must exist`);
    assert(d.stats.attack === ADOPTED_ATTACK, `${id}: adopted attack must be ${ADOPTED_ATTACK}, found ${d.stats.attack}`);
    assert(DURABILITY35_ADOPTED_FROM[id] === 50, `${id}: the historical baseline was 50`);
    assert(ADOPTED_ATTACK === Math.round(50 * 0.8), 'the adopted value is the 20% cut of that baseline');
  }
}

// ── Double application is impossible: a second 20% cut would give 32.
{
  const twiceApplied = Math.round(ADOPTED_ATTACK * 0.8);
  assert(twiceApplied === 32, 'sanity: a second cut would reach 32');
  for (const id of ['ridge-archer', 'cliff-hopper']) {
    assert(MONSTER_DATABASE.get(id)!.stats.attack !== twiceApplied,
      `${id}: attack is ${twiceApplied}, which means the package was applied twice`);
  }
  // The retired overlay must be a no-op against current source.
  for (const [id, [before, after]] of Object.entries(DURABILITY35_ATTACK)) {
    assert(before === after && after === ADOPTED_ATTACK,
      `${id}: the retired Durability35 overlay must no longer move anything`);
  }
}

// ── Everything the package was required NOT to move.
{
  const archer = MONSTER_DATABASE.get('ridge-archer')!;
  assert(archer.stats.hp === 240, 'archer HP unchanged');
  assert(archer.stats.attackCooldown === 3100, 'archer cadence unchanged');
  assert(archer.stats.attackRange === 210, 'archer range unchanged');
  assert(archer.stats.plating === 0 && archer.stats.damageReduction === 0, 'archer mitigation unchanged');
  assert(archer.chargedAttack?.multiplier === 2.2, 'Power Shot stays 2.2; the parked 1.8 was NOT adopted');
  assert(archer.chargedAttack?.castMs === 2000 && archer.chargedAttack?.cooldownMs === 8000, 'Power Shot timing unchanged');
  assert(archer.chargedAttack?.aoe === undefined, 'Power Shot remains an unplanted tracking cast');

  const hopper = MONSTER_DATABASE.get('cliff-hopper')!;
  assert(hopper.stats.hp === 190, 'hopper HP unchanged');
  assert(hopper.stats.attackCooldown === 3000, 'hopper cadence unchanged');
  assert(hopper.stats.attackRange === 12, 'hopper range unchanged');
  assert(hopper.chargedAttack?.multiplier === 1.9, 'Strong Kick multiplier unchanged');
  assert(hopper.chargedAttack?.castMs === 1100, 'Strong Kick wind-up unchanged');
}

// ── No other Mountain species was swept along.
{
  const untouched: Record<string, number> = {
    'granite-titan': 84, 'stone-eagle': 75, 'peak-archer': 90,
  };
  for (const [id, attack] of Object.entries(untouched)) {
    const d = MONSTER_DATABASE.get(id);
    if (!d) continue;
    assert(d.stats.attack === attack, `${id}: attack must stay ${attack}, this package covered only two species`);
  }
}

// ── Attack-derived special damage still follows the real pipeline.
// Both charged attacks carry a multiplier and NO flat damage field, so their
// damage necessarily derives from `stats.attack`. That structural property is
// what makes the base cut reach Power Shot and Strong Kick.
{
  for (const id of ['ridge-archer', 'cliff-hopper']) {
    const charged = MONSTER_DATABASE.get(id)!.chargedAttack!;
    const keys = Object.keys(charged);
    assert(typeof charged.multiplier === 'number', `${id}: charged attack must scale by a multiplier`);
    for (const flat of ['damage', 'flatDamage', 'hpDamage', 'baseDamage']) {
      assert(!keys.includes(flat), `${id}: a flat "${flat}" would decouple special damage from the adopted attack`);
    }
  }
}

console.log('t1MountainPressureAdoption: ok');
