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
  HasAggroTarget,
  HasAttackTarget,
  IsMoving,
  HasKnockback,
  ScriptsBoss,
  HasDot,
  HasDetonation,
  HasHemorrhage,
  HasConflagration,
  HasChill,
  HasFrozen,
  HasSmolder,
  HasEntropy,
  HasAshbrandBurn,
  IsBossEngaged,
} from '../components';

/** All optional monster marker slices that may exist mid-fight. */
export interface FrozenMonsterMarkers {
  hasAggroTarget?: HasAggroTarget;
  hasAttackTarget?: HasAttackTarget;
  isMoving?: IsMoving;
  hasKnockback?: HasKnockback;
  hasDot?: HasDot;
  hasDetonation?: HasDetonation;
  hasHemorrhage?: HasHemorrhage;
  hasConflagration?: HasConflagration;
  hasChill?: HasChill;
  hasFrozen?: HasFrozen;
  hasSmolder?: HasSmolder;
  hasEntropy?: HasEntropy;
  hasAshbrandBurn?: HasAshbrandBurn;
  scriptsBoss?: ScriptsBoss;
  isBossEngaged?: IsBossEngaged;
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
