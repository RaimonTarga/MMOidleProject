# Player balance fast pass — opening packet

Prepared September 21, 2026 from the owner's `PLAYER_BALANCE_FAST_PASS_2026-09-21_v2.md`.
The owner requested preparation, then authorized committing and pushing the existing checkout.
**Prepared, not launched.** No player/enemy balance candidate is introduced by this packet.
The existing pack AI, telemetry, and ability/UI changes in the checkout are the measured context.

## Selected brief

Question: which practical mature-tier player packages show conspicuous failures or useful
contrasts on one ordinary encounter and one Mountain boss per tier?

Prepare exactly 36 observations: six roots × T2/T3/T4 × ordinary/boss. Seed `101003`,
100 ms production World ticks, 300,000 ms windows/caps, first death ends the observation.
Natural ordinary ecology/repopulation stays enabled. Boss preparation strips guardians and
wakes the named boss; guardian access and acquisition are excluded. No historical treatment
installer is selected. No automatic breadth expansion, candidate selection, or follow-up run.

| Tier | Ordinary node | Boss (dungeon resolved from current definitions) |
|---|---|---|
| T2 | node-t2-plains-03 | stoneplate-juggernaut |
| T3 | node-t3-volcanic-03 | crag-gorged-horn-behemoth |
| T4 | node-t4-graveyard-03 | iron-crest-titan |

The executor can complete all six blocks after the owner starts the packet. Deaths and caps
are observations, not reasons to gate later tiers. The campaign's proposed 300-observation
ceiling is not authorization to execute anything beyond this opening batch.

## Packages and bounded review

`server/bench/balance/playerFastPassSpec.ts` is the executable specification. Every root uses
balanced frame; T3 adds close range for Striker/Squire and mid range for the other roots.
T4 adds the implemented balanced `*-t3-a` specialization (the ID is historical; player tier is 4).
Unlocking uses production `unlockSkill`; gear and ability/Rune legality use existing checks.

Weapons use the survey references at T2/T3, except Conduit uses the Jungle rapier line to
support its formation. T4 carries the existing references: Eruption Lash, Warmaul, Plague Axe,
Deathfang Rapier, Deathfang Rapier, Eruption Lash, in the six-root order above.
Striker/Squire/Conduit use Mountain armor; Apprentice/Slinger/Spirit use Jungle evasion armor.
All use Mountain charm/boots, Tempered Core, and at T4 Colossus Heart. Equipment is held
identical across each package's ordinary and boss encounters. Upgrades are +5 clamped to
actual item maxima; mature reachable biome mastery is synthetic, with no farming loop.

Offensive stance is fixed. T2: Expose Weakness, Second Wind, Brace. T3 adds Frenzy and
Cleanse. T4 adds Sweep after Expose Weakness in offensive priority. The production ability
trigger/channel path decides firing; no scripted ability rotation is injected. Source review
confirmed Apprentice's Sweep spreads DoT, Slinger uses its clip adapter, and Conduit delivers
Techniques through its formation. Frenzy is an instant buff and does not claim the armed-hit
channel. Extra abilities are limited by the shared RP budget, not a desired damage target.

Behavior is explicit: auto-path, telegraph step-back, orbit for the four mid-range roots,
hazard avoidance, and wait-for-regen. Melee roots omit orbit to maintain contact; balanced
Conduit's summon formation has its own target acquisition and leash around the moving owner.
This is a practical fixed reference, not an optimizer or a claim that orbit is best for every
future specialization. Rites, alternate stances, and manual summon commands are outside scope.

| Tier | Budget | Striker/Squire spent (unused) | Other roots spent (unused) |
|---|---:|---:|---:|
| T2 | 30 | 25 (5) | 28 (2) |
| T3 | 38 | 34 (4) | 37 (1) |
| T4 | 47 | 40 (7) | 43 (4) |

Unused RP is deliberate headroom under this fixed reference. It is not evidence of an
optimized build; do not turn a weak package into a class verdict before inspecting delivery
and trying one credible alternative under a subsequent brief.

## Artifacts and exact commands

Run from the repository root in PowerShell. The prepared packet is local:

```powershell
$packet = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/packet-committed'
node scripts/player-fast-pass.mjs --mode=verify --packet=$packet
```

When instructed to execute, Luna uses:

```powershell
node scripts/player-fast-pass.mjs --mode=run --packet=$packet --out=C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/opening-run-01
```

The output directory must not exist. Do not overwrite it or automatically retry a partial run.
`identity.json` contains actual HEAD, committed tree, file-by-file source hashes (including
dirty/untracked source), Node version, and hitbox hash/path. `manifest.json` contains the six
resolved blocks. `resolved-builds.json` contains all 36 preparations, full views/runtime stats,
skills, gear/upgrades, abilities, stance, Rune rules, mastery, and allocated/unused RP.
`ready.json` seals those three files. A commit-binding record preserves the original
qualification revision while confirming identical measured source bytes at the committed tip.

Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`,
406 baked frame rows. Every initial player/monster body is checked for an available baked
frame. The artifact is pinned; it is an existing exported cache, not a newly rebaked atlas.
The boss runner's incorrect parsed-object call to the path-based loader was repaired.

For a later newly selected source block, the preparer can generate a fresh packet with:

```powershell
node scripts/player-fast-pass.mjs --mode=prepare --packet=C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/packet-next --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json
```

That command performs preparation plus the two declared smokes, not the main batch. It is
not a command for Luna to repair or silently reseal a drifted packet.

## Qualification and evidence limits

36/36 preparations passed. Ordinary preparation is zero-tick; boss qualification includes
one 100 ms wake tick and therefore is explicitly not described as zero-tick combat state.
All scaffolding skill points are removed before measurement. Full `pnpm typecheck`,
`balanceInstruments.test.ts`, and `bossTerminal.test.ts` passed. A separate strict check of
`ttkSurvey.ts` reports its existing implicit-any callback in the historical Night4 pilot
selector; the repository's bench config excludes that legacy script. The new spec and boss
adapter are covered by the passing standard typecheck.

Exactly two separate execution smokes were retained in `packet-r1/smoke`:

- T2 Conduit ordinary: 30 s, 8 completed kills, 11 damaged bodies, 78 summon attack beats,
  zero owner beats as expected for formation delivery.
- T2 Squire boss: first death at the runner's 44.0 s timestamp, 51.5% boss HP removed.
  This passes execution qualification and flags a package question; it does not justify a buff.

These smokes are not counted among the 36 full-window observations and are not repeated just
to obtain a better outcome. The draft zero-tick RP/item qualification failures are retained
in `prep-probe-t3*`; they are not combat observations. All evidence is synthetic, solo,
in-process production simulation. No live browser/server playtest or economy calibration occurred.

The inherited runners timestamp ticks at their starting elapsed offset; terminal elapsed
measurements have 100 ms granularity and may differ by one step from accumulated tick time.
Survival margin means the minimum sampled player HP/maxHP over combat ticks; barrier is
recorded separately, so this is not minimum combined effective health or terminal HP.
Missing damage attribution is unknown, never zero. Summon attack beats are a delivery
diagnostic, not a validated damage subtotal. T4's 300 s window does not prove long-run sustain.

## Monitoring, stops, and compact return

The launcher checks source identity before and after every child process. Shared identity
drift stops the batch immediately. A missing hitbox, illegal preparation, or execution exception
invalidates the affected block; preserve its process log and partial rows. Independent blocks
continue without retries. Each child has a 15-minute wall watchdog; existing per-observation
watchdogs also apply. Logs, process status, manifests, ready receipts, events, samples, and
summaries remain on disk. `report.json` tracks validated block counts and failures; partial
completed rows in a failed block remain in that block's `index.json` for explicit review.
Do not treat a missing summary as a death, cap, zero damage, or zero kills.

Luna reports one row per tier/package/setting: outcome, elapsed time, ordinary completed
kills/unfinished bodies and recovery/inactivity, or boss HP remaining/removed and min HP
fraction. Use full elapsed windows, not productive time, for throughput. Inspect roster,
episode membership, and ordinary samples for actual target exposure; episode membership
alone does not prove simultaneous contact. Never pool classes across tiers/encounters.
Boss-alive-at-cap is unfinished, not a 300-second kill. Authoritative boss kill evidence is
required; disappearance or reset cannot become a victory.

Finish with completed/planned counts, invalid/uninformative rows, meaningful flags, raw
artifact links, and remaining opening allocation. Approximately 30% throughput or 1.5× time
differences are triage prompts only. Keep observed facts separate from hypotheses and
recommendations. No automatic next experiment, class changes, enemy changes, or integration.

## Decision ledger

| Question | Evidence | Disposition |
|---|---|---|
| Opening player package screen | 0/36 main observations; 36 preparations and 2 execution smokes | Prepared; await execution direction |
| T2 Squire Mountain survival | Short execution smoke died at 44.0 s; 51.5% HP removed | Flag only; inspect full opening batch before selecting an alternative |

At most six actionable questions and three active investigations remain the proposed scope
guardrails. This ledger is the current decision record, not an automatically queued campaign.
