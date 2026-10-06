/**
 * SWEEP — **Whirlwind**. "Sweep becomes a one-second spin that cleaves every
 * tick." (design §22.4; delivery: owner)
 *
 * THE SEAMS. The channelled beam's tick machinery (a component drained by `dt`,
 * landing a hit each tick, broken by hard control — `scheduledHits.ts`) and
 * `applyPlayerAoe`, the splash Sweep's own cleave already uses. Nothing new
 * resolves damage.
 *
 * WHAT IT DOES. When Sweep resolves — its armed rider landing, which is ONE moment
 * per cooldown whatever delivers it — its own cleave lands as always, and the
 * spin begins: every `whirlwindTickMs` for `whirlwindMs` it cleaves again around
 * the owner, every body inside Sweep's own radius, for the keystone's share of
 * the swing that started it (off the magnitude table at `ROW_SCALAR.keystone`).
 *
 * THE RULES IT KEEPS.
 *  - The spin is the owner's: it turns where the player stands, tick by tick.
 *  - Hard control breaks it like a cast: the ticks still to come are dropped.
 *  - A dodged swing starts no spin (`evadeBlocksDebuffs`, as every on-hit
 *    application in the runtime).
 *  - One multiplier per hit: the share is of the swing BEFORE any empowered
 *    multiplier (`keystoneHitBasis`).
 *  - Not an attack: a tick is an area payload, so it is no attack-equivalent for
 *    Sweep's own Tempo and never advances the weapon verb's hit counter.
 *  - Reload: the clip's first shot is the one that spends the armed Sweep, so the
 *    spin starts once per Sweep — first-hit-only — never once per bullet.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  abilityKeystoneUnit,
  resolveAbilityEffect,
} from '@mmo-idle/shared';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { techniquePowerPctFor } from '../../../player/abilities/abilityKata';
import {
  abilityKeystoneShareOf, defineAbilityKeystone, keystoneHitBasis, pushAbilityKeystoneFx,
} from './registry';
import { cancelKeystoneHits, scheduleKeystoneHit } from './scheduledHits';

const ID = 'whirlwind';

export const WHIRLWIND_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Sweep\'s resolution starts a spin: scheduled applyPlayerAoe ticks around the owner (the channelled beam\'s tick machinery), broken by hard control',
  onResolved: (world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    if (site.ctx && evadeBlocksDebuffs(site.ctx)) return;
    const share = abilityKeystoneShareOf(player, ID);
    if (share <= 0) return;
    const effect = resolveAbilityEffect(ability, {
      playerTier: player.tracksProgression.playerTier,
      techniquePowerPct: techniquePowerPctFor(player),
    });
    if (effect.kind !== 'cleave' || !(effect.radius > 0)) return;

    const damage = Math.max(1, Math.round(keystoneHitBasis(player, site.ctx) * share));
    const spinMs = abilityKeystoneUnit('whirlwindMs');
    const tickMs = Math.max(1, abilityKeystoneUnit('whirlwindTickMs'));
    // A new spin replaces one still turning: one spin, one clock.
    cancelKeystoneHits(world, player, ID);
    for (let dueInMs = tickMs; dueInMs <= spinMs; dueInMs += tickMs) {
      scheduleKeystoneHit(world, player, {
        keystoneId: ID,
        abilityId: ability.id,
        dueInMs,
        nodeId: player.hasPosition.nodeId,
        radius: effect.radius,
        damage,
        interruptible: true,
      });
    }
    // One application, one `card-fx`: the spin, on the owner, for as long as it turns.
    pushAbilityKeystoneFx(world, player, definition, { durationMs: spinMs });
  },
});
