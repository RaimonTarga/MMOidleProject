import { useState } from 'react';
import { BrowserPane } from '../hud/primitives';
import { BuildIcon, type BuildIconKind } from './BuildIcon';
import type { IconSource } from './GameIcon';

export interface LoadoutSlot {
  key: string;
  label: string;
  hint: string;
  currentId: string | null;
  /** Short state chip, e.g. "Active". */
  badge?: string;
}

export interface LoadoutCandidate {
  id: string;
  name: string;
  blurb: string;
  icon?: IconSource | null;
  /** Set when the entry exists but cannot go in this slot right now. */
  disabledReason?: string;
}

export interface LoadoutBrowserProps {
  /** Accessible name for the slot list, e.g. "Ability slots". */
  label: string;
  iconKind: BuildIconKind;
  slots: readonly LoadoutSlot[];
  /** Everything eligible for a slot, already filtered by the caller. */
  candidatesFor: (slotKey: string) => LoadoutCandidate[];
  nameOf: (id: string) => string | null;
  blurbOf: (id: string) => string;
  iconOf?: (id: string) => IconSource | null | undefined;
  onEquip: (slotKey: string, id: string | null) => void;
  /** Shown when a slot has nothing eligible — usually "learn some first". */
  emptyCandidates: string;
}

/**
 * Arranging surface for any slotted system: the slots are the master list, and
 * the detail pane shows what can go in the selected one.
 *
 * This replaces the native `<select>` pickers. A dropdown hides every option
 * until opened and gives the player no room to compare them; here the choices
 * are cards with their own text, and the slot's current occupant stays visible
 * while you choose.
 */
export function LoadoutBrowser({
  label,
  iconKind,
  slots,
  candidatesFor,
  nameOf,
  blurbOf,
  iconOf,
  onEquip,
  emptyCandidates,
}: LoadoutBrowserProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(slots[0]?.key ?? null);
  const selected = slots.find((slot) => slot.key === selectedKey) ?? slots[0] ?? null;

  return (
    <BrowserPane
      label={label}
      className="loadout-browser"
      items={slots}
      itemKey={(slot) => slot.key}
      selectedKey={selected?.key ?? null}
      onSelect={setSelectedKey}
      emptyList="No slots available yet."
      emptyDetail="Select a slot to fill it."
      renderItem={(slot) => {
        const name = slot.currentId ? nameOf(slot.currentId) : null;
        return (
          <>
            <BuildIcon
              kind={iconKind}
              label={name ?? slot.label}
              size={28}
              muted={!name}
              icon={slot.currentId ? iconOf?.(slot.currentId) : undefined}
            />
            <span className="loadout-row__main">
              <span className="loadout-row__slot">
                {slot.label}
                {slot.badge && <span className="build-active-chip">{slot.badge}</span>}
              </span>
              <span className={`loadout-row__filled${name ? '' : ' loadout-row__filled--empty'}`}>
                {name ?? 'Empty'}
              </span>
            </span>
          </>
        );
      }}
      renderDetail={(slot) => {
        const candidates = candidatesFor(slot.key);
        const currentName = slot.currentId ? nameOf(slot.currentId) : null;

        return (
          <div className="loadout-detail">
            <div className="loadout-detail__head">
              <div className="make-detail__name">{slot.label}</div>
              <div className="make-detail__meta">{slot.hint}</div>
            </div>

            <div className="loadout-detail__current">
              <span className="make-detail__cost-label">Equipped</span>
              {currentName ? (
                <>
                  <div className="loadout-detail__current-name">{currentName}</div>
                  <p className="make-detail__blurb">{blurbOf(slot.currentId!)}</p>
                  <button
                    type="button"
                    className="craft-recipe__btn"
                    onClick={() => onEquip(slot.key, null)}
                  >
                    Clear slot
                  </button>
                </>
              ) : (
                <div className="loadout-detail__empty">Nothing equipped.</div>
              )}
            </div>

            <span className="make-detail__cost-label">Available</span>
            {candidates.length === 0 ? (
              <div className="loadout-detail__empty">{emptyCandidates}</div>
            ) : (
              <div className="loadout-candidates">
                {candidates.map((candidate) => {
                  const equipped = candidate.id === slot.currentId;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      className={`loadout-candidate${equipped ? ' loadout-candidate--equipped' : ''}`}
                      disabled={equipped || !!candidate.disabledReason}
                      title={candidate.disabledReason}
                      onClick={() => onEquip(slot.key, candidate.id)}
                    >
                      <BuildIcon
                        kind={iconKind}
                        label={candidate.name}
                        size={26}
                        icon={candidate.icon}
                      />
                      <span className="loadout-candidate__main">
                        <span className="loadout-candidate__name">{candidate.name}</span>
                        <span className="loadout-candidate__blurb">
                          {candidate.disabledReason || candidate.blurb}
                        </span>
                      </span>
                      <span className="loadout-candidate__action">
                        {equipped ? 'EQUIPPED' : candidate.disabledReason ? '—' : 'EQUIP'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
