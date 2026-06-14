import {
  ESSENCE_COLORS,
  GAME_CONFIG,
  isRangedPlayerView,
  type CombatArchetype,
  type CombatEvent,
  type PlayerView,
  type Vec2,
} from "@mmo-idle/shared";
import { activateLaserBeam } from "../fx/laser";
import {
  playOneShotEffect,
  spawnDamageNumber,
  EMPOWERED_DAMAGE_COLOR,
  EMPOWERED_DAMAGE_SIZE_PX,
} from "../fx/particles";
import { getDotPath, type DotPath } from "../fx/dot";
import { fxSlash } from "../fx/slash";
import { fxImpact } from "../fx/impact";
import { fxGunshot } from "../fx/gunshot";
import { fxLightning } from "../fx/lightning";
import { fxFireFlame } from "../fx/dotFire";
import { fxFrostSnowflake } from "../fx/dotFrost";
import { fxPoisonSmog } from "../fx/dotPoison";
import { fxPoison } from "../fx/poison";
import { fxMagic } from "../fx/magic";
import { fxFrost } from "../fx/frost";
import { fxFire } from "../fx/fire";
import { fxVoid } from "../fx/voidFx";
import { fxFirstStrike } from "../fx/firstStrike";
import { fxAftershock } from "../fx/aftershock";
import { fxDualSlash } from "../fx/dualSlash";
import { shouldRunClientFx } from "../fx/guard";
import type { GameScene } from "../scenes/GameScene";
import { applyLunge } from "./interpolation";
import type { RenderState } from "./state";
import { DEPTH } from "./depth";

type NonNullArchetype = Exclude<CombatArchetype, null>;
type PlayerHitEvent = CombatEvent & { kind: "player-hit" };
type PlayerKillEvent = CombatEvent & { kind: "player-kill" };

function spawnRewardFloaters(scene: GameScene, ev: PlayerKillEvent): void {
  const target = scene.state.sprite.get(ev.targetId);
  const x = target?.x ?? scene.cameras.main.worldView.centerX;
  const y = target?.y ?? scene.cameras.main.worldView.centerY;
  const lines: { text: string; color: string }[] = [];
  if (ev.biomeXpGained > 0)
    lines.push({ text: `+${ev.biomeXpGained} XP`, color: "#88ddff" });
  if (ev.essenceGained > 0)
    lines.push({
      text: `+${ev.essenceGained} ●`,
      color: ESSENCE_COLORS[ev.essenceType],
    });

  lines.forEach((line, index) => {
    const text = scene.add
      .text(x, y - 32 - index * 18, line.text, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: line.color,
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.FX);
    scene.tweens.add({
      targets: text,
      y: text.y - 34,
      alpha: 0,
      duration: 900,
      ease: "Power2",
      onComplete: () => text.destroy(),
    });
  });
}

interface AttackFxArgs {
  scene: GameScene;
  ev: PlayerHitEvent;
  player: PlayerView;
  from: Vec2;
  to: Vec2;
  dotPath?: DotPath;
}

type AttackFxFn = (args: AttackFxArgs) => void;

const FLASH_CLIENT_EFFECT = "flash-teleport";
const FIRST_STRIKE_CLIENT_EFFECT = "first-strike";
const AFTERSHOCK_CLIENT_EFFECT = "aftershock";
const SWIFTBLADE_CLIENT_EFFECT = "swiftblade";

function snapOwnPlayerToServerTarget(
  state: RenderState,
  scene: GameScene,
  targetId: string,
  playerPos?: Vec2,
): void {
  if (!state.ownId) return;
  const transform = state.transform.get(state.ownId);
  const interp = state.interpolation.get(state.ownId);
  const sprite = state.sprite.get(state.ownId);
  if (!transform || !interp || !sprite) return;

  scene.flashCameraHold = scene.flashCameraHoldTargetId === targetId;
  scene.flashCameraHoldTargetId = targetId;
  scene.tweens.killTweensOf(interp.lungeOffset);
  interp.lungeOffset.x = 0;
  interp.lungeOffset.y = 0;
  if (playerPos) {
    interp.base.x = playerPos.x;
    interp.base.y = playerPos.y;
    transform.target = { ...playerPos };
  }
}

function fxAoeRing(
  scene: GameScene,
  pos: Vec2,
  radius: number,
  color: number,
): void {
  const ring = scene.add.graphics({ x: pos.x, y: pos.y }).setDepth(DEPTH.FX);
  ring.lineStyle(2.5, color, 0.65);
  ring.strokeCircle(0, 0, 1);
  scene.tweens.add({
    targets: ring,
    scaleX: radius,
    scaleY: radius,
    alpha: 0,
    duration: 420,
    ease: "Power2",
    onComplete: () => ring.destroy(),
  });
}

function playEmpoweredRing(args: AttackFxArgs): void {
  const { scene, ev, player, to } = args;
  if (!ev.empowered && !ev.execution) return;
  const ringColor =
    player.combatArchetype === "cadence"
      ? 0x4499ff
      : player.combatArchetype === "cooldown"
        ? 0xddeeff
        : player.combatArchetype === "energy"
          ? 0x88aaff
          : player.combatArchetype === "reload"
            ? 0xffeedd
            : 0xffdd22;
  fxAoeRing(scene, to, GAME_CONFIG.EMPOWERED_AOE_RADIUS, ringColor);
}

const ATTACK_FX_BY_ARCHETYPE: Record<NonNullArchetype, AttackFxFn> = {
  cadence: ({ scene, ev, from, to }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered, true),
  cooldown: ({ scene, ev, to }) => fxImpact(scene, to.x, to.y, ev.execution),
  reload: ({ scene, ev, from, to }) =>
    fxGunshot(scene, from.x, from.y, to.x, to.y, ev.empowered),
  energy: ({ scene, ev, from, to }) =>
    fxLightning(scene, from.x, from.y, to.x, to.y, ev.empowered),
  dot: ({ scene, ev, to, dotPath }) => {
    switch (dotPath) {
      case "fire":
        return fxFireFlame(scene, to.x, to.y, ev.empowered);
      case "frost":
        return fxFrostSnowflake(scene, to.x, to.y, ev.empowered);
      default:
        return fxPoisonSmog(scene, to.x, to.y, ev.empowered);
    }
  },
  // Summoner uses a plain melee impact from the slime — the slime sprite is
  // the FX, and the empowered ring is handled separately via the player's
  // existing empoweredRing pass.
  summoner: ({ scene, ev, from, to }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered),
};

const ATTACK_FX_BY_STYLE: Record<string, AttackFxFn> = {
  slash: ({ scene, ev, from, to }) =>
    fxSlash(scene, from.x, from.y, to.x, to.y, ev.empowered),
  poison: ({ scene, to }) => fxPoison(scene, to.x, to.y),
  magic: ({ scene, from, to }) => fxMagic(scene, from.x, from.y, to.x, to.y),
  frost: ({ scene, to }) => fxFrost(scene, to.x, to.y),
  fire: ({ scene, to }) => fxFire(scene, to.x, to.y),
  void: ({ scene, to }) => fxVoid(scene, to.x, to.y),
  impact: ({ scene, ev, to }) => fxImpact(scene, to.x, to.y, ev.execution),
  gunshot: ({ scene, ev, from, to }) =>
    fxGunshot(scene, from.x, from.y, to.x, to.y, ev.empowered),
};

export function dispatchCombatEvent(
  state: RenderState,
  ev: CombatEvent,
  scene: GameScene,
): void {
  // dot-tick / monster-hit events are consumed as damage-number style hints in
  // deltaApplier, not here.
  if (ev.kind === "dot-tick" || ev.kind === "monster-hit") return;

  if (ev.kind === "monster-dodge") {
    if (!shouldRunClientFx()) return;
    const target =
      ev.targetPos ??
      (state.sprite.get(ev.monsterId)
        ? {
            x: state.sprite.get(ev.monsterId)!.x,
            y: state.sprite.get(ev.monsterId)!.y,
          }
        : null);
    if (target) {
      const text = scene.add
        .text(target.x, target.y - 40, "DODGE", {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#ddddff",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.FX);
      scene.tweens.add({
        targets: text,
        y: text.y - 28,
        alpha: 0,
        duration: 650,
        onComplete: () => text.destroy(),
      });
    }
    return;
  }

  if (ev.kind === "player-miss") {
    if (!shouldRunClientFx()) return;
    const target =
      ev.targetPos ??
      (state.sprite.get(ev.targetId)
        ? {
            x: state.sprite.get(ev.targetId)!.x,
            y: state.sprite.get(ev.targetId)!.y,
          }
        : null);
    if (target) {
      const text = scene.add
        .text(target.x, target.y - 40, "MISS", {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#bbbbbb",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.FX);
      scene.tweens.add({
        targets: text,
        y: text.y - 28,
        alpha: 0,
        duration: 650,
        onComplete: () => text.destroy(),
      });
    }
    return;
  }

  if (ev.playerId !== scene.myId) return;

  if (ev.kind === "player-knockback") {
    if (!state.ownId) return;
    const transform = state.transform.get(state.ownId);
    const interp = state.interpolation.get(state.ownId);
    if (!transform || !interp) return;
    // The client owns own-player prediction and glides toward `transform.target`,
    // so a small authoritative backward shift is invisible while moving. Snap the
    // render baseline and prediction target to the recoil position so the shove
    // actually lands; movement re-paths forward from here on the next tick.
    scene.tweens.killTweensOf(interp.lungeOffset);
    interp.lungeOffset.x = 0;
    interp.lungeOffset.y = 0;
    interp.base.x = ev.pos.x;
    interp.base.y = ev.pos.y;
    transform.target = { x: ev.pos.x, y: ev.pos.y };
    return;
  }

  if (ev.kind === "player-hit") {
    const player = state.ownId
      ? (state.view.get(state.ownId) as PlayerView | undefined)
      : undefined;
    // Minion hits already play FX from minions.ts (lastAttackAt); skip body lunge/FX.
    if (shouldRunClientFx() && (player?.summonsMinions ?? 0) === 0) {
      runFxForAttackStyle(state, ev, scene);
    }
  }

  if (ev.kind === "player-kill") {
    if (shouldRunClientFx()) {
      const target = scene.state.sprite.get(ev.targetId);
      if (target && ev.damage > 0) {
        const meta = scene.state.spriteMeta.get(ev.targetId);
        const empowered = ev.empowered || ev.execution;
        spawnDamageNumber(
          scene,
          { x: target.x, y: target.y },
          meta?.barOffsetY ?? 40,
          Math.round(ev.damage),
          empowered ? EMPOWERED_DAMAGE_COLOR : "#ffffff",
          empowered
            ? { sizePx: EMPOWERED_DAMAGE_SIZE_PX, suffix: "!" }
            : undefined,
        );
      }
      spawnRewardFloaters(scene, ev);
    }
  }
}

function runFxForAttackStyle(
  state: RenderState,
  ev: PlayerHitEvent,
  scene: GameScene,
): void {
  const ownSprite = state.ownId ? state.sprite.get(state.ownId) : undefined;
  const targetSprite = state.sprite.get(ev.targetId);
  const player = state.ownId
    ? (state.view.get(state.ownId) as PlayerView | undefined)
    : undefined;
  const targetInterp = state.interpolation.get(ev.targetId);
  const isFlashTeleport = ev.effects?.includes(FLASH_CLIENT_EFFECT) ?? false;
  const isSwiftblade = ev.effects?.includes(SWIFTBLADE_CLIENT_EFFECT) ?? false;

  if (!targetSprite) {
    if (isFlashTeleport) {
      snapOwnPlayerToServerTarget(state, scene, ev.targetId, ev.playerPos);
    }
    return;
  }

  if (!ownSprite || !player) return;

  const dotPath =
    player.combatArchetype === "dot" ? getDotPath(player) : undefined;
  const bossScale =
    Math.max(targetSprite.displayWidth, targetSprite.displayHeight) > 64
      ? 1.33
      : 1;
  const targetEffectScale = 1.5 * bossScale;
  const isLaser =
    player.combatArchetype === "reload" &&
    (player.passives["reload.laser"] ?? 0) > 0;

  const from = { x: ownSprite.x, y: ownSprite.y };
  const to = ev.targetPos
    ? { x: ev.targetPos.x, y: ev.targetPos.y }
    : { x: targetSprite.x, y: targetSprite.y };
  const args: AttackFxArgs = { scene, ev, player, from, to, dotPath };

  // Blunderbuss volley: each pellet is its own bullet, all fired at once from a
  // shared muzzle to its own scattered endpoint (angle + distance randomized
  // server-side). Randomize each bullet's animation speed too so the burst
  // reads as a chaotic shotgun blast, not an ordered sweep.
  if (
    !isLaser &&
    player.combatArchetype === "reload" &&
    ev.pelletIndex !== undefined
  ) {
    if (!document.hidden) {
      const durationScale = 0.55 + Math.random() * 0.9;
      fxGunshot(scene, from.x, from.y, to.x, to.y, ev.empowered, durationScale);
    }
    return;
  }

  if (isLaser) {
    activateLaserBeam(state, scene, ev.targetId);
  } else if (isSwiftblade) {
    // Swiftblade replaces the default cadence slash with its dual diagonal slash;
    // both the primary and the extra strikes carry this effect.
    playEmpoweredRing(args);
    fxDualSlash(scene, to.x, to.y, ev.empowered);
  } else {
    playEmpoweredRing(args);
    const archetype = player.combatArchetype;
    if (archetype && ATTACK_FX_BY_ARCHETYPE[archetype]) {
      ATTACK_FX_BY_ARCHETYPE[archetype](args);
    } else {
      const styleFn =
        ATTACK_FX_BY_STYLE[player.attackStyle] ?? ATTACK_FX_BY_STYLE.impact;
      styleFn(args);
    }
  }

  if (isFlashTeleport) {
    snapOwnPlayerToServerTarget(state, scene, ev.targetId, ev.playerPos);
  }

  for (const effectId of ev.effects ?? []) {
    if (effectId === FLASH_CLIENT_EFFECT) continue;
    if (effectId === SWIFTBLADE_CLIENT_EFFECT) continue; // handled above
    if (effectId === FIRST_STRIKE_CLIENT_EFFECT) {
      fxFirstStrike(scene, to.x, to.y);
      continue;
    }
    if (effectId === AFTERSHOCK_CLIENT_EFFECT) {
      fxAftershock(scene, to.x, to.y);
      continue;
    }
    playOneShotEffect(scene, effectId, to, { scale: targetEffectScale });
  }

  if (
    !isLaser &&
    !isFlashTeleport &&
    !isRangedPlayerView(player) &&
    state.ownId &&
    targetInterp
  ) {
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
  if (!shouldRunClientFx()) return;
  const ev: PlayerHitEvent = {
    kind: "player-hit",
    playerId: scene.myId,
    targetId: "",
    targetName: "",
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
