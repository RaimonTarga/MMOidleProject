# Idle MMO — Economy Philosophy (XP · Essence Rewards · Crafting Cost)

**Purpose:** the reasoning behind the three coupled knobs — XP curve, essence
drops, crafting cost. Paste into a balance session to re-establish intent.
Terse on purpose.

---

## 0. The core tension (read first)

- **Biome level unlocks the *chance* for power; essence *pays* for it.** These two must stay in tension, never both trivially solved.
- Concretely: you should reach a tier's level cap **before** you can afford to max its gear. Capping the biome is the easy part; affording full +3 is the grind that outlives the cap.
- The problem this fixes: essence was over-plentiful (full +3 reachable before cap) while XP felt slow. Goal is to flip both — capping easier, maxing costlier.

---

## 1. XP curve

- The live model is tier-segment-local: `biomeXpForLevel(n)` is the cumulative
  reference threshold for a T1-starting biome, while
  `biomeXpForBiomeLevel(group, n)` subtracts the group's start-tier offset.
- Every tier segment has six levels. Their incremental shares are
  **12% / 14% / 16% / 18% / 19% / 21%**. The final two levels are slower, but
  they do not consume an extreme share of the segment.
- Segment budgets are explicit designer values: **T1 1,750 · T2 5,000 · T3
  7,000 · T4 9,000 XP**. Segments beyond T4 currently grow by **1.20× per tier**
  until they receive explicit tuning.
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
- Initial pacing targets are **T1 ~5 minutes**, **T2 ~10–12**, **T3 ~13–16**,
  and **T4 ~16–20 minutes** of pure mastery per biome. Bosses, gear farming,
  crafting, travel, deaths, and build experimentation add completion time.

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
- **Target at the level cap:** full set craftable + roughly +1 across the board (boss-ready). Full +3 requires grinding past the cap.
- **Upgrade curves must be smooth** — step-to-step ratio ≈ 1.8-2.2×. No lumpy ramps (a cheap middle step wedged between two expensive ones).
- **Base cost scales ~2.2-2.4× per slot per tier.** Watch boots specifically — easy to forget to scale; keep boots ≈ 0.8× the weapon's base at every tier.

---

## 4. Hybrid (cross-biome) costs

- **T1-T2 are pure. Hybrid begins at T3, on armor & charms only — weapons and boots stay pure** (weapons don't drift mechanic; boots are utility). Cross-pollination is a later-game feature, not an early one.
- The splash color = **the color of the mechanic the piece borrows.** Read the cost, see the cross — the recipe documents its own identity.
- **Split 75% home / 25% splash — on base AND upgrades, not base-only.** Base-only splash is ~2% of an item's lifetime cost (a rounding error, no opportunity cost). Splitting the upgrades pushes the splash to ~24% of total and keeps the second biome relevant the entire time you improve the piece.
- Ratio guidance: keep splash ≤ ~33% for a single cross (the home color must stay dominant). A capstone borrowing two mechanics can scale toward e.g. 60/20/20.
- Emergent benefit: the cross-tax scales with upgrade investment — a player who stops at +1 barely feels it; a completionist at +3 feels it most. The friction lands exactly on the people chasing the ceiling.
- Authoring tip: make upgrade values divisible by 4 so the 75/25 split stays clean integers.
