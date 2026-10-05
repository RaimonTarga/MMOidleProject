# Legibility run — brief (2026-10-05)

Implements design **§26** (progression-rework-design.md): T1 deepens and T2 branches
(§26.1), one damage-over-time record per weapon (§26.2), nodes as rosters (§26.3), the
HUD and panels (§26.4), the run calls (§26.5). The composite mockup is the visual target:
https://claude.ai/artifact/6a6e1DPH6gQGs8WbdiMAnc (Stone skin; the Ornate skin is NOT in
this run). **Opus conductor** in `../mmo-lin-w2c` on `feat/legibility` off `develop`;
Opus subagents in `../mmo-lin-w1a`, `w1b`, `w1c`, `w1d2`, `w2a`, `w2b` (all merged and
clean; `pwd`, `git status`, `git branch --show-current` before the first commit in any of
them). Never `pnpm install`, never push, strip CR on touched files only, never kill by
image name, one dev server + one game DB per bot arm (ports 4301+), full suite +
typecheck before each merge into `feat/legibility`. Read §24 whole, §26 last, the
status registry audit (docs/briefs/status-registry-audit-2026-10-05.md), the UI
prototypes report (docs/briefs/ui-prototypes-report-2026-10-04.md, "Worth reusing" and
"What no thesis solved"), and docs/lineages-current-state.md §3a, §3b, §11–§13.

**Provisional numbers (the designer's, flagged in data comments, revertable per row):**
- T1 lean trio: Attack +8% / Speed +8% / Effect +10% at rank I; each further rank adds
  half of rank I again (rank III = 2× rank I). Rank gates on Global Mastery: the lean gate
  (today's stat-row value), +4, +8. Rank cost: rank I today's lean cost; II and III ×1.5 and
  ×2 in the same shard and essence.
- The fixed T1 verb per weapon: Dagger *Into the Wound*; Rapier *Flurry* (Tempo pure);
  Hammer *Easy Prey* (Control; the Effect lean's slow is its source); Axe *Chopping Rhythm*
  (Tempo pure); Broadsword the Technique pure sentence. The designer may swap any of these.
- Effect on a weapon with no mechanic (Rapier, Axe) = the verb's payload size, same
  percentages.
- Teaching: a card's first **3** firings show the word; counter persisted per character.
- Rosters: T1 nodes only in this run (T2–T4 blends untouched, listed as follow-up).

## Wave 0 — conductor
1. Baseline on develop: the boss lab plan (`reports/t1-boss-pass/plan-base.json`, 30
   seeds) and the composition matrix (`_t1BossPlan.ts --matrix=composition`, 10 seeds) →
   `reports/legibility/before-*.jsonl`. The matrix becomes 5 weapons × 3 leans × 3 ranks ×
   1 verb at T1 after wave 1; keep the old 45-pair run as the "before".
2. Write `reports/legibility/SCOPE.md`: the file ownership map below, so no two
   subagents edit one file.

## Wave 1 — parallel

### A — the band (§26.1) · `w1a` · branch `feat/lg-band`
Owns `shared/src/data/lineages/**`, `shared/src/systems/lineages.ts`,
`server/src/systems/player/economy/lineages.ts`, `lineageSync.ts`, `server/bench/lineage/**`,
`server/scripts/_t1BossPlan.ts` (matrix rows).
- Row model: the T1 `stat` row gains `ranks` (data: per-rank magnitude and gate; `rank`
  in `LineageProgressMap.active`/owned state; buy = next rank; hydration normalises a
  missing rank to I). `RowKind` unchanged; `rowLabel` reads "Lean" with "rank N".
- T1 lean cards per weapon become three generic cards (`<weapon>-t1-attack`, `-speed`,
  `-effect`) with the trio's stats; `effect` maps to the weapon's mechanic potency stat
  (`dotPotencyPct` on DoT weapons, `slowOnHit` depth on the Hammer, the Technique refund
  on the Broadsword) or `payloadScale` on the Rapier and Axe. §24.9's seeding is preserved
  through Effect (the Dagger's reservoir, the Hammer's slow).
- T1 `payoff` row holds ONE card per weapon, the fixed verb; purchase as today at the
  Forest-4 Global Mastery gate; the page shows it as the weapon's own.
- T2 band = the three lane leans (today's T1 lane stat cards, re-tiered to 2 with §24.9's
  T2 magnitudes) + the three T2 verbs + the amplifier row, composing per §24.2/§3b.
  `composeVerb` unchanged; the T1 pair composes Effect × the fixed verb.
- Bench: composition matrix instrument takes rank as a row; the lane bench reads ranks.
- Tests: `coverage.test`, `composition.test` (T1: 5 weapons × 3 leans × 3 ranks; T2:
  unchanged 45 pairs), `reachability.test` (rank gates never drop within a tier, rank III
  ≤ the gate), hydration tests for rank normalisation, `lineageEconomy` for rank prices.
- NOT: the client page (D reads A's model), the tutorial (wave 2).

### B — one DoT per weapon and the status registry (§26.2) · `w1b` · branch `feat/lg-dot`
Owns `server/src/systems/combat/damage/{bleedIds,weaponReservoir,weaponEffects,dotInventory}.ts`,
the lineage payload runtime for `hemorrhage`/`poison-stack` under
`server/src/systems/player/lineages/**` (read A's data shape first; coordinate ids with A
through the conductor), `client/src/hud/{statusHelp,targetStatusMeta,statusTooltips}.ts`,
`client/src/ui/conceptIcons.ts`, `client/src/hud/TargetFrame.tsx`.
- On a weapon with a reservoir (`weaponDot`): the Effect lean multiplies the reservoir's
  potency; the Affliction verb re-doses the reservoir (adds to what is owed) — no
  `lineage.*` bleed record is ever created on that weapon.
- On a weapon without one: `LINEAGE_BLEED_ID` and `LEAN_BLEED_ID` collapse to one id
  `lineage.bleed`, a reservoir every hit adds to (B's rule from verbs-that-fire A kept);
  `lineage.poison` reviewed: retire if no live writer, else same treatment.
- Registry: every lineage status id gets label, help, badge colour and an icon alias
  (audit gap list); `stunned` gets a player tile; dead entries (`root`, `vuln`,
  `void-corruption`, `debuff-stunned`) removed; the Control lean's slow and root get their
  own labels ("Hobbled", "Pinned") instead of Hamstrung/Bound.
- Target frame: one badge per effect, the number = damage still owed (DoT) or seconds
  (slow/root), icon from the registry; D's three fixed homes (owes / slowed / held).
- Tests: `lineageDots.test`, a wiring test per weapon class (Dagger: one record on the
  target after lean + verb; Rapier: exactly `lineage.bleed`), `_statusAudit.ts` rerun with
  zero gaps pinned as a test.

### C — rosters (§26.3) · `w1c` · branch `feat/lg-rosters`
Owns `shared/src/world/map/regionT1.ts` blends, `shared/src/world/nodeBlends.ts`,
`nodeShards.test.ts`, `server/bench/familyContracts.ts` reads.
- Every T1 normal node fields its dominant family and at most ONE guest (authored shares
  like 1.0 or 0.75/0.25); one node per biome, the last before the dungeon, is the
  crossroads with all three at ~equal shares. Node count unchanged (the blend list sets
  it; see `authoring.ts`'s warning).
- The crossroads pays its dominant-by-a-hair shard (provisional; §26.3 open).
- Test: no T1 node fields three families except the five crossroads; every family in a
  biome leads ≥ 1 node; `nodeShards.test` still holds.
- Contract bench once on T1 (`FAM_TIERS=1`), table in the report. Spawner needs no change
  if `resolveNodeBlend` handles two-family blends (verify, test).

### D — the HUD and the panels (§26.4) · `w1d2` · branch `feat/lg-ui`
Owns `client/src/hud/{RhythmReadout,rhythmReadout*,BuffBar,MobileHUD,MenuButtons}.*`,
`client/src/fx/cardWord.ts`, `client/src/ui/lineage/**`, a new `client/src/ui/stats/**`,
`client/src/ui/crafting/MakeTab.tsx` (the Upgrade tab's slot), `client/src/hudBus.ts`,
plus the persisted teaching counter (`shared/src/components/core` slice + server write;
coordinate the one field with A through the conductor).
- **Ring**: one per active verb, beside the HP bar on desktop and as the top bar's second
  row on portrait (E's placement). States: clock (cap), *coming* (last second brightens),
  *ready*, *blocked* (dashed; condition absent: no affliction / no held target), and an
  *away count* (firings while the tab was hidden or the fight off screen, shown on the ring
  until the next firing). Rings are named (the verb's short name under the ring).
- **Proc strip removed.** The floating word plays for a card's first three firings
  (persisted counter; a firing counts only if the fight was on screen), then never.
- **Upgrade panel**: the old Upgrade/Make tab's slot, named "Upgrade"; opens on the worn
  items (weapon first, step pips, "N ranks to buy" badge); the weapon opens its page;
  plain items say "plain item". The page: the "In the fight" plate (the composed sentence,
  re-reading under rank preview), lean row with ranks and a rank-up control, the fixed verb
  with its mini ring and E's beat line, the locked T2 choice row (three verbs), the gate.
  Clicking the equipped weapon still opens the page.
- **Stats panel** of its own in the menu (D's dense ordered layout; offence, defence,
  recovery, movement & rhythm; the lean's share in lane colour, each number's source).
  Remove the expanding stat sheet from the inventory.
- **Node banner**: family and shard line stays on screen (D's territory line), not only
  on arrival.
- Portrait: everything above at 390 wide; the camera floor question is NOT in scope (list).
- Tests: `rhythmReadoutModel` tests for the five states; a weaponPageModel test for ranks;
  the repro harness screenshots (desktop + portrait) of each view for the report.

## Wave 2 — after wave 1 merges (A → B → C → D into `feat/legibility`)
### E — tutorial, bot, sweep · `w2a` · branch `feat/lg-tutorial`
- The tree lesson follows §26.1 once: lean I at Cave 2 (Swamp 2 for the Slinger), the
  verb at Cave 4 / Swamp 4, rank II where the mastery gate allows inside the leg; the
  lesson names the Effect lean and the weapon's own verb; no pair choice to teach. The
  first-hour checklist holds (≤ 2 new ideas per level). Concept `rhythm-ring` copy updated
  for the ring states; `lesson.ring` points at the ring beside the HP bar.
- `bot/src/routes/tutorialRoutes.ts` buys ranks; `liveRouteActions`, `t1Routes.semantic`,
  `harness` green. Canonical 1x six-class sweep, one server + DB each (gamedb_lg1..6),
  firings recorded; gate paid for all six; Mountain seal attempts vs the verbs-that-fire sweep.

## Close-out — conductor
- Full suite + typecheck on `feat/legibility`; composition matrix after (T1 ranks, T2
  pairs) against before; boss lab after/before on the no-band plan (must be byte-identical:
  a character with no cards is unchanged) and on the tutorial kit (every class ≥ 70%, no
  class 100% on all five — the §boss-pass bar; if a rank-III kit breaks it, say so, do not
  retune bosses).
- Docs: fold into docs/lineages-current-state.md (§3a rewritten for §26.1, a §16 for the
  HUD/panels), docs/guided-tutorial-current-state.md, docs/README.md; this brief's status.
- Merge `feat/legibility` → develop (no push). Report
  `docs/briefs/legibility-report-2026-10-05.md`: every number picked, the matrices, the
  sweep ledger, screenshots per view, the status-registry zero-gap proof, unverified list,
  open calls (crossroads shard, T2+ rosters, camera floor, the Ornate skin).

## Not in scope
The Ornate skin and any ornament (later track). Boss reach (parked). Non-weapon trees
(parked). Monster numbers. The ability pass (§22, next). T2–T4 blends. Tick quantisation.
