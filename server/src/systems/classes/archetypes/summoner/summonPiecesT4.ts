/**
 * The Conduit's tier 4 (T4-CONDUIT; bible §7.16): the seven T4 summon types' jobs (Avalanche,
 * Icewarden, Dartcaller, Mirage, Obsidian Tortoise, Gravecaller, Abyssal Warden), the two new
 * Souls (Charnel-Crown, Elder Serpent) and the T4 gear lines (Cleave, Exploit, Grave Pact,
 * Requiem, Pressure Seal, Tidewater). Same pattern as `summonPiecesT3.ts`: hit-keyed jobs are
 * listeners keyed on the hitting slot's piece, timed jobs run from `updateConduitT4` on the
 * summoner tick. The leaves live in `leavesT4.ts`.
 *
 * Every number is a kit `params` placeholder, a constant in `leaves.ts`, or a passive value.
 * Stand-ins are listed in the T4-CONDUIT report.
 */
import {
  applyStatusEffect,
  CONDUIT_GEAR_T4_TUNING as GEAR,
  CONDUIT_SOUL_T4_TUNING as SOUL,
  getResource,
  getStatusEffect,
  isHarmfulPlayerStatusEffect,
  isHoldStatusId,
  removeStatusEffect,
  setResource,
  type ConduitPiece,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo, playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { CONDUIT_POISON_ID } from '../../../combat/damage/bleedIds';
import { attackNow, registerCombatListener } from '../../../combat/engine/combatPipeline';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { applyStun } from '../../../combat/status/stun';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { applyHealToPlayer } from '../../../defense/regen/healing';
import { applyTickDot } from '../../shared/tickDot';
import { raiseHusk, tickHusks } from './husks';
import { lineagePower } from './souls';
import { swing } from './summonPieces';
import { debuffsOn, livingMinions, pieceOfSlot } from './summonPiecesT2';
import { echoSupport } from './summonPiecesT3';
import { mirageAbility, shellAbility } from './supportsT4';
import { inFight } from './t3Shared';
import { SEAL_EFFECT_ID, TICK_NOW, WITHDRAW_EFFECT_ID } from './t4Shared';

const AVALANCHE_NEXT_AT = 'avalanche.nextAt';
const SHELL_NEXT_AT = 'icewarden.nextAt';
const MIRAGE_NEXT_AT = 'mirage.nextAt';
const WITHDRAW_NEXT_AT = 'tortoise.nextAt';
const WITHDRAW_UNTIL = 'tortoise.until';
const WARDEN_NEXT_AT = 'warden.nextAt';
const SEAL_READY_AT = 'seal.readyAt';
const GRAVE_PACT_READY_AT = 'gravepact.readyAt';
/** Dartcaller's poison: the cap on ticks one enemy can carry. PLACEHOLDER. */
const DART_MAX_TICKS = 12;
const DART_TICK_MS = 1_000;

/** Gravecaller (§7.16): a fallen summon rises once as a spectral husk before it goes to the rebuild queue. */
export function gravecallerRaises(owner: PlayerEntity, world: World, dead: MinionEntity, now: number): void {
  for (const ally of livingMinions(world, owner)) {
    const piece = pieceOfSlot(ally.isMinion.slotId);
    if ((piece?.params.huskMs ?? 0) <= 0) continue;
    raiseHusk(owner, dead.hasPosition.current, dead.dealsDamage.attack * (piece!.params.huskMult ?? 1), piece!.params.huskMs ?? 0, piece!.params.huskEveryMs ?? 1_000, now, 12);
    return;
  }
}

// ── Debuffs on an enemy (Exploit) ───────────────────────────────────────────

/** How many different debuffs an enemy carries: harmful effects, holds, and the Conduit's own marks. */
export function debuffKinds(monster: MonsterEntity): number {
  const kinds = new Set<string>();
  for (const effect of monster.tracksCombat.statusEffects) {
    if (effect.remainingMs === 0 || effect.stacks <= 0) continue;
    if (isHarmfulPlayerStatusEffect(effect.id, effect.data) || isHoldStatusId(effect.id) || effect.id.startsWith('conduit-')) {
      kinds.add(effect.id);
    }
  }
  return kinds.size;
}

// ── Listeners ───────────────────────────────────────────────────────────────

export function registerSummonPiecesT4(): void {
  // Exploit (Trench weapon): summons hit harder for each different debuff on their target.
  registerCombatListener('onHit', (ctx) => {
    if (!ctx.formation || ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
    const exploit = ctx.attacker.usesSkills.passives['conduit.exploit-pct'] ?? 0;
    if (exploit <= 0) return;
    const kinds = debuffKinds(ctx.defender);
    if (kinds > 0) ctx.damage = Math.round(ctx.damage * (1 + exploit * kinds));
  });

  registerCombatListener('afterHit', (ctx, world) => {
    const hit = swing(ctx, world);
    if (!hit) return;
    const { owner, minion, piece, target } = hit;
    const now = attackNow(ctx);
    const passives = owner.usesSkills.passives;

    // Avalanche: every few seconds it charges through a line of enemies and knocks them down.
    if ((piece.params.chargeEveryMs ?? 0) > 0 && ctx.damage > 0 && now >= getResource(minion.tracksCombat, AVALANCHE_NEXT_AT)) {
      setResource(minion.tracksCombat, AVALANCHE_NEXT_AT, now + (piece.params.chargeEveryMs ?? 0));
      avalancheCharge(world, owner, minion, piece, target, ctx.damage);
    }

    // Dartcaller: poison darts that ricochet to a second enemy.
    if ((piece.params.dartTicks ?? 0) > 0 && ctx.damage > 0) {
      const poisons = !evadeBlocksDebuffs(ctx);
      const dose = ctx.damage * (piece.params.dartTickShare ?? 0);
      if (poisons && target.hasHealth.hp > 0) {
        applyTickDot(world, owner, target, CONDUIT_POISON_ID, dose, piece.params.dartTicks ?? 0, DART_MAX_TICKS, DART_TICK_MS);
      }
      const second = playerAoeTargets(world, owner, target.hasPosition.current, piece.params.ricochetReach ?? 0, target.isMonster.id)
        .filter((candidate) => candidate.hasHealth.hp > 0)
        .sort((a, b) => distSq(a, target) - distSq(b, target))[0];
      if (second) {
        applyPlayerAoeTo(world, owner, [second], ctx.damage * (piece.params.ricochetShare ?? 0), 'summon', {}, {});
        if (poisons && second.hasHealth.hp > 0) {
          applyTickDot(world, owner, second, CONDUIT_POISON_ID, dose, piece.params.dartTicks ?? 0, DART_MAX_TICKS, DART_TICK_MS);
        }
      }
    }

    // Cleave (Graveyard weapon): the hit splashes part of its damage to the enemies around the target.
    const cleave = passives['conduit.cleave-pct'] ?? 0;
    if (cleave > 0 && ctx.damage > 0) {
      const victims = playerAoeTargets(world, owner, target.hasPosition.current, GEAR.cleaveRadius, target.isMonster.id);
      if (victims.length > 0) applyPlayerAoeTo(world, owner, victims, ctx.damage * cleave, 'summon', {}, {});
    }
  });

  // Charnel-Crown (Graveyard Soul): an enemy the formation kills rises for a short while as a thrall.
  registerCombatListener('onKill', (ctx) => {
    if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster' || !ctx.formation) return;
    const owner = ctx.attacker;
    const power = lineagePower(owner, 'graveyard');
    if (power <= 0) return;
    raiseHusk(owner, ctx.defender.hasPosition.current, owner.dealsDamage.attack * SOUL.thrallMult * power, SOUL.thrallMs, SOUL.thrallEveryMs, attackNow(ctx), SOUL.thrallCap);
  });
}

function distSq(a: MonsterEntity, b: MonsterEntity): number {
  const dx = a.hasPosition.current.x - b.hasPosition.current.x;
  const dy = a.hasPosition.current.y - b.hasPosition.current.y;
  return dx * dx + dy * dy;
}

/** The line the Avalanche charges down: from its body through the target, `chargeLength` long. */
function avalancheCharge(world: World, owner: PlayerEntity, minion: MinionEntity, piece: ConduitPiece, target: MonsterEntity, hitDamage: number): void {
  const from = minion.hasPosition.current;
  const length = piece.params.chargeLength ?? 0;
  const width = piece.params.chargeWidth ?? 0;
  let dx = target.hasPosition.current.x - from.x;
  let dy = target.hasPosition.current.y - from.y;
  const norm = Math.hypot(dx, dy) || 1;
  dx /= norm;
  dy /= norm;
  const victims = playerAoeTargets(world, owner, from, length + width).filter((monster) => {
    if (monster.hasHealth.hp <= 0) return false;
    const rx = monster.hasPosition.current.x - from.x;
    const ry = monster.hasPosition.current.y - from.y;
    const along = rx * dx + ry * dy;
    return along >= -width && along <= length && Math.abs(rx * dy - ry * dx) <= width;
  });
  if (victims.length === 0) return;
  const damage = hitDamage * (piece.params.chargeMult ?? 1) * (1 + (owner.usesSkills.passives['conduit.ability-pct'] ?? 0));
  applyPlayerAoeTo(world, owner, victims, damage, 'summon', {}, {});
  for (const victim of victims) {
    if (victim.hasHealth.hp > 0 && !monsterIgnoresControl(victim)) applyStun(victim.tracksCombat, piece.params.knockMs ?? 0, minion.isMinion.id);
  }
}

// ── Grave Pact (Graveyard vest) ─────────────────────────────────────────────

/** A hit that would kill you kills a summon instead. True when the pact paid for this hit. */
export function gravePactPays(world: World, owner: PlayerEntity, damage: number, now: number): boolean {
  const cooldown = owner.usesSkills.passives['conduit.grave-pact-ms'] ?? 0;
  if (cooldown <= 0 || damage < owner.hasHealth.hp) return false;
  if (now < getResource(owner.tracksCombat, GRAVE_PACT_READY_AT)) return false;
  // The cheapest body to lose: the weakest summon (a Soul is a trophy, not a sacrifice).
  const victim = livingMinions(world, owner)
    .filter((minion) => pieceOfSlot(minion.isMinion.slotId))
    .sort((a, b) => a.hasHealth.maxHp - b.hasHealth.maxHp)[0];
  if (!victim) return false;
  setResource(owner.tracksCombat, GRAVE_PACT_READY_AT, now + cooldown);
  victim.hasHealth.hp = 0;
  markSliceDirty(world, victim, 'hasHealth');
  return true;
}

// ── Pressure Seal (Trench vest) and Tidewater (Trench charm) ────────────────

/** The debuffs each body carried at the last pass, so a new one can be told from an old one. */
const SEEN = new WeakMap<TracksCombat, Set<string>>();

function pressureSeal(cs: TracksCombat, now: number, every: number): void {
  const current = debuffsOn(cs);
  const before = SEEN.get(cs);
  const sealed = getStatusEffect(cs, SEAL_EFFECT_ID);
  if (sealed && before) {
    // The next debuff it would receive is ignored: it comes off, and the seal is spent.
    const fresh = current.filter((id) => !before.has(id));
    if (fresh.length > 0) {
      for (const id of fresh) removeStatusEffect(cs, id);
      removeStatusEffect(cs, SEAL_EFFECT_ID);
      setResource(cs, SEAL_READY_AT, now + every);
    }
  } else if (!sealed && now >= getResource(cs, SEAL_READY_AT)) {
    applyStatusEffect(cs, { id: SEAL_EFFECT_ID, maxStacks: 1, remainingMs: -1, refreshable: false, sourceId: 'conduit', data: {} });
  }
  SEEN.set(cs, new Set(debuffsOn(cs)));
}

// ── Per tick ────────────────────────────────────────────────────────────────

/** Abyssal Warden: pull one debuff off a nearby body (a summon or you) onto itself. */
function wardenPull(world: World, owner: PlayerEntity, warden: MinionEntity, radius: number): void {
  const reach = radius * radius;
  let source: TracksCombat | undefined;
  let worst: string[] = [];
  const bodies: Array<{ cs: TracksCombat; at: { x: number; y: number } }> = [
    { cs: owner.tracksCombat, at: owner.hasPosition.current },
    ...livingMinions(world, owner).filter((minion) => minion !== warden).map((minion) => ({ cs: minion.tracksCombat, at: minion.hasPosition.current })),
  ];
  for (const body of bodies) {
    const dx = body.at.x - warden.hasPosition.current.x;
    const dy = body.at.y - warden.hasPosition.current.y;
    if (dx * dx + dy * dy > reach) continue;
    const ids = debuffsOn(body.cs);
    if (ids.length > worst.length) { source = body.cs; worst = ids; }
  }
  if (!source) return;
  const id = worst
    .map((candidate) => ({ id: candidate, stacks: getStatusEffect(source!, candidate)?.stacks ?? 0 }))
    .sort((a, b) => (b.stacks - a.stacks) || a.id.localeCompare(b.id))[0]!.id;
  const effect = getStatusEffect(source, id);
  if (!effect) return;
  const moved = applyStatusEffect(warden.tracksCombat, {
    id, maxStacks: effect.maxStacks, remainingMs: effect.remainingMs, refreshable: effect.refreshable,
    sourceId: effect.sourceId, ...(effect.damageSource ? { damageSource: effect.damageSource } : {}), data: { ...effect.data },
  });
  moved.stacks = Math.max(moved.stacks, effect.maxStacks > 0 ? Math.min(effect.maxStacks, effect.stacks) : effect.stacks);
  removeStatusEffect(source, id);
}

export function updateConduitT4(world: World, owner: PlayerEntity, dt: number, now: number): void {
  if (!owner.summonsMinions) return;
  setResource(owner.tracksCombat, TICK_NOW, now);
  const fighting = inFight(owner);
  const passives = owner.usesSkills.passives;
  tickHusks(world, owner, now);

  for (const minion of livingMinions(world, owner)) {
    const cs = minion.tracksCombat;
    const piece = pieceOfSlot(minion.isMinion.slotId);
    if (!piece) continue;

    if (fighting) {
      if ((piece.params.shellEveryMs ?? 0) > 0 && now >= getResource(cs, SHELL_NEXT_AT)) {
        setResource(cs, SHELL_NEXT_AT, now + piece.params.shellEveryMs!);
        shellAbility(world, owner, minion, piece, 1);
        echoSupport(world, owner, minion, undefined);
      }
      if ((piece.params.mirageEveryMs ?? 0) > 0 && now >= getResource(cs, MIRAGE_NEXT_AT)) {
        setResource(cs, MIRAGE_NEXT_AT, now + piece.params.mirageEveryMs!);
        mirageAbility(world, owner, minion, piece, 1, now);
        echoSupport(world, owner, minion, undefined);
      }
      // Obsidian Tortoise: every so often it withdraws into its shell (it keeps taunting).
      if ((piece.params.withdrawEveryMs ?? 0) > 0 && now >= getResource(cs, WITHDRAW_NEXT_AT)) {
        setResource(cs, WITHDRAW_NEXT_AT, now + piece.params.withdrawEveryMs!);
        const ms = piece.params.withdrawMs ?? 0;
        applyStatusEffect(cs, {
          id: WITHDRAW_EFFECT_ID, maxStacks: 1, remainingMs: ms, refreshable: true, sourceId: minion.isMinion.id,
          data: { block: piece.params.withdrawBlock ?? 0, totalMs: ms },
        });
        setResource(cs, WITHDRAW_UNTIL, now + ms);
      }
    }
    if (getStatusEffect(cs, WITHDRAW_EFFECT_ID) && now >= getResource(cs, WITHDRAW_UNTIL)) removeStatusEffect(cs, WITHDRAW_EFFECT_ID);

    if ((piece.params.wardenEveryMs ?? 0) > 0 && now >= getResource(cs, WARDEN_NEXT_AT)) {
      setResource(cs, WARDEN_NEXT_AT, now + piece.params.wardenEveryMs!);
      wardenPull(world, owner, minion, piece.params.wardenRadius ?? 0);
    }
  }

  // Pressure Seal: every few seconds each body (you and every summon) ignores the next debuff it would receive.
  const seal = passives['conduit.pressure-seal-ms'] ?? 0;
  if (seal > 0) {
    pressureSeal(owner.tracksCombat, now, seal);
    for (const minion of livingMinions(world, owner)) pressureSeal(minion.tracksCombat, now, seal);
  }

  // Tidewater: your Recovery doubles while you carry three or more debuffs.
  const tide = passives['conduit.tidewater-pct'] ?? 0;
  if (tide > 0 && (owner.hasHealth.recovery ?? 0) > 0 && debuffsOn(owner.tracksCombat).length >= GEAR.tidewaterDebuffs) {
    applyHealToPlayer(owner, owner.tracksCombat, (owner.hasHealth.recovery ?? 0) * tide * (dt / 1_000), world);
  }
}
