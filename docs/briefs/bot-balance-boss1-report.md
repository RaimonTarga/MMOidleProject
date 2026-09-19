# Boss1 formal screen — execution report

Executed 2026-09-19 against the frozen packet [`bot-balance-boss1-operator-packet.md`](bot-balance-boss1-operator-packet.md).
No gameplay, build, or test-code changes were made. No commits, pushes, or follow-up
experiments were launched.

---

## 1. Executive summary

- **Revision used**: `66d33d573de3be5fec292ce5a2297548164a7279` (tree
  `bad68e01dd5993290783f2ca994cb21cce0a22a5`), resolved mechanically from `HEAD` at execution
  time, working tree clean. Definitions hash and hitbox hash both read back the frozen values
  (`17aa46cb…`, `08bcc556…`). No duplicate run was found before launch; this was a fresh run.
- **Qualification**: `pnpm typecheck` and all three named qualification tests
  (`boss1Matrix`, `mobAdoptionIntegration`, `durability37Matrix`) passed.
- **Preflight**: both slots qualified; pilot reproduced the packet's own smoke-test receipts
  (Timberclaw 6 roots / 1 corroborated / zero fights spent; Sovereign 6 ready receipts;
  pilot kill at 37.6 s matching §7 exactly).
- **Formal run — Timberclaw block**: **verified**. 6/6 fights completed. 1 boss-killed
  (the corroborated Spirit build), 5 bot-died. No caps, resets-as-loss, vanish, or invalid
  outcomes.
- **Formal run — Sovereign block**: 12/12 fights completed and each carries authoritative
  per-fight kill evidence and correct escort-adoption values, **but the block's own
  artifact verification failed** (`applied stance != declared` — every one of the 12
  Sovereign `ready.json` records `declaredPackage.stance: null` against
  `appliedPackage.activeStance: "offensive-stance"`, a manifest-declaration gap, not a
  build error). Per the packet's stop rule, the run script did not retry; data was
  preserved as-is. **This block is reported as completed-but-unverified, not certified.**
  No repair was attempted.

---

## 2. Planned / started / completed / verified counts

| Block | Planned | Started | Completed | Block-verified |
|---|---:|---:|---:|---:|
| Timberclaw (earlier) | 6 | 6 | 6 | **6** (`artifactVerified: true`) |
| Sovereign (later) | 12 | 12 | 12 | **0** (`artifactVerified: false`) |
| **Total** | **18** | **18** | **18** | **6** |

"Completed" means the fight ran to a terminal outcome and wrote `ready.json` / `summary.json` /
`events.jsonl`. "Block-verified" is the run script's own independent per-block artifact check
(`boss1-run.mjs`), separate from the per-fight `bossKillEvidence` check, which passed on every
individual fight in both blocks (see §5).

Total wall time for both blocks: 16.4 s (bench-clock, not wall-clock combat time — see per-fight
`elapsedMs` below).

---

## 3. Timberclaw block (verified) — 6 fights, seed 96011

| Root | Outcome | Evidence | Elapsed | Boss HP remaining | Boss HP % removed | Player min HP | Player terminal HP | Adds / casts |
|---|---|---|---:|---:|---:|---:|---:|---|
| **spirit** | **boss-killed** | `bossKillEvidence` names Apex Timberclaw as victim at 30,300 ms | 30,300 ms | 0 / 3750 | 100% | 57.4 (24.9%) | 57.4 (kill moment) | 0 adds; 8 casts (`Stunning Swipe`, `Bestial Frenzy`) |
| apprentice | bot-died | `playerDeathEvidence`: melee kill by Apex Timberclaw at 27,600 ms; `encounterResetEvidence`: "The guard reforms." | 27,600 ms | 1270 / 3750 | 66.1% | 0 (death) | 0 | 0 adds; 7 casts |
| conduit | bot-died | same evidence shape, 49,300 ms | 49,300 ms | 1342 / 3750 | 64.2% | 0 (death) | 0 | 0 adds; 13 casts |
| slinger | bot-died | same evidence shape, 29,000 ms | 29,000 ms | 212 / 3750 | 94.3% | 0 (death) | 0 | 0 adds; 8 casts |
| squire | bot-died | same evidence shape, 29,300 ms | 29,300 ms | 1227 / 3750 | 67.3% | 0 (death) | 0 | 0 adds; 8 casts |
| striker | bot-died | same evidence shape, 30,800 ms | 30,800 ms | 1835 / 3750 | 51.1% | 0 (death) | 0 | 0 adds; 8 casts |

All 6 capped at 300,000 ms — none reached the cap (longest fight was 49.3 s). Apex Timberclaw has
no adds by design; `maxAddsAlive: 0` on every row, consistent with the packet's §3 note that seeds
are inert for this boss (single seed used, per packet).

Only the **Spirit** cell reproduces the historically corroborated V1i package (231 maxHp / 100
attack / 18 plating / 0.19 DR / 129 barrier, matching qualification exactly). The other five are
reference **constructions** on their own tier-legal weapons, per packet §4a/§8.7 — their deaths are
not evidence that the boss needs a nerf.

---

## 4. Sovereign block (completed, **block verification failed — not certified**) — 12 fights, seeds 94011/94019

**Terminal outcome first, per §8.1**: all 12 fights ended `boss-killed` with an authoritative
`bossKillEvidence` record naming Charnel-Crown Sovereign as the victim (spot-checked against raw
`events.jsonl` — the `kill` event, `dungeon-message` "Charnel-Crown Sovereign falls," and
`bossKillEvidence` all agree at the same tick and timestamp for every fight sampled; see §6). No
deaths, resets, caps, or invalid outcomes occurred in this block.

| Root | Seed | Outcome | Elapsed | 50%-phase crossed | Player min HP | Player terminal HP | Max adds alive | Casts |
|---|---:|---|---:|---:|---:|---:|---:|---|
| striker | 94011 | boss-killed | 37,600 ms | 24,200 ms | 496.6 (73.7%) | 633.3 | 5 | Raise Dead, Necrotic Screech, Mass Resurrection |
| striker | 94019 | boss-killed | 38,400 ms | 21,800 ms | 459.6 (68.2%) | 674.0 (kill) | 5 | same 3 labels |
| squire | 94011 | boss-killed | 100,000 ms | 64,800 ms | 548.0 (74.9%) | 732.0 (kill) | 5 | Necrotic Screech, Raise Dead, Mass Resurrection |
| squire | 94019 | boss-killed | 97,800 ms | 60,000 ms | 547.9 (74.8%) | 732.0 (kill) | 5 | same 3 labels |
| apprentice | 94011 | boss-killed | 36,800 ms | 24,200 ms | 374.5 (59.8%) | 527.1 | 5 | Raise Dead, Necrotic Screech, Mass Resurrection |
| apprentice | 94019 | boss-killed | 40,800 ms | 25,600 ms | 365.5 (58.4%) | 595.8 | 5 | same 3 labels |
| slinger | 94011 | boss-killed | 56,600 ms | 37,100 ms | 476.8 (80.5%) | 583.4 | 5 | same 3 labels |
| slinger | 94019 | boss-killed | 56,600 ms | 33,600 ms | 453.3 (76.6%) | 592.0 (kill) | 5 | same 3 labels |
| conduit | 94011 | boss-killed | 83,200 ms | 50,900 ms | 343.4 (56.6%) | 607.0 (kill) | 5 | same 3 labels |
| conduit | 94019 | boss-killed | 81,500 ms | 50,800 ms | 326.3 (53.8%) | 582.4 | 5 | same 3 labels |
| spirit | 94011 | boss-killed | 58,800 ms | 34,000 ms | 336.9 (59.3%) | 568.0 (kill) | 5 | same 3 labels |
| spirit | 94019 | boss-killed | 53,000 ms | 32,200 ms | 327.3 (57.6%) | 548.5 | 5 | same 3 labels |

"Player terminal HP" marked "(kill)" is the exact value at the kill tick; unmarked values are the
last 1 s sample before the kill tick (sampling is 1000 ms per §"sampleEveryMs", so these lag the
true terminal value by up to 1 s). Escort adoption values (`bone-crawler` 1235 HP/85 atk,
`plague-hound` 1901 HP/105 atk, `carrion-vulture` 1616 HP/95 atk) matched the declared values
exactly in every one of the 12 `ready.json` records (the §5 receipt rule); `hpTreatment` was empty
in all 12, as required.

Per §8.5, Conduit's two fights record `attackBeats: 0` and nonzero `minionAttackBeats` (818 and
800) by design — `CannotAttack` — and this is not treated as invalidating evidence.

**Owner vs. escort damage** (packet §8.4/§8.5, reported separately, not pooled into the boss's own
output): boss-dealt damage to the player ranged 190.6–1583.2 across the 12 fights; escort-dealt
damage (bone-crawler / plague-hound / carrion-vulture, plus a handful of `Risen` variants from the
passive `raisesDead`) was tracked per-species in every `summary.json` and is not folded into the
boss figure.

### Why this block is not certified

`boss1-run.mjs` compares each cell's `declaredPackage` (from the manifest) against its
`appliedPackage` (from the live bot) and refused to certify the block on:

```
boss1-sovereign-striker: applied stance != declared
+ actual - expected
+ 'offensive-stance'
- null
```

Inspection of all 12 `ready.json` files shows this is systemic, not isolated to the striker cell:
every Sovereign cell's `declaredPackage.stance` is `null` while `appliedPackage.activeStance` is
correctly `"offensive-stance"` — matching the packet's own §4b spec, which declares
`stance offensive-stance` as shared config across all six Sovereign builds. The manifest simply
never carries a `stance` field for this block's declared package; the bot itself was built
correctly. This is an **infrastructure/setup check failing on a declaration gap**, not a build
defect and not a gameplay result. Per the packet's operating rule, the run script preserved the
data without retry and did not fail the individual fights' own kill-evidence checks. **No repair
was made during this operation, as instructed.**

---

## 5. Guardian/access

Unmeasured in both blocks, as declared. `guardianAccess: "not-measured-guard-stripped"` in every
`ready.json`; the dungeon guard was stripped before the boss was forced awake, in both blocks, on
every fight.

---

## 6. Raw-events vs. summary agreement

Spot-checked three fights end-to-end against their raw `events.jsonl` (Timberclaw Spirit win,
Timberclaw Striker death, Sovereign Squire seed 94011 — the longest fight in the batch at 100 s):
in all three, the `kill` / `player-death` event, its `dungeon-message`, and the corresponding
`bossKillEvidence` / `playerDeathEvidence` field in `summary.json` agree on actor, victim, damage,
and timestamp down to the millisecond. **No disagreement between raw events and summaries was
found in the fights checked.** This was a targeted spot-check, not an exhaustive per-fight
byte-diff across all 18 records.

---

## 7. Findings for command-center review

1. **The Sovereign block (12/12 completed fights) is not certified.** Every Sovereign `ready.json`
   is missing a declared `stance` value (`null`) against a correctly-applied
   `offensive-stance`, which fails `boss1-run.mjs`'s own build-consistency check and blocked
   block-level verification. The per-fight evidence itself (kill evidence, escort adoption
   values, HP treatment) is internally consistent and clean in all 12 records. Command center
   needs to decide whether to accept this data on the strength of the per-fight checks despite
   the block-level gap, or require a manifest fix (adding `stance` to the Sovereign declared
   package) and a rerun before treating this as the frozen Sovereign screen.
2. **Timberclaw: only the historically corroborated Spirit build cleared the boss (1/6).** The
   five reference-constructed builds (striker, squire, apprentice, slinger, conduit) all died,
   having removed 51%–94% of the boss's HP first. Per packet §4a/§8.7 these five are
   constructions, not historical evidence, and must not be read as a Timberclaw balance verdict
   on their own.
3. **The two slots show sharply different outcome rates** (Timberclaw 1/6 boss-killed vs.
   Sovereign 12/12 boss-killed, all well inside their caps with the 50%-HP Mass Resurrection
   phase reliably triggered). The packet explicitly disallows drawing a cross-boss or
   cross-slot comparison from this screen (§4b, §9), so this is flagged only as a pattern
   worth the command center's attention, not a conclusion.

---

*No boss nerfs, player buffs, T3 Jungle changes, additional sweeps, live-server replay, automatic
follow-up experiments, commits, or pushes were made in the course of this execution.*
