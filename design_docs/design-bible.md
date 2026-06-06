# Idle MMO — Design Bible

**Purpose:** paste at the top of any balance/design session to re-establish intent in minimal context. Terse on purpose. "Tentative" = my proposal, not locked.

---

## 1. Core invariants (never violate)

- **Deterministic.** No RNG. "Dodge" = 1-in-N counter, not a %. Procs/bursts trigger on countable conditions (every Nth hit, on full-HP target, on kill), never on a roll.
- **Separated budgets.** Offense and defense are independent pools. No scaling offense via defense or vice-versa. The *only* stats any node/option may *reduce* are attack speed and move speed (DPS/mobility levers); never eHP.
- **No regression.** Every node adds positive budget; the choices (light/bal/heavy, close/mid/far, tier-ups) re-allocate it. A new tier must feel like a power gain.
- **Fully auto.** No manual inputs in combat. Only player lever is a charge<->kite behavior toggle.
- **Self-reliant grind.** Mitigation + recovery must permit continuous unattended farming.
- **Solo-complete, party-incentivized.** Whole game beatable solo; optional bosses need a group; partying is a large net positive (see §8), never a tax on solo.

---

## 2. Tier & roster model

- Tiers T0->T8. Tier = stat **and** complexity jump. ~2-2.5x power per tier is acceptable/intended.
- **T0** = tutorial (clearing). **T4 = game midpoint** (NOT endgame — keep T4 flavor mundane).
- Each biome spans ~2-3 global tiers (a `-t1` set, a `-t2` set, sometimes `-t3`), then its recipe line ENDS.

**Biome lifespan (decided): cap, don't ever-expand.**
- **Mechanics** are the permanent build vocabulary; they accumulate slowly (~2 new/tier, ~16 by t8). Depth lives here.
- **Biomes** are tier-bounded vessels. A biome produces gear for ~2-3 tiers, then retires; its mechanic is re-housed in a later biome.
- **Later biomes are richer:** early biomes carry 1 mechanic (teaching); later biomes carry 2-3 (inheriting an aging mechanic + introducing a new one). So the *active* roster stays ~5-7 at any tier while the vocabulary grows.
- New mechanics ride in on the new biomes each tier (~2 new biomes/tier, ~2 retire).
- **Staggered retirement (not a flat cliff):** starters cap on a rolling **T2-T4 schedule, ~2 retiring per tier** — never all five at once (that orphans five mechanics and craters the T3 roster). Retire the *simplest/most universal* mechanics first (Plains plating, Forest evasion — easiest to re-house as crosses), keep the *premium/signature* ones live longest (Cave %DR, Mountain cap). Tentative order: Plains/Forest cap ~T2, Mountain/Swamp ~T3, Cave ~T3-4. Net active roster stays ~5-6 every tier.
- **Handoff rule:** a biome may only retire once an *active* biome can re-house its item designs (its weapon archetype + armor/charm mechanics as crosses). No mechanic goes homeless. Each incoming biome should be checked against the outgoing one's kit before retirement is scheduled.
- Consequence: base mechanics (plating/evasion/etc.) stay craftable at t3+ as *crosses* inside the richer advanced biomes, not via "forest t8."

---

## 3. Biome = one theme, expressed three times

A biome's **enemy damage-shape**, **weapon**, and **defensive answer** (armor + charm) all express one theme.

**Density axis (a gradient, NOT binary):**
- High density (many weak) favors: plating, kill-burst, DoT spread, cleave/AoE.
- Low density (few tough) favors: per-hit mitigation, burst/ambush, last-stand, single-target shred.
- Starter biomes sit **mild / near-center** (broadly usable while learning). Specialized later biomes can be **extreme** (graveyard very high, trench very low). Vary the extremity to keep biomes distinct.

**Tier-deepening pattern**
- **Weapons:** keep archetype; scale numbers; optional upgrade-branch fork. *No mechanic drift.*
- **Armor & charms:** T1 pure mechanic -> T2 + one borrowed cross -> T3 both scaled + a wrinkle -> T4 capstone (mechanic at full strength + a signature twist only the mastered biome gets).

---

## 4. Mechanic ownership map (anti-drift backbone)

Each mechanic has ONE home biome. Others borrow it as a cross or scaled variant, never as their headline.

| Mechanic | Home | Type |
|---|---|---|
| plating | Plains | armor |
| evasion | Forest | armor |
| damage cap (max-hit) | Mountain | armor |
| dot-resist | Swamp | armor |
| premium %DR | Cave | armor |
| hit-to-dot (damage debt) | Tundra *(tent.)* | armor |
| debuff-resist + cleanse | Desert | armor |
| hardening (combat-duration plating, resets on big hit) | Jungle *(tent.)* | armor |
| last-stand (deterministic cheat-death) | Desert | armor/charm |
| kill-burst | Plains | charm |
| raw regen (disengage-leveraged) | Forest | charm |
| shield (periodic barrier) | Mountain | charm |
| absorb (damage->heal-over-time) | Swamp | charm |
| regen-burst (periodic pulse) | Cave | charm |
| in-combat-regen | Volcanic *(tent.)* | charm |

---

## 5. Biome roster

### Starters (locked) — gear T1->T2 (cap ~T2; mechanics inherited upward)

**PLAINS — proving ground.** Mild density, weak swarm. *Endure the tide, grind it down.*
- Weapon: **Broadsword** — no mechanic; cheapest, below-curve, universal floor. Doesn't branch.
- Armor (plating): T1 plating -> T2 +absorb -> T4 *Bulwark*: plating gains bonus per nearby enemy.
- Charm (kill-burst): T1 heal-on-kill -> T3 rapid-kill chaining -> T4 kills feed a rolling overheal/plating buffer.

**FOREST — speed.** Mild-high density, fast/frequent light hits. *Too quick to catch.*
- Weapon: **Fast / low per-hit.** Best proc-stacking, plating-vulnerable, weak empowered.
- Armor (evasion): T1 evasion -> T2 +cap -> T4 evasion scales with move speed.
- Charm (raw regen): T1 high flat regen -> T2 shorter regen-delay -> T4 heal-while-moving.

**MOUNTAIN — force.** Mild-low density, slow hard hitters. *Immovable; hits back like a meteor.*
- Weapon: **Slow / high per-hit.** Plating-piercing, strongest empowered, weak proc-stacking.
- Armor (damage cap): T1 cap -> T2 +hit-to-dot debt -> T4 over-threshold hits partially reflect / threshold drops.
- Charm (shield): T1 periodic %shield -> T2 bigger+faster -> T4 shield re-arms on eating a big hit.

**SWAMP — decay.** Medium density, DoT attrition. *Out-rot the rotters.*
- Weapon: **DoT-conversion** — % of attack -> stacking DoT (front-loaded stack weight; "DoT for any class").
- Armor (dot-resist): T1 dot-resist -> T2 +debuff-resist -> T4 convert resisted DoT into healing.
- Charm (absorb): T1 absorb -> T2 +flat regen -> T4 absorb also catches DoT & scales with DoT suffered.

**CAVE — elite.** Low density, tough mixed elites; premium/last starter. *High stakes: biggest damage, most reliable wall.*
- Weapon: **Chaotic Axe** — top raw DPS; every 3rd swing deals no weapon damage but STILL fires on-hit/mechanic gains (proc-heavy builds soft-bypass; pure-attack eats it). *Dead swing must NOT consume Reload ammo.*
- Armor (premium %DR): T1 %DR -> T2 +small in-combat-regen -> T4 %DR ramps over a long single fight.
- Charm (regen-burst): T1 pulse -> T3 pulse grants brief %DR -> T4 pulse interval tightens when low.

### Advanced biomes — gear T2->T4

**JUNGLE (intro T2, high density)** *(tent.)* — cross biome: evasion + recovery + **hardening**. Weapon: **on-hit rapier variant** (atk->on-hit weight; higher DPS; on-hit ignores empowered scaling). Armor: hardening (ramp plating in combat, big hit resets) + evasion. Charm: regen that ramps with combat duration (mirrors hardening). Hybridizing IS its identity.

**DESERT (intro T2, low density) — "the standoff" (locked).** Few tough, debuff-laden enemies. Weapon: **Ambush** (reworked Sacred Cross — empowered on striking a full-HP target). Armor: **last-stand** (one deterministic cheat-death per fight; exact trigger TBD) + **cleanse** secondary. Charm: cleanse / burst-heal-on-kill. Coheres as: alpha-strike the tough target, strip its debuffs, survive if it bites back.

**TUNDRA (intro T3, low-mid density)** *(tent.)* — slow hard hitters (frozen). Armor home: **hit-to-dot debt** + high bulk. Weapon: **frost / slow-debuff** — slows enemy attack speed (a debuff; party hook). Charm: bulk regen (TBD).

**VOLCANIC (intro T4, high density)** *(tent.)* — sustained heat/fire. Charm home: **in-combat-regen** (attrition signature). Weapon: fire/DoT or burn-aura variant. Armor: bulk + regen.

**GRAVEYARD (intro T4, EXTREME high density)** *(tent.)* — overwhelming weak undead. Must carry a NEW mechanic, not re-run plains: candidate weapon **Plague** (DoT spreads on kill / contagion); defensive candidate "overwhelm" (mitigation scales with enemy count). Echoes swarm theme but at the density extreme.

**DEEP-SEA TRENCH (intro T4, EXTREME low density)** *(tent.)* — rare abyssal terrors. Must carry a NEW mechanic, not re-run desert: candidate weapon **Execute** (empowered vs low-HP / finisher) or a crush/pressure mechanic; defensive candidate a heavy single-target damage-cap or a "brace" stance. The single-tough-target extreme.

---

## 6. Weapon archetypes & variant tree

Five base archetypes (= the five starters). Variants keep the archetype's *feel*, shift its *profile*. **Tentative** unless noted; invent freely, cull later.

| Base | Variant | Profile shift | Home |
|---|---|---|---|
| Broadsword | *Banner* (tent.) | below-curve personal + small offense aura | party/later |
| Rapier (fast) | On-hit | atk->on-hit dmg; up DPS, weak empowered | Jungle |
| | *Flurry* (tent.) | APS ramps the longer on one target | later |
| | *Harrier* (tent.) | each hit stacks -DR/-evasion debuff on enemy (fast = fast shred; party) | Tundra/party |
| Hammer (slow) | Empowered | up empowered multiplier | Mountain T3+ |
| | *Sunder* (tent.) | big hits shred enemy plating/DR (party) | party |
| | *Seismic* (tent.) | every Nth hit cleaves nearby (slow weapon vs density) | high-density |
| DoT-conversion | Frost | fewer stacks, harder/slower hits, up conversion (leans on front-load) | Swamp/Tundra |
| | *Plague* (tent.) | DoT spreads to nearby on target death (contagion) | Graveyard |
| | *Weakening* (tent.) | DoT also lowers enemy damage dealt (defensive debuff; party) | party |
| Chaotic Axe | Lower-frequency | dead swing every 4th/5th instead of 3rd | Cave T3+ |
| | Cursed (tent.) | dead swing applies a debuff or self-buff | Cave T3+ |
| | *Reckless* (tent.) | dead swing hits YOU a little; live swings hit even harder (pairs w/ absorb/last-stand) | risk |
| | *Rhythm* (tent.) | dead swing empowers the NEXT swing (skip->crit cadence) | later |
| Ambush (Sacred Cross rework) | Ambush+stun | empowered + extra mult + stun on full-HP target. **Polarizing — gate to low-density biome.** | Desert |
| | Short-buff | brief self-buff on full-HP hit (milder) | sibling/branch |
| | *Rally* (tent.) | full-HP hit emits brief party attack aura (party) | party |
| | *Execute* (tent.) | inverse: empowered vs LOW-HP targets (finisher) | Trench |

---

## 7. Math baseline (skeleton — calibrate absolute numbers via sim)

**Base stats:** HP 100, ATK 15, PLT 2, DR 0, hpRegen 10%/s OOC (4s delay), speed 120. Class root adds up to ~+50 HP (Cooldown).

**eHP (vs a reference hit H):**
`eHP = HP * H / [ (H - plating) * (1 - DR) ]`, with `per-hit dmg = max(1, (H - plating)) * (1 - DR)`. Evasion multiplies eHP by `1/(1 - dodgeRate*mitQuality)`; dodgeRate is a soft-capped function of summed evasion. Damage cap only affects hits > threshold*maxHP (dormant otherwise).

**Reference hit per tier (starting anchors — replace with monster-table medians):** T1 ~24, T2 ~45, T3 ~85, T4 ~160. Set player HP/armor budgets per tier so **eHP/H stays ~constant** (survive ~the same hit-count each tier — the "bigger numbers, same feel" treadmill).

**DPS:** `DPS = ATK * APS * mechFactor`. Across weapon archetypes raw DPS is *intentionally unequal along the fast<->slow axis*: fast = highest raw (pays to plating, weak empowered); slow = lower raw (ignores plating, strong empowered). Do NOT equalize raw DPS — equalize *effective* DPS after the plating/empowered tradeoff.

**TTK targets (starting):** trash ~2-4 hits / ~2-3 s; elite ~8-15 s; tier boss ~30-60 s.

**Relative-balance index (frames, range nodes, variants):** O = ATK*APS*mech; D = eHP; **Budget = O*D**, normalized to the Balanced/Mid option = 100. **Target every alternative within +-20%; +-35% is a hard fail.**

**Mitigation values (rules of thumb):** plating = flat per-hit (great vs many small, wasted vs big); DR = multiplicative (universal, premium); evasion = soft-capped rate (frequent medium hits); cap = anti-spike only; absorb/regen/in-combat = *throughput* (beats sustained, loses to burst). Match source to threat shape (the matrix).

**Healing & debt clamps:**
- Absorb heals on the **final** post-mitigation hit, once; debt ticks do NOT re-trigger absorb.
- **Soft cap total in-combat heal throughput** (regen+absorb+in-combat-regen) at ~3-4% max-HP/sec, diminishing past it. (Calibrate to a target "seconds-to-live for a max-recovery build vs un-out-damageable DPS.")
- Cap **debt conversion** <= ~40-50% (a chunk of every burst lands raw).
- No *hard* caps on individual mitigations — the threat matrix is the structural soft cap (can't be immortal vs all shapes on a split budget).

---

## 8. Party-synergy axis (a variant TAG, not a default)

- Implemented today: debuffs. NOT implemented: auras / shared buffs.
- **Budget rule:** offensive aura/debuff paid from offense budget; defensive from defense budget. Never breaks budget separation.
- **Incentive math:** a debuff/aura helps all N party members -> value scales with party size, cost is fixed -> solo sidegrade, party multiplier. Beats solo only in a group; never makes solo weaker than the untagged option.
- Apply as a tag on select item variants or class nodes. Keep off starter biomes.

---

## 9. Open forks / TBD

- **Cheat-death (desert last-stand):** exact trigger/effect TBD (threshold? recover-to-X%? cooldown?).
- **T4 graveyard/trench:** confirm each carries a NEW mechanic (plague / execute candidates) rather than re-running plains/desert.
- **Per-tier reference-hit + HP curves:** §7 anchors are placeholders — calibrate to real monster tables via sim.
- **Boots:** all identical today; distinct boot designs deferred to a separate pass.
- **Summoner:** frames don't differentiate offense; needs bespoke pass (not yet playtested).
- **Biome lifespan** only bites at t5+; t0-t4 roster is naturally bounded.
