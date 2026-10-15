import type Phaser from 'phaser';
import { classBudget, type MonsterView } from '@mmo-idle/shared';
import { getOwnView, type RenderState } from '../render/state';
import { DEPTH } from '../render/depth';
import type { GameScene } from '../scenes/GameScene';
import { sigilCap } from './SigilRing';

interface RingRuntime {
  graphics: Phaser.GameObjects.Graphics;
  targetId: string | null;
}

const rings = new WeakMap<RenderState, RingRuntime>();
const VIOLET = 0xae85f4;

/**
 * The protocol exposes the local target's sigil count. Other monsters' status lists are
 * target-scoped and carry no owner, so they cannot reliably show this Apprentice's sigils.
 */
export function drawSigilWorldRing(state: RenderState, scene: GameScene): void {
  let ring = rings.get(state);
  if (ring && !ring.graphics.scene) {
    rings.delete(state);
    ring = undefined;
  }
  ring?.graphics.clear();
  if (ring) ring.targetId = null;

  const player = getOwnView(state);
  if (!player || player.isDead || player.combatArchetype !== 'dot' || player.classConfig?.system.kind !== 'payoffs') return;
  const targetId = player.attackTargetId;
  if (!targetId || state.kind.get(targetId) !== 'monster') return;
  const monster = state.view.get(targetId) as MonsterView | undefined;
  const sprite = state.sprite.get(targetId);
  const shadow = state.shadow.get(targetId);
  if (!monster || monster.hp <= 0 || monster.concealed || monster.nodeId !== player.nodeId || !sprite?.visible || !shadow) return;
  const cap = sigilCap(classBudget('dot', player.globalMastery).value, player.passives);
  const stacks = Math.max(0, player.targetDotStacks);

  if (!ring || !ring.graphics.scene) {
    ring = { graphics: scene.add.graphics(), targetId };
    rings.set(state, ring);
  }
  ring.targetId = targetId;
  const g = ring.graphics;
  const zoom = scene.cameras.main.zoom || 1;
  const pipRadius = Math.max(2.5, 2 / zoom);
  // More room makes a wider ring, outside the shadow and the ordinary target mark.
  const radiusX = shadow.width * 0.7 + cap * pipRadius;
  const radiusY = shadow.height * 0.7 + cap * pipRadius * 0.5;
  g.setPosition(shadow.x, shadow.y).setDepth(DEPTH.SHADOW + shadow.y + 2);
  for (let index = 0; index < cap; index++) {
    const angle = (index / cap) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;
    g.fillStyle(index < stacks ? VIOLET : 0x271f36, 0.95);
    g.fillCircle(x, y, pipRadius);
    g.lineStyle(Math.max(1, 1 / zoom), VIOLET, index < stacks ? 1 : 0.6);
    g.strokeCircle(x, y, pipRadius);
  }
}

export function destroySigilWorldRing(state: RenderState, id: string): void {
  const ring = rings.get(state);
  if (!ring || (id !== ring.targetId && id !== state.ownId)) return;
  ring.graphics.destroy();
  rings.delete(state);
}
