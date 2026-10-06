# Legibility run — scope and file ownership

Brief: `docs/briefs/legibility-run-2026-10-05.md` (design §26). Conductor in
`../mmo-lin-w2c` on `feat/legibility` (off develop `7360e3b0`). This file is the
contract between the wave-1 agents: **no two agents edit one file** except where a row
below names a shared seam and who goes first. If you need a file another agent owns, ask
the conductor (stop and report) instead of editing it.

## Rules for every agent

- Work ONLY in your own worktree. Before your first commit: `pwd`, `git status`,
  `git branch --show-current`. Foreign modified files in `git status` = stop.
- Never `pnpm install`, never push, never merge into anything, never `git checkout` another
  branch in your worktree, never kill processes by image name (kill by PID you started).
- Line endings vary PER FILE in this repo (`* -text`). Keep each touched file's committed
  endings: after editing, `git diff --numstat <file>` must show only your lines. If a small
  edit shows the whole file, fix that file's endings to match `git show HEAD:<file>`.
  Never mass-normalise.
- Tests are tsx scripts (`pnpm test -- <substr>` for a subset, a single file with
  `node --conditions=development --import tsx <file>` from its package dir). Run related
  tests + `pnpm typecheck` while working; run the FULL suite (`pnpm test`) once before you
  report done, and report the pass count (baseline at develop: see the conductor's note in
  your prompt).
- Provisional numbers are the designer's: put each in data with a `PROVISIONAL (legibility
  run, designer's number)` comment so it can be reverted per row.
- Commit in small logical commits on your branch with the attribution trailer. Report:
  branch tip, commits, tests (counts), what you could not verify, open questions.

## Worktrees and branches

| Agent | Worktree | Branch | Part |
|---|---|---|---|
| conductor | `../mmo-lin-w2c` | `feat/legibility` | baselines, merges, close-out |
| A | `../mmo-lin-w1a` | `feat/lg-band` | the band (§26.1) |
| B | `../mmo-lin-w1b` | `feat/lg-dot` | one DoT per weapon + status registry (§26.2) |
| C | `../mmo-lin-w1c` | `feat/lg-rosters` | rosters (§26.3) |
| D | `../mmo-lin-w1d2` | `feat/lg-ui` | HUD and panels (§26.4) |
| E (wave 2) | `../mmo-lin-w2a` | `feat/lg-tutorial` | tutorial, bot, sweep |
| baselines | `../mmo-lin-w2b` | detached at develop | "before" boss lab runs (conductor only) |

Merge order into `feat/legibility`: A → B → C → D. After A lands, B, C and D merge
`feat/legibility` into their own branch (the conductor tells you when) and re-run.

## File ownership

### A — the band
- `shared/src/data/lineages/**` (all lineage data, magnitudes, sentences, resolve, packets,
  their tests)
- `shared/src/systems/lineages.ts` and `shared/src/systems/lineages.test.ts`
- `server/src/systems/player/economy/lineages.ts`, `server/src/systems/player/economy/lineageSync.ts`
- `server/bench/lineage/**`, `server/bench/compositionLanes.ts`, `server/bench/compositionReport.ts`
- `server/scripts/_t1BossPlan.ts`, `server/scripts/_t1BossLab.ts` (matrix rows, rank purchases)
- server tests about the economy/data: `lineageEconomy`, `lineageComposition`,
  `compositionPairs`, `lineageAmplifiers`, `lineageReview*`, `lineageTelemetry`,
  `weaponReachability`, any hydration test for ranks
- **Allowed outside its area, id substitutions ONLY** (to keep the suite green when T1 card
  ids change): `shared/src/tutorial/**`, `bot/**`, and any other test file. E reworks the
  tutorial and bot properly in wave 2; B and D own the runtime/UI tests and will re-merge.

### B — one DoT per weapon and the status registry
- `server/src/systems/combat/damage/{bleedIds,weaponReservoir,weaponEffects,dotInventory}.ts`
- `server/src/systems/combat/lineageCards.ts` (payload runtime: `hemorrhage`,
  `poison-stack`, `redose`, the composed heavy bleed), `server/src/systems/combat/leanConditions.ts`,
  `server/src/systems/combat/lineageKeys.ts`
- `shared/src/systems/stats.ts` and `shared/src/passives.ts` (the bleed-on-hit write: none
  on a reservoir weapon)
- `server/src/systems/combat/buffs/buffSync.ts`, `shared/src/components/combat/buffs.ts`
  (the `stunned` player tile)
- `client/src/hud/{statusHelp,targetStatusMeta,statusTooltips,buffTransitions}.ts`,
  `client/src/ui/conceptIcons.ts`, `client/src/hud/TargetFrame.tsx` (+ its css)
- the status audit script (`server/scripts/_statusAudit.ts` or wherever it lives) and its
  new zero-gap test
- tests: `lineageDots`, `leanConditions`, `lineagePayloadFx`, `lineageChaoticMiss`,
  `empoweredCap`, new per-weapon wiring tests
- **Shared seam with D:** `lineageCards.ts` is B's. D may add ONE narrowly scoped hook
  there (the firing notification for the teaching counter / away count) if
  `syncRhythmReadout` cannot see firings on its own; D says so in its report.

### C — rosters
- `shared/src/world/map/regionT1.ts` (blends only), `shared/src/world/nodeBlends.ts`,
  `shared/src/world/**/nodeShards.test.ts`, a new roster test next to it
- `server/bench/familyContracts.ts` (reads) and its report output
- the spawner is READ-ONLY for C unless `resolveNodeBlend` cannot handle a two-family or
  one-family blend; if it cannot, report before editing.

### D — the HUD and the panels
- `client/src/hud/{RhythmReadout,rhythmReadout*,BuffBar,MobileHUD,MenuButtons}.*`
- `client/src/fx/cardWord.ts`, `client/src/ui/lineage/**`, `client/src/ui/stats/**` (new),
  `client/src/ui/crafting/MakeTab.tsx`, `client/src/hudBus.ts`
- the inventory stat sheet (`client/src/ui/inventory/StatSheet.tsx`, `statSheetModel.ts`
  and its mount in the inventory) — removed; `client/src/hud/StatPanel.tsx` if the Stats
  panel replaces or reuses it
- the node banner / territory line (`client/src/hud/AreaInformation.tsx`,
  `areaInformation*.{ts,css}`)
- the HUD shells that mount the above (`client/src/hud/HUD.tsx`, `hud.css`, `rail.css`) —
  D only; B's TargetFrame changes stay inside TargetFrame
- `server/src/systems/combat/rhythmReadout.ts`, `shared/src/components/combat/showsRhythm.ts`,
  `shared/src/systems/rhythm.ts`
- the teaching counter field on `TracksProgression` in
  `shared/src/components/core/networkedSlices.ts` (that ONE field) + its hydration/persistence
  in the server's character load/save path
- tests: `rhythmReadout`, `rhythmReadoutModel`, `weaponPage`, `inventoryStatSheet` (retire
  or replace), new stats-panel model tests
- reads A's rank API (below); codes the rank parts of the page LAST, against the contract.

### E — wave 2 (not started yet)
`shared/src/tutorial/**`, `bot/**`, the concept `rhythm-ring` copy, the sweep.

## Contract 1 — ranks (A implements, D and E read)

On `LineageProgress` (`shared/src/data/lineages/types.ts`):

```ts
/** Rank bought per RANKED card (the T1 lean trio). Key absent on an owned ranked card
 *  = rank 1 (hydration normalises it in). Never present for an unowned card. */
ranks?: Record<string, number>;
```

On `LineageCard`: `leanKind?: 'attack' | 'speed' | 'effect'` (the T1 trio only).
On `ResolvedLineageCard`: `rank?: number` (the rank resolved at), `maxRank?: number`.

Exported from `@mmo-idle/shared` (A may adjust signatures if the code demands it — then
say so in the report; D adapts on merge):

- `cardRank(progress, cardId): number` — 0 when not owned, else the owned rank (≥1).
- `maxCardRank(card): number` — 3 for a ranked card, 1 otherwise.
- `resolveLineageCardAtRank(lineage, progress, card, rank)` — the card resolved at that
  rank (magnitude, sentence numbers, Global Mastery gate, cost of BUYING that rank).
- `checkUnlockCard` on an owned ranked card below its max checks the NEXT rank (gate, cost);
  at its max it refuses ("Already at rank III."). The socket intent is unchanged:
  `lineage:unlockCard { cardId }` buys the next rank.
- `cardSentence(card, progress, opts?: { rank?: number })` — the sentence at the owned rank,
  or at `opts.rank` for a preview.
- `composedSentenceParts(lineage, progress, opts?)` → `{ moment, payload, momentLane,
  payloadLane, pure } | undefined` — the two halves for the two-colour sentence (never
  parse text). `composedSentence` stays and joins them.

At T1 the Attack and Speed leans name NO payload lane (`leanLaneFor` → undefined, so the
fixed verb reads its pure pair); the Effect lean names the verb's own lane and its rank
scales what the brief says it scales.

## Contract 2 — the teaching counter and the away count (D implements)

- Persisted per character: `TracksProgression.cardFiringsTaught?: Record<string, number>`
  (card or capstone id → firings shown, 0..3). Optional; hydration normalises absent to
  `{}`; wiped by `resetPlayerProgress` like the shard wallet. Server-written only.
- The server counts a firing toward the three only while the player's client reports the
  fight on screen (the existing `player:setActive` state, plus whatever D needs for
  "the fight is on screen"). The client shows the floating word only for firings the server
  marked as teaching. No new client→server intent unless D finds one unavoidable.
- The away count lives on the `ShowsRhythm` moment (runtime only, never persisted): firings
  while not on screen, cleared on the next on-screen firing.

## Contract 3 — status ids (B implements, D reads)

- One bleed id for a weapon with no reservoir: `lineage.bleed` (replaces
  `lineage.hemorrhage` and `lineage.lean-bleed`). `lineage.poison` retired if it has no live
  writer.
- The Control lean's slow and the Control root get their own ids/labels: "Hobbled" (slow)
  and "Pinned" (root). B picks the ids and lists them in its report.
- B exports, from shared, the classification D's ring needs for its *blocked* state: which
  target status ids count as "afflicted" (any DoT) and "held" (slowed, rooted, chilled,
  frozen, stunned) — e.g. `isAfflictionStatusId(id)`, `isHoldStatusId(id)` — if they do
  not exist already. Until B lands, D codes against those two names.

## Ports and databases (anything that boots a server)

| Use | Server port | Game DB | Redis index | Client |
|---|---|---|---|---|
| D screenshots | 4311 | `gamedb_lgui` | 11 | Vite 3011 |
| E sweep lanes 1–6 | 4301–4306 | `gamedb_lg1`..`gamedb_lg6` | 1–6 | — |

`:4000` and `:3000` belong to whoever else is running; never touch them. Copy `.env` from
the main repo into the worktree if the server needs it (it is gitignored). Keep Playwright
profiles and screenshots in your scratchpad, never inside the repo (nodemon restarts).
