// Single source of truth for rendering item stats, mechanic effects, and upgrade
// diffs across the crafting panels (Forge / Upgrade / Biome) and the inventory
// StatSheet. Keeps stat labels/formatters and the mechanic-effect vocabulary in
// one place so every surface reads the same way.

import type { ItemDefinition } from '@mmo-idle/shared';
import {
  ASHBRAND_DURATION_MS, ASHBRAND_TICK_MS,
  BURN_FAMILY, EDGE_OF_OBLIVION_ID,
  CORRUPTION_MAX_STACKS, CORRUPTION_TICK_MS, CORRUPTION_DURATION_MS,
  CORRUPTION_SLOW_PER_STACK, CORRUPTION_MIN_SPEED_MULT,
  SACRED_APS_MULT, SACRED_DMG_MULT, SACRED_FAMILY,
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
  hpRegen:         { label: 'REGEN',  fmt: v => String(round1(v)),            fmtDelta: d => signed(round1(d)) },
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

// ─── Mechanic-effect metadata (terse labels for diff rows) ─────────────────────

interface MechanicMeta {
  label: string;
  fmt: (v: number) => string;
}

const pct  = (v: number) => `${Math.round(v * 100)}%`;
const sec  = (v: number) => `${round1(v / 1000)}s`;
const mult = (v: number) => `${round1(v)}×`;
const num  = (v: number) => String(round1(v));

// Per-key terse vocabulary, used by describeMechanicDelta for upgrade rows.
// Companion-key sentences (the full prose) live in formatMechanicEffects below.
const MECHANIC_META: Record<string, MechanicMeta> = {
  // weapon
  'weapon.first-strike-mult':        { label: 'First strike',   fmt: mult },
  'weapon.empowered-mult-bonus':     { label: 'Empowered bonus', fmt: v => `+${pct(v)}` },
  'weapon.dead-swing-interval':      { label: 'Dead swing',     fmt: v => `every ${round1(v)}` },
  'weapon.dead-swing-vuln-pct':      { label: 'Vulnerability',  fmt: pct },
  'weapon.dead-swing-vuln-ms':       { label: 'Vuln duration',  fmt: sec },
  'weapon.execute-dmg-mult':         { label: 'Execute',        fmt: mult },
  'weapon.brittle-shatter-dr-strip-ms': { label: 'Brittle shatter', fmt: sec },
  // defense
  'defense.cheat-death':             { label: 'Cheat death',    fmt: () => 'on' },
  'defense.post-cheat-death-heal-pct': { label: 'Revive heal',  fmt: pct },
  'defense.post-cheat-death-heal-ms':  { label: 'Revive heal dur', fmt: sec },
  'defense.cleanse-stacks':          { label: 'Cleanse',        fmt: v => `${num(v)} stack${v === 1 ? '' : 's'}` },
  'defense.cleanse-interval-ms':     { label: 'Cleanse rate',   fmt: sec },
  'defense.cleanse-empty-heal-pct':  { label: 'Cleanse heal',   fmt: pct },
  'defense.debuff-resist':           { label: 'Debuff resist',  fmt: pct },
  'defense.debuff-resistance':       { label: 'Debuff resist',  fmt: pct },
  'defense.dot-resistance':          { label: 'DoT resist',     fmt: pct },
  'defense.shield-pct':              { label: 'Shield',         fmt: pct },
  'defense.shield-interval-ms':      { label: 'Shield rate',    fmt: sec },
  'defense.shield-duration-ms':      { label: 'Shield dur',     fmt: sec },
  'defense.in-combat-regen-pct':     { label: 'Combat regen',   fmt: pct },
  'defense.regen-burst-pct':         { label: 'Regen burst',    fmt: pct },
  'defense.regen-burst-interval-ms': { label: 'Burst rate',     fmt: sec },
  'defense.kill-burst-pct':          { label: 'Kill heal',      fmt: pct },
  'defense.absorb-pct':              { label: 'Absorb',         fmt: pct },
  'defense.hit-to-dot-pct':          { label: 'Hit→DoT',        fmt: pct },
  'defense.max-hit-pct':             { label: 'Max-hit cap',    fmt: pct },
  'defense.stationary-dr-pct':         { label: 'Stationary DR',  fmt: pct },
  'defense.stationary-dr-ramptime-ms': { label: 'Stationary ramp', fmt: sec },
  'defense.sustained-fight-dr-max':    { label: 'Sustained DR',   fmt: pct },
  'defense.absorb-ramp-max-pct':       { label: 'Absorb (ramp)',  fmt: pct },
  'defense.shield-break-heal-pct':     { label: 'Shield-break heal', fmt: pct },
  'defense.shield-break-hp-recovery-pct': { label: 'Shield-break heal', fmt: pct },
  'defense.overheal-shield-pct':       { label: 'Overheal shield', fmt: pct },
  'defense.hardening-max-dr-bonus':    { label: 'Max-harden DR',  fmt: pct },
  'defense.cleanse-per-stack-heal-pct': { label: 'Cleanse heal/stk', fmt: pct },
  'defense.debt-cheat-death':          { label: 'Debt cheat-death', fmt: () => 'on' },
  'defense.max-hit-rearms-shield':     { label: 'Cap rearms shield', fmt: () => 'on' },
  'defense.hit-plating-per-stack':     { label: 'Reactive plating', fmt: v => `+${num(v)}/stk` },
  'defense.evade-mitigation':          { label: 'Evade mitigation', fmt: pct },
  // mobility
  'mobility.kite-speed-pct':         { label: 'Kite speed',     fmt: pct },
  'mobility.ooc-speed-pct':          { label: 'OOC speed',      fmt: pct },
  'mobility.passive-speed-pct':      { label: 'Move speed',     fmt: pct },
  'mobility.ramp-speed-pct':         { label: 'Ramp speed',     fmt: pct },
  'mobility.kill-speed-pct':         { label: 'Kill speed',     fmt: pct },
  'mobility.acquire-speed-pct':      { label: 'Lock-on speed',  fmt: pct },
  'mobility.tenacity-pct':           { label: 'Tenacity',       fmt: pct },
  'mobility.stealth-pct':            { label: 'Stealth',        fmt: pct },
  'mobility.aggro-pull-pct':         { label: 'Aggro range',    fmt: pct },
};

function mechanicMeta(key: string): MechanicMeta {
  return MECHANIC_META[key] ?? {
    label: key.replace(/^[a-z]+\./, '').replace(/-/g, ' '),
    fmt: num,
  };
}

// Companion keys (rates/durations) omitted from one-line summaries so the
// headline of each effect reads cleanly (e.g. "Cleanse 1 stack · Cleanse heal 3%").
const SUMMARY_SKIP = new Set([
  'defense.cleanse-interval-ms', 'defense.shield-interval-ms', 'defense.shield-duration-ms',
  'defense.regen-burst-interval-ms', 'defense.max-hit-mult',
  'defense.post-cheat-death-heal-ms', 'defense.stationary-dr-ramptime-ms',
  'weapon.dead-swing-vuln-ms',
  'defense.sustained-fight-dr-bonus', 'defense.sustained-fight-ramptime-ms',
  'defense.absorb-ramp-start-pct', 'defense.absorb-ramptime-ms',
  'defense.hardening-max-dr-ms', 'defense.shield-break-hp-recovery-pct',
  'weapon.execute-threshold-pct', 'weapon.brittle-shatter-threshold',
  'defense.hit-plating-max-stacks', 'defense.hit-plating-duration-ms', 'weapon.dot-stacks',
]);

/** Terse one-line summary of an item's mechanic effects (for compact list rows). */
export function mechanicSummary(fx: Record<string, number> | undefined): string {
  if (!fx) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(fx)) {
    if (SUMMARY_SKIP.has(k) || v === 0) continue;
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

  if (has('defense.shield-pct')) {
    const interval = fx['defense.shield-interval-ms'];
    const every = interval ? ` every ${Math.round(interval / 1000)}s` : '';
    lines.push(`${pctK('defense.shield-pct')} max HP shield in combat${every}`);
    mark('defense.shield-pct', 'defense.shield-interval-ms', 'defense.shield-duration-ms');
  }

  if (has('defense.in-combat-regen-pct')) {
    lines.push(`${pctK('defense.in-combat-regen-pct')} of HP regen applies while in combat`);
    mark('defense.in-combat-regen-pct');
  }

  if (has('defense.regen-burst-pct')) {
    const every = has('defense.regen-burst-interval-ms') ? ` every ${secK('defense.regen-burst-interval-ms')}` : '';
    lines.push(`Restore ${pctK('defense.regen-burst-pct')} max HP${every} in combat`);
    mark('defense.regen-burst-pct', 'defense.regen-burst-interval-ms');
  }

  if (has('defense.kill-burst-pct')) {
    lines.push(`Restore ${pctK('defense.kill-burst-pct')} max HP over 4s on kill`);
    mark('defense.kill-burst-pct');
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

  if (has('defense.shield-break-heal-pct') || has('defense.shield-break-hp-recovery-pct')) {
    const breakPct = (fx['defense.shield-break-heal-pct'] ?? 0) + (fx['defense.shield-break-hp-recovery-pct'] ?? 0);
    lines.push(`When a shield breaks, heal ${Math.round(breakPct * 100)}% of its max value as HP`);
    mark('defense.shield-break-heal-pct', 'defense.shield-break-hp-recovery-pct');
  }

  if (has('defense.max-hit-rearms-shield')) {
    lines.push('When the damage cap triggers, immediately rearm your shield');
    mark('defense.max-hit-rearms-shield');
  }

  if (has('defense.hardening-max-dr-bonus')) {
    const dur = has('defense.hardening-max-dr-ms') ? ` for ${secK('defense.hardening-max-dr-ms')}` : '';
    lines.push(`At max hardening, gain ${pctK('defense.hardening-max-dr-bonus')} damage reduction${dur}`);
    mark('defense.hardening-max-dr-bonus', 'defense.hardening-max-dr-ms');
  }

  if (has('defense.overheal-shield-pct')) {
    lines.push(`Healing past full HP becomes a temporary shield (${pctK('defense.overheal-shield-pct')} of the overflow)`);
    mark('defense.overheal-shield-pct');
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

  // Burn-DoT weapons describe their effect via formatWeaponEffects (BURN_FAMILY);
  // consume the mirror keys here so they don't render as raw fallback text.
  if (has('weapon.dot-conversion-pct')) {
    mark('weapon.dot-conversion-pct', 'weapon.dot-stacks');
  }

  // Fallback for any keys not yet handled
  for (const [k, v] of Object.entries(fx)) {
    if (!seen.has(k)) lines.push(`${k.replace(/^[a-z]+\./, '').replace(/-/g, ' ')}: ${v}`);
  }

  return lines;
}

// Generates human-readable effect lines for weapon families (Chaotic / Sacred / Burn).
// Returns an empty array for weapons with no special family mechanic.
export function formatWeaponEffects(weaponId: string): string[] {
  const lines: string[] = [];

  // Chaotic family is described from the weapon's `weapon.dead-swing-interval`
  // mechanic in formatMechanicEffects (data-driven), so no entry is needed here.

  // Sacred family
  const sacred = SACRED_FAMILY[weaponId];
  if (sacred) {
    const cd  = sacred.cdMs  / 1000;
    const buf = sacred.buffMs / 1000;
    lines.push(`Every ${cd}s: next attack triggers a ${buf}s burst`);
    lines.push(`Burst: ${SACRED_DMG_MULT}× damage, ${SACRED_APS_MULT}× attack speed`);
  }

  if (weaponId === EDGE_OF_OBLIVION_ID) {
    const tickSec = CORRUPTION_TICK_MS / 1000;
    const durSec = CORRUPTION_DURATION_MS / 1000;
    const slowPct = Math.round(CORRUPTION_SLOW_PER_STACK * 100);
    const maxSlowPct = Math.round((1 - CORRUPTION_MIN_SPEED_MULT) * 100);
    lines.push(`Each hit applies Corruption (up to ${CORRUPTION_MAX_STACKS} stacks)`);
    lines.push(`Corruption ticks every ${tickSec}s for ${durSec}s; full hit damage retained`);
    lines.push(`Each stack: DoT tick damage + ${slowPct}% move slow (${maxSlowPct}% max at ${CORRUPTION_MAX_STACKS} stacks)`);
    lines.push('Stacks alongside class DoT and scales with dot.conversion-pct, tick-rate, and duration passives');
    lines.push('Summoner minion attacks apply Corruption');
  }

  // Burn family
  const burn = BURN_FAMILY.find(b => b.weaponId === weaponId);
  if (burn) {
    const convPct  = Math.round(burn.convPct  * 100);
    const keepPct  = 100 - convPct;
    const tickSec  = ASHBRAND_TICK_MS     / 1000;
    const durSec   = ASHBRAND_DURATION_MS / 1000;
    lines.push(`${convPct}% of hit damage → burn DoT, ${keepPct}% dealt directly`);
    lines.push(`Up to ${burn.maxStacks} stacks — ticks every ${tickSec}s, expires after ${durSec}s`);
  }

  return lines;
}
