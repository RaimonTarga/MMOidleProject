# Tier 1 Boss Numbers — pass record and handoff

**Date:** 2026-08-21
**Branch:** `feat/biome-ecology-pass2`
**Scope:** the numerical pass on the five T1 bosses. Mechanics were NOT redesigned.
**Predecessors:** `t1-balance-context-2026-08-18.md` (vacuum method, trash data),
`mitigation-rebalance-handoff-2026-08-18.md` (the armour problem this pass sits on top of).

---

## 1. The premise this pass corrects

T1 bosses are **not** a ladder along the railroad. The player runs
`Plains → Forest → Swamp → Mountain → Caverns` on normal content, banks global mastery
and +4/+5 gear, and only then starts clearing dungeons. So all five are **end-of-tier
encounters**; biome decides mechanics, never progression level.

They were not tuned that way. Measured against one end-of-T1 bot, the encounter cost
spanned **5.5×** across the five, from a boss no build could beat to one no build could lose to.

---

## 2. The instrument, and a defect it exposed

### `--mode boss` in the balance bench has never fought a boss

A dungeon node standing idle holds only its **guard**. The boss is spawned by
`activateDungeonAltar` — a player interaction — followed by a 7 s wake-up. The bench bot
never touches the altar, and `runBalanceMatch` breaks the moment `isNodeCleared` is true.
So the run ends when the guard dies, before the boss exists.

Evidence: `reports/boss-mode-guard-only-evidence.csv` — a `--mode boss --tier 1` run where
`node-t1-plains-dungeon` reports `outcome=clear` with `damage_dealt=513` against a boss with
1500 HP. The fight log shows Field Hares and Prairie Defenders and no boss at all.

**Every boss row that bench has ever printed is a guard row.** Left unfixed here (fixing it
properly means teaching the bot to walk the altar); the new runner below sidesteps it.

### `server/bench/bossExam.ts` — the new runner

Strips the guard, wakes the boss immediately, and measures the boss encounter alone.

```bash
pnpm --filter @mmo-idle/server exec tsx --conditions=development \
  bench/bossExam.ts --tier 1 --max-seconds 240 > reports/boss-exam-t1-after.md
```

Defaults to 5 armour sets × 6 class roots per boss (150 fights, ~7 min, needs `pnpm db:up`
for the baked hitbox cache). Metrics:

| metric | definition |
|---|---|
| `hp lost` | per-tick HP **decreases**, not pipeline `damageTaken` — DoT, pools and splash all bypass the pipeline, and that is most of two bosses' output |
| `ttk` | `elapsed / bossHpFrac`; extrapolated when the fight did not finish |
| `cost bars` | `hp-lost-per-second ÷ pool × ttk` — health bars the **full** fight costs. Defined for losses too, which is why it, not win rate, is the tuning signal |
| `burst` | worst single second as a share of pool |
| `attrition%` | share of hp lost that bypassed the combat pipeline |

Two deliberate choices:

- **Gear biome is a parameter, not the boss's biome.** T1 armour answers its own biome
  wildly unequally, so scoring each boss only in its native set would let a broken armour
  decide the boss's numbers. Every boss is measured against all five sets.
- **Summoner is excluded from the tuning signal** (reported separately). See §6.

### Also fixed

`tools/tier-table.ts` `directDps()` ignored `consecutiveHits`, understating the Gnarled
Greatbear by exactly 2×. The tier's biggest sustained-damage monster read as an average one.

---

## 3. Before → after

Medians over 5 armour sets × 5 class roots (summoner excluded).

| boss | cost bars | ttk s | win% | burst %pool |
|---|---|---|---|---|
| Gnarled Greatbear | 1.93 → **1.21** | 19.5 → **27.3** | 0 → **52** | 19.6 → 8.3 |
| Tusked Razorback | 1.58 → **1.34** | 30.1 → **33.0** | 36 → **80** | 15.3 → 11.4 |
| Crag Behemoth | 0.94 → **1.22** | 20.9 → **29.7** | 80 → **64** | 21.9 → 20.6 |
| Obsidian Broodmother | 0.63 → **1.26** | 19.1 → **30.5** | 100 → **60** | 13.4 → 17.9 |
| Grave Toadeater | 0.35 → **1.22** | 16.5 → **29.8** | 100 → **52** | 4.8 → 8.0 |
| **spread** | **5.5× → 1.11×** | 1.8× → 1.21× | | |

Fight length was the second problem. At ~19 s the authored mechanics never got to speak:
charged casts sit on 9–10 s cooldowns, the Greatbear's ramp took 18 s to cap, pools last 7 s.
Every boss now runs ~27–33 s, which is 3 charged casts, a completed ramp, and a 50 % phase
that arrives with half the fight still to go. `boss-design.md` asks for 30–45 s.

### Stat changes

| boss | HP | attack | other |
|---|---|---|---|
| Tusked Razorback | 1500 → 1700 | 42 → 34 | adds untouched |
| Gnarled Greatbear | 1250 → 2000 | 36 → 24 | ramp `maxPct` 0.48 → 0.28, `perTickPct` 0.08 → 0.07 |
| Grave Toadeater | 1150 → 2100 | 12 → 13 | DoT 3×3 → **4×4**; pool tick 3 → 3, cd 9000 → 8500 |
| Crag Behemoth | 1400 → 2100 | 60 → 56 | slam ×2.0 → **×1.9** (106 dmg) |
| Obsidian Broodmother | 1050 → 1750 | 40 → 47 | slam ×1.5 → **×1.8** (85 dmg) |

Untouched everywhere: every phase script, cleave, charge-on-aggro, `consecutiveHits`,
`appliesPlatingShred`, shield magnitudes, add counts and add timings, all rewards.

---

## 4. How each boss spends its budget

| boss | axis | how |
|---|---|---|
| **Razorback** | adds / concurrency | The weakest personal hit of the five *because* roughly half the encounter's output is the swarm. Longest fight (33 s), lowest burst. Highest win rate — the swarm is attrition, not lethality. |
| **Greatbear** | sustained pressure | Fastest cadence in the tier (2 hits / 1.4 s, ramping to 1.09 s), no spike, no adds, no attrition. Lowest burst of the four physical bosses. |
| **Toadeater** | DoT attrition | **93 % of its damage bypasses the combat pipeline.** Trivial direct hit (13, exactly the Mud Toad's), a poison that now out-damages its own biome's trash instead of being half of it, and a rot pool. Lowest burst in the tier. |
| **Behemoth** | burst | The tier's biggest single hit (106, ~55–60 % of pool) on a 10 s cycle. Highest burst reading by a wide margin (20.6 %). Its 50 % shield stretches the fight past a third slam. |
| **Broodmother** | endurance | Lowest raw HP, hardest to chew through: plating 6 + 10 % DR give it a 2.6× armour spread, so chip builds meet several times the effective HP heavy hitters do. Plating corrosion strips the player's own mitigation as it goes. |

---

## 5. What was deliberately NOT changed

Normal monsters, items, classes, armour, upgrade scaling, node modifiers, rewards.
The tier-table biome summary and all eight railroad ordering checks are byte-identical
after this pass — normal-content balance was not touched.

---

## 6. Remaining uncertainty — read before the next pass

### 6a. The Greatbear is parked on the plating cliff and cannot be tuned off it

Measured end-of-T1 player plating, fully upgraded (`bench/bossExam.ts` sibling probe):

| armour set | plating | DR | evasion | pool |
|---|---:|---:|---:|---:|
| plains | **26–29** | 0.00–0.08 | — | 144–184 |
| swamp | 18–21 | 0.00–0.08 | — | 164–204 |
| mountain | 19–22 | 0.00–0.08 | — | 162–202 |
| forest | 11–14 | 0.00–0.08 | **0.38–0.57** | 164–204 |
| cave | 9–12 | **0.16–0.24** | — | 173–213 |

Plating is a flat subtract with a 1-damage floor. A 24-damage hit therefore deals **1** to a
plains-geared player and ~19 to a cave-geared one. The Greatbear's armour spread is **5.8×**
where the other four sit at 1.7–1.8×.

This is not fixable from the boss side. Raising the hit above 29 fixes the spread but
multiplies total damage far faster than any cadence cut can absorb: you cannot have
"fast, frequent, small hits" *and* a sane total at this plating scale. Its **median** is on
band; the spread is the gear defect from the mitigation handoff.
**Re-measure this boss first after the mitigation pass.**

### 6b. Toadeater's 3.2× spread is intentional, but check the low end

Forest gear runs evasion 0.38–0.57, and an evaded hit applies no DoT — so forest builds skip
roughly half of the poison applications. That is the authored rule working, and it is the
kind of matchup variation this pass wants. But forest gear puts the fight at 0.65 bars
against a 1.22 median, which is a pushover for that one pairing. Worth a look once
DoT-resist actually exists (it currently does not exist on any T1 item).

### 6c. Summoner is broken against cleaving bosses, and it is a class problem

Summoner cost bars: 1.53 (Greatbear, no cleave) → **12.7 / 16.7** against the Behemoth and
Broodmother, which cleave. It removes ~15 % of the boss's HP before dying. The anti-summon
cleave guardrail in `boss-design.md` is doing its job and then some — minions die to splash
faster than they contribute, and the summoner has almost no personal damage to fall back on.
Out of scope here (class balance, and the mechanic is locked), but it means the summoner
row in any boss report should be read separately, not averaged in.

### 6d. Absolute pitch is provisional

`cost bars ≈ 1.2` and `ttk ≈ 30 s` are the band this pass chose. The *relative* calibration —
five bosses within 1.11× of each other, spending the budget on five different axes — is the
durable result. The absolute level will move when player/item balance is recalibrated, and
that is expected: the point was to give that pass a coherent baseline to calibrate against.

### 6e. `ttk` is extrapolated on losses

`elapsed / bossHpFrac` assumes constant player DPS, so it is mildly optimistic for the two
bosses that harden at 50 % (Behemoth, Broodmother). Rows carry their outcome; prefer runs
that actually finished when reading a single row.

---

## 7. Verification performed

- `pnpm typecheck` — clean (all packages plus `tsconfig.bench.json`).
- `pnpm test` — **82/82**, including `bossRework.test.ts`, which pins every boss mechanic
  this pass had to preserve.
- `pnpm build` — clean.
- `pnpm tier:table --tier=1` regenerated; biome summary and all 8 railroad ordering
  checks unchanged.
- `bench/bossExam.ts` full T1 sweep before and after: `reports/boss-exam-t1-before.md`,
  `reports/boss-exam-t1-after.md` (150 fights each).
