# V1y - Voidwalker T4 entry and Mountain farming

Prepared 2026-09-14. **Not launched. User launches Luna.** Read CLAUDE.md.
One fresh character, one worker, one route. Normal skill/gear purchases and T4
travel/farming only. No boss attempt, balance edits, retries or follow-on session.

## Decision after V1x

V1x completed Mountain then Cave on one character, both safe returns and the
four-seal T4 unlock with one unspent point. Run time848060ms (14m08s), zero HP
loss. We have the actual T4 handoff; no further T3 boss replay is needed for entry.
Six T3 bosses have diagnostic wins; Swamp remains open for later human playtest.
Desert's low-health V1w win remains a robustness flag.

**Report correction from the retained file:** V1x began at GM114 but its final
checkpoint is GM120, Mountain22 and Desert14. The report's unchanged GM114 build
summary must not be used as the next input gate. The exact final file restores
successfully with these values. Do not normalize them downward or farm levels
already present. This is existing checkpoint progression, not new V1y earnings.

Unlock the user's recommended Voidwalker while retaining ranged Wisp, Cinderlash
T3+5, Accelerant and Frenzy for attack frequency. Buy base T4 Mountain armor and
charm before travel; actual Mountain22 already unlocks their recipes. Then enter
T4 by explicit waypoints, earn Mountain24/at leastGM122 and buy +1 defenses.
Finally observe five minutes of sustained Mountain farming and return rested.
This tests one T4 farming candidate, not T4-wide viability or balance.

## Frozen source and actual input

Revision `7bf4dd35bbdd8dfbf2062b775c239f295173f77d`.
Tree `70c6ea93523bab0d4a065dffe79b8e70136cb196`.
Route `voidwalker-mountain-entry-t4-v1y`, version1.0.0.

```powershell
$v1yRevision = '7bf4dd35bbdd8dfbf2062b775c239f295173f77d'
$v1yInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t174337z-spirit-t4-handoff-v1x/runs/001-spirit-t4-handoff-v1x-intended-r01/artifacts/spirit-t4-handoff-v1x-intended-2026-09-14T17-45-41-998Z-7289c541/checkpoint-v1x-t4-unlocked-returned.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1yInput
```

Input SHA256 `d910df5f3950ca5f28c39ded7ce770848bf60b1566edc894de1cab20f2f4409b`.
Boundary `v1x-t4-unlocked-returned`; state hash
`ef6cf62d0ad91910392d1569e7b4305cbc29162792b04f9fa50c52091d370d89`.
Input revision `4a6703f3f3a9e7dfb0d72c2a78789cffa884a1f6`.
Explicit-current-revision restore, unchanged definitions hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
Preserve all restored/synthetic/noncanonical ancestry and eligibility flags.
Reward1x does not make this canonical economy or combat certification.
Do not edit checkpoint data or substitute an earlier capture.

## Preparation and builds

Input: tier4, skillPoints1, GM120; Mountain22, Desert14. Heavy Spirit/Wisp,
Cinderlash T3+5, Mountain armor/charm T3+5, Desert Boots T2+5, Accelerant.
Wallet red2199/blue11019/green5369/yellow15583/purple16481.

1. Normal unlock of `energy-heavy-t3-a` (Voidwalker), cost one earned point.
   Verify `energy-range-far` remains selected, currentSkillTier4, skillPoints0.
2. Unequip Mountain T3 armor, evolve into `mountain-vest-t4` (Titan's Keep), equip.
   Unequip Mountain T3 charm, evolve into `mountain-charm-t4` (Fortress Heart), equip.
   Normal evolution consumes the predecessors; no reconstruction or grants.
3. Recover at T3 Sanctuary and capture base kit. No T4 upgrades yet: GM120 permits
   +0. Base purchases cost476 blue/94 red. Keep weapon/core/boots unchanged.
4. After Mountain24 and at leastGM122, upgrade both new items to exactly+1.
   Cost189 blue/41 red. All purchases total665 blue/135 red, zero catalysts;
   actual retained wallet covers everything without counting new drops.

Titan's Keep adds HP/plating, Guard potency and the max-hit barrier-refill rider;
Fortress Heart expands barrier. This preserves the tested defensive synergy while
building for Mountain's large direct hits. Both base pieces are legal upgrades
from the current kit; no unearned +5 T4 package is assumed. Stormwall/Shieldmend
alternatives are deferred until evidence warrants comparison.

| Phase | Stance | Techniques | Guards | RP |
|---|---|---|---|---:|
| Travel | Defensive | Sweep, Hamstring | Second Wind, Brace, Cleanse, Break Free | 38 |
| Mountain farming | Offensive | Frenzy, Hamstring | Second Wind, Brace, Cleanse, Break Free | 37 |

Use the existing V1v builds. Retain spacing/Step Back/Avoid Hazards/recovery;
travel additionally has Avoid Enemies/Fight Back. No operator-selected ability,
rune, stance, range or equipment substitution. Frenzy maintains attack frequency,
Hamstring supports ranged spacing; Mountain includes fast Roc/Tyrant threats as
well as slower heavy targets. Fast kills and limited mechanic exposure are
measurements to report, not reasons to tune values during the session.

## Exact paths and gates

Entry, in order:

`node-t3-sanctuary -> node-t3-swamp-06 -> node-t3-jungle-04 -> node-t3-jungle-03 -> node-t4-desert-04 -> node-t4-desert-01 -> node-t4-desert-02 -> node-t4-desert-05 -> node-t4-mountain-05 -> node-t4-sanctuary`.

This intentionally avoids the shorter Trench route and all Volcano, Tundra and
Graveyard nodes. All hops are adjacent in both directions, including the region
boundary. A failure in Desert transit does not measure Mountain farming viability.
Avoid Enemies reduces exposure but is not immunity from travel combat.

Farming uses the adjacent `node-t4-mountain-05` (Massrock Heights, heavy modifier).
Return is one hop to `node-t4-sanctuary`. The natural T4 pool is Granite Mammoth,
Avalanche Tyrant, Cliffside Roc and Cragback Rhino; report actual encounters,
modifiers and concurrency rather than assuming every type appeared.

Earn Mountain24 with the base kit, return/rest, then buy+1. If transit already
satisfies Mountain24, record that and the skipped mastery work honestly. No XP
or wallet floor. The post-upgrade window uses elapsedMs0 plus observeForMs300000,
so it still runs at the mastery cap and counts alive/auto-enabled target-node
time. It does not require being fully healed while actively fighting.

| Capture boundary | Expected state |
|---|---|
| v1y-voidwalker-base-kit | Voidwalker/ranged Wisp, zero points, T4 base armor/charm, rested at T3 Sanctuary |
| v1y-t4-sanctuary-arrived | Same preparation, actual T4 arrival and recovered rest |
| v1y-mountain24-returned | Mountain24, at leastGM122, ordinary recovered return before upgrades |
| v1y-plus1-ready | Both T4 defense items+1, recovered at T4 Sanctuary |
| v1y-mountain-qualified-returned | Completed five-minute observation, alive/rested at T4 Sanctuary |

File names are `checkpoint-<boundary>.json`. On death or any failure retain all
prior captures and stop; no automatic intermediate-state resume or extra replica.
No boss clear or T5 advance is expected. Return/rest/capture failure leaves the
handoff incomplete even if the farming window survived.

## Run limits and operator lifecycle

One case, one worker, intended policy, smoke-isolated1x, first-death stop,
no fast retry or automatic retry. Run ceiling90 minutes; session ceiling120
minutes including setup. Require100 minutes remaining to launch. These are caps,
not runtime predictions: the unknown is ordinary Mountain mastery acquisition.
Mastery step60 minutes, five-minute no-progress stall; observation cap7 minutes;
travel cap3 minutes per hop. The global deadline takes precedence.

```powershell
pnpm experiment:create --revision=$v1yRevision '--routes=voidwalker-mountain-entry-t4-v1y' --tierEntrySnapshot=$v1yInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=5400000
```

Keep route argument quoted. Before launch verify sealed source/tree/input hashes,
one fresh case, worker/reward/caps and zero retries; record image ID/hash.
Preserve dirty worktree changes; frozen source only. No competing experiment worker.

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# Only after supervisor and case are terminal:
pnpm experiment:release --id=<returned-id>
```

At deadline use experiment:stop, report/release after terminal. Infrastructure,
restore, purchase or gameplay failure ends the packet. No operator code fixes,
manual boss play, adaptive alternatives, new agents or follow-on experiment.

Before launch and after terminal release record timestamp, `docker ps`,
`docker stats --no-stream`, C: free space, and Windows Docker/vmmemWSL working
sets separately. V1x worker max198.5MiB while WSL rose1726.1->3354.5MiB; scoped
containers stopped correctly. This is not proof of a leak. Use the resource
commands from V1x's packet; no Docker restart, RAM changes or global prune.
Verify this experiment's workers/services exited and network released; preserve
artifacts, volumes and normal services. Already-released is expected. Actual
resource/capacity errors stop the run; no arbitrary6GB approval gate.

## Required report and next decision

Write/index `docs/briefs/bot-balance-v1y-report.md`. Verify exact initial state,
one-point normal Voidwalker unlock, retained range, normal evolution/upgrade
receipts, actual mastery gains and wallet changes, and each capture's SHA256,
state hash and location. Keep inherited preparation separate from new earnings.

Report entry travel separately from base-kit mastery, upgrades, five-minute
observation, return and recovery. Record kills per actual T4 monster, alive
observation time, death/stall cause, HP/barrier minima, direct/DoT pressure,
Cleanse/Hamstring/Frenzy and discharge/early-execute evidence where telemetry
supports it. Use available first-damage-to-kill TTK observations; mark missing
engagement starts. Report cast/ward exposure only when specifically evidenced.
Do not infer boss mechanics from generic telegraphs or sum overlapping totals.
If zero kills or sparse encounters occur, the observation is survival-only and
insufficient to claim sustained farming. Do not silently add time or cases.

Success establishes one Voidwalker Mountain farming/return candidate and a T4
checkpoint. Next Astra can extend mastery to other T4 biomes and gear gates,
then screen bosses. If travel or farming fails, classify controller/build versus
encounter pressure before recommending a change, and ask for human advice when
counterplay is unclear. Swamp T3 stays open. Broad mobs -> items -> classes balance
and canonical1x economy remain downstream; no balance edits are authorized here.

## Qualification completed

`server/scripts/v1yPreflight.ts`: exact final V1x file hash and persistent restore,
unchanged definitions, actual GM120/Mountain22, normal Voidwalker unlock, retained
range, ordinary evolution and upgrade handlers using the real wallet, both builds,
bidirectional adjacent paths and regional tiers. Only future Mountain24 is modeled
for +1 gate arithmetic; no combat ticks, granted currency or exported model save.
Preflight view snapshots are diagnostics, not fully recovered playable checkpoints.

Artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1y-preflight-qualified-20260914.json`.
Bot/diagnostics TypeScript, actual-input preflight, observation/transit regression
and map validation passed. Full suite and live V1y have not run. No balance changes.

Handoff: "Operate docs/briefs/bot-balance-v1y-operator-packet.md exactly: unlock
Voidwalker, buy the qualified T4 defenses, enter T4, earn Mountain24/+1, observe
five minutes and return safely; report, release and stop."
