# Boss1 operator packet — the first boss numerical screen

Prepared 2026-09-18. **FROZEN.** One boss, six tier-legal roots, two declared seeds:
**12 attempts**. It installs nothing.

Operator: run the specified committed source and stop on drift. Do not choose staged content,
do not commit adoption changes, do not invent a revision, do not treat silence as permission.
Your endpoint is the factual report. No production tuning, commits, pushes or extra experiments.

---

## 1. Why this screen is one boss, not two

The [starter packet](bot-balance-boss-numerical-starter-packet.md) proposed an earlier/later-tier
pair: `apex-timberclaw` (T2 forest) and `charnel-crown-sovereign` (T4 graveyard). The earlier slot
was **withdrawn on evidence**, not preference.

Measured at `bdee5dca` on 2026-09-18:

| Scope | Result |
|---|---|
| All 7 T2 bosses, 6 roots × 3 builds, 300 s cap | **0 wins / 126** |
| `apex-timberclaw` among them | Among the **cheapest** — 5.17 cost bars, 48.4 s ttk, 2nd easiest of 7 |
| All 7 T3 bosses | Ragged: 0/54 (swamp, 99% attrition) to 37/54 (jungle) |
| T4 Sovereign, tier-legal builds + full rune loadout | **12 wins / 12**, 36–104 s |

With T1 already on record at 0/30, early-tier bosses are unbeatable by the reference player while
the final-tier boss is comfortable. An earlier-tier slot would therefore re-measure a known wall —
precisely the stale-band error the starter packet warns against. **That wall is now its own main
workstream and is NOT this screen's question.** Full evidence:
[the D37 decision note](bot-balance-d37-decision-and-boss-screen-blocker-2026-09-18.md) §5.

The Sovereign is retained because it is the case the screen exists to test: it summons three
ordinary species the mob adoption changed, so it is exactly the "boss reuses changed ordinary
mobs" receipt question.

---

## 2. Frozen identity

| Item | Value |
|---|---|
| Harness commit | `dd8cae23e47a047b45a148b5bdc8dabf32fce21f` (tree `8589bd2543ff6a678435e25a9c7d7d96d15eb521`) |
| **Definitions hash** | **`17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f`** |
| **Hitbox hash** | **`08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`** |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Trial / block | `boss1` / `sovereign` |
| Boss | `charnel-crown-sovereign` — Charnel-Crown Sovereign, T4 graveyard |
| Node | `node-t4-graveyard-dungeon` (Crownbone Sepulcher) |
| Seeds | `94011`, `94019` |
| Per-fight cap | 600,000 ms |
| Output root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss1` |
| Preflight root | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss1-preflight` |

**Nothing here is a launch-time placeholder.** The two hashes that determine the simulation are
frozen above and are machine-checked. The revision and tree are resolved **mechanically**, not
chosen: this packet is a docs-only commit on top of `dd8cae23`, so run from the branch tip with

```bash
git rev-parse HEAD          # -> pass as --revision
git rev-parse HEAD^{tree}   # -> pass as --tree
```

`scripts/boss1-run.mjs` then asserts, before creating any output, that `HEAD` equals `--revision`,
that `git status --porcelain --untracked-files=no` is empty, that the tree hash matches, and that
the hitbox file hashes to the frozen value. Verification additionally asserts the manifest's
definitions hash equals the frozen `17aa46cb…`. **A docs-only delta cannot change that hash; if it
has changed, the source is not what this packet froze and the run is refused.** Stop and report.

---

## 3. The encounter, and why the harness had to change

`--mode boss` thaws a dungeon node and fights whatever stands in it. An idle dungeon node holds
only its **guard**; the boss is spawned by `activateDungeonAltar` plus a wake-up delay, and a bench
bot never touches the altar. **Every "boss" row that mode ever printed is a guard row.**

`bench/bossExam.ts` fixes that — it strips the guard and forces the boss awake — but cannot carry a
frozen packet, for three reasons found during preparation:

1. **It consumes no seed.** A declared seed list would be fiction. (Worse for a no-add boss: two
   seeds against `apex-timberclaw` produce *byte-identical* outcomes, because it has no adds, a
   fixed spawn, and evasion is deterministic here.)
2. **It emits no per-observation receipt**, so §5's escort rule cannot be satisfied at all.
3. **Its bot is built by `materializeBot` alone**, leaving `runesEquipped: []` — no telegraph
   step-back, no hazard avoidance, no regen waiting, no orbit — while every mob survey uses
   `prepareSurveyBot`, which equips and legality-validates all five. The two harnesses were not
   measuring the same player.

`server/scripts/bossScreen.ts` takes `bossExam`'s encounter setup and the survey's preparation,
seeding and receipts, so a boss row is readable against a mob row.

**Seeds are real for this boss**: `raisesDead` corpse selection and `spawn-adds` offsets consume
randomness, and the two seeds moved elapsed time and damage taken in preparation.

**Guardian/access is NOT measured.** The guard is stripped by design. The manifest records
`guardianAccess: "not-measured-guard-stripped"`, and access must never be pooled into a boss figure
— that pooling is what produced the stale T1 band.

---

## 4. The cohort — 6 cells × 2 seeds

Six roots, one cell each, reusing the **qualified** Durability37 T4 graveyard builds verbatim
(`NIGHT5_BLOCKS.t4a`, the `-03` set) and re-pointing them at the dungeon node. Reuse is the point:
the boss is then measured against the same tier-legal preparation as the ordinary Graveyard T4
family in D37 Block I, which shares its escorts.

| Cell | Root | Skill path | Weapon |
|---|---|---|---|
| `boss1-sovereign-striker` | striker | `cadence-root / balanced / range-close / balanced-t3-a` | `volcanic-eruption-lash` |
| `boss1-sovereign-squire` | squire | `cooldown-root / balanced / range-close / balanced-t3-a` | `mountain-warmaul` |
| `boss1-sovereign-apprentice` | apprentice | `dot-root / balanced / range-mid / balanced-t3-a` | `graveyard-plague-axe` |
| `boss1-sovereign-slinger` | slinger | `reload-root / balanced / range-mid / balanced-t3-a` | `jungle-deathfang-rapier` |
| `boss1-sovereign-conduit` | conduit | `summoner-root / balanced / range-mid / balanced-t3-a` | `jungle-deathfang-rapier` |
| `boss1-sovereign-spirit` | spirit | `energy-root / balanced / range-mid / balanced-t3-a` | `volcanic-eruption-lash` |

Shared: armor `graveyard-vest-t4`, recovery `graveyard-charm-t4`, mobility `mountain-boots-t4`,
core `core-tempered`, relic `relic-colossus-heart`, upgrades +5, stance `offensive-stance`,
techniques `frenzy` + `sweep`, guards `second-wind` + `cleanse`, and the five-rune survey loadout.

Legality is enforced twice: `prepareSurveyBot` asserts biome-level, global-upgrade and
biome-upgrade gates and runs `validateBuild`; `server/test/boss1Matrix.test.ts` asserts no item
exceeds tier 4 and that each build still matches its qualified T4 origin.

**Gear biome is a declared parameter, not a finding.** All six sit in the graveyard T4 set — the
boss's own biome. That is consistent with D37's Graveyard family and makes the two readable
together, but it means this screen **cannot** rank armour families, and no cross-boss comparison
follows from it.

Two seeds is a **screen**. It cannot rank classes and it is not certification.

---

## 5. The receipt rule — load-bearing

The Sovereign summons three ordinary species the adoption changed:

| Escort | Adopted HP | Attack | Was |
|---|---:|---:|---:|
| `bone-crawler` | 1235 | 85 | 2059 |
| `plague-hound` | 1901 | 105 | 3168 |
| `carrion-vulture` | 1616 | 95 | 2693 |

Every `ready.json` records these alongside the boss's own authored and runtime stats. **If a
runtime escort disagrees with the declared adoption value, the run is INVALID and is not
reinterpreted.** `boss1-run.mjs` asserts this per observation; it is not left to the report writer.

---

## 6. Endpoint and cap, resolved from the script

Resolved from the Sovereign's own mechanic loop, not inherited from a mob window:

- **Phase at 100% HP** — `spawn-adds`: 3 `bone-crawler`, 1 `plague-hound`, 1 `carrion-vulture`
  (`maxAlive` 5, `offsetRange` 260).
- **Phase at 50% HP** — *Mass Resurrection*, 1800 ms cast, `raise-dead` ×3, `maxAliveAdd` 2.
- **Passive `raisesDead`** — every 8000 ms after a 5000 ms delay, 1300 ms cast, `corpseRange` 520,
  `maxAlive` 4, `hpMult` 0.75, `damageMult` 0.8.
- Boss block: 19,499 HP, 115 attack, plating 14, dr 0.08. `targeting.prefersPlayers`.

A full cycle requires crossing 50% of a 19,499 pool. Full kills measured **36–104 s** in
preparation, so the **600 s cap** clears the whole cycle with large margin: a timeout genuinely
means "could not finish", never "was cut off mid-phase". `boss1Matrix.test.ts` asserts the 50%
phase still exists, because the cap is meaningless without it.

No retries, no extensions, no adaptive change mid-run. A death is terminal and is reported with the
phase it happened in.

---

## 7. Commands

Qualification at the frozen source, before anything else:

```bash
pnpm typecheck
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss1Matrix.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/mobAdoptionIntegration.test.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development test/durability37Matrix.test.ts
```

Preflight (qualify + pilot, separate root, pilot data kept separate):

```bash
node scripts/boss1-preflight.mjs \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss1-preflight" \
  "C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json"
```

The run:

```bash
node scripts/boss1-run.mjs \
  --out="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/boss1" \
  --revision="$(git rev-parse HEAD)" \
  --tree="$(git rev-parse HEAD^{tree})" \
  --definitions="17aa46cb9002677f634a5933e0f83850761c9e8a2c842a5f7033202b8f629d8f" \
  --hitboxes="C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json" \
  --hitbox-hash="08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83"
```

### Smoke-test receipts from preparation

Preflight green at `305f39eedd6855d07259af6fb6497b85a709df56` — the commit that introduces this
packet — with the manifest's definitions hash reading back the frozen `17aa46cb…`:

- `sovereign qualify ok` — 6 ready receipts, all six roots legally prepared, boss awake in each,
  `hpTreatment` empty, all three escorts at adopted values.
- `sovereign pilot ok` — `boss1-sovereign-striker` seed 94011: **boss-killed at 37.6 s**, 100% HP
  removed, **50% crossed at 24.2 s**, casts `Raise Dead` / `Necrotic Screech` / **`Mass
  Resurrection`**, max 5 adds alive, damage from boss 735.2 versus adds `carrion-vulture` 523.2,
  `plague-hound` 216.7, `bone-crawler` 187.2, `Risen Bone Crawler` 14, `Risen Plague Hound` 2.

That pilot is the proof the **real encounter** runs and produces the report outputs — not a
measurement. Preparation figures are not results.

---

## 8. What the report must separate

1. **Terminal outcome first** — killed / died / capped / invalid — before any other number.
2. **Guardian/access** is unmeasured here and must be stated as such, never pooled in.
3. **Per-phase** evidence: `crossedHalfAtMs`, cast labels, max adds alive. Not one pooled figure.
4. **Add pressure attributed to the adds**, never folded into the boss's own output. Risen variants
   keep their own keys; they are genuinely different bodies (`hpMult` 0.75, `damageMult` 0.8).
5. **Owner vs. summon** damage: Conduit records zero `attackBeats` by design (`CannotAttack`). Do
   not use that to invalidate its evidence.
6. **Unmeasured stated as unmeasured.** Zero casts does not mean zero mechanics — ramps, cadence
   finishers, openings and venom emit no cast events, so an absent cast counter is inapplicable
   evidence, not a demonstrated failure.

Two measurement properties to carry, not restate as findings:

- **HP lost is sampled as per-tick HP decreases**, not the pipeline's `damageTaken`. Monster DoT,
  ground pools and AoE splash bypass that pipeline. Both are recorded so the gap is visible.
- **No `ttk` is extrapolated.** Extrapolation assumes constant player DPS and is optimistic against
  a boss that hardens late — which is exactly what Mass Resurrection does. A boss that is not
  killed reports its outcome and the HP fraction actually removed.

---

## 9. What this packet does not do

- No reward edits, no ECON-1 measurement, no earned-progression or x1-pacing claim. Synthetic
  evidence only (`synthetic=true`, `economyEligible=false`).
- No boss balance change. It reports; the command center decides.
- No mob TTK bands and no Trench mini-boss guide applied to a boss. A boss is a different
  encounter shape.
- No exhaustive equipment/stance cross-product, no full cohort, no automatic retry or adaptation.
- **It does not answer the early-tier boss wall**, and nothing here should be read as bearing on it.
