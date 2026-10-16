import {
  CONDUIT_DISCIPLINE_TUNING,
  CONDUIT_KIT,
  CONDUIT_SPECIALIZATION_TUNING,
  resolveSummonerProfile,
  summonerProfileWeightTotals,
  type RosterBody,
  type SummonerProfile,
  type SummonerSlotProfile,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';
import { SOUL_BODY, soulPower, soulsOf } from './souls';
import { disciplineOf } from './disciplines';
import { specializationOf } from './t3Shared';

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
  // Elite (§7.5): modest bulk and stats on every summon. Longshot (T2 weapon): ranged hit harder, melee softer.
  const elite = disciplineOf(owner) === 'conduit-elite';
  // Colossus (T3, §7.6): +100% HP and +50% damage over the BASE summon, in place of Elite's own step.
  const colossus = elite && specializationOf(owner) === 'conduit-colossus';
  const eliteHp = colossus ? CONDUIT_SPECIALIZATION_TUNING.colossusHpMult : elite ? CONDUIT_DISCIPLINE_TUNING.eliteHpMult : 1;
  const eliteDamage = colossus ? CONDUIT_SPECIALIZATION_TUNING.colossusDamageMult : elite ? CONDUIT_DISCIPLINE_TUNING.eliteDamageMult : 1;
  const legion = specializationOf(owner) === 'conduit-legion';
  const longshot = passives['conduit.longshot-pct'] ?? 0;
  const system = owner.configuresClass?.config.system;
  if (system?.kind !== 'formation') return undefined;
  const bodies: RosterBody[] = [];
  for (const id of system.roster) {
    const piece = CONDUIT_KIT.pieces.find((candidate) => candidate.id === id);
    if (!piece) continue;
    // Legion (T3, §7.6): at visible copy counts, every copy of that summon is stronger.
    const copies = legion ? system.roster.filter((other) => other === id).length : 0;
    const step = CONDUIT_SPECIALIZATION_TUNING.legionSteps.filter((entry) => copies >= entry.copies).pop();
    const legionHp = 1 + (step?.hpPct ?? 0);
    const legionDamage = 1 + (step?.damagePct ?? 0);
    bodies.push({
      pieceId: piece.id,
      family: piece.family,
      command: piece.command,
      mode: piece.mode,
      row: piece.row,
      body: piece.body,
      hpMult: (piece.params.hpMult ?? 1) * hpMult * eliteHp * legionHp,
      damageMult: (piece.params.damageMult ?? 1) * damageMult * eliteDamage * legionDamage
        * (piece.mode === 'ranged' ? 1 + longshot : piece.mode === 'melee' ? Math.max(0, 1 - longshot) : 1),
      cooldownMult: (piece.params.cooldownMult ?? 1) * cooldownMult,
    });
  }
  // The Soul in the relic slot is a free body (0 Command) wearing its own stand-in body.
  for (const soul of bodies.length > 0 ? soulsOf(owner) : []) {
    bodies.push({
      pieceId: soul.id,
      family: 'damage',
      command: 0,
      mode: 'melee',
      row: 'middle',
      body: soul.body,
      hpMult: SOUL_BODY.hpMult * hpMult * soulPower(owner, soul),
      damageMult: SOUL_BODY.damageMult * damageMult * soulPower(owner, soul),
      cooldownMult,
    });
  }
  return bodies;
}

/** A slot's attack range: its mode's range, and the Longshot weapon pushes a ranged body further back. */
export function slotAttackRange(owner: PlayerEntity, slot: SummonerSlotProfile, profile: SummonerProfile): number {
  const range = slot.attackRange ?? profile.attackRange;
  const longshot = owner.usesSkills.passives['conduit.longshot-pct'] ?? 0;
  return slot.mode === 'ranged' && longshot > 0 ? Math.round(range * (1 + 2 * longshot)) : range;
}

/**
 * How a body's share of the Conduit's HP and attack follows Command. OV-CONDUIT (PLACEHOLDER,
 * for review): the shared profile splits ONE pie by Command over the whole roster, so every
 * Command step (§7.2) only cut the formation into more, smaller bodies: no power, more plating
 * lost per hit, and a T2 boss slam wiped eight 22-73 HP bodies at once. Here a body's share is
 * its Command over `reference * (total / reference) ^ exponent`: at the starting Command (4)
 * nothing changes; exponent 1 is the old pie, 0 a fixed size per Command (power ∝ Command),
 * 0.5 power ∝ √Command, so "the cost buys power" (§7.2) with diminishing returns. The roster's
 * body cap bounds it. The proc weight stays a share of the whole (techniques).
 */
export const CONDUIT_COMMAND_SCALING = { reference: 4, exponent: 0.5 };

export function summonerProfileFor(owner: PlayerEntity): SummonerProfile {
  const profile = resolveSummonerProfile({
    roster: rosterOf(owner),
    selectedSubVariant: owner.usesSkills.selectedSubVariant,
    selectedRange: owner.usesSkills.selectedRange,
    unlockedSkills: owner.usesSkills.unlockedSkills,
    passives: owner.usesSkills.passives,
  });
  const commandOf = (pieceId: string | undefined) => (pieceId ? (CONDUIT_KIT.pieces.find((piece) => piece.id === pieceId)?.command ?? 0) : 0);
  const total = profile.slots.reduce((sum, slot) => sum + commandOf(slot.pieceId), 0);
  const { reference, exponent } = CONDUIT_COMMAND_SCALING;
  const pie = total > 0 ? reference * (total / reference) ** exponent : reference;
  for (const slot of profile.slots) {
    const command = commandOf(slot.pieceId);
    const weight = (command > 0 ? command : 1) / pie;
    slot.offenseWeight = weight;
    slot.defenseWeight = weight;
  }
  return profile;
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
