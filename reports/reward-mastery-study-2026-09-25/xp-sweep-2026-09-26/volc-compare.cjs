// usage: node volc-compare.cjs dirA dirB ...  (each dir = one node of one variant)
const fs=require('fs'),path=require('path');
const order=['apprentice','conduit','slinger','spirit','squire','striker'];
console.log('dir'.padEnd(22)+order.map(c=>c.slice(0,9).padStart(11)).join('')+'  deaths  medianM');
for(const d of process.argv.slice(2)){const cells=[];const ms=[];let deaths=0;
 for(const c of order){const f=path.join(__dirname,d,`t3-volcanic-${c}.json`);if(!fs.existsSync(f)){cells.push('?');continue;}
  const r=JSON.parse(fs.readFileSync(f));const frac=Math.min(1,(r.final.xp-r.initial.xp)/r.budget);
  if(r.mastery){cells.push((r.mastery.elapsedMs/60000).toFixed(1)+' ');ms.push(r.mastery.elapsedMs/60000);}
  else if(r.death){deaths++;cells.push(`D${(r.death.elapsedMs/60000).toFixed(1)}@${Math.round(frac*100)}%`);}
  else cells.push(`P${(r.final.elapsedMs/60000).toFixed(1)}@${Math.round(frac*100)}%`);}
 ms.sort((a,b)=>a-b);console.log(d.padEnd(22)+cells.map(x=>x.padStart(11)).join('')+String(deaths).padStart(8)+(ms.length?ms[Math.floor(ms.length/2)].toFixed(1):'-').padStart(9));}
