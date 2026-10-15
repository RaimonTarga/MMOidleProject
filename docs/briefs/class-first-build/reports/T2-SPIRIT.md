# T2-SPIRIT report
**Agent:** Claude   **Branch:** rw/t2-spirit   **Last commit:** see `git log -1` (report committed with the code)

## Done
Runtime: `server/src/systems/classes/archetypes/energy/spirit.ts` (storm, disciplines, costs, gear hooks) and the new `spiritT2.ts` (what a fired piece does in the world: Gale, Flare, Dust Devil, Updraft, Hailstorm hail, Ball Lightning orb, Storm Surge wave, Sandstorm ring, the spill). Kit data: `params` for every T2 piece and trophy (placeholders). Gear: `spirit.first-free`, `spirit.reach-x`, `spirit.stormsense`, `spirit.monsoon-x`, `spirit.ranged-cost`, `spirit.oasis-pct` in `passives.ts`, `mechanicLabels.ts` and `classGear/spirit.ts` (Jungle and Desert jobs at every tier they exist, since a job follows you up). Test: `server/test/spiritT2.test.ts`.

### Status table

| Item | Status | Notes |
|---|---|---|
| Overflow: brim not cap, excess arcs into nearest enemies, overflow is shield | wired | storm may rise to 1.5x the bottle; excess decays at a rate proportional to itself and becomes damage on the 2 nearest enemies within 160 px |
| Overflow reach "close" | wired (gate only) | spends need a target within 170 px; where the Spirit stands is auto-combat's |
| Tide: ebb (no spends, fast flow) / surge (no gathering, cheaper spends), ebb to full, surge to floor | wired | |
| Tide: "drift back in the ebb, close in on the surge" | **stand-in** | movement is auto-combat positioning, outside my paths; not implemented |
| Reservoir: much deeper bottle | wired | 2x pips |
| Reservoir: release the whole bank when enough to kill, or at the mark (the Cloudburst band) | wired | "enough" is an estimate that ignores plating |
| Reservoir: "full bank makes you nearly untouchable" | **stand-in** | only the deeper pool; no extra damage reduction |
| Reservoir reach "far" | wired (gate only) | 420 px |
| Ball Lightning / Storm Surge / Cloudburst (discipline pieces) | wired | Storm Surge is automatic at surge start (cost 0, so it never sits in a band) |
| Gale (new, T2 Plains) | wired | knocks back enemies in front (half-plane toward the target), cancels and stuns a charge; skips bosses and control-immune |
| Thunderclap II | wired | the clapped enemy also gets an attack slow (strongest-wins slow record) |
| Hailstorm | wired | hail zone for 3 s, ticks every 0.5 s; enemies with an enemy barrier take double |
| Downpour II | wired | also removes Corrosion (plating shred) and `slow` from you |
| Updraft | wired | moves you to the engine's telegraph escape point; untested against a live telegraph (see below) |
| Flare | **stand-in** | staggers every enemy around you on an `ambush` moment; does not "reveal" a concealed enemy |
| Dust Devil | wired | drags the farthest ranged attacker on you toward you |
| Trophies: Crosswind II (3 enemies), Squall II (discount builds per spend in a row), Marsh Fire II (washes a debuff), Thunderhead II (ignores part of plating on the full-storm spend), Static Web II (longer) | wired | |
| Running Storm (Jungle, rank I) | **stand-in** | "target flees" is read as "target is past normal reach but inside +300 px"; the spend follows it and gains damage per 100 px past reach |
| Sandstorm (Desert, rank I) | wired | slow ring while above the floor; rank II wider (rank II is a T3 boss, wired anyway) |
| Gear: Lurker's Rod, Sirocco Staff, Stormsense, Monsoon, Sandshroud, Oasis | wired | Stormsense and Monsoon read the `ambush` event moment |

## Checks
- pnpm typecheck: clean
- pnpm test -- spirit classKits classGear mechanic: 22/22 passed (spiritT2, spiritStorm, spiritKit, spiritT1 bot route, classGear, mechanicFired among them)

## Not done, or unsure
- All numbers are PLACEHOLDER constants at the top of `spirit.ts` or kit `params` (reach per discipline, spill rate, tide multipliers, hail/orb values, Cloudburst 2.25 attack per pip, Reservoir 2x).
- Needs the conductor's call: Tide's drift and Reservoir's "nearly untouchable" (above); whether Flare should reveal (needs the concealment component, not mine).
- Updraft has no positive test: building a live ground telegraph in a bare World was out of proportion; the negative case (no telegraph, no gust) is tested.
- Dust Devil rank II (root after the drag) is a T3 rank-up but wired: the root is delayed 350 ms because a root cancels a knockback in flight.
- Storm above `energyMax` (Overflow only) could confuse a HUD that assumes `energy <= energyMax`; I did not touch client code.
- Thunderhead III/IV and Marsh Fire III are T3/T4 and not wired.
- Hailstorm, Ball Lightning and Dust Devil's drag run through module-level ephemeral state (`WeakMap` per player in `spiritT2.ts`), not networked; fine for the sim, nothing visual is sent.

## Files outside the brief I needed (not edited)
- Tide's drift needs auto-combat positioning (`server/src/systems/combat/ai/`).
- A real Flare reveal needs the concealment marker logic in combat AI.
