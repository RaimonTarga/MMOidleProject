import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerState,
  MonsterState,
  NodeSnapshot,
  NodeDirection,
  EquipmentSlot,
  CombatArchetype,
  CombatEvent,
} from '@mmo-idle/shared';
import { GAME_CONFIG, NODE_BIOMES, BIOME_DATABASE, biomeXpForLevel, ESSENCE_COLORS, biomeLevelCap, RECIPE_DATABASE } from '@mmo-idle/shared';
import type { EssenceType } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { combatLog } from '../combatLog';
import { ATLAS_KEY, getPlayerFrame, getMonsterFrame, getPlayerShadowColor, getPlayerShadowOffset, getMonsterShadowOffset, BIOME_TEXTURES } from '../sprites';
import { accountId, displayName } from '../clientAuth';
import { EFFECT_BY_ID, EFFECT_DEFS, EFFECT_FRAME_COUNT, EFFECT_GRID } from '../effects';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// In dev (Vite server on :3000), point explicitly at the Express server.
// In production (client served by Express on :4000), use the same origin.
const SERVER_URL = import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin;

// ── Minimap layout constants ───────────────────────────────────────────────────
const MM_W   = 220;  // minimap width  (px, screen-space)
const MM_H   = 165;  // minimap height (px, screen-space)
const MM_PAD = 8;    // gap from the screen edges

// ── Biome XP bar constants ─────────────────────────────────────────────────────
const XP_WIDGET_H = 56;  // total widget height (px, screen-space)
const XP_FILL_H   = 16;  // fill bar height (px)

const BIOME_BAR_COLORS: Record<string, number> = {
  plains:     0x6daa3a,
  forest:     0x2d8b3a,
  swamp:      0x4a7a2a,
  mountain:   0x7899aa,
  cave:       0x7a5a3a,
  jungle:     0x1a7a30,
  desert:     0xd4922a,
  tundra:     0x7ab8d4,
  volcanic:   0xcc3a1a,
  necropolis: 0x8a3aaa,
  abyss:      0x3a2a7a,
  clearing:   0x5aaa5a,
};

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

// ── Depth layer system ────────────────────────────────────────────────────────
// Entities use Y-sorted depths: depth = BAND + entity.baseY, updated every frame
// in stepEntities. Band spacing (3000) > NODE_HEIGHT (2400) so bands never overlap.
// Transient FX and HUD objects use fixed depths outside the entity bands.
const DEPTH = {
  // World-space backgrounds (negative = behind all entities)
  BG:            -300,
  BG_TILE:       -200,
  BG_GRID:       -100,

  // Y-sorted entity bands (base + entity.baseY gives final depth)
  SHADOW:           0,   //   0 + y — ground shadow ellipses
  SPRITE:        3000,   //  3000 + y — entity sprites
  FX_OVERLAY:    6000,   //  6000 + y — persistent status effect overlays
  UI:            9000,   //  9000 + y — labels, HP bars, cooldown bars

  // Transient world-space objects (fixed depths — short-lived, not Y-sorted)
  FLOATER:      12000,   // damage numbers, kill reward texts
  FX:           12500,   // attack animations, one-shot effects

  // Static world-space markers
  GATE:         13000,   // exit gate markers
  DEBUG:        14000,   // debug range circles

  // Screen-space HUD (scrollFactor 0 — these never scroll with the camera)
  MINIMAP:      15000,
  XP_BAR:       16000,   // +100 = text layer, +200 = flash overlay

  // Full-screen modal overlays (death, ascension)
  SCREEN:       50000,
} as const;

interface Visual {
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  /** Last frame name used — tracked so sprite can be swapped when a player unlocks a class. */
  currentFrame?: string | null;
  /** Ellipse drawn below the sprite — black for monsters, level-colored for players. */
  shadow: Phaser.GameObjects.Ellipse;
  /** Px below sprite center where the shadow sits — set at creation, read every frame. */
  shadowOffsetY: number;
  /** Last playerTier used to color the player shadow — skips redundant setFillStyle calls. */
  shadowLevel?: number;
  label: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  cdBar: Phaser.GameObjects.Graphics;
  targetX: number;
  targetY: number;
  /**
   * Smooth interpolation base — updated by stepEntities each frame toward targetX/targetY.
   * Kept separate from sprite.x/y so lunge offsets don't corrupt the interpolation math.
   */
  baseX: number;
  baseY: number;
  /** Client-only lunge offset, tweened to 0 after a melee attack. sprite renders at base+lunge. */
  lungeOffsetX: number;
  lungeOffsetY: number;
  hp: number;
  maxHp: number;
  /** Movement speed in px/s — used by stepEntities for per-entity interpolation. */
  speed: number;
  /** Distance from sprite.y to the top edge of the HP bar (px). */
  barOffsetY: number;
  attackCooldown: number;
  lastAttackAt: number;
  attackTargetId: string | null;
  attackStyle: string;
  /** Raw name used for combat-log attribution (monsters only). */
  entityName?: string;
  /** Full authoritative state snapshot — only present on player visuals, not monsters. */
  playerState?: PlayerState;
  /** Monster range values — only present on monster visuals. */
  pullRange?: number;
  leashRange?: number;
  monsterAttackRange?: number;
  /** 'melee' monsters play a lunge animation on attack. Only set for monster visuals. */
  monsterBehavior?: string;
  /** World-space status overlays keyed by client effect id. */
  effectOverlays: Map<string, Phaser.GameObjects.Sprite>;
  /** Active server-driven effects keyed by client effect id; value is remaining milliseconds. */
  activeEffects: Record<string, number>;
  /** Active server-driven effects keyed by client effect id; value is an exact spritesheet frame. */
  activeEffectFrames: Record<string, number>;
}

export class GameScene extends Phaser.Scene {
  private socket!: GameSocket;
  private players  = new Map<string, Visual>();
  private monsters = new Map<string, Visual>();
  private myId     = '';
  /** Tracks own player's current node — used for gate rendering and snap detection. */
  private myNodeId = '';
  /** Gate markers are static world-space graphics; only redrawn when node changes. */
  private lastDrawnNodeId = '';
  /** Yellow dot shown at the last click destination (world-space). */
  private targetMarker!: Phaser.GameObjects.Arc;
  private autoMode       = false;

  private minimap!: Phaser.GameObjects.Graphics;
  private biomeXpGraphics!:   Phaser.GameObjects.Graphics;
  private biomeXpFlash!:      Phaser.GameObjects.Rectangle;
  private biomeXpLabelText!:  Phaser.GameObjects.Text;
  private biomeXpStatusText!: Phaser.GameObjects.Text;
  private biomeXpNumsText!:   Phaser.GameObjects.Text;
  private biomeXpFlashTween:      Phaser.Tweens.Tween | null = null;
  private lastBiomeXp           = -1;
  private lastBiomeGroup        = '';
  private displayedFillFraction = 0;
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
  /** Remaining auto-path hops (nodeIds to visit, not including current node). */
  private autoPath: string[] = [];
  /** Invisible point the camera follows — positioned at the player's baseX/Y so
   *  lunge offsets on the sprite don't cause the camera to jerk. */
  private cameraTarget!: Phaser.GameObjects.Arc;

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
      .setDepth(DEPTH.BG);

    // ── Grid overlay (world-space, transparent cells so bgRect shows through) ──
    this.createGridBackground();

    this.targetMarker = this.add
      .circle(0, 0, 5, 0xffff44, 0.8)
      .setVisible(false);

    // ── Exit gate markers (world-space; no scrollFactor — visible only near edges) ──
    // Drawn once per node change, not every frame.
    this.exitMarkers = this.add.graphics().setDepth(DEPTH.GATE);

    // ── Debug range overlay (above all entities, below minimap) ───────────────
    this.debugGraphics = this.add.graphics().setDepth(DEPTH.DEBUG);

    // ── Camera anchor (invisible; follows base position, not lunge-offset sprite) ──
    this.cameraTarget = this.add.arc(0, 0, 1).setAlpha(0);

    // ── Minimap ────────────────────────────────────────────────────────────────
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.MINIMAP);

    // ── Biome XP bar ──────────────────────────────────────────────────────────
    this.biomeXpGraphics   = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.XP_BAR);
    this.biomeXpFlash      = this.add.rectangle(0, 0, 1, 1, 0xffffff, 0)
      .setScrollFactor(0).setDepth(DEPTH.XP_BAR + 200).setOrigin(0, 0);
    this.biomeXpLabelText  = this.add.text(0, 0, '', {
      color: '#aabbcc', fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(DEPTH.XP_BAR + 100).setOrigin(0, 0);
    this.biomeXpStatusText = this.add.text(0, 0, '', {
      color: '#c8d8e8', fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(DEPTH.XP_BAR + 100).setOrigin(1, 0);
    this.biomeXpNumsText   = this.add.text(0, 0, '', {
      color: '#778899', fontSize: '10px', fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(DEPTH.XP_BAR + 100).setOrigin(0.5, 0);

    // ── Auto toggle from HUD ───────────────────────────────────────────────
    window.addEventListener('hud:toggleAuto', () => {
      this.setAutoMode(!this.autoMode);
    });

    // ── Skill unlock from SkillTreePanel ───────────────────────────────────
    window.addEventListener('hud:unlockSkill', (e: Event) => {
      const skillId = (e as CustomEvent<string>).detail;
      this.socket.emit('player:unlockSkill', skillId);
    });

    // ── Inventory actions from InventoryPanel ──────────────────────────────
    window.addEventListener('hud:equipItem', (e: Event) => {
      const definitionId = (e as CustomEvent<string>).detail;
      this.socket.emit('inventory:equipItem', definitionId);
    });

    window.addEventListener('hud:unequipItem', (e: Event) => {
      const slot = (e as CustomEvent<EquipmentSlot>).detail;
      this.socket.emit('inventory:unequip', slot);
    });

    window.addEventListener('hud:craftRecipe', (e: Event) => {
      const recipeId = (e as CustomEvent<string>).detail;
      this.socket.emit('crafting:craftRecipe', recipeId);
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
      this.sendAutoPathMove(this.myNodeId);
    });

    window.addEventListener('hud:goToTestRoom', () => {
      this.socket.emit('debug:goToTestRoom');
    });

    window.addEventListener('hud:leaveTestRoom', () => {
      this.socket.emit('debug:leaveTestRoom');
    });

    window.addEventListener('hud:resetProgress', () => {
      this.socket.emit('debug:resetProgress');
    });

    window.addEventListener('hud:refreshRecipes', () => {
      this.socket.emit('debug:refreshRecipes');
    });

    // ── Click to move ──────────────────────────────────────────────────────
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.myId) return;

      const tx = Math.round(pointer.worldX);
      const ty = Math.round(pointer.worldY);

      if (this.autoMode) this.setAutoMode(false);
      if (this.autoPath.length > 0) this.cancelAutoPath();

      this.socket.emit('player:move', { x: tx, y: ty });

      const vp = this.players.get(this.myId);
      if (vp) {
        vp.targetX = tx;
        vp.targetY = ty;
      }

      this.targetMarker.setPosition(tx, ty).setVisible(true);
    });

    // ── Tab visibility snap ────────────────────────────────────────────────
    // When the browser un-throttles the tab, snap every entity to its last
    // authoritative position so they don't slide in from a stale spot.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      for (const v of [...this.players.values(), ...this.monsters.values()]) {
        v.baseX = v.targetX;
        v.baseY = v.targetY;
        v.lungeOffsetX = 0;
        v.lungeOffsetY = 0;
      }
    });

    // ── Socket.IO ──────────────────────────────────────────────────────────
    this.socket = io(SERVER_URL, {
      auth: { accountId, displayName },
    }) as GameSocket;

    this.socket.on('connect', () => {
      this.myId = this.socket.id ?? '';
      hudBus.emit({ status: 'connected' });
      const own = this.players.get(this.myId);
      if (own) this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);
    });

    this.socket.on('disconnect', () => {
      hudBus.emit({ status: 'disconnected', player: null });
      this.myId = '';
    });

    this.socket.on('state:sync', (snapshot) => this.applySnapshot(snapshot));
    this.socket.on('node:state',  (snapshot) => this.applySnapshot(snapshot));

    this.socket.on('crafting:result', (result) => {
      window.dispatchEvent(new CustomEvent('hud:craftResult', { detail: result }));
    });

    this.socket.on('player:died', () => {
      combatLog.push('death', 'You were defeated');
      this.showDeathOverlay();
    });

    this.socket.on('player:ascended', (tier) => {
      this.showAscensionOverlay(tier);
    });
  }

  update(_time: number, delta: number) {
    // Cap dt to 100 ms so a backgrounded tab returning doesn't teleport entities
    // or instantly expire all status effects on the first resumed frame.
    const dt = Math.min(delta, 100) / 1000;
    this.stepEntities(this.players,  dt);
    this.stepEntities(this.monsters, dt);
    this.drawMinimap();
    this.drawBiomeXpBar(dt);

    // Redraw exit gate markers and update biome background only when node changes.
    if (this.myNodeId !== this.lastDrawnNodeId) {
      this.drawExitMarkers();
      this.updateBiomeBackground();
      this.lastDrawnNodeId = this.myNodeId;
    }

    const own = this.players.get(this.myId);
    if (own && this.targetMarker.visible) {
      const dx = own.sprite.x - this.targetMarker.x;
      const dy = own.sprite.y - this.targetMarker.y;
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
      .setDepth(DEPTH.BG_GRID);
  }

  private setAutoMode(enabled: boolean): void {
    this.autoMode = enabled;
    this.socket.emit('player:setAuto', enabled);
    if (enabled) this.targetMarker.setVisible(false);

    const own = this.players.get(this.myId);
    if (own?.playerState) {
      hudBus.emit({ player: { ...own.playerState, auto: enabled } });
    }
  }

  private applySnapshot(snapshot: NodeSnapshot) {
    const livePlayers = new Set(snapshot.players.map((p) => p.id));
    for (const id of this.players.keys()) {
      if (id !== this.myId && !livePlayers.has(id)) this.destroyVisual(this.players, id);
    }
    snapshot.players.forEach((p) => this.upsertPlayer(p));

    // Process queued combat events after player upsert (need latest playerState).
    // Events fire for own player only; other players' attacks are not tracked here.
    for (const ev of snapshot.events) {
      this.processCombatEvent(ev);
    }

    const liveMonsters = new Set(snapshot.monsters.map((m) => m.id));
    for (const id of this.monsters.keys()) {
      if (!liveMonsters.has(id)) this.destroyVisual(this.monsters, id);
    }
    snapshot.monsters.forEach((m) => this.upsertMonster(m));
  }

  private processCombatEvent(ev: CombatEvent) {
    if (!('playerId' in ev) || ev.playerId !== this.myId) return;

    if (ev.kind === 'player-hit') {
      combatLog.push('damage-out', `${ev.targetName} −${ev.damage}`);
      if (ev.empowered) combatLog.push('empowered', `Empowered strike → ${ev.targetName}`);
      if (ev.execution) combatLog.push('execution', `Execution strike → ${ev.targetName}`);

      const ownVp     = this.players.get(this.myId);
      const targetVm  = this.monsters.get(ev.targetId);
      if (ownVp && targetVm && ownVp.playerState) {
        const p       = ownVp.playerState;
        const dotPath = p.combatArchetype === 'dot' ? this.getDotPath(p) : undefined;
        const targetEffectScale = this.getEffectScaleForVisual(targetVm);
        this.spawnAttackEffect(ownVp.attackStyle, ownVp.sprite.x, ownVp.sprite.y,
          targetVm.sprite.x, targetVm.sprite.y, {
            empowered: ev.empowered,
            execution: ev.execution,
            archetype: p.combatArchetype ?? undefined,
            dotPath,
          });
        for (const effectId of ev.effects ?? []) {
          this.playOneShotEffect(effectId, targetVm.sprite.x, targetVm.sprite.y, { scale: targetEffectScale });
        }
        if (p.attackRange <= 150) this.playMeleeLunge(ownVp, targetVm.baseX, targetVm.baseY);
      }
    }

    if (ev.kind === 'player-kill') {
      combatLog.push('kill', `${ev.targetName} defeated`);
      if (ev.playerId === this.myId) {
        const vm        = this.monsters.get(ev.targetId);
        const biomeInfo = NODE_BIOMES[this.myNodeId];
        if (vm && biomeInfo) {
          this.spawnKillRewards(
            vm.sprite.x, vm.sprite.y, vm.barOffsetY,
            ev.biomeXpGained, biomeInfo.biomeGroup,
            ev.essenceGained, ev.essenceType,
          );
        }
        if (ev.essenceGained > 0) {
          window.dispatchEvent(new CustomEvent('hud:essenceGained', { detail: ev.essenceType }));
        }
      }
    }
  }

  /** Interpolate sprites toward their targets and redraw HP + cooldown bars every frame. */
  private stepEntities(map: Map<string, Visual>, dt: number) {
    const now = Date.now();
    const ownVp = this.players.get(this.myId);

    for (const v of map.values()) {
      const { sprite, label, hpBar, cdBar } = v;

      // Move the interpolation base toward the authoritative target.
      // sprite.x/y = baseX/Y + lungeOffset, so we never use sprite.x/y for math.
      const dx = v.targetX - v.baseX;
      const dy = v.targetY - v.baseY;
      const distSq = dx * dx + dy * dy;
      if (distSq > 1) {
        const dist = Math.sqrt(distSq);
        const step = Math.min(v.speed * dt, dist);
        v.baseX += (dx / dist) * step;
        v.baseY += (dy / dist) * step;
      } else {
        v.baseX = v.targetX;
        v.baseY = v.targetY;
      }
      sprite.setPosition(v.baseX + v.lungeOffsetX, v.baseY + v.lungeOffsetY);
      v.shadow.setPosition(v.baseX + v.lungeOffsetX, v.baseY + v.lungeOffsetY + v.shadowOffsetY);

      // Y-sort: update depths every frame so entities lower on screen draw in front.
      const sortY = v.baseY;
      v.shadow.setDepth(DEPTH.SHADOW + sortY);
      sprite.setDepth(DEPTH.SPRITE + sortY);
      label.setDepth(DEPTH.UI + sortY);
      hpBar.setDepth(DEPTH.UI + sortY);
      cdBar.setDepth(DEPTH.UI + sortY);

      this.updateStatusOverlays(v, dt);

      // Keep the camera anchor on the base position so lunge offsets don't move the camera.
      if (v === ownVp) this.cameraTarget.setPosition(v.baseX, v.baseY);

      // Update player shadow style when tier changes (level 0 = fill, 1+ = stroke).
      if (v.playerState) {
        const lvl = v.playerState.playerTier;
        if (lvl !== v.shadowLevel) {
          this.applyPlayerShadowStyle(v.shadow, lvl);
          v.shadowLevel = lvl;
        }
      }

      // HP bar
      const barY    = sprite.y - v.barOffsetY;
      const hpPct   = v.maxHp > 0 ? Math.max(0, v.hp / v.maxHp) : 0;
      const hpColor = hpPct > 0.5 ? 0x44ee44 : hpPct > 0.25 ? 0xeeaa22 : 0xee3322;
      hpBar.clear();
      hpBar.fillStyle(0x1a1a1a);
      hpBar.fillRect(sprite.x - 16, barY, 32, 4);
      hpBar.fillStyle(hpColor);
      hpBar.fillRect(sprite.x - 16, barY, Math.round(32 * hpPct), 4);

      // Shield layer — teal segment extending from the HP fill edge, capped at bar width
      const shields = v.playerState?.shields;
      if (shields && shields.length > 0) {
        const totalShield = shields.reduce((sum, s) => sum + s.amount, 0);
        const shieldPct   = v.maxHp > 0 ? totalShield / v.maxHp : 0;
        const shieldStart = Math.round(32 * hpPct);
        const shieldWidth = Math.min(32 - shieldStart, Math.round(32 * shieldPct));
        if (shieldWidth > 0) {
          hpBar.fillStyle(0x44ccdd, 0.9);
          hpBar.fillRect(sprite.x - 16 + shieldStart, barY, shieldWidth, 4);
        }
      }

      // HP bar border
      hpBar.lineStyle(1, 0x000000, 0.75);
      hpBar.strokeRect(sprite.x - 16.5, barY - 0.5, 33, 5);

      // Cooldown bar — only visible while attacking
      cdBar.clear();
      if (v.attackTargetId !== null) {
        const cdPct  = Math.min(1, (now - v.lastAttackAt) / Math.max(1, v.attackCooldown));
        const cdColor = cdPct >= 1 ? 0xffdd22 : 0x4466cc;
        const cdBarY  = barY + 6;
        cdBar.fillStyle(0x1a1a1a);
        cdBar.fillRect(sprite.x - 16, cdBarY, 32, 3);
        cdBar.fillStyle(cdColor);
        cdBar.fillRect(sprite.x - 16, cdBarY, Math.round(32 * cdPct), 3);
        cdBar.lineStyle(1, 0x000000, 0.75);
        cdBar.strokeRect(sprite.x - 16.5, cdBarY - 0.5, 33, 4);
      }

      label.setPosition(sprite.x - 16, barY - 12);
    }
  }

  private updateStatusOverlays(v: Visual, dt: number): void {
    for (const [id, overlay] of v.effectOverlays) {
      const remainingMs = v.activeEffects[id] ?? 0;
      const frame = v.activeEffectFrames[id];
      if (remainingMs <= 0 && frame == null) {
        overlay.destroy();
        v.effectOverlays.delete(id);
      }
    }

    const effectIds = new Set([
      ...Object.keys(v.activeEffects),
      ...Object.keys(v.activeEffectFrames),
    ]);

    for (const id of effectIds) {
      const def = EFFECT_BY_ID.get(id);
      const explicitFrame = v.activeEffectFrames[id];
      const remainingMsRaw = v.activeEffects[id] ?? 0;
      const remainingMs = Math.max(0, remainingMsRaw);
      if (!def || (remainingMs <= 0 && explicitFrame == null)) {
        v.activeEffects[id] = 0;
        continue;
      }

      let overlay = v.effectOverlays.get(id);
      if (!overlay) {
        overlay = this.add
          .sprite(v.sprite.x, v.sprite.y, def.key)
          .setDepth(DEPTH.FX_OVERLAY + v.baseY);
        v.effectOverlays.set(id, overlay);
      }
      overlay.setDepth(DEPTH.FX_OVERLAY + v.baseY);

      let rawFrame: number;
      if (explicitFrame != null && def.loopFrames != null && def.loopFrames > 0) {
        const t = (this.time.now / def.durationMs) % 1;
        const offset = Math.min(def.loopFrames - 1, Math.floor(t * def.loopFrames));
        rawFrame = explicitFrame + offset;
      } else if (explicitFrame != null) {
        rawFrame = explicitFrame;
      } else {
        rawFrame = Math.floor((remainingMs / def.durationMs) * EFFECT_FRAME_COUNT);
      }
      const frame = Math.max(0, Math.min(EFFECT_FRAME_COUNT - 1, rawFrame));
      overlay.setFrame(frame);

      // Compute display size from the active frame's natural aspect ratio.
      // Sheets with rowSlices have non-square frames per row, so a fixed
      // square `setDisplaySize` would squash rows of differing height.
      const baseW = (def.baseSize ?? 96) * this.getEffectScaleForVisual(v, def.scale);
      const fw = overlay.frame.width  || def.frameSize;
      const fh = overlay.frame.height || def.frameSize;
      overlay.setDisplaySize(baseW, baseW * (fh / fw));

      overlay
        .setPosition(v.sprite.x, v.sprite.y + (def.anchorYPx ?? -4))
        .setVisible(true);
      if (explicitFrame == null) {
        v.activeEffects[id] = Math.max(0, remainingMs - dt * 1000);
      }
    }
  }

  private getEffectScaleForVisual(v: Visual, baseScale = 1.5): number {
    const bossScale = Math.max(v.sprite.displayWidth, v.sprite.displayHeight) > 64 ? 1.33 : 1;
    return baseScale * bossScale;
  }

  /**
   * Attempts to create an Image from the game atlas for the given frame.
   * Returns null if the atlas isn't loaded or the frame doesn't exist,
   * so the caller can fall back to a placeholder rectangle.
   */
  private tryMakeImage(
    x: number, y: number,
    frame: string | null,
    displayW: number, displayH: number,
  ): Phaser.GameObjects.Image | null {
    if (!frame) return null;
    if (!this.textures.exists(ATLAS_KEY)) return null;
    if (!this.textures.get(ATLAS_KEY).has(frame)) return null;
    return this.add.image(x, y, ATLAS_KEY, frame).setDisplaySize(displayW, displayH);
  }

  /** Level 0 → black filled ellipse (same as monsters). Level 1+ → bright stroke outline, no fill. */
  private applyPlayerShadowStyle(shadow: Phaser.GameObjects.Ellipse, level: number): void {
    if (level === 0) {
      shadow.setFillStyle(0x000000, 0.45);
      shadow.setStrokeStyle();
    } else {
      shadow.setFillStyle();
      shadow.setStrokeStyle(3, getPlayerShadowColor(level), 1);
    }
  }

  private upsertPlayer(player: PlayerState) {
    const isOwn = player.id === this.myId;
    let vp = this.players.get(player.id);

    if (!vp) {
      const frame  = getPlayerFrame(player);
      const color  = isOwn ? 0x44ff88 : 0x4488ff;
      const shadowOffsetY = getPlayerShadowOffset();
      const shadow = this.add.ellipse(player.x, player.y + shadowOffsetY, 52, 14).setDepth(DEPTH.SHADOW + player.y);
      this.applyPlayerShadowStyle(shadow, player.playerTier);
      const sprite = (this.tryMakeImage(player.x, player.y, frame, 64, 64)
        ?? this.add.rectangle(player.x, player.y, 64, 64, color)).setDepth(DEPTH.SPRITE + player.y);
      const label  = this.add.text(0, 0, player.name, {
        color: '#ffffff', fontSize: '10px', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 3,
      }).setDepth(DEPTH.UI + player.y);
      const hpBar = this.add.graphics().setDepth(DEPTH.UI + player.y);
      const cdBar = this.add.graphics().setDepth(DEPTH.UI + player.y);
      vp = {
        sprite, shadow, shadowOffsetY, label, hpBar, cdBar,
        currentFrame:   frame,
        shadowLevel:    player.playerTier,
        targetX: player.targetX, targetY: player.targetY,
        baseX: player.x, baseY: player.y,
        lungeOffsetX: 0, lungeOffsetY: 0,
        hp: player.hp, maxHp: player.maxHp,
        speed: player.speed, barOffsetY: 40,
        effectOverlays: new Map<string, Phaser.GameObjects.Sprite>(),
        activeEffects:  player.activeEffects ?? {},
        activeEffectFrames: player.activeEffectFrames ?? {},
        attackCooldown: player.attackCooldown,
        lastAttackAt:   player.lastAttackAt,
        attackTargetId: player.attackTargetId,
        attackStyle:    player.attackStyle,
        playerState:    player,
      };
      this.players.set(player.id, vp);

      if (isOwn) {
        this.cameraTarget.setPosition(player.x, player.y);
        this.cameras.main.startFollow(this.cameraTarget, true, 0.1, 0.1);
        this.myNodeId = player.nodeId;
        hudBus.emit({ player });
      }
      return;
    }

    // Detect node transition for own player — snap to the new position immediately.
    if (isOwn && player.nodeId !== this.myNodeId) {
      vp.baseX = player.x;
      vp.baseY = player.y;
      vp.sprite.setPosition(player.x, player.y);

      // Advance auto-path when we enter the expected next node.
      if (this.autoPath.length > 0) {
        if (this.autoPath[0] === player.nodeId) {
          this.autoPath.shift();
          if (this.autoPath.length > 0) {
            hudBus.emit({ autoPath: [...this.autoPath] });
            this.sendAutoPathMove(player.nodeId);
          } else {
            this.cancelAutoPath(); // reached destination
          }
        } else {
          this.cancelAutoPath(); // ended up somewhere unexpected
        }
      }
    }

    // Swap sprite when the player's class/variant changes (e.g. after unlocking a root node).
    const newFrame = getPlayerFrame(player);
    if (newFrame !== vp.currentFrame) {
      vp.sprite.destroy();
      const color = isOwn ? 0x44ff88 : 0x4488ff;
      vp.sprite = (this.tryMakeImage(vp.baseX, vp.baseY, newFrame, 64, 64)
        ?? this.add.rectangle(vp.baseX, vp.baseY, 64, 64, color)).setDepth(DEPTH.SPRITE + vp.baseY);
      vp.currentFrame = newFrame;
    }

    const prevPlayerAttackAt  = vp.lastAttackAt;
    const prevPlayerHp        = vp.hp;
    const prevTotalShield     = vp.playerState?.shields.reduce((sum, s) => sum + s.amount, 0) ?? 0;
    const prevRecipes         = new Set(vp.playerState?.unlockedRecipes ?? []);
    vp.targetX        = player.targetX;
    vp.targetY        = player.targetY;
    vp.hp             = player.hp;
    vp.maxHp          = player.maxHp;
    vp.speed          = player.speed;
    vp.activeEffects  = player.activeEffects ?? {};
    vp.activeEffectFrames = player.activeEffectFrames ?? {};
    vp.attackCooldown = player.attackCooldown;
    vp.lastAttackAt   = player.lastAttackAt;
    vp.attackTargetId = player.attackTargetId;
    vp.attackStyle    = player.attackStyle;
    vp.playerState    = player;

    if (player.hp < prevPlayerHp) {
      const dmgColor = isOwn ? '#ff4444' : '#ff8844';
      this.spawnDamageNumber(vp.sprite.x, vp.sprite.y, vp.barOffsetY, Math.round(prevPlayerHp - player.hp), dmgColor);
      if (isOwn) combatLog.push('damage-in', `Took ${Math.round(prevPlayerHp - player.hp)} damage`);
    }

    if (isOwn && player.hp > prevPlayerHp && prevPlayerHp > 0) {
      const healed = Math.round(player.hp - prevPlayerHp);
      if (healed >= 1) combatLog.push('heal', `Recovered ${healed} HP`);
    }

    if (isOwn) {
      const newTotalShield = player.shields.reduce((sum, s) => sum + s.amount, 0);
      if (newTotalShield > prevTotalShield) {
        combatLog.push('shield', `Shield +${Math.round(newTotalShield - prevTotalShield)}`);
      }
    }

    // Attack animations for OTHER players — own player uses event queue instead.
    if (!isOwn && player.lastAttackAt > prevPlayerAttackAt && player.attackTargetId) {
      const targetVm = this.monsters.get(player.attackTargetId);
      if (targetVm) {
        this.spawnAttackEffect(vp.attackStyle, vp.sprite.x, vp.sprite.y, targetVm.sprite.x, targetVm.sprite.y, {
          empowered: false,
          execution: false,
          archetype: player.combatArchetype ?? undefined,
        });
        if (player.attackRange <= 150) this.playMeleeLunge(vp, targetVm.baseX, targetVm.baseY);
      }
    }

    if (isOwn) {
      this.myNodeId = player.nodeId;
      this.autoMode = player.auto;

      for (const id of player.unlockedRecipes) {
        if (!prevRecipes.has(id)) {
          const recipe = RECIPE_DATABASE.get(id);
          if (recipe) hudBus.notifyRecipeUnlock(recipe.name, recipe.recipeGroup);
        }
      }

      hudBus.emit({ player });
    }
  }

  private upsertMonster(monster: MonsterState) {
    let vm = this.monsters.get(monster.id);
    if (!vm) {
      const spriteSize  = monster.isBoss ? 80 : 64;
      const shadowW     = monster.isBoss ? 64 : 52;
      const shadowH     = monster.isBoss ? 18 : 14;
      const labelColor  = monster.isBoss ? '#ffcc44' : '#ffaaaa';
      const frame  = getMonsterFrame(monster.monsterTypeId);
      const shadowOffsetY = getMonsterShadowOffset(monster.monsterTypeId);
      const shadow = this.add.ellipse(monster.x, monster.y + shadowOffsetY, shadowW, shadowH,
        0x000000, monster.isBoss ? 0.55 : 0.45).setDepth(DEPTH.SHADOW + monster.y);
      const sprite = (this.tryMakeImage(monster.x, monster.y, frame, spriteSize, spriteSize)
        ?? this.add.rectangle(monster.x, monster.y, spriteSize, spriteSize, monster.color)).setDepth(DEPTH.SPRITE + monster.y);
      const label  = this.add.text(0, 0, monster.isBoss ? `⚠ ${monster.name}` : monster.name, {
        color: labelColor, fontSize: monster.isBoss ? '11px' : '10px', fontFamily: 'monospace',
        fontStyle: monster.isBoss ? 'bold' : 'normal',
        stroke: '#000000', strokeThickness: 3,
      }).setDepth(DEPTH.UI + monster.y);
      const hpBar = this.add.graphics().setDepth(DEPTH.UI + monster.y);
      const cdBar = this.add.graphics().setDepth(DEPTH.UI + monster.y);
      vm = { sprite, shadow, shadowOffsetY, label, hpBar, cdBar,
             targetX: monster.targetX, targetY: monster.targetY,
             baseX: monster.x, baseY: monster.y,
             lungeOffsetX: 0, lungeOffsetY: 0,
             hp: monster.hp, maxHp: monster.maxHp,
             speed: monster.speed, barOffsetY: monster.isBoss ? 50 : 40,
             effectOverlays:     new Map<string, Phaser.GameObjects.Sprite>(),
             activeEffects:      monster.activeEffects ?? {},
             activeEffectFrames: monster.activeEffectFrames ?? {},
             attackCooldown:     monster.attackCooldown,
             lastAttackAt:       monster.lastAttackAt,
             attackTargetId:     monster.attackTargetId,
             attackStyle:        monster.attackStyle,
             entityName:         monster.name,
             pullRange:          monster.pullRange,
             leashRange:         monster.leashRange,
             monsterAttackRange: monster.attackRange,
             monsterBehavior:    monster.behavior };
      this.monsters.set(monster.id, vm);
      return;
    }
    const prevMonsterAttackAt = vm.lastAttackAt;
    const prevMonsterHp = vm.hp;
    // Only hard-snap when the server/client positions have diverged significantly
    // (e.g. leash teleport, node transition, or large dead-reckoning error).
    // For small drifts the normal interpolation toward targetX/Y self-corrects silently.
    const snapDx = monster.x - vm.baseX;
    const snapDy = monster.y - vm.baseY;
    if (snapDx * snapDx + snapDy * snapDy > 80 * 80) {
      vm.baseX = monster.x;
      vm.baseY = monster.y;
    }
    vm.targetX        = monster.targetX;
    vm.targetY        = monster.targetY;
    vm.hp             = monster.hp;
    vm.speed          = monster.speed;
    vm.activeEffects  = monster.activeEffects ?? {};
    vm.activeEffectFrames = monster.activeEffectFrames ?? {};
    vm.lastAttackAt   = monster.lastAttackAt;
    vm.attackTargetId = monster.attackTargetId;
    vm.attackStyle    = monster.attackStyle;

    if (monster.hp < prevMonsterHp) {
      const dmg = Math.round(prevMonsterHp - monster.hp);
      this.spawnDamageNumber(vm.sprite.x, vm.sprite.y, vm.barOffsetY, dmg, '#ffffff');
    }

    if (monster.lastAttackAt > prevMonsterAttackAt && monster.attackTargetId) {
      const targetVp = this.players.get(monster.attackTargetId);
      if (targetVp) {
        this.spawnAttackEffect(vm.attackStyle, vm.sprite.x, vm.sprite.y, targetVp.sprite.x, targetVp.sprite.y);

        if (vm.monsterBehavior === 'melee') {
          this.playMeleeLunge(vm, targetVp.baseX, targetVp.baseY);
        }
      }
    }
  }

  /** Swap the background rectangle's fill color to match the current biome. */
  private updateBiomeBackground(): void {
    const biomeInfo = NODE_BIOMES[this.myNodeId];
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
        .setDepth(DEPTH.BG_TILE);
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

    const exits = getNodeExits(this.myNodeId);
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
    for (const v of this.monsters.values()) {
      const dx = mmX + v.sprite.x * scaleX;
      const dy = mmY + v.sprite.y * scaleY;
      this.minimap.fillRect(dx - 1, dy - 1, 2, 2);
    }

    // Other players — blue 2×2 dots
    this.minimap.fillStyle(0x4488ff, 1);
    for (const [id, v] of this.players) {
      if (id === this.myId) continue;
      const dx = mmX + v.sprite.x * scaleX;
      const dy = mmY + v.sprite.y * scaleY;
      this.minimap.fillRect(dx - 1, dy - 1, 2, 2);
    }

    // Own player — bright green 3×3, always on top
    const own = this.players.get(this.myId);
    if (own) {
      this.minimap.fillStyle(0x44ff88, 1);
      const dx = mmX + own.sprite.x * scaleX;
      const dy = mmY + own.sprite.y * scaleY;
      this.minimap.fillRect(dx - 1, dy - 1, 3, 3);
    }

    // Exit direction indicators — small colored bars at minimap edge midpoints.
    // Drawn last so they appear on top of entity dots.
    const exits = getNodeExits(this.myNodeId) ?? {};
    const mcx = mmX + MM_W / 2;
    const mcy = mmY + MM_H / 2;
    this.minimap.fillStyle(GATE_COLOR, 1);
    if (exits.north) this.minimap.fillRect(mcx - 4, mmY,              8, 5);
    if (exits.south) this.minimap.fillRect(mcx - 4, mmY + MM_H - 5,   8, 5);
    if (exits.east)  this.minimap.fillRect(mmX + MM_W - 5, mcy - 4,   5, 8);
    if (exits.west)  this.minimap.fillRect(mmX,             mcy - 4,   5, 8);
  }

  private drawBiomeXpBar(dt: number): void {
    const ownVp = this.players.get(this.myId);
    const g     = this.biomeXpGraphics;
    g.clear();

    if (!ownVp?.playerState || !this.myNodeId) {
      this.biomeXpLabelText.setVisible(false);
      this.biomeXpStatusText.setVisible(false);
      this.biomeXpNumsText.setVisible(false);
      return;
    }
    this.biomeXpLabelText.setVisible(true);
    this.biomeXpStatusText.setVisible(true);
    this.biomeXpNumsText.setVisible(true);

    const p         = ownVp.playerState;
    const biomeInfo = NODE_BIOMES[this.myNodeId];
    if (!biomeInfo) return;

    const { biomeGroup, biomeTier } = biomeInfo;
    const currentLevel   = p.biomeLevel[biomeGroup] ?? 0;
    const currentXp      = p.biomeXP[biomeGroup] ?? 0;
    const tierCap        = biomeLevelCap(p.playerTier, biomeGroup);
    const absoluteMax    = biomeLevelCap(7, biomeGroup);

    const isMaxed  = currentLevel >= absoluteMax;
    const isCapped = !isMaxed && currentLevel >= tierCap;

    let fillFraction: number;
    let numsStr: string;
    if (isMaxed) {
      fillFraction = 1;
      numsStr      = 'MASTERED';
    } else if (isCapped) {
      fillFraction = 1;
      numsStr      = 'advance tier to continue';
    } else {
      const xpBase   = biomeXpForLevel(currentLevel);
      const xpTarget = biomeXpForLevel(currentLevel + 1);
      const span     = xpTarget - xpBase;
      fillFraction   = span > 0 ? Math.min((currentXp - xpBase) / span, 1) : 1;
      numsStr        = `${currentXp - xpBase} / ${span}`;
    }

    // ── Smooth fill animation ─────────────────────────────────────────────────
    // Snap on biome change or level-up (fill fraction drops sharply).
    if (biomeGroup !== this.lastBiomeGroup || fillFraction < this.displayedFillFraction - 0.1) {
      this.displayedFillFraction = fillFraction;
    } else {
      const t = 1 - Math.exp(-dt * 3.5);
      this.displayedFillFraction += (fillFraction - this.displayedFillFraction) * t;
      if (this.displayedFillFraction > fillFraction) this.displayedFillFraction = fillFraction;
    }

    // ── Layout ───────────────────────────────────────────────────────────────
    const wx     = this.scale.width - MM_W - MM_PAD;
    const wy     = MM_PAD;
    const trackX = wx + 10;
    const trackY = wy + 26;
    const trackW = MM_W - 20;
    const fillW  = Math.floor(trackW * this.displayedFillFraction);

    // Background
    g.fillStyle(0x08091a, 0.88);
    g.fillRoundedRect(wx, wy, MM_W, XP_WIDGET_H, 4);

    // Border
    g.lineStyle(1, 0x2a3a5a, 1);
    g.strokeRoundedRect(wx, wy, MM_W, XP_WIDGET_H, 4);

    // Bar track (empty background)
    g.fillStyle(0x0d0e22, 1);
    g.fillRect(trackX, trackY, trackW, XP_FILL_H);

    // Fill
    const fillColor = isMaxed   ? 0xf5c842
      : isCapped                ? 0xe89820
      : (BIOME_BAR_COLORS[biomeGroup] ?? 0x4488aa);
    if (fillW > 0) {
      g.fillStyle(fillColor, 1);
      g.fillRect(trackX, trackY, fillW, XP_FILL_H);
      // Subtle top-sheen highlight
      g.fillStyle(0xffffff, 0.15);
      g.fillRect(trackX, trackY, fillW, 4);
    }

    // Track border
    g.lineStyle(1, 0x3a4a6a, 1);
    g.strokeRect(trackX, trackY, trackW, XP_FILL_H);

    // Outer glow ring when at a cap
    if (isCapped || isMaxed) {
      g.lineStyle(2, fillColor, 0.45);
      g.strokeRect(trackX - 1, trackY - 1, trackW + 2, XP_FILL_H + 2);
    }

    // ── Text ─────────────────────────────────────────────────────────────────
    this.biomeXpLabelText
      .setText(`${biomeGroup.toUpperCase()} XP`)
      .setPosition(wx + 10, wy + 8);

    const statusStr   = isMaxed ? 'MAXED' : isCapped ? 'TIER CAP' : `Lv ${currentLevel}`;
    const statusColor = isMaxed ? '#f5c842' : isCapped ? '#e89820' : '#c8d8e8';
    this.biomeXpStatusText
      .setStyle({ color: statusColor })
      .setText(statusStr)
      .setPosition(wx + MM_W - 10, wy + 8);

    this.biomeXpNumsText
      .setText(numsStr)
      .setPosition(wx + MM_W / 2, wy + 45);

    // ── Flash on XP gain ─────────────────────────────────────────────────────
    if (biomeGroup === this.lastBiomeGroup && currentXp > this.lastBiomeXp && this.lastBiomeXp >= 0) {
      if (this.biomeXpFlashTween) this.biomeXpFlashTween.stop();
      this.biomeXpFlash
        .setPosition(trackX, trackY)
        .setSize(Math.max(fillW, 4), XP_FILL_H)
        .setAlpha(0.55);
      this.biomeXpFlashTween = this.tweens.add({
        targets:  this.biomeXpFlash,
        alpha:    0,
        duration: 450,
        ease:     'Power2',
        onComplete: () => { this.biomeXpFlashTween = null; },
      });
    }
    this.lastBiomeGroup = biomeGroup;
    this.lastBiomeXp    = currentXp;
  }

  private showDeathOverlay(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    const bg = this.add
      .rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setScrollFactor(0)
      .setDepth(DEPTH.SCREEN);

    const text = this.add
      .text(w / 2, h / 2, 'YOU DIED', {
        color: '#cc2222',
        fontSize: '52px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.SCREEN + 100)
      .setOrigin(0.5);

    const sub = this.add
      .text(w / 2, h / 2 + 60, 'Respawning at the Clearing…', {
        color: '#886666',
        fontSize: '14px',
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.SCREEN + 100)
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
      .setDepth(DEPTH.SCREEN);

    const label = this.add
      .text(w / 2, h / 2 - 10, 'ASCENSION', {
        color: '#e8c84a',
        fontSize: '46px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.SCREEN + 100)
      .setOrigin(0.5);

    const subText = this.add
      .text(w / 2, h / 2 + 52, sub, {
        color: '#a888dd',
        fontSize: '13px',
        fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.SCREEN + 100)
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
    emitter.setDepth(DEPTH.FX);
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
        const g = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
      const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(3, mainColor, 1);
      ring.strokeCircle(0, 0, 12);
      this.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 320, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    }
  }

  private fxImpact(toX: number, toY: number, execution: boolean): void {
    // Flash
    const flash = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX + 100);
    flash.fillStyle(execution ? 0xffffff : 0xff8844, execution ? 0.9 : 0.8);
    flash.fillCircle(0, 0, execution ? 28 : 16);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 90, onComplete: () => flash.destroy() });

    // Two expanding rings
    for (let i = 0; i < 2; i++) {
      const ringColor = execution ? (i === 0 ? 0xffffff : 0xaabbff) : (i === 0 ? 0xff7744 : 0xffaa22);
      const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX - 100);
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
      const cross = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX + 100);
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
    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
    const orb = this.add.circle(fromX, fromY, 6, 0xaa44ff).setDepth(DEPTH.FX);

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 45, () => {
        const trail = this.add.circle(orb.x, orb.y, 3 - i * 0.5, 0xcc88ff, 0.75).setDepth(DEPTH.FX - 100);
        this.tweens.add({ targets: trail, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 180, onComplete: () => trail.destroy() });
      });
    }

    this.tweens.add({
      targets: orb, x: toX, y: toY, duration: 200, ease: 'Quad.easeIn',
      onComplete: () => {
        orb.destroy();
        const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
    const spokes = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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

    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX - 100);
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
    const flash = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX + 100);
    flash.fillStyle(0xffffff, 0.88);
    flash.fillCircle(0, 0, 14);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 85, onComplete: () => flash.destroy() });

    // Expanding orange ring
    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
    const dark = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
        const burst = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX + 100);
        burst.fillStyle(0x9933ff, 0.88);
        burst.fillCircle(0, 0, 16);
        this.tweens.add({ targets: burst, alpha: 0, scaleX: 2.8, scaleY: 2.8, duration: 190, onComplete: () => burst.destroy() });

        const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
    const g = this.add.graphics().setDepth(DEPTH.FX);
    g.lineStyle(width + 3, color, 0.15);
    g.lineBetween(fromX, fromY, toX, toY);
    g.lineStyle(width, color, 1);
    g.lineBetween(fromX, fromY, toX, toY);
    this.tweens.add({ targets: g, alpha: 0, duration: 90, ease: 'Quad.easeIn', onComplete: () => g.destroy() });

    // Small muzzle flash at origin
    const muzzle = this.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
    muzzle.fillStyle(color, 0.7);
    muzzle.fillCircle(0, 0, empowered ? 7 : 4);
    this.tweens.add({ targets: muzzle, alpha: 0, scaleX: 2, scaleY: 2, duration: 80, onComplete: () => muzzle.destroy() });

    // Impact flash at target
    const flash = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX + 100);
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

    const g = this.add.graphics().setDepth(DEPTH.FX);
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
          const gb = this.add.graphics().setDepth(DEPTH.FX - 100);
          gb.lineStyle(1.5, 0x88ccff, 0.65);
          for (let i = 1; i < bpts.length; i++) gb.lineBetween(bpts[i-1].x, bpts[i-1].y, bpts[i].x, bpts[i].y);
          this.tweens.add({ targets: gb, alpha: 0, duration: 170, onComplete: () => gb.destroy() });
        });
      }
      const flash = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX + 100);
      flash.fillStyle(0xffffff, 0.92);
      flash.fillCircle(0, 0, 28);
      this.tweens.add({ targets: flash, alpha: 0, scaleX: 3, scaleY: 3, duration: 180, onComplete: () => flash.destroy() });
      const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
    const flash = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX + 100);
    flash.fillStyle(0xffffff, empowered ? 0.9 : 0.72);
    flash.fillCircle(0, 0, empowered ? 18 : 11);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 75, onComplete: () => flash.destroy() });

    const ring = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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
    const g = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
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

    const cFlash = this.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX + 100);
    cFlash.fillStyle(0xffffff, empowered ? 0.88 : 0.65);
    cFlash.fillCircle(0, 0, empowered ? 10 : 6);
    this.tweens.add({ targets: cFlash, alpha: 0, scaleX: 2, scaleY: 2, duration: 110, onComplete: () => cFlash.destroy() });

    this.burstFx('ptx-dot', toX, toY, empowered ? 10 : 5, 350, {
      tint: 0xaaddff, speed: { min: 35, max: 120 }, angle: { min: 0, max: 360 },
      scale: { start: 0.55, end: 0 }, alpha: { start: 1, end: 0 },
    });
  }

  // Helper: resolve which DoT path the player is on from their passives + sub-variant.
  private getDotPath(player: PlayerState): 'poison' | 'fire' | 'frost' {
    const p = player.passives;
    if ((p['dot.fan-the-flames'] ?? 0) > 0 || (p['dot.smoldering-ember'] ?? 0) > 0 || (p['dot.conflagration'] ?? 0) > 0) return 'fire';
    if ((p['dot.permafrost'] ?? 0) > 0 || (p['dot.freezing-cold'] ?? 0) > 0 || (p['dot.glacial-fracture'] ?? 0) > 0) return 'frost';
    if ((p['dot.poison-explosion'] ?? 0) > 0 || (p['dot.eternal-doom'] ?? 0) > 0 || (p['dot.invigorating-toxins'] ?? 0) > 0) return 'poison';
    // Fall back to tier-1 sub-variant choice
    if (player.selectedSubVariant === 'balanced') return 'fire';
    if (player.selectedSubVariant === 'heavy')    return 'frost';
    return 'poison';
  }

  private playMeleeLunge(vm: Visual, targetX: number, targetY: number): void {
    if (document.hidden) return;
    const LUNGE_DIST = 26;
    const dx = targetX - vm.baseX;
    const dy = targetY - vm.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    // Kill any lunge tween already in progress so they don't stack
    this.tweens.killTweensOf(vm);

    // Snap forward, then ease back
    vm.lungeOffsetX = (dx / dist) * LUNGE_DIST;
    vm.lungeOffsetY = (dy / dist) * LUNGE_DIST;
    this.tweens.add({
      targets: vm,
      lungeOffsetX: 0,
      lungeOffsetY: 0,
      delay: 60,
      duration: 200,
      ease: 'Quad.easeOut',
    });
  }

  /** Expanding translucent ring used to show AoE splash extent on empowered hits. */
  private fxAoeRing(x: number, y: number, radius: number, color: number): void {
    const ring = this.add.graphics({ x, y }).setDepth(DEPTH.FX - 100);
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
    if (document.hidden) return;
    const def = EFFECT_BY_ID.get(id);
    if (!def) return;

    const size = (def.baseSize ?? 96) * (opts?.scale ?? def.scale ?? 1.5);
    const startFrame = def.startFrame ?? 0;
    const endFrame = def.endFrame ?? EFFECT_FRAME_COUNT - 1;
    const sprite = this.add
      .sprite(x, y + (def.anchorYPx ?? 0), def.key)
      .setDepth(opts?.depth ?? def.depth ?? DEPTH.FX)
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

  private spawnAttackEffect(
    style: string,
    fromX: number, fromY: number,
    toX: number, toY: number,
    flags?: { empowered?: boolean; execution?: boolean; archetype?: CombatArchetype; dotPath?: 'poison' | 'fire' | 'frost' },
  ): void {
    if (document.hidden) return;
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
  private spawnDamageNumber(spriteX: number, spriteY: number, barOffsetY: number, amount: number, color: string): void {
    if (document.hidden) return;
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
      .setDepth(DEPTH.FLOATER)
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

  private spawnKillRewards(
    spriteX: number, spriteY: number, barOffsetY: number,
    biomeXpGained: number, biomeGroup: string,
    essenceGained: number, essenceType: string,
  ): void {
    if (document.hidden) return;
    const startY = spriteY - barOffsetY - 6;

    if (biomeXpGained > 0) {
      const xpColor  = this.biomeGroupColor(biomeGroup);
      const startX   = spriteX - 8 - Math.random() * 8;
      const xpText   = this.add
        .text(startX, startY, `+${biomeXpGained} XP`, {
          color: xpColor, fontSize: '12px', fontFamily: 'monospace',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
        })
        .setDepth(DEPTH.FLOATER).setOrigin(0.5, 1);
      this.tweens.add({
        targets: xpText, y: startY - 36, x: startX - 10,
        alpha: 0, duration: 1800, ease: 'Power2',
        onComplete: () => xpText.destroy(),
      });
    }

    if (essenceGained > 0) {
      const essColor = ESSENCE_COLORS[essenceType as EssenceType] ?? '#ffffff';
      const startX   = spriteX + 8 + Math.random() * 8;
      const essText  = this.add
        .text(startX, startY, `+${essenceGained} ●`, {
          color: essColor, fontSize: '12px', fontFamily: 'monospace',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
        })
        .setDepth(DEPTH.FLOATER).setOrigin(0.5, 1);
      this.tweens.add({
        targets: essText, y: startY - 36, x: startX + 10,
        alpha: 0, duration: 1800, ease: 'Power2',
        onComplete: () => essText.destroy(),
      });
    }
  }

  private biomeGroupColor(biomeGroup: string): string {
    const hex = BIOME_BAR_COLORS[biomeGroup] ?? 0x88aacc;
    return '#' + hex.toString(16).padStart(6, '0');
  }

  /**
   * Draw debug range circles each frame.
   * Player attack range — yellow-green.
   * Monster pull range — orange, leash range — dim blue, attack range — red.
   */
  private drawDebugRanges(): void {
    this.debugGraphics.clear();

    if (this.debugPlayerRange) {
      const own = this.players.get(this.myId);
      if (own?.playerState) {
        const r = own.playerState.attackRange;
        this.debugGraphics.lineStyle(1.5, 0xaaff44, 0.55);
        this.debugGraphics.strokeCircle(own.sprite.x, own.sprite.y, r);
      }
    }

    if (this.debugEnemyRanges) {
      for (const vm of this.monsters.values()) {
        const cx = vm.sprite.x;
        const cy = vm.sprite.y;

        if (vm.pullRange != null) {
          this.debugGraphics.lineStyle(1, 0xff8844, 0.5);
          this.debugGraphics.strokeCircle(cx, cy, vm.pullRange);
        }
        if (vm.leashRange != null) {
          this.debugGraphics.lineStyle(1, 0x4466cc, 0.35);
          this.debugGraphics.strokeCircle(cx, cy, vm.leashRange);
        }
        if (vm.monsterAttackRange != null) {
          this.debugGraphics.lineStyle(1, 0xff4444, 0.6);
          this.debugGraphics.strokeCircle(cx, cy, vm.monsterAttackRange);
        }
      }
    }
  }

  /** Emit a player:move command toward the exit that leads to autoPath[0]. */
  private sendAutoPathMove(fromNodeId: string): void {
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
    this.socket.emit('player:move', { x, y });
    const vp = this.players.get(this.myId);
    if (vp) { vp.targetX = x; vp.targetY = y; }
  }

  private cancelAutoPath(): void {
    this.autoPath = [];
    hudBus.emit({ autoPath: null });
  }

  private destroyVisual(map: Map<string, Visual>, id: string) {
    const v = map.get(id);
    if (!v) return;
    this.tweens.killTweensOf(v);
    v.shadow.destroy();
    v.sprite.destroy();
    v.label.destroy();
    v.hpBar.destroy();
    v.cdBar.destroy();
    for (const overlay of v.effectOverlays.values()) overlay.destroy();
    map.delete(id);
  }
}
