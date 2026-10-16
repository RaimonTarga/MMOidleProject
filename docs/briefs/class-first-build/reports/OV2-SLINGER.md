# OV2-SLINGER report
**Agent:** Claude Opus 5.5 (OV2-SLINGER)   **Branch:** rw/ov2-slinger   **Last commit:** see `git log -1` (this report is the commit on top)

Lanes 1 (Siege, port 4311, `gamedb_ov1`) and 2 (Trickshot, port 4312, `gamedb_ov2`), 100x rewards, auto
config, `--policy=intended`, one fresh character per chain (accounts `ov1-siege`, `ov2-trickshot`),
resumed with `--fresh=false` after each code change. Every number below is a PLACEHOLDER.

## Chains

| Chain | Route | Discipline | Specialization | Leaf | Guns (T2 / T3 / T4) |
|---|---|---|---|---|---|
| Siege | `slinger-t4-siege` (and `-t2-`, `-t3-`) | Siege | Entrenched | Bunker | Drum Gun (Cave detour before the Plains boss; the Jungle vest from the T2 Jungle on) / Drum Gun (Cave detour) / Drum Gun (Trench detour) |
| Trickshot | `slinger-t4-trickshot` (and `-t2-`, `-t3-`) | Trickshot | Deadeye | Cool Reload | Hand Cannon (Mountain detour) / Hand Cannon / Hand Cannon |
| Gunslinger (verified overnight) | `slinger-t4` | Gunslinger | Fan the Hammer | Light Hands | Pepperbox then Carbine / Carbine / Carbine |

Specialization and leaf: bible §10.13 names no default. PLACEHOLDER picks for the bar (tier bosses):
Entrenched and Deadeye are the two the bible leans to bosses (§10.6 notes); Bunker and Cool Reload answer
"caught reloading", the column §10.7 says carries a stationary-reload class's resilience. Sim, Siege at the
seven T3 bosses: Entrenched 14/14 (156-233 damage per second), Rolling Fire 14/14 (144-234), Deathmark 14/14
(131-203, its 0.7 share per mark loses on a lone boss).

## Live (one character per chain, 18:59-22:10, resumed after each fix; stopped at the timebox)

Boss kills / attempts. Deaths anywhere on the route. Minutes are the sum of the runs (each resume replays
the route's travel, ~5-15 minutes a resume, so they overstate the play time). Neither chain finished T4.

**Siege** (`slinger-t4-siege`, lane 1, 6 runs, 185 min, 4 deaths):

| Tier | Boss kills / attempts | Deaths | Pass? |
|---|---|---|---|
| T1 | 2/2 (Plains 56 s, Mountain 26 s) | 0 | pass |
| T2 | 7/8: all first try but the Cave (lost once at 9% boss HP, drum +4; won first try after the +8 drum) | 4: the Cave boss once, the Jungle dungeon's nine guards three times (fixed by the Jungle vest, then first try) | pass after fixes |
| T3 | 7/7, all first try (36-57 s) | 0 | pass |
| T4 | 2/2 so far (Mountain, Tundra, first try); stopped in the Jungle at the timebox | 0 | not finished |

**Trickshot** (`slinger-t4-trickshot`, lane 2, 5 runs, 185 min, 1 death):

| Tier | Boss kills / attempts | Deaths | Pass? |
|---|---|---|---|
| T1 | 2/2 (Plains 64 s, Mountain 24 s) | 0 | pass |
| T2 | 7/7, all first try (25-44 s) | 1: the Jungle dungeon's nine guards (Buckshot's charge rule; fixed, then passed) | pass |
| T3 | 7/8: the Mountain gave up once (the guards, below; Deadeye fix), then all first try (25-56 s) | 0 | pass after the fix |
| T4 | 0/1: the Mountain dungeon's four Stone Wardens, guard phase gave up after 15 min with 3 alive | 0 | **fail (stall)**, open 1 |

**Gunslinger** (the verified chain): not re-run live (no lane free); re-simmed after every shared change, T2 21/21,
T3 14/14, T4 14/14.

## Sim (the route's gear and levels, Keep Distance, the final code)

`server/bench/classBossSim.ts` through an untracked copy (`_slingerSim2.ts`, not committed) that plays the
route's standing orders (Keep Distance in place of the chase), sets the biome levels the route holds at each
boss (`--visited`: this tier's zones so far at the cap, the rest at their last tier's cap; the stock sim puts
every zone at the cap, so it owns lessons and rack slots the route does not have yet) and prints the
Slinger's telemetry tally (`--trace`). Boss kills / fights, in the route's zone order:

| Chain | T2 | T3 | T4 |
|---|---|---|---|
| Siege (drum +8, reload +400) | 20/21 (Jungle 2/3; Forest 45% HP left, Mountain 66%, Cave 33%) | 7/7 | 7/7 |
| Trickshot (Deadeye hold 2 s) | 20/21 (Mountain 1/3 lost to the Juggernaut's charge, as the Gunslinger) | 7/7 | 7/7 |
| Gunslinger (re-sim after the shared changes) | 21/21 (the newest-lessons-only rack had lost Cave and Jungle 0/2 each and Mountain 1/2) | 14/14 | 14/14 |

The sim strips the guards. A `--guards` flag in the copy keeps them but never wakes the boss and spawns the
player inside the pack (all three chains die to the T2 Jungle nine in 8-15 s, which the live Gunslinger and
Trickshot survive), so I used it only for guard kill rates (kills in 300 s at the T3/T4 Mountain's four Stone
Wardens).

## Done

### Routes (`bot/src/routes/slingerT1..T4.ts`, `index.ts`: my lines only)
- `SLINGER_CHAINS` (discipline, specialization, leaf) and `slingerRouteId`; `slingerT2/3/4Route(chain)` set the
  chain's picks as the choice defaults, so `slinger-t4-siege` is `slinger-t4` with the Siege choices passed.
  Gunslinger keeps `slinger-t2..t4`. Registered: `slinger-t2/t3/t4-siege`, `slinger-t2/t3/t4-trickshot`
  (outside the controlled batch). `gunSteps` / `zoneGearSteps` take the route's default discipline.
- **Siege's T2 gun:** the Drum Gun from a Cave detour before the Plains boss (was the Pepperbox, then the
  Drum Gun at the Cave). Sim, T2 Mountain boss: Pepperbox 0/3 (boss 39-60% left), Drum Gun 2/2.
- **Siege wears the Jungle vest from the T2 Jungle** (`SLINGER_T2_DISCIPLINE_PIECES`, a choice step like the guns):
  the live Siege died three times to the T2 Jungle dungeon's nine guards (a poison pack; DoT was 152 of the 347
  damage in the last death's window) in the Forest's Quickdraw vest. The Jungle vest (HP 112 against 78, evasion,
  DoT resistance 0.25, Lookout) passed them on the next try. Sim, T2 Jungle boss 2/3 -> 3/3, Desert 3/3 either way.
- Test (`slingerT4.test.ts`): the six ids are registered, each chain resolves to its own picks (spec and leaf
  under the discipline) and equals the default route with those choices passed.

### The auto Loadout (`shared/src/classKits/configs/slinger.ts`)
- **Every clip type has a natural rule.** T1 as the bible; T2-T4 (PLACEHOLDER): Buckshot on a charge,
  Shellbreaker on a shield, Tracer on a fleeing target, Hollow-point on a target below half, Seeker on a target
  out of reach, Acid on plating, Tether on a fleeing target, Frost on a fast enemy closing, Incendiary on an elite
  or boss, Thermite on a shield, Hallowed on a risen enemy, Exploit on an elite or boss.
- **The default rack** (it used to take the first clips in kit order: Scatter, Snare, Venom, Stopping, forever):
  three roles keep a slot each with their newest clip, the crowd clip (Scatter / Buckshot), the control clip and
  the boss clip (rule "an elite or a boss": Venom, Incendiary, Exploit); the rest goes to the newest lessons (a
  learned clip or a rank-up), so the zone's own answer is racked at its boss. Evidence: newest-lessons only lost
  the Gunslinger's T2 Cave and Jungle bosses (no Snare on the second gun) and the Trickshot's T2 Jungle boss 3/3
  (no Venom); with the three roles all three chains pass T2 in the sim.
- **Rule order:** shield, out of reach, fleeing, risen, charge, fast enemy closing, low target, crowd, elite or
  boss, plating last (on a plated boss Venom beat Breaching: Trickshot T2 Plains 83-91 against 69 damage per second).
- **Siege:** no control slot, the rest damage clips first ("a damage clip in the drum", §10.13), and plating read
  before the boss clip (a Breaching drum, the bunker-buster shell: T2 Cave boss 3/3 lost at 1% on a Venom drum,
  won on Breaching).
- **Trickshot:** the config carries the called-shot order (enemy winding up, elite, lowest HP; the runtime used
  it already when empty, now the class screen shows it). **Deadeye** gets its own held-round rule
  (`deadeyeHold`: an enemy winds up, the target is low): see the runtime fix below.
- Test: `shared/src/classKits/configs/slinger.test.ts` (rules for every clip, the roles, a newest T2-T4 clip
  racked, the orders, valid defaults).

### Class runtime (`server/src/systems/classes/`)
- `archetypes/reload/slinger.ts` `chooseTwinClip`: the second gun prefers another family (a holding rule of
  another family, then a racked clip of another family, then the old order). §10.13: "Gunslinger: a damage clip
  and a control clip on the twin guns"; the old order took the next holding rule first, so with a plating rule and
  a boss rule both holding it put two damage clips on the guns.
- `archetypes/reload/slinger.ts` `deadeyeWaits`: **the held round reads the Loadout's `deadeyeHold`** when set (the
  field was parsed and validated, never read), else the called shot's rule as before. With the called shot's
  "an elite or a boss" in the list the moment always held on a boss, so the round was never held there (no x1.6)
  and on enemies that never wind up it waited the whole hold every clip (the T3 Mountain guards, above). A plain
  bug fix on the bible's rule (§10.6: the held round waits for the rule's moment); listed for review.

## Rules or mechanics changed
- Deadeye's held round reads its own rule (above); design intent unchanged.
- The auto Loadout's rack and rule order (above); the bible's T1 natural rules unchanged.
- No other rule changed.

## Numbers changed

| File | What | Old | New | Why / evidence |
|---|---|---|---|---|
| `server/src/systems/classes/slinger/tuning.ts` | Siege reload shift (`RELOAD_SHIFT_MS`) | +900 ms | +400 ms | T2 Cave boss (Dreadbore): its eruptions land in the stationary reload (sim trace: 190 HP taken in 5.3 s of reloading against 166 in 23.8 s of firing). Sim, Drum Gun, 6 runs: +900 3/6, +600 2/6, +400 5/6 (+200 2/6). Still the longest of the three. Tried and dropped: shell x1.5 (0/2), rounds 0.6 of a normal round (0/2). |
| same | Siege clip shift (`CLIP_SHIFT`) | +4 rounds | +8 | Fewer stationary reloads a fight. Sim, T2 Cave boss 6 runs: 5/6 (HP left 16-20%) -> 6/6 (33%); Forest 23% -> 45% HP left, Mountain 11-69% -> 66%; T3 7/7, T4 7/7. Live: the Cave boss won on the first try after it (one loss at 9% before, at +4). |
| same | Deadeye's longest hold (`DEADEYE_HOLD_MS`) | 4000 ms | 2000 ms | Against enemies that never wind up or drop low every clip waited the full hold; the live Trickshot gave up on the T3 Mountain dungeon's four Stone Wardens after 15 minutes (60% of its samples idle). Sim, those guards, 300 s: 2 kills at 4 s, 8 at 2 s (8 without Deadeye); T3 7/7, T4 7/7. Live: T3 Mountain first try after it. |
| `shared/src/classKits/configs/slinger.ts` | Buckshot's natural rule | (new) a charge | three or more enemies near | Buckshot replaces Scatter in the crowd slot from the T2 Plains; on a charge rule the crowd slot never loaded in packs (a live Trickshot death to the T2 Jungle nine guards, plain rounds only). |

## How I checked that the class system fires

From the lanes' server logs (`slinger loadout`, dev only), summed over the runs after the last restart of each lane
(`tally.js` in my scratchpad):
- **Siege** (66 minutes of fighting): rounds plain 1798, Buckshot 155, Acid 132, Hollow-point 66, Venom 24,
  Incendiary 24: four T2-T4 clips loaded by the auto rack; 58 shells; 142 reloads (80 early, 6 waited on a
  telegraph, none started in one); damage taken 914 while reloading against 10238 while firing (reloading ~9%
  of the fight time).
- **Trickshot** (28 minutes): plain 258, Incendiary 73, Buckshot 18, Frost 11; 38 called shots; last rounds by
  trophy (Desert, Mountain, Cave, Swamp, Jungle); taken 582 reloading against 2363 firing.
- Plain dominates because the crowd rule wants three enemies on you and most farm pulls are one or two.

Sim telemetry (`--trace`, rounds by clip, final code): Siege T3 fired Breaching, Hollow-point, Acid, Venom (2-4
shells a fight); Trickshot T4 fired Incendiary, Hallowed, Exploit, 1-4 called shots a minute; racked but idle
at bosses (their moment never held): Shellbreaker, Tracer, Thermite, Frost, Buckshot.

## Still broken or unsure

1. **Trickshot stalls on the T4 Mountain dungeon's guards** (blocker for the Trickshot chain's T4): four rooted
   Stone Wardens ("post-hold", T4), 1 killed in 15 minutes, then the guard phase gave up. During it 56% of the
   bot's samples were `idle: No worthy target nearby` and the kills came every ~150 s, as if the bot walks to the
   next guard only after a stall timeout. The T3 one did the same before the Deadeye fix (4 kills at 150 s
   intervals, gave up; after the fix, cleared first try). The sim agrees Deadeye is the Trickshot's problem on
   these guards (300 s: Deadeye 3 kills, Ricochet 8 at T4; T3 2 -> 8 with the 2 s hold). Not proven why a held
   last round leaves the auto AI idle (cancelled attacks?); Siege and the Gunslinger clear the same guards. Next
   steps: look at what a cancelled attack does to the auto target (combat AI, not my files), or hold only on an
   elite or boss target, or make Ricochet the Trickshot default (it needs a fresh character or a class reset).
2. **Siege's T2 margins are thin** (sim 20/21, Forest 45%, Cave 33% HP left) and it lost the T2 Cave boss once live.
3. **T4 not finished** for either chain (timebox); Siege's T4 was clean so far.
4. The Gunslinger chain was not re-run live after the shared changes (sim only).
5. The auto rack's crowd rule (three enemies on you) rarely holds in farm pulls, so plain rounds dominate; the
   sim cannot judge guards (it spawns inside the pack; `--guards` only gives kill rates).

## Questions for the designer

1. Are the T2-T4 natural rules right (above)? The bible gives the T1 ones only.
2. The auto rack keeps a crowd, a control and a boss clip and gives the rest to the newest lessons: is that
   the Loadout you want a player who never opens the screen to have?
3. Siege on a lone boss: its rounds deal half and bank the other half into the shell, so a single target takes
   about a plain clip's damage with a longer reload; only the Drum Gun's ramp and the drum's four rounds pay it.
   Should the shell be worth more than the damage it costs (the bible says ~50/50, not a gain)?
4. Specialization and leaf defaults for Siege and Trickshot (Entrenched, Bunker; Deadeye, Cool Reload)?

## Checks
- pnpm typecheck: clean (exit 0)
- pnpm test -- slinger: 11/11 passed; pnpm test -- reload classKit classConfig routes/index bot/src/routes: 41/41 passed
- One test changed: `server/test/slingerT2.test.ts` (the Siege drum is the gun's 8 + 8 = 16 rounds).

## Files outside the brief I needed (not edited)
- `server/bench/classBossSim.ts` (the conductor's): used through an untracked copy with `--visited` (route
  levels), Keep Distance and `--trace`; worth folding in (`--runes`, `--visited`), as OV-SLINGER also asked.
