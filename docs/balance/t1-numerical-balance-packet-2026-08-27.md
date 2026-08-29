# T1 Numerical Balance Packet — Live Repository

**Snapshot:** 2026-08-27. This is an extraction packet, not a tuning proposal. Values are taken from live code and runtime adapters; older documentation is subordinate.

Notation: **[S]** source constant; **[D]** derived runtime value; **[C]** conditional value. Percentages are decimals in code. `round` means JavaScript `Math.round`; damage also has a `max(1, ...)` floor.

Authoritative source map: classes and frames `shared/src/data/skillTree/rootsAndFrames.ts` plus `shared/src/systems/stats.ts`; base constants `shared/src/config/gameConfig.ts`; Conduit `shared/src/data/summoner.ts`, `shared/src/systems/summonerProfile.ts`, and `server/src/systems/classes/archetypes/summoner/`; normal pools `shared/src/biomeDatabase.ts` and `shared/src/data/monsters/`; dungeon modifiers `shared/src/dungeons/dungeonDatabase.ts`; bosses `shared/src/data/monsters/bossesT1.ts`; abilities `shared/src/abilities.ts` plus `server/src/systems/player/abilities/`; equipment `shared/src/recipeDatabase.ts` and `shared/src/data/recipes/`; runes `shared/src/runeDatabase.ts`, `shared/src/runeRecipes.ts`, `shared/src/data/runeTuning.ts`, and `server/src/systems/combat/ai/`.

## Runtime rules used by the packet

- T1 player tier is `playerTier = 0`; biome T1 pools use `biomeTier = 1`.
- Base player stats [S]: max HP 100, attack 15, plating 2, range 12 px, recovery 10, speed 120 px/s, unarmed cooldown 3000 ms.
- Class and equipment percentage stat modifiers are summed, then applied once: `round((base + flat equipment) × (1 + summedPct))`. Attack, HP and speed have minimum 1/1/0 floors; plating has a 0 floor. Root attack-range bonuses are additive to range.
- Weapon APS sets `attackCooldown = round(1000 / weaponAPS)` before summed attack-speed modifiers. Final player cooldown: `max(200, round(rawCooldown / max(0.1, 1 + summedAttackSpeedPct)))` [D].
- Direct hit damage: `max(1, round(max(0, attackerAttack − targetPlating × platingMultiplier) × (1 − targetDR)))` [D]. DoTs bypass plating; current T1 DoTs use `max(1, round(baseTick × (1 − playerDR × 0.5) × (1 − dotResistance)))` [D].
- Monster charged multipliers [D] multiply the already basic-mitigated damage (`round(baseBasicDamage × chargedMultiplier)`), then the player’s incoming on-damage listeners apply; they do not subtract plating after multiplying. The charged cast is planted at cast start for AoE and resolves after its wind-up.
- Striker’s player damage cap [D], after evasion/DR and before shields/barriers: if damage exceeds `maxHP × .25`, final capped damage is `ceil(maxHP × .25 + (damage − maxHP × .25) × .5)`. Example at 118 max HP, a 106 raw slam reduced to 104 by 2% DR becomes `ceil(29.5 + 74.5×.5) = 67`; ordinary hits below 29.5 are unchanged.
- Evasion raw ratings add. Dodge conversion [D]: `raw` through 0.50; above that, `0.85 − (0.85 − 0.50) / (1 + (raw − 0.50) × 2)`. Example raw 0.25 ⇒ 25% dodge. Player evasion mitigation is `clamp(0,1, 0.5 + evade-mitigation)`; Slinger root ⇒ 70% of incoming evasion-eligible hit damage.

## A. Six T1 root classes

These are root-node values before a frame, equipment, mastery, or other passive. Root-only examples use the base player and no equipment. The example cooldown is the final derived cooldown from the root attack-speed modifier.

| Root | Attack | Max HP | Plating | Attack speed | Move speed | Range | DR | Evasion | Recovery / barrier / absorb | Other numeric mechanic | Root-only example [D] |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| Striker (`cadence-root`) | +8% | +18% | +15% | +6% | +4% | +0 | +2% | 0 | Recovery pulse: 20% of Recovery active for 4000 ms every 6000 ms | Hit-cap threshold .25 max HP; excess above threshold ×.5 | 16 atk, 118 HP, 2 plate, 125 speed, 2830 ms, DR .02 |
| Squire (`cooldown-root`) | +18% | +30% | +30% | −15% | −10% | +0 | +4% | 0 | 10% of Recovery active continuously in combat | None | 18 atk, 130 HP, 3 plate, 108 speed, 3529 ms, DR .04 |
| Slinger (`reload-root`) | +20% | +7% | 0 | +10% | +10% | +120 | 0 | 30% raw | On kill: 20% of Recovery active for 4000 ms | Evasion-eligible hit damage ×0.70; reload acquisition radius ×2.5 | 18 atk, 107 HP, 2 plate, 132 speed, range132, 2727 ms, 30% dodge |
| Spirit (`energy-root`) | +15% | +3% | 0 | +12% | +12% | +130 | 0 | 0 | Barrier pool = 30% max HP; recharge uses global barrier rules | Barrier is an absorb pool, not HP | 17 atk, 103 HP, 2 plate, 134 speed, range142, 2679 ms, barrier31 |
| Apprentice (`dot-root`) | +10% | +12% | +8% | +2% | +3% | +60 | 0 | 0 | None | DoT resistance 18%; 10% of landed hit damage is redirected to a 4 s DoT debt [C] | 17 atk, 112 HP, 2 plate, 124 speed, range72, 2941 ms |
| Conduit (`summoner-root`) | +8% | +8% | 0 | +4% | +5% | +150 | 0 | 0 | None | No direct player attack at T1; summon formation supplies offense | 16 atk, 108 HP, 2 plate, 126 speed, range162, 2885 ms; direct attack unavailable |

Recovery semantics [S/D]: 1 Recovery = 1% max HP/s when 100% active. Recovery access fractions add; they do not directly heal that percentage of max HP. Barrier default recharge begins after 4000 ms without damage and refills at 25% of the pool per second unless overridden.

### T1 frame additions

Frames are the authored T1 specialization layer. Add their values to the root, then apply the shared formulas above. Blank cells are zero.

| Root / T1 frame | Attack | HP | Plating | AS | Move | Range | DR | Frame mechanic |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Striker / Flurry | 6% | 4% | 0 | 12% | 10% | 0 | 0 | Cadence threshold 4; empowered hit ×1.5 |
| Striker / Skirmisher | 7% | 10% | 10% | 4% | 3% | 0 | 0 | Threshold 5; empowered ×2 |
| Striker / Breaker | 5% | 18% | 20% | −10% | −10% | 0 | 2% | Threshold 6; empowered ×4 |
| Squire / Warrior | 7% | 5% | 5% | 12% | 10% | 0 | 0 | Empowered cooldown 5000 ms; multiplier ×1.5 |
| Squire / Knight | 8% | 12% | 15% | 3% | −2% | 0 | 2% | Empowered cooldown 7000 ms; multiplier ×2 |
| Squire / Bulwark | 10% | 22% | 25% | −12% | −12% | 0 | 3% | Empowered cooldown 8000 ms; multiplier ×3.5 |
| Slinger / Scout | 8% | 4% | 0 | 10% | 10% | 0 | 0 | Evasion +7%; ammo 5; reload 1200 ms |
| Slinger / Marksman | 8% | 8% | 0 | 4% | 4% | 0 | 0 | Evasion +4%; ammo 10; reload 2000 ms |
| Slinger / Artillerist | 10% | 14% | 12% | −4% | −5% | 0 | 0 | Ammo 20; reload 3000 ms |
| Spirit / Spark | 7% | 3% | 0 | 12% | 12% | 0 | 0 | 20 energy/hit; empowered ×1.5 |
| Spirit / Wraith | 8% | 7% | 6% | 6% | 6% | 0 | 0 | 14 energy/hit; empowered ×2 |
| Spirit / Phantasm | 10% | 14% | 12% | −10% | −8% | 0 | 2% | 10 energy/hit; empowered ×6 |
| Apprentice / Venom Vessel | 6% | 4% | 0 | 10% | 10% | 0 | 0 | DoT cap 8; conversion .30; tick 1000 ms; duration 5000 ms; mechanic multiplier ×1.25 |
| Apprentice / Ember Mage | 7% | 10% | 10% | 3% | 0 | 0 | 0 | DoT cap 6; conversion .50; tick 1500 ms; duration 5500 ms; multiplier ×1.20 |
| Apprentice / Rime-Bound | 8% | 18% | 20% | −10% | −10% | 0 | 3% | DoT cap 3; conversion .70; tick 2000 ms; duration 6500 ms; multiplier ×1.15 |

## B. Conduit summons

Conduit has formation profiles rather than separately authored monster species. Each live slot uses the same owner-derived attack/cooldown/range/recovery and differs by profile weight and position. T1 direct attacks are unavailable; summon hits run through the owner’s combat pipeline.

| Profile / T1 choice | Active slots | Per-slot offense / defense / proc weight | Total summon HP budget | Formation offense | Move multiplier | Attack mode / range / preferred gap | Root-only owner example per slot: HP / atk / interval / APS / move |
|---|---:|---:|---:|---:|---:|---|---|
| Root / Summoner | 4 | .25 / .25 / .25 | 0.80 × owner max HP | ×1.00 | ×1.00 | Melee, 96 px, 72 px | 22 / 4 / 2885 ms / .347 / 166 px/s |
| Splinter / light | 6 | 1/6 each | 0.66 × owner max HP | ×1.05 | ×1.18 | Melee, 96 px, 72 px | 12 / 3 / 2885 ms / .347 / 196 px/s |
| Consort / balanced | 5 | .20 each | 1.00 × owner max HP | ×1.00 | ×1.00 | Melee, 96 px, 72 px | 22 / 3 / 2885 ms / .347 / 166 px/s |
| Effigy / heavy | 2 | .50 each | 1.40 × owner max HP | ×.98 | ×.78 | Melee, 96 px, 72 px | 76 / 8 / 2885 ms / .347 / 160 px/s |

Per-slot runtime formulas [D]:

- `minionHP = max(10, round(ownerMaxHP × totalSummonHpPct × defenseWeight))`.
- `minionAttack = max(1, round(ownerAttack × formationOffenseMult × offenseWeight))`.
- `minionInterval = max(100, round(ownerAttackCooldown × summonAttackCooldownMult))`; current T1 profile cooldown multiplier is 1.
- `minionMovement = max(160, round((ownerSpeed + 40) × summonMoveSpeedMult × profileMoveMult))`.
- Example, root-only Conduit (16 attack, 108 HP, 126 speed, 2885 ms): each of four root slots has 22 HP, 4 attack, 2885 ms interval, 96 px range, and 166 px/s movement.

Formation damage [D]: direct hit weight = `formationOffenseMult × (slotOffenseWeight × specializationDamageMult + directDamageBonusWeight)`; on-hit/proc weight = slot proc weight. A Sweep/empower/expose formation rider uses `ownerAttack × formationOffenseMult` as its basis, not a second full minion attack. Current T1 AI chooses the closest monster within 320 px of the owner, uses escort behavior, and has no sticky split-target rule; commanded focus can override. Reconstruction is FIFO, one slot at a time. Rebuild cost = `round(minionHP × .30)`; rebuild waits if owner HP would fall below 20% max HP. While reconstruction debt exists in combat, owner combat recovery is `ownerMaxHP × (Recovery/100) × .20` per second.

## C. Every current T1 enemy

The live T1 normal pools are: Plains `plains-slime`, `boar`; Forest `forest-slime`, `wolf`; Swamp `bog-slime`, `mud-toad`; Mountain `cliff-hopper`, `ridge-archer` (the pool contains Cliff Hopper twice); Cave `cave-lurker`, `cave-brute`. Pool membership, not a source file’s `level1` label, defines the current roster. Basic APS below is `1000 / interval` [D].

### Normal mobs

| Biome | Enemy (ID) | HP | Basic attack | Interval / APS | Range | Plate | DR | Move | Special mechanics |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| Plains | Field Hare (`plains-slime`) | 50 | 12 | 2000 ms / .50 | 12 | 0 | 0 | 46 | Pack follower; call range 280; cohesion .10; separation 40 |
| Plains | Boar (`boar`) | 100 | 18 | 1900 ms / .526 | 12 | 0 | 0 | 50 | On aggro: speed ×2.5 for 1000 ms; pack cohesion .08; separation 56 |
| Forest | Moss Rat (`forest-slime`) | 160 | 17 | 1400 ms / .714 | 12 | 0 | 0 | 54 | None beyond melee impact |
| Forest | Wolf (`wolf`) | 130 | 20 | 1100 ms / .909 | 12 | 0 | 0 | 82 | Pack alpha calls 2 Young Wolves; call range 320 |
| Forest | Young Wolf (`young-wolf`, follower) | 70 | 14 | 1150 ms / .870 | 12 | 0 | 0 | 86 | Pack follower; call range 300; spawned by Wolf, not ambient pool |
| Swamp | Mire Ooze (`bog-slime`) | 140 | 10 | 2000 ms / .50 | 12 | 0 | 0 | 28 | Poison: 5 damage/stack/tick, max 3, tick 1000 ms, duration 4000 ms |
| Swamp | Mud Toad (`mud-toad`) | 120 | 13 | 2200 ms / .455 | 12 | 2 | 0 | 30 | Poison: 4/stack/tick, max 3, tick 1000 ms, duration 4000 ms |
| Mountain | Cliff Hopper (`cliff-hopper`) | 190 | 50 | 3000 ms / .333 | 12 | 0 | 0 | 28 | Strong Kick: cast 1100 ms, cooldown 9000 ms, initial 3200 ms, ×1.9, knockback 180 px; aggro speed ×3 for 1200 ms |
| Mountain | Ridge Ambusher (`ridge-archer`) | 240 | 50 | 3100 ms / .323 | 210 | 0 | 0 | 26 | Power Shot: cast 2000 ms, cooldown 8000 ms, initial 3500 ms, ×2.2 |
| Cave | Cave Lurker (`cave-lurker`) | 225 | 31 | 1400 ms / .714 | 12 | 1 | .05 | 68 | None beyond melee impact |
| Cave | Cave Brute (`cave-brute`) | 250 | 80 | 2800 ms / .357 | 12 | 1 | .10 | 18 | Ground Slam: cast 1800 ms, cooldown 12000 ms, initial 9000 ms, ×2, planted AoE radius110; aggro speed ×2.5 for 1200 ms; elite |

For the current normal DoTs, every landed qualifying monster hit applies one stack up to cap and refreshes duration. Current T1 DoTs do not bypass barriers. At max stacks, raw poison DPS is Ooze 15 and Toad 12 before player DoT resistance/DR treatment.

### Dungeon guardians

These are the first guarded-altar compositions, with dungeon modifiers applied to the normal definitions. Guardian stat derivation [D]: `HP=round(baseHP×hpMult)`, `attack=round(baseAttack×attackMult)`, `interval=round(baseInterval/attackSpeedMult)`, `speed=round(baseSpeed×moveSpeedMult)`, `DR=min(1, baseDR+drAdd)`; guardian DoT damage is `round(baseDot×dotMult)`.

| Biome | Guardian composition / count | Live modifier | Effective guardian stats and mechanics |
|---|---|---|---|
| Plains | 3 groups; each 1 Boar + 3 Field Hares (3 Boars, 9 Hares) | AS ×1.08 | Boar: 100 HP, 18 atk, 1759 ms, range12, plate0, DR0, speed50, ×2.5 aggro for1000 ms. Hare: 50 HP, 12 atk, 1852 ms, range12, plate0, DR0, speed46. Pack local wander110, pull175, leash320. |
| Forest | 3 groups; each 1 Wolf + 2 Young Wolves (3 + 6) | AS ×1.25; move ×1.12 | Wolf: 130 HP, 20 atk, 880 ms, speed92. Young: 70 HP, 14 atk, 920 ms, speed96. Range12, plate0, DR0. Wolf pack call range320; young follower call300; local wander90, pull180, leash320. |
| Swamp | 3 groups; each 1 Mud Toad + 1 Mire Ooze (3 + 3) | HP ×1.05; attack ×1.05; DoT ×1.30 | Toad: 126 HP, 14 atk, 2200 ms, plate2, DR0, speed30, poison 5/stack/tick, max3, 1000 ms tick, 4000 ms duration. Ooze: 147 HP, 11 atk, 2000 ms, plate0, DR0, speed28, poison 7/stack/tick, max3, same tick/duration. Pull170, leash320. |
| Mountain | 4 post-hold groups; 1 Ridge Ambusher each | HP ×1.15; attack ×1.35 | 276 HP, 68 atk, 3100 ms, range210, plate0, DR0, speed26; Power Shot cast2000, cooldown8000, initial3500, ×2.2. Pull190, leash320. |
| Cave | 3 patrol groups; 1 Cave Brute each | HP ×1.30; attack ×1.15; DR +.05 | 325 HP, 92 atk, 2800 ms, range12, plate1, DR.15, speed18; Ground Slam cast1800, cooldown12000, initial9000, ×2, radius110; aggro ×2.5 for1200 ms. Pull240, leash740; patrol 8 points, hold600–1400 ms. |

### Dungeon guardians and boss targeting

Guardians use the normal monster special pipelines. Charged AoEs plant at cast start and resolve after wind-up even if the player leaves; the telegraph is visible for the cast duration. Damage goes through normal plating, DR, player hit caps, barriers, and Brace. Dungeon success cooldown is 60 s and awakening delay is 7 s [S].

### Dungeon bosses

| Biome / boss (ID) | HP | Basic attack / interval | Range / plate / DR / move | Specials and phase values |
|---|---:|---:|---|---|
| Plains — Tusked Razorback | 1700 | 34 / 2000 ms (.50 APS) | 15 / 4 / .02 / 50 | At 50% HP: spawn 4 Field Hares (`maxAlive=6`, offset220), 1 Boar (`maxAlive=6`, offset220), and roar allies within 320 px: attack speed +20% for8000 ms. Repeating every10000 ms after4000 ms: spawn 2 Hares (`maxAlive=5`, offset220). Prefers players; leash750. |
| Forest — Gnarled Greatbear | 2000 | 24 / 1900 ms (.526 APS) | 15 / 0 / 0 / 60 | Each basic attack is 2 separate hits. While engaged: attack speed +5% every3000 ms up to +20% (4 ticks / 12 s). At 50% HP: attack ×1.10 and basic cooldown ×.85 (1615 ms before ramp interaction). Prefers players; leash800. |
| Mountain — Crag Behemoth | 2100 | 56 / 3500 ms (.286 APS) | 18 / 0 / 0 / 22 | Ground Slam: cast2400 ms, cooldown10000 ms, initial4500 ms, raw multiplier ×1.9, planted circle radius155; raw base `56×1.9=106.4` before combat rounding/mitigation. Aggro speed ×3 for1200 ms. At 50%: charged multiplier ×1.15 ⇒ ×2.185; cooldown ×.80 ⇒ 8000 ms. |
| Swamp — Grave Toadeater | 2100 | 13 / 2600 ms (.385 APS) | 15 / 2 / .02 / 28 | Toad Poison: 4/stack/tick, max4, tick1000 ms, duration4000 ms. Bile Pool: cast1200 ms, cooldown8500 ms, initial4000 ms, raw ×1.0, planted radius105; pool lasts7000 ms, 3 damage/tick every1000 ms, slow speed ×.65. At 50%: cooldown ×.60 ⇒ 5100 ms; radius ×1.15 ⇒ runtime radius121 px. |
| Cave — Obsidian Broodmother | 1750 | 47 / 2800 ms (.357 APS) | 18 / 6 / .10 / 24 | Each landed hit applies plating shred: −1 plating/stack, max6; persistent encounter debuff and cleansable. Obsidian Slam: cast1700 ms, cooldown9500 ms, initial4500 ms, raw ×1.8, planted radius125; raw base `47×1.8=84.6`. At 50%: shred cap +3 ⇒ max9. Aggro speed ×2.5 for1200 ms. |

Boss phase modifiers are cumulative runtime overrides. Charged phase radius is `round(baseRadius×radiusMult)`, cooldown is `max(1000, round(baseCooldown×cooldownMult))`, cast is `max(200, round(baseCast×castMsMult))`, and multiplier is multiplicative. Boss scripted adds are tracked and removed with the boss. No T1 boss currently has the old generic shield or anti-summon cleave in its live definition.

## D. Relevant T1 abilities

At T1, a tier-1 ability reads rank I (`abilityRankIndex = clamp(playerTier − abilityTier)`). Authored cooldowns below are before cooldown-reduction passives. Technique cooldown after passives: `authoredCooldown × (1 − clamp(0, .90, techniqueCooldownReduction + mobilityCoreReduction if tagged))`; Guard cooldown uses its own reduction namespace and the same 90% cap.

| Ability | T1 rank-I numbers | Current execution / adapter behavior |
|---|---|---|
| Sweep | Cleave splash `.60` of payload; radius90 px; cooldown6000 ms | Armed on next qualifying landed attack; primary is excluded from splash; a miss retains the charge. Conduit uses `ownerAttack×formationOffenseMult` as the formation basis. Technique Power scales splash only. |
| Second Wind | Recovery fraction `.50`; duration4000 ms; cooldown12000 ms; built-in trigger HP ≤60% | Instant Guard. Activates `.50×(1+recovery-skill-potency)` of Recovery rate for the window; it is not a flat 50% max-HP heal. Overheal/antiheal/ward rules remain in the recovery pipeline. |
| Cleanse | Remove 1 stack from 1 distinct harmful effect; cooldown10000 ms; built-in trigger has debuff | Instant Guard. Chooses deepest stacks first, then deterministic effect ID. Does not affect instanced effects. No potency or DR rider. |
| Brace | DR `.35` for3000 ms; knockback resistance `.50`; cooldown10000 ms; built-in trigger HP ≤50% | Instant Guard. Guard potency multiplies magnitudes; DR and knockback resist each cap at .90. Guard duration potency multiplies duration. Multiple Guard DR buffs combine multiplicatively and cap at .90. |
| Power Strike | Damage multiplier ×3.0; cast1600 ms; cooldown10000 ms | Cast Technique; stops the player’s normal attack cycle while charging; hard control interrupts. Damage is `max(1, round(playerAttack×3))` through target plating/DR/cap; single target. Technique Power scales damage multiplier. |
| Expose Weakness | Target damage taken +15% for4000 ms; cooldown12000 ms | Armed Technique; next landed hit applies one non-instanced target debuff. An evaded hit does not apply it. All-source damage is multiplied by 1.15 during the debuff. Technique Power does not scale vulnerability. |

No separate T1 class ability adapter changes these six effects. The relevant live adapter is Conduit’s formation path: summon-triggered standard attacks carry weighted owner direct/on-hit/proc payloads, while formation-aware ability riders use the formation basis described above. T1 Conduit cannot cast a direct player attack because Battle Bond is not a T1 unlock.

## E. Relevant T1 equipment

The table shows item-local values only; class percentages are not pre-multiplied. `atk/APS`, `HP/plate/DR`, `rec`, and `speed` use the item’s authored stat units. Each row includes the incremental scaling for upgrade levels +1 through +5; +3 and +5 are cumulative checkpoints.

| Biome / item (slot) | +0 | +3 | +5 | Special effect and upgrade scaling |
|---|---|---|---|---|
| Plains — Iron Broadsword (`iron-broadsword`, weapon) | atk10 / APS.80 | atk13 / .80 | atk15 / .80 | Technique cooldown reduction .06 → .09 → .11; +1 atk and +.01 reduction each level |
| Plains — Survivor’s Robe (armor) | HP24 / plate7 | HP33 / plate10 | HP39 / plate12 | +3 HP and +1 plate each level |
| Plains — Plains Stone (recovery) | rec1 | rec1.5 | rec2 | Recovery-on-kill .20 → .26 → .30, window4000 ms; +.02 each level; recovery +.5 at +2/+4 |
| Plains — Fleet Boots (mobility) | speed18 | speed21 | speed23 | Kill-speed .25 → .34 → .40 for3000 ms; +1 speed and +.03 each level |
| Forest — Flash Rapier (weapon) | atk5 / APS1.50 | atk6 / 1.56 | atk8 / 1.60 | No named effect; +.02 APS each level; attack +1 at +2, +4, +5 |
| Forest — Shaded Bindings (armor) | HP28 / plate3 / evasion.16 | HP37 / plate4 / .19 | HP43 / plate5 / .22 | +3 HP each level; plate +1 at +2/+4; evasion +.01 at +1–+4 and +.02 at +5 |
| Forest — Heartroot Amulet (recovery) | rec3 | rec4 | rec5 | Recovery-skill potency .10 → .13 → .15; +.01 each level; recovery +1 at +2/+4 |
| Forest — Sprinter Wraps (mobility) | speed22 | speed28 | speed32 | Out-of-combat speed .25 → .40 → .50; +2 speed and +.05 each level |
| Swamp — Poison Dagger (`ashbrand-blade`, weapon) | atk10 / APS.90 | atk13 / .90 | atk15 / .90 | No named effect; +1 attack each level |
| Swamp — Arcane Wrappings (armor) | HP30 / plate4 / DoT resist.20 | HP42 / plate5 / .26 | HP50 / plate6 / .30 | +4 HP each level; plate +1 at +2/+4; DoT resistance +.02 each level |
| Swamp — Murk Eye (recovery) | rec2 | rec3 | rec3 | Recovery pulse .20 every8000 ms for4000 ms → .26 → .30; +.02 each level; recovery +1 at +3 |
| Swamp — Marsh Treads (mobility) | speed18 | speed21 | speed23 | Slow resistance .25 → .34 → .40; +1 speed and +.03 each level |
| Mountain — Heavy Hammer (weapon) | atk26 / APS.55 | atk32 / .55 | atk36 / .55 | Empowered multiplier bonus .15 → .18 → .22; +2 attack each level; bonus +.01 at +1/+2/+3 and +.02 at +4/+5 |
| Mountain — Fallen Knight Plate (armor) | HP32 / plate5 | HP44 / plate6 | HP52 / plate7 | Guard potency .15 → .21 → .25; +4 HP and +.02 potency each level; plate +1 at +2/+4 |
| Mountain — Granite Barrier (recovery) | rec1 | rec2 | rec2 | Barrier pool .12 → .15 → .18 max HP; +.01 at +1/+2/+3, +.015 at +4/+5; recovery +1 at +3 |
| Mountain — Iron Treads (mobility) | speed16 | speed19 | speed21 | Approach speed .35 → .50 → .60; +1 speed and +.05 each level |
| Cave — Chaotic Axe (weapon) | atk22 / APS1.10 | atk27 / 1.10 | atk32 / 1.10 | Dead-swing interval 3 [C]; +1/+2/+2/+3/+2 attack by levels +1…+5 |
| Cave — Bestial Hide (armor) | HP28 / plate4 / DR.06 | HP37 / plate5 / .09 | HP42 / plate6 / .11 | +3 HP each level; plate +1 at +2/+4; DR +.01 each level |
| Cave — Pulse Stone (recovery) | rec2 / absorb.08 | rec3 / .10 | rec3 / .12 | Absorb +.01 each level; recovery +1 at +3 |
| Cave — Bat Wing Boots (mobility) | speed20 | speed23 | speed25 | Stealth .25 → .31 → .35; +1 speed and +.02 each level |

Equipment mechanics [S/D]: absorb converts the authored fraction of final non-DoT damage into a recovery/HoT pool; barrier is a max-HP-scaled absorb pool with the global recharge delay/rate; Guard potency affects Guard ability magnitudes only; Recovery-skill potency affects Recovery-tagged skills only; technique cooldown reduction does not reduce Guard cooldown. Weapon APS changes the base cooldown before class attack-speed percentage. “Dead-swing interval 3” is conditional on the Chaotic Axe weapon’s dead-swing handling, not a flat attack stat.

## F. Rune combat tools

RP is Global Mastery rune budget: `8 + floor(globalMastery / 10)` [D], so GM0 has 8 RP. Action/condition costs below are the current catalog costs, not essence crafting costs.

| Rune tool | RP cost | Current semantics and numeric behavior |
|---|---:|---|
| Chase Enemy (`chase-enemy`) | 0 | Movement action; approaches a selected enemy into normal weapon range. Normal settle target is 90% of attack range, with 64 px approach-goal slack and direct-steering handoff at 100 px. |
| Flee (`flee`) | 1 | Movement action; suppresses target chasing and heads for the nearest open gate, then recovers in the adjacent node, waits for full HP (and party members if leader), and returns to the origin node. Gate-clear margin is 120 px from node edges. |
| Keep Distance / Orbit (`orbit`) | 2 | Movement action; in combat kites while attacking. `maxFireGap=min(attackRange×.92, …)` and `minStandoff=attackRange×.72`; safe gap also considers target reach +45 px: `idealGap=max(minStandoff, min(maxFireGap, targetReach+45))`. Out of combat it retreats to a 220 px edge-to-edge gap and never advances. |
| Recover First / Wait for Regen (`wait-for-regen`) | 1 | OOC maintenance; when no active target/aggro and HP is below max, stops autonomous movement until full HP. Combat recovery itself honors the 4000 ms post-damage regen delay. |
| Avoid Hazards (`avoid-hazards`) | 2 | PATHING action; routes around persistent damaging/slowing terrain, separate from attack telegraphs. Circle hazard route clearance uses +72 px edge buffer and 42 px arrival threshold; skirt angle is .65 rad. |
| Inside Telegraph (`inside-telegraph`) | 1 | Condition; true while player is inside an unresolved hostile attack telegraph. It drives Step Back and does not mean “inside a persistent hazard.” |
| Step Back (`step-back`) | 2 | Movement action allowed only with Inside Telegraph. Samples standable points and steers outside visible hostile telegraphs; hostile circle clearance is telegraph radius +20 px. |
| Fire Guard (`fire-guard`) | 1 | GUARD-channel action; overrides built-in timing for Guard slot 0 while its condition holds. It does not alter the ability effect or cooldown; ability cooldown and a 100 ms guard decision window still apply. `fire-guard-2` is slot 1, cost1, tier4 and inert at T1. |

Current important condition costs: `always` 0; `in-combat` 1; `when-idle` 1; `hp-below-25` 1; `has-debuff` 1; `in-party` 1; `inside-telegraph` 1. The current Fire Guard trigger conditions are the ordinary Guard conditions: HP below authored threshold, has debuff, hard control, aggro-count conditions where available; the rune only changes timing arbitration. At T1, one Guard slot is available.

### Step Back recipe

The current Mountain mastery 2 recipe is `rune-recipe-step-back`: T1, recipe group Mountain, required biome level 2, essence cost **180 blue + 80 yellow**, rune action cost **2 RP**. This is separate from the 20 px runtime escape clearance.

## Documentation/live-code contradictions

- `docs/briefs/t1-balance-context-2026-08-18.md` explicitly records stale node-modifier magnitudes and stale Mountain/Cave T1 figures; live pools and charged-attack definitions above take precedence.
- Comments in `shared/src/data/monsters/bossesT1.ts` say the historical boss band was measured with 50% shields and anti-summon cleave. The live T1 boss definitions no longer contain those mechanics; current charged AoEs, adds, roar, shred, and phase overrides above are the operative values.
- Source files can contain `level1`/reward-level labels for definitions outside the current biome-T1 pool. This packet excludes those from “every T1 enemy” unless they are live pool members or a live T1 pack follower/add.

## Potentially Important Numerical Observations

- T1 normal basic attack raw damage spans 10–80, while player base HP is 100 and T1 root HP is 103–130 before gear; Cave Brute’s ×2 Ground Slam is a 160 raw hit before mitigation (184 for a Cave dungeon guardian after its existing ×1.15 attack modifier).
- T1 normal enemy HP spans 50–250; current boss HP spans 1700–2100, with boss mechanics adding concurrency, multi-hit cadence, DoT/pool attrition, planted burst, or plating shred.
- Flat plating subtraction produces a large sensitivity cliff: the Greatbear’s 24-damage individual hits can approach the 1-damage floor against high-plating builds while remaining much larger against low-plating builds.
- Slinger’s +120 range and Spirit/Conduit’s +130/+150 range are large relative to the 12 px base range; the current Orbit safe-gap buffer is only 45 px beyond target reach when the player still outranges the target.
- Conduit root distributes 80% of owner max HP across four slots, while Splinter distributes 66% across six and Effigy 140% across two; slot loss, reconstruction cost, and formation weights therefore change effective durability nonlinearly.
- Swamp normal poison reaches 12–15 raw DPS at three stacks; Grave Toadeater reaches 16 raw DPS at four stacks before its Bile Pool’s 3 DPS, while current DoT mitigation bypasses plating but is affected by DoT resistance and half-weight DR.
- T1 ability timing is threshold-sensitive: Second Wind triggers at 60% HP, Brace at 50%, while `hp-below-25` is a separate rune condition; Sweep/Expose are armed next-hit effects and Power Strike spends a 1600 ms cast window.
