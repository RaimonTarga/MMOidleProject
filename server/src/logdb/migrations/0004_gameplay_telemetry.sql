CREATE TABLE gameplay_events (
  id text PRIMARY KEY,
  ts bigint NOT NULL,
  game_version text NOT NULL,
  character_id text NOT NULL,
  session_id text NOT NULL,
  cohort text NOT NULL CHECK (cohort IN ('human', 'test')),
  node_id text NOT NULL,
  class_id text NOT NULL,
  tier integer NOT NULL,
  kind text NOT NULL,
  event jsonb NOT NULL
);
CREATE INDEX gameplay_events_ts_idx ON gameplay_events(ts);
CREATE INDEX gameplay_events_query_idx ON gameplay_events(cohort, game_version, ts);
CREATE INDEX gameplay_events_character_idx ON gameplay_events(character_id, ts);
CREATE TABLE gameplay_daily (
  day date NOT NULL,
  game_version text NOT NULL,
  cohort text NOT NULL CHECK (cohort IN ('human', 'test')),
  node_id text NOT NULL,
  class_id text NOT NULL,
  tier integer NOT NULL,
  metric text NOT NULL,
  dimension text NOT NULL,
  count bigint NOT NULL,
  value double precision NOT NULL,
  PRIMARY KEY (day, game_version, cohort, node_id, class_id, tier, metric, dimension)
);
