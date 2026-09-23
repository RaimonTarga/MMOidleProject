# Encounter counterplay 01 — prepared, unrun

**24/24 packages qualified; 24/24 exact zero-tick receipt replays; zero combat launched.** All six comparisons are runnable. The executable queue remains external at `D:/mmo-idle/encounter-counterplay-01/packet`, with frozen checkout `D:/mmo-idle/encounter-counterplay-01/source` at `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad`. Use `LUNA_RUN.md` for execution and publication. The label `candidate` means the specified player-loadout treatment; both labels use the identical execution source.

## Preparation findings

1. Spirit is adopted and pushed on develop at `d073dc19c4f9df9c90b4661899d2454972b2c5b3`. Conduit remains held. See `ADOPTION.md` and the isolated patch.
2. All 12 controls exactly reproduce their original overnight declared packages, paid progression, equipment/upgrades, skill paths, mastery and RP receipts. Only the six declared treatment deltas are present. This establishes construction, not encounter success.
3. The Jungle armor exchange is a whole-item treatment: J1 HP/plating changes 340/23 -> 354/29; J2 330/22 -> 344/29, with +3 armor retained. Authored passives are preserved in the full composed views. V1 changes stance only. P1 costs 17 -> 22/30 RP; M1 28 -> 34/37; E1 stays 36/37. J1/J2/V1 remain 22/36, 25/36 and 24/36 respectively.
4. E1 has legal paid Detonate and Fully Afflicted ownership. The native predicate reads the actual target's owned stacking DoT state (`dotInventory.ts` / `runeConfig.ts`). In `abilityFiring.ts`, a custom rule replaces the default only for its named ability. Removing the Brace rule therefore restores native Brace timing, while Second Wind and Endure remain unchanged. No private timing or stack grant is installed. Actual use and useful impact remain unmeasured.
5. The bounded Conduit read shows payment/safety-floor pressure, depleted formation and a Guard cooldown gap under enemy overlap; it does not isolate a safe new timer. `CONDUIT_FINDING.md` retains the baseline. The T4 catalogue enumerates exactly 54 production specializations; its separate plan remains unapproved and unlaunched.

## Execution source versus history

`SOURCE_DIFF.patch` records every production-source difference from the historical overnight source. The Spirit change is approved. Current committed Heat has 1x out-of-combat cooling instead of the historical 2x; current committed ability Slow also affects attack cadence, unlike the historical movement-only helper. None of these six packages attunes Hamstring. This packet uses one fixed committed baseline for both arms, retains accepted committed work, and excludes the active uncommitted Heat/Hamstring/UI changes. Do not transplant historical outcomes or edit the source during execution. The stance comparison still asks the same mitigation/pressure question under this explicitly different cooling baseline.

The fixed-mastery World/rewards opt-in and prior-paid-snapshot bench helpers were reused from the historical harness. Live worlds leave that set empty. Bosses are resolved from production dungeon definitions: Plains `gorging-razortusk`, Mountain `crag-gorged-horn-behemoth`, Volcano `cinder-shell-magma-salamander`; fixture IDs and exact references are in `ORDERED_CASES.tsv`. Dungeon access is synthetically prepared, not earned/guardian combat evidence.

## Next decisions (maximum three)

1. Assign Luna the one-shot 24-observation queue. No treatment effect has yet been measured.
2. After measurement, disposition each priority as retain reference, propose one exact supported correction, or ask one specific designer question; no automatic rescue grid. Keep root Conduit at the current baseline unless separately directed.
3. Approve or revise the proposed T4 checkpoint, fixtures, seeds and path support plan before any T4 run. The class pass remains open until all 54 paths receive credible coverage and remaining failures are explicitly dispositioned.

Checks passed: workspace/bench typecheck, shared build, packet identity verification, exact historical-control comparisons, treatment-delta checks, Spirit/Conduit readbacks, actual-child zero-tick qualification and exact receipt replay. General test suite and live browser play were not run. Synthetic paid ownership proves legal construction, not farming time or typical affordability.

Combat counts: planned 24; completed 0; gameplay deaths 0; operational failures 0; omitted 0; not-run 24. Qualification's `notRun:0` means all construction rows qualified, not that combat ran.
