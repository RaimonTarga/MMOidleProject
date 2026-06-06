import type { AdminAction, AdminActionResult } from '@mmo-idle/shared';
import type { World } from '../world/World';
import { log } from '../log';
import {
  equipPhaseTester,
  goToTestRoom,
  leaveTestRoom,
  refreshPlayerRecipes,
  resetPlayerClass,
  resetPlayerProgress,
  respawnNode,
  teleportPlayerToNode,
} from './gameActions';

export function runAdminAction(
  world: World,
  requestId: string,
  action: AdminAction,
): AdminActionResult {
  const result = runAction(world, action);
  log.info(
    {
      action: action.kind,
      targetPlayerId: 'targetPlayerId' in action ? action.targetPlayerId : undefined,
      nodeId: 'nodeId' in action ? action.nodeId : undefined,
      ok: result.ok,
    },
    `admin action ${result.ok ? 'succeeded' : 'failed'}: ${action.kind}`,
  );
  return {
    requestId,
    ok: result.ok,
    action,
    message: result.message,
  };
}

function runAction(
  world: World,
  action: AdminAction,
): { ok: boolean; message: string } {
  switch (action.kind) {
    case 'respawnNode':
      return respawnNode(world, action.nodeId);
    case 'killPlayer': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      if (player.isDead) return { ok: false, message: 'Player is already dead.' };
      world.killPlayer(action.targetPlayerId, {
        kind: 'debt',
        damage: player.hasHealth.hp,
        nodeId: player.hasPosition.nodeId,
      });
      return { ok: true, message: 'Player killed.' };
    }
    case 'respawnPlayer': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      world.respawnPlayer(action.targetPlayerId);
      return { ok: true, message: 'Player respawned.' };
    }
    case 'resetProgress': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      return resetPlayerProgress(world, player);
    }
    case 'resetClass': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      return resetPlayerClass(world, player, { requireAltar: false });
    }
    case 'teleportPlayer': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      return teleportPlayerToNode(world, player, action.nodeId);
    }
    case 'refreshRecipes': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      return refreshPlayerRecipes(world, player);
    }
    case 'equipPhaseTester': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      return equipPhaseTester(world, player);
    }
    case 'goToTestRoom': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      return goToTestRoom(world, player);
    }
    case 'leaveTestRoom': {
      const player = world.getPlayerEntity(action.targetPlayerId);
      if (!player) return { ok: false, message: 'Player not found.' };
      return leaveTestRoom(world, player);
    }
  }
}
