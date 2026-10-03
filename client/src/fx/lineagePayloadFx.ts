/**
 * LINEAGE PAYLOAD FX — one readable effect per T1 payload (course-correction W2-C,
 * design §24.1-§24.2 rule 4: perceptible with the sound off, a change in what
 * BODIES do, never only a number, no tints as FX).
 *
 * Premium grammar (docs/combat-animation-current-state.md): an anticipation where
 * the payload has one, a visible payoff, body motion through `bodyPose`, weight
 * through `impactFeel` (own player only, Settings-gated), a lasting look for a
 * lasting state (the aura rows in `auraDefs.ts`, fed by `lineagePayloadStates.ts`).
 *
 *   lands twice       the body winds back and swings AGAIN a beat later: the echo's
 *                     own hit is presented as a second swing with afterimages
 *   lunge             a dash at the target with afterimages; the hit lands at
 *                     contact with a hit-stop and the target recoils
 *   mechanic flash    the class's OWN mechanic glyph flashes beside the player (the
 *                     combo, the dial, the round, the bolt, the dose, the rune) and
 *                     the hit itself is drawn as the root's empowered hit
 *   crash             the same glyph, bigger, and the ground breaks under the hit
 *   heavy drip        a burst of venom off the body, then heavy drops while it runs
 *   double dose       the affliction surges: drawn in, then its pips split in two
 *   shackle           chains fly in and lock the feet for the root, then break
 *   knockdown         the target is knocked off its feet, held down, gets up
 *   heal and load     a pulse up the player's body and the weapon's load discharging
 *                     into the hit (the glow between kill and hit is the `loaded` aura)
 *   refund flash      the refunded Technique's tile flashes on the ability bar; a
 *                     sigil turns back under the player for everyone else
 *
 * FLAIR: every effect takes the player's `AttackFlair` through `payloadFlair` —
 * mid-weight: full size on a fresh character, a little more with stage and
 * ascension, capped short of a T3 specialization's payoff.
 *
 * The floating WORD on a payoff ("Flurry!") is the rhythm readout's (W2-B), not
 * drawn here.
 */
import {
  isRangedPlayerView,
  packetDefinition,
  type CombatArchetype,
  type CombatEvent,
  type MonsterView,
  type PacketId,
  type PlayerView,
} from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { nodeToScene } from '../render/sceneCoords';
import { afterimages, posePath, releasePose, tweenPose } from './bodyPose';
import { debrisKick, dirTo, drawCracks, drawSigil, dustCloud, inhale, ring } from './bossKit';
import { crescent } from './bespoke/kit';
import { burstFx } from './particles';
import { impact } from './impactFeel';
import { attackFlairOf } from './attackFlair';
import {
  LUNGE_CONTACT_MS, LUNGE_HOLD_MS, LUNGE_RETURN_MS, PAYLOAD_FX, ECHO_DELAY_MS,
  payloadDurationMs, payloadFlair, type PayloadFxKey,
} from './lineagePayloadModel';
import { endLasting, startLasting } from './lineagePayloadStates';

type P = { x: number; y: number };
type CardFxEvent = Extract<CombatEvent, { kind: 'card-fx' }>;
type PlayerHit = Extract<CombatEvent, { kind: 'player-hit' }>;

// ── Colours ──────────────────────────────────────────────────────────────────

/** A lane's colour, from its one owner (design §18.2). */
export function laneColor(lane: PacketId): number {
  const css = packetDefinition(lane)?.color;
  const parsed = css ? Number.parseInt(css.replace('#', ''), 16) : Number.NaN;
  return Number.isNaN(parsed) ? 0xffffff : parsed;
}

const laneOf = (fx: PayloadFxKey): PacketId => fx.slice(0, fx.indexOf('.')) as PacketId;

/** Mix toward white: a lane colour's bright core. */
function lighten(color: number, t: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (c: number) => Math.round(c + (255 - c) * t);
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

/** Mix toward black: a lane colour's shadow. */
function darken(color: number, t: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (c: number) => Math.round(c * (1 - t));
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

/**
 * Each root's mechanic colour — the same table the empowered ring at the target
 * uses (`playEmpoweredRing`), so the glyph over the player and the ring on the
 * target read as one event.
 */
export function mechanicColor(archetype: CombatArchetype | null | undefined): number {
  switch (archetype) {
    case 'cadence': return 0x4499ff;
    case 'cooldown': return 0xddeeff;
    case 'energy': return 0x88aaff;
    case 'reload': return 0xffeedd;
    default: return 0xffdd22;
  }
}

// ── Where things are ─────────────────────────────────────────────────────────

interface Bodies {
  scene: GameScene;
  ev: CardFxEvent;
  player?: PlayerView;
  /** The player's body now (its live sprite, else the event position). */
  from: P;
  /** The payload's body now (the live target sprite, else its event position). */
  to: P;
  /** Drawn sizes, for placing things on a body. */
  playerH: number;
  targetW: number;
  targetH: number;
  color: number;
  k: number;
  sparks: number;
  own: boolean;
}

function spriteOf(scene: GameScene, id: string | undefined) {
  return id ? scene.state.sprite.get(id) : undefined;
}

function bodiesFor(scene: GameScene, ev: CardFxEvent, fx: PayloadFxKey): Bodies {
  const state = scene.state;
  const player = state.view.get(ev.playerId) as PlayerView | undefined;
  const playerSprite = spriteOf(scene, ev.playerId);
  const targetSprite = spriteOf(scene, ev.targetId);
  const from = playerSprite ? { x: playerSprite.x, y: playerSprite.y } : nodeToScene(ev.pos.x, ev.pos.y);
  const to = targetSprite
    ? { x: targetSprite.x, y: targetSprite.y }
    : ev.targetPos ? nodeToScene(ev.targetPos.x, ev.targetPos.y) : from;
  const flair = payloadFlair(player ? attackFlairOf(player) : undefined);
  return {
    scene, ev, player, from, to,
    playerH: playerSprite?.displayHeight ?? 48,
    targetW: targetSprite?.displayWidth ?? 48,
    targetH: targetSprite?.displayHeight ?? 48,
    color: laneColor(laneOf(fx)),
    k: flair.k,
    sparks: flair.sparks,
    own: ev.playerId === state.ownId,
  };
}

const count = (base: number, sparks: number): number => Math.max(1, Math.round(base * sparks));

/** The weapon's spot in the player's hand, leaning toward what it hits. */
function weaponPoint(b: Bodies): P {
  const d = dirTo(b.from, b.to);
  return { x: b.from.x + d.x * 10, y: b.from.y - b.playerH * 0.12 + d.y * 6 };
}

function isBossView(scene: GameScene, id: string | undefined): boolean {
  return !!id && ((scene.state.view.get(id) as MonsterView | undefined)?.isBoss ?? false);
}

function weigh(b: Bodies, fx: PayloadFxKey, at: P): void {
  const weight = PAYLOAD_FX[fx].weight;
  if (weight !== 'none' && b.own) impact(b.scene, weight, at);
}

/** A short-lived graphics object, faded and destroyed by one tween. */
function fading(scene: GameScene, g: Phaser.GameObjects.Graphics, ms: number, extra: Record<string, number> = {}, delay = 0): void {
  scene.tweens.add({
    targets: g, alpha: 0, duration: ms, delay, ease: 'Cubic.easeOut', ...extra,
    onComplete: () => g.destroy(),
  });
}

// ── The card-fx dispatch ─────────────────────────────────────────────────────

/** Draw a payload's `card-fx` (the caller has checked `isPayloadFx`). */
export function drawPayloadFx(scene: GameScene, ev: CardFxEvent, fx: PayloadFxKey): void {
  const b = bodiesFor(scene, ev, fx);
  switch (fx) {
    case 'tempo.ghost-strike': return echoWindup(b);
    case 'engagement.lunge': return lungeDash(b);
    case 'empowered.mechanic-flash': return mechanicFlash(b, false);
    case 'empowered.crash': return mechanicFlash(b, true);
    case 'affliction.heavy-drip': return heavyDrip(b);
    case 'affliction.double-dose': return doubleDose(b);
    case 'control.shackle': return shackleClamp(b);
    case 'control.knockdown': return knockdown(b);
    case 'kill-chain.heal-load': return healAndLoad(b);
    case 'technique.refund-flash': return refundSigil(b);
  }
}

/**
 * The payload's OWN hit, drawn over the class's ordinary hit animation when it is
 * presented (`lineage-hit:<fx>` on a `player-hit`): the echo's second swing, the
 * lunge's contact. The other payloads draw everything on their card-fx, which
 * plays on the same beat as their hit.
 */
export function drawPayloadHit(
  scene: GameScene,
  ev: PlayerHit,
  fx: PayloadFxKey,
  from: P,
  to: P,
  player: PlayerView,
): void {
  const own = ev.playerId === scene.state.ownId;
  const flair = payloadFlair(attackFlairOf(player));
  const color = laneColor(laneOf(fx));
  if (fx === 'tempo.ghost-strike') echoSwing(scene, ev.playerId, player, from, to, color, flair.k, own);
  else if (fx === 'engagement.lunge') lungeContact(scene, ev.targetId, from, to, color, flair.k, flair.sparks, own);
}

// ── Lands twice ──────────────────────────────────────────────────────────────

/**
 * The anticipation: the moment the 6th hit lands, the body is already winding
 * back for the echo, and wind gathers at the blade for the beat in between.
 */
function echoWindup(b: Bodies): void {
  const { scene, ev, from, to, color } = b;
  const side = Math.sign(to.x - from.x) || 1;
  tweenPose(scene, ev.playerId, { sx: 0.95, sy: 1.05, rot: -side * 0.16 }, ECHO_DELAY_MS * 0.75, 'Quad.easeOut');
  const at = weaponPoint(b);
  // Speed lines converging on the weapon.
  for (let i = 0; i < count(5, b.sparks); i++) {
    const a = Math.atan2(from.y - to.y, from.x - to.x) + (i - 2) * 0.42;
    const r0 = 34 * b.k;
    const g = scene.add.graphics({ x: at.x + Math.cos(a) * r0, y: at.y + Math.sin(a) * r0 * 0.8 }).setDepth(DEPTH.FX);
    g.lineStyle(2 * b.k, lighten(color, 0.35), 0.85);
    g.lineBetween(0, 0, Math.cos(a) * 12 * b.k, Math.sin(a) * 12 * b.k * 0.8);
    scene.tweens.add({
      targets: g, x: at.x, y: at.y, alpha: 0.1, duration: ECHO_DELAY_MS, delay: i * 14, ease: 'Cubic.easeIn',
      onComplete: () => g.destroy(),
    });
  }
  // A swirl tightening round the blade: the count running ahead.
  const swirl = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
  const t = { p: 0 };
  scene.tweens.add({
    targets: t, p: 1, duration: ECHO_DELAY_MS, ease: 'Quad.easeIn',
    onUpdate: () => {
      swirl.clear();
      const r = (22 - 12 * t.p) * b.k;
      swirl.lineStyle(2, color, 0.7 * (1 - t.p * 0.4));
      swirl.beginPath();
      swirl.arc(0, 0, r, t.p * 5, t.p * 5 + 4.2);
      swirl.strokePath();
    },
    onComplete: () => swirl.destroy(),
  });
}

/** The second swing itself, on the echo's own hit (the class swing draws beneath). */
function echoSwing(
  scene: GameScene, playerId: string, player: PlayerView, from: P, to: P, color: number, k: number, own: boolean,
): void {
  const side = Math.sign(to.x - from.x) || 1;
  const ranged = isRangedPlayerView(player);
  afterimages(scene, playerId, { count: 3, everyMs: 32, tint: color, alpha: 0.5, fadeMs: 300 });
  posePath(scene, playerId, ranged
    ? [{ sx: 1.06, sy: 0.94, rot: -side * 0.1, ms: 70 }, { sx: 1, sy: 1, rot: 0, ms: 240, ease: 'Back.easeOut' }]
    : [{ sx: 1.07, sy: 0.94, rot: side * 0.16, ms: 80 }, { sx: 1, sy: 1, rot: 0, ms: 260, ease: 'Back.easeOut' }]);
  // The echo's own crescent, in the lane colour, crossing the first cut.
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  crescent(scene, to, angle + Math.PI / 2 - 0.5, 30 * k, 3.2 * k, lighten(color, 0.55), color, 190);
  // Speed lines thrown past the target along the swing.
  for (let i = 0; i < 3; i++) {
    const off = (i - 1) * 9 * k;
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const g = scene.add.graphics({ x: to.x + nx * off, y: to.y + ny * off }).setDepth(DEPTH.FX);
    g.lineStyle(2, color, 0.8);
    g.lineBetween(-Math.cos(angle) * 10, -Math.sin(angle) * 10, Math.cos(angle) * 14, Math.sin(angle) * 14);
    fading(scene, g, 260, { x: to.x + nx * off + Math.cos(angle) * 26, y: to.y + ny * off + Math.sin(angle) * 26 }, i * 25);
  }
  if (own) impact(scene, 'light', to);
}

// ── The lunge ────────────────────────────────────────────────────────────────

/** The reach of the dash: most of the gap to a melee target, a step in for range. */
export function lungeReach(gap: number, ranged: boolean): number {
  if (ranged) return Math.max(14, Math.min(40, gap * 0.22));
  return Math.max(18, Math.min(72, gap - 22));
}

/**
 * The dash: the body leaves its feet for the target with afterimages streaming
 * behind, and holds at full reach for the hit the server multiplied (presented at
 * contact, `LUNGE_CONTACT_MS` later), then slides home.
 */
function lungeDash(b: Bodies): void {
  const { scene, ev, from, to, color } = b;
  const interp = scene.state.interpolation.get(ev.playerId);
  const d = dirTo(from, to);
  const gap = Math.hypot(to.x - from.x, to.y - from.y) - b.targetW * 0.3;
  const reach = lungeReach(gap, b.player ? isRangedPlayerView(b.player) : false);
  const side = Math.sign(d.x) || 1;

  // Push-off: dirt kicked back from the starting foot, a streak along the path.
  debrisKick(scene, from.x, from.y + b.playerH * 0.38, (Math.atan2(-d.y, -d.x) * 180) / Math.PI,
    [0x8a7a5c, 0x6b5e48, darken(color, 0.4)], count(7, b.sparks), 30, 160);
  const streak = scene.add.graphics().setDepth(DEPTH.FX - 1);
  streak.lineStyle(5 * b.k, color, 0.35);
  streak.lineBetween(from.x, from.y + 6, from.x + d.x * reach, from.y + d.y * reach + 6);
  streak.lineStyle(2 * b.k, lighten(color, 0.6), 0.8);
  streak.lineBetween(from.x, from.y + 6, from.x + d.x * reach, from.y + d.y * reach + 6);
  fading(scene, streak, 320, {}, LUNGE_CONTACT_MS);

  // A lower alpha than the echo's: the salmon lane colour, added over a lit
  // ground, whitens out at 0.5 and the ghost reads as a blob rather than a body.
  afterimages(scene, ev.playerId, { count: 5, everyMs: 22, tint: color, alpha: 0.32, fadeMs: 320 });
  posePath(scene, ev.playerId, [
    { sx: 1.14, sy: 0.88, rot: side * 0.22, ms: LUNGE_CONTACT_MS, ease: 'Cubic.easeIn' },
    { sx: 1.08, sy: 0.93, rot: side * 0.12, ms: LUNGE_HOLD_MS },
    { sx: 1, sy: 1, rot: 0, ms: LUNGE_RETURN_MS, ease: 'Back.easeOut' },
  ]);

  if (!interp) return;
  // The body itself travels: the lunge offset is the one channel the renderer
  // already adds to a body's position (the ordinary hit lunge rides it too), so
  // the payload's hit skips that one (`hitOwnsBodyLunge`) and this owns it.
  scene.tweens.killTweensOf(interp.lungeOffset);
  const offset = { x: interp.lungeOffset.x, y: interp.lungeOffset.y };
  interp.lungeOffset = offset;
  scene.tweens.chain({
    targets: offset,
    tweens: [
      { x: d.x * reach, y: d.y * reach, duration: LUNGE_CONTACT_MS, ease: 'Cubic.easeIn' },
      { x: d.x * reach, y: d.y * reach, duration: LUNGE_HOLD_MS },
      { x: 0, y: 0, duration: LUNGE_RETURN_MS, ease: 'Quad.easeOut' },
    ],
  });
}

/** Contact: a starburst, a hit-stop, and the target knocked back on its heels. */
function lungeContact(
  scene: GameScene, targetId: string, from: P, to: P, color: number, k: number, sparks: number, own: boolean,
): void {
  const core = lighten(color, 0.7);
  const burst = scene.add.graphics({ x: to.x, y: to.y }).setDepth(DEPTH.FX);
  const spikes = 9;
  burst.lineStyle(3 * k, color, 0.95);
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + 0.2;
    const r1 = (i % 2 ? 22 : 30) * k;
    burst.lineBetween(Math.cos(a) * 7, Math.sin(a) * 7, Math.cos(a) * r1, Math.sin(a) * r1);
  }
  burst.fillStyle(core, 0.95);
  burst.fillCircle(0, 0, 9 * k);
  fading(scene, burst, 260, { scaleX: 1.5, scaleY: 1.5 });
  ring(scene, to.x, to.y, color, { from: 12 * k, scale: 2.6, width: 2, ms: 300 });
  const dirDeg = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  burstFx(scene, 'ptx-spark', to.x, to.y, count(10, sparks), 360, {
    tint: [core, color], speed: { min: 140, max: 300 }, angle: { min: dirDeg - 50, max: dirDeg + 50 },
    scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 },
  });
  if (!isBossView(scene, targetId)) {
    const side = Math.sign(to.x - from.x) || 1;
    posePath(scene, targetId, [
      { sx: 0.86, sy: 1.1, rot: side * 0.22, ms: 70 },
      { sx: 1, sy: 1, rot: 0, ms: 280, ease: 'Back.easeOut' },
    ]);
  }
  if (own) impact(scene, 'medium', to);
}

// ── The mechanic flash and the crash ─────────────────────────────────────────

/**
 * The class's own mechanic, drawn as a small glyph over the head in the root's
 * mechanic colour, rimmed in the Anvil lane: the combo filling, the dial sweeping
 * round, a round chambering, a bolt charging, a dose at full stacks, a rune lit.
 */
function drawMechanicGlyph(
  g: Phaser.GameObjects.Graphics, archetype: CombatArchetype | null | undefined,
  p: number, color: number, rim: number,
): void {
  g.clear();
  const lit = Math.min(1, p * 1.6);
  switch (archetype) {
    case 'cadence': {
      // The combo: three pips lighting left to right, then the finisher pip.
      for (let i = 0; i < 3; i++) {
        const on = lit >= (i + 1) / 3;
        g.fillStyle(on ? color : 0x223044, 0.95);
        g.fillCircle(-12 + i * 12, 0, 4.2);
        g.lineStyle(1.5, rim, 0.9);
        g.strokeCircle(-12 + i * 12, 0, 4.2);
      }
      break;
    }
    case 'cooldown': {
      // The dial sweeping round to full.
      g.fillStyle(0x1c2430, 0.85);
      g.fillCircle(0, 0, 11);
      g.fillStyle(color, 0.95);
      g.slice(0, 0, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lit, false);
      g.fillPath();
      g.lineStyle(2, rim, 0.95);
      g.strokeCircle(0, 0, 11);
      break;
    }
    case 'reload': {
      // A round sliding up into the chamber.
      const y = 8 - 8 * lit;
      g.lineStyle(2, rim, 0.9);
      g.strokeRect(-7, -13, 14, 22);
      g.fillStyle(color, 0.95);
      g.fillRoundedRect(-4, y - 7, 8, 14, 2);
      g.fillTriangle(-4, y - 7, 4, y - 7, 0, y - 12);
      break;
    }
    case 'energy': {
      // A bolt drawn on, then lit.
      const pts = [[-6, -12], [2, -3], [-3, -1], [6, 12]];
      const n = Math.max(1, Math.ceil(lit * (pts.length - 1)));
      g.lineStyle(5, rim, 0.6);
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= n; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.strokePath();
      g.lineStyle(2.5, color, 1);
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= n; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.strokePath();
      break;
    }
    case 'dot': {
      // A dose at full stacks: the drop, and its pips lighting round it.
      g.fillStyle(color, 0.95);
      g.fillCircle(0, 2, 6);
      g.fillTriangle(-5.2, 0, 5.2, 0, 0, -10);
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + (i / 4) * Math.PI * 2 + Math.PI / 4;
        g.fillStyle(lit >= (i + 1) / 4 ? rim : 0x2a2a2a, 0.95);
        g.fillCircle(Math.cos(a) * 13, 2 + Math.sin(a) * 13, 2.6);
      }
      break;
    }
    default: {
      // A rune: a diamond lit from within (the summoner, a root with no glyph).
      g.lineStyle(2, rim, 0.95);
      g.strokeTriangle(0, -12, 10, 0, 0, 12);
      g.strokeTriangle(0, -12, -10, 0, 0, 12);
      g.fillStyle(color, 0.9 * lit);
      g.fillCircle(0, 0, 4.5);
    }
  }
}

function mechanicFlash(b: Bodies, crash: boolean): void {
  const { scene, ev, from, to, color } = b;
  const archetype = b.player?.combatArchetype ?? null;
  const mech = mechanicColor(archetype);
  const k = b.k * (crash ? 1.35 : 1);

  // The glyph: pops, fills, flashes, lifts away.
  // Beside the body, on the side away from the target, at the shoulder: above the
  // head is the nameplate and the rhythm readout's floating word (W2-B).
  const away = Math.sign(from.x - to.x) || -1;
  const head = { x: from.x + away * 30, y: from.y - b.playerH * 0.28 };
  const glyph = scene.add.graphics({ x: head.x, y: head.y }).setDepth(DEPTH.FX + 1).setScale(0.6 * k);
  const t = { p: 0 };
  scene.tweens.add({ targets: glyph, scaleX: 1.12 * k, scaleY: 1.12 * k, duration: 120, ease: 'Back.easeOut' });
  scene.tweens.add({
    targets: t, p: 1, duration: 170, ease: 'Quad.easeOut',
    onUpdate: () => drawMechanicGlyph(glyph, archetype, t.p, mech, color),
    onComplete: () => {
      drawMechanicGlyph(glyph, archetype, 1, mech, color);
      ring(scene, head.x, head.y, mech, { from: 12 * k, scale: 2.6, width: 2, ms: 300 });
      fading(scene, glyph, 340, { y: head.y - 14 }, 140);
    },
  });

  // The weapon flares in the root's colour, sparks off in the Anvil lane's.
  const at = weaponPoint(b);
  const flare = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
  flare.fillStyle(lighten(mech, 0.6), 0.95);
  flare.fillCircle(0, 0, 8 * k);
  flare.lineStyle(2.5, color, 0.9);
  flare.strokeCircle(0, 0, 9 * k);
  fading(scene, flare, 280, { scaleX: 3, scaleY: 3 });
  burstFx(scene, 'ptx-spark', at.x, at.y, count(crash ? 10 : 6, b.sparks), 340, {
    tint: [color, lighten(color, 0.6), mech], speed: { min: 90, max: 220 }, angle: { min: 0, max: 360 },
    scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 },
  });
  // Brace and drive: the body sets its weight behind the mechanic's hit.
  posePath(scene, ev.playerId, [
    { sx: 1.08, sy: 0.9, ms: 70 },
    { sx: 1, sy: 1, ms: 260, ease: 'Back.easeOut' },
  ]);
  // The Anvil rim round the target, outside the root's own empowered ring.
  ring(scene, to.x, to.y, color, { from: 18 * k, scale: 2.4, width: 2.5, ms: 360 });

  if (crash) crashGround(b, k);
  weigh(b, crash ? 'empowered.crash' : 'empowered.mechanic-flash', to);
}

/** The crash: the ground breaks under the mechanic's hit and the target buckles. */
function crashGround(b: Bodies, k: number): void {
  const { scene, ev, to, color } = b;
  const feet = { x: to.x, y: to.y + b.targetH * 0.46 };
  const cracks = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  const t = { p: 0 };
  const seed = Math.floor(Math.random() * 1e6);
  scene.tweens.add({
    targets: t, p: 1, duration: 140, ease: 'Cubic.easeOut',
    onUpdate: () => {
      cracks.clear();
      const reach = Math.max(56, b.targetW * 0.9) * k;
      drawCracks(cracks, feet.x, feet.y, reach, t.p, 0x2a1d10, 0.9, seed, 9);
      drawCracks(cracks, feet.x, feet.y, reach * 0.88, t.p, color, 0.7, seed, 9);
    },
    onComplete: () => fading(scene, cracks, 700, {}, 300),
  });
  ring(scene, feet.x, feet.y, color, { from: 16 * k, scale: 3.6, width: 3, ms: 380, flat: true });
  dustCloud(scene, feet.x, feet.y, [0x9a8a70, 0x6e6250], 0.9 * k);
  debrisKick(scene, feet.x, feet.y, -60, [0x6e6250, 0x9a8a70, color], count(6, b.sparks), 25, 200);
  debrisKick(scene, feet.x, feet.y, -120, [0x6e6250, 0x9a8a70, color], count(6, b.sparks), 25, 200);
  if (!isBossView(scene, ev.targetId) && ev.targetId) {
    posePath(scene, ev.targetId, [
      { sx: 1.18, sy: 0.8, ms: 70 },
      { sx: 1, sy: 1, ms: 300, ease: 'Back.easeOut' },
    ]);
  }
}

// ── Affliction ───────────────────────────────────────────────────────────────

/** A drop falling off a body to the ground, with a small splash where it lands. */
export function fallingDrop(scene: GameScene, x: number, y: number, groundY: number, color: number, size: number): void {
  const drop = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  drop.fillStyle(color, 0.95);
  drop.fillCircle(0, 0, size);
  drop.fillTriangle(-size * 0.86, -size * 0.4, size * 0.86, -size * 0.4, 0, -size * 2.4);
  drop.fillStyle(lighten(color, 0.6), 0.9);
  drop.fillCircle(-size * 0.3, -size * 0.2, size * 0.32);
  scene.tweens.add({
    targets: drop, y: groundY, duration: Math.max(140, (groundY - y) * 6), ease: 'Quad.easeIn',
    onComplete: () => {
      drop.destroy();
      const splash = scene.add.graphics({ x, y: groundY }).setDepth(DEPTH.SPRITE - 1);
      splash.fillStyle(color, 0.55);
      splash.fillEllipse(0, 0, size * 3.4, size * 1.2);
      fading(scene, splash, 420, { scaleX: 1.6, scaleY: 1.3 });
    },
  });
}

/** The flinch of a body taking a heavy dose. */
function flinch(scene: GameScene, id: string | undefined, strength: number): void {
  if (!id || isBossView(scene, id)) return;
  posePath(scene, id, [
    { sx: 1 - 0.07 * strength, sy: 1 + 0.07 * strength, ms: 60 },
    { sx: 1 + 0.05 * strength, sy: 1 - 0.04 * strength, ms: 70 },
    { sx: 1, sy: 1, ms: 220, ease: 'Back.easeOut' },
  ]);
}

/** Venom thrown up off the body and falling back, with a splat under it. */
function venomBurst(b: Bodies, heavy: boolean): void {
  const { scene, to, color } = b;
  const ground = to.y + b.targetH * 0.42;
  burstFx(scene, 'ptx-dot', to.x, to.y - b.targetH * 0.1, count(heavy ? 18 : 12, b.sparks), 760, {
    tint: [color, darken(color, 0.35), lighten(color, 0.4)],
    speed: { min: 90, max: heavy ? 230 : 190 }, angle: { min: 215, max: 325 },
    scale: { start: heavy ? 1.15 : 0.95, end: 0.2 }, alpha: { start: 1, end: 0 }, gravityY: 620,
  });
  for (let i = 0; i < (heavy ? 4 : 3); i++) {
    const x = to.x + (i - 1.5) * b.targetW * 0.16;
    scene.time.delayedCall(i * 60, () => {
      if (document.hidden) return;
      fallingDrop(scene, x, to.y - b.targetH * 0.05, ground, color, (heavy ? 5.6 : 4.8) * b.k);
    });
  }
  const splat = scene.add.graphics({ x: to.x, y: ground }).setDepth(DEPTH.SPRITE - 1);
  splat.fillStyle(darken(color, 0.25), 0.5);
  splat.fillEllipse(0, 0, b.targetW * 0.7 * b.k, b.targetW * 0.22 * b.k);
  splat.setScale(0.3);
  scene.tweens.add({ targets: splat, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
  fading(scene, splat, 900, {}, 500);
}

function startDrip(b: Bodies, fx: PayloadFxKey, intensity: number): void {
  if (!b.ev.targetId) return;
  startLasting(b.ev.targetId, 'drip', performance.now(), payloadDurationMs(fx, b.ev.durationMs), intensity);
}

function heavyDrip(b: Bodies): void {
  venomBurst(b, false);
  flinch(b.scene, b.ev.targetId, 1);
  startDrip(b, 'affliction.heavy-drip', 1);
}

/** The affliction surges: drawn into the body, then out, every pip split in two. */
function doubleDose(b: Bodies): void {
  const { scene, to, color } = b;
  inhale(scene, to.x, to.y, [color, lighten(color, 0.5)], b.targetH * 0.9, 150);
  scene.time.delayedCall(150, () => {
    if (document.hidden) return;
    ring(scene, to.x, to.y, color, { from: 10 * b.k, scale: 4, width: 3, ms: 380 });
    const top = { x: to.x, y: to.y - b.targetH * 0.55 };
    for (let i = 0; i < 3; i++) {
      const x0 = top.x + (i - 1) * 11 * b.k;
      for (const dir of [-1, 1]) {
        const pip = scene.add.graphics({ x: x0, y: top.y }).setDepth(DEPTH.FX);
        pip.fillStyle(lighten(color, 0.3), 1);
        pip.fillCircle(0, 0, 3.4 * b.k);
        pip.lineStyle(1.2, darken(color, 0.5), 0.9);
        pip.strokeCircle(0, 0, 3.4 * b.k);
        scene.tweens.add({
          targets: pip, x: x0 + dir * (6 + i * 3) * b.k, y: top.y - 16 * b.k, duration: 260, ease: 'Back.easeOut',
          onComplete: () => fading(scene, pip, 300, { y: top.y - 28 * b.k }, 120),
        });
      }
    }
    venomBurst(b, true);
    flinch(scene, b.ev.targetId, 1.5);
  });
  startDrip(b, 'affliction.double-dose', 2);
  weigh(b, 'affliction.double-dose', to);
}

// ── Control ──────────────────────────────────────────────────────────────────

/**
 * Where a shackle sits on a body: a ground ellipse round the feet, wider than the
 * body so it reads past it. Shared by the clamp, the held look and the break.
 */
export function shackleGeometry(x: number, y: number, w: number, h: number): { x: number; y: number; rx: number; ry: number } {
  const rx = Math.max(22, w * 0.62);
  return { x, y: y + h * 0.44, rx, ry: rx * 0.38 };
}

/** Two chain halves fly in from the sides and lock round the feet. */
function shackleClamp(b: Bodies): void {
  const { scene, ev, to, color } = b;
  const ring0 = shackleGeometry(to.x, to.y, b.targetW, b.targetH);
  const feet = { x: ring0.x, y: ring0.y };
  const { rx } = ring0;
  for (const side of [-1, 1]) {
    const g = scene.add.graphics({ x: feet.x + side * rx * 2.2, y: feet.y - 8 }).setDepth(DEPTH.FX);
    g.lineStyle(7, 0x2b3346, 0.95);
    g.beginPath();
    g.arc(0, 0, rx * 0.9, side < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, side < 0 ? Math.PI * 1.5 : Math.PI * 0.5);
    g.strokePath();
    g.lineStyle(2.2, lighten(color, 0.4), 0.95);
    g.beginPath();
    g.arc(0, 0, rx * 0.9, side < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, side < 0 ? Math.PI * 1.5 : Math.PI * 0.5);
    g.strokePath();
    g.setScale(1, 0.4);
    scene.tweens.add({
      targets: g, x: feet.x, y: feet.y, duration: 150, ease: 'Cubic.easeIn',
      onComplete: () => g.destroy(),
    });
  }
  scene.time.delayedCall(150, () => {
    if (document.hidden) return;
    const clank = scene.add.graphics({ x: feet.x, y: feet.y }).setDepth(DEPTH.FX);
    clank.fillStyle(0xffffff, 0.9);
    clank.fillCircle(0, 0, 6);
    fading(scene, clank, 220, { scaleX: 2.6, scaleY: 2.6 });
    ring(scene, feet.x, feet.y, color, { from: rx * 0.8, scale: 1.8, width: 3, ms: 300, flat: true });
    burstFx(scene, 'ptx-spark', feet.x, feet.y, count(6, b.sparks), 300, {
      tint: [0xffffff, lighten(color, 0.4)], speed: { min: 60, max: 160 }, angle: { min: 200, max: 340 },
      scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 },
    });
    if (ev.targetId && !isBossView(scene, ev.targetId)) {
      posePath(scene, ev.targetId, [
        { sy: 0.9, sx: 1.06, ms: 60 },
        { sy: 1, sx: 1, ms: 220, ease: 'Back.easeOut' },
      ]);
    }
  });
  if (ev.targetId) {
    startLasting(ev.targetId, 'shackle', performance.now(), payloadDurationMs('control.shackle', ev.durationMs));
  }
  weigh(b, 'control.shackle', to);
}

/** The blow that takes it off its feet; the lying-down and the get-up are the aura's. */
function knockdown(b: Bodies): void {
  const { scene, ev, from, to, color } = b;
  const feet = { x: to.x, y: to.y + b.targetH * 0.4 };
  const burst = scene.add.graphics({ x: to.x, y: to.y - b.targetH * 0.1 }).setDepth(DEPTH.FX);
  burst.fillStyle(lighten(color, 0.7), 0.95);
  burst.fillCircle(0, 0, 10 * b.k);
  burst.lineStyle(3, color, 0.95);
  burst.strokeCircle(0, 0, 13 * b.k);
  fading(scene, burst, 260, { scaleX: 2.4, scaleY: 2.4 });
  scene.time.delayedCall(230, () => {
    if (document.hidden) return;
    dustCloud(scene, feet.x, feet.y, [0x9a8a70, 0x7a6e58], 0.8 * b.k);
    ring(scene, feet.x, feet.y, color, { from: 14 * b.k, scale: 3, width: 2.5, ms: 360, flat: true });
  });
  if (ev.targetId) {
    const record = startLasting(ev.targetId, 'knockdown', performance.now(), payloadDurationMs('control.knockdown', ev.durationMs));
    record.side = Math.sign(to.x - from.x) || 1;
  }
  weigh(b, 'control.knockdown', to);
}

// ── Kill chain ───────────────────────────────────────────────────────────────

/** A heal pulse up the body, and the load discharging into the hit. */
function healAndLoad(b: Bodies): void {
  const { scene, ev, from, to, color } = b;
  const feet = { x: from.x, y: from.y + b.playerH * 0.4 };
  ring(scene, feet.x, feet.y, color, { from: 12 * b.k, scale: 3.2, width: 3, ms: 460, flat: true });
  ring(scene, feet.x, feet.y, lighten(color, 0.6), { from: 8 * b.k, scale: 2.6, width: 2, ms: 380, flat: true, delay: 90 });
  for (let i = 0; i < count(8, b.sparks); i++) {
    const x = from.x + (Math.random() - 0.5) * 26 * b.k;
    const mote = scene.add.graphics({ x, y: feet.y - Math.random() * 10 }).setDepth(DEPTH.FX);
    mote.fillStyle(i % 2 ? lighten(color, 0.65) : color, 0.95);
    mote.fillRect(-1.5, -4, 3, 8);
    mote.fillRect(-4, -1.5, 8, 3);
    fading(scene, mote, 520 + Math.random() * 200, { y: from.y - b.playerH * (0.5 + Math.random() * 0.4) }, i * 30);
  }
  posePath(scene, ev.playerId, [
    { sy: 1.08, sx: 0.96, lift: 3, ms: 90 },
    { sy: 1, sx: 1, lift: 0, ms: 260, ease: 'Back.easeOut' },
  ]);
  // The load leaves the weapon and lands with the hit.
  endLasting(ev.playerId, 'loaded');
  if (ev.targetId) {
    const at = weaponPoint(b);
    const bolt = scene.add.graphics().setDepth(DEPTH.FX);
    bolt.lineStyle(6 * b.k, color, 0.35);
    bolt.lineBetween(at.x, at.y, to.x, to.y);
    bolt.lineStyle(2.5 * b.k, lighten(color, 0.7), 0.95);
    bolt.lineBetween(at.x, at.y, to.x, to.y);
    fading(scene, bolt, 200);
    const hit = scene.add.graphics({ x: to.x, y: to.y }).setDepth(DEPTH.FX);
    hit.fillStyle(lighten(color, 0.7), 0.9);
    hit.fillCircle(0, 0, 11 * b.k);
    hit.lineStyle(3, color, 0.95);
    hit.strokeCircle(0, 0, 14 * b.k);
    fading(scene, hit, 280, { scaleX: 2.2, scaleY: 2.2 });
    burstFx(scene, 'ptx-spark', to.x, to.y, count(8, b.sparks), 320, {
      tint: [color, lighten(color, 0.6)], speed: { min: 100, max: 240 }, angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 },
    });
  }
  weigh(b, 'kill-chain.heal-load', ev.targetId ? to : from);
}

/** The arming beat: the load gathering into the weapon at the kill. */
export function drawLoadGather(scene: GameScene, playerId: string): void {
  const sprite = scene.state.sprite.get(playerId);
  if (!sprite) return;
  const color = laneColor('kill-chain');
  const at = { x: sprite.x, y: sprite.y - sprite.displayHeight * 0.12 };
  inhale(scene, at.x, at.y, [color, lighten(color, 0.6)], 30, 240);
  scene.time.delayedCall(240, () => {
    if (document.hidden) return;
    ring(scene, at.x, at.y, color, { from: 6, scale: 2.4, width: 2, ms: 260 });
  });
}

// ── Technique ────────────────────────────────────────────────────────────────

/** A sigil turning BACKWARD under the player: time handed back on a Technique. */
function refundSigil(b: Bodies): void {
  const { scene, from, color } = b;
  const feet = { x: from.x, y: from.y + b.playerH * 0.4 };
  const g = scene.add.graphics().setDepth(DEPTH.SPRITE - 1);
  const t = { p: 0 };
  scene.tweens.add({
    targets: t, p: 1, duration: 420, ease: 'Quad.easeOut',
    onUpdate: () => {
      g.clear();
      drawSigil(g, feet.x, feet.y, 22 * b.k, Math.min(1, t.p * 1.4), color, 0.85, -t.p * 2.6, 5, 0.42);
    },
    onComplete: () => fading(scene, g, 260),
  });
  for (let i = 0; i < count(5, b.sparks); i++) {
    const a = (i / 5) * Math.PI * 2;
    const mote = scene.add.graphics({ x: feet.x + Math.cos(a) * 20 * b.k, y: feet.y + Math.sin(a) * 8 * b.k })
      .setDepth(DEPTH.FX);
    mote.fillStyle(lighten(color, 0.5), 0.95);
    mote.fillCircle(0, 0, 2.4);
    fading(scene, mote, 520, { y: feet.y - b.playerH * 0.7 }, 60 + i * 40);
  }
}
