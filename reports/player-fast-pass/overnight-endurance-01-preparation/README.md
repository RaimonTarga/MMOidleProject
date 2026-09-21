# Overnight endurance 01 — prepared and qualified

**Ready for Luna; main combat NOT executed.** 336 planned observations, 0 completed combat, 0 failed combat, 336 not run. Actual child qualification passed for all 336 scheduled cases with zero combat World ticks. Block C is omitted before sealing; the total allocation is 336, not 352.

Start with [LUNA_RUN.md](LUNA_RUN.md), which contains exact verified commands and the execution/report/publication contract. No Luna task was started during preparation.

| Block | Scope | Observations |
|---|---|---:|
| A | All 18 T3 and 54 T4 identities, two ordinary fixtures, two seeds | 288 |
| B | Mountain +5 controls for 12 selected identities; Volcanic +5 partners are already in A | 48 |
| C | Historical diagnosis only; no qualified candidate | 0 |

Each main row has one continuous 1,800,000 ms maximum life at the normal 100 ms World step, first-death stop, and 300,000/900,000/1,800,000 ms cumulative checkpoints. Seeds are 101009 and 101021. Fixtures resolve from the stance catalogue: T3 Volcanic-03/Tundra-03 and T4 Graveyard-03/Desert-03. These are synthetic mature packages, economyEligible=false; not progression, acquisition, multiplayer or live-playtest evidence.

The [ordered ledger](ORDERED_CASES.tsv) keeps paired arms adjacent, Volcanic first for 101009 and Mountain first for 101021. Each fixture/seed block cycles roots and T3/T4 paths rather than completing an entire class first. Nonpaired identities retain their existing qualified breadth farming reference. The five sustain identities inherit the latest static sustain package. The 12 selected pairs use Offensive in both arms and differ only in the declared charm. Covenanter retains the omitted Expose Weakness from the latest sustain receipt. No permanent Recuperating or new threshold policy is added. Spare RP is retained.

See [CATALOGUE.md](CATALOGUE.md) for all 84 complete packages, actual skill paths/display names/ranges, ordered abilities, equipment/upgrades, core/relic, Rune rules and used/free RP. [Resolved builds](qualification/build-references.json) contain deduplicated actual package readbacks, mastery/evolution/upgrade gates, initial HP/barrier, Conduit profiles, all case-to-build/runtime/roster references and the hash/path of the complete 336 external receipts.

## Fixed source and readiness

Execution SHA: `e26fdccd3baaa96fe1d19263349d57d9c5abc626`.
Execution source SHA-256: `6f49c74da2c23037d06b1185ba4ba1682a8b9160552475e8deb517889ebddd3b`.
Hitboxes SHA-256: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`.

The fixed checkout is `D:/mmo-idle/overnight-endurance-01/source`; the authoritative packet, qualification and reserved run output are its sibling directories. Review copies of the sealed packet are under [packet/manifest.json](packet/manifest.json). The actual packet and receipts are hash-verified; executing from a later documentation/publication commit is rejected. Publish from the normal repository checkout instead.

The baseline `48d03ce9` adds publication/preparation docs over the measured sustain source `d056896d`; no intervening gameplay-source differences were found. The new execution commit changes only bench specification/recording/dispatch/tests and the existing ttkSurvey entrypoint. `shared/src`, `server/src` and `bot/src` remain identical to the measured R2 line. No R2 overlay is installed a second time and no enemy/class/item/ability values change.

The actual child used a direct Node process, file-URL tsx loader and development-condition imports. It read shared source inside the fixed checkout and checked all frozen source file hashes, exact HEAD, seed, arm, duration and hitboxes. The one qualification process constructed each scheduled World/package and returned before the combat loop; main execution uses one process/World per observation. All 48 charm pairs have identical initial roster hashes. All 168 seed comparisons have different initial roster hashes, documented in [seed-roster-readback.json](seed-roster-readback.json). This confirms different initial realizations, not statistical independence or rare-event reliability.

Focused endurance, existing sustain, stance and breadth tests passed. Full pnpm typecheck including bench, shared build, server build and git diff whitespace validation passed. Full repository tests and live playtesting were not run. No hidden short combat qualification was run; the new continuous 30-minute combat path remains unmeasured until Luna executes the scheduled ledger. See [checks.json](checks.json) and [qualification/complete.json](qualification/complete.json).

C: had about 6 GB free initially and about 44 GB after the user's cleanup. D: had roughly 650 GB available and holds raw output. Limits are sealed in the manifest: 5 GiB free output disk, 1 GiB host free memory, 2 GiB child RSS, 120 seconds without advancing heartbeat; no absolute observation wall cap. The detached lockfile install succeeded without lockfile changes after an offline attempt found an uncached pnpm package. No storage failure or campaign retry occurred.

## Measurements and C disposition

World event/sample, Conduit event/snapshot and sustain transition histories stream to external JSONL; compact cumulative endpoints and terminal diagnostics are retained. The read-only progress counter separates HP damage from barrier absorption and captures first kill and longest kill/HP-progress gaps. Missing post-death intervals remain null. No target HP-regain, empty exposure or availability proxy is relabeled as productive farming. Source-specific effective healing, overheal and hypothetical damage lost remain unavailable. Existing event timestamps label tick starts; endpoint snapshots follow completed 100 ms steps.

[CONDUIT_DIAGNOSIS.md](CONDUIT_DIAGNOSIS.md) reconciles the existing review and original traces. Balanced Defensive Tundra repeatedly hits Glacier Bear's refreshed barrier without HP progress; Heavy Defensive Volcanic shows owner pressure and paid reconstruction despite high alive authored offense. No isolated correctness candidate was qualified, so C combat is omitted. The sustain label Conduit resolves by actual receipt to Covenanter (`breadth-t4-conduit-heavy-a`, `summoner-heavy-t3-a`); Avenger resolves to `breadth-t4-squire-heavy-a`, `cooldown-heavy-t3-a`. See [historical-evidence.json](historical-evidence.json) for rehashed prior raw references. No prior candidate or investigation is invented.

## Delivery status

Preparation code and handoff are local commits. No main launch, scheduled automation, Luna task, gameplay adoption or push was performed. The copied [brief](BRIEF.md) is the user's preparation input, not a record of executed instructions. On the later execution assignment, Luna must run once, produce a readable REPORT.md with at most five findings and three decisions, preserve partials, commit AND push only the scoped compact publication, verify remote availability, and return the actual branch/publication SHA/measured SHA/counts. The old sustain report may be published in its own path without gating the new run.
