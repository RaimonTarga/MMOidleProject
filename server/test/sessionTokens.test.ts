import {
  generateSessionToken,
  hashSessionToken,
  isPlausibleSessionToken,
} from '../src/auth/sessionRepo';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const first = generateSessionToken();
const second = generateSessionToken();

assert(isPlausibleSessionToken(first), 'generated token should pass shape validation');
assert(first !== second, 'generated tokens should not repeat');
assert(hashSessionToken(first) === hashSessionToken(first), 'token hash should be deterministic');
assert(hashSessionToken(first) !== first, 'stored token hash should not expose the token');
assert(hashSessionToken(first) !== hashSessionToken(second), 'distinct tokens should hash differently');
assert(!isPlausibleSessionToken(''), 'empty token should fail validation');
assert(!isPlausibleSessionToken('a'.repeat(42)), 'short token should fail validation');
assert(!isPlausibleSessionToken(`${'a'.repeat(42)}!`), 'invalid base64url characters should fail');

console.log('sessionTokens.test.ts: ok');
