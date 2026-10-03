import {
  ESSENCE_TYPES,
  type EssenceType,
  type TierEntryProfile,
} from "@mmo-idle/shared";

/**
 * The economic half of a tier-entry template.
 *
 * A tier-entry profile has two conceptually different halves, and conflating
 * them is how a balance campaign quietly measures nothing:
 *
 *   PERMANENT PROGRESSION — mastery, recipes, abilities, runes, gear already
 *   earned. Deterministic, derived from the canonical T1 route (see
 *   `profiles.ts`).
 *
 *   CARRYOVER ECONOMY — essence left in the wallet. This is NOT deterministic
 *   in the real game: it depends on how long the T1 boss gauntlet took, which
 *   nodes were farmed, and what the player chose not to buy. It therefore has
 *   to be an explicitly labelled MODEL, never a silent constant.
 *
 * ── Why the previous constant was replaced ────────────────────────────────
 * The first version of this harness gave every entry profile 1,500 of EVERY
 * essence. Measured against live recipe data that is not a "starting
 * wallet", it is most of a finished tier:
 *
 *   ruinous-axe (Cave T2 weapon), crafted and taken to +5 .. 1,164 red
 *   quake-hammer (Mountain T2 weapon), crafted to +5 ...... 1,222 blue
 *
 * 1,500 of a colour buys a full T2 weapon at +5 outright with change left, in
 * every colour simultaneously. Any run started from that wallet skips the
 * entire early-T2 economy, so it can report combat outcomes but cannot
 * report progression pacing, gear adoption ORDER, or resource-blocked time —
 * three of the things a T2 campaign exists to measure.
 *
 * Progression rework Phase 2b: the catalyst wallet and the "catalyst-primed"
 * entry mode it existed for are both retired — no recipe spends a catalyst
 * any more, so there is nothing left for that mode to prime.
 */
export type EntryEconomyMode = "clean" | "natural";

export interface EntryWalletModel {
  mode: EntryEconomyMode;
  essences: Record<EssenceType, number>;
  /** Human-readable provenance, copied into run artifacts. */
  derivation: string;
  /** True when the numbers came from measured run evidence rather than a model. */
  measured: boolean;
}

/**
 * The largest single +5 upgrade step a Tier-1 item asked for, per essence
 * colour — FROZEN at the values the live recipe database held when the ladder
 * was retired (design §23 for weapons, §24.5 for armour, charm and boots; the
 * last ladders left `RECIPE_DATABASE` in the 2026-10-03 course-correction run).
 *
 * This is the anchor for the Natural model below. It used to be read live so it
 * moved with retuned T1 upgrade costs; with no ladder left a live read is zero
 * in every colour and the Natural arm would silently collapse into the Clean
 * one, which is the one thing a control pair must never do. The numbers are the
 * final steps of `cave-vest-t1` (red), `mountain-vest-t1` (blue) and the
 * plains / forest / swamp T1 vests (yellow, green, purple) — the same table
 * `server/src/db/gearUpgradeRefund.ts` refunds from.
 */
const LARGEST_T1_FINAL_UPGRADE_STEP: Readonly<Record<EssenceType, number>> = {
  red: 195,
  blue: 155,
  green: 150,
  yellow: 150,
  purple: 150,
};

export function largestT1FinalUpgradeStep(): Record<EssenceType, number> {
  const worst = Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>;
  for (const type of ESSENCE_TYPES) worst[type] = LARGEST_T1_FINAL_UPGRADE_STEP[type] ?? 0;
  return worst;
}

/**
 * ⚠ UNMEASURED. This is a documented conservative MODEL, not evidence.
 *
 * Model: "the character stopped one purchase short". A T1-completing character
 * has nothing left to buy — every T1 item is at +5 and every T2 recipe gates at
 * biome level 7+, which is above the T1 level cap — so it accumulates freely
 * through the boss gauntlet and arrives with an amount that depends entirely on
 * how long that gauntlet took. Rather than invent a precise figure for a
 * quantity the game does not determine, the model holds the wallet at the size
 * of the single largest T1 purchase the character could still have been saving
 * for.
 *
 * Against live T2 costs that is deliberately small: 195 red is ~17% of the
 * 1,164 red a Cave T2 weapon needs to reach +5. A Natural-entry bot must still
 * earn essentially all of Tier 2's economy in Tier 2.
 *
 * REPLACE THIS WITH EVIDENCE when a canonical T1 run finishes: `walletFromT1Run`
 * below reads the measured closing wallet out of a run summary, and
 * `pnpm bot:t2-carryover <runDir>` prints it in this shape.
 */
export function naturalEntryWallet(): EntryWalletModel {
  const essences = largestT1FinalUpgradeStep();
  return {
    mode: "natural",
    essences,
    derivation:
      "MODEL, NOT MEASURED: per-colour = the largest single Tier-1 +5 upgrade step in " +
      "that colour, frozen at retirement of the ladder ('stopped one purchase short'). " +
      "Replace with walletFromT1Run() output once a canonical T1 run exists.",
    measured: false,
  };
}

/**
 * Zero carryover. The control arm for anything economy-shaped: every essence
 * a Clean-entry run spends in Tier 2 was earned in Tier 2, so resource-blocked
 * time and gear adoption ORDER mean what they say.
 */
export function cleanEntryWallet(): EntryWalletModel {
  return {
    mode: "clean",
    essences: Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>,
    derivation: "Zero carryover by construction — the economy-isolation control arm.",
    measured: true,
  };
}

export function entryWallet(mode: EntryEconomyMode): EntryWalletModel {
  if (mode === "clean") return cleanEntryWallet();
  return naturalEntryWallet();
}

/** Shape of the closing wallet a bot run summary records. */
export interface T1RunClosingWallet {
  essences?: Partial<Record<EssenceType, number>>;
}

/**
 * Build a MEASURED natural-entry wallet from a finished canonical Tier-1 run.
 *
 * Only a canonical run is admissible: a reward-multiplier run's closing wallet
 * is a multiple of the real one and would inflate every T2 experiment started
 * from it.
 */
export function walletFromT1Run(
  closing: T1RunClosingWallet,
  provenance: { runId: string; routeId: string; canonical: boolean },
): EntryWalletModel {
  if (!provenance.canonical) {
    throw new Error(
      `refusing to derive a carryover wallet from non-canonical run ${provenance.runId}`,
    );
  }
  return {
    mode: "natural",
    essences: Object.fromEntries(
      ESSENCE_TYPES.map((t) => [t, Math.max(0, Math.floor(closing.essences?.[t] ?? 0))]),
    ) as Record<EssenceType, number>,
    derivation: `MEASURED from canonical run ${provenance.runId} (route ${provenance.routeId}).`,
    measured: true,
  };
}

/** Apply a wallet model to a profile, returning a new profile. */
export function withWallet(profile: TierEntryProfile, wallet: EntryWalletModel): TierEntryProfile {
  return {
    ...profile,
    wallet: {
      essences: { ...wallet.essences },
    },
  };
}
