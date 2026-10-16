# Overnight report (2026-10-16)

Written by the conductor for the designer, after the overnight polish session
([OVERNIGHT-HANDOFF.md](OVERNIGHT-HANDOFF.md), briefs [OV-overnight-tasks.md](OV-overnight-tasks.md)).
Per-class detail is in `reports/OV-<CLASS>.md`; this page is the summary and the decisions.

**Status:** DRAFT, filled in as the night goes.

## How the night ran

- One Claude agent per class (OV-STRIKER, OV-SQUIRE, OV-CONDUIT, OV-SLINGER, OV-SPIRIT,
  OV-APPRENTICE), each in its own worktree with its own **lane** (private server and game
  database, `tools/lane/lane.mjs`), plus OV-HOOKS (the core hooks), OV-DOCS (the docs pass)
  and OV-CLIENT (the real client, smoke-tested). The conductor merged and set the shared numbers.
- **New tools:** `tools/lane/lane.mjs` (start/stop/reset a lane), `tools/lane/runSummary.mjs`
  (a bot run on one screen), and `server/bench/classBossSim.ts`: a route's character against
  one boss in-process, built through the live paths (unlockSkill, equipItem, the class config's
  `auto` default), about 2.5 s per fight. It matched the live Striker's Plains attempt (live:
  died, boss at 46% after 28 s; sim: died, boss at 44-47% after 31-32 s).

## Decisions taken tonight (all PLACEHOLDER numbers unless said)

1. **The routes now craft gear like a player.** No class route crafted the Clearing set, so
   every bot reached the Plains unarmed, and the T2-T4 routes crafted no gear at all. Each
   class agent added the Clearing set and each tier's class weapon, armor, charm and boots.
2. **The T1 bosses stay as they are; the classes were tuned up.** Every class lost the Plains
   boss with the T1 kit (boss left at 28-87%). The class kits carry the power the removed
   systems (abilities, runes, stances, cores) used to give, so each agent tuned its own kit,
   config and class gear numbers until the base kit wins.
3. **One global monster factor per tier: `MONSTER_HP_MULT_BY_TIER` / `MONSTER_ATK_MULT_BY_TIER`
   = [1, 1, 0.9, 0.5, 0.45]** (`shared/src/config/gameConfig.ts`, index = the node's tier; every
   monster spawned there, bosses, adds, guards and normals; the bestiary shows the same numbers).
   Why: in the sim matrix (every class against every boss, the tier's gear, every zone at its
   cap) the median shortfall (1 / the boss HP fraction removed) was T1 2.0, T2 2.5, T3 8.3,
   T4 7.1, the Striker 3.1 / 3.4 / 12.5 / 16.7: the T3/T4 monsters were priced for the old
   character's stacked power. After the factor: median 2.0 / ~2.2 / 1.9 / 1.4, the Striker
   flat at 3.1-3.6, so every tier asks about what T1 asks and class tuning at T1 carries up.
4. **Disciplines and specializations wear the T2/T3 bodies again** (`frameMaps.ts`): the old
   lookup used removed node ids, so every character looked like its class root at every tier.
   Mapping by kit order (discipline 1/2/3 = the light/medium/heavy body; specialization 1/2/3
   under it = t3 a/b/c), existing art only: **reassign freely**.

## Per class and tier (the pass bar: the auto config clears each tier's bosses within a few tries, no death loops, stalls or crashes)

(filled in from the class reports and the final clean runs)

## Numbers changed

(conductor's own: decision 3 above. Class numbers: see each `reports/OV-<CLASS>.md`.)

## Rules or mechanics changed

- OV-HOOKS: Harpoon Round and Undertow refuse a boss's dive, burrow or flight while they hold
  it; Tether refuses a dash away or a teleport (bosses that accept no control ignore Tether).
  Numb II slows every wind-up (casts, boss pattern steps and their ground telegraphs). New
  moment `target-staggered`; `drag-or-push` fires as the push winds up.

## Still broken or not done

- The guide crafts no class gear after the Clearing set (the farewell line still promises
  "a tier-2 weapon").
- The canonical experiment runner refuses class `-t2` routes (asks for a snapshot no route declares).
- Under Numb II the client's cast bar fills at the original speed (the ground telegraph is right).

## Questions for the designer

1. The per-tier monster factor (decision 3): keep it as one knob, or fold it into the monster data?
2. Should the guide craft each tier's class gear the way the bot routes now do?
3. The body mapping by kit order (decision 4): which body should each discipline wear?

## Starting the playtest build

(filled in once OV-CLIENT has proven the command)
