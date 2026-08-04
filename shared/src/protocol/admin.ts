import type { NodeTelemetrySnapshot } from './nodeTelemetry';
import type { WorldLogEvent } from './worldLogEvents';
import type { EssenceType } from '../items';
import type { EquippedAbilities } from '../abilities';
import type { EquippedStances } from '../stances';

export type AdminLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface AdminLogEntry {
  id: number;
  ts: number;
  level: AdminLogLevel;
  logger: string;
  message: string;
  playerId?: string;
  accountId?: string;
  nodeId?: string;
  action?: string;
  meta?: Record<string, unknown>;
}

export interface AdminPlayerSummary {
  /** Runtime socket/entity id used by admin actions. */
  id: string;
  /** Stable persisted character id. */
  characterId: string;
  accountId: string | null;
  name: string;
  nodeId: string;
  hp: number;
  maxHp: number;
  level: number;
  playerTier: number;
  skillPoints: number;
  combatArchetype: string | null;
  selectedClass: string | null;
  selectedSubVariant: string | null;
  selectedRange: string | null;
  auto: boolean;
  autoTraverse: boolean;
  inactive: boolean;
  isDead: boolean;
  partyLeaderId: string | null;
  partySize: number;
}

export interface AdminCharacterRecord {
  id: string;
  accountId: string;
  accountDisplayName: string;
  name: string;
  nodeId: string;
  hp: number;
  maxHp: number;
  level: number;
  playerTier: number;
  skillPoints: number;
  combatArchetype: string | null;
  selectedClass: string | null;
  selectedSubVariant: string | null;
  selectedRange: string | null;
  essences: Partial<Record<EssenceType, number>>;
  biomeLevel: Record<string, number>;
  /** Derived sum of all biome levels (system rework Step 4). */
  globalMastery: number;
  clearedNodes: string[];
  bossesCleared: string[];
  inventoryCount: number;
  equipmentCount: number;
  /** Abilities learned + equipped (system rework Step 7). */
  knownAbilities: string[];
  equippedAbilities: EquippedAbilities;
  /** Stances learned + equipped + active posture (system rework Step 10). */
  knownStances: string[];
  equippedStances: EquippedStances;
  activeStance: string | null;
  /** Rites learned + equipped (system rework Step 11). */
  knownRites: string[];
  equippedRites: string[];
  lastPlayedAt: number;
  updatedAt: number;
}

export type AdminAction =
  | { kind: 'killPlayer'; targetPlayerId: string }
  | { kind: 'respawnPlayer'; targetPlayerId: string }
  | { kind: 'resetProgress'; targetPlayerId: string }
  | { kind: 'resetClass'; targetPlayerId: string }
  | { kind: 'teleportPlayer'; targetPlayerId: string; nodeId: string }
  | { kind: 'refreshRecipes'; targetPlayerId: string }
  | { kind: 'equipPhaseTester'; targetPlayerId: string }
  | { kind: 'goToTestRoom'; targetPlayerId: string }
  | { kind: 'leaveTestRoom'; targetPlayerId: string }
  | { kind: 'respawnNode'; nodeId: string };

export interface AdminActionResult {
  requestId: string;
  ok: boolean;
  action: AdminAction;
  message: string;
}

export interface AdminLogQuery {
  limit?: number;
  beforeTs?: number;
  level?: AdminLogLevel;
  playerId?: string;
  accountId?: string;
  nodeId?: string;
  search?: string;
}

export interface AdminWorldLogEntry {
  id: number;
  viewerId: string;
  viewerAccountId?: string;
  viewerCharacterId?: string;
  viewerName: string;
  event: WorldLogEvent;
}

export interface AdminWorldLogQuery {
  limit?: number;
  beforeTs?: number;
  viewerId?: string;
  viewerAccountId?: string;
  viewerCharacterId?: string;
  nodeId?: string;
  kind?: WorldLogEvent['kind'];
}

export type AnalyticsEventKind =
  | 'session-start'
  | 'session-end'
  | 'node-enter'
  | 'skill-unlock'
  | 'player-death'
  | 'progression'
  | 'server-sample';

export interface AdminAnalyticsQuery {
  days?: number;
  gameVersion?: string;
}

export interface AdminAnalyticsSummary {
  gameVersion: string;
  windowDays: number;
  averagePlaytimeMs: number;
  sessions: number;
  activeAccounts: number;
  deaths: number;
  progressionEvents: number;
}

export interface AdminAnalyticsSankeyNode {
  name: string;
}

export interface AdminAnalyticsSankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface AdminAnalyticsBiomeRow {
  biomeGroup: string;
  biomeName: string;
  visits: number;
}

export interface AdminAnalyticsDailyBucket {
  day: string;
  activeAccounts: number;
  peakPlayers: number;
  deaths: number;
  progressionEvents: number;
  dropoffs: number;
}

export interface AdminAnalyticsDropoffRow {
  nodeId: string;
  biomeGroup: string;
  biomeName: string;
  dropoffs: number;
}

export interface AdminAnalyticsNodeHeatmapRow {
  nodeId: string;
  biomeGroup: string;
  biomeName: string;
  biomeTier: number;
  isDungeon: boolean;
  accounts: number;
  events: number;
}

export interface AdminAnalyticsSnapshot {
  generatedAt: number;
  summary: AdminAnalyticsSummary;
  versions: string[];
  perkSankey: {
    nodes: AdminAnalyticsSankeyNode[];
    links: AdminAnalyticsSankeyLink[];
  };
  popularBiomes: AdminAnalyticsBiomeRow[];
  rolling30d: AdminAnalyticsDailyBucket[];
  dropoffs: AdminAnalyticsDropoffRow[];
  nodeVisitHeatmap: AdminAnalyticsNodeHeatmapRow[];
}

export interface AdminServerToClientEvents {
  'admin:players': (players: AdminPlayerSummary[]) => void;
  'admin:characters': (characters: AdminCharacterRecord[]) => void;
  'admin:logs': (logs: AdminLogEntry[]) => void;
  'admin:log': (log: AdminLogEntry) => void;
  'admin:worldLog': (entries: AdminWorldLogEntry[]) => void;
  'admin:analytics': (snapshot: AdminAnalyticsSnapshot) => void;
  'admin:telemetry': (snapshot: NodeTelemetrySnapshot) => void;
  'admin:actionResult': (result: AdminActionResult) => void;
  'admin:error': (payload: { message: string }) => void;
}

export interface AdminClientToServerEvents {
  'admin:requestPlayers': () => void;
  'admin:requestCharacters': () => void;
  'admin:requestLogs': (query: AdminLogQuery) => void;
  'admin:requestWorldLog': (query: AdminWorldLogQuery) => void;
  'admin:requestAnalytics': (query: AdminAnalyticsQuery) => void;
  'admin:action': (requestId: string, action: AdminAction) => void;
}
