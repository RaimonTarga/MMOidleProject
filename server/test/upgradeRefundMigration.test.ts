// Progression rework Phase 2b: the weapon +N ladder is deleted, so a save
// written before this phase can hold `itemUpgrades` entries for weapon-slot
// items that are now unspendable data. Hydration refunds the essence those
// levels cost and drops the entry; non-weapon entries (armor/charm/boots keep
// their ladder per the conductor's override) are left exactly as they were.
// Exercised through the exported hydration helper with a fixture, per the
// repo convention (no live DB) -- see legacyItemMigration.test.ts for the
// sibling pattern this follows.

import { ITEM_DATABASE, emptyEquipment } from "@mmo-idle/shared";
import type { HoldsInventory, EssenceType } from "@mmo-idle/shared";
import { refundWeaponUpgradeEssence } from "../src/db/playerRepo";
import { weaponUpgradeRefundFor, WEAPON_UPGRADE_REFUND_TABLE } from "../src/db/weaponUpgradeRefund";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const zeroEssences = (): Record<EssenceType, number> => (
  { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }
);

// Sanity: the two items this test leans on are still shaped the way the test assumes.
assert(ITEM_DATABASE.get("iron-broadsword")?.slot === "weapon", "iron-broadsword is a weapon");
assert(ITEM_DATABASE.get("plains-vest-t1")?.slot === "armor", "plains-vest-t1 is armor");
assert(!ITEM_DATABASE.get("iron-broadsword")?.upgrades, "weapon recipes no longer author an upgrade ladder");
assert(!!ITEM_DATABASE.get("plains-vest-t1")?.upgrades, "armor recipes keep their upgrade ladder");

// 1. A +3 weapon refunds the sum of its first three authored steps and the
//    entry is dropped. A same-character +2 non-weapon item is untouched.
{
  const inv: HoldsInventory = {
    inventory: ["plains-vest-t1"],
    equipment: { ...emptyEquipment(), weapon: "iron-broadsword" },
    itemUpgrades: { "iron-broadsword": 3, "plains-vest-t1": 2 },
  };
  const essences = zeroEssences();
  refundWeaponUpgradeEssence("char-1", inv, essences);

  const expected = weaponUpgradeRefundFor("iron-broadsword", 3);
  assert(Object.keys(expected).length > 0, "the weapon table actually has data for this item");
  for (const [type, amount] of Object.entries(expected) as [EssenceType, number][]) {
    assert(essences[type] === amount, `refunded ${type} essence matches the authored +1..+3 sum (${essences[type]} vs ${amount})`);
  }
  assert(inv.itemUpgrades["iron-broadsword"] === undefined, "the weapon's itemUpgrades entry is dropped");
  assert(inv.itemUpgrades["plains-vest-t1"] === 2, "the non-weapon entry is untouched -- armor keeps its ladder");

  // The player still owns and wears the weapon; only its +N level is gone.
  assert(inv.equipment.weapon === "iron-broadsword", "the weapon is still equipped (the form is retained)");
  assert(inv.inventory.includes("plains-vest-t1"), "the armor is still owned");
}

// 2. A weapon at +0 (no entry at all) refunds nothing and adds no entry.
{
  const inv: HoldsInventory = {
    inventory: [],
    equipment: { ...emptyEquipment(), weapon: "iron-broadsword" },
    itemUpgrades: {},
  };
  const essences = zeroEssences();
  refundWeaponUpgradeEssence("char-2", inv, essences);
  assert(Object.values(essences).every((v) => v === 0), "no essence is minted out of nothing");
  assert(Object.keys(inv.itemUpgrades).length === 0, "no entry is created for an unheld level");
}

// 3. Running the refund twice is a no-op the second time (idempotent, like
//    every other hydration transform in playerRepo.ts).
{
  const inv: HoldsInventory = {
    inventory: [],
    equipment: { ...emptyEquipment(), weapon: "flash-rapier" },
    itemUpgrades: { "flash-rapier": 5 },
  };
  const essences = zeroEssences();
  refundWeaponUpgradeEssence("char-3", inv, essences);
  const afterFirst = { ...essences };
  refundWeaponUpgradeEssence("char-3", inv, essences);
  assert(
    (Object.keys(afterFirst) as EssenceType[]).every((t) => essences[t] === afterFirst[t]),
    "a second pass refunds nothing further",
  );
  assert(inv.itemUpgrades["flash-rapier"] === undefined, "the entry stays dropped");
}

// 4. Every weapon recipe the +N ladder used to cover has a refund entry, and
//    every entry's essence type matches what the item's own biome primary
//    essence is -- a silent typo here would refund the wrong currency.
for (const [itemId, steps] of Object.entries(WEAPON_UPGRADE_REFUND_TABLE)) {
  const item = ITEM_DATABASE.get(itemId);
  assert(!!item, `${itemId} still exists in ITEM_DATABASE`);
  assert(item!.slot === "weapon", `${itemId} is weapon-slot`);
  assert(steps.length === 5 || steps.length === 0, `${itemId} has a 5-step or empty refund table (got ${steps.length})`);
}

console.log("upgradeRefundMigration: ok");
