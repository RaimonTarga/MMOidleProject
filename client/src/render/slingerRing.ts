import type { PlayerView } from '@mmo-idle/shared';
import { SLINGER_LAST_ROUND_CSS, cssHex, slingerClipColor } from '../ui/slingerClipColor';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';
import type { RenderState } from './state';

const LAST = cssHex(SLINGER_LAST_ROUND_CSS) ?? 0xf5c542;
const SPENT = 0x2a2a2a;
const ARC = 0xe6a43c;
const FALLBACK = 0x9aa3ad;

const rings = new Map<string, Phaser.GameObjects.Graphics>();

function showRing(player: PlayerView): boolean {
  return !player.isDead
    && player.classConfig?.system.kind === 'loadout'
    && player.ammoMax > 0;
}

/** Keep a graphics object for each Loadout Slinger. The draw runs every frame. */
export function syncSlingerRing(player: PlayerView, scene: GameScene): void {
  if (!showRing(player)) {
    destroySlingerRing(player.id);
    return;
  }
  if (rings.has(player.id)) return;
  rings.set(player.id, scene.add.graphics());
}

export function destroySlingerRing(id: string): void {
  const graphics = rings.get(id);
  if (!graphics) return;
  graphics.destroy();
  rings.delete(id);
}

/** The world ammo ring: clip colour, the last round gold, the next clip beside it, the reload arc. */
export function drawSlingerRings(state: RenderState): void {
  const now = Date.now();
  const gone: string[] = [];
  for (const [id, graphics] of rings) {
    const sprite = state.sprite.get(id);
    const snap = state.view.get(id);
    if (!sprite || !snap || state.kind.get(id) !== 'player' || !showRing(snap as PlayerView)) {
      gone.push(id);
      continue;
    }
    const player = snap as PlayerView;
    const clip = cssHex(slingerClipColor(player.reloadClip) ?? '') ?? FALLBACK;
    const next = cssHex(slingerClipColor(player.reloadNextClip) ?? '');
    const max = Math.max(1, player.ammoMax);
    const ammo = Math.max(0, Math.min(max, player.ammoCount));
    const reload = state.reloadTiming.get(id);
    let reloadPct: number | null = null;
    if (reload && reload.durationMs > 0) {
      const left = Math.max(0, reload.remainingMs - (now - reload.observedAt));
      reloadPct = Math.max(0, Math.min(1, 1 - left / reload.durationMs));
    }

    const x = sprite.x + 22;
    const y = sprite.y - 8;
    const radius = 11;
    const dotR = max >= 16 ? 1.2 : max >= 10 ? 1.6 : 2.1;
    graphics.setVisible(true);
    graphics.setDepth(DEPTH.UI + sprite.y);
    graphics.clear();
    graphics.lineStyle(1, clip, 0.85);
    graphics.strokeCircle(x, y, radius + 3.5);

    const spent = max - ammo;
    for (let index = 0; index < max; index++) {
      const angle = -Math.PI / 2 + (index / max) * Math.PI * 2;
      const cx = x + Math.cos(angle) * radius;
      const cy = y + Math.sin(angle) * radius;
      const loaded = ammo > 0 && index >= spent;
      const last = loaded && index === max - 1;
      graphics.fillStyle(last ? LAST : loaded ? clip : SPENT, loaded ? 1 : 0.7);
      graphics.fillCircle(cx, cy, dotR);
    }

    if (next !== null) {
      graphics.fillStyle(next, 1);
      graphics.fillCircle(x + radius + 8, y, 2.6);
    }

    if (reloadPct !== null && reloadPct > 0) {
      const arcR = radius + 5.5;
      graphics.lineStyle(2, ARC, 1);
      graphics.beginPath();
      graphics.arc(x, y, arcR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(0.999, reloadPct), false);
      graphics.strokePath();
    }
  }
  for (const id of gone) destroySlingerRing(id);
}
