import { useAtomValue } from 'jotai';
import { resolveEmpoweredMultiplier } from '@mmo-idle/shared';
import { DefensePassivesSection, MobilityPassivesSection, StatRow } from './components';
import { ArchetypeMechanics } from './mechanics';
import { useHoverTooltip } from './tooltip';
import { STAT_HELP } from './statHelp';
import {
  ammoCountAtom,
  ammoMaxAtom,
  attackAtom,
  attackCooldownAtom,
  attackRangeAtom,
  attackTargetIdAtom,
  cadenceCountAtom,
  cadenceEmpoweredArmedAtom,
  cadenceThresholdAtom,
  channelingPctAtom,
  combatArchetypeAtom,
  damageReductionAtom,
  energyCountAtom,
  energyMaxAtom,
  empoweredReadyAtom,
  equipmentAtom,
  dodgeRateAtom,
  evadeMitigationAtom,
  executionCooldownPctAtom,
  executionReadyAtom,
  isChannelingAtom,
  flashShiftPctAtom,
  flashSpeedBonusPctAtom,
  heatPctAtom,
  hpAtom,
  hpRegenAtom,
  incomingDotAtom,
  laserOverheatedAtom,
  maxHpAtom,
  onHitDamageAtom,
  passivesAtom,
  pendingHealAtom,
  platingAtom,
  playerIdAtom,
  playerNameAtom,
  shieldsAtom,
  speedAtom,
  statusAtom,
  summonActiveCountAtom,
  summonSlotCountAtom,
  summonSlotsAtom,
  targetChillStacksAtom,
  targetDotStacksAtom,
} from '../atoms';

export function StatPanel() {
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
  const flashShiftPct = useAtomValue(flashShiftPctAtom);
  const flashSpeedBonusPct = useAtomValue(flashSpeedBonusPctAtom);
  const laserOverheated = useAtomValue(laserOverheatedAtom);
  const heatPct = useAtomValue(heatPctAtom);
  const ammoMax = useAtomValue(ammoMaxAtom);
  const ammoCount = useAtomValue(ammoCountAtom);
  const cadenceThreshold = useAtomValue(cadenceThresholdAtom);
  const cadenceCount = useAtomValue(cadenceCountAtom);
  const cadenceEmpoweredArmed = useAtomValue(cadenceEmpoweredArmedAtom);
  const executionReady = useAtomValue(executionReadyAtom);
  const executionCooldownPct = useAtomValue(executionCooldownPctAtom);
  const isChanneling = useAtomValue(isChannelingAtom);
  const channelingPct = useAtomValue(channelingPctAtom);
  const empoweredReady = useAtomValue(empoweredReadyAtom);
  const energyCount = useAtomValue(energyCountAtom);
  const energyMax = useAtomValue(energyMaxAtom);
  const attackTargetId = useAtomValue(attackTargetIdAtom);
  const targetDotStacks = useAtomValue(targetDotStacksAtom);
  const targetChillStacks = useAtomValue(targetChillStacksAtom);
  const equipment = useAtomValue(equipmentAtom);
  const dodgeRate = useAtomValue(dodgeRateAtom);
  const evadeMitigation = useAtomValue(evadeMitigationAtom);
  const summonActiveCount = useAtomValue(summonActiveCountAtom);
  const summonSlotCount = useAtomValue(summonSlotCountAtom);
  const summonSlots = useAtomValue(summonSlotsAtom);
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
      flashShiftPct,
      flashSpeedBonusPct,
      laserOverheated,
      heatPct,
      ammoMax,
      ammoCount,
      cadenceThreshold,
      cadenceCount,
      cadenceEmpoweredArmed,
      executionReady,
      executionCooldownPct,
      isChanneling,
      channelingPct,
      empoweredReady,
      energyCount,
      energyMax,
      attackTargetId,
      targetDotStacks,
      targetChillStacks,
      equipment,
      dodgeRate,
      evadeMitigation,
      summonActiveCount,
      summonSlotCount,
      summonSlots,
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

  return (
    <div className="sidebar-panel">
      <div className="panel-title">Character</div>

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
        {player && player.onHitDamage > 0 && (
          <StatRow label="On-Hit Dmg" value={`+${player.onHitDamage}`} help={STAT_HELP.onHitDamage} />
        )}
        <StatRow label="DPS"        value={dps} help={STAT_HELP.dps} />
        {empMult && (
          <StatRow label="Empowered" value={`×${empMult.effective.toFixed(2)}`} help={empMultTip} />
        )}
        <StatRow label="Atk Speed"  value={player ? `${aps} APS (${cdSec}s)` : '—'} help={STAT_HELP.atkSpeed} />
        <StatRow label="Plating"    value={player?.plating   ?? '—'} help={STAT_HELP.plating} />
        {player && player.damageReduction > 0 && (
          <StatRow label="Dmg Reduc." value={`${Math.round(player.damageReduction * 100)}%`} help={STAT_HELP.damageReduction} />
        )}
        <StatRow label="Atk Range"  value={player ? `${player.attackRange}` : '—'} help={STAT_HELP.attackRange} />
        <StatRow label="Move Speed" value={player ? `${player.speed}` : '—'} help={STAT_HELP.speed} />
        <StatRow label="HP Regen"   value={player ? `${player.hpRegen}/s` : '—'} help={STAT_HELP.hpRegen} />
      </div>

      {/* Per-archetype mechanic bars (shared with the mobile HUD) */}
      {player && <ArchetypeMechanics />}

      {/* ── Evasion / passives — always shown; each self-hides when empty ── */}

      {/* Evasion (deterministic — dodge rate + damage avoided per dodge) */}
      {player && player.dodgeRate > 0 && (
        <div className="stat-section">
          <div className="stat-section-title">Evasion</div>
          <StatRow label="Dodge rate" value={`${Math.round(player.dodgeRate * 100)}%`} help={STAT_HELP.dodgeRate} />
          <StatRow label="Damage avoided" value={`${Math.round(player.evadeMitigation * 100)}% per dodge`} help={STAT_HELP.evadeMitigation} />
        </div>
      )}

      {/* Defense passives */}
      {player && <DefensePassivesSection passives={player.passives ?? {}} />}

      {/* Mobility (boot) passives */}
      {player && <MobilityPassivesSection passives={player.passives ?? {}} />}
    </div>
  );
}
