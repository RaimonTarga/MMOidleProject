import {
  relicRatingsFromPassives,
  resolveCadenceRelicProfile,
  resolveCooldownRelicProfile,
  type PassiveKey,
} from '@mmo-idle/shared';
import { registerCombatListener, type CombatContext } from './combatPipeline';
import { mechanicAlreadyFired } from './mechanicFired';
import { isClassActive } from '../../classes/shared/classActive';
import type { MonsterEntity, PlayerEntity, ServerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';

// ── Flag helpers ──────────────────────────────────────────────────────────────

/** Mark the entity's next attack as empowered. */
export function setEmpoweredAttack(world: World, entity: ServerEntity): void {
  attachComponent(world, entity, 'hasEmpoweredAttack', {});
}

export function isEmpoweredAttack(entity: ServerEntity): boolean {
  return entity.hasEmpoweredAttack !== undefined;
}

/**
 * `ctx.metadata` key: this hit must not spend the attacker's pending empowered
 * charge. See the hold in {@link registerEmpoweredMultiplier}.
 */
export const HOLD_EMPOWERED_ATTACK = 'holdEmpoweredAttack';

/**
 * If the entity is currently empowered, consume the flag and return true.
 * Returns false (and makes no change) if the entity was not empowered.
 * Designed for single-use: empowerment is spent exactly once.
 */
export function consumeEmpoweredAttack(world: World, entity: ServerEntity): boolean {
  if (!isEmpoweredAttack(entity)) return false;
  detachComponent(world, entity, 'hasEmpoweredAttack');
  return true;
}

// ── Multiplier registration ───────────────────────────────────────────────────

type EmpoweredAttackerSlice =
  | 'usesCadence'
  | 'usesCooldown'
  | 'usesEnergy'
  | 'usesReload'
  | 'appliesDots';

export interface EmpoweredMultiplierOptions {
  /** Restrict to one attacker side. Omit to apply to both players and monsters. */
  attackerType?: 'player' | 'monster';
  /** Player-only: only fires when this archetype slice is attached. */
  attackerSlice?: EmpoweredAttackerSlice;
  /** Monster-only: monsters still expose their archetype as a compact discriminator. */
  attackerMonsterArchetype?: string;
  /**
   * If set, only fires when the attacker's selectedClass matches this value.
   * Checked via isClassActive — preferred over archetype strings for player
   * class mechanics because it uses selectedClass as the source of truth.
   */
  attackerClass?: string;
  /**
   * If set, reads the base multiplier from player.passives[passiveKey] at runtime
   * instead of using the static `multiplier` argument.
   * Falls back to the static argument when the passive is absent or zero.
   */
  passiveKey?: PassiveKey;
  /**
   * If set alongside passiveKey, adds player.passives[passiveAddKey] to the
   * effective multiplier. Useful when a tier-3 node stacks an additive bonus
   * on top of the frame-set base (e.g. cadence.damage-mult-add).
   */
  passiveAddKey?: PassiveKey;
  /**
   * `mechanic-proxy` (design §24.2) only: use this registration for a proxy ONLY
   * when the player's proxy key ({@link proxyPassiveKey}, else `passiveKey`) is
   * authored. For a root whose registration is a SPEC's mechanic rather than the
   * root's — reload's registration was the Duelist's exploding clip, retired by the
   * T3 review (design §22.5) — a spec with no damage-multiplier mechanic to proxy
   * gets the proxy's fallback instead of a multiplier its class never fires.
   */
  proxyRequiresPassive?: boolean;
  /**
   * `mechanic-proxy` only: the passive the PROXY reads its base multiplier from, in
   * place of `passiveKey`; the live empowered hit never reads it. For a spec whose
   * proxy has a size of its own while no real shot of its class is empowered — the
   * Duelist's proxy is ×3.5 (design §22.12), but no reload shot arms the empowered
   * flag and the Scout's openers are the frame loop's own fold — so authoring the
   * proxy can never move a real shot, nor the shared readers that take
   * `reload.empowered-mult` for a real last-round multiplier
   * (`resolveEmpoweredMultiplier`, the Stats panel's DPS estimate).
   */
  proxyPassiveKey?: PassiveKey;
}

interface EmpoweredRegistration {
  multiplier: number;
  options: EmpoweredMultiplierOptions;
}

/**
 * Every registration, in order — the proxy's lookup table. The live listeners
 * close over their own `(multiplier, options)`; this list exists so
 * `mechanic-proxy` resolves a player's multiplier through EXACTLY the same
 * arithmetic as the hit that really spends the charge.
 */
const _registrations: EmpoweredRegistration[] = [];

type EmpoweredAttacker = CombatContext['attacker'];

/** Whether a registration's filters admit this attacker. */
function registrationAdmits(
  world: World,
  attackerType: CombatContext['attackerType'],
  attacker: EmpoweredAttacker,
  options: EmpoweredMultiplierOptions,
): boolean {
  if (options.attackerType && attackerType !== options.attackerType) return false;
  if (options.attackerSlice) {
    if (attackerType !== 'player') return false;
    if ((attacker as PlayerEntity)[options.attackerSlice] === undefined) return false;
  }
  if (options.attackerMonsterArchetype) {
    if (attackerType !== 'monster') return false;
    if ((attacker as MonsterEntity).isMonster.combatArchetype !== options.attackerMonsterArchetype) return false;
  }
  if (options.attackerClass) {
    if (attackerType !== 'player') return false;
    if (!isClassActive(world, (attacker as PlayerEntity).isPlayer.id, options.attackerClass)) return false;
  }
  return true;
}

/**
 * The multiplier an empowered hit lands at for this attacker: the static
 * `multiplier`, or the player's `passiveKey` (+ `passiveAddKey`), then the
 * universal bonuses and the root's relic profile. Factored out of the listener so
 * the real hit and `mechanic-proxy` can never disagree about the number.
 */
function resolveEffectiveMultiplier(
  attackerType: CombatContext['attackerType'],
  attacker: EmpoweredAttacker,
  multiplier: number,
  options: EmpoweredMultiplierOptions,
): number {
  let effectiveMult = multiplier;
  if (attackerType !== 'player') return effectiveMult;
  const player = attacker as PlayerEntity;
  // Resolve effective multiplier: use passives at runtime when passiveKey is given.
  if (options.passiveKey) {
    const base = player.usesSkills.passives[options.passiveKey];
    if (base !== undefined && base > 0) {
      effectiveMult = base;
      if (options.passiveAddKey) {
        effectiveMult += player.usesSkills.passives[options.passiveAddKey] ?? 0;
      }
    }
  }
  // Universal item/passive bonus — stacks on top of archetype base + T3 add.
  effectiveMult += player.usesSkills.passives['shared.empowered-mult-add'] ?? 0;
  // Multiplicative empowered bonus (weapon mechanic): scales the resolved
  // multiplier by (1 + bonus), so every spec gains the same % regardless of
  // its base multiplier. e.g. 2.5x base with +0.5 → 3.75x (NOT additive 3.0x).
  const multBonus = player.usesSkills.passives['weapon.empowered-mult-bonus'] ?? 0;
  if (multBonus !== 0) effectiveMult *= 1 + multBonus;

  const passives = player.usesSkills.passives;
  const ratings = relicRatingsFromPassives(passives);
  if (options.attackerSlice === 'usesCadence') {
    effectiveMult = resolveCadenceRelicProfile(5, effectiveMult, ratings).empoweredMultiplier.after;
  } else if (options.attackerSlice === 'usesCooldown') {
    effectiveMult = resolveCooldownRelicProfile(7000, effectiveMult, ratings).empoweredMultiplier.after;
  }
  return effectiveMult;
}

/**
 * Register a combat listener that applies `multiplier` to ctx.damage whenever
 * the attacker has a pending empowered attack flag.
 *
 * Fires at the 'onHit' phase so the final damage value is still modifiable
 * before it is written to the defender's hp.
 *
 * Multiple archetypes can call this with different multipliers; each
 * registration is independent. Multipliers stack multiplicatively if both
 * fire on the same hit.
 *
 * Call once at server startup (before the World is created).
 */
export function registerEmpoweredMultiplier(
  multiplier: number,
  options: EmpoweredMultiplierOptions = {},
): void {
  _registrations.push({ multiplier, options });
  registerCombatListener('onHit', (ctx, world) => {
    if (!registrationAdmits(world, ctx.attackerType, ctx.attacker, options)) return;

    // Chaotic miss: the attack whiffs. Don't consume the empowered charge, don't
    // multiply, don't set empoweredAttack metadata (which would restart cooldowns and
    // mark the hit empowered). The charge stays armed for the next real hit.
    if (ctx.metadata['chaoticMiss']) return;

    // A HELD hit leaves a pending charge exactly where it is, like a chaotic miss
    // does: the hit is not the one that delivers the mechanic. Set in
    // `beforeAttack` (or on a hit the root runs itself) by a mechanic that decides
    // WHICH hit spends its charge. The Squire's Destroyer and Reverb's echo were
    // the writers (design §22.5); the hold stays for whatever sets it next.
    if (ctx.metadata[HOLD_EMPOWERED_ATTACK]) return;

    if (!consumeEmpoweredAttack(world, ctx.attacker)) return;

    // Some T4 mechanics suppress the standard multiplier but still need the
    // empoweredAttack metadata set so their own onHit handlers can detect the trigger.
    if (ctx.metadata['suppressEmpoweredMult']) {
      ctx.metadata['empoweredAttack']     = true;
      ctx.metadata['mechanicConsumed']    = true;
      // Keep a multiplier the mechanic recorded itself (energy discharges) so
      // Technique riders still see it; otherwise the standard one is 1.
      ctx.metadata['empoweredMultiplier'] = Number(ctx.metadata['empoweredMultiplier'] ?? 1);
      ctx.metadata['empoweredBonus']      = 0;
      return;
    }

    const effectiveMult = resolveEffectiveMultiplier(ctx.attackerType, ctx.attacker, multiplier, options);

    const base     = ctx.damage;
    ctx.damage     = Math.floor(base * effectiveMult);

    ctx.metadata['empoweredAttack']    = true;
    // `empoweredAttack` is ALSO set by several T3 paths for crit styling only
    // (Surge in Overdrive, Blunderbuss pellets, Fan the Flames, the Snipe full-HP
    // shot), so anything that means "the class mechanic just spent its charge" —
    // frame loops, the mechanic-fired emitters, Shockwave, the range gates — reads
    // this key instead (review finding P1, 2026-10-02).
    ctx.metadata['mechanicConsumed']    = true;
    ctx.metadata['empoweredMultiplier'] = effectiveMult;
    ctx.metadata['empoweredBonus']      = ctx.damage - base;

  });
}

// ── mechanic-proxy (design §24.2, course-correction rule 3) ──────────────────

/**
 * The empowered multiplier this player's root would land a real mechanic hit at,
 * or undefined when the root has no damage-multiplier mechanic to proxy (the DoT
 * root, the summoner, and every reload spec but the Duelist since the exploding
 * clip was retired).
 *
 * A registration with a {@link EmpoweredMultiplierOptions.proxyPassiveKey} resolves
 * through the same arithmetic as the real hit with that key standing in for
 * `passiveKey` — the Duelist's ×3.5 (design §22.12), on reload's registration.
 */
export function proxyEmpoweredMultiplier(world: World, player: PlayerEntity): number | undefined {
  for (const registration of _registrations) {
    const { options } = registration;
    if (options.attackerMonsterArchetype) continue;
    if (!registrationAdmits(world, 'player', player, options)) continue;
    const proxyKey = options.proxyPassiveKey ?? options.passiveKey;
    if (options.proxyRequiresPassive) {
      const authored = proxyKey ? player.usesSkills.passives[proxyKey] ?? 0 : 0;
      if (!(authored > 0)) return undefined;
    }
    const resolved = options.proxyPassiveKey
      ? { ...options, passiveKey: options.proxyPassiveKey }
      : options;
    return resolveEffectiveMultiplier('player', player, registration.multiplier, resolved);
  }
  return undefined;
}

/**
 * Whether this exchange's empowered flags came from a `mechanic-proxy` payoff
 * rather than from the root spending its own charge.
 *
 * Every reader that walks the ROOT's own state — the six frame loops, the
 * `mechanic-fired` emitters, the cooldown cycle restart, energy's gain gate —
 * early-returns (or treats the hit as an ordinary one) on this, so a proxy never
 * re-enters a frame loop and never announces `mechanic-fired` (rule 3, the same
 * rule as the Signature keystone).
 */
export function isMechanicProxy(ctx: CombatContext): boolean {
  return ctx.metadata['mechanicProxy'] === true;
}

/**
 * Make this hit COUNT AS the class mechanic firing (design §24.2's Empowered
 * payload, "the Signature idea"). Returns the multiplier it applied, or 0 when it
 * did nothing.
 *
 *  - The multiplier is the root's own, resolved through the same function as the
 *    real hit ({@link proxyEmpoweredMultiplier}); `fallbackMultiplier` (from the
 *    magnitude table) for a root with no damage-multiplier mechanic.
 *  - It sets `empoweredAttack`, `mechanicConsumed` and `empoweredMultiplier`, so
 *    everything that reads "the mechanic's hit" AFTER it in the pipeline — the
 *    Shockwave keystone, the range gates, a T3 finisher rider in `afterHit`, the
 *    crit styling — treats it as one; and `mechanicProxy`, so the root's own
 *    loops never do.
 *  - It does NOT consume the root's pending charge, and it NEVER emits
 *    `mechanic-fired`: `emitMechanicFired` refuses a proxied exchange outright.
 *  - One multiplier per hit: a hit that already spent the real mechanic (or was
 *    already proxied) is left alone, and any other multiplier already on the hit
 *    (a damage window, a lunge) is folded into the same record, never a layer.
 *  - `bonusScale` multiplies the multiplier's BONUS (a T2+ verb's tier, a size
 *    amplifier: design §24.9): 1 is exactly the mechanic, 1.15 lands a ×1.8
 *    mechanic at ×1.92. The proxy's size is the mechanic's, so this is the only
 *    way a tier can grow it.
 */
export function applyMechanicProxy(
  world: World,
  ctx: CombatContext,
  fallbackMultiplier: number,
  bonusScale = 1,
): number {
  if (ctx.attackerType !== 'player') return 0;
  if (ctx.metadata['chaoticMiss']) return 0;
  if (ctx.metadata['mechanicConsumed'] === true) return 0;
  // The real mechanic already ANNOUNCED itself on this exchange without spending a
  // charge — the DoT root's stack filling, the Conduit's formation cycle closing.
  // Both roots register their listeners first, so their emission lands first and
  // their own "a proxy never announces" guards never see a proxy; proxying the hit as well counted it as the mechanic twice (an
  // emission AND the proxy's multiplier on one exchange). The hit IS the mechanic's
  // already: left alone, like a hit that spent the charge.
  if (mechanicAlreadyFired(ctx)) return 0;
  const own = proxyEmpoweredMultiplier(world, ctx.attacker) ?? fallbackMultiplier;
  if (!(own > 0)) return 0;
  const multiplier = bonusScale > 0 && bonusScale !== 1 ? 1 + (own - 1) * bonusScale : own;
  if (!(multiplier > 0)) return 0;

  const base = ctx.damage;
  ctx.damage = Math.floor(base * multiplier);
  ctx.metadata['empoweredAttack'] = true;
  ctx.metadata['mechanicConsumed'] = true;
  ctx.metadata['mechanicProxy'] = true;
  ctx.metadata['empoweredMultiplier'] = Number(ctx.metadata['empoweredMultiplier'] ?? 1) * multiplier;
  ctx.metadata['empoweredBonus'] = Number(ctx.metadata['empoweredBonus'] ?? 0) + (ctx.damage - base);
  return multiplier;
}
