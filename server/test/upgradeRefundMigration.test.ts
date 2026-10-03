// The +N ladder is retired on every slot: weapons in progression rework Phase 2b,
// armour/charm/boots in the course correction (design §24.5). A save written
// before can hold `itemUpgrades` entries that are now unspendable data and that
// the stat rebuild no longer reads. Hydration refunds the essence those levels
// cost — from frozen authored-cost tables, because the recipe ladders are deleted
// — and drops the entry; the item itself is kept. Exercised through the exported
// hydration helper with a fixture, per the repo convention (no live DB) — see
// legacyItemMigration.test.ts for the sibling pattern this follows.

import { ITEM_DATABASE, RECIPE_DATABASE, emptyEquipment } from "@mmo-idle/shared";
import type { HoldsInventory, EssenceType } from "@mmo-idle/shared";
import { refundRetiredUpgradeEssence } from "../src/db/playerRepo";
import { weaponUpgradeRefundFor, WEAPON_UPGRADE_REFUND_TABLE } from "../src/db/weaponUpgradeRefund";
import { gearUpgradeRefundFor, GEAR_UPGRADE_REFUND_TABLE } from "../src/db/gearUpgradeRefund";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const zeroEssences = (): Record<EssenceType, number> => (
  { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }
);
const ESSENCES: readonly EssenceType[] = ["red", "blue", "green", "yellow", "purple"];
const GEAR_SLOTS = new Set(["armor", "recovery", "mobility"]);

// Sanity: the two items this test leans on are still shaped the way the test assumes.
assert(ITEM_DATABASE.get("iron-broadsword")?.slot === "weapon", "iron-broadsword is a weapon");
assert(ITEM_DATABASE.get("plains-vest-t1")?.slot === "armor", "plains-vest-t1 is armor");
assert(!ITEM_DATABASE.get("iron-broadsword")?.upgrades, "weapon recipes no longer author an upgrade ladder");

// 1. A +3 weapon and a +2 vest on one character: both refund the sum of their
//    first steps from their own frozen table, both entries are dropped, and both
//    items are kept. A +0 entry is left alone, exactly as the weapon refund did.
{
  const inv: HoldsInventory = {
    inventory: ["plains-vest-t1", "forest-charm-t2"],
    equipment: { ...emptyEquipment(), weapon: "iron-broadsword" },
    itemUpgrades: { "iron-broadsword": 3, "plains-vest-t1": 2, "forest-charm-t2": 0 },
  };
  const essences = zeroEssences();
  refundRetiredUpgradeEssence("char-1", inv, essences);

  const weapon = weaponUpgradeRefundFor("iron-broadsword", 3);
  const vest = gearUpgradeRefundFor("plains-vest-t1", 2);
  assert(Object.keys(weapon).length > 0 && Object.keys(vest).length > 0, "both tables have data for these items");
  for (const type of ESSENCES) {
    const expected = (weapon[type] ?? 0) + (vest[type] ?? 0);
    assert(essences[type] === expected, `refunded ${type} essence is the two authored sums (${essences[type]} vs ${expected})`);
  }
  // The literal, so an edit to the frozen vest row cannot pass unnoticed: +1 20, +2 45.
  assert(vest.yellow === 65, `plains-vest-t1 +2 refunds 65 yellow, got ${vest.yellow}`);
  assert(inv.itemUpgrades["iron-broadsword"] === undefined, "the weapon's entry is dropped");
  assert(inv.itemUpgrades["plains-vest-t1"] === undefined, "the vest's entry is dropped — armour lost its ladder too");
  assert(inv.itemUpgrades["forest-charm-t2"] === 0, "a +0 entry is left as it was");

  // The player still owns and wears everything; only the +N levels are gone.
  assert(inv.equipment.weapon === "iron-broadsword", "the weapon is still equipped");
  assert(inv.inventory.includes("plains-vest-t1") && inv.inventory.includes("forest-charm-t2"), "the gear is still owned");
}

// 2. Nothing held, nothing minted.
{
  const inv: HoldsInventory = {
    inventory: ["plains-vest-t1"],
    equipment: { ...emptyEquipment(), weapon: "iron-broadsword" },
    itemUpgrades: {},
  };
  const essences = zeroEssences();
  refundRetiredUpgradeEssence("char-2", inv, essences);
  assert(Object.values(essences).every((v) => v === 0), "no essence is minted out of nothing");
  assert(Object.keys(inv.itemUpgrades).length === 0, "no entry is created for an unheld level");
}

// 3. Running the refund twice is a no-op the second time (idempotent, like
//    every other hydration transform in playerRepo.ts), for both tables.
{
  const inv: HoldsInventory = {
    inventory: ["mountain-vest-t4"],
    equipment: { ...emptyEquipment(), weapon: "flash-rapier", mobility: "cave-boots-t1" },
    itemUpgrades: { "flash-rapier": 5, "mountain-vest-t4": 5, "cave-boots-t1": 4 },
  };
  const essences = zeroEssences();
  refundRetiredUpgradeEssence("char-3", inv, essences);
  const afterFirst = { ...essences };
  assert(afterFirst.blue > 0 && afterFirst.red > 0 && afterFirst.green > 0, "fixture: all three entries paid out");
  refundRetiredUpgradeEssence("char-3", inv, essences);
  assert(ESSENCES.every((t) => essences[t] === afterFirst[t]), "a second pass refunds nothing further");
  assert(Object.keys(inv.itemUpgrades).length === 0, "and every entry stays dropped");
}

// 4. The weapon table covers weapons only, five steps (or none) per item.
for (const [itemId, steps] of Object.entries(WEAPON_UPGRADE_REFUND_TABLE)) {
  const item = ITEM_DATABASE.get(itemId);
  assert(!!item, `${itemId} still exists in ITEM_DATABASE`);
  assert(item!.slot === "weapon", `${itemId} is weapon-slot`);
  assert(steps.length === 5 || steps.length === 0, `${itemId} has a 5-step or empty refund table (got ${steps.length})`);
}

// 5. The gear table: exactly the armour, charm and boots items the ladder
//    covered (every one of tier >= 1; the Clearing's tier-0 items never had a
//    step), five essence-only steps each.
{
  const ladderEra = [...RECIPE_DATABASE.values()]
    .filter((r) => GEAR_SLOTS.has(r.slot) && r.tier >= 1)
    .map((r) => r.id)
    .sort();
  const frozen = Object.keys(GEAR_UPGRADE_REFUND_TABLE).sort();
  assert(
    JSON.stringify(frozen) === JSON.stringify(ladderEra),
    `the gear table covers exactly the ladder-era armour/charm/boots items:\n  missing ${ladderEra.filter((id) => !frozen.includes(id))}\n  extra ${frozen.filter((id) => !ladderEra.includes(id))}`,
  );
  for (const [itemId, steps] of Object.entries(GEAR_UPGRADE_REFUND_TABLE)) {
    assert(GEAR_SLOTS.has(ITEM_DATABASE.get(itemId)?.slot ?? ""), `${itemId} is an armour/charm/boots item`);
    assert(steps.length === 5, `${itemId} has a 5-step refund row (got ${steps.length})`);
    for (const step of steps) {
      for (const [type, amount] of Object.entries(step)) {
        assert(ESSENCES.includes(type as EssenceType) && (amount ?? 0) > 0, `${itemId}: a step costs positive essence, got ${type}=${amount}`);
      }
    }
  }
}

// 6. Frozen amounts equal the authored ladder, step for step, for every item
//    that still authors one. The ladders are deleted in parallel (W1-D), after
//    which this loop walks nothing and the checksum below is the pin.
{
  let compared = 0;
  for (const [itemId, steps] of Object.entries(GEAR_UPGRADE_REFUND_TABLE)) {
    const ladder = RECIPE_DATABASE.get(itemId)?.upgrades;
    if (!ladder || ladder.length === 0) continue;
    compared++;
    assert(ladder.length === steps.length, `${itemId}: ${ladder.length} authored steps vs ${steps.length} frozen`);
    steps.forEach((step, i) => {
      const authored = ladder[i]!.cost;
      for (const type of ESSENCES) {
        assert((authored[type] ?? 0) === (step[type] ?? 0), `${itemId} +${i + 1} ${type}: authored ${authored[type] ?? 0}, frozen ${step[type] ?? 0}`);
      }
    });
    // Refund per step count is the running total of the authored steps.
    for (let plus = 1; plus <= 5; plus++) {
      const want: Partial<Record<EssenceType, number>> = {};
      for (const s of ladder.slice(0, plus)) {
        for (const [type, amount] of Object.entries(s.cost)) want[type as EssenceType] = (want[type as EssenceType] ?? 0) + (amount ?? 0);
      }
      const got = gearUpgradeRefundFor(itemId, plus);
      assert(ESSENCES.every((t) => (got[t] ?? 0) === (want[t] ?? 0)), `${itemId} +${plus}: refund ${JSON.stringify(got)} vs ladder total ${JSON.stringify(want)}`);
    }
  }
  // Checksum of the whole frozen table, so an edit to any row is caught once the
  // ladders it was captured from are gone.
  const totals: Record<string, number> = {};
  for (const steps of Object.values(GEAR_UPGRADE_REFUND_TABLE)) {
    for (const step of steps) for (const [type, amount] of Object.entries(step)) totals[type] = (totals[type] ?? 0) + (amount ?? 0);
  }
  const CHECKSUM = { red: 21644, blue: 26640, green: 23653, yellow: 19490, purple: 23713 };
  assert(
    ESSENCES.every((t) => totals[t] === CHECKSUM[t]),
    `the frozen gear table's per-colour totals moved: ${JSON.stringify(totals)}`,
  );
  console.log(`  gear table: ${Object.keys(GEAR_UPGRADE_REFUND_TABLE).length} items, ${compared} still compared against an authored ladder`);
}

console.log("upgradeRefundMigration: ok");
