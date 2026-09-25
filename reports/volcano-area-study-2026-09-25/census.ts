import { writeFileSync } from 'node:fs';
import { MONSTER_DATABASE } from '../../shared/src/monsterDatabase';
import { BIOME_DATABASE } from '../../shared/src/biomeDatabase';

// Authoring arithmetic only: no combat ticks, movement, avoidance or build assumptions.
const rows = [3, 4].flatMap(tier => [...BIOME_DATABASE.values()].flatMap(b => {
  const pool = b.monsterPoolByTier[tier] ?? [];
  const ids = new Set(pool);
  for (const id of pool) {
    const p = MONSTER_DATABASE.get(id)?.pack;
    for (const f of [...(p?.followers ?? []), ...(p?.followerVariants ?? []).flat()]) ids.add(f.typeId);
  }
  return [...ids].map(id => {
    const m = MONSTER_DATABASE.get(id)!;
    return { tier, biome:b.id, id, name:m.name, ...m.stats,
      basicDps:m.stats.attack * 1000 / m.stats.attackCooldown,
      dot:m.dotEffect, elite:m.elite ?? false, abilities:m.monsterAbilities,
      pack:m.pack, density:b.mobDensity };
  });
}));
const packs = rows.filter(r => r.biome === 'volcanic' && r.pack?.role === 'alpha').flatMap(r => {
  return (r.pack!.followerVariants ?? [[]]).map((variant, i) => {
    const members = [{typeId:r.id,count:1}, ...(r.pack!.followers ?? []), ...variant];
    return { tier:r.tier, alpha:r.id, variant:i+1, members,
      count:members.reduce((n,m)=>n+m.count,0),
      hp:members.reduce((n,m)=>n+MONSTER_DATABASE.get(m.typeId)!.stats.hp*m.count,0),
      basicDps:members.reduce((n,m)=>{const s=MONSTER_DATABASE.get(m.typeId)!.stats; return n+s.attack*1000/s.attackCooldown*m.count;},0) };
  });
});
const heat = [0,5,10,20,25,40].map(stacks => {
  const effective = stacks <= 10 ? stacks : 10+5*Math.log1p((stacks-10)/5);
  return { stacks, earliestSeconds:stacks ? (stacks-1)*3 : 0,
    dealt:1+.03*effective, taken:1+.045*effective, candidateTaken:1+.035*effective };
});
writeFileSync(new URL('./census.json',import.meta.url), JSON.stringify({scope:'Static authoring arithmetic, not delivered DPS or live-player evidence',rows,packs,heat},null,2)+'\n');
console.log(JSON.stringify({comparisons:rows.filter(r=>['volcanic','tundra','jungle','desert'].includes(r.biome)).map(({tier,biome,name,hp,attack,attackCooldown,basicDps,dot})=>({tier,biome,name,hp,attack,attackCooldown,basicDps,dot})),packs,heat},null,2));
