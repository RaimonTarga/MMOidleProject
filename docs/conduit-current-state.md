# Conduit Current State

Objective snapshot of the Conduit (summoner) as it is implemented today. Not a
balance assessment and not a proposal.

Updated 2026-08-08 against the shipped code. The previous version described
the pre-overhaul tier-3 path system (Predator's Howl, Acid Brood, Stone
Sentinel, Mountain Guardian, ...), which no longer exists — see §9.

## 1. Identity And Availability

Conduit is the in-game name for the summoner class. Its root skill id is
`summoner-root`, and choosing it sets `usesSkills.combatArchetype` to
`summoner`.

It is gated by feature flags:

- Client: `client/src/featureFlags.ts` exposes `CONDUIT_ENABLED`.
- Server: `server/src/env.ts` exposes `CONDUIT_ENABLED`.
- Dev enables it. Production hides it unless `VITE_ENABLE_CONDUIT=true`, and the
  server rejects new `summoner-root` unlocks unless `CONDUIT_ENABLED=true`.

## 2. Skill Tree

Ids are unchanged from the overhaul; only display names have moved. Nothing in
persistence, tuning, buffs, or icons is keyed on a name.

| Tier | Node ids | Names |
|---|---|---|
| 0 | `summoner-root` | Conduit |
| 1 | `summoner-{light,balanced,heavy}` | **Splinter / Consort / Effigy** |
| 2 | `summoner-range-{close,mid,far}` | **Vigil / Procession / Harrier** |
| 3 | `summoner-{frame}-t3-{a,b,c}` | see below |

Tier 3 in tree terms is the player's tier 4. The nine specializations, by frame:

| Frame | Id suffix | Name | Internal specialization id |
|---|---|---|---|
| Splinter | `light-t3-a` | Inquisitor | `harrier-brood` |
| Splinter | `light-t3-b` | Kilnmaster | `endless-swarm` |
| Splinter | `light-t3-c` | Iconoclast | `volatile-brood` |
| Consort | `balanced-t3-a` | Marshal | `coordinated-hunt` |
| Consort | `balanced-t3-b` | Chorister | `withering-chorus` |
| Consort | `balanced-t3-c` | Ritualist | `grand-ritual` |
| Effigy | `heavy-t3-a` | Covenanter | `twin-covenant` |
| Effigy | `heavy-t3-b` | Champion | `battle-bond` |
| Effigy | `heavy-t3-c` | Idolwright | `colossus` |

The internal ids in the last column are what `SUMMONER_SPECIALIZATION_TUNING`,
the buff ids, and the concept icons use. They deliberately still read as the old
names.

## 3. Runtime Model

Server-authoritative like the rest of combat. The client renders summons and
sends intents; the server owns spawning, movement, attacks, damage,
reconstruction, commands, and all status effects.

With the `summoner` archetype:

- `syncArchetypeSlices` attaches `summonsMinions` and `controlsSummons`.
- `recalculatePlayerStats` returns `cannotAttack: true`, so the server attaches
  the `CannotAttack` marker and the player does not attack directly. Champion
  (`battle-bond`) is the one specialization that restores a direct attack.
- `World.summonerPlayers` queries live players with `summonsMinions`.

Minions are full ECS entities carrying `isMinion`, `controlsMinion`,
`hasPosition`, `hasHitbox`, `hasHealth`, `dealsDamage`, `performsAttack`,
`mitigatesDamage`, `tracksCombat`, and `hasStatus`.

Slot identity is logical and survives replacement of the ephemeral entity:
`summonsMinions.slotIds[i]` is stable, `minionIds[i]` is the live entity or `''`.

## 4. The Formation Profile

`resolveSummonerProfile` in `shared/src/systems/summonerProfile.ts` is the
single place that turns (frame, range, specialization) into everything the
runtime needs. Server code reaches it through `summonerProfileFor(owner)`.

Frame sets formation shape (`SUMMONER_FRAME_TUNING`):

| Frame | Count | Offense | Total summon HP | Move | Size |
|---|---|---|---|---|---|
| root | 4 | 1.0 | 0.80 | 1.0 | 1.0 |
| Splinter | 6 | 1.05 | 0.66 | 1.18 | 0.72 |
| Consort | 5 | 1.0 | 1.00 | 1.0 | 1.0 |
| Effigy | 2 | 0.98 | 1.40 | 0.78 | 1.75 |

Range sets fighting distance and the visual treatment
(`SUMMONER_RANGE_TUNING`):

| Range | Mode | Policy | Size | Attack range | Summon HP | Redirect | Conduit defense share |
|---|---|---|---|---|---|---|---|
| Vigil | melee | guardian | ×1.50 | 18 | 1.25 | 0.55 | 0.25 |
| Procession | reach | escort | ×1.25 | 96 | 1.00 | 0.30 | 0.50 |
| Harrier | ranged | harrier | ×1.00 | 190 | 0.70 | 0.08 | 0.75 |

Per-slot `sizeMult` is `frame × specialization × range`, clamped to
`[SUMMON_SIZE_MULT_MIN, SUMMON_SIZE_MULT_MAX]` = `[0.6, 3.0]`. The clamp binds
in both directions: Kilnmaster at Harrier range would otherwise reach 0.389, and
Idolwright at Vigil range 3.94.

`sizeMult` feeds `resolveMinionHitbox`, so it is **not** purely cosmetic.

Known gap: `conduitDefenseShare` is authored and exposed on the profile but has
no consumer. The range descriptions promise it; nothing reads it yet.

## 5. Core Loop

Each summoner tick:

1. `reconcileMinionSlots` — preserve matching logical slots, replace changed layouts.
2. `syncLiveMinionFrameStats` — speed, size, hitbox, max HP, HP regen, attack, cooldown, range.
3. `validateSummonerCommand`.
4. `collectDeaths` → `enqueueSummonReconstruction`, plus `onSummonDeath` for specs.
5. `tickSummonReconstruction` — one shared FIFO queue, not per-slot timers.
6. `driveMinion` per live minion.
7. `tickSummonerSpecializations`.

Reconstruction (`SUMMONER_CORE_TUNING`): base 5000 ms, floor 2500 ms, HP cost
ratio 0.5, safety floor 20% of max HP, in-combat regen 20%. Leash radius 320.
Hard entity cap 9.

## 6. Summon Visuals

Summons no longer borrow wildlife sprites. Before this pass they rendered as a
field hare (mid), a ridge ambusher (far), a boar, a cliff hopper, a frog, and
the T1 mountain boss sprite for Colossus.

- Root keeps `conduit-summon`, the original floating bone skull. The three
  frames and all nine specializations resolve to their own bound familiar
  bodies; Covenanter uses separate offense and defense twins.
- Base display size is `MINION_BASE_DISPLAY_SIZE` = **28** (was 48).
- All 13 variant originals are preserved under
  `art/workbench/conduit-summon-raw/`; the shipped sources have a deterministic
  1px `#14181a` outline. Directional bodies face right/east.
- Range renders as a hue tint (`SUMMON_RANGE_TINT`, resolved client-side from
  the owner's unlocked skills, no protocol field) plus the size multiplier
  above. Range never swaps the body, mirroring the player-sprite rule.

| Formation | `MinionMonsterType` |
|---|---|
| Root | `conduit-summon` |
| Splinter, no specialization | `conduit-summon-splinter` |
| Inquisitor | `conduit-summon-inquisitor` |
| Kilnmaster | `conduit-summon-kilnmaster` |
| Iconoclast | `conduit-summon-iconoclast` |
| Consort, no specialization | `conduit-summon-consort` |
| Marshal | `conduit-summon-marshal` |
| Chorister | `conduit-summon-chorister` |
| Ritualist | `conduit-summon-ritualist` |
| Effigy, no specialization | `conduit-summon-effigy` |
| Covenanter offense twin | `conduit-summon-covenanter-offense` |
| Covenanter defense twin | `conduit-summon-covenanter-defense` |
| Champion | `conduit-summon-champion` |
| Idolwright | `conduit-summon-idolwright` |

| Range | Tint |
|---|---|
| Vigil | `#ffd0bc` warm |
| Procession | `#cdbde8` pale violet |
| Harrier | `#a8e8e0` cool teal |

Attack style comes from the formation's attack mode via `SUMMON_ATTACK_STYLE`,
**not** from `MONSTER_DATABASE` (the summon is not a monster definition, and the
old lookup silently fell through to `impact`):

| Mode | Style | FX |
|---|---|---|
| melee | `impact` | shared melee thump; lunges |
| reach | `conduit-bolt` | fast red orb, 120 ms; no lunge |
| ranged | `conduit-beam` | red beam, fades in 140 ms; no lunge |

`isRangedSummonStyle` gates the lunge, the same way `MonsterView.isRanged` does
for monsters.

The temporary DEV summon-skin switcher and its losing teal/porcelain frames
were removed when the familiar set shipped. Plain `[` / `]` still controls the
unrelated ground bake-off in development.

## 7. Targeting, Leash, Commands

- Leash radius is a flat `SUMMONER_CORE_TUNING.leashRadius` (320) from the
  profile, no longer derived from owner attack range.
- Normal minions pick the closest in-leash monster, move to the leash boundary,
  and attack when collision range permits. Harrier-policy formations retreat
  when a target closes inside 65% of `preferredDistance`.
- Kilnmaster (`endless-swarm`) uses spread targeting: fewest already-assigned
  minions, ties broken by distance, sticky while valid.
- `player:commandSummons` carries focus (click a monster) and move (click
  ground) commands. Move commands clamp to leash and clear when every live
  minion arrives within 10 px.

## 8. Damage And Buffs

Minion damage is deliberately not the full player pipeline. Sources: the Conduit
damage sponge (`redirectionPct` of owner damage taken, redirected to a living
summon — the Covenanter defense twin is preferred when present), monster AoE,
and monster attacks against minion aggro targets.

`SUMMONER_T4_BUFFS` in `specs/buffs.ts` projects one buff per specialization,
with labels `SHARD KILN ACCUSE ORDER WITHER RITUAL IDOL BOND TWINS` and world-log
source names matching the tier-4 display names.

## 9. What Was Removed

The pre-overhaul tier-3 path system was deleted 2026-08-05. It had been
unreachable since the overhaul — no skill node authored a `summoner.minion-as-*`
or path passive, and `initSummonerT3`/`updateSummonerT3` were never called.

Gone: `summoner/t3/` (cave, plains, mountain paths and their core helpers),
`sentinelPlacement.ts`, `statShare.ts`, the sentinel and boar-charge branches in
`ai.ts`/`command.ts`/`controlsMinion.ts`, the trample multiplier in
`movement.ts`, `pickLivingMinionOfType`, three `SUMMONER_T3_BUFFS`, four
`mechanicEffectScaling` entries, and 44 orphaned `summoner.*` passive keys
across `passives.ts`, `statHelp.ts` and `passiveText.ts`.

Kept and relocated: `canApplyPlayerDebuff` now lives in
`server/src/systems/combat/status/debuffGuard.ts`. It sat in the Conduit's
folder only because Vital Burst was its sole producer, but six live call sites in
the combat engine and dot prototype ask it. Nothing grants immunity today, so it
always passes.

Kept deliberately: the `summoner-howl-banner` concept icon, because the gauntlet
pre-encounter rally aura aliases to it in `conceptIcons.ts`. The `summoner-`
prefix is now misleading and the asset is worth renaming in a future art pass.

## 10. File Map

Shared:

- `shared/src/data/summoner.ts` — all tuning, tint-adjacent size, attack styles
- `shared/src/systems/summonerProfile.ts` — the profile resolver
- `shared/src/systems/summonerHud.ts` — slot projection for the HUD
- `shared/src/components/archetypes/summoner/{summonsMinions,isMinion,controlsSummons}.ts`
- `shared/src/sprites/frameMaps.ts` — summon frames and `SUMMON_RANGE_TINT`
- `shared/src/data/skillTree/{rootsAndFrames,t3Summoner}.ts`

Server:

- `summoner/{index,summonerPrototype,spawn,ai,command,profile,range}.ts`
- `summoner/{reconstruction,formationAttack,formationTarget,damageSponge}.ts`
- `summoner/specs/{index,buffs}.ts`

Client:

- `client/src/render/minions.ts` — sprite, tint, lunge gate
- `client/src/fx/conduitSummon.ts` — bolt and beam
- `client/src/hud/stat/mechanics.tsx` — Summons section

## 10b. Specialization Player Bodies — SHIPPED 2026-08-08

All nine specializations have bespoke generated player bodies, mapped under
`summoner-{light,balanced,heavy}-t3-{a,b,c}` in `PLAYER_FRAMES`, packed, anchored,
and covered by `server/test/conduitPlayerBodies.test.ts`.

| Frame | Spec | Body | Silhouette direction |
|---|---|---|---|
| Splinter | Inquisitor | `light_summoner_t3a` | chest/shoulder mask cluster |
| Splinter | Kilnmaster | `light_summoner_t3b` | many small masks, scorched apron |
| Splinter | Iconoclast | `light_summoner_t3c` | cracked mask, hanging shards |
| Consort | Marshal | `medium_summoner_t3a` | gold armour, raised back crest |
| Consort | Chorister | `medium_summoner_t3b` | wide pleated ruff, singing masks |
| Consort | Ritualist | `medium_summoner_t3c` | long ceremonial vestment |
| Effigy | Covenanter | `heavy_summoner_t3a` | paired shoulder masks |
| Effigy | Champion | `heavy_summoner_t3b` | hitched robe, armoured limbs |
| Effigy | Idolwright | `heavy_summoner_t3c` | white chest panel, blocky mass |

**The recipe differs from every other class, and this is the load-bearing
finding.** Conduit bodies chain from their own frame parent at
`initImageStrength` **65**, not the 75 that produced all 45 non-Conduit T3
bodies. Two rounds at 75 were rejected as *"too similar to the original"*.

The reason is structural: every other class parent has **internal parts to
reinterpret** — plate, tabard, chainmail, hood-plus-painted-mask — whereas the
Conduit parents are a plain robe **column**. With nothing to reshape, the chain
at 75 simply reprints the robe and varies the surface. 65 gives structure room
to grow. The documented "75 is a floor" rule was derived from parents that do
not resemble this one.

Two failures worth not repeating:

- **A shoulder accessory is not a tier-3 read.** The rejected calibration gave
  each spec a collar / mantle / faceplate pauldron. At 64px that is ~8px of trim
  on an identical silhouette. Bodies that work change the head shape, the garment
  shape, or extend the outline.
- **Do not cancel your own idea in the same prompt.** A sibling-chain probe
  (Idolwright from the accepted Destroyer, to import its mass) said "cloth robe"
  and banned `plate armor`, suppressing the exact donor structure it was
  borrowing. Covenanter asked for a centre-line split *and* "deep red throughout",
  so the split had no colour to express and never appeared.

**Head anchors:** Marshal's raised back crest broke `anchors.mjs` — its topmost
opaque pixel is the crest, not the head, so the probe row measured the crest and
anchored it 17px off centre. The script now locates the head inside a narrow
central band and expands **contiguously**, so a disconnected prop can never be
merged into the head's width. Re-run it after adding any body with a raised prop.

## 11. Outstanding

- Kilnmaster reads at ~17 px even after the clamp; that spec may need its own
  floor or a deliberately simplified body.
- `conduitDefenseShare` has no consumer (§4).
- The nine specialization player bodies read as a **somewhat samey set**. This is
  structural, not a production failure: the identity invariants lock the deep-red
  robe, the white ceramic mask and the hood across all nine, which are exactly the
  channels the other five classes use to differentiate their specs. Any future
  push on Conduit variety has to come from a channel the invariants leave free —
  the accent slots (see `player-sprites-current-state.md`) are the obvious one.
