# Weapon Lineage Trees — Current State

**Audited:** 2026-10-01 (progression rework Phase 1a/1b, plus the Phase 2b economy
removal that made weapons depend on this system exclusively).

**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md)
§2–§9. **Plan:** [`docs/progression-rework-plan.md`](progression-rework-plan.md) §1,
§2.3. This page is the living truth for what the lineage tree actually does today;
read the code (`shared/src/data/lineages/`, `shared/src/systems/lineages.ts`) where
this page and the plan disagree.

The weapon slot no longer holds an item with a `+N` ladder — it holds a **lineage**,
a small tree of permanent card purchases plus a chain of "forms" (the actual
equipped item, still an ordinary `RECIPE_DATABASE`/`ITEM_DATABASE` entry). This is
the sole acquisition path for weapon power since Phase 2b deleted the old
evolve/upgrade/reconstruct route for the weapon slot (see the archived
[`gear-evolution-current-state.md`](archive/gear-evolution-current-state.md)).

## 1. The vocabulary (`shared/src/data/lineages/types.ts`)

- **Packet** (`PacketId`): one of eight lanes — `tempo`, `empowered`, `affliction`,
  `control`, `kill-chain`, `engagement` (weapon-eligible), plus `bulwark` and
  `barrier-tempo` (defensive-only, reserved for armor/charm/boots lineages in a
  later phase). A lineage carries exactly three packets as its lanes. Each packet
  names the stat it scales, what fires it, what it pays out, and what it is weak
  against — see `shared/src/data/lineages/packets.ts`.
- **Card** (`LineageCard`): one tree node. Authored with **no numbers at all** —
  tier, row, lane, trigger/payoff kind, and (for amplifier/keystone/cross rows)
  which card it modifies or which lane it borrows from. `resolveLineageCard`
  (`resolve.ts`) is the only place a number is attached, computed from
  `magnitudes.ts`'s per-tier scalar table. `coverage.test.ts` scans the authored
  card sources to keep this true even if the type is widened.
- **Row** (`RowKind`): `stat` → `payoff` → `amplifier`/`keystone` → `cross`, one
  band per tier (T1 asks stat/payoff, T4 adds cross). A row is a **choice**, not a
  shopping list — `LineageProgress.active` holds one active card per owned row.
- **Form** (`LineageForm`): the actual wearable item, keyed by an ordinary recipe
  id. Tier-1 forms are crafted normally (Make tab, no gate). Tier ≥ 2 forms are
  bought at the tier-below's **gate**: essence, the shard of the lane the new form
  crowns, and the home biome boss's capstone material — "the boss is the only way
  up."
- **Capstone** (`LineageCapstone`): the verb a worn form adds, granted for free the
  moment you wear it (never bought separately). A capstone crowns one lane; every
  lane must eventually be crowned by some form (the coverage rule).

## 2. The five live lineages

`shared/src/data/lineages/index.ts` registers exactly five, one per T1 biome, each
a thin file in the same directory:

| Lineage | Home biome | T1 form | T2 form(s) |
|---|---|---|---|
| `broadsword` | plains | `iron-broadsword` | `knight-steelsword` |
| `rapier` | forest | `flash-rapier` | `gale-needle` (forest branch), `jungle-stinger-rapier` (jungle branch) |
| `hammer` | mountain | `heavy-hammer` | `quake-hammer` |
| `axe` | cave | `chaotic-axe` | `ruinous-axe` |
| `dagger` | swamp | `ashbrand-blade` | `swamp-mirebrand` |

Armor, charm, and boots lineages are **not built yet** — Phase 4 on the plan's
phase table. Those slots still run the old `+N` ladder (ordinary
`Recipe.upgrades`, `checkUpgrade`/`checkEvolve`/`checkReconstruct`) exactly as
before; only the weapon slot moved.

## 3. ⚠ Open gap: T3 and T4 weapons are currently unreachable

**Found during Phase 2b, not fixed by it — flagged for the designer.** The table
above is the *entire* lineage form graph today: every lineage stops at tier 2. No
lineage has a tier-3 or tier-4 `LineageForm` entry.

Every T3/T4 weapon recipe in `RECIPE_DATABASE` (e.g. `mountain-avalanche-maul`,
`mountain-earthsunder-maul`, `cave-cataclysm-axe`, `jungle-venomthorn-rapier`,
`desert-solar-cross`, `desert-pilgrim-quarterstaff`, every Tundra/Volcanic/
Graveyard/Trench weapon) still carries `evolvesFrom`, so:

- it cannot be plain-crafted (`craftRecipe` rejects any recipe with `evolvesFrom`
  set — a pre-existing rule, not something Phase 2b added);
- it can no longer be evolved or reconstructed (Phase 2b's weapon rejection in
  `checkEvolve`/`checkReconstruct`, Override A);
- it has no `LineageForm` entry in any lineage, so `lineage:unlockForm` always
  returns "That form is not part of this lineage."

**T3 and T4 weapons are therefore unreachable by any player action right now.**
This is a direct consequence of retiring the old weapon ladder immediately while
the lineage tree's form graph has only been authored through T2 — a sequencing
gap, not a bug in either phase individually. T1→T2 weapon progression is fully
live and working. Resolving this needs either an interim exception for T3/T4
weapons, fast-tracked T3/T4 lineage-form + capstone authoring (a content-design
task, out of scope for an economy-removal pass), or an explicit designer
decision to accept the gap until a later phase.

## 4. Shared authority (`shared/src/systems/lineages.ts`)

Mirrors `checkUpgrade`/`checkEvolve` for the lineage tree: pure functions the
server applies and the client gates buttons with.

- `checkUnlockCard({ lineage, card, progress, wallet, lineages? })` — can the
  player buy this card? Must own the lineage's worn-form tier ≥ the card's tier
  (the gate IS the band's key), must own any card it `modifies`, then (unless
  `wallet.isTestRoom`) checks home-biome level, Global Mastery, essence, and
  shard affordability.
- `checkSetActive({ lineage, progress, row, cardId })` — swapping which owned
  card is active for a row. Free, instant, fails only on ownership/row mismatch.
  **"Owned is forever, active is a choice"** is the governing invariant: buying
  costs, swapping never does.
- `checkUnlockForm({ lineage, form, progress, wallet })` — can the player pay the
  gate to a new form? Essence + the crowned lane's shard + the home biome's boss
  capstone material, gated by the FORM's own biome level (not the lineage's home
  biome) and the tier-below's Global Mastery band.
- `checkWearForm({ lineage, progress, recipeId })` — swapping the worn form
  among owned ones. Free and instant, like swapping gear.
- `lineageSwitchDiscount(...)` — a card is half price if the player already owns
  the same tier+row on another lineage of the same slot ("a respec at T2 costs an
  afternoon, not a restart"). Gates are never discounted.

Server handlers live in `server/src/systems/player/economy/lineages.ts`
(`unlockLineageCard`, `setLineageActive`, `unlockLineageForm`, `wearLineageForm`),
wired to the `lineage:unlockCard` / `lineage:setActive` / `lineage:unlockForm` /
`lineage:wearForm` socket events (`shared/src/protocol/socketEvents.ts`), all
replying with `lineage:result`.

## 5. Materials — shards and capstones

Both wallets live on `TracksProgression` (`shards: Partial<Record<PacketId,
number>>`, `capstones: Record<string, number>`, keyed by biome) and are the
**only** kill-driven material wallets since Phase 2b deleted the catalyst
accumulator outright (no replacement dimension — essence and these two wallets
are everything a kill can pay).

- **Shards.** Granted by `grantLineageMaterials` (`server/src/systems/player/
  progression/rewards.ts`) on every non-boss kill whose monster belongs to a
  family (`shared/src/data/families/`): `shards[family.drops] += max(1,
  round(SHARD_BASE_PER_KILL × SHARD_TIER_MULT[biomeTier] × debugMult))`. A
  monster outside the family table (any T2–T4 non-family mob) drops no shard.
  See [`variants-current-state.md`](variants-current-state.md) for the family
  system itself.
- **Capstones.** Granted on every boss kill whose biome has a capstone material
  (`CAPSTONE_MATERIALS`, `shared/src/data/lineages/capstones.ts`):
  `capstones[biomeGroup] += max(1, round(debugMult))` — one per kill, not scaled
  by node identity, "because the boss is the only way up a tree."
- Both wallets are wiped (not refunded — there is no refund rule for them) by
  `resetPlayerProgress` and reset to `{}` on fresh-character creation.

## 6. Runtime effects (Phase 1b/1c)

`resolveActiveLineages(inventory, frameFace?)` is what a player's lineages
contribute right now, across every slot — **only while the worn form is actually
equipped**; owning a second tree changes nothing until you wear it. It folds
stat-row contributions into the stat rebuild and resolves the active card per
owned row plus the worn form's capstone.

- `stat` rows fold into `itemMechanicEffectsAt`'s seam, same `*Pct` sum-then-
  apply-once semantics as everything else.
- Every other row has a trigger (`hit-nth`, `mechanic-fired`, `kill`, `evade`,
  `hit-taken`, `guard-cast`, `standing`, `pulse`, `barrier-break`, `first-hit`)
  and a payoff (`vulnerability`, `plating-shred`, `echo-hit`, `hemorrhage`,
  `poison-stack`, `slow`, `stun`, `damage-window`, `speed-window`, `recovery-
  window`, `ward`, `cleanse`, `plating-stack`, `engagement-dr`, `contagion`),
  each mapped onto an existing combat primitive — `mechanic-fired` is the one new
  one Phase 1b added (a class-agnostic "your mechanic fired" event). Wiring lives
  in `server/src/systems/combat/lineageCards.ts`; `standing`/`pulse` run off
  `updateLineageCards(world, dt)` from `World.tick` since they have no listener
  seam to ride.
- Every card the player buys adds one visible signature on screen
  (`LineageFxKey`, e.g. `tempo.ghost-strike`, `empowered.plating-crack`) — "a
  card with no signature is a stat," per design §8.

## 7. Known limitations

- `previewEquipmentStats` (gear-swap preview) still builds a synthetic inventory
  with no `lineages`, so the stat sheet and swap preview ignore cards.
- Armor/charm/boots have no lineage yet (Phase 4) and still run the `+N` ladder.
- See §3 above: T3/T4 weapon forms do not exist yet.

## 8. Card telemetry — the first LIVE run (2026-10-01)

`lineage:unlockCard` and `lineage:setActive` had existed since Phase 1c and had **never
run against a server**. Their only producer was `LINEAGE_LANE_PROFILES`, which the lane
bench drives in-process, and no authored route spliced them, so the socket path was wired
and unobserved. Route `striker-lineage-forest-t1` (added for this) is the first that buys
cards live.

Run: cadence-root / cadence-balanced, Forest, **25× reward multiplier**, **955.9 s**,
ended by the operator's timeout. **Non-canonical for economy** — the harness says so
itself (`NON_CANONICAL_REWARD_MULTIPLIER`). Treat every pacing number as a smoke test.

| metric | value | source |
|---|---:|---|
| time to first card | **215.9 s** (3 m 36 s) | `lineage.card-unlocked.sessionElapsedMs` |
| `unlockCard` round trip | **508 ms** | bot `route-step-end` |
| `setActive` round trip | **0 ms** | bot `route-step-end` |
| swaps per session | **0** | no second owned card in any row |
| gate paid | **0** | `capstones` empty; the route has no boss step |
| kills / deaths | 112 / 0 | bot `kill` events |

**The seam works.** The stat card was bought and slotted, the server persisted it
(`ownedCards: ["rapier-t1-tempo-stat"]`, `active.stat` set), and the gameplay telemetry
recorded `lineage.card-unlocked` with `shardsSpent 3`, `essenceSpent 30`,
`firstOfSession true`.

**`setActive` completing in 0 ms is correct, not a failure.** `unlockCard` into an EMPTY
row already activates the card server-side, which `lineageRouteSteps`' own docstring
predicts; the route emits the step anyway so it states its active set. It follows that
**swaps-per-session cannot be measured by a pure-lane route at all** — a swap needs two
owned cards competing for one row, and a pure lane buys one card per row by construction.
That metric needs a route authored to buy a second card in a row and flip between them.

### The payoff card was never reached, and the reason is a finding

The run then spent **~12 minutes farming for `rapier-t1-tempo-payoff` and never bought
it**, with 13,736 green essence (cost: 90) and 2,122 Tempo shards (cost: 8) in the wallet.
It was blocked on **Global Mastery 18**, and Global Mastery is the sum of biome levels
excluding the clearing: Plains 6 + Forest 6 = **12**. Forest was already at its tier cap,
so no amount of farming in Forest could ever satisfy it.

Two separate things fall out:

1. **A pacing observation for the designer.** At T1 the payoff row — the row that does
   something in combat — sits at GM 18, which is **three biomes at level 6**. A player who
   has maxed the weapon's own biome and one other still cannot buy it, however much
   currency they hold. The stat row (GM 6) is reachable from one biome; the payoff is not.
2. **A harness defect.** `doUnlockCard`'s `farmBlocked` raises a named `StallError` only
   for the "this packet has no tier-1 shard source" case. A Global-Mastery shortfall that
   the farm node *cannot* fix — because its biome is already at cap — farms silently
   forever instead. It should detect an unsatisfiable requirement and stall with a message
   naming it.

Neither is caused by the card runtime, and the route's own truncation (it stops at the
Flash Rapier and skips the later biomes) is what put it in that position.
