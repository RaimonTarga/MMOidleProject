# Biome Palette Bible

v1 — 2026-07-12. The per-biome color baseline for the mob sprite/concept overhaul.

This fills the "color families" slot that `biome-and-creature-bible.md` §4 requires but
never defined. Goal: every biome's mobs share a tight scheme that (a) coheres within the
biome, (b) contrasts against that biome's ground, and (c) makes biomes feel distinct from
each other. Sprite-batch prompts should quote the palette words from this doc.

**Provenance of the hex values:** backdrop colors are `backgroundColor` in
`shared/src/biomeDatabase.ts`; map tiles are `BIOME_TILE_COLORS` in
`client/src/ui/map/constants.ts`; ground anchors were sampled 2026-07-12 from the
pure-material corner tiles of the accepted wang sheets in `art/src/files/environment/`
(48px average of tile 0,0 = lower material and tile 3,3 = upper material). Hexes are
*anchors for eyeballing contrast*, not mandates — the prompt palette words are the
authoring interface. If a sheet is re-accepted, re-sample.

Mob palettes below are **PROPOSED** unless marked LOCKED; a biome's palette locks when its
first mob batch is accepted in-game.

---

## Layer model

Color decisions stack in this order; each layer is checked against the one below it:

1. **Backdrop** — the flat scene color outside the ground art. Always near-black, tinted
   toward the biome hue.
2. **Ground sheets** — the wang materials mobs actually stand on. This is the surface mob
   contrast is judged against.
3. **Props** — echo the ground palette (same family, slightly stronger silhouette). Props
   never outglow mobs.
4. **Mobs** — 2–3 shared body colors + 1 biome accent across the whole roster.
5. **Functional hazards** — lava, bog pools, biolume fields. These own the brightest
   version of their hue in the biome; decorative art and mob accents stay visibly dimmer.
6. **Reserved marker colors** (global, never dominant on a mob body):
   - Elite outline `#ffdd33` bright yellow (`client/src/render/monsters.ts`) — no mob may
     have a bright-yellow rim or dominant yellow silhouette, or elites stop reading.
   - Pack-alpha tint `#ff7755` warm red — avoid all-over warm-red bodies in biomes that
     use pack alphas (plains, forest, jungle, cave).
   - Boss/guardian cues (red outline, violet throne tint) and FX families in
     `client/src/fx/` sit on top; mob accents should not impersonate them.

## Global rules

- Everything is muted painterly: "not bright, no neon, no oversaturation" stays in every
  prompt. Color identity comes from *hue direction and value placement*, not saturation.
- **One accent per biome.** Each biome gets exactly one accent hue that may approach
  brightness (glowing eyes, lures, embers, poison). Everything else is body color.
- **Name the contrast axis.** Every mob batch states how its mobs pop against the ground:
  value (lighter/darker), temperature (warm-on-cool), or hue. "Looks nice in isolation"
  is not a contrast strategy.
- Elite-tint survival: check silhouettes against the yellow elite outline before
  accepting a batch.

## Accent uniqueness map

The accents are deliberately spread so no two adjacent-tier biomes share a hue:

| Biome     | Accent                            | Distinct from                      |
| --------- | --------------------------------- | ---------------------------------- |
| Clearing  | soft pastoral gold (barely there) | desert's regal amber               |
| Plains    | none — earth tones only           | —                                  |
| Forest    | matte bramble red                 | volcano's glowing orange           |
| Mountain  | horn ivory / cold sky blue        | tundra's icy cyan (paler, colder)  |
| Swamp     | wet poison chartreuse             | wasteland's necrotic grey-green    |
| Cave      | colorless pale glint              | every glowing accent — cave is dim |
| Desert    | regal sun-amber                   | clearing's soft gold               |
| Jungle    | dusky crimson                     | forest's berry red (darker, hotter)|
| Tundra    | glacial pale cyan                 | trench's saturated teal            |
| Volcano   | ember orange-red glow             | forest/jungle reds (it glows)      |
| Trench    | bioluminescent teal-cyan          | tundra's pale ice blue             |
| Wasteland | plague green over bruised violet  | swamp's yellow-green (wetter)      |

---

## Per-biome palettes

Format: backdrop / map tile · measured ground anchors · ground palette words · mob scheme
· contrast axis · avoid.

### Clearing (T0 hub)

- Backdrop `#101a10` · map `#2e5e2e`
- Ground: tended grass `#7b996b` · dirt path `#afa793` · paving `#b5b6a9`
- Ground words: soft muted sage green, warm undertone, calm and tended
- Mobs (few; tutorial-grade): soft warm naturals — cream, hazel brown, soft grey; accent:
  a whisper of pastoral gold. Nothing threatening, nothing glowing.
- Contrast: gentle value only; the clearing is allowed to be low-drama.
- Avoid: any hue that reads dangerous (reds, sickly greens), saturation in general.

### Plains — **LOCKED** (shipped batch 2026-07-10)

- Backdrop `#141a08` · map `#4e5e1a`
- Ground: pale wheat grass `#af9b7b` · worn dirt `#a99071`
- Ground words: pale wheat, grey-sage undertone, dry gold, warm grey
- Mobs: dusty tan, warm grey-brown, russet-brown bodies; cream/pale barred markings
  (boar, prairie wolf, savanna hawk, stampede bull, field hare). Wisp is the one pale
  luminous exception.
- Contrast: value — mobs sit clearly darker than the pale wheat ground; herd cohesion
  comes from everything living in the same dusty warm family.
- Avoid: bright green, vivid yellow, cool hues, pure white.

### Forest (T1)

- Backdrop `#0a1a0a` · map `#1a4018`
- Ground: moss/leaf litter `#686243` · undergrowth `#708466` / heavy foliage `#273e2a`
- Ground words: muted mossy green-brown, earthy undertone
- Mobs: rust-red and grey-brown fur, dark umber, charcoal points (wolves, foxes, bramble
  beasts); accent: matte bramble-berry red (thorns, eyes, wounds on bark bodies).
- Contrast: temperature — warm rusty bodies on the cool mossy floor.
- Avoid: green bodies (vanish into floor), glowing anything, plains-tan (keeps the two
  T1 neighbors apart).

### Mountain (T1)

- Backdrop `#141418` · map `#3e3e50`
- Ground: rocky earth `#546576` · stone pavement `#a2adb7`
- Ground words: cool blue-grey stone, pale weathered slabs
- Mobs: warm buff and tan hides with ivory horns (goats, rams, eagles); stone bodies go
  darker basalt-grey with pale lichen dusting so they read as *creatures* against
  lighter worked stone. Accent: horn ivory; cold sky-blue for the rare sentry/magical
  body.
- Contrast: temperature — warm hide on cold stone; stone-bodied mobs rely on value.
- Avoid: mid-grey bodies matching `#546576`–`#a2adb7`, anything mossy.

### Swamp (T1)

- Backdrop `#0c1708` · map `#1a3a0c`
- Ground: murky ground `#545234` · bog pool `#444524` (functional, sickly-green rim)
- Ground words: muted olive-brown, damp grey-green undertone
- Mobs: dark bog-brown and olive-black bodies, pallid toad-belly cream undersides;
  accent: wet poison chartreuse (spit, warts, witch-light) — small areas only, always
  dimmer than the bog-pool hazard rim.
- Contrast: value — mobs darker and glossier than the ground, pale bellies flash on
  movement.
- Avoid: dry/dusty texture (everything here is wet), bright blue, clean whites.

### Cave (T1)

- Backdrop `#0c0c0f` · map `#1a1a24`
- Ground: charcoal floor `#181922`–`#23252c` · patrol path `#4d423d`
- Ground words: near-black desaturated charcoal, unlit, no warm tones
- Mobs: pale chitin grey, dun brown, bone-pale plating — mid-value bodies that pop off
  the near-black floor; accent: a colorless pale glint (eyes, chitin highlights). Cave
  is the deliberately *colorless* biome; its danger reads through silhouette.
- Contrast: value, hard — the floor is the darkest T1 surface, so mobs are the lightest
  T1 roster.
- Avoid: dark bodies (invisible), any strong hue (would break the unlit mood), bright
  white (reserve the top value band for bone props).

### Desert (T2)

- Backdrop `#1a1608` · map `#5a4010`
- Ground: pale sand `#dcbd88` · cracked hardpan `#9d8c7c`
- Ground words: pale muted gold-tan, soft grey undertone, no vivid orange
- Mobs: sun-baked umber, terracotta, dusty dark gold bodies; accent: regal sun-amber
  (crowns, sun-marks — the desert royals' FX are already `#eecc66`/`#ffcc33` gold).
- Contrast: value — mobs clearly darker than the palest ground in the game.
- Avoid: pale tan bodies (vanish into sand), bones (wasteland's identity), green.

### Jungle (T2)

- Backdrop `#081508` · map `#0c3014`
- Ground: damp floor `#282c1f` · dense overgrowth `#17231b` (darkest floor in the game)
- Ground words: deep shadowed jungle green, darker and richer than forest
- Mobs: deep green-brown and dark russet fur — *near*-camouflage on purpose (ambush
  law), but every mob carries the accent: dusky crimson (markings, eyes, snake
  patterning, the flower-accent prop echoes it).
- Contrast: deliberate low-contrast bodies + high-contrast crimson accent; the accent IS
  the readability. Check extra carefully against the elite outline here.
- Avoid: bright green, plains/desert warm tans, full-body high contrast (breaks the
  ambush mood).

### Tundra (T2)

- Backdrop `#0e1218` · map `#222e48`
- Ground: snow `#d7e1ec` · wind-polished ice `#75899c`
- Ground words: pale cool white-grey, muted blue-grey ice, no glare
- Mobs: the inverted biome — bodies go DARK: slate blue-grey, dark walnut fur, storm
  grey (the palest ground demands the darkest mobs). "White" animals like an ice bear
  read as cold grey-blue with dark face/claws, never actual white. Accent: glacial pale
  cyan (breath, frost armor — matches the existing `#88ddff` frost FX).
- Contrast: value, inverted from every other biome.
- Avoid: white or pale bodies, warm hues (the biome's coldness is its identity).

### Volcano (T3)

- Backdrop `#1a0808` · map `#4a1010`
- Ground: dark basalt `#2f2627` · lava field `#793120` (functional — owns bright orange)
- Ground words: near-black charcoal, warm ashen undertone
- Mobs: dark basalt and ash-grey bodies with cooled-crust texture; accent: ember
  orange-red glow (seams, mouths, salamander bellies) — always dimmer than the lava
  sheet, small areas only.
- Contrast: value (mid-dark mobs on near-black) + the ember accent.
- Avoid: large glowing areas (hazard confusion), cool hues, brown-earth tones (this is
  burnt ground, not dirt).

### Trench (T3)

- Backdrop `#001a4d` · map `#001a4d`
- Ground: navy silt `#1d2e44` · biolume field `#184959` (functional glow)
- Ground words: deep desaturated navy, clearly blue not grey, no warm tones
- Mobs: abyssal blue-black and deep violet-blue bodies, pale grey-blue underbellies;
  accent: bioluminescent teal-cyan (lures, eyes, fin edges) — brighter than the ground's
  biolume field is allowed, because down here the mobs ARE the light sources.
- Contrast: the accent does the work (lures/eyes), bodies stay barely-visible on
  purpose; pale underbellies flash on turns.
- Avoid: warm colors entirely, bone-pale is reserved for the whale-fall props.

### Wasteland (T4, biomeGroup id still `graveyard`)

- Backdrop `#0c0810` (violet-tinted) · map `#1e0e2a`
- Ground: blighted earth `#4b453d` · drifted ash `#a39ea3`
- Ground words: dead grey-brown, bruised grey-violet taint, thin plague-green veining
- Mobs: undead — dirty bone grey, desiccated grey-brown flesh, tattered near-black;
  shadows shade toward bruised violet (never neutral grey). Accent: necrotic plague
  green (eye sockets, exposed ribs' glow, contagion drips) over the violet undertone.
- Contrast: value against the mid-grey ground + the only green-glowing accent in the
  late game.
- Avoid: clean white bone (everything is dirty), swamp's yellow-green (wasteland's green
  is greyer and dryer), warm living-flesh tones.

### Abyss (endgame, sketch only)

- Backdrop `#0a0014` · map `#0a0014`. No ground art yet. Direction: void-black with the
  Overlord's violet (`#7733bb`/`#bb66ff` summon FX already establish it). Define
  properly when abyss art is authored.

---

## Workflow

- New mob batch: copy the biome's mob palette words into every prompt in the batch, state
  the contrast axis in the manifest notes, and eyeball candidates against the biome's
  ground sheet (the gallery on a neutral background lies to you).
- Palette drift found in-game beats this doc — fix the doc, then regen the outlier.
- When a proposed palette locks (first accepted batch), mark it **LOCKED** here with the
  date, like Plains.
