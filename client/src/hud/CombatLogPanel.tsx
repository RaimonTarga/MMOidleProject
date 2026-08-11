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
 * Categories, not a verbosity ladder.
 *
 * The log's failure mode is that buff/heal/shield chatter fires several times a
 * second and buries the lines a player actually reads — a kill, a death, a level.
 * A ladder could not fix that, because wanting the damage stream also meant
 * taking every buff tick with it. Three independent toggles let the chatter be
 * switched off without giving up the exchange.
 *
 * Deliberately three fixed buckets rather than a per-kind settings panel: this is
 * a legibility fix. Outcomes and Combat are on by default; Effects is off, which
 * is the whole point.
 */
type LogCategory = 'outcomes' | 'combat' | 'effects';

const CATEGORY_OF: Record<LogKind, LogCategory> = {
  kill: 'outcomes',
  death: 'outcomes',
  'biome-level': 'outcomes',
  ascension: 'outcomes',
  info: 'outcomes',
  'damage-out': 'combat',
  'damage-in': 'combat',
  dodge: 'combat',
  empowered: 'combat',
  execution: 'combat',
  buff: 'effects',
  heal: 'effects',
  shield: 'effects',
};

const CATEGORY_OPTIONS: { value: LogCategory; label: string; title: string }[] = [
  { value: 'outcomes', label: 'Outcomes', title: 'Kills, deaths, progression and world events' },
  { value: 'combat', label: 'Combat', title: 'Hits taken and dealt, dodges' },
  { value: 'effects', label: 'Effects', title: 'Buffs, debuffs, heals and shields' },
];

const DEFAULT_CATEGORIES: LogCategory[] = ['outcomes', 'combat'];

const CATEGORY_STORAGE_KEY = 'mmo_idle.combat_log.categories';
/** Superseded by CATEGORY_STORAGE_KEY; read once so an existing player's choice carries over. */
const LEGACY_VERBOSITY_KEY = 'mmo_idle.combat_log.verbosity';

function readCategories(): Set<LogCategory> {
  try {
    const stored = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (stored !== null) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((v): v is LogCategory =>
          v === 'outcomes' || v === 'combat' || v === 'effects');
        return new Set(valid);
      }
    }
    const legacy = window.localStorage.getItem(LEGACY_VERBOSITY_KEY);
    if (legacy === 'key') return new Set<LogCategory>(['outcomes']);
    if (legacy === 'combat') return new Set<LogCategory>(['outcomes', 'combat']);
    if (legacy === 'all') return new Set<LogCategory>(['outcomes', 'combat', 'effects']);
  } catch {
    // Fall through to the default when storage is unavailable.
  }
  return new Set(DEFAULT_CATEGORIES);
}

export function CombatLogPanel() {
  const [expanded, setExpanded] = useState(true);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [categories, setCategories] = useState<Set<LogCategory>>(readCategories);
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => combatLog.subscribe(setEntries), []);

  const visible = entries.filter((entry) => categories.has(CATEGORY_OF[entry.kind]));

  function toggleCategory(category: LogCategory) {
    const next = new Set(categories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setCategories(next);
    setAutoScroll(true);
    try {
      window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // A non-persisted preference is still usable for this session.
    }
  }

  useEffect(() => {
    if (autoScroll && expanded && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, autoScroll, expanded, categories]);

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
        <span className="combat-log__chevron">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="combat-log__filters" role="group" aria-label="Combat log categories">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`combat-log__filter${categories.has(option.value) ? ' combat-log__filter--active' : ''}`}
              aria-pressed={categories.has(option.value)}
              title={option.title}
              onClick={() => toggleCategory(option.value)}
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
              {entries.length === 0 ? 'No events yet…' : 'Nothing in the selected categories.'}
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
