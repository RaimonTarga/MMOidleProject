/**
 * Ability-pass measurements for design §22.13 (2026-10-09): the two "measure before
 * deciding" calls. A throwaway, not an instrument: it rewrites plans the existing
 * generators emit into `_t1BossLab.ts` plans, one candidate label per arm. Nothing
 * here changes a game number; every arm is a plan column or the lab's `ap` override.
 *
 * From `server/`:
 *
 *   # 1. Slam's tier-up step at T2. Input: the T2 composition matrix
 *   #    (`_t1BossPlan.ts --matrix=composition --tier=2 --seeds=10`); its no-card
 *   #    control rows (five weapon lineages x six classes x five T2 bosses x 10 seeds)
 *   #    are the T2 reference kit. Every row's Technique is replaced per arm.
 *   node --conditions=development --import tsx scripts/_apMeasurePlans.ts \
 *     --slam-t2-from=<composition-t2.json> --out=<plan.json>
 *
 *   # 2. The Pyromancer Apprentice. Input: boss5Spec's tier-3/4 reference rows
 *   #    (`_abilityPassStacking.ts --boss5-plan`); the Apprentice's rows, at the
 *   #    package's own seed (99011) plus nine more, on the package's fixed spawn.
 *   node --conditions=development --import tsx scripts/_apMeasurePlans.ts \
 *     --pyro-from=<boss5.json> --out=<plan.json> [--old]
 *
 * Slam arms (row ids `t2s-<arm>-<lineage>|<class>|<boss>|<seed>`):
 *   sweep        the same kit wearing Sweep (the no-Slam control)
 *   slam         as authored: rank II 2.45x on the 1.6 s wind-up
 *   slam600      rank II 2.45x on a 600 ms wind-up (`ap` castMs 600)
 *   slam120x600  rank II 1.2x on 600 ms: rank I's shape carried to T2
 * A tier-2 character casts rank II (`abilityRankIndex`: tier 2 - home tier 1), so
 * the `ap` castMs written into every rank only moves rank II here.
 *
 * Pyromancer arms (row ids `p-t<tier>-<arm>|apprentice|<boss>|<seed>`). At tier 3
 * the package wears no T3 path (`dot-root, dot-balanced, dot-range-mid`: a T3 path is
 * skill tier 3, worn from player tier 4), so the T3 rows are one per frame:
 *   T3: ember (the package's row), light-frame, heavy-frame
 *   T4: pyromancer (the package's row: dot-balanced-t3-a), ember (no T3 path, the
 *       Ember Mage frame alone, via the lab's `skillPath`), firebrand, cinder-lord
 *       (balanced b/c); light-frame, venomslinger, cultist, zealot (light frame +
 *       none/a/b/c); heavy-frame, icebreaker, winter-warden, wind-spirit (heavy).
 * `--old` writes the pre-pass arm (design §22.13 (d)) for a checkout of e56d530e:
 * the balanced-frame rows only, ids `old-t<tier>-<arm>|...`, with Slam held at the
 * tip's numbers (`ap` damageMult [2.45, 2.7, 2.95] over e56d530e's three ranks, home
 * tier 2, so T3 casts 2.7 and T4 2.95 exactly as the tip's ranks III/IV; cooldown
 * 10 s, wind-up 1.6 s and radius 150 are equal on both commits), so the arm differs
 * from the tip's by the code alone.
 *
 *   # 3. The final calls (design §22.13, decided): rerun some arms of a plan above.
 *   #    Keeps the rows whose id starts with one of the prefixes, ids unchanged;
 *   #    `--slam-cast-ms` adds the lab's `ap` castMs override to every row (Slam's
 *   #    wind-up held at a value, e.g. 1600 to restore the pre-§22.13 ranks II–IV).
 *   node --conditions=development --import tsx scripts/_apMeasurePlans.ts \
 *     --select-from=<plan.json> --prefixes='<p1>,<p2>' --out=<plan.json> [--slam-cast-ms=1600]
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return i < 0 ? [s.slice(2), '1'] : [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

type Row = Record<string, unknown> & { id: string; cls: string; boss: string; seed: number; tier?: number };
const read = (p: string): Row[] => JSON.parse(readFileSync(p, 'utf8')) as Row[];
const rest = (id: string): string => id.slice(id.indexOf('|'));
assert(args.out, '--out=<plan.json> is required');

if (args['select-from']) {
  assert(args.prefixes, '--prefixes=<p1,p2,...> is required with --select-from');
  const prefixes = args.prefixes.split(',');
  const rows = read(args['select-from']).filter((r) => prefixes.some((p) => r.id.startsWith(p)));
  for (const p of prefixes) assert(rows.some((r) => r.id.startsWith(p)), `no row id starts with ${p}`);
  const castMs = args['slam-cast-ms'] === undefined ? undefined : Number(args['slam-cast-ms']);
  const out = castMs === undefined ? rows : rows.map((r) => {
    assert(r.ap === undefined, `${r.id} already carries an ap override`);
    return { ...r, ap: { slam: { castMs } } };
  });
  writeFileSync(args.out, JSON.stringify(out));
  console.log(`select: ${out.length} rows${castMs === undefined ? '' : `, Slam castMs ${castMs}`} -> ${args.out}`);
  process.exit(0);
}

if (args['slam-t2-from']) {
  const control = read(args['slam-t2-from']).filter((r) => r.id.split('|')[0]!.endsWith('-control'));
  assert(control.length > 0, 'no control rows: pass the --matrix=composition --tier=2 plan');
  assert(control.every((r) => r.tier === 2), 'not a tier-2 composition plan');
  const arms: { arm: string; techniques: string[]; ap?: Record<string, unknown> }[] = [
    { arm: 'sweep', techniques: ['sweep'] },
    { arm: 'slam', techniques: ['slam'] },
    { arm: 'slam600', techniques: ['slam'], ap: { slam: { castMs: 600 } } },
    { arm: 'slam120x600', techniques: ['slam'], ap: { slam: { field: 'damageMult', values: [1.2, 1.2, 2.7, 2.95], castMs: 600 } } },
  ];
  const rows: Row[] = [];
  for (const a of arms) {
    for (const r of control) {
      const lineage = r.id.split('|')[0]!.replace(/^cmpt2-/, '').replace(/-control$/, '');
      rows.push({ ...r, id: `t2s-${a.arm}-${lineage}${rest(r.id)}`, techniques: a.techniques, ...(a.ap ? { ap: a.ap } : {}) });
    }
  }
  writeFileSync(args.out, JSON.stringify(rows));
  console.log(`slam T2: ${arms.length} arms x ${control.length} control rows = ${rows.length} rows -> ${args.out}`);
  process.exit(0);
}

if (args['pyro-from']) {
  const base = read(args['pyro-from']).filter((r) => r.cls === 'apprentice');
  assert.equal(base.length, 13, 'expected the Apprentice\'s 7 T3 + 6 T4 boss5 rows');
  for (const r of base) assert.equal(r.seed, 99011, `${r.id}: not the package seed`);
  // The package's seed first, then the first nine of `_t1BossPlan.ts`'s SEEDS.
  const seeds = [99011, 173, 947, 2027, 3331, 4409, 5501, 6607, 7717, 8821].slice(0, Number(args.seeds ?? 10));
  const path = (frame: string, tier: number) => ['dot-root', `dot-${frame}`, ...(tier >= 3 ? ['dot-range-mid'] : [])];
  type Arm = { arm: string; tier: 3 | 4; frame: 'light' | 'balanced' | 'heavy'; spec?: 'a' | 'b' | 'c' };
  const old = !!args.old;
  const arms: Arm[] = old
    ? [
      { arm: 'ember', tier: 3, frame: 'balanced' },
      { arm: 'pyromancer', tier: 4, frame: 'balanced', spec: 'a' },
      { arm: 'ember', tier: 4, frame: 'balanced' },
      { arm: 'firebrand', tier: 4, frame: 'balanced', spec: 'b' },
      { arm: 'cinder-lord', tier: 4, frame: 'balanced', spec: 'c' },
    ]
    : [
      { arm: 'ember', tier: 3, frame: 'balanced' },
      { arm: 'light-frame', tier: 3, frame: 'light' },
      { arm: 'heavy-frame', tier: 3, frame: 'heavy' },
      { arm: 'pyromancer', tier: 4, frame: 'balanced', spec: 'a' },
      { arm: 'ember', tier: 4, frame: 'balanced' },
      { arm: 'firebrand', tier: 4, frame: 'balanced', spec: 'b' },
      { arm: 'cinder-lord', tier: 4, frame: 'balanced', spec: 'c' },
      { arm: 'light-frame', tier: 4, frame: 'light' },
      { arm: 'venomslinger', tier: 4, frame: 'light', spec: 'a' },
      { arm: 'cultist', tier: 4, frame: 'light', spec: 'b' },
      { arm: 'zealot', tier: 4, frame: 'light', spec: 'c' },
      { arm: 'heavy-frame', tier: 4, frame: 'heavy' },
      { arm: 'icebreaker', tier: 4, frame: 'heavy', spec: 'a' },
      { arm: 'winter-warden', tier: 4, frame: 'heavy', spec: 'b' },
      { arm: 'wind-spirit', tier: 4, frame: 'heavy', spec: 'c' },
    ];
  const rows: Row[] = [];
  for (const a of arms) {
    for (const r of base.filter((x) => x.tier === a.tier)) {
      // The package's own build is balanced/a; every arm must keep its declared range.
      assert.deepEqual((r.boss5SkillPath as string[]).slice(0, 3), path('balanced', a.tier));
      const build: Record<string, unknown> = a.spec
        ? { frame: a.frame, spec: a.spec }
        : { frame: a.frame, spec: 'a', skillPath: path(a.frame, a.tier) };
      for (const seed of seeds) {
        rows.push({
          ...r, ...build,
          id: `${old ? 'old' : 'p'}-t${a.tier}-${a.arm}|${r.cls}|${r.boss}|${seed}`, seed,
          ...(old ? { ap: { slam: { field: 'damageMult', values: [2.45, 2.7, 2.95] } } } : {}),
        });
      }
    }
  }
  writeFileSync(args.out, JSON.stringify(rows, null, 1));
  console.log(`pyromancer${old ? ' (old)' : ''}: ${arms.length} arms, ${seeds.length} seeds = ${rows.length} rows -> ${args.out}`);
  process.exit(0);
}

throw new Error('pass --slam-t2-from=<plan>, --pyro-from=<plan> or --select-from=<plan>');
