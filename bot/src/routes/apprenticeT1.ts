import {
  APPRENTICE_BOSS_GEAR,
  apprenticeProgression,
} from "./t1GearPlans";
import { makeT1Route, type T1RouteConfig } from "./t1RouteBuilder";

export const APPRENTICE_T1_CONFIG: T1RouteConfig = {
  id: "apprentice-t1",
  version: "2.1.0",
  classRoot: "dot-root",
  frameId: "dot-balanced",
  description:
    "Controlled Apprentice Orbit baseline: Chaotic Axe and Arcane Wrappings identity, Sweep DoT adapter, and the Cave L2 Step Back/Orbit/hazard/recovery profile.",
  movementProfile: "ranged-orbit",
  bossDefenseProfile: "dodge-counterplay",
  progression: apprenticeProgression(),
  bossGear: APPRENTICE_BOSS_GEAR,
};

export const APPRENTICE_T1 = makeT1Route(APPRENTICE_T1_CONFIG);
