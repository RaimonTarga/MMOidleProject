# Night 1 assessment and recovery plan

2026-09-13. Astra reviewed the operator report, terminal supervisor/run states,
the failing bot log and the sealed experiment/input hashes. A's manifest hash is
`4ad3808d71e0952f4c7aa270947ee9aa7877a5bf36858c2a5a73070780af0587`;
B's is `0b79b10ce2a61d432c634160bf1e4ffed09b4e4a5017f1aa84d4397d04c0617b`.
Both supervisors are terminal. Original artifacts remain unchanged.

## Accepted evidence

- The missing Mountain armor upgrade was earned in 438.399 seconds. Reuse A's
  final snapshot, SHA-256 `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755`.
  Do not repeat its resource acquisition or use a post-boss character.
- Expose Weakness + Cleanse lost its one valid Swamp attempt to poison; the boss
  had about 18.9% HP remaining after 41.032 seconds of boss combat.
- Second Wind + Cleanse cleared Swamp in its one valid attempt, no death,
  58.055 seconds of boss combat. The user's manual finding now has a bot success.
- One observation per arm does not establish a winner or reliability. Activations
  and healing totals cover the reported run, not necessarily only boss engagement.
- Case 3 is invalid entry evidence; case 4 was interrupted; cases 5/6 never
  started. None is an additional gameplay loss. C and D were never created.

Ledger clarification: five of 25 planned slots started, so **20 never started**:
two cancelled before start within B and 18 never created in C/D. Seven terminal
records include B's two never-started cancellations; terminal and unstarted are
overlapping categories. The report's total of 18 describes never-created slots,
not all unstarted slots. Preserve the historical report and use these definitions.

## Entry observation defect

The exact failure was `live-full-hp: spawned at 163.9594/164 HP` and
`live-no-buffs: spawned carrying 1 buff(s)`. Source inspection shows bootstrap
clears combat state synchronously, but the bot then waits for a later broadcast
and validates that view. Clearing is an active world node. A logic tick can
damage/buff the correctly reset character before the 5 Hz view arrives.
The original artifact does not identify the buff or prove its exact source;
it does demonstrate that the old observation cannot distinguish reset failure
from subsequent ordinary gameplay.

The repair returns a deeply copied ordinary PlayerView in the bootstrap result,
captured immediately after reset. The bot requires matching profile, tier and
player identity, then applies every existing strict spawn check to that view.
Missing/mismatched evidence fails closed. Live observations continue normally:
no HP tolerance, healing, immunity, combat pause, retry or buff removal is added.

Regression checks cover the real socket response without periodic publication,
the earned T1 fixture, post-reset HP/buff mutation not corrupting the copied view,
and strict rejection of genuinely contaminated reset evidence. The next packet
adds three isolated runtime entry repetitions before any boss attempt.

This fixes an instrumentation boundary; it does not prove the new runtime runs
will pass. The original failed run remains invalid and is never reclassified.

## Content status and source boundary

T1 now has prepared Striker successes on Plains and Swamp. Forest, Mountain and
Cave still lack current campaign results; broader class coverage remains open.
T2's local readiness evidence survives, but Night 1 added no T2 progression or
boss evidence. Neither tier has comprehensive balance acceptance.

The user reports the formerly nonfunctional bosses are now repaired. The other
agent committed the changes during preparation as `3426063e55954c162c92aaa499903c356fa3b96d`,
including Mountain/Jungle/Volcano mechanic wiring and T1/T2 changes. They are not
part of Night 1's frozen source. Do not
continue treating those mechanics as known broken, or claim their live balance
is validated by old runs. **Low TTK / insufficient ordinary-mob eHP in T3 and T4
remains an open balance issue**, deferred for a later balance pass. No values are
changed here.

[V1f](bot-balance-v1f-operator-packet.md) now freezes that integrated commit,
which also contains the entry-observation repair. Three runtime entry checks
precede the six Swamp comparisons and four T1 boss probes. The two Swamp arms
share the same current source; Night 1 remains historical context, not pooled
replication or a single-variable before/after experiment. This supersedes the
initial draft's old-source plan now that the fixes have a stable commit. T2
progression/boss coverage follows interpretation; T3/T4 low TTK remains flagged.

Docker's Linux engine was initially unavailable; the user started it during
preparation. The first capacity check admitted two bridges and exhausted the
default pools on the third. Both temporary probes were removed. Astra verified
Night 1 A was completed, its exact network empty and its two storage containers
already stopped, then removed only `mmoexp-8b4337476994-network`. Containers,
PostgreSQL/Redis volumes and original artifacts were retained. The experiment
root contains `v1f-network-preparation.json`, with retained container/mount/network
metadata. Recreate its isolated network and original aliases before any future
historical-service restoration; that is outside V1f.

A second check created three simultaneous temporary bridge networks successfully
and removed all three. Capacity is verified at preparation time; the operator
must recheck against drift. No experiment was created or launched.

## Final validation

On the exact integrated frozen revision `3426063e55954c162c92aaa499903c356fa3b96d`,
a clean detached checkout at
`C:\Users\osaif\AppData\Local\mmo-idle\validation\v1f-integrated` passed
`pnpm bot:preflight`, full `pnpm typecheck` including bench types, and
`pnpm test` (**194/194 files**). This includes the other agent's new boss and
equipped-evolution regression suites. Pure plan construction checked the 3/6/4
phase counts, alternating Swamp order and 156-minute total worker ceilings.
These are code/harness checks; V1f's isolated runtime entries and encounters
remain unexecuted by Astra.
