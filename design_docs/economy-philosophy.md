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

- `biomeXpForLevel(n) = round(BIOME_XP_BASE × n^2.8)` — cumulative threshold.
- **BIOME_XP_BASE = 25**, exponent **2.8**.
- **Caps: T1→L4, T2→L8, T3→L12, T4→L16** (each tier = +4 levels). Biomes debuting at T2+ use the same *absolute* thresholds — a T2-debut biome's "level 1" is global level 5.
- Phase XP (base 25): **T1 1,213 · T2 +7,232 · T3 +17,836 · T4 +32,532**. Ratio ≈ **1 : 6 : 21 : 48** — each tier is deliberately longer than the last.
- Timing targets (time to a full gear set): **T1 5-10 min, T2 15-20 min**, growing every tier.
- **Tune the whole curve via BIOME_XP_BASE, never by editing per-mob XP.** Lowering the base speeds up every tier uniformly; per-mob edits cause drift.

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
