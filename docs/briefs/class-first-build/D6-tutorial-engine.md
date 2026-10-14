# D6: the tutorial keeps its engine, the opening and the seal route

**Agent:** Grok · **Worktree:** `../mmo-rw-d6-tutorial-core` · **Branch:** `rw/d6-tutorial-core`
(from `rework/class-first`) · **Size:** M · **Phase 0, wave A** (runs in parallel with D5, I3,
F1)

**Read first:** `docs/briefs/class-first-build/AGENT-RULES.md`; `CLAUDE.md`; the plan
`docs/briefs/class-first-build-plan-2026-10-14.md` §0–§4; everything in `shared/src/tutorial/`
(start with `types.ts`, `scripts/index.ts`, `scripts/plans.ts`, `concepts.ts`); the client side
in `client/src/tutorial/` (`director.ts`, `TutorialPanel.tsx`).

## Why

The guided tutorial teaches a fresh player the first Tier 1 hour. Today its class part
(`scripts/classScript.ts`, about 1,000 lines, and `scripts/runes.ts`) teaches systems the
class-first rework removes for every class: the weapon page (leans, verbs, lineage cards),
shards, Runic Points and crafted runes, shared abilities, stances, rites, cores, frames and
range nodes. Each class gets its own tutorial script later in this branch, written against
its new kit. This task keeps the tutorial **engine** working and class-agnostic, and adds the
seam those per-class scripts will plug into.

## Do

1. **Remove the class script and the rune lessons:** delete `scripts/classScript.ts` and
   `scripts/runes.ts` and their exports. In `scripts/plans.ts` keep `TUTORIAL_SEALS`,
   `T1_BIOME_ORDER` and `T1Biome`; remove the per-class plans (`TUTORIAL_CLASS_PLANS`,
   `TutorialClassPlan`, `TutorialWeaponCards`, `PlanItem` and anything that names lineage
   cards, runes, abilities or frames).
2. **A generic seal route:** write `scripts/sealRoute.ts` exporting `buildSealRouteBeats()`:
   class-agnostic beats after the opening that walk the player through T1 using only what
   every class has today: go to the Plains, fight until the Plains boss is open, beat it (the
   first seal), then the Forest, Swamp and Cave in `T1_BIOME_ORDER`, then the Mountain boss
   (the second seal, `TUTORIAL_SEALS`), then the farewell. No crafting beats, no system
   words. Short sentences that say what to do and why in fight terms (look at
   `scripts/opening.ts` and `scripts/farewell.ts` for the voice). Use only conditions that
   already exist in `conditions.ts`.
3. **The per-class seam:** in `scripts/index.ts` add
   `TUTORIAL_CLASS_BEATS: Partial<Record<string, () => TutorialBeat[]>>` keyed by class root
   (empty for now) and make `tutorialScriptFor(classRoot)` return the opening, then the
   class's own beats if it has a builder, else `buildSealRouteBeats()`, as ONE script (keep
   the existing caching and the `tutorial-<class>` id shape). A comment says each class's
   builder lands with its class track (plan §5.2, task C\<c\>.6).
4. **Concepts:** in `concepts.ts` remove the concept entries for removed systems (weapon
   page, leans, verbs, lineage cards, shards, Runic Points, runes as crafted items,
   abilities, stances, rites, cores, frames, range). Keep the rest and the per-level limit.
5. **Keep `TUTORIAL_ANCHORS` exactly as it is** (the client's HUD uses every anchor, including
   menus that later tasks remove). Keep every public type in `types.ts`.
6. **Client:** fix `client/src/tutorial/` (director, panel) so it compiles and runs against
   the trimmed shared exports. Remove director steps that point the player at removed systems
   (rune and ability menus); keep the Passive Tree, crafting, inventory and map pointers.
7. **Tests:** trim `shared/src/tutorial/tutorial.test.ts` to the engine and the new route:
   every beat's conditions resolve; the seal route ends with the farewell; with no class
   builder registered, every class root gets the opening plus the seal route; the checklist
   respects `TUTORIAL_CONCEPTS_PER_LEVEL`. Keep tests of the opening, anchors and resolver.

## Allowed paths

`shared/src/tutorial/**`, `client/src/tutorial/**`, `shared/src/index.ts` only if it
re-exports a removed tutorial name, and your report.

## Expected, and fine

Another agent (task D5) is deleting the bot's tutorial routes at the same time. In your
worktree `pnpm typecheck` may therefore fail **only** in these bot files:
`bot/src/routes/tutorialRoutes.ts`, `bot/src/routes/t1Common.ts`, `bot/src/routes/t2Loadouts.ts`,
`bot/src/routes/index.ts`, `bot/src/route/types.ts`, `bot/src/concurrency/routeLeaseSession*.ts`,
`bot/src/harness.test.ts`, `bot/src/reference.ts`, `bot/src/routes/gateCapstoneRepeat.test.ts`.
Don't edit `bot/`. Paste those errors in your report. Any error anywhere else is yours to fix.

## Check

- `pnpm typecheck`: clean except the bot files listed above.
- `pnpm test -- tutorial`: all pass (paste the summary).
- `pnpm --filter @mmo-idle/client build` succeeds.
- `grep -rniE "lineage|shard|runic|stance|\brite|ability|abilities|frame|range node|core" shared/src/tutorial client/src/tutorial`
  returns nothing but lines you can justify in the report.
- `git diff --numstat`: no whole-file line-ending churn.

## Don't

- Don't write any class-specific beats (each class's script is a later task).
- Don't add tutorial conditions or anchors; don't touch `bot/`, `server/` or other client
  folders.
- Don't change the opening's beats.

## Report

`docs/briefs/class-first-build/reports/D6.md` (shape in AGENT-RULES.md), including the full
text of the seal route's beats and the bot typecheck errors you saw.
