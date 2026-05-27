import type {
  ControlsMonster,
  HasAwareness,
  HasPosition,
  HasHealth,
  DealsDamage,
  PerformsAttack,
  MitigatesDamage,
  HasStatus,
  IsMonster,
  TracksCombat,
  ScriptsBoss,
} from '../components';

/**
 * Only boss-script state is persisted across freeze/thaw cycles.
 * Transient combat markers (hasFrozen, hasChill, hasDot, aggro/attack targets,
 * movement, knockback, etc.) are intentionally dropped — they reference
 * per-session player IDs or short-duration timers that become stale and can
 * produce permanently-stuck monster states (e.g. immortal frozen mobs).
 */
export interface FrozenMonsterMarkers {
  scriptsBoss?: ScriptsBoss;
}

export interface FrozenMonsterSnapshot {
  entityId: string;
  isMonster: IsMonster;
  hasPosition: HasPosition;
  hasHealth: HasHealth;
  dealsDamage: DealsDamage;
  performsAttack: PerformsAttack;
  mitigatesDamage: MitigatesDamage;
  hasAwareness: HasAwareness;
  hasStatus: HasStatus;
  controlsMonster: ControlsMonster;
  tracksCombat: TracksCombat;
  markers: FrozenMonsterMarkers;
}

export interface FrozenNodeSnapshot {
  nodeId: string;
  frozenAt: number;
  bossRespawnAt: number | null;
  nextMonsterIdFloor: number;
  monsters: FrozenMonsterSnapshot[];
}
