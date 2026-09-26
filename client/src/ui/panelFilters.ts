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

/**
 * Ordering the Make list can take. `default` is new-first — the answer to "what
 * changed while I was out" — then affordable, then the canonical kind/tier/name
 * order everything else uses.
 */
export type MakeSort = 'default' | 'name' | 'tier' | 'cost';

export interface GearFilters<Slot extends string = string> {
  biome: string | null;
  slot: Slot | null;
  tier: number | null;
}

export interface MakeFilters {
  kind: MakeKind | null;
  biome: string | null;
  tier: number | null;
  hideUnaffordable: boolean;
  showLocked: boolean;
  sort: MakeSort;
  search: string;
}

export const EMPTY_GEAR_FILTERS: GearFilters<never> = { biome: null, slot: null, tier: null };

export const EMPTY_MAKE_FILTERS: MakeFilters = {
  kind: null,
  biome: null,
  tier: null,
  hideUnaffordable: false,
  showLocked: false,
  sort: 'default',
  search: '',
};

const opts = { getOnInit: true };

export const backpackFiltersAtom = atomWithStorage<GearFilters<EquipmentSlot>>(
  'hud.filters.backpack', EMPTY_GEAR_FILTERS, undefined, opts,
);
export const upgradeFiltersAtom = atomWithStorage<GearFilters>(
  'hud.filters.upgrade', EMPTY_GEAR_FILTERS, undefined, opts,
);
export const makeFiltersAtom = atomWithStorage<MakeFilters>(
  'hud.filters.make', EMPTY_MAKE_FILTERS, undefined, opts,
);
