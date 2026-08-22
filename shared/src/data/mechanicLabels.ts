/**
 * The human name for every `mechanicEffects` key that can reach a player-facing
 * surface (item tooltips, upgrade diffs, crafting rows, stance/rite cards).
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
 * key set from the recipe/item/stance data itself, so it fails the moment someone
 * authors an effect key without writing a label for it.
 *
 * WHAT IS AND IS NOT HERE
 * -----------------------
 * - LABELS (the human name) live here. They are content, they are shared, and
 *   they are what the test guards.
 * - FORMATTERS (`15%` vs `1.5×` vs `4s`) stay in `itemDisplay.ts`. Those are
 *   presentation and belong with the renderer.
 *
 * SCOPE. This covers the namespaces that gear, cores, relics, stances and rites
 * can author: `defense`, `mobility`, `shared`/`weapon`, `summoner`, `guard`,
 * `technique`, `core`, `rite`, `relic`. The class-mechanic namespaces
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
  'defense.dot-resistance':               { label: 'DoT resist' },
  'defense.debuff-resistance':            { label: 'Debuff resist' },
  'defense.hit-to-dot-pct':               { label: 'Damage deferred' },
  'defense.absorb-pct':                   { label: 'Absorb' },
  'defense.cleanse-stacks':               { label: 'Cleanse' },
  'defense.cleanse-interval-ms':          { label: 'Cleanse rate', companion: true },
  'defense.cleanse-empty-heal-pct':       { label: 'Cleanse heal' },
  'defense.cleanse-per-stack-heal-pct':   { label: 'Cleanse heal per stack' },
  'defense.max-hit-pct':                  { label: 'Damage cap' },
  'defense.max-hit-mult':                 { label: 'Excess reduction', companion: true },
  'defense.max-hit-refills-barrier':      { label: 'Cap refills barrier' },
  'defense.evade-mitigation':             { label: 'Evade mitigation' },
  'defense.cheat-death':                  { label: 'Cheat death' },
  'defense.post-cheat-death-heal-pct':    { label: 'Revive heal' },
  'defense.post-cheat-death-heal-ms':     { label: 'Revive heal time', companion: true },
  'defense.debt-cheat-death':             { label: 'Debt cheat-death' },
  'defense.recovery-ramp-max-pct':        { label: 'Ramping Recovery' },
  'defense.recovery-ramp-start-pct':      { label: 'Ramping Recovery start', companion: true },
  'defense.recovery-ramp-ramptime-ms':    { label: 'Ramping Recovery time', companion: true },
  'defense.hardening-per-sec':            { label: 'Hardening rate' },
  'defense.hardening-max':                { label: 'Hardening cap', companion: true },
  'defense.hardening-reset-pct':          { label: 'Hardening lost per hit', companion: true },
  'defense.hardening-max-dr-bonus':       { label: 'Max-hardening DR' },
  'defense.hardening-max-dr-ms':          { label: 'Max-hardening DR time', companion: true },
  'defense.stationary-dr-pct':            { label: 'Stationary DR' },
  'defense.stationary-dr-ramptime-ms':    { label: 'Stationary ramp', companion: true },
  'defense.sustained-fight-dr-max':       { label: 'Sustained DR' },
  'defense.sustained-fight-dr-bonus':     { label: 'Sustained DR step', companion: true },
  'defense.sustained-fight-ramptime-ms':  { label: 'Sustained DR ramp', companion: true },
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
  'shared.applies-through-evade':         { label: 'Effects pierce evasion' },
  'weapon.empowered-mult-bonus':          { label: 'Empowered bonus' },
  'weapon.first-strike-mult':             { label: 'First strike' },
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
  'mobility.acquire-speed-pct':           { label: 'Lock-on speed' },
  'mobility.acquire-speed-ms':            { label: 'Lock-on speed time', companion: true },
  'mobility.acquire-cooldown-ms':         { label: 'Lock-on cooldown', companion: true },
  'mobility.ramp-speed-pct':              { label: 'Ramping speed' },
  'mobility.ramp-rate':                   { label: 'Ramping speed rate', companion: true },
  'mobility.kite-speed-pct':              { label: 'Kiting speed' },
  'mobility.stealth-pct':                 { label: 'Stealth' },
  'mobility.aggro-pull-pct':              { label: 'Aggro range' },
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
  'guard.cooldown-reduction-pct':         { label: 'Guard cooldown' },
  'guard.potency-pct':                    { label: 'Guard potency' },
  'guard.duration-pct':                   { label: 'Guard duration' },
  'guard.recovery-on-fire-pct':           { label: 'Guard Recovery' },
  'guard.recovery-on-fire-ms':            { label: 'Guard Recovery duration', companion: true },

  // ── Cores. Every `-mult` here is a FRACTION on the final summed stat
  //    (0.15 = +15%), not a multiplier — see the formatter table. ─────────────
  'core.attack-mult':                     { label: 'Attack' },
  'core.maxhp-mult':                      { label: 'Max HP' },
  'core.plating-mult':                    { label: 'Plating' },
  'core.speed-mult':                      { label: 'Move speed' },
  'core.attack-speed-mult':               { label: 'Attack speed' },
  'core.dr-layer-pct':                    { label: 'Core damage reduction' },
  'core.recovery-mult':                   { label: 'Recovery rate' },
  'core.elite-damage-mult':               { label: 'Elite and boss damage' },
  'core.onhit-mult':                      { label: 'On-hit damage' },
  'core.debuff-duration-mult':            { label: 'Debuff duration' },
  'core.debuff-potency-mult':             { label: 'Debuff potency' },
  'core.mobility-cooldown-reduction-pct': { label: 'Mobility cooldown' },
  'core.mobility-refund-on-kill-pct':     { label: 'Mobility refund on kill' },

  // ── Rites (out-of-combat behaviour) ────────────────────────────────────────
  'rite.ooc-regen-delay-reduction-pct':   { label: 'Faster recovery' },
  'rite.ooc-cleanse-stacks':              { label: 'Out-of-combat cleanse' },
  'rite.ooc-cleanse-interval-ms':         { label: 'Cleanse rate', companion: true },
  'rite.ooc-buff-decay-slowdown-pct':     { label: 'Buffs linger' },
  'rite.on-kill-haste-pct':               { label: 'Haste on kill' },
  'rite.on-kill-haste-ms':                { label: 'Haste time', companion: true },

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
