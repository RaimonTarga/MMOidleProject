import {
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
  type DeltaSnapshot,
  type NetworkedEntity,
  type SpectatorPlayer,
} from "@mmo-idle/shared";

function presentationDefaults(projection: SpectatorPlayer): Partial<NetworkedEntity> {
  return {
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: {} as never,
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: projection.playerTier,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      visitedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: emptyEquippedAbilities(),
      knownStances: [],
      equippedStances: emptyEquippedStances(),
      activeStance: null,
      knownRites: [],
      equippedRites: emptyEquippedRites(),
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: projection.selectedClass,
      selectedSubVariant: projection.selectedSubVariant,
      selectedRange: projection.selectedRange,
      combatArchetype: projection.combatArchetype,
    },
  };
}

/**
 * Add client-only presentation defaults and recover remove transitions from the
 * spectator stream's full snapshots. Same-node removals are real despawns/deaths
 * and must pass through deltaApplier's remove path so monster death FX can run;
 * node changes deliberately use the silent full-snapshot cleanup path.
 */
export function hydrateSpectatorSnapshot(
  snapshot: DeltaSnapshot,
  previousNodeId: string | null = null,
  previousIds: Iterable<string> = [],
): DeltaSnapshot {
  const deltas = snapshot.deltas.map((delta) => {
    if (delta.kind === "remove" || !delta.components?.spectatorPlayer) return delta;
    return {
      ...delta,
      components: {
        ...delta.components,
        ...presentationDefaults(delta.components.spectatorPlayer),
      },
    };
  });

  if (previousNodeId === snapshot.nodeId) {
    const liveIds = new Set(
      snapshot.deltas
        .filter((delta) => delta.kind === "add")
        .map((delta) => delta.netId),
    );
    const alreadyRemoved = new Set(
      snapshot.deltas
        .filter((delta) => delta.kind === "remove")
        .map((delta) => delta.netId),
    );
    for (const id of previousIds) {
      if (!liveIds.has(id) && !alreadyRemoved.has(id)) {
        deltas.push({ kind: "remove", netId: id });
      }
    }
  }

  return {
    ...snapshot,
    deltas,
  };
}
