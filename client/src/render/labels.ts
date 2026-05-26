import type { PlayerView, MonsterView } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';

export function ensureLabel(
  state: RenderState,
  id: string,
  snapshot: PlayerView | MonsterView,
  scene: GameScene,
): void {
  if (state.label.has(id)) return;

  const isMonster = state.kind.get(id) === 'monster';
  const monster = isMonster ? (snapshot as MonsterView) : null;

  const labelText = monster?.isBoss ? `⚠ ${monster.name}` : snapshot.name;
  const labelColor = isMonster
    ? (monster?.isBoss ? '#ffcc44' : '#ffaaaa')
    : '#ffffff';
  const fontSize = monster?.isBoss ? '11px' : '10px';

  const label = scene.add
    .text(0, 0, labelText, {
      color: labelColor,
      fontSize,
      fontFamily: 'monospace',
      fontStyle: monster?.isBoss ? 'bold' : 'normal',
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setDepth(isMonster ? 2 : 5);

  state.label.set(id, label);
}

export function drawLabels(state: RenderState): void {
  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const label = state.label.get(id);
    const meta = state.spriteMeta.get(id);
    if (!sprite || !label || !meta) continue;

    const barY = sprite.y - meta.barOffsetY;
    label.setPosition(sprite.x - 16, barY - 12);
  }
}

export function destroyLabel(state: RenderState, id: string): void {
  state.label.get(id)?.destroy();
  state.label.delete(id);
}
