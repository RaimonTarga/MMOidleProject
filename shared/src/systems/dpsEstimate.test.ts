/**
 * Wiring invariants for the character panel's DPS estimate.
 *
 * Deliberately NOT balance numbers: what a Striker "should" do per second is a
 * tuning question and would make this file fail every time someone touches a
 * recipe. What it asserts is that the estimate is structurally honest for every
 * archetype — it accounts for the mechanic, its parts add up to what it prints,
 * and the two cases the old auto-attack formula got outright wrong now behave.
 */

import { estimatePlayerDps, type DpsEstimateInput } from './dpsEstimate';
import type { PassiveMap } from '../passives';

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
  cooldown: { 'cooldown.empowered-cd-ms': 8_000, 'cooldown.empowered-mult': 5 },
  reload: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 2_000, 'reload.empowered-mult': 2 },
  dot: { 'dot.conversion-pct': 0.6 },
  energy: { 'energy.per-hit': 14, 'energy.empowered-mult': 2 },
  summoner: { 'summoner.minion-damage-pct': 1 },
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
            selectedSubVariant: 'balanced' as const,
            selectedRange: null,
            unlockedSkills: [],
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
  for (const archetype of ['cadence', 'cooldown', 'energy'] as const) {
    const withMechanic = estimatePlayerDps(inputFor(archetype)).total;
    assert(
      withMechanic > plain,
      `${archetype}: ${withMechanic} should beat plain auto-attack ${plain}`,
    );
  }
}

function testDotCountsConvertedDamage(): void {
  // The regression this whole module exists for. A DoT build moves 60% of every
  // hit out of the direct damage; counting only the hit under-reports it badly.
  const estimate = estimatePlayerDps(inputFor('dot'));
  const direct = estimate.parts.find((p) => p.label === 'Direct hits');
  const overTime = estimate.parts.find((p) => p.label === 'Damage over time');
  assert(direct !== undefined, 'dot estimate should name its direct-hit part');
  assert(overTime !== undefined, 'dot estimate should name its damage-over-time part');
  assert(overTime!.dps > 0, 'converted damage must be counted, not dropped');
  // 60% converted means the direct part is the minority of the hit.
  assert(
    direct!.dps < estimatePlayerDps(BASE).total,
    'direct hits should be reduced by conversion',
  );
}

/** The heavy-frame T3 node that is the sole exception to the conduit contract. */
const BATTLE_BOND_SKILL = 'summoner-heavy-t3-b';

function testSummonerWithoutAttackingStillReports(): void {
  // The other outright-wrong case: a conduit cannot swing at all, and the old
  // formula reported its damage as the player's own attack rate.
  const conduit = estimatePlayerDps(inputFor('summoner'));
  assert(conduit.total > 0, 'a summoner who cannot attack still deals damage through minions');
  assert(
    conduit.parts.every((part) => part.label !== 'Your attacks'),
    'a build that cannot attack must not be credited with attacks',
  );

  // Battle Bond is the one specialization that hands the weapon back, and the
  // estimator has to derive that from the skill list exactly as the server does
  // — not from a flag a caller passes in and could get wrong.
  const base = inputFor('summoner');
  const bonded = estimatePlayerDps({
    ...base,
    summoner: {
      activeCount: base.summoner!.activeCount,
      profileInput: {
        ...base.summoner!.profileInput,
        selectedSubVariant: 'heavy',
        unlockedSkills: [BATTLE_BOND_SKILL],
      },
    },
  });
  assert(
    bonded.parts.some((part) => part.label === 'Your attacks'),
    'Battle Bond returns the weapon, so its attacks must be counted',
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

testEveryArchetypeReportsDamage();
testPartsSumToTotal();
testUnknownArchetypeStillReports();
testMechanicBeatsPlainAutoAttack();
testDotCountsConvertedDamage();
testSummonerWithoutAttackingStillReports();
testScalesWithAttack();

console.log('dpsEstimate: ok');
