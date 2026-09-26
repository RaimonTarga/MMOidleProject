// Retired item ids are migrated on load instead of being silently pruned.
// `thorn-needle` (removed 2026-09-26) becomes the Gale Needle it branched beside,
// keeping the better upgrade level, so a holder loses no progress.

import { ITEM_DATABASE, RECIPE_DATABASE, emptyEquipment } from "@mmo-idle/shared";
import { migrateLegacyItems, migrateLegacyRecipeIds } from "../src/db/playerRepo";
import type { HoldsInventory } from "@mmo-idle/shared";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(!ITEM_DATABASE.has("thorn-needle") && !RECIPE_DATABASE.has("thorn-needle"), "thorn-needle must be retired");
assert(ITEM_DATABASE.has("gale-needle"), "its replacement must exist");

// Equipped + in the bag + upgraded: everything moves to Gale Needle.
{
  const inv: HoldsInventory = {
    inventory: ["thorn-needle", "flash-rapier"],
    equipment: { ...emptyEquipment(), weapon: "thorn-needle" },
    itemUpgrades: { "thorn-needle": 4, "flash-rapier": 5 },
  };
  migrateLegacyItems(inv);
  assert(inv.equipment.weapon === "gale-needle", "an equipped Thorn Needle becomes an equipped Gale Needle");
  assert(inv.inventory.includes("gale-needle") && !inv.inventory.includes("thorn-needle"), "the bag entry is renamed");
  assert(inv.itemUpgrades["gale-needle"] === 4 && inv.itemUpgrades["thorn-needle"] === undefined, "the upgrade level moves over");
  assert(inv.itemUpgrades["flash-rapier"] === 5, "unrelated upgrades are untouched");
}

// Holding both keeps ONE Gale Needle at the better level.
{
  const inv: HoldsInventory = {
    inventory: ["gale-needle", "thorn-needle"],
    equipment: emptyEquipment(),
    itemUpgrades: { "gale-needle": 2, "thorn-needle": 5 },
  };
  migrateLegacyItems(inv);
  assert(inv.inventory.filter((id) => id === "gale-needle").length === 1, "no duplicate Gale Needle");
  assert(inv.itemUpgrades["gale-needle"] === 5, "the better upgrade level wins");
  migrateLegacyItems(inv);
  assert(inv.itemUpgrades["gale-needle"] === 5 && inv.inventory.length === 1, "migration is idempotent");
}

// Unlocked recipes follow the same map.
{
  const ids = migrateLegacyRecipeIds(["flash-rapier", "thorn-needle", "gale-needle"]);
  assert(ids.join(",") === "flash-rapier,gale-needle", `recipes migrate and dedupe (got ${ids.join(",")})`);
  assert(migrateLegacyRecipeIds(undefined).length === 0, "a missing list stays empty");
}

// No live recipe may still point at the retired id.
for (const recipe of RECIPE_DATABASE.values()) {
  assert(recipe.evolvesFrom !== "thorn-needle", `${recipe.id} evolves from a retired item`);
}

console.log("legacyItemMigration: ok");
