# V1n biome audit — Volcano and Tundra

2026-09-14. Read-only gameplay audit of [V1n](bot-balance-v1n-report.md).
Execution source `1cb668fd0b3c0a2720bed5d963831f32073025d7`; audited HEAD
`abbc776c`. No intervening changes in the inspected monster, feature or server
system paths. All 48 artifact hashes in the report ledger match retained files.
No simulation, bot run, gameplay fix or balance change was made for this audit.

## Decision

The evidence supports targeted biome investigation, not another unchanged
campaign run. Volcano failed under pack pressure; Tundra failed to three ordinary
bear hits. Both entered the target fight at full HP and full barrier. Guards
activated in both fatal fights, so exhausted transit resources are not the cause.

There is still a material movement uncertainty: the retained artifacts do not
record player/target positions, live Orbit decisions or ambient stacks in these
normal-mob encounters. A build-pass does not prove correct kiting execution.
Do not assume either perfect bot behavior or pure overtuning. Resolve that
uncertainty in short instrumented encounters before selecting balance numbers.

## Volcano reconstruction

Target `node-t3-volcanic-01`, Alacrity. Times below are run-relative seconds.

| Time | Observed event |
|---:|---|
| 91.581 | Full HP; no attackers in sampled state |
| 93.005 / 93.583 | Sweep; five attackers sampled, still full HP |
| 95.607–97.808 | Scuttler hits absorb 29, 31, 31 and 31; HP remains236 |
| 98.608 | Remaining10 barrier absorbed,21 HP damage |
| 99.409–101.609 | Repeated33 HP hits; Sweep at99.008; Second Wind at101.009 |
| 101.810 | Brace activates |
| 102.210–102.611 | Scuttler20 hits and Hound32 hit continue through protection |
| 102.831 | First kill, Ember Scuttler |
| 104.808 | Authoritative lethal Cinder Hound melee59 |

Five simultaneous attackers is observed; 39 monsters in the node is population,
not 39 attackers. Six sampled target switches occurred, including repeated
switches between two targets before the first kill. This may delay removing a
body; the samples do not establish wasted attacks or a targeting defect.

Source context: Scuttler has1220HP,55 attack,64 speed,1600ms cadence; Hound has
1440HP,80 attack,70 speed,1300ms cadence and an engagement charge. They also
participate in packs. One Hound plus two Scuttlers already has3880 raw HP before
mitigation; these are substantial bodies for a fresh T3 character to remove
while several attack. The current source already includes prior ordinary-attack
reductions, so “all mobs still have their old damage” would be inaccurate.

T3 Alacrity multiplies attack interval by0.85 and movement by1.15; it adds no
per-hit attack damage. Scuttler/Hound intervals become1360/1105ms, and speeds
73.6/80.5 before the Hound charge. This compounds pack pressure without requiring
the separate Swarming node modifier. The exact five-actor composition and which
pack linkage recruited each attacker are not retained.

Heat authors one stack immediately on entering combat, then another every3s,
up to6. Each adds5% outgoing damage and8% incoming damage: maximum+30% dealt,
+48% taken. Leaving combat/node decays stacks rather than instantly clearing them.
Vents can accelerate buildup; none was observed here.

Heat is a strong numerical inference, not a captured stack history: against the
recorded18 plating/19%DR and Defensive stance, the ordinary Scuttler baseline
is27 after rounding. Multipliers1.08/1.16/1.24 produce29/31/33, matching the early
observed sequence and approximately the authored ramp timing. This is much
stronger than “Heat might exist,” but still does not measure a Heat-off outcome.

Diagnosis: pack durability, sustained multi-attacker contact, Alacrity and Heat
compound. Lava did not cause this death. Guard use helped but did not remove
enemies quickly enough. Prioritize pack time-to-first-kill and incoming pressure
together; changing only attack may leave the same prolonged multi-attacker trap.

## Tundra reconstruction

Target `node-t3-tundra-01`, Heavy. One attacker throughout sampled target combat.

| Time | Observed event |
|---:|---|
| 196.582 | Full HP, no attackers yet |
| 197.457 | Sweep activation |
| 199.857 | Bear hit:132 absorbed +31 HP damage;236→205HP |
| 203.459 | Second Sweep |
| 204.460 | Bear hit:19.8 absorbed +143.2 HP damage;207.169→63.969HP; Second Wind activates |
| 204.659 | Brace activates |
| 208.462 | Last retained HP sample147.811 |
| 208.568 | Authoritative lethal bear melee149.767 |

The first two hits each total163 after mitigation and before barrier/ward
absorption. Heavy explains this without any Chill damage amplification:
185 base attack ×1.30 rounds241; subtract18 plating, apply19%DR, round181;
Defensive stance ×0.9 rounds163. Without Heavy that same calculation yields122.
Thus Heavy raises this particular mitigated hit about34%, not merely a small
cosmetic difficulty change. Its nominal cadence becomes3680ms versus3200ms;
observed contacts were4.603s and4.108s apart, so do not claim it attacked exactly
on cooldown.

Brace's default trigger is below50% HP, with a3s window through rankIII and
3.5s at rankIV. It activated after the second hit; even the longest authored
window ends before the third hit3.909s later. This is a timing mismatch, not a
failure to activate. The final149.767 is the death cause's HP-damage value;
the final detailed mitigation event is absent, so do not reverse-engineer its
remaining absorption or infer that the base swing changed.

Glacier Bear has1500HP,14%DR and a20%-HP Ice Armor shield every11s for6s, with
shield-break payoff. Its ordinary hit is not a telegraphed new ability. No
Step Back activation is therefore unsurprising and does not prove a dodge bug.
The run dealt1034 attributed damage to the bear without killing it. Shield
timing and remaining enemy HP are not available; damage dealt alone is not
equivalent to net HP removed.

Chill authors one stack immediately, then every4s to6: up to30% movement loss
and24% added attack cooldown (about19.4% fewer attacks per second, not24%).
Glacier Bear has no ambient-damage scaling; Chill can prolong contact/kill time,
but does not directly explain its163 hit. At full authored Chill the entry's
187 speed would still be130.9 before other movement effects. However, the
initial audit incorrectly compared that against the bear's base22 speed without
the global anti-kiting ramp. Following the user's correction, source inspection
confirms a500ms chase grace, then a150 minimum speed and uncapped ramp at1.5
multiplier per second of excess chase. The timer decays at2x while in attack
reach; it does not immediately reset on a landed hit. Repeated contact is thus
plausible without a bot defect. Historical ramp values, geometry and motion are
unobserved. Hamstring slows movement after the ramp; Desert Boots add conditional
speed while moving away from the engaged target. Neither guarantees permanent
separation. Sweep is armed, not a ranged cast that itself roots the player.

Both Heat and Chill are classified as harmful ambient statuses and are eligible
for Cleanse. That does not make Cleanse a proven solution: rank, stacks removed,
reapplication and cooldown matter. Do not restrict future Cleanse reasoning to
discrete monster slows, or claim it was required here without a test.

## Evidence corrections and boundaries

- `totalHealed` combines heal, ward-gain and absorb in the recorder. It is not
  net HP restored. The death windows label absorption as heal with unchanged HP.
  Do not use those totals for sustain/DPS balance calculations.
- Tundra6350 player damage is run-wide, including1034 to Glacier Bear. The
  other5316 is attributed to transit enemies. The operator report's wording
  placing all6350 before target entry is inaccurate; its five kills were transit.
- Incoming summary totals omit the final lethal hit in these retained traces.
  Volcano265 and Tundra334.53 are not complete delivered-damage totals through
  death. Preserve the separately recorded death cause rather than replacing it
  with stale `killingBlow` or adding values without explaining the boundary.
- Boss-only range diagnostics do not provide ordinary-mob position histories.
  No live lava-fix verdict, equal-mastery biome ranking or ordinary economy
  conclusion follows. Synthetic entry/reward25 taints remain.

## Next work — superseded by the prepared V1o packet

[V1o operator packet](bot-balance-v1o-operator-packet.md) is authoritative for
the prepared diagnostic scope. No combat cases have been run in preparation.

First instrument a short ordinary-mob diagnostic to retain positions, hitbox gap,
target/aggro IDs, actual move destination and motion, winning Rune/movement
owner, ambient stack/payload, ability rank/timers, HP/barrier/wards and complete
damage events through death. Use authoritative normal combat and movement.
Reset each diagnostic to identical full-health/full-barrier starting progression;
ordinary1x rewards remain inside the encounter and progression changes are logged.
These are diagnostic fixtures, not
legitimate progression checkpoints or canonical economy runs.

Keep Wisp for the initial reconstruction so branch changes do not hide the
failure. The user's medium-range baseline applies to subsequent validation;
select it ordinarily in a separately qualified preparation, never by editing
the saved Wisp snapshot.

Bound the first diagnostic matrix to eight60-second encounters, no retries:

1. Volcano: one Scuttler, Heat off/on; fixed Hound+two-Scuttler pack, Heat off/on.
   Keep Alacrity, build, placement and seeds paired. This isolates body count
   and ambient contribution while logging contact and time-to-first-kill.
2. Tundra: one Heavy Glacier Bear with Chill active: control, Hamstring,
   T2 Desert Boots+5, both. Anti-kiting remains unchanged in all eight arms.
   This replaces neutral/Heavy × Chill off/on after the user's mechanics reminder.

Use real target-node geometry, fixed simultaneous engagement and no lava or
repopulation. Failure to maintain separation alone is not a behavior defect:
first inspect pursuit speed, slow uptime, boot activation and movement decisions.
These fixtures do not establish natural pack recruitment or farming viability.
If multi-attacker pressure remains excessive with functional movement, propose
Volcano filler-HP/pack-pressure changes before compensating with exotic builds.
If ordinary Heavy bear hits still dominate with functional movement, propose
its base-attack reduction separately from Chill tuning. Preserve biome identities;
do not reduce attack, HP, density and ambient ramps all in one unidentifiable pass.

No percentage nerf is justified precisely enough yet. The next deliverable should
be that diagnostic evidence and a small concrete tuning proposal for user approval,
then natural farming/recovery validation. No manual playtest is required from the
user to perform this work. Other T3 exploration can continue separately, without
calling Volcano/Tundra validated or silently bypassing their bosses.

## Source anchors

- Monster authoring: `shared/src/data/monsters/volcano.monsters.ts`,
  `shared/src/data/monsters/tundra.monsters.ts`.
- Modifiers/spawn: `shared/src/world/nodeModifiers.ts`,
  `server/src/systems/world/spawning/index.ts`.
- Ambient behavior: `shared/src/world/nodeFeatures.ts`,
  `shared/src/systems/ambientRamp.ts`, `server/src/systems/world/nodeFeatures.ts`.
- Damage: `server/src/systems/combat/engine/combat.ts`,
  `shared/src/systems/finalDamage.ts`, `shared/src/stances.ts`.
- Guards and cleanse: `shared/src/abilities.ts`, `shared/src/systems/monsterDebuffs.ts`.
- Kiting/recovery: `server/src/systems/combat/ai/autoTarget.ts`,
  `server/src/systems/combat/ai/runeConfig.ts`, `server/src/systems/combat/ai/ai.ts`,
  `server/src/systems/world/movement.ts`, `server/src/systems/world/mobility/mobilityBoots.ts`.
- Telemetry limitations: `bot/src/telemetry/recorder.ts` and `summary.ts`.
