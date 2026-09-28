import { atomWithStorage } from 'jotai/utils';
import type { EquipmentSlot } from '@mmo-idle/shared';
import type { MakeKind } from './crafting/makeEntries';

/**
 * Remembered filter state for the item browsers. Held in atoms (not component
 * state) so closing and reopening a panel keeps its filters; stored so they
 * also survive a reload. Pure presentation — never sent to the server.
 *
 * A remembered value can go stale (e.g. the only T2 item was salvaged), so
 * each panel ignores values that are not among its current facets.
 */

/** The backpack's remembered slot and tier filters. */
export interface GearFilters<Slot extends string = string> {
  slot: Slot | null;
  tier: number | null;
}

/** The Crafting rail's remembered category, and whether locked recipes show. */
export interface MakeFilters {
  kind: MakeKind | null;
  showLocked: boolean;
}

export const EMPTY_GEAR_FILTERS: GearFilters<never> = { slot: null, tier: null };

export const EMPTY_MAKE_FILTERS: MakeFilters = {
  kind: null,
  showLocked: false,
};

const opts = { getOnInit: true };

export const backpackFiltersAtom = atomWithStorage<GearFilters<EquipmentSlot>>(
  'hud.filters.backpack', EMPTY_GEAR_FILTERS, undefined, opts,
);
export const makeFiltersAtom = atomWithStorage<MakeFilters>(
  'hud.filters.make', EMPTY_MAKE_FILTERS, undefined, opts,
);
