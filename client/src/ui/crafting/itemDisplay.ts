// Single source of truth for rendering item stats, mechanic effects, and upgrade
// diffs across the crafting panels (Forge / Upgrade / Biome) and the inventory
// StatSheet. Keeps stat labels/formatters and the mechanic-effect vocabulary in
// one place so every surface reads the same way.

import type { ItemDefinition, ResolvedRelicProfile } from '@mmo-idle/shared';
import {
  BURN_FAMILY,
  isCompanionMechanic, mechanicLabelOrKey,
  upgradeMechanicEffectsTotal, upgradeStatBonusTotal,
} from '@mmo-idle/shared';

// ─── Small format helpers ──────────────────────────────────────────────────────

const signed = (n: number): string => `${n >= 0 ? '+' : ''}${n}`;
const round1 = (n: number): number => Math.round(n * 10) / 10;

// ─── Stat metadata (covers every ItemStats key) ────────────────────────────────

export interface StatMeta {
  label: string;
  /** Absolute value display (e.g. "44", "10%", "0.7"). */
  fmt: (v: number) => string;
  /** Signed delta display (e.g. "+6", "+5%"). */
  fmtDelta: (d: number) => string;
}

export const STAT_META: Record<string, StatMeta> = {
  attack:          { label: 'ATK',    fmt: v => String(Math.round(v)),        fmtDelta: d => signed(Math.round(d)) },
  onHitDamage:     { label: 'ON-HIT', fmt: v => String(Math.round(v)),        fmtDelta: d => signed(Math.round(d)) },
  plating:         { label: 'PLT',    fmt: v => String(Math.round(v)),        fmtDelta: d => signed(Math.round(d)) },
  damageReduction: { label: 'DR',     fmt: v => `${Math.round(v * 100)}%`,    fmtDelta: d => `${signed(Math.round(d * 100))}%` },
  evasion:         { label: 'EVS',    fmt: v => `${Math.round(v * 100)}%`,    fmtDelta: d => `${signed(Math.round(d * 100))}%` },
  maxHp:           { label: 'HP',     fmt: v => String(Math.round(v)),        fmtDelta: d => signed(Math.round(d)) },
  recovery:         { label: 'RECOV',  fmt: v => String(round1(v)),            fmtDelta: d => signed(round1(d)) },
  speed:           { label: 'SPD',    fmt: v => String(Math.round(v)),        fmtDelta: d => signed(Math.round(d)) },
  attackRange:     { label: 'RNG',    fmt: v => String(Math.round(v)),        fmtDelta: d => signed(Math.round(d)) },
  attackCooldown:  { label: 'CD',     fmt: v => `${Math.round(v)}ms`,         fmtDelta: d => `${signed(Math.round(d))}ms` },
};

/** Stat keys in canonical display order. Anything not listed sorts to the end. */
const STAT_ORDER = Object.keys(STAT_META);

export function statMeta(key: string): StatMeta {
  return STAT_META[key] ?? {
    label: key.toUpperCase(),
    fmt: v => String(round1(v)),
    fmtDelta: d => signed(round1(d)),
  };
}

export interface StatEntry { key: string; label: string; value: string; }

/**
 * Renders an item's direct stats as labelled entries (e.g. "+44 HP"), in
 * canonical order. `aps` (weapons only) is prepended as an APS entry.
 */
export function statEntries(stats: Record<string, number> | undefined, aps?: number): StatEntry[] {
  const out: StatEntry[] = [];
  if (aps !== undefined) out.push({ key: 'aps', label: 'APS', value: String(aps) });
  if (!stats) return out;
  const keys = Object.keys(stats).sort((a, b) => {
    const ia = STAT_ORDER.indexOf(a), ib = STAT_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  for (const k of keys) {
    const v = stats[k];
    if (v === undefined || v === 0) continue;
    const m = statMeta(k);
    out.push({ key: k, label: m.label, value: m.fmtDelta(v) });
  }
  return out;
}

// ─── Mechanic-effect presentation ─────────────────────────────────────────────
//
// LABELS are not here. They live in `shared/src/data/mechanicLabels.ts`, where
// `mechanicLabels.test.ts` can assert that every authored effect key has one —
// the guard that stops a raw key ("cast speed pct") from reaching a tooltip.
// What stays here is presentation: how the NUMBER is written.

interface MechanicMeta {
  label: string;
  fmt: (v: number) => string;
}

const pct  = (v: number) => `${Math.round(v * 100)}%`;
const sec  = (v: number) => `${round1(v / 1000)}s`;
const mult = (v: number) => `${round1(v)}×`;
const num  = (v: number) => String(round1(v));
const signedPct = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`;
const flag = () => 'on';

// Effect keys follow a strict `namespace.feature[-qualifier]` convention and the
// qualifier carries the unit, so the default formatter is derived from the key
// rather than listed per key. That is what keeps a newly authored `-pct` key
// rendering as "15%" instead of "0.15" with no edit here at all.
function fmtBySuffix(key: string): (v: number) => string {
  if (key.endsWith('-pct')) return pct;
  if (key.endsWith('-ms'))  return sec;
  if (key.endsWith('-mult')) return mult;
  return num;
}

// Only the keys the convention gets wrong, each with the reason it is an
// exception. Anything that can be derived from the suffix must NOT be listed.
const MECHANIC_FMT: Record<string, (v: number) => string> = {
  // Fractions whose key does not say so.
  'defense.dot-resistance':           pct,
  'defense.debuff-resistance':        pct,
  'defense.evade-mitigation':         pct,
  'defense.sustained-fight-dr-max':   pct,
  'defense.sustained-fight-dr-bonus': pct,
  'defense.hardening-max-dr-bonus':   pct,
  'weapon.brittle-dr':                pct,
  'weapon.empowered-mult-bonus':      v => `+${pct(v)}`,
  'mobility.ramp-rate':               v => `${pct(v)}/s`,
  // Core `-mult` keys are fractions ON a stat, not multipliers OF it: 0.15 means
  // +15%, and `mult` would print a meaningless "0.2×". Negative values are real
  // (a core that trades one stat for another), so they read signed.
  'core.attack-mult':                 signedPct,
  'core.maxhp-mult':                  signedPct,
  'core.plating-mult':                signedPct,
  'core.speed-mult':                  signedPct,
  'core.attack-speed-mult':           signedPct,
  'core.recovery-mult':               signedPct,
  'core.elite-damage-mult':           signedPct,
  'core.onhit-mult':                  signedPct,
  'core.debuff-duration-mult':        signedPct,
  'core.debuff-potency-mult':         signedPct,
  // Relic ratings are signed offsets on a class mechanic, same reasoning.
  'relic.mechanic-frequency':         signedPct,
  'relic.mechanic-potency':           signedPct,
  'relic.mechanic-buff-effect':       signedPct,
  'relic.mechanic-debuff-effect':     signedPct,
  // Switches: the value is 1, and "1" is not the information.
  'defense.cheat-death':              flag,
  'defense.debt-cheat-death':         flag,
  'defense.max-hit-refills-barrier':  flag,
  'shared.applies-through-evade':     flag,
  // Counted things that read wrong as a bare number.
  'defense.cleanse-stacks':           v => `${num(v)} stack${v === 1 ? '' : 's'}`,
  'defense.hit-plating-per-stack':    v => `+${num(v)}/stk`,
  'weapon.dead-swing-interval':       v => `every ${round1(v)}`,
  'summoner.minion-attack-cooldown':  sec,
};

function mechanicMeta(key: string): MechanicMeta {
  return {
    label: mechanicLabelOrKey(key),
    fmt: MECHANIC_FMT[key] ?? fmtBySuffix(key),
  };
}

/** Terse one-line summary of an item's mechanic effects (for compact list rows). */
export function mechanicSummary(fx: Record<string, number> | undefined): string {
  if (!fx) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(fx)) {
    // Companion keys (a duration, interval or cap) belong inside another
    // effect's sentence, so the headline of each effect reads cleanly:
    // "Cleanse 1 stack · Cleanse heal 3%", not five fragments.
    if (isCompanionMechanic(k) || v === 0) continue;
    const m = mechanicMeta(k);
    parts.push(`${m.label} ${m.fmt(v)}`);
  }
  return parts.join(' · ');
}

/** Renders one mechanic-effect change as a terse "Label  from → to" string. */
export function describeMechanicDelta(key: string, from: number, to: number): string {
  const m = mechanicMeta(key);
  if (from === 0) return `${m.label} ${m.fmt(to)}`;
  return `${m.label} ${m.fmt(from)} → ${m.fmt(to)}`;
}

// ─── Upgrade diff ──────────────────────────────────────────────────────────────

export interface UpgradeDiffRow {
  label: string;
  from: string;
  to: string;
  /** Signed delta for stat rows; absent for mechanic rows. */
  delta?: string;
  up: boolean;
}

/**
 * Computes the per-stat and per-mechanic changes between `currentPlus` and
 * `currentPlus + 1`, layered on the item's base values. Returns one row per
 * changed stat/mechanic — the real "what this upgrade does" list (works for
 * primary stats, secondary stats, and charm/armor mechanic effects alike).
 */
export function computeUpgradeDiff(def: ItemDefinition, currentPlus: number): UpgradeDiffRow[] {
  const rows: UpgradeDiffRow[] = [];

  // Direct stats
  const curStats  = upgradeStatBonusTotal(def, currentPlus);
  const nextStats = upgradeStatBonusTotal(def, currentPlus + 1);
  for (const key of new Set([...Object.keys(curStats), ...Object.keys(nextStats)])) {
    const delta = (nextStats[key] ?? 0) - (curStats[key] ?? 0);
    if (delta === 0) continue;
    const base = def.statModifiers[key] ?? 0;
    const m = statMeta(key);
    rows.push({
      label: m.label,
      from: m.fmt(base + (curStats[key] ?? 0)),
      to:   m.fmt(base + (nextStats[key] ?? 0)),
      delta: m.fmtDelta(delta),
      up: delta > 0,
    });
  }

  // Mechanic effects
  const curMech  = upgradeMechanicEffectsTotal(def, currentPlus);
  const nextMech = upgradeMechanicEffectsTotal(def, currentPlus + 1);
  for (const key of new Set([...Object.keys(curMech), ...Object.keys(nextMech)])) {
    const delta = (nextMech[key] ?? 0) - (curMech[key] ?? 0);
    if (delta === 0) continue;
    const base = (def.mechanicEffects as Record<string, number> | undefined)?.[key] ?? 0;
    const m = mechanicMeta(key);
    rows.push({
      label: m.label,
      from: m.fmt(base + (curMech[key] ?? 0)),
      to:   m.fmt(base + (nextMech[key] ?? 0)),
      up: delta > 0,
    });
  }

  return rows;
}

// ─── Mechanic-effect prose (full sentences for tooltips / effect lists) ─────────

function ordinal(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

// Converts mechanicEffects key/value pairs into human-readable lines.
// Companion keys (e.g. interval alongside pct) are consumed together.
export function formatMechanicEffects(fx: Record<string, number> | undefined): string[] {
  if (!fx || Object.keys(fx).length === 0) return [];
  const lines: string[] = [];
  const seen  = new Set<string>();
  const has   = (k: string) => k in fx;
  const pctK  = (k: string) => `${Math.round((fx[k] ?? 0) * 100)}%`;
  const secK  = (k: string) => `${Math.round((fx[k] ?? 0) / 1000)}s`;
  const mark  = (...keys: string[]) => keys.forEach(k => seen.add(k));

  const relicRatings: [string, string][] = [
    ['relic.mechanic-frequency', 'Mechanic Frequency'],
    ['relic.mechanic-potency', 'Mechanic Potency'],
    ['relic.mechanic-buff-effect', 'Mechanic Buff Effect'],
    ['relic.mechanic-debuff-effect', 'Mechanic Debuff Effect'],
  ];
  for (const [key, label] of relicRatings) {
    if (!has(key)) continue;
    const value = Math.round((fx[key] ?? 0) * 100);
    lines.push(`${label}: ${value >= 0 ? '+' : ''}${value}%`);
    mark(key);
  }

  if (has('defense.barrier-pct')) {
    const delay = fx['defense.barrier-delay-ms'];
    const rate = fx['defense.barrier-recharge-pct'];
    const detail: string[] = [];
    if (delay) detail.push(`recharges after ${Math.round(delay / 1000)}s undamaged`);
    if (rate) detail.push(`${Math.round(rate * 100)}% per second`);
    lines.push(
      `${pctK('defense.barrier-pct')} max HP barrier`
      + (detail.length > 0 ? ` (${detail.join(', ')})` : ''),
    );
    mark('defense.barrier-pct', 'defense.barrier-delay-ms', 'defense.barrier-recharge-pct');
  }

  // Recovery access reads as a SHARE OF YOUR RECOVERY RATE, never a % of max HP —
  // the whole point is that it scales with the Recovery stat.
  if (has('defense.recovery-active-pct')) {
    lines.push(`${pctK('defense.recovery-active-pct')} of your Recovery stays active in combat`);
    mark('defense.recovery-active-pct');
  }

  if (has('defense.recovery-pulse-pct')) {
    const every = has('defense.recovery-pulse-interval-ms') ? ` every ${secK('defense.recovery-pulse-interval-ms')}` : '';
    const forDuration = has('defense.recovery-pulse-duration-ms') ? ` for ${secK('defense.recovery-pulse-duration-ms')}` : '';
    lines.push(`In combat${every}, activate ${pctK('defense.recovery-pulse-pct')} Recovery${forDuration}`);
    mark('defense.recovery-pulse-pct', 'defense.recovery-pulse-interval-ms', 'defense.recovery-pulse-duration-ms');
  }

  if (has('defense.recovery-on-kill-pct')) {
    const forMs = has('defense.recovery-on-kill-ms') ? ` for ${secK('defense.recovery-on-kill-ms')}` : '';
    lines.push(`On kill, activate ${pctK('defense.recovery-on-kill-pct')} Recovery${forMs} (kills refresh it)`);
    mark('defense.recovery-on-kill-pct', 'defense.recovery-on-kill-ms');
  }

  if (has('defense.recovery-skill-potency')) {
    lines.push(`+${pctK('defense.recovery-skill-potency')} Recovery activated by Recovery skills`);
    mark('defense.recovery-skill-potency');
  }

  if (has('defense.cheat-death')) {
    lines.push('Survive a fatal hit with 1 HP (once per life)');
    mark('defense.cheat-death');
  }

  if (has('defense.post-cheat-death-heal-pct')) {
    const over = has('defense.post-cheat-death-heal-ms') ? ` over ${secK('defense.post-cheat-death-heal-ms')}` : '';
    lines.push(`After cheat-death saves you, restore ${pctK('defense.post-cheat-death-heal-pct')} max HP${over}`);
    mark('defense.post-cheat-death-heal-pct', 'defense.post-cheat-death-heal-ms');
  }

  if (has('defense.absorb-pct')) {
    lines.push(`${pctK('defense.absorb-pct')} of damage taken becomes healing over time`);
    mark('defense.absorb-pct');
  }

  if (has('defense.hit-to-dot-pct')) {
    lines.push(`${pctK('defense.hit-to-dot-pct')} of incoming damage deferred as ticking damage`);
    mark('defense.hit-to-dot-pct');
  }

  if (has('defense.stationary-dr-pct')) {
    const over = has('defense.stationary-dr-ramptime-ms') ? ` (ramps over ${secK('defense.stationary-dr-ramptime-ms')})` : '';
    lines.push(`While stationary, gain up to ${pctK('defense.stationary-dr-pct')} damage reduction${over}; moving gradually erodes it`);
    mark('defense.stationary-dr-pct', 'defense.stationary-dr-ramptime-ms');
  }

  if (has('defense.max-hit-pct')) {
    const m = fx['defense.max-hit-mult'] ?? 1;
    const reductionPct = Math.round((1 - m) * 100);
    lines.push(
      `Hits above ${pctK('defense.max-hit-pct')} of your max HP have excess damage reduced by ${reductionPct}%`
    );
    mark('defense.max-hit-pct', 'defense.max-hit-mult');
  }

  if (has('defense.dot-resistance') || has('defense.debuff-resistance') || has('defense.debuff-resist')) {
    const parts: string[] = [];
    if (has('defense.dot-resistance'))   parts.push(`${pctK('defense.dot-resistance')} DoT resistance`);
    if (has('defense.debuff-resistance')) parts.push(`${pctK('defense.debuff-resistance')} debuff resistance`);
    if (has('defense.debuff-resist'))     parts.push(`${pctK('defense.debuff-resist')} debuff resistance`);
    lines.push(parts.join(', '));
    mark('defense.dot-resistance', 'defense.debuff-resistance', 'defense.debuff-resist');
  }

  if (has('defense.cleanse-stacks')) {
    const n = fx['defense.cleanse-stacks'] ?? 1;
    const every = has('defense.cleanse-interval-ms') ? ` every ${secK('defense.cleanse-interval-ms')}` : '';
    lines.push(`Remove ${n} debuff stack${n !== 1 ? 's' : ''}${every}`);
    if (has('defense.cleanse-empty-heal-pct')) {
      lines.push(`If no debuff to cleanse, heal ${pctK('defense.cleanse-empty-heal-pct')} max HP instead`);
    }
    mark('defense.cleanse-stacks', 'defense.cleanse-interval-ms', 'defense.cleanse-empty-heal-pct');
  }

  // ── Mobility (boot) mechanics ──────────────────────────────────────────────
  if (has('mobility.ooc-speed-pct')) {
    lines.push(`+${pctK('mobility.ooc-speed-pct')} move speed while out of combat`);
    mark('mobility.ooc-speed-pct');
  }

  if (has('mobility.kill-speed-pct')) {
    const dur = has('mobility.kill-speed-ms') ? ` for ${secK('mobility.kill-speed-ms')}` : '';
    lines.push(`On a kill: +${pctK('mobility.kill-speed-pct')} move speed${dur}`);
    mark('mobility.kill-speed-pct', 'mobility.kill-speed-ms');
  }

  if (has('mobility.acquire-speed-pct')) {
    const dur = has('mobility.acquire-speed-ms') ? ` for ${secK('mobility.acquire-speed-ms')}` : '';
    const cd = has('mobility.acquire-cooldown-ms') ? ` (every ${secK('mobility.acquire-cooldown-ms')})` : '';
    lines.push(`When you lock onto a new target: +${pctK('mobility.acquire-speed-pct')} move speed${dur}${cd}`);
    mark('mobility.acquire-speed-pct', 'mobility.acquire-speed-ms', 'mobility.acquire-cooldown-ms');
  }

  if (has('mobility.stealth-pct')) {
    lines.push(`Enemies notice you from ${pctK('mobility.stealth-pct')} closer`);
    mark('mobility.stealth-pct');
  }

  if (has('mobility.aggro-pull-pct')) {
    lines.push(`Enemies notice you from ${pctK('mobility.aggro-pull-pct')} farther away`);
    mark('mobility.aggro-pull-pct');
  }

  if (has('mobility.tenacity-pct')) {
    lines.push(`Slows and roots on you wear off ${pctK('mobility.tenacity-pct')} faster`);
    mark('mobility.tenacity-pct');
  }

  if (has('mobility.kite-speed-pct')) {
    lines.push(`+${pctK('mobility.kite-speed-pct')} move speed while retreating from your target`);
    mark('mobility.kite-speed-pct');
  }

  if (has('mobility.ramp-speed-pct')) {
    const rate = has('mobility.ramp-rate') ? ` (builds ${pctK('mobility.ramp-rate')}/s while moving)` : '';
    lines.push(`Keep moving to ramp up to +${pctK('mobility.ramp-speed-pct')} move speed${rate}`);
    mark('mobility.ramp-speed-pct', 'mobility.ramp-rate');
  }

  if (has('mobility.passive-speed-pct')) {
    const supp = has('mobility.suppress-ms') ? `, lost for ${secK('mobility.suppress-ms')} after taking a direct hit` : '';
    lines.push(`+${pctK('mobility.passive-speed-pct')} move speed${supp}`);
    mark('mobility.passive-speed-pct', 'mobility.suppress-ms');
  }

  if (has('mobility.kill-stack-speed-pct') || has('mobility.kill-stack-tenacity-pct')) {
    const parts: string[] = [];
    if (has('mobility.kill-stack-speed-pct'))    parts.push(`+${pctK('mobility.kill-stack-speed-pct')} move speed`);
    if (has('mobility.kill-stack-tenacity-pct')) parts.push(`${pctK('mobility.kill-stack-tenacity-pct')} faster slow/root recovery`);
    const dur = has('mobility.kill-stack-ms') ? ` (up to 3 stacks, ${secK('mobility.kill-stack-ms')})` : '';
    lines.push(`On a kill: ${parts.join(' and ')} per stack${dur}`);
    mark('mobility.kill-stack-speed-pct', 'mobility.kill-stack-tenacity-pct', 'mobility.kill-stack-ms');
  }

  if (has('weapon.first-strike-mult')) {
    lines.push(`First strike on a fresh target deals ${mult(fx['weapon.first-strike-mult'] ?? 1)} damage`);
    mark('weapon.first-strike-mult');
  }

  if (has('weapon.dead-swing-interval')) {
    const n = Math.round(fx['weapon.dead-swing-interval'] ?? 0);
    lines.push(`Every ${n}${ordinal(n)} hit is a dead swing: no damage, but on-hit effects still fire`);
    if (has('weapon.dead-swing-vuln-pct')) {
      const dur = has('weapon.dead-swing-vuln-ms') ? ` for ${secK('weapon.dead-swing-vuln-ms')}` : '';
      lines.push(`Dead swing makes the target take ${pctK('weapon.dead-swing-vuln-pct')} more damage${dur}`);
    }
    mark('weapon.dead-swing-interval', 'weapon.dead-swing-vuln-pct', 'weapon.dead-swing-vuln-ms');
  }

  if (has('weapon.brittle-plating') || has('weapon.brittle-dr')) {
    const parts: string[] = [];
    if (has('weapon.brittle-plating')) parts.push(`-${num(fx['weapon.brittle-plating'] ?? 0)} plating`);
    if (has('weapon.brittle-dr'))      parts.push(`-${pctK('weapon.brittle-dr')} DR`);
    lines.push(`Brittle: each hit stacks ${parts.join(' and ')} (up to ${num(fx['weapon.brittle-stacks'] ?? 0)})`);
    if (has('weapon.brittle-shatter-threshold')) {
      const dur = has('weapon.brittle-shatter-dr-strip-ms') ? secK('weapon.brittle-shatter-dr-strip-ms') : '2s';
      lines.push(`At ${num(fx['weapon.brittle-shatter-threshold'] ?? 0)} stacks, shatter the target: strip all its DR for ${dur}`);
    }
    mark('weapon.brittle-plating', 'weapon.brittle-dr', 'weapon.brittle-stacks',
         'weapon.brittle-shatter-threshold', 'weapon.brittle-shatter-dr-strip-ms');
  }

  if (has('weapon.execute-threshold-pct')) {
    lines.push(`Execute: ${mult(fx['weapon.execute-dmg-mult'] ?? 1)} damage vs targets below ${pctK('weapon.execute-threshold-pct')} HP`);
    mark('weapon.execute-threshold-pct', 'weapon.execute-dmg-mult');
  }

  if (has('defense.sustained-fight-dr-max')) {
    const over = has('defense.sustained-fight-ramptime-ms') ? ` over ${secK('defense.sustained-fight-ramptime-ms')}` : '';
    lines.push(`While in combat, ramp up to ${pctK('defense.sustained-fight-dr-max')} damage reduction${over}`);
    mark('defense.sustained-fight-dr-max', 'defense.sustained-fight-dr-bonus', 'defense.sustained-fight-ramptime-ms');
  }

  if (has('defense.absorb-ramp-max-pct')) {
    const over   = has('defense.absorb-ramptime-ms') ? ` over ${secK('defense.absorb-ramptime-ms')}` : '';
    const start  = has('defense.absorb-ramp-start-pct') ? `${pctK('defense.absorb-ramp-start-pct')}→` : '';
    lines.push(`Absorb ${start}${pctK('defense.absorb-ramp-max-pct')} of damage taken as healing, ramping in combat${over}`);
    mark('defense.absorb-ramp-max-pct', 'defense.absorb-ramp-start-pct', 'defense.absorb-ramptime-ms');
  }

  if (has('defense.debt-cheat-death')) {
    lines.push('Once per combat, clear all deferred damage debt if it would kill you');
    mark('defense.debt-cheat-death');
  }

  if (has('defense.barrier-break-heal-pct') || has('defense.barrier-break-hp-recovery-pct')) {
    const breakPct = (fx['defense.barrier-break-heal-pct'] ?? 0) + (fx['defense.barrier-break-hp-recovery-pct'] ?? 0);
    lines.push(`When your barrier is emptied, heal ${Math.round(breakPct * 100)}% of its max value as HP`);
    mark('defense.barrier-break-heal-pct', 'defense.barrier-break-hp-recovery-pct');
  }

  if (has('defense.max-hit-refills-barrier')) {
    lines.push('When the damage cap triggers, immediately refill your barrier');
    mark('defense.max-hit-refills-barrier');
  }

  if (has('defense.hardening-max-dr-bonus')) {
    const dur = has('defense.hardening-max-dr-ms') ? ` for ${secK('defense.hardening-max-dr-ms')}` : '';
    lines.push(`At max hardening, gain ${pctK('defense.hardening-max-dr-bonus')} damage reduction${dur}`);
    mark('defense.hardening-max-dr-bonus', 'defense.hardening-max-dr-ms');
  }

  if (has('defense.overheal-ward-pct')) {
    lines.push(`Healing past full HP becomes a temporary ward (${pctK('defense.overheal-ward-pct')} of the overflow)`);
    mark('defense.overheal-ward-pct');
  }

  if (has('defense.cleanse-per-stack-heal-pct')) {
    lines.push(`Heal ${pctK('defense.cleanse-per-stack-heal-pct')} max HP per debuff stack cleansed`);
    mark('defense.cleanse-per-stack-heal-pct');
  }

  if (has('defense.hit-plating-per-stack')) {
    const dur = has('defense.hit-plating-duration-ms') ? secK('defense.hit-plating-duration-ms') : '4s';
    lines.push(`Each hit taken grants +${num(fx['defense.hit-plating-per-stack'] ?? 0)} plating for ${dur}, stacking up to ${num(fx['defense.hit-plating-max-stacks'] ?? 0)}`);
    mark('defense.hit-plating-per-stack', 'defense.hit-plating-max-stacks', 'defense.hit-plating-duration-ms');
  }

  if (has('defense.evade-mitigation')) {
    lines.push(`+${pctK('defense.evade-mitigation')} damage avoided when you evade`);
    mark('defense.evade-mitigation');
  }

  // Cores (Step 9): percentage multipliers on overall stats + a separate
  // multiplicative damage-reduction layer. Signed so decreases read as "-15%".
  const signedPctK = (k: string) => {
    const v = Math.round((fx[k] ?? 0) * 100);
    return `${v >= 0 ? '+' : ''}${v}%`;
  };
  const coreMults: [string, string][] = [
    ['core.attack-mult',       'attack'],
    ['core.maxhp-mult',        'max HP'],
    ['core.plating-mult',      'plating'],
    ['core.speed-mult',        'move speed'],
    ['core.attack-speed-mult', 'attack speed'],
    ['core.recovery-mult',     'healing and HP regen'],
    ['core.elite-damage-mult', 'damage vs elites and bosses'],
    ['core.onhit-mult',        'on-hit damage'],
    ['core.debuff-duration-mult', 'duration of debuffs you apply'],
    ['core.debuff-potency-mult',  'strength of debuffs you apply'],
  ];
  for (const [k, label] of coreMults) {
    if (has(k)) { lines.push(`${signedPctK(k)} ${label}`); mark(k); }
  }
  if (has('core.dr-layer-pct')) {
    lines.push(`${pctK('core.dr-layer-pct')} damage reduction (separate multiplicative layer)`);
    mark('core.dr-layer-pct');
  }
  // Both mobility keys read as a REDUCTION at a positive value, so they are phrased
  // rather than run through the signed-percent helper (which would print "+20%
  // cooldown" for what is a 20% cut).
  if (has('core.mobility-cooldown-reduction-pct')) {
    lines.push(`${pctK('core.mobility-cooldown-reduction-pct')} shorter mobility ability cooldown`);
    mark('core.mobility-cooldown-reduction-pct');
  }
  if (has('core.mobility-refund-on-kill-pct')) {
    lines.push(`Kills refund ${pctK('core.mobility-refund-on-kill-pct')} of your mobility ability's cooldown`);
    mark('core.mobility-refund-on-kill-pct');
  }

  // ── Ability amplifiers ─────────────────────────────────────────────────────
  // Technique (offensive) and Guard (defensive) are deliberately separate
  // namespaces so one stat can never buy both; they read as separate sentences
  // for the same reason.
  if (has('technique.power-pct')) {
    lines.push(`+${pctK('technique.power-pct')} Technique ability damage`);
    mark('technique.power-pct');
  }
  if (has('technique.cooldown-reduction-pct')) {
    lines.push(`${pctK('technique.cooldown-reduction-pct')} shorter Technique cooldown`);
    mark('technique.cooldown-reduction-pct');
  }
  if (has('technique.cast-speed-pct')) {
    lines.push(`${pctK('technique.cast-speed-pct')} faster Technique wind-up`);
    mark('technique.cast-speed-pct');
  }
  if (has('guard.cooldown-reduction-pct')) {
    lines.push(`${pctK('guard.cooldown-reduction-pct')} shorter Guard cooldown`);
    mark('guard.cooldown-reduction-pct');
  }
  if (has('guard.potency-pct')) {
    lines.push(`+${pctK('guard.potency-pct')} Guard ability effect`);
    mark('guard.potency-pct');
  }
  if (has('guard.duration-pct')) {
    lines.push(`+${pctK('guard.duration-pct')} Guard ability duration`);
    mark('guard.duration-pct');
  }
  if (has('guard.recovery-on-fire-pct')) {
    const forMs = has('guard.recovery-on-fire-ms') ? ` for ${secK('guard.recovery-on-fire-ms')}` : '';
    lines.push(`A Guard ability firing activates ${pctK('guard.recovery-on-fire-pct')} Recovery${forMs}`);
    mark('guard.recovery-on-fire-pct', 'guard.recovery-on-fire-ms');
  }

  // ── Weapon families with no prose elsewhere ────────────────────────────────
  if (has('weapon.empowered-mult-bonus')) {
    lines.push(`+${pctK('weapon.empowered-mult-bonus')} to your empowered-attack multiplier`);
    mark('weapon.empowered-mult-bonus');
  }

  if (has('weapon.flurry-pct')) {
    const cap = has('weapon.flurry-stacks') ? ` (up to ${num(fx['weapon.flurry-stacks'] ?? 0)} stacks)` : '';
    lines.push(`Each hit stacks +${pctK('weapon.flurry-pct')} attack speed${cap}`);
    mark('weapon.flurry-pct', 'weapon.flurry-stacks');
  }

  // ── Defensive ramps with no prose elsewhere ────────────────────────────────
  if (has('defense.hardening-per-sec')) {
    const cap = has('defense.hardening-max') ? `, up to ${num(fx['defense.hardening-max'] ?? 0)}` : '';
    const reset = has('defense.hardening-reset-pct')
      ? `; a hit sheds ${pctK('defense.hardening-reset-pct')} of it`
      : '';
    lines.push(`Harden while unhit: +${num(fx['defense.hardening-per-sec'] ?? 0)} plating per second${cap}${reset}`);
    mark('defense.hardening-per-sec', 'defense.hardening-max', 'defense.hardening-reset-pct');
  }

  if (has('defense.recovery-ramp-max-pct')) {
    const from = has('defense.recovery-ramp-start-pct') ? `${pctK('defense.recovery-ramp-start-pct')}→` : '';
    const over = has('defense.recovery-ramp-ramptime-ms') ? ` over ${secK('defense.recovery-ramp-ramptime-ms')}` : '';
    lines.push(`Recovery activated ramps ${from}${pctK('defense.recovery-ramp-max-pct')} the longer you fight${over}`);
    mark('defense.recovery-ramp-max-pct', 'defense.recovery-ramp-start-pct', 'defense.recovery-ramp-ramptime-ms');
  }

  // Burn-DoT weapons describe their effect via formatWeaponEffects (BURN_FAMILY,
  // derived from the recipe's weaponDot block) — no mirror mechanic keys to consume.

  // Fallback for keys with no prose of their own. Reads as "Label value" using
  // the shared registry, so an effect with no sentence still gets a real name and
  // a correctly-united number. A key with no label at all renders as «key» — that
  // is a bug, and `shared/src/data/mechanicLabels.test.ts` is what prevents it.
  for (const [k, v] of Object.entries(fx)) {
    if (seen.has(k) || v === 0) continue;
    const m = mechanicMeta(k);
    lines.push(`${m.label} ${m.fmt(v)}`);
  }

  return lines;
}

const seconds = (ms: number): string => `${round1(ms / 1000)}s`;
const beforeAfter = (before: string | number, after: string | number): string => `${before} → ${after}`;

/** Human-readable rendering of the shared character-specific Relic preview. */
export function formatResolvedRelicProfile(profile: ResolvedRelicProfile | null): string[] {
  if (!profile) return ['Current class: effect preview unavailable'];
  switch (profile.archetype) {
    case 'cadence':
      return [
        `For Striker: finisher every ${beforeAfter(profile.threshold.before, profile.threshold.after)} hits`,
        `Finisher damage ${beforeAfter(`${round1(profile.empoweredMultiplier.before)}×`, `${round1(profile.empoweredMultiplier.after)}×`)}`,
      ];
    case 'cooldown':
      return [
        `For Squire: execution cooldown ${beforeAfter(seconds(profile.cooldownMs.before), seconds(profile.cooldownMs.after))}`,
        `Execution damage ${beforeAfter(`${round1(profile.empoweredMultiplier.before)}×`, `${round1(profile.empoweredMultiplier.after)}×`)}`,
      ];
    case 'reload':
      return [
        `For Slinger: reload ${beforeAfter(seconds(profile.reloadMs.before), seconds(profile.reloadMs.after))}`,
        `Magazine ${beforeAfter(profile.ammoMax.before, profile.ammoMax.after)} rounds`,
      ];
    case 'dot':
      return [
        `For DoT: tick interval ${beforeAfter(seconds(profile.tickIntervalMs.before), seconds(profile.tickIntervalMs.after))}`,
        `Stack cap ${beforeAfter(profile.maxStacks.before, profile.maxStacks.after)}`,
      ];
    case 'energy':
      return [
        `For Energy: gain ${beforeAfter(profile.gainPerHit.before, profile.gainPerHit.after)} per hit`,
        `Capacity ${beforeAfter(profile.maxEnergy.before, profile.maxEnergy.after)}`,
        `Discharge ${beforeAfter(`${round1(profile.dischargeMultiplier.before)}×`, `${round1(profile.dischargeMultiplier.after)}×`)}`,
      ];
    case 'summoner':
      return [
        `For Summoner: resummon ${beforeAfter(seconds(profile.respawnMs.before), seconds(profile.respawnMs.after))}`,
        `Summon cap ${beforeAfter(profile.summonCount.before, profile.summonCount.after)}`,
      ];
  }
}

// Generates human-readable effect lines for weapon families (Chaotic / Burn).
// Returns an empty array for weapons with no special family mechanic.
export function formatWeaponEffects(weaponId: string): string[] {
  const lines: string[] = [];

  // Chaotic family is described from the weapon's `weapon.dead-swing-interval`
  // mechanic in formatMechanicEffects (data-driven), so no entry is needed here.

  // Generic weapon DoT reservoir family
  const burn = BURN_FAMILY.find(b => b.weaponId === weaponId);
  if (burn) {
    const convPct  = Math.round(burn.convPct  * 100);
    const keepPct  = 100 - convPct;
    const tickSec  = burn.tickIntervalMs / 1000;
    const durSec   = burn.drainDurationMs / 1000;
    const mult     = round1(burn.dotMultiplier);
    lines.push(`${convPct}% of remaining direct hit damage enters a DoT reservoir; ${keepPct}% is dealt directly`);
    lines.push(`Reservoir gains ${mult}x stored DoT value, then drains as ${burn.element} damage every ${tickSec}s over ${durSec}s`);
    lines.push('Class DoT conversion happens first; this weapon converts only the direct damage left afterward');
    lines.push('Empowered hit bonus damage does not increase the stored reservoir value');
    lines.push('Repeated hits refresh the reservoir window; the target badge shows stored damage');
  }

  return lines;
}
