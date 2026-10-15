/**
 * The Conduit's tier 2 (T2-CONDUIT; bible §7.5, §7.8, §7.9, §7.16): the seven T2 summon types'
 * jobs, the disciplines' runtime (Pack Strike, Elite's extra), and the T2 gear lines (First
 * Strike, Sentinel, Sandveil, Bloomlink, Purge). Same pattern as the T1 jobs in `summonPieces.ts`:
 * a summon attacks through the owner's pipeline, so a piece's job is a listener keyed on the
 * hitting slot's piece. Jobs that are not hit-keyed (Barkward's bark, Purge, Pack Strike) run from
 * `updateConduitT2` on the summoner tick.
 *
 * Every number is a kit `params` placeholder or a constant here marked PLACEHOLDER. Stand-ins the
 * bible leaves to the designer are listed in the T2-CONDUIT report.
 */
import {
  applyStatusEffect,
  CONDUIT_DISCIPLINE_TUNING,
  CONDUIT_KIT,
  CONDUIT_LEAF_TUNING,
  getResource,
  getStatusEffect,
  isCleanseable,
  isHarmfulPlayerStatusEffect,
  LAIR_DRAG_ROOT_EFFECT_ID,
  removeStatusEffect,
  removeStatusEffectStacks,
  setResource,
  type ConduitPiece,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { playerAoeTargets, applyPlayerAoeTo } from '../../../combat/damage/aoeDamage';
import { registerCombatListener, type CombatContext } from '../../../combat/engine/combatPipeline';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { applyHealToMinion, applyHealToPlayer } from '../../../defense/regen/healing';
import { isPlayerInCombat } from '../../../combat/ai/engagement';
import { PLAYER_HARD_CONTROL_EFFECTS } from '../../../combat/status/playerHardControl';
import { minionCanSwing } from '../../../combat/status/minionAfflictions';
import { disciplineOf } from './disciplines';
import { runFormationAttack } from './formationAttack';
import { markStackBonus } from './souls';
import { PIECES, swing } from './summonPieces';
import { HIBERNATE_EFFECT_ID, specializationOf } from './t3Shared';
import { hasLeaf } from './t4Shared';

/** The Executioner's mark on an enemy; `typeMask` has one bit per kind of summon that has hit it (Dune-Stalker's stacks). */
export const MARK_EFFECT_ID = 'conduit-mark';
const MARK_MS = 8_000; // PLACEHOLDER
/** Barkward's coat: absorbs the next control on the summon, and part of the damage while it holds. */
export const BARK_EFFECT_ID = 'conduit-bark';
const BARK_MS = 10_000; // PLACEHOLDER

const LAST_TARGET = 'summon.lastTarget';
const BARK_NEXT_AT = 'summon.barkNextAt';
const PURGE_NEXT_AT = 'purge.nextAt';
const PACK_NEXT_AT = 'pack.nextStrikeAt';
/** Owner flags that Sentinel has already spent its absorb on this enemy. */
const SENTINEL_PREFIX = 'sentinel:';

const PIECE_INDEX = new Map<string, number>(CONDUIT_KIT.pieces.map((piece, index) => [piece.id, index]));

export function pieceOfSlot(slotId: string): ConduitPiece | undefined {
  return PIECES.get(slotId.split('#')[0] ?? '');
}

/** Elite (§7.5) deepens a support's job and a splash dealer's reach; the bible leaves the extras' granularity open. */
export function jobMult(owner: PlayerEntity, piece: ConduitPiece): number {
  const elite = disciplineOf(owner) === 'conduit-elite';
  return elite && (piece.family === 'support' || (piece.params.splashRadius ?? 0) > 0)
    ? CONDUIT_DISCIPLINE_TUNING.eliteSupportMult
    : 1;
}

export function livingMinions(world: World, owner: PlayerEntity): MinionEntity[] {
  const out: MinionEntity[] = [];
  for (const id of owner.summonsMinions?.minionIds ?? []) {
    const minion = id ? world.getMinionEntity(id) : undefined;
    if (minion && minion.hasHealth.hp > 0) out.push(minion);
  }
  return out;
}

/** The most hurt ally by share of its HP, the owner included; undefined when everyone is whole. */
export function mostHurtAlly(world: World, owner: PlayerEntity): { minion?: MinionEntity; fraction: number } | undefined {
  let best: { minion?: MinionEntity; fraction: number } | undefined;
  const ownerFraction = owner.hasHealth.hp / owner.hasHealth.maxHp;
  if (ownerFraction < 1) best = { fraction: ownerFraction };
  for (const minion of livingMinions(world, owner)) {
    const fraction = minion.hasHealth.hp / minion.hasHealth.maxHp;
    if (fraction < 1 && (!best || fraction < best.fraction)) best = { minion, fraction };
  }
  return best;
}

/**
 * Choir (T3, §7.6): a support's ability echoes, weaker, through every other support type. The T3
 * listeners register here (the T2 file cannot import them without a cycle); `source` is the
 * support body whose ability just fired and `target` the enemy it fired at, when it has one.
 */
let echoHook: ((world: World, owner: PlayerEntity, source: MinionEntity, target: MonsterEntity | undefined) => void) | null = null;
export function setSupportEchoHook(hook: typeof echoHook): void { echoHook = hook; }
export function echoSupportAbility(world: World, owner: PlayerEntity, source: MinionEntity, target: MonsterEntity | undefined): void {
  echoHook?.(world, owner, source, target);
}

/** Bloomtender's heal, shared with Bloomlink (a support's heal also heals the Conduit). `strength` scales an echoed heal. */
export function supportHeal(world: World, owner: PlayerEntity, piece: ConduitPiece, strength = 1): void {
  const hurt = mostHurtAlly(world, owner);
  if (!hurt) return;
  const share = (piece.params.healPct ?? 0) * jobMult(owner, piece) * strength;
  if (hurt.minion) {
    const amount = hurt.minion.hasHealth.maxHp * share;
    applyHealToMinion(hurt.minion, owner.isPlayer.id, amount, world);
    const link = owner.usesSkills.passives['conduit.bloomlink-pct'] ?? 0;
    if (link > 0) applyHealToPlayer(owner, owner.tracksCombat, amount * link, world);
  } else {
    applyHealToPlayer(owner, owner.tracksCombat, owner.hasHealth.maxHp * share, world);
  }
}

/** Enemy hits that reach this far count as ranged (the "ranged attacker" moment's threshold). */
export const RANGED_ENEMY_REACH = 100;

export function registerSummonPiecesT2(): void {
  // ── onHit: damage shaping ────────────────────────────────────────────────

  // Dune-Stalker (Desert Soul): each different kind of summon that hits the marked enemy adds a stack.
  registerCombatListener('onHit', (ctx) => {
    if (!ctx.formation || ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const bonus = markStackBonus(ctx.attacker);
    if (bonus <= 0) return;
    const mark = getStatusEffect(ctx.defender.tracksCombat, MARK_EFFECT_ID);
    const bit = PIECE_INDEX.get(ctx.formation.slotId.split('#')[0] ?? '');
    if (!mark || bit === undefined) return;
    mark.data['typeMask'] = (mark.data['typeMask'] ?? 0) | (1 << bit);
    ctx.damage = Math.round(ctx.damage * (1 + bonus * popcount(mark.data['typeMask'] ?? 0)));
  });

  registerCombatListener('onHit', (ctx, world) => {
    const hit = swing(ctx, world);
    if (!hit) return;
    const { owner, minion, piece, target } = hit;

    // Bonecrusher: its blows scale off its own max HP.
    const hpDamage = piece.params.hpDamagePct ?? 0;
    if (hpDamage > 0) ctx.damage += Math.round(minion.hasHealth.maxHp * hpDamage);

    // First Strike (weapon): a summon's first hit on a new target hits much harder. One multiplier
    // per hit: it yields to a heavy shot already recorded on the hit.
    const cs = minion.tracksCombat;
    const firstOnTarget = cs.strings[LAST_TARGET] !== target.isMonster.id;
    cs.strings[LAST_TARGET] = target.isMonster.id;
    const firstStrike = owner.usesSkills.passives['conduit.first-strike-pct'] ?? 0;
    if (firstOnTarget && firstStrike > 0 && ctx.metadata['empoweredMultiplier'] === undefined) {
      ctx.damage = Math.round(ctx.damage * (1 + firstStrike));
      ctx.metadata['empoweredMultiplier'] = 1 + firstStrike;
    }

    // Executioner: below a threshold, a shot at the marked enemy hits much harder (a threshold, not an on-kill).
    const below = piece.params.executeBelow ?? 0;
    if (below > 0 && getStatusEffect(target.tracksCombat, MARK_EFFECT_ID)
      && target.hasHealth.hp <= target.hasHealth.maxHp * below
      && ctx.metadata['empoweredMultiplier'] === undefined) {
      const mult = piece.params.executeMult ?? 1;
      ctx.damage = Math.round(ctx.damage * mult);
      ctx.metadata['empoweredMultiplier'] = mult;
    }
  });

  // ── afterHit: the jobs that follow a landed hit ──────────────────────────
  registerCombatListener('afterHit', (ctx, world) => {
    const hit = swing(ctx, world);
    if (!hit) return;
    const { owner, piece, target } = hit;
    const alive = target.hasHealth.hp > 0;

    // Executioner: its hit marks the target.
    if ((piece.params.executeBelow ?? 0) > 0 && alive && !evadeBlocksDebuffs(ctx)) {
      applyStatusEffect(target.tracksCombat, {
        id: MARK_EFFECT_ID, maxStacks: 1, remainingMs: MARK_MS, refreshable: true,
        sourceId: owner.isPlayer.id, data: { typeMask: 0, totalMs: MARK_MS },
      });
    }

    // Rockhurler: the boulder hits a small area around the target. Elite widens it.
    const radius = piece.params.splashRadius ?? 0;
    // Elite (§7.5): every other damage dealer's and tank's extra is area damage; supports deepen their job.
    const eliteSplash = disciplineOf(owner) === 'conduit-elite' && specializationOf(owner) !== 'conduit-colossus' && piece.family !== 'support' && radius <= 0;
    const splashRadius = radius > 0 ? radius * jobMult(owner, piece) : eliteSplash ? CONDUIT_DISCIPLINE_TUNING.eliteSplashRadius : 0;
    const splashShare = radius > 0 ? (piece.params.splashShare ?? 0) : eliteSplash ? CONDUIT_DISCIPLINE_TUNING.eliteSplashShare : 0;
    if (splashRadius > 0 && splashShare > 0 && ctx.damage > 0) {
      const victims = playerAoeTargets(world, owner, target.hasPosition.current, splashRadius, target.isMonster.id);
      if (victims.length > 0) applyPlayerAoeTo(world, owner, victims, ctx.damage * splashShare, 'summon', {}, {});
    }

    // Bog Leech: it drains its target and shares what it drains with the most hurt summon.
    const drain = piece.params.drainShare ?? 0;
    if (drain > 0 && ctx.damage > 0) {
      const hurt = mostHurtAlly(world, owner);
      if (hurt?.minion) applyHealToMinion(hurt.minion, owner.isPlayer.id, ctx.damage * drain, world);
    }

    // Bloomtender: heals whichever ally is most hurt, the Conduit included.
    if ((piece.params.healPct ?? 0) > 0) {
      supportHeal(world, owner, piece);
      echoSupportAbility(world, owner, hit.minion, target);
    }
  });
}

function popcount(n: number): number {
  let count = 0;
  for (let v = n | 0; v !== 0; v &= v - 1) count++;
  return count;
}

// ── Per-tick: bark, Purge, Pack Strike, Sentinel's memory ───────────────────

/** Roots and hard control a bark can absorb: the player's hard-control list, the lair root, and a zero-speed slow. */
function controlOn(cs: TracksCombat): string[] {
  const ids = PLAYER_HARD_CONTROL_EFFECTS.filter((id) => getStatusEffect(cs, id));
  if (getStatusEffect(cs, LAIR_DRAG_ROOT_EFFECT_ID)) ids.push(LAIR_DRAG_ROOT_EFFECT_ID);
  const slow = getStatusEffect(cs, 'slow');
  if (slow && (slow.data['speedMult'] ?? 1) <= 0) ids.push('slow');
  return ids;
}

/** Coat the most hurt summon that has no bark yet. `strength` scales an echoed coat (Choir). */
export function coatBark(world: World, owner: PlayerEntity, source: MinionEntity, piece: ConduitPiece, strength = 1): void {
  let coat: MinionEntity | undefined;
  let worst = Infinity;
  for (const candidate of livingMinions(world, owner)) {
    if (getStatusEffect(candidate.tracksCombat, BARK_EFFECT_ID)) continue;
    const fraction = candidate.hasHealth.hp / candidate.hasHealth.maxHp;
    if (fraction < worst) { worst = fraction; coat = candidate; }
  }
  if (!coat) return;
  applyStatusEffect(coat.tracksCombat, {
    id: BARK_EFFECT_ID, maxStacks: 1, remainingMs: BARK_MS, refreshable: true, sourceId: source.isMinion.id,
    data: { absorbPct: Math.min(0.9, (piece.params.barkAbsorbPct ?? 0) * jobMult(owner, piece) * strength), totalMs: BARK_MS },
  });
}

function updateBark(world: World, owner: PlayerEntity, now: number): void {
  const minions = livingMinions(world, owner);
  for (const minion of minions) {
    const piece = pieceOfSlot(minion.isMinion.slotId);
    if (!piece || (piece.params.barkEveryMs ?? 0) <= 0) continue;
    if (now < getResource(minion.tracksCombat, BARK_NEXT_AT)) continue;
    setResource(minion.tracksCombat, BARK_NEXT_AT, now + piece.params.barkEveryMs!);
    coatBark(world, owner, minion, piece);
    echoSupportAbility(world, owner, minion, undefined);
  }
  // A bark absorbs the next stun or control: it takes the control off and is spent.
  for (const minion of minions) {
    const cs = minion.tracksCombat;
    if (!getStatusEffect(cs, BARK_EFFECT_ID)) continue;
    // A hibernating summon is held by its own ice; the bark must not undo it.
    if (getStatusEffect(cs, HIBERNATE_EFFECT_ID)) continue;
    const control = controlOn(cs);
    if (control.length === 0) continue;
    for (const id of control) removeStatusEffect(cs, id);
    removeStatusEffect(cs, BARK_EFFECT_ID);
  }
}

/** How many distinct harmful, cleansable effects a body carries. */
export function debuffsOn(cs: TracksCombat): string[] {
  const ids = new Set<string>();
  for (const effect of cs.statusEffects) {
    if (effect.instanced || effect.stacks <= 0) continue;
    if (isHarmfulPlayerStatusEffect(effect.id, effect.data) && isCleanseable(effect.id, effect.data)) ids.add(effect.id);
  }
  return [...ids];
}

/** Purge (charm): every few seconds the most debuffed body, a summon or you, loses one debuff. */
function updatePurge(world: World, owner: PlayerEntity, now: number): void {
  const every = owner.usesSkills.passives['conduit.purge-ms'] ?? 0;
  if (every <= 0 || now < getResource(owner.tracksCombat, PURGE_NEXT_AT)) return;
  setResource(owner.tracksCombat, PURGE_NEXT_AT, now + every);
  let worst: TracksCombat | undefined;
  let worstIds: string[] = [];
  for (const cs of [owner.tracksCombat, ...livingMinions(world, owner).map((minion) => minion.tracksCombat)]) {
    const ids = debuffsOn(cs);
    if (ids.length > worstIds.length) { worst = cs; worstIds = ids; }
  }
  if (!worst) return;
  // The deepest stack goes first, as Cleanse's priority does.
  const deepest = worstIds
    .map((id) => ({ id, stacks: getStatusEffect(worst!, id)?.stacks ?? 0 }))
    .sort((a, b) => (b.stacks - a.stacks) || a.id.localeCompare(b.id))[0]!;
  removeStatusEffectStacks(worst, deepest.id, Math.max(1, deepest.stacks));
}

/**
 * Pack (§7.5): every different kind of summon uses its ability on the focus target at the same
 * moment. One body per kind (the first living one) strikes; a Soul is not a kind. Returns how many
 * kinds struck. The free order that calls it early is not wired (it needs a new order in the
 * Formation config); `updateConduitT2` calls it on the timer.
 */
export function firePackStrike(world: World, owner: PlayerEntity, now: number): number {
  const targetId = owner.summonsMinions?.formationTargetId;
  const target: MonsterEntity | undefined = targetId ? world.getMonsterEntity(targetId) : undefined;
  if (!target || target.hasHealth.hp <= 0) return 0;
  setResource(owner.tracksCombat, PACK_NEXT_AT, now + CONDUIT_DISCIPLINE_TUNING.packStrikeEveryMs);
  const seen = new Set<string>();
  let struck = 0;
  for (const minion of livingMinions(world, owner)) {
    const pieceId = minion.isMinion.slotId.split('#')[0] ?? '';
    if (!PIECES.has(pieceId) || seen.has(pieceId) || !minionCanSwing(minion)) continue;
    seen.add(pieceId);
    if (target.hasHealth.hp <= 0) break;
    runFormationAttack(world, owner, minion, target, now, { packStrike: true });
    struck++;
  }
  // Rally (T4 leaf): the blow also mends the whole formation.
  if (struck > 0 && hasLeaf(owner, 'conduit-rally')) {
    for (const ally of livingMinions(world, owner)) {
      applyHealToMinion(ally, owner.isPlayer.id, ally.hasHealth.maxHp * CONDUIT_LEAF_TUNING.rallyHealPct, world);
    }
  }
  return struck;
}

export function updateConduitT2(world: World, owner: PlayerEntity, now: number): void {
  if (!owner.summonsMinions) return;
  updateBark(world, owner, now);
  updatePurge(world, owner, now);
  if (disciplineOf(owner) === 'conduit-pack' && now >= getResource(owner.tracksCombat, PACK_NEXT_AT)) {
    firePackStrike(world, owner, now);
  }
  // Sentinel remembers which enemies it has covered for only as long as the fight lasts.
  if (!isPlayerInCombat(owner, now)) {
    for (const key of Object.keys(owner.tracksCombat.flags)) {
      if (key.startsWith(SENTINEL_PREFIX)) delete owner.tracksCombat.flags[key];
    }
  }
}

/** Sentinel (vest): the first hit each enemy lands on you goes to the nearest summon. True when this hit is that one. */
export function sentinelClaims(owner: PlayerEntity, monsterId: string): boolean {
  if ((owner.usesSkills.passives['conduit.sentinel'] ?? 0) <= 0) return false;
  const key = SENTINEL_PREFIX + monsterId;
  if (owner.tracksCombat.flags[key]) return false;
  owner.tracksCombat.flags[key] = true;
  return true;
}

/** Whether a hit came from an enemy that fights from range (Sandveil's answer). */
export function isRangedHit(ctx: CombatContext): boolean {
  return ctx.attackerType === 'monster' && (ctx.attacker.performsAttack?.attackRange ?? 0) > RANGED_ENEMY_REACH;
}
