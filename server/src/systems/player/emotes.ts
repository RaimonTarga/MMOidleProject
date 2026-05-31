import type { EmoteId } from '@mmo-idle/shared';
import { EMOTE_DURATION_MS, isValidEmoteId } from '@mmo-idle/shared';
import type { World } from '../../world/World';
import type { PlayerEntity } from '../../ecs/entity';
import { attachComponent, detachComponent } from '../../ecs/markerHelpers';

export function applyPlayerEmote(
  world: World,
  player: PlayerEntity,
  emoteId: EmoteId,
  now: number,
): boolean {
  if (player.isDead) return false;
  if (player.hasEmote && player.hasEmote.expiresAt > now) return false;

  attachComponent(world, player, 'hasEmote', {
    emoteId,
    expiresAt: now + EMOTE_DURATION_MS,
  });
  return true;
}

export function updateExpiredEmotes(world: World, now: number): void {
  for (const player of world.playerEntities) {
    const emote = player.hasEmote;
    if (!emote) continue;
    if (now >= emote.expiresAt) {
      detachComponent(world, player, 'hasEmote');
    }
  }
}

export function handlePlayerEmoteIntent(
  world: World,
  player: PlayerEntity,
  emoteId: string,
  now: number,
): void {
  if (!isValidEmoteId(emoteId)) return;
  applyPlayerEmote(world, player, emoteId, now);
}
