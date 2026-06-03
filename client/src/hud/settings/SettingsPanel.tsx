import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAtom, useAtomValue } from 'jotai';
import type { AutocombatConfig, AutocombatPriorityMode } from '@mmo-idle/shared';
import { gamepadStatusAtom } from '../atoms';
import {
  ACTION_LABELS,
  cloneBindings,
  codeToLabel,
  captureModeAtom,
  DEFAULT_BINDINGS,
  keybindsAtom,
  padButtonLabel,
  REBINDABLE_ACTIONS,
  saveBindings,
  type ActionId,
  type Bindings,
  type CaptureRequest,
} from '../../settings/keybinds';
import {
  loadGameplaySettings,
  saveGameplaySettings,
} from '../../settings/gameplaySettings';
import {
  canUseNotifications,
  getNotificationPermission,
  isDeathNotificationEffectivelyOn,
  primeNotificationAudio,
  requestDeathNotificationPermission,
  sendTestDeathNotification,
  syncDeathNotificationPreference,
} from '../../notifications/deathNotification';
import { hudBus } from '../../hudBus';
import { clearCaptureSink, setCaptureSink } from '../../input/gamepad';
import '../hud.css';
import '../../ui/inventory.css';
import './settings.css';

type SettingsTab = 'controls' | 'gameplay' | 'autocombat';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const [tab, setTab] = useState<SettingsTab>('controls');
  const [bindings, setBindings] = useAtom(keybindsAtom);
  const [capture, setCapture] = useAtom(captureModeAtom);
  const padStatus = useAtomValue(gamepadStatusAtom);
  const [autoTraverseEnabled, setAutoTraverseEnabled] = useState(
    () => loadGameplaySettings().autoTraverseEnabled,
  );
  const [autocombat, setAutocombat] = useState(
    () => loadGameplaySettings().autocombat,
  );
  const [deathNotificationsEnabled, setDeathNotificationsEnabled] = useState(
    () => loadGameplaySettings().deathNotificationsEnabled,
  );
  const [notificationPermission, setNotificationPermission] = useState(
    getNotificationPermission,
  );

  useEffect(() => {
    if (tab !== 'gameplay') return;
    const synced = syncDeathNotificationPreference();
    setDeathNotificationsEnabled(synced);
    setNotificationPermission(getNotificationPermission());
  }, [tab]);

  useEffect(() => {
    if (!capture || capture.device !== 'keyboard') return;
    const action = capture.action;

    function onCapture(event: KeyboardEvent): void {
      event.preventDefault();
      event.stopPropagation();
      if (event.code === 'Escape') {
        setCapture(null);
        return;
      }
      const next = cloneBindings(bindings);
      for (const a of REBINDABLE_ACTIONS) {
        if (next[a].key === event.code && a !== action) {
          next[a] = { ...next[a], key: '' };
        }
      }
      next[action] = { ...next[action], key: event.code };
      setBindings(next);
      saveBindings(next);
      setCapture(null);
    }

    window.addEventListener('keydown', onCapture, { capture: true });
    return () => {
      window.removeEventListener('keydown', onCapture, { capture: true });
    };
  }, [capture, bindings, setBindings, setCapture]);

  useEffect(() => {
    if (!capture || capture.device !== 'gamepad') {
      clearCaptureSink();
      return;
    }

    const action = capture.action;
    setCaptureSink((idx) => {
      const next = cloneBindings(bindings);
      for (const a of REBINDABLE_ACTIONS) {
        if (next[a].pad === idx && a !== action) {
          next[a] = { ...next[a], pad: null };
        }
      }
      next[action] = { ...next[action], pad: idx };
      setBindings(next);
      saveBindings(next);
      setCapture(null);
    });

    function onEsc(event: KeyboardEvent): void {
      if (event.code === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setCapture(null);
      }
    }

    window.addEventListener('keydown', onEsc, { capture: true });
    return () => {
      clearCaptureSink();
      window.removeEventListener('keydown', onEsc, { capture: true });
    };
  }, [capture, bindings, setBindings, setCapture]);

  function handleOverlayClick(e: React.MouseEvent): void {
    if (e.target === e.currentTarget) onClose();
  }

  function startCapture(action: ActionId, device: CaptureRequest['device']): void {
    setCapture({ action, device });
  }

  function clearKey(action: ActionId): void {
    const next = cloneBindings(bindings);
    next[action] = { ...next[action], key: '' };
    setBindings(next);
    saveBindings(next);
  }

  function clearPad(action: ActionId): void {
    const next = cloneBindings(bindings);
    next[action] = { ...next[action], pad: null };
    setBindings(next);
    saveBindings(next);
  }

  function resetAll(): void {
    const next = cloneBindings(DEFAULT_BINDINGS);
    setBindings(next);
    saveBindings(next);
    setCapture(null);
  }

  function handleAutoTraverseToggle(enabled: boolean): void {
    setAutoTraverseEnabled(enabled);
    saveGameplaySettings({ autoTraverseEnabled: enabled });
    hudBus.requestSetAutoTraverse(enabled);
  }

  function handleAutocombatPatch(patch: Partial<AutocombatConfig>): void {
    const next = { ...autocombat, ...patch };
    setAutocombat(next);
    saveGameplaySettings({ autocombat: next });
    hudBus.requestSetAutocombatConfig(next);
  }

  const deathNotificationsOn = isDeathNotificationEffectivelyOn(
    deathNotificationsEnabled,
    notificationPermission,
  );

  async function handleDeathNotificationsToggle(wantOn: boolean): Promise<void> {
    if (!wantOn) {
      setDeathNotificationsEnabled(false);
      saveGameplaySettings({ deathNotificationsEnabled: false });
      return;
    }

    if (!canUseNotifications()) return;

    primeNotificationAudio();

    const permission = await requestDeathNotificationPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      setDeathNotificationsEnabled(true);
      saveGameplaySettings({ deathNotificationsEnabled: true });
    } else {
      setDeathNotificationsEnabled(false);
      saveGameplaySettings({ deathNotificationsEnabled: false });
    }
  }

  return createPortal(
    <div className="inv-overlay" onClick={handleOverlayClick}>
      <div className="inv-panel settings-panel-wide" onClick={(e) => e.stopPropagation()}>
        <div className="inv-header">
          <span className="inv-title">Settings</span>
          <button type="button" className="inv-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-tabs">
          <button
            type="button"
            className={`settings-tab${tab === 'controls' ? ' settings-tab--active' : ''}`}
            onClick={() => setTab('controls')}
          >
            Controls
          </button>
          <button
            type="button"
            className={`settings-tab${tab === 'gameplay' ? ' settings-tab--active' : ''}`}
            onClick={() => setTab('gameplay')}
          >
            Gameplay
          </button>
          <button
            type="button"
            className={`settings-tab${tab === 'autocombat' ? ' settings-tab--active' : ''}`}
            onClick={() => setTab('autocombat')}
          >
            Autocombat
          </button>
        </div>

        {tab === 'controls' ? (
          <>
            <div
              className={`settings-status${padStatus ? ' settings-status--connected' : ''}`}
            >
              {padStatus
                ? `Controller: ${padStatus.id}`
                : 'No controller detected'}
            </div>

            {capture && (
              <div className="settings-capture-hint">
                {capture.device === 'keyboard'
                  ? 'Press a key (Esc to cancel)…'
                  : 'Press a button or pull a trigger (Esc to cancel)…'}
              </div>
            )}

            <table className="settings-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Keyboard</th>
                  <th>Controller</th>
                </tr>
              </thead>
              <tbody>
                {REBINDABLE_ACTIONS.map((action) => (
                  <BindingRow
                    key={action}
                    action={action}
                    bindings={bindings}
                    capture={capture}
                    onStartCapture={startCapture}
                    onClearKey={clearKey}
                    onClearPad={clearPad}
                  />
                ))}
              </tbody>
            </table>

            <div className="settings-footnotes">
              Left stick always moves. Esc / B close overlays (not rebindable).
            </div>

            <button type="button" className="auto-btn settings-reset" onClick={resetAll}>
              RESET TO DEFAULTS
            </button>
          </>
        ) : tab === 'gameplay' ? (
          <div className="settings-gameplay">
            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={deathNotificationsOn}
                onChange={(e) => void handleDeathNotificationsToggle(e.target.checked)}
                disabled={!canUseNotifications()}
              />
              <span>Notify when I die (tab in background)</span>
            </label>
            <p className="settings-help">
              When you die with the game tab in the background, plays a short chime,
              flashes the tab title, and shows a browser notification. Some operating
              systems silently suppress browser notification banners; the chime and
              title flash still surface through the tab/dock.
            </p>
            {notificationPermission === 'denied' && (
              <p className="settings-help settings-help--warning">
                Notifications are blocked in your browser settings for this site.
              </p>
            )}
            <button
              type="button"
              className="auto-btn settings-reset"
              onClick={() => void sendTestDeathNotification()}
              disabled={!deathNotificationsOn}
            >
              SEND TEST NOTIFICATION
            </button>
          </div>
        ) : (
          <div className="settings-gameplay">
            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={autoTraverseEnabled}
                onChange={(e) => handleAutoTraverseToggle(e.target.checked)}
              />
              <span>Auto-traverse when Auto Combat is on</span>
            </label>
            <p className="settings-help">
              Grinds the current biome until all recipes are unlocked, kills the boss last,
              then moves to the next biome. Re-visits a biome if your tier increases the level cap.
            </p>

            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={autocombat.engageUltimateBosses}
                onChange={(e) =>
                  handleAutocombatPatch({ engageUltimateBosses: e.target.checked })
                }
              />
              <span>Engage ultimate bosses automatically</span>
            </label>
            <p className="settings-help">
              When off, Auto Combat avoids waking dormant ultimate encounters. Turn this on
              when you want Auto Combat to intentionally start those fights.
            </p>

            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={autocombat.fleeWhenLow}
                onChange={(e) => handleAutocombatPatch({ fleeWhenLow: e.target.checked })}
              />
              <span>Flee when losing the fight</span>
            </label>
            <label className="settings-slider-row">
              <span>Flee HP: {Math.round(autocombat.fleeHpPct * 100)}%</span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={Math.round(autocombat.fleeHpPct * 100)}
                onChange={(e) =>
                  handleAutocombatPatch({ fleeHpPct: Number(e.target.value) / 100 })
                }
                disabled={!autocombat.fleeWhenLow}
              />
            </label>

            <label className="settings-field-row">
              <span>Priority mode</span>
              <select
                value={autocombat.priorityMode}
                onChange={(e) =>
                  handleAutocombatPatch({
                    priorityMode: e.target.value as AutocombatPriorityMode,
                  })
                }
              >
                <option value="balanced">Balanced</option>
                <option value="nearest">Nearest</option>
                <option value="damage">Damage</option>
                <option value="threat">Threat</option>
              </select>
            </label>

            <label className="settings-slider-row">
              <span>Acquire radius: {autocombat.acquireRadius >= 3200 ? 'Max' : `${autocombat.acquireRadius}px`}</span>
              <input
                type="range"
                min="120"
                max="3200"
                step="40"
                value={autocombat.acquireRadius}
                onChange={(e) =>
                  handleAutocombatPatch({ acquireRadius: Number(e.target.value) })
                }
              />
            </label>

            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={autocombat.focusLeaderTarget}
                onChange={(e) =>
                  handleAutocombatPatch({ focusLeaderTarget: e.target.checked })
                }
              />
              <span>Prefer party leader's target</span>
            </label>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function BindingRow({
  action,
  bindings,
  capture,
  onStartCapture,
  onClearKey,
  onClearPad,
}: {
  action: ActionId;
  bindings: Bindings;
  capture: CaptureRequest | null;
  onStartCapture: (action: ActionId, device: CaptureRequest['device']) => void;
  onClearKey: (action: ActionId) => void;
  onClearPad: (action: ActionId) => void;
}) {
  const b = bindings[action];
  const capturingKb =
    capture?.action === action && capture.device === 'keyboard';
  const capturingPad =
    capture?.action === action && capture.device === 'gamepad';

  return (
    <tr>
      <td className="settings-action-label">{ACTION_LABELS[action]}</td>
      <td>
        <div className="settings-bind-col">
          <span
            className={`settings-chip${capturingKb ? ' settings-chip--capturing' : ''}`}
          >
            {capturingKb ? '…' : codeToLabel(b.key)}
          </span>
          <button
            type="button"
            className="settings-btn-sm"
            onClick={() => onStartCapture(action, 'keyboard')}
          >
            Rebind
          </button>
          <button
            type="button"
            className="settings-btn-sm"
            onClick={() => onClearKey(action)}
          >
            Clear
          </button>
        </div>
      </td>
      <td>
        <div className="settings-bind-col">
          <span
            className={`settings-chip${capturingPad ? ' settings-chip--capturing' : ''}`}
          >
            {capturingPad ? '…' : b.pad !== null ? padButtonLabel(b.pad) : '—'}
          </span>
          <button
            type="button"
            className="settings-btn-sm"
            onClick={() => onStartCapture(action, 'gamepad')}
          >
            Rebind
          </button>
          <button
            type="button"
            className="settings-btn-sm"
            onClick={() => onClearPad(action)}
          >
            Clear
          </button>
        </div>
      </td>
    </tr>
  );
}
