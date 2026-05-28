import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { EquipmentSlot, EssenceType } from '@mmo-idle/shared';
import {
  ITEM_DATABASE,
  TEST_ROOM_NODE_ID,
  UPGRADE_STAT_BY_SLOT,
  checkUpgrade,
  getMaxUpgrade,
  requiredBiomeLevelForUpgrade,
  upgradeCostFor,
  upgradeStatBonusTotal,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  biomeLevelAtom,
  equipmentAtom,
  essencesAtom,
  inventoryAtom,
  itemUpgradesAtom,
  playerNodeIdAtom,
} from '../../hud/atoms';
import { SLOT_LABELS, biomeName, tierColor } from './common';
import { CostDisplay, EssenceSummary } from './shared';

const STAT_LABEL: Record<string, string> = {
  attack: 'ATK',
  damageReduction: 'DR',
  speed: 'SPD',
  hpRegen: 'REGEN',
};

function formatStat(stat: string, value: number): string {
  if (stat === 'damageReduction') return `${Math.round(value * 100)}%`;
  return String(Math.round(value * 10) / 10);
}

interface UpgradeResult {
  itemId: string;
  success: boolean;
  newLevel: number;
  reason?: string;
}

export function UpgradeTab() {
  const inventory    = useAtomValue(inventoryAtom);
  const equipment    = useAtomValue(equipmentAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const essences     = useAtomValue(essencesAtom);
  const biomeLevel   = useAtomValue(biomeLevelAtom);
  const nodeId       = useAtomValue(playerNodeIdAtom);
  const isTestRoom   = nodeId === TEST_ROOM_NODE_ID;

  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterSlot,  setFilterSlot]  = useState<string | null>(null);
  const [filterTier,  setFilterTier]  = useState<number | null>(null);

  const [result, setResult] = useState<UpgradeResult | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<UpgradeResult>).detail;
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      setResult(detail);
      resultTimerRef.current = setTimeout(() => setResult(null), detail.success ? 1500 : 2200);
    };
    window.addEventListener('hud:upgradeResult', handler);
    return () => {
      window.removeEventListener('hud:upgradeResult', handler);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  const equippedSet = useMemo(
    () => new Set(Object.values(equipment).filter((id): id is string => id !== null)),
    [equipment],
  );

  // All owned upgradeable items — equipped items sorted first, then by tier, then name.
  const items = useMemo(() => {
    const ids = new Set<string>([...inventory, ...equippedSet]);
    return Array.from(ids)
      .map(id => ITEM_DATABASE.get(id))
      .filter((def): def is NonNullable<typeof def> => !!def && !!def.biomeGroup)
      .sort((a, b) => {
        const aEq = equippedSet.has(a.id) ? 0 : 1;
        const bEq = equippedSet.has(b.id) ? 0 : 1;
        return aEq - bEq || a.tier - b.tier || a.name.localeCompare(b.name);
      });
  }, [inventory, equippedSet]);

  const biomeGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const def of items) if (def.biomeGroup) groups.add(def.biomeGroup);
    return Array.from(groups).sort();
  }, [items]);

  const tiers = useMemo(() => {
    const ts = new Set<number>();
    for (const def of items) ts.add(def.tier);
    return Array.from(ts).sort((a, b) => a - b);
  }, [items]);

  const filtered = useMemo(() => items.filter(def =>
    (!filterBiome || def.biomeGroup === filterBiome) &&
    (!filterSlot  || def.slot       === filterSlot)  &&
    (!filterTier  || def.tier       === filterTier),
  ), [items, filterBiome, filterSlot, filterTier]);

  const toggleBiome = (g: string) => setFilterBiome(v => v === g ? null : g);
  const toggleSlot  = (s: string) => setFilterSlot(v  => v === s ? null : s);
  const toggleTier  = (t: number) => setFilterTier(v  => v === t ? null : t);

  return (
    <div className="craft-body">
      <EssenceSummary essences={essences} />

      {/* Filters */}
      {items.length > 0 && (
        <div className="craft-filters">
          <div className="craft-filter-row">
            <button
              className={`craft-filter-chip${!filterBiome ? ' craft-filter-chip--active' : ''}`}
              onClick={() => setFilterBiome(null)}
            >All</button>
            {biomeGroups.map(g => (
              <button
                key={g}
                className={`craft-filter-chip${filterBiome === g ? ' craft-filter-chip--active' : ''}`}
                onClick={() => toggleBiome(g)}
              >{biomeName(g)}</button>
            ))}
          </div>
          <div className="craft-filter-row">
            <button
              className={`craft-filter-chip${!filterSlot ? ' craft-filter-chip--active' : ''}`}
              onClick={() => setFilterSlot(null)}
            >All Slots</button>
            {(['weapon', 'armor', 'recovery', 'mobility'] as const).map(s => (
              <button
                key={s}
                className={`craft-filter-chip craft-filter-chip--slot${filterSlot === s ? ' craft-filter-chip--active' : ''}`}
                data-slot={s}
                onClick={() => toggleSlot(s)}
              >{SLOT_LABELS[s]}</button>
            ))}
          </div>
          {tiers.length > 1 && (
            <div className="craft-filter-row">
              <button
                className={`craft-filter-chip${!filterTier ? ' craft-filter-chip--active' : ''}`}
                onClick={() => setFilterTier(null)}
              >All Tiers</button>
              {tiers.map(t => (
                <button
                  key={t}
                  className={`craft-filter-chip craft-filter-chip--tier${filterTier === t ? ' craft-filter-chip--active' : ''}`}
                  style={filterTier === t
                    ? { color: tierColor(t), borderColor: `${tierColor(t)}aa`, background: `${tierColor(t)}18` }
                    : { color: `${tierColor(t)}bb` }
                  }
                  onClick={() => toggleTier(t)}
                >T{t}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="craft-empty">No upgradeable items. Craft or equip gear first.</div>
      ) : filtered.length === 0 ? (
        <div className="craft-empty">No items match the current filter.</div>
      ) : (
        <div className="craft-list">
          {filtered.map(def => {
            const slot        = def.slot as EquipmentSlot;
            const currentPlus = itemUpgrades[def.id] ?? 0;
            const isMaxed     = currentPlus >= getMaxUpgrade(def);
            const upStat      = UPGRADE_STAT_BY_SLOT[slot];
            const base        = (def.statModifiers[upStat] as number | undefined) ?? 0;
            const curVal      = base + (upgradeStatBonusTotal(def, currentPlus)[upStat] ?? 0);
            const nextVal     = base + (upgradeStatBonusTotal(def, currentPlus + 1)[upStat] ?? 0);

            const reqLevel    = requiredBiomeLevelForUpgrade(def, currentPlus + 1);
            const haveLevel   = biomeLevel[def.biomeGroup!] ?? 0;
            const levelMet    = haveLevel >= reqLevel;
            const cost        = upgradeCostFor(def, currentPlus + 1);
            const check       = checkUpgrade({ item: def, currentPlus, biomeLevel: haveLevel, essences });
            const canUpgrade  = !isMaxed && (isTestRoom || check.ok);

            const cardResult = result?.itemId === def.id ? result : null;

            return (
              <div
                key={def.id}
                className={[
                  'craft-recipe',
                  'craft-upgrade',
                  isMaxed ? 'craft-upgrade--maxed' : '',
                ].filter(Boolean).join(' ')}
              >
                {cardResult && (
                  <div className={`craft-card-result craft-card-result--${cardResult.success ? 'ok' : 'err'}`}>
                    <span className="craft-card-result__icon">{cardResult.success ? '✦' : '✗'}</span>
                    <span className="craft-card-result__text">
                      {cardResult.success ? `Upgraded to +${cardResult.newLevel}!` : (cardResult.reason ?? 'Upgrade failed')}
                    </span>
                  </div>
                )}

                <div className="craft-recipe__icon" data-slot={slot}>
                  {currentPlus > 0 ? `+${currentPlus}` : SLOT_LABELS[slot]?.slice(0, 3).toUpperCase()}
                </div>

                <div className="craft-recipe__content">
                  <div className="craft-recipe__header">
                    <span className="craft-recipe__name">{def.name}</span>
                    {currentPlus > 0 && <span className="craft-upgrade__level">+{currentPlus}</span>}
                    <span className="craft-recipe__slot-badge" data-slot={slot}>{SLOT_LABELS[slot] ?? slot}</span>
                    <span className="craft-recipe__tier-badge">T{def.tier}</span>
                    {equippedSet.has(def.id) && <span className="craft-recipe__owned-badge">EQUIPPED</span>}
                  </div>

                  <div className="craft-upgrade__transition">
                    <span className="craft-upgrade__from">{formatStat(upStat, curVal)}</span>
                    {!isMaxed && (
                      <>
                        <span className="craft-upgrade__arrow">→</span>
                        <span className="craft-upgrade__to">{formatStat(upStat, nextVal)}</span>
                      </>
                    )}
                    <span className="craft-upgrade__stat-label">{STAT_LABEL[upStat] ?? upStat}</span>
                    {isMaxed && <span className="craft-upgrade__max">MAX +{getMaxUpgrade(def)}</span>}
                  </div>

                  {!isMaxed && cost && (
                    <CostDisplay cost={cost} essences={essences} />
                  )}

                  {!isMaxed && (
                    <div className="craft-recipe__footer">
                      <span className={`craft-upgrade__req${levelMet ? ' craft-upgrade__req--ok' : ' craft-upgrade__req--bad'}`}>
                        {biomeName(def.biomeGroup!)} Lv {reqLevel}
                        {!levelMet && ` (have ${haveLevel})`}
                      </span>
                      <button
                        className="craft-recipe__btn"
                        disabled={!canUpgrade}
                        onClick={() => { if (canUpgrade) hudBus.requestUpgradeItem(def.id); }}
                      >
                        {canUpgrade ? `Upgrade +${currentPlus + 1}` : !levelMet ? 'Locked' : 'Insufficient'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
