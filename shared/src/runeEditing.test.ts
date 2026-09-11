import { composeRuneEdit } from "./runeDatabase";
import type { EquippedRule } from "./runeDatabase";
const dodge: EquippedRule = {
  conditionId: "inside-telegraph",
  actionId: "step-back",
};
const chase: EquippedRule = {
  conditionId: "in-combat",
  actionId: "chase-enemy",
};
const scout: EquippedRule = {
  conditionId: "always",
  actionId: "auto-path-enemy",
};
const kite: EquippedRule = { conditionId: "in-combat", actionId: "orbit" };
function check(actual: EquippedRule[], expected: EquippedRule[]) {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error("Rune edit reordered or duplicated rules");
}
check(composeRuneEdit([dodge, scout, chase], kite, 2), [dodge, scout, kite]);
check(composeRuneEdit([dodge, scout, chase], kite, null), [dodge, scout, kite]);
check(composeRuneEdit([dodge, scout, chase], kite, 0), [scout, kite]);
check(composeRuneEdit([scout], kite, null), [scout, kite]);
console.log("runeEditing.test.ts: ok");
