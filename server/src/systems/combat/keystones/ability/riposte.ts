/**
 * BRACE — **Riposte**. "A melee hit absorbed while Braced staggers the attacker."
 * (design §22.4; delivery: the owner)
 *
 * THE SEAMS.
 *  - The hit the player TAKES: an `afterHit` listener, the same moment Bramble's
 *    thorns answer (a RESOLVED hit, so the stagger follows the blow it answers and
 *    never fires on a swing that was cancelled before it landed). "Absorbed while
 *    Braced" is a direct hit that landed — not a DoT tick, not a full dodge —
 *    while Brace's own damage-reduction status (`ability-guard`) stands.
 *  - The control ladder's shortest rung on the attacker: `applyStun` for
 *    `ladderStunMs`, as Breakthrough and Backlash stagger, with its post-stun
 *    immunity; a plated or control-immune boss refuses it (`monsterIgnoresControl`).
 *  - The Guard's activation (`onGuardKeystoneCast`) opens a fresh Brace: "once per
 *    attacker per Brace" is the list of attackers this activation has already
 *    staggered, cleared on each Brace and kept in the player's server-only combat
 *    scratch (so death and node teardown clear it with everything else).
 *
 * MELEE is the attacker's own attack style as the monster data authors it: the
 * runtime `isMonster.isRanged`, which spawning derives from the definition's
 * `behavior` (`monsterIsRanged`) and a boss morph rewrites together with its
 * `attackStyle`. A ranged or kiting body's shot is never riposted.
 *
 * A Guard never deals damage: Riposte staggers and nothing else.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  getStatusEffect,
  getString,
  guardEffectIdForAbility,
  lineageUnit,
  setString,
} from '@mmo-idle/shared';
import { registerCombatListener } from '../../engine/combatPipeline';
import { monsterIgnoresControl } from '../../status/controlImmunity';
import { STUN_EFFECT, applyStun } from '../../status/stun';
import { onGuardKeystoneCast } from './guardCast';
import { abilityKeystoneLive, defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'riposte';

/** The attackers this Brace activation has already staggered, space-separated. */
const RIPOSTED_KEY = 'keystone.riposte.staggered';

export const RIPOSTE_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'an afterHit listener on a melee hit the player takes while Brace\'s ability-guard stands applies the control ladder\'s shortest rung (applyStun, ladderStunMs) to the attacker, once per attacker per Brace activation',
  register: () => {
    // A fresh Brace: every attacker may be riposted once more.
    onGuardKeystoneCast(ID, (_world, player, ability) => {
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      if (!definition || ability.id !== definition.abilityId) return;
      setString(player.tracksCombat, RIPOSTED_KEY, '');
    });

    registerCombatListener('afterHit', (ctx, world) => {
      if (ctx.attackerType !== 'monster' || ctx.defenderType !== 'player') return;
      if (ctx.metadata['isDot']) return; // no swing to answer
      // Dodged outright: nothing was absorbed. A graze landed, and was.
      if (ctx.metadata['evaded'] === true && ctx.metadata['evadeFull'] === true) return;
      const player = ctx.defender;
      if (!abilityKeystoneLive(player, ID)) return;
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      const braceId = definition ? guardEffectIdForAbility(definition.abilityId) : undefined;
      if (!definition || !braceId) return;
      if ((getStatusEffect(player.tracksCombat, braceId)?.remainingMs ?? 0) <= 0) return;

      const attacker = ctx.attacker;
      if (attacker.isMonster.isRanged) return;
      if (attacker.hasHealth.hp <= 0 || monsterIgnoresControl(attacker)) return;
      const staggered = (getString(player.tracksCombat, RIPOSTED_KEY) ?? '').split(' ').filter(Boolean);
      if (staggered.includes(attacker.isMonster.id)) return;
      // Refused while the attacker is still immune from its last stun: nothing
      // landed, so nothing is spent — a later blow in the same Brace may land it.
      if (!applyStun(attacker.tracksCombat, lineageUnit('ladderStunMs'), player.isPlayer.id)) return;
      setString(player.tracksCombat, RIPOSTED_KEY, [...staggered, attacker.isMonster.id].join(' '));
      pushAbilityKeystoneFx(world, player, definition, {
        target: attacker,
        durationMs: getStatusEffect(attacker.tracksCombat, STUN_EFFECT)?.remainingMs ?? lineageUnit('ladderStunMs'),
      });
    });
  },
});
