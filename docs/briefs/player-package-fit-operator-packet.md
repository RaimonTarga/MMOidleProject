# Player package-fit r1 — sealed Luna operator packet

Status: prepared, main experiment NOT launched. Astra prepares; Luna executes only
when the command center launches this packet. Do not interpret this document as an
automatic dispatch. No adaptive search, numerical tuning, production edits, or expansion.

## Identity and allocation

Execution source is the commit introducing `server/bench/balance/playerPackageFitSpec.ts`:
resolve with `git log -1 --format=%H -- server/bench/balance/playerPackageFitSpec.ts`.
The local execution packet's `identity.json` pins its full HEAD/tree/source hashes,
Node version and hitboxes. `commit-binding.json` links the retained preparation
identity to that execution commit by equal source bytes. No qualification is rerun
to change a commit label. Published preparation receipts retain their actual identity.

Base reviewed: `153153d3` (full identity in the receipts), compared with opening
measured `d67c7453eb0bddc0fd99558e2c928765e8e563ea`, tree
`3058a86e1992ed31410ca3bebc7e21aca0c931dd`. Opening publication is
`be059ea3609a71d68a35563dabdadb17cd70b84f`, not its execution revision.
Intervening production changes: cadence/cooldown buff descriptions, buffSync text,
and Slam icon metadata; client status text/icon and review publication also changed.
No enemy values, AI, damage execution, acquisition or class mechanics changed.
This packet adds only experiment specifications/types and diagnostic recording.

Exactly 36 new main observations: T2/T3/T4 × six original roots × farm/Mountain boss.
All 36 packages change (T4 farming changes offensive priority even where AoE was
already attuned). Zero control replays and zero optional comparisons. All opening
rows are retained as source-compatible original-package evidence, including deaths.
Older Boss1/Boss2/Boss5 references are historical context, not same-context controls.
Seed 101003 is reused for matched screening; deterministic repeats are not independent
evidence, and this does not estimate win probability. World step 100 ms, cap 300000 ms,
first death ends observation. Natural farming ecology/repopulation, synthetic mature
tier, stripped boss guardians and no acquisition evidence remain as in the opening.

## Complete packages

The machine-readable [build changes](../../reports/player-fast-pass/package-fit-r1-preparation/build-changes.json)
contain every original/revised ordered ability and Rune rule with destinations,
skills, gear, actual upgrades, stance, RP spent/budget/unused, and original cell ID.
The companion [table](../../reports/player-fast-pass/package-fit-r1-preparation/build-changes.md)
is an index, not an alternate specification. Runtime source is
`server/bench/balance/playerPackageFitSpec.ts`; original spec remains intact.

All original equipment, upgrades, Offensive stance, balanced frame, range and T4
specialization remain. All defensive abilities and safety rules remain. Rules retain
their original order; boss packages append Enemy Charging → Use Ability: Brace.

| Setting | Complete offensive change | Reason |
|---|---|---|
| T2 farm | Expose Weakness → Slam (Squire/Apprentice) or Sweep (others) | AoE first, save 1 RP |
| T3 farm | Frenzy, Expose → Frenzy, chosen AoE | Preserve defensive kit; save 1 RP |
| T4 farm | Frenzy, Expose, Sweep → Frenzy, chosen AoE, Expose | AoE claims attack channel before Expose |
| All bosses | Add target-casting/use-ability/brace, cost 3 RP | Reactive mitigation |
| T2 four ranged roots, boss | Expose → Power Strike | Smallest RP reduction (1); existing single-target cast, legal at T2 |
| T3 four ranged roots, boss | Frenzy, Expose → Expose | Free 6 RP, keep offensive delivery and all safety behavior |
| T3 Conduit farm only | Remove in-combat/orbit | One focused owner-position/formation adjustment |

T2 Power Strike is a declared package compromise, including its cast commitment
and direct delivery for Apprentice/Conduit. Its result cannot isolate Brace timing.
T3 Frenzy removal likewise changes offense. No stance substitution is hidden here.

Squire's 1855/1765 ms original attack cadence favors testing Slam's fixed 1600 ms
wind-up with its high Attack. Apprentice has 94/162/387 Attack and 724/700/764 ms
ordinary cadence in the opening receipts: a 1600 ms cast forgoes roughly two ordinary
attack opportunities before cast-speed modifiers. Slam still resolves direct damage
through resolveCastPayload → applyPlayerAoe, bypassing ordinary root DoT conversion.
Its radius is 150 around the impact, requires target reach at completion, can continue
moving (no range bonus hold), and aborts for hard control, target loss or lost reach.
Sweep instead spreads one root DoT stack to each secondary body. Slam is the declared
practical burst default here, not proven superior; the three successful casts in the
30-second Apprentice smoke establish delivery only. No alternative outcome search.
Striker/Spirit use ordinary hit Sweep; Slinger spreads its budget across the ammo clip;
Conduit spends formation shares through real summon deliveries. Frenzy is instant and
does not claim the offensive channel; chosen AoE precedes Expose wherever both exist.

Historical review: Boss1's corroborated Spirit reference and Boss2 Juggernaut winners
used Defensive stance, Cave vest, Mountain charm, Plains boots, Tempered Core, +5,
Expose/Second Wind/Brace, and chase/orbit with the safety rules. Boss2 Squire won at
95100 ms; Conduit at 199200 ms on Ruinous Axe. These are materially different from
the opening gear/stance and pre-opening source. Reuse their recovery-plus-mitigation
kit as a candidate reference already present in the opening; do not import the stance,
boots or slow Conduit axe into this timing revision. Source: boss1Spec.referencePackageCells,
boss2Spec and bot-balance-boss2-report §3.2; Boss5 continues that provenance with longer
caps. No slot translation is needed: these references already declare attuned arrays.

Conduit review: opening T3 farming died at 110300 ms, 3 kills, 6 HP-regain targets,
234 summon beats. Its 111 one-second samples show 22 selected-target changes, 9 empty
formation samples, 0–5 active bodies, 32 distinct bodies and 86 Orbit-tagged samples.
Sampled owner travel was about 7904 px (a lower-bound polyline, not exact path length).
Formation arm/delivery telemetry exists, so this is not simply an ability that never
fires. Production minion targeting/leash is relative to the moving owner. Removing
Orbit is a bounded hypothesis about persistence, not an established cause of all
regain or deaths. T4 boss is separate: 288000 ms kill, 449 summon beats, no target HP
regain. Keep its movement unchanged. Do not redesign Conduit or claim raw damage alone.

## Qualification and timing

All 36 legal preparations passed. Farm preparations are zero-tick; each boss preparation
includes one 100 ms wake tick. Exact applied Rune arrays equal declarations, including
targetAbilityId through types, preparation, manifest and ready receipts.
Two declared combat smokes only, outside the 36 main rows:

- T2 Apprentice farming: 30000 ms, 10 kills; three Slam starts/resolutions, no aborts.
- T2 Squire boss: capped at 60000 ms, alive; Brace casts at 6100, 17100, 28100,
  39100, 50100 ms. A charge hit at 39800 ms had `ability-guard` active before and
  after that World tick (2400/2300 ms remaining, drPct 0.552); empowered hit damage 98.
  The 58800 ms next charge begins while Brace remains on cooldown: not every charge
  is guaranteed coverage. The opening 44 s death remains valid original evidence.

Enemy Charging queries guardable threats against this player: damaging ability casts,
charged attacks and guardable boss-pattern casts. Stoneplate's utility shield cast is
excluded; the charge wind-up is recognized. Active custom Rune destinations precede
default ability order. Brace therefore precedes Second Wind/Cleanse when eligible;
the first eligible Guard claims the 100 ms shared window. Its custom rule suppresses
the default HP-below trigger. Cooldown and hard control still block activation.
Brace base window is 3000 ms at T2/T3, 3500 ms at T4, cooldown 10000 ms before gear
modifiers. Charge wind-up plus travel can outlast a window, and accelerated cycles can
arrive before cooldown. Report actual overlap, never assume it from the equipped rule.

Diagnostics preserve all package-fit node events (cast starts/ends, hits/footprints),
plus boss per-tick pre/post status, guardable threats and cooldown boundaries.
World-log `mitigation.drBlocked` is not total Brace savings: Brace acts later in the
onDamageTaken listener. Use observed status overlap and actual hit events; do not infer
missing mitigation from that subtotal or invent counterfactual damage savings.

Checks: pnpm typecheck; abilitySlam, abilityMultiSlot, abilityTechniqueRune. See the
qualification record for final check outcomes. No full-suite claim or live playtest.

## Luna commands and hard stops

Use the bound local packet; do not prepare/reseal it. From the source commit above:

```powershell
$packet = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/package-fit-r1-execution-packet'
node scripts/player-fast-pass.mjs --mode=verify --variant=package-fit --packet=$packet
node scripts/player-fast-pass.mjs --mode=run --variant=package-fit --packet=$packet --out=C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/package-fit-run-01
```

Run only after the command center authorizes execution. Execute once, sequentially,
no retries and no build adaptation. Hard stop on source/runtime/hitbox/packet drift,
missing destination, wrong case IDs or existing output. Return to command center;
do not silently repair/rebind. Missing hitboxes, illegality, runner exceptions or invalid
terminal states preserve failed block evidence; the launcher continues independent
blocks but stops all on shared identity drift. Fifteen-minute child watchdog and
existing per-observation wall limits apply. Death/cap alone is not an execution failure.
A missing summary is unknown, never a fabricated death or zero. No victory prerequisite.

## Machine-readable result contract and publication (required)

Luna MUST produce an agent-consumable experiment summary, preferably `results.json`.
If Markdown is used, put the same structured object in one JSON fence; no narrative-only
substitute. The schema is in
[report-contract.json](../../reports/player-fast-pass/package-fit-r1-preparation/report-contract.json).
Keep stable case IDs, typed numbers/nulls, units, explicit unknown reasons and evidence
paths. Outcomes/exposure first; record partial, invalid and failed rows as well as wins.

Publish under `reports/player-fast-pass/package-fit-run-01-review/`: machine summary,
unaltered launcher report, execution identity, manifests, ready receipts, process/terminal
records, compact diagnostic evidence and raw-artifact hash/path inventory. Include the
two preparation smokes as qualification references, never main rows. Retain raw streams
locally and publish relevant excerpts sufficient for another agent to audit the claims.
Do not rely solely on machine-local absolute paths for the report's supporting evidence.
Preserve bytes with directory-local `.gitattributes` when publishing hashed originals.

After execution/reporting, Luna MUST commit and push these scoped results and supporting
artifacts to origin on the authorized branch, preserving unrelated work. Do not amend
measured source or overwrite opening evidence. Report the pushed branch, full publication
commit and repository-relative entrypoint so the other agent can read them from Git.
If push fails, retain the commit and report publication as incomplete with the actual
reason; do not claim the other agent can retrieve unpushed work. No tuning/integration.
