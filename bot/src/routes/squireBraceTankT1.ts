import { makeT1Route } from "./t1RouteBuilder";
import { SQUIRE_T1_CONFIG } from "./squireT1";

/** Brace A/B generated from the same progression and gear configuration as Squire dodge. */
export const SQUIRE_BRACE_TANK_T1 = makeT1Route({
  ...SQUIRE_T1_CONFIG,
  id: "squire-brace-tank-t1",
  version: "2.0.0",
  description:
    "Controlled Squire Brace-tank A/B: identical progression, gear, Technique, and boss order; only the declared defensive dimensions differ.",
  bossDefenseProfile: "brace-tank",
});
