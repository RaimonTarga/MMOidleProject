import type { EssenceType } from '@mmo-idle/shared';

/**
 * Course correction (design §24.5) — the +N ladder is retired on EVERY slot.
 * Weapons lost it in progression rework Phase 2b (`weaponUpgradeRefund.ts`);
 * armour, charm and boots lose it now, and their ladder totals fold into each
 * item's base stats (W1-D), so an item is crafted at its old +5 power. A save
 * written before this can still hold `holdsInventory.itemUpgrades[id] > 0` for
 * an armour, charm or boots item: that level now adds nothing, and the essence
 * the player spent reaching it is given back here, exactly as the weapon
 * ladder's was.
 *
 * This is a FROZEN historical record of what `shared/src/data/recipes/*`
 * authored per non-weapon item per level immediately before the ladder was
 * deleted (captured on `feat/cc-slots` from the course-correction base,
 * `95a9ba8b`): 86 items, one entry per `+1..+5` step, essence only. The recipe
 * ladders are deleted in parallel, so nothing here may be read back from them.
 * It exists ONLY to compute a one-time refund during playerRepo hydration
 * (`refundRetiredUpgradeEssence`) and must never be read for anything else. An
 * item added after this point has no entry and refunds nothing, which is
 * correct — it was never on the ladder.
 *
 * The refund is the AUTHORED step cost, the same convention the weapon table
 * uses. Live players paid the Candidate-F experiment price for a T1 item's +5
 * step (`t1ExperimentUpgradeCost`, 10–40 essence less per item); that delta is
 * refunded too, as it was for weapons.
 */
export const GEAR_UPGRADE_REFUND_TABLE: Readonly<
  Record<string, ReadonlyArray<Partial<Record<EssenceType, number>>>>
> = {
  'cave-vest-t1': [
    { red: 30 }, { red: 60 }, { red: 95 }, { red: 155 }, { red: 195 },
  ],
  'cave-charm-t1': [
    { red: 10 }, { red: 25 }, { red: 40 }, { red: 60 }, { red: 75 },
  ],
  'cave-boots-t1': [
    { red: 10 }, { red: 15 }, { red: 25 }, { red: 40 }, { red: 55 },
  ],
  'cave-vest-t2': [
    { red: 46 }, { red: 116 }, { red: 185 }, { red: 300 }, { red: 508 },
  ],
  'cave-charm-t2': [
    { red: 18 }, { red: 46 }, { red: 73 }, { red: 119 }, { red: 203 },
  ],
  'cave-boots-t2': [
    { red: 12 }, { red: 30 }, { red: 48 }, { red: 78 }, { red: 132 },
  ],
  'cave-vest-t3': [
    { red: 73, yellow: 18 },
    { red: 182, yellow: 45 },
    { red: 291, yellow: 73 },
    { red: 473, yellow: 118 },
    { red: 800, yellow: 200 },
  ],
  'cave-charm-t3': [
    { green: 7, red: 28 },
    { green: 18, red: 70 },
    { green: 28, red: 113 },
    { green: 46, red: 183 },
    { green: 78, red: 310 },
  ],
  'cave-boots-t3': [
    { red: 23 }, { red: 57 }, { red: 91 }, { red: 147 }, { red: 248 },
  ],
  'forest-vest-t1': [
    { green: 20 }, { green: 45 }, { green: 70 }, { green: 115 }, { green: 150 },
  ],
  'forest-charm-t1': [
    { green: 10 }, { green: 20 }, { green: 35 }, { green: 60 }, { green: 75 },
  ],
  'forest-boots-t1': [
    { green: 10 }, { green: 15 }, { green: 25 }, { green: 40 }, { green: 45 },
  ],
  'forest-vest-t2': [
    { green: 29, yellow: 7 },
    { green: 72, yellow: 18 },
    { green: 115, yellow: 29 },
    { green: 187, yellow: 47 },
    { green: 317, yellow: 79 },
  ],
  'forest-charm-t2': [
    { green: 18 }, { green: 45 }, { green: 72 }, { green: 117 }, { green: 198 },
  ],
  'forest-boots-t2': [
    { green: 12 }, { green: 30 }, { green: 48 }, { green: 78 }, { green: 132 },
  ],
  'jungle-vest-t2': [
    { green: 31, yellow: 8 },
    { green: 78, yellow: 20 },
    { green: 125, yellow: 31 },
    { green: 203, yellow: 51 },
    { green: 342, yellow: 86 },
  ],
  'jungle-charm-t2': [
    { green: 18 }, { green: 46 }, { green: 73 }, { green: 119 }, { green: 203 },
  ],
  'jungle-boots-t2': [
    { green: 12 }, { green: 30 }, { green: 48 }, { green: 78 }, { green: 132 },
  ],
  'jungle-vest-t3': [
    { green: 59, yellow: 19 },
    { green: 146, yellow: 49 },
    { green: 234, yellow: 78 },
    { green: 380, yellow: 127 },
    { green: 644, yellow: 214 },
  ],
  'jungle-charm-t3': [
    { green: 36 }, { green: 91 }, { green: 145 }, { green: 236 }, { green: 400 },
  ],
  'jungle-boots-t3': [
    { green: 23 }, { green: 57 }, { green: 91 }, { green: 148 }, { green: 251 },
  ],
  'jungle-vest-t4': [
    { green: 124, yellow: 31 },
    { green: 310, yellow: 77 },
    { green: 494, yellow: 124 },
    { green: 804, yellow: 201 },
    { green: 1360, yellow: 340 },
  ],
  'jungle-charm-t4': [
    { green: 73 }, { green: 182 }, { green: 291 }, { green: 472 }, { green: 798 },
  ],
  'jungle-charm-t4-overgrowth': [
    { green: 73 }, { green: 182 }, { green: 291 }, { green: 472 }, { green: 798 },
  ],
  'jungle-boots-t4': [
    { green: 45 }, { green: 112 }, { green: 180 }, { green: 292 }, { green: 493 },
  ],
  'mountain-vest-t1': [
    { blue: 25 }, { blue: 45 }, { blue: 75 }, { blue: 125 }, { blue: 155 },
  ],
  'mountain-charm-t1': [
    { blue: 10 }, { blue: 25 }, { blue: 40 }, { blue: 60 }, { blue: 75 },
  ],
  'mountain-boots-t1': [
    { blue: 10 }, { blue: 15 }, { blue: 25 }, { blue: 40 }, { blue: 55 },
  ],
  'mountain-vest-t2': [
    { blue: 42 }, { blue: 106 }, { blue: 170 }, { blue: 276 }, { blue: 468 },
  ],
  'mountain-charm-t2': [
    { blue: 17 }, { blue: 43 }, { blue: 68 }, { blue: 111 }, { blue: 187 },
  ],
  'mountain-boots-t2': [
    { blue: 11 }, { blue: 29 }, { blue: 46 }, { blue: 75 }, { blue: 126 },
  ],
  'mountain-vest-t3': [
    { blue: 66, red: 17 },
    { blue: 166, red: 42 },
    { blue: 266, red: 67 },
    { blue: 434, red: 108 },
    { blue: 734, red: 183 },
  ],
  'mountain-charm-t3': [
    { blue: 26, red: 6 },
    { blue: 65, red: 16 },
    { blue: 104, red: 26 },
    { blue: 169, red: 42 },
    { blue: 286, red: 71 },
  ],
  'mountain-boots-t3': [
    { blue: 22 }, { blue: 56 }, { blue: 89 }, { blue: 145 }, { blue: 246 },
  ],
  'mountain-vest-t4': [
    { blue: 132, red: 33 },
    { blue: 331, red: 83 },
    { blue: 530, red: 132 },
    { blue: 860, red: 215 },
    { blue: 1456, red: 364 },
  ],
  'mountain-vest-t4-stormwall': [
    { blue: 132, red: 33 },
    { blue: 331, red: 83 },
    { blue: 530, red: 132 },
    { blue: 860, red: 215 },
    { blue: 1456, red: 364 },
  ],
  'mountain-charm-t4': [
    { blue: 57, red: 8 },
    { blue: 143, red: 19 },
    { blue: 229, red: 31 },
    { blue: 371, red: 51 },
    { blue: 627, red: 86 },
  ],
  'mountain-charm-t4-shieldmend': [
    { blue: 57, red: 8 },
    { blue: 143, red: 19 },
    { blue: 229, red: 31 },
    { blue: 371, red: 51 },
    { blue: 627, red: 86 },
  ],
  'mountain-boots-t4': [
    { blue: 44 }, { blue: 110 }, { blue: 175 }, { blue: 285 }, { blue: 482 },
  ],
  'plains-vest-t1': [
    { yellow: 20 }, { yellow: 45 }, { yellow: 70 }, { yellow: 115 }, { yellow: 150 },
  ],
  'plains-charm-t1': [
    { yellow: 10 }, { yellow: 20 }, { yellow: 30 }, { yellow: 45 }, { yellow: 55 },
  ],
  'plains-boots-t1': [
    { yellow: 10 }, { yellow: 15 }, { yellow: 25 }, { yellow: 40 }, { yellow: 45 },
  ],
  'plains-vest-t2': [
    { yellow: 36 }, { yellow: 90 }, { yellow: 144 }, { yellow: 234 }, { yellow: 396 },
  ],
  'plains-charm-t2': [
    { yellow: 18 }, { yellow: 45 }, { yellow: 72 }, { yellow: 117 }, { yellow: 198 },
  ],
  'plains-boots-t2': [
    { yellow: 12 }, { yellow: 30 }, { yellow: 48 }, { yellow: 78 }, { yellow: 132 },
  ],
  'swamp-vest-t1': [
    { purple: 20 }, { purple: 45 }, { purple: 70 }, { purple: 115 }, { purple: 150 },
  ],
  'swamp-charm-t1': [
    { purple: 10 }, { purple: 25 }, { purple: 40 }, { purple: 60 }, { purple: 75 },
  ],
  'swamp-boots-t1': [
    { purple: 10 }, { purple: 15 }, { purple: 25 }, { purple: 40 }, { purple: 55 },
  ],
  'swamp-vest-t2': [
    { purple: 45 }, { purple: 113 }, { purple: 180 }, { purple: 293 }, { purple: 494 },
  ],
  'swamp-charm-t2': [
    { purple: 18 }, { purple: 45 }, { purple: 72 }, { purple: 117 }, { purple: 198 },
  ],
  'swamp-boots-t2': [
    { purple: 12 }, { purple: 30 }, { purple: 48 }, { purple: 78 }, { purple: 132 },
  ],
  'swamp-vest-t3': [
    { purple: 89 }, { purple: 222 }, { purple: 355 }, { purple: 577 }, { purple: 975 },
  ],
  'swamp-charm-t3': [
    { purple: 36 }, { purple: 89 }, { purple: 142 }, { purple: 231 }, { purple: 390 },
  ],
  'swamp-boots-t3': [
    { purple: 24 }, { purple: 59 }, { purple: 94 }, { purple: 153 }, { purple: 258 },
  ],
  'tundra-vest-t3': [
    { blue: 66, red: 17 },
    { blue: 166, red: 42 },
    { blue: 266, red: 66 },
    { blue: 432, red: 108 },
    { blue: 730, red: 182 },
  ],
  'tundra-charm-t3': [
    { blue: 28, purple: 10 },
    { blue: 71, purple: 24 },
    { blue: 114, purple: 38 },
    { blue: 185, purple: 62 },
    { blue: 314, purple: 104 },
  ],
  'tundra-boots-t3': [
    { blue: 24 }, { blue: 59 }, { blue: 94 }, { blue: 153 }, { blue: 260 },
  ],
  'tundra-vest-t4': [
    { blue: 130, red: 33 },
    { blue: 326, red: 82 },
    { blue: 522, red: 131 },
    { blue: 849, red: 212 },
    { blue: 1436, red: 359 },
  ],
  'tundra-charm-t4': [
    { blue: 65, purple: 9 },
    { blue: 163, purple: 22 },
    { blue: 260, purple: 36 },
    { blue: 423, purple: 58 },
    { blue: 716, purple: 98 },
  ],
  'tundra-charm-t4-deepfreeze': [
    { blue: 65, purple: 9 },
    { blue: 163, purple: 22 },
    { blue: 260, purple: 36 },
    { blue: 423, purple: 58 },
    { blue: 716, purple: 98 },
  ],
  'tundra-boots-t4': [
    { blue: 47 }, { blue: 116 }, { blue: 186 }, { blue: 303 }, { blue: 512 },
  ],
  'desert-vest-t2': [
    { purple: 19, yellow: 29 },
    { purple: 48, yellow: 72 },
    { purple: 77, yellow: 115 },
    { purple: 125, yellow: 187 },
    { purple: 211, yellow: 317 },
  ],
  'desert-charm-t2': [
    { purple: 8, yellow: 15 },
    { purple: 19, yellow: 39 },
    { purple: 31, yellow: 62 },
    { purple: 50, yellow: 101 },
    { purple: 84, yellow: 171 },
  ],
  'desert-boots-t2': [
    { yellow: 15 }, { yellow: 37 }, { yellow: 60 }, { yellow: 97 }, { yellow: 165 },
  ],
  'desert-vest-t3': [
    { purple: 19, yellow: 76 },
    { purple: 47, yellow: 190 },
    { purple: 76, yellow: 303 },
    { purple: 123, yellow: 493 },
    { purple: 209, yellow: 834 },
  ],
  'desert-charm-t3': [
    { purple: 9, yellow: 38 },
    { purple: 24, yellow: 95 },
    { purple: 38, yellow: 152 },
    { purple: 62, yellow: 246 },
    { purple: 104, yellow: 417 },
  ],
  'desert-boots-t3': [
    { yellow: 31 }, { yellow: 77 }, { yellow: 124 }, { yellow: 201 }, { yellow: 341 },
  ],
  'desert-vest-t4': [
    { purple: 38, yellow: 153 },
    { purple: 95, yellow: 382 },
    { purple: 152, yellow: 610 },
    { purple: 248, yellow: 991 },
    { purple: 419, yellow: 1677 },
  ],
  'desert-charm-t4': [
    { purple: 19, yellow: 76 },
    { purple: 47, yellow: 190 },
    { purple: 76, yellow: 303 },
    { purple: 123, yellow: 493 },
    { purple: 209, yellow: 834 },
  ],
  'desert-boots-t4': [
    { yellow: 61 }, { yellow: 153 }, { yellow: 245 }, { yellow: 398 }, { yellow: 673 },
  ],
  'volcanic-vest-t3': [
    { red: 58, yellow: 20 },
    { red: 146, yellow: 50 },
    { red: 234, yellow: 80 },
    { red: 380, yellow: 130 },
    { red: 646, yellow: 218 },
  ],
  'volcanic-charm-t3': [
    { red: 30, yellow: 10 },
    { red: 75, yellow: 25 },
    { red: 120, yellow: 40 },
    { red: 195, yellow: 65 },
    { red: 330, yellow: 110 },
  ],
  'volcanic-boots-t3': [
    { red: 24 }, { red: 61 }, { red: 97 }, { red: 158 }, { red: 266 },
  ],
  'volcanic-vest-t4': [
    { red: 126, yellow: 32 },
    { red: 316, yellow: 79 },
    { red: 506, yellow: 126 },
    { red: 822, yellow: 205 },
    { red: 1390, yellow: 347 },
  ],
  'volcanic-vest-t4-lavatempered': [
    { red: 126, yellow: 32 },
    { red: 316, yellow: 79 },
    { red: 506, yellow: 126 },
    { red: 822, yellow: 205 },
    { red: 1390, yellow: 347 },
  ],
  'volcanic-charm-t4': [
    { red: 62, yellow: 16 },
    { red: 156, yellow: 39 },
    { red: 250, yellow: 62 },
    { red: 406, yellow: 101 },
    { red: 686, yellow: 172 },
  ],
  'volcanic-boots-t4': [
    { red: 48 }, { red: 120 }, { red: 192 }, { red: 311 }, { red: 526 },
  ],
  'graveyard-vest-t4': [
    { purple: 180 }, { purple: 450 }, { purple: 719 }, { purple: 1169 }, { purple: 1978 },
  ],
  'graveyard-vest-t4-debtward': [
    { purple: 180 }, { purple: 450 }, { purple: 719 }, { purple: 1169 }, { purple: 1978 },
  ],
  'graveyard-charm-t4': [
    { purple: 73 }, { purple: 183 }, { purple: 292 }, { purple: 475 }, { purple: 803 },
  ],
  'graveyard-charm-t4-gravetide': [
    { purple: 73 }, { purple: 183 }, { purple: 292 }, { purple: 475 }, { purple: 803 },
  ],
  'graveyard-boots-t4': [
    { purple: 50 }, { purple: 125 }, { purple: 200 }, { purple: 326 }, { purple: 551 },
  ],
  'trench-vest-t4': [
    { green: 185 }, { green: 462 }, { green: 739 }, { green: 1200 }, { green: 2030 },
  ],
  'trench-charm-t4': [
    { green: 73 }, { green: 183 }, { green: 292 }, { green: 475 }, { green: 803 },
  ],
  'trench-boots-t4-stalkers': [
    { green: 50 }, { green: 125 }, { green: 200 }, { green: 326 }, { green: 551 },
  ],
  'trench-boots-t4-treaders': [
    { green: 50 }, { green: 125 }, { green: 200 }, { green: 326 }, { green: 551 },
  ],
};

/** Sum of the authored per-step costs for every level up to and including `plus`. */
export function gearUpgradeRefundFor(
  itemId: string,
  plus: number,
): Partial<Record<EssenceType, number>> {
  const steps = GEAR_UPGRADE_REFUND_TABLE[itemId];
  if (!steps || plus <= 0) return {};
  const refund: Partial<Record<EssenceType, number>> = {};
  for (let i = 0; i < plus && i < steps.length; i++) {
    for (const [type, amount] of Object.entries(steps[i]) as [EssenceType, number][]) {
      refund[type] = (refund[type] ?? 0) + (amount ?? 0);
    }
  }
  return refund;
}
