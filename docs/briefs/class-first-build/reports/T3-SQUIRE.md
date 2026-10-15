# T3-SQUIRE report
**Agent:** Claude   **Branch:** rw/t3-squire   **Last commit:** see `git log -1` (report committed with the code)

## Done
Every number below is a PLACEHOLDER in the kit's `params` (bible numbers copied where given).

- `shared/src/classKits/squire/kit.ts`: params for Anchor, Chain Hook, Frostward, Backdraft; Guard II's `secondCatchMs`; rank params for Rot-Eater III, Faultline III (line 320 -> 420), Corrode III; Deep Winter and Kindling params and ranks; params for all nine specializations (the `specialization()` helper now accepts `params`).
- `server/src/systems/classes/archetypes/cooldown/squire.ts`: handlers, listeners and per-tick updates for everything in the table; counters now go through one `counterStrike` (Measure for Measure, Sunderer, Second Nature live there); the bar's size is `resolveCap` (budget, Deep Winter, Bastion); the slam arms at the budget, not at the widened bar.
- `shared/src/passives.ts`, `shared/src/data/mechanicLabels.ts` (the labels file is `data/mechanicLabels.ts`), `shared/src/data/classGear/squire.ts`: eight new `squire.*` keys (Squire block only); Glacier Mace, Forge Hammer and the Tundra and Volcanic armor and charm lines filled for T3 and T4.
- `server/test/squireT3.test.ts`: one wiring test file (20 groups).

### Status table (T3 items)

| Item | Status | Notes |
|---|---|---|
| Guard II (second telegraphed blow, same brace) | wired | after a catch the brace stays up `secondCatchMs` and catches and refunds again |
| Anchor (swamp T3; II volcanic T4) | wired, trigger stand-in | reads a charged attack or ability hit with knockback, or a boss `pull` step (Mire Lash, Magma Shove, Undertow) aimed at you, BEFORE it lands, and plants you: a Guard that cuts nothing, `knockbackResistPct` 1, which `playerForcedMovementResistPct` honours. Catching the blow refunds. The planted brace lingers 400 ms after the catch so the push that goes with the blow is resisted (the old Guard listener removed the brace first, so Planted never held against the blow it caught; fixed for both) |
| Anchor II ("even into a hazard") | stand-in | rank 2 does the same as rank 1: resistance is total either way, so a hazard destination makes no difference |
| Chain Hook (jungle T3) | wired, trigger stand-in | target flees or kites (boss escape, or a kiter: same read as the Apprentice's `fleesOrKites`) within 700 px: hooked to your feet |
| Frostward (tundra T3) | wired, trigger stand-in | at 3 stacks of Tundra Chill (the Deep Freeze gate is 4) it holds the Chill at 3 for 4 s, so Deep Freeze never arms; Hearth heals each second while it holds |
| Backdraft (volcanic T3) | wired, trigger stand-in | a counter fired when a blow from a `fire` attack style lands (`attackStyle` contains "fire": melee fire, bite-fire, fire-spit); one per 1.5 s; Cooling Breath heals |
| Challenge II, Earthstamp II, Strangler Vine II, Executioner's Oath II | wired (T2 work) | confirmed owned at T3 by the test |
| Faultline III | wired | line 320 -> 420 px |
| Corrode III | wired | 3 plating per slam, up to 10 stacks |
| Rot-Eater III | wired | DoT fill x1.5, every debuff 0.75 pip |
| Deep Winter (tundra, T3-4) | wired | the bar holds `capMult` (2, III-rank 3) times its size; the slam still arms at the budget, and is sized by how full the bar is when it lands (fill / budget, up to the cap), spending all of it. PLACEHOLDER reading: "overfull" needs the bar to keep filling between the arming and the swing, or a hold rule |
| Kindling (volcanic, T3-4) | wired | every gain (`addResolve`) is multiplied by 1 + 0.1 per 10 s of fight, up to 6 steps (II: 0.15); the fight runs from the first enemy on you to the last |
| Reverb | wired | an echo at half strength, 3 s later, at the slam's circle (also after a Faultline line slam: still a circle) |
| Bastion | wired | each enemy on you is a pip on the cap (a boss as `bossCountsAs`), up to double; the slam spends the budget and leaves the rest for answers |
| Consecrate | wired | the slam's blow lands, then the circle is struck every 0.5 s for 3 s at 25% each, and you are planted (a "held" Guard brace that catches nothing) |
| Measure for Measure | wired | each counter after a catch (Guard, Parry, Watchful, Unbowed) adds 50% of the blow it stopped, capped at 3 swings |
| Second Nature | wired | 4 s after any counter lands (Riposte, Shield Bash, Splitting Blow, Parry, Backdraft, the Avenger follow-up) every answer costs nothing |
| Sunderer | wired | counters ignore the target's plating and hit a raised barrier twice as hard |
| Destroyer | wired | with the slam armed and the target out of reach (up to 450 px) you crash in to half reach; the next swing is the slam |
| Inexorable | wired | the Juggernaut's steady fill runs x5 out of combat and while moving |
| Rampage | wired | each slam adds an `attackHastePct` 0.5 status for 4 s (`squire-rampage`) |
| Glacier Mace | wired | the slam leaves frozen ground (runtime-only list on the Squire, 160/200 px, 3 s) that slows enemies on it |
| Forge Hammer | wired | slam x (1 + 0.02 per stack of Heat on you) |
| Frozen Resolve | wired | each stack of Tundra Chill gained fills 0.2 pip |
| Hearth | wired | 1% max HP per second while Frostward holds |
| Stoked | wired | the Heat's extra-damage share of a hit fills extra Resolve (the share times `squire.heat-fill-x`) |
| Cooling Breath | wired | each Backdraft that lands heals 1% max HP |
| Moved jobs (Forest -> Jungle: Arming Sword, Turn Aside, Counterbalance; Plains -> Volcanic: Flanged Mace, Rampart, Breather) | wired (T2 work) | already carried their keys; the test checks they are non-empty |
| Graveyard and Trench gear (Bone Maul, Pressure Hammer, Grave Plate, Rest Eternal, Abyssal Plate, Brine Will) | missing | T4 content (out of scope); still `{}` |
| Guard III, Faultline IV aftershocks, Lay to Rest, Lie in Wait, Disarm, Charnel Ring, Undertow, Anchor II hazard difference | not done | T4 |

## Checks
- pnpm typecheck: clean
- pnpm test -- squire classGear classKit mechanicLabel passives moments cooldown gear: 26/26 passed (includes squireT3.test.ts, squireT2.test.ts, squireResponses.test.ts, squireGear.test.ts, momentsT2.test.ts, the bot squire routes)
- `pnpm test -- statusRegistry` fails: two NEW Squire status ids have no client tile or icon yet (`squire-frostward`, `squire-rampage`); the other open gaps are other classes' ids from before. T3-W2-SQUIRE closes these with existing icon ids.

## Not done, or unsure
- **Moments the registry does not record (conductor-owned `moments/`):** `drag-or-push`, `chill-threshold`, `fire-attack`, and the ordinary-kiter half of `target-flees` read false there. The Squire reads them itself (`LOCAL_MOMENTS`, `pushOrPullEndsAt`, `fleesOrKites`, and the Backdraft listener) so the pieces work now; the rule editor's condition list for these moments will not see them until the registry implements them. `fire-attack` would need a monster attack-element field (there is only `attackStyle`).
- **A core hook worth adding:** `playerForcedMovementResistPct` (damage/knockback.ts) only honours the Squire's brace by its id and at resist 1. Anchor and Consecrate reuse the `squire-guard` status for that reason (with `hold` and `spent` flags in its data, which the Squire's own Guard listener reads). A neutral "planted" status that the core function reads would be cleaner.
- Re-applying an existing status keeps its old `data` (only the clock refreshes), so the Squire now removes the brace before raising a new one.
- Consecrate and Deep Winter open readings are placeholders (above). The HUD pip dial reads `resolveMax`, which now grows past the budget with Deep Winter and Bastion and changes mid-fight with Bastion; the dial may need to read the budget for the pip count.
- Anchor's lockout is 2.5 s and Frostward's 8 s, so a second push inside the lockout is not answered.
- Graveyard and Trench T4 jobs are still empty (T4).

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/moments/moments.ts` and `fightSnapshot.ts` (the four moments above) and `server/src/systems/combat/damage/knockback.ts` (a neutral planted-status read). None edited.
- Client entries for the new statuses `squire-frostward` and `squire-rampage` (T3-W2): tile descriptor in `squireBuffs.ts`, `statusHelp.ts`, `conceptIcons.ts`. Frostward and Rampage are applied by `squire.ts`; Consecrate and Anchor show as the existing "Braced" tile with 0% cut.
