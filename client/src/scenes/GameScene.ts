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
import { GAME_CONFIG, NODE_BIOMES, BIOME_DATABASE } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = 'http://localhost:4000';

// ── Minimap layout constants ───────────────────────────────────────────────────
const MM_W   = 160;  // minimap width  (px, screen-space)
const MM_H   = 120;  // minimap height (px, screen-space)
const MM_PAD = 8;    // gap from the screen edges

// ── Node exit computation ──────────────────────────────────────────────────────
// Node IDs follow the format "node-{row}-{col}" in a 5×5 grid.
// Exits are derived from coordinates so no registry duplication is needed.
function getNodeExits(nodeId: string): Partial<Record<NodeDirection, string>> {
  const parts = nodeId.split('-');
  if (parts.length !== 3) return {};
  const r = parseInt(parts[1], 10);
  const c = parseInt(parts[2], 10);
  if (isNaN(r) || isNaN(c)) return {};
  const exits: Partial<Record<NodeDirection, string>> = {};
  if (r > 0) exits.north = `node-${r - 1}-${c}`;
  if (r < 4) exits.south = `node-${r + 1}-${c}`;
  if (c > 0) exits.west  = `node-${r}-${c - 1}`;
  if (c < 4) exits.east  = `node-${r}-${c + 1}`;
  return exits;
}

// ── Gate marker dimensions (world-space) ─────────────────────────────────────
// GATE_THICK must equal EXIT_TRIGGER in server/src/systems/transitions.ts so
// the visible gate exactly covers the trigger zone.
// GATE_LEN must equal GAME_CONFIG.GATE_HALF * 2 so drawn gates match the server trigger zone.
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
  attackStyle: string;
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
  /** Full-world rectangle tinted with the current biome background color. */
  private bgRect!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
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

    // ── Minimap ────────────────────────────────────────────────────────────────
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(20);

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

    this.socket.on('player:died', () => {
      this.showDeathOverlay();
    });
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.stepEntities(this.players,  dt);
    this.stepEntities(this.monsters, dt);
    this.drawMinimap();

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
          speed: player.speed, barOffsetY: 34,
          attackCooldown: player.attackCooldown,
          lastAttackAt:   player.lastAttackAt,
          attackTargetId: player.attackTargetId,
          attackStyle:    player.attackStyle },
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

    const prevPlayerAttackAt = vp.lastAttackAt;
    const prevPlayerHp = vp.hp;
    vp.targetX        = player.targetX;
    vp.targetY        = player.targetY;
    vp.hp             = player.hp;
    vp.maxHp          = player.maxHp;
    vp.speed          = player.speed;
    vp.lastAttackAt   = player.lastAttackAt;
    vp.attackTargetId = player.attackTargetId;
    vp.attackStyle    = player.attackStyle;
    (vp as Visual & { _state: PlayerState })._state = player;

    if (player.hp < prevPlayerHp) {
      const dmgColor = isOwn ? '#ff4444' : '#ff8844';
      this.spawnDamageNumber(vp.sprite.x, vp.sprite.y, vp.barOffsetY, Math.round(prevPlayerHp - player.hp), dmgColor);
    }

    if (player.lastAttackAt > prevPlayerAttackAt && player.attackTargetId) {
      const targetVm = this.monsters.get(player.attackTargetId);
      if (targetVm) {
        this.spawnAttackEffect(vp.attackStyle, vp.sprite.x, vp.sprite.y, targetVm.sprite.x, targetVm.sprite.y);
      }
    }

    if (isOwn) {
      this.myNodeId = player.nodeId;
      this.autoMode = player.auto;
      hudBus.emit({ player });
    }
  }

  private upsertMonster(monster: MonsterState) {
    let vm = this.monsters.get(monster.id);
    if (!vm) {
      const sprite = this.add.rectangle(monster.x, monster.y, 32, 32, monster.color);
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
             attackTargetId: monster.attackTargetId,
             attackStyle:    monster.attackStyle };
      this.monsters.set(monster.id, vm);
      return;
    }
    const prevMonsterAttackAt = vm.lastAttackAt;
    const prevMonsterHp = vm.hp;
    vm.targetX        = monster.targetX;
    vm.targetY        = monster.targetY;
    vm.hp             = monster.hp;
    vm.speed          = monster.speed;
    vm.lastAttackAt   = monster.lastAttackAt;
    vm.attackTargetId = monster.attackTargetId;
    vm.attackStyle    = monster.attackStyle;

    if (monster.hp < prevMonsterHp) {
      this.spawnDamageNumber(vm.sprite.x, vm.sprite.y, vm.barOffsetY, Math.round(prevMonsterHp - monster.hp), '#ffffff');
    }

    if (monster.lastAttackAt > prevMonsterAttackAt && monster.attackTargetId) {
      const targetVp = this.players.get(monster.attackTargetId);
      if (targetVp) {
        this.spawnAttackEffect(vm.attackStyle, vm.sprite.x, vm.sprite.y, targetVp.sprite.x, targetVp.sprite.y);
      }
    }
  }

  /** Swap the background rectangle's fill color to match the current biome. */
  private updateBiomeBackground(): void {
    const biomeInfo = NODE_BIOMES[this.myNodeId];
    if (!biomeInfo) return;
    const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
    if (!biome) return;
    this.bgRect.setFillStyle(biome.backgroundColor);
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

  /**
   * Spawn a one-shot attack animation between two world-space points.
   * style controls the look; add new cases here to support more attack types.
   */
  private spawnAttackEffect(style: string, fromX: number, fromY: number, toX: number, toY: number): void {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    switch (style) {
      case 'slash': {
        // Two short crossing lines near the attacker, perpendicular to attack direction
        const cx = fromX + Math.cos(angle) * 22;
        const cy = fromY + Math.sin(angle) * 22;
        const g = this.add.graphics({ x: cx, y: cy }).setDepth(10);
        const len = 20;
        const perp = angle + Math.PI / 2;
        g.lineStyle(2, 0xffffaa, 1);
        g.lineBetween(
          -Math.cos(perp) * len, -Math.sin(perp) * len,
           Math.cos(perp) * len,  Math.sin(perp) * len,
        );
        g.lineStyle(1.5, 0xffffff, 0.6);
        const diag = angle + Math.PI / 3;
        g.lineBetween(
          -Math.cos(diag) * len * 0.65, -Math.sin(diag) * len * 0.65,
           Math.cos(diag) * len * 0.65,  Math.sin(diag) * len * 0.65,
        );
        this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
        break;
      }
      case 'poison': {
        // Expanding green ring at target + small dot
        const g = this.add.graphics({ x: toX, y: toY }).setDepth(10);
        g.lineStyle(2, 0x44ff88, 1);
        g.strokeCircle(0, 0, 5);
        this.tweens.add({ targets: g, alpha: 0, scaleX: 3, scaleY: 3, duration: 300, ease: 'Power2', onComplete: () => g.destroy() });
        const dot = this.add.circle(toX, toY, 3, 0x44ff88, 0.8).setDepth(10);
        this.tweens.add({ targets: dot, alpha: 0, duration: 200, onComplete: () => dot.destroy() });
        break;
      }
      case 'magic': {
        // Purple orb travels from attacker to target, then a ring pops at impact
        const orb = this.add.circle(fromX, fromY, 4, 0xaa44ff).setDepth(10);
        this.tweens.add({
          targets: orb, x: toX, y: toY, alpha: 0,
          duration: 200, ease: 'Quad.easeIn',
          onComplete: () => {
            orb.destroy();
            const ring = this.add.graphics({ x: toX, y: toY }).setDepth(10);
            ring.lineStyle(2, 0xcc88ff, 1);
            ring.strokeCircle(0, 0, 4);
            this.tweens.add({ targets: ring, alpha: 0, scaleX: 2, scaleY: 2, duration: 200, onComplete: () => ring.destroy() });
          },
        });
        break;
      }
      case 'impact':
      default: {
        // Expanding orange ring at target position
        const g = this.add.graphics({ x: toX, y: toY }).setDepth(10);
        g.lineStyle(2, 0xff7744, 1);
        g.strokeCircle(0, 0, 6);
        this.tweens.add({ targets: g, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 250, ease: 'Power2', onComplete: () => g.destroy() });
        break;
      }
    }
  }

  /**
   * Spawn a damage number that floats upward and fades out over ~900ms.
   * barOffsetY is the same value used to position the HP bar above the sprite,
   * so the number starts just above the bar.
   */
  private spawnDamageNumber(spriteX: number, spriteY: number, barOffsetY: number, amount: number, color: string): void {
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
