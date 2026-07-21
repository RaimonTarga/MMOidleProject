import type { ReactNode } from 'react';
import { useHoverTooltip } from './tooltip';
import { STAT_HELP } from './statHelp';

export function DefensePassivesSection({ passives: p }: { passives: Record<string, number> }) {
  const rows: { label: string; value: string; help?: ReactNode }[] = [];
  const help = (k: string) => STAT_HELP[k];

  const inCombatRegen = p['defense.in-combat-regen-pct'] ?? 0;
  if (inCombatRegen > 0)
    rows.push({ label: 'In-combat Regen', value: `${Math.round(inCombatRegen * 100)}%`, help: help('defense.in-combat-regen-pct') });

  const burstRegen = p['defense.regen-burst-pct'] ?? 0;
  if (burstRegen > 0) {
    const iv = ((p['defense.regen-burst-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Burst Regen', value: `${Math.round(burstRegen * 100)}% / ${iv}s`, help: help('defense.regen-burst-pct') });
  }

  const shieldPct = p['defense.shield-pct'] ?? 0;
  if (shieldPct > 0) {
    const iv = ((p['defense.shield-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Shield', value: `${Math.round(shieldPct * 100)}% / ${iv}s`, help: help('defense.shield-pct') });
  }

  const absorb = p['defense.absorb-pct'] ?? 0;
  if (absorb > 0)
    rows.push({ label: 'Dmg Absorb', value: `${Math.round(absorb * 100)}%`, help: help('defense.absorb-pct') });

  const dotRes = p['defense.dot-resistance'] ?? 0;
  if (dotRes > 0)
    rows.push({ label: 'DoT Resist', value: `${Math.round(dotRes * 100)}%`, help: help('defense.dot-resistance') });

  const hitToDot = p['defense.hit-to-dot-pct'] ?? 0;
  if (hitToDot > 0)
    rows.push({ label: 'Hit→DoT', value: `${Math.round(hitToDot * 100)}%`, help: help('defense.hit-to-dot-pct') });

  const debuffRes = p['defense.debuff-resistance'] ?? 0;
  if (debuffRes > 0)
    rows.push({ label: 'Debuff Resist', value: `${Math.round(debuffRes * 100)}%`, help: help('defense.debuff-resistance') });

  const cleanseStacks = p['defense.cleanse-stacks'] ?? 0;
  if (cleanseStacks > 0) {
    const iv = ((p['defense.cleanse-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Cleanse', value: `${cleanseStacks} stacks / ${iv}s`, help: help('defense.cleanse-stacks') });
  }

  if (rows.length === 0) return null;

  return (
    <div className="stat-section">
      <div className="stat-section-title">Defense Passives</div>
      {rows.map(r => <StatRow key={r.label} label={r.label} value={r.value} help={r.help} />)}
    </div>
  );
}
export function MobilityPassivesSection({ passives: p }: { passives: Record<string, number> }) {
  const rows: { label: string; value: string; help?: ReactNode }[] = [];
  const pct = (k: string) => `${Math.round((p[k] ?? 0) * 100)}%`;
  const sec = (k: string) => `${Math.round((p[k] ?? 0) / 1000)}s`;
  const has = (k: string) => (p[k] ?? 0) > 0;
  const help = (k: string) => STAT_HELP[k];

  if (has('mobility.ooc-speed-pct'))
    rows.push({ label: 'Out-of-combat Speed', value: `+${pct('mobility.ooc-speed-pct')}`, help: help('mobility.ooc-speed-pct') });

  if (has('mobility.kill-speed-pct'))
    rows.push({ label: 'On-kill Haste', value: `+${pct('mobility.kill-speed-pct')} / ${sec('mobility.kill-speed-ms')}`, help: help('mobility.kill-speed-pct') });

  if (has('mobility.acquire-speed-pct'))
    rows.push({
      label: 'New-target Burst',
      value: `+${pct('mobility.acquire-speed-pct')} / ${sec('mobility.acquire-speed-ms')} (${sec('mobility.acquire-cooldown-ms')} cd)`,
      help: help('mobility.acquire-speed-pct'),
    });

  if (has('mobility.kite-speed-pct'))
    rows.push({ label: 'Retreat Speed', value: `+${pct('mobility.kite-speed-pct')}`, help: help('mobility.kite-speed-pct') });

  if (has('mobility.ramp-speed-pct'))
    rows.push({ label: 'Move Ramp', value: `up to +${pct('mobility.ramp-speed-pct')}`, help: help('mobility.ramp-speed-pct') });

  if (has('mobility.passive-speed-pct'))
    rows.push({ label: 'Passive Speed', value: `+${pct('mobility.passive-speed-pct')} (−${sec('mobility.suppress-ms')} on hit)`, help: help('mobility.passive-speed-pct') });

  if (has('mobility.kill-stack-speed-pct') || has('mobility.kill-stack-tenacity-pct'))
    rows.push({
      label: 'On-kill Stacks',
      value: `+${pct('mobility.kill-stack-speed-pct')} spd, ${pct('mobility.kill-stack-tenacity-pct')} ten / stack`,
      help: help('mobility.kill-stack-speed-pct'),
    });

  if (has('mobility.stealth-pct'))
    rows.push({ label: 'Stealth', value: `−${pct('mobility.stealth-pct')} enemy detection`, help: help('mobility.stealth-pct') });

  if (has('mobility.aggro-pull-pct'))
    rows.push({ label: 'Aggro Pull', value: `+${pct('mobility.aggro-pull-pct')} enemy detection`, help: help('mobility.aggro-pull-pct') });

  if (has('mobility.tenacity-pct'))
    rows.push({ label: 'Tenacity', value: `${pct('mobility.tenacity-pct')} faster slow/root recovery`, help: help('mobility.tenacity-pct') });

  if (rows.length === 0) return null;

  return (
    <div className="stat-section">
      <div className="stat-section-title">Mobility</div>
      {rows.map(r => <StatRow key={r.label} label={r.label} value={r.value} help={r.help} />)}
    </div>
  );
}


export function StatRow({
  label,
  value,
  dim,
  help,
}: {
  label: string;
  value: string | number;
  dim?: boolean;
  help?: ReactNode;
}) {
  const { handlers, node } = useHoverTooltip(help);
  return (
    <div className={`stat-row${help ? ' stat-row--help' : ''}`} {...handlers}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value${dim ? ' dim' : ''}`}>{value}</span>
      {node}
    </div>
  );
}
