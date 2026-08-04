import { generateGuestName, validateCharacterName } from './characters';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

for (let i = 0; i < 1_000; i += 1) {
  const value = (i + 0.5) / 1_000;
  const name = generateGuestName(() => value);
  assert(validateCharacterName(name).ok, `generated guest name should be valid: ${name}`);
  assert(name.split(' ').length === 2, `guest name should contain exactly two words: ${name}`);
}

assert(generateGuestName(() => 0) === 'Ancient Apparition', 'zero sample should be deterministic');

console.log('guestNames.test.ts: ok');
