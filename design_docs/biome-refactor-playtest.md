# Biome Refactor Playtest Notes

This document tracks the current biome-behavior tuning pass. It is meant to be
updated during playtest sessions so biome identities stay coherent across small
code and balance adjustments.

## Baseline Goals

- Each biome should feel different through monster behavior, not only stat color.
- Ambient spawning is part of biome identity: density, clustering, and spread are
  all tuning knobs.
- Server logic remains authoritative. Client effects should only present server
  events.
- Component presence continues to gate behavior; avoid fake disabled states.

## Rework Methodology

Use this rhythm for future biome passes:

- Start from the intended player lesson. Name what the biome asks the player to
  notice, plan around, or counter with runes/gear/positioning.
- Pick one or two signature pressures, not a grab bag. Make normal mobs,
  standout mobs, terrain, spawning, and rune rewards point at the same idea.
- Separate predictable threats from disruptive threats. Predictable threats can
  use patrols, posts, terrain anchors, or telegraphs; disruptive threats should
  use movement, timing, or target pressure without invalidating the main plan.
- Prefer soft steering before hard rules. Bias spawning, wander targets, approach
  points, and target scoring before adding absolute bans or forced fleeing. Hard
  rules are reserved for true blockers such as collision, death, or impossible
  paths.
- Keep advanced AI bounded. If a behavior might oscillate, make it a small nudge,
  only apply it in one phase of movement, and let normal combat/pathing resume.
- Give the player a tool when the biome teaches a problem. Rune rewards should
  be affordable while learning that biome and should use the matching biome
  essence unless there is a strong reason otherwise.
- Make placeholder terrain and visuals data-shaped. Programmatic geometry and FX
  are fine for playtesting, but they should leave clear seams for later sprites
  or authored art without changing server gameplay.
- Verify behavior with focused smokes. For each pass, test typecheck, collision
  safety when terrain/pathing changed, and one small deterministic or overfilled
  spawn/route sample that proves the behavior actually appears.
- Document playtest questions immediately. If a value is uncertain, leave it as
  a tuning question instead of hiding it in code.

## Shared Ambient Spawning Rules

- Ambient monster spawns avoid live players by `MONSTER_PLAYER_SPAWN_EXCLUSION`
  so replacements do not appear directly on top of active fights.
- General spawn placement samples multiple random positions and prefers the
  emptiest local neighborhood.
- Pack-alpha spawns sample multiple positions and prefer locations away from
  existing same-biome pack centers.
- Pack followers spawn clustered around their alpha and share a server-only
  `inPack` id for aggro propagation.

## Plains

Intent: small mobs should move as loose swarms, forming several small groups
rather than one node-wide herd.

Current tuning:

- `mobDensity`: 24.
- Swarm steering applies while wandering and chasing.
- Swarm groups split by local proximity and are capped around 3-4 mobs.
- Ambient spawning lightly biases new swarm mobs toward existing low-count local
  packs, while refusing to deliberately add to full local packs.
- General dispersal still runs after the pack-bias attempts, so the map keeps
  multiple small clusters instead of one pile.

Known playtest notes:

- Rare 5+ local clusters can still happen through movement overlap. This is
  currently acceptable.

## Forest

Intent: wolf-led predator packs should be the biome's signature pressure. The
forest should feel like a steady spread of small hunting groups, not one blob and
not isolated wolves.

Current tuning:

- `mobDensity`: 18.
- T1 `wolf` is an alpha that spawns with two `young-wolf` followers.
- T2 `ancient-wolf` is an alpha that spawns with two `young-wolf` followers and
  one `canopy-sprite` support follower.
- `young-wolf` currently reuses the regular wolf sprite.
- Pack calls use a short double-ring alert effect rather than the older large
  aggro pulse.
- Followers remain alive after their alpha dies. The old alpha-death follower
  cleanup is disabled; a future scatter/run-away behavior can replace it if it
  becomes desirable.
- Ambient wolf-pack placement prefers positions away from existing same-biome
  pack centers, producing better map coverage.

Rewards added during this pass:

- Forest rune recipe: `Focus Highest HP`.
- The rune unlocks `focus-highest-max-hp`, which targets by maximum HP with only
  a tiny distance tie-breaker. It should not swap just because a target's current
  HP changes.

Open playtest questions:

- Is density 18 enough for a steady stream of packs, or should forest move closer
  to plains density?
- Do follower remnants after alpha death feel good, or should packs scatter,
  lose confidence, or become less aggressive?
- Should young wolves get their own sprite or tint once the behavior feels right?

## Mountain

Intent: mountain should feel like a guarded ascent. The terrain creates ledges
and chokepoints; ranged mobs hold passes and force the player to approach through
openings while heavy melee threats punish bad positioning.

Current tuning:

- Mountain nodes use two complete thin ledge rings: a wider outer ring and a
  smaller inner ring with extra interior space. Nodes pick deterministic
  variants that carve 3-6 side/corner entrances into both rings.
- Inner and outer chokepoint posts are offset from one another so the two rings
  do not create straight-line paired posts.
- `mobDensity`: 12. T1 mountain spawn weighting favors `cliff-hopper` over
  `ridge-archer` so ledge-vault pressure is common and archer posts do not
  saturate the node.
- Ledges block players and monsters for movement/pathing, but projectiles can
  pass over them. This supports the "archers on ledges" fantasy without making
  ranged combat frustratingly line-of-sight blocked.
- Ranged mountain mobs prefer free chokepoint posts on spawn. One ranged holder
  claims each post; extra ranged mobs fall back to normal dispersed spawning.
- Assigned chokepoint holders keep a small runtime `holdPost` and return to it
  when idle, but can still chase within a shortened leash during combat. They
  shoot from the post when in range.
- `cliff-hopper` uses ledge hold posts instead of chokepoint posts, patrols
  short routes along the ledge when idle, and is allowed to vault mountain ledge
  collision. The client presents ledge crossings as a simple sprite hop while
  the shadow stays grounded. Hopper post leashes are wider than archer post
  leashes so their larger detection range has room to resolve.
- `cliff-hopper` has a telegraphed `Strong Kick` charged attack. It deals a
  smaller spike than the archer shot, knocks the player back on a landed hit,
  and respects player collision so it cannot push through ledges. Active Brace
  reduces the knockback distance.
- Extra mountain mobs that cannot claim a chokepoint or ledge post use stronger
  anti-clump spawn and idle-wander scoring so harsh mountain threats stay spread
  out instead of cluttering into one dangerous pile.
- Mountain has no node hazards; the avoid-hazards rune should be a no-op here.
  Player pathing should still route to the nearest walkable point if a target or
  approach point lands too close to ledge collision.

Open playtest questions:

- Are the ledge openings readable enough with the current programmatic
  placeholder? The current system is good enough for gameplay tuning, but it is
  still a rect-segment stand-in; real ledge sprites will probably want authored
  decor pieces mapped onto the same collision/chokepoint data.
- Should melee mountain mobs later gain an explicit ledge-vault/jump behavior,
  or is the first-pass identity stronger if only archers exploit ledges?
- Should specific archer tiers prefer inner versus outer posts?

## Cave

Intent: cave should feel sparse but dangerous. The standout brutes are elite
landmarks with predictable patrol routes, so players can choose when to engage
and avoid pulling several heavy mobs at once.

Current tuning:

- Cave `mobDensity`: 8.
- Cave brute-line monsters (`cave-brute`, `cave-troll`, `cavern-troll`) claim
  separated runtime patrol routes when spawned.
- Patrol route variants include two outer-edge perimeter loops plus vertical and
  horizontal center-cross routes.
- Route starts are kept well apart; if every route is already occupied, extra
  brutes fall back to normal dispersed spawning instead of blocking population
  top-up.
- Runtime patrol routes use absolute node-local waypoints, while older static
  monster-data patrols remain as a fallback.
- `cave-lurker` is the plan-disruptor: faster than before, with short idle
  pauses, a wider roam radius, and erratic wander scoring that avoids sitting on
  brute patrol anchors while still cutting across open space.
- Cave rune recipe: `Careful Pulling`. The rune is a soft pathing preference
  that nudges auto-combat approach destinations away from nearby non-target
  elites instead of fleeing or changing targets.

Open playtest questions:

- Are four brute patrol routes enough for the current cave cap, or should cave
  reduce brute frequency once all patrol slots are occupied?
- Do center-cross brutes create interesting risk without making the cave feel
  randomly unsafe?

## Swamp

Intent: swamp should be an attrition terrain biome. The read is not "can I burst
this pack before it reaches me?" but "can I route cleanly, avoid rot, and survive
stacking poison over time?"

Current tuning:

- `mobDensity`: 10.
- Every swamp node has 4-6 rot pools with varied positions and radii, including
  smaller pools for texture. Pool count does not scale up by tier; higher tiers
  should be harder because of mob pressure and poison, not because the map
  becomes saturated.
- Swamp rot pools are node features that damage and slow players only. Monsters
  ignore their own marsh terrain.
- Rot pool damage scales by node tier: T1 is warning-level, T2 is meaningful,
  T3 is threatening. Damage is mitigated by `defense.dot-resistance`.
- Rot pool DoT refreshes while in contact but ramps stacks on its own tick
  interval, so dipping into a pool starts at low pressure instead of instantly
  jumping to max stacks. Active damaging pool effects also pause passive
  out-of-combat regen so idle pool ticks remain visible and honest.
- Rot pools now render with a programmatic toxic placeholder in active gameplay
  nodes. Real pool sprites can replace this later through `NODE_DECOR` without
  changing hazard geometry.
- Ambient swamp spawning prefers positions near rot-pool edges, then falls back
  to normal dispersed placement. This makes enemies pressure the route choices
  around pools without stacking everything in one place.
- Idle swamp mobs tend to wander around the nearest rot pool to their spawn, so
  they read as marsh inhabitants rather than generic random walkers.
- Swamp rune recipe: `Avoid Hazards`, priced cheaply in purple essence only so
  it is affordable while farming swamp.
- The rune unlocks `avoid-hazards`, a pathing action that makes server pathing
  route around damaging/slowing node features when a route exists.
- If a target stands inside a pool, `Avoid Hazards` moves the player to the pool
  edge on their side and holds there unless they can attack, letting the mob come
  out instead of diving to the center.
- If that edge point still cannot create contact, the player skirts around the
  pool edge instead of standing still.
- Rot pools apply two readable statuses: `swamp-rot` as the stacking DoT and
  `slow` as the movement penalty.

Suggested behavior direction:

- Keep swamp lower-density than plains/forest, but make each encounter drag the
  player through terrain decisions.
- Prefer "lure and corral" spawning over packs: mobs appear near rot-pool edges
  or in lanes that tempt direct paths through pools.
- T1 can stay simple: slow bog bodies plus rot pools. T2 can add ranged hexers or
  stalkers that pressure the player to reposition through bad ground.
- Avoid making swamp another swarm biome. Its identity should be fewer threats,
  longer poison tails, and positional tax.

Open playtest questions:

- Does `Avoid Hazards` feel mandatory in swamp, or like a useful comfort/reward?
- Are 4-6 mixed-size pools enough texture without making the biome feel cramped?
