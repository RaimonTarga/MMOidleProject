> **ARCHIVED — implemented verbatim 2026-08-30; live state in `docs/briefs/T4_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md`.**
> Kept for its philosophy/rationale and per-item derivations.

# T4 Progression Economy — Proposal

**Date:** 2026-08-30
**Status:** PROPOSAL ONLY. Nothing in this document has been implemented. No recipe,
monster, ability, stance, rune, rite, or core source file has been edited to produce
this document — it is a numbers/structure proposal built on top of
`docs/briefs/T4_PROGRESSION_ECONOMY_BASELINE_2026-08-30.md` (read in full and treated as
ground truth for every current-state figure quoted below), cross-checked against the
shipped `T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md`,
`T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md`, and
`T3_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-30.md` ledgers for architectural
precedent (curve grammar, catalyst schedule shape, hybrid-essence rule, lineage
methodology). All arithmetic below (base + Σupgrades = lifetime per colour, combined =
sum of colours, +4/+5 share, hybrid ratio, reconstruction ≈3.5×, T3→T4 ratio band) was
computed and self-checked by a throwaway Node script against the live figures pulled
from the baseline audit and from `shared/src/data/recipes/*.ts` — not hand-transcribed.
No progression bot was run; no route was authored; no combat/monster-stat value was
touched.

---

## 1. Executive summary

T4's economy is frozen at a pre-T2 shape: zero gear evolution, a flat `+3=+4=+5`
upgrade plateau, a base-craft-only catalyst timing applied to only 3 of 7 biomes, an
abandoned 1,300/1,500 ability ladder, an isolated catalyst-7 stance, and — newly found
in the baseline pass — three Trench monsters paying essence in a colour that funds
nothing Trench owns. This proposal repeats the same repricing/lineage/curve pass T1→T3
each already received, at T4 scale:

- **36 of 39 ordinary gear items gain a lineage** (14 direct 1:1 continuations, 14
  one-to-many branch children across 7 branch groups, 8 Cave/Swamp→Graveyard/Trench
  handoffs); **3 are confirmed genuinely new** with no predecessor.
- **Every item's upgrade curve moves to the shipped 4/10/16/26/44% grammar**, replacing
  the flat plateau; +4/+5 lands at exactly 70% of post-base spend on every item.
- **T4 lifetime cost is retargeted to 2.0× the finalized T3 (or Cave/Swamp) predecessor**
  for every item with one, closing the previous 1.29×–2.97× spread.
- **Catalyst schedule becomes optimization-first and uniform across all 7 biomes**
  (0/0/0/3/4 weapon-armor, 0/0/0/0/3 recovery-mobility), closing the "4-of-7 biomes
  charge nothing" hole, and every item gets a validated, non-default-where-inherited
  catalyst family.
- **The four T4 abilities are repriced off the abandoned 1,300/1,500 ladder** to
  300/320/380/420, in the T3-established "one gear-upgrade-step, premium scales with
  optionality" band.
- **Recuperating Stance's catalyst drops from the isolated 7 to 3**, matching every
  other T3/T4 stance/rite.
- **Trench's monster essence-colour mismatch is corrected**: 3 monsters + the boss move
  from blue/purple to green, matching Trench's own (already-correct) green gear.
- **Relics, Runes, Rites, Cores, and combat numbers are untouched**, per the locked
  scope — no contradiction was found in any of them.

---

## 2. Locked T4 economy principles

Restated compactly; see the task's full rule text for exact wording. None of these are
renegotiated here:

1. Mastery architecture (156 ceiling, 122/131/139/148/156 gates) — untouched.
2. Grandfathered legacy GM (max 36 excess, max legacy report 192) — accepted, unchanged.
3. Evolution requires predecessor at +5; evolution pays the successor's base cost, 0
   catalysts; reconstruction ≈3.5× base essence (colour split preserved), 4 catalysts.
4. One-to-many branching (single `evolvesFrom` per child, multiple children per parent)
   is supported and used where mechanically genuine; never forced for slot convenience.
5. Continuing-biome lineage is mapped on **mechanic-key continuity**, not name/flavor.
6. Cave/Swamp handoffs are formalized only where **one** predecessor is mechanically
   dominant; ambiguous cases (Pressure Vessel) become genuinely-new items instead.
7. Genuinely-new T4 items get a plain base craft, no `evolvesFrom`, no reconstruction.
8. T4 lifetime target ≈2.0× (band 1.8×–2.2×) finalized T3/Cave/Swamp predecessor
   lifetime; branches share the parent's anchor; new items are priced from sibling slot
   bands, not multiplied off nothing.
9. Upgrade curve: 4/10/16/26/44% of post-base spend across +1..+5; ~70% of post-base
   spend in +4/+5. Stat/mechanic gains per step are untouched.
10. Hybrid essence: home = biome, splash = borrowed mechanic, ratio held constant
    (not drifting) across the whole curve, splash ≤~33%.
11. Catalyst schedule: weapon/armor 0/0/0/3/4; recovery/mobility 0/0/0/0/3;
    reconstruction 4. This is a completion gate, not a scarcity wall.
12. Catalyst family: successor inherits predecessor's family unless mechanical identity
    changes; new items use native family; every assignment verified valid at T4 nodes.
13. Abilities repriced off actual T4 supply, not a mechanical multiply of T3 numbers.
14. Recuperating Stance catalyst → 3; essence and mechanic unchanged.
15. Relics untouched (no contradiction found).
16. Runes/Rites/Cores untouched — no new T4 content in any of the three.
17. Trench's three monsters + its boss are corrected from blue/purple to green essence
    — currency-identity fix only, no stat/quantity/density change.
18. Documentation hygiene (stale headers, contradictory Rimebrand comment, unresolved
    "VERIFY" comments) is proposed as text only.
19. No combat/monster/boss stat is touched anywhere in this document.
20. No canonical route or bot is authored or run.

---

## 3. Exact T3→T4 lineage map

`EVOLUTION_REQUIRED_PLUS = 5` (unchanged). Evolving pays the T4 item's base cost with 0
catalysts. Every predecessor below was verified to (a) exist in `RECIPE_DATABASE`,
(b) sit exactly one tier below its successor, and (c) share the successor's slot.

### 3.1 Continuing-biome direct 1:1 lineages (14)

| T3 predecessor | → T4 successor | Slot | Continuity (mechanic key) |
|---|---|---|---|
| Peak Stride | mountain-boots-t4 (Vanguard Stride) | mobility | `mobility.approach-speed-pct` |
| Venomthorn Rapier | jungle-deathfang-rapier (Deathfang Rapier) | weapon | `onHitDamage`, fast rapier cadence |
| Wildgrowth Weave | jungle-vest-t4 (Primal Canopy) | armor | `evasion` + `defense.evade-mitigation` |
| Canopy Striders | jungle-boots-t4 (Warpath Treads) | mobility | speed line |
| Solar Falchion | desert-zenith-cross (Zenith Falchion) | weapon | `weapon.first-strike-mult` (2.0→2.5→3.0) |
| Eternal Duneplate | desert-vest-t4 (Deathless Duneplate) | armor | cheat-death/cleanse |
| Oasis Heart | desert-charm-t4 (Last Oasis) | recovery | cleanse/empty-heal |
| Mirage Striders | desert-boots-t4 (Simoom Striders) | mobility | kite-speed |
| Permafrost Maul | tundra-glacial-tyrant-maul (Glacial Tyrant Maul) | weapon | brittle-stack heavy maul |
| Rimebrand | tundra-glacial-rimebrand (Glacial Rimebrand) | weapon | frost `weaponDot`, convPct 0.70 |
| Glacial Bulwark | tundra-vest-t4 (Permafrost Sovereign) | armor | stationary-ramp DR |
| Glacier Striders | tundra-boots-t4 (Avalanche Striders) | mobility | ramp-speed momentum |
| Magmaheart Stone | volcanic-charm-t4 (Inferno Heart) | recovery | `defense.recovery-on-kill-pct` |
| Magma Walkers | volcanic-boots-t4 (Pyroclast Treads) | mobility | `passive-speed-pct` + `suppress-ms` |

Tundra's two weapons were **investigated as a possible branch and rejected**: Permafrost
Maul (brittle) and Rimebrand (frost DoT) are mechanically distinct T3 items with
distinct T4 heirs, not one parent with two children — two separate 1:1 lineages.

### 3.2 One-to-many branch lineages (7 groups, 14 items) — see §4

### 3.3 Cave/Swamp → Graveyard/Trench handoffs (8 items) — see §5

### 3.4 Genuinely new T4 items (3, no `evolvesFrom`) — see §6

**14 + 14 + 8 + 3 = 39**, matching the live census exactly.

---

## 4. One-to-many branch map

Seven branch groups, each investigated against real mechanic keys (not slot
convenience) per the task's explicit list. Siblings share the parent's cost anchor and
are priced identically — no arbitrary "advanced branch" premium, matching how these
pairs are already authored today.

| Parent (T3, +5) | Slot | → T4 children | Shared mechanic |
|---|---|---|---|
| Avalanche Maul | weapon | Earthsunder Maul, Warmaul | `empowered-mult-bonus` heavy maul |
| Summit Aegis | armor | Titan's Keep, Stormwall Plate | `guard.potency-pct` + max-hit cap |
| Bastion Heart | recovery | Fortress Heart, Shieldmend Ward | `defense.barrier-pct` |
| Worldvine Heart | recovery | Ancient Canopy, Overgrowth Pulse | ramping Recovery |
| Frostward Charm | recovery | Glacial Ward, Deepfreeze Ward | barrier + absorb pairing |
| Cinderlash | weapon | Eruption Lash, Cinderbrand | `weapon.flurry-pct` |
| Emberforge Plate | armor | Pyroclasm Mantle, Lava-Tempered Hide | hardening (`plating` ramp) |

**Investigated and rejected as branches** (task explicitly asked these be verified, not
assumed):

- **Tundra weapon branches** — rejected, see §3.1. Two T3 weapons with distinct
  mechanics map 1:1 to two distinct T4 weapons; forcing them into one parent/two-child
  shape would misrepresent the source.
- **Trench mobility branches** — rejected, see §5/§6. Abyssal Stalkers continues Cave's
  stealth-boots line; Abyssal Treaders is genuinely new (`mobility.tenacity-pct`, no
  match anywhere). They share a slot, not a parent.

Graveyard's armor and recovery branches (Plaguebound Shroud → {Plaguebound Mantle, Grave
Ward}; Sorrow Eye → {Necrotic Pulse, Grave-Tide Pulse}) are also one-to-many, but their
parent is a **retiring** biome (Swamp), so they are catalogued under handoffs in §5
rather than here.

---

## 5. Cave/Swamp → Graveyard/Trench handoffs

Formalized only where the baseline's mechanic-key comparison (its §6) found one
predecessor clearly dominant. Each of these becomes a real `evolvesFrom` lineage,
2.0× the finalized Cave/Swamp predecessor's lifetime total, despite crossing biomes —
per rule 8, a biome-change handoff is not punished.

| Cave/Swamp predecessor (T3, +5) | → T4 successor(s) | Slot | Verified mechanic match |
|---|---|---|---|
| Cataclysm Axe (Cave) | Plague Axe (Graveyard) **and** Abyssal Axe (Trench) | weapon | `weapon.dead-swing-interval` — one parent, two children, both retain the dead-swing family and add their own T4 rider |
| Deepscale Hide (Cave) | Deep Sea Carapace (Trench) | armor | flat `damageReduction` %DR-wall identity; the item's `defense.sustained-fight-dr-bonus` is a new T4-only rider layered on top |
| Echostep Treads (Cave) | Abyssal Stalkers (Trench) | mobility | `mobility.stealth-pct`, direct progression continuation (0.25→0.38→0.50→**0.72**) |
| Plaguebound Shroud (Swamp) | Plaguebound Mantle **and** Grave Ward (Graveyard) | armor | `defense.dot-resistance` — one parent, two children |
| Sorrow Eye (Swamp) | Necrotic Pulse **and** Grave-Tide Pulse (Graveyard) | recovery | `defense.recovery-pulse-pct` / `-interval-ms` — one parent, two children |

**Pressure Vessel (`trench-charm-t4`), explicitly resolved as NOT a handoff.** Its live
mechanic keys are `defense.absorb-pct` (Cave's charm identity) *and*
`defense.recovery-pulse-pct` (Swamp's charm identity) simultaneously, with neither
clearly primary. Per rule 6's explicit instruction for exactly this case, it is
classified as a **genuinely new T4 hybrid** (§6) rather than an arbitrary single-parent
pick or an invented multi-parent evolution. No `evolvesFrom`, no reconstruction.

---

## 6. Explicit T3 dead ends / genuinely-new T4 items

**Continuing-biome T3 dead ends: zero.** Every T3 item in Mountain, Jungle, Desert,
Tundra, and Volcanic now has at least one T4 heir (§3.1/§4) — the baseline's finding
that "all 29 T3 items in these five biomes are dead ends" is corrected by this pass in
full, not partially.

**Cave/Swamp T3 dead ends (3):**

| Item | Biome | Slot | Why it ends here |
|---|---|---|---|
| Echo Geode | Cave | recovery | Its `defense.absorb-pct` identity is only half of Pressure Vessel's blended mechanic, and the other half (Swamp's recovery-pulse) is equally present — per rule 6, an ambiguous blend does not get force-assigned to one parent. |
| Plague Fang | Swamp | weapon | Both Graveyard's and Trench's T4 axes inherit Cave's dead-swing-interval identity, not Swamp's poison-DoT weapon identity. Swamp's weapon line has no T4 heir. |
| Mire Striders | Swamp | mobility | Neither Trench boots item continues Swamp's `mobility.slow-resistance` — Abyssal Stalkers continues Cave's stealth line and Abyssal Treaders is new. |

**Genuinely new T4 items (3), no `evolvesFrom`, no reconstruction, plain base craft:**

| Item | Biome | Slot | Mechanic | Why it is new, not a handoff |
|---|---|---|---|---|
| Gravewalker Boots | Graveyard | mobility | `mobility.kill-stack-speed-pct` / `-tenacity-pct` | No match in Cave (`stealth-pct`) or Swamp (`slow-resistance`) — a genuine T4-only kill-momentum identity. |
| Pressure Vessel | Trench | recovery | `defense.absorb-pct` + `defense.recovery-pulse-pct` | Blends Cave's and Swamp's charm identities with neither dominant (§5) — new hybrid by the locked tie-break rule. |
| Abyssal Treaders | Trench | mobility | `mobility.tenacity-pct` | No match in Cave or Swamp; the item's own live comment already self-identifies as "distinct from Graveyard's kill-stack tenacity." |

---

## 7. Complete proposed 39-item T4 cost table

Base costs are **kept at their current live values** (§8 of the T3 ledger's own
precedent: reshape the upgrade track, don't re-litigate base pricing without a stated
reason). All curves use the shipped 4/10/16/26/44% split of post-base spend; hybrid
items hold their base ratio constant through every step (fixing the drift the baseline
found reintroduced at T4). Catalyst schedule and family are per §11/§12.

### 7.1 Mountain (heavy)

| Item | Slot | Base | +1 | +2 | +3 | +4 | +5 | **Total** |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| Earthsunder Maul | weapon | b256 | b185 | b463 | b741 | b1,204 | b2,039 | **4,888** |
| Warmaul | weapon | b240 | b186 | b465 | b744 | b1,208 | b2,045 | **4,888** |
| Titan's Keep | armor | b256/r64 | b132/r33 | b331/r83 | b530/r132 | b860/r215 | b1,456/r364 | **4,456** (3,565/891) |
| Stormwall Plate | armor | b256/r64 | b132/r33 | b331/r83 | b530/r132 | b860/r215 | b1,456/r364 | **4,456** (3,565/891) |
| Fortress Heart | recovery | b220/r30 | b57/r8 | b143/r19 | b229/r31 | b371/r51 | b627/r86 | **1,872** (1,647/225) |
| Shieldmend Ward | recovery | b220/r30 | b57/r8 | b143/r19 | b229/r31 | b371/r51 | b627/r86 | **1,872** (1,647/225) |
| Vanguard Stride | mobility | b220 | b44 | b110 | b175 | b285 | b482 | **1,316** |

### 7.2 Jungle (alacrity)

| Item | Slot | Base | +1 | +2 | +3 | +4 | +5 | **Total** |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| Deathfang Rapier | weapon | g264 | g157 | g392 | g627 | g1,018 | g1,722 | **4,180** |
| Primal Canopy | armor | g220/y55 | g124/y31 | g310/y77 | g494/y124 | g804/y201 | g1,360/y340 | **4,140** (3,312/828) |
| Ancient Canopy | recovery | g200 | g73 | g182 | g291 | g472 | g798 | **2,016** |
| Overgrowth Pulse | recovery | g200 | g73 | g182 | g291 | g472 | g798 | **2,016** |
| Warpath Treads | mobility | g198 | g45 | g112 | g180 | g292 | g493 | **1,320** |

### 7.3 Desert (dominion)

| Item | Slot | Base | +1 | +2 | +3 | +4 | +5 | **Total** |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| Zenith Falchion | weapon | y255 | y193 | y483 | y772 | y1,255 | y2,122 | **5,080** |
| Deathless Duneplate | armor | y220/p55 | y153/p38 | y382/p95 | y610/p152 | y991/p248 | y1,677/p419 | **5,040** (4,033/1,007) |
| Last Oasis | recovery | y200/p50 | y76/p19 | y190/p47 | y303/p76 | y493/p123 | y834/p209 | **2,620** (2,096/524) |
| Simoom Striders | mobility | y198 | y61 | y153 | y245 | y398 | y673 | **1,728** |

### 7.4 Tundra (heavy / fortified)

| Item | Slot | Base | +1 | +2 | +3 | +4 | +5 | **Total** |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| Glacial Tyrant Maul | weapon | b273 | b185 | b463 | b740 | b1,203 | b2,036 | **4,900** |
| Glacial Rimebrand | weapon | b258 | b185 | b463 | b741 | b1,204 | b2,037 | **4,888** |
| Permafrost Sovereign | armor | b256/r64 | b130/r33 | b326/r82 | b522/r131 | b849/r212 | b1,436/r359 | **4,400** (3,519/881) |
| Glacial Ward | recovery | b220/p30 | b65/p9 | b163/p22 | b260/p36 | b423/p58 | b716/p98 | **2,100** (1,847/253) |
| Deepfreeze Ward | recovery | b220/p30 | b65/p9 | b163/p22 | b260/p36 | b423/p58 | b716/p98 | **2,100** (1,847/253) |
| Avalanche Striders | mobility | b176 | b47 | b116 | b186 | b303 | b512 | **1,340** |

### 7.5 Volcanic (swarming / alacrity)

| Item | Slot | Base | +1 | +2 | +3 | +4 | +5 | **Total** |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| Eruption Lash | weapon | r308 | r191 | r477 | r764 | r1,241 | r2,099 | **5,080** |
| Cinderbrand | weapon | r290 | r192 | r479 | r766 | r1,245 | r2,108 | **5,080** |
| Pyroclasm Mantle | armor | r220/y55 | r126/y32 | r316/y79 | r506/y126 | r822/y205 | r1,390/y347 | **4,224** (3,380/844) |
| Lava-Tempered Hide | armor | r220/y55 | r126/y32 | r316/y79 | r506/y126 | r822/y205 | r1,390/y347 | **4,224** (3,380/844) |
| Inferno Heart | recovery | r200/y50 | r62/y16 | r156/y39 | r250/y62 | r406/y101 | r686/y172 | **2,200** (1,760/440) |
| Pyroclast Treads | mobility | r163 | r48 | r120 | r192 | r311 | r526 | **1,360** |

### 7.6 Graveyard (swarming / fortified)

| Item | Slot | Base | +1 | +2 | +3 | +4 | +5 | **Total** |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| Plague Axe | weapon | p270 | p175 | p439 | p702 | p1,140 | p1,930 | **4,656** |
| Plaguebound Mantle | armor | p220 | p180 | p450 | p719 | p1,169 | p1,978 | **4,716** |
| Grave Ward | armor | p220 | p180 | p450 | p719 | p1,169 | p1,978 | **4,716** |
| Necrotic Pulse | recovery | p150 | p73 | p183 | p292 | p475 | p803 | **1,976** |
| Grave-Tide Pulse | recovery | p150 | p73 | p183 | p292 | p475 | p803 | **1,976** |
| Gravewalker Boots | mobility | p80 | p50 | p125 | p200 | p326 | p551 | **1,332** |

### 7.7 Trench (swarming / dominion)

| Item | Slot | Base | +1 | +2 | +3 | +4 | +5 | **Total** |
|---|---|--:|--:|--:|--:|--:|--:|--:|
| Abyssal Axe | weapon | g270 | g175 | g439 | g702 | g1,140 | g1,930 | **4,656** |
| Deep Sea Carapace | armor | g220 | g185 | g462 | g739 | g1,200 | g2,030 | **4,836** |
| Pressure Vessel | recovery | g150 | g73 | g183 | g292 | g475 | g803 | **1,976** |
| Abyssal Stalkers | mobility | g80 | g50 | g125 | g200 | g326 | g551 | **1,332** |
| Abyssal Treaders | mobility | g80 | g50 | g125 | g200 | g326 | g551 | **1,332** |

(`b`=blue, `g`=green, `y`=yellow, `r`=red, `p`=purple. Every row above was generated and
arithmetically verified by script — see §19.)

---

## 8. T3→T4 lifetime ratios

Every item with a real predecessor lands at **exactly 2.00×** its predecessor's
finalized lifetime total (well inside the 1.8×–2.2× band; no item needed a deviation).
This deliberately closes the baseline's 1.29×–2.97× spread and its "weapons cluster
high, armor/recovery/mobility cluster low" bimodal shape.

| Predecessor | Lifetime | → T4 | Proposed lifetime | Ratio |
|---|--:|---|--:|--:|
| Avalanche Maul | 2,444 | Earthsunder Maul / Warmaul | 4,888 | 2.00× |
| Summit Aegis | 2,228 | Titan's Keep / Stormwall Plate | 4,456 | 2.00× |
| Bastion Heart | 936 | Fortress Heart / Shieldmend Ward | 1,872 | 2.00× |
| Peak Stride | 658 | Vanguard Stride | 1,316 | 2.00× |
| Venomthorn Rapier | 2,090 | Deathfang Rapier | 4,180 | 2.00× |
| Wildgrowth Weave | 2,070 | Primal Canopy | 4,140 | 2.00× |
| Worldvine Heart | 1,008 | Ancient Canopy / Overgrowth Pulse | 2,016 | 2.00× |
| Canopy Striders | 660 | Warpath Treads | 1,320 | 2.00× |
| Solar Falchion | 2,540 | Zenith Falchion | 5,080 | 2.00× |
| Eternal Duneplate | 2,520 | Deathless Duneplate | 5,040 | 2.00× |
| Oasis Heart | 1,310 | Last Oasis | 2,620 | 2.00× |
| Mirage Striders | 864 | Simoom Striders | 1,728 | 2.00× |
| Permafrost Maul | 2,450 | Glacial Tyrant Maul | 4,900 | 2.00× |
| Rimebrand | 2,444 | Glacial Rimebrand | 4,888 | 2.00× |
| Glacial Bulwark | 2,200 | Permafrost Sovereign | 4,400 | 2.00× |
| Frostward Charm | 1,050 | Glacial Ward / Deepfreeze Ward | 2,100 | 2.00× |
| Glacier Striders | 670 | Avalanche Striders | 1,340 | 2.00× |
| Cinderlash | 2,540 | Eruption Lash / Cinderbrand | 5,080 | 2.00× |
| Emberforge Plate | 2,112 | Pyroclasm Mantle / Lava-Tempered Hide | 4,224 | 2.00× |
| Magmaheart Stone | 1,100 | Inferno Heart | 2,200 | 2.00× |
| Magma Walkers | 680 | Pyroclast Treads | 1,360 | 2.00× |
| Cataclysm Axe (Cave) | 2,328 | Plague Axe / Abyssal Axe | 4,656 | 2.00× |
| Deepscale Hide (Cave) | 2,418 | Deep Sea Carapace | 4,836 | 2.00× |
| Echostep Treads (Cave) | 666 | Abyssal Stalkers | 1,332 | 2.00× |
| Plaguebound Shroud (Swamp) | 2,358 | Plaguebound Mantle / Grave Ward | 4,716 | 2.00× |
| Sorrow Eye (Swamp) | 988 | Necrotic Pulse / Grave-Tide Pulse | 1,976 | 2.00× |

Gravewalker Boots, Pressure Vessel, and Abyssal Treaders have no predecessor and no
ratio — they are priced from sibling slot bands (§7.6/§7.7: 1,332 for both new mobility
items, matching handoff-derived Abyssal Stalkers exactly; 1,976 for Pressure Vessel,
matching the Graveyard/Swamp-derived recovery band exactly). This keeps the two
genuinely-new T4-only biomes' kits internally consistent rather than inventing a fourth
pricing rule for content with no lineage to anchor to.

**Largest current→proposed corrections** (current live totals from the baseline's §4/§8,
recomputed and diffed by script):

| Item | Current | Proposed | Δ | Why |
|---|--:|--:|--:|---|
| Gravewalker Boots / Abyssal Stalkers / Abyssal Treaders | 596 | 1,332 | **+124%** | Graveyard/Trench boots were priced far below even their own biome's other slots; the flat plateau left them the cheapest mobility item in the game at T4 |
| Deep Sea Carapace | 2,920 | 4,836 | **+66%** | Cave's armor predecessor (2,418) was never actually paid against; anchoring properly nearly doubles it |
| Plaguebound Mantle / Grave Ward | 2,920 | 4,716 | **+62%** | same cause, Swamp armor anchor |
| Vanguard Stride | 851 | 1,316 | **+55%** | Mountain's boots track (§7 of the T3 ledger already flagged Peak Stride itself as badly under; T4 inherited the same shape) |
| Necrotic Pulse / Grave-Tide Pulse / Pressure Vessel | 1,440/1,440/1,440 | 1,976 | **+37%** | Swamp charm anchor + new-item slot-band match |
| Deathfang Rapier | 6,204 | 4,180 | **−33%** | was 2.97× its predecessor, the widest overshoot in the game |
| Eruption Lash | 7,238 | 5,080 | **−30%** | was 2.85× |
| Plague Axe / Abyssal Axe | 6,345 | 4,656 | **−27%** | Cave axe anchor corrects a ratio computed only as a "curiosity" in the baseline (2.73× against an axe never actually spent) |
| Cinderbrand | 6,815 | 5,080 | **−25%** | was 2.68× |

Every other item moves under 24% — a curve reshape at the current base cost, not a
re-anchoring, consistent with the T3 pass's own precedent that most items should not
need large corrections once the ratio methodology is applied uniformly.

---

## 9. Upgrade-curve analysis

Every one of the 39 items now follows `+1=4%, +2=10%, +3=16%, +4=26%, +5=44%` of
post-base spend, with residual rounding on +5 (the same rounding convention T1–T3
used). This replaces the baseline's `base×1.5, ×2, ×2.1, then hold` template that
produced the flattest plateau found anywhere in the codebase.

**+4/+5 share of post-base spend, all 39 items: 69.9%–70.0%** (script-verified; the two
69.9% cases are Ancient Canopy/Overgrowth Pulse and Pyroclast Treads, both a single unit
of residual rounding off the 70.0% target — inside the locked 65–75% band with room to
spare). No item deviates from the shipped grammar and no item is exempted.

---

## 10. Hybrid essence normalization

Home = biome, splash = borrowed mechanic, held **constant** through every upgrade step
(the specific defect the baseline found reintroduced — the flat plateau repeating a
splash-heavy ratio three times). Base-craft ratios are kept as currently authored
(already 75–88% home) and now hold for the item's full lifetime rather than drifting.

| Hybrid item | Ratio | Lifetime home/splash | Splash % |
|---|---|---|--:|
| Titan's Keep / Stormwall Plate | 80/20 | 3,565 / 891 | 20.0% |
| Fortress Heart / Shieldmend Ward | 88/12 | 1,647 / 225 | 12.0% |
| Primal Canopy | 80/20 | 3,312 / 828 | 20.0% |
| Deathless Duneplate | 80/20 | 4,033 / 1,007 | 20.0% |
| Last Oasis | 80/20 | 2,096 / 524 | 20.0% |
| Permafrost Sovereign | 80/20 | 3,519 / 881 | 20.0% |
| Glacial Ward / Deepfreeze Ward | 88/12 | 1,847 / 253 | 12.0% |
| Pyroclasm Mantle / Lava-Tempered Hide | 80/20 | 3,380 / 844 | 20.0% |
| Inferno Heart | 80/20 | 1,760 / 440 | 20.0% |

All splash percentages sit **exactly** at their base-craft ratio for the full lifetime —
no drift, well under the 33% ceiling. Weapons and mobility remain pure in all 10/8
items respectively (unchanged rule, no exceptions found). Graveyard and Trench's
handoff/new items stay pure single-colour, matching their current live authoring —
none of the six borrows a second mechanic strongly enough to justify a splash, and per
rule 10's explicit instruction, a splash is not added merely because an ancestor biome
differs from the successor's home colour.

---

## 11. Exact catalyst-family table

Rule: a successor inherits its predecessor's family unless mechanical identity clearly
changes; new items use their own biome's native family; every assignment below was
checked against the baseline's §10 node-count table to confirm the family actually has
T4 nodes in that biome.

| Item | Biome | Family | Basis |
|---|---|---|---|
| Earthsunder Maul, Warmaul, Titan's Keep, Stormwall Plate, Fortress Heart, Shieldmend Ward, Vanguard Stride | Mountain | **heavy** | native, unchanged |
| Deathfang Rapier, Primal Canopy, Ancient Canopy, Overgrowth Pulse, Warpath Treads | Jungle | **alacrity** | native, unchanged |
| Zenith Falchion, Deathless Duneplate, Last Oasis, Simoom Striders | Desert | **dominion** | native — newly assigned (Desert charged 0 catalysts anywhere at T4 before this pass) |
| Glacial Tyrant Maul, Permafrost Sovereign, Glacial Ward, Deepfreeze Ward, Avalanche Striders | Tundra | **heavy** | native, unchanged |
| Glacial Rimebrand | Tundra | **fortified** | inherited verbatim from Rimebrand's own T3 family (a deliberate non-native tag, unchanged since T3) |
| Eruption Lash, Cinderbrand, Pyroclast Treads | Volcanic | **swarming** | inherited from Cinderlash/Magma Walkers' native T3 family |
| Pyroclasm Mantle, Lava-Tempered Hide, Inferno Heart | Volcanic | **alacrity** | inherited from Emberforge Plate/Magmaheart Stone's T3 family (itself inherited from their Plains ancestors) — **not** Volcanic's own native `swarming`, verified present at Volcanic T4 nodes |
| Plague Axe, Gravewalker Boots | Graveyard | **swarming** | Plague Axe inherits Cave's axe family; Gravewalker Boots is new and uses Graveyard's own native family (also swarming) |
| Plaguebound Mantle, Grave Ward, Necrotic Pulse, Grave-Tide Pulse | Graveyard | **fortified** | inherited from Plaguebound Shroud/Sorrow Eye's Swamp family — **not** Graveyard's native `swarming`, verified present at Graveyard T4 nodes |
| Abyssal Axe, Deep Sea Carapace, Abyssal Stalkers | Trench | **swarming** | inherited from Cataclysm Axe/Deepscale Hide/Echostep Treads' Cave family — **not** Trench's native `dominion`, verified present at Trench T4 nodes |
| Pressure Vessel, Abyssal Treaders | Trench | **dominion** | both are new items with no inherited identity; native Trench family |

This deliberately produces **two families inside Graveyard** (swarming/fortified) and
**two families inside Trench** (swarming/dominion) rather than the blanket
single-family assignment the task explicitly warned against.

---

## 12. Catalyst schedule and supply check

| Step | Weapon / Armor | Recovery / Mobility |
|---|--:|--:|
| Base craft or evolution | 0 | 0 |
| +1 / +2 / +3 | 0 | 0 |
| +4 | **3** | 0 |
| +5 | **4** | **3** |
| **Per item** | **7** | **3** |
| Reconstruction | **4** | **4** |

This continues the T2 (1/2)→T3 (2/3)→T4 (3/4) weapon/armor escalation and the T2
(1)→T3 (2)→T4 (3) recovery/mobility escalation exactly, and replaces T4's inconsistent
"4-at-the-door in 3-of-7 biomes, nothing in 4-of-7" shape with one uniform schedule
across all seven.

**Supply check** (using the baseline's §10 raw per-kill catalyst-weight figures, which
already fold in each biome's native-family reward multiplier):

| Biome | Native-family kills/catalyst (from baseline) | 7-catalyst weapon/armor bill | 3-catalyst recovery/mobility bill |
|---|---|---|---|
| Mountain (heavy) | 0.47–1.27 | ~3–9 kills | ~1–4 kills |
| Jungle (alacrity) | 0.64–1.85 | ~4–13 kills | ~2–6 kills |
| Desert (dominion) | 0.42–1.30 | ~3–9 kills | ~1–4 kills |
| Tundra (heavy) | 0.33–1.39 | ~2–10 kills | ~1–4 kills |
| Volcanic (swarming) | 0.51–2.04 | ~4–14 kills | ~2–6 kills |
| Graveyard (swarming/fortified) | 1.37–4.35 | ~10–30 kills | ~4–13 kills |
| Trench (swarming/dominion) | 0.18–0.34 | ~1–2 kills | <1–1 kills |

Even Graveyard's worst case (its own dense-but-low-value trash tier) stays under ~30
kills for a full weapon/armor +4/+5 bill, and every other biome is materially cheaper —
this is a completion gate, exactly as instructed, never a scarcity wall. Volcanic/
Graveyard's cross-family items (armor/recovery on a non-native family) draw from a
family with fewer local nodes than the native one, but the baseline's own per-family
node counts (§10) show every family present at 1–2 nodes minimum in every biome that
needs it, so no family is stranded.

---

## 13. Ability costs

Anchored on the T3 finalized values (Binding Strike 150, Frenzy 175, Break Free 190,
Quick Strike 210) and the rule-13 band (ordinary/important ≈300–350, stronger/later/
specialized ≈350–450). No catalyst, unlock, gate, or effect change on any of the four.

| Ability | Biome / gate | Role | Current | **Proposed** |
|---|---|---|---|--:|
| Disengage | Trench L3 | Technique/Guard escape — required counterplay | green 1,300 | **green 300** |
| Snipe | Graveyard L3 | Technique, extended range — ordinary/important tool | purple 1,300 | **purple 320** |
| Recuperate | Trench L5 | Guard, long steady sustain — broadly useful, optional | green 1,500 | **green 380** |
| Stunning Strike | Graveyard L5 | Technique, committed hard CC — powerful, specialized | purple 1,500 | **purple 420** |

Ordering within each biome (L3 < L5) is preserved. Disengage sits at the low end because
it is the game's only Trench escape tool, the same "required counterplay prices
lowest" reasoning the T3 pass used for Break Free. Stunning Strike sits at the top
because hard CC is the most build-warping of the four. **Sanity against local T4
supply** (baseline §16, scaled by `BIOME_ESSENCE_TIER_MULT[4]=0.55`): Trench's raw
essence-per-kill of 210–400 scales to ~115–220 live essence per kill, so Disengage (300)
and Recuperate (380) both cost under 2–3 kills of Trench's elite-only roster. Graveyard's
raw 22–70 scales to ~12–38 live essence per kill, so Snipe (320) and Stunning Strike
(420) cost roughly 10–20 kills of its (deliberately dense, lower-value) trash tier —
comparable in kill-count terms to Trench's tools despite the ten-fold difference in
per-kill essence, which is the intended effect of anchoring off actual supply rather
than a flat multiplier.

---

## 14. Recuperating Stance

Essence unchanged (`green 220 / blue 100`), gate unchanged (jungle L17), mechanic
unchanged. Only the catalyst moves:

| | Current | **Proposed** |
|---|--:|--:|
| Catalyst (alacrity) | 7 | **3** |

3 matches the T3-established "premium stance/rite" ceiling (T3's 5-RP rites sit at 3;
T3's stances sit at 2) and removes the isolated more-than-double outlier the baseline
flagged. No other T4 stance exists to compare it against, so 3 is chosen by continuity
with the T3 catalyst scale, not by benchmarking a T4 sibling that doesn't exist.

---

## 15. Relic confirmation

**No change proposed.** All 8 relics were re-examined against the rule-15 criteria and
no contradiction was found: uniform ~200–270 essence + 4 catalysts, single-craft, no
upgrades, no ordinary evolution, gates within each biome's live T4 band, catalyst family
matching the biome's native family in every case (Mountain's two relics both `heavy`,
etc.). The two relics re-homed off retired biomes (`relic-haunted-prism` from Swamp,
`relic-virulent-hourglass` from Forest) are correctly living on Graveyard/Trench
already — this is the one place the baseline found the retirement-aware re-homing
principle already working correctly at T4, and this proposal leaves it exactly as is.

---

## 16. Rune/Rite/Core treatment

**No change proposed to any of the three.** `rune-recipe-focus-elites` (Graveyard, the
one T4 rune) is left exactly as authored — correctly gated, correctly costed, no defect
found. Zero T4 Rites and zero new T4 Stances (beyond Recuperating, §14) remain zero —
consistent with each system's own established per-tier cadence (Runes add sparingly,
Rites added nothing past T3, Cores cast at T3 and are explicitly out of scope). No new
T4 content is authored in any of these three systems by this proposal.

---

## 17. Trench essence correction

Currency-identity fix only. No stat, quantity, XP, density, or elite-status field is
touched on any of these four entries.

| File | Monster/entry id | Field | Old value | **New value** |
|---|---|---|---|---|
| `shared/src/data/monsters/trench.monsters.ts` (line 82) | `hadal-stalker` | `rewards.essenceType` | `'blue'` | **`'green'`** |
| `shared/src/data/monsters/trench.monsters.ts` (line 48) | `abyssal-serpent` | `rewards.essenceType` | `'blue'` | **`'green'`** |
| `shared/src/data/monsters/trench.monsters.ts` (line 111) | `elder-leviathan` | `rewards.essenceType` | `'blue'` | **`'green'`** |
| `shared/src/data/monsters/bossesT4.ts` (line 420) | `elder-trench-serpent` | `rewards.essenceType` | `'purple'` | **`'green'`** |

After the fix, Trench's monsters, boss, and gear all pay/cost the same colour (green),
matching every other T4 biome's already-correct pattern of monster essence type = gear
home colour. `elder-trench-serpent-warden` (the soft-discarded Void Overlord staged
encounter, line 462) is explicitly **out of scope** per rule 17 and is left at `purple`
unchanged — it is not part of the active T4 boss pool.

---

## 18. Documentation/data-hygiene cleanup

Text-only proposals; no source restructuring implied.

- **`graveyard.recipes.ts:1-8` header** — currently claims "Only the mobility (boot)
  line is authored so far... Armor / weapon / charm / new-mechanic mobs remain
  DEFERRED," which is false (all 5 slots are fully authored, §4 of the baseline).
  Proposed replacement: *"Graveyard (T4). All five slots authored: weapon (Cave
  dead-swing-axe inheritance), two armor branches and two recovery branches (Swamp
  dot-resistance/recovery-pulse inheritance), one mobility item (genuinely new
  kill-stack identity). See T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §5/§6 for the
  lineage map."*
- **`trench.recipes.ts:1-8` header** — currently a verbatim copy of Graveyard's header,
  including the literal string "Graveyard (T4)" and "renamed from necropolis" inside
  the Trench file. Proposed replacement: *"Trench (T4). All four slots authored: weapon,
  armor, and one mobility branch inherit Cave's dead-swing-axe/DR-wall/stealth-boots
  identities; the recovery item (Pressure Vessel) and the second mobility item (Abyssal
  Treaders) are genuinely new T4 identities with no predecessor. See
  T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §5/§6."*
- **`tundra.recipes.ts:136-137` (Glacial Rimebrand's item comment)** — currently reads
  "⚠ INHERITED (Swamp slow-DoT lineage) — base attack carried from doc, not scaled from
  a T3 ancestor," directly contradicting `tundra.recipes.ts:6-10`'s own correct
  statement that Rimebrand is a genuinely new T3 item with no Swamp predecessor.
  Proposed replacement: *"Glacial Rimebrand evolves from Rimebrand (T3), Tundra's own
  genuinely-new frost-DoT weapon line (no Swamp predecessor — see the file header).
  Base attack and mechanic identity (`weaponDot`, convPct 0.70) are carried forward from
  the T3 item, not from any Swamp ancestor."* This also resolves the comment into an
  actual `evolvesFrom` per §3.1, so the "not scaled from a T3 ancestor" clause is no
  longer true and should be dropped entirely, not merely reworded.
- **`graveyard.recipes.ts:14` and `trench.recipes.ts:14` (axe comments)** — currently
  "⚠ INHERITED (Cave … axe branch) — base attack carried from doc, not scaled from a T3
  ancestor... VERIFY in budget pass." This pass resolves the **economy** half of that
  warning (Plague Axe/Abyssal Axe now have a real `evolvesFrom: 'cave-cataclysm-axe'`
  and a costed lineage, §5/§8) but does **not** revalidate the underlying `attack` stat
  against the current combat formula set — that is a combat question, explicitly out of
  scope here (rule 19). Proposed replacement: *"Evolves from Cataclysm Axe (Cave),
  continuing the `weapon.dead-swing-interval` family (see
  T4_PROGRESSION_ECONOMY_PROPOSAL_2026-08-30.md §5). Economy resolved by that pass;
  base `attack` value has NOT been revalidated against current combat formulas — that
  remains a separate balance question."*

---

## 19. Tests/invariants required

Per this repo's convention (`server/test/*.test.ts` or `shared/src/**/*.test.ts`, plain
`tsx` scripts with hand-rolled `assert` and a trailing `console.log(...": ok")`, no
vitest/jest), a future implementation pass should ship a new
`server/test/t4ProgressionEconomy.test.ts` mirroring `t3ProgressionEconomy.test.ts`'s
shape:

1. **Lineage:** exactly 36 T4 gear items carry `evolvesFrom` (14 direct + 14 branch + 8
   handoff), exactly 3 do not (Gravewalker Boots, Pressure Vessel, Abyssal Treaders);
   every `evolvesFrom` resolves to a real `RECIPE_DATABASE` entry exactly one tier below
   the successor and in the same slot; no `evolvesFromAny` field exists anywhere.
2. **Branch integrity:** the 7 continuing-biome branch groups and the 2 Graveyard
   handoff-branch groups each have exactly 2 children pointing at the same parent id;
   no other parent has more than the branches enumerated in §4/§5.
3. **Curve shape:** for all 39 items, steps are strictly non-decreasing and the +4/+5
   share of post-base spend falls in [0.65, 0.75]; no item repeats a `+3=+4=+5` value.
4. **Lifetime ratio:** for all 26 items with a predecessor, `total / predecessorTotal`
   is in [1.8, 2.2] (expected: exactly 2.0 for all 26, per this proposal).
5. **Hybrid ratio:** for all 9 hybrid items, the home-colour share of the lifetime total
   equals the home-colour share of the base cost within rounding (±1 point), and is
   ≥67% (splash ≤33%) at every individual step, not just in aggregate.
6. **Catalyst schedule:** weapon/armor items are catalyst-free through +3, charge
   exactly 3 at +4 and 4 at +5; recovery/mobility items are catalyst-free through +4 and
   charge exactly 3 at +5; every reconstruct cost (where present) is 4 catalysts and
   ≈3.5× base essence per colour (±1 on rounding).
7. **Catalyst family validity:** every assigned family for every T4 item actually
   appears in `MODIFIER_BANS`/`NATIVE_MODIFIER`'s valid set for that biome (i.e. is not
   banned and has ≥1 live T4 node of that family).
8. **Ability costs:** the four T4 ability costs pinned exactly (300/320/380/420),
   catalyst-free, gates/tiers/`recipeGroup` unchanged.
9. **Stance:** Recuperating Stance's catalyst pinned at exactly 3 (alacrity), essence
   and gate pinned unchanged.
10. **Trench essence correction:** all three Trench T4 monsters and the Trench boss
    resolve `rewards.essenceType === 'green'`; the soft-discarded
    `elder-trench-serpent-warden` is explicitly asserted to remain `'purple'`
    (regression guard against an over-broad find/replace).
11. **No regression to relics/runes/rites/cores:** counts (8/1/6-total-all-T3/12-total-
    all-T3) and every relic's essence/catalyst/gate pinned unchanged, mirroring
    `t3ProgressionEconomy.test.ts`'s pattern of pinning what should NOT move alongside
    what should.
12. **Reachability:** every T4 recipe's `requiredBiomeLevel` stays within its biome's
    live T4 cap (generic re-run of the existing `recipeGates.test.ts` pattern — no new
    gate is introduced by this proposal, so this should already pass, but the suite
    should assert it explicitly for T4 the way `t3ProgressionEconomy.test.ts` does for
    T3).

---

## 20. Exact implementation scope

Scope only — nothing below has been executed.

**Recipe data — `shared/src/data/recipes/`**
- `mountain.recipes.ts` — add `evolvesFrom`/`reconstructCost`/`reconstructCatalystCost`
  to all 7 T4 items; reprice all 7 upgrade tracks (§7.1); add `catalystCost` at +4/+5
  (heavy family, unchanged).
- `jungle.recipes.ts` — same treatment for its 5 T4 items (§7.2, alacrity).
- `desert.recipes.ts` — same for its 4 T4 items (§7.3); **new** `catalystCost` fields
  entirely (dominion family, currently absent).
- `tundra.recipes.ts` — same for its 6 T4 items (§7.4, heavy/fortified); resolve the
  Glacial Rimebrand comment contradiction (§18).
- `volcanic.recipes.ts` — same for its 6 T4 items (§7.5); **new** `catalystCost` fields
  (swarming/alacrity, currently absent).
- `graveyard.recipes.ts` — add lineage to 5 of 6 items (§5/§6), reprice all 6 (§7.6),
  **new** `catalystCost` fields (swarming/fortified), replace the stale header (§18).
- `trench.recipes.ts` — add lineage to 3 of 5 items (§5/§6), reprice all 5 (§7.7),
  **new** `catalystCost` fields (swarming/dominion), replace the stale header (§18).
- `cave.recipes.ts`, `swamp.recipes.ts` — **no change**; predecessors are read, not
  edited (they retire at T3 and stay exactly as the T3 pass left them).
- `types.ts` — **no change**; single-string `evolvesFrom` is sufficient, matching the
  T3 pass's own explicit rejection of a multi-parent schema.

**Abilities / Stances — `shared/`**
- `shared/src/abilityRecipes.ts` — reprice the 4 T4 abilities (§13); remove/replace the
  file's own "T4 has NOT yet been repriced" comment now that it has been.
- `shared/src/stanceRecipes.ts` — Recuperating Stance's `catalystCost` only (§14).

**No change** — `shared/src/runeRecipes.ts`, `shared/src/riteRecipes.ts` (§16), any
Core recipe file, `shared/src/quests/questDatabase.ts`, any relic recipe entry (§15).

**Monster data — `shared/src/data/monsters/`**
- `trench.monsters.ts` — 3 `essenceType` field edits (§17): `hadal-stalker` (line 82),
  `abyssal-serpent` (line 48), `elder-leviathan` (line 111).
- `bossesT4.ts` — 1 `essenceType` field edit (§17): `elder-trench-serpent` (line 420).
  `elder-trench-serpent-warden` explicitly left untouched.

**Tests**
- `server/test/t4ProgressionEconomy.test.ts` — **new**, per §19.

**Docs**
- `docs/gear-evolution-current-state.md` — add a note that T4 now has real lineage
  (currently silent on T4 having zero, per the baseline's §23).
- `docs/README.md` — index this proposal and its eventual implementation ledger.
- No change to `design_docs/economy-philosophy.md` (left as historical archaeology, per
  T3 precedent) or `docs/global-mastery-current-state.md` (already self-flagged stale).

**Explicitly not touched anywhere in this scope:** combat stats, `attacksPerSecond`,
`mechanicEffects`, monster/boss HP/attack/plating, biome XP curves, RP formulas, the
Core economy, quest `killsRequired`/seal counts, and any progression bot or bench route.

---

## 21. Runtime hypotheses

**H1 — Pacing (needs runtime/bot validation, not solved here).** The 2.0× tier step and
the catalyst-supply sanity check (§12) both suggest T4 kits sit inside a comparable
per-band income window to T1–T3, but whether biome mastery (reaching the 156 GM ceiling)
actually completes *before* full economic optimization (every item at +5) is a live
question this static pass cannot answer — it depends on real kill rates, node-modifier
uptime, essence-tier multipliers, and how a real T4 route splits time across all seven
active biomes plus the grandfathered-GM headroom (§19 of the baseline). The correct
instrument is a canonical T4 bot route authored **after** this economy ships, per rule
20 — not authored here.

**H2 — Bench baselines shift, and that is expected, not a regression.** Any T4 canonical
bot or bench delta traceable solely to the repriced costs, the new catalyst schedule, or
the corrected Trench essence colour is the economy becoming internally consistent, not a
balance regression to compensate for.

**H3 — Graveyard's low per-kill essence interacts with its now-real catalyst bill.**
Graveyard's trash tier is the weakest in the game by design (a deliberate "dense,
low-value" vacuum biome per the baseline). §12's supply check shows this still clears a
full weapon/armor catalyst bill in under 30 kills, but Graveyard is the biome most worth
re-checking first if a future runtime pass finds T4 catalyst pacing uneven — not because
the schedule is wrong, but because it is the tightest margin among the seven.

**H4 — Cross-family catalyst assignments (Volcanic armor/recovery on alacrity, Graveyard
armor/recovery on fortified, Trench weapon/armor/boots on swarming) trade a small amount
of "farm it where you stand" convenience for mechanical-identity honesty.** A player
optimizing only Volcanic's or Trench's own gear must occasionally visit a differently-
modifiered node rather than their own biome's native one. This is the same trade-off
Cave's `swarming` tag and Rimebrand's `fortified` tag already made at T3 without issue
(per the T3 ledger), and the baseline's own node-count table (§10) confirms every needed
family has at least one live node in the relevant biome, so this is flagged as an
accepted design trade-off, not a defect requiring further correction.

**H5 — The ability repricing (300/320/380/420) assumes Graveyard's dense-trash and
Trench's elite-only supply shapes are both intentional, not placeholders.** If a future
balance pass changes either biome's monster density or per-kill essence, the ability
kill-count sanity check in §13 should be recomputed — the essence values themselves
would not necessarily need to move, but the "comparable kill-count despite ten-fold
per-kill essence difference" framing that justified pricing Graveyard's and Trench's
tools close together would need re-checking.

---

*No gameplay, balance, combat, or route change was made to produce this document. Every
cost table above was generated and arithmetically self-checked by a throwaway Node
script (deleted after use, not part of this repo) against the finalized T3/Cave/Swamp
predecessor totals and the live T4 base costs recorded in the baseline audit.*
