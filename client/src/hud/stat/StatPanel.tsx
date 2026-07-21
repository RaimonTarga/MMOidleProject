import { useId, useState } from 'react';
import { useAtomValue } from 'jotai';
import { resolveEmpoweredMultiplier } from '@mmo-idle/shared';
import { DefensePassivesSection, MobilityPassivesSection, StatRow } from './components';
import { ArchetypeMechanics } from './mechanics';
import { useHoverTooltip } from './tooltip';
import { STAT_HELP } from './statHelp';
import { DisclosureHeader, HudPanel } from '../primitives';
import { useIsMobile } from '../useIsMobile';
import { composeIntentPresentation } from '../intentPresentation';
import {
  attackAtom,
  attackCooldownAtom,
  attackRangeAtom,
  autoIntentAtom,
  combatArchetypeAtom,
  damageReductionAtom,
  equipmentAtom,
  dodgeRateAtom,
  evadeMitigationAtom,
  hpAtom,
  hpRegenAtom,
  incomingDotAtom,
  maxHpAtom,
  onHitDamageAtom,
  passivesAtom,
  pendingHealAtom,
  partyAtom,
  platingAtom,
  playerIdAtom,
  playerNameAtom,
  shieldsAtom,
  speedAtom,
  statusAtom,
} from '../atoms';

const CHARACTER_EXPANDED_STORAGE_KEY = 'mmo_idle.desktop.character_expanded';

function readCharacterExpandedPreference(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(CHARACTER_EXPANDED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function IntentPanel() {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const playerId = useAtomValue(playerIdAtom);
  const intent = useAtomValue(autoIntentAtom);
  const party = useAtomValue(partyAtom);
  const presentation = composeIntentPresentation(
    playerId !== null,
    intent,
    party?.members ?? [],
  );

  return (
    <section className="intent-panel">
      <button
        type="button"
        className="intent-panel__header"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="intent-panel__title">Intent</span>
        <span className="intent-panel__action">{presentation.action}</span>
        <span className="intent-panel__chevron" aria-hidden>{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div id={detailsId} className="intent-panel__details">
          <StatRow label="Action" value={presentation.action} />
          <StatRow label="Purpose" value={presentation.reason} />
          <StatRow label="Triggered rune" value={presentation.source} />
        </div>
      )}
    </section>
  );
}

export function StatPanel() {
  const [expanded, setExpanded] = useState(readCharacterExpandedPreference);
  const isMobile = useIsMobile();
  const characterDetailsId = useId();
  const hpTip = useHoverTooltip(STAT_HELP.hp);
  const playerId = useAtomValue(playerIdAtom);
  const status = useAtomValue(statusAtom);
  const name = useAtomValue(playerNameAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const shields = useAtomValue(shieldsAtom);
  const incomingDot = useAtomValue(incomingDotAtom);
  const pendingHeal = useAtomValue(pendingHealAtom);
  const attack = useAtomValue(attackAtom);
  const onHitDamage = useAtomValue(onHitDamageAtom);
  const plating = useAtomValue(platingAtom);
  const damageReduction = useAtomValue(damageReductionAtom);
  const attackCooldown = useAtomValue(attackCooldownAtom);
  const attackRange = useAtomValue(attackRangeAtom);
  const speed = useAtomValue(speedAtom);
  const hpRegen = useAtomValue(hpRegenAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const passives = useAtomValue(passivesAtom);
  const equipment = useAtomValue(equipmentAtom);
  const dodgeRate = useAtomValue(dodgeRateAtom);
  const evadeMitigation = useAtomValue(evadeMitigationAtom);
  const player = playerId
    ? {
      name,
      hp,
      maxHp,
      shields,
      incomingDot,
      pendingHeal,
      attack,
      onHitDamage,
      plating,
      damageReduction,
      attackCooldown,
      attackRange,
      speed,
      hpRegen,
      combatArchetype,
      passives,
      equipment,
      dodgeRate,
      evadeMitigation,
    }
    : null;

  const maxHpVal    = player?.maxHp ?? 0;
  const hpPct       = player && maxHpVal > 0 ? (player.hp / maxHpVal) * 100 : 0;
  const hpBarColor  = hpPct > 50 ? '#44ee44' : hpPct > 25 ? '#eeaa22' : '#ee3322';
  const totalShield = player?.shields.reduce((s, sh) => s + sh.amount, 0) ?? 0;
  // Shield sits in its own strip above the bar and stays visible at full HP.
  const shieldPct   = maxHpVal > 0 ? Math.min(100, (totalShield / maxHpVal) * 100) : 0;
  // HP-bar layers (all as % of maxHp): pending DoT eats the right edge of current
  // HP (red); pending regen extends past current HP (dark green).
  const dotPct      = player && maxHpVal > 0 ? Math.min(hpPct, (player.incomingDot / maxHpVal) * 100) : 0;
  const safePct     = Math.max(0, hpPct - dotPct);
  const healPct     = player && maxHpVal > 0 ? Math.min(100 - hpPct, (player.pendingHeal / maxHpVal) * 100) : 0;
  const cdSec       = player ? (player.attackCooldown / 1000).toFixed(2) : '—';
  const aps         = player ? (1000 / player.attackCooldown).toFixed(2) : '—';
  const dps         = player ? ((player.attack + player.onHitDamage) * (1000 / player.attackCooldown)).toFixed(1) : '—';
  const empMult     = player ? resolveEmpoweredMultiplier(player.passives, player.combatArchetype) : null;
  const empMultTip  = empMult ? (
    <>
      <div>The damage multiplier applied to your empowered attack (cadence finisher / cooldown execution / energy discharge).</div>
      <div style={{ marginTop: 6 }}>Base ×{empMult.base.toFixed(2)} (frame + spec)</div>
      {empMult.archetypeAdd !== 0 && <div>+{empMult.archetypeAdd.toFixed(2)} spec bonus</div>}
      {empMult.sharedAdd !== 0 && <div>+{empMult.sharedAdd.toFixed(2)} from gear/passives</div>}
      {empMult.multBonus !== 0 && <div>×{(1 + empMult.multBonus).toFixed(2)} weapon bonus</div>}
      <div style={{ marginTop: 6 }}>= ×{empMult.effective.toFixed(2)} effective</div>
    </>
  ) : undefined;

  const toggleExpanded = () => {
    setExpanded((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(CHARACTER_EXPANDED_STORAGE_KEY, String(next));
      } catch {
        // Keep the disclosure usable even when browser storage is unavailable.
      }
      return next;
    });
  };

  return (
    <HudPanel className="sidebar-panel character-panel">
      <DisclosureHeader
        className="panel-title panel-title--collapsible"
        title="Character"
        summary={expanded ? 'Hide detailed stats' : 'See detailed stats'}
        expanded={expanded}
        controls={characterDetailsId}
        onToggle={toggleExpanded}
      />

      {/* Name + connection dot */}
      <div className="stat-row name-row">
        <span>{player?.name ?? '—'}</span>
        <span className={`status-dot ${status}`} title={status} />
      </div>

      {/* HP bar */}
      <div className="stat-section">
        <div className="stat-row stat-row--help" {...hpTip.handlers}>
          <span className="stat-label">HP</span>
          <span className="stat-value">
            {player
              ? totalShield > 0
                ? `${Math.ceil(player.hp)} / ${player.maxHp}  (+${Math.ceil(totalShield)} shield)`
                : `${Math.ceil(player.hp)} / ${player.maxHp}`
              : '— / —'}
          </span>
          {hpTip.node}
        </div>
        {/* Shield strip — above the HP bar, always visible (even at full HP) */}
        {shieldPct > 0 && (
          <div className="hp-shield-strip">
            <div className="hp-shield-strip__fill" style={{ width: `${shieldPct}%` }} />
          </div>
        )}
        <div className="hp-bar-track">
          {/* expected regen — dark-green layer extending past current HP */}
          {healPct > 0 && (
            <div className="hp-layer hp-layer--regen" style={{ left: `${hpPct}%`, width: `${healPct}%` }} />
          )}
          {/* safe HP */}
          <div className="hp-layer hp-layer--hp" style={{ width: `${safePct}%`, background: hpBarColor }} />
          {/* pending DoT — red layer at the right edge of current HP */}
          {dotPct > 0 && (
            <div className="hp-layer hp-layer--dot" style={{ left: `${safePct}%`, width: `${dotPct}%` }} />
          )}
        </div>
      </div>

      {/* Core combat stats */}
      <div className="stat-section">
        <StatRow label="Attack"     value={player?.attack    ?? '—'} help={STAT_HELP.attack} />
        <StatRow label="DPS"        value={dps} help={STAT_HELP.dps} />
        <StatRow
          label="Defense"
          value={player ? `${player.plating} plating · ${Math.round(player.damageReduction * 100)}% DR` : '—'}
          help={STAT_HELP.plating}
        />
      </div>

      {expanded && (
        <div id={characterDetailsId} className="character-panel__details">
          <div className="stat-section">
            {player && player.onHitDamage > 0 && (
              <StatRow label="On-Hit Dmg" value={`+${player.onHitDamage}`} help={STAT_HELP.onHitDamage} />
            )}
            {empMult && (
              <StatRow label="Empowered" value={`×${empMult.effective.toFixed(2)}`} help={empMultTip} />
            )}
            <StatRow label="Attack Speed" value={player ? `${aps} APS (${cdSec}s)` : '—'} help={STAT_HELP.atkSpeed} />
            <StatRow label="Plating" value={player?.plating ?? '—'} help={STAT_HELP.plating} />
            <StatRow
              label="Damage Reduction"
              value={player ? `${Math.round(player.damageReduction * 100)}%` : '—'}
              help={STAT_HELP.damageReduction}
            />
            <StatRow label="Range" value={player ? `${player.attackRange}` : '—'} help={STAT_HELP.attackRange} />
            <StatRow label="Move Speed" value={player ? `${player.speed}` : '—'} help={STAT_HELP.speed} />
            <StatRow label="HP Regen" value={player ? `${player.hpRegen}/s` : '—'} help={STAT_HELP.hpRegen} />
          </div>

          {player && player.dodgeRate > 0 && (
            <div className="stat-section">
              <div className="stat-section-title">Evasion</div>
              <StatRow label="Dodge rate" value={`${Math.round(player.dodgeRate * 100)}%`} help={STAT_HELP.dodgeRate} />
              <StatRow label="Damage avoided" value={`${Math.round(player.evadeMitigation * 100)}% per dodge`} help={STAT_HELP.evadeMitigation} />
            </div>
          )}
          {player && <DefensePassivesSection passives={player.passives ?? {}} />}
          {player && <MobilityPassivesSection passives={player.passives ?? {}} />}
        </div>
      )}

      {/* Per-archetype mechanic bars (shared with the mobile HUD) */}
      {player && <ArchetypeMechanics compact={isMobile} />}

      <IntentPanel />
    </HudPanel>
  );
}
