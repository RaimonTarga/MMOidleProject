# Slam's tier-up step at T2 (design §22.13, measurement 1)

A measurement for the designer; nothing moved. Branch `feat/ap-measure` off
`feat/ability-pass-calls-2` (`12d2b1f1`, = develop `398e3f49` + design §22.13). Commands:
README §10.

- **Kit:** the T2 composition matrix's no-card control rows
  (`_t1BossPlan.ts --matrix=composition --tier=2 --seeds=10`): the tutorial boss kit one
  tier up (each slot's same-biome T2 form, the class's tutorial Guard and `final` runes, no
  lineage cards, `upgrade: 0`, seeded approach geometry), on each of the five T2 weapon
  forms (Gale Needle 1.7 aps, Mirebrand 1.0, Steelsword 1.0, Ruinous Axe 1.2, Quake Hammer
  0.55), against the five T2 bosses, 10 seeds. Six classes × five weapons × five bosses ×
  10 seeds = 1,500 fights per arm. Only the Technique column changes between arms.
- **Arms:** `sweep` (the control: the same kit wearing Sweep); `slam` as authored (a tier-2
  character casts rank II: 2.45× on 1.6 s); `slam600` (rank II on a 600 ms wind-up, `ap`
  castMs 600); `slam120x600` (rank I's shape carried to T2: 1.2× on 600 ms). The `ap`
  override writes into every rank; only rank II fights at T2.
- **Run:** 6,000 fights, 0 error rows, 925 s at 6 shards (concurrently with measurement 2).
  Files: `plan-measure-slam-t2.json`, `measure-slam-t2.jsonl`; every weapon × class × boss
  cell in `measure-slam-t2-cells.md`.
- **Resolution:** a class × boss cell is 50 fights (±~14 points on a win rate near 50%); a
  class row is 250. The arms fight the same seeds and spawns, so dps deltas are paired.
- Sweep pays only through its cleave (a second body in reach), so against a lone boss the
  control is close to "no Technique".


### The step per class (pooled over the five bosses, five weapons and 10 seeds; Δ against the column to its left)

| class | 1.2× / 600 ms dps | 2.45× / 1.6 s dps | step Δ | step Δwin (pt) | 2.45× / 600 ms dps | Δ vs 1.6 s | Δwin (pt) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Striker | 72.5 | 71.4 | −1.5% | −6 | 81.2 | +13.8% | +7 |
| Squire | 68.0 | 69.6 | +2.4% | +3 | 77.7 | +11.6% | +10 |
| Slinger | 81.2 | 78.8 | −3.0% | 0 | 89.6 | +13.6% | +2 |
| Spirit | 83.5 | 84.4 | +1.0% | 0 | 94.4 | +11.9% | +4 |
| Apprentice | 90.6 | 91.5 | +1.0% | +4 | 101.4 | +10.9% | 0 |
| Conduit | 67.9 | 74.5 | +9.7% | +2 | 78.7 | +5.7% | +1 |
| all six | 77.3 | 78.4 | +1.4% | 0 | 87.2 | +11.2% | +4 |

### Per class × boss (pooled over the five weapons × 10 seeds)

| class | boss | n | Sweep dps | win | Slam dps | Δ | win | Slam 600 ms dps | Δ | win | 1.2× / 600 ms dps | Δ | win |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Striker | gorging-razortusk | 50 | 93.7 | 100% | 95.3 | +1.7% | 100% | 104.9 | +11.9% | 100% | 94.0 | +0.3% | 100% |
| Striker | apex-timberclaw | 50 | 123.4 | 100% | 122.3 | −0.9% | 100% | 136.2 | +10.4% | 100% | 123.7 | +0.2% | 100% |
| Striker | mire-gorged-behemoth | 50 | 24.9 | 56% | 22.4 | −10.0% | 32% | 28.5 | +14.5% | 72% | 25.2 | +1.5% | 44% |
| Striker | stoneplate-juggernaut | 50 | 65.8 | 36% | 68.3 | +3.8% | 34% | 76.6 | +16.4% | 24% | 67.0 | +1.8% | 34% |
| Striker | chitinous-dreadbore | 50 | 52.0 | 40% | 48.6 | −6.5% | 22% | 60.0 | +15.5% | 28% | 52.5 | +1.0% | 40% |
| Squire | gorging-razortusk | 50 | 79.3 | 100% | 83.1 | +4.8% | 100% | 90.2 | +13.6% | 100% | 80.2 | +1.1% | 100% |
| Squire | apex-timberclaw | 50 | 104.9 | 100% | 110.0 | +4.8% | 100% | 122.0 | +16.3% | 100% | 109.2 | +4.2% | 100% |
| Squire | mire-gorged-behemoth | 50 | 33.5 | 38% | 36.2 | +8.0% | 28% | 42.3 | +26.3% | 44% | 36.3 | +8.5% | 38% |
| Squire | stoneplate-juggernaut | 50 | 58.5 | 46% | 67.8 | +16.0% | 70% | 71.8 | +22.7% | 100% | 63.6 | +8.8% | 44% |
| Squire | chitinous-dreadbore | 50 | 46.1 | 20% | 51.0 | +10.5% | 20% | 62.1 | +34.6% | 22% | 50.7 | +9.8% | 20% |
| Slinger | gorging-razortusk | 50 | 71.3 | 100% | 73.2 | +2.7% | 100% | 80.1 | +12.4% | 100% | 73.0 | +2.4% | 100% |
| Slinger | apex-timberclaw | 50 | 116.8 | 100% | 116.6 | −0.2% | 100% | 129.6 | +11.0% | 100% | 119.3 | +2.1% | 100% |
| Slinger | mire-gorged-behemoth | 50 | 65.5 | 72% | 64.1 | −2.2% | 74% | 76.5 | +16.7% | 76% | 69.5 | +6.0% | 72% |
| Slinger | stoneplate-juggernaut | 50 | 72.9 | 28% | 74.1 | +1.6% | 48% | 81.3 | +11.5% | 44% | 72.4 | −0.7% | 46% |
| Slinger | chitinous-dreadbore | 50 | 69.3 | 38% | 66.2 | −4.4% | 34% | 80.3 | +15.9% | 46% | 72.1 | +4.0% | 40% |
| Spirit | gorging-razortusk | 50 | 77.8 | 100% | 78.1 | +0.4% | 100% | 87.8 | +12.8% | 100% | 77.8 | −0.1% | 100% |
| Spirit | apex-timberclaw | 50 | 123.8 | 100% | 126.8 | +2.4% | 100% | 139.7 | +12.8% | 100% | 126.5 | +2.2% | 100% |
| Spirit | mire-gorged-behemoth | 50 | 70.7 | 64% | 70.2 | −0.6% | 56% | 81.2 | +14.9% | 76% | 71.4 | +1.0% | 62% |
| Spirit | stoneplate-juggernaut | 50 | 72.3 | 94% | 76.5 | +5.8% | 100% | 82.1 | +13.7% | 100% | 71.8 | −0.6% | 100% |
| Spirit | chitinous-dreadbore | 50 | 69.6 | 34% | 70.3 | +1.0% | 34% | 81.2 | +16.8% | 36% | 70.1 | +0.8% | 28% |
| Apprentice | gorging-razortusk | 50 | 78.0 | 100% | 83.1 | +6.6% | 100% | 90.7 | +16.3% | 100% | 80.8 | +3.6% | 100% |
| Apprentice | apex-timberclaw | 50 | 120.5 | 100% | 128.9 | +7.0% | 100% | 139.7 | +16.0% | 100% | 126.6 | +5.1% | 100% |
| Apprentice | mire-gorged-behemoth | 50 | 68.3 | 100% | 74.6 | +9.3% | 100% | 83.6 | +22.5% | 100% | 76.1 | +11.5% | 100% |
| Apprentice | stoneplate-juggernaut | 50 | 83.9 | 20% | 94.3 | +12.4% | 36% | 101.8 | +21.3% | 40% | 89.4 | +6.6% | 20% |
| Apprentice | chitinous-dreadbore | 50 | 77.6 | 20% | 76.5 | −1.4% | 26% | 91.4 | +17.8% | 20% | 80.0 | +3.1% | 20% |
| Conduit | gorging-razortusk | 50 | 53.1 | 100% | 66.8 | +25.9% | 100% | 71.6 | +34.8% | 100% | 59.8 | +12.6% | 100% |
| Conduit | apex-timberclaw | 50 | 93.9 | 100% | 111.9 | +19.2% | 100% | 116.6 | +24.2% | 100% | 104.1 | +10.9% | 100% |
| Conduit | mire-gorged-behemoth | 50 | 56.1 | 66% | 69.7 | +24.2% | 84% | 73.7 | +31.3% | 88% | 63.9 | +14.0% | 80% |
| Conduit | stoneplate-juggernaut | 50 | 47.3 | 82% | 60.4 | +27.9% | 94% | 65.6 | +38.9% | 96% | 54.7 | +15.7% | 92% |
| Conduit | chitinous-dreadbore | 50 | 50.5 | 40% | 63.6 | +25.9% | 42% | 66.3 | +31.4% | 40% | 57.1 | +13.2% | 40% |

### Per class (pooled over the five bosses, five weapons and 10 seeds)

| class | n | Sweep dps | win | Slam dps | Δ | win | Slam 600 ms dps | Δ | win | 1.2× / 600 ms dps | Δ | win |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Striker | 250 | 72.0 | 66% | 71.4 | −0.8% | 58% | 81.2 | +12.9% | 65% | 72.5 | +0.7% | 64% |
| Squire | 250 | 64.5 | 61% | 69.6 | +8.0% | 64% | 77.7 | +20.5% | 73% | 68.0 | +5.5% | 60% |
| Slinger | 250 | 79.1 | 68% | 78.8 | −0.4% | 71% | 89.6 | +13.1% | 73% | 81.2 | +2.6% | 72% |
| Spirit | 250 | 82.8 | 78% | 84.4 | +1.9% | 78% | 94.4 | +14.0% | 82% | 83.5 | +0.8% | 78% |
| Apprentice | 250 | 85.6 | 68% | 91.5 | +6.8% | 72% | 101.4 | +18.4% | 72% | 90.6 | +5.7% | 68% |
| Conduit | 250 | 60.2 | 78% | 74.5 | +23.8% | 84% | 78.7 | +30.9% | 85% | 67.9 | +12.9% | 82% |

### Per weapon (pooled over the six classes, five bosses and 10 seeds)

| weapon | n | Sweep dps | win | Slam dps | Δ | win | Slam 600 ms dps | Δ | win | 1.2× / 600 ms dps | Δ | win |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| axe | 300 | 74.4 | 57% | 77.9 | +4.6% | 61% | 86.4 | +16.0% | 65% | 77.5 | +4.1% | 57% |
| broadsword | 300 | 66.8 | 54% | 77.3 | +15.7% | 60% | 87.2 | +30.6% | 63% | 73.5 | +10.1% | 56% |
| dagger | 300 | 79.9 | 99% | 81.7 | +2.2% | 96% | 91.2 | +14.2% | 100% | 82.1 | +2.7% | 99% |
| hammer | 300 | 73.7 | 83% | 81.9 | +11.1% | 80% | 90.1 | +22.2% | 86% | 78.3 | +6.3% | 84% |
| rapier | 300 | 75.3 | 56% | 73.0 | −3.0% | 58% | 81.0 | +7.5% | 61% | 75.0 | −0.4% | 57% |

### Per boss (pooled over the six classes, five weapons and 10 seeds)

| boss | n | Sweep dps | win | Slam dps | Δ | win | Slam 600 ms dps | Δ | win | 1.2× / 600 ms dps | Δ | win |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gorging-razortusk | 300 | 75.5 | 100% | 79.9 | +5.8% | 100% | 87.5 | +15.9% | 100% | 77.6 | +2.7% | 100% |
| apex-timberclaw | 300 | 113.9 | 100% | 119.4 | +4.8% | 100% | 130.6 | +14.7% | 100% | 118.2 | +3.8% | 100% |
| mire-gorged-behemoth | 300 | 53.2 | 66% | 56.2 | +5.7% | 62% | 64.3 | +21.0% | 76% | 57.1 | +7.4% | 66% |
| stoneplate-juggernaut | 300 | 66.8 | 51% | 73.6 | +10.2% | 64% | 79.9 | +19.6% | 67% | 69.8 | +4.6% | 56% |
| chitinous-dreadbore | 300 | 60.8 | 32% | 62.7 | +3.1% | 30% | 73.5 | +20.9% | 32% | 63.7 | +4.8% | 31% |

### Everything

| all | n | Sweep dps | win | Slam dps | Δ | win | Slam 600 ms dps | Δ | win | 1.2× / 600 ms dps | Δ | win |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| all six classes | 1500 | 74.0 | 70% | 78.4 | +5.8% | 71% | 87.2 | +17.7% | 75% | 77.3 | +4.4% | 71% |
## What this says

1. **Rank II as authored is worth little over Sweep at T2 for the fast attackers.**
   Pooled, Slam adds +5.8% dps over the Sweep control. Per class it adds −0.8% for the
   Striker, −0.4% for the Slinger and +1.9% for the Spirit, against +6.8% for the
   Apprentice, +8.0% for the Squire and +23.8% for the Conduit. The 1.6 s wind-up eats the
   2.45× hit for every class that stops swinging to cast. The Conduit casts while its
   summons keep hitting, so it keeps the whole hit.
2. **The step is nearly flat in dps, except for the Conduit.** Rank I's shape at T2
   (1.2× on 600 ms) against rank II as authored (2.45× on 1.6 s): Striker −1.5%, Slinger
   −3.0%, Spirit +1.0%, Apprentice +1.0%, Squire +2.4%, Conduit +9.7%; pooled +1.4%. The
   doubled multiplier is paid back almost exactly by the extra second of wind-up. For the
   Striker and Slinger, the tier-up is a small dps loss against keeping rank I's shape.
3. **A 600 ms rank II lifts every class and narrows the spread.** Against the authored
   rank II it adds +10.9% to +13.8% for five classes and +5.7% for the Conduit (pooled
   +11.2%). Against Sweep the class spread is: authored −0.8% to +23.8% (25 points);
   600 ms +12.9% to +30.9% (18 points); 1.2×/600 ms +0.7% to +12.9% (12 points).
4. **Cadence decides it.** Authored rank II against Sweep, per weapon: Gale Needle (1.7
   aps) −3.0%, Mirebrand +2.2%, Ruinous Axe +4.6%, Quake Hammer +11.1%, Steelsword +15.7%.
   On the tutorial weapons (the Axe for five classes, the Dagger for the Slinger), the
   authored rank II gives the Striker −1.8%, Spirit −1.2%, Slinger −4.9%, Squire +5.5%,
   Apprentice +8.3% and Conduit +21.6% (`measure-slam-t2-cells.md`).
5. **Wins barely move in the pool** (70% Sweep, 71% authored, 75% at 600 ms, 71% at
   1.2×/600 ms). The largest cell moves are near the noise floor of a 50-fight cell: the
   Squire's Stoneplate Juggernaut goes 46% → 70% (authored) → 100% (600 ms); the
   Striker's Mire-Gorged Behemoth goes 56% → 32% (authored) → 72% (600 ms), and its
   Chitinous Dreadbore 40% → 22% (authored).
