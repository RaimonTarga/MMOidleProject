import Phaser from 'phaser';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { GameScene } from './scenes/GameScene';
import { LeftSidebar } from './hud/HUD';
import { RightSidebar } from './hud/MenuButtons';
import { BuffBar } from './hud/BuffBar';
import { AutoCombatButton } from './hud/AutoCombatButton';
import { MobileHUD } from './hud/MobileHUD';

function blockMouseHistoryButtons(event: Event) {
  if (!(event instanceof MouseEvent)) return;
  if (event.button !== 3 && event.button !== 4) return;
  event.preventDefault();
  event.stopPropagation();
}

for (const target of [window, document] as const) {
  target.addEventListener('mousedown', blockMouseHistoryButtons, { capture: true });
  target.addEventListener('mouseup', blockMouseHistoryButtons, { capture: true });
  target.addEventListener('auxclick', blockMouseHistoryButtons, { capture: true });
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  parent: 'game-wrapper',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

new Phaser.Game(config);

createRoot(document.getElementById('left-sidebar')!).render(createElement(LeftSidebar));
createRoot(document.getElementById('right-sidebar')!).render(createElement(RightSidebar));
createRoot(document.getElementById('buff-overlay')!).render(createElement(BuffBar));
createRoot(document.getElementById('auto-btn-overlay')!).render(createElement(AutoCombatButton));
createRoot(document.getElementById('mobile-hud')!).render(createElement(MobileHUD));
