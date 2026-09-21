import { randomUUID } from 'node:crypto';
import { BIOME_DATABASE, ESSENCE_TYPES, SKILL_TREE, NODE_BIOMES, bossClearKey, type DeathCause, type GameplayBuild, type GameplayCohort, type GameplayDamage, type GameplayEvent, type GameplayPayload, type EncounterOutcome, type WorldLogEvent } from '@mmo-idle/shared';
import type { PlayerEntity, MonsterEntity } from '../ecs/entity';
import type { World } from '../world/World';
import { canUnlockEntitySkill } from '../ecs/playerEntityFormulas';
import { CONDUIT_ENABLED } from '../env';

const DECISIONS_WITHOUT_BUILD_CHANGE = new Set([
  'craft', 'evolve', 'reconstruct', 'craft-rune', 'craft-ability', 'craft-stance', 'craft-rite', 'upgrade', 'navigate', 'navigate-neighbor',
]);

/** Explicit projection: never serialize an entity, socket payload, actor or account. */
export function gameplayBuild(p: PlayerEntity): GameplayBuild {
  return {
    classId: p.usesSkills.selectedClass, frame: p.usesSkills.selectedSubVariant, range: p.usesSkills.selectedRange,
    tier: p.tracksProgression.playerTier, level: p.tracksProgression.level,
    biomeLevels: [...BIOME_DATABASE.keys()].map(biome => ({ biome, level: p.tracksProgression.biomeLevel[biome] ?? 0 })),
    stats: { maxHp: p.hasHealth.maxHp, attack: p.dealsDamage.attack, attackRange: p.performsAttack.attackRange, attackCooldown: p.performsAttack.attackCooldown, plating: p.mitigatesDamage.plating, damageReduction: p.mitigatesDamage.damageReduction },
    skills: [...p.usesSkills.unlockedSkills],
    equipment: Object.entries(p.holdsInventory.equipment).flatMap(([slot, itemId]) => itemId ? [{ slot, itemId, upgrade: p.holdsInventory.itemUpgrades[itemId] ?? 0 }] : []),
    techniques: [...p.tracksProgression.attunedAbilities.techniques], guards: [...p.tracksProgression.attunedAbilities.guards],
    stances: [...(p.tracksProgression.attunedStances ?? [])], defaultStance: p.tracksProgression.equippedStances.default,
    rites: [...p.tracksProgression.equippedRites],
    runes: p.tracksProgression.runesEquipped.map(r => ({ conditionId: r.conditionId, actionId: r.actionId, targetStanceId: r.targetStanceId, targetAbilityId: r.targetAbilityId })),
    auto: p.usesAutocombat.auto, autoTraverse: p.usesAutocombat.autoTraverse,
    priorityMode: p.usesAutocombat.priorityMode, acquireRadius: p.usesAutocombat.acquireRadius,
    focusLeaderTarget: p.usesAutocombat.focusLeaderTarget,
    engageUltimateBosses: p.usesAutocombat.engageUltimateBosses,
    fleeWhenLow: p.usesAutocombat.fleeWhenLow, fleeHpPct: p.usesAutocombat.fleeHpPct,
  };
}
function wallet(p: PlayerEntity): Record<string, number> {
  return Object.fromEntries([
    ...ESSENCE_TYPES.map(k => [`essence:${k}`, p.tracksProgression.essences[k] ?? 0] as const),
    ...[...BIOME_DATABASE.keys()].map(k => [`catalyst:${k}`, p.tracksProgression.catalysts[k] ?? 0] as const),
  ]);
}
interface Attempt {
  id: string; bossId: string; bossType: string; nodeId: string; start: number; lastEngaged: number;
  build: GameplayBuild; previouslyCleared: boolean; partySize: number; hp: number; damageTaken: number; damageDealt: number;
}
interface Session {
  characterId: string; sessionId: string; cohort: GameplayCohort; start: number; lastSample: number;
  nodeId: string; exposure: number; combat: number; build: GameplayBuild;
  wallet: Record<string, number>; recentDamage: GameplayDamage[]; attempts: Map<string, Attempt>;
  alive: boolean; inCombat: boolean; afterFailure: 'death' | 'retreat' | null;
  sequence: number;
}
export class GameplayRecorder {
  private sessions = new Map<string, Session>();
  constructor(private readonly emit: (event: GameplayEvent) => void, private readonly version: string, private readonly now = Date.now) {}
  start(p: PlayerEntity, characterId: string, cohort: GameplayCohort): void {
    if (this.sessions.has(p.isPlayer.id)) return;
    const now = this.now();
    const s: Session = { characterId, sessionId: randomUUID(), sequence: 0, cohort, start: now, lastSample: now, nodeId: p.hasPosition.nodeId, exposure: 0, combat: 0, build: gameplayBuild(p), wallet: wallet(p), recentDamage: [], attempts: new Map(), alive: !p.isDead, inCombat: !!p.tracksEngagement, afterFailure: null };
    this.sessions.set(p.isPlayer.id, s);
    this.write(s, { kind: 'session-start', build: s.build }, now);
  }
  private write(s: Session, payload: GameplayPayload, ts = this.now(), nodeId = s.nodeId, build = s.build): void {
    this.emit({ id: randomUUID(), schemaVersion: 1, ts, gameVersion: this.version, characterId: s.characterId, sessionId: s.sessionId, sequence: ++s.sequence, cohort: s.cohort, nodeId, classId: build.classId ?? 'unselected', tier: build.tier, payload });
  }
  markTest(playerId?: string): void {
    for (const [id, s] of this.sessions) if (!playerId || id === playerId) {
      this.advance(s, this.now());
      this.flushExposure(s);
      for (const a of [...s.attempts.values()]) this.endAttempt(s, a, 'interrupted', this.now());
      s.cohort = 'test';
    }
  }
  private flushExposure(s: Session): void {
    if (s.exposure > 0) this.write(s, { kind: 'exposure', durationMs: s.exposure, combatMs: s.combat });
    s.exposure = 0; s.combat = 0;
  }
  private advance(s: Session, now: number): void {
    const dt = Math.min(2_000, Math.max(0, now - s.lastSample));
    if (s.alive) { s.exposure += dt; if (s.inCombat) s.combat += dt; }
    s.lastSample = now;
  }
  transition(playerId: string, nodeId: string): void {
    const s = this.sessions.get(playerId);
    if (!s || nodeId === s.nodeId) return;
    this.advance(s, this.now());
    this.flushExposure(s);
    for (const a of [...s.attempts.values()]) this.endAttempt(s, a, 'retreat', this.now());
    s.nodeId = nodeId;
  }
  private observeWallet(s: Session, p: PlayerEntity): void {
    const next = wallet(p);
    for (const [resource, value] of Object.entries(next)) {
      const diff = value - (s.wallet[resource] ?? value);
      if (diff) this.write(s, { kind: 'resource', resource, earned: Math.max(0, diff), spent: Math.max(0, -diff) });
    }
    s.wallet = next;
  }
  /** Capture immediately before an accepted-operation candidate; finish only on success/change. */
  beforeDecision(p: PlayerEntity) {
    const s = this.sessions.get(p.isPlayer.id);
    if (!s) return undefined;
    this.advance(s, this.now());
    this.observeWallet(s, p);
    return {
      before: gameplayBuild(p),
      availableSkills: [...SKILL_TREE.keys()].filter(id => (id !== 'summoner-root' || CONDUIT_ENABLED) && canUnlockEntitySkill(p, id).ok),
      ownedItems: [...p.holdsInventory.inventory], availableRecipes: [...p.tracksProgression.unlockedRecipes],
      knownAbilities: [...p.tracksProgression.knownAbilities], knownRunes: [...p.tracksProgression.runesOwned],
      knownStances: [...p.tracksProgression.knownStances], knownRites: [...p.tracksProgression.knownRites],
      skillPoints: p.tracksProgression.skillPoints,
    };
  }
  decision(p: PlayerEntity, action: string, choice: string | null, before: ReturnType<GameplayRecorder['beforeDecision']>, succeeded?: boolean): void {
    const s = this.sessions.get(p.isPlayer.id);
    if (!s || !before) return;
    const build = gameplayBuild(p);
    if (succeeded === false) return;
    if (JSON.stringify(before.before) === JSON.stringify(build) &&
      !(succeeded === true && DECISIONS_WITHOUT_BUILD_CHANGE.has(action))) return;
    this.flushExposure(s);
    s.build = build;
    this.write(s, { kind: 'decision', action, choice, afterFailure: s.afterFailure, ...before, build });
    this.observeWallet(s, p);
  }
  sample(world: World, now: number): void {
    for (const [id, s] of this.sessions) {
      const p = world.getPlayerEntity(id);
      if (!p) { this.stop(id, 'interrupted'); continue; }
      if (world.rewardMultiplier !== 1 && s.cohort !== 'test') this.markTest(id);
      if (now - s.lastSample < 1_000) continue;
      // Account only observed simulation time; a stalled process is not playtime.
      this.advance(s, now);
      if (s.nodeId !== p.hasPosition.nodeId) {
        this.flushExposure(s);
        for (const a of [...s.attempts.values()]) this.endAttempt(s, a, 'retreat', now);
        s.nodeId = p.hasPosition.nodeId;
      }
      s.alive = !p.isDead;
      s.inCombat = !!p.tracksEngagement;
      if (s.exposure >= 30_000) this.flushExposure(s);
      this.observeWallet(s, p);
      const current = gameplayBuild(p);
      if (current.tier !== s.build.tier || current.classId !== s.build.classId) this.flushExposure(s);
      s.build = current;
      const target = p.hasAttackTarget ? world.getMonsterEntity(p.hasAttackTarget.targetId) : undefined;
      if (target?.isMonster.isBoss && !p.isDead) this.engage(world, s, p, target, now);
      for (const a of [...s.attempts.values()]) {
        const boss = world.getMonsterEntity(a.bossId);
        if (boss) a.hp = fraction(boss);
        if (!boss) this.endAttempt(s, a, 'interrupted', now);
        else if (now - a.lastEngaged >= 10_000) this.endAttempt(s, a, 'retreat', now);
      }
    }
  }
  private engage(world: World, s: Session, p: PlayerEntity, boss: MonsterEntity, now: number): Attempt {
    const existing = s.attempts.get(boss.isMonster.id);
    if (existing) { existing.lastEngaged = now; existing.hp = fraction(boss); return existing; }
    const partySize = Math.max(1, p.inParty?.members.filter(member => {
      const participant = world.getPlayerEntity(member.id);
      return participant && !participant.isDead && participant.hasPosition.nodeId === boss.hasPosition.nodeId;
    }).length ?? 1);
    const a: Attempt = { id: randomUUID(), bossId: boss.isMonster.id, bossType: boss.isMonster.monsterTypeId, nodeId: boss.hasPosition.nodeId, start: now, lastEngaged: now, hp: fraction(boss), build: gameplayBuild(p), previouslyCleared: p.tracksProgression.bossesCleared.includes(bossClearKey(NODE_BIOMES[boss.hasPosition.nodeId]?.biomeGroup ?? '', NODE_BIOMES[boss.hasPosition.nodeId]?.biomeTier ?? 0)), partySize, damageTaken: 0, damageDealt: 0 };
    s.attempts.set(a.bossId, a);
    s.afterFailure = null;
    this.write(s, { kind: 'encounter-start', attemptId: a.id, bossType: a.bossType, build: a.build, partySize: a.partySize, bossHpFraction: a.hp }, now, a.nodeId, a.build);
    return a;
  }
  private endAttempt(s: Session, a: Attempt, outcome: EncounterOutcome, now: number): void {
    s.attempts.delete(a.bossId);
    if (outcome === 'death' || outcome === 'retreat') s.afterFailure = outcome;
    this.write(s, { kind: 'encounter-end', attemptId: a.id, bossType: a.bossType, build: a.build, partySize: a.partySize, outcome, previouslyCleared: a.previouslyCleared, durationMs: Math.max(0, now - a.start), bossHpFraction: outcome === 'victory' ? 0 : a.hp, damageDealt: a.damageDealt, damageTaken: a.damageTaken }, now, a.nodeId, a.build);
  }
  /** Called once per authoritative event, before world-log observer fanout. */
  worldEvent(world: World, e: WorldLogEvent): void {
    if (e.kind === 'kill') {
      for (const s of this.sessions.values()) {
        const a = s.attempts.get(e.victim.id);
        if (a) this.endAttempt(s, a, 'victory', e.serverTime);
      }
    }
    if (e.kind === 'damage') {
      const outgoing = e.source.actorType === 'player' ? e.source.id : e.source.ownerPlayerId;
      const incoming = e.target.actorType === 'player' ? e.target.id : undefined;
      for (const id of new Set([outgoing, incoming])) {
        if (!id) continue;
        const s = this.sessions.get(id), p = world.getPlayerEntity(id);
        if (!s || !p || p.isDead) continue;
        const boss = world.getMonsterEntity(id === outgoing ? e.target.id : e.source.id);
        if (boss?.isMonster.isBoss) this.engage(world, s, p, boss, e.serverTime);
        if (id === incoming) {
          s.recentDamage = s.recentDamage.filter(d => d.at >= e.serverTime - 10_000).slice(-31);
          s.recentDamage.push({ at: e.serverTime, sourceType: world.getMonsterEntity(e.source.id)?.isMonster.monsterTypeId ?? null, damageType: e.damageType, hpDamage: e.hpDamage });
        }
        for (const a of s.attempts.values()) {
          if (id === incoming) a.damageTaken += e.hpDamage;
          if (id === outgoing && a.bossId === e.target.id) a.damageDealt += e.hpDamage;
        }
      }
    }
    if ((e.kind === 'biome-level-up' || e.kind === 'player-tier-up')) {
      const s = this.sessions.get(e.player.id);
      if (s) this.write(s, { kind: 'progression', milestone: e.kind === 'biome-level-up' ? `biome:${e.biomeGroup}` : 'player-tier', value: e.kind === 'biome-level-up' ? e.newLevel : e.newTier, sessionElapsedMs: Math.max(0, e.serverTime - s.start) }, e.serverTime, e.nodeId);
    }
  }
  /** Death must be captured before the server clears status/automation state. */
  death(world: World, p: PlayerEntity, cause: DeathCause): void {
    const s = this.sessions.get(p.isPlayer.id);
    if (!s) return;
    const now = this.now();
    this.advance(s, now);
    this.flushExposure(s);
    s.alive = false;
    s.afterFailure = 'death';
    const killer = 'killer' in cause ? cause.killer : undefined;
    const build = gameplayBuild(p);
    this.write(s, { kind: 'death', build, x: p.hasPosition.current.x, y: p.hasPosition.current.y, cause: cause.kind, ability: cause.abilityName ?? (cause.kind === 'dot' ? cause.effectName ?? null : cause.kind === 'stance' ? cause.stanceName : null), killerType: killer?.monsterTypeId ?? null, damage: cause.damage, statuses: p.tracksCombat.statusEffects.map(e => ({ effectId: e.id, stacks: e.stacks })), recentDamage: s.recentDamage.filter(d => d.at >= now - 10_000).map(d => ({ ...d })) }, now, p.hasPosition.nodeId, build);
    for (const a of [...s.attempts.values()]) {
      const boss = world.getMonsterEntity(a.bossId);
      if (boss) a.hp = fraction(boss);
      this.endAttempt(s, a, 'death', now);
    }
    s.recentDamage = [];
  }
  stop(playerId: string, reason: 'disconnect' | 'interrupted', player?: PlayerEntity): void {
    const s = this.sessions.get(playerId);
    if (!s) return;
    this.advance(s, this.now());
    if (player) this.observeWallet(s, player);
    this.flushExposure(s);
    for (const a of [...s.attempts.values()]) this.endAttempt(s, a, reason, this.now());
    this.write(s, { kind: 'session-end', durationMs: Math.max(0, this.now() - s.start), reason });
    this.sessions.delete(playerId);
  }
  shutdown(): void { for (const id of [...this.sessions.keys()]) this.stop(id, 'interrupted'); }
}
function fraction(boss: MonsterEntity): number { return Math.max(0, Math.min(1, boss.hasHealth.hp / Math.max(1, boss.hasHealth.maxHp))); }
