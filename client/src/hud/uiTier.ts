import { getDefaultStore } from 'jotai';
import { playerIdAtom, playerTierAtom } from './atoms';

export const UI_TIER_MIN = 1;
export const UI_TIER_MAX = 8;

export type UiTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const UI_TIER_ACTIVATION_FALLBACK_MS = 1900;

function cssTimeMs(value: string, fallback: number): number {
  const match = /^([\d.]+)(ms|s)$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount)) return fallback;
  return match[2] === 's' ? amount * 1000 : amount;
}

/** Gameplay progression is zero-indexed (T1 = 0); presentation is T1-T8. */
export function uiTierFromPlayerTier(playerTier: number): UiTier {
  const finiteTier = Number.isFinite(playerTier) ? Math.trunc(playerTier) : 0;
  return Math.min(UI_TIER_MAX, Math.max(UI_TIER_MIN, finiteTier + 1)) as UiTier;
}

export function applyDocumentUiTier(playerTier: number): UiTier {
  const uiTier = uiTierFromPlayerTier(playerTier);
  document.documentElement.dataset.uiTier = String(uiTier);
  return uiTier;
}

/** Projects shared Jotai tier state onto the document for every React root. */
export function installUiTierSync(): () => void {
  const store = getDefaultStore();
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playerId = store.get(playerIdAtom);
  let previousTier = applyDocumentUiTier(store.get(playerTierAtom));
  let hydratingIdentity = false;
  let identityGeneration = 0;
  let activationTimer: number | null = null;

  const clearActivation = () => {
    if (activationTimer !== null) window.clearTimeout(activationTimer);
    activationTimer = null;
    delete root.dataset.uiTierActivating;
  };

  const beginActivation = (tier: UiTier) => {
    clearActivation();
    if (document.hidden || reducedMotion.matches) return;
    // Restart the CSS sequence even if dev tools advance more than one tier in
    // the same frame. This reflow occurs only on the rare tier-up path.
    void root.offsetWidth;
    root.dataset.uiTierActivating = String(tier);
    const duration = cssTimeMs(
      getComputedStyle(root).getPropertyValue('--hud-tier-activation-duration'),
      UI_TIER_ACTIVATION_FALLBACK_MS,
    );
    activationTimer = window.setTimeout(clearActivation, duration + 500);
  };

  const syncTier = () => {
    const nextTier = uiTierFromPlayerTier(store.get(playerTierAtom));
    const shouldActivate = !hydratingIdentity && playerId !== null && nextTier > previousTier;
    previousTier = applyDocumentUiTier(store.get(playerTierAtom));
    if (shouldActivate) beginActivation(nextTier);
  };

  const syncIdentity = () => {
    const nextPlayerId = store.get(playerIdAtom);
    if (nextPlayerId === playerId) return;
    playerId = nextPlayerId;
    hydratingIdentity = true;
    const generation = ++identityGeneration;
    clearActivation();
    queueMicrotask(() => {
      if (generation !== identityGeneration) return;
      previousTier = applyDocumentUiTier(store.get(playerTierAtom));
      hydratingIdentity = false;
    });
  };

  const syncVisibility = () => {
    root.toggleAttribute('data-ui-hidden', document.hidden);
    if (document.hidden) clearActivation();
  };

  const syncReducedMotion = () => {
    if (reducedMotion.matches) clearActivation();
  };

  syncVisibility();
  const unsubscribeTier = store.sub(playerTierAtom, syncTier);
  const unsubscribeIdentity = store.sub(playerIdAtom, syncIdentity);
  document.addEventListener('visibilitychange', syncVisibility);
  reducedMotion.addEventListener('change', syncReducedMotion);

  return () => {
    clearActivation();
    unsubscribeTier();
    unsubscribeIdentity();
    document.removeEventListener('visibilitychange', syncVisibility);
    reducedMotion.removeEventListener('change', syncReducedMotion);
    root.removeAttribute('data-ui-hidden');
  };
}

export function uiTierActivationIsActive(): boolean {
  return document.documentElement.dataset.uiTierActivating !== undefined;
}

export interface MinimapTierPalette {
  background: number;
  edge: number;
  innerEdge: number;
  backgroundAlpha: number;
}

let cachedMinimapTier = '';
let cachedMinimapPalette: MinimapTierPalette | null = null;

function cssColorToNumber(value: string, fallback: number): number {
  const normalized = value.trim();
  const shortHex = /^#([0-9a-f]{3})$/i.exec(normalized);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split('');
    return Number.parseInt(`${r}${r}${g}${g}${b}${b}`, 16);
  }
  const longHex = /^#([0-9a-f]{6})$/i.exec(normalized);
  return longHex ? Number.parseInt(longHex[1], 16) : fallback;
}

function cssNumber(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Reads the resolved tier tokens only when the document tier changes. */
export function resolvedMinimapTierPalette(): MinimapTierPalette {
  const root = document.documentElement;
  const tier = root.dataset.uiTier ?? '1';
  if (tier === cachedMinimapTier && cachedMinimapPalette) return cachedMinimapPalette;

  const style = getComputedStyle(root);
  cachedMinimapTier = tier;
  cachedMinimapPalette = {
    background: cssColorToNumber(style.getPropertyValue('--hud-minimap-bg'), 0x0a0a1a),
    edge: cssColorToNumber(style.getPropertyValue('--hud-minimap-edge'), 0x444466),
    innerEdge: cssColorToNumber(style.getPropertyValue('--hud-minimap-inner-edge'), 0x17130f),
    backgroundAlpha: Math.min(1, Math.max(0, cssNumber(style.getPropertyValue('--hud-minimap-bg-alpha'), 0.85))),
  };
  return cachedMinimapPalette;
}
