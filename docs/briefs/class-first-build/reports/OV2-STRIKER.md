# OV2-STRIKER report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov2-striker   **Last commit:** see `git log -1 rw/ov2-striker` (this report is the last commit)

Lanes 1 (:4311, `gamedb_ov1`, Light) and 2 (:4312, `gamedb_ov2`, Heavy), 100x rewards, auto config.
First runs on fresh characters (`ov1-striker-light`, `ov2-striker-heavy`), resumed with `--fresh=false`
after every fix; then a clean run of each on a reset lane and a fresh character (`-b`). The two new
chains beside the verified Balanced one (`striker-t4-read-the-blow`):

| Chain | Route | Discipline, specialization, leaf (PLACEHOLDER picks) |
|---|---|---|
| Light | `striker-t4-ghoststep` (replays `striker-t3-afterglow`, `striker-t2-light`, `striker-t1`) | Light, **Afterglow** (picked by the sim, below), **Ghoststep** (the spike leaf, like Balanced's Read the Blow) |
| Heavy | `striker-t4-unbreakable` (replays `striker-t3-subjugator`, `striker-t2-heavy`, `striker-t1`) | Heavy, **Subjugator** (§12.13 Heavy: "control and setups"; the discipline's first), **Unbreakable** (the spike leaf) |

No new route ids: the per-leaf T4 routes already existed. The T4 route now takes a named
specialization per discipline (`strikerT4SpecializationOf`: Light → Afterglow; the others keep their
first, so `striker-t4-read-the-blow` still replays Iaido).

## Per chain, per tier (live)

Boss kills / attempts, deaths anywhere in the tier, minutes (the first runs' T2 minutes include the
restarts to load fixes). Every boss fight length is listed in the second table.

| Chain | Run | T1 | T2 | T3 | T4 | Bar |
|---|---|---|---|---|---|---|
| Light | first (fixed on the way) | 2/2, 0 deaths, 10 min | 7/10, 4 deaths (3 at the Forest boss, 1 its pack; all before the Grit and shine fixes), 59 min | 7/7, 0, 30 min | 7/7, 0, 32 min | **pass** after the fixes |
| Light | clean (final code but one fix) | 2/2, 0, 11 min | 7/7, 0, 34 min | 7/9, 2 deaths (the Volcanic boss twice, boss 1% / 8% left: fixed on the spot, then won in 21 s) | (not run: the agent was cut off by the usage limit; see the final merged-tree runs in OVERNIGHT-REPORT.md) | (not run: the agent was cut off by the usage limit; see the final merged-tree runs in OVERNIGHT-REPORT.md) |
| Heavy | first (fixed on the way) | 2/2, 0, 11 min | 7/8 (one attempt cut by a restart), 12 deaths (Forest pack 5, Jungle pack and the walk there 7; none to a boss), 107 min | 7/7, 1 death (the T3 Jungle pack, before its fix), 36 min | 7/7, 0, 33 min | **pass** after the fixes |
| Heavy | clean (final code) | 2/2, 0, 11 min | 7/7, 0, 35 min | (not run: the agent was cut off by the usage limit; see the final merged-tree runs in OVERNIGHT-REPORT.md) | (not run: the agent was cut off by the usage limit; see the final merged-tree runs in OVERNIGHT-REPORT.md) | (not run: the agent was cut off by the usage limit; see the final merged-tree runs in OVERNIGHT-REPORT.md) |

Boss fight lengths, first try unless noted:

| Chain, run | T2 | T3 | T4 |
|---|---|---|---|
| Light first | Plains 42, Forest 34 (4th), Swamp 30, Cave 29, Jungle 31, Desert 33, Mountain 35 | Mountain 34, Swamp 27, Cave 19, Jungle 36, Desert 36, Tundra 43, Volcanic 31 | Mountain 72, Tundra 38, Jungle 87, Desert 67, Volcanic 80, Wasteland 36, Trench 82 |
| Light clean | 42, 32, 32, 30, 31, 33, 35 | 20, 28, 20, 37, 29, 43, Volcanic 21 (3rd) | (not run: the agent was cut off by the usage limit; see the final merged-tree runs in OVERNIGHT-REPORT.md) |
| Heavy first | Plains 31, Forest 34, Swamp 22, Cave 20, Jungle 22, Desert 17, Mountain 21 | 27, 17, 15, 15, 21, 24, 16 | Mountain 58, Tundra 36, Jungle 49, Desert 50, Volcanic 97, Wasteland 48, Trench 37 |
| Heavy clean | 38, 29, 25, 20, 21, 17, 22 | (not run: the agent was cut off by the usage limit; see the final merged-tree runs in OVERNIGHT-REPORT.md) | (not run: the agent was cut off by the usage limit; see the final merged-tree runs in OVERNIGHT-REPORT.md) |

No stall, no crash, no `dungeon-guard` give-up in either chain after the pack fixes (the clean runs
cleared every guard phase first try).

## What was wrong, and what changed

### 1. Heavy's auto Order never built Momentum (bug)
The default fielded Focus, Concuss and Coil: three setups and no soft beat, and a setup multiplies the
Momentum already built, so every finisher spent zero. Heavy now fields **no opener** (§12.5: Heavy leans
to the wind-up; §12.13: "control and setups, Coil") and lays a damage technique first (the soft beat),
then one stop, then Coil: Rend, Concuss, Coil at T2; Hemorrhage, Concuss, Coil from T3. Momentum reaches
the finisher at 0.56 (×1.5 × 1.5 after one soft beat), 1.69 with Subjugator's control. Telemetry (lane 2):
`finisher-momentum-pct` 56 per full-combo finisher. classBossSim T2 (Forest, Desert, Mountain): 0/6 → 6/6.

### 2. The auto relic is the newest trophy for every class (shared, small)
For Heavy that fielded Pounce (no leap against a boss in reach) or Wide Arc (no second enemy beside a
lone boss). §12.13 gives Heavy "a weight relic". New optional hook `defaultRelics(ctx)` on a class
system spec (`shared/src/classKits/configs/common.ts`, used by `defaultClassConfig` in
`shared/src/classKits/config.ts`; a spec without it keeps the newest trophy, so no other class
changes). The Striker's ranks Heavy's weight trophies (Skyfall, Deep Pressure, Festering Cut, Sunder,
Verdict, Eruption, Pounce); Light, Balanced and T1 keep the newest. With 1 and 2: Heavy T2 7/7 in the sim.

### 3. Light's damage
Light dealt about half Balanced's boss damage per second (T2 100-150 against 170-250) and lost the T2
Desert and Mountain bosses in the sim; its finisher (x3, Coil x2) still carried half its damage
(§12.5 wants about 75/25 combo/finisher). The shine 0.5 → 1.5 (lit beats ×2.5). Then at T3/T4 the sim
had Thousand Cuts lose both Volcanic bosses (1 of 2 each, boss 1-11% left): the boss is out of reach
often enough that the shine goes out (a 3 s break) every few combos, and Thousand Cuts' doubled on-hit
is all it adds (nothing with a weapon without on-hit). **Afterglow** (the shine survives a break by a
combo and lights the finisher) won all fourteen T3/T4 bosses, the Volcanic ones at full HP; the Light
route takes it (PLACEHOLDER: it is *Tentative* in the bible; Thousand Cuts is *Decided*).

### 4. The guard packs the boss sim never meets
Both chains death-looped at T2 dungeon packs the sim strips:
- **T2 Forest, twelve guards** (Dire Whelps, Forest Sentinel; four attackers of 14): Light died once,
  Heavy four times in the Forest's own charm (Rhythm). Both now wear **Grit** at the Forest (as at the
  Jungle), and at the Cave and the Desert too (the sim: Cave boss 39-65% HP left vs 17-45% with Deep
  Breath, Light's Desert 60% vs 16% with Shake Off; the Swamp keeps Antidote, Grit was worse there).
- **T2 Jungle, nine guards** (the poison pack): Heavy died three times in the Maul (a swing every
  1.8 s, an eight-second combo with two casts) with Grit on, then three more with the Bastard Sword,
  every killing blow the Vine Chameleon's poison (six guards down at best). Heavy now takes the Cave's
  **Bastard Sword** (Cave, Jungle; the Maul back on at the Desert, where it wins at 65% HP against 20%)
  and wears the **Swamp vest** at the Jungle (Bloodless: damage over time can't take it below a quarter
  while it attacks). Cleared next try, 90 s, no death.
- Heavy keeps the Bastard Sword from the T3 Cave (the five T3 bosses after it won at 70-96% HP in the
  sim). The **T3 Jungle**'s nine-guard pack still killed it once (Venom Dart Frog poison, in the Jungle
  vest): it wears the T3 **Swamp vest** there too (`T3_REWORN`), and cleared the pack and the boss
  (15 s) next try.
- Pre-emptively (same reason, sim-checked): Heavy takes **Twin Fangs** at the T4 Jungle (nine-guard
  packs at the T4 Jungle and Volcanic) and the **Reaper's Scythe** at the T4 Wasteland (the Maul lost
  the Charnel-Crown Sovereign at 93% boss left, taking 9% of its HP a second from the risen; the Scythe
  won 2/2 and the Trench after it).

The re-worn pieces are one table per discipline and zone (`T2_REWORN` / `strikerT2Reworn`,
`T3_REWORN` / `strikerT3Reworn`), checked by the route tests (each was crafted in an earlier zone).

## Every number changed

| File | Number | Old | New | Why / evidence |
|---|---|---|---|---|
| `cadence/strikerT2.ts` | `SHINE_DAMAGE_PCT` (Light's lit beats) | 0.5 | 1.5 | Light lost the T2 Desert (boss 18% left) and Mountain (8%) in classBossSim; at 1.0 still lost the Desert (7%); at 1.5 won all seven T2 and every T3/T4 boss |
| `configs/striker.ts` | Heavy default Order | Focus, Concuss, Coil | damage, stop, Coil (no opener) | Momentum 0 at every finisher; sim T2 Forest/Desert/Mountain 0/6 → 6/6 (§1) |
| `configs/striker.ts` | Heavy default relic | newest trophy | `DEFAULT_RELIC_RANK` (Skyfall first) | §12.13; Pounce lost the T2 Desert at 12% boss left, Skyfall won (§2) |
| `routes/strikerT2.ts` | Light, Heavy charm at the T2 Forest, Cave, Desert | the zone's | Grit (`plains-charm-t2`) | Forest pack death loop live; sim Cave/Desert above |
| `routes/strikerT2.ts` | Heavy weapon from the T2 Cave | Maul | Bastard Sword (Maul back at the Desert) | Jungle pack death loop live; sim 55-56% HP at the Cave/Jungle |
| `routes/strikerT2.ts` | Heavy vest at the T2 Jungle | Jungle vest | Swamp vest (Bloodless) | three poison deaths at the Jungle pack; cleared next try |
| `routes/strikerT3.ts` | Heavy weapon from the T3 Cave | Maul | Bastard Sword | sim: the five T3 bosses after it at 70-96% HP, faster |
| `routes/strikerT3.ts` | Heavy vest at the T3 Jungle | Jungle vest | Swamp vest (Bloodless) | a poison death at the T3 Jungle pack; cleared next try |
| `routes/strikerT4.ts` | Heavy weapon at the T4 Jungle, Wasteland | Maul | Twin Fangs, then the Reaper's Scythe | T4 nine-guard packs; sim Wasteland 0/1 → 2/2 |
| `routes/strikerT4.ts` | Light's specialization | Thousand Cuts | Afterglow | sim T3/T4 Volcanic 1/2 each → 14/14 T3/T4 bosses |
| `routes/strikerT3.ts` | Light's weapon at the T3 Volcanic | Twin Fangs | the Cave's Bastard Sword, put back on | the clean run lost the Magma-Salamander twice (boss 1% / 8% left, 65 s); sim with the Sword 3/3 in 20 s at full HP; live next try 21 s |

No shared class number moved (the Balanced chain is untouched by construction: its Order, relic,
gear and the edge are as they were). Re-simmed anyway on the final code (classBossSim, its route's gear
at each boss): **21/21**, T2 21-29 s (Forest 39% HP left, the rest 50-97%), T3 17-32 s (36-100%), T4
28-97 s (86-100%), the same fights and gear as before this round.

## Rules or mechanics changed (for review)

- Heavy's default fields no opener and orders soft beats before setups (above). PLACEHOLDER.
- The class config can pick a default relic per class system (`defaultRelics`), opt-in; only the
  Striker uses it, and only for Heavy.
- Route-level choices (gear swaps, Afterglow, re-worn pieces) are bot routes only.

## How I checked that the class system fires
The dev-only `striker class system` line in each lane's server log: lane 2 (Heavy) counts
`beat:striker-rend`, `beat:striker-concuss`, `cast:striker-coil`, `finisher:striker-relic-mountain`
(Skyfall) and `finisher-momentum-pct` 56 per full-combo finisher; lane 1 (Light) `cast:striker-focus`,
the beats, `finisher-lit` (36 of the first 115 finishers, most of them farm kills that end the combo
early). In-process: a temporary print at the finisher showed Momentum 0.5625 at each T2 finisher.

## Checks
- `pnpm typecheck`: clean (after the last code commit).
- `pnpm test -- striker cadence classConfig orderView`: 15/15 passed (strikerOrder, strikerT2/T3/T4,
  strikerT3Hud, strikerGear, strikerKit, cadenceClassSelection, classConfig, orderView, bot strikerT1-T4,
  and the new `shared/src/classKits/configs/striker.test.ts`).

## Not done, or unsure
- **Crescendo's release** (not on either chain): its auto default holds nothing, so it fires every
  combo (Heavy without a cap: never stalls). A real release rule ("hold while the target is not
  staggered, not shelled, not low") needs a fallback against control-immune bosses; the only clean one
  is a Momentum condition ("release at Momentum N"), a new class-state condition in the shared
  `configTypes.ts` (`CLASS_STATE_CONDITIONS`) plus the cadence callback. Not built: designer/conductor.
- **Twin Fangs** trails the Bastard Sword in boss damage at every tier for a Light Striker (sim: T3
  130-250 against 250-350 per second): fixed cast times and flat plating punish small hits (Light's
  designed weakness). The Light route keeps the Fangs (Afterglow carries it); Heavy wears them at T4 only
  for the packs.
- Unbreakable and Ghoststep fired? (not instrumented; the leaves are wired since T4-W2).
- `server/bench/_ov2Probe.ts` (the sim plus Order/relic overrides, a hit timeline, keep-guards) and
  `server/bench/_ov2StrikerSim.ts` (walks a chain's route gear and sims every boss) stay untracked.
- I used `git checkout -- <files>` once to drop my own uncommitted experiment (no branch change).

## Files outside the brief I needed
- Edited (small, opt-in, flagged): `shared/src/classKits/config.ts`, `shared/src/classKits/configs/common.ts`
  (the `defaultRelics` hook, commit 6daeec39).

## Questions for the designer
1. Heavy's default now fields no opener (Rend, Concuss, Coil): is "Heavy leans to the wind-up" meant
   to exclude Focus, or should a later Heavy slot hold one?
2. Light's shine is ×2.5 now; is Light's 75/25 meant to come from the shine, or from a smaller finisher
   (no Coil in Light's default, as §12.13 lists only "Focus, attack setups")?
3. Afterglow (Tentative) is what carries Light through T3/T4 for the bot; Thousand Cuts only pays with
   on-hit weapons and loses its shine to every 3 s out of reach. Keep the break that strict for Light?
4. The dungeon packs, not the bosses, are where Light and Heavy died: Grit (a T1 Plains charm) is the
   answer at five T2 zones. Should each zone's own charm answer its pack, or is Grit the Striker's
   all-round pick?
