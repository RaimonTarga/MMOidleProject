## Defense pipeline fixes

- **Guard now protects your shields.** Brace, Endure and other Guards reduce a hit before
  wards and barrier absorb it, so shields last longer. Guards no longer reduce damage-over-time
  ticks.
- **Damage debt is paid in four one-second installments.** Deferred damage (Swamp,
  Graveyard, Apprentice) is split evenly over the next four seconds and keeps fractions.
  Resistance is fixed when the debt is taken, so swapping gear afterward doesn't reprice it.
  Forgiven debt stays forgiven.
- **General damage reduction applies in full to monster damage-over-time** (it used to count
  half).
- **Class and item damage reduction multiply instead of adding.** With 20% from your class
  and 10% from gear, you take 0.8 × 0.9 = 72% of the damage, not 70%.
- **Monster splash damage is now defended like a normal hit.** It can be evaded, and wards,
  barrier and debt apply. Environmental hazards also drain wards and barrier.
- **Conduit:** summons take their share of your damage after your shields and before damage
  debt. Splash that hits you is not redirected to summons.
- Damage absorb now counts only damage that reached your health, up to your current HP.

## Armor, core and class defense rework

Plating (flat reduction per hit) is now a specialist stat. General damage reduction (DR) is the
common defense layer.

- **Armor families:**
  - **Plains, Mountain, Tundra, Volcano:** keep plating as a specialty, at reduced amounts, plus
    some DR.
  - **Jungle and Desert:** keep a smaller amount of plating.
  - **Forest, Cave, Swamp, Graveyard, Trench:** plating replaced by DR and extra health.
- **Cave** is the dependable DR armor: 10% / 18% / 26% at T1 / T2 / T3, plus 0.8% per upgrade.
- **Jungle** evasion is stronger from T2 on: each evade softens the hit more.
- **Desert** trades its last-stand effects (cheat death, automatic cleanse, debuff resistance) for
  six seconds of opening protection. It's triggered by the first attack you make or take and
  rearms after six quiet seconds.
- **Tundra**'s stationary protection now builds only while you stand still in combat. It builds
  over 3 seconds, drops within a second of moving, and stacks with your other damage reduction.
- **Volcano** hardening builds more slowly and needs enemies attacking you. A single big hit
  (25% of max HP or more) cracks half of it, even through shields.
- **Lava-Tempered** overheal wards are capped at 15% of max HP.
- **Plaguebound Mantle** gains temporary plating each time you're hit (up to 10).
- **Cores:**
  - Force, Scout and Sniper no longer cost health or plating. Scout is now +18% damage and
    Sniper +30%.
  - Juggernaut is +20% HP, +10% plating and 10% less damage taken, down from +30% / +40% / 14%.
- **Class roots:**
  - Squire and Striker trade most of their root plating for damage reduction (28% and 18%).
  - Apprentice converts 15% of direct hits into delayed damage (was 10%).
  - Slinger's evade mitigation is +10 points (was +20).
- **Stances:** Defensive and Tanking Stance no longer add plating. Their damage-taken reduction
  is unchanged.
- **Charged and empowered monster attacks** now subtract your plating once, from the full hit.
  Before, plating was also multiplied by the charge, so big telegraphed hits land harder than
  before on high-plating builds.
