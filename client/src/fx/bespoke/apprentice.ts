/**
 * APPRENTICE (dot) specializations — the affliction class, so these read the
 * stacks building on the TARGET (its mirrored status list) rather than the caster.
 */
import { DEPTH } from '../../render/depth';
import { ring } from '../bossKit';
import { targetStacks, type PathTable } from './kit';

const VENOM_PIPS = 10;

export const APPRENTICE_PATHS: PathTable = {
  // Venomslinger — ten venom pips filled by the target's poison stacks; the
  // 10-stack detonation keeps its own burst (fxPoisonExplosion).
  'dot-light-t3-a': {
    hit: (h) => {
      const stacks = targetStacks(h, 'dot');
      if (stacks <= 0) return;
      const n = Math.min(VENOM_PIPS, stacks);
      const hot = n >= VENOM_PIPS - 2;
      const g = h.scene.add.graphics({ x: h.to.x, y: h.to.y }).setDepth(DEPTH.FX);
      const r = 26 * h.k;
      for (let i = 0; i < VENOM_PIPS; i++) {
        const a = -Math.PI / 2 + (i / VENOM_PIPS) * Math.PI * 2;
        const lit = i < n;
        g.fillStyle(lit ? (hot ? 0xd8ff6a : 0x9ad65a) : 0x2a3a1a, lit ? 1 : 0.5);
        g.fillCircle(Math.cos(a) * r, Math.sin(a) * r * 0.7, i === n - 1 ? 4 : 3);
      }
      g.setScale(hot ? 1.1 : 1);
      h.scene.tweens.add({
        targets: g, alpha: 0, scaleX: hot ? 1.25 : 1.05, scaleY: hot ? 1.25 : 1.05,
        duration: 420, delay: 160, onComplete: () => g.destroy(),
      });
      if (hot) ring(h.scene, h.to.x, h.to.y, 0xd8ff6a, { from: r * 0.9, scale: 1.4, width: 2, ms: 240, alpha: 0.7 });
    },
  },
};
