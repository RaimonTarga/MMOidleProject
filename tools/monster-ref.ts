import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  BIOME_DATABASE,
  MONSTER_DATABASE,
  type BossAction,
  type BossPhase,
  type BossScript,
  type MonsterDefinition,
  type RepeatingAction,
  type UltimateEncounter,
} from '@mmo-idle/shared';

// ─────────────────────────────────────────────────────────────────────────────
// Monster Reference — comprehensive raw stat dump for every non-tutorial monster,
// organised by biome then biome tier. No player matchup analysis, no threat
// evaluation, no outlier detection — just everything on every monster, verbatim.
//
// Usage:
//   pnpm monster:ref               → reports/monster-ref.html  (full HTML)
//   pnpm monster:ref --md          → reports/monster-ref.md    (full Markdown)
//   pnpm monster:ref --biome=cave  → filter to one biome
//   pnpm monster:ref --tier=2      → filter to one biome tier
// ─────────────────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const OPTIONS = {
  md: ARGS.includes('--md'),
  biome: stringArg('--biome'),
  tier: numberArg('--tier'),
};
const HTML_PATH = path.join(REPO_ROOT, 'reports', 'monster-ref.html');
const MD_PATH   = path.join(REPO_ROOT, 'reports', 'monster-ref.md');

const EXCLUDED_BIOMES = new Set(['testroom']);
const TUTORIAL_IDS   = new Set(['tiny-slime']);

function stringArg(name: string): string | null {
  const eq = ARGS.find((a) => a.startsWith(`${name}=`));
  const i  = ARGS.indexOf(name);
  return eq ? eq.slice(name.length + 1) : i >= 0 ? ARGS[i + 1] ?? null : null;
}

function numberArg(name: string): number | null {
  const v = stringArg(name);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function n(v: number, decimals = 1): string {
  if (!Number.isFinite(v)) return '—';
  return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(decimals);
}

function pct(v: number): string { return `${(v * 100).toFixed(1)}%`; }
function ms(v: number): string  { return `${v}ms`; }

function esc(v: unknown): string {
  return String(v)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function mdCell(v: unknown): string {
  return String(v).replace(/\s+/g, ' ').replaceAll('|', '\\|').trim();
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function aps(m: MonsterDefinition): number {
  return 1000 / Math.max(100, m.stats.attackCooldown);
}

function biomeTiersFor(biomeId: string): number[] {
  const b = BIOME_DATABASE.get(biomeId);
  if (!b) return [];
  return Object.keys(b.monsterPoolByTier).map(Number).sort((a, z) => a - z);
}

function monstersForBiomeTier(biomeId: string, tier: number): MonsterDefinition[] {
  const b = BIOME_DATABASE.get(biomeId);
  if (!b) return [];
  return (b.monsterPoolByTier[tier] ?? [])
    .map((id) => MONSTER_DATABASE.get(id))
    .filter((m): m is MonsterDefinition => Boolean(m) && !TUTORIAL_IDS.has(m!.id));
}

function bossesForBiomeTier(biomeId: string, tier: number): MonsterDefinition[] {
  const b = BIOME_DATABASE.get(biomeId);
  if (!b) return [];
  return (b.bossPoolByTier?.[tier] ?? [])
    .map((id) => MONSTER_DATABASE.get(id))
    .filter((m): m is MonsterDefinition => Boolean(m));
}

/** All (biomeId, tier) pairs to render, respecting CLI filters. */
function sections(): Array<{ biomeId: string; tier: number }> {
  const out: Array<{ biomeId: string; tier: number }> = [];
  for (const biomeId of BIOME_DATABASE.keys()) {
    if (EXCLUDED_BIOMES.has(biomeId)) continue;
    if (OPTIONS.biome && biomeId !== OPTIONS.biome) continue;
    for (const tier of biomeTiersFor(biomeId)) {
      if (OPTIONS.tier !== null && tier !== OPTIONS.tier) continue;
      const mobs  = monstersForBiomeTier(biomeId, tier);
      const bosses = bossesForBiomeTier(biomeId, tier);
      if (mobs.length > 0 || bosses.length > 0) out.push({ biomeId, tier });
    }
  }
  return out.sort((a, b) =>
    a.tier !== b.tier ? a.tier - b.tier : a.biomeId.localeCompare(b.biomeId),
  );
}

// ─── Mechanic text helpers (shared by HTML and Markdown) ─────────────────────

interface MechanicLine { label: string; value: string }

function mechanicLines(m: MonsterDefinition): MechanicLine[] {
  const lines: MechanicLine[] = [];

  if (m.chargeOnAggro) {
    lines.push({ label: 'Charge on aggro', value: `${n(m.chargeOnAggro.speedMult)}× speed for ${ms(m.chargeOnAggro.durationMs)}` });
  }
  if (m.dotEffect) {
    const d = m.dotEffect;
    const parts = [
      `${n(d.damagePerStack, 2)} dmg/stack`,
      `max ${d.maxStacks} stacks`,
      `tick every ${ms(d.tickIntervalMs)}`,
    ];
    if (d.durationMs) parts.push(`expires ${ms(d.durationMs)} after last hit`);
    if (d.element)    parts.push(`element: ${d.element}`);
    if (d.bypassShield) parts.push('bypasses shields');
    const id = d.debuffId ? ` [${d.debuffId}]` : '';
    const label = d.label ? ` "${d.label}"` : '';
    lines.push({ label: `DoT${label}${id}`, value: parts.join(', ') });
  }
  if (m.slowEffect) {
    const s = m.slowEffect;
    const kind = s.speedMult === 0 ? 'Root (speed × 0)' : `Slow (speed × ${n(s.speedMult, 2)})`;
    lines.push({ label: 'Slow / Root on hit', value: `${kind} for ${ms(s.durationMs)}, refreshes on each hit` });
  }
  if (m.aoeAttack) {
    const a = m.aoeAttack;
    lines.push({ label: 'AoE basic attack', value: `radius ${n(a.radius)}px, splash × ${n(a.damageMult ?? 1, 2)} of base attack` });
  }
  if (m.rampOnCombat) {
    const r = m.rampOnCombat;
    lines.push({ label: 'Combat ramp', value: `${r.stat} +${pct(r.perTickPct)} per ${ms(r.tickIntervalMs)}, cap +${pct(r.maxPct)}; resets on de-aggro` });
  }
  if (m.rampDebuff) {
    const r = m.rampDebuff;
    lines.push({ label: 'Stacking debuff on player', value: `move slow: +${pct(r.moveSlowPerHit)}/hit cap ${pct(r.moveSlowMaxPct)}; atk slow: +${pct(r.atkSlowPerHit)}/hit cap ${pct(r.atkSlowMaxPct)}; fades ${ms(r.stackDurationMs)} after last hit` });
  }
  if (m.cadenceFinisher) {
    const c = m.cadenceFinisher;
    lines.push({ label: 'Cadence finisher', value: `every ${c.everyNAttacks} landed hits → ${n(c.multiplier, 2)}× damage (counter-based, goes through player's full defensive pipeline)` });
  }
  if (m.empoweredCooldown) {
    const e = m.empoweredCooldown;
    lines.push({ label: 'Cooldown finisher', value: `${ms(e.cooldownMs)} countdown → next attack × ${n(e.multiplier, 2)} (waits for next attack if timer expires between swings; resets each proc)` });
  }
  if (m.enemyShield) {
    const s = m.enemyShield;
    lines.push({ label: 'Periodic barrier', value: `shield = ${pct(s.shieldPct)} × maxHP, every ${ms(s.intervalMs)}, lasts ${ms(s.durationMs)}; absorbs player direct hits before HP` });
  }
  if (m.enemySoftCap) {
    const s = m.enemySoftCap;
    lines.push({ label: 'Damage soft cap', value: `hits above ${pct(s.capPct)} × maxHP are scaled by ${n(s.capMult, 2)} on the excess; punishes burst, rewards fast consistent damage` });
  }
  if ((m.evasion ?? 0) > 0) {
    const parts = [`dodge rate ${pct(m.evasion!)}`];
    if (m.evadeMitigation !== undefined) parts.push(`mitigation ${pct(m.evadeMitigation)} per dodge`);
    if (m.appliesThroughEvade) parts.push('debuffs/DoT still apply on a dodged hit');
    lines.push({ label: 'Evasion (deterministic)', value: parts.join(', ') });
  }
  if (m.kite) {
    lines.push({ label: 'Kite behaviour', value: `AI steers to maintain attack range (backs off as player closes); speed < player base so charge catches it` });
  }
  if (m.targeting?.mode && m.targeting.mode !== 'closest') {
    lines.push({ label: 'Targeting', value: `${m.targeting.mode}${m.targeting.ignoresTaunts ? '; ignores taunts' : ''}` });
  }
  if (m.profile) {
    lines.push({ label: 'Profile', value: m.profile });
  }
  return lines;
}

// ─── Boss script rendering ────────────────────────────────────────────────────

function renderBossAction(a: BossAction): string {
  switch (a.type) {
    case 'enrage':
      return `Enrage: attack × ${n(a.atkMult, 2)}, cooldown × ${n(a.cdMult, 2)}${a.durationMs ? ` for ${ms(a.durationMs)}` : ' (permanent)'}`;
    case 'regen':
      return `Regen: ${pct(a.hpPctPerSec)}/s${a.durationMs ? ` for ${ms(a.durationMs)}` : ' (permanent)'}`;
    case 'shield':
      return `Shield: +${pct(a.drAdd)} DR for ${ms(a.durationMs)}`;
    case 'summon':
      return `Summon: ${a.count}× ${a.monsterTypeId}${a.offsetRange ? ` within ${n(a.offsetRange)}px` : ''}`;
    case 'stat-buff':
      return `Stat buff: ${a.stat} × ${n(a.mult, 2)}${a.durationMs ? ` for ${ms(a.durationMs)}` : ' (permanent)'}`;
    case 'slam':
      return `Slam: AoE ${n(a.radius)}px radius, × ${n(a.damageMult ?? 1, 2)} of current attack (hits players + summons)`;
    case 'apply-shield':
      return `Apply barrier: ${pct(a.shieldPct)} × maxHP, every ${ms(a.intervalMs)}, lasts ${ms(a.durationMs)}`;
    case 'apply-soft-cap':
      return `Apply soft cap: hits above ${pct(a.capPct)} × maxHP scaled by ${n(a.capMult, 2)}`;
    case 'shed-defense':
      return 'Shed defense: drops all runtime shields/soft-caps, reduces plating to ~20%';
    case 'modify-ramp-debuff':
      return `Escalate ramp debuff: move slow cap → ${pct(a.moveSlowMaxPct)}, atk slow cap → ${pct(a.atkSlowMaxPct)}`;
    case 'spawn-adds':
      return `Spawn adds: ${a.count}× ${a.monsterTypeId} (tracked; despawn on boss death)`;
    case 'morph': {
      const parts: string[] = [];
      if (a.isRanged !== undefined) parts.push(`ranged: ${a.isRanged}`);
      if (a.attackStyle) parts.push(`style: ${a.attackStyle}`);
      if (a.attackRange !== undefined) parts.push(`range: ${n(a.attackRange)}px`);
      if (a.kite !== undefined) parts.push(`kite: ${a.kite}`);
      if (a.dotEffect === null) parts.push('clear DoT override');
      else if (a.dotEffect) {
        const d = a.dotEffect;
        parts.push(`override DoT: ${n(d.damagePerStack, 2)}/stack × ${d.maxStacks}, tick ${ms(d.tickIntervalMs)}${d.bypassShield ? ', bypass shield' : ''}`);
      }
      const duration = a.durationMs ? ` for ${ms(a.durationMs)}` : ' (permanent)';
      return `Morph${duration}: ${parts.join('; ')}`;
    }
    default:
      return JSON.stringify(a);
  }
}

function renderBossScript(script: BossScript): string[] {
  const lines: string[] = [];
  if (script.phases?.length) {
    lines.push('— HP-threshold phases —');
    for (const p of script.phases) {
      lines.push(`  HP ≤ ${pct(p.hpPct)}:`);
      for (const a of p.actions) lines.push(`    • ${renderBossAction(a)}`);
    }
  }
  if (script.repeating?.length) {
    lines.push('— Repeating triggers —');
    for (const r of script.repeating) {
      const initial = r.initialDelayMs !== undefined ? `, first after ${ms(r.initialDelayMs)}` : '';
      lines.push(`  Every ${ms(r.intervalMs)}${initial}:`);
      for (const a of r.actions) lines.push(`    • ${renderBossAction(a)}`);
    }
  }
  return lines;
}

function renderUltimate(u: UltimateEncounter): string[] {
  const lines: string[] = [`Anchor: ${u.anchor ?? 'none'}; wipe reset: ${u.reset.onWipe}`];
  for (const s of u.stages) {
    lines.push(`  Stage "${s.displayName ?? s.id}"${s.vulnerable ? ' (VULNERABLE)' : ''}:`);
    for (const a of s.onEnter) {
      if (a.type === 'spawn-waves') {
        for (const w of a.waves) {
          lines.push(`    • wave: ${w.adds.map((x) => `${x.count}× ${x.monsterTypeId}`).join(', ')}`);
        }
      } else if (a.type === 'spawn-elites') {
        lines.push(`    • spawn elites: ${a.count}× ${a.monsterTypeId}`);
      } else if (a.type === 'environmental-dot') {
        lines.push(`    • env DoT: ${n(a.damagePerStack, 2)}/stack × ${a.maxStacks}, tick ${ms(a.tickIntervalMs)}, refresh ${ms(a.refreshMs)}${a.stackCap ? `, ramp cap ${a.stackCap}` : ''}${a.hazardHint ? ` (hint: "${a.hazardHint}")` : ''}`);
      } else if (a.type === 'set-invulnerable') {
        lines.push(`    • set invulnerable: ${a.value}`);
      } else if (a.type === 'set-rooted') {
        lines.push(`    • set rooted: ${a.value}`);
      } else if (a.type === 'set-cannot-attack') {
        lines.push(`    • set cannot-attack: ${a.value}`);
      } else if (a.type === 'set-feature-block') {
        lines.push(`    • feature block "${a.featureId}": ${a.value}`);
      }
    }
    if (s.completeWhen) lines.push(`    → complete when: ${s.completeWhen.kind}`);
    else lines.push(`    → complete when: boss dies`);
  }
  return lines;
}

// ─── HTML rendering ───────────────────────────────────────────────────────────

function htmlMonsterTable(monsters: MonsterDefinition[], isBoss: boolean): string {
  if (monsters.length === 0) return '';

  const headers = [
    'Name', 'HP', 'Attack', 'APS', 'Atk CD', 'Plating', 'DR',
    'Speed', 'Atk Range', 'Pull Range', 'Wander R', 'Leash R',
    'Idle min', 'Idle max', 'Style', 'Ranged', 'Kite',
    'Essence', 'Biome XP',
    'Specials',
  ];

  const rows = monsters.map((m) => {
    const specials = mechanicLines(m);
    const specialText = specials.length
      ? specials.map((l) => `<b>${esc(l.label)}:</b> ${esc(l.value)}`).join('<br>')
      : '—';

    return `<tr>
      <td><b>${esc(m.name)}</b><br><small style="color:#888">${esc(m.id)}</small></td>
      <td>${n(m.stats.hp, 0)}</td>
      <td>${n(m.stats.attack, 0)}</td>
      <td>${n(aps(m), 2)}</td>
      <td>${ms(m.stats.attackCooldown)}</td>
      <td>${n(m.stats.plating, 0)}</td>
      <td>${pct(m.stats.damageReduction)}</td>
      <td>${n(m.stats.speed, 0)}</td>
      <td>${n(m.stats.attackRange, 0)}</td>
      <td>${n(m.stats.pullRange, 0)}</td>
      <td>${n(m.ai.wanderRadius, 0)}</td>
      <td>${n(m.ai.leashRange, 0)}</td>
      <td>${ms(m.ai.idleMinMs)}</td>
      <td>${ms(m.ai.idleMaxMs)}</td>
      <td>${esc(m.attackStyle)}</td>
      <td>${m.isRanged ? '✓' : '—'}</td>
      <td>${m.kite ? '✓' : '—'}</td>
      <td>${n(m.rewards.essence, 0)} ${esc(m.rewards.essenceType)}</td>
      <td>${m.rewards.biomeXp !== undefined ? n(m.rewards.biomeXp, 0) : '—'}</td>
      <td class="specials">${specialText}</td>
    </tr>`;
  });

  return `<table>
    <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.join('\n')}</tbody>
  </table>`;
}

function htmlBossScript(m: MonsterDefinition): string {
  if (!m.bossScript && !m.ultimateEncounter) return '';
  const lines: string[] = [];
  if (m.bossScript)        lines.push(...renderBossScript(m.bossScript));
  if (m.ultimateEncounter) { lines.push('— Ultimate encounter —'); lines.push(...renderUltimate(m.ultimateEncounter)); }
  if (lines.length === 0) return '';
  return `<details class="boss-script"><summary>Fight script</summary><pre>${esc(lines.join('\n'))}</pre></details>`;
}

function htmlBossCard(m: MonsterDefinition): string {
  const specials = mechanicLines(m);
  const specialRows = specials.length
    ? `<table class="specials-table"><tbody>${
        specials.map((l) => `<tr><td class="spec-label">${esc(l.label)}</td><td>${esc(l.value)}</td></tr>`).join('')
      }</tbody></table>`
    : '';

  return `<div class="boss-card">
    <h5>${esc(m.name)} <small>${esc(m.id)}${m.ultimateEncounter ? ' · ULTIMATE' : ''}</small></h5>
    <table class="boss-stat-table">
      <thead><tr>
        <th>HP</th><th>Attack</th><th>APS</th><th>Atk CD</th>
        <th>Plating</th><th>DR</th><th>Speed</th>
        <th>Atk Range</th><th>Pull Range</th>
        <th>Wander R</th><th>Leash R</th>
        <th>Style</th><th>Ranged</th><th>Kite</th>
      </tr></thead>
      <tbody><tr>
        <td>${n(m.stats.hp, 0)}</td>
        <td>${n(m.stats.attack, 0)}</td>
        <td>${n(aps(m), 2)}</td>
        <td>${ms(m.stats.attackCooldown)}</td>
        <td>${n(m.stats.plating, 0)}</td>
        <td>${pct(m.stats.damageReduction)}</td>
        <td>${n(m.stats.speed, 0)}</td>
        <td>${n(m.stats.attackRange, 0)}</td>
        <td>${n(m.stats.pullRange, 0)}</td>
        <td>${n(m.ai.wanderRadius, 0)}</td>
        <td>${n(m.ai.leashRange, 0)}</td>
        <td>${esc(m.attackStyle)}</td>
        <td>${m.isRanged ? '✓' : '—'}</td>
        <td>${m.kite ? '✓' : '—'}</td>
      </tr></tbody>
    </table>
    ${specialRows}
    ${htmlBossScript(m)}
  </div>`;
}

function htmlTierSection(biomeId: string, tier: number): string {
  const biomeName = BIOME_DATABASE.get(biomeId)?.name ?? biomeId;
  const mobs  = monstersForBiomeTier(biomeId, tier);
  const bosses = bossesForBiomeTier(biomeId, tier);
  if (mobs.length === 0 && bosses.length === 0) return '';

  const mobSection = mobs.length
    ? `<h4>Monsters (${mobs.length})</h4>${htmlMonsterTable(mobs, false)}`
    : '';
  const bossSection = bosses.length
    ? `<h4>Boss${bosses.length > 1 ? 'es' : ''}</h4>${bosses.map(htmlBossCard).join('\n')}`
    : '';

  return `<section class="tier-section" id="${biomeId}-t${tier}">
    <h3>${esc(biomeName)} — Biome Tier ${tier}</h3>
    ${mobSection}
    ${bossSection}
  </section>`;
}

function renderHtml(): string {
  const allSections = sections();
  const biomeIds = [...new Set(allSections.map((s) => s.biomeId))];
  const toc = biomeIds.map((id) => {
    const name = BIOME_DATABASE.get(id)?.name ?? id;
    const tiers = allSections.filter((s) => s.biomeId === id).map((s) => s.tier);
    const tierLinks = tiers.map((t) => `<a href="#${id}-t${t}">T${t}</a>`).join(' ');
    return `<li><b>${esc(name)}</b>: ${tierLinks}</li>`;
  }).join('\n');

  const body = allSections.map(({ biomeId, tier }) => htmlTierSection(biomeId, tier)).join('\n');

  const total = allSections.reduce((acc, { biomeId, tier }) => {
    return acc + monstersForBiomeTier(biomeId, tier).length + bossesForBiomeTier(biomeId, tier).length;
  }, 0);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MMO Idle Monster Reference</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; background: #0f1117; color: #d4d8e0; font-size: 13px; }
    .layout { display: flex; }
    nav { width: 220px; min-width: 220px; position: sticky; top: 0; height: 100vh; overflow-y: auto; background: #161920; padding: 16px; border-right: 1px solid #2a2e3a; }
    nav h2 { font-size: 14px; margin: 0 0 10px; color: #7eb8f7; }
    nav ul { margin: 0; padding: 0; list-style: none; font-size: 12px; }
    nav li { margin: 4px 0; }
    nav a { color: #9ab8e0; text-decoration: none; }
    nav a:hover { color: #fff; }
    main { flex: 1; padding: 24px; overflow-x: auto; }
    h1 { font-size: 24px; margin: 0 0 6px; color: #e8edf5; }
    h3 { font-size: 16px; margin: 32px 0 8px; color: #b8d4f8; border-bottom: 1px solid #2a2e3a; padding-bottom: 6px; }
    h4 { font-size: 13px; margin: 16px 0 6px; color: #90a8c4; }
    h5 { font-size: 13px; margin: 0 0 8px; color: #d4e8ff; }
    h5 small { color: #6a8090; font-weight: normal; font-size: 11px; }
    p.meta { color: #6a7a8a; font-size: 11px; margin: 2px 0 16px; }

    /* Main monster table */
    table { border-collapse: collapse; width: 100%; margin: 0 0 16px; background: #161920; }
    th, td { border: 1px solid #272d3a; padding: 5px 7px; vertical-align: top; }
    th { background: #1e2433; color: #9ab8e0; font-size: 11px; position: sticky; top: 0; z-index: 1; white-space: nowrap; }
    td { font-size: 12px; color: #c4ccd8; }
    td.specials { max-width: 420px; font-size: 11px; line-height: 1.5; }
    tr:nth-child(even) td { background: #191f2a; }

    /* Boss cards */
    .boss-card { border: 1px solid #3a4a5a; border-radius: 6px; padding: 12px 14px; margin: 0 0 14px; background: #14181e; }
    .boss-stat-table th, .boss-stat-table td { font-size: 11px; }
    .boss-stat-table { margin: 0 0 10px; }
    .specials-table { margin: 8px 0; border: none; }
    .specials-table td { border: none; border-bottom: 1px solid #1e2433; padding: 3px 6px; font-size: 11px; }
    .spec-label { color: #7eb8f7; font-weight: bold; white-space: nowrap; padding-right: 12px; }
    details.boss-script { margin-top: 8px; }
    details.boss-script summary { cursor: pointer; color: #7eb8f7; font-size: 11px; font-weight: bold; }
    details.boss-script pre { background: #0d1016; border: 1px solid #2a2e3a; border-radius: 4px; padding: 10px; font-size: 11px; line-height: 1.55; color: #b0c4d8; overflow-x: auto; margin: 6px 0 0; }
    .tier-section { margin-bottom: 40px; }
  </style>
</head>
<body>
<div class="layout">
  <nav>
    <h2>Monster Reference</h2>
    <p style="font-size:11px;color:#6a7a8a;margin:0 0 12px">${total} monsters across ${allSections.length} biome tiers</p>
    <ul>${toc}</ul>
  </nav>
  <main>
    <h1>MMO Idle Monster Reference</h1>
    <p class="meta">
      Raw stat dump for every non-tutorial monster, organised by biome then biome tier.
      Bosses are shown as detailed cards with full fight scripts.
      No player matchup analysis — this is the world-side data only.
    </p>
    ${body}
  </main>
</div>
</body>
</html>`;
}

// ─── Markdown rendering ───────────────────────────────────────────────────────

function mdRow(headers: string[], values: string[]): string {
  return `| ${values.map(mdCell).join(' | ')} |`;
}

function mdMonsterTable(monsters: MonsterDefinition[]): string {
  if (monsters.length === 0) return '';
  const headers = [
    'Name', 'id', 'HP', 'Attack', 'APS', 'Atk CD', 'Plating', 'DR',
    'Speed', 'Atk Range', 'Pull Range', 'Wander R', 'Leash R',
    'Idle min', 'Idle max', 'Style', 'Ranged', 'Kite',
    'Essence', 'Biome XP',
  ];
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const rows = monsters.map((m) =>
    mdRow(headers, [
      m.name, m.id,
      n(m.stats.hp, 0), n(m.stats.attack, 0), n(aps(m), 2),
      ms(m.stats.attackCooldown),
      n(m.stats.plating, 0), pct(m.stats.damageReduction),
      n(m.stats.speed, 0), n(m.stats.attackRange, 0), n(m.stats.pullRange, 0),
      n(m.ai.wanderRadius, 0), n(m.ai.leashRange, 0),
      ms(m.ai.idleMinMs), ms(m.ai.idleMaxMs),
      m.attackStyle, m.isRanged ? 'yes' : '', m.kite ? 'yes' : '',
      `${n(m.rewards.essence, 0)} ${m.rewards.essenceType}`,
      m.rewards.biomeXp !== undefined ? n(m.rewards.biomeXp, 0) : '',
    ]),
  );
  return `| ${headers.join(' | ')} |\n${sep}\n${rows.join('\n')}\n`;
}

function mdSpecials(m: MonsterDefinition): string {
  const lines = mechanicLines(m);
  if (lines.length === 0) return '';
  return lines.map((l) => `  - **${l.label}:** ${l.value}`).join('\n');
}

function mdBossBlock(m: MonsterDefinition): string {
  const lines: string[] = [];
  lines.push(`#### ${m.name} \`${m.id}\`${m.ultimateEncounter ? ' _(Ultimate)_' : ''}`);
  lines.push('');
  lines.push(mdMonsterTable([m]));
  const specials = mechanicLines(m);
  if (specials.length) {
    lines.push('**Mechanics:**');
    lines.push(...specials.map((l) => `- **${l.label}:** ${l.value}`));
    lines.push('');
  }
  if (m.bossScript) {
    const scriptLines = renderBossScript(m.bossScript);
    if (scriptLines.length) {
      lines.push('**Fight script:**');
      lines.push('```');
      lines.push(...scriptLines);
      lines.push('```');
      lines.push('');
    }
  }
  if (m.ultimateEncounter) {
    const uLines = renderUltimate(m.ultimateEncounter);
    lines.push('**Ultimate encounter:**');
    lines.push('```');
    lines.push(...uLines);
    lines.push('```');
    lines.push('');
  }
  return lines.join('\n');
}

function renderMarkdown(): string {
  const out: string[] = [];
  out.push('# MMO Idle Monster Reference');
  out.push('');
  out.push('Raw stat dump for every non-tutorial monster, organised by biome then biome tier.');
  out.push('Bosses include full fight scripts.');
  out.push('');

  let lastBiome = '';
  for (const { biomeId, tier } of sections()) {
    const biomeName = BIOME_DATABASE.get(biomeId)?.name ?? biomeId;
    if (biomeId !== lastBiome) {
      out.push(`## ${biomeName}`);
      out.push('');
      lastBiome = biomeId;
    }
    out.push(`### Biome Tier ${tier}`);
    out.push('');

    const mobs = monstersForBiomeTier(biomeId, tier);
    if (mobs.length) {
      out.push('**Monsters:**');
      out.push('');
      out.push(mdMonsterTable(mobs));
      for (const m of mobs) {
        const sp = mdSpecials(m);
        if (sp) {
          out.push(`**${m.name} — mechanics:**`);
          out.push(sp);
          out.push('');
        }
      }
    }

    const bosses = bossesForBiomeTier(biomeId, tier);
    if (bosses.length) {
      out.push('**Bosses:**');
      out.push('');
      for (const b of bosses) out.push(mdBossBlock(b));
    }
  }

  return out.join('\n');
}

// ─── Entrypoint ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (OPTIONS.md) {
    await mkdir(path.dirname(MD_PATH), { recursive: true });
    await writeFile(MD_PATH, renderMarkdown(), 'utf8');
    console.log(`Wrote ${MD_PATH}`);
  } else {
    await mkdir(path.dirname(HTML_PATH), { recursive: true });
    await writeFile(HTML_PATH, renderHtml(), 'utf8');
    console.log(`Wrote ${HTML_PATH}`);
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
