import { MONSTER_DATABASE } from '@mmo-idle/shared';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function monster(id: string) {
  const definition = MONSTER_DATABASE.get(id);
  assert(definition, `missing ${id}`);
  return definition;
}

// Higher-tier lineages retain the readability added to their Tier 2 ancestors,
// while preserving their authored escalations (pool, dot refresh, and cadence).
{
  const colossus = monster('mountain-colossus');
  const mammoth = monster('granite-mammoth');
  assert(colossus.chargedAttack?.initialCooldownMs === 0, 'Mountain Colossus should show its Ground Slam in the opener like the Granite Titan');
  assert(colossus.lowHealthWard?.castMs === 1_000 && mammoth.lowHealthWard?.castMs === 1_000, 'the Titan line should retain Granite Barrier’s visible one-second cast through Tier 4');
}

{
  const hydra = monster('plague-hydra');
  const hexer = monster('mire-hex-spitter');
  assert(hydra.shellUp?.castMs === 500, 'Plague-Shell Snapper should retain the readable Shell Up wind-up before its evolved pool');
  assert(
    hexer.chargedAttack?.cooldownMs === 8_000 && hexer.chargedAttack.initialCooldownMs === 0 &&
      hexer.chargedAttack.appliesAntiheal?.durationMs === 9_000 &&
      hexer.chargedAttack.refreshesPlayerDots?.extendMs === 3_000,
    'Mire Hexer should retain Wither’s faster opening cadence while preserving its dot-refresh evolution',
  );
}

{
  const expectedStings = [
    ['sand-scorpion', 4_000, 0.5, 4_000],
    ['dune-stalker', 3_500, 0.45, 4_500],
    ['sand-viper', 3_000, 0.4, 5_000],
  ] as const;
  for (const [id, cooldownMs, speedMult, durationMs] of expectedStings) {
    const sting = monster(id).chargedAttack;
    assert(
      sting?.name === 'Numbing Sting' && sting.castMs === 500 && sting.cooldownMs === cooldownMs && sting.initialCooldownMs === 500 &&
        sting.fx === 'power-shot' && sting.appliesSlow?.speedMult === speedMult && sting.appliesSlow.durationMs === durationMs,
      `${id} should use an early, telegraphed Numbing Sting rather than an invisible on-hit slow`,
    );
    assert(monster(id).slowEffect === undefined, `${id} should not retain an invisible on-hit slow`);
  }

  const expectedGazes = [
    ['stone-basilisk', 7_000, 1_400],
    ['desert-basilisk', 6_500, 1_600],
    ['dune-basilisk', 6_000, 1_800],
  ] as const;
  for (const [id, cooldownMs, rootMs] of expectedGazes) {
    const gaze = monster(id).chargedAttack;
    assert(
      gaze?.name === 'Petrifying Gaze' && gaze.castMs === 1_300 && gaze.cooldownMs === cooldownMs && gaze.initialCooldownMs === 500 && gaze.rootMs === rootMs,
      `${id} should bring Petrifying Gaze up shortly after combat begins`,
    );
  }
}

console.log('tier2SkillPropagation.test.ts: ok');
