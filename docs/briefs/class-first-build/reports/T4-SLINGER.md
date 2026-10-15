# T4-SLINGER report
**Agent:** Claude (Sonnet)   **Branch:** rw/t4-slinger   **Last commit:** see `git log -1` (the report is committed on top of the code)

## Status table (bible §10.7, §10.8, §10.16 T4)

Before: kit data complete; runtime did T1 to T3. Every number is a PLACEHOLDER (kit params, `slinger/tuning.ts`, gear values). `wired` = does what the bible says; `stand-in` = does a stated simpler reading; `missing` = not done.

### Leaves (§10.7)

| Item | Before | Now | Notes |
|---|---|---|---|
| **Light Hands** | missing | wired | while reloading, the first hit in each 4 s window deals half (onDamageTaken) |
| **Slip Away** | missing | wired | `touched` moment (an enemy in melee) writes a x1.25 speed layer, read through `regroupSpeedMult` (movement.ts untouched) |
| **Quick Swap** | missing | wired | a switch reload (rule `switchEarly`) records the rounds left; they are added on top of the next full clip (ammo may exceed `ammoMax`) |
| **Bunker** | missing | wired | x0.75 damage taken while reloading |
| **Stakes** | missing | wired | a charging enemy within 90 px is stopped dead and held 0.8 s (held only if it accepts control); once per enemy per 6 s |
| **Fresh Powder** | missing | wired | the shell fires as the clip being loaded (`nextClipId`), not the clip that fed it most |
| **Cool Reload** | missing | wired / stand-in | halves a telegraphed hit while reloading; "telegraphed" is the Squire's reading (`empoweredAttack` or a named ability); boss pattern hits that do not carry those flags are not halved |
| **Steady Nerve** | missing | stand-in | stuns (and every hard control and root) are refused while an enemy is in melee, through the Unyielding status Endure uses. **Knockback is not covered**: the forced-movement resist lives in `knockback.ts` (outside my paths) |
| **Improvise** | missing | wired | a called shot hits x1.33 when the loaded clip does nothing to the target: a control clip on a control-immune target, a damage-over-time clip (Venom, Incendiary, Thermite) on a target with `dotResistance >= 0.9` |

### Clips and ranks (§10.16 T4 table)

| Item | Before | Now | Notes |
|---|---|---|---|
| **Shellbreaker II** | missing | wired | the 3rd round in a row on a target with a barrier does enough to break it in one blow (so Ice Armor shatters through the real pipeline) |
| **Frost II** | missing | wired | 2 chill stacks per round; Ice Armor (ward with shatter, boss `ice-armor` barrier, or a periodic shield with `shatter`) takes the chill x2 more. Judged in `onHit`, before the barrier soaks the round |
| **Tracer III** | missing | wired | rounds on a traced target hit +40% while it is getting away or concealed |
| **Hollow-point II** | missing | wired | the bonus doubles below a third |
| **Thermite** (sidegrade of Incendiary) | missing | wired / stand-in | the same burn; each tick also wears down shells: wards (`monsterWard`) and the periodic enemy shield; ice and obsidian shells lose it x2. The burn is proc damage (skips barriers), so the draining is done in the burn tick. "Obsidian" is judged by ward id `magma-obsidian-shell` or the obsidian-tortoise / magma-salamander types. Mirrors the private `t4EnemyShieldAmount` counter of `monsterMechanics.ts` |
| **Hallowed** (Wasteland, new) | missing | wired / stand-in | risen enemies (`isRaised`) take x2. **"They rise weaker"**: a corpse has no weakness field, so a risen enemy struck by a Hallowed round loses 30% of its attack (once) |
| **Exploit** (Trench, new) | missing | wired / stand-in | +15% per different status on the target (cap 6); every status counts except barriers / wards |

### Trophies

| Item | Before | Now | Notes |
|---|---|---|---|
| Quake Round IV (aftershocks) | missing | wired | the blast repeats twice more at 0.7 s, 35% each, same ground (one set at a time) |
| Rime Round II | missing | wired / stand-in | bible gives no twist: radius 150, slow 55%, 8 s |
| Hunter's Round III | missing | wired / stand-in | no twist: 0.4 per 100 px |
| Bounty Round III | missing | wired / stand-in | no twist: threshold 35% |
| Cinder Round II | missing | wired / stand-in | no twist: radius 180, 3 stacks, 25% |
| **Toll Round** (Wasteland, new) | missing | wired | the last round hits +10% per enemy fighting you (cap 10) |
| **Harpoon Round** (Trench, new) | missing | wired / stand-in | for 4 s the target is held as Tether holds it (a short root whenever it tries to flee, dash, dive or burrow) and traced (so it cannot hide). No hook stops a dive or a burrow outright |

### Gear (Wasteland and Trench jobs; the Swamp's and Cave's jobs already moved with their effects)

| Item | Before | Now | Notes |
|---|---|---|---|
| **Reaper's Repeater** | empty | wired | `slinger.splash-pct` 0.3: each round splashes that share to enemies within 110 px of the target; clip 8, reload 1800 (PLACEHOLDER) |
| **Hallowed Ground** (armor) | empty | wired | `slinger.hallowed-ground` 0.5: risen enemies deal half to you while you reload |
| **Vigil** (charm) | empty | wired | `slinger.vigil` 0.1: Recovery factor 1 + 0.1 x enemies in the fight while none is within 250 px |
| **Pressure Rifle** | empty | wired | `slinger.pressure-pct` 0.5: rounds hit up to +50% at full target HP, less as it falls; clip 6, reload 2000 (PLACEHOLDER) |
| **Pressure Suit** (armor) | empty | wired / stand-in | while reloading the generic `debuff-immune` status (the one the debuff guard already asks about) is refreshed; no debuff lands. **Owes a client entry** (see below) |
| **Ballast** (charm) | empty | wired | `slinger.ballast` 0.1: Recovery factor 1 + 0.1 x different harmful statuses on you |
| Hunting Rifle, Long Rifle, Frostlock, Firebrand, the old jobs | wired | unchanged | no "stronger T4 step" is defined in the bible; the T3 values stay (stand-in, a design call) |

No gear row is empty through T4 (the test checks every weapon and line).

## Done
- `server/src/systems/classes/slinger/t4.ts` (new): leaf pick lookup, fight size, shells (`hasIceArmor`, `eatShells`), Exploit / Ballast debuff counts, Improvise's "does nothing", Hallowed weakening, Quake aftershocks, Light Hands window, Stakes, Steady Nerve, Pressure Suit, the Quick Swap carry key. `stopCharge` moved here from `slinger.ts`.
- `reload/slinger.ts`: the T4 hooks listed above (onHit, afterHit, onDamageTaken, onComplete, `updateSlinger`, `applyClipEffect`, `applyTrophy`); `burn.ts` (Thermite shell drain), `shell.ts` (`fireShell` takes an optional clip for Fresh Powder), `t3.ts` (`tetherFor`, for Harpoon), `tuning.ts` (T4 placeholders).
- Kit data (`classKits/slinger/kit.ts`): params for Shellbreaker II, Frost II, Tracer III, Hollow-point II, Thermite, Hallowed, Exploit and the T4 trophy ranks, Toll and Harpoon; `slingerKit.test.ts` allow-lists widened.
- Gear / passives / labels: six new keys (`slinger.splash-pct`, `pressure-pct`, `hallowed-ground`, `vigil`, `pressure-suit`, `ballast`), the four empty lines and two empty weapons filled.
- `server/test/slingerT4.test.ts`: one wiring file covering every row above (attach, shoot, tick, assert).
- `server/test/slingerT3.test.ts`: `T3_BIOMES` Tundra and Volcanic lowered from 12 to 6 (12 is a T4 level for them; at 12 the T3 test's Frost already owned rank 2 and broke the "one chill per round" assertion).

## Checks
- pnpm typecheck: clean
- pnpm test -- slinger classGear classKits mechanicLabel passives tutorial: 26/26 passed (includes slingerT3, slingerT4, slingerKit, bot `slinger-t1/t2/t3` route tests)
- pnpm test -- slinger loadout classGear classKits mechanicLabel passives reload recovery relic classConfig skillTree statusRegistry buff: 35/37 before the T3 fix; after it only `statusRegistry` fails, as expected (see below)
- `git diff --numstat`: no whole-file line-ending changes (all touched files LF)

## Not done, or unsure (conductor's call)
- **`statusRegistry` fails on one id: `debuff-immune`** (Pressure Suit). It is the debuff guard's existing generic immunity status, no one applied it before. It needs a client entry (tile / label / help / badge / icon), which is T4-W2 work; the T3 precedent was the same. If you would rather not owe it, Pressure Suit can instead strip newly landed harmful statuses each tick (no new id, but debuffs are removed within 100 ms rather than refused).
- **Knockback for Steady Nerve** needs a one-line hook in `playerForcedMovementResistPct` (`combat/damage/knockback.ts`, outside my paths).
- **Harpoon / Tether do not stop a dive, burrow or dash outright**: that needs a "cannot escape" check in the boss pattern runner (`bossPatterns.ts`, a core hook). They root the target when it tries.
- **A barrier soaks a whole round**: when `ctx.damage` is 0 after the barrier absorbs it, no clip effect lands (true for every clip since T1). So Thermite and Frost II work best before the shell goes up or on the round that breaks it; Frost II reads Ice Armor before the round is soaked so the breaking round still counts. If rounds should land their effect through a barrier, that is a pipeline call.
- **Exploit counts every status on the target** (no list of what is a debuff on a monster exists); a monster-side buff status would count. Barriers are excluded.
- **Thermite's periodic-shield drain mirrors a private counter key** (`t4EnemyShieldAmount` in `monsterMechanics.ts`); if that key is renamed the drain silently stops (the ward drain, which covers Obsidian Shell, does not depend on it).
- **Quick Swap lets `ammo` exceed `ammoMax`** for one clip (the ring and HUD were not checked live).
- **The Passive Tree lists the leaves** from the kit (`classFirst.ts` builds them at tier 3, parent = discipline); I read the code, did not open the panel. Leaves are read at runtime from `unlockedSkills` (no discipline check: a leaf is only unlockable under its discipline).
- Tracer III counts "hides" as the `isConcealed` marker (a traced target is kept targetable by Tracer, so rounds can reach it).
- No live run. Bible says "hard to catch, then it commits" for the Jungle; nothing here tunes that.

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/damage/knockback.ts` (Steady Nerve's knockback).
- `server/src/systems/combat/ai/bossPatterns.ts` (Harpoon / Tether outright block).
- `client/` status entries for `debuff-immune` (T4-W2).

## Files outside the brief I edited
- `server/test/slingerT3.test.ts` (two numbers in `T3_BIOMES`, see Done).
