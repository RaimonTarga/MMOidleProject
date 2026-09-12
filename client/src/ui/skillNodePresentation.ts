import type { SkillNode } from '@mmo-idle/shared';
import { CONDUIT_ENABLED } from '../featureFlags';

// Conduit (summoner) is hidden from players this playtest: its orb stays visible
// but reads as unavailable, with the description below replacing its flavor text.
export const CONDUIT_BLOCKED_DESC = 'In development — not available this playtest.';

export function isBlockedConduit(node: SkillNode): boolean {
  return node.id === 'summoner-root' && !CONDUIT_ENABLED;
}

export function isPlaceholder(node: SkillNode): boolean {
  return node.description.startsWith('[Placeholder]');
}

export function nodeName(node: SkillNode): string {
  return isPlaceholder(node) ? node.name.replace(/\[T(\d+)\] Option/, 'Tier $1 · Choice') : node.name;
}

export function nodeDescription(node: SkillNode): string {
  if (isBlockedConduit(node)) return CONDUIT_BLOCKED_DESC;
  return isPlaceholder(node) ? 'This branch is still in development and currently grants no effects.' : node.description;
}

