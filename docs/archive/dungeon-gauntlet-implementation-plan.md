> **ARCHIVED (2026-07-07) — HISTORICAL.** Implemented; live state in `docs/dungeon-current-state-and-gauntlet-plan.md`. Kept for design rationale — do not treat as current.

# Dungeon Gauntlet Rework — Implementation Plan

## Purpose

Rework dungeon nodes from “normal node + stronger mobs + standing boss” into short, shared gauntlet challenges.

The dungeon should feel like the place where the player actually pays attention. Regular nodes are for long unattended farming; dungeon nodes are compact progression checks with a deliberate start, fixed enemy waves, and a boss at the end.

Core idea:

> A dungeon node contains a generic altar and a fixed set of guardians. The guardians can be killed before activation, or the player can activate the altar and fight the surviving guardians as phase 1. Clearing all gauntlet phases spawns the boss. Defeating the boss completes the dungeon and starts a short altar respawn cooldown.

---

## Locked Design Decisions

### 1. Manual altar activation

The gauntlet starts only when a player is close to the altar and presses an interaction button.

This is acceptable even though combat is fully automatic because dungeon activation is a world interaction, not combat micro. Dungeons are intended to be the part of the game where the player pays attention.

Future option:

- Add a rune / automation rule later that can activate dungeon altars automatically for players who want dungeon farming loops.

### 2. Mobile-friendly altar interaction

When a player is inside the altar activation radius, show a large mobile-friendly button.

Requirements:

- Large touch target, at least 48px tall.
- Bottom-center or lower UI placement, not tiny text near the altar.
- Works with mouse, touch, and keyboard/controller equivalent if applicable.
- Button text should reflect current altar state.

Example button states:

```txt
Begin Trial
Trial in Progress
Boss Awakened
Altar Reforming... 12s
Move Closer to Altar
```

### 3. Guardians are targetable before altar activation

Dungeon guardians exist before the gauntlet starts.

They are real monsters, not just visuals.

The player can choose between two approaches:

#### Safer approach

Clear some or all guardians before activating the altar.

Result:

- Fewer guardians remain for phase 1.
- If all guardians are dead, phase 1 is skipped.
- The player spends more time but reduces burst difficulty.

#### Faster / harder approach

Run to the altar and activate immediately.

Result:

- All surviving guardians awaken as phase 1.
- The player fights the full guard pack at once.
- Faster, but more dangerous.

This makes the dungeon’s first layer a player-controlled difficulty lever without adding menus, random modifiers, or explicit difficulty modes.

### 4. Guardians are fixed, tethered, and non-wandering

Guardians should not behave like normal ambient mobs.

Rules:

- Spawn in fixed positions around / near the altar.
- Do not wander.
- Do not respawn endlessly.
- Do not chase players far across the node.
- Do not pursue players into the altar’s inner safe/activation area, if that area exists.
- Leash back to their guard post if dragged too far.

The goal is to make them feel like altar protectors, not regular farm mobs.

### 5. Dungeon resets on failure

A dungeon challenge must be completed as one clean run.

Failure reset conditions:

- A participating player dies during the active gauntlet or boss phase.
- The node freezes / unloads because nobody is present.
- Optional safety: reset if the gauntlet is active for too long with no progress.

For MVP, define “participating player” as:

- The player who activated the altar.
- Any player who damages a gauntlet monster or boss.
- Any player damaged by a gauntlet monster or boss.

If any participating player dies during `active` or `boss`, reset the dungeon.

This is intentionally stricter than open-world combat. Dungeons are short challenges, not long instances.

### 6. Fixed spawns only

Dungeon phases do not use endless ambient respawns.

Each phase has a fixed number of enemies.

Example:

```txt
Phase 1: 4 guardians
Phase 2: 5 cross-shape enemies
Boss: 1 boss
```

When the phase’s required kills are reached, advance to the next phase.

### 7. Boss is not maintained as a standing spawn

Current behavior to remove:

```txt
Dungeon boss exists in the middle and respawns every 30 seconds.
```

New behavior:

```txt
Boss only spawns after the final gauntlet phase clears.
```

The boss should be gated behind gauntlet completion.

### 8. Short altar respawn after success

After the boss dies:

- Complete the dungeon.
- Award the boss kill / tier quest credit.
- Start a short altar cooldown.
- After 10–15 seconds, the altar becomes active again and guardians respawn.

Recommended MVP value:

```ts
const DUNGEON_SUCCESS_COOLDOWN_MS = 12_000;
```

---

## High-Level Dungeon Flow

### Idle state

```txt
Dungeon node loaded
↓
Altar exists
↓
Guardians spawn at fixed positions
↓
Player can either fight guardians or activate altar
```

### Pre-clear path

```txt
Player kills some/all guardians before activation
↓
Player activates altar
↓
Only surviving guardians become phase 1
↓
If no guardians survive, skip phase 1
```

### Immediate activation path

```txt
Player enters altar radius
↓
Player presses Begin Trial
↓
All surviving guardians awaken as phase 1
↓
Phase 1 starts immediately
```

### Completion path

```txt
Phase 1 clears
↓
Phase 2 clears, if present
↓
Final phase clears
↓
Boss spawns
↓
Boss dies
↓
Dungeon complete
↓
Altar cooldown, 10–15 seconds
↓
Reset to idle
```

### Failure path

```txt
Player dies during gauntlet/boss
↓
Gauntlet monsters and boss are cleaned up
↓
Dungeon resets
↓
Guardians respawn
↓
Altar becomes idle again
```

---

## Recommended Tier Structure

### T1

Very short. Teaches the system.

```txt
Guardians / Phase 1: 3–4 enemies
Boss
```

Target duration:

```txt
30–60 seconds
```

### T2

Adds a cross-shape wave.

```txt
Phase 1: guardians, home biome shape
Phase 2: cross-shape wave
Boss
```

Target duration:

```txt
1–2 minutes
```

### T3

Adds a movement / range / charge-kite test.

```txt
Phase 1: guardians, home biome shape
Phase 2: cross-shape wave
Phase 3: range or behavior-toggle wave
Boss
```

Target duration:

```txt
2–3 minutes
```

### T4

Adds a defense / weapon matchup wave.

```txt
Phase 1: guardians, home biome shape
Phase 2: cross-shape wave
Phase 3: range or behavior-toggle wave
Phase 4: defense/matchup wave
Boss
```

Target duration:

```txt
3–4 minutes
```

### T5+

Later, replace generic waves with authored packs.

Do not implement this yet.

---

## Runtime State Model

```ts
export type GauntletStatus =
  | 'idle'
  | 'active'
  | 'boss'
  | 'cooldown';

export interface GauntletState {
  nodeId: string;
  status: GauntletStatus;

  phaseIndex: number;
  killsInPhase: number;

  /** Idle guardians currently alive before altar activation. */
  idleGuardianIds: string[];

  /** Active gauntlet monsters for the current phase. */
  activeMonsterIds: string[];

  /** Current boss monster id, if boss phase is active. */
  bossMonsterId?: string;

  /** Players currently considered part of this gauntlet attempt. */
  participantPlayerIds: Set<string>;

  startedAtMs?: number;
  startedByPlayerId?: string;
  cooldownEndsAtMs?: number;

  /** Optional: used to reset abandoned pre-clears. */
  lastIdleGuardianKillAtMs?: number;
}
```

Notes:

- Runtime-only.
- Do not persist gauntlet state.
- Reset on node freeze/thaw.
- Keep persistent boss-clear flags separate from runtime gauntlet state.

---

## Static Definition Model

```ts
export interface DungeonGauntletDef {
  nodeId: string;
  biomeGroup: string;
  biomeTier: number;

  altar: DungeonAltarDef;

  /** Cooldown after successful boss kill. */
  successCooldownMs: number;

  /** Optional timeout for abandoned pre-cleared guardians. */
  idlePreclearResetMs?: number;

  /** The first phase doubles as the idle guardian set. */
  guardianPhase: GauntletPhaseDef;

  /** Extra phases after guardians. T1 can be empty. */
  phases: GauntletPhaseDef[];

  boss: GauntletBossDef;
}

export interface DungeonAltarDef {
  x: number;
  y: number;
  activationRadius: number;

  /** Optional area guardians should not chase into. */
  innerSafeRadius?: number;
}

export interface GauntletPhaseDef {
  id: string;
  label: string;

  requiredKills: number;
  maxAlive: number;

  spawnPattern: 'altar-ring' | 'near-altar' | 'wide-ring' | 'fixed-points';

  fixedSpawnPoints?: Array<{ x: number; y: number }>;

  monsterPool: DungeonMonsterPoolEntry[];

  modifiers?: DungeonMonsterModifiers;
}

export interface DungeonMonsterPoolEntry {
  monsterId: string;
  weight: number;
}

export interface DungeonMonsterModifiers {
  hpMult?: number;
  atkMult?: number;
  attackSpeedMult?: number;
  moveSpeedMult?: number;
  dotDamageMult?: number;
  armorMult?: number;
  drAdd?: number;
}

export interface GauntletBossDef {
  bossId: string;
  spawnAt: 'altar' | 'fixed-point';
  fixedSpawnPoint?: { x: number; y: number };
}
```

---

## Monster Source Tags

Dungeon monsters need clear source tags so normal spawner logic, boss logic, rewards, and gauntlet progress do not conflict.

```ts
export type MonsterSource =
  | 'ambient'
  | 'boss'
  | 'idleDungeonGuardian'
  | 'gauntletPhase'
  | 'gauntletBoss';

export interface MonsterRuntimeMeta {
  source: MonsterSource;

  dungeonNodeId?: string;
  gauntletPhaseIndex?: number;
  gauntletPhaseId?: string;

  /** For idle guardians. */
  guardPost?: { x: number; y: number };
  leashRadius?: number;
  forbiddenChaseRadiusAroundAltar?: number;
}
```

Important rules:

- Idle guardians use `source: 'idleDungeonGuardian'`.
- Activated phase enemies use `source: 'gauntletPhase'`.
- Dungeon boss uses `source: 'gauntletBoss'`.
- Do not let existing `ensureBoss()` maintain dungeon bosses independently.

---

## Server Implementation Plan

### Step 1 — Disable normal dungeon boss maintenance

Current dungeon boss behavior should be removed or gated.

Old behavior:

```ts
if (node.isDungeon) {
  ensureBoss(node);
}
```

New behavior:

```ts
if (node.isDungeon) {
  runDungeonGauntlet(node);
} else {
  runNormalSpawner(node);
  ensureBossIfNeeded(node);
}
```

Dungeon boss spawning should only happen after final gauntlet phase completion.

---

### Step 2 — Disable normal ambient spawning in dungeon nodes

Dungeon nodes should not run normal ambient biome spawning for MVP.

Instead, dungeon combat comes from:

1. Idle guardians.
2. Gauntlet phases.
3. Gauntlet boss.

This keeps the dungeon readable and prevents random mobs from interfering with the altar challenge.

---

### Step 3 — Initialize gauntlet state on node load/thaw

```ts
function initDungeonGauntlet(node: WorldNode) {
  const def = getDungeonGauntletDef(node.id);

  node.gauntletState = {
    nodeId: node.id,
    status: 'idle',
    phaseIndex: 0,
    killsInPhase: 0,
    idleGuardianIds: [],
    activeMonsterIds: [],
    participantPlayerIds: new Set(),
  };

  spawnIdleGuardians(node, def);
}
```

---

### Step 4 — Spawn idle guardians

The `guardianPhase` defines the idle guardian set.

```ts
function spawnIdleGuardians(node: WorldNode, def: DungeonGauntletDef) {
  const state = node.gauntletState;
  const phase = def.guardianPhase;

  const spawnPoints = resolveSpawnPoints(def.altar, phase);

  for (let i = 0; i < phase.requiredKills; i++) {
    const point = spawnPoints[i];
    const monster = spawnDungeonMonster(node, phase.monsterPool, phase.modifiers, {
      source: 'idleDungeonGuardian',
      dungeonNodeId: node.id,
      guardPost: point,
      leashRadius: 160,
      forbiddenChaseRadiusAroundAltar: def.altar.innerSafeRadius ?? 0,
    });

    monster.x = point.x;
    monster.y = point.y;

    state.idleGuardianIds.push(monster.id);
  }
}
```

Idle guardian behavior:

```ts
if (monster.source === 'idleDungeonGuardian') {
  disableWander(monster);
  enforceLeashToGuardPost(monster);
  preventChaseIntoAltarInnerRadius(monster);
}
```

---

### Step 5 — Handle idle guardian death before activation

Idle guardian deaths do not advance gauntlet phases because the gauntlet has not started yet.

They simply reduce the number of enemies that will appear in phase 1.

```ts
function onMonsterDeath(monster: Monster, killer?: Player) {
  if (monster.source === 'idleDungeonGuardian') {
    const state = getGauntletState(monster.dungeonNodeId);

    removeId(state.idleGuardianIds, monster.id);
    state.lastIdleGuardianKillAtMs = nowMs();

    return;
  }

  // Other death handling...
}
```

Optional abandoned pre-clear reset:

```ts
function tickIdlePreclearReset(node: WorldNode, now: number) {
  const def = getDungeonGauntletDef(node.id);
  const state = node.gauntletState;

  if (state.status !== 'idle') return;
  if (!def.idlePreclearResetMs) return;
  if (!state.lastIdleGuardianKillAtMs) return;

  const elapsed = now - state.lastIdleGuardianKillAtMs;

  if (elapsed >= def.idlePreclearResetMs) {
    resetGauntletToIdle(node);
  }
}
```

Recommended MVP value:

```ts
idlePreclearResetMs: 90_000
```

This prevents a dungeon from staying half-cleared forever if someone kills the guardians and leaves.

---

### Step 6 — Add altar activation

Validation:

```ts
function canActivateDungeonAltar(player: Player, node: WorldNode): boolean {
  const def = getDungeonGauntletDef(node.id);
  const state = node.gauntletState;

  if (!node.isDungeon) return false;
  if (state.status !== 'idle') return false;
  if (!isPlayerNear(player, def.altar, def.altar.activationRadius)) return false;

  return true;
}
```

Activation:

```ts
function activateDungeonAltar(player: Player, node: WorldNode) {
  if (!canActivateDungeonAltar(player, node)) return;

  const state = node.gauntletState;

  state.status = 'active';
  state.phaseIndex = 0;
  state.killsInPhase = 0;
  state.startedAtMs = nowMs();
  state.startedByPlayerId = player.id;
  state.participantPlayerIds.add(player.id);

  convertSurvivingGuardiansToPhaseOne(node);
}
```

---

### Step 7 — Convert surviving guardians into phase 1

If any idle guardians remain, they become the active first phase.

```ts
function convertSurvivingGuardiansToPhaseOne(node: WorldNode) {
  const def = getDungeonGauntletDef(node.id);
  const state = node.gauntletState;
  const phase = def.guardianPhase;

  const survivingGuardianIds = [...state.idleGuardianIds]
    .filter(id => monsterExists(id));

  state.idleGuardianIds = [];

  if (survivingGuardianIds.length === 0) {
    advanceAfterGuardianPhase(node);
    return;
  }

  state.activeMonsterIds = survivingGuardianIds;
  state.killsInPhase = 0;

  for (const monsterId of survivingGuardianIds) {
    const monster = getMonster(monsterId);
    if (!monster) continue;

    monster.source = 'gauntletPhase';
    monster.dungeonNodeId = node.id;
    monster.gauntletPhaseIndex = 0;
    monster.gauntletPhaseId = phase.id;

    // Optional: remove or loosen leash once trial starts.
    monster.leashRadius = 240;

    applyDungeonPhaseModifiers(monster, phase.modifiers);
  }

  emitDungeonEvent(node.id, 'gauntlet_started', {
    phaseLabel: phase.label,
    remainingGuardians: survivingGuardianIds.length,
  });
}
```

`guardianPhase.requiredKills` should be interpreted carefully here.

For phase 1 after pre-clearing:

```ts
currentRequiredKills = state.activeMonsterIds.length;
```

Not the original full guardian count.

That means:

- 4 guardians spawned.
- Player kills 2 before activation.
- 2 guardians remain.
- Phase 1 requires 2 kills.

---

### Step 8 — Advance after guardian phase

After guardian phase clears, move into extra phases or boss.

```ts
function advanceAfterGuardianPhase(node: WorldNode) {
  const def = getDungeonGauntletDef(node.id);
  const state = node.gauntletState;

  if (def.phases.length > 0) {
    state.phaseIndex = 1;
    spawnGauntletPhase(node, def.phases[0]);
    return;
  }

  spawnGauntletBoss(node, def.boss);
}
```

Important indexing convention:

- `phaseIndex = 0` means guardian phase.
- `def.phases[0]` is the first post-guardian phase.
- For display, total phases = `1 + def.phases.length`, unless guardian phase was skipped.

---

### Step 9 — Spawn normal gauntlet phases

```ts
function spawnGauntletPhase(node: WorldNode, phase: GauntletPhaseDef) {
  const state = node.gauntletState;

  state.status = 'active';
  state.killsInPhase = 0;
  state.activeMonsterIds = [];

  const spawnPoints = resolveSpawnPoints(getDungeonGauntletDef(node.id).altar, phase);

  for (let i = 0; i < phase.maxAlive; i++) {
    const point = spawnPoints[i];

    const monster = spawnDungeonMonster(node, phase.monsterPool, phase.modifiers, {
      source: 'gauntletPhase',
      dungeonNodeId: node.id,
      gauntletPhaseIndex: state.phaseIndex,
      gauntletPhaseId: phase.id,
    });

    monster.x = point.x;
    monster.y = point.y;

    state.activeMonsterIds.push(monster.id);
  }

  emitDungeonEvent(node.id, 'gauntlet_phase_started', {
    phaseIndex: state.phaseIndex,
    phaseLabel: phase.label,
    requiredKills: phase.requiredKills,
  });
}
```

For MVP, prefer:

```ts
phase.maxAlive === phase.requiredKills
```

Do not implement sub-spawning or refill logic yet unless needed later.

---

### Step 10 — Handle gauntlet monster death

```ts
function onGauntletMonsterDeath(monster: Monster, killer?: Player) {
  const node = getNode(monster.dungeonNodeId);
  const state = node.gauntletState;

  removeId(state.activeMonsterIds, monster.id);
  state.killsInPhase += 1;

  if (killer) {
    state.participantPlayerIds.add(killer.id);
  }

  const requiredKills = getCurrentPhaseRequiredKills(node);

  emitDungeonEvent(node.id, 'gauntlet_progress', {
    kills: state.killsInPhase,
    requiredKills,
  });

  if (state.killsInPhase >= requiredKills) {
    advanceGauntlet(node);
  }
}
```

Current phase required kills:

```ts
function getCurrentPhaseRequiredKills(node: WorldNode): number {
  const state = node.gauntletState;
  const def = getDungeonGauntletDef(node.id);

  if (state.phaseIndex === 0) {
    // After pre-clearing, phase 1 only requires surviving guardians.
    return state.activeMonsterIds.length + state.killsInPhase;
  }

  const postGuardianPhase = def.phases[state.phaseIndex - 1];
  return postGuardianPhase.requiredKills;
}
```

Alternative implementation:

Store `requiredKillsForCurrentPhase` directly in runtime state to avoid recomputing it.

Recommended:

```ts
export interface GauntletState {
  // ...
  requiredKillsForCurrentPhase: number;
}
```

This is cleaner.

---

### Step 11 — Advance gauntlet

```ts
function advanceGauntlet(node: WorldNode) {
  const def = getDungeonGauntletDef(node.id);
  const state = node.gauntletState;

  state.activeMonsterIds = [];
  state.killsInPhase = 0;

  if (state.phaseIndex === 0) {
    if (def.phases.length > 0) {
      state.phaseIndex = 1;
      spawnGauntletPhase(node, def.phases[0]);
      return;
    }

    spawnGauntletBoss(node, def.boss);
    return;
  }

  const nextPostGuardianIndex = state.phaseIndex;
  const nextPhase = def.phases[nextPostGuardianIndex];

  if (nextPhase) {
    state.phaseIndex += 1;
    spawnGauntletPhase(node, nextPhase);
    return;
  }

  spawnGauntletBoss(node, def.boss);
}
```

---

### Step 12 — Spawn boss after final phase

```ts
function spawnGauntletBoss(node: WorldNode, bossDef: GauntletBossDef) {
  const def = getDungeonGauntletDef(node.id);
  const state = node.gauntletState;

  state.status = 'boss';
  state.killsInPhase = 0;
  state.activeMonsterIds = [];

  const point = bossDef.spawnAt === 'altar'
    ? { x: def.altar.x, y: def.altar.y }
    : bossDef.fixedSpawnPoint!;

  const boss = spawnBossMonster(node, bossDef.bossId, {
    source: 'gauntletBoss',
    dungeonNodeId: node.id,
  });

  boss.x = point.x;
  boss.y = point.y;

  state.bossMonsterId = boss.id;

  emitDungeonEvent(node.id, 'gauntlet_boss_spawned', {
    bossId: bossDef.bossId,
  });
}
```

---

### Step 13 — Complete dungeon on boss death

```ts
function onGauntletBossDeath(monster: Monster, killer?: Player) {
  const node = getNode(monster.dungeonNodeId);
  const def = getDungeonGauntletDef(node.id);
  const state = node.gauntletState;

  if (killer) {
    state.participantPlayerIds.add(killer.id);
  }

  awardDungeonBossCompletion(node, monster, state.participantPlayerIds);

  state.status = 'cooldown';
  state.phaseIndex = 0;
  state.killsInPhase = 0;
  state.activeMonsterIds = [];
  state.idleGuardianIds = [];
  state.bossMonsterId = undefined;
  state.cooldownEndsAtMs = nowMs() + def.successCooldownMs;

  emitDungeonEvent(node.id, 'gauntlet_completed', {
    cooldownMs: def.successCooldownMs,
  });
}
```

Completion rewards for MVP:

- Preserve existing boss kill / tier quest credit.
- Preserve existing boss XP / essence if applicable.
- Do not add relics, runes, cosmetics, or special rewards yet.

---

### Step 14 — Cooldown and reset after success

```ts
function tickDungeonCooldown(node: WorldNode, now: number) {
  const state = node.gauntletState;

  if (state.status !== 'cooldown') return;
  if (!state.cooldownEndsAtMs) return;
  if (now < state.cooldownEndsAtMs) return;

  resetGauntletToIdle(node);
}
```

---

### Step 15 — Reset on player death

```ts
function onPlayerDeath(player: Player) {
  const node = getPlayerNode(player);
  if (!node?.isDungeon) return;

  const state = node.gauntletState;
  if (!state) return;

  const isActiveAttempt = state.status === 'active' || state.status === 'boss';
  if (!isActiveAttempt) return;

  const wasParticipant = state.participantPlayerIds.has(player.id);
  if (!wasParticipant) return;

  resetGauntletToIdle(node, {
    reason: 'participant_death',
  });
}
```

This makes dungeons stricter than open-world farming.

If this feels too punishing in multiplayer later, change the rule to:

```txt
Reset only when all participating players are dead or have left the node.
```

But the MVP should use the stricter reset rule because the dungeon is short and intended as a clean challenge.

---

### Step 16 — Reset function

```ts
function resetGauntletToIdle(
  node: WorldNode,
  options?: { reason?: string }
) {
  const def = getDungeonGauntletDef(node.id);
  const state = node.gauntletState;

  despawnMonsters(state.idleGuardianIds);
  despawnMonsters(state.activeMonsterIds);

  if (state.bossMonsterId) {
    despawnMonster(state.bossMonsterId);
  }

  node.gauntletState = {
    nodeId: node.id,
    status: 'idle',
    phaseIndex: 0,
    killsInPhase: 0,
    idleGuardianIds: [],
    activeMonsterIds: [],
    participantPlayerIds: new Set(),
  };

  spawnIdleGuardians(node, def);

  emitDungeonEvent(node.id, 'gauntlet_reset', {
    reason: options?.reason ?? 'reset',
  });
}
```

---

## Participant Tracking

Add participants when:

- A player activates the altar.
- A player damages a gauntlet phase monster.
- A player damages the gauntlet boss.
- A player is damaged by a gauntlet phase monster.
- A player is damaged by the gauntlet boss.

```ts
function markGauntletParticipant(node: WorldNode, playerId: string) {
  if (!node.isDungeon) return;

  const state = node.gauntletState;
  if (!state) return;

  if (state.status !== 'active' && state.status !== 'boss') return;

  state.participantPlayerIds.add(playerId);
}
```

---

## Client / UI Implementation

### 1. Altar button

Show when:

- Player is in a dungeon node.
- Player is near altar activation radius, or close enough that guidance is useful.

Button labels:

```ts
function getAltarButtonLabel(state: GauntletState): string {
  switch (state.status) {
    case 'idle':
      return 'Begin Trial';
    case 'active':
      return 'Trial in Progress';
    case 'boss':
      return 'Boss Awakened';
    case 'cooldown':
      return 'Altar Reforming...';
  }
}
```

Mobile UI requirements:

- Large button.
- Easy to tap with thumb.
- Do not place near tiny monster labels.
- Disable button rather than hiding it during cooldown if player is nearby.
- Include countdown during cooldown.

Example:

```txt
[ Begin Trial ]
```

Cooldown:

```txt
[ Altar Reforming... 9s ]
```

### 2. Guardian status text

When idle:

```txt
Guardians remaining: 3 / 4
Clear them first for a safer trial, or activate now to fight them together.
```

Keep this compact on mobile.

Mobile version:

```txt
3/4 guardians remain
```

### 3. Phase progress strip

When active:

```txt
Stone Guards: 2 / 4 defeated
```

Post-guardian phase:

```txt
Venom Ambushers: 3 / 5 defeated
```

Boss:

```txt
Boss awakened
```

### 4. World event messages

Examples:

```txt
The guardians awaken.
```

```txt
The second wave emerges.
```

```txt
The boss stirs.
```

```txt
The dungeon is complete.
```

```txt
The trial resets.
```

---

## First Content Pass

Implement one pilot dungeon first.

Recommended pilot: Mountain T1.

Reason:

- Mountain identity is easy to express.
- Slow, hard-hitting guardians are readable.
- The boss check is straightforward.

### Example: Mountain T1

```ts
export const MOUNTAIN_T1_GAUNTLET: DungeonGauntletDef = {
  nodeId: 'node-id-here',
  biomeGroup: 'mountain',
  biomeTier: 1,

  altar: {
    x: 0,
    y: 0,
    activationRadius: 96,
    innerSafeRadius: 64,
  },

  successCooldownMs: 12_000,
  idlePreclearResetMs: 90_000,

  guardianPhase: {
    id: 'stone-guardians',
    label: 'Stone Guardians',
    requiredKills: 4,
    maxAlive: 4,
    spawnPattern: 'altar-ring',
    monsterPool: [
      {
        monsterId: 'mountain-t1-guardian',
        weight: 1,
      },
    ],
    modifiers: {
      hpMult: 1.15,
      atkMult: 1.35,
      moveSpeedMult: 0.85,
    },
  },

  phases: [],

  boss: {
    bossId: 'mountain-t1-boss',
    spawnAt: 'altar',
  },
};
```

### Example T1 biome modifiers

Use these as starting points, not final balance.

#### Plains T1

Swarm-ish but still mild.

```ts
guardianPhase: {
  requiredKills: 5,
  maxAlive: 5,
  modifiers: {
    hpMult: 0.85,
    atkMult: 0.9,
    attackSpeedMult: 1.05,
  },
}
```

#### Forest T1

Fast attackers.

```ts
guardianPhase: {
  requiredKills: 4,
  maxAlive: 4,
  modifiers: {
    hpMult: 0.9,
    atkMult: 0.95,
    attackSpeedMult: 1.35,
    moveSpeedMult: 1.15,
  },
}
```

#### Mountain T1

Slow, heavy hits.

```ts
guardianPhase: {
  requiredKills: 4,
  maxAlive: 4,
  modifiers: {
    hpMult: 1.15,
    atkMult: 1.35,
    moveSpeedMult: 0.85,
  },
}
```

#### Swamp T1

DoT pressure.

```ts
guardianPhase: {
  requiredKills: 4,
  maxAlive: 4,
  modifiers: {
    hpMult: 1.05,
    atkMult: 0.95,
    dotDamageMult: 1.35,
  },
}
```

#### Cave T1

Low density, bulky elites.

```ts
guardianPhase: {
  requiredKills: 3,
  maxAlive: 3,
  modifiers: {
    hpMult: 1.35,
    atkMult: 1.15,
    drAdd: 0.05,
  },
}
```

---

## Rollout Order

### Milestone 1 — Bare state machine

- Add `GauntletState` to dungeon node runtime state.
- Disable old dungeon boss maintenance.
- Disable normal ambient dungeon spawns.
- Add reset-on-freeze behavior.

### Milestone 2 — Idle guardians

- Spawn fixed guardians around altar.
- Make them targetable.
- Make them tethered and non-wandering.
- Track guardian deaths before activation.
- Add optional abandoned pre-clear reset timer.

### Milestone 3 — Altar activation

- Add activation radius.
- Add server validation.
- Add client button.
- Make button mobile-friendly.
- Add activation event.

### Milestone 4 — Guardian conversion

- Convert surviving idle guardians into phase 1.
- If no guardians remain, skip guardian phase.
- Track active phase kills.
- Advance after guardian phase.

### Milestone 5 — Boss gating

- Spawn boss after final phase.
- Tag boss as `gauntletBoss`.
- Complete dungeon on boss death.
- Preserve existing tier quest / boss kill credit.

### Milestone 6 — Failure and success reset

- Reset gauntlet on participant death.
- Reset gauntlet on node freeze.
- After boss death, start 10–15s altar cooldown.
- Respawn guardians after cooldown.

### Milestone 7 — UI polish

- Altar state button.
- Guardian remaining text.
- Phase progress strip.
- Cooldown countdown.
- Basic world event messages.

### Milestone 8 — First content rollout

- Implement one pilot T1 dungeon.
- Playtest.
- Adjust guardian count and modifiers.
- Roll out remaining T1 dungeons.
- Add T2 second phases only after T1 feels good.

---

## Things To Postpone

Do not include these in the first implementation:

- Relic unlocks.
- Rune fragments.
- Automated dungeon farming rune.
- Branching dungeon paths.
- Optional hard-mode altar modifiers.
- Dungeon attrition / reduced regen rules.
- Special terrain requirements.
- Unique altar art per biome.
- Dungeon-exclusive loot economy.
- T4/T5 authored elite packs.
- Multiplayer scaling.

The MVP is successful if the basic loop feels good:

```txt
Enter dungeon
↓
See guardians and altar
↓
Choose to pre-clear or activate immediately
↓
Clear short gauntlet
↓
Fight boss
↓
Receive progression credit
↓
Altar reforms after a short delay
```

---

## Open Questions For Later

These should not block implementation.

### Should immediate activation give a reward bonus?

Possible future rule:

```txt
If the altar is activated while all guardians are alive, boss gives +X% essence.
```

Do not add this yet.

The first version should let “pre-clear vs activate immediately” be a natural safety/speed tradeoff.

### Should group death reset the whole dungeon?

MVP rule:

```txt
Any participating player death resets the dungeon.
```

Possible later rule:

```txt
Dungeon resets only when all participants are dead or gone.
```

Start strict because dungeons are short.

### Should idle guardians give normal rewards?

MVP recommendation:

- Yes, but modestly.
- They are fixed and do not respawn until reset, so they are not an endless farming exploit.

Possible later tuning:

- Reduce idle guardian rewards if players farm pre-clears without finishing bosses.
- Add abandoned pre-clear reset if needed.

### Should the altar have an inner safe radius?

MVP recommendation:

- Yes, if needed for readability.
- Guardians should not chase indefinitely into the center.
- But the altar should not become a cheese zone once the trial starts.

Simple rule:

```txt
Idle guardians respect altar inner safe radius.
Activated gauntlet monsters do not.
```

This lets the player reach the altar, while still making activation dangerous.

---

## Final MVP Rule Summary

```txt
Dungeon nodes do not spawn normal ambient mobs.
Dungeon bosses are not maintained by old respawn logic.
Each dungeon has a generic altar.
Each dungeon has fixed idle guardians around the altar.
Idle guardians are targetable before activation.
Killed idle guardians stay dead until dungeon reset.
Activating the altar converts surviving guardians into phase 1.
If no guardians survive, phase 1 is skipped.
Later phases use fixed spawns.
Boss spawns only after all phases clear.
Participant death resets the dungeon.
Node freeze resets the dungeon.
Boss death completes the dungeon and starts a 10–15s altar cooldown.
After cooldown, the dungeon resets to idle and guardians respawn.
```
