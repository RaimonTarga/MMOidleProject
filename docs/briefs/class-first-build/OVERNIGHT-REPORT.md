# Overnight report (2026-10-16, round 2 on 2026-10-17)

Written by the conductor for the designer. Round 1 was the overnight session
([OVERNIGHT-HANDOFF.md](OVERNIGHT-HANDOFF.md), briefs [OV-overnight-tasks.md](OV-overnight-tasks.md),
reports `reports/OV-<CLASS>.md`). Round 2 applied your five answers and ran the other two disciplines of
every class through T4 (briefs [OV2-discipline-tasks.md](OV2-discipline-tasks.md), reports
`reports/OV2-<ID>.md`). This page is the summary and the decisions; each report has every number with its
evidence.

## In one minute

- **All eighteen discipline chains pass the bar on the final tree** (table below): from a fresh
  character, the auto config clears all 23 bosses on its route, T1 to T4, with no death loops, stalls or
  crashes. Fifteen take every boss on the first try. The Conduit's Pack and Swarm and the Gunslinger
  each need a second try at one boss (the T2 Plains boss, the T1 Plains seal, the T4 Mountain boss).
  Against the same eighteen before round 2's last fixes:
  - deaths 28 -> 8;
  - failed boss attempts 17 -> 3;
  - 15-minute guard stalls 4 -> 0.
- **Your five answers are in.** Avoid Hazards is a default standing order for everyone; Keep Distance is
  the Slinger's default; the guide crafts and wears each tier's class gear the way the routes do; all
  twelve other chains run to T4; the Spirit's storm rule is untouched, for your playtest.
- **Round 2 fixed five things you would have hit while playing:**
  - a dungeon guard that reformed at full HP under a slow killer;
  - a character hovering between two guard packs and never engaging either;
  - auto-combat ignoring guardians pushed off their posts (a Spirit's squalls) until the guard reformed;
  - the client never showing what a shared armor, charm or boots does for your class;
  - Numb II's cast bars emptying before the slowed blow lands.
- **Before you play:**
  - The guide never picks your **discipline**. At Tier 2, pick one in the Passive Tree yourself, or you
    play Tier 2 without one.
  - At a reward multiplier of 10x or more, the guide **skips lines** when a farm overshoots. Play at 1x
    to 5x to read them all.
  - The **Spirit** almost never loses HP (the storm question, left for you).
  - The **Conduit's piece icons** are missing (letters show).

## Final runs (round 2: the final tree, fresh characters, one private server each, 100x rewards)

Boss kills / attempts per tier (T1 is the two seals; T2-T4 every zone's boss), deaths anywhere on
the route, run minutes. Chains are discipline, specialization, leaf; the first of each class is the
round-1 default.

| Class, chain (route) | T1 | T2 | T3 | T4 | Deaths | Minutes |
|---|---|---|---|---|---|---|
| Striker: Balanced, Iaido, Read the Blow (`striker-t4-read-the-blow`) | 2/2 | 7/7 | 7/7 | 7/7 | 2 | 127 |
| Striker: Light, Afterglow, Ghoststep (`striker-t4-ghoststep`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 120 |
| Striker: Heavy, Subjugator, Unbreakable (`striker-t4-unbreakable`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 119 |
| Squire: Bulwark, Reverb, Second Line (`squire-t4`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 131 |
| Squire: Avenger, Measure for Measure, Last Word (`squire-t4-avenger`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 117 |
| Squire: Juggernaut, Inexorable, Last Rampart (`squire-t4-juggernaut`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 130 |
| Conduit: Pack, The Hunt, Avenge (`conduit-t4`) | 2/2 | 7/8 (plains 2) | 7/7 | 7/7 | 1 | 83 |
| Conduit: Swarm, Legion, Devour (`conduit-t4-swarm`) | 2/3 (plains 2) | 7/7 | 7/7 | 7/7 | 1 | 85 |
| Conduit: Elite, Ascendant, Last Stand (`conduit-t4-elite`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 86 |
| Slinger: Gunslinger, Fan the Hammer, Light Hands (`slinger-t4`) | 2/2 | 7/7 | 7/7 | 7/8 (mountain 2) | 1 | 126 |
| Slinger: Siege, Entrenched, Bunker (`slinger-t4-siege`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 152 |
| Slinger: Trickshot, Deadeye, Cool Reload (`slinger-t4-trickshot`) | 2/2 | 7/7 | 7/7 | 7/7 | 1 | 141 |
| Spirit: Tide, Spring Tide, Wading (`spirit-t4`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 77 |
| Spirit: Overflow, Lightning Rod, Static Field (`spirit-t4-overflow`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 92 |
| Spirit: Reservoir, Gathering Dark, Dam (`spirit-t4-reservoir`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 73 |
| Apprentice: Fire, Afterburn, Tinderbox (`apprentice-t4`) | 2/2 | 7/7 | 7/7 | 7/7 | 1 | 101 |
| Apprentice: Poison, Wasting, Taint (`apprentice-t4-poison`) | 2/2 | 7/7 | 7/7 | 7/7 | 1 | 103 |
| Apprentice: Frost, Ice Tomb, Frozen Step (`apprentice-t4-frost`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 94 |

**How the table was made:**
- All eighteen ran on eight lanes from 22:49 on 2026-10-17 (commit 919e5066 and later).
- Three chains whose routes changed during that run were run again on the final tree: Balanced (the
  T2 Forest gear), Light (the T2 Jungle vest, the T4 Volcanic Maul) and the Siege (the Carbine at the
  T2 Jungle).
- The Reservoir was run again after the guardian fix (6b253fab), which its first run's 15-minute stall
  at the T4 Mountain guard led to. The new run cleared every T4 guard on the first try, the Mountain's
  in 65 s.
- The other fourteen ran before that fix, which only adds guardians auto-combat may pick, and before
  the Numb II cast bar (client only).
- Read each row as one fresh character on one try: a thin spot shows as a retry, not a loss.

100x rewards shortens the farm only: the route farms each zone to a fixed level and buys no upgrades,
so the character at each boss is the 1x character. Each run is one `<class>-t4[-<discipline>]` route
(it replays T1-T3 first) on its own lane.

## Round 2: what changed (2026-10-17)

### Your answers, applied

- **Avoid Hazards** (Step Back out of a telegraph) is the first rule of `DEFAULT_RUNE_LOADOUT`, for
  every new character (65a180a5).
- **Keep Distance** replaces the in-combat chase for a new Slinger, at the class pick
  (`defaultRuneLoadoutFor`, f2628f4e). A loadout the player has edited is never touched.
- **The guide crafts and wears each tier's class gear**, copied from the default chains' routes
  (`shared/src/tutorial/scripts/gearPlans.ts`). These gear beats run without a press of Next
  (8e032a7a, aa36fa3a). Its T2-T4 weapons are the default chain's, since the guide cannot know your
  discipline, and a line says so.
- **Every discipline chain is a route**, three per class (`<class>-t4-<discipline>`; ids in the
  table).
- **The Spirit storm** rule is unchanged.

### Fixes for your review (rules or mechanics; each minimal, each tested)

1. **Dungeon guard reform** (fb0415a3). An untouched altar's guard reforms 90 s after the last
   guardian kill. It now waits while a surviving guardian is still fighting a player.
   - Before: a slow killer (the Bulwark Squire and the Siege Slinger, ~90-105 s per T4 Trench guardian)
     saw the guardian it was halfway through come back at full HP every 90 s. It gave up after 15
     minutes.
   - A dungeon left stripped still reforms for the next visitor.
2. **Auto-combat may pick a returning monster already back on its post** (919e5066).
   - The T3 Jungle guard packs spot a player in the Jungle boots (+65% aggro pull) from ~305 px. Their
     leash runs 320 px from an anchor 70 px further out, so a pack "returns" the moment it spots you.
   - Auto-combat skipped every returning monster. An Avenger Squire standing between two packs switched
     targets every tick for 13 minutes and never reached either. Reproduced in-process; with the fix
     it clears all nine guards in 45 s.
   - Then, for dungeon guardians only, it also stops skipping one that is walking back to its post or
     sits past its leash (6b253fab). A Reservoir Spirit's push squalls kept the T4 Mountain's Stone
     Wardens (speed 16) walking home for most of a minute each, hidden from auto-combat, until the guard
     reformed (15 minutes). A guardian's way home is inside its own arena.
3. **The Mountain armor base carries its damage cap** (bible §12.4, 6f2bc799).
   - `defense.max-hit-pct` 0.3 / `defense.max-hit-mult` 0.5: a hit over 30% of max HP is halved above
     that point.
   - It replaces the dead `guard.potency-pct`. Braced Cast and every other "under the cap" line now
     has something to read.
4. **Deadeye holds its last round only against a boss** (Slinger Trickshot; 5ad69bbd, ccbf1205,
   c2253c63). The hold on every target stalled the Trickshot at the T3 and T4 Mountain guard posts.
5. **Cold Snap's chill slows attacks as well as movement** (Apprentice Frost, 9e91c7fd). It is Frost's
   pack answer, and a movement slow did nothing to a pack already in melee.
6. **Conduit** (OV2-CONDUIT):
   - A summon's hit carries its body's damage multiplier (64b85bc9). Before, every piece and staff
     damage number was ignored.
   - Summons dodge aimed telegraphs but hold their ground under scattered arena hazards (c0ad897d).
7. **Spirit Reservoir:** Cloudburst prices its pips by the weapon's cost line, as every fixed spend does
   (557342d8).
8. **Squire Juggernaut:** its auto default holds the slam on a nearly dead target, only while another
   enemy is on it (94d7de49, 11df4418). A held slam on a lone, fleeing enemy stalled.
9. **Class config:** a class system may name its own default relic. Only the Heavy Striker uses it
   (Skyfall first; 6daeec39, 0b7a4b86).
10. **Guide** (OV2-GUIDESMOKE):
    - Road levels no longer make a boss zone's gear moot (204860b1). The guide sent a new Tier 2 Striker
      to the T2 Plains boss in Tier 1 gear.
    - An auto beat never flashes Next.
    - The death card names Respawn first.
11. **Client:** the Make panel, the inventory and the map's zone gear show the shared base's line for
    your class (7a699963). The server always applied it; only the guide's card ever said it.
12. **Numb II's cast bar** (1902caf9): a numbed monster's cast bar now runs slow with its wind-up, and
    empties when the blow lands. The server publishes the slow on the monster.

### Numbers changed in round 2 (all PLACEHOLDER; evidence in each report)

- **Striker:** Light's shine 0.5 -> 1.5. Heavy's default Order builds Momentum (no opener) and fields
  a weight relic. The Light route specializes in Afterglow.
- **Squire Avenger:** answer fill x1.5 -> x3, plain-hit fill x0.6 -> x0.8, counter 0.4 -> 1.5 swings.
  The Juggernaut holds its slam below 10% (new).
- **Conduit:** Swarm's body cap 16 (the others 10). Swarm and Elite auto Formation defaults (bible §7.13).
  **Swarm Staff -25% -> -15% damage** (conductor: the final-run Swarm lost the T2 Plains boss six times
  at 2-3% left after the damage-multiplier fix made the -25% real; the re-run cleared all 23 bosses on
  the first try).
- **Slinger:**
  - Siege reload shift +900 -> +400 ms, Siege clip +4 -> +8 rounds.
  - Deadeye's longest hold 4 -> 2 s. Buckshot takes the crowd rule.
  - The auto Loadout racks and loads the T2-T4 clips (5e391335).
- **Spirit:**
  - Reservoir's flow x1.5 (new) and its calms at the floor (40%).
  - Ball Lightning 0.4 -> 0.6 a tick; Overflow's default fields Ball Lightning first.
- **Apprentice:**
  - Cold Snap's chill 2.5 -> 4 s.
  - Auto defaults: Poison and Frost Siphon at half HP with an enemy in melee; Frost detonates a full
    bar in a pack; Poison leaves a full bar to the plague in a pack; Wither answers your low HP.
- **Shared:** the Mountain armor damage cap (above).

**Route gear picks (bot routes; the guide's plan follows the default chains):** the dungeon guard
packs decided most of these. **`classBossSim --guards`** (new, e0667a9e) fights a dungeon's guard
instead of its boss:
- It walks in from a node edge with the bot's auto-combat and counts a run as a win when every
  guardian is dead.
- It isn't deterministic (packs wander), so use 8+ runs.
- It starts a Spirit's storm empty by default, which makes the Spirit look worse than it is live;
  `--charged` starts it full, as a live Spirit walks in.

A screen of all eighteen chains against the seven hardest packs (final2 gear and live levels) left
the **T2 and T3 Jungle nine-guard poison packs** as the only thin spots. The picks:
- **Strikers:**
  - Grit (the Plains charm) at the T2 Forest, Cave, Jungle and Desert.
  - Balanced (the guide's chain) since 2026-10-17:
    - **Grit and the Plains vest at the T2 Forest.** It meets the Apex Timberclaw before the Cave
      teaches Concuss. The earlier passes won only because one kill on the walk through the T2 Cave
      took that zone to 12 at 100x. The 12-guard pack in this gear: 8 of 8, lowest HP 95-97%.
    - **Grit at the T2 Desert.** It lost the Dune-Stalker Emperor eight times over two rounds, slowed
      inside the Execution circle.
  - **Every arm keeps the T3 Swamp charm on at the T3 Jungle:** 8 of 8 against that pack, against 6 of
    8 for Light.
  - Heavy wears the Swamp vest at the T2 and T3 Jungle.
  - **Light wears it at the T2 Jungle too** (8 of 8 against the pack, against 6 of 8). **At the T4
    Volcanic it puts the Maul back on:** in the Twin Fangs it lost the Caldera Sovereign once in each of
    two runs; the Maul won 2 of 2 in the sim.
- **Slingers:**
  - The Jungle vest at the T2 Jungle, for all three: the Gunslinger goes from 2 of 8 to 16 of 16 in
    the sim.
  - **The Siege takes the Carbine for the T2 Jungle and Desert:** 8 of 8 against the pack, against
    4 of 8 in its Drum Gun. Both guns win both bosses.
- **Apprentices:**
  - Poison plays the Runestone Staff.
  - **Poison wears the Swamp vest at T2** (8 of 8 against the T2 Jungle pack, against 4-6 of 8);
    Frost keeps the Jungle vest.
  - **Fire wears the Swamp vest from the T3 Swamp on** (8 of 8 against the T3 Jungle pack, lowest HP
    57-67%).
  - Every vest change wins all the tier's bosses with about the same margins.

**A sim trap:** classBossSim's default puts every zone at its tier cap, but a route fights its early
bosses with later zones still at the earlier cap (the Balanced Forest loss above). Pass `--levels`
from the route or a live run.

## Still open

- **The Spirit's storm is binary** (your call after the playtest). Reservoir shows it most: below a
  boss's pressure it never spends, a little above it wins at the Tide's pace.
  - Live, Reservoir **one-shots most bosses**: it walks in with a full deep bank and fires at once (T3
    fights of 1-8 s).
  - In gather, a calm never fires, not even Downpour under a DoT.
- **Conduit Pack** is very fast at T3 (8-13 s a boss) since the damage-multiplier fix. Swarm's half-cost
  summons fight at full strength (bible §7.15 Q1). The client's summoner profile still reads the old
  Command pie, and the HUD cannot show the next rebuild's HP cost.
- **The Squire is far over the curve at T3/T4** (most bosses end at 99-100% HP, all three disciplines).
  - The Juggernaut's T4 Desert boss takes 141-145 s.
  - Unbowed and Last Rampart never fired live.
- **Relic by discipline** exists only for the Heavy Striker. The others equip the newest trophy.
  - Crescendo's release (Striker) has no fallback against bosses that cannot be stunned.
- **The Siege's T2 start can be thin.** Its route makes the Drum Gun in the T2 Cave before the Plains,
  in T1 gear. The final2 run died three times to a Cave Troll there; the final run had no deaths. This
  is a bot-route detour; the guide plays the Gunslinger chain and never makes it.
- **Guide:**
  - Lines skip when a farm overshoots (seen at 10x and 50x).
  - The discipline pick is a farm beat that never waits for the pick.
  - The T2-T4 weapon lines name the default chain.
  - The guide has run live only to the T2 Forest (OV2-GUIDESMOKE).
- **Art and text:** the Conduit's piece icons are missing; the Plain Pistol's icon reads as a mace and
  its line is only "a plain pistol."
- **Leftover root mechanics** from before the rework: the Squire's 10% in-combat Recovery, the Slinger's
  Recovery on kill, evade mitigation and acquire radius, the Apprentice's 18% DoT resistance and 15%
  hit-to-DoT.
- **A death at a nine-guard dungeon pack** restarts the whole pack: it reforms 90 s after the last
  kill, and the walk back from the sanctuary is longer than that (OV2-APPRENTICE).

## Questions for the designer

Cross-class:
1. The **monster tier factor** (HP and attack x0.9 / x0.5 / x0.45 at T2 / T3 / T4): keep it as one
   knob, or fold it into the monster data?
2. **Bodies by kit order** (round-1 decision 5): which body should each discipline wear?
3. The **leftover root mechanics** above: keep, move to gear, or drop?
4. The **three AI and dungeon fixes** (the guard reform waits for a fight; auto-combat picks a
   returning monster at home, and a dungeon guardian walking home): keep?
5. Should the guide's **discipline beat wait for the pick**, as the class pick does?

Per class (each report has the full list):

6. **Spirit:**
   - Should a hit drain the storm *and* reach HP in part?
   - Should a calm at the floor fire while gathering?
   - Is Reservoir's flow x1.5 the right answer to its deeper bank?
   - Overflow and Reservoir's specialization and leaf picks.
7. **Striker:**
   - Keep the T1 power in the finisher, and Grit at 50%?
   - Should Heavy's default exclude Focus?
   - Light's 75/25 from the shine (now x2.5) or from a smaller finisher?
   - Grit as the Striker's all-round charm, or each zone's charm answering its own pack?
8. **Squire:**
   - Should the slam grow with the bar it spends?
   - Should Parry also take charges?
   - Keep the Juggernaut's slam hold?
   - Lower Unbowed's threshold?
   - Relic by discipline (Resolve vs slam relics)?
9. **Conduit:**
   - Keep the Command exponent at 0.5?
   - Summons and arena hazards: keep the new rule?
   - Lift the T1 pieces' damage multipliers below 1?
   - Swarm's cap 16 vs one shared cap; Elite's specialization (Ascendant)?
   - Half-cost Swarm summons at half strength?
10. **Slinger:**
    - Are the T2-T4 natural rules and the auto rack the Loadout you want for a hands-off player?
    - Should the Siege shell be worth more than the damage it banks?
    - Do twin guns fire faster than one?
11. **Apprentice:**
    - Should the sigil cap grow three steps a tier?
    - Should Poison's own weapons fill its bar faster than the Runestone Staff?
    - Should a Detonate pass sigils (the walking plague)?
    - Should the Shatter's and frost sigils' slows also slow attacks?

## Starting the playtest build

From the `mmo-rework` folder (branch `rework/class-first`), with the dev containers up (`pnpm db:up`):

```bash
node tools/lane/playtest.mjs            # builds the client, then serves it on http://localhost:4000
node tools/lane/playtest.mjs --fresh    # the same on a wiped world (drops gamedb_playtest first)
```

It builds the production client (DEV_TOOLS on) and creates the `gamedb_playtest` database if it is
missing. It then runs a production server from this checkout on port 4000 (`--port` to change it) on that
database, so the playtest never shares a world or a save with the develop checkout's `gamedb` (`pnpm
play` would). Open the page and use guest **Play now**:
- production ignores AUTH_DEV_BYPASS;
- guests are limited to 5 per IP per hour, and one guest can hold all six characters.

Ctrl+C stops the server. Checked on the final tree (2026-10-18): the build (13 s), the boot, the page and guest login.

---

## Round 1 (the night of 2026-10-16)

### Round-1 final runs (one discipline per class)

| Class (route, discipline chain) | T1 | T2 | T3 | T4 | Deaths | Minutes | Bar |
|---|---|---|---|---|---|---|---|
| Striker (`striker-t4-read-the-blow`: Balanced, Iaido, Read the Blow) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 128 | pass (after the Jungle fix below) |
| Squire (`squire-t4`: Bulwark, Reverb, Second Line) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 132 | pass |
| Conduit (`conduit-t4`: Pack, The Hunt, Avenge) | 2/2 | 7/7 | 7/7 | 7/10 (Volcanic won on the 4th try) | 3 (all at the Volcanic boss) | 89 | pass, Volcanic thin |
| Slinger (`slinger-t4`: Gunslinger, Fan the Hammer, Light Hands) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 115 | pass |
| Spirit (`spirit-t4`: Tide, Spring Tide, Wading) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 79 | pass (fights 8-47 s, never in danger) |
| Apprentice (`apprentice-t4`: Fire, Afterburn, Tinderbox) | 2/2 | 7/7 | 7/7 | 7/8 (Wasteland on the 2nd try) | 3 (2 on the walk into T2 in T1 gear, 1 at the Wasteland boss) | 102 | pass |

The Striker needed a route fix during its final run. Its first run died four times in 15 minutes at the
T2 Jungle dungeon's nine-guard poison pack. Grit put back on at the Jungle (b4a6a755) cleared it.

### How the night ran

- **Agents:** one Claude agent per class (OV-STRIKER, OV-SQUIRE, OV-CONDUIT, OV-SLINGER, OV-SPIRIT,
  OV-APPRENTICE), each in its own worktree and **lane** (a private server and game database). Also
  OV-HOOKS (core hooks), OV-DOCS and OV-CLIENT (the real client). The conductor set the shared numbers
  and merged.
- **Usage limits:** the API limits cut every agent off twice. The conductor committed their last edits,
  merged, fixed the tests the merges broke and ran the final runs.
- **Tools:**
  - `tools/lane/lane.mjs`: start, stop or reset a lane (port 4310+n, `gamedb_ov<n>`, lanes 0-7).
  - `tools/lane/runSummary.mjs`: a bot run on one screen; `--deaths` names each killer.
  - `server/bench/classBossSim.ts`: a route's character against one boss, in-process, about 2.5 s a
    fight. It strips the guards, so it never sees the dungeon packs. Point `DATABASE_URL` at a lane
    database, never the default `gamedb`.

### Round-1 decisions (all numbers PLACEHOLDER)

1. **The routes craft gear like a player** (each class's `bot/src/routes/<class>T*.ts`).
2. **The T1 bosses stay; the classes were tuned up** to carry the power the removed systems (abilities,
   runes, stances, cores) used to give.
3. **`MONSTER_HP_MULT_BY_TIER` / `MONSTER_ATK_MULT_BY_TIER` = [1, 1, 0.9, 0.5, 0.45]**
   (`shared/src/config/gameConfig.ts`, by node tier; the bestiary shows the same numbers).
   - The sim matrix's median shortfall before: T1 2.0, T2 2.5, T3 8.3, T4 7.1.
   - After: 2.0 / ~2.2 / 1.9 / 1.4.
4. **Travel goes around zones above your tier** (`shortestWorldPath`: each higher node costs 20 hops).
   Server travel, auto-traverse, flee, party follow, the map preview and the guide all use it.
5. **Disciplines and specializations wear the T2/T3 bodies again**, by kit order (`frameMaps.ts`):
   - discipline 1/2/3 = the light/medium/heavy body;
   - specialization 1/2/3 under it = t3 a/b/c.
   Existing art only: **reassign freely**.
6. **Copy:** the class choice tooltips (`roots.ts`) and the class screen's foundation box
   (`ClassIdentity.tsx`) carry short copy from the bible. **Yours to rewrite.** The combat log names
   summons by piece.
7. **The Spirit's root no longer grants the old recharging barrier** (bible §11.10, XC1).

### Round-1 numbers (headlines)

- **Striker:**
  - Finisher x2 -> x3; Broadblade T1 attack 19 -> 23.
  - Grit 0.15 -> 0.5 (T1), 0.188 -> 0.55 (T2-T4); Coil finisher bonus 0.6 -> 1.0.
  - Focus cast 700 -> 400 ms; Rhythm 20 -> 10 s.
- **Squire:** slam x2 -> x6.
- **Conduit:**
  - Command scaling (a body's share = Command / (4 x (total/4)^0.5)); body cap 8 -> 10.
  - Formation offense 1.2 -> 1.4.
  - Plains Warden HP x3 and plating x3; tanks taunt every 4 s.
- **Slinger:**
  - Fire rates retuned; +80 range.
  - "Never reload inside a telegraph" enforced; Shade 5 -> 3 s.
- **Spirit:**
  - Storm pip 12 -> 20; flow 0.25 of the T1 bottle; storm tier scale 1 / 1 / 1.5 / 1.8.
  - Zaps 0.25 -> 0.5; Bolt 0.75 pips, x2.
- **Apprentice:**
  - Sigil tick 0.12 -> 0.25; Detonate payoff 0.8 -> 1; Warding Sigils 0.04 -> 0.08.
  - The sigil cap grows one step per tier.
  - Spore Burst waits for 3+ enemies.

### Round-1 rules or mechanics changed

- **OV-HOOKS:**
  - Harpoon Round and Undertow refuse a boss's dive, burrow or flight while they hold it; Tether
    refuses a dash away or a teleport.
  - Numb II slows every wind-up.
  - New moment `target-staggered`; `drag-or-push` fires as the push winds up.
- **Numb** slows attacks as well as movement, as its text says.
- **The Slinger** enforces its free "never reload inside a telegraph" rule.

### Round-1 "still broken" list, now

- Avoid Hazards not a default: **fixed** (round 2).
- The Mountain armor base's missing damage cap: **fixed**.
- The guide crafting no class gear: **fixed**.
- Only one discipline per class run live: **fixed**, all eighteen chains.
- Auto never racking the Slinger's clips; no Swarm/Elite defaults: **fixed**.
- The Numb II cast bar: **fixed** (round 2).
- The Spirit's binary storm, Conduit piece icons, leftover root mechanics, the Conduit rebuild cost:
  still open (above).
