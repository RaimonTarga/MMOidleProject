import {NIGHT4_SURVEY} from './night4Spec';
import {DURABILITY11_CELLS} from './durability11Spec';

// Replay both known failures plus cross-seed controls before the broader screen.
export const DURABILITY12_MOVEMENT_SEEDS = [173,3911] as const;
export const DURABILITY12_SEEDS = [3911,6151,8089] as const;
export const DURABILITY12_MOVEMENT = DURABILITY11_CELLS.filter(c=>c.tier===3&&c.nodeId.endsWith('05')&&
  ((c.role==='swamp'&&c.className==='striker')||(c.role==='jungle'&&c.className==='squire')))
  .map(c=>({...c,id:c.id.replace('dur11','dur12-movement')}));
// Same-seed ability comparison on current numbers; no HP/attack overlays.
export const DURABILITY12_SWARM = NIGHT4_SURVEY.filter(c=>['plains','volcanic'].includes(c.role))
  .flatMap(c=>(['sweep','slam'] as const).map(technique=>({...c,
    id:c.id.replace('night4-survey','dur12-swarm')+'-'+technique,technique})));
