import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { EssenceType, ItemStats } from '@mmo-idle/shared';
import { NODE_BIOMES, BIOME_DATABASE, MONSTER_DATABASE, RECIPE_DATABASE, ESSENCE_COLORS, biomeLevelCap, biomeXpForLevel } from '@mmo-idle/shared';
import { biomeLevelAtom, biomeXPAtom, playerTierAtom } from '../../hud/atoms';
import { formatStat, hexDot, tileColor } from './constants';

interface NodeInfoProps { nodeId: string; }

export function NodeInfo({ nodeId }: NodeInfoProps) {
  const playerTier = useAtomValue(playerTierAtom);
  const biomeXPByGroup = useAtomValue(biomeXPAtom);
  const biomeLevelByGroup = useAtomValue(biomeLevelAtom);
  const info  = NODE_BIOMES[nodeId];
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;

  const recipes = useMemo(() =>
    Array.from(RECIPE_DATABASE.values())
      .filter(r => r.recipeGroup === info?.biomeGroup)
      .sort((a, b) => a.requiredBiomeLevel - b.requiredBiomeLevel || a.slot.localeCompare(b.slot)),
    [info?.biomeGroup],
  );

  if (!info || !biome) return <div className="map-info__empty">Unknown zone.</div>;

  const { biomeGroup, biomeTier } = info;
  const isDungeon   = info.isDungeon === true;
  const accentColor = isDungeon ? '#882222' : tileColor(biomeGroup);

  const monsterIds = biome.monsterPoolByTier[biomeTier] ?? [];
  const monsters   = monsterIds.map(id => MONSTER_DATABASE.get(id)).filter((m): m is NonNullable<typeof m> => m !== undefined);

  const bossIds = isDungeon ? (biome.bossPoolByTier?.[biomeTier] ?? []) : [];
  const bosses  = bossIds.map(id => MONSTER_DATABASE.get(id)).filter((m): m is NonNullable<typeof m> => m !== undefined);

  const biomeXP    = biomeXPByGroup[biomeGroup] ?? 0;
  const biomeLevel = biomeLevelByGroup[biomeGroup] ?? 0;
  const levelCap   = biomeLevelCap(playerTier, biomeGroup);
  const tierLabel  = biomeTier === 0 ? 'Starting Zone' : `Tier ${biomeTier}`;

  const recipesByLevel = recipes.reduce<Record<number, typeof recipes>>((acc, r) => {
    (acc[r.requiredBiomeLevel] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="map-node-info">
      <div className="map-node-info__header" style={{ borderLeftColor: accentColor }}>
        <span className="map-node-info__name">{biome.name}</span>
        <span className="map-node-info__tier">{tierLabel}</span>
        {isDungeon && <span className="map-node-info__dungeon-tag">DUNGEON</span>}
      </div>

      {isDungeon && <div className="map-dungeon-warning">Enemies: ×2 HP · ×1.6 ATK</div>}

      {bosses.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title map-info-section__title--boss">Boss</div>
          {bosses.map(m => (
            <div key={m.id} className="map-monster-row map-monster-row--boss">
              <span className="map-monster-dot" style={{ background: hexDot(m.color) }} />
              <span className="map-monster-name map-monster-name--boss">{m.name}</span>
              <span className="map-monster-stats">HP {m.stats.hp} · ATK {m.stats.attack} · PLT {m.stats.plating}</span>
              <span className="map-monster-drop" style={{ color: ESSENCE_COLORS[m.rewards.essenceType as EssenceType] }}>+{m.rewards.essence}</span>
            </div>
          ))}
        </section>
      )}

      {monsters.length > 0 && (
        <section className="map-info-section">
          <div className="map-info-section__title">Monsters</div>
          {monsters.map(m => (
            <div key={m.id} className="map-monster-row">
              <span className="map-monster-dot" style={{ background: hexDot(m.color) }} />
              <span className="map-monster-name">{m.name}</span>
              <span className="map-monster-stats">HP {m.stats.hp} · ATK {m.stats.attack} · PLT {m.stats.plating} · SPD {m.stats.speed}</span>
              <span className="map-monster-drop" style={{ color: ESSENCE_COLORS[m.rewards.essenceType as EssenceType] }}>+{m.rewards.essence}</span>
            </div>
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
            const xpThisTier = biomeXpForLevel(biomeLevel);
            const xpNextTier = biomeXpForLevel(biomeLevel + 1);
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
                  <div key={r.id} className={`map-recipe-row${lvlUnlocked ? '' : ' locked'}`}>
                    <span className="map-recipe-name">{r.name}</span>
                    <span className="map-recipe-stat">{formatStat(r.stats)}</span>
                    <span className="map-recipe-cost">
                      {(Object.entries(r.cost) as [EssenceType, number][]).map(([type, amt]) => (
                        <span key={type} style={{ color: ESSENCE_COLORS[type], marginRight: 4 }}>{amt} {type}</span>
                      ))}
                    </span>
                  </div>
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
