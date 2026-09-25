# Defense redesign: implementation and bot experiment

Date: 2026-09-25. Candidate branch: `codex/defense-redesign-01`, based on `ff98ba4513cb9fcb1e5752acfd56495268aff416`. This is an experimental implementation, not a deployed balance patch.

## Decision

**Recommend the Force/Scout/Sniper core changes for adoption review. Hold the full defense redesign.** The core-only experiment removed the observed direct-hit lethal breakpoints without raising ranged health above the neutral-core case. It did not solve sustained survival: every affected case still died. Melee Bruiser and Duelist bonuses are preserved, because their extra durability compensates for exposure.

The complete redesign creates clearer armor roles and fixes important pipeline inconsistencies, but the tested ranged/caster packages remain too fragile. Several deliberate tank nerfs are desirable; a lower aggregate score alone is not a reason to restore bunker builds. The unacceptable part is that specialist choices still fail to produce adequate alternatives for several classes in T3 Volcano. This needs another focused design decision and encounter/policy diagnosis before release.

The reviewable changes are in [PATCH-NOTES.md](PATCH-NOTES.md). [ARMOR-INVENTORY.md](ARMOR-INVENTORY.md) covers all 30 armor definitions, with exact authored mechanics in [ARMOR-INVENTORY.json](ARMOR-INVENTORY.json). [CORE-ONLY.patch](CORE-ONLY.patch) isolates the three offensive-core changes against the baseline; it excludes the Juggernaut nerf and all defense-system edits.

## Experiments and results

The harness uses real in-memory server Worlds, the canonical combat bootstrap, native auto-combat, abilities and Rune rules, committed atlas hitboxes, 100 ms ticks, two fixed seeds (101009 and 101033), and a 180-second cap per case. Farming ends at first death; no respawn. Boss victory requires the dungeon cooldown state, not simply a disappeared boss. Equipment ownership/mastery are synthetic and qualified by the existing survey preparation helper. No economy, acquisition, production telemetry or exact player-build reproduction is claimed.

Main matrix: 109 distinct loadout/environment cells × two seeds. It covers T2–T4 armor home/cross-biome farms, light T3 Slinger cores at +0/+3, the Volcano boss, six classes, and T4 heavy Juggernaut/Tanking combinations. Follow-ups add T1, three T4 branches, alternate armor loadouts and explicit Heat-management boss rules. The other agent's processes and experiment directories were not modified; these runs use separate checkouts and no HTTP or database service.

| Main arm | Cases | Deaths | Total kills | Simulated seconds | Direct hits ≥ maximum HP |
|---|---:|---:|---:|---:|---:|
| Baseline | 218 | 81 | 2,518 | 27,263.9 | 4 |
| Core only | 218 | 81 | 2,547 | 27,513.9 | 0 |
| First full prototype | 218 | 137 | 1,300 | 18,597.1 | 0 |
| Revision 2: health and melee compensation | 218 | 112 | 1,629 | 22,494.1 | 0 |
| Revision 3: general DR foundation | 218 | 100 | 2,167 | 25,627.3 | 0 |
| Final composite: Desert/Volcano adjustments | 218 | 97 | 2,219 | 25,977.2 | 0 |

The final composite combines 176 unchanged revision-3 cases with 42 retested Desert/Volcano cases. It is **not** a fresh full-matrix run. Total kills include the cost of dying early and are not equal-duration DPS or economy throughput. Compared with baseline the final composite has 16 more deaths and 11.9% fewer kills. These are descriptive paired results, not a statistical significance claim. Several boss runs are identical across seeds because evasion and much of the encounter are deterministic.

Only **24** cases directly exercise Force, Scout or Sniper changes; the 8 Tempered Slinger cases are controls. The remaining main cases also serve as unchanged checks. Within the 24 affected cases, deaths remain 24/24, kills rise 29 → 58, time alive rises 425.2 → 675.2 seconds, and hits at least maximum HP fall 4 → 0. This supports removing the compounded HP penalty; it does not show that ranged survival is fixed or establish the ideal offensive percentages.

The `fullHpLethalHits` counter measures resolved direct hits at least maximum HP. It does not mean the victim was actually at full current HP, and it excludes environmental/DoT/debt payments outside the direct-hit hook. Do not translate it into an overall one-shot mortality rate.

| Final follow-up | Baseline | Candidate | Interpretation |
|---|---|---|---|
| T1 Squire, 20 cases | 4 deaths; 332 kills | 2 deaths; 334 kills | Stronger early melee foundation; not an early-game acquisition test |
| T1 Slinger, 20 cases | 6 deaths; 259 kills | 7 deaths; 239 kills | A remaining early ranged regression |
| T4 Stormwall/Lavatempered/Grave Ward, 12 cases | 0 deaths; 101 kills | 0 deaths; 104 kills | All survive the tested Tundra endpoint; no universal ranking |
| T3 boss, +3, six classes × two seeds | 0/12 clears | 2/12 clears | Squire/Cave clears both seeds at 60.2 seconds |
| T3 boss, +5, six classes × two seeds | 0/12 clears | 4/12 clears | Squire/Cave 52.5 seconds; Striker/Cave 42.7 seconds, both seeds |

The +3 and +5 boss follow-ups append an explicit native Heat-management Rune to both arms. Their results must not be pooled with the main matrix's different policies. No tested ranged/caster build wins these follow-ups. This supports retaining melee's distinct tanking role rather than flattening all classes onto the same DR budget.

In the alternate Cave/Swamp/Mountain Volcano farms (six cases per class), Striker improves from six deaths and 58 kills to three deaths and 181 kills. Apprentice remains six deaths/18 kills. Spirit remains six deaths but improves 44 → 65 kills; Conduit remains six deaths but improves 0 → 9 kills. Simply giving those classes different armor is insufficient under these fixed packages.

There is also a concrete residual burst failure: +5 Spirit/Cave takes **446** HP damage from **Final Eruption**, with maximum HP **430**, after earlier damage has exhausted its barrier (both seeds, at 51.9 seconds). Baseline Spirit dies earlier and therefore never reaches that event. Survival improvement can expose a later lethal attack; the main matrix's zero oversized hits is not a universal safety guarantee. This warrants tracing Final Eruption's intended counterplay and the bot's execution before changing all monster damage.

## Armor roles and cross-biome value

| Family | Retained or revised role | Intended secondary use / unresolved issue |
|---|---|---|
| Plains → Volcano | Flat plating against frequent small hits; Volcano earns more under incoming pressure | Packs in other biomes. Large gross hits crack half the earned ramp. Final tuning doubles hardening from the first prototype; no extra max-hardening DR rider |
| Forest → Jungle | Evade frequency plus meaningful evade strength, available earlier | Softens direct attacks and blocks eligible on-hit ailments in other biomes. Still needs a sufficient baseline survival budget; evasion does not guarantee the next large hit is evaded |
| Cave → Trench | Reliable general DR; Trench adds a modest sustained-fight ramp | Broad fallback for mixed pressure and boss attempts; strongest measured melee alternatives here |
| Mountain → Tundra | Mountain supplies health and Guard potency; Tundra rewards a held position | Timed heavy hits and stationary sustained fights elsewhere. Tundra cannot precharge out of combat, and movement sheds it rapidly |
| Desert | First-attack protection for six seconds, rearming after six quiet seconds | Short engagements, dangerous openings, recover-and-reengage play elsewhere. Continuous pressure does not refresh it; still not a universal farm solution |
| Swamp → Graveyard | Ailment resistance and fixed-payment damage debt | Other DoT/debuff environments and burst smoothing. Grave Ward has stronger debt conversion without automatic forgiveness |
| Stormwall / Lavatempered | Barrier with Guard support / bounded overheal wards | Alternative pool defenses; both need longer and varied threat-profile tests beyond the successful Tundra sample |

These are intended response profiles, not evidence that each armor has already achieved two competitive biome niches. The inventory retains prices, IDs and evolution routes, but actual progression pacing must be checked separately. All normal armor/root grants of the soft cap are removed; compatibility listeners remain for old authored fixtures. The larger health and DR foundation is the proposed replacement, and the experiment shows it still needs tuning for non-melee packages.

## Implementation and iteration

The first prototype removed too much generic plating without replacing enough of the survival foundation. Revision 2 increased T3/T4 armor health and melee root protection. Revision 3 added modest DR to non-Cave armors and more melee foundation. The last targeted revision delayed Desert activation until the first attack, extended it from four to six seconds, and doubled Volcano's earned plating ceiling/rate. No monster damage coefficient was changed.

The pipeline now subtracts plating once from completed charged-hit damage; class and item DR multiply as separate groups; Guards run before shields; Conduit redirection precedes debt and recuperation; fractional debt is paid in four upcoming installments with resistance fixed at queue time. Monster DoTs receive full general DR; secondary splash and environmental damage respect absorb pools. These affect different threat profiles, so the full arm does not isolate any single mechanic's causal contribution.

Recommended next experiment: keep melee compensation and the core HP repair, then isolate Volcano farm attrition from boss counterplay. Record threat source, Heat, Guard availability, evade charge, barrier state and executed Rune decisions immediately before each death. Compare one ranged/caster baseline-survival adjustment at a time, alongside unchanged Squire/Striker controls. Include early T1 Slinger regressions and non-Volcano cross-biome controls. Avoid restoring high universal plating or broad soft caps merely to hide the failing cases.

## Evidence provenance and exclusions

`FINAL-RESULTS.json` reconciles completed row counts, duplicate keys and raw-row SHA-256 hashes, and gives absolute local paths for every valid run. Raw JSONL, hitboxes, manifests and logs remain in the two worktrees. The manifest captures base revision, tracked diff, cells, seeds and hitbox hash. Earlier runs did not snapshot every untracked source module, so this is an **iterative local experiment**, not a sealed, independently reconstructible campaign. The final source/harness is preserved with the candidate; earlier arm diffs and raw data are retained.

Excluded preliminary candidate runs: `baseline-01` failed transform/preflight; `baseline-02`, `core-01`, and interrupted `full-01` used mismatched wall-clock origins. They are not evidence of balance or boss wins. Some clock-corrected early rows use `boss_missing` when the player is dead; summaries normalize every `hpEnd <= 0` row to death, without modifying raw rows. Later runners check player death first.

Historical authoring helpers (`defenseCandidateAuthor`, `defenseRevise`, `defenseFoundation`) are one-shot stages, not idempotent tuning commands; do not rerun them against the final candidate. `defenseFinalReport.mjs` is read-only with respect to gameplay and regenerates the comparison artifacts. To run the final harness, use a fresh output directory from the server package: `pnpm --filter @mmo-idle/server exec tsx --conditions=development bench/defenseStudy.ts ../reports/defense-redesign-01/<fresh-name>`. `DEFENSE_FOLLOWUP=1` selects T1/branches/+3 bosses; `=2` selects alternate armors/+5 bosses. Main rows use neither flag.

## Validation

Focused regression checks cover charged plating, Guard-before-ward ordering, debt conservation, Desert first-hit/rearm/approach semantics, Tundra forced movement, shielded gross-hit hardening cracks, secondary splash and environmental wards, cores/range gates, stance behavior, armor interactions and HUD copy. Final check outcomes are recorded in VALIDATION.md. The repository-wide typecheck and package builds are also run. The full test suite and browser/live play were not run; no production telemetry connector was used. This candidate is not merged, pushed or deployed.
