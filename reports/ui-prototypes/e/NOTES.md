# E — The beat strip

## 1. The thesis

The rhythm lives on one horizontal line directly under the health bar: the left rail's
Character panel on desktop, the phone's top strip on portrait. Each tick is one of your
next hits (one every 0.5 s), with a gold now-line. Hits slide in from the right and
scroll off to the left once they land. The hit that will fire the verb carries a diamond:
the left half is the moment's lane colour, the right half the payload's, and the payload
glyph sits above it. For a capped verb like Into the Wound the line shows *why* that hit
fires. A hatched band in the lane colour is the verb resting (its 5 s clock). An
underline is the condition ("the target is afflicted"). The diamond sits on the first
tick that has both. A fresh target's first hit is drawn dashed, and the underline starts
after it, so the line shows the unmet condition without any words.

There are no rings and no floating word (dropped). "It landed" is a burst on the strip at
the now-line, plus the body fx: the poison surges and keeps dripping, or shackles pin the
Ooze and it stops sloshing. The lasting state lives on the target's one badge.

Teaching happens on the strip itself. For a new card's first three firings the strip grows
a caption (name, three pips, the sentence) that flashes on each firing, then folds away
for good. Out of combat the same line shows the node: its shard sits at the left end like
a key signature, and its next pulls (the node's spawn order) line up to the right.

The page learns the strip's grammar first. Every Tier 1 verb card carries a small static
beat line of its moment.

## 2. What I would change in the client to ship it (files, not code)

- `client/src/hud/RhythmReadout.tsx`: replaced by a `BeatStrip.tsx` that draws the SVG
  line, the burst and the teaching caption. It stays subscribed to
  `hudBus.subscribeCardFired`, which drives the burst.
- `client/src/hud/rhythmReadoutModel.ts`: becomes `beatStripModel.ts`, pure data-in and
  data-out like today, deriving ticks, markers, the band, the condition underline and the
  seams. Its inputs:
  - the swing clock: attack speed from the stat projection, phase-locked to the player's
    own hit events (no new per-swing server field);
  - `ShowsRhythm`: `capUntil`, `count`, `armed`, `spentOn` (unchanged);
  - the attack target's statuses, from `targetFrameAtom`, for the underline;
  - kill events, for the seams.
- `client/src/hud/rhythmReadout.css`: becomes `beatStrip.css`.
- `client/src/hud/stat/StatPlate.tsx` and `client/src/hud/stat/StatPanel.tsx`: mount the
  strip under the crown's HP bar. `#rhythm-overlay` in `client/index.html` and its mount in
  `client/src/main.ts` go away.
- `client/src/hud/MobileHUD.tsx`:
  - the strip becomes the top strip's second row, replacing the right-edge ring column;
  - a **Gear** tab joins the bottom bar between Bag and Craft;
  - (designer's call) a docked guide card, which the real phone HUD lacks today.
- `client/src/hud/MenuButtons.tsx`: a **Gear** entry in the right rail, after Inventory.
- New `client/src/ui/gear/GearTab.tsx`: the worn items, weapon first; the weapon row opens
  `LineageTreePanel` and the plain items are inert.
- `client/src/ui/crafting/MakeTab.tsx`: unchanged. Clicking the equipped weapon in
  `InventoryPanel` can stay as a second door.
- `client/src/ui/lineage/LineageTreePanel.tsx`: a `CardBeat` line on Tier 1 verb cards that
  re-reads under the lean preview; the two-colour sentence.
- `client/src/ui/lineage/weaponPageModel.ts`: expose each verb's composition shape
  (`trigger`, `ringShape`, `needs`, moment and payload colours) and the moment/payload
  split of the sentence as data. The prototype finds the split by searching the sentence
  for the payload phrase.
- `client/src/ui/lineage/weaponPage.css`: beat-line and two-colour styles.
- `client/src/fx/cardWord.ts`: removed. No floating word. `notifyCardFired` moves to the
  combat event handler.
- `client/src/render/combatFx.ts`: the payload body fx carry "landed" alone, so the
  re-dose surge and drip and the root shackle and freeze must be strong.
- `client/src/hud/BuffBar.tsx`: `useReadoutBuffIds` goes. Lineage window tiles (Surge,
  Wake, Mend…) return to the buff bar as the lasting state; the strip only says coming and
  landed.
- `client/src/hud/targetStatusMeta.ts` and `client/src/hud/statusHelp.ts`: one Poison record
  under the one-DoT rule. Labels and help for any `lineage.*` id that survives.
- `client/src/hud/AreaInformation.tsx`: unchanged banner.
  `client/src/hud/areaInformationModel.ts` supplies the strip's key (`nodeShard`).
- Shared:
  - `shared/src/tutorial/anchors.ts`: `rhythmRing` becomes `beatStrip`;
  - `shared/src/tutorial/concepts.ts`: the `rhythm-ring` concept text;
  - `shared/src/tutorial/scripts/classScript.ts`: the `lesson.ring` line rewritten for the
    strip;
  - `client/src/tutorial/director.ts`: the anchor;
  - the node's spawn order exported to the client for the out-of-combat pull line.
- Server: `server/src/systems/combat/rhythmReadout.ts` and
  `shared/src/components/combat/showsRhythm.ts` need nothing new for the hit-grid moments.
  The one-DoT rule is a server change (the designer's).

## 3. What the thesis cannot show well

- **Moments that are not on the hit grid.** The Technique moment and the Empowered moment
  (the class mechanic) cannot be placed ahead. The strip can only stamp them when they
  happen; the reference panel shows Set Piece with a parked pulse mark. Kill and opener
  moments (Next Throat, Opening Lunge) get one swing of warning: the diamond waits parked
  at the right end with the `—` mark until the kill lands. For three of the seven moments
  the strip is a log, not a forecast.
- **An irregular swing clock.** The prediction assumes a steady cadence. The real Slinger's
  reload pause, stuns, walking between pulls, chaotic-axe whiffs and dodged hits all move
  the ticks. A strip whose diamond jumps loses trust. The combat rule here ignores the
  reload; shipping it would need the reload drawn as a gap (honest, but busier).
- **The frame loop's bank or window**, today's frame ring. A bank is a gauge, not a beat.
  It would need a second element or a gauge at the strip's end. Not drawn.
- **Several verbs on one line.** The one timeline is good for comparing cards, but two
  diamonds on the same tick stack. That case is untested.
- **Peripheral motion.** A line that scrolls at two ticks a second moves all the time at the
  edge of vision. The plain ticks are low-contrast so that only the diamond pops, but
  whether players find it calm or tiring needs a playtest. The alternative is stepping
  once per hit instead of scrolling.
- **Desktop size.** Under the rail's HP bar the strip is 220 px. It reads at 1280×720, but
  in a scaled-down iframe it is small, and anticipating a firing means glancing away from
  the bodies.
- **Teaching bends "no callouts".** The caption is text on the HUD for three firings, and
  once more after a lean swap changes the verb's sentence (scene 3b). It is attached to the
  strip, never over the world, but it is text.
- **The page's beat lines have no legend.** Before the first fight, a first-time reader may
  not decode the diamond and the band. The HUD caption teaches them later.
- **The pull line gives one widget two meanings** (pulls out of combat, hits in combat). It
  also relies on the node's spawn order being what the server spawns next.

## 4. Card-related facts on screen, per scene and key frame

How I counted: every element that carries one fact by SCENES.md's definition is tagged in
the page, and `window.__countFacts()` counts the ones on screen at the key frame. Open
`index.html#scene=N&view=…&kf=…` and call it from the console to reproduce.

- The same fact in two places counts twice.
- Dimmed content under a dialog's backdrop is not counted.
- Not counted: bodies, kill seams, HP, plain-item stats and client chrome (titles, buttons,
  "Open page ›").
- Each material line counts as name + held + where.
- Strip states: each band, condition underline, upcoming diamond, fired diamond and burst
  counts 1. The strip key (the node's shard) counts as a shard fact.

| Scene · key frame | Desktop | Portrait |
|---|---|---|
| **1** · Gear tab open, before the press | **7**: strip key 1, guide line 1, Materials chips (Rot 95, Venom 9, Shackle 4, Bone 2) 4, Gear row "Coated Edge" chip 1 | **1**: Gear sheet "Coated Edge" chip (the top strip and guide sit under the sheet's backdrop) |
| **2** · page as it opens | **69**: lane chips 3, row questions 3, "active" tag 1, names 9, sentences 9, cost chips 16, requirements 8, notes 2, card beat lines 3, sheet note 1, materials 14 (5 names, 5 counts, 4 where-lines) | **31**: lane chips 3, row questions 2, active 1, names 5, sentences 5, costs 8, requirements 4, note 1, beat lines 2 |
| **3a** pure · coming (0.4 s before the clock clears, the target afflicted) | **10**: strip key, band, underline, diamond (with glyph), Venom drop from the dead Ooze, Poison badge; materials 4 | **6**: drop, key, band, underline, diamond, badge |
| **3a** · landed | **10**: key, band, underline, fired diamond, burst, Poison badge (number jumps); materials 4 | **6** |
| **3a** · lasting (+1 s) | **9**: key, band, underline, fired diamond scrolling off, badge; materials 4 | **5** |
| **3b** composed · coming | **11**: key, band, underline, two-colour diamond, drop, badges Poison + Hamstrung 2; materials 4 | **7** |
| **3b** · landed | **13**: key, band, underline, fired diamond, burst, drop, badges Poison + Hamstrung + Bound 3; materials 4 | **9** |
| **3b** · lasting | **11**: key, band, underline, fired diamond, badges 3; materials 4 | **7** |
| **4** · firing #1 | **15**: caption name 1, caption pips 1, caption sentence 1, key, band, underline, fired diamond, burst, Poison badge, guide read line 1, guide strip line `[COPY]` 1; materials 4 | **11** (no materials panel) |
| **4** · firing #3 | **15** (same set; three pips filled) | **11** |
| **4** · firing #4 | **10**: key, band, underline, fired diamond, burst, badge; materials 4. Caption gone, guide closed | **6** |
| **5** · 1 s after arriving, before any kill | **6**: strip key 1, banner line "Mire territory · every kill here drops Venom Shards" 1; materials 4 | **2**: key, banner line |

Not in the key frames:

- 3b's once-caption (name + two-colour sentence, +2) shows at its first firing (about 0.5 s
  into the loop).
- Hovering the strip (desktop) or tapping it (phone) shows a tooltip with the name and the
  sentence (+2).
- The full page, scrolled, adds the Tier 2 verb and amplifier rows and the gate.

Duplication worth noting: on desktop the Venom Shard is on screen up to four times at once
(strip key, materials chip, banner, and a drop when something dies).

## 5. Assumptions (the designer's to make)

- **The one-DoT rule.** One Poison record per weapon. The lean's light bleed and the verb's
  re-dose feed it, and the badge shows what is still owed. Card sentences are the export's.
- **No lean ranks.** With ranks, Tier 1's six steps would read as the form header, then a
  lean row whose cards carry three rank pips (I–III) and the next rank's cost chip
  (all `[n]`), then the verb row, then the gate. The strip and the card beat lines would not
  change: ranks change the payload's size, not the rhythm.
- **No crossroads node.** The real blends are used, and the pull line shows them as they
  are: a line of Oozes in Blackwater Crown, a mixed line in Sunkroot Bog.
- **The Gear tab's home:** right-rail nav after Inventory on desktop; bottom bar between Bag
  and Craft on portrait. It reuses the retired Upgrade tab's icon
  (`concept-icons/menu/upgrade.png`) until it has its own.
- **A guide card on portrait** (scenes 1 and 4). The real phone HUD has no guide.
- **The strip's predictions use only what the client already knows:** the swing clock, the
  cap clock, the target's statuses and kill events. It never predicts a kill. It shows the
  next pulls from the node's spawn order (`spawnCycle`).
- **The floating word is dropped.** A kill pops the node's shard from the body (no amount;
  the export has none).
- **The SCENES.md combat rule** (illustrative, not the server's DoT formula), with three
  additions of mine:
  - ooze hits are a flat 10, ignoring 2% DR;
  - the scene 4 Slinger refills at Recovery 12.5/s between pulls;
  - a new pair of Oozes walks in after each pull.
- **A lean swap that changes the verb's sentence re-captions its next firing once** (scene
  3b).

## 6. Placeholders

- `[COPY — NOT IN EXPORT]` in the guide (scene 4): "The diamond on the line under your
  health bar is the hit Into the Wound will land on." The export's `lesson.ring` line and
  the `rhythm-ring` concept describe a ring, which this thesis does not have, so the strip
  needs its own line.
- No `[n]` numbers were needed. Gaps in the export, shown honestly:
  - the biome XP bar has no progress number (drawn empty);
  - Rot essence has no icon (a plain purple swatch);
  - the Toadeater Gland uses the Swamp boss sprite;
  - Mud Toad has no art (`null`), so it is a plain olive blob with eyes.
- Client chrome not from the export: "Gear", "Worn items", "Plain item · no page", "Open
  page ›", "Weapon page", "Preview", the slot names and the Evasion label. The banner's
  eyebrow ("Discovery") is the export's arrival kind.

## 7. Readable with the sound off?

1. **Yes.** The guide line says what to do. The guide rings the Gear entry. The dagger is the
   one gold, pressable row, and the plain items say they have no page.
2. **Yes.** Every fact is text from the export, and the verb's rhythm is drawn too. Partly
   for the beat lines on first sight, since they have no legend.
3. **Yes.** Coming: a diamond travels to the now-line, which turns the lane colour. Landed:
   a burst on the line, the Ooze's green surge with a heavier drip (3a), or shackles with
   the Ooze frozen (3b). Lasting: the Poison number, the Bound sweep, the drip and the
   shackles. No damage number is needed.
4. **Yes.** The caption and its pips are text and shape, and the end of teaching is visible
   (the caption folds, the guide closes).
5. **Yes for the shard, partly for the family.** The banner names both and the strip's key
   keeps the shard after the banner fades. The pull line shows the family only as bodies
   (Oozes), so naming it needs the banner or the map tile.

## Files

- `index.html`: the prototype. Opens on scene 1 and follows the SCENES.md hash contract,
  plus optional `kf=` (`gear`, `coming`/`landed`/`lasting`, `1`–`4`, `arrive`),
  `pair=composed` and `node=`, used for the key frames.
- **Strip shapes** in the toolbar opens the reference panel: the same strip for cap (Into the
  Wound), count (Chopping Rhythm), latch-body (Opening Lunge), carry (Next Throat with
  Coated Edge, two colours) and pulse (Set Piece, where the thesis breaks).
