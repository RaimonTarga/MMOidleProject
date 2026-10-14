/**
 * Ability recipes.
 *
 * Crafting an ability recipe LEARNS the ability permanently (adds its id to
 * `TracksProgression.knownAbilities`); the player then freely slots it into a
 * Technique / Guard slot. Recipes gate on Biome Mastery (`recipeGroup` +
 * `requiredBiomeLevel`), mirroring gear recipes. The boss channel
 * (`requiredBossClear`) is reserved for advanced/signature abilities.
 *
 * PLACEMENT RULE. Each ability is its biome's "answer tool", placed MID-BAND so
 * the player meets the biome's challenge first and then earns the response. A
 * biome that owns two abilities staggers them at level 3 and level 5 of its own
 * native band, so the second is a real second reward rather than a duplicate
 * unlock moment. Levels are the biome's OWN levels — a biome that debuts at T3
 * still counts 1..6 in its first tier (see `biomeLevelCap`).
 *
 * The Clearing deliberately teaches basic combat and equipment only: the ability
 * system begins in Tier 1.
 */
import type { EssenceType } from "./items";
import { ABILITY_DATABASE } from "./abilities";

export interface AbilityRecipe {
  id: string;
  name: string;
  description: string;
  /** The ability learned when this recipe is crafted. */
  abilityId: string;
  tier: number;
  cost: Partial<Record<EssenceType, number>>;
  /** Biome-mastery gate. */
  recipeGroup?: string;
  requiredBiomeLevel?: number;
  /** Boss gate (reserved for advanced/signature abilities). */
  requiredBossClear?: string;
}

// Costs use the biome's own essence colour.
//
// The old "roughly double per tier" ladder (25/90 → 320/380 → 650/760 → 1300/1500) is
// OBSOLETE and is NOT current policy. The T1 (2026-08-28), T2 (2026-08-29) and T3
// (2026-08-30) economy passes each repriced their tier against what an ability is
// WORTH at that tier — an ability should cost roughly one gear upgrade step, not a
// whole gear track — landing T1 at 25–90, T2 at 70–90 and T3 at 150–210, with the
// premium set by how optional the tool is rather than by its tier.
// T4 economy pass (2026-08-30): repriced off actual T4 supply (300/320/380/420),
// replacing the abandoned 1,300/1,500 ladder. Ordering within each biome (L3 < L5)
// is preserved; Disengage sits lowest as the game's only Trench escape tool (the
// same "required counterplay prices lowest" reasoning as T3's Break Free), Stunning
// Strike sits highest as the most build-warping hard CC of the four.
//
// The ability pass (design §22.2, §22.8, 2026-10-06) cut five abilities and moved
// five more. A re-homed recipe takes the slot it moves into — biome, level, the
// biome's essence colour AND the price the economy passes set for that slot — so
// no price was invented; the two additions are marked PROVISIONAL where they are.
const recipes: AbilityRecipe[] = [
  // ── T1: the fundamentals ───────────────────────────────────────────────────
  {
    id: "ability-recipe-sweep",
    name: "Sweep",
    description: "Learn the Sweep technique: arm your next attack to cleave.",
    abilityId: "sweep",
    tier: 1,
    // Plains is the swarm biome — density is the problem Sweep answers. T1
    // economy pass (2026-08-28): moved from L3 to L2 (armor's own level) so the
    // pack-pressure "answer tool" doesn't lag a full level behind the mechanic
    // it solves — mandatory counterplay must arrive at/before the threat, cheap
    // enough to be a same-level side-purchase alongside the armor.
    recipeGroup: "plains",
    requiredBiomeLevel: 2,
    cost: { yellow: 25 },
  },
  {
    id: "ability-recipe-second-wind",
    name: "Second Wind",
    description: "Learn the Second Wind guard: sharply raise your recovery when badly wounded.",
    abilityId: "second-wind",
    tier: 1,
    // Forest pressures through frequent small hits — sustain is the answer. T1
    // economy pass (2026-08-28): moved from L3 to L2 for the same reason as
    // Sweep above.
    recipeGroup: "forest",
    requiredBiomeLevel: 2,
    cost: { green: 25 },
  },
  {
    id: "ability-recipe-sidestep",
    name: "Sidestep",
    description: "Learn the Sidestep guard: slip aside, hard to hit and quick on your feet for a moment.",
    abilityId: "sidestep",
    tier: 1,
    // The ability pass (design §22.8): the Avoid Guard. Forest is the biome of
    // frequent small hits from things that dart in and out, so dodging the next
    // few is its second answer, staggered after Second Wind (L2) at the band's
    // own level 5. PROVISIONAL price: Brace's, the other burst Guard.
    recipeGroup: "forest",
    requiredBiomeLevel: 5,
    cost: { green: 45 },
  },
  {
    id: "ability-recipe-cleanse",
    name: "Cleanse",
    description: "Learn the Cleanse guard: strip the affliction that is eating you.",
    abilityId: "cleanse",
    tier: 1,
    // Swamp is attrition-by-DoT — stripping stacks is the answer. Already
    // well-placed at L3 (DoT stacking ramps in slightly after the hazard
    // terrain Avoid Hazards answers) — only the cost changed, 2026-08-28.
    recipeGroup: "swamp",
    requiredBiomeLevel: 3,
    cost: { purple: 30 },
  },
  {
    id: "ability-recipe-brace",
    name: "Brace",
    description: "Learn the Brace guard: shed the worst of one heavy blow.",
    abilityId: "brace",
    tier: 1,
    // Mountain is the telegraphed-huge-hit biome — Brace is the mitigation
    // beat. Already well-placed at L3 — only the cost changed, 2026-08-28.
    recipeGroup: "mountain",
    requiredBiomeLevel: 3,
    cost: { blue: 45 },
  },
  {
    id: "ability-recipe-slam",
    name: "Slam",
    description:
      "Learn Slam: wind up and drive the blow into the ground, striking everything around the impact.",
    abilityId: "slam",
    tier: 1,
    // Mountain again, later in its band — the biome that taught you to READ a
    // wind-up (Brace, L3) is the one that teaches you to perform one. The ability
    // pass (design §22.2) merged Power Strike into Slam and re-homed Slam here
    // from Mountain 9 (its T2 band), into Power Strike's slot and at its price.
    recipeGroup: "mountain",
    requiredBiomeLevel: 5,
    cost: { blue: 190 },
  },
  {
    id: "ability-recipe-charge",
    name: "Charge",
    description: "Learn Charge: close the gap instantly and land an empowered blow.",
    abilityId: "charge",
    tier: 1,
    // Cave is few-but-elite — closing on the one that matters is the problem. The
    // ability pass (design §22.2) re-homed Charge here from Desert 3 (T2), into
    // Expose Weakness's slot and at its price; the tutorial teaches it at the end
    // of the Cave leg.
    recipeGroup: "cave",
    requiredBiomeLevel: 3,
    cost: { red: 85 },
  },

  // ── T2: positioning, soft control, sustained mitigation ────────────────────
  {
    id: "ability-recipe-binding-strike",
    name: "Binding Strike",
    description: "Learn Binding Strike: arm your next attack to pin the target where it stands.",
    abilityId: "binding-strike",
    tier: 2,
    // Jungle swarms and chases — pinning the chaser is the answer. The ability pass
    // (design §22.2) re-homed Binding Strike here from Tundra 3 (T3), into the cut
    // Hamstring's slot and at its price: the root is the T2 control.
    recipeGroup: "jungle",
    requiredBiomeLevel: 3,
    cost: { green: 70 },
  },
  {
    id: "ability-recipe-bramble-guard",
    name: "Bramble Guard",
    description: "Learn the Bramble Guard: armor yourself with thorns that injure attackers.",
    abilityId: "bramble-guard",
    tier: 2,
    // Jungle again: high density plus an aggressive on-hit profile.
    // T2 economy pass (2026-08-29): cost dropped from 380 to match the T1
    // mandatory-counterplay philosophy (essence-only, no post-unlock grind).
    recipeGroup: "jungle",
    requiredBiomeLevel: 5,
    cost: { green: 90 },
  },
  {
    id: "ability-recipe-snipe",
    name: "Snipe",
    description: "Learn Snipe: a deliberate shot lined up far outside your usual reach.",
    abilityId: "snipe",
    tier: 2,
    // Desert: the low-density standoff biome, whose open sightlines make
    // extraordinary range legible. The ability pass (design §22.8) re-homed Snipe
    // here from Graveyard 3 (T4), into Charge's old slot and at its price: the
    // ranged opener arrives at T2, as melee's Charge arrives at T1.
    recipeGroup: "desert",
    requiredBiomeLevel: 3,
    cost: { yellow: 70 },
  },
  {
    id: "ability-recipe-endure",
    name: "Endure",
    description: "Learn Endure: modest mitigation held long enough to outlast a bad stretch.",
    abilityId: "endure",
    tier: 2,
    // Desert grinds rather than spikes — a long window beats a short one.
    // T2 economy pass (2026-08-29): cost dropped from 380, same rationale as
    // Bramble Guard.
    recipeGroup: "desert",
    requiredBiomeLevel: 5,
    cost: { yellow: 90 },
  },

  {
    id: "ability-recipe-contagion",
    name: "Contagion",
    description:
      "Learn Contagion: your next attack spreads a target's afflictions onto the enemies around it.",
    abilityId: "contagion",
    tier: 2,
    // The swamp is the game's attrition-by-DoT biome and where the brand weapons
    // live, so it is the one place a player has BOTH the damage-over-time to
    // spread and a reason to want it spread.
    //
    // DELIBERATE DEVIATION from the "an ability lives in a biome its own tier
    // introduces" pattern: every other T2 ability sits in jungle or desert. The
    // affliction pair is homed by THEME instead — the swamp owns damage over time,
    // and putting its answer tools anywhere else would be arbitrary. Detonate does
    // the same at T3.
    //
    // Swamp's T2 band is biome levels 7–12, so the band's own level 3 is 9.
    recipeGroup: "swamp",
    requiredBiomeLevel: 9,
    // T2 ability band is 70–90 (Binding Strike/Snipe 70 as mandatory counterplay,
    // Bramble Guard/Endure 90). Contagion sits at the top of it: strong and
    // broadly useful, but worth nothing to a build carrying no damage over time,
    // so it is priced as an optional power tool rather than as required counterplay.
    cost: { purple: 90 },
  },

  // ── T3: tempo, and hard movement/control counterplay ───────────────────────
  {
    id: "ability-recipe-cull",
    name: "Cull",
    description: "Learn Cull: a finishing blow that hits harder the weaker the target is.",
    abilityId: "cull",
    tier: 3,
    // Tundra is where fights grind down — finishing the worn-down is the answer.
    // The ability pass (design §22.8) homed Cull in the slot Binding Strike
    // vacated, at its price (T3 economy pass: 150, an important Technique that
    // must be affordable on arrival).
    recipeGroup: "tundra",
    requiredBiomeLevel: 3,
    cost: { blue: 150 },
  },
  {
    id: "ability-recipe-break-free",
    name: "Break Free",
    description: "Learn Break Free: tear out of hard control, even while it holds you.",
    abilityId: "break-free",
    tier: 3,
    // Tundra again: the biome that freezes you teaches the escape.
    recipeGroup: "tundra",
    requiredBiomeLevel: 5,
    // T3 economy pass: 760 → 190. Required counterplay and the tier's only escape from
    // hard control — top of the T3 ability band, but never a gear-priced wall.
    cost: { blue: 190 },
  },
  {
    id: "ability-recipe-imbue-lightning",
    name: "Imbue Lightning",
    description:
      "Learn Imbue Lightning: charge your hands so your next few strikes land with the storm.",
    abilityId: "imbue-lightning",
    tier: 3,
    // Volcano rewards burning a fight down before the ambient ramp burns you, and
    // a window that waits for your hits is worth most where every hit counts. The
    // ability pass (design §22.2) re-homed Imbue Lightning here from Jungle 15
    // (T4), into the cut Frenzy's slot and at its price.
    recipeGroup: "volcanic",
    requiredBiomeLevel: 3,
    cost: { red: 175 },
  },
  {
    id: "ability-recipe-detonate",
    name: "Detonate",
    description:
      "Learn Detonate: tear every affliction off a target at once for all the damage they had left.",
    abilityId: "detonate",
    tier: 3,
    // Swamp again, a whole TIER later rather than a level later: Contagion (T2,
    // level 9) teaches you to spread, Detonate (T3, level 17) teaches you to cash
    // in. Splitting the pair across bands is deliberate — a player meets the
    // second Technique slot at T3 and can finally hold both at once right as the
    // second half unlocks.
    recipeGroup: "swamp",
    requiredBiomeLevel: 17,
    // The priciest T3 ability: the most build-warping of the pair, and the one
    // that rewrites how a DoT build sequences a whole fight.
    cost: { purple: 210 },
  },

  // ── T4: advanced range, escape, hard CC, long sustain ──────────────────────
  {
    id: "ability-recipe-disengage",
    name: "Disengage",
    description: "Learn Disengage: break contact and buy back the room to keep fighting.",
    abilityId: "disengage",
    tier: 4,
    // The Trench presses in from every side — room is the scarce resource.
    recipeGroup: "trench",
    requiredBiomeLevel: 3,
    cost: { green: 300 },
  },
  {
    id: "ability-recipe-recuperate",
    name: "Recuperate",
    description: "Learn Recuperate: a long, steady mend that outlasts a fight's worst stretch.",
    abilityId: "recuperate",
    tier: 4,
    recipeGroup: "trench",
    requiredBiomeLevel: 5,
    cost: { green: 380 },
  },
  {
    id: "ability-recipe-stunning-strike",
    name: "Stunning Strike",
    description: "Learn Stunning Strike: a committed blow that puts the target on the floor.",
    abilityId: "stunning-strike",
    tier: 4,
    // The Wasteland keeps Stunning Strike at its own level 5 after Snipe's
    // re-home (design §22.8).
    recipeGroup: "graveyard",
    requiredBiomeLevel: 5,
    cost: { purple: 420 },
  },
];

export const ABILITY_RECIPE_DATABASE = new Map<string, AbilityRecipe>(
  recipes.map((r) => [r.id, r]),
);

/** Progression inputs that gate whether an ability recipe is unlocked yet. */
export interface AbilityRecipeGateInput {
  biomeLevel: Record<string, number>;
  bossesCleared: readonly string[];
}

/**
 * Whether the recipe's unlock requirements are met. Biome-mastery recipes gate on
 * `requiredBiomeLevel` in `recipeGroup`; advanced recipes gate on `requiredBossClear`.
 * A recipe carrying both must satisfy both. Recipes with neither are always unlocked.
 */
export function isAbilityRecipeUnlocked(
  recipe: AbilityRecipe,
  input: AbilityRecipeGateInput,
): boolean {
  if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
    if ((input.biomeLevel[recipe.recipeGroup] ?? 0) < recipe.requiredBiomeLevel) {
      return false;
    }
  }
  if (recipe.requiredBossClear) {
    if (!input.bossesCleared.includes(recipe.requiredBossClear)) return false;
  }
  return true;
}

export function validateAbilityRecipes(): string[] {
  const errors: string[] = [];
  const learned = new Set<string>();
  for (const recipe of ABILITY_RECIPE_DATABASE.values()) {
    const ability = ABILITY_DATABASE.get(recipe.abilityId);
    if (!ability) {
      errors.push(`${recipe.id} points at unknown ability ${recipe.abilityId}.`);
      continue;
    }
    // Two recipes teaching one ability would make the second permanently
    // un-craftable ("already learned") — a dead reward slot in a biome band.
    if (learned.has(recipe.abilityId)) {
      errors.push(`${recipe.abilityId} is taught by more than one recipe.`);
    }
    learned.add(recipe.abilityId);
    if (recipe.tier !== ability.tier) {
      errors.push(
        `${recipe.id} is tier ${recipe.tier} but ${ability.id} is homed at T${ability.tier}.`,
      );
    }
  }
  for (const ability of ABILITY_DATABASE.values()) {
    if (!learned.has(ability.id)) {
      errors.push(`${ability.id} has no recipe and can never be learned.`);
    }
  }
  return errors;
}
