> **ARCHIVED — decisions folded in 2026-08-28.** Live state is
> `docs/headless-bot-harness-plan.md` and `bot/README.md`.

# T1 Route Normalization & Clean Validation Handoff
**Date:** 2026-08-28  
**Purpose:** Prepare a coherent, source-of-truth set of Tier 1 bot routes for clean combat validation, then run them without shared-world contamination.

## 1. Current stage

T1 has just received a coordinated combat-validation update:

- Harness mutation / altar reliability fixes are already in.
- `Inside Telegraph -> Step Back` exists and is intended as the player-facing answer to planted hostile telegraphs.
- Apprentice, Slinger, and Conduit have class-specific Technique/Sweep adapters.
- Conduit Technique normalization has been audited and is already formation-budget normalized.
- Approved numerical patch is already applied:
  - Slinger root attack affinity: +20%
  - Slinger root evasion: 30%
  - Mire Ooze poison: 5 damage per stack/tick
  - Mud Toad poison: 4 damage per stack/tick
  - Cave Brute basic attack: 80
- The most recent 16-bot run is contaminated because all bots ran concurrently in one shared world and helped/interfered with one another.
- That run also exposed route/configuration drift. Do **not** balance from its clear rate.

The next goal is therefore **route correctness first, clean isolated evidence second**.

Do not make further class / monster / item / ability / Rune numerical balance changes during this normalization task.

---

## 2. Why the current route set needs normalization

The active route folder contains several generations of design assumptions at once.

Examples found during review:

- Some V2 routes still optimize around the old GM0 8-RP assumption throughout the route.
- Some V2 routes predate Step Back entirely.
- Some V2 routes use `wait-for-regen + flee` as the central survival hypothesis.
- Some ranged routes claim to use Orbit in comments/labels but runtime evidence showed `chase-enemy` equipped.
- Slinger/Apprentice V2 routes deliberately removed Sweep even though new class-specific Sweep adapters were just implemented specifically so these classes can use the shared Technique correctly.
- Some routes use Second Wind in Cave even though Broodmother's signature persistent plating shred is cleansable, while Step Back is intended to answer its telegraphed Slam.
- The Brace-tank variants are currently produced by mutating canonical step arrays using labels and relative array positions, which is fragile and can silently drift.

Treat older V2 / Granite / Heavy Hammer / Murk-only / similar files as historical experiments, **not current baseline truth**.

---

## 3. Intended active controlled route set

The controlled-batch registry should expose exactly these eight routes for the next validation wave:

### Canonical / dodge routes
1. Striker dodge baseline
2. Squire dodge baseline
3. Slinger ranged/orbit baseline
4. Spirit ranged/orbit baseline
5. Apprentice chase/dodge baseline
6. Conduit ranged/orbit baseline

### Deliberate A/B experiments
7. Striker Brace-tank
8. Squire Brace-tank

Old V2 and other exploratory variants may remain in source control for history, but must not be selected by the controlled batch runner unless explicitly requested later.

---

## 4. Current progression spine

All six canonical routes should share the same T1 progression order:

**Clearing -> Plains -> Forest -> Swamp -> Mountain -> Cave -> boss gauntlet**

At T1:
- each ordinary T1 biome caps at level 6;
- Global Mastery is the sum of biome levels excluding Clearing;
- upgrade gates are GM 6 / 12 / 18 / 24 / 30;
- after Plains + Forest + Swamp are maxed, entering Mountain starts from GM18;
- at Mountain L2 the character is GM20 and has 10 Runic Points;
- at Mountain L3 the character is GM21 and still has 10 Runic Points;
- GM30 gives 11 RP.

Do **not** optimize Mountain/Cave Rune sets against a permanent 8-RP budget.

---

## 5. Rune strategy

### 5.1 Ranged canonical routes
Applies to:
- Slinger
- Spirit
- Conduit

Before Orbit / Step Back are legitimately unlocked, use the simplest legal chase setup.

Once both are legitimately available, intended standing configuration is:

- `always -> auto-path-enemy`
- `inside-telegraph -> step-back`
- `in-combat -> orbit`
- `always -> avoid-hazards`
- `when-idle -> wait-for-regen`

Step Back must be ordered above Orbit.

At Mountain L3 this should fit the real 10-RP budget under the live costs. Verify this from source rather than trusting comments.

**Ranged canonical routes must not silently fall back to `chase-enemy` after Orbit is unlocked.**

### 5.2 Melee dodge canonical routes
Applies to:
- Striker
- Squire

Once Step Back is available:

- `always -> auto-path-enemy`
- `inside-telegraph -> step-back`
- `in-combat -> chase-enemy`
- `always -> avoid-hazards`
- `when-idle -> wait-for-regen`

Step Back must be ordered above Chase.

### 5.3 Apprentice canonical
Use Chase, not Orbit, for this validation wave.

Apprentice's +60 root range is materially shorter than Slinger/Spirit/Conduit, and Orbit on Apprentice is a separate unvalidated hypothesis. Keep the canonical route conservative:

- auto-path
- Step Back
- chase
- avoid hazards
- wait for regen

If a targeting rule such as `focus-lowest-hp` is part of the intended current Apprentice behavior, verify the RP budget and whether it is still required after the new Sweep adapter. Do not add/remove it casually; report the decision.

### 5.4 Flee
Do **not** use `flee` in the canonical clean validation routes.

Flee materially changes encounter/reset behavior and should be tested later as its own behavior experiment if desired.

### 5.5 Brace tank routes
The Brace variants are intended to test a different answer to Mountain/Cave burst.

They should:
- not craft/use Step Back as their Mountain/Cave defensive answer;
- retain normal chase;
- retain Avoid Hazards;
- retain Wait for Regen if budget permits;
- add `target-casting -> fire-guard` **only when Brace is actually equipped**.

Do not put `fire-guard` on Second Wind or Cleanse.

---

## 6. Ability / Guard encounter matrix

Tier 1 has one Technique slot and one Guard slot.

The target canonical boss matrix is:

| Boss | Technique | Guard | Intended defensive logic |
|---|---|---|---|
| Plains | Sweep | Second Wind | Razorback is add/swarm-oriented; Sweep is appropriate |
| Forest | Expose Weakness | Second Wind | sustained duel / attrition |
| Mountain | Expose Weakness | Second Wind | Step Back answers telegraphed burst |
| Swamp | Expose Weakness | Cleanse | Cleanse answers poison/debuff pressure; Avoid Hazards answers pools |
| Cave | Expose Weakness | Cleanse | Step Back answers Slam; Cleanse answers Broodmother plating shred |

Important:
- Second Wind uses its built-in HP timing. Do not attach `target-casting -> fire-guard`.
- Cleanse uses its built-in debuff trigger. Do not attach `target-casting -> fire-guard`.
- Brace uses `target-casting -> fire-guard` in the Brace-tank experiment.

### Brace-tank A/B
For Striker/Squire Brace variants:
- Plains: same as canonical
- Forest: same as canonical
- Mountain: Brace instead of Second Wind; no Step Back defensive response
- Swamp: Cleanse
- Cave: Brace instead of Cleanse for the deliberate tank-vs-counterplay comparison; no Step Back defensive response

The point of the branch is to isolate **Brace-tanking vs dodge/counterplay**, not to create an optimized hybrid.

---

## 7. Technique progression

Canonical routes should use the shared T1 Technique progression rather than stale V2 experiments:

- Learn Sweep in Plains.
- Use Sweep through ordinary progression while it is the available Technique.
- Learn Expose Weakness in Cave and use it for the single-target boss fights listed above.
- Keep Sweep for the Plains boss.

This is especially important for:
- Apprentice: new Sweep adapter applies one real class DoT stack to each valid secondary target.
- Slinger: new Sweep adapter empowers the current clip with normalized splash.
- Conduit: formation Technique delivery is normalized to one formation-wide Technique budget.

Do not remove Sweep from Slinger or Apprentice canonical routes.

Power Strike, Heavy Hammer, Granite Barrier, Murk-only, etc. remain separate future experiments, not canonical-route dimensions.

---

## 8. Gear philosophy for this task

Do not redesign gear unless a route is currently impossible or internally contradictory.

The normalization task should preserve the current intended canonical gear identity for each class as much as possible. The main task is to make progression, abilities, Guards, Runes, and automation coherent.

If current canonical routes disagree with one another or old comments about a gear choice:
1. inspect the live route and current design intent;
2. prefer the most recent canonical baseline;
3. flag unresolved choices rather than inventing a new balance hypothesis.

Do not resurrect old Granite / Heavy Hammer / Murk-only experiments into the canonical controlled set.

---

## 9. Refactor requirement

Avoid continuing the current pattern where every route hand-authors subtly different Rune arrays and boss preparation logic.

Prefer a shared declarative route-building layer.

At minimum centralize:

- current T1 biome order / common progression helpers;
- Rune profiles:
  - ranged dodge/orbit
  - melee dodge/chase
  - Apprentice chase/dodge
  - Brace tank
- per-boss ability/Guard configuration;
- boss preparation helper;
- RP legality validation.

Prefer route configuration such as:

```ts
makeT1Route({
  classRoot: "...",
  movementProfile: "ranged-orbit",
  bossDefenseProfile: "dodge-counterplay",
  ...
})
```

and:

```ts
makeT1Route({
  classRoot: "...",
  movementProfile: "melee-chase",
  bossDefenseProfile: "brace-tank",
  ...
})
```

rather than post-processing a completed step array.

### Brace branch specifically

Replace fragile logic that:
- matches exact labels;
- deletes steps by label;
- assumes `setAbilities -> configureRunes -> attemptBoss` is always at fixed relative indexes.

The Brace branch should be generated intentionally from shared route configuration, not mutated after the fact.

---

## 10. Semantic validation tests

Compilation is not enough.

Add tests that inspect generated route semantics.

For each active controlled route, verify:

### General
- all recipes / abilities / Runes are acquired before use;
- every Rune configuration is within the real server-authoritative RP budget at that point;
- biome progression order is correct;
- no stale experimental route is accidentally registered as canonical;
- Step Back is acquired at a legitimate Mountain gate;
- Avoid Hazards remains separate from Step Back.

### Ranged
For Slinger / Spirit / Conduit after Orbit unlock:
- `orbit` is equipped;
- `chase-enemy` is not equipped;
- Step Back is ordered above Orbit.

### Melee dodge
For Striker / Squire:
- chase remains equipped;
- Step Back is ordered above chase.

### Guards
- Plains = Second Wind
- Forest = Second Wind
- Mountain canonical dodge = Second Wind
- Swamp = Cleanse
- Cave canonical dodge = Cleanse
- `fire-guard` is absent with Second Wind/Cleanse
- Brace tank Mountain/Cave = Brace + `target-casting -> fire-guard`

### Techniques
- Sweep is learned by canonical routes in Plains.
- Slinger and Apprentice canonical routes do not skip Sweep.
- Plains boss uses Sweep.
- later single-target bosses use Expose Weakness unless the route is explicitly a separate Technique experiment.

### Experimental isolation
Brace-tank routes must differ from their canonical parent only in the declared defensive dimensions:
- Step Back/crafting choice
- Mountain/Cave Guard
- fire-guard Rune behavior
- any Rune budget consequence directly required by those changes

Fail the test if gear, Technique, progression order, boss order, or unrelated behavior drifts.

---

## 11. Pre-run report

Before launching any bots, produce a compact source-of-truth table for all eight active routes:

| Route | Movement after Mountain | Standing Runes | Plains Guard/Tech | Forest | Mountain | Swamp | Cave | RP used/available |
|---|---|---|---|---|---|---|---|---|

Also explicitly report:
- when Step Back is crafted;
- when Orbit is crafted;
- whether any route uses Chase after Orbit unlock;
- whether any route uses Second Wind in Swamp/Cave;
- whether any route uses fire-guard without Brace;
- any remaining ambiguity or suspicious route step.

Do not launch the validation batch until this table is internally coherent and semantic tests pass.

---

## 12. Clean validation execution

After normalization is complete, the clean validation run should **not** use simultaneous bots in the same shared world.

Preferred next validation:
- 8 runs total;
- reward multiplier 25x;
- one copy of each active route;
- execute **sequentially: one run must reach a terminal state before the next begins**.

Order does not matter much, but record it.

Routes:
1. Striker dodge
2. Striker Brace-tank
3. Squire dodge
4. Squire Brace-tank
5. Slinger
6. Spirit
7. Apprentice
8. Conduit

Do not launch a second bot while the current bot is still progressing, stalled, dead, retrying, or inside a boss attempt.

If a run stalls, allow the existing route's terminal stall policy to finish. Do not rescue it by changing the route or starting the next bot early.

### Better future option
Independent server/world instances per bot would allow safe concurrency later, but sequential shared-world runs are preferred for this immediate overnight validation because they eliminate ambiguity.

---

## 13. Runtime / stall safety

The contaminated batch produced a >2-hour unresolved run.

Before overnight execution, inspect the route executor's boss attempt / terminal behavior and ensure:
- `maxAttempts` eventually terminates;
- death/recovery/re-entry cannot accidentally restart an unbounded outer loop;
- a terminal stalled run releases the batch runner and allows the next sequential run to begin;
- there is a generous but finite per-run watchdog only as a harness safety mechanism, not a gameplay rescue.

If the current code already guarantees this, do not change it; report why.

---

## 14. Evidence to collect from clean runs

For each run, preserve:

- completion / stall;
- bosses cleared;
- deaths by biome;
- guardian-phase vs actual-boss deaths;
- boss attempts / victories;
- time per route step;
- Step Back activations / attempts / successes / failures;
- telegraph damage;
- active Rune configuration at each boss;
- Guard/Technique equipped at each boss;
- concurrency / other-player evidence (expected to be zero during combat);
- exact stall step/reason.

If adapter-specific live telemetry is already available, include:
- Apprentice Sweep secondary DoT applications;
- Slinger Sweep clip/splash contribution;
- Conduit formation Technique contribution.

Do not add invasive gameplay instrumentation solely for this run; small reporting-only telemetry is acceptable.

---

## 15. What not to do

Do not:
- make a new numerical balance patch;
- nerf Cave / Swamp / Greatbear based on the contaminated batch;
- optimize routes mid-run;
- use old V2 routes as canonical;
- combine several experimental gear/Technique/behavior changes into one baseline;
- run multiple validation bots simultaneously in the same world;
- infer a route is correct because its label/comment says "orbit" or "cleanse" — inspect the actual configured rules and emitted route steps.

---

## 16. Deliverable

The normalization session should finish with:

1. implemented standardized routes;
2. controlled registry containing only the intended eight validation routes;
3. semantic route tests;
4. pre-run route matrix with RP budgets;
5. list of historical/experimental routes excluded from the controlled batch;
6. confirmation that the sequential runner will not overlap bots;
7. any unresolved design question that genuinely requires designer input.

Do **not** run the overnight batch in the normalization session unless explicitly instructed after the route report is reviewed.

---

## 12. Controlled parallel validation (added 2026-08-28)

Sequential remains the default for controlled batches. `isolated-parallel` is an
explicit opt-in mode that runs several controlled bots at once without letting
them contaminate one another. Usage and the full rule set live in
[bot/README.md](../bot/README.md) under "Controlled concurrency"; this section
records only the decisions.

### Contamination boundary: one world node

Chosen from source, not assumed:

- `grantMonsterRewards` shares a kill with same-party members but explicitly
  skips any member whose `hasPosition.nodeId` differs from the kill's node.
- Auto-targeting reads `world.monsterEntitiesInNode(player.hasPosition.nodeId)`.
- AoE resolves against `attacker.hasPosition.nodeId`.
- Monsters are allocated and counted per node (`allocMonsterId`,
  `adjustMonsterCount`), and node freeze/thaw makes them ephemeral per node.

Two controlled bots in different nodes therefore cannot touch each other's
combat or progression evidence. A whole-biome lease is stricter than isolation
needs and would serialize the shared six-biome spine for no benefit.

A dungeon is its own node id, so dungeon/guardian/boss runtime state stays
exclusive under the same rule, and the existing server-side occupied-dungeon
rejection is preserved as a second line of defence.

### Why this is not "rerouting"

Every T1 farm step is authored as a **biome** with `pick: "uncleared"`, so which
node inside the biome gets used was always the executor's dynamic choice.
`resolveNodeCandidates` exposes that choice as an ordered list whose head is
byte-identical to the solo pick (asserted in `harness.test.ts`), and the
coordinator only falls through to a later entry when the head is leased. Steps
that must hit one specific node — a catalyst supplier, a dungeon — pass a
single-entry list and genuinely queue.

### Known evidence caveat

Nodes are **not** interchangeable: each carries a node modifier that rescales
monster HP, attack, cooldown, speed, plating and damage reduction at spawn. Each
T1 biome has 5-6 normal nodes carrying different modifiers, so which node a bot
lands on is a difficulty variable, and under `isolated-parallel` that mix
becomes schedule-dependent. Runs therefore record `coordination.nodeMix` (node,
modifier, dwell time). **Compare two runs only after checking their node mixes
are comparable.** This is the main reason a live smoke test should precede any
balance wave run in parallel mode.

### Designer decisions folded in (2026-08-28)

**The Clearing is exempt from leasing.** Several bots may run the tutorial
together; it was never a difficulty measurement, and leasing it would have
serialized the entire batch behind one node before any bot reached the content
under test. Sharing it does not raise contamination evidence.

**Waiting is productive.** When a bot cannot get its next node, it keeps farming
in the node it already exclusively owns rather than standing still. That is safe
for isolation by construction — an exclusively-held node cannot contaminate
anyone — and it answers "what if there are not enough zones". A bot only freezes
when it holds no node at all, because then there is nowhere safe to fight.

The evidence cost is recorded, not hidden: `coordination.productiveWaits` and
`productiveWaitMs`. A run that waited productively has banked essence/XP a solo
run would not have at the same route step, and can die while doing it. Check
these alongside `nodeMix` before comparing a parallel run to a sequential one.
