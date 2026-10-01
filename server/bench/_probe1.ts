import { WORLD_NODE_LIST, WORLD_NODES, NODE_BIOMES, FAMILY_DATABASE, LINEAGE_DATABASE, PACKET_IDS, BIOME_DATABASE, nodeSpawnBlend, blendEntries } from '@mmo-idle/shared';
const byKey = new Map<string, string[]>();
for (const n of WORLD_NODE_LIST) {
  if (NODE_BIOMES[n.id]?.kind !== 'normal') continue;
  const k = `${n.biomeGroup}|T${n.biomeTier}`;
  (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(`${n.id}${n.blend ? '*' : ''}`);
}
console.log('--- normal nodes per (biome,tier); * = has authored blend');
for (const [k, v] of [...byKey].sort()) console.log(k.padEnd(16), v.length, v.slice(0,8).join(' '));
console.log('\n--- PACKET_IDS:', PACKET_IDS.join(', '));
console.log('\n--- weapon lineages and their lanes');
for (const l of LINEAGE_DATABASE.values()) if (l.slot === 'weapon') console.log(l.id.padEnd(12), l.homeBiome.padEnd(10), l.lanes.join(', '));
console.log('\n--- families, biome, drops/punishes, members fielded per tier');
for (const f of FAMILY_DATABASE.values()) {
  const pools = BIOME_DATABASE.get(f.biome)?.monsterPoolByTier ?? {};
  const per = Object.entries(pools).map(([t, pool]) => {
    const fielded = [...new Set((pool as string[]).filter(id => f.monsterIds.includes(id)))];
    return fielded.length ? `T${t}:[${fielded.join(',')}]` : '';
  }).filter(Boolean).join(' ');
  console.log(f.id.padEnd(22), f.biome.padEnd(10), `${f.drops}/${f.punishes}`.padEnd(26), per);
}
console.log('\n--- node record frozen?', Object.isFrozen(WORLD_NODES.get(WORLD_NODE_LIST[0].id)));
