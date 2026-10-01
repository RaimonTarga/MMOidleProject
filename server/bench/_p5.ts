import { LINEAGE_LANE_REFERENCES_T2, LINEAGE_LANE_PROFILES_T2, LINEAGE_FRAME_REFERENCES_T2, LINEAGE_FRAME_PROFILES_T2, ALL_LANE_REFERENCES } from '../../bot/src/tierEntry/profiles';
import { validateProfile, formatValidation } from '../../bot/src/tierEntry/validate';
import { globalMastery } from '@mmo-idle/shared';
let fails = 0;
for (const r of LINEAGE_LANE_REFERENCES_T2) {
  const p = LINEAGE_LANE_PROFILES_T2.get(r.profileId)!;
  const rep = validateProfile(p);
  if (!rep.pass) { fails++; console.log(formatValidation(r.profileId, rep)); }
}
for (const r of LINEAGE_FRAME_REFERENCES_T2) {
  const p = LINEAGE_FRAME_PROFILES_T2.get(r.profileId)!;
  const rep = validateProfile(p);
  if (!rep.pass) { fails++; console.log(formatValidation(r.profileId, rep)); }
}
console.log('band-2 validation failures:', fails, 'of', LINEAGE_LANE_REFERENCES_T2.length + LINEAGE_FRAME_REFERENCES_T2.length);
const s = LINEAGE_LANE_PROFILES_T2.get('lineage-rapier-tempo-t2')!;
console.log('\nsample lineage-rapier-tempo-t2:');
console.log(' equipment', JSON.stringify(s.equipment));
console.log(' upgrades', JSON.stringify(s.itemUpgrades));
console.log(' inventory', JSON.stringify(s.inventory));
console.log(' biomeLevels', JSON.stringify(s.biomeLevels), 'GM', globalMastery(s.biomeLevels));
console.log(' lineages', JSON.stringify(s.lineages));
console.log(' tier/skill', s.targetTier, s.currentSkillTier, s.skillPoints, s.spawnNodeId);
console.log('\nrows: lane', ALL_LANE_REFERENCES.length, 'frames', LINEAGE_FRAME_REFERENCES_T2.length * 2);
