import { buildKey, observedBuild, validateBuild } from "../loadout/loadout";
import { runicPointLoadoutCost, runicLoadoutFromProgression } from "@mmo-idle/shared";
import {
  ABILITY_RECIPE_DATABASE,
  STANCE_RECIPE_DATABASE, RITE_RECIPE_DATABASE, isStanceRecipeUnlocked, isRiteRecipeUnlocked,
  ESSENCE_TYPES,
  ITEM_DATABASE,
  NODE_BIOMES,
  RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  SKILL_TREE,
  biomeLevelCap,
  getMaxUpgrade,
  globalMastery,
  isAbilityRecipeUnlocked,
  isRuneRecipeUnlocked,
  requiredBiomeLevelForUpgrade,
  runeBudgetForGlobalMastery,
  runeIdsFromCraftedRecipes,
  upgradeCeilingFromGlobalMastery,
  type PlayerView,
  type TierEntryProfile,
} from "@mmo-idle/shared";

/**
 * Template self-validation.
 *
 * A tier-entry template is a hand-built claim about what a legitimately
 * progressed character looks like. Static data drifts -- recipe gates move,
 * upgrade ceilings are retuned, abilities are re-homed to other biomes -- and a
 * stale template does not announce itself: it silently produces an IMPOSSIBLE
 * character, and every experiment run from it measures a build no player could
 * ever hold. This module exists so that fails loudly instead.
 *
 * Two passes, deliberately separate:
 *
 *   `validateProfile` -- pure, offline. Is the profile internally legal against
 *                        today's static game data? Runs in CI with no server.
 *   `validateSpawn`   -- live. Did the SERVER actually produce that character?
 *                        Catches divergence between what the harness asked for
 *                        and what `applyTierEntryProfile` chose to grant, plus
 *                        stale combat state.
 */

export type ValidationSeverity = "error" | "warn";

export interface ValidationFinding {
  severity: ValidationSeverity;
  /** Stable check id, so a report can be diffed run to run. */
  check: string;
  message: string;
}

export interface ValidationReport {
  profileId: string;
  pass: boolean;
  checked: number;
  findings: ValidationFinding[];
}

class Checks {
  readonly findings: ValidationFinding[] = [];
  count = 0;

  ok(check: string, condition: unknown, message: string): boolean {
    this.count += 1;
    if (!condition) this.findings.push({ severity: "error", check, message });
    return !!condition;
  }
}

function report(profileId: string, checks: Checks): ValidationReport {
  return {
    profileId,
    pass: !checks.findings.some((f) => f.severity === "error"),
    checked: checks.count,
    findings: checks.findings,
  };
}

/** Recipes the live gates say are unlocked for this progression state. */
export function expectedUnlockedRecipes(profile: TierEntryProfile): Set<string> {
  const out = new Set<string>();
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.requiredBossClear && !profile.bossesCleared.includes(recipe.requiredBossClear)) continue;
    if (recipe.requiredBiomeLevel > (profile.biomeLevels[recipe.recipeGroup] ?? 0)) continue;
    out.add(recipe.id);
  }
  return out;
}

// -- Pass 1: pure / offline -------------------------------------------------

export function validateProfile(profile: TierEntryProfile): ValidationReport {
  const c = new Checks();
  const gm = globalMastery(profile.biomeLevels);
  const isCheckpoint = profile.checkpointKind !== undefined;

  // Identity and branch state.
  const root = SKILL_TREE.get(profile.classRoot);
  const frame = SKILL_TREE.get(profile.frameId);
  c.ok("class-root", root && root.tier === 0, `class root "${profile.classRoot}" is not a tier-0 node`);
  c.ok(
    "frame-parent",
    frame && frame.tier === 1 && frame.parent === profile.classRoot,
    `frame "${profile.frameId}" is not a tier-1 child of ${profile.classRoot}`,
  );

  // Skill-point budget. This is the check that catches "the template can never
  // buy its branch" and, equally, "the template was handed a free branch".
  c.ok(
    "skill-tier-matches-player-tier",
    profile.currentSkillTier === profile.targetTier,
    `currentSkillTier ${profile.currentSkillTier} != targetTier ${profile.targetTier}; ` +
      "the skill-tree tier a character may buy next is always its playerTier",
  );
  c.ok(
    "no-unearned-skill-points",
    profile.skillPoints === 0,
    `${profile.skillPoints} unspent skill point(s): a tier-entry character has already ` +
      "spent the point its tier advance minted",
  );

  // Spawn.
  const spawn = NODE_BIOMES[profile.spawnNodeId];
  c.ok(
    "spawn-sanctuary",
    spawn && spawn.kind === "sanctuary" && spawn.biomeTier === profile.targetTier,
    `spawn "${profile.spawnNodeId}" is not the tier-${profile.targetTier} Sanctuary`,
  );

  // Mastery: no biome may exceed what the PREVIOUS tier's cap allowed, because
  // every level was earned before the tier advance.
  for (const [group, level] of Object.entries(profile.biomeLevels)) {
    const cap = isCheckpoint
      ? biomeLevelCap(profile.targetTier, group)
      : biomeLevelCap(profile.targetTier - 1, group);
    c.ok(
      isCheckpoint ? "mastery-within-checkpoint-tier-cap" : "mastery-within-previous-tier-cap",
      level <= cap,
      `${group} level ${level} exceeds the ${isCheckpoint ? "checkpoint tier" : `tier-${profile.targetTier - 1}`} cap of ${cap}`,
    );
  }

  // Boss clears must all belong to tiers BELOW the target tier.
  for (const key of profile.bossesCleared) {
    const tier = Number(key.split(":")[1]);
    c.ok(
      "no-current-tier-boss-clears",
      Number.isFinite(tier) && tier < profile.targetTier,
      `boss clear "${key}" is at or above the target tier ${profile.targetTier}`,
    );
  }

  // Items: exist, are not from a future tier, and hold legal upgrade levels.
  const owned = new Set(
    [...profile.inventory, ...Object.values(profile.equipment)].filter(
      (id): id is string => typeof id === "string",
    ),
  );
  for (const id of owned) {
    const item = ITEM_DATABASE.get(id);
    if (!c.ok("item-exists", item, `unknown item "${id}"`)) continue;
    c.ok(
      "no-future-tier-items",
      isCheckpoint ? item!.tier <= profile.targetTier : item!.tier < profile.targetTier,
      `item "${id}" is tier ${item!.tier}; a ${isCheckpoint ? "checkpoint" : "tier-entry"} character cannot own it`,
    );
    const plus = profile.itemUpgrades[id] ?? 0;
    c.ok("upgrade-within-item", plus <= getMaxUpgrade(item!), `"${id}" +${plus} exceeds its authored steps`);
    c.ok(
      "upgrade-within-mastery-ceiling",
      plus <= upgradeCeilingFromGlobalMastery(gm, item!.tier),
      `"${id}" +${plus} exceeds the +${upgradeCeilingFromGlobalMastery(gm, item!.tier)} ceiling at Global Mastery ${gm}`,
    );
    if (plus > 0) {
      const group = RECIPE_DATABASE.get(id)?.recipeGroup ?? "";
      const need = requiredBiomeLevelForUpgrade(item!, plus);
      const have = profile.biomeLevels[group] ?? 0;
      c.ok(
        "upgrade-biome-level-met",
        have >= need,
        `"${id}" +${plus} needs ${group} level ${need}, template has ${have}`,
      );
    }
  }
  for (const id of Object.keys(profile.itemUpgrades)) {
    c.ok("upgrade-refers-to-owned-item", owned.has(id), `itemUpgrades names unowned item "${id}"`);
  }

  // Everything the template claims to have crafted must be gate-reachable.
  const unlockable = expectedUnlockedRecipes(profile);
  for (const id of owned) {
    if (!RECIPE_DATABASE.has(id)) continue;
    c.ok(
      "crafted-item-was-reachable",
      unlockable.has(id),
      `"${id}" is owned but its recipe never unlocks at this template's mastery/boss state`,
    );
  }

  // Abilities: known ones must be gate-reachable; equipped ones must be known
  // and must fit the tier's slot count.
  for (const abilityId of profile.knownAbilities) {
    const recipe = [...ABILITY_RECIPE_DATABASE.values()].find((r) => r.abilityId === abilityId);
    if (!c.ok("ability-has-recipe", recipe, `ability "${abilityId}" has no ability recipe`)) continue;
    c.ok(
      "ability-reachable",
      isAbilityRecipeUnlocked(recipe!, {
        biomeLevel: profile.biomeLevels,
        bossesCleared: profile.bossesCleared,
      }),
      `ability "${abilityId}" is not unlocked at this template's mastery`,
    );
  }
  for (const id of [...profile.attunedAbilities.techniques, ...profile.attunedAbilities.guards]) {
    c.ok("equipped-ability-known", profile.knownAbilities.includes(id), `equips unlearned ability "${id}"`);
  }

  // Runes: catalogue reachable, loadout owned, loadout within the RP budget
  // that this exact Global Mastery buys.
  const budget = runeBudgetForGlobalMastery(gm);
  for (const recipeId of profile.runeRecipesCrafted) {
    const recipe = RUNE_RECIPE_DATABASE.get(recipeId);
    if (!recipe) {
      c.ok("rune-recipe-exists", false, `unknown rune recipe "${recipeId}"`);
      continue;
    }
    c.ok(
      "rune-recipe-reachable",
      isRuneRecipeUnlocked(recipe, {
        biomeLevel: profile.biomeLevels,
        bossesCleared: profile.bossesCleared,
      }),
      `rune recipe "${recipeId}" is not unlocked at this template's mastery ` +
        `(needs ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel})`,
    );
  }
  const ownedRunes = new Set(runeIdsFromCraftedRecipes(profile.runeRecipesCrafted));
  const spent = runicPointLoadoutCost(runicLoadoutFromProgression(profile));
  for (const rule of profile.runesEquipped) {
    c.ok(
      "equipped-rune-owned",
      ownedRunes.has(rule.conditionId) && ownedRunes.has(rule.actionId),
      `rune rule ${rule.conditionId} -> ${rule.actionId} uses an unowned fragment`,
    );
  }
  c.ok(
    "rune-budget",
    spent <= budget,
    `rune loadout costs ${spent} RP, budget at Global Mastery ${gm} is ${budget}`,
  );

  // Wallet legality (finite, non-negative). Wallet SIZE is a policy choice
  // recorded in economy.ts, not a legality question, so it is not asserted here.
  for (const type of ESSENCE_TYPES) {
    const amount = profile.wallet.essences[type];
    c.ok("wallet-essence-legal", Number.isFinite(amount) && amount >= 0, `${type} essence is ${amount}`);
  }
  for (const [family, amount] of Object.entries(profile.wallet.catalysts)) {
    c.ok("wallet-catalyst-legal", Number.isFinite(amount) && amount >= 0, `${family} catalysts is ${amount}`);
  }

  for (const [known, recipes, unlocked, label] of [
    [profile.knownStances, STANCE_RECIPE_DATABASE, isStanceRecipeUnlocked, "stance"],
    [profile.knownRites, RITE_RECIPE_DATABASE, isRiteRecipeUnlocked, "rite"],
  ] as const) {
    for (const id of known) {
      const recipe = [...recipes.values()].find(r => ("stanceId" in r ? r.stanceId : r.riteId) === id);
      c.ok(label + "-reachable", recipe && ("stanceId" in recipe ? isStanceRecipeUnlocked(recipe, { biomeLevel: profile.biomeLevels, bossesCleared: profile.bossesCleared }) : isRiteRecipeUnlocked(recipe, { biomeLevel: profile.biomeLevels, bossesCleared: profile.bossesCleared })), id + " is not reachable");
    }
  }
  const build = { abilities: profile.attunedAbilities, runeRules: profile.runesEquipped,
    stances: { attuned: profile.attunedStances ?? [], default: profile.equippedStances.default }, rites: profile.equippedRites };
  const view = { knownAbilities: profile.knownAbilities, knownStances: profile.knownStances, knownRites: profile.knownRites,
    runesOwned: [...ownedRunes], globalMastery: gm, combatArchetype: profile.classRoot.replace(/-root$/, "") } as unknown as PlayerView;
  for (const issue of validateBuild(build, view)) c.ok("build-" + issue.code, false, issue.reason);

  return report(profile.id, c);
}

// -- Pass 2: live, against the character the server actually built -----------

export function validateSpawn(profile: TierEntryProfile, self: PlayerView): ValidationReport {
  const c = new Checks();

  c.ok("live-class", self.selectedClass === profile.classRoot, `class is ${self.selectedClass}`);
  c.ok(
    "live-frame",
    self.unlockedSkills.includes(profile.frameId),
    `frame ${profile.frameId} not in unlockedSkills [${self.unlockedSkills.join(", ")}]`,
  );
  c.ok(
    "live-no-branch",
    self.selectedRange === null,
    `selectedRange is "${self.selectedRange}" -- a tier-entry character has no range node yet`,
  );
  c.ok("live-tier", self.playerTier === profile.targetTier, `playerTier is ${self.playerTier}`);
  c.ok(
    "live-skill-tier",
    self.currentSkillTier === profile.currentSkillTier,
    `currentSkillTier is ${self.currentSkillTier}`,
  );
  c.ok("live-skill-points", self.skillPoints === profile.skillPoints, `skillPoints is ${self.skillPoints}`);
  c.ok("live-node", self.nodeId === profile.spawnNodeId, `spawned in ${self.nodeId}`);

  const gm = globalMastery(profile.biomeLevels);
  c.ok("live-global-mastery", self.globalMastery === gm, `Global Mastery is ${self.globalMastery}, expected ${gm}`);
  for (const [group, level] of Object.entries(profile.biomeLevels)) {
    c.ok(
      "live-biome-level",
      self.biomeLevel[group] === level,
      `${group} is ${self.biomeLevel[group]}, expected ${level}`,
    );
  }

  // The server derives unlocks from its own gates rather than trusting the
  // profile, so this is a real cross-check of harness against authority.
  const expected = expectedUnlockedRecipes(profile);
  const actual = new Set(self.unlockedRecipes);
  for (const id of expected) c.ok("live-recipe-unlocked", actual.has(id), `expected recipe "${id}" is not unlocked`);
  for (const id of actual) c.ok("live-no-extra-recipes", expected.has(id), `unexpected unlocked recipe "${id}"`);

  for (const [slot, id] of Object.entries(profile.equipment)) {
    const live = self.equipment[slot as keyof typeof self.equipment];
    c.ok("live-equipment", live === id, `${slot} is ${live}, expected ${id}`);
  }
  c.ok("live-inventory", JSON.stringify([...self.inventory].sort()) === JSON.stringify([...profile.inventory].sort()), "Inventory differs from template");
  for (const family of new Set([...Object.keys(profile.wallet.catalysts), ...Object.keys(self.catalysts)])) {
    c.ok("live-wallet-catalyst", (self.catalysts[family] ?? 0) === (profile.wallet.catalysts[family] ?? 0), `${family} catalyst wallet differs`);
  }
  for (const [id, plus] of Object.entries(profile.itemUpgrades)) {
    c.ok("live-upgrade-level", (self.itemUpgrades[id] ?? 0) === plus, `${id} is +${self.itemUpgrades[id] ?? 0}, expected +${plus}`);
  }

  for (const id of profile.knownAbilities) {
    c.ok("live-ability-known", self.knownAbilities.includes(id), `ability "${id}" not known`);
  }
  c.ok(
    "live-rune-loadout",
    self.runesEquipped.length === profile.runesEquipped.length,
    `${self.runesEquipped.length} rune rules equipped, template declared ${profile.runesEquipped.length} ` +
      "(the server drops rules it considers unowned or over budget)",
  );
  c.ok("live-exact-build", buildKey(observedBuild(self)) === buildKey({ abilities: profile.attunedAbilities,
    runeRules: profile.runesEquipped, stances: { attuned: profile.attunedStances ?? [], default: profile.equippedStances.default }, rites: profile.equippedRites }), "Server build differs from requested template");
  for (const key of ["knownAbilities", "knownStances", "knownRites", "runeRecipesCrafted"] as const) {
    c.ok("live-exact-" + key, JSON.stringify([...self[key]].sort()) === JSON.stringify([...profile[key]].sort()), key + " differs from template");
  }
  c.ok("live-rune-ownership", JSON.stringify([...self.runesOwned].sort()) === JSON.stringify(runeIdsFromCraftedRecipes(profile.runeRecipesCrafted).sort()), "Rune ownership differs");
  const budget = runeBudgetForGlobalMastery(self.globalMastery);
  const spent = runicPointLoadoutCost(runicLoadoutFromProgression(self));
  c.ok("live-rune-budget", spent <= budget, `live loadout costs ${spent} RP against a ${budget} RP budget`);

  for (const type of ESSENCE_TYPES) {
    c.ok(
      "live-wallet-essence",
      self.essences[type] === profile.wallet.essences[type],
      `${type} is ${self.essences[type]}, template declared ${profile.wallet.essences[type]}`,
    );
  }

  // No stale combat state. `applyTierEntryProfile` clears these; if any survives,
  // the run starts mid-fight and its first minutes are unreadable.
  c.ok("live-full-hp", self.hp === self.maxHp, `spawned at ${self.hp}/${self.maxHp} HP`);
  c.ok("live-no-buffs", self.activeBuffs.length === 0, `spawned carrying ${self.activeBuffs.length} buff(s)`);
  c.ok("live-no-target", self.attackTargetId === null, `spawned targeting ${self.attackTargetId}`);
  c.ok("live-auto-off", self.auto === false, "spawned with auto-combat already on");

  return report(profile.id, c);
}

/** The single grep-able line the campaign asks for, plus every finding underneath. */
export function formatValidation(label: string, r: ValidationReport): string {
  const errors = r.findings.filter((f) => f.severity === "error").length;
  const warnings = r.findings.length - errors;
  const lines = [
    `${label}: ${r.pass ? "PASS" : "FAIL"} (profile=${r.profileId}, ${r.checked} checks, ` +
      `${errors} errors, ${warnings} warnings)`,
  ];
  for (const f of r.findings) lines.push(`  [${f.severity}] ${f.check}: ${f.message}`);
  return lines.join("\n");
}
