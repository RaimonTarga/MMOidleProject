# Boss2 operator packet — execution report

Executed 2026-09-19 against the frozen packet
[`bot-balance-boss2-operator-packet.md`](bot-balance-boss2-operator-packet.md). No gameplay,
build, or test-code changes were made. No commits, pushes, or follow-up experiments were
launched.

---

## 1. Executive summary

- **Revision used**: `96cf77d4d24f4c3f0e813ee699c31facdcb2de06` (tree
  `2bf3a8c44dee64a0516e4496fa57838e2a476c44`), resolved mechanically from `HEAD` at execution
  time, working tree clean. Definitions hash and hitbox hash both read back the frozen values
  (`17aa46cb…`, `08bcc556…`) in every block's manifest.
- **Qualification**: `pnpm typecheck` and all five named qualification tests (`boss2Matrix`,
  `boss2Concealment`, `bossDeclaration`, `bossTerminal`, `boss1Matrix`) passed.
- **Preflight**: all six blocks qualified into a fresh root, reproducing the packet's own
  smoke-test receipts verbatim (6 portable references / boss awake / declarations applied, on
  every block; `boss2 preflight: ok — 6 blocks, 36 planned observations, ZERO fights spent`).
- **Formal run — all six blocks verified.** `batch-ended.json` shows `artifactVerified: true`
  on all six; each block's own `verification.json` agrees. 36/36 fights completed, 0 capped,
  0 encounter-reset-as-terminal, 0 vanished, 0 ambiguous, 0 invalid. Total wall time 33.6 s
  (bench-clock, not combat time).
- **New-run outcome split**: 16 `boss-killed` / 20 `bot-died` across the 36 executed fights.
  Combined with the 6 reused Timberclaw observations (1 `boss-killed` / 5 `bot-died`, source
  `66d33d57`, seed `96011`), the full seven-boss map is **17 boss-killed / 25 bot-died out of
  42**, of which 36 are newly executed and 6 are carried forward per packet §9.
- **Portability independently re-verified**: each root's `effectiveStats` (from `ready.json`)
  is byte-identical across all six new blocks and identical to its Boss1 Timberclaw cell — this
  was checked directly against the artifacts, not just cited from the packet.
- **No repair, no retries, no extra fights.** No block required the packet's stop rules; unlike
  Boss1's Sovereign block, nothing here needed to be reported as completed-but-unverified.

---

## 2. Planned / started / completed / verified counts

| Block | Boss | Planned | Completed | Block-verified |
|---|---|---:|---:|---:|
| razortusk | Gorging Razortusk | 6 | 6 | **yes** |
| juggernaut | Stoneplate Juggernaut | 6 | 6 | **yes** |
| behemoth | Mire-Gorged Behemoth | 6 | 6 | **yes** |
| dreadbore | Chitinous Dreadbore | 6 | 6 | **yes** |
| emperor | Dune Stalker Emperor | 6 | 6 | **yes** |
| gorger | Jungle Dread-Gorger | 6 | 6 | **yes** |
| **Total (new)** | | **36** | **36** | **36/36** |
| timberclaw (reused, `66d33d57`) | Apex Timberclaw | 6 | 6 | 6 (Boss1's own verification) |
| **Combined map** | | **42** | **42** | **42/42** |

---

## 3. Per-block results — terminal outcome first

All elapsed times are well inside the 300,000 ms cap; the longest fight in the whole screen was
juggernaut/conduit at 199,200 ms. "Player min HP" and "terminal HP" are read from 1000 ms
samples; a death's terminal HP is exactly 0 at the death tick, a win's terminal HP is the last
sample at or before the kill tick and is annotated with its lag behind the true kill moment.

### 3.1 razortusk — Gorging Razortusk (plains, summoner) — 2/6 killed

| Root | Outcome | Elapsed | Boss HP remaining | % removed | Crossed 50% | Min HP | Terminal HP (lag) | Max adds | Dmg from adds | Casts |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| striker | bot-died | 19,700 ms | 3127/4000 | 21.8% | — | 32.2 | 0 (death) | 2 | plains-slime 5 | 2× Rallying Cry |
| squire | bot-died | 27,900 ms | 2465/4000 | 38.4% | — | 11.2 | 0 (death) | 2 | plains-slime 17 | 3× Rallying Cry |
| apprentice | bot-died | 55,600 ms | 306/4000 | 92.4% | 25,100 ms | 34.0 | 0 (death) | 8 | plains-slime 33, boar 9.7 | 7× Rallying Cry |
| slinger | **boss-killed** | 49,900 ms | 0/4000 | 100% | 18,200 ms | 108.7 | 200.5 (900 ms) | 7 | plains-slime 4, boar 3 | 7× Rallying Cry |
| conduit | bot-died | 130,300 ms | 2545/4000 | 36.4% | — | 15.9 | 0 (death) | 7 | plains-slime 0 | 13× Rallying Cry |
| spirit | **boss-killed** | 62,000 ms | 0/4000 | 100% | 26,900 ms | 22.4 | 150.6 (0 ms) | 8 | plains-slime 9, boar 2 | 8× Rallying Cry |

All six deaths/kills carry `encounterResetEvidence`: "The guard reforms." on every death, absent
on every win, matching a clean pull-reset boundary. Adds damage (per §10 item 7, attributed
separately) stayed small relative to the boss's own output in every fight — the low-armor slinger
and spirit kills are not adds-driven.

### 3.2 juggernaut — Stoneplate Juggernaut (mountain, charge pattern) — 5/6 killed

| Root | Outcome | Elapsed | Boss HP remaining | % removed | Crossed 50% | Min HP | Terminal HP (lag) | Casts |
|---|---|---:|---:|---:|---:|---:|---:|---|
| striker | **boss-killed** | 179,200 ms | 0/5000 | 100% | 87,300 ms | 45.9 | 262.5 (200 ms) | 36× Stoneplate/Charge |
| squire | **boss-killed** | 95,100 ms | 0/5000 | 100% | 56,600 ms | 153.1 | 200.3 (100 ms) | 18× |
| apprentice | bot-died | 39,900 ms | 1728/5000 | 65.4% | 31,100 ms | 131.1 | 0 (death) | 8× |
| slinger | **boss-killed** | 77,800 ms | 0/5000 | 100% | 37,500 ms | 122.3 | 167.6 (800 ms) | 16× |
| conduit | **boss-killed** | 199,200 ms | 0/5000 | 100% | 99,100 ms | 62.4 | 221.9 (200 ms) | 40× |
| spirit | **boss-killed** | 59,200 ms | 0/5000 | 100% | 32,400 ms | 175.0 | 175.0 (200 ms) | 12× |

No adds on this boss (`maxAddsAlive: 0` throughout, consistent with §5's roster table). Striker
and conduit ran long (179 s / 199 s) but still finished well under the cap — attrition kills
against a hard-hitting charge pattern, not near-cap fights.

### 3.3 behemoth — Mire-Gorged Behemoth (swamp, ground pool) — 0/6 killed

| Root | Outcome | Elapsed | Boss HP remaining | % removed | Crossed 50% | Min HP | Casts |
|---|---|---:|---:|---:|---:|---:|---|
| striker | bot-died | 22,200 ms | 2466/3375 | 26.9% | — | 6.9 | 2× Corrosive Pool |
| squire | bot-died | 23,400 ms | 1945/3375 | 42.4% | — | 14.9 | 2× |
| apprentice | bot-died | 25,100 ms | 1344/3375 | 60.2% | 20,900 ms | 15.5 | 3× |
| slinger | bot-died | 21,600 ms | 1195/3375 | 64.6% | 15,500 ms | 17.6 | 2× |
| conduit | bot-died | 22,400 ms | 2086/3375 | 38.2% | — | 8.1 | 2× |
| spirit | bot-died | 23,800 ms | 805/3375 | 76.1% | 17,000 ms | 16.1 | 2× |

**Total wipe — all six references died, all within a tight 21.6–25.1 s window**, despite Behemoth
carrying the lowest raw attack (38) and lowest plating (6) of the six Boss2 bosses. Every death
shows the same shape: a low `castsStarted` count (2–3) alongside a fast, near-simultaneous kill.
Per the packet's measurement note, `hpLost` here is sampled from per-tick HP decreases because the
Corrosive Pool ground effect bypasses the `damageTaken` pipeline that `damageFromBoss` reflects —
the boss's own stat line does not fully explain the observed lethality, and that gap is exactly
what the packet says to report rather than silently attribute (§10, measurement note 1).

### 3.4 dreadbore — Chitinous Dreadbore (cave, burrow/conceal) — 0/6 killed

| Root | Outcome | Elapsed | Boss HP remaining | % removed | Crossed 50% | Min HP | Casts |
|---|---|---:|---:|---:|---:|---:|---|
| striker | bot-died | 43,400 ms | 3134/4375 | 28.4% | — | 29.9 | 15× Burrow/Burrowed/Eruption |
| squire | bot-died | 34,400 ms | 2330/4375 | 46.7% | — | 26.2 | 12× |
| apprentice | bot-died | 20,000 ms | 2752/4375 | 37.1% | — | 0 | 6× |
| slinger | bot-died | 34,200 ms | 1453/4375 | 66.8% | 26,700 ms | 59.6 | 12× |
| conduit | bot-died | 37,900 ms | 3344/4375 | 23.6% | — | 30.6 | 12× |
| spirit | bot-died | 38,200 ms | 988/4375 | 77.4% | 25,200 ms | 48.8 | 12× |

**Also a total wipe**, but attritional rather than fast — elapsed times spread 20.0–43.4 s and
HP-removed spreads 23.6%–77.4%, unlike Behemoth's tight cluster. Concealment (`isConcealed`) is
confirmed non-lethal-by-itself per `boss2Concealment.test.ts` (passed in qualification); the
burrow→emergence loop (cd 9 s, ×1.6) stacking against the 50% `empower-shred` plating-stack
threshold is the mechanical candidate worth inspecting, not the concealment window itself.

### 3.5 emperor — Dune Stalker Emperor (desert, speed empower) — 4/6 killed

| Root | Outcome | Elapsed | Boss HP remaining | % removed | Crossed 50% | Min HP | Terminal HP (lag) | Casts |
|---|---|---:|---:|---:|---:|---:|---:|---|
| striker | **boss-killed** | 120,700 ms | 0/3750 | 100% | 57,300 ms | 131.1 | 172.7 (700 ms) | 46× Death/Numbing Sting, Execution |
| squire | **boss-killed** | 57,600 ms | 0/3750 | 100% | 27,900 ms | 119.4 | 153.8 (600 ms) | 21× |
| apprentice | bot-died | 29,700 ms | 1185/3750 | 68.4% | 23,100 ms | 14.0 | 0 (death) | 9× |
| slinger | **boss-killed** | 38,600 ms | 0/3750 | 100% | 17,000 ms | 46.6 | 117.5 (600 ms) | 14× |
| conduit | bot-died | 65,500 ms | 326/3750 | 91.3% | 37,600 ms | 41.6 | 0 (death) | 24× |
| spirit | **boss-killed** | 39,100 ms | 0/3750 | 100% | 19,700 ms | 89.1 | 157.6 (100 ms) | 14× |

conduit's death at 91.3% removed is a near-clear, not a comfortable loss — closest of the two
deaths in this block. No adds on this boss.

### 3.6 gorger — Jungle Dread-Gorger (jungle, no `bossScript`, flee/stalk/ambush) — 5/6 killed

| Root | Outcome | Elapsed | Boss HP remaining | % removed | Crossed 50% | Min HP | Terminal HP (lag) | Casts |
|---|---|---:|---:|---:|---:|---:|---:|---|
| striker | **boss-killed** | 71,900 ms | 0/3625 | 100% | 34,600 ms | 97.2 | 167.0 (900 ms) | 9× Flee/Vanished/Ambush |
| squire | **boss-killed** | 53,800 ms | 0/3625 | 100% | 28,300 ms | 133.7 | 176.5 (800 ms) | 8× |
| apprentice | **boss-killed** | 41,100 ms | 0/3625 | 100% | 21,100 ms | 13.1 | 25.9 (100 ms) | 5× |
| slinger | **boss-killed** | 39,600 ms | 0/3625 | 100% | 17,800 ms | 57.5 | 57.5 (600 ms) | 5× |
| conduit | bot-died | 103,600 ms | 785/3625 | 78.3% | 73,800 ms | 17.5 | 0 (death) | 13× |
| spirit | **boss-killed** | 32,300 ms | 0/3625 | 100% | 17,900 ms | 108.8 | 155.6 (300 ms) | 2× |

`jungle-dread-gorger` has no `bossScript`; all casts shown come from `bossPattern` alone,
consistent with §5's note that a `bossScript`-only census would misread this boss as mechanic-free.
conduit's single death here was also the longest fight in the block (103.6 s) — an attrition loss,
not a fast one.

### 3.7 timberclaw (reused Boss1 observations, source `66d33d57`, seed `96011`) — 1/6 killed

Carried forward per packet §9, not re-run. Re-verified here (not re-cited blind) that every
root's `effectiveStats` in the stored `boss1/timberclaw` artifacts is byte-identical to its
Boss2 counterpart on all six roots — the portability claim these rows depend on.

| Root | Outcome | Elapsed | Boss HP remaining | % removed | Crossed 50% | Min HP | Terminal HP (lag) |
|---|---|---:|---:|---:|---:|---:|---:|
| striker | bot-died | 30,800 ms | 1835/3750 | 51.1% | 29,400 ms | 49.3 | 0 (death) |
| squire | bot-died | 29,300 ms | 1227/3750 | 67.3% | 24,300 ms | 33.7 | 0 (death) |
| apprentice | bot-died | 27,600 ms | 1270/3750 | 66.1% | 21,100 ms | 24.0 | 0 (death) |
| slinger | bot-died | 29,000 ms | 212/3750 | 94.3% | 15,000 ms | 0 | 0 (death) |
| conduit | bot-died | 49,300 ms | 1342/3750 | 64.2% | 42,200 ms | 21.1 | 0 (death) |
| spirit | **boss-killed** | 30,300 ms | 0/3750 | 100% | 16,100 ms | 57.5 | 57.5 (300 ms) |

---

## 4. Owner vs. summon damage (§10 item 8)

Conduit records `attackBeats: 0` in every one of its seven fights (six Boss2 + reused
Timberclaw), with `minionAttackBeats` nonzero and substantial in each (41–223) — `CannotAttack`
by design, per the packet. This is not treated as invalidating its evidence: conduit still has
two boss-killed results (juggernaut, at 199.2 s with 223 minion attack beats) alongside five
deaths.

## 5. Guardian/access

Unmeasured in all 36 new fights, confirmed directly against the artifacts:
`guardianAccess: "not-measured-guard-stripped"` in all 36 `ready.json` records, and
`hpTreatment: []` in all 36. Not pooled into any boss figure.

## 6. Raw-events vs. summary agreement

Spot-checked three fights end-to-end against raw `events.jsonl` (razortusk/striker death,
juggernaut/striker's 179 s win, gorger/conduit's 103.6 s death — a death, a long win, and a long
death). In all three, the terminal event (`player-death` or `kill`), its `dungeon-message` where
present, and the `summary.json` evidence field agree on actor, victim, damage, and timestamp
down to the millisecond. No disagreement found in the fights checked; this was a targeted
spot-check, not an exhaustive per-fight diff across all 36 records.

## 7. Portability re-verification

Independently checked (not just cited from the packet): for every root, the `effectiveStats`
block in `ready.json` is byte-identical across all six new blocks and identical to that root's
Boss1 Timberclaw cell. This directly supports treating the combined 42-row map as one player
constant varied only by which boss it faces.

---

## 8. Findings for command-center review

Per packet §11/§12, at most three, framed as prioritization signals, not causal verdicts.

1. **Behemoth and Dreadbore are both 0/6 — the only two total wipes in the screen — and they
   fail in opposite ways.** Behemoth kills fast and uniformly (21.6–25.1 s across all six roots,
   low `castsStarted`) despite having the lowest raw attack (38) and plating (6) of the six
   bosses; its ground-effect Corrosive Pool bypasses the `damageTaken` pipeline the boss's own
   stat line is judged by, so the boss's apparent mildness on paper does not match what killed
   the references. Dreadbore kills slowly and unevenly (20.0–43.4 s, 23.6%–77.4% HP removed) —
   an attrition profile, consistent with its burrow-emergence cadence (cd 9 s, ×1.6) compounding
   against its 50% `empower-shred` plating stack rather than a single spike. Both read as
   boss-concentrated failure (the strongest references elsewhere — spirit at 5/7, slinger at
   4/7 — died to both), which the packet's reading rule (§11) flags as an encounter-pressure
   question, not a root/build question.
2. **Apprentice and conduit are the two weakest roots across the full seven-boss map (1/7 each),
   against spirit's 5/7 and slinger's 4/7 on the identical portable kit.** Conduit's shortfall
   has a stated design explanation (`CannotAttack`, zero `attackBeats` in every fight — §10 item
   8) and is not itself a defect. Apprentice has no such explanation and dies even to bosses
   most other roots clear comfortably (juggernaut 4/5 non-apprentice kills, emperor 4/5) — this
   is the root/build-concentrated signal the packet's reading rule distinguishes from the boss
   question above, and is worth a reference-fit look independent of Behemoth/Dreadbore.
3. **Concealment alone does not predict outcome.** Dreadbore and Gorger both carry a conceal
   step (burrow / stalk-into-ambush) but sit at opposite ends of the roster (0/6 vs 5/6) — ruling
   out "has a conceal mechanic" as an explanatory variable on its own, and pointing at each
   boss's specific cadence math instead (consistent with finding 1's read on Dreadbore).

---

*No boss nerfs, player buffs, T3 Jungle changes, additional sweeps, live-server replay, automatic
follow-up experiments, commits, or pushes were made in the course of this execution.*
