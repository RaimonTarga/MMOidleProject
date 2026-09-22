# Day 2 bounded comparison — prepared, not executed

Start with [LUNA_RUN.md](LUNA_RUN.md). **24 new observations scheduled, 16 historical controls sealed for reuse, 0 new balance observations run.** All 40 package cells passed zero-tick production-child qualification. No Luna task or automation was started; no gameplay candidate was adopted or pushed.

| Block | Question | Cells | New | Reused |
|---|---|---:|---:|---:|
| A | Original Defensive mid Conduit and Offensive mid Slinger; Tundra-03; control vs session correction; seeds 101003/101009; five minutes | 8 | 8 | 0 |
| B | Four fixed packages; control vs declared stance/charm; two fixtures and seeds 101009/101021; thirty minutes | 32 | 16 | 16 |

Control/B source `61c12e67cc023c61cff6498fd2e799b3f6b55d50`. A candidate `f021845bd18f43c032e8044a60af071868000e80`. Reused controls retain measured source `e26fdccd3baaa96fe1d19263349d57d9c5abc626`, not publication SHA `74e79df2`. SOURCE_COMPATIBILITY.json records verification: overnight gameplay bytes are unchanged apart from opt-in observation imports/calls; shared and bot source are unchanged. No B session observer is installed. R2 is already production; no overlay is applied twice. Candidate changes are isolated in CANDIDATE.patch and explained in CANDIDATE.md.

## Applied packages

| Identity/display name | Control → candidate | Applied stat/RP check |
|---|---|---|
| T3 Apprentice Light / Venom vessel, mid | Volcanic +5 Offensive → same package Defensive | 335 max HP, Recovery 21, barrier 0; 36/38 RP in both |
| T4 Striker Heavy A / Berserker, close | Mountain +5 → Inferno Heart +5 | 674 max HP; barrier 283→0; Recovery 19→26; 40/47 RP |
| T4 Striker Heavy C / Juggernaut, close | Mountain +5 → Inferno Heart +5 | 674 max HP; barrier 283→0; Recovery 19→26; 40/47 RP |
| T4 Conduit Heavy B / Champion, close | Mountain +5 → Inferno Heart +5 | 568 max HP; barrier 239→0; Recovery 25→34; 40/47 RP |

Actual recipient/profile stats, full equipment and upgrades, ability order, stance, Rune order, mastery, evolution chains and legal RP are in qualification/resolved-builds.json. HP happens to remain equal through these substitutions; it was not normalized. T4 Inferno Heart is `volcanic-charm-t4`, evolved from T3, actually equipped at +5; mastery gates pass. Champion's R2 profile is close Battle Bond with 5,600 ms reconstruction, 30% summon-max-HP replacement cost and the actual recalculated recipient readback. No generic Heavy-range assumption was used.

The dispatcher validates every reused control against its new zero-tick readback: package, profile, initial roster/hash, definitions, sustain state and entire initial player view except display name. Original seed, fixture, 100 ms step, cap, endpoints and first-death contract are retained. REUSED_CONTROLS.json contains the 16 source IDs, original compact results/receipts and source artifact hashes. Reuse is explicit in the sealed B manifest and final row statuses; these rows do not spawn a child.

PREFERRED_REFERENCES.json promotes exactly the six requested Volcanic packages for their tested ordinary fixtures, with all remaining package details and Mountain alternative IDs preserved. Each has four verified overnight cap survivors. This reference update does not change gameplay defaults or claim universal charm superiority. Apprentice, Covenanter and T4 Striker Heavy B are not promoted. OVERNIGHT_ERRATUM.md corrects counts and the additional Spirit kill typo without changing historical files.

## Verification and boundaries

See CHECKS.json and qualification/complete.json. Focused lifecycle, summoner and monster checks, packet tests, typechecking and relevant builds passed. Full repository suite and live playtesting were not run. Focused fixtures are correctness tests, not hidden balance probes. All qualification returned before the combat loop; no pilot or allocated case prefix ran.

The authoritative D: sealed packet paths are in LUNA_RUN.md; review mirrors live under packet/. Earlier local preparation qualifications are retained, unrun and superseded after explicit reuse support and lost-victim cast cancellation were finalized. They are not experiment observations or retries. Raw run-01 directories remain absent at handoff.

A and B are independently executable. Source/operational failure stops the affected family, while gameplay deaths continue. Watchdogs and no-retry markers are enforced by the existing dispatcher. New histories stay on D:. Luna must publish one compact readable report, with at most five findings and three decisions, all matched outcomes, uncertainty and counts. A adoption remains a command-center decision. Finish this packet and stop.
