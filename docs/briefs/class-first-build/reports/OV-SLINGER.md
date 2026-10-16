# OV-SLINGER report
**Agent:** Claude Opus 5.5 (OV-SLINGER)   **Branch:** rw/ov-slinger   **Last commit:** see `git log -1` (this report is the commit on top)

Lane 4 (port 4314, `gamedb_ov4`), routes `slinger-t1..t4`, default chain **Gunslinger → Fan the Hammer →
Light Hands** (the routes' defaults; the bible names no default discipline). 100x rewards, auto
config, `--policy=intended`. Every number below is a PLACEHOLDER.

## Per tier

**Clean chain** (`slinger-t4` from a fresh character on a reset lane, 05:15-07:40, code at `cd3ae8c2`,
i.e. before the Quickdraw-vest fix): 27 of 28 bosses, 6 deaths, 145 min, completion `partial`.

| Tier | Route | Boss kills / attempts | Deaths | Minutes | Pass? |
|---|---|---|---|---|---|
| T1 | slinger-t1 (inside t4) | 2 / 2 (Plains 54 s, Mountain 27 s) | 0 | 15 | pass |
| T2 | slinger-t2 (inside t4) | 6 / 12: Plains, Forest, Mountain, Swamp, Jungle, Desert first try; **Cave 0/6** (boss left 39-42%, 26-27 s each) | 6 (all the Cave boss) | 66 | **fail** at the Cave boss (fixed after, see below) |
| T3 | slinger-t3 (inside t4) | 7 / 7, all first try (25-53 s) | 0 | 29 | pass |
| T4 | slinger-t4 | 7 / 7, all first try (42-107 s) | 0 | 35 | pass |

**Development runs** (one character resumed tier by tier while fixing, 02:12-05:03): T1 2/2 (one Plains
death before Keep Distance and the fire-rate change, none after); T2 7/7 in 9 attempts (Mountain and Cave
each lost once: Cave at 1% boss HP left, then won); T3 7/7 first try, 0 deaths.

(not filled: the agent was cut off by the API usage limit; the final merged-tree runs are in OVERNIGHT-REPORT.md)

The class boss sim (`server/bench/classBossSim.ts`, the conductor's; I ran an untracked copy with the
route's standing orders) agrees with the live lane wherever both ran (T1 Plains 52 s vs live 55 s; T2
Mountain death at 9 s vs live 9 s) except the T2 Cave boss, which the sim only reproduces with Avoid
Hazards on (the Dreadbore's sinkholes); see Open, 5.

## Done

### Bot routes (`bot/src/routes/slingerT1..T4.ts`, tests next to them)
- **The Clearing set, then every zone's gear as it unlocks** (the conductor's finding: the T1 route
  walked into the Plains bare). After the class pick: the Clearing pistol, vest, charm, boots; then in
  each zone its weapon (level 1; only a gun that beats the one held), vest (2), charm (3), boots (4).
  T2-T4 the same at the tier's levels.
- **Discipline guns** (bible §10.4 fits) on the `slinger-discipline` route choice: Gunslinger Pepperbox
  then Carbine (T2), Carbine (T3/T4, a detour into the Jungle in front of the Mountain, the tier's first
  boss); Siege Pepperbox then Drum Gun, Drum Gun (T3 Cave / T4 Trench detours); Trickshot Hand Cannon
  (T2 detour into the Mountain before the Plains boss; T3/T4 the Mountain's own).
- **The Quickdraw vest is kept** (Plains vest, then the Forest vest for the rest of T2; at T3/T4 the
  Jungle's second base, which carries the Forest's Quickdraw, made on a Jungle detour and kept).
  Charms and boots still change per zone.
- **Standing orders** (one `configureRunes` step after the class pick): the default set with
  `inside-telegraph → Step Back`, then `in-combat → Keep Distance`, in place of `in-combat → chase`.
- Route tests: each crafted piece is a recipe of the zone and tier it is made in, is worn as made and
  unlocks within the route's farm; each tier's first boss is met in a gun that fits the discipline;
  the standing orders put Step Back before Keep Distance.

### Class runtime
- **"Never start a reload inside a telegraph" now acts** (it was stored, never read). While the free
  rule is on (default) and the Slinger stands in a ground telegraph (`inside-telegraph`), the round that
  empties the clip still fires as the last round, but the stationary reload waits (at most
  `TELEGRAPH_HOLD_MAX_MS` = 3000) and a switch reload never starts there; any reload start ends the wait.
  Files: `reloadPrototype.ts` (gate and update), `reloadLifecycle.ts` (`RELOAD_HELD_AT`), `slinger.ts`
  (`reloadWaitsOnTelegraph`, `holdReload`). Test: `server/test/slingerTelegraphReload.test.ts`.
- Small fix: the early reload no longer restarts a switch reload started on the same tick.
- **Dev-only telemetry** (`server/src/systems/classes/slinger/telemetry.ts`, off in production): one
  `slinger loadout` log line per Slinger per minute of fighting.

## How I checked that the class system fires

From the lane's server log (`slinger loadout` lines), development T2/T3 runs and the clean chain:
- Rounds by clip: plain, Scatter, Snare, Venom, Stopping all fired (T3 dev session: plain 254, Snare 456,
  Venom 193, Scatter 14, Stopping 12). Gunslinger's twin guns alternate (gun A plain or the rule's clip,
  gun B Snare, the "other family" pick).
- Last rounds by trophy: Twin (Forest), Quake (Mountain), Splinter (Cave), Bounty (Desert) seen in turn as
  the last round, as `auto` equips the newest trophy.
- Reloads ~8-15 per minute of fighting; deferred (the telegraph rule) a few per session; early reloads
  out of combat; no switch reloads (auto sets no `switchEarly`); Fan the Hammer active at T3.
- **Does the stationary reload bite (bible §10.15 Q1)?** Yes. With Keep Distance the Slinger takes almost
  nothing while firing on most bosses and most of its damage while reloading (T2 dev run: one minute 187
  reloading / 0 firing, another 60 / 0), from ~15% of the fight time. In the Cave dungeon it was the other
  way (firing 125-377 per minute against 51-198 reloading): the sinkholes and eruptions, not the reload.
- Never seen: Breaching and every T2-T4 clip (Open, 3).

## Numbers changed

| File | What | Old | New | Why / evidence |
|---|---|---|---|---|
| `shared/src/data/classGear/slinger.ts` | `attacksPerSecond`, all 33 guns | as authored, e.g. Pepperbox T1 0.90, Carbine T1 1.60, Drum Gun T1 1.10, Hand Cannon T1 0.55, Carbine T2 1.70, T3 1.65, T4 1.75 | x1.3, 2 decimals (1.17, 2.08, 1.43, 0.72, 2.21, 2.15, 2.28) | The rework removed the 65%-attack-at-2x-speed layer (1.3x a melee class's DPS with the same weapon) and left each gun at the shared weapon's speed. Plains boss sim (Pepperbox, Plains set, Keep Distance): 0.90 aps 3/3 wins in 69-72 s ending 18-49% HP; 1.17 aps 4/4 in 52 s ending 64-78%. Live: first try, 55 s. |
| same | `attackRange`, all guns | none (rifles 60 / 100 / 140) | +80 (Clearing pistol +40; Hunting Rifle 140, Frostlock 180, Long Rifle 220) | Keep Distance holds the Slinger at 72% of its reach; with the root's 120 alone (132 px) it stood inside the T2 bosses' blasts. T2 Cave boss sim: 3/3 deaths at 30% boss HP left; with the reach 2/2 wins ending 73-76% HP. |
| same | Shade (`slinger.shade`, Desert charm T2-T4) | 5000 ms | 3000 ms | The T2 Desert boss chains Sun Mark, a 35% slow and a 150 px Execution; Shade took the mark, the slow stayed, the Slinger could not step out: 3/3 deaths at 33-46% boss HP left; at 3 s 3/3 wins (57-100% HP left). Live: first try. |
| `server/src/systems/classes/archetypes/reload/slinger.ts` | `TELEGRAPH_HOLD_MAX_MS` (new) | — | 3000 | the cap on the telegraph wait |

Tried and reverted (no clear win, Open, 1): Siege's shell paying x1.6 / x2.0 its bank; Siege's reload
shift +900 → +300 ms.

## Rules or mechanics changed
- The telegraph free rule now acts (above); design intent unchanged.
- The routes set standing orders and choose which vest to keep; no class rule changed.

## Still broken or unsure
1. **Discipline balance (sim, T2 bosses):** Trickshot with the Hand Cannon does 130-183 DPS where the
   Gunslinger's Carbine does 73-107; **Siege loses** the T2 Mountain (49-65% boss HP left) and Cave
   (16-42%) bosses even with a shell at x2.0 or a +300 ms reload: it takes 10-13 HP/s against the
   Gunslinger's 3-4, much of it while firing. Only the Gunslinger chain is verified live.
2. **The Drum Gun T1 is far above the other T1 guns** (T1 Mountain boss 91 DPS against the Pepperbox's 33
   at the Plains boss: 16 rounds ramping 5% each). The route takes it at the Cave.
3. **The auto Loadout racks the first clips learned** (Scatter, Snare, Venom, Stopping; the rack holds 4),
   and T2-T4 clips have no natural rule (`configs/slinger.ts`), so in auto they never load. Breaching never
   fired; Buckshot, Shellbreaker, Tracer, Hollow-point, Seeker, Acid, Tether, Frost, Incendiary, Thermite,
   Hallowed and Exploit never fire unless the player racks them and writes a rule (the guide says "Add it
   in your Loadout" for those). Their wiring is proven only by the unit tests.
4. **Gunslinger's twin guns add no fire rate** (shots alternate at one gun's rate), so the Gunslinger's
   T2 step is only its T2 gun.
5. **The T2 Cave boss (Chitinous Dreadbore) and its sinkholes:** the sim wins easily with the route's
   orders but loses exactly like the live lane (42% left, 26 s) once Avoid Hazards is on, so the live wall
   looks like the persistent sinkholes; the Quickdraw vest answers it in both. Not proven why the live
   lane behaves like the Avoid Hazards sim (the live standing orders had no Avoid Hazards).
6. Live is harder than the sim: the boss fight starts after the guards, often at ~60% HP.

## Questions for the designer
1. Should a fresh Slinger start with Keep Distance (and Step Back) as standing orders? Without them it
   trades shots at melee distance and loses the first boss every time (sim, ~60 px from the boss).
2. Do twin guns fire faster than one gun (Gunslinger's T2 power step)?
3. Which T2-T4 clips should `auto` rack, and on which natural rules? (e.g. Shellbreaker on a shield,
   Hollow-point on a low target, Tracer and Tether on a fleeing target, Seeker on one out of reach.)
4. Is the T1 Drum Gun meant to be the best T1 gun by that much?
5. Siege's long reload (gun's +900 ms) makes it lose T2 bosses: shorten it, armor it, or accept?

## Checks
CHECKS

## Files outside the brief I needed (not edited)
- `shared/src/runeDatabase.ts` `DEFAULT_RUNE_LOADOUT`: every class starts on `in-combat → chase`, no Keep
  Distance, no Step Back (Question 1).
- `server/bench/classBossSim.ts` (the conductor's): I used an untracked copy (`server/bench/_slingerSim.ts`,
  not committed) with a standing-order override, player-tier and starting-HP overrides, a reload/firing
  damage split and an event trace. A `--runes` option on the real sim would let every ranged class
  measure with Keep Distance.
