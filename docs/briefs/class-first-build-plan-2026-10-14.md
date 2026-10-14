# Class-first build plan (2026-10-14)

**Status:** PLAN, active. Step 3 of the rework workflow in the
[brief](class-first-rework-brief-2026-10-13.md), for all six classes at once.
**Build authority:** [class-first bible](../../design_docs/class-first-bible.md) §7–§12, all six
classes Locked (2026-10-13/14). §1–§6 are still Draft; §8 below lists the stand-in this plan
uses for each unsettled point.
**Branch:** `rework/class-first`, from develop `44eea2dd`. Conductor worktree `../mmo-rework`.
**Supersedes** the strategy of the [Conduit T1 slice plan](conduit-t1-slice-plan-2026-10-13.md)
(strangler, one class at a time). Its code map, measurements and Conduit details are reused
(§10).
**Live state:** [class-first-build/STATUS.md](class-first-build/STATUS.md) (who is doing what);
rules for every agent: [class-first-build/AGENT-RULES.md](class-first-build/AGENT-RULES.md).

## 0. The calls this plan rests on

| Call | Made by | What follows |
|---|---|---|
| Rebuild on a branch, not strangler | Designer, 2026-10-14 | Remove the systems every class loses first, build the shared class framework once, then the classes. No `isClassFirst` branches anywhere. develop keeps today's game until M1. |
| Tier by tier, all six classes per tier | Conductor (follows from the above and §4's balance rule) | Every milestone ends with all six classes comparable in the bots at that tier. |
| Codex and Grok are coding agents; ChatGPT's image generation (through Codex) draws the icons | Designer, 2026-10-14 | Mechanical tasks go to them through written briefs; judgment stays with the conductor. |
| Save wipe at the rework release | Designer, 2026-10-13 | No save migration. Dev and bot databases are disposable. |

## 1. Milestones

| | Milestone | Done when |
|---|---|---|
| **M0** | Foundations | The systems every class loses are gone; the class framework exists; every class still fights with today's root mechanic; suite green. |
| **M1** | Tier 1 | All six classes play T1 on the new design end to end: Clearing, the five T1 biomes, both seals, the T2 promotion. Each has its class system, T1 lessons, trophies, gear, HUD, screen, tutorial and bot route. T1 bot cohort measured. **Merge to develop.** Designer's call then: an outside T1 playtest before T2 is built? |
| **M2** | Tier 2 | Disciplines; T2 lessons, trophies and gear (Jungle and Desert arrive); the Conduit's summon-cap step. Merge. |
| **M3** | Tier 3 | Specializations; T3 (Tundra, Volcanic; Plains and Forest jobs move). Merge. |
| **M4** | Tier 4 | Leaves; T4 (Graveyard, Trench; Swamp and Cave jobs move). Merge. |
| **M5** | Release | Wipe migration, docs archived and rewritten, balance handed to the designer, v0.7 when the designer says. |

## 2. How the work runs

### 2.1 Roles

- **Conductor** (the Claude build session in `../mmo-rework`): the framework; anything that
  touches the combat pipeline, protocol, persistence or architecture; each class's core
  mechanic and class-system runtime (unless an extra Claude session takes that class);
  every review and merge; milestone gates; this plan and the status board.
- **Codex** and **Grok**: tasks marked CODEX or GROK. Either can take the other's task; the
  split keeps the two in different folders at the same time.
- **ChatGPT image generation** (inside Codex): every new icon, following
  [openai-icon-generation.md](../../design_docs/visual_and_aesthetics_design/openai-icon-generation.md).
- **Extra Claude sessions** (optional, from Phase 1): one per class track, each owning that
  class's folders (§2.4). The conductor writes their kickoff prompts at M0.

### 2.2 The life of a task

1. The conductor writes the brief (`docs/briefs/class-first-build/<ID>.md`), commits it to
   `rework/class-first`, and makes the task's worktree:
   `node tools/worktree/agent-worktree.mjs create <id>` → `../mmo-rw-<id>` on `rw/<id>`, with
   working `node_modules` and no install.
2. The designer starts the agent in that folder with the paste-ready prompt from STATUS.md.
3. The agent works, commits on its branch and writes its report to
   `docs/briefs/class-first-build/reports/<ID>.md` on the same branch.
4. The designer tells the conductor it finished. The conductor reviews the diff, runs the
   typecheck and the named tests, then merges `--no-ff` into `rework/class-first` or writes
   a follow-up prompt for the agent. STATUS.md is updated and the worktree removed.

### 2.3 Gates

- **Every merge:** `pnpm typecheck` (about 50 s) and the task's named tests
  (`pnpm test -- <substring>`).
- **Every milestone:** the full suite (`pnpm test`, about 5 min) with the pass count recorded.
  Never trust its exit code or a completion notice: read the `N/M passed` line.
- Plus each milestone's check by hand, in a real client where it says so.

### 2.4 Who may edit what

- **Conductor-only files** (unless a brief hands one over): `shared/src/protocol/socketEvents.ts`,
  `shared/src/protocol/networkedEntity.ts`, `server/src/ecs/entity.ts`,
  `server/src/db/playerRepo.ts` and the migrations, `server/src/systems/combatBootstrap.ts`,
  `server/src/world/World.ts`, `docs/README.md`, this plan, STATUS.md.
- **A class track owns** (Phase 1 on): `shared/src/classKits/<class>/`,
  `server/src/systems/classes/archetypes/<archetype>/`, `shared/src/data/skillTree/<class>.ts`,
  `client/src/ui/classes/<class>/`, its HUD mechanic component, `client/src/fx/bespoke/<class>.ts`,
  `shared/src/tutorial/scripts/<class>Script.ts`, `bot/src/routes/<class>*.ts`, and tests
  named after the class.
- Everything else: only the paths a brief allows.

## 3. The framework: what all six share

Archetype ids stay as they are (persisted everywhere): `cadence` = Striker, `cooldown` =
Squire, `dot` = Apprentice, `reload` = Slinger, `energy` = Spirit, `summoner` = Conduit. New
content ids use the class's name, kebab-case, and are frozen once created: a rename changes
the display name, never the id (the bible's names are placeholders). No new id reuses an old
one. The T4 undead biome is `graveyard` in code (the bible also calls it the Wasteland).

### 3.1 Class kits

`shared/src/classKits/`, one folder per class, all static data and pure functions:

| Piece | Shape | Examples |
|---|---|---|
| `PieceDef` | something you own and place in your class system: id, class, name, family, card text, icon, tier-scaled params | `striker-sweep` (technique), `squire-guard` (response), `apprentice-detonate` (payoff), `slinger-scatter` (clip type), `spirit-bolt` (spend), `conduit-plains-tank` (summon) |
| `LessonDef` | when you learn or rank up a piece: new / sidegrade / rank-up, at a biome, tier and zone level | Guard II from the Mountain at T3 |
| `TrophyDef` | the boss trophy for one lineage, its kind and ranks; id `<class>-relic-<biome>` | `striker-relic-plains` (Wide Arc), `conduit-relic-cave` (Dreadbore Soul) |
| `BudgetDef` | the class's room, in class terms, stepped by Global Mastery | Command, Resolve, Sigils, Rack, Storm, Techniques |
| Disciplines, specializations, leaves | Passive Tree nodes (§3.5) | `slinger-siege`, `slinger-deathmark` |

`classBudget(class, globalMastery)` returns `{ label, value, nextAt }`, shown as "Command 5,
next at Mastery 30" (§2). `pieceTierScale(tier)` is the one formula every piece scales by
(each section's "scales with tier" rule).

### 3.2 State and persistence

One persisted slice, `holdsClassKit`, sent to its owner only: learned pieces (id → rank),
owned trophies (id → rank) and the class config. One new JSON column (migration `0010`). No
save migration: the wipe covers it.

### 3.3 The class config: one intent, six editors

`ClassConfig` is a union by class, one shape per system: the **Order** (beats, opener,
wind-up, rules), **Response rules** (each response's conditions, hold or step out, slam
hold), **Payoff rules** (moment → payoff and condition), the **Loadout** (rack, clip rules,
switch and reload rules, called-shot rule), **Thresholds** (floor, bands, phase) and
**Formation** (roster, orders). Every config also carries `relic` (the equipped trophy, two
with Two Souls) and `mode`:

- `auto` (every new character): the class's default (each section's §N.13) is rebuilt
  whenever a lesson, trophy or budget step arrives, so a player who never opens the screen
  still gets stronger.
- `custom`: set by the first edit; new pieces arrive with a "new" badge instead.

One intent, `class:setConfig` → `class:configResult`. Validation is one shared function per
class, so the screen shows the server's own reasons. Rules cost nothing (§3).

### 3.4 Learning and trophies

- **Lessons** are learned when the player reaches the zone level (stand-in: free and
  automatic, question Q1), granted where recipes unlock today, and announced with a toast
  and a "new" badge on the class screen.
- **Trophies:** a boss clear grants that lineage's trophy for your class, or ranks it up.
  The relic slot holds the equipped trophy. The old relic system (four ratings, the T4 gate,
  relic items) goes.

### 3.5 The Passive Tree

Kept: the unlock gate, reset, persistence and the panel. The content is reset to the six
roots in Phase 0 and split into one file per class. Code tiers: 0 the class root, 1 the
discipline (product T2), 2 the specialization (T3, scoped to the discipline), 3 and up the
leaves (T4+, three per discipline per tier, scoped to the discipline). The shared range layer
goes.

### 3.6 Items

- **Smart loot:** `classes?` on recipes and items, filtered at unlock, craft, equip and in the
  crafting list.
- **Class weapons:** one recipe per class per biome per tier (a job follows you up). The
  generic weapons are replaced tier by tier (T1 in Phase 1).
- **Armor and charm:** shared bases plus `classLines` keyed by archetype, applied at the stat
  rebuild; each class runtime reads its own line keys (`squire.*`, `slinger.*`, ...).
- **Boots** unchanged. **No +N ladder** (it is retired on every slot today; §4's +N steps
  with sockets wait for §4 to lock), and **no** sockets, components or random drops (§4:
  under review).

### 3.7 Moments: one registry of fight predicates

Every class system asks questions about the fight: an enemy started a wind-up at me, a
telegraph is on me, the target is full / low / shelled / frozen / out of reach, three or
more enemies are near, a poison landed on me, a hit took over a quarter of my HP. One shared
registry of named predicates and fight events, grown from today's rune conditions, read by all
six systems and by the free standing orders. New ones arrive with the tier that needs them:
T1 wind-up, telegraph, cast, debuff landed, big hit, crowd, low, full; T2 charge, ambush,
flee, barrier; T3 the Chill and Heat thresholds, shells; T4 risen, dives, debuff count.

### 3.8 Shared runtime rules

- **Strongest copy:** the same buff or debuff from two players of one class doesn't stack
  (§7.12, §8.12, §9.12, §10.12, §11.12, §12.12).
- **Taunts lock, players come first** (§8.12).
- **Monster debuffs land on summons** (§7.10).
- **Recovery and flow bound to a state** (most charm lines).
- **Universal standing orders are free** (Flee, Recover First, Avoid Hazards, Keep Distance,
  target focus, travel): the rune engine stays as their surface; Runic Points go.
- **No recharging barrier on shared gear** (XC1); the barrier runtime becomes the Spirit's
  storm.

## 4. Phase 0: Foundations (M0)

Sizes: S small, M medium, L large, XL very large.

| ID | Task | Owner | Needs | Size |
|---|---|---|---|---|
| I1 | Agent worktree script (`tools/worktree/agent-worktree.mjs`) | Conductor | — | done, `c363ff18` |
| I2 | This plan, the agent rules, the status board | Conductor | — | done |
| I3 | Bench repair: `pnpm bench:server` fights again; a `bench:summon-cap` script | GROK | — | S |
| D5 | The bot becomes a class-agnostic harness: every class and campaign route retired; step kinds, conditions, observation and telemetry for removed systems stripped; one smoke route kept | CODEX | — | L |
| D6 | The tutorial keeps its engine, the opening and the seal route; the class script and the rune lessons go | GROK | — | M |
| ICONS-T1 | Icons for every T1 piece and trophy (52 new, 8 reused) | CODEX (image generation) | — | M |
| F1 | Class kit types, registry, ids, budget, scaling (new files only) | Conductor | — | M |
| K1–K6 | Kit data, one class each, T1–T4, entered from its bible section | CODEX K1–K3, GROK K4–K6 | F1 | M each |
| D1 | Item lineage trees, ability node rows and shards, in the audit's order | CODEX | D5, D6 | XL |
| D2 | Stances, rites, Runic Points, cores | GROK | D5, D6 | L |
| F2 | `holdsClassKit`, migration `0010`, `class:setConfig`, networking | Conductor | F1 | M |
| D3 | The shared abilities' content, crafting and attunement, the Use Ability rune; the engine is kept (cast machine, charge, affliction toolkit, guard plumbing, formation technique) | Conductor | D1, D2 | M |
| F3 | Lessons at zone levels; trophies on boss clears | Conductor | F2 | S |
| F4 | Passive Tree reset to the roots, per-class files, the new tier gate, the range layer removed | Conductor | D1 | M |
| F5 | Smart loot, class lines, the trophy relic slot (old relics removed) | Conductor | F2, D1 | M |
| F6 | The moments registry, seeded from today's rune conditions | Conductor | D3 | M |
| F7 | Class screen shell: the view-model interface (conductor); the panel shell, budget readout, relic slot and lesson toast (GROK) | Conductor + GROK | F2 | M |
| F8 | Tutorial seam per class; bot step kinds `classConfig` and `trophy` | CODEX | F2, D5, D6 | M |
| T0 | Test sweep after F4 and D3: tests pinning frames, range nodes, paths or shared abilities | CODEX | F4, D3 | M |

**Order:** wave A runs now and in parallel (I3, D5, D6, ICONS-T1, F1); wave B when D5 and D6
are in (D1, D2, F2, and K1–K6 as soon as F1 lands); wave C after D1 and D2 (D3, F3–F8, T0).

**M0 exit:** suite green with the count recorded; a fresh character of each class fights in
the Plains with today's root mechanic; the class screen shows the budget in class terms; a
boss kill grants a trophy; the bot's smoke route runs on a lane server.

## 5. Phase 1: Tier 1 (M1)

### 5.1 Shared tasks

| ID | Task | Owner | Needs | Size |
|---|---|---|---|---|
| S1 | Monster debuffs land on summons: the riders through one shared function, minion statuses tick, DoTs on minions | Conductor | M0 | M |
| S2 | The T1 moments and fight events (wind-up, telegraph at you, cast, debuff landed, big hit, crowd, low, full) | Conductor | F6 | M |
| S3 | Strongest copy; taunt lock and player priority | Conductor | M0 | S |
| S4 | Recovery and flow bound to a state: the charm-line mechanism | Conductor | M0 | S |
| S5 | T1 class weapons: 36 recipes (six classes × the Clearing and five biomes); the generic T1 weapons removed | CODEX | F5, K1–K6 | M |
| S6 | T1 armor and charm class lines: 60 lines on the shared bases | GROK | F5, K1–K6 | M |
| S7 | XC1: the recharging barrier leaves the shared charms | GROK | M0 | S |
| S8 | T1 bot cohort: each class's T1 route, one server per class, same reward multiplier | Conductor | all tracks | M |

### 5.2 Class tracks

One track per class; the class's bible section is the spec. The same seven tasks each:

| ID | Task | Owner | Size |
|---|---|---|---|
| C\<c\>.1 | Core mechanic: the resource or loop and its HUD data (§N.2) | Conductor or a class session | L |
| C\<c\>.2 | Class system runtime: config to behavior, the defaults (§N.3, §N.13) | Conductor or a class session | L |
| C\<c\>.3 | T1 lessons and trophies at runtime (§N.4, §N.8, §N.9) | Conductor or a class session; simple ones delegable once the pattern exists | L |
| C\<c\>.4 | T1 gear-line runtime: the class's weapon jobs and its armor and charm lines (§N.4, §N.9, §N.10) | Conductor or a class session | M |
| C\<c\>.5 | View model (conductor), then the editor panel, HUD, callouts and FX | CODEX / GROK | M |
| C\<c\>.6 | Tutorial script and bot T1 route | CODEX / GROK | M |
| C\<c\>.7 | Delete the class's old content: frame and path runtime, class runes, old HUD pieces | CODEX / GROK | M |

**Order:** the **Striker** first. It is the reference class and its T1 needs the fewest new
moments, so it proves the framework end to end (config → runtime → HUD → screen → tutorial →
bot). Then the **Squire** and **Conduit** (moments, summons), the **Slinger** and **Spirit**,
the **Apprentice**. With extra Claude sessions, up to three tracks run at once after the
Striker lands.

**What each track changes in code**, from each section's salvage and build-task lists:

- **Striker** (§12): the beat strip; casts on the player cast machine at the opener and the
  wind-up (attack speed never shortens a cast); a technique's price; the finisher is the
  trophy; no resource at T1; the Recovery pulse goes.
- **Squire** (§8): Resolve (raw hits into a capped bar, landed answers, the pressure
  trickle; damage over time excluded); responses with landed detection and refunds; the slam
  at a full bar with hold rules; Last Breath arrives with T2; the 7 s execution clock goes.
- **Apprentice** (§9): sigils as one record per owner, ticking linearly from weapon potency
  and tier; payoffs on moments; the sigil cap as budget; Detonate from minute one; attack
  conversion and the front-loaded curve go.
- **Slinger** (§10): fire rate as its own stat; clip types per round; the rack and clip rules
  at the reload; switch reloads; the stationary reload; the last round is the trophy; the
  half-plating rule moves to Breaching.
- **Spirit** (§11): the storm as the absorb pool, a constant flow and two drains; spends
  placed by Thresholds (floor, bands, phase, each spend's moment); free zaps; energy per hit
  and the discharge go.
- **Conduit** (§7): the old slice plan's §2 is the map: Command and the roster, the
  specialists (now lessons), orders and Recall, no default sponge, debuffs on summons (S1),
  Souls, gear lines; the summon cap stays 9 at T1.

**M1 exit:** for each class, a fresh character plays the guided T1 to the T2 promotion in a
real client, and its bot route reaches both seals; the T1 cohort report is written (time to
each seal, deaths, HP lows, each class's own metrics from §N.13); suite green. Merge to
develop.

## 6. Phases 2–4 (detailed at each milestone)

| Tier | Shared | Every class |
|---|---|---|
| T2 (M2) | Moments: charge, ambush, flee, barrier, marks. The Conduit's bandwidth diet, then the cap to 12 and 20, re-measured (old plan §5). Jungle and Desert gear jobs. | Three disciplines (the resource or rule each brings), the discipline pieces, Last Breath (Squire); T2 lessons (7 biomes); 2 new trophies and 5 rank-ups; T2 gear; discipline crests (icons). |
| T3 (M3) | Moments: the Chill and Heat thresholds, shells. Jobs move (Plains → Volcanic, Forest → Jungle). | Nine specializations; T3 lessons; trophies; T3 gear. |
| T4 (M4) | Moments: risen enemies, dives out of reach, the debuff count. Jobs move (Swamp → Graveyard, Cave → Trench). | Nine leaves; T4 lessons; trophies; T4 gear. |

Each tier also brings its tutorial and bot route extensions, the cohort at that tier, its
icons, and a merge to develop.

## 7. Release (M5)

The wipe migration; every class's `docs/<class>-current-state.md`; the §14 docs archived;
`docs/system-rework-status.md` and `docs/README.md` updated; the balance handed to the
designer (every number in the rework is a placeholder); v0.7 through `/release` when the
designer says.

## 8. Stand-ins and questions for the designer

Each stand-in lets work go on; the answer replaces it. None blocks Phase 0.

| # | Question | Stand-in |
|---|---|---|
| Q1 | Are lessons learned automatically at their zone level, or crafted for essence (the Conduit plan's bind recipe)? | Automatic and free |
| Q2 | Out-of-combat rebuilds: does the Conduit baseline keep today's 4× (Herd adds more) or lose it (Herd brings it back)? | Keeps 4×; Herd doubles it |
| Q3 | The Swamp Soul's bile pool, while ground hazards stay player-only (§13) | A death burst that leaves poison on nearby enemies, drawn as a pool |
| Q4 | The T1 power bar: is today's T1 power per class the anchor? | Yes: each class's T1 kit is first tuned so its bot T1 time lands inside today's spread |
| Q5 | Conduit Recall options: the rule engine's (HP below 25%, formation broken, enemy charging) or the mockup's? | The engine's |
| Q6 | Names: the bible's names are placeholders | Used as display names; ids frozen |
| Q7 | The undead biome's display name: Wasteland or Graveyard? | The code's current name |
| Q8 | At M1: an outside T1 playtest before T2 is built? | Decide at M1 |
| §5 | Per-class stats (today's percentage affinities) | Kept as they are |
| §4 | Components, sockets, random drops, boss materials | None in the rework until §4 locks |

## 9. Icons

ChatGPT's image generation through Codex, one image per call, following the repo's
[icon guide](../../design_docs/visual_and_aesthetics_design/openai-icon-generation.md) and
attaching existing icons as style references. Filenames are the canonical ids.

| Wave | What | Shipped size | When |
|---|---|---|---|
| ICONS-T1 | T1 lessons and starters (`class-pieces/`), T1 trophies (`trophies/`) | 64 px | Now |
| Statuses | Each class's new buffs and debuffs (`statuses/`) | 48 px | With each class track |
| Crests | 18 disciplines (`disciplines/`) | 96 px | Before M2 |
| T2–T4 | Lessons and trophies per tier; specialization and leaf crests | 64 / 96 px | Before M2, M3, M4 |

## 10. Risks and traps

- **The suite's result is invisible two ways:** a failing run can report exit code 0, and a
  backgrounded run keeps only its tail. Read the pass count.
- **Line endings vary per file:** check `git diff --numstat` after every edit; a whole-file
  change means endings were converted.
- **Junction worktrees:** never `rm -rf` one or `git worktree remove --force` it directly;
  use the script's `remove`. Never `pnpm install` anywhere.
- **Port 4000** is often another session's server: a bot lane gets its own server and game
  database.
- **Delegates inventing design:** every brief says what not to invent; reviews check diffs
  against the bible.
- **Numbers:** every number is a placeholder for the designer and the bots.
- **The summon cap:** 9 through T1; raised only after the bandwidth diet (old plan §5).
- **Scale:** this is roughly 180 lessons, 66 trophies, 18 disciplines, 54 specializations,
  54 leaves and ~150 gear jobs through T4, plus six class runtimes. Most of it is data entry
  against a small number of runtime patterns, which is why the patterns are built first.

## 11. What the Conduit slice plan still gives

Its §2 (every §7 item mapped to code) is the Conduit track's map. Its §5 measurements set the
cap steps. Its briefs S0.2, S2.3, S3.2 and S4.2–S4.6 are rewritten for this framework as I3,
K6, S5/S6 and C-conduit.5–6. Its §6 questions are Q2–Q6 above. Its strangler rules and seam
ledger (§1) no longer apply.
