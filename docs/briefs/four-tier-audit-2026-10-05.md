# Four-tier source audit — 2026-10-05

**Status:** COMPLETE — read-only source audit; no fifth-tier implementation or balance decision.
**Source:** `develop` at `20b34088a9d495e15fd7519ddf70a57d7362c042`.
**Worker branch:** `audit/four-tier`, created from that source.
**Verified command cwd:** `C:\Users\osaif\Documents\Claude\Projects\mmo-lin-w1b`.
**Initial check:** clean on `feat/vf-t2`; then `git checkout -b audit/four-tier develop`.
**UI limitation:** this worker cannot inspect a desktop title bar. Command cwd was verified; title-bar folder identity was not.

The main blockers are the canonical map's import-time validation, the missing T5 spawn pools and region registration, and lineage tables that silently resolve T5 as T4. Recovery holds at 28 HP/s and the player-pool factor holds at 1.4. Advancement already permits T4 → T5; it is advancement **from** T5 that lacks a seal requirement. Adding T5 content does not generally produce a TypeScript error: tier fields and table keys are mostly `number`.

Several starting points in the task are already extensible. `biomeLevelCap` derives the highest authored tier from nodes, XP extrapolates beyond T4, the client map derives its shape from the registry, and tutorial tier conditions accept arbitrary numbers. `ROW_SCALAR` has **five row-kind entries**, not four tier entries. The five row kinds become fully available at T4; that is a separate constraint from the four-column tier scalar.

## Method and consequence vocabulary

Searched tracked source and test trees in `shared`, `server` (including `bench` and `scripts`), `client`, `admin`, `bot`, `tools`, and root `scripts`. Broad searches covered tier/region/band/max/final/last names, literal upper bounds, finite tier lists, `4:` table endpoints, T4 comments, and the named starting points. Each retained hit was read with its consumers. No code, dependency, generated asset, database, or experiment output was changed.

Representative rerunnable searches, from the repository root:

```powershell
rg -n '\[1,\s*2,\s*3,\s*4\]|\[0,\s*1,\s*2,\s*3,\s*4\]|[Tt]ier\s*(<=\s*4|<\s*5)|MAX_(PLAYER|ITEM|LINEAGE|REPORT|WORLD)?_?TIER|Math\.min\(4' shared server client admin bot tools scripts --glob '*.{ts,tsx,js,mjs}'
rg -n -i 'four.?tier|T1.?T4|regionT4|TIER_SCALAR|ROW_SCALAR|biomeLevelCap|biomeXpForLevel|monsterPoolByTier|bossPoolByTier|playerTierAtLeast|poolFactorForTier|baseRecoveryForTier' shared server client admin bot tools scripts --glob '*.{ts,tsx,js,mjs}'
rg -n '<=\s*4\b|<\s*5\b|===\s*[45]\b|\b168\b|1,2,3,4' shared/src server/test bot/src client/src --glob '*.test.ts'
```

Consequences below are source-derived predictions, **not executed T5 experiments**. They describe the relevant consumer after preceding blockers are resolved; otherwise map boot failure would hide every later issue.

- **silently wrong:** a fallback, clamp, empty result, or finite enumeration loses T5 behavior/coverage without an exception. Some fallbacks are deliberate today; the class identifies what must be revisited if T5 needs its own behavior.
- **throws:** explicit runtime rejection, failed import-time invariant, or an unchecked missing value.
- **typecheck fails:** a new semantic enum member exposes an exhaustive typed record. T5 as a numeric tier alone does not trigger this.
- **test fails:** a source assertion rejects the extension. A bounded test that simply skips T5 is **silently wrong**, not a predicted failure.

Literal 4s for four cardinal directions, equipment slots, formation bodies, within-tier danger bands, or particle budgets are excluded from four-world-tier assumptions. Fixed historical experiment packets and a test of a named T4 encounter do not claim to cover every game tier; they remain scoped evidence. Finite tools advertised as tier-wide are included separately.

## Shared package: progression, magnitude, and band model

| Source location | Assumption kind | Consequence class | What T5 exposes |
|---|---|---|---|
| `shared/src/config/gameConfig.ts:67`, `:285–288` | Array length, five entries for T0–T4; clamp to final index | silently wrong | T5+ max HP uses T4's **1.4** factor, with no new pool calibration. The clamp is explicit and intentional. |
| `shared/src/config/gameConfig.ts:92`, `:257–260` | Array length, T0–T4 reference pools; clamp | silently wrong | T5+ naked Recovery remains `0.05 × 560 = 28 HP/s`. Appending a pool changes this; adding a node does not. |
| `shared/src/systems/balanceLab.ts:645–647` | Same reference-pool array length | silently wrong | A T5 item's Recovery comparison still normalizes against the T4 reference pool. |
| `shared/src/data/lineages/magnitudes.ts:31`, `:860–861` | Literal `MAX_LINEAGE_TIER = 4` | silently wrong | `clampTier(5)` is 4; all downstream tier-table consumers inherit it. |
| `shared/src/data/lineages/magnitudes.ts:54–59`, `:867–869` | Four-key scalar table | silently wrong | T5 uses T4 absolute/fraction scalars **11 / 1.5**. Raising the max without adding the row falls back to 1, also silent. `Record<number, …>` does not require key 5. |
| `shared/src/data/lineages/magnitudes.ts:697–702`, `:708–722` | Four-key band/row table and clamp | silently wrong | T5 receives T4's five rows and local unlocks `1/2/3/4/5`; no distinct T5 band is authored. |
| `shared/src/data/lineages/magnitudes.ts:726–734` | Clamped tier in absolute-level formula | silently wrong | A T5 row/gate reads the T4 reference band: row levels 19–23 and gate 24, before biome-start offset. |
| `shared/src/data/lineages/magnitudes.ts:761–762`, `:774–782` | Clamped tier in GM lookup/formula | silently wrong | T5 rows and gates use the T4 GM band; a new T5 mastery band is not selected. The hand-set `ROW_GLOBAL_MASTERY` entry at `:753` is a T1 override, not another four-tier limit. |
| `shared/src/data/lineages/magnitudes.ts:807–812`, `:943–957` | Four-key essence multiplier table and clamp | silently wrong | T5 essence row/gate cost uses T4's **22×** multiplier; missing-key fallback after changing the clamp is 1×. |
| `shared/src/data/lineages/magnitudes.ts:843–848`, `:948–957` | Four-key shard multiplier table and clamp | silently wrong | T5 row/gate shard cost uses T4's **4×** multiplier. |
| `shared/src/data/lineages/magnitudes.ts:851–856`, `:960–961` | Four-key capstone quantity table and clamp | silently wrong | A gate requested at T5 uses T4's **5** capstones; if the clamp changes without the table it falls back to **1**. |
| `shared/src/data/abilityNodes/resolve.ts:51–52`; generated row tiers in `shared/src/data/abilityNodes/index.ts:174–176` | Inherited lineage clamp | silently wrong | A T5 ability packet and amplifier are both assigned band 4; the current T4 amplifier also cannot move to band 5. The costs and mastery gates at `resolve.ts:100–104`, `:139–143` follow that band. |
| `shared/src/data/lineages/types.ts:74–76` | `RowKind` enum/list ends at `cross` | typecheck fails **if a new row kind is added** | T5 as `tier: 5` is legal. A sixth row such as an unrecognized string is rejected by `LineageCard.row`; deliberately extending `RowKind` forces exhaustive records below to be filled. |
| `shared/src/data/lineages/types.ts:85`, `:99`; `shared/src/data/lineages/magnitudes.ts:66`, `:795`, `:815` | Exhaustive `Record<RowKind, …>` tables | typecheck fails **on RowKind extension** | Row labels, scalar, essence base and shard base must name a new row. `ROW_SCALAR` currently has `stat/payoff/amplifier/keystone/cross`, five entries. No compiler error is guaranteed for a fifth numeric tier. |
| `shared/src/data/lineages/index.ts:54`, `:94–95`, `:125–131` | Finite authored forms/cards; exact filters | silently wrong | A T4 gate finds no T5 forms, and `cardsForTier(…, 5)` is empty, until forms/cards are authored. These helpers themselves accept arbitrary numeric tiers. See the full lineage endpoint inventory below. |
| `shared/src/systems/tierAdvancement.ts:33–42`, `:60–62`, `:120` | Four-key seal table; missing-key default 0 | silently wrong | T4's five seals advance a player to **T5 today**. At T5, required = 0 and `canAdvance = required > 0 && …` is false, so the player cannot advance further. Adding T5 bosses alone does not create its requirement. |
| `shared/src/systems/tierAdvancement.ts:130–149` | Validator enumerates only authored seal rows | silently wrong | Missing T5 is not reported. Adding a T5 row exceeding its boss sources is reported; the validator returns strings and server boot logs them, rather than throwing (`server/src/index.ts:312`). |
| `shared/src/config/gameConfig.ts:204`, `:330–344` | Four explicitly tuned XP budgets plus future fallback | silently wrong **only if a bespoke T5 budget is expected** | T5 segment budget is **720,000**, `600,000 × 1.2`; reference level 30 is **1,367,500** cumulative XP. This is defined extrapolation, not an out-of-bounds read. |
| `shared/src/config/gameConfig.ts:226–230`, `:323–326` | Per-biome XP tuning tables end at T4; missing default 1 | silently wrong **for an assumed calibrated T5** | T5 has no per-biome pacing correction and receives 1×. General XP and essence reward arrays at `:212–214`, `:236–238` already contain index 5. |
| `shared/src/systems/itemUpgrades.ts:31`; reader `shared/src/systems/itemUpgrades.test.ts:44` | Literal `MAX_ITEM_TIER = 4` | silently wrong | This constant bounds the surviving test loop, not live upgrade eligibility. The ladder is retired, and the live GM-band function at `:47–52` accepts T5. Do not mistake the exported name for a live player-tier cap. |
| `shared/src/abilities.ts:258–261`, `:360–366` | Authored rank-array length; upper clamp | silently wrong **if T5 deepening is expected** | Existing abilities retain their last authored rank at T5, by design. The runtime accepts longer arrays; the T4-only authoring assertion is in the server test inventory. |
| `shared/src/data/skillTree/generated.ts:11–25` | Future skill tiers 4–7 are empty placeholders | silently wrong **if T5 is claimed as implemented class progression** | At playerTier 5 the next internal skill tier is 4; combat classes' generated choices cost a point but grant empty effects. This is a content gap, not a numeric cap. |
| `shared/src/data/monsters/tutorial.ts:31–70` | Finite authored dummy list T0–T4 | silently wrong | No training-dummy definition for T5; server's finite spawn list also needs extension. |
| `shared/src/quests/questDatabase.ts:84–98` | Named tier quests end at T4 | silently wrong **for quest coverage only** | No T5 notable-target quest exists. These quests do not advance tiers at T1+ (`server/src/systems/player/progression/questSystem.ts:35–44`), so this does not itself block ascension. |

### Every lineage's last authored cross row

All twenty registered lineages end their card authoring at the T4 cross row. These are **finite authored-band assumptions / silently wrong** if someone claims the tree supplies a T5 band. The five weapon lineages are live; the other fifteen are parked by `shared/src/data/lineages/index.ts:65–70` and have no live unlock effect today. Existing trees can legitimately stop at their final biome/form; adding a world tier does not by itself require extending every tree.

| Lineage source | Forms start | First T4 cross card |
|---|---|---|
| `shared/src/data/lineages/axe.ts` | `:18` | `:174` |
| `shared/src/data/lineages/broadsword.ts` | `:23` | `:198` |
| `shared/src/data/lineages/dagger.ts` | `:18` | `:193` |
| `shared/src/data/lineages/hammer.ts` | `:18` | `:193` |
| `shared/src/data/lineages/rapier.ts` | `:24` | `:188` |
| `shared/src/data/lineages/barrier.ts` | `:22` | `:131` |
| `shared/src/data/lineages/bindings.ts` | `:24` | `:133` |
| `shared/src/data/lineages/eye.ts` | `:24` | `:123` |
| `shared/src/data/lineages/fleet.ts` | `:22` | `:131` |
| `shared/src/data/lineages/heartroot.ts` | `:24` | `:133` |
| `shared/src/data/lineages/hide.ts` | `:22` | `:121` |
| `shared/src/data/lineages/marsh.ts` | `:22` | `:131` |
| `shared/src/data/lineages/plate.ts` | `:22` | `:131` |
| `shared/src/data/lineages/pulse.ts` | `:23` | `:132` |
| `shared/src/data/lineages/robe.ts` | `:22` | `:131` |
| `shared/src/data/lineages/stone.ts` | `:23` | `:132` |
| `shared/src/data/lineages/treads.ts` | `:22` | `:131` |
| `shared/src/data/lineages/wing.ts` | `:23` | `:132` |
| `shared/src/data/lineages/wrappings.ts` | `:23` | `:122` |
| `shared/src/data/lineages/wraps.ts` | `:23` | `:122` |

### World registry, authored masks, and pools

| Source location | Assumption kind | Consequence class | What T5 exposes |
|---|---|---|---|
| `shared/src/world/map/registry.ts:2–5`, `:14–19` | Explicit four imports/spreads | silently wrong | An added `regionT5.ts` is invisible until included; derived `WORLD_NODES`, adjacency, bounds and `NODE_BIOMES` cannot see it. |
| `shared/src/world/map/regions.ts:3–28` | Four region definitions | throws / silently wrong fallback | T5 nodes with unknown region fail map validation (`validation.ts:83–85`). Outside that check, respawn falls back to Clearing (`registry.ts:76–77`), not a T5 anchor. |
| `shared/src/world/map/regionT1.ts:108–112`, `regionT2.ts:100–104`, `regionT3.ts:95–99`, `regionT4.ts:81–85` | Four authored region masks and finite biome/blend lists | silently wrong | No T5 mask, placement, blend or sanctuary is supplied. Their absence cannot be repaired by increasing a scalar. Existing masks are shared authoring, not independent client masks. |
| `shared/src/world/map/validation.ts:27–32`, `:223–325` | Four-key active-biome specification | silently wrong | No T5 biome/dungeon-per-biome coverage checks run; a fifth row must be explicitly authored. Generic per-node pool/identity/topology checks still run. |
| `shared/src/world/map/validation.ts:34–47`, `:480–502` | Count pins: 168 total, 138 normal, 26 dungeon, 3 sanctuary; four normal-count rows | throws | Any extra T5 node breaks total/kind counts when `assertValidWorldMap` runs. A missing T5 normal-count row is not checked separately. |
| `shared/src/world/map/validation.ts:404–428` | Explicit frontier enum `1-2/2-3/3-4/1-4` | throws | Any new inter-region edge to T5 is reported as an unintended frontier. Each old pair must still have at least two edges. |
| `shared/src/world/map/displayNames.ts:147`, `:226`, `:241`; its validator at `:335–364` | Authored naming tables end at T4 | throws | Generic resolver fallback produces a readable T5 name, but canonical validation requires authored names for normal nodes with modifiers, dungeons and sanctuaries. Adding only the nodes fails that validation. Blend-only normal nodes avoid the modifier-name check. |
| `shared/src/data/areaDanger.ts:10–14`, `:21` | Four-key tier/biome table; missing default null | silently wrong | T5 normal nodes have no within-tier danger band. The `AreaDanger = 1…5` union at `:4` is a danger scale, not a world-tier enum. Dungeons remain the boss band. |
| `shared/src/biomeDatabase.ts:11`, `:17` and pool inventory below | Finite authored pool keys; `Partial<Record<number, …>>` | silently wrong / throws at map validation | No biome has T5 monster or boss pools. Runtime consumers use `?? []`; a normal/dungeon T5 node fails canonical validation at `validation.ts:121–138`. No TypeScript error requires a key 5. |

Every real biome pool is included here. Some retired biomes stop before T4; that retirement is deliberate, not proof all biomes have four columns. All have **no key 5**. Entries list `monsterPoolByTier` / `bossPoolByTier` definition lines in `shared/src/biomeDatabase.ts`:

| Biome | Pool source lines |
|---|---|
| Forest | `:66` / `:71` |
| Mountain | `:89` / `:95` |
| Plains | `:114` / `:119` |
| Swamp | `:137` / `:142` |
| Cave | `:157` / `:162` |
| Jungle | `:177` / `:184` |
| Tundra | `:205` / `:209` |
| Desert | `:232` / `:237` |
| Volcanic | `:250` / `:254` |
| Graveyard | `:268` / `:273` |
| Trench | `:290` / `:293` |

Clearing has only T0 (`:39`), sanctuary/testroom are empty (`:47`, `:55`), and Abyss has no ambient pool (`:306`); these are special-node identities, not normal T5 pool omissions. Monster-family lookup intersects with the selected tier's live pool (`shared/src/world/nodeBlends.ts:62`), so just assigning existing families to a T5 blend cannot invent spawnable bodies. The deferred `charnel-brute` comment at `biomeDatabase.ts:269` does not register T5 content.

## Server package: live consumers and tier-wide benches

| Source location | Assumption kind | Consequence class | What T5 exposes |
|---|---|---|---|
| `server/src/world/nodeRegistry.ts:10`; `shared/src/world/map/validation.ts:515–520` | Import-time invariant | throws | Canonical registry import calls `assertValidWorldMap`; count/frontier/name/pool omissions stop server initialization, before gameplay. |
| `server/src/systems/world/spawning/index.ts:359`, `:1085` | Empty default for unlisted tier pools | silently wrong | If validation is bypassed or relaxed, an unpooled T5 biome fields no normal monsters and no dungeon boss. These are consumers of the shared pool omissions. |
| `server/src/systems/player/progression/rewards.ts:93` | Raw tier lookup in four-key shard multiplier; default 1 | silently wrong | **Different from card cost:** a T5 kill pays **1×** shard base, while clamped T5 lineage cost is **4×**. T5 source/cost parity is broken unless both sides are extended. |
| `server/src/world/testRoom.ts:18–24`, `:54–65` | Finite T0–T4 training-dummy array | silently wrong | Training room has no stationary T5 dummy. Boss rotation at `:113–122` is generic and works if T5 boss pools exist; otherwise it returns null and may leave the previous boss in place. |
| `server/bench/balanceRun.ts:41`, `:71` | Default tier array/help T0–T4 | silently wrong | Default full boss/farm matrices omit T5. Explicit `--tier 5` is not excluded by this default. |
| `server/bench/balance/progression.ts:461`, `:481–497` | Implemented skill-depth literal 3; final branch stops at T3 path | silently wrong | A T5 build still has root/frame/range/path only. `contentTier - 1` at `:57–58` can return 4 but the enumerator adds no internal tier-4 node. |
| `server/bench/defenseMatrix05.ts:96` | Explicit `[1, 2, 3, 4]` enumeration | silently wrong | Tier-wide defense matrix emits no T5 cells. Its separately requested T4-spec mode at `:92` is intentionally T4-scoped. |
| `server/bench/phase0Ttd.ts:43–48`, `:65`, `:73–75` | Four-key biome table and explicit tier loop | silently wrong; throws **if only loop is extended** | T5 is omitted today. Adding 5 to the loop without `CHARM_NODES[5]` indexes/iterates undefined. |
| `server/bench/poolRaise.ts:112`, `:588`, `:597` | T0–T4 seed-factor tuple, four-tier default CSV, default 1 | silently wrong | Default study omits T5; an explicitly requested T5 seed factor falls back to **1**, whereas live HP factor holds at **1.4**. |
| `server/bench/phase0Recovery.ts:39–41`, `:64–66`, `:78–85` | Explicit T1/T2 handling plus only T3/T4 node keys | silently wrong | Requesting `PHASE0_TIERS=5` yields no T5 cells; no fifth-tier representative nodes or setup exist. Default is only `1,2`, a study scope rather than a four-tier limit. |
| `server/scripts/_gear.ts:4` | Explicit four-tier loop | silently wrong | Scratch gear census skips T5. |
| `server/scripts/_t4Ladder.ts:13` | Explicit four-tier loop | silently wrong | Scratch cross-tier weapon table stops at T4. |
| `server/scripts/_t4PowerLab.ts:64` | Four-key target-node table | silently wrong / throws if treated as T5-generic | No T5 target mapping; this script is expressly a T4 lab. Do not treat its output as fifth-tier coverage. |
| `server/scripts/v1yPreflight.ts:73` | Literal `biomeTier <= 4` assertion | throws **if a T5 node is submitted to this packet** | Frozen V1y node allowlist rejects T5. This is a packet boundary, not a live movement cap. |

The player-tier write itself has no upper-four guard: `server/src/systems/player/progression/questSystem.ts:21–23` increments the numeric tier and `:75–81` delegates to seals. Recalculation after tier-up in `rewards.ts:292` applies the shared Recovery/HP tables, so reaching T5 does not escape their clamps.

## Client package

| Source location | Assumption kind | Consequence class | What T5 exposes |
|---|---|---|---|
| `client/src/fx/attackFlair.ts:26`, `:44`, `:52–53` | Literal upper clamp 4 on playerTier | silently wrong | T5 attacks have the same ascension intensity/size as T4. Mechanical skill-path flair remains a separate 0–3 stage model. |
| `client/src/ui/SkillTreePanel.tsx:39`, `:175–205` | Last authored internal skill tier 3; finite `[0…4]` journey with catch-all final step | silently wrong **if T5 choices are declared implemented** | All internal tiers >3 are one `Tier 5+ / In development` step. This UI deliberately acknowledges T5+; the final array member is a catch-all, not a cap on navigation. |
| `client/src/render/biomeTint.ts:66–68`, `:124`, `:153`, `:174`, `:189`, `:212`, `:218`, `:230` | Finite authored tint keys; default null | silently wrong **for visual progression only** | T5 nodes have no tier-specific tint and render untinted. The header at `:57–60` explicitly plans eight tiers, so no four-tier enum blocks adding entries. |
| `client/src/ui/SealLedgerPanel.tsx:27–30`, `:65–67` | Tier list derived from four-key shared seal table | silently wrong | T5 passage is absent from ledger and denominator until its seal row is authored. No independent client upper bound exists. |
| `client/src/ui/QuestPanel.tsx:214–220` | Missing shared seal requirement becomes maximum-tier copy | silently wrong | At T5 the panel says `Maximum tier reached` because its seal requirement is absent, even if T5 content is added. |

The map's region masks do **not** independently stop at T4. `client/src/ui/map/MapPanel.tsx:286–301` builds labels from `WORLD_REGIONS`; tile coordinates use `WORLD_MAP_BOUNDS` (`:399–401`). `map/constants.ts:44–54` already supplies tier colors through 8, and charting at `:81–82` is numeric. A registered valid T5 region appears without a new client mask.

`client/src/fx/essenceMotes.ts:28` enumerates 0–4 and `essenceMoteProfile.ts:5` clamps at 4, but these are **orders of magnitude of reward amount**, not world tiers. A fifth world tier uses the existing finite particle budget correctly; extending them would remove a rendering bound. Likewise `server/test/essenceMoteProfile.test.ts:5` is not a missing T5 combat test.

## Bot package

| Source location | Assumption kind | Consequence class | What T5 exposes |
|---|---|---|---|
| `bot/src/reference.ts:112`, `:148` | Four-tier XP reference enumeration and authored-world text | silently wrong | Generated reference omits a T5 segment row and still describes only T1–T4. Its future-growth sentence at `:120` correctly describes XP extrapolation. |
| `bot/src/tools/economyBaselinePrepare.ts:37`, `:59` | Literal normal-node/recipe tier filters `<= 4` | silently wrong | T5 nodes and recipes are absent from the prepared catalogue. |
| `bot/src/tools/economyBaselinePrepare.ts:114`, `:128` | Explicit four-tier pacing/rate arrays | silently wrong | No T5 pacing/rate cells are planned. |
| `bot/src/tools/economyBaselinePrepare.ts:145–146` | `slice(1, 5)` on tier reward arrays | silently wrong | Catalogue exposes only reward factors T1–T4 even though the source arrays already include T5+. |
| `bot/src/routes/t1RouteBuilder.ts:280–295`, `bot/src/routes/t2RouteBuilder.ts:492`, `:569–572` | Fixed authored route endpoints, not a general four-tier loop | silently wrong **only if claimed as T5 route coverage** | The available `t*RouteBuilder.ts` files build T1 and T2 routes. No `t3RouteBuilder`, `t4RouteBuilder`, or `t5RouteBuilder` is present; higher-tier routes are individual campaign files, not a missing generic fifth switch branch. |
| `bot/src/routes/campaignT4Night3.ts:56`, `campaignT4V1y.ts:63`, `campaignT4ValidationExit.test.ts:54` | Named T4 campaign targets/completion pins | silently wrong **for a claimed all-tier campaign** | These intentionally finish at T4 and cannot substantiate T5 coverage. Their literal 4s should not be changed as part of introducing another tier. |

Bot tier conditions themselves are generic: `bot/src/route/conditions.ts:71` compares `playerTier >= condition.tier`; the route condition type uses `number`. Existing T1/T2 endpoint conditions correctly retain their local meanings when a fifth world tier appears.

## Admin, tools, and root scripts

| Source location | Assumption kind | Consequence class | What T5 exposes |
|---|---|---|---|
| `tools/tier-table.ts:95–100`, `:623` | Four-key biome ordering; missing default `[]` | silently wrong | A T5 pool can be reported, but no declared biome progression order is supplied. |
| `tools/tier-table.ts:148–167`, `:783–784` | Four-key target table; conditional omission | silently wrong | T5's target-vs-current section is absent until its target row exists. |
| `tools/tier-table.ts:251`, `:785` | Four-key anchor-mode table; switch/default fallback | silently wrong **if a different T5 anchor is expected** | T5 uses `DEFAULT_ANCHOR_MODE`; compiler does not require a fifth entry. Adding a target alone implicitly chooses that default. |
| `tools/mob-report.ts:589–594`, `:627` | Four-key biome ladder; length defaults to 1 | silently wrong | T5 has no authored walk order; arrival-GM interpolation can use one rung if called despite the missing ladder. |
| `tools/dps-report.ts:210–245`, `tools/ehp-report.ts:259–294` | Build model ends at spec, internal skill tier 3 | silently wrong **for full T5 builds** | T5 gear may be enumerated automatically, but combinations stop after class/frame/range/spec and omit newly implemented internal tier-4 nodes. |
| `tools/dps-report.ts:1537`, `tools/ehp-report.ts:957` | Literal `Math.min(reportTier, 4)` table-column count | silently wrong **if a fifth progression column is added** | Group-row colspan remains the four-choice width. It is currently correct for the class/frame/range/spec model; changing only this cap does not add T5 data. |
| `scripts/defenseFoundation.ts:14` | Raw five-entry T0–T4 DR arrays indexed by tier | silently wrong | T5 recipe authoring reads undefined; the script's AST rewrite helper at `:9` writes the literal `undefined` into the authored stats source. This is an old authoring script, not live combat. |
| `scripts/defenseRevise.ts:13` | T3 special case, else implicitly T4 for tier >=3 | silently wrong | Existing revision script applies the T4 1.6 multiplier to T5+ without a dedicated branch. |
| `scripts/boss5-arms.mjs:38`, `:85`, `:207` | Fixed experiment tier references and explicit assertion | throws **if extended to a T5 breadth arm** | No T5 cap/reference/kit exists. `boss5` is the experiment's name, not Tier 5. Current finite packet is intentionally unchanged. |

No independent four-tier assumption was found in `admin/src`. Ops-map/analytics tiers come from `NODE_BIOMES`, Balance Lab buttons from `snapshot.tiers` (`admin/src/tabs/BalanceLabTab.tsx:83`), and gameplay filters derive distinct snapshot tiers (`GameplayTab.tsx:50`). The four-tier shared Balance Lab **test** below is the pin, not an admin enum. `shared/src/systems/balanceLab.ts:524–529` and `tools/mob-report.ts:318–325` discover tier keys from pools; existing maximum-armor-tier fallbacks are generic and openly mark missing reference gear.

## Test inventory, grouped by owning package

These were inspected, not run. The requested validation for this documentation task is `pnpm typecheck` only. Rows distinguish a real future assertion failure from tests that keep passing while skipping T5.

| Package / source location | Assumption kind | Consequence class | Fifth-tier consequence |
|---|---|---|---|
| Shared — `shared/src/world/map/validation.test.ts:22–30` | World validation and literal 168 node snapshot | test fails | Valid T5 node additions require updating the executable specification/count pin. |
| Shared — `shared/src/world/map/validation.test.ts:76–86`, `:89–103` | Explicit Clearing/T2/T3/T4 altar and respawn examples | silently wrong | No T5 sanctuary altar/respawn example. The generic reachability loop at `:69` already covers new registered nodes. |
| Shared — `shared/src/systems/balanceLab.test.ts:10` | Exact `'1,2,3,4'` string | test fails | Adding reportable T5 pools makes the discovered snapshot tier list fail its exact pin. |
| Shared — `shared/src/config/gameConfig.test.ts:88–104`, `:152` | Four budget expectation rows, `tier <= 4`, reference levels <=24 | silently wrong | T5 XP segment/monotonicity is untested. Existing four rows can still pass. |
| Shared — `shared/src/collision/collision.test.ts:641` | Explicit `[1, 2, 3, 4]` mountain entrance census | silently wrong | No T5 entrance-count pin. The geometry at `:610` intentionally repeats four cardinal entrance patterns, so a T5 dungeon should have one entrance rather than five. |
| Shared — `shared/src/data/lineages/composition.test.ts:371`, `:473` | `tier <= 4` composition loops (start 2 and 1) | silently wrong | Fifth-band lean/verb/payload resolution is not exercised. |
| Shared — `shared/src/data/lineages/reachability.test.ts:123`, `:175` | Loops bounded by `MAX_LINEAGE_TIER` | silently wrong | With the current max 4, row/gate reachability and GM checks skip T5. Forms/cards enumerated elsewhere in the file can still expose some newly authored data. |
| Shared — `shared/src/data/lineages/coverage.test.ts:563` | `MAX_LINEAGE_TIER >= 4` lower bound | silently wrong | A max of 4 remains acceptable after adding T5; this is not an exact upper-bound assertion. |
| Shared — `shared/src/data/lineages/coverage.test.ts:630–631`, `:746` | Specific T3 keystone / T4 cross filters and Broadsword T4 pin | silently wrong | T5 row coverage is absent; adding T5 does not automatically fail the existing cross-card checks. Generic `tierHasRow` check at `:136` still uses the clamped table. |
| Shared — `shared/src/systems/itemUpgrades.test.ts:44` | Loop through `MAX_ITEM_TIER = 4` | silently wrong | T5 GM-band threshold shape is untested. Existing literal GM boundaries at `:25–29` remain valid if lower-tier content is preserved. |
| Server — `server/test/playerPoolFactor.test.ts:112` | Exact tuple length 5, T0–T4 | test fails | Appending a T5 pool factor makes this assert fail. |
| Server — `server/test/playerPoolFactor.test.ts:119`, `:125`, `:154–158` | `tier <= 4` loops and five-entry override fixture | silently wrong | New factor/Recovery decoupling/idempotence is not checked at T5 even after the length pin changes. |
| Server — `server/test/recovery.test.ts:259–277` | Array-derived loop and hold-at-last assertion | silently wrong **for independent T5 calibration coverage** | Adding a pool entry extends the loop automatically; retaining the table makes T5 clamp intentional and still passing. There is no literal 4 cap in this test. |
| Server — `server/test/abilityRanks.test.ts:139–140` | Every ability's final authored tier `<= 4` | test fails | Any T5 ability or rank extending through T5 is explicitly rejected. Unlike the runtime, the assertion intentionally freezes this pass at T4. |
| Server — `server/test/abilityRanks.test.ts:76` | Explicit `[2, 3, 4]` Tempo checks | silently wrong | No T5 Tempo refund assertion. |
| Server — `server/test/abilityNodes.test.ts:132`, `:135` | Expected row tiers `Math.min(4, …)` | test fails **if lineage clamp is correctly extended** | Extending max/table to 5 makes T4 amplifier/T5 packet row expectations fail; keeping the clamp wrong lets them pass. |
| Server — `server/test/abilitySlam.test.ts:366`, `:371` | Both explicit `[1, 2, 3, 4]` loops and four-value multiplier pin | silently wrong | T5 multiplier/single-target/cooldown/cast invariants are absent. An extended array would also require the expected comma string at `:368` to change. |
| Server — `server/test/coreRangeGate.test.ts:169`, `:172` | Technique/Guard catalogue filters `tier <= 4` | silently wrong | T5 abilities evade the catalogue-wide range-gating checks. |
| Server — `server/test/farmLoop.test.ts:42` | `enumerateFarmTargets([0, 1, 2, 3, 4])` | silently wrong | T5 farm targets are absent from coverage. |
| Server — `server/test/t3ProgressionEconomy.test.ts:39`, `:92`, `:108`, `:117`, `:164` | Literal `MAX_TIER = 4` across four loops | silently wrong | Retirement, headroom, cap-sum and attainable GM-gate invariants skip T5. Explicit gate table at `:145–150` also stops at T4. |
| Server — `server/test/t3ProgressionEconomy.test.ts:68–79` | Derived max-normal vs max-normal/dungeon comparison | test fails **for a dungeon-only T5 extension** | A T5 side dungeon extending a retired biome without normal content trips the generic hazard guard. Adding matched normal content is accepted by this check. |
| Server — `server/test/attackProgression.test.ts:36` | Ascension for playerTier 99 must equal 4 | test fails **if visual clamp is extended** | Changing flair's upper bound invalidates the explicit T4 cap expectation. |
| Server — `server/test/regionalRespawn.test.ts:66–71`, `:89–93` | Explicit four-region respawn / three-sanctuary arrays | silently wrong | No T5 respawn/empty-sanctuary case. |

Searches for **every** test expression enumerating `[1, 2, 3, 4]`, `[0, 1, 2, 3, 4]`, `tier <= 4`, `tier < 5`, or a named max-four tier produced the rows above. Literal T4 encounter tests such as `t4ProgressionEconomy`, `campaignT4ValidationExit`, `durability32Matrix`, and `night5` pin their own encounter/packet; their existence is not a claim that no T5 may exist. Arrays `[1…5]` used for plus levels and `[1…6]` for local mastery levels are likewise not world-tier enumeration.

## Named starting points that do not assume exactly four tiers

| Source | Verified behavior |
|---|---|
| `shared/src/config/gameConfig.ts:400–431`, `:497–505`, `:547–552` | Biome start/final tier and mastery cap derive from registered normal/dungeon nodes. Adding matched T5 content extends eligible headroom automatically; retired groups stay retired. Clearing's literal 4 at `:498` is its **mastery level**, not a world-tier cap. |
| `shared/src/config/gameConfig.ts:330–385`, `:516–521` | XP segments and biome offsets work above T4. Future growth is authored at 1.2×; there is no fixed four-element indexing without a fallback. |
| `shared/src/world/map/types.ts:4`, `:25`, `:48` | Region IDs are `t${number}`; node and region tiers are numeric. T5 is type-valid. |
| `shared/src/tutorial/types.ts:33`, `:116`; `shared/src/tutorial/conditions.ts:81–82` | `TutorialBeat` is a beat structure, not a four-tier enum. `playerTierAtLeast` has `tier: number` and evaluates a numeric comparison. The guide is deliberately a T1 script, not an all-tier route generator. |
| `shared/src/systems/skills.ts:23–38` | Internal tiers 3+ use the general path lock; skill tier is numeric. Future nodes are placeholders rather than rejected tier numbers. |
| `shared/src/systems/energyMax.ts:21`; `energyUpkeep.ts:55`; `stats.ts:442`, `:450` | Existing path bonuses scale from unlock tier with no T4 upper clamp. Constants equal to 4 are unlock anchors, not maximum player tiers. |
| `client/src/hud/uiTier.ts:5–7`, `:22`; `client/src/hud/BiomeXpBar.tsx:9` | UI palette supports 1–8; XP-bar absolute cap uses 7. Neither blocks T5. These are separate future limits, not four-tier assumptions. |
| `shared/src/world/mountainPasses.ts:231–237` | Four entrance sides cycle by modulo; T5 uses the first side count again. This is cardinal geometry, not a world-tier ceiling. |
| `shared/src/systems/relics.ts:5–7` | Relics unlock at playerTier 4 and their authored item tier is 4; the unlock predicate permits higher-tier players. A T5 world does not invalidate their permanent item identity. |

## Delivery and validation

Only this report and its `docs/README.md` index entry are edited. No implementation decisions, tuning, T5 data, test changes, installs, pushes, or merges are part of this audit.

Validation: `pnpm typecheck` **passed** (workspace packages, bench types, and test types). Explicit source-reference paths/ranges were checked against the audited checkout. `git diff --check` was clean; both edited documents use LF with one trailing newline. No runtime test suite requested or run.
