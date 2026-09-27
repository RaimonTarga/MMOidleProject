# Boss lineage — art to generate (2026-09-27)

Icons and ground textures the boss-lineage redesign shipped without, for a Codex
image pass. Style, prompt structure and the resize script are in
[`design_docs/visual_and_aesthetics_design/openai-icon-generation.md`](../../design_docs/visual_and_aesthetics_design/openai-icon-generation.md):
one asset per call, dark full-square backdrop, one bold centred silhouette, no text.

Every item below renders today with borrowed art (the "Now" column), so nothing is
broken while it waits. Drop the file at the path given; each one then needs a
one-line wiring change in `client/src/ui/conceptIcons.ts` (or `client/src/sprites.ts`
for ground textures), which is noted per section.

## 1. Status icons — 48 × 48 PNG

Path: `client/public/assets/concept-icons/statuses/debuffs/<file>` (debuffs on you)
or `.../statuses/buffs/<file>` (effects on the boss).

### Boss mechanic debuffs (on you)

All five share one `debuff-boss` tile, which draws `debuff-sundered` today.
Wiring: resolve `debuff-boss` by the buff's `instanceKey` (effect id).

| File | Effect | Now | Subject |
|---|---|---|---|
| `boss-eroded.png` | Eroded (Cave sinkholes: +damage taken per stack) | debuff-sundered | Ground crumbling away under a boot, sand pouring into cracks; dusty ochre and brown |
| `boss-frostbite.png` | Frostbite (Tundra room debuff: Chill builds faster, uncleansable) | debuff-sundered | A hand rimed with creeping frost crystals; pale ice blue on charcoal |
| `boss-brittle.png` | Brittle (Tundra: +damage taken before the Shatter) | debuff-sundered | A cracked ice shard with bright fracture lines about to split; white and cold blue |
| `boss-rend.png` | Rend (Trench tail: +damage taken per stack) | debuff-sundered | Three deep torn lacerations like a barbed tail's rake; dark blood red |
| `boss-depth.png` | Depth (Trench room: every debuff lasts longer, uncleansable) | debuff-sundered | Downward pressure arrows sinking into dark deep water; navy and teal |

### Boss damage-over-time (on you)

These share the `debuff-dot` tile, which draws the poison or burn art today.
Wiring: add each to `MONSTER_DOT_ICON_ALIASES` as `monster-dot:<id>`.

| File | Effect | Now | Subject |
|---|---|---|---|
| `dot-rot-bloom.png` | Rot Bloom (Swamp T3 room rot) | debuff-poison | A rotting flower bursting open in a cloud of green spores; sickly green |
| `dot-simmering-burn.png` | Simmering Burn (Caldera Sovereign room burn) | dot-conflag | Skin glowing with embers and heat shimmer, slow smoulder; deep orange |
| `dot-gorged-venom.png` | Gorged Venom (Mire-Gorged Behemoth) | debuff-poison | A swollen fang dripping thick purple-green venom |
| `dot-rot-spores.png` | Rot Spores (Rot-Spore Croc-Behemoth) | debuff-poison | A cluster of bulbous spore pods puffing spores; olive and yellow-green |
| `dot-venomous-bite.png` | Venomous Bite (Jungle T3/T4 ambush) | debuff-poison | Two fang punctures weeping bright green venom |

### Effects on the boss (target frame)

Wiring: point the alias in `BOSS_EFFECT_ALIASES` at the new file.

| File | Effect | Now | Subject |
|---|---|---|---|
| `boss-phase.png` | Phase tile: the boss's current announced phase (hover for what it does) | monster-howl-haste | A horned beast skull split by a glowing golden crack; gold on charcoal |
| `boss-final-strike.png` | Final Eruption / Cataclysm cast (unevadable arena-wide strike) | dot-conflag | A volcano cone with a white-hot swelling core about to burst; orange and white |
| `boss-cornered.png` | Cornered (Verdant-Crown Predator's last stand) | cadence-rampage | A snarling big-cat face with raised hackles and bared fangs; red |

## 2. Rune condition icons — 48 × 48 PNG

Path: `client/public/assets/concept-icons/runes/conditions/<id>.png`. They draw
nothing today. Wiring: add the id to `CONDITION_IDS`.

| File | Condition | Subject |
|---|---|---|
| `target-shielded.png` | Enemy Shielded: the target has a barrier up | A cracked stone plate over a silhouette, cyan absorb glow |
| `target-escaping.png` | Enemy Escaping: the target is fleeing or dashing away | A fleeing silhouette trailing speed lines and dust |
| `debuff-pile.png` | Debuff Pile: three or more debuffs on you | A stack of three different debuff sigils piled on each other |

## 3. Ground textures — 1024 × 1024 PNG, transparent outside the pool

Path: `client/public/assets/environment/hazards/<file>`, top-down, matching
`poison-pool.png` and `steam-vent.png`. Today every pool below is the poison pool
art with a colour tint. Wiring: add a `HAZARD_POOL_ART` entry and pick it by
`zone.flavor` in `client/src/render/groundZones.ts`.

| File | Flavor | Where | Subject |
|---|---|---|---|
| `sinkhole.png` | `sinkhole` | Cave T2/T3 eruptions | A collapsed crater of broken earth with a cracked, sagging rim and loose stones |
| `mire.png` | `mire` | Swamp Mire Spit (slow, no damage) | Thick brown mud with a few slow bubbles and a wet sheen |
| `spore-pool.png` | `spore` | Swamp T3 Spore Spit (detonates) | A bed of swollen yellow-green spore pods on rotting ground, tense and about to burst |
| `thorn-snare.png` | `thorns` | Jungle T4 flight snares | A tight ring of thorny brambles closing around the centre |
