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
import { combatLog } from '../combatLog';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = 'http://localhost:4000';

// ── Minimap layout constants ───────────────────────────────────────────────────
const MM_W   = 160;  // minimap width  (px, screen-space)
const MM_H   = 120;  // minimap height (px, screen-space)
const MM_PAD = 8;    // gap from the screen edges

// ── Node exit computation ──────────────────────────────────────────────────────
// Node IDs follow the format "node-{row}-{col}" in a 9×9 grid.
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
  /** Raw name used for combat-log attribution (monsters only). */
  entityName?: string;
  /** Full authoritative state snapshot — only present on player visuals, not monsters. */
  playerState?: PlayerState;
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
  /** Own player's attackTargetId from the previous snapshot — used to attribute kills/damage. */
  private prevMyTargetId: string | null = null;
  private minimap!: Phaser.GameObjects.Graphics;
  /** World-space colored bars drawn at each active exit boundary. */
  private exitMarkers!: Phaser.GameObjects.Graphics;
  /** Full-world rectangle tinted with the current biome background color. */
  private bgRect!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.initParticleTextures();

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

    this.socket.on('crafting:result', (result) => {
      window.dispatchEvent(new CustomEvent('hud:craftResult', { detail: result }));
    });

    this.socket.on('player:died', () => {
      combatLog.push('death', 'You were defeated');
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

    const own = this.players.get(this.myId);
    if (own?.playerState) {
      hudBus.emit({ player: { ...own.playerState, auto: enabled } });
    }
  }

  private applySnapshot(snapshot: NodeSnapshot) {
    // Capture own player's current target BEFORE this snapshot updates it.
    // Used for kill attribution and damage-out detection in this same pass.
    const ownVpBefore = this.players.get(this.myId);
    this.prevMyTargetId = ownVpBefore?.attackTargetId ?? null;

    const livePlayers = new Set(snapshot.players.map((p) => p.id));
    for (const id of this.players.keys()) {
      if (id !== this.myId && !livePlayers.has(id)) this.destroyVisual(this.players, id);
    }
    snapshot.players.forEach((p) => this.upsertPlayer(p));

    const liveMonsters = new Set(snapshot.monsters.map((m) => m.id));
    for (const id of this.monsters.keys()) {
      if (!liveMonsters.has(id)) {
        if (id === this.prevMyTargetId) {
          const vm = this.monsters.get(id);
          if (vm) combatLog.push('kill', `${vm.entityName ?? id} defeated`);
        }
        this.destroyVisual(this.monsters, id);
      }
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
      vp = {
        sprite, label, hpBar, cdBar,
        targetX: player.targetX, targetY: player.targetY,
        hp: player.hp, maxHp: player.maxHp,
        speed: player.speed, barOffsetY: 34,
        attackCooldown: player.attackCooldown,
        lastAttackAt:   player.lastAttackAt,
        attackTargetId: player.attackTargetId,
        attackStyle:    player.attackStyle,
        playerState:    player,
      };
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
    vp.attackCooldown = player.attackCooldown;
    vp.lastAttackAt   = player.lastAttackAt;
    vp.attackTargetId = player.attackTargetId;
    vp.attackStyle    = player.attackStyle;
    const prevEmpoweredReady = vp.playerState?.empoweredReady ?? false;
    const prevExecutionReady = vp.playerState?.executionReady ?? false;
    vp.playerState    = player;

    if (player.hp < prevPlayerHp) {
      const dmgColor = isOwn ? '#ff4444' : '#ff8844';
      this.spawnDamageNumber(vp.sprite.x, vp.sprite.y, vp.barOffsetY, Math.round(prevPlayerHp - player.hp), dmgColor);
      if (isOwn) combatLog.push('damage-in', `Took ${Math.round(prevPlayerHp - player.hp)} damage`);
    }

    // Only log heals above the regen threshold to avoid log spam from passive HP regen.
    if (isOwn && player.hp > prevPlayerHp && prevPlayerHp > 0 && Math.round(player.hp - prevPlayerHp) >= 5) {
      combatLog.push('heal', `Recovered ${Math.round(player.hp - prevPlayerHp)} HP`);
    }

    if (player.lastAttackAt > prevPlayerAttackAt && player.attackTargetId) {
      const targetVm = this.monsters.get(player.attackTargetId);
      if (targetVm) {
        const empowered = prevEmpoweredReady && !player.empoweredReady;
        const execution = prevExecutionReady && !player.executionReady;
        this.spawnAttackEffect(vp.attackStyle, vp.sprite.x, vp.sprite.y, targetVm.sprite.x, targetVm.sprite.y, { empowered, execution });
        if (isOwn && empowered) combatLog.push('empowered', `Empowered strike → ${targetVm.entityName ?? 'target'}`);
        if (isOwn && execution) combatLog.push('execution', `Execution strike → ${targetVm.entityName ?? 'target'}`);
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
      const spriteSize = monster.isBoss ? 54 : 32;
      const labelColor = monster.isBoss ? '#ffcc44' : '#ffaaaa';
      const sprite = this.add.rectangle(monster.x, monster.y, spriteSize, spriteSize, monster.color);
      const label  = this.add.text(0, 0, monster.isBoss ? `⚠ ${monster.name}` : monster.name, {
        color: labelColor, fontSize: monster.isBoss ? '11px' : '10px', fontFamily: 'monospace',
        fontStyle: monster.isBoss ? 'bold' : 'normal',
      });
      const hpBar = this.add.graphics();
      const cdBar = this.add.graphics();
      vm = { sprite, label, hpBar, cdBar,
             targetX: monster.targetX, targetY: monster.targetY,
             hp: monster.hp, maxHp: monster.maxHp,
             speed: monster.speed, barOffsetY: monster.isBoss ? 38 : 26,
             attackCooldown: monster.attackCooldown,
             lastAttackAt:   monster.lastAttackAt,
             attackTargetId: monster.attackTargetId,
             attackStyle:    monster.attackStyle,
             entityName:     monster.name };
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
      const dmg = Math.round(prevMonsterHp - monster.hp);
      this.spawnDamageNumber(vm.sprite.x, vm.sprite.y, vm.barOffsetY, dmg, '#ffffff');
      if (this.myId && this.prevMyTargetId === monster.id) {
        combatLog.push('damage-out', `${vm.entityName ?? monster.name} −${dmg}`);
      }
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

  private fxSlash(fromX: number, fromY: number, toX: number, toY: number, empowered: boolean): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const perp  = angle + Math.PI / 2;
    const color = empowered ? 0xffdd22 : 0xffffff;
    const lineW = empowered ? 3.5 : 2.5;
    const len   = empowered ? 62 : 48;

    // Three sweep lines with slight angular spread, centered at the impact point
    for (let i = 0; i < 3; i++) {
      const a = perp + (i - 1) * 0.3;
      this.time.delayedCall(i * 35, () => {
        const g = this.add.graphics({ x: toX, y: toY }).setDepth(12);
        g.lineStyle(lineW, color, 1);
        g.lineBetween(-Math.cos(a) * len, -Math.sin(a) * len, Math.cos(a) * len, Math.sin(a) * len);
        // Offset shadow line for depth
        g.lineStyle(lineW * 0.5, 0xffffcc, 0.6);
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
      tint:   empowered ? 0xffdd22 : 0xffffff,
      speed:  { min: 60,  max: 220 },
      angle:  { min: 0,   max: 360 },
      scale:  { start: 0.9, end: 0.1 },
      alpha:  { start: 1,   end: 0   },
      rotate: { min: 0, max: 360 },
    });

    if (empowered) {
      const ring = this.add.graphics({ x: toX, y: toY }).setDepth(12);
      ring.lineStyle(3, 0xffdd22, 1);
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

  private spawnAttackEffect(
    style: string,
    fromX: number, fromY: number,
    toX: number, toY: number,
    flags?: { empowered?: boolean; execution?: boolean },
  ): void {
    const empowered = flags?.empowered ?? false;
    const execution = flags?.execution ?? false;

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
