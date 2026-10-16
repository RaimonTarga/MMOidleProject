# OV2-GUIDESMOKE report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov2-guidesmoke   **Last commit:** see `git log rw/ov2-guidesmoke` (this report is the last commit; fixes 309d4f5b, 1d7458dc, 204860b1, docs ccf54e0f)

The guide was played in the real production client (headless Chromium, Playwright, persistent
profiles under `.uishot/`) against a production DEV_TOOLS server on lane 0 (port 4310,
`gamedb_ov0`, `node tools/lane/playtest.mjs --port 4310 --db gamedb_ov0`), with two guest
characters: a **Striker** (opening through Tier 1, both seals, into Tier 2 Plains and Forest) and a
**Slinger** (opening through the Tier 1 Plains gear, then stuck at the Plains boss). A small driver
acted as the player: it pressed Next 1.5 s after the card settled, pressed the class card and
Unlock when the guide said "Your move", and pressed Respawn on the death overlay. Reward
multiplier (debug panel): 50x until 21:31, then 10x.

## What worked

- **Gear beats start with no Next.** Every gear beat ran by itself: the class weapon right after
  the class pick (Striker Plain Sword, Slinger Plain Pistol), then T1 Plains Broadblade/Pepperbox,
  Survivor's Robe, Plains Stone, Fleet Boots; Striker T1 Forest Twin Fangs, Shaded Bindings,
  Sprinter Wraps; T1 Cave Bastard Sword; T2 Plains Broadblade, Enduring Robe, Stalwart Heart, Gale
  Boots; T2 Forest Twin Fangs, Phantom Bindings, Ancient Heartroot Amulet, Windstep Wraps; T2
  Mountain Iron Crusader Plate, Iron Bulwark, Mountain Stride. Each was
  crafted and worn (`crafting:craftRecipe` and `inventory:equipItem` on the socket, the slot in the
  Inventory: `ov2-guidesmoke/04-striker-t2-plains-set-worn.jpg`), and the card moved on by itself.
  A gear beat that needs a farm first farms (its own line stays up, "In progress…"), travels when
  its zone is elsewhere, then crafts.
- **Non-gear beats still wait for Next**: the opening (Wisps, club, Bark Wrap, Herb Pouch, Soft
  Boots), the class pick, zone openers, lessons, bosses, the Tier 2 discipline line. 46 presses of
  Next in all (two on the death card under the overlay, which could not be clicked), none on a
  gear beat.
- **Nothing ran twice.** 33 crafts (24 Striker, 9 Slinger), every recipe once, all `success:true`;
  no item equipped twice; no beat re-ran or looped.
- **Resume.** Reloading the page mid-route (four times) came back on the right beat: the Mountain
  boss; the Plains boss for a dead Slinger (the server had respawned it); a gear beat started by
  itself straight after the reload.
- **Death** (15 deaths): Respawn on the overlay, then Next on the card, and the beat goes again.
- **Bosses**: Striker won the T1 Plains and Mountain bosses first try and reached Tier 2 (21:31);
  the T2 Plains and T2 Forest bosses first try once it wore their T2 sets; stopped at 22:32 on
  the way to the T2 Mountain boss, after making and wearing the T2 Mountain vest, charm and boots.
- **No errors**: no page errors, no console errors (only Chromium's "GPU stall due to ReadPixels"
  WebGL performance warnings from software GL), nothing at error level in the server log beyond
  "Discord OAuth is not configured".

## Fixed (each its own commit)

- `309d4f5b fix(tutorial): an auto beat never flashes Next before it starts`: every gear beat
  that followed another beat showed Next for a moment (seen 300 ms to 1 s headless) before the
  panel's effect started it, because the effect runs after paint. The card now draws an `auto`
  beat with no run as working. Checked live on the rebuilt client (Slinger Plains: no flash).
- `1d7458dc fix(tutorial): the death card names Respawn, then Next`: the death overlay is full
  screen (z-index 10001, pointer-events all) and covers the card, so "press Next to get back up"
  could not be followed (Playwright: the overlay intercepts the click). The card now says to press
  Respawn while the overlay is up, and after Respawn "press Next, and the guide carries on". Flow
  unchanged.
- `204860b1 fix(tutorial): road levels no longer make a boss zone's gear moot`: **the one real
  bug.** The new Tier 2 Striker walked from the T1 Mountain boss to the T2 Plains (3 minutes),
  fought back through Forest nodes on the way (Forest 6 -> 9), and the guide skipped its whole
  T2 Plains set (no craft sent) and took it to the T2 Plains boss in Tier 1 gear, where it died 6
  times. Every piece's `unless` had "the next zone (Forest) has been fought in", met by one level
  above the Tier 1 cap. Where the guide fights the stretch's boss, that guard now also needs the
  player past the piece's tier; those stretches are still moot once their boss is down, two tiers
  on, or a later piece is worn (and a player who skipped such a boss is sent back to it anyway).
  Stretches with no boss keep the plain guard. New test pin in `tutorial.test.ts`. Live: after the
  fix the same Striker went back, made and wore all four T2 Plains pieces with no Next, and won the
  boss first try.
- `ccf54e0f docs(tutorial)`: the three fixes in `docs/guided-tutorial-current-state.md`.

## Still broken or worth knowing (not fixed)

1. **Lines skipped when a farm overshoots** (the "lesson-skip hazard" OV2-GUIDE named, now seen
   live, all with a reward multiplier): a lesson or zone opener whose farm is already met when it
   comes up is passed without its line ever showing. Striker at 50x: Sweep, Hamstring, Rend; at
   10x: the Whirlwind lesson and the T2 Forest opener ("The Forest is tougher now"). Slinger at
   10x: Scatter. With gear beats now `auto`, several beats can then go by with no Next and no line.
   At 1x a level takes minutes, so it should be rare, but the designer should play at a low
   multiplier (10x already skips). Showing a passed line once needs memory the guide does not keep
   (it resolves from state): the conductor's or designer's call.
2. **Slinger cannot take the T1 Plains boss** in Pepperbox + Plains set: 9 deaths in 40 minutes
   (5 to Tusked Razorback, 4 to Field Hares in the dungeon); stopped there, so the Slinger's seal
   and Forest were not seen. Balance or route, not the guide.
3. **The Tier 2 discipline is never picked by the guide.** "Pick it in the Passive Tree" is a farm
   beat; it does not wait for the pick, and the T2 weapon lines name Balanced. My driver did not
   pick, so the Striker played Tier 2 with no discipline. Design call whether that beat should
   wait for the pick like the class pick does.
4. **Gear line vs. the Make panel.** The Striker's guide line for the Plains Stone says "part of
   every hit you take heals back over a few seconds while you keep attacking"; the Make panel's
   detail for the same item shows "On kill, activate 30% Recovery for 4s" (the Slinger's line
   says "Recovery rises with the distance to the nearest enemy"). The panel seems to show the base
   item, not the class line (`01-striker-plains-charm-gear-beat.jpg`). Outside my paths; not
   checked which one the server applies.
5. **Pacing**: walks between zones take 1.5-3 minutes, and each death walks back from the
   Clearing before the next try. One walk, the Clearing to the T2 Plains dungeon after a death,
   ran past the director's 5-minute travel limit ("The trip took too long. Press Next to try
   again."); Next carried on.
6. Cosmetic, pre-existing: when any beat ends, the card shows the next beat's line with
   "Working…" for about a second (the director's closing pause) before its Next appears. The
   Plain Pistol's line reads only "a plain pistol." (placeholder wording), and its icon looks like
   a mace (`02-slinger-class-weapon-gear-beat.jpg`).

## Checks

- pnpm typecheck: clean (exit 0), after the last code change.
- pnpm test -- tutorial: 2/2 passed (`shared/src/tutorial/tutorial.test.ts`,
  `server/test/tutorialAnchors.test.ts`) at the last code commit, with the new pin.
- Screenshots: `docs/briefs/class-first-build/reports/ov2-guidesmoke/` (4 files, 220 KB).
- Server on 4310 and both browsers stopped at the end.

## Files outside the brief I needed (not edited)

- None edited. Read only: `client/src/hud/DeathOverlay.tsx` and `deathOverlay.css` (the overlay
  that covers the card), `server/src/systems/player/progression/rewards.ts` (biome XP: gain stop at
  the cap, no banking, so the Forest levels came from fighting on the road).
