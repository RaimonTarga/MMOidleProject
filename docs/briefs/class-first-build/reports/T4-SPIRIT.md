# T4-SPIRIT report
**Agent:** Claude   **Branch:** rw/t4-spirit   **Last commit:** see `git log -1` (report committed with the code)

## Done
Runtime: `server/src/systems/classes/archetypes/energy/spirit.ts` (leaves, trophy ranks, Stray Bolts, Depth Charge, gear readers, new piece cases) and the new `spiritT4.ts` (Ground Charge, Thunderstorm, Maelstrom, debuff and risen readers, Burn Off / Calm Depths decay). `spiritT2.ts`: Gale gained an `allSides` mode (Dust Wall), the hail can break shells (Sleet). `spiritT3.ts`: Downburst takes its rank. Kit data: `params` for the five T4 pieces, the nine leaves (`spiritLeaf` now accepts `params`), rank params on Thunderhead, Sandstorm, Ice Storm and Pyrocumulus, and params for the Stray Bolts and Depth Charge trophies. Gear: six passive keys in `passives.ts` and `mechanicLabels.ts`; Tempest Staff, Abyssal Lantern, Gravecloth, Wake, Deep Seal and Abyssal Calm now carry effects. Test: `server/test/spiritT4.test.ts`. A leaf is read from `usesSkills.unlockedSkills` (a Passive Tree node of the picked discipline) into `Thresholds.leaves`.

### Status table

| Item | Status | Notes |
|---|---|---|
| Shunt (Overflow, spike) | wired | a hit over a quarter of the current storm goes into the spill: costs nothing, arcs out at the nearest enemies; once per 5 s. Counted on the tick clock (`tickCounter * 100`) |
| Static Field | wired | enemy within the spill radius while past the brim: hit costs 0.667 |
| Burn Off | wired | while past the brim, harmful DoT effects on you run out twice as fast (extra decay on `remainingMs`) |
| Turn of the Tide (Tide, spike) | wired | a hit worth a quarter of max HP (before the storm's absorb) during a surge ends it at once, counts as a turn, flow x2 for 4 s, and a short pull back from the nearest enemy |
| Wading | wired | in the ebb, enemies within 220 px are slowed (like Sandstorm's ring) |
| Cleansing Tide | wired | one debuff off at each turn (surge start and surge end) |
| Dam (Reservoir, spike) | wired | above the floor, a single hit is capped at a quarter of the bottle and the rest is lost |
| Levee | wired | three or more enemies on you (`enemies-near`): hits cost 0.8 |
| Calm Depths | wired | bank full: every harmful effect on you runs out twice as fast |
| Thunderhead IV | wired | the full-storm spend also stuns (control-immune enemies refuse) |
| Running Storm III, Sandstorm III | wired | Running Storm III was already wired at T3; Sandstorm III (no twist in the bible) = the slow x1.5, PLACEHOLDER |
| Ice Storm II | wired | no twist in the bible: the glaze slows x1.5, PLACEHOLDER |
| Pyrocumulus II | wired | no twist in the bible: the burst x1.5, PLACEHOLDER |
| Stray Bolts (Wasteland, new) | wired | each non-calm spend also strikes one random enemy within 700 px of you other than its target, at half the attack |
| Depth Charge (Trench, new) | wired | flow x2 while the target is out of reach; the resurfacing arms the next spend (x2, once per resurfacing) |
| Downburst II | wired | pins every enemy along the line from you through the charger (420 px long, 70 px wide) |
| Sleet (sidegrade of Hailstorm) | wired | a hail with a 50 px footprint on one target; shells (barrier, Ice Armor, shell-up) take x3 |
| Ground Charge | wired (stand-in trigger) | lays one patch (6 s); the first enemy with a live charge near it is thrown back and stunned. Leaps that are not charges (the ambush lunge) do not count |
| Dust Wall (sidegrade of Gale) | wired | Gale in every direction (radius 240, push 150), same charge-stop rule |
| Ash Lightning II | wired | also strikes the enemies within 160 px of the target at half |
| Thunderstorm | wired | 4 s of a random strike every 0.4 s among the enemies within 300 px of you (uses `Math.random`) |
| Maelstrom | wired (see below) | waits for `target-out-of-reach`; surfaces the diver and sets it down 90 px from you. A boss pattern's concealment is ended by zeroing its step timer; a plain concealed monster is un-concealed directly. Control-immune enemies refuse. Invulnerable-only dives are not handled |
| Tempest Staff | wired | area spends hit +10% per enemy in their radius (Chain, Thunderclap, Hailstorm, Ball, Forked, Thunderstorm) |
| Gravecloth | wired | hits from `isRaised` enemies cost half |
| Wake | wired | each risen enemy that appears within 600 px adds 5% of the bottle |
| Abyssal Lantern | wired | +10% per different harmful effect on you |
| Deep Seal | wired | three or more different debuffs: hits cost 0.667 |
| Abyssal Calm | wired | +5% flow per different debuff |
| Passive Tree panel | checked, no change | tier-3 (leaf) nodes are listed by `disciplineId` of the picked discipline; the nine leaves come from the kit |

T3 `missing` items: none were left (Tailwind and Foehn were switched to the real moments in T3W2). Still stand-ins from T3: Spring Tide "the surge spends it all", Insulated (hands back Chill clock), Flash Steam (fire proxy), Obsidian not separately detected.

## Checks
- pnpm typecheck: clean
- pnpm test -- spirit classKits classGear mechanic passives thresholds tutorial statusRegistry skillTree: 32/32 passed (spiritT4, spiritT3, spiritT2, spiritStorm, spiritKit, classGear, mechanicLabels, tutorial among them)
- spiritT4.test.ts run four times alone, stable (Thunderstorm's random pick is asserted on the sum of two enemies' damage).

## Not done, or unsure
- All numbers are PLACEHOLDER: kit `params` (T4 pieces, leaves, rank params), the constants at the top of `spirit.ts`, and the gear values (area +10% per enemy, risen cost 0.5, Wake 5%, Lantern +10%, Deep Seal 0.667, Calm +5%).
- Tide's drift and "pulling back" are still the T2 positioning stand-in; Turn of the Tide only adds a short knock-away.
- Thunderstorm and Stray Bolts use `Math.random` (as ai.ts does); not seeded.
- Pre-existing and not touched: Slipstream (T1, and its moved copies) still has empty `effects`.
- Spend relics (Crosswind, etc.) do not apply to Thunderstorm's, Stray Bolts' or the spill's damage (same as T3's note: they go through the AoE helper).

## Files outside the brief I needed (not edited)
- None. `moments/` already had `target-out-of-reach`, `target-resurfaces` and `charging-at-me`.
