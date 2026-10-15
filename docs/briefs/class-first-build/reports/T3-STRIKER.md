# T3-STRIKER report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t3-striker   **Last commit:** e00320be (code commit; this report follows)

## Status table (every T3 item, bible §12.6, §12.8, §12.16)

Status before my work was `missing` for everything below except the rank params already in the kit. All numbers are PLACEHOLDERS (kit `params` or named constants in `strikerT2.ts` / `strikerT3.ts`).

### Specializations (§12.6)
| Item | Now | Notes |
|---|---|---|
| Thousand Cuts (Light) | wired | A lit beat multiplies its on-hit damage by 2 (`ctx.metadata.onHitDamageMult`). **Stand-in:** "on-hit" is the on-hit damage stat; proc listeners (burn, Effigy...) are not re-fired. |
| Afterimage (Light) | wired | Each swing beat holds back 40% of its damage (a per-slash pool); the finisher replays every slash as its own hit (no on-hit, no reservoir feed), then the relic's twist. A break empties the pool. |
| Afterglow (Light) | wired | The lit finisher gets the shine's +25%. A break no longer puts the shine out; it fades at the next finisher ("one combo more"). **Reading is mine:** with the perpetual chain the shine otherwise has nothing to "last longer" over. |
| Iaido (Balanced) | wired | A cast beat raises the edge 2 extra steps; a damage technique that is a cast (Charge, Earthsplitter) cuts with double the edge. Name still "to rename" in the bible. |
| Tempered (Balanced) | wired | Finisher leaves half the peak edge; a stun/idle/walk still resets it. |
| Cascade (Balanced) | wired | Each damage technique raises the edge 1 extra step. (Tentative in the bible.) |
| Subjugator (Heavy) | wired | A control technique counts as two soft beats of Momentum, then multiplies as the setup it is; the finisher is +75% against a slowed/rooted/stunned/chilled/frozen target (`monsterIsHeld`). The "double" reading is mine. |
| Frenzy (Heavy) | wired | From the 2nd finisher of a fight on, the finisher re-arms once at 60% (full path: weight twist, sparks, strikes); only one extra, then the combo restarts. The fight resets after 3 s with no swing. "As the fight goes on" = a finisher count, mine. |
| Crescendo (Heavy) | wired / stand-in | Momentum has no cap, and every swing spent while the player's `holdFinisher` rule holds the finisher builds +0.25, so Momentum carries across what would have been several combos; the release spends it all. **Stand-ins:** the release rule is the player's existing `holdFinisher` conditions (hold while NOT X); there is no "target staggered" moment (see below); a break still drains Momentum. (Tentative in the bible.) |

### Techniques (§12.16 T3)
| Item | Now | Notes |
|---|---|---|
| Earthsplitter (windup cast) | wired | Cast on the cast machine; the slam hits everything within 60 px of a 300 px line from you through the target for 1.5 x attack, with the beat's layers (discipline, weapon, price) built here since a cast does not swing. |
| Upheaval (control, sidegrade of Concuss) | wired | Knockdown = a 1 s stun on the target and every enemy within 70 px; control-immune refuse; evade blocks it. |
| Hemorrhage (sidegrade of Rend) | wired | Same bleed record as Rend, 10 ticks of 25%; strongest wins. |
| Triple Cut | wired | Two extra cuts at 50% of the swing; the beat's on-hit x3. |
| Shadowstep (opener cast) | wired | Steps behind the target (reposition through it) and arms Feint's flat crit multiplier. |
| Icebreaker | wired | +100% against `enemyBarrier` or a Shell Up shell. No freeze consumed. |
| Overheat (opener cast) | wired / stand-in | Haste 60% and +25% damage taken until the finisher, **riding the existing `striker-focus` status** (one opener per combo), so no new status id and no audit gap. The buff tile relabels to "Overheat" when it carries damage taken. Task 2 may split it into its own id. |

### Trophies
| Item | Now | Notes |
|---|---|---|
| Skyfall III (shorter wind-up) | wired | Rank param already in the kit; test pins it. |
| Sunder III (longer) | wired | Same; behavioural test. |
| Festering Cut III | wired | Same; kit-param test. |
| Pounce II (landing hits enemies around) | wired | New rank params `landingRadius` 110, `landingPct` 0.5. |
| Verdict II (higher threshold) | wired | New rank param `thresholdPct` 0.25 (rank 1: 0.15). |
| Hoarfrost (Tundra spark, new) | wired | Each beat adds 10% to the target's slow, up to 50%, 3 s; control-immune bosses ignore it; evade blocks it. |
| Eruption (Volcanic weight, new) | wired | Finisher +50% against a shell, and 80% of it on everything within 120 px. |

### Gear jobs (T3 new: Tundra, Volcanic; moved jobs already existed)
| Item | Now | Notes |
|---|---|---|
| Rimeblade | wired | `striker.cold-pct` T3 0.25 / T4 0.312: every beat and the finisher against a slowed, rooted, chilled or frozen target (not mere stun). |
| Bloodfire Axe | wired | `striker.low-hp-pct` T3 0.5 / T4 0.625: up to +50% as your HP runs out (linear). |
| Winter Coat | wired | `striker.chill-build-cut-pct` T3 0.4 / T4 0.5: while attacking, the tundra-chill ramp accumulator is drained by that share of each tick (done from the Striker tick; `nodeFeatures.ts` untouched). |
| Frostbite Mend | wired | `striker.chilled-recovery-x` 2: while Chill stacks, a slow, frost-ramp or dot-chill is on you. |
| Cinderskin | wired | `striker.heat-ward` 1: while attacking, the Heat status's `damageTakenPct` is parked at 0 and handed back when you stop (also if the line comes off). Only the Heat's, not Overheat's. |
| Fuel | wired | `striker.heat-recovery-pct` T3 0.05 / T4 0.0625: Recovery x (1 + that per stack of Heat). |
| Forest jobs to Jungle, Plains jobs to Volcanic | wired (already) | The gear file already had them; classGear tests pass. |
| T4-new jobs (Reaper's Scythe, Exploit, Deathward, Requiem, Clear Mind, Brine Mend) | not done | T4 scope; their `effects` stay `{}`. |

## Done
- `shared/src/classKits/striker/kit.ts`: params for the seven T3 techniques, rank params (Pounce II, Verdict II), params for Hoarfrost and Eruption.
- `shared/src/passives.ts`, `shared/src/data/mechanicLabels.ts`, `shared/src/data/classGear/striker.ts`: six `striker.*` keys, labels, effects on the T3 and T4 entries of the six new jobs.
- `server/src/systems/classes/archetypes/cadence/`: new `strikerT3.ts` (specialization lookup, constants, Tundra/Volcanic gear tick, shell and cold helpers); `strikerT2.ts` (the resource hooks the specializations bend, new state); `order.ts` (beats, casts, trophies, finisher, Overheat on the Focus status); `index.ts` (tick).
- `server/test/strikerT3.test.ts`: 27 blocks.

## Checks
- pnpm typecheck: clean
- `pnpm test -- striker cadence classGear classKits order moments classFirst statusRegistry`: 30/30 passed (includes strikerT3, strikerT2, strikerOrder, strikerGear, statusRegistry, classFirstTree, bot strikerT1/T2)

## Not done, or unsure
- **No "staggered" moment.** Crescendo's release example "the target staggered" has no moment in `moments.ts` (`target-frozen` is the nearest; `target-shielded` and `target-low` exist). Needs the conductor if wanted.
- Thousand Cuts / Triple Cut multiply the on-hit *damage stat* only, not proc listeners (stand-in above).
- Overheat shares the Focus status id and its client entries (see above); Task 2 can split it.
- Earthsplitter has no HUD callout/visual; it casts like Coil (no event or FX added).
- Pre-existing, not touched: T1/T2 debuff handlers (Hamstring, Concuss, Pin, Rend) do not early-return on `evadeBlocksDebuffs(ctx)` as CLAUDE.md asks (the handler now receives `ctx`, so it is a one-line fix each). My new debuff appliers (Upheaval, Hemorrhage, Hoarfrost) do.
- The new T3 state (held slashes, fight finisher count, second-finisher flag) is server-only, like the T2 resources; the HUD can't show Afterimage's held slashes or the Frenzy arming yet (Task 2 would add networked fields the minimal way).
- Frenzy's second finisher re-runs the whole finisher path, so a cast-finisher trophy (Skyfall) casts twice; a playtest question.
- Rimeblade/Bloodfire apply to every beat and finisher but not to cast-beat slams other than Earthsplitter (which includes them).

## Files outside the brief I needed (not edited)
- `shared/src/components/combat/buffs.ts` / `client/src/hud/statusHelp.ts` / `client/src/ui/conceptIcons.ts` (a separate Overheat status id would need them; avoided by reusing `striker-focus`).
- `server/src/systems/combat/moments/` (a "staggered" moment, if Crescendo should read one).
