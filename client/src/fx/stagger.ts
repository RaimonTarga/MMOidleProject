import type { GameScene } from '../scenes/GameScene';
import { fxStunningStrike } from './stunningStrike';

/**
 * Boss recovery/stagger keeps its event-level name, but uses the same hard-stun
 * presentation as the player's Stunning Strike. Keeping this wrapper means the
 * server's `boss-fx:stagger` contract stays stable while there is only one visual
 * language for the stunned state: the concussion flash, rings, and orbiting stars.
 */
export function fxStagger(scene: GameScene, x: number, y: number): void {
  fxStunningStrike(scene, x, y);
}
