import { dotElementForPlayer, type DotPathElement, type PlayerView } from '@mmo-idle/shared';

export type DotPath = DotPathElement;

export function getDotPath(player: PlayerView): DotPath {
  return dotElementForPlayer(player.passives, player.selectedSubVariant);
}
