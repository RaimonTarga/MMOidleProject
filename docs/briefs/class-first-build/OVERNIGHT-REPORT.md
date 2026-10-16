# Overnight report (2026-10-16)

Written by the conductor for the designer, after the overnight polish session
([OVERNIGHT-HANDOFF.md](OVERNIGHT-HANDOFF.md); briefs in [OV-overnight-tasks.md](OV-overnight-tasks.md)).
This page is the summary and the decisions. Each class's detail (every number with its evidence,
how the class system was checked live, open issues) is in `reports/OV-<CLASS>.md`.

## In one minute

- **The six classes pass the bar in the final runs** (table below): from a fresh character on the
  merged tree, the auto config clears all 23 bosses on its route, T1 to T4, with no death loops,
  stalls or crashes. The Squire, Slinger, Spirit and Striker took every boss on the first try; the
  Conduit needed four tries at the T4 Volcanic boss, the Apprentice two at the T4 Wasteland boss. The
  Striker passed after a route fix found during its final run (the T2 Jungle guard, below).
- **The routes now play like a player.** No route used to craft any gear (the bot reached the
  Plains unarmed, and fought T4 in T1 gear). Every route now crafts the Clearing set and each
  zone's class weapon, armor, charm and boots as they unlock. No upgrades (the rework disables them).
- **One global number:** every monster's HP and attack in a T2/T3/T4 node is scaled ×0.9 / ×0.5 /
  ×0.45 (T1 untouched). The T3/T4 monsters were priced for the old character's stacked power.
- **The real client works for all six classes** (headless browser: class pick, class screen edits,
  HUD, auto combat). The class choice screen now describes the class-first classes.
- **Three things to know before you play:** turn on **Avoid Hazards** (Step Back) in your standing
  orders, or the auto-fighter stands in charge lanes (the T2 Juggernaut's charge one-shots a T2
  Striker); the **Spirit** almost never loses HP (a design question, below); the **Conduit's piece
  icons** are missing (letters show).

## Final runs (merged tree, fresh characters, one private server each, 100× rewards)

Boss kills / attempts per tier (T1 is the two seals; T2-T4 every zone's boss), deaths anywhere on
the route, run minutes.

| Class (route, discipline chain) | T1 | T2 | T3 | T4 | Deaths | Minutes | Bar |
|---|---|---|---|---|---|---|---|
| Striker (`striker-t4-read-the-blow`: Balanced, Iaido, Read the Blow) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 128 | pass (after the Jungle fix below) |
| Squire (`squire-t4`: Bulwark, Reverb, Second Line) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 132 | pass |
| Conduit (`conduit-t4`: Pack, The Hunt, Avenge) | 2/2 | 7/7 | 7/7 | 7/10 (Volcanic won on the 4th try) | 3 (all at the Volcanic boss) | 89 | pass, Volcanic thin |
| Slinger (`slinger-t4`: Gunslinger, Fan the Hammer, Light Hands) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 115 | pass |
| Spirit (`spirit-t4`: Tide, Spring Tide, Wading) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 79 | pass (fights 8-47 s, never in danger) |
| Apprentice (`apprentice-t4`: Fire, Afterburn, Tinderbox) | 2/2 | 7/7 | 7/7 | 7/8 (Wasteland on the 2nd try) | 3 (2 on the walk into T2 in T1 gear, 1 at the Wasteland boss) | 102 | pass |

**The Striker needed a route fix during the final run.** Its first final run hit a death loop at the
T2 Jungle dungeon's nine-guard poison pack (four deaths in 15 minutes, all nine guards standing):
each zone's set had swapped the Plains' Grit charm out by then, and the boss sim never meets guards.
With Grit put back on at the Jungle (b4a6a755) the character resumed and cleared it, and a second,
fresh Striker (resumed once at minute 25, before the Jungle, to load the fix) is the row above.
The first character, resumed after the fix, then lost the **T2 Desert boss** (Dune-Stalker Emperor)
six times (boss at 3% and 4% left, then 26% four times: the phase at a quarter kills it) and went on
to win every T3 and T4 boss it reached on the first try: that boss is borderline for the Balanced
Striker (the fresh character won it first try). The other five ran untouched from start to finish.

100× rewards shortens the farm only: the route farms each zone to a fixed level and buys no
upgrades, so the character at each boss is the 1× character. Each run is one class route
(`<class>-t4`, which replays T1-T3 first) on its own lane, started 13:22 on the merged tree.

## How the night ran

- One Claude agent per class (OV-STRIKER, OV-SQUIRE, OV-CONDUIT, OV-SLINGER, OV-SPIRIT,
  OV-APPRENTICE), each in its own worktree with its own **lane** (a private server and game
  database), plus OV-HOOKS (the core hooks), OV-DOCS (the docs pass) and OV-CLIENT (the real client).
  The conductor set the shared numbers and fixes and merged everything.
- **The API usage limit cut every agent off around 05:00** and again late morning (the weekly limit).
  The Apprentice, client, hooks and docs agents had finished; the other five had their branches
  committed up to the cut. The conductor committed their last edits, merged, fixed the four tests the
  merges broke and ran the final runs itself. Two reports have unfilled live rows, marked as such.
- **New tools:** `tools/lane/lane.mjs` (start, stop or reset a lane: port 4310+n, `gamedb_ov<n>`),
  `tools/lane/runSummary.mjs` (a bot run on one screen), and `server/bench/classBossSim.ts`: a route's
  character against one boss in-process, built through the live paths (unlockSkill, equipItem, the
  class config's `auto`), about 2.5 s per fight. It matched the live Striker's Plains attempt
  (live: died, boss at 46% after 28 s; sim: 44-47% after 31-32 s). Use a lane database with it,
  never the default `gamedb`.

## Decisions taken tonight (all numbers PLACEHOLDER)

1. **The routes craft gear like a player** (each class's `bot/src/routes/<class>T*.ts`).
2. **The T1 bosses stay; the classes were tuned up.** With the T1 kit every class lost the Plains
   boss (boss left at 28-87%). The class kits now carry the power the removed systems (abilities,
   runes, stances, cores) used to give; each agent tuned its own kit, config and class gear.
3. **`MONSTER_HP_MULT_BY_TIER` / `MONSTER_ATK_MULT_BY_TIER` = [1, 1, 0.9, 0.5, 0.45]**
   (`shared/src/config/gameConfig.ts`, index = the node's tier; bosses, adds, guards and normals; the
   bestiary shows the same numbers). In the sim matrix (every class against every boss, the tier's
   gear, every zone at its cap) the median shortfall (1 / the boss HP fraction removed) was T1 2.0,
   T2 2.5, T3 8.3, T4 7.1, the Striker 3.1 / 3.4 / 12.5 / 16.7. After: median 2.0 / ~2.2 / 1.9 / 1.4,
   the Striker 3.1-3.6 at every tier, so class tuning at T1 carries up.
4. **Travel goes around zones above your tier** (`shortestWorldPath`, with the traveller's tier each
   higher node costs 20 hops). The plain path sent a T3 Squire from the T1 Swamp through ten T4 nodes
   toward the T3 Mountain; it died in the Trench and stalled. Now 17 hops and none in T4. Server travel,
   auto-traverse, flee, party follow, the map preview and the guide all use it.
5. **Disciplines and specializations wear the T2/T3 bodies again** (`frameMaps.ts`; the old lookup
   used removed node ids, so everyone looked like a class root at every tier). By kit order:
   discipline 1/2/3 = the light/medium/heavy body; specialization 1/2/3 under it = t3 a/b/c.
   Existing art only: **reassign freely**.
6. **Copy:** the class choice tooltips (`roots.ts`) and the class screen's Class foundation box
   (`ClassIdentity.tsx`) described the pre-rework roots (7 s execution, 65% layer, recharging barrier,
   four persistent summons). Both now carry short copy condensed from the bible's x.2 and x.10
   sections. **Yours to rewrite.** The combat log names summons by piece (Your Thrall), not "Your Summon".
7. **The Spirit's root no longer grants the old recharging barrier** (30% of max HP) on top of the
   storm (bible §11.10, XC1). The storm-absorb behaviour did not change with it.

## Numbers changed (headlines; every row with its evidence is in the class report)

- **Striker:** plain finisher ×2 → ×3; Broadblade T1 attack 19 → 23; Grit 0.15 → 0.5 (T1), 0.188 →
  0.55 (T2-T4); Coil finisher bonus 0.6 → 1.0; Focus cast 700 → 400 ms; Rhythm 20 s → 10 s; Light's
  shine 0.25 → 0.5; the default Order's bug (a second opener) fixed, with a preference per family.
- **Squire:** slam ×2 → ×6; the route plays Bulwark (was Avenger).
- **Conduit:** Command scaling (a body's share = Command / (4 × (total/4)^0.5), was the pie); body cap
  8 → 10; formation offense 1.2 → 1.4; Plains Warden HP ×3 and a new plating ×3; tanks taunt every 4 s.
- **Slinger:** every gun's fire rate retuned and +80 range; "never reload inside a telegraph" enforced
  (capped at 3 s); Shade 5 → 3 s; the route stands back (Keep Distance).
- **Spirit:** storm pip 12 → 20; flow 0.10 of the bottle → 0.25 of the T1 bottle (no longer grows with
  Mastery); storm tier scale 1 / 1 / 1.5 / 1.8; zaps 0.25 → 0.5; Bolt cost 0.5 → 0.75 pips, ×1 → ×2;
  per-discipline auto defaults.
- **Apprentice:** sigil tick 0.12 → 0.25; Detonate payoff 0.8 → 1; Warding Sigils 0.04 → 0.08; the sigil
  cap grows one step per tier after T1 (was three); Spore Burst waits for 3+ enemies.
- **Shared (conductor):** the monster tier factor (decision 3); the Striker's finisher preview 2.0 →
  3.0 (display only).

## Rules or mechanics changed

- OV-HOOKS: Harpoon Round and Undertow refuse a boss's dive, burrow or flight while they hold it;
  Tether refuses a dash away or a teleport (bosses that accept no control ignore it). Numb II slows
  every wind-up (casts, boss pattern steps and their ground telegraphs). New moment
  `target-staggered`; `drag-or-push` fires as the push winds up. The status audit knows summons
  (35 accepted gaps gone).
- Numb now slows attacks as well as movement, as its text says (Apprentice).
- The Slinger enforces its free "never reload inside a telegraph" rule.
- Travel, bodies and copy: decisions 4-6. Every class has a dev-only once-a-minute log line that
  counts its class system firing (techniques, responses, payoffs, spends, clips, orders); each report
  says what it saw live.

## Still broken or not done

- **Avoid Hazards is not a default standing order** (`DEFAULT_RUNE_LOADOUT`): without Step Back no class
  steps out of a ground telegraph (the Squire's "step out" is read nowhere). The Striker route turns it
  on; a fresh player does not have it.
- **The Mountain armor base has no damage cap** (bible §12.4): `mountain-vest-t1..t4` carry the dead
  `guard.potency-pct` (the removed Guards) and no recipe carries `defense.max-hit-pct`, so Braced Cast
  is inert for every class.
- **The guide crafts no class gear after the Clearing set** (and crafts the generic club before the
  class pick, not the class's start weapon); the farewell still promises "a tier-2 weapon".
- **The Spirit is invulnerable or helpless** against a boss, almost never in between (a design question below).
- **Only one discipline per class ran live**: Striker Balanced, Squire Bulwark, Conduit Pack, Slinger
  Gunslinger, Spirit Tide, Apprentice Fire. The sim says Siege (Slinger) loses T2 bosses, Overflow and
  Reservoir (Spirit) lose to sustained pressure, Light and Heavy (Striker) untested past T2.
- **Auto never racks the Slinger's T2-T4 clips** and the Conduit's Swarm and Elite defaults are not built.
- **Conduit piece icons** are missing (`client/public/assets/concept-icons/class-pieces/conduit-*.png`).
- Roots still carry pre-rework mechanics: the Squire's 10% in-combat Recovery (now also the S4 share
  and Old Guard), the Slinger's Recovery on kill, evade mitigation and acquire radius, the Apprentice's
  18% DoT resistance and 15% hit-to-DoT (the bible moves that to the Mountain armor line Stone Sigil).
- Under Numb II the client's cast bar fills at the original speed (the ground telegraph is right).
- The Conduit HUD still cannot show the next rebuild's HP cost.

## Questions for the designer

Cross-class:
1. Make **Avoid Hazards** (and, for ranged classes, Keep Distance) default-on standing orders?
2. The **monster tier factor**: keep it as one knob, or fold it into the monster data?
3. Should the **guide** craft each tier's class gear the way the routes now do?
4. The **body mapping** by kit order (decision 5): which body should each discipline wear?
5. The leftover **root mechanics** above: keep, move to gear, or drop?

Per class (each report has the full list):
6. **Spirit:** should a hit drain the storm *and* reach HP in part (or the flow pause under heavy
   pressure)? Today the flow either beats a boss's pressure (no HP lost) or loses (no spends at all).
7. **Striker:** keep the T1 power in the finisher (now 60-75% of boss damage), and is Grit at 50% fine?
   Crescendo's release needs a fallback against bosses that cannot be stunned.
8. **Squire:** should the slam grow with the bar it spends? Bulwark or Avenger as the default discipline?
9. **Conduit:** keep the Command scaling exponent at 0.5? Should later tanks get their own durability shape?
10. **Slinger:** should a fresh Slinger start with Keep Distance? Do twin guns fire faster than one gun?
    Siege's long reload loses T2 bosses: shorten it, armor it, or accept?
11. **Apprentice:** should the sigil cap keep growing three steps a tier (then weapons must lay sigils faster)?

## Starting the playtest build

From the `mmo-rework` folder (branch `rework/class-first`), with the dev containers up (`pnpm db:up`):

```bash
node tools/lane/playtest.mjs            # builds the client, then serves it on http://localhost:4000
node tools/lane/playtest.mjs --fresh    # the same on a wiped world (drops gamedb_playtest first)
```

It builds the production client (DEV_TOOLS on), creates the `gamedb_playtest` database if it is
missing, and runs a production server from this checkout on port 4000 (`--port` to change it) on
that database, so the playtest never shares a world or a save with the develop checkout's `gamedb`
(`pnpm play` would). Open the page and use guest **Play now** (production ignores
AUTH_DEV_BYPASS; guests are limited to 5 per IP per hour, and one guest can hold all six
characters). Ctrl+C stops the server. Checked: the build (23 s), the boot, the page and guest login.
