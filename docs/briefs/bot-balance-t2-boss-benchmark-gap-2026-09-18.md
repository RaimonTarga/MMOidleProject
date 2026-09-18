# T2 boss benchmark gap — execution ledger, withdrawn inference, and the bounded reproduction

Date: 2026-09-18. Status: analysis and work order. **Nothing was launched. No balance value changed.**
Supersedes the §5 conclusion of
[the D37 decision note](bot-balance-d37-decision-and-boss-screen-blocker-2026-09-18.md).

---

## 1. Execution ledger

Classification: **historical** (read from a prior record, not re-run) · **exploratory** (ad-hoc,
no frozen identity, stdout only) · **qualification** (packet preflight) · **formal execution**
(a frozen cohort producing durable artifacts).

| # | Reported as | Class | Command | Revision | Dimensions | Outcome | Artifacts |
|---|---|---|---|---|---|---|---|
| 1 | T1 "0/30" | **historical** | none this session | n/a (recorded 2026-08-23) | 5 bosses × 6 roots × 5 armour sets | 0/30 per boss | `docs/tier-balance-current-state.md` §8 only |
| 2 | Timberclaw "0/18" | **exploratory** | `bossExam.ts --tier 2 --boss apex-timberclaw --gear-biomes forest --max-seconds 240` | `bdee5dca` | 1 boss × 1 armour set × **18 builds** (6 roots × 3 variants) × no seeds | 0/18; died 6.6–14.8 s; 14–34% boss HP removed | **stdout only — none persisted** |
| 3 | **T2 "0/126"** | **exploratory** | `bossExam.ts --tier 2 --gear-biomes forest --max-seconds 300` | `bdee5dca` | 7 bosses × 1 armour set × 18 builds = **126 fights** | 0/18 on each of 7 | **stdout only** |
| 4 | T3 "ragged" | **exploratory** | `bossExam.ts --tier 3 --gear-biomes volcanic --max-seconds 300` | `bdee5dca` | 7 bosses × 1 armour set × **54 builds** = 378 fights | 0/54 to 37/54 | **stdout only** |
| 5 | **Striker "47%→50%"** | **exploratory** | throwaway `server/test/_bossFidelityProbe.ts`, **since deleted, never committed** | `bdee5dca` | 2 roots × 2 rune settings × 2 seeds = **8 fights**, 240 s cap | striker 47→50% (died 13.1→14.2 s); slinger 4→8% (13.1→26.7 s); **seeds changed nothing** | **stdout only** |
| 6 | **T4 "12/12"** | **exploratory** | throwaway `server/test/_bossT4Probe.ts`, **since deleted, never committed** | `bdee5dca` | see correction below | all captured rows `boss_killed` | **stdout only** |
| 7 | Sovereign qualify | **qualification** | `node scripts/boss1-preflight.mjs <tmp> <hitboxes>` (qualify leg) | `305f39ee` | 6 cells × 1 seed, **no fighting** — receipts only | 6 ready receipts | `%TEMP%/boss1-pre-frozen/sovereign-qualify/` |
| 8 | Sovereign pilot | **qualification** | same command (pilot leg) | `305f39ee` | **1 cell** (striker) × 1 seed, 60 s | boss-killed 37.6 s; 50% at 24.2 s; Mass Resurrection fired | `%TEMP%/boss1-pre-frozen/` — **OS temp, not the packet's declared preflight root** |
| 9 | **Boss1 full cohort** | — | — | — | — | **NOT RUN** | `…/ttk-survey/boss1` **does not exist** |

**Formal executions this session: zero.** Rows 2–6 wrote nothing to disk and are recoverable only
from the session transcript. Two of them ran on scripts that no longer exist.

### Correction to row 6 — the "12/12" count was wrong

The probe filtered `NIGHT5_BLOCKS.t4a` by `role === 'graveyard'` **without a node filter**, which
selects **12 cells** (6 roots × nodes `-03` and `-05`), × 2 seeds = **24 fights**. Because the probe
hard-coded the dungeon node, the `-03` and `-05` cells are duplicates, so it is **12 distinct
configurations, each run twice**. `tail -20` truncated the first 4 rows; those are exact duplicates
of captured rows. It should have been reported as *"24 fights / 12 distinct configurations, all
wins"*, not "12/12".

---

## 2. Withdrawn inference

**Withdrawn:** that the T4 wins established the harness was sound, that the T1/T2 reference setups
were therefore the broken part, and that "the boss difficulty curve is inverted."

That comparison was invalid. The T2 and T4 numbers came from **two different instruments**:

| | T2 (row 3) | T4 (row 6) |
|---|---|---|
| Harness | `bench/bossExam.ts` | throwaway probe (deleted) |
| Bot preparation | `materializeBot` only | `materializeBot` + survey-style loadout |
| Rune rules | **none** | 5 |
| Abilities | canonical round-robin | `frenzy`+`sweep` / `second-wind`+`cleanse` |
| Gear | auto-selected by scorer | declared qualified T4 ids + relic |
| Seeds / cap | none / 300 s | 2 / 600 s |

Nothing about the T1/T2 reference setup follows from a T4 result produced this way.

**Correct description of row 3:** *0 wins in 126 fights is the outcome of one specific benchmark
configuration of `bossExam.ts` at content tier 2 — forest armour set, scorer-selected gear,
canonical round-robin abilities, offensive stance, no rune rules, guard stripped, no seeds.* It is
not a measurement of boss balance, and no boss number should be moved on it.

---

## 3. The recovered success: Apex Timberclaw was beaten 2/2

Source: [V1i report](bot-balance-v1i-report.md) Phase C, run on frozen revision
`61080e54b2849857055b76a9b4f6d058f40e577d` (2026-09-13), live bot harness, server-authoritative.

| Slot | Boss combat ms | Player HP low | Outcome |
|---|---:|---:|---|
| 001 Axe r1 | 27,024 | **46.50%** | Apex Timberclaw victory; progression `forest:2` |
| 002 Axe r2 | 25,020 | **41.96%** | Apex Timberclaw victory; progression `forest:2` |

Both runs completed 36/36 route steps and **first cleared the ordinary 12-guardian phase**
(58.1 s / 62.1 s) before the boss. Counterplay recorded: Expose Weakness 7, Second Wind 1, Brace 1,
Step Back 3 activations / 2 successes. Reported damage taken 157.85 / 179.17 against a **231** pool,
absorbed 345.15 / 341.83, healed 439.15 / 429.83. Artifacts under
`…/mmo-idle/experiments/20260913t171504z-spirit-campaign-forest-ruinous/`.

The same experiment also separated weapons on the *same* Spirit snapshot against Gorging Razortusk
(plains T2): **Ruinous Axe 2/2 victories, Gale Needle 0/2 — both Needle runs died.**

---

## 4. Concrete mismatches

Route: `spirit-campaign-forest-ruinous-axe-t2` (`bot/src/routes/campaignT2Boss.ts`).
Benchmark: `bossExam.ts` energy-root cells, content tier 2, forest armour.

| Axis | Successful (V1i) | Benchmark | Same? |
|---|---|---|---|
| **Weapon** | `ruinous-axe` | **`gale-needle`** | ✗ — and the campaign's own study measured Gale Needle at **0/2** and Ruinous Axe at 2/2 on the same snapshot |
| **Armour/charm/boots** | `cave-vest-t2`, `mountain-charm-t2`, `plains-boots-t2` (mixed biomes) | `forest-vest-t2`, `forest-charm-t2`, `forest-boots-t2` | ✗ |
| Core | `core-tempered` | `core-tempered` (heavy variant) | ✓ |
| Upgrade level | +5 | "fully upgraded" = +5 (all items author 5 steps) | ✓ **not a mismatch** |
| **Stance** | **`defensive-stance`** | **`offensive-stance`** — `defensive-stance` is in `knownStances` but never selected | ✗ |
| **Techniques** | `expose-weakness` | `charge`, `contagion`, `hamstring` | ✗ |
| **Guards** | `second-wind`, **`brace`** | `bramble-guard`, `endure`, `cleanse` — **no Second Wind, no Brace** | ✗ |
| **Rune rules** | 5: `auto-path-enemy`, `inside-telegraph→step-back`, `in-combat→orbit`, `avoid-hazards`, `wait-for-regen` | **none** (`runesEquipped: []`) | ✗ |
| **RP allocation** | **28/30** — 5 rules + 3 abilities + stance, 0 rites | **30/30** — 6 abilities + stance, **0 RP on behaviour** | ✗ |
| Progression | GM72, all T2 biomes maxed | `canonicalBiomeLevels(2)` | partial |
| **Encounter** | live node: 12 guardians cleared, then altar → boss | **guard stripped, boss force-woken**, fresh full-HP bot | ✗ (benchmark is the *easier* setup) |
| **Control** | live server, route steps, server-authoritative | bench world, direct tick loop | ✗ |
| Pool | 231 | e.g. striker 251, slinger 225 | ≈ |

### Why RP is the structural one

Both loadouts fit the **same 30-point budget**. The benchmark is not under-resourced — it spends
**every point** on a round-robin ability set because its selection loop computes cost with
`rules: []` and so never reserves anything for behaviour. The configuration that wins spends 28 and
buys the five rules instead. The benchmark cannot express the winning build at all.

### Revision check

- **`apex-timberclaw` is byte-identical** between `61080e54` and HEAD. The only `bossesT2.ts` change
  is a `label` added to a `stat-buff` on a *different* boss.
- **Adds/escorts: none.** Apex Timberclaw has no `spawn-adds` and no `raisesDead`. Its mechanics are
  enrage at 50%, repeating Bestial Frenzy, and a charged Stunning Swipe (AoE r90, 900 ms stun).
  The guardians are separate content that the benchmark removes.
- **Ordinary forest mobs did change**: `ancient-wolf` 350→1575 HP / 34→22 attack, `ironwood-golem`
  315→945 / 31→25. These are guardian-phase and node-population bodies, not boss adds.
- **Player-side systems did change** since `61080e54` — `finalDamage.ts` (additively extended for a
  sunlight effect), `passives.ts`, `monsterDebuffs.ts`, `alphaWindow.ts`, ability cooldown/tempo
  work. None is an obvious nerf, but **revision drift cannot be dismissed** and stays a live
  hypothesis.

---

## 5. The bounded reproduction

Purpose: separate **build selection**, **automation**, **encounter setup**, and **actual balance**.
One boss, one root, no matrix, no tuning. **Not run.**

### Part 1 — bench ladder, 5 fights

All arms: Spirit / `energy-root`, `apex-timberclaw`, `node-t2-forest-dungeon`, 300 s cap, **1 seed**
(seeds are measurably inert for this boss — row 5 — so a second buys nothing).

| Arm | Change from the V1i replica | Isolates |
|---|---|---|
| **A** replica | V1i kit, +5, defensive stance, `expose-weakness`/`second-wind`+`brace`, 5 rune rules | baseline — does the known-good build win in the bench at all? |
| **B** | A, minus rune rules | **automation** |
| **C** | A, but `offensive-stance` | **stance** |
| **D** | A, but benchmark abilities (`charge`/`contagion`/`hamstring`, `bramble-guard`/`endure`/`cleanse`) | **ability kit** |
| **E** | A, but benchmark gear (`gale-needle` + forest set) | **gear/weapon selection** |

Reading it: **if A wins**, encounter setup and balance are exonerated at HEAD and the entire gap is
benchmark configuration — B–E then rank the causes. **If A loses**, the bench arena or revision
drift is implicated and Part 2 becomes decisive.

### Part 2 — live replay, 1 run (conditional)

Re-run the existing `spirit-campaign-forest-ruinous-axe-t2` route on the bot harness at HEAD and
diff against the 2026-09-13 artifacts. Needs the compose stack (`db`, `logdb`, `redis`).

- Still a victory → encounter and balance are fine at HEAD; Part 1's answer stands alone.
- Now a death → something between `61080e54` and HEAD moved, and the diff of §4's revision list is
  the search space.

### Rules

No new broad matrix. No nerfs. No boss or player value changes. No balance numbers are requested
from the user until the setup question is answered.
