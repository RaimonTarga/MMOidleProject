const fs=require('fs'),path=require('path');const dir=path.resolve(__dirname,process.argv[2]??'baseline');
const target={2:15,3:30,4:60};const rows=[];
for(const f of fs.readdirSync(dir).filter(f=>/^t[0-9]-.*[.]json$/.test(f)&&!f.includes('progress'))){
 const r=JSON.parse(fs.readFileSync(path.join(dir,f)));const [t,biome,cls]=f.replace('.json','').split('-');const tier=+t.slice(1);
 const start=r.initial.xp,gained=r.final.xp-start,frac=Math.min(1,gained/r.budget);
 const endMs=r.mastery?.elapsedMs??r.final.elapsedMs;const min=endMs/60000;
 const status=r.mastery?'M':r.death?'DEATH':r.plateau?'PLAT':r.runtimeCensored?'WALL':'CENS';
 const proj=r.mastery?min:(frac>0.05?min/frac:null);
 const kills=Object.values(r.killTypes).reduce((a,b)=>a+b,0);
 rows.push({tier,biome,cls,status,min,proj,frac,kpm:kills/Math.max(min,.01),xpm:gained/Math.max(min,.01)});
}
rows.sort((a,b)=>a.tier-b.tier||a.biome.localeCompare(b.biome)||a.cls.localeCompare(b.cls));
const fmt=x=>x==null?'  -  ':x.toFixed(1).padStart(5);
for(const tier of [2,3,4]){const R=rows.filter(r=>r.tier===tier);if(!R.length)continue;const classes=[...new Set(R.map(r=>r.cls))];
 console.log(`\nT${tier} (target ${target[tier]} min) — projected minutes to mastery (* = censored/projected, D = died)`);
 console.log('biome'.padEnd(10)+classes.map(c=>c.slice(0,9).padStart(10)).join('')+'   median  ratio');
 for(const b of [...new Set(R.map(r=>r.biome))]){const line=classes.map(c=>{const r=R.find(x=>x.biome===b&&x.cls===c);if(!r)return '         -';return (fmt(r.proj)+(r.status==='M'?' ':r.status==='DEATH'?'D':'*')).padStart(10);}).join('');
  const ps=R.filter(r=>r.biome===b&&r.proj!=null).map(r=>r.proj).sort((a,b)=>a-b);const med=ps[Math.floor(ps.length/2)];
  console.log(b.padEnd(10)+line+'  '+fmt(med)+'  '+(target[tier]/med).toFixed(2));}
}
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(rows,null,1));
