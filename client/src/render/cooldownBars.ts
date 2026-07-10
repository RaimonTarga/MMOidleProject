import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';

export function ensureCdBar(
  state: RenderState,
  id: string,
  scene: GameScene,
): void {
  if (state.cdBar.has(id)) return;
  state.cdBar.set(id, scene.add.graphics().setDepth(DEPTH.UI));
}

export function drawCooldownBars(state: RenderState): void {
  const now = Date.now();

  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const cdBar = state.cdBar.get(id);
    const meta = state.spriteMeta.get(id);
    const snap = state.view.get(id);
    if (!sprite || !cdBar || !meta || !snap) continue;

    // Charged-attack wind-up reuses this same bar, tinted red, showing cast
    // progress (the telegraph). Otherwise it shows the normal attack cooldown.
    const cast = state.castState.get(id);
    const casting = !!cast;
    // A player with a Technique armed keeps the normal cooldown fill but wears
    // the danger-red tint until the consuming hit clears it (see combatFx.ts).
    const armed = state.techniqueArmed.has(id);
    const barY = sprite.y - meta.barOffsetY + 6;
    let pct: number;
    let show: boolean;
    if (cast) {
      // Wind-up DEPLETES: starts full and drains to empty; the shot fires when it
      // empties. Reads as an incoming-danger countdown rather than a second cooldown.
      pct = Math.max(0, 1 - (now - cast.startedAt) / Math.max(1, cast.castMs));
      show = true;
    } else {
      show = snap.attackTargetId !== null;
      pct = show
        ? Math.min(1, (now - snap.lastAttackAt) / Math.max(1, snap.attackCooldown))
        : 0;
    }

    const bucket = Math.round(pct * 64);
    const prev = state.cdBarCache.get(id);
    if (
      prev &&
      prev.x === sprite.x &&
      prev.y === barY &&
      prev.bucket === bucket &&
      prev.show === show &&
      prev.casting === casting &&
      prev.armed === armed
    ) {
      continue;
    }
    state.cdBarCache.set(id, { x: sprite.x, y: barY, bucket, show, casting, armed });

    cdBar.setDepth(DEPTH.UI + sprite.y);
    cdBar.clear();
    if (!show) continue;

    const color =
      casting || armed ? 0xff3322 : pct >= 1 ? 0xffdd22 : 0x4466cc;

    cdBar.fillStyle(0x1a1a1a);
    cdBar.fillRect(sprite.x - 16, barY, 32, 3);
    cdBar.fillStyle(color);
    cdBar.fillRect(sprite.x - 16, barY, Math.round(32 * pct), 3);
    cdBar.lineStyle(1, 0x000000, 0.75);
    cdBar.strokeRect(sprite.x - 16.5, barY - 0.5, 33, 4);
  }
}

export function destroyCdBar(state: RenderState, id: string): void {
  state.cdBar.get(id)?.destroy();
  state.cdBar.delete(id);
  state.cdBarCache.delete(id);
}
