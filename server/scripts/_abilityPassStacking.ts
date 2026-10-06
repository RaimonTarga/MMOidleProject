/**
 * Ability pass W0 (docs/briefs/ability-pass-run-2026-10-02.md): the T3/T4
 * before/after of the legibility run's stacking change, as a table. A throwaway,
 * not an instrument: it writes a plan for `_t1BossLab.ts` and reads what the lab
 * wrote.
 *
 * Two modes, from `server/`:
 *
 *   # boss5Spec's tier-3 and tier-4 reference cells -> a `_t1BossLab.ts` plan
 *   node --conditions=development --import tsx scripts/_abilityPassStacking.ts \
 *     --boss5-plan=<plan.json> [--tiers=3,4]
 *
 *   # before / [mid] / after lab rows -> markdown
 *   node --conditions=development --import tsx scripts/_abilityPassStacking.ts \
 *     --before=<a.jsonl> [--mid=<b.jsonl>] --after=<c.jsonl> --title=<text> --md=<out.md> \
 *     [--cells-md=<out-cells.md>] [--moved-only]
 *
 * WHY THE BOSS5 ROWS GO THROUGH THE LAB. `pnpm bench:balance` (`bench/balanceRun.ts`)
 * never reads `boss5Spec.ts`; the spec's only runner is `scripts/bossScreen.ts
 * --trial=boss5`, and that refuses to start at 7360e3b0 and at the tip alike:
 * `assertBoss5Definitions` pins "five behaviour rules" and the resolved package now
 * carries seven (`withReferenceAbilityWiring` adds the use-ability runes since the
 * ability-wiring rework), which is why `scripts/run-tests.mjs` archives
 * `boss5Matrix.test.ts`. So the plan below carries each reference cell verbatim
 * (`boss5ReferenceCells`: stance, Technique, ordered Guard pair, the five rules,
 * +5, the tier kit, core, relic, the skill path the lab derives identically), the
 * spec's one seed (99011), its per-tier cap, the fixed spawn (no jitter), and the
 * lab's `prepareSurveyBot` -- the same preparation `bossScreen.ts` uses. The lab has
 * no 300 s wall ceiling, so a long fight is deterministic rather than load-dependent.
 * Row ids are `boss5-t<tier>|<class>|<boss>|<seed>`.
 *
 * The table groups per (candidate, class, boss); `--mid` splits each delta into
 * before -> mid and mid -> after (W0 uses d593ceea as the mid: 7360e3b0 -> d593ceea
 * is the legibility run, d593ceea -> tip the two Effect-parity commits).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { BOSS5_BLOCKS_DEF } from '../bench/balance/boss5Spec';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return i < 0 ? [s.slice(2), '1'] : [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

const CLASS_ORDER = ['striker', 'squire', 'slinger', 'spirit', 'apprentice', 'conduit'];

if (args['boss5-plan']) {
  const tiers = (args.tiers ?? '3,4').split(',').map(Number);
  const rows: unknown[] = [];
  for (const block of BOSS5_BLOCKS_DEF) {
    if (block.kind !== 'breadth' || !tiers.includes(block.tier)) continue;
    for (const cell of block.cells) {
      const g = cell.build.gearItemIds as Record<string, string>;
      // The lab's `skillPathFor` with frame 'balanced', spec 'a' and the class's
      // default range must rebuild the spec's declared path exactly.
      const prefix = cell.build.classRoot.replace(/-root$/, '');
      const ranged = cell.runeRules!.some((r) => r.actionId === 'orbit');
      const t = block.tier;
      const labPath = [`${prefix}-root`, ...(t >= 2 ? [`${prefix}-balanced`] : []),
        ...(t >= 3 ? [`${prefix}-range-${ranged ? 'mid' : 'close'}`] : []), ...(t >= 4 ? [`${prefix}-balanced-t3-a`] : [])];
      if (JSON.stringify(labPath) !== JSON.stringify(cell.build.skillPath)) {
        throw new Error(`${cell.id}: the lab would build ${labPath.join('+')}, the spec declares ${cell.build.skillPath.join('+')}`);
      }
      rows.push({
        id: `boss5-t${block.tier}|${cell.className}|${block.bossId}|${block.seed}`,
        boss: block.bossId, cls: cell.className, seed: block.seed, tier: block.tier,
        upgrade: cell.upgradeLevel, capMs: block.capMs, stance: cell.stance,
        weapon: g.weapon, armor: g.armor, charm: g.recovery, boots: g.mobility,
        ...(g.core ? { core: g.core } : {}), ...(g.relic ? { relic: g.relic } : {}),
        techniques: [...cell.abilities!.techniques], guards: [...cell.abilities!.guards],
        rules: cell.runeRules,
        // The lab derives `root, <frame>, range-<close|mid>, <frame>-t3-<spec>` from
        // these; boss5 declares exactly that path with the balanced frame and spec a.
        frame: 'balanced', spec: 'a',
        boss5Block: block.name, boss5SkillPath: cell.build.skillPath,
      });
    }
  }
  writeFileSync(args['boss5-plan'], JSON.stringify(rows, null, 1));
  console.log(`boss5 tiers ${tiers.join(',')}: ${rows.length} rows -> ${args['boss5-plan']}`);
  process.exit(0);
}

interface Row { id: string; cls: string; boss: string; dps: number; won: boolean; outcome?: string; error?: string }
const read = (p: string): Row[] => readFileSync(p, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l) as Row);
const files = { before: args.before!, mid: args.mid, after: args.after! };
const sets = { before: read(files.before), mid: files.mid ? read(files.mid) : null, after: read(files.after) };
const errors = [...sets.before, ...(sets.mid ?? []), ...sets.after].filter((r) => r.error);

interface Stat { n: number; dps: number; win: number; outcomes: string[] }
function stat(rows: Row[]): Stat | undefined {
  if (rows.length === 0) return undefined;
  return {
    n: rows.length, dps: rows.reduce((s, r) => s + r.dps, 0) / rows.length,
    win: rows.filter((r) => r.won).length / rows.length, outcomes: rows.map((r) => r.outcome ?? ''),
  };
}
const cand = (r: Row) => r.id.split('|')[0]!;
const ok = (rs: Row[]) => rs.filter((r) => !r.error);
function by<K>(rows: Row[], key: (r: Row) => K): Map<K, Row[]> {
  const m = new Map<K, Row[]>();
  for (const r of ok(rows)) { const k = key(r); (m.get(k) ?? m.set(k, []).get(k)!).push(r); }
  return m;
}

const pctD = (a?: Stat, b?: Stat) => (a && b && a.dps > 0 ? ((b.dps - a.dps) / a.dps) * 100 : null);
const ptD = (a?: Stat, b?: Stat) => (a && b ? (b.win - a.win) * 100 : null);
const sg = (x: number | null, u: string) => (x === null ? '-' : Math.abs(x) < 0.05 ? `0.0${u}` : `${x > 0 ? '+' : ''}${x.toFixed(1)}${u}`);
const f1 = (s?: Stat) => (s ? s.dps.toFixed(1) : '-');
const wp = (s?: Stat) => (s ? `${Math.round(s.win * 100)}%` : '-');

/** A row moved if any of its deltas is non-zero (dps to 0.1, win rate exactly). */
function moved(get: (set: Row[], key: string) => Stat | undefined, k: string): boolean {
  const a = get(sets.before, k), b = get(sets.after, k), m = sets.mid ? get(sets.mid, k) : undefined;
  const same = (x?: Stat, y?: Stat) => !!x && !!y && x.dps.toFixed(1) === y.dps.toFixed(1) && x.win === y.win;
  return !same(a, b) || (sets.mid !== null && !same(a, m));
}

function table(keys: string[], label: string[], get: (set: Row[], key: string) => Stat | undefined, movedOnly = false): string {
  const mid = sets.mid !== null;
  const head = [...label, 'n', 'dps before', ...(mid ? ['dps mid'] : []), 'dps after',
    ...(mid ? ['Δ before→mid', 'Δ mid→after'] : []), 'Δdps', 'win before', 'win after', 'Δwin'];
  const lines = [`| ${head.join(' | ')} |`, `|${head.map((_, i) => (i < label.length ? '---' : '---:')).join('|')}|`];
  const shown = movedOnly ? keys.filter((k) => moved(get, k)) : keys;
  for (const k of shown) {
    const a = get(sets.before, k), m = mid ? get(sets.mid!, k) : undefined, b = get(sets.after, k);
    lines.push(`| ${[...k.split('|'),
      String(b?.n ?? a?.n ?? 0), f1(a), ...(mid ? [f1(m)] : []), f1(b),
      ...(mid ? [sg(pctD(a, m), '%'), sg(pctD(m, b), '%')] : []), sg(pctD(a, b), '%'),
      wp(a), wp(b), sg(ptD(a, b), 'pt')].join(' | ')} |`);
  }
  if (movedOnly) lines.push('', `${shown.length} of ${keys.length} rows moved; the other ${keys.length - shown.length} are equal in every column.`);
  return lines.join('\n');
}

/**
 * A candidate's FAMILY: the T2 lab's `cmpt2-<lineage>-<pair>` pools to
 * `cmpt2-<lineage>` (one weapon: every lean × verb pair and the control); anything
 * else is its own family (`boss5-t3`).
 */
const family = (c: string): string => (c.startsWith('cmpt') ? c.split('-').slice(0, 2).join('-') : c);
const all = [...sets.before, ...sets.after];
const cands = [...new Set(ok(all).map(cand))];
const families = [...new Set(cands.map(family))];
const order3 = (x: string, y: string, groups: string[]): number => {
  const [cx, lx, bx] = x.split('|') as [string, string, string];
  const [cy, ly, by_] = y.split('|') as [string, string, string];
  return groups.indexOf(cx) - groups.indexOf(cy) || CLASS_ORDER.indexOf(lx) - CLASS_ORDER.indexOf(ly) || bx.localeCompare(by_);
};
const cellKeys = [...new Set(ok(all).map((r) => `${cand(r)}|${r.cls}|${r.boss}`))].sort((x, y) => order3(x, y, cands));
const cellOf = (set: Row[], k: string) => stat(by(set, (r) => `${cand(r)}|${r.cls}|${r.boss}`).get(k) ?? []);
const candOf = (set: Row[], k: string) => stat(by(set, cand).get(k) ?? []);
const famKeys = [...new Set(ok(all).map((r) => `${family(cand(r))}|${r.cls}|${r.boss}`))].sort((x, y) => order3(x, y, families));
const famOf = (set: Row[], k: string) => stat(by(set, (r) => `${family(cand(r))}|${r.cls}|${r.boss}`).get(k) ?? []);
const movedOnly = !!args['moved-only'];

const summary = [
  `# ${args.title ?? 'stacking before/after'}`, '',
  `before: \`${files.before}\` (${ok(sets.before).length} fights)  `,
  ...(files.mid ? [`mid: \`${files.mid}\` (${ok(sets.mid!).length} fights)  `] : []),
  `after: \`${files.after}\` (${ok(sets.after).length} fights)${errors.length ? `  \n**${errors.length} error rows**` : ''}`, '',
  '## Per candidate (pooled over class × boss × seed)', '', table(cands, ['candidate'], candOf), '',
  ...(families.length < cands.length
    ? ['## Per weapon × class × boss (pooled over the weapon\'s candidates and seeds)', '',
      table(famKeys, ['weapon', 'class', 'boss'], famOf, movedOnly), '']
    : []),
];
const cells = ['## Per candidate × class × boss', '', table(cellKeys, ['candidate', 'class', 'boss'], cellOf, movedOnly), ''];
if (args['cells-md']) {
  writeFileSync(args.md!, summary.join('\n'));
  writeFileSync(args['cells-md'], [`# ${args.title ?? 'stacking'}: every cell`, '',
    table(cellKeys, ['candidate', 'class', 'boss'], cellOf), ''].join('\n'));
} else {
  writeFileSync(args.md!, [...summary, ...cells].join('\n'));
}
console.log(`-> ${args.md}${args['cells-md'] ? ` + ${args['cells-md']}` : ''}`);
