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
  'debuff-slow': d('Slow', 'Your movement speed is cut. Slow resistance shortens and weakens it, and the figure below is what you are actually moving at after that resistance.'),
  'debuff-root': d('Root', 'You cannot move. A cave Pin also stops you attacking. Rooting is hard control: break-free effects and control resistance are what answer it, not slow resistance.'),
  'debuff-frost-ramp': d('Frost', 'Cold takes your legs and your tempo together, and deepens as stacks build — each stack slows movement further and lengthens the gap between your attacks. It thaws once you break away.'),
  'debuff-dot': d('Damage over time', 'Damage that keeps landing after the hit that applied it. It ignores plating entirely and only half your damage reduction applies, so armour is the wrong answer — DoT resistance and killing the source are.'),
  'debuff-swamp-rot': d('Rot', 'Swamp rot stacks with every hit and ticks for a share of its stacks. Like all damage over time it goes straight past plating.'),
  'debuff-sun-mark': d('Marked', 'You are painted for the next heavy blow, which lands amplified instead of ordinary. Cleansing the mark, or being somewhere else when it lands, is the whole counter.'),
  'debuff-volcanic-heat': amb('Volcanic heat', 'The room pays you to overstay and then collects: heat builds the longer you fight in it, raising the damage you deal AND the damage you take. Leaving the fight lets it bleed off.'),
  'debuff-tundra-chill': amb('Tundra chill', 'Cold accumulates while you stay in it, taking movement speed and stretching your attack cooldown. Unlike Volcanic heat it pays you nothing for the trouble.'),
  'debuff-sundered': d('Sundered', 'Your defenses are split open: every source hits you harder for as long as it lasts. It stacks, so a fight you cannot end quickly gets worse on a curve.'),
  'debuff-plating-shred': d('Corroded plating', 'This encounter is stripping flat plating from every incoming hit. The corrosion stacks until the source is defeated or the encounter ends.'),
  'debuff-antiheal': d('Antiheal', 'Healing you receive is suppressed. Out-sustaining the fight stops being an option — burst it down or break away until this expires.'),
  'debuff-stunned': d('Stunned', 'You cannot act. Hard control: control resistance and break-free effects shorten it; slow resistance does nothing.'),

  // -- Abilities -------------------------------------------------------------
  'ability-guard': b('Guard', 'Your Guard is up: incoming damage is reduced for the window. Guard potency deepens the reduction and Guard duration lengthens the window.'),
  'ability-guard-2': b('Guard', 'Your second Guard is up. Two equipped Guards layer independently, each with its own window.'),
  'ability-bramble': b('Bramble', 'Thorned plating: you gain flat plating and return damage to anything that hits you, for the duration.'),
  'ability-second-wind': b('Recovery skill', 'A Recovery window is open — a share of your Recovery rate is switched on, healing you over the duration. What that converts to in HP depends on your Recovery stat.'),
  'ability-second-wind-2': b('Recovery skill', 'Your second Recovery window is open. Second Wind (strong and short) and Recuperate (weak and long) can be held together and run independently.'),
  'ability-frenzy': b('Frenzy', 'Your attack speed is raised for the window.'),
  'ability-control-resist': b('Unbound', 'You broke free, and incoming control is shortened for a moment afterward so you are not immediately re-caught.'),

  // -- Defense ---------------------------------------------------------------
  'defense-ward': b('Ward', 'A temporary pool that absorbs damage before your health does. Unlike your barrier it expires rather than recharging.'),
  'defense-absorb': b('Absorb', 'Part of the damage you took was diverted into a pool that heals back over time. You still took the hit — this returns some of it gradually.'),
  'defense-recovery': b('Recovery', 'How much of your Recovery rate is switched on right now. Out of combat everyone runs at 100%; in combat it is off by default and class passives, charms and Recovery skills each switch on a share, which add together. This tile is the only place that total is visible.'),
  'defense-revive-heal': b('Reviving', 'You survived a killing blow and are being healed back out of it over time.'),
  'defense-debt': { title: 'Damage debt', kind: 'debuff', help: 'Damage deferred rather than removed. Part of the hits you took is queued and ticks onto you over time instead of landing at once — it softens burst, it does not cancel it.' },
  'defense-hardening': b('Hardening', 'Plating gained from being hit, on top of your equipment. Flat damage removed from each incoming hit before damage reduction.'),
  'defense-stationary-dr': b('Rooted stance', 'Extra damage reduction earned by holding still. Moving gives it up.'),
  'defense-sustained-dr': b('Endurance', 'Extra damage reduction that climbs the longer a single fight runs, and resets when you leave combat.'),
  'defense-hardening-maxdr': b('Tempered', 'A damage-reduction pulse granted for sitting at maximum hardening.'),
  'defense-reactive-plating': b('Reactive plating', 'Plating that stacks up as you are struck, so a long exchange gets cheaper the further into it you are.'),

  // -- Cadence ---------------------------------------------------------------
  'cadence-accelerando': m('Accelerando', 'Consecutive attacks shorten your attack cooldown, stack by stack. Breaking rhythm gives it back.'),
  'cadence-echo': m('Echo', 'Your next few hits echo, each landing for bonus damage on top of the strike itself.'),
  'cadence-resonance': m('Resonance', 'Resonance banks into your finisher: every stack raises what the finisher pays out when it lands.'),
  'cadence-verdict': m('Verdict', 'Your finisher executes outright below a stored HP threshold rather than merely damaging.'),
  'cadence-aftershock': m('Aftershock', 'Your next few attacks fire their on-hit effects twice.'),
  'cadence-metronome': m('Metronome', 'Keeping tempo adds flat damage to your coming hits.'),
  'cadence-rampage': m('Rampage', 'Kills feed rampage, which raises your damage until it lapses. At the cap it stops growing but keeps paying.'),
  'cadence-crescendo': m('Crescendo', 'The rhythm you have built raises finisher damage by a percentage.'),

  // -- Cooldown --------------------------------------------------------------
  'cooldown-overdrive': m('Overdrive', 'A burst window: your attack speed is raised sharply while it lasts.'),
  'cooldown-eternal-charge': m('Eternal charge', 'Damage banked into your next execution, growing with each stack.'),
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
  'reload-momentum': m('Momentum', 'A hit streak that raises attack speed and cuts reload time together.'),
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
  'plating-shred': d('Shred', 'Plating stripped from the target. Every hit landed on it — yours and your party’s — has that much less flat damage removed.'),
  'reload-suppress-shred': d('Suppressed', 'Suppressing fire has stripped plating from the target.'),
  'cadence-hemorrhage': d('Bleed', 'The target is bleeding: damage over time applied by your rhythm, past its plating.'),
  'energy-storm': d('Storm', 'Storm charge is grounding through this target.'),
  brittle: d('Brittle', 'The target’s damage reduction is broken down, so the percentage it removes from your hits is smaller.'),
  vuln: d('Vulnerable', 'The target takes amplified damage from every source while this holds.'),
  vulnerability: d('Vulnerable', 'The target takes amplified damage from every source while this holds.'),
  'expose-weakness': d('Exposed', 'Your Technique has opened the target up: it takes increased damage from everything, your party included, for the duration.'),
  'void-corruption': d('Corruption', 'Void corruption is eating the target from the inside.'),
  'summoner-harried': d('Accused', 'Your summons have marked this target. What deepens it is the number of DISTINCT summons on it, not how often they hit.'),
  'summoner-withering-chorus': d('Chorus', 'Each distinct summon voice on the target deepens the affliction.'),
  'enemy-barrier': { title: 'Barrier', kind: 'buff', help: 'A temporary absorb shell is protecting this monster. Damage drains the shell before health; when a reforming clock is shown, sustained pressure is what keeps it broken.' },
  'monster-howl-haste': { title: 'Howl', kind: 'buff', help: 'The Dire Wolf has rallied nearby monsters, including itself. Their attacks come 50% faster while this window lasts.' },
  'monster-ape-chestbeat': { title: 'Chestbeat', kind: 'buff', help: 'The Jungle Ape has hastened nearby monsters, including itself. Their attacks come 30% faster while this window lasts.' },
  'carrion-screech-haste': { title: 'Necrotic Screech', kind: 'buff', help: 'A Carrion Vulture has hastened nearby allies. Their attacks come 25% faster until the screech fades.' },
  'thorn-spitter-barrage': { title: 'Barrage', kind: 'buff', help: 'The Thorn Spitter has primed its next three attacks to fire at triple speed.' },
  'granite-barrier': { title: 'Granite Barrier', kind: 'buff', help: 'The Granite Titan has raised a temporary ward that absorbs direct damage before its health.' },
  shelled: { title: 'Shelled', kind: 'buff', help: 'The Snapper has withdrawn into its shell. Direct hits are heavily reduced, but damage-over-time continues at full strength while it waits inside.' },
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
  'stat-buff': { title: 'Empowered', kind: 'boss', help: 'The boss has raised its own stats for a window.' },
  'bestial-frenzy': { title: 'Bestial frenzy', kind: 'boss', help: 'The beast is frenzied — faster and more dangerous until it settles.' },
  morph: { title: 'Morphed', kind: 'boss', help: 'The boss has changed form, and with it which of its attacks are live.' },
  slam: { title: 'Slam', kind: 'boss', help: 'A heavy telegraphed blow is winding up. Distance is the answer.' },
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
