"""Read-only verification of the sealed 56-case preparation. No combat launcher."""
import copy, hashlib, json, pathlib, subprocess
BASE=pathlib.Path('D:/mmo-idle/class-balance-candidate-01')
PUB=pathlib.Path(__file__).parent
load=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
ids=load(BASE/'packet-r2/identity.json');manifest=load(BASE/'packet-r2/manifest.json');receipts=load(BASE/'qualification-r2/resolved-builds.json')
def differences(a,b,path=''):
 if type(a)!=type(b):return [path]
 if isinstance(a,dict):return sum((differences(a.get(k),b.get(k),path+'.'+k) for k in a.keys()|b.keys()),[])
 if isinstance(a,list):
  if len(a)!=len(b):return [path]
  return sum((differences(x,y,path+f'[{i}]') for i,(x,y) in enumerate(zip(a,b))),[])
 return [] if a==b else [path]
metadata={'.cell','.view.name','.runtime.arm','.runtime.revision','.runtime.sharedEntry','.definitionsIdentity.base','.definitionsIdentity.live'}
spirit={'.view.attack','.view.attackCooldown','.effectiveStats.attack','.effectiveStats.attackCooldown'}
conduit={'.conduitProfile.tickQuantizedIntervalMs','.conduitProfile.profile.reconstructionIntervalMs','.conduitProfile.profile.reconstructionFactors.frame','.conduitProfile.profile.reconstructionFactors.preRelicMs','.conduitProfile.profile.reconstructionFactors.postRelicMs'}
def check_pair(c,a,b):
 allowed=metadata|(spirit if c['block'].startswith('S') else conduit if c['block'].startswith('C') else set())
 actual=set(differences(a,b));assert actual<=allowed,(c['id'],actual-allowed)
 if c['block'].startswith('S'):
  assert b['view']['attack']<a['view']['attack'];assert b['view']['attackCooldown']>a['view']['attackCooldown']
 if c['block'].startswith('C'):
  assert a['conduitProfile']['profile']['reconstructionIntervalMs']==3500
  assert b['conduitProfile']['profile']['reconstructionIntervalMs']==2500
 return sorted(actual)
assert len(manifest['cases'])==len(receipts)==56
qualified=load(BASE/'packet-r2/qualified.json');assert qualified['combatObservations']==0 and qualified['completed']==56
assert qualified['receiptsSha256']==sha(BASE/'qualification-r2/resolved-builds.json')
assert qualified['manifestSha256']==sha(BASE/'packet-r2/manifest.json')
for f,h in load(BASE/'packet-r2/seal.json').items():assert sha(BASE/'packet-r2'/f)==h
pairs=[]
for i in range(0,56,2):
 cs=manifest['cases'][i:i+2];assert cs[0]['comparisonId']==cs[1]['comparisonId'];assert [c['arm'] for c in cs]==(['candidate','control'] if cs[0]['seed']==101033 else ['control','candidate'])
 cs.sort(key=lambda c:c['arm']=='candidate');a,b=[next(r['ready'] for r in receipts if r['observationId']==c['id']) for c in cs]
 changed=check_pair(cs[0],a,b)
 pairs.append({'comparisonId':cs[0]['comparisonId'],'block':cs[0]['block'],'attack':[a['view']['attack'],b['view']['attack']],'attackCooldown':[a['view']['attackCooldown'],b['view']['attackCooldown']],'allowedDifferences':changed})
 # Negative assertions: reject undeclared package and encounter drift.
 for key in ['packageReadback','initialRoster']:
  bad=copy.deepcopy(b);bad[key]={'deliberateUndeclaredChange':True}
  try:check_pair(cs[0],a,bad)
  except AssertionError:pass
  else:raise AssertionError('Undeclared drift accepted')
control,candidate=ids['control']['sourceCommit'],ids['candidate']['sourceCommit']
git=lambda *args:subprocess.check_output(['git','-C',ids['control']['root'],*args]).decode('utf-8')
paths=git('diff','--name-only',control,candidate).splitlines()
assert paths==['shared/src/data/skillTree/rootsAndFrames.ts','shared/src/data/summoner.ts']
for path in paths:
 before=git('show',f'{control}:{path}');after=git('show',f'{candidate}:{path}')
 if path.endswith('summoner.ts'):
  start=before.index('export const SUMMONER_FRAME_TUNING');end=before.index('  light:',start)
  expected=before[:start]+before[start:end].replace('reconstructionIntervalMult: 1,','reconstructionIntervalMult: 2500 / 3500,')+before[end:]
 else:
  start=before.index("  ['energy-light',");end=before.index("  ['energy-heavy',",start);piece=before[start:end]
  for old,new in [('attackPct: 0.07','attackPct: 0.02'),('attackPct: 0.08','attackPct: 0.03'),('attackSpeedPct: 0.12','attackSpeedPct: 0.04'),('attackSpeedPct: 0.06','attackSpeedPct: 0.00')]:piece=piece.replace(old,new)
  expected=before[:start]+piece+before[end:]
 assert after==expected,'Undeclared source change'
a,b=[load(BASE/f'{arm}-readbacks.json') for arm in ['control','candidate']]
for x,y in zip(a['spirit'],b['spirit']):
 if x['frame'] in [None,'heavy']:assert x==y
 else:
  assert x['energy']==y['energy'];assert x['skillPath']==y['skillPath'];assert y['view']['attack']<x['view']['attack'];assert y['view']['attackCooldown']>x['view']['attackCooldown']
  for old,new in zip(x['authored'],y['authored']):
   assert old.get('mechanicEffects')==new.get('mechanicEffects')
   if old['id']==f"energy-{x['frame']}":
    assert abs(new['statEffects']['attackPct']-old['statEffects']['attackPct']+0.05)<1e-12
    assert abs(new['statEffects']['attackSpeedPct']-old['statEffects']['attackSpeedPct']+(0.08 if x['frame']=='light' else 0.06))<1e-12
   else:assert old==new
for x,y in zip(a['conduit'],b['conduit']):
 if x['frame'] is not None:assert x==y
 else:
  allowed={'.profile.reconstructionIntervalMs','.profile.reconstructionFactors.frame','.profile.reconstructionFactors.preRelicMs','.profile.reconstructionFactors.postRelicMs','.profile.reconstructionFactors.floorBinds'}
  assert set(differences(x,y))<=allowed
  if x['range'] is None:assert x['profile']['reconstructionIntervalMs']==3500 and y['profile']['reconstructionIntervalMs']==2500
result={'passed':True,'combatObservations':0,'qualified':56,'pairedReceipts':28,'negativeDriftAssertions':56,'spiritReadbacksPerArm':len(a['spirit']),'conduitReadbacksPerArm':len(a['conduit']),'sources':{k:v['sourceCommit'] for k,v in ids.items()},'pairs':pairs}
(PUB/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
print('PASS: 56 zero-tick receipts, 28 pairs, exact source diff, Spirit inheritance and all framed Conduit profiles; 56 drift rejection assertions. No combat.')
