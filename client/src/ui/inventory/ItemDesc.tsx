import { ITEM_DATABASE, RECIPE_DATABASE } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { SLOT_LABELS, STAT_LABELS, biomeName, tierColor } from './constants';
import type { FocusedItem } from './useFocus';

interface Props {
  focused: FocusedItem | null;
  onFocus: (item: FocusedItem | null) => void;
}

export function ItemDesc({ focused, onFocus }: Props) {
  if (!focused) {
    return (
      <div className="inv-desc inv-desc--empty">
        Hover an item to see details
      </div>
    );
  }

  const item = focused;
  const def = ITEM_DATABASE.get(item.defId);
  if (!def) return null;

  const recipe = RECIPE_DATABASE.get(item.defId);
  const color  = tierColor(def.tier);

  const stats: { label: string; value: string }[] = [];
  if (def.attacksPerSecond !== undefined) {
    stats.push({ label: 'APS', value: String(def.attacksPerSecond) });
  }
  for (const [k, v] of Object.entries(def.statModifiers)) {
    stats.push({ label: STAT_LABELS[k] ?? k, value: `${v > 0 ? '+' : ''}${v}` });
  }

  const isEquipped = item.source === 'equipped';

  function handleAction() {
    if (isEquipped && item.equipSlot) {
      hudBus.requestUnequipItem(item.equipSlot);
    } else {
      hudBus.requestEquipItem(item.defId);
    }
  }

  return (
    <div
      className="inv-desc"
      style={{ borderColor: `${color}55` }}
      onMouseEnter={() => onFocus(item)}
      onMouseLeave={() => onFocus(null)}
    >
      <div className="inv-desc__header">
        <span className="inv-desc__name">{def.name}</span>
        <span className="inv-desc__tier-badge" style={{ color, borderColor: `${color}66`, background: `${color}18` }}>
          T{def.tier}
        </span>
        <span className="inv-desc__slot">{SLOT_LABELS[def.slot]}</span>
      </div>
      {recipe?.recipeGroup && (
        <div className="inv-desc__biome">{biomeName(recipe.recipeGroup)}</div>
      )}
      <div className="inv-desc__divider" />
      {stats.length > 0 && (
        <div className="inv-desc__stats">
          {stats.map(s => (
            <span key={s.label} className="inv-desc__stat">
              <span className="inv-desc__stat-value">{s.value}</span>
              <span className="inv-desc__stat-label">{s.label}</span>
            </span>
          ))}
        </div>
      )}
      {def.description && (
        <div className="inv-desc__text">{def.description}</div>
      )}
      <button
        className={`inv-desc__btn${isEquipped ? ' inv-desc__btn--unequip' : ''}`}
        onClick={handleAction}
      >
        {isEquipped ? 'Unequip' : 'Equip'}
      </button>
    </div>
  );
}
