import type {
  AppliesDots,
  CannotAttack,
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
  HasEnvironmentalDot,
  HasNodeFeatureEffect,
  HasAshbrandBurn,
  HasVoidCorruption,
  HasAlignment,
  HasAttackTarget,
  HasAutoIntent,
  HasEmote,
  IsDead,
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
  IsEncounterAdd,
  IsNodeFeatureSpawn,
  IsInvulnerable,
  IsMinion,
  IsMonster,
  IsMoving,
  IsPlayer,
  IsRooted,
  IsUltimateEngaged,
  MitigatesDamage,
  PerformsAttack,
  ScriptsBoss,
  ScriptsUltimate,
  ShowsSacred,
  SummonsMinions,
  TracksCombat,
  TracksProgression,
  UsesAutocombat,
  UsesCadence,
  UsesCooldown,
  UsesEnergy,
  UsesReload,
  UsesSkills,
} from "@mmo-idle/shared";
import type { FeatureTarget, Vec2 } from "@mmo-idle/shared";
import type { With } from "miniplex";
import type { ControlsMinion } from "../systems/classes/archetypes/summoner/controlsMinion";
import type { HasSummonerCommand } from "../systems/classes/archetypes/summoner/command";

export type EntityId = string;

/** Server-only marker: player is walking a planned auto-traverse path. */
export interface HasAutoTraversePath {
  targetNodeId: string;
  remainingPath: string[];
}

/** Server-only marker: auto-combat has temporarily yielded to survival movement. */
export interface IsFleeing {
  phase: "out" | "recover" | "return";
  returnNodeId: string;
}

/** Server-only: A* waypoint queue toward {@link goal}. */
export interface HasMovePath {
  goal: Vec2;
  waypoints: Vec2[];
  mover: FeatureTarget;
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
  hasPosition?: HasPosition;
  hasHitbox?: HasHitbox;
  isMoving?: IsMoving;
  isRooted?: IsRooted;
  hasAttackTarget?: HasAttackTarget;
  cannotAttack?: CannotAttack;
  hasHealth?: HasHealth;
  dealsDamage?: DealsDamage;
  performsAttack?: PerformsAttack;
  mitigatesDamage?: MitigatesDamage;
  hasStatus?: HasStatus;

  // Player-only slices
  isPlayer?: IsPlayer;
  evadesHits?: EvadesHits;
  holdsShields?: HoldsShields;
  usesAutocombat?: UsesAutocombat;
  hasAutoIntent?: HasAutoIntent;
  hasEmote?: HasEmote;
  tracksProgression?: TracksProgression;
  holdsInventory?: HoldsInventory;
  usesSkills?: UsesSkills;
  showsSacred?: ShowsSacred;
  summonsMinions?: SummonsMinions;
  inParty?: InParty;
  usesCadence?: UsesCadence;
  usesEnergy?: UsesEnergy;
  appliesDots?: AppliesDots;
  chillsTarget?: ChillsTarget;
  usesCooldown?: UsesCooldown;
  usesReload?: UsesReload;
  isChanneling?: IsChanneling;
  hasOverdrive?: HasOverdrive;
  hasAlignment?: HasAlignment;
  inAcChargePhase?: InAcChargePhase;
  inAcDischarge?: InAcDischarge;
  hasEmpoweredAttack?: HasEmpoweredAttack;
  hasEnvironmentalDot?: HasEnvironmentalDot;
  hasNodeFeatureEffect?: HasNodeFeatureEffect;
  isDead?: IsDead;

  // Monster-only slices
  isMonster?: IsMonster;
  hasAwareness?: HasAwareness;
  hasAggroTarget?: HasAggroTarget;

  // Minion-only slices (summoner archetype)
  isMinion?: IsMinion;
  controlsMinion?: ControlsMinion;

  // ── Monster (S7) ──────────────────────────────────────────────
  controlsMonster?: ControlsMonster;
  hasKnockback?: HasKnockback;
  hasDetonation?: HasDetonation;
  hasHemorrhage?: HasHemorrhage;
  hasDot?: HasDot;
  hasConflagration?: HasConflagration;
  hasChill?: HasChill;
  hasFrozen?: HasFrozen;
  hasSmolder?: HasSmolder;
  hasEntropy?: HasEntropy;
  hasAshbrandBurn?: HasAshbrandBurn;
  hasVoidCorruption?: HasVoidCorruption;
  scriptsBoss?: ScriptsBoss;
  scriptsUltimate?: ScriptsUltimate;
  isBossEngaged?: IsBossEngaged;
  isEncounterAdd?: IsEncounterAdd;
  isNodeFeatureSpawn?: IsNodeFeatureSpawn;
  isInvulnerable?: IsInvulnerable;
  isUltimateEngaged?: IsUltimateEngaged;

  // ── Player (S8) ───────────────────────────────────────────────
  tracksEngagement?: number;
  hasManualMoveIntent?: {};
  hasSummonerCommand?: HasSummonerCommand;
  hasAutoTraversePath?: HasAutoTraversePath;
  hasMovePath?: HasMovePath;
  isFleeing?: IsFleeing;

  // ── Shared by both (S7 + S8) ──────────────────────────────────
  tracksCombat?: TracksCombat;
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

/**
 * A miniplex entity carrying a summoner minion's identity, AI, and combat
 * state. `isMoving` is intentionally NOT required — minions stop at their
 * follow offset / leash boundary, attaching/detaching `isMoving` as needed.
 */
export type MinionEntity = With<
  ServerEntity,
  | "isMinion"
  | "controlsMinion"
  | "hasPosition"
  | "hasHitbox"
  | "hasHealth"
  | "dealsDamage"
  | "performsAttack"
  | "mitigatesDamage"
  | "tracksCombat"
  | "hasStatus"
>;

export function isMinionEntity(e: ServerEntity): e is MinionEntity {
  return "isMinion" in e;
}

export function entityNetworkId(entity: ServerEntity): EntityId | null {
  return (
    entity.isPlayer?.id ?? entity.isMonster?.id ?? entity.isMinion?.id ?? null
  );
}

export function entityNetworkKind(
  entity: ServerEntity,
): "player" | "monster" | "minion" | null {
  if (entity.isPlayer) return "player";
  if (entity.isMonster) return "monster";
  if (entity.isMinion) return "minion";
  return null;
}
