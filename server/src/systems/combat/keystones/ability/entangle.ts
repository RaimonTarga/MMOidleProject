/**
 * BRAMBLE GUARD — **Entangle**. "A body that hits you while brambled is slowed."
 * (design §22.4; delivery: the owner)
 *
 * THE SEAMS.
 *  - The hit the player TAKES, at exactly the moment and on exactly the hits
 *    Bramble's own thorns answer (`registerBrambleReflect`: `afterHit`, a resolved
 *    direct hit from a monster that did damage — no DoT tick, nothing evaded or
 *    absorbed to nothing — while `ability-bramble` stands). "A body that hits
 *    you" is a body the thorns bite.
 *  - The movement slow in `monsterControl` (`applyMonsterSlow`): max wins on both
 *    axes, `totalMs` in the status data for the buff clock, the `hasAbilitySlow`
 *    marker, and the one slow reconciler. Under its own id, `ability-entangled`
 *    ("Entangled"), rather than the shared ability slow, whose label and help
 *    still say "Hamstrung" and name a cut ability (the precedent is the lean's
 *    `lineage.hobbled`). The id is a member of `MONSTER_SLOW_STATUS_IDS`, so it is
 *    the same rung as every slow: the reconciler takes the strongest of them, the
 *    Control keystone's ladder escalates from it, and `monsterIsHeld` counts it —
 *    an entangled body is held for the Control verb like every slow.
 *
 * THE NUMBERS. The slow is Entangle's own payoff kind (`slow`) off the magnitude
 * table at the keystone row and the active packet's lane (`guardKeystoneMagnitude`),
 * for the slow unit's window — no literal.
 *
 * A Guard never deals damage: the thorns are Bramble Guard's, and Entangle adds
 * only the slow.
 */
import {
  ABILITY_ENTANGLE_EFFECT_ID,
  ABILITY_KEYSTONE_DEFINITIONS,
  getStatusEffect,
} from '@mmo-idle/shared';
import { BRAMBLE_EFFECT_ID } from '../../../player/abilities/abilityBramble';
import { registerCombatListener } from '../../engine/combatPipeline';
import { applyMonsterSlow } from '../../status/monsterControl';
import { guardKeystoneMagnitude, payoffWindowMs } from './guardValues';
import { abilityKeystoneLive, defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'entangle';

export const ENTANGLE_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'on the hits Bramble Guard\'s thorns answer (afterHit, while ability-bramble stands), applyMonsterSlow on the attacker under ability-entangled, the slow payoff off the magnitude table at the keystone row',
  register: () => {
    registerCombatListener('afterHit', (ctx, world) => {
      if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
      if (ctx.metadata['isDot']) return;
      if (ctx.damage <= 0) return; // the thorns' own rule: nothing landed
      const player = ctx.defender;
      if (!abilityKeystoneLive(player, ID)) return;
      if ((getStatusEffect(player.tracksCombat, BRAMBLE_EFFECT_ID)?.remainingMs ?? 0) <= 0) return;
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      if (!definition) return;
      const attacker = ctx.attacker;
      // Like every slow (the lean's, the payoff's, the at-bay tap), this one is soft
      // control and lands on a control-immune boss too: `controlImmunity` refuses
      // the stun and the root, never the slow.
      if (attacker.hasHealth.hp <= 0) return;
      const slowPct = guardKeystoneMagnitude(player, ID);
      const windowMs = payoffWindowMs(definition.payoff);
      if (!(slowPct > 0) || !(windowMs > 0)) return;
      applyMonsterSlow(world, attacker, slowPct, windowMs, player.isPlayer.id, ABILITY_ENTANGLE_EFFECT_ID);
      pushAbilityKeystoneFx(world, player, definition, {
        target: attacker,
        durationMs: getStatusEffect(attacker.tracksCombat, ABILITY_ENTANGLE_EFFECT_ID)?.remainingMs ?? windowMs,
      });
    });
  },
});
