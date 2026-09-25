// Juggernaut Crescendo: linear to the knee, then a continuous, ever-growing log tail.
import {
  crescendoMultiplier, CRESCENDO_KNEE_MULT,
} from '../src/systems/classes/archetypes/cadence/t3/core/crescendo';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const at = (s: number) => crescendoMultiplier(s * 1000);
let prev = -1;
let kneeSec = -1;
for (let s = 0; s <= 900; s += 0.5) {
  const m = at(s);
  assert(m >= prev, `monotone at ${s}s`);
  if (kneeSec < 0 && m >= CRESCENDO_KNEE_MULT) kneeSec = s;
  prev = m;
}
assert(kneeSec > 0, 'the knee is reached in a sustained fight');

// Continuous value and slope at the knee: one step either side moves about the same.
const before = at(kneeSec) - at(kneeSec - 1);
const after = at(kneeSec + 1) - at(kneeSec);
assert(Math.abs(after - before) < 0.25 * before, `slope continuous at the knee (${before} vs ${after})`);

// Diminishing past the knee: still growing, but far slower than linear.
const late = at(900) - at(600);
assert(late > 0, 'keeps climbing past the knee');
assert(late < 0.1 * (300 * before), 'log tail grows far slower than the linear rate');

console.log('crescendoKnee: ok');
