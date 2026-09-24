import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
process.chdir(resolve(__dirname,'..'));
for(const file of [...readdirSync('shared/src/data/recipes').filter(x=>x.endsWith('.recipes.ts')).map(x=>'shared/src/data/recipes/'+x),'shared/src/data/skillTree/rootsAndFrames.ts']){
 let source=readFileSync(file,'utf8');const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);const edits:{start:number,end:number,text:string}[]=[];
 function visit(n:ts.Node){if(ts.isPropertyAssignment(n)&&['stats','statEffects','mechanicEffects','upgrades'].includes(n.name.getText(sf))){try{const value=JSON.parse(n.initializer.getText(sf));const compact=(o:unknown)=>JSON.stringify(o).replace(/":/g,'": ').replace(/,(?=")/g,', ');const text=Array.isArray(value)?'[\n'+value.map(v=>'      '+compact(v)).join(',\n')+'\n    ]':compact(value);edits.push({start:n.initializer.getStart(sf),end:n.initializer.end,text});return;}catch{}}
 ts.forEachChild(n,visit);}visit(sf);for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);if(edits.length)writeFileSync(file,source.replace(/\r\n/g,'\n'));
}
