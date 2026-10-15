/**
 * The human name for every `mechanicEffects` key that can reach a player-facing
 * surface (item tooltips, upgrade diffs, crafting rows).
 *
 * WHY THIS LIVES IN `shared/` AND NOT NEXT TO THE RENDERER
 * -------------------------------------------------------
 * The vocabulary used to live in `client/src/ui/crafting/itemDisplay.ts` with a
 * de-slugging fallback, so an unlabelled key rendered as plausible-looking prose
 * (`technique.cast-speed-pct` → "cast speed pct") and nobody noticed until a
 * player did. A de-slug is indistinguishable from a real label at a glance, which
 * is exactly why the gap kept regrowing: every newly authored effect key silently
 * produced one more.
 *
 * The fix is an invariant test, and the test runner only discovers
 * `server/test/*.test.ts` and `shared/src/**\/*.test.ts` — so the table has to be
 * here for `mechanicLabels.test.ts` to guard it. That test derives the authored
 * key set from the recipe/item data itself, so it fails the moment someone
 * authors an effect key without writing a label for it.
 *
 * WHAT IS AND IS NOT HERE
 * -----------------------
 * - LABELS (the human name) live here. They are content, they are shared, and
 *   they are what the test guards.
 * - FORMATTERS (`15%` vs `1.5×` vs `4s`) stay in `itemDisplay.ts`. Those are
 *   presentation and belong with the renderer.
 *
 * SCOPE. This covers the namespaces that gear and relics
 * can author: `defense`, `mobility`, `shared`/`weapon`, `summoner`, `guard`,
 * `technique`, `relic`. The class-mechanic namespaces
 * (`cadence`, `cooldown`, `reload`, `energy`, `dot`) are authored on skill-tree
 * nodes only, never on an item, and are rendered by the rule-driven engine in
 * `client/src/ui/describe/passiveText.ts`. If an item ever authors one, the test
 * will fail and the key belongs here.
 *
 * REGISTER. Labels are terse and sentence-case, because the surfaces that consume
 * them are compact diff rows and one-line summaries ("Barrier 15% · Cleanse rate
 * 8s"). Terse is a constraint of the UI, not an excuse for jargon — every entry
 * should read as something a player would say.
 */

import type { PassiveKey } from '../passives';

export interface MechanicLabel {
  /** Player-facing name. Terse, sentence-case, never a de-slugged key. */
  label: string;
  /**
   * True when this key is only a qualifier inside another effect's sentence — a
   * duration, interval, ramp time, stack cap or threshold that has no meaning on
   * its own. Companions are omitted from one-line summaries so the headline of
   * each effect reads cleanly, and are folded into the prose of the effect they
   * belong to. They still carry a real label for the surfaces that show every
   * row (upgrade diffs, the debug-ish full listings).
   */
  companion?: boolean;
}

export const MECHANIC_LABELS: Partial<Record<PassiveKey, MechanicLabel>> = {
  // ── Defense: sustain, mitigation, and the shapes they ramp in ──────────────
  'defense.recovery-active-pct':          { label: 'Combat Recovery' },
  'defense.recovery-pulse-pct':           { label: 'Recovery pulse' },
  'defense.recovery-pulse-interval-ms':   { label: 'Pulse rate', companion: true },
  'defense.recovery-pulse-duration-ms':   { label: 'Pulse duration', companion: true },
  'defense.recovery-on-kill-pct':         { label: 'Recovery on kill' },
  'defense.recovery-on-kill-ms':          { label: 'Kill Recovery duration', companion: true },
  'defense.recovery-skill-potency':       { label: 'Recovery skill potency' },
  'defense.barrier-pct':                  { label: 'Barrier' },
  'defense.barrier-recharge-pct':         { label: 'Barrier recharge', companion: true },
  'defense.barrier-delay-ms':             { label: 'Barrier delay', companion: true },
  'defense.barrier-stationary-recharge-pct': { label: 'Barrier recharge while holding' },
  'defense.dot-resistance':               { label: 'DoT resist' },
  'conduit.command': { label: 'Command' },
  'conduit.damage-pct': { label: 'Summon damage' },
  'conduit.hp-pct': { label: 'Summon HP' },
  'conduit.cooldown-pct': { label: 'Summon attack speed' },
  'conduit.ability-pct': { label: 'Summon abilities' },
  'conduit.poison-stacks': { label: 'Summon poison' },
  'conduit.plating-share': { label: 'Summon plating' },
  'conduit.herd-pct': { label: 'Rebuild out of combat' },
  'conduit.rebuild-speed-pct': { label: 'Rebuild speed' },
  'conduit.thorns': { label: 'Thorns' },
  'conduit.sapbark-ms': { label: 'Sapbark' },
  'conduit.poison-shift': { label: 'Poison Shift' },
  'conduit.bloodtithe-pct': { label: 'Bloodtithe' },
  'conduit.intercept-pct': { label: 'Big-hit intercept' },
  'reload.max-ammo': { label: 'Clip size' },
  'reload.reload-time-ms': { label: 'Reload time', companion: true },
  'slinger.reload-walk-pct': { label: 'Walk while reloading' },
  'slinger.elbow-room': { label: 'Reload near a crowd' },
  'slinger.breathing-room': { label: 'Breathing room' },
  'slinger.fleet': { label: 'Fleet' },
  'slinger.snake-oil': { label: 'Snake oil' },
  'slinger.oilskin': { label: 'Oilskin' },
  'slinger.dig-in': { label: 'Dig in' },
  'slinger.hunker': { label: 'Hunker' },
  'slinger.regroup-speed-pct': { label: 'Regroup' },
  'slinger.scatter-extra': { label: 'Extra Scatter nicks' },
  'slinger.opener-pct': { label: 'Opening rounds' },
  'slinger.poison-long-pct': { label: 'Longer poison' },
  'slinger.last-vs-poisoned-pct': { label: 'Last round vs poison' },
  'slinger.last-round-pct': { label: 'Heavy last round' },
  'slinger.ramp-pct': { label: 'Round ramp' },
  'spirit.area-extra': { label: 'Extra area targets' },
  'spirit.cost-mult': { label: 'Spend cost' },
  'spirit.damage-mult': { label: 'Spend damage' },
  'spirit.single-pct': { label: 'Single-target spends' },
  'spirit.area-pct': { label: 'Area spends' },
  'spirit.soak-pct': { label: 'Soak' },
  'spirit.ooc-flow-pct': { label: 'Out-of-combat flow' },
  'spirit.clear-sky-pct': { label: 'Clear Sky' },
  'spirit.static-skin': { label: 'Static Skin' },
  'spirit.sealed-vessel': { label: 'Sealed Vessel' },
  'spirit.petrichor-pct': { label: 'Petrichor' },
  'spirit.grounded': { label: 'Grounded' },
  'spirit.afterstorm-x': { label: 'Afterstorm' },
  'spirit.ironbound': { label: 'Ironbound' },
  'spirit.capacitor': { label: 'Capacitor' },
  'apprentice.branching': { label: 'Branching sigils' },
  'apprentice.tick-speed': { label: 'Sigil tick speed' },
  'apprentice.linger': { label: 'Sigil linger' },
  'apprentice.sigils-per-hit': { label: 'Sigils per hit' },
  'apprentice.cap-extra': { label: 'Sigil cap' },
  'apprentice.payoff-pct': { label: 'Payoff damage' },
  'apprentice.tick-mult': { label: 'Sigil tick damage' },
  'apprentice.siphon-pct': { label: 'Siphon heal' },
  'apprentice.siphon-cd-pct': { label: 'Siphon cooldown' },
  'apprentice.warding': { label: 'Warding Sigils' },
  'apprentice.feeding': { label: 'Feeding Swarm' },
  'apprentice.give-ground': { label: 'Give Ground' },
  'apprentice.numbing-calm': { label: 'Numbing Calm' },
  'apprentice.still-mind': { label: 'Still Mind' },
  'apprentice.sigil-weight': { label: 'Sigil Weight' },
  'apprentice.long-draw': { label: 'Long Draw' },
  'defense.ward-hit-pct':                 { label: 'Ward after a big hit' },
  'defense.ward-freeze-pct':              { label: 'Ward when frozen' },
  'defense.ooc-recovery-pct':             { label: 'Out-of-combat healing' },
  'defense.recovery-rhythm-max':          { label: 'Rhythm' },
  'defense.recovery-rhythm-ms':           { label: 'Rhythm build-up', companion: true },
  'defense.recovery-hit-x':               { label: 'Recovery after a big hit' },
  'defense.recovery-hit-pct':             { label: 'Big hit threshold', companion: true },
  'squire.recovery-riposte-x':            { label: 'Recovery after a Riposte' },
  'squire.recovery-caught-x':             { label: 'Recovery after a caught telegraph' },
  'defense.control-duration-cut-pct':     { label: 'Shorter control' },
  'defense.dot-cleanse-interval-ms':      { label: 'Poison and bleed cleanse' },
  // ── The Striker's weapon jobs and lines (class-first build plan CS.4) ──────
  'striker.nick-pct':                     { label: 'Nick the nearest enemy' },
  'striker.extra-strike-pct':             { label: 'Extra strike' },
  'striker.dot-duration-pct':             { label: 'Longer bleeds' },
  'striker.finisher-vs-dot-pct':          { label: 'Finisher vs bleeding targets' },
  'striker.finisher-pct':                 { label: 'Finisher damage' },
  'striker.windup-speed-pct':             { label: 'Faster wind-ups' },
  'striker.technique-damage-pct':         { label: 'Technique damage' },
  'striker.setup-duration-cut-pct':       { label: 'Shorter setups' },
  'striker.plating-per-enemy':            { label: 'Plating per enemy on you' },
  'striker.dot-floor-pct':                { label: 'DoT floor while attacking' },
  'striker.cast-unbreakable':             { label: 'Unbreakable casts' },
  'striker.cast-cap-cut-pct':             { label: 'Lower damage cap while casting' },
  'striker.bulk-pct':                     { label: 'Bulk' },
  'striker.beat-slow-pct':                { label: 'Slower beats' },
  'striker.grit-pct':                     { label: 'Grit' },
  'striker.grit-ms':                      { label: 'Grit window', companion: true },
  // ── The Squire's weapon jobs and lines (class-first build plan CQ.4) ───────
  'squire.slam-damage-pct':               { label: 'Slam damage' },
  'squire.slam-radius-pct':               { label: 'Wider slam' },
  'squire.counter-damage-pct':            { label: 'Counter damage' },
  'squire.bash-stun-pct':                 { label: 'Longer Shield Bash stun' },
  'squire.bash-cost-cut-pct':             { label: 'Cheaper Shield Bash' },
  'squire.steel-will-cost-cut-pct':       { label: 'Cheaper Steel Will' },
  'squire.slam-bleed-pct':                { label: 'Slam bleed' },
  'squire.slam-after-guard-pct':          { label: 'Slam after a caught blow' },
  'squire.slam-after-guard-ms':           { label: 'Caught-blow window', companion: true },
  'squire.shove-weaken-pct':              { label: 'Shoved enemies weakened' },
  'squire.shove-weaken-ms':               { label: 'Weakened duration', companion: true },
  'squire.dodge-fills':                   { label: 'Dodges fill Resolve' },
  'squire.guard-steadfast':               { label: 'Unshakable while braced' },
  'squire.shred-regrow-ms':               { label: 'Plating regrows', companion: true },
  'squire.shred-fill-pips':               { label: 'Corrosion fills Resolve' },
  'squire.shove-heal-pct':                { label: 'Shove heals' },
  'squire.cleanse-heal-pct':              { label: 'Cleanse heals' },
  'squire.slam-hook-px':                  { label: 'Slam hooks fleeing enemies' },
  'squire.throw-damage-pct':              { label: 'Thrown shield damage' },
  'squire.throw-range-px':                { label: 'Shield throw range', companion: true },
  'squire.ambush-steadfast':              { label: 'Unshakable against ambushes' },
  'squire.watchful-heal-pct':             { label: 'Heal from a caught ambush' },
  'squire.ranged-fill-x':                 { label: 'Ranged hits fill Resolve' },
  'squire.challenge-heal-pct':            { label: 'Challenge heals' },
  'defense.debuff-resistance':            { label: 'Debuff resist' },
  'defense.hit-to-dot-pct':               { label: 'Damage deferred' },
  'defense.absorb-pct':                   { label: 'Absorb' },
  'defense.absorb-guard-bonus-pct':       { label: 'Absorb during Guards' },
  'defense.max-hit-pct':                  { label: 'Damage cap' },
  'defense.max-hit-mult':                 { label: 'Excess reduction', companion: true },
  'defense.max-hit-refills-barrier':      { label: 'Cap refills barrier' },
  'defense.evade-mitigation':             { label: 'Evade mitigation' },
  'defense.recovery-ramp-max-pct':        { label: 'Ramping Recovery' },
  'defense.recovery-ramp-start-pct':      { label: 'Ramping Recovery start', companion: true },
  'defense.recovery-ramp-ramptime-ms':    { label: 'Ramping Recovery time', companion: true },
  'defense.stationary-dr-pct':            { label: 'Stationary DR' },
  'defense.engagement-dr-pct':            { label: 'Opening damage reduction' },
  'defense.engagement-dr-ms':             { label: 'Opening protection duration', companion: true },
  'defense.overheal-ward-cap-pct':        { label: 'Overheal ward capacity', companion: true },
  'defense.stationary-dr-ramptime-ms':    { label: 'Stationary ramp', companion: true },
  'defense.absorb-ramp-max-pct':          { label: 'Ramping absorb' },
  'defense.absorb-ramp-start-pct':        { label: 'Ramping absorb start', companion: true },
  'defense.absorb-ramptime-ms':           { label: 'Ramping absorb time', companion: true },
  'defense.barrier-break-heal-pct':       { label: 'Barrier-break heal' },
  // The armor and charm variants of the same effect; the renderer sums them and
  // prints one line, so only the first stands alone.
  'defense.barrier-break-hp-recovery-pct': { label: 'Barrier-break heal', companion: true },
  'defense.overheal-ward-pct':            { label: 'Overheal ward' },
  'defense.hit-plating-per-stack':        { label: 'Reactive plating' },
  'defense.hit-plating-max-stacks':       { label: 'Reactive plating stacks', companion: true },
  'defense.hit-plating-duration-ms':      { label: 'Reactive plating time', companion: true },

  // ── Weapon / general offence ───────────────────────────────────────────────
  'shared.empowered-mult-add':            { label: 'Empowered damage' },
  'shared.damage-mult':                   { label: 'Damage bonus' },
  'shared.status-duration-resist':        { label: 'Harmful effect duration' },
  'shared.status-potency-resist':         { label: 'Enemy damage-over-time' },
  'shared.applies-through-evade':         { label: 'Effects pierce evasion' },
  'weapon.empowered-mult-bonus':          { label: 'Empowered bonus' },
  'weapon.first-strike-mult':             { label: 'First strike' },
  'weapon.first-strike-buff-damage-pct':  { label: 'Sunlight damage' },
  'weapon.first-strike-buff-duration-ms': { label: 'Sunlight duration', companion: true },
  'weapon.dead-swing-interval':           { label: 'Dead swing' },
  'weapon.dead-swing-vuln-pct':           { label: 'Dead-swing vulnerability' },
  'weapon.dead-swing-vuln-ms':            { label: 'Vulnerability time', companion: true },
  'weapon.execute-dmg-mult':              { label: 'Execute' },
  'weapon.execute-threshold-pct':         { label: 'Execute threshold', companion: true },
  'weapon.brittle-plating':               { label: 'Brittle plating shred' },
  'weapon.brittle-dr':                    { label: 'Brittle DR shred' },
  'weapon.brittle-stacks':                { label: 'Brittle stacks', companion: true },
  'weapon.brittle-shatter-dr-strip-ms':   { label: 'Brittle shatter' },
  'weapon.brittle-shatter-threshold':     { label: 'Shatter at', companion: true },
  'weapon.flurry-pct':                    { label: 'Flurry speed' },
  'weapon.flurry-stacks':                 { label: 'Flurry stacks', companion: true },

  // ── Mobility (boots) ───────────────────────────────────────────────────────
  'mobility.passive-speed-pct':           { label: 'Move speed' },
  'mobility.suppress-ms':                 { label: 'Speed lost after a hit', companion: true },
  'mobility.ooc-speed-pct':               { label: 'Out-of-combat speed' },
  'mobility.kill-speed-pct':              { label: 'Speed on kill' },
  'mobility.kill-speed-ms':               { label: 'Speed on kill time', companion: true },
  'mobility.kill-stack-speed-pct':        { label: 'Stacking speed on kill' },
  'mobility.kill-stack-tenacity-pct':     { label: 'Stacking tenacity on kill' },
  'mobility.kill-stack-ms':               { label: 'On-kill stack time', companion: true },
  'mobility.approach-speed-pct':          { label: 'Closing speed' },
  'mobility.ramp-speed-pct':              { label: 'Ramping speed' },
  'mobility.ramp-rate':                   { label: 'Ramping speed rate', companion: true },
  'mobility.kite-speed-pct':              { label: 'Kiting speed' },
  'mobility.stealth-pct':                 { label: 'Stealth' },
  'mobility.aggro-pull-pct':              { label: 'Aggro range' },
  'mobility.slow-resistance':             { label: 'Slow resist' },
  'mobility.tenacity-pct':                { label: 'Tenacity' },

  // ── Summoner (minion gear) ─────────────────────────────────────────────────
  'summoner.minion-count':                { label: 'Minions' },
  'summoner.minion-count-mult':           { label: 'Minion count' },
  'summoner.minion-count-cap':            { label: 'Minion cap', companion: true },
  'summoner.minion-damage-pct':           { label: 'Minion damage' },
  'summoner.minion-damage-mult':          { label: 'Minion damage' },
  'summoner.minion-hp-pct':               { label: 'Minion health' },
  'summoner.minion-speed-mult':           { label: 'Minion move speed' },
  'summoner.minion-size-mult':            { label: 'Minion size' },
  'summoner.minion-range':                { label: 'Minion range' },
  'summoner.minion-attack-cooldown':      { label: 'Minion attack cooldown' },
  'summoner.minion-respawn-ms':           { label: 'Resummon time' },
  'summoner.reconstruction-interval-mult': { label: 'Reconstruction rate' },
  'summoner.damage-sponge-pct':           { label: 'Damage taken by minions' },
  'summoner.leash-mult':                  { label: 'Minion leash range' },

  // ── Ability amplifiers ─────────────────────────────────────────────────────
  'technique.power-pct':                  { label: 'Technique power' },
  'technique.cooldown-reduction-pct':     { label: 'Technique cooldown' },
  'technique.cast-speed-pct':             { label: 'Cast speed' },
  'technique.kata-power-pct':             { label: 'Kata' },
  'technique.kata-stacks':                { label: 'Kata stacks', companion: true },
  'guard.cooldown-reduction-pct':         { label: 'Guard cooldown' },
  'cleanse.cooldown-reduction-pct':       { label: 'Cleanse cooldown' },
  'guard.potency-pct':                    { label: 'Guard potency' },
  'guard.duration-pct':                   { label: 'Guard duration' },
  'guard.recovery-on-fire-pct':           { label: 'Guard Recovery' },
  'guard.recovery-on-fire-ms':            { label: 'Guard Recovery duration', companion: true },
  'guard.barrier-refill-pct':             { label: 'Barrier on Guard' },
  'guard.barrier-refill-on-control-pct':  { label: 'Barrier on Break Free' },
  'guard.cleanse-pulse':                  { label: 'Pulse on Cleanse' },
  'guard.recovery-ramp-advance-ms':       { label: 'Ramp on Guard' },
  'recovery.cooldown-reduction-pct':      { label: 'Recovery skill cooldown' },

  // ── Relic ratings (title-case: these are named stats in the relic UI) ──────
  'relic.mechanic-frequency':             { label: 'Mechanic Frequency' },
  'relic.mechanic-potency':               { label: 'Mechanic Potency' },
  'relic.mechanic-buff-effect':           { label: 'Mechanic Buff Effect' },
  'relic.mechanic-debuff-effect':         { label: 'Mechanic Debuff Effect' },
};

/** The registered label for `key`, or undefined when the key has none. */
export function mechanicLabel(key: string): string | undefined {
  return MECHANIC_LABELS[key as PassiveKey]?.label;
}

/**
 * True when `key` is a qualifier inside another effect's sentence rather than an
 * effect of its own, and should therefore be skipped in one-line summaries.
 */
export function isCompanionMechanic(key: string): boolean {
  return MECHANIC_LABELS[key as PassiveKey]?.companion === true;
}

/**
 * Label for `key`, falling back to the raw key in guillemets.
 *
 * The fallback is deliberately ugly. The old behaviour de-slugged the key into
 * something that read like a stat name, so a missing label looked like a feature
 * and survived for months. `«technique.cast-speed-pct»` reads as a bug on sight,
 * which is the only useful thing an unlabelled key can do — and the invariant in
 * `mechanicLabels.test.ts` means it should never reach a player at all.
 */
export function mechanicLabelOrKey(key: string): string {
  return mechanicLabel(key) ?? `«${key}»`;
}
