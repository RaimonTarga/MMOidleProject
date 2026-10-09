# Combat animation (mobs and players) — current state

**Last audited:** 2026-09-28 (branch `feat/premium-mob-animations`, incl. Conduit paths).
**Owning source:** `client/src/fx/` (animation modules), `client/src/render/combatFx.ts`
(event dispatch), `client/src/render/monsters.ts`, `server/src/systems/combat/ai/ai.ts`
and `server/src/systems/combat/engine/monsterStateMirror.ts` (presentation state the
server publishes).
**Tests:** `server/test/monsterStyleCoverage.test.ts`, `chargeOnAggroVisual.test.ts`,
`monsterStateMirror.test.ts`, `plainsHawkDiveBomb.test.ts`, `attackProgression.test.ts`,
`conduitPathFx.test.ts`, `lineagePayloadFx.test.ts`, `lineagePayloadEvents.test.ts`,
`abilityFlavorFx.test.ts`.

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
  `empowered || execution`, with the hit's `effects` so Reverb tells its echo from its
  execution), `reload` (on `player-reload-start`), `kill` (on the player's own
  `player-kill`: the Duelist's round chambering past the clip). Each reads the path's
  own resource from the view: aura (`rampage-N`, `channel-N`, `surge`), `activeBuffs`
  stack counts (`cadence-crescendo` = %, `cadence-verdict` = HP, `cooldown-battery`,
  `reload-momentum`, …), combo / ammo / energy fields, or the TARGET's mirrored
  `targetStatus` (`dot`, `death-mark`, `vulnerability`, `energy-storm`, `dot-chill`, …).
- **full replacement** (6), drawn by their own branches in `combatFx`: Swiftblade
  (`fxSwiftbladeStrike`: the regular Striker crescent per strike, the second of a
  same-tick pair delayed 90 ms so they cross), Equinox, Stormdancer, Melter (laser),
  Sniper, Blunderbuss.

Several bespoke paths keep an older cue beside them: Hemomancer's `fxBleedOpen`,
Dualslinger's blue round (`fxDualBlueRound`, called from the alt-shot branch; its
gold round is the `attack` hook), Bounty hunter's detonation, Cannoneer's blast,
Voidwalker's discharge, Devout Priest's holy channel, and the T3 threshold triggers
(`fx/t4Triggers.ts`).

The five paths the ability pass re-homed (design §22.5) draw their new rules: Duelist
chambers a round past the clip on a kill (the old last-bullet glint and red round are
gone); Warmonger's war drum reads the Artillerist ramp's FILL (`reload-frame-ramp`'s
`durationPct`, one clip full like the damage and the glow, design §22.12; past it the drum
only beats faster with the attack speed); Pyromancer's Radiant is fire
leaping from the burning body to each body its max-stack tick strikes
(`fxRadiantArc`, on the struck body's `dot-tick`, whose `fromId` names the burning
body; the old max-stack burst is gone); Reverb's hits hum while its echo is due,
gathering as the `cooldown-reverb` clock runs down, and the echo (`reverb-echo` on its
hit) is the bell answering, paler and half-sized; Destroyer's regular hits are
ordinary (the hollow tap is gone) and smoulder at the weapon while the execution
waits primed, and a cast-delivered execution draws the path's crater at the cast's
target.

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

## Ability flavor: amplifiers and keystones (ability pass W2-D, design §22.7)

An ability's identity deepens with its node rows. Names and icons are the HUD's
(`abilityDisplayName`, shared `abilityIconLayers`, client `ui/abilityIcons.ts`); the
animation half is here.

- **Packet row**: the lane's existing fx (`ABILITY_NODE_FX`), unchanged.
- **Amplifier row**: the node's `card-fx` carries its `axis`, and `axisFx`
  (`fx/abilityKeystoneModel.ts`) scales or extends the same lane fx: of Weight
  (`magnitude`) draws it bigger, of Many (`targets`) a second echo a beat later, of
  the Lingering (`duration`) a fading trail of two smaller repeats, of Haste (`cast`)
  a quick double-tap. A T1 payload key grows instead of repeating (its poses would
  replay).
- **Keystone row**: every keystone `card-fx` carries the verb's id (`keystone`) and
  draws from `pos`, the verb's delivery body (a Conduit's summon). `fx/abilityKeystoneFx.ts`
  holds ONE bespoke animation per verb, keyed by id; a verb without one is a keyed
  stub that draws its lane fx as before. A verb with a server wind-up pushes a
  `windupMs` beat first (Aftershock), its payoff its own card-fx later. Keystones
  carry no `cardId`, so they never float a word (design §26.4).

| Verb | Wind-up | Payoff | Lasting mark |
| --- | --- | --- | --- |
| Whirlwind | the body coils, air drawn in | the body turns through its spin (width through zero, mirrored), two wind blades round it, a cleave ring on every server tick; a stun or freeze breaks it (blades scatter) | — |
| Aftershock | the spot cracks, seams glowing hotter as a ring closes on it over the server's delay | rock and dust thrown up through the cracks, a flat shockwave, medium weight on your screen | the cracked ground cools to dark, then fades |
| Breakthrough | the Charge's own rush | a contact starburst from the delivering body's side, a cone of force through the target, the knockdown payload held for the stagger's clock | a dazed halo of stars for that clock (`dazedHalo`, reusable by every stagger verb) |
| Outbreak | the infected corpse swells | it bursts; a glob of what it carried is lobbed onto its nearest neighbour, which flinches | a bubbling miasma pool where it died |
| Dragnet | a weighted net thrown from the delivering body, readable in flight | it spreads over each adjacent body, the shackle locks for the root's clock (less the flight), strands tie the bodies of one cast together | the shackle's held look until the root ends or breaks |
| Chain Reaction | Detonate's own wind-up and the kill | the corpse goes off once; a crackling fuse leaps to each afflicted body down the batch and lands in a ring (each body's own `dot-detonate` draws its explosion) | a scorched star where the chain began |
| Pierce | a glint at the muzzle, a hair-thin sight line | a rail of light through and past the last body, every body on the line punctured in turn | the smoke of its wake along the line |
| Relay | the daze over the body whose stun ran out gathers into a spark | the spark arcs to the next body and lands as a stagger flash; the body jolts | the dazed halo for the stun as applied, ending with the server's mirrored hold |
| Fork | static gathers on the struck body | a forked bolt (main arc, a branch that fizzles) flickers across; the body it reaches jolts | static crackling on it a moment |
| Harvest | a pale scythe drawn back over each next low body, link after link | it reaps across in a slash, the body buckles; each link a little larger | a wisp rising from what was reaped |
| Vanish | Disengage's own leap | smoke and an outline of your body left where you stood (the Avoid face's blur); the real body slips away in afterimages | the outline flickers and thins over 1.7 s |
| Shared Breath | the owner draws breath, a pulse ring off the body | the Sustain pulse runs body to body down the formation and party, a ring and rising crosses on each | each body breathes with the shared mend while it runs |
| Immunity | what was stripped is wrenched out of the body | a hexagonal shell seals facet by facet and flashes shut | the shell holds, shimmering, for the lock's clock |
| Overflow | the heal rises up the body like a level to the brim | it spills over and sets into a round ward bubble with a chime | the bubble holds for the ward's window, its highlight turning |
| Riposte | the blow caught on the Brace, plating chips thrown off | a counter crescent, the stagger flash on the attacker, the knockdown for the stagger's clock | the dazed halo |
| Backlash | the hold bursts into shards as the body heaves up | a shockwave rolls out; each adjacent body, a beat apart, takes the stagger flash and the knockdown | the dazed halo on each |
| Entangle | thorns bristle round you at the blow | a vine lashes along the hit and coils round the attacker's legs with a burst of thorns | the coil at its feet for the slow's clock, tightening as it ends |
| Unyielding | the body plants into its stance, dust at its feet | plates fly in and lock on with a heavy ring | the locked plates ring the feet, glinting in turn, dropping away at the end |
| Flow | the body slips the blow, leaning away from the attacker | a fading after-trail of the body and a spark streak; the window's ring at the feet flares bright and its clock is full again (the first dodge draws it in) | the ring holds for the server's window, two streams running round it, dimming as it runs down; the hit that lands snaps it (`durationMs: 0`): a white flash, shards flung out, the body jolted |

Shared keys are told apart by the verb id: Breakthrough, Riposte and Backlash all
push `control.knockdown`; Immunity and Overflow `barrier-tempo.ward-shell`; Shared
Breath `kill-chain.recovery-pulse` (also Second Wind's Kill-chain packet fx, which
stays the lane's pulse). Every first verb is animated (design §22.12 made Flow
Sidestep's first verb; Afterimage, now its second, is a silhouette), so
`KEYSTONE_STUBS` is empty; the test refuses a live verb left as a stub. Flow's icon
glyph is `stances/fleeting-stance` (silhouette `flow`).

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
- `abilityFlavorFx` — a keystone's card-fx names its verb (Whirlwind's spin;
  Aftershock's wind-up beat and eruption), a node payoff carries its amplifier's
  axis, every first verb is animated or a stub exactly once, the animation table
  and the model agree, every offered axis changes the draw.

## Open / deferred

- No in-browser verification tool: a preview tool for animations is in
  [future-plans.md](future-plans.md).
- Most of this pass was reviewed only in part by the designer; expect iteration.
