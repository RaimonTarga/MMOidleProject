# Prototype A — Nothing but the ring

Open `index.html` (it loads `../data.js`). Hash contract:
`#scene=1..5&view=desktop|portrait&first=0|1&embed=0|1`. `first=1` freezes the scene on its
key frame with the three markers; `embed=1` hides the chrome and loops the scene.

## 1. The thesis

In combat the HUD carries exactly one card element: one ring per active verb, sitting by
the HP bar. The ring only answers "is the verb coming?": a counting clock in the verb's lane
colour that brightens and tightens for its last second, then ✦ with a flash. A small badge on
the ring shows the payload's glyph in the payload's colour, so a composed pair reads as two
colours (green moment, blue root) without any text. Everything else lives somewhere else.
The **body** shows the verb landing: the venom pips over the ooze pop and split in two, and a
geyser goes up (re-dose), or chains clamp the feet, pegs bite and the ooze strains, stopped
short (root). The **target frame** keeps the lasting state as one badge per record. The **page**
holds names, sentences, costs and where the shards drop, plus two lessons the HUD never gives:
a ring mark on every verb (the ring it will put by your HP bar) and a looping preview of the
active verb's body fx. Teaching is one transient line, name and sentence, that slides out of
the ring on a new pair's first three firings, while a spark runs from the body to the ring.
After that the line never comes back. There is no floating word, no proc icon and no callout.
The shard wallet leaves the rail. The bet is that the body fx alone carry the payoff, so they
were built to be readable with the sound off at the client's real 1:1 desktop scale.

## 2. What I would change in the client to ship it (files, not code)

- `client/src/hud/RhythmReadout.tsx`, `client/src/hud/rhythmReadoutModel.ts`,
  `client/src/hud/rhythmReadout.css`: drop the text label under the ring. Add a `coming`
  state for the last 1 s of a cap clock (brighter arc, leading glint, a pulse). Move the payload
  glyph into a corner badge tinted with the payload lane's colour (`payloadLane`, not the
  moment's). Make the ring bigger (56 px desktop, 48 px phone). Add a one-shot spend on firing,
  a tutorial-highlight slot, and a ring-anchored teaching line. Hover (desktop) or tap (phone)
  shows the name, the two-colour sentence and the state words.
- `client/src/fx/cardWord.ts`: retire the floating word. Its job (naming the card) moves into
  the teaching line, which plays only on the first three on-screen firings of each verb × lean
  pair. That needs a small per-character counter (client storage is enough; `ShowsRhythm`
  needs nothing new).
- New `client/src/hud/TeachingLine.tsx` (or folded into `RhythmReadout.tsx`), fed by
  `hudBus.subscribeCardFired`. It counts a firing only when the tab is visible and no
  full-screen panel is open.
- `client/src/fx/lineagePayloadFx.ts` (`doubleDose`, `shackleClamp`),
  `client/src/fx/auraDefs.ts`, `client/src/fx/lineagePayloadStates.ts`: a stronger re-dose (flash,
  geyser, two ground rings, a squash, pips that stay doubled). A persistent pip row over the
  target for its reservoir. A held shackle with pegs and a feet-pinned strain. A zoom floor for
  payload fx on phones.
- `client/src/render/cameraZoom.ts`: a fight zoom of about 0.72 on phones, not the 0.4 floor
  (see §5). Without it the bodies are about 26 px and cannot carry a payoff.
- `client/src/hud/targetStatusMeta.ts`, `client/src/hud/statusHelp.ts`,
  `client/src/hud/TargetFrame.tsx`: apply the one-DoT rule. `lineage.lean-bleed` and
  `lineage.hemorrhage` fold into the weapon's reservoir badge ("Poison", its icon, its help, the
  number = damage still owed). Hamstrung and Bound use the `playerDebuffIcons` slow and root
  art (clearer than the ability icons).
- `client/src/hud/BuffBar.tsx`: nothing card-related comes back (the lineage tiles are
  already off it).
- `client/src/hud/MaterialsPanel.tsx`: the rail shows essence only. Shard rows move to the
  page's materials list, the banner and the map.
- `client/src/hud/MenuButtons.tsx`: a **Gear** rail entry whose icon is the worn weapon's art.
- `client/src/hud/MobileHUD.tsx`: the bottom tab Craft becomes **Gear** (its sheet has the
  tabs Gear | Make). Ring size and position. The teaching line sits under the target frame,
  right-aligned to the ring. A guide card docked over the "!" button (the mobile client has no
  guide card today).
- `client/src/ui/crafting/CraftingPanel.tsx`, `client/src/ui/crafting/MakeTab.tsx`, new
  `client/src/ui/crafting/GearTab.tsx`: the tab strip Gear | Make, with Gear where Upgrade was.
  The worn items come first with the weapon at the top. Plain items are marked and inert.
- `client/src/ui/lineage/LineageTreePanel.tsx`, `client/src/ui/lineage/weaponPageModel.ts`,
  `client/src/ui/lineage/weaponPage.css`: opened from the Gear tab (with a "‹ Gear" back
  button). A ring mark on every verb card. Verb sentences in two colours (moment half and
  payload half). The prototype splits them by matching `momentPhrase`; shipping should export
  the halves from `shared/src/.../sentences.ts` instead (outside the client). The active verb's
  fx preview. A portrait "◉ Preview" toggle per lean with an inline stat diff, because there is
  no hover on a phone.
- `client/src/tutorial/director.ts`: the lesson's `ring` step no longer rings the readout out
  of combat. Its content is delivered by the first in-fight teaching line, at the ring, at the
  moment the ring starts counting.
- Unchanged: `client/src/hud/AreaInformation.tsx` (the banner already names the family and
  the shard), `client/src/ui/MapPanel.tsx` (the tile label already does).

## 3. What the thesis cannot show well

- **Anything after the third firing.** The sentence never comes back in combat. A player who
  forgets what the surge means has to open the page (which keeps the fx preview) or
  hover/tap the ring. Idle players watch less than they listen, so "the body carries it" asks
  for attention an idle game does not always get.
- **No memory.** The ring and the body are both of-the-moment. Nothing records that the
  verb fired five times while you were in the Map; the only trace is the clock restarting.
- **Ring identity at scale.** With one verb, colour plus glyph is enough. With a frame ring and
  a T2 verb (up to three rings, possibly two in one lane colour), the rings carry no names, so
  telling them apart needs hover or tap.
- **The lean is invisible in combat.** Tendon Cut shows only as Hamstrung and faint blue drag
  streaks on the target. Coated Edge has no look of its own (its bleed is folded into the one
  Poison record). Silent Step (+11 move speed) shows nowhere at all.
- **The root on a target that was not walking.** The prototype stages the oozes walking in,
  so "stopped short" reads. On a monster already in melee, only the shackle shape is left.
- **Busy fights.** One surge among five bodies is harder to attribute than one among two. The
  spark helps for the first three firings only.
- **The node after 5 s.** The banner names the family and the shard for the discovery hold
  (5000 ms). After that the HUD says nothing: the shard is on the map tile, on the page, and
  (after the first kill) on the shard that pops off each corpse.
- **Phones.** The fx needed a camera change (0.72 zoom) and an fx floor to read at 390 px. At
  the client's 0.4 floor the pips would be about 4 px.

## 4. Card-related facts on screen, per scene and key frame

**Counting rules.** Every visible occurrence counts, dimmed or not. Per card: name 1,
sentence 1, state 1 (ACTIVE/OWNED tag, BUY pill, short or locked styling), each cost chip 1,
requirement 1, caveat 1, and the ring mark 1 on verbs. A row header counts as title 1 + question
1. A form header counts as name 1, eyebrow 1, meta 1 and each lane chip 1. Materials count as
name+count 1 and "where" 1. Stat-sheet rows are character stats and count 0; its note counts 1.
The ring counts as state 1 + payload glyph 1, plus 1 if it wears the tutorial highlight. The
teaching line counts as name 1 + sentence 1. Each target badge caused by a card counts 1. On the
body: the payoff fx 1, the poison pips with their drips 1, the slow streaks 1, and the shackle
1. Green poison-tick numbers count 1 while visible. A shard popping off a corpse counts 1. The
rail's Rot essence counts 1 (shell, desktop only). White hit numbers count 0.

| Scene · key frame | Desktop | Portrait |
|---|---|---|
| 1 · Gear tab open | **7** | **5** |
| 2 · page as it opens | **81** | **41** |
| 3a pure · coming (t 5.5 s) | **5** | **4** |
| 3a pure · landed (firing hit +0.26 s) | **7** | **6** |
| 3a pure · lasting (+1 s) | **6** | **5** |
| 3b composed · coming | **8** | **7** |
| 3b composed · landed | **8** | **7** |
| 3b composed · lasting | **9** | **8** |
| 4 · firing #1 (+0.7 s) | **10** | **9** |
| 4 · firing #4 (+0.7 s) | **6** | **5** |
| 5 · 1 s after arriving | **6** | **5** |

The lists below are desktop. Portrait drops what is noted.

- **1, Gear tab:** guide line ("Buy Into the Wound. …") 1; Rot 95 in the rail 1; Poison
  Dagger eyebrow "Weapon · Swamp lineage · Tier 1 form" 1; "Open page ›" 1; "Plain item" ×3.
  *Portrait:* no guide (the sheet covers it) and no essence panel.
- **2, page:** dialog title 1; form name, eyebrow, meta, 3 lane chips 6. T1 Lean: header 2,
  Coated Edge 3, Tendon Cut 6, Silent Step 6. T1 Verb: header 2, Into the Wound 7, Easy Prey 8,
  Next Throat 8. T2 Lean: header 2 and 3 locked cards × 6. T2 Verb header 2. Stat-sheet note 1.
  Materials 9 (Rot; Venom, Shackle, Bone and Toadeater Gland, each with where). The gate is
  below the fold. *Portrait:* title + form 7, T1 Lean 17, T1 Verb header 2, Into the Wound 7,
  Easy Prey 8.
- **3a coming:** ring 0.5 "coming" 1 + glyph 1; Poison badge (31) 1; pips and drips on Ooze
  B 1; Rot 1.
- **3a landed:** ring 4.7 + glyph 2; Poison badge jumping to 78 1; surge (flash, rings,
  geyser) 1; pips mid-split 1; poison tick "8" 1; Rot 1.
- **3a lasting:** ring 4.0 + glyph 2; Poison badge (85) 1; doubled pips and heavier drip 1;
  tick 1; Rot 1.
- **3b coming:** ring + root glyph 2; Poison 1; Hamstrung 1; pips 1; slow streaks 1; Venom
  Shard popping off Ooze A's corpse 1; Rot 1.
- **3b landed:** ring 2; Poison, Hamstrung, Bound 3; clamp and shackle 1; pips 1; Rot 1.
- **3b lasting:** ring 2; Poison, Hamstrung, Bound 3; held shackle and strain 1; pips 1;
  tick 1; Rot 1.
- **4 #1:** ring 2 + gold highlight 1; teaching line name 1 + sentence 1; Poison badge 1;
  surge 1; pips 1; tick 1; Rot 1. (#3 is the same, 10; #2 is 9 because no tick is on screen
  at +0.7 s.)
- **4 #4:** ring 2; Poison 1; surge 1; pips 1; Rot 1. No line, no highlight.
- **5:** ring ✦ + glyph 2; banner "Mire territory" 1, Venom Shard icon 1, "every kill here
  drops Venom Shards" 1; Rot 1.

The combat key frames sit at 4–10 facts, of which only 2–3 are HUD (the ring, plus the line
during teaching). Everything else is on the target or the body. The page is dense (81 on
desktop) by design: it is where thesis A puts everything.

## 5. Assumptions (the designer's to make)

- **The one-DoT rule** (everyone): one Poison record per weapon. The lean's light bleed and
  the verb's re-dose feed the Dagger's reservoir. One badge (`poison-dagger-burn`'s label,
  icon and help) shows damage still owed. Card sentences are the export's and unchanged.
- **No lean ranks.** On this page, six steps per tier would read like this: the lean card
  carries three rank pips (I–III) in its corner, its sentence's number grows per rank, and the
  next rank's price sits in its cost line. The row stays one choice of three. The rank is a
  property of the lit card. The verb row, the ring and the HUD do not change, because thesis A
  never shows ranks in combat.
- **No crossroads node.** Real blends throughout (Sunkroot Bog 34/33/33 still reads "Mire
  territory").
- **Phone fight camera at about 0.72 zoom** (the client floors at 0.4), plus an fx floor. This
  is an engineering call the thesis depends on.
- **The teaching counter** is per verb × lean pair (a new lean changes the sentence and the
  body fx, so it re-teaches three times). It counts only on-screen firings.
- **Gear placement:** a rail entry plus the Crafting dialog tab where Upgrade was. On a phone,
  the bottom tab Craft is renamed Gear (Make is its second tab).
- **Shards leave the rail's materials panel.** They appear on the page, the banner, the map
  and the corpse pop.
- **Icons:** Hamstrung and Bound use `playerDebuffIcons.slow` and `.root`.
- **The pips' unit** is one hit's dose under the current lean (15.6 pure, 13 composed), so a
  re-dose literally doubles the row. This is a presentation rule, not data.
- **Tendon Cut** is not purchasable in scene 2, because the export has no page for "Tendon
  Cut bought before Into the Wound". Pressing it previews the lean instead of firing
  `toasts.buyLean` over an unchanged page.
- **The prototype combat rule** is the SCENES.md one (26 every 500 ms; 13 + 2.6 into one record
  that ticks a quarter each second; a 5 s cap; a 2 s root; Ooze 300 HP and 10 per 2 s). It is
  illustrative, not the server's DoT formula. World geometry is invented staging: ooze speed
  40 px/s, spawn distances 140 and 380 px, melee 56 px, the 300 ms first-attack delay, and
  1500 ms between waves in scene 4.

## 6. Placeholders

No visible `[n]`: every number shown comes from the export. These things are invented and
are not data:

- the world geometry above;
- the biome XP bar's fill (no number is shown);
- the guide-card position on a phone;
- the arrival banner without the danger label (`AREA_DANGER_LABELS` is not in the export, so
  it is omitted rather than faked);
- the swamp ground, tint and props, which are the client's own assets
  (`client/public/assets/environment/swamp/`, `biomeTint.ts` T1 swamp tint), not export paths;
- the menu and stat icons, from `client/public/assets/concept-icons/`;
- the Mud Toad, which is a plain shape because its art is `null` in the export.

## 7. Readable with the sound off?

| Scene | Verdict | Why |
|---|---|---|
| 1 | **Yes** | Text and art only. The Gear tab says which item has a page and which items are plain. |
| 2 | **Yes** | Everything is on the page, in words. Lane colour is backed by names and chips. |
| 3 | **Partly** | Desktop, yes: "coming" is a clock with a brighter last second, the surge is unmistakable (rings, geyser, pips 3 → 6), and the root stops a walking ooze dead in chains. On a phone the surge reads but the pips are small. The root is a shape only if the target was not moving. Nothing names the verb in combat. |
| 4 | **Partly** | Firings #1–#3 are taught by text at the ring, linked to the body by a spark. From #4 on, the player must recognise the body fx with no words, and if the first three were missed, the counter waits for on-screen firings. |
| 5 | **Partly** | The banner names the family and the shard in text, but only for 5 s. The bodies do not say what they pay (rule 4 is not assumed), and after the banner only the map tile does. |
