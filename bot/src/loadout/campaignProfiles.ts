import type { DesiredBuild } from "./loadout";
import { T2_CLASS_PLANS } from "../routes/t2GearPlans";
import { t2Runes } from "../routes/t2Common";

/** Explicit candidates for the first Plains readiness slice, not global optima. */
export const CAMPAIGN_PROFILES = T2_CLASS_PLANS.map(plan => {
  const rules = t2Runes(plan.movementProfile);
  const build = (technique: string, stance: string | null, boss: boolean): DesiredBuild => ({
    abilities: { techniques: [technique], guards: ["second-wind"] },
    // Only the boss candidate drops environmental avoidance. It is not admitted
    // to a boss encounter until its actual hazards have been reviewed.
    runeRules: structuredClone(boss ? rules.filter(r => r.actionId !== "avoid-hazards") : rules),
    stances: { attuned: stance ? [stance] : [], default: stance },
    rites: [],
  });
  return {
    id: `${plan.slug}-campaign-v1`, classRoot: plan.classRoot, frameId: plan.frameId,
    entry: build("expose-weakness", null, false),
    farm: build("sweep", "offensive-stance", false),
    bossCandidate: build("expose-weakness", "defensive-stance", true),
  };
});
