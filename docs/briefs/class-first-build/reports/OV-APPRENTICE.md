# OV-APPRENTICE report
**Agent:** Claude (Opus 5.5)   **Branch:** rw/ov-apprentice   **Last commit:** see `git log -1` (this report is committed with it)

Lane 6 (port 4316, `gamedb_ov6`), class `dot`, routes `apprentice-t1..t4`, account `ov6-apprentice`,
`--rewardMultiplier=100`. Discipline chain: **Fire, then Afterburn, then Tinderbox** (the one the T3
and T4 routes already played; `apprentice-t2` now picks it too).

## Per tier

Resumed runs (one character, T1 fresh, then `--fresh=false` on each next route):

| Tier | Route / run | Boss kills / attempts | Deaths | Minutes | Pass? |
|---|---|---|---|---|---|
| T1 | `apprentice-t1` (fresh), run `...T00-38-51...` | 2 / 2 (Plains 25 s, Mountain 14 s) | 0 | 12.1 | **pass** |
| T2 | `apprentice-t2` (resume), run `...T01-04-47...` | 7 / 7, each first try | 1 (a Jungle Warden guard, before the boss) | 35.7 (≈13 of them the T1 replay) | **pass** |
| T3 | `apprentice-t3` (resume), run `...T02-16-28...` | 7 / 7, each first try (8-26 s fights) | 0 | 44.5 (≈13 the T1-T2 replay) | **pass** |
| T4 | in the clean final run (below) | 7 / 7, each first try | 0 | 30.0 | **pass** |

Clean final run (`node tools/lane/lane.mjs reset 6`, then `apprentice-t4`, which replays T1-T3):

Run `apprentice-t4-intended-2026-10-16T03-14-45-669Z-185b7534` (05:14-06:52, code at `d10eec07`, which has
the conductor's tier factor and OV-HOOKS merged): **completed, 23 / 23 bosses on the first attempt, 0 deaths,
456 kills, 97.7 minutes**, ending at tier 5, Global Mastery 156.

| Tier | Bosses (fight length) | Attempts | Deaths | Minutes (run clock) | Pass? |
|---|---|---|---|---|---|
| T1 | Plains 22 s, Mountain 14 s | 2 | 0 | 0 - 12.3 | **pass** |
| T2 | Plains 16, Forest 22, Mountain 12, Swamp 16, Cave 14, Jungle 19, Desert 12 s | 7 | 0 | 12.3 - 38.8 (tier 3 at 28.2) | **pass** |
| T3 | Mountain 14, Cave 8, Swamp 8, Jungle 15, Desert 14, Tundra 17, Volcanic 16 s | 7 | 0 | 38.8 - 67.7 (tier 4 at 56.0) | **pass** |
| T4 | Mountain 68, Tundra 45, Jungle 33, Desert 24, Volcanic 18, Graveyard 11, Trench 19 s | 7 | 0 | 67.7 - 97.7 (tier 5 at 94.1) | **pass** |

No stalls, no death loops, no crashes.

Before the tuning, the base kit lost the Plains boss live (boss at 39% after 24 s) and in the class boss
sim (25-38% left, 25-32 s).

## Done

### Routes (`bot/src/routes/apprenticeT1..T4.ts`)
- **T1 crafts its gear** (the conductor's finding: the bot reached the Plains bare). A `wear(at, ids)`
  helper crafts each recipe at the zone (the craft step farms until level and wallet allow) and equips
  it. T1: the Clearing set (Plain Wand, Bark Wrap, Herb Pouch, Soft Boots) after the class pick; then per
  zone (PLACEHOLDER picks): Plains wand/vest/charm/boots; Forest rod/vest/charm/boots; Swamp nothing; Cave
  the Deep Grimoire; Mountain the Runestone Staff and Stone Sigil vest.
- **T2-T4 craft their tier's gear** as each zone unlocks it (weapon, armor, charm, boots of that tier, from
  zones the route farms). T2: Plains set, Forest set, Runestone Staff T2, Jungle vest, Desert boots.
  T3: Mountain set (Runestone Staff T3), Desert charm and boots. T4: Mountain set (Runestone Staff T4),
  Desert charm and boots, Volcanic vest. Picks from the class boss sim (below). No upgrades.
- **Every tier plays auto**: the T2-T4 `classConfig` steps restate `auto` instead of a custom list (the
  pass bar is the auto config). `apprentice-t2` picks Fire (`APPRENTICE_T2_DISCIPLINE`; T3/T4 reuse it).
- Route tests kept passing (`apprenticeT1..T4.test.ts`), unchanged except through the new behaviour.

### The auto default (`shared/src/classKits/configs/apprentice.ts`)
Aligned with bible §9.13 and extended to the T3/T4 pieces the routes own:
- Fire: full → Detonate (the T1 Spread rule is dropped under Fire, so a full bar always sets the chain
  off), shell up (`target-shielded`) → Fuse. Before, Fuse sat on the full bar ahead of Detonate.
- Frost: frozen (`target-frozen`) → Detonate (the Shatter). Cold Snap on a full bar with 3+ near.
- Poison: low (`target-low`) → Wither (before: on the full bar).
- New: Cinderfall (full, 3+ near, ahead of Spread/Detonate), Spore Burst (target low, 3+ near),
  Transference (`debuff-landed`, after Recoil). Frostcrack ahead of Sear and Fuse on a shielded target.
  Entries can be gated by discipline (`discipline` / `except`).

### Mechanic fix
- **Numb slowed movement only** although its text says attacks too (OV-HOOKS noted it): it now also sets
  `attackSlowPct` on the same slow (the other classes' pattern); Numb II's wind-up slow is kept. Numb is
  not in the auto default, so the bar runs are unaffected. Test line in `apprenticeSigils.test.ts`.

### Telemetry: the class system fires
`server/src/systems/classes/archetypes/dot/telemetry.ts` (dev only): once a minute per Apprentice the
server logs `apprentice payoffs` with counts of each payoff fired, chain links, shatters, Spread passes,
sigils laid, tick damage, blast damage, Siphon healing, Seize breaking a wind-up
(`APPRENTICE_PAYOFF_LOG_MS` shortens the interval; I used 1 s in the boss sim). Evidence:
- Live T1 (lane 6 server log): `detonate` 1-4 and `spread-pass` 2 per minute in the Plains, blast damage
  216-864 per minute, sigils laid 9-41 per minute.
- Sim T3 Dune-Carapace Monarch: `detonate=5 recoil=3 seize=3 seize-broke-windup=3 fuse=3 siphon=1`,
  blast 16 121 vs ticks 2 668. Sim T4 Iron-Crest Titan: `frostcrack=6 seize=6 seize-broke-windup=6`.
- Count with: `grep -A 14 "apprentice payoffs" ../lanes/lane6/server.log`.

## Every number changed

| File | What | Old | New | Why / evidence |
|---|---|---|---|---|
| `server/.../dot/sigils.ts` | `SIGIL_TICK_PCT` (sigil damage per tick, share of weapon attack) | 0.12 | 0.25 | Base kit lost the Plains boss (sim 25-38% boss left; live 39%). Sigils were ~45% of damage vs the bible's ~80% (ticks+payoffs). After: sim wins with 23-33% HP, live first-try win |
| `shared/.../apprentice/kit.ts` | Detonate `payoffPct` | 0.8 | 1 | Its text: "dealing what they still had to deal". Plains sim 23-29% → 29-33% HP left |
| `shared/.../classGear/apprentice.ts` | `plains-vest-t1` Warding Sigils `apprentice.warding` (cap 0.3 kept) | 0.04 | 0.08 | Survival was the Plains gap (4.4% pool/s). 10-19% → 23-33% HP left |
| `shared/.../apprentice/kit.ts` | sigil cap steps (the budget) | standard: 4, +1 at Mastery 15/30/44/58/72/86/100/114/128/142/156 | 4, 5@15, 6@30 (T1 as the bible), then 7@72, 8@114, 9@156 | On the standard steps the cap reached 12-13 at T3; no weapon filled it inside a boss fight, so Detonate and the Fire chain never fired (sim telemetry: 0 detonates in 18 s on the Bramble-Slasher). After: T3 Horn-Behemoth 50 s → 33 s, Rime-Mammoth dps 223 → 469 (before the tier factor) |
| `shared/.../configs/apprentice.ts` | Spore Burst default condition | none | 3+ enemies near | Alone on a boss it spent the bar for nothing: Cinder-Shell Salamander sim boss 2-18% left (died) → win with 51-65% HP |

## Class boss sim (after every change and the conductor's tier factor; `server/bench/classBossSim.ts`)
Route gear, Fire/Afterburn/Tinderbox, auto config, trophies of the earlier tiers:
- T1 Plains (wand, Plains vest/charm/boots, levels plains 6): 3/3 wins, 23-29% HP left. T1 Mountain
  (Runestone Staff, Stone Sigil vest, Forest charm/boots): win, 50% HP, 10 s.
- T2 (Runestone T2, Jungle vest, Forest charm, Desert boots): 14/14 wins, 35-68% HP left.
- T3 (Runestone T3, Mountain vest, Desert charm/boots): 14/14 wins, 51-98% HP left.
- T4 (Runestone T4, Volcanic vest, Desert charm/boots): 14/14 wins; Charnel-Crown once at 24% HP,
  the rest 60-99%. With the Mountain vest instead: Caldera Sovereign 2/3 (one death at 1% boss HP).

## Checks
- `pnpm typecheck`: clean before each commit and again at the report commit (10:30, exit 0, no errors); for the Numb-fix commit, under the night's load
  the full typecheck hit my 15-minute timeout during its bench phase after the workspace phase passed;
  `tsc -p server/tsconfig.test.json` then ran clean.
- `pnpm test -- apprenticeT apprenticeKit payoffsView`: 9/9 passed. `pnpm test -- apprenticeSigils classKits`:
  15/15 passed. `apprenticeSigils` and `windupSlow` after the merge of OV-HOOKS: both `ok` when run
  directly (the runner marked both FAIL after 267 s each under load, with no assertion output; rerun alone
  they pass).

## Not done, or unsure
- **The T1 replay on resume walks every earlier zone again** (each `travel` + idempotent craft/equip), ≈13
  minutes per resumed tier on this machine. Harmless; the clean chain does it once.
- **Levels rose between my resumed runs** (e.g. Cave T3 capped at minute 0.1 of the T3 run): the
  character farmed between bot runs while I restarted the lane, so the resumed T2/T3 numbers may carry a
  little extra Global Mastery. The clean final run has no gaps.
- Fire drops Spread from the auto default (PLACEHOLDER reading of §9.13 "Fire: full → Detonate"); Outbreak
  (the first trophy) then does nothing for a Fire Apprentice until the chain carries burn.
- Only the Fire chain was run live. Poison and Frost defaults are aligned with §9.13 and won every T2 boss in
  the sim (Frost, Runestone Staff: 7/7, 35-75% HP left; Poison, Thornwood Rod: 7/7, 11-74% HP left, the
  Jungle Dread-Gorger the thinnest), untested live and past T2.
- The T4 Iron-Crest Titan is the slowest fight (68 s live, 71 s sim, dps ~465 against ~1 300+ on the other T4
  bosses): Frostcrack answers its shield every 5 s and spends the bar before Detonate. Safe (96-98% HP), but
  it is where the Fire Apprentice feels weakest.
- Swamp T1 gives the route nothing to wear (its weapon and pieces were weaker than the Forest's for this
  route); Bitter Tonic (Siphon) may be the better charm in long fights.

## Questions for the designer
1. The sigil cap now grows one step per tier after T1 (9 at the end of T4, +1 with the Runestone Staff).
   Is "the cap is the budget" meant to keep climbing three steps a tier? If so, weapons need to lay sigils
   much faster at T3+ or the full-bar payoffs stop firing.
2. Under Fire, should the T1 Spread rule stay on the full bar (it blocks Detonate whenever two enemies are
   near), or is "full → Detonate" the Fire default as I read §9.13?
3. Spore Burst on a lone boss wastes the bar. Is "low → Spore Burst only with company" the right default?

## Files outside the brief I needed (not edited)
- None. (Merged `rework/class-first` four times as the conductor asked: the boss sim, its clock fix, the
  tier factor, OV-HOOKS.)
