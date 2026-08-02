# Design Brief D2 — Relics

**For:** an external design session. Self-contained — assume no prior knowledge
of this project.
**Returns to:** `docs/next-playtest-implementation-plan.md` steps 1.5 and 2.4.
**Written:** 2026-08-02.
**Read D3 (tiers 5–6) first if both are being run** — this brief needs to know
which tiers relics must reach.

> **Send `docs/briefs/d2-relics-seam-audit.md` along with this brief.** It is a
> code-level audit of exactly which mechanic hooks already exist, verified
> against the source. Its **passive-key inventory** (§"The passive-key inventory")
> is the single most useful input to the catalogue you are being asked to write:
> roughly 150 archetype keys are already live and are the intended hook for most
> relics. §8 below summarises the audit's conclusions that change the design;
> the audit itself has the file:line citations.

---

## 1. The game, in one page

**MMO Idle** is an automatic-combat idle RPG. The player never controls the
character in combat — they build it. Every decision is a *preparation* decision:
class path, gear, abilities, stances, rites, runes, party, and routing. The
server decides all outcomes authoritatively.

The player fantasy is **"you are the trainer/programmer of an autonomous hero"**
— a coach, not a fighter.

Progression runs on **player tier** (T1–T4 today, T5–T6 in design, T8 eventually)
and **biome level** (per-biome mastery that gates recipes). Currency is essence
and catalysts, both earned from kills. There is no trade and no player economy.

---

## 2. What you are being asked to decide

The **relic system**: a new build layer arriving at T4.

**The design axis is already settled and is not open for re-litigation:**

> **Cores are stat amplifiers that reinforce your ROLE.**
> **Relics operate at the MECHANIC level and reinforce your CLASS MECHANIC.**

Your job is to turn that sentence into an implementable system: where relic state
lives, which mechanics each relic touches and how, what the trade-offs are, and
how relics are earned.

---

## 3. Grounding — the six class mechanics

This is the material relics act on. Every player picks exactly one archetype at
the root of the skill tree and keeps it for the run.

| Archetype | The mechanic | Concrete current behavior |
|---|---|---|
| **Cadence** | a hit counter | Every Nth hit (default N=5) is **empowered**: ×2 damage. Counter resets. |
| **Cooldown** | a timer | An **execution window** arms every ~7 s; the next attack lands at ×2. Timer restarts on use. |
| **Energy** | a resource | +14 energy per normal hit, cap 100. At max, the next attack is empowered ×2 and drains the pool. |
| **Reload** | a magazine | 10 ammo; each attack spends one; emptying triggers a reload cycle you can't attack through. Carries a "half damage / double speed" final stat layer as a distinct sub-identity. |
| **DoT** | conversion | A % of attack damage is converted into stacking damage-over-time instead of landing directly. T3 paths are fire / frost / poison, each with its own multiplier behavior (smolder, frozen, frostbite). |
| **Summoner** | commanded minions | Minion slots with per-slot respawn timers; minions inherit a share of player stats and act as damage sponges. *(Under separate rework — see brief D4.)* |

Four of the six (Cadence, Cooldown, Energy, and partly Reload) converge on the
same shared concept: an **empowered attack** — a periodically-armed big hit,
reached by three different routes (count / time / resource). DoT and Summoner do
not use it at all. **That asymmetry is the central design problem of this brief.**

### 3.1 Where a relic could hook

The combat pipeline runs these stages per exchange, each with registered
listeners: `beforeAttack → onAttack → onHit → onDamageTaken → afterHit → onKill`.
A mutable `CombatContext` passes through and handlers may adjust damage,
cancellation, metadata, an armor-piercing multiplier, and proc context.

Per-archetype runtime state (the cadence counter, the execution timer, the energy
pool, the ammo count, DoT stacks, minion slots) lives on dedicated **archetype
slices** on the entity — readable and writable by any system.

Passive stat/effect keys are namespaced (`core.*`, `guard.*`, `defense.*`,
`mobility.*`, `shared.*`) and flow from equipment into a passive map that the
stat recalculation and combat systems read. A relic can introduce its own
namespace the same way.

---

## 4. Grounding — what every *other* build system already owns

Relics must not duplicate any of these. This list is the negative space that
defines them.

| System | What it owns | Shape |
|---|---|---|
| **Gear** (weapon/armor/charm/boots) | raw stats and per-slot mechanic effects | 4 slots, +1…+5 upgrades, evolving lineages |
| **Cores** | **percentage multipliers on overall stats** — attack, max HP, plating, speed, attack speed, HP regen, plus a separate multiplicative damage-reduction layer. Tradeoffs allowed (e.g. +25% attack / −15% HP). Gated on matching your chosen range (close/mid/far), so they reinforce a **role**. | 5th equipment slot; off the +N track; ranks up via the evolution chain |
| **Charms** (the `recovery` slot) | recovery: regen, absorb, shield, cleanse, kill-burst — plus amplifiers for Guard abilities | equipment slot |
| **Abilities** | active plays. **Technique** = consumed by the next qualifying hit. **Guard** = a duration buff. | 2 + 2 slots by T4, ordered fire priority, per-ability cooldowns |
| **Stances** | a default + a reactive posture, switchable mid-fight by rune | 2 slots |
| **Rites** | always-on out-of-combat passives (regen delay, cleanse, momentum) | 2 slots, T3+ |
| **Runes** | **behavior** — a condition→action rule language with a point budget. This is the game's signature system: it decides *when* things fire. | rule list, budget-limited |
| **Mobility boots** | stealth, pull, kite, ramp movement behaviors | equipment slot |

**Note the runes overlap risk.** Runes already own *when* an ability fires and
*what* the character targets. A relic that says "fire your empowered attack
earlier when X" is a rune, not a relic. Relics should change **what the mechanic
is**, not **when it triggers**.

---

## 5. Grounding — the two proven state patterns

Both are already used in this codebase; pick one in Q1.

**Pattern A — a sixth equipment slot.** Equip/unequip, persistence, networking,
and most UI are all generic over the slot list. Cores proved this: adding the 5th
slot required *zero* server logic changes and no database migration. You get slot
plumbing for free, and relics become items (craftable, upgradeable, evolvable).
Cost: the slot count is fixed at one relic.

**Pattern B — progression state with a growing slot count.** Abilities, stances,
and rites all store a "known pool" plus "equipped slots" on the player's
progression data, with a function mapping player tier → slot count. You get
tier-scaling slot counts for free (1 relic at T4, 2 at T6, …). Cost: relics are
not items, so they don't ride the gear upgrade/evolution machinery without extra
work.

**Rank-up machinery exists either way:** an evolution system lets a recipe declare
a predecessor. Gear requires the predecessor at +3; cores set that requirement to
0 (just own it). A relic line can use either.

---

## 6. Grounding — acquisition precedent

The design intent recorded earlier: **each T4 dungeon boss unlocks a different
relic recipe line, matched to that biome's character** (mountain boss → force-
leaning relics, jungle → frequency, wasteland → contagion…). The boss unlocks the
recipe; essence pays the craft. The stated goal is that every boss gains a
distinct answer to *"why kill **this** one?"*

The mechanism already exists: first-clear boss flags gate recipes today. Boss
first-clears are also about to start minting **seals** (the tier-advancement
currency), so a boss reward bundle can carry seal + relic recipe together.

There are 11 biomes with dungeon bosses across T1–T4.

---

## 7. Constraints you must not violate

1. **No defense or recovery that scales with offensive output.** No lifesteal-
   shaped mechanics of any kind — no heal-on-damage-dealt, no shield-on-hit-dealt.
   This is a hard axiom, stated explicitly, not a preference to be weighed.
2. **Determinism.** No random procs whose outcome the player can't reason about
   in advance. Preparation decides outcomes.
3. **Budget separation.** Offense, defense, and utility are separate budgets.
4. **Component presence gates behavior.** A relic that isn't equipped means the
   component is absent — never a false flag, a zero duration, or an empty array.
5. **Solo-completable.** Nothing party-mandatory.
6. **Relics are the exception to archetype-agnostic itemization — handle it
   deliberately.** Every other itemization system in the game is deliberately
   archetype-agnostic (only cores gate on anything, and that's *range*, not
   class). Relics reinforcing a class mechanic is an intentional break from that
   rule.
   There is a **stated design decision** to handle per-archetype differences with
   a *generic per-archetype effect resolver* — one id whose behavior is reshaped
   by a hook keyed on the archetype — rather than separate per-archetype ids or
   hard class gates. ⚠️ **That resolver has no shipped implementation.** The only
   things that actually exist are slice-gated listener options and a rune
   `requiredArchetype` gate. So if Q2 chooses shared relic ids, the resolver is
   **new engineering work the catalogue must budget for** — say so explicitly
   rather than assuming it's already there.
7. **Leave headroom.** Relics should deepen at T5–T8 (bigger trade-offs, more
   lines) without needing a new system.

---

## 8. Verified engineering facts (from the seam audit)

These were checked against the source on 2026-08-02. They change what a good
answer looks like, so read them before writing the catalogue.

**The passive map is the hook, and it already works.** Item `mechanicEffects`
merge additively into the player's passive map during stat recalculation, and
every archetype's key numbers are already read from that map at runtime with
constants only as fallbacks. Items carrying class-mechanic keys is *shipped
precedent* (mountain weapons carry `weapon.empowered-mult-bonus`), and negative
deltas are established authoring practice (`reload.max-ammo: -2`). **Author relics
as deltas against the frame baselines**, using the audit's key inventory. Most of
the catalogue should need no new plumbing at all.

**External writes are safe.** All six archetype slices are networked, and the
delta encoder value-diffs every slice on each broadcast regardless of dirty
marking, so a relic writing archetype state is network-safe. No archetype slice is
persisted, and passives are stripped on save and rebuilt on recalc — so relic keys
can never go stale in the database.

**Two hardcoded walls. Route around them or price them in.**
- *Cadence threshold from items is currently dead.* The threshold is computed
  during recalc **before** the equipment fold that would populate
  `cadence.threshold-mod`, so an item-sourced value is read one step too early.
  It's a small reorder, but it must ship with the first cadence relic — call that
  out if your design needs it.
- *Reload's ×0.65 / ×0.5 identity layer is hardcoded literals.* Any relic trading
  against it needs new passive keys created first.

**A DoT formula fact that changes which DoT relics are interesting.** Tick
interval and max stack count are **DPS-neutral by construction** — raising either
does not raise throughput. So a DoT throughput relic must target the **conversion
percentage** or the mechanic multiplier. Note also that conversion self-trades
against the direct hit, which is a built-in cost side you can lean on.

**The rune-overlap rule, stated mechanically.** A relic may write the runtime
fields on an archetype slice. Anything shaped as *condition → action* belongs to
runes. A relic that changes the execution cooldown *on a trigger* is a rune
wearing a relic costume — that's the test to apply.

**For Summoner relics, name passive keys only, never slice fields.** The summoner
slice may be reshaped by its own rework (brief D4), but the passive read sites
(minion count, respawn time, stat shares, sponge) are the stable contract.

**HUD mirror obligation.** Any relic key that layers into the empowered
multiplier must also be registered with the shared `resolveEmpoweredMultiplier`
helper, or the stat panel will display a number that disagrees with combat.

---

## 9. Questions to answer

**Q1 — State model.** Pattern A (sixth equipment slot) or Pattern B (progression
state with tier-scaling slot count)? One paragraph of reasoning.

**Q2 — Coverage.** Does each archetype get its own relic family (6 families), or
are relics written against *shared* mechanics (the empowered attack, guard
windows, crit, on-hit) so any class can use any relic, with per-archetype
resolution where behavior must differ? Consider the asymmetry from §3: four
archetypes share the empowered-attack concept, DoT and Summoner don't. Whichever
you choose, say explicitly what a DoT player and a Summoner player get.

**Q3 — The catalogue.** The core deliverable. For each relic, name **the concrete
mechanic hook it reads or writes**. "Boosts your mechanic" is not implementable;
"reduces the cadence counter from 5 to 4 and cuts the empowered multiplier from
×2 to ×1.6" is. Every relic needs a real cost side — relics are meant to be
*fewer but enormous*, high-trade-off choices, not small bonuses.

**Q4 — Acquisition.** Confirm or replace the boss-unlocked-line model. Which
boss unlocks which line? What pays for the craft — essence, catalysts, seals, or
a mix?

**Q5 — Progression within a relic.** Do relics ride the +1…+5 upgrade track, the
evolution/lineage chain, both, or neither? (Cores chose evolution-only.)

**Q6 — Slot count over tiers.** How many relics equipped at T4? Does that grow at
T5/T6, and if so on what schedule? If Pattern A was chosen in Q1, the answer is
probably "one, forever" — say so explicitly if that's the intent.

**Q7 — The T5–T8 story.** How do relics deepen without widening? What is the
endgame relic play?

---

## 10. Return format

**A. A decisions block** — one line each for Q1, Q2, Q4, Q5, Q6.

**B. The relic catalogue**, as a table with exactly these columns:

```
relic id | display name | archetype (or "shared") | mechanic hook it modifies |
the benefit | the cost side of the trade | source boss / biome | rank chain (y/n)
```

Aim for enough relics that a player at T4 has a real choice — the earlier
intent suggested around nine archetypes of relic, but choose the number your
design actually needs and say why.

**C. Worked examples** — pick **three** relics from the table and write a short
paragraph each describing exactly what happens in combat, step by step, including
the numbers. At least one must be for **DoT or Summoner**, since those are the
archetypes the empowered-attack concept doesn't reach and where the design is
most likely to break.

**D. The T5–T8 deepening note** — one paragraph answering Q7.

---

## 11. Notes on how this will be used

The catalogue (B) becomes the implementation worklist directly. The "mechanic
hook" column is the most important cell in the document — an implementer will
open that exact system file and wire it. If a hook you want doesn't exist yet,
say so plainly ("this needs a new listener at `onKill` that reads DoT stack
ownership") rather than describing the effect and leaving the mechanism implied.

Anything left open gets decided by whoever implements it, probably worse. Prefer
a decided answer with a noted alternative over a deferred one.
