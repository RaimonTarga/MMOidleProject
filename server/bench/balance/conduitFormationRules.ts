/**
 * Opt-in Conduit rune template for bench cells (2026-09-26), mirroring the bot
 * routes' `routeWithClassRecovery`: Rebuild Formation (`wait-for-summons`) takes
 * Recover First's slot on the same condition, at the same 1 RP, so a Conduit
 * goes into each pull with a whole formation rather than full owner HP.
 *
 * Deliberately NOT applied by `materializeBot`/`prepareSurveyBot` by default:
 * existing frozen packets must keep reproducing. A spec opts in per cell or arm.
 * Expected to help (unmeasured): chained pulls/farming more than single fights.
 */
export function withConduitFormationRules<T extends { conditionId: string; actionId: string }>(
  rules: readonly T[],
): T[] {
  return rules.map((rule) => rule.actionId === 'wait-for-regen' ? { ...rule, actionId: 'wait-for-summons' } : rule);
}
