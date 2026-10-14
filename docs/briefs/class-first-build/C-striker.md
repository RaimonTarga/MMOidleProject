# C-striker: the Striker's Tier 1 track (Phase 1, first class)

**Owner:** the conductor (or a Striker Claude session) for CS.1, CS.2 and CS.4; delegates for
CS.3, CS.5 and CS.6 (briefs written when CS.1 lands). **Needs:** M0 (D2, D3, F6, F7 merged).
**Spec:** bible §12 (Locked); the kit `shared/src/classKits/striker/`; the Order config
`shared/src/classKits/configs/striker.ts`. **Why first:** the Striker is the reference class
and its T1 needs the fewest new moments, so it proves the framework end to end (config →
runtime → HUD → screen → tutorial → bot) before five more classes copy the pattern.

## What exists and what it becomes

| Today (`server/src/systems/classes/archetypes/cadence/`) | Becomes |
|---|---|
| `usesCadence` counts hits; at `threshold − 1` the next hit is the empowered finisher (×2) | The **beat counter**: the threshold is the Order's beat count + 1 (5 at T1, 7 / 5 / 4 by discipline); the empowered hit is the **finisher**, whose twist is the equipped trophy |
| `frameLoop.ts` (Flurry / Skirmisher / Breaker windows and banks) | Deleted. Its containers return at T2 as Light's shine and Heavy's Momentum (§12.5, salvage §12.14) |
| `t3/` (nine paths: Swiftblade, Verdict, Rampage, Crescendo, Hemorrhage ...) | Deleted. Ideas recoverable at tag `pre-rework-2026-10-13` (§12.14 lists which) |
| The root's Recovery pulse (`defense.recovery-pulse-*` on `cadence-root`) | Removed (§12.2) |
| Relic ratings reshaping the threshold | Removed: trophies replace relics |
| The ability engine's shapes: armed rider, cast, charge (`server/src/systems/player/abilities/`) | Kept: a technique on a beat is an armed rider on that beat's hit; the opener and wind-up are casts; Charge (T2) is the charge shape |

## The runtime (CS.1)

- **The Order drives the beats.** Each player hit that is not the finisher reads
  `configuresClass.config.system.beats[count]`: null is a plain swing; a technique id runs that
  technique's handler (`STRIKER_TECHNIQUES[pieceId]`) on the hit, after the base damage, and pays
  the **price** (the beat's swing damage × a placeholder 0.7, §12.2) unless that technique is
  mastered (T2+: mastery steps start once every beat is open, `strikerSlots`).
- **Casts take their beat.** A beat whose technique is a cast (`cast: 'opener' | 'windup'`) does
  not swing: in `beforeAttack` the swing is cancelled and the player cast machine starts a
  self-facing cast; the beat counts when the cast resolves. Attack speed never shortens a cast
  (§12.2): the cast reads only `technique.cast-speed-pct`. A stun aborts it (no beat counted).
- **The finisher is the trophy.** The empowered multiplier stays the plain finisher (2.0) until a
  trophy is equipped; then `STRIKER_TROPHIES[trophyId]` adds its twist: **weight** trophies act on
  the finisher hit, **spark** trophies arm the next combo's beats (a combo-scoped status cleared
  when the next finisher lands).
- **State on the archetype slice, not `TracksCombat`:** `usesCadence` gains what the HUD strip
  needs and nothing else (the beat index already exists as `count`; add the combo length and any
  armed spark), networked as today.
- **Tier scaling:** every technique and trophy number is multiplied by `pieceTierScale(tier)`.
- **Smoke test** (`server/test/strikerOrder.test.ts`): a Striker with Sweep on beat 4 hits four
  enemies on that beat and one otherwise; the price applies; a Focus opener casts before beat 1
  and a stun aborts it; the 5th hit is the finisher; equipping Sunder exposes the target on the
  finisher; a Light Striker's combo is 7 beats.

## T1 pieces (CS.2), each on existing machinery where it exists

| Piece | Effect (§12.4) | Built on |
|---|---|---|
| Sweep | the beat also hits every enemy around you | the area helper the Sweep ability used |
| Hamstring | the target attacks and moves slower for a moment (control) | the `ability-slowed` status |
| Rend | a bleed | the player debuff applier (`applyPlayerDebuff`), bleed element |
| Coil (wind-up cast) | the finisher hits much harder | a one-shot finisher multiplier recorded on the slice |
| Focus (opener cast) | the combo swings faster | a combo-scoped attack-speed buff, cleared at the finisher |
| Wide Arc (spark) | next combo's beats each also strike one enemy beside the target | a combo-scoped status read by the beat handler |
| Double Slash (spark) | every beat of the next combo strikes twice, each a bit over half | same, a second hit at ~0.55 |
| Festering Cut (weight) | the finisher's wound rots, dealing part of its damage again | a DoT seeded from the finisher's damage |
| Skyfall (weight) | the finisher becomes a cast: longer wind-up, ~2× blow | the cast machine on the finisher beat |
| Sunder (weight) | Expose: the target takes more damage from everyone for a few seconds | the vulnerability status (`expose-weakness` art) |

Every number is a placeholder in the piece's `params`; the strongest-copy rule (§12.12) applies
to Hamstring and Sunder.

## Gear (CS.3 data, CS.4 runtime)

Six weapons (`classes: ['cadence']`): the Clearing's plain sword, Broadblade, Twin Fangs, Hooked
Sickle, Maul, Bastard Sword (§12.4: tempo, weight and one job each). Ten class lines on the
shared T1 armor and charm bases: Shoulder Through, Unbroken, Bloodless, Braced Cast, Weighty;
Grit, Rhythm, Antidote, Cairnstone, Deep Breath. CS.4 defines the `striker.*` mechanic keys and
reads them (the four defensive rules of §12.10: nothing on your hits or the finisher, nothing
scaling with attack speed). CS.3 enters the data against those keys.

## Screen, HUD, tutorial, bot (CS.5, CS.6: delegates)

- **View model** (conductor): `composeOrderView` in shared: the beats with each technique's icon
  and name, which beats are open, the casts' positions, the finisher (trophy or plain), every
  owned technique with why it can or can't go on a beat, the budget line ("Techniques 2, next at
  Mastery 30").
- **Panel and HUD** (delegate): the Order editor in the class screen shell (F7); the beat strip on
  the HUD (landed, next, to come; icons from `concept-icons/class-pieces/`); callouts only for
  casts and the trophy finisher (§12.2).
- **Tutorial** (delegate): `TUTORIAL_CLASS_BEATS['cadence-root']`: the plain strip, Sweep at the
  Plains (around minute 6), the first finisher from the first boss (§12.4).
- **Bot** (delegate): a `striker-t1` route using the `classConfig` step with the §12.13 defaults.

## Done when

A fresh Striker plays the guided T1 in a real client with the Order working, its techniques and
trophies doing what their cards say, its gear lines live; `strikerOrder.test.ts` and the
technique/trophy tests pass; the bot route reaches both seals.
