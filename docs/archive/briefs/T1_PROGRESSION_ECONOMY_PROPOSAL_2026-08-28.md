> **ARCHIVED — implemented 2026-08-28; live state in `docs/briefs/T1_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-28.md`.**
> Kept for its philosophy/rationale writeup. Several figures were corrected before shipping
> (mandatory-tool costs, catalyst structure, item totals) — read the implementation ledger
> for what actually shipped.

# T1 Progression Economy Proposal
**Date:** 2026-08-28
**Status:** PROPOSAL — for designer review. Nothing in this document has been implemented. No recipe, reward, route, monster, or class file has been edited to produce it.
**Source of truth:** `docs/briefs/T1_PROGRESSION_ECONOMY_BASELINE_2026-08-28.md` (the audit). Every number below is either quoted from that audit or derived from it; where this document reads live source directly (to resolve an audit UNKNOWN), that is called out.

---

## 1. Executive Recommendation

Keep the tier's bones — five biomes, GM30, +5-at-GM30, essence-color-per-biome, linear +1..+5 items — and make three changes:

1. **Reshape the upgrade curve**, item by item, using one reusable grammar (§4) that removes the +3/+4/+5 plateau the audit found in 19 of 20 items and pushes ~69% of each item's post-base upgrade budget into +4/+5. Where practical this **preserves each item's current total→+5 cost** — it redistributes, it does not inflate the tier's total grind.
2. **Pull five items forward**, all currently sitting one level later than the mechanic they answer: **Sweep** (Plains L3→L2), **Second Wind** (Forest L3→L2), and correspondingly cheapen all five mandatory counterplay tools (Sweep/Second Wind/Cleanse/Brace/Expose Weakness) from ~150-160 essence to ~70 — plus **Step Back** and **Orbit**, which are nominally already early (Mountain L2/L3) but carry a two-color 260-essence cost that contradicts "affordable immediately at unlock."
3. **Introduce catalysts on exactly 9 of the 20 T1 gear items** (each biome's weapon+armor, minus Plains' weapon which the game's own T2 data already keeps catalyst-neutral), at +4/+5 only, using the *same family each item's own T2 successor already uses* — this is not a new design decision, it's extending an existing one backward by one tier.

None of this touches combat stats, recipes' item identity, or the biome XP curve.

---

## 2. Locked Economy Philosophy (restated, with the T1 consequence)

| # | Principle | What it means for T1 concretely |
|---|---|---|
| 1 | Biome mastery (L6) completes before full +5 optimization | L6 must not require near-max gear to reach; the audit found no such block today (§8 of the audit) — preserved by not raising L5/L6 gate levels on any core item. |
| 2 | +5 is the current T1 boss-balance reference | Preserve GM30 gate on +5; do not touch the GM6/12/18/24/30 ladder. |
3 | Upgrade costs must accelerate, no +3/+4/+5 plateau | New grammar (§4) below. |
| 4 | Base crafts arrive fast; weapon stays first | Weapon stays L1 everywhere (unchanged); no item moves later than its current level. |
| 5 | Counterplay tools are cheap, essence-only, and arrive at/before their mechanic | Two moves (§3) + a blanket cost cut on all mandatory Techniques/Guards/Runes (§6). |
| 6 | Catalysts are a light T1 introduction | 9 items, +4/+5 only, families inherited from each item's own T2 lineage (§7). |
| 7 | Transitional gear replacement needs no refund | No refund mechanic proposed; §8 flags which route legs should stop upgrading a soon-replaced weapon earlier. |
| 8 | Routes need not spend identical currency | Preserved — Slinger's Cave-red asymmetry (audit §6.6) is left alone, just re-flagged for 1× validation (§10). |

---

## 3. Proposed L1–L6 Unlock Schedule

**Unlock philosophy used below** (not mechanically forced onto every biome — see deviations noted per row):

- **L1** — immediate power: the weapon.
- **L2** — early defense *and* first mechanic support: the armor, plus the biome's mandatory counterplay tool if the biome's core threat is already live at L2 (pack pressure, telegraphed hits, hazard terrain).
- **L3** — core biome tool: the charm (the biome's signature sustain/utility stat), plus any counterplay tool whose threat ramps in a bit later (DoT stacking, single hard-hitting elites).
- **L4** — specialization: the boots, plus any remaining optional/utility rune.
- **L5** — advanced/optional tool: only where one already exists (Mountain's Power Strike). No new item is invented to fill this slot elsewhere.
- **L6** — mastery endpoint: no new unlock. This is intentional — L6 should feel like "I have my kit, now I polish it," matching principle 1.

### 3.1 Plains (yellow) — mob density 48, the swarm biome

| Level | Proposed unlock(s) | Current unlock | Reason |
|---|---|---|---|
| L1 | Iron Broadsword | L1 (unchanged) | Immediate power. |
| L2 | Survivor's Robe **+ Sweep** | Armor L2, Sweep **L3** | Plains is the highest-density T1 biome (48 mob density, the audit's own §2.3) — the pack-pressure "answer tool" should not lag one full level behind the armor that already exists for the same threat. **Move Sweep from L3 to L2.** This is the single clearest violation of principle 5 found in the current data: Sweep is explicitly the tool that "solves" the mechanic the player is already suffering from the moment they arrive. |
| L3 | Plains Stone | L3 (unchanged) | Core biome tool — kill-chain Recovery, the payoff for clearing swarms fast. |
| L4 | Fleet Boots | L4 (unchanged) | Specialization — kill-momentum boots, a polish item once the swarm loop is already working. |
| L5/L6 | — | — | Plains has no rune content at T1 (confirmed: zero `recipeGroup: 'plains'` entries in `runeRecipes.ts`) — consistent with its "generalist, simple" identity; no gap to fill. |

Mandatory counterplay: **Sweep**. Base equipment: weapon, armor, charm, boots. No optional specialization exists at T1 for this biome.

### 3.2 Forest (green) — frequent small hits, attrition

| Level | Proposed unlock(s) | Current unlock | Reason |
|---|---|---|---|
| L1 | Flash Rapier | L1 (unchanged) | Immediate power. |
| L2 | Shaded Bindings **+ Second Wind** | Armor L2, Second Wind **L3** | Same logic as Sweep: Forest's threat (frequent small hits, sustained attrition) is live from the moment the player enters. Second Wind is the sustain "answer" and should not sit a full level behind the evasion armor that partially answers the same problem. **Move Second Wind from L3 to L2.** |
| L3 | Heartroot Amulet **+ Out of Combat, Reload Safely** | Charm L3; both runes already L2 | Charm arrives with its core biome tool; the two OOC-maintenance runes (`when-idle`, `tactical-reload`) are quality-of-life, not counterplay — **pushed from L2 to L3** so L2 reads cleanly as "defense + mandatory counterplay" and L3 as "core tool + light utility." |
| L4 | Sprinter Wraps **+ Ready Execution** | Boots L4; rune L3 | Traversal boots plus the cooldown-class execution-wait rune, both specialization/QoL, **Ready Execution pushed L3→L4**. |
| L5 | **Focus Highest HP** | L4 | A targeting-priority rune is optional specialization (it changes *which* target auto-combat prefers, not whether the player survives) — **pushed from L4 to L5**, matching the "advanced/optional tool" tier and freeing L4 to read as pure specialization-not-targeting-logic. |
| L6 | — | — | Mastery endpoint. |

Mandatory counterplay: **Second Wind**. Optional/specialized: Out of Combat, Reload Safely, Ready Execution, Focus Highest HP.

### 3.3 Swamp (purple) — DoT/attrition, hazard terrain

| Level | Proposed unlock(s) | Current unlock | Reason |
|---|---|---|---|
| L1 | Poison Dagger | L1 (unchanged) | Immediate power. |
| L2 | Arcane Wrappings **+ Avoid Hazards** | Both already L2 | Already correct: hazard terrain is a from-the-start Swamp threat, and Avoid Hazards is already the cheapest rune in the game (90 purple). No change needed. |
| L3 | Murk Eye **+ Cleanse** | Both already L3 | Already correct and thematically tight: the periodic-Recovery charm and the DoT-stripping Guard are both attrition answers, and DoT stacking (Cleanse's real target) ramps in slightly after the hazard terrain (Avoid Hazards' target), which is exactly why Cleanse sitting one level later than Avoid Hazards is *not* a violation of principle 5 — it already matches the mechanic's own ramp. |
| L4 | Marsh Treads | L4 (unchanged) | Specialization — slow resistance. |
| L5/L6 | — | — | No further T1 Swamp rune content exists (Surrounded/Focus Lowest/Let Dots Finish/Spread Dots are all T2). |

Mandatory counterplay: **Avoid Hazards, Cleanse** — both already well-placed. No change proposed for Swamp beyond the cost cut in §6.

### 3.4 Mountain (blue) — telegraphed heavy hits

| Level | Proposed unlock(s) | Current unlock | Reason |
|---|---|---|---|
| L1 | Heavy Hammer | L1 (unchanged) | Immediate power. |
| L2 | Fallen Knight Plate **+ Step Back** | Both already L2 | Already correct: telegraphed hits are live immediately, Step Back is the dodge answer. Cost is the problem here, not placement (§6). |
| L3 | Granite Barrier **+ Brace + Orbit (Keep Distance)** | All already L3 | Already correct and coherent: Barrier (passive shield) and Brace (active mitigation) are both answers to the same "one big hit" rhythm the audit's own recipe comments describe, and Orbit is the ranged-specific kiting counterplay for the same threat. No change needed beyond cost. |
| L4 | Iron Treads | L4 (unchanged) | Specialization — continuous gap-closing. |
| L5 | Power Strike | L5 (unchanged) | This is already exactly the "advanced/optional tool" the philosophy calls for — it is explicitly authored as "the biome that taught you to read a wind-up teaches you to perform one" (`abilityRecipes.ts:94-95`), i.e., a deliberate second, later reward. Keep as-is; see §6 for the separate question of why no canonical route currently equips it. |
| L6 | — | — | Mastery endpoint. |

Mandatory counterplay: **Step Back, Brace** (Orbit for ranged builds specifically) — all already well-placed. No unlock-level change proposed for Mountain.

### 3.5 Cave (red) — few, elite, dangerous-to-overpull

| Level | Proposed unlock(s) | Current unlock | Reason |
|---|---|---|---|
| L1 | Chaotic Axe | L1 (unchanged) | Immediate power (with its own structural drawback — dead swings — which is the point). |
| L2 | Bestial Hide **+ HP Below 25% (+ Flee, optional)** | Armor L2; both runes L2 | Bestial Hide's %DR answers "elites hit hard" from the start; HP Below 25% is the emergency-condition primitive several other rules key off, so it belongs at the same level as the armor it protects. Flee (also L2) stays available but is explicitly optional — no canonical route equips it (audit §6.4), and it is not one of the six named mandatory tools in principle 5. |
| L3 | Pulse Stone **+ Expose Weakness + Recover First + Careful Pulling** | All already L3 | Already correct: the Absorb charm, the single-target execute Technique, the OOC-heal-wait rune, and the overpull-avoidance rune all answer "few but elite" together. |
| L4 | Bat Wing Boots | L4 (unchanged) | Specialization — stealth reduces overpull risk further, a natural follow-on to Careful Pulling, appropriately gated one level later. |
| L5/L6 | — | — | Mastery endpoint. |

Mandatory counterplay: **Expose Weakness**. Broadly useful: HP Below 25%, Recover First, Careful Pulling. Optional/never-equipped: Flee.

### 3.6 Summary of actual level changes

Only **three** unlock-level moves are proposed tier-wide (everything else in the table above is either unchanged or a reclassification with no level change):

| Item | Current | Proposed | Why |
|---|---|---|---|
| Sweep | Plains L3 | Plains **L2** | Mandatory swarm counterplay was lagging its own biome's start-of-threat. |
| Second Wind | Forest L3 | Forest **L2** | Mandatory attrition counterplay was lagging its own biome's start-of-threat. |
| Focus Highest HP | Forest L4 | Forest **L5** | Reclassified as optional targeting specialization, not core-band content. |

This is deliberately conservative — the audit found Swamp, Mountain, and Cave's counterplay placement already coherent (§8 of the audit: "no case of unlocks far earlier than affordable... found at T1"). The redesign should not manufacture problems that don't exist; it should fix the two genuine mismatches (Plains, Forest) and leave the rest alone.

---

## 4. Upgrade-Cost Grammar

**Rule:** for any item with base cost *B* and a fixed *post-base upgrade budget* (the sum spent across +1..+5), split that budget **5% / 10% / 16% / 26% / 43%** across +1/+2/+3/+4/+5. This produces the qualitative shape requested (`1 → ~1.5–2 → ~3 → ~5 → ~8`, generalized as a geometric-ish ladder normalized to 100%) with **69% of the upgrade budget concentrated in +4/+5**, zero plateau, and every step strictly larger than the last.

Where practical, this proposal **holds each item's current total→+5 cost fixed** and only redistributes it — this is a reshaping exercise, not a cost-inflation pass, because principle 1 explicitly warns against making biome mastery (which depends on affording L1-L4 items along the way) slower. A few items round to a total a handful of essence off their current figure; that's rounding noise, not a design choice.

Applied to the four current base-cost tiers observed in the live data (weapon/armor ≈ 20-26, charm ≈ 15-18, mobility ≈ 10-18 — this hierarchy is already how the game is authored, so it's preserved rather than re-invented):

| Slot | Example base | +1 (5%) | +2 (10%) | +3 (16%) | +4 (26%) | +5 (43%) | Total | % in +4/+5 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Weapon (Iron Broadsword) | 10 | 10 | 10 | 35 | 60 | 100 | 225 | 71% |
| Armor (Survivor's Robe) | 20 | 20 | 20 | 45 | 70 | 200 | 375 | 72% |
| Charm (Plains Stone) | 10 | 10 | 10 | 20 | 30 | 75 | 155 | 68% |
| Mobility (Fleet Boots) | 10 | 10 | 10 | 15 | 25 | 40 | 110 | 59% |

Slot hierarchy is preserved by construction: weapon/armor carry the largest post-base budgets (they already do, in the live data), charm sits below them, mobility sits lowest — matching the instruction "weapon/armor = larger investment; charm = medium; mobility = cheaper" without hand-picking exceptions.

**Kill-equivalent sanity check** (static approximation only, per the audit's monster essence table — not a runtime prediction): Plains kills run 2-3 yellow essence each. A full weapon +0→+5 at 225-240 yellow ≈ 75-120 kills; a full four-item Plains kit at ≈900-1,000 yellow total ≈ 300-500 kills across the whole biome leg (including the +2 XP-bound levels the player is farming through anyway, this does not read as an added grind — it's within the same order of magnitude the audit's current totals already imply, ~350-530 kill-equivalents). This is the kind of check this document can do; §10's 1× run is what actually validates it.

**Flash Rapier resolved:** the audit flagged Flash Rapier (120/240/480, doubling all the way to +5, no plateau) as the one item whose curve doesn't match its 19 siblings. Under the new grammar, Flash Rapier's shape *is* the target shape — every other item should look more like Flash Rapier, not the reverse. No change to Flash Rapier's numbers is proposed; its existing curve already satisfies principle 3.

---

## 5. Complete Proposed Gear-Cost Table

All catalyst assignments are explained in §7. "—" means no catalyst at that step (proposal keeps catalysts off charm/mobility everywhere at T1, and off the Plains weapon specifically — see §7).

| Item | Biome | Slot | Current base/+1/+2/+3/+4/+5 | Proposed base/+1/+2/+3/+4/+5 | Cat @+4 | Cat @+5 | Rationale |
|---|---|---|---|---|---|---|---|
| Iron Broadsword | Plains | weapon | 10/20/30/60/60/60 | 10/10/10/35/60/100 | — | — | Grammar applied; stays catalyst-neutral (matches its own T2 successor, which is also catalyst-free — an intentional "flexible payment" identity per source comment). |
| Survivor's Robe | Plains | armor | 20/30/60/120/120/120 | 20/20/20/45/70/200 | alacrity 1 | alacrity 2 | Grammar applied; alacrity inherited from `plains-vest-t2`'s own family-tag ("plating answers frequent light hits → Alacrity"). |
| Plains Stone | Plains | charm | 10/12/24/48/48/48 | 10/10/10/20/30/75 | — | — | Grammar applied; no catalyst (light-touch, charm/mobility stay clean). |
| Fleet Boots | Plains | mobility | 10/10/20/40/40/40 | 10/10/10/15/25/40 | — | — | Grammar applied. |
| Flash Rapier | Forest | weapon | 20/30/60/120/240/480 | **unchanged** (20/30/60/120/240/480) | alacrity 1 | alacrity 2 | Already matches the target shape (§4) — the outlier is now the template. Catalyst added at +4/+5 from `gale-needle`/`thorn-needle`'s shared alacrity tag. |
| Shaded Bindings | Forest | armor | 20/30/60/120/120/120 | 20/20/20/45/70/200 | alacrity 1 | alacrity 2 | Grammar applied; alacrity from `forest-vest-t2`. |
| Heartroot Amulet | Forest | charm | 15/15/30/60/60/60 | 15/10/20/35/60/100 | — | — | Grammar applied; `forest-charm-t2` itself carries no catalyst — precedent for staying clean. |
| Sprinter Wraps | Forest | mobility | 10/10/20/40/40/40 | 10/10/10/15/25/40 | — | — | Grammar applied; `forest-boots-t2` also carries no catalyst. |
| Poison Dagger | Swamp | weapon | 22/30/60/120/120/120 | 22/20/45/70/115/200 | fortified 1 | fortified 2 | Grammar applied; fortified from `ashbrand-blade`'s own T2 successor tag ("poison DoT-conversion weapon → Fortified"). |
| Arcane Wrappings | Swamp | armor | 22/30/60/120/120/120 | 22/20/45/70/115/200 | fortified 1 | fortified 2 | Same grammar; fortified from `swamp-vest-t2` ("dot-resistance armor → Fortified"). |
| Murk Eye | Swamp | charm | 18/15/33/63/63/63 | 18/10/25/40/60/100 | — | — | Grammar applied; no catalyst (light touch). |
| Marsh Treads | Swamp | mobility | 18/10/22/42/42/42 | 18/10/15/25/40/70 | — | — | Grammar applied. |
| Heavy Hammer | Mountain | weapon | 22/30/66/126/126/126 | 22/25/45/75/125/205 | heavy 1 | heavy 2 | Grammar applied; heavy from `mountain-hammer-t2`'s own tag ("slow heavy hammer → Heavy"). |
| Fallen Knight Plate | Mountain | armor | 22/30/66/126/126/126 | 22/25/45/75/125/205 | heavy 1 | heavy 2 | Same grammar; heavy from `mountain-vest-t2` ("Guard-amplifying plate → Heavy"). |
| Granite Barrier | Mountain | charm | 18/15/33/63/63/63 | 18/10/25/40/60/100 | — | — | Grammar applied; no catalyst. |
| Iron Treads | Mountain | mobility | 18/10/22/42/42/42 | 18/10/15/25/40/70 | — | — | Grammar applied. |
| Chaotic Axe | Cave | weapon | 26/30/66/126/126/126 | 26/25/45/75/125/205 | swarming 1 | swarming 2 | Grammar applied; swarming from `ruinous-axe`'s own tag ("chaotic-axe (counted disruption) → Swarming"). |
| Bestial Hide | Cave | armor | 22/50/100/150/150/150 | 22/30/60/95/155/260 | swarming 1 | swarming 2 | Grammar applied to its larger budget; swarming from `cave-vest-t2` ("premium %DR generalist wall → Swarming"). |
| Pulse Stone | Cave | charm | 18/15/33/63/63/63 | 18/10/25/40/60/100 | — | — | Grammar applied; no catalyst. |
| Bat Wing Boots | Cave | mobility | 18/10/22/42/42/42 | 18/10/15/25/40/70 | — | — | Grammar applied. |

No item's combat stats or upgrade-step stat grants change — only the essence/catalyst cost columns above are in scope.

---

## 6. Ability / Guard / Rune Proposal

Live-source check performed per the task instructions:

- **`wait-for-regen` is a real, gated recipe** (`rune-recipe-recover-first`, Cave L3, cost `red 140, green 100`, `runeRecipes.ts:139-149`) — it is not a free default. This resolves the audit's UNKNOWN (§3/§9 of the audit): every T1 route's final rune set includes it because it *is* craftable and cheap enough to fold into the standard Cave-leg shopping list, not because it's free. It should be classified as **broadly useful**, not mandatory counterplay (it's an OOC convenience, not a combat-survival tool), but every route equips it in practice — worth keeping cheap regardless of classification.
- **Power Strike is genuinely unused by canonical routes, and this reads as intentional, not a bug.** All eight routes (`t1RouteBuilder.ts`) keep Sweep in the Technique slot through Mountain and only switch to Expose Weakness at Cave (audit §6.4) — Power Strike, gated at Mountain L5 with its own design comment calling it a deliberate *second*, later reward on the same biome, was never wired into any route's Technique slot. This is optional/specialized content by design, sitting correctly at L5 per §3.4 above. No change proposed; flagged in §9 as worth a designer confirmation that "unused by the bot ≠ should be removed," since a human player picking Power Strike over Sweep is a legitimate build choice the bot routes don't explore.

| Ability/Rune | Kind | Current unlock | Current cost | Proposed unlock | Proposed cost | Classification |
|---|---|---|---|---|---|---|
| Sweep | Technique | Plains L3 | yellow 160 | **Plains L2** | **yellow 70** | Required counterplay |
| Second Wind | Guard | Forest L3 | green 150 | **Forest L2** | **green 70** | Required counterplay |
| Cleanse | Guard | Swamp L3 | purple 150 | Swamp L3 (unchanged) | **purple 70** | Required counterplay |
| Brace | Guard | Mountain L3 | blue 150 | Mountain L3 (unchanged) | **blue 70** | Required counterplay |
| Expose Weakness | Technique | Cave L3 | red 150 | Cave L3 (unchanged) | **red 70** | Required counterplay |
| Avoid Hazards | Rune | Swamp L2 | purple 90 | Swamp L2 (unchanged) | purple 70 | Required counterplay |
| Step Back | Rune | Mountain L2 | blue 180, yellow 80 (260 total) | Mountain L2 (unchanged) | **blue 70, yellow 30** (100 total) | Required counterplay |
| Orbit (Keep Distance) | Rune | Mountain L3 | blue 180, yellow 80 (260 total) | Mountain L3 (unchanged) | **blue 70, yellow 30** (100 total) | Required counterplay (ranged builds) |
| HP Below 25% | Rune | Cave L2 | red 180 | Cave L2 (unchanged) | **red 90** | Broadly useful |
| Recover First (`wait-for-regen`) | Rune | Cave L3 | red 140, green 100 (240 total) | Cave L3 (unchanged) | **red 70, green 50** (120 total) | Broadly useful |
| Careful Pulling | Rune | Cave L3 | red 180 | Cave L3 (unchanged) | **red 120** | Broadly useful/specialized |
| Out of Combat | Rune | Forest L2 | green 180 | **Forest L3** | green 150 (unchanged) | Broadly useful |
| Reload Safely | Rune | Forest L2 | green 140, blue 60 | **Forest L3** | unchanged | Broadly useful (reload classes) |
| Ready Execution | Rune | Forest L3 | green 140, red 60 | **Forest L4** | unchanged | Broadly useful (cooldown classes) |
| Focus Highest HP | Rune | Forest L4 | green 220 | **Forest L5** | unchanged | Specialized/optional |
| Flee | Rune | Cave L2 | red 160, green 80 | Cave L2 (unchanged) | unchanged | Specialized/unused — flag for §9 |
| Power Strike | Technique | Mountain L5 | blue 190 | Mountain L5 (unchanged) | unchanged | Specialized/optional (unused by bot routes by design) |

Required counterplay costs are cut to a flat **70 of the item's own biome color** (down from 150-160, and down from Step Back/Orbit's two-color 260) — this puts each mandatory tool in the same range as a single item's +2-ish upgrade step (see §5), i.e., "a quick side-purchase," not "a fifth major gear item." Every required-counterplay tool remains essence-only, no catalyst, matching principle 5's hard rule.

---

## 7. Catalyst Introduction Proposal

**Method:** rather than inventing new family assignments, this proposal extends **the family each item's own lineage already uses at T2+** back into that item's T1 form by one tier. This is directly grounded in source — every T2/T3/T4 recipe in the game already carries a `// family-tag: ... → <Family>` comment (confirmed via a full-repo grep), and the mapping is stable per lineage:

| Biome | Established family (from T2 family-tags) | T1 items receiving it |
|---|---|---|
| Plains | **alacrity** (armor/charm/boots); weapon stays neutral by explicit design comment | Survivor's Robe only |
| Forest | **alacrity** (weapon+armor); core diverges to fortified | Flash Rapier, Shaded Bindings |
| Swamp | **fortified** (all four gear slots) | Poison Dagger, Arcane Wrappings |
| Mountain | **heavy** (all four gear slots) | Heavy Hammer, Fallen Knight Plate |
| Cave | **swarming** (all four gear slots) | Chaotic Axe, Bestial Hide |

**Quantities are deliberately conservative** per principle 6 — 1 unit at +4, 2 units at +5, and only on the two "big" slots (weapon+armor) per biome, leaving charm and mobility catalyst-free at T1 (this also mirrors the live game: even at T2, Plains' and Forest's charm/boots recipes carry no catalyst cost at all — the light-touch pattern already exists one tier up).

| Item | +4 catalyst | +5 catalyst | Family | Mechanical rationale |
|---|---|---|---|---|
| Survivor's Robe | 1 | 2 | alacrity | Plating that answers frequent light hits — same rationale its T2 successor (`plains-vest-t2`) already carries. |
| Flash Rapier | 1 | 2 | alacrity | Fast-cadence weapon; identical family to both its T2 evolutions (`gale-needle`, `thorn-needle`). |
| Shaded Bindings | 1 | 2 | alacrity | Evasion armor against frequent light hits — same as `forest-vest-t2`. |
| Poison Dagger | 1 | 2 | fortified | DoT-conversion weapon — same as `ashbrand-blade`'s own T2 form. |
| Arcane Wrappings | 1 | 2 | fortified | DoT-resistance armor — same as `swamp-vest-t2`. |
| Heavy Hammer | 1 | 2 | heavy | Slow, high-alpha weapon — same as its T2 hammer successor. |
| Fallen Knight Plate | 1 | 2 | heavy | Guard-amplifying plate — same as `mountain-vest-t2`. |
| Chaotic Axe | 1 | 2 | swarming | Counted-disruption (dead-swing) weapon — same as `ruinous-axe`. |
| Bestial Hide | 1 | 2 | swarming | Premium generalist %DR wall — same as `cave-vest-t2`. |

**Total catalyst demand for a representative +5 boss loadout** (weapon + armor both pushed to +5, the two items above that a boss-ready build is most likely to max — the rest of the kit can reasonably stay at +3/+4 per principle 1):

- **Melee canonical (Striker/Squire dodge or Brace-tank):** if the final boss weapon+armor is Cave's Chaotic Axe + Fallen Knight Plate/Bestial Hide (audit §6.4-6.5 — Mountain armor is used through the whole boss gauntlet for most routes), demand skews **swarming + heavy**, roughly 3 units each at full +4/+5 investment on both slots (6 units total, split across two families).
- **Ranged canonical (Spirit/Conduit):** same item set as melee per the audit's "functionally identical gear plan" finding (§6.5 of the audit) — same **swarming + heavy** demand.
- **Apprentice:** adds `swamp-vest-t1` as an extra armor craft — if pushed to +5 this adds **fortified** demand on top of the shared set.
- **Slinger:** never crafts Cave gear at all (audit §6.5/§6.6) — this route's +5 targets are necessarily drawn from Plains/Forest/Swamp/Mountain only, so its catalyst demand should skew toward **alacrity/fortified/heavy**, never swarming. This is a second-order consequence of the same red-essence asymmetry the audit already flagged (§9) and is not a new finding, just its catalyst-side shadow.

**Families needing focused measurement in the 1× validation:** swarming and heavy (the two families every melee/ranged canonical route will touch via Cave/Mountain gear) are the ones most likely to be under- or over-supplied relative to demand — Cave's own native modifier is dominion, not swarming (audit §5.1), and Mountain's native modifier is heavy, which *does* line up. Whether a player naturally banks enough swarming catalyst while farming Cave (whose statistically-likely modifier is dominion, not swarming) to afford Chaotic Axe's +4/+5 without a detour is exactly the kind of question this document cannot answer from static data alone.

---

## 8. Canonical-Route Implications (not implemented — flagged for a future route pass)

| Route family | Likely transitional items | Likely +5 targets | Route change signal |
|---|---|---|---|
| Striker/Squire (dodge) | Iron Broadsword (→ Flash Rapier → Chaotic Axe), Flash Rapier itself | Chaotic Axe, Fallen Knight Plate/Bestial Hide (boss armor) | **Likely**: under the new grammar, pushing Iron Broadsword past +1 (10-10 for +1/+2) is cheap enough it may no longer be worth skipping — re-check whether the route should take Broadsword to +2 before replacing it, now that +1/+2 are individually cheaper than today. |
| Striker/Squire (Brace-tank) | Same as above | Same as above, plus Brace | No change signal beyond the shared one above. |
| Spirit/Conduit | Same shared gear plan per audit finding | Same as melee | **No change** — the redesign doesn't touch the underlying "identical to melee" question; that's a separate open item (audit §9 #2). |
| Slinger | Its own distinct Swamp/Forest-heavy plan; never touches Cave gear | Whatever its final Swamp/Mountain armor is (needs re-verification, audit §6.5) | **Possible**: Slinger's catalyst demand will concentrate in alacrity/fortified/heavy with zero swarming exposure — worth checking this doesn't starve it of a family it needs for a *later* tier's gear the moment it leaves T1. |
| Apprentice | `mountain-vest-t1` partially superseded by `swamp-vest-t1` (still ambiguous per audit §9 #8) | Needs direct `t1GearPlans.ts` re-check before any route-level call | **No change** proposed here — this needs the audit's own outstanding precision gap closed first. |

None of these are implemented; they're flagged as **likely / possible / no change** per the task's explicit request, for a future route-adjustment pass.

---

## 9. Open Design Questions (five requiring designer approval, plus supporting context)

1. **Approve the two unlock-level moves** (Sweep Plains L3→L2, Second Wind Forest L3→L2) and the one reclassification (Focus Highest HP Forest L4→L5)? These are the only unlock-level changes in this proposal.
2. **Approve the flat ~70-essence cost for all five mandatory counterplay Techniques/Guards**, down from 150-160, and the reduction of Step Back/Orbit from a 260-total two-color cost to a 100-total two-color cost? This is the largest single number change in the document and directly implements principle 5's "affordable immediately at unlock" rule.
3. **Approve extending each item's existing T2 catalyst family backward into its T1 form**, at 1 unit@+4 / 2 units@+5, on exactly the 9 weapon/armor items listed in §7 — with charm/mobility and the Plains weapon deliberately left catalyst-free?
4. **Should the upgrade-cost grammar (5/10/16/26/43% of post-base budget) hold each item's current total→+5 cost fixed, or should some items' totals also move** (e.g., if the designer believes T1's overall grind should get slightly longer or shorter, independent of curve shape)? This proposal defaults to "hold totals fixed, reshape only" as the more conservative reading of principle 1.
5. **Confirm Power Strike and Flee are intentionally-unused optional content**, not gaps needing a route fix — this proposal treats both as legitimate specialized/unused tiers rather than bugs, but that reading should be confirmed before any future route-authoring pass treats their absence as something to correct.

---

## 10. 1× Validation Hypotheses

The first 1× bot run under this proposed economy needs to prove or disprove:

1. Player reaches each biome L6 before fully optimizing (+5) its important gear.
2. Base item crafts happen shortly after unlock (weapon at L1, armor+mandatory-counterplay at L2).
3. Required counterplay tools (now ~70 essence each, arriving at or one level ahead of their mechanic) are obtained within a short, targeted farm — not a multi-level wait.
4. +1/+2 (now individually cheaper than today for every weapon/armor) do not create meaningful stalls.
5. +3 (now a genuine mid-step, no longer flattened against +4/+5) is noticeable but not oppressive.
6. +4/+5 (now 69% of each item's upgrade budget) account for most optional post-mastery farming, not pre-mastery farming.
7. The 9 catalyst-bearing items' +4/+5 catalyst requirements (1-2 units, swarming/heavy/alacrity/fortified depending on biome) introduce modifier awareness without becoming the main T1 bottleneck — swarming and heavy are the two families most likely to matter (§7) and should get the closest look.
8. A boss-ready +5 loadout (weapon + boss armor, per §7's representative case) is reachable in a reasonable end-of-tier grind under the new totals.
9. No canonical class route gains an extreme pacing advantage from its specific item path — in particular, re-check whether Slinger's zero-swarming-catalyst exposure (a consequence of never crafting Cave gear, audit §6.6) creates a *new* asymmetry on top of the already-flagged red-essence one.

No success thresholds in minutes are proposed here — those follow the first real 1× timing data, per the task's own instruction.

---

## 11. Exact Source Files Inspected

Beyond the full baseline audit (`docs/briefs/T1_PROGRESSION_ECONOMY_BASELINE_2026-08-28.md`), this proposal additionally read live source directly to resolve two audit UNKNOWNs and ground the catalyst-family assignment:

- `shared/src/abilityRecipes.ts` (full file) — confirmed Power Strike's placement/design comment and that it is genuinely unused by canonical routes by construction, not a data gap.
- `shared/src/runeRecipes.ts` (full file) — confirmed `wait-for-regen` (`rune-recipe-recover-first`) is a real, costed, gated recipe (Cave L3, red 140/green 100), resolving the audit's open question about whether it was silently free.
- `shared/src/data/recipes/plains.recipes.ts`, `forest.recipes.ts` (full files) — confirmed the uniform weapon@L1/armor@L2/charm@L3/boots@L4 unlock pattern the task asked to move away from, and extracted the exact `family-tag` catalyst-family comments for each T2 successor item.
- `shared/src/data/recipes/swamp.recipes.ts`, `mountain.recipes.ts`, `cave.recipes.ts` (T1 sections) — confirmed the same L1/L2/L3/L4 pattern holds tier-wide, and pulled T1 stat/mechanic-effect context used to judge each item's mechanical identity for §7.
- Full-repo grep for `family-tag` across `shared/src/data/recipes/*.ts` — the single source for every catalyst-family assignment in §5 and §7; this surfaced the complete, already-live per-lineage family mapping (Plains→alacrity, Forest→alacrity, Swamp→fortified, Mountain→heavy, Cave→swarming) used throughout this proposal instead of inventing new assignments.
