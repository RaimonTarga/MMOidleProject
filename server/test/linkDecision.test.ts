import { decideDiscordLink } from '../src/auth/linkDecision';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(decideDiscordLink('guest', null, null) === 'stamp', 'unclaimed Discord should stamp');
assert(decideDiscordLink('guest', null, 'discord') === 'merge', 'claimed Discord should merge');
assert(
  decideDiscordLink('same', null, 'same') === 'already_linked',
  'self-target should be a no-op',
);
assert(
  decideDiscordLink('linked', 'discord-id', null) === 'already_linked',
  'an already-linked source should be a no-op',
);

console.log('linkDecision.test.ts: ok');
