import { resolveSummonerProfile, summonerProfileWeightTotals } from './summonerProfile';
import {
  SUMMON_ATTACK_STYLE,
  SUMMON_SIZE_MULT_MAX,
  SUMMON_SIZE_MULT_MIN,
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

function profile(
  selectedSubVariant: 'light' | 'balanced' | 'heavy' | null,
  selectedRange: string | null = null,
  specialization?: string,
) {
  return resolveSummonerProfile({
    selectedSubVariant,
    selectedRange,
    unlockedSkills: specialization ? [specialization] : [],
  });
}

for (const [frame, expected] of [
  [null, 4],
  ['light', 6],
  ['balanced', 5],
  ['heavy', 2],
] as const) {
  const resolved = profile(frame);
  assert(resolved.slots.length === expected, `${frame ?? 'root'} count`);
  const totals = summonerProfileWeightTotals(resolved);
  close(totals.offense, 1, `${frame ?? 'root'} offense weights`);
  close(totals.defense, 1, `${frame ?? 'root'} defense weights`);
  close(totals.proc, 1, `${frame ?? 'root'} proc weights`);
}

{
  const swarm = profile('light', null, 'summoner-light-t3-b');
  assert(swarm.specialization === 'endless-swarm', 'persisted light-b maps to Endless Swarm');
  assert(swarm.slots.length === 8, 'Endless Swarm stays under exceptional cap');
}

{
  const colossus = profile('heavy', 'summoner-range-far', 'summoner-heavy-t3-c');
  assert(colossus.specialization === 'colossus', 'persisted heavy-c maps to Colossus');
  assert(colossus.slots.length === 1, 'Colossus has one slot');
  assert(colossus.attackMode === 'ranged', 'range remains independent of specialization');
}

{
  const bond = profile('heavy', null, 'summoner-heavy-t3-b');
  const totals = summonerProfileWeightTotals(bond);
  assert(bond.specialization === 'battle-bond', 'persisted heavy-b maps to Battle Bond');
  assert(bond.slots.length === 1, 'Battle Bond has one summon');
  close(totals.offense, 1, 'Battle Bond summon plus Conduit offense budget');
  close(totals.proc, 1, 'Battle Bond summon plus Conduit proc budget');
}

{
  const twin = profile('heavy', null, 'summoner-heavy-t3-a');
  assert(twin.specialization === 'twin-covenant', 'persisted heavy-a maps to Twin Covenant');
  assert(twin.slots[0]?.role === 'offense-twin', 'first twin is offensive');
  assert(twin.slots[1]?.role === 'defense-twin', 'second twin is defensive');
  assert(twin.slots[0]!.offenseWeight > twin.slots[1]!.offenseWeight, 'offensive twin owns offense');
  assert(twin.slots[1]!.defenseWeight > twin.slots[0]!.defenseWeight, 'defensive twin owns defense');
}

{
  const closeRange = profile('balanced', 'summoner-range-close');
  const farRange = profile('balanced', 'summoner-range-far');
  assert(closeRange.totalSummonHpPct > farRange.totalSummonHpPct, 'Close assigns more summon durability');
  assert(closeRange.redirectionPct > farRange.redirectionPct, 'Close protects more strongly');
  assert(closeRange.conduitDefenseShare < farRange.conduitDefenseShare, 'Far shifts defense to Conduit');
  close(closeRange.formationOffenseMult, farRange.formationOffenseMult, 'range does not change offense');
}

{
  // Range scales the summon body it never swaps, and the clamp keeps the
  // compounded extremes readable.
  const closeRange = profile('balanced', 'summoner-range-close');
  const midRange = profile('balanced', 'summoner-range-mid');
  const farRange = profile('balanced', 'summoner-range-far');
  assert(closeRange.slots[0]!.sizeMult > midRange.slots[0]!.sizeMult, 'Vigil enlarges summons');
  assert(farRange.slots[0]!.sizeMult < midRange.slots[0]!.sizeMult, 'Harrier shrinks summons');

  // Kilnmaster at Harrier range compounds to 0.389 before clamping; Idolwright
  // at Vigil range to 3.28. Both must land inside the readable band.
  const swarmFar = profile('light', 'summoner-range-far', 'summoner-light-t3-b');
  const idolClose = profile('heavy', 'summoner-range-close', 'summoner-heavy-t3-c');
  for (const p of [swarmFar, idolClose]) {
    for (const slot of p.slots) {
      assert(slot.sizeMult >= SUMMON_SIZE_MULT_MIN, 'summon size never falls below the floor');
      assert(slot.sizeMult <= SUMMON_SIZE_MULT_MAX, 'summon size never exceeds the ceiling');
    }
  }
}

{
  // Tint is range-derived and resolves from the owner's unlocked skills. All
  // three ranges carry their own hue, and the three must stay distinguishable —
  // the point of the tint is telling formations apart at a glance.
  assert(resolveSummonTint([]) === 0xffffff, 'no range unlocked leaves summons untinted');
  const tints = (['close', 'mid', 'far'] as const).map((r) =>
    resolveSummonTint([`summoner-range-${r}`]));
  for (const tint of tints) {
    assert(tint !== 0xffffff, 'every range tints its summons');
  }
  assert(new Set(tints).size === 3, 'the three range tints are distinct');
}

{
  // Only the melee formation lunges; the client gates its lunge on this, so a
  // Procession bolt or Harrier beam must never report itself as melee.
  const profiles = {
    close: profile('balanced', 'summoner-range-close'),
    mid:   profile('balanced', 'summoner-range-mid'),
    far:   profile('balanced', 'summoner-range-far'),
  };
  assert(!isRangedSummonStyle(SUMMON_ATTACK_STYLE[profiles.close.attackMode]),
    'Vigil summons attack in melee and may lunge');
  assert(isRangedSummonStyle(SUMMON_ATTACK_STYLE[profiles.mid.attackMode]),
    'Procession summons fire at reach and must not lunge');
  assert(isRangedSummonStyle(SUMMON_ATTACK_STYLE[profiles.far.attackMode]),
    'Harrier summons fire at range and must not lunge');

  // Before the range choice exists, the summons walk in and hit things: the
  // bolt belongs to Procession and must not leak into the baseline formation.
  const baseline = profile('balanced', null);
  assert(baseline.attackMode === 'melee', 'baseline summons attack in melee');
  assert(SUMMON_ATTACK_STYLE[baseline.attackMode] !== SUMMON_ATTACK_STYLE.reach,
    'baseline summons do not borrow the Procession bolt');
  assert(baseline.range === profiles.mid.range,
    'baseline still inherits Procession tuning, only the animation differs');
}

console.log('summonerProfile.test.ts: ok');

