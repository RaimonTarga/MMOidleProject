# T4-STRIKER report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t4-striker   **Last commit:** 9a6596c5 (code commit; this report follows)

Status before my work was `missing` for everything below except the kit data and the rank params the kit already carried. All numbers are PLACEHOLDERS (kit `params`, or named constants in `strikerLeaves.ts`); the bible gives the shapes, not the figures. The Wasteland is the `graveyard` biome id in the code.

## Status table (bible §12.7, §12.8, §12.16 T4)

### Leaves (§12.7), read from `usesSkills.unlockedSkills` (the Passive Tree pick), only while they belong to the picked discipline
| Item | Now | Notes |
|---|---|---|
| Ghoststep (Light, spike) | wired | A monster hit over 25% of max HP is a full miss (the evasion outcome: DODGE floater, no ailments unless the monster pierces evade); 5 s cooldown. Decided in `onDamageTaken`, so a DoT an `onHit` applier already put on is not undone. |
| Slip Through (Light, swarm) | wired | Deterministic accumulator (no RNG, like evasion): +10% miss chance per enemy on you, capped at 1 in 3. Decided in `onAttack`, so ailments are blocked; re-asserted as a full miss in `onDamageTaken` over a graze. |
| Shake It Off (Light, slow bleed) | wired | Every harmful timed status on you loses its clock twice as fast (extra tick of upkeep). Environmental effects (node features, ground zones) are skipped: the room re-applies them. |
| Read the Blow (Balanced, spike) | wired | Telegraphed hit (`empoweredAttack` or an `abilityName`, the Squire guards' reading) deals half. Mitigation only, no counter. |
| Centered (Balanced, swarm) | wired | Three or more enemies aggroed on you: a fifth less damage. |
| Poise (Balanced, slow bleed) | wired | Below half HP, Recovery x2 (the boost seam). |
| Unbreakable (Heavy, spike) | wired | `afterHit`: a killing monster hit leaves you at 1 HP, once per fight (re-armed when out of combat), and nothing hurts you for 2 s (monster swings are cancelled in `beforeAttack`; DoT ticks pay 0 through `strikerDotFloor`). The window and the spent flag live in `tracksCombat` cooldown/counter, not a status, so no client entries are owed. |
| Immovable (Heavy, swarm) | wired (stun, slow) / **missing (knockback)** | A stun or slow whose source is an ordinary (non-boss) monster is taken off again, in `afterHit` and in the tick, with the stun ward it granted. Bosses still control you. Knockback needs a core hook (see below). |
| Thick Blood (Heavy, slow bleed) | wired | Monster DoT ticks on you are halved, in `strikerDotFloor` (the hook the DoT tick already calls for Bloodless). Only the monster-DoT tick is covered, not other periodic damage. |

### Techniques (§12.8, §12.16)
| Item | Now | Notes |
|---|---|---|
| Avalanche (control, wind-up cast; sidegrade of Earthsplitter) | wired | Winds up, then knocks down (1 s stun) everything within 70 px of a 300 px line through the target, and the Striker charges along the line. Control-immune bosses refuse. No damage of its own (the bible lists it as control). |
| Frostbind (control; sidegrade of Pin) | wired | Roots the target and everything within 100 px for 1.5 s. Control-immune bosses ignore it; evade blocks it. |
| Bloodrush (attack setup; sidegrade of Focus, no cast) | wired | A normal swing beat that puts Focus's haste on you (0.2, a little weaker than Focus's 0.25), until the finisher. Same status id as Focus, one copy, the stronger stays. |
| Coup de Grace (damage) | wired | +100% against a target at or below a third of its HP. |
| Magma Breaker (damage, wind-up cast) | wired | The cast blows 1.5x the beat's swing on the target and everything within 120 px, +50% against a shelled one. Built like Earthsplitter (shared `castBlowBase`). |
| Reaping Arc (damage) | wired | Sweep's shape, wider and deeper: every other enemy within 170 px takes 80% of the swing. |
| Pressure Point (finisher setup) | wired | No extra damage; arms the next finisher on this target for +75%. Spent by the next finisher (a different target gets nothing). |

### Trophies
| Item | Now | Notes |
|---|---|---|
| Skyfall IV | wired | Rank param already in the kit (blowMult 2.5); a kit-param test pins it. |
| Hoarfrost II | wired | New rank params: bigger step (0.15), deeper cap (0.6). Behavioural test. |
| Eruption II | wired | New rank params: radius 140, splash 1.0, shell bonus 0.75. Kit-param test. |
| Pounce III | wired | New rank params: leap bonus 0.75, landing 0.75. Kit-param test. |
| Verdict III | wired | New rank param: threshold 0.35. Behavioural test. |
| Grave Toll (Wasteland spark, new) | wired | Each beat of the next combo +10% per enemy aggroed on you, up to 8. "Every enemy in the fight" is read as enemies on you (party-mates' enemies do not count). Tentative in the bible. |
| Deep Pressure (Trench weight, new) | wired | Finisher up to +100% at a full-HP target, falling to nothing as it dies. |
| Swamp and Cave lineages | wired (already) | They keep working and scaling and simply stop ranking up. |

### Gear jobs (T4 new: Wasteland, Trench; moved jobs already existed)
| Item | Now | Notes |
|---|---|---|
| Reaper's Scythe | wired | `striker.splash-pct` 0.3: every beat and the finisher splash that share to enemies within 100 px of the target. |
| Deathward | wired | `striker.deathward-pct` 0.333: below a quarter of your HP, a third less damage. |
| Requiem | wired | `striker.crowd-recovery-pct` 0.1: Recovery x (1 + 0.1 per enemy on you). |
| Exploit | wired | `striker.debuff-pct` 0.1: beats and the finisher +10% per different debuff on the target (holds, bleeds, DoT, exposure, cracked plating). |
| Clear Mind | wired | `striker.clear-mind`: a stun neither breaks your resource nor interrupts your casts. |
| Brine Mend | wired | `striker.debuff-recovery-pct` 0.1: Recovery x (1 + 0.1 per different harmful status on you). |
| Swamp's jobs to the Wasteland, Cave's to the Trench | wired (already) | In the gear file from T3. |
| Other jobs' T4 step | wired (already) | Every returning job already has its T4 entry; binary jobs stay as they are. |

### Left over from the T3 report
| Item | Now | Notes |
|---|---|---|
| Hamstring, Rend, Concuss, Pin, Armor Break did not early-return on `evadeBlocksDebuffs(ctx)` | wired (fixed) | One line each; the new Frostbind does the same. |
| Magma Breaker and Avalanche vs the weapon layers | wired | Magma Breaker carries Rimeblade, Bloodfire and Exploit like Earthsplitter. |
| No "staggered" moment for Crescendo's release | stand-in (design call, conductor) | Unchanged. |
| Thousand Cuts / Triple Cut multiply the on-hit stat only | stand-in | Unchanged. |
| Frenzy's second finisher re-runs the whole finisher path (a cast finisher casts twice) | stand-in (playtest question) | Unchanged. |

## Done
- `shared/src/classKits/striker/kit.ts`: params for the seven T4 techniques, the Grave Toll and Deep Pressure params, rank params for Pounce III, Verdict III, Hoarfrost II, Eruption II.
- `shared/src/passives.ts`, `shared/src/data/mechanicLabels.ts`, `shared/src/data/classGear/striker.ts`: six `striker.*` keys, labels, effects on the Reaper's Scythe, Exploit, Deathward, Requiem, Clear Mind and Brine Mend entries.
- `server/src/systems/classes/archetypes/cadence/`: new `strikerLeaves.ts` (the pick lookup and every leaf number) and `strikerT4.ts` (the leaf listeners, the upkeep, Deathward, Requiem, Brine Mend); `order.ts` (the seven techniques, the two trophies, Pressure Point on the finisher, Clear Mind on casts, the evade early-returns); `strikerGear.ts` (Reaper's Scythe, the leaves' DoT share); `strikerT3.ts` (Exploit, `enemiesOnPlayer`, `monsterDebuffCount`); `strikerT2.ts` (Pressure Point state, Clear Mind); registered in `cadencePrototype.ts` and `index.ts`.
- `server/test/strikerT4.test.ts`: 24 blocks.

## Checks
- pnpm typecheck: clean
- `pnpm test -- striker cadence classGear classKits statusRegistry classFirst mechanicLabel passive moments orderView`: 32/32 passed (includes strikerT4, strikerT3, strikerT2, strikerOrder, strikerGear, statusRegistry, classFirstTree, classGear, mechanicLabels, strikerKit, bot strikerT1/T2/T3)

## Not done, or unsure
- **Immovable's knockback (missing, needs a core hook).** Every push goes through `playerForcedMovementResistPct(player, world)` in `systems/combat/damage/knockback.ts`, which sees only an anchor point, not the source, so it cannot tell an ordinary mob from a boss. The smallest honest fix is for `applyForcedMovement`/`pushPlayer` to pass the source monster (or an `ordinary` flag) and for `playerForcedMovementResistPct` to return 1 for a Striker with the leaf when the source is not a boss (`strikerLeaf(player, IMMOVABLE)`). The conductor owns that file; I did not edit it.
- Ghoststep and Slip Through block the ailments a hit's riders apply, but an `onHit` applier that already ran (monster DoT onto a player) is decided before Ghoststep's damage check. Slip Through decides in `onAttack` and so blocks them.
- Read the Blow's "aimed at you" is not separated from area telegraphs: any telegraphed hit that reaches you is halved.
- Thick Blood, Unbreakable's window and Shake It Off cover monster DoTs and statuses only; other periodic damage (ground zones that tick HP directly) is not touched.
- Unbreakable and Ghoststep have no HUD or client entries (no new status ids were added, so `statusRegistry` is unaffected); Task 2 may want a callout.
- Bloodrush shares the Focus status and tile ("Focus"); Task 2 may rename the tile when it is Bloodrush.
- Grave Toll counts enemies on you, not the whole fight in a party.
- Exploit counts distinct debuffs from a local list (holds, bleeds, `dot`, `vulnerability`, `plating-shred`, anything flagged `isDot`); there is no monster-side "is a debuff" authority to reuse.
- Avalanche's cast is a control with no damage; a lone Avalanche in the wind-up slot adds no damage to the combo (by the bible's family).

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/damage/knockback.ts` / `forcedMovement.ts` (Immovable's knockback, above).
