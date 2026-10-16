# OV-SQUIRE report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov-squire   **Last commit:** (the commit carrying this report)

Lane 2 (:4312, `gamedb_ov2`), account `ov2-squire`, `--rewardMultiplier=100`, `--policy=intended`,
auto config. Default chain (PLACEHOLDER): **Bulwark → Reverb → Second Line** (was Avenger →
Measure for Measure → Last Word). Merged `rework/class-first` four times (boss sim, its clock fix,
the tier HP/ATK knob, OV-HOOKS); every merge was clean.

## Per tier (live, lane 2)

| Tier | Route (run) | Boss kills / attempts | Deaths | Minutes | Result |
|---|---|---|---|---|---|
| T1 | squire-t1, fresh character (slam x2, before any tuning) | 2 / 2 | 0 | 15.6 | PASS |
| T2 | squire-t2 run 1 (resumed; T2 mace at the Mountain) | 2 / 4 | 2 | 30 (stopped) | the Mountain boss killed it twice (boss at 19%, 2%) |
| T2 | squire-t2 run 2 (resumed; Warhammer at the Mountain, current code) | 5 / 5 | 0 | 27.3 | PASS |
| T3 | squire-t3 (resumed) | | | | |
| T4 | squire-t4 (resumed) | | | | |
| Final clean chain | squire-t4 on a reset lane | | | | |

T2 overall: 7 bosses in 9 attempts, both deaths in the run the route fix addressed.

## Class boss sim (`server/bench/classBossSim.ts`), route state and route gear

Wins / runs, player HP left at the end. Current code (slam x6 unless noted, tier knob on).

| Boss | Result |
|---|---|
| T1 Plains, the guide's point (Plains set, plains 6) | slam x5: 6/6, 16-27% HP; **x6: 6/6, 26-40%** |
| T1 Plains, route seal set (Warhammer, Mountain vest, Cave charm; x5) | 3/3, 49-59% |
| T1 Mountain, route seal set (x5) | 3/3, 53% |
| T2, Bulwark (x5, before the knob; Mountain with the Warhammer) | 7/7 bosses won; lowest Plains 14-62%, Mountain 42% |
| T3, Bulwark + Reverb (x5, knob, Cave tank set at the last three) | 7/7 won 2/2; lowest Volcanic 70-90% |
| T4, Bulwark + Reverb + Second Line (x5, knob) | 7/7 won 2/2; every run ended at 98-100% HP |

Before the knob (for the conductor's matrix): T3 lost the Desert (boss 1%) and the Volcanic (18-31%)
in the zones' own sets, T4 lost the Volcanic 1/2 (boss 4%); the Juggernaut chain lost the T2 Mountain
(25%) and Desert (1%).

## Done

### Routes (`bot/src/routes/squireT1..T4.ts`, `squireGearChecks.ts`)
- **T1 crafts the Clearing set** (conductor finding): farm the Clearing to 4, craft and wear
  `squire-plain-sword-and-shield-t1`, `clearing-vest-t1`, `clearing-charm-t1`, `clearing-boots-t1`.
- **Every zone, every tier wears its gear as soon as its level unlocks it** (`farmWearingGear` in
  `squireT1.ts`: farm to the piece's recipe level, craft, equip; levels read from `RECIPE_DATABASE`).
  Tables per route: `SQUIRE_T1_ZONE_GEAR`, `SQUIRE_T2_ZONE_GEAR` + `SQUIRE_T2_WEAPONS` (by
  discipline), `SQUIRE_T3_ZONE_GEAR`, `SQUIRE_T4_ZONE_GEAR`. PLACEHOLDER rule: every zone's armor
  and charm (its line answers that zone's threat), boots only when faster, the heavier weapons (the
  slam is a swing, so attack sizes it). Each tier's first boss is met in a weapon, armor, charm and
  boots of that tier (tests check it).
- Weapons: T1 Flanged Mace → Spiked Flail → Warhammer → Tower Shield (Arming Sword skipped: light);
  T2 Bulwark: Flanged Mace → **Warhammer at the Mountain** → Tower Shield from the Cave; T3 and T4:
  the Mountain's Warhammer (no later weapon out-hits it, swing plus slam).
- Boss sets (equip only, right before the boss): T1 seals Warhammer + Mountain vest + Cave charm;
  T3 Desert, Tundra and Volcanic: Cave vest (30% DR) + Old Guard charm.
- Defaults: discipline **`squire-bulwark`** (balanced; its Flanged Mace is the first T2 zone's
  weapon; in the sim it cleared all seven T2 bosses where the Juggernaut lost two), specialization
  **`squire-reverb`**, leaf **`squire-second-line`**. `squireT2Route(id)`, `squireT3Route(id)`,
  `squireT4Route(id)` still take the other picks.

### Runtime (`server/src/systems/classes/archetypes/cooldown/`)
- **Telemetry** (`squireTelemetry.ts`, dev-only; how the class system was verified): one
  `squire-telemetry` line per player per minute of world time in the lane's `server.log`:
  `resp.<piece>.<landed|wasted|braced>`, `catch.<guard|parry|watchful|unbowed|disarm>`,
  `wasted.<family>`, `slam` / `slam.damage`, `fill.<hit|trickle|answer|steady|muster>`,
  `taken.<ability name|charged|boss-swing|add-swing>`. On with `NODE_ENV=development` (lanes) or
  `SQUIRE_TELEMETRY=1` (sim); `SQUIRE_TELEMETRY_TICKS` sets the period. Seen live: Shove, Riposte,
  Steel Will, Guard (braced and caught), Shield Bash, Stand Fast, Unshaken, Splitting Blow,
  Backdraft, Last Breath, Muster fills, slams (e.g. T2 Forest dungeon minute: Riposte 17 landed,
  Shield Bash 5, Unshaken 3, Guard 6 braced / 1 caught, 9 slams for 3510).
- **Shove fix (for review):** a boss or rooted enemy can't be moved, so it no longer counts toward
  Shove's three. A boss with two adds fired Shove every lockout and wasted its pip.
- **Shield Bash / Guard fix (for review):** telemetry showed Bash landing 5 and Guard wasted 5 in
  the same minute: both answered the same wind-up and the Bash's interrupt made the Guard's blow
  never land. Bible §8.13's default is "Shield Bash on an interruptible cast, Guard otherwise":
  Bash now goes first, is not thrown at a boss pattern step or a control-immune enemy (it used to
  be, wasting a pip each time), and Guard isn't raised once nothing is coming.
  Wiring test: `server/test/squireOvFixes.test.ts`.

## Numbers changed

| File | Key | Old | New | Why / evidence |
|---|---|---|---|---|
| `shared/src/classKits/squire/kit.ts` | `squire-slam.params.mult` | 2 | 6 | Sim, Tusked Razorback at the guide's point (Plains set, plains 6): x2 lost (boss left 3-34%), x4 won at 16-27% HP, x5 6/6 at 16-27%, x6 6/6 at 26-40% (the conductor's ~25%+ margin). The slam is then ~45% of the Squire's damage (bible §8.5 illustrates ~50/50 for the Bulwark). A boss counting as 4 in the trickle instead (x5) moved it only to 21-27%. |
| same | `squire-backdraft.params.damagePct` | 1.5 | 3, then back to 1.5 | x2 fixed the T4 Volcanic before the tier knob; with the knob it is not needed and the conductor asked not to compensate T3/T4 with class numbers. Net: unchanged. |
| `shared/src/data/classGear/squire.ts` | Cooling Breath T3 | 0.01 | tried 0.03, reverted | did not save the T3 Volcanic; the Cave tank set did. Net: unchanged. |

## Rules or mechanics changed
- Shove: not thrown unless three movable enemies are on you.
- Shield Bash: answers first; only interruptible, controllable wind-ups. Guard: no brace when the
  wind-up is gone.

## Checks
- `pnpm typecheck`: clean at every commit.
- Route tests: `squireT1`, `squireT2`, `squireT3`, `squireT4` ok.
- `pnpm test -- squire mechanicFired` (before OV-HOOKS): 13/13 passed. After the OV-HOOKS merge,
  `pnpm test -- squire escapeLock momentsForesight windupSlow mechanicFired` under CPU 100% (six
  lanes): `squireT2`, `squireT3`, `squireT3W2` failed in the runner and each passed alone
  (`node --conditions=development --import tsx test/<file>`): load, not code.

## Not done, or unsure
- **`groundTelegraphs` ("hold or step out", §8.3) is read nowhere in the server.** And no class
  steps out of a ground telegraph at all: telegraph evasion is turned on only by the `step-back`
  rune (`runeDatabase.ts` `derived.evadeTelegraph`), which `DEFAULT_RUNE_LOADOUT` doesn't carry and
  no route equips. For the Squire it means every planted telegraph is in effect "held" (Guard
  catches it), which suits it; for the other classes it is likely part of the T1 deaths. Conductor:
  decide whether `step-out` should equip the evasion (core: `runeConfig.ts`).
- Wiring gaps from the brief, left as they are because they don't touch the solo bar: Intercept
  (stand-in), Challenge on "an enemy attacking an ally", Unbowed only on untelegraphed blows (the
  Bulwark chain doesn't use it). Undertow now uses OV-HOOKS's `lockMonsterEscape` (merged).
- The flake check (§8.15 Q1) was not run as its own arm: no deaths while farming any zone in T1/T2
  live, but no kill-speed comparison against other classes.
- The Squire is far over the curve at T3/T4 with the tier knob (sim: most bosses ended at 98-100%
  HP). No class number was raised for T3/T4; the knob and the T1 slam carry it.
- The bar grows with Mastery (4 → 15 pips) but the slam doesn't: every Mastery pip makes slams
  rarer. Left as is (design question below).

## Questions for the designer
1. Should the slam grow with the bar it spends (a 10-pip slam bigger than a 4-pip one)? Today it is
   one fixed size, so each Mastery pip means rarer slams.
2. Default discipline for the bot and the guide: Bulwark (balanced, cleared every T2 boss in the sim)
   or the Avenger (the earlier placeholder)?
3. Shove ignoring the boss, and Shield Bash never thrown at what it can't interrupt: keep as the
   default behaviour, or should a sloppy rule still be able to waste them?
4. "Step out" of ground telegraphs: should it exist for the Squire at all (no class steps out today)?

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/ai/runeConfig.ts`, `shared/src/runeDatabase.ts` (the step-back / evasion
  finding above).
