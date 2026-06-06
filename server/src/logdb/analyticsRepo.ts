import { and, asc, eq, gte, lt, type SQL } from 'drizzle-orm';
import type {
  AdminAnalyticsBiomeRow,
  AdminAnalyticsDailyBucket,
  AdminAnalyticsDropoffRow,
  AdminAnalyticsNodeHeatmapRow,
  AdminAnalyticsQuery,
  AdminAnalyticsSankeyLink,
  AdminAnalyticsSnapshot,
  AnalyticsEventKind,
} from '@mmo-idle/shared';
import {
  BIOME_DATABASE,
  NODE_BIOMES,
  SKILL_TREE,
} from '@mmo-idle/shared';
import { logDb } from './index';
import { analyticsEvents } from './schema';
import { gameVersion } from '../analytics/version';

const DEFAULT_ANALYTICS_DAYS = 30;
const MAX_ANALYTICS_DAYS = 30;
const ANALYTICS_RETENTION_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AnalyticsEventInput {
  kind: AnalyticsEventKind;
  accountId?: string;
  playerId?: string;
  nodeId?: string;
  value?: number;
  meta?: Record<string, unknown>;
  ts?: number;
}

type AnalyticsInsert = typeof analyticsEvents.$inferInsert;
type AnalyticsRow = typeof analyticsEvents.$inferSelect;

export async function insertAnalyticsEvents(
  entries: AnalyticsEventInput[],
): Promise<void> {
  if (entries.length === 0) return;
  const version = gameVersion();
  const values: AnalyticsInsert[] = entries.map((entry) => ({
    ts: entry.ts ?? Date.now(),
    gameVersion: version,
    accountId: entry.accountId ?? null,
    playerId: entry.playerId ?? null,
    nodeId: entry.nodeId ?? null,
    kind: entry.kind,
    value: entry.value ?? null,
    meta: entry.meta ?? null,
  }));
  await logDb.insert(analyticsEvents).values(values);
}

export async function queryAnalyticsSnapshot(
  query: AdminAnalyticsQuery,
): Promise<AdminAnalyticsSnapshot> {
  const days = clampDays(query.days);
  const now = Date.now();
  const start = startOfUtcDay(now - (days - 1) * MS_PER_DAY);
  const clauses: SQL<unknown>[] = [gte(analyticsEvents.ts, start)];
  if (query.gameVersion) clauses.push(eq(analyticsEvents.gameVersion, query.gameVersion));
  const rows = await logDb
    .select()
    .from(analyticsEvents)
    .where(and(...clauses))
    .orderBy(asc(analyticsEvents.ts));

  return buildSnapshot(rows, days, now, query.gameVersion ?? gameVersion());
}

export async function pruneExpiredAnalyticsEvents(now = Date.now()): Promise<void> {
  const cutoff = now - ANALYTICS_RETENTION_DAYS * MS_PER_DAY;
  await logDb.delete(analyticsEvents).where(lt(analyticsEvents.ts, cutoff));
}

function buildSnapshot(
  rows: AnalyticsRow[],
  days: number,
  now: number,
  requestedVersion: string,
): AdminAnalyticsSnapshot {
  const versions = [...new Set(rows.map((row) => row.gameVersion))].sort();
  const dayBuckets = createDayBuckets(days, now);
  const activeAccountsByDay = new Map<string, Set<string>>();
  const sessionDurations: number[] = [];
  const biomeVisits = new Map<string, number>();
  const nodeVisitEvents = new Map<string, number>();
  const nodeVisitAccounts = new Map<string, Set<string>>();
  const dropoffsByNode = new Map<string, number>();
  const edgeActors = new Map<string, Set<string>>();
  const sankeyNodeNames = new Set<string>();
  let deaths = 0;
  let progressionEvents = 0;

  for (const row of rows) {
    const day = dayKey(row.ts);
    const bucket = dayBuckets.get(day);
    const accountKey = row.accountId ?? row.playerId;
    if (accountKey) {
      let active = activeAccountsByDay.get(day);
      if (!active) {
        active = new Set<string>();
        activeAccountsByDay.set(day, active);
      }
      active.add(accountKey);
    }

    if (row.kind === 'session-end') {
      if (typeof row.value === 'number' && row.value > 0) sessionDurations.push(row.value);
      if (bucket) bucket.dropoffs += 1;
      if (row.nodeId) increment(dropoffsByNode, row.nodeId, 1);
    }

    if (row.kind === 'node-enter' && row.nodeId) {
      const biomeGroup = NODE_BIOMES[row.nodeId]?.biomeGroup;
      if (biomeGroup) increment(biomeVisits, biomeGroup, 1);
      increment(nodeVisitEvents, row.nodeId, 1);
      const actor = row.accountId ?? row.playerId;
      if (actor) {
        let actors = nodeVisitAccounts.get(row.nodeId);
        if (!actors) {
          actors = new Set<string>();
          nodeVisitAccounts.set(row.nodeId, actors);
        }
        actors.add(actor);
      }
    }

    if (row.kind === 'skill-unlock') {
      addSankeyEdges(row, sankeyNodeNames, edgeActors);
    }

    if (row.kind === 'player-death') {
      deaths += 1;
      if (bucket) bucket.deaths += 1;
    }

    if (row.kind === 'progression') {
      progressionEvents += 1;
      if (bucket) bucket.progressionEvents += 1;
    }

    if (row.kind === 'server-sample' && bucket) {
      bucket.peakPlayers = Math.max(bucket.peakPlayers, row.value ?? 0);
    }
  }

  for (const [day, activeAccounts] of activeAccountsByDay) {
    const bucket = dayBuckets.get(day);
    if (bucket) bucket.activeAccounts = activeAccounts.size;
  }

  const activeAccounts = new Set(
    rows
      .map((row) => row.accountId ?? row.playerId)
      .filter((id): id is string => typeof id === 'string'),
  ).size;

  return {
    generatedAt: now,
    summary: {
      gameVersion: requestedVersion,
      windowDays: days,
      averagePlaytimeMs: average(sessionDurations),
      sessions: sessionDurations.length,
      activeAccounts,
      deaths,
      progressionEvents,
    },
    versions,
    perkSankey: {
      nodes: [...sankeyNodeNames].map((name) => ({ name })),
      links: [...edgeActors.entries()]
        .map(([key, actors]) => {
          const [source, target] = key.split('\u0000');
          return { source, target, value: actors.size };
        })
        .filter((link): link is AdminAnalyticsSankeyLink => !!link.source && !!link.target),
    },
    popularBiomes: [...biomeVisits.entries()]
      .map(([biomeGroup, visits]): AdminAnalyticsBiomeRow => ({
        biomeGroup,
        biomeName: BIOME_DATABASE.get(biomeGroup)?.name ?? biomeGroup,
        visits,
      }))
      .sort((a, b) => b.visits - a.visits),
    rolling30d: [...dayBuckets.values()],
    dropoffs: [...dropoffsByNode.entries()]
      .map(([nodeId, dropoffs]): AdminAnalyticsDropoffRow => {
        const biomeGroup = NODE_BIOMES[nodeId]?.biomeGroup ?? 'unknown';
        return {
          nodeId,
          biomeGroup,
          biomeName: BIOME_DATABASE.get(biomeGroup)?.name ?? biomeGroup,
          dropoffs,
        };
      })
      .sort((a, b) => b.dropoffs - a.dropoffs),
    nodeVisitHeatmap: buildNodeHeatmap(nodeVisitEvents, nodeVisitAccounts),
  };
}

function buildNodeHeatmap(
  eventsByNode: Map<string, number>,
  accountsByNode: Map<string, Set<string>>,
): AdminAnalyticsNodeHeatmapRow[] {
  return Object.entries(NODE_BIOMES)
    .map(([nodeId, info]) => {
      const biome = BIOME_DATABASE.get(info.biomeGroup);
      return {
        nodeId,
        biomeGroup: info.biomeGroup,
        biomeName: biome?.name ?? info.biomeGroup,
        biomeTier: info.biomeTier,
        isDungeon: info.isDungeon === true,
        accounts: accountsByNode.get(nodeId)?.size ?? 0,
        events: eventsByNode.get(nodeId) ?? 0,
      };
    })
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId));
}

function addSankeyEdges(
  row: AnalyticsRow,
  nodeNames: Set<string>,
  edgeActors: Map<string, Set<string>>,
): void {
  const path = Array.isArray(row.meta?.path)
    ? row.meta.path.filter((part): part is string => typeof part === 'string' && part.length > 0)
    : fallbackSkillPath(row);
  if (path.length < 2) return;
  const actor = row.accountId ?? row.playerId ?? `event:${row.id}`;
  for (const label of path) nodeNames.add(label);
  for (let i = 0; i < path.length - 1; i++) {
    const key = `${path[i]}\u0000${path[i + 1]}`;
    let actors = edgeActors.get(key);
    if (!actors) {
      actors = new Set<string>();
      edgeActors.set(key, actors);
    }
    actors.add(actor);
  }
}

function fallbackSkillPath(row: AnalyticsRow): string[] {
  const skillId = typeof row.meta?.skillId === 'string' ? row.meta.skillId : null;
  if (!skillId) return [];
  const node = SKILL_TREE.get(skillId);
  return node ? [`T${node.tier}`, node.name] : [skillId];
}

function createDayBuckets(days: number, now: number): Map<string, AdminAnalyticsDailyBucket> {
  const start = startOfUtcDay(now - (days - 1) * MS_PER_DAY);
  const buckets = new Map<string, AdminAnalyticsDailyBucket>();
  for (let i = 0; i < days; i++) {
    const day = dayKey(start + i * MS_PER_DAY);
    buckets.set(day, {
      day,
      activeAccounts: 0,
      peakPlayers: 0,
      deaths: 0,
      progressionEvents: 0,
      dropoffs: 0,
    });
  }
  return buckets;
}

function dayKey(ts: number): string {
  return new Date(startOfUtcDay(ts)).toISOString().slice(0, 10);
}

function startOfUtcDay(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function clampDays(days: number | undefined): number {
  if (typeof days !== 'number' || !Number.isFinite(days)) return DEFAULT_ANALYTICS_DAYS;
  return Math.max(1, Math.min(MAX_ANALYTICS_DAYS, Math.floor(days)));
}

function increment(map: Map<string, number>, key: string, by: number): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
