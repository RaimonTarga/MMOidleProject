const fs=require('fs');
function tab(dir){const out={};for(const f of fs.readdirSync(dir).filter(f=>/^t[23]-[a-z]+-[a-z]+[.]json$/.test(f))){const r=JSON.parse(fs.readFileSync(dir+'/'+f));out[f.replace('.json','')]={m:r.mastery?r.mastery.elapsedMs/60000:null,f3:r.fundingTimes['3']!=null?r.fundingTimes['3']/60000:null,f5:r.fundingTimes['5']!=null?r.fundingTimes['5']/60000:null};}return out;}
const b=tab(process.argv[2]??'baseline'),c=tab(process.argv[3]??'cand-calib');
const agg={};for(const k of Object.keys(c)){const [t,bi]=k.split('-');(agg[t+'-'+bi]??=[]).push([b[k],c[k]]);}
const med=a=>{const x=a.filter(v=>v!=null).sort((p,q)=>p-q);return x.length?x[Math.floor(x.length/2)].toFixed(1)+(x.length<a.length?`(${x.length}/${a.length})`:''):'-';};
console.log('tier-biome   |  BASE mastery   +3set    +5set |  CAND mastery   +3set    +5set');
for(const [k,v] of Object.entries(agg))console.log(k.padEnd(12),'|',[0,1].map(i=>['m','f3','f5'].map(q=>med(v.map(x=>x[i]?.[q]??null)).padStart(9)).join('')).join(' |'));
