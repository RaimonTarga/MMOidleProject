# T2-STRIKER report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t2-striker   **Last commit:** see `git log` (code commit "feat(striker): tier 2 runtime", then this report)

## Status table (every T2 item, bible §12.5, §12.8, §12.16)

Status before my work → after. All numbers are PLACEHOLDERS in kit `params` or named constants.

| Item | Before | Now | Notes |
|---|---|---|---|
| Whirlwind (sidegrade of Sweep) | missing | wired | 3 spins, each `hitPct` of the swing on every other enemy around. **Stand-in:** the bible says "cast" but gives no position (opener or wind-up), so it is NOT a cast. |
| Feint | missing | wired | Beat deals 0, rides no strikes/sparks; next beat (or the finisher) is multiplied by `critMult`. **Stand-in:** the game has no crit stat, so "crit" is a flat 1.5x multiplier (PLACEHOLDER). |
| Armor Break | missing | wired | Shared `plating-shred` record (everyone's hits read it), strongest wins; Bastard Sword shortens it. |
| Concuss | missing | wired | `applyStun`; control-immune bosses refuse (`monsterIgnoresControl`). |
| Charge (opener cast) | missing | wired | Short cast, then a dash (`repositionPlayer`) and a strike; the strike is the opener beat. Also starts from the tick against a target out of reach (flee/kite), within `maxRangePx`. |
| Pin | missing | wired | `applyMonsterRoot`. |
| Rend II (rank-up) | data only | wired | Verified rank params flow (`ticks`/`tickPct`). |
| Wide Arc II, Double Slash II, Festering Cut II | data only | wired | Rank params already in the kit; test checks Wide Arc II. |
| Skyfall II | text only | wired | New rank param `platingIgnorePct`; Skyfall's resolved blow sets `ctx.platingMult`. |
| Sunder II | text only | wired | New rank param `platingCrackPct`; cracks plating via `plating-shred`. |
| Pounce (Jungle trophy) | missing | wired | Armed finisher leaps to a target out of reach (tick), bonus scales with distance leapt. |
| Verdict (Desert trophy) | missing | wired | Finisher kills a target at/below `thresholdPct` outright (applies to bosses too: PLACEHOLDER). |
| Light: the shine | missing | wired | Finisher lights the next combo (lit lasts to the next finisher); lit beats +25%. Spark relic twist already rides the next combo for every Striker (T1), so Light adds only the damage. |
| Balanced: the edge | missing | wired | Edge rises 1 step per beat (swing or cast); damage techniques and the finisher get +15% per step (4 steps = +60%); resets at the finisher. |
| Heavy: Momentum | missing | wired | Soft beats (plain + damage techniques) add 0.25, a setup (either setup family) multiplies by 1.5, cap 2.0; finisher x(1+Momentum), spends it all. "Soft" and "setup" readings are mine (PLACEHOLDER). |
| Break rule (stun / no target / the walk) | missing | wired | Stun, 3 s with no swing, or auto-traversing reset all three resources. Unbroken (`defense.control-duration-cut-pct` > 0) and Watchful (ambush) say a stun doesn't count. |
| Hunter's Blade | data only | wired | `striker.first-strike-pct`: first beat on a new target. Filled T2 to T4 (0.5 / 0.625 / 0.75). |
| Executioner's Blade | data only | wired | `striker.execute-pct`: damage techniques + finisher below half HP. T2 to T4 (0.4 / 0.5 / 0.6). |
| Watchful (Jungle armor) | text only | wired | `striker.ambush-proof`: while the `ambush` moment is live, casts survive hard control and the resource doesn't break. |
| Chase (Jungle charm) | text only | wired | `striker.closing-recovery-x` via `activateRecoveryBoost` while walking up to a target. |
| Close In (Desert armor) | text only | stand-in | `striker.close-in-speed-pct`: while a `ranged-attacker` hits you and you close on a target, rides the existing Sidestep status' `moveSpeedPct` layer (no evasion data). It shows as a Sidestep tile; a dedicated speed layer in `movement.ts` would be cleaner (outside my paths). |
| Shake Off (Desert charm) | text only | wired | `striker.shake-off-interval-ms`: every interval ends `sun-mark`, else `slow`. Other mark/slow ids on the player are not covered. |
| New keys | n/a | done | 6 `striker.*` keys in `STRIKER_KEYS`, labels in `mechanicLabels.ts`; T3/T4 entries of the same T2 jobs filled with stepped values so they aren't dead items. |

## Done
- `shared/src/classKits/striker/kit.ts`: params for the six T2 techniques and the Jungle/Desert trophies, rank params for Skyfall II and Sunder II.
- `shared/src/data/classGear/striker.ts`, `shared/src/passives.ts`, `shared/src/data/mechanicLabels.ts`: the six gear keys, effects on the T2 to T4 entries of those jobs.
- `server/src/systems/classes/archetypes/cadence/`: new `strikerT2.ts` (discipline resources, break rule, Watchful/Chase/Close In/Shake Off); `order.ts` (six technique handlers, Pounce/Verdict weights, Charge cast + leaps, plating rank effects, discipline hooks); `strikerGear.ts` (Executioner); `index.ts` (tick wiring).
- `server/test/strikerT2.test.ts`: 20 wiring blocks.

## Checks
- pnpm typecheck: clean
- `pnpm test -- striker cadence classGear classKits moments order`: 26/26 passed (includes strikerT2, strikerOrder, strikerKit, classGear, momentsT2, cadenceClassSelection, bot strikerT1)

## Not done, or unsure
- **T2 resource state is server-only** (a `WeakMap` in `strikerT2.ts`), because `UsesCadence` lives in `shared/src/components/` (outside my paths). The HUD strip (shine/edge/Momentum, Wave 2) needs `lit`, `edge`, `momentum` on the networked slice: conductor's call (add three fields to `UsesCadence`, move the state, one-line change in `strikerT2`).
- Feint's crit is a flat multiplier (no crit system exists). Shadowstep (T3) will want the same `critMult` arming.
- Whirlwind has no cast position (bible silent); Charge's cast length and dash range, Pin/Concuss durations, all discipline numbers are placeholders.
- Charge and Pounce start from the mechanic tick (the swing loop only targets what is already in reach). They use the nearest monster in range when no attack target is held; a hand-steered player can be charged at a bystander. Worth a playtest look.
- Verdict executes bosses (the bible doesn't exclude them).
- "Combo break" only costs the resource; the beat counter is not reset by a stun (T1 behaviour kept).
- Spark relics ride the next combo for all disciplines (T1 behaviour); the bible's per-discipline reading ("Spark relics ride its lit beats", Light) is not enforced for Balanced/Heavy.

## Files outside the brief I needed (not edited)
- `shared/src/components/archetypes/cadence/usesCadence.ts` (networked resource fields, see above).
- `server/src/systems/world/movement.ts` (a proper speed layer for Close In).
