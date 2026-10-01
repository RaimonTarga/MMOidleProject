/**
 * The keystone registry — the one place that answers "is this rule on?".
 *
 * A keystone is the single bespoke row in the tree (design §4): every other card
 * is data over the closed vocabulary, and a keystone changes a RULE instead of
 * adding an effect. So each of the eight is a small named module in this folder,
 * and they all need the same three services from here:
 *
 *  1. **Is it live?** {@link keystoneActive} — true when the player's active
 *     `keystone` row card of that lane is owned-and-active in ANY lineage. The
 *     amended §4 shares one keystone per packet across every slot, so a Tempo
 *     keystone bought on boots arms Chain for the weapon's echo just the same.
 *     The answer comes off the resolved-card cache `refreshLineageRuntime` fills
 *     at recalc, so it costs one array scan and never a database read.
 *
 *  2. **How big?** {@link keystoneShare} — the card's own resolved magnitude,
 *     straight off the magnitude table at `ROW_SCALAR.keystone`. Two of the eight
 *     pay out a share of a hit; the other six are timings and refusals whose
 *     numbers live in `LINEAGE_UNITS`.
 *
 *  3. **What does the player see?** {@link pushKeystoneFx} — one `card-fx` per
 *     application with the lane's `<lane>.keystone` key, which is the same
 *     contract every payoff row already obeys (design §8, one visible thing per
 *     application, never per tick).
 *
 * WHY A REGISTRY AND NOT EIGHT IMPORTS. The modules hook heterogeneous seams —
 * three register combat listeners, three are predicates the defense tick calls,
 * one pre-pass runs before the status decay, one is consumed inside the DoT stack
 * applier. {@link registerKeystones} is the single call `registerLineageCards`
 * makes so the live server and the bench see an identical set, and
 * {@link KEYSTONE_MODULES} is what an authoring test asserts against to prove
 * every authored keystone card has a rule behind it.
 */
import {
  KEYSTONE_DEFINITIONS,
  PACKET_IDS,
  getLineageRuntime,
  keystoneDefinition,
  payoffValue,
  triggerNForLane,
  type KeystoneDefinition,
  type KeystoneId,
  type PacketId,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

/**
 * One keystone's runtime. `register` is optional because only some rules are
 * expressed as combat-pipeline listeners; the rest are predicates their own seam
 * asks, and those modules export the predicate instead.
 */
export interface KeystoneModule {
  id: KeystoneId;
  lane: PacketId;
  /** Combat-pipeline listeners the rule needs, if any. Called once per process. */
  register?: () => void;
  /** One line naming the seam the rule changes — for the report and the reader. */
  seam: string;
}

const _modules = new Map<PacketId, KeystoneModule>();

/**
 * Declare a keystone's runtime. Called at module scope by each of the eight, so
 * importing this folder's `index.ts` is what populates the registry.
 */
export function defineKeystone(module: KeystoneModule): KeystoneModule {
  const definition = keystoneDefinition(module.lane);
  if (!definition) throw new Error(`keystone: lane '${module.lane}' has no definition`);
  if (definition.id !== module.id) {
    throw new Error(
      `keystone '${module.id}': lane '${module.lane}' is '${definition.id}' in KEYSTONE_DEFINITIONS`,
    );
  }
  _modules.set(module.lane, module);
  return module;
}

/** Every keystone that has a runtime, keyed by its lane. */
export const KEYSTONE_MODULES: ReadonlyMap<PacketId, KeystoneModule> = _modules;

/** The keystone runtime of a lane, or undefined when the lane has none. */
export function keystoneModule(lane: PacketId): KeystoneModule | undefined {
  return _modules.get(lane);
}

/**
 * Register every keystone's listeners, exactly once.
 *
 * Called from `registerLineageCards()` — which `initCombatSystems()` runs once per
 * process — so a keystone can never be live on the server and absent from the
 * bench. Idempotent, because `registerLineageCards` is the only caller and the
 * bootstrap already guards itself, but asserted here too: a double registration
 * would double every chained echo.
 */
let _registered = false;
export function registerKeystones(): void {
  if (_registered) return;
  _registered = true;
  for (const lane of PACKET_IDS) _modules.get(lane)?.register?.();
}

/** Test/bench escape hatch — never call from game code. */
export function _resetKeystoneRegistration(): void {
  _registered = false;
}

// ── Is the rule on? ──────────────────────────────────────────────────────────

/**
 * The player's active keystone card of `lane`, from any lineage.
 *
 * The resolved-card cache holds only the ACTIVE card of each row of each lineage
 * the player has opened (`resolveLineageCards`), and only for lineages whose worn
 * form is the equipped item — so a card appearing here is owned, active and worn
 * by construction, which is exactly the condition design §4 states.
 *
 * Highest tier wins when two slots both crown the lane. They state the same rule,
 * so the only thing to choose between is the share, and taking the better one
 * means buying the second keystone is never a downgrade.
 */
export function activeKeystoneCard(
  player: PlayerEntity,
  lane: PacketId,
): ResolvedLineageCard | undefined {
  const runtime = getLineageRuntime(player.tracksCombat);
  if (!runtime) return undefined;
  let best: ResolvedLineageCard | undefined;
  for (const resolved of runtime.cards) {
    const card = resolved.card;
    if (card.row !== 'keystone' || card.lane !== lane) continue;
    if (!best || card.tier > best.card.tier) best = resolved;
  }
  return best;
}

/** Whether `lane`'s keystone rule is live for this player. */
export function keystoneActive(player: PlayerEntity, lane: PacketId): boolean {
  return activeKeystoneCard(player, lane) !== undefined;
}

/**
 * The share of a hit `lane`'s keystone pays, or 0 when the rule is not live.
 *
 * The card's OWN resolved magnitude, so the tier column and the defensive
 * frame-face bias have already been applied by `resolveLineageCard` — the runtime
 * resolves nothing and owns no number. The fallback resolves the lane's canonical
 * keystone payoff from the same table, for the case where a card was authored
 * without the payoff kind `KEYSTONE_DEFINITIONS` names.
 */
export function keystoneShare(player: PlayerEntity, lane: PacketId): number {
  const card = activeKeystoneCard(player, lane);
  if (!card) return 0;
  const definition = KEYSTONE_DEFINITIONS.get(lane);
  if (!definition?.payoff) return 0;
  if (card.payoff && card.payoff.kind === definition.payoff) return card.payoff.magnitude;
  return payoffValue({
    payoff: definition.payoff,
    tier: card.card.tier,
    row: 'keystone',
    lane,
    trigger: { kind: 'hit-nth', n: triggerNForLane(lane) },
  }).magnitude;
}

// ── One visible thing per application ────────────────────────────────────────

export interface KeystoneFxOptions {
  /** The monster the rule acted on, when it acted on one. */
  target?: MonsterEntity;
  /** A count the client draws bigger — a chain's link index, a ladder's rung. */
  stacks?: number;
}

/**
 * Push the one `card-fx` an application of `lane`'s keystone earned.
 *
 * Same event, same contract and same client switch as every payoff row (design
 * §8): one per application, never per tick, never for a refusal. The key is the
 * lane's `<lane>.keystone`, and the client draws the lane's own grammar larger.
 */
export function pushKeystoneFx(
  world: World,
  player: PlayerEntity,
  lane: PacketId,
  options: KeystoneFxOptions = {},
): void {
  const definition = KEYSTONE_DEFINITIONS.get(lane);
  if (!definition) return;
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'card-fx',
    playerId: player.isPlayer.id,
    fx: definition.fx,
    pos: { ...player.hasPosition.current },
    ...(options.target
      ? {
        targetId: options.target.isMonster.id,
        targetPos: { ...options.target.hasPosition.current },
      }
      : {}),
    ...(options.stacks !== undefined ? { stacks: options.stacks } : {}),
  });
}

export type { KeystoneDefinition };
