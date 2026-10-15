# Documentation Index

**Last audited:** 2026-10-01
**Lifecycle refreshed:** 2026-10-05 (tutorial fold and shipped-plan review)

This is the navigation page for documentation that is useful in the current
repository. It is deliberately not a dump of every dated report. Source code
wins over every document: shared rules and server behavior are the evidence
for implementation claims.

## The four kinds of documentation

1. **Current state** — what the checked-in code and data do now.
2. **Design authority** — intended behavior, constraints, and vocabulary in
   design_docs/.
3. **Active plans and operations** — scoped work that is still open or an
   operating procedure that is still used.
4. **Historical evidence** — completed plans, handoffs, experiment packets,
   reports, and superseded decisions under docs/archive/, design_docs/archive/,
   docs/briefs/, or reports/.

A current-state page should say when it was audited, name the owning source
paths, distinguish shipped behavior from placeholder balance, and link focused
tests where they exist. A dated packet or report is not a current rule merely
because it is detailed.

## Start here

- [Project README](../README.md) — setup, repository shape, auth boundaries,
  common commands, and the current world/progression summary.
- [Architecture](../design_docs/architecture.md) — source ownership,
  authoritative boundaries, tick schedule, persistence, and system seams.
- [Playtest command center](briefs/playtest-followup-command-center-2026-09-25.md)
  — active release/playtest scope and evidence rules.
- [Release flow](release-flow.md) — local, Docker, and Railway-shaped delivery.
- [Gameplay telemetry](gameplay-telemetry-current-state.md) — log database,
  event contract, retention, admin queries, and interpretation limits.
- [Bot experience command center](bot-experience-command-center.md) — live
  route/economy experiment procedure and evidence boundaries.

## Systems — current state

### Runtime, world, and combat

| System | Current-state record |
| --- | --- |
| Abilities | [abilities-current-state.md](abilities-current-state.md) |
| Barrier and ward | [barrier-ward-current-state.md](barrier-ward-current-state.md) |
| Biome ecology | [biome-ecology-current-state.md](biome-ecology-current-state.md) |
| Boss encounters | [boss-encounter-rework-current-state.md](boss-encounter-rework-current-state.md) |
| Conduit | [conduit-current-state.md](conduit-current-state.md) |
| Damage over time | [dot-systems-current-state.md](dot-systems-current-state.md) |
| Dungeons | [dungeon-current-state.md](dungeon-current-state.md) |
| Monster behavior | [monster-behavior-current-state.md](monster-behavior-current-state.md) |
| Monster combat rework | [monster-combat-rework-current-state.md](monster-combat-rework-current-state.md) |
| Monster targeting | [monster-targeting-current-state.md](monster-targeting-current-state.md) |
| Node variants (family blends) | [variants-current-state.md](variants-current-state.md) |
| Frame loops and range mechanics | [frames-current-state.md](frames-current-state.md) |
| Area banners and danger previews | [area-information-current-state.md](area-information-current-state.md) |
| Map, Crafting, Upgrade, Inventory and Passive Tree panels | [map-crafting-panels-current-state.md](map-crafting-panels-current-state.md) |
| Player movement | [player-movement-current-state.md](player-movement-current-state.md) |
| Recovery | [recovery-current-state.md](recovery-current-state.md) |

### Progression, economy, and equipment

| System | Current-state record |
| --- | --- |
| Charms | [charms-current-state.md](charms-current-state.md) |
| Global Mastery | [global-mastery-current-state.md](global-mastery-current-state.md) |
| Runes | [rune-system-current-state.md](rune-system-current-state.md) |
| Seals and tier advancement | [seals-current-state.md](seals-current-state.md) |
| T1 item rework | [t1-item-rework-current-state.md](t1-item-rework-current-state.md) |
| Tier balance | [tier-balance-current-state.md](tier-balance-current-state.md) |

### Client, auth, and presentation

| System | Current-state record |
| --- | --- |
| Authentication and characters | [auth-and-characters-current-state.md](auth-and-characters-current-state.md) |
| Audio | [audio-current-state.md](audio-current-state.md) |
| Guided T1 tutorial | [guided-tutorial-current-state.md](guided-tutorial-current-state.md) |
| Combat animation (mobs and players) | [combat-animation-current-state.md](combat-animation-current-state.md) |
| Landing cinematic | [landing-cinematic-current-state.md](landing-cinematic-current-state.md) |
| Player sprites | [player-sprites-current-state.md](player-sprites-current-state.md) |
| Spectator landing | [spectator-landing-current-state.md](spectator-landing-current-state.md) |

### Operations, telemetry, and bot tooling

| Area | Current-state record |
| --- | --- |
| Balance lab | [balance-lab-current-state.md](balance-lab-current-state.md) |
| Bot experience experiments | [bot-experience-command-center.md](bot-experience-command-center.md) |
| Frozen bot runner | [bot-experiment-runner-current-state.md](bot-experiment-runner-current-state.md) |
| Gameplay telemetry | [gameplay-telemetry-current-state.md](gameplay-telemetry-current-state.md) |
| Telemetry MCP | [telemetry-mcp-setup.md](telemetry-mcp-setup.md) |

## Active plans and operational records

These pages are not all implementation truth. Each has a status at its top;
read the linked current-state page before using it to describe shipped
behavior.

- [Future plans](future-plans.md) — backlog and deliberately deferred ideas.
- [Progression rework plan](progression-rework-plan.md) — short status index. The
  lineage trees, shards, and ability node rows it recorded as shipped were removed
  by the class-first rework (D1); the history is
  [archive/lineages-current-state.md](archive/lineages-current-state.md). Families
  and blends remain in [variants-current-state.md](variants-current-state.md).
  Frame loops remain in [frames-current-state.md](frames-current-state.md). Recovery
  remains in [recovery-current-state.md](recovery-current-state.md). The phase log is
  [archive/progression-rework-plan.md](archive/progression-rework-plan.md).
- [Ability pass run brief](briefs/ability-pass-run-2026-10-02.md) — IMPLEMENTED and merged to develop 2026-10-09 after the designer's calls (design §22.12; live state in [abilities-current-state.md](abilities-current-state.md) "The ability pass"); brief revised 2026-10-06 for design §26: the run that implements design §22 (roster 22 → 19, ability keystone + cross rows, five T3 path re-homes) off develop; baseline on the §26 tutorial kit, T1 lab DPS held within ±5%, the T3/T4 stacking change measured in wave 0; Opus conductor in ../mmo-lin-w2c on `feat/ability-pass`.
- [Ability pass report](briefs/ability-pass-report-2026-10-09.md) — the run's outcome (waves 0–3: parity failed on one Slam number) and its addenda (wave 4, design §22.12: Slam rank I solved on two numbers, 1.2× on 600 ms, 30/30 kit cells inside ±5%; Flow; rate guards; boss gates; path fixes; and the second round, §22.13: Slam a 600 ms cast at every rank, the Pyromancer fixed, Cleanse, the Vanish clock, the environment gates); 402/402; merged to develop.
- [Release v0.6 record](briefs/release-v0.6-2026-09-28.md) — what shipped in v0.6, merged branches, save policy, bandwidth changes, validation and the deploy check.
- [T4 power curve review](archive/briefs/t4-power-curve-review-2026-09-27.md) — ARCHIVED 2026-09-27: done; report in `reports/t4-power-curve-2026-09-27/REVIEW.md`, live state in [tier-balance-current-state.md](tier-balance-current-state.md) §6–7.
- [Boss lineage art list](briefs/boss-lineage-art-list-2026-09-27.md) — icons and ground textures the boss lineages borrow art for, with target paths and wiring.
- [Four-tier source audit](briefs/four-tier-audit-2026-10-05.md) — read-only inventory of tier ceilings, authored tables, validation pins, and fifth-tier consequences across packages; source revision and generic paths distinguished.
- [Playtest 3 report](briefs/playtest-3-report-2026-10-12.md) — a fresh guest through the guided Tier 1 in a real browser on develop `6a819467` (Striker, ~48 min): the timeline, three fixes made (rune icon 404s, the Reset Passives prompt on a new character, the guide's "frame" vs the panel's "style"), the designer's list (6.5 of 10 seal minutes are walking, the Plains entry spike, the Mountain boss at 7% HP, system-language class text, two names for frames) and what worked. Evidence: `reports/playtest-3/`.
- [Class-first rework brief](briefs/class-first-rework-brief-2026-10-13.md) — the designer's handoff brief for the class-first rework (each class its own mechanic, custom system, weapons, relics and abilities; random loot with agency; item and ability trees, frames, range nodes, cores and the shared runic budget scrapped; Discipline / flat pick / Mastery progression; Conduit first), plus an addendum of the designer's calls in the first brainstorm. Source of truth for intent until the new design bible lands.
- [Rework audit](briefs/rework-audit-2026-10-13.md) — step 1 of the brief, read-only: every current system tagged keep / rework / scrap, what shipped to production (the item and ability trees never did), the footprint of each scrapped system and its seams, an order of operations for removing the weapon tree, the written rules the brief overturns, and the open calls.
- [Conduit deep dive prep](briefs/conduit-deep-dive-prep-2026-10-13.md) — the starting material for the first class deep dive: what the designer has said, what exists today and what it becomes, the nine current specializations grouped into three families, the evidence (attrition, Taunt, the T4 weapon trap, Recall invisible to bots), and the sixteen questions in session order with starting options.
- [Striker deep dive prep](briefs/striker-deep-dive-prep-2026-10-13.md) — the starting material for the second class dive, with a paste-ready session prompt: what the designer has said (Momentum, the Order, Flurry / Crescendo / a third discipline, boss-trophy finishers), the cross-class rules decided in the Conduit dive, what exists today (frames, range, the nine paths), the evidence (weakest on Plains and Forest at T2; playtest 3 was a Striker), the collisions (Shatter, Juggernaut, Crescendo vs Reservoir) and the questions in order.
- [Squire deep dive prep](briefs/squire-deep-dive-prep-2026-10-14.md) — the starting material for the third class dive: what the designer has said (Resolve from damage blocked or absorbed, the retaliation slam, Response rules, Bulwark / Juggernaut / Avenger, countering and reactive windows), the cross-class rules decided in the Conduit and Striker dives, what exists today (the timed execution, Warrior / Knight / Bulwark frames, the nine paths, the Taunt rune, the reactive rune conditions, the wind-up interrupt seam), the evidence (melee takes about twice the damage, attrition is its weak spot, the Avenger T4 outlier, the Plains-boss stall, uneven telegraphs), ten collisions and the questions in order, with seeds for the T1 biomes.
- [Squire deep dive log](briefs/squire-deep-dive-log-2026-10-14.md) — the working record of the Squire deep dive (2026-10-14): every call in order (ten reviews, the last the lock), the reasoning, and the ideas dropped along the way (other sources of Resolve, a clock under the slam, carry-over in the base, defensive responses on cooldowns, Challenge as the Plains lesson, Perfect Guard, Dynamo, Unyielding, Grudge, Bull Rush, the last taunt winning, a Bulwark aura). The design itself is §8 of the class-first bible.
- [Spirit deep dive prep](briefs/spirit-deep-dive-prep-2026-10-14.md) — the starting material for the Spirit dive (run in parallel with the Apprentice and Slinger dives): what the designer has said (energy as damage and shield, Thresholds, Overflow / Reservoir / Tide, Crescendo kept offensive, Tide kept from the Wizard), the cross-class rules decided in the earlier dives, what exists today (energy per hit and the discharge, the 30% barrier, Spark / Wraith / Phantasm, the nine paths that already hold the three disciplines in embryo), the evidence (at range the shield is barely tested, fast packs and attrition are its walls, the barrier's numbers were never set), eleven collisions and the questions in order, with seeds for the fantasy, the energy model and the T1 biomes.
- [Spirit deep dive log](briefs/spirit-deep-dive-log-2026-10-14.md) — the working record of the Spirit deep dive (2026-10-14): every call in order (eleven reviews: the tenth the lock, the eleventh the wrap-up), the reasoning, the ideas not taken (energy from your hits, a melee or fully ranged Spirit, a flow paused by damage, a rule-list screen, Overflow's excess as buffs that bleed away, Tide standing still, Reservoir as just a bigger bottle, Static Skin's shock), and the cross-class proposal XC1 (the recharging barrier leaves shared gear). The design itself is §11 of the class-first bible.
- [Slinger deep dive prep](briefs/slinger-deep-dive-prep-2026-10-14.md) — the starting material for the Slinger dive (run in parallel with the Apprentice and Spirit dives): what the designer has said (clip-based fire with its own fire rate, the stationary reload, the Loadout of clip types with a last-bullet modifier, Gunslinger / Siege / Trickshot, generic on-hit cut, marks and Deathmark kept from the Striker), the cross-class rules decided in the earlier dives, what exists today (the clip and reload runtime, Scout / Marksman / Artillerist by clip position, the nine paths, Reload Safely, the ammo ring, bodies with no guns drawn), the evidence (ranged orbiting never stands in a telegraph, attrition its weak spot, two owners of the last round collided once, evasion worth little), ten collisions and the questions in order, with seeds for the T1 biomes.
- [Slinger deep dive log](briefs/slinger-deep-dive-log-2026-10-14.md) — the working record of the Slinger deep dive (2026-10-14): every call in order (twelve reviews: the eleventh the lock, the twelfth the wrap-up), the reasoning, the ideas not taken (one clip swapped by hand, a fixed rotation, instant swaps, marks as targeting, Deathmark under Gunslinger or Trickshot, a fresh-clip burst or reload on the move as Gunslinger's rule, ricochet or the clip's tally as Trickshot's), and two cross-class calls written into §3 (fire rate is not attack speed; Keep Distance is a free standing order). The design itself is §10 of the class-first bible.
- [Apprentice deep dive prep](briefs/apprentice-deep-dive-prep-2026-10-14.md) — the starting material for the Apprentice dive (run in parallel with the Slinger and Spirit dives): what the designer has said (attack converts to element stacks, Payoff rules, Poison / Fire / Frost, the DoT-weapon trap, the front-weighted curve scrapped), the cross-class rules decided in the earlier dives, what exists today (frames that already are Poison / Fire / Frost, the nine paths, the affliction toolkit, the DoT inventory), the evidence (the slowest farmer through T1, the Second Wind crutch, payoffs as the explosive numbers, the four bosses that accept no control), eleven collisions and the questions in order, with seeds for the T1 biomes.
- [Apprentice deep dive log](briefs/apprentice-deep-dive-log-2026-10-14.md) — the working record of the Apprentice deep dive (2026-10-14): every call in order (twelve reviews, then the lock), the reasoning, the ideas not taken (the patient killer, three schools set by the weapon, on-death spread as the brief wrote it, prepared lessons or Focus charges as the budget, pure sigils, freeze accepting the boss counter, school relics, a passive drain, chains for Fire only), the renames forced by locked names, and the cross-class proposals XC1 (passing on what a dead enemy carried, adding no damage, is not on-kill) and XC2 (marks never bank damage). The design itself is §9 of the class-first bible.
- [Class-first build plan](briefs/class-first-build-plan-2026-10-14.md) — ACTIVE, step 3 of the rework for all six classes (designer's call 2026-10-14: rebuild on the `rework/class-first` branch, not strangler): the milestones M0–M5 (foundations, then all six classes tier by tier, then release), how the conductor, Codex, Grok and ChatGPT's image generation split the work, the shared class framework (kits, lessons, trophies, budgets, one config intent, moments), the Phase 0 and Phase 1 task tables, the stand-ins and questions for the designer. Its working folder [class-first-build/](briefs/class-first-build/STATUS.md) holds the status board, the rules every agent follows and one brief per delegated task.
- [Conduit T1 slice plan](briefs/conduit-t1-slice-plan-2026-10-13.md) — SUPERSEDED by the [class-first build plan](briefs/class-first-build-plan-2026-10-14.md) (its strangler rules and seam ledger no longer apply; its code map, measurements and Conduit briefs are reused). Step 3 of the rework workflow (build track): the strangler rules and seam ledger (designer's call: strangler), every §7 item a playable T1 Conduit needs mapped to code, the stand-ins for unsettled shared sections, the ordered OPUS/DELEGATE task list (M0–M5) with paste-ready delegate briefs, the summon-cap measurements at 12/20/30 (`server/bench/summonCap.ts`: bandwidth binds in a shared node, world-wide per-summon scans bind across the server, T1 needs no cap change) and six design questions.
- [Conduit deep dive log](briefs/conduit-deep-dive-log-2026-10-13.md) — the working record of the Conduit deep dive: every call in order (nine reviews), the reasoning, and the ideas dropped along the way (tactics, the T3 flat pick, Bond, Link, Warlord, Champion, per-discipline casts). The design itself is §7 of the class-first bible.
- [Striker deep dive log](briefs/striker-deep-dive-log-2026-10-13.md) — the working record of the Striker deep dive (2026-10-13/14): every call in order (twenty-two reviews), the reasoning, and the ideas dropped along the way (Momentum for every Striker, the Duelist as a discipline, the afterimage echo, Flow, Whetstone, Rally as a baseline, Brace, Flashpoint, Earthshaker, combo-recovery leaves, dual-purpose relics). The design itself is §12 of the class-first bible.
- [System cut proposal](briefs/system-cut-proposal-2026-10-12.md) — SUPERSEDED by the class-first rework brief (read it only for the system inventory). PROPOSAL, not decided: the ten systems and fifteen currencies a player meets by Tier 2, and a cut to four (gear, the weapon page, the Passive Tree, abilities with Runes) by folding shards into essence, hiding Global Mastery behind tier wording, and parking ability node rows, stances and rites to T3+. Open questions for the designer at the end.
- [Handoff 2026-10-10](briefs/handoff-2026-10-10.md) — where the designer session ended: develop state, the two finished runs (combat readout unmerged with ten calls; ability pass merged with its leftovers), the next steps in order, parked items, housekeeping and the standing rules.
- [Combat readout run report](briefs/combat-readout-report-2026-10-06.md) — COMPLETE 2026-10-06, MERGED to develop 2026-10-10 with the designer's calls (addendum): the grammar as built (numbers sized by share of the pool, one crit look, overhead bars by size class with a damage chip, a boss frame with the quarters lost lit and a cast line, the target frame's chrome, the vitals on the same bar, the phone floor), every token, before/after real-client screenshots per item and a live spectator capture, what could not be verified, the designer's open calls (camera floor, band thresholds, the crowded top centre at 1440). Evidence: `reports/combat-readout/` (mockup, capture driver, screens).
- [Combat readout run brief](briefs/combat-readout-run-2026-10-06.md) — RUN 2026-10-06 (report above), parallel to the ability pass: one grammar for damage numbers (size by share of the pool, one crit look), overhead health bars with a damage chip and size classes, a boss frame with HP quarter markers (the Kill chain prerequisite) and a telegraph line, the target frame's chrome, the player's vitals; tokens for the later skin track, no ornament; Opus in ../mmo-lineages on `feat/combat-readout`, unmerged for the designer.
- [Legibility run report](briefs/legibility-report-2026-10-05.md) — COMPLETE 2026-10-06, merged to develop: design §26.1–§26.4 implemented (the T1 band is a ranked Attack/Speed/Effect lean and the weapon's own verb, the choice opens at T2; one damage-over-time record per weapon and a zero-gap status registry pinned by a test; T1 nodes as rosters with one crossroads per biome; one named ring per verb under the HP bar, the proc strip removed, teaching-only floating word, the Upgrade and Stats panels, the territory line; the tutorial taught once and the bot buying ranks). Carries every number picked, the composition matrix by lean × rank, the no-band identity proof, the tutorial-kit bar, the 1x sweep ledger, the screenshots per view and the designer's open calls (the Effect lean is weakest on three weapons; the Hammer's verb needs its Effect lean). Brief: [legibility-run-2026-10-05.md](briefs/legibility-run-2026-10-05.md). Evidence: `reports/legibility/`.
- [UI prototypes run report](briefs/ui-prototypes-report-2026-10-04.md) — COMPLETE 2026-10-05, on `design/ui-prototypes` (not merged): five interactive lineage-UI prototypes (A ring, B HUD cards, C body first, D dense sidebar, E beat strip) built from one data export against the same five scenes, a live side-by-side comparison page (`reports/ui-prototypes/index.html`, opens from disk), the matrix, the reviewer's critique and pick, what to reuse, what no thesis solved and the client findings. Design only, no game code. Brief: [ui-prototypes-run-2026-10-04.md](briefs/ui-prototypes-run-2026-10-04.md).
- [Verbs-that-fire run report](briefs/verbs-that-fire-report-2026-10-03.md) — COMPLETE 2026-10-04, merged to develop: design §24.9 implemented (the Affliction and Control leans seed their condition, the Empowered moment capped, T2+ bands compose and the amplifier moves an axis of the composed pair, the eight T2–T4 nodes re-led to a family they field, parked lineages out of the boss stopgap, chaotic misses on every hit moment, the tutorial's lean and verb on the weapon each class fights with, the T1 verb at Global Mastery 10, card firings in the bot). Carries every number picked, the composition matrix rerun (12 of 45 under the floor, four that still never fire and why), the T2 matrix, the 1x sweep ledger with firings and the designer's open calls. Brief: [verbs-that-fire-run-2026-10-03.md](briefs/verbs-that-fire-run-2026-10-03.md). Evidence: `reports/verbs-that-fire/`.
- [Course-correction run report](briefs/course-correction-report-2026-10-03.md) — COMPLETE 2026-10-03, merged to develop: design §24 implemented (the T1 lean and verb compose into one generated sentence, one shard per node, non-weapon trees parked, the ladder and evolve retired on every slot, the weapon page, the rhythm readout, payload FX, the guide's two purchases). Carries every number picked, the lean × verb composition matrix (13 of 45 pairs under the viability floor, all for verbs that do not fire at T1), the boss-lab delta, the 1x sweep ledger and the designer's open calls. Brief: [course-correction-run-2026-10-03.md](briefs/course-correction-run-2026-10-03.md). Evidence: `reports/course-correction/`.
- [Tooling repair report](briefs/tooling-repair-report-2026-10-03.md) — five ordered repairs: legacy route actions, full-power reports, Conduit test inclusion, baked hitboxes and node-shard bench accounting; validation and bounded T1 smoke evidence.
- [Course-correction icons](briefs/cc-icons-report-2026-10-03.md) — W1-E: the 26 icons and nine essence-style shard replacements, designer-approved and packed; source/runtime targets and the gallery handoff.
- [Non-weapon ladder fold report](briefs/cc-fold-report-2026-10-03.md) — W1-D evidence: all 86 original +5 totals, per-field before/after values, and validation.
- [T1 boss pass report](briefs/t1-boss-pass-report-2026-10-02.md) — COMPLETE 2026-10-02: three T1 boss rows moved (Behemoth attack, Greatbear HP+attack, Toadeater HP) so every class beats every T1 boss on the guide's kit; second seal stays Mountain. Two findings outlive the numbers: a solo T1 boss fight was deterministic (24 of 30 cells), and the Behemoth/Broodmother are a 10x melee/ranged split rather than a difficulty.
- [Boss redesign implementation plan](boss-encounter-redesign-implementation-plan-2026-09-04.md)
  — IN PROGRESS: the remaining Phase 8 cleanup/tuning handoff after the shipped phases.
- [Map variety design](map-variety-plan.md) — living region design authority;
  retained until its region-layout/mask rules have a complete current-state successor.
  Family blends are in [variants-current-state.md](variants-current-state.md).
- [Terrain variance plan](terrain-variance-plan.md) — own status remains IN PROGRESS.
- [UI redesign plan](ui-redesign-plan.md) — approved for incremental implementation;
  presentation work and review history, not a fully shipped plan.
- [Named progression checkpoints](named-progression-checkpoints.md) —
  command-center acceptance procedure and implementation record.
- [System rework roadmap](system-rework-roadmap.md) and [system rework
  status](system-rework-status.md) — current follow-up queue and implementation
  scoreboard after the authored T1–T4 construction pass.
## Reference and authoring pages

- [Map regions atlas](map-variety-regions-atlas.md) — human-readable map view;
  source coordinates remain canonical.
- [Named progression checkpoints](named-progression-checkpoints.md) —
  acceptance and continuation procedure for named playtest states.
- [Release flow](release-flow.md) — branch, packaging, and deployment checks.
- [T1 item rework](t1-item-rework-current-state.md) — the shipped Clearing/T1
  item cast and its source-linked constraints.

## Design authority

The flat files in design_docs/ are the design and architecture source set:

- [architecture.md](../design_docs/architecture.md)
- [Class-first bible](../design_docs/class-first-bible.md) — DRAFT (2026-10-13): the design
  authority for the class-first rework, one section per system with its own Draft/Locked
  status. Once a section locks, it wins over every older design doc listed in its §14.
  **§7 Conduit LOCKED 2026-10-13** (it superseded the archived summoner-overhaul design
  source); **§12 Striker LOCKED 2026-10-14**; **§8 Squire LOCKED 2026-10-14**; **§10 Slinger
  LOCKED 2026-10-14**.
- [design-bible.md](../design_docs/design-bible.md)
- [Progression rework design](../design_docs/progression-rework-design.md) — design authority;
  the worn-form band gate, delegated monster pass and Consort loop decisions are §18.11–§18.13.
- [game-overview.md](../design_docs/game-overview.md)
- [economy-philosophy.md](../design_docs/economy-philosophy.md)
- [player-power-curve.md](../design_docs/player-power-curve.md)
- [boss-design.md](../design_docs/boss-design.md)
- [boss-lineage-redesign.md](../design_docs/boss-lineage-redesign.md) — 2026-09-27 boss contract (fight length and phases per tier) and per-lineage T1–T4 redesign; **first pass implemented 2026-09-27**, numbers pass pending; supersedes boss-design.md's fight-length target
- [ability cast and tier progression](../design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md)
- [T1 item design philosophy](../design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md)
- [T1 item numerical baseline](../design_docs/T1_ITEM_NUMERICAL_BASELINE.md)
- [T5–T8 endgame suggestions](../design_docs/t5-t8-endgame-suggestions.md)

Some design files intentionally describe targets rather than shipped behavior.
Use the current-state table above and the source when they conflict.

## Historical material and archive lifecycle

- [Guided T1 tutorial plan](archive/guided-tutorial-plan.md) — implemented; live behavior and
  validation records are in [guided-tutorial-current-state.md](guided-tutorial-current-state.md).
- [Docs fold report](briefs/docs-fold-report-2026-10-05.md) — tutorial fold, verbatim
  progression amendments, conditional duplicate proof and retained-plan inventory.
- [Status registry audit (2026-10-05)](briefs/status-registry-audit-2026-10-05.md) — raw player/monster ids, HUD projections, presentation gaps, slow/root clocks, and the rerunnable source extractor.
- Removed by the class-first rework (2026-10-15). Design authority is
  [class-first-bible.md](../design_docs/class-first-bible.md). Kept for history:
  - [Lineage trees, shards, and ability node rows](archive/lineages-current-state.md) — removed (D1).
  - [Cores](archive/cores-current-state.md) and the [core rework handoff](archive/core-rework-design-balance-handoff.md) — the core slot was removed (D2).
  - [Stances](archive/stances-current-state.md), the [stance authoring guide](archive/stances-authoring-guide.md), and [stance future notes](archive/stances-future-design-notes.md) — removed (D2).
  - [Rites](archive/rites-current-state.md) and the [rite authoring guide](archive/rites-authoring-guide.md) — removed (D2).
  - [Relic items](archive/relics-current-state.md) — removed (F5). The relic slot remains and holds the class boss trophy.
  - [Runic attunement](archive/runic-attunement-current-state.md) — Runic Points (D2) and ability attunement (D3) removed.
  - [Core design philosophy](../design_docs/archive/CORE_DESIGN_PHILOSOPHY.md), [core cast review](../design_docs/archive/CORE_CAST_REVIEW_DRAFT.md), [core T4 cast](../design_docs/archive/CORE_T4_CAST.md), and [relics design](../design_docs/archive/relics-design.md) — superseded by the bible (§4).
  - [Tier-2 bot infrastructure](archive/t2-bot-testing-infrastructure.md) and the [bot capability audit](archive/bot-harness-capability-audit.md) — class and campaign routes were removed (D5). The living runner docs stay in the operations table.
- [Archive guide](archive/README.md) explains how completed plans and
  handoffs are moved without losing provenance.
- [Briefs and evidence](briefs/README.md) explains the active/history split for
  dated operator packets, reports, audits, and experiment receipts.
- [docs/archive/](archive/) contains completed or superseded project plans and
  historical current-state exports.
- [design_docs/archive/](../design_docs/archive/) contains historical design
  authority and implementation context.
- [v0.5 release readiness](archive/next-playtest-release-readiness.md) is a
  completed release record; use [release-flow.md](release-flow.md) for the live
  procedure.
- [reports/](../reports/) contains generated artifacts. Reports can support an
  observation, but they do not override current source or prove a different
  matchup than the one they measured.

When a plan ships, fold durable facts into the relevant current-state record,
add or refresh an archive header naming the successor, then move the plan.
When evidence is still useful, preserve it and label its scope, branch,
revision, and canonical/non-canonical status. Do not silently delete old
receipts merely because their conclusions are no longer current.
