# Economy current state

Economy v2 candidate, 2026-09-24, branch `codex/economy-v2`. Baseline source: `ff98ba4513cb9fcb1e5752acfd56495268aff416`. Implemented locally; dynamic adoption remains pending. Fresh characters only: there is no XP or wallet conversion.

## Tier curves

`shared/src/config/economy.ts` is the central source. Recipe files author base denominations; public recipe databases apply prices exactly once at registration. Client previews, server purchase validation and bot budgets read those public databases. Never apply the multiplier again in a consumer.

| Tier | Essence reward | XP reward | Segment XP | Catalyst progress | Essence cost | Catalyst cost |
|---|---:|---:|---:|---:|---:|---:|
| T1 | 2 | 2 | 1,750 | 0.5 | 1 | 1 |
| T2 | 8 | 8 | 32,000 | 1 | 6 | 2 |
| T3 | 16 | 12 | 168,000 | 1.5 | 20 | 4 |
| T4 | 48 | 30 | 1,080,000 | 2 | 80 | 8 |

Reward factors multiply authored monster rewards and node premiums. Cost factors multiply authored base denominations, including reconstruction, equipment, cores, relics, abilities, runes, stances and Rites. T0/T1 normal rewards and prices are unchanged. Explicitly zero-reward adds now retain zero essence and XP; omitted XP retains the ordinary default. No combat stats, bonuses or spawn behavior changed.

T2+ five-step upgrade essence is distributed 6/14/20/27/33 percent. Cumulative rounding preserves each colour's scaled full-track price. Catalyst step placement, local mastery and global mastery gates remain unchanged. Cores and relics have no +N track. Other track lengths retain their authored shape. Generic fallback upgrade costs use the tier essence multiplier.

T5+ currently hold T4 reward/cost denominations; the existing XP-budget fallback remains. This is not authored future-tier pacing.

## Pacing intent and limits

Suggested zone-mastery targets are 5/15/30/60 minutes for T1/T2/T3/T4. For future design discussion, 100/160/240/360 minutes for T5-T8 gives an idle-game ramp without repeatedly tripling each tier. Those future targets are not implemented. The current XP changes approximately preserve T2's old expected kill count, double T3's and quadruple T4's. Actual time depends on earned builds and must be measured later.

The designer approved a primary item affordable through +3 during mastery, and +5 around 25-50 percent additional farming after mastery. This is a resource-affordability target, not an override of upgrade eligibility: +5 still requires the tier's full global mastery. A first zone cannot independently unlock that tier's +5. The model's gross essence comparison excludes other purchases, catalyst waits, travel, deaths and cross-colour sourcing. Cheap biome items may finish earlier; full loadouts cost more.

The final T4 essence cost factor is 80, reduced from the first 90 candidate to keep representative primary-item totals closer to the approved premium. Remaining deviations are visible in the report, not hidden by per-item overrides.

## Route repair

T2 acquisition compares an actually owned predecessor's missing, already mastery-eligible upgrades plus evolution against reconstruction in each essence colour and catalyst family. It selects top-up/evolution only when no currency costs more and at least one costs less (or reconstruction is unavailable). Equipped predecessors are valid. Missing or mastery-gated predecessors retain reconstruction. Plans describe the declared entry profile; they are not a general adaptive shopping optimizer.

## Evidence and later experiment

See [static validation](../reports/economy-v2/ECONOMY_V2_STATIC_VALIDATION.md), [candidate projection](../reports/economy-v2/ECONOMY_V2_CANDIDATE.md), and [delivery / campaign rebase notes](../reports/economy-v2/README.md). The 140 normal-node model expands followers and follower variants, and checks raw HP, DR work and fixed H100 work. All 108 aggregate opportunity checks pass. This does not establish actual rewards/hour, mastery duration or idle survivability. Desert pays yellow and Trench green; prior audit prose stating otherwise is superseded by source-derived colour tables.

Boss reward differences, modifier premiums and full same-node party rewards remain. Large nominal prices are intentional. Historical wallets and frozen campaign snapshots do not describe fresh-character candidate pacing. No economy campaign or production deployment was performed.
