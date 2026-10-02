import {
  capstoneMaterialName,
  ESSENCE_COLORS,
  ESSENCE_LABELS,
  packetDefinition,
  type EssenceType,
  type PacketId,
} from '@mmo-idle/shared';
import { GameIcon, type IconSource } from './GameIcon';
import { capstoneIconSource, essenceIconSource, shardIconSource } from './economyIcons';
import './materialChip.css';

/**
 * Anything the economy can hold or charge for. `shard` (keyed by lineage
 * packet) and `capstone` (keyed by biome) are the two lineage-tree wallets
 * from the progression rework (design §12). This is a presentation-only
 * union so one component can render any of them.
 */
export type MaterialRef =
  | { kind: 'essence'; type: EssenceType }
  | { kind: 'shard'; packet: PacketId }
  | { kind: 'capstone'; biome: string };

export function essenceMaterial(type: EssenceType): MaterialRef {
  return { kind: 'essence', type };
}

/** Lineage shard wallets are keyed by packet. */
export function shardMaterial(packet: PacketId): MaterialRef {
  return { kind: 'shard', packet };
}

/** Boss capstone wallets are keyed by biome. */
export function capstoneMaterial(biome: string): MaterialRef {
  return { kind: 'capstone', biome };
}

export function materialKey(material: MaterialRef): string {
  switch (material.kind) {
    case 'essence': return `essence:${material.type}`;
    case 'shard': return `shard:${material.packet}`;
    case 'capstone': return `capstone:${material.biome}`;
  }
}

export function materialLabel(material: MaterialRef): string {
  switch (material.kind) {
    case 'essence': return ESSENCE_LABELS[material.type];
    case 'shard': return `${packetDefinition(material.packet)?.name ?? material.packet} shard`;
    case 'capstone': return capstoneMaterialName(material.biome);
  }
}

export function materialAccent(material: MaterialRef): string {
  switch (material.kind) {
    case 'essence': return ESSENCE_COLORS[material.type];
    case 'shard': return packetDefinition(material.packet)?.color ?? 'var(--hud-primary)';
    case 'capstone': return '#d9b25c';
  }
}

export function materialIconSource(material: MaterialRef): IconSource {
  switch (material.kind) {
    case 'essence': return essenceIconSource(material.type);
    case 'shard': return shardIconSource(material.packet);
    case 'capstone': return capstoneIconSource(material.biome);
  }
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
 * The single way an essence, shard or capstone quantity is drawn: packed icon, amount,
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
