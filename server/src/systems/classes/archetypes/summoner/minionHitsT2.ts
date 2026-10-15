/**
 * The T2 reactions to a monster's hit on a summon (T2-CONDUIT; bible §7.16): Ironhorn's brace,
 * Barkward's bark and Sandveil. `runMonsterAttackOnMinion` skips the combat pipeline and is not
 * ours to edit, so these run from `onMinionStruck`, after the damage has landed:
 *
 * - Ironhorn: a charge that hits it stops dead and the charger is stunned for a moment.
 * - Barkward's bark and Sandveil take part of the hit back. The damage is rebuilt from the
 *   monster's attack, the summon's plating and DR (the multipliers the engine also applies are
 *   not known here), so this is a close stand-in rather than an exact absorb.
 */
import { CONDUIT_LEAF_TUNING, CONDUIT_SOUL_T4_TUNING as SOUL4, getResource, getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { pushDamageEvent } from '../../../combat/damage/damageEvent';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { applyStun } from '../../../combat/status/stun';
import { BARK_EFFECT_ID, pieceOfSlot, RANGED_ENEMY_REACH } from './summonPiecesT2';
import { holdHibernated, shieldWall, t3RefundShare } from './summonPiecesT3';
import { holdLastStand, lastStandSaves } from './leavesT4';
import { lineagePower } from './souls';
import { fightSeconds } from './t3Shared';
import { hasLeaf, ICE_SHELL_EFFECT_ID, TICK_NOW, WITHDRAW_EFFECT_ID } from './t4Shared';

/** What the hit most likely cost the summon, from the numbers the monster hit with. */
function estimatedDamage(monster: MonsterEntity, minion: MinionEntity): number {
  const afterPlating = Math.max(0, monster.dealsDamage.attack - minion.mitigatesDamage.plating);
  return Math.max(1, Math.round(afterPlating * (1 - minion.mitigatesDamage.damageReduction)));
}

export function onMinionStruckT2(world: World, owner: PlayerEntity, monster: MonsterEntity, minion: MinionEntity): void {
  // Hibernate (T3): a summon in its ice takes nothing from the hit.
  if (holdHibernated(world, minion)) return;
  // Shield Wall (T3): a tank's damage is split across your tanks (before the death check: the split can save it).
  shieldWall(world, owner, minion, estimatedDamage(monster, minion));
  // Last Stand (T4 leaf): an elite that would die holds at 1 HP, once a fight; while it holds, nothing takes the last point.
  if (holdLastStand(world, minion)) return;
  if (minion.hasHealth.hp <= 0 && !lastStandSaves(world, owner, minion)) return;
  const piece = pieceOfSlot(minion.isMinion.slotId);

  // Ironhorn braces: the charge ends here, and the charger is stunned.
  const stunMs = piece?.params.braceStunMs ?? 0;
  if (stunMs > 0 && (monster.controlsMonster.chargeRemainingMs ?? 0) > 0) {
    monster.controlsMonster.chargeRemainingMs = 0;
    applyStun(monster.tracksCombat, stunMs, minion.isMinion.id);
  }

  // What the hit most likely cost the summon; each line below takes its share of what is left.
  let remaining = estimatedDamage(monster, minion);
  const take = (amount: number): void => {
    const taken = Math.min(remaining, Math.max(0, amount));
    if (taken > 0) applyHealToMinion(minion, owner.isPlayer.id, taken, world);
    remaining -= taken;
  };

  // Icewarden's ice shell soaks damage until it is used up (T4).
  const shell = getStatusEffect(minion.tracksCombat, ICE_SHELL_EFFECT_ID);
  if (shell) {
    const soaked = Math.min(remaining, shell.data['shield'] ?? 0);
    take(soaked);
    shell.data['shield'] = (shell.data['shield'] ?? 0) - soaked;
    if ((shell.data['shield'] ?? 0) <= 0) removeStatusEffect(minion.tracksCombat, ICE_SHELL_EFFECT_ID);
  }
  // The Obsidian Tortoise withdrawn into its shell takes almost nothing (T4).
  const withdrawn = getStatusEffect(minion.tracksCombat, WITHDRAW_EFFECT_ID);
  if (withdrawn) take(remaining * (withdrawn.data['block'] ?? 0));

  // Part of the hit comes back: a held bark, and Sandveil against a ranged enemy.
  let refundShare = getStatusEffect(minion.tracksCombat, BARK_EFFECT_ID)?.data['absorbPct'] ?? 0;
  const sandveil = owner.usesSkills.passives['conduit.sandveil-pct'] ?? 0;
  if (sandveil > 0 && (monster.performsAttack?.attackRange ?? 0) > RANGED_ENEMY_REACH) refundShare += sandveil;
  // T3: Sporecaller's spores on the attacker, and the Carapace Guard's shield.
  refundShare += t3RefundShare(world, owner, monster, minion);
  // T4: the Elder Serpent Soul toughens the summons the longer the fight goes.
  const serpent = lineagePower(owner, 'trench');
  if (serpent > 0) {
    const steps = Math.min(SOUL4.toughMaxSteps, Math.floor(fightSeconds(owner, getResource(owner.tracksCombat, TICK_NOW)) / SOUL4.toughStepSec));
    refundShare += SOUL4.toughPerStep * steps * serpent;
  }
  if (refundShare > 0) take(remaining * Math.min(0.9, refundShare));

  // Shared Burden (Elite leaf): part of what the elite took is paid out of your health (never your last point).
  if (hasLeaf(owner, 'conduit-shared-burden')) {
    const paid = Math.min(remaining * CONDUIT_LEAF_TUNING.sharedBurdenShare, Math.max(0, owner.hasHealth.hp - 1));
    if (paid > 0) {
      take(paid);
      owner.hasHealth.hp -= paid;
      markSliceDirty(world, owner, 'hasHealth');
      pushDamageEvent(world, owner, paid);
    }
  }
}
