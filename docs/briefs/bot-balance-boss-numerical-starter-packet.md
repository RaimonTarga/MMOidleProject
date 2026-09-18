# Boss numerical screen — starter packet

Prepared 2026-09-18. **PREPARED, NOT LAUNCHED, AND NOT YET FROZEN.** This is the first boss
packet of the balance campaign. It is deliberately small.

## Standing constraints

The user has **already playtested and iterated boss MECHANICS manually**. This pass reuses that
coverage and existing bot reports and addresses **numerical pacing and pressure only**.

- Do not restart a functional-discovery pass.
- Do not claim the user's manual logs were inspected when they were not.
- The deprecated **Void Overlord is excluded**.
- Do not copy mob TTK bands onto bosses. A boss is a different encounter shape.
- No claim of earned progression or x1 economy follows from a synthetic boss screen.

## Prerequisite — what must land before this is frozen

Execution depends on **relevant integration and runtime qualification**, not on perfect
resolution of every unrelated question.

| Prerequisite | State |
|---|---|
| One reproducible integrated mob candidate in authored source | **Done** — the consolidated adoption, guarded by `mobAdoptionIntegration.test.ts` |
| Durability37 Block I covering the boss's own biome-tier family | **Pending** — Graveyard T4 and Forest T2 are both in Block I |
| Durability37 Block J Jungle ladder | **Not a blocker** — neither proposed boss is Jungle, and an unrelated Jungle tail must not hold this up |
| A frozen revision with a clean tree | Fill at launch |

A Jungle-only problem does **not** block these boss observations. A Graveyard or Forest problem in
Block I **does** block the corresponding boss, because it would change that boss's own receipts.

## Harness — reuse `bench/bossExam.ts`, not `--mode boss`

This is load-bearing and already documented in the harness itself:

> `--mode boss` thaws the dungeon node and fights whatever is standing in it. A dungeon node
> standing idle holds only its GUARD; the boss is spawned by `activateDungeonAltar` followed by a
> wake-up delay. The bench bot never touches the altar… **Every "boss" row it has ever printed is
> a guard row.**

`bossExam.ts` strips the guard and forces the boss awake, so its numbers describe the boss
encounter. Use it. **Report guardian/access separately from boss combat** — never pooled into one
"boss" figure, which is precisely the error that produced the stale T1 `bossExam` band.

Two measurement properties of that harness the report must carry, not restate as findings:

- HP lost is sampled as per-tick HP **decreases**, not the combat pipeline's `damageTaken`.
  Monster DoT, ground-zone pools and AoE splash bypass that pipeline.
- `ttk` is **extrapolated** when the bot dies or times out (`elapsed / bossHpFrac`), which assumes
  constant player DPS and is therefore optimistic against a boss that hardens late. Every row
  carries its outcome; read the outcome before the number.

## Proposed screen — 2 bosses × 6 roots × 2 seeds = 24 attempts

Both identities were resolved from source, not from a doc. The command center had **not** selected
them; this is the preparing agent's proposal and is open to substitution.

| Slot | Boss | Tier / biome | HP / attack | Shape | Why this one |
|---|---|---|---:|---|---|
| Earlier, single-target | `apex-timberclaw` | T2 forest | 3750 / 44 | **No summons at all** — a clean single-target pressure test | Its ordinary biome pool is changed by the adoption (`ancient-wolf` 1575/22, `ironwood-golem` 945/25), and T2 Forest is in Durability37 Block I |
| Later, add pressure | `charnel-crown-sovereign` | T4 graveyard | 19499 / 115 | Summons `bone-crawler`, `plague-hound`, `carrion-vulture` | **Its adds are three species the adoption changed** — escorts down 2059→1235, 3168→1901, 2693→1616. This is exactly the "boss reuses changed ordinary mobs" case |

### Starting receipts must name the changed identities

`charnel-crown-sovereign` summons three adopted escorts. Its `ready.json` must record those
species' live HP and attack alongside the boss's own, so the fight can be read against the same
frozen baseline as Durability37 Block I family 4. If the escort values in the boss receipt and the
Block I receipt disagree, the boss run is invalid — not reinterpreted.

`apex-timberclaw` summons nothing, so its receipt needs only the boss plus whatever ordinary
Forest T2 bodies the arena actually spawns.

### Alternative if either is rejected

- For the earlier single-target slot, `stoneplate-juggernaut` (T2 mountain, 5000/128, no summons)
  also sits on a changed pool — but T2 Mountain carries the **open-exception** Striker attrition
  case, which would couple two unresolved questions in one screen. `apex-timberclaw` is the
  cleaner first pick.
- For add pressure at an earlier tier, `gorging-razortusk` (T2 plains, 4000/96, summons
  `plains-slime` and `boar`) is the only other summoning boss — but **neither of its adds is
  changed by the adoption**, so it would not exercise the receipt question at all.

## Preparation — legality, not convenience

Six legal reference roots per boss, at **actual eligible preparation** for that boss's tier,
resolved from source at freeze time:

- Tier-legal skill-path depth, gear tier, upgrade level and guards — the same rules Durability36
  and Durability37 use for their tier-legal ladders.
- Do **not** grant a later-tier unlock, a later-tier item, or an upgrade level the character could
  not own at that point. If a preparation is not reachable, say so and report the boss as
  access-blocked rather than quietly over-equipping the bot.
- Gear biome is a **parameter, not the boss's own biome** — scoring a boss only in its native set
  lets an unequal armour family decide the boss's numbers.

Two seeds. That is a **screen**, not certification, and it cannot rank classes.

## Endpoint and caps — per mechanic loop, not a copied number

Each boss gets an endpoint and per-fight cap suited to **its real mechanic loop**, resolved from
its script at freeze time rather than inherited from a mob window:

- The cap must comfortably exceed the boss's full phase cycle, or the screen measures a truncated
  fight and the extrapolated `ttk` becomes meaningless.
- A death is a terminal outcome and is reported as such, with the phase it happened in.
- No retries, no extensions, no adaptive change mid-run.

## What the report must separate

1. **Guardian/access** and **boss combat** — always separate figures.
2. **Terminal outcome** (killed / died / capped) before any extrapolated `ttk`.
3. **Per-phase** pressure where the script has phases, not one pooled damage figure.
4. **Add pressure** attributed to the adds, not folded into the boss's own output.
5. **Owner vs. summon damage** for Conduit, which records zero `attackBeats` by design.
6. **Unmeasured** stated as unmeasured. Zero casts does not mean zero non-cast mechanics: ramps,
   cadence finishers, openings and venom emit no cast events, and an absent cast counter is
   inapplicable evidence rather than a demonstrated failure.

## What this packet does not do

- No reward edits and no ECON-1 measurement.
- No boss balance change. It reports; the command center decides.
- No new instrumentation framework. If an existing audit cannot answer a question, record the
  question as unmeasured.
- No full cohort. Twenty-four attempts is the whole screen.

## Remaining prerequisite before freezing

1. Durability37 executes, and Block I families 1 (T2 Forest) and 4 (T4 Graveyard) come back
   without a shared functional blocker.
2. The frozen revision, tree and definitions hash are filled in from the actual committed state.
3. Per-boss endpoint and cap are resolved from each boss's script and written into the packet.
4. The six tier-legal preparations are resolved from source and asserted by a matrix test, the
   same way `durability37Matrix.test.ts` asserts its cells.

Until all four are done this document stays **unfrozen** and must not be executed.
