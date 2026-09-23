# Class balance candidate 01 - prepared, unrun

The fixed 56-observation comparison is prepared for Luna. **No fresh combat has been launched.** Planned/new allocation: 56; completed combat: 0; failed combat: 0; not-run combat: 56; reused combat: 0. Qualification is construction evidence, not balance evidence. See `LUNA_RUN.md`, the preserved `BRIEF.md`, and the separate existing-evidence `ENCOUNTER_REVIEW.md`.

## Frozen sources

- Overnight baseline: `c14d62afa2267b57207e1ef8b65c3fd90144c0a6`.
- Control: `dd2c06f2bca8380323bdcfe2f65add2d7d51989d` at `D:/mmo-idle/class-balance-candidate-01/control`.
- S+C candidate: `5ffbfb414b62d3addc8cb485d5b149b14e7de7ca` at `D:/mmo-idle/class-balance-candidate-01/candidate`.
- Publication branch: `codex/class-balance-candidate-01`; frozen control is also published at `codex/class-balance-candidate-01-control`.
- C-only commit: `47000d22` (root frame interval multiplier 1 -> 2500/3500).
- S-only commit: `e47c48f9` (Light Attack .07 -> .02, speed .12 -> .04; Balanced Attack .08 -> .03, speed .06 -> .00).

The control and candidate differ in exactly those five fields in two files; `candidate.diff` records the entire difference. Shared preparation/recording changes are identical: an explicit reference-backed ledger, dispatch routing in the existing farm/boss runners, zero-tick readbacks, and the existing progression dispatcher adapted to select the proper checkout for each arm. No gameplay change beyond S+C is added to the overnight baseline. The invoking develop checkout's unrelated local edits were not imported.

The control contains the common support commits independently of the treatment commits; both full histories are pushed. Neither execution checkout follows the publication HEAD. Qualification and measurement use their exact absolute paths because farm receipts include `sharedEntry` provenance.

## Matrix and packages

| Block | Lives | Cap |
|---|---:|---:|
| S1 mature T2 Light/Balanced Spirit Forest/Mountain bosses | 8 | 5 min |
| S2 ranged T2 Desert arrival Spirit | 8 | 10 min |
| S3 T3 Swamp Spirit +3 | 8 | 10 min |
| S4 T3 Mountain boss Spirit +4 | 8 | 5 min |
| C1 T1 Conduit Plains/Cave, developed and complete | 16 | 20 min |
| C2 T1 Conduit Plains/Mountain bosses, developed | 4 | 5 min |
| N1 mature Heavy Spirit Forest boss | 2 | 5 min |
| N2 ranged Balanced Conduit established Desert | 2 | 10 min |

Each pair is adjacent. Seed101009 runs control first; seed101033 runs candidate first. One-seed blocks use 101009. The preserved mature manifest supplied S1/N1; the frozen overnight spec supplied the other packages. No historical result is reused as a matched control. Build inputs are preserved; production recomposes output stats independently. Native full HP/barrier and summon/encounter initialization remain intact. T1 Conduit retains the primary axe. No later unlock, extra Guard, rapier alternative, Wait It Out or policy change is introduced. Costs remain synthetic prior purchases.

Both arms use Node v22.16.0 and the copied overnight hitbox artifact (SHA256 `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`). Source and sprite/runtime file hashes are in the frozen identity receipts. The older mature Spirit source was `3a1488a7c78bb47f4a90e20ec06db1652594fe16`; its packages are reused in this common runtime, not its old outcomes. Earlier Desert/multi-biome reports remain contextual and are not matching evidence.

## Checks and limits

`verification.json` records exact source-diff validation, all 28 receipt pairs and 56 deliberate package/encounter-drift rejection assertions. Only expected provenance/name fields and the treatment's recalculated Attack/cooldown or root interval-factor fields may differ. Same-arm execution still deep-compares the entire receipt to its qualified reference. Boss source identity is checked through the child manifest and source contract; farm receipts additionally retain runtime revision/path fields.

Zero-tick boundary helpers produce ten Spirit readbacks per arm: root T1, all frames at T2/T3/T4 (selected T4 examples include each frame's t3-a descendant). Energy state and all mechanic effects are unchanged. The common production additive stat formula is unchanged, so the frame treatment is applied once. Root/Heavy complete readbacks are equal. Fifty-two Conduit profile readbacks per arm cover frames, ranges and existing specialization factors; all framed readbacks are identical. Only the root reconstruction factors/interval can differ. Per-replacement cost, safety floor, first-death logic, queue, summon HP and authored offense code remain unchanged.

The existing pure `summonerProfile.test.ts` passed on both arms. One repository typecheck ran: package checks passed, benchmark checking caught the reference JSON import setting. A common import-only correction was made; the focused benchmark typecheck then passed. The first unrun preparation at `packet` / `qualification` remains external and superseded; its sources now fail verification because they are superseded. Use only `packet-r2` / `qualification-r2`. No live packet was repaired and no combat allocation was spent. No full test suite, combat pilot, live browser playtest, T4 combat, release or deployment was performed.

The future evidence is bounded synthetic combat. Root Conduit is a no-frame profile, not a hard T1 gate. Spirit frame changes inherit to later selected paths; later gameplay interactions remain unmeasured. No candidate is adopted. Final separate S/C recommendations must await the allocated measurement and designer approval.
