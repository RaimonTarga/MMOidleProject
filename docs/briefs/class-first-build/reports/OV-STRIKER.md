# OV-STRIKER report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov-striker   **Last commit:** see `git log rw/ov-striker` (this report is the last commit)

Lane 1 (:4311, `gamedb_ov1`), 100x rewards, auto config. Chain run live: **Balanced → Iaido → Read
the Blow** (`striker-t2-balanced`, `striker-t3-iaido`, `striker-t4-read-the-blow`), account
`ov1-striker`, one character resumed tier by tier. PLACEHOLDER decision: Balanced is the most vanilla
discipline (the T1 combo length, a 50/50 split between beats and finisher, no timing rule); Iaido is
Balanced's first specialization (the T4 route chains through it) and feeds on the two casts the
default Order fields; Read the Blow answers the telegraphed blows that kill a Striker at T2-T4.
Light and Heavy T2 were checked in `classBossSim` (below), and Light live (result at the end).

## Per tier (live, lane 1)

| Tier | Route | Boss kills / attempts | Deaths | Minutes | Pass? |
|---|---|---|---|---|---|
| T1 | striker-t1 | 2 / 2 on the final numbers (Plains 1/1, Mountain 1/1) | 0 | ~15 | **pass** |
| T2 | striker-t2-balanced | 7 / 8 (Swamp lost once) | 1 (Swamp boss) | 37 | **pass** |
| T3 | striker-t3-iaido | 7 / 7 | 0 | 29 (+ a 10-min travel stall, see blockers) | **pass** |
| T4 | striker-t4-read-the-blow | 7 / 7 | 1 (travel, Plague Hound DoT in the Wasteland) | 39 | **pass** |

T1 history on the way (same character): before any change the Plains boss killed it twice (boss 22% /
30% left, 44 s); after the finisher / Broadblade / Grit change it won first try (43 s). The Mountain
seal killed it once at boss 10% left (27 s, the third Crag Charge) until the route turned on Avoid
Hazards; then it won first try (41 s). No death loops, no crashes; one stall (T3 travel, below).

Boss fights (live, first try unless noted): T2 Plains 33 s, Forest 33 s, Swamp 28 s (2nd try), Cave
21 s, Jungle 27 s, Desert 24 s, Mountain 42 s (fought last). T3 Mountain 36 s, Swamp 16 s, Cave 19 s,
Jungle 32 s, Desert 26 s, Tundra 26 s, Volcanic 25 s. T4 Mountain 56 s, Tundra 43 s, Jungle 63 s,
Desert 47 s, Volcanic 92 s, Wasteland 27 s, Trench 55 s.

The clean final chain was not run (the conductor runs every class's full chain from the merged tree).
Note: the T2 Balanced live run predates two later changes (each T2 zone's own set; Light's default),
so the merged-tree chain is the first live run of those for Balanced.

### classBossSim (Balanced unless named; the route's gear; the player starts at full HP)

- T1 Plains (Plains set, Plains 6): 4/4 wins, 25-41% HP left (was 0/3, boss 16-26% left).
- T1 Mountain (Bastard Sword, Forest vest/boots, Plains charm, Mountain 2, Avoid Hazards): wins, 29% HP.
- T2, all seven bosses (Bastard Sword T2, Jungle vest/boots, Plains charm T2): 7/7, 53-100% HP left.
- T2 Light (new default): 7/7, 46-100%. T2 Heavy: 6/7 in the Jungle set; the Swamp boss wins in the
  Swamp set (25% HP), which the route now wears there.
- T3 Balanced Iaido: 7/7 in each zone's set (Swamp boss 85% HP in the Swamp set, a loss at 51% boss
  left in the Mountain set).
- T4 Balanced Iaido Read the Blow: 7/7 in each zone's set (Jungle, Volcanic, Wasteland lost in the
  Mountain set at 47% / 6% / 57% boss left; won at 100% HP in their own). The Charnel-Crown
  Sovereign is no longer out of reach (27 s live).

## Done

- **Routes** (`bot/src/routes/strikerT1..T4.ts` and tests):
  - T1 crafts the guide's Clearing set (Plain Sword, Bark Wrap, Herb Pouch, Soft Boots), then in each
    zone the pieces that beat what it wears as the zone opens them (Plains set; Forest Twin Fangs,
    vest, boots; Cave Bastard Sword; the Plains charm's Grit kept).
  - T1 turns on the free standing order Avoid Hazards ("Read The Ground": `inside-telegraph` →
    `step-back`) ahead of the default rune loadout.
  - T2/T3/T4 craft and wear each zone's own vest, charm and boots (that zone's threat answer) plus the
    arm's weapon (`strikerT2/T3/T4ZoneGear`): the first seal of each tier meets a full set of that
    tier (T2 the Plains set and Broadblade; T3/T4 the Mountain set and Maul); Balanced then takes Twin
    Fangs (T2 Forest), the Bastard Sword (T2/T3 Cave, T4 Trench) and the Reaper's Scythe (T4
    Wasteland); Light Twin Fangs; Heavy the Maul.
  - T2 fights the Mountain seal last (`STRIKER_T2_LATE_SEALS`), after Concuss (Cave) and Pin
    (Desert), in its own set again.
  - T2/T3/T4 replay the earlier tier only while its completion does not hold (`unlessDone`): a
    resumed character no longer walks every earlier zone again (ten minutes per tier).
- **Order default** (`shared/src/classKits/configs/striker.ts`): bug fix (the default took a second
  opener, Charge after Focus, and left that beat empty); per-discipline choice per §12.13 with a
  preference inside each family (`DEFAULT_RANK`: a stun or root that stops a boss first,
  single-target damage before area damage).
- **Telemetry** (`cadence/strikerTelemetry.ts`, dev only): one `striker class system` line a minute
  in the server log. How I checked the class system fires: lane 1's server log, e.g. at T2 one minute
  read `beat:striker-concuss 6, beat:striker-rend 6, cast:striker-coil 6, cast:striker-focus 6,
  finisher:striker-relic-swamp 6, finisher-edge-steps 24` (Balanced's edge at 4 on each finisher);
  at T3 `beat:striker-hemorrhage`, `finisher:striker-relic-tundra`, edge 6 per finisher (Iaido's
  extra steps). Techniques, casts, trophies and the discipline resource all fire in real fights.

## Every number changed

| File | Number | Old | New | Why / evidence |
|---|---|---|---|---|
| `cadence/cadencePrototype.ts` | plain finisher `CADENCE_DAMAGE_MULT_DEFAULT` | 2.0 | 3.0 | §12.4: the base kit must win the Plains boss; sim 0/3, +20% dps |
| `classGear/striker.ts` | Broadblade T1 attack | 19 | 23 | Plains boss, with the finisher and Grit: 4/4 wins at 25-41% HP |
| `classGear/striker.ts` | Grit `striker.grit-pct` T1 | 0.15 | 0.5 | Mountain seal: no other T1 charm survived its charges (died at 17 s); Grit 0.5 wins at 22-29% HP |
| `classGear/striker.ts` | Grit T2 and the Volcanic moved lines (T3/T4) | 0.188 | 0.55 | a step above T1 |
| `classGear/striker.ts` | Rhythm `defense.recovery-rhythm-ms` (all four entries) | 20000 | 10000 | bible §12.4: "to double after ~10 s" |
| `striker/kit.ts` | Coil `finisherBonusPct` | 0.6 | 1.0 | Mountain seal: 9% boss left → win; "the finisher hits much harder" |
| `striker/kit.ts` | Focus `castMs` / `attackSpeedPct` | 700 / 0.25 | 400 / 0.4 | it cost more swing time than it saved (Focus+Coil 53 dps, Coil alone 55) |

## Rules or mechanics changed

- The default Order (auto) differs per discipline and ranks techniques inside a family (above); Light's
  §12.13 default ("Focus, attack setups") gains one stop (Concuss) first. PLACEHOLDER, for review.
- Route-level choices (gear picks, the late Mountain seal, Avoid Hazards, `unlessDone`) are bot routes
  only; no class rule changed.

## Checks

- `pnpm typecheck`: clean (after the last code commit).
- `pnpm test -- striker cadence orderView classGear`: 15/15 passed (strikerOrder, strikerT2/T3/T4,
  strikerT3Hud, strikerGear, strikerKit, cadenceClassSelection, classGear x2, orderView, bot
  strikerT1-T4). After the last edits: `pnpm test -- routes/strikerT strikerKit orderView` 6/6.

## Not done, or unsure

- Crescendo's release: OV-HOOKS's `target-staggered` moment exists, but I did not wire it into
  Crescendo's auto default. A hold of "not staggered" never releases against a boss that cannot be
  stunned (the T3 Tundra and Volcanic bosses accept no control), so it needs a fallback (designer).
- Light and Heavy past T2 are untested.
- The auto relic is the newest trophy (shared `config.ts`), not "a weight relic" for Balanced/Heavy
  (§12.13). It did not cost a boss.
- `server/bench/_ov1Probe.ts` (the sim plus per-source damage, Order and relic printouts, custom
  beats, item overrides) stays untracked, not committed.

## Blockers and issues for the conductor (outside my files)

1. **The Mountain armor base has no damage cap.** Bible §12.4: Mountain armor = "Damage cap + Braced
   Cast". `mountain-vest-t1..t4` carry `guard.potency-pct` (the removed Guards) and no recipe carries
   `defense.max-hit-pct`, so Braced Cast's "the cap is lower while you cast" is inert for every class.
2. **Avoid Hazards is not in `DEFAULT_RUNE_LOADOUT`.** Without the `step-back` rule the auto-fighter
   stands in every charge lane; the T2 Stoneplate Juggernaut's 2x charge one-shots a T2 Striker (200
   on 273 HP). §3 lists Avoid Hazards as a free standing order: consider it default for every class.
3. **`shared/src/systems/empoweredMult.ts` `ROOT_DEFAULT_MULT.cadence` mirrors the finisher at 2.0**;
   it should follow `CADENCE_DAMAGE_MULT_DEFAULT` (now 3.0) or the previews understate the finisher.
4. Travel (fixed on your side since; d39b8d8a merged): the T3 resume stalled 10 min "waiting for
   arrive at node-t3-mountain-02" after walking 13 nodes from the T2 Mountain dungeon; a resume went on.
5. The boss step does not wait for full HP before the altar (live meets the boss after the guard). Not a
   blocker at these numbers.

## Questions for the designer

1. The plain finisher is now x3 (was x2) and Coil +100%: a T1 Striker's boss damage lives in the
   finisher (60-75%). Keep that shape, or move power to the beats?
2. Grit heals back half of every hit while you keep attacking (was 15%); the T1 Mountain seal needed it.
   Is a T1 charm that strong fine, or should the Mountain answer be the (missing) damage cap?
3. The default Order fields a stun (Concuss) in every discipline once owned, because the T2-T4 bosses'
   designed stops are stuns and roots. Is "the auto config uses control" the intended default?
4. Crescendo's release: release on "staggered" with what fallback against a boss that cannot be stunned?

## Files outside the brief I needed (not edited)

- `shared/src/data/recipes/mountain.recipes.ts` (issue 1), `shared/src/runeDatabase.ts` (issue 2),
  `shared/src/systems/empoweredMult.ts` (issue 3), `shared/src/classKits/config.ts` (the auto relic),
  `bot/src/route/executor.ts` (issues 4-5).

## Live Light T2 (account `ov1-striker-light`, fresh character, `striker-t2-light`)

(result below)
