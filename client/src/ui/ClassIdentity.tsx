import { SKILL_TREE } from '@mmo-idle/shared';

/**
 * The class screen's "Class foundation" box. PLACEHOLDER copy (overnight 2026-10-16), condensed
 * from the class-first bible's core mechanic and defense sections (§7-§12, x.2 and x.10) in
 * place of the pre-rework root text; the designer owns the final wording.
 */
const GUIDES: Record<string, { identity: string; defense: string; recovery: string }> = {
  'cadence-root': {
    identity: 'The combo fighter. Your combo is a short loop of beats ending in a heavy finisher; the Order sets what each beat does, and every boss you beat hands you a new finisher.',
    defense: 'Your armor and charm carry your defense, and some T4 picks add resilience. Nothing defensive rides on your hits or your finisher.',
    recovery: 'A small share of your Recovery stays on while you fight; some gear lines multiply it.',
  },
  'cooldown-root': {
    identity: 'The shield that hits back. Hard hits, enemies pressing you and every blow you answer fill your Resolve; your Response rules spend it to answer what the enemy does, and a full bar fires your slam.',
    defense: 'Your responses are your guards: each answers one enemy action, costs Resolve and refunds it when it lands. Resolve never absorbs damage by itself; your armor and charm carry the baseline.',
    recovery: 'A small share of your Recovery stays on while you fight; the Cave charm line Old Guard adds to it.',
  },
  'reload-root': {
    identity: 'The gunslinger. You fire a clip at your gun\'s own fire rate, then reload standing still. Your Loadout picks the clip type at each reload, and the last round of every clip is your boss trophy.',
    defense: 'The stationary reload is your risk window; your armor\'s "while reloading" lines and your charm cover it. Keep Distance decides where you stand.',
    recovery: 'A small share of your Recovery stays on while you fight. Nothing heals or shields you per reload.',
  },
  'energy-root': {
    identity: 'The storm in a bottle. One bar is both your damage and your shield: a steady flow fills it, your spends let it loose, and your Thresholds decide when.',
    defense: 'Hits on you drain the storm before your HP, damage over time included, so heavy pressure wins if you spend too freely. Armor lines change what the storm absorbs.',
    recovery: 'A small share of your Recovery stays on while you fight; your charm\'s lines add to the storm\'s flow in certain states.',
  },
  'dot-root': {
    identity: 'The chain reaction. Your hits lay sigils that tick on the enemy, built by your weapon; your Payoff rules spend them at the right moment: detonate, spread, numb, siphon. Your discipline gives them an element.',
    defense: 'Siphon spends a target\'s sigils to heal you, and your armor buys you time. Your charm\'s lines answer what the affliction gives back.',
    recovery: 'A small share of your Recovery stays on while you fight.',
  },
  'summoner-root': {
    identity: 'The commander. You never strike: you field summons within your Command, set their rows and orders in your Formation, and rebuild the fallen one at a time with your own HP. Every boss you beat gives you its Soul.',
    defense: 'Your tank\'s taunt is your defense against bosses, which go for you first. Rebuilds cost HP but never take you below a safety floor; your armor decides who tanks.',
    recovery: 'A small share of your Recovery stays on while you fight. Rebuilding the formation is separate from restoring your own health.',
  },
};

export function ClassIdentity({ classId, expanded }: { classId: string; expanded: boolean }) {
  const guide = GUIDES[classId];
  if (!guide) return null;
  return <details className="skill-class-guide" open={expanded}>
    <summary>{SKILL_TREE.get(classId)?.name} · Class foundation</summary>
    <p><strong>Combat identity</strong>{guide.identity}</p>
    <p><strong>Defensive layers</strong>{guide.defense}</p>
    <p><strong>Recovery</strong>{guide.recovery}</p>
    <small>These describe the class. The selected node’s exact changes appear below; disciplines, specializations and equipment add to them.</small>
  </details>;
}
