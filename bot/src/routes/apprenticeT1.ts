import {
  APPRENTICE_BOSS_GEAR,
  apprenticeProgression,
} from "./t1GearPlans";
import { makeT1Route, type T1RouteConfig } from "./t1RouteBuilder";

export const APPRENTICE_T1_CONFIG: T1RouteConfig = {
  id: "apprentice-t1",
  version: "2.0.0",
  classRoot: "dot-root",
  description:
    "Controlled Apprentice chase baseline: Chaotic Axe and Arcane Wrappings identity, Sweep DoT adapter, and the Cave L2 Step Back/chase/hazard/recovery profile.",
  movementProfile: "apprentice-chase",
  bossDefenseProfile: "dodge-counterplay",
  progression: apprenticeProgression(),
  bossGear: APPRENTICE_BOSS_GEAR,
};

export const APPRENTICE_T1 = makeT1Route(APPRENTICE_T1_CONFIG);
