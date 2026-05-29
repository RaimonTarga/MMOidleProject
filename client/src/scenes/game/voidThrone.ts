import { NODE_BIOMES } from '@mmo-idle/shared';
import { getOwnView } from '../../render/state';
import type { GameScene } from './GameScene';

export const ABYSSAL_THRONE_FEATURE_ID = 'abyssal_throne';

/** Phase 3 (The Flood) or void overlord dead — throne hazard / block lifted. */
const VOID_OVERLORD_VULNERABLE_STAGE_INDEX = 2;

function nodeHasVoidOverlordDungeon(nodeId: string): boolean {
  return NODE_BIOMES[nodeId]?.bossTypeId === 'void-overlord';
}

function findVoidOverlordInNode(scene: GameScene, nodeId: string) {
  for (const id of scene.state.ids) {
    if (scene.state.kind.get(id) !== 'monster') continue;
    const view = scene.state.view.get(id);
    if (
      !view ||
      !('monsterTypeId' in view) ||
      view.monsterTypeId !== 'void-overlord' ||
      view.nodeId !== nodeId
    ) {
      continue;
    }
    return view;
  }
  return undefined;
}

export function setVoidThroneHazardLifted(scene: GameScene, lifted: boolean): void {
  if (scene.state.voidThroneHazardLifted === lifted) return;
  scene.state.voidThroneHazardLifted = lifted;
}

/** True during phase 3 environmental flood while the boss is still alive. */
export function isVoidFloodActive(scene: GameScene): boolean {
  const own = getOwnView(scene.state);
  if (!own) return false;

  const overlord = findVoidOverlordInNode(scene, own.nodeId);
  if (!overlord) return false;

  const status =
    'ultimateStatus' in overlord ? overlord.ultimateStatus : undefined;
  if (!status?.hazard) return false;
  return (
    status.stageIndex === VOID_OVERLORD_VULNERABLE_STAGE_INDEX &&
    !status.invulnerable
  );
}

export function isVoidThroneUnblocked(scene: GameScene): boolean {
  const own = getOwnView(scene.state);
  if (!own) return false;

  const nodeId = own.nodeId;

  const respawn = scene.state.voidOverlordRespawn;
  if (respawn?.payload.nodeId === nodeId) return true;

  if (scene.state.voidThroneHazardLifted && nodeHasVoidOverlordDungeon(nodeId)) {
    return true;
  }

  const overlord = findVoidOverlordInNode(scene, nodeId);
  if (!overlord) {
    return nodeHasVoidOverlordDungeon(nodeId);
  }

  const status =
    'ultimateStatus' in overlord ? overlord.ultimateStatus : undefined;
  if (!status) return false;
  return (
    status.stageIndex === VOID_OVERLORD_VULNERABLE_STAGE_INDEX &&
    !status.invulnerable
  );
}
