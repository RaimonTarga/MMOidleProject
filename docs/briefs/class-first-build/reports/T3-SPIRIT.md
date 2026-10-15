# T3-SPIRIT report
**Agent:** Claude   **Branch:** rw/t3-spirit   **Last commit:** see `git log -1` (report committed with the code)

## Done
Runtime: `server/src/systems/classes/archetypes/energy/spirit.ts` (specializations, trophy ranks, gear readers, Pyrocumulus, new piece cases) and the new `spiritT3.ts` (what the T3 lessons do in the world, the Ice Storm glaze, Stormdancer's blink, the Heat/Chill/fire/shell readers). The specialization is read from `usesSkills.unlockedSkills` (a Passive Tree node of the picked discipline) into `Thresholds.spec`. Kit data: `params` for the five T3 pieces and for the Tundra and Volcanic trophies, rank params on Marsh Fire, Static Web and Running Storm (placeholders). Gear: six new passive keys in `passives.ts` and `mechanicLabels.ts`; the Rime Staff, Ember Rod, Insulated, Aurora, Flash Steam and Thermal entries (T3 and their T4 copies) in `classGear/spirit.ts` now carry effects, so no copy is dead. Test: `server/test/spiritT3.test.ts`.

### Status table

| Item | Status | Notes |
|---|---|---|
| Stormdancer (Overflow) | wired | every 2.5 s while past the brim: blink beside the nearest enemy (not the last one landed on), a share of the excess bursts on up to 6 enemies. Auto-combat positioning may walk the Spirit back between blinks |
| Spillway | wired | a spend made while past the brim sends half the excess to its target as a bolt |
| Lightning Rod | wired | the spill strikes only the target (damage of both arcs together), in reach |
| Spring Tide (Tide) | wired | every third ebb fills to 2x the bottle; the surge then spends down to the floor as usual |
| Spring Tide "the surge spends it all" | **stand-in** | read as "down to the floor", the same as every surge |
| Slack Water | wired (cost half in the ebb) | "you stand your ground" is already true: Tide's drift is a T2 stand-in |
| Breakwater | wired | when a surge ends, a wave over the enemies in front, sized by the pips the surge spent. Storm Surge still opens the surge |
| Gathering Dark (Reservoir) | wired | the release multiplier grows with the seconds the bank has been full, up to 2x at 10 s; the shield does not grow |
| Overcast | wired | the release is split evenly over the target and the enemies within 200 px of it |
| Deep Well | wired | a release spends two thirds of what is above the floor; a third stays |
| Downburst (new, Mountain) | wired | waits for `charging-at-me`, cancels the charge and stuns (pins) the charger; control-immune enemies refuse |
| Updraft II, Dust Devil II (rank-ups) | wired in T2 | verified learned at T3 in the test |
| Tailwind (new, Swamp) | effect wired, **moment missing** | `drag-or-push` is not implemented in `moments/` (conductor's), so the piece never fires live. The effect (carried away from the nearest enemy) is tested by calling it directly |
| Forked Bolt (sidegrade) | wired | the Chain Lightning hit, then the two enemies near the target that are farthest from you |
| Foehn (new, Tundra) | effect wired, **moment missing** | `chill-threshold` is not implemented in `moments/`. The effect (melt 3 Chill steps) is tested directly |
| Ash Lightning (new, Volcanic) | wired | single-target strike, +8% per `volcanic-heat` stack |
| Marsh Fire III | wired | burst x1.5 |
| Thunderhead III (four-fifths counts as full) | wired in T2 | |
| Static Web III | wired | a spend's charge also lands on the nearest other enemy within 90 px of the target |
| Running Storm II | wired | x1.5 on the per-100-px growth (III, x2, also wired though it is T4) |
| Sandstorm II (wider ring) | wired in T2 | |
| Ice Storm (Tundra, new) | wired | every spend glazes a 90 px patch under its target for 5 s (at most 8 at once); enemies on it get a 30% slow; control-immune enemies ignore it |
| Pyrocumulus (Volcanic, new) | wired | at 98% of the bottle, a burst strikes enemies within 160 px every 3 s |
| Rime Staff | wired | `spirit.shell-pct`: +50% on a target with an enemy barrier or retracted in a shell-up. Ice Armor reads as a barrier; Obsidian is **not separately detected** |
| Ember Rod | wired | `spirit.empty-pct`: up to +60% at an empty storm, scaling with how empty |
| Insulated | wired (stand-in method) | `spirit.chill-build`: the room owns the Chill clock (`nodeFeatures.ts`, outside my paths), so each tick a 40% share of what the clock gained is handed back while the storm is above the floor |
| Aurora | wired | +50% flow while any Chill step is on you |
| Flash Steam | wired | `spirit.fire-cost`: hits from volcanic-biome monsters or attack styles containing "fire" drain at half. There is no fire-damage tag in the pipeline, so this is the best proxy; fire DoT ticks are not covered |
| Thermal | wired | +5% flow per Heat step |
| Forest's jobs moved to the Jungle, Plains' to the Volcanic | already in the gear file (movedLines and the T3 weapons) | no change needed; the moved lines keep their working effects |

## Checks
- pnpm typecheck: clean
- pnpm test -- spirit classKits classGear mechanic passives: 24/24 passed (spiritT3, spiritT2, spiritStorm, spiritKit, classGear, mechanicFired among them)
- spiritT3.test.ts run three times alone, stable.

## Not done, or unsure
- All numbers are PLACEHOLDER: kit `params`, or the constants at the top of `spirit.ts` (blink every 2.5 s, burst share, Spillway share, Spring Tide x2 every third tide, Slack Water 0.5, Breakwater per pip, Gathering Dark 10 s to double, Overcast radius, Deep Well a third) and the gear values (shell +50%, empty +60%, chill build -40%, Aurora +50%, Flash Steam 0.5, Thermal +5%).
- Needs the conductor's call: implementing the moments `drag-or-push` and `chill-threshold` (not mine: `moments/`). Until they exist, Tailwind and Foehn are learnable and placeable but inert. Same moments are used by the Squire and Apprentice.
- Pre-existing and not touched: Slipstream (T1/T2, and its moved copies) still has empty `effects`, so it does nothing; it is a T1 job outside this task.
- T4 items not wired (out of scope): Thunderhead IV stagger, Ash Lightning II, Downburst II, Ice Storm II, Pyrocumulus II, Sandstorm III, and the T4 gear jobs (Tempest Staff, Gravecloth, Wake, Abyssal Lantern, Deep Seal, Abyssal Calm).
- Spill/arc damage from Stormdancer, Spillway and Lightning Rod passes through the player AoE helper, so Crosswind and other spend relics do not apply to it (as for the T2 spill).
- Specializations are only recognised if the node is in `unlockedSkills` and belongs to the picked discipline.

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/moments/moments.ts` (`drag-or-push`, `chill-threshold` states/events).
- `server/src/systems/world/nodeFeatures.ts` (a native Chill build-rate hook for Insulated; the stand-in above avoids it).
