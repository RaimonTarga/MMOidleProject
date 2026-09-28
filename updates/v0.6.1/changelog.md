# v0.6.1 — Clearer menus

2026-09-28

A cleaner pass over the menus you use most: the World Map, Crafting, Upgrade, Inventory
and the Passive Tree are all easier to read, and every area now tells you how dangerous
it is before you walk in. Monsters also got their own death sounds.

> **Returning characters:** your character carries over unchanged.

## Highlights

- **Danger levels.** Every area has a danger level, shown when you arrive and on the signs
  at each exit: Low, Medium, High, Very High, and **Boss fight** for dungeons. One skull
  that changes colour, from bone-white to blood-crimson, tells you at a glance.
- **A clearer World Map.** The regions you can reach are charted; higher tiers stay as
  silhouettes until you get there. Each area's border shows its danger level.
- **Crafting by category.** A list of categories replaces the wall of filters, each one
  saying how many recipes are ready and new. Categories appear as you unlock them.
- **Better item comparison.** Click an item in your Inventory to pin it, hover others to
  compare, and see exactly what each change does to your damage and toughness.
- **A simpler Passive Tree.** One screen shows your whole path, and when you pick a style
  you can see the three Tier 4 paths it leads to.
- **Death sounds.** Monsters now make a sound fitting their kind when they die, and
  bosses crumble away.

## World Map

- Your current tier and everything below it are charted. Higher tiers show only their
  shape, with the region name marked "Uncharted"; you can still travel there.
- Each area is coloured by its biome and bordered by its danger level. Tiles are cleaner:
  just the biome icon, the dungeon marker and where you are.
- Selecting an area shows a short summary: danger, boss, your biome level and next
  unlock. Monsters, drops and the full unlock list sit behind **Details**.
- Search finds areas you have charted.

## Danger levels

- Danger describes an area within its own tier. Plains is Low at Tier 2, Cave is Very
  High at Tier 1, and every dungeon is a **Boss fight**.
- You see it on the banner when you enter a new area and on the signs as you approach
  an exit.

## Crafting and Upgrade

- Pick a category on the left: Weapon, Armor, Recovery, Boots, Core and Relic, then
  Technique, Stance, Rite and Rune. Each shows how many recipes are ready and new.
- Recipes are grouped into **New**, **Ready to craft** and **Not ready yet**, and each
  one says what it still needs, such as "-20" of a material or "needs Flash Rapier +3".
  Locked recipes are one click away at the bottom of each category.
- An evolution only counts as ready when you can actually evolve or reconstruct it.
- Selecting a recipe shows its full stats and effects.
- Upgrade lists your equipped gear first, then your bag, with everything about the next
  upgrade in a side panel.

## Inventory

- Click an item to pin it and compare it with what you wear; hover other items to
  preview them without losing the pin. Equipping is done from the button in the stats
  panel, which now stays in view even for long relic descriptions.
- Click something you are wearing to see what it gives you.
- The stats panel keeps every row in place while you compare, shows the change on each
  line, and leads with your estimated damage and toughness.
- Every item effect says whether it is included in the damage and toughness numbers.
  Relics show how they change your class mechanic, before and after.
- The backpack filters by slot (now including Core and Relic) and tier, and sorts your
  best gear first.

## Passive Tree

- One screen. A track across the top shows your class, style, range and path so far;
  click a finished step to look back at that choice.
- Choices are compact cards you can compare side by side, and the detail panel marks
  where one choice differs from the others.
- When choosing a style, a small tree shows the three Tier 4 paths each style leads to.
  Click one to preview it, including its character sprite.
- Tiers are counted from 1: Class is Tier 1, Style Tier 2, Range Tier 3, Path Tier 4.

## Monsters

- Idle monsters keep a little further back from zone entrances, so you are less likely
  to walk straight into a crowd. They still chase you anywhere.
- Death sounds for magical, animal, humanoid, undead, stone and aquatic creatures, and a
  longer crumble for bosses. They play for your own kills, including kills by your
  summons and damage over time.

## Technical changelog

- No migrations and no save-shape changes; saves are kept.
- Server: idle roam and ambient spawn targets are clamped 240 px inside zone edges
  (`monsterRoaming.ts`). Combat movement is unchanged.
- Shared: `areaDanger` gains band 5 for dungeons. `recalculatePlayerStats` accepts a
  preview-only `previewOmitItemEffects` (never set by the live server) used by the
  inventory to measure which effects the estimate counts.
- Known finding, not changed here: the DPS estimate models weapon dead swing only for
  laser builds, so Chaotic Axe's DPS is overstated for other classes. The inventory now
  labels that effect "not in the estimate".
- Release tooling accepts X.Y.Z patch versions (`release-v0.6.1`).

## Validation

- `pnpm typecheck`, full `pnpm test` (323/323), `pnpm build`, `git diff --check`, and
  `node --test scripts/release.test.mjs` (6/6, including a patch-version cut).
- UI checked with screenshots of the real components against a local build, at desktop
  and phone widths; not yet played end to end on the live server.
