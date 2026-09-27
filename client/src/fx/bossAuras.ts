/**
 * BOSS STATE AURAS — a persistent look for as long as a boss state lasts
 * (Frenzy, Cornered, ...), not only a burst when it starts. Playtest 2026-09-27:
 * the Jungle Frenzy was a one-shot puff, so for its whole 5-8 seconds nothing on
 * screen said the boss was frenzied.
 *
 * Driven every frame from the broadcast view (target statuses and boss effects),
 * never from events, so a state is drawn exactly while the server says it holds.
 * Each aura is up to three layers, all following the live sprite:
 *   GROUND — a glow under the feet, drawn into one Graphics per boss;
 *   BODY   — an additive, colour-filled copy of the body pulsing over it;
 *   BEATS  — a particle burst on a fixed cadence.
 * plus an optional tremble on the body pose. States fade in and out.
 *
 * Adding a state is one `AURAS` row.
 */
import type { MonsterView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { shouldRunClientFx } from './guard';
import { burstFx } from './particles';
import { setTremble } from './bodyPose';

interface AuraDef {
  id: string;
  active(view: MonsterView): boolean;
  /** Ground glow colour, and the body glow colour. */
  color: number;
  /** Ground glow radius over the body's half-width. */
  groundScale: number;
  /** Pulse period in ms, and how hard the body glow pulses (0..1 alpha). */
  pulseMs: number;
  bodyAlpha: [number, number];
  /** Particle beat, if any. */
  beat?: { everyMs: number; draw(scene: GameScene, x: number, y: number, h: number): void };
  tremblePx?: number;
}

const hasTargetStatus = (view: MonsterView, id: string): boolean =>
  (view.targetStatus ?? []).some((s) => s.id === id);
const hasBossEffect = (view: MonsterView, id: string): boolean =>
  (view.bossEffects ?? []).includes(id);

const AURAS: AuraDef[] = [
  {
    // Jungle ambush Frenzy: faster, harder attacks for a few seconds after a landed
    // ambush. A quick, hot heartbeat and rising blood-red streaks.
    id: 'predator-frenzy',
    active: (v) => hasTargetStatus(v, 'boss-frenzy'),
    color: 0xff2a2a,
    groundScale: 1.15,
    pulseMs: 420,
    bodyAlpha: [0.12, 0.42],
    tremblePx: 1.2,
    beat: {
      everyMs: 150,
      draw: (scene, x, y, h) =>
        burstFx(scene, 'ptx-spark', x + (Math.random() - 0.5) * h * 0.5, y + h * 0.3, 2, 520, {
          tint: [0xff3b2f, 0xff8a5c],
          speed: { min: 40, max: 110 },
          angle: { min: 250, max: 290 },
          scale: { start: 0.55, end: 0 },
          alpha: { start: 0.9, end: 0 },
          gravityY: -120,
        }),
    },
  },
  {
    // Verdant-Crown Cornered: the permanent last stand. Darker and slower than the
    // Frenzy — a smouldering rage, not a burst.
    id: 'cornered',
    active: (v) => hasBossEffect(v, 'cornered'),
    color: 0xb3121f,
    groundScale: 1.3,
    pulseMs: 900,
    bodyAlpha: [0.08, 0.28],
    tremblePx: 0.6,
    beat: {
      everyMs: 260,
      draw: (scene, x, y, h) =>
        burstFx(scene, 'ptx-dot', x + (Math.random() - 0.5) * h * 0.6, y + h * 0.35, 1, 900, {
          tint: 0x7a0c14,
          speed: { min: 15, max: 40 },
          angle: { min: 255, max: 285 },
          scale: { start: 0.9, end: 0 },
          alpha: { start: 0.7, end: 0 },
          gravityY: -40,
        }),
    },
  },
];

interface AuraInstance {
  strength: number;
  nextBeatAt: number;
  body?: Phaser.GameObjects.Image;
}

interface BossAuraState {
  ground: Phaser.GameObjects.Graphics;
  auras: Map<string, AuraInstance>;
}

const scenes = new WeakMap<GameScene, Map<string, BossAuraState>>();

function destroyState(scene: GameScene, id: string, st: BossAuraState): void {
  st.ground.destroy();
  for (const inst of st.auras.values()) inst.body?.destroy();
  setTremble(scene, id, 0);
}

/** Per frame: fade each boss's auras toward what its view says, and draw them. */
export function updateBossAuras(scene: GameScene, dtMs: number): void {
  let map = scenes.get(scene);
  const running = shouldRunClientFx();
  const now = performance.now();
  const seen = new Set<string>();

  for (const [id, raw] of scene.state.view) {
    if (scene.state.kind.get(id) !== 'monster') continue;
    const view = raw as MonsterView;
    if (!view.isBoss) continue;
    const sprite = scene.state.sprite.get(id);
    const wanted = running && sprite ? AURAS.filter((a) => a.active(view)) : [];
    let st = map?.get(id);
    if (!st && wanted.length === 0) continue;
    if (!map) {
      map = new Map();
      scenes.set(scene, map);
    }
    if (!st) {
      st = { ground: scene.add.graphics(), auras: new Map() };
      map.set(id, st);
    }
    seen.add(id);

    const g = st.ground;
    g.clear();
    if (!sprite) continue;
    const h = sprite.displayHeight;
    const w = sprite.displayWidth;
    g.setDepth(sprite.depth - 0.02);
    let tremble = 0;

    for (const def of AURAS) {
      const on = wanted.includes(def);
      let inst = st.auras.get(def.id);
      if (!inst && !on) continue;
      if (!inst) {
        inst = { strength: 0, nextBeatAt: now };
        st.auras.set(def.id, inst);
      }
      inst.strength = on
        ? Math.min(1, inst.strength + dtMs / 250)
        : Math.max(0, inst.strength - dtMs / 400);
      if (inst.strength <= 0) {
        inst.body?.destroy();
        st.auras.delete(def.id);
        continue;
      }
      const pulse = (Math.sin((now / def.pulseMs) * Math.PI * 2) + 1) / 2;
      const s = inst.strength;

      // GROUND: a soft layered glow under the feet.
      const gx = sprite.x;
      const gy = sprite.y + h * 0.4;
      const rx = (w / 2) * def.groundScale * (0.92 + pulse * 0.12);
      for (let i = 0; i < 3; i++) {
        g.fillStyle(def.color, (0.16 - i * 0.045) * s * (0.7 + pulse * 0.3));
        g.fillEllipse(gx, gy, rx * 2 * (1 + i * 0.28), rx * 0.62 * (1 + i * 0.28));
      }

      // BODY: an additive colour copy of the current frame, pulsing.
      if ('texture' in sprite) {
        if (!inst.body || !inst.body.active) {
          inst.body = scene.add.image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
            .setTintFill(def.color)
            .setBlendMode(Phaser.BlendModes.ADD);
        }
        const body = inst.body;
        if (body.frame.name !== sprite.frame.name || body.texture.key !== sprite.texture.key) {
          body.setTexture(sprite.texture.key, sprite.frame.name);
          body.setTintFill(def.color);
        }
        body
          .setPosition(sprite.x, sprite.y)
          .setScale(sprite.scaleX, sprite.scaleY)
          .setRotation(sprite.rotation)
          .setFlipX(sprite.flipX)
          .setDepth(sprite.depth + 0.01)
          .setAlpha((def.bodyAlpha[0] + (def.bodyAlpha[1] - def.bodyAlpha[0]) * pulse) * s * sprite.alpha)
          .setVisible(sprite.visible);
      }

      // BEATS.
      if (def.beat && on && now >= inst.nextBeatAt) {
        inst.nextBeatAt = now + def.beat.everyMs;
        def.beat.draw(scene, sprite.x, sprite.y, h);
      }
      if (on && def.tremblePx) tremble = Math.max(tremble, def.tremblePx * s);
    }
    setTremble(scene, id, tremble);

    if (st.auras.size === 0) {
      destroyState(scene, id, st);
      map.delete(id);
    }
  }

  // Bosses that left the scene.
  if (map) {
    for (const [id, st] of map) {
      if (seen.has(id)) continue;
      destroyState(scene, id, st);
      map.delete(id);
    }
  }
}
