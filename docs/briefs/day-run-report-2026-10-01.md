# Day run report — 2026-10-01

**Reconstructed 2026-10-01, after the fact.** The day run (`docs/briefs/day-run-progression-2026-10-01.md`)
never wrote this report — its conductor session ended at the last docs commit below without
reaching the "write the report" step in Wave 3. Run 3 discovered the gap, built on top of
the day run's code anyway, and recorded the omission in `docs/briefs/run3-report-2026-10-01.md`
("Divergences from the brief"). This document is assembled from the day run's own commits,
merge commits, and the progress notes its tasks left in `docs/archive/progression-rework-plan.md`
(the plan was archived mid-run) — not from a live session transcript. Every claim below is
sourced from a commit, a test file, a bench report, or a progress note; anything that rests
only on inference from those sources is marked **unverified** inline, in the text, not in a
footnote. No suite run, no typecheck, and no code review were performed to produce this
report — it is read-only reconstruction.

## Branch state

`feat/lineage-data-model`, day-run portion ends at commit **`e0d25835`** (before run 3's own
first commit `5d61f90c`, which is docs(progression): run 3 brief). The day run's task list
named eleven items; all eleven are present on the branch:

**Merged by merge commit** (`git log --oneline --merges 56da9150..5d8eb163`, oldest first) —
these match the brief's own list of nine day-run merges exactly:

| Order | Merge commit | Branch |
|---|---|---|
| 1 | `b7247c6c` | `feat/frames-melee-dot` (W1-A: Striker/Squire/Apprentice) |
| 2 | `8532525c` | `feat/frames-ranged-summoner` (W1-B: Slinger/Spirit/Conduit) |
| 3 | `6efc1e45` | `feat/range-mechanics` (W1-C: at-bay layer) |
| 4 | `d6d7a9d7` | `feat/band-collapse` (W1-F: stat absorption, panel collapse) |
| 5 | `c09fa552` | `feat/t2-band-weapon` |
| 6 | `3799aa54` | `feat/t2-band-nonweapon` |
| 7 | `dc4f3cbf` | `feat/rehoming-t2-families` |
| 8 | `37d6bf89` | `feat/amplifier-composition` |
| 9 | `13d639b1` | `feat/bench-rerun` (W2-A) |

**Landed as single-commit fast-forwards** (no merge commit; confirmed by `git branch
--contains` on each branch's tip matching exactly one commit ahead of its parent):

| Commit | Branch | What it is |
|---|---|---|
| `dfceed3f` | `feat/designer-followups` | Fresh Opening re-scope + the one-multiplier closure + bible §18.9/§18.10 |
| `85d6241a` | `feat/live-bot-telemetry` | W2-B, the first live lineage-card bot route |

**Direct conductor commits on mainline** (docs only, no task branch — `64c0666a`, `e0d25835`):
open decision 3b (drops vs favours) and the Global-Mastery-band re-confirmation. These read as
the conductor's own Wave-3-adjacent writing, not a subagent's.

**Unmerged: none found.** No `feat/` branch named in the brief or in the eleven-task list is
missing a landing point on `feat/lineage-data-model` between `56da9150` and `5d8eb163`.

**Typecheck and suite: UNVERIFIED for the day run as a whole.** No progress note in the
archived plan states a day-run-wide `pnpm test` pass count, and this task is docs-only — I did
not run the suite. Per-task progress notes report their OWN typecheck/test scope as clean
(frames-melee-dot: `shared`/`server`/`client` clean, listed suites green; frames-ranged-summoner:
not explicitly restated but implied by "Tests:" lines with no failures noted; range-mechanics:
same; t2-band-weapon/nonweapon: `coverage.test.ts`, `normalisation.test.ts`,
`lineageAuthoring.test.ts`, `lineageEconomy.test.ts` green plus clean `tsc`;
rehoming-t2-families: `itemReachability.test.ts`, `weaponReachability.test.ts`,
`lineageMaterials.test.ts`, `variantBlend.test.ts`, `bestiaryZone.test.ts`,
`world/map/validation.test.ts` green plus clean `tsc`; band-collapse: `lineageEconomy.test.ts`
plus six named shared/server suites green, `tsc` clean on shared/server/client). **No note
states a merged, whole-branch number.** The nearest hard data point is run 3's report, which
records **348/348 at `5d61f90c`** — the very next commit after the day run's last commit
(`e0d25835`) — as its OWN starting baseline. That is strong circumstantial evidence the day
run left the suite green, but it is run 3's number at run 3's base commit, not a day-run
self-report, and I have not re-run it to confirm. Treat "348/348 at the end of the day run" as
**unverified**.

## What to playtest

Reconstructed from the brief's own "what to playtest" additions and the progress notes'
"still open / not reached" sections — not from a live playtest pass, which this task did not
perform.

1. **Pick a frame (Light/Balanced/Heavy) on a cadence, cooldown, dot, reload, energy or
   summoner root and watch its loop fire** — windows, banks and finishers are live per the
   `frameLoops.test.ts` / `frameLoopsRanged.test.ts` suites. **Caveat, verified from two
   independent progress notes (frames-melee-dot divergence 6a, frames-ranged-summoner "still
   open"):** the `frame-charge` weapon glow has NO client renderer as of the day run's own
   commits — the event is on the wire and stack counters render through the existing buff
   sync, but nothing draws the glow itself. A commit `ec3a9d65` ("the weapon glow that grows
   with a frame's banked charge") exists later in the branch's history and closes exactly this
   gap, but it is not one of the day run's eleven named tasks and its single-commit branch
   topology does not let me place it in the day run's own timeline with confidence — **not
   attributed to the day run here; unverified whether it shipped before or after**.
2. **Stand at reach with a melee Mid-range node (Lancer, Phalanx, Enforcer) and watch the
   at-bay slow** — `isAtBay` is the edge-to-edge hitbox gap inside the player's reach and
   outside the target's own; Phalanx executions and Shade's discharge stagger at that range;
   Warlock spreads a stack to an adjacent body. No client/HUD work was done for this beyond
   the existing debuff UI (range-mechanics progress note, "still open").
3. **Pay a T2 gate and watch the band collapse** — the T1 stat row's value folds into the worn
   T2 form's base stats, the panel shows a collapsed one-line summary for bands below the worn
   tier, and an `--absorbed` card state marks the folded row. Built by `feat/band-collapse`
   only; T2 card authoring and form re-homing that make a T2 gate reachable at all came from
   the sibling T2/re-homing tasks in the same wave.
4. **Buy a T2 amplifier and confirm it modifies the owned payoff rather than adding a second
   effect.** This is the one point where the day run's own authoring task (T2 amplifiers,
   split across `feat/t2-band-weapon` and `feat/t2-band-nonweapon`) and its runtime are
   different tasks: the authoring tasks shipped 60 amplifier cards against a runtime that only
   read `card.modifies` at the purchase gate, so an amplifier fired as a separate effect (wrong
   three different ways depending on payoff kind — see `ba009486`'s commit body). The
   `feat/amplifier-composition` task, NOT named in the original brief, closed that gap by
   folding the amplifier into its target payoff at resolve time. Only after that fix does
   "modifies rather than adds" hold.
5. **Run the Forest tutorial's new gate chapter and farm toward a T2 Rapier Tempo card** — the
   live-bot run (`85d6241a`) did this at 25x and confirms the purchase round-trips end to end
   (508 ms to buy, persisted, `lineage.card-unlocked` logged), but also found the payoff row is
   gated at Global Mastery 18 (three biomes at level 6) — unreachable by farming one or two
   maxed biomes, however much currency is held. **A route that only farms its home biome will
   stall holding essence; this is by design per the re-confirmed Global Mastery rule
   (`design_docs/progression-rework-design.md` §4), not a bug**, though `farmBlocked` does not
   yet name that specific stall (see Divergences).

## Divergences from the brief

**The report itself was never written — the central divergence, and the reason this document
exists.** Per run 3's report: "the brief says to confirm `git log -1` is at or after the
commit of `docs/briefs/day-run-report-2026-10-01.md` and to stop if it is not. That report was
never written... Only the write-up is missing." Why the day-run conductor stopped at
`e0d25835` rather than continuing to Wave 3's final step is **not recoverable from the
evidence available to this task** — there is no error, no partial draft, and no note
explaining the stop. Marked **unverified / unknown** rather than guessed.

**The task list executed is not the task list the brief wrote.** The brief's Wave 1 names six
tasks (W1-A frames-melee-dot, W1-B frames-ranged-summoner, W1-C range-mechanics, W1-D
`feat/t2-amplifiers` for all twenty lineages in one task, W1-E `feat/rehoming-t2-families`
covering re-homing AND T2 families AND T2 blends in one task, W1-F `feat/band-collapse`) plus
Wave 2 (W2-A `feat/bench-rerun`, W2-B live-bot, no branch). What actually landed, by commit
evidence:

- **W1-D split into three tasks**, not one: `feat/t2-band-weapon` (the five weapon lineages'
  full T2 band — stat/payoff/amplifier, 45 cards) and `feat/t2-band-nonweapon` (the fifteen
  non-weapon lineages' payoff+amplifier rows, 90 cards) did the authoring the brief assigned to
  W1-D; `feat/amplifier-composition` (not named in the brief at all) did the RUNTIME wiring
  that makes `modifies` do anything, after both authoring tasks independently flagged that the
  runtime only read `card.modifies` at the purchase gate.
- **W1-E's scope (re-homing, T2 families, T2 blends) landed as one task**,
  `feat/rehoming-t2-families`, matching the brief's W1-E description even though its branch
  name is the one the eleven-task list and the brief both use — this one did NOT split.
- Both T2-authoring tasks diverged from the brief's instruction that each lineage gets ONE
  amplifier card per lane: `coverage.test.ts`'s per-tier/per-row completeness rule forced a T2
  **payoff** card alongside the amplifier on every lane (not amplifier-only), which the
  progress notes call a scope correction rather than a rule change, since design §4 already
  lists a T2 payoff row.
- **Re-homing's Desert T2 family partition went beyond the approved table.** The brief's
  re-homing table (in `docs/briefs/day-run-progression-2026-10-01.md`) named Desert's T2
  families as Basilisk/Scorpion/Stalker but only accounted for seven of the ten Desert T2
  mobs; `dust-djinn`, `sandweaver` and `sandspitter-cobra` (the scarab "Dealer" line) were not
  in that table at all. `feat/rehoming-t2-families` assigned them by its own stated reasoning
  (`dust-djinn` to Scorpion, `sandweaver`/`sandspitter-cobra` to Stalker) and flagged the call
  for designer review rather than treating it as already decided.
- **Jungle's T2 blend names a Stalker family with no T2 member in the live monster pool.** The
  authored blend still lists Jungle Stalker as a node's dominant family; `resolveNodeBlend`
  drops it and rescales onto Ape/Undergrowth at runtime. Not fixed in this wave — flagged as a
  monster-pool gap, outside the "no monster numbers" boundary the brief set.

**The bench report's filename does not match the brief.** The brief asked for
`reports/progression-phase1/lane-matrix-2026-10-01.md`; the file that was actually written and
is referenced by the day run's own bench commit (`e24ad5fd`) is
`reports/progression-phase1/lane-matrix.md`. Content matches what the brief asked for (uplift
table, §9/§18.9 encounter check, off-budget list); only the path differs.

**The frames column the brief's bench task implicitly wanted was explicitly NOT delivered.**
`e24ad5fd`'s own commit message states it: the reference profiles in
`bot/src/tierEntry/profiles.ts` do not vary by frame, so a Light/Balanced/Heavy uplift column
needs 18 new profile rows and roughly triples a 35-minute run — "deliberately deferred out of
the 2026-10-01 day run rather than approximated" (also recorded as bible §18.10). Run 3's own
report later delivered this column (18 profiles, in `lane-matrix-run3.md` /
`lane-matrix-run3-slow.md`); do not read those numbers as the day run's.

**The live-bot task's own report deliverable diverged from its instruction.** The brief
(W2-B) asked for Striker T1 AND T2 Forest routes, 40 minutes each, bringing Docker up and down
itself. What happened instead, per `85d6241a`'s commit body: ONE route
(`striker-lineage-forest-t1`), one 955.9 s session (not 40 minutes — the session was ended by
the operator's timeout, not completed), at 25x (the brief did not specify a multiplier — 25x
is the dev reward multiplier used elsewhere in the repo, so this is plausibly a default rather
than a deviation, but the brief's own wording ("live Striker T1 and T2 Forest routes... for 40
minutes each") was not met). Docker was found already up (22h) and was explicitly left as
found — "no `db:up`, no `db:down`" — which also diverges from the brief's "bring Docker up...
and down again after." `swaps-per-session` could not be measured for the stated reason: a pure
lane's first purchase auto-activates, so there is no second owned card in the row to swap to.

**Fresh Opening's semantics changed.** `dfceed3f` (`feat/designer-followups`) records that
Fresh Opening was authored (presumably by the T2 non-weapon task, since it is a
non-weapon amplifier naming "a fresh opening on each new target" — **unverified which specific
task authored the card**, since the progress notes for t2-band-weapon/nonweapon do not name it
by id) with the wrong amplifier axis (`duration` instead of `trigger`), which per
`ba009486`'s rule would have made it a priced, inert card. It was re-scoped to re-arm the
`first-hit` latch per monster body rather than per engagement, closing it before this report
was reconstructed.

## Bench (W2-A — `reports/progression-phase1/lane-matrix.md`, commit `e24ad5fd`)

Numbers quoted directly from the report and from `e24ad5fd`'s own commit message; not
recomputed or edited.

- **150 cells**, 20 reference profiles x 27 distinct T1 node blends x 2 seeds (101009,
  101033), 90 s sim per cell per seed, wall clock 25.3 min, generated against commit
  `5d02eb2f`.
- **All 27 authored T1 blends now resolve exactly as authored** — closed by the five new T1
  mobs landed earlier the same day (`shared/src/data/...` per design §18.8); before this run,
  families with no T1 member were dropped and rescaled (18 of 27 distinct, all six Swamp nodes
  collapsing into one).
- **Every packet now has a favouring T1 node, including Engagement**, whose shards used to be
  credited in-harness because its only family (Swarm, on `grass-kite`) could not be fielded.
- **Trigger-rate normalisation tightened the spread**: median packet uplift **+8.2% → +4.3%**;
  worst-to-best packet ratio **13x → ~3.3x** (engagement +7.7%, 1.79x median, vs. kill-chain
  +2.3%, 0.54x median — the report's own packet-budget table).
- **Off-budget, against §18.9's ±3pp band (median +4.3%, band +3.9% to +4.7%):** 0 of 6
  weapon-eligible packets fall inside the band (engagement +7.7%, affliction +5.4%, control
  +5.1%, tempo +3.5%, empowered +2.5%, kill-chain +2.3% — all six listed, all six outside).
  Two of the eight total packets (bulwark, barrier-tempo) are weapon-ineligible and not
  measured by this weapon-only bench.
- **Encounter check (ordinal, per §18.9):** 0 of 27 node rows show the favoured family's lane
  beating the punished lane's by anything resembling the retired "~30%" threshold; every
  row's verdict reads "favoured lane does NOT win by ~30%" in the report's own table. Several
  families are negative on their own purest (70/20/10) node: Deep −17.6%, Herd (plains-01)
  −7.5%, Ridge −2.9% are the report's own flagged examples (later corrected by rank rather than
  magnitude in `dfceed3f` — see below).
- **No magnitude, packet budget, monster number, or card was touched** by this bench task, per
  its own commit message.
- **`dfceed3f` (designer-followups) re-reads this same data** and corrects two of the brief's
  own worked examples against the new ordinal rule: Deep is confirmed worst in ABSOLUTE terms
  (−9.4pp in that later re-read — note this number does not match the −17.6% in
  `lane-matrix.md`'s own table; **unverified which figure is current / why they differ**, possibly
  a different reading of the same data, e.g. mean-over-all-nodes vs. favoured-node-only) but
  ranks fourth by margin, behind Brood, Brute and Sky; Herd is NOT a failure under the ordinal
  reading — it ranks above its punished lane on `plains-01` and ties on two other nodes, reading
  negative only in the absolute column the ordinal rule retires.

## Live bot (W2-B)

Numbers from `85d6241a`'s commit body, `docs/recovery-current-state.md` §8 ("Live-bot fights,
2026-10-01"), and `docs/lineages-current-state.md` §13 ("Card telemetry — the first LIVE run"),
cross-checked against each other — all three agree on the headline figures.

| metric | value |
|---|---:|
| route | `striker-lineage-forest-t1` (cadence-root / cadence-balanced, Forest) |
| reward multiplier | 25x (flagged `NON_CANONICAL_REWARD_MULTIPLIER` by the harness itself) |
| session length | 955.9 s (15 m 56 s), ended by operator timeout |
| kills / deaths | 112 / 0 |
| time to first card | 215.9 s (3 m 36 s) |
| `unlockCard` round trip | 508 ms |
| `setActive` round trip | 0 ms (correct: `unlockCard` into an empty row already activates) |
| swaps per session | 0 (structural for a pure lane, not a defect) |
| gate paid | 0 (route has no boss step) |

**Findings, not numbers:**

- **The card-buy seam works end to end** — bought, persisted (`ownedCards`, `active.stat`),
  and telemetered (`lineage.card-unlocked` with `shardsSpent 3`, `essenceSpent 30`). This had
  existed since Phase 1c but had never run against a live server before this task.
- **The payoff row's Global Mastery 18 requirement stalls a home-biome-only farm.** The run
  held 13,736 green essence (against a cost of 90) and 2,122 Tempo shards (against a cost of
  8) while unable to buy the payoff card, because Forest was already mastery-capped and the
  requirement needs three biomes' worth of mastery, not one. `design_docs/progression-rework-design.md`
  §4 was updated the same day (`e0d25835`) to re-confirm this is BY DESIGN ("a bot or player
  who farms only the home biome stalls by design... holding 13k essence").
- **`farmBlocked` does not name this specific stall.** It raises a named `StallError` only for
  "this packet has no T1 shard source"; a Global-Mastery shortfall the farm node cannot fix
  currently just farms forever without surfacing a message. Recorded as owed work, not fixed
  in this task.
- **`combat.fights` in the Phase 0 per-fight-HP sense was NOT produced.** That series is
  written when a bot session completes its report; this session was killed by `timeout` and
  only flushed `events.jsonl`. The 112 kills are raw kill events, not a survivability series —
  `docs/recovery-current-state.md` §8 is explicit that this run still does not close the Phase
  0 live-bot gate, which needs a canonical (1x multiplier) run long enough to complete.
- **Docker was already running (22h uptime) and was left exactly as found** — the task did not
  bring it up or down, diverging from the brief's instruction (see Divergences).

## Code review

**None was performed within the day run.** Wave 3 of the brief calls for `/code-review high`
on the branch diff before writing the report; since the report-writing step was never reached,
there is no evidence a day-run-scoped code review happened, and I did not run one (docs-only
task). The nearest available evidence is run 3's later `/code-review high`, which explicitly
scoped itself to run 3's OWN 131 changed files and separately recorded seven findings in
"pre-existing branch code" left over from earlier runs, unfixed. **One of those seven is in
day-run code:**

- `server/src/systems/classes/archetypes/summoner/frameLoop.ts` — Effigy's
  `frame.summoner.link` record carries no owner id in its key, so two Conduits linking against
  the same body overwrite each other's pair-tracking and kill credit goes to whichever one
  wrote last. This module was added by `feat/frames-ranged-summoner` (W1-B) per that task's own
  progress note ("New runtime files:
  `server/src/systems/classes/archetypes/{reload,energy,summoner}/frameLoop.ts`"). Confirmed
  by run 3's report; **not fixed as of this reconstruction**.

The other six findings in run 3's "pre-existing, not fixed" list (`lineageCards.ts`
plating-shred/evade-trigger issues, `cadence/t3/pipeline/empoweredHit.ts`, `combat/status/
sharedDebuffRecord.ts`, `db/playerRepo.ts`) are in code outside the day run's own task set
(mostly pre-existing before the day run started, per their framing in run 3's report) and are
not re-attributed here.

I have not independently verified any of these seven findings by reading the referenced code —
this section reports what run 3's review recorded, not a fresh review.

## Open for the designer

Carried forward from the brief's own prompt plus what the progress notes flagged directly:

- **The Consort (balanced Conduit) frame loop is still open.** `frames-ranged-summoner`'s own
  table lists `summoner-balanced` / Consort as "**none** — the loop is still open with the
  designer," matching the brief's explicit instruction to leave it untouched.
- **Pyromancer still overlaps Ember Mage, unresolved.** `frames-melee-dot`'s progress note:
  "the T3 path does what the Ember frame now does... it belongs to the T3 review of the whole
  class, together with the other re-homes."
- **Warmonger's reload ramp is parked, not redesigned.** The frame's ramp wins at runtime
  (Warmonger's own handler early-returns while the frame key is present); the agreed re-home —
  "half the ramp carries through a reload" — is explicitly NOT designed in this task, per
  `frames-ranged-summoner`'s progress note.
- **Gravewalker Boots → Fleet (Plains) is flagged "weakest fit," implemented anyway.**
  `rehoming-t2-families`'s progress note argues the mechanical mapping (kill-stack-speed-pct
  onto Fleet's kill-chain lane) is clean and the "weakest fit" is thematic only (a
  death-and-decay boot crowning sunlit Plains farmland) — a characterization, not a mechanical
  defect, but the designer call on theme was not made in this task.
- **Two "drops vs. favours" assignments made outside the approved table, flagged for
  review:** `dust-djinn` joining Scorpion and `sandweaver`/`sandspitter-cobra` joining Stalker
  in the Desert T2 partition (see Divergences) — the brief's table named neither.
- **No lane an amplifier could not express is recorded in either T2-authoring progress note.**
  Both report that every lane in their scope (weapon and non-weapon) turned out expressible
  inside the closed trigger/payoff vocabulary. If the brief expected a "could not amplify"
  list, none exists in the evidence — **unverified / possibly complete by omission rather than
  confirmed exhaustively**, since I have not independently re-derived all sixty cards against
  the vocabulary.
- **Open decision 3b (drops vs. favours per family) was written into the design doc
  (`64c0666a`) but not resolved** — it explicitly defers resolution "after the frames column
  exists," which run 3 later delivered; this task cannot say whether 3b has since been closed.
- **The frame-charge client glow's status at the END of the day run is genuinely unclear from
  the evidence** (see "What to playtest," item 1) — flagged here rather than asserted either
  way.
- **Why the day-run conductor stopped before writing its own report is unknown.** No error,
  partial draft, or note was found. This is the one gap in the evidence this task cannot
  narrow further; the conductor of any future run should treat it as permanently lost rather
  than keep searching for it.

## What I could not reconstruct

- **The day run's own branch-wide typecheck/suite result** (see Branch state) — no day-run
  progress note states a merged-branch pass count; only per-task scopes are recorded.
  Evidence that would have closed this: a `pnpm test` run against `e0d25835` (not performed —
  docs-only task), or a progress note this run apparently never wrote.
- **Why the report step was skipped.** No evidence of a crash, timeout, or decision exists in
  the commits or progress notes between `13d639b1` (bench-rerun merge) and `5d61f90c` (run 3's
  brief, i.e. the first commit NOT part of the day run). Evidence that would have closed this:
  a session transcript or log, which does not exist for this task to read.
  **This is also the task's own explicit framing**: "the day run's own account of its
  decisions is still owed and no longer recoverable from this session" (run 3's report).
  "No longer" is accurate — I found commits and progress notes, which carry decisions and
  numbers, but no account of the SESSION itself (what order things were spawned in, what
  conflicts the conductor resolved and how, whether `/code-review high` was ever attempted and
  aborted).
- **Which task authored the Fresh Opening card** (see Divergences) — the progress notes for
  `feat/t2-band-weapon` and `feat/t2-band-nonweapon` describe their cards by lineage/lane
  pattern, not by individual card id, and Fresh Opening is not named in either. Evidence that
  would close this: `git blame` / `git log -p` on the specific card definition, which I did
  not run (would require identifying the exact file and line, and this task's time was spent
  on the higher-value cross-checks above).
- **Whether the day-run conductor attempted and merge-conflict-resolved anything the brief's
  "three tasks edit rootsAndFrames.ts... expect conflicts there" warned about.** No divergence
  note from any task mentions a conflict at merge time (unlike run 3's report, which documents
  six conflicts in detail). Evidence that would close this: the day-run conductor's own
  Wave-3-equivalent merge log, which — per the above — does not exist.
- **The exact session/wall-clock timing of the day run** (when it started, how long Wave 1 vs.
  Wave 2 took). Commit timestamps give an upper bound (`e24ad5fd`'s bench report timestamps
  itself `2026-10-01T13:41:53.519Z`) but not a full session timeline.
