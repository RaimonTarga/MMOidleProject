# Combat readout run — report (2026-10-06)

**Branch:** `feat/combat-readout` in `../mmo-lineages`, off develop `677c9f99`. **Not merged**
(the designer merges). Brief: [combat-readout-run-2026-10-06.md](combat-readout-run-2026-10-06.md).
Evidence: `reports/combat-readout/` (the mockup, the capture driver, `screens/`).

| Commit | What |
| --- | --- |
| `7f87c86f` | Wave 0: `reports/combat-readout/mockup.html` (+ a still), committed before any code |
| `985d0110` | 1 — numbers say share: bands, colour and motion by kind, DoTs coalesced, one capped lane per target |
| `44233f8f` | 2 — the crit look is one look: one band up, gold, `!`, a 110 ms body flash; elemental crits keep their colour |
| `f876102c` | 3 — overhead bars: width by size class, the damage chip, quarter segments on elites and bosses, slim summon bars |
| `a5eb1d5f` | 4 — the boss frame: name, phase tile, wide bar with the quarters LOST lit, absorb, a cast line, the chip |
| `6cba745c` | 5 — the target frame's chrome: portrait slot, name and tier, the readout bar, elite/boss marks |
| `bac542a1` | 6 — the vitals: the same bar (chip, absorb band, number inside), a steady edge glow at a quarter |
| `81602008` | 7 — the phone: numbers keep their screen size and bars their thickness at the 0.4 floor |
| `76099121` | fix found in the live capture: the target frame really steps under the boss frame |
| `b35dea31` | fix found in review: a new target is not a hit (the DOM chip resets on a new subject); css vars built once |

## The grammar as built

**One source of truth.** Every size, colour, duration and threshold the readout draws is in
`client/src/render/readoutTokens.ts` (`NUMBER_TOKENS`, `BAR_TOKENS`, `FRAME_TOKENS`). The DOM
readouts receive them as `--ro-*` custom properties (`readoutCssVars()`), so the stylesheets hold
structure only and the skin track can restyle without touching logic. The rules that read the
tokens are pure functions in `client/src/render/readoutModel.ts` (bands, the DoT coalescer, the lane
stack, size classes, the chip, quarters, the absorb band, the phone floor) and
`client/src/hud/bossFrameModel.ts` (which boss, what it reads). No new socket events, no new view
fields, no per-tick booleans: everything comes from events the server already pushes, the views,
and the client's existing cast state.

### 1. Numbers say share

- **Size = share of the target's max HP**, four bands: chip (< 4 %, 12 px), hit (≥ 4 %, 15 px),
  heavy (≥ 12 %, 19 px), whole swing (≥ 30 %, 25 px). The same 51 is a 12 px chip on the 2100 HP
  Behemoth and a 25 px whole swing on a 70 HP Young Wolf. Digits stay.
- **Colour by kind:** direct white, element colour (+ glyph), shield cyan (+ 🛡), untyped DoT
  lilac (+ •), damage taken red (own) / orange (ally) / pale (summon), graze `~`, capped `▼`.
  Bleed numbers are lifted to `#ec4b40` (the fx keep `ELEMENT_STYLE`'s `#c41e1e`, which vanishes as
  text on the field).
- **Motion by kind:** a hit pops (×1.25 over 90 ms) and drifts 26 px; a DoT rises 18 px, linear,
  no pop; the crit pops harder (item 2). Fade in the last 30 % of life.
- **DoT ticks coalesce** per target, per element (and absorbed or not) into one number per 1 s
  window; a DoT number never draws above "hit". The pool is captured when the tick arrives, so a
  window that closes after its target died still sizes correctly and draws where it died.
- **One lane per target:** the newest number takes the base, older ones are lifted by their heights
  (80 ms ease), past 5 live numbers the oldest is dropped. A burst never backs up: within one delta
  only the newest 5 per target are spawned at all, and a delta starts at most 120.
- **Incoming damage** uses the same bands against the player's own pool (the Behemoth's 95 on a
  220 pool is a whole swing).
- **Heal floaters: not built.** No event carries a heal (`CombatEvent` has none), and the run may
  not add one. The motion token was left out rather than shipped unused.

### 2. The crit look is one look

An `empowered` (or execution) hit on a monster moves **up one band**, draws **gold** with `!`, and
**flashes the body**: a tint-filled copy of the sprite at 0.85 alpha fading over 110 ms, so the
sprite's own tint and elite outline are never touched; one flash per body at a time, none under
reduced motion. **Gold means crit and nothing else** (a test enumerates every other look). An
elemental crit (Detonate's empowered `damage`) keeps its element colour and glyph and takes only the
size and the flash. An incoming empowered hit is one band up with `!` in the damage-taken colour, no
flash. `damageNumberConstants.ts` now only names the crit gold for `fx/detonate.ts`. The floating
word (`fx/cardWord.ts`) is untouched.

Note the consequence on a boss: develop drew every crit at a fixed 22 px; now a 122 crit on the
Behemoth (5.8 % of its pool) draws at heavy, 19 px — one band above the 12 px swings around it,
which is what makes it read, but smaller than before. That is the share rule working; flagged as an
open call.

### 3. Overhead bars read the fight

Width by body size class from the displayed body (`monsterSpriteSize`): small 24 (< 60 px, e.g. the
Grass Kite), medium 32, large 44 (≥ 80 px), boss 72; height 4, boss 5; summons 24 × 2. Colour by
thirds kept (tokenised). The **chip** draws under the fill in pale cream: a fresh hit holds 400 ms
then drains in 500 ms; a heal at or above it snaps it; a small drop while it is out (a DoT tick, under
4 % of the pool) keeps it draining instead of restarting the hold, so a 0.5 s bleed never pins it.
Elites, dungeon guardians and bosses carry a thin segment every 25 %. The player absorb band and the
enemy shell band are kept. Bars never draw text; depth and y-sort unchanged; a bar redraws only when
one of its drawn pixels changes.

### 4. The boss frame

`client/src/hud/BossFrame.tsx` (a sibling of the target frame, one component, two placements).

- **Up** while a boss on the player's node is the player's target, or has the player as its target
  (`attackTargetId`); lingers 800 ms like the target frame. Before, a boss's health existed only in
  the target frame, which vanished every time auto-combat dropped the target or the player stepped
  off a charge lane (the before captures show it gone in 9 of 28 frames mid-fight).
- **Desktop:** top centre, 440 px wide (×1.2 UI scale), a fixed 70 px tall so the target frame steps
  exactly under it. **Phone:** a row of the top strip under the vitals, the ring row's height; the
  strip grows by that row and every overlay offset from `--mhud-top-h` follows. It never meets the
  ring (desktop ring in the rail; phone ring keeps its own row).
- **Content:** the phase tile first (with its card), the name, `T1 · BOSS`, four pips; a wide bar
  (the shared `ReadoutBar`) with the chip, the absorb band and the number; a slim cast line.
- **Quarter markers** (the Kill chain prerequisite): the boundaries the boss has already **lost**
  are lit gold and their trough tinted, the next boundary is white, and four pips count the quarters
  lost. Three lit pips say the fourth firing (the kill) is next. Exactly 75 % has lost one; the
  fourth is lost only at zero.
- **Cast line:** fills over the cast time from the client's `castState`, which `monster-cast-start`
  already writes (the Crag Charge's 2.4 s fills it, label "Crag Charge"); a finished cast waits
  250 ms for its cast-end. With no cast, the server's `primed` mirror holds the line full in red
  ("Next hit empowered") — not gold, which is the player's crit.
- **One channel per fact:** when the boss frame shows the targeted boss, the target frame drops its
  own name, bar and phase tile and keeps its homes and tiles.

### 5. The target frame's chrome

Portrait slot (the bestiary's `MonsterSprite`: the atlas frame, no new art; 38 px, 26 px on a
phone), the name, the tier (the player's node's — the target is always on it), an `ELITE` mark in
the elite outline's yellow or the `BOSS` mark, the shell's absorb at the end of the row; the bar is
the shared `ReadoutBar` (chip, hatched absorb band, number inside, quarter segments on elites). The
three homes, the tiles and the phase tile's place are exactly as the legibility run left them.

### 6. The vitals

Both the desktop crown (`hud/stat/StatPlate.tsx`) and the phone strip (`MobileHUD.tsx`) draw the
same `ReadoutBar` as the target and boss frames: fill by thirds, the chip, the wards as the hatched
absorb band, the number inside, the pending-DoT and regen layers kept on top. At a quarter: a steady
red edge glow (`FRAME_TOKENS.lowHealth`), no flash, no pulse. The barrier keeps its own strip on its
own scale; the ring is not moved.

### 7. The phone

At the 0.4 floor develop's numbers drew at 40 % of their size: a 14 px number was 5.6 screen px and
unreadable (see `7-phone-rat-zoom-before.png`). Numbers now keep **85 % of their desktop screen size**
below zoom 1 (`numberScreenScale`), their rise and lane lifts with them; bars keep **3 screen px of
thickness**, a 1 px outline and segment and a 2 px shell band (`barHeightAtZoom`), their width staying
body-relative. **The camera floor is unchanged** (design open item). Desktop (zoom 1) draws exactly
as before.

## Tokens

| Token | Value |
| --- | --- |
| Number bands (share → px) | chip 0 → 12, hit 4 % → 15, heavy 12 % → 19, whole swing 30 % → 25 |
| DoT cap / unknown pool | hit / hit |
| Crit | `#ffd23f`, +1 band, `!`, body flash 110 ms at 0.85 |
| Motions (pop, rise, life) | hit ×1.25/90 ms, 26 px, 850 ms · crit ×1.6/120 ms, 30 px, 1050 ms · DoT none, 18 px, 900 ms |
| Lane | 5 live per target, 2 px gap, 80 ms lift; 120 per delta |
| DoT window | 1000 ms |
| Phone floor | numbers 0.85 of screen size; bars 3 px thick, 1 px hairline, 2 px shell |
| Bar widths | small 24, medium 32, large 44, boss 72; summons 24 × 2; size classes at 60 / 80 px |
| Chip | `#fff1cf` at 0.9; hold 400 ms, drain 500 ms, re-hold at 4 % of the pool |
| Thirds | > 50 % `#44ee44`, > 25 % `#eeaa22`, else `#ee3322` |
| Quarters | lost `#f0c35a` (+ trough at 13 %), next `#ffffff`, ticks 2 px |
| Cast line | fill `#ff8f6b`, primed `#ff5a3c`, grace 250 ms |
| DOM bars (height / number) | boss 16/11, target 14/10, vitals 12/10, phone strip 10/8 |
| Boss frame | 440 × 70 px desktop, 26 px row on the phone |
| Low health | ≤ 25 %, glow `#ff2a2a` 8 px |
| Linger | 800 ms, stale opacity 0.55 |

## Before / after

All shots are the real client — a production build with `VITE_DEV_TOOLS=true` served by a capture
server on :4351 (`NODE_ENV=production DEV_TOOLS=true`, its own `gamedb_readout`, Redis index 11) —
playing a guest character in headless Chromium at 1440 × 900 and 390 × 844, driven by
`reports/combat-readout/capture.cjs`: the end-of-T1 Striker tier-entry profile on Moss Rats
(`forest-02`) and the Crag Behemoth (`debug:prepareFastBossRetry`, the altar, auto-combat), the
Slinger profile on `plains-04`, and the same Behemoth fight without armour or charm for the low-health
state. "Before" is the develop build `677c9f99` run through the same driver. Files are in
`reports/combat-readout/screens/` as `<item>-before.png` / `<item>-after.png`.

| Item | Shots | What to look at |
| --- | --- | --- |
| Context | `0-desktop-boss-full` | the whole screen mid-Behemoth: boss frame, the target frame under it, crown |
| 1 Numbers | `1-numbers-rat-desktop`, `1-numbers-boss-desktop`, `1-numbers-swarm-desktop` | 47 on a rat is heavy; on the boss a 51 is a chip beside a 36 taken (heavy, red) and a 122! crit; the swarm's 15s stack in a lane |
| 2 Crit | `2-crit-boss-desktop`, `2-crit-rat-desktop-after` | gold, one band up, the white body flash (after) vs develop's fixed 22 px gold |
| 3 Bars | `3-overhead-bars-boss` (2.5×) | the boss's 72 px bar with quarter segments and chip vs the 32 px bar a rat also had |
| 4 Boss frame | `4-boss-frame-desktop`, `4-boss-frame-phone` | quarters (2 lost lit, 25 % white), pips, the Crag Charge line; the phone row in the strip |
| 5 Target frame | `5-target-frame-desktop` | portrait, `T1`, the chip on the same 66/160 rat |
| 6 Vitals | `6-vitals-desktop`, `6-vitals-low-desktop`, `6-vitals-low-phone-after` | the number inside, the chip; at 37/166 the edge glow |
| 7 Phone | `7-phone-rat`, `7-phone-rat-zoom`, `7-phone-boss`, `7-phone-swarm-after` | the 47 and 10 that develop drew at 5.6 px |
| Live, spectator | `8-spectator-behemoth-{a,b,c}-after` | the Behemoth fight through `/?watch=<socket id>`, clipped to the canvas |

**Console errors: zero** in every capture run, on both builds and on the spectator page (each run
writes `<label>-console-errors.json`; all were `[]`).

The mockup (`reports/combat-readout/mockup.html`, opens from the repo) is the design reference: the
three scenes at desktop and 390 wide from real event shapes, and the two number languages side by
side with a "today" toggle. **The reviewer picked A, size by share:** size reads in the corner of the
eye; B's weight ladder separates only its ends, and at the phone floor every rung of B collapses into
one bold blur while A's 25 px swing still stands out from a 12 px chip; A also gives the crit an honest
look (one band up) without a fifth size. The build follows A.

## Tests

- **New** `server/test/combatReadout.test.ts` (pure, typechecked by `tsconfig.test.json`): band
  selection by share, band shifts, DoT coalescing (windows, sums, per-element keys, the newest
  position, a pool kept when a later tick lacks it, reset), the lane stack's cap and lifts, size
  classes, thirds, segments, the chip's decay (hold, drain, heal snap, the DoT rule, re-hold),
  quarter markers from (hp, maxHp) at every boundary, the absorb band, the boss frame's model
  (`pickBoss` target/aggro/node/dead/elite cases, `bossFrameModel`, `liveCast` grace,
  `bossFrameEqual`), the phone floors, and the tokens module's shape (bands ascend, the crit gold is
  unique, every css var is namespaced and set).
- **Extended** `server/test/combatText.test.ts` (it imports client render state, so it lives in the
  config's exclude list with its siblings): styles by kind, the crit look, "nothing else is gold",
  the incoming crit, the wiring (a hit draws at once, a DoT waits for its window, the captured pool
  sizes it after the view is gone, a node change drops open windows); its lane and burst expectations
  updated (lifts instead of slot offsets; 5 not 12). `combatTextCoverage.test.ts` flushes its DoT
  window (one line).
- **Full suite:** 389/390 (521 s, at `76099121`). The one failure, `lineageComposition.test.ts`
  ("Effect II + Flurry: the second strike lands at 115%, got 1.75"), **fails identically on clean
  develop `677c9f99`**: develop's Effect-parity commit `6ea13a91` (the payload scale 0.50) left the
  expectation behind. It is server lineage maths, outside this run's files and owned by the ability
  pass's `server/**`, so it was not touched. After `b35dea31` (DOM components and the css-var memo
  only) the readout tests were re-run: `combatReadout`, `combatText`, `combatTextCoverage`,
  `combatPlayback` all ok. **`pnpm typecheck`:** clean (all packages, bench, tests); the production
  build passes.

## Deviations from the brief, and files outside its list

- **The desktop vitals live in `client/src/hud/stat/StatPlate.tsx` / `statPlate.css`**, not in
  `hud.css` as the brief assumed; item 6 edits the crown's HP block there (the ability pass owns
  neither file). The phone vitals are in `MobileHUD.tsx` / `hud.css` as named.
- **New files beyond the tokens module and `BossFrame.tsx` + css:** `render/readoutModel.ts` (the pure
  rules, for testability), `hud/ReadoutBar.tsx` + `readoutBar.css` (the one bar module the brief asks
  for), `hud/bossFrameModel.ts` (pure) and `hud/bossFrameState.ts` (the atom and its publisher, called
  from the per-frame bar pass in `healthBars.ts`, since the scene loop is not this run's file).
- **`particles.ts`:** besides `spawnDamageNumber` and its style interface, its import lines and the
  one `EMPOWERED_DAMAGE_*` re-export line changed (the size constant is gone; the colour stays for
  `fx/detonate.ts`).
- **Two existing tests under `server/test/`** were edited (above); the brief gives the run "their
  tests", and nothing else in `server/**` was touched.
- **Line endings:** every touched file is LF in the index (`git ls-files --eol`), kept LF.
- `state.hpBarCache` is no longer written: `healthBars.ts` keeps its own per-state cache (chip state
  and the drawn pixels); `state.ts` was not touched.

## What could not be verified

- **Heal floaters** — no heal event exists (above).
- **The phase tile in the boss frame** — no T1 boss announces a named phase (T2 bosses do:
  "Stampede", "Unyielding"…); the tile and its card are the target frame's own code path, and the
  model is tested, but it was not seen live. The mockup's states strip shows it.
- **An enemy shell on the boss frame / target frame, the `primed` line, elite marks and segments in
  the DOM, the summons' slim bar** — none of the captured fights had a shelled enemy, an elite, a
  primed boss or a summoner. All are covered by the pure tests; the overhead segments were seen on the
  boss.
- **Reduced motion** — code paths only (no pop/rise/flash; the chip holds then snaps; the cast line
  steps); not exercised in the browser.
- **The chip reset on a new target** (`b35dea31`) came after the captures: typechecked and built,
  not re-captured.

## Open calls for the designer

1. **The camera floor.** Numbers at 85 % of their desktop screen size at the 0.4 floor are about half
   a 26 px body tall for a heavy hit. Readable, possibly loud; `NUMBER_TOKENS.screenFloor` is the one
   number. The floor itself remains the design open item.
2. **The band thresholds (4 / 12 / 30 %)** are provisional. Measured live: end-of-T1 hits on T1 mobs
   land heavy or whole swing (47 of 160, 51 of 70), hits on the Behemoth are chips (51 of 2100), its
   95 on the player is a whole swing.
3. **A crit on a boss is now smaller than develop's** (19 px heavy for 122 of 2100, against a fixed
   22 px). It reads because it sits one band above the 12 px chips; if the designer wants a crit floor,
   it is one token (a minimum crit band).
4. **The quarters' exact look** — lit gold ticks, a tinted lost trough and four pips. Pips or ticks
   alone would also work; the model (`quarterModel`) does not care.
5. **The top centre at 1440 is crowded.** Between the territory line and the biome XP bar there are
   ~358 px; develop's 384 px target frame already overlapped the XP bar by ~64 px; the 528 px boss frame
   covers its left ~136 px (the XP bar draws underneath). Narrower frame, or the XP bar stepping aside
   during a boss fight — both outside this run's files.
6. **The crit body flash** is strong (a white silhouette for 110 ms). `crit.bodyFlashAlpha` /
   `bodyFlashMs`.
7. **A DoT window that outlives its target** draws its last second where the target died, up to 1 s
   after the death fx. Dropping windows for dead targets is a one-line rule if preferred.
8. **The phone strip grows by 28 px** while a boss is up (the target frame and buffs step down with it).
9. **Field needs, not added:** the target atom carries no elite flag, tier or guardian state; elite is
   read from `MONSTER_DATABASE` and tier from the player's node. Dungeon guardians therefore get the
   overhead segments (render state knows them) but no DOM `ELITE`-style mark. A `guardian` flag on
   `TargetFrameData` would close it.
10. **Stale harnesses:** `tools/uishot/harness/target-frame.html` and `crown.html` mirror the old
    DOM; they were not updated (outside the run's files).
