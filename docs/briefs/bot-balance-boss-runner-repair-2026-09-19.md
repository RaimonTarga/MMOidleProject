# Boss runner repair — a false victory, and what it cost

Date: 2026-09-19. Status: repair record. **No balance value changed. No cohort launched.**

---

## 1. The defect

`server/scripts/bossScreen.ts` treated the boss's **absence** from the node as proof of a kill,
forced terminal boss HP to zero, and tested that **before** it tested player death:

```ts
} else if (bossSeen) { bossHp = 0; killedAtMs = elapsed; outcome = 'boss-killed'; }
...
if (outcome === 'boss-killed') break;
if (bot.isDead || bot.hasHealth.hp <= 0) { outcome = 'bot-died'; break; }
```

`resetDungeon(..., reason: "node_wipe")` runs on a player wipe and, in the **same tick**, removes
the boss entity and respawns the guard (`server/src/systems/world/dungeons/dungeon.ts:96-107`).
Both fingerprints therefore appear together, and both appeared in case B.

## 2. Confirmed against the existing records

`bossref-timberclaw-b-legacy` was recorded as a **victory** while contradicting itself four ways:

| Recorded | Raw evidence |
|---|---|
| `outcome: boss-killed`, `bossKilled: true` | **zero `kill` events in the log** |
| `bossHpRemaining: 0`, 100% removed | `crossedHalfAtMs: null` — it never reached 50% |
| — | `player-death` at 12,900 ms, `cause.killer = apex-timberclaw`, melee, 15 damage |
| `minHpFraction: 0`, `hpLost: 230` (its whole pool) | the player was dead |
| `maxAddsAlive: 12` | Apex Timberclaw has **no `spawn-adds` and no `raisesDead`** |
| — | `dungeon-message: "The guard reforms."` at the same 12,900 ms |

Case A is genuine and unaffected: a `kill` event naming **Apex Timberclaw** as victim at
30,300 ms, killer the bot, no player death, `maxAddsAlive: 0`.

## 3. The repair

Terminal classification is now a pure, tested function, `server/bench/balance/bossTerminal.ts`:

- **A victory requires boss-specific authoritative evidence** — a kill event naming the boss as
  victim. Absence is never evidence of a kill.
- **Player death is evaluated alongside, not after**, and outranks anything inferred from the boss
  going missing. The wipe reset is a *consequence* of the death; reading it as a clear inverts
  cause and effect.
- **Simultaneous terminal events** get their own outcome (`simultaneous-terminal`) instead of
  resolving to whichever branch happened to be written first.
- **Disappearance without a kill** (`boss-vanished-no-kill`) and **encounter reset**
  (`encounter-reset`) are distinct, and neither is a win.
- **Terminal boss HP is preserved**, not fabricated: the last reading taken while the boss was
  genuinely present, with `terminalBossHpSupported` stating whether any reading exists. Zero is
  only ever asserted when a kill event supports it.
- **Post-terminal replacement guardians are excluded** from add statistics.

## 4. Verification strengthened

`scripts/boss-verify.mjs` is now shared by both run scripts, and a contradictory record fails the
batch instead of passing. Re-checking the **original** records against it surfaces every defect:

```
bossref-timberclaw-b-legacy: 4 contradictions
  - claims a victory with NO boss kill evidence
  - removed 100% of the boss but never crossed 50%
  - claims a victory with the player at 0 HP
  - 12 adds on a boss that summons nothing — post-terminal bodies leaked in
```

(Case A shows one flag, `claims a victory with NO boss kill evidence` — the legacy schema simply
had no evidence field. Its result is unaffected.)

**Regression fixtures** live in `server/test/bossTerminal.test.ts`, including the exact wipe shape.
Mutation-checked: reintroducing the original absence-means-killed ordering fails it with
`expected bot-died, got boss-killed`.

## 5. Corrected report — originals untouched

`server/scripts/bossReprocess.ts` re-reads a recording from its raw event log and writes a
**separate** corrected report. It imports the real classifier rather than mirroring it, so the
correction and the live runner cannot drift apart. The originals are evidence and were not
rewritten.

Corrected report: `…/validation/ttk-survey/boss-reference-corrected/corrected-report.json`

| Case | Outcome | Terminal boss HP | Max adds |
|---|---|---|---|
| A historical | `boss-killed` → **`boss-killed`** | 0 → **0** | 0 → **0** |
| B legacy | `boss-killed` → **`bot-died`** | 0 → **2620** | 12 → **0** |

## 6. End-to-end regression rerun — the same two cases only

Run at `e9dbdf56` into a new root (`boss-reference-r2`); the originals are untouched. **This is
repair evidence, not new balance evidence.**

| Case | Outcome | Kill evidence | Elapsed | Terminal boss HP | Removed | Adds | Min HP |
|---|---|---|---:|---:|---:|---:|---:|
| **A historical** | `boss-killed` | **yes**, victim Apex Timberclaw | 30,300 ms | 0 | 100% | 0 | 24.87% |
| **B legacy** | `bot-died` | none | 12,900 ms | **2,521** | 32.8% | 0 | 0% |

Timings are **identical to the original recording** (30,300 / 12,900), which is the point: the fix
changed the *interpretation*, not the simulation.

One honest discrepancy: the reprocessed terminal HP for B is **2620**, the live rerun **2521**. The
reprocessor reads the last `samples.jsonl` entry before the terminal tick (1 s granularity); the
runner tracks per tick (100 ms). Both are last-supported readings at different resolutions, and
neither is a fabricated zero.

## 7. Standing conclusion

**Case A is retained as the current Spirit/Timberclaw reference.** That is a usable reference for
*this boss and this build*. It is not universal harness correctness and it is not a boss balance
result. A won and B lost, so the explanation stops at **package level** — no component-removal
experiments were run and none are proposed.
