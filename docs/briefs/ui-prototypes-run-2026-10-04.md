# UI prototypes run — brief (2026-10-04, overnight)

**Status:** DONE 2026-10-05 on `design/ui-prototypes` (not merged). Report:
[ui-prototypes-report-2026-10-04.md](ui-prototypes-report-2026-10-04.md); comparison page:
`reports/ui-prototypes/index.html`. This brief is now evidence of what the run was asked to do.

Five interactive HTML prototypes of the lineage UI, each built from a different design
thesis, plus one comparison page. The designer picks one in the morning and reuses
elements from the others. **Nothing in this run touches game code.** It produces files
under `reports/ui-prototypes/` and this brief's report, and nothing else.

**Conductor: Fable**, in `../mmo-lin-w2c`: `pwd` and `git status` first (clean, on
`feat/verbs-that-fire`, merged), then `git checkout -b design/ui-prototypes develop`.
**Builders: five Opus subagents**, one prototype each, all working in the conductor's
worktree in their own folder (`reports/ui-prototypes/a/` … `e/`). Builders never run git,
never touch a file outside their folder, never install anything. The conductor commits.
No push. Strip CR only on files you create.

Read first: design §24 whole (§24.1, §24.2, §24.6, §24.9), the playtest-2 notes below,
`docs/lineages-current-state.md` §3a, §13, the first-hour checklist in
`docs/guided-tutorial-plan.md`, the legibility mockup
(https://claude.ai/artifact/2z1c6vx4hM17Djt7iLAjQY, the designer's starting point) and
the files the prototypes replace, read-only:
`client/src/ui/lineage/LineageTreePanel.tsx`, `weaponPageModel.ts`, `weaponPage.css`,
`client/src/hud/RhythmReadout.tsx`, `rhythmReadoutModel.ts`, `BuffBar.tsx`,
`targetStatusMeta.ts`, `statusHelp.ts`, `client/src/fx/cardWord.ts`,
`client/src/ui/crafting/MakeTab.tsx`, `client/src/hud/MobileHUD.tsx`.

## The playtest-2 notes (the designer's, 2026-10-04)

The verbs fire and the system works as intended. The problems are information design:
the UI is clear but overloaded; the top-left proc icons are extra bloat; the callouts are
over the top; lineage debuffs have no icon or id the player can read; the Poison Dagger
with the Affliction pair runs three damage-over-time records on one target; the trees
should be reached from a tab, not by clicking the item; with the +N ladder gone T1 has
three steps where it had six; zones do not feel different because every node fields all
three families at some share. The designer wants a slower approach: find the UI players
will actually like, not the first one that works.

## What every prototype must contain

The same **five scenes**, so the comparison is fair, each at **desktop (1280 wide) and
portrait phone (390 wide)**, each with a **"first-time player" toggle** that overlays what
the eye should land on first, second, third, and nothing else:

1. **Finding the tree.** Where the player goes to see their cards. Today: click the
   equipped weapon. The mockup proposes a Gear tab. The thesis decides.
2. **The weapon page.** The Poison Dagger at Tier 1: lean row, verb row, the locked T2
   row, the gate. Real sentences from the data export. The thesis may show lean ranks
   (mockup rule 1) or not; if not, say how six steps per tier would read.
3. **A fight, verb about to fire and then firing.** The Affliction pure pair on the Dagger
   against two oozes. Three facts to place: the verb is coming, the verb landed, the
   lasting state on the target. Then the same with a composed pair (Control lean, Affliction
   verb) so the two-colour sentence is visible somewhere.
4. **A new card's first firings.** What teaches the player what just happened, and when it
   stops teaching.
5. **The node.** Arriving in a Swamp node: what tells the player which family lives here and
   which shard it pays, before the first kill.

Every prototype is **data-driven from the same export** (below), never hand-typed
sentences, so a change to a card's text would flow into all five.

## The five theses (one builder each; do not blend them)

- **A — Nothing but the ring.** The HUD shows one ring per active verb and nothing else
  about cards. Every other fact lives on the page or the target. Teaching is one transient
  line of text, three times, then never. The bet: the body fx alone carry the payoff.
- **B — The card is the HUD.** The active lean and verb sit on the HUD as two small cards
  that light when they fire; no rings. The sentence the player bought is always on screen.
  The bet: players read the thing they chose, not an abstraction of it.
- **C — Body first, book second.** No HUD element for cards at all. Anticipation and payoff
  are in the world: the weapon's glow builds, the ground marks, the target's badge grows.
  The page is a book the player opens from a tab. The bet: §24.1 taken literally.
- **D — The dense sidebar.** A classic MMO side panel (the Tibia direction in
  `docs/future-plans.md`), always visible on desktop, a drawer on portrait: cards, their
  state, the target's effects, the node's shard, in one ordered column. The bet: density is
  fine when it is ordered and never moves.
- **E — The beat strip.** A horizontal strip near the HP bar showing the next few hits as
  ticks, the one that fires the verb marked, the lane colour on it; fired hits scroll off.
  No rings, no callouts. The bet: rhythm reads better as a line than a circle.

Each thesis also answers the three structural questions the same way everyone must:
the trees are reached from a **Gear tab** that lists the worn items (the designer's call,
mockup rule 1); the target shows **one badge per damage-over-time record** with an icon
(mockup rule 3 assumes one record per weapon; prototype that state); the node banner
names the **family and the shard** (mockup rule 4).

## Order

1. **Conductor, before the builders start:**
   - Write `server/scripts/_uiProtoExport.ts` (underscore: skipped by the test runner),
     run it once, commit `reports/ui-prototypes/data.json`: the five T1 weapons' pages as
     `weaponPageModel` renders them (rows, cards, lane, generated sentence, cost, gate),
     every lineage status id with whatever label/icon/help it has today (from
     `targetStatusMeta.ts`, `statusHelp.ts`), the T1 node blends with family rosters and
     the node shard, the five tutorial picks. Read-only on the game; one new script.
   - Write `reports/ui-prototypes/SCENES.md`: the five scenes as a checklist with the exact
     game state for each (HP, target, cards owned, wallet) so the five builds show the
     same moment.
   - Launch the five builders in parallel with the thesis letter, the scenes file, the
     data file, and the read-only file list above.
2. **Builders:** one self-contained `index.html` per folder (inline CSS and JS, the data
   inlined or fetched relatively; no external scripts beyond the usual CDN allowlist; both
   themes not needed, the game is dark), opening on scene 1 with a scene switcher, a
   desktop/portrait switcher and the first-time toggle. Real interaction where the scene
   has it: buy a card, land hits, fire the verb, arrive at a node. A `NOTES.md` beside it:
   the thesis in one paragraph, what the builder would change in the client to ship it
   (files, not code), what the thesis cannot show well, and the count of card-related
   facts on screen per scene.
3. **Conductor, after:**
   - `reports/ui-prototypes/index.html`: the comparison page. Every scene from every
     prototype side by side as live iframes (relative paths) with the thesis under each,
     and a matrix: facts on screen per scene, readable with sound off (yes/partly/no, with
     why), portrait fit, client files touched, and one line of critique per prototype from
     the conductor, written as a reviewer, not a builder.
   - The report `docs/briefs/ui-prototypes-report-2026-10-04.md`: how to open the
     comparison page, the matrix, the critique, elements worth reusing across theses, and
     what no thesis solved.
   - Commit everything on `design/ui-prototypes`. Do not merge.

## Rules

- No client, server or shared code changes. The export script is the one new file outside
  `reports/` and `docs/`.
- No design decisions dressed as prototypes: lean ranks, the one-DoT rule, the crossroads
  node are the designer's; where a prototype assumes one, its NOTES.md says so.
- No flavour text on cards. One sentence per card, from the data.
- Names, numbers and sentences come from the export; a builder who needs a number the
  export lacks uses a visible placeholder (`[n]`) and lists it in NOTES.md.
- Builders do not read each other's folders; the conductor compares.
