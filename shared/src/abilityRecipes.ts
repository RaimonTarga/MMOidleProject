/**
 * Ability recipes — parallel to `RuneRecipe`.
 *
 * Crafting an ability recipe LEARNS the ability permanently (adds its id to
 * `TracksProgression.knownAbilities`); the player then freely slots it into a
 * Technique / Guard slot. Recipes gate on Biome Mastery (`recipeGroup` +
 * `requiredBiomeLevel`), mirroring gear and rune recipes. The boss channel
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
  /** Catalyst cost, parallel to `cost` (mirrors gear/rune catalyst gating). */
  catalystCost?: Partial<Record<string, number>>;
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
    id: "ability-recipe-power-strike",
    name: "Power Strike",
    description: "Learn Power Strike: wind up a heavy blow that hard control can interrupt.",
    abilityId: "power-strike",
    tier: 1,
    // Mountain again, later in its band — the biome that taught you to READ a
    // wind-up is the one that teaches you to perform one.
    recipeGroup: "mountain",
    requiredBiomeLevel: 5,
    cost: { blue: 190 },
  },
  {
    id: "ability-recipe-expose-weakness",
    name: "Expose Weakness",
    description: "Learn the Expose Weakness technique: make a target take increased damage.",
    abilityId: "expose-weakness",
    tier: 1,
    // Cave is few-but-elite — killing the big one faster is the answer. This is
    // a strong single-target Technique, NOT mandatory Cave counterplay (that's
    // %DR/Absorb/Careful Pulling/HP-Below-25%) — priced above the mandatory
    // tier accordingly, 2026-08-28.
    recipeGroup: "cave",
    requiredBiomeLevel: 3,
    cost: { red: 85 },
  },

  // ── T2: positioning, soft control, sustained mitigation ────────────────────
  {
    id: "ability-recipe-hamstring",
    name: "Hamstring",
    description: "Learn Hamstring: arm your next attack to cripple the target's stride.",
    abilityId: "hamstring",
    tier: 2,
    // Jungle swarms and chases — taking the legs out of the chase is the answer.
    // T2 economy pass (2026-08-29): cost dropped from 320 to match the T1
    // mandatory-counterplay philosophy (essence-only, no post-unlock grind).
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
    // T2 economy pass (2026-08-29): cost dropped from 380, same rationale as Hamstring.
    recipeGroup: "jungle",
    requiredBiomeLevel: 5,
    cost: { green: 90 },
  },
  {
    id: "ability-recipe-charge",
    name: "Charge",
    description: "Learn Charge: close the gap instantly and land an empowered blow.",
    abilityId: "charge",
    tier: 2,
    // Desert: the low-density standoff biome, where closing distance is the problem.
    // T2 economy pass (2026-08-29): cost dropped from 320, same rationale as Hamstring.
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
    // T2 economy pass (2026-08-29): cost dropped from 380, same rationale as Hamstring.
    recipeGroup: "desert",
    requiredBiomeLevel: 5,
    cost: { yellow: 90 },
  },

  // ── T3: tempo, and hard movement/control counterplay ───────────────────────
  {
    id: "ability-recipe-binding-strike",
    name: "Binding Strike",
    description: "Learn Binding Strike: arm your next attack to pin the target where it stands.",
    abilityId: "binding-strike",
    tier: 3,
    // Tundra is where the ground fights you — pinning something is the answer.
    recipeGroup: "tundra",
    requiredBiomeLevel: 3,
    // T3 economy pass: 650 → 150. Ordinary/important counterplay Technique; must be
    // affordable the first time Tundra roots you.
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
    id: "ability-recipe-frenzy",
    name: "Frenzy",
    description: "Learn Frenzy: a short, furious window of raw attack speed.",
    abilityId: "frenzy",
    tier: 3,
    // Volcano rewards burning a fight down before the ambient ramp burns you.
    recipeGroup: "volcanic",
    requiredBiomeLevel: 3,
    // T3 economy pass: 650 → 175. Broadly useful but optional; a small premium over
    // the pure counterplay tools.
    cost: { red: 175 },
  },
  {
    id: "ability-recipe-quick-strike",
    name: "Quick Strike",
    description: "Learn Quick Strike: a small, fast opening that is almost always ready.",
    abilityId: "quick-strike",
    tier: 3,
    recipeGroup: "volcanic",
    requiredBiomeLevel: 5,
    // T3 economy pass: 760 → 210. Genuinely optional specialised filler, so the
    // priciest of the four.
    cost: { red: 210 },
  },
  {
    id: "ability-recipe-contagion",
    name: "Contagion",
    description:
      "Learn Contagion: cast a target's afflictions outward onto the enemies around it.",
    abilityId: "contagion",
    tier: 3,
    // The swamp is the game's attrition-by-DoT biome, and it is where the brand
    // weapons live — so it is the one place a player has BOTH the damage-over-time
    // to spread and the density to spread it into. Its T3 band is biome levels
    // 13–18, so the band's own level 3 is 15.
    recipeGroup: "swamp",
    requiredBiomeLevel: 15,
    // Priced at the T3 "broadly useful but optional" tier, alongside Frenzy: a
    // real damage tool, but useless to a build carrying no DoT at all.
    cost: { purple: 175 },
  },
  {
    id: "ability-recipe-detonate",
    name: "Detonate",
    description:
      "Learn Detonate: tear every affliction off a target at once for all the damage they had left.",
    abilityId: "detonate",
    tier: 3,
    // Swamp again, at the band's level 5 — the stagger that makes the second
    // reward a real second unlock moment rather than a duplicate one. Contagion
    // teaches you to spread; Detonate teaches you to cash in.
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
    id: "ability-recipe-snipe",
    name: "Snipe",
    description: "Learn Snipe: a deliberate shot lined up far outside your usual reach.",
    abilityId: "snipe",
    tier: 4,
    // The Wasteland's open sightlines are what make extraordinary range legible.
    recipeGroup: "graveyard",
    requiredBiomeLevel: 3,
    cost: { purple: 320 },
  },
  {
    id: "ability-recipe-stunning-strike",
    name: "Stunning Strike",
    description: "Learn Stunning Strike: a committed blow that puts the target on the floor.",
    abilityId: "stunning-strike",
    tier: 4,
    recipeGroup: "graveyard",
    requiredBiomeLevel: 5,
    cost: { purple: 420 },
  },
  {
    id: "ability-recipe-imbue-lightning",
    name: "Imbue Lightning",
    description:
      "Learn Imbue Lightning: charge your hands so your next few strikes land with the storm.",
    abilityId: "imbue-lightning",
    tier: 4,
    // The jungle's T4 band is biome levels 13–18 (it debuts at T2), so the band's
    // own level 3 is 15. Homed here because the jungle is the density-and-tempo
    // biome: a charge window that does not expire is worth most where fights are
    // fast, frequent, and interrupted by the next pack.
    recipeGroup: "jungle",
    requiredBiomeLevel: 15,
    // Mid-band T4 pricing, between Disengage (300) and Snipe (320): a strong
    // generic damage window, but one that asks you to spend a slot on setup.
    cost: { green: 320 },
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
