import {
  CONDUIT_KIT,
  resolveSummonerProfile,
  summonerProfileWeightTotals,
  type RosterBody,
  type SummonerProfile,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';
import { SOUL_BODY, soulOf } from './souls';

/**
 * The Formation's roster (class-first §7.3), resolved from the class config: one body per roster
 * entry, from its kit piece. Undefined when the Conduit has no Formation config (the old
 * frame/range path then applies until it is deleted).
 */
function rosterOf(owner: PlayerEntity): readonly RosterBody[] | undefined {
  const passives = owner.usesSkills.passives;
  const damageMult = 1 + (passives['conduit.damage-pct'] ?? 0);
  const hpMult = 1 + (passives['conduit.hp-pct'] ?? 0);
  const cooldownMult = 1 + (passives['conduit.cooldown-pct'] ?? 0);
  const system = owner.configuresClass?.config.system;
  if (system?.kind !== 'formation') return undefined;
  const bodies: RosterBody[] = [];
  for (const id of system.roster) {
    const piece = CONDUIT_KIT.pieces.find((candidate) => candidate.id === id);
    if (!piece) continue;
    bodies.push({
      pieceId: piece.id,
      family: piece.family,
      command: piece.command,
      mode: piece.mode,
      row: piece.row,
      body: piece.body,
      hpMult: (piece.params.hpMult ?? 1) * hpMult,
      damageMult: (piece.params.damageMult ?? 1) * damageMult,
      cooldownMult: (piece.params.cooldownMult ?? 1) * cooldownMult,
    });
  }
  // The Soul in the relic slot is a free body (0 Command) wearing its own stand-in body.
  const soul = soulOf(owner);
  if (soul && bodies.length > 0) {
    bodies.push({
      pieceId: soul.id,
      family: 'damage',
      command: 0,
      mode: 'melee',
      row: 'middle',
      body: soul.body,
      hpMult: SOUL_BODY.hpMult * hpMult,
      damageMult: SOUL_BODY.damageMult * damageMult,
      cooldownMult,
    });
  }
  return bodies;
}

export function summonerProfileFor(owner: PlayerEntity): SummonerProfile {
  return resolveSummonerProfile({
    roster: rosterOf(owner),
    selectedSubVariant: owner.usesSkills.selectedSubVariant,
    selectedRange: owner.usesSkills.selectedRange,
    unlockedSkills: owner.usesSkills.unlockedSkills,
    passives: owner.usesSkills.passives,
  });
}

/** Every Conduit with summons delivers Techniques through the formation. None fights directly. */
export function usesSummonTechniques(owner: PlayerEntity): boolean {
  return !!owner.summonsMinions;
}


/**
 * One body's share of a single logical formation attack: its raw slot weight
 * over the whole AUTHORED formation's.
 *
 * A complete formation delivering one attack each therefore totals exactly 1.0
 * however many bodies it has — a relic-expanded army fires more often but each
 * shot is worth proportionally less, so more summons can never multiply a
 * cadence-normalized mechanic. Conversely a formation fighting bodies down
 * simply never delivers those shares: the survivors are not scaled up to cover
 * for the dead, which is what keeps a broken formation a real loss.
 *
 * Lives here rather than beside its caller in `formationAttack.ts` because
 * `combat.ts` needs it too for the bonded Conduit's own attacks, and
 * `formationAttack.ts` already imports `runPlayerAttack` from `combat.ts`.
 */
export function formationTempoWeight(
  profile: SummonerProfile,
  slotProcWeight: number,
): number {
  const total = summonerProfileWeightTotals(profile).proc;
  return total > 0 ? Math.max(0, slotProcWeight) / total : 0;
}
