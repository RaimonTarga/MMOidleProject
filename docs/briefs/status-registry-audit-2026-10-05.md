# Status registry audit — 2026-10-05

## Gaps first

- **Applied on players without a HUD tile:** `stunned`, `stun-immune`, `lava-burn` and `kata-release`. `stunned` is the material omission: `applyStun` has player call sites, but `buffSync` never projects `debuff-stunned`. Its client help, critical ordering, icon and stun presentation consumer exist. `stun-immune` is a post-stun ward; `kata-release` is an internal next-Technique latch, so their missing tiles may be intentional. Lava damage still produces damage feedback, but its status has no tile, label/help or icon channel. None of these findings proposes a mechanics change.
- **Target statuses with fallback copy/badge and no icon:** `lineage.hemorrhage`, `lineage.lean-bleed`, `lineage.poison`, `death-mark`, `energy-ci-tag` and `frame.summoner.link.<ownerId>`. The last three are bookkeeping records exposed by the blanket target mirror. They still render a fallback badge and tooltip; they are not wholly invisible. `dr-shatter` has authored label/help/badge but no icon lookup. The player `monster-dot:hound-plague` tile has generic DoT help and its runtime label, but its decay flavor requests the raw id, which has no icon alias. `dot-frostbite` has authored help/icon but uses a fallback badge label/color.
- **Dead target entries:** `root`, `vuln`, `void-corruption` have client label/help/badge/alias entries with no current writer. Actual roots use `ability-rooted`, `cave-lockdown`, `lair-drag-root`, or a player `slow` with zero `speedMult`; actual vulnerability uses `vulnerability`. `debuff-stunned` is an unsent player display id for the live raw `stunned` record, not a separate raw effect id.
- **Unreachable status-backed chip:** `cooldown-temporal-ext` requires `temporal-extension-buff` through `getTemporalExtPct`, but no producer remains. The descriptor, help and icon are present. `defense-hardening-maxdr` and `summoner-howl-banner` are unused icon registry keys.
- **Boss channel gaps:** `harvest` is emitted through `hasStatus.bossEffects`; its explanatory copy and badge are in the raw target-status tables, so the actual boss tile receives fallback help/badge and no icon alias. Boss-channel `summon`, `slam`, bare `stat-buff`, `sandsurge`, `cinder-fury`, `caldera-fury` and `blood-in-the-water` have authored copy/metadata but no current producer. The boss action named `summon` spawns adds without installing an active boss effect. Unlabelled stat buffs produce `stat-buff-<stat>`, not bare `stat-buff`.
- **Slow/root clock rule:** no missing `totalMs` found on actual slow/root application paths. Player `slow` writers, node `statusWhileInside` slow data, `cave-lockdown`, `lair-drag-root`, `ability-slowed`, `ability-rooted`, `dot-chill`, `frost-ramp` and `dot-frozen` all store it. Permanent Tundra Chill also stores `totalMs` through `ambientRampData`, as time to fill the ramp rather than a remaining-duration clock. Monster `ability-slowed` also preserves the maximum full duration on refresh. Missing clocks on unrelated permanent banks or internal tags below are not automatically violations of this rule. The weapon reservoirs labelled Chill are frost damage, not movement-control effects.

## Scope and reading the tables

Source revision: `20b34088a9d495e15fd7519ddf70a57d7362c042` (`develop` base), branch `audit/status-registry`, worktree `C:/Users/osaif/Documents/Claude/Projects/mmo-lin-w1a`. Audit-only: no game source, authored balance, client copy or packed art was changed.

The extraction below contains **123 raw runtime ids/families**, **109 unique player tile ids**, and the separate boss-effect/phase namespace. A status id and its display id are different namespaces: `slow` becomes `debuff-slow` or `debuff-root`, lineage windows become `lineage-*`, and every named `monster-dot:<id>` becomes an instanced `debuff-dot` tile. The monster target mirror forwards every non-expired raw status, including internal tags. Thus a fallback target label is a presentation gap, not an absent target tile.

`Player tile` means a projection of a status carried by the player. Some player-bar chips monitor a status on the target (`dot-chill`, `dot-frozen`, `dot-frostbite`, `dot-conflag`); these remain in the projected-tile table, but do not incorrectly establish a player carrier for that raw effect. Resource/component chips are included separately because absence from `applyStatusEffect` does not make their copy dead. The generic `debuff-dot` descriptor contains an intentionally disabled placeholder; the real tiles come from `collectMonsterDotDebuffs`. `debuff-boss` comes from `collectBossDebuffs`, rather than `defineBuff`.

`Help P/T` distinguishes player help after display-id mapping from target help using the raw id. All projected player tiles and targeted monster statuses use generic tooltip builders; missing authored help produces the explicit fallback description. The icon column names the lookup result relative to `/assets/concept-icons/`; files exist for every resolved runtime lookup at this revision. Where lookup is absent, the client displays its text fallback. `totalMs` reports configuration storage, not a simulated duration measurement. `no` is descriptive except on a slow/root. Application sites include the writer and data source; finite helper calls are listed, and owner/source-qualified identifiers stay as families.

## Extracted status coverage

123 runtime IDs/families; 109 unique projected tile IDs.

| ID | Gap |
| --- | --- |
| `death-mark` | target: fallback help; target: fallback badge; no authored icon lookup |
| `dot-frostbite` | target: fallback badge |
| `dr-shatter` | no authored icon lookup |
| `energy-ci-tag` | target: fallback help; target: fallback badge; no authored icon lookup |
| `frame.summoner.link.<ownerId>` | target: fallback help; target: fallback badge; no authored icon lookup |
| `kata-release` | player: no tile/projection; no authored icon lookup |
| `lava-burn` | player: no tile/projection; no authored icon lookup |
| `lineage.hemorrhage` | target: fallback help; target: fallback badge; no authored icon lookup |
| `lineage.lean-bleed` | target: fallback help; target: fallback badge; no authored icon lookup |
| `lineage.poison` | target: fallback help; target: fallback badge; no authored icon lookup |
| `monster-dot:hound-plague` | no authored icon lookup |
| `stun-immune` | player: no tile/projection |
| `stunned` | player: no tile/projection |
| `debuff-stunned` | authored label/help/badge; no status writer or descriptor found |
| `root` | authored label/help/badge; no status writer or descriptor found |
| `void-corruption` | authored label/help/badge; no status writer or descriptor found |
| `vuln` | authored label/help/badge; no status writer or descriptor found |
| `cooldown-temporal-ext` | descriptor requires unproduced status: temporal-extension-buff (server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:76) |
| icon key `defense-hardening-maxdr` | icon registry entry has no descriptor, runtime-id or alias consumer |
| icon key `summoner-howl-banner` | icon registry entry has no descriptor, runtime-id or alias consumer |
| boss channel `blood-in-the-water` | authored copy/metadata; no boss-effect producer found |
| boss channel `caldera-fury` | authored copy/metadata; no boss-effect producer found |
| boss channel `cinder-fury` | authored copy/metadata; no boss-effect producer found |
| boss channel `harvest` | fallback help; fallback badge; no icon alias |
| boss channel `sandsurge` | authored copy/metadata; no boss-effect producer found |
| boss channel `slam` | authored copy/metadata; no boss-effect producer found |
| boss channel `stat-buff` | authored copy/metadata; no boss-effect producer found |
| boss channel `summon` | authored copy/metadata; no boss-effect producer found |

## Complete runtime registry

| ID | Carries | Application sites (writer; authored source) | Player tile | Label | Help P/T | Target badge | Icon lookup | Tooltip | totalMs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ability-bramble` | player | server/src/systems/player/abilities/abilityBramble.ts:51 | ability-bramble | runtime | yes/— | — | statuses/buffs/ability-bramble | generic builder | yes |
| `ability-control-resist` | player | server/src/systems/player/abilities/abilityFiring.ts:638 | ability-control-resist | runtime | yes/— | — | abilities/break-free | generic builder | yes |
| `ability-frenzy` | player | server/src/systems/player/abilities/abilityFiring.ts:507 | ability-frenzy | runtime | yes/— | — | abilities/frenzy | generic builder | yes |
| `ability-guard` | player | server/src/systems/player/abilities/abilityFiring.ts:719 | ability-guard | runtime | yes/— | — | statuses/buffs/ability-guard | generic builder | yes |
| `ability-guard-2` | player | server/src/systems/player/abilities/abilityFiring.ts:719 | ability-guard-2 | runtime | yes/— | — | statuses/buffs/ability-guard-2 | generic builder | yes |
| `ability-imbue` | player | server/src/systems/player/abilities/abilityImbue.ts:54 | ability-imbue | runtime | yes/— | — | abilities/imbue-lightning | generic builder | no |
| `ability-rooted` | monster | server/src/systems/combat/status/monsterControl.ts:98; server/src/systems/combat/keystones/ladder.ts:94; server/src/systems/combat/status/monsterControl.ts:98; server/src/systems/combat/lineageCards.ts:707; server/src/systems/combat/status/monsterControl.ts:98; server/src/systems/combat/status/monsterControl.ts:98; server/src/systems/player/abilities/abilityEffects.ts:592 | — | authored | —/yes | authored | abilities/binding-strike | generic builder | yes |
| `ability-second-wind` | player | server/src/systems/player/abilities/abilityFiring.ts:690 | ability-second-wind | runtime | yes/— | — | abilities/second-wind | generic builder | yes |
| `ability-second-wind-2` | player | server/src/systems/player/abilities/abilityFiring.ts:690 | ability-second-wind-2 | runtime | yes/— | — | abilities/second-wind | generic builder | yes |
| `ability-slowed` | monster | server/src/systems/combat/status/monsterControl.ts:66; server/src/systems/combat/leanConditions.ts:117; server/src/systems/combat/status/monsterControl.ts:66; server/src/systems/combat/lineageCards.ts:752; server/src/systems/combat/status/monsterControl.ts:66; server/src/systems/combat/rangeMechanics.ts:186; server/src/systems/combat/status/monsterControl.ts:66; server/src/systems/combat/status/monsterControl.ts:66; server/src/systems/player/abilities/abilityEffects.ts:578 | — | authored | —/yes | authored | abilities/hamstring | generic builder | yes |
| `antiheal` | player | server/src/systems/combat/engine/combat.ts:995; server/src/systems/combat/engine/combat.ts:1781; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:760; server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT4.ts:897; server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT4.ts:925; server/src/systems/combat/engine/combat.ts:1210; server/src/systems/combat/engine/combat.ts:1246 | debuff-antiheal | runtime | yes/— | — | statuses/debuffs/debuff-antiheal | generic builder | yes |
| `barrier:<sourceId>` | monster | server/src/systems/combat/engine/sourceBarriers.ts:44 | — | authored | —/yes | authored | statuses/buffs/granite-barrier | generic builder | yes |
| `battery-charge` | player | server/src/systems/classes/archetypes/cooldown/t3/ticks/balanced/battery.ts:29 | cooldown-battery | runtime | yes/— | — | statuses/buffs/cooldown-battery | generic builder | no |
| `bone-tithe` | monster | server/src/systems/combat/ai/bossScripts.ts:311 | — | authored | —/yes | authored | statuses/buffs/necrotic-surge | generic builder | yes |
| `boss-brittle` | player | server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT3.ts:708; server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT4.ts:500 | debuff-boss | runtime | yes/— | — | statuses/debuffs/boss-brittle | generic builder | yes |
| `boss-frenzy` | monster | server/src/systems/combat/ai/bossPatterns.ts:1238 | — | authored | —/yes | authored | statuses/buffs/monster-howl-haste | generic builder | yes |
| `boss-rallied` | monster | server/src/systems/combat/ai/bossScripts.ts:923 | — | authored | —/yes | authored | statuses/buffs/monster-howl-haste | generic builder | yes |
| `boss-roar-haste` | monster | server/src/systems/combat/ai/allyEmpower.ts:66; server/src/systems/combat/ai/bossScripts.ts:733 | — | authored | —/yes | authored | statuses/buffs/monster-howl-haste | generic builder | yes |
| `brittle` | monster | server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:50; server/src/systems/combat/damage/weaponEffects.ts:161; server/src/systems/combat/damage/weaponEffects.ts:163 | — | authored | —/yes | authored | statuses/buffs/dot-frostbite | generic builder | yes/no |
| `cadence-hemorrhage` | monster | server/src/systems/classes/archetypes/cadence/t3/pipeline/empoweredHit.ts:107 | — | authored | —/yes | authored | statuses/debuffs/debuff-dot | generic builder | no |
| `canopy-chameleon-barrage` | monster | server/src/systems/combat/engine/combat.ts:1268,1612; shared/src/data/monsters/jungle.monsters.ts:175 | — | authored | —/yes | authored | statuses/buffs/thorn-spitter-barrage | generic builder | yes |
| `carrion-screech-haste` | monster | server/src/systems/combat/engine/combat.ts:1268,1612; shared/src/data/monsters/graveyard.monsters.ts:101 | — | authored | —/yes | authored | statuses/buffs/carrion-screech-haste | generic builder | yes |
| `cave-lockdown` | player | server/src/systems/combat/ai/engageSequence.ts:77 | debuff-root | runtime | yes/— | — | statuses/debuffs/debuff-root | generic builder | yes |
| `cinderbrand-burn` | monster | server/src/systems/combat/damage/weaponReservoir.ts:49; shared/src/data/recipes/volcanic.recipes.ts:115 | — | authored | —/yes | authored | statuses/buffs/dot-conflag | generic builder | yes |
| `death-mark` | monster | server/src/systems/classes/archetypes/reload/t3/pipeline/balancedPaths.ts:37 | — | fallback | —/— | fallback | fallback text | generic builder | no |
| `depth` | player | server/src/systems/combat/ai/bossScripts.ts:366; shared/src/data/monsters/bossesT4.ts:949; server/src/systems/combat/ai/bossScripts.ts:366; shared/src/data/monsters/bossesT4.ts:957; server/src/systems/combat/ai/bossScripts.ts:366; shared/src/data/monsters/bossesT4.ts:963 | debuff-boss | runtime | yes/— | — | statuses/debuffs/boss-depth | generic builder | timed only |
| `dot` | monster | server/src/systems/classes/archetypes/dot/dotPrototype.ts:130; server/src/systems/classes/archetypes/dot/dotPrototype.ts:130; server/src/systems/classes/archetypes/dot/dotPrototype.ts:452; server/src/systems/classes/archetypes/dot/dotPrototype.ts:130; server/src/systems/classes/archetypes/dot/frameLoop.ts:158; server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:31; server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:37; server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:57; server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:94; server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:100; server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:125; server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:186; server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:56; server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:93; server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:122; server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:157; server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:227; server/src/systems/classes/archetypes/dot/t3/paths/poison.ts:34; server/src/systems/classes/archetypes/dot/t3/paths/poison.ts:72; server/src/systems/classes/archetypes/dot/dotPrototype.ts:130; server/src/systems/combat/rangeMechanics.ts:259; server/src/systems/classes/archetypes/dot/dotPrototype.ts:130; server/src/systems/player/abilities/abilityEffects.ts:451 | — | authored | —/yes | authored | statuses/debuffs/debuff-poison | generic builder | no |
| `dot-chill` | monster | server/src/systems/classes/archetypes/dot/frameLoop.ts:100; server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:167 | — | authored | —/yes | authored | statuses/buffs/dot-chill | generic builder | yes |
| `dot-conf` | monster | server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:172 | — | authored | —/yes | authored | statuses/buffs/dot-conflag | generic builder | no |
| `dot-frenzy` | player | server/src/systems/classes/archetypes/dot/t3/index.ts:138 | dot-frenzy | runtime | yes/— | — | statuses/buffs/dot-frenzy | generic builder | yes |
| `dot-frostbite` | monster | server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:86 | — | fallback | —/yes | fallback | statuses/buffs/dot-frostbite | generic builder | yes |
| `dot-frozen` | both | server/src/systems/classes/archetypes/dot/t3/paths/frost.ts:178; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT3.ts:680; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT3.ts:700; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:492 | debuff-frozen | player runtime; target badge/fallback | yes/yes | authored | statuses/buffs/dot-frozen | generic builder | yes |
| `dot-smolder` | monster | server/src/systems/classes/archetypes/dot/t3/paths/fire.ts:137 | — | authored | —/yes | authored | statuses/buffs/dot-conflag | generic builder | no |
| `dr-shatter` | monster | server/src/systems/combat/damage/weaponEffects.ts:173 | — | authored | —/yes | authored | fallback text | generic builder | yes |
| `elder-carapace-renewal` | monster | server/src/systems/combat/engine/combat.ts:1292,1670; shared/src/data/monsters/trench.monsters.ts:165 | — | authored | —/yes | authored | statuses/buffs/abyssal-carapace | generic builder | yes |
| `energy-ci-tag` | monster | server/src/systems/classes/archetypes/energy/t3/pipeline/normalHit.ts:96 | — | fallback | —/— | fallback | fallback text | generic builder | no |
| `energy-overcharge` | player | server/src/systems/classes/archetypes/energy/t3/pipeline/empoweredHit.ts:78 | energy-overcharge | runtime | yes/— | — | statuses/buffs/energy-overcharge | generic builder | no |
| `energy-storm` | monster | server/src/systems/classes/archetypes/energy/t3/pipeline/empoweredHit.ts:163 | — | authored | —/yes | authored | statuses/buffs/energy-storm | generic builder | yes |
| `eroded` | player | server/src/systems/world/groundZones.ts:619; shared/src/data/monsters/bossesT2.ts:12; server/src/systems/world/groundZones.ts:619; shared/src/data/monsters/bossesT3.ts:11 | debuff-boss | runtime | yes/— | — | statuses/debuffs/boss-eroded | generic builder | yes |
| `eternal-cycle-charge` | player | server/src/systems/classes/archetypes/cooldown/t3/pipeline/normalHit.ts:42 | cooldown-eternal-charge | runtime | yes/— | — | statuses/buffs/cooldown-eternal-charge | generic builder | no |
| `expose-weakness` | monster | server/src/systems/player/abilities/abilityEffects.ts:559 | — | authored | —/yes | authored | abilities/expose-weakness | generic builder | yes |
| `flurry` | player | server/src/systems/combat/damage/weaponEffects.ts:214 | flurry | runtime | yes/— | — | statuses/buffs/flurry | generic builder | yes |
| `frame.cadence.window` | player | server/src/systems/classes/shared/frameLoop.ts:97; server/src/systems/classes/archetypes/cadence/frameLoop.ts:116 | frame-window | runtime | yes/— | — | statuses/buffs/frame-window | generic builder | yes |
| `frame.cooldown.window` | player | server/src/systems/classes/shared/frameLoop.ts:97; server/src/systems/classes/archetypes/cooldown/frameLoop.ts:92 | frame-window | runtime | yes/— | — | statuses/buffs/frame-window | generic builder | yes |
| `frame.energy.window` | player | server/src/systems/classes/archetypes/energy/frameLoop.ts:77 | energy-frame-surge | runtime | yes/— | — | statuses/buffs/energy-ac-charge | generic builder | yes |
| `frame.summoner.line` | player | server/src/systems/classes/archetypes/summoner/lineHolds.ts:180 | summoner-frame-line | runtime | yes/— | — | statuses/buffs/summoner-colossus | generic builder | no |
| `frame.summoner.link.<ownerId>` | monster | server/src/systems/classes/archetypes/summoner/frameLoop.ts:172 | — | fallback | —/— | fallback | fallback text | generic builder | yes |
| `frame.summoner.window` | player | server/src/systems/classes/archetypes/summoner/frameLoop.ts:101 | summoner-frame-frenzy | runtime | yes/— | — | statuses/buffs/summoner-coordinated-hunt | generic builder | yes |
| `frost-ramp` | player | server/src/systems/combat/engine/combat.ts:1046 | debuff-frost-ramp | runtime | yes/— | — | statuses/debuffs/debuff-frost-ramp | generic builder | yes |
| `frostbite` | player | server/src/systems/combat/ai/bossScripts.ts:366; shared/src/data/monsters/bossesT3.ts:744; server/src/systems/combat/ai/bossScripts.ts:366; shared/src/data/monsters/bossesT3.ts:756; server/src/systems/combat/ai/bossScripts.ts:366; shared/src/data/monsters/bossesT4.ts:549; server/src/systems/combat/ai/bossScripts.ts:366; shared/src/data/monsters/bossesT4.ts:562 | debuff-boss | runtime | yes/— | — | statuses/debuffs/boss-frostbite | generic builder | timed only |
| `granite-barrier` | monster | server/src/systems/combat/engine/combat.ts:1292,1670; shared/src/data/monsters/mountain.monsters.ts:165; server/src/systems/combat/engine/combat.ts:1292,1670; shared/src/data/monsters/mountain.monsters.ts:227; server/src/systems/combat/engine/combat.ts:1292,1670; shared/src/data/monsters/mountain.monsters.ts:292 | — | authored | —/yes | authored | statuses/buffs/granite-barrier | generic builder | yes |
| `hex-of-ruin` | player | server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:753 | debuff-boss | runtime | yes/— | — | statuses/debuffs/debuff-sundered | generic builder | yes |
| `kata` | player | server/src/systems/player/abilities/abilityKata.ts:70 | kata | runtime | yes/— | — | abilities/charged-strike | generic builder | yes |
| `kata-release` | player | server/src/systems/player/abilities/abilityKata.ts:60 | — | none | —/— | — | fallback text | none | no |
| `lair-drag-root` | player | server/src/systems/combat/damage/lairDrag.ts:109 | debuff-root | runtime | yes/— | — | statuses/debuffs/debuff-root | generic builder | yes |
| `lava-burn` | player | server/src/systems/world/nodeFeatures.ts:649; shared/src/world/nodeFeatures.ts:462 | — | none | —/— | — | fallback text | none | yes |
| `lineage.damage-window` | player | server/src/systems/combat/lineageCards.ts:804; server/src/systems/combat/lineageCards.ts:424 | lineage-damage | runtime | yes/— | — | statuses/buffs/lineage-damage | generic builder | yes |
| `lineage.engagement-dr` | player | server/src/systems/combat/lineageCards.ts:804; server/src/systems/combat/lineageCards.ts:424 | lineage-guard | runtime | yes/— | — | statuses/buffs/lineage-guard | generic builder | yes |
| `lineage.evasion-window` | player | server/src/systems/combat/lineageCards.ts:804; server/src/systems/combat/lineageCards.ts:441 | lineage-evasion | runtime | yes/— | — | statuses/buffs/lineage-evasion | generic builder | yes |
| `lineage.hemorrhage` | monster | server/src/systems/combat/lineageCards.ts:309 | — | fallback | —/— | fallback | fallback text | generic builder | no |
| `lineage.lean-bleed` | monster | server/src/systems/combat/leanConditions.ts:85 | — | fallback | —/— | fallback | fallback text | generic builder | no |
| `lineage.plating-stack` | player | server/src/systems/combat/lineageCards.ts:804; server/src/systems/combat/lineageCards.ts:465 | lineage-plate | runtime | yes/— | — | statuses/buffs/lineage-plate | generic builder | yes |
| `lineage.poison` | monster | server/src/systems/combat/lineageCards.ts:727 | — | fallback | —/— | fallback | fallback text | generic builder | no |
| `lineage.recovery-window` | player | server/src/systems/combat/lineageCards.ts:804; server/src/systems/combat/lineageCards.ts:449 | lineage-recovery | runtime | yes/— | — | statuses/buffs/lineage-recovery | generic builder | yes |
| `lineage.speed-window` | player | server/src/systems/combat/lineageCards.ts:804; server/src/systems/combat/lineageCards.ts:430 | lineage-speed | runtime | yes/— | — | statuses/buffs/lineage-speed | generic builder | yes |
| `lineage.technique-window` | player | server/src/systems/combat/lineageCards.ts:804; server/src/systems/combat/lineageCards.ts:554 | lineage-technique | runtime | yes/— | — | statuses/buffs/lineage-technique | generic builder | yes |
| `lineage.ward` | player | server/src/systems/combat/lineageCards.ts:804; server/src/systems/combat/lineageCards.ts:454 | lineage-ward | runtime | yes/— | — | statuses/buffs/lineage-ward | generic builder | yes |
| `magma-molten-guard` | monster | server/src/systems/combat/engine/combat.ts:1292,1670; shared/src/data/monsters/volcano.monsters.ts:174 | — | authored | —/yes | authored | statuses/buffs/molten-guard | generic builder | yes |
| `magma-obsidian-shell` | monster | server/src/systems/combat/engine/combat.ts:1292,1670; shared/src/data/monsters/volcano.monsters.ts:315 | — | authored | —/yes | authored | statuses/buffs/obsidian-shell | generic builder | yes |
| `mob-forest-haste` | player | server/src/systems/world/mobility/mobilityBoots.ts:270 | mob-haste | runtime | yes/— | — | statuses/buffs/mob-haste | generic builder | yes |
| `mob-graveyard-haste` | player | server/src/systems/world/mobility/mobilityBoots.ts:284 | mob-grave | runtime | yes/— | — | statuses/buffs/mob-grave | generic builder | yes |
| `mob-volcanic-suppress` | player | server/src/systems/world/mobility/mobilityBoots.ts:301 | mob-volcanic, mob-suppress | runtime | yes/— | — | statuses/buffs/mob-volcanic, statuses/buffs/mob-suppress | generic builder | yes |
| `monster-ape-chestbeat` | monster | server/src/systems/combat/engine/combat.ts:1268,1612; shared/src/data/monsters/jungle.monsters.ts:6 | — | authored | —/yes | authored | statuses/buffs/monster-ape-chestbeat | generic builder | yes |
| `monster-death-empower` | monster | server/src/systems/combat/damage/monsterDeathEffects.ts:43 | — | authored | —/yes | authored | statuses/buffs/necrotic-surge | generic builder | yes |
| `monster-dot:ashspitter-burn` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/volcano.monsters.ts:283 | debuff-dot | runtime | yes/— | — | statuses/buffs/dot-conflag | generic builder | yes |
| `monster-dot:bramble-sap` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/forest.monsters.ts:105 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:caldera-burn` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT4.ts:661; server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT4.ts:682 | debuff-dot | runtime | yes/— | — | statuses/debuffs/dot-simmering-burn | generic builder | yes |
| `monster-dot:constrictor-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/jungle.monsters.ts:242 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:dart-poison` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/jungle.monsters.ts:125 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:deep-spider-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/cave.monsters.ts:198 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:ember-burn` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/volcano.monsters.ts:213 | debuff-dot | runtime | yes/— | — | statuses/buffs/dot-conflag | generic builder | yes |
| `monster-dot:grave-toadeater-poison` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT1.ts:301 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:hound-plague` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/graveyard.monsters.ts:76 | debuff-dot | runtime | yes/— | — | fallback text | generic builder | yes |
| `monster-dot:hydra-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/swamp.monsters.ts:135 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:lurker-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/swamp.monsters.ts:253 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:mire-gorged-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT2.ts:261 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:plague-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/swamp.monsters.ts:195 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:rot-bloom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT3.ts:346 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:rot-spore-plague` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT3.ts:276 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:snake-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/jungle.monsters.ts:90 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:spider-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/cave.monsters.ts:127 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:spiderling-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/cave.monsters.ts:113 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:stalker-venom` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/swamp.monsters.ts:171 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:swamp-poison` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/swamp.monsters.ts:74; server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/swamp.monsters.ts:86 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-dot:venomous-bite` | player | server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT3.ts:530; server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT4.ts:395; server/src/systems/combat/status/monsterDot.ts:34; shared/src/data/monsters/bossesT4.ts:420 | debuff-dot | runtime | yes/— | — | statuses/debuffs/debuff-poison | generic builder | yes |
| `monster-howl-haste` | monster | server/src/systems/combat/engine/combat.ts:1268,1612; shared/src/data/monsters/forest.monsters.ts:119 | — | authored | —/yes | authored | statuses/buffs/monster-howl-haste | generic builder | yes |
| `plating-shred` | both | server/src/systems/classes/archetypes/cadence/t3/pipeline/empoweredHit.ts:160; server/src/systems/classes/shared/frameLoop.ts:210; server/src/systems/combat/lineageCards.ts:626; server/src/systems/combat/status/platingShred.ts:60 | debuff-plating-shred | player runtime; target badge/fallback | yes/yes | authored | statuses/debuffs/debuff-sundered, statuses/debuffs/debuff-plating-shred | generic builder | no/yes |
| `poison-dagger-burn` | monster | server/src/systems/combat/damage/weaponReservoir.ts:49; shared/src/data/recipes/swamp.recipes.ts:49 | — | authored | —/yes | authored | statuses/debuffs/debuff-poison | generic builder | yes |
| `reload-cover-fire` | player | server/src/systems/classes/archetypes/reload/t3/lifecycleHandlers.ts:87 | reload-cover-fire | runtime | yes/— | — | statuses/buffs/reload-cover-fire | generic builder | yes |
| `reload-suppress-shred` | monster | server/src/systems/classes/archetypes/reload/t3/pipeline/balancedPaths.ts:50 | — | authored | —/yes | authored | statuses/debuffs/debuff-plating-shred | generic builder | no |
| `rend` | player | server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT4.ts:903; server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT4.ts:939 | debuff-boss | runtime | yes/— | — | statuses/debuffs/boss-rend | generic builder | yes |
| `rimebrand-burn` | monster | server/src/systems/combat/damage/weaponReservoir.ts:49; shared/src/data/recipes/tundra.recipes.ts:111 | — | authored | —/yes | authored | statuses/buffs/dot-chill | generic builder | yes |
| `shatter-vulnerable` | monster | server/src/systems/combat/ai/bossPatterns.ts:826; server/src/systems/combat/engine/combat.ts:195 | — | authored | —/yes | authored | statuses/debuffs/shatter-vulnerable | generic builder | yes |
| `shelled` | monster | server/src/systems/combat/ai/shellUp.ts:166 | — | authored | —/yes | authored | statuses/buffs/shelled | generic builder | yes |
| `slow` | player | server/src/systems/combat/ai/ai.ts:496; server/src/systems/combat/ai/bossPatterns.ts:1953; server/src/systems/combat/engine/combat.ts:958; server/src/systems/combat/engine/combat.ts:974; server/src/systems/combat/engine/combat.ts:1738; server/src/systems/combat/engine/combat.ts:1762; server/src/systems/world/groundZones.ts:566; server/src/systems/world/groundZones.ts:599; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT2.ts:461; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT3.ts:392; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT3.ts:417; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT3.ts:732; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:243; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:272; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:525; server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT4.ts:647; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:757; server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT4.ts:900; server/src/systems/combat/ai/bossPatterns.ts:2373; shared/src/data/monsters/bossesT4.ts:932; server/src/systems/world/nodeFeatures.ts:598; shared/src/world/nodeFeatures.ts:202; server/src/systems/world/nodeFeatures.ts:598; shared/src/world/nodeFeatures.ts:253; server/src/systems/combat/engine/combat.ts:1210; server/src/systems/combat/engine/combat.ts:1238 | debuff-slow, debuff-root | runtime | yes/— | — | statuses/debuffs/debuff-slow, statuses/debuffs/debuff-root | generic builder | yes |
| `stance-power-release` | player | server/src/systems/player/stances/stanceBehaviors.ts:124 | stance-release | runtime | yes/— | — | statuses/buffs/stance-release | generic builder | yes |
| `stance-reaper-momentum` | player | server/src/systems/player/stances/stanceBehaviors.ts:64 | stance-reaper | runtime | yes/— | — | statuses/buffs/stance-reaper | generic builder | yes |
| `stun-immune` | both | server/src/systems/combat/status/stun.ts:65; server/src/systems/classes/archetypes/cadence/frameLoop.ts:113; server/src/systems/combat/status/stun.ts:65; server/src/systems/classes/archetypes/energy/frameLoop.ts:200; server/src/systems/combat/status/stun.ts:65; server/src/systems/classes/archetypes/summoner/frameLoop.ts:204; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/engine/combat.ts:218; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/engine/combat.ts:1366; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/engine/combat.ts:2146; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/engine/combat.ts:2687; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/engine/patternCombat.ts:102; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/keystones/ladder.ts:86; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/lineageCards.ts:759; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/rangeMechanics.ts:213; server/src/systems/combat/status/stun.ts:65; server/src/systems/combat/status/stun.ts:65; server/src/systems/player/abilities/abilityEffects.ts:362 | — | target badge/fallback only | —/yes | authored | abilities/break-free | target fallback only | no |
| `stunned` | both | server/src/systems/combat/status/stun.ts:57; server/src/systems/classes/archetypes/cadence/frameLoop.ts:113; server/src/systems/combat/status/stun.ts:57; server/src/systems/classes/archetypes/energy/frameLoop.ts:200; server/src/systems/combat/status/stun.ts:57; server/src/systems/classes/archetypes/summoner/frameLoop.ts:204; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/engine/combat.ts:218; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/engine/combat.ts:1366; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/engine/combat.ts:2146; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/engine/combat.ts:2687; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/engine/patternCombat.ts:102; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/keystones/ladder.ts:86; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/lineageCards.ts:759; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/rangeMechanics.ts:213; server/src/systems/combat/status/stun.ts:57; server/src/systems/combat/status/stun.ts:57; server/src/systems/player/abilities/abilityEffects.ts:362 | — | target badge/fallback only | —/yes | authored | statuses/debuffs/debuff-stunned | target fallback only | yes |
| `summoner-harried` | monster | server/src/systems/classes/archetypes/summoner/specs/index.ts:80; server/src/systems/classes/archetypes/summoner/specs/index.ts:176; server/src/systems/classes/archetypes/summoner/specs/index.ts:80; server/src/systems/classes/archetypes/summoner/specs/index.ts:436 | — | authored | —/yes | authored | statuses/buffs/summoner-harrier-brood | generic builder | yes |
| `summoner-withering-chorus` | monster | server/src/systems/classes/archetypes/summoner/specs/index.ts:80; server/src/systems/classes/archetypes/summoner/specs/index.ts:195; server/src/systems/classes/archetypes/summoner/specs/index.ts:80; server/src/systems/classes/archetypes/summoner/specs/index.ts:385 | — | authored | —/yes | authored | statuses/buffs/summoner-withering-chorus | generic builder | yes |
| `sun-mark` | player | server/src/systems/combat/engine/combat.ts:927; server/src/systems/combat/engine/combat.ts:1922; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT2.ts:435; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT3.ts:384; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT3.ts:414; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:238; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:269; server/src/systems/combat/ai/bossPatterns.ts:1379; shared/src/data/monsters/bossesT4.ts:301 | debuff-sun-mark | runtime | yes/— | — | statuses/debuffs/debuff-sun-mark | generic builder | yes |
| `sundered` | player | server/src/systems/combat/engine/combat.ts:1014; server/src/systems/world/groundZones.ts:582; server/src/systems/combat/engine/combat.ts:1210; server/src/systems/combat/engine/combat.ts:1253 | debuff-sundered | runtime | yes/— | — | statuses/debuffs/debuff-sundered | generic builder | yes |
| `sunlight` | player | server/src/systems/combat/damage/weaponEffects.ts:122 | sunlight | runtime | yes/— | — | statuses/buffs/sunlight | generic builder | yes |
| `swamp-blightbrand-burn` | monster | server/src/systems/combat/damage/weaponReservoir.ts:49; shared/src/data/recipes/swamp.recipes.ts:171 | — | authored | —/yes | authored | statuses/debuffs/debuff-poison | generic builder | yes |
| `swamp-mirebrand-burn` | monster | server/src/systems/combat/damage/weaponReservoir.ts:49; shared/src/data/recipes/swamp.recipes.ts:110 | — | authored | —/yes | authored | statuses/debuffs/debuff-poison | generic builder | yes |
| `swamp-rot` | player | server/src/systems/world/nodeFeatures.ts:649; shared/src/world/nodeFeatures.ts:193 | debuff-swamp-rot | runtime | yes/— | — | statuses/debuffs/debuff-swamp-rot | generic builder | yes |
| `thorn-spitter-barrage` | monster | server/src/systems/combat/engine/combat.ts:1268,1612; shared/src/data/monsters/forest.monsters.ts:173 | — | authored | —/yes | authored | statuses/buffs/thorn-spitter-barrage | generic builder | yes |
| `thornback-chameleon-barrage` | monster | server/src/systems/combat/engine/combat.ts:1268,1612; shared/src/data/monsters/jungle.monsters.ts:220 | — | authored | —/yes | authored | statuses/buffs/thorn-spitter-barrage | generic builder | yes |
| `tundra-chill` | player | server/src/systems/world/nodeFeatures.ts:264; shared/src/world/nodeFeatures.ts:549 | debuff-tundra-chill | runtime | yes/— | — | statuses/debuffs/debuff-tundra-chill | generic builder | yes (ramp fill) |
| `tundra-rimebrand-burn` | monster | server/src/systems/combat/damage/weaponReservoir.ts:49; shared/src/data/recipes/tundra.recipes.ts:38 | — | authored | —/yes | authored | statuses/buffs/dot-chill | generic builder | yes |
| `volcanic-heat` | player | server/src/systems/world/nodeFeatures.ts:264; shared/src/world/nodeFeatures.ts:506 | debuff-volcanic-heat | runtime | yes/— | — | statuses/debuffs/debuff-volcanic-heat | generic builder | yes (ramp fill) |
| `vulnerability` | monster | server/src/systems/classes/archetypes/cadence/t3/pipeline/empoweredHit.ts:145; server/src/systems/combat/damage/weaponEffects.ts:242; server/src/systems/combat/lineageCards.ts:582; server/src/systems/combat/rangeMechanics.ts:328 | — | authored | —/yes | authored | abilities/expose-weakness | generic builder | yes/no |

## Projected tile registry

| Tile ID | Producer | Status inputs (otherwise resource/component/target selector) | Help | Icon lookup |
| --- | --- | --- | --- | --- |
| `ability-bramble` | server/src/systems/player/abilities/abilityBuffs.ts:94 | ability-bramble | authored | statuses/buffs/ability-bramble |
| `ability-control-resist` | server/src/systems/player/abilities/abilityBuffs.ts:177 | ability-control-resist | authored | abilities/break-free |
| `ability-frenzy` | server/src/systems/player/abilities/abilityBuffs.ts:120 | ability-frenzy | authored | abilities/frenzy |
| `ability-guard` | server/src/systems/player/abilities/abilityBuffs.ts:23 | ability-guard | authored | statuses/buffs/ability-guard |
| `ability-guard-2` | server/src/systems/player/abilities/abilityBuffs.ts:23 | ability-guard-2 | authored | statuses/buffs/ability-guard-2 |
| `ability-imbue` | server/src/systems/player/abilities/abilityBuffs.ts:142 | ability-imbue | authored | abilities/imbue-lightning |
| `ability-second-wind` | server/src/systems/player/abilities/abilityBuffs.ts:57 | ability-second-wind | authored | abilities/second-wind |
| `ability-second-wind-2` | server/src/systems/player/abilities/abilityBuffs.ts:57 | ability-second-wind-2 | authored | abilities/second-wind |
| `cadence-accelerando` | server/src/systems/classes/archetypes/cadence/t3/core/buffs.ts:12 | derived state | authored | statuses/buffs/cadence-accelerando |
| `cadence-aftershock` | server/src/systems/classes/archetypes/cadence/t3/core/buffs.ts:80 | derived state | authored | statuses/buffs/cadence-aftershock |
| `cadence-crescendo` | server/src/systems/classes/archetypes/cadence/t3/core/buffs.ts:151 | derived state | authored | statuses/buffs/cadence-crescendo |
| `cadence-echo` | server/src/systems/classes/archetypes/cadence/t3/core/buffs.ts:32 | derived state | authored | statuses/buffs/cadence-echo |
| `cadence-metronome` | server/src/systems/classes/archetypes/cadence/t3/core/buffs.ts:100 | derived state | authored | statuses/buffs/cadence-metronome |
| `cadence-rampage` | server/src/systems/classes/archetypes/cadence/t3/core/buffs.ts:119 | derived state | authored | statuses/buffs/cadence-rampage |
| `cadence-resonance` | server/src/systems/classes/archetypes/cadence/t3/core/buffs.ts:59 | derived state | authored | statuses/buffs/cadence-resonance |
| `cadence-verdict` | server/src/systems/classes/archetypes/cadence/t3/core/buffs.ts:172 | derived state | authored | statuses/buffs/cadence-verdict |
| `cooldown-alignment` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:96 | derived state | authored | statuses/buffs/cooldown-alignment |
| `cooldown-battery` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:83 | battery-charge | authored | statuses/buffs/cooldown-battery |
| `cooldown-channel` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:119 | derived state | authored | statuses/buffs/cooldown-channel |
| `cooldown-eternal-charge` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:68 | eternal-cycle-charge | authored | statuses/buffs/cooldown-eternal-charge |
| `cooldown-overdrive` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:56 | derived state | authored | statuses/buffs/cooldown-overdrive |
| `cooldown-patience` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:35 | derived state | authored | statuses/buffs/cooldown-patience |
| `cooldown-reverb` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:103 | derived state | authored | statuses/buffs/cooldown-reverb |
| `cooldown-rupture` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:110 | derived state | authored | statuses/buffs/cooldown-rupture |
| `cooldown-temporal-ext` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:76 | temporal-extension-buff | authored | statuses/buffs/cooldown-temporal-ext |
| `cooldown-vengeance` | server/src/systems/classes/archetypes/cooldown/t3/core/buffs.ts:90 | derived state | authored | statuses/buffs/cooldown-vengeance |
| `debuff-antiheal` | server/src/systems/combat/buffs/buffSync.ts:407 | antiheal | authored | statuses/debuffs/debuff-antiheal |
| `debuff-boss` | server/src/systems/combat/buffs/buffSync.ts:514 | rend, depth, frostbite, boss-brittle, hex-of-ruin, eroded | authored | statuses/debuffs/debuff-sundered |
| `debuff-dot` | server/src/systems/combat/buffs/buffSync.ts:192 | __disabled-monster-dot-placeholder | authored | statuses/debuffs/debuff-dot |
| `debuff-frost-ramp` | server/src/systems/combat/buffs/buffSync.ts:157 | frost-ramp | authored | statuses/debuffs/debuff-frost-ramp |
| `debuff-frozen` | server/src/systems/combat/buffs/buffSync.ts:127 | dot-frozen | authored | statuses/buffs/dot-frozen |
| `debuff-plating-shred` | server/src/systems/combat/buffs/buffSync.ts:373 | plating-shred | authored | statuses/debuffs/debuff-sundered |
| `debuff-root` | server/src/systems/combat/buffs/buffSync.ts:92 | cave-lockdown, slow, lair-drag-root | authored | statuses/debuffs/debuff-root |
| `debuff-slow` | server/src/systems/combat/buffs/buffSync.ts:56 | slow | authored | statuses/debuffs/debuff-slow |
| `debuff-sun-mark` | server/src/systems/combat/buffs/buffSync.ts:255 | sun-mark | authored | statuses/debuffs/debuff-sun-mark |
| `debuff-sundered` | server/src/systems/combat/buffs/buffSync.ts:343 | sundered | authored | statuses/debuffs/debuff-sundered |
| `debuff-swamp-rot` | server/src/systems/combat/buffs/buffSync.ts:226 | swamp-rot | authored | statuses/debuffs/debuff-swamp-rot |
| `debuff-tundra-chill` | server/src/systems/combat/buffs/buffSync.ts:311 | tundra-chill | authored | statuses/debuffs/debuff-tundra-chill |
| `debuff-volcanic-heat` | server/src/systems/combat/buffs/buffSync.ts:281 | volcanic-heat | authored | statuses/debuffs/debuff-volcanic-heat |
| `defense-absorb` | server/src/systems/defense/core/buffs.ts:49 | derived state | authored | statuses/buffs/defense-absorb |
| `defense-debt` | server/src/systems/defense/core/buffs.ts:85 | derived state | authored | statuses/buffs/defense-debt |
| `defense-engagement-dr` | server/src/systems/defense/core/buffs.ts:16 | derived state | authored | statuses/buffs/defense-sustained-dr |
| `defense-reactive-plating` | server/src/systems/defense/core/buffs.ts:99 | derived state | authored | statuses/buffs/defense-reactive-plating |
| `defense-recovery` | server/src/systems/defense/core/buffs.ts:61 | derived state | authored | statuses/buffs/defense-burst |
| `defense-stationary-dr` | server/src/systems/defense/core/buffs.ts:92 | derived state | authored | statuses/buffs/defense-stationary-dr |
| `defense-ward` | server/src/systems/defense/core/buffs.ts:25 | derived state | authored | statuses/buffs/defense-ward |
| `dot-chill` | server/src/systems/classes/archetypes/dot/t3/core/buffs.ts:119 | dot-chill | authored | statuses/buffs/dot-chill |
| `dot-conflag` | server/src/systems/classes/archetypes/dot/t3/core/buffs.ts:99 | dot-conf | authored | statuses/buffs/dot-conflag |
| `dot-frenzy` | server/src/systems/classes/archetypes/dot/t3/core/buffs.ts:24 | dot-frenzy | authored | statuses/buffs/dot-frenzy |
| `dot-frostbite` | server/src/systems/classes/archetypes/dot/t3/core/buffs.ts:55 | dot-frostbite | authored | statuses/buffs/dot-frostbite |
| `dot-frozen` | server/src/systems/classes/archetypes/dot/t3/core/buffs.ts:147 | dot-frozen | authored | statuses/buffs/dot-frozen |
| `dot-vigor` | server/src/systems/classes/archetypes/dot/t3/core/buffs.ts:77 | derived state | authored | statuses/buffs/dot-vigor |
| `energy-ac-charge` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:182 | derived state | authored | statuses/buffs/energy-ac-charge |
| `energy-ac-discharge` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:188 | derived state | authored | statuses/buffs/energy-ac-discharge |
| `energy-aether` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:121 | derived state | authored | statuses/buffs/energy-aether |
| `energy-binary-charge` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:74 | derived state | authored | statuses/buffs/energy-binary-charge |
| `energy-binary-discharge` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:99 | derived state | authored | statuses/buffs/energy-binary-discharge |
| `energy-channel` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:55 | derived state | authored | statuses/buffs/energy-channel |
| `energy-critical-mass` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:141 | derived state | authored | statuses/buffs/energy-critical-mass |
| `energy-equilibrium` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:203 | derived state | authored | statuses/buffs/energy-equilibrium |
| `energy-frame-overcharge` | server/src/systems/classes/archetypes/energy/frameLoop.ts:259 | derived state | authored | statuses/buffs/energy-overcharge |
| `energy-frame-surge` | server/src/systems/classes/archetypes/energy/frameLoop.ts:241 | frame.energy.window, frame.energy.window | authored | statuses/buffs/energy-ac-charge |
| `energy-overcharge` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:175 | energy-overcharge | authored | statuses/buffs/energy-overcharge |
| `energy-overdrive` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:41 | derived state | authored | statuses/buffs/energy-overdrive |
| `energy-reservoir` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:193 | derived state | authored | statuses/buffs/energy-reservoir |
| `energy-sm-pool` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:213 | derived state | authored | statuses/buffs/energy-sm-pool |
| `energy-storm` | server/src/systems/classes/archetypes/energy/t3/core/buffs.ts:160 | derived state | authored | statuses/buffs/energy-storm |
| `flurry` | server/src/systems/combat/damage/weaponEffects.ts:432 | flurry | authored | statuses/buffs/flurry |
| `frame-charge` | server/src/systems/classes/archetypes/cooldown/frameLoop.ts:136 | derived state | authored | statuses/buffs/frame-charge |
| `frame-window` | server/src/systems/classes/archetypes/cooldown/frameLoop.ts:114 | frame.cadence.window, frame.cooldown.window | authored | statuses/buffs/frame-window |
| `kata` | server/src/systems/player/abilities/abilityKata.ts:82 | kata | authored | abilities/charged-strike |
| `lineage-damage` | server/src/systems/combat/lineageCards.ts:1599 | lineage.damage-window | authored | statuses/buffs/lineage-damage |
| `lineage-evasion` | server/src/systems/combat/lineageCards.ts:1606 | lineage.evasion-window | authored | statuses/buffs/lineage-evasion |
| `lineage-guard` | server/src/systems/combat/lineageCards.ts:1602 | lineage.engagement-dr | authored | statuses/buffs/lineage-guard |
| `lineage-plate` | server/src/systems/combat/lineageCards.ts:1604 | lineage.plating-stack | authored | statuses/buffs/lineage-plate |
| `lineage-recovery` | server/src/systems/combat/lineageCards.ts:1601 | lineage.recovery-window | authored | statuses/buffs/lineage-recovery |
| `lineage-speed` | server/src/systems/combat/lineageCards.ts:1600 | lineage.speed-window | authored | statuses/buffs/lineage-speed |
| `lineage-technique` | server/src/systems/combat/lineageCards.ts:1605 | lineage.technique-window | authored | statuses/buffs/lineage-technique |
| `lineage-ward` | server/src/systems/combat/lineageCards.ts:1603 | lineage.ward | authored | statuses/buffs/lineage-ward |
| `mob-burst` | server/src/systems/world/mobility/mobilityBoots.ts:372 | derived state | authored | statuses/buffs/mob-burst |
| `mob-grave` | server/src/systems/world/mobility/mobilityBoots.ts:392 | mob-graveyard-haste | authored | statuses/buffs/mob-grave |
| `mob-haste` | server/src/systems/world/mobility/mobilityBoots.ts:349 | mob-forest-haste | authored | statuses/buffs/mob-haste |
| `mob-kite` | server/src/systems/world/mobility/mobilityBoots.ts:421 | derived state | authored | statuses/buffs/mob-kite |
| `mob-rush` | server/src/systems/world/mobility/mobilityBoots.ts:441 | derived state | authored | statuses/buffs/mob-rush |
| `mob-sprint` | server/src/systems/world/mobility/mobilityBoots.ts:329 | derived state | authored | statuses/buffs/mob-sprint |
| `mob-suppress` | server/src/systems/world/mobility/mobilityBoots.ts:491 | mob-volcanic-suppress | authored | statuses/buffs/mob-suppress |
| `mob-volcanic` | server/src/systems/world/mobility/mobilityBoots.ts:468 | mob-volcanic-suppress | authored | statuses/buffs/mob-volcanic |
| `reload-cannon` | server/src/systems/classes/archetypes/reload/t3/core/buffs.ts:70 | derived state | authored | statuses/buffs/reload-cannon |
| `reload-cover-fire` | server/src/systems/classes/archetypes/reload/t3/core/buffs.ts:86 | reload-cover-fire | authored | statuses/buffs/reload-cover-fire |
| `reload-frame-ramp` | server/src/systems/classes/archetypes/reload/frameLoop.ts:195 | derived state | authored | statuses/buffs/reload-hair-trigger |
| `reload-hair-trigger` | server/src/systems/classes/archetypes/reload/t3/core/buffs.ts:23 | derived state | authored | statuses/buffs/reload-hair-trigger |
| `reload-momentum` | server/src/systems/classes/archetypes/reload/t3/core/buffs.ts:48 | derived state | authored | statuses/buffs/reload-momentum |
| `reload-snipe-ready` | server/src/systems/classes/archetypes/reload/t3/core/buffs.ts:15 | derived state | authored | statuses/buffs/reload-snipe-ready |
| `stance-charge` | server/src/systems/player/stances/stanceBehaviors.ts:235 | derived state | authored | statuses/buffs/stance-charge |
| `stance-reaper` | server/src/systems/player/stances/stanceBehaviors.ts:203 | stance-reaper-momentum | authored | statuses/buffs/stance-reaper |
| `stance-release` | server/src/systems/player/stances/stanceBehaviors.ts:263 | stance-power-release | authored | statuses/buffs/stance-release |
| `summoner-battle-bond` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:148 | derived state | authored | statuses/buffs/summoner-battle-bond |
| `summoner-colossus` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:132 | derived state | authored | statuses/buffs/summoner-colossus |
| `summoner-coordinated-hunt` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:72 | derived state | authored | statuses/buffs/summoner-coordinated-hunt |
| `summoner-endless-swarm` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:42 | derived state | authored | statuses/buffs/summoner-endless-swarm |
| `summoner-frame-frenzy` | server/src/systems/classes/archetypes/summoner/frameLoop.ts:249 | frame.summoner.window, frame.summoner.window | authored | statuses/buffs/summoner-coordinated-hunt |
| `summoner-frame-line` | server/src/systems/classes/archetypes/summoner/lineHolds.ts:202 | frame.summoner.line, frame.summoner.line | authored | statuses/buffs/summoner-colossus |
| `summoner-frame-link` | server/src/systems/classes/archetypes/summoner/frameLoop.ts:271 | derived state | authored | statuses/buffs/summoner-battle-bond |
| `summoner-grand-ritual` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:111 | derived state | authored | statuses/buffs/summoner-grand-ritual |
| `summoner-harrier-brood` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:54 | derived state | authored | statuses/buffs/summoner-harrier-brood |
| `summoner-twin-covenant` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:164 | derived state | authored | statuses/buffs/summoner-twin-covenant |
| `summoner-volatile-brood` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:24 | derived state | authored | statuses/buffs/summoner-volatile-brood |
| `summoner-withering-chorus` | server/src/systems/classes/archetypes/summoner/specs/buffs.ts:93 | derived state | authored | statuses/buffs/summoner-withering-chorus |
| `sunlight` | server/src/systems/combat/damage/weaponEffects.ts:410 | sunlight | authored | statuses/buffs/sunlight |

## Boss effect and phase namespace

| ID | Producer | Carries | Label/badge | Help | Icon alias | Tooltip |
| --- | --- | --- | --- | --- | --- | --- |
| `bestial-frenzy` | server/src/systems/combat/ai/bossScripts.ts:674; shared/src/data/monsters/bossesT1.ts:182; server/src/systems/combat/ai/bossScripts.ts:674; shared/src/data/monsters/bossesT2.ts:172 | monster | authored | authored | cadence-rampage | generic builder |
| `blood-in-the-water` | none found | monster | authored | authored | mob-haste | generic builder |
| `boss-phase` | client/src/hud/TargetFrame.tsx:48 (client-generated phase tile) | monster | authored | authored | boss-phase | phase description |
| `boss-stunned` | server/src/systems/combat/ai/bossPatterns.ts:465 | monster | authored | authored | debuff-stunned | generic builder |
| `caldera-fury` | none found | monster | authored | authored | cadence-rampage | generic builder |
| `cataclysm` | server/src/systems/combat/ai/bossPatterns.ts:367; shared/src/data/monsters/bossesT4.ts:630 | monster | authored | authored | boss-final-strike | generic builder |
| `charge-instinct` | server/src/systems/combat/ai/bossPatterns.ts:281 | monster | authored | authored | mob-haste | generic builder |
| `cinder-fury` | none found | monster | authored | authored | cadence-rampage | generic builder |
| `cornered` | server/src/systems/combat/ai/bossScripts.ts:674; shared/src/data/monsters/bossesT4.ts:436; server/src/systems/combat/ai/bossScripts.ts:674; shared/src/data/monsters/bossesT4.ts:437 | monster | authored | authored | boss-cornered | generic builder |
| `crag-rush` | server/src/systems/combat/ai/bossScripts.ts:674; shared/src/data/monsters/bossesT3.ts:135 | monster | authored | authored | mob-haste | generic builder |
| `earthshaker-rush` | server/src/systems/combat/ai/bossScripts.ts:674; shared/src/data/monsters/bossesT4.ts:197 | monster | authored | authored | mob-haste | generic builder |
| `enrage` | server/src/systems/combat/ai/bossScripts.ts:635 | monster | authored | authored | cadence-rampage | generic builder |
| `escape-instinct` | server/src/systems/combat/ai/bossPatterns.ts:282 | monster | authored | authored | mob-haste | generic builder |
| `final-eruption` | server/src/systems/combat/ai/bossPatterns.ts:367; shared/src/data/monsters/bossesT3.ts:596 | monster | authored | authored | boss-final-strike | generic builder |
| `harvest` | server/src/systems/combat/ai/bossScripts.ts:355 | monster | fallback | fallback | none | generic builder |
| `morph` | server/src/systems/combat/ai/bossScripts.ts:773 | monster | authored | authored | summoner-volatile-brood | generic builder |
| `regen` | server/src/systems/combat/ai/bossScripts.ts:649 | monster | authored | authored | boss-regen | generic builder |
| `relentless-pursuit` | server/src/systems/combat/ai/bossScripts.ts:674; shared/src/data/monsters/bossesT2.ts:475 | monster | authored | authored | mob-haste | generic builder |
| `sandsurge` | none found | monster | authored | authored | mob-haste | generic builder |
| `shield` | server/src/systems/combat/ai/bossScripts.ts:660 | monster | authored | authored | defense-absorb | generic builder |
| `slam` | none found | monster | authored | authored | cadence-aftershock | generic builder |
| `stat-buff` | none found | monster | authored | authored | energy-overcharge | generic builder |
| `stat-buff-attack` | server/src/systems/combat/ai/bossScripts.ts:674 (unlabelled stat-buff fallback) | monster | authored | authored | energy-overcharge | generic builder |
| `stat-buff-attackSpeed` | server/src/systems/combat/ai/bossScripts.ts:674 (unlabelled stat-buff fallback) | monster | authored | authored | cadence-rampage | generic builder |
| `stat-buff-damageReduction` | server/src/systems/combat/ai/bossScripts.ts:674 (unlabelled stat-buff fallback) | monster | authored | authored | defense-sustained-dr | generic builder |
| `stat-buff-evasion` | server/src/systems/combat/ai/bossScripts.ts:674 (unlabelled stat-buff fallback) | monster | authored | authored | mob-sprint | generic builder |
| `stat-buff-plating` | server/src/systems/combat/ai/bossScripts.ts:674 (unlabelled stat-buff fallback) | monster | authored | authored | defense-hardening | generic builder |
| `stat-buff-speed` | server/src/systems/combat/ai/bossScripts.ts:674 (unlabelled stat-buff fallback) | monster | authored | authored | mob-haste | generic builder |
| `summon` | none found | monster | authored | authored | summoner-grand-ritual | generic builder |

## Dynamic writer evidence

| Source | ID expression | Config (excerpt) |
| --- | --- | --- |
| server/src/systems/classes/archetypes/summoner/frameLoop.ts:172 | linkId | { id: linkId, maxStacks: 1, remainingMs: windowMs, refreshable: true, sourceId: owner.isPlayer.id, data: { slotMask: 0, totalMs: windowMs }, } |
| server/src/systems/classes/shared/applyPlayerDebuff.ts:53 | applyStatusEffect | playerDebuffConfig(player, config, options) |
| server/src/systems/classes/shared/applyPlayerMechanicBuff.ts:36 | applyStatusEffect | scaleMechanicEffectConfig(config, mult, SCALABLE_MECHANIC_BUFFS) |
| server/src/systems/classes/shared/frameLoop.ts:97 | frameWindowEffectId(root) | { id: frameWindowEffectId(root), maxStacks: 1, refreshable: true, remainingMs: durationMs, sourceId: player.isPlayer.id, data: { totalMs: durationMs }, } |
| server/src/systems/combat/ai/bossPatterns.ts:1379 | step.effectId | { id: step.effectId, maxStacks: Math.max(1, step.stacks), remainingMs: step.durationMs, refreshable: true, sourceId: monster.isMonster.id, data: { totalMs: step.durationMs, ...(ste |
| server/src/systems/combat/ai/bossPatterns.ts:2373 | debuff.effectId | { id: debuff.effectId, maxStacks: debuff.maxStacks ?? Math.max(1, debuff.stacks ?? 1), remainingMs: durationMs, refreshable: true, sourceId: monster.isMonster.id, data: { ...(debuf |
| server/src/systems/combat/ai/bossScripts.ts:366 | room.effectId | { id: room.effectId, maxStacks: room.maxStacks, remainingMs: room.durationMs, refreshable: true, sourceId: monster.isMonster.id, data: { [BOSS_DEBUFF_KEY]: 1, ...room.data, ...(roo |
| server/src/systems/combat/damage/weaponReservoir.ts:49 | profile.effectId | { id: profile.effectId, maxStacks: 1, instanced: false, sourceId: player.isPlayer.id, remainingMs: profile.drainDurationMs, refreshable: true, data: { pool: 0, nextTickIn: profile. |
| server/src/systems/combat/engine/combat.ts:1210 | id | { id, maxStacks: 1, remainingMs: durationMs, refreshable: true, sourceId, data: { [key]: value, totalMs: durationMs }, } |
| server/src/systems/combat/engine/combat.ts:1268 | action.effectId | { id: action.effectId, maxStacks: attacks ?? 1, remainingMs: action.durationMs, refreshable: true, sourceId: monster.isMonster.id, data: { monsterAttackSpeedBuff: 1, attackSpeedPct |
| server/src/systems/combat/engine/combat.ts:1292 | action.effectId | { id: action.effectId, maxStacks: 1, remainingMs: action.durationMs, refreshable: false, sourceId: monster.isMonster.id, data: { monsterWard: 1, wardAmount, wardMaxAmount: wardAmou |
| server/src/systems/combat/engine/combat.ts:1612 | buff.effectId | { id: buff.effectId, maxStacks: charges ?? 1, remainingMs: buff.durationMs ?? -1, refreshable: true, sourceId: monster.isMonster.id, data: { monsterAttackSpeedBuff: 1, attackSpeedP |
| server/src/systems/combat/engine/combat.ts:1670 | ward.effectId | { id: ward.effectId, maxStacks: 1, remainingMs: ward.durationMs, refreshable: false, sourceId: monster.isMonster.id, data: { monsterWard: 1, wardAmount, wardMaxAmount: wardAmount,  |
| server/src/systems/combat/engine/sourceBarriers.ts:44 | sourceBarrierEffectId(sourceId) | { id: sourceBarrierEffectId(sourceId), maxStacks: 1, remainingMs: durationMs, refreshable: false, sourceId: monster.isMonster.id, data: { monsterWard: 1, wardAmount: rounded, wardM |
| server/src/systems/combat/lineageCards.ts:804 | lineageStatusEffectId(kind) | { id: lineageStatusEffectId(kind), maxStacks: 1, refreshable: true, remainingMs: totalMs, sourceId, data: { totalMs, magnitude }, } |
| server/src/systems/combat/status/debuffGuard.ts:27 | applyStatusEffect | config |
| server/src/systems/combat/status/debuffGuard.ts:31 | applyStatusEffect | { ...config, data } |
| server/src/systems/combat/status/monsterDot.ts:34 | debuff.statusEffectId | { id: debuff.statusEffectId, maxStacks: dotEffect.maxStacks, instanced: false, sourceId: monster.isMonster.id, damageSource: { killer: buildKillerFromMonster(monster), abilityName, |
| server/src/systems/combat/status/sharedDebuffRecord.ts:59 | applyStatusEffect | scaled |
| server/src/systems/player/abilities/abilityAffliction.ts:254 | source.id | { id: source.id, maxStacks: source.maxStacks, instanced: source.instanced, refreshable: source.refreshable, remainingMs: source.remainingMs, sourceId: player.isPlayer.id, data: { . |
| server/src/systems/player/abilities/abilityFiring.ts:690 | recoveryEffectIdForAbility(ability.id)! | { id: recoveryEffectIdForAbility(ability.id)!, remainingMs: ms, refreshable: true, sourceId: player.isPlayer.id, data: { totalMs: ms, recoveryPct, }, } |
| server/src/systems/player/abilities/abilityFiring.ts:719 | guardEffectIdForAbility(abilityId)! | { id: guardEffectIdForAbility(abilityId)!, remainingMs: durationMs, refreshable: true, sourceId: player.isPlayer.id, data: { totalMs: durationMs, drPct, ...(knockbackResistPct !==  |
| server/src/systems/world/groundZones.ts:619 | pool.erodes.effectId | { id: pool.erodes.effectId, maxStacks: pool.erodes.maxStacks, remainingMs: pool.erodes.durationMs, refreshable: true, sourceId: pool.ownerId ?? `ground-zone:${pool.id}`, data: { [B |
| server/src/systems/world/nodeFeatures.ts:264 | ramp.effectId | { id: ramp.effectId, maxStacks: ramp.maxStacks, instanced: false, sourceId: `node-feature:${ramp.effectId}`, remainingMs: -1, refreshable: false, data: ambientRampData(ramp.payload |
| server/src/systems/world/nodeFeatures.ts:598 | se.effectId | { id: se.effectId, maxStacks: 1, instanced: false, sourceId, remainingMs: se.refreshMs, refreshable: true, data: { ...se.data, isNodeFeature: NODE_FEATURE_FLAG }, } |
| server/src/systems/world/nodeFeatures.ts:649 | damage.effectId | { id: damage.effectId, maxStacks: damage.maxStacks, instanced: false, sourceId, remainingMs, refreshable: true, data: { damagePerStack: damage.damagePerStack, nextTickIn: damage.ti |

## Method and source seams

Rerun from this worktree root:

```powershell
node --conditions=development --import ./server/node_modules/tsx/dist/loader.mjs server/scripts/_statusAudit.ts
node --conditions=development --import ./server/node_modules/tsx/dist/loader.mjs server/scripts/_statusAudit.ts --calls
node --conditions=development --import ./server/node_modules/tsx/dist/loader.mjs server/scripts/_statusAudit.ts --json
```

The underscore script only reads files and writes stdout. It uses the installed TypeScript parser/checker to scan the requested server systems, the complete shared source set, and the six client tables. This avoids treating comment examples, type declarations, card ids, attack FX ids, and reader-only `requires`/`consumes`/`armWhenTargetStatus` predicates as status applications. It resolves imported constants and literal configuration objects, follows `applyPlayerDebuff`, resisted/shared max-wins writers, and traces status reads through selector helpers. It expands the authoring `effectId` and `debuffId` fields, recipe reservoirs, lineage timed payoff cases, frame window roots, named on-hit poison steps and the two stable Guard/Recovery identities. It preserves every dynamic writer expression in the final appendix; new unexplained expressions set the default command's exit code to 2 for review.

The hand-reviewed dynamic seams are:

| Seam | Source and interpretation |
| --- | --- |
| Raw monster mirror | `server/src/systems/combat/targetStatus.ts:46`: every non-expired `TracksCombat.statusEffects` entry is projected on a targeted monster; unknown ids still receive a fallback badge/tooltip. |
| Player projection | `server/src/systems/combat/buffs/buffSync.ts:457`: registered descriptors plus generic monster DoT and boss-debuff collectors. No generic fallback projects arbitrary player status records. |
| Named monster DoTs | `shared/src/systems/monsterDotFlavor.ts:82`, `server/src/systems/combat/status/monsterDot.ts:34`: normalized `monster-dot:<debuffId>`; `bossPatterns.ts:2230` derives Venomous Bite from the step name. Current authored DoTs all supply an id or that step name. Generic flavor fallback can construct `monster-dot:poison/decay/burn/frost/void` if future data omits its identity; those are supported families, not additional current authored effects. |
| DoT spread and lineage copy | `server/src/systems/player/abilities/abilityAffliction.ts:254`: copies an existing inventory effect id rather than creating a new id; `dotInventory.ts:224,252,276,301,340` covers root DoT, Conflagration, reservoirs and the bleed family. Lineage on-kill copying also retains the existing bleed identity. The rerun prints this dynamic writer rather than inventing another identity. |
| Lineage identities | `shared/src/systems/lineages.ts:60`, `server/src/systems/combat/lineageCards.ts:804`: `lineage.<payoff>` for eight self windows; target payloads route through shared `vulnerability`, `plating-shred`, ability control/stun writers or the three dedicated bleed/poison ids. `shared/src/data/lineages/packets.ts:171,185` and lineage cards describe payload kinds, not separate per-card status ids. Parked trees remain authored data; this audit inventories capability, not proof that a player acquired or fired every card. |
| Qualified families | `summoner/frameLoop.ts:75,172` builds `frame.summoner.link.<ownerId>`; `sourceBarriers.ts:44` builds `barrier:<sourceId>`. The exact suffix depends on live entity identity. |
| Shared forwarding | `classes/shared/applyPlayerDebuff.ts:53`, `applyPlayerMechanicBuff.ts:36`, `combat/status/debuffGuard.ts:27,31`, `sharedDebuffRecord.ts:59` forward existing ids. They add no standalone id. |
| Boss status versus boss effect | `combat/ai/bossScripts.ts:92` publishes `ActiveBossEffect.type` through the separate boss channel; the supplemental table includes arbitrary authored stat-buff label support and generated `stat-buff-<stat>` fallback. Boss recovery, instinct counters, announcements and client phase tiles are not raw `TracksCombat` effects. |
| Buff-bar rendering | `client/src/hud/BuffBar.tsx:94` resolves `statusIconSource(buff.iconKey, buff.instanceKey)`; `buffTransitions.ts:17,28` only changes priority/stack animation, and does not add coverage. `statusTooltips.ts:81,109` provides the generic tooltip/fallback. |
| Target metadata/icons | `client/src/hud/targetStatusMeta.ts:117` and `conceptIcons.ts:511`: raw-status label/color and icon aliases, with the `barrier:` family special case. |
| Specific boss/DoT help | `client/src/hud/statusHelp.ts:289,312,318`: `DOT_HELP` keys strip `monster-dot:`; boss-debuff help comes from `shared/src/systems/bossDebuffs.ts:46`. Unnamed ordinary monster DoTs intentionally share the generic DoT sentence. |

The named-poison icon aliases in `MONSTER_DOT_ICON_ALIASES` do not all describe the live player route: `monsterDotBuff` uses `debuff-poison` whenever the flavor is poison, including Rot Bloom, Gorged Venom, Rot Spores and Venomous Bite. The table records the icon actually requested by that route, while those specialized art/alias entries remain available. Fire names request their raw id and resolve their named burn aliases. The Graveyard Hound Plague resolves to decay and requests its raw `monster-dot:hound-plague` id, which has no icon lookup. Hex of Ruin uses the generic boss-debuff art because it has no dedicated boss-debuff icon alias.

Unused definitions were checked separately from applied ids: `debuff-immune` has an explicit no-producer comment in `combat/status/debuffGuard.ts:33`; `glacial-fracture` and `permafrost` are client animation frame-map ids in `dot/t3/core/mirroring.ts:85,96`; `swiftblade`, `channel-beam`, teleport, blast and card FX ids are combat-event/animation vocabulary, not new carried status records. They are not silently folded into the raw registry.

## Verification and limits

- Initial `Get-Location`, `git status --short`, `git branch --show-current`: correct worktree, clean on `feat/vf-conditions`; created `audit/status-registry` from local `develop` as instructed.
- Full `pnpm typecheck`: **passed**, including all packages, `typecheck:bench` and `typecheck:test`. No runtime suite was requested for this audit.
- Extraction: **passed**, no unexplained dynamic expressions; resolved icon paths were checked against files. The server package-local `tsx` loader is used because the repository root does not export a root `tsx` dependency. No dependency install was run.
- Source-grounded static coverage, not a browser playtest or an execution proof for every authored branch. The script's explicit dynamic expansions and pinned writer references must be reviewed when those seams change; the printed dynamic appendix makes that review reproducible.
- Desktop title-bar verification is unavailable to this subagent. Command working-directory and branch checks were performed with an explicit workdir on every command. No push, merge or changes outside the task's three allowed paths.
