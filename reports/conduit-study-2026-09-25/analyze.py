import json,pathlib,collections,statistics,sys
base=pathlib.Path('D:/mmo-idle/conduit-study-2026-09-25')
for stage in sys.argv[1:]:
 p=base/stage; rows=json.loads((p/'results.json').read_text()); print('\n'+stage)
 groups=collections.defaultdict(list)
 for r in rows:groups[(r.get('caseId',r['id']),r.get('arm','?'))].append(r)
 for (case,arm),rs in groups.items():
  if 'kills' not in rs[0]:print(case,arm,'FAILED');continue
  print(f"{case:45} {arm:9} n={len(rs)} deaths={sum(r['outcome']=='player-died' for r in rs)} kills={sum(r['kills'] for r in rs):3} avail={statistics.mean(r['availability'] or 0 for r in rs):.2f} paid={sum(r['hpPaid'] for r in rs):.0f} blocked={sum(r['blockedMs'] for r in rs)/1000:.1f}s")
