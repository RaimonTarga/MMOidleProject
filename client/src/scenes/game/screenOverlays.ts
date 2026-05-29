import type { GameScene } from './GameScene';
import { shouldRunClientFx } from '../../fx/guard';
import { DEPTH } from '../../render/depth';

export function showAscensionOverlay(scene: GameScene, tier: number): void {
  if (!shouldRunClientFx()) return;
  const messages: Record<number, string> = {
    1: 'Humble beginnings. Your path is chosen.',
    2: 'A style takes shape. You learn to fight on your terms.',
    3: 'Distance and discipline become your allies.',
    4: 'A true warrior emerges. Power yields to you.',
    5: 'Your name is spoken in darker circles.',
    6: 'The land itself begins to remember your deeds.',
    7: 'Legends are made of lesser feats.',
  };
  const sub = messages[tier] ?? 'You press on, into the unknown.';

  const w = scene.scale.width;
  const h = scene.scale.height;

  const bg = scene.add
    .rectangle(w / 2, h / 2, w, h, 0x05030f, 0.72)
    .setScrollFactor(0)
    .setDepth(DEPTH.SCREEN);

  const label = scene.add
    .text(w / 2, h / 2 - 10, 'ASCENSION', {
      color: '#e8c84a',
      fontSize: '46px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    })
    .setScrollFactor(0)
    .setDepth(DEPTH.SCREEN + 1)
    .setOrigin(0.5);

  const subText = scene.add
    .text(w / 2, h / 2 + 52, sub, {
      color: '#a888dd',
      fontSize: '13px',
      fontFamily: 'monospace',
    })
    .setScrollFactor(0)
    .setDepth(DEPTH.SCREEN + 1)
    .setOrigin(0.5);

  [bg, label, subText].forEach((obj) => obj.setAlpha(0));
  scene.tweens.add({
    targets: [bg, label, subText],
    alpha: 1,
    duration: 350,
    onComplete: () => {
      scene.time.delayedCall(2000, () => {
        scene.tweens.add({
          targets: [bg, label, subText],
          alpha: 0,
          duration: 600,
          onComplete: () => { bg.destroy(); label.destroy(); subText.destroy(); },
        });
      });
    },
  });
}
