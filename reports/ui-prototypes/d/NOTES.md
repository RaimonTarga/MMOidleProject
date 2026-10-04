# D — The dense sidebar

Open `index.html` (scene 1, desktop). Hash contract: `#scene=1..5&view=desktop|portrait&first=0|1&embed=0|1`.
Extra toolbar toggle **Slots** outlines the column's fixed homes (not part of the hash contract).

## 1. The thesis

A classic MMO side column (the Tibia direction in `docs/future-plans.md` §2), always on screen
on desktop and a drawer on the phone. It holds everything about the cards in five sections
whose order never changes and whose rows never change height: **I You** (health) ·
**II Weapon** (the form, the lean row, the verb row with the verb's clock at its right) ·
**III Target** (three fixed homes: what it *owes*, how it is *slowed*, how it is *held*) ·
**IV Here** (the node's map label: territory and shard, with the real roster and shares) ·
**V Purse** (shards, essence, capstones, the node's shard marked). Read top to bottom it is a
sentence: *you, wielding this, do that to it, here, for this.* Nothing reflows when a verb
fires or a badge appears: an empty verb slot is as tall as a full one, an absent slow keeps its
ghost home, so the eye learns where each fact lives and in a fight only a few cells move
(measured: 2–4 card cells per second in auto-play, 5–8 at a firing or a kill). The page uses
the same row grammar as the column (lane bar · name · sentence · cost · state), so learning
one is learning the other. The world keeps only the body fx; the floating word is dropped,
because the column already names the card that fired.

## 2. What I would change in the client to ship it (files, not code)

- `client/index.html` — keep the 260 px left rail; retire `#rhythm-overlay` and the desktop
  `#target-frame-overlay` (both move into the column).
- `client/src/hud/HUD.tsx` (`LeftSidebar`) — mount the column under the character plate;
  Combat log and Bestiary collapse to headers below it (or move to the right rail).
- **New** `client/src/hud/column/` (`LineageColumn.tsx`, `columnModel.ts`, `column.css`) — the
  Weapon / Target / Here / Purse sections, fixed heights, the spine and the drawer.
- `client/src/hud/stat/StatPanel.tsx`, `StatPlate.tsx` — section I is the existing plate's
  crown (name, HP, DPS line); the expanded details stay behind the disclosure.
- `client/src/hud/RhythmReadout.tsx`, `rhythmReadoutModel.ts` — keep `deriveRhythmRings`, render
  the ring inside the verb row instead of an overlay; the compact mobile readout moves into the
  spine. `readoutBuffIds` keeps filtering the buff bar.
- `client/src/hud/TargetFrame.tsx`, `targetFrame.css` — the target frame becomes section III
  with three fixed homes instead of a wrapping tile strip.
- `client/src/hud/targetStatusMeta.ts`, `client/src/hud/statusHelp.ts` — under the one-DoT rule
  the lean bleed and the re-dose feed the weapon's `Poison` record, so `lineage.lean-bleed` /
  `lineage.hemorrhage` stop rendering their fallback ids; `ability-slowed` / `ability-rooted`
  need card-aware labels and help (today "Hamstrung"/"Bound" whose help names the Hamstring and
  Binding Strike abilities; the prototype shows the export's prettified "Slowed"/"Rooted").
- `client/src/hud/BuffBar.tsx` — unchanged (the player's own statuses).
- `client/src/fx/cardWord.ts` — stop drawing the floating word; keep
  `hudBus.notifyCardFired`, which now lights the verb row.
- `client/src/hud/MaterialsPanel.tsx` — absorbed into section V; removed from the right rail.
- `client/src/hud/MenuButtons.tsx` — add the **Gear** nav entry (where the Upgrade entry was,
  beside Crafting) with an "affordable card" badge; drop `MaterialsPanel`.
- **New** `client/src/ui/GearPanel.tsx` — the Gear tab: the four worn items, weapon first,
  plain items tagged and inert. `client/src/ui/crafting/MakeTab.tsx` and `CraftingPanel.tsx`
  stay as they are (Gear is its own destination, not a Make sub-tab).
- `client/src/ui/lineage/LineageTreePanel.tsx`, `weaponPage.css` — rows instead of three-up
  cards; Tier 2 as a compact locked block; on desktop the materials panel becomes "Where shards
  drop" (counts live in the Purse beside it); a ◉ Preview control on touch with a pinned
  preview bar; the dialog leaves the left rail uncovered (a `GameDialog` placement option in
  `client/src/hud/primitives`).
- `client/src/ui/lineage/weaponPageModel.ts` — expose the verb sentence as two halves with
  their colours (moment / payload), or take them from `shared/src/systems/lineages` sentence
  code; the prototype splits with the packet's own `momentPhrase` template.
- `client/src/hud/MobileHUD.tsx` — Gear tab in the bottom bar; the spine and drawer; AUTO and
  quest buttons shift left of the spine; a home for the guide card (there is none on mobile
  today: `TutorialPanel` only mounts in the desktop right rail).
- `client/src/hud/AreaInformation.tsx`, `areaInformationModel.ts` — banner unchanged; section IV
  reads the same territory line and the node's `mapTileLabel`.
- `client/src/tutorial/TutorialPanel.tsx`, `TutorialHighlight.tsx`, the director — the
  `rhythmRing` anchor now points at the verb row's clock; the lesson rings the verb row; a new
  tether overlay from the row to the body; the first-three-firings rule.

## 3. What the thesis cannot show well

- **Distance.** "The verb is coming" is a 27 px clock 350–450 px from the bodies. In a fight the
  eye is on the bodies; the bet relies on peripheral learning of a fixed place. It is reliable
  at rest and weak at the exact moment it matters.
- **The phone.** Closed, the drawer is a 46 px spine: the same order, but one glyph per fact
  (lean colour, the clock, three badge glyphs with numbers, the shard). No names, no sentences,
  no family. Open, the drawer covers the fight. On the phone the thesis survives as *order*,
  not as *density*: honestly, the phone loses it.
- **Duplication while the page is open.** The column stays visible beside the page, so the form
  name, the lean, its sentence and the empty verb slot are on screen twice (10 of the 72 facts on
  the desktop page key frame). I removed the wallet counts from the page to pay for it.
- **First contact.** Twelve card facts sit on the HUD from the first minute, before a verb is
  owned. Ordered, but a first-time player still meets a full column.
- **Wallpaper.** Text that never moves stops being read. The sentences in the column are read
  once, then become texture; that is the bet working and also the risk.
- **Fixed heights cap sentence length.** Every T1 sentence in the export (all five weapons) and
  every T2 Slinger composition fits the verb row's three lines and the lean row's two (checked in
  the browser), but a longer future sentence would need a wider rail or smaller type.
- **Two targets with one name.** Section III says "Mire Ooze"; which one is said only by the
  target ring under the body.
- **Rail space.** The left rail is now full on desktop; Combat log and Bestiary lose their room.
- **The roster line** in section IV is small; the "every node fields everything" problem is
  visible there (Sunkroot Bog 34/33/33) but easy to miss.

## 4. Card-related facts on screen, per scene and key frame

Counted by the page itself (`countFacts()`: every visible element tagged as a fact and not under
a modal backdrop), then checked by hand. Body fx, highlights and the tether are not facts. HP
numbers are not card facts. A badge counts once with its number. Every occurrence counts.

### Desktop (1280 × 720)

| Scene · key frame | Facts on screen | Total |
|---|---|---|
| **1** · Gear tab open | Column: form name, lean name, lean sentence, empty verb slot (its row question), Here line (territory · shard), Purse ×5 (Venom 9, Shackle 4, Bone 2, Rot 95, Toadeater Gland 0/3). Gear: weapon entry → Weapon page, "Plain item" ×3. (Guide line and Gear badge are under the backdrop.) | **14** |
| **2** · page as it opens | Column (10): as above. Page (62): form name, 3 lane chips, lean row question; Coated Edge name + sentence + Active; Tendon Cut name + sentence + 2 cost chips + Swamp 2 + Buy; Silent Step name + sentence + 2 chips + Swamp 2 + Short; verb row question; Into the Wound name + sentence + 2 chips + Swamp 4 + Buy; Easy Prey name + "needs a slow" + sentence + 2 chips + Swamp 4 + Short; Next Throat name + "weak on bosses" + sentence + 2 chips + Swamp 4 + Short; Tier 2 locked line + 9 card names; gate title, gate sentence, pips, progress line, door (Venom Knife), "Requires Swamp level 6."; stat-sheet note; 4 where-it-drops lines. | **72** |
| **3a** pure · coming (t = 5.0 s) | Form name, Coated Edge name + sentence, Into the Wound name + sentence, clock "0.5", Poison badge "31 owed", Here line, Purse ×5. | **13** |
| **3a** pure · landed (5.75 s) | Same; clock "4.8", Poison "78 owed" (jumped from 39). | **13** |
| **3a** pure · lasting (6.5 s) | Same; clock "4.0", Poison "85 owed". | **13** |
| **3b** composed · coming | Form name, Tendon Cut name + sentence, Into the Wound name + two-colour sentence, clock "0.5", Poison "13 owed", Slowed, Here line, Purse ×5. | **14** |
| **3b** composed · landed | Same + Rooted "1.8 s"; Poison "26 owed". | **15** |
| **3b** composed · lasting | Same; Rooted "1.0 s", Poison "45 owed". | **15** |
| **4** · firing #1 | The 13 column facts (Poison reads "31 → 62 owed") + guide lesson line (`lesson.read`). | **14** |
| **4** · firing #4 | The 13 column facts (Poison "78 owed"); teaching off. | **13** |
| (4 · firing #2 / #3) | 14 (`lesson.ring`) / 15 (two learned-concept lines). | (14 / 15) |
| **5** · 1 s after arriving | Column (12): form name, lean name + sentence, verb name + sentence, clock ✦, Here line, Purse ×5. Banner: territory line ("Mire territory · every kill here drops Venom Shards"). | **13** |

For reference, desktop scene 1 before Gear is opened: **12** (column 10 + guide line + Gear badge).

### Portrait (390 × 844)

| Scene · key frame | Facts on screen | Total |
|---|---|---|
| **1** · Gear sheet open | Weapon entry → Weapon page, "Plain item" ×3. (Spine and guide are under the backdrop.) | **4** |
| **2** · page as it opens (above the fold) | Form name, 3 lane chips, lean question; Coated Edge name + sentence + Active; Tendon Cut name + sentence + 2 chips + Swamp 2 + Buy; Silent Step name + sentence + 2 chips + Swamp 2 + Short; verb question; Into the Wound name + sentence + 2 chips + Swamp 4 + Buy; Easy Prey name + note + sentence + 2 chips + Swamp 4 + Short; Next Throat the same; Tier 2 locked line. (Gate, stat sheet, materials are below the fold.) | **42** |
| **3a** pure · coming / landed / lasting | Spine: lean colour bar, clock, Poison number (31 / 78 / 85), Here shard glyph, Purse count. | **5 / 5 / 5** |
| **3b** composed · coming / landed / lasting | Spine: lean colour, clock, Poison number, Slowed glyph, (Rooted seconds), shard glyph, Purse count. | **6 / 7 / 7** |
| (3b lasting, drawer opened) | The desktop column's 15. | (15) |
| **4** · firing #1 | Spine 5 + guide lesson line. | **6** |
| **4** · firing #4 | Spine 5. | **5** |
| **5** · 1 s after arriving | Banner territory line + spine (lean colour, clock ✦, shard glyph, Purse count). | **5** |
| (5, drawer opened after the banner) | Column 12. | (12) |

Portrait scene 1 before Gear: **5** (guide line, Gear badge, spine lean colour, Here glyph, Purse count).

## 5. Assumptions (the designer's calls)

- **The one-DoT rule** (everyone): one Poison record per weapon; Coated Edge's light bleed
  (26 × 0.10 = 2.6 per hit) and Into the Wound's re-dose feed it; one badge whose number is the
  damage still owed. Card sentences are the export's, unchanged.
- **No lean ranks.** Six steps per tier would read in place, without new rows: the lean row in
  the column carries three rank pips (I II III) in its right cell, where the verb row has its
  clock; on the page each lean row's state cell becomes a three-step pip control paid in the
  node's shard, so the Tier 1 group reads top to bottom as form · lean I–III · verb · gate. All
  rank numbers and costs would be `[n]`.
- **No crossroads node.** The real blends are used; section IV shows them as shares.
- **The floating word is dropped.** The verb row's name glows instead; `rhythm.floatingWord`
  is not used.
- **Teaching = the first three firings of a newly bought card** (mockup rule 2): the verb row is
  ringed, a tether runs from its clock to the body it changed, the Poison home shows
  before → after, the guide reads `lesson.read`, then `lesson.ring`, then the two concept names
  as learned. From firing #4 nothing teaches; the column just keeps state.
- **The target frame leaves the canvas** and becomes section III (the thesis's own move).
- **Slow and root labels** use the export's `prettified` ("Slowed", "Rooted") with the generic
  debuff icons from `statuses.playerDebuffIcons`, not today's "Hamstrung"/"Bound" ability tiles.
- **The Gear entry** sits in the right-rail nav beside Crafting (desktop) and in the bottom bar
  (portrait); it uses the dagger art as its glyph.
- **Mobile guide card** placed under the top strip (the real mobile HUD has none).
- **Wallets:** scenes 1–2 use `pages[scene2]`; scenes 3a, 4 and 5 use `pages[scene2-after-buy]`
  (Into the Wound owned from scene 3 on); 3b uses `pages[scene3-composed]`.
- **Combat** follows SCENES.md's illustrative rule (500 ms swings, 13 poison per hit, a quarter
  of what is owed each second, 5 s cap, 2 s root, oozes 300 HP hitting for 10 every 2 s). It is
  not the server's DoT formula. Pressing Tendon Cut's Buy shows a prototype note (only
  Into the Wound's purchase has a page model in the export).

## 6. Placeholders

- **`+[n]`** — on a kill, the Purse's node-shard cell flashes "+[n]": shards per kill are not in
  the export, so the count does not change.
- Art gaps (not numbers): Rot essence has no icon path (drawn orb); the Toadeater Gland has none
  (drawn shape); Mud Toad's art is `null` (plain blob in its monster colour `#778844`); nav and tab
  icons are text glyphs (the client's atlas frames are not in the export); the arrival banner's
  danger label is omitted (not in the export); the biome XP bar fill is decorative.

## 7. Readable with the sound off?

| Scene | Desktop | Portrait |
|---|---|---|
| 1 | **Yes** — the cards are already printed in the column; Gear lists the weapon first, plain items say so. | **Yes** — Gear tab in the bottom bar, the same list. |
| 2 | **Yes** — every state is a word or colour (Active, Buy, Short, red short chips); preview rewrites the sentences and the sheet visibly. | **Yes** — ◉ Preview plus a pinned preview bar. |
| 3 | **Yes** — coming is a counting clock in a fixed place; landed is the body (poison surges / ooze pinned) and the row lighting; lasting is three labelled badges with numbers. | **Partly** — the spine shows the clock and badge numbers but no labels or sentences; the bodies carry the payoff. |
| 4 | **Yes** — ringed row, tether to the body, before → after, guide line; stops at #4. | **Partly** — tether and ring work; the sentence the lesson points at is not on screen (the lesson line quotes it). |
| 5 | **Yes** — banner for 5 s, then section IV keeps territory and shard for the whole stay; the Purse marks the shard. | **Partly** — the family name lives in the banner and the drawer only; the closed spine shows the shard glyph. |
