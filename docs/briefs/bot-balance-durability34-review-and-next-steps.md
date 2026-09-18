# Durability34 review, corrected from raw artifacts — and the Durability35 assignment

Date: 2026-09-18. Execution snapshot `4c926e0e`, tree `77d0c604`. Corrections made at the
current working revision.

Status: **Command-center review, reprocessed from the sealed raw artifacts. D34 was not rerun.
No cohort launched and no production value adopted by this document.**

Derived audits are written to `AppData/Local/mmo-idle/audits/durability34-20260918/`; the sealed
tree was read, never modified. Reproduce with `scripts/survey-audit.mjs`,
`scripts/charged-cast-audit.mjs` (schema 3), `scripts/species-timing-audit.mjs` (schema 2) and
the new `scripts/guard-window-audit.mjs`.

## 1. Decisions carried out

**T1 Mountain moves to a local enemy-pressure trial.** Second Wind stays the reference guard.
The Brace substitution is not adopted and no search for a better Brace context follows.

**Jungle retains Apex Silverback 2900 and Emerald Constrictor 3400** as the first-pass package,
added to the adoption manifest with cross-tier timing explicitly unverified.

**Navigation stays closed.** 123 escape attempts, 123 successes, no deaths or cutoffs in Jungle,
watch clean. No new navigation cohort.

## 2. The tooling bug was mine, and it is fixed

The report is right that the audits mishandled D34's arms, and the cause is worth recording:
`charged-cast-audit` inferred the arm from an id suffix and knew only `control`/`candidate`, so
`reference`/`substitution` silently became one `n/a` group; `species-timing-audit` never split
by arm at all.

Both now read arm and pairing metadata from the **block manifest**, pair on
`(class, node, seed)` so the logic does not depend on naming, and **throw** on an observation
whose cell is undeclared or carries no treatment. No permissive suffix guessing was added.

The arm-split immediately exposed a second schema-1 fault: runtime `maxHp` was being overwritten
by whichever observation was read last. Recorded per arm, it has two values per species —
`emerald-constrictor` 1700/2040 control and 3400/4080 candidate — because node modifiers scale
it. Authored HP and post-modifier runtime HP are now distinct in the output.

`durability35-preflight.mjs` checks the derived reports **semantically**: both arms resolved,
four joint outcome categories present, paired contrasts computable. Exiting zero is no longer
sufficient.

## 3. The unsupported T3 comparison

The report calls 2.90 s "the measured T3 `silverback` anchor". It is not:

- **2.90 s** was the **T4 `apex-silverback`** clean-TTK baseline measured in Durability33.
- The T3 citation in the D34 packet was **authored HP 2090 / attack 83** — a stat, not a timing.

Neither D33 nor D34 contains a T3 block. There is no measured T3 TTK anywhere in this campaign.
Roughly doubled TTK was an arithmetic prediction of the HP doubling, so treating it as an
acceptance target is circular. **Cross-tier pacing is not closed.** Before Jungle's ladder can
be called complete, compare compatible existing T2/T3 role-timing evidence against T4; where it
is absent, name the limited check and fold it into the consolidated regression rather than
commissioning a blanket tier survey.

## 4. Jungle, recomputed per arm

| Species | Authored HP → | Runtime HP seen | Clean TTK control → candidate | Engaged | Unresolved |
|---|---|---|---|---:|---:|
| `emerald-constrictor` | 1700 → 3400 | 1700/2040 → 3400/4080 | **3.27 s → 6.50 s** | 510 → 389 | 7 → 11 |
| `apex-silverback` | 1450 → 2900 | 1450/1740 → 2900/3480 | **2.85 s → 5.95 s** | 549 → 446 | 5 → 9 |
| `thornback-lizard` | unchanged | 1000/1200 | 1.90 s → 1.90 s | 550 → 407 | 4 → 4 |
| `hunting-panther` | unchanged | 950/1140 | 1.85 s → 1.80 s | 496 → 383 | 5 → 4 |

Durable/fast role separation improves and the fast bodies are genuinely untouched. Both arms
completed 36 full five-minute observations with zero deaths.

**Apex ramp exposure — confirmed from existing evidence, no new instrumentation.**
`rampOnCombat` with `stat: 'attack'` mutates `dealsDamage.attack` directly in `tickCombatRamp`
and emits **no buff event**, so absent buff events never established a broken ramp. Apex gross
damage climbs the authored 3%-per-second ladder (77, 79, 82, 84, 86, 89, 91, 93, 95, 98 …), and
the longer body develops it further: ramped share **81.9% → 91.7%**, p90 gross **124 → 137**.
The median is unchanged at 108, so it is the tail that extends, not the centre.

Constrictor Root applications 15 → 74 and Venom 354 → 535 are **application counts**, not counts
of distinct enemies showing a mechanic.

Kills fell 2084 → 1597 at equal simulated exposure, a 23.37% drop. That is **kill throughput**,
not credited XP, essence or catalyst throughput. It motivates ECON-1; it does not settle it, and
it is not a reason to roll back longer combat.

## 5. Mountain: the guard is fine, the pressure is not

Four paired joint outcomes over 18 pairs, computed from the manifest-declared arms:

| Joint outcome | Pairs |
|---|---:|
| both survived | 3 |
| both died | 11 |
| reference died / substitution survived | 1 |
| reference survived / substitution died | **3** |

Totals are 12/18 deaths with Second Wind and 14/18 with Brace, with Striker, Squire and
Apprentice dying in all three seeds in **both** arms. Exposure was not equal — **2461 alive
seconds** in the reference arm against **1999** in the substitution arm — so run counts alone
never implied equal opportunity. The reported 19.9 s and 26.75 s medians are conditional on
dying and are not a paired estimate of survival gained.

**Brace does exactly what it is authored to do.** Matched same-state hits landing inside a Brace
window take **0.648×** — its 35% damage reduction, measured, not assumed. But:

| Measure | Value |
|---|---|
| Activations | **38** (30 with a recorded expiry, **8 truncated** by death or end of recording) |
| Activations per alive minute | 1.14 |
| Share of alive time under Brace | **5.07%** |
| Hits landing inside a window | **14 of 147** |

A 3 s window on a 10 s cooldown, triggered under 50% HP, covers about a twentieth of the fight.
It cannot offset losing Second Wind's sustain. **The encounter pressure is what fails, not the
guard choice** — which is why the next trial moves to the enemy side. Damage is now split by
defense state rather than pooled, because with a defensive treatment identical monster
coefficients do not imply identical final HP damage.

**Not every root directly attacks.** Conduit logged **0 owner attack beats in all six** Block M
runs while dealing 272–482 minion beats, and died once. That is the summoner archetype working
as designed (`CannotAttack`; Champion is the one specialization restoring a direct attack), not
an exposure artifact. Final-blow attribution stays separate from the fatal sequence: 16 Strong
Kick terminal blows do not make Power Shot or ordinary attacks unimportant.

## 6. Durability35 — one local pressure package, 72 observations

Frozen packet: [bot-balance-durability35-operator-packet.md](bot-balance-durability35-operator-packet.md).

Six roots × two T1 Mountain nodes × control/candidate × three declared seeds.

**Candidate:** base attack **50 → 40** (−20%) on **both** `ridge-archer` and `cliff-hopper`.
Resolved from frozen source, not assumed. This is a deliberate two-species **package** effect;
it does not try to isolate either species' contribution.

Held fixed: HP, charged multipliers (**Power Shot stays 2.2 in both arms**; 1.8 is not
installed), wind-ups, cooldowns, range, movement, ecology, density, node modifiers, rewards, the
+3 entry kit, mastery/RP, Sweep, **Second Wind**, and ordinary rune automation. No other biome
or tier is touched.

**Attack-derived special damage was verified through the real pipeline, not assumed.** In the
qualification pilot: Strong Kick hp 65 → 55 and gross 55 → 44; Power Shot hp 69 → 57.5 and gross
52.5 → 42. Note both fall by less than 20% in final HP — a 20% authored cut is not a promise of
20% less damage after plating, caps, guards and rounding.

Contexts are `node-t1-mountain-01` (**heavy**, the problematic entry node) and
`node-t1-mountain-02` (**swarming**), so a nerf that makes a different context disproportionately
easy is visible rather than hidden. The basic-hit gross confirms both contexts respond: 55 → 44
on heavy, 50 → 40 on swarming.

## 7. Ledger items kept

- Order: mobs → bosses → coordinated items/abilities → classes → focused integrated checks.
  Finite first passes, not exhaustive parity.
- Existing manual boss-mechanic playtests are reused, not repeated as discovery.
- **ECON-1** remains a named gate, unestablished: compare the **same** higher-tier character at
  x1 in current-tier and accessible lower-tier locations, on credited biome XP, useful essence,
  catalysts, caps and recovery/death costs over elapsed gameplay time. D34's throughput change
  motivates the check and does not settle it.
- No reward retuning in a durability trial, no automatic reward multiplier matching an HP
  multiplier, and no rollback of longer combat merely to preserve kills per minute.

## 8. What is closed, and what is not

**Closed:** navigation; the D34 arm-handling bug; the guard question at T1 Mountain (Brace works
and is too small); Jungle role separation within T4; apex ramp exposure.

**Not closed:** whether the attack package fixes T1 Mountain entry (Block 35); Jungle's
cross-tier ladder, which has no measured T3 evidence; the 1.8 Power Shot candidate, parked;
every retained mob package, still `selected` and not applied; T2 Mountain Striker; ECON-1.

**Full experiment not launched.**
