import { DURABILITY12_MOVEMENT, DURABILITY12_SWARM } from './durability12Spec';

export const DURABILITY13_MOVEMENT_SEEDS = [173, 3911, 6151] as const;
export const DURABILITY13_SWARM_SEEDS = [3911, 6151, 8089] as const;
export const DURABILITY13_MOVEMENT = [
  ...DURABILITY12_MOVEMENT,
  ...DURABILITY12_SWARM.filter(c => c.tier === 3 && (
    (c.nodeId.endsWith('03') && c.className === 'spirit' && c.technique === 'sweep') ||
    (c.nodeId.endsWith('05') && c.className === 'squire'))),
].map(c => ({...c, id: c.id.replace('dur12', 'dur13-check')}));
export const DURABILITY13_SWARM = DURABILITY12_SWARM.filter(c => c.tier === 3)
  .map(c => ({...c, id: c.id.replace('dur12', 'dur13')}));
