# OV2-SPIRIT report
**Agent:** Claude (OV2-SPIRIT, 2026-10-16 evening)   **Branch:** rw/ov2-spirit   **Last commit:** LASTCOMMIT

Lanes 3 (:4313, `gamedb_ov3`, account `ov3-spirit-overflow`) and 4 (:4314, `gamedb_ov4`, account
`ov4-spirit-reservoir`), `--policy=intended`, `--rewardMultiplier=100`, auto Thresholds, fresh characters.
The storm's rule is untouched (hits drain the storm before HP, constant flow): every change is a discipline
default, a discipline piece or a discipline number.

## Chains (routes added)

| Route | T2 discipline | T3 specialization | T4 leaf |
|---|---|---|---|
| `spirit-t2-overflow` / `spirit-t3-overflow` / `spirit-t4-overflow` | Overflow | Lightning Rod | Static Field |
| `spirit-t2-reservoir` / `spirit-t3-reservoir` / `spirit-t4-reservoir` | Reservoir | Gathering Dark | Dam |
| `spirit-t2` / `spirit-t3` / `spirit-t4` (unchanged, the overnight Tide chain) | Tide | Spring Tide | Wading |

Picks are PLACEHOLDER: the bible names no default specialization or leaf, so each chain takes the
boss-leaning specialization (§11.6 notes: "Gathering Dark and Lightning Rod lean to bosses") and the leaf that
answers a boss's sustained pressure. Same zones, gear and order as the Tide chain (the Summit Staff is the boss
weapon from the T2 Mountain on, the Volcanic Flash Steam vest and Thermal charm for the Heat race). The route
functions take the discipline (`spiritT2Route(discipline)` and so on); Tide keeps the bare ids.

## Per-tier results (live)

Boss kills / attempts (T1 = the two seals, T2-T4 = every zone's boss), deaths anywhere on the route,
route minutes, boss fight lengths (live, from the boss's first hit).

**First runs** (fresh characters at 18:58; each lane restarted once with new code and resumed with
`--fresh=false`: Overflow after its T2 Forest boss, Reservoir on its way into T2; the resume replays the earlier
travel steps, ~10 minutes, counted in the minutes below):

| Chain | T1 | T2 | T3 | T4 | Deaths | Minutes (T1 / T2 / T3 / T4) | Bar |
|---|---|---|---|---|---|---|---|
| Overflow (`spirit-t4-overflow`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 11 / ~33 / 28 / 33 | pass |
| Reservoir (`spirit-t4-reservoir`) | 2/2 | 7/7 | 7/7 | 7/7 | 0 | 11 / ~20 / 22 / 42 | pass |

Boss fight lengths, first runs:
- Overflow: T1 37 / 13 s; T2 29, 67, 26, 12, 17, 26, 20 s; T3 27, 17, 21, 58, 22, 35, 40 s; T4 24, 9, 51, 36, 31, 61, 59 s.
- Reservoir: T1 36 / 14 s; T2 15, 31, 5, 1, 3, 4, 6 s; T3 1, 1, 1, 1, 1, 3, 1 s; T4 3, 1, 13, 6, 24, 1, 3 s
  (the T2 Mountain-on runs predate the Cloudburst cost-line fix, 557342d8).

**Clean runs** (reset lanes, fresh characters, the final code, no restart):

CLEAN

Guard packs (the sim never meets them; `dungeon-guard` events): no `gave-up` anywhere. Most packs fall in
15-90 s; the slow ones all **reformed** (the 90-s pre-clear timer ran out and the pack came back) before falling:
Overflow T2 Mountain 242 s, T4 Mountain 388 s, T4 Jungle 147 s; Reservoir T4 Mountain 580 s, T4 Desert 171 s,
T4 Trench 640 s (the executor gives up at 15 minutes). See "still broken".

## Sim (server/bench/classBossSim.ts, the chain's gear and clears, 2 runs a boss)

Fight seconds per boss in zone order (T2: Plains, Forest, Mountain, Swamp, Cave, Jungle, Desert; T3: Mountain,
Cave, Swamp, Jungle, Desert, Tundra, Volcanic; T4: Mountain, Tundra, Jungle, Desert, Volcanic, Wasteland, Trench).
Every fight is a win unless marked. The sim starts the fight at full HP and strips the guard.

| Chain | T2 | T3 | T4 |
|---|---|---|---|
| Overflow, before (overnight defaults) | 43, 55-62, 40, 17, 37, 33, 31 | 54, 27, 28-30 (67-80% HP), 51, 32, 52, 22 | 47, 17, 110-147, 42, 37-41, 62, 94 |
| Overflow, final | 43-48, 56-65, 35-42, 16-22 (76-90% HP), 39-42, 33, 35 | 54, 27, 24-44 (42-90% HP), 51, 32, 52, 23 | 44, 17, 147, 42, 37, 64-171, 94 |
| Reservoir, before (overnight defaults) | 51-74, 51-54, 18, 10, 25, 26, 50 (48% HP) | 19, 105, **lost twice (boss 53-57% left)**, 50, 22, 35, 25 | 30-40, 19, **240 s timeout (boss 41-59% left)**, 61, 48-57, 58-80, 197 |
| Reservoir, final | 32, 33, 11, 7, 17, 26, 23 | 16, 16, 18, 25, 21, 21, 18 | 28, 14, 93, 27, 35, 46, 54 |
| Tide (verified chain), final (unchanged) | 26, 38, 7, 7, 8, 16, 14 | 18, 11, 10, 31, 20, 20, 17 | 23, 19, 55, 36, 37-50, 17-40, 36 |

The Tide chain was re-simmed on the final code: unchanged (no change touches Tide; differences are run variance).

## Numbers changed

| File | Name | Old | New | Why / evidence |
|---|---|---|---|---|
| `server/.../energy/spirit.ts` | `RESERVOIR_FLOW_X` (new) | 1 (the shared flow) | 1.5 | Reservoir's 2x bank never filled under a boss's pressure: the storm sat at the floor (Eye of the Storm halves the cost there) and gather never broke. Sim before: T3 Swamp boss lost twice (boss 53-57% left, 0 spends, DoT drain 55-66/s against a 30/s flow), T4 Jungle boss 535 s with 0 spends (pressure ~47/s, flow 36/s), T3 Cave 105 s. x2 (the bottle's depth) overran the Tide threefold (T3 Cave 7 s); x1.5 lands near the Tide (T3 Cave 11 s, Swamp 10-12 s, T4 Jungle 37-73 s, Trench 32 s; Tide 11 / 11 / 55 / 36 s) |
| `shared/.../spirit/kit.ts` | Ball Lightning `mult` (a tick) | 0.4 | 0.6 | Once the default fields it (below), the orb on one boss hit less than the Bolt it replaced (T2 Mountain 40 s → 50 s); at 0.6 it matches (35-42 s) and stays the pack piece |
| `shared/.../configs/spirit.ts` | Overflow default band order | kit order (Bolt first) | Ball Lightning first | §11.13 "Overflow: ... Ball Lightning and area strikes". Every Overflow band sits at the brim and the first listed spends first, so Bolt took every spend (telemetry: `spends: {bolt: 10, updraft: 1}`, no orb) |
| `shared/.../configs/spirit.ts` | Reservoir calms' default band | 50% | the floor (40%) | §11.13 "Reservoir: ... calms at the floor". No change in play (see the gather note below) |

## Mechanics changed

1. **Cloudburst prices its pips by the weapon's cost line** (`cloudburstMult`, 557342d8; for review). The release
   has no fixed cost, so a weapon's cost line never reached it: the Summit Staff's x2.2 damage came without its
   x1.5 cost (and the Quickening Wand's x0.6 damage without its x0.6 discount). Now each pip of the bolt costs
   what the weapon says, as for every fixed spend. Reservoir only.

No storm rule moved: the flow multiplier is Reservoir's own number (like the Tide's ebb x3).

## Verification that the class system fires (live telemetry)

The dev-only `spirit-storm` line (once a minute per Spirit in combat) on each lane's `server.log`:
- Reservoir (lane 4, T2): `spends: {cloudburst: 20, gale: 3, bolt: 2, chain-lightning: 1, thunderclap: 1}`,
  Thunderhead proc 5, absorbed 181 from hits; T4: Cloudburst 2-17 a minute plus the squalls (Ground Charge,
  Dust Wall, Dust Devil, Downburst), `bareS: 0` in every window.
- Overflow (lane 3, T3): `spends: {downburst: 2, ball-lightning: 2, bolt: 2}`, Thunderhead 6;
  `{downpour: 4, bolt: 3, gale: 1, ball-lightning: 1}` with 1248 absorbed from DoTs (the T3 Swamp);
  Lightning Rod windows `{gale: 6, bolt: 12, ball-lightning: 1, updraft: 7}`. Ball Lightning flies since the
  default change (before it: `{bolt: 10, updraft: 1}`, no orb, in the sim).

## Checks

CHECKS

## What is still broken or unsure

- **The binary storm still decides every Spirit fight** (the overnight finding; the designer keeps the rule).
  Reservoir shows it most: at a flow below the boss's pressure it never spends at all (0 spends in 535 s);
  a little above it, it wins at the Tide's pace. `RESERVOIR_FLOW_X` is a knife-edge number: a playtest at a
  boss whose pressure sits near the flow will read as "Reservoir does nothing".
- **In gather, nothing fires while gathering, not even a calm whose moment holds.** Downpour (washes a DoT)
  never fired at the T3 Swamp boss for Reservoir: the storm never reached full, so no break, so no calm. The
  bible's "calms at the floor" for Reservoir (now the default) changes nothing in play for that reason. A rule
  question, left alone (below).
- Overflow is the slowest Spirit at bosses (sim T4 Jungle 110-147 s, Trench 94 s, Tide 55 / 36 s): its 95%
  floor keeps nearly the whole storm as shield, and the spill only reaches what stands near (kiters escape it,
  the bible's own weak spot). It never comes close to dying.
- **Reservoir one-shots most bosses live.** It meets each boss with a full deep bank held on the walk in
  (Gathering Dark doubles a bank held full, in or out of combat), and the "enough" rule fires it at once: T3 boss
  fights of 1 s in the first run. The sim starts the storm unfilled, so it shows 11-25 s. Not touched (the bar
  passes; a pure numbers call): the levers are Cloudburst's `multPerPip` 2.25, `RESERVOIR_DEPTH_X` 2, Gathering
  Dark's ramp (`DARK_RAMP_MS`, and whether it ramps out of combat).
- **Slow guard packs, both disciplines, the T4 Mountain worst** (4 Stone Wardens: 388 s Overflow, 580 s Reservoir;
  Reservoir's T4 Trench pair 640 s, 11 of the executor's 15 minutes). Live samples in those windows: the Spirit is
  in combat 0-4 s a minute, the auto intent reads "No worthy target nearby" most of the time, and the storm sits
  full, so each break spends on squalls that fire on any enemy near (Reservoir: Dust Wall 8-16 and Gale up to 55
  a minute, Ground Charge 10) and push the pack away before it engages; the pack then reforms. Two parts: the
  auto-combat's target choice at a guard pack (core, not mine: `server/src/systems/combat/ai/targetPriority.ts`),
  and the Spirit's push squalls breaking a full storm on nothing to kill. A Reservoir default without the push
  squalls (§11.5: it "wants big strikes and calms") is the obvious class-side try; not done, no time to verify
  it live.

## Questions for the designer

1. In gather, should a calm at the floor (Downpour, Updraft, Foehn, Tailwind) fire at its moment while the
   storm gathers, or only in a break? Today only in a break, so a gathering Spirit under a DoT never washes it.
2. Reservoir's flow x1.5 (its deeper bank fills at 0.75 the speed of the others' bottles). Keep, or another
   answer (a shallower bank, a lower mark)?
3. Overflow's and Reservoir's specializations and leaves for the chains (Lightning Rod / Static Field,
   Gathering Dark / Dam) are my picks: which should the default chain be?

## Files outside the brief I needed (not edited)
- None.
