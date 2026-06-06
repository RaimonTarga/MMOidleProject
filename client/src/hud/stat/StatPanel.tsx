import { useAtomValue } from 'jotai';
import { BuffBar, CadenceTimeline, DefensePassivesSection, MobilityPassivesSection, StatRow, SummonSlotBar } from './components';
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
  combatArchetypeAtom,
  damageReductionAtom,
  energyCountAtom,
  empoweredReadyAtom,
  equipmentAtom,
  dodgeRateAtom,
  evadeMitigationAtom,
  executionCooldownPctAtom,
  executionReadyAtom,
  flashShiftPctAtom,
  flashSpeedBonusPctAtom,
  heatPctAtom,
  hpAtom,
  hpRegenAtom,
  incomingDotAtom,
  laserOverheatedAtom,
  maxHpAtom,
  passivesAtom,
  pendingHealAtom,
  platingAtom,
  playerIdAtom,
  playerNameAtom,
  sacredBuffActiveAtom,
  sacredBuffPctAtom,
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
  const empoweredReady = useAtomValue(empoweredReadyAtom);
  const energyCount = useAtomValue(energyCountAtom);
  const attackTargetId = useAtomValue(attackTargetIdAtom);
  const targetDotStacks = useAtomValue(targetDotStacksAtom);
  const targetChillStacks = useAtomValue(targetChillStacksAtom);
  const equipment = useAtomValue(equipmentAtom);
  const sacredBuffPct = useAtomValue(sacredBuffPctAtom);
  const sacredBuffActive = useAtomValue(sacredBuffActiveAtom);
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
      empoweredReady,
      energyCount,
      attackTargetId,
      targetDotStacks,
      targetChillStacks,
      equipment,
      sacredBuffPct,
      sacredBuffActive,
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
  const dps         = player ? (player.attack * (1000 / player.attackCooldown)).toFixed(1) : '—';
  const isFlash     = player ? (player.passives['energy.flash'] ?? 0) > 0 : false;
  const flashShiftLabel = player && player.flashShiftPct >= 50 ? 'Red Shift' : 'Blue Shift';
  const flashShiftColor = player
    ? `rgb(${Math.round(70 + player.flashShiftPct * 1.85)}, ${Math.round(130 - player.flashShiftPct * 0.65)}, ${Math.round(255 - player.flashShiftPct * 1.95)})`
    : '#66aaff';

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
        <StatRow label="DPS"        value={dps} help={STAT_HELP.dps} />
        <StatRow label="Atk Speed"  value={player ? `${aps} APS (${cdSec}s)` : '—'} help={STAT_HELP.atkSpeed} />
        <StatRow label="Plating"    value={player?.plating   ?? '—'} help={STAT_HELP.plating} />
        {player && player.damageReduction > 0 && (
          <StatRow label="Dmg Reduc." value={`${Math.round(player.damageReduction * 100)}%`} help={STAT_HELP.damageReduction} />
        )}
        <StatRow label="Atk Range"  value={player ? `${player.attackRange}` : '—'} help={STAT_HELP.attackRange} />
        <StatRow label="Move Speed" value={player ? `${player.speed}` : '—'} help={STAT_HELP.speed} />
        <StatRow label="HP Regen"   value={player ? `${player.hpRegen}/s` : '—'} help={STAT_HELP.hpRegen} />
      </div>

      {/* Ammo / Heat bar — reload archetype */}
      {player?.combatArchetype === 'reload' && (player.passives['reload.laser'] ?? 0) > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Heat</span>
            <span className={`stat-value${player.laserOverheated ? ' mech-label--empowered' : ''}`}>
              {player.laserOverheated ? `OVERHEAT - Cooling (${player.heatPct}%)` : `${player.heatPct}%`}
            </span>
          </div>
          <div className="ammo-bar-track">
            <div
              className={`ammo-bar-fill ammo-bar-fill--heat${player.laserOverheated ? ' ammo-bar-fill--overheated' : ''}`}
              style={{ width: `${player.heatPct}%` }}
            />
          </div>
        </div>
      )}

      {player?.combatArchetype === 'reload' && (player.passives['reload.laser'] ?? 0) <= 0 && player.ammoMax > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Ammo</span>
            <span className="stat-value">
              {player.ammoCount === 0 ? 'Reloading…' : `${player.ammoCount} / ${player.ammoMax}`}
            </span>
          </div>
          <div className="ammo-bar-track">
            <div
              className={`ammo-bar-fill${player.ammoCount === 0 ? ' ammo-bar-fill--reloading' : ''}`}
              style={{ width: `${(player.ammoCount / player.ammoMax) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Summon roster — summoner archetype */}
      {player?.combatArchetype === 'summoner' && player.summonSlotCount > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Summons</span>
            <span className="stat-value">
              {player.summonActiveCount} / {player.summonSlotCount} active
            </span>
          </div>
          <SummonSlotBar slots={player.summonSlots} />
        </div>
      )}

      {/* Cadence hit timeline */}
      {player?.combatArchetype === 'cadence' && player.cadenceThreshold > 0 && (
        <div className="stat-section">
          <span className="stat-label">Cadence</span>
          <CadenceTimeline count={player.cadenceCount} threshold={player.cadenceThreshold} armed={player.cadenceEmpoweredArmed} />
        </div>
      )}

      {/* Execution bar — cooldown archetype */}
      {player?.combatArchetype === 'cooldown' && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Execution</span>
            <span className={`stat-value${player.executionReady ? ' mech-label--ready' : ''}`}>
              {player.executionReady ? 'READY' : `${player.executionCooldownPct}%`}
            </span>
          </div>
          <div className="mech-bar-track">
            <div
              className={`mech-bar-fill mech-bar-fill--cooldown${player.executionReady ? ' mech-bar-fill--ready' : ''}`}
              style={{ width: `${player.executionCooldownPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Energy bar — energy archetype */}
      {player?.combatArchetype === 'energy' && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">{isFlash ? flashShiftLabel : 'Energy'}</span>
            <span
              className={`stat-value${player.empoweredReady && !isFlash ? ' mech-label--empowered' : ''}`}
              style={isFlash ? { color: flashShiftColor } : undefined}
            >
              {isFlash
                ? `${Math.round(player.energyCount)} / 100`
                : player.empoweredReady ? 'EMPOWERED' : `${player.energyCount} / 100`}
            </span>
          </div>
          <div className="mech-bar-track">
            <div
              className={`mech-bar-fill mech-bar-fill--energy${player.empoweredReady && !isFlash ? ' mech-bar-fill--empowered' : ''}`}
              style={isFlash
                ? {
                  width: `${player.flashShiftPct}%`,
                  background: 'linear-gradient(90deg, #4488ff 0%, #aa88ff 50%, #ff4433 100%)',
                  boxShadow: `0 0 ${6 + player.flashSpeedBonusPct / 2}px ${flashShiftColor}`,
                }
                : { width: `${player.empoweredReady ? 100 : player.energyCount}%` }}
            />
          </div>
        </div>
      )}

      {/* DoT stacks — dot archetype, path-aware */}
      {player?.combatArchetype === 'dot' && (() => {
        const p = player.passives ?? {};
        const isPoison = (p['dot.poison-explosion'] ?? 0) > 0
          || (p['dot.eternal-doom'] ?? 0) > 0
          || (p['dot.invigorating-toxins'] ?? 0) > 0;
        const isFire   = (p['dot.fan-the-flames'] ?? 0) > 0
          || (p['dot.smoldering-ember'] ?? 0) > 0
          || (p['dot.conflagration'] ?? 0) > 0;
        const isFrost  = (p['dot.permafrost'] ?? 0) > 0
          || (p['dot.freezing-cold'] ?? 0) > 0
          || (p['dot.glacial-fracture'] ?? 0) > 0;
        const path = isPoison ? 'poison' : isFire ? 'fire' : isFrost ? 'frost' : 'default';

        const dotMax = (p['dot.poison-explosion'] ?? 0) > 0 ? 20
          : (p['dot.eternal-doom'] ?? 0) > 0 ? 50
          : (p['dot.conflagration'] ?? 0) > 0 ? 8
          : (p['dot.permafrost'] ?? 0) > 0 ? 1
          : Math.round(p['dot.max-stacks'] ?? 5);

        const stackLabel = isFire ? 'Burn Stacks'
          : isFrost ? 'Frost Stacks'
          : isPoison ? 'Poison Stacks'
          : 'Target Stacks';

        const pipClass = path !== 'default' ? ` dot-pip--${path}` : '';
        const usePips  = dotMax <= 10;

        return (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">{stackLabel}</span>
              <span className={`stat-value${!player.attackTargetId ? ' dim' : ''}`}>
                {player.attackTargetId ? `${player.targetDotStacks} / ${dotMax}` : 'No target'}
              </span>
            </div>

            {usePips ? (
              <div className="dot-pips">
                {Array.from({ length: dotMax }, (_, i) => (
                  <div
                    key={i}
                    className={`dot-pip${pipClass}${i < player.targetDotStacks ? ` dot-pip--active${pipClass}` : ''}`}
                  />
                ))}
              </div>
            ) : (
              <div className="dot-stack-bar-track">
                <div
                  className={`dot-stack-bar-fill dot-stack-bar-fill--${path}`}
                  style={{ width: `${Math.min(100, (player.targetDotStacks / dotMax) * 100)}%` }}
                />
              </div>
            )}

            {/* Frost path — chill stacks + frozen indicator */}
            {isFrost && (p['dot.freezing-cold'] ?? 0) > 0 && (
              <>
                <div className="stat-row" style={{ marginTop: 6 }}>
                  <span className="stat-label">Chill</span>
                  <span className="stat-value">
                    {player.attackTargetId ? `${player.targetChillStacks ?? 0} / 3` : '—'}
                  </span>
                </div>
                <div className="chill-pips">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`chill-pip${i < (player.targetChillStacks ?? 0) ? ' chill-pip--active' : ''}`}
                    />
                  ))}
                </div>
                {(player.targetChillStacks ?? 0) >= 3 && (
                  <div className="chill-frozen-label">— FROZEN —</div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Sacred Cross weapon buff bar */}
      {player?.equipment.weapon === 'sacred-cross' && (
        <BuffBar
          label="Sacred Burst"
          pct={player.sacredBuffPct}
          active={player.sacredBuffActive}
          activeLabel="BURST!"
          variant="sacred"
        />
      )}

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
