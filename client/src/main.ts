import Phaser from 'phaser';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { ITEM_DATABASE, registerDevItems } from '@mmo-idle/shared';
import { DEV_TOOLS_ENABLED } from './devTools';
import { isLandingOnlySession } from './net/session';
import { cinematicRenderFps } from './scenes/game/cinematic/mode';
import { GameScene } from './scenes/GameScene';
import { LeftSidebar } from './hud/HUD';
import { RightSidebar } from './hud/MenuButtons';
import { BuffBar } from './hud/BuffBar';
import { AbilityBar } from './hud/AbilityBar';
import { AutoCombatButton } from './hud/AutoCombatButton';
import { MobileHUD } from './hud/MobileHUD';
import { RecipeToastLayer } from './hud/RecipeToastLayer';
import { NodeLoadingOverlay } from './hud/NodeLoadingOverlay';
import { TabResyncOverlay } from './hud/TabResyncOverlay';
import { DeathOverlay } from './hud/DeathOverlay';
import { ReleaseAnnouncementOverlay } from './hud/ReleaseAnnouncementOverlay';
import { BiomeXpBar } from './hud/BiomeXpBar';
import { BossBar } from './hud/BossBar';
import { TargetFrame } from './hud/TargetFrame';
import { EmoteWheel } from './hud/EmoteWheel';
import { DungeonAltarOverlay } from './hud/DungeonAltarOverlay';
import { AuthGate } from './auth/AuthGate';
import { applyUiFontScale } from './settings/gameplaySettings';
import { installUiTierSync } from './hud/uiTier';
import { installUiUnlockSync } from './hud/uiUnlocks';
import './hud/tierApparatus.css';

if (DEV_TOOLS_ENABLED) {
  registerDevItems(ITEM_DATABASE);
}

applyUiFontScale();
installUiTierSync();
installUiUnlockSync();

function blockMouseHistoryButtons(event: Event) {
  if (!(event instanceof MouseEvent)) return;
  if (event.button !== 3 && event.button !== 4) return;
  event.preventDefault();
  event.stopPropagation();
}

for (const target of [window, document] as const) {
  target.addEventListener('mousedown', blockMouseHistoryButtons, { capture: true });
  target.addEventListener('mouseup', blockMouseHistoryButtons, { capture: true });
  target.addEventListener('auxclick', blockMouseHistoryButtons, { capture: true });
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  parent: 'game-wrapper',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { gamepad: true },
  scene: [GameScene],
  // A capture run renders at exactly the rate the recorder samples at. Left
  // free-running, the browser paints on its own cadence and the recorder's fixed
  // grid lands on whatever paint happened to be composited, which reads as
  // stutter no encoder setting can remove. Dev-only: null in every real session.
  ...(cinematicRenderFps() ? { fps: { limit: cinematicRenderFps()! } } : {}),
};

/**
 * PARKED 2026-09-05 — the landing page runs no game at all.
 *
 * A visitor with no credential used to boot the full Phaser scene so the live
 * spectator could open in a pane beside the login panel. That pane is disabled
 * (it rendered black; see docs/landing-cinematic-current-state.md, "PARKED: the
 * live spectator pane"), so booting the renderer for it is pure cost: it pulls
 * the whole game asset set over the same connections the landing video needs,
 * and takes a spectator slot to show nothing.
 *
 * Nothing on the landing page needs the game or the socket — "Play now" posts to
 * `/auth/guest` and reloads, and Discord login navigates away. Re-enabling the
 * pane means deleting this guard.
 */
const game = isLandingOnlySession() ? null : new Phaser.Game(config);

// Phaser's default behavior pauses the entire game loop on `window.blur`. That
// fires whenever the canvas loses keyboard focus — including when the user
// clicks any React HUD button outside the canvas (auto combat, inventory, map,
// etc.). When the loop pauses, stepInterpolation stops running so the player's
// rendered position freezes; once the canvas regains focus on the next click /
// keypress the loop resumes and the sprite snaps to its caught-up server
// target, producing visible rubber-banding. We only want the loop to pause on
// genuine tab visibility changes (handled separately in guard.ts), so detach
// the BLUR/FOCUS handlers Phaser auto-wires during boot.
game?.events.once(Phaser.Core.Events.READY, () => {
  game.events.off(Phaser.Core.Events.BLUR);
  game.events.off(Phaser.Core.Events.FOCUS);
});

createRoot(document.getElementById('left-sidebar')!).render(createElement(LeftSidebar));
createRoot(document.getElementById('right-sidebar')!).render(createElement(RightSidebar));
createRoot(document.getElementById('buff-overlay')!).render(createElement(BuffBar));
createRoot(document.getElementById('ability-overlay')!).render(createElement(AbilityBar));
createRoot(document.getElementById('auto-btn-overlay')!).render(createElement(AutoCombatButton));
createRoot(document.getElementById('mobile-hud')!).render(createElement(MobileHUD));
createRoot(document.getElementById('toast-overlay')!).render(createElement(RecipeToastLayer));
createRoot(document.getElementById('node-loading-overlay')!).render(createElement(NodeLoadingOverlay));
createRoot(document.getElementById('tab-resync-overlay')!).render(createElement(TabResyncOverlay));
createRoot(document.getElementById('death-overlay')!).render(createElement(DeathOverlay));
createRoot(document.getElementById('release-announcement-overlay')!).render(createElement(ReleaseAnnouncementOverlay));
createRoot(document.getElementById('biome-xp-overlay')!).render(createElement(BiomeXpBar));
createRoot(document.getElementById('boss-bar-overlay')!).render(createElement(BossBar));
createRoot(document.getElementById('target-frame-overlay')!).render(createElement(TargetFrame));
createRoot(document.getElementById('emote-wheel-overlay')!).render(createElement(EmoteWheel));
createRoot(document.getElementById('dungeon-altar-overlay')!).render(createElement(DungeonAltarOverlay));
createRoot(document.getElementById('auth-gate')!).render(createElement(AuthGate));
