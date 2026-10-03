# The tutorial's lean + verb picks (verbs-that-fire wave 2, 2026-10-04)

**Rule (brief, wave 2 item 4):** per class, on the weapon it fights with (its `bossKit`
weapon — the Chaotic Axe for five classes, the Poison Dagger for the Slinger), the pair with
the best boss-lab uplift **among the pairs whose verb fired for that class** (verb firings >
0). A tie at the reported precision (0.1 pp) goes to the mean over the five bosses.

**Table:** the conductor's composition-matrix rerun on `57916b52` (wave 1 merged: the leans
seed their conditions, the Empowered moment capped at 4 s, T2+ bands compose), boss lab,
`_t1BossPlan.ts --matrix=composition` → `_t1BossLab.ts` in three shards, read at
2026-10-04 00:05 from the shards in progress: every Axe and Dagger row of the six classes
was complete (50 fights per pair: 5 bosses × 10 seeds), except the Conduit's Dagger rows,
which no pick reads. The finished matrix lands at
`../mmo-lin-w2c/reports/verbs-that-fire/matrix-boss.jsonl` (the conductor's). Printed by:

```bash
# from server/
node --conditions=development --import tsx scripts/_vfTutorialPicks.ts <matrix-boss.jsonl>
```

**Uplift** is the composition report's own: mean boss DPS over the same class on the same
weapon with no cards, on the same boss and seeds, median over the five bosses (the mean over
the bosses beside it). **Fires/min** is the verb's landed `card-fx` per minute of fight.
⌀ = the verb never fired for that class. "(plan)" marks the plan's pick when it is not the
table's.

| Class | Weapon | Pick | Uplift | Fires/min | The verb then reads |
|---|---|---|---:|---:|---|
| Striker | Chaotic Axe | Loose Grip → Cleaving Blow (tempo × empowered) | +31.2% | 10.2 | When your class mechanic fires (every 4 s at most), the hit lands twice. |
| Squire | Chaotic Axe | Hewing Arc → Cleaving Blow (empowered, pure) | +25.4% | 6.6 | Your mechanic hits half again as hard. |
| Slinger | Poison Dagger | Coated Edge → Into the Wound (affliction, pure) | +42.8% | 11.6 | Hitting an afflicted target doubles its affliction. |
| Spirit | Chaotic Axe | Loose Grip → Chopping Rhythm (tempo, pure) | +24.8% (mean +23.7%) | 7.3 | Every 6th hit strikes twice. |
| Apprentice | Chaotic Axe | Hewing Arc → Chopping Rhythm (empowered × tempo) | +14.0% | 6.0 | Every 6th hit counts as your class mechanic firing. |
| Conduit | Chaotic Axe | Loose Grip → Chopping Rhythm (tempo, pure) | +17.0% | 26.9 | Every 6th hit strikes twice. |

- **Spirit:** tied on the median with Loose Grip → Cleaving Blow (+24.8% each: the median
  boss is the Greatbear, identical for both); the mean over the five bosses breaks it,
  +23.7% against +22.7% (and it wins three bosses of five).
- **Four picks of six are pure (same-lane) pairs.** The rule picks by uplift, not by the
  lesson; for those the guide's lesson says the lean "is the same colour" instead of "your
  lean chose that" (the sentence is still `verbSentence`, the page's own).
- **Conduit:** Chopping Rhythm fires 26.9 times a minute on it (four summons' hits fill the
  six-count), well above §24.1's one firing every 4–6 s; its Empowered verb, which the
  course-correction pick used on the Rapier, fell to +7.4% under the 4 s cap.
- **Apprentice:** Cleaving Blow on Hewing Arc (the pure Empowered pair) never fired for it,
  so the table's +11.4% for that pair is the lean alone; the pick is the next firing pair.
- **Slinger:** every other Dagger pair is within ±3% of no cards on the bosses.

## Per class, every pair on its weapon


### Striker — axe (chaotic-axe); 50 fights per pair
| lean × verb | cards | uplift (median · mean over bosses) | verb fires/min | wins (control) |
|---|---|---:|---:|---|
| tempo×empowered **pick** | Loose Grip → Cleaving Blow | +31.2% · +32.4% | 10.2 | 100% (86%) |
| tempo×tempo | Loose Grip → Chopping Rhythm | +24.5% · +24.3% | 6.3 | 100% (86%) |
| empowered×empowered | Hewing Arc → Cleaving Blow | +24.5% · +24.6% | 9.2 | 100% (86%) |
| empowered×tempo | Hewing Arc → Chopping Rhythm | +18.7% · +19.1% | 5.7 | 100% (86%) |
| kill-chain×empowered | Bloodscent → Cleaving Blow | +17.8% · +17.4% | 9.0 | 100% (86%) |
| tempo×kill-chain | Loose Grip → Next Head | +10.7% · +12.1% | 0.9 | 92% (86%) |
| empowered×kill-chain | Hewing Arc → Next Head | +8.1% · +8.5% | 0.7 | 92% (86%) |
| kill-chain×tempo | Bloodscent → Chopping Rhythm | +6.7% · +5.5% | 5.4 | 100% (86%) |
| kill-chain×kill-chain | Bloodscent → Next Head | +0.3% · +0.7% | 0.7 | 84% (86%) |
pick: tempo×empowered = Loose Grip → Cleaving Blow (+31.2%, 10.2/min); plan: tempo×empowered (+31.2%)

### Squire — axe (chaotic-axe); 50 fights per pair
| lean × verb | cards | uplift (median · mean over bosses) | verb fires/min | wins (control) |
|---|---|---:|---:|---|
| empowered×empowered **pick** | Hewing Arc → Cleaving Blow | +25.4% · +25.4% | 6.6 | 100% (96%) |
| tempo×empowered | Loose Grip → Cleaving Blow | +23.3% · +21.9% | 7.2 | 100% (96%) |
| empowered×tempo | Hewing Arc → Chopping Rhythm | +20.4% · +18.2% | 4.0 | 100% (96%) |
| tempo×tempo | Loose Grip → Chopping Rhythm | +18.4% · +19.2% | 5.0 | 100% (96%) |
| kill-chain×empowered | Bloodscent → Cleaving Blow | +15.5% · +17.0% | 6.8 | 100% (96%) |
| empowered×kill-chain | Hewing Arc → Next Head | +8.9% · +10.1% | 0.8 | 100% (96%) |
| kill-chain×tempo | Bloodscent → Chopping Rhythm | +6.9% · +6.4% | 4.6 | 100% (96%) |
| tempo×kill-chain | Loose Grip → Next Head | +6.9% · +9.0% | 0.9 | 100% (96%) |
| kill-chain×kill-chain | Bloodscent → Next Head | +0.2% · +1.1% | 1.0 | 100% (96%) |
pick: empowered×empowered = Hewing Arc → Cleaving Blow (+25.4%, 6.6/min); plan: empowered×empowered (+25.4%)

### Slinger — dagger (ashbrand-blade); 50 fights per pair
| lean × verb | cards | uplift (median · mean over bosses) | verb fires/min | wins (control) |
|---|---|---:|---:|---|
| affliction×affliction **pick** | Coated Edge → Into the Wound | +42.8% · +42.8% | 11.6 | 100% (100%) |
| affliction×kill-chain | Coated Edge → Next Throat | +2.7% · +3.3% | 1.5 | 100% (100%) |
| affliction×control | Coated Edge → Easy Prey | +2.7% · +2.5% | 0.0 ⌀ | 100% (100%) |
| kill-chain×affliction | Silent Step → Into the Wound | +1.8% · +2.2% | 11.0 | 100% (100%) |
| control×control | Tendon Cut → Easy Prey | +0.0% · +0.8% | 9.3 | 100% (100%) |
| kill-chain×kill-chain | Silent Step → Next Throat | -0.1% · +0.4% | 1.5 | 100% (100%) |
| kill-chain×control | Silent Step → Easy Prey | -0.2% · +0.2% | 0.0 ⌀ | 100% (100%) |
| control×kill-chain | Tendon Cut → Next Throat | -0.7% · -0.7% | 1.6 | 100% (100%) |
| control×affliction | Tendon Cut → Into the Wound | -0.9% · +0.9% | 11.1 | 100% (100%) |
pick: affliction×affliction = Coated Edge → Into the Wound (+42.8%, 11.6/min); plan: affliction×affliction (+42.8%)

### Spirit — axe (chaotic-axe); 50 fights per pair
| lean × verb | cards | uplift (median · mean over bosses) | verb fires/min | wins (control) |
|---|---|---:|---:|---|
| tempo×tempo **pick** | Loose Grip → Chopping Rhythm | +24.8% · +23.7% | 7.3 | 100% (96%) |
| tempo×empowered | Loose Grip → Cleaving Blow | +24.8% · +22.7% | 7.3 | 100% (96%) |
| empowered×tempo | Hewing Arc → Chopping Rhythm | +20.9% · +20.4% | 6.7 | 100% (96%) |
| empowered×empowered | Hewing Arc → Cleaving Blow | +18.6% · +17.9% | 6.3 | 100% (96%) |
| kill-chain×empowered | Bloodscent → Cleaving Blow | +12.5% · +12.3% | 6.6 | 100% (96%) |
| tempo×kill-chain | Loose Grip → Next Head | +11.2% · +13.1% | 1.5 | 100% (96%) |
| empowered×kill-chain | Hewing Arc → Next Head | +8.4% · +11.0% | 1.4 | 100% (96%) |
| kill-chain×tempo | Bloodscent → Chopping Rhythm | +5.7% · +6.9% | 6.3 | 100% (96%) |
| kill-chain×kill-chain | Bloodscent → Next Head | +0.2% · +2.4% | 1.4 | 98% (96%) |
pick: tempo×tempo = Loose Grip → Chopping Rhythm (+24.8%, 7.3/min); plan: tempo×tempo (+24.8%)

### Apprentice — axe (chaotic-axe); 50 fights per pair
| lean × verb | cards | uplift (median · mean over bosses) | verb fires/min | wins (control) |
|---|---|---:|---:|---|
| empowered×tempo **pick** | Hewing Arc → Chopping Rhythm | +14.0% · +13.8% | 6.0 | 100% (98%) |
| empowered×kill-chain | Hewing Arc → Next Head | +11.4% · +11.7% | 1.5 | 100% (98%) |
| empowered×empowered | Hewing Arc → Cleaving Blow | +11.4% · +11.3% | 0.0 ⌀ | 100% (98%) |
| tempo×tempo | Loose Grip → Chopping Rhythm | +4.6% · +4.8% | 6.0 | 100% (98%) |
| kill-chain×tempo | Bloodscent → Chopping Rhythm | +2.6% · +2.3% | 5.8 | 100% (98%) |
| tempo×empowered | Loose Grip → Cleaving Blow | +0.8% · +0.8% | 1.4 | 100% (98%) |
| kill-chain×kill-chain | Bloodscent → Next Head | +0.2% · +0.7% | 1.4 | 100% (98%) |
| kill-chain×empowered | Bloodscent → Cleaving Blow | +0.2% · +0.1% | 1.4 | 100% (98%) |
| tempo×kill-chain | Loose Grip → Next Head | +0.0% · +1.0% | 1.3 | 98% (98%) |
pick: empowered×tempo = Hewing Arc → Chopping Rhythm (+14.0%, 6.0/min); plan: empowered×tempo (+14.0%)

### Conduit — axe (chaotic-axe); 50 fights per pair
| lean × verb | cards | uplift (median · mean over bosses) | verb fires/min | wins (control) |
|---|---|---:|---:|---|
| tempo×tempo **pick** | Loose Grip → Chopping Rhythm | +17.0% · +16.6% | 26.9 | 100% (100%) |
| empowered×tempo | Hewing Arc → Chopping Rhythm | +14.9% · +14.8% | 21.0 | 100% (100%) |
| empowered×empowered | Hewing Arc → Cleaving Blow | +12.8% · +11.5% | 11.5 | 100% (100%) |
| kill-chain×tempo | Bloodscent → Chopping Rhythm | +8.2% · +8.0% | 26.3 | 100% (100%) |
| empowered×kill-chain | Hewing Arc → Next Head | +7.5% · +8.2% | 1.5 | 100% (100%) |
| tempo×empowered | Loose Grip → Cleaving Blow | +7.4% · +7.4% | 12.0 | 100% (100%) |
| kill-chain×empowered | Bloodscent → Cleaving Blow | +3.2% · +3.0% | 12.1 | 100% (100%) |
| kill-chain×kill-chain | Bloodscent → Next Head | +0.4% · +0.6% | 1.4 | 100% (100%) |
| tempo×kill-chain | Loose Grip → Next Head | +0.0% · +1.1% | 1.4 | 100% (100%) |
pick: tempo×tempo = Loose Grip → Chopping Rhythm (+17.0%, 26.9/min); plan: tempo×tempo (+17.0%)

