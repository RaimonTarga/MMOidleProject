import type { PlayerView, MonsterView } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';

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
    .setOrigin(0.5, 0)
    .setDepth(DEPTH.UI);

  state.label.set(id, label);
}

export function drawLabels(state: RenderState): void {
  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const label = state.label.get(id);
    const meta = state.spriteMeta.get(id);
    if (!sprite || !label || !meta) continue;

    const barY = sprite.y - meta.barOffsetY;
    label.setPosition(sprite.x, barY - 12);
    label.setDepth(DEPTH.UI + sprite.y);
  }
}

export function updateLabelForGrave(
  state: RenderState,
  id: string,
  player: PlayerView,
  scene: GameScene,
): void {
  const label = state.label.get(id);
  if (!label) return;
  label.setText(player.name);
  label.setColor(player.id === scene.myId ? "#88ccaa" : "#cccccc");
  label.setFontStyle("normal");
  label.setVisible(true);
}

export function updateLabelForLivePlayer(
  state: RenderState,
  id: string,
  snapshot: PlayerView | MonsterView,
  scene: GameScene,
): void {
  const label = state.label.get(id);
  if (!label) return;
  const isMonster = state.kind.get(id) === "monster";
  const monster = isMonster ? (snapshot as MonsterView) : null;
  label.setText(monster?.isBoss ? `⚠ ${monster.name}` : snapshot.name);
  label.setColor(
    isMonster
      ? monster?.isBoss
        ? "#ffcc44"
        : "#ffaaaa"
      : snapshot.id === scene.myId
        ? "#ffffff"
        : "#ffffff",
  );
  label.setFontStyle(monster?.isBoss ? "bold" : "normal");
  label.setVisible(true);
}

export function destroyLabel(state: RenderState, id: string): void {
  state.label.get(id)?.destroy();
  state.label.delete(id);
}
