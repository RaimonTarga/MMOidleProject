# Overnight 2026-10-16: task briefs (OV-*)

Written by the conductor for the overnight polish session ([OVERNIGHT-HANDOFF.md](OVERNIGHT-HANDOFF.md)).
Every agent reads [AGENT-RULES.md](AGENT-RULES.md) and `CLAUDE.md` first, then the "Common" part
below, then its own section. The designer is asleep: nobody waits for answers. Decide yourself,
mark the decision PLACEHOLDER in your report, and keep going.

## Common (every OV task)

**Goal of the night:** each class ready for the designer's first full-game playtest (T1 to T4).
**Pass bar** (decided by the designer): for each class, a bot on the intended route with the **auto
config** clears each tier's seal and tier bosses within a few tries (the route's `maxAttempts`,
6 by default), with **no death loops, stalls or crashes**, T1 to T4. No parity target; the Striker
is the reference class. The Verdict no longer executes bosses (already done).

**Tune freely:** any placeholder number (kit `params`, `shared/src/classKits/configs/<class>.ts`,
class gear in `shared/src/data/classGear/<class>.ts`, the class runtime's tuning constants) may change
to hit the bar. Log every change (file, old, new, why, the evidence). **Do not change designs or rules**
(the bible `design_docs/class-first-bible.md` is the authority). If a mechanic is plainly broken, fix it
minimally and list it for review.

**Your lane** (one private server and game database per class; never use another lane's number, never
touch port 4000, never stop another lane):

```bash
node tools/lane/lane.mjs start <n>      # server from YOUR worktree on :431<n>, db gamedb_ov<n>
node tools/lane/lane.mjs stop <n>       # restart after any server/shared edit (no watcher)
node tools/lane/lane.mjs reset <n>      # wipe the lane's database (a clean world and character)
node tools/lane/lane.mjs status <n>
```

Run the bot from your worktree root (background it; runs take a long time):

```bash
pnpm bot:run --route=<route> --policy=intended --controlled=false \
  --server=http://localhost:431<n> --rewardMultiplier=100 --account=ov<n>-<class> \
  --out=C:/Users/osaif/Documents/Claude/Projects/lanes/lane<n>/runs --maxRunMs=14400000 [--fresh=false]
node tools/lane/runSummary.mjs C:/Users/osaif/Documents/Claude/Projects/lanes/lane<n>/runs --deaths   # newest run, one screen
```

- Keep the same `--account` so `--fresh=false` resumes the same character after you restart the lane
  with new code. Every route step is idempotent (a farm whose level is reached, a craft you hold, a boss
  already cleared all pass at once), and each `-t2/-t3/-t4` route replays the earlier tiers' steps
  first, so resuming the next tier's route on the same character continues where it stopped.
- **100x rewards** shortens the farm only: the route farms each zone to a fixed level, so the power at
  a boss is the same as at 1x **as long as the route buys no upgrades**. Do not add opportunistic
  upgrades (they would make the bot richer than a 1x player). Crafting the tier's base gear is fine.
- `runs/<id>/events.jsonl` (kinds: `boss-attempt` start/end with `bossHpFraction`, `kill`, `death`,
  `milestone`, `craft`, `stall`, `route-step-start`...), `deaths.jsonl` (15 s window before each death),
  `summary.json` at the end. The server log is `C:/Users/osaif/Documents/Claude/Projects/lanes/lane<n>/server.log`
  (every lane's folder is under `Projects/lanes/`, outside every worktree).
- `bot/src/routes/<class>T*.ts` are yours. **T2 to T4 routes craft no gear yet** (they fight T3/T4 bosses
  in T1 gear; a T2 weapon is ~2.7x a T1 one). Add gear steps so each tier's first boss is met in that
  tier's class weapon (the job the bible's x.16 table and the route's discipline point to) plus an armor,
  a charm and boots of that tier, crafted from zones the route has farmed (recipes are gated by the
  zone's level: weapon at the tier's first level, armor +1, charm +2, boots +3; e.g. Plains T2 7/8/9/10).
  Keep the route tests (`bot/src/routes/<class>T*.test.ts`) passing.
- Verify the class system actually fires in a real fight (techniques, responses, payoffs, spends,
  clip types, orders): nothing has proven it by telemetry yet. A dev-only log line in your runtime
  (`server/src/log.ts`) or a count read from the server log is enough; say how you checked.

**Files you may edit** (your class only): `shared/src/classKits/<class>/`, `shared/src/classKits/configs/<class>.ts`,
`shared/src/data/classGear/<class>.ts`, `server/src/systems/classes/archetypes/<archetype>/` (Slinger also
`server/src/systems/classes/slinger/`), `bot/src/routes/<class>T*.ts`, your class's tests in `server/test/`
and next to the files above, and your report. **Not yours** (the conductor or OV-HOOKS owns them):
monster and boss data (`shared/src/data/monsters/`, boss patterns), `GAME_CONFIG`, combat core, the bot
executor and harness (`bot/src/route/`, `bot/src/botRun.ts`), protocol, `World`, `combatBootstrap`,
other classes. If one of these blocks you (a bot executor bug, a boss that no class tuning can beat,
a shared constant), **stop and report** with the evidence (boss HP left at each death, the fight's
length, the damage you take per second, the killing blows): the conductor fixes it on
`rework/class-first`, then tells you to `git merge rework/class-first` and continue. A small, obvious,
isolated bot fix that blocks your run may be made in its own commit (`fix(bot): ...`); say so in the report.

**Order of work:**
1. Start your lane; run `<class>-t1` from a fresh character. Fix whatever stops it, death loops first.
2. Resume the same character on `<class>-t2`, then `-t3`, `-t4`, fixing and tuning as you go.
3. Then the class's own wiring gaps listed in your section, only where they matter to the bar.
4. Last: `reset` your lane and run the full chain once on a clean character (`<class>-t4`, which
   replays T1-T3). Record per tier: boss kills, boss attempts, deaths, time. If time runs out, record
   how far it got.

**Timebox:** check `date`. Stop tuning by **06:30** local time, start the clean final run, and finish
(report committed) by **08:30** at the latest even if the final run is still going (record where it was;
stop it and your lane before finishing: `node tools/lane/lane.mjs stop <n>`, and kill your bot).
Leave no server or bot running when you finish.

**Checks:** `pnpm typecheck` before each commit (about 50 s; do not run it in a loop). Tests: only those
related to your files, `pnpm test -- <substr>` (e.g. `pnpm test -- striker`); the conductor runs the full
suite on merge.

**Report:** `docs/briefs/class-first-build/reports/OV-<ID>.md` on your branch, in the AGENT-RULES shape plus:
a per-tier table (route, boss kills / attempts, deaths, minutes, pass or fail and why), every number you
changed (file, old, new, why, evidence), every rule or mechanic you changed, what is still broken, and
short concrete questions for the designer. Commit small as you go (`type(scope): summary`, last line
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).

## OV-STRIKER (lane 1, `cadence`, routes `striker-t1`, `striker-t2-*`, `striker-t3-*`, `striker-t4-*`)

Known: with the T1 kit the Striker could not beat the Plains boss (boss at 43-52% HP when it died,
26-32 s in, four attempts, even with the Plains gear). Bible §12: **the base kit must win the first
boss**. Start there. For T2-T4 pick one discipline chain (the one the bible treats as the default or
most vanilla; say which) and get it through T4; if time remains, run T2 for the other two disciplines.
Gaps you own if they matter: Crescendo has no "target staggered" moment (the moment itself is OV-HOOKS's;
consume it if it lands). Runtime: `server/src/systems/classes/archetypes/cadence/`; kit
`shared/src/classKits/striker/`; config `configs/striker.ts` (`STRIKER_TECHNIQUE_SWING`).

## OV-SQUIRE (lane 2, `cooldown`, routes `squire-t1..t4`)

Known: the Squire dies a lot in the Mountain (12 deaths in 20 minutes at T1). Gaps you own if they matter:
Intercept and Challenge are stand-ins; Challenge also answers "an enemy attacking an ally" and Unbowed
only untelegraphed blows (no moments of their own yet). Undertow stopping a dive or burrow is OV-HOOKS's.
Runtime: `server/src/systems/classes/archetypes/cooldown/`; kit `shared/src/classKits/squire/`.

## OV-CONDUIT (lane 3, `summoner`, routes `conduit-t1..t4`)

Known: check the early game and the Command pips (the summon budget; the decision is that it may rise
to 20 bodies). Gaps you own if they matter: Pack Strike's early order, Colossus "grow huge", the second
Soul's cost, husks are invisible strikers. The S1 summon debuffs and the taunt lock are core and done.
Runtime: `server/src/systems/classes/archetypes/summoner/`; kit `shared/src/classKits/conduit/`.

## OV-SLINGER (lane 4, `reload`, routes `slinger-t1..t4`)

Known: 19 deaths in 30 minutes at T1 (in a shared world, partly crowding). The fire-rate rework moved
the T1 power curve (DPS per gun is attack x its own fire rate): check it. The "never reload inside a
telegraph" free rule is stored but not enforced: enforce it if deaths come from reloading in telegraphs.
Harpoon / Tether stopping a dive is OV-HOOKS's. Runtime: `server/src/systems/classes/archetypes/reload/`
and `server/src/systems/classes/slinger/`; kit `shared/src/classKits/slinger/`.

## OV-SPIRIT (lane 5, `energy`, routes `spirit-t1..t4`)

Known: 21 deaths in 30 minutes at T1 (shared world). Gaps you own if they matter: Tide's positioning
drift and Reservoir's "nearly untouchable" are not implemented. Runtime:
`server/src/systems/classes/archetypes/energy/`; kit `shared/src/classKits/spirit/`.

## OV-APPRENTICE (lane 6, `dot`, routes `apprentice-t1..t4`)

Known: 16 deaths in 30 minutes at T1 (shared world). Gaps you own if they matter: the default Payoff
placements cover T2 plus Melt / Frostcrack / Pyre only (extend the auto default to the T3/T4 pieces the
route owns). Numb II's core hook is OV-HOOKS's. Runtime: `server/src/systems/classes/archetypes/dot/`;
kit `shared/src/classKits/apprentice/`.

## OV-HOOKS (no lane needed; tests only)

The core hooks the class reports left as stand-ins, in this order:
1. **Harpoon / Tether (Slinger) and Undertow (Squire) stop a dive or burrow outright.** A check in
   `server/src/systems/combat/ai/bossPatterns.ts` (data: `shared/src/data/monsters/bossPatterns.ts`) so a boss pattern that dives or burrows is cancelled or
   refused while the boss carries the effect those pieces apply; wire the three pieces to it (minimal
   lines in the Slinger and Squire runtimes; say exactly which lines, the class agents edit the same
   folders tonight).
2. **Numb II (Apprentice):** the core hook in `server/src/systems/combat/engine/monsterMechanics.ts` /
   `server/src/systems/world/groundZones.ts` the T2+ reports ask for.
3. **The Striker's Crescendo "target staggered" moment** (moments registry: `shared/src/classKits/moments.ts`
   and `server/src/systems/combat/moments/fightSnapshot.ts`), and **Anchor's `drag-or-push` firing too late** (the Squire's Anchor looks
   ahead locally as a stand-in): make the moment fire early enough, keep the class side's change minimal.
4. If time remains: a "summon carrier" rule in `server/scripts/statusAudit.ts` replacing the
   `ACCEPTED_GAPS` lines that exist only because the audit cannot tell a summon from a player.

Each hook ships with a wiring smoke test (`server/test/`). Files: the core files named above plus the
minimal class-side lines; nothing else. Read the class reports in `reports/` (T2-*, T3-*, T4-*, *W2-*)
for what each stand-in does today.

## OV-DOCS (no lane)

The docs pass the handoff asks for (`docs/README.md` holds the rules: living vs archive, the index):
`docs/guided-tutorial-current-state.md` (the guide now goes through all tiers, per-class seams),
`docs/bot-experiment-runner-current-state.md` and `bot/README.md` (every class has `-t1..-t4` routes; which
are in `CONTROLLED_ROUTE_IDS`; the lane tools `tools/lane/lane.mjs` and `tools/lane/runSummary.mjs`),
`docs/system-rework-status.md` (the class-first rework replaces most rows: say so plainly), and
`CLAUDE.md` (the "Combat And Mechanics" and "Current class roots" text still describe the old class
roots, frames, runes and abilities: describe the six classes and their systems as built, compactly, the
way the file is written). Read the code, not the old docs, when they disagree. Also list (do not fix)
any other living doc in `docs/` that still describes removed systems (lineage trees, shards, runic
points, stances, rites, cores, the shared abilities). Files: `docs/**/*.md`, `bot/README.md`,
`CLAUDE.md`. Not the bible, not `design_docs/`.
