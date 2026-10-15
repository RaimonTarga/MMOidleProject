# C-slinger: the Slinger's Tier 1 track (Phase 1)

**Owner:** the conductor for CL.1–CL.4; delegates for CL.5–CL.7 (briefs when CL.2 lands).
**Spec:** bible §10 (Locked); the kit `shared/src/classKits/slinger/`; the Loadout config
`shared/src/classKits/configs/slinger.ts`. Moments it reads: all implemented (F6, S2).

## What exists and what it becomes

| Today (`server/src/systems/classes/archetypes/reload/`, `shared/src/systems/stats.ts` §3b) | Becomes |
|---|---|
| A clip (`usesReload.ammo` / `ammoMax`) and a reload (`reloadingMs`), moving freely while reloading | Kept; **the reload is stationary** by default (the class's risk window; Quickdraw lets you walk at half speed) |
| "2× attack speed at 65% attack": the reload archetype's final stat layer (`SLINGER_DIRECT_ATTACK_EFFECTIVENESS`, the ×0.5 cooldown) | **Fire rate is its own stat**, set by the gun (with the clip size and reload time); the layer goes. Animation and sound carry the fast feel. Recalibrate against the Striker's T1 power (Q4) |
| Every Slinger shot pays half plating | Moves to the **Breaching** clip type |
| `frameLoop.ts`, `t3/` (Duelist, Laser, Snipe, Cannon, Blunderbuss, Kill chain...) | Deleted in CL.7 |
| Runes driving reloads (tactical reload) | The Loadout's clip rules and free reload rules |

## The runtime (CL.1, CL.2)

- **The clip type** loaded at each reload: the Loadout's clip rules pick it for the situation
  (moments: three or more enemies → Scatter, an elite → Breaching, else plain). Every round of
  the clip carries that type's effect; typed rounds trade some raw damage (a placeholder
  share, as the Striker's price). **The plain clip is the damage clip.**
- **Per-round effects build to a cap** (Snare's slow, Stopping's shove, Venom's poison stacks):
  fire rate buys how fast you reach it, not how high.
- **The last round is the relic:** the equipped trophy round fires as the clip's last shot
  (Stampede, Twin, Rot, Quake, Splinter at T1); a plain last round before the first boss.
- **Switch reloads:** a rule may dump the clip early to load a better one (rounds lost, a
  stationary reload).
- **Free reload rules:** reload early when nothing threatens you; never start one inside a
  telegraph (defaults).
- **HUD data:** the loaded clip type and the next one on `usesReload`, for the ammo ring (its
  colours are in ICONS-T1: plain gunmetal, Scatter amber, Snare teal, Venom acid green,
  Stopping cobalt, Breaching ember red; trophy rounds gold).
- **Budget:** rack slots (1 → 2 at Mastery 15 → 3 at 30 in T1), double loads from T3.

## T1 clip types and trophy rounds (CL.2)

Scatter (each round nicks up to two enemies beside the target), Snare (slows movement and
attacks a little per round, to a cap), Venom (a poison per round), Stopping (shoves the target
back a little per round), Breaching (ignores most plating). Trophies: Stampede Round (knocks the
target and a line behind it back), Twin Round (fires twice), Rot Round (rots, hitting again),
Quake Round (hits everything around the target), Splinter Round (splits into three at the
nearest other enemies). Reuse: the Striker's `applyBleed`-style rot, `applyKnockback`,
`applyMonsterSlow` (with `attackSlowPct`), `applyPlayerAoe`.

## Gear (CL.4)

Guns: Plain Pistol, Pepperbox, Carbine, Snakebite Pistol, Hand Cannon, Drum Gun (their fire rate,
clip and reload are the gun's stats, plus one job). Lines: Elbow Room, Quickdraw, Oilskin, Dig In,
Hunker; Breathing Room, Fleet and Snake Oil and Regroup (Recovery: S4), Bivouac
(`defense.ooc-recovery-pct`).

## Delegates (CL.5–CL.7)

The Loadout editor (the rack and clip rules) and the ammo ring; the tutorial script and the
`slinger-t1` route; deleting the frame loop and T3 paths.

## Risk

The fire-rate change moves the Slinger's whole T1 power curve: measure it with the bench
(`pnpm bench:server`) against the Striker before and after, and flag the numbers to the
designer rather than tuning them.
