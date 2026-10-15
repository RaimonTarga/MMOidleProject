# G-GEAR-C report
**Agent:** Grok   **Branch:** rw/gear-c   **Last commit:** 5551d691 (this report is the commit after it)

## Done
- Added `movedLines` on all six class gear files. Twelve entries per class, 72 lines. Weapons and the class's own lines are unchanged (33 weapons, 52 lines each).
- Keys, the same on every class: `jungle-vest-t3`, `jungle-vest-t4`, `jungle-charm-t3`, `jungle-charm-t4`, `volcanic-vest-t3`, `volcanic-vest-t4`, `volcanic-charm-t3`, `volcanic-charm-t4`, `graveyard-vest-t4`, `graveyard-charm-t4`, `trench-vest-t4`, `trench-charm-t4`.
- Each entry copies `name`, `text`, and `effects` from that class's line on the origin biome's last tier. Forest and Plains are tier 2. Swamp and Cave are tier 3. T3 and T4 of a receiving biome get the same line. The base's own stats carry the tier.
- The Striker file's example `jungle-vest-t3` used Unbroken's tier-1 effect (`defense.control-duration-cut-pct` 0.25). It is now the Forest tier-2 line (0.312), with the other eleven entries filled in.
- Registration builds one shared `<base>-b` recipe per key, named "<name> II", and puts every class's moved line on it. That is 12 second bases: `jungle-vest-t3-b`, `jungle-vest-t4-b`, `jungle-charm-t3-b`, `jungle-charm-t4-b`, `volcanic-vest-t3-b`, `volcanic-vest-t4-b`, `volcanic-charm-t3-b`, `volcanic-charm-t4-b`, `graveyard-vest-t4-b`, `graveyard-charm-t4-b`, `trench-vest-t4-b`, `trench-charm-t4-b`.

| Class | Jungle vest / charm (Forest T2) | Volcanic vest / charm (Plains T2) | Graveyard vest / charm (Swamp T3) | Trench vest / charm (Cave T3) |
|---|---|---|---|---|
| Striker | Unbroken / Rhythm | Shoulder Through / Grit | Bloodless / Antidote | Weighty / Deep Breath |
| Squire | Turn Aside / Counterbalance | Rampart / Breather | Iron Gut / Purifying Breath | Reforged / Old Guard |
| Apprentice | Give Ground / Numbing Calm | Warding Sigils / Feeding Swarm | Bitter Blood / Bitter Tonic | Sigil Weight / Long Draw |
| Slinger | Quickdraw / Fleet | Elbow Room / Breathing Room | Oilskin / Snake Oil | Hunker / Bivouac |
| Spirit | Slipstream / Clear Sky | Static Skin / Still Air | Sealed Vessel / Petrichor | Ironbound / Capacitor |
| Conduit | Bramble / Sapbark | Shared Plating / Herd | Poison Shift / Bloodtithe | You Tank / Deep Reserve |

Striker and Squire effects change by tier, so those copies use the last origin tier: Striker Unbroken 0.312, Shoulder Through 2.6, Grit 0.188 / 3000 ms, Antidote 4000 ms, Weighty bulk 0.15, Deep Breath 1.5; Squire Purifying Breath 0.75, Reforged fill 0.375, Old Guard 0.15. The other four classes have empty effects on these lines.

## Checks
- pnpm typecheck: clean
- pnpm test -- classGear recipeCurve weaponCurve: 4/4 passed in 6s
  - PASS shared/src/data/classGear/classGear.test.ts — `classGear.test.ts: ok (striker 33w/52l, squire 33w/52l, apprentice 33w/52l, slinger 33w/52l, spirit 33w/52l, conduit 33w/52l)`
  - PASS server/test/classGear.test.ts
  - PASS shared/src/data/recipes/recipeCurve.test.ts
  - PASS shared/src/data/recipes/weaponCurve.test.ts

## Not done, or unsure
- G-GEAR-B's skip table names Forest → Jungle and Plains → Volcanic at T3 only. The brief's key list also requires T4, so T4 carries the same origin line as T3.
- The brief said 36 new `<base>-b` recipes might fail an economy, slot, or recipe-gate test. The registrar creates 12 shared second bases, one per key. The named curve tests passed. No test outside the brief was run, and none was edited.

## Files outside the brief I needed (not edited)
- None. `shared/src/data/recipes/index.ts` already builds the second bases from `movedLines`.
