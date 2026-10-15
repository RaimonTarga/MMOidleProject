# T2W2-STRIKER report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t2w2-striker   **Last commit:** e30029ea (code commit; the report follows)

## Done
**1. T2 state visible (client)**
- Networking (minimal): `UsesCadence` gained `lit`, `edge`, `momentum` (shared component + `initUsesCadence`); `PlayerView` gained `cadenceLit/Edge/Momentum`; `updateStrikerT2` copies the server-only state onto the slice each tick and `markSliceDirty`s only on change. Test line in `strikerT2.test.ts` (edge reaches the slice).
- `client/src/hud/orderResource.ts` (new): the resource as the strip draws it (Light lit / Balanced edge / Heavy Momentum), its fill and its words.
- `OrderStrip.tsx` + `orderStrip.css`: lit beats get a blue sheen; a bar and a word line under the strip ("Shine lit", "Edge 2 of 4", "Momentum +50%"); the finisher cell glows with the fill (blue / gold / red). Compact (mobile) keeps the one flat row: glow plus aria-label only.
- `useMechanicViewModel` / `types.ts` / `CadenceMechanic` / `CompactMechanic`: model carries `resource`; the strip help line explains it.
- `OrderEditor.tsx`: a discipline block (name, combo length, rule text) or, at tier 2 with none picked, a hint to pick in the Passive Tree; the finisher slot shows the trophy rank mark. The six T2 techniques already appear through the existing view (owned pieces).
- Status: `ability-sidestep` was an audit gap (writer in `strikerT2.ts` used a local `cs` carrier, so the audit could not see it was a player status). Fixed by passing `player.tracksCombat`; no striker or sidestep gap remains. Help text now says Close In borrows the tile.

**2. Guided steps** (`shared/src/tutorial/scripts/striker.ts`): `buildStrikerTierTwoBeats()` after the farewell, 3 beats per T2 zone (plains, forest, mountain, swamp, cave, jungle, desert): zone to the lesson level, the lesson line while carrying on to the cap, the boss beat (line names the trophy rank-up or new trophy). The discipline pick is the first line (Plains arrival), pointing at the Passive Tree. Existing step and condition types only. Lesson levels come from `absoluteZoneLevel` (single source with the kit).

**3. Bot route** (`bot/src/routes/strikerT2.ts`, registered): `striker-t2-light|balanced|heavy` (one per discipline arm; Light is the default builder). Steps = the whole `striker-t1` route, `unlockSkill <discipline>` (the pick is a skill node), `classConfig` auto sized to the discipline's combo, then per T2 zone travel, farm to `biomeLevelCap(2, zone)`, `attemptBoss` tier 2. Completion: all seven T2 bosses. Added to `CONTROLLED_ROUTE_IDS`. Test `strikerT2.test.ts` (steps, farm levels equal the guide's, milestones, registration).

## Checks
- pnpm typecheck: clean
- `pnpm test -- striker tutorial statusRegistry classKits cadence orderView smoke`: 23/24 passed. The one failure, `statusRegistry.test.ts`, fails only on other classes' ids (apprentice-held/withered, brittle, conduit-bark/mark, dot-frozen, squire-parry); no Striker or `ability-sidestep` row is open.
- Not run in a browser; client verified by typecheck only.

## Not done, or unsure
- **Farewell conflict (needs the conductor's call).** The farewell beat is no longer last: T2 beats follow it, so at tier 2 the guide goes straight on instead of showing the "That is the guided part done" panel, and `TutorialPanel` still says "Guided Tier 1" / "Tier 1 route" (client/src/tutorial, outside my paths). The farewell line itself says the guided part is done.
- The discipline pick has no step: no condition reads a discipline, so the line only points at the Passive Tree. A `disciplinePicked` condition would let the beat wait on it.
- Momentum bar cap (2) is mirrored in the client as a placeholder; edge is shown as steps (the +15% step lives only in the server).
- No T2 gear crafting in the route (T2 gear jobs' recipes not wired into route steps).
- Route has no per-discipline relic choice; the auto Order picks.
- Close In still shows as a "Sidestep" tile (label comes from the server descriptor in `abilityBuffs.ts`, outside my paths).

## Files outside the brief I needed (edited, minimal)
- `shared/src/tutorial/tutorial.test.ts` (Striker tail now includes the T2 beats; resume assertion) and `bot/src/routes/strikerT1.test.ts` (skip the `striker2:` beats when reading the T1 guide levels): both pinned the old farewell-last shape.
- `shared/src/protocol/views.ts` (three PlayerView fields), `shared/src/components/archetypes/cadence/usesCadence.ts`: the networking.
