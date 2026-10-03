# Course-correction run — brief (2026-10-03)

Implements design §24 (design_docs/progression-rework-design.md, commits ec985a76 →
a980296c): the lean-and-verb composition, one shard per node, families follow lanes,
non-weapon trees parked and the ladder retired everywhere, the weapon page and the rhythm
readout, the bench floor. Read §24 whole, then §4, §12, §18.9, §21, §23 and the review
findings (docs/briefs/lineage-branch-review-findings-2026-10-02.md, for the traps it names).
The two approved mockups are the UI contract:

- the weapon page, readout and map: https://claude.ai/artifact/NM5PeB1tEpXJGhPU3qLnd7
- the lean × verb review sheet (sentences, halves, shard names): https://claude.ai/artifact/MaMEHdKZHZiYPiiB3NJC34

**Conductor: Opus**, in the worktree `../mmo-lineages` (NOT the main repo, which the designer's
Astra session is using): `git checkout -b feat/course-correction develop` there, develop tip ≥ a052e07e. Subagents in the prepared worktrees `../mmo-lin-w1a`, `w1b`,
`w1c`, `w1d2`, `w2a`, `w2b`, `w2c` (each: `git checkout -b <task-branch> feat/course-correction`
AFTER `git status` shows no foreign files; they are junctioned to `../mmo-lineages`'s pnpm
store — never `pnpm install` anywhere; never push; strip CR only on files you touch; never
kill processes by image name; one dev server per bot arm). Merge order is given per wave.
Related tests + `pnpm typecheck` before every commit; the FULL suite once before each merge
into `feat/course-correction` (the review found a merge that skipped it).

**Models.** Design, UI, combat FX, bot and bench work: **Opus**. Two tasks are marked for
the designer's OpenAI budget because they are mechanical and test-pinned, and the designer
runs those sessions himself: **W1-E (icons, codex pipeline, in `../mmo-lin-w2c` on `feat/cc-icons`)** and **W1-D (ladder fold,
Astra, in the main repo on `feat/cc-fold`)**. Every session gets its own worktree; nobody
switches branches in a worktree another session is using. If a marked task is not picked up by launch, Opus does it.

## Hard rules

1. **No new system at T1.** Two rows: lean (row 1) and verb (row 2). Anything that wants a
   third concept goes to a T2 form that borrows a lane, or to future-plans.
2. **Synergy buys reliability, never rate.** Every moment has a rate cap (table below);
   a class that satisfies a moment trivially (Apprentice × Affliction, Mid-range melee ×
   Control) fires it reliably, at the cap, not more often.
3. **A proxy never recurses.** The Empowered payload (`mechanic-proxy`) fires the
   mechanic's effects and sets `mechanicConsumed`, but never emits `mechanic-fired` and
   never re-enters a frame loop. Same rule as the Signature keystone.
4. **Perceptible with the sound off** (§24.1). Every payload has its own FX; a damage
   number is never the only sign. No tints as FX.
5. **One sentence per card, no flavour text rendered.** `description` stays authored and
   unrendered. Sentences are GENERATED from the two halves (§24.2 rule), never hand-typed
   per pair; the same-lane pure sentence is the one hand-authored string per packet.
6. Balance numbers (magnitudes, rates, caps, costs, family stats) are the designer's: use
   §24's shapes, implement as data, flag every number you had to pick.

## The halves (authoritative: design §24.2; the designer may amend before launch)

| Packet | Shard | Lean stat | Moment (verb row) · rate cap | Payload (lean row) | Pure sentence |
|---|---|---|---|---|---|
| tempo | Gale | attackSpeedPct | every 6th hit · n/a | `echo-hit` 100% (lands twice) | Every 6th hit strikes twice. |
| affliction | Venom | **DoT potency** (`dot.*`, new LineageStatKey) | hit on an afflicted target · 1 per 5 s | heavy poison/bleed, a swing over 4 s | Hitting an afflicted target doubles its affliction. |
| engagement | Spark | attack | first hit on each new target · per body | lunge, 2× (`big-hit`, new) | Your first hit on each target is a lunge for double damage. |
| empowered | Anvil | attackPct | when the mechanic fires (`mechanicConsumed`) · mechanic cadence | `mechanic-proxy` (new) | Your mechanic hits half again as hard. |
| control | Shackle | attack | hit on a slowed/rooted target · 1 per 5 s | root 2 s | Hitting a held target knocks it down for 1.5 s. |
| kill-chain | Bone | speed | next hit after a kill · per kill | heal 10% pool + loaded hit (+50%) | A kill heals a tenth of your pool and loads your next hit. |
| technique | Sigil | techniquePowerPct | when a Technique lands · per cast | refund ⅓ cooldown | A landed Technique refunds half its cooldown. |

Bulwark → Iron, Barrier tempo → Glass (named, unused while non-weapon trees are parked).

---

## Wave 0 — baseline (conductor, before anything else)

- Full suite + typecheck on the branch tip; record counts in the report.
- T1 lab baseline: `server/scripts/_t1BossLab.ts` six classes × five bosses, tutorial kit,
  30 seeds (reports/t1-boss-pass/plan-base.json) → `reports/course-correction/baseline-boss.jsonl`.
- Lane bench baseline on today's cards → `reports/course-correction/baseline-lanes.jsonl`.

## Wave 1 — data and runtime (five tasks in parallel)

Merge order: **W1-A, W1-B, W1-C, W1-D, W1-E.**

### W1-A — composition in the resolver · Opus

```
Branch feat/cc-compose off feat/course-correction. Implement design §24.2 at resolve time,
not in the combat runtime:
1. types.ts: keep RowKind 'stat' | 'payoff' as the internal ids (a rename across data,
   resolver, UI, tests, tutorial scripts and bot routes is churn with no behaviour); the
   UI labels them "Lean" and "Verb" through one `ROW_LABELS` map. Each PacketDefinition gains `moment: LineageTrigger & { capMs?: number }`, `payload:
   LineagePayoff`, `pureSentence: string`, `shardName: string`, `momentPhrase: {text,
   kind:'subject'|'clause'}`, `payloadPhrase: string`. Lean cards carry only `lane` (stat
   comes from packetScalingStat); verb cards carry only `lane` (moment comes from the packet).
2. shared/systems/lineages.ts `resolveLineageCards`: after resolving, if a verb is active,
   its payoff := the active lean's packet payload (same lane → the packet's pure
   trigger/payoff pair); no lean → its own lane's payload. Expose
   `composedSentence(lineage, progress)` and `cardSentence(card, progress)` for the UI
   (the §24.2 grammar: subject moments "X <payload>.", clause moments "X, the hit <payload>.").
3. Rate caps: `LineageTrigger.capMs`; the dispatchers in lineageCards.ts honour a per-card
   cooldown (`TracksCombat` cooldown keyed by card id). Affliction and Control moments cap at
   5000 ms by data.
4. New vocabulary: trigger kinds 'hit-afflicted', 'hit-held'; payoff kinds 'big-hit'
   (multiplier on the triggering hit, recorded in ctx.metadata.empoweredMultiplier so it is
   the one multiplier per hit), 'mechanic-proxy' (sets mechanicConsumed + runs the
   archetype's empowered multiplier path WITHOUT emitting mechanic-fired; rule 3),
   'heal-and-load' (or compose existing 'heal' + 'empower-next' if both exist). Units in
   PAYOFF_UNIT, normalisation entries for the two new triggers, fx keys per payload.
5. Affliction's scaling stat → DoT potency: add 'dotPotencyPct' to LineageStatKey mapping
   onto the dot.* passives the formulas read (conversion-pct is the first candidate; flag
   the choice). Tempo's on-hit bonuses in lineage data move to attack speed; on-hit stays a
   weapon base stat.
6. Re-author the five T1 weapons' bands as 3 lean + 3 verb cards each (names from the
   review sheet, no per-pair text). Coverage tests: nine packets have all halves; every
   weapon's 9 compositions produce a sentence; same-lane uses the pure sentence; no
   composition recurses (mechanic-proxy never emits mechanic-fired: a wiring test).
Related tests, typecheck, commit per step.
```

### W1-B — one shard per node, families follow lanes · Opus

```
Branch feat/cc-shards. Design §24.3–§24.4.
1. families/index.ts: Sky→kill-chain, Grove→engagement, Hopper→engagement, Brood→tempo
   (`drops` only; `punishes` unchanged). Update the family tests and the coverage test
   (every packet ≥2 T1 sources counting the boss stopgap; technique has 1 + stopgap).
2. Node shard: each node's shard is its DOMINANT family's `drops` (first blend entry;
   ties break in family-table order as today). Add `nodeShard(nodeId)` in
   shared/src/world/nodeBlends.ts; the reward seam in
   server/src/systems/player/progression/rewards.ts pays `nodeShard` for every non-boss kill
   in the node instead of the dead mob's family shard. Boss stopgap unchanged. Pack
   followers therefore pay the node's shard (closes review P16 by construction).
3. Shard names: PacketDefinition.shardName; every surface that printed "<lane> shard"
   prints the shard name (materials panel, tree wallet, map, banner, bestiary, tutorial
   copy, bot logs are fine as ids).
4. Map + arrival banner: show the node's family and shard ("Pack territory · drops Gale
   Shards"), per the mockup's Forest map tab; the discovery banner replaces the removed
   modifier copy (review P13 already uses MODIFIER_SUMMARIES; extend).
5. Swamp arrival order (review P17): reorder SWAMP_BLENDS so the first two arrivals are
   mixed, matching the other biomes; or scope the regionT1.ts comment if the designer says
   otherwise (default: reorder).
Tests: nodeShard partition (every T1 node pays exactly one shard; every T1 weapon lane is
payable in its home biome), rewards wiring (kill in a blended node pays the node's shard),
family coverage. Related tests, typecheck.
```

### W1-C — the parked trees and the one rule for slots · Opus

```
Branch feat/cc-slots. Design §24.5.
1. Park non-weapon lineages: LineageDefinition.parked = true for the 15 non-weapon
   lineages. A parked lineage: no page entry, no card purchasable (checkUnlockCard refuses
   with 'This slot has no tree yet'), no runtime cards resolved, no shard cost shown,
   coverage/reachability tests skip it (P4 becomes moot and is noted as such). Data stays.
2. Retire the +N ladder on every slot: `inventory:upgradeItem` refuses for all slots;
   UpgradeTab removed from the crafting rail; the recipe ladder steps are no longer
   reachable. Migration: refund essence for existing non-weapon upgrades the way weapons
   were refunded (server/src/db migration, mirror the weapon one), keep items.
3. Retire the evolve path: `evolveItem` refuses; T2+ non-weapon items become plain
   recipes gated by biome level (drop `evolvesFrom`, keep costs; craftRecipe allows them
   since they are no longer lineage forms of a live tree — isGatedLineageForm must return
   false for a PARKED lineage's forms). MakeTab/EvolutionPreview/evolutionPlan: remove the
   evolve UI paths; Make rows for these items read like any recipe.
4. Fold the deleted ladder into base stats for armour/charm/boots — HANDED TO W1-D; this
   task only lands the code paths and tests around it and coordinates the merge.
Tests: upgrade/evolve refused for every slot; parked lineage refuses purchases; a T2 vest
crafts from its recipe at biome level; weaponCurve.test still pins weapons.
```

### W1-D — the non-weapon ladder fold · **Astra (designer-run)**, else Opus

```
Branch feat/cc-fold. Design §23 applied to armour, charm and boots: for every non-weapon
recipe with an `upgrades: [...]` ladder (shared/src/data/recipes/*.recipes.ts — 74ab24ac
is the model, it touched the same files for weapons), fold the +1..+5 ladder's total into the base `stats` exactly as
74ab24ac did for weapons (Attack/on-hit/plating/DR/evasion/maxHp/recovery/speed — recover
each number from the deleted steps, invent nothing), delete the steps, and extend
weaponCurve.test.ts (or a sibling) to pin: no item carries a ladder, and each item's base
equals its old +5 total. Report the before/after table per item. Numeric and mechanical;
no design calls.
```

### W1-E — icons · **codex pipeline (designer-run)**, else Opus via PixelLab

```
Nine shard icons (Gale, Anvil, Venom, Shackle, Bone, Spark, Sigil, Iron, Glass) in the
item-icon language (design_docs/visual_and_aesthetics_design/*, 'never say chest', square
iron-plate language for relics does NOT apply — these are materials), plus the ten buff
tiles the review found missing (lineage-damage/-speed/-recovery/-guard/-ward/-plate/
-technique/-evasion, frame-window, frame-charge) so the aliases in conceptIcons.ts can be
removed, plus one glyph per payload for the rhythm readout ring label (seven). Wire through
art/ and art:pack as the pipeline README says; the designer accepts art in the gallery.
```

## Wave 2 — the page, the readout, the FX (after wave 1 merges; three tasks)

Merge order: **W2-A, W2-B, W2-C.**

### W2-A — the weapon page · Opus

```
Branch feat/cc-page. Implement the mockup's Weapon page tab in client/src/ui/lineage/
(replace LineageTreePanel's layout; keep its data hooks): entry from the equipped weapon
in the inventory/equipment panel; form header; one row per tier as a choice of three in
lane colours, one lit; card = name + generated sentence (cardSentence) + cost chips +
requirement; lean hover → before/after on the real stat sheet; verb tiles re-render their
sentence when the lean changes; locked T2 row shows what opens it; gate block at the
bottom (boss portrait, capstone pips, what it opens, pay button). No flavour text. Parked
slots show no entry. Mobile: single column, same order. Keep TUTORIAL_ANCHORS working
(lineageCard, lineage.form) — the tutorial director depends on them.
```

### W2-B — the rhythm readout · Opus

```
Branch feat/cc-readout. One readout near the HP bar (client/src/hud/): a ring per active
triggered card (count toward the moment, or 'ready' for latch moments like first-hit),
plus the frame's window/bank ring, at most three. Server exposes the counters it already
keeps (nth counters, latches, cooldown caps) on a small networked slice or via existing
events — prefer existing TracksCombat counters surfaced through the HUD status path; no
per-tick booleans. Rings use the lane colour; 'ready' flashes; the payoff fires a floating
word (the card's name) at the player, not a bigger number. Remove the lineage window buff
TILES from the buff bar (the ring replaces them); keep the status in the tooltip path.
```

### W2-C — payload FX · Opus

```
Branch feat/cc-fx. One readable effect per payload per design rule 4, in the premium
grammar (docs/combat-animation-current-state.md, memory: boss animation style): lands
twice = a second swing animation on the body; big-hit = a lunge dash + afterimage; heavy
poison = a visible drip burst; root = shackle ring on the target; mechanic-proxy = the
class's own mechanic flash; heal-and-load = a pulse on the player + a loaded weapon glow;
technique refund = the ability icon flashes ready (HUD). Pushed through world.pushEvent,
never per-tick flags. Each verified in the client repro harness with one screenshot per
payload for the designer.
```

## Wave 3 — bench, bot, tutorial, docs (after wave 2; two tasks + conductor)

### W3-A — bench floor and the composition matrix · Opus

```
Branch feat/cc-bench. (1) Bench criterion → viability floor: no lane/pair below 0.9× the
tier's median uplift; ordinal encounter checks stay; retire the ±3pp band in code and docs.
(2) Composition matrix: every weapon's 9 pairs × 6 classes × 10 seeds on the boss lab and
the lane bench (plan rows gain `lean` and `verb`; prepareLaneBot buys both), outliers
listed above 1.5× and below 0.9× of the median. (3) The flagged pairs get a wiring test
each: Control payload → Control moment loop stays under the cap; mechanic-proxy never
emits mechanic-fired; Affliction moment on an Apprentice fires at the cap, not per hit.
(4) Boss lab after/before against wave 0's baseline; report the delta per class.
```

### W3-B — tutorial and bot routes · Opus

```
Branch feat/cc-tutorial. The guide teaches two purchases (lean at Forest 2, verb at
Forest 4) with the composed sentence as the lesson ("look at what your verb says now");
every melee plan keeps the Rapier worn for the gate beat (review P9 is in); the kit table
and bot routes (bot/src/routes/tutorialRoutes.ts, classScript.ts) buy lean+verb; shard
copy uses shard names; the first-hour checklist (≤2 new concepts per level, each explained
by what the screen shows) is written into docs/guided-tutorial-plan.md and checked
against the script. Canonical 1x six-class sweep at the end (one server + DB per class).
```

### Conductor close-out

- Full suite, typecheck, merge `feat/course-correction` → `develop` (no push).
- Report `docs/briefs/course-correction-report-2026-10-03.md`: what moved (every number
  picked, with its reason), the composition matrix with outliers, the boss lab delta, the
  sweep ledger, screenshots index, what could not be verified, and the designer's open
  calls. Fold living truth into docs/lineages-current-state.md; update docs/README.md.
- Memory for the designer's session is updated by the designer's session, not here.

## Not in scope

Ability pass (§22; next run, under the composition grammar). Non-weapon trees (parked).
Second damage channel for Behemoth/Broodmother (design item). Forest guard pack (designer).
Monster/boss numbers. Recovery. T2+ node authoring beyond the shard rule.
