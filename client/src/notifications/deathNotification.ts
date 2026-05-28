import {
  loadGameplaySettings,
  saveGameplaySettings,
} from '../settings/gameplaySettings';

export function canUseNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  return canUseNotifications() ? Notification.permission : 'denied';
}

export async function requestDeathNotificationPermission(): Promise<NotificationPermission> {
  if (!canUseNotifications()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function isDeathNotificationEffectivelyOn(
  enabled: boolean,
  permission: NotificationPermission,
): boolean {
  return enabled && permission === 'granted';
}

/**
 * Audio + title flash are the OS-suppression workarounds. macOS Notification
 * Center may silently absorb Notification API banners; these attention layers
 * still surface via the browser/dock to interrupt the AFK player who
 * explicitly opted in.
 */

let audioContext: AudioContext | null = null;

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getOrCreateAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioContext = new Ctor();
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Must be called from a user-gesture handler (Settings toggle click). Creating
 * the AudioContext during a gesture unlocks later programmatic playback in
 * Safari and Chrome autoplay policies.
 */
export function primeNotificationAudio(): void {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function playDeathChime(): void {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  function tone(freq: number, start: number, duration: number, volume: number): void {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.connect(gain);
    gain.connect(ctx!.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.start(start);
    osc.stop(start + duration);
  }

  tone(523.25, now, 0.22, 0.18);
  tone(392.0, now + 0.18, 0.32, 0.18);
  tone(311.13, now + 0.42, 0.48, 0.2);
}

let titleFlash: {
  intervalId: number;
  originalTitle: string;
  onVisibilityChange: () => void;
} | null = null;

function startTitleFlash(message: string): void {
  if (typeof document === 'undefined') return;
  if (titleFlash) return;

  const original = document.title;
  let showAlert = true;

  function tick(): void {
    document.title = showAlert ? message : original;
    showAlert = !showAlert;
  }

  function onVisibilityChange(): void {
    if (!document.hidden) stopTitleFlash();
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  tick();
  const intervalId = window.setInterval(tick, 900);
  titleFlash = { intervalId, originalTitle: original, onVisibilityChange };
}

function stopTitleFlash(): void {
  if (!titleFlash) return;
  window.clearInterval(titleFlash.intervalId);
  document.removeEventListener('visibilitychange', titleFlash.onVisibilityChange);
  document.title = titleFlash.originalTitle;
  titleFlash = null;
}

function canUseServiceWorkerNotifications(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'showNotification' in ServiceWorkerRegistration.prototype
  );
}

async function showNotificationViaServiceWorker(
  title: string,
  body: string,
  tag: string,
): Promise<boolean> {
  if (!canUseServiceWorkerNotifications()) return false;

  try {
    const registration = await navigator.serviceWorker.register(
      '/death-notification-sw.js',
    );
    await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      tag,
      requireInteraction: true,
    });
    return true;
  } catch {
    return false;
  }
}

function showNotificationViaConstructor(
  title: string,
  body: string,
  tag: string,
): void {
  try {
    new Notification(title, {
      body,
      tag,
      requireInteraction: true,
    });
  } catch {
    // Constructor unavailable or threw; audio + title flash still surface.
  }
}

/** If user had enabled but browser permission was revoked, persist off. */
export function syncDeathNotificationPreference(): boolean {
  const settings = loadGameplaySettings();
  if (!settings.deathNotificationsEnabled) return false;
  if (getNotificationPermission() === 'granted') return true;
  saveGameplaySettings({ deathNotificationsEnabled: false });
  return false;
}

export function maybeNotifyDeath(): void {
  const settings = loadGameplaySettings();
  if (!settings.deathNotificationsEnabled) return;
  if (!canUseNotifications()) return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return;

  const tag = `player-death-${Date.now()}`;
  void showNotificationViaServiceWorker(
    'You were defeated',
    'Return to the game to re-engage.',
    tag,
  ).then((shown) => {
    if (shown) return;
    showNotificationViaConstructor(
      'You were defeated',
      'Return to the game to re-engage.',
      tag,
    );
  });

  playDeathChime();
  startTitleFlash('[!] You died');
}

/**
 * Fires a notification immediately for verification from the Settings panel,
 * bypassing the AFK (document.hidden) guard so the user can confirm the
 * audio + notification chain works while the tab is focused.
 */
export async function sendTestDeathNotification(): Promise<void> {
  if (!canUseNotifications()) return;
  if (Notification.permission !== 'granted') return;

  const tag = `player-death-test-${Date.now()}`;
  const shown = await showNotificationViaServiceWorker(
    'Test notification',
    'If you see this, death notifications will work.',
    tag,
  );
  if (!shown) {
    showNotificationViaConstructor(
      'Test notification',
      'If you see this, death notifications will work.',
      tag,
    );
  }

  playDeathChime();
}
