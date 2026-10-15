# C-conduit: the Conduit's Tier 1 track (Phase 1, last class before Spirit and Apprentice)

**Owner:** the conductor for CD.1–CD.5; delegates for CD.6–CD.8 (briefs written when CD.2 lands).
**Spec:** bible §7 (Locked); the kit `shared/src/classKits/conduit/kit.ts`; the Formation config
`shared/src/classKits/configs/conduit.ts` (`FormationConfig`: `roster` + `orders`). The old
[slice plan](../conduit-t1-slice-plan-2026-10-13.md) is superseded as a strategy (no strangler:
the other five classes are already class-first), but its §2 stays the code map and its §5 the
measurements. Moments it reads: all implemented (F6, S2). Monster debuffs on summons: S1 done.

## What exists and what it becomes

| Today (`server/src/systems/classes/archetypes/summoner/`, `shared/src/systems/summonerProfile.ts`, `shared/src/data/summoner*`) | Becomes |
|---|---|
| `resolveSummonerProfile` builds the formation from a **frame** (`selectedSubVariant`), a **range** (`selectedRange`), a **specialization** and the **relic profile**: equal "normal" slots, one weight per slot | The formation is the **roster** in the class config: one slot per roster entry (`<pieceId>#<n>`), role and row from the piece, Command the budget. Frames, ranges, specializations and the relic profile stop being inputs (deleted in CD.8; inert from CD.1) |
| `reconcileMinionSlots` reads `profile.slots` | Reads the roster slots; unchanged otherwise (reconstruction queue, HP-cost rebuild, 20% floor all kept) |
| One body type per owner (`resolveMinionType(owner, index)` from the range/frame) | Each slot wears its piece's `body`; stats from the piece's `mode`, `row`, `command` and `params` |
| `player:commandSummons` focus/move, the rune-driven taunt, the default damage sponge | Focus/move removed (Recall stays, R); the tank **role** taunts; no default sponge (S1 landed the other half) |
| `frameLoop.ts`, `lineHolds.ts`, `specs/`, `formationTechnique.ts`, `battle-bond` | Deleted in CD.8 |

## The runtime

- **CD.1 Formation from the roster.** `formationSlotsFor(owner)` (new, beside `profile.ts`) reads
  the class config (`classConfigContextOf` / the way `squireRulesOf` reads its rules): one slot per
  roster entry, `slotId = <pieceId>#<n>`, `role` from the piece family, offense/defense/proc
  weights equal per Command spent, size and HP from the piece. `reconcileMinionSlots`,
  `computeMinionMaxHp`, `computeMinionSizeMult`, `resolveMinionType` read it. Command is
  `classBudget` (4 → 6 in T1, `standardBudgetSteps`), with the weapon's `conduit.command` line
  adding or removing some. A roster that no longer fits (a weapon swap) is trimmed from the end,
  never refused. The four Thralls are the default roster; an empty roster falls back to them.
- **CD.2 The T1 summon types** (`params` on the kit's pieces, placeholders): Plains Warden
  (plated; its sweep taunts the enemies around it, on a cooldown), Thornrunner (fast, little HP),
  Bile Spitter (ranged; `plating-shred` on its target, `effectivePlatingAfterShred` already reads
  it), Ridge Marksman (ranged power shot: an empowered summon hit), Cave Brute (2 Command tank).
  Attack mode values move from `SUMMONER_RANGE_TUNING` onto the type (melee 18, reach 96, ranged
  190). A Warden/Brute taunt holds a boss (`applyTaunt`, S3).
- **CD.3 Orders and Recall.** `attackFirst` compiles into the summons' target scoring
  (`formationTarget.ts` / `inheritedRuneTarget`): "attacking me" is the new choice, scored with
  `isAggroedOnPlayer`. `tanksGuard` steers tank target choice. `rebuildFirst` sorts
  `enqueueSummonReconstruction`. `recallWhen` conditions (the engine's, Q5) fire the existing
  `recall-summons`. Remove focus/move from `player:commandSummons`; keep Recall.
- **CD.4 Souls.** The five T1 Souls are trophies (`trophyHeld`): the equipped one fields a free
  extra body (0 Command) wearing the Soul's stand-in body, plus its seed bonus (Plains: melee
  summons charge the focus target every 10 s; Forest: summons heal slowly in a fight; Swamp: a
  summon's death leaves a bile pool; Mountain: a tank's taunt also shields it; Cave: a
  spiderling for 8 s every 6 s, temporary, never rebuilt). Relic slot is open from the first boss
  clear (the F5 gate change already shipped).
- **CD.5 Gear.** Six weapons (Plain Staff, Swarm, Swift, Poison, Mountain, Cave staffs: potency,
  Command ±, a job) and the T1 lines already entered (`classGear/conduit.ts`, effects `{}`):
  Plating for the summons, Bramble, Poison Shift, Big-Hit Intercept, You Tank; Herd, Sapbark,
  Bloodtithe, Cairnstone (S4, done), Deep Reserve. Each gets `conduit.*` keys the runtime reads.

## Delegates (CD.6–CD.8)

- **CD.6 UI:** the Formation editor on the class screen (roster cards by role/row, Command pips,
  the four orders, Recall options) and the HUD (Command pips, the bodies, the rebuild queue with
  the next rebuild's HP cost). From a `composeFormationView` the conductor writes in CD.3.
- **CD.7 Tutorial + route:** `buildConduitBeats` and the `conduit-t1` bot route, like CS6/CQ6.
- **CD.8 Cleanup:** delete frames, ranges, the nine specializations, `frameLoop`, `lineHolds`,
  `specs/`, `formationTechnique`, Battle Bond, the relic profile and the dead tests.

## Risks and measurements

- **Bandwidth and the summon cap:** T1 needs at most 6 Command + the Soul + the Cave Soul's
  spiderling = 8 bodies; the cap stays 9 (`hardEntityCap`) until T2 (old plan §5).
- **Reconstruction:** HP-cost rebuilds read the slot's own max HP; check the 20% floor still holds
  with mixed bodies (a 2-Command Brute costs more HP than a Thrall).
- **Bench:** `bench:server` fights real T1 nodes (I3); measure a T1 Conduit against the Striker
  before and after CD.1 and flag the numbers to the designer rather than tuning them.
- **Designer least convinced of the Squire; the Conduit has the most unknowns (Soul seeds).**
  Keep the slice minimal: prove a roster fights, rebuilds and obeys orders.
