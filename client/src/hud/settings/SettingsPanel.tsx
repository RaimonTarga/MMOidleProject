import { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { gamepadStatusAtom } from '../atoms';
import { DialogHeader, DialogTab, DialogTabs, GameDialog } from '../primitives';
import {
  sfxVolumeAtom,
  musicVolumeAtom,
  sfxMutedAtom,
  musicMutedAtom,
} from '../../audio/audioSettings';
import {
  setSfxVolume,
  setMusicVolume,
  setSfxMuted,
  setMusicMuted,
  playSfx,
} from '../../audio/audioEngine';
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
  applyUiFontScale,
  loadGameplaySettings,
  saveGameplaySettings,
  UI_FONT_SCALE_MAX,
  UI_FONT_SCALE_MIN,
  UI_FONT_SCALE_STEP,
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
import { accountSummaryAtom } from '../../auth/lobbyState';
import { linkDiscord } from '../../net/session';
import '../hud.css';
import './settings.css';

type SettingsTab = 'controls' | 'gameplay' | 'audio';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const [tab, setTab] = useState<SettingsTab>('controls');
  const account = useAtomValue(accountSummaryAtom);
  const [linkingDiscord, setLinkingDiscord] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [bindings, setBindings] = useAtom(keybindsAtom);
  const [capture, setCapture] = useAtom(captureModeAtom);
  const padStatus = useAtomValue(gamepadStatusAtom);
  const sfxVolume = useAtomValue(sfxVolumeAtom);
  const musicVolume = useAtomValue(musicVolumeAtom);
  const sfxMuted = useAtomValue(sfxMutedAtom);
  const musicMuted = useAtomValue(musicMutedAtom);
  const [autoTraverseEnabled, setAutoTraverseEnabled] = useState(
    () => loadGameplaySettings().autoTraverseEnabled,
  );
  const [deathNotificationsEnabled, setDeathNotificationsEnabled] = useState(
    () => loadGameplaySettings().deathNotificationsEnabled,
  );
  const [intentBubblesEnabled, setIntentBubblesEnabled] = useState(
    () => loadGameplaySettings().intentBubblesEnabled,
  );
  const [uiFontScale, setUiFontScale] = useState(
    () => loadGameplaySettings().uiFontScale,
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

  function handleClose(): void {
    setCapture(null);
    onClose();
  }

  function handleEscape(): boolean {
    if (!capture) return false;
    setCapture(null);
    return true;
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

  function handleIntentBubblesToggle(enabled: boolean): void {
    setIntentBubblesEnabled(enabled);
    saveGameplaySettings({ intentBubblesEnabled: enabled });
  }

  function handleUiFontScaleChange(scale: number): void {
    const next = saveGameplaySettings({ uiFontScale: scale }).uiFontScale;
    setUiFontScale(next);
    applyUiFontScale(next);
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

  async function handleDiscordLink(): Promise<void> {
    setLinkingDiscord(true);
    setLinkError(null);
    try {
      await linkDiscord();
    } catch (err) {
      setLinkingDiscord(false);
      setLinkError(err instanceof Error ? err.message : 'Unable to link Discord.');
    }
  }

  return (
    <GameDialog size="standard" className="settings-dialog" onClose={handleClose} onEscape={handleEscape}>
      <DialogHeader title="Settings" closeLabel="Close settings" />

      {account?.isGuest && (
        <div className="settings-guest-account">
          <div>
            <strong>{account.displayName}</strong>
            <span>Guest progress lives in this browser. Link Discord to protect it.</span>
            {linkError && <span className="settings-guest-account__error">{linkError}</span>}
          </div>
          <button
            type="button"
            className="settings-discord-link"
            onClick={() => void handleDiscordLink()}
            disabled={linkingDiscord}
          >
            <img src="/discord-symbol.svg" alt="" width="20" height="15" />
            {linkingDiscord ? 'Opening…' : 'Link Discord'}
          </button>
        </div>
      )}

      <DialogTabs label="Settings sections">
        <DialogTab selected={tab === 'controls'} controls="settings-panel-controls" onSelect={() => setTab('controls')}>
          Controls
        </DialogTab>
        <DialogTab selected={tab === 'gameplay'} controls="settings-panel-gameplay" onSelect={() => setTab('gameplay')}>
          Gameplay
        </DialogTab>
        <DialogTab selected={tab === 'audio'} controls="settings-panel-audio" onSelect={() => setTab('audio')}>
          Audio
        </DialogTab>
      </DialogTabs>

      <div id={`settings-panel-${tab}`} className="settings-body" role="tabpanel">
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
                checked={intentBubblesEnabled}
                onChange={(e) => handleIntentBubblesToggle(e.target.checked)}
              />
              <span>Show intent bubble over characters</span>
            </label>
            <p className="settings-help">
              A thought bubble above each character telegraphing their current auto
              action — the monster they're hunting, where they're travelling, who
              they're following. Emotes always show.
            </p>

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

            <label className="settings-slider-row">
              <span>UI font scale</span>
              <input
                type="range"
                min={UI_FONT_SCALE_MIN}
                max={UI_FONT_SCALE_MAX}
                step={UI_FONT_SCALE_STEP}
                value={uiFontScale}
                onChange={(e) => handleUiFontScaleChange(Number(e.target.value))}
              />
              <span className="settings-slider-value">
                {Math.round(uiFontScale * 100)}%
              </span>
            </label>
            <p className="settings-help">
              Adjusts the size of HUD and menu text on this device.
            </p>
            <button
              type="button"
              className="auto-btn settings-reset"
              onClick={() => handleUiFontScaleChange(1)}
              disabled={uiFontScale === 1}
            >
              RESET UI FONT SCALE
            </button>

            <button
              type="button"
              className="auto-btn settings-reset"
              onClick={() => void sendTestDeathNotification()}
              disabled={!deathNotificationsOn}
            >
              SEND TEST NOTIFICATION
            </button>

            <div className="settings-session-actions">
              <div>
                <strong>Character</strong>
                <p className="settings-help">
                  Save your progress and return to character select.
                </p>
              </div>
              <button
                type="button"
                className="auto-btn settings-reset"
                onClick={() => window.location.reload()}
              >
                SWITCH CHARACTER
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-gameplay">
            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={!sfxMuted}
                onChange={(e) => setSfxMuted(!e.target.checked)}
              />
              <span>Sound effects</span>
            </label>
            <label className="settings-slider-row">
              <span>SFX volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sfxVolume}
                disabled={sfxMuted}
                onChange={(e) => setSfxVolume(Number(e.target.value))}
                onMouseUp={() => playSfx('attack-melee')}
              />
              <span className="settings-slider-value">
                {Math.round(sfxVolume * 100)}%
              </span>
            </label>
            <p className="settings-help">
              Combat cues — attacks, taking damage, kills. Release the slider to preview.
            </p>

            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={!musicMuted}
                onChange={(e) => setMusicMuted(!e.target.checked)}
              />
              <span>Background music</span>
            </label>
            <label className="settings-slider-row">
              <span>Music volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={musicVolume}
                disabled={musicMuted}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
              />
              <span className="settings-slider-value">
                {Math.round(musicVolume * 100)}%
              </span>
            </label>
            <p className="settings-help">
              Ambient track for the area you're in. Changes take effect immediately.
            </p>
          </div>
        )}
      </div>
    </GameDialog>
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
