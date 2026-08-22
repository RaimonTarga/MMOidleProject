import { useId, useState } from 'react';
import { useAtomValue } from 'jotai';
import { estimatePlayerDps, resolveEmpoweredMultiplier, riteDef, stanceDef } from '@mmo-idle/shared';
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
  activeStanceAtom,
  autoIntentAtom,
  combatArchetypeAtom,
  damageReductionAtom,
  equipmentAtom,
  equippedRitesAtom,
  dodgeRateAtom,
  evadeMitigationAtom,
  hpAtom,
  recoveryAtom,
  incomingDotAtom,
  maxHpAtom,
  onHitDamageAtom,
  passivesAtom,
  pendingHealAtom,
  partyAtom,
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
  statusAtom,
} from '../atoms';

const CHARACTER_EXPANDED_STORAGE_KEY = 'mmo_idle.desktop.character_expanded';

/**
 * The commissioned stat glyphs (§15 of the UI redesign plan), which are what let
 * this panel drop its word labels. Attack speed is deliberately absent — the set
 * has no glyph for it, so APS rides with DPS in the headline instead of reusing
 * the move-speed glyph and putting two identical icons in one panel.
 */
const STAT_GLYPH = {
  dps: 'UI_icons/stats/dps.png',
  attack: 'UI_icons/stats/attack.png',
  range: 'UI_icons/stats/range.png',
  empowered: 'UI_icons/stats/empowered.png',
  plating: 'UI_icons/stats/plating.png',
  reduction: 'UI_icons/stats/reduction.png',
  regen: 'UI_icons/stats/regen.png',
  speed: 'UI_icons/stats/speed.png',
} as const;

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
  const barrier = useAtomValue(barrierAtom);
  const barrierMax = useAtomValue(barrierMaxAtom);
  const barrierRecharging = useAtomValue(barrierRechargingAtom);
  const wards = useAtomValue(wardsAtom);
  const incomingDot = useAtomValue(incomingDotAtom);
  const pendingHeal = useAtomValue(pendingHealAtom);
  const attack = useAtomValue(attackAtom);
  const onHitDamage = useAtomValue(onHitDamageAtom);
  const plating = useAtomValue(platingAtom);
  const damageReduction = useAtomValue(damageReductionAtom);
  const attackCooldown = useAtomValue(attackCooldownAtom);
  const attackRange = useAtomValue(attackRangeAtom);
  const speed = useAtomValue(speedAtom);
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
  const activeStance = useAtomValue(activeStanceAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const activeStanceName = stanceDef(activeStance)?.name ?? 'No stance';
  const equippedRiteDefs = equippedRites.flatMap((id) => {
    const def = riteDef(id);
    return def ? [def] : [];
  });
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
      plating,
      damageReduction,
      attackCooldown,
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
  const cdSec       = player ? (player.attackCooldown / 1000).toFixed(2) : '—';
  const aps         = player ? (1000 / player.attackCooldown).toFixed(2) : '—';
  // Archetype-aware, because `(attack + on-hit) x APS` is the damage of a
  // character who only auto-attacks — which describes none of the six classes,
  // and actively misreports two of them. See shared/src/systems/dpsEstimate.ts.
  const dpsEstimate = player
    ? estimatePlayerDps({
      attack: player.attack,
      onHitDamage: player.onHitDamage,
      attackCooldownMs: player.attackCooldown,
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
      <div><strong>Estimated</strong> damage per second, worked out from your class mechanic.</div>
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
            stance: activeStanceName,
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
                rider: player.onHitDamage > 0 ? `+${player.onHitDamage}` : undefined,
                name: player.onHitDamage > 0 ? 'Attack (plus on-hit damage)' : 'Attack',
                help: player.onHitDamage > 0 ? (
                  <>
                    <div>{STAT_HELP.attack}</div>
                    <div style={{ marginTop: 6 }}>
                      <strong>+{player.onHitDamage} on-hit.</strong> {STAT_HELP.onHitDamage}
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
                value: String(Math.round(player.recovery * 10) / 10),
                // Recovery is a rate expressed in points, where 1 point = 1% of
                // max HP per second at 100% active Recovery — not raw HP/s.
                unit: '',
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
            <StatRow label="Recovery" value={player ? `${player.recovery}` : '—'} help={STAT_HELP.recovery} />
          </div>

          {player && player.dodgeRate > 0 && (
            <div className="stat-section">
              <div className="stat-section-title">Evasion</div>
              <StatRow label="Dodge rate" value={`${Math.round(player.dodgeRate * 100)}%`} help={STAT_HELP.dodgeRate} />
              <StatRow label="Damage avoided" value={`${Math.round(player.evadeMitigation * 100)}% per dodge`} help={STAT_HELP.evadeMitigation} />
            </div>
          )}
          <div className="stat-section">
            <div className="stat-section-title">Rites</div>
            {equippedRiteDefs.length > 0 ? equippedRiteDefs.map((rite) => (
              <StatRow
                key={rite.id}
                label={rite.name}
                value={`${rite.runeCost} RP`}
                help={rite.blurb}
              />
            )) : (
              <StatRow label="Equipped" value="None" dim />
            )}
          </div>
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
