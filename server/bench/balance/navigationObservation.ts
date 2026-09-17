import {Session} from 'node:inspector';
import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createPathDiagnostics,setPathDiagnostics,pathDiagnostics} from '../../../shared/src/collision/pathDiagnostics';

let ticks: unknown[] | undefined;
export function recordNavigationTick(atMs:number,wallMs:number):void {
  const d=pathDiagnostics;
  if(d&&ticks) ticks.push({atMs,wallMs,paths:d.paths,nullPaths:d.nullPaths,pathMs:d.pathMs,
    expandedCells:d.expandedCells,paddedChecks:d.paddedChecks,segmentSamples:d.segmentSamples});
}
export async function profileNavigationObservation<T>(out:string,cell:string,seed:number,run:()=>T):Promise<T> {
  const session=new Session();session.connect();
  const post=(method:string)=>new Promise<any>((resolve,reject)=>session.post(method as any,(error,result)=>error?reject(error):resolve(result)));
  const d=createPathDiagnostics(()=>performance.now());
  const prefix=join(out,`${cell}-s${seed}`);
  try {
    await post('Profiler.enable');await post('Profiler.start');
    setPathDiagnostics(d);ticks=[];
    try { return run(); }
    finally {
      setPathDiagnostics();
      const {now,requests,...counts}=d;
      writeFileSync(prefix+'-navigation.json',JSON.stringify({cell,seed,scope:'setup-simulation-teardown',
        countersAreCumulative:true,overlapQueriesScope:'padded-segment direct queries only',
        ...counts,requests:[...requests].map(([key,value])=>({key,...value})).sort((a,b)=>b.ms-a.ms),ticks},null,2));
      ticks=undefined;
      const {profile}=await post('Profiler.stop');
      writeFileSync(prefix+'.cpuprofile',JSON.stringify(profile));
    }
  } finally {setPathDiagnostics();ticks=undefined;session.disconnect();}
}
