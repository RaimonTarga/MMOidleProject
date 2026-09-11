# Runic attunement — current state

Runic Points reserve the active build: attuned abilities, attuned stances, Rune logic, and Rites. Learning remains permanent. No ability or stance count is capped by tier.

## State and authority

`TracksProgression.attunedAbilities` contains ordered `techniques` and `guards` lists. These are semantic combat families, not capacity slots. Keeping their ordering preserves each family's default arbitration. `AbilityFamily` names that distinction; ability definitions retain `slot` as their family field to avoid unrelated changes to effect/scaling consumers.

`attunedStances` reserves learned postures. `equippedStances.default` selects an attuned posture or null. `activeStance` remains authoritative runtime state. Neutral needs no reservation.

`runicPoints.ts` is the shared cost authority. Every normal editing path supplies all four categories. Duplicate attunements are counted once. Server edits validate learning, real IDs, target attunement, and the combined budget. Unattuning a tool removes its dependent rules; clearing a default follows stance removal. The UI explains these effects before submission and reports server rejection reasons.

## Economy seeds

- Capacity: `RUNE_POINT_BASE = 16`, plus one RP per `RUNE_POINT_GLOBAL_MASTERY_STEP = 5`. Global Mastery is the sole progression input.
- Ability reservation: `AbilityDef.attunementCost`, authored independently of ranks/tier, currently 3–7 RP. Cleanse and Break Free cost 3; Second Wind costs 6. Broader throughput generally costs 5–7.
- Stance reservation: existing `StanceDef.runeCost`, paid once per attuned stance. Default selection and repeated switching do not repay it.
- Use Ability logic: condition + action (action seed 1 RP). Switch Stance logic: condition only (action remains 0 RP).
- Rites: existing prices, effects and acquisition unchanged.

These are balance seeds. No mechanic assumes the five-mastery step, and pricing changes need no systems rewrite.

## Execution

A `use-ability` rule carries `targetAbilityId`. Any custom rule for an ability suppresses its authored default trigger even when no condition matches. Without custom rules the ability uses its existing default behavior at no extra logic cost.

Active custom targets are considered in Rune order, then remaining abilities in attunement order. Ordinary Techniques share one armed/cast/charge opportunity. Instant self-facing Techniques remain non-blocking and can activate even after an ordinary Technique claims that opportunity. Guards resolve at most one activation per 100 ms decision window; ongoing effects overlap. Cooldowns, interruption, ability targeting, ranks and damage mechanics are unchanged.

Guard effect and Recovery identities follow the authored ability, never its current list position. The existing effect IDs and Recovery storage keys are retained for their existing abilities.

Stance reconciliation switches only to attuned destinations and otherwise returns to the attuned default, using the existing dwell/cooldown rules.

## Persistence and compatibility

`attunementMigration.ts` is the sole boundary for old ability slot rules. It reads legacy singular or family-array equipped abilities, maps each old action to the actual saved slot before removing holes/stale entries, migrates renamed IDs, preserves rule priority, and discards orphan rules. Existing default and valid automated stance destinations become attuned. Learned progression survives; new saves write the current shape. Whole-slice JSON persistence requires no SQL schema change.

Login sanitizes invalid IDs/targets but never trims valid choices to fit a changed economy and never replaces an intentionally empty Rune list. Existing over-budget configurations remain active and visibly marked. Edits must fit the current budget or strictly reduce total reservation; this permits incremental repair without silent deletion. Normal edits cannot expand an over-budget configuration.

Legacy bot/profile artifacts must be updated to the current contract before a new controlled experiment. Historical results are not evidence for this RP economy. Live bot/admin paths use combined RP costs; route replacement steps retain their deliberate replacement policy without imposing a player capacity cap.

## UI and verification

The Rune board retains its priority tracks and condition/action editor, with named ability targets and Rune overrides. Attunement is managed in the dedicated Abilities and Stances tabs; the redundant inline sections and illustrative preview controls have been removed. The dialog no longer offers an expand-width toggle.

Abilities use one compact learned collection without family headings, with attuned abilities sorted first and marked by green borders. Selecting an ability expands its current tier/rank numbers through the existing ability description formatter, including current bonuses and focus/hover explanations. Authored default behavior remains visible on collapsed entries. Selection and attunement have distinct visual states. Stances use equally sized crest cards with attuned choices sorted first, separate default and active indicators, and themed controls. The Abilities, Stances, Rites and Runes tabs share a colored, segmented RP bar and numerical legend for abilities, stances, logic, Rites and available capacity; this is presentation only, using the unchanged shared calculation.

Regression coverage includes shared pricing, migration/round trips, orphan handling, invalid targets, independent same-condition rules, unlimited family lengths within RP, default suppression, instant Technique behavior, Rune priority, server rejection, incremental repair, and client/server cost projection. Existing combat and progression suites continue to cover effects and acquisition.

Validation completed: all 169 test suites passed using the repository's test commands and discovery list, followed by seven targeted checks after the final runtime and snapshot adjustments. `pnpm typecheck` and `pnpm build` passed. A preview using the actual UI components passed desktop/mobile smoke and layout audits at 1366×768 and 390×844; this was a fixture preview, not an authenticated gameplay session.

Balance-only follow-up: tune the capacity curve and authored prices against real builds. Individual stance, Rite and ability mechanics remain separate design work.
