# D37 decision note — receipts verified, six deaths dispositioned, boss screen blocked at early tiers

Date: 2026-09-18. Author: command-center preparation session.
Status: decision/exception note. No production numbers were changed. No experiment was rerun.

This note closes the D37 review and reports the **exact genuine blocker** that stops the first
boss Operator Packet from being frozen as proposed. It does not redesign the boss screen; the
substitution that would unblock it is named in §5 and belongs to the command center.

---

## 1. Source receipt — verified, with one defect

Everything the D37 report claims about its own identity is confirmed locally, and two of the
checks were re-derived rather than read back.

| Check | Result |
|---|---|
| `git rev-parse HEAD` | `bdee5dcac2d3c3b89bd791cbbeea2589fb5ae0cd` — matches report and `batch-manifest.json` |
| `git rev-parse HEAD^{tree}` | `03708b0493bcfb7b4a1fa1d5ff2debb60f8aa705` — matches |
| Definitions hash | **Independently recomputed** from the current tree via `checkpointDefinitionsHash()`: `17aa46cb…f629d8f`. Identical to the manifest. |
| Hitbox hash | `08bcc556…c493afa83`, asserted by the runner itself before any work |
| `hpTreatment` empty | **74/74 `ready.json` files parsed mechanically**: 0 non-empty, 0 with `synthetic !== true` |
| Batch completion | `batch-ended.json`: `artifactVerified: true` both blocks, `navigationGate.status: "pass"`, `wallMs` 358,598. No `stopped.json` anywhere in the tree. |

**Execution on the committed tree is mechanically enforced, not merely asserted.**
`scripts/durability37-run.mjs` hard-asserts, before creating the output root, that `HEAD` equals
the passed revision, that `git status --porcelain --untracked-files=no` is empty, that the tree
hash matches, and that the hitbox file hashes to the declared value. A dirty or drifted tree
could not have produced this artifact set.

**Adoption commit contents.** `bdee5dca` touches 43 files: the eight monster data files, the
D37 harness (spec, preflight, run script, matrix and integration tests), ten rebased/retired
durability specs and their tests, `ttkSurvey.ts`, and docs. No combat, ECS, persistence or
protocol code. This is adoption and tooling, as described.

### The defect: the adoption commit ships a red test

`server/test/t4ProgressionEconomy.test.ts` **fails at `bdee5dca`**. Its Trench snapshot still
guards the pre-adoption HP (`hadal-stalker` 2800, `abyssal-serpent` 4200, `elder-leviathan`
5880) while the adopted source carries 16800 / 16800 / 17640. Verified by running the committed
version of the file against current source:

```
Error: hadal-stalker: hp must be unchanged (2800)
```

The repair exists **only in the uncommitted working tree** (rebases the snapshot to the adopted
values and re-states that the block's subject is the essence correction, not HP). Its mtime is
20:05:19 local — about 37 seconds before the batch ended, so it was written during the run and
after the runner's clean-tree assertion.

Consequences, stated precisely:

- **D37's measurements are unaffected.** The file is a test-only assertion; it is not loaded by
  `ttkSurvey.ts`, and the definitions hash re-derives identically with and without it.
- **The qualification claim was narrower than it reads.** The report names four tests
  (`mobAdoptionIntegration`, `durability37Matrix`, `durability36Matrix`,
  `t1MountainPressureAdoption`) plus `pnpm typecheck`. All pass. But the adoption changed HP that
  a fifth, unnamed test guards, and nothing in the qualification set would catch it.
- **No revision can be frozen for the next packet until this is committed**, because the runner
  requires a clean tree.

This is the concrete instance of the handoff-boundary problem the work order describes. The fix
is forward-only: commit the repair, do not rerun D37.

---

## 2. The five T3 Jungle deaths — one mechanism, reported as local pressure

All five are the same shape. The adoption changed **HP only** in Jungle — attack, defense, ramp,
cadence, movement, ecology, density and rewards are untouched, confirmed from the commit diff.
T3 bodies rose `silverback` 2090 → 3200, `jungle-stalker` 790 → 1250, `canopy-harrier` 720 → 1150.
At constant incoming DPS, that is roughly **55% more time under fire per body**.

Runtime values in the measured node (the shared `dominion` modifier scales both HP and attack by
×1.15): Silverback 3680 HP / 108 attack, Stalker 1438 / 72, Harrier 1323 / 59. Player T3 pools
are 357–459 with plating 31–47 and `damageReduction` 0.

**The Silverback is the dominant killer in all five deaths and lands the killing blow in all
five.** Its ordinary hit arrives at 94–139 on the player — **26–37% of the entire pool in one
blow** — against Stalker's 52–79 and Harrier's 20–31.

The structural reading is a pool-to-burst ratio (player `maxHp` ÷ worst observed one-second
incoming), computed across all 54 Block J observations:

| Tier | Ratio range across all roots/seeds | Deaths |
|---|---|---:|
| T2 | 4.6 – 17.1 | 0 / 18 |
| **T3** | **2.2 – 4.1** | **5 / 18** |
| T4 | 4.1 – 9.9 | 0 / 18 |

T3 is a **defensive trough**, and every death sits at the bottom of it (2.2–2.6). T4 carries far
more HP and kills nobody, because the T4 player's pool and plating outgrow T4 monster attack while
the T3 player's do not.

Two sub-shapes, reported separately rather than pooled:

- **Apprentice (192.8 s / 285.7 s, after 13 and 19 kills)** — genuine long attrition. It cleared
  most of a window first.
- **Slinger (44.9 s, 3 kills) and Conduit (36.4 s / 0 kills, 80.5 s / 3 kills)** — early. The
  opening engagement contained a Silverback; the episode never resolved.

Checks that came back clean, so they are not the cause:

- **Mechanics fired.** `monster-cast-start` events are present in every fatal sequence.
- **Navigation is clean.** 66/66 escapes, 0 affected rows, gate `pass`.
- **Conduit's summons are not broken.** Minion throughput is normal per second (2.5–2.6
  `minionAttackBeats`/s versus 2.9 at T2). It simply cannot remove 3680 HP before its own 381 pool
  is gone. Zero owner `attackBeats` is `CannotAttack` by design and is not used here to invalidate
  its survival evidence.

**Disposition: concrete local pressure correction warranted — not a functional defect, and not a
reason to roll back the T3 HP adoption.** Rolling HP back would re-break the ladder direction D37
was run to confirm. The pressure lives on the **defensive margin at T3**: either the T3 player
pool/mitigation budget, or the Silverback's per-hit share of that pool.

**Smallest verification that would change this decision:** re-run only the three T3 Jungle cells
(apprentice, slinger, conduit) × the same three seeds, holding `silverback` HP at 3200 and
reducing only its attack so its landed hit is ≤20% of a T3 pool. If deaths go to zero while the
primary-lineage body TTK stays near 14.8 s, the diagnosis is confirmed and the adopted ladder is
preserved. That is 9 observations, and it does not block any unrelated boss.

---

## 3. The single T2 Forest death — known nonblocking matchup

`dur37-integration-forest-t2-apprentice`, seed 87011. Read from existing artifacts only.

- Died at **224.5 s after 28 kills**, with 161 incoming hits and 8 engagement episodes.
- **Largest single hit 26.1** against a 240 pool — **10.9%**. Worst second 47.8 (19.9%).
- Damage source split: Dire Wolf 829 over 95 hits, Dire Whelp 294 over 53, Ironclaw Badger 170
  over 9, Thorn Spitter 54 over 4.
- **18 late joiners** across those 8 episodes.

No blow is remotely threatening on its own; the bot out-killed 28 bodies and was worn down by an
accumulating crowd. The comparator root (striker) cleared the same family without incident.

**Disposition: known nonblocking attrition matchup.** It is not evidence of a Forest overtune, it
does not warrant a biome nerf from one seed, and — importantly for §5 — **it does not block
`apex-timberclaw` or anything else in the T2 Forest family.**

---

## 4. Retained exceptions, unchanged

- **T2 Mountain Striker attrition** stays open at "halved, not resolved". D37's single-seed
  zero-death sample is not resolution and was not treated as new evidence either way.
- **T1 Apprentice / swarming** stays a named residual farming exception.
- Neither search is reopened here.

---

## 5. The boss screen blocker — early-tier bosses are unwinnable, T4 is not

The starter packet proposes `apex-timberclaw` (T2 forest) as the earlier-tier slot and
`charnel-crown-sovereign` (T4 graveyard) as the later. Both identities, and every stat the packet
quotes, are verified from source. The three Sovereign escorts are confirmed at exactly the adopted
values (`bone-crawler` 2059→1235, `plague-hound` 3168→1901, `carrion-vulture` 2693→1616), so the
packet's escort-receipt rule is well founded.

**The earlier-tier slot cannot produce a pacing number.** Measured today at the frozen revision:

| Scope | Result |
|---|---|
| `bossExam`, **all 7 T2 bosses**, forest gear, 6 roots × 3 builds, 300 s cap | **0 wins / 126 attempts** |
| — where `apex-timberclaw` ranks | Among the **cheapest**: 5.17 cost bars, 48.4 s ttk (2nd easiest of 7) |
| `bossExam`, all 7 T3 bosses, volcanic gear, 300 s cap | Ragged: **0/54** (swamp, 99% attrition) to **37/54** (jungle) |
| **T4 `charnel-crown-sovereign`**, 6 qualified tier-legal roots × 2 seeds, full rune loadout | **12 wins / 12**, 36–104 s, 1.1–3.1 bars |

Combined with the already-documented **0/30 on unchanged T1 bosses** (`docs/tier-balance-current-state.md`
§8, after the five 2026-08-22 affinity / Barrier / Recovery / item / ability commits), the
difficulty curve is **inverted**: T1 and T2 bosses are unbeatable by the reference player at every
root, T3 is ragged, and the final-tier boss in the packet is comfortable.

### This is not (only) a harness artifact, and that is new

The campaign has correctly warned since 2026-08-23 that `bossExam` "cannot be trusted" and that a
0/N is a bot-fidelity artifact. Two controls sharpen that:

1. **The rune loadout is not the explanation.** `bossExam` builds its bot with `materializeBot`
   alone, which leaves `runesEquipped: []` — no `inside-telegraph → step-back`, no
   `avoid-hazards`, no `wait-for-regen`, no orbit. D37's `prepareSurveyBot` equips and
   legality-validates all five. Re-running `apex-timberclaw` with the full D37 loadout moved
   striker from **47% → 50%** of boss HP removed; it still died at ~14 s. Slinger doubled its
   survival (13.1 s → 26.7 s) and still removed only 8%.
2. **The same code path with the same loadout wins 12/12 at T4.** That is a positive control the
   campaign did not previously have. `bossExam`'s encounter path — guard stripped, boss forced
   awake — demonstrably *can* win boss fights.

So a 0/N at T1–T2 is a statement about **the reference player at those tiers**, not proof that the
harness is unusable. The blocker is bounded, and it is an early-tier one.

**Consequence: freezing the packet as proposed would re-measure a known wall** and reproduce
exactly the stale-band error the starter packet itself warns against. The T4 slot is unaffected.

### Harness gaps that any boss freeze must close

Found while verifying the packet is executable. These are why it is not frozen here.

1. **No seeds.** `bossExam.ts` takes no seed and `runFight` consumes none. For `apex-timberclaw`
   two seeds produced **byte-identical** outcomes — no adds, fixed spawn, and evasion is
   deterministic in this codebase. Seeds *do* vary the Sovereign (raise-dead and add offsets).
   Declaring "2 seeds" for a no-add boss buys nothing and should not be recorded as 24 attempts.
2. **No per-observation receipts.** `bossExam.ts` emits report rows only. The packet's mandatory
   rule — the Sovereign's `ready.json` must record the three escorts' live HP and attack, and the
   run is *invalid* if they disagree with Block I — **cannot be satisfied by it as written**.
3. **Wrong build breadth.** It calls `enumerateBuildsForContentTier`, the full variant × range ×
   T3-choice cross-product (3 builds/root at T2, 9 at T3), which the packet explicitly forbids. A
   declared per-root tier-legal cell list is needed — the shapes already exist
   (`NIGHT5_BLOCKS.t4a` for T4, D37's `lowerCell` for lower tiers).

### Prerequisite status against the starter packet's own list

| # | Prerequisite | State |
|---|---|---|
| 1 | D37 Block I families 1 (T2 Forest) and 4 (T4 Graveyard) clean | **Met.** Forest death dispositioned benign (§3); Graveyard clean, both roots window-ended at 181–259 kills. No shared functional blocker. |
| 2 | Frozen revision / tree / definitions filled from committed state | **Resolvable, currently blocked** by the uncommitted test repair (§1). Clean tree is a hard runner assertion. |
| 3 | Per-boss endpoint and cap resolved from each script | **Met** — resolved below. |
| 4 | Six tier-legal preparations asserted by a matrix test | **Not met.** Build sources exist; the test cannot be finalized until the boss selection is settled. |

### Endpoints and caps, resolved from the scripts

- **`apex-timberclaw`** (3750 / 44): one phase, enrage at 50% HP (`atkMult` 1.15, `cdMult` 0.7);
  repeating *Bestial Frenzy* every 6500 ms after a 5000 ms delay (1500 ms cast, stacking
  `attackSpeed` ×1.12 / `moveSpeed` ×1.1); charged *Stunning Swipe* cd 8000 ms (initial 3500 ms),
  ×1.25, 900 ms stun, AoE r90, hastened by frenzy stacks (`castMs` ×0.88/stack, floor 300 ms).
  A full cycle needs 50% HP removed plus several frenzy stacks. **Cap 300 s** (≈45 frenzy casts,
  ≈37 swipes) comfortably exceeds it.
- **`charnel-crown-sovereign`** (19499 / 115, plating 14, dr 0.08): phase at 100% spawns 3
  `bone-crawler` + 1 `plague-hound` + 1 `carrion-vulture` (`maxAlive` 5, offset 260); phase at 50%
  casts *Mass Resurrection* (1800 ms, `raise-dead` ×3, `maxAliveAdd` 2); passive `raisesDead` every
  8000 ms after 5000 ms (1300 ms cast, `corpseRange` 520, `maxAlive` 4, `hpMult` 0.75, `damageMult`
  0.8). Crossing 50% of a 19499 pool is required for the full cycle; measured full kills run
  36–104 s, so **cap 600 s** is comfortable.

### The substitution that would unblock the screen

Named, not taken — this is the command center's call.

- **Keep** `charnel-crown-sovereign` for the later slot. It is verified executable, its
  dependencies (D37 Block I family 4) are clean, its escorts are confirmed, and it is the case the
  packet exists to test.
- **Replace** the earlier slot. It cannot be T1 or T2 (wall), and per the work order it must not be
  T3 Jungle (unresolved preparation, §2) — which excludes the most winnable T3 boss
  (`apex-bramble-slasher`, 37/54). The strongest remaining candidates are
  **`crag-gorged-horn-behemoth`** (T3 mountain, 17/54) and **`frost-plated-rime-mammoth`**
  (T3 tundra, 13/54). `rot-spore-croc-behemoth` (T3 swamp) should be excluded from a *pacing*
  screen: 0/54 with **99% of damage bypassing the combat pipeline** is its own separate question.

---

## 6. Ledger

- **Main phase:** boss baseline preparation. Not yet testing — blocked at the earlier-tier slot.
- **Integrated mob baseline:** D37 runtime screen complete; **source receipt checked and verified**,
  with one red test shipped in the adoption commit (§1), repaired forward.
- **Jungle representative duration:** accepted for the initial pass.
- **T3 Jungle pressure:** open; locally reviewed; mechanism identified; correction scoped to the T3
  defensive margin with a 9-observation verification. Blocks no boss outside T3 Jungle.
- **T2 Forest single death:** dispositioned as a known nonblocking attrition matchup. Blocks nothing.
- **Earlier Mountain limitations:** retained, not reopened.
- **NEW — early-tier boss wall:** T1 0/30 (documented), **T2 0/126 (measured)**, T3 ragged, T4 12/12.
  A genuine shared dependency for any T1–T2 boss evidence; not a blocker for T3+ bosses.
- **Playtest readiness / ECON-1:** unchanged and still later. No reward-efficiency or
  earned-progression claim follows from D37 or from anything here.
