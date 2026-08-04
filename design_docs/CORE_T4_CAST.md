# Core Cast — Tier 4

## Status

**Design draft for review.** Extends `CORE_CAST_REVIEW_DRAFT.md` with the T4 tier and
supersedes its "Tier 4 — Candidate Unrestricted Mechanic Cores" and "Evolution
Directions" sections where they disagree.

Live T2/T3 state: `docs/cores-current-state.md`. Numbers are **not** in this document —
it specifies identities, hooks, and implementation cost. The balance pass is separate.

---

## 1. Shape

T4 is the first tier where the locked growth model is exercised: **a core evolves into
one of two named branches — one evolve, one decision.** T2 starters and T3 cores are
all base recipes today, so nothing has branched yet.

- The **nine T3 cores** each fork two ways. 18 recipes.
- **Survivalist** (T2) gets a single branch, because the cast doc's "Advanced
  Survivalist" is that branch rather than a separate core. 1 recipe.
- **Tempered and Force are terminal.** Philosophy §11 makes the generalist a benchmark
  that should not outperform a mature specialist; the T3 cast already supersedes them.
- One **net-new base core** (§3). 1 recipe.

**20 recipes total.** Branches inherit their parent's eligibility.

---

## 2. Branches

Cost is against the engine as of the 2026-08-03 rework. "Free" means the key exists and
is already consumed; the core only has to author it.

### Melee

**Juggernaut** — the tank deepens, or starts hitting with its own bulk.

| Branch | Hook | Cost |
|---|---|---|
| **Fortress** | More HP, plating, DR layer. The pure wall. | Free |
| **Colossus** | Attacks scale from maxHp / plating. Slower still. | New stat→damage key |

*Colossus is the only branch that changes how a Juggernaut's damage is computed rather
than how much of it there is. It is also the one place a defensive stat is allowed to
buy offence — worth watching against the ability-design axiom, which forbids the reverse.*

**Bruiser** — the kill chain, or the gap close.

| Branch | Hook | Cost |
|---|---|---|
| **Reaver** | Kills stack damage + move speed for a window. | Cheap — onKill + status, the mobility-boot pattern |
| **Charger** | Larger mobility refund; a late rank **fully resets** it on kill. | Free (`core.mobility-refund-on-kill-pct`) + a reset flag |

*Charger is the payoff for Bruiser's signature clause, so it stays even though only
Charge carries the `mobility` tag today.*

**Duelist** — finish it, or wear it down.

| Branch | Hook | Cost |
|---|---|---|
| **Executioner** | Damage rises as the target's HP falls. | **Free** — `weapon.execute-threshold-pct` / `weapon.execute-dmg-mult` already exist and are consumed |
| **Focused** | Damage ramps with hits landed on the same target. | Cheap — `hitsReceived` counter already exists |

*Focused caveat: `hitsReceived` is global per-monster and never resets, so party members
share the ramp and it reads as "how worn down is this target" rather than "how long have
I focused it." That is arguably the better idle semantic, but it is a design choice, not
an accident — decide it deliberately.*

### Ranged

**Sniper** — reach, or recklessness.

| Branch | Hook | Cost |
|---|---|---|
| **Longshot** | Damage rises across fixed distance bands. | Cheap — both positions are in hand at hit time |
| **Glass Cannon** | Maximum damage, larger eHP penalty. | Free |

**Scout** — reposition into damage, or into control.

| Branch | Hook | Cost |
|---|---|---|
| **Skirmisher** | Damage/attack-speed window after using a mobility ability. | Medium — needs a hook at ability fire |
| **Harrier** | Amplifies slows, and damage against slowed targets. | Cheap-ish — slow potency already rides the debuff registry |

### Unrestricted

**Arcanist** — more casts, or bigger ones.

| Branch | Hook | Cost |
|---|---|---|
| **Invoker** | Maximum Technique cooldown reduction. | Free |
| **Siege** | Scales Technique **AoE radius and damage**. | Cheap — `applyPlayerAoe` is the single funnel |

> **Departure from `CORE_CAST_REVIEW_DRAFT.md`:** that doc puts Artillery under Sniper.
> AoE in this game is overwhelmingly a Technique payload (Sweep's cleave, Charged Strike),
> so the Technique core is the tighter magnifier relationship — and Arcanist is
> unrestricted, so melee density builds can reach it. Under Sniper it would be `ranged`
> and melee would have no AoE core at all. This displaces **Overcharger**, which was the
> weaker of Arcanist's two proposed branches (it and Invoker are both "ability numbers up").

**Controller** — longer, or stronger.

| Branch | Hook | Cost |
|---|---|---|
| **Persistent** | Substantially greater debuff duration. | Free |
| **Saturation** | Potency scales with how many debuffs the target already carries. | Cheap — count registered debuffs on the target |

**Accelerant** — pure speed, or speed as a resource.

| Branch | Hook | Cost |
|---|---|---|
| **Flurry** | Highest stable attack speed. | Free |
| **Tempo** | Every N attacks reduces ability cooldowns. | Medium — counter + cooldown poke |

**Catalyst** — on-hit as damage, or as sustain.

| Branch | Hook | Cost |
|---|---|---|
| **Charged** | Strengthens existing every-N-hits mechanics. | Medium |
| **Leeching** | On-hit also heals. | Cheap — `applyHealToPlayer` is a single funnel |

**Survivalist** (T2 parent)

| Branch | Hook | Cost |
|---|---|---|
| **Advanced Survivalist** | More recovery + Guard cooldown / duration / potency. | Free (`core.recovery-mult` + `guard.*`) |

> **Budget note.** The cast doc lists a "Guard Specialist" branch under Arcanist *and* a
> "Guardian" under Survivalist — the same item twice. Arcanist is deliberately
> Technique-only so one item can never buy both offence and defence; putting the Guard
> budget under **Survivalist** keeps that separation instead of reintroducing it a tier
> later.

---

## 3. Net-new base core

### Empowered Core *(unrestricted)*

**+X% to your class's empowered attack**, whatever that is.

Philosophy §5 asks T4 to interact with the chosen Path, and there are **53 Paths** — a
bespoke core each is impossible, so compatibility has to key off a mechanic *family*.
There is already one that spans four of the six classes and is already consumed:

```
weapon.empowered-mult-bonus   // +X% to the empowered multiplier, regardless of the
                              // spec's base — so every spec gains the same percentage
```

Cadence's finisher, Cooldown's execution, Reload's last bullet, Energy's discharge. One
key, four classes, no new code. Its opportunity cost is structural and clean: it does
nothing for DoT or Summoner, and little for a build whose empowered beat is rare.

**Cost: free.** This is the cheapest core in the entire system and the only one that
speaks to Paths broadly.

---

## 4. New passive keys

Everything else in §2 authors keys that already exist.

| Key | For | Notes |
|---|---|---|
| `core.hp-to-attack-pct` / `core.plating-to-attack-pct` | Colossus | Defensive stat → offence; the one sanctioned direction |
| `core.kill-stack-damage-pct` / `-speed-pct` / `-ms` / `-max` | Reaver | Reuses the mobility-boot on-kill buff machinery |
| `core.mobility-reset-on-kill` | Charger | `1` = full reset instead of a fraction |
| `core.same-target-per-hit` / `core.same-target-max` | Focused | Reads the existing `hitsReceived` counter |
| `core.distance-damage-per-band` / `-max` | Longshot | Fixed bands, not continuous — idle determinism |
| `core.post-mobility-*` | Skirmisher | Needs an on-fire hook that does not exist yet |
| `core.vs-slowed-damage-mult` | Harrier | |
| `core.aoe-radius-mult` / `core.aoe-damage-mult` | Siege | Applied in `applyPlayerAoe` |
| `core.debuff-count-scaling` | Saturation | |
| `core.every-n-attacks-cdr-ms` / `-interval` | Tempo | |
| `core.onhit-lifesteal-pct` | Leeching | Routes through `applyHealToPlayer` |

---

## 5. Still blocked at T4

| Item | Why |
|---|---|
| **Amplifier (buff potency)** | There is no unified buff-magnitude field — every mechanic reads its own keys. This is a subsystem, not a core, and it should stop being planned as one. |
| **Warden / any threat core** | No taunt system exists beyond the `taunt-current-target` rune. |
| **Summon cores** | The `summoner.*` keys would make this nearly free, but `CONDUIT_ENABLED` is false outside dev — it would ship as content no player can reach. |
| **Heavy Core** | Dropped, not blocked. Its identity (big slow hits) is now covered by Juggernaut→Colossus and by Accelerant read in reverse; a third "trade speed for size" core would be redundant. |

---

## 6. Open questions

1. **Does Focused's ramp reset on target switch?** The existing counter says no. Decide
   whether that is the design or a limitation to work around.
2. **Should any T4 branch narrow its eligibility?** e.g. Longshot as far-only. The
   current model has no way to express it — `coreEligibility` is a single category with
   no narrowing field, which was a deliberate simplification at Phase A.
3. **Do branches themselves rank?** Currently a branch is terminal. If T5–T6 land, they
   need either a second branch layer or linear ranks on top.
4. **Icon load.** 20 more cores on top of the 12 unillustrated ones is a 32-icon
   PixelLab pass.
