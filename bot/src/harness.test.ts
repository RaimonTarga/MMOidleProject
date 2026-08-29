import fs from "node:fs";
import path from "node:path";
import {
  ABILITY_RECIPE_DATABASE,
  CLEARING_NODE_ID,
  RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  bossClearKey,
  globalMastery,
  isRuneRecipeAvailableForArchetype,
  isRuneRuleCompatibleForArchetype,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  type CombatArchetype,
  type DeltaSnapshot,
} from "@mmo-idle/shared";
import { evaluate, resolveNearCandidates, resolveNode, resolveNodeCandidates } from "./route/conditions";
import { abilitySlotCount } from "@mmo-idle/shared";
import { POLICIES, requirePolicy } from "./policy/profiles";
import { ROUTES, T1_BASELINE_ROUTE_IDS, T1_BASELINE_ROUTES, requireRoute } from "./routes";
import type { Condition, NodeRef, RouteStep } from "./route/types";
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
              runeRecipesCrafted: [],
              runesEquipped: [],
              knownAbilities: [],
              equippedAbilities: { techniques: [], guards: [] },
              knownStances: [],
              equippedStances: { default: null },
              activeStance: null,
              knownRites: [],
              equippedRites: [],
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
                core: null,
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

{
  assert(ROUTES.size > 0, "at least one route is registered");

  for (const route of ROUTES.values()) {
    // Rune fragments the route itself unlocks via the forge, so a loadout that
    // uses one is legitimate even though it is not a starter.
    const craftedRuneIds = new Set<string>();
    const collectRunes = (steps: RouteStep[]): void => {
      for (const step of steps) {
        if (step.type === "craftRune") {
          const runeId = RUNE_RECIPE_DATABASE.get(step.recipeId)?.runeId;
          if (runeId) craftedRuneIds.add(runeId);
        } else if (step.type === "repeatUntil") {
          collectRunes(step.steps);
        }
      }
    };
    collectRunes(route.steps);

    // Every NodeRef a route names must resolve to a real node. This is the
    // cheapest possible guard against the most expensive possible mistake: a
    // route that walks fine for hours and then stalls on "cannot reach target
    // area". It has already caught one — `{ biomeGroup: "clearing", tier: 1 }`
    // resolves to nothing, because the Clearing is `kind: "tutorial"` at tier 0.
    const emptyObs = new Observation(new WorldMirror());
    // Route execution farms whenever a recipe gate is unmet. Track the minimum
    // biome levels guaranteed by the preceding steps so RP validation uses the
    // same GM-derived budget as the server, rather than a flat GM-0 floor.
    const minimumBiomeLevels: Record<string, number> = {};
    const setMinimumBiomeLevel = (biomeGroup: string, level: number): void => {
      minimumBiomeLevels[biomeGroup] = Math.max(minimumBiomeLevels[biomeGroup] ?? 0, level);
    };
    const recordBiomeLevelCondition = (condition: Condition): void => {
      if (condition.type === "biomeLevelAtLeast") {
        setMinimumBiomeLevel(condition.biomeGroup, condition.level);
      } else if (condition.type === "allOf") {
        condition.of.forEach(recordBiomeLevelCondition);
      }
    };
    const currentRuneBudget = (): { gm: number; budget: number } => {
      const gm = globalMastery(minimumBiomeLevels);
      return { gm, budget: runeBudgetForGlobalMastery(gm) };
    };
    const checkRef = (ref: NodeRef, where: string): void => {
      assert(
        resolveNode(ref, emptyObs, 0) !== null,
        `${route.id}: ${where} names a resolvable node (${JSON.stringify(ref)})`,
      );
    };

    const walk = (steps: RouteStep[]): void => {
      for (const step of steps) {
        if ("at" in step && step.at) checkRef(step.at, step.type);
        if ("to" in step && step.to) checkRef(step.to, step.type);
        if ("farmAt" in step && step.farmAt) checkRef(step.farmAt, `${step.type}.farmAt`);
        if (step.type === "farm") {
          recordBiomeLevelCondition(step.until);
        } else if (step.type === "craftRune") {
          const recipe = RUNE_RECIPE_DATABASE.get(step.recipeId);
          if (recipe?.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
            setMinimumBiomeLevel(recipe.recipeGroup, recipe.requiredBiomeLevel);
          }
        } else if (step.type === "learnAbility") {
          const recipe = ABILITY_RECIPE_DATABASE.get(step.recipeId);
          if (recipe?.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
            setMinimumBiomeLevel(recipe.recipeGroup, recipe.requiredBiomeLevel);
          }
        }
        switch (step.type) {
          case "craft":
            for (const recipeId of step.recipeIds) {
              assert(
                RECIPE_DATABASE.has(recipeId),
                `${route.id}: craft names a real recipe (${recipeId})`,
              );
            }
            break;
          case "equip":
            for (const definitionId of step.definitionIds) {
              assert(
                RECIPE_DATABASE.has(definitionId),
                `${route.id}: equip names a real item (${definitionId})`,
              );
            }
            break;
          case "upgrade":
            assert(
              RECIPE_DATABASE.has(step.definitionId),
              `${route.id}: upgrade names a real item (${step.definitionId})`,
            );
            break;
          case "learnAbility": {
            const recipe = ABILITY_RECIPE_DATABASE.get(step.recipeId);
            assert(recipe, `${route.id}: ability recipe exists (${step.recipeId})`);
            assert(
              recipe.abilityId === step.abilityId,
              `${route.id}: ability id matches its recipe (${step.abilityId})`,
            );
            break;
          }
          case "setAbilities":
            // Nothing to verify statically beyond the ids being real; the
            // executor refuses to slot an ability the run never learned.
            break;
          case "craftRune":
            assert(
              RUNE_RECIPE_DATABASE.has(step.recipeId),
              `${route.id}: rune recipe exists (${step.recipeId})`,
            );
            break;
          case "configureRunes":
            for (const rule of step.rules) {
              // A rule whose fragments the run never obtains would be silently
              // dropped and the run would quietly differ from the route. A
              // fragment is legitimate if it is a starter OR the route crafts
              // the rune recipe that unlocks it.
              assert(
                STARTER_RUNE_IDS.includes(rule.conditionId) ||
                  craftedRuneIds.has(rule.conditionId),
                `${route.id}: rune condition is obtainable (${rule.conditionId})`,
              );
              assert(
                STARTER_RUNE_IDS.includes(rule.actionId) || craftedRuneIds.has(rule.actionId),
                `${route.id}: rune action is obtainable (${rule.actionId})`,
              );
            }
            {
              const { gm, budget } = currentRuneBudget();
              const used = runicPointLoadoutCost({ rules: step.rules, rites: [] });
              assert(
                used <= budget,
                `${route.id}: rune loadout costs ${used} RP against ${budget} RP at GM ${gm}`,
              );
            }
            break;
          case "attemptBoss":
            assert(
              dungeonNodeFor(step.biomeGroup, step.tier) !== null,
              `${route.id}: boss step targets a real dungeon (${step.biomeGroup} T${step.tier})`,
            );
            break;
          case "repeatUntil":
            walk(step.steps);
            break;
          default:
            break;
        }
      }
    };
    walk(route.steps);

    // The completion condition is what actually ends a run, so it has to name
    // real content too — a typo here would run for hours and never finish.
    const walkCondition = (condition: Condition): void => {
      if (condition.type === "bossCleared") {
        assert(
          dungeonNodeFor(condition.biomeGroup, condition.tier) !== null,
          `${route.id}: completion names a real dungeon (${condition.biomeGroup})`,
        );
      } else if (condition.type === "allOf" || condition.type === "anyOf") {
        condition.of.forEach(walkCondition);
      } else if (condition.type === "not") {
        walkCondition(condition.of);
      }
    };
    walkCondition(route.completion);
    for (const milestone of route.milestones) walkCondition(milestone.when);
  }

  // Check in execution order: content exists is not enough if a route uses it
  // before earning it.
  const ARCHETYPE_FOR_ROOT: Record<string, CombatArchetype> = {
    "cadence-root": "cadence",
    "cooldown-root": "cooldown",
    "reload-root": "reload",
    "energy-root": "energy",
    "dot-root": "dot",
    "summoner-root": "summoner",
  };
  const checkRecipeConditions = (routeId: string, condition: Condition): void => {
    switch (condition.type) {
      case "recipeUnlocked":
        // `unlockedRecipes` contains item recipes only. Ability recipes use a
        // dynamic biome/boss predicate and must go through `learnAbility`.
        assert(
          RECIPE_DATABASE.has(condition.recipeId),
          `${routeId}: recipeUnlocked names an item recipe (${condition.recipeId})`,
        );
        return;
      case "allOf":
      case "anyOf":
        condition.of.forEach((child) => checkRecipeConditions(routeId, child));
        return;
      case "not":
        checkRecipeConditions(routeId, condition.of);
        return;
      default:
        return;
    }
  };
  for (const route of ROUTES.values()) {
    const craftedItems = new Set<string>();
    const learnedAbilities = new Set<string>();
    const ownedRunes = new Set(STARTER_RUNE_IDS);
    const archetype = ARCHETYPE_FOR_ROOT[route.classRoot];
    assert(archetype, `${route.id}: class root maps to a combat archetype`);

    const walkInOrder = (steps: RouteStep[]): void => {
      for (const step of steps) {
        if (step.type === "farm") {
          checkRecipeConditions(route.id, step.until);
        } else if (step.type === "craft") {
          for (const recipeId of step.recipeIds) craftedItems.add(recipeId);
        } else if (step.type === "equip") {
          for (const definitionId of step.definitionIds) {
            assert(
              craftedItems.has(definitionId),
              `${route.id}: ${definitionId} is equipped only after crafting it`,
            );
          }
        } else if (step.type === "learnAbility") {
          learnedAbilities.add(step.abilityId);
        } else if (step.type === "setAbilities") {
          for (const abilityId of [...step.techniques, ...step.guards]) {
            assert(
              learnedAbilities.has(abilityId),
              `${route.id}: ${abilityId} is slotted only after learning it`,
            );
          }
        } else if (step.type === "craftRune") {
          const recipe = RUNE_RECIPE_DATABASE.get(step.recipeId);
          assert(recipe, `${route.id}: rune recipe exists (${step.recipeId})`);
          assert(
            isRuneRecipeAvailableForArchetype(recipe, archetype),
            `${route.id}: rune recipe is available to ${archetype} (${step.recipeId})`,
          );
          if (recipe.runeId) ownedRunes.add(recipe.runeId);
        } else if (step.type === "configureRunes") {
          for (const rule of step.rules) {
            assert(
              ownedRunes.has(rule.conditionId) && ownedRunes.has(rule.actionId),
              `${route.id}: Rune rule is owned before configuration (${rule.conditionId} -> ${rule.actionId})`,
            );
            assert(
              isRuneRuleCompatibleForArchetype(rule, archetype),
              `${route.id}: Rune rule is compatible with ${archetype} (${rule.conditionId} -> ${rule.actionId})`,
            );
          }
        } else if (step.type === "repeatUntil") {
          checkRecipeConditions(route.id, step.until);
          walkInOrder(step.steps);
        }
      }
    };
    walkInOrder(route.steps);
  }

  const striker = requireRoute("striker-t1");
  assert(striker.classRoot === "cadence-root", "striker route targets the cadence root");

  // Every T1 root class has an authored baseline route (bot-route-reference.md
  // §18's deliverable list), and each targets its own class root.
  assert(T1_BASELINE_ROUTE_IDS.length === 6, "six canonical T1 route ids are declared");
  assert(T1_BASELINE_ROUTES.length === 6, "six canonical T1 routes resolve");
  assert(
    new Set(T1_BASELINE_ROUTE_IDS).size === T1_BASELINE_ROUTE_IDS.length,
    "canonical T1 route ids are unique",
  );
  const EXPECTED_T1_ROUTES: Record<string, string> = {
    "striker-t1": "cadence-root",
    "squire-t1": "cooldown-root",
    "striker-brace-tank-t1": "cadence-root",
    "squire-brace-tank-t1": "cooldown-root",
    "slinger-t1": "reload-root",
    "spirit-t1": "energy-root",
    "apprentice-t1": "dot-root",
    "conduit-t1": "summoner-root",
    "squire-heavyhammer-t1": "cooldown-root",
    "apprentice-letdotsfinish-t1": "dot-root",
    "slinger-murkeyeonly-t1": "reload-root",
    "spirit-murkeyeonly-t1": "energy-root",
    "striker-v2-t1": "cadence-root",
    "squire-v2-t1": "cooldown-root",
    "slinger-v2-t1": "reload-root",
    "spirit-v2-t1": "energy-root",
    "apprentice-v2-t1": "dot-root",
    "conduit-v2-t1": "summoner-root",
  };
  for (const [routeId, classRoot] of Object.entries(EXPECTED_T1_ROUTES)) {
    const route = requireRoute(routeId);
    assert(route.classRoot === classRoot, `${routeId} targets ${classRoot}`);
  }

  // The durable-melee experiment is intentionally a clean strategy split:
  // canonical routes earn Step Back and retain Second Wind, while the tank
  // arms omit Step Back and only arm Brace's cast-reactive rule for Mountain
  // and Cave bosses. This prevents future baseline edits from collapsing the
  // comparison into two superficially different route ids.
  const hasRule = (step: RouteStep, conditionId: string, actionId: string): boolean =>
    step.type === "configureRunes" &&
    step.rules.some((rule) => rule.conditionId === conditionId && rule.actionId === actionId);
  for (const routeId of ["striker-t1", "squire-t1"]) {
    const route = requireRoute(routeId);
    assert(
      route.steps.some((step) => step.type === "craftRune" && step.recipeId === "rune-recipe-step-back"),
      `${routeId}: canonical melee arm crafts Step Back`,
    );
    assert(
      !route.steps.some((step) => step.type === "learnAbility" && step.abilityId === "brace"),
      `${routeId}: canonical melee arm stays on the dodge strategy`,
    );
    assert(
      !route.steps.some((step) => hasRule(step, "target-casting", "fire-guard")),
      `${routeId}: Second Wind is not driven by the Brace rune rule`,
    );
  }
  for (const routeId of ["striker-brace-tank-t1", "squire-brace-tank-t1"]) {
    const route = requireRoute(routeId);
    assert(
      !route.steps.some((step) => step.type === "craftRune" && step.recipeId === "rune-recipe-step-back"),
      `${routeId}: tank arm does not craft Step Back`,
    );
    assert(
      route.steps.some((step) => step.type === "learnAbility" && step.abilityId === "brace"),
      `${routeId}: tank arm learns Brace`,
    );
    for (let i = 2; i < route.steps.length; i++) {
      const attempt = route.steps[i];
      if (
        attempt.type !== "attemptBoss" ||
        (attempt.biomeGroup !== "mountain" && attempt.biomeGroup !== "cave")
      ) {
        continue;
      }
      const abilities = route.steps[i - 2];
      const runes = route.steps[i - 1];
      assert(
        abilities?.type === "setAbilities" && abilities.guards.includes("brace"),
        `${routeId}: ${attempt.biomeGroup} boss equips Brace`,
      );
      assert(
        runes !== undefined && hasRule(runes, "target-casting", "fire-guard"),
        `${routeId}: ${attempt.biomeGroup} boss arms Brace's cast-reactive rule`,
      );
    }
  }

  const squireV2 = requireRoute("squire-v2-t1");
  const hasPowerStrikeItemRecipeWait = (steps: RouteStep[]): boolean =>
    steps.some(
      (step) =>
        (step.type === "farm" &&
          step.until.type === "recipeUnlocked" &&
          step.until.recipeId === "ability-recipe-power-strike") ||
        (step.type === "repeatUntil" && hasPowerStrikeItemRecipeWait(step.steps)),
    );
  assert(
    !hasPowerStrikeItemRecipeWait(squireV2.steps),
    "squire-v2 waits for Power Strike through learnAbility's live ability gate, not unlockedRecipes",
  );

  // Tier 1 grants exactly one Technique and one Guard slot, so a boss-prep
  // loadout that asks for two of either would be silently truncated. Every
  // ability a boss loadout equips must be learned earlier in the SAME route,
  // and every item a boss loadout equips must be crafted earlier too -- a
  // route cannot silently equip something it never earned.
  const slots = abilitySlotCount(1);
  for (const routeId of Object.keys(EXPECTED_T1_ROUTES)) {
    const route = requireRoute(routeId);

    for (const step of route.steps) {
      if (step.type !== "setAbilities") continue;
      assert(
        step.techniques.length <= slots.technique,
        `${routeId}: ${step.techniques.length} techniques exceeds the tier-1 slot count`,
      );
      assert(
        step.guards.length <= slots.guard,
        `${routeId}: ${step.guards.length} guards exceeds the tier-1 slot count`,
      );
    }

    const learned = new Set(
      route.steps.flatMap((s) => (s.type === "learnAbility" ? [s.abilityId] : [])),
    );
    for (const step of route.steps) {
      if (step.type !== "setAbilities") continue;
      for (const abilityId of [...step.techniques, ...step.guards]) {
        assert(learned.has(abilityId), `${routeId}: ${abilityId} is equipped but never learned`);
      }
    }

    const crafted = new Set(route.steps.flatMap((s) => (s.type === "craft" ? s.recipeIds : [])));
    for (const step of route.steps) {
      if (step.type !== "equip") continue;
      for (const definitionId of step.definitionIds) {
        assert(crafted.has(definitionId), `${routeId}: ${definitionId} is equipped but never crafted`);
      }
    }
  }

  console.log("routes: ok");
}

// ── Policies are parameters over one executor, not forked behavior ───────────

{
  assert(POLICIES.size === 3, "three policy profiles are registered");

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
  };

  const executor = new RouteExecutor({
    obs: {
      self: { pos: { x: 0, y: 0 }, isDead: false },
      nodeId,
      dungeon,
      monsters: () => [],
      bossCleared: () => bossCleared,
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
      steps: [{ type: "attemptBoss", biomeGroup, tier, maxAttempts: 1 }],
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

  // maxAttempts is 1 and this attempt does not win, so the loop legitimately
  // exhausts and throws -- the assertion of interest is the outcome recorded
  // for THIS attempt, not whether the overall step resolves.
  await executor.run().catch(() => undefined);

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
  const normal = buildConfig({ route: "striker-t1" });
  assert(!normal.fastBossRetry, "ordinary single routes leave fast retry disabled");
  assert(
    !initialRunTaints(normal, "1").includes("NON_CANONICAL_FAST_BOSS_RETRY"),
    "disabled retry must not change normal route canonicality",
  );

  const fast = buildConfig({
    route: "striker-t1",
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
