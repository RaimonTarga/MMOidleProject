import Phaser from 'phaser';
import type { CombatEvent, Vec2 } from '@mmo-idle/shared';
import { createRenderState, type RenderState } from '../../render/state';
import type { GameSocket } from '../../net/socket';
import {
  createGameScene,
  preloadGameAssets,
  updateGameScene,
} from './sceneSetup';
import { processCombatEventViaApplier as processCombatEvent } from './combatEvents';
import { spawnAttackEffect as spawnAttackFx, type AttackEffectFlags } from './fx/attackEffects';
import { spawnDamageNumber as spawnDamageNumberFx } from './fx/particles';
import { updateLaserBeam as updateLaserBeamFx } from './fx/laser';
import {
  cancelAutoPath as cancelAutoPathFn,
  sendAutoPathMove as sendAutoPathMoveFn,
} from './navigation';

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
  debugPlayerRange = false;
  debugEnemyRanges = false;

  laserBeamGraphics: Phaser.GameObjects.Graphics | null = null;
  laserBeamTargetId: string | null = null;
  laserBeamUntil = 0;

  autoPath: string[] = [];
  autoMode = false;
  cameraTarget!: Phaser.GameObjects.Arc;

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

  processCombatEventViaApplier(state: RenderState, ev: CombatEvent): void {
    processCombatEvent(this, state, ev);
  }

  updateLaserBeam(): void {
    updateLaserBeamFx(this);
  }

  spawnAttackEffect(
    style: string,
    from: Vec2,
    to: Vec2,
    flags?: AttackEffectFlags,
  ): void {
    spawnAttackFx(this, style, from, to, flags);
  }

  spawnDamageNumber(pos: Vec2, barOffsetY: number, amount: number, color: string): void {
    spawnDamageNumberFx(this, pos, barOffsetY, amount, color);
  }

  sendAutoPathMove(fromNodeId: string): void {
    sendAutoPathMoveFn(this, fromNodeId);
  }

  cancelAutoPath(): void {
    cancelAutoPathFn(this);
  }
}
