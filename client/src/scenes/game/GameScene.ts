import Phaser from 'phaser';
import { createRenderState, type RenderState } from '../../render/state';
import type { GameSocket } from '../../net/socket';
import {
  createGameScene,
  preloadGameAssets,
  updateGameScene,
} from './sceneSetup';

export class GameScene extends Phaser.Scene {
  socket!: GameSocket;
  readonly state: RenderState = createRenderState();
  myId = '';

  lastDrawnNodeId = '';
  targetMarker!: Phaser.GameObjects.Arc;
  minimap!: Phaser.GameObjects.Graphics;
  exitMarkers!: Phaser.GameObjects.Graphics;
  bgRect!: Phaser.GameObjects.Rectangle;
  bgGrid!: Phaser.GameObjects.TileSprite;
  bgTile: Phaser.GameObjects.TileSprite | null = null;
  debugGraphics!: Phaser.GameObjects.Graphics;
  /** Tactical mode: range rings + entity hitbox squares. */
  tacticalMode = false;

  autoPath: string[] = [];
  autoMode = false;
  cameraTarget!: Phaser.GameObjects.Arc;
  flashCameraHold = false;
  flashCameraHoldTargetId: string | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    preloadGameAssets(this);
  }

  create(): void {
    createGameScene(this);
  }

  update(_time: number, delta: number): void {
    updateGameScene(this, delta);
  }
}
