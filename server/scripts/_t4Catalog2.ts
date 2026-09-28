import * as S from '@mmo-idle/shared';
const A = S as any;
for (const [id, s] of A.STANCE_DATABASE) console.log('stance', id, '|', s.name, '| rp', s.runeCost, '| tier', s.tier, '|', JSON.stringify(s.modifiers ?? s.effects ?? {}).slice(0, 200));
for (const [id, r] of A.RITE_DATABASE) console.log('rite', id, '|', r.name, '| rp', r.runeCost ?? r.cost, '| tier', r.tier, '|', (r.description ?? '').slice(0, 140));
for (const [id, r] of A.RECIPE_DATABASE) if ((r.slot === 'core') && r.tier <= 2) console.log('core', id, r.tier, r.coreEligibility, JSON.stringify(A.ITEM_DATABASE.get(id)?.mechanicEffects));
