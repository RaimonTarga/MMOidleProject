/**
 * `mechanic-fired` — the one class-agnostic "your mechanic just paid out" seam
 * (progression rework Phase 1c, design §6).
 *
 * WHY IT EXISTS. Every class root has a moment its whole loop builds toward: the
 * cadence finisher, the cooldown execution, a full DoT stack, the reload landing,
 * the energy burst, a summon command. A lineage card that wants to hang a payoff
 * on "when your mechanic fires" must not have to know which of the six it is
 * looking at — otherwise a card is six cards, and the closed vocabulary (design
 * §6) stops being closed.
 *
 * So each root calls {@link emitMechanicFired} at its own moment, ONCE, and
 * everything downstream sees one uniform event. The call sites are:
 *
 *   cadence    the finisher's empowered flag is consumed  (cadencePrototype.ts)
 *   cooldown   the execution's empowered flag is consumed (cooldownPrototype.ts)
 *   dot        a target reaches max stacks                (dotPrototype.ts)
 *   reload     a reload completes                         (reloadLifecycle.ts)
 *   energy     the burst fires                            (energyPrototype.ts)
 *   summoner   a command intent is applied                (summoner/command.ts)
 *
 * This module DISPATCHES and nothing else: it owns no state of its own, applies
 * no effect, and reads no card. `lineageCards.ts` is currently its only listener.
 *
 * ONE PER HIT. Where an emission rides an attack, the `ctx` is passed in and used
 * as the latch: the four roots whose moment is an on-hit moment (cadence,
 * cooldown, dot, energy) can register in any order, and an exchange that somehow
 * satisfied two of them still emits exactly once. Emissions with no attack behind
 * them (reload, a summon command) pass no `ctx` and are not latched, because
 * their caller already fires once per event.
 */
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import type { CombatContext } from './combatPipeline';

/** The exchange the mechanic fired on, when there was one. */
export type MechanicFiredHandler = (
  world: World,
  player: PlayerEntity,
  ctx?: CombatContext,
) => void;

const LATCH = 'mechanicFired';

const _handlers: MechanicFiredHandler[] = [];

/**
 * Subscribe to every root's mechanic moment. Called from a system's own `init`,
 * which `initCombatSystems()` runs exactly once per process, so the live server
 * and the bench see the same listener list.
 */
export function registerMechanicFiredListener(handler: MechanicFiredHandler): void {
  _handlers.push(handler);
}

/**
 * Announce that this player's root mechanic fired.
 *
 * Pass the `ctx` whenever the moment rides an attack — it is both the latch that
 * keeps one exchange to one emission and the record a payoff needs to read the
 * hit it is scaling off.
 */
export function emitMechanicFired(
  world: World,
  player: PlayerEntity,
  ctx?: CombatContext,
): void {
  if (_handlers.length === 0) return;
  if (ctx) {
    if (ctx.metadata[LATCH] === true) return;
    ctx.metadata[LATCH] = true;
  }
  for (const handler of _handlers) handler(world, player, ctx);
}

/** Whether this exchange has already announced a mechanic moment. */
export function mechanicAlreadyFired(ctx: CombatContext): boolean {
  return ctx.metadata[LATCH] === true;
}

/** Test/bench escape hatch — never call from game code. */
export function _resetMechanicFiredListeners(): void {
  _handlers.length = 0;
}
