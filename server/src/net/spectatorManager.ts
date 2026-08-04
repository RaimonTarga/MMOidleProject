import {
  CLEARING_NODE_ID,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SpectateStatus,
} from "@mmo-idle/shared";
import type { Socket } from "socket.io";
import type { PlayerEntity } from "../ecs/entity";
import type { World } from "../world/World";
import { freezeNode, thawNode } from "../world/nodeLifecycle";

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
const TARGET_DEATH_HOLD_MS = 1_800;

interface SpectatorRecord {
  socket: GameSocket;
  ip: string;
  targetId: string | null;
  nodeId: string;
  targetName?: string;
  paused: boolean;
  lastActivityAt: number;
  lastStatusKey: string;
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
  private clearingLeased = false;
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
      nodeId: CLEARING_NODE_ID,
      paused: false,
      lastActivityAt: now,
      lastStatusKey: "",
    });
    this.reconcile(now);
    return true;
  }

  remove(socketId: string): void {
    this.records.delete(socketId);
    this.reconcileClearingLease();
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

  reconcile(now = Date.now()): void {
    for (const [socketId, record] of this.records) {
      if (!record.socket.connected) {
        this.records.delete(socketId);
        continue;
      }
      if (!record.paused && now - record.lastActivityAt >= this.idleMs) {
        record.paused = true;
      }
      if (!record.paused && !this.targetIsEligible(record.targetId, now)) {
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
    this.reconcileClearingLease();
  }

  recipientsByNode(): Map<string, GameSocket[]> {
    const byNode = new Map<string, GameSocket[]>();
    for (const record of this.records.values()) {
      if (record.paused || !record.socket.connected) continue;
      const list = byNode.get(record.nodeId) ?? [];
      list.push(record.socket);
      byNode.set(record.nodeId, list);
    }
    return byNode;
  }

  shutdown(): void {
    this.records.clear();
    this.reconcileClearingLease();
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
      record.targetId = null;
      record.targetName = undefined;
      record.nodeId = CLEARING_NODE_ID;
    }
  }

  private emitStatus(record: SpectatorRecord): void {
    const status: SpectateStatus = record.targetId
      ? {
          mode: "player",
          nodeId: record.nodeId,
          targetId: record.targetId,
          targetName: record.targetName,
          paused: record.paused,
        }
      : { mode: "clearing", nodeId: CLEARING_NODE_ID, paused: record.paused };
    const key = JSON.stringify(status);
    if (key === record.lastStatusKey) return;
    record.lastStatusKey = key;
    record.socket.emit("spectate:status", status);
  }

  private reconcileClearingLease(): void {
    const needsClearing = [...this.records.values()].some(
      (record) => !record.paused && record.targetId === null,
    );
    if (needsClearing && !this.clearingLeased) {
      thawNode(this.world, CLEARING_NODE_ID);
      this.clearingLeased = true;
    } else if (!needsClearing && this.clearingLeased) {
      if (this.world.countPlayersInNode(CLEARING_NODE_ID) === 0) {
        freezeNode(this.world, CLEARING_NODE_ID);
      }
      this.clearingLeased = false;
    }
  }
}
