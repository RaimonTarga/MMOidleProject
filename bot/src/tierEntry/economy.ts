import {
  ESSENCE_TYPES,
  NODE_MODIFIER_FAMILIES,
  RECIPE_DATABASE,
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
 *   CARRYOVER ECONOMY — essence and catalysts left in the wallet. This is NOT
 *   deterministic in the real game: it depends on how long the T1 boss
 *   gauntlet took, which nodes were farmed, and what the player chose not to
 *   buy. It therefore has to be an explicitly labelled MODEL, never a silent
 *   constant.
 *
 * ── Why the previous constant was replaced ────────────────────────────────
 * The first version of this harness gave every entry profile 1,500 of EVERY
 * essence and 25 of EVERY catalyst family. Measured against live recipe data
 * that is not a "starting wallet", it is most of a finished tier:
 *
 *   ruinous-axe (Cave T2 weapon), crafted and taken to +5 .. 1,164 red + 3 swarming
 *   quake-hammer (Mountain T2 weapon), crafted to +5 ...... 1,222 blue + 3 heavy
 *
 * 1,500 of a colour buys a full T2 weapon at +5 outright with change left, in
 * every colour simultaneously, and 25 catalysts covers roughly eight items'
 * worth of a family that a real character mints slowly. Any run started from
 * that wallet skips the entire early-T2 economy, so it can report combat
 * outcomes but cannot report progression pacing, gear adoption ORDER, or
 * resource-blocked time — three of the things a T2 campaign exists to measure.
 */
export type EntryEconomyMode = "clean" | "natural" | "catalyst-primed";

export interface EntryWalletModel {
  mode: EntryEconomyMode;
  essences: Record<EssenceType, number>;
  catalysts: Record<string, number>;
  /** Human-readable provenance, copied into run artifacts. */
  derivation: string;
  /** True when the numbers came from measured run evidence rather than a model. */
  measured: boolean;
}

/**
 * The largest single +5 upgrade step a Tier-1 item asks for, per essence
 * colour, read live from `RECIPE_DATABASE`.
 *
 * This is the anchor for the Natural model below. It is a real in-game
 * magnitude rather than a round number, and it moves automatically when the
 * T1 upgrade costs are retuned.
 */
export function largestT1FinalUpgradeStep(): Record<EssenceType, number> {
  const worst = Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>;
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.tier !== 1) continue;
    const last = recipe.upgrades?.[recipe.upgrades.length - 1];
    if (!last) continue;
    for (const [type, amount] of Object.entries(last.cost)) {
      const key = type as EssenceType;
      if (!ESSENCE_TYPES.includes(key)) continue;
      worst[key] = Math.max(worst[key], amount as number);
    }
  }
  return worst;
}

/**
 * Catalysts held spare at entry, per family.
 *
 * Anchored the same way: the deepest single T1 upgrade step costs 1 catalyst
 * of one family, so "two spare of each" is one unspent purchase plus one, and
 * is roughly two thirds of ONE T2 item's crafted-to-+5 catalyst bill (3).
 */
const NATURAL_SPARE_CATALYSTS = 2;

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
    catalysts: Object.fromEntries(
      NODE_MODIFIER_FAMILIES.map((family) => [family, NATURAL_SPARE_CATALYSTS]),
    ),
    derivation:
      "MODEL, NOT MEASURED: per-colour = the largest single Tier-1 +5 upgrade step in " +
      "that colour, read live from RECIPE_DATABASE ('stopped one purchase short'); " +
      `catalysts = ${NATURAL_SPARE_CATALYSTS} spare per family. Replace with ` +
      "walletFromT1Run() output once a canonical T1 run exists.",
    measured: false,
  };
}

/**
 * Zero carryover. The control arm for anything economy-shaped: every essence
 * and catalyst a Clean-entry run spends in Tier 2 was earned in Tier 2, so
 * resource-blocked time and gear adoption ORDER mean what they say.
 */
export function cleanEntryWallet(): EntryWalletModel {
  return {
    mode: "clean",
    essences: Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>,
    catalysts: Object.fromEntries(NODE_MODIFIER_FAMILIES.map((f) => [f, 0])),
    derivation: "Zero carryover by construction — the economy-isolation control arm.",
    measured: true,
  };
}

/**
 * Total Tier-2 catalyst demand per family, derived live: for every Tier-2
 * recipe, the WORSE of its evolve and reconstruct catalyst costs (which path a
 * character gets is decided by its Tier-1 history, not by the route), plus every
 * `+5` upgrade step's catalyst cost.
 */
export function totalT2CatalystDemand(): Record<string, number> {
  const demand = Object.fromEntries(NODE_MODIFIER_FAMILIES.map((f) => [f, 0]));
  const sum = (cost: Partial<Record<string, number>> | undefined): number =>
    Object.values(cost ?? {}).reduce<number>((a, b) => a + (b ?? 0), 0);
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.tier !== 2) continue;
    const worst =
      sum(recipe.reconstructCatalystCost) > sum(recipe.catalystCost)
        ? recipe.reconstructCatalystCost
        : recipe.catalystCost;
    for (const cost of [worst, ...(recipe.upgrades ?? []).map((u) => u.catalystCost)]) {
      for (const [family, amount] of Object.entries(cost ?? {})) {
        demand[family] = (demand[family] ?? 0) + (amount ?? 0);
      }
    }
  }
  return demand;
}

/**
 * Clean essence, but catalyst discovery taken off the critical path.
 *
 * ── Why this arm has to exist ──────────────────────────────────────────────
 *
 * The dev reward multiplier deliberately does NOT scale catalyst progress
 * (`server/src/systems/player/progression/rewards.ts`: "a catalyst is a
 * discovery, not a currency pile"). That is right for the game and it has a
 * sharp consequence for the harness: an ACCELERATED run is not accelerated at
 * all with respect to catalysts. Measured live at 100x rewards, a Striker run
 * minted 2 alacrity catalysts in 298 seconds while banking 46,044 spare yellow.
 * Tier 2 as a whole demands roughly 99 catalysts across five families, so an
 * accelerated smoke run is CATALYST-BOUND -- the exact opposite of what an
 * accelerated run is supposed to isolate, and it would spend hours proving
 * nothing about combat or progression.
 *
 * This arm carries the whole tier's catalyst demand and no essence at all, so a
 * progression-integrity run measures recipes, gates, gear, bosses and combat
 * rather than catalyst discovery time.
 *
 * ⚠ It is NEVER admissible evidence about the economy. Catalyst supply is one of
 * the things a Tier-2 balance pass most needs to measure, and this arm deletes
 * it by construction. Use `clean` or `natural` for anything economy-shaped.
 */
export function catalystPrimedWallet(): EntryWalletModel {
  return {
    mode: "catalyst-primed",
    essences: Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>,
    catalysts: totalT2CatalystDemand(),
    derivation:
      "Zero essence; catalysts = the full derived Tier-2 demand per family (worst " +
      "acquisition path plus every +5 upgrade step). PROGRESSION-INTEGRITY ARM ONLY: " +
      "catalyst supply is deleted by construction, so this is never economy evidence.",
    measured: true,
  };
}

export function entryWallet(mode: EntryEconomyMode): EntryWalletModel {
  if (mode === "clean") return cleanEntryWallet();
  if (mode === "catalyst-primed") return catalystPrimedWallet();
  return naturalEntryWallet();
}

/** Shape of the closing wallet a bot run summary records. */
export interface T1RunClosingWallet {
  essences?: Partial<Record<EssenceType, number>>;
  catalysts?: Record<string, number>;
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
    catalysts: Object.fromEntries(
      NODE_MODIFIER_FAMILIES.map((f) => [f, Math.max(0, Math.floor(closing.catalysts?.[f] ?? 0))]),
    ),
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
      catalysts: { ...wallet.catalysts },
      catalystProgress: {},
    },
  };
}
