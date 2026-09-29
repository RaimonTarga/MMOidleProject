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
second seal promotes the player to Tier 2; the guide says goodbye ("keep going
forward"), points at the Passive Tree for the frame choice, and disappears.

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
- Beat counts: Striker 83, Slinger 80, Conduit 86.

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
