import {
  GAME_CONFIG,
  ITEM_DATABASE,
  RECIPE_DATABASE,
  catalystProgressPerUnit,
} from "@mmo-idle/shared";
import type { Observation } from "../state/observation";
import {
  conditionBlockReasons,
  craftBlockReasons,
  missingToReasons,
  reasonsToMissing,
  upgradeBlockReasons,
} from "../route/conditions";
import { Recorder } from "./recorder";
import type { BotEvent } from "./events";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

// ── T1 economy candidate C: the +5 essence transformation ────────────────────
//
// Verified against the LIVE recipe database rather than a restated table, so a
// later edit that reinflates a cost fails here.
{
  // The transformation the candidate applied: round(old * 0.75 / 5) * 5.
  const expected: Record<string, number> = {
    "chaotic-axe": 155,
    "cave-vest-t1": 195,
    "cave-charm-t1": 75,
    "cave-boots-t1": 55,
    "flash-rapier": 155,
    "forest-vest-t1": 150,
    "forest-charm-t1": 75,
    "forest-boots-t1": 45,
    "heavy-hammer": 155,
    "mountain-vest-t1": 155,
    "mountain-charm-t1": 75,
    "mountain-boots-t1": 55,
    "iron-broadsword": 75,
    "plains-vest-t1": 150,
    "plains-charm-t1": 55,
    "plains-boots-t1": 45,
    "ashbrand-blade": 150,
    "swamp-vest-t1": 150,
    "swamp-charm-t1": 75,
    "swamp-boots-t1": 55,
  };

  let seen = 0;
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.tier !== 1) continue;
    const step = recipe.upgrades?.[4];
    assert(step, `T1 recipe ${recipe.id} must author a +5 step`);
    const total = Object.values(step.cost).reduce<number>((sum, n) => sum + (n ?? 0), 0);
    const want = expected[recipe.id];
    assert(
      want !== undefined,
      `T1 recipe ${recipe.id} is not covered by the +5 cost table — extend it deliberately`,
    );
    assert(total === want, `${recipe.id} +5 essence should be ${want}, is ${total}`);
    // The candidate cut ESSENCE only. Catalyst asks stay at exactly one unit.
    for (const [family, amount] of Object.entries(step.catalystCost ?? {})) {
      assert(amount === 1, `${recipe.id} +5 should still ask for one ${family}, asks ${amount}`);
    }
    seen += 1;
  }
  assert(
    seen === Object.keys(expected).length,
    `expected ${Object.keys(expected).length} T1 +5 steps, saw ${seen}`,
  );

  // +1..+4 and the initial craft were explicitly left alone.
  const plainsVest = RECIPE_DATABASE.get("plains-vest-t1");
  assert(plainsVest?.upgrades?.[0].cost.yellow === 20, "+1 cost must be untouched");
  assert(plainsVest?.upgrades?.[3].cost.yellow === 115, "+4 cost must be untouched");
  assert(plainsVest?.cost.yellow === 20, "initial craft cost must be untouched");
  console.log("t1 +5 essence costs: ok");
}

// ── T1 catalyst rate ─────────────────────────────────────────────────────────
{
  // Candidate F (2026-09-03) raised this from candidate C's 150. See the rationale
  // on CATALYST_PROGRESS_PER_UNIT_BY_TIER in shared/src/config/gameConfig.ts.
  assert(catalystProgressPerUnit(1) === 200, "T1 must mint one catalyst per 200 kill-weight");
  assert(
    catalystProgressPerUnit(2) === GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT,
    "T2+ must fall back to the base threshold",
  );
  assert(GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT === 100, "base threshold unchanged");
  console.log("t1 catalyst rate: ok");
}

// ── Explicit block reasons ───────────────────────────────────────────────────
//
// The 2026-08-31 deep-dive could only guess essence-versus-catalyst from the
// farm node, because the block event carried a bare `{blocked:1}`. These
// assertions are the guard on that never coming back.
{
  const item = ITEM_DATABASE.get("plains-vest-t1");
  assert(item, "plains-vest-t1 must exist");

  const baseSelf = {
    essences: { yellow: 10, red: 0, green: 0, blue: 0, purple: 0 },
    catalysts: {} as Record<string, number>,
    catalystProgress: {} as Record<string, number>,
    biomeLevel: { plains: 4 } as Record<string, number>,
    globalMastery: 30,
    itemUpgrades: { "plains-vest-t1": 4 } as Record<string, number>,
    unlockedRecipes: ["plains-vest-t1"],
    inventory: ["plains-vest-t1"],
    equipment: {},
  };

  const makeObs = (self: typeof baseSelf): Observation =>
    ({
      self,
      essence: (type: string) => (self.essences as Record<string, number>)[type] ?? 0,
      catalyst: (family: string) => self.catalysts[family] ?? 0,
      biomeLevel: (group: string) => self.biomeLevel[group] ?? 0,
      itemPlus: (id: string) => self.itemUpgrades[id] ?? 0,
      recipeUnlocked: (id: string) => self.unlockedRecipes.includes(id),
      canUpgrade: () => ({ ok: false, reason: "Not enough Yellow essence (need 150)." }),
      canCraft: () => false,
    }) as unknown as Observation;

  const obs = makeObs(baseSelf);
  const reasons = upgradeBlockReasons("plains-vest-t1", obs);
  const essence = reasons.find((r) => r.kind === "essence");
  const catalyst = reasons.find((r) => r.kind === "catalyst");
  assert(essence && essence.kind === "essence", "an essence shortage must be named explicitly");
  assert(essence.essence === "yellow", "essence colour must be recorded");
  assert(
    essence.current === 10 && essence.required === 150 && essence.missing === 140,
    `essence current/required/missing must be exact, got ${JSON.stringify(essence)}`,
  );
  assert(catalyst && catalyst.kind === "catalyst", "a catalyst shortage must be named explicitly");
  assert(
    catalyst.family === "alacrity" && catalyst.required === 1 && catalyst.missing === 1,
    `catalyst family/required/missing must be exact, got ${JSON.stringify(catalyst)}`,
  );
  assert(
    !reasons.some((r) => r.kind === "globalMastery"),
    "GM 30 must not read as a blocker on a T1 +5",
  );

  const missing = reasonsToMissing(reasons);
  assert(
    missing["essence.yellow"] === 140 && missing["catalyst.alacrity"] === 1,
    `flat missing map must carry both shortfalls, got ${JSON.stringify(missing)}`,
  );
  assert(!("blocked" in missing), "the generic `blocked` marker must not come back");

  // A Global-Mastery wall is a distinct, named reason rather than an unexplained wait.
  const gmReasons = upgradeBlockReasons(
    "plains-vest-t1",
    makeObs({ ...baseSelf, globalMastery: 0 }),
  );
  const gm = gmReasons.find((r) => r.kind === "globalMastery");
  assert(
    gm && gm.kind === "globalMastery" && gm.required === 30,
    `GM block must name its requirement, got ${JSON.stringify(gmReasons)}`,
  );

  // A locked recipe is its own reason, not an essence shortage.
  const craftReasons = craftBlockReasons(
    "plains-vest-t1",
    makeObs({ ...baseSelf, unlockedRecipes: [] }),
  );
  assert(
    craftReasons.some((r) => r.kind === "recipeLocked"),
    "a locked recipe must be reported as such",
  );

  const condReasons = conditionBlockReasons(
    { type: "catalystAtLeast", family: "heavy", amount: 2 },
    obs,
  );
  assert(
    condReasons.length === 1 && condReasons[0].kind === "catalyst",
    "a condition wait must resolve to typed reasons too",
  );

  const lifted = missingToReasons({ "essence.blue": 25 }, obs);
  assert(
    lifted[0].kind === "essence" && lifted[0].missing === 25,
    "legacy shortfall maps must lift back to typed reasons",
  );
  console.log("explicit block reasons: ok");
}

// ── Wallet snapshots ─────────────────────────────────────────────────────────
{
  const written: BotEvent[] = [];
  const recorder = new Recorder(
    { write: (event: BotEvent) => written.push(event) } as never,
    Date.now(),
    () => "self",
    false,
  );
  const obs = {
    nodeId: "plains-01",
    self: {
      essences: { yellow: 42, red: 1, green: 0, blue: 0, purple: 0 },
      catalysts: { alacrity: 1 },
      catalystProgress: { alacrity: 90 },
      biomeLevel: { plains: 4 },
      globalMastery: 12,
      itemUpgrades: { "plains-vest-t1": 4 },
    },
  } as unknown as Observation;

  recorder.walletSnapshot(obs, "pre-upgrade", "plains-vest-t1+5");
  const snapshot = written.find((e) => e.kind === "wallet-snapshot");
  assert(snapshot && snapshot.kind === "wallet-snapshot", "a wallet snapshot must be emitted");
  assert(snapshot.essences.yellow === 42, "the full essence wallet must be captured");
  assert(snapshot.catalysts.alacrity === 1, "the full catalyst wallet must be captured");
  assert(
    snapshot.catalystProgress.alacrity === 90,
    "partial catalyst progress must be captured — it is the only direct read on the mint rate",
  );
  assert(
    snapshot.globalMastery === 12 && snapshot.reason === "pre-upgrade",
    "the snapshot's context must be captured",
  );
  assert(
    recorder.economyTimeline.walletSnapshots.length === 1,
    "snapshots must reach the summary timeline",
  );
  console.log("wallet snapshots: ok");
}

console.log("economyInstrumentation: ok");
