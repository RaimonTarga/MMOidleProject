import { useMemo } from 'react';
import { EquipmentAbilityTags } from '../AbilityTags';
import { useAtomValue } from 'jotai';
import {
  compareEquipmentStats, ITEM_DATABASE, RECIPE_DATABASE, resolveRelicComparison, itemMechanicEffectsAt,
  relicRatingsFromPassives, coreEligibilityLabel, coreIsActive, isRestrictedCore,
  type EquipmentSlot, type EquipmentPreviewStat,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  activeStanceAtom, equippedRitesAtom, equipmentAtom, itemUpgradesAtom, passivesAtom,
  combatArchetypeAtom, selectedRangeAtom, selectedSubVariantAtom, playerTierAtom,
  unlockedSkillsAtom, hpAtom, maxHpAtom,
} from '../../hud/atoms';
import { SLOT_LABELS, biomeName, tierColor } from './constants';
import { STAT_META, formatMechanicEffects, formatResolvedRelicProfile, formatWeaponEffects } from '../crafting/itemDisplay';
import type { FocusedItem } from './useFocus';

const num = (v: number) => String(Math.round(v * 100) / 100);
const pct = (v: number) => `${num(v * 100)}%`;
const mult = (v: number) => `×${num(v)}`;
const ROWS: { key: EquipmentPreviewStat; label: string; fmt: (v: number) => string; lowerIsBetter?: boolean }[] = [
  { key: 'dps', label: 'Estimated sustained DPS', fmt: num },
  ...(['attack', 'onHitDamage'] as const).map(key => ({ key, ...STAT_META[key] })),
  { key: 'attacksPerSecond', label: 'Attacks / sec', fmt: num },
  { key: 'damageDealtMult', label: 'Final damage dealt', fmt: mult },
  { key: 'damageTakenMult', label: 'Final damage taken', fmt: mult, lowerIsBetter: true },
  ...(['maxHp', 'recovery', 'plating', 'damageReduction', 'speed', 'attackRange'] as const).map(key => ({ key, ...STAT_META[key] })),
  { key: 'dodgeRate', label: 'Dodge rate', fmt: pct },
  { key: 'evadeMitigation', label: 'Damage avoided per dodge', fmt: pct },
];
interface Props { focused: FocusedItem | null; onFocus: (item: FocusedItem | null) => void }

export function StatSheet({ focused, onFocus }: Props) {
  const equipment = useAtomValue(equipmentAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const passives = useAtomValue(passivesAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const hpFraction = hp / Math.max(1, maxHp);
  const info = useMemo(() => {
    const itemDef = focused ? ITEM_DATABASE.get(focused.defId) : undefined;
    if (!itemDef || !focused) return null;
    const slot = itemDef.slot as EquipmentSlot;
    const isEquipped = focused.source === 'equipped';
    return { itemDef, slot, isEquipped, plus: itemUpgrades[focused.defId] ?? 0,
      recipe: RECIPE_DATABASE.get(focused.defId) ?? null, color: tierColor(itemDef.tier),
      actionLabel: isEquipped ? 'Unequip' : equipment[slot] ? 'Replace' : 'Equip' };
  }, [focused, equipment, itemUpgrades]);
  const comparison = useMemo(() => compareEquipmentStats({
    usesSkills: { unlockedSkills, passives, selectedClass: combatArchetype ? `${combatArchetype}-root` : null,
      selectedSubVariant, selectedRange, combatArchetype },
    equipment, itemUpgrades, playerTier, activeStance, equippedRites, hpFraction,
  }, info?.slot, info?.isEquipped ? null : info?.itemDef.id),
  [unlockedSkills, passives, combatArchetype, selectedSubVariant, selectedRange, equipment, itemUpgrades,
    playerTier, activeStance, equippedRites, hpFraction, info]);

  function handleAction() {
    if (!focused || !info) return;
    if (info.isEquipped && focused.equipSlot) hudBus.requestUnequipItem(focused.equipSlot);
    else hudBus.requestEquipItem(focused.defId);
  }
  return <div className="inv-stat-sheet" onMouseEnter={() => focused && onFocus(focused)} onMouseLeave={() => onFocus(null)}>
      {/* ── Item context header ─────────────────────────── */}
      {info ? (
        <div className="inv-stat-sheet__item-header" style={{ borderColor: `${info.color}44` }}>
          <div className="inv-stat-sheet__item-row">
            <span className="inv-stat-sheet__item-name">{info.itemDef.name}</span>
            {info.plus > 0 && (
              <span className="inv-stat-sheet__plus">+{info.plus}</span>
            )}
            <span className="inv-stat-sheet__tier" style={{ color: info.color }}>T{info.itemDef.tier}</span>
            <span className="inv-stat-sheet__slot-label">{SLOT_LABELS[info.slot]}</span>
          </div>
          {info.recipe?.recipeGroup && (
            <div className="inv-stat-sheet__biome">{biomeName(info.recipe.recipeGroup)}</div>
          )}
          {info.slot === 'core' && info.itemDef.coreEligibility && (() => {
            const elig   = info.itemDef.coreEligibility;
            const active = coreIsActive(elig, selectedRange);
            const gated  = isRestrictedCore(elig);
            const label  = coreEligibilityLabel(elig);
            return (
              <div className={`inv-stat-sheet__core-eligibility${active ? '' : ' inv-stat-sheet__core-eligibility--inactive'}`}>
                {label}{gated ? (active ? ' · active' : ' · inactive') : ''}
              </div>
            );
          })()}
        </div>
      ) : (
        // The rail plate is the at-a-glance read; this sheet is the reference
        // you consult while comparing gear, so it stays an exact table.
        <div className="inv-stat-sheet__heading">EQUIPMENT STATS</div>
      )}


      <div className="inv-stat-sheet__rows">
        {ROWS.filter(row => comparison.relevant.includes(row.key)).map(row => {
          const before = comparison.before.stats[row.key];
          const after = comparison.after.stats[row.key];
          const changed = Math.abs(after - before) > 1e-6;
          const better = row.lowerIsBetter ? after < before : after > before;
          return <div key={row.key} className={`inv-stat-row ${changed ? better ? 'inv-stat-row--up' : 'inv-stat-row--down' : ''}`}>
            <span className="inv-stat-row__label">{row.label}</span>
            <span className="inv-stat-row__value">{row.fmt(before)}</span>
            {info && <>
              <span className="inv-stat-row__arrow">→</span>
              <span className="inv-stat-row__proposed">{row.fmt(after)}</span>
              {!changed && <span className="inv-stat-row__delta">unchanged</span>}
            </>}
          </div>;
        })}
        {comparison.relevant.length === 0 && <p className="inv-stat-sheet__hint">{info ? 'No equipment stat changes. See item effects below.' : 'Equip an item to see its effects on your stats.'}</p>}
      </div>
      {/* ── Mechanic + weapon effects ────────────────────────────────── */}
      {(() => {
        if (!info) return null;
        const lines = [
          ...formatMechanicEffects(itemMechanicEffectsAt(info.itemDef, info.plus)),
          ...(info.itemDef.slot === 'relic'
            ? formatResolvedRelicProfile(resolveRelicComparison(
                combatArchetype,
                comparison.before.passives,
                relicRatingsFromPassives(comparison.before.passives),
                relicRatingsFromPassives(comparison.after.passives),
                { subVariant: selectedSubVariant, playerTier, unlockedSkills, selectedRange },
              ))
            : []),
          ...(info.itemDef.slot === 'weapon' ? formatWeaponEffects(info.itemDef.id) : []),
        ];
        if (lines.length === 0) return null;
        return (
          <div className="inv-stat-sheet__effects">
            <div className="inv-stat-sheet__effects-label">EFFECTS</div>
            <EquipmentAbilityTags item={info.itemDef} plus={info.plus} />
            <ul className="inv-stat-sheet__effects-list">
              {lines.map((line, i) => (
                <li key={i} className="inv-stat-sheet__effects-line">{line}</li>
              ))}
            </ul>
          </div>
        );
      })()}


      {info?.itemDef.description && <p className="inv-stat-sheet__flavor">{info.itemDef.description}</p>}
      <div className="inv-stat-sheet__footer">
        {!info && <span className="inv-stat-sheet__hint">Hover an item to compare</span>}
        {info && <button type="button" className={`inv-stat-sheet__btn${info.isEquipped ? ' inv-stat-sheet__btn--unequip' : ''}`} onClick={handleAction}>{info.actionLabel}</button>}
      </div>
    </div>;
}
