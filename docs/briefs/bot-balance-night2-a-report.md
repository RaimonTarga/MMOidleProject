# Night2-A operator report — Cave timing and Jungle Hamstring

Status: complete. Setup started at `2026-09-13T21:18:34.2771276Z`; the
three-hour packet deadline was `2026-09-14T00:18:34.2771276Z`, inside the
night deadline `2026-09-14T05:04:42Z`. Six planned cases ran exactly once in
two sequential one-worker manifests. No retries, rescue, source, template or
balance edits were made.

## Immutable input and preflight

- Frozen revision: `14bda8be14f067654f305e8a10a7179ccf4eab22`
- Frozen source tree: `81f7064241dc7797fe550ec569b7897e04133d57`
- Original Spirit Snapshot B: `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json`
- Input SHA-256: `4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6`
- Clean detached validation worktree passed `pnpm bot:preflight` (all packet
  harness suites). Offline dependency setup was required and recorded.
- Image: `mmo-idle-experiment:14bda8be14f0-d90e6996`, image ID
  `sha256:d21af0440d3939b0de6b4a266dc8ab2bb49444b661c284e733dae3e72911235c`.

## Manifest and terminal evidence

| Manifest | Cases | Manifest SHA-256 | Cohort SHA-256 | Release receipt SHA-256 | Terminal |
|---|---:|---|---|---|---|
| `20260913t211850z-spirit-cave-control-t2-night2` | 4 | `7af5437309b551cd3287ec58cd6ffef05a0267abd061f4382858252d5cd0091a` | `ece9b6ba77012ba9b24725ab7e25a3cc49a10f29dec76dd2854c53b5dedc4d25` | `e0251aee4b32a3465b78133fc6eb9f0ad32b305b5051ea02344bb126469b50ab` | all `bot_completed`; released |
| `20260913t214400z-spirit-jungle-hamstring-t2-nig` | 2 | `a5c07a3024d7807040ba10fe63751e48e305acfa6edf0cc9ca56b1589259ba28` | `3468e74c87538b006537daae585746cdea3ac26a63d5f6c5db782c52ef81c86b` | `29af2034622143e6cc25072efb4d1ceb75dfe6c88d2f413ee5d28a6fc1e9eb07` | all `bot_completed`; released |

Both manifests used `smoke-isolated`, reward multiplier `25`, one worker,
`1200000ms` case caps, intended policy, automatic retries `0`, and
`fastBossRetry=false`. The original input hash, revision and tree were
verified in each manifest. Empty bridge probes were inspected and removed by
their exact IDs (`dbf8e08ffe56c68380faa0ad6248620bac40cfbe975f05ffc0535a6d2ebbc5bd`
and `8aa6bc52bf1781d1be8967dc322ac4150c7c5eaab27ceacfb96a1115c43c074a`).

## Outcomes

**Astra audit correction (22:01 UTC):** the original Evidence column mixed whole-run counts, including guardians, with boss-only interpretation. The corrected table explicitly separates them. Every Cave boss window contains exactly6 slam results, all failures; the successes occurred outside the boss window. Cave control used Brace1 per boss, telegraph candidate3 per boss. Jungle used Hamstring5 per boss,15 across the entire run. All24 listed artifact hashes were independently rechecked and match; all six final snapshots are231/231HP with incomingDoT0 and the correct single T2 clear.

All six cases passed profile/spawn, acquisition, treatment, final build and
ready-marker assertions. Every boss attempt was a victory with matching named
kill and progression (`cave:2` or `jungle:2`). All six death artifacts are
empty and all six runs had zero deaths, so no death `killingBlow` correction
was needed in this packet; future losses must still use authoritative death
cause and timestamp rather than that stale field.

| Slot | Route / readiness | Boss combat | Attempt close | Tail | Evidence |
|---|---|---:|---:|---:|---|
| 001 | Cave control / `night2:spirit:cave-control:ready` | 174809–228863 (54054ms) | 229364 | 229365–250390 (21025ms) | Boss:6 slam failures, Brace1; whole run:6 telegraph failures/3 successes, Brace2 |
| 002 | Cave telegraph / `night2:spirit:cave-telegraph-brace:ready` | 170280–223321 (53041ms) | 223822 | 223823–244845 (21022ms) | Boss:6 slam failures, Brace3; whole run:7 telegraph failures/2 successes, Brace6 |
| 003 | Cave telegraph / same marker | 176253–229294 (53041ms) | 229795 | 229796–250815 (21020ms) | Boss:6 slam failures, Brace3; whole run:6 telegraph failures/3 successes, Brace6 |
| 004 | Cave control / same control marker | 187764–241807 (54043ms) | 242307 | 242308–263332 (21024ms) | Boss:6 slam failures, Brace1; whole run:6 telegraph failures/3 successes, Brace2 |
| 005 | Jungle Hamstring / `night2:spirit:jungle-hamstring:ready` | 277853–312381 (34528ms) | 312882 | 312882–333903 (21021ms) | Boss:Hamstring5, Brace1; whole run:Hamstring15, Brace1 |
| 006 | Jungle Hamstring / same marker | 282337–317367 (35030ms) | 317867 | 317868–338889 (21021ms) | Boss:Hamstring5, Brace0; whole run:Hamstring15, Brace0 |

The Cave telemetry records Brace activations and slam outcomes but does not
emit buff-consumption telemetry; these counts do not prove every-slam
coverage. Jungle has no shield-break or slow-contact telemetry, so those
states remain unobserved. Results are synthetic prepared-entry, 25x smoke
observations with false combat/economy eligibility and do not rank an arm or
support a numerical balance proposal.

### Astra timing interpretation and next decision

Candidate Brace precedes three of six boss slams per run by599–602ms. Those timed hits each report7 HP damage; untreated alternating hits report15/12, with the final unprotected hit144 or92.4. Controls' single Brace occurs after ordinary damage and activates5198ms before the final recorded slam (its3s protection expires about2198ms before impact); their early slams report12/15/12/12/12 and their last98.88225 or92.30325. Thus the ordinary named rule **does alter timing as predicted**, but it neither avoids the slam nor covers every cycle. Changing timing also changes subsequent barrier/recovery state, so these values are not equal-defense causal damage comparisons.

Both contemporaneous controls won despite V1k's two losses. No Cave gameplay balance changed between those sources; do not credit the new Rune for making Cave beatable or claim the underlying variability is resolved. No further Cave comparison is warranted tonight now that feasibility is observed. Jungle's two clean package wins cover the last untested Spirit T2 boss; shield control remains unobserved. Move to one continuous Plains→Forest→Desert bridge to test whether individually viable encounters combine into an earned T3 entry.

## Artifact paths and hashes

Each listed directory contains `summary.json`, `events.jsonl`,
`deaths.jsonl`, `snapshot-b.json`, and the recorded ready marker. Hash order is
summary, events, deaths, snapshot.

- `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t211850z-spirit-cave-control-t2-night2/runs/001-default-brace-r1/artifacts/spirit-cave-control-t2-night2-intended-2026-09-13T21-21-39-699Z-2ed5871d`: `1b530b839f7506c4f0169c4e963ef9c21271e79f3af750d476389ddfb88be15e`, `2c691ef4531a44f39ab68db79167207bc3df1ce94539de79797799659c4edf3f`, `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, `734ac765abfdf3ea3cc97885caccff01971203bbd5b71f57c2122c61b6312afb`.
- `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t211850z-spirit-cave-control-t2-night2/runs/002-telegraph-brace-r1/artifacts/spirit-cave-telegraph-brace-t2-night2-intended-2026-09-13T21-26-08-837Z-3cdccad4`: `60eadf8c86c4d30374da6bb252e52fd6cc467498ec8604e472eb74764641b691`, `8efae25999aa19cc90145bd0ca45457848177ebada999fa29a475aafff3c084c`, `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, `2759228066514121ea725a1a6859e6420007c1e404b530c3633884efeaa3a2cd`.
- `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t211850z-spirit-cave-control-t2-night2/runs/003-telegraph-brace-r2/artifacts/spirit-cave-telegraph-brace-t2-night2-intended-2026-09-13T21-30-31-638Z-173415ed`: `e0e09c9a29474501d79356134cb801a08e2076d55fce01ae1daebd4fceabefff`, `ba511c962cc6ffef9a78e597145994cb2dfb3e5dcb759806dcf2f8c4f7f670cb`, `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, `fa4ef44146fe17356b38b510bfbae3334617f11bde53dc497230c7ef3a49d81b`.
- `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t211850z-spirit-cave-control-t2-night2/runs/004-default-brace-r2/artifacts/spirit-cave-control-t2-night2-intended-2026-09-13T21-35-00-511Z-c7bab65a`: `f5a3fe2b9376404cdbc101a2c456f2c98ca909fd74883082f0e628493d1f13bf`, `b853937677342955dcc48418a7b0fdc971829faac4e557ecd8cab037e58280ee`, `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, `f338b31b67f2614c46d6f181b4f0a16dd4999ecf5b84520511d120ecbdbf2c74`.
- `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t214400z-spirit-jungle-hamstring-t2-nig/runs/001-spirit-jungle-hamstring-t2-night2-intended-r01/artifacts/spirit-jungle-hamstring-t2-night2-intended-2026-09-13T21-44-33-689Z-2d9bd35f`: `218edbe091ec16c629ac623d2d7a3190d1a92611fc634f259a0117a82ed06b8c`, `a78078676dcf36eb3f0c67b4d077b395ae4539bb71d6f2abaf14394fc765ab44`, `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, `8771f3efabffef44a0ed6f1fd44b60a84cf076ffc3b99a97d70afa46a943feb2`.
- `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t214400z-spirit-jungle-hamstring-t2-nig/runs/002-spirit-jungle-hamstring-t2-night2-intended-r02/artifacts/spirit-jungle-hamstring-t2-night2-intended-2026-09-13T21-50-25-917Z-a0f05471`: `dff0afd85806d3431f8114650cd946bca25bd4a197413a95e45d5bdabd5d9a3a`, `5641f4fa59cf09e18a72377ff02fe98f0d76a4d4ad1d545112994466b755b443`, `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, `7700cc39453a0f2381c01ae83767b50b036c614bc2af520d66d902ad2ff7d8bf`.

Both release receipts reported `released`, supervisors emitted terminal
`infrastructure-release` with two retained containers, and the released
network IDs were absent after release: Cave
`mmoexp-376b34ad2cde-network` /
`424ab4698803b562151ab23c3714092b4aea47ec85fe3b85c5a454f28537c33d`; Jungle
`mmoexp-39530314d0ba-network` /
`0ad2f487727f165d60436996902eca1dfd0a127962c7414bbebe594b6fbdc1b8`. No
downstream packet or retry was started.
