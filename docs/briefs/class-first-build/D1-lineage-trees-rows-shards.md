# D1: remove the item lineage trees, the ability node rows and shards

**Agent:** Codex (or a Claude subagent) · **Worktree:** `../mmo-rw-d1-lineages` · **Branch:**
`rw/d1-lineages` (from `rework/class-first` after D5 and D6 are merged) · **Size:** XL ·
**Phase 0, wave B** (runs beside D2; you and D2 touch different systems, and the conductor
resolves any overlap at merge)

**Read first:** `docs/briefs/class-first-build/AGENT-RULES.md`; `CLAUDE.md`; the plan
`docs/briefs/class-first-build-plan-2026-10-14.md` §0–§4; the audit
`docs/briefs/rework-audit-2026-10-13.md` (its footprint table, its seam table and its
"order of operations"); `design_docs/class-first-bible.md` §4 (items: weapons become
class-specific; families stay and will drive loot).

## Why

The class-first rework scraps, for every class, the passive trees inside items and
abilities: the weapon lineage pages (leans, verbs, packets, amplifiers, keystones, cross rows,
form gates, evolve and reconstruct, the weapon page, payload FX, the rhythm readout), the
ability node rows and ability keystones, and the shard and boss-capstone wallets that paid
for them. None of it shipped to players (it is develop-only), and the tag
`pre-rework-2026-10-13` keeps it recoverable. The bot (D5) and the tutorial (D6) no longer use
any of it.

## Do, in this order (one commit per step, typecheck clean after each)

1. **Park the five weapon lineages** (`parked: true`), so weapons become plain recipes and
   the game runs without trees. Run the tests that touch recipes and crafting.
2. **Stop granting shards and capstones:** `grantLineageMaterials` in
   `server/src/systems/player/progression/rewards.ts`, `nodeShard` in
   `shared/src/world/nodeBlends.ts`, the families' shard `drops`, `CAPSTONE_MATERIALS`,
   `SHARD_BASE_PER_KILL`, the materials panel's shard chips.
3. **Delete the runtime:** `server/src/systems/combat/lineageCards.ts`, `lineageKeys.ts`,
   `leanConditions.ts`, `rhythmReadout.ts`, `keystones/`, `abilityNodes.ts`,
   `damage/lineageAffliction.ts`; `server/src/systems/player/economy/lineages.ts`,
   `lineageSync.ts`, `abilityNodes.ts`; their registrations in `combatBootstrap.ts` (two
   lineage listeners, two ability-node listeners), the card speed-window term in
   `attackCadence.ts`, the recalc refresh in `playerEntityFormulas.ts`, crafting and equip's
   lineage branches (`crafting.ts`, `inventory.ts`), the evolve / reconstruct / card / form /
   ability-row intents and their handlers.
4. **Delete the data and shared systems:** `shared/src/data/lineages/`,
   `shared/src/data/abilityNodes/`, `shared/src/systems/lineages.ts`, `evolution.ts`,
   `rhythm.ts`, `abilityNodes.ts`; the `PacketId` vocabulary; `lineageId` / `evolvesFrom` /
   `reconstructCost` on recipes; the `packet` field on `SkillNode`; the tutorial conditions
   about shards, capstones and lineage cards (`shared/src/tutorial/conditions.ts`, `types.ts`).
5. **Delete the client side:** `client/src/ui/lineage/`, the payload and keystone FX
   (`client/src/fx/lineagePayload*.ts`, `abilityKeystone*.ts`), the rhythm readout
   (`client/src/hud/RhythmReadout.tsx`, its model and css), the ability-row parts of the
   abilities panel, shard and capstone chips, the stats panel's lean and verb lines.
6. **State and protocol:** remove `holdsInventory.lineages`, the shard and capstone wallets,
   `cardFiringsTaught` and ability-node attunement from the slices, the save normalizers
   (`server/src/db/playerRepo.ts`: drop them on load, so an old dev save still loads), the
   `showsRhythm` slice and its networked key, the related socket events in
   `shared/src/protocol/socketEvents.ts`, and the view fields in `views.ts`.
7. **Tests:** delete tests of deleted code; adapt tests that only mention the removed systems
   in passing so they keep their real assertions. If a test fails for a reason that has
   nothing to do with this removal, stop and report it.

## Keep (don't delete)

- **Families** (`shared/src/data/families/`) and `familyForMonster`: families stay and will
  drive loot (bible §4); only their shard `drops` go.
- **Node blends and zone modifiers** (`shared/src/world/nodeBlends.ts` without `nodeShard`).
- **Crafting, recipes, essences, items**, the weapon recipes themselves (now plain), the
  `mechanicFired` event infrastructure (only its lineage listener goes), the combat pipeline.
- **The abilities themselves** (techniques, guards, their crafting and attunement): task D3
  removes those later. Only their **node rows and keystones** go here.
- Everything about stances, rites, Runic Points and cores: that is task D2.
- `shared/src/classKits/` and everything the class-first framework added.

## Allowed paths

Anything the removal touches in `shared/`, `server/`, `client/`, `admin/`, plus your report.
Not `bot/` (D5 already removed its use) and not `design_docs/`. Hot files
(`socketEvents.ts`, `networkedEntity.ts`, `entity.ts`, `playerRepo.ts`, `combatBootstrap.ts`,
`World.ts`): only the lines that belong to the removed systems.

## Check

- `pnpm typecheck` clean after every step.
- `pnpm test` (the full suite) at the end: paste the `N/M passed` line and every `FAIL` name.
  Failures that existed before your branch (run the same files on `rework/class-first` to
  prove it) are listed, not fixed.
- `grep -rniE "lineage|shard|capstone|abilityNode|keystone|rhythmReadout|PacketId|evolve" shared/src server/src client/src admin/src`
  returns only lines you can justify (list them in the report).
- `git diff --numstat`: no whole-file line-ending churn.

## Don't

- Don't touch the class kits, the class config, the Passive Tree, the abilities themselves,
  stances, rites, runes or Runic Points.
- Don't change monster, boss or reward numbers other than removing shard and capstone grants.
- Don't add replacement features (components, drops, pity): those are later sessions.

## Report

`docs/briefs/class-first-build/reports/D1.md` (shape in AGENT-RULES.md): files deleted and
lines removed per step, the final suite count, the grep output, and anything you kept because
you were unsure.
