# T2 Spirit and Desert follow-up 01 — Astra preparation brief

**Give this document to Astra.** Prepare the approved focused follow-up. Luna executes the runnable packet, reports, and commits AND pushes the compact publication. This is a preparation assignment, not a claim that the packet is implemented or that combat has started.

**Allocation: 32 comparison cells, including controls; at most 32 fresh observations.** Up to 16 exact historical controls may be reused under the compatibility rules below. No numerical class, weapon, armor, ability, Rune, enemy, or progression changes are authorized in this packet.

## 1. Questions and decisions

**A — strong outlier:** Is T2 Light Spirit's broad farming advantage primarily frame-related, dependent on Stinger Rapier, or shared with a comparable Slinger package? Compare complete weapons in controlled support contexts; do not assume a Spirit-wide nerf is already the answer.

**B — intended counterplay:** Can Light and Balanced Striker handle ordinary T2 Desert when they have legally equipped Focus Lowest HP before the first pull? The completed screen's four failing lives ended before its five-minute acquisition point. They did not test the intended policy.

**Separate entry question:** The designer expects approximately +3/+4 equipment on entering Jungle/Desert, not mature +5. Prepare the bounded acquisition/profile appendix in section 6. Do not silently recast the +5 comparisons as first-entry tests, or expand combat into an upgrade/armor factorial.

The designer is open to a measured Spirit nerf. Heavy Spirit's possible boss specialization and Conduit's possible T1-origin weakness remain explicit later questions. Neither receives an unrequested treatment here.

## 2. Evidence and source boundary

Reference experiment: `t2-multi-biome-class-01/run-01`, 264 completed observations, 257 caps and seven gameplay deaths. Its 252 primary rows are distinct from 12 weapon alternatives. The report explicitly describes mature synthetic T2 ownership, not entry progression or boss evidence.

Repository: `RaimonTarga/MMOidleProject`.

- Measured source: `41b3d35961bf4393beeea6e70aabfe2ae43ad810`.
- Measured source SHA-256: `32b44f4faec8ad7e52d9f0f4b97b12bd3f3b22f537043dcb29ed7b0bb6220e94`.
- Hitboxes SHA-256: `6a75e0e8417e0936bdaffe389f1d5b73b06a78b49d163961e02cf18ecca166bf`.
- Existing publication branch: `codex/t2-multi-biome-class-01-packet`; distinguish its publication revision from the measured source.
- Main references: `reports/player-fast-pass/t2-multi-biome-class-01/run-01/{REPORT.md,results-summary.json,resolved-builds.json,CLASS_ASSESSMENT.md}`.
- Preparation references: `reports/player-fast-pass/t2-multi-biome-class-01-preparation/{PACKAGES.md,PACKAGE_CATALOGUE.json,QUALIFICATION_RECEIPTS.json,README.md}` and `server/bench/balance/t2MultiBiomeSpec.ts`.

Use one frozen execution baseline retaining production Conduit R2, accepted session/owner-target corrections, movement-only Hamstring, and the existing Desert Focus Lowest HP acquisition correction. Do not reinstall these changes or reset unrelated work. New preparation code may have a new recorded SHA. Check relevant gameplay compatibility with the measured source once; if substantive gameplay changes are required for the intended baseline, regenerate affected controls rather than hiding the difference.

Retain the actual prior ordinary +5 equipment, clamped only where the item has a lower maximum. Do not apply +5 to cores that do not support it. Resolve core state, mastery, ownership, RP, ability ranks and initial HP/barrier through the previous receipts and production preparation. No T3 range nodes, relics, or later-tier skills. These deliberately remain mature T2 packages.

## 3. Block A — Spirit/frame/weapon attribution: 24 cells

Identities:

- `breadth-t2-spirit-light`.
- `breadth-t2-spirit-balanced`.
- `breadth-t2-slinger-light`.

Each uses both **`jungle-stinger-rapier` +5** and **`ruinous-axe` +5**, in both fixtures and both seeds. This includes giving Balanced Spirit Stinger and giving the two Light references the axe; do not change their frame to match the weapon.

| Fixed support | Swamp | Mountain |
| --- | --- | --- |
| Ordinary fixture | `node-t2-swamp-03` | `node-t2-mountain-03` |
| Armor | `swamp-vest-t2` +5 | `mountain-vest-t2` +5 |
| Recovery item | `swamp-charm-t2` +5 | `mountain-charm-t2` +5 |
| Boots | `desert-boots-t2` +5 | `cave-boots-t2` +5 |
| Core | Existing legal `core-tempered` | Existing legal `core-tempered` |
| Stance | Offensive | Offensive |
| Technique | Sweep | Power Strike |
| Guards, ordered | Second Wind, Brace, Cleanse | Second Wind, Brace, Cleanse |

Keep the original native ranged policy: Find Enemies; telegraph Step Back; Keep Distance; Avoid Hazards; Recover First, in its existing order and with native triggers. Preserve the original full T2 skill/frame configuration, ability ranks and starting-state conventions. Expected RP is 30/30; resolve rather than force that value. No generic Flee, Endure, Wait It Out, other Technique, core change, or stance switch.

**3 identities × 2 weapons × 2 fixtures × 2 seeds = 24 cells.**

This is a whole-weapon comparison: attack damage, cadence, on-hit effects and the axe's drawback all travel with the item. It is not an isolated on-hit ablation or an attack-speed coefficient estimate. The fixed supporting core may interact with the weapons; that is the declared context, not grounds for an extra core sweep.

Interpretation should distinguish: Light Spirit retaining an advantage with both weapons; both Spirit frames becoming comparably strong with Stinger; or Slinger showing a similar weapon response. None alone proves a universal root coefficient. Use useful work and health pressure together. Do not choose a numerical nerf merely to equalize the three kill totals.

## 4. Block B — Desert policy from the first pull: 8 cells

Identities: `breadth-t2-striker-light` and `breadth-t2-striker-balanced`.

Fixture: `node-t2-desert-03`, seeds 101009 and 101021.

Preserve each exact mature Desert reference: Gale Needle +5, Mountain armor +5, Swamp charm +5, Mountain boots +5, Tempered, Offensive Stance; Power Strike; ordered Second Wind/Brace/Cleanse; Find Enemies, telegraph Step Back, Avoid Hazards and Recover First.

Two policies:

- **Native targeting control:** no Focus Lowest HP rule and no scheduled midpoint edit. Retain the original native targeting. Expected 27/30 RP.
- **Opening low-HP policy:** before the first World combat tick, craft the existing `rune-recipe-focus-lowest-hp` through normal production acquisition, then perform the ordinary validated loadout edit adding `in-combat -> focus-lowest-hp`. Retain all other rules and their relative order. Expected 30/30 RP.

Use the current **Desert mastery >=4** requirement and **90 yellow essence** payment. Keep a declared affordable reserve in initial preparation, with no resource grant during combat. Preserve existing mature mastery; this is not the first entry into Desert. Do not change the acquisition level or price. Record the debit, ownership and final RP. The targeting action remains the native general rule: no privileged dealer-role ID, forced victim, comparator rewrite, or movement bypass.

**2 identities × 2 policies × 2 seeds = 8 cells.**

The old four controls died at 13.5–19.3 seconds, before their scheduled edit. Their completed pre-adoption lives can be reused only if materially identical to this control up to the terminal event. Label that exact compatibility and original source; do not pretend they were previously run under this new manifest. Any longer old survivor with a midpoint edit would not be a valid no-edit control.

Keep Mountain armor in this block. It isolates the designer's already-specified targeting response. A new armor, lower upgrade level, or different Guard in the candidate would confound that question. This is not a claim that Mountain is the optimal Desert armor or that a first-time entrant has access to the policy.

## 5. Fixed execution, reuse and readout

- Experiment ID: `t2-spirit-desert-followup-01`; new packet/output roots, never overwrite prior reports.
- Seeds 101009 and 101021; 100 ms World step; 600,000 ms cap; first player death ends the life.
- Continuous endpoints at 300,000 and 600,000 ms. No revival, health/formation refill, forced rest, ecology reset, extra seed or adaptive follow-up.
- One worker and existing safe watchdogs; paired cases adjacent where practical, arm order reversed between seeds. Freeze the complete ledger before execution.
- Existing A references provide up to 12 reusable rows; B provides up to four. Report **32 comparison cells, new/reused/failed/not-run separately**. At most 32 new combat observations, potentially 16 when all proposed reuse is justified.
- Reuse requires compatible gameplay, assets/hitboxes, fully applied package, initial state/roster, RNG path, duration and measurement contract. A name or matching seed alone is insufficient. Do not spend more effort proving dubious reuse than simply running the allocated control.
- Reused rows retain their original SHA, IDs and artifact pointers; new rows share the intended frozen gameplay context. Do not relabel source history.
- Qualify from the actual execution checkout and child launcher using the working receipt checks. No new harness, broad validation campaign, full-suite repair or unallocated combat pilot. A common operational failure stops affected execution; valid gameplay losses continue.

Primary readout: outcomes, elapsed time, completed kills, first-kill latency, equal-window work, unfinished targets, significant progress gaps, minimum/terminal HP and barrier, recovery/guard activity and actual encountered types. Preserve null post-death endpoints and distinguish damage from absorption. Kill totals in a death-shortened life are not sustainable rates.

For Spirit, use existing recorded energy/discharge activity and target progress where available to explain whether more frequent useful discharges or item contributions fit the result. If exact overkill or source-attributed damage is unavailable, say so. Do not manufacture an estimator or make comprehensive new telemetry a prerequisite.

For Desert, reuse the existing target/bond information to report whether the intended dealer-first behavior was expressed and whether simultaneous incoming pressure changed. A selected target does not prove eligibility, landed damage, or kill order. Avoid inferred pairings where pack membership is unavailable. Low-HP policy failure does not automatically mean a class defect; distinguish strategy execution from balance.

## 6. Entry-profile appendix — required analysis, no extra combat

The designer's point is material: a character may enter Jungle or Desert with about +3/+4 preparation, whereas the preceding screen used mature +5 and late mastery. The exact entry ceiling has not been established by the report. Resolve it from production acquisition and progression, not from the test's synthetic ownership.

Provide one compact appendix, reusing existing progression documentation when it matches code. Trace only the relevant item upgrades, mastery/guardian gates, catalyst families/sources, legal core access and Rune ownership needed to answer:

1. **First Jungle entry:** what weapon/armor/charm/boots/core can a credible incoming character actually own, and at which per-item upgrade? Do not assume a Jungle weapon/armor is already acquired before entering Jungle.
2. **First Desert entry:** do the intended route and earlier Jungle access change those options? What +3/+4 limits are hard gates versus the designer's expected pacing? Do not assume Desert boots, armor or its mastery-4 targeting recipe is available before earning access.
3. **Established early Desert:** after the intended mastery-4 unlock, what preparation remains pre-capstone, and which upgrades/resources become reachable? This is distinct from first entry and from the mature reference.

Record upgrade maxima per slot, item provenance, relevant blockers and realistic mastery/RP assumptions. Do not merely set equipment to +3 while retaining all mature mastery, cores, and unlocks and call that an arrival profile. Conversely, do not impose a uniform +3/+4 limit if the actual legal progression allows mixed upgrades. No long economy simulation or new farm loop is requested.

Separate code-enforced facts, designer expectations and unresolved route assumptions. If the source does not explain the proposed +5 restriction, report that specifically rather than inventing one. Return a concise proposed legal entry loadout for later approval; no entry combat is automatically authorized.

For later Desert armor work, Mountain's current Guard-oriented reference and a legal Cave generalist alternative are plausible candidates, not measured winners. Do not add an armor search here. If an unexplained entry failure needs a different strategy, ask the designer with evidence before selecting it. Preserve the existing Cleanse behavior and leave Wait It Out unequipped pending the designer's check.

## 7. Interpretation and deferred decisions

Produce up to five findings and three priority decisions. Assess strong as well as weak outliers. A candidate Spirit adjustment must identify the implicated frame/root/item interaction and its intended tradeoff. Openness to a nerf is not a quota to recommend one regardless of results.

**Heavy Spirit and bosses:** the designer hypothesizes infrequent large discharges, mob overkill and a sustained-target specialty. This packet does not test Heavy or bosses. Existing Heavy farming comparisons also differ in weapon and stance. Preserve that hypothesis for a selected boss comparison before any root-wide Spirit nerf; do not equate its lower farming count with proof that Heavy is weak or that its boss damage is best.

**Conduit T1 versus T2:** keep a separate later assessment of whether weakness begins in the base root before frames, or appears in the T2 transition. No T1 combat or Conduit buff is added now. Compare credible peers and different pressures on the same relevant source before deciding whether a correction should apply at T1 or to individual frames; do not benchmark only against possibly overtuned Spirit.

**Overall class state:** mature survival supports viable reference packages, not a blanket declaration that entry progression, sustained output, all bosses, or every item is balanced. Retain the localized T3 Apprentice and Jungle DoT questions rather than declaring exactly two remaining problems.

Do not automatically add another biome, an Endure rescue, a +3/+4/+5 factorial, or a repair for every death. Use the already-provided encounter intent. A consequential unexplained failure returns as a specific question to the designer before an invented strategic response.

## 8. Ownership, deliverables and stop

**Astra:** prepare the fixed 32-cell ledger, fully resolved legal packages, source/hitbox identity and reuse map, the bounded entry-profile appendix, and one short `LUNA_RUN.md` with exact verified commands. Commit scoped preparation through the normal project workflow. Keep preparation distinct from actual combat; preserve unrelated work and avoid resetting the designer's changes.

**Luna:** execute only new cells once, merge in explicitly referenced historical controls for analysis, and report the reconciled comparison ledger. Write one readable `REPORT.md` with paired outcomes and decisions, compact per-row results and applied builds, execution/completion identities, and external raw-artifact inventory. Keep large histories outside Git. No gameplay adoption, no autonomous next campaign.

**Commit AND push the readable report and scoped compact evidence. Verify the remote publication and return branch, publication SHA, measured SHA(s), report path, counts, and reuse IDs.** A publication failure does not authorize combat replay. No force-push, unrelated files, deployment or infrastructure work.

Completion means a useful Spirit attribution/Desert counterplay decision and an honest entry-profile boundary—not another list of prerequisites to begin balancing.
