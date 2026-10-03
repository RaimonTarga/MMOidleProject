# Guided Tier-1 Tutorial — Plan

**Status:** ACTIVE PLAN — Phases 1–4 built on `feat/guided-tutorial` (2026-09-29),
shipped in v0.6.2. The course-correction run (2026-10-03, W3-B) replaced the one-card
tree lesson with the weapon page's two purchases, a lean and a verb, and added the
first-hour checklist (both below). Nothing below is shipped behavior until a
`guided-tutorial-current-state.md` exists.

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
  concepts.ts        the first-hour checklist: ideas, what shows each, levels per beat
  scripts/opening.ts class-agnostic opening (quest, class pick, Clearing set)
  scripts/plans.ts   per-class gear plans (ported from bot/src/routes/t1GearPlans.ts)
                     and the lean + verb each class buys (`weaponCards`)
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
| unlockCard / setActive | Inventory → the equipped weapon → its weapon page → the card (buy, then make active; the server only activates a purchase into an empty row) |
| unlockForm / wearForm | the weapon page → the gate's door (pay, then wear) |
| attemptBoss | rest to full HP, travel, clear the guard with auto-combat, walk to the altar, ring on the altar button, wake the boss, fight |

**Lessons.** A beat may carry a `lesson` (shared `TutorialBeat.lesson`), played after its
steps: the ring rests on the card the beat bought while the panel reads what the card now
says (5 s), then the page closes and the ring rests on that card's ring on the rhythm
readout by the HP bar (5 s). Nothing is pressed or sent; the bot ignores it. Because the
purchase already moved the panel to the next beat, the panel shows a finished beat's
`working` message until the lesson ends.

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
  Hazards + Cleanse, Orbit for ranged, Step Back), master to 6. The boss weapon's home
  leg adds the lean and the verb (below): the Cave for five plans, the Swamp for the
  Slinger.
- **Two beats per paid action:** a farm beat that ends when the action is affordable
  (skipped automatically when it already is), then the action beat.
- **Safety Runes** (`scripts/runes.ts`): `hp-below-25 → flee` above chase/orbit until
  Step Back replaces it in the Cave (first-rule-wins in the Movement lane, so the
  default loadout's flee below chase could never fire in a fight);
  `while-traveling → fight-back`; Conduit waits for its formation instead of HP.
- **Budget-driven changes from the bot route:** Expose Weakness is learned after
  Cave mastery, not at Cave 3 — with Step Back and two abilities the build only fits
  the Rune budget at GM 30. `flee` is dropped at the Step Back stage for the same
  reason (ranged builds would not fit even at GM 30).
- **Slinger** skips the bot's Mountain vest (only worn against the later bosses), and
  crafts its Forest armor at Forest 3 rather than 2 (`PlanItem.atLevel`; the first-hour
  checklist below).
- **No upgrade beats** since the course correction: the `+N` ladder is retired on every
  slot (design §24.5) and an item is crafted at its old `+5` power.
- **The boss weapon is worn from where it is made** (verbs-that-fire, design §24.9): the
  Chaotic Axe from the Cave's first level (the bot crafts it there and swaps after Step
  Back), the Slinger's Poison Dagger from the Swamp's (the bot keeps the Rapier to the
  Cave), because its page is the one the guide teaches.
- Beat counts (2026-10-04, verbs-that-fire): Striker 59, Squire 59, Slinger 62, Spirit 62,
  Conduit 62, Apprentice 64. (2026-10-03, after the course correction: Striker 60, Squire
  60, Slinger 63, Spirit 63, Conduit 63, Apprentice 65. 2026-10-01, with the upgrade
  beats and the one-card lesson: Striker 78, Squire 78, Spirit 81, Conduit 81,
  Apprentice 83, Slinger 85.)

### The weapon-page lessons (verbs-that-fire, 2026-10-04; course correction 2026-10-03)

Design §24.2 makes the T1 band two rows, a **lean** (row 1: a stat, and the payload it
names) and a **verb** (row 2: a moment), and the verb's sentence is generated from the
two. The guide teaches exactly that, **on the weapon the class fights with** (design
§24.9): the Chaotic Axe for the Striker, Squire, Spirit, Apprentice and Conduit plans, the
Poison Dagger for the Slinger (`TutorialClassPlan.weaponCards.lineageId`, the boss kit's
weapon; `tutorial.test.ts` holds the plan to that). The weapon is worn from where it is
made in its home zone, so both cards are live from their purchase on — through the rest
of the leg, every seal fight and every gate fight (a lineage pays only while its own form
is worn, design §23; the test asserts both cards active in the slot at every
`attemptBoss`). Seven beats, all authored from `shared/src/data/lineages/` so no price,
level or sentence is restated:

| Beat | Where (Axe plans / Slinger) | What it does |
|---|---|---|
| `shards:<lean>` | Cave 1 / Swamp 1, the weapon just crafted and worn | farms the home-zone territory that pays the lean's shard; the line names the weapon page, the shard and the territory |
| `card:<lean>` | Cave 2 / Swamp 2 (the lean row's level; its Global Mastery 6 is long held) | buys the lean and makes it active: "Row one is the lean, a stat while the Chaotic Axe is worn (+9% attack speed); one lean is active at a time." |
| `shards:<verb>` | the same leg, after its shared learning | "Cave 4 opens row two of the Chaotic Axe's page…": the territory that pays the verb's shard |
| `card:<verb>` | Cave 4 / Swamp 4 | buys the verb and makes it active; its **lesson** quotes the sentence the pair now reads (`verbSentence`, the page's own `cardSentence`), then points at the verb's ring on the rhythm readout |
| `farm:gate:<form>` | last chapter, "The Gate" | the gate's home-zone essence and crowned-lane shards, farmed in the territory that pays them |
| `capstone:<form>` | same | the home zone's boss, in its boss-matrix loadout, repeatedly, for three capstones |
| `gate:<form>` | same | pays the gate (with the weapon in the slot, review P9) and wears the tier-2 form |

**The gate is the taught weapon's** (a designer call, flagged): the Axe's Ruinous Axe,
paid with three Broodmother Chitin from the Cave boss, and the Slinger's Venom Knife
(`swamp-mirebrand`), with three Toadeater Glands from the Swamp boss — `tutorialGateForm`
reads the lineage's tier-2 form in its home biome. The course-correction script paid the
Rapier's Gale Needle at the Greatbear, which after this move would have made the gate
chapter equip a weapon whose page the player never bought from, and end the tutorial on a
tier-2 Rapier with an empty band. The gate's boss is fought in its own row of the boss
matrix, like a seal (the capstone beat equips the boss kit and that boss's armour,
Technique and Guard); for the Axe plans the Cave loadout is the Mountain seal's, for the
Slinger the Swamp's brings Cleanse back. The gate's essence and shard farm stands where
the leg already ended.

**No Rapier lesson.** The Rapier is still crafted and worn from the Forest to the boss
weapon (it is the farming weapon there), but its page is not taught: one page, learned
once, on the weapon kept through the seals and the gate, is fewer concepts than two pages
whose cards stay with their weapon. The cost is that the page now arrives later: in the
Cave leg for five plans (Global Mastery 24–30) and the Swamp leg for the Slinger (12–18),
against the Forest leg (6–12) before.

**Which lean and verb** is per class (`TutorialClassPlan.weaponCards`): on the class's own
boss weapon, the pair with the best boss-lab uplift among those whose verb FIRES for that
class (verb firings > 0), read off the verbs-that-fire composition matrix (5 bosses × 10
seeds per pair, at `57916b52`; `server/scripts/_vfTutorialPicks.ts` prints the table). A
pick may be a same-lane (pure) pair, whose sentence is the lane's own: the lesson then says
the lean is the same colour instead of "your lean chose that".

| Class | Weapon | Lean (row 1) | Verb (row 2) | The verb then reads | Boss-lab uplift · fires/min |
|---|---|---|---|---|---|
| Striker | Chaotic Axe | Loose Grip (+9% attack speed) | Cleaving Blow | When your class mechanic fires (every 4 s at most), the hit lands twice. | +31.2% · 10.2 |
| Squire | Chaotic Axe | Hewing Arc (+9% Attack) | Cleaving Blow | Your mechanic hits half again as hard. (pure) | +25.4% · 6.6 |
| Slinger | Poison Dagger | Coated Edge (+10% DoT potency, and a light bleed) | Into the Wound | Hitting an afflicted target doubles its affliction. (pure) | +42.8% · 11.6 |
| Spirit | Chaotic Axe | Loose Grip | Chopping Rhythm | Every 6th hit strikes twice. (pure) | +24.8% · 7.3 (tied with Loose Grip → Cleaving Blow; the mean over the bosses breaks it, +23.7% to +22.7%) |
| Apprentice | Chaotic Axe | Hewing Arc | Chopping Rhythm | Every 6th hit counts as your class mechanic firing. | +14.0% · 6.0 (its pure Empowered pair never fired) |
| Conduit | Chaotic Axe | Loose Grip | Chopping Rhythm | Every 6th hit strikes twice. (pure) | +17.0% · 26.9 (four summons fill the count) |

The full per-class tables: `reports/verbs-that-fire/tutorial-picks.md`.

**Where the verb lands.** Design §24.9 lowered the T1 verb row's Global Mastery from 18
(three mastered zones) to 10 (`ROW_GLOBAL_MASTERY`, a Rapier player's Forest 4 with the
Plains behind them), so the verb opens with its zone level, inside its home leg: Cave 4
(Global Mastery 28) for the Axe plans, Swamp 4 (16) for the Slinger — at 18 the
Slinger's would have waited for Swamp 6. The script places it from the data: inside the
home leg when the row's Global Mastery is held at that level, else after the first leg
end where it is.

**Each purchase is `unlockCard` + `setActive`.** The server activates a bought card only
into an EMPTY row (W2-A), so a player who opted in mid-Tier-1 with another lean already
active would otherwise own the guide's lean without running it. After a purchase into an
empty row the `setActive` is a no-op. The bot runs the same two intents.

Three things the gate chapter needed (2026-10-01, unchanged):

- **The gate chapter runs after the seals.** The T1 gate asks for Global Mastery 30
  and its home zone at 6, which only arrive at the end of the Cave leg, and any two
  distinct biome bosses promote to Tier 2 — so a third boss before the seals would itself
  be a seal. The panel's farewell therefore waits for the script to run out rather than
  for `playerTier >= 2`, and a Tier-2 player with beats left gets an "I'm done"
  button so the farewell is never out of reach.
- **`attemptBoss` takes an optional `until`.** A gate costs three capstone drops,
  i.e. three kills; the bot adapter turns that into `repeatUntil` over one attempt.
- **The route completion includes the gate**, because `runSteps` returns the moment
  completion holds and "two seals" would have cut the run short of the new chapter.

`tutorial.test.ts` simulates every class's playthrough (each step made true the way
the server would) and asserts the guide only ever moves forward, reaches GM 30,
ends at Tier 2, and that every loadout fits the RP budget of the Global Mastery
guaranteed at that point. It also asserts: both cards bought and active; the taught
lineage is the boss kit's weapon; every lineage step happens with that weapon in the
slot; each card bought where its own gates hold, at its row's level of the home zone;
every boss fight (seals and gate) fought on that weapon with both cards active; the
fight after the verb lesson is on it; a mid-T1 player with another lean active still
gets the `setActive`; the lesson quotes the sentence the weapon page shows (and claims
the lean "chose" it only for a composed pair); and the first-hour checklist below.

### The first-hour checklist (2026-10-03)

**At most two new ideas per level, each explained by what the screen shows.** A level is
where the player is when a line shows: the chapter's zone and its mastery level, then
"The Seals" and "The Gate". The checklist is DATA, not a manual review: every beat names
the ideas its line introduces (`TutorialBeat.teaches`), the ideas and the screen element
for each live in `shared/src/tutorial/concepts.ts`, and `tutorialChecklist(script)` reads
each beat's level off the script's own gates (a beat is reached only once every farm
before it has met its condition). `tutorial.test.ts` holds every class to ≤ 2 new ideas
per level and per beat, each idea introduced once, every idea with a screen element, and
every anchor it names a real one. The same ideas are then MEASURED on the bot's 1x runs
(`server/scripts/_ccTutorialSweep.ts`): the level the run was actually at when each beat
started, with farm beats that were already satisfied left out — the guide never shows
those.

| Level | Beat | New idea | What on screen explains it | Classes |
|---|---|---|---|---|
| Clearing 0 | `farm:primordial-club` | Auto Combat fights for you | the Auto Combat button, ringed and pressed | all |
|  |  | A quest's kills earn the next tier | the kill bar on the guide card |  |
| Clearing 1 | `craft:primordial-club` | Zones pay essence; the Make tab turns it into gear you wear | Make → Craft, then Inventory → Equip, ringed | all |
| Clearing 1 | `farm:clearing-vest-t1` | Armor is health | the health bar growing when it is worn | all |
| Clearing 2 | `choose-class` | Your class | the class cards on the Passive Tree | all |
| Clearing 2 | `farm:clearing-charm-t1` | A charm refills health between fights | the health bar refilling between pulls | all |
| Clearing 4 | `craft:clearing-boots-t1` | Boots are speed | the walk between pulls getting shorter | all |
| Clearing 4 | `runes:opening` | Runes are standing orders; the higher rule of a lane wins | the Runes board, built rule by rule | all |
| Plains 0 | `farm:iron-broadsword` | The guide travels between zones | the arrival banner naming the zone | all |
| Plains 2 | `learn:ability-recipe-sweep` | A Technique fires on its own every so often | the Abilities tab, Attune | all |
|  |  | An ability fires from a Rune | "Use default timing" under the ability |  |
| Plains 4 | `max:plains` | Zone mastery opens recipes | the Mastery level bar on the guide card | all |
| Forest 2 | `learn:ability-recipe-second-wind` | A Guard rescues you mid-fight | the Abilities tab, Attune | all |
| Forest 3 | `craft:forest-vest-t1` | Evasion: harder to hit | the Evasion row of the stat sheet | Slinger |
| Swamp 0 | `farm:rune-recipe-avoid-hazards` (Slinger: `farm:ashbrand-blade`) | Poison keeps hurting after the hit | the poison tile on the buff bar | all |
| Swamp 1 | `shards:<lean>` | A weapon has a page of cards | the weapon page, opened from the equipped weapon | Slinger |
|  |  | Every kill pays its territory's shard | the arrival banner and the map ("Mire territory · Venom Shards") |  |
| Swamp 2 | `card:<lean>` | Row 1, the lean: a stat while the form is worn, one active | the lean card's sentence and the stat sheet beside it | Slinger |
| Swamp 2 | `rune:rune-recipe-avoid-hazards` | Hazard ground hurts, and a Rune walks around it | the hazard patches on the Swamp floor | all |
| Swamp 3 | `learn:ability-recipe-cleanse` | Abilities are swapped to fit the zone | the Abilities tab, Unattune then Attune | all |
| Swamp 4 | `card:<verb>` | Row 2, the verb: a moment, and the lean decides what happens then | the verb card's sentence on the weapon page, ringed | Slinger |
|  |  | A ring by the health bar shows the verb coming | the verb's ring on the rhythm readout, ringed |  |
| Mountain 3 | `rune:rune-recipe-keep-distance` | Orbit: circle out of reach while attacking | the Runes board | Slinger, Spirit, Apprentice, Conduit |
| Cave 0 | `farm:chaotic-axe` (Slinger: `farm:rune-recipe-step-back`) | A wound-up hit can be dodged | the cast bar over a monster winding up | all |
| Cave 1 | `shards:<lean>` | A weapon has a page of cards | the weapon page, opened from the equipped weapon | all but the Slinger |
|  |  | Every kill pays its territory's shard | the arrival banner and the map ("Brood territory · Gale Shards") |  |
| Cave 2 | `card:<lean>` | Row 1, the lean: a stat while the form is worn, one active | the lean card's sentence and the stat sheet beside it | all but the Slinger |
| Cave 2 | `rune:rune-recipe-step-back` | Step Back dodges a wound-up hit | Step Back at the top of the Runes board | all |
| Cave 4 | `card:<verb>` | Row 2, the verb: a moment, and the lean decides what happens then | the verb card's sentence on the weapon page, ringed | all but the Slinger |
|  |  | A ring by the health bar shows the verb coming | the verb's ring on the rhythm readout, ringed |  |
| The Seals | `boss-prep:plains` | Two boss seals open Tier 2 | the tier-up after the second seal | all |
| The Seals | `boss:plains` | Clear the guard, then wake the boss at its altar | the altar button, ringed | all |
| The Gate | `capstone:<form>` | Only the boss drops the gate's capstone | the capstone pips on the gate block | all |
| The Gate | `gate:<form>` | A gate turns the weapon into its next form | the gate block at the bottom of the weapon page | all |

What counts as an idea: something the player holds in their head from then on (a system,
a screen, a rule), not an item — the first charm is an idea, the second charm is not, and a
reason that restates a known idea ("the Swamp armor resists poison") introduces nothing.
An idea rides on the line where the thing becomes real (the craft, the purchase), not on
the "next up" farm line before it: a farm line shows a level early, and a farm whose cost
is already met is skipped and never shown at all.

**What the check changed.**

- **The Slinger's Forest 2** carried three ideas statically: the lean, Second Wind (a Guard)
  and the Forest armor's "harder to hit" (evasion). The armor now waits for Forest 3
  (`PlanItem.atLevel`); the recipe still opens at Forest 2 and the price is unchanged.
- **The opening.** Measured on the sweep (which ran the old opening): the ten Wisps of the
  tier-0 quest carry the Clearing to level 3 by themselves, so with the quest first, the
  club's and the armor's farm beats were skipped and the class, the gear, the armor and the
  charm reached a new player within ~15 s of the tier-up, while the armor's and mastery's
  lines were never shown. The club and the Bark Wrap are now made DURING the quest
  (crafting needs no tier or class, and the Make tab shows once essence is held), the
  class pick and the charm come with the tier-up, the boots' idea moved from their farm
  line to their craft line, and the mastery idea moved to `max:plains`, which is never
  skipped.
- **The verb.** Max-ing the Forest often pays for the verb already (the Spirit's verb farm
  was skipped in the sweep), so the verb's idea rides on its purchase line.
- **The gate.** Tier 2 arrives with the gate's essence and Gale Shards already held, so the
  gate chapter's farm beat was skipped for all six classes and its line (the one that said
  the chapter is optional) never showed. The capstone line now says it, and the gate idea
  rides on the pay-and-wear beat.
- The lesson beats were split to fit: the weapon page and shards at the home zone's level
  1, the lean at 2, the verb and the readout ring at the verb's purchase (Forest 1 / 2 and
  the end of the Swamp leg until verbs-that-fire; Cave 1 / 2 / 4, and Swamp 1 / 2 / 4 for
  the Slinger, since).
- **Verbs-that-fire (2026-10-04).** Moving the lesson to the boss weapon's home leg puts
  the lean beside Step Back at Cave 2 (beside Avoid Hazards at the Slinger's Swamp 2): two
  ideas each, inside the rule. The Forest now introduces one idea, the Guard (two for the
  Slinger, whose armor's evasion stays held at Forest 3).

**Measured on the 1x sweep** (rev `1297b206`, before the opening change; the opening was
smoke-measured separately on the new revision): see "2026-10-03 — the course-correction
1x sweep" in the Validation record and `reports/course-correction/sweep-1x.md`.

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

**A 1x six-class sweep without the frozen runner** (the course-correction sweep, 2026-10-03):
one server and one game database per class, so no two bots share a world. Per class N,
from `server/`, with `PORT=432N`, `DATABASE_URL=…/gamedb_<name>N` (create it first; the
migrations run at boot), the shared logdb, `REDIS_CHANNEL_PREFIX=<name>N`,
`AUTH_DEV_BYPASS=1`, `NODE_ENV=development`:

```bash
node --env-file=../.env --conditions=development --import tsx src/index.ts
# wait for /healthz, then from bot/:
node --import tsx --conditions=development src/run.ts --route=tutorial-<class>-t1 \
  --policy=intended --rewardMultiplier=1 --server=http://localhost:432N --account=bot-<name>-<class>
```

A fresh server boots at 1x, so the runs are untainted. The Redis database index does not
isolate anything (the server uses Redis only for pub/sub, which ignores it, and the local
Redis has 16 databases); `REDIS_CHANNEL_PREFIX` is what keeps the servers' telemetry apart.

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

### 2026-10-02 (evening) — the canonical 1x sweep after the T1 boss pass

**The second untainted six-class run of the whole script**, and the confirmation step of
the T1 boss pass (`briefs/t1-boss-pass-report-2026-10-02.md`). Same harness and isolation
as the morning sweep above — `canonical-isolated`, `taints: []`, reward multiplier 1, no
fast boss retry, one server and one game database per class, 2 h cap — on revision
`637ce2f5`, which carries three changed boss rows and nothing else:

| boss | field | before | after |
|---|---|---|---|
| Crag Behemoth | `stats.attack` | 56 | 50 |
| Gnarled Greatbear | `stats.hp` / `stats.attack` | 1800 / 18 | 1450 / 16 |
| Grave Toadeater | `stats.hp` | 2100 | 1750 |

**All six classes complete the whole script, gate paid.** The morning sweep had three.

| Class | Clearing | Plains | Forest | Swamp | Mountain | Cave | Seals | Gate | deaths | wall |
|---|---|---|---|---|---|---|---|---|---|---|
| Striker | 11/11 | 13/13 | 9/9 | 12/12 | 10/10 | 16/16 | 4/4 | **3/3** | 2 (0 to a boss) | 67m40s |
| Squire | 11/11 | 13/13 | 9/9 | 12/12 | 10/10 | 16/16 | 4/4 | **3/3** | 2 (0 to a boss) | 68m31s |
| Slinger | 11/11 | 13/13 | 13/13 | 16/16 | 11/11 | 14/14 | 4/4 | **3/3** | 2 (0 to a boss) | 63m15s |
| Spirit | 11/11 | 13/13 | 9/9 | 12/12 | 13/13 | 16/16 | 4/4 | **3/3** | 2 (0 to a boss) | 54m38s |
| Apprentice | 11/11 | 13/13 | 9/9 | 14/14 | 13/13 | 16/16 | 4/4 | **3/3** | 2 (0 to a boss) | 77m28s |
| Conduit | 11/11 | 13/13 | 9/9 | 12/12 | 13/13 | 16/16 | 4/4 | **3/3** | 2 (0 to a boss) | 58m13s |

**Not one beat anywhere came back `stalled` or `blocked`**, for the second sweep running.

| Class | Plains seal | Mountain seal | Greatbear (gate, 3 kills) | GM 30 | Tier 2 | gate paid |
|---|---|---|---|---|---|---|
| Striker | 1/1, 45 s fight | **1/1**, 74 s | **3/5** | 34m25s | 52m30s | **67m39s** |
| Squire | 1/1, 51 s | 1/1, 75 s | **3/5** | 34m51s | 52m38s | **68m30s** |
| Slinger | 1/1, 45 s | 1/1, 50 s | 3/5 | 29m38s | 44m25s | **63m14s** |
| Spirit | 1/1, 51 s | 1/1, 56 s | 3/5 | 27m00s | 40m24s | **54m38s** |
| Apprentice | 1/1, 45 s | 1/1, 50 s | **3/5** | 40m52s | 62m07s | **77m27s** |
| Conduit | 1/1, 55 s | 1/1, 74 s | 3/5 | 29m24s | 44m37s | **58m12s** |

**Against the morning sweep, same day, same harness:**

| Class | Mountain seal | Greatbear (gate) | outcome | deaths |
|---|---|---|---|---|
| Striker | **0/12 → 1/1** | not reached → **3/5** | 2 h cap, no Tier 2 → **completed** | 17 → 2 |
| Squire | 2nd try → 1/1 | **0/13 → 3/5** | 2 h cap → **completed** | 13 → 2 |
| Apprentice | 1/1 → 1/1 | **0/11 → 3/5** | 2 h cap → **completed** | 11 → 2 |
| Spirit | 1/1 → 1/1 | 3/8 → 3/5 | completed → completed | 5 → 2 |
| Conduit | 1/1 → 1/1 | 3/6 → 3/5 | completed → completed | 3 → 2 |
| Slinger | 1/1 → 1/1 | 3/5 → **3/5, unchanged** | completed → completed | 3 → 2 |

Three things there matter more than the rest.

**The three walled classes are unwalled and the comfortable one did not move.** The
Slinger's gate is identical pre and post — 3 kills in 5 attempts — and the Spirit's barely
moved. A nerf that had trivialised the fight would have moved them too, so the Greatbear's
new pair reads as sized rather than overshot.

**Pacing did not change.** Completions run 55–77 min against the morning's 60–65 for its
three finishers, and GM 30 lands at 27–41 min against 26–44. The pass opened two walled
routes without lengthening anyone's. (The Apprentice is the slowest at 77 min and was
also the slowest to GM 30 at 41 min; that is its farm pace, not the gate.)

**No boss killed anyone, in the entire sweep.** The Greatbear went **18 victories and no
losses** across the six classes, in 28–36 s a fight, and all twelve deaths are Forest
dungeon guardians.

### The Forest dungeon's guard pack is the gate's real cost

The sweep's own finding, not the boss pass's, and the one thing to carry forward. Max
concurrent attackers on the player, from `concurrency-sample`, **identical for all six
classes** — so it is the encounter, not a build:

| dungeon | max concurrent attackers |
|---|---|
| Plains (seal 1) | 4 |
| Mountain (seal 2) | **1** |
| **Forest (the gate)** | **9** |

Every gate death looks the same in every run: the character rests to full, holds at full
through the travel, engages, and dies 55–60 s later with seven to nine guardians on it, to
a 12–15 damage killing blow. It is **not** a low-HP re-entry — the HP trace sits at max
right up to the engagement — and it is not the boss, which those attempts never reach.
All twelve killers are `Forest Sentinel` (x8) and `Young Wolf` (x4), `isBoss: false`.

So the gate chapter has always been paid in guard-pack deaths rather than boss losses: the
morning sweep's three finishers also show `—` in their loss-hp-left column, meaning their
failed attempts recorded no boss HP either. What this pass changed is that the boss is no
longer *additionally* a wall for half the roster. The residual cost — about two deaths per
three kills — is the nine-wolf guard, and tuning it is a dungeon-guard question rather
than a boss row.

A corollary worth keeping: the Mountain dungeon runs its boss fight at **one** concurrent
attacker, so the Crag Behemoth is a pure duel. That is why the boss pass's lever there had
to be the boss's own `attack`, and why nothing about a guard pack could have fixed it.

### What this sweep still does not cover

- **One replica per class.** Each cell is a single run, so a 3/5 gate is one sample, not a
  rate. The lab matrix in the boss-pass report carries the per-cell spread; this carries
  the route.
- **The farewell**, still — `TUTORIAL_FAREWELL` is panel copy, not a beat, so no bot run
  exercises it. A real-client pass is owed.
- **The Swamp and Cave bosses**, which the script never fights; the boss pass measured
  those in the lab only.
- **The second-seal decision was re-taken on the lab, not on this sweep** (boss-pass report
  section 7): Mountain stays, because it is harder for one class of six rather than most,
  and because Step Back — taught in the leg immediately before the seals — is inert against
  a Greatbear that authors no telegraphed attack. This sweep is consistent with that (every
  class takes both seals first try) but does not discriminate between the two.

### 2026-10-03 — the course-correction 1x sweep

The script after the course correction (W3-B, revision `1297b206`, route v1.2.0): the
lean at Forest 2, the verb at the end of the Swamp leg, `unlockCard` + `setActive`. 1x and
untainted, one server and one game database per class, bots launched directly rather than
through the frozen runner. Full ledger: `reports/course-correction/sweep-1x.md`.

| Class | beats | lean | verb | Plains | Mountain | Greatbear | gate paid | deaths |
|---|---|---|---|---|---|---|---|---|
| Striker | 60/60 | 12m26s | 23m22s | 1/1 | **1/3** (lost at 8% twice) | 3/5 | 68m41s | 4 |
| Squire | 60/60 | 12m51s | 23m38s | 1/1 | 1/1 | 3/5 | 61m54s | 2 |
| Slinger | 63/63 | 11m29s | 23m52s | 1/1 | 1/1 | 3/5 | 58m38s | 2 |
| Spirit | 63/63 | 10m40s | 17m43s | 1/1 | 1/1 | 3/5 | 47m25s | 2 |
| Apprentice | 65/65 | 16m00s | 29m40s | 1/1 | 1/1 | 3/5 | 69m25s | 2 |
| Conduit | 63/63 | 10m28s | 18m56s | 1/1 | 1/1 | 3/5 | 51m18s | 2 |

**All six complete the whole script, gate paid; no beat ended anything but `done`.** Every
lean was bought at Forest 2 (GM 8) and every verb at GM 18 with the Flash Rapier in hand;
the verb's walk back to the Forest cost 0–176 s. Twelve of the fourteen deaths are the
Forest dungeon's guard during the gate rounds (two per class, as before); the Striker's other
two are the Crag Behemoth at 8%, against 1/1 in the evening sweep (one replica). Five classes
pay the gate 4.6–8.0 min sooner than the evening sweep: the route lost its upgrade beats.

**The verb is live for only 4.6–8.6 minutes** (28–37 kills) before the Cave swaps every
plan to the Chaotic Axe or the Poison Dagger, and inert in every boss fight after that.

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
