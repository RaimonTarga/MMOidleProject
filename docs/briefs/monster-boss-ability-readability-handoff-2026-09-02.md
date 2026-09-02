# Monster and Boss Ability Readability - Post-Wave 1 Handoff

> **Status:** OPEN HANDOFF - Wave 1 is complete; the work below is intentionally unimplemented.
>
> **Date:** 2026-09-02
>
> **Scope:** Finish the readability/characterization pass without redesigning encounter balance.
>
> **Explicit exclusion:** The Void Overlord and its staged encounter units are deprecated. Ignore them completely.

## 1. Goal and decision rule

The desired transformation remains:

> same mechanic and numbers -> clear trigger -> readable cast/callout -> visible resulting state

Use a real cast when the monster is visibly *doing* something: calling reinforcements, changing stance, rupturing armor, opening a caldera, or planting a large hazard. Use a non-locking callout or state marker when a cast would only add downtime to an already-readable attack pattern. Keep continuous traits passive and make their progress visible.

This is not a balance redesign. Preserve the live effect values unless the cast itself changes encounter output enough to require a measured adjustment.

## 2. Wave 1 baseline - do not redo

Wave 1 shipped the shared readability foundation and the most opaque summon/barrier cases:

- Enemy barriers are now server-authoritative network state with current amount, maximum amount, active duration, and recharge countdown.
- Monster overhead bars have a separate barrier band. The target frame shows `BARRIER` while active and `REFORMING` during recharge.
- Barrier activation has a visible shield cue.
- Timed boss effects publish their real remaining and total duration; the target frame no longer presents every boss effect as permanent.
- Boss-effect icon aliases cover Bestial Frenzy and generated stat-buff ids.
- Cave plating shred has a player-facing `CORRODED` state tile.
- T1/T2 Plains Rallying Cry paths use a 2.0 second cast before their add/haste effects resolve.
- Carrion Vulture's instant ally haste became `Necrotic Screech`: a 1.2 second cast followed by +25% attack speed for 5 seconds on nearby allies, excluding the caster.
- Gravewright's recurring Raise Dead has a 1.1 second cast.
- Charnel-Crown Sovereign has a 1.3 second recurring Raise Dead, a 1.8 second `Mass Resurrection`, and a 2.0 second `Deathless Tide`.

The main regression coverage is in [`server/test/wave1AbilityReadability.test.ts`](../../server/test/wave1AbilityReadability.test.ts), with related coverage in [`server/test/corpseRaise.test.ts`](../../server/test/corpseRaise.test.ts), [`server/test/bossRework.test.ts`](../../server/test/bossRework.test.ts), and [`server/test/bossEncounterRework.test.ts`](../../server/test/bossEncounterRework.test.ts).

There is also substantial user-authored Tier 2 work in the current dirty worktree. Treat it as the live baseline and inspect it before editing. In particular, reuse the existing `castedAttackSpeedBuff`, `lowHealthWard`, `engageSequence`, shell wind-up, Barrage, and related tests rather than building parallel systems.

### Validation snapshot

- Shared, server, and client typechecks passed independently after Wave 1.
- `pnpm test` passed 128/128.
- The aggregate `pnpm typecheck` was still blocked by the pre-existing, unrelated `bot/src/tools/_probe3.ts` import of non-exported `DUNGEON_DATABASE`. Do not modify that probe as part of this pass.

## 3. Non-negotiable design constraints

1. Do not reintroduce an instant screen-wide slam or any unavoidable arena-wide damage event.
2. A large hostile footprint must have a named wind-up, a planted preview matching the real radius, and time to respond.
3. Do not turn every passive into a cast. Continuous ramps, inherent armor, on-hit poison, opening strikes, and obvious permanent traits normally need feedback rather than downtime.
4. The server remains authoritative. Cast completion, hazards, barriers, summons, and state durations must not be inferred only by the client.
5. Reuse existing Phaser particles, tint/pulse cues, floating callouts, cast bars, target states, and ground zones. No new sprites are required.
6. Preserve biome identity. Mountain escalates its one impact, Swamp escalates rot and space denial, Cave deepens corrosion, Desert changes duel stance, Jungle changes predator state, Tundra changes armor/shatter, and Volcanic changes Heat.
7. A generic boss-script cast plants the boss and suppresses its basic attacks. That is a balance change even when every nested action keeps its original numbers.
8. Do not touch the deprecated Void Overlord, its wardens, or its staged encounter.

## 4. Shared seams needed before the remaining boss pass

Build these narrowly and only as the first encounter needs them.

### 4.1 Scripted cast footprint

Extend the existing boss-script `cast` action with an optional server-published warning circle for actions such as `Rot Bloom`, `Caldera Vent`, and `Caldera Unbound`.

Suggested shape:

```ts
{
  type: 'cast',
  castMs: 1800,
  label: 'Rot Bloom',
  fx: 'roar',
  telegraph: { radius: 260 },
  actions: [/* existing morph and spawn-pool actions */],
}
```

Requirements:

- Plant the circle at the boss's position when the cast starts. It must not follow the boss.
- The circle is warning only. The pool is still created by the nested `spawn-pool` action on successful cast completion.
- Its radius and fill time must exactly match the resulting action and `castMs`.
- Clear it on completion, death/despawn, reset, and any future interruption path.
- Use the existing networked ground-zone pipeline. If `slam-telegraph` is reused, keep it cosmetic in this path and ensure no legacy slam damage path is invoked.
- Do not let publishing the preview retire already-active boss-owned persistent pools.

The main files are [`shared/src/data/monsters/types.ts`](../../shared/src/data/monsters/types.ts), [`shared/src/components/targeting/scriptsBoss.ts`](../../shared/src/components/targeting/scriptsBoss.ts), [`server/src/systems/combat/ai/bossScripts.ts`](../../server/src/systems/combat/ai/bossScripts.ts), [`server/src/systems/world/groundZones.ts`](../../server/src/systems/world/groundZones.ts), and [`client/src/render/groundZones.ts`](../../client/src/render/groundZones.ts).

### 4.2 Persistent named phase state

Wave 1 makes existing timed boss effects readable, but permanent morphs and mechanic upgrades such as `empower-shred`, `empower-charged`, and `stoke-ramp` still have no durable player-facing name.

Add one lightweight presentation-only boss action, for example:

```ts
{ type: 'state-marker', effectId: 'predators-descent', replaces: ['throne-ascendant'] }
```

The exact schema is flexible, but it must support:

- a stable effect id that appears in the target frame;
- permanent duration by default, with optional timed duration if later needed;
- replacement/removal so Desert stance changes do not leave stale Act II and Act III tiles simultaneously;
- no stat mutation of its own;
- explicit metadata in `client/src/hud/targetStatusMeta.ts` and help text where the name alone is insufficient.

Prefer this over adding ad hoc labels to every individual action type.

### 4.3 Non-locking phase announcement

Some phases only make an already-telegraphed signature attack stronger. A blocking cast would reduce pressure and change cadence without creating useful counterplay. Add or reuse a non-locking callout/pulse for these cases.

Do not fake this with a zero-duration scripted cast. The current cast owns root/attack locks, queues behind other casts, and emits a cast lifecycle. A dedicated `monster-callout` event or equivalent boss cue is clearer.

The minimum payload is a monster id, label, and optional existing cue id. The client should show short floating text plus a pulse, without a cast bar.

## 5. Wave 2 - high-value boss conversions

Wave 2 should stop after the bosses in this section are readable and tested. Suggested durations are starting points for playtest, not balance authority.

### 5.1 Hazard-forming phase casts - highest priority

| Tier / biome | Boss and current change | Recommendation | Resulting state and visual | Balance note |
|---|---|---|---|---|
| T3 Swamp | **Rot-Spore Croc-Behemoth**, 25%: stronger DoT plus an immediate radius-260, effectively fight-long pool | Cast **Rot Bloom** for 1.75-2.0s; preview radius 260; apply the existing `morph` and `spawn-pool` only on completion | Swamp-green expanding ground ring, spore pulse on completion, permanent `ROT BLOOM` state | High. The cast removes basic attacks during its wind-up and gives a real reposition window; keep pool/DoT numbers unchanged first |
| T3 Volcanic | **Cinder-Shell Magma-Salamander**, 25%: faster Eruption plus an immediate radius-240, 16s pool | Cast **Caldera Vent** for about 1.5s with a radius-240 preview; apply the existing charged upgrade and pool on completion | Orange-red vent ring and upward ember burst; permanent `VENTING` state | High. Shell cycle is already readable and should remain unchanged |
| T4 Volcanic | **Caldera Sovereign**, 25%: Heat floor/cap escalation, faster/wider Eruption, immediate radius-260 pool | Cast **Caldera Unbound** for 1.75-2.0s with radius-260 preview; resolve all existing actions together | Caldera ring, heat pulse through the arena, permanent `CALDERA UNBOUND` state | Highest. Keep the warning local to the real pool footprint; the node-wide Heat state can pulse, but must not look like unavoidable damage |

At 50%, the Rot-Spore boss should receive a non-locking **Accelerated Decay** callout/state for its faster attacks and pools. The Caldera Sovereign should cast **Open the Caldera** for about 1.5s before its first Heat-floor change; no large hostile circle is needed for that cast.

### 5.2 Major stance and behavior changes

| Tier / biome | Boss and current change | Recommendation | Resulting state and visual | Balance note |
|---|---|---|---|---|
| T3 Desert | **Dune-Carapace Monarch**, 50%: silently becomes a ranged kiter and empowers Sandburst | Cast **Carapace Unfurls** for 1.25-1.5s, then apply the existing morph and charged upgrade | Sand spiral, silhouette/range pulse, permanent `UNFURLED` state | High. This is the clearest example of “why did the fight change?” |
| T4 Desert | **Dune-Throne Sovereign**, 50%: melee controller becomes ranged kiter; 25%: returns to melee, gains speed, and accelerates Rupture | Cast **Throne Ascendant** for 1.25-1.5s at 50%; cast **Predator's Descent** for 1.25-1.5s at 25% | Distinct outward/inward sand spirals; replace the Act II state marker with the Act III marker | High. Test target/range reacquisition immediately after each cast |
| T3 Jungle | **Apex Bramble-Slasher**, 50%: doubles evasion for 5s and permanently strengthens/re-arms Pounce | Cast **Vanish into Bramble** for 1.0-1.25s before the existing effects | Green fade/leaf burst; timed `VANISHED` tile for the 5s evasion and permanent `PREDATOR REARMED` marker | High. Wave 1 duration plumbing should display the 5s window correctly |
| T4 Jungle | **Verdant-Crown Predator**, 50%: evasion becomes zero while attack, speed, and leap frequency jump | Cast **Predator Unmasked** for 1.25-1.5s, then apply the existing four actions | Evasion shimmer collapses into a red-green frenzy pulse; permanent `FRENZY` state | Highest. This is the encounter's defining Hunt-to-Frenzy trade |

At 25%, Verdant-Crown's cadence-only escalation should use a non-locking **Cornered Fury** callout and update the persistent state rather than adding another long cast.

### 5.3 Cave corrosion lineage

| Tier / biome | Boss and current change | Recommendation | Resulting state and visual | Balance note |
|---|---|---|---|---|
| T1 Cave | **Obsidian Broodmother**, 50%: maximum plating-shred stacks silently increase by 3 | Cast **Razor Molt** for 1.0-1.25s, then apply the existing `empower-shred` | Purple-black shell crack, permanent `DEEPENED CORROSION` state; player keeps Wave 1's `CORRODED` tile | High teaching value; verify the boss can still complete the phase before dying |
| T2 Cave | **Chitinous Dreadbore**, 50%: each stack strips 1 more plating and a Cave Troll appears | Cast **Chitin Rupture** for 1.25-1.5s, then apply both existing actions | Shell fragments plus a localized summon pulse; permanent `RUPTURED CHITIN` state | High, but inspect the user's current T2 branch before editing |
| T3 Cave | **Deep-Core Burrow-Gorger**, 50%: +4 maximum stacks and new thresholds at 9/12 | Cast **Corrosion Deepens** for about 1.25s | Expanding purple fissure pulse, permanent state marker | High |
| T3 Cave | Same boss, 25%: +1 plating per stack and a Cavern Troll appears | Cast **Core Breach** for about 1.5s, then apply both actions | Stronger fissure/summon cue; replace or advance the corrosion state | High; queued threshold casts must resolve in order if burst damage crosses both thresholds quickly |

### 5.4 Reinforcement and defended-position phases

| Tier / biome | Boss and current change | Recommendation | Resulting state and visual | Balance note |
|---|---|---|---|---|
| T2 Jungle | **Jungle Dread-Gorger**, 50%: speed x1.35 plus two snakes and one ape appear instantly | Cast **Predator's Call** for about 1.5s, then apply the existing speed and spawn actions | Jungle roar, brush ripples at add arrival points, permanent `PACK HUNT` state | High; adds stay tracked and must despawn with the boss |
| T2 Mountain | **Stoneplate Juggernaut**, 50%: Earthshatter upgrades and two Peak Archers appear instantly | Cast **Call the Heights** for about 1.5s before both actions | Rock pulse and arrival markers; permanent `GUARDED HEIGHTS` state | Medium-high; this file overlaps the user's T2 work |
| T2 Mountain | Same boss, every 14s: silently gains +25% DR for 4s | Cast **Stoneguard** for 1.0-1.25s before the existing shield window | Existing shield cue plus Wave 1's correctly timed target tile | Medium. Start-to-start cadence must be explicit in tests, and the cast itself lowers boss output |

## 6. Wave 2 - phase callouts and state-only polish

These phases already deepen a named charged attack. Prefer a non-locking callout plus a persistent state marker unless playtest shows that a real pause improves the fight.

| Tier / biome | Boss | Suggested presentation | Priority |
|---|---|---|---|
| T1 Mountain | **Crag Behemoth**, 50% charged-attack damage/cooldown upgrade | **Bedrock Fractures** callout, rock pulse, `EMPOWERED SLAM` state | Medium |
| T1 Swamp | **Grave Toadeater**, 50% faster/wider Bile Pools | **Bog Floods** callout, swamp pulse, `FLOODED BOG` state | Medium |
| T2 Forest | **Apex Timberclaw**, 50% permanent damage/frequency surge | Short 0.8-1.0s **Bloodied Fury** cast if it reads cleanly beside Bestial Frenzy; otherwise a non-locking callout and permanent state | Medium; do not let phase/repeating casts create accidental long queues |
| T2 Swamp | **Mire-Gorged Behemoth**, 50% faster poison cadence and pools | **Mire Overflows** callout plus `OVERFLOWING MIRE` state; no blocking cast by default | Medium |
| T2 Desert | **Dune-Stalker Emperor**, 50% speed x1.3 and stronger/faster Sandburst | Cast **Scouring Momentum** for about 1.25s if the phase remains too abrupt; otherwise callout/state | Medium-high |
| T3 Mountain | **Crag-Gorged Horn-Behemoth**, 50% larger/harder Slam; 25% faster Slam and movement | **Cragbreak** then **Last Stampede** callouts; advance one persistent phase state | Medium |
| T3 Tundra | **Frost-Plated Rime-Mammoth**, 50% stronger/larger Slam; 25% stronger, faster Ice Armor cycle | 50% **Permafrost Deepens** callout; 25% 1.25s **Deep-Freeze Armor** cast before `apply-shield` | Medium-high; barrier visibility itself is already solved by Wave 1 |
| T4 Mountain | **Iron-Crest Titan**, 50% more/harder fault lines; 25% faster/wider sequence and movement | **Faultlines Multiply** then **Titan's Last March** callouts and state progression | Medium; do not add another damaging AoE |
| T4 Tundra | **Glacial Patriarch**, 50% stronger/faster Ice Armor; 25% stronger/faster Collapse | 50% 1.25s **Crown of Rime** cast; 25% **Glacial Collapse Ascendant** callout/state | Medium-high |
| T4 Trench | **Elder Trench Serpent**, 50% stronger/faster Devour; 25% stronger/faster shell plus faster Devour | 50% **Hunger Deepens** callout; 25% 1.25s **Hadal Carapace** cast and state | Medium-high |

The Elder Trench Serpent's ordinary `aoeAttack` is deliberately local: radius 130 at half damage. Keep it. Add a water-ring/body-sweep impact cue so players understand the splash, but do not add a cast bar or expand its radius.

## 7. Wave 3 - ordinary monsters and cadence feedback

Wave 3 is lower priority than boss phase clarity. Most items below should remain mechanically identical.

### 7.1 Jungle combat ramp - feedback only

`Jungle Ape`, `Silverback`, and `Apex Silverback` gain +3% attack per second in combat up to +45%. The ramp is the whole monster identity and should stay passive.

Add a network-visible ramp percentage or coarse stack count and render:

- a subtle rage aura that strengthens in 3-4 readable stages;
- pips or a compact `RAGE` state on the target frame;
- a stronger pulse when the cap is reached;
- an immediate clear when the monster de-aggros and the ramp resets.

Do not emit a cast every second. Avoid dirtying the network slice every tick if a coarse bucket or changed stack count is sufficient.

### 7.2 Named dangerous finishers

| Tier / biome | Monster and live mechanic | Recommendation | Priority |
|---|---|---|---|
| T4 Mountain | **Cragback Rhino**: every 10s its next real attack is x3.2 | Give the armed hit a visible charge state and a 1.2-1.4s **Crushing Gore** wind-up before impact. Keep the “next actual attack” rule so the cooldown is not wasted while idle | High among ordinary monsters |
| T4 Jungle | **Emerald Constrictor**: every fourth attack is x2 and roots for 1.2s | Add a 0.8-1.0s **Constrict** wind-up on the fourth attack, with coils tightening on the target; retain the normal root/Cleanse/tenacity path | High among ordinary monsters |
| T3 Cave | **Crystal Gargoyle**: every third attack becomes a three-hit Crystal Volley | Use the user-authored Thorn Spitter Barrage as the presentation reference. Either add a short 0.6-0.8s **Crystal Volley** charge or show three charge pips plus a bright pre-volley flash if changing cadence is undesirable | Medium |
| T4 Mountain | **Granite Mammoth**: every fourth hit is x2 | Add four-beat pips and a heavier pre-impact tell. A cast is optional and should stay short | Medium |
| T4 Tundra | **Rime-Tusk Mastodon**: every fourth hit is x2 | Same cadence-pip treatment, with frost buildup and a tusk-slam flash | Medium |
| T4 Volcanic | **Obsidian Tortoise**: every fourth hit is x2.2 | Same cadence-pip treatment, with shell cracks/ember buildup before Eruption | Medium |
| T4 Mountain boss | **Iron-Crest Titan**: every fourth ordinary hit is x2 between Earthshatters | Show cadence pips and a heavier impact cue. Do not add a second long cast on top of its existing 2.6s Earthshatter | Medium |

This should be one reusable cadence-feedback feature, not seven bespoke combat systems. Keep `cadenceFinisher` and `cadenceVolley` as the damage authority.

### 7.3 Defensive cycle upgrades

Wave 1 made barrier amount/duration/recharge readable. The remaining work is only the *phase transition that changes future barriers*:

- Frost-Plated Rime-Mammoth: **Deep-Freeze Armor** at 25%.
- Glacial Patriarch: **Crown of Rime** at 50%.
- Elder Trench Serpent: **Hadal Carapace** at 25%.

Do not add a cast to every periodic barrier recharge. The barrier band, activation cue, timer, and reforming countdown already communicate the cycle.

## 8. Mechanics deliberately left passive or unchanged

- Inherent plating, damage reduction, evasion, resistances, movement behavior, and ordinary stat blocks.
- On-hit poison, Sun Mark, plating shred application, slows, and other states already shown on the affected player. Cave's *phase upgrade* needs a cast; each individual shred stack does not.
- Opening Strike, opening volleys, charge-on-aggro, camouflage reveals, and similar engagement traits. Improve their one-time cue only if playtest finds a specific miss.
- T1 Tusked Razorback and T2 Gorging Razortusk Rallying Cry: already in the desired form.
- T1 Gnarled Greatbear and T2 Apex Timberclaw's recurring Bestial Frenzy: already in the desired form. Only Apex Timberclaw's separate 50% phase remains a candidate.
- T3 Cinder-Shell's repeating shell cycle: the shell state and magma consequence are already legible. Only its silent 25% Caldera Vent remains.
- Charnel-Crown Sovereign and Gravewright necromancy: handled in Wave 1.
- Existing named charged attacks and their planted AoE telegraphs. Phase changes may need a callout/state, but the attacks themselves should not be rebuilt.
- On-death hazards and on-death ally empowerment. The source dies at the trigger, so a cast is impossible; use death FX and resulting state feedback.

## 9. Legacy screen-wide slam verification

No active T1-T4 boss currently retains the deprecated instant screen-wide slam pattern.

- Mountain boss impacts are named charged attacks with explicit cast times and local ground footprints.
- Iron-Crest Titan's radial fault lines have a delayed telegraph.
- Elder Trench Serpent is the only active boss with the generic `aoeAttack`, and it is a local radius-130, half-damage body splash. It is not arena-wide and should remain local.
- Large Swamp and Volcanic pools are persistent hazards, not instant arena-wide hits. Their silent *creation* is why Rot Bloom/Caldera casts are the highest remaining priority.
- The deprecated Void Overlord branch is outside the active design table and outside this handoff.

## 10. Recommended implementation order

1. Add the reusable scripted-cast footprint, persistent state marker, and non-locking phase announcement with focused tests.
2. Ship Rot Bloom, Caldera Vent, Caldera Unbound, and Open the Caldera. These remove the most dangerous “hazard appeared under me” failures.
3. Ship the Desert morph casts and Verdant-Crown's Hunt-to-Frenzy cast/state replacement.
4. Ship the Cave corrosion lineage casts, preserving Wave 1's player-facing `CORRODED` tile.
5. Ship Jungle Dread-Gorger and the defended-position T2 Mountain changes only after reconciling the user's current T2 edits.
6. Add the remaining phase callouts/state markers for Mountain, Swamp, Tundra, and Trench.
7. Finish with shared ramp/cadence feedback for ordinary monsters.

The top ten remaining playtest-value targets are:

1. Rot-Spore Croc-Behemoth - Rot Bloom.
2. Caldera Sovereign - Open the Caldera and Caldera Unbound.
3. Dune-Throne Sovereign - both stance transitions.
4. Verdant-Crown Predator - Hunt-to-Frenzy transition.
5. Deep-Core Burrow-Gorger - both corrosion phases.
6. Dune-Carapace Monarch - ranged morph.
7. Cinder-Shell Magma-Salamander - Caldera Vent.
8. Apex Bramble-Slasher - Vanish into Bramble.
9. Obsidian Broodmother/Chitinous Dreadbore - Cave teaching-line phase casts.
10. Jungle Dread-Gorger - Predator's Call.

## 11. Acceptance checklist

### Cast lifecycle

- Cast start emits the correct monster id, label, duration, and cue.
- No nested effect applies before completion.
- The boss is planted and attack-locked only when the action is intentionally a blocking cast.
- Root and `cannotAttack` ownership are released without clearing locks owned by another mechanic.
- Back-to-back threshold/repeating casts queue and resolve in deterministic FIFO order.
- A capped or impossible repeating action does not produce a dead cast forever.
- The cast bar and warning footprint cannot survive death, despawn, reset, or cancellation.
- Decide interruption behavior explicitly. The current generic boss-script cast is a timed lock and is not automatically a hard-CC interruptible ability.

### Hazard casts

- The warning radius equals the final pool radius.
- The preview is planted at cast start and does not chase the boss.
- The pool deals no damage during the warning.
- The pool is created once, on completion, with the exact existing duration/damage/slow values.
- Persistent pools are retired through the existing boss-death cleanup.
- Bot movement/hazard avoidance recognizes the final pool; it should not treat a purely cosmetic state pulse as persistent terrain.

### States and UI

- Timed states show correct remaining/total duration.
- Permanent phase states do not display a fake countdown.
- Superseded stance states are removed rather than stacked indefinitely.
- Barrier, Corroded, boss phase, and cast UI do not cover each other or duplicate one mechanic under multiple names.
- Unknown state ids have a safe fallback, but every shipped encounter state gets intentional label/icon/help metadata.

### Balance verification

- Compare basic-attack opportunities before and after each new blocking cast.
- Record whether repeating cadence is start-to-start or completion-to-start; Wave 1 boss-script repeating timers currently behave start-to-start.
- Test burst damage crossing multiple HP thresholds during an active cast.
- Test whether a boss dying during a phase wind-up is acceptable. Do not add phase invulnerability without an explicit design decision.
- Preserve all nested action numbers for the first playtest; tune only from evidence.

### Commands

```text
pnpm --filter @mmo-idle/shared typecheck
pnpm --filter @mmo-idle/server typecheck
pnpm --filter @mmo-idle/client typecheck
pnpm test
```

Also run focused tests for each new primitive and encounter before the full suite. Recheck the aggregate `pnpm typecheck` caveat above rather than “fixing” unrelated bot probe code.

## 12. File map and worktree warning

| Concern | Primary files |
|---|---|
| Boss definitions | `shared/src/data/monsters/bossesT1.ts` through `bossesT4.ts` |
| Ordinary monster definitions | `shared/src/data/monsters/*.monsters.ts` |
| Boss action schema | `shared/src/data/monsters/types.ts` |
| Runtime boss state | `shared/src/components/targeting/scriptsBoss.ts` |
| Boss script execution | `server/src/systems/combat/ai/bossScripts.ts` |
| Generic monster casts/finishers | `server/src/systems/combat/engine/combat.ts`, `monsterMechanics.ts` |
| Barrier authority | `server/src/systems/combat/engine/enemyBarrierState.ts` |
| Ground-zone authority | `server/src/systems/world/groundZones.ts` |
| Combat events | `shared/src/protocol/combatEvents.ts` |
| Cast and boss cues | `client/src/render/combatFx.ts`, `client/src/render/castBars.ts`, `client/src/fx/bossCues.ts` |
| Target-frame states | `client/src/hud/TargetFrame.tsx`, `targetStatusMeta.ts`, `statusHelp.ts`, `client/src/ui/conceptIcons.ts` |
| Current-state context | `docs/monster-behavior-current-state.md`, `docs/monster-combat-rework-current-state.md`, `docs/boss-encounter-rework-current-state.md` |
| Design authority | `design_docs/boss-design.md` |

The repository was heavily dirty when Wave 1 landed, especially around Tier 2, HUD/tooltips, stances, bots, and monster primitives. Existing changes belong to the user. Before every implementation slice:

1. inspect `git status --short` and the diff for every file to be touched;
2. preserve unrelated edits and current numeric tuning;
3. prefer a narrow patch and focused regression test;
4. never use a reset/checkout operation to clean the worktree.
