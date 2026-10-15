import { resolveSummonerProfile, summonerProfileWeightTotals, type RosterBody } from './summonerProfile';
import {
  SUMMON_ATTACK_STYLE,
  SUMMONER_BASELINE_ATTACK_RANGE,
  SUMMONER_CORE_TUNING,
  SUMMONER_RANGE_TUNING,
  isRangedSummonStyle,
} from '../data/summoner';
import { resolveSummonTint } from '../sprites/frameMaps';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function close(actual: number, expected: number, message: string): void {
  if (Math.abs(actual - expected) > 1e-9) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function body(mode: RosterBody['mode'], command = 1, pieceId = 'conduit-thrall'): RosterBody {
  return { pieceId, family: 'generic', command, mode, row: 'middle', body: 'conduit-summon' };
}

{
  const empty = resolveSummonerProfile({});
  assert(empty.slots.length === 0, 'no roster fields no summons');
  assert(empty.attackMode === 'melee', 'baseline summons attack in melee');
  assert(empty.attackRange === SUMMONER_BASELINE_ATTACK_RANGE, 'baseline summon reach stays at 24px');
  assert(empty.reconstructionIntervalMs === SUMMONER_CORE_TUNING.reconstructionIntervalMs, 'reconstruction stays at the core interval');
  assert(empty.totalSummonHpPct === SUMMONER_CORE_TUNING.totalSummonHpPct, 'the roster keeps the old root HP share');
  assert(empty.formationOffenseMult === SUMMONER_CORE_TUNING.formationOffenseMult, 'formation offense stays the core multiplier');
  assert(empty.secondaryEffectMult === 1, 'the formation spends one secondary budget');
  assert(empty.relicPotencyMult === 1, 'relic potency no longer scales a formation');
  assert(empty.preferredDistance === SUMMONER_RANGE_TUNING.mid.preferredDistance, 'the formation escorts at mid range');
}

{
  const four = resolveSummonerProfile({
    roster: [body('melee'), body('melee'), body('reach'), body('ranged')],
  });
  assert(four.slots.length === 4, 'one slot per roster body');
  const totals = summonerProfileWeightTotals(four);
  close(totals.offense, 1, 'equal Command weights sum to one offense budget');
  close(totals.defense, 1, 'equal Command weights sum to one defense budget');
  close(totals.proc, 1, 'equal Command weights sum to one proc budget');
  assert(four.slots[0]!.attackRange === SUMMONER_BASELINE_ATTACK_RANGE, 'melee bodies fight at the baseline reach');
  assert(four.slots[2]!.attackRange === SUMMONER_RANGE_TUNING.mid.attackRange, 'reach bodies use the mid attack range');
  assert(four.slots[3]!.attackRange === SUMMONER_RANGE_TUNING.far.attackRange, 'ranged bodies use the far attack range');
}

{
  const rated = resolveSummonerProfile({
    roster: [body('melee'), body('melee')],
    relicRatings: { frequency: 1, potency: 1, buffEffect: 0, debuffEffect: 0 },
    selectedSubVariant: 'heavy',
    selectedRange: 'summoner-range-close',
    unlockedSkills: ['summoner-heavy-t3-b'],
  });
  assert(rated.slots.length === 2, 'frame, range, specialization and relic ratings do not add bodies');
  assert(rated.reconstructionIntervalMs === SUMMONER_CORE_TUNING.reconstructionIntervalMs, 'relic ratings do not shorten reconstruction');
  assert(rated.formationOffenseMult === SUMMONER_CORE_TUNING.formationOffenseMult, 'relic ratings do not raise offense');
}

{
  const slower = resolveSummonerProfile({
    passives: { 'summoner.reconstruction-interval-mult': 2 },
  });
  assert(slower.reconstructionIntervalMs === SUMMONER_CORE_TUNING.reconstructionIntervalMs * 2, 'the reconstruction passive scales the interval');
  const floored = resolveSummonerProfile({
    passives: { 'summoner.reconstruction-interval-mult': 0.1 },
  });
  assert(floored.reconstructionIntervalMs === SUMMONER_CORE_TUNING.minimumReconstructionIntervalMs, 'reconstruction respects the core floor');
}

{
  assert(resolveSummonTint([]) === 0xffffff, 'no range unlocked leaves summons untinted');
  const tints = (['close', 'mid', 'far'] as const).map((r) =>
    resolveSummonTint([`summoner-range-${r}`]));
  for (const tint of tints) {
    assert(tint !== 0xffffff, 'every range tints its summons');
  }
  assert(new Set(tints).size === 3, 'the three range tints are distinct');
}

{
  assert(!isRangedSummonStyle(SUMMON_ATTACK_STYLE.melee), 'melee summons may lunge');
  assert(isRangedSummonStyle(SUMMON_ATTACK_STYLE.reach), 'reach summons must not lunge');
  assert(isRangedSummonStyle(SUMMON_ATTACK_STYLE.ranged), 'ranged summons must not lunge');
  assert(SUMMON_ATTACK_STYLE.melee !== SUMMON_ATTACK_STYLE.reach, 'melee does not borrow the reach bolt');
}

console.log('summonerProfile.test.ts: ok');
