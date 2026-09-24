# Exact proposals — not adopted

Baseline `1980a6b06d6b483c0310ee86d9e2d464dedba8df`. Frozen experimental source `0d392fdddaec7ed31876699589f291c8c840a5e5`. All effects below remain unmeasured in this packet. Four proposals, no quota of further changes.

| Proposal | Current -> candidate | Authoring / consumer | Scope, gate and disposition |
|---|---|---|---|
| D | Desert T2/T3/T4 kiting .20/.30/.40 -> .20/.25/.30 | `desert.recipes.ts`, `mobility.kite-speed-pct`; `mobilityBoots.ts::bootSpeedMultiplier` | Original Desert recipe/evolution gates, all upgrades and flat speed unchanged. Two T4 kiting packages, 8 lives. Needs bounded confirmation; T3 numerical policy extrapolation remains unmeasured. |
| S | T1 unchanged; T2 .45 -> .40, upgrade deltas .03/.03/.02/.03/.02 -> .02 each; T3 .62 -> .50, .02 deltas unchanged | `swamp.recipes.ts`, `mobility.slow-resistance`; `slowResistedMult` | T2 +4 .56 -> .48; T3 +3 .68 -> .56 in assigned snapshots. At +5 T1/T2/T3 = .40/.50/.60. Swamp gates and speed unchanged. 8 lives. Needs bounded confirmation. |
| A | Technique power .20 -> .30; cooldown reduction .20 unchanged | `mountain.recipes.ts::core-arcanist`, `resolveAbilityEffect`, `modifiedAbilityCooldownMs` | T3 Mountain18, unrestricted, +0. Reverb and Idolwright compare current/candidate/Tempered, 12 lives. No Guard, cast speed, eligibility or autonomous class-mechanic buff. Needs bounded confirmation. |
| Blood Offering | Active 5% max-HP per credited kill and 3 RP -> retired, no effect/charge | `rites.ts`, `riteRecipes.ts`, `riteOoc.ts`, `playerRepo.ts` | Independent branch `codex/retire-blood-offering-01`, commit `ed8f0b5a141d3e15109f9b25b1fa943b26f089a3`. Acquisition blocked, saved IDs cannot heal/equip, known acquisition retained, no compensation. Implementation checks pass; ready for designer adoption review, not merged. |

`proposals/D.patch`, `S.patch`, `A.patch` are exact reviewable recipe diffs. The frozen experiment installs the corresponding compiled ItemDefinition fields in a child-local test overlay before normal stat recalculation, then restores them. It changes only the targeted equipped item. The source receipt records this code; each applied receipt includes candidate ID and resolved passives. Controls and Tempered receive no overlay. Production recipes in the experimental branch remain baseline; these diffs are NOT already applied to production.

D is a design curve preference, not proof of excessive current speed. In an always-active isolated multiplier example, 1.40 -> 1.30 is a 7.14% speed reduction, not a 25% total-speed reduction. Actual uptime/other effects alter this.

S preserves soft-slow identity and predecessor +5 -> successor +0 utility continuity. A 50% incoming soft slow with T2 +4 changes the movement multiplier .78 -> .74; T3 +3 changes .84 -> .78. Assumes one soft-slow multiplier and no other resistance. Roots remain roots. T1 is a counterexample to blanket flattening and stays unchanged. Lower resistance may impair escape; no class/enemy or base-speed compensation is proposed.

A multiplies eligible Technique payload by 1.30/1.20 = 1.08333 relative to current Arcanist. The ideal cooldown-limited payload factors are 1.50 and 1.625; neither is whole-build DPS. If a 1.6s cast and an 8s post-resolution cooldown are the only constraints, cycle time is 9.6s, not 8s. Target loss, defense, competing casts, interrupts, summon availability and rounding remain material. Tempered is a whole-core comparator with its own damage/HP contribution.

No ability price/number patch, extra boots normalization, inverse Accelerant, new T4 item or Heat patch is proposed for adoption here. Historical results are counterexamples to universal weapon/relic rankings, not fresh controls.
