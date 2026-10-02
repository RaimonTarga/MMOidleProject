# Overnight report — 2026-10-01

Run of `docs/briefs/overnight-progression-2026-09-30.md`: Phases 1c, 1d, 2a, 2b, the §1.5
bench and the provisional Phase 4 authoring. Six subagents in two waves, merged and gated by
the conductor. Nothing pushed, no PR opened.

## Branch state

`feat/lineage-data-model` at **`cf972517`** (65 commits ahead of `develop` `3204ce52`;
248 files, ~45k insertions, of which ~29k is generated bench report JSON).

Merged, in order: **`feat/lineage-runtime`** (W1-A, Phase 1c card runtime), **`feat/variants`**
(W1-B, Phase 2a blends/spawning/map), **`feat/lineage-client`** (W1-C, Phase 1d client),
**`feat/remove-old-economy`** (W2-A, Phase 2b removal/migration/docs),
**`feat/defensive-lineages`** (W2-B, provisional Phase 4 authoring), **`feat/lineage-bench`**
(W2-C, §1.5 profiles/bench/telemetry). **Unmerged: none.**

typecheck: **clean** (all packages + `typecheck:bench`). `pnpm build`: **clean** for every
package including the client bundle. Full suite: **339/339 passed in 212s**.

Suite history across the night: `332/332` baseline on the pre-wave branch → `333/335` after
the Wave 1 merge (two failures, conductor-fixed) → `335/335` → `336/336` after the Wave 2
merge → **339/339** at `cf972517` (three test files added by the conductor's review fixes and
the reachability tripwire).

Three conflicts, all resolved by the conductor:
- `shared/src/protocol/combatEvents.ts` — W1-A and W1-C both added the `card-fx` member.
  Identical shape; kept W1-A's canonical block.
- `server/src/systems/player/progression/rewards.ts` — W2-A's reduced import list vs W2-B's
  new `biomeDefensiveLaneAPackets`. Kept both.
- `bot/src/route/executor.ts` — W2-A rewrote a docblock W2-C still carried the old copy of.
  Kept W2-A's docblock and W2-C's new `lineageFarmNode` plus helpers.

## What to playtest (in order)

Costs and thresholds are read out of `magnitudes.ts`, not estimated: at T1 a stat card is
**3 shards of its lane + 30 essence**, a payoff card **8 shards + 90 essence**, a gate
**10 shards of the lane its form crowns + 180 essence + 3 boss capstones**. One kill drops
**1 shard** before reward multipliers, so a dev multiplier shortens all of this. Row
thresholds are **Forest-local** levels: stat at 2, payoff at 4, gate at 6
(`BIOME_LEVELS_PER_TIER` = 6).

1. **Craft a Flash Rapier** in the Make tab (`flash-rapier`, the Forest T1 base form and the
   only form that is not a gate). *Holding* it opens the tree — crafting, equipping, or
   loading a save that has it all work.
2. **Open Inventory and tap the weapon slot.** It names the lineage and the worn form.
   Tapping opens the tree and **closes** the inventory dialog: deliberate, because two
   stacked `GameDialog`s would both consume one Escape press.
3. **Read the T1 band.** Three stat cards (Quick Wrist / Envenomed / Keen Edge) over three
   payoff cards (Echo Strike / Bloodletting / First Blood), three across, in lane order
   Tempo / Affliction / Engagement. Locked cards state their reason. The next band's dimmed
   silhouette is **absent**, because only T1 is authored — honest, not broken.
4. **Farm Forest wolves to level 2, buy Quick Wrist** (3 Tempo shards). Wolves are the Forest
   Pack family and drop Tempo. The weapon trail should change colour — that is the stat row's
   entire visual, derived client-side with no event.
5. **Check a node's info panel before farming.** It names the dominant family, its shard, and
   the families this tier cannot field. Forest reads Pack or Grove only — see the gap below.
6. **Reach Forest level 4, buy Echo Strike** (8 Tempo shards). Every third hit should land
   twice, with a ghost-strike on the target and exactly one effect per application.
7. **Buy Bloodletting and swap between them.** Only one card per row is active across the
   whole tree, so the second does not stack — the swap is the point. **Note:** Bloodletting
   costs *Affliction* shards, which no Forest family drops. At T1 the only family source is
   Swamp Mire, so a Forest weapon's Affliction lane is bought with Swamp farming. That is the
   sharpest question of the night and only a human can answer it: does cross-biome shard
   shopping read as a map worth learning, or as a chore?
8. **Try First Blood (Engagement).** No family drops Engagement at T1 at all; the Forest boss
   does, via the stopgap. So this is **8 boss kills**. Judge whether that reads as "the boss
   is the source" or as a wall.
9. **Reach Forest level 6 and pay the gate.** 10 Tempo shards + 180 essence + 3 Forest boss
   capstones (three `gnarled-greatbear` kills) buys Gale Needle, whose capstone Gale Wake
   opens a speed window whenever your root mechanic fires. The form art changes and the
   player should carry a lasting lane aura.
10. **Wear the new form; check the old band collapsed.** Paying the gate retires the band
    below it as power; the collapsed summary is a wardrobe to reslot from, not a second stack.
11. **Watch the HUD.** Timed payoffs show a lane-coloured buff clock; stacking payoffs show a
    counter. Both ride the existing buff sync.
12. **Armor/charm/boots:** their trees exist and are buyable, and their **+N ladder still
    works too** (see divergences). Worth one pass to confirm neither path is broken.

### Things that will look wrong, and why

- **Two different "lane colours" on screen.** Combat FX use the brief's palette (Tempo amber,
  Empowered crimson, Affliction green, Control ice, Kill chain gold, Engagement white); the
  tree panel's card accents use `packetDefinition().color` (Tempo cyan, Empowered orange,
  Engagement pink). Both claim to be the lane's colour. **Needs one decision.**
- **All six Swamp nodes are identical.** Swamp's two T1 mobs are both Mire, so every Swamp
  node resolves to one family whatever its authored blend says.
- **Three nodes read as duplicates of another node**: Plains-03 is authored Sky and resolves
  to Herd, Forest-03 authored Canopy resolves to Pack, Mountain-01 authored Crag resolves to
  Ridge.
- **Mountain is far more ranged than before.** A family's spawn list is de-duplicated, so
  `cliff-hopper` listed twice in the T1 pool no longer double-weights it: T1 Mountain goes
  from roughly a third archers to 50–80% on four of five nodes, and Mountain TTK is 2–4×
  Plains TTK. **Any pre-Wave-1 Mountain baseline is void.**
- **17 weapons cannot be obtained at all** (see gaps). This does not block a T1 playtest.
- **No tutorial beat teaches any of this.** The weapon upgrade beats were removed, not
  rewritten.
- **Dagger's Kill-chain payoff was dead code until last night** and its bench number is
  therefore invalid; it is fixed but unmeasured.

## Divergences from the plan

**Conductor, process**
- *Plan/brief:* spawn subagents with Agent `isolation: "worktree"`. *Code:* six pre-created
  sibling worktrees (`../mmo-lin-w1a|w1b|w1c|w2a|w2b|w2c`) with `node_modules` linked by
  `scratchpad/link-nm.sh` — the pnpm store junctioned read-only from `../mmo-lineages`, each
  dependency a junction, and the `@mmo-idle/*` workspace links repointed at the local
  worktree so each task compiles its own `shared/`. *Why:* a harness worktree has no
  `node_modules` and the brief forbids every install; verified on a probe worktree
  (typecheck clean, `lineageEconomy.test.ts` ok) before launching. **The donor
  `../mmo-lineages` must not be deleted while those worktrees exist.**
- *Brief:* strip CR from every touched file. *Code:* W2-C did not, correctly — the files it
  touched are committed **CRLF per file**, its added lines match each base, and its diffs show
  only its own lines. Conductor verified every touched file. **The rule should read "match
  the file's base convention and check the diffstat", not "always strip CR".**

**Designer decisions taken at launch (asked before the run)**
- *Brief:* synthetic family per T2–T4 biome. *Code:* `blend` is optional; T1 carries real
  blends, T2–T4 carry none and keep today's spawn behaviour and node-count source. No
  placeholder `FamilyId` entered the union or the partition test.
- *Brief:* silent on the guided tutorial. *Code:* kept compiling and green — weapon entries
  dropped from every `plans.ts` upgrade list, the weapon-only cave beat removed, catalyst
  dialogue and `upgradeCatalystCostFor` deleted, stranded flavour text fixed, arc not
  redesigned. A card/gate tutorial beat is left as a designer decision.
- *Consequence:* the **+N ladder survives for armor, charm and boots** (the tutorial drives
  them), so `Recipe.upgrades`, `UpgradeTab`, `EvolutionPreview`, `inventory:upgradeItem` and
  `crafting:evolveItem` all live on for non-weapon slots, and the migration refunds **weapon**
  upgrades only. Those three slots therefore have a lineage tree *and* a +N ladder at once.
  Deliberate for one phase; reconciling them is Phase 4's exit.
- *Consequence:* node modifiers **degrade to authoring identity** for T2–T4 (node count,
  display names, masks) rather than being deleted; all modifier *gameplay* math is gone.

**W2-B, corrected by the conductor**
- *Brief:* the boss drops shards of "the biome's **weapon** lineage Lane A packet … so a
  Mountain player can buy Bulwark cards". That is self-contradictory — Mountain's weapon
  (Hammer) Lane A is Empowered, so as written it sources no Bulwark. *Code:* design §17 is the
  authority and gives the **non-weapon** Lane As, so a boss kill pays 2 shards of each
  distinct non-weapon Lane-A packet of its biome. Verified: Plains → Bulwark + Kill chain,
  Forest → Engagement + Barrier tempo, Mountain → Bulwark + Barrier tempo + Engagement,
  Cave → Bulwark + Engagement, Swamp → Affliction + Control.

**Other divergences recorded by the subagents in the plan's progress notes**
- T1 node counts are unchanged at 27 (mountain 5, cave 6, forest 5, plains 5, swamp 6), not
  the plan's five per biome: the hand-cut 27-cell mask, `validateBiomeCoverage` and the
  display names are all welded to the modifier count, so Cave and Swamp took a sixth blend.
- `standing` and `pulse` are a clock (`updateLineageCards` from `World.tick`), not listeners.
- `applyCleanse` moved verbatim out of `abilityFiring.ts` into `combat/status/cleanse.ts` to
  break an import cycle; policy byte-identical.
- Defensive capstone FX reuse one key per packet, where the Phase 1 weapon precedent mints a
  unique key per capstone, so two lineages crowning the same lane look identical.
- `UNCROWNED_LANES` is now **empty**: the defensive capstones crown Engagement, Bulwark and
  Barrier tempo, closing the Phase 1a gap.
- **Design doc corrected:** §17's own summary line undercounted Affliction and Engagement
  (6 each where its matrix gives 7) and totalled 43 where the matrix totals 45 = 15×3.
  Recounted independently and fixed in this commit — arithmetic, not design.

## Bench

Full tables are committed at `reports/progression-phase1/lane-matrix.md` and
`lane-survival.md` (`LANE_REPLAY=<json>` rebuilds them in seconds instead of 45 minutes).
Reproduced unedited below: the off-budget list, and the §9 encounter verdict.

**No packet is inside §9's ±10% band, and Tempo is 13× Empowered.** Mean lane uplift over
each lineage's own lane-less control, over all 18 blends. Median **+8.2%**.

| packet | lineages carrying it | mean uplift | × median | in ±10% | payoff fx fired | has a favouring T1 node |
|---|---:|---:|---:|:--:|---:|---|
| tempo | 3 | +16.7% | 2.03x | NO | 1921 | `node-t1-mountain-03` |
| engagement | 2 | +9.5% | 1.15x | NO | 452 | **none** |
| affliction | 2 | +9.2% | 1.11x | NO | 4563 | `node-t1-swamp-01` |
| control | 2 | +7.3% | 0.89x | NO | 1016 | `node-t1-mountain-02` |
| kill-chain | 3 | +4.5% | 0.55x | NO | 838 | `node-t1-cave-03` |
| empowered | 3 | +1.3% | 0.16x | NO | 535 | `node-t1-forest-02` |

**The `fx fired` column is the explanation.** `PACKET_BUDGET` is a flat `1` for all eight
packets, so it pays a payoff that fires on every hit (Affliction) and one that fires once per
pull (Engagement) the same scalar. **Tuning is one column in one table**, and these are the
numbers to tune against.

Per (lineage, lane): rapier-tempo +28.6%, rapier-engagement +18.0%, broadsword-tempo +14.1%,
dagger-control +13.6%, dagger-affliction +9.6%, rapier-affliction +8.7%, axe-kill-chain +7.7%,
axe-tempo +7.3%, dagger-kill-chain +5.2%, broadsword-empowered +2.5%, hammer-empowered +1.4%,
hammer-control +1.0%, hammer-engagement +0.9%, broadsword-kill-chain +0.7%,
**axe-empowered +0.0%**.

**§9 encounter check: 2 of 18 encounters pass "favoured lane wins by ~30%". Every punished
lane cleared, on every blend.** On all three Herd nodes the *punished* lane (tempo) beats the
node median by +16% to +29% while the favoured lane (empowered) sits at the median — **Plains
Herd punishes nothing and rewards its declared victim.**

**Distinct T1 encounter compositions: 18 of 27 authored** — plains 4/5, forest 4/5,
mountain 4/5, cave 5/6, **swamp 1/6**.

**Survival is unmeasurable at T1:** every reference build holds 93–99% mean HP while engaged,
so the defensive lanes cannot be validated on these builds. The only readable defensive effect
is Engagement's opening DR at −7.3%/−7.4% damage taken; Control buys −2.4% on the Hammer and
**+5.9% (worse)** on the Dagger.

Caveats the bench itself raises:
- **§9's ±10% band is not measurable as written.** It compares rows measured on *different*
  nodes, and the favoured nodes differ in mob HP by more than 2× (forest-02's slimes give
  14 kills/min where cave-03's lurkers give 6). Use the uplift table.
- The lane-less controls span **+20.9% to −13.5%** of their own median *before any card is
  bought*, which is why every reading is given twice.
- Engagement's shards were **granted in-harness** (no T1 family source); every affected row is
  labelled `granted (no T1 source)`. Re-run with `LANE_FILTER=engagement` now the boss stopgap
  has merged.
- **Dagger kill-chain's +5.2% is invalid** — its payoff was dead code during the run (see
  below). Re-measure.
- Broadsword↔`energy` is a bench authoring choice, not design: the Iron Broadsword has no
  shipped class pairing. **Confirm or re-home.**

## Code review

`/code-review high` on the merged diff vs `develop` returned seven findings, all in the
Phase 1c runtime plus one bot helper. The data/authoring layers, persistence/migration,
protocol and client panel came back clean.

**Fixed (4), each with a test that fails without the fix:**
1. **`hit-taken` and `barrier-break` registered before defense** (`b260585a`). The whole card
   runtime registered ahead of `initDefenseSystems()`, so `hit-taken` read *pre-mitigation*
   damage and fired on fully dodged or fully absorbed hits, and `barrier-break` could never
   see the `barrierEmptied` metadata the barrier sets afterwards — **every barrier-break card
   was dead data.** Both now register in a second pass after defense. The wiring test cannot
   catch this (it injects the metadata by hand), so `lineageListenerOrder.test.ts` asserts the
   order through the measurement-observer seam.
2. **`plating-stack` compounded against its own output** (`cf972517`). `runReactivePlating`
   adds its plating onto `mitigatesDamage.plating` in place, and the payoff resolved its
   per-stack value from that same stat. One held stack at 0.15 inflated 15 → 17 → 18, and the
   series diverges once `magnitude × maxStacks` reaches 1. **Six of the fifteen defensive
   lineages put this on `standing` or `guard-cast`, which refresh on a 1500 ms clock.** The
   card now carries its fraction and `reactivePlating` resolves it against the plating with
   its own contribution removed.
3. **The bot lied about boss-only shards** (`3f20ba4c`). `biomeDropsShardAtTier1` only knows
   family drops, so after the stopgap landed its stall message was false. It now names the
   biomes whose boss pays the shard.
4. *(found by W2-C, not the review)* **`kill` + `contagion` could never fire** (`d4fb943a`).
   `registerKill` passes the corpse so contagion can read it; `applyPayoff` rejected every
   on-target payoff with a dead target. The Dagger's entire Kill-chain payoff row fired **0
   times across 36 bench cells** while other rows fired 119–2468 times. **The wiring test
   encoded the bug** — it emitted `onKill` with a live target. Fixed and the test now kills
   the target first.

**Left for the designer (3).** All three are real; all three turn on a balance decision, and
every magnitude involved is provisional and already 13× off budget, so they were documented
rather than patched unattended.

5. **`vulnerability` id collision with the Cadence finisher.** Both write id `vulnerability`;
   cadence writes `1 + vulnPct/100` (≈1.30), the card writes `1 + magnitude` (≈1.12). One of
   the two is silently lost depending on order. **Affects authored cards:** `axe` and
   `broadsword` T1 payoffs, plus `barrier`, `fleet`, `robe`, `treads`.
   Two candidate fixes: give the card its own id and compose it in
   `applyMonsterDamageTakenDebuffs` (there is exact precedent — `EXPOSE_WEAKNESS_EFFECT_ID`
   already composes multiplicatively there), **or** keep one record and never lower the
   multiplier or shorten the duration. The first makes them stack; the second does not. *That
   choice is the decision.*
6. **`plating-shred` id collision, worse than the above.** Cadence applies it
   `remainingMs: -1` (permanent) with `maxStacks` from the shred cap and total shred =
   stacks × reduction; the card applies a single-stack timed version with the same id, so
   lineage-first doubles the strip and **cadence-first turns the permanent brand into a 4 s
   one**. Affects the authored `hammer` T1 payoff.
7. **Lineage `hemorrhage` is a maintained bleed, not a 4-tick one.** Correcting the review's
   framing: stacks are *not* uncapped — `Math.max(bleed.stacks, ticks)` caps them, and the
   per-second damage is actually *lower* than independent stacking would give. The real
   artefact is a **ratchet**: `damagePerTick` takes the max ever seen and never decays, so a
   big hit's bleed is maintained indefinitely by chip hits. W1-A chose this deliberately ("a
   per-hit card must not shrink a finisher's bleed") and it is the same id-sharing root cause
   as 5 and 6. Affects `rapier` Bloodletting (n = 1, 0.2 over 4 ticks).

## Gaps and open decisions for the designer

**Blocking a merge to `develop`, not a T1 playtest**
- **17 of 33 weapons are unreachable** — 6 at T3, 11 at T4. Verified on all three legs: T3/T4
  weapon recipes carry `evolvesFrom`; `craftRecipe` refuses anything with `evolvesFrom` (a
  pre-existing rule); `checkEvolve`/`checkReconstruct` now reject weapons; and the lineage
  trees wire T1→T2 only. A sequencing gap between Phase 2b and Phase 5, not a bug in either.
  `server/test/weaponReachability.test.ts` pins the agreed 17-id hole so it cannot be
  forgotten: author a form and the test fails until its id is deleted; strand a weapon and it
  fails naming the recipe. **Three options stay open: an interim evolve exception, fast-track
  T3/T4 form authoring, or accept the gap.**

**The T1 map cannot field its own family table**
- `biomeTier: input.tier` and region T1 is `tier: 1`, so every T1 node fields only
  `monsterPoolByTier[1]` — **two mobs per biome**. Every biome's third family (Sky, Canopy,
  Crag, Brood, Coven, Stalker) debuts at biome tier 2. Closing it needs a third T1 mob per
  biome, which is monster authoring and therefore yours. It is **beyond bible open decision 2**,
  which only asks whether those families are the right ones.
- Shards reachable at T1 **from families**: Tempo 3, Empowered 3, Control 1, Kill chain 1,
  Affliction 1, Engagement 0, Bulwark 0, Barrier tempo 0 — design §9's "≥2 family sources per
  packet per tier" fails for six of eight.
- **With the boss stopgap every packet now has ≥2 T1 sources**, but four are **boss-only**:
  Engagement (forest/mountain/cave bosses), Bulwark (plains/mountain/cave), Barrier tempo
  (forest/mountain), and Control/Kill chain/Affliction have one family each. A boss pays 2
  shards against a payoff card's 8, so a boss-only lane is ~4 boss kills per card and 5 more
  for the gate, versus ~8 trash kills for a family-sourced lane. **Those lanes' income is
  gated by boss respawn rather than farming** — price that, or give them a family.

**Numbers with no authored home** (named as constants at the top of `lineageCards.ts`)
- `STANDING_MS` 1500 and `PULSE_MS` 4000: **`standing` and `pulse` have no authored cadence
  anywhere** — the magnitude table has no column for "how long is standing still" or "how
  often is a pulse".
- `CONTAGION_RADIUS` 120 and `CONTAGION_TARGETS` 1: contagion's reach is a positional lever
  the table cannot express; `PAYOFF_UNIT` only authors the stack share.
- `BLEED_TICK_MS` 1000, `CLEANSE_STACKS`/`CLEANSE_DEBUFFS` 1/1, `ENGAGEMENT_IDLE_MS` 4000.

**Provisional and flagged for review**
- **All fifteen non-weapon lineages** (armor `robe` `bindings` `plate` `hide` `wrappings`;
  recovery `stone` `heartroot` `barrier` `pulse` `eye`; mobility `fleet` `wraps` `treads`
  `wing` `marsh`). Every file header says PROVISIONAL. Their lanes come from design §17, which
  is itself marked "proposed, not approved".
- The boss Lane-A shard stopgap is provisional by design §17's own text: remove it when a
  family covers those packets.
- Every magnitude in `magnitudes.ts` remains provisional and unbenched beyond the lane matrix.

**Smaller, carried forward**
- Two colour systems both called "the lane's colour" (combat FX palette vs
  `packetDefinition().color`). One decision needed.
- `FamilyDefinition` has no `favours` field; §9 asks for favoured *and* punished, the table
  carries `drops` + `punishes`, and the bench reads `drops` as favoured. Plains Herd drops
  Empowered but measurably favours Tempo, so `drops` may be the wrong proxy. **Either §9 or
  the family table has to move.**
- T1's vestigial `modifier` field is still attached to T1 nodes (cosmetic only — shard
  granting is monster-family-keyed). Removing it means re-cutting the hand-cut 27-cell mask to
  25 and trimming the Cave/Swamp blends.
- **`server/test/**` is not typechecked** (`server/tsconfig.json` has `"include": ["src"]`), so
  stale fields linger in test fixtures — several still pass `catalysts: {}` after the wallet
  was deleted. Harmless today; it also means a new test file's type errors only surface at
  runtime.
- `previewEquipmentStats` builds a synthetic inventory with no `lineages`, so the stat sheet
  and swap preview still ignore lineage cards (§1.3's known limitation, unresolved).
- Defensive FX reuse one key per packet across cards and capstones, so two lineages crowning
  the same lane are visually identical. Data-only fix.
- The `unlockCard` / `setActive` route steps have **never run against a live server** (no
  Docker all night), so time-to-first-card and swaps-per-session are wired but unobserved —
  the Phase 1 exit criteria still need a live bot run.
- `reports/progression-phase1/lane-matrix.json` is 556 KB of generated data, committed so
  `LANE_REPLAY` works. Drop it if you would rather not carry it.
- One W2-A commit (`5d93d53f`) swept in `shared/src/systems/itemUpgrades.ts`/`.test.ts` under a
  message that does not mention them. The diff is correct; history was not rewritten.
- Phase 3 (frame loops) and Phase 5 (T2 band) were **out of scope** by the brief and remain
  untouched; both wait on the per-root review in bible open decision 1.
