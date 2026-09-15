import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY_CELLS } from './durabilityTrialSpec';

export const DURABILITY8_CELLS = DURABILITY_CELLS
  .filter(c => c.tier === 3 && ['desert', 'tundra'].includes(c.role) && c.treatment === 'control')
  .flatMap(c => (c.role === 'desert'
    ? ['control', 'controller-hp2', 'controller-hp3']
    : ['control', 'bear-hp1.5', 'bear-hp1.5-fixed-shell']).map(treatment => ({
    ...c, id: c.id.replace(/^dur-/, 'dur8-').replace(/-control$/, '-' + treatment), treatment,
    targetTypes: c.role === 'desert' ? ['dune-stalker', 'desert-basilisk'] : ['glacier-bear'],
  })));
export type Durability8Cell = typeof DURABILITY8_CELLS[number];

export function installDurability8Treatment(cell: Durability8Cell) {
  const saved = cell.targetTypes.map(type => {
    const def = MONSTER_DATABASE.get(type)!;
    return { type, hp: def.stats.hp, shieldPct: def.enemyShield?.shieldPct };
  });
  const changes = saved.map(({ type, hp, shieldPct }) => {
    const def = MONSTER_DATABASE.get(type)!;
    const factor = cell.treatment === 'control' ? 1 : cell.role === 'desert'
      ? (cell.treatment === 'controller-hp2' ? 2 : 3) : 1.5;
    def.stats.hp = Math.round(hp * factor);
    if (cell.treatment === 'bear-hp1.5-fixed-shell') {
      assert(def.enemyShield && shieldPct !== undefined);
      // Preserve absolute shield capacity at the same node/max-HP modifier.
      // Shatter payoff and vulnerability remain unchanged between HP1.5 arms.
      def.enemyShield.shieldPct = shieldPct * hp / def.stats.hp;
    }
    return { type, before: hp, after: def.stats.hp,
      beforeShieldPct: shieldPct, afterShieldPct: def.enemyShield?.shieldPct };
  });
  return { changes, restore() {
    for (const { type, hp, shieldPct } of saved) {
      const def = MONSTER_DATABASE.get(type)!;
      def.stats.hp = hp;
      if (def.enemyShield && shieldPct !== undefined) def.enemyShield.shieldPct = shieldPct;
    }
  } };
}
