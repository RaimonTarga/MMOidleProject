export type DiscordLinkDecision = 'stamp' | 'merge' | 'already_linked';

export function decideDiscordLink(
  sourceAccountId: string,
  sourceDiscordId: string | null,
  targetAccountId: string | null,
): DiscordLinkDecision {
  if (sourceDiscordId !== null) return 'already_linked';
  if (targetAccountId === null) return 'stamp';
  return targetAccountId === sourceAccountId ? 'already_linked' : 'merge';
}
