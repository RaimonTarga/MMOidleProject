import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,         // Uses WebGL if available, falls back to Canvas
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: [GameScene],
};

new Phaser.Game(config);
