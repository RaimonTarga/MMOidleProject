import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
process.chdir(resolve(__dirname,'..'));
// Revision 3: a modest dependable armor floor plus specialized layers.
for(const file of [...readdirSync('shared/src/data/recipes').filter(x=>x.endsWith('.recipes.ts')).map(x=>'shared/src/data/recipes/'+x),'shared/src/data/skillTree/rootsAndFrames.ts']){
 let source=readFileSync(file,'utf8');const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);const edits:{start:number,end:number,text:string}[]=[];
 const name=(p:ts.PropertyAssignment)=>p.name.getText(sf).replaceAll('"','').replaceAll("'",'');
 function modify(obj:ts.ObjectLiteralExpression,key:string,value:number){const p=obj.properties.filter(ts.isPropertyAssignment).find(p=>name(p)===key);if(p)edits.push({start:p.initializer.getStart(sf),end:p.initializer.end,text:String(value)});else edits.push({start:obj.end-1,end:obj.end-1,text:`, "${key}": ${value}\n`});}
 function visit(n:ts.Node){if(ts.isObjectLiteralExpression(n)){const props=n.properties.filter(ts.isPropertyAssignment),get=(key:string)=>props.find(p=>name(p)===key)?.initializer;
 const id=get('id'),slot=get('slot'),stats=get('stats');
 if(slot&&ts.isStringLiteral(slot)&&slot.text==='armor'&&stats&&ts.isObjectLiteralExpression(stats)){
  const tier=Number(get('tier')?.getText(sf)),biome=get('recipeGroup')?.getText(sf).replaceAll("'",'').replaceAll('"','');
  if(tier>0){const dr=['cave','trench'].includes(biome??'')?[0,.10,.18,.26,.30][tier]:['forest','jungle'].includes(biome??'')?[0,.02,.04,.07,.10][tier]:[0,.04,.08,.14,.18][tier];modify(stats,'damageReduction',dr);}
 }
 if(id&&ts.isStringLiteral(id)){
  const s=get('statEffects');if(s&&ts.isObjectLiteralExpression(s)){
   if(id.text==='cooldown-root')modify(s,'damageReduction',.28);
   if(id.text==='cadence-root')modify(s,'damageReduction',.18);
   if(id.text==='dot-root')modify(s,'damageReduction',.08);
   if(['cooldown-range-close','cadence-range-close'].includes(id.text))modify(s,'damageReduction',.04);
  }
 }
 }ts.forEachChild(n,visit);}visit(sf);for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);if(edits.length)writeFileSync(file,source.replace(/\r\n/g,'\n'));
}
