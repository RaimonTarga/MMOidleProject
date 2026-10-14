import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import type {
  EssenceType,
  MonsterDefinition,
} from '@mmo-idle/shared';
import {
  NODE_BIOMES, BIOME_DATABASE, MONSTER_DATABASE, ESSENCE_COLORS, ESSENCE_LABELS,
  essenceLabel,
  coreEligibilityLabel, isRestrictedCore,
  relicRatingsFromPassives, relicRatingsFromEffects, resolveRelicComparison,
  FAMILY_DATABASE, blendEntries, nodeFamily, nodeSpawnBlend,
  biomeLevelCap, biomeXpForBiomeLevel, formatNodeCoord, formatRespawnRemaining, nodeIdToCoord,
  WORLD_REGIONS,
} from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  biomeXPAtom,
  bossFelledByNodeAtom,
  combatArchetypeAtom,
  playerTierAtom,
  selectedSubVariantAtom, selectedRangeAtom, unlockedSkillsAtom,
} from '../../hud/atoms';
import { hudBus } from '../../hudBus';
import { DEV_TOOLS_ENABLED } from '../../devTools';
import { dungeonBadgeLabel, hexDot, isNodeCharted, tileColor } from './constants';
import { AreaDangerLabel } from '../../hud/AreaInformation';
import { bfsPath } from './pathing';
import { useMapClock } from './useMapClock';
import { BiomeIcon } from './BiomeIcon';
import {
  formatMonsterMechanics,
  monsterQuickStats,
  monsterStatRows,
  monsterTags,
} from './monsterInfo';
import {
  statEntries,
  formatMechanicEffects,
  formatResolvedRelicProfile,
  formatWeaponEffects,
} from '../crafting/itemDisplay';
import { MAKE_KIND_LABELS } from '../crafting/makeEntries';
import { DetailLines } from '../describe/DetailLines';
import { loadoutLinesFor } from '../describe';
import { useAbilityContext } from '../describe/useAbilityContext';
import type { AbilityContext } from '../describe';
import { biomeUnlocksByLevel, type BiomeUnlock } from './biomeUnlocks';

interface NodeInfoProps {
  nodeId: string;
  playerNodeId: string | null;
  onClose: () => void;
}

// ── Expandable monster row ──────────────────────────────────────────────────────
function MonsterRow({ m, isBoss, open, onToggle }: {
  m: MonsterDefinition;
  isBoss: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const tags  = monsterTags(m);
  const lines = formatMonsterMechanics(m);
  const quick = monsterQuickStats(m);
  return (
    <div className={`map-monster${isBoss ? ' map-monster--boss' : ''}${open ? ' map-monster--open' : ''}`}>
      <button className="map-monster__row" onClick={onToggle}>
        <span className="map-monster__chevron">{open ? '▾' : '▸'}</span>
        <span className="map-monster-dot" style={{ background: hexDot(m.color) }} />
        <span className={`map-monster-name${isBoss ? ' map-monster-name--boss' : ''}`}>{m.name}</span>
        <span className="map-monster__quick">
          HP {quick.hp} · ATK{' '}
          <span className={quick.attackDirection ? `map-stat-delta--${quick.attackDirection}` : ''}>
            {quick.attack}
          </span>
        </span>
        <span className="map-monster-drop" style={{ color: ESSENCE_COLORS[m.rewards.essenceType as EssenceType] }}>
          +{m.rewards.essence}
        </span>
      </button>

      {tags.length > 0 && !open && (
        <div className="map-monster__tags">
          {tags.map(t => <span key={t} className="map-monster__tag">{t}</span>)}
        </div>
      )}

      {open && (
        <div className="map-monster__detail">
          <div className="map-monster__statgrid">
            {monsterStatRows(m).map(cell => (
              <div key={cell.label} className="map-monster__statcell">
                <span className="map-monster__statlabel">{cell.label}</span>
                <span className="map-monster__statvalue">
                  {cell.baseValue && (
                    <span className="map-monster__statbase">{cell.baseValue} → </span>
                  )}
                  <span className={cell.direction ? `map-stat-delta--${cell.direction}` : ''}>
                    {cell.value}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <ul className="map-monster__mechanics">
            {lines.map((line, i) => <li key={i} className="map-monster__mechline">{line}</li>)}
          </ul>
          <div className="map-monster__reward">
            Drops <span style={{ color: ESSENCE_COLORS[m.rewards.essenceType as EssenceType] }}>
              {m.rewards.essence} {essenceLabel(m.rewards.essenceType as EssenceType)}
            </span>
            {m.rewards.biomeXp ? ` · ${m.rewards.biomeXp} biome XP` : ''}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Expandable unlock row ───────────────────────────────────────────────────────
/**
 * One rung of a biome's reward ladder, whichever database authored it. Gear
 * states its stats and effects; a technique, stance, rite or rune states what
 * learning it would do for THIS character, the same way the Craft browser does.
 */
function UnlockRow({ unlock, unlocked, open, onToggle, relicPreview, abilityContext }: {
  unlock: BiomeUnlock;
  unlocked: boolean;
  open: boolean;
  onToggle: () => void;
  relicPreview: (unlock: BiomeUnlock) => string[];
  abilityContext: AbilityContext;
}) {
  const gear = unlock.gear;
  const stats = gear
    ? statEntries(gear.stats, gear.slot === 'weapon' ? gear.attacksPerSecond : undefined)
    : [];
  const effects = gear
    ? [
      ...(gear.slot === 'core' && gear.coreEligibility
        ? [isRestrictedCore(gear.coreEligibility)
          ? `Full effect only for ${coreEligibilityLabel(gear.coreEligibility).toLowerCase()}`
          : 'Works for any build']
        : []),
      ...formatMechanicEffects(gear.mechanicEffects),
      ...(gear.slot === 'relic' ? relicPreview(unlock) : []),
      ...(gear.slot === 'weapon' ? formatWeaponEffects(gear.id) : []),
    ]
    : [];
  const learnedLines = unlock.learnedId
    ? loadoutLinesFor(unlock.learnedId, abilityContext)
    : [];
  const costs = Object.entries(unlock.cost) as [EssenceType, number][];

  return (
    <div className={`map-recipe${unlocked ? '' : ' map-recipe--locked'}${open ? ' map-recipe--open' : ''}`}>
      <button className="map-recipe__row" onClick={onToggle}>
        <span className="map-recipe__chevron">{open ? '▾' : '▸'}</span>
        <span className="map-recipe__kind" data-slot={unlock.kind}>
          {MAKE_KIND_LABELS[unlock.kind]}
        </span>
        <span className="map-recipe-name">{unlock.name}</span>
        <span className="map-recipe-cost">
          {costs.map(([type, amt]) => (
            <span key={type} style={{ color: ESSENCE_COLORS[type], marginLeft: 4 }}>{amt} {ESSENCE_LABELS[type]}</span>
          ))}
        </span>
      </button>

      {open && (
        <div className="map-recipe__detail">
          {stats.length > 0 && (
            <div className="map-recipe__stats">
              {stats.map((e, i) => (
                <span key={i} className="map-recipe__statpill">
                  <span className="map-recipe__statval">{e.value}</span>
                  <span className="map-recipe__statlabel">{e.label}</span>
                </span>
              ))}
            </div>
          )}
          {effects.length > 0 && (
            <ul className="map-recipe__effects">
              {effects.map((line, i) => <li key={i} className="map-recipe__effectline">{line}</li>)}
            </ul>
          )}
          {learnedLines.length > 0 && (
            <DetailLines className="map-recipe__lines" lines={learnedLines} />
          )}
          {unlock.description && <p className="map-recipe__desc">{unlock.description}</p>}
        </div>
      )}
    </div>
  );
}

export function NodeInfo({ nodeId, playerNodeId, onClose }: NodeInfoProps) {
  const playerTier        = useAtomValue(playerTierAtom);
  const biomeXPByGroup    = useAtomValue(biomeXPAtom);
  const biomeLevelByGroup = useAtomValue(biomeLevelAtom);
  const bossFelledByNode  = useAtomValue(bossFelledByNodeAtom);
  const combatArchetype   = useAtomValue(combatArchetypeAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const abilityContext    = useAbilityContext();
  const mapNow = useMapClock();

  const [openMonster, setOpenMonster] = useState<string | null>(null);
  const [openRecipe,  setOpenRecipe]  = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Collapse all expanded rows whenever the selected zone changes.
  useEffect(() => { setOpenMonster(null); setOpenRecipe(null); setShowDetails(false); }, [nodeId]);

  const info  = NODE_BIOMES[nodeId];
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;

  // Every reward this biome pays out, from all five recipe databases — gear,
  // techniques, stances, rites and runes — grouped by the level that opens it.
  const unlockLevels = useMemo(
    () => (info ? biomeUnlocksByLevel(info.biomeGroup) : []),
    [info?.biomeGroup], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // A relic's authored ratings mean nothing on their own; what they do depends
  // on the reader's class mechanic, exactly as in the Craft browser.
  const relicPreview = useCallback(
    (unlock: BiomeUnlock) => formatResolvedRelicProfile(resolveRelicComparison(
      combatArchetype,
      abilityContext.passives,
      relicRatingsFromPassives(abilityContext.passives),
      relicRatingsFromEffects(unlock.gear?.mechanicEffects),
      { subVariant: selectedSubVariant, playerTier: abilityContext.playerTier, unlockedSkills, selectedRange },
    )),
    [combatArchetype, abilityContext.passives, abilityContext.playerTier, selectedSubVariant, unlockedSkills, selectedRange],
  );

  // Travel path (computed regardless of biome resolution so the button always works).
  const isCurrent = nodeId === playerNodeId;
  const travelPath = useMemo(
    () => (!playerNodeId || isCurrent ? null : bfsPath(playerNodeId, nodeId)),
    [playerNodeId, nodeId, isCurrent],
  );
  const steps = travelPath ? travelPath.length - 1 : 0;

  function handleTravel() {
    if (!travelPath || travelPath.length <= 1) return;
    hudBus.requestNavigateTo(travelPath.slice(1));
    onClose();
  }
  function handleTeleport() {
    hudBus.requestTeleportToNode(nodeId);
    onClose();
  }

  if (!info || !biome) return <div className="map-info__empty">Unknown zone.</div>;

  const { biomeGroup, biomeTier } = info;
  const region = info.regionId ? WORLD_REGIONS.get(info.regionId) : undefined;

  const travel = (
    <div className="map-travel">
      {isCurrent ? (
        <span className="map-travel__here">You are here</span>
      ) : travelPath ? (
        <button className="map-travel__btn" onClick={handleTravel}>
          Travel here <span className="map-travel__steps">{steps} {steps === 1 ? 'step' : 'steps'}</span>
        </button>
      ) : (
        <span className="map-travel__none">No route</span>
      )}
      {DEV_TOOLS_ENABLED && !isCurrent && (
        <button className="map-travel__teleport" onClick={handleTeleport} title="Dev: teleport">⚡</button>
      )}
    </div>
  );

  // Tier-gate fog: an uncharted node names only its region. Travel still works.
  if (!isNodeCharted(biomeTier, playerTier)) {
    return (
      <div className="map-node-info map-node-info--uncharted">
        <div className="map-node-info__top">
          <div className="map-node-info__heading">
            <span className="map-node-info__unknown" aria-hidden="true">?</span>
            <div className="map-node-info__titles">
              <span className="map-node-info__name">Uncharted</span>
              <span className="map-node-info__tier">
                {region?.displayName ?? `Tier ${biomeTier}`} · Tier {biomeTier}
              </span>
            </div>
          </div>
          {travel}
        </div>
        <p className="map-node-info__fog">Reach Tier {biomeTier} to chart this region.</p>
      </div>
    );
  }

  const isDungeon    = info.isDungeon === true;
  const isSanctuary  = info.kind === 'sanctuary';
  const dungeonBadge = dungeonBadgeLabel(info);
  const accentColor  = isDungeon ? '#882222' : tileColor(biomeGroup);

  // The node's identity (design §24.3): the territory of its dominant family,
  // read off the authored blend.
  const territory = nodeFamily(nodeId);

  // What the node is made of (design 12). `nodeSpawnBlend` resolves the authored
  // blend against the mobs this tier can actually field, so the composition and
  // the spawner always read the same vector.
  const blend = nodeSpawnBlend(nodeId);
  const blendRows = blend
    ? blendEntries(blend.shares).map((row) => ({
        share: row.share,
        family: FAMILY_DATABASE.get(row.family)!,
      }))
    : [];
  const territoryShare = territory ? blend?.shares[territory.id] ?? 0 : 0;

  const monsterIds = biome.monsterPoolByTier[biomeTier] ?? [];
  const monsters   = monsterIds.map(id => MONSTER_DATABASE.get(id)).filter((m): m is MonsterDefinition => m !== undefined);

  const bossIds = isDungeon ? (biome.bossPoolByTier?.[biomeTier] ?? []) : [];
  const bosses  = bossIds.map(id => MONSTER_DATABASE.get(id)).filter((m): m is MonsterDefinition => m !== undefined);
  const felledMarker = bossFelledByNode[nodeId];
  const felledBoss = felledMarker && felledMarker.respawnAt > mapNow
    ? MONSTER_DATABASE.get(felledMarker.monsterTypeId)
    : undefined;

  const biomeXP    = biomeXPByGroup[biomeGroup] ?? 0;
  const biomeLevel = biomeLevelByGroup[biomeGroup] ?? 0;
  // max(): a legacy save above a retired biome's cap still displays sensibly (T3 pass).
  const levelCap   = Math.max(biomeLevelCap(playerTier, biomeGroup), biomeLevel);
  const tierLabel  = biomeTier === 0
    ? 'Starting Zone'
    : `${region?.displayName ?? `Tier ${biomeTier}`} · Tier ${biomeTier}`;
  const coord      = nodeIdToCoord(nodeId);
  const xpFloor    = biomeXpForBiomeLevel(biomeGroup, biomeLevel);
  const xpCeil     = biomeXpForBiomeLevel(biomeGroup, biomeLevel + 1);
  const levelPct   = xpCeil > xpFloor ? Math.min(100, Math.max(0, (biomeXP - xpFloor) / (xpCeil - xpFloor)) * 100) : 100;
  const nextUnlock = unlockLevels.find(([reqLevel]) => reqLevel > biomeLevel);
  const hasDetails = !!territory || isDungeon || monsters.length > 0 || unlockLevels.length > 0;

  return (
    <div className="map-node-info">
      {/* Sticky header — identity + travel control */}
      <div className="map-node-info__top" style={{ borderLeftColor: accentColor }}>
        <div className="map-node-info__heading">
          <BiomeIcon biomeGroup={biomeGroup} size={34} className="map-node-info__icon" />
          <div className="map-node-info__titles">
            <div className="map-node-info__name-row">
              <span className="map-node-info__name">{info.displayName}</span>
              {dungeonBadge && <span className="map-node-info__dungeon-tag">{dungeonBadge}</span>}
            </div>
            <div className="map-node-info__sub">
              <span className="map-node-info__tier">{tierLabel}</span>
              {coord && <span className="map-node-info__coord">{formatNodeCoord(coord)}</span>}
            </div>
          </div>
        </div>

        {travel}
      </div>

      <div className="map-summary">
        <AreaDangerLabel info={info} />
        <dl className="map-summary__rows">
          {isDungeon && (
            <div className="map-summary__row">
              <dt>Boss</dt>
              <dd>
                {felledBoss
                  ? `Felled · back in ${formatRespawnRemaining(felledMarker!.respawnAt, mapNow)}`
                  : bosses.map((boss) => boss.name).join(', ') || 'Boss encounter'}
              </dd>
            </div>
          )}
          {territory && (
            <div className="map-summary__row">
              <dt>Territory</dt>
              <dd>{territory.name}</dd>
            </div>
          )}
          {unlockLevels.length > 0 && (
            <div className="map-summary__row">
              <dt>Biome level</dt>
              <dd>
                Lv {biomeLevel}
                {biomeLevel >= levelCap ? ' (max)' : ` · ${Math.floor(levelPct)}%`}
              </dd>
            </div>
          )}
          {unlockLevels.length > 0 && (
            <div className="map-summary__row">
              <dt>Next unlock</dt>
              <dd>
                {nextUnlock
                  ? `Lv ${nextUnlock[0]} · ${nextUnlock[1].length} ${nextUnlock[1].length === 1 ? 'recipe' : 'recipes'}`
                  : 'All unlocked'}
              </dd>
            </div>
          )}
        </dl>
        {/* The composition bar: each family's share. */}
        {blendRows.length > 0 && (
          <div className="map-family-mix" aria-hidden="true">
            {blendRows.map(({ family, share }) => (
              <i
                key={family.id}
                style={{ width: `${share * 100}%`, background: accentColor }}
              />
            ))}
          </div>
        )}
      </div>

      {isSanctuary && (
        <section className="map-modifier" style={{ borderLeftColor: accentColor }}>
          <div className="map-modifier__head">
            <span className="map-modifier__density-tag">Regional Sanctuary</span>
          </div>
          <p className="map-modifier__summary">
            A quiet, monster-free respawn anchor for this region.
          </p>
        </section>
      )}

      {hasDetails && (
        <button
          type="button"
          className="map-details-toggle"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((open) => !open)}
        >
          {showDetails ? 'Hide details ▴' : 'Details ▾'}
        </button>
      )}

      {showDetails && (<>
      {/* The node's territory and its composition (design §24.3). A node with no
          blend (a dungeon, a sanctuary) has no territory; every normal node
          carries one, so the old modifier band is gone (review L25: it could no
          longer render). */}
      {territory && (
        <section className="map-modifier" style={{ borderLeftColor: accentColor }}>
          <div className="map-modifier__head">
            <span className="map-modifier__chip" style={{ background: accentColor }}>
              <span>{territory.name} territory</span>
            </span>
            {blend && (
              <span className="map-modifier__density-tag">
                {Math.round(territoryShare * 100)}% of spawns here
              </span>
            )}
          </div>
          {blendRows.length > 0 && (
            <dl className="map-family-rows">
              {blendRows.map(({ family, share }) => (
                <div
                  key={family.id}
                  className={`map-family-row${family.id === territory.id ? '' : ' map-family-row--minor'}`}
                >
                  <dt>{family.name}</dt>
                  <dd>
                    <span className="map-family-row__share">{Math.round(share * 100)}%</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {blend && blend.unavailable.length > 0 && (
            <div className="map-family__absent">
              Absent at Tier {biomeTier}:{' '}
              {blend.unavailable
                .map((id) => FAMILY_DATABASE.get(id)?.name ?? id)
                .join(', ')}
            </div>
          )}
          {!blend && (
            <div className="map-family__absent">Nothing spawns here at Tier {biomeTier} yet.</div>
          )}
        </section>
      )}

      {isDungeon && <div className="map-dungeon-warning">Altar trial · guardians · boss finale</div>}

      {felledMarker && felledMarker.respawnAt > mapNow && felledBoss && (
        <section className="map-info-section">
          <div className="map-info-section__title map-info-section__title--boss">Boss</div>
          <div className="map-boss-felled">
            <span className="map-boss-felled__tag">[FELLED]</span>
            <span className="map-boss-felled__name">{felledBoss.name}</span>
            <span className="map-boss-felled__timer">
              Respawns in {formatRespawnRemaining(felledMarker.respawnAt, mapNow)}
            </span>
          </div>
        </section>
      )}

      {!felledMarker && bosses.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title map-info-section__title--boss">Boss</div>
          {bosses.map(m => (
            <MonsterRow
              key={m.id}
              m={m}
              isBoss
              open={openMonster === m.id}
              onToggle={() => setOpenMonster(prev => prev === m.id ? null : m.id)}
            />
          ))}
        </section>
      )}

      {monsters.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">Monsters</div>
          {monsters.map(m => (
            <MonsterRow
              key={m.id}
              m={m}
              isBoss={false}
              open={openMonster === m.id}
              onToggle={() => setOpenMonster(prev => prev === m.id ? null : m.id)}
            />
          ))}
        </section>
      )}

      {unlockLevels.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">
            Biome Progress
            <span className="map-kills-badge">Lv {biomeLevel}{biomeLevel >= levelCap ? ' (max)' : ''}</span>
          </div>
          {biomeLevel < levelCap && (() => {
            const xpThisTier = biomeXpForBiomeLevel(biomeGroup, biomeLevel);
            const xpNextTier = biomeXpForBiomeLevel(biomeGroup, biomeLevel + 1);
            const xpInLevel  = biomeXP - xpThisTier;
            const xpNeeded   = xpNextTier - xpThisTier;
            const pct = Math.min(100, (xpInLevel / xpNeeded) * 100);
            return (
              <div className="map-progress-row">
                <div className="map-progress-bar-wrap">
                  <div className="map-progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="map-progress-label">
                  {xpInLevel} / {xpNeeded} XP to Lv {biomeLevel + 1}
                </span>
              </div>
            );
          })()}
        </section>
      )}

      {unlockLevels.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">Unlocks</div>
          {unlockLevels.map(([reqLevel, group]) => {
            const lvlUnlocked = biomeLevel >= reqLevel;
            return (
              <div key={reqLevel} className="map-recipe-group">
                <div className={`map-recipe-group__header${lvlUnlocked ? ' unlocked' : ''}`}>
                  {lvlUnlocked ? `Lv ${reqLevel} — Unlocked` : `Lv ${reqLevel} required`}
                </div>
                {group.map(unlock => (
                  <UnlockRow
                    key={unlock.key}
                    unlock={unlock}
                    unlocked={lvlUnlocked}
                    open={openRecipe === unlock.key}
                    onToggle={() => setOpenRecipe(prev => prev === unlock.key ? null : unlock.key)}
                    relicPreview={relicPreview}
                    abilityContext={abilityContext}
                  />
                ))}
              </div>
            );
          })}
        </section>
      )}

      </>)}

      {monsters.length === 0 && unlockLevels.length === 0 && !isDungeon && !isSanctuary && (
        <div className="map-info__empty">No content in this zone yet.</div>
      )}
    </div>
  );
}
