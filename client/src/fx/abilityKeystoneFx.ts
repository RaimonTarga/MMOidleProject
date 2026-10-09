/**
 * ABILITY KEYSTONE FX — each keystone verb's ONE bespoke animation (design §22.7,
 * ability pass W2-D), keyed by the verb id the server puts on its `card-fx`.
 *
 * The premium grammar (docs/combat-animation-current-state.md): a readable wind-up
 * clock, a visible payoff, a visible cancel where control can stop it, body motion
 * through `bodyPose`, weight through `impactFeel` on your own screen only, and a
 * lasting mark where the rule leaves one. Guards use the face grammar (avoid =
 * blur, sustain = pulse or shell, endure = chips) at full size. A keystone never
 * adds a floating word: the word is the weapon verb's teaching channel (design
 * §26.4), and a keystone's `card-fx` carries no `cardId`.
 *
 * A verb with no animation here yet is a keyed STUB (`KEYSTONE_STUBS`): the caller
 * draws its lane fx, at keystone scale, exactly as before this pass; a WIND-UP
 * beat (`windupMs`) of a stub draws nothing, so its payoff is not drawn twice.
 *
 * Every animation draws from the event's `pos` — the verb's DELIVERY BODY (design
 * §22.10: the summon that landed it on a Conduit, the owner elsewhere) — except
 * where the rule is the owner's own body (Whirlwind's spin).
 */
import {
  ABILITY_DATABASE,
  abilityKeystoneUnit,
  resolveAbilityEffect,
  type CombatEvent,
  type PacketId,
  type PlayerView,
} from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { nodeToScene } from '../render/sceneCoords';
import { bodyPose, releasePose, tweenPose } from './bodyPose';
import { debrisKick, drawCracks, dustCloud, inhale, ring } from './bossKit';
import { burstFx } from './particles';
import { impact } from './impactFeel';
import { attackFlairOf } from './attackFlair';
import { payloadFlair } from './lineagePayloadModel';
import { laneColor } from './lineagePayloadFx';
import { AFTERSHOCK_MARK_MS, WHIRLWIND_COIL_MS } from './abilityKeystoneModel';

type CardFxEvent = Extract<CombatEvent, { kind: 'card-fx' }>;
type KeystoneAnimation = (scene: GameScene, ev: CardFxEvent) => void;
type P = { x: number; y: number };

// ── Shared helpers ───────────────────────────────────────────────────────────

/** A keystone reads bigger than a T1 payload: the moment the build plays differently. */
const KEYSTONE_SIZE = 1.25;

/** Size and spark multipliers for this caster's keystone (flair-scaled, capped like a payload). */
function sizeOf(scene: GameScene, ev: CardFxEvent): { k: number; sparks: number } {
  const player = scene.state.view.get(ev.playerId) as PlayerView | undefined;
  const flair = payloadFlair(player ? attackFlairOf(player) : undefined);
  return { k: flair.k * KEYSTONE_SIZE, sparks: flair.sparks };
}

/** The verb's lane colour: the lane its `fx` key draws in (its card's colour). */
function verbColor(ev: CardFxEvent): number {
  return laneColor(ev.fx.slice(0, ev.fx.indexOf('.')) as PacketId);
}

/** Mix toward white. */
function lighten(color: number, t: number): number {
  const mix = (c: number) => Math.round(c + (255 - c) * t);
  return (mix((color >> 16) & 0xff) << 16) | (mix((color >> 8) & 0xff) << 8) | mix(color & 0xff);
}

const count = (base: number, sparks: number): number => Math.max(1, Math.round(base * sparks));
const isOwn = (scene: GameScene, ev: CardFxEvent): boolean => ev.playerId === scene.state.ownId;

function spriteAt(scene: GameScene, id: string | undefined): P | undefined {
  const sprite = id ? scene.state.sprite.get(id) : undefined;
  return sprite ? { x: sprite.x, y: sprite.y } : undefined;
}

/** Whether a player's view shows them hard-controlled (a stun or a freeze breaks a channel). */
function playerHardControlled(scene: GameScene, id: string): boolean {
  const view = scene.state.view.get(id) as PlayerView | undefined;
  return (view?.activeBuffs ?? []).some((b) => b.id === 'debuff-stunned' || b.id === 'debuff-frozen');
}

/** A short-lived graphics object, faded and destroyed by one tween. */
function fading(scene: GameScene, g: Phaser.GameObjects.Graphics, ms: number, extra: Record<string, number> = {}, delay = 0): void {
  scene.tweens.add({
    targets: g, alpha: 0, duration: ms, delay, ease: 'Cubic.easeOut', ...extra,
    onComplete: () => g.destroy(),
  });
}

// ── Sweep · WHIRLWIND — a one-second spin that cleaves every tick ────────────

/**
 * Wind-up: the body coils back and the air is drawn in. Payoff: the body spins
 * for the server's `durationMs`, two blades of wind turning round it in the
 * Tempo lane over Sweep's gold, a cleave ring flashing on every tick of the spin
 * (`whirlwindTickMs`, the server's own tick). Cancel: a stun or a freeze breaks
 * the spin — the blades scatter and the body drops out of it, as the server drops
 * the ticks still to come. No lasting mark: the spin leaves the ground as it was.
 */
function whirlwind(scene: GameScene, ev: CardFxEvent): void {
  const id = ev.playerId;
  const start = spriteAt(scene, id);
  if (!start) return;
  const color = verbColor(ev);
  const gold = 0xffd24a;
  const { k, sparks } = sizeOf(scene, ev);
  const spinMs = Math.max(200, ev.durationMs ?? abilityKeystoneUnit('whirlwindMs'));
  const tickMs = Math.max(1, abilityKeystoneUnit('whirlwindTickMs'));
  const turns = Math.max(2, Math.round(spinMs / 340));

  // The coil.
  tweenPose(scene, id, { sx: 0.9, sy: 1.08, rot: -0.4 }, WHIRLWIND_COIL_MS, 'Quad.easeOut');
  inhale(scene, start.x, start.y - 6, [color, gold, lighten(color, 0.5)], 46 * k, WHIRLWIND_COIL_MS);

  scene.time.delayedCall(WHIRLWIND_COIL_MS, () => {
    if (document.hidden) return;
    // The body turns about its own vertical axis: its width swings through zero
    // and back mirrored (a top-down figure's turn), leaning into the spin.
    const pose = bodyPose(scene, id);
    scene.tweens.killTweensOf(pose);
    const turnBody = (angle: number) => {
      pose.sx = Math.cos(angle) * 1.04;
      pose.sy = 0.95;
      pose.rot = 0.1 * Math.sin(angle);
    };

    const blades = scene.add.graphics().setDepth(DEPTH.FX);
    const t = { p: 0 };
    let ticked = 0;
    let broken = false;
    const radius = 40 * k;
    const drawBlades = (at: P, angle: number, alpha: number) => {
      blades.clear();
      for (const offset of [0, Math.PI]) {
        const a = angle + offset;
        // Glow under a bright core, along the flat ellipse of the ground plane.
        for (const [width, tint, a0] of [[9 * k, color, 0.28], [3 * k, lighten(gold, 0.3), 0.95]] as const) {
          blades.lineStyle(width, tint, a0 * alpha);
          blades.beginPath();
          const steps = 10;
          for (let i = 0; i <= steps; i++) {
            const b = a - 1.1 + (i / steps) * 1.1;
            const px = at.x + Math.cos(b) * radius;
            const py = at.y + 6 + Math.sin(b) * radius * 0.5;
            if (i === 0) blades.moveTo(px, py);
            else blades.lineTo(px, py);
          }
          blades.strokePath();
        }
      }
      // The wind wall: a faint ring the blades ride.
      blades.lineStyle(1.5, color, 0.25 * alpha);
      blades.strokeEllipse(at.x, at.y + 6, radius * 2, radius);
    };

    const spin = scene.tweens.add({
      targets: t, p: 1, duration: spinMs,
      onUpdate: () => {
        const at = spriteAt(scene, id);
        if (!at) return;
        if (!broken && playerHardControlled(scene, id)) {
          // The cancel: the blades scatter and the body drops out of the spin.
          broken = true;
          spin.stop();
          releasePose(scene, id, 200);
          burstFx(scene, 'ptx-spark', at.x, at.y, count(10, sparks), 360, {
            tint: [color, gold], speed: { min: 80, max: 220 }, angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
          });
          fading(scene, blades, 220);
          return;
        }
        const angle = t.p * Math.PI * 2 * turns;
        turnBody(angle);
        drawBlades(at, angle, 1 - Math.max(0, t.p - 0.85) / 0.15);
        // A cleave on every tick of the spin.
        const elapsed = t.p * spinMs;
        while (elapsed >= (ticked + 1) * tickMs && (ticked + 1) * tickMs <= spinMs) {
          ticked++;
          ring(scene, at.x, at.y + 6, color, { from: radius * 0.6, scale: 1.9, width: 3, ms: 260, flat: true });
          burstFx(scene, 'ptx-spark', at.x, at.y, count(8, sparks), 300, {
            tint: [gold, lighten(color, 0.4)], speed: { min: 120, max: 260 }, angle: { min: 0, max: 360 },
            scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
          });
          if (isOwn(scene, ev)) impact(scene, 'light', at);
        }
      },
      onComplete: () => {
        releasePose(scene, id, 260);
        fading(scene, blades, 200);
        const at = spriteAt(scene, id);
        if (at) dustCloud(scene, at.x, at.y + 14, [0x9a8a70, lighten(color, 0.3)], 0.6 * k);
      },
    });
  });
}

// ── Slam · AFTERSHOCK — the ground erupts again at the same spot ─────────────

/** The ground Aftershock cracked, keyed by caster and spot, from its wind-up to its mark. */
const crackedGround = new Map<string, {
  g: Phaser.GameObjects.Graphics; seed: number; radius: number; windup?: Phaser.Tweens.Tween;
}>();

const groundKey = (ev: CardFxEvent, at: P): string => `${ev.playerId}|${Math.round(at.x)}|${Math.round(at.y)}`;

/** How far the cracks run: the caster's Slam radius at its rank (what the eruption covers). */
function slamRadius(scene: GameScene, ev: CardFxEvent): number {
  const slam = ABILITY_DATABASE.get('slam');
  const player = scene.state.view.get(ev.playerId) as PlayerView | undefined;
  if (!slam) return 56;
  const effect = resolveAbilityEffect(slam, { playerTier: player?.playerTier ?? 1 });
  return Math.max(48, effect.kind === 'cast-strike' ? effect.radius ?? 0 : 0);
}

const DIRT = [0x6e6250, 0x9a8a70, 0x4a4034];

/**
 * Two beats, both the server's. The WIND-UP (`windupMs`, pushed when Slam's cast
 * resolves): where the second eruption will come the ground starts to crack, the
 * seams glowing hotter as a ring closes in on the spot — the clock, timed to the
 * server's delay — and grit jumps off the cracks. The PAYOFF (the eruption's own
 * card-fx): rock and dust thrown up through the opened cracks, a flat shockwave
 * and the weight of it on your screen. The LASTING MARK: the cracked ground stays
 * and cools to dark before it fades (`AFTERSHOCK_MARK_MS`). An eruption that
 * never comes (its caster died or left) lets the cracks fade where they are.
 */
function aftershock(scene: GameScene, ev: CardFxEvent): void {
  const at = keystoneScenePoint(ev);
  const key = groundKey(ev, at);
  const color = verbColor(ev);
  const { k, sparks } = sizeOf(scene, ev);
  if (ev.windupMs !== undefined) {
    aftershockWindup(scene, ev, at, key, color, k, sparks);
    return;
  }

  // The eruption, through the cracks the wind-up opened (or fresh ones).
  const ground = crackedGround.get(key);
  crackedGround.delete(key);
  const radius = ground?.radius ?? slamRadius(scene, ev) * k;
  const seed = ground?.seed ?? Math.floor(Math.random() * 1e6);
  if (ground) {
    ground.windup?.stop();
    scene.tweens.killTweensOf(ground.g);
  }
  const mark = ground?.g ?? scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  mark.setAlpha(1);
  const hot = { p: 1 };
  const drawMark = () => {
    if (!mark.active) return;
    mark.clear();
    drawCracks(mark, at.x, at.y, radius * 1.1, 1, 0x1e140a, 0.9, seed, 9);
    drawCracks(mark, at.x, at.y, radius, 1, lighten(color, 0.4 * hot.p), 0.15 + 0.75 * hot.p, seed, 9);
  };
  drawMark();
  // The lasting mark: the seams cool to dark, then the cracked ground fades.
  scene.tweens.add({
    targets: hot, p: 0, duration: AFTERSHOCK_MARK_MS * 0.6, ease: 'Quad.easeOut', onUpdate: drawMark,
  });
  fading(scene, mark, AFTERSHOCK_MARK_MS * 0.4, {}, AFTERSHOCK_MARK_MS * 0.6);

  // The payoff: a flash out of the cracks, rock thrown up, a shockwave, dust.
  const flash = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
  flash.fillStyle(lighten(color, 0.7), 0.9);
  flash.fillEllipse(0, 0, radius * 1.2, radius * 0.5);
  fading(scene, flash, 260, { scaleX: 1.6, scaleY: 1.6 });
  for (const dir of [-120, -90, -60]) {
    debrisKick(scene, at.x, at.y, dir, [...DIRT, color], count(7, sparks), 22, 260);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
    const shard = scene.add.graphics({ x: at.x + Math.cos(a) * radius * 0.5, y: at.y + Math.sin(a) * radius * 0.22 })
      .setDepth(DEPTH.FX);
    shard.fillStyle(i % 2 ? 0x8a7a5c : 0x6b5e48, 1);
    shard.fillTriangle(-5 * k, 0, 5 * k, 0, 0, -18 * k);
    shard.lineStyle(1.5, lighten(color, 0.5), 0.9);
    shard.lineBetween(0, -16 * k, 0, -2);
    shard.setScale(1, 0.1);
    scene.tweens.add({
      targets: shard, scaleY: 1, duration: 90, ease: 'Back.easeOut', delay: i * 18,
      onComplete: () => fading(scene, shard, 520, { y: shard.y + 6 }, 260),
    });
  }
  ring(scene, at.x, at.y, color, { from: radius * 0.35, scale: 3.2, width: 4, ms: 420, flat: true });
  ring(scene, at.x, at.y, 0x9a8a70, { from: radius * 0.3, scale: 2.4, width: 3, ms: 520, flat: true, delay: 60 });
  dustCloud(scene, at.x, at.y, DIRT, 1.1 * k);
  if (isOwn(scene, ev)) impact(scene, 'medium', at);
}

/** The wind-up clock: cracks spreading and glowing, a ring closing on the spot. */
function aftershockWindup(
  scene: GameScene, ev: CardFxEvent, at: P, key: string, color: number, k: number, sparks: number,
): void {
  const windupMs = Math.max(100, ev.windupMs ?? 0);
  const radius = slamRadius(scene, ev) * k;
  const seed = Math.floor(Math.random() * 1e6);
  crackedGround.get(key)?.g.destroy();
  const g = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  const clock = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  const t = { p: 0 };
  let grit = 0;
  const windup = scene.tweens.add({
    targets: t, p: 1, duration: windupMs, ease: 'Sine.easeIn',
    onUpdate: () => {
      if (!g.active) return;
      g.clear();
      drawCracks(g, at.x, at.y, radius, 0.25 + 0.5 * t.p, 0x2a1d10, 0.85, seed, 9);
      // The seams glow hotter, flickering faster as the beat nears.
      const flicker = 0.55 + 0.45 * Math.abs(Math.sin(t.p * t.p * 26));
      drawCracks(g, at.x, at.y, radius * 0.9, 0.25 + 0.5 * t.p, lighten(color, 0.3 * t.p),
        0.35 + 0.5 * t.p * flicker, seed, 9);
      // The clock: a ring closing on the spot.
      clock.clear();
      clock.lineStyle(2 + 2 * t.p, color, 0.25 + 0.6 * t.p);
      const r = radius * (1.5 - 1.1 * t.p);
      clock.strokeEllipse(at.x, at.y, r * 2, r * 0.8);
      if (t.p * 5 > grit + 1) {
        grit++;
        debrisKick(scene, at.x + (Math.random() - 0.5) * radius, at.y + (Math.random() - 0.5) * radius * 0.4,
          -90, DIRT, count(3 + grit, sparks), 30, 90);
      }
    },
    onComplete: () => clock.destroy(),
    onStop: () => clock.destroy(),
  });
  crackedGround.set(key, { g, seed, radius, windup });
  // Never erupted: the cracks fade where they are, a little after the beat.
  scene.time.delayedCall(windupMs + 450, () => {
    const left = crackedGround.get(key);
    if (left?.g !== g) return;
    crackedGround.delete(key);
    fading(scene, g, 500);
  });
}

// ── The table ────────────────────────────────────────────────────────────────

/** The bespoke animations, by verb id. Kept in step with `KEYSTONE_ANIMATED`. */
const KEYSTONE_ANIMATIONS: Record<string, KeystoneAnimation> = {
  whirlwind: whirlwind,
  aftershock: aftershock,
};

/**
 * Draw a keystone verb's `card-fx`. Returns true when the verb's own animation
 * drew it (or deliberately drew nothing, for a stub's wind-up beat); false when
 * the caller should draw the lane fx — the stub.
 */
export function drawAbilityKeystoneFx(scene: GameScene, ev: CardFxEvent): boolean {
  if (!ev.keystone) return false;
  const animation = KEYSTONE_ANIMATIONS[ev.keystone];
  if (animation) {
    animation(scene, ev);
    return true;
  }
  // A stub has no wind-up to draw: its payoff's own card-fx draws the lane fx.
  return ev.windupMs !== undefined;
}

/** The verb ids with an animation registered here (the test holds it to the model). */
export function animatedKeystoneIds(): string[] {
  return Object.keys(KEYSTONE_ANIMATIONS);
}

/** Where an event's point lands in the scene (`at`/`targetPos`, else the delivery body). */
export function keystoneScenePoint(ev: CardFxEvent): P {
  const at = ev.targetPos ?? ev.pos;
  return nodeToScene(at.x, at.y);
}
