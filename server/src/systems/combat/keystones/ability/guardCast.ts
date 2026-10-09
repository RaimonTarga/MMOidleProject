/**
 * The GUARD keystones' own moment: the Guard just fired (design §22.4, §22.10).
 *
 * A Technique verb hangs off its ability RESOLVING (`onAbilityKeystoneResolved`,
 * from `techniqueResolved.ts`). A Guard never resolves through that seam — it is
 * not an attack and has no exchange to ride — so its verbs hang off the one moment
 * every Guard activation already passes through: `maybeFireGuard`, after the
 * Guard's own effect has landed and its cooldown is set. That is also the only
 * place that knows what a Cleanse STRIPPED, which Immunity is keyed by.
 *
 * A Guard verb registers its handler from its module's `register()` (so the
 * registry's "every module hooks something" rule holds and the live server and
 * every bench see one set). {@link onAbilityKeystoneGuardCast} runs the player's
 * live verb on THAT Guard, once per activation, and nothing else.
 *
 * Defence never scales with offence: nothing called from here deals damage.
 */
import {
  getAbilityKeystoneRuntime,
  type AbilityDef,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import type { RemovedEffect } from '../../status/cleanse';

/** A Guard verb's handler: the Guard fired with this verb live. */
export type GuardKeystoneCastHandler = (
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  /** What the activation stripped (a Cleanse); empty for every other Guard. */
  removed: readonly RemovedEffect[],
) => void;

const _handlers = new Map<string, GuardKeystoneCastHandler>();

/** Hang `keystoneId`'s rule off its Guard's activation. Called from the module's `register()`. */
export function onGuardKeystoneCast(keystoneId: string, handler: GuardKeystoneCastHandler): void {
  _handlers.set(keystoneId, handler);
}

/**
 * A Guard fired: run its live keystone verb, if it has one. Called once per
 * activation from `maybeFireGuard`, after the Guard's own effect.
 */
export function onAbilityKeystoneGuardCast(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
  removed: readonly RemovedEffect[] = [],
): void {
  if (ability.slot !== 'guard') return;
  const keystoneId = getAbilityKeystoneRuntime(player.tracksCombat)?.[ability.id]?.keystoneId;
  if (!keystoneId) return;
  _handlers.get(keystoneId)?.(world, player, ability, removed);
}
