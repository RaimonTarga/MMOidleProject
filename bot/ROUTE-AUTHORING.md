# Authoring a bot route

**You author the route; the harness executes it.** This file is the whole
vocabulary plus the T1 data you need to choose gear, so you should not have to
open `shared/src/data/recipes/*` to write one.

Routes live in `bot/src/routes/` and are registered in `bot/src/routes/index.ts`.
They are pure data — adding a class must never need executor changes.

`bot/src/harness.test.ts` fails the build if a route names content that does not
exist or uses content before acquiring it. Rune budgets are checked against the
minimum Global Mastery guaranteed at each generated configuration, not a flat
starting budget. `bot/src/routes/t1Routes.semantic.test.ts` additionally checks
the generated controlled T1 boss kits, movement priority, ability matrix, and
experimental isolation.

Controlled T1 routes are generated through `t1RouteBuilder.ts`. Add class gear
and economy choices to a `T1RouteConfig`; do not duplicate Rune arrays or boss
ability logic in a new route file. The clean batch admits only
`T1_CONTROLLED_ROUTE_IDS` unless `--controlled=false` is explicitly supplied.

---

## Steps

```ts
{ type: "chooseClass",  skillId: "cadence-root" }
{ type: "unlockSkill",  skillId: "..." }

{ type: "travel", to: <NodeRef> }

// Auto-combat in place until the condition holds. The workhorse.
{ type: "farm", at: <NodeRef>, until: <Condition> }

// Crafts each id, farming `farmAt` whenever the wallet is short.
// Costs/gates are read from RECIPE_DATABASE at runtime — never restate them.
{ type: "craft", recipeIds: ["iron-broadsword"], farmAt: <NodeRef> }

{ type: "equip", definitionIds: ["iron-broadsword"] }

// `opportunistic: true` takes it as far as the CURRENT Global Mastery ceiling
// allows and moves on. Without it the step waits for the ceiling to rise, which
// one biome cannot do (see the GM table below).
{ type: "upgrade", definitionId: "iron-broadsword", toPlus: 3, farmAt: <NodeRef>, opportunistic: true }

{ type: "configureRunes", rules: [{ conditionId: "target-casting", actionId: "fire-guard" }] }

// Crafts the ability recipe, then slots it.
{ type: "learnAbility", recipeId: "ability-recipe-brace", abilityId: "brace", slot: "guard", farmAt: <NodeRef> }

{ type: "attemptBoss", biomeGroup: "plains", tier: 1, maxAttempts: 6 }

{ type: "repeatUntil", steps: [...], until: <Condition>, maxIterations: 20 }

{ type: "milestone", id: "plains-boss-cleared" }   // pure telemetry marker
```

Every step also accepts:

| field | meaning |
|---|---|
| `label` | overrides the generated telemetry label |
| `optional` | **intended** does it; **rusher** and **generic** skip it |
| `stallAfterMs` | per-step override of the no-progress timeout |

## NodeRef

```ts
{ kind: "node",    nodeId: "node-clearing" }
{ kind: "biome",   biomeGroup: "plains", tier: 1, pick: "first" | "rotate" | "uncleared" }
{ kind: "dungeon", biomeGroup: "plains", tier: 1 }
```

`pick` also decides how much room the isolated-parallel coordinator has:

- `"uncleared"` is a **biome-level** choice — the executor already picks the node
  dynamically, so under `--executionMode=isolated-parallel` a bot may be given a
  different uncleared node of the same biome when its preferred one is leased.
  Its first choice is unchanged from a solo run.
- `"first"` and `"rotate"` name **one** node on purpose, and `kind: "node"` /
  `kind: "dungeon"` are single nodes by definition. These never widen: a bot
  queues for that exact node instead. Use them when the node itself is the point
  (a specific catalyst supplier, a boss dungeon).

Node modifiers rescale monster stats, so nodes inside a biome are *not* equal
difficulty. Prefer `"uncleared"` unless a step genuinely needs one node.

## Condition

```ts
{ type: "biomeLevelAtLeast",   biomeGroup: "plains", level: 4 }
{ type: "essenceAtLeast",      essence: "yellow", amount: 200 }
{ type: "catalystAtLeast",     family: "alacrity", amount: 2 }
{ type: "recipeUnlocked",      recipeId: "plains-vest-t1" }
{ type: "hasItem",             definitionId: "plains-vest-t1" }
{ type: "itemAtLeastPlus",     definitionId: "iron-broadsword", plus: 2 }
{ type: "equipped",            definitionId: "plains-vest-t1" }
{ type: "bossCleared",         biomeGroup: "plains", tier: 1 }
{ type: "playerTierAtLeast",   tier: 2 }
{ type: "canCraft",            recipeId: "..." }
{ type: "canUpgrade",          definitionId: "..." }
{ type: "globalMasteryAtLeast", value: 18 }
{ type: "elapsedMs",           ms: 600000 }
allOf(a, b, ...) / anyOf(a, b, ...) / { type: "not", of: a }
```

`Route.completion` is what actually ends the run; `Route.milestones` are
timestamped checkpoints checked continuously.

---

## Gating you have to route around

**Player tier gates everything.** `biomeLevelCap(playerTier=0, <any T1 biome>)`
is **0** — a tier-0 character cannot bank a single level in Plains. The tier-0
quest (10 Tiny Wisps in the Clearing) must come first. At tier 1 each T1 biome
caps at level **6**.

**Upgrades are gated by Global Mastery, which is account-wide.** GM is the sum of
every biome's level *excluding the Clearing and Sanctuary*. So gear depth is
bought with **breadth**: one T1 biome caps at 6, which only ever reaches `+1`.

**Dungeon bosses are entered through the guard.** `attemptBoss` walks to the
altar, activates it, and turns on auto-combat. The guardians engage first — a
measured run saw **11–12 simultaneous attackers** in the Plains dungeon.

**Runes fire abilities you must have learned.** `target-casting -> fire-guard` is
equippable from minute one (both fragments are starter runes), but does nothing
until a Guard ability is slotted. The harness drops rules whose fragments are
unowned rather than pretending they applied.

---

## T1 catalogue

Generated from `RECIPE_DATABASE` / `ABILITY_RECIPE_DATABASE`. Regenerate if the
data moves.

| biome | id | slot | lvl | cost | key stats | mechanics |
|---|---|---|---|---|---|---|
| clearing | `primordial-club` | weapon | 1 | 4 green | attack 8, aps 0.75 |  |
| clearing | `clearing-vest-t1` | armor | 2 | 4 green | maxHp 20, plating 4 |  |
| clearing | `clearing-charm-t1` | recovery | 3 | 3 green | recovery 2 |  |
| clearing | `clearing-boots-t1` | mobility | 4 | 3 green | speed 12 |  |
| plains | `iron-broadsword` | weapon | 1 | 10 yellow | attack 10, aps 0.8 | technique.cooldown-reduction-pct=0.06 |
| plains | `plains-vest-t1` | armor | 2 | 20 yellow | maxHp 24, plating 7 |  |
| plains | `plains-charm-t1` | recovery | 3 | 10 yellow | recovery 1 | defense.recovery-on-kill-pct=0.2, defense.recovery-on-kill-ms=4000 |
| plains | `plains-boots-t1` | mobility | 4 | 10 yellow | speed 18 | mobility.kill-speed-pct=0.25, mobility.kill-speed-ms=3000 |
| forest | `flash-rapier` | weapon | 1 | 20 green | attack 5, aps 1.5 |  |
| forest | `forest-vest-t1` | armor | 2 | 20 green | maxHp 28, plating 3, evasion 0.16 |  |
| forest | `forest-charm-t1` | recovery | 3 | 15 green | recovery 3 | defense.recovery-skill-potency=0.1 |
| forest | `forest-boots-t1` | mobility | 4 | 10 green | speed 22 | mobility.ooc-speed-pct=0.25 |
| cave | `chaotic-axe` | weapon | 1 | 26 red | attack 22, aps 1.1 | weapon.dead-swing-interval=3 |
| cave | `cave-vest-t1` | armor | 2 | 22 red | maxHp 28, plating 4, damageReduction 0.06 |  |
| cave | `cave-charm-t1` | recovery | 3 | 18 red | recovery 2 | defense.absorb-pct=0.08 |
| cave | `cave-boots-t1` | mobility | 4 | 18 red | speed 20 | mobility.stealth-pct=0.25 |
| mountain | `heavy-hammer` | weapon | 1 | 22 blue | attack 26, aps 0.55 | weapon.empowered-mult-bonus=0.15 |
| mountain | `mountain-vest-t1` | armor | 2 | 22 blue | maxHp 32, plating 5 | guard.potency-pct=0.15 |
| mountain | `mountain-charm-t1` | recovery | 3 | 18 blue | recovery 1 | defense.barrier-pct=0.12 |
| mountain | `mountain-boots-t1` | mobility | 4 | 18 blue | speed 16 | mobility.approach-speed-pct=0.35 |
| swamp | `ashbrand-blade` | weapon | 1 | 22 purple | attack 10, aps 0.9 |  |
| swamp | `swamp-vest-t1` | armor | 2 | 22 purple | maxHp 30, plating 4 | defense.dot-resistance=0.2 |
| swamp | `swamp-charm-t1` | recovery | 3 | 18 purple | recovery 2 | defense.recovery-pulse-pct=0.2, defense.recovery-pulse-interval-ms=8000, defense.recovery-pulse-duration-ms=4000 |
| swamp | `swamp-boots-t1` | mobility | 4 | 18 purple | speed 18 | mobility.slow-resistance=0.25 |

### T1 ability recipes
| id | ability | biome | lvl | cost |
|---|---|---|---|---|
| `ability-recipe-sweep` | sweep | plains | 3 | 160 yellow |
| `ability-recipe-second-wind` | second-wind | forest | 3 | 150 green |
| `ability-recipe-cleanse` | cleanse | swamp | 3 | 150 purple |
| `ability-recipe-brace` | brace | mountain | 3 | 150 blue |
| `ability-recipe-power-strike` | power-strike | mountain | 5 | 190 blue |
| `ability-recipe-expose-weakness` | expose-weakness | cave | 3 | 150 red |

### Global Mastery required per upgrade level (tier-1 items)
| +1 | +2 | +3 | +4 | +5 |
|---|---|---|---|---|
| 6 | 12 | 18 | 24 | 30 |

---

## Running what you author

```bash
pnpm bot:run --route=<id> --policy=intended
pnpm bot:cleanup --routes=<id> --policies=intended    # reset characters between runs
```

Output lands in `bot/runs/<runId>/` — read `summary.json` first, drill into
`events.jsonl` / `deaths.jsonl`. See [README.md](README.md).
