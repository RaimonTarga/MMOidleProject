# Bespoke T3 bodies — design draft

**11 specs whose fantasy genuinely breaks the class-frame silhouette (bible §25)**,
so they earn a real generated body instead of the deterministic recolour they
currently have. Each overrides an existing `PLAYER_FRAMES` spec key — purely
additive, no code change.

Read `docs/player-sprites-current-state.md` first; every rule cited here comes
from there.

---

## Settled decisions (2026-08-01)

1. **No recolour anywhere in this pass.** These are authored sprites; `t3.mjs`
   does not touch them, before or after. They overwrite the recoloured PNGs at
   the same paths.
2. **Chain from the T2 frame in its original colours** — `light_cooldown.png`,
   `heavy_cadence.png`, … — *not* from the recoloured `_t3a/b/c` file.
3. **`initImageStrength` 60–70** (using 65). Lower than the tier-2 recipe's 80
   on purpose: these bodies must genuinely depart from the frame, and this is a
   concept iteration rather than a reprint.
4. **Palette is authored in the prompt**, per-spec. Consistent with the shipped
   grammar where body colour carries spec identity at T3 — otherwise these 11
   would be the only T3 bodies without it, next to recoloured siblings that
   have it.
5. **Class DNA survives the break.** Each spec is a *subclass*, so it keeps its
   class's construction: the Assassin is an armored Squire assassin, not a
   cloth one.

> **Consequence of the low strength:** at 65 the chain no longer enforces
> identity. Every invariant — faceless, no visible weapons, 3/4 south-east
> framing, roster proportions — is **restated in each prompt** rather than
> inherited. Per-class negatives also had to be rewritten: the Squire template
> bans `hood/cowl/mask`, which the Assassin *needs*, so those bans are dropped
> where the spec requires them and replaced with a ban on what it's leaving
> behind (`great helm`, `tabard`).

### Trio separation still matters

Only some specs in each trio are bespoke; the others keep their `t3.mjs`
recolour. So an authored body still has to read distinctly from its recoloured
siblings.

| Trio | Bespoke | Keeps recolour | Separation |
|---|---|---|---|
| cooldown-light | Assassin | Transcendant 45, Sunderer 148 | Assassin is the darkest — value, not hue |
| cooldown-heavy | Destroyer, Devout Priest | Avenger 205 | dark iron+molten vs gold+ivory vs pale blue |
| cadence-heavy | Berserker, Hemomancer | Juggernaut 300 | hot bare red vs dark robed wine vs violet |
| dot-light | Cultist | Venomslinger 100, Zealot 142 | Cultist is dark-valued with acid glow |
| reload-light | Desperado, Sniper | Duelist 35 | crimson vs plum vs amber |
| reload-heavy | Melter | Warmonger 355, Cannoneer 265 | Melter is the only emissive one |
| energy-heavy | Voidwalker | Invoker 272, Tempest 158 | near-black + cyan rim |
| dot-heavy | Wind Spirit | Icebreaker 190, **Winter Warden 216** | ⚠ tightest in the set — all three are frost. Wind Spirit separates on treatment (hard white crystalline crust, streaming motion), not hue |

---

## The eleven

All chain from their T2 frame at **strength 65**.

### 1. Assassin — `cooldown-light-t3-a` ← `light_cooldown`
*Execution triggers a burst of attack speed.* Bible §25's own named example.

- **Break:** the great helm **goes** — dark hood pulled low over a narrow iron
  half-mask. The tabard goes; a wrapped cloak pinned at one shoulder replaces it.
  Hem cut to the knee (Squire hems are long).
- **Keeps:** blackened steel cuirass and **both** pauldrons, iron bracers. It is
  an *armored* assassin — that's the class DNA.
- **Palette:** charcoal and cold steel; darkest body in its trio.
- **Risk:** a hood on a light body is the *Striker*. **Guard:** keep the plate
  and the squared shoulder line; ban `sash`, `cloth robe`, `unarmored`.

### 2. Destroyer — `cooldown-heavy-t3-b` ← `heavy_cooldown`
*Normal attacks do nothing; one massive execution on a short cooldown.*

- **Break:** sheer mass. Pauldrons wider than the hips, a broad blunt faceplate
  with a single narrow eye slit, a banded plate skirt to the floor, chain-hung
  plates at the waist.
- **Palette:** dark iron with molten orange glowing in the plate joins.

### 3. Devout Priest — `cooldown-heavy-t3-c` ← `heavy_cooldown`
*Execution becomes a 3s standing holy beam channel.* Bible §25's other example.

- **Break:** plate → heavy ceremonial vestment. Tall crowned headpiece replacing
  the great helm, a long stole from collar to hem, wide bell sleeves.
- **Palette:** gold + ivory.
- **Risk:** a **halo** would collide with the range accent ring, which seats on
  the crown — two rings on one head. **Guard:** solid crowned headpiece; ban
  `halo`, `floating ring`.

### 4. Berserker — `cadence-heavy-t3-a` ← `heavy_cadence`
*Rampage stacks: faster, weaker hits, huge finisher.*

- **Break:** armour **stripped** — bare shoulders and chest wraps instead of
  chainmail, hood thrown back to a rag-bound head (face still wrapped), torn
  tabard strips at the waist, weight forward.
- **Palette:** hot blood red, high saturation.
- **Note:** already carries the Rampage aura, so it must stay legible under a
  red tint — hence bright rather than dark.

### 5. Hemomancer — `cadence-heavy-t3-b` ← `heavy_cadence`
*Finisher deals no direct damage; converts to a bleeding wound.*

- **Break:** fighter → ritualist. Hood deep and low, heavy mantle over one
  shoulder, long ragged wraps down both forearms, tattered hem.
- **Palette:** dark wine/near-black, bone-white accents, thin bright red lines.
  Separated from Berserker by **value** — same blood family, one hot and bare,
  one dark and robed.

### 6. Cultist — `dot-light-t3-b` ← `light_dot`
*Doom has no stack limit; ticks twice as fast.*

- **Break:** scholar → devotee. A deep pointed cowl swallowing the head, rope-bound
  waist with hanging fetishes, sleeves bound with cord wraps, irregular layered hem.
- **Palette:** dark robe, acid yellow-green glowing sigils at the seams.

### 7. Desperado — `reload-light-t3-b` ← `light_reload`
*Momentum stacks from continuous reloading.*

- **Break:** the hood **goes** — a flat wide-brimmed hat over the painted-eye
  mask. Long open coat with front panels swept back, bandolier straps crossing
  the chest, tall boots.
- **Palette:** deep crimson + ivory mask.
- **Note:** the strongest break in the set — a brim is one of the few shapes
  that survives 20px.

### 8. Sniper — `reload-light-t3-c` ← `light_reload`
*3 heavy shells, hard-set 0.5 APS, 2× vs full-health targets.*

- **Break:** **a cluster of round glowing compound lenses set into the pale
  mask** — deliberately cryptic, unreadable as either arcane or mechanical.
  Hood pulled into a long trailing drape; cloak binding the arms close; narrow,
  still silhouette.
- **Palette:** dark muted plum + ivory, glowing lens dots.
- **Why this works where a scope wouldn't:** the break lives on the **head**,
  which is the one place detail reliably reads at 64px, and glowing dots are
  colour spots that survive downscale. A 3px scope would not — see the sighting
  ring that rendered as a plain T.

### 9. Melter — `reload-heavy-t3-a` ← `heavy_reload`
*Magazine replaced by a continuous laser that builds Heat.*

- **Break:** a back-mounted tank rig rising **above the shoulder line** with
  coiled hoses, a chest plate with open glowing vent slats, one arm in a bulky
  bracer.
- **Palette:** hot emissive amber and white.
- **Risk:** "no visible weapons ever" is bible-locked. **Guard:** tank and coils
  only; ban `nozzle`, `barrel`, `emitter`, `muzzle`, `flamethrower`.

### 10. Voidwalker — `energy-heavy-t3-a` ← `heavy_energy`
*Doubled energy pool; early discharge on a projected kill.* Bible §25's
"Spirit becoming singularity-like".

- **Break:** a bright ringed aperture set into the chest, cloak drawn inward
  toward it, hem lifted clear of the ground.
- **Palette:** near-black garment, cyan **rim light only** — which is exactly
  the Spirit's authored legibility guard.
- **⚠ Highest risk of the eleven.** This is the Spirit rebuild's failure mode:
  identity as *absence*, subtracting on three axes at once. **Guard:** the
  aperture is a **positive lit feature**, not a hole; the garment stays fully
  built around it; the float gets a physical reason (gap of air + ground
  shadow). Ban `hole`, `missing torso`, `empty robe`, `unfinished`.

### 11. Wind Spirit — `dot-heavy-t3-c` ← `heavy_dot`
*Total frost conversion; Frostbite stacks.*

- **Break:** streaming motion. Robe and a long scarf swept hard to one side as
  in a gale, sleeves trailing into ribbon tails, hard crystalline ice crust on
  the windward shoulder and hem, hood pressed flat against the skull.
- **Palette:** saturated frost teal + bright white ice.
- **⚠ Collision guard.** "Wind Spirit" invites wispy monochrome mist — which is
  the **Spirit class's** authored identity (monochrome tunic, mist hem). Two
  classes reading as the same character is what the channel split exists to
  prevent. Ban `grey`, `monochrome`, `desaturated`, `misty`, `dissolving`,
  `translucent`, `ghost`.

---

## Sequencing

1. **Validation slice:** Assassin (head break + big palette move + the armor
   tension — the hardest case) and Melter (no head break, additive rig — the
   easiest), 3 candidates each. Proves the recipe at both extremes.
2. **Remainder:** 9 specs × 3 candidates.
3. Re-run `art/workbench/accents/anchors.mjs` after packing — head anchors are
   baked per body, and these are new bodies.

Candidates are stashed to `art/workbench/<id>/` **before** review, because
rejecting in the gallery deletes them. The user makes every accept/reject call.

---

# WAVE 3 — the remaining 29 (full T3 coverage)

Decision 2026-08-01: **every T3 spec gets a bespoke body.** 16 done, 29 to go.

**The grammar evolves rather than breaking.** T1/T2 silhouette encodes class + frame
(24 bodies); T3 silhouette encodes **spec**. Class family resemblance survives for
free because every body chains from its class-frame parent, and palette stays in the
class band. What this pass must actively solve is no longer per-spec prompting but
**roster collisions** — 45 bespoke bodies will otherwise produce five hooded dark
robes and three gold holy figures.

**Four settled design rules:**
1. **Spec archetype first.** Each spec is its own character concept; class DNA rides
   on the chained silhouette and palette. This is what produced Cinder Lord and
   Transcendant.
2. **The storm cluster separates by MOTION**, not weather detail — motion reads at
   64px, weather does not.
3. **The heavy cluster separates by what the armor is DOING.** Juggernaut stays
   chainmail, never plate, so a Striker never reads as a Squire.
4. **Batch class by class**, reviewing each trio against itself.

## Striker / cadence — chainmail hooded fighter, steel + crimson

| Spec | Node | Construction (the break) | Palette |
|---|---|---|---|
| Shockblade | `light-a` | coiled conductor wire along the arms, arcing nodes at the shoulders, faceted visor | steel + storm blue |
| Scrapper | `light-b` | mismatched salvaged plates strapped on at odd angles, wrapped fists, patchwork asymmetry, riveted scrap nose-guard | rust brown + crimson |
| Swiftblade | `light-c` | streamlined minimal kit, split cloak with two long tails, twin trailing sashes, narrow slit visor | steel + pale crimson |
| Maestro | `balanced-a` | long tailed coat, high stiff collar, one ornately embroidered gauntlet raised, layered cuffs | deep crimson + gold |
| Wavecrest | `balanced-b` | overlapping scale plates like breaking water, crest ridge across the shoulders, sweeping sash arcs | blue-steel + white |
| Justicar | `balanced-c` | heavy sealed tabard, chained pauldron, long judicial stole, **iron blindfold mask** | crimson + white |
| Juggernaut | `heavy-c` | built-up layered **chainmail, not plate**, forward-leaning bull stance, banded greaves, low brow ridge | dark steel + deep violet |

## Squire / cooldown — great helm, plate + tabard

| Spec | Node | Construction | Palette |
|---|---|---|---|
| Sunderer | `light-c` | wedge-prowed great helm, chisel-edged gauntlets, one fractured pauldron | steel + verdigris |
| Reverb | `balanced-a` | bell-flared pauldrons, concentric ring motifs on the breastplate, banded helm | pale blue + steel |
| Dynamo | `balanced-b` | coiled cabling around the torso, a single lit core disc at the chest, segmented lames | amber + iron |
| Stalwart | `balanced-c` | tower-squared plate, overlapping lames, floor-length tabard, planted greaves, flat-topped helm | deep green + steel |
| Avenger | `heavy-a` | cracked battle-scarred plate with rivets, torn cape, chain-bound shoulders, broken helm crest | pale blue + iron |

## Slinger / reload — hood + pale painted-eye mask, amber

| Spec | Node | Construction | Palette |
|---|---|---|---|
| Duelist | `light-a` | fitted waistcoat, half-cape over one shoulder, high collar, one ornate glove, **no hat** (Desperado owns the brim) | amber + ivory |
| Blunderbuss | `balanced-b` | heavy padded coat, oversized recoil brace on one shoulder, thick bracers, pouches, wide planted stance | crimson + brown |
| Dualslinger | `balanced-c` | perfectly symmetrical rig, twin crossing bandoliers, mirrored pads, coat split down the centre in two colours, split mask | violet + amber |
| Warmonger | `heavy-b` | tattered pennants hanging from shoulders and back, war-torn layered coat, hanging tokens | crimson + dark iron |
| Cannoneer | `heavy-c` | shoulder-mounted counterweight and bracing struts, stance harness, leg bracing plates — **mechanical, no tank or hoses** (Melter owns thermal) | violet + iron |

## Spirit / energy — monochrome hooded, mist hem. Trio separates by MOTION

| Spec | Node | Construction | Palette |
|---|---|---|---|
| Stormdancer | `light-a` | layered trailing ribbons, weightless streamers, arched dancing pose, hem lifting | white + shifting blue/red |
| Surge | `light-b` | taut wrapped form, lightning-fracture patterns across the garment, raised collar, crackling seams | white + electric blue |
| Channeler | `light-c` | long unbroken robe with vertical flow lines, arms bound in wraps, an upright still column | white + pale gold |
| Stormbringer | `balanced-b` | heavy storm-cloud mantle across the shoulders, jagged-hem cloak, raised collar, static | grey + violet |
| Aetherist | `balanced-c` | concentric wave bands around the robe, a sash spiralling the body | grey + teal |
| Invoker | `heavy-b` | heavy layered ceremonial robe, sigil rings orbiting the **hands and waist — never the head** (the accent ring lives there) | black + violet |
| Tempest | `heavy-c` | robe wrapped in spiralling banded layers, hem spiralling outward, asymmetric sweep | black + teal |

## Apprentice / dot — ragged robe; hues stay inside the frame's element

| Spec | Node | Construction | Palette |
|---|---|---|---|
| Venomslinger | `light-a` | bandolier of small vials across the chest, gloved hands, apron-layered robe, dripping hem | bright venom green |
| Zealot | `light-c` | bound cloth wraps, hanging prayer strips and papers, tattered hood, hunched frenzied stance | jade + bone white |
| Pyromancer | `balanced-a` | layered robe, rolled sleeves, scorched hem, ember motes at the cuffs, satchel | red-orange |
| Firebrand | `balanced-b` | a large glowing brand-sigil burned into the chest, scorch-marked shoulder, heavy leather apron | orange + charcoal |
| Icebreaker | `heavy-a` | robe encased in **fractured** ice plates, jagged shard pauldrons, splintered hem | bright cyan + white |

### Collision guards carried into the prompts

- **Zealot vs Cultist** (same trio): Cultist owns the deep pointed cowl, rope waist and
  acid glow; Zealot owns bound wraps, prayer strips and jade.
- **Cannoneer vs Melter** (same trio): Melter is thermal (tank, hoses, vents, glow);
  Cannoneer is mechanical (counterweight, struts, no glow).
- **Icebreaker vs Winter Warden vs Wind Spirit**: fractured shards / smooth plate and
  crown / directional streaming — and cyan vs deep glacial blue vs teal.
- **Juggernaut vs Destroyer**: chainmail and momentum vs plate and molten mass.
- **Maestro vs Justicar** (same trio): both formal; the blindfold mask is Justicar's alone.
