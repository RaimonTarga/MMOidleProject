import { SKILL_TREE } from '@mmo-idle/shared';

const GUIDES: Record<string, { identity: string; defense: string; recovery: string }> = {
  'cadence-root': {
    identity: 'A sustained bruiser. Land a sequence of attacks to earn an empowered hit; your style sets the rhythm and payoff. Faster attacks move you through that cycle sooner.',
    defense: 'Extra health, plating and damage reduction support close combat. Large-hit protection reduces the excess damage of heavy blows.',
    recovery: 'A repeating pulse opens a window of in-combat Recovery. It scales with your Recovery stat and works even against a lone enemy; another pulse refreshes the window.',
  },
  'cooldown-root': {
    identity: 'A heavy fighter built around a timed empowered strike. Your style shapes the strike; the cooldown sets its rhythm. Powerful individual attacks come with slower attacks and movement.',
    defense: 'The largest root bonuses to health and plating, plus damage reduction. This is a durable chassis for absorbing repeated hits.',
    recovery: 'A share of your Recovery stays active throughout combat. It needs neither a kill nor a timed window, so it supports long fights.',
  },
  'reload-root': {
    identity: 'A burst fighter: spend ammunition, then reload before the next volley. Rapid shots retain 65% weapon Attack, while flat on-hit stays whole and weapon-reservoir damage retains 85%.',
    defense: 'Range and movement help maintain distance. Evasion offers a chance to avoid part of a hit; evade mitigation improves that protection. An evade is not automatically a full dodge.',
    recovery: 'Kills open a brief Recovery window. More kills refresh it rather than stack it. Stronger in packs; a lone boss offers fewer opportunities.',
  },
  'energy-root': {
    identity: 'A fast, fragile fighter that builds energy through attacks and spends a full charge on an empowered discharge. Your style changes the charge cycle and payoff.',
    defense: 'A barrier absorbs damage before health. Range and movement help protect this buffer; the root has little extra health and no plating bonus.',
    recovery: 'The barrier recharges after a damage-free interval; taking hits or damage over time interrupts that opportunity. Barrier recharge restores the barrier, not health. Seek space to recover between engagements.',
  },
  'dot-root': {
    identity: 'A damage-over-time specialist. Attacks build stacks that keep ticking after the hit. Your style determines the element and its behavior, so sustained pressure matters more than a single impact.',
    defense: 'Damage-over-time resistance reduces incoming ticks. Part of direct-hit damage becomes delayed debt: it softens the initial burst but still has to be paid. Moderate health and plating support this layered defense.',
    recovery: 'The root grants no special in-combat Recovery window. Use ordinary Recovery between fights and build additional sustain through later choices or equipment. Delayed damage is not healing.',
  },
  'summoner-root': {
    identity: 'A formation fighter whose persistent summons divide one shared offense and secondary-effect budget. Weapon and style shape their damage, cadence and formation without multiplying full-strength procs by body count.',
    defense: 'Survival depends on formation and summon interception more than the character’s own bulk.',
    recovery: 'Fallen summons rebuild one at a time at a health cost with a safety floor. Rebuilding the formation is separate from restoring your own health.',
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
    <small>These describe the root class. The selected node’s exact changes appear below; styles, paths and equipment can add or alter these mechanics.</small>
  </details>;
}
