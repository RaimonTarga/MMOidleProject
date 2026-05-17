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
} from '@mmo-idle/shared';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = 'http://localhost:4000';

// ── Minimap layout constants ───────────────────────────────────────────────────
const MM_W   = 160;  // minimap width  (px, screen-space)
const MM_H   = 120;  // minimap height (px, screen-space)
const MM_PAD = 8;    // gap from the screen edges

// ── Client-side node exit registry ────────────────────────────────────────────
// Mirrors server/src/world/nodeRegistry.ts exits.
// Keep in sync when nodes are added or exits change.
const NODE_EXITS: Record<string, Partial<Record<NodeDirection, string>>> = {
  'node-1': { east: 'node-2', south: 'node-3' },
  'node-2': { west: 'node-1' },
  'node-3': { north: 'node-1' },
};

// ── Gate marker dimensions (world-space) ─────────────────────────────────────
// GATE_THICK must equal EXIT_TRIGGER in server/src/systems/transitions.ts so
// the visible gate exactly covers the trigger zone.
const GATE_LEN   = 320;      // length along the edge wall
const GATE_THICK = 20;       // thickness — must match server EXIT_TRIGGER
const GATE_COLOR = 0x00ffdd; // bright cyan

interface Visual {
  sprite: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  cdBar: Phaser.GameObjects.Graphics;
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  /** Movement speed in px/s — used by stepEntities for per-entity interpolation. */
  speed: number;
  /** Distance from sprite.y to the top edge of the HP bar (px). */
  barOffsetY: number;
  attackCooldown: number;
  lastAttackAt: number;
  attackTargetId: string | null;
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
  private autoMode    = false;
  private minimap!: Phaser.GameObjects.Graphics;
  /** World-space colored bars drawn at each active exit boundary. */
  private exitMarkers!: Phaser.GameObjects.Graphics;
  /** Bottom-left HUD text showing server position and transition debug info. */
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ── World / camera setup ───────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.NODE_WIDTH, GAME_CONFIG.NODE_HEIGHT);

    // ── Grid background (world-space, rendered before everything else) ─────
    this.createGridBackground();

    this.targetMarker = this.add
      .circle(0, 0, 5, 0xffff44, 0.8)
      .setVisible(false);

    // ── Exit gate markers (world-space; no scrollFactor — visible only near edges) ──
    // Drawn once per node change, not every frame.
    this.exitMarkers = this.add.graphics().setDepth(5);

    // ── Minimap ────────────────────────────────────────────────────────────────
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(20);

    // ── Debug overlay (bottom-left, screen-space) ──────────────────────────
    this.debugText = this.add
      .text(8, this.scale.height - 8, '', {
        color: '#ffff44',
        fontSize: '10px',
        fontFamily: 'monospace',
        backgroundColor: '#000000bb',
        padding: { x: 4, y: 3 },
      })
      .setScrollFactor(0)
      .setDepth(30)
      .setOrigin(0, 1);

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

    // ── Click to move ──────────────────────────────────────────────────────
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.myId) return;

      const tx = Math.round(pointer.worldX);
      const ty = Math.round(pointer.worldY);

      if (this.autoMode) this.setAutoMode(false);

      this.socket.emit('player:move', { x: tx, y: ty });

      const vp = this.players.get(this.myId);
      if (vp) {
        vp.targetX = tx;
        vp.targetY = ty;
      }

      this.targetMarker.setPosition(tx, ty).setVisible(true);
    });

    // ── Socket.IO ──────────────────────────────────────────────────────────
    this.socket = io(SERVER_URL) as GameSocket;

    this.socket.on('connect', () => {
      this.myId = this.socket.id ?? '';
      hudBus.emit({ status: 'connected' });
      const own = this.players.get(this.myId);
      if (own) this.cameras.main.startFollow(own.sprite, true, 0.1, 0.1);
    });

    this.socket.on('disconnect', () => {
      hudBus.emit({ status: 'disconnected', player: null });
      this.myId = '';
    });

    this.socket.on('state:sync', (snapshot) => this.applySnapshot(snapshot));
    this.socket.on('node:state',  (snapshot) => this.applySnapshot(snapshot));
    this.socket.on('player:joined', (player)  => this.upsertPlayer(player));
    this.socket.on('player:left',   (playerId) => this.destroyVisual(this.players, playerId));

    this.socket.on('crafting:result', (result) => {
      window.dispatchEvent(new CustomEvent('hud:craftResult', { detail: result }));
    });
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.stepEntities(this.players,  dt);
    this.stepEntities(this.monsters, dt);
    this.drawMinimap();

    // Redraw exit gate markers only when the player's node changes.
    // This avoids per-frame redraws of static world geometry.
    if (this.myNodeId !== this.lastDrawnNodeId) {
      this.drawExitMarkers();
      this.lastDrawnNodeId = this.myNodeId;
    }

    const own = this.players.get(this.myId);
    if (own && this.targetMarker.visible) {
      const dx = own.sprite.x - this.targetMarker.x;
      const dy = own.sprite.y - this.targetMarker.y;
      if (dx * dx + dy * dy < 16) this.targetMarker.setVisible(false);
    }

    // Debug overlay — shows server-authoritative state and distance to each trigger zone.
    const ownState = (own as (Visual & { _state?: PlayerState }) | undefined)?._state;
    if (ownState) {
      const exits = NODE_EXITS[ownState.nodeId] ?? {};
      const W = GAME_CONFIG.NODE_WIDTH;
      const H = GAME_CONFIG.NODE_HEIGHT;
      const T = GATE_THICK; // trigger zone thickness (matches server EXIT_TRIGGER)
      const lines: string[] = [
        `node: ${ownState.nodeId}`,
        `srv  x=${Math.round(ownState.x)}  y=${Math.round(ownState.y)}`,
        `tgt  x=${Math.round(ownState.targetX)}  y=${Math.round(ownState.targetY)}`,
      ];
      if (exits.east)  lines.push(`east  fires@x>=${W - T}  dist=${Math.round(W - T - ownState.x)}`);
      if (exits.west)  lines.push(`west  fires@x<=${T}  dist=${Math.round(ownState.x - T)}`);
      if (exits.south) lines.push(`south fires@y>=${H - T}  dist=${Math.round(H - T - ownState.y)}`);
      if (exits.north) lines.push(`north fires@y<=${T}  dist=${Math.round(ownState.y - T)}`);
      this.debugText.setText(lines.join('\n'));
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private createGridBackground(): void {
    const cell = 64;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x1a1a2e);
    g.fillRect(0, 0, cell, cell);
    g.lineStyle(1, 0x252548, 1);
    g.strokeRect(0.5, 0.5, cell - 1, cell - 1);
    g.generateTexture('grid-cell', cell, cell);
    g.destroy();

    this.add
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
    this.socket.emit('player:setAuto', enabled);
    if (enabled) this.targetMarker.setVisible(false);

    const own = this.players.get(this.myId) as (Visual & { _state?: PlayerState }) | undefined;
    if (own?._state) {
      hudBus.emit({ player: { ...own._state, auto: enabled } });
    }
  }

  private applySnapshot(snapshot: NodeSnapshot) {
    snapshot.players.forEach((p) => this.upsertPlayer(p));

    const live = new Set(snapshot.monsters.map((m) => m.id));
    for (const id of this.monsters.keys()) {
      if (!live.has(id)) this.destroyVisual(this.monsters, id);
    }
    snapshot.monsters.forEach((m) => this.upsertMonster(m));
  }

  /** Interpolate sprites toward their targets and redraw HP + cooldown bars every frame. */
  private stepEntities(map: Map<string, Visual>, dt: number) {
    const now = Date.now();

    for (const v of map.values()) {
      const { sprite, label, hpBar, cdBar } = v;

      const dx = v.targetX - sprite.x;
      const dy = v.targetY - sprite.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > 1) {
        const dist = Math.sqrt(distSq);
        const step = Math.min(v.speed * dt, dist);
        sprite.setPosition(sprite.x + (dx / dist) * step, sprite.y + (dy / dist) * step);
      } else {
        sprite.setPosition(v.targetX, v.targetY);
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
      }

      label.setPosition(sprite.x - 16, barY - 12);
    }
  }

  private upsertPlayer(player: PlayerState) {
    const isOwn = player.id === this.myId;
    let vp = this.players.get(player.id);

    if (!vp) {
      const color  = isOwn ? 0x44ff88 : 0x4488ff;
      const sprite = this.add.rectangle(player.x, player.y, 32, 48, color);
      const label  = this.add.text(0, 0, player.name, {
        color: '#ffffff', fontSize: '10px', fontFamily: 'monospace',
      });
      const hpBar = this.add.graphics();
      const cdBar = this.add.graphics();
      vp = Object.assign(
        { sprite, label, hpBar, cdBar,
          targetX: player.targetX, targetY: player.targetY,
          hp: player.hp, maxHp: player.maxHp,
          speed: GAME_CONFIG.PLAYER_SPEED, barOffsetY: 34,
          attackCooldown: player.attackCooldown,
          lastAttackAt:   player.lastAttackAt,
          attackTargetId: player.attackTargetId },
        { _state: player },
      );
      this.players.set(player.id, vp);

      if (isOwn) {
        this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
        this.myNodeId = player.nodeId;
        hudBus.emit({ player });
      }
      return;
    }

    // Detect node transition for own player — snap sprite to the new position
    // instead of letting the interpolator slide it across the full map width.
    if (isOwn && player.nodeId !== this.myNodeId) {
      vp.sprite.setPosition(player.x, player.y);
    }

    vp.targetX        = player.targetX;
    vp.targetY        = player.targetY;
    vp.hp             = player.hp;
    vp.lastAttackAt   = player.lastAttackAt;
    vp.attackTargetId = player.attackTargetId;
    (vp as Visual & { _state: PlayerState })._state = player;

    if (isOwn) {
      this.myNodeId = player.nodeId;
      this.autoMode = player.auto;
      hudBus.emit({ player });
    }
  }

  private upsertMonster(monster: MonsterState) {
    let vm = this.monsters.get(monster.id);
    if (!vm) {
      const sprite = this.add.rectangle(monster.x, monster.y, 32, 32, 0xff4444);
      const label  = this.add.text(0, 0, monster.name, {
        color: '#ffaaaa', fontSize: '10px', fontFamily: 'monospace',
      });
      const hpBar = this.add.graphics();
      const cdBar = this.add.graphics();
      vm = { sprite, label, hpBar, cdBar,
             targetX: monster.targetX, targetY: monster.targetY,
             hp: monster.hp, maxHp: monster.maxHp,
             speed: monster.speed, barOffsetY: 26,
             attackCooldown: monster.attackCooldown,
             lastAttackAt:   monster.lastAttackAt,
             attackTargetId: monster.attackTargetId };
      this.monsters.set(monster.id, vm);
      return;
    }
    vm.targetX        = monster.targetX;
    vm.targetY        = monster.targetY;
    vm.hp             = monster.hp;
    vm.speed          = monster.speed;
    vm.lastAttackAt   = monster.lastAttackAt;
    vm.attackTargetId = monster.attackTargetId;
  }

  /**
   * Draw colored bars at each active exit boundary in world-space.
   * Called once per node change, not every frame.
   * The camera must scroll to the boundary for these to be visible.
   */
  private drawExitMarkers(): void {
    this.exitMarkers.clear();

    const exits = NODE_EXITS[this.myNodeId];
    if (!exits) return;

    const W = GAME_CONFIG.NODE_WIDTH;
    const H = GAME_CONFIG.NODE_HEIGHT;

    // Outer glow — wider, translucent halo around the gate
    this.exitMarkers.fillStyle(GATE_COLOR, 0.22);
    if (exits.north) this.exitMarkers.fillRect(W/2 - GATE_LEN/2 - 8, -6, GATE_LEN + 16, GATE_THICK + 10);
    if (exits.south) this.exitMarkers.fillRect(W/2 - GATE_LEN/2 - 8, H - GATE_THICK - 4, GATE_LEN + 16, GATE_THICK + 10);
    if (exits.west)  this.exitMarkers.fillRect(-6, H/2 - GATE_LEN/2 - 8, GATE_THICK + 10, GATE_LEN + 16);
    if (exits.east)  this.exitMarkers.fillRect(W - GATE_THICK - 4, H/2 - GATE_LEN/2 - 8, GATE_THICK + 10, GATE_LEN + 16);

    // Inner solid bar — right at the world boundary
    this.exitMarkers.fillStyle(GATE_COLOR, 0.88);
    if (exits.north) this.exitMarkers.fillRect(W/2 - GATE_LEN/2, 0,               GATE_LEN, GATE_THICK);
    if (exits.south) this.exitMarkers.fillRect(W/2 - GATE_LEN/2, H - GATE_THICK,  GATE_LEN, GATE_THICK);
    if (exits.west)  this.exitMarkers.fillRect(0,               H/2 - GATE_LEN/2, GATE_THICK, GATE_LEN);
    if (exits.east)  this.exitMarkers.fillRect(W - GATE_THICK,  H/2 - GATE_LEN/2, GATE_THICK, GATE_LEN);
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
    const exits = NODE_EXITS[this.myNodeId] ?? {};
    const mcx = mmX + MM_W / 2;
    const mcy = mmY + MM_H / 2;
    this.minimap.fillStyle(GATE_COLOR, 1);
    if (exits.north) this.minimap.fillRect(mcx - 4, mmY,              8, 5);
    if (exits.south) this.minimap.fillRect(mcx - 4, mmY + MM_H - 5,   8, 5);
    if (exits.east)  this.minimap.fillRect(mmX + MM_W - 5, mcy - 4,   5, 8);
    if (exits.west)  this.minimap.fillRect(mmX,             mcy - 4,   5, 8);
  }

  private destroyVisual(map: Map<string, Visual>, id: string) {
    const v = map.get(id);
    if (!v) return;
    v.sprite.destroy();
    v.label.destroy();
    v.hpBar.destroy();
    v.cdBar.destroy();
    map.delete(id);
  }
}
