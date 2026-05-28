import type { SummonSlotView } from '@mmo-idle/shared';

const CADENCE_TICKS = 8;

export function SummonSlotBar({ slots }: { slots: SummonSlotView[] }) {
  if (slots.length === 0) return null;

  return (
    <div className="summon-slots">
      {slots.map((slot, i) => {
        const respawning = !slot.active && slot.respawnRemainingMs > 0;
        const queued = !slot.active && slot.respawnRemainingMs <= 0;
        const respawnSec = respawning
          ? (slot.respawnRemainingMs / 1000).toFixed(1)
          : null;

        return (
          <div
            key={i}
            className="summon-slot"
            title={
              slot.active
                ? `Summon ${i + 1}: active`
                : respawning
                  ? `Summon ${i + 1}: respawning (${respawnSec}s)`
                  : `Summon ${i + 1}: waiting`
            }
          >
            <div
              className={`summon-slot-pip${
                slot.active
                  ? ' summon-slot-pip--active'
                  : respawning
                    ? ' summon-slot-pip--respawning'
                    : queued
                      ? ' summon-slot-pip--queued'
                      : ''
              }`}
            />
            {respawning && (
              <div className="summon-slot-respawn-track">
                <div
                  className="summon-slot-respawn-fill"
                  style={{ width: `${slot.respawnPct}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CadenceTimeline({ count, threshold, armed }: { count: number; threshold: number; armed: boolean }) {
  const hitsUntilFinisher = armed ? 0 : (threshold - 1) - count;

  return (
    <div className="cadence-timeline">
      {Array.from({ length: CADENCE_TICKS }, (_, i) => {
        const delta      = i - hitsUntilFinisher;
        const isFinisher = delta >= 0 && delta % threshold === 0;
        return (
          <div
            key={i}
            className={`cadence-tick${isFinisher ? ' cadence-tick--finisher' : ''}${i === 0 ? ' cadence-tick--next' : ''}`}
          />
        );
      })}
    </div>
  );
}

export function DefensePassivesSection({ passives: p }: { passives: Record<string, number> }) {
  const rows: { label: string; value: string }[] = [];

  const inCombatRegen = p['defense.in-combat-regen-pct'] ?? 0;
  if (inCombatRegen > 0)
    rows.push({ label: 'In-combat Regen', value: `${Math.round(inCombatRegen * 100)}%` });

  const burstRegen = p['defense.regen-burst-pct'] ?? 0;
  if (burstRegen > 0) {
    const iv = ((p['defense.regen-burst-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Burst Regen', value: `${Math.round(burstRegen * 100)}% / ${iv}s` });
  }

  const shieldPct = p['defense.shield-pct'] ?? 0;
  if (shieldPct > 0) {
    const iv = ((p['defense.shield-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Shield', value: `${Math.round(shieldPct * 100)}% / ${iv}s` });
  }

  const absorb = p['defense.absorb-pct'] ?? 0;
  if (absorb > 0)
    rows.push({ label: 'Dmg Absorb', value: `${Math.round(absorb * 100)}%` });

  const dotRes = p['defense.dot-resistance'] ?? 0;
  if (dotRes > 0)
    rows.push({ label: 'DoT Resist', value: `${Math.round(dotRes * 100)}%` });

  const hitToDot = p['defense.hit-to-dot-pct'] ?? 0;
  if (hitToDot > 0)
    rows.push({ label: 'Hit→DoT', value: `${Math.round(hitToDot * 100)}%` });

  const debuffRes = p['defense.debuff-resistance'] ?? 0;
  if (debuffRes > 0)
    rows.push({ label: 'Debuff Resist', value: `${Math.round(debuffRes * 100)}%` });

  const cleanseStacks = p['defense.cleanse-stacks'] ?? 0;
  if (cleanseStacks > 0) {
    const iv = ((p['defense.cleanse-interval-ms'] ?? 0) / 1000).toFixed(0);
    rows.push({ label: 'Cleanse', value: `${cleanseStacks} stacks / ${iv}s` });
  }

  if (rows.length === 0) return null;

  return (
    <div className="stat-section">
      <div className="stat-section-title">Defense Passives</div>
      {rows.map(r => <StatRow key={r.label} label={r.label} value={r.value} />)}
    </div>
  );
}


export function StatRow({
  label,
  value,
  dim,
}: {
  label: string;
  value: string | number;
  dim?: boolean;
}) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${dim ? ' dim' : ''}`}>{value}</span>
    </div>
  );
}

export function BuffBar({
  label,
  pct,
  active,
  activeLabel,
  variant,
}: {
  label: string;
  pct: number;
  active: boolean;
  activeLabel: string;
  variant: string;
}) {
  return (
    <div className="stat-section">
      <div className="stat-row">
        <span className="stat-label">{label}</span>
        <span className={`stat-value${active ? ` mech-label--${variant}-active` : ''}`}>
          {active ? activeLabel : `${pct}%`}
        </span>
      </div>
      <div className="mech-bar-track">
        <div
          className={`mech-bar-fill mech-bar-fill--${variant}${active ? ` mech-bar-fill--${variant}-active` : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
