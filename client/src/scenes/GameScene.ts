import Phaser from 'phaser';
import type {
  PlayerSnapshot,
  NodeSnapshot,
  NodeDirection,
  EquipmentSlot,
  CombatArchetype,
  CombatEvent,
} from '@mmo-idle/shared';
import { GAME_CONFIG, NODE_BIOMES, BIOME_DATABASE, EFFECT_BY_ID, EFFECT_DEFS, EFFECT_FRAME_COUNT, EFFECT_GRID } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { combatLog } from '../combatLog';
import { ATLAS_KEY, BIOME_TEXTURES } from '../sprites';
import { accountId, displayName } from '../clientAuth';
import { connectGameSocket, wireSocketHandlers, type GameSocket } from '../net/socket';
import {
  sendMove,
  sendSetAuto,
  sendUnlockSkill,
  sendEquipItem,
  sendUnequip,
  sendCraftRecipe,
  sendGoToTestRoom,
  sendLeaveTestRoom,
} from '../net/intents';
import { applySnapshot } from '../net/snapshotApplier';
import { createRenderState, getOwnSnapshot, type RenderState } from '../render/state';
import { stepInterpolation, getOwnBase, applyLunge } from '../render/interpolation';
import { drawShadows } from '../render/shadows';
import { drawLabels } from '../render/labels';
import { drawHealthBars } from '../render/healthBars';
import { drawCooldownBars } from '../render/cooldownBars';
import { updateEffectOverlays } from '../render/effectOverlays';

// ── Minimap layout constants ───────────────────────────────────────────────────
const MM_W   = 220;  // minimap width  (px, screen-space)
const MM_H   = 165;  // minimap height (px, screen-space)
const MM_PAD = 8;    // gap from the screen edges

// ── Node exit computation ──────────────────────────────────────────────────────
// Node IDs follow the format "node-{row}-{col}" in an 11×11 grid.
// Exits are derived from coordinates so no registry duplication is needed.
function getNodeExits(nodeId: string): Partial<Record<NodeDirection, string>> {
  const parts = nodeId.split('-');
  if (parts.length !== 3) return {};
  const r = parseInt(parts[1], 10);
  const c = parseInt(parts[2], 10);
  if (isNaN(r) || isNaN(c)) return {};
  const exits: Partial<Record<NodeDirection, string>> = {};
  if (r > 0) exits.north = `node-${r - 1}-${c}`;
  if (r < 8) exits.south = `node-${r + 1}-${c}`;
  if (c > 0) exits.west  = `node-${r}-${c - 1}`;
  if (c < 8) exits.east  = `node-${r}-${c + 1}`;
  return exits;
}

// ── Gate marker dimensions (world-space) ─────────────────────────────────────
// GATE_THICK must equal EXIT_TRIGGER in server/src/systems/transitions.ts so
// the visible gate exactly covers the trigger zone.
// GATE_LEN must equal GAME_CONFIG.GATE_HALF * 2 so drawn gates match the server trigger zone.
const GATE_THICK = 20;       // thickness — must match server EXIT_TRIGGER
const GATE_COLOR = 0x00ffdd; // bright cyan

export class GameScene extends Phaser.Scene {
  private socket!: GameSocket;
  readonly state: RenderState = createRenderState();
  myId = '';
  /** Gate markers are static world-space graphics; only redrawn when node changes. */
  private lastDrawnNodeId = '';
  /** Yellow dot shown at the last click destination (world-space). */
  private targetMarker!: Phaser.GameObjects.Arc;
  private minimap!: Phaser.GameObjects.Graphics;
  /** World-space colored bars drawn at each active exit boundary. */
  private exitMarkers!: Phaser.GameObjects.Graphics;
  /** Full-world rectangle tinted with the current biome background color. */
  private bgRect!: Phaser.GameObjects.Rectangle;
  private bgGrid!: Phaser.GameObjects.TileSprite;
  /** TileSprite for biomes that have a texture — null when the current biome uses the solid rect. */
  private bgTile: Phaser.GameObjects.TileSprite | null = null;
  /** Reusable graphics layer for debug range circles — cleared and redrawn each frame. */
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private debugPlayerRange = false;
  private debugEnemyRanges = false;
  /** Sustained client-side beam for Reload Laser; refreshed by server hit events. */
  private laserBeamGraphics: Phaser.GameObjects.Graphics | null = null;
  private laserBeamTargetId: string | null = null;
  private laserBeamUntil = 0;
  /** Remaining auto-path hops (nodeIds to visit, not including current node). */
  autoPath: string[] = [];
  autoMode = false;
  /** Invisible point the camera follows — positioned at the player's baseX/Y so
   *  lunge offsets on the sprite don't cause the camera to jerk. */
  cameraTarget!: Phaser.GameObjects.Arc;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.atlas(ATLAS_KEY, '/assets/sprites.png', '/assets/sprites.json');
    for (const def of EFFECT_DEFS) {
      // Sheets with non-uniform row heights are loaded as plain images and
      // sliced into frames manually in create(); uniform 5×5 sheets use the
      // simple spritesheet loader.
      if (def.rowSlices) {
        this.load.image(def.key, def.file);
      } else {
        this.load.spritesheet(def.key, def.file, {
          frameWidth: def.frameSize,
          frameHeight: def.frameSize,
        });
      }
    }
    for (const key of Object.values(BIOME_TEXTURES)) {
      this.load.image(key, `/assets/${key}.png`);
    }
  }

  create() {
    this.initParticleTextures();
    this.initEffectFrames();

    // ── World / camera setup ───────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.NODE_WIDTH, GAME_CONFIG.NODE_HEIGHT);

    // ── Biome background (solid rect at depth -12; color swapped on node change) ──
    this.bgRect = this.add
      .rectangle(
        GAME_CONFIG.NODE_WIDTH  / 2,
        GAME_CONFIG.NODE_HEIGHT / 2,
        GAME_CONFIG.NODE_WIDTH,
        GAME_CONFIG.NODE_HEIGHT,
        0x101a10, // default clearing color; updated on first state:sync
      )
      .setDepth(-12);

    // ── Grid overlay (world-space, transparent cells so bgRect shows through) ──
    this.createGridBackground();

    this.targetMarker = this.add
      .circle(0, 0, 5, 0xffff44, 0.8)
      .setVisible(false);

    // ── Exit gate markers (world-space; no scrollFactor — visible only near edges) ──
    // Drawn once per node change, not every frame.
    this.exitMarkers = this.add.graphics().setDepth(5);

    // ── Debug range overlay (depth 8 — above entities, below minimap) ─────────
    this.debugGraphics = this.add.graphics().setDepth(8);

    // ── Camera anchor (invisible; follows base position, not lunge-offset sprite) ──
    this.cameraTarget = this.add.arc(0, 0, 1).setAlpha(0);

    // ── Minimap ────────────────────────────────────────────────────────────────
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(20);

    // ── Auto toggle from HUD ───────────────────────────────────────────────
    window.addEventListener('hud:toggleAuto', () => {
      this.setAutoMode(!this.autoMode);
    });

    // ── Skill unlock from SkillTreePanel ───────────────────────────────────
    window.addEventListener('hud:unlockSkill', (e: Event) => {
      const skillId = (e as CustomEvent<string>).detail;
      sendUnlockSkill(this.socket, skillId);
    });

    // ── Inventory actions from InventoryPanel ──────────────────────────────
    window.addEventListener('hud:equipItem', (e: Event) => {
      const definitionId = (e as CustomEvent<string>).detail;
      sendEquipItem(this.socket, definitionId);
    });

    window.addEventListener('hud:unequipItem', (e: Event) => {
      const slot = (e as CustomEvent<EquipmentSlot>).detail;
      sendUnequip(this.socket, slot);
    });

    window.addEventListener('hud:craftRecipe', (e: Event) => {
      const recipeId = (e as CustomEvent<string>).detail;
      sendCraftRecipe(this.socket, recipeId);
    });

    window.addEventListener('hud:debugPlayerRange', () => {
      this.debugPlayerRange = !this.debugPlayerRange;
    });

    window.addEventListener('hud:debugEnemyRanges', () => {
      this.debugEnemyRanges = !this.debugEnemyRanges;
    });

    window.addEventListener('hud:navigateTo', (e: Event) => {
      const { path } = (e as CustomEvent<{ path: string[] }>).detail;
      if (path.length === 0) return;
      this.autoPath = path;
      hudBus.emit({ autoPath: [...path] });
      this.sendAutoPathMove(this.state.ownNodeId);
    });

    window.addEventListener('hud:goToTestRoom', () => {
      sendGoToTestRoom(this.socket);
    });

    window.addEventListener('hud:leaveTestRoom', () => {
      sendLeaveTestRoom(this.socket);
    });

    // ── Click to move ──────────────────────────────────────────────────────
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.myId) return;

      const tx = Math.round(pointer.worldX);
      const ty = Math.round(pointer.worldY);

      if (this.autoMode) this.setAutoMode(false);
      if (this.autoPath.length > 0) this.cancelAutoPath();

      sendMove(this.socket, tx, ty);

      const transform = this.state.ownId ? this.state.transform.get(this.state.ownId) : undefined;
      if (transform) {
        transform.targetX = tx;
        transform.targetY = ty;
      }

      this.targetMarker.setPosition(tx, ty).setVisible(true);
    });

    // ── Socket.IO ──────────────────────────────────────────────────────────
    this.socket = connectGameSocket({ accountId, displayName });

    wireSocketHandlers(this.socket, {
      onConnect: (socket) => {
        this.myId = socket.id ?? '';
        hudBus.emit({ status: 'connected' });
        if (this.state.ownId) this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);
      },
      onDisconnect: () => {
        hudBus.emit({ status: 'disconnected', player: null });
        this.myId = '';
        this.state.ownId = null;
      },
      onSnapshot: (snapshot) => applySnapshot(this.state, snapshot, this),
      onCraftResult: (result) => {
        window.dispatchEvent(new CustomEvent('hud:craftResult', { detail: result }));
      },
      onPlayerDied: () => {
        combatLog.push('death', 'You were defeated');
        this.showDeathOverlay();
      },
      onPlayerAscended: (tier) => {
        this.showAscensionOverlay(tier);
      },
    });
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    stepInterpolation(this.state, dt);
    drawShadows(this.state);
    drawLabels(this.state);
    drawHealthBars(this.state);
    drawCooldownBars(this.state);
    updateEffectOverlays(this.state, this, dt);

    this.updateLaserBeam();
    this.drawMinimap();

    if (this.state.ownNodeId !== this.lastDrawnNodeId) {
      this.drawExitMarkers();
      this.updateBiomeBackground();
      this.lastDrawnNodeId = this.state.ownNodeId;
    }

    const base = getOwnBase(this.state);
    if (base) this.cameraTarget.setPosition(base.x, base.y);

    const ownSprite = this.state.ownId ? this.state.sprite.get(this.state.ownId) : undefined;
    if (ownSprite && this.targetMarker.visible) {
      const dx = ownSprite.x - this.targetMarker.x;
      const dy = ownSprite.y - this.targetMarker.y;
      if (dx * dx + dy * dy < 16) this.targetMarker.setVisible(false);
    }

    this.drawDebugRanges();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private createGridBackground(): void {
    const cell = 64;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Transparent fill so the biome bgRect (depth -12) shows through the cells.
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, cell, cell);
    g.lineStyle(1, 0x2a2a4a, 0.45);
    g.strokeRect(0.5, 0.5, cell - 1, cell - 1);
    g.generateTexture('grid-cell', cell, cell);
    g.destroy();

    this.bgGrid = this.add
      .tileSprite(
        GAME_CONFIG.NODE_WIDTH  / 2,
        GAME_CONFIG.NODE_HEIGHT / 2,
        GAME_CONFIG.NODE_WIDTH,
        GAME_CONFIG.NODE_HEIGHT,
        'grid-cell',
      )
      .setDepth(-10);
  }

  private setAutoMode(enabled: boolean): void {
    this.autoMode = enabled;
    sendSetAuto(this.socket, enabled);
    if (enabled) this.targetMarker.setVisible(false);

    const own = getOwnSnapshot(this.state);
    if (own) {
      hudBus.emit({ player: { ...own, auto: enabled } });
    }
  }

  processCombatEventViaApplier(state: RenderState, ev: CombatEvent): void {
    if (ev.playerId !== this.myId) return;

    if (ev.kind === 'player-hit') {
      combatLog.push('damage-out', `${ev.targetName} −${ev.damage}`);
      if (ev.empowered) combatLog.push('empowered', `Empowered strike → ${ev.targetName}`);
      if (ev.execution) combatLog.push('execution', `Execution strike → ${ev.targetName}`);

      const ownSprite = state.ownId ? state.sprite.get(state.ownId) : undefined;
      const targetSprite = state.sprite.get(ev.targetId);
      const player = state.ownId ? (state.snapshot.get(state.ownId) as PlayerSnapshot | undefined) : undefined;
      const targetInterp = state.interpolation.get(ev.targetId);

      if (ownSprite && targetSprite && player) {
        const dotPath = player.combatArchetype === 'dot' ? this.getDotPath(player) : undefined;
        const targetSpriteObj = state.sprite.get(ev.targetId);
        const bossScale = targetSpriteObj && Math.max(targetSpriteObj.displayWidth, targetSpriteObj.displayHeight) > 64 ? 1.33 : 1;
        const targetEffectScale = 1.5 * bossScale;
        const isLaser = player.combatArchetype === 'reload' && (player.passives['reload.laser'] ?? 0) > 0;
        if (isLaser) {
          this.activateLaserBeam(ev.targetId);
        } else {
          this.spawnAttackEffect(
            player.attackStyle,
            ownSprite.x,
            ownSprite.y,
            targetSprite.x,
            targetSprite.y,
            {
              empowered: ev.empowered,
              execution: ev.execution,
              archetype: player.combatArchetype ?? undefined,
              dotPath,
            },
          );
        }
        for (const effectId of ev.effects ?? []) {
          this.playOneShotEffect(effectId, targetSprite.x, targetSprite.y, { scale: targetEffectScale });
        }
        if (!isLaser && player.attackRange <= 150 && state.ownId && targetInterp) {
          applyLunge(state, state.ownId, targetInterp.baseX, targetInterp.baseY, this);
        }
      }
    }

    if (ev.kind === 'player-kill') {
      combatLog.push('kill', `${ev.targetName} defeated`);
    }
  }

  /** Swap the background rectangle's fill color to match the current biome. */
  private updateBiomeBackground(): void {
    const biomeInfo = NODE_BIOMES[this.state.ownNodeId];
    if (!biomeInfo) return;
    const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
    if (!biome) return;

    const textureKey = BIOME_TEXTURES[biomeInfo.biomeGroup];

    // Destroy the old tile whenever the biome changes — recreate below if needed.
    if (this.bgTile) {
      this.bgTile.destroy();
      this.bgTile = null;
    }

    if (textureKey && this.textures.exists(textureKey)) {
      this.bgTile = this.add
        .tileSprite(
          GAME_CONFIG.NODE_WIDTH  / 2,
          GAME_CONFIG.NODE_HEIGHT / 2,
          GAME_CONFIG.NODE_WIDTH,
          GAME_CONFIG.NODE_HEIGHT,
          textureKey,
        )
        .setDepth(-11);
      this.bgRect.setVisible(false);
      this.bgGrid.setVisible(false);
    } else {
      this.bgRect.setVisible(true).setFillStyle(biome.backgroundColor);
      this.bgGrid.setVisible(true);
    }
  }

  /**
   * Draw colored bars at each active exit boundary in world-space.
   * Called once per node change, not every frame.
   * The camera must scroll to the boundary for these to be visible.
   */
  private drawExitMarkers(): void {
    this.exitMarkers.clear();

    const exits = getNodeExits(this.state.ownNodeId);
    if (!exits) return;

    const W = GAME_CONFIG.NODE_WIDTH;
    const H = GAME_CONFIG.NODE_HEIGHT;

    const G = GAME_CONFIG.GATE_HALF; // half gate opening width
    // Outer glow — wider, translucent halo around the gate
    this.exitMarkers.fillStyle(GATE_COLOR, 0.22);
    if (exits.north) this.exitMarkers.fillRect(W/2 - G - 8, -6, G*2 + 16, GATE_THICK + 10);
    if (exits.south) this.exitMarkers.fillRect(W/2 - G - 8, H - GATE_THICK - 4, G*2 + 16, GATE_THICK + 10);
    if (exits.west)  this.exitMarkers.fillRect(-6, H/2 - G - 8, GATE_THICK + 10, G*2 + 16);
    if (exits.east)  this.exitMarkers.fillRect(W - GATE_THICK - 4, H/2 - G - 8, GATE_THICK + 10, G*2 + 16);

    // Inner solid bar — right at the world boundary
    this.exitMarkers.fillStyle(GATE_COLOR, 0.88);
    if (exits.north) this.exitMarkers.fillRect(W/2 - G, 0,              G*2, GATE_THICK);
    if (exits.south) this.exitMarkers.fillRect(W/2 - G, H - GATE_THICK, G*2, GATE_THICK);
    if (exits.west)  this.exitMarkers.fillRect(0,              H/2 - G, GATE_THICK, G*2);
    if (exits.east)  this.exitMarkers.fillRect(W - GATE_THICK, H/2 - G, GATE_THICK, G*2);
  }

  private drawMinimap(): void {
    const mmX    = this.scale.width  - MM_W - MM_PAD;
    const mmY    = this.scale.height - MM_H - MM_PAD;
    const scaleX = MM_W / GAME_CONFIG.NODE_WIDTH;
    const scaleY = MM_H / GAME_CONFIG.NODE_HEIGHT;

    this.minimap.clear();

    // Background
    this.minimap.fillStyle(0x0a0a1a, 0.85);
    this.minimap.fillRect(mmX, mmY, MM_W, MM_H);

    // Border
    this.minimap.lineStyle(1, 0x444466, 1);
    this.minimap.strokeRect(mmX, mmY, MM_W, MM_H);

    // Monsters — red 2×2 dots, drawn first so player dots render on top
    this.minimap.fillStyle(0xff4444, 1);
    for (const id of this.state.ids) {
      if (this.state.kind.get(id) !== 'monster') continue;
      const sprite = this.state.sprite.get(id);
      if (!sprite) continue;
      const dx = mmX + sprite.x * scaleX;
      const dy = mmY + sprite.y * scaleY;
      this.minimap.fillRect(dx - 1, dy - 1, 2, 2);
    }

    // Other players — blue 2×2 dots
    this.minimap.fillStyle(0x4488ff, 1);
    for (const id of this.state.ids) {
      if (this.state.kind.get(id) !== 'player' || id === this.myId) continue;
      const sprite = this.state.sprite.get(id);
      if (!sprite) continue;
      const dx = mmX + sprite.x * scaleX;
      const dy = mmY + sprite.y * scaleY;
      this.minimap.fillRect(dx - 1, dy - 1, 2, 2);
    }

    // Own player — bright green 3×3, always on top
    const ownSprite = this.state.ownId ? this.state.sprite.get(this.state.ownId) : undefined;
    if (ownSprite) {
      this.minimap.fillStyle(0x44ff88, 1);
      const dx = mmX + ownSprite.x * scaleX;
      const dy = mmY + ownSprite.y * scaleY;
      this.minimap.fillRect(dx - 1, dy - 1, 3, 3);
    }

    // Exit direction indicators — small colored bars at minimap edge midpoints.
    // Drawn last so they appear on top of entity dots.
    const exits = getNodeExits(this.state.ownNodeId) ?? {};
    const mcx = mmX + MM_W / 2;
    const mcy = mmY + MM_H / 2;
    this.minimap.fillStyle(GATE_COLOR, 1);
    if (exits.north) this.minimap.fillRect(mcx - 4, mmY,              8, 5);
    if (exits.south) this.minimap.fillRect(mcx - 4, mmY + MM_H - 5,   8, 5);
    if (exits.east)  this.minimap.fillRect(mmX + MM_W - 5, mcy - 4,   5, 8);
    if (exits.west)  this.minimap.fillRect(mmX,             mcy - 4,   5, 8);
  }

  private showDeathOverlay(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    const bg = this.add
      .rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setScrollFactor(0)
      .setDepth(50);

    const text = this.add
      .text(w / 2, h / 2, 'YOU DIED', {
        color: '#cc2222',
        fontSize: '52px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(51)
      .setOrigin(0.5);

    const sub = this.add
      .text(w / 2, h / 2 + 60, 'Respawning at the Clearing…', {
        color: '#886666',
        fontSize: '14px',
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(51)
      .setOrigin(0.5);

    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [bg, text, sub],
        alpha: 0,
        duration: 600,
        onComplete: () => { bg.destroy(); text.destroy(); sub.destroy(); },
      });
    });
  }

  private showAscensionOverlay(tier: number): void {
    const MESSAGES: Record<number, string> = {
      1: 'Humble beginnings. Your path is chosen.',
      2: 'A style takes shape. You learn to fight on your terms.',
      3: 'Distance and discipline become your allies.',
      4: 'A true warrior emerges. Power yields to you.',
      5: 'Your name is spoken in darker circles.',
      6: 'The land itself begins to remember your deeds.',
      7: 'Legends are made of lesser feats.',
    };
    const sub = MESSAGES[tier] ?? 'You press on, into the unknown.';

    const w = this.scale.width;
    const h = this.scale.height;

    const bg = this.add
      .rectangle(w / 2, h / 2, w, h, 0x05030f, 0.72)
      .setScrollFactor(0)
      .setDepth(50);

    const label = this.add
      .text(w / 2, h / 2 - 10, 'ASCENSION', {
        color: '#e8c84a',
        fontSize: '46px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(51)
      .setOrigin(0.5);

    const subText = this.add
      .text(w / 2, h / 2 + 52, sub, {
        color: '#a888dd',
        fontSize: '13px',
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(51)
      .setOrigin(0.5);

    // Fade in then hold, then fade out.
    [bg, label, subText].forEach(obj => obj.setAlpha(0));
    this.tweens.add({
      targets: [bg, label, subText],
      alpha: 1,
      duration: 350,
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: [bg, label, subText],
            alpha: 0,
            duration: 600,
            onComplete: () => { bg.destroy(); label.destroy(); subText.destroy(); },
          });
        });
      },
    });
  }

  private initParticleTextures(): void {
    // White circle — tinted per-emitter to any color
    const dotG = this.make.graphics({ x: 0, y: 0 }, false);
    dotG.fillStyle(0xffffff, 1);
    dotG.fillCircle(8, 8, 8);
    dotG.generateTexture('ptx-dot', 16, 16);
    dotG.destroy();

    // Thin white rectangle — used for sparks and embers
    const sparkG = this.make.graphics({ x: 0, y: 0 }, false);
    sparkG.fillStyle(0xffffff, 1);
    sparkG.fillRect(0, 0, 12, 3);
    sparkG.generateTexture('ptx-spark', 12, 3);
    sparkG.destroy();
  }

  /**
   * Carve numbered frames (`"0"`..`"24"`) for any effect sheet that opted into
   * `rowSlices`. Sheets without slices were already loaded as a uniform
   * spritesheet in `preload()` and need no further setup.
   *
   * Rows use the per-row `{y, h}` from the def; columns are uniform width
   * `frameSize` placed left-to-right starting at x=0. Frame names match what
   * `setFrame(n)` expects after a regular spritesheet load.
   */
  private initEffectFrames(): void {
    const cols = EFFECT_GRID;
    for (const def of EFFECT_DEFS) {
      if (!def.rowSlices) continue;
      const texture = this.textures.get(def.key);
      if (!texture) continue;
      for (let row = 0; row < def.rowSlices.length; row++) {
        const { y, h } = def.rowSlices[row];
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const name = `${idx}`;
          if (texture.has(name)) continue; // idempotent across HMR
          texture.add(name, 0, col * def.frameSize, y, def.frameSize, h);
        }
      }
    }
  }

  private burstFx(
    texture: string,
    x: number, y: number,
    count: number,
    lifespan: number,
    config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
  ): void {
    const emitter = this.add.particles(x, y, texture, {
      ...config,
      lifespan,
      quantity: count,
      emitting: false,
    });
    emitter.setDepth(12);
    emitter.explode(count);
    this.time.delayedCall(lifespan + 200, () => { if (emitter.active) emitter.destroy(); });
  }

  // blueEmpowered=true → cadence finisher (azure); false → default golden empowered
  private fxSlash(fromX: number, fromY: number, toX: number, toY: number, empowered: boolean, blueEmpowered = false): void {
    const angle       = Math.atan2(toY - fromY, toX - fromX);
    const perp        = angle + Math.PI / 2;
    const empColor    = blueEmpowered ? 0x4499ff : 0xffdd22;
    const shadowColor = blueEmpowered ? 0xaaccff : 0xffffcc;
    const mainColor   = empowered ? empColor    : 0xffffff;
    const shadow      = empowered ? shadowColor : 0xeeeeff;
    const lineW = empowered ? 3.5 : 2.5;
    const len   = empowered ? 62 : 48;

    for (let i = 0; i < 3; i++) {
      const a = perp + (i - 1) * 0.3;
      this.time.delayedCall(i * 35, () => {
        const g = this.add.graphics({ x: toX, y: toY }).setDepth(12);
        g.lineStyle(lineW, mainColor, 1);
        g.lineBetween(-Math.cos(a) * len, -Math.sin(a) * len, Math.cos(a) * len, Math.sin(a) * len);
        g.lineStyle(lineW * 0.5, shadow, 0.6);
        const off = 7;
        g.lineBetween(
          -Math.cos(a) * (len * 0.7) + Math.cos(angle) * off,
          -Math.sin(a) * (len * 0.7) + Math.sin(angle) * off,
           Math.cos(a) * (len * 0.7) + Math.cos(angle) * off,
           Math.sin(a) * (len * 0.7) + Math.sin(angle) * off,
        );
        this.tweens.add({ targets: g, alpha: 0, duration: 210, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
      });
    }

    this.burstFx('ptx-spark', toX, toY, empowered ? 14 : 9, 280, {
      tint:   mainColor,
      speed:  { min: 60,  max: 220 },
      angle:  { min: 0,   max: 360 },
      scale:  { start: 0.9, end: 0.1 },
      alpha:  { start: 1,   end: 0   },
      rotate: { min: 0, max: 360 },
    });

    if (empowered) {
      const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
      ring.lineStyle(3, mainColor, 1);
      ring.strokeCircle(0, 0, 12);
      this.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 320, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    }
  }

  private fxImpact(toX: number, toY: number, execution: boolean): void {
    // Flash
    const flash = this.add.graphics({ x: toX, y: toY }).setDepth(13);
    flash.fillStyle(execution ? 0xffffff : 0xff8844, execution ? 0.9 : 0.8);
    flash.fillCircle(0, 0, execution ? 28 : 16);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 90, onComplete: () => flash.destroy() });

    // Two expanding rings
    for (let i = 0; i < 2; i++) {
      const ringColor = execution ? (i === 0 ? 0xffffff : 0xaabbff) : (i === 0 ? 0xff7744 : 0xffaa22);
      const ring = this.add.graphics({ x: toX, y: toY }).setDepth(11);
      ring.lineStyle(3 - i * 0.5, ringColor, 1);
      ring.strokeCircle(0, 0, 10 + i * 8);
      this.tweens.add({ targets: ring, scaleX: 4.5 + i, scaleY: 4.5 + i, alpha: 0, duration: 320 + i * 60, ease: 'Power2', onComplete: () => ring.destroy() });
    }

    this.burstFx('ptx-dot', toX, toY, execution ? 14 : 8, 380, {
      tint:     execution ? 0xddeeff : 0xff7744,
      speed:    { min: 80,  max: 240 },
      angle:    { min: 0,   max: 360 },
      scale:    { start: 0.55, end: 0 },
      alpha:    { start: 1,    end: 0 },
      gravityY: 180,
    });

    if (execution) {
      // Silver X + plus cross
      const cross = this.add.graphics({ x: toX, y: toY }).setDepth(13);
      const cLen  = 42;
      cross.lineStyle(3, 0xeeeeff, 1);
      cross.lineBetween(-cLen, -cLen,  cLen,  cLen);
      cross.lineBetween( cLen, -cLen, -cLen,  cLen);
      cross.lineStyle(3, 0xffffff, 0.9);
      cross.lineBetween(-cLen, 0, cLen, 0);
      cross.lineBetween(0, -cLen, 0, cLen);
      this.tweens.add({ targets: cross, alpha: 0, scaleX: 1.9, scaleY: 1.9, duration: 380, ease: 'Quad.easeOut', onComplete: () => cross.destroy() });
    }
  }

  private fxPoison(toX: number, toY: number): void {
    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
    ring.lineStyle(2.5, 0x44ff66, 1);
    ring.strokeCircle(0, 0, 8);
    this.tweens.add({ targets: ring, scaleX: 4.2, scaleY: 4.2, alpha: 0, duration: 380, ease: 'Power2', onComplete: () => ring.destroy() });

    this.burstFx('ptx-dot', toX, toY, 9, 520, {
      tint:     0x44ff66,
      speed:    { min: 30,  max: 110 },
      angle:    { min: 200, max: 340 }, // mostly upward
      scale:    { start: 0.65, end: 0 },
      alpha:    { start: 1,    end: 0 },
      gravityY: -70,
    });
  }

  private fxMagic(fromX: number, fromY: number, toX: number, toY: number): void {
    const orb = this.add.circle(fromX, fromY, 6, 0xaa44ff).setDepth(12);

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 45, () => {
        const trail = this.add.circle(orb.x, orb.y, 3 - i * 0.5, 0xcc88ff, 0.75).setDepth(11);
        this.tweens.add({ targets: trail, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 180, onComplete: () => trail.destroy() });
      });
    }

    this.tweens.add({
      targets: orb, x: toX, y: toY, duration: 200, ease: 'Quad.easeIn',
      onComplete: () => {
        orb.destroy();
        const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
        ring.lineStyle(2.5, 0xcc88ff, 1);
        ring.strokeCircle(0, 0, 6);
        this.tweens.add({ targets: ring, scaleX: 3.5, scaleY: 3.5, alpha: 0, duration: 260, onComplete: () => ring.destroy() });

        this.burstFx('ptx-dot', toX, toY, 10, 320, {
          tint:  0xaa44ff,
          speed: { min: 50,  max: 180 },
          angle: { min: 0,   max: 360 },
          scale: { start: 0.65, end: 0 },
          alpha: { start: 1,    end: 0 },
        });
      },
    });
  }

  private fxFrost(toX: number, toY: number): void {
    // Six ice spokes at 60° intervals, each with a small perpendicular tick at the tip
    const spokes = this.add.graphics({ x: toX, y: toY }).setDepth(12);
    const sLen   = 40;
    for (let i = 0; i < 6; i++) {
      const a    = (i / 6) * Math.PI * 2;
      const perpA = a + Math.PI / 2;
      const tx   = Math.cos(a) * sLen;
      const ty   = Math.sin(a) * sLen;
      spokes.lineStyle(2, 0xaaddff, 1);
      spokes.lineBetween(0, 0, tx, ty);
      spokes.lineStyle(1.5, 0xddeeff, 0.85);
      spokes.lineBetween(tx - Math.cos(perpA) * 7, ty - Math.sin(perpA) * 7, tx + Math.cos(perpA) * 7, ty + Math.sin(perpA) * 7);
    }
    this.tweens.add({ targets: spokes, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => spokes.destroy() });

    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(11);
    ring.lineStyle(2.5, 0x66ccff, 1);
    ring.strokeCircle(0, 0, 10);
    this.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 340, ease: 'Power2', onComplete: () => ring.destroy() });

    this.burstFx('ptx-dot', toX, toY, 7, 330, {
      tint:  0xaaddff,
      speed: { min: 50,  max: 140 },
      angle: { min: 0,   max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1,   end: 0 },
    });
  }

  private fxFire(toX: number, toY: number): void {
    // Flash
    const flash = this.add.graphics({ x: toX, y: toY }).setDepth(13);
    flash.fillStyle(0xffffff, 0.88);
    flash.fillCircle(0, 0, 14);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 85, onComplete: () => flash.destroy() });

    // Expanding orange ring
    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
    ring.lineStyle(3, 0xff6600, 1);
    ring.strokeCircle(0, 0, 12);
    this.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 320, ease: 'Power2', onComplete: () => ring.destroy() });

    // Upward burst — fire particles rise against gravity
    this.burstFx('ptx-dot', toX, toY, 12, 460, {
      tint:     0xff6600,
      speed:    { min: 80,  max: 230 },
      angle:    { min: 220, max: 320 }, // upward arc
      scale:    { start: 0.75, end: 0  },
      alpha:    { start: 1,    end: 0  },
      gravityY: -110,
    });

    // Ember scatter — sparks fall back down
    this.burstFx('ptx-spark', toX, toY, 8, 560, {
      tint:     0xff8800,
      speed:    { min: 50,  max: 150 },
      angle:    { min: 0,   max: 360 },
      scale:    { start: 0.9, end: 0 },
      alpha:    { start: 1,   end: 0 },
      gravityY: 130,
      rotate:   { min: 0, max: 360 },
    });
  }

  private fxVoid(toX: number, toY: number): void {
    // Phase 1: dark circle collapses inward (implosion feel)
    const dark = this.add.graphics({ x: toX, y: toY }).setDepth(12);
    dark.fillStyle(0x220033, 0.82);
    dark.fillCircle(0, 0, 28);
    dark.lineStyle(2.5, 0x6600cc, 1);
    dark.strokeCircle(0, 0, 28);
    dark.setScale(2.5);
    this.tweens.add({
      targets: dark, scaleX: 0.15, scaleY: 0.15, alpha: 0.2, duration: 230, ease: 'Back.easeIn',
      onComplete: () => {
        dark.destroy();
        // Phase 2: burst outward
        const burst = this.add.graphics({ x: toX, y: toY }).setDepth(13);
        burst.fillStyle(0x9933ff, 0.88);
        burst.fillCircle(0, 0, 16);
        this.tweens.add({ targets: burst, alpha: 0, scaleX: 2.8, scaleY: 2.8, duration: 190, onComplete: () => burst.destroy() });

        const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
        ring.lineStyle(3, 0xaa44ff, 1);
        ring.strokeCircle(0, 0, 12);
        this.tweens.add({ targets: ring, scaleX: 4.5, scaleY: 4.5, alpha: 0, duration: 340, ease: 'Power2', onComplete: () => ring.destroy() });

        this.burstFx('ptx-dot', toX, toY, 12, 360, {
          tint:  0x9933ff,
          speed: { min: 60,  max: 190 },
          angle: { min: 0,   max: 360 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 1,   end: 0 },
        });
      },
    });
  }

  // ── Class-specific player attack effects ─────────────────────────────────

  // Reload: sharp tracer line + directional impact sparks.
  private fxGunshot(fromX: number, fromY: number, toX: number, toY: number, empowered: boolean): void {
    const color = empowered ? 0xffee66 : 0xddeeff;
    const width = empowered ? 2.5 : 1.5;

    // Draw glow layer then bright core
    const g = this.add.graphics().setDepth(12);
    g.lineStyle(width + 3, color, 0.15);
    g.lineBetween(fromX, fromY, toX, toY);
    g.lineStyle(width, color, 1);
    g.lineBetween(fromX, fromY, toX, toY);
    this.tweens.add({ targets: g, alpha: 0, duration: 90, ease: 'Quad.easeIn', onComplete: () => g.destroy() });

    // Small muzzle flash at origin
    const muzzle = this.add.graphics({ x: fromX, y: fromY }).setDepth(12);
    muzzle.fillStyle(color, 0.7);
    muzzle.fillCircle(0, 0, empowered ? 7 : 4);
    this.tweens.add({ targets: muzzle, alpha: 0, scaleX: 2, scaleY: 2, duration: 80, onComplete: () => muzzle.destroy() });

    // Impact flash at target
    const flash = this.add.graphics({ x: toX, y: toY }).setDepth(13);
    flash.fillStyle(color, 0.88);
    flash.fillCircle(0, 0, empowered ? 16 : 8);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 150, onComplete: () => flash.destroy() });

    // Impact sparks spray backwards (opposite travel direction)
    const travelAngleDeg = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
    const backDeg = (travelAngleDeg + 180 + 360) % 360;
    this.burstFx('ptx-spark', toX, toY, empowered ? 10 : 5, empowered ? 280 : 190, {
      tint:   color,
      speed:  { min: 80, max: empowered ? 260 : 180 },
      angle:  { min: backDeg - 40, max: backDeg + 40 },
      scale:  { start: empowered ? 1.0 : 0.65, end: 0 },
      alpha:  { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
    });
  }

  private activateLaserBeam(targetId: string): void {
    this.laserBeamTargetId = targetId;
    // Broadcasts arrive every ~200ms; keep the beam alive across snapshots.
    this.laserBeamUntil = Date.now() + 320;

    if (!this.laserBeamGraphics) {
      this.laserBeamGraphics = this.add.graphics().setDepth(12);
    }
  }

  private updateLaserBeam(): void {
    if (!this.laserBeamGraphics) return;

    const now = Date.now();
    const ownSprite = this.state.ownId ? this.state.sprite.get(this.state.ownId) : undefined;
    const targetSprite = this.laserBeamTargetId ? this.state.sprite.get(this.laserBeamTargetId) : undefined;
    const player = this.state.ownId
      ? (this.state.snapshot.get(this.state.ownId) as PlayerSnapshot | undefined)
      : undefined;

    if (
      now > this.laserBeamUntil ||
      !ownSprite ||
      !targetSprite ||
      !player ||
      player.combatArchetype !== 'reload' ||
      (player.passives['reload.laser'] ?? 0) <= 0 ||
      player.laserOverheated
    ) {
      this.laserBeamGraphics.clear();
      this.laserBeamTargetId = null;
      return;
    }

    const fromX = ownSprite.x;
    const fromY = ownSprite.y;
    const toX = targetSprite.x;
    const toY = targetSprite.y;
    const pulse = 0.75 + Math.sin(now / 45) * 0.18;

    this.laserBeamGraphics.clear();
    this.laserBeamGraphics.lineStyle(10, 0xff5533, 0.16 * pulse);
    this.laserBeamGraphics.lineBetween(fromX, fromY, toX, toY);
    this.laserBeamGraphics.lineStyle(5, 0xffaa44, 0.34 * pulse);
    this.laserBeamGraphics.lineBetween(fromX, fromY, toX, toY);
    this.laserBeamGraphics.lineStyle(2, 0xffffdd, 0.92);
    this.laserBeamGraphics.lineBetween(fromX, fromY, toX, toY);

    const impactRadius = 5 + Math.sin(now / 55) * 1.5;
    this.laserBeamGraphics.fillStyle(0xffffcc, 0.7);
    this.laserBeamGraphics.fillCircle(toX, toY, impactRadius);
    this.laserBeamGraphics.fillStyle(0xff6633, 0.24);
    this.laserBeamGraphics.fillCircle(toX, toY, impactRadius * 2.4);
  }

  // Helper: generate zigzag waypoints for lightning bolts.
  private zigzagPoints(
    fromX: number, fromY: number,
    toX: number, toY: number,
    segments: number, spread: number,
  ): Array<{ x: number; y: number }> {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const perpX = dist > 0 ? -dy / dist : 0;
    const perpY = dist > 0 ?  dx / dist : 0;
    const pts: Array<{ x: number; y: number }> = [{ x: fromX, y: fromY }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const jitter = (Math.random() - 0.5) * 2 * spread;
      pts.push({ x: fromX + dx * t + perpX * jitter, y: fromY + dy * t + perpY * jitter });
    }
    pts.push({ x: toX, y: toY });
    return pts;
  }

  // Energy: lightning bolt; discharge = much flashier.
  private fxLightning(fromX: number, fromY: number, toX: number, toY: number, discharge: boolean): void {
    const color   = discharge ? 0xffffff : 0x88aaff;
    const glowCol = discharge ? 0xaaccff : 0x3355cc;
    const segs    = discharge ? 9 : 6;
    const spread  = discharge ? 28 : 14;

    const pts = this.zigzagPoints(fromX, fromY, toX, toY, segs, spread);

    const g = this.add.graphics().setDepth(12);
    // Glow beneath
    g.lineStyle(discharge ? 6 : 4, glowCol, 0.22);
    for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
    // Bright core
    g.lineStyle(discharge ? 2.5 : 1.5, color, 1);
    for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
    this.tweens.add({ targets: g, alpha: 0, duration: discharge ? 220 : 130, onComplete: () => g.destroy() });

    if (discharge) {
      // Two additional branching bolts
      for (let b = 0; b < 2; b++) {
        this.time.delayedCall(b * 28, () => {
          const bpts = this.zigzagPoints(fromX, fromY, toX, toY, segs - 1, spread * 1.5);
          const gb = this.add.graphics().setDepth(11);
          gb.lineStyle(1.5, 0x88ccff, 0.65);
          for (let i = 1; i < bpts.length; i++) gb.lineBetween(bpts[i-1].x, bpts[i-1].y, bpts[i].x, bpts[i].y);
          this.tweens.add({ targets: gb, alpha: 0, duration: 170, onComplete: () => gb.destroy() });
        });
      }
      const flash = this.add.graphics({ x: toX, y: toY }).setDepth(13);
      flash.fillStyle(0xffffff, 0.92);
      flash.fillCircle(0, 0, 28);
      this.tweens.add({ targets: flash, alpha: 0, scaleX: 3, scaleY: 3, duration: 180, onComplete: () => flash.destroy() });
      const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
      ring.lineStyle(3, 0xaaddff, 1);
      ring.strokeCircle(0, 0, 10);
      this.tweens.add({ targets: ring, scaleX: 5.5, scaleY: 5.5, alpha: 0, duration: 340, ease: 'Power2', onComplete: () => ring.destroy() });
      this.burstFx('ptx-spark', toX, toY, 18, 400, {
        tint: 0x88ccff, speed: { min: 120, max: 380 }, angle: { min: 0, max: 360 },
        scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 },
      });
      this.burstFx('ptx-dot', toX, toY, 9, 280, {
        tint: 0xffffff, speed: { min: 60, max: 220 }, angle: { min: 0, max: 360 },
        scale: { start: 0.65, end: 0 }, alpha: { start: 1, end: 0 },
      });
    } else {
      this.burstFx('ptx-spark', toX, toY, 5, 180, {
        tint: 0x88aaff, speed: { min: 60, max: 160 }, angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 }, rotate: { min: 0, max: 360 },
      });
    }
  }

  // DoT — Poison path: slow green smog cloud.
  private fxPoisonSmog(toX: number, toY: number, empowered: boolean): void {
    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
    ring.lineStyle(2, 0x33dd55, 0.75);
    ring.strokeCircle(0, 0, 8);
    this.tweens.add({ targets: ring, scaleX: empowered ? 5 : 3.5, scaleY: empowered ? 5 : 3.5, alpha: 0, duration: 520, ease: 'Power1', onComplete: () => ring.destroy() });

    this.burstFx('ptx-dot', toX, toY, empowered ? 16 : 9, 750, {
      tint:     0x33dd66,
      speed:    { min: 12, max: empowered ? 70 : 50 },
      angle:    { min: 200, max: 340 },
      scale:    { start: empowered ? 1.2 : 0.85, end: 0 },
      alpha:    { start: 0.88, end: 0 },
      gravityY: -50,
    });

    if (empowered) {
      this.burstFx('ptx-dot', toX, toY, 10, 900, {
        tint: 0x22aa44, speed: { min: 6, max: 30 }, angle: { min: 180, max: 360 },
        scale: { start: 1.5, end: 0 }, alpha: { start: 0.7, end: 0 }, gravityY: -30,
      });
    }
  }

  // DoT — Fire path: deep-red flame burst.
  private fxFireFlame(toX: number, toY: number, empowered: boolean): void {
    const flash = this.add.graphics({ x: toX, y: toY }).setDepth(13);
    flash.fillStyle(0xffffff, empowered ? 0.9 : 0.72);
    flash.fillCircle(0, 0, empowered ? 18 : 11);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 75, onComplete: () => flash.destroy() });

    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
    ring.lineStyle(3, 0xdd1100, 1);
    ring.strokeCircle(0, 0, empowered ? 14 : 9);
    this.tweens.add({ targets: ring, scaleX: empowered ? 4.5 : 3.2, scaleY: empowered ? 4.5 : 3.2, alpha: 0, duration: 300, ease: 'Power2', onComplete: () => ring.destroy() });

    this.burstFx('ptx-dot', toX, toY, empowered ? 16 : 10, 560, {
      tint:     0xff2200,
      speed:    { min: 80, max: empowered ? 280 : 200 },
      angle:    { min: 210, max: 330 },
      scale:    { start: empowered ? 0.9 : 0.65, end: 0 },
      alpha:    { start: 1, end: 0 },
      gravityY: -135,
    });

    this.burstFx('ptx-spark', toX, toY, empowered ? 10 : 5, 460, {
      tint: 0xff4422, speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
      gravityY: 100, rotate: { min: 0, max: 360 },
    });
  }

  // DoT — Frost path: detailed snowflake crystal (6 or 8 spokes with branch ticks).
  private fxFrostSnowflake(toX: number, toY: number, empowered: boolean): void {
    const sLen  = empowered ? 54 : 36;
    const spokes = empowered ? 8 : 6;
    const g = this.add.graphics({ x: toX, y: toY }).setDepth(12);
    for (let i = 0; i < spokes; i++) {
      const a     = (i / spokes) * Math.PI * 2;
      const perpA = a + Math.PI / 2;
      const tx = Math.cos(a) * sLen;
      const ty = Math.sin(a) * sLen;
      // Main spoke
      g.lineStyle(empowered ? 2.5 : 2, empowered ? 0xddeeff : 0xaaddff, 1);
      g.lineBetween(0, 0, tx, ty);
      // Mid-spoke branch ticks
      const bx = Math.cos(a) * sLen * 0.58;
      const by = Math.sin(a) * sLen * 0.58;
      const tk = empowered ? 10 : 7;
      g.lineStyle(1.5, empowered ? 0xffffff : 0xddeeff, 0.85);
      g.lineBetween(bx - Math.cos(perpA) * tk, by - Math.sin(perpA) * tk, bx + Math.cos(perpA) * tk, by + Math.sin(perpA) * tk);
      // Tip ticks
      g.lineBetween(tx - Math.cos(perpA) * 5, ty - Math.sin(perpA) * 5, tx + Math.cos(perpA) * 5, ty + Math.sin(perpA) * 5);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: empowered ? 420 : 280, ease: 'Quad.easeOut', onComplete: () => g.destroy() });

    const cFlash = this.add.graphics({ x: toX, y: toY }).setDepth(13);
    cFlash.fillStyle(0xffffff, empowered ? 0.88 : 0.65);
    cFlash.fillCircle(0, 0, empowered ? 10 : 6);
    this.tweens.add({ targets: cFlash, alpha: 0, scaleX: 2, scaleY: 2, duration: 110, onComplete: () => cFlash.destroy() });

    this.burstFx('ptx-dot', toX, toY, empowered ? 10 : 5, 350, {
      tint: 0xaaddff, speed: { min: 35, max: 120 }, angle: { min: 0, max: 360 },
      scale: { start: 0.55, end: 0 }, alpha: { start: 1, end: 0 },
    });
  }

  // Helper: resolve which DoT path the player is on from their passives + sub-variant.
  private getDotPath(player: PlayerSnapshot): 'poison' | 'fire' | 'frost' {
    const p = player.passives;
    if ((p['dot.fan-the-flames'] ?? 0) > 0 || (p['dot.smoldering-ember'] ?? 0) > 0 || (p['dot.conflagration'] ?? 0) > 0) return 'fire';
    if ((p['dot.permafrost'] ?? 0) > 0 || (p['dot.freezing-cold'] ?? 0) > 0 || (p['dot.glacial-fracture'] ?? 0) > 0) return 'frost';
    if ((p['dot.poison-explosion'] ?? 0) > 0 || (p['dot.eternal-doom'] ?? 0) > 0 || (p['dot.invigorating-toxins'] ?? 0) > 0) return 'poison';
    // Fall back to tier-1 sub-variant choice
    if (player.selectedSubVariant === 'balanced') return 'fire';
    if (player.selectedSubVariant === 'heavy')    return 'frost';
    return 'poison';
  }

  /** Expanding translucent ring used to show AoE splash extent on empowered hits. */
  private fxAoeRing(x: number, y: number, radius: number, color: number): void {
    const ring = this.add.graphics({ x, y }).setDepth(11);
    ring.lineStyle(2.5, color, 0.65);
    ring.strokeCircle(0, 0, 1);
    this.tweens.add({
      targets:  ring,
      scaleX:   radius,
      scaleY:   radius,
      alpha:    0,
      duration: 420,
      ease:     'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  private playOneShotEffect(id: string, x: number, y: number, opts?: { scale?: number; depth?: number }): void {
    const def = EFFECT_BY_ID.get(id);
    if (!def) return;

    const size = (def.baseSize ?? 96) * (opts?.scale ?? def.scale ?? 1.5);
    const startFrame = def.startFrame ?? 0;
    const endFrame = def.endFrame ?? EFFECT_FRAME_COUNT - 1;
    const sprite = this.add
      .sprite(x, y + (def.anchorYPx ?? 0), def.key)
      .setDepth(opts?.depth ?? def.depth ?? 12)
      .setDisplaySize(size, size)
      .setFrame(startFrame);
    const proxy = { frame: startFrame };

    this.tweens.add({
      targets: proxy,
      frame: endFrame,
      duration: def.durationMs,
      ease: 'Linear',
      onUpdate: () => {
        sprite.setFrame(Math.max(startFrame, Math.min(endFrame, Math.floor(proxy.frame))));
      },
      onComplete: () => sprite.destroy(),
    });
  }

  spawnAttackEffect(
    style: string,
    fromX: number, fromY: number,
    toX: number, toY: number,
    flags?: { empowered?: boolean; execution?: boolean; archetype?: CombatArchetype; dotPath?: 'poison' | 'fire' | 'frost' },
  ): void {
    const empowered = flags?.empowered ?? false;
    const execution = flags?.execution ?? false;
    const archetype = flags?.archetype;
    const dotPath   = flags?.dotPath;

    // AoE ring on all empowered/execution hits — color matches archetype.
    if (empowered || execution) {
      const ringColor = archetype === 'cadence'  ? 0x4499ff
                      : archetype === 'cooldown' ? 0xddeeff
                      : archetype === 'energy'   ? 0x88aaff
                      : archetype === 'reload'   ? 0xffeedd
                      : 0xffdd22;
      this.fxAoeRing(toX, toY, GAME_CONFIG.EMPOWERED_AOE_RADIUS, ringColor);
    }

    // Class-mechanic dispatch — own player attacks only (flags.archetype is set).
    // Each class uses its own visual language regardless of equipped weapon style.
    if (archetype === 'cadence')  return this.fxSlash(fromX, fromY, toX, toY, empowered, true);
    if (archetype === 'cooldown') return this.fxImpact(toX, toY, execution);
    if (archetype === 'reload')   return this.fxGunshot(fromX, fromY, toX, toY, empowered);
    if (archetype === 'energy')   return this.fxLightning(fromX, fromY, toX, toY, empowered);
    if (archetype === 'dot') {
      switch (dotPath) {
        case 'fire':  return this.fxFireFlame(toX, toY, empowered);
        case 'frost': return this.fxFrostSnowflake(toX, toY, empowered);
        default:      return this.fxPoisonSmog(toX, toY, empowered);
      }
    }

    // No archetype (pre-class player or monster) — fall back to weapon style.
    switch (style) {
      case 'slash':  return this.fxSlash(fromX, fromY, toX, toY, empowered);
      case 'poison': return this.fxPoison(toX, toY);
      case 'magic':  return this.fxMagic(fromX, fromY, toX, toY);
      case 'frost':  return this.fxFrost(toX, toY);
      case 'fire':   return this.fxFire(toX, toY);
      case 'void':   return this.fxVoid(toX, toY);
      case 'impact':
      default:       return this.fxImpact(toX, toY, execution);
    }
  }

  /**
   * Spawn a damage number that floats upward and fades out over ~900ms.
   * barOffsetY is the same value used to position the HP bar above the sprite,
   * so the number starts just above the bar.
   */
  spawnDamageNumber(spriteX: number, spriteY: number, barOffsetY: number, amount: number, color: string): void {
    const jitter = (Math.random() - 0.5) * 18;
    const startY = spriteY - barOffsetY - 6;
    const text = this.add
      .text(spriteX + jitter, startY, String(amount), {
        color,
        fontSize: '14px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setDepth(15)
      .setOrigin(0.5, 1);

    this.tweens.add({
      targets: text,
      y: startY - 40,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Draw debug range circles each frame.
   * Player attack range — yellow-green.
   * Monster pull range — orange, leash range — dim blue, attack range — red.
   */
  private drawDebugRanges(): void {
    this.debugGraphics.clear();

    if (this.debugPlayerRange) {
      const ownSprite = this.state.ownId ? this.state.sprite.get(this.state.ownId) : undefined;
      const player = getOwnSnapshot(this.state);
      if (ownSprite && player) {
        const r = player.attackRange;
        this.debugGraphics.lineStyle(1.5, 0xaaff44, 0.55);
        this.debugGraphics.strokeCircle(ownSprite.x, ownSprite.y, r);
      }
    }

    if (this.debugEnemyRanges) {
      for (const id of this.state.ids) {
        if (this.state.kind.get(id) !== 'monster') continue;
        const sprite = this.state.sprite.get(id);
        const ranges = this.state.debugRanges.get(id);
        if (!sprite || !ranges) continue;

        const cx = sprite.x;
        const cy = sprite.y;

        if (ranges.pullRange != null) {
          this.debugGraphics.lineStyle(1, 0xff8844, 0.5);
          this.debugGraphics.strokeCircle(cx, cy, ranges.pullRange);
        }
        if (ranges.leashRange != null) {
          this.debugGraphics.lineStyle(1, 0x4466cc, 0.35);
          this.debugGraphics.strokeCircle(cx, cy, ranges.leashRange);
        }
        if (ranges.attackRange != null) {
          this.debugGraphics.lineStyle(1, 0xff4444, 0.6);
          this.debugGraphics.strokeCircle(cx, cy, ranges.attackRange);
        }
      }
    }
  }

  /** Emit a player:move command toward the exit that leads to autoPath[0]. */
  sendAutoPathMove(fromNodeId: string): void {
    if (this.autoPath.length === 0 || !this.myId) return;
    const [, curRStr, curCStr] = fromNodeId.split('-');
    const [, nxtRStr, nxtCStr] = this.autoPath[0].split('-');
    const dr = parseInt(nxtRStr, 10) - parseInt(curRStr, 10);
    const dc = parseInt(nxtCStr, 10) - parseInt(curCStr, 10);

    const W = GAME_CONFIG.NODE_WIDTH;
    const H = GAME_CONFIG.NODE_HEIGHT;
    let x: number, y: number;
    if      (dr === -1) { x = W / 2; y = 5; }          // north
    else if (dr ===  1) { x = W / 2; y = H - 5; }      // south
    else if (dc === -1) { x = 5;     y = H / 2; }       // west
    else if (dc ===  1) { x = W - 5; y = H / 2; }       // east
    else { this.cancelAutoPath(); return; }              // shouldn't happen

    x = Math.round(x); y = Math.round(y);
    sendMove(this.socket, x, y);
    const transform = this.state.ownId ? this.state.transform.get(this.state.ownId) : undefined;
    if (transform) {
      transform.targetX = x;
      transform.targetY = y;
    }
  }

  cancelAutoPath(): void {
    this.autoPath = [];
    hudBus.emit({ autoPath: null });
  }

}
