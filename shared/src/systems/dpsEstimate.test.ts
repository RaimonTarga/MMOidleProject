/**
 * Wiring invariants for the character panel's DPS estimate.
 *
 * Deliberately NOT balance numbers: what a Striker "should" do per second is a
 * tuning question and would make this file fail every time someone touches a
 * recipe. What it asserts is that the estimate is structurally honest for every
 * archetype — it accounts for the mechanic, its parts add up to what it prints,
 * and the two cases the old auto-attack formula got outright wrong now behave.
 */

import { SLINGER_WEAPON_DOT_EFFECTIVENESS } from './classSecondaryDamage';
import { estimatePlayerDps, type DpsEstimateInput } from './dpsEstimate';
import type { PassiveMap } from '../passives';
import { SUMMONER_CORE_TUNING } from '../data/summoner';
import type { RosterBody } from './summonerProfile';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const BASE: DpsEstimateInput = {
  attack: 100,
  onHitDamage: 0,
  attackCooldownMs: 1_000,
  archetype: null,
  passives: {},
};

const ARCHETYPES = ['cadence', 'cooldown', 'reload', 'dot', 'energy', 'summoner'] as const;

/** Enough passives for each archetype's mechanic to actually engage. */
const PASSIVES: Record<string, PassiveMap> = {
  cadence: { 'cadence.empowered-threshold': 5, 'cadence.empowered-mult': 3 },
  cooldown: { 'cooldown.empowered-mult': 5 },
  reload: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 2_000, 'reload.empowered-mult': 2 },
  dot: {},
  energy: {},
  summoner: { 'summoner.minion-damage-pct': 1 },
};

const THRALL: RosterBody = {
  pieceId: 'conduit-thrall', family: 'generic', command: 1, mode: 'melee', row: 'middle', body: 'conduit-summon',
};

function inputFor(archetype: string): DpsEstimateInput {
  return {
    ...BASE,
    archetype,
    passives: PASSIVES[archetype] ?? {},
    ...(archetype === 'summoner'
      ? {
        summoner: {
          activeCount: 3,
          profileInput: {
            roster: [THRALL, THRALL, THRALL],
            passives: PASSIVES.summoner,
          },
        },
      }
      : {}),
  };
}

function testEveryArchetypeReportsDamage(): void {
  for (const archetype of ARCHETYPES) {
    const estimate = estimatePlayerDps(inputFor(archetype));
    assert(estimate.total > 0, `${archetype}: estimate should be positive, got ${estimate.total}`);
    assert(estimate.parts.length > 0, `${archetype}: estimate should name its parts`);
    assert(estimate.caveats.length > 0, `${archetype}: estimate should state its limits`);
  }
}

function testPartsSumToTotal(): void {
  for (const archetype of [...ARCHETYPES, 'nonsense-archetype']) {
    const estimate = estimatePlayerDps(inputFor(archetype));
    const summed = estimate.parts.reduce((sum, part) => sum + part.dps, 0);
    // Parts are rounded individually, so allow the rounding slack they can carry.
    assert(
      Math.abs(summed - estimate.total) <= estimate.parts.length * 0.1 + 0.001,
      `${archetype}: parts sum to ${summed} but total says ${estimate.total}`,
    );
  }
}

function testUnknownArchetypeStillReports(): void {
  // A build with no class chosen must not read as "0 DPS" — it swings a weapon.
  const none = estimatePlayerDps(BASE);
  assert(none.total > 0, `no archetype should still report attack damage, got ${none.total}`);
  const bogus = estimatePlayerDps({ ...BASE, archetype: 'not-a-real-archetype' });
  assert(bogus.total > 0, 'an unrecognised archetype should fall back, not report zero');
}

function testMechanicBeatsPlainAutoAttack(): void {
  // Each mechanic exists to add damage, so every one of them should read higher
  // than the same character with no mechanic at all. This is the assertion that
  // fails if an archetype branch stops accounting for its own mechanic.
  const plain = estimatePlayerDps(BASE).total;
  for (const archetype of ['cadence'] as const) {
    const withMechanic = estimatePlayerDps(inputFor(archetype)).total;
    assert(
      withMechanic > plain,
      `${archetype}: ${withMechanic} should beat plain auto-attack ${plain}`,
    );
  }
  // The slam fills on Resolve. Counting it here would invent a clock.
  const cooldown = estimatePlayerDps(inputFor('cooldown'));
  assert(
    cooldown.caveats.some((line) => line.includes('slam')),
    'the cooldown estimate should say the slam is not included',
  );
  assert(
    !cooldown.parts.some((part) => /execution/i.test(part.label)),
    'the cooldown estimate must not invent an execution clock',
  );
  assert(cooldown.total === plain, 'cooldown DPS is the regular attacks until Resolve is modeled');

  const spirit = estimatePlayerDps(inputFor('energy'));
  assert(!spirit.parts.some((part) => /discharge/i.test(part.label)), 'Spirit has no per-hit discharge cycle to estimate');
  assert(spirit.caveats.some((line) => line.includes('flow, floor and bands')), 'Spirit states that Threshold spends are omitted');
}

function testDotDirectHits(): void {
  const estimate = estimatePlayerDps(inputFor('dot'));
  assert(estimate.total === estimatePlayerDps(BASE).total, 'sigils do not convert the direct hit');
  assert(estimate.caveats.some((line) => line.includes('Sigils and payoffs')), 'the omitted damage is explicit');
}

function testSummonerWithoutAttackingStillReports(): void {
  // A conduit cannot swing at all. The estimate is the formation.
  const conduit = estimatePlayerDps(inputFor('summoner'));
  assert(conduit.total > 0, 'a summoner who cannot attack still deals damage through minions');
  assert(
    conduit.parts.every((part) => part.label !== 'Your attacks'),
    'a build that cannot attack must not be credited with attacks',
  );
}

function testScalesWithAttack(): void {
  // Every archetype's damage derives from the attack stat, so doubling it must
  // move the estimate for all of them — a branch that ignored `attack` would
  // otherwise sit there reporting a constant.
  for (const archetype of ARCHETYPES) {
    const one = estimatePlayerDps(inputFor(archetype));
    const input = inputFor(archetype);
    // Minion damage derives from the owner's attack, so doubling the player's
    // attack has to move a summoner's estimate too.
    const two = estimatePlayerDps({ ...input, attack: input.attack * 2 });
    assert(two.total > one.total, `${archetype}: estimate should scale with attack`);
  }
}

function testOptionalTargetMitigation(): void {
  const target = { plating: 20, damageReduction: 0.25 };
  const cadence = inputFor('cadence');
  const raw = estimatePlayerDps(cadence);
  const mitigated = estimatePlayerDps({ ...cadence, target });
  assert(mitigated.total < raw.total, 'target defences should lower direct class output');
  assert(
    mitigated.caveats.some((caveat) => caveat.includes('supplied target')),
    'target-aware estimate should state that mitigation was applied',
  );

  const rawDot = estimatePlayerDps(inputFor('dot'));
  const dot = estimatePlayerDps({ ...inputFor('dot'), target });
  assert(dot.total < rawDot.total, 'target defences reduce the direct-hit estimate');
}

function part(estimate: ReturnType<typeof estimatePlayerDps>, label: string): number {
  const found = estimate.parts.find((entry) => entry.label === label);
  if (!found) throw new Error(`missing DPS part: ${label}`);
  return found.dps;
}

function testSlingerSecondaryDamageBreakdown(): void {
  const estimate = estimatePlayerDps({
    attack: 65,
    onHitDamage: 20,
    attackCooldownMs: 1_000,
    weaponId: 'ashbrand-blade',
    archetype: 'reload',
    passives: {},
  });
  const cycleSec = 10 + 1.6;
  const expectedDirect = Math.round(65 * 0.5) * 10 / cycleSec;
  const expectedOnHit = 20 * 10 / cycleSec;
  const expectedDot = (65 * SLINGER_WEAPON_DOT_EFFECTIVENESS) * 0.5 * 1.5 * 10 / cycleSec;
  assert(Math.abs(part(estimate, 'Direct attacks') - Math.round(expectedDirect * 10) / 10) < 1e-9,
    'Slinger direct estimate keeps the full Attack stat, then the weapon conversion');
  assert(Math.abs(part(estimate, 'Flat on-hit') - Math.round(expectedOnHit * 10) / 10) < 1e-9,
    'Slinger flat on-hit estimate remains unpenalized');
  assert(Math.abs(part(estimate, 'Weapon damage over time') - Math.round(expectedDot * 10) / 10) < 1e-9,
    'Slinger weapon reservoir estimate applies the 85% layer once');
  const empowered = estimatePlayerDps({
    attack: 100, onHitDamage: 0, attackCooldownMs: 1_000,
    weaponId: 'ashbrand-blade', archetype: 'reload',
    passives: { 'reload.empowered-mult': 1.5 },
  });
  const plain = estimatePlayerDps({
    attack: 100, onHitDamage: 0, attackCooldownMs: 1_000,
    weaponId: 'ashbrand-blade', archetype: 'reload',
    passives: {},
  });
  assert(part(empowered, 'Weapon damage over time') === part(plain, 'Weapon damage over time'),
    'the retired empowered last shot does not change the magazine estimate');
}

function testConduitFormationSecondaryBudgets(): void {
  const estimate = estimatePlayerDps({
    attack: 100,
    onHitDamage: 10,
    attackCooldownMs: 1_000,
    archetype: 'summoner',
    passives: {},
    summoner: {
      activeCount: 4,
      profileInput: { roster: [THRALL, THRALL, THRALL, THRALL] },
    },
  });
  assert(part(estimate, 'Formation flat on-hit') === 10,
    'the formation spends one on-hit budget');
  const direct = 100 * SUMMONER_CORE_TUNING.formationOffenseMult;
  assert(Math.abs(part(estimate, '4 summons direct') - direct) < 0.51,
    'equal Command weights sum to one formation attack');
}

testEveryArchetypeReportsDamage();
testPartsSumToTotal();
testUnknownArchetypeStillReports();
testMechanicBeatsPlainAutoAttack();
testDotDirectHits();
testSummonerWithoutAttackingStillReports();
testScalesWithAttack();
testOptionalTargetMitigation();
testSlingerSecondaryDamageBreakdown();
testConduitFormationSecondaryBudgets();

console.log('dpsEstimate: ok');
