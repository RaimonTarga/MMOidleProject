# Guard coverage 01 — prepared, not executed

Start with [LUNA_RUN.md](LUNA_RUN.md). **32 cells qualified with zero combat; 32 new observations planned, zero reused, failed or omitted.** User selected the 32-cell Endure brief over the conflicting 20-cell Recuperate brief. The 20-cell matrix is not included.

The complete measured session fix is integrated on develop in `214d28cd4375bd179219fe5964785df4978e3df6` (parent `5b1305c33817d248648125e67dcb35d5d07e6b0a`). Its five files exactly match tested candidate `f021845bd18f43c032e8044a60af071868000e80`; [INTEGRATION.patch](INTEGRATION.patch) contains only the production change and existing test. Patch format is unified=0, apply with `git apply --unidiff-zero`. Normal R2 remains applied once. No gameplay coefficient, enemy shield value, or reconstruction cost changed. No deployment was performed.

Frozen execution source: `15aef70b72bc0eead1511a32a93f72a97299ea7c` at `D:/mmo-idle/guard-coverage-01/source`. The second commit adds only fixed experiment declarations, dispatcher routing, read-only Guard capture and focused tests. All arms use this common source. Historical source identities and previous report remain intact.

| Package | Arms | Cells | Initial HP / barrier / Recovery |
|---|---|---:|---|
| Berserker, Striker Heavy A | Inferno static / Inferno + Endure | 8 | 674 / 0 / 26 |
| Juggernaut, Striker Heavy C | Inferno static / Inferno + Endure | 8 | 674 / 0 / 26 |
| Champion, Conduit Heavy B | Mountain static / Mountain + Endure / Inferno static / Inferno + Endure | 16 | Mountain 568 / 239 / 25; Inferno 568 / 0 / 34 |

Every arm uses the exact preceding B equipment, ranks, Offensive Stance, close range, and Rune policy. [PACKAGE_EQUIVALENCE.json](PACKAGE_EQUIVALENCE.json) verifies historical equipment, mastery, rites, skills, profile, initial roster and sustain state, excluding the explicitly changed RP reservation. Controls use 40/47 RP; Endure arms use 46/47. Synthetic +5 evolution and native learnability gates pass. Endure needs Desert mastery 5; these receipts have 18. Actual equipped order is Second Wind, Brace, Cleanse, then Endure for candidates; no technique is removed.

Resolved Endure is **32.8% DR for 10 seconds, 14-second cooldown** in these packages, after equipment potency. Brace is 73.8% for 3.5 seconds, 10-second cooldown. Their Guard-layer overlap is multiplicative, `1 - (1 - 0.738) * (1 - 0.328) = 82.3936%`, before other damage processing and rounding; this is not total final mitigation. Default thresholds: Second Wind 60%, Brace 50%, Endure 70%. One Guard activation per 100 ms decision window means earlier eligible Guards postpone Endure; hard control can postpone it too. The observer measures actual casts and sampled windows, not predicted uptime.

[DEATH_MECHANISMS.md](DEATH_MECHANISMS.md) records the bounded prior-evidence review, including the observed Champion 418 HP payment. [REFERENCE_DISPOSITIONS.json](REFERENCE_DISPOSITIONS.json) preserves exact preferred Graveyard Strikers, improved/not-endurance-cleared Apprentice, and both Champion alternatives. These are references, not global gameplay defaults.

[CHECKS.json](CHECKS.json) records focused checks, typechecking and relevant builds. Full repository suite and live playtest were not run. The frozen dispatcher passed source/runtime/hitbox/manifest verification and all 32 zero-tick production-child receipts. Qualification returns before the combat loop. No run marker or run output exists.

Raw execution histories stay external. The new opt-in observer records 100ms pre/post states plus synchronous incoming-pipeline state; existing activation/damage/death streams remain authoritative. Pipeline damage is not HP damage. Non-pipeline damage and source-specific effective healing are not reconstructed. The final report must preserve these limits and follow [REPORT_CONTRACT.json](REPORT_CONTRACT.json).
