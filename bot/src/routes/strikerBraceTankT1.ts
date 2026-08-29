import { makeT1Route } from "./t1RouteBuilder";
import { STRIKER_T1_CONFIG } from "./strikerT1";

/** Brace A/B generated from the same progression and gear configuration as Striker dodge. */
export const STRIKER_BRACE_TANK_T1 = makeT1Route({
  ...STRIKER_T1_CONFIG,
  id: "striker-brace-tank-t1",
  version: "2.0.0",
  description:
    "Controlled Striker Brace-tank A/B: identical progression, gear, Technique, and boss order; only the declared defensive dimensions differ.",
  bossDefenseProfile: "brace-tank",
});
