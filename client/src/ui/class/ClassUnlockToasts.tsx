import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { classUnlockNotices, type ClassStateInput } from '@mmo-idle/shared';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  playerIdAtom,
} from '../../hud/atoms';
import { unlockNoticeTitle } from './format';

const DISPLAY_MS = 5000;
const FADEOUT_MS = 600;

interface UnlockToast {
  id: number;
  title: string;
  text: string;
  dying: boolean;
}

let nextToastId = 0;

/**
 * Toasts for a piece or trophy learned or ranked up. The first snapshot after
 * join, and the first snapshot of a different character, say nothing.
 */
export function ClassUnlockToasts() {
  const playerId = useAtomValue(playerIdAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const [toasts, setToasts] = useState<UnlockToast[]>([]);
  const previous = useRef<{ playerId: string; state: ClassStateInput } | null>(null);

  useEffect(() => {
    if (!playerId) {
      previous.current = null;
      return;
    }
    if (!combatArchetype) return;

    const state: ClassStateInput = {
      combatArchetype,
      biomeLevel,
      bossesCleared,
      disciplineId,
    };
    const prior = previous.current;
    previous.current = { playerId, state };
    if (!prior || prior.playerId !== playerId) return;

    const notices = classUnlockNotices(prior.state, state);
    for (const notice of notices) {
      const id = nextToastId++;
      setToasts((current) => [...current, {
        id,
        title: unlockNoticeTitle(notice),
        text: notice.text,
        dying: false,
      }]);
      window.setTimeout(() => {
        setToasts((current) => current.map((toast) => (
          toast.id === id ? { ...toast, dying: true } : toast
        )));
      }, DISPLAY_MS);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, DISPLAY_MS + FADEOUT_MS);
    }
  }, [playerId, combatArchetype, biomeLevel, bossesCleared, disciplineId]);

  if (toasts.length === 0) return null;

  return (
    <>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          style={{
            background: 'rgba(20, 20, 35, 0.94)',
            border: '1px solid #44ff88',
            borderRadius: 7,
            padding: '9px 18px',
            color: '#e0e0e0',
            fontFamily: 'monospace',
            fontSize: 15,
            maxWidth: 'min(440px, 88vw)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.7)',
            opacity: toast.dying ? 0 : 1,
            transform: toast.dying ? 'translateY(-8px)' : 'translateY(0)',
            transition: `opacity ${FADEOUT_MS}ms ease, transform ${FADEOUT_MS}ms ease`,
          }}
        >
          <div>
            <span style={{ color: '#44ff88', marginRight: 8 }}>✦</span>
            <span>{toast.title}</span>
          </div>
          <div style={{ color: '#aaaacc', fontSize: 12, marginTop: 4 }}>{toast.text}</div>
        </div>
      ))}
    </>
  );
}
