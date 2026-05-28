import type { PlayerView } from "@mmo-idle/shared";
import { isRangedPlayerView } from "@mmo-idle/shared";
import { getDefaultStore } from "jotai";
import { autoPathAtom, setAutoPath } from "../hud/atoms";
import { combatLog } from "../combatLog";
import type { RenderState } from "./state";
import type { GameScene } from "../scenes/GameScene";
import {
  applySpriteTint,
  ensureSprite,
  resetSpriteTint,
  updateSpriteFrame,
} from "./sprites";
import { ensureShadow } from "./shadows";
import { ensureLabel } from "./labels";
import { ensureHpBar } from "./healthBars";
import { ensureCdBar } from "./cooldownBars";
import { applyLunge } from "./interpolation";
import { spawnAttackEffect } from "./combatFx";
import { getDotPath } from "../fx/dot";
import { spawnDamageNumber } from "../fx/particles";
import { flashShiftTint, spawnFlashAttackAfterimage } from "./movementEffects";

// Server position is authoritative; the client extrapolates ahead toward the
// motion target between 5 Hz snapshots. Beyond this error the prediction has
// diverged (rejected move, dropped packet) — snap rather than glide-correct.
const RECONCILE_SNAP_SQ = 220 * 220;

export function upsertPlayer(
  state: RenderState,
  player: PlayerView,
  scene: GameScene,
): void {
  const isOwn = player.id === scene.myId;
  const isNew = !state.sprite.has(player.id);

  if (isNew) {
    state.ids.add(player.id);
    state.kind.set(player.id, "player");
    state.view.set(player.id, player);

    state.spriteMeta.set(player.id, {
      currentFrame: null,
      shadowLevel: player.playerTier,
      barOffsetY: 40,
      isOwn,
    });

    state.transform.set(player.id, {
      pos: { ...player.pos },
      target: { ...player.target },
      speed: player.speed,
    });
    state.interpolation.set(player.id, {
      base: { ...player.pos },
      lungeOffset: { x: 0, y: 0 },
    });

    const color = isOwn ? 0x44ff88 : 0x4488ff;
    ensureShadow(state, player.id, player.pos, scene, {
      playerTier: player.playerTier,
    });
    ensureSprite(state, player.id, player, scene, {
      displayW: 64,
      displayH: 64,
      fallbackColor: color,
      isPlayer: true,
    });
    const sprite = state.sprite.get(player.id);
    const tint = flashShiftTint(player);
    if (sprite && tint !== null) applySpriteTint(sprite, tint);
    ensureLabel(state, player.id, player, scene);
    ensureHpBar(state, player.id, scene);
    ensureCdBar(state, player.id, scene);

    if (isOwn) {
      state.ownId = player.id;
      state.ownNodeId = player.nodeId;
      scene.cameraTarget.setPosition(player.pos.x, player.pos.y);
      scene.cameras.main.startFollow(scene.cameraTarget, true, 0.1, 0.1);
    }
    return;
  }

  const prev = state.view.get(player.id) as PlayerView | undefined;
  const prevAttackAt = prev?.lastAttackAt ?? 0;
  const prevHp = prev?.hp ?? player.hp;
  const prevTotalShield =
    prev?.shields.reduce((sum, s) => sum + s.amount, 0) ?? 0;

  if (isOwn && player.nodeId !== state.ownNodeId) {
    const interp = state.interpolation.get(player.id);
    if (interp) {
      interp.base = { ...player.pos };
    }
    const sprite = state.sprite.get(player.id);
    sprite?.setPosition(player.pos.x, player.pos.y);

    // Trim the navigation route display as the server walks us across nodes;
    // clear it on arrival. Movement itself is owned by the server.
    const store = getDefaultStore();
    const navPath = store.get(autoPathAtom);
    if (navPath && navPath.length > 0) {
      const idx = navPath.indexOf(player.nodeId);
      const remaining = idx >= 0 ? navPath.slice(idx + 1) : [];
      setAutoPath(remaining.length > 0 ? remaining : null);
    }
  }

  const color = isOwn ? 0x44ff88 : 0x4488ff;
  updateSpriteFrame(state, player.id, player, scene, {
    displayW: 64,
    displayH: 64,
    fallbackColor: color,
    isPlayer: true,
  });
  const sprite = state.sprite.get(player.id);
  const tint = flashShiftTint(player);
  if (sprite) {
    if (tint !== null) {
      applySpriteTint(sprite, tint);
    } else {
      resetSpriteTint(sprite, color);
    }
    if (
      isOwn &&
      tint !== null &&
      player.lastAttackAt > prevAttackAt &&
      (player.summonsMinions ?? 0) === 0
    ) {
      spawnFlashAttackAfterimage(state, player, scene);
    }
  }

  state.view.set(player.id, player);
  const transform = state.transform.get(player.id);
  if (transform) {
    transform.target = { ...player.target };
    transform.speed = player.speed;
  }

  if (isOwn) {
    const interp = state.interpolation.get(player.id);
    if (interp) {
      const ex = player.pos.x - interp.base.x;
      const ey = player.pos.y - interp.base.y;
      if (ex * ex + ey * ey > RECONCILE_SNAP_SQ) {
        interp.base.x = player.pos.x;
        interp.base.y = player.pos.y;
      }
    }
  }

  if (player.hp < prevHp) {
    const sprite = state.sprite.get(player.id);
    const meta = state.spriteMeta.get(player.id);
    if (sprite && meta) {
      const dmgColor = isOwn ? "#ff4444" : "#ff8844";
      spawnDamageNumber(
        scene,
        { x: sprite.x, y: sprite.y },
        meta.barOffsetY,
        Math.round(prevHp - player.hp),
        dmgColor,
      );
      if (isOwn)
        combatLog.push(
          "damage-in",
          `Took ${Math.round(prevHp - player.hp)} damage`,
        );
    }
  }

  if (isOwn && player.hp > prevHp && prevHp > 0) {
    const healed = Math.round(player.hp - prevHp);
    if (healed >= 1) combatLog.push("heal", `Recovered ${healed} HP`);
  }

  if (isOwn) {
    const newTotalShield = player.shields.reduce((sum, s) => sum + s.amount, 0);
    if (newTotalShield > prevTotalShield) {
      combatLog.push(
        "shield",
        `Shield +${Math.round(newTotalShield - prevTotalShield)}`,
      );
    }
  }

  if (
    !isOwn &&
    (player.summonsMinions ?? 0) === 0 &&
    player.lastAttackAt > prevAttackAt &&
    player.attackTargetId
  ) {
    const ownSprite = state.sprite.get(player.id);
    const targetInterp = state.interpolation.get(player.attackTargetId);
    const targetSprite = state.sprite.get(player.attackTargetId);
    if (ownSprite && targetInterp && targetSprite) {
      spawnAttackEffect(
        scene,
        player.attackStyle,
        { x: ownSprite.x, y: ownSprite.y },
        { x: targetSprite.x, y: targetSprite.y },
        {
          empowered: false,
          execution: false,
          archetype: player.combatArchetype ?? undefined,
          dotPath:
            player.combatArchetype === "dot" ? getDotPath(player) : undefined,
        },
      );
      if (!isRangedPlayerView(player)) {
        applyLunge(state, player.id, { ...targetInterp.base }, scene);
      }
    }
  }

  if (isOwn) {
    const moving =
      player.pos.x !== player.target.x || player.pos.y !== player.target.y;
    if (
      moving ||
      !player.attackTargetId ||
      player.attackTargetId !== scene.flashCameraHoldTargetId
    ) {
      scene.flashCameraHold = false;
      if (moving || !player.attackTargetId)
        scene.flashCameraHoldTargetId = null;
    }
    state.ownNodeId = player.nodeId;
    scene.autoMode = player.auto;
  }
}
