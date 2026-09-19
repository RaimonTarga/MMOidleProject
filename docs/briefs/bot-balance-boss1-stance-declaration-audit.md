# Boss1 Sovereign — retrospective declaration audit

Prepared 2026-09-19. Scope: the Sovereign block's failed artifact verification, resolved
**without new combat**. This is an ADDENDUM. It overwrites nothing: the sealed manifests,
receipts, event logs, summaries and `verification.json` files stand exactly as the run wrote
them, including `artifactVerified: false`.

> **Original frozen verification failed on stance declaration; retrospective review confirmed
> the intended and applied package.**
>
> The original verifier did not pass. The missing field was not present. Neither of those
> facts is amended by this review.

---

## 1. What failed, precisely

`boss1-run.mjs` refused to certify the Sovereign block on its first per-observation assert:

```
boss1-sovereign-striker: applied stance != declared
+ actual - expected
+ 'offensive-stance'
- null
```

The run preserved the data without retry, per the packet's stop rule.

**The gap is wider than the message says.** The assert that fired was the first of several
that would have. Reading all twelve `ready.json` records directly:

| Field | Declared (recorded) | Applied (on the bot) |
|---|---|---|
| `stance` | `null` ×12 | `offensive-stance` ×12 |
| `runeRules` | `null` ×12 | 4 rules (striker, squire) / 5 rules (other four roots) |
| `abilities` | `null` ×12 | `frenzy`+`sweep`, `second-wind`+`cleanse` ×12 |

The stance assert simply ran first. The rule-count assert immediately after it would have
failed too, on `null ?? []` → 0 against 4 or 5. The original report named only the stance,
which is what the error string surfaced; the declaration gap covered three fields.

## 2. Where it arose — spec, serialization, or launcher

**Serialization.** Established by reading the execution revision's source, not inferred from
the report.

- `server/bench/balance/ttkSurveySpec.ts` — `prepareSurveyBot` resolved the package it would
  apply: `cell.tier >= 2 ? cell.stance ?? 'offensive-stance' : null`, plus the five-rule
  survey policy and the tier ability set. Deterministic, cell-only, no result feedback.
- `server/bench/balance/boss1Spec.ts` — `BOSS1_CELLS` spreads `NIGHT5_BLOCKS.t4a` verbatim.
  Those cells set no `stance`, no `runeRules` and no `abilities`, and never did. **That is
  correct and is the point of the block**: §4b reuses the qualified Durability37 T4 graveyard
  preparation so the boss is measured against the same player as the ordinary Graveyard T4
  family. Adding an explicit stance there would have made it a different package.
- `server/scripts/bossScreen.ts` — `declaredPackage` recorded the cell's **raw optional
  fields** (`cell.stance ?? null`), not the values preparation was about to resolve. A cell
  that legitimately inherits a default therefore declared nothing, while the bot correctly
  carried the default.
- `scripts/boss1-run.mjs` — only compares. It reported the divergence accurately.

So neither the spec nor the launcher was wrong. The receipt was describing a different object
from the one the check was about.

## 3. Was Offensive intended, before the results were known

Yes, on three independent grounds, none of which depends on the observed outcome:

1. **The frozen packet.** `bot-balance-boss1-operator-packet.md` §4b, committed at
   `66d33d57` *before* execution, lists the Sovereign block's shared configuration as
   "... upgrades +5, **stance `offensive-stance`**, techniques `frenzy` + `sweep`, guards
   `second-wind` + `cleanse`, and the five-rune survey loadout."
2. **The deterministic source rule.** `prepareSurveyBot` resolves an omitted stance to
   `offensive-stance` for any tier ≥ 2 cell. There is no branch, no randomness and no
   dependence on the fight, so the applied value was fixed the moment the cell was written.
3. **Independent corroboration from an earlier run.** Durability37's graveyard T4 receipts —
   written before Boss1 existed, from the same `t4a` cells through the same preparation —
   record `activeStance: "offensive-stance"` and the identical five-rule ranged loadout. The
   D37 receipt schema has no `declaredPackage`/`appliedPackage` pair at all; those fields
   were introduced by the boss runner. The divergence is new to the boss receipt, not to the
   preparation.

Intent, source rule and prior application all agree. Nothing was copied back from the
observed stance to manufacture a declaration.

## 4. The complete applied package, established independently

Read from the twelve sealed `ready.json` records, not from the report. Every cell:

- **Skill paths** — `cadence/cooldown/dot/reload/summoner/energy` `-root / -balanced /
  -range-close|mid / -balanced-t3-a`, matching packet §4b row for row.
- **Equipment** — declared weapon per root; shared `graveyard-vest-t4`,
  `graveyard-charm-t4`, `mountain-boots-t4`, `core-tempered`, `relic-colossus-heart`.
  Applied equipment equals declared gear in all twelve.
- **Upgrades** — +5 on weapon/armor/recovery/mobility; core and relic at +0 (not upgradable).
- **Stance** — `offensive-stance` active and attuned, ×12.
- **Abilities** — `frenzy` + `sweep`, `second-wind` + `cleanse`, ×12.
- **Rites** — empty, ×12.
- **Rune rules, ordered** — `auto-path-enemy`, `inside-telegraph→step-back`,
  (`orbit` for the four ranged roots), `avoid-hazards`, `wait-for-regen`.
- **RP legality** — 28/47 (striker, squire), 31/47 (other four). Within budget in all twelve.
- **Identity / provenance** — `synthetic: true`, `economyEligible: false`,
  `guardianAccess: "not-measured-guard-stripped"`, guard stripped before the wake,
  `nonBossBodiesAtStart: 0`, initial roster = the boss alone.
- **Treatment overlays** — `hpTreatment: []` in all twelve, as required.
- **Escorts** — `bone-crawler` 1235/85, `plague-hound` 1901/105, `carrion-vulture` 1616/95,
  declared and authored agreeing exactly in all twelve.

### One genuine discrepancy, and it is in the packet's prose

Packet §4b says "the five-rune survey loadout". The two **melee** roots (striker, squire)
actually ran **four** rules: the survey default adds `orbit` only for ranged classes. The bot
is behaving exactly as the reused D37 preparation does — the reuse is faithful — but the
packet's wording overstated a uniform five. This is a documentation inaccuracy, not a build
defect, and the resolved declaration now records the real per-root count rather than prose.

## 5. Terminal evidence, checked on all eighteen fights

The original report spot-checked three fights end-to-end. This review checked **all 18**,
matching each `summary.json` field against the raw `events.jsonl`:

- Every `boss-killed` row (1 Timberclaw, 12 Sovereign) has a raw `kill` event whose
  `victim.id` equals the recorded `bossKillEvidence.victimId`, at the same millisecond, with
  the same killer, alongside the matching `dungeon-message` ("… falls. The altar begins to
  reform.").
- No victory row carries a raw `player-death` event.
- Every `bot-died` row (5 Timberclaw) has a raw `player-death` event at the recorded
  millisecond, with `encounterResetEvidence` "The guard reforms."
- No loss row carries a raw boss `kill` event.
- `elapsedMs` equals the terminal millisecond in all 18.

**Zero disagreements across all eighteen records.** No caps, resets-as-loss, vanishes or
simultaneous-terminal outcomes occurred in either block.

## 6. Resolution

Offensive was unambiguously intended, and all twelve actual packages agree with it and with
each other. Per the work order's first branch, **the twelve Sovereign fights are retained as
usable reviewed baseline evidence** — reviewed, not certified.

Status wording to carry forward: *completed; original frozen verification failed on stance
declaration; retrospectively reviewed and confirmed.* Not "verified", and not "the verifier
passed".

No fight was rerun and none is authorized. The three retained-evidence conditions are met:
intent established from pre-execution sources, applied packages established from the sealed
receipts, and terminal evidence checked exhaustively.

## 7. What was changed so this cannot recur

Narrow, and proven not to touch combat.

- **`resolveSurveyPackage(cell)`** in `ttkSurveySpec.ts` is now the single place the
  preparation defaults live. `prepareSurveyBot` consumes it, and `bossScreen.ts` serializes
  its output as `declaredPackage`. The declaration is still computed from the **cell alone,
  before the fight** — never read back off the bot, which would make the check vacuous.
- **Provenance is recorded**, so the three cases stay apart: `explicit`,
  `preparation-default`, `tier-none`. An omitted field and a deliberate choice are no longer
  the same record.
- **An intentional neutral stance is now expressible.** `??` swallowed an explicit `null`
  alongside an omitted field; the resolver tests `undefined` instead. An explicit empty rule
  array was already honoured and still is.
- **The check is stricter, not weaker.** It compares ordered rune rules rather than counts
  (movement-channel arbitration is top-to-bottom, so a reordered package is a different
  package at the same length), plus abilities, equipment, upgrade level and RP legality. A
  declaration serialized without provenance is itself flagged.
- **It runs at zero-fight qualification as well as at verification.** Boss1 ran a
  declared-vs-applied check on its *earlier* slot only, which is why the later slot's gap
  surfaced after twelve fights had been spent. `assertDeclarationsApplied` is now called by
  the preflight for both Boss1 slots and all six Boss2 blocks, before any combat.
- **Regression fixtures** — `server/test/bossDeclaration.test.ts` covers explicit stance,
  inherited default, intentional neutral, tier-1 none, explicit empty rules, and mutation
  cases proving the checker still fails a wrong stance, a dropped rule, a **reordered** rule
  list (which the old count check would have passed), a raw declaration, an illegal RP total
  and wrong equipment.

### Proof it is declaration-only

Both Boss1 blocks were re-qualified at the patched source (zero fights spent) and compared
against the sealed run:

- **All 12 cells: `effectiveStats` byte-identical, `initialRosterHash` identical.** No
  combat input moved.
- RP costs unchanged (26/28 of 30 Timberclaw; 28/31 of 47 Sovereign).
- Definitions hash still `17aa46cb…`, hitbox hash still `08bcc556…`.
- Sovereign declarations now read `offensive-stance` with source `preparation-default`, and
  the checker returns zero divergences.

The Timberclaw block is unaffected in every respect: it declared its stance explicitly, and
its six observations remain verified as originally recorded.
