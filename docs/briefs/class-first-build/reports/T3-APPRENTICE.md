# T3-APPRENTICE report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t3-apprentice   **Last commit:** see `git log -1` (report committed with it)
## Done
Status of every T3 item (bible §9.6, §9.8, §9.16). Before this task none of these ran; the kit had them as data only (T3 pieces had no params, the trophies' T3 ranks no numbers).

| Item | Status | Notes |
|---|---|---|
| Specialization pick read | wired | `Payoffs.specialization` = `usesSkills.specializationId`, only when it sits under the picked discipline |
| Carrier (Poison) | wired | every enemy within `radius` catches a sigil each `everyMs` |
| Ripening (Poison) | wired | per-sigil age list per sigil status (ages advance in `updateApprenticeT3`), a sigil older than `ripeMs` ticks `ripeMult`x (the status carries the average); the plague's pass (and a dying carrier's) hands over its ripest age |
| Wasting (Poison) | wired | a carrier at the cap keeps Wither's status refreshed (needs Wither, which the Poison pick teaches) |
| Afterburn (Fire) | wired | `detonate` lays `keepShare` of the spent sigils back on a surviving target |
| Long Fuse (Fire) | wired | every detonation arms the Fuse timer (`fuseMs`) instead of going off; the blow is computed at expiry, chain links and Signal Fire go off immediately inside it |
| Hair Trigger (Fire) | wired | a chain neighbour that carried sigils before the burn goes off even if not filled |
| Ice Tomb (Frost) | wired | Seize/Creeping freeze and a boss's Brittle last `tombMs` (6 s); the shatter already ends them |
| Creeping Frost (Frost) | wired | a carrier at the cap freezes (or turns Brittle) once per `everyMs` per target; aborts its cast; keeps its sigils |
| Shardstorm (Frost) | wired | a shatter lays a sigil on the `shards` nearest enemies; a frozen/brittle one shatters too, once per chain |
| Seize II | wired | after a Seize, a new wind-up of the same target inside `catchWindowMs` (after the hold) is broken and held again, no sigils spent; one catch per Seize |
| Seep II | wired | on the surfacing edge its sigils are laid on every enemy within `burstRadius` |
| Spore Burst | wired | piece fires on any moment: spends the target's sigils, half (`share`) onto every enemy within `radius` |
| Snag II | wired | the root also holds enemies within `holdRadius` of the snagged one |
| Signal Fire | wired | rider on a top-level detonation (Detonate, Blast Back, Fuse blow): the furthest carrier from you goes off too, once per chain |
| Melt | wired, stand-in | see below |
| Cinderfall | wired | `detonate` with a splash: everything within `radius` takes `share` of the blast |
| Petrify III, Glut III, Brood Sigils III, Scent II, Dune Wind II | wired, stand-in | the bible names the ranks without a twist; each got a PLACEHOLDER param in the kit (longer hold 2x, drain radius 480, a sigil every 1 s, Scent tick 2x, Spread passes to one more enemy) so the rank is not dead |
| Frostheart (Tundra trophy) | wired | every Seize leaves its target Brittle when the hold ends (`brittleMs`/`brittlePct`; rank 2 longer, PLACEHOLDER) |
| Magma Core (Volcanic trophy) | wired | sigils on a shelled (Shell Up) or barriered enemy tick through DR and DoT resistance (`magma` flag on the sigil status, read in `classDotTickDamage`); rank 2 `shellTickMult` 1.25 (PLACEHOLDER) |
| Glacial Wand | wired | `apprentice.chill-linger` 2: sigils laid on a slowed/chilled enemy last twice as long (T3 and T4 copies filled) |
| Magma Censer | wired | `apprentice.heat-tick` 0.02 per stack of `volcanic-heat` on you (T3 and T4 copies filled) |
| Ice Veil | wired, stand-in | `apprentice.ice-veil`: carriers within 260 px are numbed (the Numb slow at their sigil count, sigils kept) when the Chill threshold is crossed |
| Cold Comfort | wired | `apprentice.cold-comfort` 2: Recovery doubles while a carrier is frozen or Brittle (via the Recovery factor) |
| Ashguard | wired, stand-in | `apprentice.ashguard`: a hit from a fire attacker lays a sigil on it |
| Banked Coals | wired | `apprentice.banked-coals` 0.02: Recovery x(1 + Heat x value) while 3+ enemies carry your sigils |
| Moved jobs (Forest to Jungle, Plains to Volcanic) | already in the gear file (T2 wave) | not touched |

Files: new `server/src/systems/classes/archetypes/dot/sigilsT3.ts`; edits to `sigils.ts`, `sigilsT2.ts` (detonate, freeze, snag, plague, seep hooks), `tickDamage.ts`, `constants.ts`; kit params in `shared/src/classKits/apprentice/kit.ts`; gear in `shared/src/data/classGear/apprentice.ts`; keys in `shared/src/passives.ts` and `shared/src/data/mechanicLabels.ts`; test `server/test/apprenticeT3.test.ts`.

## Checks
- pnpm typecheck: clean
- pnpm test -- apprentice classKits classGear dot sigil momentsT2 passives mechanicLabels statusRegistry: 24/24 passed (includes `apprenticeT3`, `apprenticeT2`, `apprenticeSigils`, `classGear`, `statusRegistry`)

## Not done, or unsure
- **`chill-threshold` is not a live moment** (conductor, `moments/`). Melt and Ice Veil read the Chill locally: the `tundra-chill` stacks on you crossing `CHILL_THRESHOLD` = 3 of 6 (PLACEHOLDER, in `sigilsT3.ts`); Melt fires from that edge when a rule sits on `chill-threshold` (rule conditions and cooldown honoured). When the moment is implemented, replace `watchChill`'s edge with `momentActive`/`recordMoment` and the threshold with the moment's.
- **`fire-attack` is not a live moment** either. Ashguard reads the attacker's definition (`attackStyle` contains `fire`, or a `burn` debuff).
- **Melt only fires from the local edge**, not the generic placement loop (the moment reads false there), so it cannot be dropped on another moment.
- Ripening: sigils are one status with stacks, so ages are a side list in a WeakMap, FIFO (when the cap or a spend removes stacks the oldest go). The extra damage is applied as an average `damagePerStack` refreshed each tick, so it lags one tick after a lay.
- Long Fuse delays Blast Back's damage too (its charge-stop and knockback stay immediate). Signal Fire also rides a Fuse blow.
- Wasting needs Wither (the Poison pick teaches it); it only keeps the status alive while a bar is full.
- Creeping Frost holds for the Seize piece's hold figures (500 + 150/sigil, capped 2.5 s) even without owning Seize.
- Magma Core's "shell" is Shell Up (`shelled`) or a live enemy barrier; sigils already ignored Shell Up's direct-damage cut, so the visible change is bypassing DR and DoT resistance there.
- Out of scope, unchanged: T4 leaves, Spread II, Cinderfall II (Heat widening), Recoil II, Frostcrack, Pyre, Transference, Charnel Rod, Abyssal Censer, Gravewrap, Last Rites, Deep Ward, Tidal Draw. Their gear entries still have empty `{}` effects (T4 jobs).
- Carry-over from T2 still open: **Numb II (longer wind-ups) and Siphon II (wash a poison/bleed/Corrosion off you) have no runtime**, nor does Spread II (T4). They are T2 items; I did not touch them. Default Payoff rules (`configs/apprentice.ts`) still place no T2/T3 pieces; Spore Burst, Cinderfall and Melt only fire once a player (or the file) places them.
- Placeholders: every T3 number lives in kit `params` (piece, specialization or trophy) or at the top of `sigilsT3.ts`; gear values `chill-linger` 2 (bible: twice as long), `heat-tick` 0.02, `ice-veil` 1, `cold-comfort` 2 (bible: doubles), `ashguard` 1, `banked-coals` 0.02.
- No browser/bot test; wiring tests only.

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/moments/` (`chill-threshold` and `fire-attack` readings)
- `shared/src/classKits/configs/apprentice.ts` (default placements for T2/T3 pieces)
