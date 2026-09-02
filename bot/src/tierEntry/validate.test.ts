import { TIER_ENTRY_PROFILES } from "./profiles";
import { formatValidation, validateProfile } from "./validate";

/**
 * The loud failure the campaign depends on.
 *
 * Every tier-entry template must be legal against TODAY's static game data. A
 * recipe re-gated, an ability re-homed, an upgrade ceiling retuned -- any of
 * those silently turns a template into an impossible character, and every
 * experiment run from it measures a build no player could hold. This test is
 * the tripwire.
 */
let failed = 0;
for (const profile of TIER_ENTRY_PROFILES.values()) {
  const report = validateProfile(profile);
  if (!report.pass) {
    failed += 1;
    console.error(formatValidation("T2_ENTRY_TEMPLATE_VALIDATION", report));
  }
}
if (failed > 0) {
  throw new Error(`assertion failed: ${failed} tier-entry template(s) are illegal`);
}
console.log(
  `T2_ENTRY_TEMPLATE_VALIDATION: PASS (${TIER_ENTRY_PROFILES.size} templates)`,
);
console.log("validate.test.ts: ok");
