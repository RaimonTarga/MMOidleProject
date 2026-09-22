import { getCounter, MONSTER_DATABASE } from '@mmo-idle/shared';
import type { World } from '../../src/world/World';
import type { PlayerEntity } from '../../src/ecs/entity';
import { observeMonsterSession } from '../../src/systems/combat/engine/sessionObservation';

export class Day2SessionRecorder {
  readonly events: unknown[] = [];
  private seen = new Set<string>();
  private previousFormation: string | null = null;
  readonly counts: Record<string, number> = {};
  readonly exposed = new Set<string>();
  constructor(private world: World, private owner: PlayerEntity) {}
  register() {
    for(const m of this.world.monsterEntitiesInNode(this.owner.hasPosition.nodeId)) {
      if(this.seen.has(m.entityId)) continue;
      this.seen.add(m.entityId);
      observeMonsterSession(m,(kind,now)=> {
        this.counts[kind]=(this.counts[kind]??0)+1;
        if(kind==='shield-session' && m.hasAggroTarget && MONSTER_DATABASE.get(m.isMonster.monsterTypeId)?.enemyShield) this.exposed.add(m.isMonster.monsterTypeId);
        this.events.push({kind,atMs:now-1800000000000,id:m.entityId,type:m.isMonster.monsterTypeId,hp:m.hasHealth.hp,
          barrier:getCounter(m.tracksCombat,'t4EnemyShieldAmount'),shieldSession:getCounter(m.tracksCombat,'t4EnemyShieldSession'),
          aggro:m.hasAggroTarget?{...m.hasAggroTarget}:null,awareness:m.hasAwareness.state});
      });
    }
  }
  afterTick(now: number) {
    const target=this.owner.summonsMinions?.formationTargetId??null;
    if(target!==this.previousFormation) {
      this.counts['formation-target-change']=(this.counts['formation-target-change']??0)+1;
      this.events.push({kind:'formation-target-change',atMs:now-1800000000000,from:this.previousFormation,to:target});
      this.previousFormation=target;
    }
  }
  finish() {return {counts:this.counts,shieldExposedTypes:[...this.exposed],shieldExposed:this.exposed.has('glacier-bear'),
    timing:'Session and shield hooks are synchronous; formation targets are post-tick. Full events external.'};}
}
