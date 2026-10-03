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
  menuAbilities: 'menu.abilities',
  menuRunes: 'menu.runes',
  menuMap: 'menu.map',
  classChoices: 'skills.choices',
  classConfirm: 'skills.confirm',
  makeAction: 'make.action',
  inventoryAction: 'inventory.action',
  runesBoard: 'runes.board',
  altar: 'dungeon.altar',
  respawn: 'death.respawn',
  makeRow: (entryKey: string) => `make.row:${entryKey}`,
  inventoryItem: (definitionId: string) => `inventory.item:${definitionId}`,
  /** The equipped slot that opens its lineage tree (weapon only, for now). */
  equipmentSlot: (slot: string) => `inventory.slot:${slot}`,
  /** One card in a lineage tree: pressing it buys it, or makes it active. */
  lineageCard: (cardId: string) => `lineage.card:${cardId}`,
  /** One form at a band's gate: pressing it pays the gate, or wears it. */
  lineageForm: (recipeId: string) => `lineage.form:${recipeId}`,
  /** One ring of the rhythm readout near the HP bar, keyed like the ring (a card id). */
  rhythmRing: (ringKey: string) => `hud.rhythm:${ringKey}`,
  abilityAttune: (abilityId: string) => `abilities.attune:${abilityId}`,
  /** "Use default timing" under an attuned ability: adds its reference Rune. */
  abilityTiming: (abilityId: string) => `abilities.timing:${abilityId}`,
  // The Rune board, step by step: + Add rule → When → Do (→ ability) → Add rule.
  runesAdd: 'runes.add',
  runesCommit: 'runes.commit',
  runesWhen: (conditionId: string) => `runes.when:${conditionId}`,
  runesDo: (actionId: string) => `runes.do:${actionId}`,
  runesAbility: (abilityId: string) => `runes.ability:${abilityId}`,
  /** Row controls, keyed by `tutorialRuleKey`. */
  runesUp: (ruleKey: string) => `runes.up:${ruleKey}`,
  runesRemove: (ruleKey: string) => `runes.remove:${ruleKey}`,
} as const;

/** Stable id for one Rune rule, for row anchors. */
export function tutorialRuleKey(rule: { conditionId: string; actionId: string; targetAbilityId?: string }): string {
  return `${rule.conditionId}>${rule.actionId}>${rule.targetAbilityId ?? ''}`;
}

export function tutorialAnchorSelector(anchor: string): string {
  return `[data-tutorial-anchor="${anchor.replace(/"/g, '\\"')}"]`;
}
