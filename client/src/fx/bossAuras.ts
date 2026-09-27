/**
 * STATE AURAS — a persistent look for as long as a combat state lasts, on a boss,
 * its adds, or a player (premium pass, 2026-09-27). The Jungle Frenzy was a
 * one-shot puff; for its whole 5-8 seconds nothing said the boss was frenzied.
 *
 * Driven every frame from the broadcast VIEW, never from events, so a state is
 * drawn exactly while the server says it holds. Layers, all following the sprite:
 *   GROUND    a glow under the feet;
 *   BODY      an additive colour copy of the current frame, pulsing over it;
 *   OVERHEAD  custom drawing above the body (a mark, an ice block, a halo);
 *   BEATS     a particle burst on a fixed cadence;
 * plus an optional tremble on the body pose, and start/end one-shots (a plate
 * assembling, a plate shattering). States fade in and out.
 *
 * The definitions live in `auraDefs.ts`; adding a state is one row there.
 */
import type { MonsterView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { auraAppliesTo, type AnyView, type AuraContext, type AuraSubject } from './auraTypes';
import { shouldRunClientFx } from './guard';
import { setTremble } from './bodyPose';
import { AURA_DEFS } from './auraDefs';

interface AuraInstance {
  strength: number;
  nextBeatAt: number;
  since: number;
  on: boolean;
  body?: Phaser.GameObjects.Image;
}

interface EntityAuraState {
  ground: Phaser.GameObjects.Graphics;
  overhead: Phaser.GameObjects.Graphics;
  auras: Map<string, AuraInstance>;
}

const scenes = new WeakMap<GameScene, Map<string, EntityAuraState>>();

function subjectOf(scene: GameScene, id: string, view: AnyView): AuraSubject | null {
  const kind = scene.state.kind.get(id);
  if (kind === 'player') return 'player';
  if (kind === 'monster') return (view as MonsterView).isBoss ? 'boss' : 'monster';
  return null;
}

function destroyState(scene: GameScene, id: string, st: EntityAuraState): void {
  st.ground.destroy();
  st.overhead.destroy();
  for (const inst of st.auras.values()) inst.body?.destroy();
  setTremble(scene, id, 0);
}

/** Per frame: fade each entity's auras toward what its view says, and draw them. */
export function updateBossAuras(scene: GameScene, dtMs: number): void {
  let map = scenes.get(scene);
  const running = shouldRunClientFx();
  const now = performance.now();
  const seen = new Set<string>();

  for (const [id, view] of scene.state.view as Map<string, AnyView>) {
    const subject = subjectOf(scene, id, view);
    if (!subject) continue;
    const sprite = scene.state.sprite.get(id);
    const wanted = running && sprite
      ? AURA_DEFS.filter((a) => auraAppliesTo(a, subject) && a.active(view))
      : [];
    let st = map?.get(id);
    if (!st && wanted.length === 0) continue;
    if (!map) {
      map = new Map();
      scenes.set(scene, map);
    }
    if (!st) {
      st = { ground: scene.add.graphics(), overhead: scene.add.graphics(), auras: new Map() };
      map.set(id, st);
    }
    seen.add(id);

    st.ground.clear();
    st.overhead.clear();
    if (!sprite) continue;
    const h = sprite.displayHeight;
    const w = sprite.displayWidth;
    st.ground.setDepth(sprite.depth - 0.02);
    st.overhead.setDepth(sprite.depth + 0.02);
    let tremble = 0;

    for (const def of AURA_DEFS) {
      if (!auraAppliesTo(def, subject)) continue;
      const on = wanted.includes(def);
      let inst = st.auras.get(def.id);
      if (!inst && !on) continue;
      const ctx = (strength: number, pulse: number, since: number): AuraContext => ({
        scene, id, x: sprite.x, y: sprite.y, h, w, s: strength, pulse,
        stacks: Math.max(1, def.stacks?.(view) ?? 1), age: now - since,
      });
      if (!inst) {
        inst = { strength: 0, nextBeatAt: now, since: now, on: true };
        st.auras.set(def.id, inst);
        def.onStart?.(ctx(0, 0, now), view);
      }
      if (inst.on && !on) def.onEnd?.(ctx(inst.strength, 0, inst.since), view);
      if (!inst.on && on) {
        inst.since = now;
        def.onStart?.(ctx(inst.strength, 0, now), view);
      }
      inst.on = on;
      inst.strength = on
        ? Math.min(1, inst.strength + dtMs / 250)
        : Math.max(0, inst.strength - dtMs / 400);
      if (inst.strength <= 0) {
        inst.body?.destroy();
        st.auras.delete(def.id);
        continue;
      }
      const pulse = (Math.sin((now / (def.pulseMs ?? 800)) * Math.PI * 2) + 1) / 2;
      const c = ctx(inst.strength, pulse, inst.since);

      if (def.ground) {
        const gy = sprite.y + h * 0.4;
        const rx = (w / 2) * def.ground.scale * (0.92 + pulse * 0.12);
        const base = def.ground.alpha ?? 0.16;
        for (let i = 0; i < 3; i++) {
          st.ground.fillStyle(def.ground.color, (base - i * base * 0.28) * c.s * (0.7 + pulse * 0.3));
          st.ground.fillEllipse(sprite.x, gy, rx * 2 * (1 + i * 0.28), rx * 0.62 * (1 + i * 0.28));
        }
      }

      if (def.body && 'texture' in sprite) {
        if (!inst.body || !inst.body.active) {
          inst.body = scene.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
            .setTintFill(def.body.color)
            .setBlendMode(Phaser.BlendModes.ADD);
        }
        const body = inst.body;
        if (body.frame.name !== sprite.frame.name || body.texture.key !== sprite.texture.key) {
          body.setTexture(sprite.texture.key, sprite.frame.name);
          body.setTintFill(def.body.color);
        }
        const [lo, hi] = def.body.alpha;
        body
          .setPosition(sprite.x, sprite.y)
          .setScale(sprite.scaleX, sprite.scaleY)
          .setRotation(sprite.rotation)
          .setFlipX(sprite.flipX)
          .setDepth(sprite.depth + 0.01)
          .setAlpha((lo + (hi - lo) * pulse) * c.s * sprite.alpha)
          .setVisible(sprite.visible);
      }

      def.under?.(st.ground, c);
      def.overhead?.(st.overhead, c);

      if (def.beat && on && now >= inst.nextBeatAt) {
        inst.nextBeatAt = now + def.beat.everyMs;
        def.beat.draw(c);
      }
      if (on && def.tremblePx) tremble = Math.max(tremble, def.tremblePx * c.s);
    }
    setTremble(scene, id, tremble);

    if (st.auras.size === 0) {
      destroyState(scene, id, st);
      map.delete(id);
    }
  }

  if (map) {
    for (const [id, st] of map) {
      if (seen.has(id)) continue;
      destroyState(scene, id, st);
      map.delete(id);
    }
  }
}
