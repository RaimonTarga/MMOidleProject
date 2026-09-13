# V1i assessment and V1j direction

2026-09-13. Astra review of the [operator report](bot-balance-v1i-report.md).

## Accepted results

The three durable manifest hashes match the report. Their cohort summaries contain all eight terminal slots: two progression completions, two Plains completions plus two valid deaths, and two Forest completions. The report's Phase B package prose omits Sweep; the frozen route, packet and reported activations establish that Sweep was equipped alongside Expose Weakness and Second Wind.

| Question | Result | Decision |
|---|---|---|
| V1h wrong-resource blocks | Striker and Squire acquired the missing red/blue resources, upgraded and reached GM72 | Close those specific preparation defects; do not repeat the same validation campaign |
| Heavy Spirit / T2 Plains | Axe 2/2 wins, named-boss durations 57.056 and 58.561 s | Retain Axe as a supported candidate for this frame/package |
| Needle substitution | Two valid deaths, boss remaining 56.45% and 70.4% | Deprioritize this exact substitution; neither a global weapon ranking nor proof of the cause |
| Heavy Spirit / T2 Forest | Axe 2/2 wins, 27.024 and 25.020 s | Accept candidate feasibility and move coverage forward |

These are treatment-valid isolated observations with synthetic/prepared origins and 25x rewards. Preserve `combatEvidenceEligible=false` and `economyEvidenceEligible=false`; accepting their narrow diagnostic value does not promote them into canonical evidence. Two replicates do not establish a reliable success probability. HP samples and run-wide aggregates are not exact boss-phase mitigation measures.

T1 has current positive Cave/Mountain evidence and historical coverage of the other bosses, with the user's current playtest acceptance. T2 now has prepared Spirit wins against Plains and Forest and repaired Striker/Squire resource acquisition. It does not yet have seven-boss coverage or a demonstrated boss/progression path for every class. T3/T4 low mob eHP remains deferred.

## What transfers beyond the last encounter

“Faster weapon builds class resource faster” is an incomplete strategy. Heavy Spirit's empowered payoff depends on delivered hit damage as well as cadence; technique timing, target choice, mitigation and spacing also matter. V1i supports the Axe package but lacks energy/empowerment/dead-swing telemetry to identify the mechanism. Do not retrofit a causal story from the two losses.

Defensive tools have different jobs. A barrier can buffer a burst; sustained Recovery needs access windows and time; Cleanse addresses a status burden; movement can prevent application altogether. Next test those distinctions in new encounters, keeping the class fixed so that a class change does not obscure them. Broader class candidates follow once this encounter coverage provides meaningful points of comparison; we are not committing to Spirit as the universally preferred class.

## Source changes

V1i ran `61080e54`. Current gameplay includes `bab111f9`, which stabilizes monster slows, movement multipliers, stun checks and ownership of root locks across scripted casts/recovery. This is a mechanics correction, not a boss stat rebalance, but can change live encounter behavior. V1j must use a newly frozen revision and fresh preflight. Old timings are context, not same-revision controls. Hamstring conclusions would especially need new evidence.

## V1j: six bounded runs

- Mountain, two runs: Axe, Cave Vest, Mountain Charm, Plains Boots, Tempered Core; Expose/SW/Brace, defensive stance and full movement rules, 28/30 RP. Single-target delivery is useful against its 300-HP plate and punish window. Cave armor and barrier are selected for large impacts; Brace is fallback protection, not a guarantee against a lethal hit before its threshold. Keep Step Back and record whether the plate broke or a charge actually occurred.
- Swamp, four runs: same weapon/armor/boots/Core, Expose/SW/Cleanse and full movement rules, 26/30 RP. Compare Mountain Charm with Swamp Charm, two cases each in balanced order. No boss add chain justifies a recovery-on-kill prior here. The hypothesis is that periodic Recovery plus SW sustains attrition better; the competing hypothesis is that barrier/spacing already prevents enough damage to make extra healing redundant.

Both Swamp arms reconstruct and upgrade the Swamp charm through ordinary costs while wearing the same preparation kit. Only the final equipped charm differs. This compares whole charm effects, including Recovery stats, not just one passive coefficient. Observe actual boss-entry HP/barrier because the charm swap and guardian phase can mediate results.

Unused RP remains unspent to keep the first comparison interpretable. Bramble's three-aggro trigger does not suit these isolated bosses; Hamstring reduces movement rather than attack cadence; adding either without a clear mechanism would broaden the experiment without answering its question.

After V1j: expand to Cave/Desert/Jungle with encounter-specific candidates if entries and mechanics are valid. If a boss defeats both candidates, use the damage/status/target trace to select a small alternative. If both charm arms win comfortably, retain both as viable and move on rather than spending sessions proving a tiny ranking. Do not tune gameplay from preparation failures or absent telemetry.
