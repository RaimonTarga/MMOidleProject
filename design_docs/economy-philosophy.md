# Idle MMO — Economy Philosophy (XP · Essence Rewards · Crafting Cost)

**Purpose:** the reasoning behind the three coupled knobs — XP curve, essence
drops, crafting cost. Paste into a balance session to re-establish intent.
Terse on purpose.

---

## 0. The core tension (read first)

- **Biome level unlocks the *chance* for power; essence *pays* for it.** These two must stay in tension, never both trivially solved.
- Updated user goal (2026-09-25): by a biome's current-tier mastery cap, the
  player should have earned roughly enough essence for a full **+3 gear set**.
  Farming through **+5** should take roughly **50% additional time**. These
  are affordability goals; Global Mastery, catalyst families and cross-color
  costs can separately gate purchases.
- The older goal of +3 requiring a grind after mastery is superseded. Concrete
  joint tuning candidates are in the [reward proposal](../reports/reward-mastery-study-2026-09-25/PROPOSAL.md);
  their working definition includes acquisition/evolution plus upgrades for
  one weapon, armor, recovery and mobility item. No candidate is applied yet.

---

## 1. XP curve

- The live model is tier-segment-local: `biomeXpForLevel(n)` is the cumulative
  reference threshold for a T1-starting biome, while
  `biomeXpForBiomeLevel(group, n)` subtracts the group's start-tier offset.
- Every tier segment has six levels. Their incremental shares are
  **12% / 14% / 16% / 18% / 19% / 21%**. The final two levels are slower, but
  they do not consume an extreme share of the segment.
- Segment budgets are explicit designer values: **T1 1,750 · T2 3,750 · T3
  42,000 · T4 600,000 XP** (first-pass pacing, 2026-09-25; previously
  1,750 / 5,000 / 7,000 / 9,000). Segments beyond T4 grow by **1.20× per tier**
  from 600,000 until they receive explicit tuning. The future tiers are not calibrated.
- **Caps: T1→L6, T2→L12, T3→L18, T4→L24** for a biome that starts in T1;
  biomes debuting later keep their existing start-tier offsets and final-tier
  caps. Clearing remains fixed at level 4 and is excluded from Global Mastery.
- Clearing is a tutorial exception rather than a normal T1 segment: its explicit
  thresholds are **0 / 43 / 172 / 430 / 860 XP**, aligned to approximately
  **1 / 4 / 10 / 20 Tiny Wisp kills** using the unchanged 43-XP reward. The
  10-kill First Blood quest lands at Clearing level 3, leaving a short tail to
  the level-4 cap.
- The per-tier XP reward multipliers remain unchanged. Tune required XP through
  the segment budget and local-share tables, not by editing per-mob rewards.
- A per-biome mastery XP multiplier (`BIOME_XP_MULT_BY_TIER_AND_BIOME`) evens out
  biomes whose kill throughput differs a lot within a tier. Since 2026-09-26 it
  is calibrated for every T2–T4 biome except T3 Volcanic; a biome already on
  target has no entry (T2 ×0.35–0.75, T3 ×0.6–1.4,
  T4 ×1.8–3.4; values in `gameConfig.ts`). Factors below 1 slow a fast biome
  without raising the tier budget, so earlier-tier nodes never become a faster
  route into a later segment. It affects mastery XP only: essence and
  catalyst payouts ignore it. Use it for biome-wide throughput gaps, not to speed up
  one slow class or build.
- Updated user pacing targets (2026-09-25) are **T1 ~5 minutes**, **T2 ~15**,
  **T3 ~30**, and **T4 ~60 minutes** per biome tier segment. These supersede
  the initial 5 / 10–12 / 13–16 / 16–20-minute targets. At T4, fast builds should
  take about 50 minutes and slow viable builds about 90. Slow defensive setups
  (Defensive-stance Squire, Recover-First Conduit) may take longer; switching to
  an offensive farming setup is an accepted answer for now.
- The first-pass budgets were measured with bots on T2 Desert, T3 Swamp/Tundra
  and T4 Tundra/Desert. The 2026-09-26 [all-biome sweep](../reports/reward-mastery-study-2026-09-25/xp-sweep-2026-09-26/RESULTS.md)
  calibrated the per-biome factors on every T2–T4 biome with a node/seed holdout.
  T3 Volcanic is uncalibrated because bots die there before pacing is measurable. Recalibrate after the defense, Conduit and T4 class passes change
  throughput. The [reward study](../reports/reward-mastery-study-2026-09-25/README.md)
  uses active time in the biome as its working clock and records the remaining
  measurement assumptions and telemetry limitations.

---

## 2. Essence rewards (supply side)

- **One rule: `essence = round(0.16 × biomeXp)` for every mob, every biome.**
- Consequence: since the level cap is an XP threshold and the ratio is constant, **every biome yields roughly the same essence by cap** (~195 at T1). No biome is a farming trap or a goldmine; pick a biome for its *fight*, not its payout.
- **Drops are always pure — one color per biome, never mixed.** All cross-biome pressure belongs on the *cost* side. Pure supply keeps "need blue → go to the cap biome" legible and protects the conversion valve.
- **Color follows the mechanic-family, not the individual biome.** When a biome retires, its color is re-housed in whichever successor inherits its mechanic. This keeps the palette at 5 forever:
  - green = evasion (Forest → Jungle → …)
  - blue = damage-cap (Mountain → Tundra → …)
  - red = %DR (Cave → Volcanic → …)
  - yellow = plating / utility (Plains → Desert → …)
  - purple = DoT (Swamp → …)

---

## 3. Crafting cost (demand side)

- **Base craft cost stays accessible; upgrade cost is the real gate.** A new item should be affordable shortly after its level unlocks; maxing it should not.
- **Upgrade-cost multipliers by slot:** weapon ×3 · armor ×3 · charm ×1.5 · boots ×1. Cost hierarchy: **weapon / armor > charm > boots**.
  - *Charm ×1.5 (not ×3):* its upgrades buy small % mechanic bumps, not raw stats — a ×3 would overprice the value delivered.
  - *Boots ×1:* premium *utility* slot, cheapest by design — cheap to enter, cheap to max, low ceiling.
  - *Armor may run above weapon* where its mitigation is generic (e.g. flat %DR works vs every damage shape). Flexibility earns a premium.
- **Target at the level cap:** enough earned essence for a full +3 set;
  full +5 funding at roughly 1.5× that farming time, under the revised user goal.
- The old 1.8–2.2× step-price growth is under review: current escalating costs
  imply a much longer +3→+5 tail. The linked proposal compares redistributing
  lifetime cost against reducing the tail and currency supply.
- **Base cost scales ~2.2-2.4× per slot per tier.** Watch boots specifically — easy to forget to scale; keep boots ≈ 0.8× the weapon's base at every tier.

---

## 4. Hybrid (cross-biome) costs

- **T1-T2 are pure. Hybrid begins at T3, on armor & charms only — weapons and boots stay pure** (weapons don't drift mechanic; boots are utility). Cross-pollination is a later-game feature, not an early one.
- The splash color = **the color of the mechanic the piece borrows.** Read the cost, see the cross — the recipe documents its own identity.
- **Split 75% home / 25% splash — on base AND upgrades, not base-only.** Base-only splash is ~2% of an item's lifetime cost (a rounding error, no opportunity cost). Splitting the upgrades pushes the splash to ~24% of total and keeps the second biome relevant the entire time you improve the piece.
- Ratio guidance: keep splash ≤ ~33% for a single cross (the home color must stay dominant). A capstone borrowing two mechanics can scale toward e.g. 60/20/20.
- Emergent benefit: the cross-tax scales with upgrade investment — a player who stops at +1 barely feels it; a completionist at +3 feels it most. The friction lands exactly on the people chasing the ceiling.
- Authoring tip: make upgrade values divisible by 4 so the 75/25 split stays clean integers.
