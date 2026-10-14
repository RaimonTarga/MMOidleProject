# D5: the bot becomes a class-agnostic harness

**Agent:** Codex · **Worktree:** `../mmo-rw-d5-bot-core` · **Branch:** `rw/d5-bot-core` (from
`rework/class-first`) · **Size:** L · **Phase 0, wave A** (runs in parallel with D6, I3, F1)

**Read first:** `docs/briefs/class-first-build/AGENT-RULES.md`; `CLAUDE.md`; the plan
`docs/briefs/class-first-build-plan-2026-10-14.md` §0–§4; `bot/README.md` (Architecture,
Rules this harness keeps); `bot/ROUTE-AUTHORING.md`; `bot/src/route/types.ts`,
`bot/src/route/executor.ts`, `bot/src/state/observation.ts`.

## Why

The class-first rework removes, for every class: the item lineage trees (cards, forms,
evolve/reconstruct, leans, verbs), shards and boss capstone wallets, the ability node rows,
shared abilities (learning, attuning, slotting), stances, rites, Runic Points and crafted runes,
cores, frames and range nodes, and the relic ratings. Every class gets a new kit, built later
in this branch. The bot is the balance pipeline, so its harness must survive; but every route
it has today buys or configures those removed systems. This task strips the bot down to a
harness that knows nothing about them, **before** other agents delete the systems themselves,
so their work never has to touch `bot/`.

## Do

1. **Retire every class and campaign route.** Delete the route files under `bot/src/routes/`
   (about 80: `campaign*`, `striker*`, `squire*`, `apprentice*`, `slinger*`, `spirit*`,
   `conduit*`, `t1*`, `t2*`, `namedCheckpoints`, `classRecovery`, the route builders and their
   tests). Keep `bot/src/routes/index.ts` as the registry and add **one** smoke route,
   `smokeT1` (id `smoke-t1`), class-agnostic: choose the class given on the command line
   (default `cadence`), travel to the Plains at T1, farm until Plains level 2, craft and equip
   one Plains armor recipe that every class can wear, assert it is equipped. Use only the
   step kinds kept below.
2. **Strip the route vocabulary** in `bot/src/route/types.ts` and everything that executes or
   evaluates it (`executor.ts`, `conditions.ts`, `readiness*`, ...):
   - Remove step types: `configureBuild`, `craftRite`, `craftRune`, `craftStance`,
     `setDefaultStance`, `learnAbility`, `setAbilities`, `evolveItem`, `unlockCard`,
     `unlockForm`, `wearForm`.
   - Remove conditions: `abilityKnown`, `abilityEquipped`, `frameSelected`,
     `equippedWeaponWithDot`, `canEvolve`, `canReconstruct`, `shardAtLeast`, `capstoneAtLeast`,
     `lineageCardOwned`, `lineageFormOwned`, `lineageFormWorn`, `runeRecipeCrafted`,
     `canAffordUpgrades` (and `UpgradeTarget`); remove `shard` from `NodeRef`.
   - Keep: `assert`, `attemptBoss`, `captureCheckpoint`, `chooseClass`, `craft`, `equip`,
     `unequip`, `upgrade`, `farm`, `travel`, `moveWithinNode`, `ifPossible`, `repeatUntil`,
     `milestone`, `setActive`, `unlockSkill` (the Passive Tree survives), and
     `configureRunes` **without** any Runic Point accounting (the rune engine survives for
     free universal standing orders: Flee, Recover First, Avoid Hazards, Keep Distance, focus,
     travel). Keep every other condition.
3. **Retire the tooling built on the removed systems:** `bot/src/tierEntry/`, `bot/src/tools/t2*`
   and `t1FinalReport.ts`, `bot/src/loadout/campaignProfiles.ts`, and any loadout or policy
   code that only builds lineage, ability, stance, rite or Runic Point plans. Remove the
   matching `bot:t2-*` and `bot:t1-final-report` scripts from the root `package.json` (only
   those lines). Update `scripts/bot-preflight.mjs` if it names deleted routes.
4. **Strip observation and telemetry** of removed state: card firings, shard and capstone
   wallets, lineage forms, ability and stance slots, Runic Points, cores. Keep the recorder,
   sink, summary, events, `fightHp`, `bossTimeline`, `formationAttrition`, experience and
   productive-activity metrics, and the dashboard (`bot/src/ui/`).
5. **Tests:** delete tests of deleted code; adapt the harness tests that remain
   (`harness.test.ts`, `loadout.test.ts`, `executor`/`readiness` tests, telemetry tests) so
   they assert the kept behavior with the smoke route or small inline routes. Add
   `bot/src/routes/smokeT1.test.ts`: the route validates against the route schema and uses
   only kept step kinds. End with `console.log("smokeT1: ok")`.
6. **Docs:** in `bot/README.md` and `bot/ROUTE-AUTHORING.md`, replace the sections about
   retired routes and tiers with one short paragraph: "Class routes are rebuilt per class in
   the class-first build (plan §5); `smoke-t1` is the only route until then." Don't rewrite
   the architecture sections.

## Allowed paths

`bot/**`, the `bot:*` lines of the root `package.json`, `scripts/bot-preflight.mjs`, and your
report. Nothing in `shared/`, `server/`, `client/` or `admin/`: the systems still exist there,
other agents delete them later.

## Check

- `pnpm typecheck` clean.
- `pnpm test -- bot/` : every remaining bot test passes (paste the summary).
- `grep -rniE "lineage|shard|capstone|stance|\brite|runicPoint|abilityNode|attune|core slot|frameSelected" bot/src`
  returns nothing but comments you can justify in the report (list them).
- `git diff --numstat` shows no whole-file line-ending churn.

## Don't

- Don't change anything outside the allowed paths, even if a shared export looks dead.
- Don't run a bot against a server (no server is needed for this task).
- Don't "fix" balance or route numbers; don't write new class routes (each class's route is a
  later task with its own brief).
- When unsure whether something is part of a removed system, keep it and list it in the
  report.

## Report

`docs/briefs/class-first-build/reports/D5.md` (shape in AGENT-RULES.md), including: the number
of files deleted, the kept step kinds and conditions, the grep output, and anything you kept
because you were unsure.
