# K1–K6: enter one class's kit from its bible section

One brief, six tasks: each agent does **one section** (K1 … K6) for one class.

| Task | Class | Bible | Agent | Worktree · branch |
|---|---|---|---|---|
| K1 | Striker | §12 | Codex | `../mmo-rw-k1-striker` · `rw/k1-striker` |
| K2 | Squire | §8 | Codex | `../mmo-rw-k2-squire` · `rw/k2-squire` |
| K3 | Apprentice | §9 | Codex | `../mmo-rw-k3-apprentice` · `rw/k3-apprentice` |
| K4 | Slinger | §10 | Grok | `../mmo-rw-k4-slinger` · `rw/k4-slinger` |
| K5 | Spirit | §11 | Grok | `../mmo-rw-k5-spirit` · `rw/k5-spirit` |
| K6 | Conduit | §7 | Grok | `../mmo-rw-k6-conduit` · `rw/k6-conduit` |

**Size:** M each · **Phase 0, wave B** (the six run in parallel: each touches only its own folder)

**Read first:** `docs/briefs/class-first-build/AGENT-RULES.md`; `CLAUDE.md`; all of
`shared/src/classKits/` (start with `types.ts`, then `kitHelpers.ts`, `moments.ts`, `registry.ts`,
and **`striker/kit.ts`: the worked example to copy**); your class's own `kit.ts`; your class's
whole bible section in `design_docs/class-first-bible.md`.

## Why

Each class's kit is the static data every later system reads: the class runtime, the class
screen, the tutorial, the bot, the icons. The bible already lists every piece, lesson, trophy,
discipline, specialization and leaf in tables. This task enters them, exactly, into typed data
the code can use. No behavior: numbers and runtime come later.

## Do (every section)

In `shared/src/classKits/<class>/` (you may split `kit.ts` into `pieces.ts`, `trophies.ts`,
`tree.ts` imported by `kit.ts`):

1. **Every piece through T4**, each with its lesson:
   - T1 pieces from the §N.4 table, taught by `zone('<biome>', 1)`.
   - T2–T4 from the §N.16 tables: a **new** piece `learn(id, zone(biome, tier))`; a
     **sidegrade** is a new piece with `sidegradeOf` and `learn(id, zone(...), 'sidegrade')`;
     a **rank-up** is a `ranks` entry on the existing piece plus `rankUp(id, rank, zone(...))`.
   - Discipline pieces with `learn(id, fromDiscipline('<discipline id>'))`.
   - The zone level is always the default (`LESSON_ZONE_LEVEL`): don't pass a level.
2. **Every trophy** (11, one per lineage), rank 1's twist as `text`, each later rank as a
   `ranks` entry with `bossTier` = the lineage's first tier + rank − 1 (the test checks it).
   Biome ids: `plains forest swamp mountain cave jungle desert tundra volcanic graveyard trench`
   (the bible's "Wasteland" is `graveyard`).
3. **The three disciplines** (`DisciplineDef`: name, the fantasy line, the rule as `text`,
   `pieceId` if it unlocks one), **nine specializations** (three per discipline) and **nine T4
   leaves** (three per discipline, `tier: 4`, `column` from the section's own T4 question).
4. **A test**, `shared/src/classKits/<class>/<class>Kit.test.ts`, pinning the bible's totals for
   your class (the numbers given in your section below): pieces by family, lessons by kind,
   one T1 zone lesson per T1 biome, 11 trophies, 3 disciplines, 9 specializations (3 each), 9
   leaves (3 each). Hand-rolled `assert`, ends with `console.log("<class>Kit.test.ts: ok")`.

## Rules (every section)

- **Ids:** `<class>-<name in kebab-case>` (`squire-shield-bash`, `apprentice-cold-snap`);
  trophies `<class>-relic-<biome>`; disciplines `<class>-<discipline>`. Never change an id that
  already exists. Specializations and leaves use their names too (`striker-thousand-cuts`).
- **Names:** the bible's names, exactly (they are placeholders the designer will rename).
- **Text:** for the player. Second person, present tense, one or two short sentences: what it
  does in a fight. Plain words, no numbers, no system words (not "stacks", "proc", "DPS",
  "%", "budget", "Global Mastery", "trigger"). Rank text says only what the rank adds. Take
  the bible's description and say it plainly; never add an effect it doesn't state.
- **`params: {}` everywhere.** The class runtime adds numbers later.
- **When the bible is unclear, leave the field or the entry out** and list it in your report.
  Don't guess. Don't add a moment id: if a piece needs one that `moments.ts` lacks, report it.
- **Only edit `shared/src/classKits/<your class>/`** and your report. Not `types.ts`,
  `registry.ts`, `moments.ts`, `index.ts` or another class's folder.

## Check (every section)

- `pnpm typecheck` clean.
- `pnpm test -- classKits` passes: the shared invariants (`classKits.test.ts`) and yours.
- `git diff --numstat`: only your folder and your report.

---

## K1: Striker (§12) · Codex

Already entered: the starter finisher, the five T1 techniques, Rend II and Hemorrhage (keep
them; check them against the bible and fix any wording you can improve).

- **Pieces:** every technique in §12.16 (T2: Whirlwind, Feint, Armor Break, Rend II, Concuss,
  Charge, Pin; T3: Earthsplitter, Upheaval, Hemorrhage, Triple Cut, Shadowstep, Icebreaker,
  Overheat; T4: Avalanche, Frostbind, Bloodrush, Coup de Grâce, Magma Breaker, Reaping Arc,
  Pressure Point).
- **Families must reproduce §12.16's totals:** damage 4 by the end of T2 and 11 by T4; attack
  setups 4 and 7; finisher setups and control 3 and 7. So **Charge is `damage`** and
  **Hamstring is `attack-setup`** (already set). Control techniques are `finisher-setup` with
  `control: true`, except Hamstring (an attack setup that is also control). Control =
  Hamstring, Concuss, Pin, Upheaval, Avalanche, Frostbind.
- **Casts:** `cast: 'opener'` on Focus, Charge, Shadowstep, Overheat; `cast: 'windup'` on Coil,
  Earthsplitter, Avalanche, Magma Breaker. Whirlwind is "a cast" with no position in the
  bible: leave `cast` off and report it. Bloodrush is "no cast".
- **Totals for your test:** 26 pieces: the finisher plus 25 techniques (19 new including
  T1's five, 6 sidegrades); families damage 11, attack setups 7, finisher setups and control 7
  (the finisher not counted); one rank-up (Rend II).
- **Trophies:** the five T1 ones are entered; add Jungle Pounce, Desert Verdict, Tundra
  Hoarfrost, Volcanic Eruption, Graveyard Grave Toll, Trench Deep Pressure, with their ranks
  from §12.16. Kinds: spark Wide Arc, Double Slash, Hoarfrost, Grave Toll; the rest weight.
- **Disciplines** `striker-light`, `striker-balanced`, `striker-heavy` (§12.5); **specializations**
  §12.6; **leaves** §12.7 with columns `spike`, `swarm`, `slow-bleed`.

## K2: Squire (§8) · Codex

- **Pieces:** every response in §8.8's "Every response through T4" table, plus the slam
  (entered), the three discipline pieces (Parry from `squire-avenger`, Intercept from
  `squire-bulwark`, Unbowed from `squire-juggernaut`) and **Last Breath**, family `emergency`,
  learned with any discipline: `learn('squire-last-breath', fromDiscipline())`.
- **`answers`** (the moment each response answers), exactly:
  Shove `enemies-near`, Riposte `repeat-hits`, Steel Will `dot-landed`, Guard `telegraph-at-me`,
  Shield Bash `enemy-winds-up`, Stand Fast `charging-at-me`, Unshaken `control-on-me`,
  Splitting Blow `target-shielded`, Earthstamp `burrow-at-me`, Watchful `ambush`,
  Challenge `ranged-attacker`, Anchor `drag-or-push`, Chain Hook `target-flees`,
  Frostward `chill-threshold`, Backdraft `fire-attack`, Disarm `enemy-winds-up`,
  Lay to Rest `risen`, Lie in Wait `target-out-of-reach`, Parry `telegraph-at-me`,
  Intercept `ally-threatened`, Unbowed `big-hit`, Last Breath `hp-low`. The slam has none.
- **Sidegrades:** Stand Fast (of Guard), Disarm (of Shield Bash).
- **Totals for your test:** 23 pieces (the slam, 16 new, 2 sidegrades, 3 discipline pieces,
  Last Breath); 8 rank-ups; families guard 8, counter 7, hold 6 (discipline pieces included),
  slam 1, emergency 1.
- **Trophies:** the eleven in §8.9 with their ranks; kinds exactly as the table says
  (six `resolve`, five `slam`).
- **Disciplines** `squire-avenger`, `squire-bulwark`, `squire-juggernaut` (§8.5);
  **specializations** §8.6; **leaves** §8.7 with columns `empty-bar`, `wasted-answer`, `quiet`.

## K3: Apprentice (§9) · Codex

- **Pieces:** Detonate (entered), the five T1 lessons (§9.4), the three discipline pieces
  (Wither from `apprentice-poison`, Fuse from `apprentice-fire`, Cold Snap from
  `apprentice-frost`) and every lesson in §9.16.
- **Family = school**, from §9.8: Poison Spread, Siphon, Wither, Seep, Recoil, Spore Burst,
  Transference; Fire Detonate, Converge, Fuse, Blast Back, Sear, Signal Fire, Melt, Cinderfall,
  Pyre; Frost Numb, Seize, Cold Snap, Snag, Frostcrack.
- **`moment`** only on these lessons, exactly: Seep `target-out-of-reach`, Recoil `debuff-landed`,
  Melt `chill-threshold`, Pyre `risen`, Snag `target-flees`, Blast Back `charging-at-me`,
  Sear `target-shielded`, Frostcrack `target-shielded`. Every other payoff is placed freely.
- **Sidegrades:** Blast Back and Cinderfall (of Detonate), Spore Burst (of Spread).
- **Totals for your test:** 21 pieces; 30 lessons counting rank-ups (9 rank-ups); by lesson,
  Poison 11, Fire 10, Frost 9.
- **Trophies:** eleven (§9.9 names; twists from §9.4 and §9.16); kinds: payoff Outbreak, Glut,
  Petrify, Dune Wind, Frostheart, Dirge, Pressure Fuse; sigil Firstbrand, Brood Sigils, Scent,
  Magma Core.
- **Disciplines** `apprentice-poison`, `apprentice-fire`, `apprentice-frost` (§9.5);
  **specializations** §9.6; **leaves** §9.7 with columns `charger`, `ambusher`, `shooter`.

## K4: Slinger (§10) · Grok

- **Pieces:** the plain clip (entered), the five T1 clip types (§10.4) and every clip type in
  §10.16. The Slinger's disciplines bring rules, not pieces.
- **Families** (§10.8): damage Scatter, Buckshot, Venom, Acid, Breaching, Hollow-point,
  Incendiary, Thermite, Exploit, Hallowed; control Snare, Stopping, Frost, Tether; utility
  Shellbreaker, Tracer, Seeker.
- **Ring colours** (`color`), exactly: Scatter `#f2a33a`, Snare `#39c9b8`, Venom `#8fdc3c`,
  Stopping `#4a78ff`, Breaching `#ff5a3c`, Buckshot `#d9822b`, Shellbreaker `#b8c4ff`,
  Tracer `#ff6fd8`, Hollow-point `#ff9f6b`, Seeker `#9b7bff`, Acid `#c6e34a`, Tether `#2fa39a`,
  Frost `#8fe6ff`, Incendiary `#ff7a1a`, Thermite `#ff3d6e`, Hallowed `#fff1b8`, Exploit `#b06cff`.
- **Sidegrades:** Buckshot (of Scatter), Acid (of Venom), Thermite (of Incendiary).
- **Totals for your test:** 18 pieces (plain + 17); 9 rank-ups; families damage 11 (plain
  included), control 4, utility 3.
- **Trophies:** eleven rounds (§10.4, §10.16) with `slingerTrophy(...)` (kind is always `round`).
- **Disciplines** `slinger-gunslinger`, `slinger-siege`, `slinger-trickshot` (§10.5);
  **specializations** §10.6; **leaves** §10.7 with columns `caught-reloading`,
  `they-reach-you`, `wrong-clip`.

## K5: Spirit (§11) · Grok

- **Pieces:** Bolt (entered), the five T1 pieces (§11.4), the three discipline pieces (Ball
  Lightning from `spirit-overflow`, Storm Surge from `spirit-tide`, Cloudburst from
  `spirit-reservoir`, all strikes) and every lesson in §11.16.
- **Families** (§11.8): strikes Bolt, Chain Lightning, Thunderbolt, Hailstorm, Forked Bolt, Ash
  Lightning, Sleet, Thunderstorm (+ the three discipline pieces); squalls Thunderclap, Gale,
  Flare, Dust Devil, Downburst, Ground Charge, Dust Wall, Maelstrom; calms Downpour, Eye of
  the Storm, Updraft, Foehn, Tailwind.
- **`waitsFor`**, exactly: Thunderclap `touched`, Downpour `carrying-dot`, Updraft
  `inside-telegraph`, Flare `ambush`, Dust Devil `ranged-attacker`, Downburst `charging-at-me`,
  Tailwind `drag-or-push`, Foehn `chill-threshold`, Maelstrom `target-out-of-reach`.
  **`atFloor: true`** on Eye of the Storm only.
- **Sidegrades:** Forked Bolt (of Chain Lightning), Sleet (of Hailstorm), Dust Wall (of Gale).
- **Totals for your test:** 24 pieces (strikes 11, squalls 8, calms 5); 6 rank-ups.
- **Trophies:** the eleven in §11.9 with their ranks; kinds exactly as the table says (six
  `spend`, five `storm`).
- **Disciplines** `spirit-overflow`, `spirit-tide`, `spirit-reservoir` (§11.5);
  **specializations** §11.6; **leaves** §11.7 with columns `spike`, `swarm`, `slow-drain`.

## K6: Conduit (§7) · Grok

- **Pieces:** the Thrall (entered) and the 26 specialists through T4: T1 (§7.4), T2, T3, T4
  (§7.16). Ids by role for the unnamed T1 five: `conduit-plains-tank`, `conduit-forest-bruiser`,
  `conduit-swamp-spitter`, `conduit-mountain-marksman`, `conduit-cave-heavy` (display names:
  Plains Warden, Thornrunner, Bile Spitter, Ridge Marksman, Cave Brute, all placeholders); the
  rest by their names (`conduit-ironhorn`, `conduit-bog-leech`, `conduit-obsidian-tortoise`...).
  Every specialist is a `new` lesson (variants are new summons, not sidegrades).
- **Fields**, exactly:

  | role (`family`) | summons |
  |---|---|
  | `tank` | plains-tank, cave-heavy, ironhorn, carapace-guard, obsidian-tortoise, abyssal-warden |
  | `damage` | forest-bruiser, mountain-marksman, rockhurler, bog-leech, bonecrusher, executioner, burrower, prowler, cinderling, avalanche, dartcaller |
  | `support` | swamp-spitter, barkward, bloomtender, warhorn, sporecaller, frostcaller, icewarden, mirage, gravecaller |

  `command` 1, except cave-heavy 2, bonecrusher 2, warhorn 2, obsidian-tortoise 2, avalanche 3.
  `mode`: `ranged` for swamp-spitter, mountain-marksman, rockhurler, barkward, bloomtender,
  executioner, sporecaller, frostcaller, icewarden, dartcaller, mirage, gravecaller; `melee`
  for every other. `row`: tanks `front`; melee damage `middle`; ranged damage and all supports
  `back`. `body`: the T1 five use plains-tank `conduit-summon-effigy`, forest-bruiser
  `conduit-summon-splinter`, swamp-spitter `conduit-summon-chorister`, mountain-marksman
  `conduit-summon-inquisitor`, cave-heavy `conduit-summon-idolwright`; every later summon
  reuses one of the `MinionMonsterType` stand-ins that fits its role (list your choices in
  the report).
- **Totals for your test:** 27 pieces (the Thrall and 26 specialists: tanks 6, damage 11,
  supports 9; five with 2+ Command); 7 specialists per tier from T2 to T4, 5 at T1.
- **Souls** (11, `soul(...)`): names `<boss> Soul` after the lineage, as §7.8 suggests:
  Razortusk, Timberclaw, Mire Behemoth, Stoneplate, Dreadbore (T1 lineages), Dread-Gorger,
  Dune-Stalker, Rime-Mammoth, Magma Salamander, Charnel-Crown, Elder Serpent. Twists from the
  §7.8 Seed Souls table. **Ranks:** the bible hasn't designed them yet (§7.15 item 5), so each
  later rank's text is exactly "The Soul grows stronger." Bodies: plains
  `conduit-summon-champion`, forest `conduit-summon-consort`, swamp `conduit-summon-ritualist`,
  mountain `conduit-summon-covenanter-defense`, cave `conduit-summon-marshal`; the later six
  reuse a stand-in (list your choices).
- **Disciplines** `conduit-swarm`, `conduit-pack`, `conduit-elite` (§7.5); **specializations**
  §7.6; **leaves** §7.7 with columns `die-well`, `come-back-well`, `survive`.

## Report

`docs/briefs/class-first-build/reports/K<n>.md` (shape in AGENT-RULES.md): counts entered by
kind, anything left out because the bible was unclear (quote the bible line), and any moment
you needed that doesn't exist.
