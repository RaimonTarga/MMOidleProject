import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerState,
  MonsterState,
  NodeSnapshot,
} from '@mmo-idle/shared';
import { GAME_CONFIG } from '@mmo-idle/shared';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = 'http://localhost:4000';

// ── Minimap layout constants ───────────────────────────────────────────────────
const MM_W   = 160;  // minimap width  (px, screen-space)
const MM_H   = 120;  // minimap height (px, screen-space) — matches NODE_WIDTH:NODE_HEIGHT ratio
const MM_PAD = 8;    // gap from the screen edges

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
  private statusText!: Phaser.GameObjects.Text;
  /** Yellow dot shown at the last click destination (world-space). */
  private targetMarker!: Phaser.GameObjects.Arc;
  private autoMode    = false;
  private autoBtnBg!: Phaser.GameObjects.Rectangle;
  private autoBtnText!: Phaser.GameObjects.Text;
  private minimap!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ── World / camera setup ───────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.NODE_WIDTH, GAME_CONFIG.NODE_HEIGHT);

    // ── Grid background (world-space, rendered before everything else) ─────
    this.createGridBackground();

    // ── HUD — all elements get scrollFactor(0) so they stay fixed on screen ──
    this.statusText = this.add
      .text(12, 12, 'Connecting to server…', {
        color: '#aaaaaa', fontSize: '14px', fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.add
      .text(12, this.scale.height - 24, 'MMO Idle — click to move', {
        color: '#444466', fontSize: '12px', fontFamily: 'monospace',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.targetMarker = this.add
      .circle(0, 0, 5, 0xffff44, 0.8)
      .setVisible(false);  // world-space — no scrollFactor override

    // ── Auto toggle button ─────────────────────────────────────────────────
    const btnCx = this.scale.width - 58;
    const btnCy = 18;
    this.autoBtnBg = this.add
      .rectangle(btnCx, btnCy, 96, 26, 0x333355)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(10);
    this.autoBtnText = this.add
      .text(btnCx, btnCy, 'AUTO: OFF', {
        color: '#666688', fontSize: '12px', fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    this.autoBtnBg.on('pointerover', () =>
      this.autoBtnBg.setFillStyle(this.autoMode ? 0x336644 : 0x444466));
    this.autoBtnBg.on('pointerout', () =>
      this.autoBtnBg.setFillStyle(this.autoMode ? 0x224433 : 0x333355));
    this.autoBtnBg.on('pointerdown', () => this.setAutoMode(!this.autoMode));

    // ── Minimap ────────────────────────────────────────────────────────────────
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(20);

    // ── Click to move ──────────────────────────────────────────────────────
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.myId) return;
      // Ignore clicks that land on the HUD button (screen-space check).
      if (this.autoBtnBg.getBounds().contains(pointer.x, pointer.y)) return;

      // pointer.worldX/Y converts screen coords to world coords via camera.
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
      this.statusText.setText(`Connected  (id: ${this.myId.slice(0, 8)}…)`);
      this.statusText.setColor('#44ff88');
      // Handle reconnect: own sprite may already exist.
      const own = this.players.get(this.myId);
      if (own) this.cameras.main.startFollow(own.sprite, true, 0.1, 0.1);
    });

    this.socket.on('disconnect', () => {
      this.statusText.setText('Disconnected — retrying…');
      this.statusText.setColor('#ff4444');
      this.myId = '';
    });

    this.socket.on('state:sync', (snapshot) => this.applySnapshot(snapshot));
    this.socket.on('node:state',  (snapshot) => this.applySnapshot(snapshot));
    this.socket.on('player:joined', (player)  => this.upsertPlayer(player));
    this.socket.on('player:left',   (playerId) => this.destroyVisual(this.players, playerId));
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.stepEntities(this.players,  dt);
    this.stepEntities(this.monsters, dt);
    this.drawMinimap();

    const own = this.players.get(this.myId);
    if (own && this.targetMarker.visible) {
      const dx = own.sprite.x - this.targetMarker.x;
      const dy = own.sprite.y - this.targetMarker.y;
      if (dx * dx + dy * dy < 16) this.targetMarker.setVisible(false);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Generate a 64×64 grid-cell texture and tile it across the entire node.
   * Two-tone: a dark fill with a slightly lighter border gives a subtle grid
   * without overwhelming the game objects on top of it.
   */
  private createGridBackground(): void {
    const cell = 64;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
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
    if (enabled) {
      this.autoBtnText.setText('AUTO: ON').setColor('#44ff88');
      this.autoBtnBg.setFillStyle(0x224433);
      this.targetMarker.setVisible(false);
    } else {
      this.autoBtnText.setText('AUTO: OFF').setColor('#666688');
      this.autoBtnBg.setFillStyle(0x333355);
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
      const barY     = sprite.y - v.barOffsetY;
      const hpPct    = v.maxHp > 0 ? Math.max(0, v.hp / v.maxHp) : 0;
      const hpColor  = hpPct > 0.5 ? 0x44ee44 : hpPct > 0.25 ? 0xeeaa22 : 0xee3322;
      hpBar.clear();
      hpBar.fillStyle(0x1a1a1a);
      hpBar.fillRect(sprite.x - 16, barY, 32, 4);
      hpBar.fillStyle(hpColor);
      hpBar.fillRect(sprite.x - 16, barY, Math.round(32 * hpPct), 4);

      // Cooldown bar — only visible while attacking; fills 0 → 1 as next attack charges
      cdBar.clear();
      if (v.attackTargetId !== null) {
        const cdPct    = Math.min(1, (now - v.lastAttackAt) / Math.max(1, v.attackCooldown));
        const cdColor  = cdPct >= 1 ? 0xffdd22 : 0x4466cc;
        const cdBarY   = barY + 6;
        cdBar.fillStyle(0x1a1a1a);
        cdBar.fillRect(sprite.x - 16, cdBarY, 32, 3);
        cdBar.fillStyle(cdColor);
        cdBar.fillRect(sprite.x - 16, cdBarY, Math.round(32 * cdPct), 3);
      }

      label.setPosition(sprite.x - 16, barY - 12);
    }
  }

  private upsertPlayer(player: PlayerState) {
    let vp = this.players.get(player.id);
    if (!vp) {
      const color  = player.id === this.myId ? 0x44ff88 : 0x4488ff;
      const sprite = this.add.rectangle(player.x, player.y, 32, 48, color);
      const label  = this.add.text(0, 0, player.name, {
        color: '#ffffff', fontSize: '10px', fontFamily: 'monospace',
      });
      const hpBar = this.add.graphics();
      const cdBar = this.add.graphics();
      vp = { sprite, label, hpBar, cdBar,
             targetX: player.targetX, targetY: player.targetY,
             hp: player.hp, maxHp: player.maxHp,
             speed: GAME_CONFIG.PLAYER_SPEED, barOffsetY: 34,
             attackCooldown: player.attackCooldown,
             lastAttackAt:   player.lastAttackAt,
             attackTargetId: player.attackTargetId };
      this.players.set(player.id, vp);

      if (player.id === this.myId) {
        this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
      }
      return;
    }
    vp.targetX        = player.targetX;
    vp.targetY        = player.targetY;
    vp.hp             = player.hp;
    vp.lastAttackAt   = player.lastAttackAt;
    vp.attackTargetId = player.attackTargetId;
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
    // Adding more player types here in the future just means a new loop /
    // color — the layer order (others below self) should stay the same.
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
