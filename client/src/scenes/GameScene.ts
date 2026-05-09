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

interface Visual {
  sprite: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  /** Server-authoritative destination; stepEntities() interpolates toward this each frame. */
  targetX: number;
  targetY: number;
}

export class GameScene extends Phaser.Scene {
  private socket!: GameSocket;
  private players = new Map<string, Visual>();
  private monsters = new Map<string, Visual>();
  private myId = '';
  private statusText!: Phaser.GameObjects.Text;
  /** Yellow dot shown at the last click destination; hidden on arrival. */
  private targetMarker!: Phaser.GameObjects.Arc;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // ── UI ─────────────────────────────────────────────────────────────────
    this.statusText = this.add.text(12, 12, 'Connecting to server…', {
      color: '#aaaaaa',
      fontSize: '14px',
      fontFamily: 'monospace',
    });

    this.add.text(12, GAME_CONFIG.NODE_HEIGHT - 24, 'MMO Idle — click to move', {
      color: '#444466',
      fontSize: '12px',
      fontFamily: 'monospace',
    });

    this.targetMarker = this.add.circle(0, 0, 5, 0xffff44, 0.8).setVisible(false);

    // ── Click to move ────────────────────────────────────────────────────────
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.myId) return;
      const tx = Math.round(pointer.x);
      const ty = Math.round(pointer.y);

      this.socket.emit('player:move', { x: tx, y: ty });

      // Predict locally so the visual starts moving before the tick confirms.
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
    });

    this.socket.on('disconnect', () => {
      this.statusText.setText('Disconnected — retrying…');
      this.statusText.setColor('#ff4444');
      this.myId = '';
    });

    this.socket.on('state:sync', (snapshot) => {
      this.applySnapshot(snapshot);
    });

    this.socket.on('node:state', (snapshot) => {
      this.applySnapshot(snapshot);
    });

    this.socket.on('player:joined', (player) => {
      this.upsertPlayer(player);
    });

    this.socket.on('player:left', (playerId) => {
      const vp = this.players.get(playerId);
      if (vp) {
        vp.sprite.destroy();
        vp.label.destroy();
        this.players.delete(playerId);
      }
    });
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    this.stepEntities(this.players, dt, GAME_CONFIG.PLAYER_SPEED);
    this.stepEntities(this.monsters, dt, GAME_CONFIG.PLAYER_SPEED); // monsters get own speed later

    // Hide the target marker once own player reaches the destination.
    const own = this.players.get(this.myId);
    if (own && this.targetMarker.visible) {
      const dx = own.sprite.x - this.targetMarker.x;
      const dy = own.sprite.y - this.targetMarker.y;
      if (dx * dx + dy * dy < 16) this.targetMarker.setVisible(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private applySnapshot(snapshot: NodeSnapshot) {
    snapshot.players.forEach((p) => this.upsertPlayer(p));
    snapshot.monsters.forEach((m) => this.upsertMonster(m));
  }

  /** Move all visuals in `map` toward their targets at `speed` px/s. */
  private stepEntities(map: Map<string, Visual>, dt: number, speed: number) {
    for (const v of map.values()) {
      const { sprite, label } = v;
      const dx = v.targetX - sprite.x;
      const dy = v.targetY - sprite.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > 1) {
        const dist = Math.sqrt(distSq);
        const step = Math.min(speed * dt, dist);
        sprite.setPosition(sprite.x + (dx / dist) * step, sprite.y + (dy / dist) * step);
      } else {
        sprite.setPosition(v.targetX, v.targetY);
      }

      label.setPosition(sprite.x - 16, sprite.y - 34);
    }
  }

  private upsertPlayer(player: PlayerState) {
    let vp = this.players.get(player.id);
    if (!vp) {
      const color = player.id === this.myId ? 0x44ff88 : 0x4488ff;
      const sprite = this.add.rectangle(player.x, player.y, 32, 48, color);
      const label = this.add.text(player.x - 16, player.y - 34, player.name, {
        color: '#ffffff',
        fontSize: '10px',
        fontFamily: 'monospace',
      });
      vp = { sprite, label, targetX: player.targetX, targetY: player.targetY };
      this.players.set(player.id, vp);
      return;
    }
    vp.targetX = player.targetX;
    vp.targetY = player.targetY;
  }

  private upsertMonster(monster: MonsterState) {
    let vm = this.monsters.get(monster.id);
    if (!vm) {
      const sprite = this.add.rectangle(monster.x, monster.y, 32, 32, 0xff4444);
      const label = this.add.text(monster.x - 16, monster.y - 26, monster.name, {
        color: '#ffaaaa',
        fontSize: '10px',
        fontFamily: 'monospace',
      });
      vm = { sprite, label, targetX: monster.targetX, targetY: monster.targetY };
      this.monsters.set(monster.id, vm);
      return;
    }
    vm.targetX = monster.targetX;
    vm.targetY = monster.targetY;
  }
}
