# ICONS-T1: icons for every Tier 1 piece and trophy

**Agent:** Codex, using its built-in OpenAI image generation · **Worktree:** `../mmo-rw-icons-t1`
· **Branch:** `rw/icons-t1` (from `rework/class-first`) · **Size:** M (52 generated, 8 copied) ·
**Phase 0, wave A** (independent of every code task)

**Read first:** `docs/briefs/class-first-build/AGENT-RULES.md`;
`design_docs/visual_and_aesthetics_design/openai-icon-generation.md` (**the recipe: follow it
exactly**); `tools/prepare-openai-icon-previews.cjs`. For what each piece does in the game:
`design_docs/class-first-bible.md` §7.4/§7.8 (Conduit), §8.4/§8.9 (Squire), §9.4/§9.9
(Apprentice), §10.4 (Slinger), §11.4/§11.9 (Spirit), §12.4 (Striker).

## Why

Every class gets a new kit: pieces it learns from the T1 biomes (techniques, responses,
payoffs, clip types, spends) and a trophy from each T1 boss. They need icons in **the same art
style as the icons the game already ships** (the abilities, stances, rites and statuses in
`client/public/assets/concept-icons/`), so the new kit looks like it belongs.

## Style: match what we already have

- **Look at the existing icons first** and match them: modern semi-painterly fantasy game
  icon, one centered bold silhouette, dramatic rim lighting, rich but broad material detail,
  strong value separation, dark charcoal near-black full-square backdrop edge to edge
  (`#11161d` family), readable at 32–52 px. No words, letters, numbers, logo, watermark,
  border, UI frame, transparent checkerboard, humanoid figures or background scene.
- **Attach these as style references to every generation** (full-resolution, in the main
  checkout, read-only; don't modify them):
  `C:\Users\osaif\Documents\Claude\Projects\MMO idle\art\candidates\openai-icons\abilities\sweep.png`,
  `...\abilities\charge.png`, `...\abilities\brace.png`, `...\abilities\slam.png`.
  Say in the prompt: "match the rendering, lighting, level of detail and backdrop of the
  reference icons exactly; a new icon from the same set."
- **Trophies** are boss rewards: same style, plus **one thin warm-gold glint** on the subject's
  key edge, the same small accent on all 30, never a frame or badge.
- **Colour language** (from the guide): poison acid green, healing emerald, fire orange-red,
  frost pale cyan, rot brown-green, void violet. Each class keeps one anchor so its set reads
  together: **Striker** polished steel; **Squire** heavy iron with ember-orange light;
  **Apprentice** violet sigil runes plus its school's colour; **Slinger** blackened steel and
  brass, each clip type in its own colour (below); **Spirit** white-blue lightning on storm
  violet; **Conduit** Souls as spectral teal ghost-fire.
- **Slinger clip colours** (the HUD ring will use the same ones): plain gunmetal `#9aa3ad`,
  Scatter amber `#f2a33a`, Snare teal `#39c9b8`, Venom acid green `#8fdc3c`, Stopping cobalt
  `#4a78ff`, Breaching ember red `#ff5a3c`; trophy rounds gold `#f5c542`.
- One image per generation call, never a sheet. Prompt structure: the guide's "Use this
  prompt structure" block, with `Asset type: fantasy MMO class ability icon displayed at 44px`
  (or `boss trophy icon displayed at 44px`).

## Where files go

- Full-resolution (1254×1254) results: `art/candidates/openai-icons/class-pieces/<id>.png` and
  `art/candidates/openai-icons/trophies/<id>.png` in your worktree (that folder is gitignored:
  it stays local).
- Add two groups to `tools/prepare-openai-icon-previews.cjs`: `['class-pieces', 64, 44]` and
  `['trophies', 64, 44]` (no dark-backdrop flattening, like `abilities`). Make the script skip a
  group whose source folder doesn't exist instead of throwing. Then run
  `node tools/prepare-openai-icon-previews.cjs`: it writes the shipped 64 px files to
  `client/public/assets/concept-icons/class-pieces/` and `.../trophies/` and the review sheet.
- Copy the review sheet `art/candidates/openai-icons/contact-sheets/downscale-review.png` to
  `docs/briefs/class-first-build/reports/icons-t1-review.png` (committed, so the conductor and
  the designer can review it).
- **Filenames are the ids below, exactly.** Don't wire anything into the client code: the
  class tasks do that.

## Reused, not generated (8)

Copy these. Where a full-resolution source exists in the main checkout's
`art/candidates/openai-icons/abilities/`, copy it to your `class-pieces/<id>.png` source so
the script makes the 64 px file; otherwise copy the shipped 64 px file from
`client/public/assets/concept-icons/abilities/` straight to
`client/public/assets/concept-icons/class-pieces/<id>.png`.

| id | from |
|---|---|
| `striker-sweep` | `sweep` (full-res exists) |
| `striker-hamstring` | `hamstring` (64 px only) |
| `striker-coil` | `charged-strike` (full-res exists) |
| `squire-slam` | `slam` (full-res exists) |
| `squire-guard` | `brace` (full-res exists) |
| `squire-shield-bash` | `stunning-strike` (64 px only) |
| `apprentice-detonate` | `detonate` (64 px only) |
| `apprentice-spread` | `contagion` (64 px only) |

## Generate: pieces (22) → `class-pieces/`

| id | Name | What it does | Subject | Palette |
|---|---|---|---|---|
| `striker-finisher` | Finisher | the plain big blow that ends every combo | a heavy downward blade strike landing in a bright starburst impact | polished steel, hot white impact |
| `striker-rend` | Rend | a bleed | three ragged diagonal cuts with dark blood droplets falling from them | crimson, deep red, steel |
| `striker-focus` | Focus | opening cast: the combo swings faster | an upright sword hilt inside a thin circular aura with short speed streaks around it | steel, pale cyan |
| `squire-shove` | Shove | three or more enemies on you: shove them all back a step with the shield | a tower shield thrust forward, three short red chevrons driven away from its face | iron grey, ember-orange edge light |
| `squire-riposte` | Riposte | the third hit one enemy lands on you, you strike it back at once | a sword's curved return slash looping back after a bright parry spark | steel, orange spark |
| `squire-steel-will` | Steel Will | spend Resolve to shake off a poison or bleed | a clenched iron gauntlet flinging off green poison droplets and one red blood drop | iron, toxic green, ember |
| `apprentice-numb` | Numb | Frost: spend a target's sigils to slow its attacks and movement | a clawed hand gripped by frost crystals, a pale violet sigil glowing on its back | ice cyan, violet |
| `apprentice-siphon` | Siphon | Poison: spend a target's sigils to heal yourself | green-violet motes streaming out of a cracked sigil into a glowing emerald heart | violet, poison green, healing emerald |
| `apprentice-seize` | Seize | Frost: spend sigils to hold an enemy, breaking its wind-up | an icy violet chain clamping a raised fist mid-swing | ice cyan, violet glow |
| `apprentice-converge` | Converge | Fire: pull the sigils of nearby enemies onto one target | small fire sigils streaking inward to one bright burning central sigil | orange-red, ember |
| `slinger-plain-clip` | Plain clip | the damage clip, no special rounds | a revolver cylinder seen end-on, six plain rounds with brass rims | gunmetal `#9aa3ad`, brass |
| `slinger-scatter` | Scatter | each round bursts, nicking two enemies beside the target | one bullet bursting into a fan of glowing fragments | amber `#f2a33a`, steel |
| `slinger-snare` | Snare | each round slows the target a little, up to a cap | a bullet trailing two weighted bola tendrils | teal `#39c9b8`, steel |
| `slinger-venom` | Venom | each round adds a poison | a bullet whose tip drips glowing venom | acid green `#8fdc3c`, steel |
| `slinger-stopping` | Stopping | each round shoves the target back a little | a flat-nosed heavy slug with bold impact shove lines | cobalt `#4a78ff`, steel |
| `slinger-breaching` | Breaching | rounds ignore most of the target's plating | a pointed round punching through a steel plate | ember red `#ff5a3c`, steel |
| `spirit-bolt` | Bolt | the starting spend: a single bolt of lightning | one crisp jagged lightning bolt | white-blue, violet glow |
| `spirit-chain-lightning` | Chain Lightning | leaps from the target to the 3 nearest enemies | a lightning bolt jumping between four bright points in a zig-zag chain | white-blue, violet |
| `spirit-thunderclap` | Thunderclap | staggers every enemy around you | a white-blue shockwave ring bursting outward from a bright center | white-blue, storm violet |
| `spirit-downpour` | Downpour | washes a poison or bleed off you | a curtain of blue rain washing green poison drops away | rain blue, poison green |
| `spirit-eye-of-the-storm` | Eye of the Storm | while your storm is low, hits drain it at half cost | a calm clear circle at the center of a swirling storm spiral | storm violet, pale blue |
| `spirit-thunderbolt` | Thunderbolt | one costly bolt that hits a single enemy very hard and staggers it | one massive jagged bolt striking a single point in a heavy flash | white, electric blue |

## Generate: trophies (30) → `trophies/`

Each with the thin warm-gold glint.

| id | Name | What it does | Subject | Palette |
|---|---|---|---|---|
| `striker-relic-plains` | Wide Arc | the next combo's beats each also strike an enemy beside the target | one bright slash arc that branches into a second, smaller arc sideways | electric blue, steel |
| `striker-relic-forest` | Double Slash | every beat of the next combo strikes twice | two parallel crescent slashes, one just behind the other | pale green-white, steel |
| `striker-relic-swamp` | Festering Cut | the finisher's wound rots, dealing part of its damage again | one deep gash oozing rot with small rising bubbles | rot brown-green, dark red |
| `striker-relic-mountain` | Skyfall | the finisher becomes a long wind-up and a blow about twice as big | a greatsword plunging straight down from the sky trailing a long streak, cracking the ground | amber, stone, steel |
| `striker-relic-cave` | Sunder | the target takes more damage from everyone for a few seconds | a blade cleaving a dark breastplate, the crack glowing red | obsidian, red glow |
| `squire-relic-plains` | Muster | every enemy that joins the fight fills your Resolve | a battle horn with rings of sound, small glowing pips drawn toward it | iron, ember orange |
| `squire-relic-forest` | Relentless | the slam fires at a third of the bar, each one soon after the last a bit bigger | three shield-slam impact rings in a quick row, each larger than the last | iron, ember orange |
| `squire-relic-swamp` | Rot-Eater | poison and bleed on you fill Resolve as if they were hits | an iron shield drinking a stream of green poison into a glowing orange core | iron, toxic green, ember |
| `squire-relic-mountain` | Faultline | the slam runs as a shockwave down a line through the target and everything behind it | a hammer striking the ground, one straight glowing crack running away into the distance | stone grey, lava orange |
| `squire-relic-cave` | Corrode | each slam strips plating from what it hits, stacking | an armor plate dissolving in green corrosion where a hammer struck | iron, acid green |
| `apprentice-relic-plains` | Outbreak | a Spread passes to two neighbours | one sigil splitting into two smaller sigils along branching lines | poison green, violet |
| `apprentice-relic-forest` | Firstbrand | the first hit on an enemy with none of your sigils lays three | three sigils branded at once in a tight glowing triangle | violet, hot white |
| `apprentice-relic-swamp` | Glut | Siphon also drains every enemy near the target | a central vessel drawing glowing streams in from four directions | violet, poison green |
| `apprentice-relic-mountain` | Petrify | a Seize lasts longer and the held enemy takes more damage | a fist turned to cracked grey stone, gripped by frosty violet runes | stone grey, ice cyan, violet |
| `apprentice-relic-cave` | Brood Sigils | an enemy carrying three or more of your sigils grows one more every 2 s | a cluster of sigil eggs, one hatching a new glowing sigil | violet, dark obsidian |
| `slinger-relic-plains` | Stampede Round | the last round knocks the target and everything in a line behind it back | a gold round driving a wedge of dust and chevrons back in a straight line | gold `#f5c542`, dust brown |
| `slinger-relic-forest` | Twin Round | the last round fires twice | two gold bullets flying side by side | gold, steel |
| `slinger-relic-swamp` | Rot Round | the last round's wound rots, hitting again over a few seconds | a gold bullet leaving a rotting trail | gold, rot brown-green |
| `slinger-relic-mountain` | Quake Round | a heavy slug that hits everything around the target | a fat gold slug slamming into cracked ground with a circular shockwave | gold, stone |
| `slinger-relic-cave` | Splinter Round | the last round splits into three that strike the nearest other enemies | a gold bullet splitting into three diverging splinters | gold, steel |
| `spirit-relic-plains` | Crosswind | every spend also strikes the 2 enemies nearest its target | a central bolt with two side gusts curving out to strike left and right | white-blue, pale wind |
| `spirit-relic-forest` | Squall | each spend soon after the last costs a little less | three lightning flicks in quick succession, each thinner than the last | white-blue, storm violet |
| `spirit-relic-swamp` | Marsh Fire | when hits empty your storm, it bursts, striking everything around you | a cracked glass bottle bursting with eerie marsh-fire wisps | green-blue wisps, glass |
| `spirit-relic-mountain` | Thunderhead | a full storm makes your next spend twice as big | a towering anvil-shaped storm cloud with one huge bolt beneath | dark violet cloud, white bolt |
| `spirit-relic-cave` | Static Web | enemies hit by a spend are charged; your plain zaps hit them twice as hard | a web of crackling static threads around one charged glowing node | electric blue, violet |
| `conduit-relic-plains` | Razortusk Soul | every 10 s all melee summons charge the focus target together | the spectral head of a great tusked boar made of ghost-fire | spectral teal, pale gold eyes |
| `conduit-relic-forest` | Timberclaw Soul | summons slowly heal during a fight | a spectral bear's claw of ghost-fire with leaf-like wisps | spectral teal-green |
| `conduit-relic-swamp` | Mire Behemoth Soul | every summon death leaves a bile pool that hurts enemies | a spectral swamp toad-beast head of ghost-fire dripping bile | spectral teal, bile green |
| `conduit-relic-mountain` | Stoneplate Soul | a tank's taunt also shields it | a spectral horned armored beast's head plated in stone, ghost-fire | spectral teal, stone grey |
| `conduit-relic-cave` | Dreadbore Soul | every 6 s a spiderling appears for 8 s | a spectral spider-borer of ghost-fire with two tiny spiderlings beside it | spectral teal, obsidian |

## Check

- Inspect each shipped 64 px file **at 44 px** on the review sheet: one readable silhouette,
  no text or frame, backdrop matching the old icons. Regenerate any that turn to noise.
- Put the reused and new icons side by side on the review sheet: nothing should look like it
  came from a different set.
- `git diff --numstat` shows only the new PNGs, the script change and your report.
- `pnpm typecheck` clean (the script change must not break anything).

## Don't

- Don't edit or overwrite any existing icon, and don't edit the main checkout.
- Don't wire the icons into `client/src` (the class tasks do), don't add atlas or PixelLab
  manifest entries, don't run `art:generate` (that's PixelLab, a different paid pipeline).

## Report

`docs/briefs/class-first-build/reports/ICONS-T1.md` (shape in AGENT-RULES.md): the list of
ids generated, copied and regenerated (with why), and the committed review sheet.
