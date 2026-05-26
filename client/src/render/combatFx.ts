import { GAME_CONFIG, type CombatArchetype, type CombatEvent, type PlayerView, type Vec2 } from '@mmo-idle/shared';
import { combatLog } from '../combatLog';
import { activateLaserBeam } from '../fx/laser';
import { playOneShotEffect } from '../fx/particles';
import { getDotPath, type DotPath } from '../fx/dot';
import { fxSlash } from '../fx/slash';
import { fxImpact } from '../fx/impact';
import { fxGunshot } from '../fx/gunshot';
import { fxLightning } from '../fx/lightning';
import { fxFireFlame } from '../fx/dotFire';
import { fxFrostSnowflake } from '../fx/dotFrost';
import { fxPoisonSmog } from '../fx/dotPoison';
import { fxPoison } from '../fx/poison';
import { fxMagic } from '../fx/magic';
import { fxFrost } from '../fx/frost';
import { fxFire } from '../fx/fire';
import { fxVoid } from '../fx/voidFx';
import type { GameScene } from '../scenes/GameScene';
import { applyLunge } from './interpolation';
import type { RenderState } from './state';

type NonNullArchetype = Exclude<CombatArchetype, null>;
type PlayerHitEvent = CombatEvent & { kind: 'player-hit' };

interface AttackFxArgs {
  scene: GameScene;
  ev: PlayerHitEvent;
  player: PlayerView;
  from: Vec2;
  to: Vec2;
  dotPath?: DotPath;
}

type AttackFxFn = (args: AttackFxArgs) => void;

function fxAoeRing(scene: GameScene, pos: Vec2, radius: number, color: number): void {
  const ring = scene.add.graphics({ x: pos.x, y: pos.y }).setDepth(11);
  ring.lineStyle(2.5, color, 0.65);
  ring.strokeCircle(0, 0, 1);
  scene.tweens.add({
    targets: ring,
    scaleX: radius,
    scaleY: radius,
    alpha: 0,
    duration: 420,
    ease: 'Power2',
    onComplete: () => ring.destroy(),
  });
}

function playEmpoweredRing(args: AttackFxArgs): void {
  const { scene, ev, player, to } = args;
  if (!ev.empowered && !ev.execution) return;
  const ringColor = player.combatArchetype === 'cadence' ? 0x4499ff
    : player.combatArchetype === 'cooldown' ? 0xddeeff
    : player.combatArchetype === 'energy' ? 0x88aaff
    : player.combatArchetype === 'reload' ? 0xffeedd
    : 0xffdd22;
  fxAoeRing(scene, to, GAME_CONFIG.EMPOWERED_AOE_RADIUS, ringColor);
}

const ATTACK_FX_BY_ARCHETYPE: Record<NonNullArchetype, AttackFxFn> = {
  cadence: ({ scene, ev, from, to }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered, true),
  cooldown: ({ scene, ev, to }) =>
    fxImpact(scene, to.x, to.y, ev.execution),
  reload: ({ scene, ev, from, to }) =>
    fxGunshot(scene, from.x, from.y, to.x, to.y, ev.empowered),
  energy: ({ scene, ev, from, to }) =>
    fxLightning(scene, from.x, from.y, to.x, to.y, ev.empowered),
  dot: ({ scene, ev, to, dotPath }) => {
    switch (dotPath) {
      case 'fire': return fxFireFlame(scene, to.x, to.y, ev.empowered);
      case 'frost': return fxFrostSnowflake(scene, to.x, to.y, ev.empowered);
      default: return fxPoisonSmog(scene, to.x, to.y, ev.empowered);
    }
  },
};

const ATTACK_FX_BY_STYLE: Record<string, AttackFxFn> = {
  slash:  ({ scene, ev, from, to }) => fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered),
  poison: ({ scene, to }) => fxPoison(scene, to.x, to.y),
  magic:  ({ scene, from, to }) => fxMagic(scene, from.x, from.y, to.x, to.y),
  frost:  ({ scene, to }) => fxFrost(scene, to.x, to.y),
  fire:   ({ scene, to }) => fxFire(scene, to.x, to.y),
  void:   ({ scene, to }) => fxVoid(scene, to.x, to.y),
  impact: ({ scene, ev, to }) => fxImpact(scene, to.x, to.y, ev.execution),
};

export function dispatchCombatEvent(state: RenderState, ev: CombatEvent, scene: GameScene): void {
  if (ev.playerId !== scene.myId) return;

  if (ev.kind === 'player-hit') {
    combatLog.push('damage-out', `${ev.targetName} -${ev.damage}`);
    if (ev.empowered) combatLog.push('empowered', `Empowered strike -> ${ev.targetName}`);
    if (ev.execution) combatLog.push('execution', `Execution strike -> ${ev.targetName}`);
    runFxForAttackStyle(state, ev, scene);
  }

  if (ev.kind === 'player-kill') {
    combatLog.push('kill', `${ev.targetName} defeated`);
  }
}

function runFxForAttackStyle(
  state: RenderState,
  ev: PlayerHitEvent,
  scene: GameScene,
): void {
  const ownSprite = state.ownId ? state.sprite.get(state.ownId) : undefined;
  const targetSprite = state.sprite.get(ev.targetId);
  const player = state.ownId ? (state.view.get(state.ownId) as PlayerView | undefined) : undefined;
  const targetInterp = state.interpolation.get(ev.targetId);

  if (!ownSprite || !targetSprite || !player) return;

  const dotPath = player.combatArchetype === 'dot' ? getDotPath(player) : undefined;
  const bossScale = Math.max(targetSprite.displayWidth, targetSprite.displayHeight) > 64 ? 1.33 : 1;
  const targetEffectScale = 1.5 * bossScale;
  const isLaser = player.combatArchetype === 'reload' && (player.passives['reload.laser'] ?? 0) > 0;

  const from = { x: ownSprite.x, y: ownSprite.y };
  const to = { x: targetSprite.x, y: targetSprite.y };
  const args: AttackFxArgs = { scene, ev, player, from, to, dotPath };

  if (isLaser) {
    activateLaserBeam(state, scene, ev.targetId);
  } else {
    playEmpoweredRing(args);
    const archetype = player.combatArchetype;
    if (archetype && ATTACK_FX_BY_ARCHETYPE[archetype]) {
      ATTACK_FX_BY_ARCHETYPE[archetype](args);
    } else {
      const styleFn = ATTACK_FX_BY_STYLE[player.attackStyle] ?? ATTACK_FX_BY_STYLE.impact;
      styleFn(args);
    }
  }

  for (const effectId of ev.effects ?? []) {
    playOneShotEffect(scene, effectId, to, { scale: targetEffectScale });
  }

  if (!isLaser && player.attackRange <= 150 && state.ownId && targetInterp) {
    applyLunge(state, state.ownId, { ...targetInterp.base }, scene);
  }
}

/** Style-based FX for snapshot-driven attacks (other players / monsters). */
export function spawnAttackEffect(
  scene: GameScene,
  style: string,
  from: Vec2,
  to: Vec2,
  flags?: {
    empowered?: boolean;
    execution?: boolean;
    archetype?: CombatArchetype;
    dotPath?: DotPath;
  },
): void {
  const ev: PlayerHitEvent = {
    kind: 'player-hit',
    playerId: scene.myId,
    targetId: '',
    targetName: '',
    damage: 0,
    empowered: flags?.empowered ?? false,
    execution: flags?.execution ?? false,
  };
  const player = {
    attackStyle: style,
    combatArchetype: flags?.archetype ?? null,
  } as PlayerView;
  const args: AttackFxArgs = {
    scene,
    ev,
    player,
    from,
    to,
    dotPath: flags?.dotPath,
  };

  playEmpoweredRing(args);
  const archetype = flags?.archetype;
  if (archetype && ATTACK_FX_BY_ARCHETYPE[archetype]) {
    ATTACK_FX_BY_ARCHETYPE[archetype](args);
  } else {
    const styleFn = ATTACK_FX_BY_STYLE[style] ?? ATTACK_FX_BY_STYLE.impact;
    styleFn(args);
  }
}
