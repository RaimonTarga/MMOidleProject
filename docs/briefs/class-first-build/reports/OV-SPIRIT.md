# OV-SPIRIT report
**Agent:** Claude (OV-SPIRIT, overnight 2026-10-16)   **Branch:** rw/ov-spirit   **Last commit:** see `git log -1`

Lane 5 (:4315, `gamedb_ov5`), account `ov5-spirit`, `--rewardMultiplier=100`, `--policy=intended`,
auto Thresholds. Route discipline chain: **Tide → Spring Tide → Wading** (the routes' existing
placeholder picks; Tide is the bible's balanced middle, §11.5).

## Per-tier results

(not filled: the agent was cut off by the API usage limit; the final merged-tree runs are in OVERNIGHT-REPORT.md)

## Done

### Routes (bot/src/routes/spiritT1..T4.ts)
- **Gear.** The T1 route never crafted anything: the bot met the Plains with no weapon (conductor's
  finding). Now `wearZoneGear` crafts and wears pieces as they unlock: the Clearing set right after the
  class pick (`spirit-plain-rod-t1`, Clearing vest, charm, boots), then each zone's Spirit picks right
  after arriving (the craft step farms the zone until the recipe opens). Each tier's first boss is met in
  a full set of that tier (class weapon, armor, charm, boots). Wrapped in `ifPossible` "not yet the next
  tier", so a later tier's route resuming the character never puts old pieces back on. Picks
  (PLACEHOLDER, each an upgrade for this class; no upgrades bought):
  - T1: Plains rod/vest/charm/boots; Forest vest (evasion), charm (Clear Sky), boots; Cave Lodestone Orb;
    Mountain Summit Staff. Skipped: Quickening Wand (its spends hit less), Swamp pieces.
  - T2: Plains set; Forest vest, charm, boots; Mountain Summit Staff; Jungle vest and boots; Desert boots.
  - T3: Mountain set; Cave vest, charm, boots; Jungle charm and boots; Desert boots; **Volcanic vest
    (Flash Steam) and charm (Thermal)**.
  - T4: Mountain set; Tundra charm; Desert boots; **Volcanic vest (Flash Steam) and charm (Thermal)**.
  The Volcanic pair is the bible's own answer to the Heat race (§11.16): without it the T4 Volcanic boss
  won the race in the sim (boss 19-40% left at the Spirit's death); with it the Spirit wins both
  Volcanic bosses (T3 42-45 s, T4 61-64 s).
- Route tests extended: every gear block is a recipe of the zone it is farmed in, of the right tier,
  worn at once, and the first zone of each tier hands over a full set.

### Runtime and kit (all numbers PLACEHOLDER)
See "Numbers changed" and "Mechanics changed".

### Verification that the class system fires (telemetry)
A dev-only log line in `energy/spirit.ts` (`spirit-storm {...}`, once a minute per Spirit while in
combat; `SPIRIT_STATS_MS` shortens it for the bench): spends by piece, storm spent, storm absorbed from
hits and from damage over time, plain zaps, seconds bare / at the floor, wasted flow, procs (Marsh Fire,
Thunderhead, surge ends). Read from the lane's `server.log`. Live evidence:

TELEMETRY

## Numbers changed

| File | Name | Old | New | Why / evidence |
|---|---|---|---|---|
| `server/.../energy/spirit.ts` | `STORM_PIP` | 12 | 20 | With 48 storm the Plains boss (≈10/s on the storm) kept it empty; no spend ever fired (telemetry: `spends: {}` every window, dps 6-8, boss 84-87% left) |
| `server/.../energy/spirit.ts` | `FLOW_PCT_PER_SEC` | 0.10 of the whole bottle | 0.25 of the T1 bottle (`FLOW_BASE_PIPS` 4) | Flow 4.8/s was below every boss's pressure. And with the flow a share of the whole bottle, the Mastery pips (4 → 9 → 12 → 15) compounded it: Storm 9 at T2 refilled ~80/s against bosses landing 4-8 |
| `server/.../energy/spirit.ts` | storm tier scale | `pieceTierScale` 1 / 2.6 / 5 / 10 | `STORM_TIER_SCALE` 1 / 1 / 1.5 / 1.8 | Measured boss pressure on the storm (sim, with the monster tier factor 9a2671c8): T1 11-14/s, T2 6-18, T3 5-45, T4 16-45. On the damage curve no boss ever reached HP from T2 on; this keeps about T1's lead. Bottle, flow and costs share the scale; damage still scales through attack |
| `server/.../energy/spirit.ts` | `ZAP_SHARE` | 0.25 | 0.5 | The zaps are the only damage while the storm is under water; at 0.25 a pressured Spirit did 5-9 dps at T1. Plains boss fight 42-90 s → 32-49 s |
| `shared/.../spirit/kit.ts` | Bolt `costPips`, `mult` | 0.5, 1 | 0.75, 2 | With the faster flow, Bolt's spend rate (cap 1.4/s) was below the flow, so hover sat at full (spiritStorm test); same damage per storm (2.67 attack per pip) |
| `shared/.../configs/spirit.ts` | discipline defaults | every discipline got the T1 default (30% floor, gather) | Overflow: floor 95% (the brim, the highest allowed), hover, every band at the floor. Tide: floor 20%. Reservoir: floor 40%, Cloudburst at the 100% mark (the "enough" rule releases earlier) | Bible §11.13 defaults. Before this a player picking Overflow played the T1 default |

## Mechanics changed (for review)

1. **Flow no longer grows with the Mastery pips** (above). Pips still deepen the bottle (a bigger shield,
   bigger bursts), §11.2 "a bigger shield and bigger bursts at once". Consequence: a deep bottle takes
   longer to fill in gather (Storm 15 at T4: ~15 s from empty); Reservoir's 2x bottle twice that.
2. **Thunderclap spends only when a stagger lands.** It waited for "an enemy touching you" and then spent
   0.75 pip on a boss in its post-stun ward every 0.7 s (12 claps per 20 s in the sim). Rank II's slow
   now lands on what the clap staggers (its text).
3. **A surge (or a gather break) goes on only while some piece is in its band and its moment holds.**
   Before, "affordable above the floor" kept a Tide surge alive between the floor and the lowest band
   forever (no flow in a surge): a deadlock for any config whose lowest band sits above the floor
   (found by the Spring Tide test after the Tide floor moved to 20%). The defaults (Bolt at the floor)
   never hit it.
4. Dev-only telemetry line (no behaviour).

## Checks
CHECKS

## What is still broken or unsure

- **The storm is binary: invulnerable or helpless, rarely in between** (the conductor's finding, and the
  bible's recorded main risk). It follows from the rules: hits drain the storm before HP, the flow is
  constant, spends draw only what the flow leaves over. When the flow beats a boss's pressure the Spirit
  never loses HP and spends the surplus; when the pressure beats the flow the storm stays empty and only
  the zaps deal damage. The tuning above puts the flow about 1.5x ahead of typical boss pressure at each
  tier, so the routes pass, and the Spirit ends most boss fights at 85-100% HP (sim and live). Lowering the
  flow to make HP move flips fights to "helpless" (no spends at all) long before HP matters. No number fixes
  this; it is a design question (below).
- **Overflow and Reservoir lose to sustained pressure much harder than Tide** (sim, T2, before the
  discipline defaults: Overflow lost the Mountain and Desert bosses with 0 spends; Reservoir won them in
  158 s at 25-30 dps). Tide works because its ebb runs the flow 3x. The routes only run Tide.
  (not filled: the agent was cut off by the API usage limit; the final merged-tree runs are in OVERNIGHT-REPORT.md)
- The auto relic is always the newest trophy (common code, `defaultClassConfig`): at the control-immune
  Tundra/Volcanic bosses the Spirit wears Ice Storm / Sandstorm (slows those bosses ignore). It still wins.
- Not implemented (unchanged, not needed for the bar): Tide's drift with the tide (auto-combat
  positioning), Reservoir's "nearly untouchable" full bank, Flare's reveal, Spring Tide "the surge spends
  it all" (reads as "down to the floor"), Slipstream (empty effects).
- The route replays every earlier tier's travel steps on a resumed character (8-13 minutes before the new
  tier's first zone); harmless, slow.

## Questions for the designer

1. The storm is all-or-nothing against a boss (above). Should a hit drain the storm *and* reach HP in part
   (say the storm takes the first X% of each hit), or should the flow pause briefly under heavy pressure,
   so a pressured Spirit loses some HP while still spending? Both are rule changes, so I left them.
2. Should the flow grow with the Mastery pips (old: a share of the whole bottle) or stay the T1 flow
   (now)? Growing made the Spirit untouchable from T2 on; fixed makes deep bottles slow to fill.
3. Overflow's default floor "at the brim": the gauge caps the floor at 95%. Keep, or allow 100%?
4. Should the auto relic prefer a storm relic for Reservoir and a spend relic for Overflow/hover (§11.13
   says so), instead of the newest trophy? That is common config code, not the Spirit's.

## Files outside the brief I needed (not edited)
- None edited. `shared/src/classKits/config.ts` (`defaultClassConfig`) would own a per-discipline relic
  preference (question 4).
