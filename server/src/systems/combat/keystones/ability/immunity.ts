/**
 * CLEANSE — **Immunity**. "The affliction kind you stripped cannot be reapplied
 * for a few seconds." (design §22.4; delivery: the owner)
 *
 * THE SEAMS.
 *  - The Guard's activation (`onGuardKeystoneCast`), which is handed what the
 *    Cleanse actually stripped (`cleansePlayerAfflictions`' removed list). A
 *    Cleanse that stripped nothing grants nothing.
 *  - The KIND is the stripped player status id, exactly as the cleanse policy
 *    keys it (`slow`, `antiheal`, `sundered`, `sun-mark`, `plating-shred`,
 *    `monster-dot:<debuff>` — one monster DoT id per authored debuff, so two
 *    poisons of different debuffs are two kinds). It is recorded as a KEY of one
 *    status's data (`ability-immunity`, `abilityImmunityKindKey`), because status
 *    data holds numbers only; one status, one tile, one clock.
 *  - The appliers of that kind refuse while it stands, through the player debuff
 *    writers' one admission check (`playerRefusesStatus` /
 *    `playerRefusesAffliction` in `debuffGuard.ts`): `applyResistedPlayerDebuff`,
 *    `applyMonsterDotToPlayer`, the monster-ability rider writer, the plating
 *    shred applier and the on-hit Sun Mark.
 *
 * THE WINDOW. Immunity's own payoff (`cleanse`) is binary and has no window, so
 * the "few seconds" reuse an existing unit rather than mint one: the `ward` payoff
 * unit's window — Immunity's card wears the ward shell (`barrier-tempo.ward-shell`)
 * and holds exactly as long as that shell does. Provisional, the designer's to
 * move; read off the magnitude table, never a literal here.
 *
 * A second Cleanse inside the window adds its kinds and restarts the clock (the
 * Cleanse cooldown is longer than the window, so this is rare). A Guard never
 * deals damage: this is a refusal and nothing else.
 */
import {
  ABILITY_IMMUNITY_EFFECT_ID,
  ABILITY_KEYSTONE_DEFINITIONS,
  abilityImmunityKindKey,
  applyStatusEffect,
} from '@mmo-idle/shared';
import { onGuardKeystoneCast } from './guardCast';
import { payoffWindowMs } from './guardValues';
import { defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'immunity';

/** The unit Immunity's window reuses (see the file header). */
const WINDOW_UNIT = 'ward' as const;

export const IMMUNITY_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Cleanse\'s activation records each stripped status id as a refused kind on ability-immunity, for the ward unit\'s window; the player debuff writers refuse that kind through playerRefusesStatus / playerRefusesAffliction',
  register: () => {
    onGuardKeystoneCast(ID, (world, player, ability, removed) => {
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      if (!definition || ability.id !== definition.abilityId) return;
      const kinds = [...new Set(removed.filter((r) => r.stacks > 0).map((r) => r.effectId))];
      if (kinds.length === 0) return;
      const windowMs = payoffWindowMs(WINDOW_UNIT);
      if (!(windowMs > 0)) return;
      const immunity = applyStatusEffect(player.tracksCombat, {
        id: ABILITY_IMMUNITY_EFFECT_ID,
        maxStacks: 1,
        remainingMs: windowMs,
        refreshable: true,
        sourceId: player.isPlayer.id,
        data: { totalMs: windowMs },
      });
      // A refresh restarts the clock but keeps the old record's data: add the new kinds.
      immunity.data['totalMs'] = windowMs;
      for (const kind of kinds) immunity.data[abilityImmunityKindKey(kind)] = 1;
      pushAbilityKeystoneFx(world, player, definition, { durationMs: windowMs });
    });
  },
});
