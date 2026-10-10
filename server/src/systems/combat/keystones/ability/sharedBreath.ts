/**
 * SECOND WIND — **Shared Breath**. "The mend also runs on your summons and
 * same-node party." (design §22.4; delivery: the formation — §22.10's explicit
 * call)
 *
 * WHAT IS SHARED. The mend Second Wind just switched on: the Recovery engine's
 * `skill` source, at the OWNER's fraction (post-potency, as `applyGuardHeal`
 * resolved it onto the owner's `ability-second-wind` status) and for the owner's
 * window. Never a new number: each body is healed by its own Recovery, switched
 * on by the owner's share — the formation breathes the owner's breath.
 *
 * THE SEAMS.
 *  - The Guard's activation (`onGuardKeystoneCast`), after `applyGuardHeal`.
 *  - PARTY, through `InParty`: every living player in the owner's party standing
 *    in the owner's node gets `activateRecovery(member, 'skill', fraction, window)`
 *    — the engine's own refresh rule (the larger fraction and the longer window
 *    win, so a member's own stronger Second Wind is never downgraded) and its own
 *    payout (in combat only, through `applyHealToPlayer`: antiheal and the
 *    overheal ward apply). A member on another node gets nothing.
 *  - SUMMONS, beside the minion mitigation sync: a summon has no Recovery engine
 *    of its own, so the summoner's per-tick owner-to-summon pass (the one that
 *    already carries the owner's plating and DR onto every body) runs
 *    {@link mendSummonWithOwner} on each living summon in combat while the
 *    owner's mend runs: the owner's Recovery at the owner's fraction, in the
 *    body's share of the owner's pool — the "pool share in, pool share out" rule
 *    `minionRecoveryFor` already states for a summon's regen, so each body mends
 *    the same fraction of itself per second the owner does. Paid through
 *    `applyHealToMinion` (antiheal applies). Out of combat a summon's own regen
 *    runs instead, as before.
 *
 * Nothing is stored on a summon or a party member beyond the engine's own timed
 * source, so nothing persists and node freeze/death clear it with everything else.
 * A Guard never deals damage: this is a shared mend and nothing else.
 */
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  getStatusEffect,
  recoveryEffectIdForAbility,
} from '@mmo-idle/shared';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { activateRecovery } from '../../../defense/regen/recovery';
import { onGuardKeystoneCast } from './guardCast';
import { abilityKeystoneLive, defineAbilityKeystone, pushAbilityKeystoneFx } from './registry';

const ID = 'shared-breath';

/** The owner's live mend: its fraction and what is left of its window, or undefined. */
function ownerMend(owner: PlayerEntity): { fraction: number; remainingMs: number } | undefined {
  const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
  const statusId = definition ? recoveryEffectIdForAbility(definition.abilityId) : undefined;
  const mend = statusId ? getStatusEffect(owner.tracksCombat, statusId) : undefined;
  const fraction = mend?.data['recoveryPct'] ?? 0;
  if (!mend || mend.remainingMs <= 0 || !(fraction > 0)) return undefined;
  return { fraction, remainingMs: mend.remainingMs };
}

/** The owner's living party members in the owner's node, the owner excluded. */
function sameNodeParty(world: World, owner: PlayerEntity): PlayerEntity[] {
  const leaderId = owner.inParty?.leaderId;
  if (!leaderId) return [];
  const members: PlayerEntity[] = [];
  for (const member of world.playerEntities) {
    if (member === owner || member.inParty?.leaderId !== leaderId) continue;
    if (member.hasPosition.nodeId !== owner.hasPosition.nodeId) continue;
    if (member.isDead || member.hasHealth.hp <= 0) continue;
    members.push(member);
  }
  return members;
}

/**
 * Run the owner's Second Wind on one summon for `dt` (Shared Breath). Called by
 * the summoner's per-tick pass for a living summon in combat; a no-op unless the
 * verb is live and the owner's mend is running.
 */
export function mendSummonWithOwner(world: World, owner: PlayerEntity, minion: MinionEntity, dt: number): void {
  if (!abilityKeystoneLive(owner, ID)) return;
  if (minion.hasHealth.hp <= 0 || minion.hasHealth.hp >= minion.hasHealth.maxHp) return;
  const mend = ownerMend(owner);
  if (!mend || owner.hasHealth.maxHp <= 0) return;
  const poolShare = minion.hasHealth.maxHp / owner.hasHealth.maxHp;
  const perSecond = (owner.hasHealth.recovery ?? 0) * mend.fraction * poolShare;
  if (!(perSecond > 0)) return;
  applyHealToMinion(minion, owner.isPlayer.id, perSecond * (dt / 1_000), world);
}

export const SHARED_BREATH_KEYSTONE = defineAbilityKeystone({
  id: ID,
  seam: 'Second Wind\'s activation switches the Recovery engine\'s skill source on for each same-node InParty member at the owner\'s fraction; the summoner\'s per-tick owner-to-summon pass mends each summon in combat at the owner\'s fraction while it runs',
  register: () => {
    onGuardKeystoneCast(ID, (world, player, ability) => {
      const definition = ABILITY_KEYSTONE_DEFINITIONS.get(ID);
      if (!definition || ability.id !== definition.abilityId) return;
      const mend = ownerMend(player);
      if (!mend) return;
      // The pulse runs down the formation: one card-fx per body the mend reaches.
      for (const member of sameNodeParty(world, player)) {
        activateRecovery(member.tracksCombat, 'skill', mend.fraction, mend.remainingMs);
        pushAbilityKeystoneFx(world, player, definition, { at: member.hasPosition.current, durationMs: mend.remainingMs });
      }
      for (const id of player.summonsMinions?.minionIds ?? []) {
        const minion = id ? world.getMinionEntity(id) : undefined;
        if (!minion || minion.hasHealth.hp <= 0) continue;
        pushAbilityKeystoneFx(world, player, definition, { at: minion.hasPosition.current, durationMs: mend.remainingMs });
      }
    });
  },
});
