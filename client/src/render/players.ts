import type { PlayerView } from "@mmo-idle/shared";
import { isRangedPlayerView } from "@mmo-idle/shared";
import { getDefaultStore } from "jotai";
import { autoPathAtom, setAutoPath } from "../hud/atoms";
import type { RenderState } from "./state";
import type { GameScene } from "../scenes/GameScene";
import {
  applySpriteTint,
  ensureSprite,
  resetSpriteTint,
  updateSpriteFrame,
} from "./sprites";
import { ensureShadow } from "./shadows";
import {
  ensureLabel,
  updateLabelForGrave,
  updateLabelForLivePlayer,
} from "./labels";
import { ensureHpBar, destroyHpBar } from "./healthBars";
import { ensureCdBar, destroyCdBar } from "./cooldownBars";
import { GRAVE_DISPLAY_H, GRAVE_LABEL_OFFSET_Y } from "../sprites";
import { applyLunge } from "./interpolation";
import { nodeToScene } from "./sceneCoords";
import { getPendingStop, isOwnHeadingClientOwned, clearPendingStop } from "../input/moveOwnership";
import { cancelActiveMove } from "../input/movement";
import { isServerOwnedNavigation } from "../scenes/game/mapTransition";
import {
  clearOwnMovePath,
  reconcileOwnPathFromServer,
} from "../input/pathPrediction";
import { spawnAttackEffect } from "./combatFx";
import { getDotPath } from "../fx/dot";
import { spawnDamageNumber } from "../fx/particles";
import { resolvePlayerDamageStyle } from "./damageNumberStyle";
import { flashShiftTint, spawnFlashAttackAfterimage } from "./movementEffects";
import { auraTint } from "../fx/aura";

// Server position is authoritative; the client extrapolates ahead toward the
// motion target between 5 Hz snapshots. Beyond this error the prediction has
// diverged (rejected move, dropped packet) — snap rather than glide-correct.
const RECONCILE_SNAP_SQ = 220 * 220;

/**
 * Combined movement-speed multiplier from any movement-affecting buffs the
 * player has (slow, root, trample boon, …). Mirrors the server's
 * `slowMult * trampleMult` so client extrapolation runs at the same effective
 * speed. Buffs without a `speedMult` (the common case) are ignored.
 */
function moveSpeedMult(player: PlayerView): number {
  let mult = 1;
  for (const buff of player.activeBuffs) {
    if (buff.speedMult !== undefined) mult *= buff.speedMult;
  }
  return mult;
}

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
      barOffsetY: player.isDead ? GRAVE_LABEL_OFFSET_Y : 40,
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
    if (!player.isDead) {
      ensureShadow(state, player.id, player.pos, scene, {
        playerTier: player.playerTier,
      });
    }
    ensureSprite(state, player.id, player, scene, {
      displayW: 64,
      displayH: 64,
      fallbackColor: color,
      isPlayer: true,
    });
    if (player.isDead) {
      updateSpriteFrame(state, player.id, player, scene, {
        displayW: 80,
        displayH: GRAVE_DISPLAY_H,
        fallbackColor: color,
        isPlayer: true,
      });
    }
    const sprite = state.sprite.get(player.id);
    if (!player.isDead) {
      const tint = flashShiftTint(player) ?? auraTint(player);
      if (sprite && tint !== null) applySpriteTint(sprite, tint);
    }
    ensureLabel(state, player.id, player, scene);
    if (player.isDead) {
      updateLabelForGrave(state, player.id, player, scene);
      destroyHpBar(state, player.id);
      destroyCdBar(state, player.id);
    } else {
      ensureHpBar(state, player.id, scene);
      ensureCdBar(state, player.id, scene);
    }

    if (isOwn) {
      state.ownId = player.id;
      state.ownNodeId = player.nodeId;
      if (!scene.transitioning) {
        const scenePos = nodeToScene(player.pos.x, player.pos.y);
        scene.cameraTarget.setPosition(scenePos.x, scenePos.y);
        scene.cameraScrollReady = false;
      }
    }
    return;
  }

  const prev = state.view.get(player.id) as PlayerView | undefined;
  const wasDead = prev?.isDead ?? false;
  const prevAttackAt = prev?.lastAttackAt ?? 0;
  const prevHp = prev?.hp ?? player.hp;

  if (player.isDead) {
    const meta = state.spriteMeta.get(player.id);
    if (meta) meta.barOffsetY = GRAVE_LABEL_OFFSET_Y;
    updateSpriteFrame(state, player.id, player, scene, {
      displayW: 80,
      displayH: GRAVE_DISPLAY_H,
      fallbackColor: isOwn ? 0x44ff88 : 0x4488ff,
      isPlayer: true,
    });
    ensureLabel(state, player.id, player, scene);
    updateLabelForGrave(state, player.id, player, scene);
    destroyHpBar(state, player.id);
    destroyCdBar(state, player.id);
    state.view.set(player.id, player);
    const interp = state.interpolation.get(player.id);
    if (interp) {
      interp.base = { ...player.pos };
      interp.lungeOffset = { x: 0, y: 0 };
    }
    return;
  }

  if (wasDead) {
    const meta = state.spriteMeta.get(player.id);
    if (meta) meta.barOffsetY = 40;
    ensureShadow(state, player.id, player.pos, scene, {
      playerTier: player.playerTier,
    });
    ensureHpBar(state, player.id, scene);
    ensureCdBar(state, player.id, scene);
    updateLabelForLivePlayer(state, player.id, player, scene);
  }

  if (isOwn && player.nodeId !== state.ownNodeId) {
    clearPendingStop();
    const store = getDefaultStore();
    const navPathBefore = store.get(autoPathAtom);
    if (!scene.transitioning && !isServerOwnedNavigation(scene, navPathBefore)) {
      cancelActiveMove(scene);
    }
    state.ownNodeId = player.nodeId;
    const interp = state.interpolation.get(player.id);
    if (interp) {
      interp.base = { ...player.pos };
    }
    const sprite = state.sprite.get(player.id);
    // Place the sprite at the authoritative entry position in the new node; the
    // map slide camera pans to it while server-authoritative interpolation keeps
    // the player in sync across the transition.
    const scenePos = nodeToScene(player.pos.x, player.pos.y);
    sprite?.setPosition(scenePos.x, scenePos.y);

    // Trim the navigation route display as the server walks us across nodes;
    // clear it on arrival. Movement itself is owned by the server.
    const navPath = navPathBefore;
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
  // Flash shift tint takes priority; otherwise a transformation aura (e.g. Surge)
  // tints the sprite to match its glow.
  const tint = flashShiftTint(player) ?? auraTint(player);
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
    transform.pos = { ...player.pos };
    transform.speed = player.speed * moveSpeedMult(player);
    // Fix #1: while the client owns the own player's heading — active
    // keyboard/gamepad movement OR a sent-but-unconfirmed stop — the server's
    // `player.target` is ~1 RTT stale, so overwriting it here would yank the
    // predicted sprite toward the old heading (mid-walk) or let the lagging
    // authoritative state drive then snap it back (the "backtrack on stop").
    // Other players, and the own player under server-driven movement
    // (auto/traverse/follow/knockback) or click-to-move, take the server target.
    // During a map slide the heading is server-driven, so the own player tracks
    // the authoritative target and stays in sync across the transition.
    const clientOwnsHeading =
      isOwn && isOwnHeadingClientOwned() && !scene.transitioning;
    if (!clientOwnsHeading) {
      const interp = state.interpolation.get(player.id);
      const from = interp ? { x: interp.base.x, y: interp.base.y } : player.pos;
      // Click-to-move owns a client path toward `ownPathGoal`. Auto-combat and
      // other server-driven motion expose only the next motion endpoint in
      // `player.target` — replanning a full A* to that point every 5 Hz delta
      // clears waypoints and often fails against trees, freezing the sprite while
      // the server keeps moving.
      if (isOwn && state.ownPathGoal) {
        transform.target = reconcileOwnPathFromServer(
          scene,
          from,
          state.ownPathGoal,
        );
      } else {
        if (isOwn) clearOwnMovePath(state);
        transform.target = { x: player.target.x, y: player.target.y };
      }
    }
  }

  if (isOwn && !scene.transitioning) {
    const interp = state.interpolation.get(player.id);
    if (interp) {
      const ex = player.pos.x - interp.base.x;
      const ey = player.pos.y - interp.base.y;
      if (ex * ex + ey * ey > RECONCILE_SNAP_SQ) {
        // lagging authoritative position; a hard snap back to it would be the
        // visible backtrack. Suppress only the BACKWARD snap (server still
        // behind, along the path to the stop) — forward/perpendicular desyncs
        // (lag spike, rejected move) still snap.
        const ps = getPendingStop();
        let backwardStopSnap = false;
        if (ps) {
          const ax = ps.x - player.pos.x;
          const ay = ps.y - player.pos.y;
          // ex,ey = pos − base. base ahead toward stop ⇒ (pos−base)·(stop−pos) < 0.
          if (ex * ax + ey * ay < 0) backwardStopSnap = true;
        }
        if (!backwardStopSnap) {
          interp.base.x = player.pos.x;
          interp.base.y = player.pos.y;
        }
      }
    }
  }

  updateLabelForLivePlayer(state, player.id, player, scene);

  if (player.hp < prevHp) {
    const sprite = state.sprite.get(player.id);
    const meta = state.spriteMeta.get(player.id);
    if (sprite && meta) {
      const { color, style } = resolvePlayerDamageStyle(
        state.damageStyleHints.get(player.id),
        isOwn ? "#ff4444" : "#ff8844",
      );
      spawnDamageNumber(
        scene,
        { x: sprite.x, y: sprite.y },
        meta.barOffsetY,
        Math.round(prevHp - player.hp),
        color,
        style,
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
