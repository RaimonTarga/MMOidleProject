import {
  DURABLE_MELEE_BOSS_GEAR,
  genericRangedProgression,
} from "./t1GearPlans";
import { makeT1Route, type T1RouteConfig } from "./t1RouteBuilder";

export const CONDUIT_T1_CONFIG: T1RouteConfig = {
  id: "conduit-t1",
  version: "2.0.0",
  classRoot: "summoner-root",
  frameId: "summoner-balanced",
  description:
    "Controlled Conduit ranged baseline: Chaotic Axe gear identity, formation-normalized Sweep adapter, Orbit from Mountain L3, and Step Back from Cave L2.",
  movementProfile: "ranged-orbit",
  bossDefenseProfile: "dodge-counterplay",
  progression: genericRangedProgression(),
  bossGear: DURABLE_MELEE_BOSS_GEAR,
};

export const CONDUIT_T1 = makeT1Route(CONDUIT_T1_CONFIG);
