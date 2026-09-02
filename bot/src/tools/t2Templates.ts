import { globalMastery } from "@mmo-idle/shared";
import { TIER_ENTRY_PROFILES } from "../tierEntry/profiles";
import { formatValidation, validateProfile } from "../tierEntry/validate";

/**
 * Print every tier-entry template and its offline validation result.
 * `pnpm bot:t2-templates`. This is the Template Validation Report artifact.
 */
for (const p of TIER_ENTRY_PROFILES.values()) {
  const r = validateProfile(p);
  console.log(`\n=== ${p.id} ===`);
  console.log(`  class      ${p.classRoot} / ${p.frameId}`);
  console.log(`  tier       player ${p.targetTier}, skill tier ${p.currentSkillTier}, ${p.skillPoints} unspent point(s)`);
  console.log(`  spawn      ${p.spawnNodeId}`);
  console.log(`  mastery    GM ${globalMastery(p.biomeLevels)} ${JSON.stringify(p.biomeLevels)}`);
  console.log(`  seals      ${p.bossesCleared.join(", ")}`);
  console.log(`  equipped   ${JSON.stringify(p.equipment)}`);
  console.log(`  upgrades   ${JSON.stringify(p.itemUpgrades)}`);
  console.log(`  inventory  ${p.inventory.join(", ") || "(empty)"}`);
  console.log(`  abilities  known=[${p.knownAbilities.join(", ")}] equipped=T[${p.equippedAbilities.techniques.join(",")}] G[${p.equippedAbilities.guards.join(",")}]`);
  console.log(`  runes      crafted=[${p.runeRecipesCrafted.join(", ")}]`);
  for (const rule of p.runesEquipped) console.log(`             ${rule.conditionId} -> ${rule.actionId}`);
  console.log(`  wallet     essence=${JSON.stringify(p.wallet.essences)} catalysts=${JSON.stringify(p.wallet.catalysts)}`);
  console.log(`  ${formatValidation("VALIDATION", r).replace(/\n/g, "\n  ")}`);
}
