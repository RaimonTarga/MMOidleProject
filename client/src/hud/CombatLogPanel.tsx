import { useState, useEffect, useRef } from 'react';
import { combatLog } from '../combatLog';
import type { LogEntry, LogKind } from '../combatLog';
import { DamageLogRow, detailStatColor } from './DamageLogRow';
import { LogHeadline } from './LogHeadline';
import { ALLY_COLOR, NEUTRAL_COLOR } from './logColors';

const KIND_PFX: Record<LogKind, string> = {
  'damage-out': '⚔',
  'damage-in': '⛨',
  buff: '◆',
  heal: '♥',
  shield: '◈',
  kill: '✓',
  death: '✗',
  dodge: '↷',
  'biome-level': '▲',
  ascension: '★',
  empowered: '⚡',
  execution: '⚡',
  info: '·',
};

function fmtTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function splitBuffDetail(detail: string): string[] {
  return detail
    .split(/\s{3,}|,\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function renderDetail(entry: LogEntry): React.ReactNode {
  if (
    entry.mitigation &&
    (entry.kind === 'damage-out' || entry.kind === 'damage-in')
  ) {
    return (
      <DamageLogRow
        mitigation={entry.mitigation}
        direction={entry.kind === 'damage-in' ? 'in' : 'out'}
        damageType={entry.damageType}
      />
    );
  }
  if (entry.detail) {
    const color =
      entry.kind === 'damage-out' || entry.kind === 'damage-in'
        ? detailStatColor(entry.kind)
        : entry.kind === 'heal' || entry.kind === 'shield' || entry.kind === 'kill'
          ? ALLY_COLOR
          : NEUTRAL_COLOR;
    if (entry.kind === 'buff') {
      return (
        <span className="combat-log__buff-detail" style={{ color }}>
          {splitBuffDetail(entry.detail).map((line, i) => (
            <span key={i} className="combat-log__buff-detail-line">
              {line}
            </span>
          ))}
        </span>
      );
    }
    return (
      <span className="combat-log__detail" style={{ color }}>
        {entry.detail}
      </span>
    );
  }
  return null;
}

/**
 * Verbosity tiers. Printing every event buried the things that actually change
 * a decision — a death, a kill, a level — under a per-hit damage stream, so the
 * log now defaults to the outcomes and lets the exchange detail be opted into.
 */
type LogVerbosity = 'key' | 'combat' | 'all';

const KEY_KINDS: ReadonlySet<LogKind> = new Set<LogKind>([
  'kill', 'death', 'biome-level', 'ascension', 'empowered', 'execution',
]);

const COMBAT_KINDS: ReadonlySet<LogKind> = new Set<LogKind>([
  ...KEY_KINDS,
  'damage-out', 'damage-in', 'dodge', 'heal', 'shield',
]);

const VERBOSITY_LABELS: { value: LogVerbosity; label: string; title: string }[] = [
  { value: 'key', label: 'Key', title: 'Kills, deaths and progression only' },
  { value: 'combat', label: 'Combat', title: 'Adds damage, dodges, heals and shields' },
  { value: 'all', label: 'All', title: 'Every event, including buffs and info' },
];

const VERBOSITY_STORAGE_KEY = 'mmo_idle.combat_log.verbosity';

function readVerbosity(): LogVerbosity {
  try {
    const stored = window.localStorage.getItem(VERBOSITY_STORAGE_KEY);
    if (stored === 'key' || stored === 'combat' || stored === 'all') return stored;
  } catch {
    // Fall through to the default when storage is unavailable.
  }
  return 'key';
}

function passesVerbosity(kind: LogKind, verbosity: LogVerbosity): boolean {
  if (verbosity === 'all') return true;
  return (verbosity === 'key' ? KEY_KINDS : COMBAT_KINDS).has(kind);
}

export function CombatLogPanel() {
  const [expanded, setExpanded] = useState(true);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [verbosity, setVerbosity] = useState<LogVerbosity>(readVerbosity);
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => combatLog.subscribe(setEntries), []);

  const visible = entries.filter((entry) => passesVerbosity(entry.kind, verbosity));

  function chooseVerbosity(next: LogVerbosity) {
    setVerbosity(next);
    setAutoScroll(true);
    try {
      window.localStorage.setItem(VERBOSITY_STORAGE_KEY, next);
    } catch {
      // A non-persisted preference is still usable for this session.
    }
  }

  useEffect(() => {
    if (autoScroll && expanded && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, autoScroll, expanded, verbosity]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
    setAutoScroll(atBottom);
  }

  return (
    <div className="combat-log">
      <button className="combat-log__header" onClick={() => setExpanded((e) => !e)}>
        <span className="combat-log__title">COMBAT LOG</span>
        <span className="combat-log__count">{visible.length}</span>
        <span className="combat-log__chevron">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="combat-log__filters" role="group" aria-label="Combat log detail">
          {VERBOSITY_LABELS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`combat-log__filter${verbosity === option.value ? ' combat-log__filter--active' : ''}`}
              aria-pressed={verbosity === option.value}
              title={option.title}
              onClick={() => chooseVerbosity(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <div className="combat-log__body" ref={listRef} onScroll={handleScroll}>
          {visible.length === 0 ? (
            <div className="combat-log__empty">
              {entries.length === 0 ? 'No events yet…' : 'Nothing at this detail level.'}
            </div>
          ) : (
            visible.map((e) => {
              const detail = renderDetail(e);
              return (
                <div key={e.id} className="combat-log__row">
                  <span className="combat-log__time">{fmtTime(e.time)}</span>
                  <div className="combat-log__entry">
                    <div className="combat-log__line1">
                      <span
                        className="combat-log__pfx"
                        style={{ color: NEUTRAL_COLOR }}
                      >
                        {KIND_PFX[e.kind]}
                      </span>
                      {e.headlineParts ? (
                        <LogHeadline parts={e.headlineParts} />
                      ) : (
                        <span
                          className="combat-log__headline"
                          style={{ color: NEUTRAL_COLOR }}
                        >
                          {e.headline ?? e.text}
                        </span>
                      )}
                    </div>
                    {detail && <div className="combat-log__line2">{detail}</div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
