import { EFFECT_DEFS, GAME_CONFIG, type EquipmentSlot, type Vec2 } from '@mmo-idle/shared';
import { combatLog } from '../../combatLog';
import { hudBus } from '../../hudBus';
import { accountId, displayName } from '../../clientAuth';
import { connectGameSocket, wireSocketHandlers } from '../../net/socket';
import {
  sendCraftRecipe,
  sendEquipItem,
  sendGoToTestRoom,
  sendLeaveTestRoom,
  sendMove,
  sendUnequip,
  sendUnlockSkill,
} from '../../net/intents';
import { applyDelta } from '../../net/deltaApplier';
import { ATLAS_KEY, BIOME_TEXTURES } from '../../sprites';
import { stepInterpolation, getOwnBase } from '../../render/interpolation';
import { drawShadows } from '../../render/shadows';
import { drawLabels } from '../../render/labels';
import { drawHealthBars } from '../../render/healthBars';
import { drawCooldownBars } from '../../render/cooldownBars';
import { updateEffectOverlays } from '../../render/effectOverlays';
import { initParticleTextures, initEffectFrames } from './fx/particles';
import { createGridBackground, drawDebugRanges, drawExitMarkers, drawMinimap, updateBiomeBackground } from './overlays';
import { setAutoMode, cancelAutoPath, sendAutoPathMove } from './navigation';
import { showAscensionOverlay, showDeathOverlay } from './screenOverlays';
import type { GameScene } from './GameScene';

export function preloadGameAssets(scene: GameScene): void {
  scene.load.atlas(ATLAS_KEY, '/assets/sprites.png', '/assets/sprites.json');
  for (const def of EFFECT_DEFS) {
    if (def.rowSlices) {
      scene.load.image(def.key, def.file);
    } else {
      scene.load.spritesheet(def.key, def.file, {
        frameWidth: def.frameSize,
        frameHeight: def.frameSize,
      });
    }
  }
  for (const key of Object.values(BIOME_TEXTURES)) {
    scene.load.image(key, `/assets/${key}.png`);
  }
}

export function createGameScene(scene: GameScene): void {
  initParticleTextures(scene);
  initEffectFrames(scene);

  scene.cameras.main.setBounds(0, 0, GAME_CONFIG.NODE_WIDTH, GAME_CONFIG.NODE_HEIGHT);

  scene.bgRect = scene.add
    .rectangle(
      GAME_CONFIG.NODE_WIDTH / 2,
      GAME_CONFIG.NODE_HEIGHT / 2,
      GAME_CONFIG.NODE_WIDTH,
      GAME_CONFIG.NODE_HEIGHT,
      0x101a10,
    )
    .setDepth(-12);

  createGridBackground(scene);

  scene.targetMarker = scene.add.circle(0, 0, 5, 0xffff44, 0.8).setVisible(false);
  scene.exitMarkers = scene.add.graphics().setDepth(5);
  scene.debugGraphics = scene.add.graphics().setDepth(8);
  scene.cameraTarget = scene.add.arc(0, 0, 1).setAlpha(0);
  scene.minimap = scene.add.graphics().setScrollFactor(0).setDepth(20);

  installHudEvents(scene);
  installPointerInput(scene);
  connectSocket(scene);
}

export function updateGameScene(scene: GameScene, delta: number): void {
  const dt = delta / 1000;

  stepInterpolation(scene.state, dt);
  drawShadows(scene.state);
  drawLabels(scene.state);
  drawHealthBars(scene.state);
  drawCooldownBars(scene.state);
  updateEffectOverlays(scene.state, scene, dt);

  scene.updateLaserBeam();
  drawMinimap(scene);

  if (scene.state.ownNodeId !== scene.lastDrawnNodeId) {
    drawExitMarkers(scene);
    updateBiomeBackground(scene);
    scene.lastDrawnNodeId = scene.state.ownNodeId;
  }

  const base = getOwnBase(scene.state);
  if (base) scene.cameraTarget.setPosition(base.x, base.y);

  const ownSprite = scene.state.ownId ? scene.state.sprite.get(scene.state.ownId) : undefined;
  if (ownSprite && scene.targetMarker.visible) {
    const dx = ownSprite.x - scene.targetMarker.x;
    const dy = ownSprite.y - scene.targetMarker.y;
    if (dx * dx + dy * dy < 16) scene.targetMarker.setVisible(false);
  }

  drawDebugRanges(scene);
}

function installHudEvents(scene: GameScene): void {
  window.addEventListener('hud:toggleAuto', () => {
    setAutoMode(scene, !scene.autoMode);
  });

  window.addEventListener('hud:unlockSkill', (e: Event) => {
    sendUnlockSkill(scene.socket, (e as CustomEvent<string>).detail);
  });

  window.addEventListener('hud:equipItem', (e: Event) => {
    sendEquipItem(scene.socket, (e as CustomEvent<string>).detail);
  });

  window.addEventListener('hud:unequipItem', (e: Event) => {
    sendUnequip(scene.socket, (e as CustomEvent<EquipmentSlot>).detail);
  });

  window.addEventListener('hud:craftRecipe', (e: Event) => {
    sendCraftRecipe(scene.socket, (e as CustomEvent<string>).detail);
  });

  window.addEventListener('hud:debugPlayerRange', () => {
    scene.debugPlayerRange = !scene.debugPlayerRange;
  });

  window.addEventListener('hud:debugEnemyRanges', () => {
    scene.debugEnemyRanges = !scene.debugEnemyRanges;
  });

  window.addEventListener('hud:navigateTo', (e: Event) => {
    const { path } = (e as CustomEvent<{ path: string[] }>).detail;
    if (path.length === 0) return;
    scene.autoPath = path;
    hudBus.emit({ autoPath: [...path] });
    sendAutoPathMove(scene, scene.state.ownNodeId);
  });

  window.addEventListener('hud:goToTestRoom', () => {
    sendGoToTestRoom(scene.socket);
  });

  window.addEventListener('hud:leaveTestRoom', () => {
    sendLeaveTestRoom(scene.socket);
  });
}

function installPointerInput(scene: GameScene): void {
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (!scene.myId) return;

    const dest: Vec2 = { x: Math.round(pointer.worldX), y: Math.round(pointer.worldY) };

    if (scene.autoMode) setAutoMode(scene, false);
    if (scene.autoPath.length > 0) cancelAutoPath(scene);

    sendMove(scene.socket, dest);

    const transform = scene.state.ownId ? scene.state.transform.get(scene.state.ownId) : undefined;
    if (transform) {
      transform.target = dest;
    }

    scene.targetMarker.setPosition(dest.x, dest.y).setVisible(true);
  });
}

function connectSocket(scene: GameScene): void {
  scene.socket = connectGameSocket({ accountId, displayName });

  wireSocketHandlers(scene.socket, {
    onConnect: (socket) => {
      scene.myId = socket.id ?? '';
      hudBus.emit({ status: 'connected' });
      if (scene.state.ownId) scene.cameras.main.startFollow(scene.cameraTarget, true, 0.1, 0.1);
    },
    onDisconnect: () => {
      hudBus.emit({ status: 'disconnected', player: null });
      scene.myId = '';
      scene.state.ownId = null;
    },
    onDelta: (snapshot) => applyDelta(scene.state, snapshot, scene),
    onCraftResult: (result) => {
      window.dispatchEvent(new CustomEvent('hud:craftResult', { detail: result }));
    },
    onPlayerDied: () => {
      combatLog.push('death', 'You were defeated');
      showDeathOverlay(scene);
    },
    onPlayerAscended: (tier) => {
      showAscensionOverlay(scene, tier);
    },
  });
}
