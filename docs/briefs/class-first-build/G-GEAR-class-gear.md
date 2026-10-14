# G-GEAR: enter every class's gear (weapons and class lines), T1–T4

Two tasks, same rules, different classes, so they never touch the same file:

| Task | Classes | Agent | Worktree · branch | Your files |
|---|---|---|---|---|
| **G-GEAR-A** | Striker, Squire, Apprentice | Grok | `../mmo-rw-gear-a` · `rw/gear-a` | `shared/src/data/classGear/striker.ts`, `squire.ts`, `apprentice.ts` |
| **G-GEAR-B** | Slinger, Spirit, Conduit | Codex (or a second Grok) | `../mmo-rw-gear-b` · `rw/gear-b` | `shared/src/data/classGear/slinger.ts`, `spirit.ts`, `conduit.ts` |

**Size:** L (data entry, about 30 weapons and 50 lines per class). **Phase 0/1 data**, no runtime.
**Edit only your three files** plus your report. Never edit `shared/src/data/recipes/*`,
`classGear/index.ts`, `classGear/types.ts`, the test, or another class's file.

**Read first:** `AGENT-RULES.md` (this folder); `shared/src/data/classGear/types.ts` (the shape);
`shared/src/systems/classGear.ts` (`ClassLineDef`); `shared/src/data/classGear/classGear.test.ts`
(what is checked); one recipe file such as `shared/src/data/recipes/plains.recipes.ts` (what a
recipe looks like). Then, per class, the bible `design_docs/class-first-bible.md`:

| Class (file) | T1 gear table | Items section | T2–T4 gear (`New gear jobs` column, job moves) |
|---|---|---|---|
| Striker (`striker.ts`) | §12.4 | §12.9 | §12.16 |
| Squire (`squire.ts`) | §8.4 | §8.9 | §8.16 |
| Apprentice (`apprentice.ts`) | §9.4 | §9.9 | §9.16 |
| Slinger (`slinger.ts`) | §10.4 | §10.9 | §10.16 |
| Spirit (`spirit.ts`) | §11.4 | §11.9 | §11.16 |
| Conduit (`conduit.ts`) | §7.4 | §7.9 (charm lines table) | §7.16 |

## Why

Smart loot (bible §4): each class crafts its own weapons, and every shared armor and charm base
carries a different **line** per class (the same plate does a different thing for a Squire and
a Spirit). The plumbing is built: a weapon in your file becomes a recipe only that class sees;
a line in your file attaches to the shared base it names. Nothing reads the lines' effects yet
(each class's runtime task defines its keys later), so this task is **names, texts and
placeholder numbers only**.

## What a biome gives, tier by tier

Every tier, each biome in it has, per class: **one weapon recipe per job it holds**, **one armor
line** and **one charm line**. A job "follows you up": the same job recurs every tier its biome
exists, stronger (same name, same text; only the stats change). The biomes per tier, and the
shared bases that exist for them:

| Tier | Biomes (shared bases `<biome>-vest-t<N>` and `<biome>-charm-t<N>` exist for each) |
|---|---|
| T1 | clearing, plains, forest, swamp, mountain, cave |
| T2 | plains, forest, swamp, mountain, cave, jungle, desert |
| T3 | swamp, mountain, cave, jungle, desert, tundra, volcanic |
| T4 | mountain, jungle, desert, tundra, volcanic, graveyard (the bible's Wasteland), trench |

- **T1** is each class's §X.4 table: a weapon, an armor line and a charm line per biome.
- **T2–T4** are the §X.16 tables. A biome whose `New gear jobs` cell is "—" repeats its own
  earlier jobs at this tier. A new biome's cell names its jobs (weapon, armor line, charm line).
- **Job moves:** when a biome retires, its jobs move to a biome of the next tier (§X.16 says
  which, e.g. the Striker's Forest jobs go to the Jungle at T3). The receiving biome then gets
  **a second weapon** (the moved job's) at that tier and later tiers. The moved **armor and
  charm lines are NOT entered**: a base carries one line per class, and it keeps the receiving
  biome's own line. List every moved line you skipped in your report (the conductor decides).
- **The Clearing (T1):** one plain starting weapon per class (§X.4's "Start" line describes it;
  e.g. the Striker's plain sword). No line on `clearing-vest-t1` or `clearing-charm-t1`.
- **Conduit** writes some jobs as descriptions without names ("More summons: the swarm weapon",
  "Plating for the summons, some for you"). Give each a short plain placeholder name taken from
  its job (e.g. "Swarm Staff", "Shared Plating") and list every name you made up in your report.
  Any other class: if the bible gives no name, do the same and list it.

## How to write each entry

**A weapon** (an entry in `weapons`):

```ts
{
  id: 'striker-broadblade-t1', name: 'Broadblade',
  recipeGroup: 'plains', requiredBiomeLevel: 1, slot: 'weapon',
  cost: { yellow: 10 }, stats: { attack: 19 }, attacksPerSecond: 0.9, tier: 1,
  icon: 'items/weapons/iron-broadsword.png',
  description: 'Every beat also nicks the nearest other enemy.',
  mechanicEffects: {},
},
```

- **id:** `<class>-<weapon name in kebab-case>-t<tier>` (`striker-twin-fangs-t2`,
  `squire-<name>-t3`). Apostrophes drop (`Hunter's Blade` → `hunters-blade`).
- **name:** the bible's weapon name, the same at every tier.
- **description:** the job's text from the bible, as a plain player-facing sentence (no
  numbers). Same text every tier.
- **recipeGroup, tier:** the biome and tier it belongs to.
- **requiredBiomeLevel, cost, stats, attacksPerSecond, icon:** copied exactly from **that
  biome's generic weapon at that tier**: the recipe in `shared/src/data/recipes/<biome>.recipes.ts`
  with `slot: 'weapon'` and the same `tier` (if there are two, the first in the file). Copy
  `catalysts`/`upgradeSteps`-style fields too if the generic weapon has them. **Do not copy its
  `mechanicEffects`, `name`, `id`, `description`, or any evolution/successor fields**; set
  `mechanicEffects: {}`. These numbers are placeholders the designer tunes later; invent none.
- If a biome-tier has no generic weapon to copy from, stop and report it.

**A line** (an entry in `lines`, keyed by the shared base's recipe id):

```ts
'plains-vest-t1': { name: 'Shoulder Through', text: 'Each extra enemy around you adds a little plating.', effects: {} },
'plains-charm-t1': { name: 'Grit', text: 'Part of every hit you take heals back over a few seconds while you keep attacking; stop and it is lost.', effects: {} },
```

- Armor lines go on `<biome>-vest-t<N>`, charm lines on `<biome>-charm-t<N>`.
- **name:** the bible's line name; **text:** what it does, plain words, no numbers, from the
  bible. Same name and text at every tier the job recurs.
- **effects:** always `{}` (the runtime tasks define the keys).
- Order: group weapons and lines by tier with a `// ── T1 ──` comment per tier, biomes in the
  order of the table above.

Don't touch the generic weapons (they stay until the class runtimes replace them).

## Checks

- `pnpm typecheck` clean.
- `pnpm test -- classGear recipeGates recipeCurve weaponCurve`: all pass. `classGear.test.ts`
  prints your counts (e.g. `Striker 31w/48l`); paste that line in your report.
- Spot-check three of your weapons against their generic weapon (same stats, cost, level).

## Commit and report

Commit per class (`feat(items): Striker gear, T1–T4`). Report at
`docs/briefs/class-first-build/reports/G-GEAR-A.md` (or `-B.md`) in the AGENT-RULES shape, plus:
a table per class of **biome × tier → weapon(s), armor line, charm line**; the moved lines you
skipped; every placeholder name you made up; anything the bible left unclear.
