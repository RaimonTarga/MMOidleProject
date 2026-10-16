# Guided Tutorial — Current State

**Audited:** 2026-10-16 against `rework/class-first` (OV-DOCS; the gear, OV2-GUIDE). Code wins over this page.
**Owners:** `shared/src/tutorial/` (scripts, conditions, resume), `client/src/tutorial/`
(director, panel, ring). **Check:** `shared/src/tutorial/tutorial.test.ts`.
**History:** the pre-rework per-class route, the first-hour checklist's origin and every
validation sweep up to 2026-10-06 are in
[archive/guided-tutorial-pre-rework-state.md](archive/guided-tutorial-pre-rework-state.md); the
original plan is [archive/guided-tutorial-plan.md](archive/guided-tutorial-plan.md).

## What it is

An optional, desktop-only guide that plays the game *for* the player, one beat at a time, from
the Clearing through Tier 4. A panel at the top of the right rail (`TutorialPanel`, mounted by
`RightSidebar` in `client/src/hud/MenuButtons.tsx`; `MobileHUD` has no rail, so no guide) shows
a short line and a **Next** button. On Next the director performs the beat through the ordinary
UI intents while a gold ring moves across the controls it presses. The player only clicks Next,
except for the class pick, which the player makes.

Since the class-first build every class has its own beats. The script is the shared opening,
then the class's T1 stretch (the two seals), then a Tier 2, a Tier 3 and a Tier 4 stretch.
Before a class is picked, the class-agnostic seal route follows the opening.

## The route

| Stretch | Source | What happens |
|---|---|---|
| Opening (10 beats) | `scripts/opening.ts` | The tier-0 quest (ten Wisps), with the club and the Bark Wrap crafted and worn during it; the class pick (`chooseClass`: the Passive Tree opens with the class cards ringed, the player picks); then the Herb Pouch and the Soft Boots. Once a class is picked, its own Clearing weapon is made right after the pick ([The gear](#the-gear)). |
| Tier 1 | the class builder, on `scripts/sealRoute.ts` | Plains to its lesson level, the lesson's line while farming on to the tier cap, the Plains boss (first seal); Forest, Swamp and Cave the same way; a short Mountain farm to its lesson level; the Mountain boss (second seal); the farewell beat, which waits for Tier 2. The seals are `TUTORIAL_SEALS` (`scripts/plans.ts`: Plains, then Mountain). |
| Tier 2 | the class builder | A pointer line to the discipline pick, then each T2 zone as three beats: farm to the zone's lesson level, the lesson's line while farming to the tier cap, the zone's tier-2 boss (the line names the trophy it earns or ranks up). Seven zones: Plains, Forest, Mountain, Swamp, Cave, Jungle, Desert (the Conduit takes the Mountain after the Cave). |
| Tier 3 | the class builder | The same shape after a pointer to the specialization pick, over Mountain, Cave, Swamp, Jungle, Desert, Tundra, Volcanic (the Striker takes the Swamp before the Cave). |
| Tier 4 | the class builder | The same shape after a pointer to the leaf pick, over Mountain, Tundra, Jungle, Desert, Volcanic, Wasteland (`graveyard`), Trench. The script ends on the last Tier 4 boss. |

Lesson levels are read off the kits (`LESSON_ZONE_LEVEL` = 2 within each tier's six-level
segment, converted with `absoluteZoneLevel`) and caps off `biomeLevelCap`; no level is written
into a step.

## The per-class seams

`TUTORIAL_CLASS_BEATS` in `scripts/index.ts` maps a class root to its builder, and
`tutorialScriptFor(classRoot)` returns the opening plus that builder's beats as one script (so
supersession sees every later step). Each builder starts from `buildSealRouteBeats()` and keeps
the seal beats' ids (`open:plains`, `boss:plains`, `zone:forest`, `zone:swamp`, `zone:cave`,
`boss:mountain`, `farewell`): it ends each zone farm at the lesson level, adds a beat that farms
on to the cap carrying the lesson's line, inserts the Mountain approach, and appends its
Tier 2–4 stretches. The lines live in the builder files; edit them there. `tutorialScriptFor` then
lays the class's gear into the builder's beats ([The gear](#the-gear)).

| Class | Builder | T1 lesson beats (Plains, Forest, Swamp, Cave; Mountain) | Beats with opening (gear beats) | Boss fights |
|---|---|---|---|---|
| Striker | `scripts/striker.ts` | `striker:sweep`, `striker:hamstring`, `striker:rend`, `striker:focus`; Coil on `boss:mountain` | 164 (79) | 23 |
| Squire | `scripts/squire.ts` | `squire:shove`, `squire:riposte`, `squire:steel-will`, `squire:shield-bash`; Guard on `boss:mountain`. Also fights the Swamp boss (`squire:toadeater`, its three answers on the line) | 155 (74) | 24 |
| Apprentice | `scripts/apprentice.ts` | `apprentice-spread-lesson`, `apprentice-numb-lesson`, `apprentice-siphon-lesson`, `apprentice-converge-lesson`; Seize on `boss:mountain`. Its farewell beat has its own line | 121 (36) | 23 |
| Slinger | `scripts/slinger.ts` | `slinger:scatter`, `slinger:snare`, `slinger:venom`, `slinger:breaching`; Stopping on `boss:mountain`; Plains boss line "a plain last round" | 152 (67) | 23 |
| Spirit | `scripts/spirit.ts` | `spirit:chain-lightning`, `spirit:thunderclap`, `spirit:downpour`, `spirit:thunderbolt`; Eye of the Storm on `boss:mountain` | 126 (41) | 23 |
| Conduit | `scripts/conduit.ts` | `conduit:warden`, `conduit:thornrunner`, `conduit:bile-spitter`, `conduit:cave-brute`; Ridge Marksman on `boss:mountain`. Closing beats per tier (`t2:done`, `t3:done`, `t4:done`) | 134 (46) | 23 |

The first trophy's line rides on `zone:forest` for every class (the first beat after the Plains
boss): the relic slot holds it because the class config is in `auto` mode.

## The gear

Designer's decision (2026-10-16): the guide crafts each tier's class gear the way the bot routes
do. Built by OV2-GUIDE.

- **The plan** (`scripts/gearPlans.ts`, `TUTORIAL_GEAR_PLANS`): one per class, keyed by class
  root, copied from the class's default-chain routes (`bot/src/routes/<class>T1.ts` .. `T4.ts`) as
  they stood on 2026-10-16: the class's Clearing start weapon, then per tier and zone the pieces
  the route wears there, in unlock order. Copied as data (`shared/` never imports `bot/`): when a
  route's gear changes, change the plan too. Default chains: Striker Balanced, Squire Bulwark,
  Apprentice Fire, Slinger Gunslinger, Spirit Tide, Conduit Pack.
- **The beats** (`scripts/gear.ts`, `buildGearBeats`): the start weapon right after
  `choose-class`; then one beat per piece (`gear:<recipe id>`): farm the zone until the piece can
  be made, craft it, wear it. A piece goes where its zone opens it (a tier's first zone level opens
  the weapon, then armor, charm and boots one level apart). A zone farm that runs past a piece's
  level is cut there: it keeps its id and line and now ends when the piece can be made, the piece
  follows, and the last piece cut from it carries on to the level the farm used to end at. So the
  builder's lines still come up at their level, and every piece as soon as it opens. A piece from
  another zone (the Slinger's T3/T4 Jungle vest and Carbine, a detour before the Mountain boss) or
  one worn again (`gear:<id>:again`, the Striker's Plains charm in the T2 Jungle) comes right after
  the zone's first farm.
- **The lines** are built from the gear data: "Craft the <name> and wield/wear/carry it /
  lace them up: <first sentence of the weapon's description or the class's line on the base>"
  (boots have no class line: a stock line about speed). **T2–T4 weapons:** the guide cannot know
  the discipline (no step or condition reads it), so it makes the default chain's weapon and says
  "it suits <default pick>, the default discipline (the Apprentice: school), and the Make tab has
  weapons for the others". *PLACEHOLDER wording.*
- **Moot pieces.** Every gear craft and equip carries an `unless`: the piece no longer matters
  once the next zone in the guide's order has been fought in, the zone's boss for that tier is
  down, or the tier is two promotions on (one for Tier 1; three to five seals promote before a
  tier's last bosses), or the player already wears a later piece of the plan for that slot. A
  hand-played or older character is never sent back for gear it has outgrown.
- **No Next for gear.** Every gear beat is `auto` (`TutorialBeat.auto`): `TutorialPanel` starts it as
  soon as it is current and nothing else runs, keeps its line on screen while it runs (not the
  waiting text), and moves on by itself; the Next glow and chime come only when a beat that needs
  Next is up. A stop, an error or a death leaves the beat waiting for Next, as before. Every
  other beat keeps its Next.
- The farewell line now reads "Two seals, Tier 2, and a full set of gear made for your class."

**What the guide does not do, as built:**

- **It wears only the default chain's weapons at T2–T4**, and only the zone pieces that chain's
  route wears; a player on another discipline crafts their weapons by hand from the Make tab. It
  makes no detours or re-wears the plan does not list (the Striker's late T2 Mountain seal, the
  Squire T1 route's seal sets: the guide fights each boss in its zone's turn).
- **It never opens or edits the class screen.** The class config stays in `auto`, which the
  server rebuilds whenever a lesson, trophy or budget step arrives; the lines say what auto did
  ("The Order equipped it for you").
- **It never makes the tier picks.** The discipline, specialization and leaf beats only point at
  the Passive Tree: no tutorial step or condition reads a pick, so the farms carry on whether or
  not the player has chosen.
- **No bot runs the script.** The `tutorial-<class>-t1` routes and their adapter were removed
  (D5). The class routes (`<class>-t1` to `-t4`, [bot/README.md](../bot/README.md)) follow the
  guide's zone order and seals (`T1_BIOME_ORDER`, `TUTORIAL_SEALS`) but are separate data: they
  skip the opening's club, craft zone gear (which the guide's plan copies), and they set the class config and the tier picks
  themselves. `tutorial.test.ts` is the guide's only check.

## Panel and persistence

- **Offer.** A character that has never decided sees "Guided play" (Start guide / No thanks), at
  any tier; from Tier 1 a note says it picks up from where you are. No thanks or Stop collapses
  it to a **Guide** tab, which reopens the offer.
- **Opt-in** is a per-character `localStorage` flag (`mmo_idle.tutorial.<characterId>`: `on`,
  `off` or `done`). Progress is never stored.
- **Stop** asks for confirmation; the guide keeps working until it is confirmed. A character
  switch or unmount aborts the running beat.
- **Death** turns the card into "You fell…"; Next presses the same respawn as the death overlay.
- **From Tier 2** an "I'm done" button leads to the farewell card (the three
  `TUTORIAL_FAREWELL` lines, `scripts/farewell.ts`, and Thanks!). The card also shows on its own
  once the script has run out after the last Tier 4 boss.
- **The route strip** above the line is a thin fill with one tick per chapter.
- **Auto beats** (the gear) start without Next; see [The gear](#the-gear).

## Director behavior

**Resume from state** (`resolve.ts`): the current beat is the first whose steps are not all
satisfied by the live `PlayerView`. Opting out, playing by hand, reloading or dying all resume
correctly. Farm conditions are authored monotone (`anyOf(hasItem X, canCraft X)`, never a bare
`canCraft`), craft and equip steps count as satisfied once a later step has put another item in
that slot (an item the script also wore earlier does not count, so wearing a piece again later
skips nothing), a craft or equip whose `unless` holds is satisfied, and location is an attribute
of farm and boss steps, never a step of its own.

**Running a beat** (`director.ts`): open the panel by writing the UI atoms, rest the ring on each
control for 1 s (`POINT_MS`), fire the same `hudBus` call the button makes, then wait for the
server's delta. Step kinds (`types.ts`): `farm` (travel if needed, Auto Combat on, progress
until the condition holds), `chooseClass`, `craft` and `equip` (each with an optional `unless`),
`attemptBoss` (travel, clear the
guard before waking the boss, then the altar; with `until`, repeat rounds while the altar
reforms). Conditions: tier, class picked, biome level, Global Mastery, essence, recipe unlocked,
can craft, item held or worn, boss cleared, and `allOf` / `anyOf` / `not`.

**Feedback:** a waiting beat that finishes makes Next glow once and plays `tutorial-ready`; an
automatic button press plays `tutorial-action` (both follow the saved SFX settings,
[audio-current-state.md](audio-current-state.md)).

## The first-hour checklist

Every beat may name the ideas its line introduces (`TutorialBeat.teaches`, ids in
`concepts.ts`), and `tutorialChecklist(script)` reads each beat's level off the script's own
gates (a farm levels only the zone it fights in; a gate on another zone is a gear guard).
`tutorial.test.ts` holds every script to at most two new ideas per level and per beat,
each introduced once, each with a screen element. Only the opening and the seal beats tag ideas
(auto combat, tier, gear, armor, class, charm, boots, zones, seals, the altar, poison); the class
lines tag none, so the checklist does not yet see the class lessons.

## What the test pins

`tutorial.test.ts`: resume from state over the opening; the seal route's ids, seals and
farewell; that all six class roots have a builder; for every script, unique beat ids, lines of
at most 170 characters (`SAY_LIMIT`) that never say "tree" except "Passive Tree", farm locations
that resolve to a node and conditions guarded by their outcome; per class, the beat ids, that
each lesson line names its piece, the lesson-level splits and the tier pointers (on the builder's
own beats); for the Spirit, that the script resolves to done once every Tier 4 boss is cleared;
the gear (every class): the gear beats wear exactly the plan, the start weapon follows the class
pick, each piece is a real recipe of the right class and tier made in its own zone, which the
guide farms to that level in that tier, before the next boss of another tier, each line one
sentence with no numbers (T2–T4 weapons name the default pick), the gear never brings a builder
line up earlier, gear beats and only gear beats are `auto`, and resume with gear (a later piece worn skips earlier ones, a finished zone's
gear is moot, the Jungle's re-worn charm does not loop); and the checklist above. It is a static
check: no live run has walked the class scripts end to end.

## Open

- The class lessons carry no `teaches` tags.
- The gear lines and the T2–T4 default-weapon line are PLACEHOLDER wording; the plans copy the
  routes as of 2026-10-16 and drift when the routes are retuned.
- A lesson line can still be skipped silently if the farm before it overshoots and the next
  piece is already affordable when it comes up (the cut farm then ends at once); not seen, never
  run live.
- About 35-80 gear beats per class; they run without Next, but no live run has checked the pacing.
- Mobile stays outside the guide's scope.
