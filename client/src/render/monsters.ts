import {
  MONSTER_DATABASE,
  RESOLVED_NODE_FEATURES,
  type MonsterView,
  type NodeFeatureShape,
  type Vec2,
} from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { ensureSprite, updateSpriteFrame } from './sprites';
import { ensureShadow } from './shadows';
import { ensureLabel, destroyLabel } from './labels';
import { ensureHpBar } from './healthBars';
import { ensureCdBar } from './cooldownBars';
import { applyLunge } from './interpolation';
import { spawnAttackEffect } from './combatFx';
import { spawnDamageNumber } from '../fx/particles';
import {
  resolveMonsterDamageStyle,
  SHIELD_DAMAGE_COLOR,
  SHIELD_DAMAGE_SYMBOL,
} from './damageNumberStyle';
import {
  applySpriteTint,
  resetSpriteTint,
  applySpriteOutline,
  clearSpriteOutline,
} from './sprites';
import { VOID_OVERLORD_DISPLAY } from '../sprites/voidOverlordSheet';
import {
  ensureVoidOverlordBossSprite,
  ensureVoidOverlordMinionSprite,
  shouldUseVoidOverlordSheet,
} from './ultimateBossSprites';

const THRONE_HEAL_TINT = 0xbb66ff;
// Dungeon guardians wear a red outline (glow) rather than a tint, so their own
// sprite colors stay readable while still flagging them as the room's threat.
const GUARDIAN_OUTLINE = 0xff3333;
// Persistent ELITE marker — a bright yellow outline (glow) on the biome's standout
// dangerous mob (necromancers, apex predators). Derived from the static `elite` def
// flag, so no networked field is needed. Guardian/throne states take precedence.
const ELITE_OUTLINE = 0xffdd33;
const LEDGE_HOP_COOLDOWN_MS = 450;
const LEDGE_HOP_HEIGHT = 34;
/** Constant lift for an airborne monster. Its shadow stays on the ground. */
const FLYER_HOVER_HEIGHT = 26;
/** How faded a camouflaged monster draws while it is still hidden. */
const CAMOUFLAGE_ALPHA = 0.45;
const LEDGE_HOP_DURATION_MS = 260;

function isEliteType(typeId: string): boolean {
  return MONSTER_DATABASE.get(typeId)?.elite === true;
}

function canPlayLedgeHop(typeId: string): boolean {
  return MONSTER_DATABASE.get(typeId)?.vaultsMountainLedges === true;
}

/**
 * Flight and ledge-vaulting both ignore ledges, but only a FLYER hovers: the
 * caprine climbs the terrain, the flyer is above it.
 */
function isFlyingType(typeId: string): boolean {
  return MONSTER_DATABASE.get(typeId)?.flies === true;
}

/**
 * CAMOUFLAGE. A concealed monster is one that idles inside terrain (`idleAnchor`)
 * or opens with a volley out of hiding (`openingVolley`) — the Chameleon line, the
 * bush-lurking Snake, the half-submerged Bog Lurker.
 *
 * Derived from the def plus the already-networked AI state rather than a new
 * networked flag: concealment is purely presentational, and "is it fighting yet"
 * is something the client already knows. `concealedWhileIdle` covers camouflage
 * that is not tied to a terrain anchor.
 */
function isConcealingType(typeId: string): boolean {
  const def = MONSTER_DATABASE.get(typeId);
  return def?.idleAnchor !== undefined || def?.openingVolley !== undefined || def?.concealedWhileIdle === true;
}

/**
 * Reveal on engagement, conceal when it goes back to idling. Deliberately NOT a
 * repeated in-combat re-camouflage — the locked designs all say "reveal when
 * attacking, then ordinary combat".
 */
function isConcealedNow(monster: MonsterView): boolean {
  if (!isConcealingType(monster.monsterTypeId)) return false;
  return monster.state === 'idle' || monster.state === 'wandering';
}

function rectSegmentCrossesShape(from: Vec2, to: Vec2, shape: NodeFeatureShape): boolean {
  if (shape.kind !== 'rect') return false;
  const minX = shape.x - shape.halfW;
  const maxX = shape.x + shape.halfW;
  const minY = shape.y - shape.halfH;
  const maxY = shape.y + shape.halfH;
  const steps = Math.max(2, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 24));
  let wasInside = from.x >= minX && from.x <= maxX && from.y >= minY && from.y <= maxY;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const p = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    const inside = p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
    if (inside !== wasInside) return true;
    wasInside = inside;
  }
  return false;
}

function crossesMountainLedge(monster: MonsterView, prevPos: Vec2): boolean {
  const features = RESOLVED_NODE_FEATURES[monster.nodeId] ?? [];
  return features.some((feature) =>
    feature.id.startsWith('mountain_') &&
    feature.blocksMovement?.includes('monster') &&
    rectSegmentCrossesShape(prevPos, monster.pos, feature.shape),
  );
}

function maybePlayLedgeHop(
  state: RenderState,
  monster: MonsterView,
  prevPos: Vec2,
  scene: GameScene,
): void {
  if (!canPlayLedgeHop(monster.monsterTypeId)) return;
  const now = scene.time.now;
  if ((state.ledgeHopNextAt.get(monster.id) ?? 0) > now) return;
  if (!crossesMountainLedge(monster, prevPos)) return;

  const meta = state.spriteMeta.get(monster.id);
  if (!meta) return;
  scene.tweens.killTweensOf(meta);
  meta.visualOffsetY = 0;
  state.ledgeHopNextAt.set(monster.id, now + LEDGE_HOP_COOLDOWN_MS);
  scene.tweens.add({
    targets: meta,
    visualOffsetY: -LEDGE_HOP_HEIGHT,
    duration: LEDGE_HOP_DURATION_MS / 2,
    yoyo: true,
    ease: 'Sine.easeOut',
    onComplete: () => {
      meta.visualOffsetY = 0;
    },
  });
}

function syncMonsterThroneTint(
  state: RenderState,
  monster: MonsterView,
): void {
  const sprite = state.sprite.get(monster.id);
  if (!sprite) return;
  if (state.dungeonGuardianIds.has(monster.id)) {
    resetSpriteTint(sprite, monster.color);
    applySpriteOutline(sprite, GUARDIAN_OUTLINE);
  } else if (monster.throneHealing) {
    clearSpriteOutline(sprite);
    applySpriteTint(sprite, THRONE_HEAL_TINT);
  } else if (isEliteType(monster.monsterTypeId)) {
    resetSpriteTint(sprite, monster.color);
    applySpriteOutline(sprite, ELITE_OUTLINE);
  } else {
    clearSpriteOutline(sprite);
    resetSpriteTint(sprite, monster.color);
  }
}

/**
 * The T1-T4 monster-rework presentation tells, all derived from the def plus
 * already-networked state — no new protocol surface:
 *
 *   FLIGHT      a constant hover offset, so an aerial roamer reads as airborne
 *               and its shadow sits on the ground beneath it;
 *   CAMOUFLAGE  faded while idle, full opacity the moment it engages;
 *   SHELLED     the Snapper darkens while retracted (its `cannotAttack` +
 *               stationary state is otherwise silent).
 *
 * Hover deliberately does NOT touch `meta.visualOffsetY` while a ledge-hop tween
 * owns it — flyers never hop, so the two can never fight over the field.
 */
function syncMonsterEcologyTells(state: RenderState, monster: MonsterView): void {
  const sprite = state.sprite.get(monster.id);
  const meta = state.spriteMeta.get(monster.id);

  if (meta && isFlyingType(monster.monsterTypeId)) {
    meta.visualOffsetY = -FLYER_HOVER_HEIGHT;
  }

  if (!sprite) return;
  sprite.setAlpha(isConcealedNow(monster) ? CAMOUFLAGE_ALPHA : 1);
}

export function refreshMonsterTints(state: RenderState): void {
  for (const id of state.ids) {
    if (state.kind.get(id) !== "monster") continue;
    const monster = state.view.get(id) as MonsterView | undefined;
    if (monster) {
      syncMonsterThroneTint(state, monster);
      syncMonsterEcologyTells(state, monster);
    }
  }
}

function defaultBarOffsetY(monster: MonsterView): number {
  return monster.isBoss ? 50 : 40;
}

function defaultSpriteSize(monster: MonsterView): number {
  return monster.isBoss ? 128 : 64;
}

function upsertSheetMonsterSprite(
  state: RenderState,
  monster: MonsterView,
  scene: GameScene,
): void {
  const meta = state.spriteMeta.get(monster.id);
  if (!meta) return;

  if (monster.monsterTypeId === 'void-overlord') {
    meta.barOffsetY = VOID_OVERLORD_DISPLAY['void-overlord'].barOffsetY;
    ensureVoidOverlordBossSprite(state, monster.id, monster.pos, scene);
    return;
  }

  if (shouldUseVoidOverlordSheet(monster.monsterTypeId)) {
    meta.barOffsetY = VOID_OVERLORD_DISPLAY[monster.monsterTypeId].barOffsetY;
    meta.visualOffsetY = undefined;
    ensureVoidOverlordMinionSprite(state, monster.id, monster, scene);
    return;
  }

  const spriteSize = defaultSpriteSize(monster);
  meta.barOffsetY = defaultBarOffsetY(monster);
  meta.skipFrameRefresh = false;
  meta.isAnimated = false;
  meta.visualOffsetY = undefined;
  ensureSprite(state, monster.id, monster, scene, {
    displayW: spriteSize,
    displayH: spriteSize,
    fallbackColor: monster.color,
    isPlayer: false,
  });
}

export function upsertMonster(
  state: RenderState,
  monster: MonsterView,
  scene: GameScene,
): void {
  const isNew = !state.sprite.has(monster.id);

  if (isNew) {
    state.ids.add(monster.id);
    state.kind.set(monster.id, 'monster');
    state.view.set(monster.id, monster);

    state.spriteMeta.set(monster.id, {
      currentFrame: null,
      barOffsetY: defaultBarOffsetY(monster),
      entityName: monster.name,
      monsterBehavior: monster.behavior,
      monsterIsRanged: monster.isRanged,
    });

    state.transform.set(monster.id, {
      pos:    { ...monster.pos },
      target: { ...monster.target },
      speed:  monster.speed,
    });
    state.interpolation.set(monster.id, {
      base:        { ...monster.pos },
      lungeOffset: { x: 0, y: 0 },
    });

    state.debugRanges.set(monster.id, {
      pullRange: monster.pullRange,
      leashRange: monster.leashRange,
      attackRange: monster.attackRange,
    });

    ensureShadow(state, monster.id, monster.pos, scene, {
      fillColor: 0x000000,
      fillAlpha: monster.isBoss ? 0.55 : 0.45,
    });
    upsertSheetMonsterSprite(state, monster, scene);
    ensureLabel(state, monster.id, monster, scene);
    ensureHpBar(state, monster.id, scene);
    ensureCdBar(state, monster.id, scene);
    syncMonsterThroneTint(state, monster);
    syncMonsterEcologyTells(state, monster);
    return;
  }

  const prev = state.view.get(monster.id) as MonsterView | undefined;
  const prevAttackAt = prev?.lastAttackAt ?? 0;
  const prevHp = prev?.hp ?? monster.hp;
  const prevPos = prev?.pos ? { ...prev.pos } : { ...monster.pos };

  const interp = state.interpolation.get(monster.id);
  if (interp) {
    const snapDx = monster.pos.x - interp.base.x;
    const snapDy = monster.pos.y - interp.base.y;
    if (snapDx * snapDx + snapDy * snapDy > 80 * 80) {
      interp.base = { ...monster.pos };
    }
  }

  state.view.set(monster.id, monster);
  maybePlayLedgeHop(state, monster, prevPos, scene);
  const transform = state.transform.get(monster.id);
  if (transform) {
    transform.target = { ...monster.target };
    transform.speed = monster.speed;
  }

  // Entity IDs can collide across node snapshots after a server restart —
  // each node's saved snapshot has its own monster-N namespace, so the same
  // client sprite ID can flip between monster types on a zone transition.
  // Mirror players.ts: always refresh the sprite frame on patch (cheap
  // early-out when the frame is unchanged), and rebuild type-dependent
  // render state when the type actually changed.
  const meta = state.spriteMeta.get(monster.id);
  const typeChanged = prev !== undefined && prev.monsterTypeId !== monster.monsterTypeId;
  if (typeChanged && meta) {
    meta.entityName = monster.name;
    meta.monsterBehavior = monster.behavior;
    meta.monsterIsRanged = monster.isRanged;
    meta.skipFrameRefresh = false;
    meta.isAnimated = false;
    state.sprite.get(monster.id)?.destroy();
    state.sprite.delete(monster.id);
    upsertSheetMonsterSprite(state, monster, scene);
  }
  if (typeChanged) {
    state.debugRanges.set(monster.id, {
      pullRange: monster.pullRange,
      leashRange: monster.leashRange,
      attackRange: monster.attackRange,
    });
    state.shadow.get(monster.id)?.setFillStyle(0x000000, monster.isBoss ? 0.55 : 0.45);
    destroyLabel(state, monster.id);
    ensureLabel(state, monster.id, monster, scene);
  }

  if (!meta?.skipFrameRefresh) {
    const spriteSize = defaultSpriteSize(monster);
    updateSpriteFrame(state, monster.id, monster, scene, {
      displayW: spriteSize,
      displayH: spriteSize,
      fallbackColor: monster.color,
      isPlayer: false,
    });
  }

  const hint = state.damageStyleHints.get(monster.id);
  if (monster.hp < prevHp) {
    const sprite = state.sprite.get(monster.id);
    if (sprite && meta) {
      const { color, style } = resolveMonsterDamageStyle(hint);
      spawnDamageNumber(
        scene,
        { x: sprite.x, y: sprite.y },
        meta.barOffsetY,
        Math.round(prevHp - monster.hp),
        color,
        style,
      );
    }
  }

  // Shield-absorbed damage renders as a separate blue number, independent of the
  // HP delta — so a fully absorbed hit (no HP loss) still shows feedback.
  if (hint?.absorbed && hint.absorbed > 0) {
    const sprite = state.sprite.get(monster.id);
    if (sprite && meta) {
      spawnDamageNumber(
        scene,
        { x: sprite.x, y: sprite.y },
        meta.barOffsetY,
        Math.round(hint.absorbed),
        SHIELD_DAMAGE_COLOR,
        { symbol: SHIELD_DAMAGE_SYMBOL },
      );
    }
  }

  if (monster.lastAttackAt > prevAttackAt && monster.attackTargetId) {
    const vmSprite = state.sprite.get(monster.id);
    const targetInterp = state.interpolation.get(monster.attackTargetId);
    const targetSprite = state.sprite.get(monster.attackTargetId);
    if (vmSprite && targetInterp && targetSprite) {
      spawnAttackEffect(
        scene,
        monster.attackStyle,
        { x: vmSprite.x, y: vmSprite.y },
        { x: targetSprite.x, y: targetSprite.y },
      );

      if (!meta?.monsterIsRanged) {
        applyLunge(state, monster.id, { ...targetInterp.base }, scene);
      }
    }
  }

  syncMonsterThroneTint(state, monster);
  syncMonsterEcologyTells(state, monster);
}
