# T4-APPRENTICE report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t4-apprentice   **Last commit:** see `git log -1` (report committed with it)
## Done
Status of every T4 item (bible §9.7, §9.8, §9.16), plus what T3 left `missing`. Before this task none of the T4 items ran: the kit had them as data only (T4 pieces and trophy ranks without numbers, leaves without params, the Wasteland and Trench gear jobs with empty `{}` effects).

| Item | Status | Notes |
|---|---|---|
| Leaf pick read | wired | `Payoffs.leaf`: the unlocked kit leaf that sits under the picked discipline (a leaf under another discipline reads as no pick) |
| Thick Air (Poison, charger) | wired | an enemy that starts a charge at you (`chargeRemainingMs` edge) gets a full bar and a slow |
| Taint (Poison, ambusher) | wired | an ambusher's first hit is halved (`lessPct`) and it catches a full bar; shares the "first hit" ledger with Second Skin |
| Windborne (Poison, shooter) | wired | a ranged hit on you lays one sigil on the shooter, any distance, while another enemy carries your sigils (once per `everyMs` per shooter) |
| Fire Ward (Fire, charger) | wired | an aggroed melee enemy that newly reaches contact sets off its own sigils and is knocked back (`everyMs` cooldown) |
| Tinderbox (Fire, ambusher) | wired | the `ambush` event sets off your sigils on every carrier within `radius` of you (one chain, `everyMs` cooldown) |
| Smokescreen (Fire, shooter) | wired | enemies a detonation hit (target, splash, chain links) deal `lessPct` less with ranged hits for `ms` (tick-timed) |
| Frozen Step (Frost, charger) | wired | a charge that ends within 180 px of you freezes the charger (Brittle if it accepts no control) |
| Cold Shoulder (Frost, ambusher) | wired | an ambusher's first hit is halved and freezes it |
| Frost Mirror (Frost, shooter) | wired | each ranged hit lays a sigil on the shooter; a full shooter freezes (`everyMs` per shooter) |
| Seize III | wired | Seize cancels the target's fault-line telegraphs (all `fault-line-telegraph` zones it owns, scattered ones too) |
| Frostcrack | wired | Seize (same hold, Frost freeze, Petrify, Seize III) on a shielded or shelled target that also breaks the barrier at once and ends Shell Up; no effect on an unshielded target |
| Spread II | wired | Spread and the Poison plague also reach hiding (concealed / invulnerable) or fleeing enemies within attack range + 48 px, ahead of ordinary neighbours |
| Recoil II | wired | the Recoil caster also suffers the effect: a slow becomes a monster slow, any other mark a `vulnerability` mark (x1.25, PLACEHOLDER mapping) |
| Cinderfall II | wired | blast radius x (1 + Heat steps x `heatWiden` 0.1, PLACEHOLDER) |
| Pyre | wired, stand-in | needs a placement of Pyre (it is bound to the `risen` moment, which is not implemented); a fallen carrier's corpse is burned off the node (it cannot be raised) and its leftover sigils pass on (not under the Poison plague, which already passes them). No damage added |
| Transference | wired | spends the target's sigils, moves the first harmful cleansable debuff on you (slows and marks first) onto it, same mapping as Recoil II; does nothing with no debuff on you |
| Petrify IV | wired, stand-in | the bible names no twist: `holdMult` 2.4 (PLACEHOLDER) |
| Frostheart II | wired | already ran in T3 (`brittleMs` 5000) |
| Scent III | wired, stand-in | no twist in the bible: `tickMult` 2.5 (PLACEHOLDER) |
| Dune Wind III | wired, stand-in | no twist in the bible: `extraNeighbours` 2 (PLACEHOLDER) |
| Magma Core II | wired | already ran in T3 (`shellTickMult` 1.25) |
| Dirge (Wasteland trophy) | wired, stand-in | a top-level Detonate also sets off your sigils on every risen enemy (`isRaised`) carrying them; "risen" read from the component, not the `risen` moment |
| Pressure Fuse (Trench trophy) | wired | a Detonate on an out-of-reach target is held back (sigils stay); when it is back within reach it goes off at `pressureMult` 2 |
| Charnel Rod | wired | `apprentice.charnel`: a hit also lays a sigil on the nearest risen enemy (weapon T4) |
| Gravewrap | wired | `apprentice.gravewrap` 3: a risen enemy carrying your sigils deals 0 to you for 3 s after it is first seen (PLACEHOLDER seconds) |
| Last Rites | wired | `apprentice.last-rites` 0.15 per risen carrier (cap 5), through the Recovery factor |
| Abyssal Censer | wired | `apprentice.abyssal` 0.1 per different debuff on the carrier (cap +50%), read at the sigil tick |
| Deep Ward | wired | `apprentice.deep-ward` 0.2: with 3+ distinct harmful debuffs on you, a full-bar attacker deals 20% less |
| Tidal Draw | wired | `apprentice.tidal-draw` 0.03 of max HP per debuff moved (Transference) or washed off (Siphon II) |
| Moved jobs (Swamp to Wasteland, Cave to Trench) | already in the gear file | not touched |
| **Siphon II** (T2 rank, left open by T3) | wired | washes every poison, bleed and Corrosion off you |
| **Numb II** (T2 rank, left open by T3) | missing | see below |

Files: new `server/src/systems/classes/archetypes/dot/sigilsT4.ts`; edits to `sigils.ts` (Payoffs.leaf, `seize` extracted and exported, Siphon II, Spread II, Last Rites, T4 hooks), `sigilsT2.ts` (Detonate hooks, Recoil II, ambusher first hit, shell on the `target-shielded` moment, `passOn` exported), `sigilsT3.ts` (Cinderfall II, T4 dispatch), `tickDamage.ts`, `constants.ts`; kit params in `shared/src/classKits/apprentice/kit.ts` (the `leaf()` helper now takes params); gear in `shared/src/data/classGear/apprentice.ts`; keys in `shared/src/passives.ts` and `shared/src/data/mechanicLabels.ts`; test `server/test/apprenticeT4.test.ts`.

## Checks
- pnpm typecheck: clean
- pnpm test -- apprentice classKits classGear dot sigil momentsT passives mechanicLabels statusRegistry payoffs: 27/27 passed (includes `apprenticeT4`, `apprenticeT3`, `apprenticeT2`, `apprenticeSigils`, `classGear`, `statusRegistry`, the kit and bot route tests)

## Not done, or unsure
- **Numb II (a numbed enemy's wind-ups take longer) has no runtime.** Monster slows only lengthen attack cooldowns (`monsterAttackCooldownMult`); extending a wind-up needs a core hook (the cast end, the telegraph's `resolvesAtMs` and the ability cast all have to move together). Conductor's call (`engine/monsterMechanics.ts`, `world/groundZones.ts`).
- **`risen` is not a live moment** (conductor, `moments/`). Pyre, Dirge, Charnel Rod, Gravewrap and Last Rites read `monster.isRaised`. Pyre still needs a placement (any moment) in the Payoff rules to be active, like Seep; the default config places none of the T2 to T4 pieces (carried over, unchanged).
- **`target-shielded` reads only a barrier.** Frostcrack's "shelled" half works through a local widening of `momentHolds` in `sigilsT2.ts` (Shell Up counts too). Moving this into the moment (and exporting `crackShell`-like helpers from `shellUp.ts`) is the conductor's: Frostcrack ends a shell by writing Shell Up's private counter key `shellUpEndsAt` (the shell system then reopens the monster itself), duplicated as a constant in `sigilsT4.ts`.
- Frostcrack breaks a barrier by draining it through `applyEnemyShield`; the Ice Armor shatter side effects (self-damage, vulnerability, freeze burst) belong to the combat pipeline and do not fire.
- Leaves read per-monster edges: charge start and end from `controlsMonster.chargeRemainingMs`, melee contact from the monster's own attack range, "ranged hit" as `attackRange > 100` (the snapshot's own measure), ambusher as `isAmbusher` (jungle-bush anchor or lunge) for Taint and Cold Shoulder, and the shared `ambush` event for Tinderbox. A leap that is not a `chargeRemainingMs` charge does not trigger Thick Air or Frozen Step.
- Listener-side timers (Smokescreen, Windborne, Frost Mirror, Gravewrap) count world ticks (10 per second), because combat listeners get no `now`.
- Recoil II and Transference translate a player debuff into a monster one with a small mapping (slow to slow, everything else to a x1.25 `vulnerability` mark); the bible does not say how a mark or a curse reads on an enemy. PLACEHOLDER.
- Abyssal Censer counts distinct statuses other sources put on the carrier (not its own buffs); Deep Ward counts distinct harmful statuses on you (the snapshot's `debuffCount` rule).
- Placeholders: every T4 number lives in kit `params` (pieces, leaves, trophy ranks) or at the top of `sigilsT4.ts`; gear values `charnel` 1, `gravewrap` 3 (s), `last-rites` 0.15, `abyssal` 0.1, `deep-ward` 0.2, `tidal-draw` 0.03.
- Pick path: the Passive Tree already lists the nine leaves as tier-3 nodes under their discipline (`classFirst.ts`); `unlockSkill` records the id in `unlockedSkills`, which is what the runtime reads. No panel change made.
- No browser/bot test; wiring tests only.

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/moments/` (`risen` moment; `target-shielded` including a shell)
- `server/src/systems/combat/ai/shellUp.ts` (an exported way to open a shell early)
- `server/src/systems/combat/engine/monsterMechanics.ts` (an extend-wind-up hook for Numb II)
- `shared/src/classKits/configs/apprentice.ts` (default placements for T2 to T4 pieces)
