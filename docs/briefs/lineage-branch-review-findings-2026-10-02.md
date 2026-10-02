# Review findings — feat/lineage-data-model against develop (2026-10-02)

Brief: [`lineage-branch-review-2026-10-02.md`](lineage-branch-review-2026-10-02.md). Review
only — no code was edited. The designer's session fixes what is confirmed.

## Verdict

**Do not merge yet. Fix five things first, then the playtest list.**

The five merge blockers:

1. **Free T1 base forms on relog (B1).** Any lineage request saves an empty tree, and the next load gives that tree its base form for free. Repeated across all 20 lineages, this hands out every T1 base item.
2. **Death switches off lineage effects (B2).** Dying turns off every lineage card, capstone, keystone and ability node until some unrelated stats rebuild.
3. **Double kill rewards (B3).** A lethal `echo-hit` (on T1 Axe and Rapier cards) or Effigy slam pays the kill twice and fires `onKill` twice.
4. **Gates skipped by crafting (B4).** Fifteen gated forms, four of them weapons, can be crafted from the Make tab for essence, so their boss gate is never paid.
5. **The one failing test (B5).** `durability35Matrix` pins exact families that a later blend reorder changed. That reorder (`ccf1dde8`, the Mountain T1 entry-pressure commit) was merged without a full suite run.

Each blocker was found independently by two reviewers, or by one reviewer with a repro, and the conductor re-read the code path. Each fix is local, a few lines.

Behind the blockers, 18 "fix before playtest" items:

- The most serious is the `empoweredAttack` metadata flag meaning two things. Because of it, Surge in Overdrive fires every mechanic-fired card on every hit (P1).
- The rest are mostly what the player sees:
  - Amplifier and keystone tiles show numbers nothing applies.
  - Ten buff and frame tiles render as blank squares.
  - The tutorial gate beat opens the wrong weapon's tree.
  - 78 non-weapon T3/T4 cards can never be bought.

**Two consequences for evidence already on the branch:**

- **B2 may have contaminated earlier runs.** Any bench or bot run where the player died, including run 4's W2-B runs (`--fastBossRetry` in 5 of 6) and canonical sweeps after a death, may have fought on with cards, capstones and keystones off.
- **B3 inflates kill counts.** Any economy measurement with Axe/Rapier echo cards or a summoner on the Effigy frame (whose linked slam is the other path) slightly inflates essence, kills and kill-trigger fires.

Neither has been measured; see Unverified.

## Method and baseline

- **What was reviewed:** tip `2d14df6c`. The worktree was at `6ae45ff3`, which only adds the brief. Merge-base with `develop` is `3204ce52`: 337 commits, 676 files.
- **How:** seven Opus reviewers, one per area of the brief, plus the conductor. Every finding marked CONFIRMED below was verified by a scratch repro against a real `World`, by running a test, or by reading the full call chain (noted per item). The conductor re-checked B1–B5, P5 and P6 directly.
- **Deviation from the brief:** checking out the prepared `../mmo-lin-w*` worktrees at a detached HEAD was blocked by a permission check. Those worktrees hold their own branches, and other sessions may own them. So they were left untouched, and every reviewer worked read-only in `../mmo-lineages` (HEAD code-identical to `2d14df6c`), with repros in the session scratchpad. `git status` was empty in `../mmo-lineages` after every reviewer finished.
- **`pnpm typecheck`:** clean (exit 0, all packages plus `typecheck:test`).
- **`pnpm test` (full suite, once, before review):** **360/361 passed in 235 s.** One failure:
  - `server/test/durability35Matrix.test.ts`: `AssertionError: entry node family drift`, actual `'mountain-ridge'`, expected `'mountain-crag'`, at `server/bench/balance/durability35Spec.ts:129`. See B5.
- **Line endings:** no file in `git diff --numstat develop...HEAD` changes its add/del counts under `--ignore-cr-at-eol`, so there is no whole-file churn. The three equal-add/del rows are real edits on all-CRLF files:
  - `server/bench/balance/progressionSnapshot.ts` 14/14
  - `server/test/fastBossRetry.test.ts` 8/8
  - `shared/src/riteRecipes.ts` 14/14
- **Package boundary:** no changed non-test `shared/` file imports `node:`/fs/path/miniplex/phaser/socket.io/express or server/client code.
- **TODO/FIXME/XXX/HACK added in shipped code:** none. The 145 PROVISIONAL / PLACEHOLDER / stopgap markers the branch adds are listed in the appendix.

Severity: **blocks merge** / **fix before playtest** / **later**. "develop" means the defect predates the branch; "branch" means the branch introduced it.

---

## Blocks merge

### B1. A lineage request for a tree the player doesn't hold gives them its base form free on the next load
- **Area:** 1 + 2 (economy, persistence).
- **Where:** `server/src/systems/player/economy/lineageSync.ts:33-37` writes the empty tree. `shared/src/systems/lineages.ts:119-120` (`normalizeLineageProgressMap`) adds the base form on load, via `server/src/db/playerRepo.ts:617`.
- **Defect:** `ensureLineageProgress` *persists* `{ownedForms:[]}` for a player who doesn't hold the base form ("an empty tree, not a free form"). Every hydrate then pushes `baseFormRecipeId` into `ownedForms` unconditionally.
- **Scenario:**
  1. A character with an empty bag and 0 essence sends `lineage:setActive {lineageId:'hammer', row:'stat', cardId:null}`. This succeeds, and so do the refused `unlockCard`/`unlockForm`/`wearForm` calls; all four handlers write the tree (`lineages.ts:116,169,211,253`).
  2. The player relogs.
  3. `lineage:wearForm {hammer, heavy-hammer}` pushes the item into the bag and equips it (`economy/lineages.ts:263-267`).
- **Effect:** across 20 lineages, every T1 weapon, armor, charm and boots item at §23 full power, with no essence and no recipe level. Two repros: area 1 `wear after reload: true … equipment.weapon = heavy-hammer`; area 2 `free forms worn: 20`. The same normalisation also gives a free base to legacy T2-only trees and to the crafted-door trees from B4.
- **Why green:** `shared/src/systems/lineages.test.ts:215-216` asserts the bug ("the crafted base form is always owned"). `server/test/lineagePersistence.test.ts:119-121` only checks attach, never a reload.
- **Smallest fix:**
  - `ensureLineageProgress` returns a transient, unsaved progress when the base form isn't held, and the tree is written only on success, as `server/src/systems/player/economy/abilityNodes.ts:205-216` already does.
  - `normalizeLineageProgressMap` stops inventing base ownership (`wornForm = raw.wornForm ∈ owned ? … : ownedForms[0] ?? ''`). Attach-time `syncLineagesFromInventory` already rebuilds trees from held items.
  - Flip the `lineages.test.ts:215-216` assertion and add a reload case.
- **Verdict:** CONFIRMED (two independent repros; conductor read lines 100-128 and the sync).
- **Provenance:** branch (`17390ae3` normalize, `11a1a952` sync).

### B2. Dying turns off every lineage card, capstone, keystone and ability node until some unrelated recalc
- **Area:** 2 + 3 (runtime lifecycle).
- **Where:** `shared/src/components/combat/tracksCombat.ts:109-110`. The branch added `delete state.lineageRuntime; delete state.abilityNodeRuntime` to `resetTracksCombat`. `server/src/systems/world/spawning/index.ts:1025` (`recalculatePlayerEntityStats`, which builds both caches) runs **before** `:1040` (`resetTracksCombat`, which deletes them).
- **Scenario:** buy `rapier-t1-tempo-payoff`, die, respawn. Two repros print runtime cards `1 → 0` / `NONE`.
  - Stat rows survive because they come from the recalc. Every trigger payoff, the worn capstone, every keystone (`activeKeystoneCard` reads the runtime) and every ability node stays inert until an equip, purchase, tier-up or relog.
  - Nothing recalcs in idle play, so after the first death the cards are off for the rest of the session.
  - `getLineageRuntime` (`tracksCombat.ts:124`) returns the field raw, with no lazy rebuild.
- **Same order, same effect:**
  - `prepareFastBossRetry` (`server/src/admin/gameActions.ts:225`)
  - `leaveTestRoom` (`:279`)
  - `server/src/systems/world/testRoomInteract.ts:78/82`
- **Why green:** the wiring tests seed the cache with `setLineageRuntime` and never drive a respawn.
- **Smallest fix:** either move `resetTracksCombat` above the recalc in `respawnPlayer` and `testRoomInteract` (as `clearPlayerSkillState` does), or stop `resetTracksCombat` deleting the two recalc-product caches. Add a wiring test: card fires → die → respawn → card fires.
- **Verdict:** CONFIRMED (two independent repros; conductor read both sites and the getter).
- **Provenance:** branch (`24f2a580`, `e538a54d`).

### B3. A proc that kills the exchange's own target inside `onHit` pays the kill twice
- **Area:** 3 (combat).
- **Where:**
  - `server/src/systems/combat/lineageCards.ts:471` (`echo-hit` on the primary, through `applyPlayerProcDamage`). It is authored on T1–T2 Axe and Rapier tempo cards, e.g. `shared/src/data/lineages/axe.ts:26`.
  - `server/src/systems/classes/archetypes/summoner/frameLoop.ts:194` (the Effigy linked slam on `ctx.defender`).
  - `server/src/systems/combat/engine/combat.ts:439` (and `:807`), the `emitCombatEvent("onHit")` the attack continues past.
- **Defect:** `applyPlayerProcDamage` (`server/src/systems/combat/damage/procDamage.ts:92-124`) runs `onKill`, `grantMonsterRewards` and `removeMonsterEntity`. `runPlayerAttack` then carries on, finds `hp <= 0` at `combat.ts:640`, and runs `onKill` + `grantMonsterRewards` again.
- **Scenario:** a lethal echo or Effigy slam produces 2 `player-kill` events, 2 essence drops (+4 instead of +2) and 2 `onKill` listener passes, so kill-trigger cards fire twice. Repro `effigyDoubleKill`: `player-kill events 2 essence-drop events 2 onKill listeners fired 2`.
- **Smallest fix:** in `runPlayerAttack`, return `'killed'` right after each `emitCombatEvent("onHit")` when the target is no longer in the world (both sites). Or make `grantMonsterRewards` refuse a monster that has already been rewarded.
- **Verdict:** CONFIRMED (repro; conductor read `procDamage.ts:92-124`, the lineage `onHit` registration at `lineageCards.ts:752/796`, and `combat.ts:439-640`).
- **Provenance:** branch. The develop-era proc callers the conductor checked (cannon, summoner spec) run on their own ticks, not inside the exchange.

### B4. Fifteen gated forms can be crafted for essence, skipping the boss gate
- **Area:** 1 + 2 (economy / gate authority).
- **Where:** `server/src/systems/player/economy/crafting.ts:29` refuses only recipes with `evolvesFrom`. `:79` then runs `syncLineagesFromInventory`, which records the crafted item as an owned, worn form.
- **Defect:** the re-homed doors have no `evolvesFrom`. Four are weapons:
  - `desert-sunsteel-cross` (`shared/src/data/recipes/desert.recipes.ts:29`)
  - `jungle-stinger-rapier` (`jungle.recipes.ts:24`)
  - `tundra-permafrost-maul` (`tundra.recipes.ts:20`)
  - `tundra-rimebrand` (`tundra.recipes.ts:34`)

  The other 11 are armor, charm and boots doors (`docs/lineages-current-state.md` §6), e.g. `trench-charm-t4`, `graveyard-boots-t4`. `makeEntries.ts` lists them to honest players.
- **Scenario:** a T2 player at Jungle level 1 crafts `jungle-stinger-rapier` for `{green:55}`. The tree becomes `ownedForms:["jungle-stinger-rapier"], wornForm:"jungle-stinger-rapier"`, and its T2 band is buyable. The skipped gate is `{green:180, affliction:10, jungle capstone ×3}`, and `capstones` stayed `{}` in the repro. The same holds for Sunsteel (Desert 1, 70 yellow vs 3 Razorback Tusks + 180 essence + 10 shards).
- **Contradicts:** design §5 ("the boss is the only way up"), `shared/src/data/lineages/types.ts:412-413`, and `docs/lineages-current-state.md:210` ("gated doors").
- **Smallest fix:** refuse `craftRecipe` and hide the recipe in the Make tab through one shared check whenever `lineageForRecipeId(id)` maps it to a form with tier > 1, at least for weapons. Flip `t2ProgressionEconomy.test.ts`'s "Jungle/Desert gear must NOT have a T1 predecessor" expectation to match.
- **Verdict:** CONFIRMED (two repros; conductor read the guard and the four recipes).
- **Provenance:** branch.
- **Severity note:** area 1 rated it "fix before playtest" and area 2 rated it "blocks merge". Ranked here as a blocker because the ordinary Make tab offers it.

### B5. `durability35Matrix` fails on the tip
- **Area:** 4 + 7.
- **Where:** `server/bench/balance/durability35Spec.ts:128-130`. Root cause: `ccf1dde8` reordered `MOUNTAIN_BLENDS` (`shared/src/world/map/regionT1.ts:63`).
- **Defect:** the spec pins node-01 to `mountain-crag` and node-02 to `mountain-ridge`. The invariant it protects (line 123) is only "the two contexts differ".
  - node-01 is now `{ridge .7, hopper .2, crag .1}`.
  - node-02 is `{crag .45, ridge .45, hopper .1}`, a tie broken by family-table order.
  - So the dominant families are `[ridge, crag]`: still distinct, but both pins fail.
- **Why it landed:** the assertion's commit (`c0777962`) was already an ancestor of the entry-pressure branch. `ccf1dde8` cites only bot validation, and the merge `63ad2fa7` ("disjoint by file") records no suite run. A "related tests only" pick keyed on `regionT1.ts` would never select a bench spec.
- **Smallest fix:** replace lines 129-130 with `assert.notEqual(dominantFamilies[0], dominantFamilies[1], 'the two contexts must differ')`. That is the stated invariant, and `durability35Matrix.test.ts:41` already asserts it. Correct the 124-127 comment too (node-01 is Ridge-led; node-02 is a Crag/Ridge tie).
- **Process:** run the full suite before merging anything that touches blends or spawns.
- **Verdict:** CONFIRMED (ran the test; repro printed both blends).
- **Provenance:** branch.

---

## Fix before playtest

### P1. `ctx.metadata.empoweredAttack` means two things, and the new readers take the wrong one
- **Area:** 3.
- **New readers** treat the flag as "the mechanic just consumed its charge":
  - `server/src/systems/classes/archetypes/energy/frameLoop.ts:171`
  - the energy `mechanic-fired` emitter, `energyPrototype.ts:73-78`
  - `server/src/systems/combat/keystones/shockwave.ts:42`
  - `server/src/systems/combat/rangeMechanics.ts:204,319` (the stagger and vulnerability gates)
- **But** several T3 paths set the flag only for crit styling, and they register first:
  - Surge Overdrive, `energy/t3/pipeline/normalHit.ts:121`, on every hit while Overdrive runs
  - Blunderbuss pellets, `reload/reloadPrototype.ts:147` and `reload/t3/pipeline/blunderbuss.ts:62`
  - Fan the Flames, `dot/t3/paths/fire.ts:89`
  - the Snipe full-HP shot, `snipeDamage.ts:25`
- **Scenario:** Spark + Surge in Overdrive, 3 ordinary hits with no discharge armed. That gives 3 `mechanic-fired` emissions, and a neighbour takes 1680 chain damage, so every Overdrive hit arcs and fires every mechanic-fired card. Shade/Wisp also stagger, or fold ×1.7. Shockwave fires once per Blunderbuss pellet.
- **Smallest fix:** have `registerEmpoweredMultiplier` set a distinct key (e.g. `mechanicConsumed`) when it actually consumes the charge. Gate frame loops, mechanic-fired emitters, Shockwave and range on that key.
- **Verdict:** CONFIRMED for Surge by repro (`surgeOverdrive`). The other paths were confirmed by reading.
- **Provenance:** branch (the new readers).

### P2. A state-preserving recalc corrupts in-place plating and DR bonuses, and the branch makes every tier-up kill trigger one
- **Area:** 5.
- **Where:** `server/src/ecs/playerEntityFormulas.ts:123`, which restores `cs.resources` wholesale. The new trigger is `server/src/systems/player/progression/rewards.ts:288` (`fbc2cf6c`).
- **Defect:** the recalc runs `resetStationaryDr`/`resetReactivePlating`/`resetBramblePlating` (`playerEntityFormulas.ts:19-21`). These strip the bonus and zero the `*Applied` key. The restore then writes the old `*Applied` values back, so the bookkeeping says the bonus is applied when it is not.
- **Scenario:**
  - `volcanic-vest-t3` with 8 reactive stacks: plating drops 15 → 7, while `reactivePlatingApplied` stays 8. When the stacks fade, plating ends at **−1**.
  - `tundra-vest-t3` stationary DR: 0.243 → 0.140, then **0.037** against a base of 0.140.
  - Lineage `plating-stack` cards share the reactive keys, so a T1 Plate build is exposed on the T1→T2 seal kill, which happens mid-fight with stacks up.
- **Smallest fix:** after the restore, zero the three applied keys through a helper exported by each module, keeping stacks and ramp. The next defense tick then re-applies the bonus onto the rebuilt base.
- **Verdict:** CONFIRMED (two repros through the real recalc and tick functions).
- **Provenance:** develop (stance switch, Perfection gate, core swap, stance craft). The branch adds the tier-up trigger.

### P3. Evolving an equipped armor, charm or boots item makes its whole tree go dark
- **Area:** 2.
- **Where:** `server/src/systems/player/economy/itemEvolution.ts:91` (equipped case) and `:95` (bag case). Neither calls `syncWornFormFromEquipment`/`syncLineagesFromInventory`.
- **Scenario:** wear `forest-vest-t1`, own `bindings-t1-tempo-payoff`, then `evolveItem('forest-vest-t2','evolve')`. The result is `equipment.armor=forest-vest-t2` with `wornForm=forest-vest-t1`. `resolveActiveLineages` requires `equipment === wornForm` (`shared/src/systems/lineages.ts:671`), so cards, capstone and stat row are all off (runtime cards 1 → 0) until a relog or re-equip.
- **Smallest fix:** call the two syncs before the recalc in both branches, as `equipItem`/`craftRecipe` do.
- **Verdict:** CONFIRMED (repro).
- **Provenance:** branch.

### P4. 78 non-weapon T3/T4 cards can never be bought
- **Area:** 1.
- **Where:** `shared/src/systems/lineages.ts:289-292` refuses `card.tier > wornFormTier`. Coverage 5c (`shared/src/data/lineages/coverage.test.ts:573-608`) forces T3 keystone and T4 cross cards onto all 20 lineages. The lineage files lack the forms:
  - **No form above T2** (all 6 T3/T4 cards dead): robe, bindings, hide, wrappings, stone, heartroot, eye, wraps.
  - **T3 form but no T4 form** (T4 cross dead): plate, barrier, treads, wing.
  - **T4 form but no T3 form:** pulse, fleet, marsh (`pulse.ts:33`, `fleet.ts:32`, `marsh.ts:32`). Their T4 gate needs a worn T3 form, so these bands open only by plain-crafting the T4 item (B4).
- **Scenario:**
  - A player wearing `plains-vest-t2` sees the robe's T3 silhouette (`client/src/ui/lineage/LineageTreePanel.tsx:664`), with every card reading "Requires a tier-3 form. Pay the tier-2 gate first.", but no tier-2 gate exists.
  - The test-room bypass runs *after* the tier check, so run 3's playtest step "a T3 keystone in the test room, one per lane per lineage" is impossible on non-weapons.
- **Why green:** `shared/src/data/lineages/reachability.test.ts:52-106` walks forms, never cards.
- **Docs drift:** `docs/lineages-current-state.md:187` ("All twenty lineages author…") and the `reachability.test.ts` header ("Every band has to be finishable").
- **Smallest fix:** a coverage rule that every authored card's tier is ≤ the highest gate-reachable form tier of its lineage. Then either author the missing forms or park those cards (a designer call), and fix the doc.
- **Verdict:** CONFIRMED (scratch walk of the gate graph with an unlimited wallet: weapons 0 dead, non-weapons 78).
- **Provenance:** branch.

### P5. Amplifier and keystone tiles show a number that nothing applies
- **Area:** 1 + 6.
- **Where:** `shared/src/data/lineages/resolve.ts:121-133` resolves a payoff for amplifier and keystone rows. `client/src/ui/lineage/LineageTreePanel.tsx:194,227-228` appends it (`describeCardEffect` at 120-122). But `composeAmplifiers` throws it away (`shared/src/systems/lineages.ts:481`), and keystone rows never fire as payoffs (`lineageCards.ts:170`).
- **Scenario:**
  - `broadsword-t2-kill-chain-amplifier` shows "4.6% for 2.5s". Its real effect is the 7.7% speed window lasting 2.5 s → 4.0 s.
  - `hammer-t2-control-amplifier` shows "2.3% for 2.5s". Its real effect is the slow window going 2.5 s → 4.0 s.
  - `rapier-t2-engagement-amplifier` shows "10.4% for 2.0s". The real per-body window is 17.3%.
  - `rapier-t3-affliction-keystone` (Festering) shows "poison 1.3% for 5.0s", which is never applied.
  - Affected: all 60 amplifiers and the 7 keystones other than Chain and Shockwave. `AbilityNodeRows` already does this right.
- **Smallest fix:** emit no `payoff` for amplifier rows, or for keystone rows without a `KEYSTONE_DEFINITIONS` payoff. Show the axis instead (`nodeAxisBlurb(card.amplifies)`), or the modified card's before → after via `applyAmplifiedAxis` on a clone.
- **Verdict:** CONFIRMED (two independent resolve scripts plus the render path).
- **Provenance:** branch.

### P6. Lineage window tiles and Striker/Squire frame tiles draw as blank dark squares
- **Area:** 6.
- **Where:** `client/src/ui/conceptIcons.ts:212-225`. Ten new `BUFF_IDS` have no PNG under `client/public/assets/concept-icons/statuses/buffs/`: `lineage-damage/-speed/-recovery/-guard/-ward/-plate/-technique/-evasion`, `frame-window`, `frame-charge`.
- **Defect:** `statusIconSource` still returns a path, so `BuffBar.tsx`'s `hasArt` is true and `GameIcon` renders `fallback={null}` over the `#11161d` backdrop. The `rgba(0,0,0,.68)` clock sweep is invisible on near-black.
- **Effect:** design §8's lane-coloured buff clock is unreadable for all nine packets.
- **Smallest fix:** alias the ten ids in `BUFF_ICON_ALIASES` (as the summoner/energy frame tiles already are). Or return null for a no-art set so the tile fills with its tone, and relax `server/test/hudStatusTooltips.test.ts:200` for that set.
- **Verdict:** CONFIRMED (conductor listed the directory: no `lineage*`/`frame*` file; render path read). Seen on screen: unverified.
- **Provenance:** branch.

### P7. The at-bay slow overrides stronger slows and resets their clock
- **Area:** 3.
- **Where:** `server/src/systems/combat/rangeMechanics.ts:186` calls `applyMonsterSlow` (`status/monsterControl.ts:58`) on every at-bay hit. That is a plain `applyStatusEffect`: it keeps the existing record's `data` and overwrites `remainingMs`.
- **Scenario:** a Lancer/Phalanx/Enforcer at-bay hit applies 20%/1200 ms, and Hamstring or a lineage `slow` card applies 40%/3000 ms.
  - The record stays at 20%, with `remainingMs` 3000 against `totalMs` 1200, so the buff clock reads 250%.
  - The next at-bay hit cuts it back to 1200.
  - Repro: `{"pct":0.2,"remainingMs":3000,"totalMs":1200}` → `{"pct":0.2,"remainingMs":1200}`.
- **Smallest fix:** make `applyMonsterSlow` max-wins on `moveSlowPct`/`remainingMs`/`totalMs`, or route it through `applySharedDebuffMaxWins`.
- **Verdict:** CONFIRMED (repro).
- **Provenance:** branch (the at-bay caller).

### P8. A Conduit formation Technique never resolves when its last pending body dies or forfeits
- **Area:** 3.
- **Where:** `onTechniqueResolved` fires only on `formationDelivery.isFinalDelivery` (`server/src/systems/player/abilities/abilityEffects.ts:409`). Two paths empty `pendingEntityIds` and detach the component without resolving:
  - `pruneFormationTechnique` (`server/src/systems/classes/archetypes/summoner/formationTechnique.ts:97-110`)
  - `finishMember(forfeit)` (`server/src/systems/player/abilities/formationCharge.ts:76-84`)
- **Scenario:** a Formation Charge whose first bodies kill the target, so the rest forfeit. That cast gets no `technique-cast` card, no ability node, no Signature and no window spend.
- **Smallest fix:** resolve on the first delivery, or resolve in prune/forfeit when at least one delivery landed.
- **Verdict:** CONFIRMED by reading the call chain (no Conduit test drives it).
- **Provenance:** branch.

### P9. The tutorial's gate beat opens the wrong weapon's tree
- **Area:** 7.
- **Where:**
  - `client/src/tutorial/director.ts:353-368`: `openLineageTree` opens the tree by slot.
  - `client/src/ui/lineage/LineageTreePanel.tsx:645-646` picks the tree from `equipment[slot]`.
  - At `gate:gale-needle` (`shared/src/tutorial/scripts/classScript.ts:556`) every class still wears its seal `bossKit` weapon: the Chaotic Axe for five classes, the Poison Dagger for the Slinger.
- **Scenario:** the guide says "Pay the gate and wear it: the Gale Needle…" while showing the Axe or Dagger tree. The `lineage.form:gale-needle` anchor isn't rendered, so the highlight ring draws nothing. The director sends `lineage:unlockForm {rapier}` itself (`director.ts:399`), so the gate is paid off-screen.
- **Not a soft-lock:** the server reads `progress.wornForm`.
- **Smallest fix:** an `equip ['flash-rapier']` step at the start of the `gate:` beat, or let `openLineageTree` target a lineage id.
- **Verdict:** CONFIRMED by reading the render path; not seen in a live client.
- **Provenance:** branch.

### P10. "I'm done" skips the tutorial farewell
- **Area:** 7.
- **Where:** `client/src/tutorial/TutorialPanel.tsx:309-314`. The button calls `setChoice('done')`, but the farewell renders only when `scriptDone && choice === 'on'`.
- **Scenario:** a Tier-2 player who declines the optional gate never sees `TUTORIAL_FAREWELL`, including its frame / Passive Tree pointer. The adjacent comment says the button exists as "a way to the farewell".
- **Smallest fix:** route "I'm done" through the farewell (a transient `'farewell'` state), then set `'done'` on "Thanks!".
- **Verdict:** CONFIRMED by reading the render branches.
- **Provenance:** branch.

### P11. The Make tab asks for a weapon "+3" that no longer exists
- **Area:** 6.
- **Where:** `client/src/ui/crafting/MakeTab.tsx:396-411`. `canMake`/`evolveNeed` still apply evolve rules to T2 weapon forms; only `MakeDetail` knows weapons are lineage-gated.
- **Scenario:** at biome level 7, `checkRecipeUnlocks` unlocks `knight-steelsword` and the other T2 weapons. The row sits in "short" with "needs Iron Broadsword +3". The weapon +N ladder is gone (the server refunds and drops weapon `itemUpgrades`, and `UpgradeTab` excludes weapons), so the requirement can't be met.
- **Smallest fix:** apply `isWeaponLineageForm` in `canMake`/`evolveNeed` ("from the weapon's tree"), or skip evolved weapon recipes in `gearEntries`.
- **Verdict:** CONFIRMED (script: all five T2 weapon recipes).
- **Provenance:** branch.

### P12. The tree disables owned cards after a form change moves the door biome
- **Area:** 6.
- **Where:** `client/src/ui/lineage/LineageTreePanel.tsx:196-199,215,234`. The client's `masteryLocked` disables **owned** cards. The server's `checkSetActive` has no mastery gate ("owned is forever, active is a choice"), so this is a duplicated rule that has drifted.
- **Scenario:** wear `desert-sunsteel-cross` and buy T2 payoffs at Desert 3, then pay `knight-steelsword`'s gate (Plains 6) and wear it. Every owned, inactive T2 payoff now reads "owned" but is disabled with "Requires Plains level 9", even though the server would accept the swap.
- **Reach:** T2 only, with two same-tier forms.
- **Smallest fix:** apply `masteryLocked` only when `!owned`.
- **Verdict:** CONFIRMED (script).
- **Provenance:** branch.

### P13. Arriving at a T2–T4 node promises node-modifier effects that were removed
- **Area:** 6.
- **Where:** `client/src/hud/AreaInformation.tsx:14-20,119-121` (`MODIFIER_COPY`: "Monsters move and attack faster", "More monsters inhabit this area", …). Phase 2b removed those effects (`server/src/systems/world/spawning/index.ts:209`, `server/src/world/World.ts:672`), and shared `MODIFIER_SUMMARIES` is already identity-only.
- **Scenario:** 113 T2–T4 nodes still carry `modifier`, so the discovery or first-arrival banner states a false mechanic.
- **Smallest fix:** use `MODIFIER_SUMMARIES`, or show the dominant family and its shard.
- **Verdict:** CONFIRMED.
- **Provenance:** branch (the removal left the copy behind).

### P14. Slip help says "dodge outright", but the window only grazes
- **Area:** 6.
- **Where:** `client/src/hud/statusHelp.ts:176` and `PAYOFF_BLURB` at `shared/src/data/abilityNodes/index.ts:106`. At runtime (`server/src/systems/defense/mitigation/evasion.ts:66-77`) a window-only evade uses `EVADE_MITIGATION_BASE` 0.5, a half hit that still applies the monster's ailments. The comment at `evasion.ts:66-69` also says "full-dodge-or-nothing".
- **Scenario:** the player reads "dodge outright", then takes half-hits and stays poisoned.
- **Smallest fix:** say "a chance to graze (halve) the hit" until run 4's open decision 2 is made. The text is wrong today whichever way that goes.
- **Verdict:** CONFIRMED.
- **Provenance:** branch.

### P15. The buff tile's "Healing" HP/s uses its own rounding
- **Area:** 5.
- **Where:** `server/src/systems/defense/core/buffs.ts:79` (`` `${Math.round(perSec)} HP/s` ``). This is a third HP/s display that misses `formatRecoveryRate`. `9c8a1411` claims a single source.
- **Scenario:** a naked T1 Squire at 10% active Recovery heals 0.65 HP/s, and the tile reads "1 HP/s" while the stat panel reads 6.5. Anything under 0.5 reads "0 HP/s".
- **Smallest fix:** `` `${formatRecoveryRate(perSec)} HP/s` ``.
- **Verdict:** CONFIRMED.
- **Provenance:** develop (missed by the branch's single-source fix).

### P16. Pack followers from another family flip the body mix and shard yield away from what the panel shows (T2–T4 only)
- **Area:** 4.
- **Where:** `shared/src/world/nodeBlends.ts:79-84` (the cycle and panel count spawn picks, not bodies) and `shared/src/data/families/index.ts:109`. `prairie-yearling` is filed under Herd but spawns only as 3 followers of Swarm's `prairie-wolf` (`shared/src/data/monsters/plains.monsters.ts:163`).
- **Scenario:** `node-t2-plains-02` shows "Swarm 70% → Technique", but its bodies are Herd 71% / Swarm 23% / Sky 6%, so most shards are Empowered. The same flip happens on 16 nodes:
  - T2 desert-01/03/05 (dust-djinn)
  - T3 desert-01/04/05 and T4 desert-01/02/04/05 (sandweaver, sandspitter-cobra)
  - T3/T4 volcanic-02/06 (ember-scuttler, ember-skink)
  - T4 graveyard-03 (bone-crawler)
- **Not a T1 issue.**
- **Smallest fix:** a designer call. Moving the yearling to Swarm alone only shifts the flip, and most followers serve two alphas. The code options are:
  - weight `blendSpawnCycle` by expected bodies per pick, or
  - pay a follower kill in its alpha's family shard.
- **Verdict:** CONFIRMED (enumeration, 60 picks per node; conductor read the families and pack data).
- **Provenance:** branch.
- **Severity:** fix before playtest only if the playtest reaches T2; otherwise later.

### P17. The T1 rule "mixed blends on the first two arrivals" is false for Swamp
- **Area:** 4.
- **Where:** `shared/src/world/map/regionT1.ts:27-30`.
- **Scenario:**
  - Swamp's first arrival is `node-t1-swamp-03`, which is `{stalker .7, mire .2, coven .1}`. Arrival order is 03 > 04 [45/45] > 05 [34/33/33] > 01 > 02.
  - The tutorial enters the Swamp (`classScript.ts:82`), so the first Swamp node a new player meets is pure Stalker.
  - Separately, `tutorialNodeFor` breaks hop ties alphabetically while the bot uses N > S > E > W, so Forest's second arrival differs between them (03 vs 05). The comment cites both.
- **Smallest fix:** scope the comment to Plains/Forest/Mountain. If the rule should hold, the designer reorders `SWAMP_BLENDS`.
- **Verdict:** CONFIRMED (BFS simulation over `worldNodeExits`).
- **Provenance:** branch.

### P18. Programmer text "yellow essence" in the tree
- **Area:** 6.
- **Where:** `client/src/ui/lineage/LineageTreePanel.tsx:531` renders `{essenceType} essence`. Every other surface, including the cost chips beside it, uses `ESSENCE_LABELS` ("Might").
- **Smallest fix:** `ESSENCE_LABELS[essenceType]`.
- **Verdict:** CONFIRMED.
- **Provenance:** branch.

---

## Later

### Code
- **L1** (1) — `shared/src/systems/lineages.ts:536-550`: trigger-axis amplifiers fire the target payoff at the target trigger's per-pull normalisation.
  - This contradicts the docblock at `:467` ("the strength of the move is `ROW_SCALAR.amplifier`") and `lineages-current-state.md` §12.
  - Per-pull ratios: duration/magnitude ×1.60, targets ×2.00, trigger ×1.17–×5.00.
    - ×5: `marsh-t2-bulwark`, `fleet-t2-empowered`, `wraps-/treads-/wing-t2-engagement`.
    - ×4: stun amplifiers.
    - ×3: `rapier-t2-engagement`.
  - Numbers are the designer's, but the formula contradicts its own comment. CONFIRMED (sweep of all 60).
- **L2** (1) — `shared/src/systems/lineages.ts:177-180`: a collapsed band's door is the *first* owned form of that tier in authored order. So owning an extra door can re-gate the band onto an unlevelled biome: Rapier with stinger + gale-needle, wearing venomthorn, gets "Requires forest level 8". Swapping forms is a free workaround. Fix: OR across doors. CONFIRMED.
- **L3** (1) — `shared/src/data/lineages/resolve.ts:148-151`: `resolveLineageCapstone` passes no `cardFace`, so defensive capstones never pay §3.1's off-face 80% (`plate-capstone-crusader` 0.043 on- and off-face). Fix: `cardFace: packetDefaultFace(capstone.lane)` for non-weapons. CONFIRMED.
- **L4** (1) — `server/src/systems/combat/lineageCards.ts:1115-1128` (`WINDOW_LANE`) colours tiles by payoff kind, and two mappings are wrong. Fix: carry a packet index in the status `data`, or at least map `recovery-window` → `kill-chain`. CONFIRMED (census).
  - `recovery-window` → `engagement`, but 0 of its 33 payers are Engagement (32 Kill-chain, 1 Technique capstone), so "Mend" is drawn in salmon.
  - `damage-window` → `empowered`, but 13 of its 14 payers are Engagement.
- **L5** (1) — `shared/src/data/lineages/coverage.test.ts:50-55`: `PAYOFF_IS_TIMED` omits `plating-stack`, which is timed at 4000 ms (`lineageCards.ts:341-350`). Separately, `contagion`'s `durationMs: 4000` is never read (`lineageCards.ts:558-574`), yet the tile prints "for 4.0s". Fix: derive timedness from `PAYOFF_UNIT`. CONFIRMED.
- **L6** (1) — `server/test/lineageAuthoring.test.ts:59-65`: the no-literals scan misses three shapes. The type has no numeric field, so this is belt-and-braces. Fix: tokenise with the TS scanner. CONFIRMED (probe).
  - `magnitude: .5`.
  - A literal following a double-quoted string that contains an apostrophe. The pattern exists at `broadsword.ts:179,196` and `eye.ts:44`.
  - Lines starting with `/* */`.
- **L7** (2) — `shared/src/systems/lineages.ts:214-221`: the switch discount works in both directions. One half-price row on lineage B also halves lanes 2–3 of that row on lineage A (Rapier T1 affliction payoff `{green:90, affliction:8}` → `{45, 4}`). There is no refund loop and no stacking. A designer call: discount only while the buying lineage owns nothing in that tier/row, or write the two-way reading into §2. CONFIRMED.
- **L8** (2) — `server/src/admin/gameActions.ts:131-133`: admin "reset progress" keeps `tracksProgression.abilityNodes`. Fix: clear it. CONFIRMED by reading.
- **L9** (2 + 5) — `server/src/systems/player/progression/rewards.ts:288` with the party loop at `:350-360`: a tier-up on a dead recipient recalcs the corpse to hp 1/130 with `isDead` set (clamp at `playerEntityFormulas.ts:139`). This violates `server/src/ecs/markerInvariants.ts:221-223`; respawn refills anyway. Fix: skip the recalc for `isDead`. CONFIRMED (repro). branch.
- **L10** (3) — `server/src/systems/classes/shared/frameLoop.ts:209-217`: the Bulwark frame's plating shred writes a total into a record read as stacks × per-stack. With a party Striker's 3-stack brand on the target it strips 90, not 30. The W1-E card fix (`lineageCards.ts:449-460`) was never applied here. CONFIRMED (repro).
- **L11** (3) — `server/src/systems/classes/archetypes/cadence/t3/ticks/hemorrhage.ts:33`: `continue` runs before the detach at `:68`, so `hasHemorrhage` sticks after an intensity-mode `lineage.poison` expires. The invariant only runs at boot, and the monster stays in `hemorrhagedMonsters` forever. Fix: detach before `continue`. CONFIRMED (repro).
- **L12** (3) — `server/src/systems/classes/archetypes/dot/dotPrototype.ts:162-170`: when a spread (`rangeMechanics.ts:259`) or Sweep (`abilityEffects.ts:442`) fills a secondary target, `mechanic-fired` is emitted with `ctx` undefined. That breaks "one per hit" (`mechanicFired.ts:31-36`) and lands the payoff on the primary. Fix: pass the exchange `ctx` or the filled body. CONFIRMED by reading.
- **L13** (3) — `server/src/systems/classes/archetypes/reload/frameLoop.ts:97-99`: `clearRamp` restores the pre-recalc `clipBaseAttackCooldownMs` after a mid-clip weapon or rune swap. Fix: drop the captured base on recalc. CONFIRMED by reading.
- **L14** (3) — frame banks (`frame.<root>.charge`, `frame.energy.overcharge`, `frame.summoner.link-charge`) live in `TracksCombat`, against CLAUDE.md's archetype-slice rule. Documented in the frames doc and working today.
- **L15** (3) — `server/src/systems/combat/rangeMechanics.ts:297-310` has no `chaoticMiss` check (unlike `cadence/frameLoop.ts:125`), so a chaotic miss may spend Phantom-Blade's single opener. PLAUSIBLE: confirm with a Striker weapon that sets `chaoticMiss`.
- **L16** (4) — later-tier blends that don't resolve as named are more numerous than the known item says. Nothing crashes, and the panel lists absent families. Fix: correct `docs/variants-current-state.md` §3 and the run-report count. The pool bodies to add are the designer's call. CONFIRMED (enumeration of `nodeSpawnBlend(...).unavailable`).
  - **T2: 11 of 37**, not 9. All 6 Swamp nodes lack swamp-mire and all 5 Jungle nodes lack jungle-stalker; desert-stalker is in no T2 blend.
  - **T3: 16 of 38** (jungle-undergrowth ×5, desert-scorpion ×5, swamp-stalker ×6).
  - **T4: 5 of 38** (mountain-ridge ×5, so T4 Mountain never fields Ridge or drops Control).
  - The authored *dominant* family is absent on t2-swamp-01, t2-jungle-03, t3-jungle-02, t3-desert-02, t3-swamp-03 and t4-mountain-02.
- **L17** (4) — `shared/src/world/map/validation.ts:177,181-183` and `authoring.ts:437-440` accept zero and NaN shares: only `< 0` is rejected, and `Math.abs(NaN-1) > 1e-6` is false. No current data is affected. Fix: `!(share > 0)` and `!(Math.abs(total-1) <= 1e-6)`. CONFIRMED by reading.
- **L18** (5) — `server/src/systems/classes/archetypes/summoner/summonerPrototype.ts:175-188`: minion out-of-combat regen ignores hazard suppression, while the player's is zeroed by `isPlayerInHazardousNodeFeature` (`server/src/systems/defense/index.ts:94`). That contradicts "same clock" (`spawn.ts:47`, recovery doc §3). CONFIRMED by reading. develop (the comment is from the branch).
- **L19** (5) — `server/src/systems/world/testRoomInteract.ts:51` bumps `playerTier` with no recalc and no `markSliceDirty`. Dev only. develop.
- **L20** (5, tests) — `server/test/tierUpRecalc.test.ts` starts at full HP, so "heal to full" would also pass, and it pins no combat-state preservation (which is where P2 lives). `server/test/minionOocRegen.test.ts` tests only the pure `minionRecoveryFor`. branch.
- **L21** (6) — refusal reasons show raw ids. They surface in tile tooltips and failure toasts. Fix: `packetDefinition(p).name` and the biome display name. CONFIRMED.
  - "Not enough kill-chain shards", "Requires desert level 6", "graveyard cannot reach…".
  - Sources: `shared/src/systems/lineages.ts:246,311,380,382` and `shared/src/systems/abilityNodes.ts:105`.
- **L22** (6) — `client/src/hud/BuffBar.tsx:66-94,129-134`: `lineageBuffLaneColor` is dead code. It checks a `lineage.` prefix, but the ids are `lineage-damage` and so on. Its `LANE_BUFF_COLOR` lists 6 lanes in colours that contradict `packets.ts`, and every buff tile subscribes to two atoms for nothing. The visible colour comes from the server's `windowColor`. Fix: delete it. CONFIRMED.
- **L23** (6) — `client/src/ui/economyIcons.ts:27`: `shardIconSource` uses the first letter of the packet name, so Tempo and Technique are both "T" (E/E and B/B collide too). Fix: reuse `ShardIcon`'s `SHARD_ABBREVIATIONS` (`TQ`). CONFIRMED.
- **L24** (6) — `client/src/net/socket.ts:143`: the teardown removes `lineage:result` but not `ability:nodeResult`. No practical impact (new socket each time). CONFIRMED.
- **L25** (6) — no client file reads monster `dotResistance` (four monsters carry it), so `client/src/ui/map/monsterInfo.ts` never shows it. `NodeInfo.tsx:494`'s `!blend && modifier` branch is dead now that all 138 normal nodes have a blend. CONFIRMED.
- **L26** (7) — the stall for an unfarmable shard can never fire. `bot/src/route/executor.ts:2415` passes `missingToReasons(missing())`, which turns `shard.<packet>` into `{kind:"prerequisite"}` (`bot/src/route/conditions.ts:393-414,523`), so `unsatisfiableByFarming` never sees a shard key. A route whose `farmAt` can't pay its lane farms until the 30-minute timeout. CONFIRMED (round-trip repro).
  - Latent: four lane references can't be paid at their home biome, but only `rapier-tempo` is live.
  - `farmBlockedStall.test.ts:97-110` calls the helper directly.
  - Fix: add a `shard` reason kind.
- **L27** (7) — `bot/src/routes/gateCapstoneRepeat.test.ts` never runs `doAttemptBoss`, so reverting the `1503e5e4` fix (`executor.ts:1790-1807, 2121`) still passes. The fix itself is correct. CONFIRMED by reading.
- **L28** (7) — `bot/src/route/executor.ts:2124` sets `this.partial = true` even when `step.repeat`, so a gate run that recovers after one bad round reports `completion: "partial"` (`botRun.ts:883`). This under-reports. Fix: guard with `!step.repeat`. CONFIRMED by reading.
- **L29** (7) — the bot checks a card's unlock level in the home biome, not the door biome. `bot/src/route/executor.ts:1449-1451` and `bot/src/tierEntry/validate.ts:300-303` use `resolveLineageCard` + `homeBiome`, while the server uses `resolveLineageCardFor` (door biome). Latent: no current T2 lane reference is off-home. CONFIRMED.
- **L30** (7) — the `lineage:result` / `ability:nodeResult` payload shapes are written out separately instead of imported. Fix: export named payload types from `shared/src/protocol` and import them. CONFIRMED.
  - Copies: `shared/src/protocol/socketEvents.ts:156` (inline), `server/src/systems/player/economy/lineages.ts:38`, `abilityNodes.ts:33`, `client/src/net/socket.ts:56-67` and `bot/src/net/intents.ts:26`.
  - Server and client are structurally checked by the typed sockets. The bot's copy is not (`BotConnection.request<T>` types the matcher as `any`, `bot/src/net/connection.ts:240`).

### Docs and comments that say something the code does not do
All CONFIRMED against the code.

- **`docs/lineages-current-state.md`:**
  - `:22`: "eight lanes, six weapon-eligible". It is now nine and seven.
  - `:350-353`: the trigger/payoff list lacks `technique-cast`, `technique-refund`, `technique-window` and `evasion-window`.
  - `:187`: see P4.
  - `:407-410`: says a GM shortfall "farms silently forever", but `b88779fb` fixed that (the shard case is L26).
- **`docs/frames-current-state.md`:**
  - `:140-142,202` (§3/§5): "no client renderer reads `frame-charge`". `client/src/fx/frameChargeGlow.ts` and `render/combatFx.ts` draw it.
  - §3: "`resolveFrameWindowMs` caps every window". Splinter (`summoner/frameLoop.ts:97`) and Wraith (`energy/frameLoop.ts:73`) are unclamped.
  - §4: "every range now has a mechanic". Wisp does nothing for Wraith or Phantasm.
- **`docs/recovery-current-state.md`** (all develop):
  - `:63`: says `guard.recovery-on-fire-pct` comes from "the forest charm", but nothing authors that key.
  - `:137`: "Second Wind alone". Recuperate (`shared/src/abilities.ts:1006-1011`) is also `recovery`-tagged.
  - `:148` (§6): omits the Blood Offering rite (`server/src/systems/player/rites/riteOoc.ts:18,128-132`, 5% max HP per kill), a pool-scaling heal stream that §15 argues against. The designer should confirm or convert it.
- **`docs/variants-current-state.md` §3:** see L16.
- **Comments that are now false:**
  - `shared/src/world/map/regionT1.ts:32-37`: "KNOWN GAP: T1 pools field only one or two of each family". All 25 T1 blends now resolve exactly.
  - "T3–T4 / T2–T4 have no blends":
    - `shared/src/world/nodeBlends.ts:91-93`
    - `server/src/systems/world/spawning/index.ts:350-351`
    - `shared/src/world/map/authoring.ts:540-542`
    - `shared/src/world/map/validation.ts:191-193`
    - `client/src/ui/map/NodeInfo.tsx:447-450`
  - `shared/src/world/map/types.ts:33-38`: the `@deprecated` note says catalysts, stat scaling and reward multipliers read `modifier`. All three were removed.
  - Stale family-scope notes: `shared/src/data/families/index.ts:9-13` ("Phase 1b scope") and `:419` ("undefined outside the T1 biomes"), and `server/src/systems/player/progression/rewards.ts:59-62` ("outside the five T1-biome families drops no shard").
  - `shared/src/data/monsters/plains.monsters.ts:78-79`: "3 is the highest plating any T1 body carries", but forest-slime carries 4 (`forest.monsters.ts:50`).
  - `shared/src/data/recipes/mountain.recipes.ts:348`: comment says "recover 30%", value at `:350` is `0.2`. (develop)
  - `server/src/systems/defense/core/buffs.ts:59`: "out of combat everyone is at a flat 100%". Out of combat is now a fixed 10% max HP/s. (develop)
  - `client/src/ui/describe/statEffectText.ts:86`: "a Recovery point is 1% of max HP per second", the old model. (develop)
  - `server/src/systems/classes/archetypes/summoner/frameLoop.ts:19-20`: says Consort has "NO LOOP". It has one ("the line holds").
  - `server/tsconfig.test.json`:
    - `:12` says null-safety and implicit `any` are off, but it inherits `strict: true`.
    - `:18` says "38 tests" import client source, but there are 39 entries, and `conduitPlayerBodies.test.ts` imports none.
  - `coverage.test.ts:78,84` failure text still says "first six packets" and the header says "eight packets".
- **Data, admin display only:** `shared/src/data/balanceProgression.ts`: the Forest/Swamp/Cave T1 rosters lack bramble-pod, fen-hexer and brood-spiderling, although the t1-third-mobs brief says the rosters were updated.

---

## Questions from the brief, answered clean

- **Area 1, lineage data:**
  - Every lineage has exactly 3 distinct lanes; weapons draw only from the 7 `WEAPON_PACKET_IDS` (`coverage.test.ts:78,84`).
  - Cards carry no number except `tier`; every value comes from `magnitudes.ts`, and the source scan catches ordinary literals (L6 aside).
  - §21 band gating is implemented as specified (`lineages.ts:170-182`, debut offset at `resolve.ts:56-58`; L2 aside).
  - The GM ceilings 30/72/114/156 cover every row.
  - Weapon T3/T4 bands are reachable (0 dead cards, `reachability.test.ts` 72 doors).
  - Every array/Map matches its union (`PAYOFF_UNIT` 18/18, the 9-packet tables 9/9, `TRIGGER_FIRES_PER_PULL` 11/11). A 10th packet fails coverage. The arrays are not exhaustive at compile time.
  - No card explodes through the wrong tier-scalar column: max payoff is 1.59× its unit.
  - Each amplifier moves only its own axis (`lineageAmplifiers.test.ts` 60/60).
- **Area 2, runtime and economy:**
  - Intents carry only ids and a row; price, discount, door, mastery, shards, capstones and slot are all derived on the server. Duplicates are refused, a filled row is never overwritten, and the handlers are synchronous.
  - Gates are never discounted, and there is no refund path.
  - `sanitizeShardWallet` (`playerRepo.ts:498`) keeps `PACKET_IDS` keys with finite values ≥ 0. No balance can go negative.
  - A card pays only while its form is worn (`lineages.ts:671`, with the recalc on the same tick).
  - Keystones register only via `initCombatSystems` → `registerLineageCards` → `registerKeystones`, with a guard.
  - Dirty marking goes through `mutateSlice`/`markSliceDirty`.
  - Persistence: lineages ride in `holdsInventory`, and shards/capstones/ability nodes in `tracksProgression`. Both are stringified before the await, and runtime caches are not persisted.
  - Migration `0009` is idempotent and its journal entry is consistent. The refund table matches develop for all 32 weapons, and the refund is idempotent.
  - No recalc double-applies.
- **Area 3, combat:**
  - Every frame loop matches `docs/frames-current-state.md` and §10.
  - Range Mid is a slow only; Far payoffs are gated on the outer band.
  - Technique resolves once per cast for every shape, with the cooldown started first; Signature uses the latch.
  - The evasion window uses its own accumulator, and `evadeBlocksDebuffs` stays full-dodge-only.
  - The Consort line is guarded, breaks on death, and has no networked flag.
  - Every new damage multiplier records `empoweredMultiplier`.
  - New DoTs and procs go through `mitigatePlayerTickOnMonster`.
  - **Every** new on-hit applier early-returns on `evadeBlocksDebuffs`:
    - frame loops: `cadence/frameLoop.ts:106`, `cooldown/frameLoop.ts:79`, `dot/frameLoop.ts:140`, `energy/frameLoop.ts:193`, `summoner/frameLoop.ts:232`
    - `rangeMechanics.ts:376`
    - `lineageCards.ts:264`
    - keystones: `ladder.ts:64`, `festering.ts:68`, `shockwave.ts:46`
    - `cadence/t3/empoweredHit.ts:100,132`
    - `abilityEffects.ts:556,575,589`
    - the chain keystone ends on a per-link dodge (`chain.ts:79`)
  - `frame-charge` is pushed only on change.
  - Status `data` is numbers only, and slow/root/chill store `totalMs`.
- **Area 4, families:**
  - All 138 blends sum to 1, with no zero or negative shares and no foreign families.
  - Node count equals blend length for every region (`buildRegionNodes` throws on a mismatch).
  - Every packet has ≥ 2 T1 sources counting the boss stopgap:

    | Packet | Sources |
    |---|---|
    | tempo | 4 |
    | empowered | 5 |
    | affliction | 4 |
    | control | 3 |
    | kill-chain | 3 |
    | engagement | 4 |
    | bulwark | 3 (stopgap only) |
    | barrier-tempo | 2 (stopgap only) |
    | technique | 2 (both Plains) |

  - The five third-family mobs have frame maps, an atlas frame, shadows, a corpse, a manifest entry and a bestiary entry.
  - The boss rows match their comments and the boss-pass report.
  - Max evasion is 0.25; `dotResistance` is within [0,1).
  - Spawning renormalises when a family is missing; cycles are 10 slots, and no share rounds to 0.
- **Area 5, Recovery:**
  - Every regen source is flat HP/s except two deliberate %-of-max paths: player out-of-combat healing and minion out-of-combat healing. One-shots are the barrier-break heal and Blood Offering.
  - Out-of-combat healing is a fixed 10%/s, exclusive with in-combat Recovery, after a 4 s delay.
  - A tier-up rebuilds on the causing kill (P2 and L9 aside).
  - The pool factor is applied once, idempotently.
  - Minion downtime is `maxHp × OOC_RECOVERY_PCT`.
  - `core.recovery-mult` is applied once at a tenth.
  - The heal-log carry is correct: server-only, post-cap, reset on death.
  - The stat panel uses `formatRecoveryRate` (P15 aside).
- **Area 6, client:**
  - The client decides nothing: payloads are ids only, and displays use the shared `check*` functions (P12 aside).
  - The six new intents go hudBus → intents → hudEvents → `net/intents.ts`.
  - Atoms are synced and reset.
  - New fx use `DEPTH.FX`; the frame glow sits at y-sort + 0.4.
  - Fx are gated for background tabs (`shouldRunClientFx`, `!isClientRenderPaused`, eased chase) and cleaned up on destroy and death.
  - Technique is present in every 9-packet table (P6 and L23 aside).
  - Catalysts are fully removed from the client.
- **Area 7, tutorial, bot, protocol, tests:**
  - All 6 client→server and 2 server→client events are declared in shared first (L30 aside).
  - No test needs Postgres or Redis.
  - The capstone-loop fix `1503e5e4` is correct.
  - `doAttemptBoss` requires kill evidence and is bounded (4 × 5, then a named `StallError`).
  - `_bossLineageHarness.ts` (imported by 9 tests) is side-effect free, and no test imports `scripts/_t1*`.
  - Every new `.ts` file is in some tsconfig (`frameChargeGlow.test.ts` excluded honestly).
  - The runner finds 288 + 38 + 35 = 361 tests.
  - The tutorial has no soft-lock, and `tutorial.test.ts` matches the scripts.
  - The boss-lab jitter is seeded and correct.

## Unverified

- **B2 bench contamination:** whether run 4's W2-B runs and the T1-boss-pass canonical sweep fought with cards off after a death. Instrumenting `getLineageRuntime` at boss engage in one bot run would show it.
- **B3 economy inflation:** how often a lethal echo or Effigy slam happened in measured farm runs. Counting duplicate `player-kill` events per monster id in a run's event log would show it.
- **P6 on screen:** a live client hovering a "Form" or "Flurry" tile.
- **P9 on screen:** the Playwright guest profile on a character just past the seals.
- **Mobile tutorial:** `openLineageTree` points at `equipmentSlot` while the Inventory dialog opens on "Bag". Cosmetic; needs a mobile client.
- **Lower form, higher band:** while a T1 form is worn, owned and active T2+ cards of the same lineage still pay (`resolveLineageCards` has no tier check). The design is silent on whether that is intended.
- **Ladder keystone + Mid at-bay slow:** slow → root → stun lands on every at-bay target within 3 hits (`ladder.ts:92`). Does that break "range stays a leaf" (§11)? Design call.
- **Technique window with Conduits:** it scales only the final body's direct hit, and cast-shape users never consume it (`lineageCards.ts:659`). Design call.
- **Breaker bank after Rampage:** a bank above the lowered cap is spent whole (`cadence/frameLoop.ts:90-95`). A Rampage test would confirm.
- **Pool raise reach:** the pool factor also scales barrier capacity and recharge, the barrier-break heal basis, and Conduit minion HP and reconstruction cost (`spawn.ts:104`). §15/§20 don't say whether that is intended.
- **No out-of-combat regen while walking to a target:** `isPlayerInCombat` is true while any attack target is held, including the approach under auto-combat. develop.
- **Cross cards:** `PACKET_BUDGET` and face are taken from `card.lane`, not `borrowsLane`. Harmless while every budget is 1.
- **Ability-node resolution** (`shared/src/data/abilityNodes/resolve.ts`): its tier column and face handling were not checked.
- **Spawn cursor on a failed placement:** composition drift when placement fails (the cursor still advances). Needs a world run on a saturated T1 Mountain node.
- **Desert/Volcanic shared followers:** whether the designer means them to change what a node pays (P16).
- **Bramble Pod "never chases":** the bestiary text says so, but its `ranged` behaviour has speed 30 and closes from 230 to 160.
- **Hitboxes for the five new sprites:** server hitbox baking was not run.
- **`conduitPlayerBodies.test.ts`:** why it is excluded from `tsconfig.test.json`. Likely `import.meta.dirname` under CommonJS (TS1343).
- **Own player missing from a snapshot:** if `obs.self` is null at a repeat attempt's start, `capstonesBefore` reads 0 and a held capstone counts as a kill.
- **Gate-chapter loadout:** the gate chapter fights the Forest boss in the Mountain-seal loadout (no Forest boss-prep beat). Design question.
- **Make-tab and honest-UI reach:** whether the Make tab actually lists every re-homed T2+ door (area 2 says `makeEntries.ts` does, B4), and whether the honest UI ever sends a lineage action for an unheld lineage (if so, B1 also hits players with no intent).

---

## Appendix — PROVISIONAL / PLACEHOLDER / stopgap markers added in shipped code

Lines added on the branch (`git diff -U0 develop...HEAD`, case-insensitive `provisional|placeholder|stopgap`, plus `TODO|FIXME|XXX|HACK`, which found none) under `shared/src`, `server/src`, `client/src`, `admin/src`, `bot/src`, `server/bench` and `server/scripts`. That is 145 lines. `shared/src/data/abilityNodes/types.ts:29` is a false positive ("not a placeholder"); the two `*.test.ts` rows are tests. Every marker is a designer-owned balance or data placeholder, and none contradicts its code (except as noted in L16 and the docs list).

- `bot/src/route/executor.ts` — 1: 2730
- `server/bench/poolRaise.ts` — 1: 55
- `server/src/systems/player/progression/rewards.ts` — 3: 23, 33, 99
- `shared/src/biomeDatabase.ts` — 3: 76, 102, 124
- `shared/src/config/gameConfig.ts` — 1: 59
- `shared/src/data/abilityNodes/types.ts` — 1: 29 (false positive)
- `shared/src/data/families/index.ts` — 9: 39, 83, 85, 87, 89, 266, 292, 325, 361
- `shared/src/data/lineages/barrier.ts` — 1: 4
- `shared/src/data/lineages/bindings.ts` — 1: 5
- `shared/src/data/lineages/broadsword.ts` — 1: 8
- `shared/src/data/lineages/coverage.test.ts` — 2: 269, 652 (test)
- `shared/src/data/lineages/eye.ts` — 1: 5
- `shared/src/data/lineages/fleet.ts` — 1: 4
- `shared/src/data/lineages/heartroot.ts` — 1: 5
- `shared/src/data/lineages/hide.ts` — 1: 4
- `shared/src/data/lineages/index.ts` — 3: 5, 107, 113
- `shared/src/data/lineages/magnitudes.ts` — 4: 18, 89, 146, 258
- `shared/src/data/lineages/marsh.ts` — 1: 4
- `shared/src/data/lineages/packets.ts` — 2: 37, 142
- `shared/src/data/lineages/plate.ts` — 1: 4
- `shared/src/data/lineages/pulse.ts` — 1: 4
- `shared/src/data/lineages/robe.ts` — 1: 4
- `shared/src/data/lineages/stone.ts` — 1: 5
- `shared/src/data/lineages/treads.ts` — 1: 4
- `shared/src/data/lineages/wing.ts` — 1: 4
- `shared/src/data/lineages/wrappings.ts` — 1: 5
- `shared/src/data/lineages/wraps.ts` — 1: 4
- `shared/src/data/monsters/cave.monsters.ts` — 4: 22, 62, 100, 102
- `shared/src/data/monsters/desert.monsters.ts` — 2: 22, 120
- `shared/src/data/monsters/forest.monsters.ts` — 7: 22, 42, 46, 59, 66, 82, 99
- `shared/src/data/monsters/jungle.monsters.ts` — 3: 30, 100, 141
- `shared/src/data/monsters/mountain.monsters.ts` — 7: 22, 58, 65, 95, 122, 124, 128
- `shared/src/data/monsters/plains.monsters.ts` — 13: 22, 40, 46, 57, 62, 76, 84, 93, 107, 109, 113, 125, 171
- `shared/src/data/monsters/swamp.monsters.ts` — 4: 22, 51, 99, 101
- `shared/src/data/skillTree/rootsAndFrames.ts` — 1: 441
- `shared/src/data/skillTree/t3CombatA.ts` — 27: 16, 27, 41, 53, 62, 71, 83, 101, 110, 124, 137, 149, 161, 170, 183, 202, 213, 224, 236, 245, 261, 283, 292, 308, 324, 338, 352
- `shared/src/data/skillTree/t3CombatB.ts` — 18: 14, 32, 45, 69, 89, 102, 118, 133, 149, 168, 182, 197, 215, 230, 243, 260, 276, 302
- `shared/src/data/skillTree/t3PacketTags.test.ts` — 1: 5 (test)
- `shared/src/data/skillTree/t3Summoner.ts` — 9: 13, 21, 29, 38, 46, 54, 63, 71, 79
- `shared/src/data/skillTree/types.ts` — 1: 107
- `shared/src/world/map/regionT3.ts` — 1: 6
- `shared/src/world/map/regionT4.ts` — 1: 6

What the markers cover:

- the 54 T3 path `packet` tags (t3CombatA/B, t3Summoner);
- the 15 defensive lineages (design §17 unapproved);
- the magnitude table and `PACKET_BUDGET`;
- the T3/T4 families and blends;
- the monster-pass rows and the T1 entry-pressure cuts;
- the shard-sourcing stopgap (§18.6);
- the pool factors (`gameConfig.ts:59`);
- the frame-loop numbers (`rootsAndFrames.ts:441`).
