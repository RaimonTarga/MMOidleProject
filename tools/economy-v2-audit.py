"""Static projection / validation. python tools/economy-v2-audit.py baseline.json [live.json]
Uses exported production data, never launches gameplay. Writes next to baseline.
"""
import json, math, sys, copy, collections, pathlib
p=pathlib.Path(sys.argv[1]); out=p.parent; old=json.loads(p.read_text(encoding='utf-8-sig'))
E=[1,2,8,16,48]; X=[1,2,8,12,30]; BUD=[0,1750,32000,168000,1080000]; C=[1,.5,1,1.5,2]; CE=[1,1,6,20,80]; CC=[1,1,2,4,8]; SHARES=[6,14,20,27,33]
def rnd(x):return math.floor(x+.5)
def cost(c,k):return {a:rnd(v*k) for a,v in (c or {}).items()}
def project(b):
 d=copy.deepcopy(b);cfg=d['GAME_CONFIG'];cfg['BIOME_ESSENCE_TIER_MULT']=E;cfg['BIOME_XP_REWARD_MULT_BY_TIER']=X;cfg['BIOME_XP_SEGMENT_BUDGET_BY_TIER']=BUD;cfg['CATALYST_PROGRESS_REWARD_MULT_BY_TIER']={str(i):C[i] for i in range(1,5)}
 for name in ['RECIPE_DATABASE','ABILITY_RECIPE_DATABASE','RUNE_RECIPE_DATABASE','STANCE_RECIPE_DATABASE','RITE_RECIPE_DATABASE']:
  for r in d[name].values():
   t=r['tier']
   for key in ['cost','reconstructCost','catalystCost','reconstructCatalystCost']:
    if key in r:r[key]=cost(r[key],CC[t] if 'Catalyst' in key or key=='catalystCost' else CE[t])
   if t>1 and r.get('upgrades'):
    totals=collections.Counter()
    for u in r['upgrades']:totals.update(u['cost'])
    for i,u in enumerate(r['upgrades']):
     u['cost']={k:rnd(v*CE[t]*sum(SHARES[:i+1])/100)-rnd(v*CE[t]*sum(SHARES[:i])/100) for k,v in totals.items()}
     if 'catalystCost' in u:u['catalystCost']=cost(u['catalystCost'],CC[t])
 for id,us in d['upgrades'].items():
  r=d['RECIPE_DATABASE'][id]
  if r['tier']>1:
   for i,u in enumerate(us):u['cost']=r['upgrades'][i]['cost'];u['catalystCost']=r['upgrades'][i].get('catalystCost')
 return d
projected=project(old);d=json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8-sig')) if len(sys.argv)>2 else projected
def rows(d):
 mons=d['MONSTER_DATABASE'];biomes=d['BIOME_DATABASE'];cfg=d['GAME_CONFIG'];res=[]
 for id,n in d['NODE_BIOMES'].items():
  t=n['biomeTier'];b=n['biomeGroup']
  if n.get('kind')!='normal' or not 1<=t<=4:continue
  f=d['NODE_MODIFIERS'][id]['modifier'];mod=d['modifiers'][str(t)][f];weights=collections.Counter()
  for mid in biomes[b]['monsterPoolByTier'].get(str(t),[]):
   weights[mid]+=1;pack=mons[mid].get('pack') or {}
   for v in pack.get('followers',[]):weights[v['typeId']]+=v['count']
   variants=pack.get('followerVariants',[])
   for vs in variants:
    for v in vs:weights[v['typeId']]+=v['count']/len(variants)
  z=dict(id=id,biome=b,tier=t,family=f,hp=0,drWork=0,h100=0,E=0,X=0,C=0,colours={})
  for mid,w in weights.items():
   w/=sum(weights.values());m=mons[mid];s=m['stats'];r=m['rewards'];hp=rnd(s['hp']*mod['hpMult']);pl=rnd(s['plating']*mod['platingMult']);dr=min(.95,max(0,1-(1-s['damageReduction'])*mod['incomingDamageMult']))
   e=rnd(r['essence']*cfg['BIOME_ESSENCE_TIER_MULT'][t]*mod['reward']);xp=rnd(rnd(r.get('biomeXp',1)*mod['reward'])*cfg['BIOME_XP_REWARD_MULT_BY_TIER'][t]);cat=rnd(r.get('catalystWeight',r['essence'])*mod['reward'])*cfg['CATALYST_PROGRESS_REWARD_MULT_BY_TIER'].get(str(t),1)
   for k,v in dict(hp=hp,drWork=hp/(1-dr),h100=hp*100/max(1,rnd(max(0,100-pl)*(1-dr))),E=e,X=xp,C=cat).items():z[k]+=w*v
   colour=r['essenceType'];z['colours'][colour]=z['colours'].get(colour,0)+w*e
  z['population']=rnd(n.get('mobDensity',biomes[b].get('mobDensity',24))*mod['spawn']);z['pool']=dict(weights);res.append(z)
 return res
ns=rows(d);checks=[]
for t in range(2,5):
 for work in ['hp','drWork','h100']:
  for reward in ['E','X']:
   matches=[]
   for n in [n for n in ns if n['tier']==t]:
    lower=[o for o in ns if o['tier']<t and o['biome']==n['biome'] and o['family']==n['family']]
    if lower:
     o=max(lower,key=lambda v:v[reward]/v[work]);matches.append((n[reward]/n[work]/(o[reward]/o[work]),n,o))
   ratio,n,o=min(matches,key=lambda v:v[0]);checks.append(dict(tier=t,comparison='same-biome '+reward,work=work,ratio=ratio,current=n['id'],old=o['id'],target=1.25))
  for reward,keys,target in [('E',['blue','red','green','yellow','purple'],1.25),('C',['alacrity','heavy','swarming','dominion','fortified'],1.1)]:
   for key in keys:
    eligible=[n for n in ns if (key in n['colours'] if reward=='E' else n['family']==key)]
    val=lambda n:(n['colours'][key] if reward=='E' else n['C'])/n[work]
    cur=[n for n in eligible if n['tier']==t];prev=[n for n in eligible if n['tier']<t]
    if cur and prev:
     n=max(cur,key=val);o=max(prev,key=val);checks.append(dict(tier=t,comparison=reward+' '+key,work=work,ratio=val(n)/val(o),current=n['id'],old=o['id'],target=target))
def fmt(x):
 if isinstance(x,dict):return ', '.join(f'{k}:{v:g}' for k,v in x.items()) or '—'
 if isinstance(x,float):return f'{x:.3f}'
 return str(x)
def table(h,rs):return '\n'.join(['| '+' | '.join(h)+' |','|'+'|'.join(['---']*len(h))+'|']+['| '+' | '.join(fmt(x) for x in r)+' |' for r in rs])
def demand(d):
 db={**d['RECIPE_DATABASE'],**d['ABILITY_RECIPE_DATABASE'],**d['RUNE_RECIPE_DATABASE'],**d['STANCE_RECIPE_DATABASE'],**d['RITE_RECIPE_DATABASE']};result=[]
 for rid,steps in d['routes'].items():
  seen=set();plus=dict(d.get('entryUpgrades',{}).get(rid,{}));totals={}
  for step in steps:
   typ=step['type'];ids=step.get('recipeIds',[]) if typ=='craft' else [step['recipeId']] if 'recipeId' in step else []
   for id in ids:
    if id in seen:continue
    seen.add(id);r=db[id];t=r['tier'];z=totals.setdefault(t,dict(E=collections.Counter(),C=collections.Counter(),base=0,upgrades=0,tail=0,systems=0));recon=step.get('mode')=='reconstruct';ec=r.get('reconstructCost',{}) if recon else r['cost'];cc=r.get('reconstructCatalystCost',{}) if recon else r.get('catalystCost',{});z['E'].update(ec);z['C'].update(cc);z['base' if id in d['RECIPE_DATABASE'] else 'systems']+=sum(ec.values())
   if typ=='upgrade':
    id=step['definitionId'];t=d['RECIPE_DATABASE'][id]['tier'];z=totals.setdefault(t,dict(E=collections.Counter(),C=collections.Counter(),base=0,upgrades=0,tail=0,systems=0))
    for u in d['upgrades'][id]:
     if plus.get(id,0)<u['plus']<=step['toPlus']:
      z['E'].update(u['cost']);z['C'].update(u.get('catalystCost') or {});v=sum(u['cost'].values());z['upgrades']+=v;z['tail']+=v if u['plus']>=4 else 0
    plus[id]=max(plus.get(id,0),step['toPlus'])
  result.extend(dict(route=rid,tier=t,**z) for t,z in totals.items())
 return result
dem=demand(d);failures=[c for c in checks if c['ratio']+1e-9<c['target']]
name='ECONOMY_V2_STATIC_VALIDATION' if len(sys.argv)>2 else 'ECONOMY_V2_CANDIDATE'
text=f'''# {name.replace('_',' ')}

Source baseline `{old['source']}`. Static candidate only: no measured hourly-rate acceptance and no dynamic campaign launched.

Targets: mastery per zone 5/15/30/60 minutes (T1–T4); a primary +3 during mastery and optional +5 around 25–50% extra farming. Future tiers are not authored. Old content remains a slower fallback; no reward penalty based on player level.

Curves are centralized. Preserve T0/T1. Essence cost scale divided by effective essence reward scale rises from 0.5 to 0.75 to 1.25 to 1.667. Catalyst costs and progress have their own curves. T2 mastery approximately preserves the old expected kill count (budget and XP both ×6.4); T3 doubles and T4 quadruples their old kill counts. Absolute 30/60-minute targets need earned-character validation; no static formula establishes them.

T2+ upgrades keep each item's full upgrade essence total and colour totals, but redistribute its five increments to 6/14/20/27/33%. Thus +4/+5 use 60% of upgrade spending, typically about 55–58% including base, versus approximately 65–70% before. Stat bonuses, gates, evolution rules, and catalyst step placement are unchanged.

Correction to the prior audit prose: Desert pays yellow, Trench green. Every comparison here reads monster reward colours from source.

## Exact curves

'''+table(['Tier','Essence old→new','New E / T1','XP old→new','Budget old→new','Catalyst old→new','Essence cost ×','Catalyst cost ×','XP/min needed for time target'],[[t,f"{old['GAME_CONFIG']['BIOME_ESSENCE_TIER_MULT'][t]} → {E[t]}",E[t]/2,f"{old['GAME_CONFIG']['BIOME_XP_REWARD_MULT_BY_TIER'][t]} → {X[t]}",f"{old['GAME_CONFIG']['BIOME_XP_SEGMENT_BUDGET_BY_TIER'][t]} → {BUD[t]}",f"{.5 if t==1 else 1} → {C[t]}",CE[t],CC[t],BUD[t]/[0,5,15,30,60][t]] for t in range(1,5)])
text+='\n\nThese implied XP/hour targets grow by 6.095×, 2.625× and 3.214× between tiers, while intended duration grows 3×, 2× and 2×. They are required campaign throughput, not forecasts.\n'
text+='\n## Static opportunity checks\n\nRaw HP, DR-adjusted work and H100 direct-hit work; same fixed hit size across tiers. Pool expansion includes followers and variants; body density is not a rewards/hour multiplier. H100 omits overkill, evasion, class effects, ecology, recovery, travel and deaths. Same-biome comparisons hold modifier identity; cross-colour/family comparisons use the best available node.\n\n'+f'{len(checks)} comparisons; {len(failures)} below target.\n\n'+table(['T','Comparison','Work','Current/old','Target','Current node','Old node'],[[c[k] for k in ['tier','comparison','work','ratio','target','current','old']] for c in checks])
text+='\n\n## Mastery income and representative +3/+5\n\nFor each biome/tier, the first authored normal node is an illustrative income anchor, not a best-farm claim. Gross income assumes the entire fresh segment is farmed there. One primary weapon (armor when no weapon) is shown. Cross-colour costs require other farms; boss/entry/party income excluded. Full loadouts and optional systems cost extra.\n\n'
anchors=[];seen=set()
for n in ns:
 key=(n['biome'],n['tier'])
 if key in seen:continue
 seen.add(key);rs=[r for r in d['RECIPE_DATABASE'].values() if r['recipeGroup']==key[0] and r['tier']==key[1] and r['slot'] in ['weapon','armor']];rs.sort(key=lambda r:0 if r['slot']=='weapon' else 1)
 if not rs:continue
 r=rs[0];us=d['upgrades'][r['id']];base=sum(r['cost'].values());v3=base+sum(sum(u['cost'].values()) for u in us[:3]);v5=base+sum(sum(u['cost'].values()) for u in us);income=BUD[key[1]]*n['E']/n['X'];tail=sum(sum(u['cost'].values()) for u in us[3:]);anchors.append([key[0],key[1],r['id'],income,v3,v5,v3/income,v5/income,100*tail/v5])
text+=table(['Biome','T','Primary item','Mastery E','Base→+3 E','Base→+5 E','+3/income','+5/income','Tail %'],anchors)
catalyst_anchors=[]
for biome,t,id,*_ in anchors:
 if t<2:continue
 r=d['RECIPE_DATABASE'][id];needed=collections.Counter(r.get('catalystCost',{}))
 for u in d['upgrades'][id]:needed.update(u.get('catalystCost') or {})
 income={n['family']:BUD[t]*n['C']/n['X']/100 for n in ns if n['biome']==biome and n['tier']==t}
 fraction=sum(amount/income[family] for family,amount in needed.items())
 catalyst_anchors.append([biome,t,id,dict(needed),{f:income[f] for f in needed},fraction])
text+='\n\n## Primary-item catalyst burden\n\nEach family income is the projected catalysts earned while filling an entire fresh mastery segment at that family node. Fraction sums the required share of a segment across families; it is not elapsed time or a full-loadout budget. Essence and catalysts accrue together. Base evolution/craft plus all five upgrades is included, reconstruction and other purchases excluded. Whole-catalyst minting can require a partial extra kill or carried progress.\n\n'+table(['Biome','T','Primary item','Needed by family','Full segment income by family','Segment fraction'],catalyst_anchors)
text+='\n\n## Canonical gross purchase demand\n\nT0 separate; full declared T1/T2 purchase plans, not universal player spending. Subtract actual entry wallet when measuring waits. Tail is a subset of upgrades. Candidate projection retains old route choices; post-implementation data includes the predecessor top-up correction. T3/T4 authored checkpoint fragments remain incomplete and are exported separately in the snapshot; do not represent them as canonical full-tier budgets.\n\n'+table(['Route','Tier','Essence','Catalysts','Base','Upgrades','Tail subset','Systems'],[[r[k] for k in ['route','tier','E','C','base','upgrades','tail','systems']] for r in dem])
text+='\n\n## All equipment prices\n\nBase is craft/evolution; reconstruct is an alternative, never additive. Upgrades list exact incremental essence and catalysts. No core or relic +N track.\n\n'+table(['Recipe','T/slot','Base E','Base C','Reconstruct E','Reconstruct C','+1 E/C','+2 E/C','+3 E/C','+4 E/C','+5 E/C'],[[r['id'],f"{r['tier']}/{r['slot']}",r['cost'],r.get('catalystCost',{}),r.get('reconstructCost',{}),r.get('reconstructCatalystCost',{})]+[fmt(u['cost'])+' / '+fmt(u.get('catalystCost') or {}) for u in d['upgrades'][r['id']]]+['—']*(5-len(d['upgrades'][r['id']])) for r in d['RECIPE_DATABASE'].values()])
late=copy.deepcopy(d);late['routes']=copy.deepcopy(d['fragments']);late['entryUpgrades']={'voidwalker-jungle-desert-t4-v1z':{'mountain-vest-t4':1,'mountain-charm-t4':1}}
late_dem=[r for r in demand(late) if r['tier']>=3]
text+='\n\n## T3/T4 purchase fragments\n\nOnly named new-tier purchases from these checkpoint fragments; inherited gear, wallets and T2 preparation are excluded. The v1z upgrades start at +1. They are not complete canonical budgets.\n\n'+table(['Fragment','T','Essence','Catalysts','Base','Upgrades','Tail subset','Systems'],[[r[k] for k in ['route','tier','E','C','base','upgrades','tail','systems']] for r in late_dem])
samples=[]
for t in range(1,5):
 n=next(n for n in ns if n['tier']==t and n['biome']=='mountain');o=next(v for v in rows(old) if v['id']==n['id'])
 samples.append([t,n['id'],'weighted ambient mean',f"{o['E']:.3f} → {n['E']:.3f}",f"{o['X']:.3f} → {n['X']:.3f}",f"{o['C']:.3f} → {n['C']:.3f}"])
text+='\n\n## Representative reward changes\n\nProduction node modifiers included; unchanged authored monster rewards and stats beneath tier scaling.\n\n'+table(['T','Node','Pool','Essence old→new','XP old→new','Catalyst progress old→new'],samples)
examples=[]
for t in range(1,5):
 for slot in ['weapon','armor','core','relic']:
  r=next((r for r in d['RECIPE_DATABASE'].values() if r['tier']==t and r['slot']==slot),None)
  if r:
   o=old['RECIPE_DATABASE'][r['id']];examples.append([t,slot,r['id'],o['cost'],r['cost'],o.get('catalystCost',{}),r.get('catalystCost',{})])
 for kind in ['ABILITY','STANCE','RITE']:
  key=kind+'_RECIPE_DATABASE';r=next((r for r in d[key].values() if r['tier']==t),None)
  if r:
   o=old[key][r['id']];examples.append([t,kind,r['id'],o['cost'],r['cost'],o.get('catalystCost',{}),r.get('catalystCost',{})])
  else:examples.append([t,kind,'not authored at this tier',{}, {}, {}, {}])
text+='\n\n## Representative price changes\n\nBase craft/evolution prices; reconstruction alternatives and exact upgrade steps are in the full catalogue above.\n\n'+table(['T','Kind','Recipe','Old E','New E','Old C','New C'],examples)
monster_examples=[]
for t in range(1,5):
 n=next(n for n in ns if n['tier']==t and n['biome']=='mountain');mid=next(iter(n['pool']));r=d['MONSTER_DATABASE'][mid]['rewards'];mod=d['modifiers'][str(t)][n['family']]['reward']
 def payout(snapshot):
  cfg=snapshot['GAME_CONFIG'];return [rnd(r['essence']*cfg['BIOME_ESSENCE_TIER_MULT'][t]*mod),rnd(rnd(r.get('biomeXp',1)*mod)*cfg['BIOME_XP_REWARD_MULT_BY_TIER'][t]),rnd(r.get('catalystWeight',r['essence'])*mod)*cfg['CATALYST_PROGRESS_REWARD_MULT_BY_TIER'].get(str(t),1)]
 a=payout(old);b=payout(d);monster_examples.append([t,n['id'],mid,r['essenceType']]+[f'{a[i]:g} → {b[i]:g}' for i in range(3)])
text+='\n\n## Individual monster reward examples\n\nOne body per kill at the named node, ordinary reward multiplier 1; XP before cap.\n\n'+table(['T','Node','Monster','Colour','E old→new','XP old→new','Catalyst progress old→new'],monster_examples)
text+='\n\n## All system prices\n\n'+table(['Kind','Recipe','T','Essence','Catalysts'],[[kind,r['id'],r['tier'],r['cost'],r.get('catalystCost',{})] for kind in ['ABILITY','RUNE','STANCE','RITE'] for r in d[kind+'_RECIPE_DATABASE'].values()])
text+='\n\n## Risks and adoption boundary\n\nLarge displayed values are intentional denominations; wallets stay numerically unchanged, so old savings buy less. Designer decision: fresh characters only, no save conversion. Existing wallets remain numerically unchanged; old XP/checkpoints are not eligible pacing inputs for this candidate. T1 is unchanged. Bestiary base rewards must be labeled as base values if displayed without node context. Boss authored payout differences and modifier premiums remain, and same-node party members still receive full rewards. Solo projections cannot certify party pacing. Literal prepared wallets, purchase budgets, timeouts and saved checkpoints require regeneration; do not execute an old sealed campaign against this candidate. No deploy.\n'
if len(sys.argv)==2:
 # Keep the decision candidate short; the live validation carries the full catalogue.
 prefix=text.split('## Static opportunity checks')[0]
 summary=[]
 for tier in range(2,5):
  for category,match in [('Essence',lambda c:c['comparison'].startswith('E ') or c['comparison']=='same-biome E'),('XP',lambda c:c['comparison']=='same-biome X'),('Catalysts',lambda c:c['comparison'].startswith('C '))]:
   c=min((c for c in checks if c['tier']==tier and match(c)),key=lambda c:c['ratio']/c['target'])
   summary.append([tier,category,c['work'],c['ratio'],c['target']])
 text=prefix+'## Opportunity summary\n\nAll 108 static comparisons pass. The limiting comparison in each category is shown below. These are reward/work ratios, not rewards/hour.\n\n'+table(['Tier','Category','Work proxy','Current/old','Target'],summary)
 text+='\n\n## Primary-item affordability\n\nGross mastery income from one illustrative node, excluding competing purchases and cross-colour travel. Upgrade mastery gates are unchanged.\n\n'+table(['Biome','T','Item','Mastery E','Through +3','Through +5','+3/income','+5/income','Tail %'],anchors)
 text+='\n\n## Decision and evidence boundary\n\nImplement this as one candidate with fresh characters and no save conversion. Preserve T1, combat values and within-tier item identity. Correct dominated predecessor reconstruction and explicit-zero add rewards. Preserve family-specific catalysts. Do not launch the deferred economy experiment or deploy. Full canonical route budgets and node comparisons are in the JSON companion; exact prices, example rewards, risk details and post-implementation comparisons are in [static validation](ECONOMY_V2_STATIC_VALIDATION.md).\n'
(out/(name+'.md')).write_text(text,encoding='utf-8')
(out/(name+'.json')).write_text(json.dumps(dict(nodes=ns,checks=checks,failures=failures,demand=dem,anchors=anchors),indent=2),encoding='utf-8')
if len(sys.argv)>2:
 for key in ['MONSTER_DATABASE','BIOME_DATABASE','NODE_BIOMES','NODE_MODIFIERS','modifiers','caps']:
  assert old[key]==d[key], 'Non-economy source drift: '+key
 for key,expected in [('BIOME_ESSENCE_TIER_MULT',E),('BIOME_XP_REWARD_MULT_BY_TIER',X),('BIOME_XP_SEGMENT_BUDGET_BY_TIER',BUD)]:
  assert d['GAME_CONFIG'][key][:5]==expected, 'Live curve differs from declared candidate: '+key
 for tier in range(1,5):
  assert d['GAME_CONFIG']['CATALYST_PROGRESS_REWARD_MULT_BY_TIER'][str(tier)]==C[tier], 'Live catalyst curve drift'
 for key in ['RECIPE_DATABASE','ABILITY_RECIPE_DATABASE','RUNE_RECIPE_DATABASE','STANCE_RECIPE_DATABASE','RITE_RECIPE_DATABASE','upgrades']:
  if projected[key]!=d[key]:raise AssertionError('Live costs differ from projection: '+key)
 for r in rows(old):
  if r['tier']==1:assert r==next(n for n in ns if n['id']==r['id']), 'T1 payout drift'
print(f'{name}: {len(checks)} static comparisons, {len(failures)} exceptions. {len(ns)} nodes.')
if failures:raise SystemExit(1)
