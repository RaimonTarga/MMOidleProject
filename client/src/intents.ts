import type { AutocombatConfig, EquipmentSlot, EquippedAbilities, EquippedRule, EvolveMode, StanceSlot } from '@mmo-idle/shared';

export interface IntentMap {
  toggleAuto: undefined;
  setAutoTraverse: boolean;
  setAutocombatConfig: AutocombatConfig;
  setRuneLoadout: EquippedRule[];
  craftRuneRecipe: string;
  craftAbilityRecipe: string;
  setAbilityLoadout: { equipped: EquippedAbilities };
  craftStanceRecipe: string;
  setStanceLoadout: { slot: StanceSlot; stanceId: string | null };
  craftRiteRecipe: string;
  setRiteLoadout: { riteIds: string[] };
  activateDungeonAltar: undefined;
  unlockSkill: string;
  resetClass: undefined;
  equipItem: string;
  unequipItem: EquipmentSlot;
  craftRecipe: string;
  evolveItem: { recipeId: string; mode: EvolveMode };
  upgradeItem: string;
  navigateTo: { path: string[] };
  goToTestRoom: undefined;
  teleportToNode: string;
  leaveTestRoom: undefined;
  resetProgress: undefined;
  renameCharacter: string;
  equipPhaseTester: undefined;
  killNodeMonsters: undefined;
  setRewardMultiplier: number;
  startPlaytestLogging: undefined;
  stopPlaytestLogging: undefined;
  tacticalView: undefined;
  joinParty: string;
  leaveParty: undefined;
  ackDeath: undefined;
  emote: string;
}

type IntentKind = keyof IntentMap;
type IntentHandler<K extends IntentKind> = (payload: IntentMap[K]) => void;
type HandlerSets = { [K in IntentKind]?: Set<IntentHandler<K>> };

const handlers: HandlerSets = {};

export const intents = {
  emit<K extends IntentKind>(kind: K, payload: IntentMap[K]): void {
    const set = handlers[kind] as Set<IntentHandler<K>> | undefined;
    if (!set) return;
    for (const handler of set) handler(payload);
  },

  on<K extends IntentKind>(kind: K, handler: IntentHandler<K>): () => void {
    let set = handlers[kind] as Set<IntentHandler<K>> | undefined;
    if (!set) {
      set = new Set<IntentHandler<K>>();
      handlers[kind] = set as HandlerSets[K];
    }
    set.add(handler);
    return () => set.delete(handler);
  },
};
