# Q2 assessment — observation delayed by unnecessary travel

2026-09-12, Astra. Q2 is incomplete, not a balance failure. One Striker timed out,
one Squire was cancelled after starting, four classes never started. Preserve all
six dispositions. Q1's configuration success remains valid.

Raw Striker events confirm preparation in `node-t2-plains-04`; the observation
step began at 10,665 ms but selected `node-t2-plains-01`, reached at 288,705 ms.
That is 278,040 ms before arrival, including one death and a return journey.
Two Sweep activations occurred after arrival. These establish partial activation
evidence, not a completed window or a class/boss verdict. The absence of earlier
Sweep activations is not a demonstrated ability defect.

Diagnosis: Astra's Q2 node selection introduced unnecessary travel into a local
build test. `pick: first` means catalogue order, not nearest/current. Also, the
farm timeout is applied after `transitTo`, so the advertised 120-second farm limit
did not bound this journey; the overall 300-second watchdog did. The exact cause
of slow transit is still unresolved and is a separate question.

Repair: new Q2b routes select `pick: current` within the declared Plains/T2 normal
node set. They fail if current state is sanctuary, another biome/tier or unavailable;
there is no fallback travel or teleport. Once selected, the node is fixed for that
farm call, including any ordinary death/return behavior. Existing Q2 routes remain
unchanged for reproduction. Observation accumulates eligible sampled time across
interruptions; the report's word "consecutive" is not the implementation contract.

Next experiment is one Striker case, not another six-class family. Keep the
two 60-second windows and the 300-second run ceiling. This is a new explicit
repair experiment, not an automatic retry or replacement of Q2 evidence.
If it fails, Astra diagnoses it before any expansion. If it passes, Astra decides
which remaining class cases are needed before boss-local work.

Source boundary: main HEAD now includes `b1123804`, the separately committed monster
attack-animation pass, with server/shared changes. Q2b will use current committed
source plus the route fix. It is a current-source readiness check, not a controlled
causal comparison against Q2 combat performance. No gameplay modifications were
made for this repair.

Preparation validation: `pnpm bot:preflight` passed on the exact committed repair
`755b2a3642a3a417f364f5fb8486e661bfc351b0` in a clean detached checkout at
`C:\Users\osaif\AppData\Local\mmo-idle\validation\q2-06c0818a` (the directory
name is historical; its checked-out revision is Q2b). This includes bot/server
typechecks, socket build preflight, route/entry/loadout tests and experiment tests.
The regression checks that the actual farm executor receives Plains-04 rather
than catalogue-first Plains-01, and that time at another Plains node does not
count toward the selected window. Invalid current locations have no fallback.
The static route validator checks current selectors against a real biome because
it has no live player location. Infrastructure validation is not gameplay evidence;
the full repository test suite was not run. Pure run-plan validation confirms one
case, one worker and the 300,000 ms ceiling. No experiment was created or launched.

See [operator report](bot-balance-q2-report.md) and [Q2b packet](bot-balance-q2b-operator-packet.md).
