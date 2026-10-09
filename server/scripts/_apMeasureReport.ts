/**
 * Ability-pass measurements for design §22.13 (2026-10-09): the lab rows of
 * `_apMeasurePlans.ts`'s plans, as markdown tables. A throwaway, not an instrument.
 *
 * From `server/`:
 *
 *   node --conditions=development --import tsx scripts/_apMeasureReport.ts \
 *     --slam=<measure-slam-t2.jsonl> --md=<tables.md> --cells-md=<cells.md>
 *   node --conditions=development --import tsx scripts/_apMeasureReport.ts \
 *     --pyro=<measure-pyro.jsonl> [--old=<measure-pyro-old.jsonl>] [--w4a=<w4a-boss5.jsonl>] \
 *     --md=<tables.md> --cells-md=<cells.md>
 *
 * The final calls (design §22.13, decided): the reruns beside the measurements above,
 * as one markdown file of tables (`--final`). Every input is a lab jsonl:
 *
 *   node --conditions=development --import tsx scripts/_apMeasureReport.ts --final \
 *     --slam-now=<final-calls-slam-t2.jsonl> --slam-x2=<measure-slam-t2.jsonl> \
 *     --pyro-now=<final-calls-pyro.jsonl> --pyro-1600=<final-calls-pyro-slam1600.jsonl> \
 *     --pyro-x2=<measure-pyro.jsonl> --pyro-old=<measure-pyro-old.jsonl> \
 *     --boss5-w0=<stacking-boss5-after.jsonl> --boss5-w4a=<w4a-boss5.jsonl> \
 *     --boss5-1600=<final-calls-boss5-slam1600.jsonl> --boss5-now=<final-calls-boss5.jsonl> \
 *     --md=<tables.md>
 *
 * Mean dps is the plain mean over fights (the lab's per-fight `dps`, boss damage dealt
 * over the fight's length); every cell holds the same number of fights, so a pooled
 * mean weights every boss (and, at T2, every weapon) equally. Win = the lab's `won`.
 * Δ is the % change of mean dps against the named control; Δwin is in points.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return i < 0 ? [s.slice(2), '1'] : [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

interface Row { id: string; cls: string; boss: string; seed: number; dps: number; won: boolean; outcome?: string; error?: string }
const read = (p: string): Row[] => readFileSync(p, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l) as Row);
interface Stat { n: number; dps: number; wins: number; min: number; max: number }
function stat(rows: Row[]): Stat | undefined {
  if (rows.length === 0) return undefined;
  const d = rows.map((r) => r.dps);
  return { n: rows.length, dps: d.reduce((s, x) => s + x, 0) / rows.length, wins: rows.filter((r) => r.won).length, min: Math.min(...d), max: Math.max(...d) };
}
function group<K>(rows: Row[], key: (r: Row) => K): Map<K, Row[]> {
  const m = new Map<K, Row[]>();
  for (const r of rows) (m.get(key(r)) ?? m.set(key(r), []).get(key(r))!).push(r);
  return m;
}
const f1 = (s?: Stat) => (s ? s.dps.toFixed(1) : '-');
const wp = (s?: Stat) => (s ? `${Math.round((s.wins / s.n) * 100)}%` : '-');
const wf = (s?: Stat) => (s ? `${s.wins}/${s.n}` : '-');
const pct = (a?: Stat, b?: Stat) => {
  if (!a || !b || a.dps <= 0) return '-';
  const x = ((b.dps - a.dps) / a.dps) * 100;
  return Math.abs(x) < 0.05 ? '0.0%' : `${x > 0 ? '+' : '−'}${Math.abs(x).toFixed(1)}%`;
};
const pt = (a?: Stat, b?: Stat) => {
  if (!a || !b) return '-';
  const x = (b.wins / b.n - a.wins / a.n) * 100;
  return Math.round(x) === 0 ? '0' : `${x > 0 ? '+' : '−'}${Math.abs(Math.round(x))}`;
};
const table = (head: string[], left: number, body: string[][]) => [
  `| ${head.join(' | ')} |`, `|${head.map((_, i) => (i < left ? '---' : '---:')).join('|')}|`,
  ...body.map((r) => `| ${r.join(' | ')} |`),
].join('\n');

const CLASSES = ['striker', 'squire', 'slinger', 'spirit', 'apprentice', 'conduit'];
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

if (args.slam) {
  const all = read(args.slam);
  const errors = all.filter((r) => r.error);
  const rows = all.filter((r) => !r.error);
  // `t2s-<arm>-<lineage>|...`
  const armOf = (r: Row) => r.id.split('|')[0]!.split('-')[1]!;
  const weaponOf = (r: Row) => r.id.split('|')[0]!.split('-').slice(2).join('-');
  const ARMS = ['sweep', 'slam', 'slam600', 'slam120x600'];
  const ARM_NAME: Record<string, string> = {
    sweep: 'Sweep (control)', slam: 'Slam as authored (2.45× / 1.6 s)', slam600: 'Slam 2.45× / 600 ms', slam120x600: 'Slam 1.2× / 600 ms',
  };
  const BOSSES = ['gorging-razortusk', 'apex-timberclaw', 'mire-gorged-behemoth', 'stoneplate-juggernaut', 'chitinous-dreadbore'];
  const WEAPONS = [...new Set(rows.map(weaponOf))].sort();
  const pick = (arm: string, f: (r: Row) => boolean) => stat(rows.filter((r) => armOf(r) === arm && f(r)));
  const head = (lead: string[]) => [...lead, 'n',
    'Sweep dps', 'win',
    'Slam dps', 'Δ', 'win',
    'Slam 600 ms dps', 'Δ', 'win',
    '1.2× / 600 ms dps', 'Δ', 'win'];
  const line = (lead: string[], f: (r: Row) => boolean): string[] => {
    const [c, s, s6, s12] = ARMS.map((a) => pick(a, f));
    return [...lead, String(c?.n ?? 0),
      f1(c), wp(c),
      f1(s), pct(c, s), wp(s),
      f1(s6), pct(c, s6), wp(s6),
      f1(s12), pct(c, s12), wp(s12)];
  };
  const perCell = table(head(['class', 'boss']), 2,
    CLASSES.flatMap((cls) => BOSSES.map((boss) => line([cap(cls), boss], (r) => r.cls === cls && r.boss === boss))));
  const perClass = table(head(['class']), 1, CLASSES.map((cls) => line([cap(cls)], (r) => r.cls === cls)));
  const perWeapon = table(head(['weapon']), 1, WEAPONS.map((w) => line([w], (r) => weaponOf(r) === w)));
  const perBoss = table(head(['boss']), 1, BOSSES.map((b) => line([b], (r) => r.boss === b)));
  const pooled = table(head(['all']), 1, [line(['all six classes'], () => true)]);
  // The step itself: rank I's shape carried to T2 (1.2x / 600 ms) -> rank II as
  // authored (2.45x / 1.6 s), and what a 600 ms rank II wind-up adds on top of it.
  const stepLine = (lead: string[], f: (r: Row) => boolean): string[] => {
    const [s, s6, s12] = ['slam', 'slam600', 'slam120x600'].map((a) => pick(a, f));
    return [...lead, f1(s12), f1(s), pct(s12, s), pt(s12, s), f1(s6), pct(s, s6), pt(s, s6)];
  };
  const stepHead = (lead: string[]) => [...lead, '1.2× / 600 ms dps', '2.45× / 1.6 s dps', 'step Δ', 'step Δwin (pt)', '2.45× / 600 ms dps', 'Δ vs 1.6 s', 'Δwin (pt)'];
  const steps = table(stepHead(['class']), 1, [
    ...CLASSES.map((cls) => stepLine([cap(cls)], (r) => r.cls === cls)),
    stepLine(['all six'], () => true),
  ]);
  const md = [
    `<!-- generated by server/scripts/_apMeasureReport.ts --slam=${args.slam} -->`,
    `fights: ${rows.length}${errors.length ? `, **${errors.length} error rows**` : ', 0 error rows'}; arms: ${ARMS.map((a) => `\`${a}\` = ${ARM_NAME[a]}`).join('; ')}.`, '',
    '### The step per class (pooled over the five bosses, five weapons and 10 seeds; Δ against the column to its left)', '', steps, '',
    '### Per class × boss (pooled over the five weapons × 10 seeds)', '', perCell, '',
    '### Per class (pooled over the five bosses, five weapons and 10 seeds)', '', perClass, '',
    '### Per weapon (pooled over the six classes, five bosses and 10 seeds)', '', perWeapon, '',
    '### Per boss (pooled over the six classes, five weapons and 10 seeds)', '', perBoss, '',
    '### Everything', '', pooled, '',
  ].join('\n');
  writeFileSync(args.md!, md);
  const cells = table(head(['weapon', 'class', 'boss']), 3,
    WEAPONS.flatMap((w) => CLASSES.flatMap((cls) => BOSSES.map((boss) =>
      line([w, cap(cls), boss], (r) => weaponOf(r) === w && r.cls === cls && r.boss === boss)))));
  const perClassWeapon = table(head(['weapon', 'class']), 2,
    WEAPONS.flatMap((w) => CLASSES.map((cls) => line([w, cap(cls)], (r) => weaponOf(r) === w && r.cls === cls))));
  writeFileSync(args['cells-md']!, [
    '# Slam at T2: every cell (weapon × class × boss, 10 seeds each)', '',
    `Source: \`${args.slam}\`. Columns as in \`measure-slam-t2.md\`; Δ is against the Sweep control in the same cell.`, '',
    '## Per weapon × class (pooled over the five bosses)', '', perClassWeapon, '',
    '## Per weapon × class × boss', '', cells, '',
  ].join('\n'));
  console.log(`-> ${args.md} + ${args['cells-md']} (${rows.length} fights, ${errors.length} errors)`);
  process.exit(0);
}

if (args.pyro) {
  const tip = read(args.pyro);
  const old = args.old ? read(args.old) : [];
  const errors = [...tip, ...old].filter((r) => r.error);
  const rows = [...tip, ...old].filter((r) => !r.error);
  // `p-t<tier>-<arm>|...` (tip) and `old-t<tier>-<arm>|...` (e56d530e)
  const parts = (r: Row) => { const [src, t, ...arm] = r.id.split('|')[0]!.split('-'); return { src: src!, tier: Number(t!.slice(1)), arm: arm.join('-') }; };
  const ARMS: { src: string; arm: string; name: string; frame: string; path: string }[] = [
    { src: 'p', arm: 'pyromancer', name: '(a) Pyromancer, as built', frame: 'balanced', path: 'dot-balanced-t3-a' },
    { src: 'p', arm: 'ember', name: '(b) Ember Mage frame, no T3 path', frame: 'balanced', path: '—' },
    { src: 'p', arm: 'firebrand', name: '(c) Firebrand', frame: 'balanced', path: 'dot-balanced-t3-b' },
    { src: 'p', arm: 'cinder-lord', name: '(c) Cinder Lord', frame: 'balanced', path: 'dot-balanced-t3-c' },
    { src: 'p', arm: 'light-frame', name: '(c) light frame, no T3 path', frame: 'light', path: '—' },
    { src: 'p', arm: 'venomslinger', name: '(c) Venomslinger', frame: 'light', path: 'dot-light-t3-a' },
    { src: 'p', arm: 'cultist', name: '(c) Cultist', frame: 'light', path: 'dot-light-t3-b' },
    { src: 'p', arm: 'zealot', name: '(c) Zealot', frame: 'light', path: 'dot-light-t3-c' },
    { src: 'p', arm: 'heavy-frame', name: '(c) heavy frame, no T3 path', frame: 'heavy', path: '—' },
    { src: 'p', arm: 'icebreaker', name: '(c) Icebreaker', frame: 'heavy', path: 'dot-heavy-t3-a' },
    { src: 'p', arm: 'winter-warden', name: '(c) Winter Warden', frame: 'heavy', path: 'dot-heavy-t3-b' },
    { src: 'p', arm: 'wind-spirit', name: '(c) Wind Spirit', frame: 'heavy', path: 'dot-heavy-t3-c' },
    { src: 'old', arm: 'pyromancer', name: '(d) Pyromancer before the pass (e56d530e)', frame: 'balanced', path: 'dot-balanced-t3-a (old)' },
    { src: 'old', arm: 'ember', name: '(d) Ember Mage frame, no T3 path (e56d530e)', frame: 'balanced', path: '—' },
    { src: 'old', arm: 'firebrand', name: '(d) Firebrand (e56d530e)', frame: 'balanced', path: 'dot-balanced-t3-b' },
    { src: 'old', arm: 'cinder-lord', name: '(d) Cinder Lord (e56d530e)', frame: 'balanced', path: 'dot-balanced-t3-c' },
  ];
  const frameAlone: Record<string, string> = { balanced: 'ember', light: 'light-frame', heavy: 'heavy-frame' };
  // T3 wears no path: a T3 row is its frame's row (the `ember` / `light-frame` / `heavy-frame` T3 arm).
  const t3Arm = (a: { arm: string; frame: string }) => frameAlone[a.frame]!;
  const sel = (src: string, tier: number, arm: string, boss?: string) =>
    rows.filter((r) => { const p = parts(r); return p.src === src && p.tier === tier && p.arm === arm && (!boss || r.boss === boss); });
  const S = (src: string, tier: number, arm: string, boss?: string) => stat(sel(src, tier, arm, boss));
  const pyroT4 = S('p', 4, 'pyromancer'), emberT4 = S('p', 4, 'ember');
  const main = table(['arm', 'frame', 'T3 path (worn at T4)', 'T3 dps', 'T3 wins', 'T4 dps', 'T4 wins', 'T4 Δ vs (a)', 'T4 Δ vs (b)', 'T4 Δ vs own frame alone'], 3,
    ARMS.filter((a) => sel(a.src, 4, a.arm).length > 0).map((a) => {
      const t3 = S(a.src, 3, t3Arm(a)), t4 = S(a.src, 4, a.arm);
      return [a.name, a.frame, a.path, f1(t3), wf(t3), f1(t4), wf(t4), pct(pyroT4, t4), pct(emberT4, t4), pct(S(a.src, 4, frameAlone[a.frame]!), t4)];
    }));
  const T4B = ['dune-throne-sovereign', 'verdant-crown-predator', 'iron-crest-titan', 'elder-trench-serpent', 'glacial-patriarch', 'caldera-sovereign'];
  const T3B = ['deep-core-burrow-gorger', 'dune-carapace-monarch', 'apex-bramble-slasher', 'crag-gorged-horn-behemoth', 'rot-spore-croc-behemoth', 'frost-plated-rime-mammoth', 'cinder-shell-magma-salamander'];
  const t4Bosses = table(['arm', ...T4B.map((b) => b.replace(/-sovereign|-predator|-titan|-serpent|-patriarch/, ''))], 1,
    ARMS.filter((a) => sel(a.src, 4, a.arm).length > 0).map((a) => [a.name, ...T4B.map((b) => { const s = S(a.src, 4, a.arm, b); return s ? `${f1(s)} (${s.wins}/${s.n})` : '-'; })]));
  const t3Frames: { src: string; arm: string; name: string }[] = [
    { src: 'p', arm: 'ember', name: 'Ember Mage (balanced): the package\'s T3 row' },
    { src: 'p', arm: 'light-frame', name: 'light frame' },
    { src: 'p', arm: 'heavy-frame', name: 'heavy frame' },
    { src: 'old', arm: 'ember', name: 'Ember Mage (balanced), e56d530e' },
  ].filter((a) => sel(a.src, 3, a.arm).length > 0);
  const t3Bosses = table(['T3 row', ...T3B.map((b) => b.split('-').slice(0, 2).join('-'))], 1,
    t3Frames.map((a) => [a.name, ...T3B.map((b) => { const s = S(a.src, 3, a.arm, b); return s ? `${f1(s)} (${s.wins}/${s.n})` : '-'; })]));
  // Seed-invariant cells: every fight in the cell dealt the same dps.
  const cellsAll = group(rows, (r) => `${parts(r).src}|${parts(r).tier}|${parts(r).arm}|${r.boss}`);
  const invariant = [...cellsAll.values()].filter((rs) => rs.length > 1 && rs.every((r) => r.dps === rs[0]!.dps && r.won === rs[0]!.won)).length;
  // The package's own seed alone, against W4-A's run of the same rows (before W4-E's "no refresh at max").
  let w4aLine = '';
  if (args.w4a) {
    const w = read(args.w4a).filter((r) => r.cls === 'apprentice' && r.id.startsWith('boss5-t4|'));
    const s0 = stat(sel('p', 4, 'pyromancer').filter((r) => r.seed === 99011));
    const sw = stat(w);
    w4aLine = `Seed 99011 alone (the package's one seed), the T4 Pyromancer: ${f1(s0)} dps, ${wf(s0)} wins at this tip, against ${f1(sw)} dps, ${wf(sw)} in W4-A's \`${args.w4a}\` (the same rows before W4-E's "no refresh at max"): ${pct(sw, s0)}.`;
  }
  writeFileSync(args.md!, [
    `<!-- generated by server/scripts/_apMeasureReport.ts --pyro=${args.pyro}${args.old ? ` --old=${args.old}` : ''} -->`,
    `fights: ${rows.length}${errors.length ? `, **${errors.length} error rows**` : ', 0 error rows'}; ${invariant} of ${cellsAll.size} (arm × boss) cells are seed-invariant (all 10 fights identical).`, '',
    '### Per arm (T3: 7 bosses × 10 seeds = 70 fights; T4: 6 bosses × 10 seeds = 60 fights)', '', main, '',
    '### T4 per boss: mean dps (wins / 10)', '', t4Bosses, '',
    '### T3 per boss: mean dps (wins / 10). A T3 Apprentice wears no T3 path, so this is the frame alone', '', t3Bosses, '',
    ...(w4aLine ? [w4aLine, ''] : []),
  ].join('\n'));
  const cellBody = ARMS.flatMap((a) => [3, 4].flatMap((tier) => {
    const arm = tier === 3 ? t3Arm(a) : a.arm;
    if (tier === 3 && a.arm !== arm) return [];
    return (tier === 3 ? T3B : T4B).map((b) => {
      const rs = sel(a.src, tier, arm, b);
      const s = stat(rs);
      const outs = [...group(rs, (r) => r.outcome ?? '?').entries()].map(([o, x]) => `${o} ${x.length}`).join(', ');
      return s ? [a.name, `T${tier}`, b, String(s.n), f1(s), `${s.min.toFixed(1)}–${s.max.toFixed(1)}`, wf(s), outs] : null;
    }).filter((x): x is string[] => x !== null);
  }));
  writeFileSync(args['cells-md']!, [
    '# The Pyromancer Apprentice: every cell (arm × tier × boss, 10 seeds)', '',
    `Sources: \`${args.pyro}\`${args.old ? `, \`${args.old}\`` : ''}. A T3 row is listed once per frame (no T3 path is worn at T3).`, '',
    table(['arm', 'tier', 'boss', 'n', 'mean dps', 'min–max', 'wins', 'outcomes'], 3, cellBody), '',
  ].join('\n'));
  console.log(`-> ${args.md} + ${args['cells-md']} (${rows.length} fights, ${errors.length} errors)`);
  process.exit(0);
}

if (args.final) {
  let errorCount = 0;
  const load = (k: string) => { const rs = read(args[k]!); errorCount += rs.filter((r) => r.error).length; return rs.filter((r) => !r.error); };
  const label = (r: Row) => r.id.split('|')[0]!;
  const out: string[] = [`<!-- generated by server/scripts/_apMeasureReport.ts --final (inputs in reports/ability-pass/README.md §12) -->`, ''];

  // ── (a) Slam at T2: rank II as authored now (2.45× on 600 ms) against X2's arms ──
  const slamNow = load('slam-now'), slamX2 = load('slam-x2');
  const slamArm = (r: Row) => label(r).split('-')[1]!;
  const slamWeapon = (r: Row) => label(r).split('-').slice(2).join('-');
  const sx = (arm: string, f: (r: Row) => boolean) => stat(slamX2.filter((r) => slamArm(r) === arm && f(r)));
  const sn = (f: (r: Row) => boolean) => stat(slamNow.filter(f));
  const slamHead = (lead: string[]) => [...lead, 'n', 'Sweep dps', 'win', 'Slam 1.6 s (X2) dps', 'Δ vs Sweep', 'win', 'Slam now (600 ms) dps', 'Δ vs Sweep', 'Δ vs 1.6 s', 'win'];
  const slamLine = (lead: string[], f: (r: Row) => boolean) => {
    const c = sx('sweep', f), old = sx('slam', f), now = sn(f);
    return [...lead, String(now?.n ?? 0), f1(c), wp(c), f1(old), pct(c, old), wp(old), f1(now), pct(c, now), pct(old, now), wp(now)];
  };
  const WEAPONS = [...new Set(slamNow.map(slamWeapon))].sort();
  out.push('## Slam at T2: rank II as authored now (2.45× on 600 ms)', '',
    `${slamNow.length} fights this run (the authored arm of \`plan-measure-slam-t2.json\`); Sweep and the 1.6 s rank II are X2's rows of the same plan.`, '',
    '### Per class (pooled over the five bosses, five weapons and 10 seeds)', '',
    table(slamHead(['class']), 1, [...CLASSES.map((cls) => slamLine([cap(cls)], (r) => r.cls === cls)), slamLine(['all six'], () => true)]), '',
    '### Per weapon (pooled over the six classes, five bosses and 10 seeds)', '',
    table(slamHead(['weapon']), 1, WEAPONS.map((w) => slamLine([w], (r) => slamWeapon(r) === w))), '');

  // ── (b) boss5 T3/T4, Rerun 3 ──
  const b0 = load('boss5-w0'), b4 = load('boss5-w4a'), b16 = load('boss5-1600'), bn = load('boss5-now');
  const bHead = (lead: string[]) => [...lead, 'n', 'dps W0', 'dps W4-A', 'dps tip, Slam 1.6 s', 'dps Rerun 3 (600 ms)', 'Δ W4-A → tip 1.6 s', 'Δ wind-up (1.6 s → 600 ms)', 'Δ W4-A → Rerun 3', 'Δ W0 → Rerun 3', 'wins W0 → W4-A → tip 1.6 s → Rerun 3'];
  const bLine = (lead: string[], f: (r: Row) => boolean) => {
    const [s0, s4, s16, sN] = [b0, b4, b16, bn].map((rs) => stat(rs.filter(f)));
    return [...lead, String(sN?.n ?? 0), f1(s0), f1(s4), f1(s16), f1(sN), pct(s4, s16), pct(s16, sN), pct(s4, sN), pct(s0, sN),
      `${s0?.wins ?? '-'} → ${s4?.wins ?? '-'} → ${s16?.wins ?? '-'} → ${sN?.wins ?? '-'} /${sN?.n ?? '-'}`];
  };
  out.push('## boss5 T3/T4 reference rows, Rerun 3 (Slam 600 ms every rank)', '',
    table(bHead(['candidate']), 1, ['boss5-t3', 'boss5-t4'].map((c) => bLine([c], (r) => label(r) === c))), '',
    'Per class (pooled over the bosses; single seed per cell):', '',
    table(bHead(['tier', 'class']), 2, [3, 4].flatMap((t) => CLASSES.map((cls) => bLine([`T${t}`, cls], (r) => label(r) === `boss5-t${t}` && r.cls === cls)))), '');

  // ── (c) the T4 Pyromancer ──
  const pNow = load('pyro-now'), p16 = load('pyro-1600'), pX2 = load('pyro-x2'), pOld = load('pyro-old');
  const P = (rs: Row[], lab: string, boss?: string) => stat(rs.filter((r) => label(r) === lab && (!boss || r.boss === boss)));
  type Arm = { name: string; slam: string; run: string; rs: Row[]; lab: string; frame: Row[]; frameLab: string };
  const arms: Arm[] = [
    { name: '(a) Pyromancer, as now built', slam: '600 ms', run: 'this branch', rs: pNow, lab: 'p-t4-pyromancer', frame: pNow, frameLab: 'p-t4-ember' },
    { name: '(b) Ember Mage frame, no T3 path', slam: '600 ms', run: 'this branch', rs: pNow, lab: 'p-t4-ember', frame: pNow, frameLab: 'p-t4-ember' },
    { name: 'Firebrand', slam: '600 ms', run: 'this branch', rs: pNow, lab: 'p-t4-firebrand', frame: pNow, frameLab: 'p-t4-ember' },
    { name: 'Cinder Lord', slam: '600 ms', run: 'this branch', rs: pNow, lab: 'p-t4-cinder-lord', frame: pNow, frameLab: 'p-t4-ember' },
    { name: '(a) Pyromancer, as now built', slam: '1.6 s (`ap`)', run: 'this branch', rs: p16, lab: 'p-t4-pyromancer', frame: p16, frameLab: 'p-t4-ember' },
    { name: '(b) Ember Mage frame, no T3 path', slam: '1.6 s (`ap`)', run: 'this branch', rs: p16, lab: 'p-t4-ember', frame: p16, frameLab: 'p-t4-ember' },
    { name: 'Pyromancer before this call (55%, no refresh)', slam: '1.6 s', run: 'X2', rs: pX2, lab: 'p-t4-pyromancer', frame: pX2, frameLab: 'p-t4-ember' },
    { name: '(b) Ember Mage frame, no T3 path', slam: '1.6 s', run: 'X2', rs: pX2, lab: 'p-t4-ember', frame: pX2, frameLab: 'p-t4-ember' },
    { name: 'Firebrand', slam: '1.6 s', run: 'X2', rs: pX2, lab: 'p-t4-firebrand', frame: pX2, frameLab: 'p-t4-ember' },
    { name: 'Cinder Lord', slam: '1.6 s', run: 'X2', rs: pX2, lab: 'p-t4-cinder-lord', frame: pX2, frameLab: 'p-t4-ember' },
    { name: '(d) Pyromancer before the pass (e56d530e)', slam: '1.6 s', run: 'X2 (e56d530e)', rs: pOld, lab: 'old-t4-pyromancer', frame: pOld, frameLab: 'old-t4-ember' },
  ];
  const oldPyro = P(pOld, 'old-t4-pyromancer');
  const T4B = ['dune-throne-sovereign', 'verdant-crown-predator', 'iron-crest-titan', 'elder-trench-serpent', 'glacial-patriarch', 'caldera-sovereign'];
  out.push('## The T4 Pyromancer (Apprentice boss5 T4 rows, 6 bosses × 10 seeds = 60 fights per arm)', '',
    table(['arm', 'Slam III/IV wind-up', 'run', 'T4 dps', 'T4 wins', 'Δ vs frame alone (same run)', 'Δ vs (d) old Pyromancer'], 3,
      arms.map((a) => { const s = P(a.rs, a.lab); return [a.name, a.slam, a.run, f1(s), wf(s), pct(P(a.frame, a.frameLab), s), pct(oldPyro, s)]; })), '',
    '### T4 per boss: mean dps (wins / 10)', '',
    table(['arm', 'Slam', 'run', ...T4B.map((b) => b.replace(/-sovereign|-predator|-titan|-serpent|-patriarch/, ''))], 3,
      arms.map((a) => [a.name, a.slam, a.run, ...T4B.map((b) => { const s = P(a.rs, a.lab, b); return s ? `${f1(s)} (${s.wins}/${s.n})` : '-'; })])), '');
  const t3Now = P(pNow, 'p-t3-ember'), t3X2 = P(pX2, 'p-t3-ember');
  out.push(`T3 (no T3 path is worn at T3; the package's T3 Apprentice row, 7 bosses × 10 seeds): ${f1(t3X2)} dps, ${wf(t3X2)} on Slam 1.6 s (X2) → ${f1(t3Now)} dps, ${wf(t3Now)} on 600 ms (${pct(t3X2, t3Now)}).`, '');
  out.splice(1, 0, `fights read: ${[slamNow, slamX2, b0, b4, b16, bn, pNow, p16, pX2, pOld].reduce((s, rs) => s + rs.length, 0)}; ${errorCount} error rows.`, '');
  writeFileSync(args.md!, out.join('\n'));
  console.log(`-> ${args.md} (${errorCount} errors)`);
  process.exit(0);
}

throw new Error('pass --slam=<jsonl>, --pyro=<jsonl> or --final');
