import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SpectateStatus,
  type SpectateTarget,
} from "@mmo-idle/shared";
import type { Socket } from "socket.io";
import type { PlayerEntity } from "../ecs/entity";
import type { World } from "../world/World";

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
const TARGET_DEATH_HOLD_MS = 1_800;

interface SpectatorRecord {
  socket: GameSocket;
  ip: string;
  targetId: string | null;
  /** Null while idle — there is no fallback node to fall back TO. */
  nodeId: string | null;
  targetName?: string;
  paused: boolean;
  lastActivityAt: number;
  lastStatusKey: string;
  /** Dev-only manual follow. While set, auto-retargeting is suppressed. */
  pinnedTargetId: string | null;
}

export interface SpectatorManagerOptions {
  maxGlobal?: number;
  maxPerIp?: number;
  idleMs?: number;
  random?: () => number;
  isPlayerConnected?: (playerId: string) => boolean;
  isPlayerInactive?: (playerId: string) => boolean;
}

/** Highest tier wins; combat activity and randomness break ties in that order. */
export function pickSpectatorTarget(
  eligible: readonly PlayerEntity[],
  random: () => number,
): PlayerEntity | undefined {
  if (eligible.length === 0) return undefined;
  const highestTier = Math.max(
    ...eligible.map((player) => player.tracksProgression.playerTier),
  );
  const highestTierPlayers = eligible.filter(
    (player) => player.tracksProgression.playerTier === highestTier,
  );
  const fighting = highestTierPlayers.filter(
    (player) => player.hasAttackTarget !== undefined,
  );
  const pool = fighting.length > 0 ? fighting : highestTierPlayers;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

export class SpectatorManager {
  private readonly records = new Map<string, SpectatorRecord>();
  private readonly maxGlobal: number;
  private readonly maxPerIp: number;
  private readonly idleMs: number;
  private readonly random: () => number;
  private readonly isPlayerConnected: (playerId: string) => boolean;
  private readonly isPlayerInactive: (playerId: string) => boolean;

  constructor(
    private readonly world: World,
    opts: SpectatorManagerOptions = {},
  ) {
    this.maxGlobal = opts.maxGlobal ?? 16;
    this.maxPerIp = opts.maxPerIp ?? 2;
    this.idleMs = opts.idleMs ?? 10 * 60_000;
    this.random = opts.random ?? Math.random;
    this.isPlayerConnected = opts.isPlayerConnected ?? (() => true);
    this.isPlayerInactive = opts.isPlayerInactive ?? (() => false);
  }

  admit(socket: GameSocket, ip: string, now = Date.now()): boolean {
    if (this.records.size >= this.maxGlobal) return false;
    let sameIp = 0;
    for (const record of this.records.values()) {
      if (record.ip === ip) sameIp++;
    }
    if (sameIp >= this.maxPerIp) return false;

    this.records.set(socket.id, {
      socket,
      ip,
      targetId: null,
      nodeId: null,
      paused: false,
      lastActivityAt: now,
      lastStatusKey: "",
      pinnedTargetId: null,
    });
    this.reconcile(now);
    return true;
  }

  remove(socketId: string): void {
    this.records.delete(socketId);
  }

  setActive(socketId: string, active: boolean, now = Date.now()): void {
    const record = this.records.get(socketId);
    if (!record) return;
    record.lastActivityAt = now;
    record.paused = !active;
    if (active) record.targetId = null;
    this.emitStatus(record);
    this.reconcile(now);
  }

  resume(socketId: string, now = Date.now()): void {
    this.setActive(socketId, true, now);
  }

  /**
   * Pin the camera to one player (dev tooling), or clear the pin with `null`.
   *
   * Pinning a character that is currently dead or not yet loaded is fine: the
   * pin is remembered and {@link followPin} adopts it as soon as it is
   * watchable.
   */
  setTarget(socketId: string, playerId: string | null, now = Date.now()): void {
    const record = this.records.get(socketId);
    if (!record) return;
    record.lastActivityAt = now;
    record.paused = false;
    record.pinnedTargetId = playerId;
    if (!playerId) record.targetId = null;
    this.reconcile(now);
  }

  /** Identity-only roster for the dev target picker. */
  targetRoster(): SpectateTarget[] {
    const out: SpectateTarget[] = [];
    for (const player of this.world.livePlayers) {
      if (!this.isPlayerConnected(player.isPlayer.id)) continue;
      if (this.isPlayerInactive(player.isPlayer.id)) continue;
      out.push({
        id: player.isPlayer.id,
        name: player.isPlayer.name,
        playerTier: player.tracksProgression.playerTier,
        nodeId: player.hasPosition.nodeId,
      });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  reconcile(now = Date.now()): void {
    for (const [socketId, record] of this.records) {
      if (!record.socket.connected) {
        this.records.delete(socketId);
        continue;
      }
      if (!record.paused && now - record.lastActivityAt >= this.idleMs) {
        record.paused = true;
      }
      if (!record.paused && record.pinnedTargetId) {
        this.followPin(record, now);
      } else if (!record.paused && !this.targetIsEligible(record.targetId, now)) {
        this.assignTarget(record);
      } else if (record.targetId) {
        const target = this.world.getPlayerEntity(record.targetId);
        if (target) {
          record.nodeId = target.hasPosition.nodeId;
          record.targetName = target.isPlayer.name;
        }
      }
      this.emitStatus(record);
    }
  }

  /**
   * Hold a manual pin across the target's ordinary ups and downs.
   *
   * A pinned character that is merely DEAD is still the one the viewer asked to
   * watch, so the pin is kept and the camera borrows the automatic pick only as
   * temporary cover, snapping back on respawn. Bots die constantly, so dropping
   * the pin on every death would make pinning useless. The pin is released only
   * when the player entity is gone entirely (disconnected).
   */
  private followPin(record: SpectatorRecord, now: number): void {
    const pinnedId = record.pinnedTargetId;
    if (!pinnedId) return;

    if (this.targetIsEligible(pinnedId, now)) {
      const player = this.world.getPlayerEntity(pinnedId)!;
      record.targetId = pinnedId;
      record.targetName = player.isPlayer.name;
      record.nodeId = player.hasPosition.nodeId;
      return;
    }

    if (!this.world.getPlayerEntity(pinnedId)) {
      record.pinnedTargetId = null;
    }
    if (!this.targetIsEligible(record.targetId, now)) this.assignTarget(record);
  }

  recipientsByNode(): Map<string, GameSocket[]> {
    const byNode = new Map<string, GameSocket[]>();
    for (const record of this.records.values()) {
      if (record.paused || !record.socket.connected || !record.nodeId) continue;
      const list = byNode.get(record.nodeId) ?? [];
      list.push(record.socket);
      byNode.set(record.nodeId, list);
    }
    return byNode;
  }

  shutdown(): void {
    this.records.clear();
  }

  private targetIsEligible(targetId: string | null, now: number): boolean {
    if (!targetId) return false;
    const player = this.world.getPlayerEntity(targetId);
    return Boolean(
      player &&
      (!player.isDead || now - player.isDead.diedAtMs < TARGET_DEATH_HOLD_MS) &&
      this.isPlayerConnected(targetId) &&
      !this.isPlayerInactive(targetId),
    );
  }

  private assignTarget(record: SpectatorRecord): void {
    const eligible = [...this.world.livePlayers].filter((player) =>
      this.isPlayerConnected(player.isPlayer.id) &&
      !this.isPlayerInactive(player.isPlayer.id),
    );
    const target = pickSpectatorTarget(eligible, this.random);

    if (target) {
      record.targetId = target.isPlayer.id;
      record.targetName = target.isPlayer.name;
      record.nodeId = target.hasPosition.nodeId;
    } else {
      // Nobody watchable. Deliberately no fallback node: the old behaviour
      // pointed every idle viewer at the Clearing, which with no players in it
      // is an empty stone circle — a worse first impression than the landing
      // page's own backdrop. The client shows no live pane at all instead.
      record.targetId = null;
      record.targetName = undefined;
      record.nodeId = null;
    }
  }

  private emitStatus(record: SpectatorRecord): void {
    // A record with a target always has that target's node; the null case is
    // exactly the idle branch below.
    const status: SpectateStatus = record.targetId && record.nodeId
      ? {
          mode: "player",
          nodeId: record.nodeId,
          targetId: record.targetId,
          targetName: record.targetName,
          paused: record.paused,
          pinned: record.pinnedTargetId === record.targetId,
        }
      : { mode: "idle", paused: record.paused };
    const key = JSON.stringify(status);
    if (key === record.lastStatusKey) return;
    record.lastStatusKey = key;
    record.socket.emit("spectate:status", status);
  }
}
