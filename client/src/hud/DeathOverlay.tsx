import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  formatDeathCauseLabel,
  formatDeathLocation,
  resolveMonsterFrame,
  type DeathKiller,
} from '@mmo-idle/shared';
import { AtlasSprite } from '../ui/AtlasSprite';
import { clearDeathOverlay, deathOverlayAtom } from './atoms';
import './deathOverlay.css';

const AUTO_MS = 600_000;

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function getKiller(payload: NonNullable<ReturnType<typeof useAtomValue<typeof deathOverlayAtom>>['payload']>): DeathKiller | null {
  const { cause } = payload;
  if (cause.kind === 'debt') return cause.killer ?? null;
  return cause.killer;
}

function getDamage(payload: NonNullable<ReturnType<typeof useAtomValue<typeof deathOverlayAtom>>['payload']>): number {
  return payload.cause.damage;
}

export function DeathOverlay() {
  const { active, payload, startedAt } = useAtomValue(deathOverlayAtom);
  const [progressPct, setProgressPct] = useState(100);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active || !startedAt) return;

    setProgressPct(100);
    setElapsedMs(0);
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setElapsedMs(elapsed);
      const remaining = Math.max(0, 1 - elapsed / AUTO_MS);
      setProgressPct(Math.round(remaining * 100));
    }, 100);

    const timeout = window.setTimeout(() => clearDeathOverlay(), AUTO_MS);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timeout);
    };
  }, [active, startedAt]);

  if (!active || !payload) return null;

  const killer = getKiller(payload);
  const locationLabel = formatDeathLocation(payload.diedAtNodeId);

  const frameName = killer ? resolveMonsterFrame(killer.monsterTypeId) : null;
  const spriteScale = killer?.isBoss ? 1.25 : 1.5;
  const causeLabel = formatDeathCauseLabel(payload.cause);

  return (
    <div className="death-overlay" role="alert" aria-live="assertive">
      <div className="death-card">
        <div className={`death-card__sprite${killer?.isBoss ? ' death-card__sprite--boss' : ''}`}>
          <AtlasSprite
            frameName={frameName}
            scale={spriteScale}
            fallbackInitial={killer?.monsterName ?? '?'}
          />
        </div>

        <div className="death-card__header">✗ Defeated</div>
        <div className="death-card__divider" />

        <div className="death-card__body">
          <section>
            <div className="death-card__section-label">Killed by</div>
            <div className="death-card__killer-name">
              {killer?.monsterName ?? 'Unknown'}
            </div>
            <div className="death-card__killer-cause">via {causeLabel}</div>
            {killer?.isBoss && (
              <span className="death-card__boss-badge">★ BOSS</span>
            )}
          </section>

          <section>
            <div className="death-card__section-label">Details</div>
            <div className="death-card__detail-line">Where: {locationLabel}</div>
            <div className="death-card__detail-line">Final blow: {getDamage(payload)} damage</div>
          </section>
        </div>

        <div className="death-card__footer">
          <div className="death-card__footer-top">
            <span className="death-card__respawn-label">
              Press RESPAWN to return to the Clearing
            </span>
            <span
              className="death-card__timer"
              aria-live="polite"
              aria-label={`Time on death screen: ${formatClock(elapsedMs)} of ${formatClock(AUTO_MS)}`}
            >
              {formatClock(elapsedMs)} / {formatClock(AUTO_MS)}
            </span>
          </div>
          <div
            className="death-card__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={AUTO_MS}
            aria-valuenow={elapsedMs}
            aria-label="Auto-respawn countdown"
          >
            <div
              className="death-card__progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <button
            type="button"
            className="death-card__continue"
            onClick={() => clearDeathOverlay()}
          >
            RESPAWN
          </button>
        </div>
      </div>
    </div>
  );
}
