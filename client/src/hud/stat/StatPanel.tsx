import { useAtomValue } from 'jotai';
import { estimatePlayerDps, formatRecoveryRate, playerMoveSpeedMult, resolveEmpoweredMultiplier, resolveOnHitDamage } from '@mmo-idle/shared';
import { ArchetypeMechanics } from './mechanics';
import { useHoverTooltip } from './tooltip';
import { STAT_HELP } from './statHelp';
import { StatPlate } from './StatPlate';
import { HudPanel } from '../primitives';
import { useIsMobile } from '../useIsMobile';
import { BuffBar } from '../BuffBar';
import { togglePrimaryOverlay } from '../../input/overlayStack';
import { statIconSource } from '../../ui/systemIcons';
import {
  attackAtom,
  attackCooldownAtom,
  attackCadenceMultAtom,
  finalDamageDealtMultAtom,
  attackRangeAtom,
  combatArchetypeAtom,
  damageReductionAtom,
  equipmentAtom,
  dodgeRateAtom,
  evadeMitigationAtom,
  hpAtom,
  recoveryAtom,
  incomingDotAtom,
  maxHpAtom,
  onHitDamageAtom,
  onHitDamageBonusAtom,
  passivesAtom,
  pendingHealAtom,
  platingAtom,
  playerIdAtom,
  playerNameAtom,
  playerTierAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
  barrierAtom,
  barrierMaxAtom,
  barrierRechargingAtom,
  wardsAtom,
  summonActiveCountAtom,
  unlockedSkillsAtom,
  speedAtom,
  activeBuffsAtom,
  statusAtom,
} from '../atoms';

/**
 * The commissioned stat glyphs (§15 of the UI redesign plan), which are what let
 * this panel drop its word labels. Attack speed is deliberately absent — the set
 * has no glyph for it, so APS rides with DPS in the headline instead of reusing
 * the move-speed glyph and putting two identical icons in one panel.
 */
const STAT_GLYPH = {
  dps: statIconSource('dps'),
  attack: statIconSource('attack'),
  range: statIconSource('range'),
  empowered: statIconSource('empowered'),
  plating: statIconSource('plating'),
  reduction: statIconSource('reduction'),
  regen: statIconSource('regen'),
  speed: statIconSource('speed'),
};

/**
 * What sits beside the HP bar on desktop (design §26.4): the player's statuses
 * as a small row. The phone draws its own (the field's bottom-left).
 */
function BesideHp() {
  return (
    <div className="stat-crown__beside">
      <BuffBar placement="rail" />
    </div>
  );
}

export function StatPanel() {
  const isMobile = useIsMobile();
  const hpTip = useHoverTooltip(STAT_HELP.hp);
  const playerId = useAtomValue(playerIdAtom);
  const status = useAtomValue(statusAtom);
  const name = useAtomValue(playerNameAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const barrier = useAtomValue(barrierAtom);
  const barrierMax = useAtomValue(barrierMaxAtom);
  const barrierRecharging = useAtomValue(barrierRechargingAtom);
  const wards = useAtomValue(wardsAtom);
  const incomingDot = useAtomValue(incomingDotAtom);
  const pendingHeal = useAtomValue(pendingHealAtom);
  const attack = useAtomValue(attackAtom);
  const onHitDamage = useAtomValue(onHitDamageAtom);
  const onHitDamageBonus = useAtomValue(onHitDamageBonusAtom);
  const plating = useAtomValue(platingAtom);
  const damageReduction = useAtomValue(damageReductionAtom);
  const attackCooldown = useAtomValue(attackCooldownAtom);
  const attackCadenceMult = useAtomValue(attackCadenceMultAtom);
  const finalDamageDealtMult = useAtomValue(finalDamageDealtMultAtom);
  const attackRange = useAtomValue(attackRangeAtom);
  const baseSpeed = useAtomValue(speedAtom);
  const activeBuffs = useAtomValue(activeBuffsAtom);
  const speed = Math.round(baseSpeed * playerMoveSpeedMult(activeBuffs.map(buff => buff.speedMult ?? 1)));
  const recovery = useAtomValue(recoveryAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const passives = useAtomValue(passivesAtom);
  const equipment = useAtomValue(equipmentAtom);
  const dodgeRate = useAtomValue(dodgeRateAtom);
  const evadeMitigation = useAtomValue(evadeMitigationAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const summonActiveCount = useAtomValue(summonActiveCountAtom);
  const player = playerId
    ? {
      name,
      hp,
      maxHp,
      barrier,
      barrierMax,
      barrierRecharging,
      wards,
      incomingDot,
      pendingHeal,
      attack,
      onHitDamage,
      onHitDamageBonus,
      plating,
      damageReduction,
      attackCooldown,
      attackCadenceMult,
      attackRange,
      speed,
      recovery,
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
  const totalWard   = player?.wards.reduce((s, w) => s + w.amount, 0) ?? 0;
  // Absorb layering is the plate's own job (StatPlate draws the capping band and
  // the barrier's dedicated conduit); the panel only forwards the raw numbers.
  // HP-bar layers (all as % of maxHp): pending DoT eats the right edge of current
  // HP (red); pending regen extends past current HP (dark green).
  const dotPct      = player && maxHpVal > 0 ? Math.min(hpPct, (player.incomingDot / maxHpVal) * 100) : 0;
  const safePct     = Math.max(0, hpPct - dotPct);
  const healPct     = player && maxHpVal > 0 ? Math.min(100 - hpPct, (player.pendingHeal / maxHpVal) * 100) : 0;
  // EFFECTIVE cadence, not base. Temporary haste/slow (Frenzy, the stance
  // windows, frost/ambient ramps) is applied as a multiplier at the server's
  // cadence gate and never written into `attackCooldown` — so reading the raw
  // stat here showed a number that never moved, and every one of those effects
  // looked like it did nothing at all.
  const cadenceMult = player ? (player.attackCadenceMult || 1) : 1;
  const effectiveCd = player ? player.attackCooldown * cadenceMult : 0;
  const cdSec       = player ? (effectiveCd / 1000).toFixed(2) : '—';
  const aps         = player ? (1000 / effectiveCd).toFixed(2) : '—';
  // Only worth calling out when something is actually modifying it. A tiny
  // epsilon rather than `!== 1` so float noise never renders a "+0%" tag.
  const hasted      = cadenceMult < 0.999;
  const slowed      = cadenceMult > 1.001;
  const cadenceTag  = hasted || slowed
    ? `${hasted ? '+' : '−'}${Math.round(Math.abs(1 / cadenceMult - 1) * 100)}%`
    : null;
  const baseAps     = player ? (1000 / player.attackCooldown).toFixed(2) : '—';
  // Imbue Lightning's charge bonus folds into the same onHitDamage term as gear
  // (combat.ts) but never touches `dealsDamage.onHitDamage` itself, so it needs
  // the same "show the boosted number, tag it as temporary" treatment as the
  // cadence multiplier above or it looks inert while the window is open.
  const effectiveOnHit = player ? resolveOnHitDamage(player.onHitDamage + player.onHitDamageBonus, passives) : 0;
  const onHitBonusTag  = player && player.onHitDamageBonus > 0 ? `+${resolveOnHitDamage(player.onHitDamageBonus, passives)} imbued` : null;
  // Archetype-aware, because `(attack + on-hit) x APS` is the damage of a
  // character who only auto-attacks — which describes none of the six classes,
  // and actively misreports two of them. See shared/src/systems/dpsEstimate.ts.
  const dpsEstimate = player
    ? estimatePlayerDps({ finalDamageDealtMult,
      attack: player.attack,
      onHitDamage: player.onHitDamage,
      attackCooldownMs: player.attackCooldown,
      weaponId: player.equipment.weapon,
      archetype: player.combatArchetype,
      passives: player.passives,
      selectedSubVariant,
      playerTier,
      summoner: player.combatArchetype === 'summoner'
        ? {
          activeCount: summonActiveCount,
          profileInput: { selectedSubVariant, selectedRange, unlockedSkills, passives: player.passives },
        }
        : undefined,
      // `cannotAttack` is deliberately not passed: the estimator derives it from
      // the same inputs the server does, so the panel cannot disagree with the
      // simulation about whether this build is allowed to swing.
    })
    : null;
  const dpsValue    = dpsEstimate?.total ?? 0;
  // One decimal is real information at 12.4 DPS and noise at 1284.3, and this is
  // the plate's headline — so the precision follows the magnitude.
  const dps         = player ? (dpsValue >= 100 ? String(Math.round(dpsValue)) : dpsValue.toFixed(1)) : '—';
  const dpsTip      = dpsEstimate ? (
    <>
      <div><strong>Estimated sustained</strong> damage per second, worked out from your class mechanic.</div>
      <div style={{ marginTop: 6 }}>
        {dpsEstimate.parts.map((part) => (
          <div key={part.label}>{part.label}: {part.dps}</div>
        ))}
        <div style={{ marginTop: 3 }}>= {dpsEstimate.total} total</div>
      </div>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        This is a planning number, not a measurement. It cannot see everything a
        real fight does:
        <ul style={{ margin: '3px 0 0', paddingLeft: 14 }}>
          {dpsEstimate.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
        </ul>
      </div>
    </>
  ) : undefined;
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
    <HudPanel className="sidebar-panel character-panel">
      {/* Design §26.4: nothing expands on the left any more. The detailed,
          sourced sheet is the Stats panel; the title opens it. */}
      <button
        type="button"
        className="disclosure-header panel-title panel-title--collapsible"
        aria-label="Open the Stats panel"
        onClick={() => togglePrimaryOverlay('stats')}
      >
        <span className="disclosure-header__title">Character</span>
        <span className="disclosure-header__summary">
          <span>Stats</span>
          <span className="disclosure-header__chevron" aria-hidden="true">▶</span>
        </span>
      </button>

      {/* One engraved plate for the whole readout. Each figure labels itself,
          and a bar appears only where the value has a real 0-100% ceiling. */}
      {player && (
        <StatPlate
          crown={{
            name: player.name ?? '—',
            status,
            hp: player.hp,
            maxHp: player.maxHp,
            barrier: player.barrier,
            barrierMax: player.barrierMax,
            barrierRecharging: player.barrierRecharging,
            ward: totalWard,
            incomingDot: player.incomingDot,
            pendingHeal: player.pendingHeal,
            hpTip,
            beside: isMobile ? undefined : <BesideHp />,
          }}
          // DPS is the headline because it is the one stat that already folds the
          // others together, and APS rides with it rather than taking a cell:
          // it is DPS's own denominator, so side by side they explain each other.
          // (It is also the one stat with no commissioned glyph — §15's set has
          // ten and attack speed is not among them. Pairing it here means the
          // panel never has to reuse the move-speed glyph and show two identical
          // icons meaning different things.)
          headline={{
            id: 'dps',
            glyph: STAT_GLYPH.dps,
            value: dps,
            sub: `${aps}/s`,
            label: 'DPS',
            name: 'Damage per second',
            help: dpsTip,
            watch: Math.round(dpsValue),
          }}
          // Two rails: what you do to them, then what happens to you. Grouping
          // is the design — a rail reads as one object, which is the job the
          // previous flat grid of nine equal cells could not do at any sort order.
          rails={[
            [
              {
                id: 'attack',
                glyph: STAT_GLYPH.attack,
                value: String(player.attack),
                // On-hit is flat damage added after mitigation, so it belongs to
                // the attack figure rather than to a cell of its own — which also
                // spares it a glyph the commissioned set does not contain.
                rider: effectiveOnHit > 0 ? `+${effectiveOnHit}` : undefined,
                name: effectiveOnHit > 0 ? 'Attack (plus on-hit damage)' : 'Attack',
                help: effectiveOnHit > 0 ? (
                  <>
                    <div>{STAT_HELP.attack}</div>
                    <div style={{ marginTop: 6 }}>
                      <strong>+{effectiveOnHit} on-hit{onHitBonusTag ? ` (${onHitBonusTag})` : ''}.</strong> {STAT_HELP.onHitDamage}
                    </div>
                  </>
                ) : STAT_HELP.attack,
                watch: player.attack,
              },
              {
                id: 'range',
                glyph: STAT_GLYPH.range,
                value: String(player.attackRange),
                name: 'Attack range',
                help: STAT_HELP.attackRange,
                watch: player.attackRange,
              },
              ...(empMult
                ? [{
                  id: 'empowered',
                  glyph: STAT_GLYPH.empowered,
                  value: `×${empMult.effective.toFixed(2)}`,
                  name: 'Empowered attack multiplier',
                  help: empMultTip,
                  watch: empMult.effective,
                }]
                : []),
            ],
            [
              {
                id: 'plating',
                glyph: STAT_GLYPH.plating,
                value: String(player.plating),
                name: 'Plating',
                help: STAT_HELP.plating,
                watch: player.plating,
              },
              // Always present, including at 0%. See the note on StatPlate.
              {
                id: 'reduction',
                glyph: STAT_GLYPH.reduction,
                value: `${Math.round(player.damageReduction * 100)}%`,
                name: 'Damage reduction',
                help: STAT_HELP.damageReduction,
                watch: Math.round(player.damageReduction * 100),
              },
              {
                id: 'regen',
                glyph: STAT_GLYPH.regen,
                value: formatRecoveryRate(player.recovery),
                // Recovery is a flat rate: 1 point = 1 HP per second at 100%
                // active Recovery (Phase 0b). It no longer scales with max HP.
                unit: 'HP/s',
                name: 'Recovery',
                help: STAT_HELP.recovery,
                watch: player.recovery,
              },
              {
                id: 'speed',
                glyph: STAT_GLYPH.speed,
                value: String(player.speed),
                name: 'Move speed',
                help: STAT_HELP.speed,
                watch: player.speed,
              },
            ],
          ]}
        />
      )}

      {/* Per-archetype mechanic bars (shared with the mobile HUD) */}
      {player && <ArchetypeMechanics compact={isMobile} />}


    </HudPanel>
  );
}
