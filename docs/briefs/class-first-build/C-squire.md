# C-squire: the Squire's Tier 1 track (Phase 1, second class)

**Owner:** the conductor for CQ.1–CQ.4; delegates for CQ.5–CQ.7 (briefs written when CQ.2
lands). **Spec:** bible §8 (Locked); the kit `shared/src/classKits/squire/`; the Response rules
config `shared/src/classKits/configs/squire.ts`. The moments it answers are all implemented
(F6, S2).

## What exists and what it becomes

| Today (`server/src/systems/classes/archetypes/cooldown/`) | Becomes |
|---|---|
| `usesCooldown`: a 7 s timer arms the execution (×2 empowered hit) | **Resolve**: a bar of pips (the budget) filled by raw hits, a pressure trickle and landed answers; a full bar arms the **slam** (the empowered swing, splashing everything around you) |
| `frameLoop.ts`, `t3/` (Warrior, Bulwark, Destroyer, Reverb, Overdrive, Battery...) | Deleted in CQ.7 (inert since F4) |
| The Taunt and Ready Execution runes, the shared guards | Responses in the Response rules |

## The runtime (CQ.1, CQ.2)

- **Resolve** on `usesCooldown` (`resolve`, `resolveMax`; `executionCooldownPct` mirrors the bar
  so today's HUD dial shows it until CQ.5). Fills: a landed monster hit adds its raw size
  (pre-armor) as a share of max HP, a pressure trickle per enemy on you per second (a boss
  counts as several), and the refunds of landed answers. DoT ticks don't fill (Rot-Eater
  changes that). Capped at `resolveMax` (the class budget: 4 → 6 in T1).
- **The slam** arms at a full bar unless `holdSlam` holds (never early). It is the empowered
  swing: the target and everything around you take it; it spends the whole bar.
- **Responses**, each on its natural trigger (`answers`, a moment) plus the rule's conditions
  (`resolve-at-least` answered by the runtime): Shove (three or more enemies on you: push them
  back; lands if it moves three), Riposte (the third hit in a row from one enemy: strike it
  back), Steel Will (a poison or bleed lands: shake it off), Guard (a telegraphed blow aimed at
  you: brace; caught, it deals much less), Shield Bash (the enemy you fight winds up: stun it,
  interrupting the cast; fails on what can't be interrupted). Each costs Resolve and refunds
  more when it lands; a wasted one loses its cost. An event answers once.
- **T1 trophies**: Muster (an enemy joining fills Resolve), Relentless (an early slam at a third
  of the bar, a third the size, chaining bigger), Rot-Eater (poison and bleed on you fill),
  Faultline (the slam runs as a line through the target), Corrode (each slam strips plating).
- Every number is a placeholder in the kit's `params` (responses, slam, trophies) or the
  Resolve constants in `configs/squire.ts`.

## Gear (CQ.4)

Weapons: Flanged Mace (wider slam), Arming Sword (counters hit harder), Spiked Flail (the slam
bleeds), Warhammer (a bigger slam; much bigger soon after a caught telegraph), Tower Shield
(Shield Bash costs half and stuns longer). Lines: Rampart, Turn Aside, Iron Gut, Planted,
Reforged; Breather, Counterbalance and Stone Patience (Recovery: S4), Purifying Breath, Old
Guard (an in-combat Recovery share: `defense.recovery-active-pct`).

## Delegates (CQ.5–CQ.7)

The Response rules editor and the Resolve pips on the HUD, callouts ("GUARDED",
"INTERRUPTED", the relic slam); the tutorial script and the `squire-t1` bot route; deleting
the frame loop and the T3 paths.
