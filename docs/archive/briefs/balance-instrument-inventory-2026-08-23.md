> **ARCHIVED — superseded 2026-08-30** by the T1-T4 progression-economy passes; see the
> note on `BALANCE_TOOL_AUDIT_HANDOFF_2026-08-23.md` above. Kept as the instrument
> reference sheet and trap list.

# Balance Instrument Inventory — what we can measure, and with what

**Written 2026-08-23** as the reference sheet for planning a sweeping balance patch across
**monster numbers, boss numbers, item numbers, and class numbers**.

This document is descriptive, not prescriptive. It answers one question only: *what
instruments exist, what does each one actually measure, and what does it refuse to
measure?* It contains no balance decisions and no proposed changes.

Companion reading, in this order:
- `docs/polish-and-balance-roadmap.md` — the program this patch sits inside (W5 is the balance-infrastructure workstream).
- `docs/tier-balance-current-state.md` — the living truth of the T1–T4 ladder as it stands today.
- `docs/balance-lab-current-state.md` — the Admin-side view layer.
- `docs/briefs/t1-balance-context-2026-08-18.md` — the method and formulas behind the vacuum model.

---

## 1. The two families

Everything below falls into one of two families, and confusing them is the single most
expensive mistake available in a balance pass.

**Analytical instruments** reconstruct the game's formulas in a report and evaluate them
in closed form. They are instant, exhaustive, and deterministic — they can sweep *every*
class × item × monster combination in seconds. They cannot see movement, pathing, AI,
aggro, real target counts, or anything that emerges from a fight actually happening.

**Simulation instruments** boot a real `World`, spawn real bots, and tick the real server
at 10 Hz. They see everything the game sees, because they *are* the game. They are slow,
sample a handful of builds rather than all of them, and carry fidelity caveats of their
own (§5).

The working rule this repo has already learned the hard way: **analytical tools set the
shape, simulation tools confirm the pitch.** A number that looks right in `tier:table`
and wrong in the farm bench is wrong.

---

## 2. Instrument map

| Instrument | Family | Subject | The question it answers |
|---|---|---|---|
| `pnpm tier:table` | analytical | monsters (vacuum) | Is biome A harder than biome B *within a tier*? |
| `pnpm mob:report` | analytical | monsters vs player | How much pressure does this mob put on a reference player? |
| `pnpm monster:ref` | dump | monsters | What are this monster's authored numbers, verbatim? |
| `pnpm dps:report` | analytical | classes × weapons | What does each build actually output? |
| `pnpm ehp:report` | analytical | classes × armour/charms | What does each build actually survive? |
| Admin **Balance Lab** tab | analytical (view) | whole game | One coherent picture, live, without regenerating files. |
| `pnpm bench:balance --mode farm` | simulation | economy + world | What does an hour of real farming pay, and cost? |
| `pnpm bench:balance --mode boss` | simulation | dungeon guards | (see §5.1 — this does **not** fight bosses) |
| `pnpm bench:balance --mode overlord` | simulation | 4-bot party | Can a party clear the Void Overlord? |
| `bench/bossExam.ts` | simulation | bosses | Is this boss encounter clearable, and how close? |
| `pnpm bench:tui` | driver | — | Runs the above matrices in parallel with a live UI. |
| `pnpm bench:server` | simulation | performance | Does the tick budget hold? (not balance) |
| In-game reward multiplier | live play | progression | Reach late content by hand without grinding for it. |
| `pnpm test` suites | guards | invariants | Did a number change break a structural rule? |

---

## 3. The analytical instruments, in detail

### 3.1 `pnpm tier:table --tier N` → `reports/tier-N-table.md`
Source: `tools/tier-table.ts` (~1074 lines).

**The vacuum table.** Every monster in a biome tier, described with *no reference player
named at all*. Every column is a property of the authored monster and its biome, so the
only comparisons it supports are monster-vs-monster inside a tier, and biome-vs-biome.

This is the instrument that produced the current T1–T4 ladder. It computes sustained
pressure as `d · (N+1)/2` — per-monster damage times the mean live attacker count as a
focus-fired pull burns down from N bodies to 1.

Durability is the one place "no player" cannot be taken literally, because mitigation is
`max(1, round(max(0, hit − plating) · (1 − DR)))` — a flat subtract before a
multiplicative reduction, with a 1-damage floor. That makes effective HP a function of
**incoming hit size**, not of the monster alone: plating 8 halves a 16-damage hit and
barely dents a 160-damage one. So rather than invent one fake eHP, the tool reports an
eHP *curve* over probe hit sizes at 0.5× / 1× / 2× / 4× the tier's own median monster
attack. The light-vs-heavy spread is exactly the "which weapons does this thing punish"
signal a balance pass wants.

**Consequence to hold onto:** eHP here is comparable *within* a tier, never *across*
tiers — the probes differ per tier. For cross-tier scale, read raw HP.

It also applies node modifiers (`modifierStatScalars`, `modifiedDamageReduction`,
`modifierSpawnFactor`) and knows the modifier ban table.

**Cannot see:** player stats, movement, pathing, aggro chains, AI, real concurrency,
healing, party effects, boss scripts beyond their opener. Ecology columns are authored
intent (density, pool weight, pack size), not simulated outcome.

### 3.2 `pnpm mob:report` / `pnpm mob:llm` → `reports/mob-report.html`, `reports/mob-llm-packet-tN.md`
Source: `tools/mob-report.ts` (~1065 lines), reading through `tools/balance-data.ts`.

The **monster-versus-player** counterpart. Every non-boss spawn and every boss profiled
for HP, attack, cadence, raw DPS, DoT, plating/DR, range, speed, spike potential and
special mechanics — then measured against neutral **reference players** rebuilt from the
same shared `recalculatePlayerStats` path the other two reports use.

Convention: a player of tier P fights biome tier P−1, so a biome-tier-B mob is measured
against a tier-(B+1) player, clamped to the highest authored item tier.

Each tier leads with a threat-ranked cross-biome table: mean/max HP, mean/max incoming
DPS, worst spike, density, essence per kill, biome XP per kill. Threat and reward
deviations are listed separately, and the tool is explicit that these are **discovery
signals, not verdicts or gates**.

Outputs both a browsable HTML report and a `--llm-packet` Markdown digest sized for
handing to an agent.

### 3.3 `pnpm monster:ref` / `pnpm monster:ref:md` → `reports/monster-ref.html|md`
Source: `tools/monster-ref.ts` (~616 lines).

A raw stat dump — every non-tutorial monster, organised by biome then tier, with no
matchup analysis, no threat evaluation, no outlier detection. Includes boss scripts,
phases, repeating actions, and ultimate-encounter data. Filterable with `--biome=cave`
and `--tier=2`.

Use this when you need ground truth on what is authored, not an opinion about it.

### 3.4 `pnpm dps:report` (+ variants) → `reports/dps-report.html`, `reports/dps-llm-packet-tN.md`
Source: `tools/dps-report.ts` (~2436 lines — the largest instrument in the repo).

Sweeps **every class build** — class root × frame × range × sub-variant — crossed with
every weapon at full upgrade (tracks `MAX_UPGRADE`, currently 5), over a 60-second
horizon. It understands the archetype mechanics rather than approximating them: cadence
multipliers, DoT conversion and stacking, reload's half-damage/double-speed layer, energy
maxima, empowered multipliers, upkeep on-hit bonuses, and full Conduit summoner
formations.

Variants worth knowing:
- `pnpm dps:report:no-conduit` — Conduit's formation maths dominates the tables; this
  strips it so the other five classes are readable against each other.
- `pnpm dps:llm` — the Markdown packet, per tier.
- `pnpm dps:class-mechanics` → `reports/class-mechanics-packet.md` — the mechanics
  breakdown rather than the numbers.
- `pnpm dps:t4-mechanics` → `reports/t4-subclass-mechanics-packet.md`.
- `--tier N` narrows the sweep.

**This is the primary instrument for class numbers and weapon numbers.**

### 3.5 `pnpm ehp:report` (+ variants) → `reports/ehp-report.html`, `reports/ehp-llm-packet-tN.md`
Source: `tools/ehp-report.ts` (~1729 lines).

The defensive sibling. Same build sweep, crossed with **armour × recovery (charm)**
combinations. Weapon is held empty (it carries no defensive stats) and the mobility slot
is excluded (movement-only). It re-implements the server defense pipeline
(`server/src/systems/defense/*`) as steady-state averages, honouring the 0.9 DR clamp.

Incoming pressure comes from biome mobs one tier below the report tier, plus
representative "shape" attackers and boss spike profiles. Sustained recovery is folded
into a survival score over a 15-second window — short enough to weight a dangerous burst,
long enough to reward sustain charms.

**This is the primary instrument for armour, charm, and defensive-class numbers.**

It is explicitly **not** a combat simulator: no movement, pathing, real AoE target count,
enemy AI, kiting, or party effects. Every approximation is surfaced in per-row notes
rather than hidden — read the notes.

### 3.6 Admin **Balance Lab** tab
Source: `shared/src/systems/balanceLab.ts`, `admin/src/tabs/BalanceLabTab.tsx`, delivered
over the trusted-dev `/admin` Socket.IO namespace.

Read-only MVP (2026-08-12). Same analytical philosophy as `mob:report`, but live in the
ops dashboard instead of a generated file: tier switching T1–T4, fixed-tier biome
threat/reward comparison, sibling-relative threat indices and deviation counts,
entry-reference context and blocker counts, a searchable encounter roster, and authored
stat / reward / mechanic / TTL / planning-TTK inspection.

It also reads `shared/src/data/balanceProgression.ts` — designer-approved progression
constraints held **separately** from authored monster numbers, with per-step authoring
briefs (biome identity, the player skill being tested, legal base-stat and mechanic
levers, anti-goals, and a distinct purpose for each normal monster). Its current
assessment metric is `encounter-burden-v1`: estimated damage received while an analytical
reference build kills an average pool-weighted normal mob.

Documented as a **diagnostic proxy, not an acceptance metric.** It stays read-only until
a reversible experiment overlay exists with explicit validation and a safe reset path —
canonical TypeScript data remains the source of truth.

---

## 4. The simulation instruments, in detail

### 4.1 `pnpm bench:balance` — the matrix bench
Source: `server/bench/balanceRun.ts` (~691 lines) plus `server/bench/balance/*`.

Three modes:

**`--mode farm`** — the economy instrument. Drops a bot on a real open-world node with
real repopulation and measures income over simulated hours. Income is measured by
**diffing two ledger snapshots** (`server/bench/balance/ledger.ts`), not by instrumenting
the reward code — `grantMonsterRewards` already writes everything through the live path,
so a before/after diff is the whole ledger and cannot drift from in-game rewards. Reports
essences, catalysts (including sub-threshold progress toward the next one), biome XP,
biome levels, and unlocked recipes.

Key levers: `--hours N`, `--node <id>`, `--all-builds`, `--gear-sweep 0,3,5` (concurrency
depends on how fast the player kills, so a single power level biases it — the sweep
reports the band), and `--scale-sweep` (the fidelity trust-check, §5.2).

**`--mode boss`** — solo dungeon matrix. **See §5.1 before trusting any row it prints.**

**`--mode overlord`** — 4-bot party against the Void Overlord, enumerating parties of 4
*distinct* classes. The space is ~1.9M parties at T4, so it carries a stratified,
deterministic `--sample N` lever that prioritises builds whose range node fits the
archetype. Default sim cap rises to 1500 s because overlords target ~20 minutes.

Output is `--format csv` or `--format jsonl`; `--dry-run` prints just the expected match
count; `--shard-index`/`--shard-count` slice the matrix for parallel runs (running shards
`0..N-1` and concatenating reproduces the full matrix exactly).

**The concurrency sampler** (`server/bench/balance/concurrency.ts`) deserves its own note.
It measures the *single load-bearing input* of the `tier:table` encounter model. The
time-weighted mean attacker count **is** `(N+1)/2`, so the sampler measures the quantity
the model consumes rather than measuring N and inferring it. It counts two populations —
`aggroed` (the shape of the pull) and `inRange` (the subset that can actually swing, using
the authoritative hitbox-aware `inAttackRange` predicate that combat itself uses) — and it
tracks **total HP lost** by summing per-tick HP decreases. That last part exists because
`metrics.damageTaken` only hooks the `onDamageTaken` pipeline, which monster DoT, AoE
splash and node-feature damage all bypass. In Swamp, where ~75% of output is poison, the
pipeline figure missed most of the damage — Swamp measured as *safer than Plains* until
this was added.

### 4.2 `server/bench/bossExam.ts` — the boss instrument
Not yet on a `pnpm` script; run it via tsx directly. Flags: `--tier`, `--boss`,
`--gear-biomes`, `--time-scale`, `--max-seconds`, `--json`.

It exists precisely because `--mode boss` does not fight bosses (§5.1). It strips the
dungeon guard and forces the boss awake immediately, so the numbers describe the boss
encounter and nothing else: script phases, charged casts, pools, adds, shields.

Three measurement choices to know:
- HP lost is sampled as **per-tick HP decreases**, not pipeline `damageTaken` — same
  bypass reason as above. Three of the five T1 bosses deal much of their damage through
  DoT, ground-zone pools and AoE.
- `ttk` is **extrapolated** when the bot dies or times out (`elapsed / bossHpFrac`). That
  assumes constant player DPS, so it is optimistic against a boss whose late phase
  hardens (Behemoth / Broodmother shields). Rows carry their outcome — read it.
- Gear biome is a **parameter**, not the boss's own biome, because T1 biome armour
  provides wildly unequal counterplay. The default sweeps every T1 armour set against
  every boss and reports means, so one broken armour set cannot decide a boss's numbers.

Current output lives at `reports/boss-exam-t1.md` (plus preserved `-before`/`-after` pairs).

### 4.3 `pnpm bench:tui` — the driver
Source: `tools/balance-tui/` (Rust). Spawns `bench:balance --format jsonl`, shards it
across all logical cores, streams and merges the JSONL results.

Everything is configured inside the TUI — mode, tiers, biome, class, time scale, max
seconds, single-match, all-paths, sample size, thread count — with a live
expected-matches counter. The results screen gives a match table, a build rollup, a
relative-power histogram for spotting class/party outliers, and a detail pane with the
full party/build/gear breakdown plus an on-demand fight log (a *representative re-run*,
not a deterministic replay).

It computes a **balance score** per match — Too Easy · Easy · Balanced · Struggled ·
Can't Do — as a weighted composite: `0.50·survival + 0.35·punish + 0.15·attrition`, where
survival is `1 − endHP%`, punish is `(damageTaken/maxHP)/1.75`, and attrition penalises
overrunning the ideal fight window (dungeon boss 60–180 s; overlord 1080–1200 s). A death
or timeout always forces `Can't Do`.

Read `tools/balance-tui/README.md` before a long run — it documents gear resolution
(`resolveGearLoadout` equips best non-ultimate gear for the content tier, fully upgraded,
preferring the native biome), the sampling strategy, and the overlord gear caveat (abyss
has no craftable recipes, so parties fall back to the best craftable T4 gear).

### 4.4 `pnpm bench:server` — performance, not balance
Source: `server/bench/run.ts`. Tick and broadcast percentiles at 0/1/5/10/25/50/100
players across three scenarios. Listed here only so it is not mistaken for a balance tool.

---

## 5. Traps — read before trusting any output

### 5.1 `--mode boss` has never fought a boss
A dungeon node standing idle holds only its **guard**; the boss is spawned by
`activateDungeonAltar`, a player interaction the bench bot never performs, followed by a
wake-up delay. The run loop stops the moment the node is empty. **Every "boss" row
`--mode boss` has ever printed is a guard row.** Evidence is preserved at
`reports/boss-mode-guard-only-evidence.csv`. Use `bench/bossExam.ts` for bosses.

### 5.2 The time-scale fidelity ceiling is 2
`dt = 100ms × timeScale`, so a coarse tick quantises attack cadence *downward*: a 700 ms
swing resolves once per 1000 ms tick instead of ~1.4 times. Measured drift versus scale 1
over one simulated hour: scale 2 → −1%, scale 3 → −6%, scale 5 → −5..18%, scale 10 →
−29..32%. Run-to-run noise at one sim hour is ~1–2%, so scale 2 is inside the noise and
**everything above 2 is a real, one-directional understatement**. The default is now 2 and
above-ceiling runs print a visible warning (a CSV comment, or `run_meta.warning` in JSONL).

Corollary: any boss/overlord matrix collected at the old default of 5 is not
fidelity-safe and must be regenerated.

### 5.3 `damageTaken` under-reports
The combat pipeline's `onDamageTaken` misses monster DoT ticks (which write
`hasHealth.hp -= hpDamage` directly), AoE splash, and node-feature damage. Both the
concurrency sampler and `bossExam` work around this by summing per-tick HP decreases. If
you add a *new* measurement, do the same.

### 5.4 The vacuum cannot judge absolute pitch
`tier:table` sets the *shape* of the ladder — which biome is harder than which, by how
much. It cannot say whether the game is correctly pitched overall, because flat plating
means armour answers biomes unequally (a measured ~16× spread).
`docs/tier-balance-current-state.md` §1 states this explicitly, and its §8 records that the
one instrument which *could* judge pitch was broken at the time of writing.

### 5.5 Historical bench data carries two invalidations
Every bench matrix collected before 2026-08-11 either ran the accidental **Berserker
Stance** bot (+65 attack, +25% attack speed, −12% DR, and 2% max-HP/sec self-damage that
bypasses mitigation and can kill) or **omitted relics entirely**, or both. Fixing it moved
the T2 probe's recorded damage by −28.3% and the T4 probe's clear time by +42.3% with
damage taken up 70%. Old matrices are not comparable to the corrected baseline even if
they happened to run at scale 1 or 2.

### 5.6 `tools/` and `server/bench/` sit outside the main tsconfig
They are covered by `server/tsconfig.bench.json`, wired in through `pnpm typecheck` via
`typecheck:bench`. A rename in `shared/` has slipped past into these files before. Run the
full `pnpm typecheck`, not a per-package one, after touching shared formulas.

### 5.7 Threat indices are discovery signals, never gates
Both `mob:report` and the Balance Lab say this in their own source comments. They compare
one biome to its same-tier siblings. Deliberate outliers are the point of authored
content; a score that hardens into a pass/fail gate will flatten the game.

---

## 6. Coverage against the four subjects of this patch

| Subject | Analytical | Simulation | Notes |
|---|---|---|---|
| **Monster numbers** | `tier:table` (shape), `mob:report` (vs player), `monster:ref` (raw) | farm bench + concurrency sampler | Best-covered subject in the repo. |
| **Boss numbers** | `mob:report` includes bosses; `monster:ref` dumps scripts | `bossExam.ts` only | `--mode boss` is a trap (§5.1). |
| **Item numbers** | `dps:report` (weapons), `ehp:report` (armour + charms) | bench gear resolution + `--gear-sweep` | Cores, relics and mobility boots have thinner coverage than weapon/armour/charm. |
| **Class numbers** | `dps:report`, `dps:class-mechanics`, `ehp:report` | TUI relative-power histogram, overlord matrix | Conduit dominates the tables; use the `:no-conduit` variants to read the other five. |

---

## 7. Supporting apparatus

**In-game dev reward multiplier** (shipped 2026-08-23, currently uncommitted). Debug-panel
control, 1×–1000×, applied to essence / biome XP / catalysts. It is **not** a level-cap
bypass — it is a *content-reach* tool that lets you hand-play into late content without
grinding for it. It is not a balance measurement; the bench remains the instrument for
judging numbers. Guarded behind `DEV_TOOLS_ENABLED`.

**Structural guard tests.** These do not measure balance, but they stop a balance patch
from breaking a rule:
- `pnpm test:balance-instruments` — asserts the bench's own honesty: tier gates, the
  explicit stance choice, legal rites, no pre-T4 relic, an actually-equipped T4 relic, and
  class-sensitive relic selection.
- `shared/src/data/recipeGates.test.ts` — guards recipe/craftable *reachability*, with a
  debt list currently empty. It caught 11 recipes and 2 cores authored against dead or
  banned catalyst families.
- `server/test/concurrencySampler.test.ts`, `farmLoop.test.ts`, `nodeModifiers.wiring.test.ts`,
  `classAffinity.test.ts`, `stances.test.ts`, `barrier.test.ts`, `recovery.test.ts` — the
  systems a numbers pass is most likely to disturb.

Per repo convention: run only the tests a change touches while iterating; full `pnpm test`
is a pre-commit gate (~5 min versus ~6 s).

**The data seam.** `tools/balance-data.ts` is the single authored-data accessor for the mob
report — deliberately a seam where a future reversible tuning overlay would be composed, so
reports never need to know whether a value came from authored TypeScript or an experimental
override. **The overlay itself has not been built.** Today, changing a number means editing
the canonical TypeScript and regenerating.

---

## 8. Known gaps — the things nothing currently measures

Listed to seed the planning conversation, not as a work order.

1. **No reversible experiment overlay.** Every tuning iteration is a source edit plus a
   regenerate. There is no "try this number and diff it" path, in the Lab or the tools.
2. **No absolute-pitch instrument.** §5.4. The vacuum sets shape; nothing currently
   validates the overall difficulty pitch end to end.
3. **No scripted T0→cap route runner.** Listed as a next slice in the Balance Lab doc.
   Without it, "does the progression curve feel right across a whole run" is unanswerable
   except by hand-playing with the reward multiplier.
4. **Farm bench results are not persisted into the Lab.** Kills, deaths, essence, catalyst
   and biome XP per simulated hour live in CSV/JSONL, not in the game-wide view.
5. **Cores, relics, mobility boots** have materially thinner analytical coverage than
   weapons, armour and charms.
6. **Bosses have one instrument and no analytical shape-setter** — there is no `tier:table`
   equivalent for boss encounters.

---

## 9. Command quick-reference

```bash
# Analytical — monsters
pnpm tier:table --tier 2          # → reports/tier-2-table.md   (vacuum, no player)
pnpm mob:report                   # → reports/mob-report.html   (vs reference players)
pnpm mob:llm                      # → reports/mob-llm-packet-tN.md
pnpm monster:ref:md               # → reports/monster-ref.md    (raw dump)
pnpm monster:ref --biome=cave --tier=2

# Analytical — classes & items
pnpm dps:report                   # → reports/dps-report.html
pnpm dps:report:no-conduit
pnpm dps:llm                      # → reports/dps-llm-packet-tN.md
pnpm dps:class-mechanics          # → reports/class-mechanics-packet.md
pnpm ehp:report                   # → reports/ehp-report.html
pnpm ehp:llm                      # → reports/ehp-llm-packet-tN.md

# Simulation
pnpm bench:tui                                        # interactive driver, all cores
pnpm bench:balance -- --mode farm --tier 1 --hours 1
pnpm bench:balance -- --mode farm --gear-sweep 0,3,5
pnpm bench:balance -- --mode overlord --sample 10000
pnpm bench:balance -- --format jsonl --dry-run --tier 1,2      # just the match count
pnpm --filter @mmo-idle/server exec tsx --conditions=development bench/bossExam.ts --tier 1

# Guards
pnpm typecheck                    # includes typecheck:bench — do not skip
pnpm test:balance-instruments
pnpm test                         # full gate, ~5 min
```

---

## 10. Readiness audit — performed 2026-08-23

Every instrument in §2 was executed and its source read against the systems that shipped
in August. Results below. The three suspicions this document originally carried were
checked; two are dismissed and one is superseded by something larger.

### 10.1 Everything compiles and runs

`pnpm typecheck` (including `typecheck:bench`) exits 0. `pnpm test:balance-instruments`
passes. Every report regenerated cleanly: `dps:report`, `dps:llm`, `ehp:report`,
`ehp:llm`, `mob:report`, `mob:llm`, `tier:table` for all four tiers, `bench:balance
--dry-run` (1605 matches at scale 2), `bench:balance --mode farm`, and `bossExam.ts`.

**One script was broken and is now fixed.** `pnpm monster:ref` and `pnpm monster:ref:md`
both died with `MODULE_NOT_FOUND` — their `package.json` lines used `pnpm --dir server exec
tsx …` and omitted `--tsconfig ../tools/tsconfig.json`, so `@mmo-idle/shared` never
resolved. This is the *identical* defect W5a fixed in `mob:report` on 2026-08-11; it was
never applied to its sibling. Both lines now match the working tools and both outputs
regenerate. `reports/monster-ref.md` and `.html` had never previously existed on disk.

### 10.2 CONFIRMED — the analytical reports model only four of the player's power sources

This is the headline finding, and it is larger than anything §8 anticipated.

`dps-report`, `ehp-report`, `mob-report` and `balanceLab.ts` import exactly
`ITEM_DATABASE`, `MONSTER_DATABASE`, `BIOME_DATABASE`, `SKILL_TREE` and `GAME_CONFIG`.
They import **no** core, relic, rune, rite or stance database, and not one of them ever
sets `activeStance` on the `PlayerStatsTarget` it builds.

| power source | analytical reports | bench bots |
|---|---|---|
| weapon / armour / charm / mobility | ✅ | ✅ |
| cores | ❌ | ✅ |
| relics | ❌ | ✅ (T4+) |
| rites | ❌ | ✅ |
| stances | ❌ | ✅ (`perfection-stance`, T2+) |
| runes | ❌ | ✅ |

`recalculatePlayerStats` *does* apply the stance (step 2a) and the class affinities (step
3d/3e) — the affinity rework is correctly picked up for free. But because the tools leave
`activeStance` unset, every analytical number in the repo describes a **stanceless player
wearing no core, no relic and no rune**, while every bench number describes a player
carrying all of them. Neither tool documents this, and the two families are therefore not
comparable in absolute terms.

For "which weapon beats which weapon" the reports remain sound — the omission is uniform
across rows. For any judgement about absolute pitch, or about the five missing systems'
own numbers, they are not usable as-is. This is the structural reason §5.4 exists.

### 10.3 CONFIRMED — `mob-report` is blind to charged attacks and consecutive hits

`rawDirectDps()` is `attack × attacksPerSecond` and nothing else
([mob-report.ts:120](../../tools/mob-report.ts#L120)). `monsterSpikeMult()`
([:137](../../tools/mob-report.ts#L137)) checks `cadenceFinisher`, `empoweredCooldown`,
`aoeAttack`, `rampOnCombat` and boss-script enrage/stat-buff/slam — **but never
`chargedAttack`**. The string `chargedAttack` does not appear in the file at all, nor does
`consecutiveHits`.

**47 of 134 monsters (35%) carry a `chargedAttack`** — 22 bosses and 25 normal mobs. The
charged cast is the centrepiece of the boss encounter rework, and it is exactly the
telegraphed spike a balance pass reads the "worst spike" column to find. `tier-table.ts`
was taught to price charged attacks on 2026-08-23 (which moved the T1 Mountain and Caverns
figures); `mob-report` never was. The two monster instruments therefore disagree, and
`mob-report` under-states threat for a third of the roster.

### 10.4 CONFIRMED — `ehp-report` claims approximations it does not implement

Its own methodology text says: *"Cheat-death, hardening/stationary/sustained-fight DR ramps
use mid-point or one-shot approximations"* ([ehp-report.ts:1638](../../tools/ehp-report.ts#L1638)).
Cheat-death is genuinely modelled. The three DR ramps are not — `defense.hardening-*`,
`defense.stationary-dr-*` and `defense.sustained-fight-*` appear nowhere in the file, and
`evaluateSurvivability()` reads only `mitigatesDamage.plating` and `.damageReduction`.

30 of the 48 authored `defense.*` keys are unconsumed. The ones that carry real authored
values are concentrated in the **late-tier armours whose signature mechanic they are**:

| armour lineage | mechanic | authored value | credited |
|---|---|---|---|
| Volcanic | `hardening-per-sec` | +3/s plating to +24 | none |
| Tundra | `stationary-dr-pct` | 15–20% DR | none |
| Trench | `sustained-fight-dr-bonus` | to +5% DR | none |
| Wasteland | `hit-plating-per-stack` | +1 × 5 stacks | none |
| Jungle / Volcanic | `overheal-ward-pct` | 25% / 50% | none |
| Plains charm | `recovery-on-kill-pct` | 20% for 4s | none |

In an idle game whose auto-combat player stands and fights, Tundra's stationary DR is
close to permanently active and is being scored at zero. Four of the seven T3/T4 armour
lineages get no credit for the thing that makes them that lineage.

Separately, the **barrier is modelled as a one-time buffer with no recharge**. That one is
honestly disclosed in three places, so it is a stated limitation rather than a lie — but
after the 2026-08-22 Barrier & Ward rework the barrier refills at 25% of max per second
after 4s undamaged, which is a large sustained mitigation source in exactly the
between-pack rhythm an idle game has. `defense.barrier-recharge-pct`,
`defense.barrier-delay-ms` and wards are all unread. No item authors the two barrier
companions yet, so only the ward omission bites today.

### 10.5 DISMISSED — the `ITEM_UPGRADE_LEVEL = 3` suspicion

Not a stale literal. `mob-report` and `balanceLab.ts` both use +3 deliberately and label it
in the output (`Entry (prev-tier +3)`, `Same-tier +3`), and the Balance Lab's documented
metric contract names the same figure. The reference player is an *entry* player by
design, not a fully-geared one.

The real (smaller) issue is that neither file explains the constant, and +3 is now 60% of
the cap rather than 100% of it — so `mob-report` has **no fully-geared profile at all** and
cannot answer "can a maxed player handle this biome". A coverage gap, not a bug.

### 10.6 DISMISSED — the `tier-table` blindness suspicion

Largely resolved already. The tier table reads `appliesAntiheal`, `appliesMark`,
`appliesPlatingShred`, `appliesVulnerability`, `cadenceFinisher`, `cadenceVolley`,
`chargedAttack` (with its riders), `consecutiveHits`, `empoweredCooldown`,
`empowersAllies`, `enemyShield`, `markedStrike`, `openingStrike`, `openingVolley`,
`raisesDead`, `shellUp`, `swarm` and `pack`. It is the best-maintained instrument in the
set.

Two residual notes: neither monster tool reads `targeting` (the boss rework's
`targeting.prefersPlayers`, which retired the anti-summon cleave), and the tier table
reaches `chargedAttack` through an `as unknown as {…}` cast, so a future rename of that
field would silently read `undefined` forever without failing typecheck.

### 10.7 SUPERSEDED — the "stale T1 bossExam band" note

Far worse than stale. A full T1 exam was run: 5 bosses × 5 armour sets × 6 class roots,
gear fully upgraded, time-scale 1.

**150 of 150 fights ended in `bot_died`. Every boss reads `0/30`.**

| boss | biome | record | full-fight cost | best HP removed |
|---|---|---|---:|---:|
| Gnarled Greatbear | forest | 0/30 | 5.02 bars | 25.1% |
| Obsidian Broodmother | cave | 0/30 | 4.93 bars | 28.1% |
| Tusked Razorback | plains | 0/30 | 4.71 bars | 48.1% |
| Crag Behemoth | mountain | 0/30 | 3.36 bars | 31.6% |
| Grave Toadeater | swamp | 0/30 | — | 42.9% |

A fight costs three to five entire health pools. The best result anywhere in the matrix
removes under half a boss's HP.

The farm bench corroborates it from the other direction: a fully-upgraded cadence bot on a
T1 cave node recorded **8 deaths in 300 simulated seconds (96 deaths/hour)** while clearing
528 kills/hour.

Because tier advancement requires **two** T1 boss seals ([seals-current-state.md](../seals-current-state.md)),
the game as currently authored is hard-gated at T1 by the bench's account. The instruments
are working correctly; they are reporting a real and total failure of the current numbers.

### 10.8 Verdict

| instrument | runs | trustworthy for this patch |
|---|---|---|
| `tier:table` | ✅ | ✅ — best-maintained; within-tier shape only (§5.4) |
| `monster:ref` | ✅ *(fixed today)* | ✅ — raw dump, nothing to be wrong |
| `mob:report` | ✅ | ⚠️ — blind to charged attacks on 35% of the roster (§10.3) |
| `dps:report` | ✅ | ⚠️ — no cores/relics/runes/rites/stances (§10.2) |
| `ehp:report` | ✅ | ❌ — three DR ramps claimed but absent; late-tier armours mis-scored (§10.4) |
| Balance Lab | ✅ | ⚠️ — inherits §10.2 |
| farm bench | ✅ | ✅ |
| `bossExam` | ✅ | ✅ |
| `bench:balance` boss/overlord | ✅ | boss mode still measures guards (§5.1) |
| `bench:tui` | not re-run (Rust; wraps a verified CLI) | — |

**Fix before tuning anything, in this order:** §10.4 (the eHP report is actively
misleading about late-tier armour, and item numbers are in scope for this patch) → §10.3
(a third of the monster roster is under-threatened) → §10.2 (decide whether the analytical
reports should equip the other five systems, or state loudly that they do not).

§10.7 is not an instrument problem, but it is the first thing the patch has to answer.
