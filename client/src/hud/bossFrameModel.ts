/**
 * The boss frame's model (combat readout run, item 4): which boss the frame shows and
 * what it reads, built from the views and cast state the client already holds — no
 * new socket events, no new view fields. Pure data, so it is testable without a DOM.
 */
import type { MonsterView } from '@mmo-idle/shared';
import { FRAME_TOKENS } from '../render/readoutTokens';

/** The slice of a monster view the frame reads. */
export type BossFrameSource = Pick<
  MonsterView,
  'id' | 'name' | 'monsterTypeId' | 'nodeId' | 'hp' | 'maxHp' | 'isBoss' | 'attackTargetId' | 'bossPhase' | 'enemyBarrier' | 'primed'
>;

/** A wind-up in progress (the client's `castState`, from `monster-cast-start`). */
export interface BossCast {
  label: string;
  /** Wall clock (Date.now()) when the cast began. */
  startedAt: number;
  castMs: number;
}

export interface BossFrameModel {
  id: string;
  name: string;
  monsterTypeId: string;
  tier: number;
  hp: number;
  maxHp: number;
  /** Active shell absorb (0 when none, or when it is reforming). */
  absorb: number;
  /** The announced phase (`BossPhase.name`), when one has fired. */
  phase: string | null;
  cast: BossCast | null;
  /** Its next hit is empowered (the server's presentation mirror). */
  primed: boolean;
  /** Why it is up: the player's target, or a boss with aggro on the player. */
  reason: 'target' | 'aggro';
}

export interface BossFrameViewer {
  id: string;
  nodeId: string;
  attackTargetId: string | null;
}

/**
 * The boss the frame shows: the player's target when it is a live boss on the
 * player's node, else a live boss there that has the player as its target.
 */
export function pickBoss(
  monsters: Iterable<BossFrameSource>,
  viewer: BossFrameViewer,
): { boss: BossFrameSource; reason: BossFrameModel['reason'] } | null {
  let aggro: BossFrameSource | null = null;
  for (const m of monsters) {
    if (!m.isBoss || !(m.hp > 0) || m.nodeId !== viewer.nodeId) continue;
    if (m.id === viewer.attackTargetId) return { boss: m, reason: 'target' };
    if (m.attackTargetId === viewer.id && (!aggro || m.id < aggro.id)) aggro = m;
  }
  return aggro ? { boss: aggro, reason: 'aggro' } : null;
}

/** A cast still in progress at `now` (a finished one waits briefly for its cast-end). */
export function liveCast(cast: BossCast | undefined, now: number): BossCast | null {
  if (!cast || !(cast.castMs > 0)) return null;
  return now - cast.startedAt <= cast.castMs + FRAME_TOKENS.cast.graceMs ? cast : null;
}

export function bossFrameModel(
  boss: BossFrameSource,
  reason: BossFrameModel['reason'],
  tier: number,
  cast: BossCast | undefined,
  now: number,
): BossFrameModel {
  return {
    id: boss.id,
    name: boss.name,
    monsterTypeId: boss.monsterTypeId,
    tier,
    hp: Math.max(0, boss.hp),
    maxHp: boss.maxHp,
    absorb: Math.max(0, boss.enemyBarrier?.amount ?? 0),
    phase: boss.bossPhase ?? null,
    cast: liveCast(cast, now),
    primed: boss.primed === true,
    reason,
  };
}

export function bossFrameEqual(a: BossFrameModel | null, b: BossFrameModel | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.name === b.name && a.tier === b.tier && a.hp === b.hp && a.maxHp === b.maxHp &&
    a.absorb === b.absorb && a.phase === b.phase && a.primed === b.primed && a.reason === b.reason &&
    a.cast?.label === b.cast?.label && a.cast?.startedAt === b.cast?.startedAt && a.cast?.castMs === b.cast?.castMs;
}
