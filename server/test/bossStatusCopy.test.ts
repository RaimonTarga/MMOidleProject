/**
 * Boss copy coverage (playtest 2026-09-27: phases and boss statuses read as
 * generic text). Every announced phase carries an authored description, and every
 * boss stat-buff, cast announcement and boss DoT has authored tooltip copy.
 */
import { MONSTER_DATABASE, monsterDotStatusEffectId, type BossAction } from '@mmo-idle/shared';
import { bossEffectHelp, monsterDotHelp } from '../../client/src/hud/statusHelp';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const problems: string[] = [];
const walkActions = (bossId: string, actions: readonly BossAction[]): void => {
  for (const action of actions) {
    if (action.type === 'stat-buff' && action.label && !bossEffectHelp(action.label)) {
      problems.push(`${bossId}: stat-buff "${action.label}" has no boss-effect copy`);
    }
    if (action.type === 'room-affliction' && !monsterDotHelp(monsterDotStatusEffectId(action.dot.debuffId))) {
      problems.push(`${bossId}: room DoT "${action.dot.debuffId}" has no copy`);
    }
    if (action.type === 'cast') walkActions(bossId, action.actions);
  }
};

for (const def of MONSTER_DATABASE.values()) {
  if (!def.isBoss || def.id.includes('void')) continue;
  for (const phase of def.bossScript?.phases ?? []) {
    if (phase.name && !phase.description) problems.push(`${def.id}: phase "${phase.name}" has no description`);
    walkActions(def.id, phase.actions);
  }
  for (const repeating of def.bossScript?.repeating ?? []) walkActions(def.id, repeating.actions);
  if (def.dotEffect?.debuffId && !monsterDotHelp(monsterDotStatusEffectId(def.dotEffect.debuffId))) {
    problems.push(`${def.id}: DoT "${def.dotEffect.debuffId}" has no copy`);
  }
  for (const pattern of [def.bossPattern, ...(def.bossPatternVariants ?? [])]) {
    for (const step of pattern?.steps ?? []) {
      if (step.kind === 'cast' && step.announce && !bossEffectHelp(step.announce)) {
        problems.push(`${def.id}: cast announcement "${step.announce}" has no copy`);
      }
      if (step.kind === 'payoff' && step.onHitPoison
        && !monsterDotHelp(monsterDotStatusEffectId(step.name.toLowerCase().replace(/\s+/g, '-')))) {
        problems.push(`${def.id}: "${step.name}" poison has no copy`);
      }
    }
  }
}

assert(problems.length === 0, `boss copy gaps:\n  ${problems.join('\n  ')}`);
console.log('bossStatusCopy: ok');
