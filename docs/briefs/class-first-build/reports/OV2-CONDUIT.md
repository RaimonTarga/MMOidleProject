# OV2-CONDUIT report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov2-conduit   **Last commit:** see `git log -1` (this report is the last commit)

Lanes 5 (port 4315, `gamedb_ov5`, Swarm) and 6 (port 4316, `gamedb_ov6`, Elite). Two new chains, the
Conduit's other two disciplines, beside the verified Pack chain (`conduit-t4`: Pack, The Hunt, Avenge):

| Chain | Routes | Discipline, specialization, leaf (PLACEHOLDER picks) |
|---|---|---|
| Swarm | `conduit-t2-swarm`, `conduit-t3-swarm`, `conduit-t4-swarm` | Swarm, **Legion** (the default masses one summon to its thresholds), **Devour** (a summon that has lived a while steals HP back) |
| Elite | `conduit-t2-elite`, `conduit-t3-elite`, `conduit-t4-elite` | Elite, **Ascendant** (stronger the longer the fight), **Last Stand** (an elite that would die holds a few seconds) |

Both replay the T1 route and wear Pack's gear tables (the T1-T4 gear is the class's, not the
discipline's; the sim gave no reason to change it). Elite's specialization was picked by the sim:
Colossus lost the T3 Swamp boss (2 of 2, boss at 3%) and Two Souls the T3 Mountain (1 of 2);
Ascendant won every T3/T4 boss.

## Per chain, per tier

Live, final code (fresh characters `ov5-conduit-swarm-b` on lane 5 and `ov6-conduit-elite-b` on lane 6,
`conduit-t4-<discipline>`, 100x rewards, no upgrades; both resumed once with `--fresh=false` at minute 10,
after the Plains seal, to load the dev-log counters). Boss kills / attempts, deaths anywhere, minutes:

| Chain | T1 | T2 | T3 | T4 | Deaths | Minutes | Bar |
|---|---|---|---|---|---|---|---|
| Swarm (Legion, Devour) | 2/2 (60 s, 18 s), 16 min | 7/7 (14-40 s), 22 min | 7/7 (9-20 s), 23 min | 7/7 (24-54 s; **Caldera 42 s**), 25 min | 0 | 85 | **pass** |
| Elite (Ascendant, Last Stand) | 2/2 (60 s, 16 s), 16 min | 7/7 (18-42 s), 25 min | 7/7 (15-50 s), 26 min | 7/7 (26-58 s; **Caldera 46 s**), 26 min | 1 (T2: walking through the T2 Desert to the Swamp boss, three Desert mobs) | 93 | **pass** |

Every boss on the first try, no stalls, no `dungeon-guard` give-ups (23 guard phases cleared per run).
Before the final code (the two fixes below), the same chains resumed from T1 on the new defaults
cleared T2 at 7/8 each (Swarm lost the T2 Cave once, Elite the T2 Forest once, boss at 2%).

**Pack regression check, live** (the verified chain, `conduit-t4`, fresh character `ov5-conduit-pack`,
final code, lane 5, 40 min before the timebox): T1 2/2 (62 s, 17 s), T2 7/7 (11-37 s), T3 Mountain 1/1
(11 s), 0 deaths; it ended at minute 41 on a socket ping timeout while the lane's server logged
"analytics / world log flush failed" (the shared log DB), as I was stopping it for the timebox. The
rest of its chain is sim-only (above).

Sim = `server/bench/classBossSim.ts` on the final code (guard stripped, full HP, the route's gear and
clears at each boss, 2-3 runs per boss; driver in the report's "How I checked"): every T2-T4 boss
won in every run by all three chains. Fight lengths, final code:

| Tier | Pack (re-sim of the verified chain) | Swarm | Elite |
|---|---|---|---|
| T1 (shared) | Plains seal 61 s, you at 48-52%; Mountain seal 21 s, 77% | same | same |
| T2 | 14-34 s, 96-100% HP | 13-35 s, 76-100% | 14-41 s, 100% |
| T3 | 8-13 s, 96-100% | 9-20 s, 98-100% | 15-49 s, 91-100% |
| T4 | 24-50 s, 85-100%; **Caldera 34-43 s** | 18-49 s, 89-100%; **Caldera 31 s** | 24-64 s, 98-100%; **Caldera 42-50 s** |

Before the two fixes below, at the Caldera Sovereign (T4 Volcanic): Pack 1 of 2 in the sim (the
overnight live Pack won it on the 4th try), Swarm 0 of 2 (boss at 15%), Elite 0 of 2 (13-16%).

## What was wrong, and what changed

### 1. Swarm and Elite had no auto default (§7.13)
Both fell back to the T1-style roster (the first tank, two damage, a support, a heavy, Thralls), so
Swarm left Command unspent and Elite fielded the T1 specialists forever. Now, in
`shared/src/classKits/configs/conduit.ts` (PLACEHOLDER orders):

- **Swarm** ("fill Command with half-cost summons, tank first"): the newest tank, then under Legion
  eight copies of the newest damage summon (Legion's top threshold), then one of each other half-cost
  summon (damage and supports alternating, newest first), Thralls fill the rest. Heavies are not
  half-cost; when the body cap binds with Command left over, a body (a Thrall first, else the last,
  never the tank) is traded for each heavy, newest first.
- **Swarm's own body cap, 16** (`CONDUIT_SWARM_BODY_CAP`; the shared cap stays 10): at 10 a Swarm fielded
  no more bodies than a T3 Pack and left half its Command unused. Inside the 20-body bandwidth budget.
- **Elite** ("a tank and two damage elites"): the newest tank and the two newest damage summons, then
  supports and the other damage summons alternating, newest first, then the heavies.
- Pack's default is unchanged (same order, the shared helper only moved).

What they field at each tier's bosses (Heavy Staff, -1 Command):

| | T2 (Command 8) | T3 (11) | T4 (14) |
|---|---|---|---|
| Swarm | 16 bodies: Ironhorn, one of each of 8 specialists, 7 Thralls | 16: Carapace Guard, 8 Cinderlings, 5 specialists, Bonecrusher, Warhorn | 16: Abyssal Warden, 8 Dartcallers, 4 specialists, Warhorn, Avalanche, Obsidian Tortoise |
| Elite | 4: Ironhorn, Executioner, Bog Leech, Bloomtender | 5: Carapace Guard, Cinderling, Prowler, Frostcaller, Burrower | 7: Abyssal Warden, Dartcaller, Cinderling, Gravecaller, Prowler, Mirage, Burrower |

### 2. Summons stepped out of every vent (mechanic, for review)
With Avoid Hazards a default order (65a180a5), every summon now ran the owner's Step Back: out of every
telegraph, and never into one. In the Caldera's last quarter (vents every 650 ms around the boss,
while the Cataclysm charges) the formation stood off the boss: probe timeline, Elite, boss HP 8228
at the 25% mark, 6280 sixty seconds later, then the Cataclysm killed the Conduit. Sim with and
without Step Back at the Caldera: Pack 270-320 dps vs 820-940; Swarm 250-520 vs 970-1010; Elite
200-230 vs 585, for about the same summon deaths. Summons now ignore the arena's scattered hazards
(`fault-line-telegraph` with `scattered`: vent eruptions, rockfall) and keep dodging aimed blows
(slams, charge corridors, aimed fault lines). The Conduit itself still steps out of everything.
(`server/src/systems/classes/archetypes/summoner/ai.ts`, `insideAimedTelegraph`; test:
`summonerRuneBehaviors.test.ts`, a vent case beside the slam case.) Bible §7.14 already lists "the Step
Back and Taunt runes driving summons" for removal; this keeps only the useful half.

### 3. A summon's hit ignored its body's damage multiplier (bug fix, for review)
`runFormationAttack` weighted a hit by the formation's offense and the slot's Command share only.
The slot's `damageMult` reached the minion's displayed attack (`spawn.ts`, `summonerPrototype.ts`) but
never a hit, so these did nothing to damage: every piece's own `damageMult` (Plains Warden 0.7, Forest
bruiser 0.9, Swamp spitter 0.6, Mountain marksman 0.8, Cave heavy 0.9), the weapons' `conduit.damage-pct`
(Heavy Staff +30%, Swarm Staff -25%, You Tank +20%), Elite's +25%, Colossus's +50%, Legion's +25%/+60%,
Longshot's ranged/melee split and the Soul's 1.2 x rank. Found because Elite's damage step changed
nothing in the sim (1.25 and 1.5 gave the same 27 s Forest fight). Fixed in
`server/src/systems/classes/archetypes/summoner/formationAttack.ts`. Effect, sim: the T1 Plains seal
41 s -> 61 s (the Swarm Staff's -25% is now real; still won, the Conduit at 50%, and the Swarm Staff
still beats the Plain Staff there: Plain Staff 0 of 2, boss at 40%); T2-T4 mostly shorter for all
three chains (Heavy Staff +30% now real), Elite's thin T3 Swamp from 34-39% HP left to 91%.

### 4. Routes
`conduitT2Route(discipline)`, `conduitT3Route(spec, discipline)`, `conduitT4Route(leaf, spec, discipline)`
(Pack stays the default, its ids unchanged); `conduitRouteId(tier, discipline)` names the others
`conduit-t<N>-<discipline>`; `CONDUIT_OTHER_CHAINS` and `conduitOtherChainRoutes()` in `conduitT4.ts`; three
lines in `bot/src/routes/index.ts`.

## Every number changed

| File | Number | Old | New | Why / evidence |
|---|---|---|---|---|
| `shared/src/classKits/configs/conduit.ts` | `CONDUIT_SWARM_BODY_CAP` (new; Swarm's body cap) | 10 (the shared cap) | 16 | A T3 Swarm fielded no more bodies than Pack and left half its Command unused; Swarm 21/21 T2-T4 in the sim at 16 |

No other number moved. The two fixes above change balance broadly without a number (listed for review).

## Rules or mechanics changed (for review)
- Swarm and Elite auto defaults (1), Swarm's own body cap.
- Summons dodge aimed telegraphs, not scattered arena hazards (2).
- A summon's hit carries its body's damage multiplier (3).

## How I checked that the class system fires
- The dev-only "conduit mechanics" log line (once a minute per Conduit) now also counts `rebuild-free`
  (Swarm's free rebuilds), `devour` and `last-stand`. Summed from each lane's `server.log` over the
  final runs: Swarm (lane 5) 34 free rebuilds against 7 paid ones (the heavies), 11,119 Devour heals,
  104 taunts that took a boss, 598 acid, 180 power shots, 42 summon deaths; Elite (lane 6) 0 free
  rebuilds, 9 paid, 2 Last Stand saves, 131 boss taunts, 125 acid, 150 power shots, 9 summon deaths.
- In-process (`server/test/_conduitBossProbe.ts`, which now flushes the counts at each fight's end):
  T4 Tundra, Swarm: 274 Devour heals, 10 boss taunts; T2 Cave, Swarm: acid 18, power shots 6, boss taunts 4.
  The probe's roster line shows each default (Legion's eight copies, Elite's tank and two damage elites).
- `server/test/_ov2ConduitRoster.ts` (throwaway) prints each discipline's auto roster per tier.

## Checks
- pnpm typecheck: clean (after the last code commit).
- pnpm test -- conduit summon formation minion dpsEstimate secondaryDamage abilityConduit mechanicFired: 27/27
  passed (includes the new `shared/src/classKits/configs/conduitDefaults.test.ts` and `summonerRuneBehaviors`); route tests
  conduitT1..T4 pass.

## Not done, or unsure
- **The Soul**: §7.13 wants "the one the discipline leans to"; the auto relic is still the newest trophy
  (`shared/src/classKits/config.ts`, not my file).
- **Swarm's half-cost summons fight at full strength** (a body's share follows its base Command, §7.15 Q1).
- The shared `summonerProfile.ts` and the client still read the old Command pie (OV-CONDUIT's note).
- Each chain's gear is Pack's: no Swarm- or Elite-specific weapon picks (the sim gave no reason).
- Pack's T3 is now very short (8-13 s) after the damage fix; nothing in the bar asks for slower, but it
  may read as too strong.

## Bugs found outside my files
None blocking. The lane 5 server logged "analytics / world log flush failed" (the log DB) at 22:02-22:05 and the Pack bot dropped on a ping timeout. (`server/bench/classBossSim.ts` prints no Conduit effects: summon hits emit no
`player-hit` effect names, so its "hit effects" line stays empty for the Conduit.)

## Questions for the designer
1. **Summons and arena hazards**: summons now hold their ground under vents and rockfall (they still
   dodge slams). Keep, or should summons ignore every telegraph (§7.14 drops the Step Back rune driving
   summons) or dodge everything as before?
2. **The damage-multiplier fix** makes every piece's and weapon's damage number real. The T1 pieces'
   multipliers below 1 (Warden 0.7, spitter 0.6...) and the Swarm Staff's -25% now cost damage: the T1
   Plains seal takes 61 s. Keep the numbers, or lift the T1 ones?
3. **Swarm's body cap** 16 (others 10): fine, or should every discipline share one cap?
4. **Elite's specialization for the bot**: Ascendant (Colossus and Two Souls lost a T3 boss in the sim).
5. **Swarm's half-cost summons at full strength** (today) or half (§7.15 Q1)?
