/**
 * SIDESTEP — **Flow**. "Every hit dodged during the window extends it; the first
 * that lands ends it." (design §22.11, shipped first by §22.12; delivery: the owner)
 *
 * THE SEAM. The evade seam the "per hit dodged" fire-shape already rides: an
 * `onDamageTaken` listener on a direct hit taken (never a DoT tick) while
 * Sidestep's own window (`ability-sidestep`, which carries the evasion and the
 * speed burst on one clock) is up.
 *  - A DODGE — the evade clock decided this hit (`metadata.evaded`, recorded in
 *    `onAttack`, so it reads the same on either side of the defence stack) and
 *    avoided some of it. A graze counts, exactly as it does for the node's
 *    "per hit dodged" and for an `evade` card: one meaning of "dodged" per game.
 *    The window's clock winds back to a full window. "Extends it" is a REFRESH,
 *    never a stack: the window always ends one unit after the last dodge, so a
 *    run of dodges cannot bank a long evasion-and-speed tail past the fight.
 *  - A HIT THAT LANDS — anything else, an unevadable hit and one a ward swallowed
 *    whole included (it reached you) — ends the window on the spot: the status
 *    comes off, and the speed burst with it.
 *
 * NO NUMBER. The extension is the window Sidestep already reads: the
 * `evasion-window` unit at its rank's tier (`sidestepWindow`), the same value
 * the cast wrote as the window's `totalMs`, so the buff clock reads full again.
 *
 * THE NODE STILL FIRES. The packet's "per hit dodged" route (`abilityNodes.ts`)
 * fires on every dodge while the window is up; a dodge never ends the window, so
 * an extended window keeps paying it per dodge until the hit that lands.
 *
 * One `card-fx` per dodge that extends (`durationMs` the full window as now
 * applied: the client re-brightens the window's ring and leaves an after-trail)
 * and one for the hit that ends it (`durationMs: 0`: the ring snaps). A hit
 * outside the window, or with the verb not live, does nothing.
 *
 * A Guard never deals damage: this moves a clock and nothing else.
 */
import {
  ABILITY_DATABASE,
  ABILITY_KEYSTONE_DEFINITIONS,
  ABILITY_SIDESTEP_EFFECT_ID,
  getStatusEffect,
  removeStatusEffect,
  sidestepWindow,
} from '@mmo-idle/shared';
import { registerCombatListener, type CombatContext } from '../../engine/combatPipeline';
import { evadeMitigationOf } from '../../../defense/mitigation/evasion';
import { abilityKeystoneLive, defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'flow';

/** The evade clock took this hit, in whole or in part — the fire-shape's own "dodged". */
const dodged = (ctx: CombatContext): boolean =>
  ctx.metadata['evaded'] === true && evadeMitigationOf(ctx) > 0;

export const FLOW_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'an onDamageTaken listener on a direct hit taken while Sidestep\'s window (ability-sidestep) is up: a dodge winds the window back to the evasion-window unit Sidestep reads (sidestepWindow); the first hit that lands removes it',
  register: () => {
    registerCombatListener('onDamageTaken', (ctx, world) => {
      if (ctx.defenderType !== 'player' || ctx.cancelled) return;
      if (ctx.metadata['isDot']) return; // a tick is neither dodged nor landed
      const player = ctx.defender;
      if (!abilityKeystoneLive(player, ID)) return;
      const cs = player.tracksCombat;
      const window = getStatusEffect(cs, ABILITY_SIDESTEP_EFFECT_ID);
      if (!window || window.remainingMs <= 0) return;
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      if (!definition) return;
      const attacker = ctx.attackerType === 'monster' ? ctx.attacker : undefined;

      if (dodged(ctx)) {
        const sidestep = ABILITY_DATABASE.get(definition.abilityId);
        const unitMs = sidestep ? sidestepWindow(sidestep, player.tracksProgression.playerTier).durationMs : 0;
        if (!(unitMs > 0)) return;
        window.remainingMs = Math.max(window.remainingMs, unitMs);
        window.data['totalMs'] = Math.max(window.data['totalMs'] ?? 0, window.remainingMs);
        pushAbilityKeystoneFx(world, player, definition, {
          durationMs: window.remainingMs,
          ...(attacker ? { target: attacker } : {}),
        });
        return;
      }

      removeStatusEffect(cs, ABILITY_SIDESTEP_EFFECT_ID);
      pushAbilityKeystoneFx(world, player, definition, {
        durationMs: 0,
        ...(attacker ? { target: attacker } : {}),
      });
    });
  },
});
