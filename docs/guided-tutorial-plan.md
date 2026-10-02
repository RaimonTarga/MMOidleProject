# Guided Tier-1 Tutorial — Plan

**Status:** ACTIVE PLAN — Phases 1–4 built on `feat/guided-tutorial` (2026-09-29),
uncommitted and awaiting the designer's playtest. Nothing below is shipped behavior
until a `guided-tutorial-current-state.md` exists.

## What it is

An optional, desktop-only guide that plays Tier 1 *for* the player, one beat at a
time. A panel at the top of the right rail shows a short line — the reason for a
choice when the choice is not obvious, otherwise just what happens next, never how
a mechanic works — and a **Next** button. On Next the guide performs the beat's
actions through the ordinary UI intents while a gold ring moves across the buttons
it presses. The player only ever clicks Next.

It starts in the Clearing (tier-0 quest), takes the character through **every T1
zone to Global Mastery 30**, then kills the **Plains and Mountain bosses**. The
second seal promotes the player to Tier 2, after which one last optional chapter
teaches the weapon lineage's **gate** (see "The tree lessons" below); then the guide
says goodbye ("keep going forward"), points at the Passive Tree for the frame
choice, and disappears.

## Locked decisions (2026-09-29)

| Question | Decision |
|---|---|
| Classes | All six T1 roots, so six scripts. The player picks their class; the guide follows that class's script. |
| Bosses | Plains + Mountain (Mountain with the bot-tested setup: Expose Weakness + Second Wind, Mountain plate), only after all five zones are maxed (GM 30). Was Plains + Forest until the evening of 2026-09-29; see Findings. |
| Route shape | Slow and safe, not fastest: every zone visited and maxed, full HP before bosses, survival Runes. |
| Pacing | Always wait for **Next**. Long farm beats show live progress; Next appears when the beat is done. No auto-continue. |
| Who can use it | Any character at player tier 0–1. Opt in or out at any time. Gone from tier 2 on (after the farewell). |
| Mid-T1 opt-in | **Takes over, with a warning**: the offer card says the guide will swap gear, abilities and Runes to its plan. Items are only swapped, never destroyed. |
| T2 frame point | Left to the player; the farewell points at it. |
| Platform | Desktop only. The panel lives in the desktop right rail, which `MobileHUD` replaces. |
| Lines | Explain the reasoning briefly, only where the choice is not obvious; routine crafting/upgrading gets a plain label. No mechanics detail. |

## Calls made without asking (change freely)

- **Panel default.** A tier-0/1 character that has never decided sees an offer card
  (Start guide / No thanks). "No thanks" or Stop collapses it to a small **Guide**
  tab; the tab reopens the offer (which repeats the takeover warning).
- **Opt-in persistence** is a per-character `localStorage` flag (`on`/`off`/`done`),
  keyed by the selected character id. Tutorial *progress* is never persisted.
- **Opting out** stops the guide where it is. It does not turn auto-combat off or
  undo anything.
- **Death** turns the card into "You fell… press Next to get back up"; Next presses
  the same respawn the death overlay does, then the guide carries on from state.
- **The lines** live in `shared/src/tutorial/scripts/` (`opening.ts`, and the
  `*_REASON` tables at the top of `classScript.ts`); edit them directly.

## Core idea: the script is validated by the bot

The bot harness plays T1 through ordinary `ClientToServerEvents` intents and reads
state through the shared `PlayerView` — the same view the client composes. So:

1. A **tutorial script** is an ordered list of **beats**. Each beat has an id, a
   chapter, the line, optional progress bars, and steps in the bot's own route
   vocabulary (`shared/src/tutorial/types.ts` mirrors `bot/src/route/types.ts`).
2. `bot/src/routes/tutorialRoutes.ts` flattens each class script into an ordinary
   route, `tutorial-<class>-t1`, filling in the class and a patient boss-retry
   budget. **The bot is the tutorial's regression test**, and `harness.test.ts`
   already validates every registered route (content exists, used after acquired,
   Rune budgets).
3. The client **director** performs the same steps, evaluating the same conditions
   against the local player's `PlayerView`.

This replaced the original Phase 2 ("move the bot's route vocabulary into
`shared/`"): the bot's vocabulary is used by 77 files, and an adapter gives the same
single source of truth for the tutorial without touching them. The bot gained three
condition types (`classSelected`, `runeRecipeCrafted`, `canAffordUpgrades`).

### Where things live

```text
shared/src/tutorial/
  types.ts           beats, steps, conditions (bot-shaped), progress refs
  conditions.ts      evaluator over PlayerView; upgrade cost remaining; progress rows
  resolve.ts         resume-from-state, supersession, wiredRunes, abilityLoadoutFor
  nodes.ts           which node a farm/boss step happens at (bot's pick rules)
  anchors.ts         every data-tutorial-anchor id
  scripts/opening.ts class-agnostic opening (quest, class pick, Clearing set)
  scripts/plans.ts   per-class gear plans (ported from bot/src/routes/t1GearPlans.ts)
  scripts/runes.ts   the guide's Rune loadout per stage
  scripts/classScript.ts  plan → beats, with the lines
  tutorial.test.ts   data validity + a simulated playthrough of all six classes
client/src/tutorial/
  director.ts        performs one beat: open panel, point, hudBus call, wait for the delta
  TutorialPanel.tsx  offer / beat card / death / farewell, mounted in RightSidebar
  TutorialHighlight.tsx  the ring (portal, follows the element every frame)
  atoms.ts           highlight target + focus requests for panels with local selection
bot/src/routes/tutorialRoutes.ts   scripts → routes
```

## Director behavior

**Resume from state, not from a stored index.** The current beat is always the first
beat whose steps are not all satisfied by the live `PlayerView`. Opting out, playing
by hand, reloading or dying all just work.

- Farm conditions are authored **monotone** (`anyOf(hasItem X, canCraft X)`, never a
  bare `canCraft`), so spending the essence does not send the guide backwards.
- Equip, Rune and ability-loadout steps count as satisfied when a **later** step of
  the script has superseded them (the Clearing club is not re-equipped over the
  Plains broadsword on a resume).
- Location is an attribute of farm/boss steps, never a travel step.

**Running a beat:** open the panel by writing the existing UI atoms, move the ring
across each control on the click path (~0.65 s each), fire the **same `hudBus` call
the button makes**, then wait for the server's delta. No virtual pointer and no
`element.click()`. Two small intents were added for this: `setAuto` (explicit on/off,
so the guide never races a player's toggle) and `moveTo` (pathfinding walk to a
point, for the altar).

**Per step:**

| Step | What the player sees |
|---|---|
| farm | travel to the zone if needed (nearest uncleared node, or the current one), ring on Auto Combat, then a progress card until done |
| chooseClass | Passive Tree opens, class cards ringed; the player picks |
| craft / craftRune | Crafting → the right category → the recipe → Craft/Learn |
| equip | Inventory → the item → Equip |
| upgrade | Upgrade → the item → Upgrade, repeated to the target level |
| learnAbility / setAbilities | craft the recipe, then Abilities → Attune; Runes are re-wired (below) |
| configureRunes | Runes board; the guide sets its plan |
| attemptBoss | rest to full HP, travel, clear the guard with auto-combat, walk to the altar, ring on the altar button, wake the boss, fight |

**Ability wiring.** Abilities have no built-in trigger (`shared/src/abilityWiring.ts`).
Every loadout the guide sends is `wiredRunes(rules, abilities)`: stale `use-ability`
rules dropped, each attuned ability's reference rule added. Ability changes go in the
bot's safe order: unwire (frees RP) → change abilities → wire.

**Boss fights** follow what the bot learned: clear the guard *before* waking the
boss (the altar turns every standing guardian on you at once).

## Scripts

Generated per class from `scripts/plans.ts`, which ports the bot's controlled T1
configs (Striker/Squire durable melee, Slinger, Spirit/Conduit, Apprentice), with:

- **Order:** Clearing → Plains → Forest → Swamp → Mountain → Cave → the two
  seals in `TUTORIAL_SEALS` (currently Plains, then Mountain). Boss loadouts are the
  bot's dodge-profile matrix for all five bosses. Each zone: its gear, its shared learning (Sweep, Second Wind, Avoid
  Hazards + Cleanse, Orbit for ranged, Step Back), master to 6, then upgrades.
- **Two beats per paid action:** a farm beat that ends when the action is affordable
  (skipped automatically when it already is), then the action beat.
- **Upgrades are grouped by the zone whose essence pays** (the Plains vest is paid in
  Plains essence even on the Forest leg), with a catalyst detour when a zone has no
  node minting the needed catalyst.
- **Safety Runes** (`scripts/runes.ts`): `hp-below-25 → flee` above chase/orbit until
  Step Back replaces it in the Cave (first-rule-wins in the Movement lane, so the
  default loadout's flee below chase could never fire in a fight);
  `while-traveling → fight-back`; Conduit waits for its formation instead of HP.
- **Budget-driven changes from the bot route:** Expose Weakness is learned after
  Cave mastery, not at Cave 3 — with Step Back and two abilities the build only fits
  the Rune budget at GM 30. `flee` is dropped at the Step Back stage for the same
  reason (ranged builds would not fit even at GM 30).
- **Slinger** skips the bot's Mountain vest (only worn against the later bosses).
- Beat counts (2026-10-01, after the weapon `+N` ladder's removal and the tree
  lessons): Striker 78, Squire 78, Spirit 81, Conduit 81, Apprentice 83, Slinger 85.

### The tree lessons (2026-10-01, `feat/tutorial-tree`)

The weapon `+N` ladder the script used to teach is gone (the lineage rework, commit
`03783104`). Five beats teach the tree that replaced it, authored from
`shared/src/data/lineages/` so no price or unlock level is restated:

| Beat | Where | What it does |
|---|---|---|
| `shards:rapier-t1-tempo-stat` | Forest leg, once the Flash Rapier is worn | farms until the first card is affordable; the line names the Pack, the Forest's wolves, as the Tempo Shard source |
| `card:rapier-t1-tempo-stat` | same | buys Quick Wrist — "owned is forever, active is a choice" |
| `farm:gate:gale-needle` | new last chapter, "The Gate" | the gate's Forest essence and Tempo Shards |
| `capstone:gale-needle` | same | the Forest boss, repeatedly, for its three Warden's Hearts |
| `gate:gale-needle` | same | pays the gate and wears the Gale Needle, which opens the T2 band |

Three things this needed:

- **The gate chapter runs after the seals.** The T1 gate asks for Global Mastery 30
  and Forest 6, which only arrive at the end of the Cave leg, and any two distinct
  biome bosses promote to Tier 2 — so a third boss before the seals would itself be
  a seal. The panel's farewell therefore waits for the script to run out rather than
  for `playerTier >= 2`, and a Tier-2 player with beats left gets an "I'm done"
  button so the farewell is never out of reach.
- **`attemptBoss` takes an optional `until`.** A gate costs three capstone drops,
  i.e. three kills; the bot adapter turns that into `repeatUntil` over one attempt.
- **The route completion includes the gate**, because `runSteps` returns the moment
  completion holds and "two seals" would have cut the run short of the new chapter.

⚠ The Greatbear wall in Findings below applies here: the gate chapter asks every
class for three Forest boss kills, and a GM-30 Striker and Apprentice could not
manage one in September. It is after Tier 2, so it blocks no progression, but a
live run shows it as a stalled route while the wall stands — **measured on
2026-10-02** (see the Validation record): four of six classes never killed it,
Conduit needed nine fights, Slinger needed 40 seconds.

`tutorial.test.ts` simulates every class's playthrough (each step made true the way
the server would) and asserts the guide only ever moves forward, reaches GM 30,
ends at Tier 2, and that every loadout fits the RP budget of the Global Mastery
guaranteed at that point.

## Running the validation

```bash
# one class, fast pipeline check (non-canonical; sets the dev server to 25x and
# restores it at the end)
pnpm bot:run --route=tutorial-striker-t1 --policy=intended --rewardMultiplier=25

# canonical 1x evidence needs a committed revision and the frozen runner
pnpm experiment:create --revision=HEAD --routes="tutorial-striker-t1,tutorial-squire-t1" --workers=2
pnpm experiment:launch --id=latest
```

Route ids: `tutorial-{striker,squire,slinger,spirit,apprentice,conduit}-t1`.
Parallel runs in one dev world collide in dungeons (fast retries are refused while
another bot is inside), so shared-world batches are only pipeline evidence.

## Phases

1. **Spike: Clearing only** — done.
2. **Bot adapter** (replaced the vocabulary move, see above) — done.
3. **Six class scripts** — done; all six run clean to GM 30, three complete to
   Tier 2 at 25x; canonical 1x runs still to do (needs a commit).
4. **The whole loop** (every step type, deaths, bosses, farewell, lines) — done.
5. **Polish** — open: a sound when a long beat finishes, visual tuning, mobile.

## Validation record

All 2026-09-29, dev stack, 25x rewards (pipeline evidence, not balance evidence).

- **Opening, real client:** ran end to end in ~3.5 min with a fresh guest;
  opt-out → reopen → resume → reload all hold.
- **Clearing + the whole Plains leg, real client (Playwright, pressing only
  Next):** gear, Sweep (Make → Technique → Learn, then Abilities + wiring), zone
  mastery, travel, and the four +1 upgrades through the Upgrade tab. No console
  errors. Found and fixed: a ghost ring over a closed dialog; the opening Rune beat
  being skipped because the check ignored Rune order.
- **Boss flow, real client:** a dev-geared (`equipPhaseTester`) fresh character ran
  the director's `attemptBoss` for the Plains: rest to full → travel → 12 guards
  cleared with auto-combat → altar → boss → `plains:1`, every status shown.
- **All six classes, bot:** every script runs clean through all five zones to
  GM 30 (7–9 min at 25x before bosses). Boss results:

  | Class | Plains seal | Forest seal | Route |
  |---|---|---|---|
  | Slinger | 1st try | 2nd try (1st died at 6%) | **completed, Tier 2** |
  | Conduit | 1st try | 1st try | **completed, Tier 2** |
  | Squire | 2nd try (1st timed out at 1%, unexplained) | 1st try | **completed, Tier 2** |
  | Striker | 2nd try | **0/12**, boss at 13–16% | walled |
  | Apprentice | 1st try | **0/10**, boss at 7–19% | walled |
  | Spirit | 1st try | 1 loss at 21%, then a shared-dungeon harness conflict | inconclusive |

  Same GM-30 Striker against the other bosses (survey, fast retries): Mountain,
  Swamp and Cave all won on the first try (75 s, 65 s, 59 s).
- **Rerun with the Mountain as second seal (commit `689770f8`, all six in
  parallel, 25x, normal retries):**

  | Class | Plains seal | Mountain seal | Route |
  |---|---|---|---|
  | Striker | 1st try | 1st try | **completed, 26 min** |
  | Slinger | 1st try | 1st try | **completed, 22 min** |
  | Spirit | 1st try | 1st try | **completed, 19 min** |
  | Conduit | 1st try | 1st try | **completed, 34 min** |
  | Apprentice | 2nd try | 2nd try | **completed, 28 min** |
  | Squire | 3rd try (two 12-min timeouts with the boss at 3% and 1%) | not reached | hit the 50-min run cap |

  Squire's Plains-boss timeouts happened in both batches: the fight stalls with
  the Razorback at 1–3% HP for the full 12 minutes. Suspected (unverified): the
  boss's endless one-slime-per-12-s trickle keeps the Squire's timed strikes on
  adds. Worth watching in a hand playtest.

### 2026-10-02 — the tree lessons and the gate chapter, live

First live `bot:run` of the tree lessons and the gate chapter (run 3's W1-E built
them against the two in-process validations only). Local dev stack, on the wave-1
merge `a5d49ae9` plus this file's own two docs commits (`b1e0ff7c`, `e77c477a`;
no code differs between them, and each run's header records which it saw).

Six runs at **25x rewards, so still pipeline evidence, not balance evidence** —
with one extra caveat specific to this chapter, below — plus one **canonical 1x**
run, time-boxed, which is the first untainted run of a tutorial route.

Runs were **solo and sequential**, not the parallel cohort the 2026-09-29 rows
used, so a boss result here is uncontended. Striker ran with the route's authored
boss budget; the other five added `--fastBossRetry --fastBossRetryIncludeGuardians=true`
(a second recorded taint, `NON_CANONICAL_FAST_BOSS_RETRY`) because an authored
attempt costs ~4.3 min of travel-and-rest and twelve of them do not fit a run
cap. `includeGuardians=true` keeps the guard clear and the boss fight intact and
skips only overworld travel, dungeon traversal and the guardian-reform wait.

**Beats passed, by chapter** (`route-step-end.outcome` per beat; a short cell is
beats never reached, not beats that failed):

| Class | Clearing | Plains | Forest | Swamp | Mountain | Cave | Seals | Gate |
|---|---|---|---|---|---|---|---|---|
| Slinger | 11/11 | 13/13 | 13/13 | 16/16 | 11/11 | 14/14 | 4/4 | **3/3** |
| Conduit | 11/11 | 13/13 | 9/9 | 12/12 | 13/13 | 16/16 | 4/4 | **3/3** |
| Apprentice | 11/11 | 13/13 | 9/9 | 14/14 | 13/13 | 16/16 | 4/4 | 1/3 |
| Spirit | 11/11 | 13/13 | 9/9 | 12/12 | 13/13 | 16/16 | 4/4 | 1/3 |
| Squire | 11/11 | 13/13 | 9/9 | 12/12 | 10/10 | 16/16 | 4/4 | 1/3 |
| Striker | 11/11 | 13/13 | 9/9 | 12/12 | 10/10 | 16/16 | 1/4 | 0/3 |

**Not one beat anywhere came back `stalled` or `blocked`.** Every beat that was
reached, passed — including both tree-lesson beats for all six classes and all
three gate beats for the two that got through the Greatbear. `gate-paid` and the
T2 band followed. **No script-level failure was found**: nothing in anchors,
waits, ordering or route composition needed fixing.

**Run outcomes and timings**

| Class | First card | GM 30 | Tier 2 | Gate paid | Route | Deaths |
|---|---|---|---|---|---|---|
| Slinger | 3m39s | 8m09s | 22m31s | **27m08s** | **completed, 27m09s** | 0 |
| Conduit | 3m50s | 9m03s | 20m52s | **47m22s** | partial, 47m22s | 9 |
| Spirit | 3m29s | 7m34s | 22m32s | — | 60-min cap | 14 |
| Apprentice | 3m49s | 9m43s | 23m13s | — | 60-min cap | 12 |
| Squire | 3m57s | 8m14s | 28m12s | — | 60-min cap | 12 |
| Striker | 4m10s | 7m48s | — | — | 60-min cap | 11 |

Conduit's `partial` is the `boss-step-exhausted` flag from its two lost Greatbear
rounds, not a missing beat: it paid the gate and all 81 beats passed.

**Bosses**

| Class | Plains seal | Mountain seal | Greatbear (gate) |
|---|---|---|---|
| Slinger | 1st, 58 s | 1st, 58 s | **1st, 40 s** |
| Conduit | 1st, 78 s | 1st, 99 s | **won on fight 9** (8 deaths, left 13–26%) |
| Apprentice | 1st, 54 s | 1st, 61 s | 0/12 (left 19–36%) |
| Spirit | 1st, 67 s | 1st, 68 s | 0/14 (left 17–31%) |
| Squire | 1st, 83 s | 2nd (1 death, left 15%) | 0/11 (left 30–40%) |
| Striker | **0/11 (left 2–31%)** | not reached | not reached |

What this evidence does **not** cover:

- **25x collapses the gate's own cost.** The dev multiplier scales essence,
  biome XP, shards *and* capstones (`grantLineageMaterials`), so one boss kill
  grants `round(25)` capstones against a gate that asks for 3, and the gate's
  180 essence + 10 Tempo Shards are already paid by ordinary farming. A gate
  farm beat therefore costs **0 s** and the `capstone:` beat needs **one**
  Greatbear kill, not three. The chapter's three-kill shape only exists at 1x,
  and no multiplier accelerates farming while leaving the capstone count intact
  (anything ≥ 3 collapses it, and 1x is 1x).
- **1x was measured for one class only, and did not reach the seals or the gate.**
  A **canonical** Striker run (`taints: []`, the first for any tutorial route)
  time-boxed at 35 min got through the Clearing, Plains, Forest, Swamp and
  Mountain legs and 7 of the Cave's 16 beats — **62/78 beats, 0 deaths, every
  beat passed** — reaching Global Mastery 24 at 27m47s. No 1x run has yet reached
  a seal, the Greatbear or the gate, for any class.

  Worth correcting an intuition here: **1x is not 25x slower.** The same Striker
  hit GM 6 at 10m08s and GM 24 at 27m47s, against 2m42s and 7m04s at 25x — a
  ratio of only **~3.9x**, because the early and middle legs are bounded by
  combat and travel time rather than by essence accrual. So a full 1x route to
  GM 30 is on the order of 30–40 min, not hours, and a canonical six-class sweep
  including seals is a realistic next session rather than an impractical one.
  The gate's own three-kill cost (above) remains the part only 1x can exercise.

  One canonical-run trap found while setting this up: **the reward-multiplier
  taint is sticky from the moment the bot connects.** `noteRewardMultiplier` runs
  on the server's *current* global rate, so starting a run against a world some
  earlier batch left at 25x tags it `NON_CANONICAL_REWARD_MULTIPLIER` even with
  `--rewardMultiplier=1`, and its first kills really are at 25x. A canonical run
  needs a world that is already at 1x — restarting the dev server is the reliable
  way, since `world.rewardMultiplier` boots at 1. Note also that a `bot:batch`
  that dies before its restore step leaves the world at 25x for whatever runs
  next; this is what the taint caught.
- **The farewell is not bot-testable.** `TUTORIAL_FAREWELL` (including the frames
  line) is panel copy, not a beat, so `bot:run` never exercises it. It still
  needs a real-client pass.

One harness note for whoever reads a gate stall: the gate's `attemptBoss` budget
is `TUTORIAL_GATE_BOSS_ATTEMPTS` (4) *per round* of `TUTORIAL_GATE_BOSS_ROUNDS`
(5), and the inner step's exhaustion does not end the repeat — `failedRequirement`
only short-circuits `bossCleared` conditions, and the gate's `until` is
`anyOf(lineageFormOwned, capstoneAtLeast)`. So a walled class really does fight
up to twenty times, travelling back to the dungeon between rounds, which is what
consumes its run cap.

Two game failures recorded, neither tuned:

- **The Plains boss now walls the tutorial Striker.** Eleven uncontended
  attempts at GM 30 on the authored kit (Chaotic Axe, +5 Plains vest, +5 Swamp
  charm, maxHp 208, plating 5, DR 0.213) all ended in death, with the Tusked
  Razorback left at 2–31% and twice at 2%. The fight itself only runs 43–61 s;
  the chip damage comes from the Field Hare trickle, which was the dominant
  damage source in one death at 93. This reverses the 2026-09-29 rerun, where the
  Striker took the Plains seal first try, and it is the one result that blocks a
  whole route — Plains is the first seal for every class. Every other class won
  it first try, so it is kit-shaped, not a boss-wide change.
- **The Greatbear still walls the gate chapter, and now for four classes of six.**
  Slinger kills it in 40 s; Conduit needs nine fights; Spirit (0/14), Apprentice
  (0/12) and Squire (0/11) never do, all dying with the boss at 17–40%. September
  had Conduit and Squire beating this boss first try, so the spread has widened
  rather than moved. The containment the plan predicted does hold: the chapter is
  after Tier 2, the run reports `timed-out`/`partial` rather than falsely
  complete, and nothing earlier in the script is affected.

### 2026-10-02 — the canonical 1x sweep, all six classes

**The first untainted six-class run of the whole script.** No reward multiplier, no fast
boss retry, uncontended: each class got its OWN server and its OWN game database (ports
4301+, `gamedb_tut1..5`), so no two bots ever shared a dungeon. Run cap 2 h per class.
On the branch after four fixes this sweep depended on — the weapon-curve fold, the
capstone-loop fix, the tier-up recalc, and the `core.recovery-mult` quantization.

Beats passed per chapter. A short cell is beats never reached, not beats that failed.

| Class | Rate | Clearing | Plains | Forest | Swamp | Mountain | Cave | Seals | Gate | wall | deaths | outcome |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Conduit | 1x | 11/11 | 13/13 | 9/9 | 12/12 | 13/13 | 16/16 | 4/4 | **3/3** | 60 m | 3 | **completed** |
| Slinger | 1x | 11/11 | 13/13 | 13/13 | 16/16 | 11/11 | 14/14 | 4/4 | **3/3** | 61 m | 3 | **completed** |
| Spirit | 1x | 11/11 | 13/13 | 9/9 | 12/12 | 13/13 | 16/16 | 4/4 | **3/3** | 65 m | 5 | **completed** |
| Apprentice | 1x | 11/11 | 13/13 | 9/9 | 14/14 | 13/13 | 16/16 | 4/4 | 1/3 | 2 h cap | 11 | Greatbear |
| Squire | 1x | 11/11 | 13/13 | 9/9 | 12/12 | 10/10 | 16/16 | 4/4 | 1/3 | 2 h cap | 13 | Greatbear |
| Striker | 1x | 11/11 | 13/13 | 9/9 | 12/12 | 10/10 | 16/16 | 3/4 | 1/3 | 2 h cap | 17 | Behemoth |

Every boss attempt, from `boss-attempt` events. The gate needs **three** Greatbear kills.

| Class | Plains seal | Mountain seal | Greatbear (gate) | loss hp-left |
|---|---|---|---|---|
| Conduit | 1/1 (225 s) | 1/1 (326 s) | **3 kills / 6 attempts** | — |
| Slinger | 1/1 (199 s) | 1/1 (326 s) | **3 kills / 5 attempts** | — |
| Spirit | 1/1 (255 s) | 1/1 (366 s) | **3 kills / 8 attempts** | — |
| Apprentice | 1/1 (194 s) | 1/1 (315 s) | **0/11** | 5–18% |
| Squire | 1/1 (215 s) | 1/1 (474 s) | **0/13** | 11–16% |
| Striker | 1/1 (187 s) | **0/12** | 0/4 (no Tier 2) | mtn 7–28% |

**Every class takes the Plains seal first try.** That closes the 2026-10-02 finding below
(0/11); its cause was the retired weapon `+N` ladder, not the Field Hare — see
`briefs/run4-report-2026-10-02.md`'s addendum for the bisect.

**Three classes now complete the whole script at 1x, gate paid, in 60–65 minutes.** That
is the first time the gate chapter has ever finished, at any multiplier: it could not
before, for any class, because `doAttemptBoss` read the biome's permanent first-clear flag
as "this fight is won" and returned instantly from every attempt after the first. At 25x a
single kill dropped `round(25)` capstones and hid it.

**The Greatbear genuinely walls the Squire and the Apprentice**, and the earlier
"four of six" reading was two separate things at once: the harness made the gate
unfinishable for *everyone*, and the boss is additionally unbeatable for these two. Both
take every seal first try and then cannot kill it once — Squire 0/13 losing at
11/11/11/11/12/12/15/15/16/16/16/16/16 %, Apprentice 0/11 at 5–18%. The clustering is
tight enough to read as a flat shortfall rather than variance. For a class that *can* kill
it, it is a demanding grind, not a wall: the Spirit lost five of eight attempts and still
paid the gate.

**The Mountain seal walls the Striker** — 0/12 at 7–28% left, over two independent runs, so
it never reaches Tier 2 or the gate at all. This is NOT new: the T1 boss lab says `develop`
is worse (36% left, and the Squire was 0/3 there too, where it now wins). The
2026-09-29 decision to swap the second seal from Forest to Mountain was taken on 25x
evidence that the Mountain fell first try; at 1x the Mountain is the Striker's wall and the
Greatbear is beatable by half the roster, so **that swap wants re-deciding**.

**Pacing did not move.** GM 6 at 8–13 min, GM 24 at 21–34 min, GM 30 at 26–44 min, against
10m08s / 27m47s for the pre-fold 1x Striker. T1 farming is gated by travel and spawn
density, not weapon damage, so restoring the weapon curve changed boss outcomes and nothing
else.

**Still not bot-testable:** the farewell, including its frames line — `TUTORIAL_FAREWELL`
is panel copy, not a beat. Real-client pass still owed.

## Findings

- **The Forest boss walls a GM-30, +5 Striker.** Gnarled Greatbear's Bestial
  Frenzy stacks +20% attack speed every 6 s with no cap, so the fight is a hard DPS
  timer; the Striker kit lands ~85% of the boss's HP before it runs out. Mountain
  plate instead of the Plains vest changes nothing (same 14–16%). The bot's own
  controlled route used this exact loadout and won in August; since then the
  Chaotic Axe lost ~5% throughput (2026-09-26 weapon pass) and the boss lineage
  redesign shipped with its numbers pass still open. Apprentice hits the same
  wall; Slinger, Conduit and Squire get through. The designer has beaten this
  boss by hand, so the bot kit (or its play) may be what falls short rather than
  the boss; left undiagnosed. **Decision (2026-09-29 evening): the second seal is
  now the Mountain**, with the bot-tested setup, via `TUTORIAL_SEALS` in
  `shared/src/tutorial/scripts/plans.ts` (every class has a loadout, and the test
  proves it owns the gear, for every boss).
- **Bot harness regression (fixed here):** since the 2026-09-25 ability-wiring
  change, `applyBuild` equips reference wiring the executor did not expect, so
  every route step that attunes an ability failed the drift check on its next
  poll. `executor.ts` now expects the wired build.

- The in-world player id is the **socket id** (`playerLifecycle.ts` overwrites
  `isPlayer.id`), so it changes per connection. The guide keys its opt-in on the
  selected character id instead. The existing unlock-badge storage
  (`hud/unlockBadges.ts`) keys on the player id and so does not actually persist
  per character (not fixed here).
- `DEFAULT_RUNE_LOADOUT` puts `hp-below-25 → flee` below `in-combat → chase-enemy`
  in the same lane, so for a new player flee never fires mid-fight.

## Open questions

- Whether the 1x bot runs for Slinger and Conduit need a bigger safety margin.
- Whether the opt-in flag should become server-persisted (cross-device).
- A chime when a long beat finishes (the decision was "wait for Next"; a sound would
  tell an idle player it is time).
