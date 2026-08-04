import { resolveSummonerProfile, summonerProfileWeightTotals } from './summonerProfile';

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

console.log('summonerProfile.test.ts: ok');

