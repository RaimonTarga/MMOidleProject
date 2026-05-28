import type {
  AppliesDots,
  ChillsTarget,
  ControlsMonster,
  DealsDamage,
  EvadesHits,
  HasAwareness,
  HasHealth,
  HasHitbox,
  HasKnockback,
  HasDetonation,
  HasHemorrhage,
  HasDot,
  HasConflagration,
  HasChill,
  HasFrozen,
  HasSmolder,
  HasAggroTarget,
  HasEntropy,
  HasEmpoweredAttack,
  HasAshbrandBurn,
  HasAlignment,
  HasAttackTarget,
  HasOverdrive,
  HasPosition,
  HasStatus,
  HoldsShields,
  HoldsInventory,
  InAcChargePhase,
  InAcDischarge,
  InParty,
  IsBossEngaged,
  IsChanneling,
  IsMonster,
  IsMoving,
  IsPlayer,
  MitigatesDamage,
  PerformsAttack,
  ScriptsBoss,
  ShowsSacred,
  TracksCombat,
  TracksProgression,
  UsesAutocombat,
  UsesCadence,
  UsesCooldown,
  UsesEnergy,
  UsesReload,
  UsesSkills,
} from '@mmo-idle/shared';
import type { With } from 'miniplex';

export type EntityId = string;

/** Server-only marker: player is walking a planned auto-traverse path. */
export interface HasAutoTraversePath {
  targetNodeId: string;
  remainingPath: string[];
}

/**
 * The shape of any entity in the ECS world.
 *
 * `entityId` is the only required key. All other keys are optional components
 * attached by feature systems via `world.add({...})` or `world.addComponent`.
 *
 * This type is the **type-system universe** of possible components.
 * miniplex's typed `world.with<C extends keyof E>(...)` API needs every
 * possible component key to be declared on `E`, so when a new component is
 * introduced its key string must be added here as an optional field. This is
 * the only place in the codebase that lists every component — feature modules
 * still own the component *shape* (the interface) so the file count stays
 * bounded.
 *
 * Imports are all `type` imports to keep the runtime dependency graph one-way:
 * `server/src/ecs/*` is consumed by `server/src/world/World.ts`, not the
 * other way around.
 */
export interface ServerEntity {
  entityId: EntityId;

  // ── Typed slice components (Server Phase 4) ───────────────────
  //
  // Slice naming uses two-word verb phrases (HasPosition, DealsDamage, …)
  // and slice keys use the lower-camel form (hasPosition, dealsDamage, …).
  // Every wire-DTO field belongs to exactly one slice.

  // Shared by players and monsters
  hasPosition?:     HasPosition;
  hasHitbox?:       HasHitbox;
  isMoving?:        IsMoving;
  hasAttackTarget?: HasAttackTarget;
  hasHealth?:       HasHealth;
  dealsDamage?:     DealsDamage;
  performsAttack?:  PerformsAttack;
  mitigatesDamage?: MitigatesDamage;
  hasStatus?:       HasStatus;

  // Player-only slices
  isPlayer?:           IsPlayer;
  evadesHits?:         EvadesHits;
  holdsShields?:       HoldsShields;
  usesAutocombat?:     UsesAutocombat;
  tracksProgression?:  TracksProgression;
  holdsInventory?:     HoldsInventory;
  usesSkills?:         UsesSkills;
  showsSacred?:        ShowsSacred;
  inParty?:            InParty;
  usesCadence?:        UsesCadence;
  usesEnergy?:         UsesEnergy;
  appliesDots?:        AppliesDots;
  chillsTarget?:       ChillsTarget;
  usesCooldown?:       UsesCooldown;
  usesReload?:         UsesReload;
  isChanneling?:       IsChanneling;
  hasOverdrive?:       HasOverdrive;
  hasAlignment?:       HasAlignment;
  inAcChargePhase?:    InAcChargePhase;
  inAcDischarge?:      InAcDischarge;
  hasEmpoweredAttack?: HasEmpoweredAttack;

  // Monster-only slices
  isMonster?:    IsMonster;
  hasAwareness?: HasAwareness;
  hasAggroTarget?: HasAggroTarget;

  // ── Monster (S7) ──────────────────────────────────────────────
  controlsMonster?: ControlsMonster;
  hasKnockback?:    HasKnockback;
  hasDetonation?:   HasDetonation;
  hasHemorrhage?:   HasHemorrhage;
  hasDot?:          HasDot;
  hasConflagration?: HasConflagration;
  hasChill?:        HasChill;
  hasFrozen?:       HasFrozen;
  hasSmolder?:      HasSmolder;
  hasEntropy?:      HasEntropy;
  hasAshbrandBurn?: HasAshbrandBurn;
  scriptsBoss?:     ScriptsBoss;
  isBossEngaged?:   IsBossEngaged;

  // ── Player (S8) ───────────────────────────────────────────────
  tracksEngagement?: number;
  hasManualMoveIntent?: {};
  hasAutoTraversePath?: HasAutoTraversePath;

  // ── Shared by both (S7 + S8) ──────────────────────────────────
  tracksCombat?:    TracksCombat;
}

/**
 * A miniplex entity carrying per-player combat state and the core typed
 * snapshot slices. Optional archetype slices (`usesCadence`, `usesEnergy`, ...)
 * are attached only when the player has that archetype.
 */
export type PlayerEntity = With<
  ServerEntity,
  | "tracksCombat"
  | "isPlayer"
  | "hasPosition"
  | "hasHealth"
  | "dealsDamage"
  | "performsAttack"
  | "mitigatesDamage"
  | "hasStatus"
  | "usesAutocombat"
  | "tracksProgression"
  | "holdsInventory"
  | "usesSkills"
  | "showsSacred"
>;

export function isPlayerEntity(e: ServerEntity): e is PlayerEntity {
  return "isPlayer" in e;
}

/**
 * A miniplex entity carrying monster AI, combat state, and the full set of
 * typed monster snapshot slices.
 */
export type MonsterEntity = With<
  ServerEntity,
  | "controlsMonster"
  | "tracksCombat"
  | "isMonster"
  | "hasPosition"
  | "hasHealth"
  | "dealsDamage"
  | "performsAttack"
  | "mitigatesDamage"
  | "hasAwareness"
  | "hasStatus"
>;

export function isMonsterEntity(e: ServerEntity): e is MonsterEntity {
  return "isMonster" in e;
}

export function entityNetworkId(entity: ServerEntity): EntityId | null {
  return entity.isPlayer?.id ?? entity.isMonster?.id ?? null;
}

export function entityNetworkKind(entity: ServerEntity): 'player' | 'monster' | null {
  if (entity.isPlayer) return 'player';
  if (entity.isMonster) return 'monster';
  return null;
}
