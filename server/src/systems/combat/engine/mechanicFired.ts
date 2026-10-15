/**
 * `mechanic-fired` — the one class-agnostic "your mechanic just paid out" seam
 * (progression rework Phase 1c, design §6).
 *
 * WHY IT EXISTS. Every class root has a moment its whole loop builds toward: the
 * cadence finisher, the cooldown execution, the reload landing,
 * the energy burst, a completed formation cycle. A payoff hung on "when your
 * mechanic fires" must not have to know which root it is looking at —
 * otherwise one payoff is six.
 *
 * The legacy Apprentice full-stack emitter was removed with its conversion runtime (AP7).
 * Payoff rules read their own target moments. Each remaining root calls {@link emitMechanicFired} at its own moment, ONCE, and
 * everything downstream sees one uniform event. The call sites are:
 *
 *   cadence    the finisher's empowered flag is consumed  (cadencePrototype.ts)
 *   cooldown   the execution's empowered flag is consumed (cooldownPrototype.ts)
 *   reload     a reload completes                         (reloadLifecycle.ts)
 *   energy     the burst fires                            (energyPrototype.ts)
 *   summoner   a formation cycle completes                (summoner/frameLoop.ts)
 *
 * The summoner's moment MOVED in Phase 3. 1c hung it on `applySummonerCommand`, but
 * a command is a click: it never fires unattended, so a card keyed to it would never
 * pay out for an idle player, and idle play is the game. The formation cycle — every
 * living summon having hit the same target since the last fire — is the root's loop
 * actually closing, and it closes whether or not anybody is at the keyboard.
 *
 * This module DISPATCHES and nothing else: it owns no state of its own, applies
 * no effect, and reads no card. It has no listener since the lineage cards were
 * removed (class-first rework D1); the class systems subscribe through
 * {@link registerMechanicFiredListener}.
 *
 * ONE PER HIT. Where an emission rides an attack, the `ctx` is passed in and used
 * as the latch: the roots whose moment is an on-hit moment (cadence, cooldown,
 * energy, summoner) can register in any order, and an exchange that somehow
 * satisfied two of them still emits exactly once. Reload passes no `ctx` — a reload
 * completes on a timer, so there is no exchange to latch — and is not latched,
 * because its caller already fires once per event.
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
/** Set by `applyMechanicProxy` (`empoweredAttacks.ts`); read here without importing it. */
const PROXY = 'mechanicProxy';

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
 *
 * A PROXIED exchange never emits (design §24.2, course-correction rule 3). A
 * `mechanic-proxy` payoff makes a hit count as the mechanic — the multiplier and
 * `mechanicConsumed` — but announcing `mechanic-fired` from it would fire every
 * mechanic-fired card again off a card's own payload, which is the recursion the
 * rule forbids. Refused here, centrally, rather than trusted to every emitter.
 */
export function emitMechanicFired(
  world: World,
  player: PlayerEntity,
  ctx?: CombatContext,
): void {
  if (_handlers.length === 0) return;
  if (ctx) {
    if (ctx.metadata[PROXY] === true) return;
    if (ctx.metadata[LATCH] === true) return;
    ctx.metadata[LATCH] = true;
  }
  for (const handler of _handlers) handler(world, player, ctx);
}

/**
 * Whether this exchange has already announced a mechanic moment — or already
 * COUNTS as one through a `mechanic-proxy` payoff. Either way the moment has
 * happened, so Always First and Signature draw nothing on it.
 */
export function mechanicAlreadyFired(ctx: CombatContext): boolean {
  return ctx.metadata[LATCH] === true || ctx.metadata[PROXY] === true;
}

/** Test/bench escape hatch — never call from game code. */
export function _resetMechanicFiredListeners(): void {
  _handlers.length = 0;
}
