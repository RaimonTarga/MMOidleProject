import { GuestCreationRateLimiter } from '../src/auth/guestAuth';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const limiter = new GuestCreationRateLimiter();
const now = 10_000_000;
for (let i = 0; i < 5; i += 1) {
  assert(limiter.allow('127.0.0.1', now + i), `attempt ${i + 1} should be allowed`);
}
assert(!limiter.allow('127.0.0.1', now + 5), 'sixth attempt in an hour should be refused');
assert(limiter.allow('127.0.0.2', now + 5), 'a separate IP should have a separate bucket');
assert(
  limiter.allow('127.0.0.1', now + 60 * 60 * 1_000 + 1),
  'an attempt should be allowed after the window elapses',
);

console.log('guestAuth.test.ts: ok');
