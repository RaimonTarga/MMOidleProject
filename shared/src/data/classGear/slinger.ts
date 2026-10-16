/**
 * The Slinger's gear (`reload`): its weapons and its lines on the shared armor and charm
 * bases, from bible §10.4 (T1) and §10.16 (T2–T4). Entered by the class-gear tasks.
 */
import type { ClassGearDef } from './types';

export const SLINGER_GEAR: ClassGearDef = {
  weapons: [
    // ── T1 ──
    // The Clearing's only generic weapon is tier 0. This starter is T1 class gear and copies that weapon's cost, stats, level, attack speed and icon.
    {
      id: 'slinger-plain-pistol-t1', name: 'Plain Pistol',
      recipeGroup: 'clearing', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { green: 4 }, stats: { attack: 8, attackRange: 40 }, attacksPerSecond: 0.98, tier: 1,
      icon: 'items/weapons/primordial-club.png',
      description: 'A plain pistol. The reload is stationary.',
      mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1600 },
    },
    {
      id: 'slinger-pepperbox-t1', name: 'Pepperbox',
      recipeGroup: 'plains', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { yellow: 10 }, stats: { attack: 19, attackRange: 80 }, attacksPerSecond: 1.17, tier: 1,
      icon: 'items/weapons/iron-broadsword.png',
      description: 'Fast fire, a big clip, and light rounds. Scatter nicks one more enemy.',
      mechanicEffects: { 'reload.max-ammo': 12, 'reload.reload-time-ms': 1800, 'slinger.scatter-extra': 1 },
    },
    {
      id: 'slinger-carbine-t1', name: 'Carbine',
      recipeGroup: 'forest', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { green: 20 }, stats: { attack: 12, attackRange: 80 }, attacksPerSecond: 2.08, tier: 1,
      icon: 'items/weapons/flash-rapier.png',
      description: 'Quick fire and a quick reload. The first rounds of each clip hit harder.',
      mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1000, 'slinger.opener-pct': 0.3 },
    },
    {
      id: 'slinger-snakebite-pistol-t1', name: 'Snakebite Pistol',
      recipeGroup: 'swamp', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { purple: 22 }, stats: { attack: 18, attackRange: 80 }, attacksPerSecond: 1.17, tier: 1,
      icon: 'items/weapons/poison-dagger.png',
      description: 'Slow fire and a small clip. Your poison lasts longer, and the last round hits a poisoned target harder.',
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1800, 'slinger.poison-long-pct': 0.5, 'slinger.last-vs-poisoned-pct': 0.5 },
    },
    {
      id: 'slinger-hand-cannon-t1', name: 'Hand Cannon',
      recipeGroup: 'mountain', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { blue: 22 }, stats: { attack: 38, attackRange: 80 }, attacksPerSecond: 0.72, tier: 1,
      icon: 'items/weapons/heavy-hammer.png',
      description: 'Slow fire and heavy rounds. The last round hits much harder.',
      mechanicEffects: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 2000, 'slinger.last-round-pct': 1 },
    },
    {
      id: 'slinger-drum-gun-t1', name: 'Drum Gun',
      recipeGroup: 'cave', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { red: 26 }, stats: { attack: 29, attackRange: 80 }, attacksPerSecond: 1.43, tier: 1,
      icon: 'items/weapons/chaotic-axe.png',
      description: 'A big drum and a slow reload. Each round of a clip hits a bit harder than the last.',
      mechanicEffects: { 'reload.max-ammo': 16, 'reload.reload-time-ms': 2600, 'slinger.ramp-pct': 0.05 },
    },
    // ── T2 ──
    {
      id: 'slinger-pepperbox-t2', name: 'Pepperbox',
      recipeGroup: 'plains', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { yellow: 45 }, stats: { attack: 51, attackRange: 80 }, attacksPerSecond: 1.30, tier: 2,
      icon: 'items/weapons/knight-steelsword.png',
      description: 'Fast fire, a big clip, and light rounds. Scatter nicks one more enemy.',
      mechanicEffects: { 'reload.max-ammo': 12, 'reload.reload-time-ms': 1800, 'slinger.scatter-extra': 1 },
    },
    {
      id: 'slinger-carbine-t2', name: 'Carbine',
      recipeGroup: 'forest', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { green: 60 }, stats: { attack: 35, attackRange: 80 }, attacksPerSecond: 2.21, tier: 2,
      icon: 'items/weapons/gale-needle.png',
      description: 'Quick fire and a quick reload. The first rounds of each clip hit harder.',
      mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1000, 'slinger.opener-pct': 0.3 },
    },
    {
      id: 'slinger-snakebite-pistol-t2', name: 'Snakebite Pistol',
      recipeGroup: 'swamp', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { purple: 52 }, stats: { attack: 47, attackRange: 80 }, attacksPerSecond: 1.30, tier: 2,
      icon: 'items/weapons/venom-knife.png',
      description: 'Slow fire and a small clip. Your poison lasts longer, and the last round hits a poisoned target harder.',
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1800, 'slinger.poison-long-pct': 0.5, 'slinger.last-vs-poisoned-pct': 0.5 },
    },
    {
      id: 'slinger-hand-cannon-t2', name: 'Hand Cannon',
      recipeGroup: 'mountain', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { blue: 52 }, stats: { attack: 85, attackRange: 80 }, attacksPerSecond: 0.72, tier: 2,
      icon: 'items/weapons/quake-hammer.png',
      description: 'Slow fire and heavy rounds. The last round hits much harder.',
      mechanicEffects: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 2000, 'slinger.last-round-pct': 1 },
    },
    {
      id: 'slinger-drum-gun-t2', name: 'Drum Gun',
      recipeGroup: 'cave', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { red: 60 }, stats: { attack: 60, attackRange: 80 }, attacksPerSecond: 1.56, tier: 2,
      icon: 'items/weapons/ruinous-axe.png',
      description: 'A big drum and a slow reload. Each round of a clip hits a bit harder than the last.',
      mechanicEffects: { 'reload.max-ammo': 16, 'reload.reload-time-ms': 2600, 'slinger.ramp-pct': 0.05 },
    },
    {
      id: 'slinger-hunting-rifle-t2', name: 'Hunting Rifle',
      recipeGroup: 'jungle', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { green: 55 }, stats: { attack: 24, onHitDamage: 23, attackRange: 140 }, attacksPerSecond: 2.02, tier: 2,
      icon: 'items/weapons/stinger-rapier.png',
      description: 'Long reach. Rounds hit harder the farther the target is.',
      // PLACEHOLDER: reach, clip and reload are not in the bible.
      mechanicEffects: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 1800, 'slinger.far-pct': 0.5 },
    },
    {
      id: 'slinger-long-rifle-t2', name: 'Long Rifle',
      recipeGroup: 'desert', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { yellow: 70 }, stats: { attack: 65, attackRange: 220 }, attacksPerSecond: 1.04, tier: 2,
      icon: 'items/weapons/sunsteel-falchion.png',
      description: 'The longest reach. It outranges kiters.',
      // PLACEHOLDER: reach, clip and reload are not in the bible.
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 2000 },
    },
    // ── T3 ──
    {
      id: 'slinger-snakebite-pistol-t3', name: 'Snakebite Pistol',
      recipeGroup: 'swamp', requiredBiomeLevel: 13, slot: 'weapon',
      cost: { purple: 116 }, stats: { attack: 86, attackRange: 80 }, attacksPerSecond: 1.30, tier: 3,
      icon: 'items/weapons/plague-fang.png',
      description: 'Slow fire and a small clip. Your poison lasts longer, and the last round hits a poisoned target harder.',
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1800, 'slinger.poison-long-pct': 0.5, 'slinger.last-vs-poisoned-pct': 0.5 },
    },
    {
      id: 'slinger-hand-cannon-t3', name: 'Hand Cannon',
      recipeGroup: 'mountain', requiredBiomeLevel: 13, slot: 'weapon',
      cost: { blue: 116 }, stats: { attack: 164, attackRange: 80 }, attacksPerSecond: 0.72, tier: 3,
      icon: 'items/weapons/avalanche-maul.png',
      description: 'Slow fire and heavy rounds. The last round hits much harder.',
      mechanicEffects: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 2000, 'slinger.last-round-pct': 1 },
    },
    {
      id: 'slinger-drum-gun-t3', name: 'Drum Gun',
      recipeGroup: 'cave', requiredBiomeLevel: 13, slot: 'weapon',
      cost: { red: 120 }, stats: { attack: 112, attackRange: 80 }, attacksPerSecond: 1.56, tier: 3,
      icon: 'items/weapons/cataclysm-axe.png',
      description: 'A big drum and a slow reload. Each round of a clip hits a bit harder than the last.',
      mechanicEffects: { 'reload.max-ammo': 16, 'reload.reload-time-ms': 2600, 'slinger.ramp-pct': 0.05 },
    },
    {
      id: 'slinger-hunting-rifle-t3', name: 'Hunting Rifle',
      recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { green: 120 }, stats: { attack: 50, onHitDamage: 38, attackRange: 140 }, attacksPerSecond: 2.15, tier: 3,
      icon: 'items/weapons/venomthorn-rapier.png',
      description: 'Long reach. Rounds hit harder the farther the target is.',
      // PLACEHOLDER: reach, clip and reload are not in the bible (copied from the job's first tier).
      mechanicEffects: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 1800, 'slinger.far-pct': 0.5 },
    },
    // The Forest's Carbine moves here.
    {
      id: 'slinger-carbine-t3', name: 'Carbine',
      recipeGroup: 'jungle', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { green: 120 }, stats: { attack: 50, onHitDamage: 38, attackRange: 80 }, attacksPerSecond: 2.15, tier: 3,
      icon: 'items/weapons/venomthorn-rapier.png',
      description: 'Quick fire and a quick reload. The first rounds of each clip hit harder.',
      mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1000, 'slinger.opener-pct': 0.3 },
    },
    {
      id: 'slinger-long-rifle-t3', name: 'Long Rifle',
      recipeGroup: 'desert', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { yellow: 116 }, stats: { attack: 112, attackRange: 220 }, attacksPerSecond: 1.04, tier: 3,
      icon: 'items/weapons/solar-falchion.png',
      description: 'The longest reach. It outranges kiters.',
      // PLACEHOLDER: reach, clip and reload are not in the bible (copied from the job's first tier).
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 2000 },
    },
    {
      id: 'slinger-frostlock-rifle-t3', name: 'Frostlock Rifle',
      recipeGroup: 'tundra', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { blue: 124 }, stats: { attack: 162, attackRange: 180 }, attacksPerSecond: 0.65, tier: 3,
      icon: 'items/weapons/permafrost-maul.png',
      description: 'Rounds hit harder against chilled, slowed or rooted enemies.',
      // PLACEHOLDER: reach, clip and reload are not in the bible (copied from the job's first tier).
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 2200, 'slinger.cold-pct': 0.4 },
    },
    {
      id: 'slinger-firebrand-pistol-t3', name: 'Firebrand Pistol',
      recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { red: 140 }, stats: { attack: 70, attackRange: 80 }, attacksPerSecond: 2.15, tier: 3,
      icon: 'items/weapons/cinderlash.png',
      description: "Each step of the fight's Heat makes every round hit harder.",
      // PLACEHOLDER: reach, clip and reload are not in the bible (copied from the job's first tier).
      mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1700, 'slinger.heat-pct': 0.03 },
    },
    // The Plains' Pepperbox moves here.
    {
      id: 'slinger-pepperbox-t3', name: 'Pepperbox',
      recipeGroup: 'volcanic', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { red: 140 }, stats: { attack: 70, attackRange: 80 }, attacksPerSecond: 2.15, tier: 3,
      icon: 'items/weapons/cinderlash.png',
      description: 'Fast fire, a big clip, and light rounds. Scatter nicks one more enemy.',
      mechanicEffects: { 'reload.max-ammo': 12, 'reload.reload-time-ms': 1800, 'slinger.scatter-extra': 1 },
    },
    // ── T4 ──
    {
      id: 'slinger-hand-cannon-t4', name: 'Hand Cannon',
      recipeGroup: 'mountain', requiredBiomeLevel: 19, slot: 'weapon',
      cost: { blue: 256 }, stats: { attack: 486, attackRange: 80 }, attacksPerSecond: 0.52, tier: 4,
      icon: 'items/weapons/earthsunder-maul.png',
      description: 'Slow fire and heavy rounds. The last round hits much harder.',
      mechanicEffects: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 2000, 'slinger.last-round-pct': 1 },
    },
    {
      id: 'slinger-hunting-rifle-t4', name: 'Hunting Rifle',
      recipeGroup: 'jungle', requiredBiomeLevel: 13, slot: 'weapon',
      cost: { green: 264 }, stats: { attack: 108, onHitDamage: 70, attackRange: 140 }, attacksPerSecond: 2.28, tier: 4,
      icon: 'items/weapons/deathfang-rapier.png',
      description: 'Long reach. Rounds hit harder the farther the target is.',
      // PLACEHOLDER: reach, clip and reload are not in the bible (copied from the job's first tier).
      mechanicEffects: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 1800, 'slinger.far-pct': 0.5 },
    },
    // The Forest's Carbine, still here.
    {
      id: 'slinger-carbine-t4', name: 'Carbine',
      recipeGroup: 'jungle', requiredBiomeLevel: 13, slot: 'weapon',
      cost: { green: 264 }, stats: { attack: 108, onHitDamage: 70, attackRange: 80 }, attacksPerSecond: 2.28, tier: 4,
      icon: 'items/weapons/deathfang-rapier.png',
      description: 'Quick fire and a quick reload. The first rounds of each clip hit harder.',
      mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1000, 'slinger.opener-pct': 0.3 },
    },
    {
      id: 'slinger-long-rifle-t4', name: 'Long Rifle',
      recipeGroup: 'desert', requiredBiomeLevel: 13, slot: 'weapon',
      cost: { yellow: 255 }, stats: { attack: 212, attackRange: 220 }, attacksPerSecond: 1.04, tier: 4,
      icon: 'items/weapons/zenith-falchion.png',
      description: 'The longest reach. It outranges kiters.',
      // PLACEHOLDER: reach, clip and reload are not in the bible (copied from the job's first tier).
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 2000 },
    },
    {
      id: 'slinger-frostlock-rifle-t4', name: 'Frostlock Rifle',
      recipeGroup: 'tundra', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { blue: 273 }, stats: { attack: 378, attackRange: 180 }, attacksPerSecond: 0.65, tier: 4,
      icon: 'items/weapons/glacial-tyrant-maul.png',
      description: 'Rounds hit harder against chilled, slowed or rooted enemies.',
      // PLACEHOLDER: reach, clip and reload are not in the bible (copied from the job's first tier).
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 2200, 'slinger.cold-pct': 0.4 },
    },
    {
      id: 'slinger-firebrand-pistol-t4', name: 'Firebrand Pistol',
      recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { red: 308 }, stats: { attack: 119, attackRange: 80 }, attacksPerSecond: 2.34, tier: 4,
      icon: 'items/weapons/eruption-lash.png',
      description: "Each step of the fight's Heat makes every round hit harder.",
      // PLACEHOLDER: reach, clip and reload are not in the bible (copied from the job's first tier).
      mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1700, 'slinger.heat-pct': 0.03 },
    },
    // The Plains' Pepperbox, still here.
    {
      id: 'slinger-pepperbox-t4', name: 'Pepperbox',
      recipeGroup: 'volcanic', requiredBiomeLevel: 7, slot: 'weapon',
      cost: { red: 308 }, stats: { attack: 119, attackRange: 80 }, attacksPerSecond: 2.34, tier: 4,
      icon: 'items/weapons/eruption-lash.png',
      description: 'Fast fire, a big clip, and light rounds. Scatter nicks one more enemy.',
      mechanicEffects: { 'reload.max-ammo': 12, 'reload.reload-time-ms': 1800, 'slinger.scatter-extra': 1 },
    },
    {
      id: 'slinger-reapers-repeater-t4', name: "Reaper's Repeater",
      recipeGroup: 'graveyard', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { purple: 270 }, stats: { attack: 258, attackRange: 80 }, attacksPerSecond: 1.43, tier: 4,
      icon: 'items/weapons/plague-axe.png',
      description: 'Each round splashes a share of its damage to the enemies around the target.',
      // PLACEHOLDER: clip, reload and the splash share are not in the bible.
      mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 1800, 'slinger.splash-pct': 0.3 },
    },
    // The Swamp's Snakebite Pistol moves here.
    {
      id: 'slinger-snakebite-pistol-t4', name: 'Snakebite Pistol',
      recipeGroup: 'graveyard', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { purple: 270 }, stats: { attack: 258, attackRange: 80 }, attacksPerSecond: 1.43, tier: 4,
      icon: 'items/weapons/plague-axe.png',
      description: 'Slow fire and a small clip. Your poison lasts longer, and the last round hits a poisoned target harder.',
      mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1800, 'slinger.poison-long-pct': 0.5, 'slinger.last-vs-poisoned-pct': 0.5 },
    },
    {
      id: 'slinger-pressure-rifle-t4', name: 'Pressure Rifle',
      recipeGroup: 'trench', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { green: 270 }, stats: { attack: 257, attackRange: 80 }, attacksPerSecond: 1.50, tier: 4,
      icon: 'items/weapons/abyssal-axe.png',
      description: 'Rounds hit harder the more HP the target has left.',
      // PLACEHOLDER: clip, reload and the bonus are not in the bible.
      mechanicEffects: { 'reload.max-ammo': 6, 'reload.reload-time-ms': 2000, 'slinger.pressure-pct': 0.5 },
    },
    // The Cave's Drum Gun moves here.
    {
      id: 'slinger-drum-gun-t4', name: 'Drum Gun',
      recipeGroup: 'trench', requiredBiomeLevel: 1, slot: 'weapon',
      cost: { green: 270 }, stats: { attack: 257, attackRange: 80 }, attacksPerSecond: 1.50, tier: 4,
      icon: 'items/weapons/abyssal-axe.png',
      description: 'A big drum and a slow reload. Each round of a clip hits a bit harder than the last.',
      mechanicEffects: { 'reload.max-ammo': 16, 'reload.reload-time-ms': 2600, 'slinger.ramp-pct': 0.05 },
    },
  ],
  lines: {
    // ── T1 ──
    'plains-vest-t1': { name: 'Elbow Room', text: 'While three or more enemies are near you, you reload faster.', effects: { 'slinger.elbow-room': 0.3 } },
    'plains-charm-t1': { name: 'Breathing Room', text: 'Recovery rises with the distance to the nearest enemy.', effects: { 'slinger.breathing-room': 1 } },
    'forest-vest-t1': { name: 'Quickdraw', text: 'You can walk at half speed while reloading.', effects: { 'slinger.reload-walk-pct': 0.5 } },
    'forest-charm-t1': { name: 'Fleet', text: 'Recovery doubles while you move.', effects: { 'slinger.fleet': 2 } },
    'swamp-vest-t1': { name: 'Oilskin', text: 'Damage over time on you is halved while you reload.', effects: { 'slinger.oilskin': 0.5 } },
    'swamp-charm-t1': { name: 'Snake Oil', text: 'Recovery doubles while you carry poison or bleed and no enemy is near you.', effects: { 'slinger.snake-oil': 2 } },
    'mountain-vest-t1': { name: 'Dig In', text: 'While you reload, no single hit takes more than a fifth of your HP.', effects: { 'slinger.dig-in': 0.2 } },
    'mountain-charm-t1': { name: 'Regroup', text: 'After a hit over a quarter of your HP, you move faster and Recovery doubles for a few seconds.', effects: { 'defense.recovery-hit-pct': 0.25, 'defense.recovery-hit-x': 2, 'slinger.regroup-speed-pct': 0.3 } },
    'cave-vest-t1': { name: 'Hunker', text: 'Your plating doubles while you reload.', effects: { 'slinger.hunker': 2 } },
    'cave-charm-t1': { name: 'Bivouac', text: 'Out-of-combat Recovery is much faster.', effects: { 'defense.ooc-recovery-pct': 1 } },
    // ── T2 ──
    'plains-vest-t2': { name: 'Elbow Room', text: 'While three or more enemies are near you, you reload faster.', effects: { 'slinger.elbow-room': 0.3 } },
    'plains-charm-t2': { name: 'Breathing Room', text: 'Recovery rises with the distance to the nearest enemy.', effects: { 'slinger.breathing-room': 1 } },
    'forest-vest-t2': { name: 'Quickdraw', text: 'You can walk at half speed while reloading.', effects: { 'slinger.reload-walk-pct': 0.5 } },
    'forest-charm-t2': { name: 'Fleet', text: 'Recovery doubles while you move.', effects: { 'slinger.fleet': 2 } },
    'swamp-vest-t2': { name: 'Oilskin', text: 'Damage over time on you is halved while you reload.', effects: { 'slinger.oilskin': 0.5 } },
    'swamp-charm-t2': { name: 'Snake Oil', text: 'Recovery doubles while you carry poison or bleed and no enemy is near you.', effects: { 'slinger.snake-oil': 2 } },
    'mountain-vest-t2': { name: 'Dig In', text: 'While you reload, no single hit takes more than a fifth of your HP.', effects: { 'slinger.dig-in': 0.2 } },
    'mountain-charm-t2': { name: 'Regroup', text: 'After a hit over a quarter of your HP, you move faster and Recovery doubles for a few seconds.', effects: { 'defense.recovery-hit-pct': 0.25, 'defense.recovery-hit-x': 2, 'slinger.regroup-speed-pct': 0.3 } },
    'cave-vest-t2': { name: 'Hunker', text: 'Your plating doubles while you reload.', effects: { 'slinger.hunker': 2 } },
    'cave-charm-t2': { name: 'Bivouac', text: 'Out-of-combat Recovery is much faster.', effects: { 'defense.ooc-recovery-pct': 1 } },
    'jungle-vest-t2': { name: 'Lookout', text: 'An enemy that ambushes you while you reload is slowed and revealed.', effects: { 'slinger.lookout': 0.4 } },
    'jungle-charm-t2': { name: 'Undergrowth', text: 'Recovery doubles while no enemy is targeting you.', effects: { 'slinger.undergrowth': 2 } },
    'desert-vest-t2': { name: 'Glass Duster', text: 'You reload faster and hit harder, and the armor defends you less.', effects: { 'slinger.damage-pct': 0.15, 'slinger.reload-faster-pct': 0.2 } },
    'desert-charm-t2': { name: 'Shade', text: 'Every few seconds a mark or slow on you ends.', effects: { 'slinger.shade': 5000 } },
    // ── T3 ──
    'swamp-vest-t3': { name: 'Oilskin', text: 'Damage over time on you is halved while you reload.', effects: { 'slinger.oilskin': 0.5 } },
    'swamp-charm-t3': { name: 'Snake Oil', text: 'Recovery doubles while you carry poison or bleed and no enemy is near you.', effects: { 'slinger.snake-oil': 2 } },
    'mountain-vest-t3': { name: 'Dig In', text: 'While you reload, no single hit takes more than a fifth of your HP.', effects: { 'slinger.dig-in': 0.2 } },
    'mountain-charm-t3': { name: 'Regroup', text: 'After a hit over a quarter of your HP, you move faster and Recovery doubles for a few seconds.', effects: { 'defense.recovery-hit-pct': 0.25, 'defense.recovery-hit-x': 2, 'slinger.regroup-speed-pct': 0.3 } },
    'cave-vest-t3': { name: 'Hunker', text: 'Your plating doubles while you reload.', effects: { 'slinger.hunker': 2 } },
    'cave-charm-t3': { name: 'Bivouac', text: 'Out-of-combat Recovery is much faster.', effects: { 'defense.ooc-recovery-pct': 1 } },
    'jungle-vest-t3': { name: 'Lookout', text: 'An enemy that ambushes you while you reload is slowed and revealed.', effects: { 'slinger.lookout': 0.4 } },
    'jungle-charm-t3': { name: 'Undergrowth', text: 'Recovery doubles while no enemy is targeting you.', effects: { 'slinger.undergrowth': 2 } },
    'desert-vest-t3': { name: 'Glass Duster', text: 'You reload faster and hit harder, and the armor defends you less.', effects: { 'slinger.damage-pct': 0.15, 'slinger.reload-faster-pct': 0.2 } },
    'desert-charm-t3': { name: 'Shade', text: 'Every few seconds a mark or slow on you ends.', effects: { 'slinger.shade': 5000 } },
    'tundra-vest-t3': { name: 'Warm Hands', text: 'The Chill on you does not build while you reload.', effects: { 'slinger.warm-hands': 1 } },
    'tundra-charm-t3': { name: 'Thaw', text: 'Recovery doubles while you are chilled or slowed.', effects: { 'slinger.thaw': 2 } },
    'volcanic-vest-t3': { name: 'Asbestos Coat', text: 'The extra damage from the Heat does not apply to you while you reload.', effects: { 'slinger.asbestos': 1 } },
    'volcanic-charm-t3': { name: 'Heatsink', text: 'Recovery rises with the Heat while no enemy is near you.', effects: { 'slinger.heatsink': 0.1 } },
    // ── T4 ──
    'mountain-vest-t4': { name: 'Dig In', text: 'While you reload, no single hit takes more than a fifth of your HP.', effects: { 'slinger.dig-in': 0.2 } },
    'mountain-charm-t4': { name: 'Regroup', text: 'After a hit over a quarter of your HP, you move faster and Recovery doubles for a few seconds.', effects: { 'defense.recovery-hit-pct': 0.25, 'defense.recovery-hit-x': 2, 'slinger.regroup-speed-pct': 0.3 } },
    'jungle-vest-t4': { name: 'Lookout', text: 'An enemy that ambushes you while you reload is slowed and revealed.', effects: { 'slinger.lookout': 0.4 } },
    'jungle-charm-t4': { name: 'Undergrowth', text: 'Recovery doubles while no enemy is targeting you.', effects: { 'slinger.undergrowth': 2 } },
    'desert-vest-t4': { name: 'Glass Duster', text: 'You reload faster and hit harder, and the armor defends you less.', effects: { 'slinger.damage-pct': 0.15, 'slinger.reload-faster-pct': 0.2 } },
    'desert-charm-t4': { name: 'Shade', text: 'Every few seconds a mark or slow on you ends.', effects: { 'slinger.shade': 5000 } },
    'tundra-vest-t4': { name: 'Warm Hands', text: 'The Chill on you does not build while you reload.', effects: { 'slinger.warm-hands': 1 } },
    'tundra-charm-t4': { name: 'Thaw', text: 'Recovery doubles while you are chilled or slowed.', effects: { 'slinger.thaw': 2 } },
    'volcanic-vest-t4': { name: 'Asbestos Coat', text: 'The extra damage from the Heat does not apply to you while you reload.', effects: { 'slinger.asbestos': 1 } },
    'volcanic-charm-t4': { name: 'Heatsink', text: 'Recovery rises with the Heat while no enemy is near you.', effects: { 'slinger.heatsink': 0.1 } },
    'graveyard-vest-t4': { name: 'Hallowed Ground', text: 'While you reload, risen enemies around you deal half damage.', effects: { 'slinger.hallowed-ground': 0.5 } },
    'graveyard-charm-t4': { name: 'Vigil', text: 'Recovery rises with the number of enemies in the fight while none is near you.', effects: { 'slinger.vigil': 0.1 } },
    'trench-vest-t4': { name: 'Pressure Suit', text: 'Debuffs cannot land on you while you reload.', effects: { 'slinger.pressure-suit': 1 } },
    'trench-charm-t4': { name: 'Ballast', text: 'Recovery rises for each debuff on you.', effects: { 'slinger.ballast': 0.1 } },
  },
  // Retired-biome lines on the receiving biome's second base (`<id>-b`).
  // Copied from the origin's last tier: Forest and Plains at T2, Swamp and Cave at T3.
  movedLines: {
    // Forest → Jungle
    'jungle-vest-t3': { name: 'Quickdraw', text: 'You can walk at half speed while reloading.', effects: { 'slinger.reload-walk-pct': 0.5 } },
    'jungle-vest-t4': { name: 'Quickdraw', text: 'You can walk at half speed while reloading.', effects: { 'slinger.reload-walk-pct': 0.5 } },
    'jungle-charm-t3': { name: 'Fleet', text: 'Recovery doubles while you move.', effects: { 'slinger.fleet': 2 } },
    'jungle-charm-t4': { name: 'Fleet', text: 'Recovery doubles while you move.', effects: { 'slinger.fleet': 2 } },
    // Plains → Volcanic
    'volcanic-vest-t3': { name: 'Elbow Room', text: 'While three or more enemies are near you, you reload faster.', effects: { 'slinger.elbow-room': 0.3 } },
    'volcanic-vest-t4': { name: 'Elbow Room', text: 'While three or more enemies are near you, you reload faster.', effects: { 'slinger.elbow-room': 0.3 } },
    'volcanic-charm-t3': { name: 'Breathing Room', text: 'Recovery rises with the distance to the nearest enemy.', effects: { 'slinger.breathing-room': 1 } },
    'volcanic-charm-t4': { name: 'Breathing Room', text: 'Recovery rises with the distance to the nearest enemy.', effects: { 'slinger.breathing-room': 1 } },
    // Swamp → Graveyard
    'graveyard-vest-t4': { name: 'Oilskin', text: 'Damage over time on you is halved while you reload.', effects: { 'slinger.oilskin': 0.5 } },
    'graveyard-charm-t4': { name: 'Snake Oil', text: 'Recovery doubles while you carry poison or bleed and no enemy is near you.', effects: { 'slinger.snake-oil': 2 } },
    // Cave → Trench
    'trench-vest-t4': { name: 'Hunker', text: 'Your plating doubles while you reload.', effects: { 'slinger.hunker': 2 } },
    'trench-charm-t4': { name: 'Bivouac', text: 'Out-of-combat Recovery is much faster.', effects: { 'defense.ooc-recovery-pct': 1 } },
  },
};
