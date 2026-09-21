# Farming sustain 01 — prepared, not run

This prepares the next experiment requested from `FARMING_SUSTAIN_AND_CONDUIT_NEXT_EXPERIMENT_ASTRA(1).md`. Its later execution/publication instructions are a handoff, not authorization to launch or push during preparation. No main observations, production smoke windows, acquisition runs or deployments were performed.

## Frozen scope

**20 observations**, seed **101003**, production World steps **100 ms**, **300,000 ms** cap, stop each observation on first player death. Ordinary pulling, ecology, recovery and native automation remain enabled. All gameplay definitions, R2 reconstruction, enemies, other classes and economy are unchanged. This is synthetic mature-package combat evidence, **not economy evidence**.

| Workstream | Identity | Fixture(s) | Arms |
| --- | --- | --- | --- |
| A | breadth-t3-striker-balanced | node-t3-volcanic-03; node-t3-tundra-03 | Mountain / Volcanic +5; Offensive |
| A | breadth-t3-squire-balanced | same exact two fixtures | same |
| A | breadth-t3-apprentice-balanced | same exact two fixtures | same |
| B | breadth-t4-conduit-heavy-a | node-t4-graveyard-03 | Mountain / Volcanic × static / temporary Recuperating |
| B | breadth-t4-squire-heavy-a (Avenger) | node-t4-graveyard-03 | same four arms |

The contrast node is copied from the prior farming-stance spec and checked against the prior manifest. The executable [manifest](packet/manifest.json) contains every complete ordered loadout, item ID, path, arm ID and fixture. [Applied receipts](qualification/resolved-builds.json) contain actual equipment/upgrades, mastery, known abilities, stances, initial stats/HP/barrier, recovery passives, evolution/stance gates, reserved RP breakdown and free RP. Human-readable costs are in [loadout summary](loadout-summary.json).

The Mountain recovery slot is replaced in Volcanic arms, so its Recovery and barrier are not retained or equalized. Every arm begins at its legitimate full HP and barrier. Magmaheart +5 is mastery 4 after its mastery-3 gate; Inferno +5 is mastery 10 after its mastery-9 gate. Receipts walk the Plains → Volcanic evolution gates; synthetic mature ownership is not acquisition evidence.

Every arm uses Offensive as default. Temporary arms additionally attune Recuperating and equip exactly `hp-below-25 -> switch-stance(recuperating-stance)`. The production condition is **HP <=25%**, not a custom threshold or hysteresis. Above 25%, native arbitration returns to Offensive subject to its **1,500 ms** cooldown. Recuperating costs 4 RP plus 1 RP for the condition, activates 80% of Recovery in combat and applies -50% damage/-30% attack speed. Normal true-OOC Recovery is already 100% after its delay, unless suppressed. No forced full-heal hold or runtime stance mutation exists in the runner.

Covenanter has only 4 spare RP in the prior package. **Expose Weakness is displaced from all four Covenanter arms**, leaving Sweep, Frenzy, all Guards, recovery and hazard rules intact. The Squire uses existing headroom without displacement. Static arms do not reserve unused Recuperating. This measures explicit opportunity cost, not an optimized alternative use of spare RP. The existing `always -> wait-for-regen` remains identical: it can hold while disengaged during the combat grace timer; it is not restricted to `when-idle`, nor strengthened for treatment arms.

## Source and qualification

See [checks](checks.json), [source identity](packet/identity.json), [seal](packet/seal.json) and [qualification marker](packet/qualified.json). The actual child checks its revision, sealed file bytes, Node version and hitbox hash before constructing the arena. The dispatcher repeats source/packet checks before and after every child, checks declared/applied packages and requires each run receipt to match qualification.

Execution revision and exact commands are in [LUNA-HANDOFF.md](LUNA-HANDOFF.md). The execution checkout is fixed and detached. The preparation publication commit is a different identity; never substitute its HEAD for the execution revision. No remote publication is performed here.

Qualification constructs all 20 ordinary fixtures and applies loadouts with **zero combat World ticks**. Focused module checks exercise the 25% boundary, Recovery activation, native cooldown and default return without a combat window. Main runs remain unlaunched. Full-suite and live playtest status are explicitly not run; qualification is not a farming result.

## Applied stats and RP

Both T3 fixtures use the same stats. Values below are actual prepared owner totals, not item-only contributions. Static and policy arms begin Offensive; true-OOC active Recovery initially reads 100% in every arm.

| Identity | Mountain → Volcanic Recovery | Mountain → Volcanic initial barrier | RP static / policy / budget |
| --- | --- | --- | --- |
| Skirmisher | 15 → 21 | 146 → 0 HP | 33 / n/a / 38 |
| Knight | 15 → 21 | 132 → 0 HP | 33 / n/a / 38 |
| Ember mage | 15 → 21 | 134 → 0 HP | 36 / n/a / 38 |
| Covenanter | 25 → 34 | 246 → 0 HP | 36 / 41 / 47 |
| Avenger | 19 → 26 | 259 → 0 HP | 40 / 45 / 47 |

Qualification: **20/20 passed, zero failures, zero combat observations**. Five focused suites, a read-only recorder module check, full typecheck including benches, shared build and server TypeScript build passed. The actual child rejected a corrupted source hash before arena/output creation. No full suite, browser playtest or general bot preflight was run.

## Conduit disposition

[CONDUIT-REVIEW.md](CONDUIT-REVIEW.md) contains three source/trace findings; [conduit-evidence.json](conduit-evidence.json) retains exact raw paths and hashes. The old Balanced Defensive Tundra target takes 2,151 fully absorbed hits and no HP damage while its aggro session repeatedly changes. This narrows the problem to barrier/session continuity. The availability metric is authored living weight, not DPS. Covenanter's Graveyard owner death occurs with intact bodies and no reconstruction payments.

**No C candidate is sealed. All eight optional observations are unused.** A/B is independently ready; do not add a reconstruction multiplier, enemy patch or unqualified correction to this packet. Source review confirms owner direct, summon direct, secondary and owner-attributed delayed kill hooks can activate owner Recovery; that does not heal summons or guarantee a kill opportunity.

## Measurement and interpretation

Existing `events.jsonl`, `samples.jsonl`, `summary.json` and `conduit.json` are preserved. Narrow read-only observations add `sustain-transitions.json`, 1-second Recovery/stance samples and compact 100-ms sampled exposure totals. They record stance/phase transitions, observed kill-window starts/refreshes/uptime, Recovery fractions, cooldown-delayed return exposure, and minimum/terminal HP and barrier. Boundary samples are not exact internal sub-tick timing; kill refresh counts are lower bounds. First-kill delay, target regain, death events, incoming pressure and recovery episodes come from the existing streams.

Source-specific effective healing and overheal are **null with reasons**: current heal logs round applications, omit sub-1 HP events and do not label the Recovery source. Recorded heal totals must be described as recorded, not exact effective healing. Counterfactual productive damage lost is likewise unavailable; use paired progress and actual outgoing damage during posture intervals. Full summon histories/per-tick arrays stay out of compact results. Delayed/secondary damage cannot always be assigned to an originating summon.

A cap with zero kills is not successful farming. Death-shortened kill rate is not sustainable throughput. No trigger opportunity is a gameplay result but not a strength test. Report charm, policy and interaction separately, including lost barrier, changed Recovery and RP. Keep the prior Covenanter Desert reversal as a warning against universal stance recommendations. Do not infer contact from episode membership, missing values from zeros, or a winner from incomplete pairs.

## Stop and publication contract for the later operator

Run sequentially, once, only from fixed source and a fresh external output. No retries, adaptive changes, extra seeds, cap extensions, enemy isolation, guaranteed rests, post-kill heals, death restarts or follow-on grid. The first shared operational/source/readback failure stops the family and preserves all artifacts; deaths and valid caps complete gameplay rows. Remaining cases are explicitly not-run. A failed packet is never overwritten/resealed in place.

Later execution should write a readable REPORT.md and compact results-summary.json, preserving raw streams externally. Publish only the report, compact results, applied-build/identity/completion receipts and raw inventory to `reports/player-fast-pass/farming-sustain-01/run-01/`. Keep original evidence intact and distinguish execution SHA from publication SHA. Under a separate execution/publication assignment, commit and push only that scope, verify the remote commit, and return branch, both SHAs, report path and completed/failed/not-run counts. Do not claim publication if push fails. Return at most three measured next decisions, with no automatic follow-on.
