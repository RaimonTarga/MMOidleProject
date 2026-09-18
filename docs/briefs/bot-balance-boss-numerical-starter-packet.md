# Boss numerical screen — starter packet

Prepared 2026-09-18. **PREPARED, NOT LAUNCHED, AND NOT YET FROZEN.** This is the first boss
packet of the balance campaign. It is deliberately small.

> **2026-09-18 review — BLOCKED at the earlier-tier slot; do not freeze as written.**
> Measured at `bdee5dca`: **every T2 boss is 0 wins / 126 attempts**, and `apex-timberclaw` is
> among the *cheapest* of the seven — so the proposed earlier slot can only re-measure the
> documented early-tier wall, which is the stale-band error this packet warns against. The T4
> Sovereign slot is unaffected and won **12/12** with tier-legal builds. Three harness gaps
> (no seeds, no per-observation receipts, wrong build breadth) also block a freeze. Full
> evidence, dispositions and the named substitution:
> [D37 decision note](bot-balance-d37-decision-and-boss-screen-blocker-2026-09-18.md).
> Prerequisites 1 and 3 below are now **met**; 2 and 4 are not.

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
| Durability37 Block I covering the boss's own biome-tier family | **Done 2026-09-18.** Graveyard T4 clean (both roots window-ended, 181–259 kills). Forest T2's single apprentice death is dispositioned a **known nonblocking attrition matchup** — largest hit 26.1 vs a 240 pool after 28 kills — and blocks nothing. |
| Durability37 Block J Jungle ladder | **Not a blocker** — neither proposed boss is Jungle, and an unrelated Jungle tail must not hold this up. It does, however, exclude `apex-bramble-slasher` as a substitute earlier-tier boss. |
| A frozen revision with a clean tree | **Blocked.** `server/test/t4ProgressionEconomy.test.ts` fails at `bdee5dca`; the repair is uncommitted. The runner hard-asserts a clean tree, so no revision can be frozen until it lands. |

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

### Three gaps in `bossExam.ts` that block a freeze (found 2026-09-18)

That harness is right about *which fight it runs* and wrong about *how it runs it* for this packet:

1. **It takes no seed.** `runFight` consumes none. Two seeds on `apex-timberclaw` produce
   byte-identical outcomes — it has no adds, a fixed spawn, and evasion is deterministic in this
   codebase. Seeds *do* vary the Sovereign (raise-dead, add offsets). Declaring "2 seeds" for a
   no-add boss must not be counted as two observations.
2. **It emits no per-observation receipts**, only report rows — so the mandatory escort-identity
   rule below **cannot be satisfied by it as written**.
3. **It uses the wrong build breadth**: `enumerateBuildsForContentTier` is the full variant ×
   range × T3-choice cross-product (3 builds/root at T2, 9 at T3), which this packet forbids. A
   declared per-root tier-legal cell list is needed; the shapes already exist
   (`NIGHT5_BLOCKS.t4a` for T4, Durability37's `lowerCell` for lower tiers).

**Its bot is also weaker than Durability37's.** `bossExam` builds with `materializeBot` alone,
leaving `runesEquipped: []` — no `inside-telegraph → step-back`, no `avoid-hazards`, no
`wait-for-regen`, no orbit — while `prepareSurveyBot` equips and legality-validates all five.
That gap is real but **is not** the reason early-tier bosses are unwinnable: adding the full
loadout moved striker from 47% to 50% of `apex-timberclaw`'s HP removed, still dying at ~14 s.

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

1. ~~Durability37 executes, and Block I families 1 (T2 Forest) and 4 (T4 Graveyard) come back
   without a shared functional blocker.~~ **MET 2026-09-18.** Both families clean; the one Forest
   death is a nonblocking attrition matchup.
2. The frozen revision, tree and definitions hash are filled in from the actual committed state.
   **BLOCKED** until the `t4ProgressionEconomy.test.ts` repair is committed (clean-tree assertion).
3. ~~Per-boss endpoint and cap are resolved from each boss's script and written into the packet.~~
   **MET 2026-09-18** — resolved below.
4. The six tier-legal preparations are resolved from source and asserted by a matrix test, the
   same way `durability37Matrix.test.ts` asserts its cells. **NOT MET** — cannot be finalized
   until the earlier-tier boss selection is settled.

### Endpoints and caps, resolved from the scripts (prerequisite 3)

- **`apex-timberclaw`** (3750 / 44): one phase — enrage at 50% HP (`atkMult` 1.15, `cdMult` 0.7);
  repeating *Bestial Frenzy* every 6500 ms after a 5000 ms delay (1500 ms cast, stacking
  `attackSpeed` ×1.12 / `moveSpeed` ×1.1); charged *Stunning Swipe* cd 8000 ms (initial 3500 ms),
  ×1.25, 900 ms stun, AoE r90, hastened by frenzy stacks (`castMs` ×0.88/stack, floor 300 ms).
  A full cycle needs 50% HP removed plus several frenzy stacks. **Cap 300 s** (≈45 frenzy casts,
  ≈37 swipes) comfortably exceeds it.
- **`charnel-crown-sovereign`** (19499 / 115, plating 14, dr 0.08): phase at 100% spawns 3
  `bone-crawler` + 1 `plague-hound` + 1 `carrion-vulture` (`maxAlive` 5, offset 260); phase at 50%
  casts *Mass Resurrection* (1800 ms, `raise-dead` ×3, `maxAliveAdd` 2); passive `raisesDead` every
  8000 ms after a 5000 ms delay (1300 ms cast, `corpseRange` 520, `maxAlive` 4, `hpMult` 0.75,
  `damageMult` 0.8). Crossing 50% of a 19499 pool is required for the full cycle; measured full
  kills run 36–104 s, so **cap 600 s** is comfortable.

Escort identities are confirmed at the adopted values — `bone-crawler` 1235/85, `plague-hound`
1901/105, `carrion-vulture` 1616/95 — so the receipt rule above is well founded.

Until 2 and 4 are done this document stays **unfrozen** and must not be executed. The earlier-tier
slot additionally needs substitution; see the
[D37 decision note](bot-balance-d37-decision-and-boss-screen-blocker-2026-09-18.md) §5.
