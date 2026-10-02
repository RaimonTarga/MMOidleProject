import type { EssenceType } from '@mmo-idle/shared';

/**
 * Progression rework Phase 2b — the weapon +N ladder is deleted (the lineage tree
 * owns weapon progression now), so every weapon recipe's `upgrades[]` step array is
 * gone from `shared/src/data/recipes/`. A save written before this phase can still
 * hold `holdsInventory.itemUpgrades[weaponId] > 0`, which is now unspendable (the
 * weapon is worn/owned regardless via `equipment`/`lineages`, so nothing is lost
 * there — see `lineageSync`), but the essence the player spent reaching that level
 * should not simply vanish.
 *
 * This is a frozen historical record of exactly what `shared/src/data/recipes/*`
 * authored per weapon per level immediately before the ladder was deleted (commit
 * `d5f7494b`), one entry per `+1..+5` step, essence-only (catalyst costs were
 * already essence-free on every weapon by the time this table was captured —
 * see commit `f165a8b3`). It exists ONLY to compute a one-time refund during
 * playerRepo hydration (`refundWeaponUpgradeEssence`) and must never be read for
 * anything else: it does not track balance changes to non-weapon recipes, and a
 * new weapon added after this phase has no entry (and therefore refunds nothing,
 * which is correct — it was never on the old ladder to begin with).
 */
export const WEAPON_UPGRADE_REFUND_TABLE: Readonly<
  Record<string, ReadonlyArray<Partial<Record<EssenceType, number>>>>
> = {
  'iron-broadsword': [
    { yellow: 10 }, { yellow: 25 }, { yellow: 35 }, { yellow: 60 }, { yellow: 75 },
  ],
  'knight-steelsword': [
    { yellow: 27 }, { yellow: 68 }, { yellow: 108 }, { yellow: 176 }, { yellow: 296 },
  ],
  'flash-rapier': [
    { green: 25 }, { green: 50 }, { green: 75 }, { green: 125 }, { green: 155 },
  ],
  'gale-needle': [
    { green: 38 }, { green: 94 }, { green: 150 }, { green: 244 }, { green: 414 },
  ],
  'heavy-hammer': [
    { blue: 25 }, { blue: 45 }, { blue: 75 }, { blue: 125 }, { blue: 155 },
  ],
  'quake-hammer': [
    { blue: 47 }, { blue: 117 }, { blue: 187 }, { blue: 304 }, { blue: 515 },
  ],
  'chaotic-axe': [
    { red: 25 }, { red: 45 }, { red: 75 }, { red: 125 }, { red: 155 },
  ],
  'ruinous-axe': [
    { red: 44 }, { red: 110 }, { red: 177 }, { red: 287 }, { red: 486 },
  ],
  'cave-cataclysm-axe': [
    { red: 88 }, { red: 221 }, { red: 353 }, { red: 574 }, { red: 972 },
  ],
  'ashbrand-blade': [
    { purple: 20 }, { purple: 45 }, { purple: 70 }, { purple: 115 }, { purple: 150 },
  ],
  'swamp-mirebrand': [
    { purple: 47 }, { purple: 117 }, { purple: 187 }, { purple: 304 }, { purple: 515 },
  ],
  'swamp-blightbrand': [
    { purple: 93 }, { purple: 233 }, { purple: 372 }, { purple: 605 }, { purple: 1025 },
  ],
  'mountain-avalanche-maul': [
    { blue: 93 }, { blue: 233 }, { blue: 372 }, { blue: 605 }, { blue: 1025 },
  ],
  'mountain-earthsunder-maul': [
    { blue: 185 }, { blue: 463 }, { blue: 741 }, { blue: 1204 }, { blue: 2039 },
  ],
  'mountain-warmaul': [
    { blue: 186 }, { blue: 465 }, { blue: 744 }, { blue: 1208 }, { blue: 2045 },
  ],
  'jungle-stinger-rapier': [
    { green: 40 }, { green: 99 }, { green: 158 }, { green: 257 }, { green: 436 },
  ],
  'jungle-venomthorn-rapier': [
    { green: 79 }, { green: 197 }, { green: 315 }, { green: 512 }, { green: 867 },
  ],
  'jungle-deathfang-rapier': [
    { green: 157 }, { green: 392 }, { green: 627 }, { green: 1018 }, { green: 1722 },
  ],
  'desert-sunsteel-cross': [
    { yellow: 48 }, { yellow: 120 }, { yellow: 192 }, { yellow: 312 }, { yellow: 528 },
  ],
  'desert-solar-cross': [
    { yellow: 97 }, { yellow: 242 }, { yellow: 388 }, { yellow: 630 }, { yellow: 1067 },
  ],
  'desert-zenith-cross': [
    { yellow: 193 }, { yellow: 483 }, { yellow: 772 }, { yellow: 1255 }, { yellow: 2122 },
  ],
  'desert-pilgrim-quarterstaff': [
    { yellow: 55 }, { yellow: 137 }, { yellow: 220 }, { yellow: 357 }, { yellow: 605 },
  ],
  'desert-sunmonk-warstaff': [
    { yellow: 109 }, { yellow: 274 }, { yellow: 438 }, { yellow: 711 }, { yellow: 1203 },
  ],
  'tundra-permafrost-maul': [
    { blue: 93 }, { blue: 233 }, { blue: 372 }, { blue: 605 }, { blue: 1023 },
  ],
  'tundra-rimebrand': [
    { blue: 93 }, { blue: 232 }, { blue: 372 }, { blue: 604 }, { blue: 1023 },
  ],
  'tundra-glacial-tyrant-maul': [
    { blue: 185 }, { blue: 463 }, { blue: 740 }, { blue: 1203 }, { blue: 2036 },
  ],
  'tundra-glacial-rimebrand': [
    { blue: 185 }, { blue: 463 }, { blue: 741 }, { blue: 1204 }, { blue: 2037 },
  ],
  'volcanic-cinderlash': [
    { red: 96 }, { red: 240 }, { red: 384 }, { red: 624 }, { red: 1056 },
  ],
  'volcanic-eruption-lash': [
    { red: 191 }, { red: 477 }, { red: 764 }, { red: 1241 }, { red: 2099 },
  ],
  'volcanic-blightbrand': [
    { red: 192 }, { red: 479 }, { red: 766 }, { red: 1245 }, { red: 2108 },
  ],
  'graveyard-plague-axe': [
    { purple: 175 }, { purple: 439 }, { purple: 702 }, { purple: 1140 }, { purple: 1930 },
  ],
  'trench-abyssal-axe': [
    { green: 175 }, { green: 439 }, { green: 702 }, { green: 1140 }, { green: 1930 },
  ],
  // primordial-club authored an empty upgrades[] (always capped at +0), so it has
  // no entry here on purpose — there is never anything to refund.
};

/** Sum of the authored per-step costs for every level up to and including `plus`. */
export function weaponUpgradeRefundFor(
  itemId: string,
  plus: number,
): Partial<Record<EssenceType, number>> {
  const steps = WEAPON_UPGRADE_REFUND_TABLE[itemId];
  if (!steps || plus <= 0) return {};
  const refund: Partial<Record<EssenceType, number>> = {};
  for (let i = 0; i < plus && i < steps.length; i++) {
    for (const [type, amount] of Object.entries(steps[i]) as [EssenceType, number][]) {
      refund[type] = (refund[type] ?? 0) + (amount ?? 0);
    }
  }
  return refund;
}
