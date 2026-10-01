# Run 4 — overnight: reachability, monster pass, Consort, benches, review fixes (2026-10-01)

**Read by:** the conductor session. Paste the "Conductor prompt" into a fresh session in
`../mmo-lineages` on `feat/lineage-data-model` at or after `5d8eb163` plus the docs commit
that carries this brief.
**Authority:** `design_docs/progression-rework-design.md` (§4, §12, §18 as amended today,
§19–§21), `docs/briefs/frame-loops-2026-10-01.md`, `docs/briefs/run3-report-2026-10-01.md`
(the "Open for the designer" and "Code review" sections are this run's input),
`reports/progression-phase1/monster-proposals-run3.md` (the table this run applies).
**Goal:** after this run the designer plays, then an ultra review and the merge. So: every
T3/T4 card reachable; families that actually punish the lane they declare; the Consort
loop; the Technique packet (design §22, pulled forward into this run); a real avoid face for Guards; the seven pre-existing review findings fixed; T2
reference profiles and a bench that can read a family contract, then the bench rerun;
the tutorial's gate chapter validated live; the day-run record reconstructed; a report.

**Not in scope:** the T3 class path review; any magnitude change; ability keystone/cross
rows; anything that needs the designer in the room.

---

## Conductor prompt

```
You are the conductor for an overnight implementation run. Working directory is
../mmo-lineages on branch feat/lineage-data-model. Read
docs/briefs/run4-overnight-2026-10-01.md in full, then design_docs/progression-rework-design.md
(§4, §12, §18, §21), docs/briefs/run3-report-2026-10-01.md ("Open for the designer" and
"Code review"), and reports/progression-phase1/monster-proposals-run3.md.

Run the waves in the brief: one subagent per task, the brief's prompt verbatim, the model it
names, its own worktree. The seven ../mmo-lin-w* worktrees exist with node_modules
junctioned and @mmo-idle/* repointed; reuse them with fresh branches after a clean
typecheck, as run 3 did. Never install. Tasks of a wave run in parallel; merge each wave
into feat/lineage-data-model in the brief's order; resolve conflicts yourself; run
`pnpm typecheck` and `pnpm test` before the next wave. A failing task gets up to an hour of
your fixing, otherwise stays unmerged and is recorded. If a rate limit cuts a wave, resume
from the task-branch commits; never redo committed work.

Hard rules for you and every subagent:
- Never install anything. Never push. Never rebase, reset --hard, force, or amend. Commit
  often; attribution line from the session's system reminder.
- Strip carriage returns from touched files before committing.
- No Postgres/Redis in tests. Only W2-B (live tutorial validation) uses Docker: `pnpm
  db:up` before, `pnpm db:down` after, and only if Docker is not already up (check first;
  if it is up, leave it up afterwards).
- Monster stat changes are allowed ONLY in W1-B and ONLY from the proposal table, one
  commit per family, each message carrying the table's reasoning and marked PROVISIONAL.
  No magnitude, ability rank, or pool factor changes anywhere.
- Code on the branch wins over any sketch; record divergences in the plan's progress notes.

Finish by writing docs/briefs/run4-report-2026-10-02.md in the brief's report format,
commit it, stop. No PR.
```

---

## Wave 1 — seven tasks in parallel

Merge order: **W1-A, W1-G, W1-C, W1-D, W1-E, W1-B, W1-F.** (W1-G and W1-D both add
members to the vocabulary unions in types.ts; resolve by keeping both additions.)

### W1-A — band gating on the worn form's biome · model: opus

```
On a branch feat/band-gating off feat/lineage-data-model, implement design §21: a
lineage band of tier N gates on the biome of the form worn at tier N (its door biome),
not on the lineage's home biome. The Rapier's T3 band is earned in the Jungle, the
Broadsword's in the Desert, the Axe's T4 in the Graveyard or Trench depending on the worn
form. Concretely: `resolveLineageCard`'s requiredBiomeLevel (and the Global Mastery
band, unchanged in meaning) resolve against `wornForm`'s `biome` for the band of that
form's tier; T1 and T2 behave as before because the T1 form's biome is the home biome
and T2 doors are same-tier. Where a lineage holds two forms of one tier from different
biomes, the band gates on the worn one and switching forms re-resolves. Update
lineages-current-state.md and the bible's worked Rapier example if it names levels.
Tests: extend lineageEconomy.test.ts and add a reachability test that walks every
lineage, every tier, every form and asserts the band's required level is ≤ that biome's
authored cap (BIOME_FINAL_TIER_BY_GROUP), with no allowlist. Related tests + typecheck;
strip CR; commit. Report any lineage whose T3/T4 form biome still cannot reach its band.
```

### W1-B — monster pass from the proposal table · model: opus

```
On a branch feat/monster-pass-run3 off feat/lineage-data-model, apply
reports/progression-phase1/monster-proposals-run3.md: for every row, make the edit in
the monster definition (shared/src/data/monsters/*.ts), ONE COMMIT PER FAMILY, the
message quoting the row's from → to and reasoning, and the word PROVISIONAL. Priorities:
(1) the stats with no monster behind them — give every family whose contract punishes
Affliction a `dotResistance`, Empowered an `evasion` (≤ 0.25 per the authoring rule),
Tempo a `plating` — at the table's values; (2) the Plains plating contradiction: the
monster file's "no plating by design" comment loses to the family contract, so Herd
bodies gain the table's plating and the comment is rewritten to say why; (3) any other
row. Where a row conflicts with a LOCKED comment in the monster file (grep "locked"),
apply it anyway, rewrite the comment, and list it in your report so the designer can
revert that commit. Then re-run the family partition and families tests. Related tests
+ typecheck; strip CR. Report the commit list (family → hash → rows applied) and the
locked-comment overrides.
```

### W1-C — Consort loop, "the line holds" · model: opus

```
On a branch feat/consort-loop off feat/lineage-data-model, implement the Consort frame
loop decided 2026-10-01 (frame brief §1 Conduit row, now closed): while every one of the
five formation slots is alive, the formation carries bonus plating and damage reduction
(container: a `summoner.frame-line-*` set of mechanicEffects on summoner-balanced in
rootsAndFrames.ts, consumed in the summoner prototype where minion mitigation is synced);
a summon death breaks it immediately; a completed reconstruction restores it when the
line is whole again. HUD: a `frame.summoner.line` status on the owner with data
{ intact: 1|0 } through the existing buff sync; frame-charge beat on restore. Tests in
frameLoops.test.ts (or its summoner sibling): intact grants, death breaks the same tick,
reconstruction restores. Related tests + typecheck; strip CR; commit. Report the values
you took from the magnitude table.
```

### W1-D — evasion window for the avoid face · model: sonnet

```
On a branch feat/evasion-window off feat/lineage-data-model, add `evasion-window` to the
payoff vocabulary (design §6 amended 2026-10-01): a timed window that adds a flat evasion
fraction to the player, resolved from PAYOFF_UNIT like the other windows, applied through
the evasion stat the way `speed-window` touches speed, status `lineage.evasion-window`
with { totalMs, magnitude } for the HUD clock, fx `engagement.brace-sparks` reused. Then:
every Guard's avoid-face node offer (shared/src/data/abilityNodes/) uses `evasion-window`
or `engagement-dr`, never `speed-window` alone; every defensive lineage card that is
avoid-faced and currently inert in effect (run-3 report lists them) may use it. Coverage
test: every PayoffKind has a runtime dispatcher (lineageCards) and a client fx mapping.
Related tests + typecheck; strip CR; commit. Report which ability offers and cards changed.
```

### W1-E — the seven pre-existing review findings · model: opus

```
On a branch feat/review-findings off feat/lineage-data-model, fix the seven findings in
"pre-existing code" recorded under "Code review" in docs/briefs/run3-report-2026-10-01.md,
each with a test that fails without the fix, one commit per finding. If a finding turns
out to be a false positive, say so in the report with the reason instead of changing
code. Related tests + typecheck; strip CR. Report finding → commit → test.
```

### W1-F — reconstruct the day-run report · model: sonnet

```
On a branch feat/day-run-report off feat/lineage-data-model, write
docs/briefs/day-run-report-2026-10-01.md from the evidence that exists: the merge commits
between 56da9150 and 5d8eb163 that belong to the day run (frames-melee-dot,
frames-ranged-summoner, range-mechanics, t2-band-weapon, t2-band-nonweapon,
amplifier-composition, rehoming-t2-families, band-collapse, bench-rerun,
live-bot-telemetry, designer-followups), each task's progress note in
docs/progression-rework-plan.md (now archived under docs/archive/ — find it), the
lane-matrix reports, and recovery-current-state §8's live-bot entry. Use the report format
from docs/briefs/day-run-progression-2026-10-01.md. Mark every statement you could not
verify from a commit or a test as "unverified". Docs only; strip CR; commit. Report what
you could not reconstruct.
```

### W1-G — Technique, the ninth packet · model: opus

```
Implement design §22's Technique packet on a branch feat/technique-packet off
feat/lineage-data-model. Read design §3, §6, §12, §22 and the lineage runtime first. The
packet union is the checklist: add 'technique' to PacketId and WEAPON_PACKET_IDS and let
the typecheck enumerate every table, switch and map that must name it (PACKET_BUDGET,
packetDefinition colour and label, shard wallet sanitiser, materials panel, map shard
icon, coverage tests, bench profile tables, ability-node offer tables). Then:

1. Vocabulary: trigger kind 'technique-cast' (fired from the Technique firing seam in
   abilityFiring.ts, once per cast that lands or resolves — never from a Guard); payoff
   kinds 'technique-refund' (reduces the remaining cooldown of the player's Technique
   abilities by the magnitude share) and 'technique-window' (a timed window in which the
   next Technique is empowered via empoweredMultiplier). Units in PAYOFF_UNIT; dispatchers
   in lineageCards; fx keys 'technique.trail', 'technique.cast-flare',
   'technique.keystone'; client handlers in combatFx.ts in a new lane colour from
   packetDefinition (pick one distinct from the eight).
2. Keystone: 'Signature' — a landed Technique counts as the class mechanic firing (emit
   mechanic-fired without setting the empowered flag), module under keystones/, test block.
3. Broadsword: lanes become ['technique', 'kill-chain', 'empowered'] (Technique is Lane A,
   so the Plains boss stopgap pays Technique shards); its Tempo stat/payoff/amplifier/
   keystone/cross cards become Technique cards (stat key technique power via the existing
   technique.power-pct passive — add 'techniquePowerPct' to LineageStatKey if the
   stat-row seam needs it); the Desert forms' capstones crown Technique. Rename cards to
   fit. Remove 'tempo' from the Broadsword; Tempo's coverage must still hold (Rapier, Axe).
4. Families: Plains Swarm drops 'technique' instead of 'tempo' (area and control
   Techniques are what beat many weak bodies). Tempo keeps Forest Pack and Mountain
   Hopper. Coverage: every packet ≥ 2 T1 sources counting the boss stopgap.
5. Ability-node offers: Technique replaces one offer on Slam, Sweep, Snipe, Stunning
   Strike, Binding Strike and Detonate (the Technique-lane node on a Technique means
   "landing this ability refunds part of its own cooldown"). Guards unchanged.
6. Magnitude table: PACKET_BUDGET.technique = 1; trigger-rate normalisation entry for
   technique-cast from the average Technique cooldown at reference wiring.
Tests: coverage (nine packets everywhere), keystone block, technique-cast fires once per
cast and never for Guards, Broadsword reachability unchanged, Plains Swarm partition.
Related tests + typecheck; strip CR; commit per step. Report every file the union forced
you into, and any table you had to extend by hand because it was not typed by PacketId.
```

---

## Wave 2 — two tasks, after the wave 1 merge

### W2-A — T2 reference profiles, a contract-reading bench, rerun · model: opus

```
On a branch feat/bench-t2 off feat/lineage-data-model:
1. T2 reference profiles in bot/src/tierEntry/profiles.ts: T2 gear (the T2 form of each
   weapon lineage plus a T2 armor/charm/boots set), the T2 stat, payoff and amplifier
   cards of the lane, mastery at the T2 cap, one per lane per frame (frames column kept).
2. A bench instrument that reads a family contract directly (W2-A's own recommendation
   in the run-3 report): for each family, run the favoured lane and the punished lane on
   a 100%-that-family synthetic node for a fixed kill count, and report the ratio of
   their time-to-kill-N, with the minimum-sample guards from run 3. This is the
   arbiter for design §18 3b, and it does not depend on blends.
3. Rerun both benches (lane matrix with frames + T2; contract instrument for every T1
   and T2 family) on the branch AFTER W1-B's monster pass and W1-G's Technique packet
   (nine packets; the Broadsword's lanes changed). Write
   reports/progression-phase1/lane-matrix-run4.md and
   reports/progression-phase1/family-contracts-run4.md.
4. Apply design §18 3b with the contract instrument: where the punished lane beats the
   favoured lane on the family's own synthetic node with both seeds agreeing, move
   `drops` to the lane that won, one commit per family with the numbers. Where the
   contract holds, leave it. Report every remap and every family still inverted.
No magnitude changes. Related tests + typecheck; strip CR.
```

### W2-B — live tutorial validation · model: opus

```
On feat/lineage-data-model, code read-only except the tutorial scripts and docs: bring
Docker up only if it is down (`pnpm db:up`), run the guided tutorial's routes live at 1x
and at 25x through the new tree lessons and the gate chapter as docs/guided-tutorial-plan.md
describes, for every class the plan lists, and record pass/fail per beat, the Greatbear
fight outcome, and time-to-gate. Fix script-level failures (anchors, waits, ordering) on
a branch feat/tutorial-live; anything that is a game failure (the boss kills the bot, a
card cannot be bought) is recorded, not fixed. Bring Docker down only if you brought it
up. Docs: the plan's validation record. Commit; report the per-beat table.
```

---

## Wave 3 — conductor

Merge wave 2, full suite, `/code-review high` on THIS run's diff (base = the branch tip
when you started; say so in the report), fix CONFIRMED correctness findings, then write
`docs/briefs/run4-report-2026-10-02.md`:

```
# Run 4 report — 2026-10-02
## Branch state (hash; merged/unmerged; typecheck; suite N/N)
## What to playtest (the run-3 checklist, updated: T3/T4 bands now reachable, families
   that punish, Consort's line, an avoid-face Guard node)
## Divergences from the brief
## Monster pass: commit list, locked-comment overrides, families still inverted after
   the contract bench, drops remapped
## Benches: lane matrix with frames and T2; family contracts
## Live tutorial: per-beat table, Greatbear
## Code review
## Open for the designer (everything provisional, listed; the T3 class review; anything
   a task could not express)
```
