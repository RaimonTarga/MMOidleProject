# T1 Bot Testing — Session Handover (2026-08-26)

Continuation of `docs/headless-bot-harness-plan.md` / `bot-route-reference.md`. This
session authored the six T1 baseline routes, ran them (and variants) live against
the dev server, and along the way found and fixed a chain of real bugs — some in
the bot harness, some in shared game code. Nothing here is committed yet; see
"Uncommitted work" below.

## TL;DR

- All 6 class baselines + 4 experiment variants + 6 "v2" (survivability-focused)
  routes are authored, registered, and pass full harness validation.
- Dev server is up (`mmo-server-dev`, docker), healthy. No bot batch currently
  running (port 4500 free).
- Last full overnight run (16 bots, `bot/runs/overnight-2026-08-26b/batch-2026-08-25T22-58-47-247Z/`)
  completed WITHOUT crashing — validates this session's stability fixes — but
  only 3/16 bots fully cleared all five T1 bosses. Three concrete follow-ups are
  open (see "Open findings," below) and nothing has been done about them yet.
- The `--out` path is relative to the `bot/` package's own cwd when invoked via
  `pnpm --filter`, not the repo root. As of 2026-08-26 a redundant `bot/` prefix
  is normalised away, so `--out=bot/runs/<label>` and `--out=runs/<label>` both
  land in `bot/runs/<label>` — the old `bot/bot/runs/...` trap is fixed. See
  "How to run" below for the known-good invocation.

## What shipped this session

### Routes (`bot/src/routes/`)
- `t1Common.ts` — shared helpers (biome order, ability-learning schedule,
  `bossFight()`, milestone/completion builders) used by all routes except the
  Striker baseline (which stayed self-contained per the original design brief,
  but now imports just `reactiveGuardRune` from t1Common — see bug #1 below).
- Six baselines: `striker-t1`, `squire-t1`, `slinger-t1`, `spirit-t1`,
  `apprentice-t1`, `conduit-t1`. Spine is Clearing → Plains → Forest → Swamp →
  Mountain → Cave → all five bosses (Swamp/Mountain swapped from the original
  plan per designer call, see t1Common.ts's header for the full reasoning).
- Four Tier-1 experiment variants: `squire-heavyhammer-t1`,
  `apprentice-letdotsfinish-t1`, `slinger-murkeyeonly-t1`, `spirit-murkeyeonly-t1`.
- Six "v2" routes (`*-v2-t1`), the overnight round — see "Balance & design
  changes" below for what each one folds in.
- `bot/src/social/autoParty.ts` — bots sharing a node auto-party (deterministic,
  lowest-connection-id-wins rule, self-healing every tick), routing kills through
  the game's existing same-node party reward-sharing instead of competing.

### Harness fixes (`bot/src/route/`, `bot/src/botRun.ts`, `bot/src/batch.ts`)
1. **Nearest-node pathing** (`route/conditions.ts`): `resolveNode`'s `"uncleared"`
   pick used to just take the alphabetically-first node id, which has ZERO
   relation to actual map position (node ids are assigned by the map's
   procedural-growth algorithm). This caused bots routing Clearing→Plains to
   detour through Swamp and die in transit. Now does a real BFS over
   `worldNodeExits` (the same graph the server paths through) and picks the
   nearest uncleared node.
2. **`--staggerMs` flag on `bot:batch`** — delays each subsequent bot's START by
   N more ms than the last, so a batch doesn't guarantee a synchronized pile-up
   on every boss. Used at 600000 (10 min) for the overnight runs.
3. **`ackDeath` crash guard** (`botRun.ts`): a bare `setTimeout` callback calling
   `intents.ackDeath()` with no try/catch meant a dropped socket (disconnect,
   server restart) threw an UNCAUGHT EXCEPTION — which, since `bot:batch` runs
   every bot in ONE process, killed the entire batch, not just the one bot that
   died. Now caught and logged as a warning. **Confirmed working**: the overnight
   batch hit this exact scenario ~8 times and survived every one.

### Server fix (`server/src/net/playerHandlers.ts`)
- `liveSelf()` returns `null` when dead or before the entity resolves. Every
  acknowledged mutating handler (`inventory:upgradeItem`, `crafting:craftRecipe`,
  `crafting:evolveItem`, `rune:craftRecipe`, `ability:craftRecipe`) used to
  **silently drop the request** in that case — never emitting the client's
  awaited result event. That's a real product bug, not bot-specific: a human
  player upgrading gear the instant they die would hit the same silent 15s hang
  in the browser client. Fixed to emit a proper
  `{ success: false, reason: "Not available while dead or disconnected." }`.
  **This surfaced a NEW follow-up bug** — see Open findings #1.

### Two "stuck boss loop" bugs (`bot/src/route/executor.ts`)
Both are the same root cause in two places: `bossCleared()` can flip true while
a bot's own attempt loop isn't positioned to notice (a mutual kill against a
boss+guard-pack pile-on, or — now that `autoParty.ts` exists — a party member
landing the kill instead). Without a re-check, the bot pays for an entire wasted
extra attempt (guard-clear + travel + altar) against an already-dead boss, which
itself can cause more deaths.
1. `doAttemptBoss`'s outer loop: added a `bossCleared()` re-check immediately
   after `awaitAlive()` and again after `clearDungeonGuard()` returns.
2. `clearDungeonGuard`'s own inner wait loop never checked `bossCleared()` at
   all, and its "no progress" stall timer resets on ANY change in guard count
   — including the guard reforming — so it could wait almost indefinitely on an
   already-irrelevant guard pack. Fixed: the wait predicate now also exits on
   `bossCleared()`.

### A game-design/data bug, not a harness bug
- **`target-casting → fire-guard` was suppressing Second Wind's and Cleanse's
  own built-in triggers for the ENTIRE session before this fix.** Root cause in
  `server/src/systems/player/abilities/abilityFiring.ts`'s `shouldFire()`: having
  a `fire-guard` rune rule equipped AT ALL (regardless of which condition it's
  paired with, or whether that condition is currently true) suppresses the
  ability's built-in trigger entirely. `target-casting → fire-guard` was
  designed for Brace specifically, but every route kept it in the loadout
  unconditionally — so Second Wind (built-in `hp-below 60%`) and Cleanse
  (built-in `has-debuff`) never fired on their own sensible default; they only
  fired in the rare window an enemy happened to be mid-cast. **This means every
  death/survivability number from before this fix (basically all of today's
  data prior to the last overnight batch) is invalid for judging Second
  Wind/Cleanse performance.**
  - Fix: `t1Common.ts` now exports `reactiveGuardRune(guard)` — returns the
    `fire-guard` rule only when `guard === "brace"`, else `[]`. `bossFight()`
    now takes a `baseRunes` param and composes
    `[...baseRunes, ...reactiveGuardRune(opts.guard)]` into a `configureRunes`
    step it adds automatically per boss. All 16 routes were updated (including
    Striker's self-contained inline `bossFight()`) to strip the hardcoded
    `fire-guard` from their rune constants and rely on this instead.
  - **This is fixed only from the last overnight batch onward.** Any
    conclusions about Second Wind or Cleanse from earlier runs today are not
    trustworthy.

## Balance & design changes (live on the dev server)

- **Forest boss (`gnarled-greatbear`) cadence nerf**: `attackCooldown`
  1400ms → 1900ms in `shared/src/data/monsters/bossesT1.ts`. Damage untouched
  (designer's own prior note in that file called the median damage "on band";
  cadence was the explicit lever chosen this session). NOTE the same file's
  comment flags "the evasion exam" — this boss's fast cadence is specifically
  meant to reward evasion gear, which 5 of 6 T1 baselines don't carry into that
  fight (only Slinger does, via Shaded Bindings). Worth remembering before
  tuning this boss further.
- **Conduit summon-rebuild buff** (`shared/src/data/summoner.ts`,
  `SUMMONER_CORE_TUNING`): `reconstructionHpCostRatio` 0.5 → 0.3 (a fallen
  summon slot used to cost 50% of the new minion's max HP from the OWNER's own
  HP to rebuild), `reconstructionIntervalMs` 5000 → 3500. Exploratory — Conduit
  hadn't reached a boss fight yet when this was applied, so it's unvalidated.
- **`wait-for-regen` and `flee` are now starter runes**
  (`shared/src/runeDatabase.ts`'s `STARTER_RUNE_IDS`) — no recipe needed,
  available from character creation. Direct response to "T1 is too deadly, the
  only difference a human makes is waiting to recover or running away."
  Previously gated behind `rune-recipe-recover-first` / `rune-recipe-flee`
  (Cave L2/L3) — those recipes still exist and are now harmless no-ops if
  crafted.

## The six "v2" routes — what each folds in

All six add `when-idle → wait-for-regen` and (except where traded for orbit,
see below) `hp-below-25 → flee` from the start, and swap Second Wind in for
Brace on the Mountain and Cave boss fights specifically (the two hardest-hitting
T1 bosses — Crag Behemoth atk56, Obsidian Broodmother atk47) to A/B a
healing-focused Guard against a mitigation-focused one where it hits hardest.

- **`striker-v2-t1`** — otherwise identical to `striker-t1`.
- **`squire-v2-t1`** — Heartroot Amulet (`forest-charm-t1`, highest raw Recovery
  of any T1 charm, synergizes with Squire's `defense.recovery-active-pct`
  affinity and with Second Wind itself) replaces Murk Eye. Power Strike
  (Mountain L5, "heavy strike") replaces Sweep/Expose Weakness entirely as the
  standing Technique. **This is the route with the 235-death anomaly — see
  Open findings #2.**
- **`slinger-v2-t1`** — Poison Dagger committed to the instant it's crafted (no
  more "keep the rapier active, dagger levels up in reserve" — likely fix for
  the "switches back to Flash Rapier sometimes" behavior reported mid-session).
  No Sweep at all — Expose Weakness only, once learned. Shaded Bindings worn
  into every boss fight (no Fallen Knight Plate swap). Murk Eye only (no
  Granite Barrier). Orbit restored (see below).
- **`spirit-v2-t1`** — Granite Barrier as the STANDING charm from Mountain
  onward (no Murk Eye, no revert) — "Spirit goes mountain charm for more
  shield." Orbit restored.
- **`apprentice-v2-t1`** — Heavy Hammer kept as the FINAL weapon (never
  switches to Chaotic Axe, unlike `squire-heavyhammer-t1`'s transitional
  treatment). No Sweep — Expose Weakness only. Orbit ADDED as a genuinely new,
  flagged-as-untested hypothesis (Apprentice has never had orbit before; its
  60px attack range is much shorter than Slinger's 120 / Spirit's 130, so
  kiting risks pulling it out of its own range — this needs the run data to
  actually judge, not an assumption).
- **`conduit-v2-t1`** — Granite Barrier as the standing charm (exploratory, "I
  dunno what is good for it" — paired with the summon-rebuild buff above on the
  theory that the owner's own survivability matters more now).

**Orbit RP trade-off**: `slinger-v2-t1`, `spirit-v2-t1`, and `apprentice-v2-t1`
all carry `orbit` (unlocked via `rune-recipe-keep-distance` at Mountain L3, same
as the non-v2 orbit routes) instead of `flee` — the GM-0 Runic Point floor (8 RP)
only fits one of {orbit, flee} alongside `wait-for-regen` + the conditional
`fire-guard`. `wait-for-regen` won every trade-off this session; `flee` lost
every time it competed with something else. Worth deciding at some point whether
`flee` is actually earning its RP anywhere, or whether it should just not be in
the budget-constrained routes.

## Open findings — nothing done about these yet

Concrete, evidenced in `bot/runs/overnight-2026-08-26b/batch-2026-08-25T22-58-47-247Z/batch-summary.json`
and the per-bot `events.jsonl`/`deaths.jsonl`.

1. ~~**Upgrade-rejection isn't retried**~~ — **FIXED 2026-08-26**, see
   "Harness fixes (2026-08-26)" below. `apprentice-letdotsfinish-t1` and
   `apprentice-v2-t1` both stalled almost immediately with `"upgrade rejected:
   Not available while dead or disconnected."`, because `doUpgrade` treated ANY
   `!result.success` as fatal. All four acknowledged mutating steps now wait for
   the respawn and retry that specific rejection.

2. **`squire-v2-t1`: 235 deaths, ~6.1 hours, timed out waiting for
   `ability-recipe-power-strike` to unlock.** 232 of 235 deaths were to ordinary
   Mountain trash (Ridge Ambusher 112, Cliff Hopper 120 — not the boss).
   `squire-t1` (same Mountain content, baseline build) only had 36 deaths across
   its *entire* run. Something about the v2 Mountain-leg build/rune/gear timing
   is much weaker specifically at Mountain. Not investigated beyond confirming
   the death breakdown — needs a closer look at what's actually different
   (Heartroot Amulet has zero plating/DR, unlike Murk Eye's stats — that's the
   most obvious suspect but unconfirmed).

3. **Possible Granite Barrier regression, not confirmed.** `spirit-v2-t1` and
   `conduit-v2-t1` (both Granite-Barrier-as-standing-charm) stalled at ZERO
   bosses cleared, while `spirit-t1`, `spirit-murkeyeonly-t1`, and `conduit-t1`
   (Murk Eye) all completed cleanly. Confounded by the other v2 changes
   (Second Wind swap, dropped `flee`) — not a clean A/B on its own.

## Harness fixes (2026-08-26 session)

All in `bot/`, all covered by `bot/src/harness.test.ts` (the two new blocks were
mutation-checked: each fails against the pre-fix code).

1. **Transient dead/disconnected rejections are retried, not fatal**
   (`route/executor.ts`). New `RouteExecutor.mutate()` wraps every acknowledged
   mutating intent — craft, upgrade, ability craft, rune craft. It calls
   `awaitAlive()` BEFORE sending (so a step reached mid-corpse waits rather than
   racing), and on the exact reason `"Not available while dead or
   disconnected."` waits and re-sends, up to 20 attempts. Any other rejection is
   still fatal, immediately, as before. Every attempt — including the rejected
   ones — is still recorded, so the craft/upgrade telemetry keeps the full
   trace. Closes Open finding #1.
2. **Dungeon-altar activation is re-emitted until the dungeon wakes**
   (`route/executor.ts`, `doAttemptBoss`). `intents.activateDungeonAltar()` was
   a bare fire-and-forget emit, and the server drops those from a corpse — the
   same class of bug the `emitUntil` helper's own comment was written for. When
   it was lost the bot then sat in an idle dungeon until the 12-minute boss wait
   burned the whole attempt. It now goes through `emitUntil`, done when the
   dungeon status leaves `idle` (or the boss is already cleared by a party
   member), with a 3-minute ceiling that lets the attempt loop retry properly.
3. **`--out=bot/runs/<label>` no longer double-nests** (`config.ts`,
   `batch.ts`). `normalizeOutDir()` strips a redundant leading `bot/` when the
   cwd is already the `bot/` package — so both spellings mean the same
   directory, and the trap called out at the top of this brief is gone. Absolute
   paths and repo-root invocations are untouched.
4. **No more `MaxListenersExceededWarning` spam in a batch** (`batch.ts`). Each
   bot installs its own SIGINT/SIGTERM handler in the shared process; past 10
   bots Node printed leak warnings over the run log. The cap is now raised to
   fit the cohort.

Still open from the previous list: finding #2 (`squire-v2-t1`'s Mountain death
spiral) and finding #3 (Granite Barrier) — both are balance/route questions, not
harness bugs, and neither has been investigated.

## How to run

Dev server is already up via `pnpm docker:dev` (check `docker ps` for
`mmo-server-dev` etc. — don't start a second stack). `AUTH_DEV_BYPASS=1` is set
in `.env`.

**Before launching, always:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/health   # expect 200
curl -s -o /dev/null -w "%{http_code}\n" --max-time 3 http://localhost:4500  # expect connection failure (port free)
```
If port 4500 is held by a stale process: on Windows, `Stop-Process -Force` is
required — a plain `TaskStop` on the backgrounding tool does NOT reliably kill
the underlying node child process; check `Get-NetTCPConnection -LocalPort 4500`
and kill the `OwningProcess` directly.

**Known-good invocation** (adjust route list / stagger / out dir as needed):
```bash
cd "c:\Users\osaif\Documents\Claude\Projects\MMO idle"
pnpm bot:batch -- --routes=striker-t1,squire-t1,slinger-t1,spirit-t1,apprentice-t1,conduit-t1,squire-heavyhammer-t1,apprentice-letdotsfinish-t1,slinger-murkeyeonly-t1,spirit-murkeyeonly-t1,striker-v2-t1,squire-v2-t1,slinger-v2-t1,spirit-v2-t1,apprentice-v2-t1,conduit-v2-t1 \
  --policies=intended --count=1 --ui=4500 --rewardMultiplier=25 --staggerMs=600000 \
  --out=runs/<new-label>
```
Note the path resolves relative to the `bot/` package's cwd, not the repo root,
because `pnpm --filter` changes directory before running — a leading `bot/` is
now stripped rather than double-nested, so either spelling works.

`--rewardMultiplier=25` makes the run non-canonical (tagged, correctly) — fine
for behavior/survivability testing, NOT valid for economy/pacing conclusions.

Validate any route changes before launching:
```bash
pnpm --filter bot exec tsc --noEmit
pnpm --filter @mmo-idle/server exec tsx --conditions=development "<absolute path>/bot/src/harness.test.ts"
```

## Uncommitted work

Nothing from this session has been committed. `git status` shows (session's own
changes only — several other files were already modified before this session
started, unrelated to this work):
- Modified: `bot/src/{batch.ts, botRun.ts, config.ts, harness.test.ts, net/intents.ts,
  route/conditions.ts, route/executor.ts, routes/{apprenticeT1,conduitT1,index,
  slingerT1,spiritT1,squireT1,strikerT1,t1Common}.ts}`,
  `server/src/net/playerHandlers.ts`, `shared/src/data/summoner.ts`,
  `shared/src/runeDatabase.ts`, `shared/src/data/monsters/bossesT1.ts` (Forest
  boss line only — other changes in that file predate this session).
- New: `bot/src/routes/{apprenticeLetDotsFinishT1,apprenticeV2T1,conduitV2T1,
  slingerMurkEyeOnlyT1,slingerV2T1,spiritMurkEyeOnlyT1,spiritV2T1,
  squireHeavyHammerT1,squireV2T1}.ts`, `bot/src/social/autoParty.ts`.

Ask the user before committing — hasn't been requested yet.

## Suggested next steps (not started)

In roughly the order they'd unblock the most:
1. ~~Fix the upgrade-rejection retry bug (Open finding #1)~~ — DONE 2026-08-26.
2. Investigate the `squire-v2-t1` Mountain death spiral (Open finding #2) —
   likely gear/plating related given Heartroot Amulet's stat profile, but
   confirm before changing anything.
3. Decide whether `flee` deserves its RP anywhere, given `wait-for-regen` won
   every trade-off this session.
4. Once #1–2 are resolved, re-run the 16-route batch clean and treat THAT as the
   first trustworthy dataset for Second-Wind-vs-Brace and Granite-Barrier
   conclusions (everything before the last overnight batch predates the
   fire-guard fix; the last overnight batch itself is contaminated by finding
   #1's early stalls on two routes).
