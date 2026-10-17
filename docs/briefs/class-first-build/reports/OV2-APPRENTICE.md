# OV2-APPRENTICE report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov2-apprentice   **Last commit:** see `git log -1` (this report is committed with it)

Lanes 5 (Poison, port 4315, `gamedb_ov5`) and 6 (Frost, port 4316, `gamedb_ov6`), class `dot`,
`--rewardMultiplier=100`, the auto config throughout. The Fire chain (`apprentice-t4`: Fire, Afterburn,
Tinderbox) keeps its routes and its resolved auto default (checked: identical placements at T1 and under
Fire before and after this branch), and its class boss sim still wins every T2-T4 boss.

## The two chains

| Chain | Routes | T2 school | T3 specialization | T4 leaf | Gear |
|---|---|---|---|---|---|
| Poison | `apprentice-t2-poison`, `-t3-poison`, `-t4-poison` | Poison | Wasting | Taint | the Frost set below, except the Plains vest re-worn at the T2 Jungle |
| Frost | `apprentice-t2-frost`, `-t3-frost`, `-t4-frost` | Frost | Ice Tomb | Frozen Step | T2: the Plains and Forest sets on the way, then Runestone Staff, Swamp charm (Bitter Tonic), Jungle vest, Desert boots. T3: Runestone Staff T3 + Mountain set, Swamp charm, Desert boots. T4: Runestone Staff T4 + Mountain set, Desert boots, Volcanic vest, Bitter Tonic on the Wasteland's second charm base (`graveyard-charm-t4-b`) |

Picks are PLACEHOLDER (§9.13 names no specialization or leaf default): Wasting (the plague as a defense,
where Poison is weakest: a boss alone; Ripening simmed about the same) and Ice Tomb (§9.6's boss
specialization; Creeping Frost simmed stronger still); Taint and Frozen Step won every T4 boss in the
sim (Thick Air lost the Caldera Sovereign as often as Taint did on the Thornwood Rod; Cold Shoulder about
equal). Fire keeps the bare ids (`apprentice-t2`...). The registry adds only the Apprentice's lines.

## Per tier, live

Bar per tier: bosses killed / attempts (the bot's `attemptBoss` count), deaths, minutes on the run clock.

**Poison**, one character (`ov5-apprentice-poison`), fresh at 09:51, resumed after each fix (11 runs; the
same steps replay at once on resume):

| Tier | Bosses (fight) | Attempts | Deaths | Pass? |
|---|---|---|---|---|
| T1 | Plains 26 s, Mountain 14 s | 2 | 0 | **pass** |
| T2 | Plains 19, Forest 32, Mountain 13, Swamp 20, Cave 18 s; Jungle 12 s; Desert 15 s | 7 | 12 at the Jungle dungeon's guard pack before the fixes (five runs), 0 after | **pass on the final gear** (the guard pack in one life, 66 s) |
| T3 | Mountain 29, Cave 15, Swamp 16, Jungle 30, Desert 23, Tundra 31, Volcanic 21 s | 7 | 0 | **pass** |
| T4 | Mountain 69, Tundra 69, Jungle 32, Desert 24, Volcanic 72, Graveyard 17, Trench 27 s | 7 | 0 | **pass** |

The last resumed run (`apprentice-t4-poison-intended-2026-10-17T09-59-58...`, completed) took the chain
from the T2 Jungle boss to the T4 Trench boss in 74.5 minutes with no death, 16/16 bosses on the first try.

**Frost**, one character (`ov6-apprentice-frost`), fresh at 09:51, resumed after each fix (5 runs):

| Tier | Bosses (fight) | Attempts | Deaths | Pass? |
|---|---|---|---|---|
| T1 | Plains 25 s, Mountain 14 s | 2 | 0 | **pass** |
| T2 | Plains 16, Forest 16, Mountain 7, Swamp 17, Cave 9 s; Jungle 16 s; Desert 9 s | 7 | 3 at the Jungle guard pack (T1 Spread rule on), then 2 more and cleared | **pass** (thin at the Jungle) |
| T3 | Mountain 14, Cave 10, Swamp 9, Jungle 12, Desert 8, Tundra 12, Volcanic 16 s | 7 | 0 | **pass** |
| T4 | Mountain 32, Tundra 41, Jungle 31, Desert 22, Volcanic 26, Graveyard 10, Trench 19 s | 7 | 0 | **pass** |

The last run (`apprentice-t4-frost-intended-2026-10-17T09-06-33...`, completed) went from the T2 Desert
boss to the T4 Trench boss in 65 minutes, 15/15 bosses on the first try, no death.

**Clean runs** (lane reset, fresh character, final code): CLEAN_PLACEHOLDER

## Done

### Routes (`bot/src/routes/apprenticeT2..T4.ts`, `index.ts`)
- `apprenticeT2Route(discipline)`, `apprenticeT3Route(discipline)`, `apprenticeT4Route(discipline)` and
  `apprenticeRouteId(tier, discipline)` (Fire bare, `-poison`, `-frost`); each school's specialization
  and leaf (`APPRENTICE_T3_SPECIALIZATIONS`, `APPRENTICE_T4_LEAVES`) and gear (`APPRENTICE_T2..T4_FROST_GEAR`,
  `APPRENTICE_T2..T4_POISON_GEAR`). The Fire route's steps are unchanged.
- `apprenticeT4.test.ts`: both chains registered and uncontrolled, each tier replays the one before, the
  picks open under the school, every worn piece is a recipe.

### The auto default (`shared/src/classKits/configs/apprentice.ts`)
Fire and T1 resolve exactly as before. For the other two schools (each PLACEHOLDER, a reading of §9.13,
whose defaults "the bots tune"):
- **Poison: Wither on your low HP** (after Siphon), not the target's: on the target's low moment it spent
  the bar every 6 s through a boss's last third, Detonate stopped, and the T4 Caldera Sovereign's race was
  lost 3 times in 4 (sim). After: 4/4 (33-69% HP left); the T2 Timberclaw 21% → 33% HP left.
- **Poison: with two or more enemies near, the full bar is left to the plague** (alone it detonates). Only a
  full carrier passes sigils (`sigilsT2.ts`, the plague loop), so a Detonate the moment the bar filled kept
  the walking plague from ever walking: Poison had no pack damage. In the guard pack afterwards: ticks
  3 905 and blasts 4 594 a minute, `spore-burst=2` (lane 5 telemetry).
- **Frost: the T1 Spread rule goes**, as under Fire: while it held the full bar among two or more
  enemies, Frost never detonated in a pack (three deaths in seven minutes at the T2 Jungle, live).
- **Frost: Cold Snap on its own moment, "three or more near"** (the bible's literal default) instead of a
  full bar among three: it fired 0 times a minute in the guard pack; now 1-3 a minute (lane 6 telemetry).
- **Poison and Frost: Siphon also at half HP with an enemy in melee** (`touched` + `hp-low` 0.5; the rule at
  a quarter stays): at a quarter it came too late for three guards taking a full bar in 7 s.

### Mechanic fix (for review)
- **Cold Snap's chill slows attacks too** (`dot/sigilsT2.ts`, the Numb pattern; text updated): Cold Snap is
  Frost's "pack answer" (§9.5), and a movement-only chill does nothing against a pack already in melee with
  a class that stands and fights. Test line in `server/test/apprenticeT2.test.ts`. With it the clean Frost
  character cleared the T2 Jungle guard pack after one death, where it had died four times before.

### The T2 Jungle dungeon (the nine-guard pack): what it took
The trap of the round, as for the overnight Striker. After a death the bot respawns at the sanctuary and
walks back through five nodes, longer than the 90 s the guard takes to reform, so **the pack must fall in
one life** (three guards at a time, 7-13 s from full HP to dead when they win). Fire does it. Tried, in
order: the Swamp charm for the Forest charm, the Plains vest for the Jungle vest, the Bog Censer for the
Thornwood Rod, the config rules above: Poison still died 12 times in five runs. What cleared it was **three
sigils a hit**: on the Runestone Staff, Poison cleared the pack in 66 s with no death (boss 12 s). The sim
never meets guards (it strips them); a throwaway guard-keeping copy of it (deleted) killed every school,
Fire included, so it is no model of the live pull.

## Every number changed

| File | What | Old | New | Why / evidence |
|---|---|---|---|---|
| `shared/.../apprentice/kit.ts` | Cold Snap `ms` (its chill) | 2500 | 4000 | With the chill now slowing attacks, it covers most of its 6 s cooldown; the clean Frost character then cleared the T2 Jungle pack (1 death, after 4) |

Everything else is placements (above) and route gear picks; no kit, class-gear or runtime number moved.

## Class boss sim (final code, route gear, auto config, the trophies of the earlier bosses; one run each)
HP left at each win, in the route's boss order:
- Poison T2 (Runestone Staff, Plains vest, Swamp charm, Desert boots): 7/7, 51-95% (Jungle 51%).
- Poison T3 (Runestone Staff T3, Mountain vest, Swamp charm, Desert boots): 7/7, 78-100%.
- Poison T4 (Runestone Staff T4, Volcanic vest, Bitter Tonic, Desert boots): 7/7, 74-100%.
- Frost T2 (Runestone Staff, Jungle vest, Swamp charm, Desert boots): 7/7, 63-100%.
- Frost T3: 7/7, 90-100%. Frost T4: 7/7, 58-100% (Charnel-Crown 58%).
- Fire (the overnight gear, unchanged): T2 7/7 38-73%, T3 7/7 61-97%, T4 7/7 73-100%.
- Before the fixes, for the record: Poison on the Thornwood Rod lost the T4 Caldera Sovereign 3 times in 4
  and the T3 Magma-Salamander 1 in 4; the Forest charm left 17-70% (Poison) and 40-91% (Frost) at T2.

## Telemetry: the schools fire
The overnight dev log `apprentice payoffs` (once a minute per Apprentice, server log; `APPRENTICE_PAYOFF_LOG_MS`):
- Frost, live T2 Jungle dungeon after the fix: `cold-snap=3 siphon=4 detonate=2 spore-burst=1`, blast 4 624 a
  minute; T2 Swamp dungeon: `seize=3 seize-broke-windup=3 shatter=3 detonate=3`, blast 10 332. Sim T4 Titan:
  `seize=1 shatter=1 detonate=1` every 10 s.
- Poison, live T2 Jungle dungeon (the winning minute): `detonate=3 spore-burst=2 wither=2 siphon=2 sear=1`, ticks
  3 905, blasts 4 594; T2 Cave: `detonate=6 seize=3 recoil=3`. Sim T4 Caldera: `detonate=2 wither=1`, blasts
  19 800 against ticks 5 800 per 20 s.
- Count with: `grep -A16 "apprentice payoffs" ../lanes/lane<n>/server.log`.

## Checks
CHECKS_PLACEHOLDER

## Not done, or unsure
- **Poison plays on the Runestone Staff** (three sigils a hit), which the bible lists under Fire and Frost; its
  own weapons (Thornwood Rod, Bog Censer, Branching Wand) lay one a hit and could not clear the T2 Jungle
  pack. On the staff Poison is Detonate-heavy (blasts ~75% of its boss damage in the sim) rather than §9.5's
  ~60% ticks.
- **The T2 Jungle stays the thin spot for Frost**: the final-code clean character still died once there.
- The Poison chain's live evidence is one character resumed through every fix; the clean runs above are the
  final code's own evidence (how far they got).
- The plague passes only from a full carrier; the hold in packs is my reading. Passing on a Detonate too would
  be the other.
- Frost's per-sigil slow and the Shatter's chill still slow movement only (left as they are).

## Questions for the designer
1. Poison got through the T2 Jungle guard pack only on the Runestone Staff. Should Poison's own weapons fill its
   larger bar faster, or is the staff fine for Poison?
2. With "full → Detonate" the walking plague (a full target passes a sigil each second) barely walks. Keep the
   full bar for the plague in packs (as now), or let a Detonate pass sigils too?
3. Cold Snap's chill now slows attacks (my fix). Should the Shatter's chill and the frost sigils' slow do the same?
4. The T2 Jungle guard reforms 90 s after the last kill, and the walk back from the sanctuary is longer: any death
   there restarts the nine-guard pack. Intended?

## Files outside the brief I needed (not edited)
- None.
