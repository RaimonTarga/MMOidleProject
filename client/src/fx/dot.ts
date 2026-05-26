import type { PlayerView } from '@mmo-idle/shared';

export type DotPath = 'poison' | 'fire' | 'frost';

export function getDotPath(player: PlayerView): DotPath {
  const p = player.passives;
  if ((p['dot.fan-the-flames'] ?? 0) > 0 || (p['dot.smoldering-ember'] ?? 0) > 0 || (p['dot.conflagration'] ?? 0) > 0) return 'fire';
  if ((p['dot.permafrost'] ?? 0) > 0 || (p['dot.freezing-cold'] ?? 0) > 0 || (p['dot.glacial-fracture'] ?? 0) > 0) return 'frost';
  if ((p['dot.poison-explosion'] ?? 0) > 0 || (p['dot.eternal-doom'] ?? 0) > 0 || (p['dot.invigorating-toxins'] ?? 0) > 0) return 'poison';
  if (player.selectedSubVariant === 'balanced') return 'fire';
  if (player.selectedSubVariant === 'heavy') return 'frost';
  return 'poison';
}
