import type { CombatEvent, Vec2 } from '@mmo-idle/shared';
import type { DamageNumberHint, RenderState } from './state';
import type { DamageNumberStyle } from '../fx/particles';
import {
  resolveMonsterDamageStyle, resolvePlayerDamageStyle,
  SHIELD_DAMAGE_COLOR, SHIELD_DAMAGE_SYMBOL,
} from './damageNumberStyle';

export interface CombatTextEntry {
  targetId: string;
  amount: number;
  targetPos?: Vec2;
  targetKind?: 'player' | 'monster' | 'minion';
  hint: DamageNumberHint;
  shield?: boolean;
}

export interface CombatTextBatch {
  entries: CombatTextEntry[];
}

/** Preserve instances; never reconstruct an untyped remainder from net HP loss. */
export function prepareCombatText(
  events: readonly CombatEvent[],
  options: { stateSync?: boolean } = {},
): CombatTextBatch {
  const batch: CombatTextBatch = { entries: [] };
  if (options.stateSync) return batch;
  for (const ev of events) {
    if (ev.kind === 'damage') {
      if (!Number.isFinite(ev.amount) || ev.amount < 0) continue;
      if (Math.round(ev.amount) > 0) batch.entries.push({
        targetId: ev.targetId, targetKind: ev.targetKind, targetPos: ev.targetPos,
        amount: Math.round(ev.amount),
        hint: { hasDirectHit: ev.category === 'direct', isDot: ev.category === 'dot',
          empowered: false, execution: false, dotElement: ev.element },
      });
      continue;
    }
    if (ev.kind !== 'player-hit' && ev.kind !== 'monster-hit' && ev.kind !== 'dot-tick') continue;
    const amount = ev.kind === 'dot-tick' ? ev.amount : ev.damage;
    // Ignore malformed/missing amounts; combat text never reconstructs HP loss.
    if (amount === undefined || !Number.isFinite(amount) || amount < 0) continue;
    const hint: DamageNumberHint = ev.kind === 'dot-tick'
      ? { hasDirectHit: false, isDot: true, empowered: false, execution: false, dotElement: ev.element }
      : {
          hasDirectHit: true, empowered: !!ev.empowered, execution: !!ev.execution,
          evadedPartial: ev.evadedPartial, capped: ev.capped,
        };
    const targetPos = 'targetPos' in ev ? ev.targetPos : undefined;
    const targetKind = ev.kind === 'player-hit' ? 'monster' : ev.kind === 'monster-hit' ? 'player' : undefined;
    if (Math.round(amount) > 0) {
      batch.entries.push({ targetId: ev.targetId, targetKind, amount: Math.round(amount), targetPos, hint });
    }
    if (ev.absorbed && Number.isFinite(ev.absorbed) && Math.round(ev.absorbed) > 0) {
      batch.entries.push({ targetId: ev.targetId, targetKind, amount: Math.round(ev.absorbed), targetPos, hint, shield: true });
    }
  }
  return batch;
}

type TextState = Pick<RenderState, 'sprite' | 'spriteMeta' | 'kind' | 'ownId'>;
type SpawnNumber = (pos: Vec2, offset: number, amount: number, color: string, style?: DamageNumberStyle) => void;

/** Called before removals. Spatial staggering needs no delayed callbacks/history. */
export function renderCombatText(batch: CombatTextBatch, state: TextState, spawn: SpawnNumber): void {
  const slots = new Map<string, number>();
  let rendered = 0;
  for (const entry of batch.entries) {
    const sprite = state.sprite.get(entry.targetId);
    const pos = sprite ? { x: sprite.x, y: sprite.y } : entry.targetPos;
    if (!pos) continue;
    const slot = slots.get(entry.targetId) ?? 0;
    // Cosmetic overload is dropped, never deferred into subsequent fights.
    if (slot >= 12 || rendered >= 120) continue;
    slots.set(entry.targetId, slot + 1);
    rendered++;
    const kind = state.kind.get(entry.targetId) ?? entry.targetKind;
    const resolved = entry.shield
      ? { color: SHIELD_DAMAGE_COLOR, style: { symbol: SHIELD_DAMAGE_SYMBOL } }
      : kind === 'player' || kind === 'minion'
        ? resolvePlayerDamageStyle(entry.hint, kind === 'minion' ? '#ffd1d1' : entry.targetId === state.ownId ? '#ff4444' : '#ff8844')
        : resolveMonsterDamageStyle(entry.hint);
    spawn(
      { x: pos.x + Math.floor(slot / 6) * 48, y: pos.y - (slot % 6) * 26 },
      state.spriteMeta.get(entry.targetId)?.barOffsetY ?? 40,
      entry.amount, resolved.color, resolved.style,
    );
  }
}
