# T3 Tundra class/frame — recover execution, then complete the agreed experiment

**Next assignment:** the preparation agent (Sol High can continue, or Astra) corrects the known checkout/readback mismatch and prepares a replacement execution packet. Luna runs the replacement packet and publishes the results. This is not a new balance design exercise or a reporting-only assignment.

## Decision and evidence

The published `t3-tundra-class-frame-01/run-01` is closed as a partial operational record. It attempted one child, accepted zero observations, and left 51 cases not run. The child completed a 600,000 ms window, but its readback was rejected because `runtime.sharedEntry` pointed into the frozen D: checkout instead of the C: checkout used for qualification. Preserve that failed attempt and its raw evidence unchanged. Do not count its 42 kills as an accepted comparison or reuse its row in the replacement.

The report and supporting files are already on `develop` at publication commit `75fd4a4f6fe09a3d80bb538a889a95efaf82a0d7`. The measured source was `ce9ae8d14da009034996c055e3bfa5d96422e80d`. Publication is not the blocker.

**This handoff authorizes preparation of a replacement packet and, on delivery to Luna, execution of that packet.** It does not reopen or overwrite the failed run, authorize gameplay tuning, or require another command-center approval of the same matrix.

## 1. Fix the actual problem, not the entire harness

The existing dispatcher is `scripts/overnight-endurance.mjs`. Its `receipt(...)` comparison deep-compares the entire prepared and executed receipt, including the absolute `runtime.sharedEntry` path. Its ordinary `verify` mode checks the source/packet identity but does not establish that this later applied-receipt comparison will pass.

**Preferred minimal resolution: construct the replacement qualification receipts from the final execution checkout itself.** Prepare, qualify, and execute against that same source location, interpreter/dependency resolution, and hitboxes. Do not qualify in the main checkout and transplant its expected receipts into the isolated checkout.

Before dispatching combat, exercise the affected receipt comparison with zero-tick readbacks from the final launch location. Retain checks for applied equipment, skills, abilities, Rune rules, RP, resolved stats, formation profile, initial ecology, source bytes, definitions and runtime. The resolved shared module must belong to the intended checkout and its content must match.

Do not disable source/runtime validation or discard the entire runtime object to make the assertion pass. If code must support relocation explicitly, compare the repo-relative module path and verified code content while retaining each absolute path as provenance and checking that imports resolve inside the intended checkout. Limit changes to this concrete mismatch; no general schema or validation framework redesign.

Only run focused checks for the touched path. A full-suite cleanup, new combat engine, telemetry overhaul, or unrelated dependency upgrade is outside scope. If no comparator code change is needed, do not introduce one for tidiness.

The first scheduled case must go through the complete normal child-to-dispatcher receipt and recording path. It counts as observation 1 of the replacement run. Once accepted, continue the queue automatically; it is not an extra pilot or a reason for another approval exchange. A gameplay death is an acceptable completed outcome and does not stop the queue.

## 2. Use the designer's current completed gameplay baseline

The failed source, and the remote publication snapshot inspected for this handoff, still implement Hamstring with both movement and attack-cadence slow in `server/src/systems/combat/status/monsterControl.ts`.

The designer has since authorized and is implementing movement-only Hamstring and revised Heat. For the replacement, use a committed, reproducible source containing the **completed movement-only Hamstring change**, production Conduit R2, the session-continuity correction, and native owner-target inheritance. Verify implementation rather than inferring inclusion from a commit date or tooltip. Do not recreate or overwrite work being done by the designer's other agent; obtain its completed source handoff when necessary.

Carry the designer's completed Heat changes if part of that accepted baseline, but do not tune or test the Heat curve in this Tundra packet. Do not mix uncommitted work into the frozen execution tree. Record the actual included source and the differences from the failed attempt. Do not label old and new Hamstring results as same-mechanics controls.

Once selected, freeze that baseline for all replacement observations. Do not follow subsequent `develop` pushes mid-run. Do not add Endure, alter build choices, or compensate numerically for Hamstring's loss of attack slow.

## 3. Preserve the existing prepared scope: 52 cases

Use the existing `server/bench/balance/tundraClassFrameSpec.ts` specification and the published preparation catalogue. Do not re-theorycraft the 18 references from scratch.

- **36 primary cases:** six roots × Light/Balanced/Heavy × seeds `101009` and `101021`.
- **16 alternative cases:** the eight retained alternatives below × those same two seeds.
- Fixture: `node-t3-tundra-03`, ordinary combat, not the boss.
- Step: 100 ms. Cap: 600,000 ms. Same-life checkpoints at 300,000 and 600,000 ms.
- Stop each life at first player death. No cap extension, replacement seed, or post-death respawn.
- One worker; preserve the existing fixed case ordering.
- Mature legal T3 preparation, actual tier-limited skills/ranges/abilities, 38-RP budget, no T4 relics or future unlocks. No stat equalization.
- No generic Flee or Tundra armor. Preserve the declared kiting, control, Guard, recovery and hazard behavior.

| Alternative | Identity | Declared difference |
| --- | --- | --- |
| W1–W3 | Striker Light/Balanced/Heavy | Cinderlash to Cataclysm Axe |
| W4 | Squire Heavy | Avalanche Maul to Permafrost Maul; Power Strike unchanged |
| W5 | Slinger Balanced | Jungle Venomthorn Rapier to Swamp Plague Fang |
| A2 | Apprentice Balanced | Frenzy to Detonate with its declared Fully Afflicted timing |
| W6 | Conduit Balanced | Cataclysm Axe to Permafrost Maul |
| A3 | Spirit Balanced | Hamstring to Binding Strike |

**Squire Slam remains excluded.** The published preparer records a designer correction removing it. The original 54-case command-center brief is superseded on that point. Do not restore A1 or substitute another arm.

Use fresh packet/qualification/output locations, for example a separately named recovery preparation with `run-02`; emit the exact paths and commands in the operator handoff. Reuse build definitions, not old source identities or qualification receipts. All 52 accepted observations must be new. Preserve run-01 as a separate failed attempt.

## 4. No new strategy search

The established Tundra intent remains: durable preparation, finish elites before Chill becomes oppressive, mitigate dangerous impacts where appropriate, and use control plus kiting for ranged packages. Meaningful class/frame asymmetry is expected. Universal cap survival is not a success criterion.

An unexplained gameplay failure does not authorize another build, ability, Rune policy, or coefficient. Record the relevant trace and bring a focused question to the designer when existing intent does not resolve it. Do not ask the designer to repeat the strategy already supplied.

If a known operational mismatch recurs, preserve evidence and return it to the preparation agent for the narrowly authorized repair, not a new strategy proposal. Luna must not edit the frozen gameplay source or silently mutate a sealed run. A genuinely new material failure is reported explicitly rather than bypassed.

## 5. Required result: class/frame decisions

Luna's readable report must lead with whether execution completed, accepted counts, failures and not-run counts. On success, show all 18 primary identities first and then the eight matched alternatives, keeping seeds separate. Include survival/time-to-death, completed work, unfinished targets and material failure context; distinguish capped runs from reliable indefinite sustain.

The command-center review must be able to reach a provisional assessment for all six roots and their frames. Use current results alongside relevant already-published farming and boss evidence, retaining each source's identity and limitations. In particular, do not describe the old breadth farming screen as permanently absent: it was later completed. Retrieve the relevant completion/endurance summaries rather than relying only on an earlier preparation note.

Keep historical Heat-affected results and old Hamstring results clearly separate from same-baseline evidence. A prepared alternative is not an optimal weapon proof. A single Tundra result cannot establish root-wide strength or weakness. Shared items and Endure dependence must remain visible when discussing class effects.

Return at most five consequential findings and three recommended decisions or concrete designer questions. Supported targeted buff/nerf proposals are welcome, but do not invent a gameplay change just to fill a quota. No automatic follow-up campaign.

## 6. Publication and completion

The preparer supplies the exact frozen source, packet, qualification receipts and executable Luna commands. Luna executes that packet, writes `REPORT.md`, publishes compact results/build/source/terminal receipts, and retains raw JSONL externally. Do not copy full tick histories into a giant top-level JSON or Git.

Commit and push scoped preparation/repair files and the final compact result bundle through the normal agreed branch workflow, keeping unrelated work untouched. Report the branch, measured source SHA, publication SHA, report path and reconciliation counts. Verify the remote publication. A push failure is a publication problem, never permission to rerun combat.

No deployment work. No new class, item, boss, Heat, Chill or Endure tuning. This handoff prepares a recovery execution; it does not claim the repository has already been repaired or the 52 observations launched.

## Source references inspected

All repository paths below were read at publication snapshot `75fd4a4f6fe09a3d80bb538a889a95efaf82a0d7`, except the separately noted failed source:

- `reports/player-fast-pass/t3-tundra-class-frame-01/run-01/REPORT.md` (also supplied as the attached report).
- `reports/player-fast-pass/t3-tundra-class-frame-01-preparation/README.md`.
- `reports/player-fast-pass/t3-tundra-class-frame-01-preparation/LUNA_RUN.md`.
- `reports/player-fast-pass/t3-tundra-class-frame-01-preparation/PACKAGES.md`.
- `scripts/overnight-endurance.mjs`, particularly `verify`, `receipt` and the run loop.
- `server/src/systems/combat/status/monsterControl.ts`, also read at failed execution source `ce9ae8d14da009034996c055e3bfa5d96422e80d`.
