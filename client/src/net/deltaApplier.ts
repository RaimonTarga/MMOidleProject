import type { DeltaSnapshot, NetworkedEntity } from '@mmo-idle/shared';
import { composeMonsterView, composePlayerView } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { upsertPlayer } from '../render/players';
import { upsertMonster } from '../render/monsters';
import { destroyEntity } from '../render/destroy';
import { getOwnView } from '../render/state';
import { dispatchCombatEvent } from '../render/combatFx';

export function applyDelta(
  state: RenderState,
  snapshot: DeltaSnapshot,
  scene: GameScene,
): void {
  const liveIds = new Set<string>();

  for (const delta of snapshot.deltas) {
    if (delta.kind === 'remove') {
      destroyEntity(state, delta.netId, scene);
      continue;
    }

    let entity = state.entity.get(delta.netId);
    if (!entity) {
      entity = {};
      state.entity.set(delta.netId, entity);
    }

    if (delta.kind === 'add') {
      state.ids.add(delta.netId);
      state.kind.set(delta.netId, delta.entityKind);
      liveIds.add(delta.netId);
    }

    if (delta.components) {
      Object.assign(entity, delta.components);
    }
    if (delta.kind === 'patch') {
      for (const key of delta.removed ?? []) {
        delete (entity as Record<string, unknown>)[key];
      }
    }

    upsertEntityView(state, delta.netId, entity, scene);
  }

  if (snapshot.full) {
    for (const id of [...state.ids]) {
      if (!liveIds.has(id)) destroyEntity(state, id, scene);
    }
  }

  for (const ev of snapshot.events) dispatchCombatEvent(state, ev, scene);

  const own = getOwnView(state);
  if (own) hudBus.emit({ player: own });
}

function upsertEntityView(
  state: RenderState,
  id: string,
  entity: NetworkedEntity,
  scene: GameScene,
): void {
  const kind = state.kind.get(id);
  if (kind === 'player') {
    const player = composePlayerView(entity);
    if (!player) return;
    upsertPlayer(state, player, scene);
    return;
  }
  if (kind === 'monster') {
    const monster = composeMonsterView(entity);
    if (!monster) return;
    upsertMonster(state, monster, scene);
  }
}
