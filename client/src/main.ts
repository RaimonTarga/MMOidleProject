import Phaser from 'phaser';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { GameScene } from './scenes/GameScene';
import { LeftSidebar } from './hud/HUD';
import { RightSidebar } from './hud/MenuButtons';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  parent: 'game-wrapper',
  scene: [GameScene],
};

new Phaser.Game(config);

createRoot(document.getElementById('left-sidebar')!).render(createElement(LeftSidebar));
createRoot(document.getElementById('right-sidebar')!).render(createElement(RightSidebar));
