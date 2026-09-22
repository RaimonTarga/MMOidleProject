// Central explanatory copy for every status the combat HUD can show: the buffs
// and debuffs on your own bar, the debuffs on your target, and the boss effects
// on an encounter frame.
//
// The sibling of `hud/stat/statHelp.ts`, and it exists for the same reason: one
// canonical sentence per mechanic, edited in one place, rather than prose grown
// inside BuffBar/TargetFrame as each status proved confusing in playtest. It is
// STATIC — authored once, shipped with the client, never resent per tick. The
// numbers that change live come the other way, off `PlayerBuff.values` /
// `TargetStatusView.values`, resolved by the server.
//
// Keys are stable status ids: `BuffId` for the player's bar, raw `TracksCombat`
// effect ids for the target frame. Where the same mechanic appears on both sides
// under different ids, both ids point at the same entry rather than at two
// paraphrases that can drift.

export type StatusKind = 'buff' | 'debuff' | 'ambient' | 'boss' | 'mechanic';

export interface StatusHelp {
  /** Full name for the tooltip header. Falls back to the runtime short label. */
  title?: string;
  kind: StatusKind;
  /** What the mechanic does, in general. One or two sentences. */
  help: string;
}

const KIND_LABEL: Record<StatusKind, string> = {
  buff: 'Buff',
  debuff: 'Debuff',
  ambient: 'Ambient hazard',
  boss: 'Boss effect',
  mechanic: 'Class mechanic',
};

const b = (title: string, help: string): StatusHelp => ({ title, kind: 'buff', help });
const d = (title: string, help: string): StatusHelp => ({ title, kind: 'debuff', help });
const m = (title: string, help: string): StatusHelp => ({ title, kind: 'mechanic', help });
const amb = (title: string, help: string): StatusHelp => ({ title, kind: 'ambient', help });

const STATUS_HELP: Record<string, StatusHelp> = {
  // -- Monster debuffs on you -----------------------------------------------
  'debuff-slow': d('Slow', 'Your movement speed is cut. Slow resistance weakens the slow’s magnitude, while the figure below is what you are actually moving at after that resistance.'),
  'debuff-root': d('Root', 'You cannot move. A cave Pin also stops you attacking. Rooting is hard control: break-free effects and control resistance are what answer it, not slow resistance.'),
  'debuff-frost-ramp': d('Frost', 'Cold takes your legs and your tempo together. Each hit adds a stack, increasing the movement slow and attack-cooldown penalty up to the cap; it fades after the last hit.'),
  'debuff-dot': d('Damage over time', 'Damage that keeps landing after the hit that applied it. It ignores plating entirely and only half your damage reduction applies, so armour is the wrong answer — DoT resistance and killing the source are.'),
  'debuff-swamp-rot': d('Rot', 'Swamp rot stacks with every hit and ticks for a share of its stacks. Like all damage over time it goes straight past plating.'),
  'debuff-sun-mark': d('Marked', 'You are painted for the next heavy blow, which lands amplified instead of ordinary. Cleansing the mark, or being somewhere else when it lands, is the whole counter.'),
  'debuff-volcanic-heat': amb('Volcanic heat', 'Heat builds without a stack limit during combat. Each of the first 10 stacks adds 3% damage dealt and 4.5% damage taken; later stacks add progressively less. Vents accelerate buildup. Out of combat, high Heat cools faster, slowing as stacks fall. Leaving the biome or dying clears it completely.'),
  'debuff-tundra-chill': amb('Tundra chill', 'Chill builds during combat, reducing movement speed and stretching your attack cooldown. It fades out of combat and clears completely when you leave the biome or die.'),
  'debuff-sundered': d('Sundered', 'Your defenses are split open: every source hits you harder for as long as it lasts. It stacks, so a fight you cannot end quickly gets worse on a curve.'),
  'debuff-plating-shred': d('Corroded plating', 'This encounter is stripping flat plating from every incoming hit. The corrosion stacks until the source is defeated or the encounter ends.'),
  'debuff-antiheal': d('Antiheal', 'Healing you receive is suppressed. Out-sustaining the fight stops being an option — burst it down or break away until this expires.'),
  'debuff-frozen': d('Frozen', 'You are frozen solid: you cannot move and you cannot attack. Hard control, so break-free effects and control resistance are the answer — an ordinary Cleanse does not reach it. Tundra bosses can only apply it while your Chill is high, so keeping Chill down is what prevents it.'),
  'debuff-stunned': d('Stunned', 'You cannot act. Hard control: control resistance and break-free effects shorten it; slow resistance does nothing.'),

  // -- Abilities -------------------------------------------------------------
  'ability-guard': b('Guard', 'Your Guard is up: incoming damage is reduced for the window. Guard potency deepens the reduction and Guard duration lengthens the window.'),
  'ability-guard-2': b('Guard', 'Your second Guard is up. Two equipped Guards layer independently, each with its own window.'),
  'ability-bramble': b('Bramble', 'Thorned plating: you gain flat plating and return damage to anything that hits you, for the duration.'),
  'ability-second-wind': b('Recovery skill', 'A Recovery window is open — a share of your Recovery rate is switched on, healing you over the duration. What that converts to in HP depends on your Recovery stat.'),
  'ability-second-wind-2': b('Recovery skill', 'Your second Recovery window is open. Second Wind (strong and short) and Recuperate (weak and long) can be held together and run independently.'),
  'ability-frenzy': b('Frenzy', 'Your attack speed is raised for the window.'),
  'ability-imbue': b('Imbued', 'Lightning is stored in your hands. Each attack that lands spends one charge and carries bonus damage with it. There is no timer — the charges wait as long as you need them to, and the number on the tile is how many attacks are left.'),
  'ability-control-resist': b('Unbound', 'You broke free, and incoming control is shortened for a moment afterward so you are not immediately re-caught.'),

  // -- Defense ---------------------------------------------------------------
  'defense-ward': b('Ward', 'A temporary pool that absorbs damage before your health does. Unlike your barrier it expires rather than recharging.'),
  'defense-absorb': b('Absorb', 'Part of the damage you took was diverted into a pool that heals back over time. You still took the hit — this returns some of it gradually.'),
  'defense-recovery': b('Recovery', 'How much of your Recovery rate is switched on right now. Out of combat everyone runs at 100%; in combat it is off by default and class passives, charms and Recovery skills each switch on a share, which add together. This tile is the only place that total is visible.'),
  'defense-revive-heal': b('Reviving', 'You survived a killing blow and are being healed back out of it over time.'),
  'defense-debt': { title: 'Damage debt', kind: 'debuff', help: 'Damage deferred rather than removed. Part of the hits you took is queued and ticks onto you over time instead of landing at once — it softens burst, it does not cancel it.' },
  'defense-hardening': b('Hardening', 'Plating that builds while you stay engaged, up to a cap, on top of your equipment. A heavy hit or leaving combat can strip it.'),
  'defense-stationary-dr': b('Rooted stance', 'Extra damage reduction builds while you hold still and gradually fades while you move.'),
  'defense-sustained-dr': b('Endurance', 'Extra damage reduction that climbs the longer a single fight runs, and resets when you leave combat.'),
  'defense-hardening-maxdr': b('Tempered', 'Extra damage reduction while Hardening is full; it remains for its linger window after Hardening drops from maximum.'),
  'defense-reactive-plating': b('Reactive plating', 'Each direct hit adds plating up to a cap and refreshes the window. The bonus fades when that window expires.'),

  // -- Cadence ---------------------------------------------------------------
  'cadence-accelerando': m('Accelerando', 'Consecutive attacks shorten your attack cooldown, stack by stack. Breaking rhythm gives it back.'),
  'cadence-echo': m('Echo', 'After your finisher, your next few regular attacks deal bonus damage.'),
  'cadence-resonance': m('Resonance', 'Resonance banks into your finisher: every stack raises what the finisher pays out when it lands.'),
  'cadence-verdict': m('Verdict', 'Each finisher banks execution power across targets. When a target survives a finisher within the stored amount, the Verdict executes it and spends the pool.'),
  'cadence-aftershock': m('Aftershock', 'After your finisher, your next few regular attacks deal their on-hit damage twice.'),
  'cadence-metronome': m('Metronome', 'Each buildup attack adds flat damage to later attacks and the finisher; the stored bonus resets when the finisher lands.'),
  'cadence-rampage': m('Rampage', 'Each finisher grants a Rampage stack: finishers hit harder, attacks come faster, regular attacks weaken, and the combo threshold falls to a floor. At the cap, the next finisher overloads and resets Rampage; stacks also decay slowly out of combat.'),
  'cadence-crescendo': m('Crescendo', 'Time spent in one continuous fight raises finisher damage. It resets when you leave combat.'),

  // -- Cooldown --------------------------------------------------------------
  'cooldown-patience': m('Patience', 'The longer you let your execution cooldown run its natural course, the more it pays out: attack and execution damage both climb toward a cap as the cooldown fills. Triggering your execution early cuts the ramp short.'),
  'cooldown-overdrive': m('Overdrive', 'A burst window: your attack speed is raised sharply while it lasts.'),
  'cooldown-eternal-charge': m('Eternal charge', 'Each regular attack banks a stack and gains the current bonus. Your next execution adds the full bank again, then clears it.'),
  'cooldown-temporal-ext': m('Temporal extension', 'Flat bonus damage added to every on-hit for the window.'),
  'cooldown-battery': m('Battery', 'Stored charge raising both your attack damage and your execution damage.'),
  'cooldown-reverb': m('Reverb', 'Your next execution lands for a percentage more.'),
  'cooldown-alignment': m('Alignment', 'An attack-speed window opened by lining your cooldowns up.'),
  'cooldown-rupture': m('Rupture', 'Your regular attacks bypass a share of the target’s plating and damage reduction while it holds.'),
  'cooldown-vengeance': m('Vengeance', 'Damage you have taken is stored and paid back through your next execution.'),
  'cooldown-channel': m('Channel', 'A sustained beam: it strikes on a fixed interval and every strike applies your on-hit effects.'),

  // -- Energy ----------------------------------------------------------------
  'energy-overcharge': m('Overcharge', 'Stacked charge added to your next discharge.'),
  'energy-overdrive': m('Surge', 'A window of raised attack damage.'),
  'energy-channel': m('Flow', 'Upkeep stacks that add on-hit damage for as long as you can pay for them.'),
  'energy-binary-charge': m('Charge phase', 'The slow half of the binary cycle: heavier on-hit damage, but slower attacks, slower energy gain and a weak discharge.'),
  'energy-binary-discharge': m('Discharge phase', 'The fast half of the binary cycle: more attack damage, faster attacks, faster energy gain and a strong discharge.'),
  'energy-storm': m('Storm', 'Your next few attacks are empowered by a damage multiplier.'),
  'energy-aether': m('Aether', 'Your power scales continuously with how full your energy is, between a floor and a ceiling.'),
  'energy-critical-mass': m('Critical mass', 'Stacks that raise both discharge damage and energy gain, up to a hard cap.'),
  'energy-ac-charge': m('Accumulating charge', 'While charging: more damage and faster energy gain.'),
  'energy-ac-discharge': m('Accumulated discharge', 'The release window: attacks come faster and each tick lands for a share of your attack.'),
  'energy-reservoir': m('Reservoir', 'A stored pool that scales the size of your discharge.'),
  'energy-equilibrium': m('Equilibrium', 'Holding energy in balance pays a flat damage bonus.'),
  'energy-sm-pool': m('Stored charge', 'True damage held in reserve — it ignores plating and damage reduction when it is spent.'),

  // -- DoT -------------------------------------------------------------------
  'dot-vigor': m('Vigor', 'Your own damage and attack speed rise while your poison is working on the target.'),
  'dot-conflag': m('Conflagration', 'The target’s burn is running at an accelerated rate.'),
  'dot-chill': m('Chill', 'Your frost is slowing the target’s movement and stretching its attack cooldown.'),
  'dot-frozen': m('Frozen', 'The target is frozen solid and takes increased damage from everything.'),
  'dot-frenzy': m('Frenzy', 'A window of raised attack speed and added on-hit damage.'),
  'dot-frostbite': m('Frostbite', 'The target takes amplified damage from your damage-over-time specifically.'),

  // -- Reload ----------------------------------------------------------------
  'reload-snipe-ready': m('Snipe', 'Your next shot lands for a multiplier against a target still at full health.'),
  'reload-hair-trigger': m('Hair trigger', 'Rounds spent this magazine raise your attack speed.'),
  'reload-cover-fire': m('Cover fire', 'You take reduced damage while reloading — the downtime stops being a hole in your defense.'),
  'reload-momentum': m('Momentum', 'Each completed reload grants a stack that raises attack speed and shortens reload time. Stacks persist through combat and decay slowly out of combat.'),
  'reload-cannon': m('Cannon', 'Shots stored to fire mid-reload, so the magazine break is not silent.'),

  // -- Summoner --------------------------------------------------------------
  'summoner-volatile-brood': m('Volatile brood', 'One summon at a time is armed to detonate. Between detonations the next one is being prepared.'),
  'summoner-endless-swarm': m('Endless swarm', 'Your formation refills itself toward its target count rather than needing to be resummoned.'),
  'summoner-harrier-brood': m('Harrier brood', 'Distinct summons stack an accusation on your target; what deepens it is the number of UNIQUE summons marking it, not the number of hits.'),
  'summoner-coordinated-hunt': m('Coordinated hunt', 'The formation runs a shared cycle; each contribution advances it toward the payoff.'),
  'summoner-withering-chorus': m('Withering chorus', 'Each distinct voice established on the target deepens the chorus afflicting it.'),
  'summoner-grand-ritual': m('Grand ritual', 'The ritual grants a number of empowered summon attacks, then must be rebuilt.'),
  'summoner-colossus': m('Colossus', 'Your formation is condensed into a single large summon. While it is down, it is reconstructing.'),
  'summoner-battle-bond': m('Battle bond', 'Fixed contributions accumulate toward a linked strike shared between you and your summons.'),
  'summoner-twin-covenant': m('Twin covenant', 'Two complementary twins. If one falls the survivor keeps a bounded fallback rather than the full pairing.'),

  // -- Weapons ---------------------------------------------------------------
  flurry: b('Flurry', 'A weapon proc raising your attack speed while its stacks hold.'),
  sunlight: b('Sunlight', 'The Desert Falchion’s alpha window: opening on a fresh enemy raises ALL the damage you deal — attacks, on-hit, Techniques, damage-over-time and summons — for a few seconds. Opening on another fresh enemy does not extend it; spend the window, then earn a new one.'),

  // -- Mobility boots --------------------------------------------------------
  'mob-sprint': b('Sprint', 'Forest boots: extra movement speed while you are out of combat, for crossing a node rather than winning a fight.'),
  'mob-haste': b('Haste', 'Plains boots: a burst of movement speed on a kill.'),
  'mob-burst': b('Burst', 'Mountain boots: extra speed while you are closing the gap to your target.'),
  'mob-grave': b('Grave pace', 'Graveyard boots: kills stack movement speed and tenacity together.'),
  'mob-kite': b('Kite', 'Desert boots: extra speed while you are moving AWAY from your target.'),
  'mob-rush': b('Rush', 'Tundra boots: speed that ramps the longer you keep moving without stopping.'),
  'mob-volcanic': b('Volcanic stride', 'Volcanic boots: passive movement speed, active whenever it is not suppressed by a hit.'),
  'mob-suppress': { title: 'Stride suppressed', kind: 'debuff', help: 'A direct hit has switched off your Volcanic boots’ speed bonus. It returns once you go untouched again.' },
  'stance-reaper': b('Momentum', 'Reaper Stance: a kill has left you attacking harder and faster. It keeps running after you leave the stance — that carry-over is the whole point, so spend it on the next enemy.'),
  'stance-charge': b('Charge', 'Powering Up: charge banked so far. It only builds while you are fighting, and it is lost if the fight ends. Leaving the stance spends it for a burst lasting as long as you charged.'),
  'stance-release': b('Unleashed', 'Powering Up: the charge you banked, spent. Extra damage and attack speed for as long as you spent charging it.'),
};

// -- Target-frame statuses ---------------------------------------------------
// Raw TracksCombat effect ids as they appear on a monster. Several are the
// enemy-facing side of a mechanic that also has a player-side entry above.
const TARGET_HELP: Record<string, StatusHelp> = {
  dot: d('Damage over time', 'Your damage-over-time is working on this target. It bypasses plating entirely and only half the target’s damage reduction applies, so it is your answer to heavily armoured enemies.'),
  'dot-chill': d('Chill', 'Your frost is slowing this target’s movement and stretching the gap between its attacks.'),
  'dot-frozen': d('Frozen', 'The target is frozen and takes increased damage from every source while it lasts.'),
  'dot-smolder': d('Smolder', 'A slow burn on the target, ticking past its plating.'),
  'dot-conf': d('Conflagration', 'The target’s burn has caught properly and is running at an accelerated rate.'),
  slow: d('Slow', 'The target’s movement speed is cut, so it closes on you and repositions more slowly.'),
  root: d('Root', 'The target cannot move. It can usually still attack anything already in reach.'),
  'ability-slowed': d('Hamstrung', 'Hamstring has crippled the target’s stride: movement is reduced and its attack cooldown is lengthened. It can still attack and cast; this is soft control, not a root or stun.'),
  'ability-rooted': d('Bound', 'Binding Strike has pinned the target in place. It can still attack anything already in reach, but cannot reposition until the bind ends.'),
  stunned: d('Stunned', 'The target cannot move or act until this hard-control window ends. This is the control applied by Stunning Strike or a frost shatter; slow resistance does not help.'),
  'stun-immune': b('Stun ward', 'The target is protected from another stun while this ward lasts, including the tail after the current stun. It does not reduce damage or prevent slows.'),
  'canopy-chameleon-barrage': b('Barrage', 'The Canopy Chameleon has primed a short volley: its next two attacks resolve at triple attack speed. The counter shows how many attacks remain.'),
  'thornback-chameleon-barrage': b('Barrage', 'The Thornback Chameleon has primed a thorn volley: its next three attacks resolve at triple attack speed. The counter shows how many attacks remain.'),
  'plating-shred': d('Shred', 'Plating stripped from the target. Every hit landed on it — yours and your party’s — has that much less flat damage removed.'),
  'reload-suppress-shred': d('Suppressed', 'Suppressing fire has stripped plating from the target. The shred remains as a separate reload pressure effect, so the target’s flat protection is lower while it lasts.'),
  'cadence-hemorrhage': d('Bleed', 'The target is bleeding: damage over time applied by your rhythm, past its plating.'),
  'energy-storm': d('Storm', 'Storm charge is grounding through this target.'),
  brittle: d('Brittle', 'Each Brittle stack can strip the target’s flat plating and damage reduction, so more of your hits get through.'),
  'dr-shatter': d('Shattered', 'Brittle has been stacked to its shatter threshold: the target’s damage reduction is stripped to nothing for the window. Plating still applies, but the percentage reduction is gone.'),
  vuln: d('Vulnerable', 'The target takes amplified damage from every source while this holds.'),
  vulnerability: d('Vulnerable', 'The target takes amplified damage from every source while this holds.'),
  'expose-weakness': d('Exposed', 'Your Technique has opened the target up: it takes increased damage from everything, your party included, for the duration.'),
  'void-corruption': d('Corruption', 'Void corruption is eating the target from the inside.'),
  'summoner-harried': d('Accused', 'Your summons have marked this target. What deepens it is the number of DISTINCT summons on it, not how often they hit.'),
  'summoner-withering-chorus': d('Chorus', 'Each distinct summon voice on the target deepens the affliction.'),
  'enemy-barrier': { title: 'Barrier', kind: 'buff', help: 'A temporary absorb shell is protecting this monster. Damage drains the shell before health; when a reforming clock is shown, sustained pressure is what keeps it broken.' },
  'source-barrier': { title: 'Barrier', kind: 'buff', help: 'A boss-owned absorb barrier is protecting this monster. Direct damage drains the ward before health; the pattern drops it when its defensive beat ends.' },
  'boss-roar-haste': b('Rallying Cry', 'A boss roar has hastened this monster, raising its attack cadence for the rally window. The cry adds speed, not a separate damage hit.'),
  'monster-death-empower': b('Necrotic Surge', 'A nearby undead ally died and left a death surge behind. Each stack raises this monster’s damage by 12% for six seconds, so leaving survivors near the corpse makes the pack worse.'),
  'elder-carapace-renewal': b('Abyssal Carapace', 'The Elder Leviathan has raised its shell, absorbing direct damage before health for five seconds. Damage-over-time continues through it; spend burst before the carapace fades.'),
  'magma-molten-guard': b('Molten Guard', 'The Magma Tortoise has wrapped itself in a molten ward that absorbs direct damage before health for 4.5 seconds. Damage-over-time continues through the guard.'),
  'magma-obsidian-shell': b('Obsidian Shell', 'The Magma Salamander’s shell has hardened into a heavy ward, absorbing direct damage before health for five seconds. Damage-over-time continues through the shell.'),
  'shatter-vulnerable': d('Shatter Window', 'The monster’s ice armor has broken open. It takes amplified damage for the vulnerability window, so spend your burst before the shell reforms.'),
  'monster-howl-haste': { title: 'Howl', kind: 'buff', help: 'The Dire Wolf’s rally speeds up attack cadence for itself and nearby monsters by 50% for the howl window.' },
  'monster-ape-chestbeat': { title: 'Chestbeat', kind: 'buff', help: 'The Jungle Ape’s chestbeat speeds up attack cadence for itself and nearby monsters by 30% for the rally window.' },
  'carrion-screech-haste': { title: 'Necrotic Screech', kind: 'buff', help: 'The Carrion Vulture’s screech speeds up attack cadence for nearby undead allies by 25% for five seconds.' },
  'thorn-spitter-barrage': { title: 'Barrage', kind: 'buff', help: 'The Thorn Spitter has primed its next three attacks to resolve at triple attack speed. The burst changes cadence, not the damage of each thorn.' },
  'granite-barrier': { title: 'Granite Barrier', kind: 'buff', help: 'The Granite Titan has raised a temporary ward that absorbs direct damage before health for eight seconds. Damage-over-time is not stopped by the ward.' },
  shelled: { title: 'Shelled', kind: 'buff', help: 'The Snapper has withdrawn into its shell for a short defensive pause. Direct hits are reduced to a fraction of their damage, but damage-over-time continues at full strength.' },
  'poison-dagger-burn': d('Poison', 'A weapon reservoir: a pool of poison damage stored on the target that drains into it over time. The badge counts damage still owed, not stacks.'),
  'swamp-mirebrand-burn': d('Poison', 'A weapon reservoir of swamp poison stored on the target, draining into it over time. The badge counts damage still owed.'),
  'swamp-blightbrand-burn': d('Poison', 'A weapon reservoir of blight stored on the target, draining into it over time. The badge counts damage still owed.'),
  'cinderbrand-burn': d('Burn', 'A weapon reservoir of fire stored on the target, draining into it over time. The badge counts damage still owed.'),
  'tundra-rimebrand-burn': d('Chill', 'A weapon reservoir of frost stored on the target, draining into it over time. The badge counts damage still owed.'),
  'rimebrand-burn': d('Chill', 'A weapon reservoir of frost stored on the target, draining into it over time. The badge counts damage still owed.'),
};

// -- Boss effects ------------------------------------------------------------
const BOSS_HELP: Record<string, StatusHelp> = {
  enrage: { title: 'Enraged', kind: 'boss', help: 'The boss has crossed a threshold and fights harder for the rest of the encounter.' },
  regen: { title: 'Regenerating', kind: 'boss', help: 'The boss is healing itself. Out-damage the regeneration or the fight does not end.' },
  shield: { title: 'Shielded', kind: 'boss', help: 'A pool absorbing your damage before its health does.' },
  summon: { title: 'Summoning', kind: 'boss', help: 'The boss is calling adds. Whether to clear them or push the boss is the encounter’s question.' },
  'stat-buff': { title: 'Empowered', kind: 'boss', help: 'A legacy or unspecialized phase modifier has raised one of the boss’s stats for the rest of its life.' },
  'stat-buff-attack': { title: 'Enraged', kind: 'boss', help: 'The boss’s attack power has been raised for the rest of its life.' },
  'stat-buff-speed': { title: 'Frenzied', kind: 'boss', help: 'The boss’s movement speed has been raised for the rest of its life.' },
  'stat-buff-attackSpeed': { title: 'Frenzied', kind: 'boss', help: 'The boss’s attack cadence has been raised for the rest of its life.' },
  'stat-buff-plating': { title: 'Hardened', kind: 'boss', help: 'The boss has gained additional flat protection for the rest of its life.' },
  'stat-buff-damageReduction': { title: 'Fortified', kind: 'boss', help: 'The boss has gained additional damage reduction for the rest of its life.' },
  'stat-buff-evasion': { title: 'Elusive', kind: 'boss', help: 'The boss has gained additional evasion for the rest of its life.' },
  'relentless-pursuit': { title: 'Relentless Pursuit', kind: 'boss', help: 'The Dune-Stalker Emperor has entered its closing phase: it moves 30% faster, and its Execution cycle comes around sooner for the rest of the fight.' },
  'crag-rush': { title: 'Crag Rush', kind: 'boss', help: 'The Horn-Behemoth is in its final quarter: it moves 25% faster while Cragbreaker returns sooner.' },
  'cinder-fury': { title: 'Cinder Fury', kind: 'boss', help: 'The Magma-Salamander’s attacks deal 15% more damage as its shell-and-vent cycle tightens.' },
  'earthshaker-rush': { title: 'Earthshaker Rush', kind: 'boss', help: 'The Iron-Crest Titan is below 25%: it moves 35% faster and Earthshatter returns sooner.' },
  sandsurge: { title: 'Sandsurge', kind: 'boss', help: 'The Dune-Throne Sovereign has dropped its kite and surges forward 35% faster for the rest of the fight.' },
  'bestial-frenzy': { title: 'Bestial Frenzy', kind: 'boss', help: 'The Verdant-Crown Predator is cornered: it stops fleeing and commits with 40% more attack damage and 25% more movement speed.' },
  'caldera-fury': { title: 'Caldera Fury', kind: 'boss', help: 'The Caldera Sovereign’s attacks deal 15% more damage as its final eruption race tightens.' },
  'blood-in-the-water': { title: 'Blood in the Water', kind: 'boss', help: 'The Elder Trench Serpent senses the finish: it closes 25% faster while Devour returns on a shorter cycle.' },
  morph: { title: 'Morphed', kind: 'boss', help: 'The boss has changed form, and with it which of its attacks are live.' },
  slam: { title: 'Slam', kind: 'boss', help: 'A heavy telegraphed blow is winding up. Distance is the answer.' },
  'charge-instinct': { title: 'Instinct', kind: 'boss', help: 'Each charge builds Instinct: future charges move faster without a stack cap, and each stack shortens the remaining wind-up by 30%, down to 0.4 seconds. T3 and T4 also shorten charge cooldown per stack (15% / 20%), down to 1 second. Landing a charge clears all stacks and restores its normal cooldown.' },
  'escape-instinct': { title: 'Escape Instinct', kind: 'boss', help: '+30% fleeing speed per stack. Stacks indefinitely until a successful escape clears them.' },
  'boss-stunned': {
    title: 'Stunned',
    kind: 'boss',
    help: 'Spent from its own attack. It cannot move or strike until it recovers — this is your window to hit it for free.',
  },
};

/** Fallback title for an id with no authored entry: `dot-frost-x` -> "Frost X". */
export function prettifyStatusId(id: string): string {
  return id
    .replace(/^(dot|debuff|defense|ability|mob)-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Authored copy for a player buff/debuff id, or undefined when none exists. */
export function buffHelp(id: string): StatusHelp | undefined {
  return STATUS_HELP[id];
}

/**
 * Authored copy for a target-frame status id. Falls back to the player-side entry
 * for mechanics that share an id across both frames, so one edit covers both.
 */
export function targetStatusHelp(id: string): StatusHelp | undefined {
  if (id.startsWith('barrier:')) return TARGET_HELP['source-barrier'];
  return TARGET_HELP[id] ?? STATUS_HELP[id];
}

export function bossEffectHelp(name: string): StatusHelp | undefined {
  return BOSS_HELP[name];
}

/** The kicker line under a tooltip title, e.g. "Debuff". */
export function statusKindLabel(kind: StatusKind): string {
  return KIND_LABEL[kind];
}

/** Every id this module has authored copy for — used by the coverage test. */
export function authoredStatusIds(): {
  player: string[];
  target: string[];
  boss: string[];
} {
  return {
    player: Object.keys(STATUS_HELP),
    target: Object.keys(TARGET_HELP),
    boss: Object.keys(BOSS_HELP),
  };
}
