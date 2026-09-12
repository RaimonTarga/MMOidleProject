import { io, type Socket } from "socket.io-client";
import type {
  AccountCharactersPayload,
  CharacterActionResult,
  CharacterCreateResult,
  ClientToServerEvents,
  DeltaSnapshot,
  PlayerDeathPayload,
  ServerToClientEvents,
  WorldLogEvent,
} from "@mmo-idle/shared";
import { WorldMirror } from "../state/reducer";

export type BotSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface ConnectionHooks {
  onDelta(snapshot: DeltaSnapshot): void;
  onWorldEvents(events: WorldLogEvent[]): void;
  onDied(payload: PlayerDeathPayload): void;
  onAscended(tier: number): void;
  onKicked(reason: string): void;
  onRewardMultiplier(multiplier: number): void;
  /** Unexpected transport loss is terminal for frozen isolated experiments. */
  onDisconnect?(reason: string): void;
}

export class ConnectionError extends Error {}

/**
 * One headless client session: socket lifecycle, lobby, and the mirror feed.
 *
 * Authentication uses the shipped dev bypass (`{ devAccountId }`), which
 * `authenticateSocketHandshake` accepts only when `NODE_ENV !== production` AND
 * `AUTH_DEV_BYPASS=1`. Deliberately NOT `POST /auth/guest`: that route is rate
 * limited to five accounts per hour per IP, which a multi-bot batch trips
 * immediately.
 */
export class BotConnection {
  readonly mirror = new WorldMirror();
  private socket: BotSocket | null = null;
  private hooks: ConnectionHooks | null = null;
  private characters: AccountCharactersPayload | null = null;
  private charactersWaiters: Array<(p: AccountCharactersPayload) => void> = [];
  private closedByClient = false;
  /** Bumped on every `account:characters` push — the lobby's sequencing signal. */
  private rosterVersion = 0;
  private pendingEvents = new Set<keyof ServerToClientEvents>();

  constructor(
    private readonly serverUrl: string,
    private readonly devAccountId: string,
  ) {}

  get id(): string {
    return this.socket?.id ?? "";
  }

  get raw(): BotSocket {
    if (!this.socket) throw new ConnectionError("socket not connected");
    return this.socket;
  }

  async connect(hooks: ConnectionHooks, timeoutMs = 20_000): Promise<void> {
    if (this.socket) throw new ConnectionError("disconnect the previous session before connecting again");
    this.mirror.reset();
    this.mirror.ownId = null;
    this.characters = null;
    this.hooks = hooks;
    this.closedByClient = false;
    const socket: BotSocket = io(this.serverUrl, {
      auth: { devAccountId: this.devAccountId },
      transports: ["websocket"],
      reconnection: false,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    }) as BotSocket;
    this.socket = socket;

    socket.on("account:characters", (payload) => {
      this.characters = payload;
      this.rosterVersion += 1;
      const waiters = this.charactersWaiters;
      this.charactersWaiters = [];
      for (const resolve of waiters) resolve(payload);
    });

    // The server names our entity by SOCKET id (`world.attachPlayerEntity(slices,
    // socketId)`), which is what the browser client keys `ownId` on too.
    const ingest = (snapshot: DeltaSnapshot): void => {
      if (!this.mirror.ownId) this.mirror.ownId = socket.id ?? null;
      const neededResync = this.mirror.needsResync;
      this.mirror.apply(snapshot);
      if (!neededResync && this.mirror.needsResync) socket.emit("player:requestSync");
      hooks.onDelta(snapshot);
    };
    socket.on("state:sync", ingest);
    socket.on("node:delta", ingest);

    socket.on("world:events", (events) => hooks.onWorldEvents(events));
    socket.on("player:died", (payload) => hooks.onDied(payload));
    socket.on("player:ascended", (tier) => hooks.onAscended(tier));
    socket.on("debug:rewardMultiplier", (m) => hooks.onRewardMultiplier(m));
    socket.on("session:kicked", (payload) => hooks.onKicked(payload.reason));

    // A reconnect re-attaches a NEW socket id, so the old own-entity key is
    // stale and every mirrored entity belongs to a previous session.
    socket.on("disconnect", (reason) => {
      this.characters = null;
      this.mirror.ownId = null;
      this.mirror.reset();
      if (!this.closedByClient) hooks.onDisconnect?.(reason);
    });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => { this.disconnect(); reject(new ConnectionError(`connect timed out after ${timeoutMs}ms`)); },
        timeoutMs,
      );
      socket.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once("connect_error", (err) => {
        clearTimeout(timer);
        this.disconnect();
        reject(
          new ConnectionError(
            `connect failed: ${err.message}. Is the dev server running with AUTH_DEV_BYPASS=1?`,
          ),
        );
      });
    });
  }

  /** Latest lobby roster, waiting for the first push if it has not arrived. */
  async awaitCharacters(timeoutMs = 15_000): Promise<AccountCharactersPayload> {
    if (this.characters) return this.characters;
    return new Promise((resolve, reject) => {
      const waiter = (payload: AccountCharactersPayload): void => {
        clearTimeout(timer);
        resolve(payload);
      };
      const timer = setTimeout(
        () => {
          this.charactersWaiters = this.charactersWaiters.filter(w => w !== waiter);
          reject(new ConnectionError("character list never arrived"));
        },
        timeoutMs,
      );
      this.charactersWaiters.push(waiter);
    });
  }

  /**
   * Wait for the roster push that follows a lobby mutation.
   *
   * The server emits `character:*Result` BEFORE it awaits `emitCharacterList()`
   * and only clears its `mutatingCharacters` guard after that — so a client that
   * fires the next intent the instant a result lands is rejected with "Another
   * character action is already in progress". A human clicking a button never
   * hits that window; a bot does every time. Waiting for the roster push is the
   * server's own end-of-mutation signal.
   */
  private async awaitRosterAfter(version: number, timeoutMs = 15_000): Promise<void> {
    if (this.rosterVersion > version) return;
    await new Promise<void>((resolve, reject) => {
      const waiter = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        this.charactersWaiters = this.charactersWaiters.filter(w => w !== waiter);
        reject(new ConnectionError("authoritative roster update timed out"));
      }, timeoutMs);
      this.charactersWaiters.push(waiter);
    });
  }

  async createCharacter(name: string): Promise<string> {
    const result = await this.lobbyMutation<CharacterCreateResult>(
      "character:createResult",
      () => this.raw.emit("character:create", { name }),
      "character:create",
    );
    if (!result.characterId) {
      throw new ConnectionError("character:create succeeded without an id");
    }
    return result.characterId;
  }

  async deleteCharacter(characterId: string): Promise<void> {
    await this.lobbyMutation<CharacterActionResult>(
      "character:deleteResult",
      () => this.raw.emit("character:delete", { characterId }),
      "character:delete",
    );
  }

  async selectCharacter(characterId: string): Promise<void> {
    const result = await this.request<CharacterActionResult>(
      "character:selectResult",
      () => this.raw.emit("character:select", { characterId }),
    );
    if (!result.success) {
      throw new ConnectionError(`character:select failed: ${result.reason ?? "unknown"}`);
    }
  }

  /**
   * One create/delete, serialised against the server's mutation guard: wait for
   * the roster push afterwards, and retry the one rejection that is purely a
   * race rather than a real refusal.
   */
  private async lobbyMutation<T extends CharacterActionResult>(
    event: keyof ServerToClientEvents,
    send: () => void,
    what: string,
    attempts = 5,
  ): Promise<T> {
    let lastReason = "unknown";
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const version = this.rosterVersion;
      const result = await this.request<T>(event, send);
      if (result.success) {
        await this.awaitRosterAfter(version);
        return result;
      }
      lastReason = result.reason ?? "unknown";
      if (!lastReason.includes("already in progress")) break;
      await this.awaitRosterAfter(version, 2_000);
    }
    throw new ConnectionError(`${what} failed: ${lastReason}`);
  }

  /**
   * Emit an intent and await its single acknowledgement event. The player
   * protocol answers each mutating intent with a dedicated result event rather
   * than a socket.io ack, so this pairs them.
   */
  request<T>(
    event: keyof ServerToClientEvents,
    send: () => void,
    timeoutMs = 15_000,
    matches: (payload: any) => boolean = () => true,
  ): Promise<T> {
    if (this.pendingEvents.has(event)) return Promise.reject(new ConnectionError(`concurrent request on ${event} is not correlated by the protocol`));
    return new Promise<T>((resolve, reject) => {
      const socket = this.raw;
      if (!socket.connected) { reject(new ConnectionError("socket disconnected")); return; }
      this.pendingEvents.add(event);
      const cleanup = (): void => {
        clearTimeout(timer);
        socket.off(event as never, handler as never);
        socket.off("disconnect", disconnected);
        this.pendingEvents.delete(event);
      };
      const disconnected = (): void => { cleanup(); reject(new ConnectionError(`${event}: disconnected before acknowledgement`)); };
      const timer = setTimeout(() => {
        cleanup();
        reject(new ConnectionError(`${String(event)} timed out after ${timeoutMs}ms`));
        // No request ids exist on these events. A late result must never be
        // mistaken for a subsequent request's result on the same connection.
        socket.disconnect();
      }, timeoutMs);
      const handler = (payload: T): void => {
        if (!matches(payload)) return;
        cleanup();
        resolve(payload);
      };
      socket.on(event as never, handler as never);
      socket.on("disconnect", disconnected);
      try { send(); } catch (error) { cleanup(); reject(error); }
    });
  }

  disconnect(): void {
    this.closedByClient = true;
    this.socket?.disconnect();
    this.socket = null;
    this.hooks = null;
  }
}
