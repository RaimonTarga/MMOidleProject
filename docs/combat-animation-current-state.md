# Combat animation (mobs and players) — current state

**Last audited:** 2026-09-28 (branch `feat/premium-mob-animations`, incl. Conduit paths).
**Owning source:** `client/src/fx/` (animation modules), `client/src/render/combatFx.ts`
(event dispatch), `client/src/render/monsters.ts`, `server/src/systems/combat/ai/ai.ts`
and `server/src/systems/combat/engine/monsterStateMirror.ts` (presentation state the
server publishes).
**Tests:** `server/test/monsterStyleCoverage.test.ts`, `chargeOnAggroVisual.test.ts`,
`monsterStateMirror.test.ts`, `plainsHawkDiveBomb.test.ts`, `attackProgression.test.ts`,
`conduitPathFx.test.ts`, `lineagePayloadFx.test.ts`, `lineagePayloadEvents.test.ts`.

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

### Conduit specializations — `fx/conduitPaths.ts`

A Conduit fights through its formation, so its nine paths are drawn on the summons'
strikes (`minions.ts`, from the summon snapshot) by `playConduitStrike`, keyed by the
summon type (`conduit-summon-<path>`):

| Path | Look | Reads |
| --- | --- | --- |
| Inquisitor | accusing eye over the target, a pip per marking summon | target `summoner-harried` stacks |
| Kilnmaster | ember-trailed strikes | — |
| Iconoclast | the marked summon cracks and glows each snapshot; shards burst on `summon-shatter` | owner `summonSlots[].marked`, event |
| Marshal | gold pennant + drilled strike on openers / coordinated strikes | minion `lastAttackEmpowered` |
| Chorister | sound-wave voices; a note per voice orbits the target | target `summoner-withering-chorus` stacks |
| Ritualist | rune pips on charged summons; rune burst when a charge is spent | owner `summonSlots[].ritualCharges`, `lastAttackEmpowered` |
| Covenanter | red crescent (offense twin) / blue shield-bash (defense twin) | summon type |
| Champion | tether to the bonded summon brightening with bond progress; gold chain on the linked strike, from either body | owner buff `summoner-battle-bond`, `lastAttackEmpowered` / `empowered` |
| Idolwright | colossal stomp: cracks, ground ring, rubble | — |

Server signals added for these: `MinionView.lastAttackEmpowered` (written on every
formation swing in `runFormationAttack`, true for an opener, coordinated strike,
ritual-charged hit or linked strike), `player-hit.fromSummon` (a summon's blow), and
the `summon-shatter` event (Iconoclast detonations, `deliberate` for the marked slot).
Conduit hit events stay undrawn (summons draw from snapshots) except a Champion's own
blows (`drawsOwnHit` in combatFx), which previously drew nothing at all.

### Abilities — `fx/abilityRank.ts`

Rank = shared `abilityRankNumber(def, playerTier)`, computed on the client. Around
each ability's own animation: rank II adds a resonance ring and sparks, III a rune
turning on the ground, IV a light pillar and wide ring (plus a light impact for your
own). Skill callouts and cast bars show the numeral from II. Every ability needs an
`ABILITY_COLOR` row (enforced by `attackProgression.test.ts`). Rank I is the
ability's existing look; abilities have no stage-0 thinning.

## Lineage payloads (T1 lean and verb, course-correction W2-C, 2026-10-03)

Design §24.1–§24.2 rule 4: every T1 payload is perceptible with the sound off, as a
change in what bodies do. The server pushes one `card-fx` per application with the
PAYLOAD's key; `fx/lineagePayloadFx.ts` draws the ten keys, `fx/lineagePayloadModel.ts`
(pure) says what each is and when it plays, and the lasting looks are four aura rows
in `fx/auraDefs.ts` fed by `fx/lineagePayloadStates.ts`.

| Payload (key) | What the bodies do |
| --- | --- |
| lands twice (`tempo.ghost-strike`) | the body winds back as the moment lands and wind gathers at the blade; 190 ms later the echo's own hit is presented as a SECOND swing (the class swing, a body lunge, afterimages, a crossing crescent in the lane colour) |
| lunge (`engagement.lunge`) | the body dashes at the target with afterimages and a push-off kick; the multiplied hit is presented at contact (110 ms) with a starburst, a hit-stop and the target recoiling; the body holds, then slides home |
| mechanic flash (`empowered.mechanic-flash`) | the hit itself draws as the root's own empowered hit; beside the player the CLASS's mechanic glyph fills and flashes (combo pips, cooldown dial, a round chambering, a bolt, a dose at full stacks, a rune); weapon flare, brace pose |
| crash (`empowered.crash`) | the same glyph, bigger, and the ground cracks under the target: dust ring, debris, the target buckles; medium shake |
| heavy drip (`affliction.heavy-drip`) | venom thrown off the body and falling, a splat, a flinch; then heavy drops and a growing stain while the bleed runs |
| double dose (`affliction.double-dose`) | the affliction is drawn in, then bursts: its pips split in two, heavier venom, a stronger flinch; then the heavier drip |
| shackle (`control.shackle`) | two chain halves fly in and lock round the feet (clank, sparks, a jolt); a chain ring on pegs holds for the root's clock, strains in its last 400 ms, then breaks |
| knockdown (`control.knockdown`) | a blow; the body is knocked up, then tipped and pressed flat to the ground and held there (against other pose writers) for the stun's clock; it gets up with a hop and dust |
| heal and load (`kill-chain.heal-load`) | a pulse up the player's body (rings, rising motes, a straighten); the load leaves the weapon and lands with the hit; between the kill that arms it and that hit the weapon glows (`lineage-loaded`) |
| refund (`technique.refund-flash`) | the refunded Technique's ability-bar tile flashes in the lane colour with a backward sweep while its cooldown jumps; a sigil turns backward under the player |

Server truth, not client guesses: a payload's own hit carries `lineage-hit:<fx>`
(`shared/src/protocol/clientEffects.ts`) so the client presents it as the payload's
swing; `card-fx` carries the APPLIED `durationMs` (root, stun after resistance, bleed
ticks) and the refunded `abilityIds`; `lineage-load` marks when a loaded carry is
armed and spent; a refund samples the new cooldown to the HUD. A lasting look ends on
its clock, or early when the view shows the server's state gone (the mirrored root or
bleed, `hardControlled`), and is forgotten with its body (a shackle on a dying body
breaks where it was). Card-fx play on the combat playback clock with the hit they rode;
the refund, HUD first, stays immediate. Every payload takes the player's
`AttackFlair` through `payloadFlair`: full size on a fresh character, a little more
with stage and ascension, capped below a T3 specialization. The floating payoff WORD
belongs to the rhythm readout (W2-B).

## Guards (tests)

- `monsterStyleCoverage` — every authored `attackStyle` is registered client-side and
  in use; every emitted cue id is handled (engage openers via `OPENER_RUSH`); every
  non-boss charged attack / damaging ability has a wind-up.
- `attackProgression` — the flair ladder, 45 = bespoke + named replacements (exactly
  one each), class tables registered, dispatch hooks present, ability colours.
- `monsterStateMirror`, `chargeOnAggroVisual`, `plainsHawkDiveBomb` — the mirrored
  flags and the landing event, through the real tick.
- `lineagePayloadFx` — every payload a packet's halves can push has a client effect,
  routed before the lane-primitive switch; hit presentation delays; server durations;
  the lasting-state lifecycle; the loaded-carry guard; mid-weight flair.
  `lineagePayloadEvents` — the hit tags, applied durations, refund sample and
  `lineage-load` beats, through the real listeners.

## Open / deferred

- No in-browser verification tool: a preview tool for animations is in
  [future-plans.md](future-plans.md).
- Most of this pass was reviewed only in part by the designer; expect iteration.
