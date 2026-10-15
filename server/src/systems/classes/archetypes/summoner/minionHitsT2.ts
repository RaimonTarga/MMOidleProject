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
import { getStatusEffect } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyHealToMinion } from '../../../defense/regen/healing';
import { applyStun } from '../../../combat/status/stun';
import { BARK_EFFECT_ID, pieceOfSlot, RANGED_ENEMY_REACH } from './summonPiecesT2';
import { holdHibernated, shieldWall, t3RefundShare } from './summonPiecesT3';

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
  if (minion.hasHealth.hp <= 0) return;
  const piece = pieceOfSlot(minion.isMinion.slotId);

  // Ironhorn braces: the charge ends here, and the charger is stunned.
  const stunMs = piece?.params.braceStunMs ?? 0;
  if (stunMs > 0 && (monster.controlsMonster.chargeRemainingMs ?? 0) > 0) {
    monster.controlsMonster.chargeRemainingMs = 0;
    applyStun(monster.tracksCombat, stunMs, minion.isMinion.id);
  }

  // Part of the hit comes back: a held bark, and Sandveil against a ranged enemy.
  let refundShare = getStatusEffect(minion.tracksCombat, BARK_EFFECT_ID)?.data['absorbPct'] ?? 0;
  const sandveil = owner.usesSkills.passives['conduit.sandveil-pct'] ?? 0;
  if (sandveil > 0 && (monster.performsAttack?.attackRange ?? 0) > RANGED_ENEMY_REACH) refundShare += sandveil;
  // T3: Sporecaller's spores on the attacker, and the Carapace Guard's shield.
  refundShare += t3RefundShare(world, owner, monster, minion);
  if (refundShare > 0) {
    applyHealToMinion(minion, owner.isPlayer.id, estimatedDamage(monster, minion) * Math.min(0.9, refundShare), world);
  }
}
