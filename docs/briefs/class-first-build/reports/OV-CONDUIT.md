# OV-CONDUIT report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov-conduit   **Last commit:** see `git log -1` (this report is the last commit)

Lane 3 (port 4313, `gamedb_ov3`), account `ov3-conduit`, routes `conduit-t1..t4`, discipline chain
Pack → The Hunt → Avenge (the routes' defaults: Pack is the variety discipline the T2+ lessons feed).

## Per tier

Live = lane 3 at 100x rewards (the routes buy no upgrades). Sim = `server/test/_conduitBossProbe.ts`
(the class boss sim's build path, the guard stripped, from full HP, with a per-second formation
timeline; the routes' gear and default Formation at each boss).

| Tier | Route | Live: boss kills / attempts, deaths, minutes | Sim (final numbers) | Pass? |
|---|---|---|---|---|
| T1 | `conduit-t1` | Before tuning: Plains 0/5 (boss left 59/47/52/55/46%, 30-37 s), 5 deaths. After the T1 numbers: Plains 1/1 (47 s), Mountain 1/1 (27 s), 0 deaths, 9 min (resumed character). Final code, fresh character: Plains 1/1 (41 s), LIVE_FINAL | Plains 2/2 (41-43 s, 54-61% HP left); Mountain 2/2 | **Pass** |
| T2 | `conduit-t2` | 7/7 in 7 attempts (17-34 s each), 0 deaths, 37 min including the ~7 min T1 replay (resumed, cap 8) | 7/7 (14-29 s, 43-100% HP) | **Pass** |
| T3 | `conduit-t3` | LIVE_T3 | 7/7 (10-21 s, 80-100% HP) | Sim pass, live LIVE_T3_PASS |
| T4 | `conduit-t4` | LIVE_T4 | 7/7 with the Volcanic vest (Caldera 4/4 at 33-34 s, 9-41% HP; 2/4 in the Mountain vest); the rest 23-44 s, 93-100% HP | Sim pass, live LIVE_T4_PASS |

Slow but not failing: the Mountain T2 guard phase took 320 s live (4 guards, outcome "reformed").
Each `-t2/-t3/-t4` resume replays the earlier tiers' travel (~7 min per tier replayed).

## What was wrong, and what changed

### 1. Routes walked into the Plains naked (fix, bot)
The T1 route crafted nothing: the bot reached the Plains with no weapon, armor, charm or boots.
`conduitT1.ts` now crafts the Conduit's starter staff and the Clearing set, then each zone's pieces
as the zone level unlocks them (weapon at the zone's first level, armor +1, charm +2, boots +3),
through `wearAsUnlocked` (farm to the recipe level, craft, equip; an `ifPossible` skipped once the
character is past the tier, so a later route replaying T1 keeps its gear). T2-T4 routes got the same
(`CONDUIT_T{2,3,4}_GEAR`), each tier's first boss met in that tier's Conduit weapon plus that tier's
armor, charm and boots. No upgrades. PLACEHOLDER picks (formation damage = weapon attack x attacks
per second x the weapon's own multiplier):

| Tier | Zone: pieces worn |
|---|---|
| T1 | Clearing: Plain Staff, vest, charm, boots. Plains: Swarm Staff, vest, charm, boots. Forest: Swift Staff, vest, charm, boots. Swamp: vest. Cave: Heavy Staff. Mountain: vest |
| T2 | Plains: Swarm Staff, vest, charm, boots. Forest: Swift Staff, vest, charm, boots. Swamp: vest. Cave: Heavy Staff. Mountain: vest. Jungle: vest, boots. Desert: boots |
| T3 | Mountain: Ability Staff, vest, charm, boots. Cave: Heavy Staff, charm. Swamp, Jungle, Desert: boots (each faster); Jungle: charm |
| T4 | Mountain: Ability Staff, vest, charm, boots. Tundra: charm. Jungle: Swift Staff. Desert: boots. Trench: Heavy Staff, vest |

Skipped on purpose: the Cave vests (You Tank cuts summon HP 30%), the Poison staves (less formation
damage than Swift/Heavy), charms and boots worse than the one worn.

T2-T4 gear is gated on tier + 2, not + 1: three T2 seals (four T3, five T4) promote before a tier's
last bosses (`SEALS_REQUIRED_BY_TIER`), so a +1 gate skipped the rest of the tier's pieces.

### 2. Bot: the classConfig step stalled on a resumed Conduit (fix, bot, own commit)
`doClassConfig` resolved `auto` without the weapon's Command (`conduit.command`), the server with it
(`classConfigContextOf`). Resumed in the Swarm Staff (+2), the server stored Warden + 5 Thralls, the
bot waited for Warden + 3 and stalled ("timed out waiting for the server's class config matches the
route's"). The step now reads the equipped weapon's bonus the same way. `bot/src/route/executor.ts`
(not my file; small, isolated, blocking: commit `fix(bot): the classConfig step counts the Conduit's
weapon Command`).

### 3. Tanks did not hold a boss
Sim at the Plains boss: the Warden's taunt held the boss 3 s of every 6 and the Warden had 38 HP, so
the boss spent half the fight on the Conduit (13 dps on 190 HP). Every tank's taunt now outlasts its
cooldown (4000 / 5000 ms), and the tanks have bulk.

### 4. Command bought no power (mechanic, for review)
`resolveSummonerProfile` split ONE pie (the Conduit's HP x0.8 and attack x formationOffenseMult) by
Command over the whole roster. Every Command step (§7.2) only cut the formation into more, smaller
bodies: no power, more plating lost per small hit (summon hits pay half the target's plating), and
in the sim a T2 boss slam wiped eight 22-73 HP bodies at once (T2: 2/7 wins). The server's profile
(`summonerProfileFor`, `archetypes/summoner/profile.ts`) now sets each body's offense and defense
weight to its Command over `reference * (total / reference) ^ exponent`, reference 4 (the starting
Command: a fresh Conduit is unchanged), exponent 0.5 (power grows with the square root of the
roster's Command). Proc weights (techniques) stay a share of the whole. Exponent 0 (power ∝
Command) measured T2 at 11-17 s with 100% HP: too strong. The shared `summonerProfile.ts` and the
client/bench copies still read the old pie (they show no summon HP).

### 5. Pack's default ignored the discipline
§7.13: "Pack: one of each type". The default roster stayed on the T1 specialists forever (the first
tank, the first two damage pieces, the first support, the first heavy, in kit order). Under Pack it
now fields the newest tank, the newest heavy (Pack prices its first copy 1 less), then damage and
supports alternating, newest first; Thralls fill the rest (PLACEHOLDER order). Swarm and Elite keep
the T1-style default (their own §7.13 defaults are not built).

## Every number changed
All PLACEHOLDERS. Evidence is the class boss sim unless marked live.

| File | Number | Old | New | Why / evidence |
|---|---|---|---|---|
| `shared/src/classKits/conduit/kit.ts` | Plains Warden `hpMult` | 1.5 | 3 | One-shot by the Plains boss (38 HP); the boss then sat on the Conduit |
| same | Plains Warden `platingMult` (new param) | — | 3 | "A tank with plating" (§7.4): 19 dmg per Plains-boss hit -> ~7 |
| same | Every tank's `tauntEveryMs` / `tauntMs` (Warden, Cave Brute, Ironhorn, Carapace Guard, Obsidian Tortoise, Abyssal Warden) | 6000 (Brute 8000) / 3000 | 4000 / 5000 | The taunt held a boss 3 s of every 6; now continuous while the tank lives |
| same | Ironhorn, Carapace Guard, Abyssal Warden `hpMult` | 1 | 3 | Pack fields the newest tank; it must hold a boss like the Warden |
| same | Obsidian Tortoise `hpMult` | 1 | 2 | Same, a 2-Command body |
| `shared/src/data/summoner.ts` (the Conduit runtime's tuning; outside my listed paths, nobody else reads it) | `SUMMONER_CORE_TUNING.formationOffenseMult` | 1.2 | 1.4 | At 1.2 + the tank fixes the Plains boss still died at ~20% left, 56-58 s; 1.4: 4/4 wins, 53-60% HP |
| `server/src/systems/classes/archetypes/summoner/profile.ts` | `CONDUIT_COMMAND_SCALING` (new) | the pie (exponent 1) | reference 4, exponent 0.5 | T2 2/7 -> 7/7; exponent 0 made T2 11-17 s at 100% HP (too strong) |
| `shared/src/classKits/configs/conduit.ts` | `CONDUIT_ROSTER_BODY_CAP` | 8 | 10 | Command 9-15 from mid-T3 could not be spent; Caldera (T4) at cap 8 died at boss 23%, cap 10 won 33 s / 31% HP, cap 12 won in 14 s (too strong) |
| `bot/src/routes/conduitT{1..4}.ts` | gear per zone (`CONDUIT_T{1..4}_GEAR`) | none | see the table above | The routes fought every boss in Clearing or T1 gear (or none) |

## Rules or mechanics changed (for review)
- Command scaling (above, 4): a body's share grows with the roster's Command instead of shrinking.
- Tank taunt uptime: every tank's taunt now lasts longer than its cooldown, so a live tank holds a
  boss continuously (§7.10: "On bosses, the tank's taunt is the Conduit's defense").
- New piece param `platingMult` (the Plains Warden, "a tank with plating", §7.4), read by
  `computeMinionMitigation` per body.
- Pack's default roster (above, 5).

## How I checked that the class system fires
A dev-only log line (`archetypes/summoner/mechanicLog.ts`, off in production) counts each Conduit's
taunts (and taunts that take a boss), acid, power shots, Pack Strikes, rebuilds and summon deaths and
logs them once a minute ("conduit mechanics"). Live counts so far (lane 3 server log, summed by `mechanicLog` lines): MECH_LIVE.
The probe confirms the same in-process: the boss shows `summon(T)` (held by a taunt) for most of
every fight, Pack Strikes and Elite/T2+ pieces fire, rebuilds pay HP. The sim also showed the bug
below (taunts dropped by a clock mismatch) before the conductor fixed the sim.

## Checks
- pnpm typecheck: clean (last run after merging rework/class-first d39b8d8a).
- pnpm test -- conduit summon formation minion dpsEstimate secondaryDamage abilityConduit mechanicFired harness.test executor.test: **28/28 passed**.
- Route tests: conduitT1..T4 pass (gear steps, gating, each tier's first boss in that tier's weapon).

## Not done, or unsure
- **Volcanic T4 (Caldera Sovereign) is the thinnest fight**: in its last 25% the vents (ground
  hazards, player-only, §13) kill the Conduit in ~3 s if it stands in them; the route's Fireproof
  vest makes the sim 4/4, but a live attempt that starts hurt may still lose some tries. The server's
  "avoid hazards" movement for a Conduit (who never attacks) is the real lever (not my file).
- Swarm's and Elite's §7.13 defaults are not built (only Pack's); the routes play Pack.
- Gaps from the brief left as they were (they do not matter to the bar on the Pack chain): Pack
  Strike's early order (no new order field), Colossus "grow huge" (no size field on `RosterBody`), the
  second Soul's Command cost (no number in the bible), husks are still invisible strikers.
- The shared `summonerProfile.ts` (client, bench, dps estimate) still splits the old pie; only the
  server's `summonerProfileFor` applies the Command scaling. Nothing player-facing shows summon HP or
  damage today, but a bench comparing Conduit numbers reads the old ones.
- The HUD's next-rebuild HP cost is still missing (CD6), unchanged.
- No long clean chain was run by me after the cut-off (the conductor runs it); the fresh-character
  run on the final code reached LIVE_REACHED by 12:00.

## Bugs found outside my files
- `server/bench/classBossSim.ts` started its clock at 0 while aggro code reads `Date.now()`: every
  taunt was dropped in the sim (reported; fixed by the conductor in 1cab8c12 / f7c5ec0b).
- `bot/src/route/executor.ts` classConfig and the weapon's Command (fixed here, above).

## Questions for the designer
1. **Command scaling** (for review): a body's share is now Command / (4 x (total/4)^0.5), so Command
   steps add power with diminishing returns instead of splitting one pie. Keep 0.5, or prefer power
   strictly proportional to Command (0, measured too strong) or the old pie (1, measured too weak)?
2. **Body cap**: 10 (from 8). Command reaches 15 at T4; at 10 bodies some pips still go unused
   at T4. Raise further only with a weaker per-body share (12 made the Caldera a 14 s fight)?
3. **Pack's default** fields the newest of each role first. Is "newest" the right priority, or
   should the default keep the T1 specialists the player learned first?
4. **Weapons under the new scaling**: the Swarm Staff (+2 Command, -25% damage) now adds real power
   through Command; the Heavy Staff (-1 Command, +30% damage and HP) is still the strongest T1/T2
   pick for the route. Worth a look at the weapon numbers once the scaling is settled.
5. The Plains Warden's `platingMult` 3 makes it very strong against small hits (by design for the
   swarm biome); should later tanks get their own durability shape (the Tortoise's shell, Ironhorn's
   brace) instead of the flat `hpMult` 3 I gave them?
