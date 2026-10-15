# CD8-CLEANUP report

**Agent:** Grok   **Branch:** rw/cd8-cleanup   **Last commit:** `0c6cbd94` (this report is committed on top of it)

One code commit. The deletions and the call sites that had to change with them do not typecheck apart, so they landed together. `pnpm typecheck` was clean before that commit.

Branch total: 68 files changed, +287 / −3,972; 8 files deleted. Nothing was moved except the formation-cycle `mechanic-fired` emit, from the deleted frame loop into `formationAttack.ts`.

The full suite ran in this worktree. `../mmo-rw-verify` was not touched.

## Done

| Area | What |
|---|---|
| Gate | `rosterOf` and `ordersOf` no longer return early on a frame or range pick. The roster is the only path. |
| Deleted server | `frameLoop.ts` (294), `lineHolds.ts` (241), `specs/index.ts` (471), `specs/buffs.ts` (181) |
| Profile | `resolveSummonerProfile` builds slots only from the roster. Empty roster is zero slots. Frame, range, specialization, and relic-profile branches are gone. `SUMMONER_CORE_TUNING` stays. |
| Combat | Battle Bond no longer lets the Conduit attack. Focus and move commands are gone; Recall stays. The percentage damage sponge is gone; Big-Hit Intercept stays. |
| Shared | `SUMMONER_FRAME_TUNING`, specialization tuning, and `summonerSpecializationFor` are gone. `resolveSummonerRelicProfile` is gone. Twelve summoner buff ids and the frame passive keys are gone. |
| Moment | A completed formation cycle still emits `mechanic-fired`, from `registerFormationCycleMoment` in `formationAttack.ts`. Frenzy and the Effigy slam did not come with it. |

### The roster path

A new character's formation is the class config's roster. `resolveSummonerProfile` ignores `selectedSubVariant`, `selectedRange`, `unlockedSkills`, and `relicRatings` when they are still passed. Numbers that the roster path already produced, copied rather than invented:

- `formationOffenseMult` is `SUMMONER_CORE_TUNING.formationOffenseMult` (1.2). `secondaryEffectMult` is 1. `relicPotencyMult` is 1.
- `totalSummonHpPct` is 0.8, the old root share, now on `SUMMONER_CORE_TUNING` so the summon-cap bench and the conduit study can still scale it. The bench still does `(0.8 / 4) * bodies` and `(1.2 / 4) * bodies`.
- Reconstruction is `round(3500 * summoner.reconstruction-interval-mult)`, floor 2500. A relic frequency rating no longer shortens it.
- Melee bodies attack at `SUMMONER_BASELINE_ATTACK_RANGE` (24). Reach uses mid (96). Ranged uses far (190). `C-conduit.md` says melee 18. The roster already used 24, and bible §7.14 puts attack mode on the type, so 24 stayed.
- `attackMode` is melee. `preferredDistance` is mid (72). `formationPolicy` is escort.

### Battle Bond, commands, sponge

Every Conduit has `cannotAttack`. `usesSummonTechniques` is `!!owner.summonsMinions`. `player:commandSummons` is an empty handler. Recall, the recall hold, and `player:recallSummons` stay. The percentage sponge and `pickLivingMinion` are gone. Big-Hit Intercept (`conduit.intercept-pct` to the nearest tank) stays.

### Tests deleted

- `server/test/summonerSpecializations.test.ts` (418)
- `server/test/summonerSprites.test.ts` (160)
- `server/test/conduitPathFx.test.ts` (132)
- `server/test/summonerRuneTargeting.test.ts` (131)

`summonerOverhaul.test.ts` keeps the four-Thrall cadence inheritance, the shared FIFO reconstruction (cost 60, safety-floor pause), the formation target (follow, split retain, debuff mirror, dead-target fallback), and `cannotAttack`. It drops the frame speed floor, focus, move, Grand Ritual, Volatile, the twins, and Battle Bond.

`abilityConduitTechniqueAdapter.test.ts` stays, including Formation Charge. Its setup writes four `conduit-thrall` bodies. The frame-offense splash loop, the Champion reach block, and the move-command interruption are gone. A `champion === false` loop body is still in the file and does not run.

## Checks

- `pnpm typecheck`: clean (packages, bench, test), before `0c6cbd94`.
- `pnpm test`: **340/340 passed** in 308s, in this worktree. `biomeEcology.test.ts` passed in that run.
- Named suites inside that run, all passed: `conduitFormation`, `conduitKit`, `formationView`, `summonDebuffs`, `summonerMitigation`, `minionOocRegen`, `abilityConduitTechniqueAdapter`.

## Not done, or unsure

Bible §7.14 Keep names `formationTechnique.ts` ("A summon delivering an ability"). The brief and `C-conduit.md` say delete it. The bible wins: the file, `formationCharge.ts`, and the summon-technique adapter stay. Say if that should go.

Bible §7.14 also lists `specs/` and `lineHolds.ts` as "old spec mechanics as references." The brief says delete them. They are deleted, the same call CS7 and CQ7 made for reference-only frame files.

`conduitDefenseShare` left the profile. On the roster path it was already 0. The bible says it becomes the armor line's consumer. No consumer was invented.

Melee range stayed 24, not the 18 in `C-conduit.md`.

### Kept, and nothing reads them now

- `SummonerRelicProfile` stays on the relic union. `resolveSummonerRelicProfile` is gone. `RELIC_COEFFICIENTS.summoner` and `RELIC_INTERVAL_FLOORS_MS.summoner` stay because the records are keyed by archetype. Nothing reads those two entries. Relic preview compares the profile with and without ratings and, with no roster, both sides are 0 slots and the same interval.
- `SummonerSlotRole` still includes `bonded`, `colossus`, `offense-twin`, and `defense-twin`. New slots are `normal`.
- `SUMMONER_RANGE_TUNING` still carries `sizeMult`, `summonHpMult`, `conduitDefenseShare`, `redirectionPct`, `moveSpeedMult`, and `reconstructionIntervalMult`. `range.ts` still reads `summoner.minion-range` for attack range. That is not the old range-node path.
- `SummonsMinions.redirectCursor`, `volatileMarkedSlotId`, `ritualCharges`, and `bondCharge` stay on the slice. Nothing writes the last three. The HUD still reads mark and ritual charges, which are always empty. No migration, and no HUD rewrite (CD6 owns the Formation HUD).
- The `summon-shatter` event and `fxSummonShatter` stay. No server writer remains.
- `isTargetHiddenStatusId` still hides `frame.summoner.link.*`. The writer was the frame loop. The status audit no longer claims that id.
- Icon id `summoner-volatile-brood` stays because boss morph aliases use it. `summoner-howl-banner` stays (already an accepted audit gap).
- Passive keys that something still reads stay, including `summoner.damage-sponge-pct` (stat help and mechanic labels). The percentage sponge itself is gone. Deleted keys are only the `summoner.frame-*` set.
- `tools/dps-report.ts` no longer reads specialization tuning. A skill-tree combo has no roster, so the Conduit estimate reports 0 summons. No roster was invented from the old tree.
- `server/scripts/_t4PowerLab.ts` and `server/test/_conduitEarlyProbe.ts` import core tuning instead of the deleted frame and spec maps. Both are throwaway (`_` prefix) and are not in the suite.

## Files outside the brief I needed

The brief says this task touches server and shared, because CD6 is not required. These were edited because the deletions otherwise fail typecheck, the status audit, or a tool import. They are not a HUD redesign.

- Client: `conduitPaths.ts`, `CompactMechanic.tsx`, `SummonerMechanic.tsx`, `mechanics/types.ts`, `useMechanicViewModel.ts`, `statusHelp.ts`, `targetStatusMeta.ts`, `combatFx.ts`, `minions.ts`, `conceptIcons.ts`.
- `server/src/net/playerHandlers.ts`: `player:commandSummons` is a no-op.
- `server/scripts/statusAudit.ts`, `server/scripts/_t4PowerLab.ts`, `tools/dps-report.ts`.
- Benches: `summonCap.ts`, `conduitStudy.ts`, `conduitRecorder.ts`.
- Tests beyond the brief's named list, retargeted or trimmed so they stop pinning the deleted path: `abilityTempo`, `combatTextCoverage`, `coreRelicIntegration`, `day2SessionLifecycle`, `defensePipeline`, `formationPlatingCompensation`, `mechanicFired`, `playerBreadth`, `relicMechanicEffectCoverage`, `secondaryDamageConsistency`, `statusRegistry`, plus the shared profile, relic, and dps-estimate tests.

Not edited, on purpose: `summonPieces.ts`, `souls.ts`, `minionHits.ts`, `formationOrders.ts` beyond the gate line, art PNGs, `STATUS.md`, living docs, and the bible.
