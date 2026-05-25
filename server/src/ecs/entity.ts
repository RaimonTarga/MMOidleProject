import type { MonsterAI } from '../world/World';
import type { CombatState } from '../systems/combatState';
import type { KnockbackComponent } from '../systems/knockback';
import type { BossRuntimeState } from '../systems/bossScripts';
import type { CadenceComponent } from './components/cadence';
import type { EnergyComponent } from './components/energy';
import type { DotComponent } from './components/dot';
import type { CooldownComponent } from './components/cooldown';
import type { ReloadComponent } from './components/reload';
import type {
  AppliesDots,
  ChillsTarget,
  DealsDamage,
  EvadesHits,
  HasAwareness,
  HasHealth,
  HasPosition,
  HasStatus,
  HoldsInventory,
  IsMonster,
  IsMoving,
  IsPlayer,
  MitigatesDamage,
  PerformsAttack,
  ShowsSacred,
  TracksProgression,
  UsesAutocombat,
  UsesCadence,
  UsesCooldown,
  UsesEnergy,
  UsesReload,
  UsesSkills,
} from './components/snapshotSlices';

export type EntityId = string;

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
  isMoving?:        IsMoving;
  hasHealth?:       HasHealth;
  dealsDamage?:     DealsDamage;
  performsAttack?:  PerformsAttack;
  mitigatesDamage?: MitigatesDamage;
  hasStatus?:       HasStatus;

  // Player-only slices
  isPlayer?:           IsPlayer;
  evadesHits?:         EvadesHits;
  usesAutocombat?:     UsesAutocombat;
  tracksProgression?:  TracksProgression;
  holdsInventory?:     HoldsInventory;
  usesSkills?:         UsesSkills;
  showsSacred?:        ShowsSacred;
  usesCadence?:        UsesCadence;
  usesEnergy?:         UsesEnergy;
  appliesDots?:        AppliesDots;
  chillsTarget?:       ChillsTarget;
  usesCooldown?:       UsesCooldown;
  usesReload?:         UsesReload;

  // Monster-only slices
  isMonster?:    IsMonster;
  hasAwareness?: HasAwareness;

  // ── Monster (S7) ──────────────────────────────────────────────
  monsterAi?:       MonsterAI;
  knockback?:       KnockbackComponent;
  bossState?:       BossRuntimeState;

  // ── Player (S8) ───────────────────────────────────────────────
  combatAt?:        number;

  // ── Shared by both (S7 + S8) ──────────────────────────────────
  combatState?:     CombatState;

  // ── Per-archetype components (S9 → S13) ───────────────────────
  cadence?:  CadenceComponent;
  energy?:   EnergyComponent;
  dot?:      DotComponent;
  cooldown?: CooldownComponent;
  reload?:   ReloadComponent;
}
