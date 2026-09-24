import { planAcquisition, obtainSteps } from './t2Acquisition';
import { TIER_ENTRY_PROFILES, t2EntryProfileId } from '../tierEntry/profiles';
function assert(value: unknown, message: string): asserts value { if (!value) throw Error(message); }
const profile = structuredClone(TIER_ENTRY_PROFILES.get(t2EntryProfileId('cadence-root','clean'))!);
const plan = planAcquisition(profile,'plains-charm-t2');
assert(plan.path==='upgrade-then-evolve', 'owned +2 charm must use the cheaper eligible top-up');
const steps = obtainSteps('plains',plan);
assert(steps.some(s=>s.type==='upgrade'&&s.definitionId==='plains-charm-t1'&&s.toPlus===3), 'top-up must precede evolution');
assert(steps.at(-1)?.type==='evolveItem', 'top-up must end in an actual evolution');
const missing = structuredClone(profile);
missing.inventory = missing.inventory.filter(id=>id!=='plains-charm-t1');
if(missing.equipment.recovery==='plains-charm-t1') missing.equipment.recovery=null;
assert(planAcquisition(missing,'plains-charm-t2').path==='reconstruct', 'no top-up when predecessor is not actually owned');
const gated = structuredClone(profile); gated.biomeLevels={};
assert(planAcquisition(gated,'plains-charm-t2').path==='reconstruct', 'do not assume unavailable mastery to justify cheap path');
const equipped = structuredClone(profile);equipped.inventory=equipped.inventory.filter(id=>id!=='plains-charm-t1');equipped.equipment.recovery='plains-charm-t1';
assert(planAcquisition(equipped,'plains-charm-t2').path==='upgrade-then-evolve', 'equipped predecessors are eligible in production');
console.log('t2Acquisition: ok');
