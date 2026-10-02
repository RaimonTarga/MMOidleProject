# Review brief — feat/lineage-data-model against develop (2026-10-02)

One Opus conductor session in `../mmo-lineages`, on `feat/lineage-data-model` (tip
`2d14df6c`, merge-base with `develop` = `3204ce52`, 337 commits, ~670 files). Subagents
(Opus) one per area below, run in the prepared worktrees `../mmo-lin-w1a`, `w1b`, `w1c`,
`w1d2`, `w2a`, `w2b`, `w2c` (each: `git checkout --detach 2d14df6c` first; they are
junctioned to this worktree's pnpm store, so never `pnpm install` in any of them; never
push; never kill processes by image name). This is a REVIEW: no code edits anywhere.
Output is one findings file; the designer's session fixes what is confirmed.

## What the branch is

The progression rework: lineage trees (slot holds a lineage; cards per packet; forms at
boss-gated gates), packet shards by mob family, biome variants as family blends, flat
Recovery, frame loops, keystones, ability nodes, T1 boss pass, tutorial tree beats, bot
harness extensions. Authority: `design_docs/progression-rework-design.md` (§0–§23) and
`docs/progression-rework-current-state.md` if present (else the run reports in
`docs/briefs/overnight-report-2026-10-01.md`, `run3-report-2026-10-01.md`,
`run4-report-2026-10-02.md`, `t1-boss-pass-report-2026-10-02.md`). `CLAUDE.md` rules
apply: server authoritative, component presence gates behaviour, no per-tick booleans on
networked slices, `mutateSlice`/`markSliceDirty` for in-place networked mutation, shared/
imports nothing from server/client/Node, status-effect `data` is numbers only, every
on-hit applier early-returns on `evadeBlocksDebuffs`, one multiplier per hit.

## Areas (one subagent each)

1. **Lineage data + resolution** — `shared/src/data/lineages/**` (types, magnitudes,
   resolve, packets, capstones, every `<lineage>.ts`), `shared/src/systems/lineages.ts`.
   Questions: does every lineage pick exactly 3 lanes from the 9-packet union; does the
   magnitude table produce every card's number (no number on a card); band gating by the
   worn form's biome (§21); GM band; T3/T4 bands reachable; coverage tests actually
   enumerate the union; any map/switch that silently drops a packet.
2. **Lineage runtime + economy** — `server/src/systems/player/economy/lineages.ts`,
   `lineageSync.ts`, `server/src/systems/combat/lineageCards.ts`, `mechanicFired.ts`,
   `keystones/**`, `rangeMechanics.ts`, migration in `server/src/db/**` (wipe upgrades,
   refund essence, keep forms). Questions: server authority on every purchase/switch; the
   50% switch discount cannot be farmed; sanitiser on the shard wallet; a card pays only
   while its own form is worn; keystone listeners registered through `initCombatSystems`
   only; dirty-marking of networked slices; persistence round-trip of lineage state.
3. **Combat listeners** — frames/ranges, Technique packet, evasion-window, Consort loop,
   `empoweredMultiplier`, DoT DR share, `evadeBlocksDebuffs` on every new applier,
   `pushEvent` for fx (no per-tick flags). Diff: `server/src/systems/combat/**`,
   `shared/src/data/skillTree/**`, `shared/src/components/**`.
4. **Families, blends, monsters, bosses** — `shared/src/data/families/**`,
   `shared/src/world/map/regionT1–T4*`, `shared/src/data/monsters/**`,
   `shared/src/biomeDatabase.ts`, drops remap. Questions: blend share vectors sum to 1;
   node count = blend list length (the ban-table trap in memory); every packet has ≥2 T1
   shard sources counting the boss stopgap; the T1 third-family mobs have sprites/frame
   maps/corpse entries; boss pass rows match `bossesT1.ts` comments; `evasion` ≤ 0.25.
5. **Recovery + pools** — `shared/src/data/recovery.ts`, `gameConfig.ts`
   (`RECOVERY_REFERENCE_POOL_BY_TIER`, `OOC_RECOVERY_PCT`, `PLAYER_POOL_FACTOR_BY_TIER`),
   `server/src/systems/defense/regen/**`, charms, tier-up recalc, minion downtime,
   `core.recovery-mult` quantisation, the heal-log carry (`554abca2`). Questions: flat
   HP/s everywhere, no %-of-max path left; OOC fixed 10%/s independent of the stat;
   tier-up rebuilds on the causing kill; HUD formatting single source.
6. **Client** — `client/src/ui/lineage/**`, `client/src/hud/**`, `client/src/render/**`,
   `client/src/net/**`, materials panel, map shard icons, combatFx lane colours, frame
   glow. Questions: client decides nothing; intents only via helpers; `hudBus`/Jotai;
   `DEPTH` bands; background-tab safety; the 9th packet's colour/label everywhere the
   other 8 appear.
7. **Tutorial + bot + bench + protocol** — `shared/src/tutorial/**`, `bot/src/**`,
   `server/bench/**`, `server/scripts/_t1Boss*.ts`, `shared/src/protocol/**`,
   `server/test/**`, `shared/src/**/*.test.ts`. Questions: protocol changed in shared first
   with no parallel types; tests construct `World` directly (no Postgres/Redis); the
   capstone-loop fix (`1503e5e4`); `doAttemptBoss`; any `_`-prefixed script that a test
   imports; `tsconfig.bench.json`/`tsconfig.test.json` include lists; CRLF whole-file
   churn (`git diff --numstat develop...HEAD` rows with equal add/del are suspects).

## Rules for findings

- Verify before reporting. A finding is CONFIRMED only after reading the code path end to
  end (and running the relevant test or a 10-line repro where cheap); otherwise mark it
  PLAUSIBLE with what would confirm it. Report nothing you did not look at.
- Each finding: area, `file:line`, one-sentence defect, concrete failure scenario (input →
  wrong output/crash), severity (blocks merge / fix before playtest / later), and the
  smallest fix. Rank most severe first.
- Balance numbers are NOT findings (the designer owns them) unless a number contradicts
  its own comment or test. Style is not a finding. Docs drift IS a finding when a doc
  claims something the code does not do.
- Also report: every test that fails on the tip; `pnpm typecheck` output; every TODO or
  "provisional" left in shipped code with its location.

## Deliverable

`docs/briefs/lineage-branch-review-findings-2026-10-02.md`, committed on the branch, with
a one-paragraph verdict first (merge now / fix N first), then findings ranked, then the
unverified list. Run `pnpm typecheck` and `pnpm test` (full suite, ~6 min) once on the
tip before you start, so every subagent reads the same baseline.
