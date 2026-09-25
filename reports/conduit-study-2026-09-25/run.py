import concurrent.futures, hashlib, json, pathlib, subprocess, sys, time
base=pathlib.Path('D:/mmo-idle/conduit-study-2026-09-25'); source=base/'source'
stage=sys.argv[1]; mode=sys.argv[2] if len(sys.argv)>2 else 'run'
manifest_path=base/stage/'manifest.json'; manifest=json.loads(manifest_path.read_text())
if mode=='qualify':
 out=base/(stage+'-qualification');out.mkdir()
 seen=set(); cases=[]
 for c in manifest['cases']:
  if c['cell']['id'] not in seen:cases.append(c);seen.add(c['cell']['id'])
 manifest['cases']=cases;manifest['out']=str(out);manifest_path=out/'manifest.json';manifest_path.write_text(json.dumps(manifest,indent=2))
out=pathlib.Path(manifest['out']);results=[]
assert not (out/'results.json').exists(), 'Existing run results: inspect them and use a fresh manifest/output; never silently rerun.'
files=[p for folder in ['server/src','shared/src','server/bench','bot/src'] for p in (source/folder).rglob('*') if p.is_file()]
digest=lambda:{str(p.relative_to(source)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
hashes=digest();(out/'source-hashes.json').write_text(json.dumps(hashes,indent=2))
def run(i):
 c=manifest['cases'][i];start=time.time()
 try:
  proc=subprocess.Popen(['node',str(source/'server/node_modules/tsx/dist/cli.mjs'),'--conditions=development',str(source/'server/bench/balance/conduitStudy.ts'),mode,str(manifest_path),str(i)],cwd=source,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding="utf-8",errors="replace")
  try:
   stdout,stderr=proc.communicate(timeout=160)
  except subprocess.TimeoutExpired:
   subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],capture_output=True)
   stdout,stderr=proc.communicate()
   (out/(c['id']+'.log')).write_text(stdout+'\n'+stderr,encoding='utf8')
   raise RuntimeError('160-second wall ceiling; owned process tree terminated')
  (out/(c['id']+'.log')).write_text(stdout+'\n'+stderr,encoding='utf8')
  p=out/c['id']/'result.json'
  row=json.loads(p.read_text()) if p.exists() else {'id':c['id'],'outcome':'qualified' if proc.returncode==0 and mode=='qualify' else 'execution-failed','exitCode':proc.returncode}
 except Exception as e:row={'id':c['id'],'outcome':'execution-failed','error':str(e)}
 return i,row,time.time()-start
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 for f in concurrent.futures.as_completed([pool.submit(run,i) for i in range(len(manifest['cases']))]):
  i,row,seconds=f.result();results.append((i,row));(out/'results.json').write_text(json.dumps([r for _,r in sorted(results)],indent=2))
  print(f"{len(results)}/{len(manifest['cases'])} {row['id']}: {row['outcome']}, kills={row.get('kills')}, wall={seconds:.1f}s",flush=True)
assert digest()==hashes,'Source drift'
(out/'complete.json').write_text(json.dumps({'planned':len(manifest['cases']),'completed':len(results),'failures':sum(r['outcome']=='execution-failed' for _,r in results),'sourceUnchanged':True},indent=2))
