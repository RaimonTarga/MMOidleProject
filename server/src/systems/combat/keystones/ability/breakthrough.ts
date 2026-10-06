/**
 * CHARGE — **Breakthrough**. "Arriving staggers the target." (design §22.11, the
 * first verb in Trample's place; delivery: the delivering body)
 *
 * THE SEAM. The control ladder's shortest rung: `applyStun` for `ladderStunMs` —
 * the `stun` payoff's own hold, the stun every keystone and card that "staggers"
 * already uses (design §22.11: "stagger is the control ladder's shortest stun
 * rung, with post-stun immunity"). `applyStun` is the one place a stun enters the
 * world, so post-stun immunity and control resistance apply with no restating,
 * and a plated or control-immune boss refuses it outright.
 *
 * WHEN. On Charge's resolution: the blow it lands on ARRIVAL (the armed rider the
 * rush hands back on contact). On a Conduit the summons do the rushing, and the
 * summon that arrives first delivers it — its blow is the resolution — so the
 * stagger is drawn from that body.
 *
 * THE RULES IT KEEPS. A dodged arrival lands no stagger (`evadeBlocksDebuffs`);
 * the stagger is control, not damage, so there is no multiplier to keep single.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  getStatusEffect,
  lineageUnit,
} from '@mmo-idle/shared';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { monsterIgnoresControl } from '../../status/controlImmunity';
import { STUN_EFFECT, applyStun } from '../../status/stun';
import { defineAbilityKeystone, deliveryBodyPos, pushAbilityKeystoneFx } from './registry';

const ID = 'breakthrough';

export const BREAKTHROUGH_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Charge\'s arrival blow applies the control ladder\'s shortest rung (applyStun, ladderStunMs) to the target',
  onResolved: (world, player, ability, site) => {
    const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
    if (!definition || ability.id !== definition.abilityId) return;
    if (site.ctx && evadeBlocksDebuffs(site.ctx)) return;
    const target = site.target ?? (site.ctx?.defenderType === 'monster' ? site.ctx.defender : undefined);
    if (!target || target.hasHealth.hp <= 0) return;
    if (monsterIgnoresControl(target)) return;
    // Refused while the target is still immune from its last stun: nothing landed,
    // so nothing is drawn.
    if (!applyStun(target.tracksCombat, lineageUnit('ladderStunMs'), player.isPlayer.id)) return;
    pushAbilityKeystoneFx(world, player, definition, {
      pos: deliveryBodyPos(world, player, definition.delivery, site.ctx),
      target,
      // As applied: control resistance shortens a stun at the one place it enters.
      durationMs: getStatusEffect(target.tracksCombat, STUN_EFFECT)?.remainingMs ?? lineageUnit('ladderStunMs'),
    });
  },
});
