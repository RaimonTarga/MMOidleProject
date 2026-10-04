# UI prototypes run — report (2026-10-04)

**Status:** COMPLETE 2026-10-05, on `design/ui-prototypes` in `../mmo-lin-w2c` (branched
from develop `69138bdb`), not merged, not pushed. No game code changed. Brief:
[ui-prototypes-run-2026-10-04.md](ui-prototypes-run-2026-10-04.md).

Five interactive HTML prototypes of the lineage UI, each built by one Opus builder from one
design thesis, against the same five scenes and the same data export, plus a comparison page.
The designer picks one and reuses elements from the others. This report is the reviewer's
read of them: the conductor built none of the prototypes and wrote it as a reviewer, not a
builder.

## How to open the comparison page

Open `reports/ui-prototypes/index.html` in Chrome or Edge, straight from disk. It needs no
server and no install: every prototype loads `../data.js` with a script tag, not a fetch,
and its art from the repo by relative path. A local server works too: from the repo root,
`python -m http.server 8080`, then `http://localhost:8080/reports/ui-prototypes/`.

- The toolbar picks the **scene** (1–5), the **view** (desktop 1280 / portrait 390), the
  **first-time overlay** (each prototype numbers what the eye should land on first, second,
  third) and the number of **columns**. The state is kept in the URL hash, so a view can be
  linked.
- Each frame is the prototype itself, live, in `embed` mode: it plays the scene on a loop.
  **Open interactive ↗** opens it with its own scene, view and first-time controls and its
  real interactions: open the page from the Gear tab, buy Into the Wound, press a short
  card, preview a lean, land hits, switch pure and composed, step through firings, arrive
  at a node.
- Each prototype's `NOTES.md` sits beside it (`reports/ui-prototypes/<x>/NOTES.md`): its
  thesis, the client files it would change, what it cannot show, its fact count per key
  frame, its assumptions, its placeholders and its sound-off verdicts.

## What was built

| | Thesis | Folder |
|---|---|---|
| **A** | **Nothing but the ring.** One ring per active verb on the HUD, nothing else about cards; teaching is one transient line, three times, then never. | [`a/`](../../reports/ui-prototypes/a/) |
| **B** | **The card is the HUD.** The active lean and verb sit on the HUD as two small cards that light when they fire; the sentence is always on screen. | [`b/`](../../reports/ui-prototypes/b/) |
| **C** | **Body first, book second.** No HUD element for cards at all: blade glow, ground mark, a badge on the target; the page is a book opened from a tab. | [`c/`](../../reports/ui-prototypes/c/) |
| **D** | **The dense sidebar.** One ordered column, always visible on desktop, a drawer on the phone: you, weapon, target, here, purse. | [`d/`](../../reports/ui-prototypes/d/) |
| **E** | **The beat strip.** A strip by the HP bar showing the next hits as ticks, the one that fires the verb marked; no rings, no callouts. | [`e/`](../../reports/ui-prototypes/e/) |

The rest of the run's output:

- **The data export**, `server/scripts/_uiProtoExport.ts`, the run's one new file outside
  `reports/` and `docs/`. It is read-only on the game and was run once.
  `reports/ui-prototypes/data.json` (and `data.js`, the same object as a script global)
  holds:
  - the five T1 weapon pages exactly as `weaponPageModel` renders them;
  - the Poison Dagger in its three scene states;
  - every verb × lean sentence with its caveat, ring shape and colours;
  - every lineage status id with the label, icon and help it has today;
  - the T1 node blends, family rosters and banner lines;
  - the tutorial picks and guide lines, and the toasts.

  No card `description` is exported, so no prototype could render flavour text.
- **`reports/ui-prototypes/SCENES.md`**: the five scenes as a checklist with the exact
  game state, a shared illustrative combat rule (so the five fights move alike), the
  URL-hash contract and the NOTES.md spec.

All five builds load and loop with no console errors at both views. The conductor
re-screenshotted every scene × view × (plain, first-time, embed) in Chromium itself, rather
than trusting the builders' reports. That review sent back three fixes:
- A logged NaN errors when driven from scene 4 to scene 5 by hash;
- A and D kept the "needs a slow" caveat on Easy Prey while Tendon Cut was previewed (the
  caveat must re-read with the lean, like the sentence).

All three are fixed.

## The matrix

Card-related facts on screen at each scene's key frames, **desktop / portrait**, as each
builder counted them, every occurrence counted. Scene 3 is coming·landed·lasting for the
pure pair, then the composed pair; scene 4 is firing #1 → firing #4. The counts are not
perfectly comparable: B, D and E keep the client's shard counts on the desktop HUD (4–5
facts in every frame), while A and C took them off.

| | 1 Finding the tree | 2 The page | 3 A fight (pure · composed) | 4 First firings | 5 The node |
|---|---|---|---|---|---|
| **A** ring | 7 / 5 | 81 / 41 | 5·7·6 · 8·8·9 / 4·6·5 · 7·7·8 | 10→6 / 9→5 | 6 / 5 |
| **B** cards | 10 / 10 | 58 / 28 | 13·16·13 · 15·19·17 / 9·12·9 · 11·15·13 | 21→16 / 17→12 | 14 / 10 |
| **C** body | 4 / 3 | 57 / 33 (118 whole page) | 6·5·5 · 9·9·9 / 5·4·4 · 8·8·8 | 8→5 / 7→4 | 3 / 2 |
| **D** sidebar | 14 / 4 | 72 / 42 | 13·13·13 · 14·15·15 / 5·5·5 · 6·7·7 | 14→13 / 6→5 | 13 / 5 |
| **E** strip | 7 / 1 | 69 / 31 | 10·10·9 · 11·13·11 / 6·6·5 · 7·9·7 | 15→10 / 11→6 | 6 / 2 |

**Readable with the sound off**: the reviewer's verdict, desktop / phone. Can the scene's
facts be read from the picture alone? Scenes 1 and 2 are text in every prototype (yes / yes
for all five) and are left out.

| | 3 A fight | 4 First firings | 5 The node |
|---|---|---|---|
| **A** | yes / partly: ring with a "coming" state, strong re-dose and root fx; the phone fx need the assumed 0.72 camera | partly / partly: nothing names the card after #3 | partly / partly: banner for 5 s, then only the shard off each kill |
| **B** | partly / partly: "coming" is a fuse on a card at the screen edge; ✦ rarely shows | yes / yes: the card rises with a thread to the body, then keeps its name and sentence | partly / partly: banner, plus the cards of the node's shard glint |
| **C** | partly / partly: landed and lasting read; "coming" is a blade glow a few px wide | partly / partly: the body shows that something fired, not which card | partly / partly: banner, plus shard crystals in the ground (assumed art) |
| **D** | yes / partly: fixed homes read, but the clock is 27 px and 350–450 px from the bodies; the phone spine has no words | yes / partly | yes / partly: a permanent Here section (territory, shard, roster shares) |
| **E** | partly / yes: the only one that marks *which* hit fires; tiny on desktop, excellent on the phone | partly / partly: a caption for #1–#3, then nothing names the card | partly / partly: banner, plus the node's spawn order as silhouettes |

**Portrait fit and cost**

| | Portrait fit | Client files touched (NOTES.md §2) |
|---|---|---|
| **A** | **good**: one 48 px ring; the body fx need a fight camera of 0.72, against the client's 0.4 floor | ≈22 (2 new) |
| **B** | **tight**: the hand is 107 px, ~24% of the screen with the tab bar; no room for a third card or the frame ring | ≈22 (3 new) |
| **C** | **good**: nothing on the HUD, but the thesis rests on a fight camera of 1.0 | ≈29 (6 new) + art |
| **D** | **poor**: closed, a 46 px icon spine without words; open, a drawer over the fight | ≈26 (4 new) |
| **E** | **good**: the strip as the top bar's second row, the best phone home any thesis found | ≈24 (2 new) |

All five also need the server half of the one-DoT rule (`leanConditions.ts`,
`lineageCards.ts`: the lean bleed and the re-dose feed the weapon's own record), which no
one counted.

## The critique

One line per prototype, as a reviewer:

- **A, the ring.** The quietest fight of the five (2–3 card facts on the HUD) and the
  nearest to §24.6 as written. It gets there by forgetting: after the third firing
  nothing names the card, the lean has no presence in a fight, and on a phone it only works
  with a camera change the thesis does not own. Its desktop ring sits top-left of the
  field, where the proc icons were, not by the HP bar.
- **B, the cards.** The only design where the player always reads what they bought, and
  the best teaching moment of the five: the card rising with a thread to the body. But the
  sentence becomes wallpaper by the second minute. The hand costs a quarter of a phone with
  no room to grow, and its "coming" signal sits at the screen edge, away from the fight.
- **C, the body.** The best weapon page: its "In the fight" plate teaches the world's
  visual vocabulary. It also has the cleanest HUD. It is the thesis most at the mercy of
  sprite size, needs a new phone camera to work at all, and cannot say which card is
  talking once a second verb, a frame window or an amplifier shares the blade.
- **D, the sidebar.** The most information with the least motion on desktop. Its Target
  section (owes, slowed, held: three fixed homes) is the best answer to the debuff
  complaint, and its page (one row per card) is the most compact. But it is the overload
  the designer complained about, made tidy. 12 card facts sit on the HUD from the first
  minute, and on a phone the thesis collapses into an icon spine or a drawer over the fight.
- **E, the strip.** The only design that tells the player *which* hit will fire, and the
  best phone placement of the five. But it forecasts only hit-grid moments. The
  class-mechanic verb that the Striker and the Squire are taught (Cleaving Blow) is a log
  on the strip, not a forecast. It trusts a swing clock that the real Slinger's reload
  breaks, and on desktop it is a 220 px strip in the corner of the eye.

### If the reviewer had to pick

**A as the base, because it is the only thesis that answers "overloaded" without a new
system.** The ring already exists (`RhythmReadout`). Combat carries 2–3 card facts. The
designer's own mockup (rule 2) is this thesis. Fix its two honest holes with elements the
others proved:

1. **Placement.** Put the ring where E put the strip: by the HP bar, in the top bar's
   second row on the phone. Not top-left of the field.
2. **Teaching.** Use B's thread from the ring to the body on firings #1–#3, counted only
   when the fight was on screen (A's rule).
3. **The target.** Use D's Target section as the target frame: three fixed homes (owes /
   slowed / held), one Poison badge whose number is damage still owed.
4. **The page.** Take C's plate, D's compact rows, and A's and E's mark of the moment on
   every verb card.
5. **The node.** Use D's permanent territory line, and B's glint of the cards whose shard
   the node pays.

**E is the real alternative.** It is the one genuinely new idea in the five, a forecast of
the firing hit. If the designer values knowing *when* over a quiet screen, take E. The
price is that mechanic, Technique, kill and opener moments become a log, and that two of
the six tutorial picks ride the mechanic moment.

The reviewer would not take B or D whole: both re-create the density the playtest
complained about. C is the purest reading of §24.1, but on today's camera it is a bet on
sprites the game does not yet draw large enough.

## Worth reusing across theses

- **The two-colour sentence**: the moment half in the verb's lane colour, the payload half
  in the lean's. All five built it, and all five had to split the generated string to do
  it. Ship the halves from shared (`composedSentence` parts), never parse text.
- **B's teaching thread**: on firings #1–#3 the HUD element sends a line to the body it hit,
  then stops. A's rule: a firing counts toward the three only if the fight was on screen.
- **C's "In the fight" plate**: the active pair drawn on the page with the world's own glow,
  mark and badge, re-reading under the lean preview.
- **E's beat line on verb cards**: the page teaches the HUD element's grammar before the
  fight. It works for a ring (A did the same with a ring mark) as well as a strip.
- **D's Target section**: three fixed homes (owes / slowed / held) for a target's card-caused
  state, never reflowing. This is what the one-DoT rule's target frame should look like.
- **D's compact page**: one row per card, so Tier 1, a collapsed Tier 2 and the gate fit on
  one screen.
- **A's "coming" state**: the last second of a cap clock brightens and pulses. B found why
  it matters: with a 500 ms swing and a 5 s cap, the moment fires on the first swing after
  the cap clears, so the ✦ ready state almost never shows. The clock *is* the forecast.
- **E's phone placement**: the rhythm element as the top bar's second row, beside the HP bar.
- **Node identity**: D's permanent territory line; B's glint of the cards whose shard this
  node pays; E's spawn-order silhouettes before the first pull. C's crystals in the ground
  need art.
- **A phone lean preview**: a ◉ Preview toggle with a pinned diff bar (A, C, D), since a phone
  has no hover.
- **A Gear-row badge**: "N cards you can buy" on the weapon row (C, D).

## What no thesis solved

- **The lean in a fight.** No thesis gives the lean a combat presence beyond a status.
  Coated Edge folds into the Poison badge, Tendon Cut is a slow badge, and Silent Step
  (+11 move speed) shows nowhere. Whether a stat card needs a combat presence at all is
  open.
- **A conditional verb that is ready but cannot fire.** Into the Wound needs an afflicted
  target, and Easy Prey with no slow never fires. Every thesis shows "ready" the same way
  whether or not the condition holds; only the page's caveat says why nothing happens.
  E's condition underline comes closest.
- **Moments off the hit grid.** A class-mechanic, Technique, kill or opener moment cannot
  be forecast, only stamped. Two of the six tutorial picks (Striker and Squire, Cleaving
  Blow) are mechanic moments.
- **More than one verb.** Nobody prototyped a T2 amplifier, the frame ring and a verb
  together, and each thesis breaks there differently:
  - A's rings are unnamed;
  - B's hand has no room;
  - C cannot say which card is talking;
  - D's rows and E's strips multiply.
- **Nodes that look alike.** After the banner, only D keeps the family on screen. No UI
  makes Sunkroot Bog (34/33/33) feel different from Blackwater Crown (70/20/10); that is
  the roster rule's job (mockup rule 4), the designer's call.
- **Phones need a camera decision.** Every body-first payoff (A, C, and the fx in all
  five) is too small at the client's 0.4 zoom floor, where a 64 px body draws at about
  26 px. A assumed 0.72 and C 1.0.
- **Memory.** Nothing records what fired while the player was not watching, which in an
  idle game is most of the time.
- **Teaching state.** "The first three firings of a new card" needs a persisted
  per-character counter. The tutorial's verb lesson (`lesson.ring`, concept `rhythm-ring`)
  names a ring, so every non-ring thesis shows it as a placeholder and needs new copy in
  `shared/src/tutorial/`.

## The designer's calls the prototypes lean on

- **The one-DoT rule** (mockup rule 3). All five assumed it, and all five are better for it:
  one Poison badge whose number is damage still owed. The card sentences in the export still
  describe today's separate light bleed and heavy re-dose. They must change with the rule.
- **Lean ranks** (mockup rule 1). No prototype showed them. All five describe the same
  reading: rank pips on the lean card, the sentence's number growing per rank, the next
  rank's cost in its cost line. None needs a HUD change; ranks are a page question only.
- **The roster rule and the crossroads node** (mockup rule 4). Not assumed; every node scene
  uses the real blends.
- **A phone fight camera** above 0.4 (A, C).
- **A guide card on the phone** (A, B, C, D, E). Today `TutorialPanel` mounts only in the
  desktop right rail.

## Findings about today's client

The builders surfaced these while reading the code; each is true of develop today:

- **The three lineage DoT ids have no readable label.** `lineage.lean-bleed`,
  `lineage.hemorrhage` and `lineage.poison` have no entry in `targetStatusMeta.ts`, so the
  target frame prints the prettified id ("Lineage.Lean Bleed"), in the fallback colour, with
  no icon and no help (`data.json` → `statuses.target`, `metaIsFallback: true`). This is the
  playtest's "lineage debuffs have no icon or id the player can read", confirmed.
- **Card-caused slow and root borrow ability names.** The Control lean's slow and the root
  payload use `ability-slowed` / `ability-rooted`, which render as "Hamstrung" and "Bound".
  Their help text names the Hamstring and Binding Strike abilities, which the player may not
  have (C, D).
- **The ✦ ready mark almost never shows** for a 5 s cap on a 500 ms swing (B). The moment
  fires on the first swing after the cap clears, so the readout reads a clock, then a flash.
- **The phone camera floor of 0.4** draws a 64 px body at about 26 px (A, C).
- **The Make tab's Tier 2+ note** still says to open trees "from the matching slot in your
  Equipment panel" (B, C).

## The conductor's own errors and the export's gaps

- **SCENES.md scene 5** calls Blackwater Crown "the Slinger's first ever Swamp node", while
  the shared state has the Slinger already holding Venom-paid cards. B flagged it; the
  builders used the arrival kind `discovery` anyway.
- **SCENES.md scene 2** says nothing on the Slinger's stat sheet moves for any lean. Silent
  Step moves speed 157 → 169. The export was right, and every prototype used the export.
- **The export has no page state for buying Tendon Cut before Into the Wound**, so A, B, C and
  D show a labelled prototype note or a preview there instead of a purchase.
- **The export has no shards-per-kill amount** (D shows `+[n]`) and no danger label for the
  arrival banner (A, D omit it).
- **The shared combat rule kills Ooze A at about 4 s**, so scene 3's later key frames land on
  Ooze B (E).
- **Fact counts are self-reported**, with different inclusions (the shard strip). Read them
  as orders of magnitude between theses, not to the unit.

## Files and commits

On `design/ui-prototypes` (not merged, not pushed):

- `d3749472` — the export script, `data.json` / `data.js` and `SCENES.md`.
- The next commit: the five prototypes (`reports/ui-prototypes/a/` … `e/`, each `index.html`
  + `NOTES.md`), the comparison page `reports/ui-prototypes/index.html`, this report, its
  line in `docs/README.md` and the brief's status line.

Rules kept: no client, server or shared code changed; one new script (underscore-prefixed,
skipped by the test runner); no install, no push, no merge; builders never ran git and wrote
only in their own folders; every file created is LF.
