import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

// ── Event names ───────────────────────────────────────────────────────────────

export type CombatEventName =
  | 'beforeAttack'   // before cooldown-gated attack fires; set ctx.cancelled=true to abort
  | 'onAttack'       // attack confirmed, damage not yet calculated
  | 'onHit'          // damage calculated (attacker perspective); can modify ctx.damage
  | 'onDamageTaken'  // damage calculated (defender perspective); can modify ctx.damage
  | 'afterHit'       // damage applied, entity still alive (or dead — check ctx.defender.hasHealth.hp)
  | 'onKill';        // defender hp ≤ 0, before removal/respawn

// ── Combat context ────────────────────────────────────────────────────────────

export type CombatParticipant =
  | PlayerEntity
  | MonsterEntity;

type ParticipantKind = 'player' | 'monster';

type ParticipantFor<Kind extends ParticipantKind> =
  Kind extends 'player' ? PlayerEntity : MonsterEntity;

interface CombatContextBase<
  AttackerKind extends ParticipantKind,
  DefenderKind extends ParticipantKind,
> {
  attacker: ParticipantFor<AttackerKind>;
  attackerType: AttackerKind;
  defender: ParticipantFor<DefenderKind>;
  defenderType: DefenderKind;
  /** Computed raw damage; hooks may increase or clamp it. */
  damage: number;
  /**
   * Multiplier applied to the defender's plating before the damage formula.
   * Default 1.0 (full plating). Set below 1.0 to reduce plating effectiveness
   * (e.g. reload archetype uses 0.5 to compensate for its halved per-shot damage).
   */
  platingMult: number;
  /**
   * Fraction of the defender's damage-reduction to ignore (0–1). Default 0 (full
   * DR). The DR side mirror of `platingMult`: effective DR = DR × (1 − drPierce).
   * Set in a beforeAttack handler (e.g. cooldown Rupture pierces DR on execution
   * and during its window).
   */
  drPierce: number;
  /** Set to true in a beforeAttack handler to skip the entire attack. */
  cancelled: boolean;
  /**
   * Arbitrary key-value store for hooks to communicate side-band data
   * (e.g. { isCrit: true }, { afflictionApplied: 'burn' }) without
   * extending the interface for every future mechanic.
   */
  metadata: Record<string, unknown>;
  /** Typed Summoner/Battle-Bond contribution for a physical formation hit. */
  formation?: FormationAttackContribution;
}

export interface FormationAttackContribution {
  ownerId: string;
  physicalEntityId: string;
  slotId: string;
  directDamageWeight: number;
  onHitMagnitudeWeight: number;
  /** Formation-wide multiplier for secondary weapon effects; never direct Attack. */
  secondaryEffectMult: number;
  procWeight: number;
  /**
   * This body's share of ONE logical formation attack, normalized over the FULL
   * authored formation — see `basicAttackTempoContribution`.
   *
   * Deliberately NOT `procWeight`. That number carries the formation's damage /
   * secondary-effect coefficients (`secondaryEffectMult`, relic potency), which
   * is right for "how much on-hit magnitude does this body deliver" and wrong
   * for "how much of an attack did the formation just take". Tempo equalizes
   * logical CADENCE, so it reads the raw slot weights and nothing else.
   *
   * Normalized over every AUTHORED slot rather than over the living ones, so a
   * formation fighting three bodies down pays three bodies less Tempo. A dead
   * summon's share is simply never delivered; the survivors are never scaled up
   * to cover it.
   */
  tempoWeight: number;
  targetId: string;
  cycleSerial: number;
  cycleCompleted: boolean;
  side: 'summon' | 'conduit';
}

/**
 * Mutable bag that flows through every hook in a single attack event.
 * Handlers read and write this object; the combat system applies the
 * final values after all hooks for a phase have run.
 */
export type CombatContext =
  | CombatContextBase<'player', 'player'>
  | CombatContextBase<'player', 'monster'>
  | CombatContextBase<'monster', 'player'>
  | CombatContextBase<'monster', 'monster'>;

// ── Handler type ──────────────────────────────────────────────────────────────

export type CombatEventHandler = (ctx: CombatContext, world: World) => void;

/**
 * Tag this exchange with a one-shot client FX id.
 *
 * `metadata.clientEffects` rides the outgoing `player-hit` event as `ev.effects`
 * and is dispatched by the effects loop in the client's combatFx. Handlers used
 * to append to it by hand, and the
 * `Array.isArray(existing) ? [...existing, id] : [id]` incantation had been
 * copy-pasted into a dozen files — one of which is why a tag can silently
 * overwrite an earlier one if written as a bare assignment.
 */
export function pushClientEffect(ctx: CombatContext, id: string): void {
  const existing = ctx.metadata['clientEffects'];
  ctx.metadata['clientEffects'] = Array.isArray(existing) ? [...existing, id] : [id];
}

// ── Registry (module-level singleton, server-only) ────────────────────────────

const _listeners = new Map<CombatEventName, CombatEventHandler[]>();
const diagnosticLabels = new WeakMap<CombatEventHandler, string>();
let registrationLabel = 'other';
/** Diagnostic attribution only; registration and execution order are unchanged. */
export function withCombatRegistrationLabel(label: string, register: () => void): void {
  const previous = registrationLabel;
  registrationLabel = label;
  try { register(); } finally { registrationLabel = previous; }
}
export interface CombatMeasurement {
  event: CombatEventName; layer: string; before: number; after: number;
  gross: number | null; playerId: string; evaded: boolean;
}
const observers = new WeakMap<World, (measurement: CombatMeasurement) => void>();
/** Opt-in, per-World diagnostics. No observer is installed by the live server. */
export function setCombatMeasurementObserver(world: World, observer?: (measurement: CombatMeasurement) => void): void {
  if (observer) observers.set(world, observer); else observers.delete(world);
}
/** Values come from the authoritative primary-hit calculation, before callbacks. */
export function recordBaseDefenseMeasurement(ctx: CombatContext, world: World, gross: number, postPlating: number, postDr: number): void {
  const observer=observers.get(world);
  if(!observer || ctx.defenderType!=='player')return;
  for(const [layer,before,after] of [['plating',gross,postPlating],['baseDR',postPlating,postDr],['rounding/minimum-hit',postDr,ctx.damage]] as const){
    observer({event:'onDamageTaken',layer,before,after,gross,playerId:ctx.defender.isPlayer.id,evaded:ctx.metadata.evaded===true});
  }
}

/**
 * Subscribe a handler to a combat event.
 * Call from any server module; handlers persist for the process lifetime.
 */
export function registerCombatListener(
  event: CombatEventName,
  handler: CombatEventHandler,
): void {
  diagnosticLabels.set(handler, registrationLabel);
  const existing = _listeners.get(event);
  if (existing) {
    existing.push(handler);
  } else {
    _listeners.set(event, [handler]);
  }
}

/**
 * Remove a previously registered handler.
 * Useful for item/buff teardown when a mechanic expires.
 */
export function unregisterCombatListener(
  event: CombatEventName,
  handler: CombatEventHandler,
): void {
  const existing = _listeners.get(event);
  if (!existing) return;
  const idx = existing.indexOf(handler);
  if (idx !== -1) existing.splice(idx, 1);
}

// ── Emitter ───────────────────────────────────────────────────────────────────

/** Run all registered handlers for an event in registration order. */
export function emitCombatEvent(
  event: CombatEventName,
  ctx: CombatContext,
  world: World,
): void {
  const handlers = _listeners.get(event);
  if (!handlers) return;
  const observer = ctx.defenderType === 'player' && (event === 'onHit' || event === 'onDamageTaken')
    ? observers.get(world) : undefined;
  for (const handler of handlers) {
    const before = observer ? ctx.damage : 0;
    handler(ctx, world);
    if (observer && ctx.defenderType === 'player' && (event === 'onHit' || event === 'onDamageTaken')) {
      observer({event, layer: diagnosticLabels.get(handler) ?? 'other', before, after: ctx.damage,
        gross: typeof ctx.metadata.incomingGross === 'number' ? ctx.metadata.incomingGross : null,
        playerId: ctx.defender.isPlayer.id, evaded: ctx.metadata.evaded === true});
    }
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/** Build a fresh context for one attack. Damage starts at 0; the combat
 *  system sets it between onAttack and onHit. */
export function makeCombatContext(
  attacker: CombatParticipant,
  attackerType: ParticipantKind,
  defender: CombatParticipant,
  defenderType: ParticipantKind,
): CombatContext {
  return {
    attacker,
    attackerType,
    defender,
    defenderType,
    damage: 0,
    platingMult: 1.0,
    drPierce: 0,
    cancelled: false,
    metadata: {},
  } as CombatContext;
}
