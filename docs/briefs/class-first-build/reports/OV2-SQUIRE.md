# OV2-SQUIRE report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov2-squire   **Last commit:** see `git log -1` (this report is the last commit)

Lanes 3 (:4313, `gamedb_ov3`, Avenger) and 4 (:4314, `gamedb_ov4`, Juggernaut), `--rewardMultiplier=100`,
`--policy=intended`, auto config, Avoid Hazards on by default (65a180a5). Two new chains beside the
verified Bulwark chain (`squire-t4`: Bulwark, Reverb, Second Line), all picks PLACEHOLDER:

| Chain | Routes | Discipline, specialization, leaf |
|---|---|---|
| Avenger | `squire-t2-avenger`, `squire-t3-avenger`, `squire-t4-avenger` | Avenger, **Measure for Measure** (the old Avenger path, the earlier placeholder default), **Last Word** (the empty-bar column, the T4 melee resilience of §8.7, as the Bulwark's Second Line) |
| Juggernaut | `squire-t2-juggernaut`, `squire-t3-juggernaut`, `squire-t4-juggernaut` | Juggernaut, **Inexorable** (picked by the sim, below), **Last Rampart** (the empty-bar column) |

Both replay the T1 route (shared) and wear the class's T3/T4 zone tables; the T2 weapons are per
discipline (`SQUIRE_T2_WEAPONS`): Avenger Flanged Mace → Arming Sword (Forest) → **Warhammer (Mountain,
new)** → Tower Shield (Cave on); Juggernaut Flanged Mace → Warhammer from the Mountain (unchanged).

## Per chain, per tier (live)

Boss kills / attempts per tier (T1 the two seals, T2-T4 every zone's boss), deaths anywhere on the
route, minutes (first boss of the tier's farm to its last boss). No `dungeon-guard` give-ups in any run.

**First runs** (fresh characters; resumed with `--fresh=false` only to load code):

| Chain (account) | T1 | T2 | T3 | T4 | Deaths | Minutes | Bar |
|---|---|---|---|---|---|---|---|
| Avenger (`ov3-squire-avenger`; resumed once at minute 6, before any boss, for the Avenger numbers) | 2/2 (31 s, 45 s), 16 min | 7/7 (22-55 s), 31 min | 7/7 (22-60 s), 33 min | 7/7 (36-86 s), 39 min | 0 | 119 | **pass** |
| Juggernaut (`ov4-squire-juggernaut`; resumed in T1 twice for the route's spec and the slam hold, then once at the T3 stall) | 2/2 (31 s, 51 s), 19 min | 7/7 (17-78 s), 35 min | 7/8 (33-87 s; the first Mountain attempt "unreachable", the hold stall in §3), ~70 min with the stall and the walk back after the resume | 7/7 (29-145 s; Desert 145 s), 42 min | 0 | ~167 | pass after the fix (§3) |

**Clean runs** (lane reset, fresh character, final code, no resume):

| Chain (account) | T1 | T2 | T3 | T4 | Deaths | Minutes | Bar |
|---|---|---|---|---|---|---|---|
| Avenger (`ov3-squire-avenger-clean`) | 2/2 (30 s, 41 s), 16 min | 7/7 (22-52 s), 31 min | 7/7 (26-62 s), 34 min | 7/7 (31-89 s), 37 min | 0 | 119 | **pass**, every boss first try, 23/23 guard phases cleared |
JG_CLEAN_ROW

## Class boss sim (`server/bench/classBossSim.ts`, final code)

Each boss with what the route holds there (skills, gear, boss clears and zone levels read from the
route's own steps; driver below), guard stripped, full HP. Wins / runs, your HP left.

| Tier | Avenger (final numbers) | Juggernaut | Bulwark re-sim (unchanged chain) |
|---|---|---|---|
| T2 | 7/7, 14/14 runs, 60-100% (Mountain 72-73%, Plains 60-63%); before: Mountain lost 2/2 (boss 55-56%, Arming Sword; 36% Warhammer) | 7/7, 14/14 runs, 48-100% (Mountain 48%, Forest 56%) | 7/7, 54-100% |
| T3 | 7/7, 80-100% (Volcanic 80%) | Inexorable 7/7, 97-100% | 7/7, 88-100% |
| T4 | 7/7, 99-100% | 7/7, 93-100% (Desert 141 s, Volcanic 92 s with the hold) | 7/7, 99-100% |

Juggernaut specialization screen (T3, the route's gear, before the hold): Destroyer 7/7 at 81-100%
(Mountain 81%), **Inexorable 7/7 at 97-100% (Mountain 97%)**, Rampage 7/7 at 82-100% (Mountain 82%).
Inexorable picked (PLACEHOLDER): best thinnest margin, and "every fight opens with a slam" also helps
on the guards the sim strips. The T2/T3 Juggernaut rows were simmed with the first hold (target-low
alone); the final hold never applies to a boss, so a boss fight holds less, not more.

Driver (scratch, not committed): a tsx script walks the route's steps (unlockSkill, equip by slot,
farm levels, boss clears) to each `attemptBoss`, then runs the sim with `--skills`, `--gear`,
`--levels`, `--cleared` from that state, two jobs at a time, `DATABASE_URL=...gamedb_ov3`.

## What changed, and why

### 1. Routes (`bot/src/routes/squireT2.ts`, `squireT3.ts`, `squireT4.ts`, `index.ts`)
- `SQUIRE_CHAINS` (discipline → specialization, leaf) and `squireRouteId(tier, discipline)`: the
  Bulwark keeps `squire-t2..t4`, the others are `squire-t<n>-avenger` / `-juggernaut`. `squireT4Route`
  takes the leaf's chain specialization (was: the first the kit lists). The six routes are registered
  in `index.ts` (my lines only) and stay out of `CONTROLLED_ROUTE_IDS`, like the other T3/T4 routes.
- The Avenger takes the T2 Warhammer into the Mountain boss (its bible weapon list has it). Sim, T2
  Stoneplate Juggernaut: the Arming Sword died with the boss at 29% (55-56% before the number change
  below), the Warhammer won at 73% HP.
- `squireT4.test.ts` checks the six ids and each chain's picks.

### 2. The Avenger's numbers (`shared/src/classKits/squire/kit.ts`, discipline params)
The Avenger lost the T2 Mountain boss in the sim (boss at 36% with the Warhammer, 55% with the Arming
Sword) where the Bulwark wins at 87%. Telemetry of that fight: 5 slams for 60% of its damage, no
Parry (the boss's blows are charges and ground slams), 2 Guards braced and wasted, 2 Ripostes, 1
Splitting Blow; the Bulwark fired 8 slams in 33 s from its doubled trickle. The six-swing slam (OV-SQUIRE)
carries the class, so a discipline that slams rarer must be paid by its answers.

### 3. The Juggernaut's auto default (`shared/src/classKits/configs/squire.ts`)
Bible §8.13: "hold the slam only on a nearly dead target". Built as a per-discipline default:
`holdSlam = [target-low 0.1, enemies-near 2, not target-elite]`. The first version (target-low alone)
**stalled live**: at the T3 Mountain a lone low-HP enemy kept fleeing out of the slow swing; the full
bar was held for 17 minutes (telemetry per minute: Challenge landed 22, Shield Bash 13, fill 70 pips,
no slam, no damage either way), the bot never left `node-t3-mountain-02` and the boss attempt ended
"unreachable" after 600 s. With a second enemy required and bosses/elites excluded the slam always
fires on a lone target. The Avenger's default (Parry the melee telegraphs, Guard the rest, Bash what
can be interrupted) is already the runtime's answer order (Shield Bash, then Parry, then Guard); the
Bulwark's "hold the slam until three stand in its circle" stays off (it would never fire on a lone
boss, and the verified chain passed without it). Test: `squireKit.test.ts`.

## Numbers changed

| File | Key | Old | New | Why / evidence |
|---|---|---|---|---|
| `shared/src/classKits/squire/kit.ts` | `squire-avenger.params.answerFillMult` | 1.5 | 3 | "landed answers fill much more" (§8.5); with the three below, sim T2 Mountain boss: loss (boss 29-36%) → win 73% HP; T2 7/7 at 60-100% HP |
| same | `squire-avenger.params.hitFillMult` | 0.6 | 0.8 | plain hits still fill less than the base (1) |
| same | `squire-avenger.params.counterPct` | 0.4 | 1.5 | the counter after each landed answer, in swings (§8.5's ~40% counter share) |
| `shared/src/classKits/configs/squire.ts` | `JUGGERNAUT_HOLD_SLAM_BELOW` (new) | — | 0.1 | §8.13's Juggernaut hold; sim T2-T4 all won (T4 Volcanic 50 → 92 s, 93% HP) |
| `bot/src/routes/squireT2.ts` | Avenger T2 Mountain weapon | Arming Sword | Warhammer | sim, above |

No shared class number moved; the Bulwark's discipline, kit and routes are untouched (ids unchanged).

## How I checked that the class system fires
The dev-only `squire-telemetry` line (one per minute per Squire in the lane's `server.log`), summed
over the runs (`resp.<piece>.<outcome>`, `catch.*`, `fill.*`, `slam`):

- **Avenger** (lane 3, first run from minute 6 to the end, 91 minutes): Resolve gained from answers
  3267 pips, hits 298, trickle 409, Muster 28 (answers are ~80% of the fill: the Avenger's tilt).
  **Parry braced 12, caught 10**; Riposte 148, Shield Bash 120 (1 wasted), Steel Will 115, Challenge 73,
  Stand Fast 57, Guard braced 54 / caught 6 (+384 prevented), Backdraft 28, Disarm 26, Splitting Blow 26,
  Frostward 23, Earthstamp 16; 24 Avenger counters skipped for lack of Resolve (`wasted.counter`);
  215 slams for 458,559.
- **Juggernaut** (lane 4, from the T3 resume to the end, 82 minutes): steady fill (armor and HP)
  1169 pips, answers 1192, trickle 331, hits 104 (hits fill half: the tilt). Riposte 111, Challenge 102,
  Shield Bash 96, Guard braced 80 / caught 13 (+643 prevented), Disarm 52, Stand Fast 47, Backdraft 43,
  Splitting Blow 37, Frostward 30, Lay to Rest 15; 125 slams for 766,709 (T3-T4 only, so not
  comparable with the Avenger's whole-route sum). **Unbowed never fired** (no
  untelegraphed blow over a quarter of max HP reached it), so Last Rampart never did either.

## Bulwark regression (the verified chain)
Nothing the Bulwark runs changed (Avenger and Juggernaut params only; route ids kept). Re-sim on the
final code, route state at each boss: T2 7/7 (54-100% HP), T3 7/7 (88-100%), T4 7/7 (99-100%).

## Checks
- `pnpm typecheck`: clean before every commit.
- `pnpm test -- routes/ squire responsesView`: 35/35 passed (every route test, the Squire's server
  tests, `squireKit.test.ts` with the new per-discipline default check, `squireT4.test.ts` with the six
  chain routes).
- `git diff --numstat` checked: `squireT2.ts` is CRLF and kept CRLF (a `sed -i` stripped it once; restored).

## Not done, or unsure
- **Relic by discipline** (§8.13) is not built: auto equips the newest trophy for every class, in
  `shared/src/classKits/config.ts` (conductor's). Every chain passed with it.
- **The Bulwark's slam hold** (§8.13, "until three or more stand in its circle") stays off, as in the
  verified chain.
- **Unbowed and Last Rampart never fired live** (above): the Juggernaut chain passes on its steady
  fill and slam, not on its piece.
- **Root cause of the T3 stall is not fixed at the root, and only inferred** from the telemetry and
  the bot's position samples (not confirmed in the live state): a low-HP enemy that keeps getting out
  of the slow swing (Challenge pulled it back every 3 s, the Squire never moved, never hit or was hit)
  is never finished while the slam is held. Any class whose only
  finisher is held can meet it; for the Squire the hold no longer applies to a lone target.
- The Juggernaut's T4 Desert boss takes 141-145 s (sim and live): long, never in danger (100% HP).
- The Squire stays far over the curve at T3/T4 with the tier knob, all three disciplines (most T4
  bosses end at 99-100% HP).

## Questions for the designer
1. The Avenger's answers now carry it (3x fill from a landed answer, a 1.5-swing counter after each).
   Parry itself is rare: the T2-T4 bosses mostly charge, slam the ground or shoot, so Parry braced 12
   and caught 10 in the whole Avenger run. Should Parry also take charges, or is it fine as a trash/elite tool?
2. The Juggernaut's slam hold (§8.13) needs a second enemy to be safe. Keep it, or drop the hold?
3. Unbowed (the Juggernaut's piece) never fired live: no untelegraphed blow over a quarter of max HP
   reached it on the route. Lower its threshold, or is it meant for rare spikes only?
4. Relic by discipline (§8.13: Avenger and Bulwark a Resolve relic, Juggernaut a slam relic): auto
   still equips the newest trophy for every class (`shared/src/classKits/config.ts`, not mine). Wanted?

## Files outside the brief I needed (not edited)
- `shared/src/classKits/config.ts` (`defaultClassConfig`: the relic is always the newest trophy, no
  per-discipline relic default; question 4).
