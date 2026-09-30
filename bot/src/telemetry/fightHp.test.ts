import { FIGHT_GRACE_MS, FightHpTracker, summarizeFights } from './fightHp';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const base = { biomeGroup: 'plains', nodeId: 'node-t1-plains-03', dead: false };
const t = new FightHpTracker();
// Read through a function so `asserts` narrowing cannot pin `t.fights.length` to a literal.
const closed = () => t.fights.length;
let at = 0;
const step = (engaged: boolean, hpFraction: number, extra: Partial<typeof base> = {}) => {
  at += 1000;
  t.sample(at, 1000, { ...base, engaged, hpFraction, ...extra });
};

// Idle samples open nothing.
step(false, 1);
step(false, 1);
assert(t.snapshot().length === 0, 'idle opens no fight');

// A fight: HP walks down, a brief disengagement inside the grace does not split it.
step(true, 1.0);
step(true, 0.9);
step(true, 0.7);
step(false, 0.7);          // inside grace
step(true, 0.5);           // target switch inside the same pack
step(true, 0.45);
assert(closed() === 0, 'open fight is not closed yet');
assert(t.snapshot().length === 1 && t.snapshot()[0].endedBy === 'run-end', 'snapshot folds the open fight in as run-end');
for (let i = 0; i * 1000 < FIGHT_GRACE_MS; i++) step(false, 0.5);
assert(closed() === 1, 'grace elapsed closes the fight');
const first = t.fights[0];
assert(first.endedBy === 'disengage', 'closed by disengagement');
assert(first.durationMs === 5000, `engaged time only, got ${first.durationMs}`);
assert(first.startHpFraction === 1 && first.endHpFraction === 0.45, 'start/end HP are the first/last engaged samples');
assert(first.minHpFraction === 0.45, 'min tracked');
assert(first.inBandMs === 3000, `in-band time counts 0.7, 0.5, 0.45 only, got ${first.inBandMs}`);

// Death closes a fight at 0 HP.
step(true, 0.6);
step(true, 0.2);
step(false, 0, { dead: true });
assert(closed() === 2 && t.fights[1].endedBy === 'death', 'death closes the fight');
assert(t.fights[1].endHpFraction === 0 && t.fights[1].minHpFraction === 0, 'a death ends at 0');
step(false, 0, { dead: true });
assert(closed() === 2, 'dead samples open nothing');

// A node change closes a fight, and the next node opens a fresh one.
step(true, 1.0);
step(true, 0.95, { nodeId: 'node-t1-forest-02', biomeGroup: 'forest' });
assert(closed() === 3 && t.fights[2].endedBy === 'node-change', 'node change closes');
assert(t.snapshot().at(-1)!.biomeGroup === 'forest', 'the new node opens its own fight');
t.finish(at + 1000);
assert(closed() === 4 && t.fights[3].endedBy === 'run-end', 'finish closes the open fight');

// Summary: a brush shorter than 1 s is excluded; medians and buckets read right.
const summary = summarizeFights([
  ...t.fights,
  { biomeGroup: 'plains', nodeId: 'x', startedAtMs: 0, durationMs: 500, startHpFraction: 1, endHpFraction: 1, minHpFraction: 1, inBandMs: 0, endedBy: 'disengage' },
]);
assert(summary.brushes === 1, 'sub-second engagements are brushes');
// Fights: 0.45 (5 s, 3 s in band), death (2 s: 0.6 and 0.2 both in band), 1.0 (1 s, 0 in band), 0.95 (1 s, 0 in band).
assert(summary.fights === 4, `four real fights, got ${summary.fights}`);
assert(summary.deaths === 1, 'one death');
assert(summary.medianEndHpFraction === 0.7, `median end HP of [0, 0.45, 0.95, 1] is 0.7, got ${summary.medianEndHpFraction}`);
assert(summary.timeInBandShare === Math.round((5000 / 9000) * 1000) / 1000, `in-band share ${summary.timeInBandShare}`);
assert(summary.endHpBuckets.lt20 === 1 && summary.endHpBuckets.from40to60 === 1 && summary.endHpBuckets.ge80 === 2, 'buckets');
assert(summary.byBiome.plains.fights === 3 && summary.byBiome.forest.fights === 1, 'per-biome split');
assert(summarizeFights([]).medianEndHpFraction === null, 'empty summary is null, not 0');

console.log('fightHp.test: ok');
