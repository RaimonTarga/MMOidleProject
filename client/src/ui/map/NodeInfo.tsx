import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { EssenceType, MonsterDefinition, Recipe } from '@mmo-idle/shared';
import {
  NODE_BIOMES, BIOME_DATABASE, MONSTER_DATABASE, RECIPE_DATABASE, ESSENCE_COLORS,
  biomeLevelCap, biomeXpForBiomeLevel, formatNodeCoord, formatRespawnRemaining, nodeIdToCoord,
} from '@mmo-idle/shared';
import { biomeLevelAtom, biomeXPAtom, bossFelledByNodeAtom, playerTierAtom } from '../../hud/atoms';
import { hudBus } from '../../hudBus';
import { DEV_TOOLS_ENABLED } from '../../devTools';
import { dungeonBadgeLabel, hexDot, tileColor } from './constants';
import { bfsPath } from './pathing';
import { useMapClock } from './useMapClock';
import { BiomeIcon } from './BiomeIcon';
import { formatMonsterMechanics, monsterStatRows, monsterTags } from './monsterInfo';
import { statEntries, formatMechanicEffects, formatWeaponEffects } from '../crafting/itemDisplay';

interface NodeInfoProps {
  nodeId: string;
  playerNodeId: string | null;
  onClose: () => void;
}

// ── Expandable monster row ──────────────────────────────────────────────────────
function MonsterRow({ m, isBoss, open, onToggle }: {
  m: MonsterDefinition; isBoss: boolean; open: boolean; onToggle: () => void;
}) {
  const tags  = monsterTags(m);
  const lines = formatMonsterMechanics(m);
  return (
    <div className={`map-monster${isBoss ? ' map-monster--boss' : ''}${open ? ' map-monster--open' : ''}`}>
      <button className="map-monster__row" onClick={onToggle}>
        <span className="map-monster__chevron">{open ? '▾' : '▸'}</span>
        <span className="map-monster-dot" style={{ background: hexDot(m.color) }} />
        <span className={`map-monster-name${isBoss ? ' map-monster-name--boss' : ''}`}>{m.name}</span>
        <span className="map-monster__quick">HP {m.stats.hp} · ATK {m.stats.attack}</span>
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
                <span className="map-monster__statvalue">{cell.value}</span>
              </div>
            ))}
          </div>
          <ul className="map-monster__mechanics">
            {lines.map((line, i) => <li key={i} className="map-monster__mechline">{line}</li>)}
          </ul>
          <div className="map-monster__reward">
            Drops <span style={{ color: ESSENCE_COLORS[m.rewards.essenceType as EssenceType] }}>
              {m.rewards.essence} {m.rewards.essenceType}
            </span>
            {m.rewards.biomeXp ? ` · ${m.rewards.biomeXp} biome XP` : ''}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Expandable recipe row ───────────────────────────────────────────────────────
function RecipeRow({ r, unlocked, open, onToggle }: {
  r: Recipe; unlocked: boolean; open: boolean; onToggle: () => void;
}) {
  const stats   = statEntries(r.stats, r.slot === 'weapon' ? r.attacksPerSecond : undefined);
  const effects = [
    ...formatMechanicEffects(r.mechanicEffects),
    ...(r.slot === 'weapon' ? formatWeaponEffects(r.id) : []),
  ];
  const costs = Object.entries(r.cost) as [EssenceType, number][];

  return (
    <div className={`map-recipe${unlocked ? '' : ' map-recipe--locked'}${open ? ' map-recipe--open' : ''}`}>
      <button className="map-recipe__row" onClick={onToggle}>
        <span className="map-recipe__chevron">{open ? '▾' : '▸'}</span>
        <span className="map-recipe-name">{r.name}</span>
        <span className="map-recipe-cost">
          {costs.map(([type, amt]) => (
            <span key={type} style={{ color: ESSENCE_COLORS[type], marginLeft: 4 }}>{amt} {type}</span>
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
          {r.description && <p className="map-recipe__desc">{r.description}</p>}
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
  const mapNow = useMapClock();

  const [openMonster, setOpenMonster] = useState<string | null>(null);
  const [openRecipe,  setOpenRecipe]  = useState<string | null>(null);

  // Collapse all expanded rows whenever the selected zone changes.
  useEffect(() => { setOpenMonster(null); setOpenRecipe(null); }, [nodeId]);

  const info  = NODE_BIOMES[nodeId];
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;

  const recipes = useMemo(() =>
    Array.from(RECIPE_DATABASE.values())
      .filter(r => r.recipeGroup === info?.biomeGroup)
      .sort((a, b) => a.requiredBiomeLevel - b.requiredBiomeLevel || a.slot.localeCompare(b.slot)),
    [info?.biomeGroup],
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
  const isDungeon    = info.isDungeon === true;
  const dungeonBadge = dungeonBadgeLabel(info);
  const accentColor  = isDungeon ? '#882222' : tileColor(biomeGroup);

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
  const levelCap   = biomeLevelCap(playerTier, biomeGroup);
  const tierLabel  = biomeTier === 0 ? 'Starting Zone' : `Tier ${biomeTier}`;
  const coord      = nodeIdToCoord(nodeId);

  const recipesByLevel = recipes.reduce<Record<number, typeof recipes>>((acc, r) => {
    (acc[r.requiredBiomeLevel] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="map-node-info">
      {/* Sticky header — identity + travel control */}
      <div className="map-node-info__top" style={{ borderLeftColor: accentColor }}>
        <div className="map-node-info__heading">
          <BiomeIcon biomeGroup={biomeGroup} size={34} className="map-node-info__icon" />
          <div className="map-node-info__titles">
            <div className="map-node-info__name-row">
              <span className="map-node-info__name">{biome.name}</span>
              {dungeonBadge && <span className="map-node-info__dungeon-tag">{dungeonBadge}</span>}
            </div>
            <div className="map-node-info__sub">
              <span className="map-node-info__tier">{tierLabel}</span>
              {coord && <span className="map-node-info__coord">{formatNodeCoord(coord)}</span>}
            </div>
          </div>
        </div>

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
      </div>

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

      {recipes.length > 0 && (
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

      {recipes.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">Recipes</div>
          {Object.entries(recipesByLevel).map(([lvlStr, group]) => {
            const reqLevel    = Number(lvlStr);
            const lvlUnlocked = biomeLevel >= reqLevel;
            return (
              <div key={reqLevel} className="map-recipe-group">
                <div className={`map-recipe-group__header${lvlUnlocked ? ' unlocked' : ''}`}>
                  {lvlUnlocked ? `Lv ${reqLevel} — Unlocked` : `Lv ${reqLevel} required`}
                </div>
                {group.map(r => (
                  <RecipeRow
                    key={r.id}
                    r={r}
                    unlocked={lvlUnlocked}
                    open={openRecipe === r.id}
                    onToggle={() => setOpenRecipe(prev => prev === r.id ? null : r.id)}
                  />
                ))}
              </div>
            );
          })}
        </section>
      )}

      {monsters.length === 0 && recipes.length === 0 && !isDungeon && (
        <div className="map-info__empty">No content in this zone yet.</div>
      )}
    </div>
  );
}
