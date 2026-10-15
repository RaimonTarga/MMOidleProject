# Class-first build: status board

Kept by the conductor. Plan: [class-first-build-plan-2026-10-14.md](../class-first-build-plan-2026-10-14.md).
Integration branch `rework/class-first` (conductor worktree `../mmo-rework`).

**Updated:** 2026-10-15 (night): all delegate tasks merged except CD8-CLEANUP (running); 353/353; the first live smoke run found no server errors, the Striker cannot yet beat the Plains boss (balance).
**Baseline:** `rework/class-first` after the CQ7 merge: full suite **342/342** (biomeEcology flakes under load), typecheck clean.
Codex hit rate limits on 2026-10-14, so D5, K1–K3, D1, T0 and D2 ran as Claude subagents of the conductor (same briefs, same worktrees).

## Designer decisions (2026-10-15)

Recorded in the bible (§4 Armor/charm row, §5) where they are design.

| Call | Decision | Work it creates |
|---|---|---|
| S4: what "Recovery doubles/triples" multiplies | **A small always-on in-combat Recovery share for every class**; such lines multiply it; Old Guard-style lines add to it | S4 (conductor): the baseline (placeholder share) + Rhythm, Cairnstone, Counterbalance, Stone Patience |
| S7: Mountain and Tundra charm bases without the barrier | **A timed ward**: Mountain after a hit over a quarter of your HP, Tundra when the Chill freezes you; it absorbs part of the next blow for a few seconds | S7 (conductor or Grok) |
| Moved gear lines (12 per class) | **Second bases**: the receiving biome gets a second armor and charm recipe carrying the moved lines, for every class | G-GEAR-C (brief by the conductor; data for Grok) |
| Art | **Redraw** the three Striker crests and the five flat T1 icons | ICONS-3 (Codex), ready |
| Planted | **No knockback at all** while braced: lift the forced-movement cap for it | conductor, small |
| The Striker's old special-move FX | **Delete** (`client/src/fx/bespoke/striker.ts` path entries, the Swiftblade branch; lower `attackProgression.test`'s count) | conductor or a delegate, small |

## Open tasks

| ID | Task | Agent | Worktree · branch | State |
|---|---|---|---|---|
| (none) | every delegate task is merged, CD8-CLEANUP included (`rework/class-first`, 349/349) | | | |

All delegate tasks are merged (2026-10-15 night): CD6, CD7, CD8, CL5, CL6, CL7, SP5, SP6, SP7, AP5, AP6, AP7.

## Paste-ready prompts

Open the agent **in the task's worktree folder** and paste its prompt.

**CD6-UI (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-cd6-ui`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/cd6-ui. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS5-striker-ui.md, then do the task marked CD6-UI in
docs/briefs/class-first-build/CD-conduit-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**CD7-ROUTE (Codex or Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-cd7-route`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/cd7-route. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS6-striker-route.md, then do the task marked CD7-ROUTE in
docs/briefs/class-first-build/CD-conduit-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**CD8-CLEANUP (Codex or Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-cd8-cleanup`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/cd8-cleanup. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS7-striker-cleanup.md, then do the task marked CD8-CLEANUP in
docs/briefs/class-first-build/CD-conduit-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**CL5-UI (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-cl5-ui`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/cl5-ui. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS5-striker-ui.md, then do the task marked CL5-UI in
docs/briefs/class-first-build/CL-slinger-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**CL6-ROUTE (Codex or Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-cl6-route`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/cl6-route. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS6-striker-route.md, then do the task marked CL6-ROUTE in
docs/briefs/class-first-build/CL-slinger-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**CL7-CLEANUP (Codex or Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-cl7-cleanup`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/cl7-cleanup. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS7-striker-cleanup.md, then do the task marked CL7-CLEANUP in
docs/briefs/class-first-build/CL-slinger-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**SP5-UI (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-sp5-ui`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/sp5-ui. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS5-striker-ui.md, then do the task marked SP5-UI in
docs/briefs/class-first-build/SP-spirit-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**SP6-ROUTE (Codex or Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-sp6-route`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/sp6-route. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS6-striker-route.md, then do the task marked SP6-ROUTE in
docs/briefs/class-first-build/SP-spirit-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**SP7-CLEANUP (Codex or Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-sp7-cleanup`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/sp7-cleanup. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS7-striker-cleanup.md, then do the task marked SP7-CLEANUP in
docs/briefs/class-first-build/SP-spirit-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**AP5-UI (Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-ap5-ui`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/ap5-ui. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS5-striker-ui.md, then do the task marked AP5-UI in
docs/briefs/class-first-build/AP-apprentice-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**AP6-ROUTE (Codex or Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-ap6-route`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/ap6-route. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS6-striker-route.md, then do the task marked AP6-ROUTE in
docs/briefs/class-first-build/AP-apprentice-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

**AP7-CLEANUP (Codex or Grok)**, folder `C:\Users\osaif\Documents\Claude\Projects\mmo-rw-ap7-cleanup`:

```text
You're working on the MMO Idle class-first rework, in this folder, on branch
rw/ap7-cleanup. First read docs/briefs/class-first-build/AGENT-RULES.md and
CS7-striker-cleanup.md, then do the task marked AP7-CLEANUP in
docs/briefs/class-first-build/AP-apprentice-delegates.md. Work only in this folder; never
run pnpm install. When you're done, commit on your branch, write your report where the
brief says, and tell me.
```

## Queued (briefs written when their inputs land)

| ID | Task | Agent | Waits for |
|---|---|---|---|
| Next class | The Conduit ([C-conduit](C-conduit.md): CD.1–CD.5 done, CD6–CD8 are delegate tasks), then Slinger, Spirit, Apprentice | Conductor | — |

## Live smoke run (2026-10-15 night, `a7fb962b`)

A private server (port 4301, databases `gamedb_rework` / `logdb_rework` in the dev containers) and
the bot at 25x rewards (a pipeline test, not an evaluation). **No server errors, no invariant
failures, migrations and the marker/network checks all pass.**

- **Conduit, Slinger, Spirit, Apprentice** (`smoke-t1`, `--class=summoner|reload|energy|dot`): each
  picked its class, got its default config, fought through the Clearing and the Plains, crafted
  and wore the Plains vest. 11-14 kills each, 0-1 deaths. (This proves the class pick, auto
  config, the new runtimes' per-tick updates and the crafting path live; it does not exercise
  their special mechanics beyond what auto play does. Their own routes arrive with CD7/CL6/SP6/AP6.)
- **Striker** (`striker-t1`): first run had no gear steps and died in a loop at the Plains boss
  (route gap, fixed in `a7fb962b`: the routes now craft and wear the seal zone's weapon job and vest).
  With gear it reached the Plains boss every time (guards cleared in ~65 s) but lost all four
  attempts, the boss at 52% / 44% / 43% HP when the Striker died (26-32 s into the boss fight).
  81 kills and 5 deaths over 20 min.
- **Squire** (`squire-t1`): farmed Plains, Forest and Swamp and was in the Mountain when the 20-minute
  cap hit: 29 kills, 12 deaths (the Mountain hits hard).

**Findings for the designer (balance, not wiring):** the Striker cannot kill the Plains boss with the
T1 kit as built (bible §12: the base kit must win the first boss); the Squire dies often in the
Mountain. Every number is a placeholder (`shared/src/classKits/*/kit.ts` params and the `configs/`
constants); `pnpm bench:server` against a pre-rework baseline is the way to size it. **Not checked:**
whether the Order's techniques fire as designed in a real fight (the run telemetry does not log
them): worth a look in the client or a log line.

## Known follow-ups (not yet a task)

- **From the 2026-10-15 delegate reports (not yet tasks):** the Conduit HUD cannot show the next
  rebuild's HP cost (needs a networked `costHp` on the active reconstruction); the Slinger's
  trophy-round callout and the Apprentice's trophy/chain callouts need the server to publish a
  last-round / payoff event on the combat event (`slingerLastRound` stays on the server context);
  the Apprentice's sigil ring follows only the local player's current target (the client gets no
  per-enemy owner counts); the Spirit's character crackle thinning was skipped; SP7 kept
  `energy.flash`, `energy.range-mid-discharge-stagger-ms`, the AC marker slots and generic FX
  primitives (their readers live outside its paths); CL7 kept `reload.acquire-radius-mult`, the
  tactical-reload rune, the empowered multiplier registration and `client/src/fx/bespoke/slinger.ts`;
  player-facing copy still says "65% effectiveness" in `reload-root`, `ClassIdentity.tsx` and
  `abilityText.ts`; `docs/guided-tutorial-current-state.md` and `docs/bot-experiment-runner-current-state.md`
  still say no class builder / only `smoke-t1` (docs pass).
- **Fixed on merge:** the client's Formation view ignored the weapon's Command (`budgetBonus` on
  `ClassStateInput`; `useFormationView` passes `conduit.command`).

- **Apprentice stand-ins and gaps:** Numb slows movement only (no attack slow); Petrify's "takes
  more damage" and Seize rank II/III are not wired; Stone Sigil is the whole-hit `hit-to-dot` rather
  than "a hit over a quarter of your HP"; the sigil tick (12% of attack per sigil per second, 6 s
  life), the payoff numbers and every cooldown are placeholders; the element is raw violet only
  (T2 disciplines give it a colour and the signature); sigils reuse the class DoT status id (`dot`),
  flagged `data.sigil`; Spread acts every second while its rule holds; `dotClassProfile.ts` and
  the old curve stay until AP7.

- **Spirit stand-ins and gaps:** Slipstream (glide after a dodge) is key-only; Grounded stops forced
  movement but not stuns; the storm pip (12 x tier scale), flow (10%/s, x2 out of combat), spend gap
  (0.7 s), zap share (25%) and every piece and trophy number are placeholders; Drenching Staff's soak
  is a timestamp, not a status; the barrier engine stays for no one now (XC1 moved the Mountain and
  Tundra charms to timed wards); disciplines (Overflow, Reservoir, Tide), T2+ pieces and trophies
  (Running Storm, Sandstorm...) and the gauge's crackle FX are T2+; spends pick their target from the
  player's current attack target within 260 px.

- **Slinger stand-ins and gaps:** the "never reload inside a telegraph" free rule is stored but not
  enforced (the reload still starts when the clip empties); double loads (T3) and the Gunslinger /
  Siege / Trickshot disciplines are T2+; the Slinger's T1 power curve moved (the old 0.65 attack and
  double-speed layers are gone: DPS per gun is now attack x its own fire rate): measure with
  `bench:server` against the Striker and flag to the designer; typed rounds trade 10% damage, Venom and
  Rot Round ride the bleed driver (red numbers), Snare slows movement only (no attack slow yet);
  Regroup/Quickdraw/Elbow Room/Dig In/Hunker/Oilskin are wired but untuned; T2+ clips (Buckshot,
  Shellbreaker, Tracer...) and trophy rounds (Hunter's...) have no runtime yet.

- **Conduit stand-ins (designer to look at):** the Mountain Soul's shield is a heal (minions have no
  ward); the Cave Soul's spiderling is a free half-strength strike every 2 s (no temporary summon
  entity yet); Deep Reserve doubles rebuild speed instead of rebuilding two at once; the Poison
  Staff reuses the bleed driver (ticks stack, red numbers); Soul seed lines, the T1 weapon and line
  numbers and the Soul body's 1.3x HP / 1.2x damage are placeholders. Lines on T2+ bases
  (Sentinel, Bloomlink, Sandveil, Purge, Permafrost, Hibernate, Fireproof, Emberglow...) and the
  T2+ weapon jobs (First Strike, Longshot...) are still `effects: {}`.

- **S7 follow-ups:** the ward is `defense.ward-hit-pct` (Mountain, a hit over `CHARM_WARD_BIG_HIT_PCT` of max HP) and `defense.ward-freeze-pct` (Tundra, the rising edge of the Frozen status on you, whoever applied it); size, 5 s window and 10 s gap between raises are placeholders (`GAME_CONFIG.CHARM_WARD_*`). The barrier engine, its Guard hooks and the Mountain armor-branch barrier recipes stay for the Spirit (XC1). `barrier.test` and `charmHooks.test` lend the T4/T1 charms the old barrier lines in-test. The 6 charm entries in `nonWeaponLadders.fixture.ts` were repointed to the ward values.

- **S4 follow-ups:** the always-on share (`RECOVERY_COMBAT_BASE_SHARE` 0.05), the boost window (`RECOVERY_BOOST_MS` 4 s), Rhythm's 20 s build-up and the x2/x3 factors are placeholders. Multipliers apply to the always-on share only (base + Old Guard), not to pulse/kill/skill sources. Conduit's Cairnstone carries the same big-hit keys (threshold a quarter of max HP). The other classes' Recovery lines are wired when their gear lines land.

- **Bench specs throw on import:** `server/bench` specs and studies built on frame and path
  builds (`playerBreadthSpec.ts` and everything importing it). Typecheck passes; running them
  fails. A bench cleanup task, after D1 and D2.
- **Apprentice:** `dotClassProfile.ts` still looks up the removed `dot-*` frames, so all three
  elements share the fire defaults until the Apprentice track replaces it.
- **Bot leftovers from D5:** the stale generated `reports/bot-route-reference.md`, the
  `scripts/experiment` flags the bot now ignores, `server/scripts` diagnostics that import
  deleted bot modules, and three bot docs (`docs/t2-bot-testing-infrastructure.md`,
  `docs/bot-harness-capability-audit.md`, `docs/bot-experiment-runner-current-state.md`).
  `attemptBoss.repeat` is gone: repeated boss kills for trophy ranks need a new signal when
  the class routes return.
- **From D1:** `Recipe.lineageId` survives only on the 12 core recipes (goes with the core
  slot in D2, with `coreAuthoring.test.ts`); the Guard keystones' statuses
  (`ability-unyielding`, `ability-immunity`, `ability-entangled`) are dormant but still read by
  boss AI and status code (goes with the abilities in D3); unused pipeline hooks
  (`applyMechanicProxy`, the reload's "readied without a reload" path, `applyPlayerAoeTo`, the
  contagion copy's `stackFraction`); `'evolve'` / `'reconstruct'` in `gameplayRecorder.ts`'s
  kinds; living docs still describe lineages, shards and node rows (docs pass at M0 exit).
- **Gear:** Clearing starters are tier 1 over the tier-0 club; Jungle weapons copied the rapier's
  `onHitDamage`; where a biome-tier had two generic weapons the first was copied. The moved
  lines (listed in reports G-GEAR-A/B) get second bases (decided, G-GEAR-C).
- **From D3:** nothing calls `fireTechnique` / `fireGuard` until the class runtimes do; nine
  rune conditions only Use Ability accepted now have no action (they seed the moments); the
  Auto Combat / Fight Back gate on ability firing went with the loop (class runtimes decide);
  bench bots fire no abilities; scripts outside typecheck (`server/scripts/*Preflight`, the root
  `boss*.mjs`, `tools/uishot/mobile-audit.mjs`) still name removed things.
- **Striker numbers (designer):** every T1 technique and trophy number is a placeholder in
  `shared/src/classKits/striker/kit.ts` (`params`), the price in `configs/striker.ts`
  (`STRIKER_TECHNIQUE_SWING`). Mastery picks the first techniques in beat order (stand-in: the
  Order doesn't say which one a step masters; T1 never masters). Sunder II's plating loss has no
  number yet.
- **From S1:** monster-ability effects (generic slow/antiheal/sunder) and ambient ramps still
  reach players only; summons show no statuses on the client yet (the Conduit HUD decides).
- **From D2:** `CrestDiamond` (primitive + CSS) is unused; `resolveFinalDamageMultipliers`
  always returns `taken: 1` (kept: the HP forecast reads it); `attunementCost` and RP comments
  in `abilities.ts` go with D3; `tutorial/scripts/runes.ts` (one "2 RP" comment) goes with D3;
  `volcanoHeatCases.json`/`volcanoHeatReferences.json` and the `v1d-earned-t1-state.json`
  fixture still name cores and stances (only manual scripts read them).
- **Squire moments:** Challenge also answers "an enemy attacking an ally" and Unbowed only
  untelegraphed blows; neither has its own moment yet (Squire track).

## Done

| ID | Task | Merged |
|---|---|---|
| CD6-UI, CD7-ROUTE, CL5-UI, CL6-ROUTE, CL7-CLEANUP, SP5-UI, SP6-ROUTE, SP7-CLEANUP, AP5-UI, AP6-ROUTE, AP7-CLEANUP | The four classes' editors and HUD, tutorials and bot routes; the Slinger, Spirit and Apprentice cleanups (Grok: CD6/7, CL5/6/7; Codex: SP5/6/7, AP5/6/7). Registries and the tutorial test reconciled by hand; the three cleanups' overlapping deletions merged as "neither side's legacy survives" | `8a2556d7`, `ae97176d`, `1a2976f0`, `2214470f`; 353/353 |
| AP.1–AP.4 | The Apprentice: hits lay linear sigils (weapon potency, never the hit; cap = the budget); the Payoff rules spend them at moments (Detonate, Spread, Numb, Siphon, Seize, Converge); the five T1 trophies; the weapon shapes and T1 lines; `composePayoffsView`; `apprenticeSigils.test.ts` | `93ba0920` + fix; 350/350 |
| SP.1–SP.4 | The Spirit: the storm (one bar of damage and shield, constant flow, hits and DoT drain it, Eye of the Storm, Sealed Vessel); the bands, floor and gather/hover phases; Bolt, Chain Lightning, Thunderclap, Downpour, Thunderbolt; the five T1 trophies; weapon shapes and the T1 lines; plain zaps at a quarter; `composeThresholdsView`; `spiritStorm.test.ts` | `e60d8053`, `8e43ce0f`; 347/347 |
| CL.1–CL.4 | The Slinger: fire rate is the gun's stat (half-damage and double-speed layers gone); the Loadout picks the clip at each reload; per-round effects (Scatter, Snare, Venom, Stopping, Breaching); trophy rounds (Stampede, Twin, Rot, Quake, Splinter); the stationary reload; the six T1 guns and the T1 lines; `composeLoadoutView`; `slingerLoadout.test.ts` | `0d3e7ad6`, `6d975cf9`; 345/345 |
| CS5-UI, CQ5-UI, G-GEAR-C | The Striker's Order editor and beat strip; the Squire's Response rules editor and Resolve pips; every class's moved lines on second bases (Grok); census tests skip `-b` bases | merges `5f44dbda`, `8791410c`, `75958acc` |
| ICONS (designer) | The 74 style-recovery class-piece and trophy icons wired over the earlier versions; cache-busting v2 | `ce68c66f` |
| CD.4, CD.5 | The Conduit's Souls (a free extra body plus the five T1 seed lines); the weapon jobs and T1 lines (Command from the weapon, multipliers, Poison Staff, Shared Plating, Herd, Deep Reserve, Bramble, Sapbark, Poison Shift, Bloodtithe, Big-Hit Intercept, You Tank); `composeFormationView` | `5bc76699`, `8cbe526f`, `df14e201` |
| CD.1–CD.3 | The Conduit: the formation is the roster in the class config (`RosterBody`, `<piece>#<n>` slots); the T1 types' stat multipliers, acid, power shot and taunting sweep (`summonPieces.ts`); the orders, Recall rule and rebuild order (`formationOrders.ts`); `conduitFormation.test.ts` | `be52d9fa`, `a9994353`, `208a7f46`; 343/343 |
| F7-PANEL, CS6-ROUTE, CQ6-ROUTE, CQ7-CLEANUP | The class screen shell; the Striker's and Squire's tutorials and bot routes; the Squire's frame loop and T3 paths deleted (Grok) | merges `093c1050`, `84a63cc5`, `a15f697f`, then CQ7; 342/342 |
| S7 | The timed ward on the Mountain (big hit) and Tundra (frozen) charm bases, replacing their barrier; `charmWards.test.ts` | next commit |
| S4 | The always-on in-combat Recovery share for every class; Recovery-multiplier lines (Rhythm, Cairnstone, Counterbalance, Stone Patience); `recoveryBoost.test.ts` | `76ae8143` + test fix |
| Planted, Striker FX | Braced Squire takes no forced movement at all; Striker special-move FX and Swiftblade branch deleted (`attackProgression` count 36) | `bb1a196e` |
| I1 | Agent worktree script | `c363ff18` |
| I2 | Plan, agent rules, this board | `011e95d2` |
| F1 | Class kit types, registry, moments, budget, scaling | `d1a7aac9` |
| D5 | Bot: class-agnostic harness, smoke-t1 route (subagent); server lane benches and setActive removed | `8c18ccbc`, `f8d6e40f` |
| D6 | Tutorial: engine, opening, class-agnostic seal route, per-class seam (Grok); merged with D1's removals | `e9b9af41` |
| I3 | Bench fights real T1 nodes; `bench:summon-cap` (Grok) | `d1ba3b3b` |
| K4–K6 | Slinger, Spirit, Conduit kits through T4 (Grok); 11 undesigned trophy ranks given placeholders | `07e6d86f`, `68711dd9`, `29b72c28`, `78d2fbb4` |
| ICONS-T1 | 60 Tier 1 icons, 52 generated (Codex image generation); full-res sources kept in the main checkout's `art/candidates/openai-icons/` | `d04a6a85` |
| CS7-CLEANUP | The Striker's frame loop and nine T3 paths deleted (subagent): 55 files, −2k lines; the bleed driver moved to `combat/damage/bleedTicks.ts` | `rw/cs7-cleanup` merge |
| CQ.1, CQ.2, CQ.4 | The Squire: Resolve (raw hits, trickle, refunds), the slam and its hold rule, the five T1 responses, the five T1 trophies, the T1 gear lines; `C-squire.md` | `8d9ca7b1`, `3fccd177`, `e6cb72ed` |
| CQ.5 (view model) | `composeResponsesView`, `withRule`, `withGroundTelegraphs`, `withHoldSlam`; Resolve on the player view | `bd30623b`, `2f5db102` |
| CS.4 | The Striker's T1 gear: weapon jobs, armor and charm lines (`striker.*` keys, three generic `defense.*` keys) | `216e27c3` |
| S2 | The last T1 moments: enemy-casts, telegraph-at-me, target-closing-fast | `c619c262` |
| ICONS-2A | 52 Striker/Squire/Apprentice T2–T4 pieces, 15 discipline crests (Codex) | `rw/icons-2a` merge |
| CS.1, CS.2 | The Striker's Order at runtime with its T1 techniques (Sweep, Hamstring, Rend, Coil, Focus) and trophies (Wide Arc, Double Slash, Festering Cut, Skyfall, Sunder); class casts on the cast machine; the root's Recovery pulse removed | `8dc3fa6a`, `a311329f` |
| CS.5 (view model) | `composeOrderView`, `withBeat`, `withRelic` | `eb43c183` |
| DOC-1 | 15 docs archived, ~30 living docs corrected (Grok); runic attunement archived after D3 | `rw/doc-1` merge, `6be2ae0f` |
| ICONS-2B | 30 Slinger/Spirit T2–T4 pieces, 36 T2–T4 trophies (Codex) | `rw/icons-2b` merge |
| D3 | The shared abilities' player surface removed (subagent): learning, attunement, the hotbar, Use Ability, the panels; the engine kept behind `fireTechnique` / `fireGuard`. 265 files, −5.3k lines | `rw/d3-abilities` merge |
| G-GEAR-A/B | Every class's weapons (33 each) and lines (52 each) through T4 (Grok ×2); weapon-curve, slot and economy suites taught about class gear | `rw/gear-a`, `rw/gear-b` merges, `6d81a93d`, `181364ee` |
| F7 (view model) | `composeClassScreenView`, `classUnlockNotices` | `e97f7bde` |
| S1 | Monster debuffs land on summons: one rider table (`monsterRiders.ts`) behind a player/summon adapter; summon statuses, DoTs, stuns, slows | `acbe38be` |
| S3 | Taunts lock, players come first (`applyTaunt`, `heldByTaunt`); strongest copy already existed (`applySharedDebuffMaxWins`) | `8f9a95fb` |
| F6 | The moments registry: fight snapshot, states, edge and pipeline events, `conditionsHold`; runeConfig reads the snapshot | `a421fd86` |
| D2 | Runic Points, crafted runes, stances, rites, the core slot removed (subagent): 406 files, −10k lines; old saves drop the keys; 4 bot files edited for typecheck | `f3513f9d` |
| D1 | Item lineage trees, ability node rows, shards removed (subagent): 165 files, −53k lines; bot shims dropped | `9164b024`, `b1a4962a` |
| F5 | Class gear: smart loot (`classes`), class lines on shared bases, relic items and the T4 gate gone | `98eec7e3` |
| F8 | Bot: `classConfig` step, `pieceLearned` / `trophyHeld` conditions; shared `classConfigContextFromState` | `cd81e3bb` |
| F4 + T0 | Passive Tree from the kits; tests swept (subagent); root-only fixes (empowered default, balance lab, tier entry) | `b5ce4436`, `2d43e779` |
| F2 | The class config: `configuresClass`, `class:setConfig`, migration 0010, auto mode | `4d1cc6ea` |
| F3 | Lessons and trophies: derived from biome levels and boss clears inside F1/F2, nothing to grant; the "new" toast moves to F7 | (in F1, F2) |
| K1 | Striker kit (subagent): 26 pieces, 11 trophies, tree | `3073540a` |
| K2 | Squire kit (subagent): 23 pieces, 11 trophies, tree | `3c014363` |
| K3 | Apprentice kit (subagent): 21 pieces, 11 trophies, tree | `a66e443f` |
