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
  type MonsterView,
  type PacketId,
  type PlayerView,
} from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { nodeToScene } from '../render/sceneCoords';
import { afterimages, bodyPose, posePath, releasePose, tweenPose } from './bodyPose';
import { debrisKick, drawCracks, drawSigil, dustCloud, inhale, lob, ring } from './bossKit';
import { burstFx } from './particles';
import { bolt, crescent } from './bespoke/kit';
import { impact } from './impactFeel';
import { attackFlairOf } from './attackFlair';
import { payloadFlair } from './lineagePayloadModel';
import { drawPayloadFx, laneColor } from './lineagePayloadFx';
import { lastingRecord } from './lineagePayloadStates';
import {
  AFTERSHOCK_MARK_MS, DRAGNET_BATCH_MS, DRAGNET_FLIGHT_MS, OUTBREAK_MARK_MS, OUTBREAK_SWELL_MS,
  WHIRLWIND_COIL_MS,
} from './abilityKeystoneModel';

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

/** The point an event names (`targetPos`, else its delivery body), in the scene. */
function eventPoint(ev: CardFxEvent): P {
  const at = ev.targetPos ?? ev.pos;
  return nodeToScene(at.x, at.y);
}

/**
 * Which application of one verb's cast this event is, by caster: a verb that
 * reaches several bodies at once pushes one card-fx per body in the same batch,
 * and the animation staggers them down the line (Shared Breath's pulse, Backlash's
 * ring, a Chain Reaction's links, a Harvest's swings). 0 for the first of a batch.
 */
const batches = new Map<string, { at: number; n: number }>();
const BATCH_MS = 90;
function batchIndex(ev: CardFxEvent): number {
  const key = `${ev.playerId}|${ev.keystone ?? ''}`;
  const now = performance.now();
  const last = batches.get(key);
  const n = last && now - last.at <= BATCH_MS ? last.n + 1 : 0;
  batches.set(key, { at: now, n });
  return n;
}

/**
 * The body nearest a point (a party member or a summon a formation verb reached,
 * which its event names by position only), within `within` scene px.
 */
function bodyNear(scene: GameScene, at: P, kinds: readonly string[], within = 60): string | undefined {
  let best: string | undefined;
  let gap = within * within;
  for (const [id, sprite] of scene.state.sprite) {
    if (!kinds.includes(scene.state.kind.get(id) ?? '')) continue;
    const d = (sprite.x - at.x) ** 2 + (sprite.y - at.y) ** 2;
    if (d <= gap) {
      gap = d;
      best = id;
    }
  }
  return best;
}

/**
 * A lasting look that follows a body for the server's clock (`durationMs` as
 * applied): `draw` is handed the body's position and the clock's progress each
 * frame and paints into one graphics object. It ends on the clock, when the body
 * leaves the scene, or when `holds` says the server's state is gone.
 */
function followBody(
  scene: GameScene,
  id: string,
  durationMs: number,
  depth: number,
  draw: (g: Phaser.GameObjects.Graphics, at: P, p: number, sprite: { displayWidth: number; displayHeight: number }) => void,
  holds?: () => boolean,
): void {
  const g = scene.add.graphics().setDepth(depth);
  const t = { p: 0 };
  scene.tweens.add({
    targets: t, p: 1, duration: Math.max(150, durationMs),
    onUpdate: (tween) => {
      const sprite = scene.state.sprite.get(id);
      if (!sprite || (holds && !holds())) {
        tween.stop();
        g.destroy();
        return;
      }
      g.clear();
      draw(g, { x: sprite.x, y: sprite.y }, t.p, sprite);
    },
    onComplete: () => g.destroy(),
  });
}

/** Whether the server still shows a monster held (its mirrored hard control), once it has been seen. */
function heldWhileSeen(scene: GameScene, id: string): () => boolean {
  let seen = false;
  return () => {
    const view = scene.state.view.get(id) as MonsterView | undefined;
    if (view?.hardControlled) seen = true;
    return !seen || view?.hardControlled === true;
  };
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

// ── Charge · BREAKTHROUGH — arriving staggers the target ─────────────────────

/**
 * A dazed halo over a staggered body: stars turning round its head for the
 * stagger's clock as APPLIED (`durationMs`), ending early when `holds` says the
 * stun is gone (by default, when the knockdown look ends) or the body does. The lasting mark of every
 * stagger keystone (Breakthrough now; Riposte, Backlash, Tremor and Relay draw it
 * when they land).
 */
export function dazedHalo(
  scene: GameScene, targetId: string, durationMs: number, color: number, k: number,
  holds: () => boolean = () => !!lastingRecord(targetId, 'knockdown'),
): void {
  const halo = scene.add.graphics().setDepth(DEPTH.FX + 1);
  const t = { p: 0 };
  scene.tweens.add({
    targets: t, p: 1, duration: Math.max(200, durationMs),
    onUpdate: (tween) => {
      const sprite = scene.state.sprite.get(targetId);
      if (!sprite || !holds()) {
        tween.stop();
        halo.destroy();
        return;
      }
      halo.clear();
      const cx = sprite.x;
      const cy = sprite.y - sprite.displayHeight * 0.5 - 4;
      const spin = t.p * Math.PI * 2 * Math.max(2, durationMs / 450);
      for (let i = 0; i < 3; i++) {
        const a = spin + (i / 3) * Math.PI * 2;
        const x = cx + Math.cos(a) * 13 * k;
        const y = cy + Math.sin(a) * 4.5 * k;
        const r = (Math.sin(a) > 0 ? 3.2 : 2.4) * k; // the near side reads larger
        halo.fillStyle(i === 0 ? 0xffffff : lighten(color, 0.55), 0.95);
        halo.fillTriangle(x - r, y, x + r, y, x, y - r * 1.5);
        halo.fillTriangle(x - r, y - r * 0.6, x + r, y - r * 0.6, x, y + r * 0.9);
      }
    },
    onComplete: () => halo.destroy(),
  });
}

/**
 * The arrival IS the wind-up: the rush the Charge already draws closes the gap,
 * and the blow lands from the delivering body's side (on a Conduit, the summon
 * that arrived first). PAYOFF: the shoulder's starburst at the contact, a cone of
 * force driven through the target along the line of the rush, and the target
 * knocked off its feet — the knockdown payload, drawn from the delivering body,
 * held for the stagger's clock. LASTING MARK: the dazed halo for that clock.
 */
function breakthrough(scene: GameScene, ev: CardFxEvent): void {
  if (!ev.targetId) return;
  const to = spriteAt(scene, ev.targetId) ?? keystoneScenePoint(ev);
  const from = nodeToScene(ev.pos.x, ev.pos.y);
  const color = verbColor(ev);
  const { k, sparks } = sizeOf(scene, ev);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  // The knockdown itself (the blow, the tip, the hold, the get-up), larger.
  drawPayloadFx(scene, ev, 'control.knockdown', KEYSTONE_SIZE);

  // The contact: a starburst on the side the rush came from.
  const contact = { x: to.x - dx * 12, y: to.y - dy * 8 };
  const burst = scene.add.graphics({ x: contact.x, y: contact.y }).setDepth(DEPTH.FX + 1);
  burst.lineStyle(3 * k, lighten(color, 0.5), 1);
  for (let i = 0; i < 8; i++) {
    const a = angle + Math.PI + ((i - 3.5) / 3.5) * 1.2;
    burst.lineBetween(Math.cos(a) * 5, Math.sin(a) * 5, Math.cos(a) * (i % 2 ? 16 : 24) * k, Math.sin(a) * (i % 2 ? 16 : 24) * k);
  }
  fading(scene, burst, 240, { scaleX: 1.5, scaleY: 1.5 });

  // The cone of force driven through the body along the rush.
  for (let i = 0; i < 4; i++) {
    const spread = (i - 1.5) * 0.22;
    const a = angle + spread;
    const line = scene.add.graphics().setDepth(DEPTH.FX);
    const sx = to.x + Math.cos(a) * 6;
    const sy = to.y + Math.sin(a) * 4;
    line.lineStyle(2.5 * k, i % 2 ? color : lighten(color, 0.6), 0.9);
    line.lineBetween(sx, sy, sx + Math.cos(a) * 18 * k, sy + Math.sin(a) * 12 * k);
    fading(scene, line, 260, { x: Math.cos(a) * 30 * k, y: Math.sin(a) * 18 * k }, i * 20);
  }
  burstFx(scene, 'ptx-spark', to.x, to.y, count(10, sparks), 360, {
    tint: [color, lighten(color, 0.6), 0xffffff],
    speed: { min: 140, max: 300 },
    angle: { min: (angle * 180) / Math.PI - 35, max: (angle * 180) / Math.PI + 35 },
    scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 },
  });
  dazedHalo(scene, ev.targetId, ev.durationMs ?? 0, color, k);
  if (isOwn(scene, ev)) impact(scene, 'medium', to);
}

// ── Contagion · OUTBREAK — a body it infected passes its afflictions on ──────

/**
 * WIND-UP: the infected corpse swells, the air drawn into it. PAYOFF: it bursts —
 * spores thrown up, and a glob of what it carried lobbed onto its nearest living
 * neighbour, which flinches under the splat (Contagion's own tendril, the
 * `dot-spread` event, draws the element beside it). LASTING MARK: a miasma pool
 * where the body died, bubbling, fading over `OUTBREAK_MARK_MS`.
 */
function outbreak(scene: GameScene, ev: CardFxEvent): void {
  const corpse = nodeToScene(ev.pos.x, ev.pos.y);
  const color = verbColor(ev);
  const dark = 0x3e5a24;
  const { k, sparks } = sizeOf(scene, ev);

  // The swell.
  const pod = scene.add.graphics({ x: corpse.x, y: corpse.y - 8 }).setDepth(DEPTH.FX);
  pod.fillStyle(color, 0.55);
  pod.fillCircle(0, 0, 10 * k);
  pod.lineStyle(2, lighten(color, 0.4), 0.9);
  pod.strokeCircle(0, 0, 10 * k);
  pod.setScale(0.4);
  inhale(scene, corpse.x, corpse.y - 8, [color, dark], 34 * k, OUTBREAK_SWELL_MS);
  scene.tweens.add({
    targets: pod, scaleX: 1.35, scaleY: 1.25, duration: OUTBREAK_SWELL_MS, ease: 'Quad.easeIn',
    onComplete: () => {
      pod.destroy();
      if (document.hidden) return;
      // The burst.
      ring(scene, corpse.x, corpse.y - 8, color, { from: 10 * k, scale: 3.4, width: 3, ms: 360 });
      burstFx(scene, 'ptx-dot', corpse.x, corpse.y - 8, count(16, sparks), 820, {
        tint: [color, dark, lighten(color, 0.4)], speed: { min: 40, max: 150 }, angle: { min: 200, max: 340 },
        scale: { start: 1.1, end: 1.8 }, alpha: { start: 0.8, end: 0 }, gravityY: -20,
      });
      // The glob, lobbed onto the neighbour.
      const target = spriteAt(scene, ev.targetId) ?? (ev.targetPos ? nodeToScene(ev.targetPos.x, ev.targetPos.y) : undefined);
      if (target) {
        lob(scene, { x: corpse.x, y: corpse.y - 8 }, { x: target.x, y: target.y - 6 }, 260, 34 * k, (g) => {
          g.fillStyle(color, 0.95);
          g.fillCircle(0, 0, 5.5 * k);
          g.fillStyle(lighten(color, 0.6), 0.9);
          g.fillCircle(-1.5, -1.5, 2 * k);
        }, () => {
          if (document.hidden) return;
          const at = spriteAt(scene, ev.targetId) ?? target;
          const splat = scene.add.graphics({ x: at.x, y: at.y - 4 }).setDepth(DEPTH.FX);
          splat.fillStyle(color, 0.8);
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            splat.fillCircle(Math.cos(a) * 7 * k, Math.sin(a) * 5 * k, 3 * k);
          }
          splat.fillCircle(0, 0, 6 * k);
          fading(scene, splat, 420, { scaleX: 1.6, scaleY: 1.4 });
          if (ev.targetId && !(scene.state.view.get(ev.targetId) as MonsterView | undefined)?.isBoss) {
            posePath(scene, ev.targetId, [
              { sx: 0.9, sy: 1.1, ms: 60 },
              { sx: 1.06, sy: 0.95, ms: 80 },
              { sx: 1, sy: 1, ms: 240, ease: 'Back.easeOut' },
            ]);
          }
        });
      }
      // The lasting mark: a miasma pool where the body fell.
      const pool = scene.add.graphics({ x: corpse.x, y: corpse.y + 12 }).setDepth(DEPTH.SPRITE - 1);
      pool.fillStyle(dark, 0.45);
      pool.fillEllipse(0, 0, 54 * k, 20 * k);
      pool.fillStyle(color, 0.3);
      pool.fillEllipse(0, 0, 38 * k, 13 * k);
      pool.setScale(0.3);
      scene.tweens.add({ targets: pool, scaleX: 1, scaleY: 1, duration: 260, ease: 'Back.easeOut' });
      fading(scene, pool, OUTBREAK_MARK_MS * 0.5, {}, OUTBREAK_MARK_MS * 0.5);
      for (let i = 0; i < 4; i++) {
        scene.time.delayedCall(300 + i * 420, () => {
          if (document.hidden) return;
          burstFx(scene, 'ptx-dot', corpse.x + (Math.random() - 0.5) * 30 * k, corpse.y + 10, 2, 700, {
            tint: [color, lighten(color, 0.3)], speed: { min: 6, max: 18 }, angle: { min: 250, max: 290 },
            scale: { start: 0.6, end: 1.1 }, alpha: { start: 0.7, end: 0 }, gravityY: -30,
          });
        });
      }
    },
  });
}

// ── Binding Strike · DRAGNET — the root takes every body adjacent ────────────

/** The bodies one cast's net took so far, per caster: they arrive as one batch. */
const dragnetBatches = new Map<string, { at: number; bodies: string[] }>();

/** A net's mesh: a diamond lattice in a flat ellipse, drawn at the origin. */
function drawNet(g: Phaser.GameObjects.Graphics, rx: number, ry: number, color: number, alpha: number): void {
  g.lineStyle(1.5, color, alpha);
  g.strokeEllipse(0, 0, rx * 2, ry * 2);
  for (let i = -2; i <= 2; i++) {
    const off = (i / 2.5) * rx;
    g.lineBetween(off - rx * 0.45, -ry * 0.85, off + rx * 0.45, ry * 0.85);
    g.lineBetween(off + rx * 0.45, -ry * 0.85, off - rx * 0.45, ry * 0.85);
  }
}

/**
 * One event per body the net took. WIND-UP: a weighted net thrown from the
 * delivering body (a Conduit's summon on a Conduit), readable in flight. PAYOFF: it
 * lands and spreads over the body, the shackle clamps its feet (the Control
 * lane's shackle, for the root's clock as APPLIED, less the flight), and every
 * body this one cast netted is tied to the others by a strand of the same net.
 * LASTING MARK: the shackle's held look until the root ends or breaks.
 */
function dragnet(scene: GameScene, ev: CardFxEvent): void {
  const bodyId = ev.targetId;
  if (!bodyId) return;
  const from = nodeToScene(ev.pos.x, ev.pos.y);
  const to = spriteAt(scene, bodyId) ?? keystoneScenePoint(ev);
  const color = verbColor(ev);
  const rope = 0x6b5a3e;
  const { k } = sizeOf(scene, ev);

  // The batch: the bodies one cast netted arrive together.
  const now = performance.now();
  const batch = dragnetBatches.get(ev.playerId);
  const fresh = !batch || now - batch.at > DRAGNET_BATCH_MS;
  const bodies = fresh ? [] : batch.bodies;
  dragnetBatches.set(ev.playerId, { at: now, bodies: [...bodies, bodyId] });

  lob(scene, { x: from.x, y: from.y - 10 }, { x: to.x, y: to.y - 8 }, DRAGNET_FLIGHT_MS, 26 * k, (g) => {
    drawNet(g, 9 * k, 6 * k, rope, 0.95);
    g.lineStyle(1, lighten(color, 0.4), 0.8);
    g.strokeCircle(0, 0, 3);
  }, () => {
    if (document.hidden) return;
    const at = spriteAt(scene, bodyId) ?? to;
    const sprite = scene.state.sprite.get(bodyId);
    const w = sprite?.displayWidth ?? 48;
    // The net spreads over the body and settles to its feet.
    const net = scene.add.graphics({ x: at.x, y: at.y - 4 }).setDepth(DEPTH.FX);
    drawNet(net, Math.max(18, w * 0.55), Math.max(12, w * 0.4), rope, 0.95);
    drawNet(net, Math.max(18, w * 0.55) * 0.96, Math.max(12, w * 0.4) * 0.96, lighten(color, 0.3), 0.6);
    net.setScale(0.35);
    scene.tweens.add({
      targets: net, scaleX: 1, scaleY: 1, y: at.y + 6, duration: 140, ease: 'Back.easeOut',
      onComplete: () => fading(scene, net, 420, {}, 160),
    });
    // The shackle, for what is left of the root's clock after the flight.
    const held = ev.durationMs !== undefined ? Math.max(1, ev.durationMs - DRAGNET_FLIGHT_MS) : undefined;
    drawPayloadFx(scene, held !== undefined ? { ...ev, durationMs: held } : ev, 'control.shackle', 1.1);
    // A strand of the same net to every body this cast already took.
    for (const otherId of bodies) {
      const other = spriteAt(scene, otherId);
      if (!other) continue;
      const strand = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
      const mid = { x: (at.x + other.x) / 2, y: (at.y + other.y) / 2 + 10 };
      strand.lineStyle(3, rope, 0.85);
      strand.beginPath();
      strand.moveTo(at.x, at.y + 12);
      strand.lineTo(mid.x, mid.y + 6);
      strand.lineTo(other.x, other.y + 12);
      strand.strokePath();
      strand.lineStyle(1.2, lighten(color, 0.4), 0.9);
      strand.beginPath();
      strand.moveTo(at.x, at.y + 12);
      strand.lineTo(mid.x, mid.y + 6);
      strand.lineTo(other.x, other.y + 12);
      strand.strokePath();
      fading(scene, strand, 600, {}, 500);
    }
  });
}

// ── Detonate · CHAIN REACTION — a Detonate kill sets off every afflicted body ─

/** When a kill last started a chain, per caster and spot: its burst draws once per kill. */
const chainOrigins = new Map<string, number>();

/**
 * One event per body the kill set off, drawn from the body that died. The
 * Detonate's own wind-up and the kill are the WIND-UP; at the kill the corpse
 * flares once and a crackling fuse leaps from it to each afflicted body in turn,
 * down the batch, and lands in a ring (each body's own Detonate burst, the
 * `dot-detonate` event, draws the explosion it sets off). LASTING MARK: a scorched
 * star burnt into the ground where the chain began.
 */
function chainReaction(scene: GameScene, ev: CardFxEvent): void {
  const origin = nodeToScene(ev.pos.x, ev.pos.y);
  const to = spriteAt(scene, ev.targetId) ?? eventPoint(ev);
  const color = verbColor(ev);
  const hot = 0xff8a3a;
  const { k, sparks } = sizeOf(scene, ev);
  const n = batchIndex(ev);

  const key = `${ev.playerId}|${Math.round(origin.x)}|${Math.round(origin.y)}`;
  const now = performance.now();
  if (now - (chainOrigins.get(key) ?? 0) > 400) {
    chainOrigins.set(key, now);
    // The corpse goes off: a flash, a ring, and the scorch it leaves.
    const flash = scene.add.graphics({ x: origin.x, y: origin.y }).setDepth(DEPTH.FX);
    flash.fillStyle(lighten(hot, 0.6), 0.9);
    flash.fillCircle(0, 0, 12 * k);
    fading(scene, flash, 240, { scaleX: 2.6, scaleY: 2.6 });
    ring(scene, origin.x, origin.y, hot, { from: 10 * k, scale: 3.8, width: 3, ms: 380 });
    const scorch = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
    scorch.fillStyle(0x1a120c, 0.5);
    scorch.fillEllipse(origin.x, origin.y + 10, 52 * k, 18 * k);
    drawCracks(scorch, origin.x, origin.y + 10, 38 * k, 1, hot, 0.5, Math.floor(Math.random() * 1e6), 8);
    fading(scene, scorch, 1_400, {}, 1_200);
    if (isOwn(scene, ev)) impact(scene, 'medium', origin);
  }

  // The fuse to this body, one link after another down the batch.
  scene.time.delayedCall(n * 45, () => {
    if (document.hidden) return;
    const end = spriteAt(scene, ev.targetId) ?? to;
    const cord = scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
    bolt(cord, origin, end, hot, 3.5 * k, 9, 7);
    bolt(cord, origin, end, lighten(color, 0.55), 1.5, 5, 7);
    fading(scene, cord, 240);
    ring(scene, end.x, end.y, color, { from: 8 * k, scale: 3, width: 2.5, ms: 300 });
    burstFx(scene, 'ptx-spark', end.x, end.y, count(8, sparks), 320, {
      tint: [hot, color, 0xffffff], speed: { min: 90, max: 220 }, angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 },
    });
  });
}

// ── Disengage · VANISH — breaking contact drops you from their aggro ─────────

/** How long the outline you left behind takes to fade. */
const VANISH_OUTLINE_MS = 1_700;

/**
 * The Avoid face's blur, at full size. WIND-UP: Disengage's own leap away. PAYOFF:
 * where you stood, smoke and an outline of your body — a ghost the monsters are
 * still looking at — while the real body blurs off in afterimages. LASTING MARK:
 * the outline flickers and thins over `VANISH_OUTLINE_MS`, drifting, then is
 * gone; the mark itself stands until your next hit (server-only, never drawn as a
 * per-tick state).
 */
function vanish(scene: GameScene, ev: CardFxEvent): void {
  const left = nodeToScene(ev.pos.x, ev.pos.y);
  const color = verbColor(ev);
  const { k, sparks } = sizeOf(scene, ev);

  // Smoke where you were.
  burstFx(scene, 'ptx-mist', left.x, left.y, count(5, sparks), 900, {
    tint: [0x5a5a6a, lighten(color, 0.3)], speed: { min: 10, max: 45 }, angle: { min: 0, max: 360 },
    scale: { start: 0.7 * k, end: 1.6 * k }, alpha: { start: 0.55, end: 0 },
  });
  ring(scene, left.x, left.y + 10, color, { from: 12 * k, scale: 2.6, width: 2, ms: 420, flat: true, alpha: 0.6 });

  // The outline left behind: the body's own frame, filled with the lane's colour.
  const body = scene.state.sprite.get(ev.playerId);
  if (body && 'texture' in body) {
    const ghost = scene.add
      .image(left.x, left.y, body.texture.key, body.frame.name)
      .setScale(body.scaleX, body.scaleY)
      .setFlipX(body.flipX)
      .setDepth(body.depth - 0.01)
      .setTintFill(color)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD);
    // A flicker, then the slow thinning out.
    scene.tweens.add({ targets: ghost, alpha: 0.25, duration: 90, yoyo: true, repeat: 2 });
    scene.tweens.add({
      targets: ghost, alpha: 0, y: left.y - 8, scaleX: body.scaleX * 0.9,
      duration: VANISH_OUTLINE_MS, delay: 540, ease: 'Sine.easeIn',
      onComplete: () => ghost.destroy(),
    });
  }
  // The real body slips away in a blur.
  afterimages(scene, ev.playerId, { count: 4, everyMs: 40, tint: color, alpha: 0.35, fadeMs: 280 });
}

// ── Snipe · PIERCE — the shot passes through and hits everything behind ──────

/** The bodies whose sprites stand on a segment (within `width` px of it). */
function bodiesOnLine(scene: GameScene, a: P, b: P, width: number): P[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const out: P[] = [];
  for (const [id, sprite] of scene.state.sprite) {
    if (scene.state.kind.get(id) !== 'monster') continue;
    const t = ((sprite.x - a.x) * dx + (sprite.y - a.y) * dy) / len2;
    if (t <= 0.05 || t > 1.05) continue;
    const px = a.x + dx * t;
    const py = a.y + dy * t;
    if ((sprite.x - px) ** 2 + (sprite.y - py) ** 2 <= width * width) out.push({ x: sprite.x, y: sprite.y });
  }
  return out;
}

/**
 * One event per shot that pierced, from the delivery body to the farthest body it
 * reached. WIND-UP: a glint gathers at the muzzle and a hair-thin sight line
 * flicks out along the shot. PAYOFF: the round goes through as a rail of light,
 * past the last body, and every body on the line is punctured in turn. LASTING
 * MARK: the smoke of its wake hangs along the line and thins away.
 */
function pierce(scene: GameScene, ev: CardFxEvent): void {
  const from = nodeToScene(ev.pos.x, ev.pos.y);
  const far = eventPoint(ev);
  const color = verbColor(ev);
  const { k, sparks } = sizeOf(scene, ev);
  const angle = Math.atan2(far.y - from.y, far.x - from.x);
  const beyond = { x: far.x + Math.cos(angle) * 34 * k, y: far.y + Math.sin(angle) * 34 * k };
  const muzzle = { x: from.x + Math.cos(angle) * 12, y: from.y - 10 + Math.sin(angle) * 8 };

  // The glint and the sight line.
  inhale(scene, muzzle.x, muzzle.y, [0xffffff, lighten(color, 0.5)], 22 * k, 90);
  const sight = scene.add.graphics().setDepth(DEPTH.FX);
  sight.lineStyle(1, lighten(color, 0.6), 0.7);
  sight.lineBetween(muzzle.x, muzzle.y, beyond.x, beyond.y);
  fading(scene, sight, 120);

  scene.time.delayedCall(90, () => {
    if (document.hidden) return;
    // The rail.
    const rail = scene.add.graphics().setDepth(DEPTH.FX + 1).setBlendMode(Phaser.BlendModes.ADD);
    const t = { p: 0 };
    scene.tweens.add({
      targets: t, p: 1, duration: 80, ease: 'Quad.easeOut',
      onUpdate: () => {
        rail.clear();
        const x = muzzle.x + (beyond.x - muzzle.x) * t.p;
        const y = muzzle.y + (beyond.y - muzzle.y) * t.p;
        rail.lineStyle(9 * k, color, 0.3);
        rail.lineBetween(muzzle.x, muzzle.y, x, y);
        rail.lineStyle(3 * k, lighten(color, 0.4), 0.95);
        rail.lineBetween(muzzle.x, muzzle.y, x, y);
        rail.lineStyle(1.2, 0xffffff, 1);
        rail.lineBetween(muzzle.x, muzzle.y, x, y);
      },
      onComplete: () => fading(scene, rail, 180),
    });
    // Every body the line passes, punctured in turn.
    const hit = bodiesOnLine(scene, from, far, 26 * k)
      .sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y));
    const deg = (angle * 180) / Math.PI;
    hit.forEach((at, i) => {
      scene.time.delayedCall(20 + i * 18, () => {
        if (document.hidden) return;
        ring(scene, at.x, at.y, color, { from: 6 * k, scale: 2.4, width: 2, ms: 220 });
        burstFx(scene, 'ptx-spark', at.x, at.y, count(7, sparks), 300, {
          tint: [0xffffff, lighten(color, 0.4)], speed: { min: 140, max: 320 },
          angle: { min: deg - 22, max: deg + 22 }, scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
        });
      });
    });
    // The wake: smoke along the line, thinning away.
    const wake = scene.add.graphics().setDepth(DEPTH.FX - 1);
    wake.lineStyle(6 * k, 0x9a9aa8, 0.28);
    wake.lineBetween(muzzle.x, muzzle.y, beyond.x, beyond.y);
    wake.lineStyle(2, 0xd8d8e0, 0.3);
    wake.lineBetween(muzzle.x, muzzle.y, beyond.x, beyond.y);
    fading(scene, wake, 900, { y: -6 }, 160);
    if (isOwn(scene, ev)) impact(scene, 'light', muzzle);
  });
}

// ── Stunning Strike · RELAY — when the stun ends it jumps on ────────────────

/** The flight of the stun from one body to the next. */
const RELAY_FLIGHT_MS = 220;

/** A stagger flash on a body: a white burst, a jolt of the body, its daze. */
function staggerFlash(scene: GameScene, id: string | undefined, at: P, color: number, k: number, sparks: number): void {
  const burst = scene.add.graphics({ x: at.x, y: at.y - 6 }).setDepth(DEPTH.FX + 1);
  burst.fillStyle(0xffffff, 0.95);
  burst.fillCircle(0, 0, 9 * k);
  burst.lineStyle(3, lighten(color, 0.3), 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    burst.lineBetween(Math.cos(a) * 11 * k, Math.sin(a) * 11 * k, Math.cos(a) * 20 * k, Math.sin(a) * 20 * k);
  }
  fading(scene, burst, 240, { scaleX: 1.7, scaleY: 1.7 });
  burstFx(scene, 'ptx-spark', at.x, at.y - 6, count(8, sparks), 320, {
    tint: [0xffffff, color], speed: { min: 80, max: 200 }, angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
  });
  if (id && !(scene.state.view.get(id) as MonsterView | undefined)?.isBoss) {
    posePath(scene, id, [
      { sx: 1.12, sy: 0.88, rot: 0.12, ms: 60 },
      { sx: 0.96, sy: 1.04, rot: -0.08, ms: 90 },
      { sx: 1, sy: 1, rot: 0, ms: 240, ease: 'Back.easeOut' },
    ]);
  }
}

/**
 * One event per jump, from the body whose stun ran out to the body it reached.
 * WIND-UP: the daze over the old body gathers into one spark. PAYOFF: the spark
 * arcs across and lands as a stagger flash — the new body jolts. LASTING MARK:
 * the dazed halo over the new body for the stun as APPLIED, ending early when the
 * server's mirrored hold does.
 */
function relay(scene: GameScene, ev: CardFxEvent): void {
  const from = nodeToScene(ev.pos.x, ev.pos.y);
  const head = { x: from.x, y: from.y - 34 };
  const color = verbColor(ev);
  const { k, sparks } = sizeOf(scene, ev);
  inhale(scene, head.x, head.y, [0xffffff, lighten(color, 0.5)], 18 * k, 120);
  scene.time.delayedCall(120, () => {
    if (document.hidden) return;
    const to = spriteAt(scene, ev.targetId) ?? eventPoint(ev);
    lob(scene, head, { x: to.x, y: to.y - 30 }, RELAY_FLIGHT_MS, 40 * k, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(-5 * k, 0, 5 * k, 0, 0, -7 * k);
      g.fillTriangle(-5 * k, -3 * k, 5 * k, -3 * k, 0, 4 * k);
      g.lineStyle(1.5, color, 1);
      g.strokeCircle(0, -1.5 * k, 7 * k);
    }, () => {
      if (document.hidden) return;
      const at = spriteAt(scene, ev.targetId) ?? to;
      staggerFlash(scene, ev.targetId, at, color, k, sparks);
      if (ev.targetId) {
        const held = Math.max(1, (ev.durationMs ?? 0) - RELAY_FLIGHT_MS - 120);
        dazedHalo(scene, ev.targetId, held, color, k, heldWhileSeen(scene, ev.targetId));
      }
      if (isOwn(scene, ev)) impact(scene, 'light', at);
    });
  });
}

// ── Imbue Lightning · FORK — every imbued hit arcs to the nearest other body ──

/**
 * One event per arc, from the body the imbued hit struck to the one it forked to.
 * WIND-UP: static gathers on the struck body for a beat. PAYOFF: the bolt forks
 * across — a main arc and a branch that splits off it and fizzles — flickering
 * twice before it goes, and the body it reaches jolts in a flash. LASTING MARK:
 * static crackles over that body for a moment after.
 */
function fork(scene: GameScene, ev: CardFxEvent): void {
  const from = nodeToScene(ev.pos.x, ev.pos.y);
  const color = verbColor(ev);
  const pale = lighten(color, 0.6);
  const { k, sparks } = sizeOf(scene, ev);
  inhale(scene, from.x, from.y - 8, [pale, 0xffffff], 20 * k, 70);
  scene.time.delayedCall(70, () => {
    if (document.hidden) return;
    const to = spriteAt(scene, ev.targetId) ?? eventPoint(ev);
    const a = { x: from.x, y: from.y - 8 };
    const b = { x: to.x, y: to.y - 8 };
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const side = Math.atan2(b.y - a.y, b.x - a.x) + (Math.random() < 0.5 ? 0.9 : -0.9);
    const branch = { x: mid.x + Math.cos(side) * 26 * k, y: mid.y + Math.sin(side) * 20 * k };
    const arc = scene.add.graphics().setDepth(DEPTH.FX + 1).setBlendMode(Phaser.BlendModes.ADD);
    const strike = () => {
      arc.clear();
      bolt(arc, a, b, color, 4 * k, 12, 8);
      bolt(arc, a, b, 0xffffff, 1.6, 12, 8);
      bolt(arc, mid, branch, pale, 1.8, 6, 4);
    };
    strike();
    scene.time.delayedCall(60, () => { if (arc.active) strike(); });
    scene.time.delayedCall(120, () => { if (arc.active) strike(); });
    fading(scene, arc, 120, {}, 160);
    // The body it reaches jolts in the flash.
    const flash = scene.add.graphics({ x: b.x, y: b.y }).setDepth(DEPTH.FX + 1);
    flash.fillStyle(pale, 0.9);
    flash.fillCircle(0, 0, 10 * k);
    fading(scene, flash, 200, { scaleX: 2.2, scaleY: 2.2 });
    if (ev.targetId && !(scene.state.view.get(ev.targetId) as MonsterView | undefined)?.isBoss) {
      posePath(scene, ev.targetId, [
        { sx: 0.92, sy: 1.08, ms: 50 },
        { sx: 1.04, sy: 0.96, ms: 60 },
        { sx: 1, sy: 1, ms: 200, ease: 'Back.easeOut' },
      ]);
    }
    // The static left on it.
    for (let i = 0; i < 3; i++) {
      scene.time.delayedCall(160 + i * 150, () => {
        if (document.hidden) return;
        const at = spriteAt(scene, ev.targetId) ?? b;
        const spark = scene.add.graphics().setDepth(DEPTH.FX).setBlendMode(Phaser.BlendModes.ADD);
        const r = Math.random() * Math.PI * 2;
        bolt(spark, { x: at.x, y: at.y - 10 }, { x: at.x + Math.cos(r) * 16 * k, y: at.y - 10 + Math.sin(r) * 12 * k }, pale, 1.2, 4, 3);
        fading(scene, spark, 120);
      });
    }
    burstFx(scene, 'ptx-spark', b.x, b.y, count(6, sparks), 280, {
      tint: [pale, 0xffffff], speed: { min: 60, max: 160 }, angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 },
    });
  });
}

// ── Cull · HARVEST — a Cull kill lands the same strike on the next low body ──

/** The beat between one reaped body and the next, down the chain. */
const HARVEST_STEP_MS = 120;

/**
 * One event per body the harvest moves on to, from the delivering body, drawn
 * before the strike that may kill it. Down the chain, link after link: WIND-UP —
 * a pale scythe hangs over the next body, drawn back; PAYOFF — it reaps across
 * in the lane's colour with a slash, and the body buckles. LASTING MARK: a wisp
 * rising from what was reaped. The chain growing is the visible verb.
 */
function harvest(scene: GameScene, ev: CardFxEvent): void {
  const color = verbColor(ev);
  const pale = lighten(color, 0.65);
  const { k, sparks } = sizeOf(scene, ev);
  const n = batchIndex(ev);
  const grow = 1 + Math.min(4, n) * 0.08;
  scene.time.delayedCall(n * HARVEST_STEP_MS, () => {
    if (document.hidden) return;
    const from = nodeToScene(ev.pos.x, ev.pos.y);
    const at = spriteAt(scene, ev.targetId) ?? eventPoint(ev);
    // The reaper moves on: a ghost streak to the next body.
    const streak = scene.add.graphics().setDepth(DEPTH.FX - 1);
    streak.lineStyle(4 * k, color, 0.25);
    streak.lineBetween(from.x, from.y - 10, at.x, at.y - 10);
    fading(scene, streak, 220);
    // The scythe drawn back over it…
    const blade = scene.add.graphics({ x: at.x + 18 * k, y: at.y - 30 * k }).setDepth(DEPTH.FX + 1);
    blade.lineStyle(3 * k * grow, pale, 0.95);
    blade.beginPath();
    blade.arc(0, 0, 16 * k * grow, Math.PI * 0.95, Math.PI * 1.6);
    blade.strokePath();
    blade.lineStyle(2, 0x5a4a3a, 0.95);
    blade.lineBetween(0, 0, 10 * k, 22 * k);
    blade.setAlpha(0).setRotation(-0.5);
    scene.tweens.add({
      targets: blade, alpha: 1, rotation: -0.9, duration: 80, ease: 'Quad.easeOut',
      onComplete: () => {
        blade.destroy();
        if (document.hidden) return;
        // …and reaping across.
        crescent(scene, at, Math.PI * 0.75, 30 * k * grow, 5 * k * grow, 0xffffff, color, 140);
        burstFx(scene, 'ptx-spark', at.x, at.y, count(8, sparks), 320, {
          tint: [pale, color], speed: { min: 90, max: 220 }, angle: { min: 160, max: 260 },
          scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 },
        });
        if (ev.targetId && !(scene.state.view.get(ev.targetId) as MonsterView | undefined)?.isBoss) {
          posePath(scene, ev.targetId, [
            { sx: 1.08, sy: 0.86, ms: 70 },
            { sx: 1, sy: 1, ms: 260, ease: 'Back.easeOut' },
          ]);
        }
        // The wisp of what was reaped.
        for (let i = 0; i < 4; i++) {
          const mote = scene.add.graphics({ x: at.x + (Math.random() - 0.5) * 16, y: at.y - 6 }).setDepth(DEPTH.FX);
          mote.fillStyle(i % 2 ? pale : 0xffffff, 0.85);
          mote.fillCircle(0, 0, 2.2 * k);
          fading(scene, mote, 620, { y: at.y - 46 * k, x: at.x + (Math.random() - 0.5) * 24 }, i * 50);
        }
        if (isOwn(scene, ev)) impact(scene, n === 0 ? 'light' : 'medium', at);
      },
    });
  });
}

// ── The table ────────────────────────────────────────────────────────────────

/** The bespoke animations, by verb id. Kept in step with `KEYSTONE_ANIMATED`. */
const KEYSTONE_ANIMATIONS: Record<string, KeystoneAnimation> = {
  whirlwind: whirlwind,
  aftershock: aftershock,
  breakthrough: breakthrough,
  outbreak: outbreak,
  dragnet: dragnet,
  'chain-reaction': chainReaction,
  vanish: vanish,
  pierce: pierce,
  relay: relay,
  fork: fork,
  harvest: harvest,
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
