# C — Body first, book second

Open `index.html` (opens on scene 1). Hash contract: `#scene=1..5&view=desktop|portrait&first=0|1&embed=0|1`.
The panel beside the frame drives each scene (Land a hit, Auto-play, Pure / Composed, key-frame
freezes, Fire again, Arrive, node picker) and counts the card facts on screen live.

## 1. The thesis

There is no HUD element for cards at all: no ring, no card tile, no proc icon, no callout. Design
§24.1 taken literally: a payoff is perceptible with the sound off by what bodies do. So every fact
of a fight lives on a body. **Coming**: the dagger's blade fills with the verb's *moment* colour over
its 5 s clock and glints ✦ when clear, and when the target meets the moment's condition the ground
under it marks in the *payload* colour, in the payload's shape (a venom sigil for the re-dose, four
pegs for the root). **Landed**: the charged slash discharges into the target and the payoff plays on
it (the poison is drawn in and bursts; or chains fly in and lock on those pegs). **Lasting**: the
target's own badge, the one target-attached element, carries what stays: one Poison badge whose
number is the damage still owed and which *grows* with it, plus the root (with its clock) and the
slow, while the body is visibly pinned or crawling. The sentences live in exactly one place: the
weapon page, a book opened from the Gear tab. Because it is the only place words live, the book
carries one addition no other surface needs: **the plate** ("In the fight"), a looping figure of the
current pair drawn with the same glow, mark, payoff and badge the world uses, with a three-line
legend. The book teaches the world's vocabulary; the world never spells it out. The floating word
is kept only as teaching: it rises from the wound (not the player) on a newly bought card's first
three firings, then never again.

## 2. What I would change in the client to ship it

Files, no code. Server: nothing new for the world layer (`ShowsRhythm` already carries the moment
clocks); the one-DoT rule is a server change and the designer's call.

- `client/src/hud/RhythmReadout.tsx`: delete from both shells; nothing replaces it on the HUD.
- `client/src/hud/rhythmReadoutModel.ts`: keep the pure derivation (cap clock, ready, carry, count),
  re-aim its output at the renderer: per player a charge 0..1, ready, moment colour, payload colour
  and payload shape. Ring labels, glyphs and `readoutBuffIds` go.
- `client/src/hud/BuffBar.tsx`: drop the `useReadoutBuffIds` dependency; lineage windows stay off
  the bar (already).
- `client/src/hud/TargetFrame.tsx`, `targetFrame.css`: the frame keeps name, HP and stats; its tile
  strip moves onto the body (below).
- `client/src/hud/targetStatusMeta.ts`: authored label, colour and icon for the one weapon Poison
  record (one-DoT rule); until then `lineage.lean-bleed` and `lineage.hemorrhage` need entries. Use
  the generic slow and root icons for card-caused control.
- `client/src/hud/statusHelp.ts`: help copy for card-caused root and slow; today's `Hamstrung` and
  `Bound` text names abilities (Hamstring, Binding Strike), not cards.
- `client/src/fx/cardWord.ts`: play only on a card's first three firings (needs a per-character,
  per-card firing counter, persisted) and anchor it above the target's badge, not over the player.
- New `client/src/render/worldBadges.ts` (beside `render/healthBars.ts`): status badges drawn in
  screen space above the target's HP bar, constant size at any zoom; the Poison badge scales with
  the owed amount and pops on a re-dose. Hover (desktop) / tap (phone) shows the status help.
- New `client/src/fx/weaponCharge.ts` + `client/src/render/players.ts` (a weapon-hand anchor): the
  blade glow (fill from hilt to tip, flame-shaped light, ✦ when ready, motes).
- New `client/src/fx/groundMark.ts`: the payload-coloured mark under a target that meets the moment's
  condition once the charge passes 60% (venom sigil, four pegs, impact crack, heal rings).
- `client/src/fx/lineagePayloadFx.ts`: the shackle locks onto the mark's pegs; the double dose
  inhales from the mark. `fx/lineagePayloadStates.ts`, `fx/auraDefs.ts`: the venom cast on the body
  deepens with the owed amount.
- `client/src/render/cameraZoom.ts`: a combat camera on phones (zoom 1.0 while fighting; today's floor
  is 0.4, which draws a 64 px body at 26 px). The prototype's phone camera toggle shows both.
- `client/src/ui/lineage/LineageTreePanel.tsx`, `weaponPage.css`: the book layout (a spread on
  desktop; on the phone one column with the plate under the frontispiece), two-colour sentences,
  phone preview buttons and a sticky preview bar, opened from the Gear tab.
- `client/src/ui/lineage/weaponPageModel.ts`: expose a verb sentence as its two halves (text +
  colour) rather than one string (the prototype splits on the packet's moment phrase), and expose the
  plate's pair (trigger kind, payoff kind, colours; the compositions already carry them).
- New `client/src/ui/lineage/PairPlate.tsx`: the plate, reusing the world fx drawing on a small canvas.
- New `client/src/ui/gear/GearPanel.tsx`: the Gear tab (worn items, weapon first, plain items inert,
  "N cards you can buy" on the weapon row).
- `client/src/hud/MenuButtons.tsx`: a Gear rail entry (icon: the worn weapon) between Inventory and
  Crafting. `client/src/hud/MaterialsPanel.tsx`: shard rows leave the HUD (essence stays).
- `client/src/hud/MobileHUD.tsx`: a Gear tab in the bottom bar; the gear sheet sits above the tab
  bar; `<RhythmReadout compact />` goes; a compact guide card (today the guide is desktop-only).
- `client/src/ui/crafting/MakeTab.tsx`: the "Tier 2+ forms are unlocked from the item's lineage
  tree" note points at the Gear tab.
- `client/src/ui/inventory/InventoryPanel.tsx`: clicking the equipped weapon stays as a second door.
- `client/src/tutorial/director.ts`, `TutorialPanel.tsx` (and the shared tutorial script copy): the
  verb lesson's `ring` line is replaced by a blade-glow line; the guide anchors the Gear tab.
- `client/src/hud/AreaInformation.tsx`: unchanged banner. New `client/src/render/nodeShardProps.ts`
  plus art: the node's shard as crystals in its ground, which flare once as the banner lands.

## 3. What the thesis cannot show well

- **Size.** Everything rides on bodies, and bodies are small. At today's phone camera (0.4) the
  blade is about 10 px and the mark under a 26 px ooze is a smudge; the thesis needs the phone's
  combat camera at 1.0, which costs field of view. Even then the only element legible at any zoom is
  the badge, and it is legible because it is text.
- **Which card is talking.** After the teaching window the body never names the card. With one verb
  that is fine. It does not scale: a T2 amplifier or T3 keystones put several clocks on one blade,
  and a root from Into the Wound looks exactly like a root from Next Throat.
- **Precise timing.** The fill is an analog clock; a player can see "almost" but not "1.2 s".
- **Why nothing fires.** A conditional moment that cannot fire (Easy Prey with no slow; the kill
  carry on a boss) leaves the blade full and glinting forever. Only the book's caveat ("needs a
  slow", "weak on bosses") says why.
- **The lean in combat.** A lean shows only through its payload or its stat. Coated Edge's light
  bleed folds into the one Poison number; Silent Step shows nothing in a fight.
- **The two-colour sentence.** In combat only the two colours appear (green blade, blue pegs and
  chains); the sentence itself is in the book.
- **Crowds.** Party play, several targets, or a boss's own telegraphs on the same ground would bury
  marks and glows. Small iframes (the comparison page) shrink the world fx with everything else.
- **Teaching copy.** The tutorial's `lesson.ring` line describes a HUD ring this thesis removes; a
  new line is needed (shown as `[n]`).

## 4. Card-related facts on screen, per scene and key frame

Counted by the page itself (`window.__facts()`: every element tagged as a card fact that is visible,
not under the book or the Gear sheet, inside the frame or the book's scroll viewport, plus every
world signal drawn that frame). Every occurrence counts: the poison shown both as a body cast and
as a badge counts twice. Scene 2 counts the page as it opens (above the fold); the whole scrolled
page is given beside it.

| Scene · key frame | Desktop | Portrait | What is on screen |
|---|---:|---:|---|
| 1 · Gear tab open | 4 | 3 | guide line (buy Into the Wound); "2 cards you can buy"; venom crystals in the ground; Rot 95 on the HUD materials strip (desktop only) |
| 2 · page as it opens | 57 (page 118) | 33 (page 118) | desktop: form eyebrow, name, meta, 3 lane chips; 9 card names, 9 sentences, 9 card states (1 active tag, 2 buy, 3 short, 3 locked), 10 cost chips, 5 requirements, 2 caveats; plate: verb name, lean name, "not yours yet", 3 legend lines; stat-sheet note. Portrait: form 6; 4 names, 4 sentences, 4 states, 6 chips, 3 requirements; plate 6 |
| 3a · coming | 6 | 5 | blade glow (filling); ground mark (venom sigil); Poison badge; poison cast + drip on the body; venom crystals; Rot (desktop) |
| 3a · landed | 5 | 4 | burst on the target (drawn in, bursts, badge jumps and swells); Poison badge; poison cast; venom crystals; Rot (desktop) |
| 3a · lasting | 5 | 4 | Poison badge (grown); poison cast + drip; blade glow (refilling); venom crystals; Rot (desktop) |
| 3b · coming | 9 | 8 | blade glow; ground mark (four pegs, blue); Poison badge; slow badge; drag lines (crawl); poison cast; Venom Shard dropping from Ooze A's kill; venom crystals; Rot (desktop) |
| 3b · landed | 9 | 8 | chains lock round the feet; chains held on the pegs; Poison, root and slow badges; drag lines; poison cast; venom crystals; Rot (desktop) |
| 3b · lasting | 9 | 8 | chains held; Poison, root (with clock) and slow badges; drag lines; poison cast; blade glow; venom crystals; Rot (desktop) |
| 4 · firing #1 | 8 | 7 | floating word "Into the Wound!" over the wound; guide lesson (`lesson.read`); guide `[n]` glow line; burst; Poison badge; poison cast; venom crystals; Rot (desktop) |
| 4 · firing #4 | 5 | 4 | burst; Poison badge; poison cast; venom crystals; Rot (desktop). No word, no guide |
| 5 · 1 s after arriving | 3 | 2 | banner territory line ("Mire territory · every kill here drops Venom Shards", with the shard icon); Venom Shard crystals in the ground; Rot (desktop) |
| **Total (the 11 key frames)** | **120** | **86** | |

Firing #3 (for reference) is the same as #1: 8 desktop, 7 portrait.

## 5. Assumptions (the designer's to make)

- **The one-DoT rule** (everyone): one Poison record per weapon; the lean's light bleed and the
  verb's re-dose feed it; the badge shows the damage still owed. The card sentences are left as the
  export has them.
- **No lean ranks.** Six steps per tier would read on the book as three notches along the lean card's
  top edge, its sentence's number re-rendering per notch, and the plate's drip growing per rank.
- **"The node looks like what it pays"** (the last clause of mockup rule 4): shard crystals as props
  in a node's ground. The roster rule is not assumed; the bodies are the real `spawnCycle` blends.
- **A phone combat camera at 1.0** (today 0.4).
- **Teaching rule**: the word plays on a newly bought card's first three firings, from the wound,
  and the guide's lesson stays for those three; needs a persisted per-card firing counter.
- **Shards leave the HUD materials panel** (the prototype's strip shows Rot only).
- **Target statuses drawn on the body** rather than in the target frame's tile strip.
- **Slow and root icons**: `statuses.playerDebuffIcons` (the weight, the bound boot) rather than
  `hamstring.png` / `binding-strike.png` from `statuses.target`, which read poorly at 20 px; labels
  and help text are still `statuses.target`'s.
- **A guide card on the phone** (today it is desktop-only).
- **Gear tab placement**: right rail between Inventory and Crafting; bottom bar between Bag and Craft.
- The floating word sits about 60 px above the target so it clears the grown badge.

## 6. Placeholders

- `[n]` in the guide card (scene 4): the lesson line for the blade glow. The export's
  `lesson.ring` ("…Into the Wound's ring by your health bar…") names a HUD ring this thesis removes.
- Not numbers, but stand-ins, listed for honesty: Mud Toad has no art (`art.monsters['mud-toad']`
  is null) and is drawn as a plain toad shape; Rot essence and the Toadeater Gland have no icon and are
  plain diamonds; the node crystals are the shard icons standing in for prop art; the client banner's
  danger skull is omitted (not in the export); the biome XP bar's fill is illustrative; the plate's
  clock is compressed (about 2.5 s instead of 5 s) so a loop fits; the 0.10 lean-bleed share is the
  SCENES combat rule's (the card says "a tenth"). Slot and stat labels in the Gear tab are the
  client's `SLOT_LABELS` / `STAT_META`.
- Two presses with no page state in the export show a dashed "Prototype:" note instead of a toast:
  buying Tendon Cut on the scene 2 page (scene 3b shows it bought) and swapping Coated Edge back in.

## 7. Readable with the sound off?

| Scene | Verdict | Why |
|---|---|---|
| 1 | Yes | Nothing is sound-dependent: Gear tab, the weapon row with "Open its page", plain items labelled. |
| 2 | Yes | It is text, and the plate shows the pair moving. |
| 3 | Partly | Landed and lasting: yes, on both views (the burst, the badge jumping and growing, the chains and the crawl). Coming: yes on desktop and at C's phone camera; at today's 0.4 the blade fill and the mark are a few pixels. The card's name is never shown. |
| 4 | Yes / partly | #1–#3: yes (the body gets a name from the word over the wound, and the guide line quotes the sentence). #4: partly, the body shows that something fired, not which card. |
| 5 | Yes while the banner holds (5 s), then partly | The banner names family and shard; the crystals that flared with it keep saying the shard afterwards, but nothing keeps saying the family except the bodies (70% oozes here; Sunkroot Bog's 34/33/33 says nothing). |
