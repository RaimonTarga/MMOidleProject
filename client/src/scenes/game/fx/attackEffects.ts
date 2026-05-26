import { GAME_CONFIG, type CombatArchetype, type Vec2 } from '@mmo-idle/shared';
import type { GameScene } from '../GameScene';
import { fxFire, fxFrost, fxImpact, fxMagic, fxPoison, fxSlash } from './basic';
import { fxFireFlame, fxFrostSnowflake, fxPoisonSmog, type DotPath } from './dot';
import { fxLightning } from './energy';
import { fxGunshot } from './laser';
import { fxVoid } from './voidFx';

export interface AttackEffectFlags {
  empowered?: boolean;
  execution?: boolean;
  archetype?: CombatArchetype;
  dotPath?: DotPath;
}

export function fxAoeRing(scene: GameScene, pos: Vec2, radius: number, color: number): void {
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

export function spawnAttackEffect(
  scene: GameScene,
  style: string,
  from: Vec2,
  to: Vec2,
  flags?: AttackEffectFlags,
): void {
  const empowered = flags?.empowered ?? false;
  const execution = flags?.execution ?? false;
  const archetype = flags?.archetype;
  const dotPath = flags?.dotPath;
  const fromX = from.x;
  const fromY = from.y;
  const toX = to.x;
  const toY = to.y;

  if (empowered || execution) {
    const ringColor = archetype === 'cadence' ? 0x4499ff
      : archetype === 'cooldown' ? 0xddeeff
      : archetype === 'energy' ? 0x88aaff
      : archetype === 'reload' ? 0xffeedd
      : 0xffdd22;
    fxAoeRing(scene, to, GAME_CONFIG.EMPOWERED_AOE_RADIUS, ringColor);
  }

  if (archetype === 'cadence') return fxSlash(scene, fromX, fromY, toX, toY, empowered, true);
  if (archetype === 'cooldown') return fxImpact(scene, toX, toY, execution);
  if (archetype === 'reload') return fxGunshot(scene, fromX, fromY, toX, toY, empowered);
  if (archetype === 'energy') return fxLightning(scene, fromX, fromY, toX, toY, empowered);
  if (archetype === 'dot') {
    switch (dotPath) {
      case 'fire': return fxFireFlame(scene, toX, toY, empowered);
      case 'frost': return fxFrostSnowflake(scene, toX, toY, empowered);
      default: return fxPoisonSmog(scene, toX, toY, empowered);
    }
  }

  switch (style) {
    case 'slash': return fxSlash(scene, fromX, fromY, toX, toY, empowered);
    case 'poison': return fxPoison(scene, toX, toY);
    case 'magic': return fxMagic(scene, fromX, fromY, toX, toY);
    case 'frost': return fxFrost(scene, toX, toY);
    case 'fire': return fxFire(scene, toX, toY);
    case 'void': return fxVoid(scene, toX, toY);
    case 'impact':
    default: return fxImpact(scene, toX, toY, execution);
  }
}
