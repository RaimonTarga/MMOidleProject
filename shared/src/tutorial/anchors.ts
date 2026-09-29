/**
 * Every UI element the guide may point at, as `data-tutorial-anchor` values.
 *
 * Scripts never name raw strings: the director derives a click path from each
 * step, and components stamp the matching id on the element that performs it.
 */
export const TUTORIAL_ANCHORS = {
  autoCombat: 'hud.auto-combat',
  menuPassiveTree: 'menu.passive-tree',
  menuInventory: 'menu.inventory',
  menuCrafting: 'menu.crafting',
  menuUpgrade: 'menu.upgrade',
  menuAbilities: 'menu.abilities',
  menuRunes: 'menu.runes',
  menuMap: 'menu.map',
  classChoices: 'skills.choices',
  classConfirm: 'skills.confirm',
  makeAction: 'make.action',
  inventoryAction: 'inventory.action',
  upgradeAction: 'upgrade.action',
  runesBoard: 'runes.board',
  altar: 'dungeon.altar',
  respawn: 'death.respawn',
  makeRow: (entryKey: string) => `make.row:${entryKey}`,
  inventoryItem: (definitionId: string) => `inventory.item:${definitionId}`,
  upgradeRow: (definitionId: string) => `upgrade.row:${definitionId}`,
  abilityAttune: (abilityId: string) => `abilities.attune:${abilityId}`,
} as const;

export function tutorialAnchorSelector(anchor: string): string {
  return `[data-tutorial-anchor="${anchor.replace(/"/g, '\\"')}"]`;
}
