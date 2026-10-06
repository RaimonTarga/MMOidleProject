import { MONSTER_DATABASE, type MonsterView, type PlayerView } from '@mmo-idle/shared';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';
import { monsterSpriteSize } from './monsterSize';
import { BAR_TOKENS } from './readoutTokens';
import {
  bodySizeClass, chipAdvance, chipValue, colorInt, healthColor, segmentMarks, type ChipState,
} from './readoutModel';

/** The bar tokens as the numbers Phaser's Graphics take. */
const COLOR = Object.fromEntries(
  Object.entries(BAR_TOKENS.color).map(([key, hex]) => [key, colorInt(hex)]),
) as Record<keyof typeof BAR_TOKENS.color, number>;
const SEGMENTS = segmentMarks();

interface BarShape {
  width: number;
  height: number;
  /** Elites, dungeon guardians and bosses carry a segment every quarter. */
  marked: boolean;
}

/** What one bar last drew, so an unchanged bar is not redrawn. */
interface BarDrawn {
  x: number;
  y: number;
  fillPx: number;
  chipPx: number;
  shieldPx: number;
  width: number;
  height: number;
  marked: boolean;
  color: number;
}

interface BarRuntime {
  chips: Map<string, ChipState>;
  drawn: Map<string, BarDrawn>;
}

const runtimes = new WeakMap<RenderState, BarRuntime>();

function runtimeFor(state: RenderState): BarRuntime {
  let rt = runtimes.get(state);
  if (!rt) {
    rt = { chips: new Map(), drawn: new Map() };
    runtimes.set(state, rt);
  }
  return rt;
}

function barShape(state: RenderState, id: string): BarShape {
  const kind = state.kind.get(id);
  if (kind === 'minion') return { width: BAR_TOKENS.minion.width, height: BAR_TOKENS.minion.height, marked: false };
  if (kind === 'monster') {
    const monster = state.view.get(id) as MonsterView;
    const sizeClass = bodySizeClass(monsterSpriteSize(monster), monster.isBoss);
    const marked = monster.isBoss
      || MONSTER_DATABASE.get(monster.monsterTypeId)?.elite === true
      || state.dungeonGuardianIds.has(id);
    return { width: BAR_TOKENS.width[sizeClass], height: BAR_TOKENS.height[sizeClass], marked };
  }
  return { width: BAR_TOKENS.width.medium, height: BAR_TOKENS.height.medium, marked: false };
}

export function ensureHpBar(
  state: RenderState,
  id: string,
  scene: GameScene,
): void {
  if (state.hpBar.has(id)) return;
  state.hpBar.set(id, scene.add.graphics().setDepth(DEPTH.UI));
}

/**
 * Every body's overhead bar: width by size class, colour by thirds, a damage chip
 * that holds the last hit for a beat and drains, the absorb band, quarter segments on
 * elites and bosses. Bars never draw text.
 */
export function drawHealthBars(state: RenderState, now = performance.now()): void {
  const rt = runtimeFor(state);
  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const hpBar = state.hpBar.get(id);
    const meta = state.spriteMeta.get(id);
    const snap = state.view.get(id);
    if (!sprite || !hpBar || !meta || !snap) continue;

    const kind = state.kind.get(id);
    const barY = sprite.y - meta.barOffsetY;
    const hpPct = snap.maxHp > 0 ? Math.max(0, Math.min(1, snap.hp / snap.maxHp)) : 0;
    const chip = chipAdvance(rt.chips.get(id), hpPct, now);
    rt.chips.set(id, chip);
    const shape = barShape(state, id);
    const { width: w, height: h } = shape;

    // Barrier and wards share one absorb band on the HP fill — overhead bars are
    // too narrow to split them. An enemy shell is its own band above the bar.
    let shieldPct = 0;
    if (kind === 'player') {
      const player = snap as PlayerView;
      const totalAbsorb = player.barrier + player.wards.reduce((sum, ward) => sum + ward.amount, 0);
      shieldPct = snap.maxHp > 0 ? totalAbsorb / snap.maxHp : 0;
    } else if (kind === 'monster') {
      const barrier = (snap as MonsterView).enemyBarrier;
      shieldPct = barrier && barrier.maxAmount > 0
        ? Math.max(0, Math.min(1, barrier.amount / barrier.maxAmount))
        : 0;
    }

    const fillPx = Math.round(w * hpPct);
    const chipPx = Math.round(w * chipValue(chip, now));
    const shieldPx = shieldPct > 0 ? Math.max(1, Math.round(w * shieldPct)) : 0;
    const color = colorInt(healthColor(hpPct));
    const prev = rt.drawn.get(id);
    if (
      prev && prev.x === sprite.x && prev.y === barY && prev.fillPx === fillPx && prev.chipPx === chipPx &&
      prev.shieldPx === shieldPx && prev.width === w && prev.height === h && prev.marked === shape.marked &&
      prev.color === color
    ) continue;
    rt.drawn.set(id, { x: sprite.x, y: barY, fillPx, chipPx, shieldPx, width: w, height: h, marked: shape.marked, color });

    const left = sprite.x - w / 2;
    hpBar.setDepth(DEPTH.UI + sprite.y);
    hpBar.clear();
    hpBar.fillStyle(COLOR.trough);
    hpBar.fillRect(left, barY, w, h);
    // The chip sits under the fill: what shows of it is the hit that just landed.
    if (chipPx > fillPx) {
      hpBar.fillStyle(COLOR.chip, BAR_TOKENS.alpha.chip);
      hpBar.fillRect(left + fillPx, barY, chipPx - fillPx, h);
    }
    hpBar.fillStyle(color);
    hpBar.fillRect(left, barY, fillPx, h);

    if (kind === 'player' && shieldPx > 0) {
      const shieldWidth = Math.min(w - fillPx, shieldPx);
      if (shieldWidth > 0) {
        hpBar.fillStyle(COLOR.absorbPlayer, BAR_TOKENS.alpha.absorbPlayer);
        hpBar.fillRect(left + fillPx, barY, shieldWidth, h);
      }
    }

    if (shape.marked) {
      hpBar.fillStyle(COLOR.segment, BAR_TOKENS.alpha.segment);
      for (const mark of SEGMENTS) hpBar.fillRect(Math.round(left + w * mark), barY, BAR_TOKENS.segmentPx, h);
    }

    if (kind === 'monster' && shieldPx > 0) {
      // Enemy absorb is a separate band rather than an HP overlay: at full HP an
      // active shell must still be obvious, and draining it should read cleanly.
      const { height: bandH, gap } = BAR_TOKENS.enemyShell;
      const bandY = barY - gap - bandH;
      hpBar.fillStyle(COLOR.absorbEnemyTrough, BAR_TOKENS.alpha.absorbEnemy);
      hpBar.fillRect(left, bandY, w, bandH);
      hpBar.fillStyle(COLOR.absorbEnemy, BAR_TOKENS.alpha.absorbEnemy);
      hpBar.fillRect(left, bandY, shieldPx, bandH);
    }

    hpBar.lineStyle(1, COLOR.outline, BAR_TOKENS.alpha.outline);
    hpBar.strokeRect(left - 0.5, barY - 0.5, w + 1, h + 1);
  }
}

export function destroyHpBar(state: RenderState, id: string): void {
  state.hpBar.get(id)?.destroy();
  state.hpBar.delete(id);
  state.hpBarCache.delete(id);
  const rt = runtimes.get(state);
  rt?.chips.delete(id);
  rt?.drawn.delete(id);
}
