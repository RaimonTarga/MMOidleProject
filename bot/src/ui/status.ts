/**
 * The live snapshot a running bot publishes to the dashboard.
 *
 * Every field comes from the bot's OWN player view plus its own route/telemetry
 * state. Nothing here needs a server, protocol or admin change, and the audited
 * anonymous-spectator projection (`SPECTATOR_PLAYER_KEYS`) is untouched — a bot
 * is simply showing you its own character sheet.
 */
export interface BotStatus {
  botId: string;
  runId: string;
  routeId: string;
  routeVersion: string;
  policyId: string;
  classRoot: string;
  characterName: string;

  connected: boolean;
  finished: boolean;
  /**
   * The bot's own entity id (its socket id), which is what the spectator camera
   * pins to, plus the ready-made URL that opens the dev client already
   * following it.
   */
  entityId: string;
  watchUrl: string | null;
  /** Set once the run ends. */
  completion?: string;
  stallReason?: string;

  startedAt: number;
  elapsedMs: number;
  rewardMultiplier: number;
  taints: string[];

  /** null until the world admits the character. */
  player: {
    alive: boolean;
    hp: number;
    maxHp: number;
    barrier: number;
    barrierMax: number;
    plating: number;
    damageReduction: number;
    dodgeRate: number;
    attack: number;
    playerTier: number;
    globalMastery: number;
    nodeId: string;
    biomeGroup: string | null;
    nodeModifier: string | null;
    attackTargetName: string | null;
    attackersOnSelf: number;
    monstersInNode: number;
    otherPlayersInNode: number;
    equipment: Record<string, string | null>;
    upgrades: Record<string, number>;
    essences: Record<string, number>;
    catalysts: Record<string, number>;
    biomeLevels: Record<string, number>;
    bossesCleared: string[];
    techniques: string[];
    guards: string[];
    runes: Array<{ conditionId: string; actionId: string }>;
  } | null;

  route: {
    stepIndex: number;
    stepTotal: number;
    stepLabel: string;
    milestones: string[];
  };

  stats: {
    kills: number;
    deaths: number;
    damageDealt: number;
    damageTaken: number;
    bossAttempts: number;
    bossVictories: number;
    targetSwitches: number;
  };

  /** Most recent interesting events, newest last. */
  recent: Array<{ atMs: number; kind: string; text: string }>;
}

/**
 * A schematic snapshot of the bot's node, for the harness viewport.
 *
 * Built from the bot's own mirror, so it needs no sprites, no atlas and no
 * asset pipeline — which is precisely why it paints instantly and shows the
 * things a balance run cares about: who is where, who is hitting whom, and how
 * many things are on you at once.
 */
export interface WorldEntity {
  id: string;
  kind: "self" | "monster" | "minion" | "player";
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  isBoss: boolean;
  /** Who this entity is swinging at, when it has a target. */
  targetId: string | null;
}

export interface WorldView {
  botId: string;
  nodeId: string;
  biomeGroup: string | null;
  nodeModifier: string | null;
  width: number;
  height: number;
  entities: WorldEntity[];
}

export type StatusProvider = () => BotStatus;
export type WorldProvider = () => WorldView;

/**
 * Process-wide registry of live bots. `pnpm bot:batch` runs every bot in ONE
 * process, so a single dashboard covers the whole cohort.
 */
class BotRegistry {
  private readonly providers = new Map<string, StatusProvider>();
  private readonly worlds = new Map<string, WorldProvider>();

  register(botId: string, provider: StatusProvider, world?: WorldProvider): () => void {
    this.providers.set(botId, provider);
    if (world) this.worlds.set(botId, world);
    return () => {
      this.providers.delete(botId);
      this.worlds.delete(botId);
    };
  }

  world(botId: string): WorldView | null {
    try {
      return this.worlds.get(botId)?.() ?? null;
    } catch {
      return null;
    }
  }

  snapshot(): BotStatus[] {
    const out: BotStatus[] = [];
    for (const provider of this.providers.values()) {
      try {
        out.push(provider());
      } catch {
        // A bot mid-teardown must never take the dashboard down with it.
      }
    }
    return out.sort((a, b) => a.botId.localeCompare(b.botId));
  }

  get size(): number {
    return this.providers.size;
  }
}

export const botRegistry = new BotRegistry();
