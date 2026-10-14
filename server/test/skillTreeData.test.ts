import { strict as assert } from 'node:assert';
import { SKILL_TREE, finalizePulse, makePulseAccumulator, mergePassives, type PassiveMap } from '@mmo-idle/shared';
import { formatPassiveValue } from '../../client/src/ui/describe/passiveText';

// Guards authored Striker numbers that the passive tree panel presents.
const root = SKILL_TREE.get('cadence-root')!;
assert.equal(root.statEffects.maxHpPct, .18);

const mechanics: PassiveMap = {};
const pulses = makePulseAccumulator();
mergePassives(mechanics, root.mechanicEffects, pulses);
finalizePulse(pulses, mechanics);
assert.ok(Math.abs(mechanics['defense.recovery-pulse-pct']! - .20) < 1e-9);
assert.equal(mechanics['defense.recovery-pulse-interval-ms'], 6000);
assert.equal(mechanics['defense.recovery-pulse-duration-ms'], 4000);
assert.equal(mechanics['defense.max-hit-mult'], undefined, 'Striker no longer carries a damage soft cap');

assert.equal(formatPassiveValue('cadence.debuff-vuln-pct', 25, { signed: true }), '+25%');
assert.equal(formatPassiveValue('cadence.debuff-vuln-pct', 25), '25%');
console.log('skillTreeData: ok');
