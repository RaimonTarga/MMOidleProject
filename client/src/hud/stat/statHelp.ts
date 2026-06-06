// Central explanatory copy for the Character panel's stat rows. Keyed by a
// stable id (core stats use short keys; passives use their passive id). Kept in
// one place so the wording — especially the load-bearing math nuances — stays
// consistent and is easy to edit.

export const STAT_HELP: Record<string, string> = {
  // ── Core ──────────────────────────────────────────────────────────────────
  hp: 'Your health. At 0 you die and respawn at the clearing, leaving a corpse at the death site. Bar layers: blue strip above = shield; red = HP that pending damage (damage-over-time + deferred debt) will remove; dark green = healing queued from regen/absorb.',
  attack:
    'Base damage per hit before the target’s defenses. Final hit = (Attack − their Plating) × (1 − their Damage Reduction), floored at 1.',
  dps:
    'Estimate = Attack × Attacks-per-second, before enemy mitigation. A planning number — real output varies with positioning, procs, and enemy defenses.',
  atkSpeed:
    'How often you attack, shown as attacks-per-second and the cooldown between swings. Attack-speed bonuses add up, then set cooldown = base ÷ (1 + total).',
  plating:
    'Flat damage removed from every incoming hit, subtracted BEFORE damage reduction. Best against many small hits, weak against a few big ones. Does not reduce damage-over-time at all.',
  damageReduction:
    'Percentage of damage removed, applied AFTER plating. Full value against direct hits, but only HALF value against damage-over-time (which also ignores plating entirely).',
  attackRange:
    'How far you can attack from. Sets melee vs ranged positioning and where auto-combat stops approaching.',
  speed: 'Movement speed (pixels/second). Affects chasing, kiting, and escaping.',
  hpRegen:
    'Health restored per second. Only applies out of combat unless you have an in-combat regen passive.',

  // ── Evasion ───────────────────────────────────────────────────────────────
  dodgeRate:
    'Chance to dodge a hit. Deterministic, not random — sources combine so 20% reliably fires every 5th hit.',
  evadeMitigation:
    'How much of a hit a dodge removes. A dodge isn’t always a full block — by default it avoids half the damage unless boosted.',

  // ── Defense passives ────────────────────────────────────────────────────────
  'defense.in-combat-regen-pct':
    'Fraction of your HP regen that keeps working while in combat (normally regen pauses in combat).',
  'defense.regen-burst-pct': 'Heals a burst of max HP on a fixed timer while fighting.',
  'defense.shield-pct':
    'Periodically grants a temporary shield worth a % of max HP that absorbs damage before your health does.',
  'defense.absorb-pct':
    'Diverts part of incoming damage into a pool that heals back over time. You still take the hit, then recover some of it gradually.',
  'defense.dot-resistance':
    'Reduces damage-over-time specifically, stacking on top of the half-value DR that already applies to DoT. Capped at 90%.',
  'defense.hit-to-dot-pct':
    'Defers part of each incoming hit into a “damage debt” that ticks onto you over time instead of all at once (drains 25% of the pool per second). Softens burst — it doesn’t remove the damage.',
  'defense.debuff-resistance': 'Shortens and weakens non-DoT debuffs such as slows and roots.',
  'defense.cleanse-stacks': 'Periodically strips debuff stacks off you on a timer.',
  'defense.max-hit-pct':
    'Caps a single hit relative to your max HP, shaving the excess off very large hits.',

  // ── Mobility passives ────────────────────────────────────────────────────────
  'mobility.ooc-speed-pct': 'Extra move speed while out of combat — faster travel between fights.',
  'mobility.kill-speed-pct': 'A burst of move speed for a short time after each kill.',
  'mobility.acquire-speed-pct':
    'A move-speed burst when you lock onto a new target, on its own cooldown.',
  'mobility.kite-speed-pct':
    'Extra move speed while retreating from your current target — for kiting.',
  'mobility.ramp-speed-pct': 'Move speed that builds the longer you keep moving.',
  'mobility.passive-speed-pct': 'A flat move-speed bonus, briefly lost after taking a direct hit.',
  'mobility.kill-stack-speed-pct':
    'Stacking move speed and faster slow/root recovery on kills, up to a few stacks.',
  'mobility.stealth-pct': 'Enemies notice you from closer — easier to slip past.',
  'mobility.aggro-pull-pct': 'Enemies notice you from farther — pulls more onto you.',
  'mobility.tenacity-pct': 'Slows and roots wear off faster.',
};
