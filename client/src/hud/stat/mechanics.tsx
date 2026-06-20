import type { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import {
  computeDotClassDamagePerStack,
  computeEternalDoomDamage,
  resolveDotClassProfile,
} from '@mmo-idle/shared';
import { CadenceTimeline, StatRow, SummonSlotBar } from './components';
import { useHoverTooltip } from './tooltip';
import {
  ammoCountAtom,
  ammoMaxAtom,
  attackAtom,
  attackTargetIdAtom,
  cadenceCountAtom,
  cadenceEmpoweredArmedAtom,
  cadenceThresholdAtom,
  channelingPctAtom,
  combatArchetypeAtom,
  empoweredReadyAtom,
  energyCountAtom,
  energyMaxAtom,
  executionCooldownPctAtom,
  executionReadyAtom,
  flashShiftPctAtom,
  flashSpeedBonusPctAtom,
  heatPctAtom,
  isChannelingAtom,
  laserOverheatedAtom,
  passivesAtom,
  selectedSubVariantAtom,
  summonActiveCountAtom,
  summonSlotCountAtom,
  summonSlotsAtom,
  targetChillStacksAtom,
  targetDotStacksAtom,
} from '../atoms';

// Freezing Cold: chill stacks needed to trigger the freeze (server CHILL_MAX).
const CHILL_MAX_STACKS = 9;

function DotStatCell({
  label,
  value,
  help,
}: {
  label: string;
  value: string | number;
  help: ReactNode;
}) {
  const { handlers, node } = useHoverTooltip(help);
  return (
    <div className="dot-stat-cell stat-row--help" {...handlers}>
      <span className="dot-stat-label">{label}</span>
      <span className="dot-stat-value">{value}</span>
      {node}
    </div>
  );
}

function DotSummaryValue({
  label,
  value,
  help,
}: {
  label: string;
  value: string | number;
  help: ReactNode;
}) {
  const { handlers, node } = useHoverTooltip(help);
  return (
    <>
      <span className="stat-row--help" {...handlers}>{label}</span>
      <strong className="stat-row--help" {...handlers}>{value}</strong>
      {node}
    </>
  );
}

/**
 * Per-archetype mechanic bars (ammo/heat, summon roster, cadence, execution,
 * energy, dot stacks). Reads atoms directly so it can be dropped into both the
 * desktop StatPanel and the mobile HUD with no prop threading; exactly one
 * archetype block renders at a time. Mobile compaction is handled purely in CSS
 * via a wrapper class.
 */
export function ArchetypeMechanics() {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const passives = useAtomValue(passivesAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const attack = useAtomValue(attackAtom);
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
        const profile = resolveDotClassProfile(p, selectedSubVariant);
        const damagePerStack = computeDotClassDamagePerStack(attack, profile);
        const isPoison = (p['dot.poison-explosion'] ?? 0) > 0
          || (p['dot.eternal-doom'] ?? 0) > 0
          || (p['dot.invigorating-toxins'] ?? 0) > 0;
        const isFire   = (p['dot.fan-the-flames'] ?? 0) > 0
          || (p['dot.smoldering-ember'] ?? 0) > 0
          || (p['dot.conflagration'] ?? 0) > 0;
        const isFrost  = (p['dot.permafrost'] ?? 0) > 0
          || (p['dot.freezing-cold'] ?? 0) > 0
          || (p['dot.glacial-fracture'] ?? 0) > 0;
        const path = isPoison ? 'poison' : isFire ? 'fire' : isFrost ? 'frost' : profile.element;

        const dotMax = (p['dot.poison-explosion'] ?? 0) > 0 ? 10
          : (p['dot.eternal-doom'] ?? 0) > 0 ? 50
          : (p['dot.permafrost'] ?? 0) > 0 ? 1
          : profile.maxStacks;
        const maxTickDamage = (p['dot.eternal-doom'] ?? 0) > 0
          ? computeEternalDoomDamage(dotMax, damagePerStack)
          : damagePerStack * dotMax;
        const maxDotDps = profile.tickIntervalMs > 0
          ? (maxTickDamage * 1000) / profile.tickIntervalMs
          : 0;
        const targetPct = dotMax > 0 ? Math.min(100, (targetDotStacks / dotMax) * 100) : 0;

        const stackLabel = path === 'fire' ? 'Burn Stacks'
          : path === 'frost' ? 'Frost Stacks'
          : path === 'poison' ? 'Poison Stacks'
          : 'Target Stacks';

        const pipClass = ` dot-pip--${path}`;
        const usePips  = dotMax <= 10;
        const directPct = Math.round((1 - profile.conversionPct) * 100);
        const dotPct = Math.round(profile.conversionPct * 100);
        const tickSec = (profile.tickIntervalMs / 1000).toFixed(1);
        const durationSec = (profile.durationMs / 1000).toFixed(1);

        return (
          <div className={`stat-section dot-stat-panel dot-stat-panel--${path}`}>
            <div className="stat-section-title">Damage over time</div>
            <div className="dot-stat-grid">
              <DotStatCell
                label="Direct"
                value={`${directPct}%`}
                help={
                  <>
                    <div>The part of each hit that remains as immediate direct damage after DoT conversion.</div>
                    <div style={{ marginTop: 6 }}>Hit-specific bonuses still affect this direct portion before conversion is applied.</div>
                  </>
                }
              />
              <DotStatCell
                label="DoT"
                value={`${dotPct}%`}
                help={
                  <>
                    <div>The attack share converted into class DoT stack power.</div>
                    <div style={{ marginTop: 6 }}>This is generated from your Attack stat, not from final hit damage, so empowered hits and first-hit multipliers do not inflate DoT stacks.</div>
                  </>
                }
              />
              <DotStatCell
                label="Mult"
                value={`x${profile.dotMechanicMultiplier.toFixed(2)}`}
                help="The DoT class's dedicated mechanic multiplier. It is separate from empowered strike multipliers and only scales class DoT stack value."
              />
              <DotStatCell
                label="Tick"
                value={`${tickSec}s`}
                help="How often active DoT stacks deal damage. Longer tick intervals hit less often but each stack is budgeted with the interval in mind."
              />
              <DotStatCell
                label="Duration"
                value={`${durationSec}s`}
                help="How long stacks last without being refreshed by another qualifying hit. Reapplying the DoT refreshes this timer."
              />
              <DotStatCell
                label="Stack"
                value={`${damagePerStack}/tick`}
                help={
                  <>
                    <div>The per-stack tick value generated from Attack, conversion, tick interval, and the DoT multiplier.</div>
                    <div style={{ marginTop: 6 }}>The actual tick uses the class stack curve, so partial stacks hit harder than simple linear scaling while full stacks equal this value times max stacks.</div>
                  </>
                }
              />
            </div>
            <div className="dot-stat-summary">
              <DotSummaryValue
                label="Max tick"
                value={maxTickDamage}
                help="Estimated tick damage at full stacks before target-side modifiers such as Smoldering Ember, Frozen, mitigation, or special spec exceptions."
              />
              <DotSummaryValue
                label="DoT DPS"
                value={maxDotDps.toFixed(1)}
                help="Estimated sustained DoT damage per second at full stacks. This is max tick damage divided by tick interval and does not include the direct hit portion."
              />
            </div>
            <StatRow
              label={stackLabel}
              value={attackTargetId ? `${targetDotStacks} / ${dotMax}` : 'No target'}
              dim={!attackTargetId}
              help="Current DoT stacks on your active target. This is target state from the server, so it only appears while you have a valid attack target."
            />

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
                  style={{ width: `${targetPct}%` }}
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
    </>
  );
}
