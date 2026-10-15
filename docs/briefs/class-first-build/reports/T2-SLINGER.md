# T2-SLINGER report
**Agent:** Claude (Sonnet)   **Branch:** rw/t2-slinger   **Last commit:** see `git log -1` (the report is committed on top of the code)

## Status table (bible §10.5, §10.8, §10.9, §10.16 T2)

Before: kit data was complete; the runtime did T1 only (Scatter, Snare, Venom, Stopping, Breaching and the five T1 trophies). Nothing T2 executed.

| Item | Before | Now | Notes |
|---|---|---|---|
| Buckshot (sidegrade) | missing | wired | cone of pellets (others in front take a share), harder up close, stops a charging enemy (`chargeRemainingMs` to 0 + `stopEntity`) |
| Snare II | missing | wired | builds faster; at the cap writes `attackSlowPct` on the slow, so the target's attack cadence stretches (**stand-in** for "wind-ups take longer": cadence, not the cast clock) |
| Shellbreaker | missing | wired | doubles damage while the target has a live barrier (`hasStatus.enemyBarrier`). **Stand-in:** doubles the whole hit while a barrier is up, not only the part the barrier absorbs |
| Venom II | missing | wired | rank params (more ticks per round, bigger cap and share) |
| Breaching II | missing | wired | rank param `platingMult` 0 |
| Tracer | missing | wired / stand-in | tags the target (timestamp in the target's scratch, per Slinger, no status id); a traced target that is concealed becomes targetable (`isConcealed.targetable`), which covers hide and ambushers in cover. **Stand-in:** "vanish" (invulnerable) and "break away" (flee) have no hook; Tracer II/III are T3/T4 |
| Hollow-point | missing | wired | harder below half HP |
| Stampede Round II | missing | wired | also stuns (the knockdown) the target and the line, skipped for control-immune bosses |
| Twin Round II | missing | wired | second shot at 100% |
| Rot Round II | missing | wired | bigger share |
| Quake Round II | missing | wired | wider blast, cracks plating through the shared `plating-shred` record |
| Splinter Round II | missing | wired | four splinters |
| Hunter's Round (Jungle) | missing | wired / stand-in | hits harder the farther it flies; never dodged (reuses the dodge exemption a delivered cast gets). **Stand-in:** it never misses any target, not only a fleeing one |
| Bounty Round (Desert) | missing | wired | the last round does at least the target's remaining HP below a threshold (15%, PLACEHOLDER); acts in the hit, not on a kill |
| Hunting Rifle | no effect | wired | `slinger.far-pct` (harder with distance, full at 400 px), reach `attackRange +60`, clip 6, reload 1800 ms (**all PLACEHOLDER**) |
| Long Rifle | no effect | wired / stand-in | reach `attackRange +140`, clip 5, reload 2000 ms (PLACEHOLDER). "Outranges kiters" is only the reach number |
| Lookout (Jungle armor line) | no effect | wired | `slinger.lookout`: the ambusher that springs while you reload (the `ambush` moment) is slowed and traced |
| Undergrowth (Jungle charm line) | no effect | wired | `slinger.undergrowth`: Recovery factor x2 while no enemy has aggro on you |
| Glass Duster (Desert armor line) | no effect | wired | `slinger.damage-pct` and `slinger.reload-faster-pct`. "The base's defense is lower" belongs to the shared Desert base, not this line |
| Shade (Desert charm line) | no effect | wired / stand-in | `slinger.shade`: every 5 s a Sun Mark or `slow` on you ends. Other marks/slows (frost ramp, curses) are not listed |
| Gunslinger: twin guns | missing | wired | smallest clip (-2) and quickest reload (-400 ms), flat; shots alternate gun A (the rule's clip) and gun B; both reload together |
| Siege: the shell | missing | wired | clip +4, reload +900 ms; rounds deal half; every round banks its damage on the Slinger; the reload fires it where the last target stood as an area blast made of the dominant clip (Venom gas, Scatter/Buckshot cluster, Breaching bunker-buster, Snare slow, Stopping shove) |
| Trickshot: called shot | missing | wired | when the last round is next, the attack target becomes the rule's pick (winding up, then elite, then lowest HP; or the player's `calledShot` order) and the round hits x2.2; the old target returns after |
| Rack slots / double loads | wired (kit steps) | unchanged | "four by the end of T2" is already in `RACK_STEPS` |

## Done
- `server/src/systems/classes/archetypes/reload/slinger.ts`: ranked clip and trophy params (`pieceParamsAt` / `trophyParamsAt` through the class context), the T2 clips and trophy twists, the three disciplines, the gear keys; T1 behaviour unchanged.
- New `server/src/systems/classes/slinger/`: `tuning.ts` (discipline numbers), `shell.ts`, `calledShot.ts`, `tracer.ts` (Tracer, Lookout, Shade).
- `reloadPrototype.ts` / `reloadLifecycle.ts`: the discipline's flat clip and reload shifts, Glass Duster's reload cut.
- Kit data: params for Buckshot, Shellbreaker, Tracer, Hollow-point, the Snare/Venom/Breaching rank-ups, the T2 trophy rank-ups and the Jungle and Desert rounds (`kit.ts`; `slingerKit.test.ts` now lets those carry params).
- Gear: Hunting Rifle and Long Rifle (T2), the four Jungle and Desert lines (T2); new passive keys and labels (`passives.ts`, `mechanicLabels.ts`, own block each).
- `server/test/slingerT2.test.ts`: one wiring file covering every row above.

## Checks
- pnpm typecheck: clean
- pnpm test -- slinger loadout classGear classKits statusRegistry mechanicLabel passives: 22/22 passed
- pnpm test -- reload recovery relic classConfig skillTree: 10/10 passed
- `git diff --numstat`: no whole-file line-ending changes (all touched files LF).

## Not done, or unsure (needs the conductor's call)
- **Every number is a PLACEHOLDER** (kit params, `tuning.ts`, the gear values). The bible gives rules and the damage splits, not values.
- **The Slinger's base reach is the root's `+120`.** Hunting Rifle and Long Rifle add reach (`attackRange` in the recipe's `stats`) on top; the real values are the designer's.
- **Twin guns' second clip has no config field** (`LoadoutConfig` has no "second gun" slot and `configTypes.ts` is outside my paths). Gun B is derived: the next clip rule that holds, else the first racked clip of another family, else any other racked clip, else plain. A real field wants a conductor-owned change.
- **Called shot by retargeting.** It sets the attack target at the tick the last round chambers. If the auto-target logic reassigns the target between that tick and the shot, the round goes to the new target (not checked against a live fight). It does not model "past whatever stands in the way" (no shot blockers exist for ranged hits today).
- **Siege's shell fires on `onStart`** (any reload, including a switch or early reload), at the last banked target position. Rolling Fire, Deathmark, Fresh Powder are T3/T4.
- **Shellbreaker II ("a barrier breaks in a few rounds")** is T4 and not done. Tracer II/III, Tether, Seeker and the rest are T3/T4.
- **Hunting Rifle, Long Rifle and the Jungle/Desert lines exist at T3/T4 with empty effects** (the T3/T4 recipe rows); I only filled the T2 rows. Copying the same effects up is mechanical and belongs with the T3/T4 passes.
- Gunslinger's "half the clip each" is the total clip shifted by -2; the HUD ring shows one ring (client UI is out of scope).
- Client UI, icons and bot routes were not touched. `bot/src/routes/slingerT1.test.ts` still passes.

## Files outside the brief I needed (not edited)
- `shared/src/classKits/configTypes.ts` (a field for the twin guns' second clip).
- `server/src/systems/combat/moments/` (the `ambush` moment records no monster id; Lookout finds the ambusher by proximity to the player instead).
