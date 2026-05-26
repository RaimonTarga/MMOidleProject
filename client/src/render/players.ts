import type { PlayerView } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { combatLog } from '../combatLog';
import { getPlayerShadowOffset } from '../sprites';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { ensureSprite, updateSpriteFrame } from './sprites';
import { ensureShadow } from './shadows';
import { ensureLabel } from './labels';
import { ensureHpBar } from './healthBars';
import { ensureCdBar } from './cooldownBars';
import { applyLunge } from './interpolation';

export function upsertPlayer(
  state: RenderState,
  player: PlayerView,
  scene: GameScene,
): void {
  const isOwn = player.id === scene.myId;
  const isNew = !state.sprite.has(player.id);

  if (isNew) {
    state.ids.add(player.id);
    state.kind.set(player.id, 'player');
    state.view.set(player.id, player);

    const shadowOffsetY = getPlayerShadowOffset();
    state.spriteMeta.set(player.id, {
      currentFrame: null,
      shadowOffsetY,
      shadowLevel: player.playerTier,
      barOffsetY: 40,
      isOwn,
    });

    state.transform.set(player.id, {
      pos:    { ...player.pos },
      target: { ...player.target },
      speed:  player.speed,
    });
    state.interpolation.set(player.id, {
      base:        { ...player.pos },
      lungeOffset: { x: 0, y: 0 },
    });

    const color = isOwn ? 0x44ff88 : 0x4488ff;
    ensureShadow(state, player.id, player.pos, shadowOffsetY, scene, {
      width: 52,
      height: 14,
      depth: 3,
      playerTier: player.playerTier,
    });
    ensureSprite(state, player.id, player, scene, {
      displayW: 64,
      displayH: 64,
      fallbackColor: color,
      depth: 4,
      isPlayer: true,
    });
    ensureLabel(state, player.id, player, scene);
    ensureHpBar(state, player.id, scene, 5);
    ensureCdBar(state, player.id, scene, 5);

    if (isOwn) {
      state.ownId = player.id;
      state.ownNodeId = player.nodeId;
      scene.cameraTarget.setPosition(player.pos.x, player.pos.y);
      scene.cameras.main.startFollow(scene.cameraTarget, true, 0.1, 0.1);
      hudBus.emit({ player });
    }
    return;
  }

  const prev = state.view.get(player.id) as PlayerView | undefined;
  const prevAttackAt = prev?.lastAttackAt ?? 0;
  const prevHp = prev?.hp ?? player.hp;
  const prevTotalShield = prev?.shields.reduce((sum, s) => sum + s.amount, 0) ?? 0;

  if (isOwn && player.nodeId !== state.ownNodeId) {
    const interp = state.interpolation.get(player.id);
    if (interp) {
      interp.base = { ...player.pos };
    }
    const sprite = state.sprite.get(player.id);
    sprite?.setPosition(player.pos.x, player.pos.y);

    if (scene.autoPath.length > 0) {
      if (scene.autoPath[0] === player.nodeId) {
        scene.autoPath.shift();
        if (scene.autoPath.length > 0) {
          hudBus.emit({ autoPath: [...scene.autoPath] });
          scene.sendAutoPathMove(player.nodeId);
        } else {
          scene.cancelAutoPath();
        }
      } else {
        scene.cancelAutoPath();
      }
    }
  }

  const color = isOwn ? 0x44ff88 : 0x4488ff;
  updateSpriteFrame(state, player.id, player, scene, {
    displayW: 64,
    displayH: 64,
    fallbackColor: color,
    depth: 4,
    isPlayer: true,
  });

  state.view.set(player.id, player);
  const transform = state.transform.get(player.id);
  if (transform) {
    transform.target = { ...player.target };
    transform.speed = player.speed;
  }

  if (player.hp < prevHp) {
    const sprite = state.sprite.get(player.id);
    const meta = state.spriteMeta.get(player.id);
    if (sprite && meta) {
      const dmgColor = isOwn ? '#ff4444' : '#ff8844';
      scene.spawnDamageNumber(
        { x: sprite.x, y: sprite.y },
        meta.barOffsetY,
        Math.round(prevHp - player.hp),
        dmgColor,
      );
      if (isOwn) combatLog.push('damage-in', `Took ${Math.round(prevHp - player.hp)} damage`);
    }
  }

  if (isOwn && player.hp > prevHp && prevHp > 0) {
    const healed = Math.round(player.hp - prevHp);
    if (healed >= 1) combatLog.push('heal', `Recovered ${healed} HP`);
  }

  if (isOwn) {
    const newTotalShield = player.shields.reduce((sum, s) => sum + s.amount, 0);
    if (newTotalShield > prevTotalShield) {
      combatLog.push('shield', `Shield +${Math.round(newTotalShield - prevTotalShield)}`);
    }
  }

  if (!isOwn && player.lastAttackAt > prevAttackAt && player.attackTargetId) {
    const ownSprite = state.sprite.get(player.id);
    const targetInterp = state.interpolation.get(player.attackTargetId);
    const targetSprite = state.sprite.get(player.attackTargetId);
    if (ownSprite && targetInterp && targetSprite) {
      scene.spawnAttackEffect(
        player.attackStyle,
        { x: ownSprite.x, y: ownSprite.y },
        { x: targetSprite.x, y: targetSprite.y },
        {
          empowered: false,
          execution: false,
          archetype: player.combatArchetype ?? undefined,
        },
      );
      if (player.attackRange <= 150) {
        applyLunge(state, player.id, { ...targetInterp.base }, scene);
      }
    }
  }

  if (isOwn) {
    state.ownNodeId = player.nodeId;
    scene.autoMode = player.auto;
    hudBus.emit({ player });
  }
}
