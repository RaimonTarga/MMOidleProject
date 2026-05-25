import type { NodeSnapshot, CombatEvent } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { upsertPlayer } from '../render/players';
import { upsertMonster } from '../render/monsters';
import { destroyEntity } from '../render/destroy';
import { getOwnSnapshot } from '../render/state';

export function applySnapshot(
  state: RenderState,
  snapshot: NodeSnapshot,
  scene: GameScene,
): void {
  const livePlayers = new Set(snapshot.players.map((p) => p.id));
  for (const id of [...state.ids]) {
    if (
      state.kind.get(id) === 'player' &&
      id !== state.ownId &&
      !livePlayers.has(id)
    ) {
      destroyEntity(state, id, scene);
    }
  }
  for (const p of snapshot.players) upsertPlayer(state, p, scene);

  for (const ev of snapshot.events) dispatchCombatEvent(state, ev, scene);

  const liveMonsters = new Set(snapshot.monsters.map((m) => m.id));
  for (const id of [...state.ids]) {
    if (state.kind.get(id) === 'monster' && !liveMonsters.has(id)) {
      destroyEntity(state, id, scene);
    }
  }
  for (const m of snapshot.monsters) upsertMonster(state, m, scene);

  const own = getOwnSnapshot(state);
  if (own) hudBus.emit({ player: own });
}

export function dispatchCombatEvent(
  state: RenderState,
  ev: CombatEvent,
  scene: GameScene,
): void {
  scene.processCombatEventViaApplier(state, ev);
}
