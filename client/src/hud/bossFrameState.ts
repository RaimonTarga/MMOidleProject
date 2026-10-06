import { atom, getDefaultStore } from 'jotai';
import { NODE_BIOMES, type MonsterView, type PlayerView } from '@mmo-idle/shared';
import type { RenderState } from '../render/state';
import { bossFrameEqual, bossFrameModel, pickBoss, type BossFrameModel, type BossFrameSource } from './bossFrameModel';

/** The boss the frame shows, or null. Written once a frame, only when it changes. */
export const bossFrameAtom = atom<BossFrameModel | null>(null);

function* monsterViews(state: RenderState): Generator<BossFrameSource> {
  for (const id of state.ids) {
    if (state.kind.get(id) !== 'monster') continue;
    const view = state.view.get(id) as MonsterView | undefined;
    if (view) yield view;
  }
}

/**
 * Resolve the boss frame from the render state the scene already keeps (views and the
 * cast telegraphs `monster-cast-start` writes). Called from the per-frame bar pass.
 */
export function publishBossFrame(state: RenderState, now = Date.now()): void {
  const own = state.ownId ? state.view.get(state.ownId) as PlayerView | undefined : undefined;
  let next: BossFrameModel | null = null;
  if (own && !own.isDead) {
    const picked = pickBoss(monsterViews(state), { id: own.id, nodeId: own.nodeId, attackTargetId: own.attackTargetId });
    if (picked) {
      const tier = NODE_BIOMES[picked.boss.nodeId]?.biomeTier ?? 1;
      next = bossFrameModel(picked.boss, picked.reason, tier, state.castState.get(picked.boss.id), now);
    }
  }
  const store = getDefaultStore();
  if (bossFrameEqual(store.get(bossFrameAtom), next)) return;
  store.set(bossFrameAtom, next);
}
