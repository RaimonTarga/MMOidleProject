import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { Recipe } from '@mmo-idle/shared';
import { RECIPE_DATABASE, NODE_BIOMES, TEST_ROOM_NODE_ID, biomeLevelCap, biomeXpForLevel } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  biomeXPAtom,
  playerNodeIdAtom,
  playerTierAtom,
  unlockedRecipesAtom,
} from '../../hud/atoms';
import { SLOT_LABELS, biomeName } from './common';

interface BiomeSectionProps {
  biomeGroup: string;
  biomeLevel: Record<string, number>;
  biomeXP: Record<string, number>;
  playerTier: number;
  unlockedRecipes: string[];
  recipes: Recipe[];
  isCurrent: boolean;
}

function BiomeSection({ biomeGroup, biomeLevel, biomeXP, playerTier, unlockedRecipes, recipes, isCurrent }: BiomeSectionProps) {
  const level    = biomeLevel[biomeGroup] ?? 0;
  const xp       = biomeXP[biomeGroup] ?? 0;
  const levelCap = biomeLevelCap(playerTier, biomeGroup);
  const xpThisTier  = biomeXpForLevel(level);
  const xpNextTier  = biomeXpForLevel(level + 1);
  const xpInLevel   = xp - xpThisTier;
  const xpNeeded    = xpNextTier - xpThisTier;
  const pct = level >= levelCap
    ? 100
    : Math.min(100, (xpInLevel / xpNeeded) * 100);
  const label = biomeName(biomeGroup);

  return (
    <div className={`craft-biome-section${isCurrent ? ' craft-biome-section--current' : ''}`}>
      <div className="craft-biome-section__header">
        <span className="craft-biome-section__name">{label}</span>
        {isCurrent && <span className="craft-biome-section__tag">CURRENT</span>}
        <span className="craft-biome-section__level">
          Lv {level}{level >= levelCap ? ' (cap)' : ''}
        </span>
      </div>

      <div className="craft-biome__progress">
        <div className="craft-biome__bar" style={{ width: `${pct}%` }} />
        {level < levelCap && (
          <span className="craft-biome__label">{xpInLevel} / {xpNeeded} XP</span>
        )}
      </div>

      {recipes.length > 0 && (
        <div className="craft-unlock-path">
          {recipes.map(r => {
            const unlocked   = unlockedRecipes.includes(r.id);
            const tierLocked = r.tier > playerTier;
            return (
              <div
                key={r.id}
                className={[
                  'craft-unlock-row',
                  unlocked   ? 'craft-unlock-row--unlocked'   : '',
                  tierLocked ? 'craft-unlock-row--tier-locked' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="craft-unlock-row__level">Lv {r.requiredBiomeLevel}</span>
                <span className="craft-unlock-row__name">{r.name}</span>
                <span className="craft-unlock-row__slot" data-slot={r.slot}>
                  {SLOT_LABELS[r.slot] ?? r.slot}
                </span>
                <span className="craft-unlock-row__tier">T{r.tier}</span>
                <span className={`craft-unlock-row__status${unlocked ? ' craft-unlock-row__status--ok' : tierLocked ? ' craft-unlock-row__status--tier' : ''}`}>
                  {unlocked ? '✓' : tierLocked ? 'TIER' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BiomeTab() {
  const nodeId = useAtomValue(playerNodeIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const biomeXP = useAtomValue(biomeXPAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const unlockedRecipes = useAtomValue(unlockedRecipesAtom);
  const isTestRoom = nodeId === TEST_ROOM_NODE_ID;

  const currentBiomeGroup = isTestRoom
    ? null
    : (nodeId ? NODE_BIOMES[nodeId]?.biomeGroup : null);

  const trackedBiomes = useMemo(() => {
    const groups = new Set<string>(currentBiomeGroup ? [currentBiomeGroup] : []);
    for (const g of Object.keys(biomeXP)) groups.add(g);
    return Array.from(groups).sort();
  }, [biomeXP, currentBiomeGroup]);

  const recipesByBiome = useMemo(() => {
    const map = new Map<string, Recipe[]>();
    for (const recipe of RECIPE_DATABASE.values()) {
      const arr = map.get(recipe.recipeGroup) ?? [];
      arr.push(recipe);
      map.set(recipe.recipeGroup, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.requiredBiomeLevel - b.requiredBiomeLevel || a.slot.localeCompare(b.slot));
    }
    return map;
  }, []);

  if (isTestRoom) {
    return (
      <div className="craft-body">
        <div className="craft-biome-section">
          <div className="craft-biome__maxed">
            {`Test Forge T${playerTier} — all T${playerTier} recipes available.`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="craft-body">
      {trackedBiomes.length === 0 && (
        <div className="craft-empty">No biome progress yet — kill monsters to earn XP.</div>
      )}
      {currentBiomeGroup && (
        <BiomeSection
          biomeGroup={currentBiomeGroup}
          biomeLevel={biomeLevel}
          biomeXP={biomeXP}
          playerTier={playerTier}
          unlockedRecipes={unlockedRecipes}
          recipes={recipesByBiome.get(currentBiomeGroup) ?? []}
          isCurrent
        />
      )}
      {trackedBiomes.filter(g => g !== currentBiomeGroup).map(g => (
        <BiomeSection
          key={g}
          biomeGroup={g}
          biomeLevel={biomeLevel}
          biomeXP={biomeXP}
          playerTier={playerTier}
          unlockedRecipes={unlockedRecipes}
          recipes={recipesByBiome.get(g) ?? []}
          isCurrent={false}
        />
      ))}
    </div>
  );
}
