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
