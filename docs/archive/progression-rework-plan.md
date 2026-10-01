> **ARCHIVED (2026-10-01) — HISTORICAL.** Phases 0–5 below shipped (run 3,
> `docs/briefs/run3-progression-2026-10-01.md`, and the overnight/day runs it followed).
> This page is kept for the per-phase build rationale, the divergence notes, and the
> bench evidence quoted inline — it is not the living truth. Current behavior lives in
> [`lineages-current-state.md`](../lineages-current-state.md) (lineages, rows, keystones,
> cross, re-homed forms, ability nodes), [`variants-current-state.md`](../variants-current-state.md)
> (families, blends, shards, capstones), [`frames-current-state.md`](../frames-current-state.md)
> (frame loops, range mechanics), and [`recovery-current-state.md`](../recovery-current-state.md)
> (flat recovery, the pool-raise pointer). The short index that replaced this page at
> `docs/progression-rework-plan.md` is the status scoreboard; read it first. Where this
> page and the current-state pages disagree, the current-state pages win — they were
> folded from this page's own progress notes but the code may have moved since.

# Progression Rework — Implementation Plan (historical)

**Status:** SUPERSEDED. Drafted 2026-09-30 as the active plan; Phases 0–5 all shipped (at
least their first slice) by run 3 on 2026-10-01. Every "Built" progress note below is the
historical record of what each task actually did and why, including the divergences from
this page's own original sketch. Read the current-state pages linked above for what is
true today.
**Design authority:** [`design_docs/progression-rework-design.md`](../../design_docs/progression-rework-design.md).
Read that first; this page only says what was built, where, in what order, and how
each phase proved itself.

Phase order is locked with the designer on 2026-09-30:

| Phase | What ships | Proves |
|---|---|---|
| 0 | Coarse HP/recovery pass | fights have swings; provisional numbers |
| 1 | Weapon lineage tree, T1, five lineages | the tree is felt; vocabulary is closed |
| 2 | Plains + Forest variants and shards; catalysts, modifiers, +N ladder removed | the map search is felt; economy is one system |
| 3 | Frame loops and range-node mechanics | frames have identity |
| 4 | Armor, charm, boots trees at T1; remaining T1 variants | packets complete across slots |
| 5 | T2 band, amplifier row, form re-homing | the tier transition is the hook |

Every phase ends with `pnpm typecheck`, the phase's tests, a bot measurement, and one
human playtest before the next phase starts. Run only the related tests pre-commit; the
full suite is for the phase gate.

---

## Phase 0 — Coarse HP/recovery pass

**Goal.** HP moves during ordinary fights. Explicitly provisional: the item rework changes
defensive budgets later, so do not polish.

**Metric.** From bot runs on T1–T2 normal nodes, per fight: HP fraction at fight end and
share of fight time spent between 20% and 80% HP. Today both are presumed bimodal.
Target: median fight-end HP 40–60%, time-in-band above 50%.

**Levers, in order.** `GAME_CONFIG.PLAYER_RECOVERY` (the naked baseline of 10) and the
in-combat active fractions in `recovery-current-state.md` §1; base max HP; Second Wind /
Brace cooldowns in the ability ranks; charm recovery values. Do not touch encounter
shapes or monster numbers in this phase; note which encounters become burst-lethal and
carry the list into Phase 4.

**Harness.** The bot harness already logs HP; add a per-fight summary to the frozen
runner output (`docs/bot-experiment-runner-current-state.md`) so the metric is a column,
not a script. Keep the `ttkSurvey` versus live-bot fidelity caveat in mind.

**Exit.** Metric on target for two frames per root on Plains and Forest; a human
playtest confirms Second Wind is now a timing decision. Record the numbers in
`recovery-current-state.md` §8 as "provisional pending progression rework".

**Phase 0a result (2026-09-30, in-process bench only, Docker was down).** Base Recovery
10 → 5, nothing else. Forest moved toward the metric; Plains cannot reach it with any
player-side lever (intake 0.1–0.4 of the pool per fight, carried to Phase 4); no burst
anywhere at T1–T2. The bench also found that a farm bot never re-enabled auto-combat after
dying, so older farm-income numbers with deaths are suspect. Full record in
`recovery-current-state.md` §8 and `reports/progression-phase0/`.

### Phase 0b — flat recovery (decided 2026-09-30)

**Why.** Under the percentage model max HP and recovery are the same stat: a bigger pool
heals more per second, so raising the pool moves the metric the wrong way (the 0a bench
confirmed it). Bible §15 has the reasoning. The five calls below are agreed.

1. **One Recovery point is one HP per second.** In combat:
   `healPerSecond = recovery × activeFraction`. Every fraction key is untouched.
2. **Base rate is per player tier**, from a reference-pool table in `gameConfig.ts`
   (`RECOVERY_REFERENCE_POOL_BY_TIER`, seeded ≈ 130 / 200 / 330 / 560) with
   `base = 0.05 × referencePool[tier]`, so a naked character at tier entry recovers the
   same 5%/s it does today and the pool outgrows the rate within the tier.
3. **Out of combat is a fixed rate independent of the stat**:
   `maxHp × GAME_CONFIG.OOC_RECOVERY_PCT` (0.10, the pre-Phase-0 rate), after
   `COMBAT_REGEN_DELAY`. Downtime never depends on in-combat tuning again. Node-hazard
   suppression keeps blocking only this branch.
4. **Player pool stays as-is until the charm sweep is done**, then it is raised per tier
   (base HP and armor HP together) and measured against bosses first, packs after.
5. This is one more Phase 0 session, landed before Phase 1 authoring.

**Touch list.**
- `server/src/systems/defense/regen/recovery.ts`: `recoveryPerSecond` and the OOC branch
  of `runRecovery` / `activeRecoveryFraction`.
- `shared/src/systems/stats.ts` step 1: seed `hasHealth.recovery` from the tier table.
- `shared/src/config/gameConfig.ts`: `RECOVERY_REFERENCE_POOL_BY_TIER`,
  `RECOVERY_BASE_FRACTION`, `OOC_RECOVERY_PCT`; `PLAYER_RECOVERY` goes.
- Summoner: `summonerPrototype.ts` minion regen heals at the owner's flat rate ×
  (minion maxHp / owner maxHp); `reconstruction.ts` uses the flat rate.
- Charm recipes (~30 items): re-derive `stats.recovery` per tier by bench sweep so each
  tier's reference builds keep today's time-to-death. Seeds: T1 2–4, T2 8–12,
  T3 20–35, T4 50–80 HP/s.
- `shared/src/systems/balanceLab.ts` `defensiveItemScore`: recovery weight per tier.
- Text: `client/src/hud/stat/statHelp.ts` recovery string; StatPanel unit.
- Docs: `recovery-current-state.md` §1 (the one rule), `design_docs/player-power-curve.md`
  heal-throughput cap, the eHP packet survival formula note.
- Tests: `recovery.test.ts`, `abilitySecondWind.test.ts`, `charmHooks.test.ts`,
  `nodeFeatureRegenSuppression.test.ts` move from %-of-pool to HP/s assertions; add a
  test that OOC rate is independent of `hasHealth.recovery`.
- Bench: rerun `phase0Recovery` per tier; check the bot's charm pick still values
  recovery after the change before trusting T3/T4 numbers.

No persistence work: the stat is derived at every recalc.

**Charm rule (added 2026-09-30 after the 0b bench).** The pool-factor conversion preserves
*naked-equivalent* healing. That is not the charm's job under the flat model: the charm
covers the gap between the tier's entry pool and the pool a geared character actually
carries. So charm values are derived against the **+3 pool per tier** (what the bench bots
carry, 15–40% above the reference pools), not against `RECOVERY_REFERENCE_POOL_BY_TIER`.
The reference pools stay where they are; raising them would re-couple the rate to a geared
pool and make naked characters over-heal at entry. Expected outcome: a naked character at
entry heals as before, a geared character without a charm heals less than before, a
geared character with its tier's charm lands near its old time-to-death.

**Exit (amended 2026-09-30).**
- Naked-at-entry: fight-end HP and time-in-band unchanged from 0a within noise, T1–T4.
- Geared (+3) with the tier's charm: time-to-death within ±10% of pre-0b, measured as
  time-to-death (not fight-end HP), after the charm sweep against the +3 pool.
- Geared without a charm: lower than pre-0b, by design; record it, do not tune it away.
- OOC empty-to-full is 10 s at every tier.
- The live-bot `combat.fights` column measured once with Docker up, before any human
  playtest is used as evidence.
- 0a and 0b committed as two commits (CR stripped from `clearing.recipes.ts` first) so
  bench baselines have revisions to point at.
Then the player pool raise, measured on bosses first, packs after.

**Progress (2026-09-30, same session as 0a).** Implemented as listed in the touch list:
flat `recoveryPerSecond`, fixed `oocRecoveryPerSecond`, `baseRecoveryForTier` from the
reference-pool table (100 / 130 / 200 / 330 / 560 — a fresh-character entry was added in
front of the four seeds), `PLAYER_RECOVERY` removed, minion regen and reconstruction on
the flat rate, all 30 charm recipes (base values and upgrade steps) converted by the
tier's pool factor, `defensiveItemScore` weight per tier, eHP report, HUD text and units,
tests moved to HP/s with an OOC-independence test. Numbers and what the bench could and
could not confirm are in `recovery-current-state.md` §8.

**Close-out (2026-09-30, later the same day).** Commits: design docs `a53cb6a1`, Phase 0a
`b5f67395`, Phase 0b `f47b8e97`, charm sweep (this note's commit). Against the amended exit:
- Charm sweep done against the +3 pool (P3 = 156 / 234.5 / 446 / 755), all 30 tiered
  charms; time-to-death (`server/bench/phase0Ttd.ts`) geared-with-charm new/old median
  1.00 at every tier, 30 of 36 measurable cells within ±10%; the six outliers are the
  class-pool spread around the tier median (Striker T3 Desert/Tundra 0.71–0.78, Slinger
  T4 Jungle 1.43–1.49, Slinger T2 Mountain 0.67).
- Geared without a charm: TTD 0.92–0.99, fight-end deaths up at T1 and T4 — recorded.
- Naked at entry: TTD 1.02 at T1, 1.09 at T2, **1.15–1.19 at T3/T4** (the reference-pool
  base out-heals the old 5% of a naked pool). Not within noise at T3/T4; recorded, pools
  untouched.
- OOC 10 s at every tier (test).
- Live `combat.fights` measured once with Docker up: T1 Forest 0.58 / 0.52, T2 Forest
  0.41 / 0.55 (median end HP / time in band), Plains 0.82–0.93. Non-canonical (25×
  rewards, two bots on one server), taken at the 0b pool-factor charm values.
- The first T3/T4 "before" bench was invalid (base 0 mid-edit) and was replaced by an
  in-engine emulation of the percentage model (`pre0b-*`, `PHASE0_MODEL=old`).
Still open: the human playtest and the player pool raise (bosses first).

**Progress (2026-09-30).** Shipped: the per-fight metric (`bot/src/telemetry/fightHp.ts`,
`summary.json → combat.fights`, `experiment:report` columns) and an in-process bench,
`server/bench/phase0Recovery.ts`, used because Docker was down. Applied: `PLAYER_RECOVERY`
10 → 5, nothing else. Findings and numbers are in `recovery-current-state.md` §8. Two
things the bench could not deliver: Plains intake per fight is 0.1–0.4 of max HP for every
class, so no player-side lever reaches the metric there without monster numbers (carried to
Phase 4 with the burst list), and the phase gate itself — a live-bot `combat.fights` column
on Plains and Forest plus the human Second Wind playtest — is still open.

---

## Phase 1 — Weapon lineage tree at T1

### 1.1 Shared data model (`shared/`)

New: `shared/src/data/lineages/` with `types.ts`, `packets.ts`, one file per lineage
(`rapier.ts`, `broadsword.ts`, `hammer.ts`, `axe.ts`, `dagger.ts`), and `index.ts`
exporting `LINEAGE_DATABASE` (explicit `new Map<string, LineageDefinition>()`).

```ts
type PacketId = 'tempo' | 'empowered' | 'affliction' | 'control' | 'kill-chain'
  | 'engagement' | 'bulwark' | 'barrier-tempo';
type RowKind = 'stat' | 'payoff' | 'amplifier' | 'keystone' | 'cross';
type TriggerKind = 'hit-nth' | 'mechanic-fired' | 'first-hit' | 'kill' | 'evade'
  | 'hit-taken' | 'guard-cast' | 'standing' | 'pulse' | 'barrier-break';
type PayoffKind = 'vulnerability' | 'plating-shred' | 'echo-hit' | 'hemorrhage'
  | 'poison-stack' | 'slow' | 'stun' | 'damage-window' | 'speed-window'
  | 'recovery-window' | 'ward' | 'cleanse' | 'plating-stack' | 'engagement-dr' | 'contagion';

interface LineageCard {
  id: string; lineageId: string; tier: number; row: RowKind; lane: PacketId;
  name: string; description: string; fx: string;          // fx = visual signature key
  requiredBiomeLevel: number;                              // biome-local level
  cost: { essence: Partial<Record<EssenceType, number>>; shards: Partial<Record<PacketId, number>> };
  statEffects?: Partial<ItemStats>; mechanicEffects?: Record<string, number>;
  trigger?: { kind: TriggerKind; n?: number }; payoff?: { kind: PayoffKind; magnitude: number; durationMs?: number };
}
interface LineageForm {
  recipeId: string; tier: number; biome: string;           // recipeId = existing item/recipe id
  capstone: Omit<LineageCard, 'row' | 'requiredBiomeLevel' | 'cost'>;
  gateCost: { essence: Partial<Record<EssenceType, number>>; capstone: { biome: string; amount: number } };
  requiredBiomeLevel: number;
}
interface LineageDefinition {
  id: string; slot: EquipmentSlot; homeBiome: string; lanes: [PacketId, PacketId, PacketId];
  forms: LineageForm[]; cards: LineageCard[];
}
```

Magnitudes come from `shared/src/data/lineages/magnitudes.ts`: one table
`{ tier -> { row -> scalar } }` plus a per-packet budget. Card files reference the table;
no literal magnitudes in card files (enforce with a test).

Existing `Recipe.lineageId`/`evolvesFrom` stay as the form graph. `UpgradeStep[]` on
recipes is left in place during Phase 1 and deleted in Phase 2.

Player state, on `HoldsInventory` (persisted, component-shaped):

```ts
lineages: Record<string, {                 // keyed by lineageId
  ownedCards: string[];
  active: Partial<Record<RowKind, string>>;
  ownedForms: string[];                    // recipe ids
  wornForm: string;                        // recipe id; equipment[slot] mirrors it
}>;
```

`equipment[slot]` keeps holding the worn form's recipe id so stat derivation, item
tooltips, and the ladder rules are unchanged. `NETWORKED_PLAYER_KEYS` already carries
`holdsInventory`; confirm the slice size is acceptable and mark dirty via `mutateSlice`.

Pure rules in `shared/src/systems/lineages.ts`, mirroring `checkUpgrade`/`checkEvolve`:
`checkUnlockCard`, `checkSetActive`, `checkUnlockForm`, `checkWearForm`,
`resolveActiveCards(entity)`, `lineageMasteryLevelForRow(tier, row)` (reuses the GM band
in `itemUpgrades.ts`), `lineageSwitchDiscount`.

**Built 2026-09-30 (Phase 1a, `feat/lineage-data-model`).** As sketched above, with four
deliberate differences — the code is the authority where they disagree:

1. **Authored cards carry no numbers at all**, not even the ones the sketch gave them
   (`cost`, `requiredBiomeLevel`, `trigger.n`, `payoff.magnitude`, `statEffects`). There is
   nowhere in `LineageCard` to put a literal; `resolveLineageCard` in
   `data/lineages/resolve.ts` produces a `ResolvedLineageCard` that carries all of them.
   "Every number comes from the magnitude table" is structural rather than a convention.
2. **The magnitude table has two tier columns, not one** (`TIER_SCALAR.absolute` /
   `.fraction`). Flat quantities must keep pace with T4 damage; percentages are already
   relative to numbers that grow, so scaling both on one column turned a 35% echo into a
   385% echo at T4. Binary payoffs (stun, cleanse) scale on neither.
3. **The "no literal magnitudes" source scan lives in `server/test/lineageAuthoring.test.ts`**,
   not in `shared/src/data/lineages/coverage.test.ts`. The scan reads files and `shared/`
   may not import Node APIs. The shared coverage test keeps every pure-data rule.
4. **`HoldsInventory.lineages` is OPTIONAL**, like `TracksProgression.visitedNodes`, so
   pre-Phase-1 saves and bare test/preview inventories still construct. Nothing reads it
   raw — `lineageProgressFor` / `normalizeLineageProgressMap` are the single readers, and
   1b can make it required once every construction site is wired.

Known gap carried forward: no form's capstone crowns the **engagement** lane, because the
only two lineages that carry it (Rapier, Hammer) spend their T1 form doors elsewhere.
Crowning it needs a second door from the re-homing table (bible open decision 4). It is an
explicit `UNCROWNED_LANES` allowlist entry in the coverage test, which fails if the lane is
ever crowned, so the entry cannot outlive the gap.

Every magnitude in the table is PROVISIONAL and unbenched; the lane-budget check is §1.5.

**Built 2026-09-30 (Phase 1b, `feat/lineage-data-model`).** Scope was split with the
designer: 1b is the economy, the protocol, the wallets and persistence; the combat card
runtime and the `mechanic-fired` seam are **1c**, so the seam's double-fire risk gets its
own review rather than riding in on a large diff. Stat rows are live and felt; payoff
cards are bought, activated and persisted but do nothing in combat yet.

Three decisions taken with the designer on 2026-09-30:

1. **`active` is one card per row across the whole tree**, as the sketch above types it —
   not one per band. Paying a gate therefore retires the band below it as power, and the
   collapsed summary line is a wardrobe to reslot from, not a stack that keeps paying.
2. **Both wallets land now, additively.** `TracksProgression.shards` (keyed by packet) and
   `.capstones` (keyed by biome) ship in 1b and drop on kills; `catalysts` is untouched and
   Phase 2 deletes it. This makes the tree playable and the economy testable a phase early,
   at the cost of a reward-seam change Phase 2 revisits.
3. Combat runtime deferred, as above.

**Family data arrived early.** Shard drops need to know which family a mob belongs to, so
`shared/src/data/families/` (plan §2.1) is authored now — but only its `drops` half is
live. Per-node blends, family-driven spawning and the removal of node modifiers stay in
Phase 2. Every non-boss monster of the five T1 biomes is in exactly one family, enforced by
`server/test/lineageMaterials.test.ts`, because a mob in no family is a kill that silently
pays nothing. Mountain, Cave and Swamp remain PROPOSED pending bible open decision 2.

### 1.2 Protocol (`shared/src/protocol/socketEvents.ts`)

Client to server: `lineage:unlockCard { lineageId, cardId }`, `lineage:setActive
{ lineageId, row, cardId }`, `lineage:unlockForm { lineageId, recipeId }`,
`lineage:wearForm { lineageId, recipeId }`. Server to client: `lineage:result
{ success, reason?, lineageId }`. Reuse `CraftResult` shape. Add the intent helpers in
the client's intent layer; no direct UI emits.

### 1.3 Server

- `server/src/systems/player/economy/lineages.ts`: the four handlers, each validates via
  the shared checks, spends essence/shards/capstones, mutates `holdsInventory.lineages`, and
  calls `recalculatePlayerStats`. Wearing a form sets `equipment[slot]` through the
  existing equip path so archetype slices rebuild.
- Stat and mechanic effects of active cards fold into passives at recalc, the same seam
  `itemMechanicEffectsAt` uses today (`shared/src/systems/stats.ts`).
- **Card runtime** `server/src/systems/combat/lineageCards.ts`, registered in
  `initCombatSystems()`: one listener per trigger kind, reading a per-entity resolved
  card list cached on recalc (store on `TracksCombat` via the helper API, not raw maps).
  Payoff kinds dispatch to existing hooks: `vulnerability`/`plating-shred` to the cadence
  debuff helpers, `echo-hit` to the aftershock seam, `hemorrhage`/`poison-stack` to the
  DoT inventory, `slow`/`stun` to the control ladder, windows to `TracksCombat` timed
  flags, `ward`/`plating-stack`/`engagement-dr` to the defense helpers. Every on-hit
  applier early-returns on `evadeBlocksDebuffs(ctx)`. `damage-window` writes
  `ctx.metadata.empoweredMultiplier`, never a second multiplier.
- **`mechanic-fired` seam**: emit one event from `empoweredAttacks.ts` when the cadence
  finisher or cooldown execution consumes the flag, from the dot root on max stacks, from
  reload on reload, from energy on burst, from summoner on command. This is the only new
  combat primitive in the phase.
- `world.pushEvent(nodeId, event)` for every payoff signature so the client can draw it.
  New event kinds: `card-fx { playerId, fx, targetId? }`.
- Persistence: `server/src/db/playerRepo.ts` hydrates `lineages` (default `{}`), drops
  unknown card/form ids, and a migration `0008_lineages.sql` adds nothing if the JSON
  column already holds the slice (verify; component-shaped JSON should absorb it).

**Built 2026-09-30 (Phase 1b).** As listed, minus the card runtime and the
`mechanic-fired` seam, which are 1c. What shipped:

- `server/src/systems/player/economy/lineages.ts` — the four handlers. Each validates with
  the shared check, spends exactly the resolved cost, mutates through `mutateSlice`, and
  recalculates. A refused action spends nothing (tested).
- `server/src/systems/player/economy/lineageSync.ts` — `ensureLineageProgress`,
  `syncLineagesFromInventory`, `syncWornFormFromEquipment`. Split out of the handlers so
  the equip path can call it without an import cycle. A tree is born from HOLDING the
  crafted base form: crafting it, equipping it, or loading a save that has it all open the
  tree, because taking the slot has always been how you take the lineage (design §2).
  Equipping a form outside the tree panel moves `wornForm` with it — without that the two
  disagree and `resolveActiveLineages` deliberately goes dark.
- Stat rows fold in `shared/src/systems/stats.ts`. Resolved once in a new step 2b, because
  a Tempo row grants `attackSpeedPct` and attack speed must land before the cooldown is
  computed; the flat half applies with equipment in 3c so class affinities multiply it, and
  lineage `damageReduction` joins the ITEM DR bucket. A card is item power.
- Rewards: `grantLineageMaterials` in the one kill seam. Deterministic — N kills is exactly
  N times one kill, no rolls and no pity timer (tested). The dev reward multiplier reaches
  shards like every other payout.
- Persistence: `normalizeLineageProgressMap` on load, plus `sanitizeShardWallet` /
  `sanitizeCapstoneWallet` beside `sanitizeFamilyWallet`. **No migration was needed** — the
  component-shaped JSON columns absorb the new keys, as §1.1 suspected. `attachPlayerEntity`
  normalizes the two wallets so no construction site has to.
- `PlayerView` carries `shards`, `capstones` and `lineages` so 1c has them.
- Bulk item grants open their trees: `applyTierEntryProfile` and the character wipe in
  `gameActions.ts`. Found by `progressionCheckpoint.test.ts`, whose rebuild-equals-capture
  invariant caught a dev profile holding a Gale Needle with no tree behind it.

**Known limitation for 1c.** `previewEquipmentStats` builds a synthetic inventory with no
`lineages`, so the stat sheet and the swap preview currently ignore lineage cards. Feeding
the real trees through the preview is 1c's job, alongside the tree panel itself.

Tests: `lineageEconomy` (spend/refuse/discount/gate/wear, stat row reaching stats),
`lineageMaterials` (determinism plus the family partition over every T1 mob),
`lineagePersistence` (a pre-rework save rebuilds its trees and invents no progress).

### 1.4 Client

- New `client/src/ui/lineage/LineageTreePanel.tsx` (+ `lineageTree.css`) following the
  published mockup: lane headers, lit band, rows of three cards, gate with forms, dimmed
  silhouette of the next band, side column with mastery ticks, materials, and the build
  readout. Reuse `SkillTreePanel` card/lock styling and `MaterialChip`. Phone width: bands
  stack, cards stay three-across at 100px min.
- Inventory: `EquipmentSlots.tsx` shows the lineage name and worn form; tapping opens the
  tree panel for that slot. Backpack no longer lists forms of an owned lineage.
- Crafting rail: Make tab keeps crafting T1 base forms. `UpgradeTab` and
  `EvolutionPreview` stay for non-weapon slots until Phase 4, hidden for weapons.
- HUD: charge/stack counter and a lane-coloured buff clock on the player frame
  (`hudBus` + Jotai atom), fed by the existing buff sync.
- FX: one Phaser effect per `fx` key in `client/src/scenes/game/` concern maps, driven by
  `card-fx` events. Phase 1 ships the T1 weapon signatures only (about fifteen keys).
- Tutorial: add a "first card" beat to the guided T1 script after the first Forest level
  2; the bot-validated script in `guided-tutorial-plan.md` must still pass.

### 1.5 Bots and measurement

- `bot/src/tierEntry/profiles.ts`: a profile gains `lane: PacketId` and route steps gain
  `unlockCard`/`setActive`. Generate three reference profiles per frame (one per lane).
- Bench: `pnpm bench:balance` runs each reference profile against each T1 node; report
  TTK per lane per node and the lane budget check (±10% of median at full rows).
- Telemetry: log `lineage.card-unlocked`, `lineage.card-swapped`, `lineage.gate-paid` to
  the gameplay tables so the playtest can answer time-to-first-card and swaps per session.

### 1.6 Tests (all bare-`World`, no DB)

- `server/test/lineageCards.wiring.test.ts` — attach a player with one active card per
  trigger kind, tick, assert the payoff is observable (status present, event pushed,
  flag set) and that evade blocks the on-hit ones.
- `server/test/lineageEconomy.test.ts` — unlock/setActive/unlockForm/wearForm happy and
  refusal paths; mastery gate per row; shards, capstones and essence spent; lineage-switch
  discount.
- `shared/src/data/lineages/coverage.test.ts` — every packet on ≥2 weapon lineages;
  every lane has a form whose capstone crowns it; no literal magnitudes in card files;
  every card has an `fx` key and every `fx` key has a client mapping (grep-census, with
  the census tested rather than eyeballed).
- `server/test/mechanicFired.test.ts` — the seam fires once per finisher/execution/
  max-stack/reload/burst and never twice on one hit.

**Exit.** Bench: each pure lane within budget on its favoured node. Playtest: players
name their lane unprompted; time-to-first-card under four minutes; at least one swap per
session. If the felt-effect claim fails here, stop and redesign before Phase 2.

### Phase 1c progress note — card runtime and `mechanic-fired` (2026-10-01)

**Built.** The server half of the Phase 1c contract. `pnpm typecheck` clean; the lineage
suite (7/7) plus the ability / defense / durability / recovery / archetype / HUD-tooltip
subsets (72 files) pass.

- `shared/src/protocol/combatEvents.ts` — the `card-fx` member, verbatim from the
  contract. One per payoff APPLICATION, pushed by the listener that applied it; a payoff
  that refused draws nothing, which is asserted.
- `server/src/systems/combat/engine/mechanicFired.ts` — `emitMechanicFired(world, player, ctx?)`
  and `registerMechanicFiredListener`. Dispatch only: no state, no effect, no card. The
  `ctx` doubles as a one-per-hit latch (`ctx.metadata.mechanicFired`), so the four roots
  whose moment is an on-hit moment can register in any order and one exchange still emits
  once. The six call sites, one per root:
  cadence `cadencePrototype.ts` (a new onHit registered straight after the empowered
  multiplier, gated on `metadata.empoweredAttack` + `usesCadence`);
  cooldown `cooldownPrototype.ts` (the existing cycle-restart handler, which already IS
  "the execution's flag was consumed");
  dot `dotPrototype.ts` inside `applyClassDotStack` (latched on the effect's own
  `data.maxStackFired`, so it is once per target per fill by construction and a refill
  re-arms when the stack drops);
  reload `reloadLifecycle.ts` in `completeReload`;
  energy `energyPrototype.ts` (an onHit after the empowered multiplier, gated on
  `usesEnergy`);
  summoner `command.ts` at the end of `applySummonerCommand` (the focus early-return
  became an `else` so focus and move share one emission).
- `server/src/systems/combat/lineageCards.ts` — `registerLineageCards()`, called from
  `initCombatSystems()` right after `initWeaponEffects()` so the empowered multiplier has
  already written `empoweredMultiplier` before a card reads the hit it scales off. Ten
  triggers, fifteen payoffs, every payoff on a pre-existing hook. Resolved cards are
  cached on `TracksCombat.lineageRuntime` via new `get/setLineageRuntime` helpers and
  refreshed from `recalculatePlayerEntityStats` — the one place the inputs can move.
- `shared/src/systems/lineages.ts` — `lineageStatusEffectId(payoff)` (`lineage.<payoff>`),
  shared because the client's buff tiles key off the id.
- HUD: six `lineage-*` buff ids with descriptors in `LINEAGE_BUFFS`, spread into
  `ALL_BUFFS`. `BUFF_IDS` is guarded by a compile-time equality assert and by
  `hudStatusTooltips.test.ts`, which also demands authored copy and an icon resolver —
  so `client/src/hud/statusHelp.ts` and `client/src/ui/conceptIcons.ts` gained entries
  too. Those two client edits are consequences of the ids, not UI work.
- Tests: `server/test/mechanicFired.test.ts` (every assertion is a count) and
  `server/test/lineageCards.wiring.test.ts` (cards seeded onto the runtime cache, since
  T1 authors only four of the ten triggers).

**Divergences from the contract, and why.**

1. **`plating-stack` does not use a status "stack"** — there is no hit-plating *status*
   to reuse. Reactive plating is resources on `TracksCombat` gated on
   `defense.hit-plating-per-stack`. So the card applies `lineage.plating-stack` carrying
   the flat per-stack value it resolved against the player's plating, and
   `reactivePlating.ts` adds it to the passive in one shared `platingPerStack(player)`
   helper used by both its listener gate and its tick. The stacking, hold window and
   one-at-a-time fade stay where they already lived.
2. **`engagement-dr` is read by a listener in `lineageCards.ts`, not by `engagementDr.ts`.**
   The existing Dawn window is passive-driven and rearms on its own quiet timer; a card's
   window is opened by its trigger and has its own clock. Folding the card into Dawn would
   have made one window answer to two owners. The shape (a damage-taken multiplier, capped
   at 0.75) is Dawn's.
3. **`speed-window` and `recovery-window` DID extend their existing seams**, because there
   is only one of each: a summand in `attackHasteBonus` (`attackCadence.ts`) and a sixth
   `RecoverySourceId`, `'lineage'` (`recovery.ts`). A borrowed source would let a card's
   window ride a Guard's fraction, or be downgraded by it.
4. **`cleanse` needed a home.** `applyCleanse` was private to `abilityFiring.ts`, and
   importing it would have made `abilityFiring -> charmHooks -> lineageCards -> abilityFiring`
   a cycle. Moved verbatim to `server/src/systems/combat/status/cleanse.ts` as
   `cleansePlayerAfflictions`; the Cleanse guard now calls it there. Policy unchanged.
5. **`contagion` needed Contagion's copier.** `copyDotOnto` was private; it is now
   `copyPlayerDotOnto` with an optional `stackFraction` (default 1, byte-identical for the
   Technique) so a card can copy a share rather than the whole affliction.
6. **`hemorrhage` reuses `cadence-hemorrhage`**, whose tick driver (`updateHemorrhages`)
   runs for every hemorrhaged monster regardless of who bled it. A lineage bleed refreshes
   by taking the BETTER of per-tick damage and remaining ticks, never by overwriting — a
   per-hit card must not shrink a finisher's bleed.
7. **`standing` and `pulse` need a clock**, which no combat-pipeline listener has. They run
   from `updateLineageCards(world, dt)`, called from `World.tick` just before
   `syncPlayerBuffs` so a window opened this tick shows its clock on the same frame. All
   ten triggers are still owned by one module; two of them simply are not listeners.
8. **`guard-cast` hangs off `onGuardFired`** in `charmHooks.ts` rather than a listener — a
   Guard is not an attack and has no context to ride.

**Gaps for the designer.** Named constants at the top of `lineageCards.ts`, because the
magnitude table does not author them and no T1 card needs them yet. When a later band
buys one of these triggers or payoffs, the number belongs in `magnitudes.ts`:
`STANDING_MS` (1500), `PULSE_MS` (4000), `CONTAGION_RADIUS` (120) and
`CONTAGION_TARGETS` (1), `BLEED_TICK_MS` (1000, matching the cadence root),
`CLEANSE_STACKS`/`CLEANSE_DEBUFFS` (1/1), `ENGAGEMENT_IDLE_MS` (4000, the quiet spell that
ends an engagement for `first-hit`). Two design questions came out of the wiring:
`standing` and `pulse` have no authored cadence at all, and `contagion`'s radius is a
positional lever the table has no column for. Nothing needed a new combat primitive
beyond the `mechanic-fired` seam the contract authorises.

**Not in 1c.** `previewEquipmentStats` still builds a synthetic inventory with no
`lineages`, so the stat sheet and swap preview still ignore cards (the §1.3 known
limitation is open). The client half — the tree panel, the `card-fx` handlers per
`LineageFxKey`, and the stat-row trail — is the client session's.

### Phase 1.5 progress note — bot profiles, the lane matrix, and lineage telemetry (2026-10-01)

**Built.** All four deliverables. `pnpm typecheck` clean; the lineage suite (9/9, including
two new files) plus the bot route / tier-entry / gameplay-telemetry / admin subsets pass.
**No magnitude in `magnitudes.ts` was touched** — `shared/src/data/lineages/` is
byte-identical to the Wave 1 merge, as §1.5 asks.

- `bot/src/tierEntry/profiles.ts` — `LINEAGE_LANE_REFERENCES`, twenty rows: five weapon
  lineages x (three lanes + one lane-less control). `TierEntryProfile` gained `lane` and
  `lineages`; `applyTierEntryProfile` merges the declared cards onto the trees the held
  forms open; `validateProfile` now pays the same gates a purchase pays. They are a
  SEPARATE map from `TIER_ENTRY_PROFILES`, whose test asserts that catalogue's exact size.
- `bot/src/route/types.ts` / `executor.ts` / `net/intents.ts` — `unlockCard` and
  `setActive` steps. Prices come from the magnitude table at runtime, and the farm target
  is the first T1 biome that can actually field a family dropping the card's lane, not the
  lineage's home biome (finding 2 below). Never exercised against a live server — no
  Docker in this session.
- `server/bench/lineageLaneMatrix.ts` — the matrix. 20 profiles x 18 blends x 2 seeds,
  90 s of sim per cell per seed, 45 min wall clock. `reports/progression-phase1/lane-matrix.md`.
  `LANE_REPLAY=<lane-matrix.json>` rebuilds every table without re-measuring.
- Telemetry — `lineage.card-unlocked` / `.card-swapped` / `.gate-paid` as their own
  `GameplayPayload` kind, emitted from the four economy handlers.

**Headline: no packet is inside the ±10% budget band, and Tempo is thirteen times
Empowered.** Mean lane uplift over the lane-less control, averaged over all eighteen
blends and over the lineages carrying the packet:

| packet | lineages | mean uplift | x median | payoff fx fired | favouring T1 node |
|---|---:|---:|---:|---:|---|
| tempo | 3 | +16.7% | 2.03x | 1921 | `node-t1-mountain-03` |
| engagement | 2 | +9.5% | 1.15x | 452 | **none** |
| affliction | 2 | +9.2% | 1.11x | 4563 | `node-t1-swamp-01` |
| control | 2 | +7.3% | 0.89x | 1016 | `node-t1-mountain-02` |
| kill-chain | 3 | +4.5% | 0.55x | 838 | `node-t1-cave-03` |
| empowered | 3 | +1.3% | 0.16x | 535 | `node-t1-forest-02` |

Median +8.2%; band +7.4% to +9.1%. The `fx fired` column explains most of the ordering:
Affliction's `poison-stack`/`hemorrhage` fire on EVERY hit, Tempo's echo every third,
Empowered's once per class-mechanic firing, Engagement's once per pull. `PACKET_BUDGET` is
a flat 1.0 for all eight, so it is currently paying a per-hit payoff and a per-pull payoff
the same scalar. Tuning it is one column in one table; the numbers above are what to tune
against.

**Four findings the code forced, which the plan's sketch and §1.5's brief both assumed away.**

1. **There are not five distinct encounter compositions per T1 biome.** `biomeTier:
   input.tier` in `authoring.ts` means every T1 node fields only `monsterPoolByTier[1]` —
   two mobs per biome — and every biome's third family debuts at biome tier 2, so
   `resolveNodeBlend` drops it and rescales. The twenty-seven authored T1 nodes collapse to
   **eighteen** distinct spawn cycles: 4 Plains, 4 Forest, 4 Mountain, 5 Cave, **1 Swamp**
   (all six Swamp nodes are 100% Mire). Three authored blends per biome resolve to the same
   two-family vector as another. A lane-versus-family contrast that needs the third family
   does not exist yet and is reported unmeasurable, not filled in.
2. **No T1 family drops the Engagement shard**, so the Rapier's and the Hammer's Lane C
   cannot be bought from T1 kills at all — Plains Sky is its only family and its one mob
   (savanna-hawk) debuts in the T2 pool. The harness credits those shards and says so per
   row. `LANES_WITHOUT_T1_SHARD_SOURCE` is recomputed from the pools and the family table
   by `laneProfiles.test.ts`, so the entry cannot outlive the gap.
3. **`FamilyDefinition` has no `favours` field.** §9 asks every family to name the lane it
   favours and the lane it punishes; the shipped table carries `drops` and `punishes`. The
   matrix reads `drops` as favoured and says so. Either §9 or the family table has to move.
4. **`kill` + `contagion` can never fire.** `lineageCards.ts`'s `kill` listener passes the
   corpse as the target, with a comment saying contagion needs it; `applyPayoff`'s
   `ON_TARGET` guard then rejects any target with `hp <= 0`. The Dagger's whole Kill-chain
   payoff row (`dagger-t1-kill-chain-payoff`, Plaguebearer) fired **0 times in 36 cells**.
   Left unfixed on purpose — it is a combat-runtime change in Wave 1's module — but it is
   the first thing to fix after the merge.

**Two instrument decisions, because §9 as written is not measurable on this reference set.**

- The five lineages wear five different class roots, so absolute throughput is mostly the
  class: the five lane-less controls span +20.9% to -13.5% of their own median before any
  card is bought. Every reading is therefore given twice, absolute and control-relative.
  Worse, §9's "±10% of the tier median on that lane's intended variant" compares rows
  measured on DIFFERENT nodes, and the favoured nodes differ in mob HP by more than 2x
  (forest-02's slimes give 14 kills/min where cave-03's lurkers give 6), so the absolute
  band cannot be met by construction. The uplift reading is the usable one.
- "Does the punished lane still clear?" uses §9's own ~70% floor rather than a death count:
  the harness revives in place exactly as auto-combat does. Every punished lane cleared on
  all eighteen blends.

**Other things the bench found.** The Axe's Empowered lane pays exactly nothing on Plains
and Swamp (fx 0, TTK byte-identical to its control) because `mechanic-fired` on the dot
root needs the class DoT stack to reach max, and low-HP swarm mobs die first. Mountain's T1
pool is now 50-80% ridge-archer on four of its five nodes after the family de-duplication,
and every class's TTK there is 2-4x its Plains TTK. The T1 band is 120 essence and 11
family kills per lane, against a farm rate of 15-60 kills per 90 s, so shards do not gate
the T1 tree at all — except Engagement's, which gate it absolutely.

**Where the numbers live.** `reports/progression-phase1/lane-matrix.md` (throughput and the
two checks, all eighteen blends) and `lane-survival.md` (the same bench on five nodes, one
per fieldable family, with the survival columns). Both carry their `.json` so
`LANE_REPLAY` can rebuild the tables without re-measuring. At T1 with +N gear every build
holds 93-99% mean HP while engaged, so survival has no headroom to discriminate: the only
measurable defensive effect is Engagement's opening DR at -7% damage taken. The defensive
lanes therefore cannot be validated at T1 on these reference builds; that is Phase 4's job
with armor, charm and boots trees in hand.

**Still open for §1.5.** The `unlockCard`/`setActive` route steps have never run against a
live server, so the playtest metrics (time-to-first-card, swaps per session) are wired but
unobserved. No `pnpm bench:balance` entry was added; the matrix is its own entry point.

---

## Phase 2 — Variants, shards, and removal of the old economy

### 2.1 Node authoring

- `WorldNodeAuthoring.modifier` is replaced by `blend: Partial<Record<FamilyId, number>>`
  (shares sum to 1). `buildRegionNodes` takes a per-biome `blends: Blend[]` list; its
  length sets the node count (this replaces the modifier list as the count source, so
  the `map/authoring.ts` warning moves with it). Region T1 authors five blends per biome.
- `shared/src/data/families/` defines `FamilyId`, each family's biome, mob ids, the shard it drops
  and the punished packet. Families must partition each biome's existing pool.
- Spawning (`server/src/systems/world/spawning/index.ts`): pick the family by the node's
  blend, then a mob within the family. Deterministic cycling per family rather than
  `Math.random()` is preferred so a 70/20/10 node visibly reads as 7-2-1.

### 2.2 Shards and capstones

- `TracksProgression.shards: Record<PacketId, number>` and
  `capstones: Record<string, number>` (keyed by biome) replace `catalysts` and
  `catalystProgress`. `rewards.ts`: on kill, `shards[family.shard] += round(base ×
  SHARD_TIER_MULT[tier] × rewardMult × debugMult)`; a boss kill adds one capstone for its
  biome. `SHARD_TIER_MULT` sits next to `BIOME_ESSENCE_TIER_MULT` in `gameConfig.ts`.
  Remove the catalyst accumulator and its config keys.
- Family data (`shared/src/data/families/`) names the shard each family drops, so the
  family → packet mapping is one field, and the coverage test checks every packet has ≥2
  family sources per tier.
- Map: node info shows the dominant family and its shard icon; the boss band shows the
  capstone material. Materials panel lists essences, the eight shards, and touched
  capstones; catalyst rows and icons go.
- Migration 0009: wipe `catalysts`/`catalystProgress`; wipe `itemUpgrades` and refund
  the essence spent (sum of the item's authored upgrade costs for its level); log the
  refund per character. `LEGACY_ITEM_IDS` handles nothing here.

**Built 2026-09-30 (Phase 2a, `feat/variants` off `feat/lineage-data-model`).** §2.1
plus the map half of §2.2. Shards and capstones were already live from 1b, so the reward
seam is untouched; catalysts, modifier math and reward multipliers all still stand — that
is §2.3/Phase 2b. Nine deliberate differences from the sketch above, and the code is the
authority where they disagree:

1. **`blend` is optional, and T2–T4 carry none** (designer decision, taken 2026-09-30).
   The sketch's fallback of "an even blend over a synthetic family per biome" was
   rejected: nothing fake enters `FamilyId`, and the families partition test stays
   honest. Spawning falls back to today's flat biome-pool roll for any node with no
   blend, which is every dungeon, every sanctuary, the Clearing, and all of T2–T4.
2. **Node-count source, region by region.** T1 is on the blend list
   (`RegionAuthoringInput.blends`, `regionT1.ts`); **T2, T3 and T4 are all still on the
   modifier list**. `normalNodeCountForBiome` reads whichever exists, and the count
   warning moved off `allowedModifiersForBiome` onto the `blends` field. Phase 2b, which
   deletes modifiers, must give T2–T4 a count source in the same commit — and T2–T4 have
   no family tables, so that means either authoring them or a different count source
   (a plain per-biome node count would do).
3. **T1 node counts are UNCHANGED: mountain 5, cave 6, forest 5, plains 5, swamp 6 = 27.**
   Not the five-per-biome the sketch names. Three things are welded to the modifier count:
   the hand-cut T1 mask (27 normal cells exactly, and `allocateNormalCellsByBiome` throws
   if the capacities do not consume every cell), `validateBiomeCoverage` (one node per
   allowed modifier, two for the native), and the display names, which still come from
   the modifier. So `buildRegionNodes` now **throws if a biome's blend list and modifier
   list disagree in length**, which is the seam Phase 2b opens: delete modifiers, re-cut
   the mask to 25, drop the two extra blends, and update `EXPECTED_NORMAL_COUNTS`
   (27 → 25) and the 170-node snapshot with it.
4. **`modifier` survives on `WorldNodeAuthoring`, marked `@deprecated`.** Removing it
   breaks far outside this phase: node display names (`displayNames.ts`), monster stat
   scaling (`createMonster`, `monsterMechanics.ts`), reward multipliers (`rewards.ts`),
   `World.ts` telemetry, `NODE_MODIFIERS`, the arrival HUD, the tutorial's node targeting,
   the bot's route conditions, and `tools/tier-table.ts`. Phase 2b deletes the field with
   the machinery.
5. **⚠ THE HEADLINE GAP — T1 monster pools cannot field the blends.** The family table
   spans tiers: a biome's three families are spread across its T1/T2/T3 pools, and each
   T1 pool holds only two mobs. Plains T1 fields Herd and Swarm but no Sky; Forest fields
   Pack and Grove but no Canopy; Mountain fields Ridge and Hopper but no Crag; Cave fields
   Brute and Deep but no Brood; **Swamp T1 fields only Mire** — both of its mobs are Mire,
   so all six Swamp nodes resolve to a single family. So `resolveNodeBlend` resolves an
   authored blend against the node's own tier pool, drops the families that tier cannot
   field, and re-scales the shares over what is left. The authored blend is the design
   target; the resolved blend is what spawns and what the panel shows, so a node can never
   advertise a family it does not field. **Closing this needs a third T1 mob per biome
   (new monster numbers, the designer's call) — it is not a code fix, and it is beyond
   bible open decision 2, which only asks whether the Mountain/Cave/Swamp families are the
   right ones.** Mountain, Cave and Swamp families remain PROPOSED.
6. **Cycling is quantized to ten slots** (`BLEND_SPAWN_SLOTS`), by largest remainder and
   then spread so the dominant family does not arrive in one block. Ten because 70/20/10
   should read as 7-2-1 in a single visit; the cost is that a resolved share of 0.647 is
   met as 6/10, so the tests assert "within one mob per ten slots" and then assert that
   thirty spawns are exactly three identical cycles. A share finer than 10% rounds away.
7. **The cursor is per world, in a `WeakMap`, and advances on the pick** — not on a
   successful placement, because a type that terrain or spacing will not accept would
   otherwise be re-picked forever and stall the node. Per world so a bench never inherits
   the live sim's cursor. Nothing is persisted or networked; a fresh world opens every
   node on its dominant family.
8. **A family's spawn list is deduplicated.** T1 mountain lists `cliff-hopper` twice to
   weight the old flat roll; inside a family the blend's share is the weight now, so the
   duplicate would only alternate two copies of one mob. Pool duplication as a weighting
   lever dies with the flat roll.
9. **Blends govern PICKS, not headcount.** A pack alpha still fields its followers, so on
   a Pack-dominant Forest node the Pack's share of bodies runs well ahead of its share of
   picks (one `wolf` pick is three wolves). Intended — that is the pack system — but it
   means "70% Herd" is 70% of spawn events, and the panel says "of spawns here".

Map surface: the node panel's headline band is now the families, their shares and their
shards (`ShardIcon`, a lane-coloured glyph, in `ModifierIcon`'s place), with a `Mobs`
summary row above the fold and the families this tier is missing listed as absent — so
gap 5 reports itself in game. A dungeon's boss band names the capstone material it drops
on every kill. Nodes with no blend keep the modifier band, so nothing lost its explanation
mid-phase; Phase 2b deletes that branch.

Tests: `server/test/variantBlend.test.ts` (authoring, the cycle, and a thirty-spawn world
run), the blend join added to `server/test/lineageMaterials.test.ts`, and blend shape and
coverage folded into `validateWorldMap` so dev boot catches a malformed blend.

### 2.3 Removal

- Delete `nodeModifiers.ts` math, `NODE_MODIFIER_FAMILIES`, `nodeModifierMap.ts`, the
  catalyst cost fields on recipes/upgrade steps, `inventory:upgradeItem`,
  `crafting:evolveItem`, `UpgradeTab`, `EvolutionPreview`, `ModifierIcon`, and the
  reward multipliers keyed by modifier. Keep `Recipe.upgrades` only if a non-weapon slot
  still reads it until Phase 4; otherwise delete now.
- Tests to retire: `catalystRekey`, `nodeModifiers.wiring`, `evolutionPreview`,
  `rewardMultiplier` (rewrite for shards). Tests to add: `variantBlend.test`
  (shares sum to 1, spawn composition matches within one mob), `shardDrop.test`,
  `upgradeRefundMigration.test`, and the family half of `coverage.test`.
- Docs: archive `aspects-catalysts-current-state.md`, `node-modifiers-current-state.md`,
  `gear-evolution-current-state.md` with the one-line header; write
  `lineages-current-state.md` and `variants-current-state.md`; update
  `system-rework-status.md`, `economy-philosophy.md` §2 (shards, not catalysts), and
  `map-variety-plan.md` (modifier vocabulary superseded).

**Built 2026-10-01 (Phase 2b, `feat/remove-old-economy` off `feat/lineage-data-model`,
after Wave 1).** The old economy is gone: catalyst wallet, node-modifier gameplay
math, and the weapon `+N` ladder. Four conductor scope overrides reshaped this
pass from the sketch above (overrides win where they conflict with it):

- **Override A** — the `+N` ladder survives for armor, charm (recovery), and
  boots (mobility); only the **weapon** slot's ladder, evolution, and
  reconstruction are gone (`checkUpgrade`/`checkEvolve`/`checkReconstruct` reject
  `slot === 'weapon'` outright; `getMaxUpgrade` is 0 for weapons). `Recipe.upgrades`,
  `UpgradeTab`, `EvolutionPreview`, `inventory:upgradeItem`, and
  `crafting:evolveItem` all survive for the three non-weapon slots — the sketch's
  "keep `Recipe.upgrades` only if a non-weapon slot still reads it" is exactly
  what happened.
- **Override B** — node modifiers were NOT deleted, degrading instead to T2–T4
  node authoring identity only (node count source, display names, region masks),
  with every gameplay effect (stat scalars, population scaling, reward premiums)
  removed. `nodeModifiers.ts`/`nodeModifierMap.ts`/`NODE_MODIFIER_FAMILIES`
  survive in reduced form — see `variants-current-state.md` §1-2 and the archived
  `node-modifiers-current-state.md`'s header for the exact surviving surface.
- **Override C** — the migration (`0009_progression_rework.sql` + a
  `refundWeaponUpgradeEssence` hydration step in `playerRepo.ts`) wipes the
  catalyst wallet outright and refunds **only weapon-slot** `itemUpgrades`
  entries, as essence, from a frozen historical cost table
  (`server/src/db/weaponUpgradeRefund.ts`, captured from the recipe data right
  before weapon `upgrades` arrays were deleted). Non-weapon `itemUpgrades`
  entries are untouched — their ladder survives, so there is nothing to refund.
- **Override D** — tutorial weapon-upgrade beats and catalyst dialogue are gone
  from `shared/src/tutorial/scripts/`; armor/charm/boots upgrade beats and the
  arc shape are untouched. `bot/src/routes/t1GearPlans.ts` needed the identical
  treatment (it is the data `plans.ts` was ported from, and is independently
  consumed by the bot's own T1 route tests).

**Divergences from the sketch, and open items for the designer:**

1. **⚠ T3/T4 weapons are currently unreachable — the most important open item.**
   The weapon lineage tree (Phase 1a/1b) only wires T1→T2 forms for all five
   lineages. No lineage has a T3 or T4 `LineageForm`. Every T3/T4 weapon recipe
   still has `evolvesFrom` set, so it was already blocked from plain-crafting
   (pre-existing rule) and is now also blocked from evolve/reconstruct (Override
   A) — with no lineage form to unlock instead. This is a sequencing gap between
   "retire the old weapon ladder now" and "the new one only reaches T2 so far,"
   not a mistake in either phase alone, but it needs a decision before T3/T4 is
   played: an interim exception, fast-tracked T3/T4 lineage-form + capstone
   authoring (content design, out of scope here), or an accepted gap. Full
   detail in `lineages-current-state.md` §3 and the archived
   `gear-evolution-current-state.md`'s header.
2. **T1's vestigial `modifier` field was left in place, not removed.** The sketch
   and the Phase 2a note both flagged "Phase 2b deletes the field [from
   `WorldNodeAuthoring`] with the machinery" and "re-cut the mask to 25, drop the
   two extra blends, update `EXPECTED_NORMAL_COUNTS`." That is a real, coupled
   authoring change (T1 mask resize, blend-list trim on Cave/Swamp, display-name
   re-plumbing for blended biomes) that Override B's literal text does not
   require (it only commits to what T2–T4 keeps) and this pass's deliverables
   did not name. Deferred rather than attempted under this pass's remaining
   budget — every T1 node today still carries both a blend and an inert
   `modifier` field, and `buildRegionNodes` still throws if the two lists'
   lengths disagree, exactly as Phase 2a left it. See `variants-current-state.md`
   §2.
3. **`shardDrop.test` was not added** — `server/test/lineageMaterials.test.ts`
   (Phase 1b) already pins deterministic shard/capstone drops end to end
   (per-kill amount, family partition, boss-pays-capstone), so a second test
   would have duplicated it rather than covered a gap.
4. **Test disposition vs. the sketch:** `catalystRekey` and `nodeModifiers.wiring`
   were retired exactly as planned (nothing survives for either to test).
   `evolutionPreview` was **adapted, not retired** — Override A means
   `EvolutionPreview` is still live for armor/charm/boots, so the test narrowed
   to those three slots and gained a case asserting the server rejects weapon
   evolve/reconstruct. `rewardMultiplier` was rewritten for shards/capstones as
   planned. Fixing the full regression surface also required rewriting
   catalyst-schedule assertions out of `t2ProgressionEconomy.test.ts`,
   `t3ProgressionEconomy.test.ts`, and `t4ProgressionEconomy.test.ts` (large
   pre-existing frozen-cost audits with entire sections devoted to the deleted
   catalyst schedule and family assignment), plus smaller weapon-ladder fixes in
   `mobilityBoots`, `equippedEvolutionAbilityTags`, `tierEntryBootstrap`,
   `resetProgress`, `farmLoop`, and two bot route tests
   (`t1EconomyCompatibility`, `campaignBoss`) that assumed weapons still reached
   a `+5` boss loadout.
5. **Docs were archived exactly as the sketch names them**, including
   `gear-evolution-current-state.md`, even though most of its content (armor
   niches, charm roles, the historical weapon-ladder-normalization rationale)
   remains true for the surviving non-weapon slots. Its archive header says so
   explicitly and points back to it as the live reference for those slots'
   historical values — there is deliberately no new `gear-upgrades-current-state.md`
   fork, to avoid two documents drifting apart over one still-live mechanism.
6. Historical/variant bot route files (`*V2T1.ts`, `*MurkEyeOnlyT1.ts`,
   `squireHeavyHammerT1.ts`, `apprenticeLetDotsFinishT1.ts`, etc.) still contain
   inline weapon-upgrade steps and were left untouched: they are outside
   `T1_CONTROLLED_ROUTE_IDS`, excluded from `t1Routes.semantic.test.ts`'s
   validation by name pattern, and never executed by `pnpm test` (they require a
   live server). Frozen historical artifacts, consistent with repo convention —
   not fixed, not validated, not run.

**Exit.** Playtest: players say where they went to farm and why, and name the shard they
were after. Bench: the favoured lane wins each family by ~30% and the punished lane still
clears.

---

## Phase 3 — Frame loops and range nodes (class-by-class review first)

- **Review session DONE 2026-10-01** → `docs/briefs/frame-loops-2026-10-01.md` is the
  authoring input (all six roots, all range rows; Consort loop still open; T3 re-homes
  deferred to a T3 review after the rework).
- **Review session before any authoring.** Walk the six roots with the designer and write
  a one-table brief per root: the loop container for each frame (timed window, stack
  bank, or the root's own analogue), the Heavy rider, and the Mid-range mechanic for that
  root. Cadence and cooldown have a finisher to hang the loop on; dot, reload, energy and
  summoner do not, so their containers are decided in that session, not assumed. The
  brief goes in `docs/briefs/frame-loops-<date>.md` and closes bible open decision 1.
- Then: frame nodes in `rootsAndFrames.ts` gain the containers as `mechanicEffects`,
  consumed in each root's prototype (`cadencePrototype.ts`, `cooldownPrototype.ts`, and
  the dot/reload/energy/summoner equivalents), routed through `empoweredMultiplier`.
  Heavy's rider uses the existing stagger or plating-shred hooks.
- HUD stack counter and window clock (shared with Phase 1's HUD work).
- Range nodes: each root's Mid node gets its own mechanic from the brief; Close and Far
  gain the loop interactions. Range stays a leaf; nothing downstream reads it. The
  `isRangedCombatant` seam is untouched.
- Tests: `frameLoops.test` (window shorter than cycle; stacks capped at threshold−1;
  uptime rises with attack speed), `rangeMechanics.test` per root.

### Phase 3 progress note — frame loops: Striker, Squire, Apprentice (2026-10-01)

**Built.** The three melee/dot roots' frame loops on `feat/frames-melee-dot`, from
brief §1. Slinger / Spirit / Conduit are a sibling task; range nodes are not started.
`pnpm typecheck` clean for `shared`, `server`, `client` (see divergence 6 for `admin`).
Tests run: `frameLoops` (new), plus `mechanicFired`, `cadenceClassSelection`,
`cooldownClock`, `skillTreeMechanicCopy`, `skillTreeData`, `describeText`,
`hudStatusTooltips`, `lineageDebuffComposition`, `lineageDots`, `lineageCards.wiring`,
`lineagePlatingStack`, `relics`, `relicMechanicEffectCoverage`, `coreRelicIntegration`,
`skillPreview`, `tier2SkillPropagation`, `monsterDotBuffIcons`, `tundraChill`,
`tundraClassFramePacket`, `classAffinity`, `attackProgression`, `balanceInstruments`,
`bossDeclaration`, `tierEntryBootstrap`, `shared/protocol/characters`,
`shared/protocol/tier1Snapshot`, `shared/systems/mechanicEffectScaling` — all green.

Authored keys, one `<root>.frame-*` family per container:

| Frame | `mechanicEffects` added |
|---|---|
| Flurry (`cadence-light`) | `cadence.frame-window-ms` 1600, `cadence.frame-window-mult` 1.3 |
| Skirmisher (`cadence-balanced`) | `cadence.frame-window-ms` 800, `cadence.frame-window-mult` 1.15, `cadence.frame-charge-per-stack` 0.1 |
| Breaker (`cadence-heavy`) | `cadence.frame-charge-per-stack` 0.2, `cadence.frame-stagger-ms` 750 |
| Warrior (`cooldown-light`) | `cooldown.frame-window-ms` 2000, `cooldown.frame-refund-ms` 300 |
| Knight (`cooldown-balanced`) | `cooldown.frame-window-ms` 1000, `cooldown.frame-refund-ms` 150, `cooldown.frame-charge-cap` 4, `cooldown.frame-charge-per-stack` 0.1 |
| Bulwark (`cooldown-heavy`) | `cooldown.frame-charge-cap` 8, `cooldown.frame-charge-per-stack` 0.2, `cooldown.frame-shred-pct` 0.15, `cooldown.frame-shred-duration-ms` 6000 |
| Venom vessel (`dot-light`) | `dot.frame-opener-stacks` 4 |
| Ember mage (`dot-balanced`) | `dot.frame-max-stack-mult` 1.4 |
| Rime-Bound (`dot-heavy`) | `dot.chill-max-stacks` 3, `dot.chill-move-slow-per-stack` 0.02, `dot.chill-attack-slow-per-stack` 0.02, `dot.chill-duration-ms` 4000 (existing keys, frame magnitudes) |

Every number above is a placeholder for the designer's hand-edit after the bench.

**Divergences from the brief and the plan, recorded because the code won.**

1. **The window is clamped by the runtime, not trusted from the node.** The brief
   says a window must be shorter than one cycle; authoring alone cannot promise that,
   because the cycle moves with attack speed, haste, relics and Rampage. So
   `resolveFrameWindowMs` caps every window at 60% of the LIVE cycle, and the
   authored value is a ceiling. Uptime therefore rises with attack speed until the
   clamp binds, and is flat at 60% past that — a deliberate ceiling on the Light
   container, not an accident.
2. **The Striker's bank cap is derived, the Squire's is authored.** The brief says
   "cap threshold−1" for both Heavy frames. Cadence owns a threshold, so its cap is
   `threshold − 1` with no key. A cooldown cycle is TIME: a derived cap would scale
   with attack speed and hand fast weapons a bigger bank, so `cooldown.frame-charge-cap`
   is authored. The plan's "stacks capped at threshold−1" test line therefore holds
   literally for the Striker and as "capped at its authored cap" for the Squire.
3. **The bank grows the mechanic's own multiplier.** "Finisher scales with stacks
   spent" is implemented as `empoweredMultiplier + bank × per-stack`, applied as the
   ratio between the two totals so nothing re-derives a pre-empowered base, and the
   recorded multiplier ends up as the one honest number a Technique rider reads. No
   second multiplier key, and the Ember bonus and the Flurry window fold the same way
   (multiplicatively, exactly as a `damage-window` card already does).
4. **Winter Warden's chill keys are now deltas.** The brief says Rime-Bound reuses
   `dot.chill-*` at frame magnitudes and that Winter Warden "keeps deepening the same
   chill". Passives SUM, so leaving the path's absolutes alongside the frame's would
   have given it 12 stacks at 7% each. Its node now authors the delta (6 stacks, 3%,
   2000ms) and still resolves to the 9 / 5% / 6s its copy promises. The frame's own
   chill application stands down whenever `dot.freezing-cold` is present, so the two
   never advance the record twice per hit and the freeze is not duplicated. The node's
   tooltip rows now read as deltas (the same shape `cadence.threshold-mod` already has);
   its hand-written description is unchanged and still states the resolved numbers.
5. **Pyromancer still overlaps Ember Mage — NOT resolved here.** Brief §1 flags that
   the T3 path does what the Ember frame now does; per the task that is noted, not
   fixed. The frame's bonus and the path's own max-stack payoff both fire today. It
   belongs to the T3 review after the rework, together with the Venomslinger and
   Winter Warden re-homes the brief already lists.
6. **Seams NOT reached.** (a) No client renderer for the weapon glow: the
   `frame-charge` event is on the wire with an authoritative `stacks`/`max`, but
   `client/src/render/combatFx.ts` has no handler, so nothing draws yet (an unknown
   event kind draws nothing). Left unclaimed deliberately — the sibling task emits the
   same event, and one renderer should serve both. (b) No authored art for the
   `frame-window` / `frame-charge` tiles; they are registered in `conceptIcons` the way
   the Phase 1c lineage tiles are, with the PNGs still to come from `art:`. (c)
   `npx tsc -p admin/tsconfig.json` fails on `--ignoreDeprecations` in this worktree,
   pre-existing and unrelated (no admin file is touched).
7. **The frame-charge per-stack keys report as raw numbers in tooltips.** `+0.2` rather
   than a percentage: the value is in multiplier POINTS, so `passiveText`'s percent
   list would have said "+20% damage", which is false on a ×4 finisher. The node
   descriptions carry the real sentence instead; `client/src/ui/describe/passiveText.ts`
   is untouched.
8. ~~**OPEN, cross-cutting: a Technique rider compounds with a frame window.**~~
   **CLOSED 2026-10-01 in `5d02eb2f`, endorsed by the designer as the
   one-multiplier rule.** `addEmpoweredDamage` (`abilityEffects.ts`) divided the hit
   by `empoweredMultiplier` only when `empoweredAttack` was also set. A frame window —
   like a lineage `damage-window`, which has had this shape since Phase 1c — records
   the multiplier WITHOUT claiming the mechanic fired, because setting
   `empoweredAttack` would restart cooldowns and fire every `mechanic-fired` card, so
   a rider landing inside a window scaled off the boosted hit. The divisor is now read
   unconditionally: `empoweredMultiplier`, not the marker, is the source of truth, which
   is what both CLAUDE.md's axiom and `lineageCards.ts`'s own docstring already said
   ("a Technique rider reading `empoweredMultiplier` sees one honest number").

   It does move lineage-card numbers as well as frame numbers, which is why it was
   raised rather than patched inside the task — and why it was fixed BEFORE the lane
   bench reran, so the bench did not measure the defect and get tuned against it. The
   regression case is in `abilityTechniqueRune.test.ts`, on Quick Strike rather than
   Expose Weakness: Expose Weakness pays its 15% as a damage-taken debuff and never
   reaches this code at all.
### Phase 3 progress note — Slinger, Spirit and Conduit frame loops (2026-10-01)

Implemented from `docs/briefs/frame-loops-2026-10-01.md` §1 for the three RANGED
roots. The melee roots (cadence, cooldown, dot) and the range nodes are separate
tasks. Containers are `mechanicEffects` on the frame nodes, consumed in each root's
prototype; every damage change folds into `ctx.metadata.empoweredMultiplier`.

**Keys authored**, per frame node in `shared/src/data/skillTree/rootsAndFrames.ts`:

| Node | Frame | Keys |
|---|---|---|
| `reload-light` | Scout | `reload.frame-opener-rounds` 2, `reload.frame-opener-mult` 1.3 |
| `reload-balanced` | Marksman | `reload.frame-last-round-mult` 2.2 |
| `reload-heavy` | Artillerist | `reload.frame-ramp-pct-per-shot` 0.02, `reload.frame-ramp-top-mult` 1.3 |
| `energy-light` | Spark | `energy.frame-chain-targets` 2, `energy.frame-chain-radius` 160, `energy.frame-chain-share` 0.35 |
| `energy-balanced` | Wraith | `energy.frame-gain-window-ms` 2000, `energy.frame-gain-mult` 1.6 |
| `energy-heavy` | Phantasm | `energy.frame-overcharge-max` 4, `energy.frame-overcharge-mult-per-stack` 0.15, `energy.frame-stagger-ms` 750 |
| `summoner-light` | Splinter | `summoner.frame-frenzy-window-ms` 900, `summoner.frame-frenzy-aps-pct` 0.2, `summoner.frame-frenzy-onhit-mult` 1.25 |
| `summoner-balanced` | Consort | **none** — the loop is still open with the designer |
| `summoner-heavy` | Effigy | `summoner.frame-link-window-ms` 2500, `summoner.frame-link-charge-per-hit` 1, `summoner.frame-link-max-charge` 5, `summoner.frame-link-slam-mult` 0.3, `summoner.frame-link-stagger-ms` 750 |

New runtime files: `server/src/systems/classes/archetypes/{reload,energy,summoner}/frameLoop.ts`.
HUD: `reload-frame-ramp`, `energy-frame-surge`, `energy-frame-overcharge`,
`summoner-frame-frenzy`, `summoner-frame-link`, plus the `frame-charge` combat event
for the charge glow (added immediately after `card-fx`; W1-A adds a byte-identical
block for the melee roots). Tests: `server/test/frameLoopsRanged.test.ts` and the
summoner case in `server/test/mechanicFired.test.ts`.

#### `mechanic-fired` for the summoner moved

The 1c call site (`summoner/command.ts`, `applySummonerCommand`) is **gone**. A
command is a click, and a card keyed to a click never fires for an idle player. The
moment is now the FORMATION CYCLE, emitted from an `onHit` listener in the summoner
`frameLoop.ts` on `ctx.formation.cycleCompleted` with the `ctx` as the latch. That
state already existed and was already authoritative (`prepareCycle` / `commitCycle`
in `formationAttack.ts`); a full dodge and a cancelled swing both return before
`onHit`, which is exactly where `commitCycle` declines to commit, so one completed
cycle is one emission. The `mechanic-fired` module header table is updated to match.

#### Warmonger

`reload-heavy-t3-b` keeps its authored ramp data (`reload.hair-trigger*`, 15 stacks
on a 40-round clip). Its RUNTIME defers: the handler in
`reload/t3/pipeline/lightPaths.ts` early-returns while
`reload.frame-ramp-pct-per-shot` is present, and its buff tile hides, because both
ramps write `clipSpeedStacks` and the attack cooldown and two writers per shot would
double the stacks. The frame wins. The agreed re-home — **half the ramp carries
through a reload**, turning a per-clip climb into a sustained one — is NOT designed
here; it belongs to the T3 review of the whole class, together with the other
re-homes the brief notes.

#### Divergences from the brief, for the designer

1. **Phantasm's "energy above the cap" needed a different container than the words
   suggest.** There is no sustained above-cap state in the energy model: the pool
   arms the discharge and resets to 0, and the armed discharge is consumed by the
   very next hit (`registerEmpoweredMultiplier` consumes on any `onHit`), so a bank
   fed by "hits while full" would be 0 in every real fight. Implemented instead as a
   **raised arming threshold**: the pool keeps taking energy past the cap for
   `frame-overcharge-max` more hits, and each hit's worth above the cap is a banked
   stack on the discharge. Fewer discharges, bigger ones — the Heavy skew — and the
   bank visibly fills on the HUD. It is deterministic rather than a decision, which
   is true of every energy loop, since the root has no manual discharge.
2. **Artillerist's "the top of the ramp adds damage" is proportional, not a band.**
   The damage multiplier is `1 + (top − 1) × stacks / cap`, so it is ×1 on a fresh
   clip and ×top at the top. A fixed "last N rounds" band would have duplicated
   Marksman's shape, and the brief's word for Artillerist is ACROSS.
3. **The Splinter frenzy's on-hit half is not an `empoweredMultiplier` fold.** It
   scales `ctx.formation.onHitMagnitudeWeight`, which `playerOnHitDamage` reads after
   the `onHit` phase. On-hit damage is a separate source added to `ctx.damage`, not a
   multiplier on it, so the one-multiplier-per-hit rule does not reach it; the
   frenzy's attack-speed half rides the per-tick minion resync, the single writer.
4. **The Artillerist ramp's bank is the existing `usesReload.clipSpeedStacks` slice
   field, not a `TracksCombat` resource.** The HUD contract says banks live as
   resources, but that field is already the authoritative ramp count and already
   networked; a parallel resource would be a second source of truth. The energy and
   summoner banks do use `TracksCombat` resources as specified.
5. **A Blunderbuss volley has no clip position.** `reload.blunderbuss` empties the
   clip in one beat, so `beforeAttack` tags only ordinary shots with
   `reloadClipIndex` and the Slinger loop skips volley pellets entirely. Without
   this, Marksman's last-round multiplier would have fired on every pellet.
6. **Consort ships with no loop**, as the brief requires, and the node carries a
   comment saying the container is still open so nobody improvises one.

#### Still open / not reached

- The **client has no handler for `frame-charge`**: the protocol member, the server
  emissions and the HUD tiles are in, but `client/src/render/combatFx.ts` draws
  nothing for it yet (the dispatch is a chain of `if`s with no unknown-kind warning,
  so an unhandled kind is silently ignored). The stack counters and window clocks DO
  render, through the existing buff sync.
- **`frame-charge` is one event per bank change, broadcast to the node**, and the
  Artillerist ramp changes on every shot — so an Artillerist adds one small event per
  swing alongside its `player-hit`. The counts themselves are already on the wire via
  the buff tiles' `stacks`; the event exists because a 5 Hz buff sample cannot tell a
  change from a resend, which is what a one-shot pulse needs. If the client ends up
  drawing a continuous glow rather than a pulse, derive it from the tile and drop the
  per-shot emission.
- **No authored art** for the five new buff ids; each aliases the authored tile of
  the mechanic it is (`reload-frame-ramp` → `reload-hair-trigger`,
  `energy-frame-overcharge` → `energy-overcharge`, `energy-frame-surge` →
  `energy-ac-charge`, `summoner-frame-frenzy` → `summoner-coordinated-hunt`,
  `summoner-frame-link` → `summoner-battle-bond`) in `conceptIcons.ts`.
- **Scout and Marksman have no HUD tile**: their payoff is a clip position, and the
  ammo readout already shows it. If playtest says the empowered round needs its own
  cue, that is a damage-number style, not a buff tile.
- The **`energy.range-far-single-target` key is not authored here** (it is W1-C's
  node). The chain's lookup is by string through a widened view of the passive map,
  so it is correct with the key absent and with it set to 1.
- Magnitudes are placeholders from the magnitude table's shapes (the two staggers are
  its `stun` payoff unit, 750 ms, the ladder's shortest rung). The designer
  hand-edits after the bench.
### Phase 3 progress note — range mechanics and the at-bay layer (2026-10-01, W1-C)

Brief §2 is implemented. Everything is authored as `mechanicEffects` on the range
nodes in `rootsAndFrames.ts` and consumed in ONE new module,
`server/src/systems/combat/rangeMechanics.ts`, registered from `initCombatSystems()`
as `initRangeMechanics` — after `initAllMechanics()`, before `initPlayerAmplifiers`
and defense. Tests: `server/test/rangeMechanics.test.ts`.

**The at-bay band.** `isAtBay(player, target)` is
`hitboxGap(player, target) <= player.performsAttack.attackRange` **and**
`> target.performsAttack.attackRange`, edge-to-edge — deliberately the same measure
`inAttackRange` / `collision.canReach` / the attack gate in `combat.ts` use, so
"inside your reach" means one thing everywhere. Strict `>` on the target's side is
what makes it a band: a monster settled at its own standoff can hit back and is not
at bay; one still walking in, one being kited, or anything a long-reach build simply
outranges, is. Degenerate reaches: a player reach that is non-finite or `<= 0` makes
the band empty; a target `attackRange` that is absent, zero or non-finite is read as
`0`, so such a body is at bay at any gap above contact and never while the hitboxes
touch. "From max reach" is the outer band, `reach × frac <= gap <= reach`, with
`frac` authored per node (`<root>.range-far-max-reach-pct`, 0.75).

**Keys added** (`<root>.range-mid-*` / `<root>.range-far-*`, all in
`shared/src/passives.ts`): Lancer `cadence.range-mid-at-bay-slow-pct|-ms`; Phalanx
`cooldown.range-mid-at-bay-slow-pct|-ms` + `cooldown.range-mid-execution-stagger-ms`;
Enforcer `reload.range-mid-at-bay-slow-pct|-ms`; Shade
`energy.range-mid-discharge-stagger-ms`; Warlock `dot.range-mid-spread-stacks`,
`dot.range-mid-spread-radius`; Phantom-Blade `cadence.range-far-max-reach-pct`,
`cadence.range-far-opener-pct`; Sentinel `cooldown.range-far-max-reach-pct`,
`cooldown.range-far-vuln-pct|-ms`; Harbinger `dot.range-far-stack-cap-bonus`,
`dot.range-far-duration-pct`; Deadeye `reload.range-far-max-reach-pct`,
`reload.range-far-damage-pct`; Wisp `energy.range-far-single-target`. Close nodes and
the Conduit's three range nodes are untouched, and a test asserts it.

**Cross-task seam.** `energy.range-far-single-target: 1` is authored on
`energy-range-far` here; the CONSUMER lands with the energy frame loops (W1-B), whose
chain-count resolution reads the key and, when it is 1, chains to zero targets and
folds the chained share onto the primary. `rangeMechanics.ts` deliberately does not
read it, and the test pins only that the node authors it.

**Divergences from the brief, and decisions the code forced.**
- *Brief:* "the at-bay check is one helper on the player hit seam (distance to target
  vs `target.performsAttack.attackRange`)". *Code:* the helper compares the
  **edge-to-edge hitbox gap**, not centre distance, because centre distance is not
  what any reach test in this codebase means — a 56px-wide slime would read as
  "at bay" while standing on the player.
- *Brief and task:* `isAtBay(player, target)`. *Code:* same signature, no `world`,
  because `hitboxGap` + `posHitboxFromEntity` are pure shared functions; `canReach`
  would have forced the collision index through the seam for no gain.
- *Brief:* Mid's extra effects fire "at reach". *Code:* read as the at-bay band for
  the whole Mid row (Phalanx's execution, Shade's discharge, Warlock's spread), since
  that is the only band Mid authors and the brief's own locked layer defines it.
- *Brief:* Harbinger is "+1 max stack". *Code:* the **delivery** cap on the applied
  `dot` record, not `dot.max-stacks`, which is also the divisor in
  `computeDotClassDamagePerStack` — raising that key would have made the ninth stack
  pay for itself by thinning the other eight. `resolveDotStackCap` already documents
  that split. The cap is bumped once per effect record (latched in the record's own
  `data`) and the longer duration is written as an absolute floor rather than a
  multiply, because a refresh resets `remainingMs` and a multiply would ratchet.
- *Brief:* "stagger uses the existing stun ladder at its shortest duration". *Code:*
  750 ms, authored on each node rather than read from the magnitude table (design
  §18.4: no constants in the runtime; the table's T1 values are untouched). The
  stagger refuses a control-immune or plate-shielded boss via
  `monsterIgnoresControl`, like every other stun; the at-bay slow does not check it,
  matching the `slow` payoff in `lineageCards.ts`.
- *Not in the brief:* the §18.1 max-wins helper moved out of `lineageCards.ts` into
  `combat/status/sharedDebuffRecord.ts` verbatim, because Sentinel is its second
  consumer.
- *Not in the brief:* Phantom-Blade's "new target" is latched per **monster body**
  (`tracksCombat` flag), the same shape `weapon.first-strike-mult` already uses — so
  node freeze/respawn resets it for free and nothing is persisted. It is spent only
  by a hit that actually lands: a blocking evade returns before the latch.
- **Still open / not reached:** no HUD or client work (the opener reuses the existing
  `first-strike` client effect; the at-bay slow, stagger and vulnerability show
  through the existing debuff UI; Deadeye's long shot has no tell of its own). No
  bench pass — every number is a first-pass placeholder seeded off the magnitude
  table's T1 row (slow 20%, stagger 750 ms, vulnerability +15%/4 s) for the designer
  to hand-edit. The brief's other Phase 3 half, the frame loops and their
  Close/Far loop interactions (design §11: "Close builds charge faster on adjacent
  targets; Far extends the Light window"), is not in this task and is not implemented.

---

## Phase 4 — Armor, charm, boots trees; remaining T1 families

- Author the three non-weapon lane matrices per the coverage rule with each biome's
  existing mechanic as Lane A and the frame defensive faces (§3.1) as the payoff
  vocabulary. Two rows per tier (payoff, then amplifier from T2), no stat row.
- Any slot may complete a packet (bible §7). The coverage test requires every packet to
  complete on at least one non-weapon slot per tier; the tree's build readout names where
  the player's active packet completes.
- Mountain, Cave, Swamp families and blends land here after their table is reviewed
  (bible open decisions 2 and 3, including a second T1 source for Engagement shards and
  where Bulwark / Barrier tempo shards drop). Retire `Recipe.upgrades` fully.
- The Phase 0 list of burst-lethal encounters is reviewed here against the new defensive
  cards; reshape encounters only where a face has no answer.
- Tests: extend `coverage.test` to all slots; wiring tests for the defensive trigger kinds.

### Phase 4 input — the monster-shape findings from the 2026-10-01 lane bench

Read against bible §18.9 (median uplift ±3pp; the encounter check is ordinal, with the
margin reported). Per §18.7 `drops` stays the definition of "favours", so where a family
does not reward its declared lane **the mobs are what must move**, not the magnitude.

Ordinal verdict over the 27 T1 encounters: **11 rank above, 9 below, 6 tie, 1 n/a**
(Swamp Stalker punishes Bulwark, which no weapon lane carries). The nine where the
favoured lane ranks BELOW the punished one, worst first:

| family | node | margin | authored blend |
|---|---|---:|---|
| Brood | `node-t1-cave-05` | −13.7pp | 34/33/33 |
| Brute | `node-t1-cave-02` | −12.1pp | 70/20/10 |
| Sky | `node-t1-plains-03` | −11.3pp | 70/20/10 |
| Deep | `node-t1-cave-03` | −9.4pp | 70/20/10 |
| Mire | `node-t1-swamp-01` | −7.7pp | 70/20/10 |
| Canopy | `node-t1-forest-03` | −3.8pp | 70/20/10 |
| Crag | `node-t1-mountain-01` | −3.5pp | 70/20/10 |
| Grove | `node-t1-forest-02` | −3.2pp | 70/20/10 |
| Pack | `node-t1-forest-04` | −2.8pp | 45/45/10 |

**Eight of the nine are the family's own 70/20/10 node** — a node seven-tenths made of
that family, where its declared lane still loses. That is as clean a statement of "the
mobs do not express the family's shape" as the bench can produce.

Two corrections to the brief's framing, both from using the §18.9 reading rather than the
absolute one:

- **Deep is confirmed** (−9.4pp on cave-03), but **three families are worse**: Brood,
  Brute and Sky. Deep is fourth, not first.
- **Herd is NOT a failure.** It ranks ABOVE on plains-01 (+2.9pp) and ties on plains-04
  and plains-05. It reads negative only in the absolute column (−7.5%, −6.5%, −4.4%),
  which is exactly the reading §18.3 and §18.9 retire — absolute throughput on a Herd
  node is mostly "a Broadsword against boars". The overnight report's "Plains Herd
  punishes nothing and rewards its declared victim" was that same absolute artefact.

Herd is worth one look anyway, because a tie on two of three nodes is a family with no
measurable shape in either direction; but it is not evidence of an inverted answer and
should not be prioritised over the three above Deep.

**Exit.** A pure-lane build completes its packet across three slots and the bench shows
the cross-slot completion as a measurable step (not a stat drift).

### Phase 4 progress note — authoring half, defensive trees (2026-10-01)

**Built.** The AUTHORING half only (data, not the family/blend review) on
`feat/defensive-lineages`. `pnpm typecheck` clean; lineage suite 7/7, plus
`attackProgression`/`evasion`/`monsterStyleCoverage`/`playerKillLunge`/`remotePlayerAttack`
(the `combatFx.ts`-touching suites) and `rewardMultiplier`, all green. PROVISIONAL —
design §17 is itself unapproved, so every file below is flagged in its header and none of
this is final.

- Fifteen lineages in `shared/src/data/lineages/`, five per non-weapon slot, lanes from
  design §17's matrix, Lane A = the biome's existing mechanic per slot: **armor** `robe`
  (Plains), `bindings` (Forest), `plate` (Mountain), `hide` (Cave), `wrappings` (Swamp);
  **recovery** `stone` (Plains), `heartroot` (Forest), `barrier` (Mountain), `pulse`
  (Cave), `eye` (Swamp); **mobility** `fleet` (Plains), `wraps` (Forest), `treads`
  (Mountain), `wing` (Cave), `marsh` (Swamp). Each: one T1 payoff card per lane (no stat
  row) off the biome's T1 recipe, a T2 capstone crowning Lane A off the biome's T2
  recipe. `card.face` is derived via the new `packetDefaultFace()` (`packets.ts`), never
  hand-authored.
- Eight new `LineageFxKey`s, one per packet, reused by BOTH a lane's T1 payoff card and
  the capstone that crowns it (a deliberate simplification — see divergence 3):
  `tempo.evasive-blur`, `engagement.sidestep-blur`, `control.chill-blur` (Avoid, blur
  grammar); `kill-chain.recovery-pulse`, `barrier-tempo.ward-shell`,
  `affliction.toxic-pulse` (Sustain, pulse/ward-shell grammar); `bulwark.plating-chip`,
  `empowered.guard-spark` (Endure, plating-chip grammar). Client handlers in
  `combatFx.ts` all reuse the six existing primitives (ghost-strike, aoe-ring,
  plating-crack, pips, flash) — no new drawing code.
- `coverage.test.ts` extended to all four slots: the per-lane-per-row loop now skips
  `stat` for non-weapon slots (design §4); the coverage check splits into a weapon
  per-slot rule and a **non-weapon combined-across-three-slots** rule per §17's explicit
  override; `UNCROWNED_LANES` is now empty (the defensive capstones crown Engagement,
  Bulwark and Barrier tempo, closing Phase 1's one gap); a new face-derivation check
  asserts every non-weapon card's `face` matches `packetDefaultFace(card.lane)` and every
  weapon card carries none.
- Boss shard stopgap in `rewards.ts`, next to the capstone grant: a biome boss kill also
  drops `BOSS_LANE_A_SHARD_AMOUNT` (2) shards of each **distinct** Lane-A packet across
  its biome's three non-weapon lineages, via a new shared helper
  `biomeDefensiveLaneAPackets(biome)` (derived from the registered lineages, not a second
  hand-kept table) — **deduplicated per packet**, so Plains (armor+mobility both name
  Kill chain) pays Kill chain once per boss kill, not twice. Tested in
  `lineageMaterials.test.ts`, including the dedup case.

**Divergences from the brief, recorded per the brief's own instruction.**

1. **Deliverable 3's wording ("weapon Lane A") was corrected by the conductor before
   implementation** — Mountain's weapon (Hammer) Lane A is Empowered, not Bulwark, so the
   brief as originally written sourced nothing. Implemented per design §17 (the
   authority): non-weapon Lane A, one stopgap grant per biome boss kill covering all
   three non-weapon lineages at once, deduplicated.
2. **The non-weapon `+1..+5` ladder (`Recipe.upgrades`, `UpgradeTab`,
   `EvolutionPreview`) stays live alongside these fifteen trees.** Per the designer's
   explicit instruction this phase, armor/recovery/mobility items keep BOTH systems for
   now — a known temporary double system; reconciling them is Phase 4's exit, not this
   pass.
3. **Capstone FX reuse departs from the Phase 1 weapon precedent.** Every existing
   weapon capstone (e.g. `tempo.gale-wake` vs. the Rapier's own `tempo.ghost-strike`
   payoff card) mints a fx key distinct from its lane's T1 payoff card, and two different
   lineages crowning the same lane get two different keys (`tempo.gale-wake` on the
   Rapier, `tempo.ruin-afterimage` on the Axe). Fifteen defensive capstones following that
   pattern would have meant up to fifteen more new keys and switch cases. Instead each of
   the eight defensive fx keys is shared by every card AND capstone on that lane, across
   every lineage — "the same signature, permanent instead of one-off" rather than a
   second effect. Keeps `combatFx.ts`'s addition to 31 lines. If the designer wants
   capstones visually distinct per lineage, that is a follow-up, not a data change (the
   fx key is just a string on each capstone).
4. **Design §17's own summary line does not sum to 45.** Recounting the matrix table
   directly (not the prose summary) gives Tempo 5, Empowered 4, Affliction 7, Control 7,
   Kill chain 5, Engagement 7, Bulwark 6, Barrier tempo 4 — sums to 45 (15 lineages × 3
   lanes), matching the stated "45 lane slots for eight packets." The doc's own prose
   ("Affliction 6... Engagement 6") sums to 43. The matrix is what was implemented (and
   is what `coverage.test.ts` now checks); the prose count looks like a transcription
   slip and is worth a fix next time §17 is touched.
5. **Mobility's trigger-per-packet assignment is per-lineage, not a single global table**,
   unlike armor and recovery (each of which has one consistent packet -> trigger mapping
   that happens to avoid every intra-lineage collision). Mobility's trigger set
   (`kill`/`first-hit`/`standing`) is one shorter and Empowered's constraints from Plains
   and Mountain mobility are mutually exclusive, so no single global choice exists. FX and
   payoff kind stayed uniform per packet regardless; only the trigger varies per lineage.
   Noted for the designer, not fixed — the data is still internally consistent per file.
6. **Not touched: the Mountain/Cave/Swamp family and blend review** (bible open decisions
   2–3) and the burst-lethal encounter reshape. Those are the rest of Phase 4's listed
   work, out of scope for the authoring-only brief this note is attached to.

**Not authored.** No amplifier/keystone/cross rows for these fifteen (T1 payoff + T2
capstone only, per the brief). No new `PayoffKind`/`TriggerKind` — every card resolved
inside the existing closed vocabulary, and the Phase 1c runtime already implements all
ten triggers and fifteen payoffs (built ahead of this phase), so these cards fire in live
combat once equipped, not just structurally validated.

---

## Phase 5 — T2 band and form re-homing

- Amplifier row and the T2 magnitude row. Old-band collapse and stat-row absorption at
  the gate (bible §4).
- Re-home later-biome debut roots as forms (open decision 4 gives the table): Jungle
  Stinger/Venomthorn/Deathfang on Rapier, Desert Sunsteel on Broadsword, Tundra maul on
  Hammer, and so on. Each is one capstone plus existing art. `LEGACY_ITEM_IDS` maps saves.
- T2 families for Jungle and Desert. The eight-shard wallet is checked for legibility with T2 costs live.
- Tutorial: the tier-up beat shows the gate transformation.

**Built 2026-10-01 (Phase 5, band collapse only, `feat/band-collapse` off
`feat/lineage-data-model`).** The first bullet's *collapse* half: stat absorption,
the collapsed/lit/silhouette panel, amplifier rendering, and the amplifier's FX
budget. The T2 magnitude row, the T2 card authoring, form re-homing, T2 families and
the tutorial beat are NOT in this slice. `npx tsc` clean on `shared`, `server` and
`client`; `lineageEconomy` plus the shared `lineages` / `coverage` / `normalisation`
suites and the `lineageAuthoring` / `lineageCards.wiring` / `lineagePersistence` /
`lineageMaterials` / `lineageTelemetry` / `lineageListenerOrder` /
`inventoryStatSheet` files pass.

**Built 2026-10-01 (Phase 5, the tutorial's tree lessons, `feat/tutorial-tree` off
`feat/lineage-data-model`, task W1-E).** The last bullet above ("the tier-up beat
shows the gate transformation") plus the first-card and shards beats the weapon `+N`
ladder's removal (commit `03783104`) took out of the guided T1 script. Five new beats
per class script and one new farewell line, in `shared/src/tutorial/`:

- **The Forest leg** (`shards:rapier-t1-tempo-stat`, `card:rapier-t1-tempo-stat`),
  right after the Flash Rapier is worn — holding the base form is what opens the
  tree. The farm beat names where the lane's shard drops; the card beat buys Quick
  Wrist. Both costs/levels come from `resolveLineageCard`, never restated.
- **A new last chapter, "The Gate"** (`farm:gate:gale-needle`,
  `capstone:gale-needle`, `gate:gale-needle`): the gate's essence and shards, then
  the Forest boss for its three Warden's Hearts, then `unlockForm` + `wearForm`.
- **The frames line** is the third line of `TUTORIAL_FAREWELL`
  (`shared/src/tutorial/scripts/farewell.ts`), pointing at the frame choice and the
  frame-charge weapon glow (commit `ec3a9d65`).

Divergences from the brief sketch, and why:

1. **The gate chapter runs AFTER the two seals, not at the Forest boss mid-arc.**
   The T1 gate asks for Global Mastery 30 (`lineageMasteryLevelForGate(1)`) and
   Forest 6, which the script only reaches at the end of the Cave leg; and any two
   distinct biome bosses promote to Tier 2 (`sealsHeldAtTier`), so a third boss
   before the seals would itself be a seal and strand the Mountain beat. After the
   seals is the only placement that does not overturn the designer's 2026-09-29
   Plains + Mountain seal choice.
2. **`TutorialPanel`'s farewell now waits for the script to run out**, not merely
   for `playerTier >= 2`, or the gate chapter would be unreachable. A Tier-2
   character with beats left gets an extra "I'm done" button so the farewell is
   never a trap.
3. **`attemptBoss` gained an optional `until`** — the gate needs three capstone
   drops, i.e. three kills (`GATE_CAPSTONE_AMOUNT[1] === 3`), the one place the
   guide repeats a fight. The bot adapter lowers it to `repeatUntil` over one
   attempt, with a small per-round attempt budget so a class that cannot beat that
   boss costs a handful of fights and a named stall, not dozens.
4. **The tutorial routes' `completion` now includes the gate** (`lineageFormWorn`).
   It had to: `runSteps` returns as soon as completion holds, so "two seals" would
   have short-circuited the run before the gate chapter ever ran.

**Open risk, for the designer.** The gate chapter makes every tutorial route fight
the Forest Greatbear three times, and `docs/guided-tutorial-plan.md`'s Findings
record that boss walling a GM-30 Striker (0/12) and Apprentice (0/10) in September.
Nothing in this slice changes a monster number. If the live 1x runs confirm the wall,
the cheapest fixes are (a) move the capstone source by re-homing the gate's form to
another biome's door, or (b) take the boss numbers pass that the lineage redesign
left open. The failure is contained to an optional epilogue — Tier 2 is already won
by then — but it will show up as a stalled bot route.

- `shared/src/systems/lineages.ts` — `statRowIsCollapsed`, `absorbedStatCards`,
  `lineageCardTie`. `resolveActiveLineages` sums an absorbed row into the SAME
  `statEffects` bag as the slotted one and reports it separately as `absorbed` for
  the readout; `resolveLineageCards` drops a slotted stat card whose band has
  collapsed, so the two sets are disjoint and the fold cannot land twice.
  `checkSetActive` refuses a collapsed band's stat card and nothing else.
- `shared/src/systems/stats.ts` — **no new application site.** The absorbed rows ride
  the existing step 2b (percentages, evasion) and step 3c (flats, DR into the item
  bucket); both comments now say so, because "where does this land" is the question a
  reader of a 500-line recalc actually has.
- `client/src/ui/lineage/LineageTreePanel.tsx` + `lineageTree.css` — the collapsed
  summary names what the band OWNS ("T1: Keen Edge, Rend") and the row the form
  absorbed; a fifth card state `--absorbed` (inert, "in form", checked before
  `active`); the amplifier tick / named chip; the build readout names an amplifier
  with what it modifies and lists absorbed rows under "In form".
- `client/src/render/combatFx.ts` — `ampScale(stacks)` grows the existing primitive,
  and `targetId` resolves to the live sprite before falling back to `targetPos`. No
  new `LineageFxKey`, no new handler.
- Tests: `server/test/lineageEconomy.test.ts` — the fold is worth exactly its
  resolved value against a twin wearing the same form, survives clearing the row,
  survives a double recalc, is absent while the T2 form is only owned, and reverses
  when the T1 form is worn back; the collapsed band's payoff row stays buyable AND
  selectable; a non-weapon lineage (plate, through its own T1→T2 gate) absorbs
  nothing and moves no stat. The connector is pinned on synthetic cards, since the
  T2 cards are authored on branches this one cannot see.

**Divergences, recorded because the code wins:**

1. **Absorption is derived at recalc, not mutated at the gate.** §4 says the value
   folds "at the gate"; here paying the gate buys the form and nothing else, and the
   fold follows the WORN form. So it is reversible by wearing the old form back (the
   row becomes an ordinary slotted row again) and no save migration is needed. This
   is what keeps recalc pure and "owned is forever, active is a choice" intact.
2. **Which stat card folds when the player owns several was undefined.** §4 says "the
   stat row's value", singular, and §1.2 decision 1 means only one was ever played.
   The code absorbs exactly one per collapsed band: the one on the lane of the
   player's current stat row (so the lane identity carries up and the player still
   chooses), else the lineage's own lane order. Owning all three T1 lanes buys a
   wardrobe, not three absorptions. **Designer should confirm the tiebreak.**
3. **`active.stat` is not cleared when a band collapses.** The card stays slotted as a
   record of the lane — it still drives the weapon-trail cosmetic, which would
   otherwise go dark at the reward moment — while resolution ignores it and the panel
   shows it as "in form" rather than "active". Buying the current tier's stat row
   treats such a slot as empty and takes it.
4. **A collapsed band's stat card is still buyable, just never slottable.** That is
   the only way to move which lane the form absorbed, and it is the wardrobe rule
   applied to the one permanent row. Only `checkSetActive` refuses it.
5. **"One row fewer per tier" for non-weapon slots is derived, not authored.**
   `rowsForTier` is tier-only, so the panel renders exactly the rows the band has
   cards for: non-weapon lineages author no `stat` card, so their stat row does not
   appear — and neither does an amplifier row on a tier whose amplifier cards are not
   authored yet, which is the transitional state until the T2 cards land.
6. **The absent silhouette is now a dashed empty band head** ("Nothing beyond this
   band yet") instead of nothing at all (overnight report item 3), so the panel always
   shows one lit band and one frame below it without promising rows that do not exist.
7. **An amplifier adds no fx key.** §8 gives the amplifier row "bigger or spreads";
   the authoring agents reuse each lane's payoff key, so amplification arrives as more
   `stacks` on the same key or as a second event on another `targetId`. Pips keep
   their count unscaled — they already read the stack number.

**Exit.** Playtest: players describe the gate as the reward moment. Bench: T2 lane
budgets hold; the T1→T2 floor rule (weapon ladder) still cascades.

### Phase 5 progress note — T2 weapon band authored (2026-10-01)

W1-D1 authored the full T2 band (stat L2 / payoff L3 / amplifier L5) for all five
weapon lineages — Rapier, Broadsword, Hammer, Axe, Dagger — 45 cards, on
`feat/t2-band-weapon`. The fifteen non-weapon lineages are a sibling task and
untouched here. Divergences from the brief, for the designer:

- **T2 payoff, not just amplifier.** `coverage.test.ts` requires every row of a tier's
  band to exist for all three lanes the moment a lineage authors anything at that tier
  (`ROW_LOCAL_LEVEL[2]` is stat/payoff/amplifier). An amplifier-only T2 would fail that
  check on every lineage, so each lane got its own T2 payoff card (same trigger/payoff
  kind as its T1 card, read as that payoff grown up) for the amplifier to modify. This
  matches design §4's own T2 row list, so it is a scope correction, not a rule change.
- **No new fx keys.** The T2 payoff and its amplifier reuse the lane's existing
  `LineageFxKey` (the same key the T1 payoff card uses) rather than minting one. This
  departs from design §8's table ("Payoff = a new on-screen event") and from the Phase 1
  weapon precedent of one key per card; it follows the Phase 4 defensive precedent
  instead ("the client switch stays small... drawn bigger, not a second effect"),
  keeping `combatFx.ts` untouched. W1-F (client) owns drawing the amplifier bigger / on
  a second target.
- **`magnitudes.ts` untouched.** `TIER_SCALAR[2]`, `ROW_SCALAR.amplifier` (0.6),
  `ESSENCE_BASE.amplifier`, and `ROW_LOCAL_LEVEL[2]` already existed and resolved every
  one of the 45 cards (`coverage.test.ts`'s resolution loop, section 4) without a single
  added unit or number.
- **Amplifier trigger/payoff choice.** 14 of the 15 amplifiers keep the SAME
  trigger/payoff kind as the T2 payoff card they modify — read as the same event at
  `ROW_SCALAR.amplifier` magnitude, with "second target / longer hold / overflow stack"
  carried in flavour text rather than a mechanical change (none is wired yet; Phase 1b
  owns the runtime). The one exception, Rapier's Affliction lane
  (`rapier-t2-affliction-amplifier`), uses `trigger: 'kill'` against the payoff card's
  `hit-nth`, directly reusing design §13's own worked example ("hemorrhage spreads on
  kill") and exercising the "extra trigger kind" option design §4 lists for this row.
  No lane needed a trigger or payoff kind outside `TRIGGER_KINDS`/`PAYOFF_KINDS` — every
  weapon lane amplifies cleanly inside the closed vocabulary.
- **`coverage.test.ts` gained two rules** (lives in this file; the sibling non-weapon
  task does not touch it): an amplifier's `modifies` must name a `payoff`-row card of
  its OWN lineage, OWN lane, and OWN tier (previously only "same lineage" was checked,
  which would have let an amplifier silently point at the T1 payoff); and a lane that
  authors a tier's amplifier row authors **exactly one** amplifier card for it, not a
  shopping list.

Tests run: `coverage.test.ts`, `normalisation.test.ts`,
`server/test/lineageAuthoring.test.ts`, `server/test/lineageEconomy.test.ts`, plus
`server/test/weaponReachability.test.ts` as a spot check — all green, alongside
`npx tsc -p shared/tsconfig.json --noEmit`.
### Phase 5 progress note — T2 band, fifteen non-weapon lineages (2026-10-01)

**Built.** W1-D2, on `feat/t2-band-nonweapon`: the T2 payoff (L3) + amplifier (L5) rows
for all fifteen non-weapon lineages — **90 cards**, none of this phase's weapon-side work
(owned by a sibling task this wave). `npx tsc -p shared/tsconfig.json --noEmit` and
`npx tsc -p server/tsconfig.json --noEmit` both clean; `coverage.test.ts`,
`normalisation.test.ts`, `lineageAuthoring.test.ts` (server), and `lineageEconomy.test.ts`
(server) all green. No sibling-branch failures observed — the weapon lineages still carry
zero T2 cards (their T2 band is forms-only per the Phase 1c note), so `coverage.test.ts`'s
per-tier/per-lane/per-row loop (it only inspects tiers present in `lineage.cards`) never
reaches a weapon T2 row and passed clean end to end.

- Six cards per lineage: a T2 payoff per lane (same `trigger`/`payoff` kind as that
  lineage's own T1 payoff card — "that lane's T1 payoff, grown up," new id/name/
  description only) and a T2 amplifier per lane (`modifies` the T2 payoff id, same lane,
  same `payoff` kind, same `fx`, a **different trigger drawn from the same per-slot
  vocabulary** — design §4's "an extra trigger kind" bullet, chosen as the one amplifier
  shape expressible without guessing at runtime stacking semantics; see divergence 2).
  `card.face` stays derived via `packetDefaultFace(lane)` throughout, never hand-authored.
- `magnitudes.ts` **not touched**. T2's `TIER_SCALAR`/`ESSENCE_TIER_MULT`/
  `SHARD_TIER_MULT`/`ROW_SCALAR.amplifier` columns already existed from Phase 1; the T2
  band resolves off them with zero new numbers, as the brief predicted.
- Every lane in the armor/recovery/mobility vocabularies (design §17: armor
  evade/hit-taken/standing, recovery kill/guard-cast/pulse/barrier-break, mobility
  kill/first-hit/standing) turned out expressible as an amplifier — no lane needed to be
  reported as unamplifiable.

**Divergences from the brief, recorded per the brief's own instruction.**

1. **fx keys: none minted**, as instructed — every T2 payoff and amplifier reuses its
   lane's existing per-packet `LineageFxKey` (`tempo.evasive-blur`,
   `engagement.sidestep-blur`, `control.chill-blur`, `kill-chain.recovery-pulse`,
   `barrier-tempo.ward-shell`, `affliction.toxic-pulse`, `bulwark.plating-chip`,
   `empowered.guard-spark`), the same one the T1 payoff and the form's capstone already
   share (Phase 4 progress note, divergence 3). This is a second departure from design
   §8's "Payoff = a new on-screen event": now THREE cards per lane (T1 payoff, T2 payoff,
   T2 amplifier) plus the capstone draw the identical signature rather than each adding a
   new one. `combatFx.ts` stays untouched; W1-F's job is making the amplified payoff read
   as bigger (duration/stack/second-trigger), not drawing a new effect.
2. **The amplifier's `trigger` field is mechanically inert beyond bookkeeping** — nothing
   in `resolve.ts` or `magnitudes.ts` reads `card.modifies` to extend the modified card's
   duration, add a target, or add stacks; `resolveLineageCard` treats an `amplifier` row
   exactly like a `payoff` row (its own trigger, its own payoff, scaled by
   `ROW_SCALAR.amplifier` = 0.6) with `modifies` carried through only as an unread string.
   So "duration/second-target/stacks" amplification is a Phase 1b/5 RUNTIME decision not
   yet built, out of scope for pure data authoring. The data models the one amplifier
   shape fully expressible today — the SAME payoff kind firing off an ADDITIONAL trigger
   from the slot's vocabulary, so owning the amplifier makes the payoff proc from two
   triggers instead of one. Whether that nets out as "more stacks" or "longer effective
   uptime" in play depends on the §18.1 composition rule chosen for that payoff kind
   (multiplier max-wins vs. DoT-style per-stack refresh), which is runtime work for
   whoever wires amplifiers, not this task.
3. **Amplifier trigger choice is a fixed within-lineage rotation** (next item in the
   slot's trigger list after the T2 payoff's own trigger, cyclic), not hand-picked per
   card for maximum thematic fit — with 45 amplifier cards to author, this kept the
   choice systematic and verifiably exhaustive (every slot vocabulary fully covered) at
   the cost of occasional flavor-text stretching (e.g. Treads' Empowered amplifier reads
   "a kill leaves the same opening anchoring first would," which is serviceable but not
   as tight as the hand-authored T1 cards). Worth a flavor pass later, not a data defect.
4. **Per-packet trigger/payoff pairing is per-LINEAGE, not per-packet-globally** — same
   caveat as the Phase 4 note's divergence 5, now doubled for T2: e.g. armor's Kill-chain
   payoff is `evade`/`recovery-window` on Hide alone (the only armor lineage carrying
   Kill-chain), so there was nothing to reconcile there, but recovery's Empowered
   (Barrier only) and Bulwark (Barrier + Pulse, consistent) show the pattern holds only
   where a packet repeats across lineages of the same slot. Not a defect — each lineage's
   T1→T2 progression is internally consistent, which is what the "grown up" instruction
   asked for.

---

### Phase 5 progress note — W1-E, re-homing / T2 families / T2 blends (2026-10-01)

**Built.** On `feat/rehoming-t2-families` off `feat/lineage-data-model`. `npx tsc -p
shared/tsconfig.json --noEmit` and `npx tsc -p server/tsconfig.json --noEmit` both
clean; `coverage.test.ts`, `weaponReachability.test.ts`, the new
`itemReachability.test.ts`, `lineageMaterials.test.ts`, `variantBlend.test.ts`,
`shared/src/world/map/validation.test.ts`, and `bestiaryZone.test.ts` all green.

- **Fourteen re-homed forms** — one `LineageForm` plus one capstone per root in the
  approved re-homing table, added to broadsword/hammer/dagger (weapon) and
  bindings/robe/plate/heartroot/stone/barrier/pulse/treads/wing/marsh/fleet
  (non-weapon). No new `LineageFxKey`s were needed — every lane already had a non-stat
  fx verb to reuse. `gravewalker-boots → fleet` (Plains) is mechanically a clean fit
  (Gravewalker's `kill-stack-speed-pct` maps directly onto Fleet's native kill-chain
  lane, trigger `kill`/payoff `speed-window` — the same shape the item already has),
  so the "weakest fit" is thematic/flavor only: a Graveyard death-and-decay boot
  crowning sunlit Plains farmland, not a mechanical mismatch.
- **`server/test/itemReachability.test.ts`** — the armor/recovery/mobility sibling of
  `weaponReachability.test.ts`. Passes with an empty allowlist. Verified against the
  live recipe data rather than assumed: the 43 non-weapon recipes with `evolvesFrom`
  outside a tree (16 armor, 16 recovery, 11 mobility) **all already carry a
  `reconstructCost`** today, so the recursive evolve-chain walk the test implements
  never actually has to fire to pass right now — it is still the honest definition
  (mirrors `checkEvolve`/`checkReconstruct` in `shared/src/systems/evolution.ts`
  exactly), and it is the tripwire for the day Phase 4's exit retires that ladder.
  Separately: the eleven new door roots this wave adds all carry no `evolvesFrom`
  themselves, so the plain-craft leg alone already made them reachable before they
  were ever added to a tree — the `LineageForm` entry is for the gate/capstone
  economy, not reachability per se.
- **T2 families** — Jungle (Ape/Undergrowth/Stalker) and Desert (Basilisk/Scorpion/
  Stalker, the last T3+ only) in `shared/src/data/families/index.ts`. Jungle's ten
  non-boss mobs partition exactly. Desert's approved table only named seven of ten;
  the leftover scarab "Dealer" line (`dust-djinn`, `sandweaver`,
  `sandspitter-cobra`) is assigned by kind, per the file's own existing policy for
  mobs §12.1 does not name — **flagged for designer review**: `dust-djinn` (T2) joins
  Scorpion (it pairs 1:1 with both T2 controllers equally, so pairing alone does not
  decide it; placed there for family-size balance against Basilisk's three members
  across all tiers, and because it must not join Stalker, which is T3+-only and would
  otherwise field a T2 body with no T2 blend home); `sandweaver` (T3) and
  `sandspitter-cobra` (T4) join Stalker (kill-chain fits the dealer line's
  high-direct-damage, fast-kill shape better than either controller family, and both
  are T3+ so Stalker's shape is unchanged). Reasoning is commented inline in the file.
- **T2 blends** — every T2 normal node in `shared/src/world/map/regionT2.ts` (forest 5,
  plains 5, mountain 5, cave 6, swamp 6, jungle 5, desert 5 — 37 total, matching the
  live node count exactly). Starter biomes reuse their T1 family table; Desert's
  blends are two-way (Basilisk/Scorpion only — Stalker fields no T2 member).
  `variantBlend.test.ts`'s authoring checks are generalized to run per-tier (T1 27,
  T2 37) instead of T1-only, with "every family leads a node" scoped to the families
  each tier's own blends actually name (not `familiesForBiome`), so Desert's absent
  T2 Stalker does not false-fail. `lineageMaterials.test.ts` gains a documented
  `UNSOURCED_FAMILIES` exemption for `desert-stalker` (same pattern as
  `coverage.test.ts`'s `UNCROWNED_LANES`) — its shard has no farm location until a
  future T3 blend pass names it.

**Divergences recorded per the brief's own instruction.**

1. **The brief's `shared/src/data/families/` wording (plural, implying one file per
   family) predates the actual layout** — all families, T1 and now T2, live in the
   single `shared/src/data/families/index.ts`. Followed the file, not the brief.
2. **Jungle's T2 monster pool (`biomeDatabase.ts`) fields only `jungle-ape` and
   `jungle-snake`/`jungle-blowdarter` at T2** — none of Jungle Stalker's three named
   members (`jungle-stalker`, `canopy-harrier`, `hunting-panther`) exist in the T2
   pool; they are all T3/T4. The authored T2 blend still names Stalker as a node's
   dominant family (consistent with the pre-existing "KNOWN GAP" pattern
   `regionT1.ts` already documents and accepts for several T1 families), but
   `resolveNodeBlend` will drop it as unavailable and re-scale onto Ape/Undergrowth
   at runtime until Jungle's T2 pool grows a Stalker-family mob. Not fixed here —
   monster pool membership is a balance/authoring call outside this wave's scope
   (no monster numbers were touched), flagged for the designer alongside the Desert
   family-partition item above.
3. **Desert's T2 monster pool (`biomeDatabase.ts`) deliberately excludes the scarab
   "Dealer" line entirely** (`dust-djinn` et al. spawn only as `pack.followers` of a
   controller, never as a direct blend pick — see that file's own header comment).
   This is pre-existing design, not a divergence, but it means the Scorpion family's
   T2 blend share resolves to `sand-scorpion` alone at the pool level even though
   `dust-djinn` is now a Scorpion member for shard-drop purposes — worth the
   designer knowing when reading `resolveNodeBlend`'s output for a Desert node.
4. **T2 node spawn composition changes** as a direct result of authoring blends for
   the first time at this tier (blend replaces the flat per-biome pool). Every
   pre-existing T2 balance baseline measured against the old flat pool is void —
   the same class of change as the T1 Mountain de-duplication noted in the
   2026-10-01 overnight report. No monster numbers were touched; only which family
   a node favours and how often.

### Phase 5 progress note — run 3 W1-B: T3 keystone / T4 cross cards, T3 path packet tags (2026-10-01)

On `feat/t3-t4-bands` off `feat/lineage-data-model`, scoped to run 3's W1-B task
(`docs/briefs/run3-progression-2026-10-01.md`). Authored, for all twenty
lineages, the T3 `keystone` row (one card per lane, naming design §4's amended
shared-per-packet keystone: Chain, Shockwave, Festering, Ladder, Refund, Always
First, Immovable, Unbroken, each in the lineage's own flavour, `fx:
'<lane>.keystone'`) and the T4 `cross` row (one card per lane, `borrowsLane` a
derangement of the lineage's other two lanes — never a fixed point, never two
cross cards naming the same borrowed lane). Both resolve through the existing
generic `resolveLineageCard`/`cardScalar` path with zero runtime code changes:
`ROW_SCALAR.keystone` (1.2) and `.cross` (0.5) and
`triggerNForLane(card.borrowsLane ?? card.lane)` were already general. Also
tagged all 54 T3 class paths (`t3CombatA/B.ts`, `t3Summoner.ts`) with a
PROVISIONAL `SkillNode.packet: PacketId`, chosen from each path's description,
for design §4's keystone handoff ("the item keystone and the class path name
the same lane"). `pnpm typecheck` and the `lineage`/`skill` test substrings all
green (18 files). Related work: run 3 W1-A (parallel, `feat/keystones`, not
visible on this branch) implements the eight keystones' actual runtime rule
changes; this task only authors the data side.

**Divergences from the brief, recorded because the code (and an existing
invariant) won.**

1. **`coverage.test.ts`'s pre-existing "every row this tier has, per lane" check
   had to be narrowed for T3/T4.** Before this task, every tier any lineage
   authored had its FULL row set (stat/payoff/amplifier/keystone at T3, same +
   cross at T4) checked per lane. Design §18.5 already says T3/T4 carry FORMS
   ONLY until Phase 5's stat/payoff/amplifier rows land; this task adds exactly
   the keystone (T3) and cross (T4) rows as the one exception, so the check now
   applies in full only at T1/T2, and checks just the one row this phase
   authors at T3 (`keystone`) and T4 (`cross`). Not a numeric or runtime change;
   recorded here because it touches a test another task's invariant depends on.
2. **"Every lane carried by a root's frames" (the brief's phrasing for the T3
   path tag coverage test) was read as "every packet a WEAPON can carry"** —
   `WEAPON_PACKET_IDS`, the six offensive packets — rather than a literal
   per-class-root lane set, because no such root-to-lane binding exists
   anywhere in the codebase (a player's class root and their equipped weapon
   lineage are independent choices). Under that reading, `bulwark` and
   `barrier-tempo` are reported as the expected zero-coverage misses (no weapon
   keystone ever names them, so no class ATTACK path should either), and all
   six weapon-eligible packets have at least one tagged path (tempo 15,
   empowered 20, affliction 13, control 2, kill-chain 1, engagement 3) — see
   `shared/src/data/skillTree/t3PacketTags.test.ts`.
3. **Cross-card fx reuses the card's OWN lane's existing payoff fx, not the
   borrowed lane's.** `coverage.test.ts` already enforces `card.fx` starting
   with `${card.lane}.`, so a cross card slotted under lane X (even though its
   trigger/payoff are borrowed from lane Y) draws X's established visual, not
   Y's. Visually this means a cross card can borrow a mechanic's number but
   keeps its own lane's grammar on screen — a deliberate reading of design §8
   ("lane grammar" is a property of the slot, not the borrowed effect), not an
   oversight.

---

### Keystone runtime progress note — the eight packet rules (2026-10-01, W1-A)

Design §4 as amended 2026-10-01: **one keystone per packet, eight in all**, shared by
every lineage that carries the lane in any slot. All eight RULES are implemented and
tested; the T3 cards that buy them are a separate task (W1-B), and the rules are inert
until one is owned and active.

**Shape.** The identity of a keystone (lane, name, rule text, fx key, and the payoff kind
its share resolves from) is data in `shared/src/data/lineages/keystones.ts`
(`KEYSTONE_DEFINITIONS`, keyed by `PacketId`, eight rows). The behaviour is a small named
module per lane under `server/src/systems/combat/keystones/`, declared through
`defineKeystone` at module scope and reachable as `KEYSTONE_MODULES`
(`ReadonlyMap<PacketId, KeystoneModule>`, `{ id, lane, seam, register? }`).
`registerKeystones()` is called from `registerLineageCards()`, so the live server and the
bench see one set. `keystoneActive(player, lane)` reads the resolved-card cache for an
active `keystone` row of that lane in ANY lineage — which is owned, active and worn by
construction.

**Seam per keystone.**

| Packet | Keystone | Seam |
|---|---|---|
| tempo | Chain | the `echo-hit` payoff case in `applyOnTarget`, extended link by link |
| empowered | Shockwave | an `onHit` listener on `metadata.empoweredAttack`, paid through `applyPlayerAoe` |
| affliction | Festering | a per-hit window on the monster, refunded in `updateCombatState` before the status decay |
| control | Ladder | an `onHit` listener climbing `applyMonsterRoot` then `applyStun`, latched per target on the monster |
| kill-chain | Refund | an `onKill` listener writing each root's own readiness state (+ a flag consumed in `applyClassDotStack`) |
| engagement | Always First | an `onHit` listener calling `emitMechanicFired`, latched per body on the monster |
| bulwark | Immovable | predicates asked by `runStationaryDr`, `runReactivePlating`, `applyForcedMovement` and `beginLairDrag` |
| barrier-tempo | Unbroken | a refusal inside `stampBarrierDamage`, the one entry point both damage paths call |

**Divergences and decisions worth knowing.**

1. **A keystone row does NOT fire as a payoff.** `firingsFor` skips `row === 'keystone'`.
   The authored trigger/payoff pair is still required (`coverage.test.ts`: every non-stat
   row must do something the moment it is bought), and what it supplies is the rule's
   SHARE — `keystoneShare` reads the card's own resolved magnitude, so the tier column and
   the defensive frame-face bias apply to a keystone exactly as to a payoff row and the
   runtime resolves no number of its own. `KEYSTONE_DEFINITIONS[lane].payoff` names the
   payoff kind a card must be authored with (`echo-hit` for Chain and Shockwave; the other
   six have no magnitude, only authored durations and reaches). Firing it both ways would
   pay the lane twice for one card.
2. **The eight `<lane>.keystone` fx keys exist before any card uses them**, because they
   are owned by the registry rather than by an authoring choice. `coverage.test.ts`'s
   "every declared key is used by a card" check skips them, and gains two checks in
   exchange: every packet has a keystone whose fx is its lane's key, and any keystone-row
   card must draw that key.
3. **Six new authored units** in `LINEAGE_UNITS` (design §18.4, no constants in the
   runtime): `chainMaxLinks` 4, `shockwaveRadius` 90 (deliberately Sweep's own footprint),
   `ladderRootMs` 1500 (Binding Strike's length), `ladderStunMs` 750 (the `stun` payoff's,
   so an item never out-stuns the ability whose whole cost is that it stuns),
   `immovableGraceMs` 2000, `unbrokenHpFraction` 0.5. Chain's reach is `contagionRadius`,
   reusing the existing "how far a lineage payoff reaches to a neighbour" lever rather than
   adding a second.
4. **The monster dodge clock now has one owner.** `rollMonsterDodge` / `monsterDodgeChance`
   moved into `defense/mitigation/evasion.ts` and `combat.ts`'s inline accumulator calls
   them, because a Chain link is a hit to the player and must spend the same clock. Pure
   extraction — same arithmetic, same counter (`evadeAcc`).
5. **Festering holds, it does not refund.** The hold adds this tick's `dt` back BEFORE
   `tickStatusEffectDurations` takes it, from the top of `updateCombatState`. A refund
   after the decay cannot work: the decay prunes at zero, so the effect would already be
   gone. Only the duration is held; `nextTickIn` is untouched, so the DoT keeps ticking on
   its own cadence. The window is the player's own resolved DoT tick interval.
6. **Immovable's "while either is live" is read literally.** The displacement refusal
   requires a stance actually standing — stationary DR applied, or a reactive-plating stack
   held. One card does not buy blanket displacement immunity; it protects what the lane
   earned. The 2 s persistence is expressed by widening `runStationaryDr`'s existing
   250 ms movement grace and by holding the plating fade inside the same window, both read
   off the one movement clock (`stationaryMovementMs`).
7. **Always First never arms the empowered flag.** It emits `mechanic-fired` and nothing
   else, so everything hung off the seam answers while the root's own counter stays
   honest. `emitMechanicFired`'s exchange latch means a hit that genuinely fired the root's
   mechanic emits once, not twice — and the per-body latch is still spent in that case.
8. **Nothing could not be expressed.** All eight rules landed on existing seams; the only
   new primitive is the duration hold in (5), and the only refactor is (4).

Tests: `server/test/keystones.test.ts`, one block per keystone plus its bound, a registry
block, a "keystone row never double-fires" block and a per-player ownership block.

---

## Ability nodes progress note — design §19 shipped data-only (2026-10-01, W1-D)

Branch `feat/ability-nodes`. Design §19's T1 packet node and T2 amplifier node for
all 22 abilities, plus the state, protocol, runtime, client rows and
`server/test/abilityNodes.test.ts`. Nothing in the roster, in monster data or in
the T1/T2 magnitude values moved; the one new numeric surface is
`ABILITY_NODE_SHARE`.

### What was built

- **`shared/src/data/abilityNodes/`.** `offers.ts` is the only authored table:
  three `(lane, payoff)` pairs per ability and a sentence saying why. Everything
  else is derived in `index.ts` — the amplifier row is GENERATED one option per
  packet option, the fx comes from `ABILITY_NODE_FX` (every key an existing
  `LineageFxKey` with an existing client handler), the option name is the
  packet's own name and the blurb the payoff's sentence. Design §19 asks for "a
  generic tree keyed to packets"; 66 hand-written option names would have been
  the opposite.
- **Numbers.** `ABILITY_NODE_SHARE` in `lineages/magnitudes.ts`, one entry per
  node row: `packet` 0.5 (the fraction of a full payoff row the node pays) and
  `amplifier` 0.6 (the axis boost, seeded at `ROW_SCALAR.amplifier`'s value so
  the two read alike until a bench separates them). Cost and unlock reuse the
  lineage `payoff` / `amplifier` rows, so no cost table grew.
- **Runtime.** `fireLineagePayoffs` is split out of `combat/lineageCards.ts` as
  the one implementation of "apply a payoff, draw one card-fx". The node runtime
  is dispatch only and inherits the evade early-return, the max-wins debuff
  records, `hitBasis`, the amplified `extraTargets` spread and the no-fx-for-a-
  refused-payoff rule without restating any of them. `applyAmplifiedAxis` is
  likewise split out of the lineage amplifier.

### Divergences from the brief, and why

1. **`speed-window` is NOT offered on a Guard's avoid face.** The brief's
   parenthetical ("avoid → engagement-dr / speed-window") would have given a
   Guard an attack-speed window, which is defence scaling offence — the exact
   axiom the same sentence cites (design-bible §1, separated budgets). Avoid pays
   `engagement-dr`; `speed-window` stays on the Technique side. A consequence:
   a Guard's three options differ in payoff only between the sustain pair
   (`recovery-window` vs `ward`), and in lane/shard/fx elsewhere. The payoff
   vocabulary has no evasion payoff, so there is no second avoid-face effect to
   offer; if that row should have a real second choice, the vocabulary needs one.
2. **The node rows are gated on the ABILITY's bands, not on T1/T2 absolutely.**
   The packet row sits in the ability's home-tier band and the amplifier one band
   above (`abilityNodeRowTier`), clamped at T4. §19 says both "the T1 packet node
   and the T2 amplifier node" and "unlock on the ability's home tier band"; the
   relative reading is the only one under which a T4 ability's node is reachable.
   For a T4 ability both rows land in the T4 band, the amplifier one plus-slot
   higher inside it.
3. **The state lives on `TracksProgression`, not "`UsesSkills`-adjacent".**
   `knownAbilities` and `attunedAbilities` are on `TracksProgression`; ability
   state is build/loadout data and that is where the rest of it already is. The
   field is optional and normalized at hydration like `visitedNodes`, so there is
   no migration.
4. **Three amplifier options, one per packet option** (`modifies` + the axis that
   payoff can move), not three axes for the chosen packet. That is the brief's
   literal "one per chosen packet's amplifier axis", and it reuses the lineage
   amplifier's own semantics: an amplifier slotted against a packet you are not
   running is a legal, inert loadout rather than an error. It also means no option
   can ever be a dead axis — `duration` on an untimed payoff or `targets` on a
   self window never gets authored.
5. **No binary payoff is offered.** `stun` and `cleanse` cannot take a share —
   "half a stun" is no stun — so the table never uses one and
   `abilityNodePayoff` refuses rather than quietly paying full strength.
6. **A node fires on the ability's resolution, not its activation.** "Lands" is
   enforced per shape: `applyTechniqueRider` (every armed shape, including a
   Conduit formation delivery and a Charge's landing blow), the cast and
   self-cast resolves in `updateAbilityCasts`, `applyInstantTechnique`, and the
   reposition branch only when it arms nothing. An armed charge the fight never
   consumed pays nothing.

### Not done

- **No keystone or cross row for abilities** — §19 defers those to after the T3
  class review, and the brief scoped this to the two rows.
- **Nothing benched.** `ABILITY_NODE_SHARE` is provisional, like the rest of the
  magnitude table. A Guard node is a free extra defensive window on a cooldown
  the player already pays for, which is the first thing a bench should look at.
- **No telemetry row.** The lineage handlers emit `world.gameplay?.lineage(...)`;
  the node handlers emit nothing, because there is no node event on the gameplay
  recorder and adding one is a schema change this task did not own.

### Phase 5 progress note — W1-C, T3/T4 families and blends (2026-10-01)

**Built.** On `feat/t3-t4-families` off `feat/lineage-data-model`. `pnpm typecheck`
clean; related tests green: `lineageMaterials.test.ts`, `variantBlend.test.ts`,
`shared/src/world/map/validation.test.ts`, `areaInformation.test.ts`,
`craftingRailAndMapFog.test.ts`, `tundraChill.test.ts`, the `shared/src/collision/*`
suite, `gameConfig.test.ts`, `durability29.test.ts`, `mobAdoptionIntegration.test.ts`,
and the full `lineage`/`variant`/`blend`/`world` substring sweep (17 files).

- **Starter biomes + Jungle/Desert join their EXISTING families** —
  Mountain/Cave/Swamp (already fully T1-T4 partitioned from Phase 1b onward — their
  T3/T4 mobs were already in `FAMILY_DATABASE` before this wave) plus Jungle/Desert
  (T2-authored by W1-E, same pools cover T3/T4) needed only blends, no new
  `FamilyId`s. One correctness fix along the way: `avalanche-tyrant` (Mountain's
  Caprine-line apex per `mountain.monsters.ts`'s own lineage banner,
  cliff-hopper -> avalanche-ram -> avalanche-tyrant) had been filed under
  `mountain-crag` instead of `mountain-hopper` since the Phase 1b commit that first
  populated the table — moved, no other change.
- **Four biomes debut fresh families, all PROVISIONAL** (header comment in
  `shared/src/data/families/index.ts` marks the whole T3/T4 pass, not per-entry):
  Tundra (2: Glacial / Rime — the roster's banner names only two legible roles),
  Volcanic (3: Swarm / Anchor / Ashfall), Graveyard a.k.a. Wasteland (3: Crawler /
  Plague / Choir — `charnel-brute` folded into Plague even though
  `monsterPoolByTier` never spawns it, because the partition test claims every
  non-boss `MONSTER_DATABASE` entry of a family biome regardless of pool
  membership), Trench (3, one mob each, reusing the biome's own THE HUNTER / THE
  KITER / THE ANCHOR labels verbatim as family names).
- **`drops`/`punishes` derivation** — rather than re-deriving the heuristic from
  scratch per family, picked each pair against `packetDefinition().weakAgainst` in
  `shared/src/data/lineages/packets.ts` where it names the shape directly (Tempo:
  "weak against fortified plating, a single big target" → every slow/heavy/shielded
  family punishes Tempo; Affliction: "weak against... short fights" → Hadal
  Stalker, explicitly the lowest-HP of Trench's three elites, punishes it). Where
  the text didn't speak directly, matched the nearest existing precedent pair
  (Control always punishes Kill-chain; Engagement always punishes Affliction).
- **Blends** — every T3 normal node (tundra 5, mountain 5, cave 6, jungle 5, desert
  5, volcanic 6, swamp 6 = 38) and every T4 normal node (mountain 5, tundra 5,
  jungle 5, desert 5, volcanic 6, graveyard 6, trench 6 = 38), same
  70/20/10-permutation + 45/45/10 + 34/33/33 (+55/30/15 for the six-node biomes)
  pattern as T1/T2, two-way for Tundra. Desert's T3/T4 blends are its first
  THREE-way split (Stalker's T3+ members finally field a node, so
  `lineageMaterials.test.ts`'s `UNSOURCED_FAMILIES` entry for `desert-stalker` is
  now empty).
- **Tests** — `lineageMaterials.test.ts` needed only the `UNSOURCED_FAMILIES`
  removal (its partition sweep already generalizes to any `FAMILY_BIOMES` entry).
  `variantBlend.test.ts` gained `checkTierBlends(3, 38)` /
  `checkTierBlends(4, 38)`, the `NODE_BLENDS` count moved to `27+37+38+38`, the old
  blanket "T3/T4 carry no blend" loop became "no non-normal node carries a blend",
  the per-node resolved-blend cycle loop now also runs `t3Normals`/`t4Normals`, and
  the final "unblended fallback still spawns" fixture moved from a T3 normal node
  (none left unblended) to a T3 dungeon node (dungeons stay blend-free by design at
  every tier, so the fallback path is still exercised).

**Divergences recorded per the brief's own instruction.**

1. **"Commit per biome" was not followed literally.** `shared/src/data/families/
   index.ts` holds every biome's table in one file (same layout note as W1-E
   above), and `variantBlend.test.ts`'s `checkTierBlends(3, 38)` /
   `checkTierBlends(4, 38)` assertions require ALL seven biomes of a tier present
   simultaneously to pass — an intermediate "Mountain only" commit would fail the
   old test's "no T3/T4 node carries a blend" assertion without yet satisfying the
   new exact-count one. Committed instead by concern: (1) the family table (all
   eleven biome entries + the Mountain fix), (2) `regionT3.ts`, (3) `regionT4.ts`,
   (4) the two test files, each biome's specifics called out in that commit's body
   and in this note above.
2. **`avalanche-tyrant`'s move is a pre-existing-data fix, not new T3/T4 authoring**
   — it was already assigned (to the wrong family) before this wave; left every
   other starter-biome assignment as found, including one similar-shaped
   ambiguity in Swamp (`swamp-hydra`/`plague-hydra`, a Shell/Anchor pair, sit in
   the `swamp-coven` control-caster family alongside `fen-hexer`/`bog-witch`) that
   was NOT touched: unlike avalanche-tyrant, Swamp's existing table has no
   internal lineage-banner contradiction to point at, so moving it would be a new
   design opinion, not a correctness fix, and is flagged for the designer instead.
3. **`graveyard-plague`'s `punishes: 'engagement'` is shared with `trench-hunter`
   and `volcanic-ashfall`, and `desert-stalker` already punishes `bulwark`** — no
   rule requires distinct `punishes` values across biomes (the existing table
   already reuses `tempo`/`empowered` pairs five times over), only within one
   biome's own three families, which every biome here still satisfies.
4. **T3/T4 node spawn composition changes** for every biome that gained a blend
   this wave, same class of change W1-E flagged for T2: any balance baseline
   measured against the old flat per-tier pool is void. No monster numbers were
   touched.

---

### W1-F progress note — known gaps closed (2026-10-01)

Five carried gaps from the overnight/day-run reports, on `feat/gaps` off
`feat/lineage-data-model`.

1. **`previewEquipmentStats` and the stat sheet ignored lineage cards.** The
   preview built a synthetic `holdsInventory` with no `lineages`, so
   `resolveActiveLineages` always saw an empty map. Fixed: `EquipmentPreviewInput`
   now carries `lineages`, threaded into `holdsInventory`; `StatSheet.tsx` and
   `MakeTab.tsx`'s evolution DPS row now pass the live `lineagesAtom`. Test:
   an active Quick Wrist (rapier Tempo stat row) now moves `attacksPerSecond`
   in both the raw preview and the built sheet.
2. **Defensive capstone FX keys all reused the lane's shared payoff key**, so
   two of the fifteen defensive lineages crowning the same lane (e.g. Robe and
   Plate both on Bulwark) were visually identical. One lineage per lane keeps
   the shared key; the other 17 capstone slots got their own `LineageFxKey`
   plus a `combatFx.ts` handler (a distinct pairing of the existing six
   primitives, never a new visual language). Full list in the commit message.
3. **T1's vestigial `modifier` field, mask re-cut to 25, Cave/Swamp blends
   trimmed to five.** Done as the brief described; see the commit message for
   the authoring mechanics (`dropsModifier`, naming-sequence prefix) and the
   mask cells chosen (avoided the two T1 nodes carrying a real T1<->T4
   frontier edge).
4. **and 5. Shard icons in the materials panel / map node info, and the
   materials panel grouping + hiding zero rows — ALREADY DONE on this branch,
   no code changed.** Both were real gaps when the overnight report named them,
   but later work in the same day/overnight run (variants map pass `aa44d84c`,
   catalyst-wallet removal `c5cf7436`) shipped exactly what this gap asked for
   before W1-F started:
   - `client/src/ui/MaterialChip.tsx` + `client/src/ui/economyIcons.ts`:
     every shard/capstone chip renders through `GameIcon` with a lane-coloured
     glyph source (`shardIconSource`/`capstoneIconSource` -- a letter in a
     lane-tinted box/circle, since no atlas frame exists for them yet), never
     a bare text glyph in markup. `shardName`/`capstoneMaterialName` calls that
     remain are the chip's accompanying NAME label, not a replacement for the
     icon.
   - `client/src/ui/map/NodeInfo.tsx` (map node info) already renders
     `<ShardIcon packet={...} />` for every family row via the same glyph
     component (`client/src/ui/map/ShardIcon.tsx`).
   - `client/src/hud/MaterialsPanel.tsx` (the HUD materials panel) and
     `client/src/ui/crafting/shared.tsx`'s `WalletSummary` (the crafting tab's
     wallet strip) both already group essences / shards / capstones with a
     divider and filter `ownedShards`/`ownedCapstones` to amount > 0, hiding
     untouched rows.
   Divergence recorded per the brief's own instruction: code on the branch
   wins over the (stale) gap list. No new component was written for 4/5.

Related tests + `pnpm -r exec tsc --noEmit` all pass; see the five commits on
`feat/gaps` for the per-gap diffs.

---

## Cross-cutting rules

- **Server authority.** Card, form, and material state are mutated only by the server
  handlers; the client sends intents and renders `card-fx` events and slice deltas.
- **Component presence.** Windows and charge are attached/detached components or
  `TracksCombat` timed flags, never booleans on networked slices.
- **No per-tick animation flags.** All signatures go through `pushEvent`.
- **Numbers.** Any literal magnitude in a card file fails `coverage.test`. Tuning is the
  magnitude table plus the packet budget.
- **CI.** No Postgres/Redis in tests. Migrations are exercised through `playerRepo`
  hydration with fixtures, not a live DB.
- **Docs.** When a phase ships, fold it into the current-state pages named above and
  archive the superseded ones; update `docs/README.md` in the same commit.

## Risks

- The `mechanic-fired` seam is shared by six roots; a double fire on one hit doubles a
  payoff. The seam test is not optional.
- `holdsInventory` grows per lineage; watch delta size (bandwidth memory: radius-2 zone
  streaming was the last fix) and consider a separate `TracksLineages` slice if it
  exceeds a few hundred bytes per player.
- Engagement shards have one T1 source (Plains Sky) until Mountain is reviewed; Bulwark
  and Barrier tempo have none at T1. If Phase 4 finds no fitting family, the boss capstone
  gains a secondary shard drop, which is a data change.
- Removing the +N ladder wipes tester progress. The refund plus retained forms is the
  agreed policy; announce it in the release record.

---

## Phase 1c contract — card runtime, events, and HUD state (written 2026-09-30)

The runtime session and the client session build against this without talking to each
other. The code on `feat/lineage-data-model` is the authority for names; this section
only adds what neither 1a nor 1b defined.

### The event

One new member of `CombatEvent` in `shared/src/protocol/combatEvents.ts`:

```ts
| { kind: 'card-fx'; playerId: string; fx: LineageFxKey; pos: Vec2;
    targetId?: string; targetPos?: Vec2; stacks?: number }
```

- The server pushes **exactly one** `card-fx` per payoff application, from the listener
  that applied it, via `world.pushEvent(nodeId, …)`. Never per tick, never for stat rows.
- `pos` is the player's position. `targetId`/`targetPos` are set when the payoff landed on
  a monster (vulnerability, plating-shred, echo-hit, hemorrhage, poison-stack, slow, stun,
  contagion). `stacks` is set for payoffs that count (plating-stack, poison-stack).
- Capstones push the same event with the capstone's `fx`.
- The client draws it in `client/src/render/combatFx.ts` next to the existing effect
  handlers, one handler per `LineageFxKey`, keyed by the lane grammar in design §8.
  Unknown keys draw nothing and log once in dev.

### Windows and stacks on the HUD

Timed payoffs (`damage-window`, `speed-window`, `recovery-window`, `engagement-dr`,
`ward`) are also applied as **status effects** on the player with id
`lineage.<payoff>`, `data: { totalMs, magnitude }`, so the existing buff-sync path shows
a clock on the HUD without a new channel. `plating-stack` uses the existing hit-plating
stack status. The client HUD reads these through the buff atoms it already has; the tree
panel does not need them.

### Stat-row trail

The stat row's cosmetic (design §8) is derived **client-side** from
`PlayerView.lineages[<lineage>].active.stat` → the card's `fx` key. No event.

### `mechanic-fired`

One helper, `emitMechanicFired(world, player, ctx?)`, in
`server/src/systems/combat/engine/mechanicFired.ts`. Call sites, one each:

| Root | Where |
|---|---|
| cadence | when the finisher's empowered flag is consumed |
| cooldown | when the execution's empowered flag is consumed |
| dot | when a target reaches max stacks (once per target per fill) |
| reload | when a reload completes |
| energy | when the burst fires |
| summoner | ~~when a command intent is applied~~ — **superseded in Phase 3**: when a formation cycle completes (every living summon has hit the same target since the last fire). A command is a click and never fires unattended. |

It dispatches the `mechanic-fired` lineage listeners and nothing else. Test:
`server/test/mechanicFired.test.ts` asserts exactly one emission per event and never two
on one hit for cadence and cooldown, one per fill for dot, and one per full formation
cycle for the summoner (with a command intent firing nothing).

### Listener registration

`server/src/systems/combat/lineageCards.ts` exports `registerLineageCards()` and is
called from `initCombatSystems()`. One listener per `TriggerKind`, reading
`resolveActiveLineages(player)` from a per-entity cache refreshed on recalc (store the
resolved list on `TracksCombat` through the helper API). `hit-nth` counts per player
per card on `TracksCombat` counters. `first-hit` resets on engagement end. Every
on-target applier early-returns on `evadeBlocksDebuffs(ctx)`. `damage-window` writes
`ctx.metadata.empoweredMultiplier` and never a second multiplier.

### Defensive faces

`OFF_FACE_SCALAR` is applied at resolve time from `defensiveFaceForSubVariant(frame)`;
the runtime never reads the frame. Offensive cards (no `face`) are frame-neutral.
