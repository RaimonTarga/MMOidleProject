# Dungeons — Current State (guarded altar, 2026-08-09)

**Superseded:** `docs/archive/dungeon-gauntlet-current-state.md` (the gauntlet /
pre-encounter system) and `docs/archive/dungeon-gauntlet-implementation-plan.md`
(its original plan). Both are historical.
**Roadmap step:** 13. **Status:** ✅ shipped; every balance number is a placeholder.

Read source when it disagrees with this doc.

---

## 1. What a dungeon is

A dungeon node is **an altar, the biome guardians holding it, and the boss they
are guarding**. Nothing else.

```txt
Player enters / node thaws
  -> the guard spawns at its stations around the altar
  -> the player may clear some, all, or none of it
  -> the player disturbs the altar
  -> every surviving guardian aggroes at once; the boss begins to wake
  -> the boss spawns after a short delay
  -> the boss falls -> short reform cooldown -> a fresh guard
```

The status machine is `idle → bossAwakening → boss → cooldown`. There is no
`active` wave stage: activation goes **straight** to the boss.

Deliberately **not** part of the system:

- no wave/gauntlet phases, kill-count gating, or phase progress,
- no reward for leaving guardians alive, and no penalty beyond fighting them,
- no per-dungeon bonus mechanics (guardian auras, boss empower hooks, extra-add
  hooks, dungeon-spawned rot pools). Those were the gauntlet's per-biome
  identity layer and they are gone.

Guardians grant their **normal monster rewards** whenever they die, before or
after activation. Killing one never advances the trial, and never suppresses
boss respawn.

Bosses are untouched by this rework: they keep their own `bossScript`, their
rewards, quest credit, boss-clear keys and party sharing.

## 2. Shared contract

`shared/src/dungeons/`:

- `dungeonTypes.ts` — `DungeonStatus`, `DungeonAltarDef`, `DungeonMonsterModifiers`,
  `GuardPostureShape`, `GuardGroupDef`, `DungeonGuardDef`, `DungeonBossDef`,
  `DungeonDef`, and the client-facing `DungeonView`.
- `dungeonDatabase.ts` — the `BIOME_GUARD_POSTURE` table, the def generator, and
  `DUNGEON_DEFS` / `getDungeonDef` / `isDungeonNode` / `guardianTotalFor`.

`DungeonView` rides `DeltaSnapshot.dungeon` (node-scoped payload, no networked
component and no allowlist change). Dungeon state is **never persisted**.

## 3. The guard: one posture per biome

Every dungeon of a biome uses the same **posture** at every tier. Only the
roster changes, because it is drawn from that biome/tier's own ambient monster
pool — so tier difficulty comes from the mobs themselves, not from piling on more
bodies.

Each posture maps onto an already-shipped biome-ecology primitive. There is no
dungeon-only AI.

| Shape | Ecology primitive | Reads as |
|-------|-------------------|----------|
| `pack` | `inPack` + call-allies + alpha-scatter (`ai/packs.ts`), on a small local mill loop | leader with its entourage, milling at its station |
| `patrol` | `holdPatrol` on the authored altar orbit (absolute waypoints, phase-offset per station) | solo sentinels circling the altar in formation |
| `post-hold` | `holdPost` with no route | solo sentries standing their ground |

**Every** guardian gets `controlsMonster.holdPost` (its station) and
`wanderRadius = 0`. That is load-bearing, not incidental: it takes guardians off
the random-wander path, which several biomes override with node-wide targets that
ignore `wanderRadius` (swamp mobs head for the nearest pool, cave lurkers for the
nearest wall). A guardian on a hold post also *returns* to its station rather
than to its leash anchor. Pack members each mill on their own 4-point loop around
their own post, so a station reads as a loose group rather than a column.

| Biome | Shape | Stations | Guard label |
|-------|-------|----------|-------------|
| plains | pack | 3 | Guarding Herds |
| forest | pack | 3 | Guarding Packs |
| swamp | pack | 3 | Mire Watch |
| jungle | pack | 3 | Canopy Watch |
| volcanic | pack | 3 | Ember Watch |
| graveyard | pack | 3 | Grave Watch |
| cave | patrol | 3 | Deep Watch |
| tundra | patrol | 3 | Frost Watch |
| mountain | post-hold | 4 | Stone Watch |
| desert | post-hold | 3 | Dune Watch |
| trench | post-hold | 2 | Abyssal Watch |

All 26 dungeon nodes (T1–T4) generate a def. The Void Overlord throne is
excluded and keeps its own ultimate-encounter system.

### Roster derivation

Deterministic, so a node re-thaws with the same guard:

1. Take the biome/tier's `monsterPoolByTier`, deduped.
2. For a `pack` station, the leader is the pool's own **pack alpha** if it has
   one. Otherwise (and for the solo shapes) the leader is the pool's toughest
   entry by `hp × attack`.
3. If that alpha has an authored `pack.followers` entourage in the monster
   database, that entourage **is** the station's followers — the biome's own
   answer to what this creature travels with. Forest fields `wolf` + 2
   `young-wolf`; plains T2 fields `prairie-wolf` + 3 `plains-slime`.
4. Otherwise the posture synthesizes `followersPerGroup` bodies by cycling the
   remaining pool, offset by station index so neighbouring stations differ.

### Identity

- **Leaders** are renamed to the biome guardian name ("Stone Warden", "Cave
  Sentinel"). Followers keep their own names.
- **Every** guardian gets the biome's `DungeonMonsterModifiers` — this is the
  dungeon's whole difficulty layer, and what replaced the old blanket
  `×2 HP / ×1.6 ATK` dungeon scaling. `createMonster` still applies that blanket
  scaling to *non*-guarded-altar dungeon nodes only.
- Killing a pack leader scatters its followers, exactly as in the open world
  (`onPackAlphaDead`). That is the shipped ecology and it is the system's only
  target-priority lesson — no bespoke aura needed.

## 4. The tether

Guardians protect the altar and nothing else, so they cannot be kited across the
node. `GUARD_CHASE_MARGIN` (320 px) is the whole tether budget:

- `pack` / `post-hold` — `controlsMonster.spawn` is the **station**, leash =
  `GUARD_CHASE_MARGIN`. This is the same anchor semantics as a monster's ambient
  leash, and it is materially tighter (mountain ambient is 600–640).
- `patrol` — `controlsMonster.spawn` is the **altar**, leash =
  `ringRadius + GUARD_CHASE_MARGIN`, because the whole orbit is the territory.
  A sentinel may cross the ring but can never leave it.

`holdPost` (the station) is what a disengaged guardian returns to, so the leash
anchor never doubles as a huddle point at the altar.

Idle `pullRange` is capped per posture (`Math.min` with the monster's own), so a
guardian never detects further than its ambient counterpart. Cave keeps its
240 px overpull identity.

On activation the tether is dropped: leash goes to `ENGAGED_LEASH_RADIUS`
(3600), `holdPost`/`holdPatrol` are cleared, and every survivor takes the nearest
player as its target.

## 5. Server

`server/src/systems/world/dungeons/dungeon.ts` is the whole system:

- `DungeonState` — `{ status, guardianIds, guardiansEngaged, bossMonsterId,
  participantPlayerIds, timers }`, keyed by node id on `world.dungeons`.
- `ensureDungeon` / `resetDungeon` / `clearDungeonRuntime` / `tickDungeons`.
- `activateDungeonAltar(world, player)` — validates idle + in altar radius, then
  engages the guard and starts the awakening.
- `onDungeonMonsterRewarded` — guardian death is bookkeeping only; boss death
  completes the dungeon and returns `suppressBossRespawn`.
- `resetDungeonIfNodeWiped` — failure is a **node wipe**, not a participant
  death: the dungeon resets only when no live player remains in the node.
- `buildDungeonView`, `initDungeonCombatHooks` (participant tracking only).

`TracksDungeon` (`server/src/ecs/entity.ts`) is server-only and carries just
`source: "dungeonGuardian" | "dungeonBoss"`, the node id, the guard group id, the
guard post, the leash and the injected `openingStrikeMult`.

Gating elsewhere: `ensurePopulation` and `ensureBoss` both early-return for
`isDungeonNode(nodeId)`, so a dungeon runs no ambient spawning and maintains no
standing boss.

### Reset paths

| Trigger | Result |
|---------|--------|
| Boss death | cooldown; leftover guardians despawn; cooldown expiry reforms the guard |
| Node wipe (no live players) | immediate reset to idle with a fresh guard |
| Node freeze | runtime discarded; thaw rebuilds a fresh idle guard |
| Pre-clear timeout (90 s after the last guardian kill, altar untouched) | the guard reforms |

## 6. Client

- `DeltaSnapshot.dungeon` → `dungeonAtom` (`client/src/hud/atoms.ts`).
- `DungeonAltarOverlay.tsx` — guard label + living/total count, and the
  "Disturb the Altar" button (activation, awakening countdown, cooldown).
- `altarPrompt.ts` / `scenes/game/dungeonAltar.ts` — the in-world Enter prompt.
- `deltaApplier.ts` puts `dungeon.guardianMonsterIds` into
  `state.dungeonGuardianIds`, which `render/monsters.ts` uses for the gold guardian
  outline.
- `scenes/game/overlays.ts` places the biome altar art at `def.altar`.

`client/src/render/dungeonHazards.ts` was deleted with the swamp rot pools. The
unrelated `render/groundZones.ts` (charged-slam telegraphs) is untouched.

## 7. Balance status

**Every number in `BIOME_GUARD_POSTURE` is a placeholder** — station counts,
follower counts, ring radii, pull ranges, and the guardian stat modifiers. They
were carried over from the gauntlet's per-biome guardian modifiers and sized off
each biome's density identity, not off a balance pass.

Known items for the balance/playtest pass:

- Volcanic T3 now fields 3 `magma-brute` leaders; the old wave data deliberately
  excluded that mob as the heaviest elite.
- Graveyard fields a `gravewright` follower per station, so a dungeon guard can
  raise the player's own kills (`raisesDead`). Ecology-correct, untuned.
- `GUARD_CHASE_MARGIN`, `ENGAGED_LEASH_RADIUS`, `DUNGEON_SUCCESS_COOLDOWN_MS`
  (60 s), `DUNGEON_BOSS_AWAKENING_DELAY_MS` (7 s) and
  `DUNGEON_IDLE_PRECLEAR_RESET_MS` (90 s) are all unvalidated.

## 8. Extending

`DUNGEON_CONTENT_BY_NODE` (`dungeonDatabase.ts`) is the per-node override hook —
it can override the posture, boss, or timers for one dungeon that should diverge
from its biome. It is intentionally **empty**: the biome posture is meant to be
the authoring surface, and a node override is the exception.

Pinned by `server/test/dungeons.test.ts`.
