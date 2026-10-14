import { getMaxUpgrade } from './itemUpgrades';
import { normalizeEquipment } from '../items';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const oldSave = normalizeEquipment({
  weapon: 'old-weapon',
  armor: null,
  recovery: null,
  mobility: null,
});
assert(oldSave.relic === null, 'pre-relic equipment hydrates with relic: null');
assert(oldSave.weapon === 'old-weapon', 'normalization preserves old slots');

assert(getMaxUpgrade({
  id: 'test-relic',
  name: 'Test Relic',
  slot: 'relic',
  tier: 4,
  statModifiers: {},
}) === 0, 'relics stay off the +N upgrade track');

console.log('relicEquipment: ok');
