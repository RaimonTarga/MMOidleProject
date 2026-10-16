# OV2-GUIDE report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov2-guide   **Last commit:** see `git log rw/ov2-guide` (this report is the last commit)

Designer's decision: "the guide crafts each tier's class gear the way the bot routes do". Built in
`shared/src/tutorial/` only; the director needed no change (it already performs craft and equip
steps through `nextStepOf`, which now honours the new `unless`).

## Done

- **Plans** (`shared/src/tutorial/scripts/gearPlans.ts`, `TUTORIAL_GEAR_PLANS`): one per class,
  keyed by class root. Copied from each class's default-chain routes by instantiating
  `<class>T4Route(...)` for the default chain (it replays T1-T3) and listing every craft in order,
  zone by zone (a scratch script; nothing in `bot/` edited). The Slinger's routes carry every
  discipline's branch, so its plan was copied by hand from `SLINGER_T*_ZONE_KIT` / `_GUNS` for
  Gunslinger. Default chains: Striker Balanced > Iaido > Read the Blow, Squire Bulwark > Reverb >
  Second Line, Apprentice Fire > Afterburn > Tinderbox, Slinger Gunslinger > Fan the Hammer > Light
  Hands, Spirit Tide > Spring Tide > Wading, Conduit Pack > The Hunt > Avenge.
- **Beats** (`scripts/gear.ts`, `buildGearBeats`, called from `tutorialScriptFor`):
  1. The class's Clearing start weapon (`gear:<id>`) right after `choose-class`. The opening is
     untouched (the Primordial Club still comes before the pick).
  2. One beat per piece: farm the zone until the piece can be made, craft, wear. A piece goes where
     its zone opens it. A zone farm that runs past a piece's level is cut there (it keeps its id
     and line, ends when the piece can be made, and its waiting text names the piece); the last
     piece cut from it carries on to the level the farm used to end at. A piece opened exactly at
     a farm's level follows that farm. Result: weapon at the zone's first tier level, armor +1,
     charm +2, boots +3, and every builder line (lessons, pointers, bosses) still comes up at or
     after its own level.
  3. Detours (Slinger T3/T4: Jungle vest and Carbine before the Mountain boss) and re-wears
     (`gear:<id>:again`, Striker T2 Jungle puts the Plains charm back on) come right after the
     zone's first farm.
- **Lines**: built from the gear data, one sentence, no numbers. "Craft the <name> and wield it /
  wear it / carry it / lace them up: <first sentence of the weapon description or of the class's
  line text on that base>", shortened to "Craft the <name>: ..." when over the 170 limit; boots
  have no class line, so a stock speed line. T2-T4 weapons: "Craft the <name> and wield it: it
  suits <default pick>, the default discipline (Apprentice: school), and the Make tab has weapons
  for the others." **PLACEHOLDER wording**, all of it.
- **Moot gear** (`types.ts`: optional `unless` on `craft` and `equip`; `resolve.ts`): each gear
  craft/equip is satisfied once the next zone in the guide's order has been fought in, the zone's
  boss for that tier is down, the tier is two promotions on (Tier 1: tier 2; 3-5 seals promote
  before a tier's last bosses), or a later piece of the plan for that slot is worn. The farm step
  mirrors it. So a hand-played or older character is not sent back for outgrown gear.
- **Resolve** (`resolve.ts`): craft steps are now superseded like equip steps (the slot holds an
  item a later step puts on), and an item the script also put on EARLIER no longer supersedes.
  Without that, the Striker's re-worn Plains charm would have marked every charm between the
  Plains and the Jungle as done (crafted, never worn).
- **Checklist** (`concepts.ts`): a farm levels only the zone it fights in (new `farmZone`); the
  gear guards name other zones and were counting as progress.
- **Farewell** (`scripts/farewell.ts`): "Two seals, Tier 2, and a full set of gear made for your
  class. The first stretch is done, and the road goes on."
- **Test** (`tutorial.test.ts`): the class-tail checks now run on each builder's own beats, and the
  geared script must keep every builder beat (id, order, line). New gear section, per class: gear
  beats wear exactly the plan; the start weapon follows the class pick; each piece is a real
  recipe, a weapon of this class or a shared base, of the stretch's tier, made in its own zone,
  whose level belongs to that tier and is within what the guide farms that zone to in that tier,
  made before the next boss of another tier; lines one sentence, no digits, name the piece, T2-T4
  weapons name the default pick and the Make tab; the gear never brings a builder line up earlier.
  Resume: a new Striker makes its weapon next; worn, the guide goes on; a later weapon worn skips
  earlier ones; a finished zone's gear is moot; the Jungle re-wear does not loop back to the Cave
  charm. The old resume walks give the view the gear made before each beat.
- **Follow-up (conductor): gear beats run without Next.** `TutorialBeat.auto?: true` (`types.ts`), set
  on every gear beat (`gear.ts`). `client/src/tutorial/TutorialPanel.tsx`: an effect starts an
  `auto` beat with `runBeat` as soon as it is current, the guide is on, nothing else runs (no run
  status) and the player is alive; the beat's own line stays on screen while it runs (not its
  waiting text); the panel moves on when its steps are done. A stop, error or death leaves its
  status set, so it waits for Next like any beat. The Next glow and chime fire only when a beat
  that needs Next comes up (also after an auto beat ends). Every non-gear beat keeps its Next. The
  director is unchanged. Test: gear beats are `auto`, every other beat is not, and the classless
  script has none.
- **Doc**: `docs/guided-tutorial-current-state.md` (new "The gear" section, counts, resume rules,
  test pins, open items).

## What the guide now crafts per class (Clearing weapon; T1; T2-T4)

- **Striker** (79 gear beats, 164 total): Plain Sword; Broadblade + Plains set, Twin Fangs + Forest vest/boots, Cave Bastard Sword; T2-T4 each zone's vest/charm/boots (Plains charm again in the T2 Jungle) + Balanced's Broadblade/Twin Fangs/Bastard Sword (T2), Maul/Bastard Sword (T3), Maul/Reaper's Scythe/Bastard Sword (T4).
- **Squire** (74, 155): Plain Sword and Shield; Flanged Mace + Plains set, Forest set, Spiked Flail + Swamp vest/charm, Tower Shield + Cave vest/charm, Warhammer + Mountain vest; T2-T4 the route's zone pieces + Bulwark's Flanged Mace/Warhammer/Tower Shield (T2), Warhammer (T3, T4).
- **Apprentice** (36, 121): Plain Wand; Branching Wand + Plains set, Thornwood Rod + Forest set, Deep Grimoire, Runestone Staff + Mountain vest; T2 Branching Wand/Thornwood Rod/Runestone Staff + Plains and Forest sets, Jungle vest, Desert boots; T3/T4 Runestone Staff + Mountain set + Desert charm/boots (T4 also the Volcanic vest).
- **Slinger** (67, 152): Plain Pistol; Pepperbox + Plains set, Carbine + Forest set, Swamp set, Drum Gun + Cave set, Mountain vest; T2 Pepperbox/Carbine + Plains and Forest sets, then each zone's charm and boots; T3/T4 the Jungle Quickdraw vest and Carbine (detour before the Mountain), then each zone's charm and boots.
- **Spirit** (41, 126): Plain Rod; Forked Rod + Plains set, Forest set, Lodestone Orb, Summit Staff; T2 Forked Rod/Summit Staff + Plains and Forest sets, Jungle vest/boots, Desert boots; T3 Summit Staff + Mountain and Cave sets, Jungle charm/boots, Desert boots, Volcanic vest/charm; T4 Summit Staff + Mountain set, Tundra charm, Desert boots, Volcanic vest/charm.
- **Conduit** (46, 134): Plain Staff; Swarm Staff + Plains set, Swift Staff + Forest set, Swamp vest, Heavy Staff, Mountain vest; T2 the same three staves + Plains/Forest sets, Swamp/Mountain/Jungle vests, Jungle/Desert boots; T3 Ability Staff/Heavy Staff + Mountain set, Cave charm, Swamp/Jungle/Desert pieces; T4 Ability/Swift/Heavy Staff + Mountain set, Tundra charm, Desert boots, Volcanic and Trench vests.

## Checks

- `pnpm typecheck`: clean.
- `pnpm test -- tutorial`: 2/2 passed (`shared/src/tutorial/tutorial.test.ts`, `server/test/tutorialAnchors.test.ts`), before and after the follow-up.

## Not done, or unsure (PLACEHOLDER decisions, the conductor's or designer's call)

1. **Plans are a copy** of the routes as of this worktree (2026-10-16). Other agents retune routes
   tonight; reconcile `gearPlans.ts` when a route's gear changes (a comment says so).
2. **Line wording**: generated from the gear data (first sentence of the class line or weapon
   description); the boots line is a stock one; the T2-T4 default-weapon line is placeholder.
3. **Not replicated from the routes**: the Striker's late T2 Mountain seal (it fights it last, in
   the Mountain set again) and the Squire T1 route's seal sets (it fights both seals at the end):
   the guide fights each boss in its zone's turn, in the latest pieces. The Slinger's detours come
   after the Mountain's first farm (after the tier pointer), not before the trip there.
4. **Pacing**: 36-79 gear beats per class, now run without Next (follow-up). Never run live: the
   auto start in the panel is checked by typecheck only, not in a browser.
5. **Lesson-skip hazard**: a cut farm (e.g. a lesson beat) ends when the next piece can be made; if
   an earlier farm overshot and that piece is already affordable when the lesson comes up, the
   lesson beat is done at once and its line is skipped. Lower risk than a level gate; not seen;
   static check only.
6. **Opening unchanged**: a hand-played character who wears its class weapon but never made the
   club still waits on the club's farm beat (pre-existing; its craft and equip are now skipped).

## Files outside the brief I needed (not edited)

- None edited. Read only: `bot/src/routes/*T1-T4.ts` (gear source), `client/src/tutorial/director.ts`
  and `client/src/ui/crafting/makeEntries.ts` (craft path for class weapons and second bases: works
  unchanged).
