function generateUUID(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Fallback for non-secure HTTP contexts (LAN play without HTTPS)
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => {
    const n = parseInt(c);
    return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
  });
}

function getOrPrompt(key: string, promptText: string, fallback: string): string {
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const value = (window.prompt(promptText) ?? '').trim() || fallback;
  localStorage.setItem(key, value);
  return value;
}

export const accountId: string = (() => {
  let id = localStorage.getItem('mmo_account_id');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('mmo_account_id', id);
  }
  return id;
})();

export const displayName: string = getOrPrompt(
  'mmo_display_name',
  'Enter your player name:',
  `Hero_${accountId.slice(0, 5)}`,
);
