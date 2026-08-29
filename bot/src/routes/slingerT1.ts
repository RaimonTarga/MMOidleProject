import { SLINGER_BOSS_GEAR, slingerProgression } from "./t1GearPlans";
import { makeT1Route, type T1RouteConfig } from "./t1RouteBuilder";

export const SLINGER_T1_CONFIG: T1RouteConfig = {
  id: "slinger-t1",
  version: "2.0.0",
  classRoot: "reload-root",
  description:
    "Controlled Slinger ranged baseline: Poison Dagger and evasion-armor identity, Sweep clip adapter, Orbit from Mountain L3, and Step Back from Cave L2.",
  movementProfile: "ranged-orbit",
  bossDefenseProfile: "dodge-counterplay",
  progression: slingerProgression(),
  bossGear: SLINGER_BOSS_GEAR,
};

export const SLINGER_T1 = makeT1Route(SLINGER_T1_CONFIG);
