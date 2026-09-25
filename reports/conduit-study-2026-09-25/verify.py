import collections,hashlib,json,pathlib,sys
base=pathlib.Path('D:/mmo-idle/conduit-study-2026-09-25');output=pathlib.Path(__file__).resolve().parent
stages=sys.argv[1:] or ['t1-r2','t1-iteration2','t1-boss-followup','t1-boss-orbit-r2','t2','t3','t4']
read=lambda p:json.loads(p.read_text(encoding='utf8'))
report=[];inventory={};summary={}
for stage in stages:
 p=base/stage;m=read(p/'manifest.json');done=read(p/'complete.json');rows=read(p/'results.json')
 assert done['sourceUnchanged'] and done['completed']==done['planned']==len(m['cases'])==len(rows),stage
 assert done['failures']==0,stage
 byid={r['id']:r for r in rows};assert len(byid)==len(rows)
 groups=collections.defaultdict(list)
 for c in m['cases']:
  r=byid[c['id']];assert r['outcome'] not in ['execution-failed','wall-ceiling'],r
  assert r['elapsedMs']<=c['durationMs']
  q=read(p/c['id']/'ready.json');groups[(c['cell']['id'],c['seed'])].append((c,q))
  assert '/conduit-study-2026-09-25/source/shared/src/index.ts' in q['sharedEntry'].replace('\\','/')
  if r['outcome']=='boss-killed':assert r['bossKilled'] and r['bossId'] and r['bossType']
  for f in ['ready.json','result.json','conduit.json','events.jsonl']:
   path=p/c['id']/f;inventory[str(path)]=hashlib.sha256(path.read_bytes()).hexdigest()
 for key,rs in groups.items():
  assert len({q['geometryHash'] for _,q in rs})==1,(stage,key,'geometry')
  assert len({q['ownerHash'] for _,q in rs})==1,(stage,key,'owner')
  baseline=next(q for c,q in rs if c['arm']=='baseline');bp=baseline['profile']
  for c,q in rs:
   cp=q['profile'];assert bp['profile']['reconstructionIntervalMs']==cp['profile']['reconstructionIntervalMs']
   assert bp['profile']['formationOffenseMult']==cp['profile']['formationOffenseMult']
   if c['arm'].startswith('hp'):
    for x,y in zip(bp['slots'],cp['slots']):assert abs(x['costHp']-y['costHp'])<=1,(stage,key,x,y)
 summary[stage]=rows
 report.append({'stage':stage,'observations':len(rows),'pairs':len(groups),'failures':0,'pairReceiptsMatch':True})
if 't1-r2' in summary and 't1-iteration2' in summary:
 old={r['id']:r for r in summary['t1-r2'] if r['arm']=='baseline'}
 for r in summary['t1-iteration2']:
  if r['arm']=='baseline':assert {k:v for k,v in r.items() if k!='wallMs'}=={k:v for k,v in old[r['id']].items() if k!='wallMs'}
(output/'results.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
(output/'artifact-inventory.json').write_text(json.dumps(inventory,indent=2),encoding='utf8')
(output/'validation.json').write_text(json.dumps({'stages':report,'rawArtifacts':len(inventory),'baselineReplayCount':14 if 't1-iteration2' in summary else 0},indent=2),encoding='utf8')
print(json.dumps(report,indent=2));print(len(inventory),'raw artifacts verified')
