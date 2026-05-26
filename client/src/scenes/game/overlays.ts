import { BIOME_DATABASE, GAME_CONFIG, NODE_BIOMES } from '@mmo-idle/shared';
import { getOwnView } from '../../render/state';
import { BIOME_TEXTURES } from '../../sprites';
import type { GameScene } from './GameScene';
import { GATE_COLOR, GATE_THICK, getNodeExits, MM_H, MM_PAD, MM_W } from './nodeExits';

export function createGridBackground(scene: GameScene): void {
  const cell = 64;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Transparent fill so the biome bgRect (depth -12) shows through the cells.
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, cell, cell);
  g.lineStyle(1, 0x2a2a4a, 0.45);
  g.strokeRect(0.5, 0.5, cell - 1, cell - 1);
  g.generateTexture('grid-cell', cell, cell);
  g.destroy();

  scene.bgGrid = scene.add
    .tileSprite(
      GAME_CONFIG.NODE_WIDTH / 2,
      GAME_CONFIG.NODE_HEIGHT / 2,
      GAME_CONFIG.NODE_WIDTH,
      GAME_CONFIG.NODE_HEIGHT,
      'grid-cell',
    )
    .setDepth(-10);
}

export function updateBiomeBackground(scene: GameScene): void {
  const biomeInfo = NODE_BIOMES[scene.state.ownNodeId];
  if (!biomeInfo) return;
  const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
  if (!biome) return;

  const textureKey = BIOME_TEXTURES[biomeInfo.biomeGroup];

  if (scene.bgTile) {
    scene.bgTile.destroy();
    scene.bgTile = null;
  }

  if (textureKey && scene.textures.exists(textureKey)) {
    scene.bgTile = scene.add
      .tileSprite(
        GAME_CONFIG.NODE_WIDTH / 2,
        GAME_CONFIG.NODE_HEIGHT / 2,
        GAME_CONFIG.NODE_WIDTH,
        GAME_CONFIG.NODE_HEIGHT,
        textureKey,
      )
      .setDepth(-11);
    scene.bgRect.setVisible(false);
    scene.bgGrid.setVisible(false);
  } else {
    scene.bgRect.setVisible(true).setFillStyle(biome.backgroundColor);
    scene.bgGrid.setVisible(true);
  }
}

export function drawExitMarkers(scene: GameScene): void {
  scene.exitMarkers.clear();

  const exits = getNodeExits(scene.state.ownNodeId);
  if (!exits) return;

  const w = GAME_CONFIG.NODE_WIDTH;
  const h = GAME_CONFIG.NODE_HEIGHT;
  const gateHalf = GAME_CONFIG.GATE_HALF;

  // Outer glow: wider, translucent halo around the gate.
  scene.exitMarkers.fillStyle(GATE_COLOR, 0.22);
  if (exits.north) scene.exitMarkers.fillRect(w / 2 - gateHalf - 8, -6, gateHalf * 2 + 16, GATE_THICK + 10);
  if (exits.south) scene.exitMarkers.fillRect(w / 2 - gateHalf - 8, h - GATE_THICK - 4, gateHalf * 2 + 16, GATE_THICK + 10);
  if (exits.west) scene.exitMarkers.fillRect(-6, h / 2 - gateHalf - 8, GATE_THICK + 10, gateHalf * 2 + 16);
  if (exits.east) scene.exitMarkers.fillRect(w - GATE_THICK - 4, h / 2 - gateHalf - 8, GATE_THICK + 10, gateHalf * 2 + 16);

  // Inner solid bar: right at the world boundary.
  scene.exitMarkers.fillStyle(GATE_COLOR, 0.88);
  if (exits.north) scene.exitMarkers.fillRect(w / 2 - gateHalf, 0, gateHalf * 2, GATE_THICK);
  if (exits.south) scene.exitMarkers.fillRect(w / 2 - gateHalf, h - GATE_THICK, gateHalf * 2, GATE_THICK);
  if (exits.west) scene.exitMarkers.fillRect(0, h / 2 - gateHalf, GATE_THICK, gateHalf * 2);
  if (exits.east) scene.exitMarkers.fillRect(w - GATE_THICK, h / 2 - gateHalf, GATE_THICK, gateHalf * 2);
}

export function drawMinimap(scene: GameScene): void {
  const now = scene.time.now;
  if (now - scene.state.throttles.minimapAt < 100) return;
  scene.state.throttles.minimapAt = now;

  const mmX = scene.scale.width - MM_W - MM_PAD;
  const mmY = scene.scale.height - MM_H - MM_PAD;
  const scaleX = MM_W / GAME_CONFIG.NODE_WIDTH;
  const scaleY = MM_H / GAME_CONFIG.NODE_HEIGHT;

  scene.minimap.clear();

  scene.minimap.fillStyle(0x0a0a1a, 0.85);
  scene.minimap.fillRect(mmX, mmY, MM_W, MM_H);
  scene.minimap.lineStyle(1, 0x444466, 1);
  scene.minimap.strokeRect(mmX, mmY, MM_W, MM_H);

  scene.minimap.fillStyle(0xff4444, 1);
  for (const id of scene.state.ids) {
    if (scene.state.kind.get(id) !== 'monster') continue;
    const sprite = scene.state.sprite.get(id);
    if (!sprite) continue;
    scene.minimap.fillRect(mmX + sprite.x * scaleX - 1, mmY + sprite.y * scaleY - 1, 2, 2);
  }

  scene.minimap.fillStyle(0x4488ff, 1);
  for (const id of scene.state.ids) {
    if (scene.state.kind.get(id) !== 'player' || id === scene.myId) continue;
    const sprite = scene.state.sprite.get(id);
    if (!sprite) continue;
    scene.minimap.fillRect(mmX + sprite.x * scaleX - 1, mmY + sprite.y * scaleY - 1, 2, 2);
  }

  const ownSprite = scene.state.ownId ? scene.state.sprite.get(scene.state.ownId) : undefined;
  if (ownSprite) {
    scene.minimap.fillStyle(0x44ff88, 1);
    scene.minimap.fillRect(mmX + ownSprite.x * scaleX - 1, mmY + ownSprite.y * scaleY - 1, 3, 3);
  }

  const exits = getNodeExits(scene.state.ownNodeId) ?? {};
  const mcx = mmX + MM_W / 2;
  const mcy = mmY + MM_H / 2;
  scene.minimap.fillStyle(GATE_COLOR, 1);
  if (exits.north) scene.minimap.fillRect(mcx - 4, mmY, 8, 5);
  if (exits.south) scene.minimap.fillRect(mcx - 4, mmY + MM_H - 5, 8, 5);
  if (exits.east) scene.minimap.fillRect(mmX + MM_W - 5, mcy - 4, 5, 8);
  if (exits.west) scene.minimap.fillRect(mmX, mcy - 4, 5, 8);
}

export function drawDebugRanges(scene: GameScene): void {
  const showAny = scene.debugPlayerRange || scene.debugEnemyRanges;
  if (!showAny) {
    if (scene.state.throttles.debugClearedAt !== -1) {
      scene.debugGraphics.clear();
      scene.state.throttles.debugClearedAt = -1;
    }
    return;
  }

  scene.debugGraphics.clear();
  scene.state.throttles.debugClearedAt = scene.time.now;

  if (scene.debugPlayerRange) {
    const ownSprite = scene.state.ownId ? scene.state.sprite.get(scene.state.ownId) : undefined;
    const player = getOwnView(scene.state);
    if (ownSprite && player) {
      scene.debugGraphics.lineStyle(1.5, 0xaaff44, 0.55);
      scene.debugGraphics.strokeCircle(ownSprite.x, ownSprite.y, player.attackRange);
    }
  }

  if (!scene.debugEnemyRanges) return;

  for (const id of scene.state.ids) {
    if (scene.state.kind.get(id) !== 'monster') continue;
    const sprite = scene.state.sprite.get(id);
    const ranges = scene.state.debugRanges.get(id);
    if (!sprite || !ranges) continue;

    if (ranges.pullRange != null) {
      scene.debugGraphics.lineStyle(1, 0xff8844, 0.5);
      scene.debugGraphics.strokeCircle(sprite.x, sprite.y, ranges.pullRange);
    }
    if (ranges.leashRange != null) {
      scene.debugGraphics.lineStyle(1, 0x4466cc, 0.35);
      scene.debugGraphics.strokeCircle(sprite.x, sprite.y, ranges.leashRange);
    }
    if (ranges.attackRange != null) {
      scene.debugGraphics.lineStyle(1, 0xff4444, 0.6);
      scene.debugGraphics.strokeCircle(sprite.x, sprite.y, ranges.attackRange);
    }
  }
}
