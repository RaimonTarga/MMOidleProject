# Polish & Balance Roadmap

> **Supersedes the phase ordering in `docs/archive/next-playtest-roadmap.md`** (archived) and
> in `docs/next-playtest-implementation-plan.md` §2–3. That program was built around
> *adding* systems and authoring T5/T6 as deeply-designed content. Both premises have
> changed. The implementation plan stays live as **reference** for its tooling audit
> (§5), its defect list (§5.7), and the wedge write-up (§5.8) — read those, ignore its
> phases.

Written 2026-08-11 from a working-session brain-dump plus a code read. Where this doc
and the code disagree, the code wins.

---

## 1. What changed

Two shifts, and both make the program smaller than it looks.

**The work is now polish and balance, not construction.** Every build system exists:
cores, relics, stances (11), rites (6), abilities (8, thin at T3/T4), runes, charms,
gear, seals, dungeons, biome ecology. The remaining risk is no longer *design
uncertainty* — it is **invisible scope** (a "cleanup" that never ends) and **no ground
truth** (tuning against instruments that lie). The plan below is shaped around those
two risks.

**T5/T6 flipped from front to back.** It is now an *extrapolation* of polished T1–T4
content, authored quickly and iterated — not a deeply-designed pair of tiers. Three
consequences worth stating plainly:

- **The D3 external design brief is off the critical path.** `docs/briefs/d3-t5-t6.md`
  was written to answer "what are these tiers *for*". Extrapolation does not need that
  answer up front. Drop it, or reduce it to a checklist once T1–T4 is polished.
- The 18–28 session Phase 3 estimate collapses. The cost was the *design*, not the
  data — regions are ~45-line files and the primitives all exist.
- **Nothing in Stages 1–5 below is blocked on an external answer.** Everything is
  executable now. That is the single most useful fact in this document.

---

## 2. The workstreams

Twenty-odd items from the brain-dump cluster into seven things that share a seam (W1–W7);
working seam-by-seam rather than item-by-item is most of the savings. **W8 and W9 are
carried forward from the previous program** — deferred content and the release endpoint,
recorded here so a replan does not silently drop them.

### W1 — Text & data correctness — ✅ **DONE 2026-08-11**

The "make it read as finished" sweep. Cheapest work here, highest perceived quality
per hour, and it removes noise that would otherwise pollute every screenshot and every
playtest observation made later.

Two of these have a **structural** fix that stops recurrence, which is why it is worth
doing properly once rather than patching sightings:

| Item | Grounded finding | Fix shape |
|---|---|---|
| Words split mid-word across lines | **17** `overflow-wrap: anywhere` / `word-break: break-all` rules across `client/src/**/*.css` (9 in `hud.css` alone) | Replace with `overflow-wrap: break-word` (breaks only when a word genuinely cannot fit). Keep `anywhere` **only** where long unbroken ids render. One policy, applied once. |
| Item stats show variable names (e.g. Quake Hammer) | `MECHANIC_META` in `client/src/ui/crafting/itemDisplay.ts` labels **48** keys; recipes alone author **99** distinct `namespace.key` strings. The fallback at `itemDisplay.ts:143` de-slugs the raw key, so `technique.cast-speed-pct` renders as "cast speed pct" | Complete the label table, **and add a test asserting every authored `mechanicEffects` key has a real label** — the same invariant pattern the codebase already uses elsewhere. Prevents recurrence permanently. |
| Old essence names in the combat log | `ESSENCE_LABELS` / `essenceLabel()` exist in `shared/src/items.ts`; some call sites bypass them | Route every display path through the shared labeller; grep for raw colour keys in user-facing strings. |
| Combat log is spammed and carries a stray number | `client/src/hud/CombatLogPanel.tsx`, `DamageLogRow.tsx`, `LogHeadline.tsx` | Drop the number; add a category filter so buff/debuff/regen chatter does not bury hits and kills. |
| Filler interface copy (party/solo explanation, etc.) | — | Copy sweep, one pass over panel headers and blurbs. |

`done when:` no user-facing string contains a raw key, a stale essence name, or a
mid-word break; and a test fails if a new unlabelled effect key is authored.

### W2 — Panel architecture & discoverability — 🔨 **PARTLY DONE**

Every item here is one problem: **the player cannot find what matters.** The settled
information-architecture work landed 2026-08-12; temporary stat colouring remains.

- ✅ **Runes** is a standalone destination; Loadout now groups only Overview,
  Abilities, Stances and Rites.
- ✅ **Crafting (Make)** and **Upgrade** are separate direct destinations backed by
  their existing content components rather than hidden tabs in one shell.
- ✅ The active stance is visible in the character crown and mobile status strip.
- ✅ Equipped rites, their RP costs and descriptions are listed in expanded character
  stats.

**Minimized stat panel — SETTLED 2026-08-11.** Contents, in this weighting:

- **DPS on top** (class-calculated), as the single hero figure.
- Then, all at **equal weight**: Attack Power · APS · Plating · Damage Reduction (%)
  · Movement Speed · raw HP-regen stat.
- **Colour encodes temporary change:** green while a stat is temporarily buffed, red
  while temporarily debuffed.

Everything except the colouring is already available client-side. The colouring is
**not** free — see the note below.

> **Recommendation: decide the whole top-level information architecture in one pass,
> then execute.** Five separate moves against the same shell will cost more than one
> deliberate layout decision and will probably contradict each other. The tab structure
> itself is fine — what is wrong is *what sits at the top level*.

> **The buff/debuff colouring needs a new seam.** `PlayerView` ships **final** stat
> values only (`shared/src/protocol/views.ts:297–332`) and there is no base-vs-current
> distinction anywhere in `recalculatePlayerStats` — gear, passives, cores, stance and
> buffs all collapse into one number per stat. Three ways to get the colour:
>
> 1. **Send base alongside current** — ~7 new networked fields and a second stats
>    computation per recalc. Honest, but the most plumbing.
> 2. **Derive on the client** from active buffs via a static buff-id → affected-stats
>    map in `shared/`. No new state, but it is a *declared* relationship: if a buff's
>    real effect and its declared mapping drift, the colour lies.
> 3. **Emit a per-stat direction flag during recalc** *(recommended)* — the server
>    already knows which sources contributed; tag each stat as raised/lowered by a
>    temporary source and network one compact field. Derived from the real computation,
>    so it cannot drift, and no second pass.
>
> **SETTLED 2026-08-11: stance DOES count as temporary.** So the rule is: *temporary* =
> stance + timed buffs + debuffs + status effects. *Baseline* = gear, cores, relics and
> the skill tree. A player in Berserker therefore sits on permanently green attack and
> permanently red damage reduction — which is intended, because a stance is a posture
> you can leave, unlike an equipped item. The colour answers "what is currently moving
> my numbers, and could stop", not "what is timed".
>
> Implementation note: stance stat effects fold in at a known point in
> `recalculatePlayerStats`, so classifying them as temporary is a tagging decision at
> that seam, not extra computation.

**Top-level button set — SETTLED 2026-08-11.** Promote **Upgrade** (split from
Inventory), **Runes**, and **Crafting (Make)** to their own top-level entries.
**Abilities / Stances / Rites stay grouped** under one Loadout button — they are chosen
together and rarely mid-session.

### W3 — Crafting panel — ✅ **DONE 2026-08-11**

- **Sort highest tier first.** `client/src/ui/crafting/makeEntries.ts:268` sorts
  `a.tier - b.tier` (ascending). One-line change.
- **Slot/kind icons** so stances, rites and runes stop reading as hidden. Entries are
  grouped by `KIND_ORDER` first, which is exactly why non-gear kinds feel buried.
- **Scroll containment**: scroll the item *list*, not the whole panel, and fix the
  panel's outer size so the craft controls stay on screen while browsing.
- **Tier-scaled craft animation**: fast and plain at low tier, the full ceremony at high
  tier. Less tricky than it sounds — `tier` is already on the recipe, so it is a branch
  on existing data. The real work is making the fast path feel *deliberate* rather than
  broken: keep a short crisp confirmation beat, do not simply delete frames.

### W4 — Passive tree: layout & branching *(target settled; do not let it hide inside W2)*

It is a redesign, not a polish pass, and it will silently eat a stage if folded into the
panel work. It keeps its own step.

**SETTLED 2026-08-11: the target is layout and branching structure** — real branches,
visible paths, meaningful forks and dead ends, rather than a flat or grid-like
arrangement. Explicitly *not* first: node art, respec interaction, or build-readback;
those are follow-ons once the shape is right.

This is the largest single item in the program and the only one that changes how build
*choices* feel rather than how they look. It wants its own design pass before any code:
the current tree's data shape (`shared/src/data/skillTree/`) decides how much of a
re-layout is presentation versus re-authoring, and that needs reading before sizing.

### W5 — Balance infrastructure *(the centrepiece)*

Four sub-parts. The order inside them matters more than anything else in this document.

**W5a — Fix the instruments before touching any number. ✅ DONE 2026-08-11.** Tuning on a lying tool bakes
the lie into the content. All four are known and specific:

- The bench's canonical bot now runs **Berserker Stance** — `canonicalLoadout` picks
  `stances[0]` from an alphabetically sorted list
  (`server/bench/balance/botFactory.ts:90`). With 3 stances that was Defensive; with 11
  it is Berserker: +65 attack, +25% attack speed, −12% DR, and 2% max-HP/sec self-damage
  that bypasses mitigation and can kill. Rites are admitted greedily in alphabetical
  order too.
- The bench **never equips a relic** — nothing in `server/bench/balance/` references
  them. T4 runs are missing the T4 build system entirely.
- ~~`dps-report` and `ehp-report` do not execute~~ — **STALE, corrected 2026-08-11.**
  Both run fine today. The one that was broken was **`mob:report`** (and `mob:llm`),
  whose script line was missing the `--tsconfig ../tools/tsconfig.json` flag its two
  siblings carry. **Fixed 2026-08-11 in `package.json`** — a one-line change, not the
  lockfile surgery §5.7 defect C predicted. All four generators now run.
  *Its output had never been seen, and it turned out to already contain most of the
  cross-biome table W5c wants — see the note under W5c.*
- The fight bench defaults to `--time-scale 5`, where measured T3 throughput ran ~18%
  low. Farm mode already caps at 2. Decide the default now.

**W5b — Write down what "balanced" means, before measuring anything.** A design
statement, not tooling, and it changes what every later number is judged against:

- Biomes within a tier move from **equal budget → a deliberate difficulty ordering**.
  **SETTLED 2026-08-11: authored per-mob, no multiplier.** The shared budget goes away;
  every mob carries its own hand-set numbers. Maximum expressiveness and maximum
  control — and see the consequence below, because it changes the ordering of this
  workstream.
- **Sharper scaling across tiers** for mob strength, rewards, *and* player strength.
  Today `BIOME_ESSENCE_TIER_MULT` *dampens* rewards at higher tiers (0.85 at T2), which
  is the opposite of the stated intent — a tension parked since the rework, settled here.
- Where the curve is allowed to end, so T5–T8 keep headroom.

`done when:` a short authored doc states the intended per-tier and per-biome bands, and
the existing formulas have been read against it.

> **Consequence of choosing authored-per-mob: W5c stops being a convenience and becomes
> load-bearing.** With a per-biome multiplier, "is mountain T3 in line with jungle T3?"
> is answered by reading two numbers. With hand-authored mobs across **11 biomes × 4
> tiers**, nothing in the data answers it — the only way to see drift is a generated
> cross-biome table. So:
>
> - **Build the enemy-table generator BEFORE authoring mob numbers, not after.** It is
>   the instrument that makes this model tunable at all; authoring first means tuning
>   blind and discovering the drift later.
> - The table needs a **cross-biome comparison view at fixed tier** (every biome's mobs
>   side by side at T3), not just per-biome sheets. That comparison *is* the budget,
>   now that no budget constant exists.
> - Expect to want a **cheap consistency check** — e.g. flag any biome whose mean
>   effective HP or damage at a tier sits far off its siblings. Not a hard rule, since
>   deliberate outliers are the whole point; a report, so intentional outliers are
>   visibly intentional.

**W5c — The reference layer: tables agents can read without digging.** Much of this
**already exists and had simply never been runnable.** `tools/mob-report.ts --llm-packet`
profiles every mob per biome × tier against four reference players and emits a markdown
packet. With `mob:report` fixed (W5a), its output is visible for the first time — and it
already answers most of the cross-biome question.

What its first run revealed at biome tier 3, entry-player column:

| Biome | Incoming DPS | TTL pressure | Status |
|---|---:|---:|---|
| Swamp | 30.4 | 9.7s | **Blocked** |
| Mountain | 11.1 | 26.5s | Risky |
| Caverns | 10.8 | 27.4s | Risky |
| Tundra | 3.74 | 78.8s | Safe |
| Jungle | 1.81 | 163s | Safe |
| Desert | 1.75 | 169s | Safe |
| Volcanic | 0.49 | 597s | Safe |

**A ~60× spread at a single tier.** Biomes already do not share a budget — it just was
not deliberate. Swamp T3 is unclearable for an entry player; Volcanic T3 is a rest stop.
That is the raw material the authored-per-mob model has to organise.

The shipped extensions add a fixed-tier cross-biome ranking view, rewards beside
threat, a deviation report, and a single data accessor for the planned tuning overlay.

**Balance Lab MVP, 2026-08-12.** Those analytical views now also have one interactive,
read-only home in the trusted local Admin app: tier-level world overview, entry-reference
context, searchable encounter roster, and authored/derived encounter inspection. The
typed snapshot is built from shared formulas and delivered by the server; the React UI
does not own a second model. Farm income, layered build sweeps, reversible overrides and
the full route timeline remain subsequent Lab slices.

**Instrument hardening, 2026-08-12.** Those extensions are now shipped. The monster
packet also uses shared `estimatePlayerDps` across concrete class builds (including a
full Conduit formation) for boss TTK instead of averaging non-summoner auto-attacks.
The detailed DPS report remains intentionally richer: its use of
`estimatePlayerHitDamage` is the target-mitigation primitive inside a T3/T4
spec/weapon model, not a direct-hit-only output model. The balance-instrument wiring
test now lives under `server/test/`, so the normal CI suite discovers it.

**W5d — Route bots: the honest income measurement.** The framing — *bots with an
established route, not driven by agents* — is worth highlighting:

> **This is the parked agent play-harness (implementation plan §6) minus the LLM — and
> the LLM is precisely the part you don't want.** §6 sized a v1 at roughly two sessions
> because the *write* half already exists: `ClientToServerEvents` is already a
> strategic-decision API (`player:navigateTo`, `player:setAuto`, `inventory:equipItem`,
> `inventory:upgradeItem`, `crafting:craftRecipe`, …) and `setAuto` + `setAutoTraverse`
> already *are* the character controller. Swap the model for a scripted route policy and
> most of the design problem leaves with it.

What the farm bench already does: real open-world nodes, real repopulation, real
`grantMonsterRewards`, real deltas read as a ledger. What it does **not** do, and what
the route bot adds: **travel between nodes, crafting, upgrading, and progression over
simulated hours**. That delta is the tool — not a new simulator.

Two constraints carried forward, both measured, both real:

- **Fidelity ceiling is `timeScale ≤ 2`.** Coarse ticks quantise attack cadence
  downward, so throughput can only be understated; above 2 the error compounds in one
  direction.
- **Death policy must be explicit.** It changes throughput materially — and it has
  already caused one wrong diagnosis (see the note under W6).

### W5e — Balance methodology: what you actually balance *around*

*Raised by the user 2026-08-11, and it is the right question to raise before building
more measurement.*

**The problem.** With skills × stances × rites × cores × relics × gear × runes, the
build space is not enumerable — the bench was already at ~1.9M parties for T4 overlord
runs *before* stances, rites and relics existed. And "balance around the optimal setup"
has no fixed target: the optimum varies by biome, by mob composition, and by whether the
player is farming or fighting a boss.

**The reframe: that variation is the design working, not an obstacle to measurement.**
If the best setup for swamp differs from the best setup for mountain, build diversity is
doing its job. The failure mode is the opposite — one setup that dominates everywhere.
So the question to instrument is not *"how strong is the optimum?"* but *"does the
optimum change across contexts?"*

Three practical consequences:

1. **Balance against a floor, not an optimum.** Ask "can a competent, non-min-maxed
   build clear this?" rather than "can the best build clear this?". The optimum's job is
   then to be *faster*, never to be *required* — which is already a stated design rule
   ("no class, build, item or progression route is mandatory") and matches the
   constraint that a player must be able to clear each new zone.
   **This pattern already exists:** `tools/mob-report.ts` profiles every biome against
   four reference players — Entry (prev-tier +3), Same-tier +0, Same-tier +3, and
   Boss-ready. Those *are* the floor. Extend that idea rather than inventing one.
2. **Layered sweeps, never the cross product.** Fix a canonical loadout on every axis but
   one, sweep that axis, record the delta against baseline. Cost is linear in content
   instead of exponential, and it answers the question a balance pass actually asks — "is
   this core / relic / ability in line with its siblings?" See implementation plan §5.3.
3. **Run a dominance check instead of an optimum search.** Sample builds across several
   contexts and flag any option that is best in *every* context (a genuine balance
   failure) or best in *none* (dead content). This needs no true optimum — only a
   comparison — so it is tractable where an optimum search is not.

**What this rules out:** trying to simulate the full build space. It is intractable, and
a tool that claimed to find "the optimal build" would be reporting its own sampling
heuristics back as design guidance. The answer to complexity here is a better *question*,
not a bigger simulator.

`open:` which 2–3 reference builds per class root represent the floor. Best decided by
looking at the generated tables, not in advance.

### W6 — Mob & boss redesign

- **Behavioural variety per mob**, using the shipped ecology primitives — cave brutes
  are the template that worked. The mountain T2 example (rocs/eagles overflying ledges at
  speed) is the one item in this whole list needing a **genuinely new primitive**: the
  nav grid is built per mover target (`'player'` / `'monster'`), so a *flying* mover that
  ignores block terrain is a third mover class, not a stat tweak. Scope it deliberately —
  it is reusable across biomes once it exists.
- **Boss encounters**, now that a dungeon is altar + guard + boss and the primitive set
  is much richer. Every dungeon number is a placeholder today.

> **Mountain is lethal, and that is a balance finding, not a bug.** With the auto-combat
> wedge fixed (2026-08-10), a T1 **ranged** bot still dies **~30×/simulated hour** on
> `node-t1-mountain-01`; a melee cadence bot dies ~1×, and plains **0**. That class
> asymmetry is exactly what W5b should decide deliberately rather than inherit.
> Implementation plan §5.8's kills/hr table was collected with a broken probe and
> measures *death*, not pathing — re-collect it.

### W8 — The build-content gap: abilities at T3/T4, and a coherence pass

*Carried forward from the previous program. Deferred, not cancelled — it would be lost
otherwise, which is exactly how a gap like this survives a replan.*

**Abilities stop at tier 2.** `shared/src/abilities.ts` holds **8** abilities — 5 at T1,
3 at T2 — while `abilitySlotCount` (`abilities.ts:207`) grants a T3 player **2 Technique
slots** and a T4 player **2 Technique + 2 Guard**. So a T4 character has four slots and
nothing tier-appropriate to put in three of them.

The previous plan called this the one thing it would not cut, on the reasoning that
empty build slots at the tiers a playtest lives in drown out every other signal. The
user deliberately deferred it past the progression walkthrough (2026-08-10) — which is
the right call *given* that the walkthrough is a progression-integrity hunt rather than a
build-feel review. It still has to happen before anyone judges how builds feel.

- **Wave 2 (T3 roster)** — six abilities per the shipped plan: Whirlwind (Volcanic),
  Stun Strike (Cave), Ward (Tundra), Frost Bite (Tundra), Parry (Mountain), Detonate
  (Swamp). Two genuinely new primitives: a shared monster-control primitive lifted out of
  the DoT chill/freeze code, and Parry's negate-next-hit plus attack-timer reset.
- **Wave 3 (T4 roster)** — Fervor (Volcanic), Disengage (Desert), Contagion (Wasteland),
  Abyssal Ward (Trench), Weakening Strike, plus one more casted Technique. Needs two
  small calls first: the T4 third-cast identity (open item **O4**) and Weakening Strike's
  biome. Neither needs a design brief.
- **T2 ability icons** are drafted in `art/manifests/ability-icons.json` but **not
  generated**, so Bramble Guard / Charge / Charged Strike render placeholder tiles.
  Generating spends real API credits — `--dry-run` first, and the user accepts candidates
  in the gallery, never the agent.

**Coherence review.** Also carried forward: with cores, relics, stances, rites,
abilities, runes, charms and gear all finally present at once, review them against each
other for identity conflicts — options that say the same thing twice, or class and item
identities that no longer fit the ability system. Produce a written list, each item
resolved or explicitly deferred. This is the first point in the project's history where
the review is even possible.

### W9 — Validation, deployment, and the release

*Also carried forward. The previous program had a whole phase for this; the new one had
none, which would have quietly turned "polish and balance" into work with no endpoint.*

- **The T0→T4 progression walkthrough.** Play a character through and record every
  blocker, empty slot, dead recipe and unreachable unlock, tagged blocker / content /
  polish. This was the original ask that started the replan and is still not done. Best
  run **after Stage 1** (so stale text does not generate false findings) and **before**
  the balance pass (so structural blockers do not get mistaken for tuning problems).
- **Admin auth is a hard deployment blocker.** `/admin` and the `/admin` Socket.IO
  namespace are not covered by Discord player authentication. Per `CLAUDE.md`, admin is
  trusted-dev-only until this lands. It cannot ship to a public playtest as-is.
- **Railway deployment.** The live deployment runs the **release** branch and is
  deliberately untouched — a stable reference, not a risk to manage. Cutting the next
  release means a fresh deployment: production game DB, log DB, Redis, Discord OAuth
  credentials and callback verified in the deployed environment, persistence confirmed
  across reconnect and restart.
- **Release cut.** `docs/release-flow.md` owns the mechanics (`pnpm release:prepare` /
  `release:cut` from `develop`). Last release was **v0.4**; there are **107+ unreleased
  commits** on this branch.
- **Playtest support**, if the release is a playtest: test accounts, reset tools, the
  intended tester path, a known-limitations list, and a bug-reporting route.

### Deliberately dropped

Recorded so it is a decision rather than an omission:

- **Optional multiplayer boss encounters.** Carried as optional in the previous program
  and already marked first-to-cut. Parties, shared nodes and same-node reward sharing all
  work today and will generate multiplayer feedback without a bespoke encounter. Revisit
  after a release, not before.

### W7 — T5/T6 extrapolation

Last, deliberately shallow, then iterate. Regions are cheap data
(`shared/src/world/map/regionT*.ts`); the hard constraint is that **every biome × tier
present in a region needs a monster pool or the world throws at boot**. Seals already
handle a missing tier gracefully — `SEALS_REQUIRED_BY_TIER` treats the highest authored
tier as a ceiling, not an impossible gate — so adding a tier is additive, not a migration.

---

## 3. Ordering

Sequenced so the cheap, visible work lands first and nothing is tuned against a lying
instrument.

| Stage | Content | Why here |
|---|---|---|
| ~~**1 — Reads as finished**~~ ✅ | W1 text/data sweep, W3 crafting panel | **DONE 2026-08-11.** |
| **2 — Findable** | W2 panel architecture | Needs one deliberate IA decision, then executes fast. |
| **3 — Honest instruments** | ✅ W5a fixes · ✅ W5c reference layer · ⬜ **W5b balance model** | W5a and W5c landed 2026-08-11. **W5b is the remaining gate on the balance pass** and is the user's own design statement, not an agent task. |
| **4 — Real measurement** | W5d route bots | Builds on Stage 3's fixed bench. Cheaper than it sounds (§6 minus the LLM). |
| **5 — The balance pass** | Your numbers pass, against measured income | The thing Stages 3–4 exist to serve. |
| **6 — Content depth** | W6 mobs + bosses | After the model is set *and* the cross-biome table exists (see W5b) — with authored-per-mob numbers that table is the only view of drift. The flying-mover primitive is scoped separately. |
| **7 — Extrapolate** | W7 T5/T6, then iterate | Copies whatever polished T1–T4 has become. |
| **8 — Release** | W9 admin auth, deployment, release cut | The endpoint. Without it "polish and balance" has no finish line. |

**W8 (abilities T3/T4 + coherence review) slots between Stages 5 and 6.** It is content
authoring, so it wants the balance model settled (Stage 3) and the measurement working
(Stages 4–5) before the numbers are chosen — but it must land before anyone judges how
builds *feel*, which makes it a prerequisite for judging W6's content depth.

**The T0→T4 walkthrough (part of W9) runs early, not at the end** — right after Stage 1,
so stale text does not generate false findings, and well before the balance pass, so
structural blockers are not mistaken for tuning problems. Everything else in W9 is the
endpoint.

**W4 (passive tree) floats.** Independent of everything else and gated on a design
target — slot it whenever that target exists, but give it its own step.

### If it needs to compress

In order of value preserved per hour saved:

1. **W4 passive tree** — largest, vaguest, least coupled to anything else.
2. **W3 craft animation tiering** — the sort/scroll/icon fixes are what players actually
   feel; the animation is the smallest share of the benefit.
3. **W6 flying movers** — a new mover class is real engineering; ordinary behavioural
   variety with existing primitives delivers most of the perceived variety.

**Do not compress W5a.** Four known-broken instruments is the cheapest fix on this list,
and every number produced before it is fiction.

---

## 4. Blocked on you

All four blocking decisions were **settled 2026-08-11**:

| Item | Decision |
|---|---|
| W2 minimized stat panel | DPS on top; Attack / APS / Plating / Reduction / Move Speed / raw regen at equal weight; green when temporarily buffed, red when debuffed |
| W2 top-level architecture | Promote Upgrade, Runes, Crafting; keep Abilities/Stances/Rites grouped |
| W4 passive tree | Layout and branching structure first; art, respec and readback are follow-ons |
| W5b balance model | Authored per-mob, no multiplier |

Two smaller confirmations still open, neither of them blocking:

1. **Does an active stance count as "temporarily buffed"** for the stat-panel colouring?
   (Working assumption: no — stance, gear, cores and relics are baseline.)
2. **The per-tier growth shape** — how much sharper mob strength, rewards and player
   strength should scale per tier. This is a numbers question, best answered against the
   generated tables rather than in advance.
