import type { CombatEvent, PlayerView } from '@mmo-idle/shared';
import { combatLog } from '../../combatLog';
import type { RenderState } from '../../render/state';
import { applyLunge } from '../../render/interpolation';
import type { GameScene } from './GameScene';
import { getDotPath } from './fx/dot';
import { activateLaserBeam } from './fx/laser';
import { playOneShotEffect } from './fx/particles';

export function processCombatEventViaApplier(scene: GameScene, state: RenderState, ev: CombatEvent): void {
  if (ev.playerId !== scene.myId) return;

  if (ev.kind === 'player-hit') {
    combatLog.push('damage-out', `${ev.targetName} -${ev.damage}`);
    if (ev.empowered) combatLog.push('empowered', `Empowered strike -> ${ev.targetName}`);
    if (ev.execution) combatLog.push('execution', `Execution strike -> ${ev.targetName}`);

    const ownSprite = state.ownId ? state.sprite.get(state.ownId) : undefined;
    const targetSprite = state.sprite.get(ev.targetId);
    const player = state.ownId ? (state.view.get(state.ownId) as PlayerView | undefined) : undefined;
    const targetInterp = state.interpolation.get(ev.targetId);

    if (ownSprite && targetSprite && player) {
      const dotPath = player.combatArchetype === 'dot' ? getDotPath(player) : undefined;
      const targetSpriteObj = state.sprite.get(ev.targetId);
      const bossScale = targetSpriteObj && Math.max(targetSpriteObj.displayWidth, targetSpriteObj.displayHeight) > 64 ? 1.33 : 1;
      const targetEffectScale = 1.5 * bossScale;
      const isLaser = player.combatArchetype === 'reload' && (player.passives['reload.laser'] ?? 0) > 0;
      if (isLaser) {
        activateLaserBeam(scene, ev.targetId);
      } else {
        scene.spawnAttackEffect(
          player.attackStyle,
          { x: ownSprite.x, y: ownSprite.y },
          { x: targetSprite.x, y: targetSprite.y },
          {
            empowered: ev.empowered,
            execution: ev.execution,
            archetype: player.combatArchetype ?? undefined,
            dotPath,
          },
        );
      }
      for (const effectId of ev.effects ?? []) {
        playOneShotEffect(scene, effectId, { x: targetSprite.x, y: targetSprite.y }, { scale: targetEffectScale });
      }
      if (!isLaser && player.attackRange <= 150 && state.ownId && targetInterp) {
        applyLunge(state, state.ownId, { ...targetInterp.base }, scene);
      }
    }
  }

  if (ev.kind === 'player-kill') {
    combatLog.push('kill', `${ev.targetName} defeated`);
  }
}
