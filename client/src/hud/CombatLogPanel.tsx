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

export function CombatLogPanel() {
  const [expanded, setExpanded] = useState(true);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => combatLog.subscribe(setEntries), []);

  useEffect(() => {
    if (autoScroll && expanded && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, autoScroll, expanded]);

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
        <span className="combat-log__count">{entries.length}</span>
        <span className="combat-log__chevron">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="combat-log__body" ref={listRef} onScroll={handleScroll}>
          {entries.length === 0 ? (
            <div className="combat-log__empty">No events yet…</div>
          ) : (
            entries.map((e) => {
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
