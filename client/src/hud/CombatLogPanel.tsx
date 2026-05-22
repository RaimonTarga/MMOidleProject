import { useState, useEffect, useRef } from 'react';
import { combatLog } from '../combatLog';
import type { LogEntry, LogKind } from '../combatLog';

// ── Presentation maps ─────────────────────────────────────────────────────────

const KIND_COLOR: Record<LogKind, string> = {
  'damage-out': '#d0d0e8',
  'damage-in':  '#ff5555',
  'heal':       '#44ee88',
  'shield':     '#44ccdd',
  'kill':       '#ffcc44',
  'death':      '#ff2222',
  'empowered':  '#66ddff',
  'execution':  '#aabbff',
  'info':       '#444466',
};

const KIND_PFX: Record<LogKind, string> = {
  'damage-out': '→',
  'damage-in':  '←',
  'heal':       '♥',
  'shield':     '◈',
  'kill':       '✓',
  'death':      '✗',
  'empowered':  '⚡',
  'execution':  '⚡',
  'info':       '·',
};

function fmtTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CombatLogPanel() {
  const [expanded,   setExpanded]   = useState(true);
  const [entries,    setEntries]    = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => combatLog.subscribe(setEntries), []);

  // Scroll to bottom whenever new entries arrive, unless user has scrolled up.
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
      <button className="combat-log__header" onClick={() => setExpanded(e => !e)}>
        <span className="combat-log__title">COMBAT LOG</span>
        <span className="combat-log__count">{entries.length}</span>
        <span className="combat-log__chevron">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="combat-log__body" ref={listRef} onScroll={handleScroll}>
          {entries.length === 0
            ? <div className="combat-log__empty">No events yet…</div>
            : entries.map(e => (
                <div key={e.id} className="combat-log__row">
                  <span className="combat-log__time">{fmtTime(e.time)}</span>
                  <span className="combat-log__pfx" style={{ color: KIND_COLOR[e.kind] }}>
                    {KIND_PFX[e.kind]}
                  </span>
                  <span className="combat-log__msg" style={{ color: KIND_COLOR[e.kind] }}>
                    {e.text}
                  </span>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}
