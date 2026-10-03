import type { Route } from "../route/types";
import { STRIKER_T1 } from "./strikerT1";

export const STRIKER_DECISIONS_T1: Route = {
  ...STRIKER_T1, id: "striker-decisions-t1", version: "1.0.0", steps: [],
  retired: "The before/after-boss upgrade decision no longer exists: the +N ladder is retired.",
  description: "Retired upgrade-timing experiment.",
};
