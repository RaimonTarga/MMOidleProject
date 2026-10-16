# OV-HOOKS report
**Agent:** Claude Opus 5.5 (overnight session)   **Branch:** rw/ov-hooks   **Last commit:** 4369b59f (code; this report is committed after it)

No lane or bot: every hook is proven by its wiring test, nothing was run live.

## Done

### 1. Harpoon / Tether / Undertow stop a dive, burrow or flight outright (e69efc5a)
- **Core** (`server/src/systems/combat/ai/bossPatterns.ts`): an escape lock on the monster,
  `lockMonsterEscape(monster, kind, durationMs, now, staggerMs = 0)` and `monsterEscapeLocked(monster, kind, now)`,
  kinds `escape` and `dash` (runtime-only counters on `tracksCombat`, a longer hold or stagger stands).
  - `escape` (Harpoon Round, Undertow: "can't dive, burrow or flee") refuses every `conceal`, every
    `escape-guard` and a `dash` with `direction: 'away'`.
  - `dash` (Tether: "can't dash or teleport away") refuses a dash away and a conceal that relocates
    without travelling (a teleport). Tether is control, so a `controlImmune` / plated boss ignores it.
  - Checked at the head of each step in `advancePattern`, so a step is refused before it begins and
    cut short if the lock lands while it runs (a flight in progress stops where it is; a conceal surfaces).
    Refusal = `endPattern('interrupted')` + `boss-pattern-stopped` (by `root`) + a window: the pattern's
    own `stoppedBy.root` if authored, else the lock's `staggerMs` (label "Held"), else none.
  - On the content: the Trench serpent's three Into the Dark dives, the Jungle flee and vanish, the Desert
    Sand Step and Withdraw, the Cave burrows. Dash-ins (`to-target`) and Reclaim walks are not escapes.
- **Test:** `server/test/escapeLock.test.ts` (synthetic patterns; the Squire's real slam lays Undertow).

### 2. Numb II: a numbed enemy's wind-ups take longer (c2138366)
- **Core** (`server/src/systems/combat/engine/monsterMechanics.ts`): a status-data key `WINDUP_SLOW_PCT_KEY`
  (`windupSlowPct`), `monsterWindupSlowPct(monster)` (strongest live carrier, capped 0.8) and
  `delayMonsterCasts(monster, delayMs, now)` (charged attack, buff cast, ability cast, ward).
  `server/src/systems/world/groundZones.ts`: `delayGroundZonesByOwner` moves the monster's slam circles and
  charge lanes (resolve and lock times) with the clock. `bossPatterns.ts`: `stretchWindups` runs first in
  `updateBossPatterns` over aggroed monsters and also holds back a pattern's wind-up steps (`cast`, `impact`,
  `payoff`, `apply-status`, `pull`, `raise`).
  - It is time dilation: while slowed by `pct`, every wind-up clock runs at `1 - pct`, so a wind-up already
    under way when Numb lands is held back too (Numb is placed on moments, often mid wind-up).
- **Test:** `server/test/windupSlow.test.ts` (charged cast + circle, pattern cast + impact telegraph, Numb I vs II).

### 3. Moments (6fe37378)
- **`target-staggered`** (new id in `shared/src/classKits/moments.ts`, T3; state in `moments.ts`, fact in
  `fightSnapshot.ts`): the target is stunned or knocked down (`isMonsterStunned`), or a boss stands in a
  stopped pattern's window (`recoversFromPattern.fromStagger`). Crescendo's release rule can now read it as a
  finisher hold (`holdFinisher: [{ id: 'target-staggered', not: true }]`); the parser already accepts any moment.
- **`drag-or-push` foreseen:** `dragOrPushLandsAt(world, player, now)` (exported from `fightSnapshot.ts`; the
  same three sources as the Squire's stand-in: a knockback charged attack, a knockback ability, a boss `pull`
  step aimed at you). The event now fires on the rising edge of "a push or drag is winding up at you", and a
  registry-level foresight (`foreseeMoment`, a `foreseenUntil` tick counter) absorbs the push landing inside
  it, so readers see one event per push, at the wind-up. An unforeseen push (no wind-up: lair drags, vents)
  still fires it as it lands, from `applyForcedMovement` as before. `forcedMovement.ts` is untouched.
- **Test:** `server/test/momentsForesight.test.ts`; the Squire's own Anchor tests (`squireT3.test.ts`) now
  pass through the registry (the local read is gone).

### 4. A summon carrier rule in the status audit (eed7efba, 4369b59f)
- `server/scripts/statusAudit.ts`: `summonCarriers` follows a status target to a `MinionEntity`: directly
  (`coat.tracksCombat`), through a local (`const cs = minion.tracksCombat`), or through a `TracksCombat`
  parameter's callers (Pressure Seal: on you and on each summon). A summon carrier owes the target frame's
  copy, badge and icon and no player tile. Only targets that reach a summon change; every other row reads as
  before (the gap rules were rewritten on `playerSide` / `targetSide` flags, equivalent for non-summon rows).
- 35 `ACCEPTED_GAPS` lines removed (all nine Conduit summon statuses); the one left is
  `conduit-seal: player: no tile/projection` (the player-side seal really has no tile), with a new reason.
  Audit: 119 ids, 0 open gaps, 7 accepted (was 42).
- **Test:** `server/test/statusRegistry.test.ts` (zero gaps, no stale acceptance) plus four lines pinning the rule.

## Class-side lines (to merge around the class agents)
- `server/src/systems/classes/slinger/t3.ts`
  - import line: `bossPatternEscaping` -> `bossPatternEscaping, lockMonsterEscape`.
  - `tetherHit`: the `if (inRow >= rounds) setResource(...)` one-liner became a block that also calls
    `lockMonsterEscape(target, 'dash', holdMs, now)` (+1 comment line).
  - `tetherFor` (Harpoon Round only): appended `lockMonsterEscape(target, 'escape', holdMs, now)` (+1 comment line).
- `server/src/systems/classes/archetypes/cooldown/squire.ts`
  - import line from `combat/ai/bossPatterns`: added `lockMonsterEscape`.
  - `onSquireSlam`, the Undertow block: one line after `applyMonsterRoot(...)`:
    `lockMonsterEscape(ctx.defender, 'escape', tp.holdMs, now, tp.staggerMs);`
  - `LOCAL_MOMENTS`: deleted the `'drag-or-push'` entry (one line).
  - Comments only: the file header's T3 paragraph (2 lines) and `pushOrPullEndsAt`'s doc (1 line).
- `server/src/systems/classes/archetypes/dot/sigils.ts`
  - `@mmo-idle/shared` import: added `ABILITY_SLOW_EFFECT_ID`; new import line for `WINDUP_SLOW_PCT_KEY`
    from `combat/engine/monsterMechanics`.
  - `firePayoff`, `case 'apprentice-numb'`: 3 lines after `setResource(..., NUMBED_UNTIL, ...)`: at rank 2 the
    Numb's slow effect gets `windupSlowPct` = the Numb's own slow fraction.

## PLACEHOLDER decisions
- A refused escape's window: the pattern's `stoppedBy.root` (e.g. Desert Hit and Run's 3 s "Caught" when
  Tether refuses the Withdraw; Sand Step's 1.5 s "Pinned"), else Undertow's `staggerMs` (0.8 s, its kit), else
  none (Harpoon on Into the Dark: the serpent just stays up). Label "Held". No Escape Instinct is banked.
- Tether locks dash-aways and teleports only, not the Jungle flee run; Harpoon / Undertow lock all of them.
- Tether respects control immunity; the trophies' hold does not (no escaping boss is control-immune today).
- Lock durations are the pieces' own params: Tether `tetherMs`, Harpoon `harpoonMs`, Undertow `holdMs`.
- Numb II's wind-up slow = the Numb's slow fraction (no new param), cap 0.8; it lands on control-immune bosses
  (bible §9.16: "a slow still lands").
- `drag-or-push` fires at the wind-up start (like `telegraph-at-me`); foresight grace 2 ticks after landing.
- `target-staggered` = stunned / knocked down, or a stopped pattern's punish window (not a completed one).

## Checks
- `pnpm typecheck`: clean (exit 0) at 4369b59f.
- `pnpm test -- squireT4 slingerT3 slingerT4 Concealment escapeLock bossLineageTrench bossLineageDesert bossLineageJungle bossLineageCave bossTrenchPhase7`: 15/15 passed.
- `pnpm test -- apprentice windupSlow escapeLock bossEncounterRework bossRework bossLineageMountain bossLineageTundra bossVolcano groundZone`: 16/16 passed.
- `pnpm test -- moment squire spiritT3 striker View classKits`: 41/41 passed.
- `pnpm test -- statusRegistry hudStatus`: 2/2 passed (and `statusRegistry.test.ts` rerun alone after the last fix: ok).
- `pnpm test -- spirit slinger conduit summon autocombat rune guard`: 46/46 passed.
- `pnpm test -- boss trench desert jungle`: 33/33 passed.

## Not done, or unsure
- **The client's cast bar does not stretch under Numb II**: `monster-cast-start` carries `castMs` at the start
  and is not re-sent, so a mob's or boss's bar fills early while the blow lands later. The ground telegraph is
  right (zone views are rebuilt from `resolvesAtMs`). Fixing the bar is client work (`client/src/fx/mobCastWindups.ts`,
  `client/src/hud/BossFrame.tsx`), not edited.
- A Squire's Guard or Anchor window is sized when it is raised, so in a party a Numb-II-stretched blow can land
  after a brace ran out.
- **Tailwind (Spirit) side effect:** it waits for `drag-or-push`, so it now gusts as a foreseen push or drag
  winds up, not after it lands (still one gust per push). OV-SPIRIT may want to know.
- **Numb I** slows movement only: `applyMonsterSlow` writes no `attackSlowPct`, though its kit text says "slow
  its attacks and movement". Apprentice side, not touched.
- **Crescendo:** the moment exists; no default release rule is set (OV-STRIKER's). A hold "while NOT
  target-staggered" holds forever on a target nothing staggers.
- **Stand-ins left in place, now mostly inert:** the Squire's `updateUndertow` (cuts a conceal short; still
  covers a concealed non-pattern monster, and `squireT4` test 8 exercises it) and its Undertow root; the Slinger's
  `tetherTick` root (still the only hold on an ordinary monster running off). The Squire's `pushOrPullEndsAt`
  (Anchor's window) duplicates the core `dragOrPushLandsAt`; it could delegate, but that would also change
  two of its import lines, so I left it.
- **Merge note for the Conduit:** if OV-CONDUIT adds summon statuses tonight with old-style `ACCEPTED_GAPS`
  lines, those lines are now stale and `statusRegistry.test` fails until they are dropped. The block will also
  conflict textually (I deleted 35 lines in it).
- `docs/briefs/status-registry-audit-2026-10-05.md` (the audit CLI's printed report) was not regenerated.

## Files outside the brief I needed (not edited)
- None was needed. The natural home for "an unforeseen push" is `server/src/systems/combat/damage/forcedMovement.ts`;
  the dedupe lives in `moments.ts` instead so that file stays untouched.

## Questions for the designer
1. Should a boss whose escape is refused get a punish window? Today it is the encounter's own root answer when
   it has one (up to 3 s on the Desert's Hit and Run), else Undertow's 0.8 s, else none.
2. Tether: does "can't dash or teleport away" cover the Jungle's fleeing run too, or only dashes and blinks?
3. Numb II on the Tundra / Volcanic bosses: should their wind-ups stretch too (a slow lands there), or not?
4. Tailwind: fine as a gust at the wind-up, or should it wait for the push to land (it would need its own moment)?
