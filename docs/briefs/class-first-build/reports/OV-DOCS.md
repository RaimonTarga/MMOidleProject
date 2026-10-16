# OV-DOCS report

**Agent:** Claude Opus 5.5 (overnight session, conductor-spawned)   **Branch:** rw/ov-docs
**Last commit:** the commit that adds this report (`git log -1 -- docs/briefs/class-first-build/reports/OV-DOCS.md`)

Docs only: no code, data or test file was edited. Every claim written was checked against the code
on this branch (`8ca5e6ef` base), not against older docs.

## Done

| File | Change | Commit |
|---|---|---|
| `CLAUDE.md` | "Combat And Mechanics" no longer describes the old class roots: the reload half-damage layer, DoT stacks from attack conversion, `rootsAndFrames.ts` and the summon command intent are gone. A new compact "Classes" section: a six-row table (archetype and slice, class system and budget, core loop, T2 disciplines) and seven bullets (kits and placeholders, derived progress, the Passive Tree, `configuresClass` and `class:setConfig`, moments, runtimes and class gear, rules cost nothing and Runes as standing orders). Socket surface: `player:recallSummons`, `player:manualReload`, `player:commandSummons` marked a no-op. Repo map: `bot/`, `tools/lane/`, bot tests. Known gaps: the rework's state. | `e60abf5a`, `fa38168f` |
| `docs/guided-tutorial-current-state.md` | Rewritten (961 → 150 lines) to the guide as built: the opening, the six class builders and their T1 seams, the T2–T4 stretches, the panel, the director, the checklist, what the test pins, and what the guide does not do. | `7bcc1278`, `181192df` |
| `docs/archive/guided-tutorial-pre-rework-state.md` | The old page, moved with `git mv`, an ARCHIVED header and its relative links fixed. | `7bcc1278` |
| `bot/README.md` | Running examples on class routes; flags `--account`, `--choices`, `--class` only for `smoke-t1`; a "Class routes" section (every route, which are in `CONTROLLED_ROUTE_IDS`, the tier picks, what a route does, the gear each makes); an "Isolated lanes" section (`tools/lane/lane.mjs`, `runSummary.mjs`); build controls (`chooseClass`, `unlockSkill`, `classConfig`, `configureRunes`); "Adding a class route". | `df70954b` |
| `docs/bot-experiment-runner-current-state.md` | The registry now holds every class route; no route needs a snapshot; examples on class routes; the `-t2` snapshot conflict (below). | `df70954b` |
| `docs/system-rework-status.md` | Says plainly that the class-first rework replaces most rows: what it built, what it removed (and by which task), the older rows that still stand. Fixed the row that called weapon evolution a class-first removal (it went on 2026-10-01). | `b1ba1d05` |
| `docs/README.md` (index) | The archive move and the tutorial's new scope (required by the index rule); the bible and the build board under "Start here"; §9 Apprentice and §11 Spirit added to the lock line; the scoreboard's new description; a stale flag on the frames row. | `fe7eb0df` |

**Decisions I made (PLACEHOLDER, for the conductor to keep or undo):**

- The tutorial page was archived whole and rewritten, not relabeled in place: 85% of it was the
  pre-rework route and its sweeps, and `docs/README.md`'s lifecycle says to preserve receipts in
  `archive/` and keep the living page current. The living path is unchanged, so every link holds.
- `CLAUDE.md` grew by about 40 lines (306 → 344): the brief asked for the six classes as built. I
  replaced every stale line I found rather than adding beside it.
- `docs/README.md` was edited beyond the brief's list because `CLAUDE.md` requires the index to
  record an archive move; I kept the other index edits to plain factual corrections.

## Findings for the conductor (code, not fixed: outside my files)

1. **The guide crafts no class gear.** After the four Clearing crafts the scripts have no craft
   or equip step, so a guided player meets every T1–T4 boss in the Clearing set unless they craft
   by hand. The farewell still says "Two seals, Tier 2, and a tier-2 weapon"
   (`shared/src/tutorial/scripts/farewell.ts`). The bot routes do not mirror the guide either:
   `striker-t1` and `squire-t1` craft each seal zone's weapon job and vest (their comment says
   "the guided player wears the zone's gear"), the other four T1 routes craft nothing, and no route
   crafts the Clearing set. So no bot run measures what a guided player actually wears.
2. **Canonical experiments refuse the class T2 routes.** `scripts/experiment/lib.mjs` (canonical
   mode, around line 221) demands `--tierEntrySnapshot` for any route id containing `-t2`, a rule
   from the removed snapshot-entry routes; no class route declares `progressionEntry`, so the bot
   then refuses the snapshot. `striker-t2-*`, `squire-t2`, `conduit-t2`, `slinger-t2`, `spirit-t2`
   and `apprentice-t2` can only run in `smoke-isolated` mode or on a lane. (`-t3`/`-t4` pass.)
3. **Discipline and specialization picks no longer change the body.** `resolvePlayerFrame`
   (`shared/src/sprites/frameMaps.ts`) looks for the old frame and path node ids
   (`cadence-light`, `cadence-heavy-t3-*`...), but the class-first tree's ids are
   `striker-light`, `squire-avenger`, `conduit-pack`... So every character renders as its class
   root body at every tier, in the world (`client/src/sprites.ts`), the character portrait and the
   skill preview, and the server's hitbox resolve uses the same body. The designer's stated
   direction is "vanilla early, flashier with class stage", so this is worth a call.
4. Small: the header of `shared/src/tutorial/types.ts` still names the removed
   `bot/src/routes/tutorialRoutes.ts`; the bot dashboard shows the Rune loadout but not the class
   config; `--controlled=false` on `bot:run` is ignored (only `bot:batch` reads it; the OV briefs
   pass it harmlessly).

## Stale living docs I found but did not fix

In `docs/` (flat, living):

- `frames-current-state.md`: the whole page (frame loops per root, range rows, the at-bay layer); all removed by the class cleanups and F4. An archive candidate.
- `conduit-current-state.md`: the 2026-09-27 Conduit (frames, nine specializations, focus/move commands, the formation profile); not the class-first Formation. An archive candidate.
- `dot-systems-current-state.md`: class DoT profiles (`shared/src/systems/dotClassProfile.ts`, deleted), attack-conversion stacks and T3 DoT paths; the Apprentice now lays sigils. The monster DoT and weapon-reservoir parts still hold.
- `abilities-current-state.md`: DOC-1's D3 note is right, but ~1,100 lines still describe learning, attunement, the hotbar, Use Ability and ability node rows.
- `rune-system-current-state.md`: still describes the `use-ability` rune, attunement and the Abilities tab (the rune database has no `use-ability` now).
- `charms-current-state.md`: charms as Guard-ability amplifiers (`guard.*` keys read in `maybeFireGuard`) and the rename that freed "Core" for the core slot; nothing on class lines, second bases or the S7 timed wards.
- `recovery-current-state.md`: Guard and Second Wind recovery sources and frame-based measurements; nothing on the S4 always-on in-combat share.
- `barrier-ward-current-state.md`: barrier sources "Spirit chassis, Haunt frame, mountain + tundra charms"; the Haunt frame is gone, those charms carry timed wards (S7), and the Spirit's shield is the storm (XC1).
- `combat-animation-current-state.md`: player FX by T3 path (the five re-homed paths, the Conduit paths table, the frame-charge glow); the paths and frames are deleted, the FX files remain.
- `player-sprites-current-state.md`: bodies chosen by frame and path (see finding 3).
- `map-crafting-panels-current-state.md`: the Passive Tree section (Class / Style / Range / Path tiers, the style branch diagram) predates F4's discipline, specialization and leaf tree.
- `auth-and-characters-current-state.md`: the roster label "follows the latest named path selection (root, frame, range, and specialization)".
- `progression-rework-plan.md`: "Frame loops remain — see frames-current-state.md".
- `future-plans.md`: "Families, blends, and frame loops remain"; a parked idea depends on frame loops.
- `system-rework-roadmap.md`: the 2026-09-27 queue; abilities and attunement rows; no class-first.
- `bot-experience-command-center.md`: its note says class routes "return per class"; they have returned.
- `named-progression-checkpoints.md`: snapshots preserve "root/frame/range and later specialization" and learned abilities; whether a checkpoint carries `configuresClass` was not checked.
- `gameplay-telemetry-current-state.md`: boss encounter rows still list "class/frame/range/skills"; not checked against the recorder.
- Carry DOC-1 notes and keep labeled history, acceptable as they are: `tier-balance-current-state.md`, `ui-redesign-plan.md`, `global-mastery-current-state.md`, `biome-ecology-current-state.md`, `map-variety-plan.md`, `variants-current-state.md`, `balance-lab-current-state.md`.

Outside my files: the root `README.md` ("the skill tree adds frame, range, and specialization
choices... Abilities, Runes, Stances, Rites, Cores, Relics... are separate build layers");
`design_docs/architecture.md` (abilities as a loadout layer, `attunedAbilities`, the `use-ability`
rule); `bot/ROUTE-AUTHORING.md` (still "smoke-t1 is the only route", no `classConfig`,
`pieceLearned`, `trophyHeld`); the generated `reports/bot-route-reference.md` (stale since D5).

## Checks

- Docs only: no `.ts` file changed, so `pnpm typecheck` and tests were not run (nothing they cover moved).
- `git diff --numstat` before every commit: no file had its line endings converted.
- Facts were read from the code, including by importing it with `node --import tsx` (the route
  registry, the tutorial scripts' beat lists, boss and craft steps).

## Questions for the designer

1. Should the guide craft each tier's class weapon and armor the way the bot routes do (and should
   the routes then craft the Clearing set the guide makes, so the two match)?
2. Should the discipline and specialization picks change the character's body again (finding 3)?

## Files outside the brief I needed (not edited)

None edited. Read only: `shared/src/tutorial/`, `client/src/tutorial/`, `bot/src/`,
`shared/src/classKits/`, `server/src/systems/classes/`, `scripts/experiment/lib.mjs`,
`tools/lane/`, `shared/src/sprites/frameMaps.ts`.
