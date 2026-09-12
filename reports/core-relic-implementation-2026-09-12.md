# Core and Relic corrections — 2026-09-12

## Implemented

- Cadence frequency uses `max(2, round(base attacks / (1 + frequency)))`, after Rampage. Count potency uses coefficient 1. Integer plateaus remain intentional; no relic values were inflated to force a breakpoint.
- Melter uses potency for maximum heat and frequency for full cooling time. Heat HUD percentages normalize against actual capacity. Increasing capacity does not lengthen a full cooling cycle.
- Conduit resolves its current formation. Ordinary formations gain/lose bodies without diluting each body's contribution. Fixed companions scale damage and health, preserving roles and proc frequency.
- Poison Explosion and Eternal Doom consume relic-adjusted stack caps in delivery and the HUD.
- Catalyst scales designated on-hit damage from ordinary attacks, laser ticks, Frenzy, Flow and Binary Cycle. Shared calculations preserve shot/formation weighting and raw stored stats.
- Inventory and character-sheet on-hit values include Catalyst. Inventory swaps rebuild Core effects and tradeoffs through shared server stat formulas.
- Inventory, Forge and map relic previews compare current equipment against the candidate and show concrete class effects, including unchanged breakpoints and registered buff/debuff magnitudes. Flash uses its own energy gain; specializations without discharge no longer advertise one.
- DPS estimates include primary relic delivery and Catalyst, laser cooling, and consistent fully reconstructed summon formations for comparisons.

## Design recommendation, not implemented

Core stat multipliers already compose as a separate layer after class multipliers. Their weakness on some builds is an affected-damage-channel issue rather than additive dilution. Broad offensive Cores and stances would be clearer as final damage-dealt multipliers covering direct, on-hit and DoT damage. Keep specialist identities such as Catalyst's on-hit amplification and Controller's debuff strength. Defensive damage-taken modifiers should compose multiplicatively with existing mitigation, never add to ordinary percent DR. This larger change needs explicit per-Core/stance tuning and source-ownership rules before implementation.

## Verification and limits

- `pnpm typecheck`: passed, including benchmark tooling.
- `pnpm --filter @mmo-idle/server exec tsx --conditions=development test/coreRelicIntegration.test.ts`: passed against current shared source.
- Integration coverage includes all 48 root/relic combinations, positive/negative Melter capacity and cooling, fixed formations, Catalyst's five designated channels, and class-specific preview text.
- `pnpm test`: **180/180 suites passed**; output in `core-relic-implementation-tests.txt`. The final focused integration test and typecheck also passed after the last preview refinements.
- No live visual playtest or balance sweep was performed. DPS remains an estimate; it does not simulate every transient specialization buff, ramp, phase or proc. This is not certification of equal relic value across classes.
- The earlier `core-relic-validation-2026-09-12.md` preserves the original pre-fix evidence.
