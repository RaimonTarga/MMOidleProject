import type { DamageMitigationBreakdown, WorldLogDamageType } from '@mmo-idle/shared';
import { formatLogNumber } from '@mmo-idle/shared';
import { ALLY_COLOR, ENEMY_COLOR } from './logColors';

export interface DamageLogRowProps {
  mitigation: DamageMitigationBreakdown;
  /** damage-out = you/allied source → enemy target; damage-in = enemy source → you/allied target */
  direction: 'in' | 'out';
  damageType?: WorldLogDamageType;
}

/**
 * Line 2 of a damage entry: `(⛨mit − ⚔gross) = −final`.
 * Each number is colored by who owns that stat:
 *   ⛨ mitigated → defender (plating/DR/shield)
 *   ⚔ gross     → attacker
 *   final       → target (HP lost), shown as −N
 */
export function DamageLogRow({ mitigation, direction, damageType }: DamageLogRowProps) {
  const { mitigatedTotal, grossDamage, hpDamage } = mitigation;
  const isOut = direction === 'out';
  const typeDetail = damageType && damageType !== 'direct' ? ` (${damageType})` : '';

  const mitigatedColor = isOut ? ENEMY_COLOR : ALLY_COLOR;
  const grossColor = isOut ? ALLY_COLOR : ENEMY_COLOR;
  const finalColor = isOut ? ENEMY_COLOR : ALLY_COLOR;

  return (
    <span className="combat-log__math">
      <span className="combat-log__paren">(</span>
      <span
        className="combat-log__mitigated"
        style={{ color: mitigatedColor }}
        title="Mitigated by defender plating/DR"
      >
        <span className="combat-log__icon" aria-hidden>⛨</span>
        {formatLogNumber(mitigatedTotal)}
      </span>
      <span className="combat-log__sep"> − </span>
      <span
        className="combat-log__gross"
        style={{ color: grossColor }}
        title="Gross hit from attacker"
      >
        <span className="combat-log__icon" aria-hidden>⚔</span>
        {formatLogNumber(grossDamage)}
      </span>
      <span className="combat-log__paren">)</span>
      <span className="combat-log__eq"> = </span>
      <span
        className="combat-log__final"
        style={{ color: finalColor }}
        title="Final HP damage to target"
      >
        −{formatLogNumber(hpDamage)}
      </span>
      {typeDetail && <span className="combat-log__source">{typeDetail}</span>}
      {mitigation.glancing && (
        <em className="combat-log__glancing" title="Damage floored to 1">
          {' '}
          glancing!
        </em>
      )}
    </span>
  );
}

/** Color for a plain numeric detail when no mitigation breakdown is present. */
export function detailStatColor(kind: 'damage-out' | 'damage-in'): string {
  return kind === 'damage-out' ? ENEMY_COLOR : ALLY_COLOR;
}
