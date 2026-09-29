import type { EquippedRule } from '../../runeDatabase';

/**
 * The guide's Rune loadouts, one per stage of Tier 1.
 *
 * Same shape as the bot's controlled profiles (`controlledT1Runes` in
 * bot/src/routes/t1RouteBuilder.ts), plus the two survival rules the default
 * loadout ships with, because the guide plays slow and safe:
 *
 * - `hp-below-25 → flee` sits ABOVE chase/orbit, until Step Back replaces it
 *   in the Cave. Movement is first-rule-wins, so below them (where the default
 *   loadout has it) it could never fire in a fight.
 * - `while-traveling → fight-back` keeps the player from being chased across a
 *   whole trip by something it could just kill.
 *
 * Ability wiring (`use-ability`) is not listed here: the director and the bot
 * both append each attuned ability's reference rule.
 */

export type TutorialMovement = 'melee' | 'ranged';

export type TutorialRuneStage =
  /** From the class pick: no hazard pathing, no dodging yet. */
  | 'opening'
  /** From Swamp: Avoid Hazards. */
  | 'hazards'
  /** Ranged from Mountain L3: Orbit replaces chase. */
  | 'orbit'
  /** From Cave L2: Step Back ahead of everything else that moves. */
  | 'final';

export function tutorialRunes(
  movement: TutorialMovement,
  stage: TutorialRuneStage,
  classRoot: string,
): EquippedRule[] {
  const rules: EquippedRule[] = [{ conditionId: 'always', actionId: 'auto-path-enemy' }];
  if (stage === 'final') rules.push({ conditionId: 'inside-telegraph', actionId: 'step-back' });
  // From the Cave on, Step Back is the safety tool, and the 2 RP flee costs do
  // not fit beside it and two abilities (ranged builds would be over budget
  // even at Global Mastery 30). The bot's final loadout makes the same call.
  else rules.push({ conditionId: 'hp-below-25', actionId: 'flee' });
  const orbiting = movement === 'ranged' && (stage === 'orbit' || stage === 'final');
  rules.push({ conditionId: 'in-combat', actionId: orbiting ? 'orbit' : 'chase-enemy' });
  if (stage !== 'opening') rules.push({ conditionId: 'always', actionId: 'avoid-hazards' });
  // A Conduit is ready for the next pull when its formation is, not its HP
  // (the bot's `withClassRecovery`, designer call 2026-09-26).
  rules.push({
    conditionId: 'always',
    actionId: classRoot === 'summoner-root' ? 'wait-for-summons' : 'wait-for-regen',
  });
  rules.push({ conditionId: 'while-traveling', actionId: 'fight-back' });
  return rules;
}
