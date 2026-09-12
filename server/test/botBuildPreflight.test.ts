import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { CLEARING_NODE_ID, GAME_CONFIG, emptyEquipment, emptyAttunedAbilities, emptyEquippedStances,
  STANCE_RECIPE_DATABASE, RITE_RECIPE_DATABASE, TEST_ROOM_NODE_ID,
  type ClientToServerEvents, type ServerToClientEvents } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { registerPlayerHandlers, type PlayerHandlerDeps } from "../src/net/playerHandlers";
import { BotConnection } from "../../bot/src/net/connection";
import { Intents } from "../../bot/src/net/intents";
import { Observation } from "../../bot/src/state/observation";
import { applyBuild, type BuildControl } from "../../bot/src/loadout/apply";
import { observedBuild, buildKey, buildRP, validateBuild, BuildError, type DesiredBuild } from "../../bot/src/loadout/loadout";
import { TIER_ENTRY_PROFILES } from "../../bot/src/tierEntry/profiles";
import { validateSpawn } from "../../bot/src/tierEntry/validate";
import { RouteExecutor } from "../../bot/src/route/executor";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { ROUTES } from "../../bot/src/routes";
import { runBot } from "../../bot/src/botRun";
import { buildConfig } from "../../bot/src/config";
const emptyEssences = { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 };
function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "tier-entry-player", name: "Tier Entry" },
    hasPosition: {
      current: { x: 1, y: 1 },
      nodeId: CLEARING_NODE_ID,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { ...emptyEssences },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      visitedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: emptyAttunedAbilities(),
      knownStances: [],
      equippedStances: emptyEquippedStances(),
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}


async function main() {
  initCombatSystems();
  const http = createServer();
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(http);
  const world = new World();
  let saved: PersistedPlayerSlices | undefined;
  let publish = true;
  let sends = 0;
  io.on("connection", socket => {
    world.attachPlayerEntity(structuredClone(saved ?? makePlayerSlices()), socket.id);
    registerPlayerHandlers(socket, {
      world, db: null, session: { accountId: "preflight", characterId: null },
      sessionsBySocket: new Map(), adminControls: { emitPlayerSummaries() {} },
      socketByAccount: new Map(), inactiveSockets: new Set(), sessionStartedAtBySocket: new Map(),
      recordSessionEnd() {}, emitBossFelledState() {},
    } as unknown as PlayerHandlerDeps);
    socket.onAny(() => sends++);
    socket.on("character:create", () => socket.emit("character:createResult", { success: false, reason: "preflight preparation rejection" }));
    socket.emit("account:characters", { account: {} as any, characters: [] });
    socket.emit("state:sync", world.buildNodeDelta(world.getPlayerEntity(socket.id)!.hasPosition.nodeId, world.dirty.drain(), { resync: true }));
  });
  await new Promise<void>(resolve => http.listen(0, "127.0.0.1", resolve));
  const address = http.address(); assert(address && typeof address !== "string");
  const conn = new BotConnection('http://127.0.0.1:' + address.port, "preflight");
  const intents = new Intents(conn);
  const obs = new Observation(conn.mirror);
  const reports: Record<string, unknown>[] = [];
  const wait = async (predicate: () => boolean, what = "predicate") => {
    const deadline = Date.now() + 2500;
    while (!predicate()) {
      if (Date.now() > deadline) throw new Error('Timeout: ' + what);
      await new Promise(resolve => setTimeout(resolve, 5));
    }
  };
  const hooks = { onDelta() {}, onWorldEvents() {}, onDied() {}, onAscended() {}, onKicked() {}, onRewardMultiplier() {} };
  const timer = setInterval(() => {
    if (!publish) return;
    const dirty = world.dirty.drain();
    for (const socket of io.sockets.sockets.values()) {
      const player = world.getPlayerEntity(socket.id);
      if (player) socket.emit("node:delta", world.buildNodeDelta(player.hasPosition.nodeId, dirty, { resync: true }));
    }
  }, 25);
  const control: BuildControl = { obs, intents, wait, mutate: send => send(), report: detail => reports.push(detail) };
  try {
    await conn.connect(hooks); await wait(() => !!obs.self);
    assert.equal(obs.requireSelf().playerTier, 0);
    // Every T2 template crosses the actual dev intent, normal encoder and bot mirror.
    for (const profile of TIER_ENTRY_PROFILES.values()) {
      assert.equal((await intents.applyTierEntryProfile(profile)).success, true, profile.id);
      await wait(() => validateSpawn(profile, obs.requireSelf()).pass, profile.id);
      const route = [...ROUTES.values()].find(r => r.classRoot === profile.classRoot && r.startsFromTierEntry === 2 && r.id.endsWith("-t2-mid"));
      assert(route, "T2 route exists for each template class");
      const runes = route.steps.find(s => s.type === "configureRunes");
      const abilities = route.steps.find(s => s.type === "setAbilities");
      assert(runes?.type === "configureRunes" && abilities?.type === "setAbilities");
      await applyBuild({ ...observedBuild(obs.requireSelf()), runeRules: runes.rules,
        abilities: { techniques: abilities.techniques, guards: abilities.guards } }, control);
    }
    const initial = observedBuild(obs.requireSelf());
    const empty: DesiredBuild = { abilities: { techniques: [], guards: [] }, runeRules: [], stances: { attuned: [], default: null }, rites: [] };
    await applyBuild(empty, control);
    const abilities: DesiredBuild = { ...empty, abilities: { techniques: ["sweep", "expose-weakness"], guards: ["second-wind"] } };
    await applyBuild(abilities, control);
    assert.equal(buildKey(observedBuild(obs.requireSelf())), buildKey(abilities));
    const reversed = { ...abilities, abilities: { guards: abilities.abilities.guards, techniques: [...abilities.abilities.techniques].reverse() } };
    await applyBuild(reversed, control);
    const count = sends; await applyBuild(reversed, control); assert.equal(sends, count, "idempotent build sends nothing");
    const invalid = { ...empty, abilities: { techniques: ["missing"], guards: [] } };
    await assert.rejects(() => applyBuild(invalid, control), (e: unknown) => e instanceof BuildError && e.code === "MALFORMED_BUILD");
    assert.equal((await intents.setAbilityLoadout(invalid.abilities)).success, false, "authority rejects unknown ability without silently clearing");
    assert.equal((await intents.setAbilityLoadout({ techniques: ["brace"], guards: [] })).success, false, "wrong family rejected");
    assert.equal((await intents.setRiteLoadout(["swift-repose"])).success, false, "locked Rite rejected");
    assert.equal((await intents.setRuneLoadout([{ conditionId: "always", actionId: "use-ability", targetAbilityId: "missing" }])).success, false);
    const first = intents.setRiteLoadout([]);
    await assert.rejects(() => intents.setRiteLoadout([]), /concurrent request/);
    assert.equal((await first).success, true);
    const other = new BotConnection('http://127.0.0.1:' + address.port, "independent-preflight");
    try {
      await other.connect(hooks);
      const otherObs = new Observation(other.mirror);
      await wait(() => !!otherObs.self);
      const independentResults = await Promise.all([intents.setAbilityLoadout(reversed.abilities), new Intents(other).setAbilityLoadout(empty.abilities)]);
      assert(independentResults.every(r => r.success));
      await wait(() => buildKey(observedBuild(obs.requireSelf())) === buildKey(reversed));
      assert.deepEqual(otherObs.requireSelf().attunedAbilities, empty.abilities, "independent sockets do not share builds");
      world.detachPlayerEntity(other.id);
      const absent = new Intents(other);
      for (const send of [() => absent.setAbilityLoadout(empty.abilities), () => absent.setRuneLoadout([]),
        () => absent.setDefaultStance(null, []), () => absent.setRiteLoadout([]),
        () => absent.craftStanceRecipe("stance-recipe-offensive"), () => absent.craftRiteRecipe("rite-recipe-swift-repose")]) {
        const result = await send();
        assert.equal(result.success, false);
        assert.equal(result.reason, "Not available while dead or disconnected.");
      }
    } finally { other.disconnect(); }
    // Dev fixture ONLY: use the existing test-room forge for later unlocks.
    const player = world.getPlayerEntity(conn.id)!;
    player.hasPosition.nodeId = TEST_ROOM_NODE_ID;
    const stanceRecipe = [...STANCE_RECIPE_DATABASE.values()].find(r => r.stanceId === "offensive-stance")!;
    assert.equal((await intents.craftStanceRecipe(stanceRecipe.id)).success, true);
    const riteRecipe = [...RITE_RECIPE_DATABASE.values()].find(r => r.riteId === "swift-repose")!;
    assert.equal((await intents.craftRiteRecipe(riteRecipe.id)).success, true);
    await wait(() => obs.self?.knownRites.includes("swift-repose") === true);
    const build: DesiredBuild = { ...empty, abilities: { techniques: ["sweep"], guards: [] },
      stances: { attuned: ["offensive-stance"], default: "offensive-stance" }, rites: ["swift-repose"],
      runeRules: [{ conditionId: "always", actionId: "switch-stance", targetStanceId: "no-stance" },
        { conditionId: "always", actionId: "use-ability", targetAbilityId: "sweep" }] };
    assert.deepEqual(validateBuild(build, obs.requireSelf()), []);
    // Exercise the route dispatch too, not just the standalone controller.
    const executor = new RouteExecutor({ obs, intents, recorder: { now: () => 0, emit: (e: any) => reports.push(e.detail), milestones: new Map() },
      route: { milestones: [] }, aborted: () => false, awaitAlive: async () => {} } as any);
    await (executor as any).runStep({ type: "configureBuild", build });
    assert.equal(buildKey(observedBuild(obs.requireSelf())), buildKey(build));
    assert(buildRP(build).total > 0);
    const over = { ...build, runeRules: Array.from({ length: 40 }, () => ({ conditionId: "always", actionId: "use-ability", targetAbilityId: "sweep" })) };
    assert(validateBuild(over, obs.requireSelf()).some(i => i.code === "INSUFFICIENT_RP"));
    assert.equal((await intents.setRuneLoadout(over.runeRules)).success, false);
    // Genuine Rune arbitration and stance switching through World.tick.
    intents.setAuto(true); await wait(() => obs.self?.auto === true);
    for (let i = 0; i < 25; i++) world.tick(100, Date.now() + i * 100);
    await wait(() => obs.self?.activeStance === null, "Rune stance switch");
    publish = false;
    conn.mirror.reset();
    intents.requestSync();
    await wait(() => !!obs.self, "explicit full state resync");
    assert.equal(buildKey(observedBuild(obs.requireSelf())), buildKey(build));
    publish = true;
    // Snapshot persistent slices, then reattach under a new socket id; no old mirror survives.
    saved = structuredClone(Object.fromEntries(["isPlayer", "hasPosition", "hasHealth", "tracksProgression", "holdsInventory", "usesSkills"].map(k => [k, (player as any)[k]]))) as PersistedPlayerSlices;
    const oldId = conn.id; conn.disconnect(); assert.equal(obs.self, null);
    await wait(() => !world.getPlayerEntity(oldId));
    await conn.connect(hooks); await wait(() => !!obs.self);
    assert.notEqual(conn.id, oldId); assert.equal(buildKey(observedBuild(obs.requireSelf())), buildKey(build));
    assert.equal((await intents.setAbilityLoadout(empty.abilities)).success, true);
    await wait(() => obs.self?.attunedAbilities.techniques.length === 0);
    assert.throws(() => (executor as any).checkMilestones(), /Verified build changed/, "unplanned build drift invalidates the treatment");
    // An accepted ack without state convergence must fail, never count as applied.
    publish = false;
    await assert.rejects(() => applyBuild(empty, control), (e: unknown) => e instanceof BuildError && e.code === "STATE_SYNC_FAILURE");
    assert(reports.some(r => r?.phase === "failed"));
    const pending = conn.request("rite:craftResult", () => {}, 2000);
    conn.disconnect();
    await assert.rejects(() => pending, /disconnected before acknowledgement/);
    await wait(() => io.sockets.sockets.size === 0);
    await assert.rejects(() => runBot(buildConfig({ route: "striker-t1", server: 'http://127.0.0.1:' + address.port,
      out: "../tmp/bot-build-preflight" })), /preflight preparation rejection/);
    await wait(() => io.sockets.sockets.size === 0, "failed preparation releases socket");
    console.log("botBuildPreflight: ok (NONCANONICAL harness validation; no balance evidence)");
  } finally {
    clearInterval(timer); conn.disconnect();
    await new Promise<void>(resolve => io.close(() => resolve()));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
