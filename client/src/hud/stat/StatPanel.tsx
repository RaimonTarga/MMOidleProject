import { useId, useState } from 'react';
import { useAtomValue } from 'jotai';
import { resolveEmpoweredMultiplier } from '@mmo-idle/shared';
import { DefensePassivesSection, MobilityPassivesSection, StatRow } from './components';
import { ArchetypeMechanics } from './mechanics';
import { useHoverTooltip } from './tooltip';
import { STAT_HELP } from './statHelp';
import { StatPlate } from './StatPlate';
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
        // No summary: the chevron and aria-expanded already say this opens, and
        // the copy that used to sit here squeezed the title until "Character"
        // broke mid-word against the rail's 45% label cap.
        label={expanded ? 'Hide detailed character stats' : 'Show detailed character stats'}
        expanded={expanded}
        controls={characterDetailsId}
        onToggle={toggleExpanded}
      />

      {/* One engraved plate for the whole readout. Each figure labels itself,
          and a bar appears only where the value has a real 0-100% ceiling. */}
      {player && (
        <StatPlate
          crown={{
            name: player.name ?? '—',
            status,
            hp: player.hp,
            maxHp: player.maxHp,
            shield: totalShield,
            incomingDot: player.incomingDot,
            pendingHeal: player.pendingHeal,
            hpTip,
          }}
          // Glance figures are the two that decide a fight (§14.2). HP/s and
          // Speed demote to the expand, where they already had rows.
          figures={[
            { value: dps, label: 'DPS', watch: Number(dps) },
            { value: String(player.plating), label: 'Plating', watch: player.plating },
          ]}
          lines={[
            `${player.attack} attack`,
            `${aps}/s`,
            `${player.attackRange} range`,
            ...(player.onHitDamage > 0 ? [`+${player.onHitDamage} on-hit`] : []),
            ...(empMult ? [`×${empMult.effective.toFixed(2)} empowered`] : []),
            `${player.hpRegen}/s regen`,
            `${player.speed} speed`,
          ]}
          // Reduction is the only genuine 0-100% ceiling left here. The static
          // Dodge meter is gone: it stated a rate while saying nothing about
          // when the next dodge lands, which is what the Evasion instrument now
          // shows from the live authoritative charge.
          meters={[
            {
              label: 'Reduction',
              fraction: player.damageReduction,
              value: `${Math.round(player.damageReduction * 100)}%`,
            },
          ]}
        />
      )}

      {expanded && (
        <div id={characterDetailsId} className="character-panel__details">
          {/* The plates already carry every headline number, so the expand is
              the explained reference: what a stat means, and the detail a
              plate has no room for. */}
          <div className="stat-section">
            <StatRow label="Attack" value={player?.attack ?? '—'} help={STAT_HELP.attack} />
            <StatRow label="DPS" value={dps} help={STAT_HELP.dps} />
            <StatRow label="Attack Speed" value={player ? `${aps} APS (${cdSec}s)` : '—'} help={STAT_HELP.atkSpeed} />
            {player && player.onHitDamage > 0 && (
              <StatRow label="On-Hit Dmg" value={`+${player.onHitDamage}`} help={STAT_HELP.onHitDamage} />
            )}
            {empMult && (
              <StatRow label="Empowered" value={`×${empMult.effective.toFixed(2)}`} help={empMultTip} />
            )}
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
