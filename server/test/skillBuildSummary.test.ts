import { strict as assert } from 'node:assert';
import { skillBuildSummary } from '../../client/src/ui/skillBuildSummary';
import { formatPassiveValue } from '../../client/src/ui/describe/passiveText';

const root = skillBuildSummary(['cadence-root']);
const close = skillBuildSummary(['cadence-root', 'cadence-range-close']);
assert.equal(root.statEffects.maxHpPct, .18);
assert.ok(Math.abs(close.statEffects.maxHpPct! - .30) < 1e-9);
assert.ok(Math.abs(close.mechanicEffects['defense.recovery-pulse-pct']! - .30) < 1e-9);
assert.equal(close.mechanicEffects['defense.recovery-pulse-interval-ms'], 6000);
assert.equal(close.mechanicEffects['defense.recovery-pulse-duration-ms'], 4000);
assert.equal(close.mechanicEffects['defense.max-hit-mult'], .5);
assert.deepEqual(skillBuildSummary(['cadence-range-close', 'cadence-root', 'cadence-root', 'missing']), close);
assert.deepEqual(skillBuildSummary([]), { nodes: [], statEffects: {}, mechanicEffects: {} });
assert.equal(formatPassiveValue('cadence.debuff-vuln-pct', 25, { signed: true }), '+25%');
assert.equal(formatPassiveValue('cadence.debuff-vuln-pct', 25), '25%');
console.log('skillBuildSummary: ok');
