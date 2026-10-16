# OV-CLIENT report
**Agent:** Claude (overnight subagent)   **Branch:** rw/ov-client   **Last commit:** fix 4a999651, then this report commit

The real production client was driven in headless Chromium (Playwright, persistent profile)
against a production server on lane 0, for all six classes. **No class crashes, no page
errors, no blank class screen.** Each class was unlocked through the real Passive Tree, its
class screen opened from the rail, its editor edited (every edit round-tripped as
`class:configResult {ok:true}`, or a refusal with the validator's reason), "Back to auto"
restored the auto config, and auto combat ran in the Clearing and in Plains
(`node-t1-plains-01/02`) with the class HUD on screen.

## How to build and serve the playtest client (these exact commands worked)

```bash
# 1. production client build (about 35 s; check the exit code, piping into tail hides failures)
cd client && VITE_DEV_TOOLS=true node node_modules/vite/bin/vite.js build; echo "exit=$?"

# 2. production server, which serves client/dist itself on the same port
cd server && NODE_ENV=production DEV_TOOLS=true PORT=4310 \
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamedb_ov0 \
  LOG_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/logdb_rework \
  REDIS_URL=redis://localhost:6379/8 ADMIN_TOKEN=<32+ chars> AUTH_DEV_BYPASS=1 \
  node --conditions=development --import tsx src/index.ts
# 3. open http://localhost:4310 and press "Play now" (guest)
```

- `server/src/index.ts` serves `client/dist` (and `/admin` from `admin/dist`) only when
  `NODE_ENV=production`. `admin/dist` was not built here; `/admin` was not checked in a browser
  (the `/admin` Socket.IO namespace was used and works).
- `AUTH_DEV_BYPASS` is ignored in production (the server warns). Guest "Play now" is the way
  in; `POST /auth/guest` allows 5 guests per IP per hour (in memory, a restart resets it). One
  guest account holds several characters, so one guest covers all six classes.
- Shortcuts I used (dev tools only): the admin action `teleportPlayer`, and
  `debug:applyTierEntryProfile` (emitted on the page's own socket) to give a character T1
  biome levels 6 (every T1 lesson) or a T2 entry with two trophies. These are synthetic states,
  not a real route.

## Per class

Screenshots: `docs/briefs/class-first-build/reports/ov-client/` (3.2 MB). The class choice
screen: `00-class-choice.png`.

| Class | Unlock + rail | Class screen + editor | HUD in combat | Console / page errors |
|---|---|---|---|---|
| Striker | through the **guide** (club, Bark Wrap, ten Wisps, choose-class: all fine); rail "the Order" with a NEW badge | T1: empty Order, Finisher piece, "Coming this tier". T2 profile (Balanced, plains:1 + forest:1 cleared): discipline header, both trophies, relic equip by click (Double Slash to Wide Arc), beat picker lists owned techniques, "Every open beat is used." when full. `striker-1-order`, `striker-3-t2-trophies`, `striker-4-t2-order-editor` | Order strip in the left rail, Clearing. `striker-2-hud-clearing` | none |
| Squire | Passive Tree; rail "Response rules" | T1 empty, then all five responses: toggles, Hold/Step out, Custom, Back to auto. `squire-1-panel-t1`, `squire-3-editor-custom` | Resolve pips (`2.2 / 4`). `squire-2-hud-clearing` | none |
| Apprentice | Passive Tree; rail "Payoff rules" | Detonate at start, then six payoffs: add to a moment, the three-enemies toggle, remove. `apprentice-1-panel-t1`, `apprentice-2-editor-custom` | Sigil readout ("Target 1 / 6") and the world ring on the target, Plains. `apprentice-3-hud-plains` | none |
| Slinger | Passive Tree; rail "the Loadout" | Plain clip at start, then rack add past slots (refused: "the rack holds 3 clips", shown in the editor), remove, Switch early, free rules. `slinger-1-panel-t1`, `slinger-2-editor-custom` | Ammo wheel, "Reloading" over the player, Plains. `slinger-3-hud-plains` | none |
| Spirit | Passive Tree; rail "Thresholds" | floor slider + Set floor, bands, Off, Gather/Hover. `spirit-1-panel`, `spirit-2-editor-custom` | Storm bar under HP ("Storm 56 / 72, Floor 30%") with band marks, Plains. `spirit-3-hud-plains` | none |
| Conduit | Passive Tree; rail "Formation"; four Thralls spawn | roster by row, add past Command (refused: "this formation needs 7 Command; you have 6", shown from the pending roster), remove, Attack first / Recall. `conduit-1-panel-t1`, `conduit-2-editor-custom` | Formation frame with Command pips and summons, Plains. `conduit-3-hud-plains` | **6 × 404** for the piece icons (below) |

## Fixes

- `fix(client): Thresholds editor says "Waits until <moment>"`. Every moment text is a clause
  ("an enemy is in melee with you", "you carry a poison or bleed"), so "Waits for an enemy is
  in melee with you" did not read as English. One string in `client/src/ui/class/ThresholdsEditor.tsx`.

No crash, blank panel, missing guard or wrong id turned up for a client fix.

## Still broken or worth knowing (not fixed: outside my paths, or design)

1. **The class choice screen describes the old classes.** The designer sees it first.
   - `shared/src/data/skillTree/roots.ts`: only the Striker's root `description` is
     class-first. The Squire's reads "prepare a timed execution on the 7s reference cycle at ×2";
     the Spirit's "channel each blow into a building surge of power ... a barrier worth 30% of
     your max HP ... recharges"; the Conduit's "maximum formation: 4 persistent summons before
     relic expansion ... 3.5s base". The Slinger's and the Apprentice's are the old ones too.
   - `client/src/ui/ClassIdentity.tsx`: the "Class foundation" box (Combat identity /
     Defensive layers / Recovery) is old copy for all six. Examples: the Striker's "A repeating pulse
     opens a window of in-combat Recovery"; the Spirit's "The barrier recharges after a
     damage-free interval", which contradicts XC1.
   - This is design copy, so I did not write new text. It needs the designer's words, or the
     conductor's from the bible.
2. **Conduit piece icons are missing**: no `client/public/assets/concept-icons/class-pieces/conduit-*.png`
   exists (the other five classes have theirs). Opening the Formation screen logs 404s for
   `conduit-thrall`, `-cave-heavy`, `-forest-bruiser`, `-plains-tank`, `-mountain-marksman` and
   `-swamp-spitter`. GameIcon's letter fallback renders, so nothing breaks. Art is the designer's.
3. **The combat log names Conduit summons by the old minion types**, e.g. "Your Summon → Tiny
   Wisp" and "Your Effigy → Grass Kite", not Thrall or Plains Warden. Server side:
   `server/src/world/worldLogActors.ts` `minionDisplayName` switches on `monsterTypeId`.
4. Balance, not client: a Squire with only the Clearing club and Bark Wrap (a synthetic profile,
   no T1 gear) died to Boars in `node-t1-plains-02` (`squire-4-death-plains`). The death
   overlay and respawn work.
5. Cosmetic, left alone:
   - The rail labels read "the Order" and "the Loadout" in lower case (that is the kit's `systemName`).
   - With no trophy, the Apprentice and Spirit relic card shows a letter "A" in the icon slot
     ("A plain payoff set", "A plain storm").
   - The target frame sits over the zone XP banner at the top centre.
   - The target frame can linger on a dead target ("Field Hare 0 / 50") while Behavior reads
     "Attacking Boar".
   - The move-speed stat read 0 for the Apprentice and the Conduit in Plains while a debuff icon
     was up (probably a Grass Kite slow; not looked into).
6. Environment: with `LOG_DATABASE_URL=.../logdb_rework` the server logs
   `[logdb] failed to flush logs` and "Gameplay telemetry delivery degraded". Gameplay is
   unaffected.

## Not checked

- The mobile layout.
- The `/admin` dashboard page.
- Picking a discipline in the Passive Tree (the T2 state came from a profile).
- Boss fights, and the trophy callouts in combat.
- Real T1 gear.
- The bot harness and `?watch=`.
- Only the Striker went through the guide; the other five used "No thanks" and auto combat for
  the ten Wisps.

## Checks

- pnpm typecheck: clean (exit 0)
- The client build that was played predates the fix commit 4a999651 (one UI string); rebuild after merging.
- pnpm test -- thresholds: 1/1 passed (`shared/src/classKits/thresholdsView.test.ts`)

## Files outside the brief I needed (not edited)

- `shared/src/data/skillTree/roots.ts` (stale root descriptions), `server/src/world/worldLogActors.ts`
  (summon names in the combat log), Conduit piece art in `client/public/assets/concept-icons/class-pieces/`.
- `client/src/ui/ClassIdentity.tsx` is in `client/`, but rewriting its copy is design, so I left it.
