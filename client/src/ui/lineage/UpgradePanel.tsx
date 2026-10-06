/**
 * The Upgrade panel (design §26.4): the old Upgrade tab's slot in the menu,
 * named Upgrade. It opens on the worn items — the weapon first, with its band's
 * step pips and a count of what its page sells right now; every other item says
 * it is a plain item (§24.5) — and the weapon opens its page, inside the panel.
 * The equipped weapon in the Inventory still opens the same page on its own.
 *
 * The list is `upgradeListModel.ts`; the page is `WeaponPage`. This file only
 * lays them out.
 */
import { useState } from 'react';
import type { EquipmentSlot } from '@mmo-idle/shared';
import { DialogTab, DialogTabs } from '../../hud/primitives';
import { ItemIcon } from '../ItemIcon';
import { WeaponPage } from './LineageTreePanel';
import { useUpgradeList } from './useUpgradeList';
import type { WornEntry } from './upgradeListModel';
import './upgradePanel.css';

function WornRow({ entry, onOpen }: { entry: WornEntry; onOpen: (slot: EquipmentSlot) => void }) {
  const opens = entry.kind === 'page';
  return (
    <button
      type="button"
      className={`up-item up-item--${entry.kind}`}
      disabled={!opens}
      aria-label={opens ? `${entry.name}: open its page${entry.badge ? `, ${entry.badge}` : ''}` : `${entry.name}: plain item`}
      onClick={() => opens && onOpen(entry.slot)}
    >
      <span className="up-item__icon" aria-hidden="true">
        <ItemIcon frameName={entry.icon} scale={1} />
      </span>
      <span className="up-item__text">
        <span className="up-item__name">{entry.name}</span>
        <span className="up-item__sub">{entry.sub}</span>
      </span>
      <span className="up-item__state">
        {entry.kind === 'page' && (
          <>
            {entry.badge && <span className="up-item__badge">{entry.badge}</span>}
            <span className="up-steps" aria-label={entry.steps.map((s) => `${s.label}${s.done ? ' done' : ''}`).join(', ')}>
              {entry.steps.map((step, i) => (
                <i
                  key={`${step.label}:${i}`}
                  className={`${step.done ? 'is-on' : ''}${step.next ? ' is-next' : ''}`}
                  title={step.label}
                />
              ))}
            </span>
          </>
        )}
        {entry.kind === 'plain' && <span className="up-item__plain">plain item</span>}
        {entry.kind === 'empty' && <span className="up-item__plain">empty</span>}
      </span>
    </button>
  );
}

/** The Upgrade destination's body: the worn items, or a page opened from them. */
export function UpgradeTab() {
  const entries = useUpgradeList();
  const [open, setOpen] = useState<EquipmentSlot | null>(null);
  const opened = open ? entries.find((e) => e.slot === open && e.kind === 'page') : undefined;
  const pageEntries = entries.filter((e) => e.kind === 'page');

  return (
    <div className="up-root">
      <DialogTabs label="Upgrade" className="up-tabs">
        <DialogTab selected={!opened} onSelect={() => setOpen(null)}>Worn items</DialogTab>
        {pageEntries.map((entry) => (
          <DialogTab key={entry.slot} selected={opened?.slot === entry.slot} onSelect={() => setOpen(entry.slot)}>
            {entry.name}
          </DialogTab>
        ))}
      </DialogTabs>
      {opened ? (
        <WeaponPage slot={opened.slot} />
      ) : (
        <div className="up-list">
          {entries.map((entry) => <WornRow key={entry.slot} entry={entry} onOpen={setOpen} />)}
          <p className="up-note">
            Only the weapon has a page. Its steps at Tier 1: form · lean I · II · III · verb · gate.
          </p>
        </div>
      )}
    </div>
  );
}
