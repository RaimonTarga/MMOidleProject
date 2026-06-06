import { bigint, index, jsonb, pgTable, text } from 'drizzle-orm/pg-core';

export const logs = pgTable(
  'logs',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    ts: bigint('ts', { mode: 'number' }).notNull(),
    level: text('level').notNull(),
    logger: text('logger').notNull(),
    message: text('message').notNull(),
    playerId: text('player_id'),
    accountId: text('account_id'),
    nodeId: text('node_id'),
    action: text('action'),
    meta: jsonb('meta_json').$type<Record<string, unknown> | null>(),
  },
  (table) => ({
    tsIdx: index('logs_ts_idx').on(table.ts),
    levelTsIdx: index('logs_level_ts_idx').on(table.level, table.ts),
    playerTsIdx: index('logs_player_ts_idx').on(table.playerId, table.ts),
    accountTsIdx: index('logs_account_ts_idx').on(table.accountId, table.ts),
    nodeTsIdx: index('logs_node_ts_idx').on(table.nodeId, table.ts),
  }),
);

export const worldLogEntries = pgTable(
  'world_log_entries',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    ts: bigint('ts', { mode: 'number' }).notNull(),
    tick: bigint('tick', { mode: 'number' }).notNull(),
    kind: text('kind').notNull(),
    nodeId: text('node_id').notNull(),
    viewerId: text('viewer_id').notNull(),
    viewerAccountId: text('viewer_account_id'),
    viewerName: text('viewer_name').notNull(),
    event: jsonb('event_json').$type<Record<string, unknown>>().notNull(),
  },
  (table) => ({
    tsIdx: index('world_log_entries_ts_idx').on(table.ts),
    viewerTsIdx: index('world_log_entries_viewer_ts_idx').on(table.viewerId, table.ts),
    viewerAccountTsIdx: index('world_log_entries_viewer_account_ts_idx').on(table.viewerAccountId, table.ts),
    nodeTsIdx: index('world_log_entries_node_ts_idx').on(table.nodeId, table.ts),
  }),
);

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    ts: bigint('ts', { mode: 'number' }).notNull(),
    gameVersion: text('game_version').notNull(),
    accountId: text('account_id'),
    playerId: text('player_id'),
    nodeId: text('node_id'),
    kind: text('kind').notNull(),
    value: bigint('value', { mode: 'number' }),
    meta: jsonb('meta_json').$type<Record<string, unknown> | null>(),
  },
  (table) => ({
    tsIdx: index('analytics_events_ts_idx').on(table.ts),
    versionTsIdx: index('analytics_events_game_version_ts_idx').on(table.gameVersion, table.ts),
    kindTsIdx: index('analytics_events_kind_ts_idx').on(table.kind, table.ts),
    nodeTsIdx: index('analytics_events_node_ts_idx').on(table.nodeId, table.ts),
    accountTsIdx: index('analytics_events_account_ts_idx').on(table.accountId, table.ts),
  }),
);
