# T3-SLINGER report
**Agent:** Claude (Sonnet)   **Branch:** rw/t3-slinger   **Last commit:** see `git log -1` (the report is committed on top of the code)

## Status table (bible §10.6, §10.16 T3)

Before: kit data complete; runtime did T1 and T2. Nothing in this table executed except where noted. Every number is a PLACEHOLDER (kit params, `slinger/tuning.ts`, gear values).

| Item | Before | Now | Notes |
|---|---|---|---|
| **Fan the Hammer** | missing | wired | after each reload, a haste status (`slinger-fan-the-hammer`, +200% cadence) for the first 6 rounds (3 per gun), ended on round 6, on the last round, or when a reload starts |
| **Crossfire** | missing | wired | the other gun's round on the same target within 1.5 s scales both clips' effect numbers x1.5 (slow, poison, shove, nicks, shred, chill, burn); damage not scaled |
| **Gun Kata** | missing | wired / stand-in | within 160 px rounds hit x1.8; within 90 px ("melee") the round also fires the other gun's clip as a second hit with its effect. The bible's "armor answer" for doubled damage taken is not built (it is a gear question) |
| **Deathmark** | missing | wired | rounds mark the enemy hit (`slinger-deathmark`, one per enemy, renewed not stacked); the reload's shell bursts on every marked enemy (70% of the bank each, still made of the dominant clip); no marks left, it falls where the last round did |
| **Entrenched** | missing | wired | standing still ramps (8 s to the cap): fire-rate haste status (`slinger-entrenched`, up to +50%) and the shell up to +75%; moving resets; the stationary reload counts as standing |
| **Rolling Fire** | missing | wired | a small shell every 3 rounds and on the last round; the reload carries none |
| **Ricochet** | missing | wired | the called shot bounces to 2 more enemies picked by the called-shot rule (excluding those already hit), each taking 70% and the trophy's twist. Hunter's / Bounty act in the hit itself, so a bounce does not repeat them (stand-in) |
| **Pierce** | missing | wired | every enemy between you and the target takes the shot in full plus the trophy's twist (same Hunter's / Bounty stand-in) |
| **Deadeye** | missing | wired | the last round waits (the reload gate cancels the attack, clip paused) until the rule's moment (enemy winds up, elite in reach, target below a third) or 4 s; held, it hits x1.6 more |
| Stopping II | missing | wired | a charger hit by a Stopping round is stopped and stunned (staggered), skipped for control-immune bosses |
| Seeker | missing | wired / stand-in | with it loaded (either gun) a burrowed / hidden target inside reach becomes targetable (same seam as Tracer); a round on a concealed target does 70% of its damage. Covers `isConcealed` (burrow, stealth); "dived" is the same marker |
| Acid | missing | wired | each round eats plating via the shared `plating-shred` record: 8% of plating per round in a row, capped at 60% |
| Tracer II | missing | wired / stand-in | a traced target that is getting away (boss escape step, or moving off from you) is slowed. "Getting away" is my predicate (`isGettingAway`), no ordinary-monster flee flag exists. Tracer III is T4, not done |
| Tether | missing | wired / stand-in | 3 rounds in a row (2.5 s window) tether a target for 2 s; while tethered and getting away it is rooted. **Stand-in:** no dash/teleport hook exists, so the lock is a short root (refused by control-immune bosses) |
| Frost | missing | wired | rounds add `dot-chill` stacks (cap 5, 4 s), 6% move and 5% attack slow per stack, through the existing chill reconciler; never freezes; the chill marker is removed when the status ends. Frost II (T4) not done |
| Incendiary | missing | wired | new `slinger-burn` status: stacks to 5, 4 s, ticks each second as proc damage (skips plating) from the Slinger's tick; never detonates. Thermite (T4) not done |
| Quake Round III | missing | wired | the blast also stuns (knocks down) target and neighbours |
| Splinter Round III | missing | wired | each splinter splits once more to the nearest enemy not yet struck |
| Rot Round III | missing | wired / stand-in | bible gives no twist; rank 3 raises the rotting share (1.1) |
| Hunter's Round II | missing | wired / stand-in | bible gives no twist; the "harder the farther" rate is 0.3 per 100 px (was 0.2) |
| Bounty Round II | missing | wired | threshold 25% (was 15%) |
| **Rime Round** (Tundra, new) | missing | wired / stand-in | the last round lays a frozen patch (radius 120, 6 s) at the target; enemies on it are slowed 40%. One patch at a time, server-side only: **not visible** on the client |
| **Cinder Round** (Volcanic, new) | missing | wired | the last round sets the target and everything within 140 px burning (2 stacks) |
| Hunting Rifle T3/T4, Long Rifle T3/T4 | empty | wired | T2 effects, reach, clip, reload copied up (PLACEHOLDER; same values, no "stronger" step defined) |
| Lookout / Undergrowth / Glass Duster / Shade T3/T4 | empty | wired | T2 effects copied up |
| **Frostlock Rifle** T3/T4 | empty | wired | `slinger.cold-pct` (+40% vs chilled / slowed / rooted / frozen); clip 5, reload 2200, reach +100 (PLACEHOLDER) |
| **Firebrand Pistol** T3/T4 | empty | wired | `slinger.heat-pct` (+3% per Heat stack, Heat capped at 15 stacks for this); clip 8, reload 1700 (PLACEHOLDER) |
| **Warm Hands** (Tundra armor) | empty | wired | while reloading the Chill on you may fall but not rise |
| **Thaw** (Tundra charm) | empty | wired | Recovery factor x2 while the Chill or any slow is on you |
| **Asbestos Coat** (Volcanic armor) | empty | wired | while reloading, the Heat's share of the incoming amplifier is pre-removed in `onDamageTaken` (the amplifier runs after the class listeners) |
| **Heatsink** (Volcanic charm) | empty | wired | Recovery factor 1 + 0.1 x Heat stacks while no enemy is within 250 px |
| Moved lines (Forest -> Jungle, Plains -> Volcanic) and moved guns (Carbine, Pepperbox) | wired | unchanged | these already carried their effects |

Not touched, out of scope (T4): Rime II, Cinder II, Tracer III, Frost II, Shellbreaker II, Hollow-point II, Thermite, Hallowed, Exploit, Toll / Harpoon rounds, Reaper's Repeater, Pressure Rifle, Hallowed Ground, Vigil, Pressure Suit, Ballast, all T4 leaves. Their gear rows stay empty.

## Done
- `server/src/systems/classes/archetypes/reload/slinger.ts`: the clip-effect chain is now `applyClipEffect` (T1/T2 behaviour unchanged) with the five T3 clips; trophy twists are `applyTrophy`; `calledShotExtras` (Ricochet, Pierce); specialization hooks (Fan, Crossfire, Kata, Deathmark mark, Rolling Fire), the Deadeye gate query, per-tick work (Seeker reveal, Tracer II slow, Tether, Rime, burns, Entrenched, chill marker sweep) and the Tundra / Volcanic gear.
- `reloadPrototype.ts`: the Deadeye hold in the existing `beforeAttack` gate.
- New in `server/src/systems/classes/slinger/`: `burn.ts` (the burn status and its tick), `t3.ts` (getting-away predicate, Seeker, Tether, Tracer II slow, Rime, Fan, Entrenched, Deadeye state); `shell.ts` (Deathmark, Entrenched bonus); `calledShot.ts` (exclude set, Deadeye moment); `tuning.ts` (T3 placeholders).
- Kit data: params for Seeker, Acid, Tether, Frost, Incendiary, the Stopping II and Tracer II ranks and the T3 trophy ranks, Rime and Cinder (`kit.ts`; `slingerKit.test.ts` allow-list widened).
- Gear: `slinger.ts` T3/T4 jobs filled; six new passive keys and labels (`passives.ts`, `mechanicLabels.ts`).
- `server/test/slingerT3.test.ts`: one wiring file covering every row above.

## Checks
- pnpm typecheck: clean
- pnpm test -- slinger loadout classGear classKits mechanicLabel passives reload recovery relic classConfig skillTree: 33/33 passed (includes slingerT2, slingerT3, slingerKit, classGear, bot `slinger-t1`/`slinger-t2` route tests)
- pnpm test -- statusRegistry: FAILS as expected, only on the four new Slinger status ids (no client entries yet, Task 2): `slinger-burn`, `slinger-deathmark`, `slinger-entrenched`, `slinger-fan-the-hammer`. `dot-chill` (Frost) already has entries.
- `git diff --numstat`: no whole-file line-ending changes (all touched files LF).

## Not done, or unsure (conductor's call)
- **New status ids need client entries and icons (Task 2):** `slinger-burn` (player-applied burn on enemies, target tile + help + badge), `slinger-deathmark` (target mark), `slinger-entrenched` and `slinger-fan-the-hammer` (player buffs). Rime Round's frozen ground is server-only scratch with no client drawing; it needs a networked zone or a decision to leave it invisible.
- **Tether is a short root, not a dash/teleport lock** (no hook in the pipeline or `bossPatterns`; I did not touch them). A better version wants a "cannot dash / teleport" check in the boss pattern runner.
- **Incendiary needs its own tick** (the bleed driver's id list is outside my paths, so the burn is ticked from `updateSlinger`, i.e. only while its owner's Loadout tick runs). If the conductor prefers the shared driver, `slinger-burn` can move to `BLEED_EFFECT_IDS` in `combat/damage/bleedIds.ts` in `intensity` mode.
- **Asbestos Coat relies on listener order** (class listeners run before `initPlayerAmplifiers`); the test goes through the real pipeline and would fail if that order changed.
- **Gun Kata's "melee armor answer"** is not built; **Hunting Rifle etc. have no "stronger at T3/T4"** step (copied up).
- Specialization numbers live in `tuning.ts`, not in kit params (the kit test pins discipline params empty and specs had none before).
- Twin guns still derive the second clip (no config field), so Crossfire/Kata pair "the pair you rack" through that derivation.
- No live run; Deadeye's hold is observed as a cancelled attack (the bot and the HUD will see the clip pause).

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/damage/bleedIds.ts` (see Incendiary above).
- `server/src/systems/combat/ai/bossPatterns.ts` / the pipeline (a dash / teleport lock for Tether).
- `shared/src/classKits/configTypes.ts` (a second-gun field, carried over from T2).
