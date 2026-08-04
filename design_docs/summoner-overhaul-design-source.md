# Summoner Class Overhaul — Locked Design Source

**Status:** Design-complete for implementation planning  
**Purpose:** Primary source for an AI coding agent to inspect the repository and produce an implementation plan for the Summoner overhaul.  
**Audience:** AI implementation/planning agent. Optimize for faithful translation into code, not for presentation to players.  
**Date:** 2026-08-04

---

## 0. Agent instructions

Treat this document as the authoritative design source for the Summoner overhaul.

Before proposing implementation work:

1. Inspect the current Summoner implementation, class-tree data, combat formulas, summon lifecycle, stat inheritance, range behavior, ability adapters, runes, UI descriptions, and tests.
2. Map every locked design decision below to the actual code paths that implement it.
3. Identify conflicts between this design and the current implementation.
4. Produce a staged implementation plan with migrations, tests, balancing hooks, and temporary placeholder values.
5. Do not silently reinterpret the design to preserve existing behavior. Flag conflicts explicitly.
6. Do not finalize numerical balance from this document. Values marked **placeholder** are intended only to make the first implementation testable.
7. Preserve the project invariants in §2 even where the current Summoner violates them.

The output of the planning pass should include:

- affected files and systems;
- data-model changes;
- combat-loop changes;
- networking/server-authoritative implications;
- client/UI description changes;
- migration or reset concerns for existing characters;
- deterministic unit/integration tests;
- performance risks from summon entity count;
- balance parameters that must remain data-driven;
- recommended implementation order.

---

## 1. Scope

This overhaul covers:

- the Summoner's core combat contract;
- weapon-stat translation;
- summon offense budgeting;
- summon death and reconstruction;
- reconstruction HP costs;
- Tier 1 class behavior;
- Tier 2 frame choices;
- Tier 3 range choices;
- Tier 4 specializations;
- compatibility with abilities, runes, targeting, movement, and automatic combat;
- initial summon-count placeholders;
- design hooks needed for later balance iteration.

This document does **not** lock:

- exact base stats;
- final damage coefficients;
- final summon HP values;
- final reconstruction interval;
- final reconstruction HP-cost percentage;
- final damage-redirection percentages;
- final summon-count limits after performance profiling;
- final names, visuals, or sprite prompts;
- exact ability-adapter values;
- exact core/item interactions.

Those should be surfaced as tunable data rather than buried in combat logic.

---

## 2. Project invariants

The implementation must preserve all of the following:

### 2.1 Determinism

No random summon procs, random targeting bonuses, random reconstruction outcomes, or random specialization triggers.

Every mechanic must be predictable from:

- timers;
- attack cycles;
- summon-slot identity;
- target state;
- formation state;
- explicit rune conditions;
- fixed thresholds.

### 2.2 Automatic combat

The player does not micromanage summons in real time.

Allowed inputs are:

- build choices;
- range/frame/spec choices;
- standing policies;
- rune rules;
- occasional high-level command intent already supported by the game.

Do not design the class around per-second manual pet control.

### 2.3 Separated offense and defense budgets

Summon damage spends offense budget.

Summon durability, damage interception, redirection, and protection spend defense budget.

Do not grant a summon full offensive value and full defensive value from the same allocation.

Do not make defensive stats directly scale damage.

Do not make offensive stats directly scale recovery or effective HP.

### 2.4 No offense-through-recovery loop

Recovery may improve the Summoner's ability to survive reconstruction costs and recover from formation collapse.

Recovery must not directly increase damage while the full formation is already alive.

Avoid a loop where:

`more recovery -> faster reconstruction -> permanently higher DPS`

Reconstruction speed must therefore be bounded and separately controlled.

### 2.5 No defense/recovery scaling from offensive output

No lifesteal-shaped mechanics.

No healing based on summon damage dealt.

No summon durability based on attack damage.

No reconstruction healing from kills unless it is separately budgeted and explicitly designed later.

### 2.6 No regression

Tier upgrades must feel like positive progression.

A frame may reduce summon count only if the remaining summons visibly and numerically represent concentrated additional power.

### 2.7 Server-authoritative and performance-bounded

Summons are real simulated entities in a 10 Hz world.

Persistent summon count is a performance cost.

Do not assume that a path can create 12–20 fully simulated minions per player.

The implementation should make summon-count limits easy to tune after profiling.

---

## 3. Progression structure

Use the following conceptual tier structure for this design:

| Tier | Decision |
|---|---|
| Tier 1 | Choose the Summoner class |
| Tier 2 | Choose frame: Light, Balanced, or Heavy |
| Tier 3 | Choose range: Close, Mid, or Far |
| Tier 4 | Choose one of three specializations attached to the selected frame |

Repository terminology may use a different root/T0 numbering convention. Preserve existing data compatibility where practical, but map the behavior to the structure above.

Tier 4 specialization availability is frame-locked:

- Light frame -> one of three Light specializations;
- Balanced frame -> one of three Balanced specializations;
- Heavy frame -> one of three Heavy specializations.

The Tier 3 range choice remains independent of Tier 4 specialization. Every specialization must function with Close, Mid, and Far.

---

## 4. Locked Summoner core contract

### 4.1 Player attack contract

The Summoner/Conduit does not perform a normal direct weapon attack by default.

The equipped weapon defines the attack profile used by the summon formation.

Tier 4 may contain an explicit transformative exception that returns a direct Conduit attack.

### 4.2 Weapon attack translation

Weapon attack affects summon attack damage.

Weapon attack speed affects how frequently summons attack.

Baseline rule:

> Minion attack cadence inherits the equipped weapon's attack-speed profile.

Fast weapons therefore create:

- more frequent;
- individually smaller;
- plating-vulnerable;
- on-hit-friendly summon attacks.

Slow weapons create:

- less frequent;
- individually larger;
- plating-resistant;
- empowered-friendly summon attacks.

Do not let Summoner ignore attack speed and simply prefer the highest weapon attack value.

### 4.3 Formation offense budget

Summon count must not freely multiply total DPS.

The total formation distributes a player-sized offense budget across all active summon slots.

Conceptual baseline:

`formation DPS ~= weapon attack * weapon APS * summon modifiers`

For `N` equivalent active summons, each receives only a share of the formation's damage budget.

A summon dying should reduce current formation DPS approximately in proportion to the lost slot's allocated offense.

### 4.4 On-hit and proc budgeting

Multiple summon entities create multiple physical hit events. That must not multiply item procs, class-mechanic gains, debuffs, or ability effects at full value.

Implement one of the following consistent approaches, selected after repository inspection:

1. divide proc/on-hit magnitude across summon slots;
2. treat a full summon attack cycle as one logical formation event for selected mechanics;
3. use explicit per-summon contribution weights that sum to one formation-sized event.

The planning agent must enumerate every existing weapon/item/class effect affected by this rule.

### 4.5 Summon persistence

Summons persist across encounters unless killed or otherwise removed by existing world-state rules.

They are not summoned fresh for every normal fight.

The full formation is the Summoner's expected ready state.

---

## 5. Death and reconstruction

### 5.1 Shared reconstruction queue

Replace or normalize independent per-slot cooldown behavior into a shared reconstruction queue.

Locked behavior:

- when a summon dies, its slot enters the queue;
- only one dead slot completes reconstruction at a time;
- reconstruction completion happens at a fixed or tunable interval;
- additional dead slots wait in queue order;
- a newly dead summon does not inherit partial progress from another slot;
- reconstruction is automatic;
- reconstruction continues during combat, subject to safety rules;
- the queue and current progress must be deterministic and visible to the server.

Illustrative sequence with a four-second placeholder interval:

```text
0s: summon A dies
2s: summon B dies
4s: summon A returns and charges HP
8s: summon B returns and charges HP
```

The exact interval is not locked.

### 5.2 Reconstruction HP cost

Reconstructing a summon costs Conduit HP.

The purpose is to make summon protection non-free:

> Summons absorb danger on the Conduit's behalf, but rebuilding their bodies consumes the Conduit's vitality.

The cost should primarily derive from the reconstructed summon's **defensive durability**, not its offensive damage.

Preferred data relationship:

`player HP cost = reconstructionCostRatio * reconstructed summon max HP`

The ratio is a placeholder/tuning parameter.

Do not make reconstruction cost scale directly from:

- weapon attack;
- summon damage;
- damage dealt;
- critical/empowered values;
- offensive item modifiers.

### 5.3 Reconstruction cost characteristics

Desired emergent trade-off:

- many light summons die more often but cost less per reconstruction;
- balanced summons have moderate frequency and cost;
- heavy summons die less often but cost much more when reconstructed;
- Close-range summons cost more because they have greater defensive body value;
- Far-range summons cost less because they have lower defensive body value.

Do not author separate arbitrary reconstruction discounts if the same result can emerge from final summon HP.

### 5.4 Reconstruction safety floor

Reconstruction HP payment must not directly kill the Conduit.

Preferred behavior:

- if paying the cost would cross a configurable safety threshold, the dead summon becomes ready but reconstruction completion waits;
- reconstruction resumes once sufficient HP is available;
- the player may remain alive with an incomplete formation.

The exact threshold is not locked. Use a data-driven placeholder, such as 15–25% maximum HP.

### 5.5 Reconstruction speed

Reconstruction speed is a controlled class parameter.

Do not directly inherit it from weapon attack speed.

Limited future modifiers are allowed:

- modest reconstruction-speed bonuses;
- fixed progress refunds;
- conditional progress on deterministic events;
- abilities that temporarily advance reconstruction;
- specialization-specific rules;
- a hard minimum reconstruction interval.

Large unrestricted scaling is prohibited because reconstruction speed converts recovery into formation uptime.

---

## 6. Recovery contract

The Summoner should function without requiring a rare core or a specific late-game recovery mechanic.

The class may receive a small, budgeted baseline rule that allows part of out-of-combat regeneration to remain active during combat.

Preferred placeholder concept:

> While the Summoner has a dead summon slot or an active reconstruction queue, a limited percentage of out-of-combat regeneration remains active in combat.

This should:

- make normal reconstruction costs sustainable;
- not fully erase repeated losses;
- be paid from the class's defense/recovery budget;
- stop being an offensive benefit when the full formation is alive.

Exact percentage is not locked. Initial testing may begin around 15–25%.

True in-combat regeneration, recovery gear, and compatible cores should improve resilience to attrition, not become mandatory for basic class functionality.

---

## 7. Tier 1 — Summoner root

Tier 1 establishes:

- no normal Conduit weapon attack;
- persistent summon formation;
- weapon attack/APS inheritance;
- shared formation offense budget;
- summon death;
- shared reconstruction queue;
- HP-costed reconstruction;
- reconstruction safety floor;
- baseline recovery support;
- automatic summon behavior;
- compatibility with existing command intent.

### 7.1 Placeholder root summon count

Preferred initial placeholder:

`4 summons`

This is not final.

Reason:

- creates a readable initial formation;
- leaves room for Light to increase count;
- allows Balanced to gain or stabilize count;
- allows Heavy to visibly condense power;
- reduces server load compared with starting at six or eight.

A root count of six remains acceptable if required by current implementation, but it makes Tier 2 count reductions harder to present as progression.

---

## 8. Tier 2 — Frames

Frame determines **formation shape and concentration**.

It does not replace weapon identity.

### 8.1 Light frame

Identity:

> Many smaller summons distribute power across more bodies, lose individual bodies frequently, and reconstruct them cheaply.

Properties:

- highest summon count;
- lowest damage per summon;
- lowest HP per summon;
- lowest reconstruction cost per summon;
- highest target coverage;
- lowest output loss from one summon death;
- highest vulnerability to AoE and plating;
- more movement speed;
- lower Conduit personal defense;
- may receive only modest reconstruction-speed advantage.

Light is offense-oriented through distributed uptime and coverage, not free total-DPS multiplication.

Placeholder count target:

`6 or 7 summons`

Do not lock eight until performance profiling. Tier 4 Swarm may increase beyond this within a controlled ceiling.

### 8.2 Balanced frame

Identity:

> A stable formation of medium-strength summons that rewards completeness, coordination, and predictable uptime.

Properties:

- moderate summon count;
- moderate damage and HP per summon;
- moderate reconstruction cost;
- no extreme loss profile;
- broadest compatibility with all ranges;
- reference frame for balance comparisons.

Placeholder count target:

`5 summons`

### 8.3 Heavy frame

Identity:

> A few large summons concentrate offense and defense into highly consequential bodies.

Properties:

- lowest summon count;
- highest damage and HP per summon;
- highest reconstruction cost per summon;
- strongest resistance to small attrition;
- largest output loss when one summon dies;
- slower movement;
- greater defensive orientation;
- visually large summons.

Preferred placeholder count:

`2 summons`

Two is preferred over three because it creates a more distinct identity and leaves Tier 4 design room for:

- merging into one Colossus;
- splitting power between Conduit and one summon;
- differentiating a complementary pair.

### 8.4 Placeholder frame table

| State | Count |
|---|---:|
| Tier 1 root | 4 |
| Tier 2 Light | 6–7 |
| Tier 2 Balanced | 5 |
| Tier 2 Heavy | 2 |

All counts are placeholder tuning values.

---

## 9. Tier 3 — Range layer

Range determines:

- summon attack mode;
- preferred engagement distance;
- summon defensive body value;
- reconstruction cost through final summon HP;
- protection/redirection offered to the Conduit;
- movement/formation behavior.

Range should not substantially change the total offensive budget by itself.

### 9.1 Close range — Guardian formation

Identity:

> Durable melee summons protect the Conduit directly and pay for that protection through expensive reconstruction.

Properties:

- melee attacks;
- highest summon HP;
- highest reconstruction cost;
- strongest eligible damage redirection/interception;
- shortest preferred engagement distance;
- highest exposure to melee AoE and cleave;
- strongest body-blocking/protection fantasy;
- lower relative Conduit defense allocation than Far.

### 9.2 Mid range — Escort formation

Identity:

> Short-ranged summons maintain a stable protective formation around the Conduit.

Properties:

- short-ranged or reach-based attacks;
- moderate summon HP;
- moderate reconstruction cost;
- moderate redirection/interception;
- reliable repositioning;
- reduced melee congestion;
- general-purpose unattended-farming behavior;
- should have a distinct escort/formation policy, not merely average numbers.

### 9.3 Far range — Harrier formation

Identity:

> Fragile ranged summons kite and maintain offensive uptime but provide little direct protection.

Properties:

- true ranged attacks;
- lowest summon HP;
- lowest reconstruction cost;
- weakest redirection/interception;
- greatest preferred distance;
- best kiting behavior against slow melee threats;
- vulnerable when enemies reach the Conduit;
- vulnerable to ranged enemies, charges, and arena-wide AoE;
- higher relative Conduit defense allocation than Close.

Far summons must not retain full remote damage-sponge value.

### 9.4 Defensive-budget distribution

Frame establishes total defensive orientation.

Range reallocates that defense between the Conduit and summons.

Conceptual direction:

| Range | Conduit defense share | Summon defense share |
|---|---:|---:|
| Close | lower | higher |
| Mid | medium | medium |
| Far | higher | lower |

Do not accidentally grant Heavy + Close:

- maximum Conduit defense;
- maximum summon defense;
- maximum redirection;
- and full offense.

---

## 10. Tier 4 — Specialization overview

Tier 4 paths evolve from the selected frame.

Every specialization must:

- preserve compatibility with Close, Mid, and Far;
- remain deterministic;
- use the formation rather than bypass it;
- have a clear success and failure state;
- remain budgetable;
- avoid recursive scaling;
- remain useful solo;
- permit party value where appropriate without becoming party-required.

Locked specialization cast:

### Light
1. Volatile Brood
2. Endless Swarm
3. Harrier Brood

### Balanced
1. Coordinated Hunt
2. Withering Chorus
3. Grand Ritual

### Heavy
1. Colossus
2. Battle Bond
3. Twin Covenant

Names may be revised later, but the mechanics are locked unless implementation inspection reveals a critical incompatibility.

---

## 11. Light specializations

Light specializations explore three expressions of many cheap bodies:

1. consume bodies;
2. multiply bodies;
3. coordinate many bodies on a target.

### 11.1 Volatile Brood

Core identity:

> Summons become deterministic expendable explosives and enter reconstruction after detonating.

Locked behavior:

- natural summon death triggers a modest explosion;
- a deterministic timer or cycle marks one summon for a stronger self-detonation;
- only a controlled number of summons can be marked/detonate at once;
- deliberate detonation kills the summon and places its slot into the shared reconstruction queue;
- explosion damage scales from the summon/weapon offense allocation, not summon HP;
- reconstruction cost remains a defensive cost;
- the path deliberately spends formation uptime and Conduit HP for burst damage.

Success state:

- detonation reaches a valid target;
- reconstruction and recovery can sustain the chosen detonation cadence;
- the player manages a rolling partial formation rather than collapsing completely.

Failure state:

- detonations occur without targets;
- too many slots enter reconstruction;
- HP costs stall reconstruction;
- AoE or enemy damage destroys the remaining formation.

Range compatibility:

- Close: melee bomb pack;
- Mid: escort summons move into detonation distance;
- Far: marked ranged summon must approach/rush/launch a payload so the explosion is not wasted at firing range.

Do not let explosion damage scale from maximum HP.

### 11.2 Endless Swarm

Core identity:

> The Light formation increases summon count and divides its power into even smaller, cheaper bodies.

Locked behavior:

- increases maximum summon count;
- reduces individual summon damage;
- reduces individual summon HP and size;
- reduces individual reconstruction cost through lower HP;
- improves target coverage and partial-formation uptime;
- does not multiply total formation DPS freely;
- remains strongly vulnerable to plating and AoE.

Initial target:

- Light baseline: 6–7;
- Endless Swarm: approximately 8–9.

Do not implement a literal doubling if it creates 12–14 full entities.

Performance profiling is mandatory before raising the cap.

### 11.3 Harrier Brood

Core identity:

> Distinct summons build a coordinated offensive mark by striking the same target.

Preferred locked mechanic:

- each unique summon slot can contribute one Harried/Marked stack to a target;
- repeated attacks from the same slot refresh but do not add extra unique stacks;
- the mark increases damage taken from summons or improves formation damage against that target;
- stacks are capped by active/available summon-slot identity, not raw hit count;
- focus fire is rewarded;
- spreading summons across targets produces incomplete marks.

The path should be offense-only by default.

Do not bundle both:

- increased damage taken;
- decreased damage dealt;

unless the implementation explicitly splits offense and defense budgets. Prefer the offensive vulnerability version.

Success state:

- many living summons focus one target;
- full unique contribution is established quickly;
- the formation maintains pressure.

Failure state:

- split targeting;
- missing summons;
- frequent target changes;
- short fights that end before full mark establishment.

---

## 12. Balanced specializations

Balanced identity:

> Formation integrity and coordinated timing convert a stable group into structured combat rhythms.

The three specializations deliberately echo other archetypes through summon-specific rules:

- Coordinated Hunt echoes Cadence/alpha strike;
- Withering Chorus echoes DoT;
- Grand Ritual echoes Cooldown.

They must not become copies of those classes.

### 12.1 Coordinated Hunt

Core identity:

> A complete formation opens with empowered attacks and repeats synchronized assaults on a formation cadence.

Locked behavior:

#### Opening Assault

- each summon's first attack against a new target is empowered;
- track first attack per summon slot and target;
- prevent abusive rapid target swapping through sensible target-state/reset rules.

#### Coordinated Assault

- after a fixed number of **formation attack cycles**, living summons empower their next attack or perform a synchronized strike;
- count formation cycles, not raw minion hits;
- a cycle completes when each relevant living summon has contributed once;
- weapon attack speed accelerates cycle completion normally;
- losing summons reduces the size of the coordinated strike;
- full formation produces the strongest opening and cadence events.

Success state:

- enter with full formation;
- focus targets;
- maintain formation through repeated cycles.

Failure state:

- missing summons reduce opening burst and synchronized assault size;
- split timing or target swapping delays coordination.

Range compatibility:

- Close: synchronized lunge/slam;
- Mid: converging reach/bolts;
- Far: simultaneous volley.

### 12.2 Withering Chorus

Core identity:

> Each unique summon establishes one persistent DoT/debuff stack, and the living formation refreshes the established chorus.

Locked preferred mechanic:

- each summon slot can apply one unique stack to a target;
- the maximum stack count is tied to unique summon-slot contribution;
- repeated hits by the same summon do not add another unique stack;
- any living summon attack refreshes all currently established stacks on that target;
- a reconstructed summon can apply its missing unique stack after returning;
- switching targets requires establishing a new stack set;
- split targeting creates incomplete choruses.

The intended optimal state:

- start a fight with the full formation alive;
- every unique summon lands once;
- later formation attacks refresh the complete stack set indefinitely.

Failure/weakness states:

- beginning combat with missing summons;
- short fights before full establishment;
- target switching;
- split targeting;
- losing the formation before all unique stacks are applied.

This path should be strongest against sustained elite/boss targets and weaker against short trash fights.

Distinctness from the DoT class:

- the DoT class optimizes repeated stack generation, conversion, duration, and element;
- Withering Chorus keys stacks to unique summon identities and formation completeness;
- once established, the chorus is maintained by the group rather than restacked by raw attack frequency.

The exact effect may be damage-over-time or another persistent offensive curse, but the locked design currently favors DoT.

### 12.3 Grand Ritual

Core identity:

> At fixed deterministic intervals, every living summon receives a finite package of empowered attacks.

Locked behavior:

- a ritual triggers every fixed interval;
- at trigger time, each living summon receives a fixed number of empowered attack charges;
- missing summons receive nothing for that ritual even if reconstructed afterward;
- charges persist until consumed or until a clearly defined expiration/reset;
- use fixed empowered attacks per summon rather than a broad timed damage multiplier;
- weapon attack speed controls how quickly charges are spent, not how many are granted;
- ritual readiness rewards having the full formation alive at the trigger moment.

Illustrative placeholder only:

```text
Every 10 seconds:
each living summon empowers its next 2 attacks at a tunable multiplier.
```

Success state:

- full formation alive when the ritual triggers;
- empowered attacks land on valuable targets;
- reconstruction timing restores slots before the next ritual.

Failure state:

- missing summons at trigger;
- charges spent on poor targets;
- formation collapse during or before the window.

Distinctness from Cooldown:

- Cooldown empowers one next player attack;
- Grand Ritual distributes a fixed attack package across all currently living summons;
- formation completeness determines total ritual value.

---

## 13. Heavy specializations

Heavy specializations explore three ways to concentrate power:

1. merge it into one creature;
2. divide it between the Conduit and one creature;
3. split offense and defense across a complementary pair.

### 13.1 Colossus

Core identity:

> All summon-slot power condenses into one enormous summon.

Locked behavior:

- replaces the Heavy pair with one giant summon;
- combines and transforms the allocated formation budget;
- one large HP pool;
- one concentrated attack profile;
- catastrophic formation loss when it dies;
- very expensive reconstruction;
- reconstruction timing may be longer or use a specialization-specific rule;
- stronger resistance to incidental attrition and small AoE;
- must remain vulnerable to appropriate anti-heavy threats.

Do not implement it as only “two summons' stats added together.” It needs distinct behavior and visual scale.

Range compatibility:

- Close: giant guardian/beast;
- Mid: reach, breath, shockwave, or short-range siege attacks;
- Far: artillery or siege familiar.

### 13.2 Battle Bond

Core identity:

> The Conduit regains a direct attack and fights as a deterministic pair with one bonded summon.

This is an explicit Tier 4 transformative exception to the baseline “Conduit does not attack” rule.

Locked constraints:

- total offense budget is divided between Conduit and bonded summon;
- do not duplicate the full offense budget;
- neither unit's actual damage directly scales the other's actual damage;
- no recursive multiplier loop;
- weapon profile must remain meaningful for both;
- on-hit/proc budget must remain normalized.

Preferred synergy model:

- Conduit attacks generate a fixed Bond contribution for the summon;
- summon attacks generate a fixed Bond contribution for the Conduit;
- at a deterministic threshold, both gain a fixed buff package or execute a linked strike;
- contribution is based on event count or fixed values, not damage dealt.

Illustrative offense split only:

- Conduit: roughly 40–50%;
- bonded summon: roughly 50–60%.

Exact values are not locked.

Range compatibility:

- Close: both fight in melee;
- Mid: escort pair;
- Far: both use ranged behavior or maintain a ranged pair formation.

The implementation plan must explicitly address:

- player attack restoration;
- animation/client changes;
- weapon/on-hit splitting;
- targeting;
- attack timers;
- ability adapters;
- reconstruction behavior when the bonded summon dies.

### 13.3 Twin Covenant

Core identity:

> The Heavy pair becomes two permanently differentiated summons with complementary offense and defense roles.

Locked role structure:

#### Offensive twin

- carries most of the summon offense budget;
- lower HP;
- weaker redirection/interception;
- stronger direct attack contribution.

#### Defensive twin

- carries most of the summon defense budget;
- higher HP;
- stronger redirection/interception;
- lower direct damage.

The two roles make budget separation visible in the formation.

When one dies, the survivor may receive a limited deterministic fallback behavior, but must not inherit the dead twin's full stats.

Allowed fallback examples:

- changes formation policy;
- gains a bounded temporary role modifier;
- receives a fixed attack or guard action;
- accelerates—but does not instantly complete—the partner's reconstruction.

Do not make the survivor fully become both offense and defense.

Range compatibility:

- Close: attacker beast + guardian beast;
- Mid: striker + escort;
- Far: artillery summon + warding familiar.

The planning agent should verify how range conversion affects each twin independently while preserving their role split.

---

## 14. Ability compatibility

Abilities should use adapters that translate one player ability into one **budgeted formation event**.

Do not copy a full-strength ability onto every summon.

Preferred adapter patterns:

- divide effect magnitude across living summons;
- trigger one synchronized formation event;
- assign one summon as the executor;
- distribute fixed charges across summon slots;
- convert effect shape while preserving total budget.

Example:

A Sweep-like technique may:

- cause all summons to perform reduced cleaves whose total equals one ability budget;
- create one synchronized AoE divided across the formation;
- apply one controlled DoT/debuff stack rather than one full stack per summon.

The implementation plan must audit every existing ability for:

- direct player-attack assumptions;
- attack source attribution;
- range assumptions;
- hit-count multiplication;
- death/reconstruction interactions;
- Battle Bond exceptions;
- Volatile Brood interactions.

---

## 15. Rune and command compatibility

Standing behavior should use the existing rune/condition-action language where possible.

Do not create a bespoke real-time pet-control UI unless unavoidable.

Example future rules:

```text
WHEN two or more summons are dead THEN enter defensive movement policy
WHEN health is above 70% THEN allow reconstruction payment
WHEN target is marked by all living summons THEN maintain focus
WHEN ritual triggers within X seconds THEN prioritize survival/reconstruction
WHEN a volatile summon is marked THEN move it toward the focused enemy
```

These are examples, not locked rune syntax.

Existing command intent such as focus-target and move-to-point should remain compatible, but automatic behavior must be sufficient for unattended play.

---

## 16. Targeting, aggro, and protection

Current Summoner behavior may use damage redirection rather than normal monster aggro against summons.

The implementation plan must inspect and document the current contract before changing it.

Locked range intent:

- Close summons provide the greatest protection/redirection;
- Mid summons provide moderate protection;
- Far summons provide little or no direct protection;
- ranged summons cannot absorb full damage remotely while remaining safe at distance.

Boss cleave/AoE must continue to prevent summon body-blocking exploits.

Targeting must remain deterministic.

Specialization targeting requirements:

- Harrier Brood strongly prefers focus fire;
- Withering Chorus prefers one sustained target;
- Coordinated Hunt tracks target-specific opening attacks;
- Volatile Brood must deliver marked detonations to valid targets;
- Grand Ritual should avoid wasting all empowered charges on invalid/dead targets.

---

## 17. Data-driven tuning parameters

Expose at least the following as class/path data:

### Core

- root summon count;
- formation offense multiplier;
- per-slot offense weights;
- summon HP budget;
- summon size;
- summon movement speed;
- summon attack range;
- summon preferred range;
- summon APS inheritance modifier;
- on-hit/proc contribution weight;
- reconstruction interval;
- reconstruction HP-cost ratio;
- reconstruction safety floor;
- in-combat OOC-regeneration conversion;
- redirection/interception percentage;
- queue behavior.

### Frame

- summon count;
- total offense multiplier;
- total defense multiplier;
- per-summon HP/damage weights;
- Conduit defense allocation;
- summon movement modifier;
- reconstruction interval modifier;
- entity-size modifier.

### Range

- attack mode;
- range;
- preferred distance;
- summon HP multiplier;
- Conduit defense shift;
- redirection/interception multiplier;
- movement/formation policy;
- reconstruction cost derived from final HP.

### Tier 4 paths

- trigger intervals;
- attack-cycle requirements;
- empowered multipliers;
- empowered charge counts;
- mark/stack caps;
- mark durations;
- explosion values;
- detonation intervals;
- summon-count changes;
- Battle Bond offense split;
- Bond thresholds;
- Twin Covenant role weights;
- Colossus reconstruction rules.

Avoid hard-coding these values inside entity logic.

---

## 18. Placeholder numerical direction

These are implementation starting points, not final balance.

### 18.1 Counts

| Build state | Placeholder |
|---|---:|
| Root | 4 |
| Light | 6–7 |
| Balanced | 5 |
| Heavy | 2 |
| Endless Swarm | 8–9 |
| Colossus | 1 |
| Battle Bond | 1 bonded summon + Conduit |
| Twin Covenant | 2 differentiated summons |

### 18.2 Relative frame direction

Illustrative only:

| Frame | Relative offense | Relative total defense | Loss pattern |
|---|---:|---:|---|
| Light | slightly higher | lower | frequent, cheap, low fraction per death |
| Balanced | baseline | baseline | moderate |
| Heavy | baseline or slightly lower | higher | rare, expensive, large fraction per death |

The full player budget comparison must include:

- Conduit stats;
- summon stats;
- reconstruction HP pressure;
- range allocation;
- expected formation uptime;
- effective DPS after monster plating and overkill;
- protection/redirection.

### 18.3 Reconstruction

Suggested first-test envelope only:

- reconstruction interval: approximately 4–6 seconds;
- HP cost: approximately 40–60% of reconstructed summon HP converted to Conduit HP cost;
- safety floor: approximately 15–25% Conduit max HP;
- OOC regen active in combat while rebuilding: approximately 15–25%;
- minimum possible reconstruction interval: must be bounded.

Do not treat these as approved balance numbers.

---

## 19. Required test matrix

The implementation plan must include deterministic tests for at least:

### 19.1 Core and weapons

- fast vs slow weapon APS inheritance;
- equalized formation offense across different summon counts;
- per-summon damage weights sum correctly;
- dead summon reduces formation offense correctly;
- on-hit/proc effects do not multiply freely;
- weapon effects preserve intended fast/slow identity.

### 19.2 Reconstruction

- multiple deaths enter one shared queue;
- queue order is deterministic;
- only one summon completes at a time;
- HP cost uses defensive summon HP;
- offensive modifiers do not increase cost;
- safety floor prevents self-kill;
- reconstruction pauses and resumes correctly;
- disconnect/save/reconnect preserves or safely reconstructs queue state as intended;
- combat state changes do not duplicate summons.

### 19.3 Frames

- Light/Balance/Heavy count and stat allocation;
- Heavy remains progression-positive despite lower entity count;
- entity counts remain within caps;
- per-frame output remains within budget tolerance.

### 19.4 Range

- Close/Mid/Far attack mode;
- preferred distance;
- HP and reconstruction-cost changes;
- redirection strength;
- Far cannot remotely tank at full value;
- kiting behavior remains bounded;
- boss AoE hits summons correctly.

### 19.5 Specializations

#### Volatile Brood
- deterministic mark/detonation;
- natural-death explosion;
- no HP-to-damage scaling;
- proper queue insertion;
- no multi-detonation race.

#### Endless Swarm
- count cap;
- total DPS normalization;
- proc normalization;
- performance/entity cleanup.

#### Harrier Brood
- one stack per unique slot;
- same slot cannot add duplicates;
- focus-target behavior;
- stack reset/refresh rules.

#### Coordinated Hunt
- opening attack per summon/target;
- formation-cycle counting;
- missing summon contribution;
- target switching rules.

#### Withering Chorus
- unique stack ownership;
- any living summon refreshes established stacks;
- target switching;
- reconstruction restores missing contribution;
- full loss/retreat behavior.

#### Grand Ritual
- fixed interval;
- charges granted only to currently living summons;
- fixed charge count independent of APS;
- charge consumption;
- reconstruction after trigger does not retroactively grant charges.

#### Colossus
- one entity;
- combined budget;
- reconstruction;
- range conversions;
- no duplicate old Heavy summons.

#### Battle Bond
- direct Conduit attack restored only for spec;
- offense split;
- no recursive scaling;
- proc split;
- bonded summon death behavior.

#### Twin Covenant
- distinct offense/defense roles;
- role-specific redirection and damage;
- survivor fallback bounded;
- correct reconstruction of each role.

### 19.6 Ability/rune/network

- formation adapter does not multiply ability budget;
- command intent remains deterministic;
- rune-triggered behavior cannot spam requests;
- server remains authoritative;
- client cannot forge summon state;
- event ordering is stable at 10 Hz.

---

## 20. Performance requirements

The planning agent must profile or estimate:

- worst-case persistent minions per player;
- worst-case concurrent Summoner population;
- targeting and movement work per tick;
- AoE collision cost;
- network replication volume;
- save-state size;
- death/reconstruction event volume;
- Endless Swarm cost;
- visual/client rendering cost.

Design target:

- normal persistent range: 1–7 summons;
- exceptional specialization: approximately 8–9;
- temporary visual creatures/projectiles should not automatically be full simulated minions.

If the existing architecture cannot support the target count, preserve the design through logical/visual proxies rather than silently cutting the specialization.

---

## 21. Migration and compatibility questions for the planning agent

Inspect and answer:

1. How are current Summoner characters and paths stored?
2. Are existing biome-keyed T3 path IDs referenced in saves, quests, UI, or art?
3. Does replacing paths require a free class reset or automatic mapping?
4. How are summon slots serialized?
5. Are reconstruction timers persisted?
6. Does Battle Bond require new player attack-state fields?
7. Do current ability adapters assume a direct player attack?
8. Do item effects identify the attacker entity or owning player?
9. How are kills credited when a summon or explosion lands the final hit?
10. How are debuffs keyed—by source entity, summon slot, owner, or effect instance?
11. Can unique-summon stacks survive summon entity replacement while remaining tied to a logical slot?
12. How does the client receive summon count, slot identity, reconstruction progress, marks, ritual charges, and Bond state?
13. Which art/UI dependencies can remain placeholder until mechanics are tested?

Do not implement irreversible save migrations before answering these.

---

## 22. Recommended planning order

The planning agent should propose an implementation sequence close to:

### Phase 1 — Repository audit

- current Summoner data and entities;
- attack loop;
- stat inheritance;
- death/respawn;
- aggro/redirection;
- ability adapters;
- tree IDs;
- persistence;
- UI;
- tests.

### Phase 2 — Core contract

- formation offense allocation;
- attack/APS inheritance;
- no direct Conduit attack;
- logical summon-slot identities;
- proc/on-hit normalization.

### Phase 3 — Reconstruction

- shared queue;
- HP cost;
- safety floor;
- recovery support;
- persistence/network state.

### Phase 4 — Frames

- Light;
- Balanced;
- Heavy;
- placeholder counts and data-driven budgets.

### Phase 5 — Range

- Close;
- Mid;
- Far;
- movement, attack mode, redirection, and defensive allocation.

### Phase 6 — Tier 4 paths

Implement one vertical-slice specialization per frame first:

- Light: Volatile Brood or Harrier Brood;
- Balanced: Withering Chorus or Coordinated Hunt;
- Heavy: Colossus or Twin Covenant.

Use those to validate the extension architecture before implementing all nine.

### Phase 7 — Remaining paths

- all remaining specs;
- Battle Bond last or near-last because it reintroduces direct player attacks and touches the most systems.

### Phase 8 — Ability/rune integration

- adapters;
- standing policies;
- UI/state visibility;
- automated behavior.

### Phase 9 — Balance and performance harness

- DPS/TTK simulations;
- eHP and reconstruction-pressure analysis;
- weapon profile comparisons;
- entity-count profiling;
- specialization outlier reports.

### Phase 10 — Art/UI content

- names and descriptions;
- character bodies;
- minion families;
- icons;
- reconstruction/ritual/mark/Bond indicators.

---

## 23. Locked design summary

The Summoner is an autonomous formation class.

Its equipped weapon defines the attack profile of its summons:

- attack controls hit strength;
- attack speed controls summon attack frequency;
- total offense is distributed across the formation rather than multiplied by summon count.

The Conduit does not normally attack.

Summons persist, die, and enter a shared reconstruction queue. They return one at a time and cost Conduit HP based primarily on their defensive durability. Reconstruction cannot directly kill the Conduit. Baseline recovery support makes the mechanic functional without turning recovery into direct damage scaling.

Tier 2 frames define formation concentration:

- Light: many small, cheap, fragile bodies;
- Balanced: stable medium formation;
- Heavy: two large, expensive, consequential bodies.

Tier 3 range defines attack mode and defensive allocation:

- Close: durable melee guardians with strong protection;
- Mid: stable short-range escorts;
- Far: fragile ranged kiters with weak protection and cheaper reconstruction.

Tier 4 specializations are:

- Light: Volatile Brood, Endless Swarm, Harrier Brood;
- Balanced: Coordinated Hunt, Withering Chorus, Grand Ritual;
- Heavy: Colossus, Battle Bond, Twin Covenant.

The design is locked at the structural level. Numbers remain placeholders pending implementation, simulation, profiling, and playtesting.
