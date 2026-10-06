/**
 * The ABILITY keystone registry — the keystone row of the ability node tree
 * (design §22.1, §22.4, §22.11), on the same pattern as the lane keystones'
 * `../registry.ts`.
 *
 * A keystone verb is bespoke: one named module per verb in this folder, declared
 * with {@link defineAbilityKeystone} at module scope, collected in
 * {@link ABILITY_KEYSTONE_MODULES}. The modules need the same three services the
 * lane keystones do, from here:
 *
 *  1. **Is it live?** {@link abilityKeystoneLive} — true when the player's
 *     active keystone option on that ability is this verb, owned and live. Read
 *     off the cache `refreshAbilityNodeRuntime` fills at recalc, so it costs one
 *     lookup and never a database read.
 *  2. **How big?** {@link abilityKeystoneShareOf} — the verb's share of a hit,
 *     resolved at recalc from the magnitude table at `ROW_SCALAR.keystone`
 *     (`abilityKeystoneShare` in shared). The module owns no number.
 *  3. **What does the player see?** {@link pushAbilityKeystoneFx} — one
 *     `card-fx` per application, with the verb's own (existing) fx key.
 *
 * TWO SEAMS. A module either reacts to its ability RESOLVING — `onResolved`,
 * called once per resolution from `combat/techniqueResolved.ts` (the one place
 * every Technique shape's resolution passes through, so Reload's clip, a Conduit's
 * formation and a cast all reach it exactly once) — or registers combat listeners
 * of its own (`register`), or both. {@link registerAbilityKeystones} is called
 * from the lane registry's `registerKeystones()`, which `registerLineageCards()`
 * calls from `initCombatSystems()`: the live server and every bench harness see
 * one set.
 *
 * WHAT A KEYSTONE NEVER TOUCHES. The weapon verb's hit counter (`hit-nth`, which a
 * Conduit's summon hits advance by one over the live summons since §26.5) and its
 * rhythm ring: every keystone area hit resolves through `applyPlayerAoe`, which
 * emits no attack event, so it is neither a hit the counter sees nor an
 * attack-equivalent Sweep's Tempo counts.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  getAbilityKeystoneRuntime,
  type AbilityDef,
  type AbilityKeystoneDefinition,
  type AbilityKeystoneDelivery,
  type Vec2,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import type { CombatContext } from '../../engine/combatPipeline';

/** Where a Technique resolution happened — the same site `onTechniqueResolved` is handed. */
export interface TechniqueResolutionSite {
  ctx?: CombatContext;
  target?: MonsterEntity;
}

/** One ability keystone verb's runtime. */
export interface AbilityKeystoneModule {
  /** The verb's id, as `ABILITY_KEYSTONE_DEFINITIONS` names it. */
  id: string;
  /** One line naming the seam the rule changes — for the report and the reader. */
  seam: string;
  /** Combat-pipeline listeners the rule needs, if any. Called once per process. */
  register?: () => void;
  /** The ability resolved with this verb live. Called once per resolution. */
  onResolved?: (
    world: World,
    player: PlayerEntity,
    ability: AbilityDef,
    site: TechniqueResolutionSite,
  ) => void;
  /**
   * The ability just wrote its afflictions onto `victim` (Contagion's spread, at
   * the seam where the copy lands) with this verb live. Called once per victim.
   */
  onInfected?: (
    world: World,
    player: PlayerEntity,
    ability: AbilityDef,
    victim: MonsterEntity,
  ) => void;
}

const _modules = new Map<string, AbilityKeystoneModule>();

/**
 * Declare a verb's runtime. Called at module scope by each module, so importing
 * this folder's `index.ts` is what populates the registry. Refuses a module whose
 * verb is not authored, or is authored but not marked live — the two must move
 * together, or the panel would sell a silhouette or hide a working verb.
 */
export function defineAbilityKeystone(module: AbilityKeystoneModule): AbilityKeystoneModule {
  const definition = ABILITY_KEYSTONE_DEFINITIONS.get(module.id);
  if (!definition) throw new Error(`ability keystone: '${module.id}' has no definition`);
  if (!definition.live) {
    throw new Error(`ability keystone: '${module.id}' has a module but is not marked live in keystones.ts`);
  }
  _modules.set(module.id, module);
  return module;
}

/** Every ability keystone verb that has a runtime, keyed by its id. */
export const ABILITY_KEYSTONE_MODULES: ReadonlyMap<string, AbilityKeystoneModule> = _modules;

let _registered = false;

/** Register every verb's listeners, exactly once. Called from `registerKeystones()`. */
export function registerAbilityKeystones(): void {
  if (_registered) return;
  _registered = true;
  for (const module of _modules.values()) module.register?.();
}

// ── Is the rule on? ──────────────────────────────────────────────────────────

/** Whether `keystoneId` is this player's live keystone verb on its ability. */
export function abilityKeystoneLive(player: PlayerEntity, keystoneId: string): boolean {
  const definition = ABILITY_KEYSTONE_DEFINITIONS.get(keystoneId);
  if (!definition) return false;
  return getAbilityKeystoneRuntime(player.tracksCombat)?.[definition.abilityId]?.keystoneId === keystoneId;
}

/**
 * The share of a hit `keystoneId` pays, or 0 when it is not live or pays none.
 * Resolved at recalc off the magnitude table — the runtime owns no number.
 */
export function abilityKeystoneShareOf(player: PlayerEntity, keystoneId: string): number {
  const definition = ABILITY_KEYSTONE_DEFINITIONS.get(keystoneId);
  if (!definition) return 0;
  const cache = getAbilityKeystoneRuntime(player.tracksCombat)?.[definition.abilityId];
  return cache?.keystoneId === keystoneId ? cache.share ?? 0 : 0;
}

/**
 * A Technique resolved: run its live keystone verb, if it has one. Called from
 * `onTechniqueResolved` — the one moment a verb hung off its ability's resolution
 * has.
 */
export function onAbilityKeystoneResolved(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  site: TechniqueResolutionSite,
): void {
  const keystoneId = getAbilityKeystoneRuntime(player.tracksCombat)?.[ability.id]?.keystoneId;
  if (!keystoneId) return;
  _modules.get(keystoneId)?.onResolved?.(world, player, ability, site);
}

/**
 * An ability's spread just landed its copy on `victim`: run the live verb that
 * cares (design §22.4's Outbreak tags what Contagion infected). Called from the
 * seam where the spread WRITES — `resolveContagion`'s victim loop — rather than
 * from the cast lifecycle, so it holds whatever shape delivers the spread.
 */
export function onAbilityKeystoneInfected(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  victim: MonsterEntity,
): void {
  const keystoneId = getAbilityKeystoneRuntime(player.tracksCombat)?.[ability.id]?.keystoneId;
  if (!keystoneId) return;
  _modules.get(keystoneId)?.onInfected?.(world, player, ability, victim);
}

/**
 * The hit a share-paying verb takes its share OF: the resolving exchange as it
 * was BEFORE any empowered multiplier (`ctx.metadata.empoweredMultiplier`), the
 * basis every Technique rider and lineage payoff takes — so one multiplier per
 * hit holds (design §6) and a finisher never silently scales a keystone too.
 * With no exchange, or a Conduit summon's (an `owner` verb resolves on the owner),
 * the owner's Attack — what the magnitude table's flat column is seeded against.
 */
export function keystoneHitBasis(player: PlayerEntity, ctx?: CombatContext): number {
  if (!ctx || ctx.formation) return Math.max(1, Math.round(player.dealsDamage.attack));
  const empowered = Number(ctx.metadata['empoweredMultiplier'] ?? 1);
  return Math.max(1, Math.round(empowered > 1 ? ctx.damage / empowered : ctx.damage));
}

// ── The delivery body (design §22.10) ────────────────────────────────────────

/**
 * Where a verb's DELIVERY BODY stands for this resolution: the physical summon
 * that landed the ability on a Conduit (`ctx.formation`), the owner everywhere
 * else — and always the owner for an `owner` verb. A `formation` verb resolves on
 * every body of the formation, so its anchor is the owner.
 */
export function deliveryBodyPos(
  world: World,
  player: PlayerEntity,
  delivery: AbilityKeystoneDelivery,
  ctx?: CombatContext,
): Vec2 {
  if (delivery === 'delivering-body' && ctx?.formation?.side === 'summon') {
    const body = world.getMinionEntity(ctx.formation.physicalEntityId);
    if (body) return { ...body.hasPosition.current };
  }
  return { ...player.hasPosition.current };
}

// ── One visible thing per application ────────────────────────────────────────

export interface AbilityKeystoneFxOptions {
  /** Where the effect is drawn FROM (the delivery body); the owner by default. */
  pos?: Vec2;
  /** The monster the rule acted on, when it acted on one. */
  target?: MonsterEntity;
  /** A point the rule acted at, when it was a place rather than a body. */
  at?: Vec2;
  /** How long what it applied holds, as applied (a stagger, a root, a spin). */
  durationMs?: number;
}

/**
 * Push the one `card-fx` an application of a verb earned — the same event, the
 * same contract and the same client switch as every payoff row (design §8): one
 * per application, never per tick, never for a refusal.
 */
export function pushAbilityKeystoneFx(
  world: World,
  player: PlayerEntity,
  definition: AbilityKeystoneDefinition,
  options: AbilityKeystoneFxOptions = {},
): void {
  const targetPos = options.target ? options.target.hasPosition.current : options.at;
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'card-fx',
    playerId: player.isPlayer.id,
    fx: definition.fx,
    pos: options.pos ? { ...options.pos } : { ...player.hasPosition.current },
    ...(options.target ? { targetId: options.target.isMonster.id } : {}),
    ...(targetPos ? { targetPos: { ...targetPos } } : {}),
    ...(options.durationMs !== undefined ? { durationMs: options.durationMs } : {}),
  });
}
