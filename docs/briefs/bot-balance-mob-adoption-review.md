# Mob candidate adoption review — current source reconciliation

Date: 2026-09-18. Inspected revision: `7247b6e22993a896065c25ce458017948923f6d7`.
Revised 2026-09-18 after command-center review: Forest/Volcano resolved, the later Desert
selection carried, defence coupling given exactly, the T2 Striker summary corrected, and the
species count recomputed. Corrections are marked **[corrected]**.

This is a **source and decision audit**, not authorization to change any value. Every number
below was read from the live databases and the overlay installers at the inspected revision,
not copied from a report's prose.

## Headline

**None of the retained mob candidates are live.** All **30** species named by the retained
packages are authored at their pre-candidate base values **[corrected: the earlier "23" was
the size of this document's spot-check list, not the manifest]**.

This is a statement about the packages *pending adoption*, and must not be generalized into
"the campaign never changed anything". Earlier campaign decisions were applied in their own
commits and are part of the current authored baseline; what follows is the queue that was
retained for review and never applied. The entire T2–T4 durability campaign's retained
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
| granite-mammoth | 1150 | 6900 | `lowHealthWard.wardPct` 0.25 → exactly `0.25 * 1150 / 6900` |
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
| granite-mammoth | 1150 / 184 | **13800** / 147 | 0.25 → exactly **1/48** |
| cragback-rhino | 1100 / 113 | 6600 / 90 | — |
| cliffside-roc | 850 / 179 | 1700 / 143 | — |
| avalanche-tyrant | 800 / 145 | 1600 / 116 | — |

**[corrected] The mammoth's ward must be authored as the exact ratio, not a rounded display
value.** Preserving `0.25 × 1150 = 287.5` at 13800 HP requires `0.25 * 1150 / 13800`, which is
exactly **1/48 = 0.0208333…**. Writing the rounded `0.0208` yields `287.04`, a 0.46 shortfall
before any node modifier or runtime rounding. Author the exact expression or carry enough
precision to match the installer, and assert the resulting runtime capacity at the modifiers
that matter. Do not author an approximate number while claiming exact preservation.

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
**Status:** provisional. T2 deaths fell 10/36 → 5/36, and **Striker fell from 6/6 to 3/6**
— halved, not resolved. See the open exception below.

### P4 — Desert controller durability (Durability27, retained)

| Species | Live HP | Candidate HP |
|---|---:|---:|
| sand-scorpion | 780 | 1365 |
| stone-basilisk | 780 | 1365 |

HP ×1.75 on the two controllers only; no attack or defense change.

**[corrected] The later Desert selection must be carried too.** Durability26 applies the P1
candidate and then doubles `dune-basilisk` again, so its final retained value is **9006**, not
the 4503 that appears in the P1 base-layer table above. Base-layer and final resolved values
are different things; adopting 4503 would silently drop a later planner decision.

P4 is retained together with a **situational** Defensive Striker template — a
survival/throughput tradeoff, explicitly not a universal stance winner.
**Status:** selected, not applied.

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

### P8 — Forest / Volcano (Durability19) **[corrected: now resolved, not inconclusive]**

`durability19Spec.ts` composes the Durability17 and Durability15 installers and additionally
overrides the Forest wolf's attack, so the selected authored-space values are directly
recoverable. Resolved by running each installer against the live database and diffing:

| Tier / ID | Current HP / attack | Selected HP / attack |
|---|---|---|
| T2 `ancient-wolf` | 525 / 34 | 1575 / 22 |
| T2 `ironwood-golem` | 315 / 31 | 945 / 25 |
| T3 `magma-brute` | 2000 / 145 | 3000 / 116 |
| T3 `ash-slinger` | 1330 / 105 | 1330 / 84 |

`ash-slinger` is an attack-only change; its HP is deliberately unchanged. Companion species
in those blocks are untouched. These are source-derived overlay values with verified
restoration, **not** newly measured efficacy findings and not production approval.
**Status:** selected, not applied.

## The mandatory T2 Mountain Striker disposition

**Disposition: unresolved evidence — not a functional defect, and not safe to call closed.**

What the record supports at this revision:

- **[corrected]** P3 reduced T2 Mountain deaths 10/36 → 5/36 overall. Striker went from
  **6/6 deaths in the control arm to 3/6 in the candidate** (node03 0/3/0 → 1/2/0, node05
  0/3/0 → 2/1/0). The candidate **halved** Striker's deaths; it did not resolve them. The
  earlier wording here — "stayed at 3/6", implying no help — was wrong.
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

**Proposal — deliberately NOT appended to Durability32 or Durability33.**

**[corrected] Extract before you run.** Repeating the same scalar contrast would not separate
concurrency from the terminal blow, and the existing Durability27–29 artifacts already contain
the pressure windows needed to try. `scripts/charged-cast-audit.mjs` now does exactly this
kind of extraction — per-cast attribution, HP immediately before, concurrent attackers and
short-window damage — and it applied to Durability32 without a new run. Run it over the
retained Durability29 T2 Mountain artifacts first.

Only if that extraction leaves the question open is a new experiment justified, and then the
smallest discriminating matrix is Striker only, one T2 Mountain node, control vs P3 candidate,
three seeds. **[corrected] That is 1 root × 1 node × 2 arms × 3 seeds = 6 observations, not
the 18 stated here earlier** — the earlier figure had no fourth factor behind it. If a
discriminating contrast needs more than that, name the added factor explicitly rather than
inflating the count.

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
6. **[corrected]** The manifest covers **30 unique species**: the 14 of the P1 base layer,
   `granite-titan` / `stone-eagle` / `peak-archer` (P3), `sand-scorpion` / `stone-basilisk`
   (P4), the five Graveyard species (P5), `obsidian-tortoise` / `magma-salamander` (P6), and
   `ancient-wolf` / `ironwood-golem` / `magma-brute` / `ash-slinger` (P8). P2 and P6-Desert
   modify P1 members rather than adding new species.
