import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  buildVoidOverlordAtlasFrames,
  formatDeathCauseLabel,
  formatDeathLocation,
  resolveVoidOverlordBossFrameName,
  resolveVoidOverlordMinionFrameName,
  resolveMonsterFrame,
  shouldUseVoidOverlordSheet,
  VOID_OVERLORD_DISPLAY,
  VOID_OVERLORD_MINION_ROW_H,
  VOID_OVERLORD_MINION_ROWS,
  VOID_OVERLORD_MINION_Y0,
  VOID_OVERLORD_SHEET_W,
  type DeathKiller,
} from '@mmo-idle/shared';
import { AtlasSprite } from '../ui/AtlasSprite';
import { clearDeathOverlay, deathOverlayAtom } from './atoms';
import './deathOverlay.css';

const AUTO_MS = 600_000;
const VOID_OVERLORD_SHEET_FILE = '/assets/ultimate_bosses/void_overlord.png';
const VOID_OVERLORD_SHEET_H = VOID_OVERLORD_MINION_Y0 + VOID_OVERLORD_MINION_ROWS * VOID_OVERLORD_MINION_ROW_H;
const VOID_OVERLORD_FRAMES = new Map(
  buildVoidOverlordAtlasFrames().map((entry) => [entry.filename, entry.frame]),
);

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function getKiller(payload: NonNullable<ReturnType<typeof useAtomValue<typeof deathOverlayAtom>>['payload']>): DeathKiller | null {
  const { cause } = payload;
  if (cause.kind === 'stance') return null;
  if (cause.kind === 'debt') return cause.killer ?? null;
  return cause.killer;
}

function getDamage(payload: NonNullable<ReturnType<typeof useAtomValue<typeof deathOverlayAtom>>['payload']>): number {
  return payload.cause.damage;
}

function resolveVoidOverlordDeathFrame(killer: DeathKiller): string | null {
  if (killer.monsterTypeId === 'void-overlord') {
    return resolveVoidOverlordBossFrameName();
  }
  if (!shouldUseVoidOverlordSheet(killer.monsterTypeId)) {
    return null;
  }
  return resolveVoidOverlordMinionFrameName(
    killer.monsterTypeId,
    killer.monsterEntityId ?? killer.monsterTypeId,
  );
}

function VoidOverlordDeathSprite({
  killer,
  scale,
}: {
  killer: DeathKiller;
  scale: number;
}) {
  const frameName = resolveVoidOverlordDeathFrame(killer);
  const rect = frameName ? VOID_OVERLORD_FRAMES.get(frameName) : null;
  if (!rect) {
    return (
      <AtlasSprite
        frameName={resolveMonsterFrame(killer.monsterTypeId)}
        scale={scale}
        fallbackInitial={killer.monsterName}
      />
    );
  }

  const display = VOID_OVERLORD_DISPLAY[killer.monsterTypeId] ?? {
    displayW: rect.w,
    displayH: rect.h,
  };
  const width = display.displayW * scale;
  const height = display.displayH * scale;
  const scaleX = width / rect.w;
  const scaleY = height / rect.h;

  return (
    <div
      className="death-card__void-sprite"
      style={{
        width,
        height,
        backgroundImage: `url(${VOID_OVERLORD_SHEET_FILE})`,
        backgroundSize: `${VOID_OVERLORD_SHEET_W * scaleX}px ${VOID_OVERLORD_SHEET_H * scaleY}px`,
        backgroundPosition: `-${rect.x * scaleX}px -${rect.y * scaleY}px`,
      }}
    />
  );
}

function KillerSprite({ killer }: { killer: DeathKiller | null }) {
  if (!killer) {
    return <AtlasSprite frameName={null} fallbackInitial="?" />;
  }

  const isVoidOverlordSheetKiller =
    killer.monsterTypeId === 'void-overlord' ||
    shouldUseVoidOverlordSheet(killer.monsterTypeId);
  const scale = killer.isBoss ? 0.35 : 1.5;

  if (isVoidOverlordSheetKiller) {
    return <VoidOverlordDeathSprite killer={killer} scale={scale} />;
  }

  return (
    <AtlasSprite
      frameName={resolveMonsterFrame(killer.monsterTypeId)}
      scale={killer.isBoss ? 1.25 : 1.5}
      fallbackInitial={killer.monsterName}
    />
  );
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
  const causeLabel = formatDeathCauseLabel(payload.cause);

  return (
    <div className="death-overlay" role="alert" aria-live="assertive">
      <div className="death-card">
        <div className={`death-card__sprite${killer?.isBoss ? ' death-card__sprite--boss' : ''}`}>
          <KillerSprite killer={killer} />
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
