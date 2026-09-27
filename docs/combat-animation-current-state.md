# Combat animation (mobs and players) — current state

**Last audited:** 2026-09-28 (branch `feat/premium-mob-animations`).
**Owning source:** `client/src/fx/` (animation modules), `client/src/render/combatFx.ts`
(event dispatch), `client/src/render/monsters.ts`, `server/src/systems/combat/ai/ai.ts`
and `server/src/systems/combat/engine/monsterStateMirror.ts` (presentation state the
server publishes).
**Tests:** `server/test/monsterStyleCoverage.test.ts`, `chargeOnAggroVisual.test.ts`,
`monsterStateMirror.test.ts`, `plainsHawkDiveBomb.test.ts`, `attackProgression.test.ts`.

This page covers the premium animation pass that took the boss-lineage grammar to
ordinary mobs and to player attacks and abilities. Boss animations are documented in
[boss-encounter-rework-current-state.md](boss-encounter-rework-current-state.md) (the
"Premium animation pass" section); the grammar is the same. Everything here is
**presentation only**: no damage, timing or AI decision reads any of it.

## The grammar

Every action should have a readable **wind-up clock** (often drawn over the victim), a
visible **payoff**, a visible **cancel** when a stun stops it, **body motion** through
`fx/bodyPose.ts` (never tween `sprite.scale`), **weight** via `fx/impactFeel.ts`
(Settings-gated; used sparingly on mobs), and a **lasting look** for lasting states via
the aura engine (`fx/bossAuras.ts` + `fx/auraDefs.ts`, rows can target
`on: 'boss' | 'monster' | 'player'` or an array). Mob budget rules: prefer one-shot
tweens, skip bodies off the camera, shake only when the player's own body is involved.

## Mobs

### Presentation state the server publishes

Monster status lists reach the client only while the monster is somebody's target, so
states a player must see *before* clicking are mirrored onto the networked `hasStatus`
slice (absent key = not in that state; never `false`):

| Field | Set when | Writer |
| --- | --- | --- |
| `charging` | a `chargeOnAggro` burst or an engage opener's dash is actually applied this tick | `publishCharging` at the tail of `updateMonsters` (ai.ts), from the set the chase branch boosted |
| `hastedBy {effectId, stacks}` | the strongest `monsterAttackSpeedBuff` status (Howl, Chest Beat, Barrage charges, Screech, boss roars) | `syncMonsterStateMirror` |
| `shelled` | a Snapper is retracted (`isShelled`) | `syncMonsterStateMirror` |
| `primed` | the NEXT attack is empowered (cadence finisher, empowered cooldown within 1.2 s, unspent opening strike, cadence volley); only while aggroed | `syncMonsterStateMirror` via `monsterNextAttackPrimed` (read-only twin of `monsterEmpoweredMultiplier` / `monsterVolleyHits`) |

`syncMonsterStateMirror` runs right after `syncEnemyBarrierState` in the World tick.
Shields and wards needed nothing new: `enemyBarrier` was already on the view.

New event: `monster-engage-land` (contact of an engage opener). Note the engage
opener's `monster-cast-end fired` is sent when the dash **launches**, not on contact.
Shell Up casts now carry `fx: 'shell-up'`.

### What is drawn

| Area | Module | Notes |
| --- | --- | --- |
| Charge-on-aggro burst | `fx/chargeRush.ts` (`charge-rush` aura row) | kick-off lean + dirt, streaks under the body, skid; biome palettes |
| Engage openers | `fx/engageOpeners.ts` | per-animal fx ids: `dive-bomb` (Savanna Hawk, roots), `skyfall-rend` (Stone Eagle), `roc-skyfall` (Cliffside Roc), `savage-rush` (Cave/Cavern Troll), `rime-pounce` (Frost Lurker); wind-up clock, launch, dash (via `charging`), landing, cancel |
| Charged attacks and damaging cast abilities | `fx/mobCastWindups.ts` | dispatched from `monster-cast-start` for non-boss casters by fx id **and** def (`strong-kick` is a slam with `aoe`, pincers in the desert, a hop-kick otherwise). A wind-up registers under `aoe.impactFx ?? fx`, because an area cast-END carries `impactFx` |
| Lasting states | `fx/mobStates.ts` + rows in `fx/auraDefs.ts` | `mob-barrier` (depletes and cracks with the pool; shatters if drained), `mob-shell`, `mob-howl` / `mob-chestbeat` / `mob-barrage` (one quill per charge) / `mob-screech`, `mob-primed` (glint at the head), `rallied` now also reads `hastedBy` |
| Basic attacks | `fx/mobVerbs.ts` | 22 regular mobs moved off the shared `poison` / `impact` styles onto verbs (`sting`, `spider-fang`, `charnel-maul`, `constrict`, `ooze-engulf`, `tongue-lash`, `snap`, `wisp-touch`, `hind-kick`, `stone-fist`, `void-fist`, `void-lash`, bite palettes `bite-plague` / `bite-bog` / `gnaw`). `attackStyle` only otherwise feeds the DoT-flavour fallback (unchanged result) and the slam element tint |
| Pre-swing anticipation | `fx/attackAnticipation.ts` | client-only draw-back in the last ~240 ms before `lastAttackAt + attackCooldown` (server clock); snaps into the lunge on the hit; lets go if the swing never comes |
| Camouflage decloak | `fx/camouflage.ts` | colour-shift shimmer (chameleons), mud (pool lurkers), leaves (brush); plays only on real transitions. The server's `reveal` ecology pulse is never emitted |

`fxMawWindup` (trenchBoss.ts) takes `opts { width, feel }` so Trench elites reuse the
jaws at elite weight.

## Players

### Attack progression — `fx/attackFlair.ts`

`attackFlairOf(player)` reads data every PlayerView carries (own and remote):

- **Stage** from class advancement: 0 root (bare stroke: no glow wash, no contact flash,
  thin particles, slightly smaller), 1 frame (glow and flash), 2 range (today's full
  look including the per-range attacks), 3 specialization (bespoke attack, below).
- **Ascension** (`playerTier`, clamped 0–4) scales particle counts (+12 %/tier) and size
  (+3.5 %/tier); from T3 a specialized payoff rings out in the class colour
  (`playAscensionRing`, bespokePaths.ts).

The five class base FX (`strikerSlash`, `squireSlam`, `gunshot`, `lightning`,
`apprenticeCast`) and the seven range FX take an optional `flair`; without one
(monsters, minions) they draw their full look.

### Specialization attacks — `fx/bespoke/` + `fx/bespokePaths.ts`

Every one of the 45 combat specializations is exactly one of:

- **bespoke** (39): a module per class — `striker.ts`, `squire.ts`, `slinger.ts`,
  `spirit.ts`, `apprentice.ts` — registered in `bespokePaths.ts`, sharing
  `bespoke/kit.ts`. Hooks: `attack` (replaces the ordinary hit), `hit` (a layer over
  the range attack), `payoff` (replaces the finisher / execution / discharge; fires on
  `empowered || execution`), `reload` (on `player-reload-start`). Each reads the path's
  own resource from the view: aura (`rampage-N`, `channel-N`, `surge`), `activeBuffs`
  stack counts (`cadence-crescendo` = %, `cadence-verdict` = HP, `cooldown-battery`,
  `reload-momentum`, …), combo / ammo / energy fields, or the TARGET's mirrored
  `targetStatus` (`dot`, `death-mark`, `vulnerability`, `energy-storm`, `dot-chill`, …).
- **full replacement** (6), drawn by their own branches in `combatFx`: Swiftblade
  (`fxSwiftbladeStrike`: the regular Striker crescent per strike, the second of a
  same-tick pair delayed 90 ms so they cross), Equinox, Stormdancer, Melter (laser),
  Sniper, Blunderbuss.

Several bespoke paths keep an older cue beside them: Hemomancer's `fxBleedOpen`,
Duelist's red round, Dualslinger's blue round (`fxDualBlueRound`, called from the
alt-shot branch; its gold round is the `attack` hook), Bounty hunter's detonation,
Cannoneer's blast, Voidwalker's discharge, Destroyer's hollow taps, Devout Priest's
holy channel, and the T3 threshold triggers (`fx/t4Triggers.ts`).

Paths that read `targetStatus` depend on the server mirroring the target's status
list, which it does for any monster that is somebody's attack target.

### Abilities — `fx/abilityRank.ts`

Rank = shared `abilityRankNumber(def, playerTier)`, computed on the client. Around
each ability's own animation: rank II adds a resonance ring and sparks, III a rune
turning on the ground, IV a light pillar and wide ring (plus a light impact for your
own). Skill callouts and cast bars show the numeral from II. Every ability needs an
`ABILITY_COLOR` row (enforced by `attackProgression.test.ts`). Rank I is the
ability's existing look; abilities have no stage-0 thinning.

## Guards (tests)

- `monsterStyleCoverage` — every authored `attackStyle` is registered client-side and
  in use; every emitted cue id is handled (engage openers via `OPENER_RUSH`); every
  non-boss charged attack / damaging ability has a wind-up.
- `attackProgression` — the flair ladder, 45 = bespoke + named replacements (exactly
  one each), class tables registered, dispatch hooks present, ability colours.
- `monsterStateMirror`, `chargeOnAggroVisual`, `plainsHawkDiveBomb` — the mirrored
  flags and the landing event, through the real tick.

## Open / deferred

- Conduit's 9 specializations are out of scope for now (the summons are its visuals).
- No in-browser verification tool: a preview tool for animations is in
  [future-plans.md](future-plans.md).
- Most of this pass was reviewed only in part by the designer; expect iteration.
