# Overnight run — progression rework Phases 1c, 2, and 4 (2026-09-30)

**Read by:** the conductor session. Paste the "Conductor prompt" section into a fresh
session started in `../mmo-lineages` on `feat/lineage-data-model`.
**Authority:** `design_docs/progression-rework-design.md` (design),
`docs/progression-rework-plan.md` (plan, including the Phase 1c contract at the end).
**Goal for the morning:** a branch where a T1 character crafts a weapon, opens its tree,
buys cards with shards dropped by mob families on blended nodes, pays a boss gate, and
sees every card on screen; armor, charm and boots trees present with provisional lanes;
catalysts, node modifiers and the +N ladder gone; a bench table per lane per node; and a
morning report. Frame loops (Phase 3) and the T2 band (Phase 5) are NOT in scope: both
wait on the designer's per-root calls.

---

## Conductor prompt

```
You are the conductor for an overnight implementation run. Working directory is
../mmo-lineages on branch feat/lineage-data-model (Phases 1a and 1b of
docs/progression-rework-plan.md are committed there). Read
docs/briefs/overnight-progression-2026-09-30.md in full, then
design_docs/progression-rework-design.md and docs/progression-rework-plan.md.

Run the three waves in that brief. For each task, spawn one subagent with the Agent
tool using the prompt in the brief verbatim, the model the brief names, and
isolation "worktree". Run every task of a wave in parallel and wait for all of them.
Then merge that wave into feat/lineage-data-model in the brief's order, resolving
conflicts yourself, and run `pnpm typecheck` and `pnpm test` (the full suite) before
starting the next wave. If a task's subagent reports failure or a merge leaves the
suite red, fix it if the fix is under an hour of work, otherwise leave that task's
branch unmerged, record why in the morning report, and continue.

Hard rules for you and every subagent:
- Never run `pnpm install`, `npm install`, or any install, in any worktree or container.
- Never push. Never rebase, reset --hard, force, or amend. Commit often on the task
  branch; one logical change per commit; end commit messages with the attribution
  line from the session's system reminder.
- Strip carriage returns from every touched file before committing (the repo index is
  LF; worktree files are often CRLF; a whole-file diff on a one-line change means CR
  leaked). `git diff --stat` on a touched file should show only the lines changed.
- Tests must not need Postgres or Redis. Construct World directly.
- Subagents run only related tests plus `pnpm typecheck`. The full suite is yours,
  once per wave merge.
- Do not touch frame nodes (rootsAndFrames.ts frames or range nodes), abilities.ts
  ranks, or monster numbers. Those are the designer's.
- Where the code and the plan sketch disagree, the code on the branch is the
  authority; record the divergence in the plan's progress note for that phase.

Finish by writing docs/briefs/overnight-report-2026-10-01.md in the format at the end
of the brief, committing it, and stopping. Do not open a PR.
```

---

## Wave 1 — three tasks in parallel, from `feat/lineage-data-model`

Merge order after all three finish: **1c runtime, then 2a variants, then client.**

### Task W1-A — Phase 1c card runtime and the `mechanic-fired` seam · model: opus

```
Implement Phase 1c of docs/progression-rework-plan.md on a branch
feat/lineage-runtime off feat/lineage-data-model. Read the "Phase 1c contract" section
at the end of the plan first, then §1.3 and §1.6, then design §6 and §8.

Deliver:
1. shared/src/protocol/combatEvents.ts: the `card-fx` CombatEvent member exactly as the
   contract gives it.
2. server/src/systems/combat/engine/mechanicFired.ts: `emitMechanicFired`, with one
   call site per root as the contract's table lists. Find each root's real seam
   (cadence and cooldown consume the empowered flag in
   server/src/systems/combat/engine/empoweredAttacks.ts or their prototypes; dot max
   stacks in the dot archetype; reload completion; energy burst; summoner command).
3. server/src/systems/combat/lineageCards.ts: `registerLineageCards()`, called from
   initCombatSystems(). One listener per TriggerKind. Read the resolved active cards
   and worn capstone via `resolveActiveLineages` from a per-entity cache refreshed on
   recalc (store on TracksCombat through the helper API, never raw maps). Dispatch each
   PayoffKind to the existing hook the types.ts comment names; do not add combat
   primitives. Push exactly one `card-fx` per application. Timed payoffs also apply the
   `lineage.<payoff>` status effect with `data: { totalMs, magnitude }`. Every on-target
   applier early-returns on `evadeBlocksDebuffs(ctx)`. `damage-window` writes
   ctx.metadata.empoweredMultiplier only.
4. Tests: server/test/lineageCards.wiring.test.ts (one active card per trigger kind,
   tick, observable payoff, evade blocks the on-target ones, exactly one card-fx per
   application) and server/test/mechanicFired.test.ts (one emission per event; never
   two on one hit for cadence and cooldown; one per fill for dot).
5. A progress note under Phase 1 in docs/progression-rework-plan.md listing what
   shipped and any divergence from the contract.

Run only related tests plus pnpm typecheck. Strip CR from touched files. Commit on the
task branch. Report the listener list, the six call sites, and anything you could not
express with an existing hook.
```

### Task W1-B — Phase 2a variants, blends, family spawning, map · model: opus

```
Implement Phase 2a (§2.1 and the map half of §2.2) of docs/progression-rework-plan.md
on a branch feat/variants off feat/lineage-data-model. Read design §12 first. The
family data already exists in shared/src/data/families/ (its `drops` half is live);
you are adding blends and family-driven spawning and the map surface.

Deliver:
1. shared/src/world/map/types.ts: replace `modifier?: NodeModifierFamily` on
   WorldNodeAuthoring with `blend: Partial<Record<FamilyId, number>>` (shares sum to
   1). Keep `modifier` readable for one more phase ONLY if removing it breaks the
   build outside your scope; if so, mark it deprecated and record it. Phase 2b deletes
   modifiers.
2. shared/src/world/map/authoring.ts: `buildRegionNodes` takes a per-biome `blends`
   list whose length sets the node count (this replaces the modifier list as the count
   source; move the warning). Author five blends per T1 biome in regionT1.ts, e.g.
   70/20/10, 20/70/10, 10/20/70, 45/45/10, 34/33/33, so each node reads as one
   dominant family. T2–T4 regions: author blends from their existing pools only if the
   families for those biomes exist; otherwise give every node an even blend over a
   single synthetic family per biome and record it as a gap.
3. server/src/systems/world/spawning/index.ts: pick the family by the node's blend,
   then a mob within the family. Use deterministic cycling per family (a counter on
   the node), not Math.random, so a 70/20/10 node visibly spawns 7-2-1.
4. Map: client/src/ui/map/NodeInfo.tsx shows the dominant family and its shard;
   the boss band shows the capstone material name (shared/src/data/lineages/
   capstones.ts). Replace ModifierIcon usage with a shard icon; a text glyph is fine.
5. Tests: server/test/variantBlend.test.ts (shares sum to 1 per node; over 30 spawns
   the family composition matches the blend within one mob), and extend the families
   test so every T1 node's blend keys exist.
6. A progress note under Phase 2 in the plan.

Do not remove catalysts, node modifier math, or reward multipliers; that is Phase 2b.
Run only related tests plus pnpm typecheck. Strip CR. Commit on the task branch.
Report the node count per biome before and after, and any region you had to stub.
```

### Task W1-C — Client: tree panel, inventory, HUD, FX · model: sonnet

```
Implement Phase 1d (§1.4) of docs/progression-rework-plan.md on a branch
feat/lineage-client off feat/lineage-data-model. Read design §2, §4, §5, §8 and the
"Phase 1c contract" at the end of the plan. The interaction design is the mockup at
docs/briefs/lineage-tree-mockup.html: open it and reproduce its structure (lane
headers, lit band, rows of three cards with locked/available/owned/active states, the
gate with forms, the dimmed silhouette of the next band, the side column with mastery
ticks, wallet and build readout). Real data comes from PlayerView.lineages, .shards,
.capstones and LINEAGE_DATABASE; gate every button with the shared checks in
shared/src/systems/lineages.ts exactly as ForgeTab gates with checkUpgrade.

Deliver:
1. client/src/ui/lineage/LineageTreePanel.tsx + lineageTree.css, reusing
   SkillTreePanel card/lock styling and MaterialChip. Works at 400px width.
2. Intent helpers for lineage:unlockCard / setActive / unlockForm / wearForm through
   hudBus and the intent layer (no direct socket emits from UI); handle
   lineage:result (refresh, or show the reason).
3. Inventory: EquipmentSlots shows the lineage name and worn form; tapping a slot
   that holds a lineage opens its tree. The backpack hides forms of an owned lineage.
   UpgradeTab and EvolutionPreview are hidden for weapons; leave them for other slots.
4. Materials panel: shards (eight, by packet) and touched capstones next to essences.
5. HUD: a lane-coloured buff clock for `lineage.<payoff>` status effects through the
   existing buff atoms, and a stack counter where `data.stacks` is present.
6. FX: in client/src/render/combatFx.ts, one handler per LineageFxKey for the
   `card-fx` event per the contract (draw at pos or targetPos; lane colours: Tempo
   amber, Empowered crimson, Affliction green, Control ice, Kill chain gold,
   Engagement white). Keep each effect small and readable: ghost strike, plating
   crack, pips, arc, flash, ring. Unknown keys draw nothing. The stat-row trail tint
   is derived from the active stat card's fx key.
7. Do not build the event; W1-A adds `card-fx` to CombatEvent. Until it merges, add
   the member locally in your branch exactly as the contract text gives it; the merge
   will dedupe.

Run pnpm typecheck and any client tests. Strip CR (StatPanel.tsx and other client
files have leaked CR before). Commit on the task branch. Report the panel's file list
and any PlayerView field you needed that was missing.
```

---

## Wave 2 — three tasks in parallel, from `feat/lineage-data-model` after the wave 1 merge

Merge order: **removal, then defensive trees, then bots.**

### Task W2-A — Phase 2b removal, migration, docs archive · model: sonnet

```
Implement Phase 2b (§2.2 wallet half and §2.3) of docs/progression-rework-plan.md on a
branch feat/remove-old-economy off feat/lineage-data-model. The lineage tree, shards,
capstones, blends and family spawning are already merged.

Deliver:
1. Remove: node modifier math (shared/src/world/nodeModifiers.ts), NODE_MODIFIER_FAMILIES
   and nodeModifierMap.ts, the modifier reward multipliers, TracksProgression.catalysts
   and .catalystProgress and their config keys, catalystCost / reconstructCatalystCost
   on recipes and upgrade steps, the socket events inventory:upgradeItem and
   crafting:evolveItem with their handlers, UpgradeTab, EvolutionPreview,
   ModifierIcon, and Recipe.upgrades on WEAPON recipes. Keep Recipe.upgrades on armor,
   recovery and mobility recipes until their trees ship (W2-B ships them in this same
   wave; coordinate by leaving the field and letting W2-B's merge delete it if it is
   unused after both land — record the state either way).
2. Migration: server/src/db/migrations/0009_progression_rework.sql plus playerRepo
   hydration: drop catalyst wallets; for every itemUpgrades entry, refund the sum of
   the item's authored upgrade costs up to that level as essence, then drop the entry;
   log the refund per character; keep every held form owned and worn (lineageSync
   already does this).
3. Tests: retire catalystRekey, nodeModifiers.wiring, evolutionPreview; rewrite
   rewardMultiplier for shards; add upgradeRefundMigration.test.ts (hydrate a fixture
   with +3 items, assert the essence refund and the retained forms).
4. Docs: archive aspects-catalysts-current-state.md, node-modifiers-current-state.md
   and gear-evolution-current-state.md under docs/archive/ with the one-line ARCHIVED
   header; write docs/lineages-current-state.md and docs/variants-current-state.md;
   update docs/README.md, docs/system-rework-status.md, design_docs/economy-philosophy.md
   §2, docs/map-variety-plan.md (modifier vocabulary superseded); progress note under
   Phase 2 in the plan.

Run only related tests plus pnpm typecheck. Strip CR. Commit on the task branch.
Report every file deleted and every test retired.
```

### Task W2-B — Armor, charm, boots trees (provisional) · model: sonnet

```
Implement the authoring half of Phase 4 of docs/progression-rework-plan.md on a branch
feat/defensive-lineages off feat/lineage-data-model, using design §17 (provisional
non-weapon lane matrices) as the lane assignment and §3.1 for faces. These trees are
provisional and flagged for the designer's review; author them so they exist to
playtest, not so they are final.

Deliver:
1. Fifteen lineage files in shared/src/data/lineages/ (five biomes × armor, recovery,
   mobility), each with lanes from §17, forms from the existing T1 and T2 recipes of
   that line (recipeIds in shared/src/data/recipes/<biome>.recipes.ts), a T1 payoff
   row (no stat row), and a T2 capstone per form. Card `face` is derived from the
   packet per §17. Trigger/payoff per slot per §17. Add the new LineageFxKeys the
   cards need (defensive signatures: blur, pulse, ward shell, plating chip, sparks)
   and register them in LINEAGE_FX_KEYS.
2. Extend shared/src/data/lineages/coverage.test.ts to all slots with the defensive
   rule: every packet completes on ≥2 non-weapon lineages across the three slots, and
   every lane has a form whose capstone crowns it (extend UNCROWNED_LANES only with a
   comment naming the gap).
3. The shard-sourcing stopgap in §17: the boss kill also drops two shards of the
   biome's weapon lineage Lane A packet (server/src/systems/player/progression/
   rewards.ts, next to the capstone grant), with a test.
4. Client FX handlers for the new keys in client/src/render/combatFx.ts, small and
   readable.
5. Mark every new lineage file header PROVISIONAL and list them in the Phase 4
   progress note in the plan.

Run only related tests plus pnpm typecheck. Strip CR. Commit on the task branch.
Report the fifteen lineage ids and any lane that could not be expressed with the
existing PayoffKinds.
```

### Task W2-C — Bot lane profiles, bench matrix, telemetry · model: opus

```
Implement §1.5 of docs/progression-rework-plan.md on a branch feat/lineage-bench off
feat/lineage-data-model. The tree, runtime, shards and blends are merged.

Deliver:
1. bot/src/tierEntry/profiles.ts: a profile gains `lane: PacketId`; route steps gain
   `unlockCard` and `setActive`; generate three reference profiles per frame (one per
   weapon lane) for the five T1 weapon lineages, buying the stat and payoff card of
   the lane as mastery allows.
2. Bench: extend server/bench (the balance bench, or phase0Recovery's harness if it
   is the cleaner base) to run each reference profile against each T1 node blend and
   report TTK per lane per node plus the lane budget check from design §9 (full rows
   within ±10% of the tier median on the lane's favoured family) and the encounter
   check (favoured lane wins by ~30%, punished lane still clears). Two seeds. Write
   the table to reports/progression-phase1/lane-matrix.md.
3. Telemetry: gameplay events lineage.card-unlocked, lineage.card-swapped,
   lineage.gate-paid in the logdb event contract (docs/gameplay-telemetry-current-state.md
   names the tables), with the recorder wiring and a test that they are emitted.
4. Do not change any magnitude in shared/src/data/lineages/magnitudes.ts; report
   which lanes are off budget and by how much so the designer can tune.

No Docker needed; construct World directly. Run only related tests plus pnpm typecheck.
Strip CR. Commit on the task branch. Report the lane-matrix table and the off-budget
list.
```

---

## Wave 3 — conductor only

1. Merge wave 2 in order. `pnpm typecheck`, `pnpm test`. Fix or set aside per the rules.
2. Run `/code-review high` on the merged branch diff against `develop`. Fix CONFIRMED
   correctness findings; list the rest in the report.
3. Write `docs/briefs/overnight-report-2026-10-01.md`:

```
# Overnight report — 2026-10-01

## Branch state
feat/lineage-data-model at <hash>; merged: <task branches>; unmerged: <task branches, why>.
typecheck: clean/failing. Full suite: N/N, runtime.

## What to playtest (in order)
A numbered checklist a human follows in the client: craft a Flash Rapier, open the tree,
… ending with a boss gate and a second form. Note anything that will look wrong and why.

## Divergences from the plan
One line each: what the plan said, what the code does, why.

## Bench
The lane-matrix table and the off-budget list from W2-C, unedited.

## Code review
CONFIRMED findings fixed; PLAUSIBLE findings left, one line each.

## Gaps and open decisions for the designer
Bullet list, including: every PROVISIONAL lineage; the Engagement/Bulwark/Barrier-tempo
shard sources; any region stubbed in W1-B; anything a subagent could not express with
the closed vocabulary.
```

4. Commit the report. Stop. Do not push, do not open a PR.
