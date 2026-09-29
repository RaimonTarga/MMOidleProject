/**
 * Every place the guided tutorial can point at is actually stamped in the
 * client (docs/guided-tutorial-plan.md, "Highlight layer"). The director only
 * names anchors through TUTORIAL_ANCHORS, so each key must appear as a
 * `data-tutorial-anchor={TUTORIAL_ANCHORS.<key>...}` somewhere in client/src.
 * An anchor nobody stamps is a ring that silently never shows.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TUTORIAL_ANCHORS } from '@mmo-idle/shared';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const clientSrc = path.resolve(here, '../../client/src');

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const stamped = new Set<string>();
const directorUses = new Set<string>();
for (const file of sources(clientSrc)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/data-tutorial-anchor=\{[^}]*?TUTORIAL_ANCHORS\.(\w+)/g)) stamped.add(match[1]);
  // Conditional stamps: `anchor={entry.tab === "runes" ? TUTORIAL_ANCHORS.menuRunes : ...}` on a nav button.
  for (const match of text.matchAll(/anchor=\{[\s\S]*?\}/g)) {
    for (const key of match[0].matchAll(/TUTORIAL_ANCHORS\.(\w+)/g)) stamped.add(key[1]);
  }
  if (file.includes(`${path.sep}tutorial${path.sep}`)) {
    for (const match of text.matchAll(/TUTORIAL_ANCHORS\.(\w+)/g)) directorUses.add(match[1]);
  }
}

for (const key of Object.keys(TUTORIAL_ANCHORS)) {
  assert(stamped.has(key), `TUTORIAL_ANCHORS.${key} is declared but no client element carries it`);
}
for (const key of directorUses) {
  assert(key in TUTORIAL_ANCHORS, `the director points at unknown anchor TUTORIAL_ANCHORS.${key}`);
}
assert(directorUses.size >= 10, 'the director should point at the anchors it declares');

console.log('tutorialAnchors: ok');
