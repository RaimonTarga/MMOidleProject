import {
  STARTER_RUNE_IDS,
  runeIdsFromCraftedRecipes,
  tierEntryProfileFromT1Snapshot,
  type T1CharacterSnapshot,
} from "..";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeSnapshot(runesOwned: string[], runeRecipesCrafted: string[] = []): T1CharacterSnapshot {
  return {
    schemaVersion: 1,
    snapshotKind: "tier2-handoff",
    snapshotId: "snapshot-test",
    capturedAtMs: 1,
    capturedAtIso: "1970-01-01T00:00:00.001Z",
    elapsedMs: 1,
    runId: "run-test",
    characterId: "character-test",
    characterName: "Test",
    routeId: "route-test",
    routeVersion: "1.0.0",
    policyId: "intended",
    classRoot: "cooldown-root",
    frameId: "cooldown-heavy",
    gitRevision: "revision-test",
    serverUrl: "http://server.test",
    canonicalAtCapture: true,
    economy: {} as T1CharacterSnapshot["economy"],
    state: {
      classRoot: "cooldown-root",
      frameId: "cooldown-heavy",
      playerTier: 2,
      currentSkillTier: 2,
      skillPoints: 0,
      unlockedSkills: ["cooldown-root", "cooldown-heavy"],
      activeStance: null,
      equippedStances: { default: null },
      selectedSubVariant: null,
      selectedRange: null,
      equipment: {},
      runesOwned,
      runeRecipesCrafted,
      runesEquipped: [],
      attunedAbilities: { techniques: [], guards: [] },
      itemUpgrades: {},
      inventory: [],
      knownAbilities: [],
      knownStances: [],
      knownRites: [],
      equippedRites: [],
      bossesCleared: [],
      clearedNodes: [],
      visitedNodes: [],
    } as unknown as T1CharacterSnapshot["state"],
  };
}

const crafted = ["rune-recipe-avoid-hazards", "rune-recipe-step-back"];
const derived = runeIdsFromCraftedRecipes(crafted);
const historicalStarterSubset = derived.filter((id) => id !== "target-max-stacks");
const imported = tierEntryProfileFromT1Snapshot(makeSnapshot(historicalStarterSubset, crafted));
const t1 = makeSnapshot(derived, crafted);
t1.frameId = null;
Object.assign(t1.state, { frameId: null, playerTier: 1, currentSkillTier: 1,
  unlockedSkills: [t1.classRoot], selectedSubVariant: null, selectedRange: null });
const t1Entry = tierEntryProfileFromT1Snapshot(t1, "node-clearing", 1);
assert(t1Entry.frameId === null && t1Entry.targetTier === 1, "T1 entry does not mint a frame or tier advance");
assert(JSON.stringify(t1Entry.runesEquipped) === JSON.stringify(t1.state.runesEquipped), "T1 keeps Rune order");
let rejectedT1Default = false;
try { tierEntryProfileFromT1Snapshot(t1); } catch { rejectedT1Default = true; }
assert(rejectedT1Default, "T2 importer never implicitly accepts a T1 snapshot");
for (const mutation of [
  (s: T1CharacterSnapshot) => { s.snapshotKind = "mastery-completion"; },
  (s: T1CharacterSnapshot) => { s.state.bossesCleared = ["plains:1"]; },
  (s: T1CharacterSnapshot) => { s.state.unlockedSkills.push("cooldown-heavy"); },
]) {
  const bad = structuredClone(t1); mutation(bad);
  let rejected = false;
  try { tierEntryProfileFromT1Snapshot(bad, "node-clearing", 1); } catch { rejected = true; }
  assert(rejected, "T1 entry rejects early, post-boss or mismatched skill state");
}
assert(imported.frameId === "cooldown-heavy", "historical starter additions should remain importable");
assert(
  JSON.stringify(imported.runeRecipesCrafted) === JSON.stringify(crafted),
  "import should preserve the crafted recipe list",
);

const missingCraftedRune = STARTER_RUNE_IDS;
let rejected = false;
try {
  tierEntryProfileFromT1Snapshot(makeSnapshot(missingCraftedRune, ["rune-recipe-avoid-hazards"]));
} catch {
  rejected = true;
}
assert(rejected, "a missing non-starter crafted rune must still reject the handoff");

console.log("tier1Snapshot: ok");
