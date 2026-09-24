import type { PlayerView } from "@mmo-idle/shared";
import { playerMoveSpeedMult } from "@mmo-idle/shared";
import { getDefaultStore } from "jotai";
import { autoPathAtom, setAutoPath } from "../hud/atoms";
import type { RenderState } from "./state";
import type { GameScene } from "../scenes/GameScene";
import {
  applySpriteOutline,
  applySpriteTint,
  clearSpriteOutline,
  ensureSprite,
  resetSpriteTint,
  TIER_OUTLINE_DISTANCE,
  TIER_OUTLINE_OUTER_STRENGTH,
  updateSpriteFrame,
} from "./sprites";
import { getPlayerShadowColor } from "../sprites";
import { ensureShadow } from "./shadows";
import {
  ensureLabel,
  updateLabelForGrave,
  updateLabelForLivePlayer,
} from "./labels";
import { ensureHpBar, destroyHpBar } from "./healthBars";
import { ensureCdBar, destroyCdBar } from "./cooldownBars";
import { GRAVE_DISPLAY_H, GRAVE_LABEL_OFFSET_Y } from "../sprites";
import { nodeToScene } from "./sceneCoords";
import { getPendingStop, isOwnHeadingClientOwned, clearPendingStop, setManualActive } from "../input/moveOwnership";
import {
  clearOwnMovePath,
  reconcileOwnPathFromServer,
} from "../input/pathPrediction";
import { flashShiftTint, spawnFlashAttackAfterimage } from "./movementEffects";
import { auraTint } from "../fx/aura";
import { ambientStackFlashTint } from './ambientStackFlash';
import { shouldRunClientFx } from '../fx/guard';
import { resetPlayerNodePosition } from './playerNodePosition';

function playerTint(state: RenderState, player: PlayerView): number | null {
  const base = flashShiftTint(player) ?? auraTint(player);
  const flash = state.ambientStackFlash.get(player.id);
  if (!flash) return base;
  if (!player.isDead && flash.nodeId === player.nodeId && shouldRunClientFx()) {
    const tint = ambientStackFlashTint(flash, performance.now(), base ?? 0xffffff);
    if (tint !== null) return tint;
  }
  state.ambientStackFlash.delete(player.id);
  return base;
}

/** Runs even when render-paused, restoring tints and dropping expired pulses. */
export function updateAmbientStackFlashes(state: RenderState): void {
  for (const id of state.ambientStackFlash.keys()) {
    const player = state.view.get(id) as PlayerView | undefined;
    const sprite = state.sprite.get(id);
    if (!player || !sprite) { state.ambientStackFlash.delete(id); continue; }
    const tint = playerTint(state, player);
    if (!player.isDead && tint !== null) applySpriteTint(sprite, tint);
    else resetSpriteTint(sprite, id === state.ownId ? 0x44ff88 : 0x4488ff);
  }
}

// Server position is authoritative; the client extrapolates ahead toward the
// motion target between 5 Hz snapshots. Beyond this error the prediction has
// diverged (rejected move, dropped packet) — snap rather than glide-correct.
const RECONCILE_SNAP_SQ = 220 * 220;

function syncReloadTiming(state: RenderState, player: PlayerView): void {
  if (player.reloadRemainingMs <= 0 || player.reloadDurationMs <= 0) {
    state.reloadTiming.delete(player.id);
    return;
  }

  const previous = state.reloadTiming.get(player.id);
  if (
    previous?.remainingMs === player.reloadRemainingMs &&
    previous.durationMs === player.reloadDurationMs
  ) {
    return;
  }

  state.reloadTiming.set(player.id, {
    remainingMs: player.reloadRemainingMs,
    durationMs: player.reloadDurationMs,
    observedAt: Date.now(),
  });
}

/**
 * Combined movement-speed multiplier from any movement-affecting buffs the player
 * has (slow, root, frost ramp, ambient chill, boot haste, …). Buffs without a
 * `speedMult` (the common case) are ignored.
 *
 * Both sides call the SAME shared collapse (`playerMoveSpeedMult`), so the slow
 * floor the server applies is the floor the client extrapolates at. A local
 * product here would over-slow the prediction the moment two slows stacked and
 * make the own-player sprite crawl behind the authoritative position until the
 * next snapshot snapped it forward.
 */
function moveSpeedMult(player: PlayerView): number {
  const mults: number[] = [];
  for (const buff of player.activeBuffs) {
    if (buff.speedMult !== undefined) mults.push(buff.speedMult);
  }
  return playerMoveSpeedMult(mults);
}

/**
 * Player tier as a quiet rim on the sprite itself — reuses the same glow
 * mechanism as the elite/guardian threat outline (render/sprites.ts), but at
 * TIER_OUTLINE_* strength/distance so it always reads subtler than a threat
 * callout. Tier 0 shows no rim, matching the old ring's behavior.
 */
function syncTierOutline(state: RenderState, player: PlayerView): void {
  const sprite = state.sprite.get(player.id);
  if (!sprite) return;
  if (player.playerTier > 0) {
    applySpriteOutline(sprite, getPlayerShadowColor(player.playerTier), {
      outerStrength: TIER_OUTLINE_OUTER_STRENGTH,
      distance: TIER_OUTLINE_DISTANCE,
    });
  } else {
    clearSpriteOutline(sprite);
  }
}

export function upsertPlayer(
  state: RenderState,
  player: PlayerView,
  scene: GameScene,
): void {
  const isOwn = player.id === scene.myId;
  const isNew = !state.sprite.has(player.id);
  syncReloadTiming(state, player);

  if (isNew) {
    state.ids.add(player.id);
    state.kind.set(player.id, "player");
    state.view.set(player.id, player);

    state.spriteMeta.set(player.id, {
      currentFrame: null,
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
      ensureShadow(state, player.id, player.pos, scene);
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
      const tint = playerTint(state, player);
      if (sprite && tint !== null) applySpriteTint(sprite, tint);
      syncTierOutline(state, player);
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
  // A full destination snapshot can retain both party members' render IDs.
  // Rebase every changed player, not just the local camera/input owner.
  resetPlayerNodePosition(state, prev?.nodeId, player);
  const wasDead = prev?.isDead ?? false;
  const prevAttackAt = prev?.lastAttackAt ?? 0;

  if (player.isDead) {
    state.ambientStackFlash.delete(player.id);
    if (isOwn) {
      clearOwnMovePath(state);
      setManualActive(false);
      clearPendingStop();
    }
    const meta = state.spriteMeta.get(player.id);
    if (meta) meta.barOffsetY = GRAVE_LABEL_OFFSET_Y;
    updateSpriteFrame(state, player.id, player, scene, {
      displayW: 80,
      displayH: GRAVE_DISPLAY_H,
      fallbackColor: isOwn ? 0x44ff88 : 0x4488ff,
      isPlayer: true,
    });
    const deadSprite = state.sprite.get(player.id);
    if (deadSprite) {
      clearSpriteOutline(deadSprite);
      resetSpriteTint(deadSprite, isOwn ? 0x44ff88 : 0x4488ff);
    }
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
    ensureShadow(state, player.id, player.pos, scene);
    ensureHpBar(state, player.id, scene);
    ensureCdBar(state, player.id, scene);
    updateLabelForLivePlayer(state, player.id, player, scene);
  }

  if (isOwn && player.nodeId !== state.ownNodeId) {
    clearPendingStop();
    // Destination coordinates are node-local, so a mark carried through a gate
    // would point at an unrelated patch of the node we just walked into.
    if (scene.targetMarker.destination?.nodeId !== player.nodeId) scene.targetMarker.hide();
    const store = getDefaultStore();
    const navPathBefore = store.get(autoPathAtom);
    // Retire old-node prediction without sending an old-coordinate stop into
    // the destination. Held input is resumed after the snapshot is applied.
    clearOwnMovePath(state);
    setManualActive(false);
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
  const tint = playerTint(state, player);
  if (sprite) {
    if (tint !== null) {
      applySpriteTint(sprite, tint);
    } else {
      resetSpriteTint(sprite, color);
    }
    syncTierOutline(state, player);
    if (
      isOwn &&
      (flashShiftTint(player) ?? auraTint(player)) !== null &&
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
    if (isOwn && (player.isChanneling || player.activeBuffs.some(buff => buff.speedMult === 0))) {
      clearOwnMovePath(state);
      setManualActive(false);
      clearPendingStop();
      transform.speed = 0;
      scene.targetMarker.hide();
    }
    if (isOwn && state.ownClickActive && state.ownClickConfirmed &&
      Math.hypot(player.target.x - player.pos.x, player.target.y - player.pos.y) <= 0.01) {
      // This update follows the click acknowledgement on the ordered socket.
      // Arrival, root, or the server watchdog can end the order.
      clearOwnMovePath(state);
      scene.targetMarker.hide();
    }
    // Fix #1: while the client owns the own player's heading — active
    // keyboard/gamepad movement OR a sent-but-unconfirmed stop — the server's
    // `player.target` is ~1 RTT stale, so overwriting it here would yank the
    // predicted sprite toward the old heading (mid-walk) or let the lagging
    // authoritative state drive then snap it back (the "backtrack on stop").
    // Other players, and the own player under server-driven movement
    // (auto/traverse/follow/knockback) or click-to-move, take the server target.
    // The node reveal does not change movement ownership.
    const clientOwnsHeading =
      isOwn && isOwnHeadingClientOwned();
    if (!clientOwnsHeading) {
      const interp = state.interpolation.get(player.id);
      const from = interp ? { x: interp.base.x, y: interp.base.y } : player.pos;
      // Click-to-move owns a client path toward `ownPathGoal`. Auto-combat and
      // other server-driven motion expose only the next motion endpoint in
      // `player.target` — replanning a full A* to that point every 5 Hz delta
      // clears waypoints and often fails against trees, freezing the sprite while
      // the server keeps moving.
      if (isOwn && state.ownClickActive) {
        transform.target = state.ownPathWaypoints[0] ?? state.ownPathGoal ?? from;
      } else {
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
          if (state.ownClickActive && state.ownPathGoal && transform) {
            transform.target = reconcileOwnPathFromServer(scene, player.pos, state.ownPathGoal);
          }
        }
      }
    }
  }

  updateLabelForLivePlayer(state, player.id, player, scene);

  // Direct attacks (including remote players) are rendered from confirmed events.
  // lastAttackAt is still authoritative for cooldown bars and Flash movement.

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
    // `player.auto` is the single authoritative writer for auto-combat, so this
    // is also the only place that sees auto turn on when the SERVER did it (a
    // rune, an admin action, a resume-on-respawn). `setAutoMode` covers the
    // locally-initiated case; this covers the rest, so the destination mark can
    // never outlive the manual control it belonged to.
    if (player.auto && !scene.autoMode) scene.targetMarker.hide();
    scene.autoMode = player.auto;
  }
}
