import {
  DURABLE_MELEE_BOSS_GEAR,
  genericRangedProgression,
} from "./t1GearPlans";
import { makeT1Route, type T1RouteConfig } from "./t1RouteBuilder";

export const SPIRIT_T1_CONFIG: T1RouteConfig = {
  id: "spirit-t1",
  version: "2.0.0",
  classRoot: "energy-root",
  description:
    "Controlled Spirit ranged baseline: Chaotic Axe gear identity, Orbit from Mountain L3, and Step Back from Cave L2.",
  movementProfile: "ranged-orbit",
  bossDefenseProfile: "dodge-counterplay",
  progression: genericRangedProgression(),
  bossGear: DURABLE_MELEE_BOSS_GEAR,
};

export const SPIRIT_T1 = makeT1Route(SPIRIT_T1_CONFIG);
