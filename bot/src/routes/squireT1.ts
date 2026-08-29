import {
  DURABLE_MELEE_BOSS_GEAR,
  durableMeleeProgression,
} from "./t1GearPlans";
import { makeT1Route, type T1RouteConfig } from "./t1RouteBuilder";

export const SQUIRE_T1_CONFIG: T1RouteConfig = {
  id: "squire-t1",
  version: "2.0.0",
  classRoot: "cooldown-root",
  description:
    "Controlled Squire dodge baseline: GM30 progression, Chaotic Axe gear identity, Step Back from Cave L2, and Step Back ahead of chase.",
  movementProfile: "melee-chase",
  bossDefenseProfile: "dodge-counterplay",
  progression: durableMeleeProgression(),
  bossGear: DURABLE_MELEE_BOSS_GEAR,
};

export const SQUIRE_T1 = makeT1Route(SQUIRE_T1_CONFIG);
