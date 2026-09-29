import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import type { EquipmentSlot } from '@mmo-idle/shared';
import {
  ITEM_DATABASE,
  TEST_ROOM_NODE_ID,
  TUTORIAL_ANCHORS,
  checkUpgrade,
  globalMasteryRequiredForUpgrade,
  getMaxUpgrade,
  requiredBiomeLevelForUpgrade,
  upgradeCostFor,
  upgradeCatalystCostFor,
  upgradeCeilingFromGlobalMastery,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { tutorialFocusAtom } from '../../tutorial/atoms';
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
import { BrowserPane } from '../../hud/primitives';

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

/**
 * Upgrade is a light master/detail browser: every owned item with headroom,
 * equipped first, and everything about the next step in the detail pane.
 * The upgrade system itself is expected to change, so this stays deliberately
 * plain.
 */
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The guided tutorial selects the item it is about to upgrade.
  const tutorialFocus = useAtomValue(tutorialFocusAtom);
  useEffect(() => {
    if (tutorialFocus?.surface === 'upgrade') setSelectedId(tutorialFocus.definitionId);
  }, [tutorialFocus]);
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

  const stepFor = (def: UpgradeItem) => {
    const currentPlus = itemUpgrades[def.id] ?? 0;
    const haveLevel = def.biomeGroup ? (biomeLevel[def.biomeGroup] ?? 0) : 0;
    const check = checkUpgrade({ item: def, currentPlus, biomeLevel: haveLevel, essences, catalysts, globalMastery: gm });
    const isMaxed = currentPlus >= getMaxUpgrade(def);
    return { currentPlus, haveLevel, isMaxed, canUpgrade: !isMaxed && (isTestRoom || check.ok) };
  };

  const selected = items.find((def) => def.id === selectedId) ?? items[0] ?? null;

  return (
    <div className="craft-body craft-body--browser">
      <WalletSummary essences={essences} catalysts={catalysts} />
      <BrowserPane
        label="Upgradeable items"
        className="upgrade-browser"
        items={items}
        itemKey={(def) => def.id}
        selectedKey={selected?.id ?? null}
        onSelect={setSelectedId}
        groupOf={(def) => (equippedSet.has(def.id) ? 'Equipped' : 'In your bag')}
        emptyList="No upgradeable items. Craft or equip gear first."
        renderItem={(def) => {
          const { currentPlus, canUpgrade } = stepFor(def);
          return (
            <span
              className={`upgrade-row${canUpgrade ? '' : ' upgrade-row--blocked'}`}
              data-tutorial-anchor={TUTORIAL_ANCHORS.upgradeRow(def.id)}
            >
              <span
                className="upgrade-row__icon"
                style={{ borderColor: `${tierColor(def.tier)}77`, background: `${tierColor(def.tier)}0d` }}
              >
                {def.icon
                  ? <ItemIcon frameName={def.icon} />
                  : SLOT_LABELS[def.slot]?.slice(0, 3).toUpperCase()}
              </span>
              <span className="upgrade-row__main">
                <span className="upgrade-row__name">{def.name}</span>
                <span className="upgrade-row__meta">{SLOT_LABELS[def.slot] ?? def.slot} · T{def.tier}</span>
              </span>
              {currentPlus > 0 && <span className="craft-upgrade__level">+{currentPlus}</span>}
              <span
                className={`upgrade-row__dot${canUpgrade ? ' upgrade-row__dot--ready' : ''}`}
                title={canUpgrade ? 'Ready to upgrade' : 'Not ready'}
                aria-label={canUpgrade ? 'Ready to upgrade' : 'Not ready'}
              />
            </span>
          );
        }}
        renderDetail={(def) => {
          const slot          = def.slot as EquipmentSlot;
          const { currentPlus, haveLevel, isMaxed, canUpgrade } = stepFor(def);
          const gmCeiling     = isTestRoom ? getMaxUpgrade(def) : upgradeCeilingFromGlobalMastery(gm, def.tier);
          const gmLocked      = !isTestRoom && !isMaxed && currentPlus + 1 > gmCeiling;
          const diff          = isMaxed ? [] : computeUpgradeDiff(def, currentPlus);
          const reqLevel      = requiredBiomeLevelForUpgrade(def, currentPlus + 1);
          const reqMastery    = globalMasteryRequiredForUpgrade(def.tier, currentPlus + 1);
          const levelMet      = isTestRoom || haveLevel >= reqLevel;
          const masteryMet    = isTestRoom || gm >= reqMastery;
          const cost          = upgradeCostFor(def, currentPlus + 1);
          const catalystCost  = upgradeCatalystCostFor(def, currentPlus + 1);
          const cardResult    = result?.itemId === def.id ? result : null;

          return (
            <div className="upgrade-detail">
              <div
                className={`craft-upgrade upgrade-detail__head${cardResult?.success ? ' craft-upgrade--revealing' : ''}`}
                style={{ '--upgrade-reveal-tone': tierColor(def.tier) } as CSSProperties}
              >
                {cardResult?.success && (
                  <UpgradeReveal key={cardResult.id} item={def} result={cardResult} />
                )}
                <span
                  className="craft-recipe__icon"
                  data-slot={slot}
                  style={{ borderColor: `${tierColor(def.tier)}77`, background: `${tierColor(def.tier)}0d` }}
                >
                  {def.icon ? <ItemIcon frameName={def.icon} /> : SLOT_LABELS[slot]?.slice(0, 3).toUpperCase()}
                </span>
                <span className="upgrade-detail__title">
                  <span className="craft-recipe__name">
                    {def.name}
                    {currentPlus > 0 && <span className="craft-upgrade__level">+{currentPlus}</span>}
                  </span>
                  <span className="upgrade-row__meta">
                    {SLOT_LABELS[slot] ?? slot} · T{def.tier}{equippedSet.has(def.id) ? ' · Equipped' : ''}
                  </span>
                </span>
              </div>

              {cardResult && !cardResult.success && (
                <div className="craft-card-result craft-card-result--err">
                  <span className="craft-card-result__icon">✗</span>
                  <span className="craft-card-result__text">{cardResult.reason ?? 'Upgrade failed'}</span>
                </div>
              )}

              {isMaxed ? (
                <div className="craft-upgrade__diff craft-upgrade__diff--maxed">
                  <span className="craft-upgrade__max">MAX +{getMaxUpgrade(def)}</span>
                </div>
              ) : diff.length > 0 && (
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
                      {row.delta && <span className="craft-upgrade__diff-delta">{row.delta}</span>}
                    </div>
                  ))}
                </div>
              )}

              {!isMaxed && (
                <>
                  <div className="make-detail__cost-label">Cost</div>
                  {cost && (
                    <CostDisplay cost={cost} essences={essences} catalystCost={catalystCost ?? undefined} catalysts={catalysts} />
                  )}
                  <div className="upgrade-detail__reqs">
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
                  </div>
                  <button
                    type="button"
                    className="craft-recipe__btn upgrade-detail__btn"
                    data-tutorial-anchor={TUTORIAL_ANCHORS.upgradeAction}
                    disabled={!canUpgrade || cardResult?.success === true}
                    onClick={() => {
                      if (canUpgrade && cardResult?.success !== true) hudBus.requestUpgradeItem(def.id);
                    }}
                  >
                    {canUpgrade
                      ? `Upgrade to +${currentPlus + 1}`
                      : gmLocked ? 'Mastery Locked' : !levelMet ? 'Locked' : 'Insufficient'}
                  </button>
                </>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
