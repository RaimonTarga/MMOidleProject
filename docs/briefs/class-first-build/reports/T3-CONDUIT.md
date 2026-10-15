# T3-CONDUIT report
**Agent:** Claude (Sonnet)   **Branch:** rw/t3-conduit   **Last commit:** see `git log -1` (report committed on top of the code commit)

## Status table (bible §7.6, §7.8, §7.9, §7.16 T3)

Before this task none of the T3 items had a runtime (the kit named them, nothing executed them).

### T3 summons

| Item | Status | Where / how |
|---|---|---|
| Warhorn (2 Command, call hastens every summon in a wide circle) | wired | `hornAbility`, timed from `updateConduitT3`; status `conduit-horn` carries `attackHastePct` (the Striker's haste key), so `minionAttackCooldown` shortens |
| Burrower (erupts under the back-row caster/gunner) | stand-in | afterHit, on a timer: strikes the enemy with the longest attack reach near the target. No real tunnelling or hiding |
| Sporecaller (enemies around its target deal less) | wired, exact on you, estimate on summons | `conduit-spore` status (`cut`); applied to you through the damage sponge's `onDamageTaken`, to summons as a refund in `onMinionStruckT2` (same stand-in as Barkward) |
| Prowler (strikes from hiding every few seconds, pounces on fleeing) | stand-in | an ambush hit on a timer (one multiplier per hit, recorded as the empowered multiplier); "fleeing" = the same enemy has moved away since this summon's last hit (there is no ordinary-flee moment yet) |
| Carapace Guard (shield toward the strongest ranged attacker, blocks shots at summons behind it) | stand-in | a ranged hit on any other summon is refunded by `blockShare` while a Guard lives; no facing/direction. Taunt copied from Ironhorn (PLACEHOLDER) |
| Frostcaller (enemies around it attack and move slower) | wired | pulse on a timer through `applyMonsterSlow` plus `attackSlowPct`; respects `monsterIgnoresControl` (the control-immune Tundra/Volcanic bosses shrug it off, as §7.16 wants) |
| Cinderling (burns everything around it, hotter as the fight goes) | wired | pulse of area damage, ramp from the fight clock (`fightSeconds`), in every biome |
| Lessons at zone levels | wired | kit lessons already bound them; test asserts all seven bound and fielded |

### Specializations (§7.6)

| Item | Status | Where / how |
|---|---|---|
| Burn Bright | stand-in | a fresh summon gets `conduit-burn-bright` haste for its first seconds; "burn out" = the haste ends. No waves, no dying |
| Legion | wired | `profile.ts`: damage/HP steps at 4 and 8 copies of one summon (never per copy) |
| Infestation | wired / stand-in | hits add ticks of a poison-shaped DoT (the Poison Staff's id) and flag the enemy; an infested enemy that dies bursts as AREA DAMAGE. The "short-lived summons" part needs temporary summon entities and an on-kill review (§7.15 item 8): missing |
| Shield Wall | wired (estimate) | damage to a tank is redistributed across tanks, a layer per different tank type; uses the same estimated-damage stand-in as bark (`runMonsterAttackOnMinion` is not mine) |
| The Hunt | wired | `conduit-hunt` on the enemy records when each kind of damage summon hit it; 2+ kinds in the window raise everyone's damage. First kind adds nothing (PLACEHOLDER reading) |
| Choir | wired | each support ability that fires (Spitter acid, Bloomtender heal, Barkward coat, Sporecaller spores, Frostcaller pulse, Warhorn call) echoes at half strength through every OTHER support type via a hook (`setSupportEchoHook`) |
| Colossus: stats and the shared shake | wired | `profile.ts`: HP x2, damage x1.5 over the BASE summon (replaces Elite's own step); every hit shakes the ground (area). Elite's own splash is skipped under Colossus |
| Colossus: "+1 Command" | **missing in the live check** | `disciplineCommandCost(base, discipline, firstOfType, specializationId)` and `rosterCommand(roster, discipline, specializationId)` are done and tested, but `ClassConfigContext` has no `specializationId`, so the server/client config check does not pass it. See below |
| Colossus: "grow huge" | missing | `RosterBody` has no size field; no change to the body size |
| Ascendant | wired | damage grows per second of the fight (cap), from the fight clock |
| Two Souls | stand-in | `soulsOf(owner)`: relic slot's Soul plus, until the config has a second slot, the newest other Soul the character owns; each is stronger beside the other. The second Soul's Command cost: missing (Soul bodies stay 0 Command) |

### Souls (§7.8, §7.16)

| Item | Status | Where / how |
|---|---|---|
| Rank-ups at T3 (Mountain, Desert, Jungle ranks; Swamp and Cave last rank) | wired | already generic (`trophyRanks` + `soulPower`); the test pins each |
| Tundra Soul (Rime-Mammoth): enemies near it are chilled | wired | `souls.ts`: slow + attack slow around the Soul's body, control-immune bosses excluded |
| Volcanic Soul (Magma Salamander): the formation heats up over a fight | wired | `fightHeatMult`, +10% per 10 s step (cap 6) |
| Retired Plains/Forest Souls keep working | wired | nothing special needed; they never needed a rank-up |

### Gear (§7.9, §7.16)

| Item | Status | Where / how |
|---|---|---|
| Icebound (Tundra weapon) | wired | `conduit.icebound-pct`: harder vs slowed, rooted, chilled or frozen (a stun alone does not count) |
| Berserk (Volcanic weapon) | wired | `conduit.berserk-pct`: up to this much harder as the summon's HP falls |
| Permafrost (Tundra armor) | wired | `conduit.permafrost`: tank summons lose slows, lair root, freeze, frost ramp each tick |
| Hibernate (Tundra charm) | wired / stand-in | under 25% HP a summon encases itself: stunned, its HP cannot fall below where it was, 10%/s regen, 20 s per-summon cooldown. Damage is undone after the fact (hit hook and tick clamp), not prevented |
| Fireproof (Volcanic armor) | wired | `conduit.fireproof-pct`: DoT doses on you and your summons are halved (re-halved after a refresh) |
| Emberglow (Volcanic charm) | stand-in | `conduit.emberglow-pct`: summons within 220 px of you get a share of your Recovery stat per second, in or out of combat |
| T3/T4 copies of First Strike, Longshot, Icebound, Berserk, Jungle/Desert lines, Tundra/Volcanic lines | wired | every T3/T4 copy now carries its job's effect (values copied from the T2/T3 line; the bible's "stronger" has no numbers) |
| Moved jobs (Forest to Jungle, Plains to Volcanic; Swamp to Graveyard, Cave to Trench) | wired | the `-b` second-base lines (`movedLines`) carry Bramble, Sapbark, Shared Plating, Herd, Poison Shift, Bloodtithe, You Tank, Deep Reserve. The Swift Staff / Swarm Staff copies on Jungle/Volcanic already had effects |
| Still `{}` (T4 jobs, out of scope) | missing | Cleave, Exploit weapons; Grave Pact, Requiem, Pressure Seal, Tidewater lines |

## Done
- shared: `conduit/specialization.ts` (ids and every specialization number, PLACEHOLDER), T3 piece `params` in the kit, `disciplineCommandCost`/`rosterCommand` take the specialization (Colossus), six passive keys and labels (Conduit block), the T3/T4 gear effects and moved lines. `conduitKit.test.ts` accepts finite params on the T3 pieces.
- server (`archetypes/summoner/`): `summonPiecesT3.ts` (listeners, supports, specializations, gear lines, tick), `t3Shared.ts` (status ids, `specializationOf`, fight clock), `souls.ts` (multi-Soul, Tundra and Volcanic Souls), `profile.ts` (Legion, Colossus, extra Soul bodies), small edits to `summonPiecesT2.ts` (exports, echo hook, coat split out, Colossus skips Elite's splash, bark skips a hibernating summon), `minionHitsT2.ts`, `damageSponge.ts`, `summonerPrototype.ts` (registration and tick).
- `server/test/conduitT3.test.ts`: a wiring test for every row above that is marked wired or stand-in.

## Checks
- pnpm typecheck: clean
- `conduitT3: ok`
- pnpm test -- conduit formation summon minion classKits classGear classScreen kit mechanicLabels passives statusRegistry: 34/35 passed. The one failure is `server/test/statusRegistry.test.ts` and it is expected: the five status ids T3 adds have no client entries yet (below). Before this branch it listed no `conduit-*` ids. The other 34 include conduitT2, conduitFormation, conduitKit, classGear, mechanicLabels, formationView, harness and the bot conduit routes.

## Not done, or unsure (conductor's call)
- **New statuses need their client entries (T3-W2):** `conduit-horn`, `conduit-burn-bright`, `conduit-spore`, `conduit-hibernate`, `conduit-hunt` (all server-side combat statuses; `statusRegistry.test.ts` fails on them until the target help/badge/icon exist, and for horn, burn-bright and hibernate the player/summon tile too). I did not touch `server/scripts/statusAudit.ts` or the client.
- **Colossus +1 Command and Two Souls' second slot and cost need the config context.** `ClassConfigContext` (`configTypes.ts`), `classConfigContextFromState`/`ClassStateInput` (`config.ts`) and the server's `classConfig.ts` need a `specializationId` (Colossus: pass it to `rosterCommand`; Two Souls: `relicSlots = 2` and a Command cost for the second Soul), and the Formation view needs the same. The pure functions are ready; until then the roster is checked at Elite's price and Two Souls fields the second Soul without a config slot.
- **Estimated damage on summons** (Shield Wall, Sporecaller on summons, Carapace Guard, Hibernate): `runMonsterAttackOnMinion` bypasses the pipeline (same gap as T2's Barkward and Sandveil). A pre-damage hook for hits on summons would make all of them exact.
- **Infestation's burst into short-lived summons** is not built (no temporary summon entity, and the on-kill spawn is flagged for review in §7.15 item 8); it bursts as area damage.
- **Burn Bright "waves" and "burn out"**, **Colossus "grow huge"**, **Burrower's tunnelling**, **Prowler's "fleeing"**, **Carapace Guard's direction**: stand-ins as described above; no art or movement work.
- Every number is a placeholder; the bible gives none for T3 except Colossus's +100% HP / +50% damage. The Hunt: the first kind adds nothing (the bonus starts at the second kind). Legion steps, Choir echo share, Shield Wall layer relief, Ascendant slope, Two Souls buff, Soul chill and heat are all in `specialization.ts` / `souls.ts`.
- T4 gear jobs (Cleave, Exploit, Grave Pact, Requiem, Pressure Seal, Tidewater) and the T4 summons and leaves stay empty, as scoped.

## Files outside the brief I needed (not edited)
- `shared/src/classKits/configTypes.ts`, `shared/src/classKits/config.ts`, `server/src/systems/player/progression/classConfig.ts` (and `formationView.ts` input): a `specializationId` in the class context, for Colossus's Command and Two Souls' slot.
- `server/scripts/statusAudit.ts` and the client status entries: for the five new status ids (T3-W2).
- `server/src/systems/combat/engine/combat.ts` (`runMonsterAttackOnMinion`): for exact absorb/refund numbers on summons.
