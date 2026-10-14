import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { EquipmentAbilityTags } from '../AbilityTags';
import {
  ITEM_DATABASE, RECIPE_DATABASE, TEST_ROOM_NODE_ID, TUTORIAL_ANCHORS,
  type EquipmentSlot,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { togglePrimaryOverlay } from '../../input/overlayStack';
import { useIsMobile } from '../../hud/useIsMobile';
import {
  equipmentAtom, itemUpgradesAtom, passivesAtom,
  combatArchetypeAtom, selectedRangeAtom, selectedSubVariantAtom, playerTierAtom,
  unlockedSkillsAtom, playerNodeIdAtom,
} from '../../hud/atoms';
import { SLOT_LABELS, biomeName, tierColor } from './constants';
import { buildStatSheet, type SheetRow, type StatSheetData } from './statSheetModel';
import type { ComparePin } from './useFocus';

interface Props { compare: ComparePin }

const pctChange = (before: number, after: number) => (before > 0 ? ((after - before) / before) * 100 : 0);

/**
 * The inventory's comparison column. A bag item: what equipping it would
 * change. An equipped item: what it gives you. Rows never appear or vanish while
 * comparing, and every effect says whether the numbers above account for it.
 * Nothing selected: a pointer to the Stats panel, which owns the character sheet
 * since design §26.4.
 */
export function StatSheet({ compare }: Props) {
  const equipment = useAtomValue(equipmentAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const passives = useAtomValue(passivesAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  // The Stats panel is a desktop menu entry; the phone's is its Stats tab.
  const isMobile = useIsMobile();

  const defId = compare.shown && ITEM_DATABASE.has(compare.shown) ? compare.shown : null;
  const sheet = useMemo(() => buildStatSheet({
    usesSkills: {
      unlockedSkills, passives, selectedClass: combatArchetype ? `${combatArchetype}-root` : null,
      selectedSubVariant, selectedRange, combatArchetype,
    },
    equipment, itemUpgrades, playerTier,
  }, defId), [unlockedSkills, passives, combatArchetype, selectedSubVariant, selectedRange, equipment,
    itemUpgrades, playerTier, defId]);

  const def = defId ? ITEM_DATABASE.get(defId) : undefined;
  const slot = sheet.slot;
  // The relic slot holds the boss trophy, never an item (class-first build plan §3.4).
  const relicLocked = slot === 'relic' && sheet.mode === 'swap';

  function handleAction() {
    if (!def || !slot) return;
    if (sheet.mode === 'contribution') hudBus.requestUnequipItem(slot);
    else hudBus.requestEquipItem(def.id);
  }

  // Design §26.4: the character sheet left the inventory for the Stats panel.
  // With nothing picked, this column only says how to compare and where your
  // numbers live; the comparison and its Equip button stay.
  if (!def) {
    return (
      <div className="inv-stat-sheet inv-stat-sheet--idle" key="character">
        <div className="inv-stat-sheet__item-header">
          <div className="inv-stat-sheet__item-row">
            <span className="inv-stat-sheet__item-name">Compare</span>
          </div>
          <div className="inv-sheet__versus">Click an item to see what it would change, and to equip it.</div>
        </div>
        <div className="inv-stat-sheet__footer">
          {isMobile
            ? <span className="inv-stat-sheet__hint">Your full numbers are under the Stats tab.</span>
            : (
              <button type="button" className="inv-stat-sheet__btn" onClick={() => togglePrimaryOverlay('stats')}>
                Open your Stats
              </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inv-stat-sheet${compare.preview ? ' inv-stat-sheet--preview' : ''}`}
      // Keyed so the changed values replay their arrival when the subject changes.
      key={defId ?? 'character'}
    >
      <SheetHeader sheet={sheet} defId={defId} />
      <Headline sheet={sheet} />
      <SheetRows sheet={sheet} />
      {def && <SheetEffects sheet={sheet} />}
      {def && <EquipmentAbilityTags item={def} />}
      {def?.description && <p className="inv-stat-sheet__flavor">{def.description}</p>}

      <div className="inv-stat-sheet__footer">
        {!def && <span className="inv-stat-sheet__hint">Click an item to pin a comparison</span>}
        {def && (
          <div className="inv-sheet__foot">
            <span className="inv-sheet__pin">
              {compare.preview
                ? 'Previewing · click to pin'
                : compare.pinned === defId ? 'Pinned · click it again to unpin' : ''}
            </span>
            <button
              type="button"
              className={`inv-stat-sheet__btn${sheet.mode === 'contribution' ? ' inv-stat-sheet__btn--unequip' : ''}`}
              disabled={relicLocked}
              data-tutorial-anchor={TUTORIAL_ANCHORS.inventoryAction}
              onClick={handleAction}
            >
              {relicLocked
                ? 'Relics unlock at Tier 4'
                : sheet.mode === 'contribution' ? 'Unequip' : sheet.replacesId ? 'Replace' : 'Equip'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SheetHeader({ sheet, defId }: {
  sheet: StatSheetData; defId: string | null;
}) {
  const def = defId ? ITEM_DATABASE.get(defId) : undefined;
  if (!def || !sheet.slot) {
    return (
      <div className="inv-stat-sheet__item-header">
        <div className="inv-stat-sheet__item-row">
          <span className="inv-stat-sheet__item-name">Your character</span>
          <span className="inv-stat-sheet__slot-label">All gear</span>
        </div>
        <div className="inv-sheet__versus">Everything you have equipped</div>
      </div>
    );
  }
  const slot = sheet.slot as EquipmentSlot;
  const color = tierColor(def.tier);
  const group = RECIPE_DATABASE.get(def.id)?.recipeGroup;
  const replaces = sheet.replacesId ? ITEM_DATABASE.get(sheet.replacesId) : undefined;
  return (
    <div className="inv-stat-sheet__item-header" style={{ borderColor: `${color}44` }}>
      <div className="inv-stat-sheet__item-row">
        <span className="inv-stat-sheet__item-name">{def.name}</span>
        <span className="inv-stat-sheet__tier" style={{ color }}>T{def.tier}</span>
        <span className="inv-stat-sheet__slot-label">{SLOT_LABELS[slot]}</span>
      </div>
      {group && <div className="inv-stat-sheet__biome">{biomeName(group)}</div>}
      <div className="inv-sheet__versus">
        {sheet.mode === 'contribution'
          ? 'Equipped · what it gives you'
          : replaces
            ? <>vs <b>{replaces.name}</b> (equipped)</>
            : `Fills your empty ${SLOT_LABELS[slot].toLowerCase()} slot`}
      </div>
    </div>
  );
}

function Headline({ sheet }: { sheet: StatSheetData }) {
  const tile = (label: string, pair: { before: number; after: number }, digits: number) => {
    const fmt = (v: number) => v.toFixed(digits);
    const delta = pair.after - pair.before;
    // Anything that survives rounding counts as a change; tiny ones say so exactly.
    const moved = Math.abs(delta) >= 0.5 * 10 ** -digits;
    const dir = !moved ? 0 : delta > 0 ? 1 : -1;
    const signed = `${delta > 0 ? '+' : ''}${fmt(delta)}`;
    const p = pctChange(pair.before, pair.after);
    const note = sheet.mode === 'character'
      ? ' '
      : !moved
        ? (sheet.mode === 'contribution' ? 'no effect' : 'unchanged')
        : sheet.mode === 'contribution'
          // Against "no item at all" a percentage is meaningless; the amount is not.
          ? `${signed} from this item`
          : Math.abs(p) >= 1 ? `${p > 0 ? '+' : ''}${Math.round(p)}% from ${fmt(pair.before)}` : `${signed} from ${fmt(pair.before)}`;
    return (
      <div className={`inv-sheet__big${dir > 0 ? ' inv-sheet__big--up' : dir < 0 ? ' inv-sheet__big--down' : ''}`}>
        <span>{label}</span>
        <b>{fmt(pair.after)}</b>
        <em>{note}</em>
      </div>
    );
  };
  return (
    <div className="inv-sheet__bigs">
      {tile('Est. DPS', sheet.dps, 1)}
      {tile('Toughness', sheet.toughness, 0)}
    </div>
  );
}

function SheetRows({ sheet }: { sheet: StatSheetData }) {
  const comparing = sheet.mode !== 'character';
  const groups: { name: string; rows: SheetRow[] }[] = [];
  for (const row of sheet.rows) {
    const last = groups[groups.length - 1];
    if (last?.name === row.def.group) last.rows.push(row);
    else groups.push({ name: row.def.group, rows: [row] });
  }
  return (
    <div className="inv-stat-sheet__rows">
      {groups.map((group) => (
        <div key={group.name} className="inv-sheet__group">
          <div className="inv-sheet__group-label">{group.name}</div>
          {group.rows.map((row) => {
            const delta = row.after - row.before;
            const magnitude = row.changed
              ? Math.min(100, Math.abs(row.before !== 0 ? (delta / row.before) * 100 : 100))
              : 0;
            const tone = row.direction > 0 ? 'up' : row.direction < 0 ? 'down' : '';
            return (
              <div
                key={row.def.key}
                className={[
                  'inv-stat-row',
                  comparing && !row.changed ? 'inv-stat-row--idle' : '',
                  row.changed ? `inv-stat-row--changed inv-stat-row--${tone}` : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="inv-stat-row__label">{row.def.label}</span>
                <span className="inv-stat-row__value">
                  {row.changed && sheet.mode === 'swap' && (
                    <>
                      <span className="inv-stat-row__was">{row.def.fmt(row.before)}</span>
                      <span className="inv-stat-row__arrow">→</span>
                    </>
                  )}
                  <span className="inv-stat-row__now">{row.def.fmt(row.after)}</span>
                </span>
                {comparing && (
                  <span className={`inv-sheet__chip${tone ? ` inv-sheet__chip--${tone}` : ''}`}>
                    {row.changed ? row.def.fmtDelta(delta) : '±0'}
                  </span>
                )}
                {row.changed && (
                  <i className={`inv-sheet__mag inv-sheet__mag--${tone}`} style={{ width: `${magnitude}%` }} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SheetEffects({ sheet }: { sheet: StatSheetData }) {
  const { counted, uncounted, notes, lost } = sheet.effects;
  const numbersLabel = sheet.mode === 'contribution' ? 'In the numbers above' : 'Counted in DPS / Toughness';
  if (!counted.length && !uncounted.length && !notes.length && !lost.length && !sheet.relicRows.length) return null;
  const list = (items: string[], tag: string, cls: string) => (
    <ul className="inv-stat-sheet__effects-list">
      {items.map((line, i) => (
        <li key={i} className={`inv-sheet__fx inv-sheet__fx--${cls}`}>
          <span className="inv-sheet__tag" aria-hidden="true">{tag}</span>{line}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="inv-stat-sheet__effects">
      {counted.length > 0 && <><div className="inv-stat-sheet__effects-label">{numbersLabel}</div>{list(counted, '✓', 'counted')}</>}
      {uncounted.length > 0 && <><div className="inv-stat-sheet__effects-label">Not in the estimate</div>{list(uncounted, '◇', 'uncounted')}</>}
      {notes.length > 0 && list(notes, '·', 'note')}
      {lost.length > 0 && <><div className="inv-stat-sheet__effects-label">You would lose</div>{list(lost, '✕', 'lost')}</>}
      {sheet.relicRows.length > 0 && (
        <>
          <div className="inv-stat-sheet__effects-label">Class mechanic</div>
          {sheet.relicRows.map((row, i) => (
            <div key={i} className={row.before === undefined ? 'inv-sheet__note' : 'inv-stat-row inv-stat-row--relic'}>
              {row.before === undefined ? row.label : <span className="inv-stat-row__label">{row.label}</span>}
              {row.before !== undefined && (
                <span className="inv-stat-row__value">
                  <span className="inv-stat-row__was">{row.before}</span>
                  <span className="inv-stat-row__arrow">→</span>
                  <span className="inv-stat-row__now">{row.after}</span>
                </span>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
