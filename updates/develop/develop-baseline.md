# Develop Baseline (Tier 4, Economy, Visuals)

Coverage note for develop work that landed before per-branch changelogs and is not
yet in `master`. Spans commits `9caece5`..`f340e5e` (the Tier 4 spec waves, the
visual overhaul, the economy/XP rework, the debug panel re-add, and the chaotic
axe / evasion balance pass). The `/mmo_pr` workflow notes are tracked separately in
`chore__mmo-pr-skill.md`.

## Player-facing changes

- Tier 4 combat specs are in: most class paths now run end-to-end with new effects —
  channeling attacks, aura effects, "doom" (a purple damage-over-time flavor), and
  cosmetic crit visuals. (Some T4 specs are still being finished and may not all work yet.)
- Damage-over-time now reads at a glance: each DoT element (poison, fire, frost, doom)
  has its own colored damage numbers and on-hit effects, and DoTs, empowered attacks,
  shields, and regen are visually distinct from one another.
- Big art pass: most biome backgrounds were remade, boss sprites were redone through
  Tier 3, and missing Tier 2/Tier 3 monster sprites plus Tier 3 class sprites were added.
  A new UI icon set was added. (Old backgrounds are kept under `old_backgrounds/`.)
- Two new biomes' content was added (graveyard, trench) alongside reorganized monster
  rosters for the existing biomes.
- Progression is less grindy: the biome XP curve was loosened (T2/T3/T4 included) so
  power unlocks faster, while essence drops were reduced and essence costs raised — the
  intent is to make essence the scarce, time-gated resource instead of XP.
- The debug panel is back, now with a "rename character" button.
- Balance: a mechanical pass on chaotic axe and evasion.

## Technical notes

- New shared DoT-element system (`shared/src/systems/dotElements.ts`) resolves a player's
  DoT element from unlocked path passives / sub-variant; the server tags `dot-tick` events
  and the client selects on-hit FX and damage-number styling from the same source.
- New shared combat helpers: `empoweredMult.ts`, `energyMax.ts`, `energyUpkeep.ts`.
- New server defense mitigations: `reactivePlating.ts`, `stationaryDr.ts`,
  `sustainedFightDr.ts`, and `shieldBreakHeal.ts`, plus T4 monster-side ports of player
  mechanics in `server/src/systems/combat/engine/monsterMechanics.ts` (deterministic
  counter/timer-driven cadence, empowered-cooldown, and enemy shields — no RNG).
- Archetype T3 pipelines expanded across cadence (crescendo, rampage, swiftblade, verdict),
  cooldown, dot (frenzy, conflagration, permafrost), energy, and reload (cannon, momentum,
  laser) trees; `detonation`/`entropyCollapse`/`alignment` ticks were removed in favor of
  consolidated `*State` modules.
- Monster data was reorganized from grouped files into per-biome rosters under
  `shared/src/data/monsters/` (`plains.monsters.ts`, `forest.monsters.ts`, etc.);
  `monstersT3.ts` was removed and T1 bosses split from T2 (`bossesT1.ts` / `bossesT2.ts`).
- Recipes were reorganized into per-biome files (`*.recipes.ts`) with new graveyard and
  trench recipe sets; the old `graveyard.ts` recipe file was removed.
- Economy/progression tuning lives in `shared/src/config/gameConfig.ts` (XP curve) and
  `shared/src/biomeDatabase.ts`; rewards/essence logic updated in
  `server/src/systems/player/progression/rewards.ts`.
- Client gains `render/damageNumberStyle.ts`, a UI icon atlas (`ui/uiAtlas.ts`,
  `ui/UIIcon.tsx`), and new FX modules (`aura`, `doom`, `holyBeam`, `cannonFx`,
  `dualSlash`, `firebrand`, `poisonExplosion`, `voidDischarge`, `aftershock`,
  `conflagrationTick`).
- Added a large set of design docs under `design_docs/` (T4 item/spec/monster designs,
  economy philosophy, roadmap, rune/dungeon/information-design brainstorms, T5–T8 endgame).

## Validation

- Not run — this note documents existing develop commits rather than new changes. The most
  recent merge of `origin/develop` into the working branch passed `pnpm typecheck`.
