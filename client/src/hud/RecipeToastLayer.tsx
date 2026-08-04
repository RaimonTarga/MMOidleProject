import { useState, useEffect } from 'react';
import { hudBus } from '../hudBus';
import { takeSessionNotice } from '../net/session';

interface Toast {
  id: number;
  name: string;
  biomeGroup: string;
  dying: boolean;
}

const DISPLAY_MS  = 5000;
const FADEOUT_MS  = 600;

let nextId = 0;

export function RecipeToastLayer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sessionNotice, setSessionNotice] = useState(takeSessionNotice);

  useEffect(() => {
    if (!sessionNotice) return;
    const timeout = window.setTimeout(() => setSessionNotice(null), DISPLAY_MS);
    return () => window.clearTimeout(timeout);
  }, [sessionNotice]);

  useEffect(() => hudBus.subscribeRecipeUnlock((name, biomeGroup) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, name, biomeGroup, dying: false }]);

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, dying: true } : t));
    }, DISPLAY_MS);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, DISPLAY_MS + FADEOUT_MS);
  }), []);

  if (toasts.length === 0 && !sessionNotice) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      pointerEvents: 'none',
      zIndex: 70010,
    }}>
      {sessionNotice && (
        <div style={{
          background: 'rgba(20, 20, 35, 0.96)',
          border: `1px solid ${sessionNotice.tone === 'success' ? '#44ff88' : '#ef7668'}`,
          borderRadius: 7,
          padding: '10px 18px',
          color: '#e0e0e0',
          fontFamily: 'monospace',
          fontSize: 14,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 16px rgba(0,0,0,0.7)',
        }}>
          <span style={{
            color: sessionNotice.tone === 'success' ? '#44ff88' : '#ef7668',
            marginRight: 8,
          }}>✦</span>
          <span>{sessionNotice.message}</span>
        </div>
      )}
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: 'rgba(20, 20, 35, 0.94)',
            border: '1px solid #44ff88',
            borderRadius: 7,
            padding: '9px 18px',
            color: '#e0e0e0',
            fontFamily: 'monospace',
            fontSize: 15,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 16px rgba(0,0,0,0.7)',
            opacity: t.dying ? 0 : 1,
            transform: t.dying ? 'translateY(-8px)' : 'translateY(0)',
            transition: `opacity ${FADEOUT_MS}ms ease, transform ${FADEOUT_MS}ms ease`,
          }}
        >
          <span style={{ color: '#44ff88', marginRight: 8 }}>✦</span>
          <span style={{ color: '#aaaacc', marginRight: 6, textTransform: 'capitalize' }}>
            {t.biomeGroup}
          </span>
          <span>{t.name} unlocked</span>
        </div>
      ))}
    </div>
  );
}
