import {
  STARTER_RUNE_IDS,
  tierEntryProfileFromT1Snapshot,
  type T1CharacterSnapshot,
} from "..";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeSnapshot(runesOwned: string[]): T1CharacterSnapshot {
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
      selectedSubVariant: null,
      selectedRange: null,
      equipment: {},
      runesOwned,
      runesEquipped: [],
      attunedAbilities: { techniques: [], guards: [] },
      itemUpgrades: {},
      inventory: [],
      knownAbilities: [],
      bossesCleared: [],
      clearedNodes: [],
      visitedNodes: [],
    } as unknown as T1CharacterSnapshot["state"],
  };
}

const imported = tierEntryProfileFromT1Snapshot(makeSnapshot([...STARTER_RUNE_IDS]));
const t1 = makeSnapshot([...STARTER_RUNE_IDS]);
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
assert(imported.frameId === "cooldown-heavy", "a T2 handoff snapshot imports");

console.log("tier1Snapshot: ok");
