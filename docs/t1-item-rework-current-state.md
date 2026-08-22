# T1 Item Rework — Current State

Design authority: [`design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md`](../design_docs/T1_ITEM_DESIGN_PHILOSOPHY.md)
(what each item is *for* — locked) and
[`design_docs/T1_ITEM_NUMERICAL_BASELINE.md`](../design_docs/T1_ITEM_NUMERICAL_BASELINE.md)
(the first numerical proposal — volatile, expected to move).

**Status:** shipped. The whole Clearing + T1 cast is in, plus the mechanic and
numeric rescale of the T2–T4 items in those five lineages.

**This was NOT a balance pass.** Every number here is a coherent starting point
for the balance tools, nothing more. If a number is wrong, move the number.

---

## 1. What shipped

### Engine (four changes)

| Change | Where |
|---|---|
| `mobility.slow-resistance` — reduces the **magnitude** of soft move slows | `mobilityBoots.ts` `slowResistedMult`, read by `movement.ts` + `buffSync.ts` |
| `mobility.approach-speed-pct` — continuous gap closing, replacing the acquire proc | `mobilityBoots.ts` `isClosingOnTarget` / `bootSpeedMultiplier` |
| `UpgradeStep.attacksPerSecond` — upgrade steps may buy cadence | `items.ts`, `itemUpgrades.ts`, `stats.ts`, client display |
| Clearing gear is fixed-power (`upgrades: []`) | `clearing.recipes.ts` |

Everything else the baseline asked for already existed and only needed authoring:
`technique.cooldown-reduction-pct`, `guard.potency-pct`,
`defense.recovery-skill-potency`, `defense.barrier-pct`, `defense.absorb-pct`,
`defense.dot-resistance`, and the whole Recovery-fraction engine
(`defense.recovery-{active,pulse,on-kill}-*`).

### Data

- Clearing (4 items) and the full T1 cast (20 items) are **verbatim from the
  numerical baseline doc**.
- T2–T4 of the five lineages (~40 items) had their mechanic identities
  propagated and their numbers re-derived. See §3.

---

## 2. The mechanics that moved

Eight lineages changed identity at T1. Every one was carried up its own lineage
so no biome contradicts itself across tiers.

| Lineage | Was | Now |
|---|---|---|
| Plains weapon | plain attack stat | + `technique.cooldown-reduction-pct` |
| Plains charm | on-kill Recovery + `guard.potency-pct` | on-kill Recovery only (the Guard rider moved to Mountain armor, where the identity lives) |
| Plains boots | `mobility.ooc-speed-pct` | `mobility.kill-speed-pct` |
| Forest charm | `guard.cooldown-reduction-pct` + `guard.recovery-on-fire-pct` | raw Recovery + `defense.recovery-skill-potency` |
| Forest boots | `mobility.kill-speed-pct` | `mobility.ooc-speed-pct` |
| Swamp charm | `defense.absorb-pct` | `defense.recovery-pulse-pct` (8s / 4s) |
| Swamp boots | `mobility.tenacity-pct` | `mobility.slow-resistance` |
| Mountain armor | `defense.max-hit-*` damage cap | `guard.potency-pct` |
| Mountain boots | acquire proc | `mobility.approach-speed-pct` |
| Cave charm | `defense.recovery-pulse-pct` | `defense.absorb-pct` |

Two deliberate re-homings worth remembering:

- **Swamp ↔ Cave charms swapped.** Swamp's threat is DoT, and absorb does nothing
  against DoT; a periodic Recovery pulse answers health loss regardless of source.
  Cave took the Absorb hook (philosophy §11.5, §13).
- **Plains ↔ Forest boots swapped.** Plains is the dense chain-farming biome, so
  it owns kill momentum; Forest owns straightforward traversal.

### Mountain's damage cap was relocated, not deleted

Philosophy §8.4 removes `defense.max-hit-*` from T1 (T1 has no hits large enough
for a clamp to be a real defence) and explicitly reserves it as a later-tier
mechanic. It is therefore **absent at T1/T2 and present at T3/T4** — the plate
learns to cap the biggest hits once the game actually throws them. Do not read
its absence at T1 as the mechanic being retired.

### `mobility.acquire-*` is gone

The three acquire keys, their labels, their `updateMobilityState` bookkeeping and
their `LAST_TARGET`/`ACQUIRE_CD` scratch keys were deleted; nothing else authored
them. The `mob-burst` **buff id was kept** so the generated icon survives — the
concept (lunging at a target) is unchanged, only the trigger shape.

### Slow Resistance vs Tenacity

Two different stats, deliberately:

- **`mobility.slow-resistance`** — soft-slow MAGNITUDE. `50%` slow at `30%`
  resistance is a `35%` slow. Capped at 90%. **A root (mult 0) passes through
  untouched** — a root is hard control, not a slow.
- **`mobility.tenacity-pct`** — hard-CC DURATION. Still used by Graveyard and
  Trench boots; untouched.

`slowResistedMult` is called from both `playerSpeedMults` and every buff
descriptor that publishes a `speedMult`, so the client's own-player extrapolation
keeps matching the server. **If you add a new slow source, pipe it through that
one helper** or the two will silently diverge.

---

## 3. How T2–T4 numbers were derived

The baseline doc covers T1 only and deliberately does not lock a tier-handoff
multiplier. The one used here is a **decision made during implementation**, not
something the design docs mandate:

> **1.8× per tier on the +0 budget** — so a new tier's +0 is ~120% of the
> previous tier's +5. Fully upgrading still felt worth it; the new tier is still
> clearly a step up.

Applied as:

- **Raw magnitude** (`attack`, `maxHp`, `plating`, `recovery`, `speed`) — `+0`
  steps ×1.8 per tier, and spans 100%→150% across `+0…+5`.
- **Boot `speed`** — same ×1.8 at `+0`, but spans only ~100%→128%, matching the
  shape the baseline doc itself uses at T1: the conditional movement mechanic
  carries the rest of the boot's budget.
- **Percentage mechanics** (evasion, DR, DoT resist, potency, CDR, barrier,
  absorb, stealth, slow resist, boot bonuses) — **do not compound at 1.8×.**
  Their marginal value rises nonlinearly, so they climb a hand-authored,
  decelerating ladder. 16% evasion × 3.24 would be 52%; that is not a tier step,
  that is a different game.
- **`attacksPerSecond`** — lineage identity, not budget. Carried, never scaled.
  Attack is what pays for the tier.

Costs, catalysts, biome levels and evolution wiring were **not touched** — the
economy is its own pass (baseline §17).

---

## 4. Known gaps and things to watch

- **Cross-biome T3/T4 consistency.** Only the five T1-biome lineages were
  rescaled. Tundra / Volcanic / Desert / Jungle / Graveyard / Trench keep their
  old numbers, so a T4 comparison across biomes is apples-to-oranges. (The
  pre-existing spread there was already wide — T4 boots ranged 30–134 speed
  before this pass — so nothing new was broken, but nothing was fixed either.)
- **Barrier recharge delay stays at `GAME_CONFIG.BARRIER_DELAY_MS = 4000`.** The
  baseline doc proposes 3.0s; that was deliberately not applied, to keep the
  Barrier tuning pass in one place.
- **Recovery values on charms are fractional** (`1.0`, `1.5`, `2.5`). The stat and
  its display handle this, but it is worth knowing before comparing tables.
- **Two `+5` steps move only HP**, not their percentage stat (Cave's Dire Bestial
  Hide and Deepscale Hide). Real upgrades, just flat on one axis.
- The baseline doc's own watchpoint list (§16) is still the right place to start
  the balance pass — particularly the **Flash Rapier** (raw-throughput leader that
  compounds with every attack-count mechanic) and the **Poison Dagger**'s combined
  direct + DoT budget.

---

## 5. Verification

- `pnpm typecheck` clean (4 packages + bench).
- `pnpm test` — 86/86.
- New: `server/test/mobilityBoots.test.ts` — wiring smoke test for all four
  engine changes. Every expectation is derived from what the items actually
  author, so the balance pass can move any number without touching it.
- `pnpm dps:report` and `pnpm ehp:report` run clean on the new cast; both
  artifacts under `reports/` were regenerated.
