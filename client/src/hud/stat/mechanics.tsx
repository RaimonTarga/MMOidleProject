import { useAtomValue } from 'jotai';
import { BuffBar, CadenceTimeline, SummonSlotBar } from './components';
import {
  ammoCountAtom,
  ammoMaxAtom,
  attackTargetIdAtom,
  cadenceCountAtom,
  cadenceEmpoweredArmedAtom,
  cadenceThresholdAtom,
  channelingPctAtom,
  combatArchetypeAtom,
  empoweredReadyAtom,
  energyCountAtom,
  energyMaxAtom,
  equipmentAtom,
  executionCooldownPctAtom,
  executionReadyAtom,
  flashShiftPctAtom,
  flashSpeedBonusPctAtom,
  heatPctAtom,
  isChannelingAtom,
  laserOverheatedAtom,
  passivesAtom,
  sacredBuffActiveAtom,
  sacredBuffPctAtom,
  summonActiveCountAtom,
  summonSlotCountAtom,
  summonSlotsAtom,
  targetChillStacksAtom,
  targetDotStacksAtom,
} from '../atoms';

// Freezing Cold: chill stacks needed to trigger the freeze (server CHILL_MAX).
const CHILL_MAX_STACKS = 9;

/**
 * Per-archetype mechanic bars (ammo/heat, summon roster, cadence, execution,
 * energy, dot stacks, sacred buff). Reads atoms directly so it can be dropped
 * into both the desktop StatPanel and the mobile HUD with no prop threading;
 * exactly one archetype block renders at a time (plus the weapon-gated Sacred
 * Cross bar). Mobile compaction is handled purely in CSS via a wrapper class.
 */
export function ArchetypeMechanics() {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const passives = useAtomValue(passivesAtom);
  const laserOverheated = useAtomValue(laserOverheatedAtom);
  const heatPct = useAtomValue(heatPctAtom);
  const ammoMax = useAtomValue(ammoMaxAtom);
  const ammoCount = useAtomValue(ammoCountAtom);
  const summonSlotCount = useAtomValue(summonSlotCountAtom);
  const summonActiveCount = useAtomValue(summonActiveCountAtom);
  const summonSlots = useAtomValue(summonSlotsAtom);
  const cadenceThreshold = useAtomValue(cadenceThresholdAtom);
  const cadenceCount = useAtomValue(cadenceCountAtom);
  const cadenceEmpoweredArmed = useAtomValue(cadenceEmpoweredArmedAtom);
  const isChanneling = useAtomValue(isChannelingAtom);
  const channelingPct = useAtomValue(channelingPctAtom);
  const executionReady = useAtomValue(executionReadyAtom);
  const executionCooldownPct = useAtomValue(executionCooldownPctAtom);
  const energyCount = useAtomValue(energyCountAtom);
  const energyMax = useAtomValue(energyMaxAtom);
  const empoweredReady = useAtomValue(empoweredReadyAtom);
  const flashShiftPct = useAtomValue(flashShiftPctAtom);
  const flashSpeedBonusPct = useAtomValue(flashSpeedBonusPctAtom);
  const attackTargetId = useAtomValue(attackTargetIdAtom);
  const targetDotStacks = useAtomValue(targetDotStacksAtom);
  const targetChillStacks = useAtomValue(targetChillStacksAtom);
  const equipment = useAtomValue(equipmentAtom);
  const sacredBuffPct = useAtomValue(sacredBuffPctAtom);
  const sacredBuffActive = useAtomValue(sacredBuffActiveAtom);

  const isFlash = (passives['energy.flash'] ?? 0) > 0;
  const flashShiftLabel = flashShiftPct >= 50 ? 'Red Shift' : 'Blue Shift';
  const flashShiftColor = `rgb(${Math.round(70 + flashShiftPct * 1.85)}, ${Math.round(130 - flashShiftPct * 0.65)}, ${Math.round(255 - flashShiftPct * 1.95)})`;

  return (
    <>
      {/* Ammo / Heat bar — reload archetype */}
      {combatArchetype === 'reload' && (passives['reload.laser'] ?? 0) > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Heat</span>
            <span className={`stat-value${laserOverheated ? ' mech-label--empowered' : ''}`}>
              {laserOverheated ? `OVERHEAT - Cooling (${heatPct}%)` : `${heatPct}%`}
            </span>
          </div>
          <div className="ammo-bar-track">
            <div
              className={`ammo-bar-fill ammo-bar-fill--heat${laserOverheated ? ' ammo-bar-fill--overheated' : ''}`}
              style={{ width: `${heatPct}%` }}
            />
          </div>
        </div>
      )}

      {combatArchetype === 'reload' && (passives['reload.laser'] ?? 0) <= 0 && ammoMax > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Ammo</span>
            <span className="stat-value">
              {ammoCount === 0 ? 'Reloading…' : `${ammoCount} / ${ammoMax}`}
            </span>
          </div>
          <div className="ammo-bar-track">
            <div
              className={`ammo-bar-fill${ammoCount === 0 ? ' ammo-bar-fill--reloading' : ''}`}
              style={{ width: `${(ammoCount / ammoMax) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Summon roster — summoner archetype */}
      {combatArchetype === 'summoner' && summonSlotCount > 0 && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">Summons</span>
            <span className="stat-value">
              {summonActiveCount} / {summonSlotCount} active
            </span>
          </div>
          <SummonSlotBar slots={summonSlots} />
        </div>
      )}

      {/* Cadence hit timeline */}
      {combatArchetype === 'cadence' && cadenceThreshold > 0 && (
        <div className="stat-section">
          <span className="stat-label">Cadence</span>
          <CadenceTimeline count={cadenceCount} threshold={cadenceThreshold} armed={cadenceEmpoweredArmed} />
        </div>
      )}

      {/* Execution bar — cooldown archetype. While the Devout Priest channels, the
          same bar drains to show the beam's leftover duration instead of the
          execution cooldown. */}
      {combatArchetype === 'cooldown' && (
        isChanneling ? (() => {
          const remainingPct = Math.max(0, 100 - channelingPct);
          return (
            <div className="stat-section">
              <div className="stat-row">
                <span className="stat-label">Channel</span>
                <span className="stat-value mech-label--empowered">
                  BEAM {(remainingPct / 100 * 3).toFixed(1)}s
                </span>
              </div>
              <div className="mech-bar-track">
                <div
                  className="mech-bar-fill mech-bar-fill--cooldown mech-bar-fill--ready"
                  style={{ width: `${remainingPct}%` }}
                />
              </div>
            </div>
          );
        })() : (
          <div className="stat-section">
            <div className="stat-row">
              <span className="stat-label">Execution</span>
              <span className={`stat-value${executionReady ? ' mech-label--ready' : ''}`}>
                {executionReady ? 'READY' : `${executionCooldownPct}%`}
              </span>
            </div>
            <div className="mech-bar-track">
              <div
                className={`mech-bar-fill mech-bar-fill--cooldown${executionReady ? ' mech-bar-fill--ready' : ''}`}
                style={{ width: `${executionCooldownPct}%` }}
              />
            </div>
          </div>
        )
      )}

      {/* Energy bar — energy archetype */}
      {combatArchetype === 'energy' && (
        <div className="stat-section">
          <div className="stat-row">
            <span className="stat-label">{isFlash ? flashShiftLabel : 'Energy'}</span>
            <span
              className={`stat-value${empoweredReady && !isFlash ? ' mech-label--empowered' : ''}`}
              style={isFlash ? { color: flashShiftColor } : undefined}
            >
              {isFlash
                ? `${Math.round(energyCount)} / ${energyMax}`
                : empoweredReady ? 'EMPOWERED' : `${Math.round(energyCount)} / ${energyMax}`}
            </span>
          </div>
          <div className="mech-bar-track">
            <div
              className={`mech-bar-fill mech-bar-fill--energy${empoweredReady && !isFlash ? ' mech-bar-fill--empowered' : ''}`}
              style={isFlash
                ? {
                  width: `${flashShiftPct}%`,
                  background: 'linear-gradient(90deg, #4488ff 0%, #aa88ff 50%, #ff4433 100%)',
                  boxShadow: `0 0 ${6 + flashSpeedBonusPct / 2}px ${flashShiftColor}`,
                }
                : { width: `${empoweredReady ? 100 : (energyMax > 0 ? (energyCount / energyMax) * 100 : 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* DoT stacks — dot archetype, path-aware */}
      {combatArchetype === 'dot' && (() => {
        const p = passives ?? {};
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

        const dotMax = (p['dot.poison-explosion'] ?? 0) > 0 ? 10
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
              <span className={`stat-value${!attackTargetId ? ' dim' : ''}`}>
                {attackTargetId ? `${targetDotStacks} / ${dotMax}` : 'No target'}
              </span>
            </div>

            {usePips ? (
              <div className="dot-pips">
                {Array.from({ length: dotMax }, (_, i) => (
                  <div
                    key={i}
                    className={`dot-pip${pipClass}${i < targetDotStacks ? ` dot-pip--active${pipClass}` : ''}`}
                  />
                ))}
              </div>
            ) : (
              <div className="dot-stack-bar-track">
                <div
                  className={`dot-stack-bar-fill dot-stack-bar-fill--${path}`}
                  style={{ width: `${Math.min(100, (targetDotStacks / dotMax) * 100)}%` }}
                />
              </div>
            )}

            {/* Frost path — chill stacks + frozen indicator (9 stacks → freeze) */}
            {isFrost && (p['dot.freezing-cold'] ?? 0) > 0 && (
              <>
                <div className="stat-row" style={{ marginTop: 6 }}>
                  <span className="stat-label">Chill</span>
                  <span className="stat-value">
                    {attackTargetId ? `${targetChillStacks ?? 0} / ${CHILL_MAX_STACKS}` : '—'}
                  </span>
                </div>
                <div className="chill-pips">
                  {Array.from({ length: CHILL_MAX_STACKS }, (_, i) => (
                    <div
                      key={i}
                      className={`chill-pip${i < (targetChillStacks ?? 0) ? ' chill-pip--active' : ''}`}
                    />
                  ))}
                </div>
                {(targetChillStacks ?? 0) >= CHILL_MAX_STACKS && (
                  <div className="chill-frozen-label">— FROZEN —</div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Sacred Cross weapon buff bar */}
      {equipment.weapon === 'sacred-cross' && (
        <BuffBar
          label="Sacred Burst"
          pct={sacredBuffPct}
          active={sacredBuffActive}
          activeLabel="BURST!"
          variant="sacred"
        />
      )}
    </>
  );
}
