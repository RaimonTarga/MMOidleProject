# Playtest 3 — a fresh guest through the guided Tier 1 (2026-10-12)

**Who played:** Claude, in a real browser (Playwright, 1440×900), as a brand-new guest on
develop `6a819467`: a production client build served by a local server on its own port and
database (`gamedb_pt3`). The player only did what the guide asked: press Next, and pick a
class when told to. Striker, guided route.

**What this is not:** a judgement of fun. It finds what is broken, slow, confusing or
unreadable on the path a new player walks. The designer's playtest question ("after 45
minutes, do I want to keep playing?") still needs outside players.

Evidence: `reports/playtest-3/` (screenshots named below, `guide-log.txt` with every guide
step, HP lows and console errors).

## Timeline

| Stretch | Time | Notes |
|---|---|---|
| Clearing → class pick | ~5 min | the guide waited 9 min at "Your move" while the test script did not click; not counted |
| Plains | 6 min | nearly died in the first minute (below) |
| Forest | 5.5 min | |
| Swamp | 5 min | Avoid Hazards, Cleanse, the pulse charm |
| Mountain | ~5 min | includes a relog |
| Cave | 8 min | the weapon's verb, Effect ranks II–III, Charge, Slam |
| Seals (Plains, Mountain) | 10 min | **6.5 of it walking** |
| **Guided Tier 1 total** | **~48 min** | |
| Optional gate (3× Broodmother) | 9 min | ~1 min altar wait per kill |

No crash, no disconnect; the guide resumed correctly after two relogs. The only console
errors were two 404s (fixed, below).

## Fixed on `fix/playtest3-findings`

1. **Two rune icons were never drawn.** Use Ability and Formation Broken were registered as
   concept icons with no PNG: a 404 on the Runes panel and a "?" tile. Use Ability now wears
   the Fire Technique art it replaced, Formation Broken wears Wait for Summons'.
   `server/test/runeIconArt.test.ts` checks every rune icon is on disk (fails on the old code).
2. **"Reset Passives" greets a new character** (`01-spawn-reset-passives.png`). The player
   spawns on the Clearing altar, so the first prompt they see is an action that does nothing
   for them. The prompt and its Enter key now need an unlocked passive.
3. **The guide said "frame", the panel says "style".** The farewell line pointed at "a
   frame" over a Passive Tree headed "Choose your style" (`07-passive-style.png`). The guide
   now says "style".

## For the designer (not changed)

Ordered by how much they cost a new player.

1. **Walking between seals: 6.5 of 10 minutes.** Cave → Plains dungeon 2 min, Plains
   dungeon → Mountain dungeon 4 min 15 s, with nothing on screen to do. In the first hour
   this is the longest dead stretch. Options: order the seals by distance, travel to an
   unlocked dungeon, or give the walk something (the map opening, a guide line).
2. **The Plains entry spike.** The first Plains fight with the Clearing kit took the Striker
   to 15/177 HP; only the Flee rune saved it. The guide calls the Plains "still forgiving".
   Either the line or the first Plains pull should change.
3. **The Mountain boss nearly wins.** HP 17/228 at the low point, won at 24/236 (7%). It is
   the hardest moment of the run; the guide's "falling is normal" covers a loss, but this
   is a coin flip on the guide's own kit. (Calibration data, not a proposal.)
4. **Class and style text is system language.** The class cards read like the bible:
   Squire "prepare a timed execution on the 7s reference cycle at ×2; 10% of your Recovery
   stays…", cut off mid-sentence (`02-class-pick.png`); the style detail says "Frame loop —
   the finisher opens a 1.6s flurry: ×1.3 damage on every regular hit inside it. The window
   is shorter than one cycle, so attack speed pays twice." A new player needs one line of
   what it feels like first; the numbers can stay below it.
5. **"Frame" and "style" are one thing with two names.** Fixed in the guide, still mixed in
   the Passive Tree detail ("Frame loop", "Frame window", "this frame trades bulk") and the
   rhythm readout's help ("Your frame banks charge…"). Pick one word.
6. **Designer vocabulary on the Upgrade panel** (`05-upgrade-worn.png`): "Caverns lineage",
   and the footnote "Its steps at Tier 1: form · lean I · II · III · verb · gate."
7. **Auto combat stops to heal at 98% HP** ("Recover First" at 98/100 and 206/208). Cheap
   at a 10%/s out-of-combat rate, but it reads as hesitation.
8. **Release notes still say v0.6.2.** v0.7 needs its page before anyone outside plays.
9. **Wisps hit you at the spawn point** (HP 97 → 90 before the first click) while the guide
   calls them harmless. Trivial; noted because it is literally the first second of play.

## What worked

- **The weapon page** (`06-upgrade-weapon-page.png`) is the clearest screen in the game: an
  "In the fight" sentence that says what the weapon does, Tier 2 choices with their cost on
  the card, and a "weak on bosses" caveat where it applies.
- **The guide carries the whole tier** with Next alone, explains each purchase in one line,
  and survives relogs.
- **Runes visibly save the run**: Flee at 15 HP in the Plains, Recover First between pulls.
- **The boss altar** (`04-plains-boss-altar.png`): "the guard is broken", an awakening
  countdown, a quiet HUD.
- **The samey sprites are real** (`08-samey-sprites-before.png`): five T1 third-family mobs
  and the Cave Brute line are near-copies of their img2img anchors. Redone on
  `art/distinct-mobs`, awaiting the designer's picks.
