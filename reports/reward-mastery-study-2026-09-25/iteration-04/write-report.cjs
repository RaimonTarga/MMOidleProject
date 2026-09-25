const fs=require('fs'),path=require('path');const p=__dirname;const rows=JSON.parse(fs.readFileSync(path.join(p,'combined.json')));for(const b of ['cross','correction']){let c=JSON.parse(fs.readFileSync(path.join(p,b,'complete.json')));if(c.failures.length||c.sourceDrift.length||c.harnessDrift)throw Error('Receipt issue '+b);}
const names={'cadence-root':'Striker balanced','summoner-root':'Conduit balanced','cooldown-root':'Squire heavy/Destroyer'};
const table=rows.filter(r=>r.batch==='correction').map(r=>'| '+names[r.build]+' | '+r.node.replace('node-t4-','')+' | '+r.seed+' | '+(r.policy?(r.build==='cooldown-root'?'Offensive stance':'No Recover First'):'Original package')+' | '+(r.mastery?.toFixed(2)??'—')+' | '+(r.death?'Death':r.plateau?'XP plateau':r.runtimeCensored?'Runtime limit':'Mastery')+' |').join('\n');
fs.writeFileSync(path.join(p,'RESULTS.md'),`# T4 iteration 04 — build, biome and policy diagnosis

The user's target is now **roughly 50 minutes for fast builds and around 90 for slower viable builds**, per single biome's T4 segment. The 600k flat-reward candidate does not satisfy it. This iteration tests a biome reward correction and separates optional player policy changes from that correction. No merge/deployment; T1 is untouched.

## Why the original range was so wide

18 crossed runs held each historical build package constant across Volcanic 01, Tundra 01 and Desert 03, seeds 101009/101033. Thirty-minute windows, native farming, first-death or three-minute no-XP stop. All 18 produced results: 13 completed windows, four deaths (Conduit and Squire in Volcanic), and one approach plateau (Striker Volcanic 101033). No process failures. A historically surviving package is not automatically safe in a different biome.

| Package | Volcanic XP/min | Tundra XP/min | Desert XP/min |
|---|---:|---:|---:|
| Striker balanced | 11,243 in one full window; other plateaued | 6,504–6,757 | 4,930–5,039 |
| Conduit balanced | Both died; no sustainable-rate claim | 4,278–4,446 | 2,360–2,541 |
| Squire heavy/Destroyer | Both died; no sustainable-rate claim | 2,830–2,899 | 2,078–2,250 |

**Biome effect:** the same Striker earns over twice as much XP/min in Volcanic as Desert. Pack composition, HP/defenses and encounter behavior differ. Volcanic 01's spawn-body expectation is about 66% Ember Skinks (720 base HP, 336 XP at this node); Tundra has much tougher bodies and Desert's low-HP Scarab is a shielded kiter. Spawn mix is not actual kill mix; raw files record both realized kills and progression. This establishes a package-specific location effect, not a universal biome ranking or an isolated estimate of HP versus spawning versus navigation.

**Build/policy effect:** even within a biome, observed fast/slow XP rates differ by 2.39–2.43×. The desired 90/50 range allows only 1.8×. At fixed measured rates, no shared XP scalar can satisfy both ends: Tundra needs at most 1.78× rewards to keep the fast end at 50 but at least 2.36× for the slow end at 90; Desert's bounds are 2.38× and 3.21×. These are local window projections, not guarantees that rates stay constant. See [feasibility calculations](feasibility.json).

Conduit spends about half its Tundra window under the Recover First intent; its Desert recovery share is much lower. Squire spends only about 1% recovering: it uses Defensive stance (-15% damage) and Destroyer (normal attacks deal zero direct damage; four-second executions), so its issue cannot be solved by simply deleting recovery waits. This does not justify blanket buffs to all Squires or Conduits.

## Tested correction

Keep the 600,000 segment requirement and apply **T4 mastery XP only: Tundra ×1.7, Desert ×2.3**. Essence, catalyst payouts, combat stats, gear, T1–T3 and other biome XP payouts stay unchanged. These factors calibrate the tested fast Striker around 50–55 minutes without extending the slow biome's grind. They currently affect all nodes and bosses in those two T4 biomes; only one normal node each was dynamically validated. Ten normal nodes are within that authored scope. Broader-node/boss calibration is a remaining adoption requirement.

12 original-package runs reached mastery: Striker 51.47–53.38 minutes; Conduit 80.92–82.29 in Tundra and 111.59–116.06 in Desert; Squire 119.17–124.41. **Reward correction alone still misses the 90-minute slow-end goal.**

Eight separate policy arms test one change each: Squire swaps Defensive for Offensive stance; Conduit removes Recover First. They retain class, specialization, gear, other runes and all reward settings. A useful optional farming setup is not a fix to the original defensive package. Recovery intent observations are tick-end state, not exact pre-action causal attribution. No hidden damage/HP buffs or revivals.

| Package | Node | Seed | Policy | Mastery minutes | Endpoint |
|---|---|---:|---|---:|---|
${table}

## Volcanic stall

Reproduced Striker seed 101033: XP stops at minute 23.06 and the diagnostic ends at 26.06. All 18 ten-second samples show full 714 HP, no terminal Heat, and 36 live monsters at the endpoint. The player remains in roughly a 171×62-pixel area while intent alternates between approach and hazard avoidance, selecting Skink/Salamander targets. This supports an approach/avoidance oscillation, not a combat toughness or XP requirement problem. It does not establish the exact code branch; no navigation patch is applied. Existing hazard-approach timeout logic is target-specific, so a next diagnostic should capture selected-target/path/avoidance state before action selection and distinguish target switching from failure to route around geometry. See [compact evidence](stall-diagnosis.json), original snapshots and iteration 03's retained censors.

## Decision and follow-through

Retain the biome correction as an **experimental partial fix**, not a release-ready solution. Use the policy outcomes above to separate achievable farming setups from remaining specialization/encounter deficiencies. Do not increase XP again to compensate for one fast location, do not declare slow defensive setups solved by swapping them out, and do not project mastery from death-shortened runs.

The roughly 50–90-minute range still requires broader class/specialization and node coverage, including correction of stalls and survivability constraints. Prioritize the remaining slow package/node pairs with measured combat delivery and summon/recovery telemetry rather than adding class-specific XP bonuses. The separate Conduit and Volcano studies use different source/packages and are not pooled here.

Essence remains unbalanced: correcting XP shortens the farm but doesn't establish one-biome funding of four +3 pieces or +5 at 1.5× time. Original wallets and exact per-color costs remain in raw results; pure-color farming still lacks required off-colors. Supply and color costs need a separate coupled pass after the XP/throughput candidate is stable. No upgrade purchase or earned-arrival claim is made.

## Evidence and validation

38 fresh simulations, both batch receipts complete with no gameplay/harness drift or process failures. [Crossed summary](cross/summary.json), [correction summary](correction/summary.json), [combined observations](combined.json), [cross receipt](cross/complete.json), [correction receipt](correction/complete.json), [protocol](README.md). All raw jobs, logs, per-ten-second diagnostics and minute XP snapshots are retained. Three-minute plateau, first death, mastery or declared observation/runtime ceiling ends each run; no silent retries or substituted failures.

These are isolated prepared mature +4 loadouts with historical other-biome mastery, target segment reset, production loadout/RP validation and 1× rewards. They are conditional throughput, not earned progression, browser evidence or live telemetry. Prior navigation/combat source is held fixed; concurrently edited main-checkout Volcano/defense/Conduit changes were not incorporated.

Focused gameConfig/rewardMultiplier checks and full typecheck passed. A direct production reward-seam check passed for T4 Tundra/Desert factors, unchanged T3 Desert/T4 Volcanic, and unchanged essence/catalysts. Its first attempt had a nonexistent test monster ID; corrected to authored Dune Stalker before passing, with no production workaround. No full regression rerun; earlier price-contract failures remain unresolved. No saved-XP migration. Future-tier extrapolation still inherits the 600k last authored segment and is not calibrated.
`);
