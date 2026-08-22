# System Rework — Implementation Status

**Companion to:** `docs/system-rework-roadmap.md` (the plan & ordering).
**Purpose:** single scoreboard for what is designed, in progress, and done across the rework.

Update this doc at the end of every session. The roadmap says *what and why*; this says *where we are*.

---

## Status legend

```text
⬜ Not started     — no design Q&A yet
🟡 Designing       — Q&A in progress / open questions remain
📋 Spec'd          — Q&A resolved, paired plan/current-state docs written, ready to implement
🔨 In progress     — implementation underway
✅ Done            — implemented, verified, balanced
⏸️ Parked          — deliberately deferred
```

---

## Scoreboard

| # | Step | Tier gate | Status | Q&A | Paired docs | Notes |
|---|------|-----------|--------|-----|-------------|-------|
| 1 | Aspect Essence economy | all | 🔨 | resolved | `aspects-catalysts-*.md` | IMPLEMENTED (structure); aspect labels live, starter-biome essence mixtures seeded; numbers = your balance pass |
| 2 | Biome Catalysts | all | 🔨 | resolved | `aspects-catalysts-*.md` | IMPLEMENTED (structure); wallet+grant+spend+UI live, weight defaults to essence; threshold/costs/bundles = your tuning |
| 3 | Recipe system + Biome Mastery | all | 🔨 | resolved | `global-mastery-*.md` | IMPLEMENTED; biome levels **expanded 4→6** (user call); all recipe `requiredBiomeLevel` remapped (L5/6 = empty reward space for later steps); `BIOME_LEVEL_CAP_BY_TIER` (dead) deleted |
| 4 | Global Mastery | all | 🔨 | resolved | `global-mastery-*.md` | IMPLEMENTED; `globalMastery()` = sum of biome levels (excl clearing, derived); replaces tier in RP budget (`/10` placeholder) + upgrade-cap seam (`min(structural, gmCeiling)`, non-binding placeholder); on PlayerView + admin; numbers = your balance pass |
| 5 | Rune reward sourcing & RP budget | all | 🔨 | resolved | `rune-system-*.md` | IMPLEMENTED; RuneRecipe biome gating (recipeGroup+requiredBiomeLevel) + shared isRuneRecipeUnlocked; all 11 runes moved to biome gating (boss channel reserved); RP-capacity recipes + runePointBonus fully retired (RP from GM); requiredBiomeLevel values = your balance pass |
| 6 | Gear evolution & reconstruction | all | 🔨 | resolved | `gear-evolution-*.md` | MACHINERY + 1 worked lineage IMPLEMENTED; Recipe lineageId/evolvesFrom + reconstructCost; MAX_UPGRADE→5; systems/evolution.ts; server evolveItem (evolve/reconstruct) + crafting:evolveItem; ForgeTab Evolve/Reconstruct; rapier lineage (flash-rapier→gale-needle/thorn-needle). Other slots/biomes + numbers = your pass |
| 7 | Skills rework | T1+ | 🔨 | resolved | `abilities-*.md` | IMPLEMENTED (full T1–T4 roster of 18 on authored ranks; see 2026-08-22 below). New Abilities system; state on TracksProgression (like runes); Technique=arm-next-attack (hasArmedAbility) / Guard=immediate via the BUFF SYSTEM (explicit `ability-guard` buff, e.g. Brace=DR); built-in heuristic + dedicated TECHNIQUE/GUARD rune-override channels (fire-technique/fire-guard, starter); AbilityRecipe biome-gated; desktop + mobile UI. Evolution + per-biome content + numbers = later |
| 8 | Charms & recovery layers | all | 🔨 | resolved | `charms-*.md` | IMPLEMENTED (machinery + 2 worked charms). Net-new = Guard-ability amplifier: 4 `guard.*` passives (cooldown-reduction / potency / duration / heal-on-fire) read at fire time in `abilityFiring.ts`; ride the existing mechanicEffects→passives pipeline (no new state). 7 "X Core" charms renamed (slot stays `recovery`). Class baseline recovery untouched. Numbers + per-biome charm identities = your pass |
| 9 | Cores | T2+ | 🔨 | resolved | `cores-*.md` | **REWORKED 2026-08-03; ICONS 2026-08-04** — see `docs/archive/cores-rework-implementation-plan.md`. Eligibility collapsed from `rangeTag` (close/mid/far/universal/party) to `coreEligibility` (melee/ranged/unrestricted); `party` dropped. 12-core cast authored one per biome (3 biomes carry two), replacing the 5 placeholder forest cores (deleted; `playerRepo` now prunes unknown item ids on hydrate), with twelve bespoke PixelLab icons wired to the recipes. Fixed a TIER-PLACEMENT bug: a range is not picked until player tier 3, so the old restricted cores sat in the T2 band and were craftable-but-inert. 7 new passive consumers (recovery funnel, elite damage, on-hit, debuff duration/potency via an enumerated registry, 2 mobility clauses). NO DoT core — `core.attack-mult` already scales DoT. Growth = evolve into named branches at the next tier (none authored yet). Numbers = your pass |
| 10 | Stances | T2 | 🔨 | resolved | `stances-*.md` | REWORKED: 11 modal stances; one free default; any learned stance can be a destination on a priority-ordered `switch-stance` Rune rule; destination-specific RP; non-destructive 1.5s-dwell switching with HP-percentage preservation; game-style destination sigil UI. CORRECTIVE PASS 2026-08-22: flat modifiers replaced by percentages, no stance touches max HP, damage-taken is a stance-local multiplier instead of additive DR, all server behavior exposed in the effect text, recipe gates un-rotted. Magnitudes remain a balance pass. |
| 11 | Rites (name locked) | T3 | 🔨 | resolved | `rites-*.md` | REWORKED: 6 combat-boundary Rites with RP as the sole constraint; unified ACTIVE/POST/OOC boundary; exact-once combat-end effects; Purification, Mechanic Renewal, Ability Reprieve, Blood Offering, Lingering Battle, and Swift Repose. Numbers remain a balance pass. |
| 12 | Biome identity / combat ecology | all | 🔨 | resolved | `biome-ecology-*.md` | **multi-session program**. PRIMITIVES + TELEGRAPHS done (A1 packs+call-allies / A2 patrols / A3 swarm; alpha tint + `ecology-pulse`). **ALL 5 STARTERS authored end-to-end** (Forest packs / Plains swarm+caller / Mountain sentinel-patrols+chokepoint-terrain / Swamp rot-pool-hazard-terrain / Cave patrolled-elites+high-detection). Each: open-world primitive tags + biome boss exams + terrain where core identity. **ALL 6 ADVANCED BIOMES authored** (Jungle/Desert/Volcanic/Tundra/Graveyard/Trench) + 5 new shared mechanics + an ELITE-TAG SYSTEM: `openingStrike` (jungle pounce / desert alpha-strike), Sun Mark (`appliesMark`+`markedStrike`, cleansable), `ambientHeat` (Volcanic node-wide soft-timer, `updateAmbientHeat`), `enemyShield.shatter` (Tundra ice-armor break → bonus + freeze via applyStun), `appliesAntiheal` (Trench abyssal pressure, stacks the existing `antiheal` status). ELITE system = `elite` def tag + yellow client outline (derived, no networked field) + `focus-elites` TARGETING rune (ELITE_FOCUS_WEIGHT in targetPriority) + `spawn-adds maxAlive` cap. Graveyard REWORKED to necromancers (`gravewright` raises capped undead that crumble on death — a normal mob with a repeating-spawn-adds bossScript). Terrain helpers: `denseBush()`/`lavaVent()`/`volcanicHeat()`. Reusable terrain placeholder visual (block=gray, hazard=toxic-green). REMAINING: Step 13 boss scaffolding, onAlphaDeath, real terrain sprites, numbers (Step 15) |
| 12b | Monster combat rework (T1-T4) | all | 🔨 | resolved | `monster-combat-rework-current-state.md` + `design_docs/MONSTER_COMBAT_REWORK_HANDOFF_T1_T4_2026-08-22.md` | **IMPLEMENTED 2026-08-22** (structure + behavior; numbers are NOT). Follows Step 12: that pass gave every biome an ecology, this one gave individual monsters and LINEAGES a readable identity. A good implementation deleted more than it added — blanket evasion, roster-wide DoT, per-mob `rampOnCombat`, per-hit slow spam, universal anti-heal and the pack-alpha SCATTER all removed. Volcano Heat / Tundra Chill already existed as `ambientRamp` node features (Chill gained an attack-slow term); non-recursive corpses were already enforced. New primitives: `flies`, `staticSentry`, `idleAnchor`, `openingVolley`, `cadenceVolley`, `dotEffect.openerStacks`, `cadenceFinisher.rootMs`, `shellUp`, `empowersAllies`, `enemyShield.rechargeAfterCleanMs`, `enemyShield.shatter.vulnerability`, `scalesWithAmbientRamp.chargedOnly`, and four `chargedAttack` riders (`rootMs` / `appliesAntiheal` / `refreshesPlayerDots` / `requiresAmbientStacks`) so every periodic ability arrives with a cast bar instead of its own subsystem. Desert re-cast as EXACT 1:1 controller/dealer duos (dealers removed from the spawn pools so a lone kiter can never spawn). `charnel-brute` DEFERRED TO T5. Bosses untouched. Numbers = Step 15 |
| 13 | Dungeons/Guardians/Bosses as exams | all | 🔨 | resolved | `dungeon-current-state.md` | **GAUNTLET REMOVED 2026-08-09** — a dungeon is now altar + per-biome guard posture + boss, no waves, no per-dungeon bonus mechanics. All 26 dungeons generate from `BIOME_GUARD_POSTURE`. Every number is a placeholder; the balance pass remains |
| 14 | UI / clarity / failure diagnosis | all | 📋 | resolved | `ui-redesign-plan.md` | Desktop UI redesign is phased with review gates and model-budget guidance; MVP new-system visibility remains part of Intent/disclosure work; failure diagnosis deferred. |
| 15 | Balance + simulation tooling pass | all | 📋 | resolved | — | Claude builds tooling (dps/eHP, bench, NEW economy sim, monster-ref); you tune |
| — | Relics | T4+ | ✅ | resolved | `relics-*.md` | **IMPLEMENTED 2026-08-04** — sixth equipment slot; one universal Relic; T4 server equip gate; four signed ratings resolved across Cadence/Cooldown/Reload/DoT/Energy/Summoner; explicit mechanic-origin buff/debuff registries; exact eight-item mastery cast including Haunted Prism in Wasteland (`graveyard`); no ordinary stats or +N track; +0 named-evolution seam; persistence normalization + Forge/inventory/resolved previews; eight bespoke PixelLab icons. Final balance and T5/T6 evolutions remain. |
| — | Conduit flavor pass | T1-T4 | ✅ | resolved | `archive/summoner-flavor-pass-plan.md`, `conduit-current-state.md`, `archive/conduit-player-specialization-sprites-handoff.md` | **COMPLETE 2026-08-08.** Summon-creature flavor plus the nine bespoke tier-4 Conduit **player-character bodies**, mapped, packed, anchored and covered by `conduitPlayerBodies.test.ts`. Conduit bodies chain at initImageStrength **65**, not the 75 used for all 45 other T3 bodies: its parents are a plain robe column with no internal parts to reinterpret, so 75 reprints the robe and two rounds were rejected as too similar. The nine read somewhat samey by construction — the invariants lock robe, mask and hood, which are the very channels other classes differentiate on; further variety needs an accent slot. Remaining balance gaps: Kilnmaster reads ~17px and `conduitDefenseShare` has no consumer. |
| — | Map traversal | — | 🔨 | resolved | `map-variety-plan.md` | Design LOCKED (v3). Stage A (node modifiers + catalyst re-key on the existing grid) IMPLEMENTED 2026-07-24; Stage B (regions) pending its own plan. See dated log below. |
| — | World events | — | ⏸️ | — | — | future |
| — | Group content | — | ⏸️ | — | — | future |

---

Map Variety Stage A log (2026-07-24): shipped node modifiers + catalyst re-key.
Five pace families are authored per normal node (`shared/src/world/nodeModifiers.ts`,
`nodeModifierMap.ts`), non-boss monster
offense reshaped at the `createMonster` choke point (budget-neutral scalars +
`moddedByNode` mechanic overlays; bosses immune), catalysts re-keyed from biome
group to combat family with wallets wiped (migration 0002), and the map
information contract surfaced client-side. Swarming and Elite Ground were
deactivated on 2026-07-24 while their design is reconsidered: their vocabulary
and helper code remain behind `DENSITY_MODIFIERS_ENABLED = false`, but authoring,
projection, population, spawn selection, rewards, and UI are all inert. All
magnitudes/tags PLACEHOLDER. Stage B (regions) has shipped; see
`docs/archive/map-variety-regions-implementation-plan.md`. Design:
`docs/map-variety-plan.md`.

Step 13 current note: T1 now has an authored `preEncounter` path for worked
biome exams, replacing generated guardian rings where migrated. Plains, Forest,
and Swamp T1 are authored and smoke-tested; Swamp includes concrete temporary
rot-pool hazard wiring. The legacy `guardianPhase` fallback remains for
unmigrated/old content and higher-tier phase scaffolding.

## Recommended implementation order

Q&A is complete (all 15 📋). Suggested build sequence, honoring the dependency graph:

1. **Step 4 — Global Mastery** *(keystone)*. It replaces the tier term in RP (Step 5) and the upgrade
   cap (Step 6), so it must land first. Small, self-contained (derive sum of biome levels). **← NEXT.**
2. ✅ **Steps 1 + 2 together — IMPLEMENTED** (2026-06-23). Essence→aspect display labels + per-mob
   starter-biome mixtures, and Biome Catalysts (wallet, weighted grant, `Recipe`/`UpgradeStep` catalyst
   cost axis, spend, UI). Structure complete; numbers are your balance pass. Step 3 is already done
   (kept as-is). Paired docs: `aspects-catalysts-*.md`.
3. **Step 5 — Rune sourcing** — biome gating on rune recipes; retire RP-capacity recipes (RP now from GM).
4. **Step 6 — Gear evolution** — design the lineage/evolution machinery to **generalize beyond gear**
   (Step 7 reuses it); cap→+5; evolve consumes +3 predecessor.
5. **Step 7 — Abilities** (new active system) + **Step 8 — Charm Guard-amplifier**. Adds ability-fire
   rune action.
6. **Steps 9–11** — Cores (5th slot), Stances, Rites. Each adds to the rune-action catalog where noted.
7. **Step 12 program** — AI primitives, then one session per biome; **Step 13 scaffolding** (boss-exam
   template, reward bundles, tell conditions, structural boss-access gating) feeds the biome sessions.
8. **Step 14 — UI MVP** (system visibility + boss/exam info) and **Step 15 — tooling** (incrementally,
   then a formal pass). Failure diagnosis deferred.

**Watch items:** the **rune-action catalog** is a shared hub (gains ability-fire + stance-switch); the
**essence drop-volume tension** (current `BIOME_ESSENCE_TIER_MULT` dampens, brainstorm wants growth) is
parked for the user's balance pass; **"Core" naming** must be freed (Step 8 charm rename) before Step 9.

**Cross-cutting checklist (added post-review — see roadmap "Cross-cutting concerns"):** every step that
touches player state must handle persistence/migration, `NETWORKED_PLAYER_KEYS` + dev-boot invariants,
`PlayerView`/protocol, **admin dashboard** (views + grant/reset), and `initCombatSystems()` parity for new
combat listeners. The **essence rename** is heavier than it looks (prefer display-name-only). **Abilities**
must be validated across all 6 class archetypes. Boots are NOT a gap — `mobilityBoots.ts` already implements
stealth/pull/kite/ramp (`mobility.*`), untuned.

---

## Current-state notes (fill as each step is audited)

Capture *what exists in code today* per system before designing its rework. Pre-existing
current-state docs are linked where available; the rest are filled at the step's session start
(do a real code read — don't assume).

### 1. Aspect Essence economy  — ✅ IMPLEMENTED (structure)
- 5 generic essence keys retained (`red|blue|green|yellow|purple`); aspect names are **display-only**
  via `ESSENCE_LABELS` / `essenceLabel()` (`shared/src/items.ts`): Might/Wild/Rot/Stone/Deep. Routed
  through EssencePanel, NodeInfo recipe costs, admin CharactersTab, and server reason strings.
- Per-mob essence variety seeded on starter biomes (one thematic off-type mob each → neighbor aspect).
  Advanced-biome mixtures + drop-volume curve = user balance pass.
- (Original audit: monsters dropped a single biome-primary essence; no mixtures.)

### 2. Biome Catalysts  — ✅ IMPLEMENTED (structure)
- New `catalysts` + `catalystProgress` wallets on `TracksProgression` (keyed by biome group), carried
  through `PlayerView`/composer, client atoms, and persistence (whole-slice JSON; `{}` defaults for old rows).
- Granted in `applyKillRewardsToPlayer` (weight defaults to base essence reward; mints at
  `GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT`); one-time `catalystBundle` on first biome-boss clear; party
  same-node sharing rides the existing loop. Spent in `craftRecipe` + `upgradeItem`/`checkUpgrade` via the
  `catalystCost` axis on `Recipe`/`UpgradeStep`. UI: CatalystPanel + catalyst cost chips + affordability gates.
- Numbers (threshold, weights, bundles, which recipes cost catalysts) = user balance pass.

### 3. Recipe system + Biome Mastery  — ✅ IMPLEMENTED (biome-level expansion)
- Recipe system kept; gates on `requiredBiomeLevel` (per `recipeGroup`) + `requiredBossClear`.
  **Gear-only** still (skill/rune/core recipes come with their own steps).
- **`BIOME_LEVELS_PER_TIER` expanded 4 → 6** (`gameConfig.ts`) — user call (chose to do it now while
  saves are disposable). Drives `biomeLevelCap`/`biomeLevelOffset`/XP curve automatically; the generic
  `requiredBiomeLevelForUpgrade` fallback now uses the constant (was hardcoded `*4`).
- All recipe `requiredBiomeLevel` literals **remapped** 4-band → 6-band via
  `L' = seg*6 + ((L-1)%4 + 1)` (start-tier-independent → gating preserved). `clearing` left at cap 4
  (its recipes not remapped). New levels 5/6 of each segment = empty reward space for later steps.
- The dead `BIOME_LEVEL_CAP_BY_TIER` array (no code consumer) was **deleted**; the live cap is the
  `biomeLevelCap()` function.
- Biome progression remains level/XP-based — Biome Mastery = the existing biome level track (per Q&A).

### 4. Global Mastery  — ✅ IMPLEMENTED (structure)
- `globalMastery(biomeLevel)` (`config/gameConfig.ts`) = sum of biome levels, **excludes `clearing`**,
  **derived** (not persisted → no migration, no networked-slice change). On `PlayerView`
  (`globalMastery`), client `globalMasteryAtom` (derived from `biomeLevelAtom`), and `AdminCharacterRecord`.
- RP budget: `runeBudgetForGlobalMastery(gm, runePointBonus) = 8 + floor(gm/10) + bonus`
  (`runeDatabase.ts`) — replaced `runeBudgetForTier` at all 3 call sites (playerLifecycle, index,
  RunesPanel). `/10` is a non-regressive placeholder (GM 0/20/40 → 8/10/12 = old T0/T1/T2).
- Upgrade cap: `upgradeCeilingFromGlobalMastery(gm, itemTier)` + `checkUpgrade({ …, globalMastery })`
  seam (`itemUpgrades.ts`); effective max = `min(structural, gmCeiling)`. **Tier-banded since
  2026-07-10**: each item tier owns the GM band `(maxGlobalMasteryAtTier(T-1), maxGlobalMasteryAtTier(T)]`
  (derived from biome start tiers × `BIOME_LEVELS_PER_TIER`, clearing excluded); +1…+5 spread evenly
  across the band so +5 lands at full tier mastery (T1 @ GM 30, T2 @ 72, T3 @ 126, T4 @ 198). GM
  threaded into server `itemUpgrade.ts` + client `UpgradeTab`/`MasteryPanel`/`MenuButtons`.
- Numbers (RP divisor) = user balance pass.

### 5. Rune reward sourcing & RP budget  — ✅ IMPLEMENTED
- `RuneRecipe` gains `recipeGroup` + `requiredBiomeLevel` (biome-mastery gate) alongside the existing
  `requiredBossClear` (now reserved for advanced/signature runes). Shared `isRuneRecipeUnlocked(recipe,
  { biomeLevel, bossesCleared })` is the single gate authority (server `runeCrafting` + forge UI).
- All 11 current unlock-rune recipes re-tagged from boss gating → biome-level gating in their biome
  (forest/cave/mountain/swamp); placeholder `requiredBiomeLevel` 2–4 = user balance pass.
- **RP capacity fully retired:** the 3 `increase-rune-points` recipes, the `increase-rune-points` kind,
  `runePointBonus` (slice + PlayerView + atom + RunesPanel "forged" display), and
  `runePointBonusFromCraftedRecipes` all deleted. RP comes solely from GM (Step 4). Clean cutover.
- See `docs/rune-system-current-state.md` for the updated forge/budget description.

### 6. Gear evolution & reconstruction  — ✅ MACHINERY + 1 lineage IMPLEMENTED
- Recipe/ItemDefinition gain `lineageId`, `evolvesFrom`, `reconstructCost`/`reconstructCatalystCost`.
  `MAX_UPGRADE 3→5`. New shared `systems/evolution.ts` (`checkEvolve`/`checkReconstruct`,
  `EVOLUTION_REQUIRED_PLUS=3`, `isEvolvedRecipe`). Server `economy/itemEvolution.ts` (`evolveItem`,
  evolve consumes +3 predecessor / reconstruct skips it); `craftRecipe` rejects evolved recipes.
  Protocol `crafting:evolveItem`; ForgeTab renders Evolve/Reconstruct. Worked `rapier` lineage in
  forest (flash-rapier base → gale-needle evolved + thorn-needle branch). See `gear-evolution-*.md`.
- Per-id upgrade model unchanged (item id = recipe id; `itemUpgrades` per-id). Numbers = user pass.

### 7. Skills rework  — 🔨 IMPLEMENTED (full T1–T4 ability roster; paired docs `abilities-*.md`)
- **2026-08-22 — T1–T4 ability rework shipped** (design: `design_docs/ABILITY_CAST_AND_TIER_PROGRESSION_T1_T4.md`,
  live state: `docs/abilities-current-state.md`). Replaced `scalePerTierPct` with **authored per-tier
  ranks** (`AbilityRank`: effect + cooldown + castMs + rangeBonus, clamped at both ends) — an ability now
  deepens by being re-authored a tier up, and may change which axis it deepens once one caps. Roster went
  8 → **18** (11 Techniques / 7 Guards) across all eleven biomes, two per biome where a biome owns two.
  Net-new mechanics: the **control ladder** (slow / root / stun, kept structurally distinct) with
  `combat/status/monsterControl.ts` as the single writer for a monster's slowed stats (chill + freeze +
  ability slow reconciled to the strongest per axis — two writers each caching "the clean base" ratcheted);
  **ability engagement range** (`attackRange + rank.rangeBonus`) with its own target resolution, which is
  what finally makes Charge and Snipe worth a slot; `has-hard-control` / `target-beyond-reach` /
  `enemy-within` triggers; Frenzy's attack speed as a cadence-gate multiplier (never an `attackCooldown`
  write — the Zealot already mutates that stat); per-slot Recovery sources; Cleanse made discrete with no
  DR rider; `charged-strike` → `power-strike` re-home with an id migration. Bespoke procedural FX for all
  18 abilities. 89/89 tests. Ten icons drafted, NOT generated. T5+ ranks not authored.
- **2026-07-24 — abilities-evolution Wave 1 shipped** (plan: `docs/archive/abilities-evolution-implementation-plan.md`,
  design baseline: `design_docs/archive/abilities-evolution-plan-updated.md`; both now archived). Engine: `equippedAbilities` became
  ORDERED LISTS per slot kind (order = fire priority) with `abilitySlotCount(playerTier)` granting
  T3 → 2 Technique / T4 → 2 Guard; per-ABILITY cooldowns; one offensive channel with deterministic
  arbitration; one Guard activation per window (buffs still layer); per-slot Guard buff ids
  (`ability-guard`/`ability-guard-2`, multiplicative DR); player CAST lifecycle (`isCastingAbility`,
  hard-CC interrupt only, movement continues, cooldown on resolve); `TECHNIQUE_KEYS` offensive stats +
  the `resolveAbilityEffect` tier-deepening/Technique-Power seam; reposition + reflect primitives;
  `TECHNIQUE_2`/`GUARD_2` rune channels + `target-elite` condition. Content: T1 re-keyed to
  Plains/Forest/Mountain/Swamp/Cave, plus T2 Bramble Guard (Jungle) / Charge (Desert) / Charged Strike
  (Mountain L9). Legacy `{technique,guard}` rows migrate on hydrate (no SQL); `heavy-strike` renamed to
  `expose-weakness`. 34/34 tests. T2 icon art drafted but NOT generated. Waves 2–3 (T3/T4) not started.
- Shipped: new Abilities system (Technique + Guard slots). State on `TracksProgression`
  (`knownAbilities` + `equippedAbilities`) — mirrors runes, no new component/DB migration. Technique
  = arm-next-attack via sibling `hasArmedAbility` (separate from the class-owned `hasEmpoweredAttack`);
  rider applied in an `onHit` listener registered in `initCombatSystems`. Guard = immediate self-effect.
  Built-in per-ability auto-fire heuristic + per-ability cooldown; `fire-technique`/`fire-guard` rune
  actions on NEW dedicated `TECHNIQUE`/`GUARD` channels (not shared CONTROL — avoids mutual exclusion)
  override timing; starter-available. `AbilityRecipe` (parallel to `RuneRecipe`) biome-gated via
  `isAbilityRecipeUnlocked`. Full protocol + client AbilitiesPanel + admin read. Worked content:
  Sweep (Technique/forest, cleave) + Brace (Guard/forest, shield), placeholder numbers.
- Verified: 4-pkg typecheck, both server tests, clean combat bench run, shared sanity script.
- (Original audit retained below for the pre-implementation context.)
- Audited (see `docs/abilities-current-state.md`). Key finds: the **arm-next-attack model already
  exists** (`empoweredAttacks.ts`: `hasEmpoweredAttack` flag + `registerEmpoweredMultiplier`,
  validated across archetypes — Abilities extend it via a sibling `hasArmedAbility` to avoid colliding
  with class mechanics that own the empowered flag); CONTROL rune channel + `taunt.ts` is the
  ability-fire template; `RuneRecipe` is the precedent for a parallel `AbilityRecipe`. Talent tree
  (`UsesSkills`) kept untouched (name collision).
- Plan (`docs/archive/abilities-plan.md`): new networked+persisted `UsesAbilities` (knownAbilities +
  technique/guard slots, free slotting); Technique = arm-next-attack rider, Guard = immediate
  self-facing; built-in per-ability trigger + cooldown, `fire-technique`/`fire-guard` CONTROL rune
  override; ability recipes gated by biome mastery. 5-phase build; worked pair = Sweep + Brace (forest).
  Evolution + per-biome content + numbers deferred.

### 8. Charms & recovery layers  — 🔨 IMPLEMENTED (machinery + 2 worked charms; paired docs `charms-*.md`)
- Audit: charm = the `recovery` equipment slot; recovery engine + per-biome identities **already built**
  (`hpRegen` + `defense.*` mechanicEffects — kill-burst, regen-burst, shield, absorb, cleanse). Class
  baseline recovery (Squire/Striker/Reload/etc.) untouched. Net-new = **only the Guard-ability amplifier**.
- Shipped: 4 `guard.*` passive keys (`guard.cooldown-reduction-pct`, `guard.potency-pct`,
  `guard.duration-pct`, `guard.heal-on-fire-pct`) in a new `GUARD_KEYS` namespace (`passives.ts`). They
  ride the existing equipment `mechanicEffects`→`usesSkills.passives` pipeline (`stats.ts`) — **no new
  state, slice, migration, or listener**. Read at Guard fire time in `abilityFiring.ts`
  (`maybeFireGuard`/`applyGuardEffect`): cooldown reduction shortens `GUARD_CD_KEY`; potency scales the
  guard effect `drPct` (capped 0.9, mirrors abilityEffects' `GUARD_DR_CAP`); duration extends the
  `ability-guard` buff (sets both `remainingMs` and `data.totalMs` so the buff-bar clock matches);
  heal-on-fire deposits `maxHp×pct` into the recovery `BURST_POOL_KEY` (antiheal applies; shows Regen tile).
  The `onDamageTaken` reader in `abilityEffects.ts` needs no change (reads the amplified stored `drPct`).
- Rename: 7 charm items named "X Core" → thematic nouns (Plains Stone, Stalwart Heart, Mirage Talisman,
  Oasis Heart, Fortress Heart, Magmaheart Stone, Inferno Heart). **Slot key stays `recovery`** — only the
  display `name` changed; frees "Core" for Step 9's 5th-slot Core system.
- Worked examples (placeholder numbers): `forest-charm-t1` (Heartroot Amulet) gets cooldown-reduction +
  heal-on-fire (recovery-themed, pairs with Brace); `plains-charm-t1` (Plains Stone) gets potency
  (contrasting). Other ~30 charms' amplifier identities + all numbers = user content/balance pass.
- Verified: 4-pkg typecheck, both server tests, clean `autoCombatSameNode` bench (5 players).

### 9. Cores  — 🔨 REWORKED 2026-08-03 (12-core cast; paired docs `cores-*.md`)
- **Living truth is `docs/cores-current-state.md`.** Plan + rationale:
  `docs/archive/cores-rework-implementation-plan.md`. Design source: `design_docs/CORE_*.md`.
- Rework summary: eligibility is now `coreEligibility: melee | ranged | unrestricted`
  (`party` removed; mid and far share one pool). 12 cores authored one per biome — 3 T2
  unrestricted starters, 3 T3 melee, 2 T3 ranged, 4 T3 unrestricted specialists. The 5
  placeholder forest cores were deleted and `playerRepo` prunes unknown item ids on hydrate.
- **Bug the rework fixed:** a range is not selected until PLAYER TIER 3, but the placeholder
  restricted cores sat in the T2 biome-level band — craftable, equippable, permanently inert.
  Distinct from the 2026-08-02 suffix-match fix; this one was content placement.
  `coreAuthoring.test.ts` now asserts the invariant.
- New consumers: `core.recovery-mult` (stat rebuild + the `applyHealToPlayer` funnel),
  `core.elite-damage-mult` + `core.mobility-refund-on-kill-pct` (listeners in
  `systems/combat/cores.ts`), `core.onhit-mult` (folded into `onHitMult` in `runPlayerAttack`),
  `core.debuff-{duration,potency}-mult` (via `SCALABLE_DEBUFFS` + `applyPlayerDebuff`),
  `core.mobility-cooldown-reduction-pct` (`techniqueCooldownMs`). `core.hpregen-mult` was
  folded into `core.recovery-mult`. Arcanist reuses the existing `technique.*` keys.
- **No DoT core, deliberately** — DoT damage per stack derives from the final
  `dealsDamage.attack`, which `core.attack-mult` already multiplies, so a DoT-potency core is
  a redundant second multiplier. See the plan doc before proposing one.
- Growth model: evolve into one of several named branches at the next tier (one evolve, one
  decision). Every core carries a `lineageId`; no branches authored yet.
- Verified: typecheck clean (4 pkgs + bench); `pnpm test` 45/45; bench bots equip an eligible
  core on every T2 and T3 build.
- (Original Step 9 implementation notes retained below for history — the `rangeTag` model and
  the 4 placeholder cores they describe are SUPERSEDED.)

### 9a. Cores — original Step 9 implementation (SUPERSEDED by the 2026-08-03 rework)
- Shipped: `'core'` added to `EQUIPMENT_SLOTS`/`EquipmentMap`/`emptyEquipment` — equip/unequip,
  persistence (hydrate spreads `emptyEquipment()` → old rows get `core:null`), networked state
  (nested in the already-networked equipment map), and recipe-unlock all rode the slot-generic
  paths with **zero** server logic changes. `CoreRange` (close/mid/far/universal/party) +
  `rangeTag` on `Recipe`+`ItemDefinition`→`ITEM_DATABASE`. New `shared/src/systems/cores.ts`
  (`coreIsActive`/`isDirectionalCore`) is the single gate authority. **Range-gating** lives in the
  `stats.ts` equipment loop: a directional core whose tag ≠ `selectedRange` is skipped entirely
  (stats + mechanicEffects); universal/party always apply. Cores are **off the +N upgrade track**
  (`getMaxUpgrade`→0 for slot `core`); they rank up via the Step 6 evolution chain with
  `requiredPlusFor(recipe)` (0 for cores, 3 for gear) so rank-up only needs *owning* the predecessor.
- UI: core slot in inventory + forge (labels/abbr/filter/colors); `EquipmentSlots` dims an inactive
  directional core + title hint; `StatSheet` shows a range badge with active/inactive; ForgeTab card
  shows the range requirement. Admin/grant ride `ITEM_DATABASE` (no change).
- **Multiplier model (added post-impl, user request):** cores act as PERCENTAGE multipliers on
  overall stats, not flat adds. New `CORE_KEYS` namespace (`passives.ts`): `core.attack-mult` /
  `maxhp-mult` / `plating-mult` / `speed-mult` / `attack-speed-mult` / `hpregen-mult` (sum across
  sources, applied once in a new "core-multiplier pass" in `recalculatePlayerStats` after the reload
  layer / before the hp-clamp; negatives reduce → tradeoffs). Plus `core.dr-layer-pct` = a SEPARATE
  multiplicative DR layer applied in `runMonsterAttack` (`final = base × (1−DR) × (1−layer)`, clamped
  0.9) — so 50%+50% ⇒ 25% taken, not immunity. Read from passives at combat time (mirrors
  `shared.damage-mult`), no new networked field. %-based heals/shields (heal-on-fire, shield-pct)
  scale for free via the maxHp multiplier; a dedicated "multiply flat recovery bursts" is deferred.
  The range-gate skips a mismatched core's `mechanicEffects`, so off-range multipliers don't apply.
- Worked content (forest, T2 band, **placeholder numbers**): Bastion Core (Close, +20% HP / +30%
  plating / +10% DR-layer), Sniper Core (Far, +25% atk / −15% HP tradeoff), Arcanist Core (Mid,
  +15% attack speed / +5% atk), Tempered Core (Universal, +8% atk / +8% HP, always-on/weaker), +
  Bastion Core II rank-up chain (+30% HP / +45% plating / +15% DR-layer; evolve from rank 1 / reconstruct).
- Verified: 4-pkg typecheck clean; shared rebuild clean; both server tests pass; core gating +
  rank-up sanity script (close@close on / close@far off / universal always on / maxUpgrade 0 /
  required-plus 0 / rank-up needs predecessor); clean `idle` bench (no stats-loop regression).
- Deferred: signature core hooks needing new combat behavior (threat control, stickiness, etc.);
  T3 range-specific evolution / T4+ morphs; cross-range Party-role mechanics; cores in bench bots
  (Step 15 tooling); other biomes' core families + all numbers (user pass).
- (Original audit retained below for pre-implementation context.)

### 9. Cores — pre-implementation audit (paired docs `cores-*.md`)
- Audit (`docs/cores-current-state.md`): no core system, but the 5th-slot plumbing is **free** —
  equip/unequip, persistence (hydrate spreads `emptyEquipment()`), networked state (nested in the
  already-networked equipment map), and most UI are generic over `EQUIPMENT_SLOTS`. `selectedRange`
  (close/mid/far) already exists and is already mechanical (combat AI). Net-new = **range-gating** in
  the `stats.ts` equipment loop + a `rangeTag` axis on cores.
- Plan (`docs/archive/cores-plan.md`): add `'core'` to `EQUIPMENT_SLOTS`; `rangeTag` (close/mid/far/universal/
  party) on `Recipe`+`ItemDefinition`→`ITEM_DATABASE`; `coreIsActive()` shared helper gates the stats
  loop (directional core off unless `selectedRange` matches; universal/party always on); ranks reuse
  Step 6 evolution machinery with **required-plus 0** for the `core` slot (cores stay off the +N track);
  T2 via biome-level placement; worked = Bastion(Close)/Sniper(Far)/Arcanist(Mid)/Universal + one rank
  chain. 5 phases (shared → server → UI → content → verify). No new combat listener, no migration,
  no networked-allowlist change. Ready to implement.

### 10. Stances  — ✅ REWORKED + CORRECTED (paired docs `stances-*.md`)
- Corrective pass 2026-08-22 (`design_docs/archive/STANCE_CORRECTIVE_PASS_HANDOFF_2026-08-22.md`):
  structure frozen, magnitudes still seeds. See `docs/stances-current-state.md`.

### 11. Rites/Disciplines/Protocols
- Current state: _none expected_ — confirm; locate any OOC/between-fight hook.

### 12. Biome identity / combat ecology  — 📋 PLANNED (paired docs `biome-ecology-*.md`)
- Audit (`biome-ecology-current-state.md`): `updateMonsters` is a flat per-monster loop with NO
  inter-monster coordination; aggro is independent (no call-allies); spawning places mobs one-by-one
  at random (no packs/patrol anchors); terrain (`nodeFeatures`: block/damage/slow) + boss systems
  (`bossScript`/`ultimateEncounter`/gauntlet) + ranged/kite/charge/DoT ALL already exist. Net-new =
  coordinated AI (packs/patrols/swarm) + telegraphs only. Monsters are ephemeral → no persistence.
- Plan (`docs/archive/biome-ecology-plan.md`): Q&A locked all-ambitious — full-program design, all 3 primitives,
  retrofit existing mobs, networked telegraphs. Part A = 3 primitives (component-gated; `updatePacks`/
  patrol-in-`updateMonsters`/`updateSwarm` set INTENT, `updateMonsters` stays the single executor;
  new server-only `inPack` + `controlsMonster` patrol scratch; telegraphs via networked alpha field +
  transient `pushEvent` howl/rally — prefer position-scan over an on-hit listener for bench parity).
  Part B = retrofit map (Plains swarm / Forest packs / Mountain+Cave patrols / Swamp terrain). Part C =
  all 11 biome ecology specs. Sequencing: primitives (1-2 sessions) → Step 13 scaffolding → 1 session/biome.

### 13. Dungeons/Guardians/Bosses as exams
- Current state: see `docs/dungeon-current-state.md`. Confirm what shipped vs. planned.

### 14. UI / clarity / failure diagnosis
- Current state: _to audit_ — HUD shell, existing telemetry/death events, admin analytics reuse.

### 15. Balance + simulation tooling pass
- Current state: `tools/` balance TUI, dps-report; planned eHP report tool.

---

## Session log

Append one line per working session: date · step(s) touched · outcome.

```text
2026-06-28  Step 13 (Forest T1 rework, user dir): sharpened the Forest dungeon into a true
            alpha-priority / predator-burst exam. PRE-FIGHT: added a PREDATOR HOWL to the alpha den —
            the `wolf` alpha now carries `aura: {kind:"damage", range:220, mult:1.18}` (same machinery as
            the Plains caller) so its young wolves hit harder while it lives; kill the alpha first to defang
            the pups. The alpha was already territorial (localWanderRadius 0). BOSS: made MARKED PREY → SAVAGE
            MAUL the whole identity. New `chargedAttack.marksTarget {durationMs}` field (shared types): when
            the charged Maul's wind-up BEGINS, the boss paints the shared `sun-mark` "MARKED" debuff on the
            target (a cleansable buff-bar tell + marker pulse, ~8 lines in combat.ts at the beginCharge site),
            then the ~1.2s cast bar resolves the ×2.4 spike + pounce-shove, CONSUMING the mark on land (expires
            if interrupted). Reuses the entire mark status/buff/pulse/cleanse infra — zero new client plumbing.
            Reduced the 50% young-wolf call from ×3 → a one-time capped PAIR (count 2 / maxAlive 2); no repeating
            beat, so the Maul (not adds) is the threat. Uncleared rule unchanged (`join`; alpha is the counted
            threat). NEW (user follow-up): an AURA BUFF INDICATOR for both the Plains caller and the Forest
            alpha — the aura SOURCE is stamped with a display-only `pre-encounter-aura` status
            (`PRE_ENCOUNTER_AURA_EFFECT_ID`, shared) at spawn (`applyAuraIndicator` in gauntlet.ts), which the
            existing `targetStatus` mirror surfaces as a "Rally" tile on the HUD target frame (new
            `targetStatusMeta` entry) — no new networked field. Purely cosmetic; aura mechanic still rides
            `TracksDungeon.preEncounterAura`. VERIFIED: shared rebuilt; full 4-pkg typecheck clean;
            dungeonForest test extended (den damage aura + alpha "Rally" indicator / pups none; Maul
            marksTarget; 50% call ≤2 capped + no repeating beat; mark applied at cast-start + consumed on land)
            and dungeonPlains test extended (caller "Rally" indicator); dungeonForest/Plains/Swamp/Cave/
            PreEncounter + targetPriority + runeMaintenance all pass. Docs: dungeon plan (Forest T1 section) +
            biome-refactor-playtest (Forest notes/questions) + this log. REMAINING (Forest): numbers (Step 15);
            onPackAlphaDead pup-scatter still unwired; bespoke "Scent of Blood" label/FX + howl pulse; a
            world-space (over-sprite) aura indicator would need new art (deferred — target-frame only for now).
2026-06-28  Step 13 (Cave T1 revision, user dir): changed the Deep Watch to 3 `cave-brute` sentinels (no
            lurker) that ORBIT the altar instead of patrolling their open-world routes. Added a
            `patrolOverride?: MonsterPatrolRoute` field to `PreEncounterPackDef` (shared) — applied to the
            group leader's `controlsMonster.patrolOverride` at spawn (server spawnPreEncounterPack), which
            `ai.ts` already prefers over `monsterDef.patrol`. `caveSentinel(slot,total,label)` now generates
            a per-brute phase-offset ABSOLUTE patrol ring (300px radius, 8 waypoints, loop) so the three
            circle the altar evenly separated (120° apart); leash widened to 760 so an aggroed sentinel can
            chase across the orbit. The 300px ring sits just outside the 240 pull from the altar center so a
            careful player can slip in to activate between passes (leash only applies while aggroed → the
            un-aggroed orbit is unrestricted). BOSS: made the periodic lurker much rarer — intervalMs 12s→24s,
            initialDelay 6s→12s, maxAlive 2→1 (one lurker at a time). Updated dungeonCave.test.ts (3 brutes
            with the absolute orbit override, sitting on the ring + mutually separated; infrequent capped
            lurker). VERIFIED: shared rebuilt, full typecheck clean, dungeonCave + all other dungeon +
            targetPriority + runeMaintenance tests pass. Docs (plan/playtest/log) updated.
2026-06-28  Step 13: authored the CAVE T1 DUNGEON (node-3-6, Obsidian Broodmother) = the sparse-elite /
            careful-pulling exam (the deliberate OPPOSITE of Plains: dangerous because each enemy matters,
            NOT because there are many; no full gauntlet, pre-encounter + boss only). Reused existing
            systems end-to-end. PRE-ENCOUNTER = the "Deep Watch": 2 patrolling `cave-brute` "Cave Sentinel"
            guardians + 1 roaming `cave-lurker` "Deep Lurker" disruptor, each authored as a SOLO single-mob
            "pack" leader (no follower bodies) → live density 3. The brutes keep their own `cave-brute.patrol`
            loop (relative to each anchor) + high-detection pull range (240, the Cave overpull-risk identity)
            via `localWanderRadius:0` + `pullRange:240` (the pre-encounter spawn's Math.min preserves the
            brute's natural 240); the lurker roams (localWander 220 / leash 520). New shared helper
            `caveSentinel()` in gauntletDatabase. ACTIVATION = shared T1 `join` hook with `unclearedRole:
            "leader"` (every elite is a leader) → cleared elites = clean boss start; any left alive join the
            boss (preEncounterThreat, never gate, normal rewards, no bonus for leaving). BOSS (obsidian-
            broodmother, data-only) kept durable (%DR sponge) but reshaped to SINGLE adds not a swarm: added
            a `repeating` beat (12s / initialDelay 6s) that hatches ONE `cave-lurker` hard-capped at maxAlive
            2, and changed the 50% beat from a 2-`giant-spider` call to ONE stronger giant-spider (still
            behind the timed shield + maxAlive 2). Sparse predictable adds keep the fight about grinding a
            defended elite → Heavy Strike (single-target burst) + Second Wind (sustain) both pay off. No
            reward logic, no gauntlet waves, no other biomes touched. VERIFIED: shared rebuilt; shared+server
            typecheck clean; NEW server/test/dungeonCave.test.ts (def wiring incl. zero follower bodies; Deep
            Watch spawn = 2 patrolling brutes keeping patrol+240 pull / 1 lurker, all leaders; cleared→clean
            start; all 3 uncleared join + clear on boss death; boss clear→cooldown; and a real
            `updateBossScripts` drive proving the periodic lurker fires and stays capped ≤2 = no swarm);
            dungeonForest/Plains/Swamp/PreEncounter + targetPriority + runeMaintenance still pass. Docs:
            dungeon plan (Cave T1 section) + biome-refactor-playtest (Cave notes/questions) + this log.
            REMAINING (Cave): numbers (Step 15); bespoke guardian/altar + brood-add art; the 50% "stronger
            brood" reuses giant-spider as a placeholder. NEXT = Mountain T1 author / migrate, or Step 13 boss
            scaffolding.
2026-06-27  Step 13: transitioned T1 dungeon authoring away from generated guardian rings for worked
            biome exams by adding `DungeonGauntletDef.preEncounter` (authored packs/basins/groups) while
            leaving `guardianPhase` as a migration fallback for old rings and higher-tier phase scaffolding.
            Authored pre-encounters count only their configured uncleared role (caller/alpha/keeper) for
            boss-start difficulty; leftover weak followers alone no longer secretly make the boss harder.
            PLAINS T1 (node-4-3): three local herds, each a `Prairie Caller` + 3 slimes + 1 boar linked as
            a pack, with a small server-only local damage aura; uncleared callers use `extra-adds` to seed
            capped boss-start pressure. Tusked Razorback now has capped periodic slime adds plus a 50% larger
            herd call. FOREST T1: moved from the temporary `GauntletPhaseDef.den` bridge to
            `preEncounter.id="forest-alpha-den"`; alpha is explicitly `Pack Alpha`, only alpha joins on
            uncleared start, pups alone do not affect boss start; Maul/50% wolf call retained. SWAMP T1
            (node-7-4): three rot basins with `Rot Keeper` control mobs; uncleared keepers use the concrete
            `hazard` path to seed temporary boss rot pools. Grave Toadeater now has dungeon-runtime capped
            temporary rot pools that slow/poison, expire, and are surfaced to the client as brighter pulsing
            hazards distinct from permanent swamp terrain; 50% bog-witch call retained. Added client runtime
            hazard renderer, updated altar copy for authored encounter labels, and added/updated smoke tests:
            dungeonPlains, dungeonSwamp, dungeonForest, dungeonPreEncounter. VERIFIED: shared build, full
            `pnpm typecheck`, and all four focused dungeon smoke tests pass. Docs updated: dungeon plan +
            biome playtest notes + this log. NEXT: migrate/author remaining T1 biomes and decide when to
            delete/rename the legacy guardian fallback.
2026-06-27  Step 13: authored the FOREST T1 DUNGEON (node-6-7, Gnarled Greatbear) = the alpha-priority /
            predator-burst exam (deliberately NOT a Plains swarm). Reused existing systems end-to-end,
            net-new code minimal. (1) ALPHA DEN pre-encounter: new `GauntletPhaseDef.den
            { alphaMonsterId }` field (shared) + server `spawnDungeonDen` (gauntlet.ts) — when a guardian
            phase sets `den`, it spawns ONE pack via the existing `world.spawnPack` (the `wolf` alpha + its
            2 authored `young-wolf` followers) instead of a ring of bodies, tags all as idleDungeonGuardian,
            pins them to guard posts (wanderRadius 0, reduced pull), and buffs/renames ONLY the alpha (the
            danger) — pups stay modest. Pack keeps `inPack` so the existing call-allies pounce works. Forest
            T1 content entry in gauntletDatabase (den + `unclearedThreat: join`). (2) ACTIVATION: reuses the
            shared T1 join hook — cleared den = clean boss start; uncleared den joins the boss (preEncounter
            Threat, never gates, normal rewards, no bonus for leaving). (3) BOSS (gnarled-greatbear, data-only):
            charged "Savage Maul" via the PRE-EXISTING `chargedAttack` telegraph mechanic (cast bar +
            ×2.4 single-target spike + pounce-shove knockback, ~1.2s wind-up; resolves through the full player
            pipeline so Brace cuts hit+knockback and stun/freeze interrupts) — tests Brace timing/burst NOT
            AoE; refined the existing 50% phase to call a young-wolf group (×3, maxAlive 3) + light enrage
            (target-priority split); no aoeAttack (forest stays single-target). DISCOVERED: `onPackAlphaDead`
            (pup-scatter on alpha death) is unwired dead code — left as-is, flagged in playtest doc (wiring it
            would strengthen the "kill the alpha" lesson; AI-pass item). VERIFIED: shared rebuilt; shared+server
            typecheck clean (client typecheck fails on a PRE-EXISTING unrelated `../ui/AbilitiesPanel` missing-
            module error in the user's in-progress HUD files — not touched by this work); NEW
            server/test/dungeonForest.test.ts (def wiring; den spawn = 1 alpha+2 young, alpha is the standout;
            cleared→clean / uncleared→join + boss clearable; Maul drives real updateCombat → cast-bar telegraph,
            no dmg during wind-up, spike on resolve); dungeonPreEncounter + targetPriority + runeMaintenance
            still pass. Docs: dungeon plan (Forest T1 section) + NEW biome-refactor-playtest.md (Forest notes/
            questions). REMAINING (Forest): numbers (Step 15), onPackAlphaDead wiring, bespoke Maul FX, wolf-
            specific alpha name; consider the "empower the 50% call" alt hook. NEXT = next biome (Swamp).
2026-06-27  Step 13: implemented the shared T1 DUNGEON RULE on top of the already-built gauntlet system.
            T1 dungeon = pre-encounter + boss fight (NO waves). The existing code converted surviving
            guardians into a must-kill wave phase; T1 now skips that — on altar activation it goes
            STRAIGHT to boss awakening and surviving (uncleared) guardians instead make the boss fight
            harder via a single data-driven, biome-authored hook. NEW shared contract
            `UnclearedThreatEffect` (gauntletTypes.ts) with 4 modes: `join` (guardians keep fighting
            alongside the boss — default, no numbers needed), `empower` (boss +stat per surviving
            guardian), `extra-adds` (extra adds spawn with boss, scaled+capped), `hazard` (PLACEHOLDER —
            flavor message only, concrete biome wiring deferred). Resolved per dungeon in gauntletDatabase
            (`content.unclearedThreat` → `BIOME_UNCLEARED_THREAT[biome]` → DEFAULT join); only `mountain`
            T1 carries a worked `empower` placeholder (untuned) so every code path has a consumer.
            `DungeonGauntletDef.unclearedThreat` + view fields `unclearedThreatMode`/`unclearedThreatCount`.
            SERVER (gauntlet.ts): `isPreEncounterDungeon(def)=biomeTier===1` gates the new path (T2+ keep
            the wave system untouched); `beginPreEncounterBoss` records the surviving count, applies the
            hook, then `startBossAwakening`; new server-only `tracksDungeon.source="preEncounterThreat"`
            (entity.ts) for joined guardians/adds, tracked in a dedicated `state.preEncounterThreatIds`
            list (separate from wave-gating `activeMonsterIds`, which the awakening/boss transitions reset
            — this was the key bug: both `startBossAwakening` and `spawnGauntletBoss` wipe activeMonsterIds).
            Pre-encounter threats NEVER gate the boss (requiredKills stays 1), give only normal rewards
            (no bonus for leaving them), and are despawned by reset/cooldown/freeze like any gauntlet mob.
            `empower`/`extra-adds`/`hazard` consume the survivors at spawn via `applyUnclearedThreatToBoss`.
            FAILURE/FREEZE RESET: confirmed already correct — `resetGauntletIfNodeWiped` (on player death,
            resets to idle when no live players remain in node, party-agnostic) + `freezeNode`/`thawNode`
            (discard runtime → rebuild fresh idle on return). No change needed; new threat list wired into
            both reset paths. ABILITY/COMBAT COMPAT: independent of the empowered-attack AoE removal / Sweep
            / before-empowered rune (dungeon only uses monster modifiers + openingStrikeMult). Preserved
            the explicit altar activation flow. VERIFIED: shared rebuilt; 4-pkg typecheck clean; NEW
            `server/test/dungeonPreEncounter.test.ts` (cleared-baseline vs empowered boss HP/atk scaling on
            mountain T1; join: guardians persist through boss spawn, don't gate, killing one ≠ complete,
            boss death → cooldown); targetPriority + runeMaintenance tests still pass. REMAINING (biome
            passes): per-biome hook choice + numbers, concrete `hazard` wiring, boss-exam authoring.
2026-06-27  Step 7 follow-up: wired the 3 T1 abilities into biome UNLOCK recipes (mostly confirm + place).
            The recipes already existed from the abilities-authoring pass (Cleanse/swamp, Heavy Strike/
            mountain, Second Wind/cave) and were already correctly wired end-to-end — biome-gated via
            AbilityRecipe (recipeGroup + requiredBiomeLevel), no boss-clear, learned permanently into
            knownAbilities (craftAbilityRecipe), and auto-surfaced in the AbilitiesPanel "Learn" list +
            forge (both iterate ABILITY_RECIPE_DATABASE, gate on isAbilityRecipeUnlocked). SUBSTANTIVE
            CHANGE: moved all three from requiredBiomeLevel 2 → 3 to honor the "mid-biome answer tool"
            placement (T1 content band is L1–4; L3 = mid, so the player meets the biome's challenge then
            earns the response). Costs/levels remain placeholders. NO lineages; Sweep unchanged (still a
            generic cleave, no DoTs); NO T2 DoT-AoE added — left a deferred doc note (DoT AoE/spread is a
            future T2 ability direction; Sweep remains generic cleave). Technique/Guard rune-override
            compat (fire-technique/fire-guard + before-empowered) preserved. VERIFIED: 4-pkg typecheck;
            shared rebuilt; targetPriority + runeMaintenance tests; throwaway sanity (31 checks: validation,
            each recipe → right biome group / L3 gate / no boss-clear / learns the right ability of the
            right slot, locked at L2 / unlocked L3–4, and not unlocked by leveling OTHER biomes).
2026-06-27  Step 7 follow-up: new rune "Empowered Ready" (`before-empowered` CONDITION) lets you land
            your Technique on the empowered hit. Reuses the entire fire-technique override path — it's
            just a new condition wired to the existing `fire-technique` action (TECHNIQUE channel). The
            class-specific "empowered imminent" detection collapses to ONE unified signal: the shared
            `hasEmpoweredAttack` flag (which cadence sets after (N-1) hits = finisher armed, cooldown
            sets when the execution timer is ready, energy sets at max energy). So runeConfig's
            RuneContext gains `empoweredImminent = player.hasEmpoweredAttack !== undefined`; `before-
            empowered` reads it in isConditionActive. Naturally INERT for DoT/reload/summoner baseline
            (they never arm hasEmpoweredAttack) and AUTOMATICALLY works for any future T3/T4 path that
            arms it (the per-class "specific implementations" the user flagged for later are only needed
            for empowered-like mechanics that DON'T use hasEmpoweredAttack). Added to TECHNIQUE_CONDITIONS
            only (Technique-scoped per the user's examples; not guard/stance). NAMED_RULE "Finishing
            Technique". TEMPORARY starter (user will move it onto a rune-recipe reward later). cost/tier
            = placeholder (2/2). Surfaces automatically in RunesPanel (iterates the DBs). VERIFIED: 4-pkg
            typecheck; shared rebuilt; targetPriority + runeMaintenance tests; throwaway sanity (11
            checks: fragment+starter, compat allowed-with-fire-technique / not-fire-guard, named rule,
            derive fires only when empoweredImminent true / inert when false/absent, in-combat regression);
            idle bench clean. NEXT = reward placement + per-class T4 empowered variants.
2026-06-27  Cleanup: removed the OLD inherent-AoE-on-empowered-attacks artifact (now that Sweep provides
            opt-in AoE). Deleted the `if (isEmpowered && !suppressEmpoweredAoe) applyPlayerAoe(...)` block
            from BOTH player attack paths that replicated it — combat.ts (main) + reload T3 laser.ts.
            `isEmpowered`/`isExecution` kept (still drive crit styling / FX tags). The `suppressEmpoweredAoe`
            opt-out flag became dead (combat.ts was its only reader) → removed all writes + tidied comments
            (energy normalHit/empoweredHit, reloadPrototype blunderbuss, snipeDamage, blunderbuss.ts, dot
            fire.ts); those specs keep `empoweredAttack: true` for the aesthetic crit. Config: deleted the
            now-unused `EMPOWERED_AOE_MULT`; kept `EMPOWERED_AOE_RADIUS` (still used by the client empowered
            ring FX + targetPriority's cluster heuristic) with an updated comment. KEPT (judgment calls, not
            removed): the client empowered ring FX (shared empowered/execution visual across 4 archetype FX
            paths, not just a splash tell) and targetPriority's `aoeClusterCount` cluster-preference (soft
            weight, still useful for AoE builds). Monster splash (def-driven `aoeAttack`) untouched. VERIFIED:
            4-pkg typecheck; shared rebuilt; both tests; idle bench clean.
2026-06-27  Step 7 follow-up: authored 3 rough T1 ABILITIES in the existing Abilities system (no
            lineages, placeholder numbers, no new UI beyond the auto-driven panel/forge lists).
            (1) CLEANSE (Guard/swamp, recipe swamp L2) — new `cleanse` effect: strips up to N stacks
            from each harmful debuff/DoT on the player + optional short post-cleanse `ability-guard`
            DR buff (reuses the Brace buff path via a new shared `applyGuardDrBuff` helper). New
            `has-debuff` trigger (fctx.hasHarmfulDebuff). (2) HEAVY STRIKE (Technique/mountain,
            mountain L2) — new `empower` rider in abilityEffects' onHit: ×mult single-target damage
            (no splash), mitigated normally downstream. (3) SECOND WIND (Guard/cave, cave L2) — new
            `heal` effect: deposits maxHp×pct into the recovery BURST_POOL (antiheal applies, Regen
            tile shows), trigger `hp-below`. Extended shared unions: AbilityTrigger += `has-debuff`,
            AbilityEffectSpec += `empower`/`cleanse`/`heal`. NET-NEW SHARED AUTHORITY:
            `isHarmfulPlayerStatusEffect(id,data)` (monsterDebuffs.ts) — one definition of "a player
            debuff/DoT" (slow/frost-ramp/sun-mark/volcanic-heat/antiheal/swamp-rot/monster-DoT/
            isDot/isNodeFeature). Refactored riteOoc's local `isHarmfulEffect` onto it (Cleansing
            Breath + Lingering Momentum) — broadened the set (strict improvement; also stops Lingering
            Momentum from extending rot/antiheal/heat debuffs, a latent bug). 3 abilities + 3 recipes
            appear automatically in the existing AbilitiesPanel/forge (both iterate the DBs); Guard
            rune-override + Technique/Guard channels unchanged. VERIFIED: 4-pkg typecheck clean; shared
            rebuilt; targetPriority + runeMaintenance tests pass; throwaway sanity (28 checks: slot/
            trigger/effect wiring, recipe validation + swamp-L2 gating, the full harmful-predicate
            matrix incl. buffs-are-not-harmful); idle bench clean (p50 0.07–0.95ms 0–100 players).
            PLACEHOLDER/TUNING: all numbers (stacks/mult/heal%/DR/cooldowns/biome levels/costs);
            DEFERRED POLISH: Heavy Strike has no FX tag (no Technique icon pulse/cd-sweep), Second
            Wind grants no ability-guard buff (no Guard glow; Regen tile covers it), no target-quality
            preference, real DoT-specific resistance (generic DR stand-in for now). NEXT = Step 13 or
            per-biome ability content + numbers.
2026-06-25  Step 12 GRAVEYARD + TRENCH authored end-to-end (5th + 6th ADVANCED — ALL 6 ADVANCED DONE)
            + a new shared ELITE-TAG SYSTEM (user-requested, reusable). Graveyard REWORKED from a plain
            DoT biome into a necromancer/revival biome; Trench got the "abyssal pressure" + hunting-territory
            treatment. THREE things built:
            (1) ELITE SYSTEM — `elite?: boolean` def tag + YELLOW client outline derived from the static flag
            (no networked field — same trick as the pack-alpha tint; ELITE_TINT in monsters.ts, takes
            precedence over alpha) + a `focus-elites` TARGETING rune (cloned from spread-dots: runeDatabase
            action/derive/default + RUNE_FOCUS_ELITES_FLAG in runeConfig + ELITE_FOCUS_WEIGHT=3.0 score bonus
            in targetPriority, gated out of strict-nearest so the scored path runs + rune-recipe graveyard L4).
            The reusable "see + prioritize the dangerous one" tool.
            (2) GRAVEYARD necromancer (`gravewright`, elite, ranged backline) RAISES UNDEAD: it's a normal mob
            (isBoss false) carrying a `bossScript.repeating` spawn-adds — `updateBossScripts` runs for any
            scriptsBoss mob, and rewards.ts already despawns tracked spawnedAddIds on death → the risen dead
            CRUMBLE when you kill it, FREE. Added `maxAlive` to the spawn-adds action (prune-dead + top-up cap)
            so a long-lived summoner can't flood. Autoplay-safe: capped + crumble + squishy/high-priority +
            focus-elites is optimal-not-mandatory. TargetFrame gates the boss bar on isMonster.isBoss → no
            boss bar on a necromancer. Added to graveyard pool; existing DoT swarm + boss unchanged.
            (3) TRENCH "abyssal pressure" = new `appliesAntiheal { reductionPerStack, maxStacks, durationMs }`
            on-hit applier (combat.ts) stacking the EXISTING `antiheal` status (read by getAntiHealMult — was
            a reserved/unused mechanic; trench is its first applier) → can't out-heal, must execute. New
            buffSync `debuff-antiheal` (ANTIHEAL icon) + BUFF_IDS entry. Hunting-territory = data: high
            pullRange (380-440 detection) + wide wanderRadius (280-320 territory) + solo (no pack/swarm) →
            double-pull risk that stealth boots (playerDetectionMult) mitigate. All 3 trench mobs tagged elite.
            Verify: 4-pkg typecheck + throwaway sanity (10 checks: elite tags, focus-elites derive+end-to-end
            target selection over a closer non-elite, necro raise-undead maxAlive cap via real updateBossScripts,
            antiheal mult) + 2 server tests + spreadNodes bench p50 0.58ms clean. Numbers = Step 15. **ALL 6
            ADVANCED BIOMES DONE.** NEXT = Step 13 boss scaffolding, or a playtest pass.
2026-06-25  Step 12 TUNDRA authored end-to-end (4th ADVANCED biome; "shatter the ice"; user chose
            enemy-brittle/shatter over player-freeze, and — since melee was already the punished range —
            the shatter's AoE helps the shatterer, not taxes it). NEW mechanic = ICE-ARMOR SHATTER:
            extended `enemyShield` with optional `shatter { selfDamagePct, freezeRadius, freezeDurationMs }`.
            `applyEnemyShield` now also returns `broke` (the hit that drains the barrier to 0). combat.ts
            player→monster path: on `broke`, `applyIceShatter` deals `selfDamagePct × maxHp` BONUS self-damage
            (rewarding the burst that cracked the shell, applied before the death check so it can finish the
            mob) + FREEZES nearby non-boss enemies via the existing `applyStun` (monster stun is already
            ticked in combatState + gated in updateMonsters; built-in anti-chain-lock immunity) — pure
            crowd-control upside for melee, never touches the player. Telegraph: ecology-pulse gained
            `frost-shatter` (icy-blue burst). Backward-compatible: existing enemyShield mobs (magma-salamander/
            sandspitter-cobra) break with no shatter config → no-op. Authored on the signature bears
            (glacier-bear T3, glacial-direbear T4) + both bosses (frost-plated-rime-mammoth, glacial-patriarch)
            as the "burst the shell" exam; casters/cap-trippers keep their slow/debuff/plating roles. NO terrain
            (mobs already slow heavily — chill zones would over-punish melee; tundra is a combat-mechanic biome
            like Cave/Desert). Verify: 4-pkg typecheck + throwaway sanity (11 checks: data wiring + break
            detection + real applyStun freeze/expiry) + 2 server tests + spreadNodes bench p50 0.57ms clean.
            Numbers = Step 15. 4/6 advanced. NEXT = Graveyard/Trench (2 left) or Step 13 boss scaffolding.
2026-06-25  Step 12 VOLCANIC authored end-to-end (3rd ADVANCED biome; "out-sustain the heat"; user
            chose "one biome at a time" → Tundra next turn). NEW mechanic = AMBIENT HEAT soft-timer:
            new `nodeFeatures.ambientHeat { effectId, perStackDamage, maxStacks, rampMs, tickIntervalMs }`
            (node-WIDE, non-positional — shape ignored). Server `updateAmbientHeat` (in updateNodeFeatures,
            over livePlayers): while a player is in a heat node AND `isPlayerInCombat`, heat stacks ramp
            +1 per rampMs up to maxStacks and a linear stack-scaled burn ticks (dot-resistance + DR
            mitigated, can kill via killPlayer); out of combat / on leaving the node it decays at the same
            cadence and clears. Self-managed status `VOLCANIC_HEAT_EFFECT_ID` (NOT a node-feature damage
            status — no isNodeFeature entanglement). The soft timer: burst fast or out-regen the rising heat
            (the in-combat-regen answer is the only build that beats "the room cooks you"). Telegraph =
            buffSync `debuff-volcanic-heat` (HEAT icon, fills toward max-stacks) + `'debuff-volcanic-heat'`
            in BUFF_IDS. Terrain helpers: `lavaVent()` (rot-pool sibling, fire DoT, players-only) +
            `volcanicHeat()` (invisible emitter — no placeholder since it has no damage/status/block). Heat
            + vents on open-world node-7-8/8-8 + boss nodes 8-9/10-10 (the heat IS the soft-timer boss exam;
            existing escalating-slam boss scripts unchanged — mobs already all rampOnCombat). Verify: 4-pkg
            typecheck + throwaway sanity (8 checks: terrain wiring + heat ramp-to-cap/burn/OOC-decay via real
            updateNodeFeatures) + targetPriority/runeMaintenance + spreadNodes bench p50 0.59ms clean.
            Numbers = Step 15. 3/6 advanced. NEXT = TUNDRA (enemy brittle/shatter — user-chosen), then
            Graveyard/Trench or Step 13.
2026-06-24  Step 12 JUNGLE + DESERT authored end-to-end (1st + 2nd ADVANCED biomes; "survive the
            ambush" / "win the duel"). TWO new shared mechanics built first (primitives-before-biomes):
            (1) openingStrike { multiplier } — first landed hit of each combat session ×mult, re-armed
            per fresh aggro (folded into monsterEmpoweredMultiplier, session-keyed like empoweredCooldown);
            the jungle pounce-from-bush AND the desert duelist's alpha-strike opener. (2) Sun Mark pair —
            appliesMark { durationMs } paints a cleansable non-DoT 'sun-mark' status (Desert cleanse pass
            strips it for free; expires harmlessly), markedStrike { multiplier } cashes it for an amplified
            hit + consumes (both inline in combat.ts monster→player path — NO combat listener, bench parity
            safe). Telegraphs: ecology-pulse gained 'sun-mark' (amber ring on the painter, edge-triggered);
            new buffSync 'debuff-sun-mark' (MARKED icon+clock) + BUFF_IDS entry. JUNGLE: dense-bush terrain
            (new denseBush() in shared nodeFeatures — players-only slow + capped ambush spawner; reuses the
            feature `spawns` field, extended with pullRange override; spawnPack now returns members so the
            bush spawner tags them dormant + clusters a pack = one call-allies pounce). Bruisers (ape/
            silverback/apex-silverback) = pack alphas leading 2 fast pouncers (snake/stalker/panther
            followers, openingStrike); emerald-constrictor + alphas ramp (rampOnCombat = hardening synergy:
            slow drags the fight). Bush on node-3-7/3-8 + boss node-2-8; Dread-Gorger gets openingStrike +
            50% pack-ambush spawn-adds. DESERT: marker+finisher combo across tiers — ranged painters
            (dust-djinn/sandweaver/sandspitter-cobra) appliesMark, heavy hitters (basilisks/dune-tyrant)
            markedStrike + openingStrike (tyrant's slam IS the marked payoff); Emperor boss = duelist
            opener + 50% summons djinn painters. Verify: typecheck (4 pkgs) + throwaway sanity (20 checks:
            data wiring + openingStrike once/session + mark apply/cleanse/consume) + targetPriority/
            runeMaintenance + spreadNodes bench p50 0.62ms clean. Numbers = Step 15. 2/6 advanced biomes.
            NEXT = Volcanic/Tundra/Graveyard/Trench, or Step 13 boss scaffolding.
2026-06-23  roadmap + status docs created; old T4 roadmap marked complete; memory updated.
2026-06-23  Foundation Q&A complete — Steps 1–5 resolved (📋). Key findings: 5 essences,
            recipe system, and biome-level unlocks already exist; biome levels kept as-is;
            Global Mastery (new) = sum of biome levels, replaces tier in RP + upgrade cap;
            catalysts new (one/biome-group, weighted, cost-axis on Recipe); runes get biome
            gating + RP-capacity recipes retired. Next: build/power layer (Steps 6–8).
2026-06-23  Build/power Q&A complete — Steps 6–8 resolved (📋). Gear: lineages/evolution NEW,
            all 4 slots, cap→+5 (GM-gated), evolve consumes +3 pred→+0. Skills: the current
            "skill tree" is PASSIVE talents; the brainstorm's skills are a NEW "Abilities" system
            (auto-fire+runes, reuses gear evolution). Charms: recovery already built (incl. biome
            identities); add Guard-amplifier via mechanicEffects; rename "X Core" charm items.
            Cross-deps logged: GM→RP/cap, Step6 evolution must generalize, runes gain ability action,
            "Core" naming freed for Step 9. Next: tier-gated systems (9 Cores, 10 Stances, 11 Rites).
2026-06-23  Tier-gated Q&A complete — Steps 9–11 resolved (📋). Cores = new 5th equipment slot,
            range gates full effect (selectedRange already exists), T2 + biome recipes. Stances =
            new, RP-costed switch rune action (anti-thrash), effect model TBD. Rites = name locked,
            T3, OOC hook already exists, slots + effect model TBD. Rune-action catalog now gains
            ability-fire (7) + stance-switch (10) actions. Next: content layer (12 biome identity,
            13 dungeons/bosses) — the heaviest (server AI), then 14 UI, 15 balance.
2026-06-23  Content Q&A complete — Steps 12–13 resolved (📋). Major finding: terrain/hazard
            (nodeFeatures: blocking/damage/slow zones) and the gauntlet rework already exist;
            net-new is coordinated AI (packs/patrols/swarm). Step 12 = multi-session program
            (primitives first, then 1 session/biome incl. advanced). Step 13 = shared scaffolding
            (exam template, reward bundles, tell conditions, structural boss-access gating) +
            boss authoring folded into Step 12 biome sessions. Remaining: 14 UI, 15 balance.
2026-06-23  Q&A COMPLETE — all 15 steps resolved (📋). Steps 14 UI (MVP = new-system visibility +
            boss seal/exam; failure diagnosis deferred) and 15 Balance (Claude builds tooling incl.
            NEW economy sim; user tunes) done. Up-front design Q&A finished; ready to implement in
            dependency order. Recommended first build: Step 4 (Global Mastery) — keystone that
            Steps 5 & 6 depend on — then Step 2 (catalysts) + Step 1 (essence rename) together.
2026-06-23  Post-Q&A gap review. Added "Cross-cutting concerns" to roadmap (persistence/migration,
            networked allowlists+invariants, protocol/views, ADMIN dashboard, combatBootstrap parity,
            onboarding). Flagged: essence rename magnitude (prefer display-name-only), Abilities-across-
            6-archetypes design risk (Step 7). Confirmed boots are already built (mobilityBoots.ts) —
            not a gap. Docs now reflect these.
2026-06-23  Steps 1+2 implementation planning. Paired docs written
            (docs/aspects-catalysts-plan.md + -current-state.md). Decisions: rename = display-name
            only (ESSENCE_LABELS, keep keys/DB/protocol); author all 3 data sets with placeholders
            (per-mob essence, catalyst weights, recipe catalyst costs). 5-phase plan: shared
            foundation → server → client/UI → data → verify. Ready to implement.
2026-06-23  Steps 1+2 Phase A (shared foundation) DONE. Added ESSENCE_LABELS + essenceLabel
            (display-only aspect names) and catalystLabel; catalysts + catalystProgress on
            TracksProgression; catalystCost on Recipe + UpgradeStep; catalystWeight/catalystBundle
            on monster rewards; CATALYST_PROGRESS_PER_UNIT (placeholder 100); upgradeCatalystCostFor
            + catalyst check in checkUpgrade. Seeded {} defaults in playerRepo (snapshot/load
            round-trip still Phase B). Typecheck clean. Next: Phase B (server grant/spend).
2026-06-23  Steps 1+2 Phase B (server authority + persistence) DONE. rewards.ts grants weighted
            catalyst progress per kill (mints at threshold, carries remainder) + one-time boss
            catalystBundle on first biome-boss clear; party same-node sharing rides the existing
            member loop. crafting.ts + itemUpgrade.ts check/spend catalysts alongside essence
            (test-room tops up); essence shortfall messages now use aspect labels, catalyst
            messages use catalystLabel. playerRepo hydrate defaults catalysts/catalystProgress to
            {} for old rows; whole-slice JSON write persists them. Typecheck clean. Next: Phase C
            (client/UI: label routing + catalyst wallet/cost display), then Phase D (data authoring).
2026-06-23  Steps 1+2 Phase C (client/UI) DONE. PlayerView + composer carry catalysts/
            catalystProgress; client atoms + sync/reset wired; 5 test/bench fixtures made
            well-formed. Aspect labels routed: EssencePanel, NodeInfo recipe costs, admin
            CharactersTab. New CatalystPanel (hud) lists per-biome catalysts + progress, hidden
            until first earned. CostDisplay renders catalyst costs; affordsCatalysts helper gates
            ForgeTab + UpgradeTab (checkUpgrade now receives catalysts). Typecheck clean across all
            4 packages. Remaining: Phase D (data authoring) + Phase E (verify).
2026-06-23  Steps 1+2 Phases D+E DONE → Steps 1 & 2 implemented. Catalyst weight: defaulted in
            code to the mob's base essence reward (already a tuned toughness number, trash 2-10 /
            bosses 100+) rather than spraying redundant per-mob placeholders; `catalystWeight`
            stays an authored override, threshold is the tuning knob. Essence variety: thematic
            secondary aspect on one off-type mob per starter biome (forest golem→Stone, plains
            hawk→Wild, mountain brute→Might, swamp toad→Wild, cave gargoyle→Stone) so each starter
            yields a 2-aspect mixture; advanced biomes left for user's design pass. Boss bundles:
            catalystBundle:5 placeholder on all 5 T1 bosses. Recipe costs: forest T2 weapon+armor
            +1 upgrade step catalyst-gated as the worked example (both cost axes exercised).
            Verify: typecheck clean; targetPriority test passes; runeMaintenance test fails on a
            PRE-EXISTING rune assertion ("Cautious should independently claim recovery") — confirmed
            by reverting the fixture edit; unrelated to this work. All structural work for Steps 1+2
            complete; remaining numbers (CATALYST_PROGRESS_PER_UNIT, weights, bundles, which recipes
            cost catalysts, full essence-variety map) are user-owned balance/design tuning.
2026-06-23  Steps 3+4 planned then IMPLEMENTED (paired docs global-mastery-plan.md +
            -current-state.md). Step 3: BIOME_LEVELS_PER_TIER 4→6 (user call); all recipe
            requiredBiomeLevel literals remapped 4-band→6-band via L'=seg*6+((L-1)%4+1)
            (start-tier-independent, gating preserved; graveyard/trench unchanged — only used
            levels 1-4); clearing left at cap 4; dead BIOME_LEVEL_CAP_BY_TIER array deleted;
            generic upgrade-fallback *4 → constant. Step 4: globalMastery(biomeLevel) = sum excl
            clearing, derived/not persisted; runeBudgetForGlobalMastery (8 + floor(gm/10) + bonus)
            replaced runeBudgetForTier at all 3 call sites; upgrade-cap seam min(structural,
            upgradeCeilingFromGlobalMastery(gm)) threaded through checkUpgrade (server + client
            UpgradeTab), placeholder ceiling non-binding (≥5); globalMastery on PlayerView +
            globalMasteryAtom + AdminCharacterRecord/CharactersTab. Verify: typecheck clean (4
            pkgs); after rebuilding shared dist, BOTH targetPriority AND runeMaintenance tests pass
            (the earlier "pre-existing" runeMaintenance failure was a stale-dist artifact; fixtures
            use playerTier 0 / biomeLevel {} → GM 0 → budget unchanged at 8, so tests are
            budget-neutral). Sanity-verified GM sum + non-regressive RP (GM 0/20/40 → 8/10/12 =
            old T0/T1/T2) + caps (6/tier). Numbers (RP divisor, GM upgrade ceiling, XP curve for
            stretched 6-level segments, L5/L6 reward content) = user-owned balance/later steps.
2026-06-23  Step 5 (rune sourcing) IMPLEMENTED. RuneRecipe gained recipeGroup+requiredBiomeLevel;
            shared isRuneRecipeUnlocked(recipe,{biomeLevel,bossesCleared}) is the single gate
            authority (server runeCrafting + forge UI). All 11 unlock-rune recipes moved from
            requiredBossClear → biome-level gating (forest/cave/mountain/swamp, placeholder levels
            2-4); boss channel kept free for Step 13's advanced runes. RP-capacity fully retired:
            deleted the 3 increase-rune-points recipes, the increase-rune-points kind,
            runePointBonusFromCraftedRecipes, and runePointBonus everywhere (TracksProgression slice,
            PlayerView+composer, client atom+sync, RunesPanel forged/capacity display,
            playerLifecycle/runeCrafting/playerRepo/gameActions/index, 5 test fixtures);
            runeBudgetForGlobalMastery dropped its bonus param — RP is purely GM now. Verify:
            typecheck clean (4 pkgs); source grep clean; after shared rebuild both targetPriority
            and runeMaintenance tests pass. requiredBiomeLevel values = user balance pass. Next:
            Step 6 (gear evolution) — needs its own planning session.
2026-06-23  Step 6 (gear evolution) MACHINERY + 1 worked lineage IMPLEMENTED (paired docs
            gear-evolution-plan.md + -current-state.md). Scope = structure + one lineage (user
            authors the rest). Recipe/ItemDefinition gained lineageId/evolvesFrom/reconstructCost*;
            MAX_UPGRADE 3→5; new shared systems/evolution.ts (checkEvolve/checkReconstruct, +3 gate);
            server economy/itemEvolution.ts evolveItem (evolve consumes the +3 predecessor bag copy /
            reconstruct skips it for higher cost), wired through crafting:evolveItem +
            hudBus/intent/net bridge; craftRecipe now rejects evolved recipes (loophole). ForgeTab
            renders Evolve/Reconstruct buttons (gated by the shared checks, reasons in title) +
            reads itemUpgradesAtom. Worked rapier lineage in forest.recipes.ts: flash-rapier base
            (lineageId rapier, upgrades→len5) → gale-needle (retrofitted the EXISTING T2 forest
            weapon as evolvesFrom flash-rapier; was a plain craftable, now evolution-only) +
            thorn-needle (new branch). NOTE: hit a duplicate-id collision (gale-needle already
            existed) — resolved by retrofitting the real one rather than adding a dup. Verify:
            typecheck clean (4 pkgs); shared rebuild clean; both server tests pass; sanity-checked
            checkEvolve/checkReconstruct gating + maxUpgrade=5 via built package. Deferred: +5
            branch-switch discount/refund; per-id upgrade quirk; other 3 slots × biomes + all
            evolution/+4/+5 numbers = user balance/content pass. Foundation+build-base (Steps 1-6)
            now done; next is Step 7 (Abilities) — needs its own planning session.
2026-06-23  Step 7 follow-ups: (1) Guard abilities now go through the BUFF SYSTEM (user catch) —
            Brace changed from a raw shield to an explicit `ability-guard` damage-reduction buff
            (status effect on TracksCombat {totalMs,drPct} + onDamageTaken DR reader, cover-fire
            pattern; abilityBuffs.ts ABILITY_BUFFS descriptor spread into ALL_BUFFS; 'ability-guard'
            added to shared BUFF_IDS; one Guard slot ⇒ single buff id, label from equipped def).
            AbilityEffectSpec shield→damage-reduction. (2) Mobile HUD reachability — added an
            "Abilities" entry to the mobile More sheet (was desktop-only). Verified: 4-pkg typecheck,
            both tests, clean bench (buff now projects each tick), buff-projection sanity script.
2026-06-23  Step 7 (Abilities) IMPLEMENTED — system + Sweep/Brace worked pair. 5-phase build.
            Key implementation calls (deviations from plan, all improvements): (1) ability state
            lives on TracksProgression (knownAbilities + equippedAbilities) like runes — NOT a new
            UsesAbilities component — avoiding a DB migration + networked-slice/invariant churn;
            (2) rune override uses NEW dedicated TECHNIQUE/GUARD channels (not shared CONTROL) so
            Technique+Guard+taunt overrides coexist (CONTROL is single-claim); (3) fire-technique/
            fire-guard are starter rune actions for v1 (override = timing pref for an already-unlocked
            ability). Mechanics: Technique arms a sibling hasArmedAbility component (separate from
            class-owned hasEmpoweredAttack), consumed by an onHit rider listener in initCombatSystems
            (Sweep→applyPlayerAoe cleave); Guard fires immediately (Brace→applyShieldPercent). Firing
            system updateAbilityFiring runs in World.tick (built-in trigger + per-ability cooldown;
            rune flag overrides + suppresses built-in). AbilityRecipe parallel to RuneRecipe, biome-
            gated (isAbilityRecipeUnlocked); craft=learn permanently. Full stack: PlayerView+composer,
            playerRepo defaults, socket intents (ability:craftRecipe/setLoadout/craftResult),
            client atoms+bridge+AbilitiesPanel (desktop sidebar + Esc), admin read (CharactersTab).
            Verified: 4-pkg typecheck clean; targetPriority+runeMaintenance pass; autoCombatSameNode
            bench runs clean (no regression from new tick/listener); shared sanity script green.
            Deferred: ability EVOLUTION (Step 6 generalization), per-biome content, mobile-HUD entry,
            admin grant, "armed" HUD indicator, all numbers (user balance). Step 8 charm guard.*
            amplifier keys off this Guard shape. Foundation+build-base+abilities (Steps 1-7) now done.
2026-06-23  Step 7 (Abilities) PLANNED (paired docs abilities-plan.md + -current-state.md). Code
            audit: the arm-next-attack model already exists (empoweredAttacks.ts) — Abilities extend
            it via a sibling hasArmedAbility component (not hijacking the class-owned hasEmpoweredAttack
            flag); CONTROL rune channel + taunt.ts = the ability-fire template; RuneRecipe = precedent
            for a parallel AbilityRecipe; talent tree (UsesSkills) kept (name collision). Scope locked
            via Q&A: (1) system + Sweep(Technique)/Brace(Guard) worked pair, user authors the rest;
            (2) built-in per-ability auto-fire heuristic + CONTROL rune override (fire-technique/
            fire-guard) — works with zero runes; (3) ability evolution DEFERRED to a follow-up. Design:
            UsesAbilities (knownAbilities + technique/guard slots, free slotting from a learned pool),
            Technique=arm-next-attack rider / Guard=immediate self-facing, AbilityRecipe gated by biome
            mastery (mirror isRuneRecipeUnlocked). 5-phase plan (shared → server+persist → client/UI →
            content → verify); cross-cutting checklist + 6-archetype Phase-E gate noted. Ready to
            implement (📋). Next session: build it.
2026-06-23  Step 8 (Charms & recovery) IMPLEMENTED — machinery + 2 worked charms (paired docs
            charms-plan.md + -current-state.md). Audit: recovery engine + per-biome identities
            already built on the `recovery` slot; class baseline recovery untouched. Net-new = ONLY
            the Guard-ability amplifier. Added a new GUARD_KEYS namespace (passives.ts) with 4
            keys — guard.cooldown-reduction-pct / guard.potency-pct / guard.duration-pct /
            guard.heal-on-fire-pct — folded into PassiveKey + ALL_PASSIVE_KEYS. They ride the
            EXISTING equipment mechanicEffects→usesSkills.passives pipeline (stats.ts), so NO new
            state/slice/migration/listener. Read at Guard fire time in abilityFiring.ts: cd-reduction
            shortens GUARD_CD_KEY (capped 0.9); potency scales drPct (capped at GUARD_DR_CAP 0.9);
            duration extends the ability-guard buff (sets remainingMs AND data.totalMs for the clock);
            heal-on-fire deposits maxHp×pct into BURST_POOL_KEY (antiheal applies, Regen tile shows).
            abilityEffects.ts onDamageTaken reader unchanged (reads amplified stored drPct). Removed
            now-unused `world` param from maybeFireGuard/applyGuardEffect. Renamed 7 "X Core" charms
            (Plains Stone, Stalwart Heart, Mirage Talisman, Oasis Heart, Fortress Heart, Magmaheart
            Stone, Inferno Heart) — slot key stays `recovery`, only display name; frees "Core" for
            Step 9. Worked examples (placeholder): forest-charm-t1 = cd-reduction + heal-on-fire,
            plains-charm-t1 = potency. Verified: 4-pkg typecheck, both server tests, clean
            autoCombatSameNode bench. Deferred: other ~30 charms' amplifier identities + all numbers
            (user). Build-base + abilities + charms (Steps 1-8) now done; next = Step 9 (Cores).
2026-06-23  Step 9 (Cores) PLANNED (paired docs cores-plan.md + cores-current-state.md). Audit found
            the 5th-slot plumbing is free (equip/persistence/networking/UI all generic over
            EQUIPMENT_SLOTS; selectedRange already exists + is mechanical). Q&A resolved 4 forks
            (all recommended): range mismatch = OFF ENTIRELY (universal/party always-on); ranks =
            recipe rank-up chain reusing Step 6 evolution (required-plus parameterized to 0 for the
            core slot, so cores stay off the +N track); T2 = biome-level placement (no new field);
            worked content = 1 core per range band + a rank chain. Net-new mechanic = range-gating
            in the stats.ts equipment loop via a shared coreIsActive() helper + a rangeTag axis on
            Recipe/ItemDefinition→ITEM_DATABASE. No migration, no networked-allowlist change, no new
            combat listener. 5-phase plan; mechanical fixups (literal EquipmentMap / Record<Equipment
            Slot,…> sites) enumerated. Ready to implement (📋). Next session: build it.
2026-06-24  Step 9 (Cores) IMPLEMENTED — machinery + 4 worked cores + a rank chain. 5-phase build.
            Confirmed the audit's thesis: the 5th slot is mostly free plumbing — adding 'core' to
            EQUIPMENT_SLOTS rippled through equip/unequip, persistence, networked state, and recipe-
            unlock with ZERO server logic changes; Phase B was verification-only. Net-new: CoreRange
            +rangeTag (Recipe/ItemDefinition→ITEM_DATABASE); shared cores.ts coreIsActive (single gate
            authority); range-gating branch in stats.ts equipment loop (directional core OFF unless
            selectedRange matches; universal/party always on); cores kept OFF the +N track
            (getMaxUpgrade→0 for slot 'core') and rank up via Step 6 evolution with requiredPlusFor()
            (0 for cores / 3 for gear). Decisions (all the recommended Q&A options): mismatch=off
            entirely; ranks=evolution chain; T2=biome-level placement; worked=1 core/band. UI: slot
            labels/abbr/filter/colors, dimmed inactive core + StatSheet range badge + ForgeTab range
            note. Mechanical fixups: 'core' added to the literal EquipmentMap (views/atoms/items) and
            Record<EquipmentSlot,…> maps (itemUpgrades UPGRADE_STAT_BY_SLOT/BONUS_PER_LEVEL, inventory
            constants); GearSlot (bench-local, not EquipmentSlot) left at 4 — cores in bots = Step 15.
            Worked content (forest, placeholder numbers): Bastion(Close)/Sniper(Far)/Arcanist(Mid)/
            Tempered(Universal) + Bastion Core II rank-up. Verified: 4-pkg typecheck, shared rebuild,
            both server tests, gating+rank-up sanity script, clean idle bench. Deferred: signature
            combat hooks, T3 range-specific evolution/T4 morphs, cross-range party roles, other biomes'
            cores + all numbers (user). Foundation+build-base+abilities+charms+cores (Steps 1-9) done;
            next = Step 10 (Stances).
2026-06-24  Step 9 follow-up: cores converted to a MULTIPLIER model (user request). Cores now apply
            % multipliers on overall stats instead of flat adds. Added CORE_KEYS namespace
            (core.attack/maxhp/plating/speed/attack-speed/hpregen-mult) summed + applied once in a new
            core-multiplier pass in recalculatePlayerStats (after reload layer, before hp-clamp;
            negatives = tradeoffs). Plus core.dr-layer-pct = a SEPARATE multiplicative DR layer in
            runMonsterAttack (final = base×(1−DR)×(1−layer), clamped 0.9 → 50%+50%=25% taken, NOT
            immunity); read from passives at combat time (like shared.damage-mult), no new networked
            field. Recovery: hpRegen mult direct; %-based heals/shields scale free via maxHp mult;
            flat-burst recovery multiplier deferred. itemDisplay renders signed % lines for core.*.
            Reworked the 4 forest cores + Bastion II to multiplier mechanicEffects (placeholders).
            Verified: 4-pkg typecheck, shared rebuild, both server tests, idle bench clean, and a
            recalc sanity script (Bastion@close ×1.2 HP/×1.3 plating + dr-layer 0.1; Bastion@far gated
            off; Sniper ×1.25 atk/×0.85 HP; DR 50%+50%→25). cores-plan.md addendum added.
2026-06-24  Step 10 (Stances) IMPLEMENTED — machinery + 3 worked stances. Paired docs stances-*.md.
            Two Q&A forks locked: (1) rune-switch = default+reactive slot (mirror abilities
            {technique,guard} → stances {default,reactive}); ONE `switch-stance` rune action on a new
            single-claim STANCE channel swaps to reactive while its condition holds. (2) effect = stat
            recalc on switch — stances carry StatEffects+mechanicEffects, fold into recalculatePlayerStats
            (new 2a block; DR deferred to the equipment pass so a negative DR tradeoff survives the
            intermediate [0,0.9] clamp). State on TracksProgression (knownStances/equippedStances/
            activeStance, networked+persisted, defaulted in playerRepo). New server stanceSwitch.ts tick
            system (sibling of abilityFiring; anti-thrash STANCE_SWITCH_COOLDOWN_MS=1500) reconciles
            activeStance + recalcs on change; RUNE_SWITCH_STANCE_FLAG stamped in runeConfig. stanceCrafting.ts
            (craft=learn; setStanceLoadout resets activeStance=default + recalc). Full stack: socketEvents
            (stance:craftRecipe/setLoadout/craftResult), PlayerView, index.ts handlers, client atoms+
            hudBus+intents+StancesPanel (desktop sidebar+Esc+mobile More), RunesPanel STANCE color, admin
            CharactersTab + gameActions full-reset (now also clears abilities, prev oversight). switch-stance
            is starter-available (stance recipes are the T2 gate); StanceRecipe forest L7-8 + catalyst,
            tier 2. Worked: Offensive/Defensive/Tanking (placeholders). Verified: 4-pkg typecheck, shared
            rebuild, both server tests, idle bench clean, sanity script (catalog/gating/rune-flag/
            stats-fold/DR-tradeoff clamp). Next = Step 11 (Rites, T3).

2026-06-24  Step 11 (Rites, T3) IMPLEMENTED — machinery + 4 worked rites. Paired docs rites-*.md.
            Three Q&A decisions locked: (1) ALWAYS-ON passive — no rune action/channel/reconciler
            (key divergence from Steps 7/10); (2) 2 fixed slots + stubbed riteSlotCount(GM) (GM-growth
            curve = user later); (3) all four brainstorm rites. State on TracksProgression
            (knownRites/equippedRites string[]; no activeStance analogue; networked in tracksProgression,
            persisted, defaulted in playerRepo via validRiteIds). Effect model: rites carry only `rite.*`
            mechanicEffects (new RITE_KEYS namespace); EVERY equipped rite folds into usesSkills.passives
            in recalculatePlayerStats (block 2b; equippedRites passed via playerEntityFormulas). OOC
            readers (the net-new logic): Quickened Breath → oocRegenDelay(player) shortens the base
            OOC HP-regen gate in combat/engine/combat.ts (two spots; deliberately NOT the kite/rune
            arbitration checks); Cleansing Breath + Lingering Momentum → server/.../rites/riteOoc.ts
            runRiteOoc (called from defense/index.ts, self-gated OOC) — cleanse pulses removeStatusEffectStacks
            on HARMFUL-only effects (isHarmfulEffect: slow/frost-ramp/monster-DoT/data.isDot), lingering
            adds slowdown*dt back to non-harmful timed buffs' remainingMs (capped at totalMs); Hunter's
            Instinct → onKill listener (initRiteListeners in combatBootstrap, live/bench parity) reuses
            the mobility mob-haste buff (exported FOREST_HASTE) since acquisition is already immediate.
            setRiteLoadout = full-list set (interchangeable slots, server dedupes+caps). Full stack:
            socketEvents (rite:craftRecipe/setLoadout/craftResult), PlayerView (knownRites/equippedRites/
            riteSlots), admin.ts AdminCharacterRecord, index.ts handlers, client atoms+hudBus+intents+
            RitesPanel (sidebar+Esc+mobile More), admin CharactersTab + gameActions reset. RiteRecipe
            forest L13-14 (T3 band) + catalyst, tier 3. Worked: Quickened/Cleansing/Lingering/Hunter's
            (placeholders). Verified: 4-pkg typecheck, shared rebuild, both server tests, idle bench clean,
            sanity script (catalog/T3-gating/slot-count/fold/regen-delay). NEXT = Step 12 (Biome identity /
            combat ecology — a multi-session PROGRAM: AI primitives first, then per-biome).
2026-06-24  Step 12 (Biome ecology) PLANNED — paired docs biome-ecology-plan.md + -current-state.md.
            Q&A locked the ambitious path on every axis: full-program design (primitives + all 11 biome
            specs now), all 3 primitives in the first pass (packs+call-allies / fixed patrols / swarm
            convergence), RETROFIT existing mobs, and networked light telegraphs. Audit confirmed the
            net-new is ONLY coordinated multi-monster AI + telegraphs — terrain (nodeFeatures), boss
            systems (bossScript/ultimate/gauntlet), and ranged/kite/charge/DoT all already exist.
            Design: component-gated primitives that SET INTENT (aggro target + anchor + chase-offset);
            updateMonsters stays the single executor (movement/leash/kite unchanged). New server-only
            inPack component + controlsMonster patrol scratch (no persistence — mobs are ephemeral).
            Telegraphs = networked alpha field (allowlist + dev-boot invariant) + transient pushEvent
            howl/rally (no per-tick booleans); prefer a position-scan over an onDamageTaken listener to
            keep live/bench parity. Retrofit map authored (Plains swarm / Forest packs / Mountain+Cave
            patrols / Swamp terrain). Sequencing: primitives (1-2 sessions) → Step 13 scaffolding →
            1 session per biome (5 starters, then 6 advanced). Numbers = Step 15 user balance pass.
            NEXT = build the primitives session (Part A).
2026-06-24  Step 12 Part A (AI PRIMITIVES) IMPLEMENTED + verified. All three, component-gated
            (dormant until authored → zero behavior change for un-tagged mobs). A2 PATROLS: `patrol`
            field on MonsterDefinition (spawn-relative waypoints, loop/pingpong, holds) + patrolIndex/
            patrolDir scratch on ControlsMonster; folded into updateMonsters' disengaged idle/wandering
            arm via advancePatrol() (deterministic, index-based; resumes from current index after
            aggro). A1 PACKS+CALL-ALLIES: `pack` field (role alpha/follower, callRange, alpha.followers)
            + NEW server-only `inPack` component (packId/role; not networked, not persisted — passes
            both dev-boot invariants untouched since it's not a networked key); spawnPack() spawns
            alpha + follower ring with a shared packId (wired into spawnMonster when an alpha rolls;
            ensurePopulation re-reads count so a pack doesn't overshoot density); updatePacks() runs
            BEFORE updateMonsters, groups by packId, propagates the lead member's aggro to un-aggroed
            mates within callRange of an aggroed mate (leash-guarded; sets INTENT only). onAlphaDeath
            DEFERRED (needs monster-buff plumbing). A3 SWARM: `swarm` field (cohesion 0..1, separation
            px); updateSwarm() runs AFTER updateMonsters and BLENDS a separation+cohesion steer into
            the per-tick motion.direction (renormalized, markSliceDirty). KEY FINDING: nudging the nav
            GOAL doesn't work — a <48px offset is swallowed by PATH_GOAL_EPSILON_SQ (path reuse), so
            the steer must bend the heading directly, not re-path. updateMonsters stays the SINGLE
            executor throughout (primitives only set intent/heading). Worked retrofits (placeholders):
            forest ancient-wolf alpha + 2 wolf followers (callRange 320; alpha charges in when called);
            cave-brute fixed loop patrol; plains-slime swarm. Verified: 4-pkg typecheck, shared rebuild,
            both server tests, spreadNodes bench (40 players, p50 0.43ms clean), and a targeted sanity
            script (pack=3 members/shared packId/call-allies adoption; patrol index advance + walking;
            swarm heading bend) — script then removed. REMAINING in Step 12: telegraphs (networked
            alpha marker + transient howl/rally pushEvents + client render), full per-biome retrofit
            (the biome sessions), boss exams (Step 13 scaffolding). Numbers = Step 15.
2026-06-24  Step 12 TELEGRAPHS (light, per Q&A) IMPLEMENTED. (1) Alpha marker: a persistent sprite
            TINT derived CLIENT-SIDE from MONSTER_DATABASE (`pack.role==='alpha'` is static per type,
            and monsterTypeId is already networked) → NO networked field / allowlist / invariant change.
            Added PACK_ALPHA_TINT (warm red) to monsters.ts syncMonsterThroneTint (guardian/throne take
            precedence). (2) Call-allies pulse: new `ecology-pulse` CombatEvent (monsterId/pos/pulse=
            'pack-call'), pushed from updatePacks at the newly-alerted mob (naturally edge-triggered),
            rendered via the existing fxAoeRing as a one-shot ring (combatFx dispatch, node-wide/not
            own-player-gated; reaches dispatchCombatEvent via deltaApplier's events loop). Removed the
            unused inPack.lastAlertTick. Verified: 4-pkg typecheck (incl client), both server tests,
            spreadNodes bench clean (p50 0.31ms). Step 12 PRIMITIVES + TELEGRAPHS done. REMAINING in
            Step 12 = full per-biome retrofit (the per-biome sessions, Part C) + boss exams (Step 13
            scaffolding) + onAlphaDeath (needs monster-buff plumbing). Numbers = Step 15.
2026-06-24  Step 12 FOREST authored END-TO-END (first worked biome / template; user chose "one biome,
            end-to-end" + "terrain where it's core identity" — Forest's identity is packs + trees, and
            trees already exist as nodeFeatures, so no new terrain). Primitive enrichment: pack
            `followers` generalized from a single {typeId,count} to an ARRAY so packs can mix types
            (spawnPack loops the groups). Open-world ecology: T1 forest stays simple (fast solo wolves
            + slimes — brainstorm's "T1 stays simple"); T2 = MIXED predator pack — ancient-wolf alpha +
            2 wolves + 1 canopy-sprite (now a `pack:{role:'follower',callRange:300}` so the ranged
            thorn joins the call-allies net; roams solo otherwise). Boss exams ("survive the pack",
            ad-hoc until Step 13 formalizes): gnarled-greatbear (T1) — one readable 50% beat (spawn-adds
            3 wolves + light enrage); apex-timberclaw (T2) — 50% (enrage + 3-wolf wave) / 25% (an
            ancient-wolf lieutenant + 2 wolves) + a 12s repeating lone-wolf reinforcement. Boss adds use
            world.createMonster (NOT spawnPack) so an ancient-wolf add is a lone lieutenant — no
            recursive pack. Verified: 4-pkg typecheck, shared rebuild, both server tests, spreadNodes
            bench clean (p50 0.32ms), and a Forest sanity script (mixed pack = 4 members/shared packId;
            call-allies pulls wolves AND sprite; both bosses attach scriptsBoss) — script then removed.
            All numbers placeholder (Step 15). NEXT = another starter biome (Plains/Mountain/Swamp/Cave)
            or Step 13 boss-exam scaffolding.
2026-06-24  Step 12 PLAINS authored end-to-end (2nd worked biome; "survive the swarm"; open terrain →
            no hazards, per the core-identity terrain rule). Open-world: swarm tag added to boar +
            stampede-bull (converging herds) alongside plains-slime; prairie-wolf became a CALLER pack
            alpha (the brainstorm's plains "caller") rallying 3 plains-slimes — plains-slime is now also
            a pack:{role:'follower',callRange:280} so the swarm joins call-allies (still roams + swarms
            solo). swarm + pack COMPOSE on the slime (swarm = chase steering, pack = aggro propagation;
            independent). Bosses CONVERTED from "honest bruiser, no gimmick" to swarm exams: tusked-
            razorback (T1) 50% = spawn-adds 5 slimes + light enrage; gorging-razortusk (T2) 50% (enrage
            + 5 slimes) / 25% (2 boars + 4 slimes) + 10s repeating 2-slime trickle. Verified: 4-pkg
            typecheck, shared rebuild, both server tests, spreadNodes bench clean (40 players, p50
            0.45ms), Plains sanity script (caller pack = prairie-wolf + 3 slimes/shared packId; call-
            allies pulls the swarm; both bosses attach scriptsBoss) — removed. Numbers = Step 15. Forest
            + Plains done (2/5 starters). NEXT = Mountain (patrol-sentinels + chokepoint nodeFeatures) /
            Swamp (attrition rot-pool nodeFeatures) / Cave (elite patrols) — these DO want terrain — or
            Step 13 boss-exam scaffolding to replace ad-hoc boss authoring.
2026-06-24  Step 12 MOUNTAIN authored end-to-end (3rd starter; "break the guarded position"; the FIRST
            biome with terrain). NEW reusable client piece: a PLACEHOLDER block visual — untextured
            blocksMovement features now render as a flat gray rock fill of their exact collision shape
            (overlays.ts buildNodePlaceholderBlocks + NodeStaticGroup.placeholders; suppressed once a
            NODE_DECOR sprite exists). Without it a block was an invisible wall. Terrain: node-4-4 gets
            two rock-wall features flanking a ~260px central pass, blocksMovement:['player'] ONLY (mobs
            ignore it → no spawn-in-wall wedging / no patrol stalls; spawnMonster does NOT avoid feature
            shapes, so monster-blocking terrain on a populated node is unsafe without a spawn guard —
            deferred). Perimeter ring fully open → all 4 edges connected; PASSABILITY VERIFIED with
            findPathForMover (5 player routes incl. through-gap + behind-walls all resolve). Mobs:
            cliff-hopper (T1) + granite-titan (T2) get pingpong sentinel patrols (hold their post);
            ranged archers (ridge/peak) unchanged = "ranged behind frontline". Bosses (guarded position):
            crag-behemoth T1 (50% timed shield + 1 ridge-archer guard); stoneplate-juggernaut T2 (50%
            enrage + 2 peak-archers, 14s repeating dig-in shield). Verified: 4-pkg typecheck (incl
            client), shared rebuild, both server tests, spreadNodes bench clean (p50 0.38ms), mountain
            sanity script (passability×5 + monster-path + patrols + boss scripts) — removed. Numbers +
            REAL terrain sprites (add NODE_DECOR art for mountain_pass_*) = later. 3/5 starters done.
            NEXT = Swamp (rot-pool damage nodeFeatures — note: damage zones can target monsters safely,
            but player-only blocks pattern applies for any walls) / Cave (elite patrols + high detection)
            / Step 13 scaffolding.
2026-06-24  Step 12 SWAMP authored end-to-end (4th starter; "survive the rot"; 2nd terrain biome,
            first HAZARD terrain). Generalized the placeholder visual: buildNodePlaceholderFeatures now
            renders untextured `damage`/`statusWhileInside` zones as a translucent toxic-green splotch
            (not just gray blocks) — else hazard zones are invisible. Terrain: a shared `rotPool(id,x,y,r)`
            helper (nodeFeatures.ts) = non-blocking circle that POISONS (DoT, effectId 'swamp-rot',
            mitigated by defense.dot-resistance — the Swamp counter) + SLOWS (statusWhileInside id 'slow',
            speedMult), targets:['player'] only (mobs wade free; no spawn interaction). 4 pools on node-6-6
            (open-world, lanes between → hazard-aware movement) + 3 on node-7-4 (Grave Toadeater arena,
            center clear → boss hazard-field). NON-blocking so zero passability concern. **Runtime FIX
            (load-bearing):** the node-feature "not inside → remove status" branch stripped ANY node-feature
            status of that id, so multiple discrete pools sharing 'swamp-rot'/'slow' canceled each other
            (pool A applies, pools B/C/D strip). Fixed to OWNERSHIP-based removal — a feature only clears the
            status whose sourceId === `node-feature:<its id>` (applyFeatureEffectsToEntity). Safe for the
            single-feature void throne (sourceId always matches). Mobs already DoT-rich (unchanged). Bosses
            ("survive the rot"): grave-toadeater T1 (50% summon bog-witch caster + light enrage),
            mire-gorged-behemoth T2 (50% enrage + 2 mire-hex-spitter ranged DoT kiters). Verified: 4-pkg
            typecheck, shared rebuild, both server tests, spreadNodes bench clean (p50 0.38ms), Swamp sanity
            script (pools apply DoT+slow / clear on exit via the ownership fix / bosses attach) — removed.
            4/5 starters. NEXT = Cave (elite patrols + high detection pullRange; mostly mob-side, light/no
            terrain) or Step 13 boss-exam scaffolding.
2026-06-24  Step 12 CAVE authored end-to-end (5th/LAST starter; "survive the elite"; patrolled-elite
            territory). Per user direction "brutes patrol, lurkers lurk": added patrols to the bruiser
            elites cave-troll (T2) + cavern-troll (T3) — joining cave-brute (T1, already patrolled) — while
            cave-lurker/giant-spider/deep-spider (ambush) + cave-gargoyle/crystal-gargoyle (ranged) stay
            solo wander (NO patrol). High-detection identity: pullRange bumped 145/150→240 on the three
            patrolling brutes (placeholder) = overpull risk (countered by stealth/reduced-detection boots,
            which already exist). NO terrain (Cave identity is patrols/detection, not hazards). Bosses
            ("survive the elite", a %DR sponge): obsidian-broodmother T1 (50% timed shield + 2 giant-spider
            brood), chitinous-dreadbore T2 (existing 50% enrage+speed, ADDED 1 cave-troll elite reinforce).
            Verified: 4-pkg typecheck, shared rebuild, both server tests, spreadNodes bench clean (p50 0.38ms),
            Cave sanity script (brutes patrol / lurkers+spiders+gargoyles don't / high detection / bosses
            attach) — removed. ALL 5 STARTERS DONE. NEXT = advanced biomes (Jungle/Desert/Volcanic/Tundra/
            Graveyard/Trench, ~6) or Step 13 boss-exam scaffolding (bosses still ad-hoc) or pause for a
            playtest of the starters. Numbers = Step 15. **Wrote the AS-BUILT biome-authoring METHODOLOGY
            into `docs/archive/biome-ecology-plan.md` (section "Biome authoring methodology") — the per-biome
            recipe + primitive toolbox + terrain rules + boss-exam pattern + verification recipe +
            gotchas + file map + worked references. Read it first when authoring any further biome.**
2026-07-10  Item upgrade GM ceiling made TIER-BANDED (was tier-agnostic — GM 30 wrongly opened +5 on
            ALL tiers, leaving only the weaker biome-level gate on T2+ gear). New model: each item
            tier owns the GM band (maxGlobalMasteryAtTier(T-1), maxGlobalMasteryAtTier(T)], derived
            by summing biomeLevelCap over real biomes (clearing excluded) — bands 0-30 / 31-72 /
            73-126 / 127-198 for T1-T4 (T4 counts 12 biomes incl. abyss). +1…+5 spread EVENLY across
            each band (user call: "+5 at full tier mastery" over "flat 6 GM/step + slack"): T1 +1@6…
            +5@30, T2 +1@38…+5@72, T3 +1@83…+5@126, T4 +1@140…+5@198; tier-0 starter gear clamps to
            T1's band. Signatures now take itemTier: upgradeCeilingFromGlobalMastery(gm, tier),
            globalMasteryRequiredForUpgrade(tier, plus); GLOBAL_MASTERY_PER_ITEM_UPGRADE deleted;
            MAX_ITEM_TIER=4 added. checkUpgrade passes item.tier (server unchanged otherwise); client
            UpgradeTab passes def.tier; MasteryPanel item section reworked to per-tier rows; MenuButtons
            sidebar shows per-tier caps. New shared test itemUpgrades.test.ts (band boundaries,
            thresholds fill bands, tier-scoped ceilings, checkUpgrade tier gating). Verified: 4-pkg
            typecheck + full pnpm test 21/21.
2026-08-22  STANCE CORRECTIVE PASS (design_docs/archive/STANCE_CORRECTIVE_PASS_HANDOFF_2026-08-22.md).
            Structure only; magnitudes are seeds for the balance loop. (1) AUTHORING MODEL: StanceDef
            drops `statEffects` for a percentages-only `StanceModifiers` — flat +65 attack / +250 maxHp
            / +45 plating / +70 speed are gone. NO stance may change max HP (it forced HP-percentage
            preservation on a switch the player never asked for). attackSpeedPct + evasion still fold
            at stats.ts step 2a; attackPct/platingPct/moveSpeedPct are a NEW stance-owned multiplicative
            layer at step 3e, AFTER applyClassAffinities — deliberately not summed into the affinity
            bucket, so "+15% Attack" is x1.15 for every class and the tooltip is literally true.
            (2) DAMAGE TAKEN: new `damageTakenPct`, a multiplicative layer read at hit time by the
            stance onDamageTaken listener. The old additive `damageReduction` route clamped to [0,0.9],
            so every stance's "you take more damage" drawback was SILENTLY FREE for any character
            without gear DR. NOTE this reverses the class-affinity-rework call to fold damageTakenPct
            into plain DR — that was decided for 4-15% class values; stance values are 10-25% and
            signed both ways. (3) BEHAVIORAL magnitudes are now named constants in shared/src/stances.ts
            (BERSERKER_SELF_DAMAGE_PCT, PREDATOR_*, EXECUTE_*, BRAWLER_REDUCTION_BY_AGGRESSORS table
            8/16/24/31/40% capped at 5+) read by BOTH the server systems and the player-facing copy, so
            a stance cannot advertise a number it does not apply. Recuperating lost its flat +4 Recovery;
            its identity is the 80% in-combat Recovery ACTIVATION. (4) UI: new `behaviors` field on
            StanceDef spells out every server-side effect; stanceLines renders modifiers + behaviors +
            mechanicEffects + destination RP; every `blurb` rewritten as a mechanics sentence (crafting /
            rune wheel / map unlocks show only the blurb). Rune-owned CONDITIONS are deliberately never
            presented as stance properties. (5) RECIPE GATES: eight stance + three rite recipes still
            charged the RETIRED blight/volatility/predation/brutality catalyst families (uncraftable
            outside the test room); core-bruiser charged Heavy in a jungle that BANS it and core-scout
            Alacrity in a tundra that bans it; six recipes had requiredBiomeLevel above their own tier's
            biomeLevelCap; Fleeting/Brawler/Recuperating sat in biomes retired at their tier (-> jungle /
            volcanic / jungle). Essence + catalyst AMOUNTS untouched. New shared/src/data/recipeGates.test.ts
            enforces all three rules across item/stance/rite/rune/ability databases, with an explicit
            RETIRED_BIOME_DEBT allowlist for 8 pre-existing item/rite placements (out of scope; the
            allowlist self-expires when one is fixed). Bench baseline MOVED: canonicalLoadout now gives
            T2 bots all six T2 stances and T3 bots five rites (was three) because those gates finally
            resolve — balanceInstruments.test.ts updated. Verified: 4-pkg typecheck + bench tsconfig,
            full pnpm test 91/91.
2026-08-23  RECIPE RE-HOMING (follow-on to the stance corrective pass). The gate test written the
            day before flagged 8 recipes sitting in biomes RETIRED at their own tier; measured the
            cost before acting and it was severe, so all 8 moved. A biome keeps levelling past its
            last node band, so these were craftable — but only by farming content the player had
            outgrown: relic-equilibrium-shard's Plains 24 gate = ~12,540 extra kills of T2 mobs at
            playerTier 4, relic-hastebound-dial's Forest 24 = ~6,967, relic-virulent-hourglass's
            Swamp 24 = ~1,489, core-accelerant's Forest 15 = ~1,014, the four Forest rites 293-630.
            Lowering the gates was NOT an option for the relics: the T4 band for a T1-start biome is
            levels 19-24 and every value in it is above what that biome's live content can produce.
            (1) RELICS -> the only free T4-capable biomes were Volcanic and Trench, so 3 relics into
            2 slots: Hastebound Dial (frequency-forward) -> Volcanic lvl 11 (native Swarming);
            Virulent Hourglass (debuff-forward) -> Trench lvl 5 (native Dominion); Equilibrium Shard
            (the no-trade relic) -> Mountain lvl 24 UNCHANGED, the only biome with nodes at every
            tier. USER CHOSE the doubling over the alternative (boss-clear gating in place): Mountain
            now hosts two relics, and the deliberate pairing of the neutral relic with Plains — the
            one biome authored with NO native modifier — is the price. relics-design.md's Acquisition
            row amended, launch-scope row now names Cave/Forest/Plains/Swamp as the relic-less four.
            (2) RITES -> one per biome, each on its biome's native family: swift-repose -> cave 15,
            purification -> swamp 15, lingering-battle -> mountain 15, blood-offering -> volcanic 5
            (kill-chain recovery in the swarm biome); mechanic-renewal/ability-reprieve unchanged.
            (3) CORE -> core-accelerant Forest 15 -> Jungle 11; Alacrity is its authored family tag
            and Jungle is the only biome carrying Alacrity past T2, so home and tag finally agree.
            (4) ESSENCE: amounts identical everywhere; USER CHOSE to re-colour each moved recipe's
            PRIMARY essence to its new home (repo convention = you pay in the essence of the biome
            you level). Catalyst amounts identical, families re-keyed to the new native.
            recipeGates.test.ts RETIRED_BIOME_DEBT allowlist is now EMPTY and the check is a hard
            failure — every core/relic/rite/stance recipe (37) is reachable from live content.
            relics.test.ts biome map + relic-less-biome list updated. Verified: 4-pkg typecheck +
            bench tsconfig, full pnpm test 91/91, pnpm build.
            KNOWN LEFTOVER: rite-recipe-ability-reprieve costs red+purple while its Desert home drops
            yellow — a PRE-EXISTING primary-essence mismatch, deliberately not touched (economy is a
            user-owned axis).
```
