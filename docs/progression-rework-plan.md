# Progression Rework — Implementation Plan

**Status:** active plan, drafted 2026-09-30. Phase 0a (harness, bench, `PLAYER_RECOVERY`
10 → 5) and Phase 0b (flat HP/s Recovery, per-tier base, fixed OOC rate, charm
re-derivation) were implemented the same day; live-bot confirmation, the human playtest
and the per-tier pool raise are still open — see the progress notes under Phase 0.
Phases 1–5 are not implemented.
**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md).
Read that first; this page only says what to build, where, in what order, and how
each phase proves itself.

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
could not confirm are in `recovery-current-state.md` §8. Still open: the charm sweep as a
true time-to-death check (the conversion is analytic, checked only through the fight-end
metric), the live-bot column, the human playtest, and the pool raise.

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

**Exit.** Playtest: players say where they went to farm and why, and name the shard they
were after. Bench: the favoured lane wins each family by ~30% and the punished lane still
clears.

---

## Phase 3 — Frame loops and range nodes (class-by-class review first)

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

**Exit.** A pure-lane build completes its packet across three slots and the bench shows
the cross-slot completion as a measurable step (not a stat drift).

---

## Phase 5 — T2 band and form re-homing

- Amplifier row and the T2 magnitude row. Old-band collapse and stat-row absorption at
  the gate (bible §4).
- Re-home later-biome debut roots as forms (open decision 4 gives the table): Jungle
  Stinger/Venomthorn/Deathfang on Rapier, Desert Sunsteel on Broadsword, Tundra maul on
  Hammer, and so on. Each is one capstone plus existing art. `LEGACY_ITEM_IDS` maps saves.
- T2 families for Jungle and Desert. The eight-shard wallet is checked for legibility with T2 costs live.
- Tutorial: the tier-up beat shows the gate transformation.

**Exit.** Playtest: players describe the gate as the reward moment. Bench: T2 lane
budgets hold; the T1→T2 floor rule (weapon ladder) still cascades.

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
