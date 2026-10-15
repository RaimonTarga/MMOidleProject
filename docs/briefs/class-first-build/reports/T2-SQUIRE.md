# T2-SQUIRE report
**Agent:** Claude   **Branch:** rw/t2-squire   **Last commit:** see `git log -1` (report committed with the code)

## Done
Every number below is a PLACEHOLDER in the kit's `params` (bible numbers copied where given: guards and holds cost 1 pip, Parry and Intercept 2, a landed answer refunds about double, hpShare a quarter).

- `shared/src/classKits/squire/kit.ts`: params for the T2 pieces, Parry/Intercept/Unbowed, Last Breath, the three disciplines (the helper now accepts `params`), and rank params for Muster II, Relentless II, Rot-Eater II, Faultline II, Corrode II, Strangler Vine I-III, Executioner's Oath I-III.
- `server/src/systems/classes/archetypes/cooldown/squire.ts`: handlers and listeners for everything in the table; `RESPONSES` handlers now receive the piece rank; extra triggers per rank (Steel Will II also answers `debuff-landed`); Parry is evaluated before Guard when both share a moment.
- `shared/src/passives.ts`, `mechanicLabels.ts`, `data/classGear/squire.ts`: seven new `squire.*` keys (Squire block only), Jungle and Desert weapon, armor and charm effects, filled for T2 and for the later tiers the same jobs recur on (T3, T4).
- `server/test/squireT2.test.ts`: one wiring test file (16 groups).

### Status table (T2 items)

| Item | Status | Notes |
|---|---|---|
| Stand Fast (guard, charge) | wired | clears `chargeRemainingMs`, stops the charger, staggers it; refunds |
| Unshaken (guard, control) | wired | removes hard control and roots, re-syncs the lockout (as Break Free) |
| Splitting Blow (counter, shield) | wired | a real `runPlayerAttack` with `holdEmpoweredAttack`; the onHit hook doubles it on a raised barrier; II breaks the barrier in one blow (sized to barrier + plating + 1) |
| Steel Will II | wired | also removes plating-shred (corrosion) and `slow`; answers `debuff-landed` |
| Earthstamp (hold, burrow) | wired | un-conceals and pulls the burrower to your feet, staggers; II stuns everything around (140 px) |
| Watchful (guard, ambush) | wired | caught in `onDamageTaken` on the first hit after the ambush moment, no cost, 70% cut, fills Resolve; II staggers the ambusher |
| Challenge (hold, ranged) | wired | pulls up to 3 ranged enemies engaged with you; II roots them 1.2 s |
| Parry (Avenger piece) | wired | brace against the threatening melee monster, hit negated (damage 0), countered at once; fails (returns none, leaving Guard) on ground telegraphs, planted charges and ranged attackers |
| Intercept (Bulwark piece) | stand-in | enemies on a threatened ally (party, low HP or under a telegraph) turn on you and you brace with a Guard-style catch. Nothing moves the player in front of the ally |
| Unbowed (Juggernaut piece) | wired | `onDamageTaken`: an untelegraphed blow over a quarter of max HP costs 1 pip and subtracts your plating a second time; refunds |
| Last Breath | wired | at `hp-low` spends the whole bar, heals 10% max HP per pip (30 s lockout) |
| Avenger tilt | wired | answers fill x1.5, plain hits x0.6, a counter (0.5 pip, 40% of a swing) after every landed answer |
| Bulwark tilt | wired | hits x1.25, trickle x2, slam circle +10% per enemy on you (max +60%), the slam turns what it hit onto you |
| Juggernaut tilt | wired | steady fill from base + plating + max HP, hits x0.5, slam x1.8 |
| Muster II | wired | a wave of 3+ joining fills double |
| Relentless II | wired | rank params (chain 30% per slam, up to 2) |
| Rot-Eater II | wired | every `debuff-landed` event fills 0.5 pip |
| Faultline II | wired (direct hit only) | the slam's direct hit on a raised barrier is doubled; the AoE line victims still bypass barriers (as all AoE) |
| Corrode II | wired | stack cap 8 |
| Strangler Vine (Jungle) | wired | pulls everything in a 260 px ring (rank 2: 360, rank 3: 440) to inside the slam before it lands |
| Executioner's Oath (Desert) | wired | the slam arms early with at least 0.5 pip on a target below a third of its HP (II 45%, III 55%) |
| Hooked Glaive: slam hook | wired | `squire.slam-hook-px`: enemies engaged with you outside the ring are hooked into it |
| Hooked Glaive: longer reach | stand-in | no weapon-reach mechanic exists (attack range is a class root property); needs a conductor-owned hook |
| Throwing Shield | wired | `squire.throw-damage-pct` / `-range-px`: target out of reach but in range, on the weapon's cadence, a lighter `runPlayerAttack` that does not spend the slam |
| Unflinching | wired | first hit after an ambush grants Unyielding for 1.5 s |
| Watchman's Ease | wired | heals the share of the ambush hit Watchful stopped (note: the heal lands before the hit's damage, so it can cap at full HP) |
| Arrow Catcher | wired | `squire.ranged-fill-x` multiplies the Resolve from hits by monsters with reach over 100 |
| Called Out | wired | heals `squire.challenge-heal-pct` of max HP per enemy Challenge pulls |

## Checks
- pnpm typecheck: clean
- pnpm test -- squire classGear classKit mechanicLabel passives moments cooldown gear: 24/24 passed (includes squireT2.test.ts, squireResponses.test.ts, squireGear.test.ts, squireKit.test.ts, momentsT2.test.ts)

## Not done, or unsure
- Intercept: stand-in (above). Challenge does not yet pull "enemies on an ally" (the bible's second trigger), only ranged/kiting enemies; that needs a second moment trigger.
- Hooked Glaive reach (above).
- Parry and Guard share the `telegraph-at-me` event; I made Parry go first via `RESPONSE_PRIORITY` (a deviation from "the rules' order" for that one piece). Designer call.
- Unbowed and Watchful run in the damage listener (the moment is recorded after the hit), so their Resolve is spent at the hit, not on the `big-hit` event.
- Hooked Glaive, Throwing Shield and the Jungle/Desert lines are filled for T3 and T4 as well (same keys, a little stronger per tier) so those items are not dead; the T3/T4 agents can overwrite.
- Disciplines' `params` are placeholders; "slams are rarer" for the Avenger is only the consequence of the counters spending Resolve.

## Files outside the brief I needed (not edited)
- None. (Conductor-owned: `moments/` and the combat pipeline were only read. A weapon-reach mechanic and the "enemies on an ally" Challenge trigger would need them.)
