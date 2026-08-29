import {
  DURABLE_MELEE_BOSS_GEAR,
  durableMeleeProgression,
} from "./t1GearPlans";
import { makeT1Route, type T1RouteConfig } from "./t1RouteBuilder";

export const STRIKER_T1_CONFIG: T1RouteConfig = {
  id: "striker-t1",
  version: "3.0.0",
  classRoot: "cadence-root",
  description:
    "Controlled Striker dodge baseline: GM30 progression, Chaotic Axe gear identity, Step Back from Cave L2, and Step Back ahead of chase.",
  movementProfile: "melee-chase",
  bossDefenseProfile: "dodge-counterplay",
  progression: durableMeleeProgression(),
  bossGear: DURABLE_MELEE_BOSS_GEAR,
};

export const STRIKER_T1 = makeT1Route(STRIKER_T1_CONFIG);
