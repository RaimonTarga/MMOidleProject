import type { WorldLogEvent } from '@mmo-idle/shared';

export interface TargetTrace { id:string; type:string; name:string; maxHp:number; firstDamageMs:number|null; lastDamageMs:number|null; killedAtMs:number|null; hpRegainObserved:boolean; maxDamageGapMs:number; damageEvents:number; castsStarted:number; castsFired:number; }
export class SurveyMetrics {
  targets = new Map<string,TargetTrace>();
  episodes: Array<{startMs:number;endMs:number;durationMs:number;members:string[];initialMembers:string[];lateJoiners:number;outcome:string}> = [];
  recovery: Array<{afterClearMs:number;recoveredAtMs:number|null;interruptedByNextPull:boolean}> = [];
  active: {startMs:number;members:Set<string>;initial:Set<string>} | null = null;
  incomingDamage = 0;
  largestHit = 0;
  maxDamageIn1s = 0;
  private incoming: Array<{at:number;damage:number}> = [];
  constructor(readonly playerId:string) {}
  register(id:string,type:string,name:string,maxHp:number) {
    if(!this.targets.has(id)) this.targets.set(id,{id,type,name,maxHp,firstDamageMs:null,lastDamageMs:null,killedAtMs:null,hpRegainObserved:false,maxDamageGapMs:0,damageEvents:0,castsStarted:0,castsFired:0});
  }
  touch(id:string,at:number) {
    if(!this.targets.has(id)) return;
    if(!this.active) {
      const last=this.recovery.at(-1); if(last&&last.recoveredAtMs===null) last.interruptedByNextPull=true;
      this.active={startMs:at,members:new Set(),initial:new Set()};
    }
    this.active.members.add(id);
    if(at===this.active.startMs) this.active.initial.add(id);
  }
  ingest(e:WorldLogEvent,at:number) {
    if(e.kind==='damage') {
      const ours=e.source.id===this.playerId || e.source.ownerPlayerId===this.playerId;
      if(ours && e.target.actorType==='monster' && e.hpDamage+e.absorbed>0) {
        const t=this.targets.get(e.target.id); if(t) {if(t.lastDamageMs!==null)t.maxDamageGapMs=Math.max(t.maxDamageGapMs,at-t.lastDamageMs);t.firstDamageMs ??= at;t.lastDamageMs=at;t.damageEvents++;this.touch(t.id,at);}
      }
      if(e.target.id===this.playerId && e.hpDamage+e.absorbed>0) {
        this.touch(e.source.id,at);
        this.incomingDamage+=e.hpDamage;
        this.largestHit=Math.max(this.largestHit,e.hpDamage);
        this.incoming.push({at,damage:e.hpDamage});this.incoming=this.incoming.filter(x=>at-x.at<=1000);
        this.maxDamageIn1s=Math.max(this.maxDamageIn1s,this.incoming.reduce((s,x)=>s+x.damage,0));
      }
    }
    if(e.kind==='kill' && e.victim.actorType==='monster') {
      const t=this.targets.get(e.victim.id); if(t) t.killedAtMs=at;
    }
  }
  closeIfCleared(at:number) {
    if(this.active && [...this.active.members].every(id=>this.targets.get(id)?.killedAtMs!==null)) this.close(at,'cleared');
  }
  close(at:number,outcome:string) {
    const a=this.active;if(!a) return;
    this.episodes.push({startMs:a.startMs,endMs:at,durationMs:at-a.startMs,members:[...a.members],initialMembers:[...a.initial],lateJoiners:a.members.size-a.initial.size,outcome});
    this.active=null;
    if(outcome==='cleared') this.recovery.push({afterClearMs:at,recoveredAtMs:null,interruptedByNextPull:false});
  }
  sampleRecovery(at:number,full:boolean) {
    const r=this.recovery.at(-1);
    if(!this.active && r && r.recoveredAtMs===null && !r.interruptedByNextPull && full) r.recoveredAtMs=at;
  }
  result() {
    const targets=[...this.targets.values()].filter(t=>t.firstDamageMs!==null).map(t=>({...t,
      ttkMs:t.killedAtMs===null?null:t.killedAtMs-t.firstDamageMs!,
      clean:t.killedAtMs!==null&&!t.hpRegainObserved}));
    const clean=targets.filter(t=>t.clean).map(t=>t.ttkMs!).sort((a,b)=>a-b);
    const q=(p:number)=>{if(!clean.length)return null;const i=(clean.length-1)*p;return clean[Math.floor(i)]+(clean[Math.ceil(i)]-clean[Math.floor(i)])*(i-Math.floor(i));};
    return {targets,episodes:this.episodes,recovery:this.recovery,incomingDamage:this.incomingDamage,
      largestHit:this.largestHit,maxDamageIn1s:this.maxDamageIn1s,
      counts:{damaged:targets.length,killed:targets.filter(t=>t.killedAtMs!==null).length,censored:targets.filter(t=>t.killedAtMs===null).length,hpRegain:targets.filter(t=>t.hpRegainObserved).length},
      cleanTtkMs:{n:clean.length,p10:q(.1),median:q(.5),p90:q(.9)}};
  }
}
