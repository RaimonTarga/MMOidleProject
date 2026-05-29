import type { ItemDefinition } from './items';

/** Dev-only weapon id — registered only outside production builds. */
export const DEV_PHASE_TESTER_WEAPON_ID = 'dev-phase-tester';

/** Dev-only armor id — grants invulnerability while equipped. */
export const DEV_GODMODE_ARMOR_ID = 'dev-godmode-armor';

export const DEV_PHASE_TESTER_WEAPON: ItemDefinition = {
  id: DEV_PHASE_TESTER_WEAPON_ID,
  name: 'Phase Tester',
  slot: 'weapon',
  tier: 0,
  // Base player attack is 15 — this lands at exactly 400 damage per hit.
  statModifiers: { attack: 385 },
  attacksPerSecond: 1,
  description: 'Dev-only weapon for fast boss phase testing.',
};

export const DEV_GODMODE_ARMOR: ItemDefinition = {
  id: DEV_GODMODE_ARMOR_ID,
  name: 'Godmode Plate',
  slot: 'armor',
  tier: 0,
  statModifiers: {},
  description: 'Dev-only armor. Makes you invulnerable while equipped.',
};

export function registerDevItems(db: Map<string, ItemDefinition>): void {
  db.set(DEV_PHASE_TESTER_WEAPON_ID, DEV_PHASE_TESTER_WEAPON);
  db.set(DEV_GODMODE_ARMOR_ID, DEV_GODMODE_ARMOR);
}
