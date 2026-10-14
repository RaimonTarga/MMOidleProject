# Spirit deep dive — prep pack (2026-10-14)

**What this is:** the starting material for the Spirit deep dive of the class-first rework.
The Conduit (§7) and the Striker (§12) are locked: worked examples, not templates. The
Squire (§8) is mid-dive in another session. The output is §11 of the
[class-first bible](../../design_docs/class-first-bible.md), written to the class template
(bible §6). Nothing here is decided unless it says so.

**Running in parallel:** the Apprentice and Slinger dives run at the same time; with the
Spirit they are today's three ranged classes. When this prep was written neither had a prep
or log in `docs/briefs/` yet: re-check `docs/briefs/*-deep-dive-*` and the bible before
proposing a name or a signature mechanic. Calls go to
`docs/briefs/spirit-deep-dive-log-2026-10-14.md`; §11 stays a stub until the dive converges.

## What the designer has already said

From the [brief](class-first-rework-brief-2026-10-13.md):

- **Core mechanic:** energy is both the damage resource and the shield; spending it lowers
  defense. *Tentative.* The brief and bible §5 call the Spirit's energy shield "set": it is
  the Spirit's answer to defense and recovery.
- **Custom system: Thresholds**, rules by energy level and phase. *Tentative.*
- **Disciplines:** **Overflow** (uncapped, buffs, accelerating decay) · **Reservoir** (big
  bank, execute threshold, shield-linked) · **Tide** (surge/ebb cycles). *Tentative.*
- **Keep Crescendo purely offensive tempo so it doesn't blur with Reservoir.** *Decided.*
  Crescendo is now a Striker Heavy specialization (§12.6): Momentum carries across combos
  and fires on a release rule.
- **The Wizard** (future class) would own cast times and a two-state mana cycle, which
  "overlaps Spirit's Tide". Bible §13: if the Wizard ships, cast times are its identity and
  the Spirit keeps Tide. *Proposed.*
- The audit: the Spirit's loop is one of the four that change ("barrier → energy as
  shield"), and spending-lowers-defense is one of the trades that break the old rule "no
  defense scaling with offense", which "needs a replacement guardrail, not just deletion"
  ([audit](rework-audit-2026-10-13.md)).

From the other dives:

- **A resource doubling as a shield is the Spirit's identity.** The Striker's defensive
  lines may never do it (§12.10) and the Squire's Resolve never absorbs damage by itself
  (§8, DR5). *Decided.*
- The Striker's **other three defense rules** (nothing triggers on your hits; nothing scales
  with attack speed; no shield you can keep up forever, because it makes weak hitters
  irrelevant) were written for the Striker. Whether their reasons bind the Spirit is this
  dive's crux (question 3).

## Decided in the bible since (cross-class)

Read §1–§6 for the wording. In short:

- **No abilities outside the class system** (§3): Decided for the Striker and the Squire,
  Proposed for every class: **to confirm for the Spirit.**
- **Rules cost nothing;** each class has **its own budget**, grown by Global Mastery in steps
  and shown in class terms ("Resolve 6, next at Mastery 24") (§2, §3). Conduit: Command;
  Striker: technique slots, then mastery; Squire: Resolve pips.
- **Progression** (§2): T2 discipline (a considerable power step), T3 specialization (three
  per discipline), T4 onward leaves (three per discipline per tier), a capstone around
  T7–T8. Branches never nest. Each pick unlocks or upgrades pieces.
- **Offense–defense trades are allowed** (§1); the guardrail is *Proposed*: a conversion
  lives in a class kit, runs one way, and an item that converts never also carries
  above-curve defense.
- **The relic is the boss trophy** (§4); the Striker and the Squire both start with a plain
  payoff and get the first trophy from the first boss kill. **Specializations are
  content-neutral** (§12.6). **Prefer triggers that work in every fight**; no on-kill (§1).
- **Each biome's threat hands you its answer;** a returning biome teaches a lesson every
  tier (a new piece, a sidegrade or a rank-up), and gear **jobs move** when a biome retires
  (§12.8, §12.16, §8).
- **Each class's gear slots ask their own question:** Conduit armor "who tanks?", charm "who
  recovers?"; Striker armor "what keeps you swinging?", charm "when do you recover?";
  Squire weapon "how do you hit back?", armor "what does the threat give you?", charm "what
  does an answer give back?".
- **Party:** the same buff or debuff from two players doesn't stack (§7.12, §12.12).
- **Every class system has a T1 form** (§2, Proposed): 25 of 38 live players never reached
  T2 (Sep 24–27).

## Method (what worked, not a template)

- **Fantasies first;** the T1 sketch biome by biome, extended to T2–T4 at the end. When the
  alternatives are all good, they become disciplines and specializations (Striker).
- **The designer's main doubt, answered first:** the Squire dive opened with "it flakes
  against enemies that don't hit back". The Spirit has a likely equivalent (Evidence 1).
- Turned down before: unreadable flashy effects; vanilla ramps (Flow); a specialization for
  one kind of content; abilities outside the system; defense on offensive triggers; per-piece
  authoring sprawl; on-kill; unclear casts; duplicate picks (Perfect Guard); targeting
  choices dressed as picks (Grudge).
- **Question pop-ups are welcome** for direction calls (2026-10-14). IDs on every proposal.

## What exists today, and what it might become

| Piece | Today | In the rework |
|---|---|---|
| Core loop | Energy fills **per hit** (14 of 100 by default: ~7 hits); at full, the next attack **discharges** at ×2; a discharge builds no energy (`energyPrototype.ts`). Energy is purely offensive | Energy is both the damage resource and the shield |
| Defense | A **barrier** worth 30% of max HP on the root: absorbs before HP, refills 25% of max per second after 4 s without damage (`defense.barrier-pct`). Haunt raises it to 40%. Mountain and Tundra charms give barrier to any class | Replaced by the energy shield; the barrier's runtime is the obvious salvage |
| Chassis | The lightest and fastest: +15% attack, +12% attack speed, +12% move speed, +3% HP, range 130 | Per-class stats are §5's open question |
| Range | Ranged by default (`isRangedCombatant`); Haunt (the close range node) and Stormdancer's **Flash** (teleports into melee) make it melee | Range nodes are scrapped; where the Spirit fights is this dive's call |
| Frames (T2 today) | **Spark** (light: 20 per hit, ×1.5, the discharge arcs to 2 enemies at 35%) · **Wraith** (balanced: ×2, a discharge opens 2 s of +60% gain) · **Phantasm** (heavy: ×6, banks up to 4 hits past the cap at +15% each, the discharge staggers 750 ms) | Discipline material |
| Range (T3 today) | Haunt (close: barrier 40%, +20% HP) · Shade (mid: the discharge staggers an enemy held at bay) · Wisp (far: no chain, all on one target) | Scrapped as nodes |
| T3 paths (T4 today) | Light: **Stormdancer** (Flash; Blue Shift at low energy hits harder, Red Shift at high energy is faster and evasive), **Surge** (the discharge starts Overdrive, a big attack bonus while energy decays to empty), **Channeler** (no discharge; above a threshold, unlimited Flow stacks while decay ramps until it resets). Balanced: **Equinox** (each discharge flips a Charge and a Discharge state), **Stormbringer** (the discharge is 4 empowered strikes), **Aetherist** (damage follows the level: ×0.5 empty, ×2 full). Heavy: **Voidwalker** (max energy doubled, +100 per tier; gain speeds up as it fills; discharges early when that would kill), **Invoker** (back-to-back discharges stack), **Tempest** (the discharge brands a storm DoT) | **The brief's disciplines already exist in embryo:** Overflow ← Channeler, Surge; Reservoir ← Voidwalker, Phantasm; Tide ← Equinox, Aetherist's wave. Rules by level ← Stormdancer's shifts, Aetherist. Tempest's DoT brand is the Apprentice's ground now (§3). Mine the ideas, don't port them |
| Relic | Universal ratings; energy reads them as more energy per hit and more capacity | A boss trophy per boss (§4) |
| HUD | The energy bar (`energyCount`/`energyMax` on the player view); buff tiles Surge (Wraith's window) and Over (Phantasm's bank); the barrier's own conduit under the HP bar | One gauge that is both, if energy is the shield |
| Art | Lightning: `fxLightning`, `arcDischarge`, `lightningDagger`, `equinoxArc`; bespoke `fx/bespoke/spirit.ts` (Channeler's stream, Voidwalker's discharge); robed Spirit bodies through T3 | Reused; lightning is today's look |

**Runtime seams worth knowing:**

- **The barrier is a ready shield pool:** `HasBarrier { current, max, recharging }`, sized in
  one place (`syncBarrier`), refilled per tick, with a `barrierUndamagedMs` accumulator for
  the delay; it drains after wards and before HP (`server/src/systems/defense/barrier/`,
  [barrier-ward-current-state.md](../barrier-ward-current-state.md)). An energy shield could
  be this pool with a second drain, spending.
- **Energy accrues in one place** (`energyPrototype.ts`, afterHit), so changing what fills it
  is one seam. The state lives on the networked `usesEnergy` slice.
- **One multiplier per hit:** every discharge variant folds into
  `ctx.metadata.empoweredMultiplier`.
- **DoT ticks restart the barrier's delay unconditionally,** and `bypassBarrier` DoTs skip the
  pool entirely: a poisoned Spirit never recharges.
- **Monster `enemyShield`** is a separate periodic monster mechanic; keep the two apart.

Sources: `server/src/systems/classes/archetypes/energy/` (runtime, frame loops, the nine
paths), `shared/src/data/skillTree/rootsAndFrames.ts` (root, frames, range),
`shared/src/data/skillTree/t3CombatB.ts` (the nine paths),
[frames-current-state.md](../frames-current-state.md).

## Evidence

1. **At range the shield is barely tested.** Damage per second the Spirit takes from the T1
   bosses after the boss pass: Razorback 4.3, Greatbear 7.3, Toadeater 5.6, Behemoth 0.8,
   Broodmother **0.0**: "the Spirit finishes the fight on a full bar having taken zero
   damage". The Squire takes 6.4–9.8 on every boss
   ([t1-boss-pass-report](t1-boss-pass-report-2026-10-02.md) §9). Spending that lowers
   defense costs nothing when nothing reaches you. **Probably the dive's main risk,** as
   "flakes against enemies that don't hit back" was the Squire's.
2. **Its walls are fast packs and attrition.** Before the pass the Spirit lost every
   Greatbear and Toadeater fight; after it, it still loses 13% to the Toadeater (lowest HP
   5.6%, only 21% of the damage healed back, 10% of the fight under a quarter HP). Forest T1 at
   baseline Recovery: the ranged roots ended fights at median 0.00–0.81 HP with 5–8 deaths
   per 5 minutes ([recovery-current-state.md](../recovery-current-state.md)). Poison keeps
   the barrier's delay from ever running out (seams).
3. **The barrier's numbers were never set.** The old periodic shield was ~3% of max HP per
   second, sustained; the barrier is a one-time buffer per engagement that never refills
   inside a real fight, and dense nodes never open its 4 s window (barrier-ward §7).
   Nobody knows what the shield is worth per fight.
4. **No burst at T1–T2:** the biggest single hit in the recovery sweep was 19% of max HP (a
   T2 Thorn Spitter, on a Spirit). A shield that soaks big hits has little to do there;
   one that soaks chip damage has a lot (and erases weak hitters, collision 3).
5. **Fast through T1:** in the six-class guided sweep the Spirit finished the route in
   54m38s, the fastest (others 58–77 min), 2 deaths, none to a boss.
6. **No human playtest has covered a Spirit** (playtest 3 was a Striker).

## Collisions to resolve

1. **Thresholds vs the Apprentice's Payoff rules** (both if-then surfaces). Lead: Thresholds
   read **your own gauge** (how full, rising or falling); Payoff rules read **the enemy's
   stacks** (where they go, when they pop). Give the Spirit a different screen: marks on a
   vertical bar, each band holding what you do there, not a list of rules. Check the
   Apprentice log before settling.
2. **The shield vs the Striker's reasons.** If energy fills from your hits, attack speed
   grows the shield: the reason the Striker forbids defense on its triggers. The reserved
   identity doesn't make the reason go away. Leads: the shield refills from time (a flow),
   hits fill only the damage side, or accept it and cap it.
3. **"No shield you can keep up forever."** A shield that refills fast makes chip damage
   irrelevant (the Plains swarm and Forest packs). Whatever refills it must lose to
   sustained pressure.
4. **The guardrail (§1).** The Spirit trades both ways (spending lowers defense, holding
   raises it), and anything that grows the pool grows offense and defense at once: the loop
   the old rule existed to stop. Leads: the pool's size comes only from the class budget
   (Global Mastery), and gear shapes how it fills, spends or absorbs; or the budget index
   prices pool size as both.
5. **Reservoir's execute vs the execution crowd:** the Striker's Desert (Executioner's Blade,
   Verdict, Coup de Grâce), the Conduit's Executioner, the Squire's Executioner's Oath.
   Lead: Reservoir's twist is release timing (the bank lands when it is enough to kill,
   today's Voidwalker), not "+damage below X%".
6. **Reservoir vs the other banks:** Crescendo (offense only, Decided); the Squire's Deep
   Winter (the bar overfills to double; an overfull slam hits as two) and Bastion (the cap
   grows). Reservoir stays apart by being shield-linked.
7. **Overflow vs "burn bright, burn out":** the Conduit's Burn Bright (summons burn hot,
   then out) and the Striker's shine. A theme crossing (§3) is fine; Overflow's signature is
   the uncapped pool whose decay accelerates.
8. **Tide vs the Slinger's reload** (fire, then a stationary refill: also two phases) and the
   Wizard's two-state mana cycle (§13). Casts and cast bars are the Striker's (§12.2) and
   the Wizard's. Lead: Tide's ebb is when the shield builds, its surge when you spend it;
   no stopping to reload, no cast bar.
9. **Barrier on shared gear, shields for others.** Today Mountain and Tundra charms give any
   class a recharging barrier. If a resource-as-shield is the Spirit's, a permanent
   recharging barrier may be too; timed wards and shells (the Conduit's Icewarden) are a
   different shape. A cross-class proposal candidate. Any shield the Spirit shares with a
   party sits next to Icewarden and the Squire's Intercept, under the same-buff rule.
10. **A melee Spirit vs the Striker's Light** (fast, evasive, on-hit): Stormdancer's Red
    Shift is close to it. A melee Spirit must not be a Light Striker with a bubble.
11. **Names:** "spark" is now the Striker's relic kind; Tidewater is a Conduit Trench charm,
    Undertow a Squire Trench trophy; Deep Reserve a Conduit Cave charm (near "Reservoir");
    Flow a rejected Striker ramp. Surge, Overdrive, Overcharge, Channeler, Wisp, Wraith,
    Phantasm and Equinox are old Spirit ids: names may return, ids may not (§2).

## The questions, in order

Leads are seeds to argue with, not rules.

1. **The main risk and the fantasy.** What worries you about the Spirit; what a new player
   would say it is. Seeds below.
2. **Where it fights:** ranged (today), a close-range caster that gets hit, melee, or the
   discipline decides. Tied to Evidence 1: at range the shield is rarely tested.
3. **What energy is:** what fills it (your hits, time, being hit, holding still), what
   drains it (spending, damage it absorbs, decay), how much of a hit it takes, how it
   shows; whether the Striker's reasons (collisions 2–3) bind it.
4. **What you spend it on:** the Spirit's pieces (bolts, novas, beams, wards…); whether
   plain attacks are free.
5. **Thresholds:** what you configure (marks on your gauge; "phase" as rising/falling, the
   Tide's cycle, or a fight's phase), the default, and how the screen differs from the
   Apprentice's (collision 1). A clickable gauge mockup once 3–6 have answers, if wanted.
6. **The budget:** what Global Mastery's steps grow (pool size, marks, pieces carried); the
   guardrail (collision 4).
7. **The T1 form,** then T1 biome by biome: each threat's piece, weapon, armor, charm, and the
   first trophy. Seeds below.
8. **Disciplines:** Overflow, Reservoir, Tide; fantasies first, then rules, best and weak
   content.
9. **Specializations (9).**
10. **Leaves (T4):** the Spirit's T4 question.
11. **Boss trophies:** what the relic modifies (a spend, the gauge, the shield).
12. **Items:** what a Spirit weapon shapes (fill, spend size, tempo); the armor and charm
    questions.
13. **Defense and recovery:** what is left for armor and charm once energy is the shield; the
    DoT starvation (Evidence 2).
14. **Stance-like modes:** Tide may be one.
15. **Party role:** shields on allies, the same-buff rule.
16. **Bot plan:** default marks per discipline; what the harness must set.
17. **T2–T4 biome by biome.**

### Seeds for question 1: fantasies (*Proposed*, agent)

- **F1 The storm in a bottle:** "I carry a storm. It shields me until I let it loose." (Today's
  lightning look.)
- **F2 The guarded one:** "A spirit wraps around me. Every blow I ask of it, it stops
  guarding me." (The name; an aura that visibly thins as you spend.)
- **F3 Breath:** "My breath is my armor and my strike." (Close range, monk-like; the robes.)
- **F4 The gambler:** "I pour my own protection into power, and I decide how far." (The trade
  itself as the fantasy.)

### Seeds for question 3: what energy is (*Proposed*, agent)

- **E1 The pool is the shield:** hits drain it before HP; spending drains it too; it refills
  over time (and from your hits?).
- **E2 The level grants defense:** a full gauge gives more damage reduction or evasion, an
  empty one none (Stormdancer's shift, inverted). Numeric; harder to see.
- **E3 Warded above the line:** you are shielded while energy stays above your mark; spend
  below it and the ward breaks. The mark *is* the Thresholds decision.

### Seeds for question 7: T1 (*Proposed*, agent)

| Biome | Threat | A piece it could teach | Note |
|---|---|---|---|
| Plains | swarms | **Arc:** a spend that chains to the nearest enemies | Spark's chain, as a piece |
| Forest | fast packs that reach you | **Repulse:** a spend that blasts enemies in contact away | The Spirit's measured wall |
| Swamp | attrition, poison | **Purge the Charge:** spend to burn a poison off; or the shield takes DoT ticks | Poison starves today's barrier |
| Mountain | the hardest hits | **Ground:** a telegraphed blow on you drains the shield at half cost | Rewards holding a reserve |
| Cave | elites | **Lance:** one big single-target spend | Phantasm's heavy discharge |

Check every defensive piece against question 3's answer (which of the Striker's reasons
bind the Spirit).
