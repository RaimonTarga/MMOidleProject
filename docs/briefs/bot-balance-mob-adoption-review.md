# Mob candidate adoption review — current source reconciliation

Date: 2026-09-18. Inspected revision: `7247b6e22993a896065c25ce458017948923f6d7`.

This is a **source and decision audit**, not authorization to change any value. Every number
below was read from the live databases and the overlay installers at the inspected revision,
not copied from a report's prose.

## Headline

**None of the retained mob candidates are live.** All 23 species checked are authored at
their pre-candidate base values. The entire T2–T4 durability campaign's retained
conclusions exist only as bench overlays in `server/bench/balance/durability*Spec.ts`. A
report saying a package was "retained" or "selected" means the planner kept it for adoption
review — it never reached `shared/src/data/monsters/`.

Two structural traps follow from that, and both are live risks for whoever applies these:

1. **The candidates are stacked, not independent.** Durability26, 27, 29 and 30 each install
   an earlier packet's overlay *first* and then modify it further. Reading a single report's
   "selected" number and writing it into a base stat will silently skip or double-apply a
   layer.
2. **Several packages preserve an ABSOLUTE defense budget by scaling the percentage
   inversely.** Adopting the HP without the matching ward/shield/self-shatter percentage is a
   materially different and much stronger monster.

## Overlay composition map

```
D22  base HP package, 14 species          (HP up, ward/shield/shatter % scaled DOWN inversely)
 ├─ D26  = D22(candidate) + one species HP x2 again, ward /2   (mountain: granite-mammoth;
 │                                                              desert: dune-basilisk)
 ├─ D30  = D22(candidate) + hadal-stalker HP 21000             [REJECTED — see below]
 └─ D29(T4) = D26(candidate) + attack x0.8 on four Mountain species
D27  mountain: attack x0.8 on three T2 species | desert: HP x1.75 on two controllers
 └─ D29(T2) = D27(candidate) + granite-titan attack x0.8 AGAIN
```

`granite-titan`'s retained attack of 54 is therefore `84 -> 67 -> 54`, two compounded 0.8
steps, while `stone-eagle` and `peak-archer` in the same block received only one. That
asymmetry is intentional — Durability29 tested a further Titan-specific cut — but it is
invisible from either report alone.

## Package ledger

### P1 — T4 HP package (Durability22 base layer)

Scope: 14 species across Trench, Mountain, Tundra and Desert. Provenance: Durability22,
retained through Durability25–30. Source: `DURABILITY22_HP` in `durability22Spec.ts`.

| Species | Live HP | Candidate HP | Defense coupling |
|---|---:|---:|---|
| elder-leviathan | 5880 | 17640 | — |
| abyssal-serpent | 4200 | 16800 | — |
| hadal-stalker | 2800 | 16800 | — |
| granite-mammoth | 1150 | 6900 | `lowHealthWard.wardPct` 0.25 → 0.04167 |
| cragback-rhino | 1100 | 6600 | — |
| avalanche-tyrant | 800 | 1600 | — |
| cliffside-roc | 850 | 1700 | — |
| permafrost-behemoth | 1914 | 7656 | — |
| glacial-direbear | 1221 | 4884 | `enemyShield.shieldPct` 0.22 scaled × 1221/4884 |
| rime-tusk-mastodon | 1100 | 3300 | — |
| hoarfrost-yeti | 900 | 1800 | — |
| sand-viper | 1343 | 4029 | — |
| dune-basilisk | 1501 | 4503 | — |
| dune-tyrant | 1738 | 6952 | — |

The installer also rescales every `monsterAbilities` `shield` action by `before/after`.
**Status:** selected, not applied. **Remaining gate:** command-center approval, then one
current-source regression. Adopting HP without the inverse defense scaling is a different
treatment from anything that was measured.

### P2 — T4 Mountain durability + pressure (Durability29, retained)

Composition: P1 → `granite-mammoth` HP ×2 and ward ÷2 → attack ×0.8 on four species.
Resolved against live source:

| Species | Live HP / attack | Candidate HP / attack | Ward |
|---|---|---|---|
| granite-mammoth | 1150 / 184 | **13800** / 147 | 0.25 → **0.02083** |
| cragback-rhino | 1100 / 113 | 6600 / 90 | — |
| cliffside-roc | 850 / 179 | 1700 / 143 | — |
| avalanche-tyrant | 800 / 145 | 1600 / 116 | — |

The mammoth's absolute ward is preserved exactly: `0.25 × 1150 = 287.5` and
`0.020833 × 13800 = 287.5`. **Anyone adopting 13800 must also write 0.0208, not 0.25.**
Evidence: deaths 4/36 → 1/36, minHP median 42.63 → 60.21, longer body timing retained.
**Status:** selected, not applied. **Remaining gate:** one Maestro death and sparse Slinger
timing remain; this is not universal safety.

### P3 — T2 Mountain attack relief (Durability27 + 29)

| Species | Live attack | Candidate attack | Steps |
|---|---:|---:|---|
| granite-titan | 84 | **54** | ×0.8 (D27) then ×0.8 (D29) |
| stone-eagle | 75 | 60 | ×0.8 (D27) |
| peak-archer | 90 | 72 | ×0.8 (D27) |

HP and `granite-titan`'s Granite Barrier (`wardPct` 0.25) are untouched.
**Status:** provisional. T2 deaths fell 10/36 → 5/36, but **Striker remained 3/6 in the
candidate arm.** See the open exception below.

### P4 — Desert controller durability (Durability27, retained)

| Species | Live HP | Candidate HP |
|---|---:|---:|
| sand-scorpion | 780 | 1365 |
| stone-basilisk | 780 | 1365 |

HP ×1.75 on the two controllers only; no attack or defense change. Retained together with a
**situational** Defensive Striker template — a survival/throughput tradeoff, explicitly not a
universal stance winner. **Status:** selected, not applied.

### P5 — Graveyard leader/escort redistribution (Durability24, retained)

Under **normal** targeting only. Focus Elites was measured and rejected (redistributed-normal
0/42 deaths vs redistributed-focus 12/42).

| Species | Live HP | Candidate HP | Direction |
|---|---:|---:|---|
| gravewright | 2851 | 5702 | leader doubled |
| bone-crawler | 2059 | 1235 | escort cut |
| plague-hound | 3168 | 1901 | escort cut |
| carrion-vulture | 2693 | 1616 | escort cut |
| plague-rat | 1584 | 950 | escort cut |

**Status:** selected, not applied. **Remaining gate:** approval; do not re-run universal
Focus Elites.

### P6 — Volcano anchors (Durability23, recommended)

| Species | Live HP | Candidate HP |
|---|---:|---:|
| obsidian-tortoise | 2244 | 4488 |
| magma-salamander | 2904 | 5808 |

Eligible representative body medians 9.88 s and 13.90 s. **Status:** recommended, not
applied.

### P7 — Trench configuration (Durability30, decided)

Keep the P1 values: `hadal-stalker` 16800, `elder-leviathan` 17640, `abyssal-serpent` 16800.
**The universal `hadal-stalker` 21000 increase was REJECTED** — it moves Slinger/Spirit toward
the 40–60 s guide but stretches already-long Squire/Conduit fights. 72/72 complete 600 s
windows with zero deaths is bounded survival evidence, not unlimited safety. **Status:**
decided; no further Trench scalar grid. The 40–60 s guide applies to the three Trench species
only and is not a universal T4 monster or boss target.

### P8 — Forest / Volcano directions (Durability19/20)

Retained numerical directions with pacing gaps explicit. **Status:** inconclusive at this
revision — the surviving reports record directions rather than one exact overlay table, and
no live Forest/Volcano species carries a candidate value. **Remaining gate:** resolve the
exact intended table from the Durability19/20 installers before proposing adoption; do not
reconstruct it from report prose.

## The mandatory T2 Mountain Striker disposition

**Disposition: unresolved evidence — not a functional defect, and not safe to call closed.**

What the record supports at this revision:

- P3 reduced T2 Mountain deaths 10/36 → 5/36 overall, but **Striker stayed at 3/6 in the
  candidate arm**. The relief helped other roots and did not help Striker.
- Durability28 measured both stances at T2 Mountain and found 3/12 deaths in **both**, so
  stance choice does not explain the Striker result.
- The ledger explicitly warns that Boulder terminal blows do not prove sole cause, and that
  Titan 54 "remains provisional".
- Durability29's Striker timing is **sparse** because the candidate deaths themselves remove
  timing samples. Fewer survivors means less duration evidence, which is survivor bias
  working against the very root in question.

What cannot be concluded: whether the residual concern is legal preparation (the T2 Striker
kit), encounter pressure (Titan + Boulder Thrower concurrency), a functional defect, or
simply unresolved attribution. The existing artifacts do not separate these.

**Proposal — deliberately NOT appended to the Durability32 packet.** If the command center
wants this closed, the smallest question is: *does the T2 Mountain Striker death rate come
from concurrent pressure or from a single terminal mechanic?* A minimal matrix is Striker
only, one T2 Mountain node, control vs P3 candidate, three fresh seeds, with per-death
attribution over the final 10 s (attacker identity, concurrent attacker count, and whether a
charged cast resolved) — 6 cells / 18 observations. That is a separate packet for
command-center review, not another broad Mountain grid.

## Application notes for whoever adopts these

1. Apply P1 **first**, then its dependents. Never apply P2 or P3 on top of already-adopted
   values without re-deriving from base.
2. Carry every defense coupling in the same edit: `lowHealthWard.wardPct`,
   `enemyShield.shieldPct`, `enemyShield.shatter.selfDamagePct`, and `shield` actions inside
   `monsterAbilities`.
3. `ready.json` HP values are **post-overlay runtime** values. Do not copy one into a base
   stat field.
4. Every installer asserts its baseline (`assert.equal(d.stats.hp, before, type+' baseline
   drift')`). Adopting a package into production will make its own bench overlay fail that
   assert — that is correct and expected, and the spec must be retired or rebased in the same
   change.
5. Adoption is a production data change and needs its own regression. None of the evidence
   above is live-play or economy evidence; all of it is synthetic and `economyEligible=false`.
