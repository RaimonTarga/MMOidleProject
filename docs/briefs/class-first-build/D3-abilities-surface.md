# D3: remove the shared abilities' player surface; keep the engine

**Agent:** Claude subagent of the conductor · **Worktree:** `../mmo-rw-d3-abilities` ·
**Branch:** `rw/d3-abilities` (from `rework/class-first` after D2) · **Size:** L · **Phase 0, wave C**

**Read first:** `AGENT-RULES.md` (this folder); the plan §4 (D3 row) and §3; the bible §3 ("No
abilities outside the class system", "Same engine, different surface") and each class's salvage
table (§7.14, §8.14, §9.14, §10.14, §11.14, §12.14: what of the ability engine each class keeps);
`docs/abilities-current-state.md`; the D1 and D2 reports in `reports/` (their style, and what
they left for D3).

## Why

Abilities stop being things a player crafts, attunes, slots on a hotbar or fires through a Use
Ability rune. In the class-first design every ability is a **class piece** inside its class's
system (the Striker's techniques on beats, the Squire's responses, the Apprentice's payoffs...),
learned from zone levels and driven by the class runtime. Those runtimes come in Phase 1 and
**will call the ability engine directly**: a Striker technique is an armed rider on a beat's hit;
the opener and wind-up are casts; Charge is the charge shape; the Apprentice's payoffs are the
affliction toolkit. So the engine and the definitions stay, as an internal effect library with
no player surface.

## Remove

1. **Learning.** Ability recipes (`shared/src/abilityRecipes.ts`, `ABILITY_RECIPE_DATABASE`),
   `ability:craftRecipe` / `ability:craftResult`, `server/src/systems/player/economy/abilityCrafting.ts`,
   `tracksProgression.knownAbilities`, every ability entry in crafting (`client/src/ui/crafting/`),
   recipe gates, the map's unlock lines (`biomeUnlocks.ts`, `NodeInfo.tsx`), and the tutorial's
   `abilityKnown` condition.
2. **Attunement.** `tracksProgression.attunedAbilities` / `AttunedAbilities`,
   `ability:setLoadout`, `shared/src/attunementMigration.ts`, `shared/src/attunement.test.ts`,
   the Abilities panel (`AbilitiesPanel.tsx`), the ability parts of `LoadoutBrowser.tsx`,
   system visibility / UI unlocks / gated unlocks for abilities, `attunementCost` on every
   ability, and the RP comments D2 left in `abilities.ts`.
3. **Manual use.** `ability:use`, the HUD ability bar (`AbilityBar.tsx`), its hotkeys
   (`keyboard.ts`, `gamepad.ts`, `hudEvents.ts`), intents and hudBus/atoms entries.
4. **Rune-driven firing.** The Use Ability rune action in `shared/src/runeDatabase.ts` and its
   handling in `runeConfig.ts`; `shared/src/abilityWiring.ts` and the benches'
   `withReferenceAbilityWiring`; the per-tick loop in `abilityFiring.ts` that fires attuned
   abilities (keep the functions that fire one given ability on a given target: they become the
   class runtimes' API). The rune engine itself (conditions → actions) stays; only the actions
   that exist to fire shared abilities go. Rune actions with their own meaning (Flee, Keep
   Distance, Recover First, Step Back, Taunt...) stay: the class tracks retire those.
5. **Readouts of removed state:** ability fields in `shared/src/protocol/views.ts`,
   `tier1Snapshot.ts`, `tierEntry.ts`, `gameplayTelemetry.ts`, `admin.ts`, the admin
   `CharactersTab.tsx`, `progressionCheckpoint.ts`, `gameActions.ts`, `gameplayRecorder.ts`
   (also drop its dead `'evolve'` / `'reconstruct'` kinds, a D1 leftover),
   `humanPlaytestRecorder.ts`, `spectatorSnapshot.ts`, the bot's `loadout.ts` / `t1Snapshots.ts`.
6. **Tutorial leftovers:** the director's rune and ability step handlers no script uses, and
   `shared/src/tutorial/scripts/runes.ts` if no script references it (D2 and D6 left them).
7. **Old saves:** the save loader drops `knownAbilities` and `attunedAbilities` (as D2 did for
   stances); add the case to `legacySaveLoad.test.ts`.

## Keep (the engine)

- `shared/src/abilities.ts`'s types, shapes, ranks and helpers, the `ABILITY_DATABASE`
  definitions, the status and FX ids (`ability-slowed`, `ability-rooted`, `ability-guard`,
  the guard keystone statuses boss AI still reads...), `abilityTags.ts`, `abilityModifierInfo.ts`
  where still used.
- `server/src/systems/player/abilities/*` except the attunement-driven loop: the cast machine
  (`abilityCasting.ts`), arming, the charge (`formationCharge.ts`), the affliction toolkit
  (`abilityAffliction.ts`), imbue, buffs and their 90 % cap plumbing, effects, targeting,
  cooldowns, `attackTempo.ts`. If a file only served the removed surfaces, delete it.
- Client cast bars and callouts (`client/src/render/skillCallouts.ts`, `castBars.ts`), the
  ability FX, and the ability icon resolver in `conceptIcons.ts` (class pieces reuse icons).
- If something kept becomes unreachable, keep it anyway and list it in your report: the class
  tracks wire it back.

## Tests

- Tests that pin the removed surfaces (learning, attuning, the hotbar, the Use Ability rune):
  delete them, listing each.
- Tests that exercise the **engine** through attunement (attune an ability, tick, assert it
  fired): rewrite them to call the kept firing functions directly when the change is small, so
  the engine keeps coverage; otherwise delete and list them. Don't spend long on any one.
- `pnpm typecheck` clean after every commit; finish with the full suite **in
  `../mmo-rw-verify`** (never in your editing worktree): fast-forward is not possible from your
  branch, so there run `git checkout --detach rw/d3-abilities` → `pnpm test` → `git checkout
  rw/verify`. Read the `N/M passed` line. Baseline: 333/333 at `f3513f9d`.

## Commit and report

Commit by area (learning; attunement and the panel; manual use and the hotbar; rune firing and
wiring; readouts, tutorial and saves), each typecheck-clean. Report at
`docs/briefs/class-first-build/reports/D3.md` in the AGENT-RULES shape plus: per area, files and
lines deleted; the kept engine API the class runtimes will call (function names and files); every
kept-but-unreachable piece; every test deleted or rewritten; anything outside this brief you had
to touch and why.
