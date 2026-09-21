import { composePlayerView, relicRatingsFromPassives, summonerProfileWeightTotals } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../src/ecs/entity';
import type { World } from '../../src/world/World';
import { summonerProfileFor } from '../../src/systems/classes/archetypes/summoner/profile';
import { computeMinionMaxHp } from '../../src/systems/classes/archetypes/summoner/spawn';
import { observeSummoner, type SummonObservation } from '../../src/systems/classes/archetypes/summoner/observation';
import { isPlayerInCombat } from '../../src/systems/combat/ai/engagement';
import type { BreadthCell } from './playerBreadthSpec';

export function supportedLegacyFormation(samples: Record<string, unknown>[]) {
  if (!samples.length || samples.some(s => !Array.isArray(s.minions))) return {
    livingBodyCounts: null, targetIds: null, unavailableReason: 'Historical boss sample schema does not record minions or summon targets.' };
  return { livingBodyCounts: samples.map(s => (s.minions as {hp:number}[]).filter(m => m.hp > 0).length),
    targetIds: samples.map(s => (s.minions as {target?:string}[]).map(m => m.target ?? null)), unavailableReason: null };
}
type Life = { id: string; slot: number; role: string; spawnAtMs: number; replacement: boolean;
  firstAttackAtMs: number | null; endAtMs: number | null; cause: string | null; lifetimeMs: number | null };
type Episode = { startAtMs: number; aboveHalfAtMs: number | null; fullAtMs: number | null; censored: boolean; terminal: string | null };
export class ConduitRecorder {
  atMs = 0;
  readonly events: unknown[] = [];
  readonly snapshots: unknown[] = [];
  readonly lives = new Map<string, Life>();
  readonly episodes: Episode[] = [];
  private initialized = new Set<number>();
  private activeEpisode: Episode | null = null;
  private dispose: () => void;
  private previousQueue = '';
  private measuredMs = 0;
  private initializedMs = 0;
  private bodyIntegral = 0;
  private offenseIntegral = 0;
  private procIntegral = 0;
  private zeroMs = 0;
  private halfMs = 0;
  private exposureMs = 0;
  private blockedMs = 0;
  private attempts = 0;
  private replacements = 0;
  private paidHp = 0;
  private queueHealHp = 0;
  private queueDepthIntegral = 0;
  private exposureByState = { intact: 0, depleted: 0 };
  private delivery = new Map<string, { state: string; targetId: string; targetType: string; phase: string; attempts: number; primaryHpDecrease: number; exposureMs: number }>();

  constructor(private world: World, private owner: PlayerEntity, readonly treatment: BreadthCell['playerTreatment']) {
    if (treatment === 'reconstruction-r1') throw new Error('Historical reconstruction-r1 requires its pinned pre-adoption checkout');
    this.dispose = observeSummoner(owner, e => this.record(e));
  }
  private availability() {
    const profile = summonerProfileFor(this.owner), totals = summonerProfileWeightTotals(profile);
    const live = profile.slots.map((slot, i) => ({ slot, i, minion: this.world.getMinionEntity(this.owner.summonsMinions?.minionIds[i] ?? '') }))
      .filter(x => x.minion && x.minion.hasHealth.hp > 0);
    const ownerShare = this.owner.isDead || this.owner.hasHealth.hp <= 0 ? 0 : profile.battleBondConduitOffenseWeight;
    return { profile, live, bodies: live.length / profile.slots.length,
      offense: (ownerShare + live.reduce((n,x) => n+x.slot.offenseWeight,0)) / totals.offense,
      proc: (ownerShare + live.reduce((n,x) => n+x.slot.procWeight,0)) / totals.proc,
      initialized: this.initialized.size === profile.slots.length };
  }
  private record(e: SummonObservation) {
    if (e.kind === 'queue-heal') { this.queueHealHp += e.hp; return; }
    if (e.kind === 'replacement-attempt') {
      this.attempts++; if(e.blocked) this.blockedMs += e.dtMs;
      // Online totals plus queue snapshots retain blocked exposure without 10Hz event dumps.
      return;
    }
    if (e.kind === 'replacement-paid') { this.replacements++; this.paidHp += e.hp; }
    if (e.kind === 'spawn') {
      this.initialized.add(e.slot);
      this.lives.set(e.id, { id: e.id, slot: e.slot, role: summonerProfileFor(this.owner).slots[e.slot].role,
        spawnAtMs: this.atMs, replacement: e.replacement, firstAttackAtMs: null, endAtMs: null, cause: null, lifetimeMs: null });
    }
    if (e.kind === 'sacrifice') { const life = this.lives.get(e.id); if (life) life.cause = 'deliberate-sacrifice'; }
    if (e.kind === 'attack') {
      const life = this.lives.get(e.id); if(life && life.firstAttackAtMs === null) life.firstAttackAtMs = this.atMs;
      const a = this.availability(), state = a.offense >= 0.8 ? 'intact' : 'depleted';
      const phase = e.targetHpFractionBefore > 0.5 ? 'above-half-hp' : 'at-or-below-half-hp';
      const key = [state,e.targetId,phase].join(':');
      const d = this.delivery.get(key) ?? {state, targetId:e.targetId,targetType:e.targetType,phase,attempts:0,primaryHpDecrease:0,exposureMs:0};
      d.attempts++; d.primaryHpDecrease += e.primaryHpDecrease; this.delivery.set(key,d);
      this.events.push({atMs:this.atMs, ...e, authoredAvailability:a.offense}); return;
    }
    this.events.push({atMs:this.atMs, ...e});
  }
  beforeTick(atMs: number, dtMs: number, now: number) {
    this.atMs = atMs;
    const a = this.availability(); this.measuredMs += dtMs;
    const combat = isPlayerInCombat(this.owner, now);
    if(combat) { this.exposureMs += dtMs; this.exposureByState[a.offense >= 0.8 ? 'intact' : 'depleted'] += dtMs; }
    for(const targetId of new Set(a.live.map(x=>x.minion!.controlsMinion.currentTargetId).filter((id):id is string=>!!id))) {
      const target=this.world.getMonsterEntity(targetId); if(!target || target.hasHealth.hp<=0) continue;
      const state=a.offense>=0.8?'intact':'depleted',phase=target.hasHealth.hp/target.hasHealth.maxHp>0.5?'above-half-hp':'at-or-below-half-hp';
      const key=[state,targetId,phase].join(':');
      const d=this.delivery.get(key)??{state,targetId,targetType:target.isMonster.monsterTypeId,phase,attempts:0,primaryHpDecrease:0,exposureMs:0};
      d.exposureMs+=dtMs;this.delivery.set(key,d);
    }
    if(a.initialized) {
      this.initializedMs += dtMs; this.bodyIntegral += a.bodies*dtMs;
      this.offenseIntegral += a.offense*dtMs; this.procIntegral += a.proc*dtMs;
      if(!a.live.length) this.zeroMs += dtMs; if(a.offense <= 0.5) this.halfMs += dtMs;
    }
    const s = this.owner.summonsMinions!;
    this.queueDepthIntegral += (s.reconstructionQueue.length + (s.activeReconstruction ? 1 : 0))*dtMs;
  }
  afterTick() {
    const a = this.availability();
    for(const life of this.lives.values()) {
      if(life.endAtMs !== null) continue;
      const m = this.world.getMinionEntity(life.id);
      if(m && m.hasHealth.hp > 0) continue;
      life.endAtMs = this.atMs; life.lifetimeMs = this.atMs-life.spawnAtMs;
      life.cause ??= m && m.hasHealth.hp <= 0 ? 'combat-death' : 'unknown-removal';
      this.events.push({atMs:this.atMs,kind:'death-or-removal',...life});
    }
    if(a.initialized && a.offense <= 0.5 && !this.activeEpisode) {
      this.activeEpisode = {startAtMs:this.atMs,aboveHalfAtMs:null,fullAtMs:null,censored:false,terminal:null};
      this.episodes.push(this.activeEpisode);
    }
    if(this.activeEpisode) {
      if(a.offense > 0.5) this.activeEpisode.aboveHalfAtMs ??= this.atMs;
      if(a.offense >= 1-1e-9) { this.activeEpisode.fullAtMs = this.atMs; this.activeEpisode = null; }
    }
    const s = this.owner.summonsMinions!;
    const queueKey = JSON.stringify([s.reconstructionQueue,s.activeReconstruction?.slotId]);
    if(queueKey !== this.previousQueue) {
      this.events.push({atMs:this.atMs,kind:'queue-change',queue:[...s.reconstructionQueue],active:s.activeReconstruction ? {...s.activeReconstruction} : null});
      this.previousQueue = queueKey;
    }
    if(this.atMs % 1000 === 0) {
      const v = composePlayerView(this.owner)!;
      this.snapshots.push({atMs:this.atMs,initialized:a.initialized,hp:v.hp,maxHp:v.maxHp,barrier:v.barrier,targetId:v.attackTargetId,
        liveBodyFraction:a.bodies,liveAuthoredOffenseFraction:a.offense,liveAuthoredProcFraction:a.proc,
        active:s.activeReconstruction ? {...s.activeReconstruction} : null,queue:[...s.reconstructionQueue],
        minions:a.live.map(x=>({id:x.minion!.entityId,slot:x.slot.slotId,role:x.slot.role,hp:x.minion!.hasHealth.hp,targetId:x.minion!.controlsMinion.currentTargetId}))});
    }
  }
  profileReceipt() {
    const p = summonerProfileFor(this.owner);
    return {treatment:this.treatment,profile:p,relicRatings:relicRatingsFromPassives(this.owner.usesSkills.passives),
      tickQuantizedIntervalMs:Math.ceil(p.reconstructionIntervalMs/100)*100,
      ownerSafetyThresholdHp:this.owner.hasHealth.maxHp*p.reconstructionSafetyFloorPct,
      slots:p.slots.map((s,i)=>({...s,maxHp:computeMinionMaxHp(this.owner,i),costHp:Math.round(computeMinionMaxHp(this.owner,i)*p.reconstructionHpCostRatio)}))};
  }
  finish(terminal: string) {
    if(this.activeEpisode) { this.activeEpisode.censored = true; this.activeEpisode.terminal = terminal; }
    for(const life of this.lives.values()) if(life.endAtMs === null) life.cause ??= 'right-censored-at-terminal';
    this.dispose();
    return {schema:1,units:{time:'ms',damage:'HP',availability:'fraction of authored profile'},
      measuredMs:this.measuredMs,initializationMs:this.measuredMs-this.initializedMs,initializedExposureMs:this.initializedMs,
      availabilityReason:this.initializedMs ? null : 'No fully initialized formation exposure; structural averages unavailable.',
      terminalOwner:{hp:this.owner.hasHealth.hp,maxHp:this.owner.hasHealth.maxHp,barrier:composePlayerView(this.owner)?.barrier??null},
      liveBodyFraction:this.initializedMs ? this.bodyIntegral/this.initializedMs : null,
      liveAuthoredOffenseFraction:this.initializedMs ? this.offenseIntegral/this.initializedMs : null,
      liveAuthoredProcFraction:this.initializedMs ? this.procIntegral/this.initializedMs : null,
      zeroSummonsMs:this.zeroMs,atOrBelowHalfOffenseMs:this.halfMs,combatExposureMs:this.exposureMs,
      readyHpBlockedMs:this.blockedMs,replacementAttemptTicks:this.attempts,successfulReplacements:this.replacements,
      totalHpPaid:this.paidHp,queueScopedHealingHp:this.queueHealHp,
      meanQueueDepth:this.measuredMs ? this.queueDepthIntegral/this.measuredMs : null,
      damageDelivery:{exposureMs:this.exposureByState,byTargetPhase:[...this.delivery.values()],
        definition:'Observed primary-target HP decrease during each synchronous summon attack, including its direct procs; not predicted DPS. Intact >=80% authored offense. Phase is target HP band, not boss-script phase. Target exposure counts each 100ms left-boundary tick with at least one living summon selecting that target; zero exposure with a within-tick attack has no supported rate.',
        delayedAndSecondaryDamage:null,unavailableReason:'Not uniquely attributable to the originating summon attack by existing delayed-effect schema.'},
      hypothesisExercised:this.replacements > 0 || this.blockedMs > 0 || this.halfMs > 0,
      lives:[...this.lives.values()].map(life=>({...life,
        firstAttackUnavailableReason:life.firstAttackAtMs===null?'No actual attack observed before removal or observation end.':null,
        lifetimeUnavailableReason:life.lifetimeMs===null?'Lifetime is right-censored at observation end.':null})),
      episodes:this.episodes.map(episode=>({...episode,
        timeToAboveHalfMs:episode.aboveHalfAtMs===null?null:episode.aboveHalfAtMs-episode.startAtMs,
        timeToFullMs:episode.fullAtMs===null?null:episode.fullAtMs-episode.startAtMs,
        unavailableReason:episode.censored?'Recovery not observed before terminal/cap; censored.':null})),events:this.events,snapshots:this.snapshots};
  }
}
export function prepareConduitRecorder(world:World, bot:PlayerEntity, cell: BreadthCell) {
  return cell.className === 'conduit' ? new ConduitRecorder(world,bot,cell.playerTreatment) : null;
}
