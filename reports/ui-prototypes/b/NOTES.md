# Prototype B: the card is the HUD

Open `index.html`. It starts on scene 1. The page reads the hash contract
`#scene=1..5&view=desktop|portrait&first=0|1&embed=0|1`. It also takes some extra keys
that jump straight to a key frame: `pair=composed` and `frame=coming|landed|lasting`
(scene 3), `step=1|3|4` (scene 4), and `node=node-t1-swamp-02|05` (scene 5).
`first=1` freezes the scene on its key frame and draws the three markers.

## 1. The thesis

The active lean and the active verb sit on the HUD as two small cards, "the hand". On
desktop they sit at the bottom centre of the canvas. On a phone they dock above the tab
bar, full width, with the verb on top. Each card shows its real name and the exact
sentence the player bought. When the pair is composed, the verb's sentence is drawn in
its two lane colours: the moment half is underlined in the verb's colour and the payload
half in the lean's colour. There are no rings: the verb card is its own readout.

- **The clock.** A fuse along the card's bottom edge fills over the 5 s cap, and the
  corner counts it down. The corner shows `✦` when the clock is clear. The card stays
  dimmed while the clock runs and brightens over the last second.
- **The sentence moves in grammar order.** The moment clause lights while its condition
  holds on the current target. When the card fires, the payload clause lights and the
  card flashes in the payload colour.
- **The lean card.** Its lane bar glows while its effect is on the target, and ticks on
  each hit.
- **Teaching.** The same card teaches. On each of its first three firings it rises out
  of the hand with a dotted thread to the body it hit. It rises high and large on #1,
  less on #2, and barely on #3, with pips counting 1, 2, 3 of 3. From #4 on it only
  lights in place.
- **The page.** The page keeps the hand in view. Buying a card flies it into its slot,
  and previewing a lean re-reads the hand's verb.

There is no floating word: the card on the HUD is where the name lives.

The bet: players read the thing they chose, not an abstraction of it.

## 2. What I would change in the client to ship it (files, not code)

- `client/src/hud/RhythmReadout.tsx`: replace it with a new
  `client/src/hud/CardHand.tsx`, which draws two HUD cards and no rings. Keep the clock
  re-render and the `hudBus.subscribeCardFired` pulse. `client/src/hud/rhythmReadout.css`
  becomes `cardHand.css`.
- `client/src/hud/rhythmReadoutModel.ts`: becomes `cardHandModel.ts`, with the same
  inputs (`rhythmFirings`, the `ShowsRhythm` moments, the server clock). Per card it
  outputs:
  - the fuse fill and the corner mark (`✦` or seconds);
  - whether the moment's condition holds on the current target (owes a DoT / is held /
    the carry is armed); this needs the target's statuses as an input;
  - the time of the last firing.

  `readoutBuffIds` stays. `cardWordFor` goes.
- `client/src/fx/cardWord.ts`: stop drawing the floating word and keep
  `hudBus.notifyCardFired`. Add `client/src/fx/cardThread.ts` (or a DOM overlay) for the
  teaching thread from the HUD card to the body.
- `shared/src/data/lineages/sentences.ts` (with `composedSentence`): add a
  `composedSentenceParts` that returns the moment and payload halves with their lanes.
  The prototype splits the sentence with the packet's `momentPhrase` template; shipped
  code should not parse strings.
- `client/src/ui/lineage/weaponPageModel.ts`: the card model carries the sentence parts.
  `LineageTreePanel.tsx` changes:
  - draws two-colour sentences;
  - adds an "On your HUD" footer on narrow screens;
  - animates the bought card into the hand;
  - makes lean preview drive the hand's verb card.

  `client/src/ui/lineage/weaponPage.css` gets the clause, footer and preview styles.
- `client/src/hud/MenuButtons.tsx`: add a Gear entry in `right-system-nav`, the desktop
  front door.
- New `client/src/ui/GearPanel.tsx`: worn items, weapon first, plain items inert. It sets
  `lineageTreeSlotAtom` for the weapon.
- `client/src/hud/MobileHUD.tsx`:
  - dock the hand above `mhud-bottom`, with the verb on top;
  - move AUTO and the quest button above the hand;
  - add a Gear tab;
  - open sheets above the hand;
  - add a compact guide line, because today the guide card is desktop-only.
- `client/src/hud/BuffBar.tsx`: take `useReadoutBuffIds` from the hand model; the lineage
  window tiles stay off the bar.
- `client/src/hud/TargetFrame.tsx`, `client/src/hud/targetStatusMeta.ts`,
  `client/src/hud/statusHelp.ts`: show one Poison badge per weapon reservoir, and give
  any lineage id that survives a label, an icon and help text. The one-DoT rule also
  needs server work in `server/src/systems/combat/leanConditions.ts` and
  `server/src/systems/combat/lineageCards.ts`: the lean bleed and the re-dose feed the
  weapon's own `poison-dagger-burn` record.
- `client/src/tutorial/director.ts`, `client/src/tutorial/TutorialPanel.tsx`, and the
  tutorial beat data in `shared/`:
  - rewrite the lesson's `ring` line for the card;
  - add a teaching counter: three firings per newly bought card, persisted somewhere
    (designer's call).
- `client/src/ui/crafting/MakeTab.tsx`: its line "Open it from the matching slot in your
  Equipment panel" should point to the Gear tab.
- `client/src/hud/AreaInformation.tsx`: emit the arrival's shard so the hand can glint
  its matching cards.
- `client/index.html`: repurpose `#rhythm-overlay` to hold the hand.

## 3. What the thesis cannot show well

- **Space, and it gets worse.** The desktop hand is 578 × 79 px at bottom centre.
  On the phone it is 107 px tall: 13% of an 844 px screen, on top of the 86 px tab bar
  (about 24% together), for the whole session.
  - At T2 the amplifier row adds a third card, and T2 sentences are longer (Deeper
    Hamstring is 117 characters).
  - The hand cannot grow past two cards without shrinking the sentence, which breaks the
    thesis's own promise.
  - The frame's window or bank (today the readout's gold frame ring) has no home: it
    would need a third card. The Slinger has no frame, so it is not shown.
- **Wallpaper.** A sentence that is on screen all fight stops being read within minutes.
  The animated clauses help, but for this pair the moment clause is lit most of the
  time, because the target is almost always afflicted. That light carries little
  information here; it pays off for conditions that come and go (held, armed by a kill).
- **"Coming" is weak for this pair.** The 5 s cap ends exactly on a 500 ms swing, so in
  steady combat the card goes from 0.1 straight to firing. The `✦` "ready" state shows
  only at the start of a fight. So "coming" is the fuse nearly full, the countdown and
  the card brightening, all at the bottom edge while the eye is on the bodies mid-screen.
- **"Landed" is split.** The card flash is in peripheral vision, far from the body that
  was hit. Only the teaching thread connects them, and only for three firings.
- **Duplication is the cost of the thesis.** The active lean and verb appear on the page
  and in the hand, and their names appear again on the Gear row.
- **Teaching on a phone.** The lifted card covers AUTO for about 2.6 s on firing #1.
- **The node.** The thesis has almost nothing to say about nodes. The glint (cards in
  the node's shard colour light as the banner names the shard) is a weak, colour-only
  link.
- **A stat lean has nothing to light.** Silent Step, "+11 move speed.", never shows the
  per-hit tick.

## 4. Card-related facts on screen, per scene and key frame

How I counted:

- Every visible element that carries a card fact is counted **once per occurrence**. I
  counted them with an in-page census: `window.__facts()` lists every visible element
  tagged `data-f`.
- Elements under a dialog scrim are not counted.
- A clause that is lit for both "moment" and "payload" counts 2.
- Body fx count as facts: the re-dose surge, the root shackle, the slow wisp. The
  Dagger's own green poison bubbles do not.
- **Shell** is the desktop right rail's collapsed Materials chip strip: the client's
  `MaterialsPanel`, showing Rot, Venom, Shackle and Bone counts. I list it separately
  because it comes from the real shell, not from the thesis. Portrait has no strip.

| Scene | Key frame | Desktop (thesis + shell) | Portrait |
|---|---|---|---|
| 1 | Gear tab open, weapon not pressed | **10** (10 + 0) | **10** |
| 2 | page as it opens, nothing hovered | **58** (58 + 0) | **28** |
| 3a pure | coming (0.33 s before the clock clears) | **13** (9 + 4) | **9** |
| 3a pure | landed (the firing hit, +0.14 s) | **16** (12 + 4) | **12** |
| 3a pure | lasting (+0.95 s, just before the next swing) | **13** (9 + 4) | **9** |
| 3b composed | coming | **15** (11 + 4) | **11** |
| 3b composed | landed | **19** (15 + 4) | **15** |
| 3b composed | lasting | **17** (13 + 4) | **13** |
| 4 | firing #1 (+0.5 s) | **21** (17 + 4) | **17** |
| 4 | firing #4 (+0.26 s) | **16** (12 + 4) | **12** |
| 5 | 1 s after arriving, Blackwater Crown | **14** (10 + 4) | **10** |

On scene 5's other nodes, Sunkroot Bog is the same as Blackwater Crown (10 on portrait).
Rootwall Marsh is 8, because its shard is Shackle, no card in the hand is that colour,
and so nothing glints.

**Scene 1.** 10 facts, the same on both views:

- The hand (4): Coated Edge name and sentence; the empty verb slot's title "Tier 1 ·
  Verb" and its question "What does the weapon do? One active."
- The Gear tab (6): a "Coated Edge" chip on the weapon row; a dashed "Tier 1 · Verb"
  chip; "Page ›" (the weapon opens its page); "Plain item" three times.
- Not counted: the guide line and the materials strip, both under the scrim.

**Scene 2.** Desktop 58:

- The hand (4): Coated Edge name and sentence; the verb slot's title and question.
- The header's lane chips (3).
- The lean row (13):
  - Coated Edge: "active" tag, name, sentence;
  - Tendon Cut: name, sentence, 30 Rot, 3 Shackle, Swamp 2;
  - Silent Step: name, sentence, 30 Rot, 3 Bone, Swamp 2.
- The verb row (17):
  - Into the Wound: name, sentence, 90 Rot, 8 Venom, Swamp 4;
  - Easy Prey: name, two-colour sentence, "needs a slow", 90 Rot, 8 Shackle, Swamp 4;
  - Next Throat: name, two-colour sentence, "weak on bosses", 90 Rot, 8 Bone, Swamp 4.
- The top of the Tier 2 lean row (6): 3 names and 3 sentences.
- The stat-sheet note (1).
- Materials (14):
  - Rot essence: name and count;
  - Venom, Shackle and Bone Shards: name, where it drops, count, for each;
  - Toadeater Gland: name, where it drops, count.

**Scene 2.** Portrait 28:

- The lane chips (3).
- The lean row (13).
- Into the Wound (5).
- Easy Prey (3), cut by the viewport.
- The "On your HUD" footer (4).

**Scene 3a.** Portrait totals; desktop adds 4 shell facts.

- Coming (9):
  - Poison badge;
  - the lean bar lit;
  - Coated Edge name and sentence;
  - Into the Wound name, the clock mark "0.4", sentence, the moment clause lit, the fuse.
- Landed (12): coming, plus the re-dose surge on the body, the card flash, and the
  payload lit.
- Lasting (9): the same nine as coming, with the badge's number still raised by the
  re-dose (79) and the clock at 4.1.

**Scene 3b.** Portrait totals; desktop adds 4 shell facts.

- Coming (11):
  - the slow wisp on the body;
  - Poison and Hamstrung badges;
  - the lean bar lit;
  - Tendon Cut name and sentence;
  - Into the Wound name, mark, two-colour sentence, the moment clause lit, the fuse.
- Landed (15): coming, plus the root shackle on the body, the Bound badge, the card
  flash, and the payload clause lit (blue).
- Lasting (13): coming, plus the root shackle and the Bound badge.

**Scene 4.** Portrait totals; desktop adds 4 shell facts.

- Firing #1 (17):
  - the surge on the body;
  - Poison badge;
  - the teaching thread;
  - the lean bar lit;
  - Coated Edge name and sentence;
  - the lifted card, the card flash, pips "1 of 3";
  - Into the Wound name, mark, sentence, moment lit, payload lit, fuse;
  - the guide's lesson `read` line;
  - `[lesson.ring]`.
- Firing #4 (12):
  - the surge;
  - Poison badge;
  - the lean bar;
  - Coated Edge name and sentence;
  - the card flash;
  - Into the Wound name, mark, sentence, moment lit, payload lit, fuse.

**Scene 5.** Portrait totals; desktop adds 4 shell facts.

- Blackwater Crown, 1 s after arriving (10):
  - the banner's "Mire territory" and "every kill here drops Venom Shards" (2);
  - the glint on both cards (2);
  - Coated Edge name and sentence (2);
  - Into the Wound name, `✦`, sentence, fuse (4).

**What is duplicated.**

- In combat, the hand itself repeats no fact; the clock is shown twice on purpose, as
  the corner seconds and the fuse.
- Out of combat, the page and the hand repeat the active cards' names and sentences.
- The scene 4 guide line quotes the verb's sentence, so on firing #1 the sentence is on
  screen twice.

## 5. Assumptions (the designer's to make)

- **The one-DoT rule.** The Dagger with the Affliction pair carries ONE Poison record
  (the weapon reservoir). Coated Edge's light bleed and Into the Wound's re-dose feed
  that record, and the target shows one Poison badge whose number is the damage still
  owed. The card sentences are left as exported.
- **No lean ranks.** They are not shown. Six steps per tier would read like this:
  - On the page, the lean row stays three cards. The active lean gets a three-pip rank
    track and its next rank's cost: form → lean I → II → III → verb → gate.
  - On the HUD, nothing new appears. The lean card's sentence number grows in place
    ("+10% DoT potency" becomes a larger number) and its name could carry the numeral.
  - Ranks therefore suit B well: they change the sentence, not the hand's size.
- **Teaching counter.** It counts the first three firings of a newly bought card, then
  never again; where the count is stored is open. Each lift is smaller than the last.
- **Phone order.** On the phone the verb sits above the lean, inverting the page's
  order, so that the live card is nearer the action and its teaching lift does not cross
  the lean card.
- **The Gear entry.** On desktop it is in the right-rail nav between Runes and
  Inventory. On portrait it is a seventh tab-bar entry, and the Gear sheet opens above
  the docked hand.
- **Not modelled.** Pressing Tendon Cut before Into the Wound is bought is not wired,
  because the export has no "lean bought first" page; it shows a toast marked
  `[prototype]`. Only Into the Wound's purchase is wired.
- **Scene 5's state.** SCENES calls it the Slinger's first ever Swamp node, but the
  shared frame owns Coated Edge, which is paid in Venom. The hand uses the scene 3
  state (both cards owned); the banner uses `arrival.discovery`.
- **Page order unchanged.** Bands, then the gate, then the side column, as in the client.

## 6. Placeholders

- `[lesson.ring]`, in the scene 4 guide card. It stands for
  `tutorialBeats[card:dagger-t1-affliction-payoff].lesson.ring`, which says "Into the
  Wound's ring by your health bar…". B has no ring, so the line needs rewriting to name
  the card on the HUD. I did not invent the sentence.
- No numeric `[n]` was needed. Things drawn without export data:
  - The Rot essence chip: the export has no essence icon or colour, so it is a plain
    grey dot.
  - The capstone (Toadeater Gland): a plain diamond.
  - The Mud Toad: `art.monsters["mud-toad"]` is null, so it is a plain olive shape.
  - The target frame shows ATK only: the export has no monster DR or plating, so I left
    them out rather than show `[n]`.
- Coated Edge's 0.10 light-bleed share comes from the SCENES combat rule (2.6 per hit);
  it is not an exported number.

## 7. Readable with the sound off?

- **Scene 1: yes.** The Gear tab is a labelled tab. The weapon row says "Page ›". Plain
  items say "Plain item". The hand shows the owned card and the empty verb slot as text.
- **Scene 2: yes.** Everything is text, toasts included. The preview outline and the
  two-colour halves are visual.
- **Scene 3: partly.** Landed and lasting read well:
  - the re-dose is a green surge on the body, and the Poison number doubles with a pop;
  - the root is a blue shackle ring, the ooze stops wobbling, and a Bound badge appears
    with a sweep.

  Coming is a countdown and a fuse at the bottom edge of the screen. Without a sound,
  the moment it is about to fire is easy to miss while watching the bodies, and the
  firing flash sits in peripheral vision.
- **Scene 4: yes.** The card rises, the thread runs to the body, the pips count 1 to 3,
  and the guide shows the lesson. All of it is visual, and the steps visibly shrink to
  nothing by #4.
- **Scene 5: yes.** The banner text names the family and the shard. The hand's glint is
  a minor, colour-only cue.
