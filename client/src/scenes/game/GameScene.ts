import Phaser from 'phaser';
import { createRenderState, type RenderState } from '../../render/state';
import type { AltarPromptHandle } from '../../render/altarPrompt';
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
  nodeDecor: Phaser.GameObjects.Image[] = [];
  debugGraphics!: Phaser.GameObjects.Graphics;
  /** Tactical mode: range rings + entity hitbox squares. */
  tacticalMode = false;

  autoMode = false;
  cameraTarget!: Phaser.GameObjects.Arc;
  flashCameraHold = false;
  flashCameraHoldTargetId: string | null = null;
  /** Current opacity of the void-flood mist post-FX (0–1, eased by fade). */
  mistIntensity = 0;
  /** Eased strength (0–1) of the rune altar glow while the player stands on it. */
  altarGlowStrength = 0;
  /** Eased glow color (0–255 RGB) tracking the altar arc the player stands in. */
  altarGlowRgb: [number, number, number] = [255, 255, 255];
  /** Active rune altar interaction prompt (thought bubble above own head). */
  altarPrompt: AltarPromptHandle | null = null;

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
