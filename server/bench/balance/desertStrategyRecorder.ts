import assert from 'node:assert/strict';
import { composePlayerView, RUNE_RECIPE_DATABASE, isRuneRecipeUnlocked } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../src/ecs/entity';
import type { World } from '../../src/world/World';
import { getAutoTargetId } from '../../src/systems/combat/ai/targetPriority';

// Observation labels only; never supplied to the production target selector.
export function desertRole(type: string) {
  return type === 'sandspitter-cobra' ? 'dealer'
    : ['sand-viper', 'dune-basilisk', 'dune-tyrant'].includes(type) ? 'controller' : 'other';
}
export function desertTargetingReadback(bot: PlayerEntity) {
  const p = bot.tracksProgression;
  const recipes = [...RUNE_RECIPE_DATABASE.values()].filter(r => r.runeId === 'focus-lowest-hp');
  const active = p.runesEquipped.some(r => r.actionId === 'focus-lowest-hp');
  if (active) {
    assert(recipes.length && recipes.every(r => isRuneRecipeUnlocked(r, p)));
    assert(p.runesOwned.includes('focus-lowest-hp'));
    assert(p.runesOwned.includes('in-combat'));
  }
  return { active, ownedFragments: [...p.runesOwned], recipes: recipes.map(r => ({ id: r.id, unlocked: isRuneRecipeUnlocked(r, p) })),
    acquisition: 'Existing synthetic mature-package recipe-unlock path; no live acquisition measurement.',
    rules: structuredClone(p.runesEquipped) };
}
type Member = { id: string; type: string; role: string; firstSeenMs: number; killedAtMs: number | null };
type Bond = { packId: string; members: Member[]; firstBothEngagedMs: number | null; bothEngagedMs: number;
  ownerHpDamage: number; ownerAbsorbed: number; controlledMs: number; lostMembership: boolean };
export function bondResult(b: Bond, outcome: string) {
  const dealer = b.members.filter(m => m.role === 'dealer'), controller = b.members.filter(m => m.role === 'controller');
  const ambiguous = b.members.length !== 2 || dealer.length !== 1 || controller.length !== 1 || b.lostMembership;
  const d = dealer[0]?.killedAtMs ?? null, c = controller[0]?.killedAtMs ?? null;
  const exposed = b.firstBothEngagedMs !== null;
  return { ...b, exposed, status: ambiguous ? 'ambiguous' : !exposed ? 'no-both-engaged-exposure'
    : d !== null && c !== null ? 'cleared' : outcome === 'player-died' ? 'unfinished-at-player-death' : 'unfinished-at-cap',
    killOrder: ambiguous ? 'ambiguous' : d !== null && c !== null && d === c ? 'same-tick'
      : d !== null && (c === null || d < c) ? 'dealer-first' : c !== null ? 'controller-first' : 'neither-killed',
    dealerRemovalMsFromFirstBothEngaged: !ambiguous && exposed && d !== null && d >= b.firstBothEngagedMs! ? d - b.firstBothEngagedMs! : null };
}
/** Passive per-tick observations, with authoritative kill/damage events. No world mutation. */
export class DesertStrategyRecorder {
  readonly events: unknown[] = [];
  private bonds = new Map<string, Bond>();
  private before: ReturnType<DesertStrategyRecorder['state']> | null = null;
  private atMs = 0;
  private overlappingBondExposureTicks = 0;
  constructor(private world: World, private bot: PlayerEntity) {}
  state() {
    const b = this.bot, v = composePlayerView(b)!;
    return { selectedTargetId: getAutoTargetId(b), attackTargetId: b.hasAttackTarget?.targetId ?? null,
      formationTargetId: b.summonsMinions?.formationTargetId ?? null, command: structuredClone(b.hasSummonerCommand ?? null),
      hp: v.hp, barrier: v.barrier, pos: { ...b.hasPosition.current }, rooted: !!b.isRooted,
      effects: structuredClone(b.tracksCombat.statusEffects),
      minions: [...this.world.minionEntities].filter(m => m.isMinion.ownerPlayerId === b.isPlayer.id).map(m => ({
        id: m.entityId, targetId: m.hasAttackTarget?.targetId ?? null, currentTargetId: m.controlsMinion.currentTargetId })),
      monsters: [...this.world.monsterEntitiesInNode(b.hasPosition.nodeId)].map(m => ({ id: m.entityId,
        type: m.isMonster.monsterTypeId, role: desertRole(m.isMonster.monsterTypeId), hp: m.hasHealth.hp, maxHp: m.hasHealth.maxHp,
        packId: m.inPack?.packId ?? null, packRole: m.inPack?.role ?? null,
        pos: { ...m.hasPosition.current }, aggro: structuredClone(m.hasAggroTarget ?? null),
        attackTargetId: m.hasAttackTarget?.targetId ?? null, awareness: m.hasAwareness?.state ?? null,
        invulnerable: !!m.isInvulnerable, concealed: !!m.isConcealed })) };
  }
  beforeTick() {
    this.before = this.state();
    for (const m of this.before.monsters) {
      if (!m.packId) continue;
      let b = this.bonds.get(m.packId);
      if (!b) { b = { packId: m.packId, members: [], firstBothEngagedMs: null, bothEngagedMs: 0,
        ownerHpDamage: 0, ownerAbsorbed: 0, controlledMs: 0, lostMembership: false }; this.bonds.set(m.packId, b); }
      if (!b.members.some(x => x.id === m.id)) b.members.push({ id: m.id, type: m.type, role: m.role, firstSeenMs: this.atMs, killedAtMs: null });
    }
  }
  afterTick(atMs: number) {
    const before = this.before!, after = this.state(), journal = this.world.worldLogJournal;
    const ownerIds = new Set([this.bot.isPlayer.id, ...before.minions.map(m => m.id)]);
    const engaged = (id: string) => before.monsters.some(m => m.id === id && m.hp > 0 &&
      ((m.aggro && ownerIds.has(m.aggro.targetId)) || (m.attackTargetId && ownerIds.has(m.attackTargetId))));
    const exposure: string[] = [];
    for (const b of this.bonds.values()) {
      const both = b.members.some(m => m.role === 'dealer' && engaged(m.id)) && b.members.some(m => m.role === 'controller' && engaged(m.id));
      if (both) { b.firstBothEngagedMs ??= atMs; b.bothEngagedMs += 100; exposure.push(b.packId); }
      // Pressure from first simultaneous engagement until the dealer's kill, including temporary disengagement.
      const pressure = b.firstBothEngagedMs !== null && b.members.some(m => m.role === 'dealer' && m.killedAtMs === null);
      if (pressure && before.effects.some(e => e.id === 'root' || e.id === 'slow')) b.controlledMs += 100;
      for (const e of journal) {
        if (e.kind === 'kill') { const m = b.members.find(m => m.id === e.victim.id); if (m) m.killedAtMs ??= atMs; }
        if (pressure && e.kind === 'damage' && e.target.id === this.bot.isPlayer.id) {
          b.ownerHpDamage += e.hpDamage; b.ownerAbsorbed += e.absorbed;
        }
      }
      for (const m of b.members) {
        const live = after.monsters.find(x => x.id === m.id);
        if (m.killedAtMs === null && (!live || live.packId !== b.packId)) b.lostMembership = true;
      }
    }
    if (exposure.length > 1) this.overlappingBondExposureTicks++;
    this.events.push({ atMs, before, after, exposedPackIds: exposure,
      cleanseActivations: journal.filter(e => e.kind === 'ability-activation' && e.player.id === this.bot.isPlayer.id && e.abilityId === 'cleanse') });
    this.atMs = atMs + 100;
  }
  finish(outcome: string) {
    return { bonds: [...this.bonds.values()].map(b => bondResult(b, outcome)), overlappingBondExposureTicks: this.overlappingBondExposureTicks,
      eligibleDealer: { value: null, reason: 'Exact selector eligibility/path search is not exposed. Tick states record dealer presence, aggro, root, visibility and targets; do not equate presence with eligibility.' },
      measurement: '100ms pre/post states; event times label tick starts. Both engaged means both members target/aggro owner or owned minions. Pressure is all incoming owner HP/absorption from first both-engaged sample through dealer kill, not causal attribution to that bond. Overlapping intervals must not be summed. Root/slow time is sampled. Replacement payments are separate Conduit events. Same-tick kills have no inferred order; disappearance without a kill is ambiguous.' };
  }
}
