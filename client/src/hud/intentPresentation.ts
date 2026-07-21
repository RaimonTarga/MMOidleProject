import {
  BIOME_DATABASE,
  MONSTER_DATABASE,
  type HasAutoIntent,
  type PartyMember,
} from "@mmo-idle/shared";

export interface IntentPresentation {
  action: string;
  reason: string;
  source: string;
}

/** Format the server's structured action without inventing AI reasoning. */
export function composeIntentPresentation(
  connectedPlayer: boolean,
  intent: HasAutoIntent | null,
  partyMembers: readonly PartyMember[],
): IntentPresentation {
  if (!connectedPlayer) {
    return {
      action: "Entering the world",
      reason: "Your senses are still settling",
      source: "Awakening",
    };
  }
  if (!intent) {
    return {
      action: "Manual control",
      reason: "",
      source: "",
    };
  }

  return {
    action: actionLabel(intent, partyMembers),
    reason: intent.reason,
    source: intent.source,
  };
}

function actionLabel(
  intent: HasAutoIntent,
  partyMembers: readonly PartyMember[],
): string {
  switch (intent.kind) {
    case "attack": {
      const targetName = intent.targetMonsterTypeId
        ? MONSTER_DATABASE.get(intent.targetMonsterTypeId)?.name
        : undefined;
      return targetName ? `Attacking ${targetName}` : "Attacking target";
    }
    case "follow": {
      const leaderName = intent.leaderId
        ? partyMembers.find((member) => member.id === intent.leaderId)?.name
        : undefined;
      return leaderName ? `Following ${leaderName}` : "Following party leader";
    }
    case "travel": {
      const biomeName = intent.destBiomeGroup
        ? BIOME_DATABASE.get(intent.destBiomeGroup)?.name
        : undefined;
      return biomeName ? `Traveling to ${biomeName}` : "Traveling";
    }
    case "flee":
      return "Retreating";
    case "idle":
      return "Holding position";
  }
}
