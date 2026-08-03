# Core Cast and Evolution Directions

## Status

**Implementation-ready design roster.**

Names and exact values may still be tuned during implementation. Magnitudes are rough design bands rather than final balance values.

> **Tier terminology:** Player-facing tiers are used. Internal progression references may be one tier lower.

---

## Tier 2 — Unrestricted Starter Cores

### Tempered Core

- **+8–10% damage**
- **+8–10% maximum HP**
- No drawback

### Survivalist Core

- **+15–25% HP recovery**
- **+8–12% maximum HP**
- Later ranks add defensive-ability cooldown, duration, or potency

### Force Core

- **+12–15% damage**
- **-5–10% maximum HP or recovery**

---

## Tier 3 — Melee Cores

### Juggernaut Core

- **+20–30% maximum HP**
- **+25–40% plating**
- **10–15% separate Core damage reduction**
- **-15–25% attack speed**
- Optional **-5–10% movement speed**

### Bruiser Core

- **+15–25% damage**
- **+10–20% maximum HP or plating**
- **+10–15% movement speed**
- Kills refund approximately **30–50% of mobility cooldown**

### Duelist Core

- **+10–15% general damage**
- Roughly **+10% eHP**
- **+10–20% additional elite and boss damage**
- Later ranks amplify damage and defense while maintaining the same target

---

## Tier 3 — Ranged Cores

### Sniper Core

- **+20–30% damage**
- **-15–25% maximum HP**
- Optional **-10–20% plating**
- No mobility bonus

### Scout Core

- **+10–18% damage**
- **+10–20% movement speed**
- **15–25% mobility cooldown reduction**
- **-10–20% maximum HP or plating**

---

## Tier 3 — Unrestricted Specialist Cores

### Arcanist Core

- **15–20% ability cooldown reduction**
- Optional **+5–10% ability potency**
- No required basic-attack penalty; add one only if balance testing demands it

### Controller Core

- **+20–30% debuff duration**, or **+10–20% debuff potency**
- No required direct-damage penalty; specialization opportunity cost may be sufficient

### Accelerant Core

- **+20–30% attack speed**
- Optional **-10–20% attack damage** if needed to control total DPS and on-hit scaling

### Affliction Core

- **+20–30% DoT potency or duration**
- Optional **-10–20% direct damage** if needed to preserve its sustained-damage identity

---

## Tier 4 — Candidate Unrestricted Mechanic Cores

### Amplifier Core

- **+15–25% buff potency**
- Optional **+10–20% buff duration**
- Applies only to explicitly scalable buff values

### Catalyst Core

- **+20–30% on-hit potency**
- Optional **-10–20% direct attack damage**

### Heavy Core

- **+25–40% damage per attack**
- **-20–30% attack speed**
- May amplify existing plating penetration, stagger, or heavy-hit effects

### Advanced Survivalist

- **+20–30% recovery**
- **15–25% defensive-ability cooldown reduction, duration, or potency**
- Optional **-5–10% damage**

---

## Evolution Directions

These are evolution spaces, not a requirement to implement every branch.

### Tempered

- **Harmonized:** evenly improves damage, HP, plating, recovery, and movement
- Remains deliberately simple and broadly useful

### Survivalist

- **Regenerator:** stronger regeneration and healing; amplified below a health threshold
- **Guardian:** defensive-ability cooldown, duration, and potency
- **Second Wind:** deterministic defensive-skill cooldown recovery below a health threshold
- **Enduring:** recovery improves during prolonged combat

### Force

- **Potent:** greater general damage with a larger survivability cost
- **Relentless:** damage increases during continuous combat
- May remain primarily a starter Core rather than developing a large family

### Juggernaut

- **Fortress:** greater passive HP, plating, and damage reduction
- **Warden:** taunt cooldown, taunt duration, and existing ally-protection effects
- **Bulwark:** defensive-ability cooldown, duration, and potency
- **Colossus:** slower attacks with existing attacks or abilities scaling more strongly from HP or plating
- **Unyielding:** defensive cooldown and recovery amplification at low health or under sustained pressure

### Bruiser

- **Charger:** larger mobility refund on kill and stronger post-mobility stats; a late rank may fully reset mobility on kill
- **Reaver:** recovery, damage, and movement amplified after kills
- **Mauler:** slower attacks, greater hit damage, and stronger existing plating penetration
- **Pursuer:** mobility recovers faster while no target is within attack range
- **Rampager:** deterministic damage and movement scaling during a kill chain

### Duelist

- **Champion:** reliable elite and boss offense and defense
- **Executioner:** damage amplification as the current target loses health
- **Stalwart:** greater protection from the current target and stronger defensive abilities
- **Focused:** faster or higher same-target amplification
- **Pursuer:** retains same-target benefits briefly through forced repositioning

### Sniper

- **Longshot:** damage increases across fixed distance bands
- **Deadeye:** amplifies existing single-target, elite, boss, or heavy-hit mechanics
- **Artillery:** amplifies existing AoE damage, radius, or target count once AoE rules are established
- **Entrenched:** damage increases while maintaining distance or avoiding mobility use
- **Glass Cannon:** maximum damage with a larger eHP penalty

### Scout

- **Skirmisher:** damage, attack speed, or ability potency amplified after mobility use
- **Pathfinder:** maximum movement and mobility cooldown support with a lower damage ceiling
- **Harrier:** amplifies existing slows and damage against slowed targets
- **Elusive:** defensive or mobility abilities gain greater duration or potency after repositioning
- **Pursuit:** mobility recovers faster when the target is outside attack range

### Arcanist

- **Invoker:** maximum general ability cooldown reduction
- **Overcharger:** greater ability potency with less emphasis on cooldown frequency
- **Technique Specialist:** technique cooldown and potency
- **Guard Specialist:** defensive-skill cooldown and potency
- **Resonant:** ability cooldowns or potency improve while other abilities are already on cooldown

### Controller

- **Suppressor:** amplifies enemy damage or attack-speed reductions
- **Binder:** amplifies existing slows, roots, and control duration
- **Hexer:** amplifies existing vulnerability, plating reduction, or resistance reduction
- **Persistent:** substantially greater debuff duration
- **Intensifier:** greater debuff magnitude
- **Saturation:** potency increases with the number of existing debuffs on the target

### Accelerant

- **Flurry:** highest stable attack speed
- **Rampage:** deterministic attack-speed ramp during uninterrupted attacks
- **Tempo:** every N attacks reduces existing ability cooldowns
- **Overclock:** extreme speed with defensive or recovery penalties
- **Precision Engine:** amplifies existing on-hit application or potency

### Affliction

- **Potent:** greater DoT damage
- **Lingering:** greater DoT duration
- **Saturating:** increases an existing stack limit
- **Concentrated:** stronger individual stacks for slower application builds
- **Patient:** DoT potency increases with time on the same target
- **Virulent:** amplifies an existing spread or refresh mechanic but does not create one

### Amplifier

- **Exalted:** maximum buff potency
- **Sustained:** greater buff duration and uptime
- **Fortified:** stronger existing defensive buffs
- **Resonant:** cooldown recovery or ability potency improves while self-buffed

### Catalyst

- **Resonant:** amplifies combinations of existing on-hit effects
- **Shattering:** amplifies existing plating-reduction on-hit effects
- **Leeching:** amplifies existing on-hit recovery
- **Charged:** strengthens an existing every-N-hits mechanic

### Heavy

- **Crusher:** amplifies existing plating penetration or stagger
- **Executioner:** greater elite, boss, or low-health target damage
- **Titan:** existing attacks or abilities scale more strongly from HP or plating
- **Siege:** amplifies existing AoE or multi-target heavy attacks once AoE rules are established

---

## Deferred

- Dedicated AoE Core family
- Summon-specific Core family
- Party-exclusive Core category
- Transformative Cores that create new combat loops
- Exact formulas and final numerical values

AoE, summon, and party Cores should be added only after their underlying systems are mature, and should amplify those systems rather than create them.
