# Tier 3 — Design Plan

**Purpose:** the T3 reference. Slots alongside `design-bible.md` and `player-power-curve.md`. Terse on purpose. "Open" = needs your call (see §9). Mechanics-first; absolute numbers calibrate via sim later.

---

## 0. Headline axis — RANGE & POSITION

T3 adds exactly **one** new strategic dimension (one-axis-per-tier cadence; see §8 for what's deliberately held back). That dimension is *where you fight*.

- **Player side (already in the tree):** the per-class range node — Close / Mid / Far — permanent.
  - **Close** — forced melee (−40 range); max stat budget + a class-specific defensive passive. You eat every hit, you're paid in stats+defense.
  - **Mid** — neutral all-around growth. The safe default.
  - **Far** — +range +move speed, minimal raw stats. "Distance is armor": the kiting payoff *is* the value.
- **Enemy side (T3's actual job):** behaviors that interrogate the choice.
  - **Charger** (exists) — closes the gap → punishes **Far**.
  - **Kiter** (new) — ranged, maintains distance and plinks → punishes **Close** (melee chases, eats free hits).
  - Together they make range matter in *both* directions, and they finally give the **charge/kite toggle** real decisions: charge to catch a kiter, kite to escape a charger. T3 is where the toggle earns its existence.
- **Balance dial:** aim ~50/50 kitable vs anti-kite across the T3 population so Far is a genuine choice, not a trap or an auto-win. Solo-complete still holds: off-matchup is *harder, never impossible*.
- **Not in T3:** enemy *defensive* variety and anti-defense weapon variants. Those are a separate axis (weapon matchups) → parked for T4 (§8).

---

## 1. Roster & retirement

**Active T3 biomes (7):** Mountain, Swamp, Cave, Desert, Jungle, **Volcano** (new), **Tundra** (new).
**Retire at T2:** Plains, Forest. No mechanic is orphaned — re-housed as below:

- **Forest → Jungle** (already by design): evasion + raw-regen + on-hit fast weapon. Jungle *is* the Forest successor — "the fast evasive self-sustainer."
- **Plains → Volcano:** plating **matures into hardening** (ramping plating); kill-burst becomes part of Volcano's charm. (No redundant flat plating — hardening subsumes it.)

---

## 2. Design language — synergy combos (T3+)

Past the T1 teaching tier, armor/charms stop being uni-dimensional.

- A T3 armor/charm is a **2–3 mechanic synergy** whose parts **amplify each other against ONE threat shape** — not a grab-bag of unrelated effects. Swamp's debt loop (hit-to-dot → dot-resist, all anti-big-hit) is the template.
- **Guardrail:** the threat matrix is our only soft cap on immortality. A synergy combo stays a *specialist* (master of its shape, useless off it) → matrix-safe. A breadth grab-bag is a generalist → only legal if **budget-taxed shallow** (weaker than any specialist on its home shape). Default to synergy; breadth rare and taxed.
- Same **equal-budget** method as before — a combo is reallocated budget across mechanics, never extra power.
- **Tier-deepening:** T2 combo → **T3 = scaled + a light wrinkle** → T4 = full capstone (signature twist). Keep T3 wrinkles modest; the big twists are reserved for T4.

---

## 3. Biome kits

| Biome | Armor combo | Charm combo | Weapon (variant) | Enemy texture |
|---|---|---|---|---|
| **Volcano** *(new)* | hardening (matured plating) + light wrinkle | in-combat-regen + kill-burst | **Flurry** (fast; stacking attack-speed, 5–6 stacks) | high-density fire swarm; **ramping strength** (capped); fast/aggressive |
| **Tundra** *(new)* | stationary-ramp DR (new) + cap cross | shield + absorb | **Frost-debuff** slow (slows enemy attack speed; party hook) | low-mid density slow frozen hard-hitters; **ramping debuff** (capped); slow you |
| Mountain | cap + bulk (+ wrinkle: shield re-arms on eating a big hit) | shield | Hammer → **Empowered** | spiky big-hitters + chargers |
| Swamp | dot-resist + hit-to-dot debt + debuff-resist | absorb (also catches DoT) | DoT-conv → **Weakening** | DoT appliers + bulk/regen walls |
| Cave | %DR + in-combat-regen (+ wrinkle: %DR ramps over a long fight) | regen-burst → pulse grants brief %DR | Chaotic Axe → **Cursed** | tanky, consistent (non-spiky) elites; existing defenses only |
| Desert | last-stand + debuff-resist + cleanse | cleanse / burst-heal-on-kill | Ambush → **+stun** | debuff appliers + ranged standoff (kiter taste) |
| Jungle | evasion + raw-regen | ramping regen (grows with combat duration) | On-hit rapier (+ **Harrier** party fork) | fast aggressive evasive swarm (high density) |

**New-biome identity notes:**

- **Volcano** — *burst it or out-sustain it.* The swarm chips and the enemies ramp (heat builds), so melee facetanks with hardening + heals through with in-combat-regen + kill-burst; Far struggles (density catches you, ramp punishes slow kills).
- **Tundra** — *plant and outlast.* Enemies slow you (the anti-kite — catches Far) and stack ramping debuffs; you plant, the shield soaks the opening while stationary-DR ramps into a wall, absorb heals the chip, and your frost weapon slows them back. Real **plant-vs-burst tension**: the enemy's ramping debuff *and* your stationary armor both reward a long fight, so "out-ramp them" vs "kill before the debuffs bite" is a live decision (both caps must be tuned so neither fully wins).

Persisting biomes (Mountain/Swamp/Cave/Desert/Jungle) are mostly **scale their T2 combo + add their variant fork + a light wrinkle** — the new design energy goes to the two new biomes and the range axis.

---

## 4. Enemy-texture toolkit (T3 scope)

- **Offense profiles:** slow bruiser (kitable), ranged (ignores kiting), charger (anti-Far, exists), fast mover (catches kiters), **ramping** (Volcano).
- **Behaviors:** charge (exists), **kite** (new), flee — *deferred*: only on elites or as a brief reposition, never trash (AFK-farming friction).
- **Defenses (T3 = existing only):** plating, %DR, evasion. Shield / soft-cap = T4 (§8).
- **Ramping (both capped):** Volcano = ramping **strength**; Tundra = ramping **debuff**. Tundra's debuff cap is load-bearing — an uncapped attack-speed debuff spirals (slower attack → slower kill → more stacks); cap it so you can always still kill.

---

## 5. Variant set (curated — ~1 meaningful fork per biome)

Volcano **Flurry** · Tundra **Frost-debuff** · Mountain **Empowered** · Swamp **Weakening** · Cave **Cursed** axe · Desert **Ambush+stun** · Jungle on-hit **+ Harrier** (party).
*Plains Broadsword retires (floor/teaching weapon; its only future is the Banner party-variant, later). Anti-armor **Sunder** waits for T4, when enemy defenses give it a reason to exist.*

---

## 6. Numbers (calibrate via sim — this doc is mechanics-first)

- T3 enemy-curve anchors (power doc §3): **H_med ~44 / H_big ~70 / mob-HP ~440 / single-mob DPS ~34**; growth ~1.9–2× per tier. (Bible §7 lists a heavier reference-hit anchor ~85 for eHP budgeting — reconcile via sim; see §9.)
- Item budgets: extrapolate the **equal-budget armor** method and the **non-equalized weapon** method to T3. Re-run `power_curve.py` once T3 items are drafted to replace the budget rows (deferred until items exist).

---

## 7. New engine keys (implementation gate)

**Player-side new:**
- `stationary-ramp DR` — ramps DR/plating while a "stationary" timer accrues; decays on move. (Tundra armor.)
- `flurry` — stacking attack-speed on attacking, capped 5–6, decays off-target. (Volcano weapon.)
- `frost-debuff` — on hit, apply a capped enemy attack-speed debuff. (Tundra weapon.)
- `weakening` — DoT also lowers enemy damage dealt. (Swamp variant.)
- `harrier` — on hit, stack a −DR/−evasion debuff on the enemy. (Jungle party fork.)
- `cursed dead-swing` — Chaotic Axe dead swing applies a debuff/self-buff. (Cave variant.)

**Already in the engine gate / exist:** hardening (keys exist; home moves Jungle→Volcano), in-combat-regen, shield, absorb, cap, %DR, dot-resist, hit-to-dot debt, last-stand, cleanse, kill-burst, regen-burst, Empowered, evasion, range node.

**Enemy-side new:**
- `kite` AI — ranged enemy maintains standoff distance.
- `ramping-attack` (capped) — Volcano.
- `ramping-debuff` (capped) — Tundra.
- *(flee — deferred.)*
**Exist:** charge, ranged, evasion, DoT, slow.

---

## 8. T4 preview (parked — capture, don't build)

The deliberately-held-back material, so it's not lost:
- **Enemy defensive variety** (the weapon-matchup axis): **shield** (periodic barrier → rewards burst, punishes DoT/chip), **soft-cap** (clips big hits → punishes slow/empowered, complements plating). Cave + the T4 biomes become the showcase. *Idle guardrail: no enemy defense may make a fight unwinnable for any build; enemy self-heal/absorb only as a capped decaying buffer.*
- **Anti-defense weapon variants:** Sunder (strip enemy plating/soft-cap), Weakening (if not spent at T3).
- **Capstones:** the full signature twists per bible §5 (gear's first full expression).
- **Graveyard / Trench:** extreme densities + their new mechanics (plague / execute).
- *(T5 = packs & AoE-vs-single-target, gated to the passive tree — already your plan.)*

---

## 9. Open / needs your call

- **Tundra weapon:** frost-debuff slow (recommended) vs reviving the old Sacred Cross — need the original Sacred Cross stats to judge.
- **T3 wrinkles:** keep the modest per-biome wrinkles (Mountain shield-rearm, Cave %DR-ramp, Swamp absorb-catches-DoT), or defer all wrinkles to T4 to keep T3 even leaner?
- **Number anchors:** resolve the §3 (H_med 44) vs bible §7 (ref-hit 85) discrepancy via sim before setting item budgets.
- **Flee behavior:** include on elites, or fully defer?
- **Cave T3:** confirm it uses only existing defenses (shield/soft-cap held to T4).

---

## 10. Build order (after this plan is signed off)

1. **Items** — the 7 biome kits + variants (armor combos, charms, weapons) at T3 budgets.
2. **Mobs** — built from the texture toolkit (offense × behavior, T3-scope defenses), per biome.
3. **Wire into biomes** — pools/densities for the 7 active biomes; retire Plains/Forest pools.
4. **Bosses** — last. *(Separately: T2 bosses need an intent pass — flagged for a later session, not part of T3.)*
