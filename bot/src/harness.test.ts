import {
  ABILITY_RECIPE_DATABASE,
  CLEARING_NODE_ID,
  RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  bossClearKey,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  type DeltaSnapshot,
} from "@mmo-idle/shared";
import { evaluate, resolveNode } from "./route/conditions";
import { abilitySlotCount } from "@mmo-idle/shared";
import { POLICIES, requirePolicy } from "./policy/profiles";
import { ROUTES, requireRoute } from "./routes";
import type { Condition, NodeRef, RouteStep } from "./route/types";
import { Observation, dungeonNodeFor, normalNodesFor } from "./state/observation";
import { WorldMirror } from "./state/reducer";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
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
            assert(
              runicPointLoadoutCost({ rules: step.rules, rites: [] }) <=
                runeBudgetForGlobalMastery(0),
              `${route.id}: rune loadout fits the starting Runic Point budget`,
            );
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

  const striker = requireRoute("striker-t1");
  assert(striker.classRoot === "cadence-root", "striker route targets the cadence root");

  // Every T1 root class has an authored baseline route (bot-route-reference.md
  // §18's deliverable list), and each targets its own class root.
  const EXPECTED_T1_ROUTES: Record<string, string> = {
    "striker-t1": "cadence-root",
    "squire-t1": "cooldown-root",
    "slinger-t1": "reload-root",
    "spirit-t1": "energy-root",
    "apprentice-t1": "dot-root",
    "conduit-t1": "summoner-root",
  };
  for (const [routeId, classRoot] of Object.entries(EXPECTED_T1_ROUTES)) {
    const route = requireRoute(routeId);
    assert(route.classRoot === classRoot, `${routeId} targets ${classRoot}`);
  }

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

console.log("harness: ok");
