import {
  GRAVE_FRAME_COUNT,
  resetTracksCombat,
  type DeathCause,
} from "@mmo-idle/shared";
import type { World } from "../../world/World";
import { attachComponent, detachComponent } from "../../ecs/markerHelpers";
import { mutateSlice } from "../../ecs/dirtyHelpers";
import { stopEntity } from "./movement";
import { clearAutoTraversePath } from "./autoTraverse";
import { setAggroTarget, setAttackTarget } from "../combat/ai/targeting";
import { clearEngagement } from "../combat/ai/engagement";
import { despawnMinionsForOwner } from "../classes/archetypes/summoner";
import {
  buildPlayerDeathPayload,
} from "./deathCause";
import { respawnPlayer } from "./spawning";
import { recordWorldLogEvent } from "../../world/worldLog";
import { actorFromPlayer } from "../../world/worldLogActors";
import { resetDungeonIfNodeWiped } from "./dungeons/dungeon";
import {
  registerCombatListener,
  type CombatContext,
} from "../combat/engine/combatPipeline";

export const SERVER_DEATH_ACK_TIMEOUT_MS = 600_000;

export function initDeadPlayerGuard(): void {
  const cancelIfDeadDefender = (ctx: CombatContext): void => {
    if (ctx.defenderType !== "player") return;
    if (ctx.defender.isDead) ctx.cancelled = true;
  };
  registerCombatListener("beforeAttack", cancelIfDeadDefender);
  registerCombatListener("onDamageTaken", cancelIfDeadDefender);
}

export function killPlayer(
  world: World,
  playerId: string,
  cause: DeathCause,
): void {
  const entity = world.getPlayerEntity(playerId);
  if (!entity || entity.isDead) return;

  const graveFrame = Math.floor(Math.random() * GRAVE_FRAME_COUNT);
  const payload = buildPlayerDeathPayload(entity, cause, graveFrame);

  entity.hasHealth.hp = 0;
  stopEntity(world, entity);
  setAttackTarget(world, entity, null);
  clearAutoTraversePath(world, entity);
  detachComponent(world, entity, "fightsWhileTraveling");
  // Death cancels every standing order, auto-combat included. Preserving `auto`
  // across the respawn meant a character came back already fighting or walking,
  // with no click from the player between dying and moving again. Resuming auto
  // on respawn is a future opt-in setting, and it can only be built on top of a
  // respawn that starts genuinely idle.
  //
  // `mutateSlice` because `usesAutocombat` is networked: assigning in place
  // leaves the AUTO button lit on a client that never gets the patch.
  mutateSlice(world, entity, "usesAutocombat", (s) => {
    s.auto = false;
    s.autoTraverse = false;
  });
  despawnMinionsForOwner(world, entity);
  clearEngagement(world, entity);
  resetTracksCombat(entity.tracksCombat);

  detachComponent(world, entity, "hasAutoIntent");
  detachComponent(world, entity, "hasEmote");
  detachComponent(world, entity, "holdsWards");
  detachComponent(world, entity, "tracksEngagement");
  detachComponent(world, entity, "hasEmpoweredAttack");
  detachComponent(world, entity, "hasSweepClip");
  detachComponent(world, entity, "hasFormationTechnique");
  detachComponent(world, entity, "isChanneling");
  detachComponent(world, entity, "hasOverdrive");
  detachComponent(world, entity, "hasAlignment");
  detachComponent(world, entity, "inAcChargePhase");
  detachComponent(world, entity, "inAcDischarge");

  for (const e of world.aggroedMonsters) {
    if (
      e.hasAggroTarget.targetKind === "player" &&
      e.hasAggroTarget.targetId === playerId
    ) {
      setAggroTarget(world, e, null, Date.now());
    }
  }

  attachComponent(world, entity, "isDead", {
    graveFrame,
    diedAtMs: Date.now(),
  });
  resetDungeonIfNodeWiped(world, entity.hasPosition.nodeId);

  recordWorldLogEvent(
    world,
    {
      kind: "player-death",
      nodeId: entity.hasPosition.nodeId,
      player: actorFromPlayer(entity),
      cause,
    },
    {
      visibility: "death",
      relatedPlayerIds: [playerId],
      nodeId: entity.hasPosition.nodeId,
    },
  );

  world.analyticsPlayerDeath?.(playerId, entity.hasPosition.nodeId);

  world.pendingDeaths.push({ playerId, payload });
}

export function updateDeadPlayers(world: World, now: number): void {
  for (const player of world.deadPlayers) {
    if (now - player.isDead!.diedAtMs >= SERVER_DEATH_ACK_TIMEOUT_MS) {
      respawnPlayer(world, player.isPlayer.id);
    }
  }
}
