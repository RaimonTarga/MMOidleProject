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
// The Recovery pulse is gone (class-first bible §12.2): nothing defensive rides the combo.
assert.equal(mechanics['defense.recovery-pulse-pct'], undefined);
assert.equal(mechanics['defense.max-hit-mult'], undefined, 'Striker no longer carries a damage soft cap');

console.log('skillTreeData: ok');
