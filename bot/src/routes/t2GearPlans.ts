import type { T2BiomeGroup, T2MovementProfile } from "./t2Common";

/**
 * Per-class Tier-2 equipment plans.
 *
 * ── These are HYPOTHESES, not optimizations ────────────────────────────────
 *
 * The point of the Tier-2 campaign is to find out which items builds actually
 * want. A route that simply equipped the highest-DPS weapon in every biome
 * would answer that question by assuming it, and would report 6/6 adoption of
 * whatever happens to be numerically ahead today. So each class below declares
 * an explicit, argued preference, every deviation from "take everything" is a
 * recorded SKIP, and the gear-adoption report scores the hypotheses against
 * what the runs actually did.
 *
 * The raw numbers these were argued from (live, `pnpm bot:t2-catalogue`):
 *
 *   weapon                  atk   aps    naive dps   signature mechanic
 *   knight-steelsword        18   1.00        18.0   technique cooldown -12%
 *   gale-needle               9   1.60        14.4   (none)
 *   thorn-needle          5 + 4o  1.50        13.5   on-hit damage
 *   swamp-mirebrand          18   1.00        18.0   reservoir DoT
 *   quake-hammer             47   0.55        25.9   empowered mult +26%, cast speed +15%
 *   ruinous-axe              43   1.20        51.6   dead swing every 4th
 *   jungle-stinger-rapier 10 + 8o 1.55        27.9   on-hit damage
 *   desert-sunsteel-cross    24   0.80        19.2   first strike x2, technique power +20%
 *
 * `ruinous-axe` is roughly twice the naive DPS of anything else in the tier even
 * after its dead swing (51.6 x 0.75 = 38.7). That is recorded here as a
 * SUSPECTED BALANCE FINDING, not corrected: the plans below still let each class
 * express its own identity so the campaign can measure how universal the pull
 * actually is, rather than pre-deciding it. See the known-issues section of
 * docs/t2-bot-testing-infrastructure.md.
 */

export interface T2BiomePlan {
  /** Craft AND equip. The class wants to fight with this. */
  adopt?: readonly string[];
  /** Craft but do NOT equip. Owned, judged not an upgrade over what is worn. */
  craftOnly?: readonly string[];
  /**
   * Deliberately not crafted, with the reason. Recorded as an intentional skip
   * so "0/18 adoption" can be told apart from "nobody could afford it".
   */
  skip?: Readonly<Record<string, string>>;
  /** Learn a Tier-2 ability here, replacing the named slot. */
  learn?: { recipeId: string; abilityId: string; slot: "technique" | "guard" };
}

export interface T2ClassPlan {
  classRoot: string;
  frameId: string;
  /** Short class name, used to build route ids. */
  slug: string;
  movementProfile: T2MovementProfile;
  /**
   * DEPRECATED as a route input. The ability pair is now owned by
   * `t2Loadouts.ts`, which sets it per biome from the encounter-shape policy.
   * Kept only as a record of what the class's Tier-1 template ends on.
   */
  technique: string;
  guard: string;
  /** One-line statement of what this plan predicts, for the adoption report. */
  hypothesis: string;
  biomes: Partial<Record<T2BiomeGroup, T2BiomePlan>>;
}

/**
 * Plains armor and charm are taken by nearly every plan. That is deliberate and
 * is itself the hypothesis being tested: `plains-vest-t2` is the tier's plating
 * leader (13) and arrives first, so if it turns out to be worn by everybody all
 * the way to Desert, the finding is that later armor never earns its slot.
 */
const PLAINS_CORE_KIT = ["plains-vest-t2", "plains-charm-t2", "plains-boots-t2"] as const;

const SKIP_STEELSWORD = {
  "knight-steelsword": "18 attack at 1.0 aps is below the Tier-1 weapon this class ends on; " +
    "its technique-cooldown mechanic does not pay for the DPS loss",
} as const;

export const T2_CLASS_PLANS: readonly T2ClassPlan[] = [
  // ── Striker (cadence) ────────────────────────────────────────────────────
  {
    classRoot: "cadence-root",
    frameId: "cadence-balanced",
    slug: "striker",
    movementProfile: "melee-chase",
    technique: "expose-weakness",
    guard: "second-wind",
    hypothesis:
      "Striker takes Forest speed early and swaps to the Cave axe; Mountain armor loses to " +
      "Plains plating, and Desert/Jungle offer it nothing by the time it arrives.",
    biomes: {
      plains: { adopt: PLAINS_CORE_KIT, skip: SKIP_STEELSWORD },
      forest: {
        adopt: ["gale-needle"],
        skip: {
          "forest-vest-t2": "24% evasion is strong, but Cadence already caps its worst hit; plating is worth more",
          "thorn-needle": "on-hit damage does not interact with the Cadence finisher",
        },
      },
      swamp: {
        skip: {
          "swamp-mirebrand": "a DoT weapon on a burst class -- the reservoir competes with the finisher",
          "swamp-vest-t2": "DoT resistance is a Swamp-local answer; the route leaves Swamp",
        },
      },
      mountain: {
        craftOnly: ["mountain-vest-t2"],
        skip: {
          "quake-hammer": "0.55 aps starves a hit-counter mechanic of counter ticks",
        },
      },
      cave: {
        adopt: ["ruinous-axe", "cave-vest-t2"],
        skip: { "cave-boots-t2": "stealth does not serve a class that wants to be hit into its recovery pulse" },
      },
      jungle: {
        skip: {
          "jungle-stinger-rapier": "on-hit damage suits Light on-hit builds, not a finisher class",
          "jungle-vest-t2": "strictly below cave-vest-t2 in both plating and damage reduction",
        },
      },
      desert: {
        skip: {
          "desert-sunsteel-cross": "first-strike x2 pays a fight-opening class, not a sustained-rhythm one",
          "desert-vest-t2": "arrives last and is not an upgrade on cave-vest-t2",
        },
      },
    },
  },

  // ── Squire (cooldown) ────────────────────────────────────────────────────
  {
    classRoot: "cooldown-root",
    frameId: "cooldown-heavy",
    slug: "squire",
    movementProfile: "melee-chase",
    technique: "expose-weakness",
    // Second Wind, not Brace, and this is a deliberate control decision rather
    // than an oversight. The canonical `squire-t1` route is the dodge-counterplay
    // profile and never learns Brace, so no Tier-2 entry template knows it --
    // only the separate `squire-brace-tank-t1` experiment arm does. Teaching
    // Squire (and nobody else) a new Guard at the top of Tier 2 would make
    // ability quality a second variable moving alongside biome difficulty.
    // Brace is a PROBE, not part of the baseline; see the experiment ledger.
    guard: "second-wind",
    hypothesis:
      "Squire is the one class Mountain is built for: quake-hammer's empowered multiplier rides " +
      "the execution hit, and mountain-vest's guard potency is the tier's only Guard scaler. " +
      "Desert alpha-strike is predicted to be redundant by the time it arrives.",
    biomes: {
      plains: { adopt: PLAINS_CORE_KIT, skip: SKIP_STEELSWORD },
      forest: {
        skip: {
          "gale-needle": "a 9-attack fast weapon is the worst possible fit for a per-cast burst class",
          "forest-vest-t2": "evasion is a poor fit for the heaviest plating chassis in the game",
        },
      },
      swamp: {
        adopt: ["swamp-charm-t2"],
        skip: { "swamp-mirebrand": "the DoT reservoir does not scale with the execution hit" },
      },
      mountain: {
        adopt: ["quake-hammer", "mountain-vest-t2"],
      },
      cave: {
        craftOnly: ["ruinous-axe"],
        skip: {
          "cave-vest-t2": "13% damage reduction is real, but mountain-vest is the tier's only Guard scaler",
        },
      },
      jungle: { skip: { "jungle-stinger-rapier": "fast on-hit is the opposite of this class's mechanic" } },
      desert: {
        craftOnly: ["desert-sunsteel-cross"],
        skip: { "desert-vest-t2": "cheat-death is attractive, but arrives after the run is already decided" },
      },
    },
  },

  // ── Apprentice (dot) ─────────────────────────────────────────────────────
  {
    classRoot: "dot-root",
    frameId: "dot-balanced",
    slug: "apprentice",
    movementProfile: "ranged-orbit",
    technique: "expose-weakness",
    guard: "second-wind",
    hypothesis:
      "Apprentice wants the Swamp DoT weapon its whole mechanic is built on, Swamp armor for the " +
      "attrition matchups, and Bramble Guard to compensate for the weakest AoE in the game. " +
      "Jungle and Desert are predicted to offer it almost nothing.",
    biomes: {
      plains: { adopt: PLAINS_CORE_KIT, skip: SKIP_STEELSWORD },
      forest: {
        skip: {
          "gale-needle": "raw speed without conversion does not feed a reservoir build",
          "thorn-needle": "on-hit damage is flat and does not convert into DoT",
        },
      },
      swamp: {
        adopt: ["swamp-mirebrand", "swamp-vest-t2"],
      },
      mountain: {
        craftOnly: ["quake-hammer"],
        skip: { "mountain-vest-t2": "guard potency does nothing for a class whose Guard is Second Wind" },
      },
      cave: {
        craftOnly: ["ruinous-axe"],
        skip: { "cave-vest-t2": "swamp-vest-t2's DoT resistance is the defence this build actually lacks" },
      },
      jungle: {
        learn: { recipeId: "ability-recipe-bramble-guard", abilityId: "bramble-guard", slot: "guard" },
        skip: { "jungle-stinger-rapier": "no DoT conversion; the on-hit component is wasted here" },
      },
      desert: {
        skip: {
          "desert-sunsteel-cross": "an alpha-strike weapon on the slowest-killing class in the tier",
          "desert-vest-t2": "arrives too late to change the Jungle/Desert wall",
        },
      },
    },
  },

  // ── Slinger (reload) ─────────────────────────────────────────────────────
  {
    classRoot: "reload-root",
    frameId: "reload-heavy",
    slug: "slinger",
    movementProfile: "ranged-orbit",
    technique: "expose-weakness",
    guard: "second-wind",
    hypothesis:
      "Slinger is the clearest customer for the Jungle rapier: reload's half-damage/double-speed " +
      "layer multiplies shot COUNT, so a fast on-hit weapon should be worth more to it than raw " +
      "per-hit attack. Forest armor's evasion suits a class that is meant to be shot at.",
    biomes: {
      plains: { adopt: PLAINS_CORE_KIT, skip: SKIP_STEELSWORD },
      forest: {
        adopt: ["gale-needle", "forest-vest-t2"],
        skip: {
          // Dropped from the baseline for an ORDERING reason, not a design one:
          // reconstructing it costs 53 purple, and purple is not minted until
          // Swamp -- one leg later. Asking for it here would farm green forever.
          // `pnpm bot:t2-payable` lists this class of trap.
          "thorn-needle": "unpayable on the Forest leg (needs purple, first minted in Swamp); a probe, not baseline",
        },
      },
      swamp: {
        craftOnly: ["swamp-mirebrand"],
        skip: { "swamp-vest-t2": "forest-vest-t2's evasion is the better answer for a kiting build" },
      },
      mountain: {
        skip: {
          "quake-hammer": "0.55 aps against a magazine mechanic is close to a worst case",
          "mountain-vest-t2": "plating without evasion is the wrong defence for a class that kites",
        },
      },
      cave: { craftOnly: ["ruinous-axe"] },
      jungle: {
        adopt: ["jungle-stinger-rapier"],
        craftOnly: ["jungle-vest-t2"],
      },
      desert: {
        adopt: ["desert-boots-t2"],
        skip: { "desert-sunsteel-cross": "first-strike x2 once per fight loses to sustained shot count" },
      },
    },
  },

  // ── Spirit (energy) ──────────────────────────────────────────────────────
  {
    classRoot: "energy-root",
    frameId: "energy-heavy",
    slug: "spirit",
    movementProfile: "ranged-orbit",
    technique: "expose-weakness",
    guard: "second-wind",
    hypothesis:
      "Spirit builds energy per hit, so it wants hit frequency early (Forest) and the Cave axe " +
      "once raw attack starts to matter. Cave armor's flat damage reduction protects the barrier " +
      "the class lives behind; Mountain's charm carries barrier percent and should be contested.",
    biomes: {
      plains: { adopt: PLAINS_CORE_KIT, skip: SKIP_STEELSWORD },
      forest: {
        adopt: ["gale-needle"],
        craftOnly: ["forest-vest-t2"],
      },
      swamp: { skip: { "swamp-mirebrand": "the reservoir does not charge energy" } },
      mountain: {
        adopt: ["mountain-charm-t2"],
        skip: {
          "quake-hammer": "0.55 aps is the slowest energy fill in the tier",
          "mountain-vest-t2": "guard potency does not serve Second Wind",
        },
      },
      cave: { adopt: ["ruinous-axe", "cave-vest-t2"] },
      jungle: {
        craftOnly: ["jungle-stinger-rapier"],
        skip: { "jungle-vest-t2": "below cave-vest-t2 on every axis this build uses" },
      },
      desert: {
        skip: {
          "desert-sunsteel-cross": "a discharge class wants fill rate, not one doubled opener",
          "desert-vest-t2": "arrives after the build is settled",
        },
      },
    },
  },

  // ── Conduit (summoner) ───────────────────────────────────────────────────
  {
    classRoot: "summoner-root",
    frameId: "summoner-balanced",
    slug: "conduit",
    movementProfile: "ranged-orbit",
    technique: "expose-weakness",
    guard: "second-wind",
    hypothesis:
      "OPEN QUESTION, held deliberately neutral. Conduit's damage runs through minions that " +
      "inherit player stats, so whether it prefers a slow high-attack weapon or a fast one " +
      "depends on whether inheritance is per-hit or throughput-based -- see the Conduit scaling " +
      "note. This plan takes the high-attack Cave axe and records the result rather than " +
      "guessing; the fast-weapon arm is the paired probe.",
    biomes: {
      plains: { adopt: PLAINS_CORE_KIT, skip: SKIP_STEELSWORD },
      forest: {
        craftOnly: ["gale-needle"],
        skip: { "forest-vest-t2": "the player is not the intended damage target; plating serves better" },
      },
      swamp: { skip: { "swamp-mirebrand": "minion inheritance of a reservoir DoT is unverified" } },
      mountain: {
        craftOnly: ["quake-hammer"],
        skip: { "mountain-vest-t2": "guard potency does not serve Second Wind" },
      },
      cave: { adopt: ["ruinous-axe", "cave-vest-t2"] },
      jungle: { skip: { "jungle-stinger-rapier": "held for the paired fast-weapon probe instead" } },
      desert: {
        adopt: ["desert-boots-t2"],
        skip: { "desert-sunsteel-cross": "a formation class has no single opening strike to double" },
      },
    },
  },
];

export function requireClassPlan(slug: string): T2ClassPlan {
  const plan = T2_CLASS_PLANS.find((p) => p.slug === slug);
  if (!plan) throw new Error(`unknown T2 class plan "${slug}"`);
  return plan;
}
