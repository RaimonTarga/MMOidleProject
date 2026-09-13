# Night 2 packet B — continuous T2 to T3 bridge

Preparation draft; **execute only after Astra supplies the frozen revision/tree and dispatches this packet** following packet A review. One case, one worker, one manifest. Case cap2700000ms (45minutes); packet setup/execution deadline75minutes from setup, bounded by the night deadline2026-09-14 05:04:42 UTC and its30minute finalization reserve. No replicate or retry is declared.

## Question and route

Can the same prepared Spirit character earn Plains, Forest and Desert T2 seals sequentially and reach a recovered T3 entry? Independent historical victories are not combined. Start from the original no-T2-seal V1h Spirit snapshot used by packet A, SHA256 `4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6`.

Route `spirit-continuous-t2-bridge-night2`, intended policy, smoke-isolated, reward25, count1, workers1, retries0, fastBossRetry=false. Common earned kit: Ruinous Axe, Cave Vest, Mountain Charm, Plains Boots+5; Tempered Core, no relic. Ordinary acquisition from the original+4 input. No extra armor/charm acquisition in this packet.

After learning Brace and ensuring Cleanse, visit T2 Sanctuary and recover to full HP/no incoming DoT before each encounter. Recovery cap180seconds. It is ordinary regeneration, not a debug heal. Final builds:

| Encounter | Techniques | Guards | RP |
|---|---|---|---:|
| Plains | Sweep, Expose Weakness | Second Wind | 29 |
| Forest | Expose Weakness | Second Wind, Brace | 28 |
| Desert | Expose Weakness | Second Wind, Cleanse | 26 |

Every build uses defensive stance and the common ordered Find Enemies/Step Back/Keep Distance/Avoid Hazards/Recover First rules. No named ability timing override or rite. Markers `night2:bridge:plains:ready`, `night2:bridge:forest:ready`, `night2:bridge:desert:ready`. One normal guardian-inclusive attempt per boss. Subsequent legs require all preceding clear facts. No switch to another boss on failure.

The third seal advances the player naturally. Travel to T3 Sanctuary and observe at least20seconds alive/auto while recovering, cap180seconds, then assert all three seals,T3,full HP and no incoming DoT. Leave the earned branch point **unspent**, preserving it in the final snapshot. No T3 mobs or bosses intentionally fought; travel remains movement-only. Third-seal tier/ability-rank changes are actual progression, not treatment overrides.

## Execution and stop contract

Use clean exact-revision preflight, current committed host tooling and capacity/release checks exactly as [packet A](bot-balance-night2-a-operator-packet.md). Verify image revision/tree/digest, copied tooling hashes, original input hash, fixed route/count/cap and isolation before launch. No global prune, destructive clean, volume deletion, historical resume or unrelated process stop.

```powershell
$spiritSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json'
# Set $night2Revision to the exact dispatched commit. Verify the input hash above.
pnpm experiment:create --revision=$night2Revision --routes="spirit-continuous-t2-bridge-night2" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=2700000
```

**Stop at the first death anywhere, including acquisition, guardians, travel or post-kill recovery.** The route's `stopOnFirstDeath` records death then aborts and suppresses respawn acknowledgement. Terminal reason `declared first-death stop` is an intentional gameplay limit, not infrastructure failure. Preserve the kill/clear if it preceded death, but do not call the bridge safely completed. Missing seals or recovery timeout also stop; no retries. Actual exception, invalid entry/build, unhealthy isolation or evidence loss returns immediately to Astra.

## Report and checkpoint

Write/index `docs/briefs/bot-balance-night2-b-report.md`. Record source/tree/input/manifest/artifact hashes, readiness/builds, acquisition and each guardian/boss/recovery window, all death evidence, exact seal and tier progression, release receipt/network absence. Keep false eligibility and synthetic/25x provenance. Distinguish this short accelerated combat/acquisition proof from normal-speed economy.

If completed, provide the actual `snapshot-b.json` path/hash plus observed tier,currentSkillTier,unspent point,root/frame/range,GM,seven biome levels,three T2 seals,equipment/upgrades,wallet,node,HP/DoT and canonical flag. Its legacy `tier2-handoff` kind names the existing serialization format; the persisted `state.playerTier` must actually be3. Never relabel a T2 state or modify the file. T3 import explicitly requires3 prior-tier seals,one unspent point,no range branch,previous-tier mastery caps and unchanged source provenance. No downstream run without Astra review.

Validation during preparation: full typecheck and bot preflight passed; strict T3 server bootstrap test retained one point and no branch, with live spawn validation. Snapshot regression rejects invented/missing points, missing seals, wrong tier and unsupported branch. Bridge regression proves a failed Plains prerequisite skips later fights/T3 travel, RP legality and live full-HP/no-DoT predicate. The actual earned T3 snapshot remains conditional on this run succeeding.
