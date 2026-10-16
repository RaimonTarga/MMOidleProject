import fs from "node:fs";
import path from "node:path";
import {
  ALL_RUNE_IDS,
  CLEARING_NODE_ID,
  RECIPE_DATABASE,
  SKILL_TREE,
  STARTER_RUNE_IDS,
  bossClearKey,
  isRuneRuleCompatibleForArchetype,
  runeIdsForArchetype,
  type CombatArchetype,
  type DeltaSnapshot,
} from "@mmo-idle/shared";
import { evaluate, resolveNearCandidates, resolveNode, resolveNodeCandidates } from "./route/conditions";
import { POLICIES, requirePolicy } from "./policy/profiles";
import { CONTROLLED_ROUTE_IDS, ROUTES, classRootFor, isControlledRouteId, requireRoute } from "./routes";
import { DEFAULT_SMOKE_CLASS, SMOKE_T1_ID } from "./routes/smokeT1";
import type { Condition, NodeRef, Route, RouteStep } from "./route/types";
import { Observation, dungeonNodeFor, normalNodesFor } from "./state/observation";
import { WorldMirror } from "./state/reducer";
import { RouteExecutor, type ExecutorDeps } from "./route/executor";
import {
  assertFastRetryBatchSafety,
  buildConfig,
  controlledBatchSettings,
  normalizeOutDir,
} from "./config";
import { BOT_AUTO_PARTY_ENABLED, initialRunTaints } from "./botRun";

const ARCHETYPE_FOR_ROOT: Record<string, CombatArchetype> = {
  "cadence-root": "cadence",
  "cooldown-root": "cooldown",
  "reload-root": "reload",
  "energy-root": "energy",
  "dot-root": "dot",
  "summoner-root": "summoner",
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

// Controlled batch scheduling remains sequential by default; isolated
// concurrency is explicit and cannot be confused with the legacy parallel flag.
{
  const sequential = controlledBatchSettings({});
  assert(sequential.executionMode === "sequential", "controlled default remains sequential");
  assert(sequential.maxConcurrency === 1, "sequential mode progresses one bot");
  const isolated = controlledBatchSettings({
    executionMode: "isolated-parallel",
    maxConcurrency: "4",
  });
  assert(isolated.executionMode === "isolated-parallel", "isolated parallel is explicit");
  assert(isolated.maxConcurrency === 4, "isolated parallel honors its progress cap");
  assert(isolated.contentionPolicy === "degrade-to-shared", "isolated parallel defaults to bounded shared degradation");
  let legacyRejected = false;
  try {
    controlledBatchSettings({ parallel: "true" });
  } catch {
    legacyRejected = true;
  }
  assert(legacyRejected, "legacy uncontrolled parallel cannot masquerade as isolated parallel");

  // Staggering is a launch spread for the shared Clearing opening, not an
  // isolation mechanism, so it is only meaningful alongside real leases.
  assert(sequential.staggerMs === 0, "sequential controlled batches launch without a spread");
  assert(
    controlledBatchSettings({ executionMode: "isolated-parallel", staggerMs: "5000" }).staggerMs === 5_000,
    "isolated parallel accepts an explicit launch spread",
  );
  let staggerRejected = false;
  try {
    controlledBatchSettings({ staggerMs: "5000" });
  } catch {
    staggerRejected = true;
  }
  assert(staggerRejected, "sequential mode rejects a launch spread it cannot use");
  let negativeStaggerRejected = false;
  try {
    controlledBatchSettings({ executionMode: "isolated-parallel", staggerMs: "-1" });
  } catch {
    negativeStaggerRejected = true;
  }
  assert(negativeStaggerRejected, "a negative launch spread is rejected");
  assert(!BOT_AUTO_PARTY_ENABLED, "bot auto-party is disabled for clean evidence");

  // The flag above is only a declaration. Party membership routes a kill's
  // rewards to every same-node member (`grantMonsterRewards`), so a single
  // re-wired call would silently re-contaminate every controlled run's
  // progression evidence while every lease still looked correctly held.
  // Guard the actual source instead: `social/autoParty.ts` survives as an
  // unreferenced historical module, and must stay unreferenced.
  {
    // The runner executes bot suites with the bot package as cwd.
    const botSrc = path.join(process.cwd(), "src");
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
      });
    const sources = walk(botSrc).filter((file) => file.endsWith(".ts"));
    assert(sources.length > 0, "bot sources are discoverable for the auto-party guard");

    const autoPartyModule = path.join(botSrc, "social", "autoParty.ts");
    const intentsModule = path.join(botSrc, "net", "intents.ts");
    for (const file of sources) {
      const text = fs.readFileSync(file, "utf8");
      const relative = path.relative(botSrc, file).replace(/\\/g, "/");

      if (file !== autoPartyModule) {
        assert(
          !/from\s+["'][^"']*social\/autoParty["']/.test(text),
          `${relative} must not import the historical auto-party module`,
        );
      }
      // `intents.ts` declares the helpers; `autoParty.ts` is the quarantined
      // module itself. Any other caller is a live party intent.
      if (file === intentsModule || file === autoPartyModule || file.endsWith(".test.ts")) continue;
      assert(
        !/\.party(Join|Leave)\s*\(/.test(text),
        `${relative} must not invoke party intents in controlled runs`,
      );

      // Engagement must stay DERIVED from the server's auto-combat flag inside
      // `RouteLeaseSession.observe`. It was once toggled by hand at each travel
      // site, and the one path nobody wired -- `farmUntil`'s death-recovery walk
      // -- left the flag stuck true, so a bot walking home after dying scored a
      // false contamination against every node it crossed. There are eleven
      // navigation call sites in the executor alone; hand-wiring them is not a
      // thing anyone should attempt again.
      // `areaLeaseManager.ts` declares it; `routeLeaseSession.ts` is the single
      // derived caller. Anything else is hand-wiring.
      const engagementModule =
        relative === "concurrency/routeLeaseSession.ts" ||
        relative === "concurrency/areaLeaseManager.ts";
      if (!engagementModule) {
        assert(
          !/setEngaged\s*\(/.test(text),
          `${relative} must not set engagement by hand; it is derived per tick from obs.self.auto`,
        );
      }
    }
  }
  console.log("controlled batch modes: ok");
}

// ── The mirror is the only door to world state; it must survive real deltas ──

function snapshot(partial: Partial<DeltaSnapshot>): DeltaSnapshot {
  return {
    tick: 1,
    nodeId: CLEARING_NODE_ID,
    full: false,
    deltas: [],
    events: [],
    ...partial,
  };
}

{
  const mirror = new WorldMirror();
  mirror.ownId = "sock-1";

  mirror.apply(
    snapshot({
      full: true,
      deltas: [
        {
          kind: "add",
          netId: "sock-1",
          entityKind: "player",
          components: {
            isPlayer: { id: "sock-1", name: "Bot" },
            hasPosition: { current: { x: 10, y: 20 }, nodeId: CLEARING_NODE_ID, speed: 100 },
            hasHealth: { hp: 80, maxHp: 100, recovery: 10 },
          },
        },
        {
          kind: "add",
          netId: "mob-1",
          entityKind: "monster",
          components: { isMonster: { id: "mob-1", monsterTypeId: "tiny-slime", isBoss: false } as never },
        },
      ],
    }),
  );

  assert(mirror.entities.size === 2, "mirror ingested both entities");
  assert(mirror.kinds.get("mob-1") === "monster", "monster kind recorded");

  // A patch must merge, and `removed` must actually delete the key.
  mirror.apply(
    snapshot({
      deltas: [
        {
          kind: "patch",
          netId: "sock-1",
          components: { hasHealth: { hp: 40, maxHp: 100, recovery: 10 } },
        },
      ],
    }),
  );
  assert(mirror.entities.get("sock-1")?.hasHealth?.hp === 40, "patch merged health");
  assert(mirror.entities.get("sock-1")?.isPlayer?.name === "Bot", "patch preserved untouched slices");

  mirror.apply(snapshot({ deltas: [{ kind: "remove", netId: "mob-1" }] }));
  assert(!mirror.entities.has("mob-1"), "remove dropped the monster");

  // A FULL snapshot is authoritative for the node: stale entities must not linger,
  // or the bot keeps fighting monsters that no longer exist after a node change.
  mirror.apply(snapshot({ full: true, nodeId: "node-t1-plains-01", deltas: [] }));
  assert(mirror.entities.size < 1, "full snapshot cleared the previous node");
  assert(mirror.nodeId === "node-t1-plains-01", "full snapshot moved the node");

  console.log("mirror: ok");
}

// ── Observation exposes only player-visible state, and answers route queries ──

{
  const mirror = new WorldMirror();
  mirror.ownId = "sock-1";
  const obs = new Observation(mirror);

  assert(obs.self === null, "no self before the world admits us");

  mirror.apply(
    snapshot({
      full: true,
      deltas: [
        {
          kind: "add",
          netId: "sock-1",
          entityKind: "player",
          components: {
            isPlayer: { id: "sock-1", name: "Bot" },
            hasPosition: { current: { x: 1, y: 2 }, nodeId: CLEARING_NODE_ID, speed: 100 },
            hasHealth: { hp: 100, maxHp: 100, recovery: 10 },
            tracksProgression: {
              level: 0,
              skillPoints: 1,
              essences: { red: 0, blue: 0, green: 12, yellow: 0, purple: 0 },
              catalysts: {},
              catalystProgress: {},
              biomeXP: {},
              biomeLevel: { clearing: 2 },
              unlockedRecipes: ["primordial-club"],
              questProgress: {},
              playerTier: 1,
              currentSkillTier: 0,
              bossesCleared: [bossClearKey("plains", 1)],
              clearedNodes: [],
              visitedNodes: [],
              runesOwned: [...STARTER_RUNE_IDS],
              runesEquipped: [],
            } as never,
            // `composePlayerView` needs all six persisted/derived player slices;
            // the real `state:sync` always carries them together.
            holdsInventory: {
              inventory: [],
              equipment: {
                weapon: null,
                armor: null,
                recovery: null,
                mobility: null,
                relic: null,
              },
              itemUpgrades: {},
            } as never,
            usesSkills: {
              unlockedSkills: [],
              passives: {},
              selectedClass: null,
              selectedSubVariant: null,
              selectedRange: null,
              combatArchetype: null,
            } as never,
            dealsDamage: { attack: 10, onHitDamage: 0 } as never,
            performsAttack: {
              range: 60,
              cooldownMs: 1000,
              lastAttackAt: 0,
              attackStyle: "melee",
            } as never,
            mitigatesDamage: { plating: 0, damageReduction: 0 } as never,
          },
        },
      ],
    }),
  );

  const self = obs.self;
  assert(self !== null, "observation composed a player view");
  assert(obs.biomeLevel("clearing") === 2, "biome level readable");
  assert(obs.essence("green") === 12, "essence readable");
  assert(obs.recipeUnlocked("primordial-club"), "unlocked recipe readable");
  assert(obs.bossCleared("plains", 1), "boss clear key matches the shared helper");
  assert(!obs.bossCleared("forest", 1), "uncleared boss reads false");
  // 12 green covers the 4-green club, so the affordability check must agree.
  assert(obs.canCraft("primordial-club"), "canCraft reads real recipe costs");

  const ctx = { obs, elapsedMs: 0 };
  assert(evaluate({ type: "playerTierAtLeast", tier: 1 }, ctx), "tier condition");
  assert(!evaluate({ type: "playerTierAtLeast", tier: 2 }, ctx), "tier condition negative");
  assert(
    evaluate(
      {
        type: "allOf",
        of: [
          { type: "essenceAtLeast", essence: "green", amount: 4 },
          { type: "recipeUnlocked", recipeId: "primordial-club" },
        ],
      },
      ctx,
    ),
    "allOf composes",
  );

  console.log("observation: ok");
}

// ── Every T1 biome the routes name must actually exist on the map ───────────

{
  const T1_BIOMES = ["plains", "forest", "cave", "mountain", "swamp"];
  for (const biomeGroup of T1_BIOMES) {
    const normals = normalNodesFor(biomeGroup, 1);
    assert(normals.length > 0, `${biomeGroup} T1 has normal nodes`);
    const dungeon = dungeonNodeFor(biomeGroup, 1);
    assert(dungeon !== null, `${biomeGroup} T1 has a dungeon node`);
  }

  const mirror = new WorldMirror();
  const obs = new Observation(mirror);
  const resolved = resolveNode(
    { kind: "biome", biomeGroup: "plains", tier: 1, pick: "uncleared" },
    obs,
    0,
  );
  assert(resolved !== null, "biome ref resolves to a node id");
  assert(
    resolveNode({ kind: "dungeon", biomeGroup: "plains", tier: 1 }, obs, 0) ===
      dungeonNodeFor("plains", 1),
    "dungeon ref resolves to the dungeon node",
  );

  // Isolated-parallel scheduling reads the ORDERED candidate list. Head-of-list
  // must stay byte-identical to the solo pick, or parallel runs would quietly
  // stop being comparable with the sequential baseline they are measured against.
  for (const pick of ["first", "rotate", "uncleared"] as const) {
    for (const biomeGroup of T1_BIOMES) {
      for (const rotation of [0, 1, 3]) {
        const ref = { kind: "biome", biomeGroup, tier: 1, pick } as const;
        const candidates = resolveNodeCandidates(ref, obs, rotation);
        assert(
          candidates[0] === resolveNode(ref, obs, rotation),
          `${biomeGroup}/${pick}: candidate head is the solo pick`,
        );
        assert(
          new Set(candidates).size === candidates.length,
          `${biomeGroup}/${pick}: candidates are deduped`,
        );
        const legal = new Set(normalNodesFor(biomeGroup, 1));
        assert(
          candidates.every((nodeId) => legal.has(nodeId)),
          `${biomeGroup}/${pick}: every candidate is a real node of that biome and tier`,
        );
        // "first"/"rotate" name one node deliberately; only "uncleared" may widen.
        if (pick !== "uncleared") {
          assert(candidates.length === 1, `${biomeGroup}/${pick}: pinned picks never widen`);
        }
      }
    }
  }
  // Nearness bias: the coordinator holds out for nodes close to the bot rather
  // than accepting whatever is free, because a distant fall-through means a
  // multi-biome walk. The near set must stay a prefix-subset of the ordered
  // candidates, always contain the head, and never be empty.
  for (const biomeGroup of T1_BIOMES) {
    const ref = { kind: "biome", biomeGroup, tier: 1, pick: "uncleared" } as const;
    const ordered = resolveNodeCandidates(ref, obs, 0);
    for (const slack of [0, 1, 2, 5]) {
      const near = resolveNearCandidates(ref, obs, 0, slack);
      assert(near.length > 0, `${biomeGroup}/${slack}: a near set is never empty`);
      assert(near[0] === ordered[0], `${biomeGroup}/${slack}: the nearest node stays the first choice`);
      assert(
        near.every((nodeId) => ordered.includes(nodeId)),
        `${biomeGroup}/${slack}: the near set only contains real candidates`,
      );
      assert(
        near.length <= ordered.length,
        `${biomeGroup}/${slack}: the near set never exceeds the full candidate list`,
      );
    }
    // More slack can only admit more nodes, never fewer.
    assert(
      resolveNearCandidates(ref, obs, 0, 0).length <=
        resolveNearCandidates(ref, obs, 0, 3).length,
      `${biomeGroup}: widening the slack is monotonic`,
    );
    // A pinned single-candidate ref has nothing to bias.
    assert(
      resolveNearCandidates({ kind: "dungeon", biomeGroup, tier: 1 }, obs, 0, 2).length === 1,
      `${biomeGroup}: a dungeon ref has exactly one near candidate`,
    );
  }

  // The bias has to actually EXCLUDE something, or it is just the full list
  // wearing a different name and bots still trek across the map.
  {
    // Proximity only means anything from a real position, so stand the bot in
    // the Clearing rather than reusing the position-less fixture above.
    const placed = new WorldMirror();
    placed.ownId = "sock-1";
    placed.apply(snapshot({ full: true, nodeId: CLEARING_NODE_ID, deltas: [] }));
    const fromClearing = new Observation(placed);
    assert(fromClearing.nodeId === CLEARING_NODE_ID, "the fixture really is somewhere");

    let narrowed = 0;
    for (const biomeGroup of T1_BIOMES) {
      const ref = { kind: "biome", biomeGroup, tier: 1, pick: "uncleared" } as const;
      const all = resolveNodeCandidates(ref, fromClearing, 0);
      const tight = resolveNearCandidates(ref, fromClearing, 0, 0);
      const loose = resolveNearCandidates(ref, fromClearing, 0, 2);
      assert(
        tight.every((nodeId) => loose.includes(nodeId)),
        `${biomeGroup}: a tighter near set is contained in a looser one`,
      );
      assert(tight[0] === all[0], `${biomeGroup}: the nearest node survives any slack`);
      if (tight.length < all.length) narrowed += 1;
    }
    assert(narrowed > 0, "zero slack must exclude the more distant candidates somewhere");
  }

  // A dungeon must never offer an alternative -- boss state has to serialize.
  assert(
    resolveNodeCandidates({ kind: "dungeon", biomeGroup: "plains", tier: 1 }, obs, 0).length === 1,
    "a dungeon ref yields exactly one candidate",
  );
  assert(
    resolveNodeCandidates({ kind: "node", nodeId: "node-5-5" }, obs, 0).length === 1,
    "an explicit node ref yields exactly one candidate",
  );

  console.log("node resolution: ok");
}

// ── The authored routes must not reference content that has been renamed ────

/**
 * Static validation of one route against live game data: every node it names
 * resolves, every recipe and item exists, nothing is equipped before it is
 * crafted, every Rune rule is owned and compatible with the route's class, and
 * every boss step and condition names a real dungeon. A typo here would
 * otherwise run for hours and never finish.
 */
function validateRoute(route: Route): void {
  const archetype = ARCHETYPE_FOR_ROOT[route.classRoot];
  assert(archetype, `${route.id}: class root maps to a combat archetype`);
  // A progressionEntry route starts from a named checkpoint; its inherited
  // inventory and Rune catalogue are validated by that snapshot contract at run
  // time, not by this fresh-character walk.
  const sealedEntry = route.progressionEntry !== undefined;
  // Runes are free standing orders: a character owns every rune its class may run
  // (`runeIdsForArchetype`, as the server hydrates `runesOwned`).
  const ownedRunes = new Set<string>(sealedEntry ? ALL_RUNE_IDS : runeIdsForArchetype(archetype));
  const crafted = new Set<string>([
    ...(sealedEntry ? RECIPE_DATABASE.keys() : []),
    ...(route.entryItems ?? []),
  ]);

  // Every NodeRef a route names must resolve to a real node: the cheapest guard
  // against a route that walks for hours and then stalls on "cannot reach
  // target area". The Clearing, for one, is `kind: "tutorial"` at tier 0, so a
  // `{ biomeGroup: "clearing", tier: 1 }` ref resolves to nothing.
  const emptyObs = new Observation(new WorldMirror());
  const checkRef = (ref: NodeRef, where: string): void => {
    // Authoring validation has no live location. A current-node selector
    // requires a real biome; runtime separately checks the observed node.
    const resolvable = ref.kind === "biome" && ref.pick === "current"
      ? normalNodesFor(ref.biomeGroup, ref.tier, ref.modifier).length > 0
      : resolveNode(ref, emptyObs, 0) !== null;
    assert(resolvable, `${route.id}: ${where} names a resolvable node (${JSON.stringify(ref)})`);
  };
  const checkCondition = (condition: Condition, where: string): void => {
    switch (condition.type) {
      case "bossCleared":
        assert(
          dungeonNodeFor(condition.biomeGroup, condition.tier) !== null,
          `${route.id}: ${where} names a real dungeon (${condition.biomeGroup})`,
        );
        return;
      case "recipeUnlocked":
      case "canCraft":
        // `unlockedRecipes` holds item recipes only.
        assert(
          RECIPE_DATABASE.has(condition.recipeId),
          `${route.id}: ${where} names an item recipe (${condition.recipeId})`,
        );
        return;
      case "hasItem":
      case "equipped":
      case "itemAtLeastPlus":
      case "canUpgrade":
        assert(
          RECIPE_DATABASE.has(condition.definitionId),
          `${route.id}: ${where} names a real item (${condition.definitionId})`,
        );
        return;
      case "allOf":
      case "anyOf":
        condition.of.forEach((child) => checkCondition(child, where));
        return;
      case "not":
        checkCondition(condition.of, where);
        return;
      default:
        return;
    }
  };

  // In execution order: content existing is not enough if a route uses it
  // before earning it.
  const walk = (steps: readonly RouteStep[]): void => {
    for (const step of steps) {
      if (step.requires) checkCondition(step.requires, `${step.type}.requires`);
      switch (step.type) {
        case "chooseClass":
          assert(
            step.skillId === route.classRoot,
            `${route.id}: chooseClass picks the route's own class (${step.skillId})`,
          );
          break;
        case "unlockSkill":
          assert(SKILL_TREE.has(step.skillId), `${route.id}: unlockSkill names a real skill (${step.skillId})`);
          break;
        case "travel":
          checkRef(step.to, "travel");
          break;
        case "farm":
          checkRef(step.at, "farm");
          checkCondition(step.until, "farm.until");
          break;
        case "craft":
          if (step.farmAt) checkRef(step.farmAt, "craft.farmAt");
          for (const recipeId of step.recipeIds) {
            assert(RECIPE_DATABASE.has(recipeId), `${route.id}: craft names a real recipe (${recipeId})`);
            crafted.add(recipeId);
          }
          break;
        case "equip":
          for (const definitionId of step.definitionIds) {
            assert(RECIPE_DATABASE.has(definitionId), `${route.id}: equip names a real item (${definitionId})`);
            assert(crafted.has(definitionId), `${route.id}: ${definitionId} is equipped only after crafting it`);
          }
          break;
        case "upgrade":
          if (step.farmAt) checkRef(step.farmAt, "upgrade.farmAt");
          assert(
            RECIPE_DATABASE.has(step.definitionId),
            `${route.id}: upgrade names a real item (${step.definitionId})`,
          );
          break;
        case "configureRunes":
          // A rule whose fragments the run never owns would be silently dropped
          // and the run would quietly differ from the route. Runes are free
          // standing orders: ownership and class compatibility are the gates.
          for (const rule of step.rules) {
            assert(
              ownedRunes.has(rule.conditionId) && ownedRunes.has(rule.actionId),
              `${route.id}: Rune rule is owned (${rule.conditionId} -> ${rule.actionId})`,
            );
            assert(
              isRuneRuleCompatibleForArchetype(rule, archetype),
              `${route.id}: Rune rule is compatible with ${archetype} (${rule.conditionId} -> ${rule.actionId})`,
            );
          }
          break;
        case "attemptBoss":
          assert(
            dungeonNodeFor(step.biomeGroup, step.tier) !== null,
            `${route.id}: boss step targets a real dungeon (${step.biomeGroup} T${step.tier})`,
          );
          break;
        case "assert":
          checkCondition(step.condition, "assert");
          break;
        case "repeatUntil":
          checkCondition(step.until, "repeatUntil.until");
          walk(step.steps);
          break;
        case "ifPossible":
          checkCondition(step.when, "ifPossible.when");
          walk(step.steps);
          break;
        default:
          break;
      }
    }
  };
  walk(route.steps);

  // The completion condition is what actually ends a run, so it has to name
  // real content too.
  checkCondition(route.completion, "completion");
  for (const milestone of route.milestones) checkCondition(milestone.when, `milestone ${milestone.id}`);
}

{
  assert(ROUTES.size > 0, "at least one route is registered");
  for (const route of ROUTES.values()) validateRoute(route);
  for (const routeId of CONTROLLED_ROUTE_IDS) {
    assert(ROUTES.has(routeId), `controlled route ${routeId} is registered`);
    assert(isControlledRouteId(routeId), `${routeId} is admitted to a controlled batch`);
  }

  // The smoke route is class-agnostic: the command line picks the class, and
  // every class root builds a valid route that chooses that class.
  const smoke = requireRoute(SMOKE_T1_ID);
  assert(smoke.classRoot === classRootFor(DEFAULT_SMOKE_CLASS), "smoke-t1 defaults to the cadence root");
  for (const classRoot of Object.keys(ARCHETYPE_FOR_ROOT)) {
    for (const classId of [classRoot.replace(/-root$/, ""), classRoot]) {
      const route = requireRoute(SMOKE_T1_ID, classId);
      assert(route.classRoot === classRoot, `--class=${classId} plays ${classRoot}`);
      assert(
        route.steps.some((step) => step.type === "chooseClass" && step.skillId === classRoot),
        `smoke-t1 for ${classId} chooses ${classRoot}`,
      );
      validateRoute(route);
    }
  }
  let unknownClassRejected = false;
  try {
    requireRoute(SMOKE_T1_ID, "not-a-class");
  } catch {
    unknownClassRejected = true;
  }
  assert(unknownClassRejected, "an unknown --class is rejected, not silently replaced");

  console.log("routes: ok");
}

// `--class` picks a class-agnostic route's class and keeps each class on its
// own bot account, so two classes never share (and delete) one character.
{
  const plain = buildConfig({});
  assert(plain.routeId === SMOKE_T1_ID, "the default run is the smoke route");
  assert(plain.classId === undefined, "no --class plays the route's own class");
  const dot = buildConfig({ class: "dot" });
  assert(dot.classId === "dot", "--class reaches the run config");
  assert(dot.devAccountId !== plain.devAccountId, "each class gets its own bot account");
  console.log("class selection config: ok");
}

// ── Policies are parameters over one executor, not forked behavior ───────────

{
  assert(POLICIES.size === 6, "six policy profiles are registered");

  const intended = requirePolicy("intended");
  const rusher = requirePolicy("rusher");
  const generic = requirePolicy("generic");

  assert(intended.upgradeTarget(3) === 3, "intended keeps the authored upgrade target");
  assert(rusher.upgradeTarget(3) === 0, "rusher skips upgrades entirely");
  assert(generic.upgradeTarget(3) === 2, "generic under-upgrades by one");

  const authored: Condition = { type: "biomeLevelAtLeast", biomeGroup: "plains", level: 4 };
  const relaxed = rusher.farmCondition(authored);
  assert(
    relaxed.type === "biomeLevelAtLeast" && relaxed.level === 2,
    "rusher advances on a lower biome level",
  );
  assert(
    intended.farmCondition(authored) === authored,
    "intended leaves the authored condition untouched",
  );

  const optionalStep: RouteStep = { type: "milestone", id: "x", optional: true };
  assert(intended.performsOptional(optionalStep), "intended does the optional preparation");
  assert(!rusher.performsOptional(optionalStep), "rusher skips the optional preparation");

  console.log("policies: ok");
}

// ── A death while waiting on a contested altar is "death", not "unreachable" ──

/**
 * Regression for a real overnight-run finding: dungeon state is one-per-node,
 * not per-player, so a same-node player can leave the altar permanently
 * un-idle (their own boss fight still running) while THIS character is stuck
 * waiting for it to go idle. If that character dies in the meantime -- to the
 * guard, to the boss, to anything -- the attempt used to sit through the
 * entire multi-minute wait and land on "unreachable", indistinguishable from
 * never having found the dungeon at all. It must resolve as "death" instead,
 * and it must resolve promptly rather than burning the full wait.
 */
async function bossAttemptDeathDuringAltarWaitCheck(): Promise<void> {
  const biomeGroup = "plains";
  const tier = 1;
  const nodeId = dungeonNodeFor(biomeGroup, tier)!;
  assert(nodeId, "plains T1 has a dungeon node fixture to attempt against");

  let deaths = 0;
  let bossCleared = false;
  const altar = { x: 0, y: 0, activationRadius: 50 };
  const dungeon = {
    altar,
    canActivate: false, // another player's session is holding this dungeon open
    guardianAlive: 0,
    guardianTotal: 0,
    status: "boss" as const,
    bossMonsterId: undefined as string | undefined,
    cooldownRemainingMs: 0,
  };

  // Die shortly after the attempt starts waiting on the altar -- well inside
  // any of the multi-minute timeouts this wait could otherwise burn through.
  setTimeout(() => {
    deaths = 1;
  }, 200);

  const events: Array<Record<string, unknown>> = [];
  const recorder = {
    bossAttempts: 0,
    bossVictories: 0,
    now: () => Date.now(),
    emit: (event: Record<string, unknown>) => events.push(event),
    setActivity: () => {},
    walletSnapshot: () => {},
  };

  const executor = new RouteExecutor({
    obs: {
      self: { pos: { x: 0, y: 0 }, isDead: false },
      nodeId,
      dungeon,
      monsters: () => [],
      bossCleared: (group: string) => group === "forest" ? true : bossCleared,
      attackersOnSelf: () => [],
    },
    intents: {
      setAuto: () => {},
      setAutoTraverse: () => {},
      setAutocombatConfig: () => {},
      moveTo: () => {},
      navigateTo: () => {},
      activateDungeonAltar: () => false,
    },
    recorder,
    policy: requirePolicy("intended"),
    route: {
      id: "test-boss-attempt",
      version: "1",
      classRoot: "cadence-root",
      description: "attemptBoss-only fixture",
      steps: [
        { type: "attemptBoss", biomeGroup, tier, maxAttempts: 1 },
        { type: "attemptBoss", biomeGroup: "forest", tier, maxAttempts: 1 },
      ],
      completion: { type: "playerTierAtLeast", tier: 9 },
      milestones: [],
    },
    startedAt: Date.now(),
    aborted: () => false,
    awaitAlive: async () => {},
    deathCount: () => deaths,
    // The fixture only exercises the attemptBoss path, so the unused deps are
    // typed away rather than stubbed wholesale.
  } as unknown as ExecutorDeps);

  // maxAttempts is 1 and this attempt does not win. The executor must record
  // the exhaustion and advance to the next boss step instead of throwing.
  await executor.run();

  const ended = events.find(
    (event) => event.kind === "boss-attempt" && event.phase === "end",
  );
  assert(ended !== undefined, "the attempt recorded an end event");
  assert(
    ended!.outcome === "death",
    `a death while waiting on a contested altar must classify as "death", got ${String(ended!.outcome)}`,
  );
  assert(
    (ended!.durationMs as number) < 10_000,
    "the death must be caught promptly, not after burning the full altar-ready timeout",
  );
  assert(
    events.some((event) => event.kind === "boss-step-exhausted"),
    "an exhausted boss step must be recorded before advancing",
  );
  assert(
    events.filter((event) => event.kind === "route-step-start" && event.stepType === "attemptBoss").length === 2,
    "the route must advance to the next boss after the cap",
  );

  console.log("boss attempt death classification: ok");
}

// ── A dead/disconnected rejection is transient, not a stall ─────────────────

async function mutationRetryCheck(): Promise<void> {
  // The server answers every acknowledged mutating intent with this reason
  // while the player is a corpse. A route reaching a craft on the tick it dies
  // used to end the whole run there; it must wait for the respawn and retry.
  const NOT_LIVE = "Not available while dead or disconnected.";
  const recipeId = "primordial-club";

  let attempts = 0;
  let respawns = 0;
  let alive = false;
  let owned = false;

  const events: string[] = [];
  const recorder = {
    now: () => 0,
    emit: (event: { kind: string }) => events.push(event.kind),
    context: () => ({ biomeGroup: "clearing", nodeId: CLEARING_NODE_ID }),
    biome: () => ({ craftsCompleted: 0 }),
    setActivity: () => {},
    walletSnapshot: () => {},
  };

  const executor = new RouteExecutor({
    obs: {
      self: null,
      nodeId: CLEARING_NODE_ID,
      hasItem: () => owned,
      canCraft: () => true,
    },
    intents: {
      craftRecipe: async () => {
        attempts += 1;
        if (!alive) return { recipeId, success: false, reason: NOT_LIVE };
        owned = true;
        return { recipeId, success: true };
      },
    },
    recorder,
    policy: requirePolicy("intended"),
    route: {
      id: "test-retry",
      version: "1",
      classRoot: "cadence-root",
      description: "craft-only fixture",
      steps: [{ type: "craft", recipeIds: [recipeId] }],
      completion: { type: "playerTierAtLeast", tier: 9 },
      milestones: [],
    },
    startedAt: Date.now(),
    aborted: () => false,
    // Stand-in for the real respawn wait: the first call is the corpse, and
    // the bot is back on its feet by the time it returns.
    awaitAlive: async () => {
      respawns += 1;
      alive = respawns >= 2;
    },
    deathCount: () => 0,
    // The fixture only exercises the craft path, so the unused deps are typed
    // away rather than stubbed wholesale.
  } as unknown as ExecutorDeps);

  await executor.run();

  assert(attempts === 2, `craft retried after the dead rejection (attempts: ${attempts})`);
  assert(owned, "the retry actually crafted the item");
  assert(respawns === 2, "the retry waited for the respawn before asking again");
  assert(
    events.filter((kind) => kind === "craft").length === 2,
    "both the rejected attempt and the successful one are in telemetry",
  );

  console.log("mutation retry: ok");
}

// ── `--out` means the same directory wherever pnpm parked the cwd ───────────

{
  const repoRoot = "C:/repo";
  const botCwd = "C:/repo/bot";

  assert(
    normalizeOutDir("bot/runs/nightly", botCwd) === "runs/nightly",
    "the redundant bot/ prefix is stripped when the cwd is already bot/",
  );
  assert(
    normalizeOutDir("runs/nightly", botCwd) === "runs/nightly",
    "a bot-relative path is left alone",
  );
  assert(
    normalizeOutDir("bot/runs/nightly", repoRoot) === "bot/runs/nightly",
    "the prefix is meaningful from the repo root and must survive",
  );
  assert(
    normalizeOutDir("C:/tmp/runs", botCwd) === "C:/tmp/runs",
    "an absolute path is never rewritten",
  );

  console.log("out dir: ok");
}

// Fast boss retry is opt-in only and always poisons canonicality.
{
  const normal = buildConfig({ route: SMOKE_T1_ID });
  assert(!normal.fastBossRetry, "ordinary single routes leave fast retry disabled");
  assert(
    !initialRunTaints(normal, "1").includes("NON_CANONICAL_FAST_BOSS_RETRY"),
    "disabled retry must not change normal route canonicality",
  );

  const fast = buildConfig({
    route: SMOKE_T1_ID,
    fastBossRetry: "true",
    fastBossRetryIncludeGuardians: "true",
  });
  assert(fast.fastBossRetry, "fast retry requires the explicit true flag");
  assert(fast.fastBossRetryIncludeGuardians, "guardian inclusion is separately explicit");
  assert(
    initialRunTaints(fast, "1").includes("NON_CANONICAL_FAST_BOSS_RETRY"),
    "configured retry must always carry its exact noncanonical taint",
  );
  let controlledRejected = false;
  try {
    assertFastRetryBatchSafety({ fastBossRetry: "true" }, true);
  } catch {
    controlledRejected = true;
  }
  assert(controlledRejected, "canonical controlled batch must reject fast retry configuration");
  assertFastRetryBatchSafety({ fastBossRetry: "true" }, false);

  console.log("fast boss retry config: ok");
}

Promise.all([bossAttemptDeathDuringAltarWaitCheck(), mutationRetryCheck()]).then(
  () => console.log("harness: ok"),
  (err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  },
);
