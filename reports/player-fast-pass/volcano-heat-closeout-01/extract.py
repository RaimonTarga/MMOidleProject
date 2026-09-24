import json,pathlib,hashlib,collections
root=pathlib.Path('D:/mmo-idle/volcano-heat-management-01/run-01');out=pathlib.Path('D:/mmo-idle/volcano-heat-closeout-01/source/reports/player-fast-pass/volcano-heat-closeout-01');out.mkdir(parents=True,exist_ok=True)
manifest=json.loads((root/'manifest.json').read_text())
inv=json.loads((root/'raw-inventory.json').read_text());used={}
def file(case,name):
 x=next(x for x in inv if case+'\\artifacts' in x['path'] and x['path'].endswith('\\'+name));p=pathlib.Path(x['path']);actual=hashlib.file_digest(p.open('rb'),'sha256').hexdigest();assert actual==x['sha256'];used[str(p)]=x;return p
def rows(case,name):
 for l in file(case,name).open():yield json.loads(l)
def compact(s):
 mons=s.get('monsters',[]);m=s.get('movement')
 return {k:s.get(k) for k in ['atMs','heatManagement','hp','target','pos','lastAttackAt','lastOutgoingDamageMs','selectedTargetId','blockedApproach','motion','autoIntent']}|{'movement':None if not m else {**m,'waypoints':m['waypoints'][:2],'waypointCount':len(m['waypoints'])},'selectedMonster':next((x for x in mons if x['id']==s.get('selectedTargetId')),None),'threats':[x for x in mons if x.get('aggro')]}
case='heat-slinger-light-a-H2-s101009';summary=json.loads(file(case,'summary.json').read_text());flags=[1608700,1616000,2290300];evidence={'case':case,'clockNote':'Original heat transition atMs = event/sample atMs + 100. Originals retained unchanged.','windows':[]}
for t in flags:
 a=summary['heatManagement']['transitions'];i=next(i for i,x in enumerate(a) if x['atMs']==t)
 evidence['windows'].append({'reportedAtMs':t,'eventTickAtMs':t-100,'transitions':a[i-1:i+4],'samples':[],'events':[],'sustain':[],'guards':[]})
for name,key in [('samples.jsonl','samples'),('events.jsonl','events'),('sustain-transitions.jsonl','sustain'),('guard-events.jsonl','guards')]:
 for s in rows(case,name):
  for w in evidence['windows']:
   if abs(s['atMs']-w['eventTickAtMs'])<=1500:
    if key=='samples':s=compact(s)
    elif key=='guards':s={'atMs':s['atMs'],'beforeHp':s['before']['hp'],'afterHp':s['after']['hp'],'controlled':s['after']['hardControlled'],'cooldowns':s['after']['abilityCooldowns'],'activations':s['activations']}
    w[key].append(s)
(out/'flagged-windows.json').write_text(json.dumps(evidence,indent=2)+'\n')
stalls=[]
for package in ['striker-balanced-b','slinger-light-a']:
 for policy in ['H0','H1','H2']:
  c=next(c['id'] for c in manifest['cases'] if package in c['id'] and c['policy']==policy and c['seed']==101033);s=json.loads(file(c,'summary.json').read_text()); samples=list(rows(c,'samples.jsonl'))
  last=max(x['lastOutgoingDamageMs'] for x in samples);after=[x for x in samples if x['atMs']>last]
  states=collections.Counter(x['heatManagement']['state'] for x in after)
  # scan events to establish damage rather than infer it from kills
  outgoing=[];kills=[]
  for x in rows(c,'events.jsonl'):
   e=x['event']
   if e['kind']=='damage' and e.get('target',{}).get('actorType')=='monster':outgoing.append(x)
   if e['kind']=='kill':kills.append(x)
  lastEvent=outgoing[-1] if outgoing else None
  excerpts=[compact(x) for x in samples if last-1000<=x['atMs']<=last+10000 or x['atMs'] in [300000,600000,1200000,1800000,2399000]]
  late=[x for x in samples if x['atMs']>=1800000]
  item={'case':c,'lastOutgoingDamageMs':last,'lastDamageEvent':lastEvent,'postDamageStateSampleCounts':states,'postDamageRequestedSamples':sum(x['heatManagement']['state']=='requested' for x in after),'postDamageWaitSamples':sum(x['heatManagement']['waitHold'] for x in after),'lateHeatMax':max(x['heatManagement']['heat'] for x in late),'lateOwnerThreatMax':max(x['heatManagement']['ownerThreats'] for x in late),'lateSelectedTargets':collections.Counter(x['selectedTargetId'] for x in late),'excerpts':excerpts}
  stalls.append(item);print(c,'lastDamage',last,'states',states,'late targets',item['lateSelectedTargets'])
(out/'stall-evidence.json').write_text(json.dumps(stalls,indent=2)+'\n')
# Metadata sources: hash without duplicating historical contents.
for name in ['manifest.json','resolved-builds.json','results-summary.json','raw-inventory.json','complete.json']:
 p=root/name;used[str(p)]={'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()}
(out/'evidence-inventory.json').write_text(json.dumps({'verifiedFiles':list(used.values()),'mismatches':0},indent=2)+'\n')
for w in evidence['windows']:
 print('FLAG',w['reportedAtMs'],'events',[(x['atMs'],x['event']['kind'],x['event'].get('hpDamage')) for x in w['events']]);print('SAMPLES',[(x['atMs'],x['pos'],[(m['id'],m.get('aggro')) for m in x['threats']]) for x in w['samples']])
