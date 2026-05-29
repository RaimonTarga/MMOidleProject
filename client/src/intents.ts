import type { EquipmentSlot } from '@mmo-idle/shared';

export interface IntentMap {
  toggleAuto: undefined;
  setAutoTraverse: boolean;
  unlockSkill: string;
  equipItem: string;
  unequipItem: EquipmentSlot;
  craftRecipe: string;
  upgradeItem: string;
  navigateTo: { path: string[] };
  goToTestRoom: undefined;
  teleportToNode: string;
  leaveTestRoom: undefined;
  resetProgress: undefined;
  refreshRecipes: undefined;
  equipPhaseTester: undefined;
  tacticalView: undefined;
  joinParty: string;
  leaveParty: undefined;
  ackDeath: undefined;
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
