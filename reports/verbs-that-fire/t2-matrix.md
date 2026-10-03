# T2 composition matrix against its T1 pairs (verbs-that-fire B)

Generated 2026-10-03T21:21Z at `05217baf` by `server/bench/t2CompositionReport.ts`. Weapons: broadsword, rapier. boss lab: 7800 T1 rows, 7800 T2 rows. Fights measured at `5043dd68` (B before wave-1 A merged); `t2-matrix.jsonl` holds the T2 pairs and controls plus both tiers' leans alone, slimmed to the fields this report reads.

**What "as large" compares.** For each lean × verb pair, its UPLIFT on its own tier
against a no-card control of that same tier: the T1 pair on the T1 form vs the T1 form
with no cards (T1 bosses / T1 home nodes); the T2 pair (T2 lean + T2 verb) on the
lineage's band-2 form vs that form with no cards (the same five biomes' T2 bosses / the
home biome's T2 nodes), on a tier-2 character with the T2 counterpart of every kit
item. Uplift: boss lab — mean boss DPS over the control's on the same boss and seeds,
median over bosses; lane bench — kills/min over the control's on the same node, median
over nodes; then the median over the six tutorial classes. **Δ** is T2 − T1 in
percentage points; **≥ in** counts the classes whose own T2 uplift is at least their
T1 uplift. **Size** is the per-firing number the tier scales (the sentence's number):
a share of the hit / swing / cooldown, a multiplier, a hold, or the proxy's bonus
multiple. Fires/min is the verb's landed `card-fx` per minute of fight or farm.

## Runs

- **T2 boss lab:** `_t1BossPlan.ts --matrix=composition --tier=2 --weapons=rapier,broadsword`
  → 6,000 fights (2 weapons × 10 rows × 6 classes × the five T1 biomes' T2 bosses ×
  10 seeds), 3 shards, about 85 min wall on a shared box, 0 errors, 0 refusals.
- **Leans alone:** `--leans` at both tiers → 3,600 fights (2 weapons × 3 leans × 6 classes
  × 5 bosses × 10 seeds × 2 tiers), 0 errors, 0 refusals.
- **T1 pairs and controls:** reused from the course-correction matrix
  (`reports/course-correction/matrix-boss.jsonl`, 6,000 of its fights). Not refought:
  150 sampled T1 fights (Rapier/Squire and Broadsword/Conduit+Apprentice) were refought on
  this branch and matched **bit for bit** (DPS, time, firings), because the tier-1
  resolution is unchanged by this run (`verbTierScalar(1)` = 1).
- **Base.** Every fight here ran on B's own commits (`5043dd68` + the bench), BEFORE wave-1
  A was merged in, and so does the T1 data: both tiers are on one rule set. A changes the
  Affliction and Control LEANS and caps the Empowered MOMENT; this comparison reads the
  verb's size, which A does not touch. The conductor's close-out matrix is the
  post-merge reading.
- **Not run: the T2 lane bench.** Built and smoke-tested (`compositionLanes.ts`
  `CMP_TIER=2`), stopped after 176 of 3,600 runs to free the box: a lane comparison also
  needs the T1 lanes refought on the merged base (A changed the T1 pairs it would compare
  against), about 2.5 h of 3 processes together.

## Findings

**By the verb's own share, the T2 card reads at least as large as the T1 card in 16 of 18
pairs; the two below it are within the lab's noise.** The share is the pair's uplift minus
its lean's uplift alone (per class, then the median): the half of a pair this run's
numbers move. The two below:

- Broadsword `technique×empowered` +0.8% → +0.5% (−0.3 pp): a Technique refund at the
  mechanic moment; the Technique lean alone is worth +0.0% at both tiers; T2 ≥ T1 in 2 of
  6 classes, under a point each way.
- Rapier `tempo×engagement` +1.6% → +1.2% (−0.4 pp): an echo on the first hit on each new
  body, which in a boss fight is an add (2.6 a minute); boss DPS barely sees a payload
  that lands on adds.

**The six pairs whose WHOLE uplift reads lower at T2 lose it in the LEAN, a stat this run
does not set:**

- **Rapier Tempo lean: tick quantisation** (design §24.9's open call, attack timing on the
  10 Hz tick). Alone it reads +4.0% at T1 and +0.0% at T2 (median). A probe of the swing
  interval (balanced frame, T2 kit, no stance): the Squire's Flash Rapier goes 735 → 665 ms
  with the lean (800 → 700 ms rounded, a whole tick), its Gale Needle 600 → 542 ms
  (600 → 600, nothing). In the lab the Squire's and the Conduit's Tempo lean is worth
  +12% / +13% at T1 and 0% at T2. That is all of `tempo×affliction` (−5.8 pp; the
  Affliction verb never fires for five classes on this base, so the pair IS the lean) and
  most of `tempo×engagement` (−4.2 pp). `tempo×tempo` still reads +0.3 pp because its
  verb share grows +14.2% → +15.1%.
- **Broadsword Kill-chain lean: move speed in a boss fight.** +11 → +24 move speed is worth
  +0.1% → −0.8% alone (the Conduit +3% → −1%). The three Kill-chain-lean pairs read −0.4
  to −1.9 pp as wholes while their verb share grows (+5.6 → +6.3, +0.1 → +0.5,
  +8.6 → +9.1). A farm lane ("weak on bosses", §24.9); the T4 +121 this column climbs to
  is already the designer's open call 9.

**Where T2 reads larger it is mostly the Empowered and Engagement halves.** The Empowered
lean alone +7.1% → +9.6% (attack % 0.09 → 0.104); the Engagement lean alone
+10.8% → +16.6% (flat Attack +3 → +7: the absolute column climbs ×2.2, the weapon's own
attack less); the Engagement payload (×2 → ×2.15) on the Tempo verb, verb share
+16.5% → +19.3%.

**Outlier to watch:** the Apprentice's Rapier `affliction×affliction` (the pure re-dose)
+47% → +74%: the re-dose is a share of what the class's own DoT still owes, which grows
with the T2 DoT root on top of the 1.15 size. The shape of the course-correction report's
Dagger pure-Affliction outlier (+76% on the Apprentice).

**Firing does not move with the tier** (the moment is the T1 moment): T1 → T2 fires/min
are within ±1 everywhere; the verbs that never fire at T1 on this base (the Rapier's
Affliction verb outside the Apprentice) never fire at T2 either, which is wave-1 A's job.

## Not measured here

- The amplifier row (pairs only). Its arithmetic on the composed pair is pinned by
  `lineageAmplifiers.test.ts` and `coverage.test.ts`; its +60% (`ROW_SCALAR.amplifier`) on
  a per-firing size is a designer number.
- The Hammer, Axe and Dagger T2 bands (the brief names two weapons); their 27 T2 pairs are
  pinned ≥ T1 per firing by `composition.test.ts`.

## Rerunning it after the merge (from `server/`)

```
tsx scripts/_t1BossPlan.ts --out=t2.json --matrix=composition --tier=2 --weapons=rapier,broadsword
tsx scripts/_t1BossPlan.ts --out=t2-leans.json --matrix=composition --tier=2 --leans --weapons=rapier,broadsword
tsx scripts/_t1BossPlan.ts --out=t1-leans.json --matrix=composition --tier=1 --leans --weapons=rapier,broadsword
tsx scripts/_t1BossLab.ts --plan=t2.json --out=t2.jsonl --hitboxes=<artifact> --shard=0 --shards=3   (×3; the same for the leans)
CMP_TIER=2 CMP_FILTER=-rapier-,-broadsword- LANE_SHARD=0 LANE_SHARDS=3 node --conditions=development --import tsx bench/compositionLanes.ts lanes-t2/shard0.jsonl
node --conditions=development --import tsx bench/t2CompositionReport.ts --t2boss=<T2 rows + T1-lean rows> [--t1boss=…] [--t2lanes=… --t1lanes=…]
```

## Boss lab

T2 ≥ T1 on the median in **12 of 18** pairs; below: `broadsword` technique×empowered (-0.3 pp), `broadsword` kill-chain×technique (-0.6 pp), `broadsword` kill-chain×kill-chain (-0.4 pp), `broadsword` kill-chain×empowered (-1.9 pp), `rapier` tempo×affliction (-5.8 pp), `rapier` tempo×engagement (-4.2 pp).

By the VERB's own share (pair − lean alone): T2 ≥ T1 in **16 of 18** pairs; below: `broadsword` technique×empowered (-0.3 pp), `rapier` tempo×engagement (-0.4 pp).

### Broadsword — Iron Broadsword (T1) → Knight's Steelsword (T2)

| lean × verb | payload | T1 uplift | T2 uplift | Δ | ≥ in | verb share T1 → T2 | verb ≥ in | T1 fires/min | T2 fires/min | size T1 → T2 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| technique×technique (pure) | technique-refund | +5.1% | +5.6% | +0.5 pp | 4/6 | +5.1% → +5.6% | 4/6 | 13.1 | 14.0 | 0.500 → 0.575 |
| technique×kill-chain | technique-refund | +0.0% | +0.0% | +0.0 pp | 6/6 | +0.0% → +0.0% | 6/6 | 1.2 | 1.3 | 0.333 → 0.383 |
| technique×empowered | technique-refund | +0.8% | +0.5% | -0.3 pp ⚑ | 2/6 | +0.8% → +0.5% ⚑ | 2/6 | 7.6 | 7.1 | 0.333 → 0.383 |
| kill-chain×technique | heal-and-load | +5.7% | +5.1% | -0.6 pp ⚑ | 3/6 | +5.6% → +6.3% | 3/6 | 7.6 | 8.5 | 10.0% + ×1.500 → 11.5% + ×1.575 |
| kill-chain×kill-chain (pure) | heal-and-load | +0.2% | -0.2% | -0.4 pp ⚑ | 2/6 | +0.1% → +0.5% | 3/6 | 1.4 | 1.4 | 10.0% + ×1.500 → 11.5% + ×1.575 |
| kill-chain×empowered | heal-and-load | +10.1% | +8.2% | -1.9 pp ⚑ | 2/6 | +8.6% → +9.1% | 4/6 | 7.5 | 6.9 | 10.0% + ×1.500 → 11.5% + ×1.575 |
| empowered×technique | mechanic-proxy | +14.8% | +18.1% | +3.3 pp | 6/6 | +8.0% → +9.1% | 6/6 | 7.0 | 7.4 | bonus ×1.00 → bonus ×1.15 |
| empowered×kill-chain | mechanic-proxy | +7.6% | +9.6% | +2.0 pp | 6/6 | +0.0% → +0.0% | 4/6 | 1.3 | 1.5 | bonus ×1.00 → bonus ×1.15 |
| empowered×empowered (pure) | big-hit | +17.3% | +24.6% | +7.3 pp | 6/6 | +9.7% → +14.2% | 6/6 | 6.7 | 6.7 | ×1.500 → ×1.575 |

**The leans alone** (boss lab; the lean slotted, no verb; median over classes, then per class T1 → T2):

| lean | T1 alone | T2 alone | striker | squire | slinger | spirit | apprentice | conduit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| technique | +0.0% | +0.0% | +0% → +0% | +0% → +0% | +0% → +0% | +0% → +0% | +0% → -0% | +0% → +0% |
| kill-chain | +0.1% | -0.8% | +0% → +2% | +0% → +2% | +0% → -0% | +0% → -1% | -0% → -1% | +3% → -1% |
| empowered | +7.1% | +9.6% | +8% → +9% | +6% → +10% | +7% → +8% | +7% → +10% | +4% → +10% | +8% → +12% |

<details><summary>boss lab, broadsword: per class (T1 uplift → T2 uplift; T2 wins)</summary>

| class | technique×technique | technique×kill-chain | technique×empowered | kill-chain×technique | kill-chain×kill-chain | kill-chain×empowered | empowered×technique | empowered×kill-chain | empowered×empowered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +5% → +5% (23/50) | +0% → +0% (24/50) | +2% → -0% (23/50) | +8% → +12% (43/50) | +0% → +3% (26/50) | +16% → +21% (49/50) | +22% → +26% (29/50) | +8% → +9% (23/50) | +25% → +31% (38/50) |
| squire | +5% → +7% (21/50) | -0% → +0% (21/50) | +1% → +0% (21/50) | +9% → +10% (40/50) | +0% → +2% (29/50) | +15% → +13% (40/50) | +17% → +24% (33/50) | +6% → +10% (29/50) | +21% → +25% (33/50) |
| slinger | +5% → +6% (24/50) | +0% → +0% (29/50) | +0% → +1% (26/50) | +6% → +3% (33/50) | +0% → -0% (28/50) | +0% → -0% (36/50) | +12% → +14% (34/50) | +8% → +10% (26/50) | +7% → +8% ⌀ (26/50) |
| spirit | +6% → +6% (33/50) | +0% → +0% (35/50) | +1% → +1% (33/50) | +6% → +5% (40/50) | +0% → -1% (40/50) | +9% → +10% (45/50) | +18% → +22% (37/50) | +7% → +10% (34/50) | +15% → +24% (38/50) |
| apprentice | +5% → +5% (30/50) | +0% → -0% (30/50) | -0% → +0% (30/50) | +3% → +5% (30/50) | +0% → -0% (30/50) | +1% → -1% (30/50) | +7% → +14% (30/50) | +4% → +10% (30/50) | +5% → +10% (30/50) |
| conduit | +6% → +5% (34/50) | +0% → +0% (33/50) | +6% → +5% (34/50) | +4% → -3% (40/50) | +4% → -0% (39/50) | +11% → +6% (50/50) | +10% → +14% (33/50) | +8% → +12% (33/50) | +20% → +25% (37/50) |

⌀ = the T2 verb never fired for that class.

</details>

### Rapier — Flash Rapier (T1) → Gale Needle (T2)

| lean × verb | payload | T1 uplift | T2 uplift | Δ | ≥ in | verb share T1 → T2 | verb ≥ in | T1 fires/min | T2 fires/min | size T1 → T2 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| tempo×tempo (pure) | echo-hit | +15.8% | +16.1% | +0.3 pp | 4/6 | +14.2% → +15.1% | 5/6 | 14.5 | 15.5 | 1.000 → 1.150 |
| tempo×affliction | echo-hit | +5.8% | +0.0% | -5.8 pp ⚑ | 4/6 | +0.0% → +0.0% | 5/6 | 0.0 | 0.0 | 1.000 → 1.150 |
| tempo×engagement | echo-hit | +5.7% | +1.5% | -4.2 pp ⚑ | 2/6 | +1.6% → +1.2% ⚑ | 2/6 | 2.7 | 2.6 | 1.000 → 1.150 |
| affliction×tempo | hemorrhage | +10.2% | +11.1% | +1.0 pp | 4/6 | +10.2% → +11.1% | 3/6 | 13.7 | 14.5 | 1.000 → 1.150 |
| affliction×affliction (pure) | redose | +0.0% | +0.0% | +0.0 pp | 6/6 | +0.0% → +0.0% | 6/6 | 0.0 | 0.0 | 1.000 → 1.150 |
| affliction×engagement | hemorrhage | +1.1% | +1.7% | +0.6 pp | 4/6 | +1.1% → +1.5% | 3/6 | 2.6 | 2.5 | 1.000 → 1.150 |
| engagement×tempo | big-hit | +26.9% | +36.3% | +9.4 pp | 6/6 | +16.5% → +19.3% | 6/6 | 13.4 | 14.3 | ×2.000 → ×2.150 |
| engagement×affliction | big-hit | +11.8% | +17.1% | +5.3 pp | 6/6 | +0.0% → +0.0% | 6/6 | 0.0 | 0.0 | ×2.000 → ×2.150 |
| engagement×engagement (pure) | big-hit | +11.6% | +19.1% | +7.5 pp | 6/6 | +1.3% → +2.1% | 5/6 | 2.7 | 2.7 | ×2.000 → ×2.150 |

**The leans alone** (boss lab; the lean slotted, no verb; median over classes, then per class T1 → T2):

| lean | T1 alone | T2 alone | striker | squire | slinger | spirit | apprentice | conduit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| tempo | +4.0% | +0.0% | +0% → +0% | +12% → +0% | +0% → +0% | +0% → -0% | +8% → +13% | +13% → +0% |
| affliction | +0.0% | +0.0% | +0% → +0% | +0% → +0% | +0% → +0% | +0% → +0% | +0% → +5% | +0% → -0% |
| engagement | +10.8% | +16.6% | +8% → +17% | +10% → +17% | +15% → +18% | +13% → +17% | +4% → +13% | +12% → +13% |

<details><summary>boss lab, rapier: per class (T1 uplift → T2 uplift; T2 wins)</summary>

| class | tempo×tempo | tempo×affliction | tempo×engagement | affliction×tempo | affliction×affliction | affliction×engagement | engagement×tempo | engagement×affliction | engagement×engagement |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| striker | +12% → +13% (27/50) | +0% → +0% ⌀ (23/50) | +2% → +2% (21/50) | +10% → +11% (24/50) | +0% → +0% ⌀ (23/50) | +1% → +2% (21/50) | +24% → +35% (33/50) | +8% → +17% ⌀ (32/50) | +11% → +25% (31/50) |
| squire | +26% → +16% (30/50) | +12% → +0% ⌀ (29/50) | +13% → +2% (30/50) | +11% → +14% (31/50) | +0% → +0% ⌀ (29/50) | +2% → +2% (30/50) | +27% → +37% (34/50) | +10% → +17% ⌀ (30/50) | +11% → +18% (30/50) |
| slinger | +15% → +18% (33/50) | +0% → +0% ⌀ (26/50) | +1% → +1% (25/50) | +10% → +11% (30/50) | +0% → +0% ⌀ (26/50) | +1% → +1% (25/50) | +32% → +40% (46/50) | +15% → +18% ⌀ (32/50) | +16% → +20% (32/50) |
| spirit | +14% → +15% (44/50) | +0% → +0% ⌀ (38/50) | +2% → +1% (39/50) | +12% → +11% (45/50) | +0% → +0% ⌀ (38/50) | +2% → +1% (39/50) | +34% → +38% (44/50) | +13% → +17% ⌀ (44/50) | +15% → +20% (43/50) |
| apprentice | +16% → +21% (30/50) | +15% → +19% (30/50) | +9% → +13% (30/50) | +7% → +11% (30/50) | +47% → +74% (37/50) | +1% → +6% (30/50) | +13% → +23% (30/50) | +12% → +21% (30/50) | +7% → +14% (30/50) |
| conduit | +31% → +17% (36/50) | +13% → +0% ⌀ (31/50) | +13% → +0% (31/50) | +5% → +4% (31/50) | +0% → -0% ⌀ (31/50) | +1% → +1% (31/50) | +26% → +31% (37/50) | +12% → +13% ⌀ (35/50) | +12% → +13% (35/50) |

⌀ = the T2 verb never fired for that class.

</details>

T2 purchases refused: none — every T2 pair bought and slotted both cards.

## The per-firing numbers (by construction)

Every T2 payload is its T1 payload with its size × `verbTierScalar(2)` = 1.15 on the same moment (`composition.test.ts` pins every one of the 45 T2 pairs).

