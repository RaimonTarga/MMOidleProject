import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import type { EquipmentSlot } from '@mmo-idle/shared';
import {
  ITEM_DATABASE,
  TEST_ROOM_NODE_ID,
  checkUpgrade,
  globalMasteryRequiredForUpgrade,
  getMaxUpgrade,
  requiredBiomeLevelForUpgrade,
  upgradeCostFor,
  upgradeCatalystCostFor,
  upgradeCeilingFromGlobalMastery,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  biomeLevelAtom,
  catalystsAtom,
  equipmentAtom,
  essencesAtom,
  globalMasteryAtom,
  inventoryAtom,
  itemUpgradesAtom,
  playerNodeIdAtom,
} from '../../hud/atoms';
import { SLOT_LABELS, biomeName, tierColor } from './common';
import { CostDisplay, WalletSummary } from './shared';
import { computeUpgradeDiff } from './itemDisplay';
import { ItemIcon } from '../ItemIcon';

interface UpgradeResult {
  id: number;
  itemId: string;
  success: boolean;
  newLevel: number;
  reason?: string;
}

type UpgradeItem = NonNullable<ReturnType<typeof ITEM_DATABASE.get>>;

const UPGRADE_REVEAL_MS = 3_200;
const UPGRADE_FAILURE_MS = 2_200;

/**
 * A restrained version of the forge reveal. The charge and lock stay clipped
 * to the upgraded item's card, so repeated progression feels tactile without
 * interrupting the rest of the crafting panel.
 */
function UpgradeReveal({ item, result }: { item: UpgradeItem; result: UpgradeResult }) {
  const style = {
    '--upgrade-reveal-tone': tierColor(item.tier),
  } as CSSProperties;

  return (
    <div
      className="craft-upgrade-reveal"
      style={style}
      role="status"
      aria-live="polite"
      aria-label={`${item.name} upgraded to plus ${result.newLevel}`}
    >
      <span className="craft-upgrade-reveal__veil" aria-hidden="true" />
      <span className="craft-upgrade-reveal__rail" aria-hidden="true">
        <i className="craft-upgrade-reveal__charge" />
        <i className="craft-upgrade-reveal__current" />
      </span>

      <span className="craft-upgrade-reveal__socket" aria-hidden="true">
        <i className="craft-upgrade-reveal__ring" />
        <span className="craft-upgrade-reveal__icon">
          {item.icon
            ? <ItemIcon frameName={item.icon} scale={1.4} />
            : SLOT_LABELS[item.slot]?.slice(0, 3).toUpperCase()}
        </span>
        <i className="craft-upgrade-reveal__lock" />
      </span>

      <span className="craft-upgrade-reveal__copy">
        <small>Enhancement locked</small>
        <strong>+{result.newLevel}</strong>
        <span>{item.name}</span>
      </span>
      <span className="craft-upgrade-reveal__edge" aria-hidden="true" />
    </div>
  );
}

export function UpgradeTab() {
  const inventory    = useAtomValue(inventoryAtom);
  const equipment    = useAtomValue(equipmentAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const essences     = useAtomValue(essencesAtom);
  const catalysts    = useAtomValue(catalystsAtom);
  const biomeLevel   = useAtomValue(biomeLevelAtom);
  const gm           = useAtomValue(globalMasteryAtom);
  const nodeId       = useAtomValue(playerNodeIdAtom);
  const isTestRoom   = nodeId === TEST_ROOM_NODE_ID;

  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterSlot,  setFilterSlot]  = useState<string | null>(null);
  const [filterTier,  setFilterTier]  = useState<number | null>(null);

  const [result, setResult] = useState<UpgradeResult | null>(null);
  const resultIdRef = useRef(0);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearResult = () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
      setResult(null);
    };
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Omit<UpgradeResult, 'id'>>).detail;
      if (document.hidden) {
        clearResult();
        return;
      }
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      setResult({ ...detail, id: ++resultIdRef.current });
      resultTimerRef.current = setTimeout(
        () => setResult(null),
        detail.success ? UPGRADE_REVEAL_MS : UPGRADE_FAILURE_MS,
      );
    };
    const cancelHiddenReveal = () => {
      if (document.hidden) clearResult();
    };
    window.addEventListener('hud:upgradeResult', handler);
    document.addEventListener('visibilitychange', cancelHiddenReveal);
    return () => {
      window.removeEventListener('hud:upgradeResult', handler);
      document.removeEventListener('visibilitychange', cancelHiddenReveal);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  const equippedSet = useMemo(
    () => new Set(Object.values(equipment).filter((id): id is string => id !== null)),
    [equipment],
  );

  // Owned upgradeable items that still have headroom — fully-upgraded gear drops
  // off the list entirely. Equipped items sort first, then by tier, then name.
  // The dev test room also exposes legacy/dev gear so it can be bumped without
  // needing a biome-backed recipe.
  const items = useMemo(() => {
    const ids = new Set<string>([...inventory, ...equippedSet]);
    return Array.from(ids)
      .map(id => ITEM_DATABASE.get(id))
      .filter((def): def is NonNullable<typeof def> =>
        !!def
        && (isTestRoom || !!def.biomeGroup)
        && (
          (itemUpgrades[def.id] ?? 0) < getMaxUpgrade(def)
          || (result?.success === true && result.itemId === def.id)
        ))
      .sort((a, b) => {
        const aEq = equippedSet.has(a.id) ? 0 : 1;
        const bEq = equippedSet.has(b.id) ? 0 : 1;
        return aEq - bEq || a.tier - b.tier || a.name.localeCompare(b.name);
      });
  }, [inventory, equippedSet, isTestRoom, itemUpgrades, result]);

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
      <WalletSummary essences={essences} catalysts={catalysts} />

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
            const structuralMax = getMaxUpgrade(def);
            const gmCeiling   = isTestRoom ? structuralMax : upgradeCeilingFromGlobalMastery(gm, def.tier);
            const isMaxed     = currentPlus >= structuralMax;
            const gmLocked    = !isTestRoom && !isMaxed && currentPlus + 1 > gmCeiling;
            const diff        = isMaxed ? [] : computeUpgradeDiff(def, currentPlus);

            const reqLevel    = requiredBiomeLevelForUpgrade(def, currentPlus + 1);
            const reqMastery  = globalMasteryRequiredForUpgrade(def.tier, currentPlus + 1);
            const haveLevel   = def.biomeGroup ? (biomeLevel[def.biomeGroup] ?? 0) : 0;
            const levelMet    = isTestRoom || haveLevel >= reqLevel;
            const masteryMet  = isTestRoom || gm >= reqMastery;
            const cost        = upgradeCostFor(def, currentPlus + 1);
            const catalystCost = upgradeCatalystCostFor(def, currentPlus + 1);
            const check       = checkUpgrade({ item: def, currentPlus, biomeLevel: haveLevel, essences, catalysts, globalMastery: gm });
            const canUpgrade  = !isMaxed && (isTestRoom || check.ok);

            const cardResult = result?.itemId === def.id ? result : null;

            const equipped = equippedSet.has(def.id);

            return (
              <div
                key={def.id}
                className={[
                  'craft-recipe',
                  'craft-upgrade',
                  isMaxed ? 'craft-upgrade--maxed' : '',
                  cardResult?.success ? 'craft-upgrade--revealing' : '',
                  // Equipped gear is what an upgrade actually changes about your
                  // character right now, so the card says so with its whole
                  // frame rather than with one grey chip among four badges.
                  equipped ? 'craft-upgrade--equipped' : '',
                ].filter(Boolean).join(' ')}
                style={{ '--upgrade-reveal-tone': tierColor(def.tier) } as CSSProperties}
              >
                {cardResult?.success && (
                  <UpgradeReveal key={cardResult.id} item={def} result={cardResult} />
                )}
                {cardResult && !cardResult.success && (
                  <div className="craft-card-result craft-card-result--err">
                    <span className="craft-card-result__icon">✗</span>
                    <span className="craft-card-result__text">
                      {cardResult.reason ?? 'Upgrade failed'}
                    </span>
                  </div>
                )}

                <div
                  className="craft-recipe__icon"
                  data-slot={slot}
                  style={{
                    borderColor: `${tierColor(def.tier)}77`,
                    background:  `${tierColor(def.tier)}0d`,
                    color:       `${tierColor(def.tier)}cc`,
                  }}
                >
                  {def.icon
                    ? <ItemIcon frameName={def.icon} />
                    : SLOT_LABELS[slot]?.slice(0, 3).toUpperCase()}
                </div>

                <div className="craft-recipe__content">
                  <div className="craft-recipe__header">
                    <span className="craft-recipe__name">{def.name}</span>
                    {currentPlus > 0 && <span className="craft-upgrade__level">+{currentPlus}</span>}
                    <span className="craft-recipe__slot-badge" data-slot={slot}>{SLOT_LABELS[slot] ?? slot}</span>
                    <span className="craft-recipe__tier-badge">T{def.tier}</span>
                    {equipped && (
                      <span className="craft-recipe__equipped-badge">
                        <span className="craft-recipe__equipped-dot" aria-hidden="true" />
                        EQUIPPED
                      </span>
                    )}
                  </div>

                  {isMaxed ? (
                    <div className="craft-upgrade__diff craft-upgrade__diff--maxed">
                      <span className="craft-upgrade__max">MAX +{getMaxUpgrade(def)}</span>
                    </div>
                  ) : diff.length > 0 ? (
                    <div className="craft-upgrade__diff">
                      <span className="craft-upgrade__diff-title">+{currentPlus + 1}</span>
                      {diff.map((row, i) => (
                        <div
                          key={i}
                          className={`craft-upgrade__diff-row craft-upgrade__diff-row--${row.up ? 'up' : 'down'}`}
                        >
                          <span className="craft-upgrade__diff-label">{row.label}</span>
                          <span className="craft-upgrade__diff-from">{row.from}</span>
                          <span className="craft-upgrade__diff-arrow">→</span>
                          <span className="craft-upgrade__diff-to">{row.to}</span>
                          {row.delta && (
                            <span className="craft-upgrade__diff-delta">{row.delta}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {!isMaxed && cost && (
                    <CostDisplay cost={cost} essences={essences} catalystCost={catalystCost ?? undefined} catalysts={catalysts} />
                  )}

                  {!isMaxed && (
                    <div className="craft-recipe__footer">
                      <span className={`craft-upgrade__req${levelMet ? ' craft-upgrade__req--ok' : ' craft-upgrade__req--bad'}`}>
                        {isTestRoom
                          ? 'Test room bypass'
                          : `${biomeName(def.biomeGroup!)} Lv ${reqLevel}${!levelMet ? ` (have ${haveLevel})` : ''}`}
                      </span>
                      {!isTestRoom && (
                        <span className={`craft-upgrade__req${masteryMet ? ' craft-upgrade__req--ok' : ' craft-upgrade__req--bad'}`}>
                          GM {reqMastery}{!masteryMet ? ` (have ${gm})` : ''}
                        </span>
                      )}
                      <button
                        className="craft-recipe__btn"
                        disabled={!canUpgrade || cardResult?.success === true}
                        onClick={() => {
                          if (canUpgrade && cardResult?.success !== true) {
                            hudBus.requestUpgradeItem(def.id);
                          }
                        }}
                      >
                        {canUpgrade
                          ? `Upgrade +${currentPlus + 1}`
                          : gmLocked ? 'Mastery Locked' : !levelMet ? 'Locked' : 'Insufficient'}
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
