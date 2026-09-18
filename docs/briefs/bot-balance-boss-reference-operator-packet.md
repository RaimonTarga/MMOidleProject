# Boss reference operator packet — two cases, one boss

Prepared 2026-09-19. **FROZEN.** One boss, one skill path, one declared seed, **2 fights**.
It installs nothing and changes no balance value.

Operator: run the specified committed source and stop on drift. Do not choose staged content, do
not commit changes, do not invent a revision, do not treat silence as permission. **Do not launch
the Boss1 cohort and do not start the live-server replay.** Your endpoint is the factual report.

---

## 1. The question

Narrow, and **not** about boss balance: *does the current boss runner reproduce a boss clear that
actually happened, when it is given the package that achieved it?*

On 2026-09-13, at revision `61080e54`, the V1i Spirit route beat **Apex Timberclaw 2/2** on the
live bot harness, player HP never below 41.9% of a 231 pool, boss phase 25.0–27.0 s. The boss and
its script are **byte-identical at HEAD** and it summons nothing. Against that, `bench/bossExam.ts`
reported 0 wins in 126 fights at content tier 2. **Those two statements are about different
packages, not different bosses.**

So both cases here run the same boss, the same encounter initialization, the same declared seed and
the same 300 s cap, and differ only in the **complete package**.

---

## 2. Frozen identity

| Item | Value |
|---|---|
| Harness commit | `28feeea052990f58f955d0a1b8b958f0c9c427e0` (tree `398e60633b52934a0b946c24af809991abbdf094`) |
| **Definitions hash** | **`17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f`** |
| **Hitbox hash** | **`08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`** |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Trial / block | `bossref` / `reference` |
| Boss | `apex-timberclaw` — Apex Timberclaw, T2 forest, 3750 HP / 44 attack |
| Node | `node-t2-forest-dungeon` (Timberclaw Hold) |
| Skill path | `energy-root` → `energy-heavy` (the recovered V1i Spirit frame), **both cases** |
| Declared seed | `96011` — **one** |
| Cap | 300,000 ms |
| Output root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss-reference` |
| Preflight root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss-reference-preflight` |

**No launch-time placeholders.** The two hashes that determine the simulation are frozen and
machine-checked. Revision and tree are resolved **mechanically** from the branch tip — this packet
is a docs-only commit on top of `28feeea0`, so the definitions hash cannot have moved:

```bash
git rev-parse HEAD          # -> --revision
git rev-parse HEAD^{tree}   # -> --tree
```

`scripts/boss-reference-run.mjs` asserts, before creating any output, that `HEAD` equals
`--revision`, that the tree is clean, that the tree hash matches, and that the hitbox file hashes to
the frozen value; verification then asserts the manifest's definitions hash equals the frozen one.
If it has changed, the source is not what this packet froze — **stop and report**.

### One seed, deliberately

Apex Timberclaw has **no adds**, a fixed spawn, and evasion is deterministic in this codebase. Two
seeds against it were measured producing byte-identical outcomes. A second seed would add a fight
and no information.

---

## 3. The two cases

Both: Spirit / `energy-root` / `energy-heavy`, +5 on every upgradeable item, no rites.

| | **A — historical success** | **B — legacy benchmark** |
|---|---|---|
| Cell | `bossref-timberclaw-a-historical` | `bossref-timberclaw-b-legacy` |
| Weapon | `ruinous-axe` | `gale-needle` |
| Armor / recovery / mobility | `cave-vest-t2` / `mountain-charm-t2` / `plains-boots-t2` | `forest-vest-t2` / `forest-charm-t2` / `forest-boots-t2` |
| Core | `core-tempered` | `core-tempered` |
| Stance | `defensive-stance` | `offensive-stance` |
| Techniques | `expose-weakness` | `charge`, `contagion`, `hamstring` |
| Guards | `second-wind`, `brace` | `bramble-guard`, `endure`, `cleanse` |
| Rune rules | 5 (`auto-path-enemy`, `inside-telegraph→step-back`, `in-combat→orbit`, `avoid-hazards`, `wait-for-regen`) | **0** |
| **RP** | **28 / 30** | **30 / 30** |

Case A is recovered from `bot/src/routes/campaignT2Boss.ts`
(`spirit-campaign-forest-ruinous-axe-t2`) and the V1i report's Phase C. Case B is asserted against
its **live** sources at load — `resolveGearLoadout` for the gear, `canonicalLoadout(2)` for the
abilities, `CANONICAL_STANCE_ID` for the stance — so it stays the real legacy package rather than a
remembered copy.

### These are complete packages and are never mixed

Rules, abilities and the stance all draw on **one** RP budget. Lifting a component out of one
package and into the other is not a smaller experiment, it is an illegal loadout: B's ability and
stance set already spends the whole 30, so adding A's five rules costs **39 against a 30 budget**.
`server/test/bossReferenceMatrix.test.ts` asserts that hybrid stays illegal, so it cannot be made to
fit by quietly changing another input. **The four component-removal arms are deliberately not
built.**

---

## 4. Setup recorded at qualification

Measured at `28feeea0`, zero fights spent. Both cases meet the same boss at 3750 HP / 44 attack with
**zero** non-boss bodies in the arena.

| | A — historical | B — legacy |
|---|---:|---:|
| maxHp | **231** | 230 |
| attack | **100** | 36 |
| plating | 18 | 10 |
| damageReduction | 0.19 | 0.02 |
| dodgeRate | 0.000 | 0.300 |
| recovery | 13 | 18 |
| finalDamageDealtMult | 0.952 | 1.288 |
| finalDamageTakenMult | 0.900 | 1.100 |
| barrier | **129 / 129** | 69 / 69 |

Case A's 231 pool matches the V1i report exactly, which corroborates the reproduction. These are
**setup facts recorded before execution**, not results, and no conclusion is drawn from them here.

Every fight's `ready.json` records: the **declared** package, the **applied** package read back off
the entity, RP cost against budget, effective stats, resources, boss authored and runtime identity,
and the encounter setup. A divergence between declared and applied means the run was not the package
this packet names.

---

## 5. Commands

Qualification at the frozen source:

```bash
pnpm typecheck
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/bossReferenceMatrix.test.ts
```

Preflight — **qualify only, zero fights**:

```bash
node scripts/boss-reference-preflight.mjs \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss-reference-preflight" \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json"
```

The run — **two fights, nothing else**:

```bash
node scripts/boss-reference-run.mjs \
  --out="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss-reference" \
  --revision="$(git rev-parse HEAD)" \
  --tree="$(git rev-parse HEAD^{tree})" \
  --definitions="17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f" \
  --hitboxes="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" \
  --hitbox-hash="08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83"
```

Durable per-fight records land at `<out>/reference/<cell>-s96011/` as `ready.json`,
`events.jsonl`, `samples.jsonl`, `summary.json`, plus block `manifest.json`, `index.json`,
`complete.json`, `verification.json` and a batch `operator-ledger.jsonl`.

---

## 6. What the report must carry

1. **Terminal outcome first** for each case — `boss-killed` / `bot-died` / `capped` — before any
   other number.
2. Elapsed, boss HP fraction removed, `minHpFraction`, peak 1 s burst, HP lost.
3. **Declared vs applied package** for both cases, and the RP cost against budget.
4. Phase evidence: cast labels, and whether the 50% enrage was reached.
5. Owner vs summon beats (Spirit records owner beats; this is not a summoner).
6. **Unmeasured stated as unmeasured.** Guardian access is not measured here — the guard is
   stripped by design, and the manifest says so. It must never be pooled into a boss figure.

Two measurement properties to carry, not restate as findings: HP lost is sampled as per-tick HP
**decreases**, so DoT, pools and splash are included; and **no `ttk` is extrapolated** — a boss that
is not killed reports its outcome and the fraction actually removed.

---

## 7. Interpretation — bounded in advance

- **A wins** → a **usable current reference for this boss and this build**. That is all. It is not
  universal harness correctness and it is not a boss balance result.
- **A wins and B loses** → stop at the **package-level** explanation. Individual cause ranking is
  not required and is not this check's job.
- **A loses** → return the **concrete discrepancy from that attempt** — declared vs applied package,
  effective stats, encounter setup, where the fight diverged from the V1i record — **before** any
  additional work is proposed.

No nerfs. No balance numbers are requested from the user on the strength of this check. The main
milestone remains **resuming the earlier/later boss numerical screen**; the mob campaign is closed
and is not reopened.
