import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
process.chdir(resolve(__dirname,'..'));
// Revision 2: repay lost baseline durability through HP and melee protection,
// keeping the new specialist identities instead of restoring universal plating.
const files=[...readdirSync('shared/src/data/recipes').filter(x=>x.endsWith('.recipes.ts')).map(x=>'shared/src/data/recipes/'+x),'shared/src/data/skillTree/rootsAndFrames.ts'];
for(const file of files){let source=readFileSync(file,'utf8');const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);const edits:{start:number,end:number,text:string}[]=[];
 const change=(n:ts.Expression,value:number)=>edits.push({start:n.getStart(sf),end:n.end,text:String(value)});
 function visit(n:ts.Node){if(ts.isObjectLiteralExpression(n)){const props=n.properties.filter(ts.isPropertyAssignment);const property=(key:string)=>props.find(p=>p.name.getText(sf).replaceAll('"','').replaceAll("'",'')===key);const id=property('id')?.initializer;const slot=property('slot')?.initializer;
  if(slot&&ts.isStringLiteral(slot)&&slot.text==='armor'){
   const tier=Number(property('tier')?.initializer.getText(sf));
   if(tier>=3){const mult=tier===3?1.5:1.6;
    function hp(node:ts.Node){if(ts.isPropertyAssignment(node)&&node.name.getText(sf).replaceAll('"','')==='maxHp'&&ts.isNumericLiteral(node.initializer))change(node.initializer,Math.round(Number(node.initializer.text)*mult));ts.forEachChild(node,hp);}hp(n);
   }
  }
  if(id&&ts.isStringLiteral(id)){
   const rootDr=id.text==='cooldown-root'?.20:id.text==='cadence-root'?.12:null;
   const stats=property('statEffects')?.initializer;
   if(rootDr!==null&&stats&&ts.isObjectLiteralExpression(stats)){const p=stats.properties.filter(ts.isPropertyAssignment).find(p=>p.name.getText(sf).replaceAll('"','')==='damageReduction')!;change(p.initializer,rootDr);}
   if(id.text==='cooldown-range-close'){const me=property('mechanicEffects')?.initializer;if(me&&ts.isObjectLiteralExpression(me)){const p=me.properties.filter(ts.isPropertyAssignment).find(p=>p.name.getText(sf).includes('recovery-active-pct'))!;change(p.initializer,.2);}}
  }
 }ts.forEachChild(n,visit);}visit(sf);for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);if(edits.length)writeFileSync(file,source.replace(/\r\n/g,'\n'));
}
