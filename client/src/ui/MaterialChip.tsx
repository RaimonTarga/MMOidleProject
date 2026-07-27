import {
  catalystLabel,
  ESSENCE_COLORS,
  ESSENCE_LABELS,
  PACE_FAMILY_COLORS,
  type EssenceType,
  type PaceFamily,
} from '@mmo-idle/shared';
import { GameIcon, type IconSource } from './GameIcon';
import { catalystIconSource, essenceIconSource } from './economyIcons';
import './materialChip.css';

/**
 * Anything the economy can hold or charge for. Essence types and catalyst
 * families are separate authoritative wallets; this is a presentation-only
 * union so one component can render either.
 */
export type MaterialRef =
  | { kind: 'essence'; type: EssenceType }
  | { kind: 'catalyst'; family: string };

export function essenceMaterial(type: EssenceType): MaterialRef {
  return { kind: 'essence', type };
}

/** Catalyst wallets are keyed by pace family; unknown keys still render. */
export function catalystMaterial(family: string): MaterialRef {
  return { kind: 'catalyst', family };
}

export function materialKey(material: MaterialRef): string {
  return material.kind === 'essence'
    ? `essence:${material.type}`
    : `catalyst:${material.family}`;
}

export function materialLabel(material: MaterialRef): string {
  return material.kind === 'essence'
    ? ESSENCE_LABELS[material.type]
    : catalystLabel(material.family);
}

export function materialAccent(material: MaterialRef): string {
  if (material.kind === 'essence') return ESSENCE_COLORS[material.type];
  return PACE_FAMILY_COLORS[material.family as PaceFamily] ?? 'var(--hud-primary)';
}

export function materialIconSource(material: MaterialRef): IconSource {
  return material.kind === 'essence'
    ? essenceIconSource(material.type)
    : catalystIconSource(material.family as PaceFamily);
}

export interface MaterialChipProps {
  material: MaterialRef;
  /** How much the player holds. Always shown, so a cost is never ambiguous. */
  held: number;
  /**
   * How much this cost demands. Omit for a wallet chip, which just reports the
   * balance and carries no affordability state.
   */
  required?: number;
  /** Show the material's name beside its count. Off in dense strips. */
  showLabel?: boolean;
  size?: number;
  className?: string;
}

/**
 * The single way an essence or catalyst quantity is drawn: packed icon, amount,
 * and — for costs — the held balance plus an affordable/short state. Every
 * wallet summary and every recipe cost in the game routes through this, so a
 * player learns one visual grammar for the economy.
 */
export function MaterialChip({
  material,
  held,
  required,
  showLabel = false,
  size = 16,
  className,
}: MaterialChipProps) {
  const isCost = required !== undefined;
  const affordable = !isCost || held >= required;
  const label = materialLabel(material);
  const classes = [
    'material-chip',
    isCost ? 'material-chip--cost' : 'material-chip--wallet',
    isCost && (affordable ? 'material-chip--ok' : 'material-chip--short'),
    !isCost && held === 0 && 'material-chip--empty',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      style={{ '--material-accent': materialAccent(material) } as React.CSSProperties}
      title={isCost ? `${label}: ${required} required, ${held} held` : `${label}: ${held}`}
    >
      <GameIcon
        source={materialIconSource(material)}
        size={size}
        fallback={label.charAt(0)}
        className="material-chip__icon"
        decorative
      />
      {showLabel && <span className="material-chip__label">{label}</span>}
      <span className="material-chip__amount">{isCost ? required : held}</span>
      {isCost && <span className="material-chip__held">({held})</span>}
    </span>
  );
}
