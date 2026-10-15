# ICONS-2A report
**Agent:** Codex   **Branch:** rw/icons-2a   **Last commit:** 08ccf4e5d509ced1af207794a030521d788c940d (assets and review sheet; this report follows it)
**Date:** 2026-10-15

## Done

- Added all 70 requested runtime PNGs: 52 class pieces (20 Striker, 17 Squire, 15 Apprentice) and 18 discipline crests (15 generated, three copied).
- Used built-in OpenAI image generation, exactly one icon per call: 67 first passes and four targeted revisions, 71 generated images total. No generated icon sheets.
- Preserved every generated full-resolution source at 1254 x 1254 under the local ignored `art/candidates/openai-icons/class-pieces/` or `disciplines/` directories. The four rejected first attempts remain under `art/candidates/openai-icons/rejected/`, excluded from export.
- Added only `['disciplines', 96, 54]` to `tools/prepare-openai-icon-previews.cjs`. Its existing class-piece group exports 64 px PNGs; discipline exports are 96 px. Both resize directly from full resolution with Lanczos and a 256-color palette, without backdrop flattening.
- Copied the three shipped Striker frame crests unchanged, with byte-for-byte verification.
- Committed [icons-2a-review.png](icons-2a-review.png): 924 x 1810, showing all 70 new files at 44 px for pieces and 54 px for crests, alongside all 60 shipped Tier 1 pieces and trophies.
- Reviewed every generated full-resolution result, all new runtime PNGs at their native 64/96 px sizes, and every icon at its 44/54 px acceptance size. The final large sheet was inspected in unscaled crops to preserve the exact pixel sizes.

### References and prompts

Every successful generation attached the four full-resolution same-class Tier 1 references below, plus the original sweep, charge, brace and slam anchors. Conduit uses its Tier 1 Soul trophies. All source reference files were read from the main checkout without modification.

| Class | Four Tier 1 references |
|---|---|
| striker | `striker-finisher`, `striker-rend`, `striker-focus`, `striker-coil` |
| squire | `squire-shove`, `squire-riposte`, `squire-steel-will`, `squire-guard` |
| apprentice | `apprentice-numb`, `apprentice-siphon`, `apprentice-seize`, `apprentice-converge` |
| slinger | `slinger-plain-clip`, `slinger-scatter`, `slinger-snare`, `slinger-breaching` |
| spirit | `spirit-bolt`, `spirit-chain-lightning`, `spirit-thunderclap`, `spirit-eye-of-the-storm` |
| conduit | `conduit-relic-plains`, `conduit-relic-forest`, `conduit-relic-mountain`, `conduit-relic-cave` |

The built-in tool accepts at most five image paths. To include all references, the four Tier 1 sources were composited, without resizing, into a 2508 x 2508 reference board (four 1254 px quadrants). Ability calls attach that board plus the four original anchor images. Crest calls attach the class board, sweep, an unscaled board of all four original anchors, and the class-root crest. Revisions also attach the previous full-resolution target; every required reference remains included. Reference boards are inputs only.

Crest lineage anchors: Squire `classes/cooldown.png`, Apprentice `classes/dot.png`, Slinger `classes/reload.png`, Spirit `classes/energy.png`, Conduit `classes/summoner.png`.

Prompts follow the guide's `Use case / Asset type / Primary request / Composition / Color palette / Style / Constraints / Avoid` structure. Each supplies the subject and palette in the tables below and explicitly requests:

> A new icon from the same set as the reference icons: match their rendering, lighting, level of detail and backdrop exactly.

They require one bold centered silhouette, broad semi-painterly materials, dramatic rim light, generous dark padding and an opaque edge-to-edge near-black `#11161d`-family backdrop. They exclude text, letters, numbers, borders, frames, logos, watermarks, humanoid figures, background scenes, tiny filigree and modern firearms. Abstract sigils are geometric shapes rather than writing. Crest prompts specify 96 px output use and 54 px readability, inheriting the class lineage while changing the discipline silhouette.

Exact prompts and input paths are retained in local ignored `art/candidates/openai-icons/icons-2a-prompts.json` and the per-ID JSON files beside the sources. The per-ID files include the actual call prompt and generated output path; `*-revision.json` records the correction prompt, references, output path and rejection reason. The final technical audit is `art/candidates/openai-icons/icons-2a-validation.json`.

### Class pieces (52)

Full-resolution sources: `art/candidates/openai-icons/class-pieces/<id>.png`.
Committed runtime assets: `client/public/assets/concept-icons/class-pieces/<id>.png`.

| ID | Accepted subject | Palette | Regenerated |
|---|---|---|---|
| `striker-whirlwind` | one polished steel sword surrounded by three broad separated circular cutting crescents, a triple spin | polished steel, pale white-cyan motion | No |
| `striker-feint` | a real short steel blade angled right with a dim displaced false blade silhouette veering left and one sharp glint on the real point | polished steel, smoke grey, restrained pale cyan | No |
| `striker-armor-break` | a steel blade biting a heavy armor plate, opening one broad jagged glowing crack | polished steel, iron charcoal, hot white fracture | No |
| `striker-concuss` | a blunt steel pommel striking a dark stone knob with one compact starburst and two short dazed arcs | polished steel, white impact, muted amber | No |
| `striker-charge` | a low forward-thrusting sword point with two long parallel speed trails behind it | polished steel, pale cyan streaks, white tip | No |
| `striker-pin` | a short broad steel pin driven through a thick iron shackle lying flat over a stone wedge, clamping it firmly; sideways T-shaped pin head, no sword, no impact starburst | polished steel, sandstone, pale white impact | Yes - Pin resembles the shipped Finisher's downward sword impact at 44px; replace the burst with a visibly anchored clamp/spike silhouette. |
| `striker-earthsplitter` | a broad sword striking vertically into a narrow stone wedge split by one long straight luminous fissure | polished steel, slate grey, amber-white fissure | No |
| `striker-upheaval` | three broad angular rock teeth thrusting upward together from a compact shattered base | slate stone, polished silver edges, amber-white uplift | No |
| `striker-hemorrhage` | one deep broad hooked steel-edged gash releasing a single heavy elongated blood drop | polished steel, deep crimson, blood red | No |
| `striker-triple-cut` | exactly three separated parallel short crescent blade slashes angled diagonally, evenly spaced | polished steel, bright white edges, restrained pale cyan | No |
| `striker-shadowstep` | a steel dagger emerging tip-first from a folded crescent of dark smoke, with a fading displaced dagger echo behind it | polished steel, smoke charcoal, faint violet edge | No |
| `striker-icebreaker` | a broad steel wedge sword cleaving a thick cyan ice shell into two large halves | polished steel, pale cyan, white fracture | No |
| `striker-overheat` | a sword blade heated orange-red at its core with three short fast trailing streaks and dark steel edges | polished steel, orange-red heat, hot white core | No |
| `striker-avalanche` | a heavy wedge-shaped steel blade driving horizontally through three staggered slate chunks in one forceful surge | polished steel, slate grey, white motion | No |
| `striker-frostbind` | a low radial cluster of three thick ice roots clamping a central steel spike, each root clearly separated | polished steel, pale cyan frost, cold white | No |
| `striker-bloodrush` | an upright steel sword hilt crossed by one rising crimson pulse ribbon and two short speed strokes | polished steel, vivid crimson, white pulse | No |
| `striker-coup-de-grace` | a downward pointed narrow execution blade poised over a small cracked crimson gem with one final bright point of contact | polished steel, deep crimson, hot white tip | No |
| `striker-magma-breaker` | a broad steel blade splitting a thick obsidian shell, with one compact outward ring of molten impact | polished steel, obsidian, magma orange-red | No |
| `striker-reaping-arc` | a single long steel scythe blade drawing one broad low crescent slash, with a few bone chips at its end | polished steel, bone ivory, faint grave green | No |
| `striker-pressure-point` | a narrow steel blade tip touching the single luminous center of a dark round armor boss, with two inward compression arcs | polished steel, deep brine blue, focused white glint | No |
| `squire-stand-fast` | a broad iron tower shield wedged firmly down, stopping one thick incoming orange impact streak dead at its face | heavy iron, ember orange, white impact | No |
| `squire-unshaken` | an upright clenched iron gauntlet breaking a thick restraint chain into two large separated pieces | heavy iron, ember-orange seams, dark chain | No |
| `squire-splitting-blow` | a heavy iron warhammer cutting a shield-shaped barrier into two broad halves | heavy iron, ember orange, white fracture | No |
| `squire-earthstamp` | a single heavy iron boot stamping a compact stone disk with a broad upward shock ripple | heavy iron, stone grey, ember-orange fissure | No |
| `squire-watchful` | an iron shield with one bold almond-shaped glowing watchful eye embossed on its face, intercepting a short thorn-like strike | heavy iron, ember-orange eye, dark vine green | No |
| `squire-challenge` | a compact iron battle horn with a wide flared mouth and two thick inward-curving ember sound hooks | heavy iron, ember orange, muted desert brass | No |
| `squire-anchor` | a heavy iron anchor planted in a compact stone footing, its short taut chain pulling upward while the anchor holds | heavy iron, ember-orange rim, bog-grey stone | No |
| `squire-chain-hook` | one large hooked iron chain head curling forward with three broad separated links trailing behind | heavy iron, ember-orange edge, dark steel | No |
| `squire-frostward` | a broad iron shield enclosing a single cold cyan crystal, an ember rim holding frost at the shield edge | heavy iron, pale cyan ice, restrained ember orange | No |
| `squire-backdraft` | a heavy iron shield face reflecting a single orange flame in a bold return curl back toward its source | heavy iron, ember orange, fire orange-red | No |
| `squire-disarm` | an iron gauntlet clamping and twisting a sword at its crossguard, the blade forced downward and off its attack line | heavy iron, ember-orange grip, silver blade | No |
| `squire-lay-to-rest` | an iron warhammer pinning one cracked ivory skull down with a small fading grave-light wisp | heavy iron, bone ivory, ember orange, muted grave green | No |
| `squire-lie-in-wait` | a heavy iron hammer held above a compact deep-blue wave notch, with a tightly banked ember core in the head | heavy iron, ember orange, deep brine blue | No |
| `squire-parry` | two clean opposing steel blades crossing at a broad bright stopped impact spark, the defending blade heavy iron | heavy iron, silver flash, ember-orange spark | No |
| `squire-intercept` | two offset iron shields, a large forward shield catching a diagonal impact ahead of a smaller protected shield | heavy iron, ember-orange leading rim, muted blue ward | No |
| `squire-unbowed` | a broad iron breastplate with one reinforced doubled central plate absorbing a white-orange impact without cracking | heavy iron, ember-orange seams, white impact | No |
| `squire-last-breath` | a battered iron visor releasing one broad emerald breath curl from its mouth slit, its dim ember core rekindling | heavy iron, emerald #1f9b65, mint-green #49d89a, pale green #a4efca, restrained ember-orange rim | Yes - Last Breath's healing breath rendered lime/acid green at 44px; healing must use emerald and remain distinct from poison. |
| `apprentice-wither` | one drooping thorned leaf curled around a cracked violet geometric sigil, leaking one sharp acid-green drop | violet sigil, acid green, desaturated brown-green | No |
| `apprentice-fuse` | one thick violet carved sigil stone with a short burning fuse curling into its orange core | violet sigil, orange-red fire, hot white ember | No |
| `apprentice-cold-snap` | a single broad icy sigil crystal bursting into three thick outward frost prongs | violet sigil, pale cyan, cold white | No |
| `apprentice-blast-back` | one violet sigil detonating against a blunt incoming wedge, its compact orange blast curling back away from the sigil | violet sigil, orange-red, white impact | No |
| `apprentice-sear` | one orange-hot violet sigil branded through a dark shield plate, leaving a single broad molten hole | violet sigil, orange-red fire, charcoal iron | No |
| `apprentice-seep` | a bold acid-green drop bearing one violet geometric sigil passing downward through a thick dark stone slab | violet sigil, acid green, cave charcoal | No |
| `apprentice-snag` | a violet sigil stone caught tightly inside two thick hooked cyan ice roots | violet sigil, pale cyan, cold white | No |
| `apprentice-recoil` | a compact concave dark mirror-shield carrying one violet sigil, reflecting a single thick hooked acid-green curse dart in a tight U-turn away from its surface | violet sigil, acid green, hostile charcoal | Yes - At 44px Recoil and Transference both read as a curved green transfer between points; Recoil needs a distinct compact reflection silhouette. |
| `apprentice-spore-burst` | one large violet-capped poison spore pod splitting open and throwing three broad acid-green spore lobes outward | violet sigil glow, acid green, bog charcoal | No |
| `apprentice-signal-fire` | two separated orange flame sigils, a larger foreground blaze launching one long bright fire streak into a smaller distant blaze | violet sigil cores, orange-red fire, hot white | No |
| `apprentice-melt` | one orange burning sigil melting through a thick cyan ice cuff, with one broad water drop beneath | violet sigil, orange-red heat, pale cyan ice | No |
| `apprentice-cinderfall` | one heavy burning violet sigil fragment falling downward into a broad compact orange blast crown | violet sigil, orange-red fire, obsidian | No |
| `apprentice-frostcrack` | a violet sigil lodged in a thick cyan ice shell split into two large clean jagged halves | violet sigil, pale cyan, cold white | No |
| `apprentice-pyre` | one ivory skull crowned by a compact orange flame bearing a violet sigil, one small ember escaping sideways | violet sigil, orange-red fire, bone ivory | No |
| `apprentice-transference` | a sharp acid-green debuff shard travelling along one broad curved stream from a dim cracked violet sigil into a bright solid violet sigil | violet sigil, acid green, deep brine charcoal | No |

### Generated discipline crests (15)

Full-resolution sources: `art/candidates/openai-icons/disciplines/<id>.png`.
Committed runtime assets: `client/public/assets/concept-icons/disciplines/<id>.png`.

| ID | Accepted subject | Palette | Regenerated |
|---|---|---|---|
| `squire-avenger` | a single heraldic sword rising in front of a split iron shield, one broad returning slash curling around the blade | heavy iron, ember-orange rim, silver counter flash | No |
| `squire-bulwark` | a single broad crenellated iron tower shield with a thick blue ward hugging its silhouette and three inward ember sparks | heavy iron, ember-orange lineage, restrained ward blue | No |
| `squire-juggernaut` | a massive squat iron warhammer head fused with layered armor plates, its central seam glowing like a banked forge | heavy iron, ember orange, molten white-orange core | No |
| `apprentice-poison` | a heraldic three-lobed thorned poison bloom opening around one violet sigil and a single large acid-green droplet | violet sigil, acid green, hostile dark green | No |
| `apprentice-fire` | a heraldic three-tongued compact flame crown around one violet sigil, the side flames connected to the central spark | violet sigil, orange-red fire, hot white ember | No |
| `apprentice-frost` | a single broad faceted ice spearhead sigil splitting through a thick crystalline shell | violet sigil, pale cyan, cold white | No |
| `slinger-gunslinger` | a symmetrical pair of low-tech fantasy flintlock pistols crossing outward, blackened steel barrels and brass cylinders with a short reload spin curl | blackened steel, brass, restrained amber light | No |
| `slinger-siege` | a squat heavy fantasy mortar barrel mounted above a broad brass ammunition drum, one compact banked charge at its mouth | blackened steel, brass, ember-orange charged muzzle | No |
| `slinger-trickshot` | one elegant long low-tech fantasy pistol crossed by a single gold bullet following a pronounced curving impossible-shot trail | blackened steel, brass, gold tracer | No |
| `spirit-overflow` | an open storm vessel brimming with white-blue lightning that arcs outward in three broad forks over its rim | storm violet, white-blue lightning, dark glass | No |
| `spirit-tide` | two opposing tidal crests joined at a short waist into an open heraldic S silhouette, a bright upper wave surging right and a darker lower wave receding left | storm violet, pale grey-blue wave, white-blue lightning | Yes - Tide's closed spiral closely resembled the shipped Eye of the Storm at 54px; revise to an open ebb-and-surge silhouette. |
| `spirit-reservoir` | a deep sealed dark storm vessel holding a massive white-blue bolt behind thick dam-like shoulders, one concentrated release point below | storm violet, white-blue lightning, dark glass | No |
| `conduit-swarm` | a compact heraldic cluster of five clearly separated small spectral beast heads flooding forward together, broad simple jaws and ears | spectral teal ghost-fire, pale mint eyes, deep charcoal | No |
| `conduit-pack` | three clearly distinct spectral beast heads united in one heraldic crest: horned shield-like head, sharp wolf head, narrow beaked head, all converging toward one point | spectral teal ghost-fire, pale mint edges, deep charcoal | No |
| `conduit-elite` | two large spectral champion beast heads with broad armored brows and short crown-like horn ridges joined as one imposing heraldic silhouette | spectral teal ghost-fire, pale mint eyes, dark stone armor | No |

### Copied discipline crests (3)

| ID | Subject | Palette | Source | Regenerated |
|---|---|---|---|---|
| `striker-light` | Existing Light frame's paired blades on a shield | Steel, dark iron, muted red | `frames/cadence-light.png` | No - unchanged 96 px copy |
| `striker-balanced` | Existing Balanced frame's sword and axe on a shield | Steel, dark iron, muted red | `frames/cadence-balanced.png` | No - unchanged 96 px copy |
| `striker-heavy` | Existing Heavy frame's heavy axe on a shield | Steel, dark iron, muted red | `frames/cadence-heavy.png` | No - unchanged 96 px copy |

### Targeted revisions (4)

| ID | Rejected first pass | Accepted correction |
|---|---|---|
| `striker-pin` | Downward sword impact resembled the shipped Finisher at 44 px. | Anchored shackle and pin; removed the radial impact burst. |
| `squire-last-breath` | Healing breath was lime/acid green and read as poison at 44 px. | Emerald healing flow, with green highlights and fewer poison-like shards. |
| `apprentice-recoil` | Curved transfer resembled Transference at 44 px. | Compact sigil mirror reflecting one hooked curse dart in a U-turn. |
| `spirit-tide` | Closed spiral resembled the shipped Eye of the Storm at 54 px. | Two opposing open wave crests for ebb and surge. |

Every accepted revision was re-exported and checked again at its in-game size.

## Checks

- `pnpm typecheck`: clean, exit 0; includes all workspace packages, bench and test TypeScript checks. Run before both commits, as required.
- `pnpm --filter @mmo-idle/client build`: passed, exit 0; Vite transformed 1067 modules and built successfully. Only the existing large-chunk warning was emitted.
- `node tools/prepare-openai-icon-previews.cjs`: passed; prepared all 67 source-derived images and included the three direct Striker copies on the review sheet.
- Asset audit: all 67 generated IDs match the ICONS-2A tables exactly; 52 new 64 x 64 class-piece PNGs and 18 new 96 x 96 discipline PNGs including the three copies, with no missing or extra task assets.
- Generated sources: all 67 accepted sources are 1254 x 1254. All 67 generated runtime derivatives are fully opaque. All three copied crests are byte-identical to their shipped frame originals.
- Visual checks: full-resolution subject and style; native 64/96 px output; exact 44/54 px silhouettes, school palettes, backdrop, lack of text/frame and distinction within each family. Reviewed new and shipped Tier 1 icons side by side. All four corrected icons passed re-review.
- Review copy: byte-identical to the preview script's generated 924 x 1810 PNG.
- `git diff --check`: clean. The only existing tracked file changed is the preview script, with one line added and no line-ending conversion. Existing runtime icons remain unchanged.
- No test substrings were named in the brief. No gameplay test suite, server, bot or browser play session was run; this is static asset and size-review evidence.

## Not done, or unsure

- No unfinished work within ICONS-2A.
- Client lookup and class-screen wiring belong to the separate class tasks, as the brief directs. Integrated-game acceptance remains with those tasks.
- Full-resolution sources, exact prompts, rejected attempts, reference boards and audit helpers remain local and ignored; the runtime PNGs, preview-script addition, review sheet and this report are committed.
- ICONS-2B's pieces, trophies and round-color choices are outside this task.

## Files outside the brief I needed (not edited)

- None needed editing.
- Read the agent rules, CLAUDE.md, Tier 1 brief, icon-generation guide, relevant bible sections and PixelLab README.
- Read the named full-resolution reference icons in the main checkout only.
