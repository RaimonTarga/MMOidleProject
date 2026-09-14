# Named progression checkpoints — command-center acceptance

Requested 2026-09-14. Implementation delegated to isolated branch
`codex/named-progression-checkpoints`, based on local campaign HEAD `8b9fe1e3`.
No gameplay balance changes or frozen experiment modifications authorized.
This document tracks implementation review and the bounded live acceptance.

## Required MVP

Extend existing snapshot/store, development bootstrap and sealed experiment
inputs. Explicit named safe/rested boundaries, multiple immutable captures,
explicit short continuations, current-definition validation, exact persistent
progression/build fidelity and visible runtime normalization. No full-world
replay or arbitrary combat rewind. Preserve source and restore revisions and
all accelerated/synthetic origins. Unknown/corrupt/wrong-boundary or incompatible
input fails before measured gameplay; no generic-template fallback or silent
loadout/progression repair.

Schema audit includes TracksProgression, HoldsInventory, UsesSkills, saved
position/HP and summonerState from playerRepo. Derived passives/stats and active
stance are not arbitrary injectable persistent power. Summon slot identity,
resources, reconstruction and readiness require explicit treatment, not omission.

## Acceptance sequence

1. Review authoritative capture and development-only restore, normalization,
   exact readback and compatibility gates. Run focused fidelity/rejection tests,
   selected late-tier specialization and all-class runtime checks, legacy
   snapshot/tier-entry regression checks and relevant typechecks/builds.
2. From the actual retained V1m campaign artifact, use a short preparation route
   to reach a declared safe pre-Volcano boundary and capture at least two names.
   This is newly captured live state descended from a synthetic/reward25 input;
   it is not a newly completed full-progression prefix or canonical economy.
3. Restore that same checkpoint in two sequential fresh isolated runs. Verify
   promised starting-state equivalence from authoritative receipts before any
   treatment, then apply one legal labeled treatment in one continuation.
   Keep the local approach/measurement short; a boss or Volcano clear is not
   necessary to prove checkpoint infrastructure.
4. Record hashes, revisions, route/policy/choices, normalization, source taints,
   capture/restore/approach/measurement timing, absence of skipped-prefix actions,
   independence, terminal artifacts and resource release. Stop at the bounded
   demonstration; no large cohort or unapproved balance experiment.

Live demo budget: one worker, sequential fresh worlds; aim for three short
runs (one capture, two restores), maximum five minutes each excluding image
setup. Read disk/network capacity first; preserve unrelated services. No full
world replay or claim of deterministic post-entry combat. If current state or
infrastructure prevents the real loop, mark that portion incomplete and provide
the exact next capture step rather than fabricate provenance.

## Campaign use after acceptance

Propose a separate short Volcano packet from the named pre-Volcano boundary,
with explicit ordinary approach and warm-up. Both baseline and build variation
restore the same base. Owned swaps are allowed; purchases spend real wallet
under current gates. Keep source normalization separate from travel attrition,
Heat, and measured farming. V1q's result and any further balance proposal remain
separate campaign work; the infrastructure task changes no monster values.

## Executed results

Implementation `0bb553015586cc5ee3269aeab91dde580e3b930c` was reviewed and
fast-forward integrated into the local campaign checkout. It extends the existing
artifact/import/runner seams rather than introducing a second snapshot system.

Focused checks passed: server persistent capture/restore and current-definition
rejection; T4 specialization and unspent points; ordered Rune/Rite preservation;
summoner slot preservation with runtime reset; independent Worlds; immutable
names; failed-restore atomicity; development guard; legacy tier-entry bootstrap
and Snapshot A/B tests; continuation executor; bot harness; experiment lifecycle
tests; full workspace typecheck. The command center independently reran the
named server, named executor and experiment lifecycle tests after integration.
The complete repository test suite was not run.

### First live attempt: safe placement rejected

`20260914t111506z-checkpoint-pre-volcano-capture`, implementation revision
`0bb55301`, one worker, reward 1x, 60-second run cap. The legacy V1m import
passed its profile/spawn validation, but its Sanctuary gate position failed
the named boundary's interior-position check after 3.938 seconds. No named
checkpoint was created. This is a preparation-route defect, not evidence of
state restoration or gameplay balance failure. The failed artifacts are retained
under `%LOCALAPPDATA%/mmo-idle/experiments/<id>`; report generated and automatic
network release verified (`experiment:release` returned `already-released`).

The correction `e4ee4cb9b5ad800320fd61b30975c5a06c2dafc4` adds an explicitly
authored ordinary movement step before capture. Safety checks remain intact.
Movement tests verify intent-driven arrival and wrong-node rejection; bot
typecheck passed. The failed manifest was not retried.

### Real capture and two independent continuations: PASS

All three corrected runs completed without deaths. One worker, sequential private
server processes and databases, reward 1x, 60-second run caps; no Volcano combat.
The image build compiled shared/server/bot successfully.

| Artifact | Identity |
|---|---|
| Capture manifest | `20260914t112129z-checkpoint-pre-volcano-capture` |
| Two-restore manifest | `20260914t112402z-checkpoint-pre-volcano-baselin` |
| Frozen source revision | `e4ee4cb9b5ad800320fd61b30975c5a06c2dafc4` |
| Image | `sha256:59da8c2fd8e0c7327dc9054456cd567f54b5cb098a0f02cd2e33e126261b1abb` |
| Capture manifest SHA256 | `c3eb770a143437e6e509d4786c7e61801182594c814acf77e74b3a6f058dfc9f` |
| Restore manifest SHA256 | `d277a99231c49f95869dd9b652c1628b81eb4cb768982eda927ec35fa5b8143f` |
| Reusable checkpoint SHA256 | `015a40785122af6b2a684827e344f0d2465d1b4462d6866801fbc4d9dad5cf55` |
| Captured persistent state hash | `d200fe6ebc012dd2dbef909350917c6370a43dd75e224865d8223cfb31bd4552` |

The first usable file is:

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t112129z-checkpoint-pre-volcano-capture/runs/001-checkpoint-pre-volcano-capture-intended-r01/artifacts/checkpoint-pre-volcano-capture-intended-2026-09-14T11-23-17-505Z-78b380cf/checkpoint-pre-volcano-rested.json
```

Its sibling `checkpoint-pre-volcano-rested-second.json` is separately indexed;
neither was overwritten. The character actually walked for 13.514 seconds to
`node-t3-sanctuary` `(2400, 2400)`, observed recovery for 3.003 seconds, and took
0.671/0.658 seconds for the two capture steps. Total bot duration: 18.169 seconds.
The boundary is the safe hub before the Volcano approach, not a cleared Volcano
pack or an assertion of safe placement in Volcano itself.

Both authoritative pre-treatment receipts have **exactly equal persistent
slices**, and match the captured persistent gameplay state after excluding only
the declared derived/runtime fields. Fresh socket identities and separate game
databases (`g_c0287af2c720e432`, `g_44a740cf9fc2bde5`) were confirmed. Both started
at the captured point with HP 236/236, barrier 132, Energy 0, auto/traverse off,
Wisp `energy-range-far`, GM78 and the same ordered Rune/build/skill state.

| Timing / treatment | Baseline | Desert Boots arm |
|---|---:|---:|
| Bot setup before restore | 48 ms | 65 ms |
| Authoritative restore request | 107 ms | 134 ms |
| Measurement-start marker, elapsed | 414 ms | 1,965 ms |
| Safe observation step | 4,003 ms | 4,005 ms |
| Total bot duration | 5,079 ms | 6,638 ms |
| Yellow essence spent | 0 | 58 |
| Final mobility item | Plains Boots T2 +5 | Desert Boots T2 +0 |

Observation was authored for three seconds; executor sampling/settling makes
the full farm step about four seconds. These bot timings exclude Docker image
creation and server startup, which remain in manifest/supervisor timestamps.
There was no hostile approach segment in this infrastructure demonstration.

The treatment asserted ordinary craftability, crafted and equipped through normal
intents, then asserted equipment. No upgrade or free grant occurred. The original
checkpoint hash and baseline wallet remained unchanged; catalyst wallets and
partial progress were inherited, with no newly gained catalyst modifier events.
Route events contain only the authored continuation, with no earlier unlock,
boss, upgrade or travel prefix. The baseline has no craft step; treatment has
exactly one new craft step.

Every descendant still reports `RESTORED_PROGRESSION_CHECKPOINT`,
`SYNTHETIC_TIER_ENTRY`, and `NON_CANONICAL_REWARD_MULTIPLIER`. This is an actual
live capture of a legacy-imported V1m descendant; the original campaign earned
progression is retained, along with its synthetic/25x origins. It is not a newly
uninterrupted full-route run, deterministic replay, or 1x economy measurement.
Skipped preparation retains inherited/unknown cost rather than becoming free.

Executable assertion script:
`C:/Users/osaif/AppData/Local/mmo-idle/validation/checkpoint-acceptance-20260914/verify.mjs`.
Invoke with the checkpoint file above and the absolute restore manifest directory.
Its passing `checkpoint-acceptance-verification.json` lives in the restore
manifest root, SHA256
`2b40223068b243bf513271b3b7f2185f9ff63071923218a92b37e7f69c4047b1`.
The report includes receipt paths/hashes, exact equality assertions, independent
database identities, treatment debit, run steps and release receipt.

Reports generated for all manifests. All three manifest networks auto-released;
terminal `experiment:release` checks returned `already-released`. One premature
release request was correctly refused while the capture supervisor was still
finishing; no force cleanup was used. Retained volumes and artifacts remain.
Only the six pre-existing development services were running at completion.
Disk remained above 8.7 GB free after the final image build. No full suite or
human/browser playtest is claimed, and cross-revision reuse has focused test
coverage rather than a separate live balance-revision run.

### Proposed next campaign experiment — not launched

Superseded after full V1q review by [V1r](bot-balance-v1r-operator-packet.md):
focused targeting and pursuit counterplay address the observed target churn and
Hound damage more directly than another armor-only comparison. The original
proposal below records the acceptance-stage idea, not the current operator task.

Use this checkpoint for two short natural Volcano continuations on the selected
current balance revision. First compare the existing Cave Vest T2 +5 build to
the **already-owned Plains Vest T2 +4** as one explicit practical armor treatment;
this compares available kits, not equal-upgrade item coefficients. Preserve
Ruinous Axe +5, Mountain Charm +5, Plains Boots +5, Tempered Core, Defensive stance,
Sweep, Second Wind, Brace and the captured ordered Runes in both arms.

Verify the common receipt before the armor swap. Author the same ordinary
approach with the captured travel avoidance/hazard rules; record travel death
separately from target combat. At target arrival emit `measurement-start`, farm
for up to 60 seconds, stop on first death, and attempt a bounded ordinary return
only if alive. Record pack composition/concurrency, time to first kill, incoming
damage, Heat, casts and post-pack cooling if a pack actually clears. Do not reset
Heat or heal at arrival. A five-minute total cap per arm includes approach and
return; one worker and no automatic retry. If definitions/revision differ, use
explicit current-revision policy and review the compatibility receipt.

This tests whether the smaller Scuttlers are survivable in natural encounters
and whether owned plating gear materially changes the failure. V1q's one-kill
then death result remains evidence that Volcano is unresolved; neither checkpoint
acceptance nor an armor difference proves balance. Further balance proposals
and a frozen operator packet need the usual campaign decision. No gameplay
changes or next balance runs were made here.
